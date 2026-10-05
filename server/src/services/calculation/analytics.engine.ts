import db from '../../db/database';

export interface DashboardFilter {
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  unitType?: string; // 'RAWAT_JALAN' | 'RAWAT_INAP' | 'IGD'
  unitName?: string;
  category?: string;
  guarantor?: string;
  tatStatus?: 'COMPLIANT' | 'NON_COMPLIANT';
  sourceFileId?: string;
  tenantId?: string | null;
  search?: string;
}

export interface KPIMetrics {
  totalPatients: number;
  totalExaminations: number;
  totalSamples: number;
  hasTATData: boolean;
  totalTATRecords: number;
  averageTATMinutes: number | null;
  medianTATMinutes: number | null;
  tatComplianceRate: number | null;
  tatNonComplianceRate: number | null;
  topExamination: { name: string; count: number } | null;
}

export class AnalyticsEngine {
  public getSummaryKPIs(filter: DashboardFilter = {}): KPIMetrics {
    const { whereClause, params } = this.buildWhereClause(filter);

    // 1. Total Patients & Exams
    const examQuery = `
      SELECT 
        COUNT(DISTINCT e.patient_id) as total_patients,
        COUNT(DISTINCT e.id) as total_samples,
        COUNT(lr.id) as total_examinations
      FROM examinations e
      LEFT JOIN laboratory_results lr ON lr.examination_id = e.id
      ${whereClause}
    `;
    const examResult = db.prepare(examQuery).get(...params) as any;

    // 2. TAT Metrics (using same filter conditions on examinations e)
    const tatQuery = `
      SELECT 
        AVG(t.duration_minutes) as avg_tat,
        SUM(CASE WHEN t.is_compliant = 1 THEN 1 ELSE 0 END) as compliant_count,
        SUM(CASE WHEN t.is_compliant = 0 THEN 1 ELSE 0 END) as non_compliant_count,
        COUNT(t.id) as total_tat_records
      FROM tat_records t
      JOIN examinations e ON t.examination_id = e.id
      LEFT JOIN laboratory_results lr ON lr.examination_id = e.id
      ${whereClause}
    `;
    const tatResult = db.prepare(tatQuery).get(...params) as any;

    // 3. Median TAT
    const medianQuery = `
      SELECT t.duration_minutes
      FROM tat_records t
      JOIN examinations e ON t.examination_id = e.id
      LEFT JOIN laboratory_results lr ON lr.examination_id = e.id
      ${whereClause}
      ORDER BY t.duration_minutes ASC
    `;
    const durations = (db.prepare(medianQuery).all(...params) as any[]).map(r => r.duration_minutes);
    let medianTAT = 0;
    if (durations.length > 0) {
      const mid = Math.floor(durations.length / 2);
      medianTAT = durations.length % 2 !== 0 ? durations[mid] : Math.round((durations[mid - 1] + durations[mid]) / 2);
    }

    const totalTAT = (tatResult?.total_tat_records || 0);
    const compliantCount = (tatResult?.compliant_count || 0);
    const hasTATData = totalTAT > 0;
    const complianceRate = hasTATData ? parseFloat(((compliantCount / totalTAT) * 100).toFixed(1)) : null;
    const nonComplianceRate = hasTATData && complianceRate !== null ? parseFloat((100 - complianceRate).toFixed(1)) : null;
    const averageTATMinutes = hasTATData && tatResult?.avg_tat !== null ? Math.round(tatResult.avg_tat) : null;
    const finalMedianTAT = hasTATData ? medianTAT : null;

    // 4. Top Examination
    const topExamQuery = `
      SELECT lr.test_name, COUNT(*) as count
      FROM laboratory_results lr
      JOIN examinations e ON lr.examination_id = e.id
      ${whereClause}
      GROUP BY lr.test_name
      ORDER BY count DESC
      LIMIT 1
    `;
    const topExam = db.prepare(topExamQuery).get(...params) as any;

    return {
      totalPatients: examResult?.total_patients || 0,
      totalExaminations: examResult?.total_examinations || 0,
      totalSamples: examResult?.total_samples || 0,
      hasTATData,
      totalTATRecords: totalTAT,
      averageTATMinutes,
      medianTATMinutes: finalMedianTAT,
      tatComplianceRate: complianceRate,
      tatNonComplianceRate: nonComplianceRate,
      topExamination: topExam ? { name: topExam.test_name, count: topExam.count } : null
    };
  }

  public getMonthlyTrends(filter: DashboardFilter = {}) {
    const { whereClause, params } = this.buildWhereClause(filter);

    const query = `
      SELECT 
        strftime('%m', e.order_date) as month_num,
        COUNT(DISTINCT e.patient_id) as patient_count,
        COUNT(lr.id) as exam_count,
        AVG(t.duration_minutes) as avg_tat,
        AVG(t.is_compliant) * 100 as compliance_rate
      FROM examinations e
      LEFT JOIN laboratory_results lr ON lr.examination_id = e.id
      LEFT JOIN tat_records t ON t.examination_id = e.id
      ${whereClause}
      GROUP BY month_num
      ORDER BY month_num ASC
    `;
    const rows = db.prepare(query).all(...params) as any[];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return monthNames.map((name, idx) => {
      const mStr = (idx + 1).toString().padStart(2, '0');
      const found = rows.find(r => r.month_num === mStr);
      return {
        month: name,
        monthNumber: idx + 1,
        patients: found ? found.patient_count : 0,
        examinations: found ? found.exam_count : 0,
        avgTAT: (found && found.avg_tat !== null) ? Math.round(found.avg_tat) : 0,
        complianceRate: (found && found.compliance_rate !== null && found.compliance_rate !== undefined)
          ? parseFloat(Number(found.compliance_rate).toFixed(1))
          : null
      };
    });
  }

  public getCategoryBreakdown(filter: DashboardFilter = {}) {
    const { whereClause, params } = this.buildWhereClause(filter);

    const query = `
      SELECT 
        lr.category,
        COUNT(lr.id) as count
      FROM laboratory_results lr
      JOIN examinations e ON lr.examination_id = e.id
      ${whereClause}
      GROUP BY lr.category
      ORDER BY count DESC
    `;
    return db.prepare(query).all(...params) as Array<{ category: string; count: number }>;
  }

  public getOriginBreakdown(filter: DashboardFilter = {}) {
    const { whereClause, params } = this.buildWhereClause(filter);

    const query = `
      SELECT 
        e.unit_type,
        COUNT(DISTINCT e.patient_id) as patient_count,
        COUNT(lr.id) as exam_count
      FROM examinations e
      LEFT JOIN laboratory_results lr ON lr.examination_id = e.id
      ${whereClause}
      GROUP BY e.unit_type
    `;
    return db.prepare(query).all(...params) as Array<{ unit_type: string; patient_count: number; exam_count: number }>;
  }

  public getGuarantorBreakdown(filter: DashboardFilter = {}) {
    const { whereClause, params } = this.buildWhereClause(filter);

    const query = `
      SELECT 
        e.guarantor,
        COUNT(DISTINCT e.patient_id) as count
      FROM examinations e
      LEFT JOIN laboratory_results lr ON lr.examination_id = e.id
      ${whereClause}
      GROUP BY e.guarantor
      ORDER BY count DESC
    `;
    return db.prepare(query).all(...params) as Array<{ guarantor: string; count: number }>;
  }

  public getTopExaminations(filter: DashboardFilter = {}, limit = 10) {
    const { whereClause, params } = this.buildWhereClause(filter);

    const query = `
      SELECT 
        lr.test_name as name,
        lr.category,
        COUNT(lr.id) as count
      FROM laboratory_results lr
      JOIN examinations e ON lr.examination_id = e.id
      ${whereClause}
      GROUP BY lr.test_name, lr.category
      ORDER BY count DESC
      LIMIT ?
    `;
    return db.prepare(query).all(...params, limit) as Array<{ name: string; category: string; count: number }>;
  }

  public getDrillDownRecords(filter: DashboardFilter = {}, page = 1, pageSize = 25) {
    const { whereClause, params } = this.buildWhereClause(filter);
    const offset = (page - 1) * pageSize;

    const query = `
      SELECT 
        e.id as exam_id,
        e.order_date,
        p.medical_record_number,
        p.name as patient_name,
        p.gender,
        p.age,
        e.unit_name,
        e.unit_type,
        e.guarantor,
        t.category as tat_category,
        t.duration_minutes as tat_duration,
        t.target_minutes as tat_target,
        t.is_compliant as tat_compliant,
        sf.file_name as source_file_name,
        sf.google_drive_file_id,
        sf.google_drive_web_link,
        GROUP_CONCAT(lr.test_name, ', ') as tests
      FROM examinations e
      JOIN patients p ON e.patient_id = p.id
      LEFT JOIN tat_records t ON t.examination_id = e.id
      LEFT JOIN source_files sf ON e.source_file_id = sf.id
      LEFT JOIN laboratory_results lr ON lr.examination_id = e.id
      ${whereClause}
      GROUP BY e.id
      ORDER BY e.order_date DESC, e.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM examinations e
      LEFT JOIN tat_records t ON t.examination_id = e.id
      LEFT JOIN laboratory_results lr ON lr.examination_id = e.id
      ${whereClause}
    `;

    const records = db.prepare(query).all(...params, pageSize, offset);
    const totalCount = (db.prepare(countQuery).get(...params) as any)?.total || 0;

    return {
      records,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  }

  private buildWhereClause(filter: DashboardFilter): { whereClause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.year) {
      conditions.push(`strftime('%Y', e.order_date) = ?`);
      params.push(String(filter.year));
    }
    if (filter.month) {
      const m = String(filter.month).padStart(2, '0');
      conditions.push(`strftime('%m', e.order_date) = ?`);
      params.push(m);
    }
    if (filter.startDate) {
      conditions.push(`e.order_date >= ?`);
      params.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push(`e.order_date <= ?`);
      params.push(filter.endDate);
    }
    if (filter.unitType) {
      conditions.push(`e.unit_type = ?`);
      params.push(filter.unitType);
    }
    if (filter.unitName) {
      conditions.push(`e.unit_name LIKE ?`);
      params.push(`%${filter.unitName}%`);
    }
    if (filter.category) {
      conditions.push(`lr.category = ?`);
      params.push(filter.category);
    }
    if (filter.guarantor) {
      conditions.push(`e.guarantor = ?`);
      params.push(filter.guarantor);
    }
    if (filter.tatStatus === 'COMPLIANT') {
      conditions.push(`t.is_compliant = 1`);
    } else if (filter.tatStatus === 'NON_COMPLIANT') {
      conditions.push(`t.is_compliant = 0`);
    }
    if (filter.sourceFileId) {
      conditions.push(`e.source_file_id = ?`);
      params.push(filter.sourceFileId);
    }
    if (filter.tenantId) {
      conditions.push(`(e.user_id = ? OR e.source_file_id IN (SELECT id FROM source_files WHERE uploaded_by = ?))`);
      params.push(filter.tenantId, filter.tenantId);
    }
    if (filter.search) {
      conditions.push(`(e.patient_id IN (SELECT id FROM patients WHERE name LIKE ? OR medical_record_number LIKE ?) OR lr.test_name LIKE ?)`);
      params.push(`%${filter.search}%`, `%${filter.search}%`, `%${filter.search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
  }
}

export const analyticsEngine = new AnalyticsEngine();
