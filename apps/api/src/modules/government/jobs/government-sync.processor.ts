import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NemisService } from '../services/nemis.service';
import { KnecService } from '../services/knec.service';
import { ComplianceService } from '../services/compliance.service';

/**
 * Background processor for government integration sync jobs
 */
@Processor('government-sync')
export class GovernmentSyncProcessor {
  private readonly logger = new Logger(GovernmentSyncProcessor.name);

  constructor(
    private readonly nemisService: NemisService,
    private readonly knecService: KnecService,
    private readonly complianceService: ComplianceService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}...`);
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnQueueFailed()
  onError(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
  }

  /**
   * Process NEMIS full sync job
   */
  @Process('nemis-full-sync')
  async processNemisFullSync(job: Job<{ tenantId: string }>) {
    const { tenantId } = job.data;
    this.logger.log(`Starting NEMIS full sync for tenant: ${tenantId}`);

    try {
      const result = await this.nemisService.performFullSync(tenantId);
      
      // Create alerts if there were errors
      if (result.errors && result.errors.length > 0) {
        await this.complianceService.createAlert(
          tenantId,
          'SYNC_FAILURE',
          'WARNING',
          'NEMIS Sync Completed with Errors',
          `NEMIS sync completed but encountered ${result.errors.length} error(s)`,
          'NEMIS_SYNC',
          tenantId,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`NEMIS full sync failed for tenant ${tenantId}: ${error.message}`);
      
      // Create critical alert
      await this.complianceService.createAlert(
        tenantId,
        'SYNC_FAILURE',
        'CRITICAL',
        'NEMIS Sync Failed',
        `NEMIS sync failed: ${error.message}`,
        'NEMIS_SYNC',
        tenantId,
      );

      throw error;
    }
  }

  /**
   * Process NEMIS student sync job
   */
  @Process('nemis-student-sync')
  async processNemisStudentSync(job: Job<{ tenantId: string }>) {
    const { tenantId } = job.data;
    this.logger.log(`Starting NEMIS student sync for tenant: ${tenantId}`);

    try {
      return await this.nemisService.syncStudentEnrollment(tenantId);
    } catch (error) {
      this.logger.error(`NEMIS student sync failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process NEMIS teacher sync job
   */
  @Process('nemis-teacher-sync')
  async processNemisTeacherSync(job: Job<{ tenantId: string }>) {
    const { tenantId } = job.data;
    this.logger.log(`Starting NEMIS teacher sync for tenant: ${tenantId}`);

    try {
      return await this.nemisService.syncTeacherData(tenantId);
    } catch (error) {
      this.logger.error(`NEMIS teacher sync failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process NEMIS attendance sync job
   */
  @Process('nemis-attendance-sync')
  async processNemisAttendanceSync(
    job: Job<{ tenantId: string; startDate: Date; endDate: Date }>,
  ) {
    const { tenantId, startDate, endDate } = job.data;
    this.logger.log(`Starting NEMIS attendance sync for tenant: ${tenantId}`);

    try {
      return await this.nemisService.syncAttendanceData(
        tenantId,
        new Date(startDate),
        new Date(endDate),
      );
    } catch (error) {
      this.logger.error(`NEMIS attendance sync failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process KNEC results download job
   */
  @Process('knec-results-download')
  async processKnecResultsDownload(
    job: Job<{ tenantId: string; examYear: number; examLevel: string }>,
  ) {
    const { tenantId, examYear, examLevel } = job.data;
    this.logger.log(`Downloading KNEC results for tenant: ${tenantId}, ${examLevel} ${examYear}`);

    try {
      const result = await this.knecService.downloadResults(
        tenantId,
        examYear,
        examLevel as any,
      );

      // Create alert if results are available
      if (result.succeeded > 0) {
        await this.complianceService.createAlert(
          tenantId,
          'SYNC_FAILURE',
          'INFO',
          'KNEC Results Available',
          `Downloaded ${result.succeeded} examination results for ${examLevel} ${examYear}`,
          'KNEC_RESULTS',
          tenantId,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`KNEC results download failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process automated compliance report generation
   */
  @Process('generate-compliance-report')
  async processComplianceReport(
    job: Job<{
      tenantId: string;
      reportType: string;
      reportPeriod: string;
      reportYear: number;
      termId?: string;
      startDate?: Date;
      endDate?: Date;
    }>,
  ) {
    const { tenantId, reportType, reportPeriod, reportYear, termId, startDate, endDate } =
      job.data;
    this.logger.log(`Generating ${reportType} report for tenant: ${tenantId}`);

    try {
      let report;

      switch (reportType) {
        case 'ENROLLMENT_STATISTICS':
          report = await this.complianceService.generateEnrollmentReport(
            tenantId,
            reportPeriod,
            reportYear,
          );
          break;

        case 'ATTENDANCE_SUMMARY':
          if (!startDate || !endDate) {
            throw new Error('Start and end dates required for attendance report');
          }
          report = await this.complianceService.generateAttendanceReport(
            tenantId,
            reportPeriod,
            reportYear,
            new Date(startDate),
            new Date(endDate),
          );
          break;

        case 'TEACHER_DATA_REPORT':
          report = await this.complianceService.generateTeacherDataReport(
            tenantId,
            reportPeriod,
            reportYear,
          );
          break;

        case 'EXAMINATION_ANALYSIS':
          if (!termId) {
            throw new Error('Term ID required for examination report');
          }
          report = await this.complianceService.generateExaminationReport(
            tenantId,
            reportPeriod,
            reportYear,
            termId,
          );
          break;

        case 'FINANCIAL_SUMMARY':
          report = await this.complianceService.generateFinancialReport(
            tenantId,
            reportPeriod,
            reportYear,
          );
          break;

        default:
          throw new Error(`Unsupported report type: ${reportType}`);
      }

      // Create alert that report is ready
      await this.complianceService.createAlert(
        tenantId,
        'REPORT_DUE',
        'INFO',
        'Compliance Report Generated',
        `${reportType} report for ${reportPeriod} has been generated and is ready for review`,
        'REPORT',
        report.id,
      );

      return report;
    } catch (error) {
      this.logger.error(`Compliance report generation failed: ${error.message}`);
      
      await this.complianceService.createAlert(
        tenantId,
        'SYSTEM_ERROR',
        'ERROR',
        'Report Generation Failed',
        `Failed to generate ${reportType} report: ${error.message}`,
        'REPORT',
        tenantId,
      );

      throw error;
    }
  }

  /**
   * Process data quality audit job
   */
  @Process('data-quality-audit')
  async processDataQualityAudit(
    job: Job<{ tenantId: string; auditType: string }>,
  ) {
    const { tenantId, auditType } = job.data;
    this.logger.log(`Running ${auditType} audit for tenant: ${tenantId}`);

    try {
      const audit = await this.complianceService.runDataQualityAudit(
        tenantId,
        auditType as any,
      );

      // Create alerts for critical issues
      if (audit.criticalIssues > 0) {
        await this.complianceService.createAlert(
          tenantId,
          'DATA_QUALITY_ISSUE',
          'CRITICAL',
          'Critical Data Quality Issues Found',
          `Data quality audit found ${audit.criticalIssues} critical issue(s) that require immediate attention`,
          'AUDIT',
          audit.id,
        );
      } else if (audit.warningIssues > 0) {
        await this.complianceService.createAlert(
          tenantId,
          'DATA_QUALITY_ISSUE',
          'WARNING',
          'Data Quality Warnings',
          `Data quality audit found ${audit.warningIssues} warning(s) that should be addressed`,
          'AUDIT',
          audit.id,
        );
      }

      return audit;
    } catch (error) {
      this.logger.error(`Data quality audit failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process compliance deadline check job
   */
  @Process('check-compliance-deadlines')
  async processComplianceDeadlineCheck(job: Job<{ tenantId: string }>) {
    const { tenantId } = job.data;
    this.logger.log(`Checking compliance deadlines for tenant: ${tenantId}`);

    try {
      const checklists = await this.complianceService.getChecklists(tenantId);
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      for (const checklist of checklists) {
        if (checklist.dueDate && checklist.status === 'PENDING') {
          const dueDate = new Date(checklist.dueDate);

          // Check if overdue
          if (dueDate < now) {
            await this.complianceService.createAlert(
              tenantId,
              'DEADLINE_APPROACHING',
              'ERROR',
              'Compliance Item Overdue',
              `"${checklist.title}" is overdue. Required by ${checklist.requiredBy}`,
              'CHECKLIST',
              checklist.id,
            );
          }
          // Check if due within 3 days
          else if (dueDate <= threeDaysFromNow) {
            await this.complianceService.createAlert(
              tenantId,
              'DEADLINE_APPROACHING',
              'WARNING',
              'Compliance Deadline Approaching',
              `"${checklist.title}" is due soon. Required by ${checklist.requiredBy}`,
              'CHECKLIST',
              checklist.id,
            );
          }
        }
      }

      return { checked: checklists.length };
    } catch (error) {
      this.logger.error(`Compliance deadline check failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process scheduled report submission
   */
  @Process('submit-scheduled-report')
  async processScheduledReportSubmission(
    job: Job<{ tenantId: string; reportId: string; userId: string }>,
  ) {
    const { tenantId, reportId, userId } = job.data;
    this.logger.log(`Submitting scheduled report ${reportId} for tenant: ${tenantId}`);

    try {
      const report = await this.complianceService.submitReport(reportId, userId);

      await this.complianceService.createAlert(
        tenantId,
        'REPORT_DUE',
        'INFO',
        'Report Submitted',
        `Compliance report has been submitted to ${report.submittedTo}`,
        'REPORT',
        reportId,
      );

      return report;
    } catch (error) {
      this.logger.error(`Report submission failed: ${error.message}`);
      
      await this.complianceService.createAlert(
        tenantId,
        'SYSTEM_ERROR',
        'ERROR',
        'Report Submission Failed',
        `Failed to submit report: ${error.message}`,
        'REPORT',
        reportId,
      );

      throw error;
    }
  }
}
