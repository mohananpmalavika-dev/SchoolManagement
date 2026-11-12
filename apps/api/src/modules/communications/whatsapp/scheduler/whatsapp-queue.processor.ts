import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WhatsAppService } from '../whatsapp.service';
import { FeeReminderService } from '../notifications/fee-reminder.service';
import { AttendanceAlertService } from '../notifications/attendance-alert.service';
import { ReportCardService } from '../notifications/report-card.service';

export const WHATSAPP_QUEUE = 'whatsapp-notifications';

export interface WhatsAppJobData {
  type: 'fee-reminder' | 'attendance-alert' | 'report-card' | 'custom';
  payload: any;
  language?: 'en' | 'hi' | 'ml';
}

@Processor(WHATSAPP_QUEUE)
export class WhatsAppQueueProcessor {
  private readonly logger = new Logger(WhatsAppQueueProcessor.name);

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly feeReminderService: FeeReminderService,
    private readonly attendanceAlertService: AttendanceAlertService,
    private readonly reportCardService: ReportCardService,
  ) {}

  @Process('send-fee-reminders')
  async handleFeeReminders(job: Job<WhatsAppJobData>) {
    this.logger.log(`Processing fee reminders job ${job.id}`);

    try {
      const { payload, language } = job.data;
      const result = await this.feeReminderService.sendFeeReminders({
        ...payload,
        language: language || 'en',
      });

      this.logger.log(
        `Fee reminders completed: ${result.successful}/${result.totalProcessed} successful`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to process fee reminders job ${job.id}`, error);
      throw error;
    }
  }

  @Process('send-attendance-alerts')
  async handleAttendanceAlerts(job: Job<WhatsAppJobData>) {
    this.logger.log(`Processing attendance alerts job ${job.id}`);

    try {
      const { payload, language } = job.data;
      const result = await this.attendanceAlertService.sendAttendanceAlerts({
        ...payload,
        language: language || 'en',
      });

      this.logger.log(
        `Attendance alerts completed: ${result.successful}/${result.totalProcessed} successful`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process attendance alerts job ${job.id}`,
        error,
      );
      throw error;
    }
  }

  @Process('send-daily-attendance-summary')
  async handleDailyAttendanceSummary(job: Job<WhatsAppJobData>) {
    this.logger.log(`Processing daily attendance summary job ${job.id}`);

    try {
      const { payload, language } = job.data;
      const result =
        await this.attendanceAlertService.sendDailyAttendanceSummary(
          payload.date ? new Date(payload.date) : new Date(),
          language || 'en',
        );

      this.logger.log(
        `Daily attendance summary completed: ${result.successful}/${result.totalProcessed} successful`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process daily attendance summary job ${job.id}`,
        error,
      );
      throw error;
    }
  }

  @Process('send-report-cards')
  async handleReportCards(job: Job<WhatsAppJobData>) {
    this.logger.log(`Processing report cards job ${job.id}`);

    try {
      const { payload, language } = job.data;
      const result = await this.reportCardService.sendReportCards({
        ...payload,
        language: language || 'en',
      });

      this.logger.log(
        `Report cards delivery completed: ${result.successful}/${result.totalProcessed} successful`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to process report cards job ${job.id}`, error);
      throw error;
    }
  }

  @Process('send-custom-message')
  async handleCustomMessage(job: Job<WhatsAppJobData>) {
    this.logger.log(`Processing custom message job ${job.id}`);

    try {
      const { payload } = job.data;
      const result = await this.whatsAppService.sendMessage({
        to: payload.to,
        body: payload.message,
        mediaUrl: payload.mediaUrl,
      });

      this.logger.log(`Custom message sent: ${result?.sid}`);

      return {
        success: !!result,
        messageId: result?.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to process custom message job ${job.id}`, error);
      throw error;
    }
  }

  @Process('send-bulk-messages')
  async handleBulkMessages(job: Job<WhatsAppJobData>) {
    this.logger.log(`Processing bulk messages job ${job.id}`);

    try {
      const { payload } = job.data;
      const results = await this.whatsAppService.sendBulkMessages(
        payload.messages,
      );

      const successCount = results.filter((r) => r !== null).length;

      this.logger.log(
        `Bulk messages completed: ${successCount}/${results.length} successful`,
      );

      return {
        total: results.length,
        successful: successCount,
        failed: results.length - successCount,
      };
    } catch (error) {
      this.logger.error(`Failed to process bulk messages job ${job.id}`, error);
      throw error;
    }
  }
}

