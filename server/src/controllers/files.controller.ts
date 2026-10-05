import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { googleDriveService } from '../services/gdrive/gdrive.service';
import db from '../db/database';
import fs from 'fs';
import path from 'path';

export const listRawFiles = (req: AuthenticatedRequest, res: Response) => {
  try {
    let query = `
      SELECT 
        sf.id,
        sf.file_name,
        sf.mime_type,
        sf.file_size,
        sf.file_hash,
        sf.period_year,
        sf.period_month,
        sf.upload_date,
        sf.processing_status,
        sf.google_drive_file_id,
        sf.google_drive_folder_id,
        sf.google_drive_web_link,
        u.full_name as uploader_name,
        u.username as uploader_username,
        ub.total_records,
        ub.valid_records
      FROM source_files sf
      LEFT JOIN users u ON sf.uploaded_by = u.id
      LEFT JOIN upload_batches ub ON ub.source_file_id = sf.id
    `;
    const params: any[] = [];
    if (req.tenantId) {
      query += ` WHERE sf.uploaded_by = ? `;
      params.push(req.tenantId);
    }
    query += ` ORDER BY sf.upload_date DESC`;

    const files = db.prepare(query).all(...params);
    return res.json({ files });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil daftar file mentah.' });
  }
};

export const downloadRawFile = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const file = db.prepare('SELECT * FROM source_files WHERE id = ?').get(id) as any;

    if (!file) {
      return res.status(404).json({ error: 'File tidak ditemukan dalam sistem.' });
    }

    const isSuperAdmin = req.user?.role === 'superadmin' || req.user?.role === 'SUPER_ADMIN';
    if (!isSuperAdmin && req.tenantId && file.uploaded_by !== req.tenantId) {
      return res.status(403).json({ error: 'Akses ditolak. File ini milik akun tenant lain.' });
    }

    if (file.storage_path && fs.existsSync(file.storage_path)) {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.file_name)}"`);
      res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
      return fs.createReadStream(file.storage_path).pipe(res);
    }

    // Fallback: If Google Drive link exists, redirect
    if (file.google_drive_web_link) {
      return res.redirect(file.google_drive_web_link);
    }

    return res.status(404).json({ error: 'Berkas fisik file tidak ditemukan pada server mirror.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengunduh file mentah.' });
  }
};

export const deleteRawFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const file = db.prepare('SELECT * FROM source_files WHERE id = ?').get(id) as any;

    if (!file) {
      return res.status(404).json({ error: 'File tidak ditemukan dalam sistem.' });
    }

    // Strictly Superadmin Only
    const cleanUserRole = (req.user?.role || '').toLowerCase().replace(/[-_]/g, '');
    if (cleanUserRole !== 'superadmin') {
      return res.status(403).json({
        error: 'Akses ditolak. Hanya Superadmin yang berwenang menghapus file dan membersihkan database terkait.'
      });
    }

    // 1. Gather linked examination IDs and patient IDs
    const exams = db.prepare('SELECT id, patient_id FROM examinations WHERE source_file_id = ?').all(id) as any[];
    const examIds = exams.map(e => e.id);
    const patientIds = Array.from(new Set(exams.map(e => e.patient_id).filter(Boolean)));

    // Execute atomic cascading deletion
    const deleteTx = db.transaction(() => {
      // Delete TAT records and lab results
      if (examIds.length > 0) {
        const placeholders = examIds.map(() => '?').join(',');
        db.prepare(`DELETE FROM tat_records WHERE examination_id IN (${placeholders})`).run(...examIds);
        db.prepare(`DELETE FROM laboratory_results WHERE examination_id IN (${placeholders})`).run(...examIds);
      }

      // Delete examinations
      db.prepare('DELETE FROM examinations WHERE source_file_id = ?').run(id);

      // Clean up orphaned patients (patients with no remaining examinations)
      for (const patId of patientIds) {
        const remaining = db.prepare('SELECT COUNT(*) as count FROM examinations WHERE patient_id = ?').get(patId) as any;
        if (!remaining || remaining.count === 0) {
          db.prepare('DELETE FROM patients WHERE id = ?').run(patId);
        }
      }

      // Delete validation errors & batches
      const batches = db.prepare('SELECT id FROM upload_batches WHERE source_file_id = ?').all(id) as any[];
      for (const b of batches) {
        db.prepare('DELETE FROM validation_errors WHERE batch_id = ?').run(b.id);
      }
      db.prepare('DELETE FROM upload_batches WHERE source_file_id = ?').run(id);

      // Delete source file record
      db.prepare('DELETE FROM source_files WHERE id = ?').run(id);

      // Audit trail record
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, user_name, action, resource_type, resource_id, details)
        VALUES (?, ?, ?, 'DELETE_FILE_AND_DATA', 'source_files', ?, ?)
      `).run(
        `audit-${Date.now()}`,
        req.user?.id || 'usr-admin',
        req.user?.fullName || 'Superadmin',
        id,
        JSON.stringify({
          fileName: file.file_name,
          deletedExaminationsCount: exams.length,
          cleanedPatientsCount: patientIds.length
        })
      );
    });

    deleteTx();

    // 2. Delete physical storage mirror and remote Google Drive file
    await googleDriveService.deleteFile(file.google_drive_file_id, file.storage_path);

    return res.json({
      status: 'SUCCESS',
      message: `File "${file.file_name}" beserta seluruh data pasien, pemeriksaan, dan TAT terkait berhasil dihapus bersih dari sistem dan Google Drive.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Gagal menghapus file: ${err.message}` });
  }
};
