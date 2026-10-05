export interface AIAnalysisRequest {
  period: string;
  aggregatedMetrics: {
    totalPatients: number;
    totalExaminations: number;
    tatComplianceRate: number;
    tatNonComplianceRate: number;
    previousPeriodCompliance?: number;
    originBreakdown?: Record<string, number>;
    categoryBreakdown?: Record<string, number>;
    topExaminations?: Array<{ name: string; count: number }>;
    criticalResultsCount?: number;
  };
  contextNote?: string;
}

export interface AIAnalysisResponse {
  summary: string;
  findings: string[];
  comparison: string;
  recommendations: string[];
  modelUsed: string;
  rawResponse?: string;
}

export interface SmartMappingRequest {
  unmappedHeaders: string[];
  sampleRows: Record<string, any>[];
  targetFields: string[];
}

export interface SmartMappingResponse {
  mappings: Record<string, string>; // { "unmappedHeader": "targetField" }
  confidence: Record<string, number>;
}

export interface AIProvider {
  name: string;
  generateAnalysis(req: AIAnalysisRequest): Promise<AIAnalysisResponse>;
  smartColumnMapping(req: SmartMappingRequest): Promise<SmartMappingResponse>;
}
