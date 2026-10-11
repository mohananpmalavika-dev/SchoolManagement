import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '@krypton/database';

/**
 * Scheduler service for automated government integration tasks
 */
@Injectable()
export class GovernmentSchedulerService {
  private readonly logger = new Logger(GovernmentSchedulerService.name);

  constructor(
    @InjectQueue('government-sync') private readonly syncQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Schedule NEMIS sync jobs based on tenant configuration
   * Runs every hour to check if any tenant needs syncing
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduleNemisSync() {
    this.logger.log('Checking for NEMIS sync schedules...');

    try {
      const integrations = await this.prisma.nemisIntegration.findMany({
        where: {
          isEnabled: true,
          autoSync: true,
        },
      });

      for (const integration of integrations) {
        const shouldSync = this.shouldPerformSync(
          integration.syncFrequency,
          integration.syncTime,
          integration.lastSyncAt,
        );

        if (shouldSync) {
          this.logger.log(`Scheduling NEMIS sync for tenant: ${integration.tenantId}`);
          
          await this.syncQueue.add('nemis-full-sync', {
            tenantId: integration.tenantId,
          }, {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error scheduling NEMIS sync: ${error.message}`);
    }
  }

  /**
   * Check for compliance report deadlines
   * Runs daily at 8 AM
   */
  @Cron('0 8 * * *')
  async checkComplianceDeadlines() {
    this.logger.log('Checking compliance deadlines...');

    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      for (const tenant of tenants) {
        await this.syncQueue.add('check-compliance-deadlines', {
          tenantId: tenant.id,
        }, {
          attempts: 2,
          removeOnComplete: true,
        });
      }
    } catch (error) {
      this.logger.error(`Error checking compliance deadlines: ${error.message}`);
    }
  }

  /**
   * Run weekly data quality audits
   * Runs every Monday at 2 AM
   */
  @Cron('0 2 * * 1')
  async runWeeklyDataAudits() {
    this.logger.log('Running weekly data quality audits...');

    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      for (const tenant of tenants) {
        await this.syncQueue.add('data-quality-audit', {
          tenantId: tenant.id,
          auditType: 'FULL_AUDIT',
        }, {
          attempts: 2,
          removeOnComplete: true,
        });
      }
    } catch (error) {
      this.logger.error(`Error running data quality audits: ${error.message}`);
    }
  }

  /**
   * Generate monthly compliance reports
   * Runs on the 1st of each month at 3 AM
   */
  @Cron('0 3 1 * *')
  async generateMonthlyReports() {
    this.logger.log('Generating monthly compliance reports...');

    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      const reportPeriod = `${lastMonth.toLocaleString('default', { month: 'long' })} ${lastMonth.getFullYear()}`;
      const reportYear = lastMonth.getFullYear();
      const reportMonth = lastMonth.getMonth() + 1;

      for (const tenant of tenants) {
        // Generate enrollment report
        await this.syncQueue.add('generate-compliance-report', {
          tenantId: tenant.id,
          reportType: 'ENROLLMENT_STATISTICS',
          reportPeriod,
          reportYear,
          reportMonth,
        }, {
          attempts: 2,
          removeOnComplete: true,
        });

        // Generate attendance report
        await this.syncQueue.add('generate-compliance-report', {
          tenantId: tenant.id,
          reportType: 'ATTENDANCE_SUMMARY',
          reportPeriod,
          reportYear,
          reportMonth,
          startDate: lastMonth,
          endDate: lastMonthEnd,
        }, {
          attempts: 2,
          removeOnComplete: true,
        });

        // Generate financial report
        await this.syncQueue.add('generate-compliance-report', {
          tenantId: tenant.id,
          reportType: 'FINANCIAL_SUMMARY',
          reportPeriod,
          reportYear,
          reportMonth,
        }, {
          attempts: 2,
          removeOnComplete: true,
        });
      }
    } catch (error) {
      this.logger.error(`Error generating monthly reports: ${error.message}`);
    }
  }

  /**
   * Check for KNEC results availability
   * Runs daily at 6 AM during exam result release periods
   */
  @Cron('0 6 * * *')
  async checkKnecResults() {
    this.logger.log('Checking for KNEC results...');

    try {
      // Check for registrations that might have results available
      const registrations = await this.prisma.knecExamRegistration.findMany({
        where: {
          registrationStatus: 'APPROVED',
          resultsAvailable: false,
          // Check exams from last 6 months
          createdAt: {
            gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
          },
        },
        distinct: ['tenantId', 'examYear', 'examLevel'],
        select: {
          tenantId: true,
          examYear: true,
          examLevel: true,
        },
      });

      for (const reg of registrations) {
        await this.syncQueue.add('knec-results-download', {
          tenantId: reg.tenantId,
          examYear: reg.examYear,
          examLevel: reg.examLevel,
        }, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 10000,
          },
          removeOnComplete: true,
        });
      }
    } catch (error) {
      this.logger.error(`Error checking KNEC results: ${error.message}`);
    }
  }

  /**
   * Sync daily attendance to NEMIS
   * Runs every day at 11 PM to sync the day's attendance
   */
  @Cron('0 23 * * *')
  async syncDailyAttendance() {
    this.logger.log('Syncing daily attendance to NEMIS...');

    try {
      const integrations = await this.prisma.nemisIntegration.findMany({
        where: {
          isEnabled: true,
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      for (const integration of integrations) {
        await this.syncQueue.add('nemis-attendance-sync', {
          tenantId: integration.tenantId,
          startDate: today,
          endDate: tomorrow,
        }, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
        });
      }
    } catch (error) {
      this.logger.error(`Error syncing daily attendance: ${error.message}`);
    }
  }

  /**
   * Manual scheduling methods
   */

  /**
   * Schedule immediate NEMIS full sync
   */
  async scheduleNemisFullSync(tenantId: string) {
    return this.syncQueue.add('nemis-full-sync', {
      tenantId,
    }, {
      priority: 1,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  /**
   * Schedule NEMIS student sync
   */
  async scheduleNemisStudentSync(tenantId: string) {
    return this.syncQueue.add('nemis-student-sync', {
      tenantId,
    }, {
      priority: 2,
      attempts: 3,
    });
  }

  /**
   * Schedule NEMIS teacher sync
   */
  async scheduleNemisTeacherSync(tenantId: string) {
    return this.syncQueue.add('nemis-teacher-sync', {
      tenantId,
    }, {
      priority: 2,
      attempts: 3,
    });
  }

  /**
   * Schedule compliance report generation
   */
  async scheduleReportGeneration(
    tenantId: string,
    reportType: string,
    reportPeriod: string,
    reportYear: number,
    options?: any,
  ) {
    return this.syncQueue.add('generate-compliance-report', {
      tenantId,
      reportType,
      reportPeriod,
      reportYear,
      ...options,
    }, {
      priority: 3,
      attempts: 2,
    });
  }

  /**
   * Schedule data quality audit
   */
  async scheduleDataAudit(tenantId: string, auditType: string) {
    return this.syncQueue.add('data-quality-audit', {
      tenantId,
      auditType,
    }, {
      priority: 4,
      attempts: 2,
    });
  }

  /**
   * Schedule KNEC results download
   */
  async scheduleKnecResultsDownload(
    tenantId: string,
    examYear: number,
    examLevel: string,
  ) {
    return this.syncQueue.add('knec-results-download', {
      tenantId,
      examYear,
      examLevel,
    }, {
      priority: 2,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 10000,
      },
    });
  }

  /**
   * Helper method to determine if sync should be performed
   */
  private shouldPerformSync(
    frequency: string,
    syncTime: string | null,
    lastSyncAt: Date | null,
  ): boolean {
    const now = new Date();
    
    // If never synced, sync now
    if (!lastSyncAt) return true;

    const hoursSinceLastSync = (now.getTime() - lastSyncAt.getTime()) / (1000 * 60 * 60);

    switch (frequency) {
      case 'HOURLY':
        return hoursSinceLastSync >= 1;
      
      case 'DAILY':
        // Check if it's the scheduled time (if specified)
        if (syncTime && hoursSinceLastSync >= 24) {
          const [hours, minutes] = syncTime.split(':').map(Number);
          const scheduledTime = new Date();
          scheduledTime.setHours(hours, minutes, 0, 0);
          
          // Sync if we're within 1 hour of the scheduled time
          const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime()) / (1000 * 60);
          return timeDiff <= 60;
        }
        return hoursSinceLastSync >= 24;
      
      case 'WEEKLY':
        return hoursSinceLastSync >= 168; // 7 days
      
      case 'MONTHLY':
        return hoursSinceLastSync >= 720; // 30 days
      
      default:
        return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.syncQueue.getWaitingCount(),
      this.syncQueue.getActiveCount(),
      this.syncQueue.getCompletedCount(),
      this.syncQueue.getFailedCount(),
      this.syncQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Get recent jobs
   */
  async getRecentJobs(limit: number = 50) {
    const jobs = await this.syncQueue.getJobs(
      ['completed', 'failed', 'active', 'waiting'],
      0,
      limit,
    );

    return jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress(),
      attemptsMade: job.attemptsMade,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue,
    }));
  }

  /**
   * Clean completed jobs older than 7 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanOldJobs() {
    this.logger.log('Cleaning old completed jobs...');
    
    try {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      await this.syncQueue.clean(sevenDaysAgo, 'completed');
      await this.syncQueue.clean(sevenDaysAgo, 'failed');
      
      this.logger.log('Old jobs cleaned successfully');
    } catch (error) {
      this.logger.error(`Error cleaning old jobs: ${error.message}`);
    }
  }
}
