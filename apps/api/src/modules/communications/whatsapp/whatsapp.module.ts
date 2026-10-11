import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { FeeReminderService } from './notifications/fee-reminder.service';
import { FeeReminderController } from './notifications/fee-reminder.controller';
import { PrismaService } from '../../../database/prisma.service';
import { TenantService } from '../../../database/tenant.service';

@Module({
  imports: [ConfigModule],
  controllers: [WhatsAppController, FeeReminderController],
  providers: [
    WhatsAppService,
    FeeReminderService,
    PrismaService,
    TenantService,
  ],
  exports: [WhatsAppService, FeeReminderService],
})
export class WhatsAppModule {}
