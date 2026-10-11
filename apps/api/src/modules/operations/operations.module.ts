import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { OperationsService } from './operations.service';
import { OperationsController, SchoolPublicController } from './operations.controller';
import { SavedTransportService } from './transport.service';
import { SavedTransportController } from './transport.controller';
import { CheckInService } from './check-in.service';
import { CheckInController } from './check-in.controller';
import { RedisService } from '../../common/services/redis.service';
import { SchedulePlannerService } from './schedule-planner.service';
import { SchedulePlannerController } from './schedule-planner.controller';
import { WhatsAppService } from '../communications/whatsapp/whatsapp.service';
import { SchoolMessagingController } from './school-messaging.controller';
@Module({imports:[DatabaseModule],controllers:[OperationsController,SchoolPublicController,SavedTransportController,CheckInController,SchedulePlannerController,SchoolMessagingController],providers:[OperationsService,SavedTransportService,CheckInService,RedisService,SchedulePlannerService,WhatsAppService],exports:[OperationsService]})
export class OperationsModule {}
