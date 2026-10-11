import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@krypton/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { DispatchInterventionDto } from './dto/dispatch-intervention.dto';

@ApiTags('predictive-analytics')
@ApiBearerAuth()
@Controller('predictive-analytics')
@UseGuards(TenantGuard)
@Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL, UserRole.SCHOOL_ADMIN)
export class PredictiveAnalyticsController {
  constructor(private readonly analytics: PredictiveAnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Explainable student, academic, fee-default, homework and dropout early-warning analytics' })
  report() {
    return this.analytics.report();
  }

  @Post('intervene')
  @ApiOperation({ summary: 'Dispatch tailored early warning intervention notice to student guardians or teacher log' })
  intervene(@CurrentUser() user: CurrentUserData, @Body() dto: DispatchInterventionDto) {
    return this.analytics.dispatchIntervention(user, dto);
  }
}
