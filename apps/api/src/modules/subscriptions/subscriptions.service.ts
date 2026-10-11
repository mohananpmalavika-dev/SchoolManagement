import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  RenewSubscriptionDto,
  CancelSubscriptionDto,
  UpdateUsageDto,
  QuerySubscriptionsDto,
  SubscriptionStatus,
} from './dto/subscription.dto';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { formatCurrency } from '@krypton/utils';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {}

  // ==================== SUBSCRIPTION MANAGEMENT ====================

  async createSubscription(dto: CreateSubscriptionDto) {
    // Validate tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
      include: { subscription: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.subscription) {
      throw new BadRequestException('Tenant already has a subscription');
    }

    // Validate plan exists
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (!plan.isActive) {
      throw new BadRequestException('Plan is not available');
    }

    // Calculate dates
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const trialEndsAt = new Date(startDate);
    trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialDays);

    const endDate = new Date(trialEndsAt);
    if (plan.billingCycle === 'ANNUAL') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        tenantId: dto.tenantId,
        planId: dto.planId,
        status: SubscriptionStatus.TRIAL,
        startDate,
        endDate,
        trialEndsAt,
        autoRenew: dto.autoRenew !== false,
        paymentMethod: dto.paymentMethod,
        smsCredits: plan.smsCredits,
      },
      include: {
        plan: true,
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          },
        },
      },
    });

    this.logger.log(
      `Subscription created for tenant ${tenant.name} (${plan.name} plan)`,
    );

    return subscription;
  }

  async findAll(query: QuerySubscriptionsDto) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.planId) {
      where.planId = query.planId;
    }

    if (!query.includeExpired) {
      where.status = { not: SubscriptionStatus.EXPIRED };
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where,
      include: {
        plan: true,
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions;
  }

  async findOne(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        tenant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  async findByTenant(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found for this tenant');
    }

    return subscription;
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    const existing = await this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!existing) {
      throw new NotFoundException('Subscription not found');
    }

    // If changing plan (upgrade/downgrade)
    if (dto.planId && dto.planId !== existing.planId) {
      return this.changePlan(id, dto.planId);
    }

    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        ...(dto.autoRenew !== undefined && { autoRenew: dto.autoRenew }),
        ...(dto.paymentMethod && { paymentMethod: dto.paymentMethod }),
      },
      include: {
        plan: true,
        tenant: {
          select: { id: true, name: true, subdomain: true },
        },
      },
    });

    return subscription;
  }

  async changePlan(subscriptionId: string, newPlanId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const newPlan = await this.prisma.plan.findUnique({
      where: { id: newPlanId },
    });

    if (!newPlan) {
      throw new NotFoundException('New plan not found');
    }

    if (!newPlan.isActive) {
      throw new BadRequestException('New plan is not available');
    }

    // Calculate proration if mid-cycle
    const now = new Date();
    const isUpgrade = newPlan.price > subscription.plan.price;

    // Update subscription
    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        planId: newPlanId,
        smsCredits: newPlan.smsCredits, // Reset SMS credits on plan change
      },
      include: {
        plan: true,
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(
      `Subscription ${subscriptionId} changed from ${subscription.plan.name} to ${newPlan.name}`,
    );

    return {
      subscription: updated,
      isUpgrade,
      priceDifference: newPlan.price - subscription.plan.price,
    };
  }

  async renew(id: string, dto: RenewSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Calculate new end date
    const currentEnd = new Date(subscription.endDate);
    const newEndDate = new Date(currentEnd);

    if (subscription.plan.billingCycle === 'ANNUAL') {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    } else {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    }

    const paymentDate = dto.paymentDate
      ? new Date(dto.paymentDate)
      : new Date();

    // Update subscription
    const renewed = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        endDate: newEndDate,
        lastPaymentDate: paymentDate,
        nextPaymentDate: newEndDate,
        smsCredits: { increment: subscription.plan.smsCredits }, // Add monthly credits
      },
      include: {
        plan: true,
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(
      `Subscription ${id} renewed until ${newEndDate.toISOString()}`,
    );

    return renewed;
  }

  async cancel(id: string, dto: CancelSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled');
    }

    const cancelDate = dto.immediate ? new Date() : subscription.endDate;

    const cancelled = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        autoRenew: false,
        ...(dto.immediate && { endDate: cancelDate }),
      },
      include: {
        plan: true,
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    this.logger.log(
      `Subscription ${id} cancelled. Reason: ${dto.reason}. Immediate: ${dto.immediate}`,
    );

    return {
      subscription: cancelled,
      effectiveDate: cancelDate,
      reason: dto.reason,
    };
  }

  async updateUsage(tenantId: string, dto: UpdateUsageDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found for this tenant');
    }

    // Check limits
    if (dto.studentCount && dto.studentCount > subscription.plan.maxStudents) {
      throw new BadRequestException(
        `Student count ${dto.studentCount} exceeds plan limit of ${subscription.plan.maxStudents}`,
      );
    }

    if (dto.staffCount && dto.staffCount > subscription.plan.maxStaff) {
      throw new BadRequestException(
        `Staff count ${dto.staffCount} exceeds plan limit of ${subscription.plan.maxStaff}`,
      );
    }

    if (dto.storageUsedMB && dto.storageUsedMB > subscription.plan.maxStorageMB) {
      throw new BadRequestException(
        `Storage usage ${dto.storageUsedMB}MB exceeds plan limit of ${subscription.plan.maxStorageMB}MB`,
      );
    }

    const updated = await this.prisma.subscription.update({
      where: { tenantId },
      data: {
        ...(dto.studentCount !== undefined && {
          studentCount: dto.studentCount,
        }),
        ...(dto.staffCount !== undefined && { staffCount: dto.staffCount }),
        ...(dto.storageUsedMB !== undefined && {
          storageUsedMB: dto.storageUsedMB,
        }),
        ...(dto.smsCredits !== undefined && { smsCredits: dto.smsCredits }),
      },
      include: { plan: true },
    });

    return updated;
  }

  async checkLimits(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found for this tenant');
    }

    const withinLimits = {
      students:
        subscription.studentCount <= subscription.plan.maxStudents,
      staff: subscription.staffCount <= subscription.plan.maxStaff,
      storage:
        subscription.storageUsedMB <= subscription.plan.maxStorageMB,
      sms: subscription.smsCredits > 0,
    };

    const allWithinLimits = Object.values(withinLimits).every((v) => v);

    return {
      withinLimits: allWithinLimits,
      details: {
        students: {
          used: subscription.studentCount,
          limit: subscription.plan.maxStudents,
          withinLimit: withinLimits.students,
          percentUsed: Math.round(
            (subscription.studentCount / subscription.plan.maxStudents) * 100,
          ),
        },
        staff: {
          used: subscription.staffCount,
          limit: subscription.plan.maxStaff,
          withinLimit: withinLimits.staff,
          percentUsed: Math.round(
            (subscription.staffCount / subscription.plan.maxStaff) * 100,
          ),
        },
        storage: {
          used: subscription.storageUsedMB,
          limit: subscription.plan.maxStorageMB,
          withinLimit: withinLimits.storage,
          percentUsed: Math.round(
            (subscription.storageUsedMB / subscription.plan.maxStorageMB) * 100,
          ),
        },
        sms: {
          remaining: subscription.smsCredits,
          withinLimit: withinLimits.sms,
        },
      },
    };
  }

  async checkExpiring(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const expiring = await this.prisma.subscription.findMany({
      where: {
        status: { in: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE] },
        endDate: {
          lte: futureDate,
        },
      },
      include: {
        plan: true,
        tenant: {
          select: {
            id: true,
            name: true,
            contactEmail: true,
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    return expiring;
  }

  async processExpiredSubscriptions() {
    const now = new Date();

    const expired = await this.prisma.subscription.findMany({
      where: {
        status: { in: [SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE] },
        endDate: { lte: now },
      },
    });

    const results = {
      processed: 0,
      errors: [] as any[],
    };

    for (const subscription of expired) {
      try {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.EXPIRED },
        });
        results.processed++;
      } catch (error: any) {
        results.errors.push({
          subscriptionId: subscription.id,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Processed ${results.processed} expired subscriptions`,
    );

    return results;
  }

  // ==================== PLAN MANAGEMENT ====================

  async createPlan(dto: CreatePlanDto) {
    // Check if slug already exists
    const existing = await this.prisma.plan.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new BadRequestException('Plan slug already exists');
    }

    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        price: dto.price,
        billingCycle: dto.billingCycle || 'ANNUAL',
        trialDays: dto.trialDays || 14,
        maxStudents: dto.maxStudents,
        maxStaff: dto.maxStaff,
        maxStorageMB: dto.maxStorageMB || 10000,
        smsCredits: dto.smsCredits || 1000,
        features: dto.features,
        sortOrder: dto.sortOrder || 0,
      },
    });

    return plan;
  }

  async findAllPlans(activeOnly: boolean = false) {
    const where: any = {};

    if (activeOnly) {
      where.isActive = true;
    }

    const plans = await this.prisma.plan.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    return plans;
  }

  async findOnePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const existing = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Plan not found');
    }

    const plan = await this.prisma.plan.update({
      where: { id },
      data: dto,
    });

    return plan;
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (plan._count.subscriptions > 0) {
      throw new BadRequestException(
        'Cannot delete plan with active subscriptions. Deactivate it instead.',
      );
    }

    await this.prisma.plan.delete({ where: { id } });

    return { success: true, message: 'Plan deleted' };
  }

  async getSubscriptionStats() {
    const [total, active, trial, expired, cancelled] = await Promise.all([
      this.prisma.subscription.count(),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.TRIAL },
      }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.EXPIRED },
      }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.CANCELLED },
      }),
    ]);

    // Calculate MRR (Monthly Recurring Revenue)
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      include: { plan: true },
    });

    let mrr = 0;
    for (const sub of activeSubscriptions) {
      if (sub.plan.billingCycle === 'ANNUAL') {
        mrr += sub.plan.price / 12; // Convert annual to monthly
      } else {
        mrr += sub.plan.price;
      }
    }

    return {
      total,
      active,
      trial,
      expired,
      cancelled,
      mrr: Math.round(mrr), // in minor units
      mrrFormatted: formatCurrency(mrr),
    };
  }
}
