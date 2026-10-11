import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { OperationsService } from './operations.service';
import { OperationsController, SchoolPublicController } from './operations.controller';
import { SavedTransportService } from './transport.service';
import { SavedTransportController } from './transport.controller';
import { CheckInService } from './check-in.service';
import { CheckInController } from './check-in.controller';
import { RedisService } from '../../common/services/redis.service';
@Module({imports:[DatabaseModule],controllers:[OperationsController,SchoolPublicController,SavedTransportController,CheckInController],providers:[OperationsService,SavedTransportService,CheckInService,RedisService],exports:[OperationsService]})
export class OperationsModule {}
