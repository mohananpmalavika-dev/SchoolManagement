import { ParentEngagementNotificationsModule } from '../parent-engagement-notifications/parent-engagement-notifications.module';
import { ExaminationsModule } from '../examinations/examinations.module';
import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { FeesModule } from '../fees/fees.module';
import { PaymentsGatewayModule } from '../payments-gateway/payments-gateway.module';
import { TimetableModule } from '../timetable/timetable.module';

@Module({
  imports: [ParentEngagementNotificationsModule, ExaminationsModule, FeesModule, PaymentsGatewayModule, TimetableModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
})
export class WorkspaceModule {}
