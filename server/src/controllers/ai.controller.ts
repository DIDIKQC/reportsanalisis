import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { aiProvider } from '../services/ai/gemini.provider';
import { analyticsEngine, DashboardFilter } from '../services/calculation/analytics.engine';
import db from '../db/database';
import crypto from 'crypto';

export const runAIAnalysis = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { year, month, contextNote } = req.body;
    const filter: DashboardFilter = {
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined
    };

    // Deterministically aggregate data FIRST (strictly no raw patient PII sent to AI)
    const kpis = analyticsEngine.getSummaryKPIs(filter);
    const topTests = analyticsEngine.getTopExaminations(filter, 5);
    const categoryBreakdown = analyticsEngine.getCategoryBreakdown(filter);
    const originBreakdown = analyticsEngine.getOriginBreakdown(filter);

    const originsMap: Record<string, number> = {};
    originBreakdown.forEach(o => { originsMap[o.unit_type] = o.patient_count; });

    const categoriesMap: Record<string, number> = {};
    categoryBreakdown.forEach(c => { categoriesMap[c.category] = c.count; });

    const periodStr = month ? `Bulan ${month} Tahun ${year || 2025}` : `Tahun ${year || 2025}`;

    const analysis = await aiProvider.generateAnalysis({
      period: periodStr,
      aggregatedMetrics: {
        totalPatients: kpis.totalPatients,
        totalExaminations: kpis.totalExaminations,
        hasTATData: kpis.hasTATData,
        tatComplianceRate: kpis.tatComplianceRate,
        tatNonComplianceRate: kpis.tatNonComplianceRate,
        originBreakdown: originsMap,
        categoryBreakdown: categoriesMap,
        topExaminations: topTests
      },
      contextNote
    });

    const analysisId = `ai-${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO ai_analysis_results (
        id, period, filters, aggregated_input, summary, findings,
        comparison, recommendations, model_used
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      analysisId,
      periodStr,
      JSON.stringify(filter),
      JSON.stringify({ kpis, topTests }),
      analysis.summary,
      JSON.stringify(analysis.findings),
      analysis.comparison,
      JSON.stringify(analysis.recommendations),
      analysis.modelUsed
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, resource_type, resource_id, details)
      VALUES (?, ?, ?, 'AI_ANALYSIS', 'ai_analysis_results', ?, ?)
    `).run(`audit-${Date.now()}`, req.user?.id || 'usr-manager', req.user?.fullName || 'Manager', analysisId, JSON.stringify({ period: periodStr }));

    return res.json({
      id: analysisId,
      period: periodStr,
      analysis,
      aggregatedMetrics: kpis
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Gagal menjalankan analisis AI: ${err.message}` });
  }
};

export const getLatestAIAnalysis = (req: AuthenticatedRequest, res: Response) => {
  try {
    const row = db.prepare(`
      SELECT * FROM ai_analysis_results
      ORDER BY created_at DESC
      LIMIT 1
    `).get() as any;

    if (!row) {
      return res.json({ analysis: null });
    }

    return res.json({
      analysis: {
        id: row.id,
        period: row.period,
        summary: row.summary,
        findings: JSON.parse(row.findings || '[]'),
        comparison: row.comparison,
        recommendations: JSON.parse(row.recommendations || '[]'),
        modelUsed: row.model_used,
        createdAt: row.created_at
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal mengambil riwayat analisis AI.' });
  }
};
