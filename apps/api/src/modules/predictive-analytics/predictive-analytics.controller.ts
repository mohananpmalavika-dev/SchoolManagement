import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@krypton/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PredictiveAnalyticsService } from './predictive-analytics.service';

@ApiTags('predictive-analytics')
@ApiBearerAuth()
@Controller('predictive-analytics')
@UseGuards(TenantGuard)
@Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL, UserRole.SCHOOL_ADMIN)
export class PredictiveAnalyticsController {
  constructor(private readonly analytics: PredictiveAnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Explainable student, academic, fee-default and dropout early-warning analytics' })
  report() { return this.analytics.report(); }
}
