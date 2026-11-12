export type EducationalBoard =
  | 'CBSE'
  | 'ICSE'
  | 'STATE_BOARD'
  | 'UDISE_PLUS'
  | 'APAAR'
  | 'NCERT';

export type ExportFormat = 'EXCEL' | 'CSV' | 'JSON';

export type ExportTemplateType =
  | 'CBSE_OASIS_LOC'
  | 'ICSE_COUNCIL_RETURN'
  | 'STATE_BOARD_ANNUAL_RETURN'
  | 'UDISE_PLUS_SDMIS'
  | 'APAAR_PEN_REGISTRY'
  | 'TEACHER_MANDATORY_DISCLOSURE'
  | 'EXAM_BOARD_REGISTER';

export interface ComplianceValidationIssue {
  id: string;
  studentId?: string;
  studentName?: string;
  field: string;
  issue: string;
  severity: 'ERROR' | 'WARNING';
  suggestedFix: string;
}

export interface BoardExportTemplate {
  id: ExportTemplateType;
  board: EducationalBoard;
  title: string;
  titleMl: string;
  description: string;
  descriptionMl: string;
  portalName: string;
  fileExtension: 'xlsx' | 'csv';
  recordCount: number;
  lastExportedAt?: string;
  complianceScore: number; // 0 - 100
  validationIssuesCount: {
    errors: number;
    warnings: number;
  };
  requiredFields: string[];
}

export type AuditEntityType =
  | 'GRADE'
  | 'FEE_PAYMENT'
  | 'STUDENT_RECORD'
  | 'CERTIFICATE'
  | 'ATTENDANCE_RECORD';

export type AuditAction =
  | 'GRADE_OVERRIDE'
  | 'MARKS_REVALUATION'
  | 'GRADE_MODIFIED'
  | 'REPORT_CARD_OVERWRITE'
  | 'PAYMENT_VOIDED'
  | 'FEE_STATUS_MODIFIED'
  | 'CONCESSION_OVERRIDE'
  | 'REFUND_ISSUED'
  | 'CASH_TRANSACTION_ADJUSTMENT'
  | 'STUDENT_RECORD_MODIFIED'
  | 'DOB_ALTERED'
  | 'AADHAAR_APAAR_UPDATED'
  | 'CERTIFICATE_ISSUED'
  | 'CERTIFICATE_REVOKED';

export interface AuditFieldDiff {
  field: string;
  fieldLabel: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
  changeType: 'MODIFIED' | 'ADDED' | 'DELETED';
}

export interface TamperProofAuditRecord {
  id: string;
  sequence: number; // 0, 1, 2, ...
  timestamp: string; // ISO 8601
  tenantId: string;
  entityType: AuditEntityType;
  entityId: string;
  entityName: string;
  action: AuditAction;
  performedBy: {
    userId: string;
    fullName: string;
    role: string;
    email: string;
    ipAddress: string;
    userAgent: string;
  };
  reason: string; // Mandatory justification
  approvalRef?: string; // Ticket or Order ID
  changes: AuditFieldDiff[];
  previousHash: string; // SHA-256 of previous block
  currentHash: string; // SHA-256 hash of this block
  signature: string; // Digital signature / HMAC
  isTampered?: boolean; // Flagged if hash mismatch detected during verification
}

export interface AuditChainVerificationResult {
  isValid: boolean;
  totalBlocksVerified: number;
  genesisHash: string;
  latestHash: string;
  brokenBlockSequence?: number;
  brokenBlockId?: string;
  tamperDetails?: string;
  verifiedAt: string;
}

export interface GovtComplianceStats {
  totalStudentsEnrolled: number;
  boardRegisteredCount: number;
  complianceRate: number; // e.g. 98.6%
  totalAuditRecords: number;
  auditChainIntegrity: 'SECURE' | 'VERIFIED' | 'COMPROMISED';
  lastIntegrityCheck: string;
  pendingValidationErrors: number;
  pendingValidationWarnings: number;
}
