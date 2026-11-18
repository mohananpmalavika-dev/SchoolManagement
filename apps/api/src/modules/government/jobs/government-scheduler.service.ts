import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bull';

import { PrismaService } from '../../../database/prisma.service';
import { sha } from '../services/compliance-core';

@Injectable()
export class GovernmentSchedulerService {
  private readonly logger = new Logger(GovernmentSchedulerService.name);
  constructor(
    @InjectQueue('government-sync') private readonly queue: Queue,
    private readonly prisma: PrismaService
  ) {}
  // No official adapter: automated external synchronization is deliberately disabled.
  async scheduleUdiseSync() {
    return;
  }
  private today() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }
  private async enqueue(name: string, key: string, data: Record<string, unknown>) {
    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });
    const errors: string[] = [];
    for (const tenant of tenants) {
      try {
        await this.queue.add(
          name,
          { ...data, tenantId: tenant.id },
          {
            jobId: sha(`${name}|${tenant.id}|${key}`),
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: { age: 35 * 86400 },
            removeOnFail: { age: 90 * 86400 },
          }
        );
      } catch (error: any) {
        errors.push(tenant.id);
        this.logger.error(`Could not queue ${name} for ${tenant.id}: ${error.message}`);
      }
    }
    if (errors.length)
      throw new Error(`Government task scheduling failed for ${errors.length} school(s)`);
  }
  @Cron('0 8 * * *', { timeZone: 'Asia/Kolkata' })
  checkComplianceDeadlines() {
    return this.enqueue('check-compliance-deadlines', this.today(), {});
  }
  @Cron('0 2 * * 1', { timeZone: 'Asia/Kolkata' })
  runWeeklyDataAudits() {
    return this.enqueue('data-quality-audit', this.today(), { auditType: 'FULL_AUDIT' });
  }
  @Cron('0 3 1 * *', { timeZone: 'Asia/Kolkata' })
  async generateMonthlyReports() {
    const [year, month] = this.today().split('-').map(Number),
      first = new Date(Date.UTC(year, month - 2, 1)),
      last = new Date(Date.UTC(year, month - 1, 0));
    const reportPeriod = first.toLocaleString('en-IN', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    for (const reportType of ['ENROLLMENT_STATISTICS', 'ATTENDANCE_SUMMARY', 'FINANCIAL_SUMMARY'])
      await this.enqueue(
        'generate-compliance-report',
        `${first.toISOString().slice(0, 7)}-${reportType}`,
        {
          reportType,
          reportPeriod,
          reportYear: first.getUTCFullYear(),
          reportMonth: first.getUTCMonth() + 1,
          startDate: first.toISOString(),
          endDate: last.toISOString(),
        }
      );
  }
}
