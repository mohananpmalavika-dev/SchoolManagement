import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Scheduler service for automated Indian government compliance tasks (UDISE+, CBSE/ICSE/State Board)
 */
@Injectable()
export class GovernmentSchedulerService {
  private readonly logger = new Logger(GovernmentSchedulerService.name);

  constructor(
    @InjectQueue('government-sync') private readonly syncQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scheduleUdiseSync() {
    this.logger.log('Checking for UDISE+ sync schedules...');

    try {
      const integrations = await this.prisma.udiseIntegration.findMany({
        where: { isEnabled: true, autoSync: true },
      });

      for (const integration of integrations) {
        const shouldSync = this.shouldPerformSync(
          integration.syncFrequency,
          integration.syncTime,
          integration.lastSyncAt,
        );

        if (shouldSync) {
          this.logger.log(`Scheduling UDISE+ sync for tenant: ${integration.tenantId}`);
          await this.syncQueue.add(
            'udise-full-sync',
            { tenantId: integration.tenantId },
            { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true, removeOnFail: false },
          );
        }
      }
    } catch (error: any) {
      this.logger.error(`Error scheduling UDISE+ sync: ${error.message}`);
    }
  }

  @Cron('0 8 * * *', { timeZone: 'Asia/Kolkata' })
  async checkComplianceDeadlines() {
    this.logger.log('Checking Indian compliance deadlines...');
    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      for (const tenant of tenants) {
        await this.syncQueue.add(
          'check-compliance-deadlines',
          { tenantId: tenant.id },
          { attempts: 2, removeOnComplete: true },
        );
      }
    } catch (error: any) {
      this.logger.error(`Error checking compliance deadlines: ${error.message}`);
    }
  }

  @Cron('0 2 * * 1', { timeZone: 'Asia/Kolkata' })
  async runWeeklyDataAudits() {
    this.logger.log('Running weekly UDISE+ / APAAR data quality audits...');
    try {
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      for (const tenant of tenants) {
        await this.syncQueue.add(
          'data-quality-audit',
          { tenantId: tenant.id, auditType: 'FULL_AUDIT' },
          { attempts: 2, removeOnComplete: true },
        );
      }
    } catch (error: any) {
      this.logger.error(`Error running data quality audits: ${error.message}`);
    }
  }

  @Cron('0 3 1 * *', { timeZone: 'Asia/Kolkata' })
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
      const reportPeriod = `${lastMonth.toLocaleString('en-IN', { month: 'long' })} ${lastMonth.getFullYear()}`;
      const reportYear = lastMonth.getFullYear();
      const reportMonth = lastMonth.getMonth() + 1;

      for (const tenant of tenants) {
        await this.syncQueue.add('generate-compliance-report', {
          tenantId: tenant.id,
          reportType: 'ENROLLMENT_STATISTICS',
          reportPeriod,
          reportYear,
          reportMonth,
        }, { attempts: 2, removeOnComplete: true });

        await this.syncQueue.add('generate-compliance-report', {
          tenantId: tenant.id,
          reportType: 'ATTENDANCE_SUMMARY',
          reportPeriod,
          reportYear,
          reportMonth,
          startDate: lastMonth,
          endDate: lastMonthEnd,
        }, { attempts: 2, removeOnComplete: true });
      }
    } catch (error: any) {
      this.logger.error(`Error generating monthly reports: ${error.message}`);
    }
  }

  private shouldPerformSync(
    syncFrequency: string,
    _syncTime: string | null,
    lastSyncAt: Date | null,
  ): boolean {
    if (!lastSyncAt) return true;
    const hoursSinceLastSync = (Date.now() - new Date(lastSyncAt).getTime()) / (1000 * 60 * 60);
    switch (syncFrequency) {
      case 'HOURLY': return hoursSinceLastSync >= 1;
      case 'DAILY': return hoursSinceLastSync >= 23;
      case 'WEEKLY': return hoursSinceLastSync >= 167;
      case 'MONTHLY': return hoursSinceLastSync >= 719;
      default: return false;
    }
  }
}
