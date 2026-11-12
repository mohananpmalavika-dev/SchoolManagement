import { ExaminationsModule } from '../examinations/examinations.module';
import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { FeesModule } from '../fees/fees.module';
import { PaymentsGatewayModule } from '../payments-gateway/payments-gateway.module';
import { TimetableModule } from '../timetable/timetable.module';

@Module({
  imports: [ExaminationsModule, FeesModule, PaymentsGatewayModule, TimetableModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
})
export class WorkspaceModule {}
