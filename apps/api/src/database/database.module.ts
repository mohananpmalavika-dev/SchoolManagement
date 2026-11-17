import { SchoolRecordAccessGuard } from '../common/guards/school-record-access.guard';
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantService } from './tenant.service';

@Global()
@Module({
  providers: [PrismaService, TenantService, SchoolRecordAccessGuard],
  exports: [PrismaService, TenantService, SchoolRecordAccessGuard],
})
export class DatabaseModule {}
