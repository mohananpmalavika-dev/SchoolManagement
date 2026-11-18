import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { TenantService } from '../../database/tenant.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipTenantCheck } from '../../common/decorators/skip-tenant-check.decorator';
import { UserRole as Role } from '@krypton/types';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  RenewSubscriptionDto,
  CancelSubscriptionDto,
  UpdateUsageDto,
  QuerySubscriptionsDto,
} from './dto/subscription.dto';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { SubscriptionsScopeInterceptor } from './subscriptions-scope.interceptor';

@ApiTags('Subscriptions & Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@UseInterceptors(SubscriptionsScopeInterceptor)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly tenantService: TenantService,
  ) {}

  // ==================== SUBSCRIPTION ENDPOINTS ====================

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Create a new subscription for a tenant' })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
  })
  async create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscription(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Get all subscriptions with filters' })
  @ApiResponse({
    status: 200,
    description: 'Subscriptions retrieved successfully',
  })
  async findAll(@Query() query: QuerySubscriptionsDto) {
    return this.subscriptionsService.findAll(query);
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Get subscription statistics and MRR' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStats() {
    return this.subscriptionsService.getSubscriptionStats();
  }

  @Get('expiring')
  @Roles(Role.SUPER_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Get subscriptions expiring soon' })
  @ApiResponse({
    status: 200,
    description: 'Expiring subscriptions retrieved',
  })
  async getExpiring(@Query('days') days?: number) {
    return this.subscriptionsService.checkExpiring(days);
  }

  @Post('process-expired')
  @Roles(Role.SUPER_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Process and mark expired subscriptions' })
  @ApiResponse({
    status: 200,
    description: 'Expired subscriptions processed',
  })
  async processExpired() {
    return this.subscriptionsService.processExpiredSubscriptions();
  }

  @Get('my-subscription')
  @Roles(
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Get current school subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription retrieved successfully',
  })
  async getMySubscription() {
    const tenantId = this.tenantService.requireTenantContext();
    return this.subscriptionsService.findByTenant(tenantId);
  }

  @Get('my-subscription/limits')
  @Roles(
    Role.PRINCIPAL,
    Role.DEPUTY_PRINCIPAL,
    Role.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Check subscription limits and usage' })
  @ApiResponse({
    status: 200,
    description: 'Limits checked successfully',
  })
  async checkMyLimits() {
    const tenantId = this.tenantService.requireTenantContext();
    return this.subscriptionsService.checkLimits(tenantId);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Update subscription settings' })
  @ApiResponse({
    status: 200,
    description: 'Subscription updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, dto);
  }

  @Post(':id/renew')
  @Roles(Role.SUPER_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Renew a subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription renewed successfully',
  })
  async renew(
    @Param('id') id: string,
    @Body() dto: RenewSubscriptionDto,
  ) {
    return this.subscriptionsService.renew(id, dto);
  }

  @Post(':id/cancel')
  @Roles(Role.SUPER_ADMIN, Role.PRINCIPAL)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
  })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.subscriptionsService.cancel(id, dto);
  }

  @Patch(':id/usage')
  @Roles(Role.SUPER_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Update subscription usage tracking' })
  @ApiResponse({
    status: 200,
    description: 'Usage updated successfully',
  })
  async updateUsage(
    @Param('id') id: string,
    @Body() dto: UpdateUsageDto,
  ) {
    // Get tenant ID from subscription
    const subscription = await this.subscriptionsService.findOne(id);
    return this.subscriptionsService.updateUsage(
      subscription.tenantId,
      dto,
    );
  }

  // ==================== PLAN ENDPOINTS ====================

  @Post('plans')
  @Roles(Role.SUPER_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiResponse({
    status: 201,
    description: 'Plan created successfully',
  })
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiResponse({
    status: 200,
    description: 'Plans retrieved successfully',
  })
  async findAllPlans(@Query('activeOnly', new DefaultValuePipe(false), ParseBoolPipe) activeOnly: unknown) {
    // Preserve the raw query through global implicit conversion; ParseBoolPipe
    // must reject invalid strings instead of receiving Boolean('invalid').
    return this.subscriptionsService.findAllPlans(activeOnly === true);
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get a single plan by ID' })
  @ApiResponse({
    status: 200,
    description: 'Plan retrieved successfully',
  })
  async findOnePlan(@Param('id') id: string) {
    return this.subscriptionsService.findOnePlan(id);
  }

  @Patch('plans/:id')
  @Roles(Role.SUPER_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Update a subscription plan' })
  @ApiResponse({
    status: 200,
    description: 'Plan updated successfully',
  })
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Delete('plans/:id')
  @Roles(Role.SUPER_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Delete a subscription plan (if no active subscriptions)' })
  @ApiResponse({
    status: 200,
    description: 'Plan deleted successfully',
  })
  async deletePlan(@Param('id') id: string) {
    return this.subscriptionsService.deletePlan(id);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  @SkipTenantCheck()
  @ApiOperation({ summary: 'Get a single subscription by ID' })
  async findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }
}
