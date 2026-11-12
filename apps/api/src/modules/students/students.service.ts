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

    const currentYear = (await this.prisma.academicYear.findFirst({
      where: { tenantId, isCurrent: true },
    })) || (await this.prisma.academicYear.findFirst({ where: { tenantId } }));

    if (currentYear) {
      // Create enrollment record
      await this.prisma.enrollment.create({
        data: {
          tenantId,
          studentId: id,
          academicYearId: currentYear.id,
          classId: assignClassDto.classId,
          streamId: assignClassDto.streamId,
          enrollmentDate: new Date(),
        },
      });
    }

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

  async resolveStudentForUser(user: any) {
    const tenantId = this.tenantService.requireTenantContext();
    const userId = user.userId || user.id;
    if (!userId) throw new NotFoundException('Student account is not linked');
    const student = await this.prisma.student.findFirst({
      where: { tenantId, userId, deletedAt: null },
      include: { currentClass: true, currentStream: true },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }
    return student;
  }

  async getMyChildren(user: any) {
    const tenantId = this.tenantService.requireTenantContext();
    const userId = user.userId || user.id;
    if (!userId) return [];
    const guardian = await this.prisma.guardian.findFirst({
      where: { tenantId, userId },
      include: {
        studentLinks: {
          include: {
            student: {
              include: { currentClass: true, currentStream: true },
            },
          },
        },
      },
    });

    if (guardian && guardian.studentLinks && guardian.studentLinks.length > 0) {
      return guardian.studentLinks.filter(link => !link.student.deletedAt && link.student.tenantId === tenantId).map((link) => ({
        id: link.student.id,
        firstName: link.student.firstName,
        lastName: link.student.lastName,
        admissionNumber: link.student.admissionNumber,
        class: link.student.currentClass
          ? { name: link.student.currentClass.name }
          : { name: 'Class' },
        stream: link.student.currentStream
          ? { name: link.student.currentStream.name }
          : null,
      }));
    }

    return [];
  }

  async getMe(user: any) {
    const student = await this.resolveStudentForUser(user);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: student.tenantId },
      select: { name: true },
    });
    return {
      ...student,
      class: student.currentClass
        ? { id: student.currentClass.id, name: student.currentClass.name }
        : null,
      stream: student.currentStream
        ? { id: student.currentStream.id, name: student.currentStream.name }
        : null,
      school: tenant?.name || 'School',
    };
  }

  async getMeDashboard(user: any) {
    const student = await this.getMe(user);
    const timetable = await this.getMeTimetable(user);
    const attendance = await this.getMeAttendance(user);
    const grades = await this.getMeGrades(user);
    const assignments = await this.getMeAssignments(user);
    const announcements = await this.prisma.schoolEvent.findMany({
      where: { tenantId: student.tenantId, startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
      take: 5,
    });

    const todayName = new Intl.DateTimeFormat('en-US', {weekday:'long',timeZone:'Asia/Kolkata'}).format(new Date()).toUpperCase();
    let daySchedule = timetable.schedule.filter(
      (s: any) => s.day === todayName,
    );

    const schoolDate=new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
    const cover=await this.prisma.substitutionDuty.findMany({where:{tenantId:student.tenantId,date:schoolDate,timetableEntryId:{in:daySchedule.map((entry:any)=>entry.id)}}});
    const coverTeachers=await this.prisma.staff.findMany({where:{tenantId:student.tenantId,id:{in:cover.map(duty=>duty.teacherId)}}});
    daySchedule=daySchedule.map((entry:any)=>{const duty=cover.find(d=>d.timetableEntryId===entry.id),teacher=coverTeachers.find(t=>t.id===duty?.teacherId);return teacher?{...entry,teacher:teacher.firstName+' '+teacher.lastName,isSubstitution:true}:entry;});
    return {
      student,
      todaySchedule: daySchedule,
      attendance: attendance.summary,
      recentGrades: grades.recentAssessments.slice(0, 4),
      pendingAssignments: assignments.pending.slice(0, 3),
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.description || a.title,
        date: a.startDate.toISOString(),
        category: a.category || 'School Event',
        priority: 'NORMAL',
      })),
    };
  }

  async getMeTimetable(user: any) {
    const student = await this.resolveStudentForUser(user);
    let entries: any[] = [];
    if (student.currentClassId) {
      entries = await this.prisma.timetableEntry.findMany({
        where: { tenantId: student.tenantId, classId: student.currentClassId },
        include: { subject: true, teacher: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
    }

    const dayNames = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY',
    ];
    return {
      className: student.currentClass?.name,
      streamName: student.currentStream?.name,
      schedule: entries.map((e) => ({
        id: e.id,
        day: dayNames[e.dayOfWeek - 1] || 'MONDAY',
        period: e.period,
        startTime: e.startTime,
        endTime: e.endTime,
        subject: e.subject?.name || 'Subject',
        teacher: e.teacher
          ? `${e.teacher.firstName} ${e.teacher.lastName}`
          : 'Teacher',
        room: e.room || 'Classroom',
      })),
    };
  }

  async getMeAttendance(user: any) {
    const student = await this.resolveStudentForUser(user);
    const records = await this.prisma.attendanceRecord.findMany({
      where: { tenantId: student.tenantId, studentId: student.id },
      orderBy: { date: 'desc' },
      take: 100,
    });
    const count = (status: string) =>
      records.filter((r) => r.status === status).length;
    return {
      records,
      summary: {
        totalDays: records.length,
        presentDays: count('PRESENT'),
        lateDays: count('LATE'),
        absentDays: count('ABSENT'),
        excusedDays: count('EXCUSED'),
        attendanceRate: records.length
          ? Math.round(
              ((count('PRESENT') + count('LATE')) / records.length) * 100,
            )
          : 0,
      },
    };
  }

  async getMeGrades(user: any) {
    const student = await this.resolveStudentForUser(user);
    const rows = await this.prisma.grade.findMany({
      where: {
        tenantId: student.tenantId,
        studentId: student.id,
        examination: { isPublished: true },
      },
      include: { subject: true, examination: true },
      orderBy: { createdAt: 'desc' },
    });
    return {
      overallAverage: rows.length ? Math.round(rows.reduce((sum, grade) => sum + grade.percentage, 0) / rows.length) : null,
      subjects: rows.map((g) => ({
        id: g.subjectId,
        name: g.subject.name,
        code: g.subject.code,
        score: g.score,
        percentage: g.percentage,
        gradeLetter: g.letterGrade,
        level: g.competencyLevel,
      })),
      recentAssessments: rows.map((g) => ({
        id: g.id,
        subject: g.subject.name,
        exam: g.examination.name,
        score: g.score,
        total: g.totalMarks,
        grade: g.letterGrade,
        level: g.competencyLevel,
      })),
    };
  }

  async getMeReportCards(user: any) {
    const student = await this.resolveStudentForUser(user);
    const reportCards = await this.prisma.reportCard.findMany({
      where: {
        tenantId: student.tenantId,
        studentId: student.id,
        status: 'PUBLISHED',
      },
      include: { term: true },
      orderBy: { createdAt: 'desc' },
    });
    return { reportCards };
  }

  async getMeAssignments(user: any) {
    const student = await this.resolveStudentForUser(user);
    if (!student.currentClassId) return { pending: [], completed: [] };
    const rows = await this.prisma.assignment.findMany({
      where: { tenantId: student.tenantId, classId: student.currentClassId },
      include: { subject: true, submissions: { where: { tenantId: student.tenantId, studentId: student.id } } },
      orderBy: { dueDate: 'asc' },
    });
    const assignments = rows.map(item => ({
      id: item.id, title: item.title, subject: item.subject.name,
      assignedDate: item.createdAt, dueDate: item.dueDate, description: item.description,
      maxMarks: item.maxMarks, status: item.submissions[0]?.status || 'PENDING',
      submission: item.submissions[0] || null,
    }));
    return {
      pending: assignments.filter(item => !item.submission),
      completed: assignments.filter(item => item.submission),
    };
  }

  async getMeMaterials(user: any) {
    const student = await this.resolveStudentForUser(user);
    const borrowings = await this.prisma.bookBorrowing.findMany({
      where: { tenantId: student.tenantId, borrowerId: student.id },
      include: { book: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const materials = await this.prisma.learningMaterial.findMany({
      where: { tenantId: student.tenantId, OR: [{classId: null}, ...(student.currentClassId ? [{classId: student.currentClassId}] : [])] },
      orderBy: { createdAt: 'desc' },
    });
    return { curriculumMaterials: materials, borrowedBooks: borrowings };
  }
}
