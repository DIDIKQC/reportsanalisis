import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { analyticsEngine, DashboardFilter } from '../services/calculation/analytics.engine';
import db from '../db/database';

function parseFilter(req: AuthenticatedRequest): DashboardFilter {
  const query = req.query;
  return {
    year: query.year ? parseInt(query.year as string, 10) : undefined,
    month: query.month ? parseInt(query.month as string, 10) : undefined,
    startDate: query.startDate as string,
    endDate: query.endDate as string,
    unitType: query.unitType as string,
    unitName: query.unitName as string,
    category: query.category as string,
    guarantor: query.guarantor as string,
    tatStatus: query.tatStatus as 'COMPLIANT' | 'NON_COMPLIANT',
    sourceFileId: query.sourceFileId as string,
    tenantId: req.tenantId,
    search: query.search as string
  };
}

export const getDashboardSummary = (req: AuthenticatedRequest, res: Response) => {
  try {
    const filter = parseFilter(req);
    const summary = analyticsEngine.getSummaryKPIs(filter);
    return res.json({ summary });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal menghitung KPI dashboard.' });
  }
};

export const getDashboardCharts = (req: AuthenticatedRequest, res: Response) => {
  try {
    const filter = parseFilter(req);
    const monthlyTrends = analyticsEngine.getMonthlyTrends(filter);
    const categories = analyticsEngine.getCategoryBreakdown(filter);
    const origins = analyticsEngine.getOriginBreakdown(filter);
    const guarantors = analyticsEngine.getGuarantorBreakdown(filter);
    const topTests = analyticsEngine.getTopExaminations(filter, 10);

    return res.json({
      monthlyTrends,
      categories,
      origins,
      guarantors,
      topTests
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil data analitik visual.' });
  }
};

export const getDashboardFilterOptions = (req: AuthenticatedRequest, res: Response) => {
  try {
    const years = (db.prepare(`
      SELECT DISTINCT strftime('%Y', order_date) as year 
      FROM examinations 
      ORDER BY year DESC
    `).all() as any[]).map(r => parseInt(r.year, 10)).filter(Boolean);

    const units = (db.prepare(`
      SELECT DISTINCT unit_name, unit_type 
      FROM examinations 
      ORDER BY unit_name ASC
    `).all() as any[]);

    const categories = (db.prepare(`
      SELECT DISTINCT category 
      FROM laboratory_results 
      ORDER BY category ASC
    `).all() as any[]).map(r => r.category).filter(Boolean);

    const guarantors = (db.prepare(`
      SELECT DISTINCT guarantor 
      FROM examinations 
      ORDER BY guarantor ASC
    `).all() as any[]).map(r => r.guarantor).filter(Boolean);

    const sourceFiles = (db.prepare(`
      SELECT id, file_name, upload_date 
      FROM source_files 
      ORDER BY upload_date DESC
    `).all() as any[]);

    return res.json({
      years: years.length > 0 ? years : [2026, 2025, 2024, 2023],
      units,
      categories,
      guarantors,
      sourceFiles
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil opsi filter.' });
  }
};

export const getDrilldown = (req: AuthenticatedRequest, res: Response) => {
  try {
    const filter = parseFilter(req);
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 25;

    const result = analyticsEngine.getDrillDownRecords(filter, page, pageSize);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil record drill-down.' });
  }
};
