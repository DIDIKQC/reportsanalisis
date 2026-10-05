import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { excelParser } from '../services/parser/excel.parser';
import { pdfParser } from '../services/parser/pdf.parser';
import { smartColumnMapper } from '../services/parser/mapper';
import { ingestService } from '../services/parser/ingest.service';
import db from '../db/database';
import path from 'path';
import fs from 'fs';

export const previewUpload = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const isExcel = ext === '.xlsx' || ext === '.xls' || ext === '.csv';

    if (isExcel) {
      const preview = excelParser.previewWorkbook(filePath);
      const mapping = await smartColumnMapper.mapHeaders(
        preview.headers,
        preview.sampleRecords.map(r => r.rawRecord)
      );

      return res.json({
        tempFileId: path.basename(filePath),
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        sheets: preview.sheets,
        activeSheet: preview.activeSheet,
        totalRows: preview.totalRows,
        headers: preview.headers,
        mapping,
        sampleRecords: preview.sampleRecords
      });
    } else {
      // PDF File preview
      const preview = await pdfParser.previewLaboratoryPDF(filePath);
      return res.json({
        tempFileId: path.basename(filePath),
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        isPDF: true,
        sheets: [`Dokumen PDF (${preview.totalPages} Halaman)`],
        activeSheet: 'Dokumen PDF',
        totalRows: preview.totalRows,
        headers: preview.headers,
        mapping: preview.mapping,
        sampleRecords: preview.sampleRecords,
        message: 'File PDF terdeteksi. Sistem berhasil membaca struktur data laporan.'
      });
    }
  } catch (err: any) {
    console.error('previewUpload error:', err);
    return res.status(400).json({
      error: `File tidak dapat diproses: ${err.message}. Periksa format kolom dan lembar kerja Anda.`
    });
  }
};

export const confirmImport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tempFileId, originalFileName, mimeType, customMapping, sheetName, duplicateAction } = req.body;

    let fullTempPath = '';

    // 1. Check if file was sent directly via multipart form
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fullTempPath = req.file.path;
    } else if (tempFileId) {
      // 2. Search all potential storage paths
      const isVercel = !!process.env.VERCEL;
      const candidates = [
        path.resolve(isVercel ? '/tmp/storage/uploads' : (process.env.STORAGE_LOCAL_DIR ? path.resolve(process.env.STORAGE_LOCAL_DIR, 'uploads') : './storage/uploads'), tempFileId),
        path.resolve('/tmp/storage/uploads', tempFileId),
        path.resolve(process.cwd(), './storage/uploads', tempFileId),
        path.resolve(process.cwd(), '../server/storage/uploads', tempFileId),
        path.resolve(process.cwd(), 'uploads', tempFileId)
      ];

      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          fullTempPath = cand;
          break;
        }
      }
    }

    if (!fullTempPath || !fs.existsSync(fullTempPath)) {
      return res.status(400).json({
        error: `Berkas file sementara '${tempFileId || ''}' tidak ditemukan di server. Silakan pilih kembali file untuk diunggah ulang.`
      });
    }

    let parsedCustomMapping = customMapping;
    if (typeof customMapping === 'string') {
      try {
        parsedCustomMapping = JSON.parse(customMapping);
      } catch {
        parsedCustomMapping = undefined;
      }
    }

    const result = await ingestService.processUpload({
      tempFilePath: fullTempPath,
      originalFileName: originalFileName || (req.file ? req.file.originalname : tempFileId),
      mimeType: mimeType || (req.file ? req.file.mimetype : 'application/octet-stream'),
      uploadedBy: req.user?.id || 'usr-adminlab',
      customMapping: parsedCustomMapping,
      sheetName,
      duplicateAction: duplicateAction || 'SKIP'
    });

    return res.json(result);
  } catch (err: any) {
    console.error('confirmImport error:', err);
    return res.status(500).json({
      error: `Gagal mengimpor data ke database: ${err.message}`
    });
  }
};

export const getUploadHistory = (req: AuthenticatedRequest, res: Response) => {
  try {
    let query = `
      SELECT 
        ub.id as batch_id,
        sf.id as file_id,
        sf.file_name,
        sf.file_size,
        sf.mime_type,
        sf.period_year,
        sf.upload_date,
        u.full_name as uploaded_by,
        ub.total_records,
        ub.valid_records,
        ub.warning_records,
        ub.error_records,
        ub.duplicate_records,
        ub.status as batch_status,
        sf.google_drive_file_id,
        sf.google_drive_web_link
      FROM upload_batches ub
      JOIN source_files sf ON ub.source_file_id = sf.id
      LEFT JOIN users u ON sf.uploaded_by = u.id
    `;
    const params: any[] = [];
    if (req.tenantId) {
      query += ` WHERE sf.uploaded_by = ? `;
      params.push(req.tenantId);
    }
    query += ` ORDER BY ub.created_at DESC `;

    const rows = db.prepare(query).all(...params);
    return res.json({ history: rows });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil riwayat upload.' });
  }
};

export const getBatchErrors = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { batchId } = req.params;
    const errors = db.prepare(`
      SELECT * FROM validation_errors
      WHERE batch_id = ?
      ORDER BY row_number ASC
    `).all(batchId);

    return res.json({ errors });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil daftar kesalahan validasi.' });
  }
};
