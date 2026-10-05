import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { annualReportBuilder } from '../services/report/annual.builder';
import { tatEvaluationBuilder } from '../services/report/tat.builder';
import db from '../db/database';
import crypto from 'crypto';
import fs from 'fs';

export const getReportTypes = (req: AuthenticatedRequest, res: Response) => {
  try {
    const reportTypes = db.prepare(`
      SELECT rt.*, t.name as template_name, t.id as template_id
      FROM report_types rt
      LEFT JOIN report_templates t ON t.report_type_id = rt.id
      WHERE rt.is_active = 1
    `).all();
    return res.json({ reportTypes });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil daftar tipe laporan.' });
  }
};

export const getAnnualReportData = (req: AuthenticatedRequest, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string, 10) : 2025;
    const reportData = annualReportBuilder.buildAnnualData(year);
    return res.json({ reportData });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menyusun data laporan tahunan.' });
  }
};

export const getTATEvaluationReport = (req: AuthenticatedRequest, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string, 10) : 2025;
    const quarter = req.query.quarter ? parseInt(req.query.quarter as string, 10) : 2;
    const sourceFileId = req.query.sourceFileId as string | undefined;

    const reportData = tatEvaluationBuilder.buildEvaluationData({ year, quarter, sourceFileId });
    return res.json({ reportData });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menyusun data evaluasi TAT laboratorium.' });
  }
};

export const saveGeneratedReport = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportTypeId, templateVersionId, title, periodYear, periodMonth, filtersApplied, summaryMetrics, pdfBase64 } = req.body;

    const reportId = `rep-${crypto.randomUUID()}`;
    const insert = db.prepare(`
      INSERT INTO generated_reports (
        id, user_id, report_type_id, template_version_id, title, period_year,
        period_month, filters_applied, generated_by, status, summary_metrics
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
    `);

    insert.run(
      reportId,
      req.tenantId || req.user?.id || 'usr-admin',
      reportTypeId || 'rt-tahunan',
      templateVersionId || 'ver-tahunan-2025-v1',
      title || `Laporan Tahunan Laboratorium ${periodYear || 2025}`,
      periodYear || 2025,
      periodMonth || null,
      JSON.stringify(filtersApplied || {}),
      req.user?.id || 'usr-admin',
      JSON.stringify(summaryMetrics || {})
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, resource_type, resource_id, details)
      VALUES (?, ?, ?, 'GENERATE_REPORT', 'generated_reports', ?, ?)
    `).run(`audit-${Date.now()}`, req.user?.id || 'usr-admin', req.user?.fullName || 'Admin', reportId, JSON.stringify({ title }));

    return res.json({
      reportId,
      status: 'SUCCESS',
      message: 'Laporan berhasil dicatat dalam histori dan siap diunduh.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menyimpan histori laporan.' });
  }
};

export const getReportHistory = (req: AuthenticatedRequest, res: Response) => {
  try {
    let query = `
      SELECT 
        gr.id,
        gr.title,
        gr.period_year,
        gr.period_month,
        gr.generated_at,
        gr.status,
        gr.summary_metrics,
        rt.name as report_type_name,
        rt.code as report_type_code,
        u.full_name as generated_by_name
      FROM generated_reports gr
      JOIN report_types rt ON gr.report_type_id = rt.id
      LEFT JOIN users u ON gr.generated_by = u.id
    `;
    const params: any[] = [];
    if (req.tenantId) {
      query += ` WHERE (gr.generated_by = ? OR gr.user_id = ?) `;
      params.push(req.tenantId, req.tenantId);
    }
    query += ` ORDER BY gr.generated_at DESC `;

    const reports = db.prepare(query).all(...params);
    return res.json({ reports });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil riwayat laporan.' });
  }
};

export const deleteReportHistory = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const report = db.prepare('SELECT * FROM generated_reports WHERE id = ?').get(id) as any;
    if (!report) {
      return res.status(404).json({ error: 'Riwayat laporan tidak ditemukan.' });
    }

    // Role check: superadmin can delete anything; non-superadmin can only delete their own
    const isSuperAdmin = req.user?.role === 'superadmin' || req.user?.role === 'SUPER_ADMIN';
    if (!isSuperAdmin) {
      if (report.generated_by !== req.user?.id && report.user_id !== req.user?.id) {
        return res.status(403).json({ error: 'Anda tidak memiliki hak untuk menghapus riwayat laporan ini.' });
      }
    }

    // Delete local PDF file if exists
    if (report.pdf_path && fs.existsSync(report.pdf_path)) {
      try {
        fs.unlinkSync(report.pdf_path);
      } catch (e) {}
    }

    // Delete database record
    db.prepare('DELETE FROM generated_reports WHERE id = ?').run(id);

    // Audit trail log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, resource_type, resource_id, details)
      VALUES (?, ?, ?, 'DELETE_REPORT', 'generated_reports', ?, ?)
    `).run(
      `audit-${Date.now()}`,
      req.user?.id || 'usr-admin',
      req.user?.fullName || req.user?.username || 'Admin',
      id,
      JSON.stringify({ title: report.title, period_year: report.period_year })
    );

    return res.json({
      status: 'SUCCESS',
      message: `Riwayat laporan "${report.title}" berhasil dihapus.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menghapus riwayat laporan.' });
  }
};
