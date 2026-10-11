import { IsString, IsOptional, IsInt, IsEnum, IsBoolean, IsDateString, Min, Max, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  ComplianceReportType, 
  ReportStatus, 
  ComplianceArea,
  ChecklistStatus,
  DataAuditType,
  ComplianceAlertType,
  AlertSeverity,
  AlertStatus,
} from '@prisma/client';

export class GenerateReportDto {
  @ApiProperty({ 
    description: 'Type of compliance report',
    enum: ComplianceReportType,
  })
  @IsEnum(ComplianceReportType)
  reportType: ComplianceReportType;

  @ApiProperty({ description: 'Report period', example: 'Term 1 2024' })
  @IsString()
  reportPeriod: string;

  @ApiProperty({ description: 'Report year', example: 2024 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  reportYear: number;

  @ApiPropertyOptional({ description: 'Report quarter (1-4)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  reportQuarter?: number;

  @ApiPropertyOptional({ description: 'Report month (1-12)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  reportMonth?: number;

  @ApiPropertyOptional({ description: 'Term ID for term-based reports' })
  @IsOptional()
  @IsString()
  termId?: string;

  @ApiPropertyOptional({ description: 'Start date for date-range reports' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for date-range reports' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class GetReportsQueryDto {
  @ApiPropertyOptional({ 
    description: 'Filter by report type',
    enum: ComplianceReportType,
  })
  @IsOptional()
  @IsEnum(ComplianceReportType)
  reportType?: ComplianceReportType;

  @ApiPropertyOptional({ 
    description: 'Filter by status',
    enum: ReportStatus,
  })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}

export class ApproveReportDto {
  @ApiProperty({ description: 'Report ID to approve' })
  @IsString()
  reportId: string;
}

export class SubmitReportDto {
  @ApiProperty({ description: 'Report ID to submit' })
  @IsString()
  reportId: string;
}

export class CreateChecklistDto {
  @ApiProperty({ description: 'Checklist item title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Compliance area',
    enum: ComplianceArea,
  })
  @IsEnum(ComplianceArea)
  complianceArea: ComplianceArea;

  @ApiProperty({ description: 'Required by (government body/regulation)' })
  @IsString()
  requiredBy: string;

  @ApiProperty({ description: 'Frequency: DAILY, WEEKLY, MONTHLY, TERMLY, ANNUAL' })
  @IsString()
  frequency: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class CompleteChecklistDto {
  @ApiProperty({ description: 'Checklist ID to complete' })
  @IsString()
  checklistId: string;

  @ApiPropertyOptional({ description: 'Evidence documents/URLs' })
  @IsOptional()
  @IsObject()
  evidence?: any;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class GetChecklistsQueryDto {
  @ApiPropertyOptional({ 
    description: 'Filter by compliance area',
    enum: ComplianceArea,
  })
  @IsOptional()
  @IsEnum(ComplianceArea)
  complianceArea?: ComplianceArea;

  @ApiPropertyOptional({ 
    description: 'Filter by status',
    enum: ChecklistStatus,
  })
  @IsOptional()
  @IsEnum(ChecklistStatus)
  status?: ChecklistStatus;
}

export class RunDataAuditDto {
  @ApiProperty({ 
    description: 'Type of data audit',
    enum: DataAuditType,
  })
  @IsEnum(DataAuditType)
  auditType: DataAuditType;
}

export class CreateAlertDto {
  @ApiProperty({ 
    description: 'Alert type',
    enum: ComplianceAlertType,
  })
  @IsEnum(ComplianceAlertType)
  alertType: ComplianceAlertType;

  @ApiProperty({ 
    description: 'Alert severity',
    enum: AlertSeverity,
  })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiProperty({ description: 'Alert title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Alert message' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Related entity type' })
  @IsOptional()
  @IsString()
  relatedEntity?: string;

  @ApiPropertyOptional({ description: 'Related entity ID' })
  @IsOptional()
  @IsString()
  relatedEntityId?: string;
}

export class GetAlertsQueryDto {
  @ApiPropertyOptional({ 
    description: 'Filter by status',
    enum: AlertStatus,
  })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;
}

export class AcknowledgeAlertDto {
  @ApiProperty({ description: 'Alert ID to acknowledge' })
  @IsString()
  alertId: string;
}

export class ResolveAlertDto {
  @ApiProperty({ description: 'Alert ID to resolve' })
  @IsString()
  alertId: string;

  @ApiProperty({ description: 'Resolution notes' })
  @IsString()
  resolutionNotes: string;
}

export class ComplianceReportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reportType: ComplianceReportType;

  @ApiProperty()
  reportPeriod: string;

  @ApiProperty()
  reportYear: number;

  @ApiPropertyOptional()
  reportQuarter?: number;

  @ApiPropertyOptional()
  reportMonth?: number;

  @ApiProperty()
  status: ReportStatus;

  @ApiPropertyOptional()
  submittedTo?: string;

  @ApiPropertyOptional()
  submittedAt?: Date;

  @ApiPropertyOptional()
  submittedBy?: string;

  @ApiPropertyOptional()
  approvedBy?: string;

  @ApiPropertyOptional()
  approvedAt?: Date;

  @ApiProperty()
  reportData: any;

  @ApiPropertyOptional()
  metadata?: any;

  @ApiPropertyOptional()
  fileUrl?: string;

  @ApiProperty()
  isAutomated: boolean;

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ChecklistResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  complianceArea: ComplianceArea;

  @ApiProperty()
  requiredBy: string;

  @ApiProperty()
  frequency: string;

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiProperty()
  status: ChecklistStatus;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  completedBy?: string;

  @ApiPropertyOptional()
  evidence?: any;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DataAuditResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  auditType: DataAuditType;

  @ApiProperty()
  entityType: string;

  @ApiPropertyOptional()
  entityId?: string;

  @ApiProperty()
  completeness: number;

  @ApiProperty()
  accuracy: number;

  @ApiProperty()
  consistency: number;

  @ApiProperty()
  overallScore: number;

  @ApiProperty()
  issuesFound: number;

  @ApiProperty()
  criticalIssues: number;

  @ApiProperty()
  warningIssues: number;

  @ApiPropertyOptional()
  issues?: any;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  resolvedIssues?: number;

  @ApiPropertyOptional()
  resolvedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AlertResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  alertType: ComplianceAlertType;

  @ApiProperty()
  severity: AlertSeverity;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  relatedEntity?: string;

  @ApiPropertyOptional()
  relatedEntityId?: string;

  @ApiProperty()
  actionRequired: boolean;

  @ApiPropertyOptional()
  actionUrl?: string;

  @ApiPropertyOptional()
  actionDescription?: string;

  @ApiProperty()
  status: AlertStatus;

  @ApiPropertyOptional()
  acknowledgedBy?: string;

  @ApiPropertyOptional()
  acknowledgedAt?: Date;

  @ApiPropertyOptional()
  resolvedBy?: string;

  @ApiPropertyOptional()
  resolvedAt?: Date;

  @ApiPropertyOptional()
  resolutionNotes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
