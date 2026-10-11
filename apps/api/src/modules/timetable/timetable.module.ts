import { Module } from '@nestjs/common';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';

@Module({
  controllers: [TimetableController],
  providers: [TimetableService, PrismaService, TenantService],
  exports: [TimetableService],
})
export class TimetableModule {}
