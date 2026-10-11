import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@krypton/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipTenantCheck } from '../../common/decorators/skip-tenant-check.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { AdvancedAnalyticsService } from './advanced-analytics.service';
import { AnalyticsQueryDto, SchoolBenchmarkQueryDto } from './dto/analytics-query.dto';

@ApiTags('advanced-analytics') @ApiBearerAuth()
@Controller('advanced-analytics') @UseGuards(TenantGuard)
@Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL, UserRole.SCHOOL_ADMIN)
export class AdvancedAnalyticsController {
  constructor(private readonly service: AdvancedAnalyticsService) {}
  @Get('options') options(@CurrentUser() user: CurrentUserData) { return this.service.options(user); }
  @Get('report') @Throttle({ default: { limit: 20, ttl: 60000 } }) report(@CurrentUser() user: CurrentUserData, @Query() query: AnalyticsQueryDto) { return this.service.report(user, query); }
  @Get('schools') @SkipTenantCheck() @Roles(UserRole.SUPER_ADMIN) @Throttle({ default: { limit: 10, ttl: 60000 } }) schools(@CurrentUser() user: CurrentUserData, @Query() query: SchoolBenchmarkQueryDto) { return this.service.benchmarks(user, query); }
}
