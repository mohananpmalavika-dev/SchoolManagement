import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../../database/database.module';
import { EncryptionUtil } from '../../common/utils/encryption.util';

import { UdiseService } from './services/udise.service';
import { BoardExamService } from './services/board-exam.service';
import { ComplianceService } from './services/compliance.service';

import { UdiseController } from './controllers/udise.controller';
import { BoardExamController } from './controllers/board-exam.controller';
import { ComplianceController } from './controllers/compliance.controller';

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
          age: 7 * 24 * 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 30 * 24 * 3600,
        },
      },
    }),
  ],
  controllers: [
    UdiseController,
    BoardExamController,
    ComplianceController,
  ],
  providers: [
    EncryptionUtil,
    UdiseService,
    BoardExamService,
    ComplianceService,
    GovernmentSyncProcessor,
    GovernmentSchedulerService,
  ],
  exports: [
    UdiseService,
    BoardExamService,
    ComplianceService,
    GovernmentSchedulerService,
  ],
})
export class GovernmentModule {}
