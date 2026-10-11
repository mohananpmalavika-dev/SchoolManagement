import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { OperationsService } from './operations.service';
import { OperationsController, SchoolPublicController } from './operations.controller';
import { SavedTransportService } from './transport.service';
import { SavedTransportController } from './transport.controller';
@Module({imports:[DatabaseModule],controllers:[OperationsController,SchoolPublicController,SavedTransportController],providers:[OperationsService,SavedTransportService],exports:[OperationsService]})
export class OperationsModule {}
