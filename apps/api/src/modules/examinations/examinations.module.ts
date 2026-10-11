import { Module } from '@nestjs/common';
import { ExaminationsService } from './examinations.service';
import { ExaminationsController } from './examinations.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ExaminationsController],
  providers: [ExaminationsService],
  exports: [ExaminationsService],
})
export class ExaminationsModule {}
