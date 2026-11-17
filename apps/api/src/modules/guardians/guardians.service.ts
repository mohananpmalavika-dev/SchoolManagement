import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { LinkStudentDto } from './dto/link-student.dto';

@Injectable()
export class GuardiansService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {}

  async create(createGuardianDto: CreateGuardianDto) {
    const tenantId = this.tenantService.requireTenantContext();

    const guardian = await this.prisma.guardian.create({
      data: {
        tenantId,
        ...createGuardianDto,
      },
    });

    return guardian;
  }

  async findAll(search?: string, classIds?: string[]) {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId, ...(classIds ? { studentLinks: { some: { student: { tenantId, currentClassId: { in: classIds } } } } } : {}) };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const guardians = await this.prisma.guardian.findMany({
      where,
      include: {
        studentLinks: {
          ...(classIds ? { where: { student: { tenantId, currentClassId: { in: classIds } } } } : {}),
          include: {
            student: {
              select: {
                id: true,
                admissionNumber: true,
                firstName: true,
                lastName: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return guardians;
  }

  async findOne(id: string, classIds?: string[]) {
    const tenantId = this.tenantService.requireTenantContext();

    const guardian = await this.prisma.guardian.findFirst({
      where: { id, tenantId },
      include: {
        studentLinks: {
          ...(classIds ? { where: { student: { tenantId, currentClassId: { in: classIds } } } } : {}),
          include: {
            student: {
              select: {
                id: true,
                admissionNumber: true,
                firstName: true,
                lastName: true,
                middleName: true,
                dateOfBirth: true,
                gender: true,
                status: true,
                currentClass: {
                  select: {
                    name: true,
                    level: true,
                  },
                },
                currentStream: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!guardian) {
      throw new NotFoundException(`Guardian with ID ${id} not found`);
    }

    return guardian;
  }

  async update(id: string, updateGuardianDto: UpdateGuardianDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify guardian exists
    await this.findOne(id);

    const guardian = await this.prisma.guardian.update({
      where: { id },
      data: updateGuardianDto,
    });

    return guardian;
  }

  async remove(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify guardian exists
    await this.findOne(id);

    // Check if guardian is linked to any students
    const links = await this.prisma.guardianStudentLink.count({
      where: { guardianId: id },
    });

    if (links > 0) {
      throw new ConflictException(
        'Cannot delete guardian who is linked to students. Remove student links first.'
      );
    }

    await this.prisma.guardian.delete({
      where: { id },
    });

    return { message: 'Guardian deleted successfully' };
  }

  async linkStudent(id: string, linkStudentDto: LinkStudentDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify guardian exists
    await this.findOne(id);

    // Verify student exists and belongs to same tenant
    const student = await this.prisma.student.findFirst({
      where: {
        id: linkStudentDto.studentId,
        tenantId,
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${linkStudentDto.studentId} not found`);
    }

    // Check if link already exists
    const existingLink = await this.prisma.guardianStudentLink.findFirst({
      where: {
        guardianId: id,
        studentId: linkStudentDto.studentId,
      },
    });

    if (existingLink) {
      throw new ConflictException('Guardian is already linked to this student');
    }

    // If setting as primary, unset other primary guardians for this student
    if (linkStudentDto.isPrimary) {
      await this.prisma.guardianStudentLink.updateMany({
        where: {
          studentId: linkStudentDto.studentId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const link = await this.prisma.guardianStudentLink.create({
      data: {
        guardianId: id,
        studentId: linkStudentDto.studentId,
        relationship: linkStudentDto.relationship as any,
        isPrimary: linkStudentDto.isPrimary || false,
        canPickup: linkStudentDto.canPickup !== false,
        receiveUpdates: linkStudentDto.receiveUpdates !== false,
      },
      include: {
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return link;
  }

  async unlinkStudent(id: string, studentId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify guardian exists
    await this.findOne(id);

    const link = await this.prisma.guardianStudentLink.findFirst({
      where: {
        guardianId: id,
        studentId,
      },
    });

    if (!link) {
      throw new NotFoundException('Link not found between guardian and student');
    }

    await this.prisma.guardianStudentLink.delete({
      where: { id: link.id },
    });

    return { message: 'Student unlinked successfully' };
  }

  async getStudents(id: string, classIds?: string[]) {
    const tenantId = this.tenantService.requireTenantContext();

    const guardian = await this.prisma.guardian.findFirst({
      where: { id, tenantId },
      include: {
        studentLinks: {
          ...(classIds ? { where: { student: { tenantId, currentClassId: { in: classIds } } } } : {}),
          include: {
            student: {
              include: {
                currentClass: true,
                currentStream: true,
              },
            },
          },
        },
      },
    });

    if (!guardian) {
      throw new NotFoundException(`Guardian with ID ${id} not found`);
    }

    return guardian.studentLinks.map((link) => ({
      ...link.student,
      relationship: link.relationship,
      isPrimary: link.isPrimary,
    }));
  }
}
