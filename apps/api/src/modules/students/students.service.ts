import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentsDto } from './dto/query-students.dto';
import { AssignClassDto } from './dto/assign-class.dto';
import { formatFullName } from '@krypton/utils';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
  ) {}

  async create(createStudentDto: CreateStudentDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Check if admission number already exists
    const existing = await this.prisma.student.findUnique({
      where: {
        tenantId_admissionNumber: {
          tenantId,
          admissionNumber: createStudentDto.admissionNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Admission number ${createStudentDto.admissionNumber} already exists`
      );
    }

    // Validate class and stream if provided
    if (createStudentDto.currentClassId) {
      await this.validateClass(createStudentDto.currentClassId);
    }

    if (createStudentDto.currentStreamId) {
      await this.validateStream(createStudentDto.currentStreamId);
    }

    // Extract guardians data
    const { guardians, ...studentData } = createStudentDto;

    // Create student with guardians in a transaction
    const student = await this.prisma.$transaction(async (tx) => {
      // Create student
      const newStudent = await tx.student.create({
        data: {
          tenantId,
          ...studentData,
          status: 'ACTIVE',
        },
      });

      // Create or link guardians
      for (const guardianInfo of guardians) {
        let guardian;

        if (guardianInfo.guardianId) {
          // Link existing guardian
          guardian = await tx.guardian.findUnique({
            where: { id: guardianInfo.guardianId },
          });

          if (!guardian || guardian.tenantId !== tenantId) {
            throw new NotFoundException(`Guardian ${guardianInfo.guardianId} not found`);
          }
        } else {
          // Create new guardian
          guardian = await tx.guardian.create({
            data: {
              tenantId,
              firstName: guardianInfo.firstName,
              lastName: guardianInfo.lastName,
              middleName: guardianInfo.middleName,
              phone: guardianInfo.phone,
              email: guardianInfo.email,
              occupation: guardianInfo.occupation,
              address: guardianInfo.address,
            },
          });
        }

        // Create link
        await tx.guardianStudentLink.create({
          data: {
            guardianId: guardian.id,
            studentId: newStudent.id,
            relationship: guardianInfo.relationship as any,
            isPrimary: guardianInfo.isPrimary || false,
            canPickup: true,
            receiveUpdates: true,
          },
        });
      }

      // Return student with guardians
      return tx.student.findUnique({
        where: { id: newStudent.id },
        include: {
          currentClass: {
            select: { id: true, name: true, level: true },
          },
          currentStream: {
            select: { id: true, name: true },
          },
          guardianLinks: {
            include: {
              guardian: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                  relationship: false,
                },
              },
            },
          },
        },
      });
    });

    return student;
  }

  async findAll(query: QueryStudentsDto) {
    const tenantId = this.tenantService.requireTenantContext();
    const { page = 1, pageSize = 20, search, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = query;

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filters.classId) {
      where.currentClassId = filters.classId;
    }

    if (filters.streamId) {
      where.currentStreamId = filters.streamId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.gender) {
      where.gender = filters.gender;
    }

    // Get total count
    const total = await this.prisma.student.count({ where });

    // Get students
    const students = await this.prisma.student.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        currentClass: {
          select: { id: true, name: true, level: true },
        },
        currentStream: {
          select: { id: true, name: true },
        },
        guardianLinks: {
          where: { isPrimary: true },
          take: 1,
          include: {
            guardian: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: students,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const student = await this.prisma.student.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        currentClass: {
          select: {
            id: true,
            name: true,
            level: true,
            educationLevel: true,
          },
        },
        currentStream: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        guardianLinks: {
          include: {
            guardian: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                middleName: true,
                phone: true,
                alternatePhone: true,
                email: true,
                occupation: true,
                address: true,
              },
            },
          },
          orderBy: {
            isPrimary: 'desc',
          },
        },
        enrollments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          include: {
            class: {
              select: { name: true },
            },
            stream: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify student exists
    await this.findOne(id);

    // Validate class and stream if provided
    if (updateStudentDto.currentClassId) {
      await this.validateClass(updateStudentDto.currentClassId);
    }

    if (updateStudentDto.currentStreamId) {
      await this.validateStream(updateStudentDto.currentStreamId);
    }

    const student = await this.prisma.student.update({
      where: { id },
      data: updateStudentDto,
      include: {
        currentClass: {
          select: { id: true, name: true, level: true },
        },
        currentStream: {
          select: { id: true, name: true },
        },
      },
    });

    return student;
  }

  async remove(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify student exists
    await this.findOne(id);

    // Soft delete
    await this.prisma.student.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'WITHDRAWN',
      },
    });

    return { message: 'Student deleted successfully' };
  }

  async assignClass(id: string, assignClassDto: AssignClassDto) {
    const tenantId = this.tenantService.requireTenantContext();

    // Verify student exists
    const student = await this.findOne(id);

    // Validate class
    await this.validateClass(assignClassDto.classId);

    // Validate stream if provided
    if (assignClassDto.streamId) {
      await this.validateStream(assignClassDto.streamId);

      // Verify stream belongs to class
      const stream = await this.prisma.stream.findUnique({
        where: { id: assignClassDto.streamId },
      });

      if (stream?.classId !== assignClassDto.classId) {
        throw new BadRequestException('Stream does not belong to the specified class');
      }
    }

    // Update student
    const updated = await this.prisma.student.update({
      where: { id },
      data: {
        currentClassId: assignClassDto.classId,
        currentStreamId: assignClassDto.streamId || null,
      },
      include: {
        currentClass: true,
        currentStream: true,
      },
    });

    // Create enrollment record
    await this.prisma.enrollment.create({
      data: {
        tenantId,
        studentId: id,
        classId: assignClassDto.classId,
        streamId: assignClassDto.streamId,
        enrollmentDate: new Date(),
      },
    });

    return updated;
  }

  async getGuardians(id: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const student = await this.prisma.student.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        guardianLinks: {
          include: {
            guardian: true,
          },
          orderBy: {
            isPrimary: 'desc',
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student.guardianLinks;
  }

  async getStats() {
    const tenantId = this.tenantService.requireTenantContext();

    const [total, active, graduated, transferred, withdrawn] = await Promise.all([
      this.prisma.student.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.student.count({
        where: { tenantId, status: 'ACTIVE', deletedAt: null },
      }),
      this.prisma.student.count({
        where: { tenantId, status: 'GRADUATED', deletedAt: null },
      }),
      this.prisma.student.count({
        where: { tenantId, status: 'TRANSFERRED', deletedAt: null },
      }),
      this.prisma.student.count({
        where: { tenantId, status: 'WITHDRAWN', deletedAt: null },
      }),
    ]);

    return {
      total,
      active,
      graduated,
      transferred,
      withdrawn,
      byStatus: {
        ACTIVE: active,
        GRADUATED: graduated,
        TRANSFERRED: transferred,
        WITHDRAWN: withdrawn,
      },
    };
  }

  private async validateClass(classId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const classExists = await this.prisma.class.findFirst({
      where: { id: classId, tenantId },
    });

    if (!classExists) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    return classExists;
  }

  private async validateStream(streamId: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const streamExists = await this.prisma.stream.findFirst({
      where: { id: streamId, tenantId },
    });

    if (!streamExists) {
      throw new NotFoundException(`Stream with ID ${streamId} not found`);
    }

    return streamExists;
  }
}
