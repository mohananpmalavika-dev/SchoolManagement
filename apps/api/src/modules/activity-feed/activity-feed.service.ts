import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';

@Injectable()
export class ActivityFeedService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {}

  async create(dto: CreateActivityDto, userId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify student belongs to this tenant
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const activity = await this.prisma.activityFeed.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        activityType: dto.activityType,
        title: dto.title,
        description: dto.description,
        metadata: dto.metadata || {},
        isVisibleToParents: dto.isVisibleToParents ?? true,
        classId: dto.classId,
        subjectId: dto.subjectId,
        createdBy: userId,
      },
      include: {
        mediaItems: true,
      },
    });

    return activity;
  }

  async findAll(query: QueryActivitiesDto) {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId };

    if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.classId) {
      where.classId = query.classId;
    }

    if (query.activityType) {
      where.activityType = query.activityType;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.prisma.activityFeed.findMany({
        where,
        include: {
          mediaItems: {
            select: {
              id: true,
              fileUrl: true,
              thumbnailUrl: true,
              fileType: true,
              caption: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.activityFeed.count({ where }),
    ]);

    return {
      data: activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const activity = await this.prisma.activityFeed.findFirst({
      where: { id, tenantId },
      include: {
        mediaItems: true,
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return activity;
  }

  async findByStudent(studentId: string, query: QueryActivitiesDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify student belongs to this tenant
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.findAll({ ...query, studentId });
  }

  async update(id: string, dto: UpdateActivityDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify activity exists
    await this.findOne(id);

    const activity = await this.prisma.activityFeed.update({
      where: { id },
      data: {
        activityType: dto.activityType,
        title: dto.title,
        description: dto.description,
        metadata: dto.metadata,
        isVisibleToParents: dto.isVisibleToParents,
        classId: dto.classId,
        subjectId: dto.subjectId,
      },
      include: {
        mediaItems: true,
      },
    });

    return activity;
  }

  async remove(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify activity exists
    await this.findOne(id);

    await this.prisma.activityFeed.delete({
      where: { id },
    });

    return { message: 'Activity deleted successfully' };
  }

  // Parent-facing methods
  async getStudentActivities(studentId: string, guardianId: string, query: QueryActivitiesDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify guardian has access to this student
    const link = await this.prisma.guardianStudentLink.findFirst({
      where: {
        guardianId,
        studentId,
      },
    });

    if (!link) {
      throw new ForbiddenException('You do not have access to this student');
    }

    const where: any = {
      tenantId,
      studentId,
      isVisibleToParents: true,
    };

    if (query.activityType) {
      where.activityType = query.activityType;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.prisma.activityFeed.findMany({
        where,
        include: {
          mediaItems: {
            where: {
              isVisibleToParents: true,
            },
            select: {
              id: true,
              fileUrl: true,
              thumbnailUrl: true,
              fileType: true,
              caption: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.activityFeed.count({ where }),
    ]);

    return {
      data: activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get activity summary for dashboard
  async getActivitySummary(studentId: string, guardianId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // If guardian is provided, verify access
    if (guardianId) {
      const link = await this.prisma.guardianStudentLink.findFirst({
        where: { guardianId, studentId },
      });

      if (!link) {
        throw new ForbiddenException('You do not have access to this student');
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    thisWeek.setHours(0, 0, 0, 0);

    const where: any = {
      tenantId,
      studentId,
    };

    if (guardianId) {
      where.isVisibleToParents = true;
    }

    const [todayCount, weekCount, byType] = await Promise.all([
      // Today's activities
      this.prisma.activityFeed.count({
        where: {
          ...where,
          createdAt: { gte: today },
        },
      }),
      // This week's activities
      this.prisma.activityFeed.count({
        where: {
          ...where,
          createdAt: { gte: thisWeek },
        },
      }),
      // Activities by type (this week)
      this.prisma.activityFeed.groupBy({
        by: ['activityType'],
        where: {
          ...where,
          createdAt: { gte: thisWeek },
        },
        _count: true,
      }),
    ]);

    return {
      today: todayCount,
      thisWeek: weekCount,
      byType: byType.map((item) => ({
        type: item.activityType,
        count: item._count,
      })),
    };
  }
}
