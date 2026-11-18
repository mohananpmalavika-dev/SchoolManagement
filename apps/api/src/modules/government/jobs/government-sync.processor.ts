import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { ComplianceReportType } from '@prisma/client';
import { Job } from 'bull';

import { BoardExamService } from '../services/board-exam.service';
import { ComplianceService } from '../services/compliance.service';
import { UdiseService } from '../services/udise.service';

@Processor('government-sync')
export class GovernmentSyncProcessor {
  private readonly logger = new Logger(GovernmentSyncProcessor.name);

  constructor(
    private readonly udiseService: UdiseService,
    private readonly boardExamService: BoardExamService,
    private readonly complianceService: ComplianceService
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}...`);
  }

  @OnQueueCompleted()
  onComplete(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnQueueFailed()
  onError(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
  }

  @Process('udise-full-sync')
  async processUdiseFullSync(job: Job<{ tenantId: string }>) {
    const { tenantId } = job.data;
    this.logger.log(`Starting UDISE+ full sync for tenant: ${tenantId}`);

    try {
      const result = await this.udiseService.performFullSync(tenantId);
      const errors = result.results?.errors || [];

      if (errors.length > 0) {
        await this.complianceService.createAlert(
          tenantId,
          'SYNC_FAILURE',
          'WARNING',
          'UDISE+ Sync Completed with Errors',
          `UDISE+ sync completed but encountered ${errors.length} error(s)`,
          'UDISE_SYNC',
          tenantId
        );
      }

      return result;
    } catch (error: any) {
      this.logger.error(`UDISE+ full sync failed for tenant ${tenantId}: ${error.message}`);
      await this.complianceService.createAlert(
        tenantId,
        'SYNC_FAILURE',
        'CRITICAL',
        'UDISE+ Sync Failed',
        `UDISE+ sync failed: ${error.message}`,
        'UDISE_SYNC',
        tenantId
      );
      throw error;
    }
  }

  @Process('udise-student-sync')
  async processUdiseStudentSync(job: Job<{ tenantId: string }>) {
    const { tenantId } = job.data;
    return this.udiseService.syncStudentEnrollment(tenantId);
  }

  @Process('udise-teacher-sync')
  async processUdiseTeacherSync(job: Job<{ tenantId: string }>) {
    const { tenantId } = job.data;
    return this.udiseService.syncTeacherData(tenantId);
  }

  @Process('udise-attendance-sync')
  async processUdiseAttendanceSync(job: Job<{ tenantId: string; startDate: Date; endDate: Date }>) {
    const { tenantId, startDate, endDate } = job.data;
    return this.udiseService.syncAttendanceData(tenantId, new Date(startDate), new Date(endDate));
  }

  @Process('board-results-download')
  async processBoardResultsDownload(
    job: Job<{ tenantId: string; examYear: number; examLevel: string }>
  ) {
    const { tenantId, examYear, examLevel } = job.data;
    const result = await this.boardExamService.downloadResults(
      tenantId,
      examYear,
      examLevel as any
    );

    if (result.succeeded > 0) {
      await this.complianceService.createAlert(
        tenantId,
        'SYNC_FAILURE',
        'INFO',
        'Board Exam Results Available',
        `Downloaded ${result.succeeded} examination results for ${examLevel} ${examYear}`,
        'BOARD_RESULTS',
        tenantId
      );
    }

    return result;
  }

  @Process('generate-compliance-report')
  async processGenerateComplianceReport(
    job: Job<{
      tenantId: string;
      reportType: string;
      reportPeriod: string;
      reportYear: number;
      reportMonth?: number;
      startDate?: Date;
      endDate?: Date;
    }>
  ) {
    const { tenantId, reportType, reportPeriod, reportYear, reportMonth, startDate, endDate } =
      job.data;
    if (reportType === 'ATTENDANCE_SUMMARY' && (!startDate || !endDate))
      throw new BadRequestException('Attendance job requires explicit period dates');
    return this.complianceService.generateReport(
      tenantId,
      {
        reportType: reportType as ComplianceReportType,
        reportPeriod,
        reportYear,
        reportMonth,
        ...(startDate ? { startDate: new Date(startDate).toISOString().slice(0, 10) } : {}),
        ...(endDate ? { endDate: new Date(endDate).toISOString().slice(0, 10) } : {}),
      },
      'SYSTEM',
      `job-${job.id}`
    );
  }

  @Process('data-quality-audit')
  async processDataQualityAudit(job: Job<{ tenantId: string; auditType: string }>) {
    return this.complianceService.runDataQualityAudit(
      job.data.tenantId,
      job.data.auditType as any,
      'SYSTEM',
      `job-${job.id}`
    );
  }

  @Process('check-compliance-deadlines')
  processComplianceDeadlines(job: Job<{ tenantId: string }>) {
    return this.complianceService.checkDeadlines(job.data.tenantId);
  }
}
