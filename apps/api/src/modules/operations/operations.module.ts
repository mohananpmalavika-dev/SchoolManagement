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
import { AuthModule } from '../auth/auth.module';
import { AdmissionAccountsService } from './admission-accounts.service';
import { AcademicRolloverController } from './academic-rollover.controller';
import { AcademicRolloverService } from './academic-rollover.service';
@Module({imports:[DatabaseModule,AuthModule],controllers:[OperationsController,SchoolPublicController,SavedTransportController,CheckInController,SchedulePlannerController,SchoolMessagingController,AcademicRolloverController],providers:[OperationsService,AdmissionAccountsService,SavedTransportService,CheckInService,RedisService,SchedulePlannerService,WhatsAppService,AcademicRolloverService],exports:[OperationsService]})
export class OperationsModule {}
