import { Module } from '@nestjs/common';
import { ParentPortalService } from './parent-portal.service';
import { ParentPortalController } from './parent-portal.controller';
import { DatabaseModule } from '../../database/database.module';
import { ActivityFeedModule } from '../activity-feed/activity-feed.module';
import { MediaModule } from '../media/media.module';
import { BehaviorModule } from '../behavior/behavior.module';
import { HomeworkModule } from '../homework/homework.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    DatabaseModule,
    ActivityFeedModule,
    MediaModule,
    BehaviorModule,
    HomeworkModule,
    BookingsModule,
  ],
  controllers: [ParentPortalController],
  providers: [ParentPortalService],
  exports: [ParentPortalService],
})
export class ParentPortalModule {}
