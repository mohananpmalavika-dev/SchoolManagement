import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { FeeReminderService } from './notifications/fee-reminder.service';
import { FeeReminderController } from './notifications/fee-reminder.controller';
import { AttendanceAlertService } from './notifications/attendance-alert.service';
import { AttendanceAlertController } from './notifications/attendance-alert.controller';
import { ReportCardService } from './notifications/report-card.service';
import { ReportCardController } from './notifications/report-card.controller';
import { WhatsAppSchedulerService } from './scheduler/whatsapp-scheduler.service';
import { WhatsAppSchedulerController } from './scheduler/whatsapp-scheduler.controller';
import { WhatsAppQueueProcessor, WHATSAPP_QUEUE } from './scheduler/whatsapp-queue.processor';
import { WhatsAppSettingsService } from './settings/whatsapp-settings.service';
import { WhatsAppSettingsController } from './settings/whatsapp-settings.controller';
import { PrismaService } from '../../../database/prisma.service';
import { TenantService } from '../../../database/tenant.service';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: WHATSAPP_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs for debugging
      },
    }),
  ],
  controllers: [
    WhatsAppController,
    FeeReminderController,
    AttendanceAlertController,
    ReportCardController,
    WhatsAppSchedulerController,
    WhatsAppSettingsController,
  ],
  providers: [
    WhatsAppService,
    FeeReminderService,
    AttendanceAlertService,
    ReportCardService,
    WhatsAppSchedulerService,
    WhatsAppSettingsService,
    WhatsAppQueueProcessor,
    PrismaService,
    TenantService,
  ],
  exports: [
    WhatsAppService,
    FeeReminderService,
    AttendanceAlertService,
    ReportCardService,
    WhatsAppSchedulerService,
    WhatsAppSettingsService,
  ],
})
export class WhatsAppModule {}
