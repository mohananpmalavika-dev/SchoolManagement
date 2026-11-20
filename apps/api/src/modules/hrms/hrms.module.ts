import { Module } from '@nestjs/common';
import { HrmsController } from './hrms.controller';
import { HrmsService } from './hrms.service';
import { HrScopeGuard } from './hrms-scope.guard';

@Module({
  controllers: [HrmsController],
  providers: [HrmsService, HrScopeGuard],
  exports: [HrmsService],
})
export class HrmsModule {}
