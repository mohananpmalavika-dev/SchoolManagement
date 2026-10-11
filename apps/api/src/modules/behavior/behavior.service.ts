import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { CreateBehaviorDto } from './dto/create-behavior.dto';
import { UpdateBehaviorDto } from './dto/update-behavior.dto';
import { QueryBehaviorDto } from './dto/query-behavior.dto';

@Injectable()
export class BehaviorService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {}

  async create(dto: CreateBehaviorDto, userId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify student belongs to this tenant
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const behaviorRecord = await this.prisma.behaviorRecord.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        behaviorType: dto.behaviorType,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        incidentDate: new Date(dto.incidentDate),
        location: dto.location,
        points: dto.points || 0,
        actionTaken: dto.actionTaken,
        followUpRequired: dto.followUpRequired || false,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        parentNotified: dto.parentNotified || false,
        parentNotifiedAt: dto.parentNotified ? new Date() : null,
        recordedBy: userId,
      },
    });

    return behaviorRecord;
  }

  async findAll(query: QueryBehaviorDto) {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId };

    if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.behaviorType) {
      where.behaviorType = query.behaviorType;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.startDate || query.endDate) {
      where.incidentDate = {};
      if (query.startDate) {
        where.incidentDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.incidentDate.lte = new Date(query.endDate);
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.behaviorRecord.findMany({
        where,
        orderBy: {
          incidentDate: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.behaviorRecord.count({ where }),
    ]);

    return {
      data: records,
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

    const record = await this.prisma.behaviorRecord.findFirst({
      where: { id, tenantId },
    });

    if (!record) {
      throw new NotFoundException('Behavior record not found');
    }

    return record;
  }

  async update(id: string, dto: UpdateBehaviorDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify record exists
    await this.findOne(id);

    const updateData: any = {};

    if (dto.behaviorType) updateData.behaviorType = dto.behaviorType;
    if (dto.category) updateData.category = dto.category;
    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.incidentDate) updateData.incidentDate = new Date(dto.incidentDate);
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.points !== undefined) updateData.points = dto.points;
    if (dto.actionTaken !== undefined) updateData.actionTaken = dto.actionTaken;
    if (dto.followUpRequired !== undefined) updateData.followUpRequired = dto.followUpRequired;
    if (dto.followUpDate !== undefined) updateData.followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : null;
    if (dto.parentNotified !== undefined) {
      updateData.parentNotified = dto.parentNotified;
      if (dto.parentNotified) {
        updateData.parentNotifiedAt = new Date();
      }
    }

    const record = await this.prisma.behaviorRecord.update({
      where: { id },
      data: updateData,
    });

    return record;
  }

  async remove(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify record exists
    await this.findOne(id);

    await this.prisma.behaviorRecord.delete({
      where: { id },
    });

    return { message: 'Behavior record deleted successfully' };
  }

  // Parent-facing methods
  async getStudentBehavior(
    studentId: string,
    guardianId: string,
    query: QueryBehaviorDto,
  ) {
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

    return this.findAll({ ...query, studentId });
  }

  // Get behavior summary/statistics
  async getBehaviorSummary(studentId: string, guardianId?: string) {
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

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    thisWeek.setHours(0, 0, 0, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const where = {
      tenantId,
      studentId,
    };

    const [positiveCount, negativeCount, weeklyRecords, monthlyRecords, totalPoints, byCategory] = await Promise.all([
      // Positive behaviors
      this.prisma.behaviorRecord.count({
        where: { ...where, behaviorType: 'POSITIVE' },
      }),
      // Negative behaviors
      this.prisma.behaviorRecord.count({
        where: { ...where, behaviorType: 'NEGATIVE' },
      }),
      // This week's records
      this.prisma.behaviorRecord.count({
        where: {
          ...where,
          incidentDate: { gte: thisWeek },
        },
      }),
      // This month's records
      this.prisma.behaviorRecord.count({
        where: {
          ...where,
          incidentDate: { gte: thisMonth },
        },
      }),
      // Total points
      this.prisma.behaviorRecord.aggregate({
        where,
        _sum: {
          points: true,
        },
      }),
      // Records by category (this month)
      this.prisma.behaviorRecord.groupBy({
        by: ['category', 'behaviorType'],
        where: {
          ...where,
          incidentDate: { gte: thisMonth },
        },
        _count: true,
      }),
    ]);

    return {
      totals: {
        positive: positiveCount,
        negative: negativeCount,
        points: totalPoints._sum.points || 0,
      },
      thisWeek: weeklyRecords,
      thisMonth: monthlyRecords,
      byCategory: byCategory.map((item) => ({
        category: item.category,
        behaviorType: item.behaviorType,
        count: item._count,
      })),
    };
  }

  // Get recent behavior records for dashboard
  async getRecentBehavior(studentId: string, limit: number = 5) {
    const tenantId = this.tenantService.requireTenantContext();

    const records = await this.prisma.behaviorRecord.findMany({
      where: {
        tenantId,
        studentId,
      },
      orderBy: {
        incidentDate: 'desc',
      },
      take: limit,
    });

    return records;
  }
}
