import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../../database/database.module';

// Services
import { NemisService } from './services/nemis.service';
import { KnecService } from './services/knec.service';
import { ComplianceService } from './services/compliance.service';

// Controllers
import { NemisController } from './controllers/nemis.controller';
import { KnecController } from './controllers/knec.controller';
import { ComplianceController } from './controllers/compliance.controller';

// Jobs
import { GovernmentSyncProcessor } from './jobs/government-sync.processor';
import { GovernmentSchedulerService } from './jobs/government-scheduler.service';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'government-sync',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 7 * 24 * 3600, // Keep completed jobs for 7 days
          count: 1000, // Keep last 1000 jobs
        },
        removeOnFail: {
          age: 30 * 24 * 3600, // Keep failed jobs for 30 days
        },
      },
    }),
  ],
  controllers: [
    NemisController,
    KnecController,
    ComplianceController,
  ],
  providers: [
    NemisService,
    KnecService,
    ComplianceService,
    GovernmentSyncProcessor,
    GovernmentSchedulerService,
  ],
  exports: [
    NemisService,
    KnecService,
    ComplianceService,
    GovernmentSchedulerService,
  ],
})
export class GovernmentModule {}
