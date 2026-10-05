export interface KPIMetrics {
  totalPatients: number;
  totalExaminations: number;
  totalSamples: number;
  hasTATData?: boolean;
  totalTATRecords?: number;
  averageTATMinutes: number | null;
  medianTATMinutes: number | null;
  tatComplianceRate: number | null;
  tatNonComplianceRate: number | null;
  topExamination: { name: string; count: number } | null;
}

export interface DashboardFilter {
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  unitType?: string;
  unitName?: string;
  category?: string;
  guarantor?: string;
  tatStatus?: 'COMPLIANT' | 'NON_COMPLIANT';
  sourceFileId?: string;
}

export interface FilterOptions {
  years: number[];
  units: Array<{ unit_name: string; unit_type: string }>;
  categories: string[];
  guarantors: string[];
  sourceFiles: Array<{ id: string; file_name: string; upload_date: string }>;
}

export interface DrillDownRecord {
  exam_id: string;
  order_date: string;
  medical_record_number: string;
  patient_name: string;
  gender: string;
  age: number;
  unit_name: string;
  unit_type: string;
  guarantor: string;
  tat_category: string;
  tat_duration: number;
  tat_target: number;
  tat_compliant: number;
  source_file_name: string;
  google_drive_file_id: string;
  google_drive_web_link: string;
  tests: string;
}

export interface RawFile {
  id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  file_hash: string;
  period_year: number;
  period_month: number;
  upload_date: string;
  processing_status: string;
  google_drive_file_id: string;
  google_drive_folder_id: string;
  google_drive_web_link: string;
  uploader_name: string;
  total_records: number;
  valid_records: number;
}

export interface UploadBatch {
  batch_id: string;
  file_id: string;
  file_name: string;
  file_size: number;
  upload_date: string;
  uploaded_by: string;
  total_records: number;
  valid_records: number;
  warning_records: number;
  error_records: number;
  duplicate_records: number;
  batch_status: string;
  google_drive_file_id: string;
  google_drive_web_link: string;
}

export interface ReportType {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  route_path: string;
  template_name?: string;
  template_id?: string;
}

export interface GeneratedReport {
  id: string;
  title: string;
  period_year: number;
  period_month?: number;
  generated_at: string;
  status: string;
  report_type_name: string;
  report_type_code: string;
  generated_by_name: string;
}

export interface AIAnalysisResult {
  id: string;
  period: string;
  analysis: {
    summary: string;
    findings: string[];
    comparison: string;
    recommendations: string[];
    modelUsed: string;
  };
  aggregatedMetrics: KPIMetrics;
}
