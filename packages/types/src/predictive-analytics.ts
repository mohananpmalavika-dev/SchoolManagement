export type RiskLevel = 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_DATA';
export type RiskKind = 'academic' | 'feeDefault' | 'dropout' | 'homework';
export interface RiskAssessment {
  score: number | null;
  level: RiskLevel;
  basis: 'SCHOOL_MODEL' | 'EARLY_WARNING';
  evidence: string[];
  actions: string[];
}
export interface RadarMetrics {
  academicScore: number;
  attendanceScore: number;
  homeworkScore: number;
  financialScore: number;
  compositeRiskScore: number;
}
export interface StudentInterventionPlan {
  teacherActions: string[];
  parentGuidance: string[];
  malayalamSummary: {
    riskTitle: string;
    teacherAdvice: string[];
    parentAdvice: string[];
  };
}
export interface StudentRiskProfile {
  studentId: string;
  name: string;
  admissionNumber: string;
  classId: string | null;
  className: string;
  overall: RiskLevel;
  priorityScore: number | null;
  academic: RiskAssessment;
  feeDefault: RiskAssessment;
  dropout: RiskAssessment;
  homework: RiskAssessment;
  metrics: {
    latestAverage: number | null;
    projectedAverage: number | null;
    attendanceRate: number | null;
    attendanceDays: number;
    outstandingBalance: number;
    overdueBalance: number;
    homeworkCompletionRate: number | null;
    homeworkMissingCount: number;
    homeworkAverageScore: number | null;
  };
  radarMetrics: RadarMetrics;
  interventions: StudentInterventionPlan;
}
export interface PredictiveModelInfo {
  status: 'ACTIVE' | 'INSUFFICIENT_HISTORY' | 'VALIDATION_FAILED';
  samples: number;
  validationSamples: number;
  balancedAccuracy: number | null;
  brierScore: number | null;
}
export interface PredictiveAnalyticsReport {
  generatedAt: string;
  engineVersion: string;
  currency: string;
  methodology: string;
  models: { academic: PredictiveModelInfo; feeDefault: PredictiveModelInfo };
  summary: {
    students: number;
    atRisk: number;
    academicHigh: number;
    feeDefaultHigh: number;
    dropoutHigh: number;
    homeworkHigh: number;
    incompleteData: number;
    overdueBalance: number;
  };
  classes: { id: string; name: string }[];
  students: StudentRiskProfile[];
}
