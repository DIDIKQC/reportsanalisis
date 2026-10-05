import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { excelParser } from '../services/parser/excel.parser';
import { smartColumnMapper } from '../services/parser/mapper';
import { ingestService } from '../services/parser/ingest.service';
import db from '../db/database';
import path from 'path';

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
      return res.json({
        tempFileId: path.basename(filePath),
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        isPDF: true,
        message: 'File PDF terdeteksi. Sistem siap melakukan ekstraksi terstruktur otomatis.'
      });
    }
  } catch (err: any) {
    return res.status(400).json({
      error: `File tidak dapat diproses: ${err.message}. Periksa format kolom dan lembar kerja Anda.`
    });
  }
};

export const confirmImport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tempFileId, originalFileName, mimeType, customMapping, sheetName, duplicateAction } = req.body;
    if (!tempFileId) {
      return res.status(400).json({ error: 'tempFileId wajib disertakan.' });
    }

    const uploadDir = path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR || './storage', 'uploads');
    const fullTempPath = path.join(uploadDir, tempFileId);

    const result = await ingestService.processUpload({
      tempFilePath: fullTempPath,
      originalFileName: originalFileName || tempFileId,
      mimeType: mimeType || 'application/octet-stream',
      uploadedBy: req.user?.id || 'usr-adminlab',
      customMapping,
      sheetName,
      duplicateAction: duplicateAction || 'SKIP'
    });

    return res.json(result);
  } catch (err: any) {
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
