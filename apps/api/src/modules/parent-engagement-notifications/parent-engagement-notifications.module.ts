import { Module } from '@nestjs/common';
import { ParentEngagementNotificationsService } from './parent-engagement-notifications.service';
import { DatabaseModule } from '../../database/database.module';
// Uncomment when integrating with Communications module
// import { CommunicationsModule } from '../communications/communications.module';

@Module({
  imports: [
    DatabaseModule,
    // Uncomment when ready to integrate
    // CommunicationsModule,
  ],
  providers: [ParentEngagementNotificationsService],
  exports: [ParentEngagementNotificationsService],
})
export class ParentEngagementNotificationsModule {}
