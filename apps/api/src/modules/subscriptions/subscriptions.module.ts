import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, PrismaService, TenantService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
