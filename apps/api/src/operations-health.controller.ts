import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from './common/decorators/roles.decorator';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { UserRole } from '@krypton/types';
import { OperationsHealthService } from './operations-health.service';

@Controller('ops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class OperationsHealthController {
  constructor(private operations: OperationsHealthService) {}
  @Get('health')
  async health(@Res({passthrough:true}) response: Response) {
    const report = await this.operations.report();
    response.status(report.status === 'ready' ? 200 : 503);
    response.setHeader('Cache-Control','no-store');
    return report;
  }
}
