import db from '../../db/database';
import crypto from 'crypto';
import { googleDriveService, GDriveUploadResult } from '../gdrive/gdrive.service';
import { excelParser, ParsedPatientRecord } from './excel.parser';
import { pdfParser } from './pdf.parser';

export interface IngestOptions {
  tempFilePath: string;
  originalFileName: string;
  mimeType: string;
  uploadedBy: string;
  duplicateAction?: 'SKIP' | 'REPLACE' | 'IMPORT_NEW';
  customMapping?: Record<string, string>;
  sheetName?: string;
}

export interface IngestResult {
  sourceFileId: string;
  batchId: string;
  fileName: string;
  fileHash: string;
  googleDriveFileId: string;
  googleDriveFolderId: string;
  totalRecords: number;
  validRecords: number;
  warningRecords: number;
  errorRecords: number;
  duplicateRecords: number;
  status: 'SUCCESS' | 'DUPLICATE_FOUND' | 'ERROR';
  message: string;
  isDuplicateFile?: boolean;
}

export class IngestService {
  public async processUpload(options: IngestOptions): Promise<IngestResult> {
    const fileHash = googleDriveService.calculateHash(options.tempFilePath);

    // Step 1: Check if file hash already exists
    const existingFile = db.prepare('SELECT * FROM source_files WHERE file_hash = ?').get(fileHash) as any;
    if (existingFile && (!options.duplicateAction || options.duplicateAction === 'SKIP')) {
      return {
        sourceFileId: existingFile.id,
        batchId: '',
        fileName: existingFile.file_name,
        fileHash: existingFile.file_hash,
        googleDriveFileId: existingFile.google_drive_file_id,
        googleDriveFolderId: existingFile.google_drive_folder_id,
        totalRecords: 0,
        validRecords: 0,
        warningRecords: 0,
        errorRecords: 0,
        duplicateRecords: 0,
        status: 'DUPLICATE_FOUND',
        message: 'File sudah pernah diproses sebelumnya. Pilih opsi Replace atau Import Versi Baru jika ingin memproses ulang.',
        isDuplicateFile: true
      };
    }

    // Step 2: Upload to Google Drive and Local Storage Mirror
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const driveResult: GDriveUploadResult = await googleDriveService.uploadRawFile(
      options.tempFilePath,
      options.originalFileName,
      options.mimeType,
      currentYear,
      currentMonth
    );

    const sourceFileId = existingFile && options.duplicateAction === 'REPLACE' ? existingFile.id : `file-${crypto.randomUUID()}`;

    if (existingFile && options.duplicateAction === 'REPLACE') {
      // Clean up previous records for this file
      const oldExams = db.prepare('SELECT id FROM examinations WHERE source_file_id = ?').all(existingFile.id) as any[];
      if (oldExams.length > 0) {
        const examIds = oldExams.map(e => `'${e.id}'`).join(',');
        db.prepare(`DELETE FROM laboratory_results WHERE examination_id IN (${examIds})`).run();
        db.prepare(`DELETE FROM tat_records WHERE examination_id IN (${examIds})`).run();
      }
      db.prepare('DELETE FROM examinations WHERE source_file_id = ?').run(existingFile.id);
      db.prepare('DELETE FROM upload_batches WHERE source_file_id = ?').run(existingFile.id);
      db.prepare(`
        UPDATE source_files 
        SET upload_date = CURRENT_TIMESTAMP, processing_status = 'PROCESSING'
        WHERE id = ?
      `).run(existingFile.id);
    } else {
      db.prepare(`
        INSERT INTO source_files (
          id, google_drive_file_id, google_drive_folder_id, google_drive_web_link,
          file_name, stored_file_name, mime_type, file_size, file_hash,
          period_year, period_month, uploaded_by, processing_status, storage_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROCESSING', ?)
      `).run(
        sourceFileId,
        driveResult.googleDriveFileId,
        driveResult.googleDriveFolderId,
        driveResult.webViewLink,
        options.originalFileName,
        driveResult.fileName,
        options.mimeType,
        driveResult.fileSize,
        driveResult.fileHash,
        currentYear,
        currentMonth,
        options.uploadedBy,
        driveResult.localStoragePath
      );
    }

    // Dual-sync metadata to Supabase PostgreSQL if connected
    try {
      const { query } = require('../../db/postgres');
      query(`
        INSERT INTO source_files (
          id, google_drive_file_id, google_drive_folder_id, google_drive_web_link,
          file_name, stored_file_name, mime_type, file_size, file_hash,
          period_year, period_month, uploaded_by, processing_status, storage_path
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'COMPLETED', $13)
        ON CONFLICT (id) DO UPDATE SET
          google_drive_file_id = EXCLUDED.google_drive_file_id,
          google_drive_web_link = EXCLUDED.google_drive_web_link,
          processing_status = EXCLUDED.processing_status
      `, [
        sourceFileId,
        driveResult.googleDriveFileId,
        driveResult.googleDriveFolderId,
        driveResult.webViewLink,
        options.originalFileName,
        driveResult.fileName,
        options.mimeType,
        driveResult.fileSize,
        driveResult.fileHash,
        currentYear,
        currentMonth,
        options.uploadedBy,
        driveResult.localStoragePath
      ]).catch((err: any) => console.warn('Supabase source_files sync warning:', err.message));
    } catch {}

    // Step 3: Parse Records
    let records: ParsedPatientRecord[] = [];
    const isPDF = options.originalFileName.toLowerCase().endsWith('.pdf') || options.mimeType.includes('pdf');

    try {
      if (isPDF) {
        records = await pdfParser.parseLaboratoryPDF(options.tempFilePath);
      } else {
        records = excelParser.parseFile(options.tempFilePath, options.customMapping, options.sheetName);
      }
    } catch (parseErr: any) {
      db.prepare(`UPDATE source_files SET processing_status = 'FAILED', error_message = ? WHERE id = ?`).run(
        parseErr.message,
        sourceFileId
      );
      throw parseErr;
    }

    // Detect period year and month from records if possible
    let detectedYear = currentYear;
    let detectedMonth = currentMonth;
    const sampleRecord = records.find(r => r.orderDate && r.orderDate.length >= 4);
    if (sampleRecord) {
      const y = parseInt(sampleRecord.orderDate.substring(0, 4), 10);
      if (!isNaN(y) && y >= 2000 && y <= 2100) {
        detectedYear = y;
        const m = parseInt(sampleRecord.orderDate.substring(5, 7), 10);
        if (!isNaN(m) && m >= 1 && m <= 12) {
          detectedMonth = m;
        }
      }
    }

    // Step 4: Batch Validation & Database Insertion
    const batchId = `batch-${crypto.randomUUID()}`;
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;

    const insertBatch = db.prepare(`
      INSERT INTO upload_batches (
        id, source_file_id, total_records, valid_records,
        warning_records, error_records, duplicate_records, status
      ) VALUES (?, ?, ?, 0, 0, 0, 0, 'PROCESSING')
    `);
    insertBatch.run(batchId, sourceFileId, records.length);

    const insertPatient = db.prepare(`
      INSERT INTO patients (id, user_id, medical_record_number, name, gender, age, age_unit)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, age=excluded.age, user_id=coalesce(excluded.user_id, patients.user_id)
    `);

    const insertExam = db.prepare(`
      INSERT INTO examinations (
        id, user_id, patient_id, source_file_id, batch_id, registration_number,
        order_date, registration_datetime, unit_name, unit_type, guarantor, doctor_name, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED')
    `);

    const insertLabResult = db.prepare(`
      INSERT INTO laboratory_results (
        id, examination_id, test_name, category, result_value, flag
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertTAT = db.prepare(`
      INSERT INTO tat_records (
        id, examination_id, category, service_type, start_time, end_time,
        duration_minutes, target_minutes, is_compliant
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertValidationError = db.prepare(`
      INSERT INTO validation_errors (
        id, batch_id, row_number, column_name, error_type, error_message, raw_value
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Master TAT targets
    const tatTargets = db.prepare('SELECT * FROM master_tat_targets').all() as any[];

    const runImport = db.transaction(() => {
      for (const rec of records) {
        if (rec.validationErrors.length > 0) {
          errorCount++;
          for (const err of rec.validationErrors) {
            insertValidationError.run(`err-${crypto.randomUUID()}`, batchId, rec.rowNumber, 'GENERAL', 'VALIDATION_FAILED', err, JSON.stringify(rec.rawRecord));
          }
          continue;
        }

        validCount++;
        const patientId = `pat-${rec.medicalRecordNumber}`;
        insertPatient.run(patientId, options.uploadedBy, rec.medicalRecordNumber, rec.patientName, rec.gender, rec.age, rec.ageUnit);

        const examId = `exam-${crypto.randomUUID()}`;
        const regDateTime = `${rec.orderDate} 08:30:00`;
        const regNumber = rec.registrationNumber || `REG-${rec.rowNumber}`;

        insertExam.run(
          examId,
          options.uploadedBy,
          patientId,
          sourceFileId,
          batchId,
          regNumber,
          rec.orderDate,
          regDateTime,
          rec.originUnit,
          rec.unitType,
          rec.guarantor,
          rec.doctorName || null
        );

        // Insert results
        for (const test of rec.tests) {
          const resultId = `res-${crypto.randomUUID()}`;
          const isCritical = test.name.toLowerCase().includes('nilai kritis') || false;
          insertLabResult.run(resultId, examId, test.name, test.category, 'Hasil Terverifikasi', isCritical ? 'CRITICAL' : 'NORMAL');
        }

        // Insert TAT only if the uploaded file explicitly has a TAT column
        if (rec.tatMinutes !== undefined && rec.tatMinutes !== null && !isNaN(rec.tatMinutes)) {
          const primaryCategory = rec.tests[0]?.category || 'Hematologi';
          const serviceType = rec.unitType === 'IGD' ? 'CITO' : (rec.guarantor.includes('CITO') ? 'CITO' : 'REGULER');
          const target = tatTargets.find(t => t.category === primaryCategory && t.service_type === serviceType) || { target_minutes: serviceType === 'CITO' ? 30 : 60 };
          const isCompliant = rec.tatMinutes <= target.target_minutes;

          insertTAT.run(
            `tat-${crypto.randomUUID()}`,
            examId,
            primaryCategory,
            serviceType,
            rec.sampleTakenDatetime || `${rec.orderDate} 08:30:00`,
            rec.resultCompletedDatetime || `${rec.orderDate} 09:30:00`,
            rec.tatMinutes,
            target.target_minutes,
            isCompliant ? 1 : 0
          );
        }
      }

      // Update batch and source file status
      db.prepare(`
        UPDATE upload_batches 
        SET valid_records = ?, warning_records = ?, error_records = ?, duplicate_records = ?, status = 'COMPLETED'
        WHERE id = ?
      `).run(validCount, warningCount, errorCount, duplicateCount, batchId);

      db.prepare(`
        UPDATE source_files 
        SET processing_status = 'COMPLETED', period_year = ?, period_month = ?
        WHERE id = ?
      `).run(detectedYear, detectedMonth, sourceFileId);

      // Audit Log
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, user_name, action, resource_type, resource_id, details)
        VALUES (?, ?, ?, 'IMPORT_DATA', 'source_files', ?, ?)
      `).run(
        `audit-${crypto.randomUUID()}`,
        options.uploadedBy,
        'Admin / System',
        sourceFileId,
        JSON.stringify({ total: records.length, valid: validCount, errors: errorCount, file: options.originalFileName })
      );
    });

    runImport();

    // Async batch sync to Supabase PostgreSQL
    this.syncToPostgres(sourceFileId, batchId, records, options.uploadedBy, tatTargets).catch(err => {
      console.warn('Supabase dual-sync notice:', err.message);
    });

    return {
      sourceFileId,
      batchId,
      fileName: options.originalFileName,
      fileHash: driveResult.fileHash,
      googleDriveFileId: driveResult.googleDriveFileId,
      googleDriveFolderId: driveResult.googleDriveFolderId,
      totalRecords: records.length,
      validRecords: validCount,
      warningRecords: warningCount,
      errorRecords: errorCount,
      duplicateRecords: duplicateCount,
      status: 'SUCCESS',
      message: `Berhasil memproses ${validCount} dari ${records.length} data pasien laboratorium.`
    };
  }

  private async syncToPostgres(
    sourceFileId: string,
    batchId: string,
    records: ParsedPatientRecord[],
    uploadedBy: string,
    tatTargets: any[]
  ): Promise<void> {
    try {
      const { query } = require('../../db/postgres');

      // 1. Ensure source_files exists in Postgres first
      const fileRow = db.prepare('SELECT * FROM source_files WHERE id = ?').get(sourceFileId) as any;
      if (fileRow) {
        await query(`
          INSERT INTO source_files (
            id, google_drive_file_id, google_drive_folder_id, google_drive_web_link,
            file_name, stored_file_name, mime_type, file_size, file_hash,
            period_year, period_month, uploaded_by, processing_status, storage_path
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'COMPLETED', $13)
          ON CONFLICT (id) DO UPDATE SET
            google_drive_file_id = EXCLUDED.google_drive_file_id,
            google_drive_web_link = EXCLUDED.google_drive_web_link,
            processing_status = EXCLUDED.processing_status
        `, [
          fileRow.id,
          fileRow.google_drive_file_id,
          fileRow.google_drive_folder_id,
          fileRow.google_drive_web_link,
          fileRow.file_name,
          fileRow.stored_file_name,
          fileRow.mime_type,
          fileRow.file_size,
          fileRow.file_hash,
          fileRow.period_year,
          fileRow.period_month,
          fileRow.uploaded_by,
          fileRow.storage_path
        ]);
      }

      // 2. Insert upload_batches
      await query(`
        INSERT INTO upload_batches (
          id, source_file_id, total_records, valid_records,
          warning_records, error_records, duplicate_records, status
        ) VALUES ($1, $2, $3, $4, 0, 0, 0, 'COMPLETED')
        ON CONFLICT (id) DO UPDATE SET valid_records = EXCLUDED.valid_records, status = 'COMPLETED'
      `, [batchId, sourceFileId, records.length, records.length]);

      // 2. Batch Patients (unique by mrn)
      const uniquePatientsMap = new Map<string, ParsedPatientRecord>();
      for (const rec of records) {
        if (!uniquePatientsMap.has(rec.medicalRecordNumber)) {
          uniquePatientsMap.set(rec.medicalRecordNumber, rec);
        }
      }

      const patientList = Array.from(uniquePatientsMap.values());
      const pChunkSize = 100;
      for (let i = 0; i < patientList.length; i += pChunkSize) {
        const chunk = patientList.slice(i, i + pChunkSize);
        const values: any[] = [];
        const placeholders: string[] = [];
        let pIdx = 1;

        for (const p of chunk) {
          const patId = `pat-${p.medicalRecordNumber}`;
          placeholders.push(`($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5}, $${pIdx + 6})`);
          values.push(patId, uploadedBy, p.medicalRecordNumber, p.patientName, p.gender, p.age, p.ageUnit);
          pIdx += 7;
        }

        if (placeholders.length > 0) {
          await query(`
            INSERT INTO patients (id, user_id, medical_record_number, name, gender, age, age_unit)
            VALUES ${placeholders.join(', ')}
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, age = EXCLUDED.age
          `, values);
        }
      }

      // 3. Batch Examinations, Lab Results, and TAT Records in chunks of 100
      const examChunkSize = 100;
      for (let i = 0; i < records.length; i += examChunkSize) {
        const chunk = records.slice(i, i + examChunkSize);

        const examPlaceholders: string[] = [];
        const examValues: any[] = [];
        let eIdx = 1;

        const labPlaceholders: string[] = [];
        const labValues: any[] = [];
        let lIdx = 1;

        const tatPlaceholders: string[] = [];
        const tatValues: any[] = [];
        let tIdx = 1;

        for (const rec of chunk) {
          const examId = `exam-${crypto.randomUUID()}`;
          const patientId = `pat-${rec.medicalRecordNumber}`;
          const regDateTime = `${rec.orderDate} 08:30:00`;
          const regNo = rec.registrationNumber || `REG-${rec.rowNumber}`;

          examPlaceholders.push(`($${eIdx}, $${eIdx + 1}, $${eIdx + 2}, $${eIdx + 3}, $${eIdx + 4}, $${eIdx + 5}, $${eIdx + 6}, $${eIdx + 7}, $${eIdx + 8}, $${eIdx + 9}, $${eIdx + 10}, $${eIdx + 11}, 'COMPLETED')`);
          examValues.push(
            examId,
            uploadedBy,
            patientId,
            sourceFileId,
            batchId,
            regNo,
            rec.orderDate,
            regDateTime,
            rec.originUnit,
            rec.unitType,
            rec.guarantor,
            rec.doctorName || null
          );
          eIdx += 12;

          for (const test of rec.tests) {
            const isCritical = test.name.toLowerCase().includes('nilai kritis');
            labPlaceholders.push(`($${lIdx}, $${lIdx + 1}, $${lIdx + 2}, $${lIdx + 3}, $${lIdx + 4}, $${lIdx + 5})`);
            labValues.push(`res-${crypto.randomUUID()}`, examId, test.name, test.category, 'Hasil Terverifikasi', isCritical ? 'CRITICAL' : 'NORMAL');
            lIdx += 6;
          }

          if (rec.tatMinutes !== undefined && rec.tatMinutes !== null && !isNaN(rec.tatMinutes)) {
            const primaryCategory = rec.tests[0]?.category || 'Hematologi';
            const serviceType = rec.unitType === 'IGD' ? 'CITO' : (rec.guarantor.includes('CITO') ? 'CITO' : 'REGULER');
            const target = tatTargets.find(t => t.category === primaryCategory && t.service_type === serviceType) || { target_minutes: serviceType === 'CITO' ? 30 : 60 };
            const isCompliant = rec.tatMinutes <= target.target_minutes;

            tatPlaceholders.push(`($${tIdx}, $${tIdx + 1}, $${tIdx + 2}, $${tIdx + 3}, $${tIdx + 4}, $${tIdx + 5}, $${tIdx + 6}, $${tIdx + 7}, $${tIdx + 8})`);
            tatValues.push(
              `tat-${crypto.randomUUID()}`,
              examId,
              primaryCategory,
              serviceType,
              rec.sampleTakenDatetime || `${rec.orderDate} 08:30:00`,
              rec.resultCompletedDatetime || `${rec.orderDate} 09:30:00`,
              rec.tatMinutes,
              target.target_minutes,
              isCompliant ? 1 : 0
            );
            tIdx += 9;
          }
        }

        if (examPlaceholders.length > 0) {
          await query(`
            INSERT INTO examinations (
              id, user_id, patient_id, source_file_id, batch_id, registration_number,
              order_date, registration_datetime, unit_name, unit_type, guarantor, doctor_name, status
            ) VALUES ${examPlaceholders.join(', ')}
            ON CONFLICT (id) DO NOTHING
          `, examValues);
        }

        if (labPlaceholders.length > 0) {
          await query(`
            INSERT INTO laboratory_results (id, examination_id, test_name, category, result_value, flag)
            VALUES ${labPlaceholders.join(', ')}
            ON CONFLICT (id) DO NOTHING
          `, labValues);
        }

        if (tatPlaceholders.length > 0) {
          await query(`
            INSERT INTO tat_records (
              id, examination_id, category, service_type, start_time, end_time,
              duration_minutes, target_minutes, is_compliant
            ) VALUES ${tatPlaceholders.join(', ')}
            ON CONFLICT (id) DO NOTHING
          `, tatValues);
        }
      }

      console.log(`Successfully synced ${records.length} records to Supabase PostgreSQL.`);
    } catch (pgErr: any) {
      console.warn('Postgres batch sync notice:', pgErr.message);
    }
  }
}

export const ingestService = new IngestService();
