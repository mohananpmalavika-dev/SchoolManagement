import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
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

import { PrismaService } from '../../../database/prisma.service';
import {
  GenerateReportDto,
  ExportPortalDataDto,
  ManualSubmissionDto,
  SubmissionOutcomeDto,
  LogAuditRecordOverrideDto,
  ManualBoardRecordDto,
} from '../dto/compliance.dto';
import { csv, xlsx } from '../utils/workbook';

import { auditData } from './compliance-audits';
import {
  Db,
  REPORTS,
  TEMPLATES,
  GENESIS,
  append,
  atomic,
  bounds,
  countBy,
  day,
  json,
  parseDate,
  round,
  sha,
  stable,
} from './compliance-core';
import { exportRows } from './compliance-exports';
import { buildReport } from './compliance-reports';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}
  async options(tenantId: string) {
    const [years, terms, students] = await Promise.all([
      this.prisma.academicYear.findMany({ where: { tenantId }, orderBy: { startDate: 'desc' } }),
      this.prisma.term.findMany({ where: { tenantId }, orderBy: { startDate: 'desc' } }),
      this.prisma.student.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, firstName: true, lastName: true, admissionNumber: true },
        orderBy: { admissionNumber: 'asc' },
        take: 5000,
      }),
    ]);
    return {
      reportTypes: REPORTS,
      templates: TEMPLATES,
      years,
      terms,
      students,
      externalApiAvailable: false,
      submissionMode: 'MANUAL_PORTAL',
      formatNotice:
        'School preparation files. Compare columns with the current official portal template before upload; portal acceptance is not certified.',
    };
  }
  async generateReport(
    tenantId: string,
    dto: GenerateReportDto,
    actorId = 'SYSTEM',
    idempotencyKey?: string
  ) {
    if (!REPORTS.includes(dto.reportType)) throw new BadRequestException('Unsupported report type');
    if (!dto.reportPeriod?.trim()) throw new BadRequestException('Enter a reporting period');
    bounds(dto);
    if (dto.reportType === 'ATTENDANCE_SUMMARY' && (!dto.startDate || !dto.endDate))
      throw new BadRequestException('Attendance reports require both period dates');
    if (dto.reportType === 'EXAMINATION_ANALYSIS' && !dto.termId)
      throw new BadRequestException('Choose an examination term');
    return atomic(this.prisma, tenantId, async (tx) => {
      if (idempotencyKey) {
        const existing = await tx.complianceReport.findFirst({
          where: { tenantId, idempotencyKey },
        });
        if (existing) return existing;
      }
      if (dto.replacesReportId) {
        const previous = await this.report(tx, tenantId, dto.replacesReportId);
        if (previous.status !== 'REJECTED')
          throw new ConflictException('Only a rejected report can be replaced');
      }
      const data = await buildReport(tx, tenantId, dto);
      const saved = await tx.complianceReport.create({
        data: {
          tenantId,
          reportType: dto.reportType,
          reportPeriod: dto.reportPeriod.trim(),
          reportYear: dto.reportYear,
          reportMonth: dto.reportMonth,
          reportQuarter: dto.reportQuarter,
          dueDate: dto.dueDate ? parseDate(dto.dueDate) : undefined,
          reportData: json(data),
          metadata: json({
            schemaVersion: 1,
            generatedBy: actorId,
            request: dto,
            replacesReportId: dto.replacesReportId || null,
          }),
          status: 'DRAFT',
          isAutomated: actorId === 'SYSTEM',
          idempotencyKey,
        },
      });
      await append(tx, tenantId, actorId, 'REPORT', saved.id, 'GENERATED', {
        reportType: dto.reportType,
        contentHash: sha(stable(saved.reportData)),
        replacesReportId: dto.replacesReportId || null,
      });
      return saved;
    });
  }
  generateEnrollmentReport(t: string, p: string, y: number, q?: number) {
    return this.generateReport(t, {
      reportType: 'ENROLLMENT_STATISTICS',
      reportPeriod: p,
      reportYear: y,
      reportQuarter: q,
    });
  }
  generateAttendanceReport(t: string, p: string, y: number, s: Date, e: Date) {
    return this.generateReport(t, {
      reportType: 'ATTENDANCE_SUMMARY',
      reportPeriod: p,
      reportYear: y,
      startDate: day(s),
      endDate: day(e),
    });
  }
  generateTeacherDataReport(t: string, p: string, y: number) {
    return this.generateReport(t, {
      reportType: 'TEACHER_DATA_REPORT',
      reportPeriod: p,
      reportYear: y,
    });
  }
  generateExaminationReport(t: string, p: string, y: number, termId: string) {
    return this.generateReport(t, {
      reportType: 'EXAMINATION_ANALYSIS',
      reportPeriod: p,
      reportYear: y,
      termId,
    });
  }
  generateFinancialReport(t: string, p: string, y: number, m?: number) {
    return this.generateReport(t, {
      reportType: 'FINANCIAL_SUMMARY',
      reportPeriod: p,
      reportYear: y,
      reportMonth: m,
    });
  }
  private async report(db: Db, tenantId: string, id: string) {
    const row = await db.complianceReport.findFirst({ where: { tenantId, id } });
    if (!row) throw new NotFoundException('Report not found');
    return row;
  }
  getReports(tenantId: string, reportType?: ComplianceReportType, status?: ReportStatus) {
    return this.prisma.complianceReport.findMany({
      where: { tenantId, ...(reportType ? { reportType } : {}), ...(status ? { status } : {}) },
      select: {
        id: true,
        tenantId: true,
        reportType: true,
        reportPeriod: true,
        reportYear: true,
        reportMonth: true,
        reportQuarter: true,
        status: true,
        approvedBy: true,
        approvedAt: true,
        submittedTo: true,
        submittedAt: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        isAutomated: true,
        metadata: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async getReport(tenantId: string, id: string) {
    const row = await this.report(this.prisma, tenantId, id);
    const [exports, history] = await Promise.all([
      this.prisma.complianceExport.findMany({
        where: { tenantId, reportId: id },
        select: {
          id: true,
          filename: true,
          format: true,
          templateId: true,
          contentHash: true,
          validation: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.complianceLedger.findMany({
        where: { tenantId, entityType: 'REPORT', entityId: id },
        orderBy: { sequence: 'asc' },
      }),
    ]);
    return { ...row, exports, history };
  }
  async action(tenantId: string, actorId: string, id: string, action: string, notes?: string) {
    return atomic(this.prisma, tenantId, async (tx) => {
      const row = await this.report(tx, tenantId, id),
        meta = (row.metadata as any) || {};
      const transitions: Record<string, { from: string[]; to: ReportStatus }> = {
        REQUEST_REVIEW: { from: ['DRAFT'], to: 'PENDING_APPROVAL' },
        APPROVE: { from: ['PENDING_APPROVAL'], to: 'APPROVED' },
        REJECT: { from: ['PENDING_APPROVAL'], to: 'REJECTED' },
        REOPEN: { from: ['REJECTED'], to: 'DRAFT' },
      };
      const transition = transitions[action];
      if (!transition || !transition.from.includes(row.status))
        throw new ConflictException('Action is not available for the current report status');
      if (action === 'REJECT' && !notes?.trim())
        throw new BadRequestException('Enter the reason for rejection');
      if (action === 'APPROVE' && meta.reviewRequestedBy === actorId)
        throw new ForbiddenException('Another school manager must approve this report');
      if (action === 'REOPEN' && meta.manualSubmission)
        throw new ConflictException(
          'Generate a corrected replacement to preserve submitted evidence'
        );
      const saved = await tx.complianceReport.update({
        where: { id, tenantId },
        data: {
          status: transition.to,
          metadata: {
            ...meta,
            ...(action === 'REQUEST_REVIEW' ? { reviewRequestedBy: actorId } : {}),
          },
          ...(action === 'APPROVE'
            ? { approvedBy: actorId, approvedAt: new Date() }
            : { approvedBy: null, approvedAt: null }),
        },
      });
      await append(tx, tenantId, actorId, 'REPORT', id, action, {
        from: row.status,
        to: saved.status,
        notes: notes?.trim() || null,
      });
      return saved;
    });
  }
  approveReport(tenantId: string, id: string, userId: string) {
    return this.action(tenantId, userId, id, 'APPROVE');
  }
  async submitReport(_reportId: string, _userId: string): Promise<never> {
    throw new NotImplementedException(
      'Direct government submission is unavailable. Upload the reviewed file manually and record its portal receipt.'
    );
  }
  async validateExport(tenantId: string, id: string, templateId: string) {
    return exportRows(await this.report(this.prisma, tenantId, id), templateId).validation;
  }
  async exportPortalData(tenantId: string, actorId: string, dto: ExportPortalDataDto) {
    if (!['xlsx', 'csv', 'json'].includes(dto.format || 'xlsx'))
      throw new BadRequestException('Choose CSV, XLSX or JSON');
    return atomic(this.prisma, tenantId, async (tx) => {
      const row = await this.report(tx, tenantId, dto.reportId),
        { table, validation } = exportRows(row, dto.templateId),
        format = dto.format || 'xlsx';
      if (!validation.ready)
        throw new BadRequestException({
          message: 'Resolve source errors and generate a corrected report',
          validation,
        });
      const content =
        format === 'csv'
          ? csv(table)
          : format === 'xlsx'
            ? xlsx(table)
            : Buffer.from(
                JSON.stringify(
                  {
                    reference: row.id,
                    type: row.reportType,
                    period: row.reportPeriod,
                    data: row.reportData,
                    validation,
                  },
                  null,
                  2
                )
              );
      const contentType =
        format === 'csv'
          ? 'text/csv;charset=utf-8'
          : format === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/json';
      const file = await tx.complianceExport.create({
        data: {
          tenantId,
          reportId: row.id,
          templateId: dto.templateId,
          format,
          filename: `${dto.templateId}_${row.id}.${format}`,
          contentType,
          content,
          contentHash: sha(content),
          validation: json(validation),
          createdBy: actorId,
        },
      });
      await append(tx, tenantId, actorId, 'REPORT', row.id, 'EXPORTED', {
        exportId: file.id,
        contentHash: file.contentHash,
        templateId: file.templateId,
        approved: row.status === 'APPROVED',
        validation,
      });
      return {
        id: file.id,
        filename: file.filename,
        contentHash: file.contentHash,
        validation,
        downloadUrl: `/government/compliance/downloads/${file.id}`,
      };
    });
  }
  async download(tenantId: string, id: string) {
    const file = await this.prisma.complianceExport.findFirst({ where: { tenantId, id } });
    if (!file) throw new NotFoundException('Export not found');
    if (sha(file.content) !== file.contentHash)
      throw new ConflictException('Export integrity check failed');
    return file;
  }
  private evidence(url?: string) {
    if (url && !/^https:\/\/[^\s]+$/i.test(url))
      throw new BadRequestException('Evidence must be an HTTPS document link');
  }
  async recordSubmission(tenantId: string, actorId: string, dto: ManualSubmissionDto) {
    if (!dto.portalFormatReviewed)
      throw new BadRequestException(
        'Confirm that you reviewed the portal format and uploaded this file'
      );
    if (!dto.portal.trim() || !dto.receiptReference.trim())
      throw new BadRequestException('Portal and receipt reference are required');
    const submittedAt = new Date(dto.submittedAt);
    this.evidence(dto.evidenceUrl);
    if (!Number.isFinite(submittedAt.getTime()) || submittedAt > new Date())
      throw new BadRequestException('Submission time must be a valid past time');
    return atomic(this.prisma, tenantId, async (tx) => {
      const row = await this.report(tx, tenantId, dto.reportId),
        metadata = (row.metadata as any) || {};
      if (
        row.status === 'SUBMITTED' &&
        metadata.manualSubmission?.exportId === dto.exportId &&
        metadata.manualSubmission?.receiptReference === dto.receiptReference &&
        metadata.manualSubmission?.portal === dto.portal
      )
        return row;
      if (row.status !== 'APPROVED')
        throw new ConflictException('Approve the report before recording manual submission');
      const file = await tx.complianceExport.findFirst({
        where: { tenantId, id: dto.exportId, reportId: row.id },
      });
      if (!file || !(file.validation as any).ready || sha(file.content) !== file.contentHash)
        throw new BadRequestException('Choose a valid saved export for this report');
      if (!row.approvedAt || file.createdAt < row.approvedAt || submittedAt < row.approvedAt)
        throw new ConflictException(
          'Export and upload the approved version before recording its receipt'
        );
      const manualSubmission = {
        ...dto,
        contentHash: file.contentHash,
        recordedBy: actorId,
        recordedAt: new Date(),
      };
      const saved = await tx.complianceReport.update({
        where: { id: row.id, tenantId },
        data: {
          status: 'SUBMITTED',
          submittedTo: dto.portal.trim(),
          submittedAt,
          submittedBy: actorId,
          metadata: json({ ...metadata, manualSubmission }),
        },
      });
      await append(tx, tenantId, actorId, 'REPORT', row.id, 'MANUALLY_SUBMITTED', manualSubmission);
      return saved;
    });
  }
  async recordOutcome(tenantId: string, actorId: string, dto: SubmissionOutcomeDto) {
    if (!dto.notes.trim()) throw new BadRequestException('Record the portal response');
    this.evidence(dto.evidenceUrl);
    return atomic(this.prisma, tenantId, async (tx) => {
      const row = await this.report(tx, tenantId, dto.reportId);
      if (row.status !== 'SUBMITTED')
        throw new ConflictException('Only submitted reports can receive a portal outcome');
      const saved = await tx.complianceReport.update({
        where: { id: row.id, tenantId },
        data: {
          status: dto.status,
          metadata: json({
            ...((row.metadata as any) || {}),
            outcome: { ...dto, actorId, recordedAt: new Date() },
          }),
        },
      });
      await append(tx, tenantId, actorId, 'REPORT', row.id, 'PORTAL_' + dto.status, dto);
      return saved;
    });
  }
  async createChecklist(
    tenantId: string,
    title: string,
    description: string,
    complianceArea: ComplianceArea,
    requiredBy: string,
    frequency: string,
    dueDate?: Date,
    actorId = 'SYSTEM'
  ) {
    if (
      !title.trim() ||
      !requiredBy.trim() ||
      !['DAILY', 'WEEKLY', 'MONTHLY', 'TERMLY', 'ANNUAL', 'ONCE'].includes(frequency)
    )
      throw new BadRequestException('Enter a title, authority and supported frequency');
    return atomic(this.prisma, tenantId, async (tx) => {
      const row = await tx.complianceChecklist.create({
        data: {
          tenantId,
          title: title.trim(),
          description,
          complianceArea,
          requiredBy,
          frequency,
          dueDate,
        },
      });
      await append(tx, tenantId, actorId, 'CHECKLIST', row.id, 'CREATED', row);
      return row;
    });
  }
  getChecklists(tenantId: string, complianceArea?: ComplianceArea, status?: ChecklistStatus) {
    return this.prisma.complianceChecklist.findMany({
      where: {
        tenantId,
        ...(complianceArea ? { complianceArea } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { dueDate: 'asc' },
    });
  }
  async getChecklist(tenantId: string, id: string) {
    const row = await this.prisma.complianceChecklist.findFirst({ where: { tenantId, id } });
    if (!row) throw new NotFoundException('Checklist item not found');
    return row;
  }
  async completeChecklist(
    tenantId: string,
    id: string,
    actorId: string,
    evidence?: any,
    notes?: string
  ) {
    return atomic(this.prisma, tenantId, async (tx) => {
      const row = await tx.complianceChecklist.findFirst({ where: { tenantId, id } });
      if (!row) throw new NotFoundException('Checklist item not found');
      if (row.status === 'COMPLETED') return row;
      const saved = await tx.complianceChecklist.update({
        where: { id, tenantId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedBy: actorId,
          evidence,
          notes,
        },
      });
      await append(tx, tenantId, actorId, 'CHECKLIST', id, 'COMPLETED', {
        evidence: evidence || null,
        notes: notes || null,
      });
      return saved;
    });
  }
  async runDataQualityAudit(
    tenantId: string,
    auditType: DataAuditType,
    actorId = 'SYSTEM',
    idempotencyKey?: string
  ) {
    if (
      ![
        'STUDENT_DATA',
        'STAFF_DATA',
        'SCHOOL_PROFILE',
        'ATTENDANCE_DATA',
        'EXAMINATION_DATA',
        'FULL_AUDIT',
      ].includes(auditType)
    )
      throw new BadRequestException('Unsupported audit type');
    return atomic(this.prisma, tenantId, async (tx) => {
      if (idempotencyKey) {
        const previous = await tx.complianceLedger.findFirst({
          where: {
            tenantId,
            action: 'AUDIT_COMPLETED',
            payload: { path: ['idempotencyKey'], equals: idempotencyKey },
          },
        });
        if (previous)
          return tx.dataQualityAudit.findFirst({ where: { tenantId, id: previous.entityId } });
      }
      const results = await auditData(tx, tenantId, auditType);
      const row = await tx.dataQualityAudit.create({
        data: {
          tenantId,
          auditType,
          entityType: auditType,
          completeness: results.completeness,
          accuracy: results.accuracy,
          consistency: results.consistency,
          overallScore: results.overallScore,
          issuesFound: results.issues.length,
          criticalIssues: results.issues.filter((i) => i.severity === 'ERROR').length,
          warningIssues: results.issues.filter((i) => i.severity === 'WARNING').length,
          issues: json(results),
          status: results.issues.length ? 'REQUIRES_ACTION' : 'COMPLETED',
        },
      });
      await append(tx, tenantId, actorId, 'AUDIT', row.id, 'AUDIT_COMPLETED', {
        overallScore: row.overallScore,
        idempotencyKey: idempotencyKey || null,
      });
      return row;
    });
  }
  getAudits(tenantId: string, limit = 50) {
    return this.prisma.dataQualityAudit.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: Math.max(1, Math.min(Number(limit) || 50, 100)),
    });
  }
  async getAudit(tenantId: string, id: string) {
    const row = await this.prisma.dataQualityAudit.findFirst({ where: { tenantId, id } });
    if (!row) throw new NotFoundException('Audit not found');
    return row;
  }
  async resolveAudit(tenantId: string, id: string, actorId: string) {
    const previous = await this.getAudit(tenantId, id),
      current = await this.runDataQualityAudit(tenantId, previous.auditType, actorId);
    if (!current) throw new ConflictException('Audit could not be rerun');
    await atomic(this.prisma, tenantId, async (tx) => {
      await tx.dataQualityAudit.update({
        where: { id, tenantId },
        data: {
          status: current.issuesFound ? 'REQUIRES_ACTION' : 'COMPLETED',
          resolvedIssues: Math.max(0, previous.issuesFound - current.issuesFound),
          resolvedAt: current.issuesFound ? null : new Date(),
        },
      });
      await append(tx, tenantId, actorId, 'AUDIT', id, 'REAUDITED', {
        latestAuditId: current.id,
        remainingIssues: current.issuesFound,
      });
    });
    return current;
  }
  createAlert(
    tenantId: string,
    alertType: ComplianceAlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    relatedEntity?: string,
    relatedEntityId?: string
  ) {
    return this.prisma.complianceAlert.create({
      data: {
        tenantId,
        alertType,
        severity,
        title,
        message,
        relatedEntity,
        relatedEntityId,
        actionRequired: ['CRITICAL', 'ERROR'].includes(severity),
        status: 'ACTIVE',
      },
    });
  }
  getAlerts(tenantId: string, status?: AlertStatus) {
    return this.prisma.complianceAlert.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }
  private async alertAction(
    tenantId: string,
    id: string,
    actorId: string,
    status: AlertStatus,
    notes?: string
  ) {
    return atomic(this.prisma, tenantId, async (tx) => {
      const row = await tx.complianceAlert.findFirst({ where: { tenantId, id } });
      if (!row) throw new NotFoundException('Alert not found');
      if (row.status === status) return row;
      if (row.status === 'RESOLVED') throw new ConflictException('Alert is already resolved');
      if (status === 'RESOLVED' && !notes?.trim())
        throw new BadRequestException('Record how this alert was resolved');
      const saved = await tx.complianceAlert.update({
        where: { id, tenantId },
        data:
          status === 'ACKNOWLEDGED'
            ? { status, acknowledgedBy: actorId, acknowledgedAt: new Date() }
            : { status, resolvedBy: actorId, resolvedAt: new Date(), resolutionNotes: notes },
      });
      await append(tx, tenantId, actorId, 'ALERT', id, status, { notes: notes || null });
      return saved;
    });
  }
  acknowledgeAlert(tenantId: string, id: string, actorId: string) {
    return this.alertAction(tenantId, id, actorId, 'ACKNOWLEDGED');
  }
  resolveAlert(tenantId: string, id: string, actorId: string, notes: string) {
    return this.alertAction(tenantId, id, actorId, 'RESOLVED', notes);
  }
  async checkDeadlines(tenantId: string, now = new Date()) {
    return atomic(this.prisma, tenantId, async (tx) => {
      const horizon = new Date(now.getTime() + 7 * 86400000);
      const [reports, lists] = await Promise.all([
        tx.complianceReport.findMany({
          where: {
            tenantId,
            dueDate: { lte: horizon },
            status: { in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] },
          },
        }),
        tx.complianceChecklist.findMany({
          where: {
            tenantId,
            dueDate: { lte: horizon },
            status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] },
          },
        }),
      ]);
      const candidates = [
        ...reports.map((r) => ({
          id: r.id,
          title: r.reportPeriod,
          dueDate: r.dueDate,
          entity: 'REPORT',
        })),
        ...lists.map((r) => ({
          id: r.id,
          title: r.title,
          dueDate: r.dueDate,
          entity: 'CHECKLIST',
        })),
      ];
      let created = 0;
      for (const row of candidates) {
        const overdue = day(row.dueDate!) < day(now),
          alertType = overdue ? 'REPORT_DUE' : 'DEADLINE_APPROACHING';
        if (
          !(await tx.complianceAlert.findFirst({
            where: { tenantId, relatedEntity: row.entity, relatedEntityId: row.id, alertType },
          }))
        ) {
          await tx.complianceAlert.create({
            data: {
              tenantId,
              alertType,
              severity: overdue ? 'ERROR' : 'WARNING',
              title: `${overdue ? 'Overdue' : 'Due soon'}: ${row.title}`,
              message: `Due ${day(row.dueDate!)}. Review and complete this school reporting task.`,
              relatedEntity: row.entity,
              relatedEntityId: row.id,
              actionRequired: true,
              actionUrl: '/dashboard/compliance',
            },
          });
          created++;
        }
        if (overdue && row.entity === 'CHECKLIST')
          await tx.complianceChecklist.update({
            where: { id: row.id, tenantId },
            data: { status: 'OVERDUE' },
          });
      }
      if (created)
        await append(tx, tenantId, 'SYSTEM', 'DEADLINES', tenantId, 'REMINDERS_CREATED', {
          created,
        });
      return { checked: candidates.length, created };
    });
  }
  async dashboard(tenantId: string) {
    const [reports, checklists, alerts, audits] = await Promise.all([
      this.getReports(tenantId),
      this.getChecklists(tenantId),
      this.getAlerts(tenantId),
      this.getAudits(tenantId, 1),
    ]);
    return {
      externalApiAvailable: false,
      reports: { total: reports.length, ...countBy(reports, 'status') },
      checklists: { total: checklists.length, ...countBy(checklists, 'status') },
      alerts: { total: alerts.length, ...countBy(alerts, 'status') },
      latestAudit: audits[0] || null,
    };
  }
  getAuditTrail(tenantId: string, entityType?: string) {
    return this.prisma.complianceLedger.findMany({
      where: { tenantId, ...(entityType ? { entityType } : {}) },
      orderBy: { sequence: 'desc' },
      take: 500,
    });
  }
  async verifyAuditChain(tenantId: string) {
    return atomic(this.prisma, tenantId, async (tx) => {
      const rows = await tx.complianceLedger.findMany({
        where: { tenantId },
        orderBy: { sequence: 'asc' },
      });
      let previousHash = GENESIS;
      for (let i = 0; i < rows.length; i++) {
        const { currentHash, ...event } = rows[i];
        if (
          event.sequence !== i + 1 ||
          event.previousHash !== previousHash ||
          currentHash !== sha(stable(json(event)))
        )
          return {
            isValid: false,
            tamperingDetected: true,
            brokenSequence: event.sequence,
            totalBlocksVerified: i,
          };
        previousHash = currentHash;
      }
      const reports = await tx.complianceReport.findMany({ where: { tenantId } });
      const generated = new Map(
        rows
          .filter((event) => event.entityType === 'REPORT' && event.action === 'GENERATED')
          .map((event) => [event.entityId, (event.payload as any).contentHash])
      );
      const actual = new Map(reports.map((report) => [report.id, report]));
      const altered = [...generated].find(
        ([id, hash]) => !actual.has(id) || hash !== sha(stable(actual.get(id)!.reportData))
      );
      if (altered)
        return {
          isValid: false,
          tamperingDetected: true,
          brokenReportId: altered[0],
          totalBlocksVerified: rows.length,
        };
      const exported = new Map(
        rows
          .filter((event) => event.action === 'EXPORTED')
          .map((event) => [(event.payload as any).exportId, (event.payload as any).contentHash])
      );
      const files = await tx.complianceExport.findMany({ where: { tenantId } }),
        broken = files.find(
          (f) => sha(f.content) !== f.contentHash || exported.get(f.id) !== f.contentHash
        );
      return {
        isValid: !broken,
        tamperingDetected: !!broken,
        brokenExportId: broken?.id || null,
        totalBlocksVerified: rows.length,
        latestHash: previousHash,
        legacyReportsWithoutContentEvidence: reports.filter((report) => !generated.has(report.id))
          .length,
        algorithm: 'SHA-256 append-only chain',
        verifiedAt: new Date().toISOString(),
        scope:
          'Application evidence; privileged database administrators remain outside this integrity boundary',
      };
    });
  }
  async override(tenantId: string, actorId: string, dto: LogAuditRecordOverrideDto) {
    if (!dto.reason.trim() || !Array.isArray(dto.changes) || !dto.changes.length)
      throw new BadRequestException('Provide the correction and justification');
    return atomic(this.prisma, tenantId, async (tx) => {
      if (dto.entityType === 'STAFF_RECORD') {
        const staff = await tx.staff.findFirst({
          where: { tenantId, id: dto.entityId, isTeacher: true },
        });
        if (!staff) throw new NotFoundException('Teacher record not found');
        const current = await tx.udiseStaffRecord.findFirst({
          where: { tenantId, staffId: staff.id },
        });
        const change = dto.changes[0];
        if (
          dto.changes.length !== 1 ||
          change.field !== 'teacherCode' ||
          typeof change.newValue !== 'string' ||
          !/^[A-Z0-9]{6,15}$/i.test(change.newValue)
        )
          throw new BadRequestException(
            'Enter a verified teacher code containing 6–15 letters/digits'
          );
        if ((current?.teacherCode || null) !== (change.oldValue || null))
          throw new ConflictException('Teacher mapping changed. Refresh and review again');
        const duplicate = await tx.udiseStaffRecord.findFirst({
          where: { teacherCode: change.newValue, NOT: { staffId: staff.id } },
        });
        if (duplicate) throw new ConflictException('Teacher code is already assigned');
        let record;
        try {
          record = await tx.udiseStaffRecord.upsert({
            where: { staffId: staff.id },
            create: { tenantId, staffId: staff.id, teacherCode: change.newValue },
            update: { teacherCode: change.newValue },
          });
        } catch (error: any) {
          if (error.code === 'P2002')
            throw new ConflictException('Teacher code is already assigned');
          throw error;
        }
        const event = await append(
          tx,
          tenantId,
          actorId,
          'STAFF_RECORD',
          staff.id,
          'MAPPING_CORRECTED',
          {
            reason: dto.reason,
            changes: dto.changes,
            source: 'Manually reviewed school record; external sync not performed',
          }
        );
        return { record, auditId: event.id, currentHash: event.currentHash };
      }
      const model =
        dto.entityType === 'STUDENT_RECORD'
          ? tx.student
          : dto.entityType === 'GRADE'
            ? tx.grade
            : dto.entityType === 'FEE_PAYMENT'
              ? tx.payment
              : null;
      if (!model) throw new BadRequestException('Unsupported correction type');
      const row: any = await (model.findFirst as any)({ where: { tenantId, id: dto.entityId } });
      if (!row) throw new NotFoundException('School record not found');
      const allowed =
        dto.entityType === 'STUDENT_RECORD'
          ? [
              'firstName',
              'lastName',
              'dateOfBirth',
              'penNumber',
              'apaarId',
              'birthCertNumber',
              'aadhaarLast4',
            ]
          : dto.entityType === 'GRADE'
            ? ['score']
            : ['notes'];
      const data: any = {};
      for (const change of dto.changes) {
        if (
          !allowed.includes(change.field) ||
          Object.prototype.hasOwnProperty.call(data, change.field)
        )
          throw new BadRequestException('Change this field through its dedicated school workflow');
        const old = row[change.field] instanceof Date ? day(row[change.field]) : row[change.field];
        if (stable(old ?? null) !== stable(change.oldValue ?? null))
          throw new ConflictException('Source record changed. Refresh and review again');
        if (change.field === 'score') {
          if (
            typeof change.newValue !== 'number' ||
            !Number.isInteger(change.newValue) ||
            change.newValue < 0 ||
            change.newValue > row.totalMarks ||
            row.totalMarks <= 0
          )
            throw new BadRequestException('Score must be within the subject maximum');
          data.score = change.newValue;
        } else if (change.field === 'dateOfBirth') {
          data.dateOfBirth = parseDate(String(change.newValue));
          if (data.dateOfBirth >= row.admissionDate || data.dateOfBirth > new Date())
            throw new BadRequestException('Birth date must precede admission');
        } else {
          if (change.newValue !== null && typeof change.newValue !== 'string')
            throw new BadRequestException('Enter a text value');
          const value = change.newValue?.trim() ?? null;
          if (['firstName', 'lastName'].includes(change.field) && !value)
            throw new BadRequestException('Name cannot be empty');
          if (value && value.length > 1000) throw new BadRequestException('Correction is too long');
          if (value && change.field === 'apaarId' && !/^\d{12}$/.test(value))
            throw new BadRequestException('APAAR must contain 12 digits');
          if (value && change.field === 'aadhaarLast4' && !/^\d{4}$/.test(value))
            throw new BadRequestException('Store only the final four Aadhaar digits');
          data[change.field] = value;
        }
      }
      if (dto.entityType === 'GRADE') {
        const exam = await tx.examination.findFirst({ where: { tenantId, id: row.examinationId } });
        if (!exam || exam.isPublished)
          throw new ConflictException(
            'Review and unpublish the examination through the examination workflow before correcting marks'
          );
        data.marks = data.score;
        data.percentage = round((data.score / row.totalMarks) * 100);
        data.letterGrade =
          data.percentage >= 91
            ? 'A1'
            : data.percentage >= 81
              ? 'A2'
              : data.percentage >= 71
                ? 'B1'
                : data.percentage >= 61
                  ? 'B2'
                  : data.percentage >= 51
                    ? 'C1'
                    : data.percentage >= 41
                      ? 'C2'
                      : data.percentage >= 33
                        ? 'D'
                        : 'E';
        data.grade = data.letterGrade;
      }
      const unchanged = Object.fromEntries(
        dto.changes.map((change) => [change.field, row[change.field]])
      );
      const changed = await (model.updateMany as any)({
        where: { id: row.id, tenantId, ...unchanged },
        data,
      });
      if (!changed.count)
        throw new ConflictException('Source record changed. Refresh and review again');
      const updated = await (model.findFirst as any)({ where: { id: row.id, tenantId } });
      const event = await append(tx, tenantId, actorId, dto.entityType, row.id, 'CORRECTED', {
        reason: dto.reason.trim(),
        approvalRef: dto.approvalRef || null,
        changes: dto.changes,
      });
      return {
        record: updated,
        auditId: event.id,
        currentHash: event.currentHash,
        notice:
          'Existing snapshots are preserved. Generate a replacement report to include corrected source data.',
      };
    });
  }

  getManualBoardRecords(tenantId: string) {
    return this.prisma.complianceLedger.findMany({
      where: { tenantId, entityType: 'BOARD_RECORD' },
      orderBy: { sequence: 'desc' },
      take: 500,
    });
  }
  async recordManualBoard(tenantId: string, actorId: string, dto: ManualBoardRecordDto) {
    this.evidence(dto.evidenceUrl);
    if (!dto.portalReference.trim() || !dto.notes.trim())
      throw new BadRequestException('Record the official reference and your verification notes');
    if (dto.kind !== 'TIMETABLE' && (!dto.studentId || !dto.candidateNumber?.trim()))
      throw new BadRequestException(
        'Choose a school student and enter the official candidate number'
      );
    if (
      dto.kind === 'RESULT' &&
      (!dto.subjectCode?.trim() ||
        dto.marks === undefined ||
        !dto.totalMarks ||
        dto.marks > dto.totalMarks)
    )
      throw new BadRequestException('Enter the subject and marks within the maximum');
    if (dto.kind === 'TIMETABLE') {
      if (
        !dto.examDate ||
        !dto.subjectCode?.trim() ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(dto.startTime || '') ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(dto.endTime || '') ||
        dto.startTime! >= dto.endTime!
      )
        throw new BadRequestException(
          'Enter a subject, valid exam date and ordered start/end times'
        );
      if (parseDate(dto.examDate).getUTCFullYear() !== dto.examYear)
        throw new BadRequestException('Exam date must match the examination year');
    }
    return atomic(this.prisma, tenantId, async (tx) => {
      const student = dto.studentId
        ? await tx.student.findFirst({ where: { tenantId, id: dto.studentId, deletedAt: null } })
        : null;
      if (dto.studentId && !student) throw new NotFoundException('Student not found');
      if (
        dto.replacesId &&
        !(await tx.complianceLedger.findFirst({
          where: { tenantId, id: dto.replacesId, entityType: 'BOARD_RECORD' },
        }))
      )
        throw new NotFoundException('Previous board record not found');
      const dedupKey = sha(stable(json(dto))),
        previous = await tx.complianceLedger.findFirst({
          where: {
            tenantId,
            entityType: 'BOARD_RECORD',
            payload: { path: ['dedupKey'], equals: dedupKey },
          },
        });
      if (previous) return previous;
      return append(
        tx,
        tenantId,
        actorId,
        'BOARD_RECORD',
        dto.studentId || `${dto.examLevel}-${dto.examYear}`,
        'BOARD_MANUALLY_RECORDED',
        {
          ...dto,
          dedupKey,
          studentName: student ? [student.firstName, student.lastName].join(' ') : null,
          admissionNumber: student?.admissionNumber || null,
          source: 'Official portal/document entered and reviewed manually; no external API call',
        }
      );
    });
  }
}
