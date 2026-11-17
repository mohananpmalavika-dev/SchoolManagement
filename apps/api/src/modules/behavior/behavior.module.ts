import { ParentEngagementNotificationsModule } from '../parent-engagement-notifications/parent-engagement-notifications.module';
import { Module } from '@nestjs/common';
import { BehaviorService } from './behavior.service';
import { BehaviorController } from './behavior.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [ParentEngagementNotificationsModule, DatabaseModule],
  controllers: [BehaviorController],
  providers: [BehaviorService],
  exports: [BehaviorService],
})
export class BehaviorModule {}
