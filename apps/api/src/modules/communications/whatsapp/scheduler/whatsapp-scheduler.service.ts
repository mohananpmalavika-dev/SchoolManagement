import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';
import { WHATSAPP_QUEUE, WhatsAppJobData } from './whatsapp-queue.processor';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsAppSchedulerService {
  private readonly logger = new Logger(WhatsAppSchedulerService.name);
  private schedulerEnabled: boolean;

  constructor(
    @InjectQueue(WHATSAPP_QUEUE) private whatsappQueue: Queue,
    private configService: ConfigService,
  ) {
    // Enable/disable scheduler based on environment variable
    this.schedulerEnabled =
      this.configService.get('WHATSAPP_SCHEDULER_ENABLED', 'true') === 'true';
  }

  /**
   * Schedule a job to send fee reminders
   */
  async scheduleFeeReminders(
    payload: any,
    options?: { delay?: number; priority?: number; language?: 'en' | 'hi' | 'ml' },
  ): Promise<string> {
    const job = await this.whatsappQueue.add(
      'send-fee-reminders',
      {
        type: 'fee-reminder',
        payload,
        language: options?.language || 'en',
      } as WhatsAppJobData,
      {
        delay: options?.delay,
        priority: options?.priority || 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.logger.log(`Scheduled fee reminders job: ${job.id}`);
    return job.id.toString();
  }

  /**
   * Schedule attendance alerts
   */
  async scheduleAttendanceAlerts(
    payload: any,
    options?: { delay?: number; priority?: number; language?: 'en' | 'hi' | 'ml' },
  ): Promise<string> {
    const job = await this.whatsappQueue.add(
      'send-attendance-alerts',
      {
        type: 'attendance-alert',
        payload,
        language: options?.language || 'en',
      } as WhatsAppJobData,
      {
        delay: options?.delay,
        priority: options?.priority || 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.logger.log(`Scheduled attendance alerts job: ${job.id}`);
    return job.id.toString();
  }

  /**
   * Schedule report card delivery
   */
  async scheduleReportCards(
    payload: any,
    options?: { delay?: number; priority?: number; language?: 'en' | 'hi' | 'ml' },
  ): Promise<string> {
    const job = await this.whatsappQueue.add(
      'send-report-cards',
      {
        type: 'report-card',
        payload,
        language: options?.language || 'en',
      } as WhatsAppJobData,
      {
        delay: options?.delay,
        priority: options?.priority || 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.logger.log(`Scheduled report cards job: ${job.id}`);
    return job.id.toString();
  }

  /**
   * Schedule custom message
   */
  async scheduleCustomMessage(
    payload: { to: string; message: string; mediaUrl?: string },
    options?: { delay?: number; priority?: number },
  ): Promise<string> {
    const job = await this.whatsappQueue.add(
      'send-custom-message',
      {
        type: 'custom',
        payload,
      } as WhatsAppJobData,
      {
        delay: options?.delay,
        priority: options?.priority || 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.logger.log(`Scheduled custom message job: ${job.id}`);
    return job.id.toString();
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.whatsappQueue.getJob(jobId);

    if (!job) {
      return { error: 'Job not found' };
    }

    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;

    return {
      id: job.id,
      state,
      progress,
      result,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    };
  }

  /**
   * Cancel a scheduled job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.whatsappQueue.getJob(jobId);

    if (!job) {
      return false;
    }

    await job.remove();
    this.logger.log(`Cancelled job: ${jobId}`);
    return true;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.whatsappQueue.getWaitingCount(),
      this.whatsappQueue.getActiveCount(),
      this.whatsappQueue.getCompletedCount(),
      this.whatsappQueue.getFailedCount(),
      this.whatsappQueue.getDelayedCount(),
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
   * Automated cron jobs
   */

  /**
   * Send overdue fee reminders every day at 9 AM
   */
  @Cron('0 9 * * *', {
    name: 'send-overdue-fee-reminders',
  })
  async handleOverdueFeeReminders() {
    if (!this.schedulerEnabled) return;

    this.logger.log('Running automated overdue fee reminders');

    await this.scheduleFeeReminders(
      {
        overdueOnly: true,
      },
      {
        priority: 8,
      },
    );
  }

  /**
   * Send fee reminders for fees due in 7 days - every day at 10 AM
   */
  @Cron('0 10 * * *', {
    name: 'send-upcoming-fee-reminders',
  })
  async handleUpcomingFeeReminders() {
    if (!this.schedulerEnabled) return;

    this.logger.log('Running automated upcoming fee reminders (7 days)');

    await this.scheduleFeeReminders(
      {
        daysBeforeDue: 7,
      },
      {
        priority: 6,
      },
    );
  }

  /**
   * Send daily attendance summary every day at 4 PM
   */
  @Cron('0 16 * * 1-5', {
    name: 'send-daily-attendance-summary',
    timeZone: 'Asia/Kolkata',
  })
  async handleDailyAttendanceSummary() {
    if (!this.schedulerEnabled) return;

    this.logger.log('Running automated daily attendance summary');

    await this.whatsappQueue.add(
      'send-daily-attendance-summary',
      {
        type: 'attendance-alert',
        payload: {
          date: new Date(),
        },
      } as WhatsAppJobData,
      {
        priority: 7,
        attempts: 3,
      },
    );
  }

  /**
   * Send absence alerts every day at 11 AM (for students marked absent)
   */
  @Cron('0 11 * * 1-5', {
    name: 'send-absence-alerts',
    timeZone: 'Asia/Kolkata',
  })
  async handleAbsenceAlerts() {
    if (!this.schedulerEnabled) return;

    this.logger.log('Running automated absence alerts');

    await this.scheduleAttendanceAlerts(
      {
        status: 'ABSENT',
        date: new Date(),
      },
      {
        priority: 9, // High priority for absence alerts
      },
    );
  }

  /**
   * Clean up old completed jobs - every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'cleanup-old-jobs',
  })
  async handleJobCleanup() {
    this.logger.log('Running job cleanup');

    try {
      // Remove completed jobs older than 7 days
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      await this.whatsappQueue.clean(sevenDaysAgo, 'completed');

      // Remove failed jobs older than 30 days
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      await this.whatsappQueue.clean(thirtyDaysAgo, 'failed');

      this.logger.log('Job cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup old jobs', error);
    }
  }

  /**
   * Get list of scheduled cron jobs
   */
  getScheduledJobs(): Array<{
    name: string;
    nextRun: string;
    enabled: boolean;
  }> {
    return [
      {
        name: 'Overdue Fee Reminders',
        nextRun: 'Daily at 9:00 AM',
        enabled: this.schedulerEnabled,
      },
      {
        name: 'Upcoming Fee Reminders (7 days)',
        nextRun: 'Daily at 10:00 AM',
        enabled: this.schedulerEnabled,
      },
      {
        name: 'Daily Attendance Summary',
        nextRun: 'Weekdays at 4:00 PM (EAT)',
        enabled: this.schedulerEnabled,
      },
      {
        name: 'Absence Alerts',
        nextRun: 'Weekdays at 11:00 AM (EAT)',
        enabled: this.schedulerEnabled,
      },
      {
        name: 'Job Cleanup',
        nextRun: 'Daily at Midnight',
        enabled: true,
      },
    ];
  }
}

