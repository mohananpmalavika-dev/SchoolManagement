import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { StaffStatus, StaffDepartment } from '@krypton/types';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {}

  private async validateAccount(userId?: string) {
    if (!userId) return;
    const account = await this.prisma.user.findFirst({ where: { id: userId, tenantId: this.tenantService.requireTenantContext(), isActive: true } });
    if (!account || ['PARENT', 'STUDENT'].includes(account.role)) throw new BadRequestException('Select a staff account in this school');
  }

  async create(dto: CreateStaffDto) {
    const tenantId = this.tenantService.requireTenantContext();

    await this.validateAccount(dto.userId);

    // Check staff number uniqueness within tenant
    const existing = await this.prisma.staff.findFirst({
      where: {
        tenantId,
        staffNumber: dto.staffNumber,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Staff member with number ${dto.staffNumber} already exists in this school`,
      );
    }

    const staff = await this.prisma.staff.create({
      data: {
        tenantId,
        staffNumber: dto.staffNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        middleName: dto.middleName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        gender: dto.gender,
        aadhaarLast4: dto.aadhaarLast4,
        panNumber: dto.panNumber,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        address: dto.address,
        department: dto.department,
        position: dto.position,
        employmentType: dto.employmentType,
        hireDate: new Date(dto.hireDate),
        isTeacher: dto.isTeacher ?? false,
        subjects: dto.subjects ? (dto.subjects as any) : undefined,
        status: dto.status || StaffStatus.ACTIVE,
        userId: dto.userId,
      },
    });

    this.logger.log(`Created staff member: ${staff.staffNumber} (${staff.id})`);
    return staff;
  }

  async findAll(query: QueryStaffDto, directoryOnly = false) {
    const tenantId = this.tenantService.requireTenantContext();
    const {
      page = 1,
      pageSize = 20,
      search,
      department,
      employmentType,
      status,
      isTeacher,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = { tenantId };

    if (department) where.department = department;
    if (employmentType) where.employmentType = employmentType;
    if (status) where.status = status;
    if (typeof isTeacher === 'boolean') where.isTeacher = isTeacher;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { staffNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (!['createdAt','firstName','lastName','staffNumber','department','position','status','hireDate','email'].includes(sortBy)) throw new BadRequestException('Unsupported staff sort field');
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        ...(directoryOnly ? { select: { id: true, staffNumber: true, firstName: true, lastName: true, email: true, department: true, position: true, isTeacher: true, status: true } } : {}),
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.staff.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const staff = await this.prisma.staff.findFirst({
      where: { id, tenantId },
      include: {
        timetableEntries: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException(`Staff member with ID ${id} not found`);
    }

    return staff;
  }

  async update(id: string, dto: UpdateStaffDto) {
    const tenantId = this.tenantService.requireTenantContext();

    await this.findOne(id);
    await this.validateAccount(dto.userId);

    if (dto.staffNumber) {
      const duplicate = await this.prisma.staff.findFirst({
        where: {
          tenantId,
          staffNumber: dto.staffNumber,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Staff number ${dto.staffNumber} is already in use by another staff member`,
        );
      }
    }

    const updated = await this.prisma.staff.update({
      where: { id },
      data: {
        staffNumber: dto.staffNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        middleName: dto.middleName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        aadhaarLast4: dto.aadhaarLast4,
        panNumber: dto.panNumber,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        address: dto.address,
        department: dto.department,
        position: dto.position,
        employmentType: dto.employmentType,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
        terminationDate: dto.terminationDate
          ? new Date(dto.terminationDate)
          : undefined,
        isTeacher: dto.isTeacher,
        subjects: dto.subjects ? (dto.subjects as any) : undefined,
        status: dto.status,
        userId: dto.userId,
      },
    });

    return updated;
  }

  async remove(id: string) {
    const tenantId = this.tenantService.requireTenantContext();
    await this.findOne(id);

    // Soft-deactivate by transitioning to TERMINATED status
    const deactivated = await this.prisma.staff.update({
      where: { id },
      data: {
        status: StaffStatus.TERMINATED,
        terminationDate: new Date(),
      },
    });

    return {
      success: true,
      message: 'Staff member deactivated successfully',
      staff: deactivated,
    };
  }

  async getDepartments() {
    const tenantId = this.tenantService.requireTenantContext();

    const staffMembers = await this.prisma.staff.findMany({
      where: { tenantId },
      select: { department: true, status: true },
    });

    const breakdown: Record<string, { total: number; active: number }> = {};
    for (const member of staffMembers) {
      if (!breakdown[member.department]) {
        breakdown[member.department] = { total: 0, active: 0 };
      }
      breakdown[member.department].total++;
      if (member.status === StaffStatus.ACTIVE) {
        breakdown[member.department].active++;
      }
    }

    return breakdown;
  }

  async getTeachingStaff() {
    const tenantId = this.tenantService.requireTenantContext();

    return this.prisma.staff.findMany({
      where: {
        tenantId,
        isTeacher: true,
        status: StaffStatus.ACTIVE,
      },
      select: {
        id: true,
        staffNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        department: true,
        position: true,
        subjects: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async getStats() {
    const tenantId = this.tenantService.requireTenantContext();

    const [total, active, onLeave, teachers] = await Promise.all([
      this.prisma.staff.count({ where: { tenantId } }),
      this.prisma.staff.count({
        where: { tenantId, status: StaffStatus.ACTIVE },
      }),
      this.prisma.staff.count({
        where: { tenantId, status: StaffStatus.ON_LEAVE },
      }),
      this.prisma.staff.count({
        where: { tenantId, isTeacher: true, status: StaffStatus.ACTIVE },
      }),
    ]);

    return {
      total,
      active,
      onLeave,
      teachers,
      nonTeaching: active - teachers,
    };
  }
}
