import { ParentEngagementNotificationsModule } from '../parent-engagement-notifications/parent-engagement-notifications.module';
import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [ParentEngagementNotificationsModule, DatabaseModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
