import { ParentEngagementNotificationsService } from '../parent-engagement-notifications/parent-engagement-notifications.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import {
  BulkMarkAttendanceDto,
  MarkSingleAttendanceDto,
  UpdateAttendanceDto,
} from './dto/mark-attendance.dto';
import {
  QueryAttendanceDto,
  AttendanceSummaryDto,
  StudentAttendanceReportDto,
} from './dto/query-attendance.dto';
import {
  BulkMarkStaffAttendanceDto,
  MarkSingleStaffAttendanceDto,
  QueryStaffAttendanceDto,
  StaffAttendanceStatus,
} from './dto/staff-attendance.dto';
import { AttendanceStatus } from '@krypton/types';
import { assertHrPeriodWritable } from '../hrms/hrms-period';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private notifications: ParentEngagementNotificationsService
  ) {}

  // ==================== STUDENT ATTENDANCE ====================

  async markBulkAttendance(dto: BulkMarkAttendanceDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Validate class exists
    const classExists = await this.prisma.class.findFirst({
      where: { id: dto.classId, tenantId },
    });

    if (!classExists) {
      throw new NotFoundException('Class not found');
    }

    // Validate stream if provided
    if (dto.streamId) {
      const streamExists = await this.prisma.stream.findFirst({
        where: { id: dto.streamId, classId: dto.classId, tenantId },
      });

      if (!streamExists) {
        throw new NotFoundException('Stream not found');
      }
    }

    const attendanceDate = new Date(dto.date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Validate all students exist and belong to the class
    const studentIds = dto.attendance.map((a) => a.studentId);
    const students = await this.prisma.student.findMany({
      where: {
        id: { in: studentIds },
        tenantId,
        currentClassId: dto.classId,
        ...(dto.streamId && { currentStreamId: dto.streamId }),
      },
    });

    if (students.length !== studentIds.length) {
      throw new BadRequestException(
        'Some students not found or do not belong to the specified class'
      );
    }

    // Check for existing attendance records
    const existing = await this.prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        studentId: { in: studentIds },
        date: attendanceDate,
        period: dto.period || 1,
      },
    });

    if (existing.length > 0) {
      throw new ConflictException(
        `Attendance already marked for ${existing.length} student(s) on this date`
      );
    }

    // Create attendance records
    const records = await this.prisma.$transaction(
      dto.attendance.map((item) =>
        this.prisma.attendanceRecord.create({
          data: {
            tenantId,
            studentId: item.studentId,
            classId: dto.classId,
            streamId: dto.streamId,
            date: attendanceDate,
            period: dto.period || 1,
            status: item.status,
            remarks: item.remarks,
            arrivalTime: item.arrivalTime ? new Date(item.arrivalTime) : null,
            markedBy: userId,
          },
        })
      )
    );

    this.logger.log(`Bulk attendance marked: ${records.length} students for ${dto.date}`);

    const absentStudents = records.filter((r) => r.status === AttendanceStatus.ABSENT);
    for (const record of absentStudents) await this.notifications.sendAttendanceAlert(record.id);

    return {
      success: true,
      markedCount: records.length,
      date: dto.date,
      period: dto.period || 1,
      absentCount: absentStudents.length,
    };
  }

  async markSingleAttendance(dto: MarkSingleAttendanceDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Validate student exists
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
      include: {
        currentClass: true,
        currentStream: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const attendanceDate = new Date(dto.date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Check for existing record
    const existing = await this.prisma.attendanceRecord.findFirst({
      where: {
        tenantId,
        studentId: dto.studentId,
        date: attendanceDate,
        period: dto.period || 1,
      },
    });

    if (existing) {
      throw new ConflictException('Attendance already marked for this student on this date/period');
    }

    // Create attendance record
    const record = await this.prisma.attendanceRecord.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        classId: student.currentClassId,
        streamId: student.currentStreamId,
        date: attendanceDate,
        period: dto.period || 1,
        status: dto.status,
        remarks: dto.remarks,
        arrivalTime: dto.arrivalTime ? new Date(dto.arrivalTime) : null,
        markedBy: userId,
      },
      include: {
        student: {
          select: {
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`Attendance marked: ${student.firstName} ${student.lastName} - ${dto.status}`);

    await this.notifications.sendAttendanceAlert(record.id);
    return record;
  }

  async updateAttendance(id: string, dto: UpdateAttendanceDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const record = await this.prisma.attendanceRecord.findFirst({
      where: { id, tenantId },
    });

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    const updated = await this.prisma.attendanceRecord.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.remarks !== undefined && { remarks: dto.remarks }),
        ...(dto.arrivalTime && { arrivalTime: new Date(dto.arrivalTime) }),
        markedBy: userId,
      },
      include: {
        student: {
          select: {
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await this.notifications.sendAttendanceAlert(updated.id);
    return updated;
  }

  async queryAttendance(query: QueryAttendanceDto) {
    const tenantId = this.tenantService.requireTenantContext();
    const {
      page = 1,
      pageSize = 50,
      classId,
      streamId,
      studentId,
      startDate,
      endDate,
      date,
      status,
      period,
    } = query;

    const skip = (page - 1) * pageSize;

    const where: any = { tenantId };

    if (classId) {
      where.classId = classId;
    }

    if (streamId) {
      where.streamId = streamId;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (date) {
      const specificDate = new Date(date);
      specificDate.setUTCHours(0, 0, 0, 0);
      where.date = specificDate;
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (status) {
      where.status = status;
    }

    if (period !== undefined) {
      where.period = period;
    }

    const [records, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          student: {
            select: {
              id: true,
              admissionNumber: true,
              firstName: true,
              lastName: true,
            },
          },
          class: {
            select: {
              name: true,
            },
          },
          stream: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ date: 'desc' }, { student: { lastName: 'asc' } }],
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return {
      data: records,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: page < Math.ceil(total / pageSize),
        hasPreviousPage: page > 1,
      },
    };
  }

  async getAttendanceSummary(query: AttendanceSummaryDto) {
    const tenantId = this.tenantService.requireTenantContext();
    const { classId, streamId, startDate, endDate } = query;

    const where: any = { tenantId };

    if (classId) {
      where.classId = classId;
    }

    if (streamId) {
      where.streamId = streamId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const [total, present, absent, late, excused, halfDay] = await Promise.all([
      this.prisma.attendanceRecord.count({ where }),
      this.prisma.attendanceRecord.count({
        where: { ...where, status: AttendanceStatus.PRESENT },
      }),
      this.prisma.attendanceRecord.count({
        where: {
          ...where,
          status: {
            in: [AttendanceStatus.ABSENT],
          },
        },
      }),
      this.prisma.attendanceRecord.count({
        where: { ...where, status: AttendanceStatus.LATE },
      }),
      this.prisma.attendanceRecord.count({
        where: { ...where, status: AttendanceStatus.EXCUSED },
      }),
      this.prisma.attendanceRecord.count({
        where: { ...where, status: AttendanceStatus.HALF_DAY },
      }),
    ]);

    const attendanceRate = total > 0 ? ((present + late + halfDay * 0.5) / total) * 100 : 0;

    return {
      total,
      present,
      absent,
      late,
      excused,
      halfDay,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
    };
  }

  async getStudentAttendanceReport(query: StudentAttendanceReportDto) {
    const tenantId = this.tenantService.requireTenantContext();
    const { studentId, startDate, endDate } = query;

    // Validate student exists
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
      include: {
        currentClass: { select: { name: true } },
        currentStream: { select: { name: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const where: any = {
      tenantId,
      studentId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const [records, stats] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendanceRecord.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
    ]);

    const totalDays = records.length;
    const statusCounts = stats.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as any);

    const presentDays =
      (statusCounts[AttendanceStatus.PRESENT] || 0) +
      (statusCounts[AttendanceStatus.LATE] || 0) +
      (statusCounts[AttendanceStatus.HALF_DAY] || 0) * 0.5;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        class: student.currentClass?.name,
        stream: student.currentStream?.name,
      },
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalDays,
        present: statusCounts[AttendanceStatus.PRESENT] || 0,
        absent: statusCounts[AttendanceStatus.ABSENT] || 0,
        late: statusCounts[AttendanceStatus.LATE] || 0,
        excused: statusCounts[AttendanceStatus.EXCUSED] || 0,
        halfDay: statusCounts[AttendanceStatus.HALF_DAY] || 0,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
      },
      records,
    };
  }

  async getTodayAttendance(classId?: string, streamId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // PostgreSQL DATE values use UTC midnight; the school day follows IST.
    const today = new Date(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date())
    );

    const where: any = {
      tenantId,
      date: today,
    };

    if (classId) {
      where.classId = classId;
    }

    if (streamId) {
      where.streamId = streamId;
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where,
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
      orderBy: { student: { lastName: 'asc' } },
    });

    const summary = {
      total: records.length,
      present: records.filter((r) => r.status === AttendanceStatus.PRESENT).length,
      absent: records.filter((r) => r.status === AttendanceStatus.ABSENT).length,
      late: records.filter((r) => r.status === AttendanceStatus.LATE).length,
    };

    return {
      date: today.toISOString().split('T')[0],
      summary,
      records,
    };
  }

  // ==================== STAFF ATTENDANCE ====================

  async markBulkStaffAttendance(dto: BulkMarkStaffAttendanceDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();
    return this.prisma.$transaction(async (db) => {
      await db.tenant.update({ where: { id: tenantId }, data: { updatedAt: new Date() } });
      const attendanceDate = new Date(dto.date);
      attendanceDate.setUTCHours(0, 0, 0, 0);
      await assertHrPeriodWritable(db, tenantId, attendanceDate, attendanceDate);

      // Validate all staff exist
      const staffIds = dto.attendance.map((a) => a.staffId);
      const staff = await db.staff.findMany({
        where: {
          id: { in: staffIds },
          tenantId,
        },
      });

      if (staff.length !== staffIds.length) {
        throw new BadRequestException('Some staff members not found');
      }
      if (await db.employee.count({ where: { tenantId, staffId: { in: staffIds } } }))
        throw new BadRequestException(
          'Use reviewed HR attendance corrections for staff linked to payroll'
        );

      // Check for existing records
      const existing = await db.staffAttendance.findMany({
        where: {
          tenantId,
          staffId: { in: staffIds },
          date: attendanceDate,
        },
      });

      if (existing.length > 0) {
        throw new ConflictException(
          `Attendance already marked for ${existing.length} staff member(s)`
        );
      }

      // Create attendance records
      const records = await Promise.all(
        dto.attendance.map((item) =>
          db.staffAttendance.create({
            data: {
              tenantId,
              staffId: item.staffId,
              date: attendanceDate,
              status: item.status,
              remarks: item.remarks,
              timeIn: item.checkInTime ? new Date(item.checkInTime) : null,
              timeOut: item.checkOutTime ? new Date(item.checkOutTime) : null,
              markedBy: userId,
            },
          })
        )
      );

      this.logger.log(`Staff attendance marked: ${records.length} staff for ${dto.date}`);

      return {
        success: true,
        markedCount: records.length,
        date: dto.date,
      };
    });
  }

  async markSingleStaffAttendance(dto: MarkSingleStaffAttendanceDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();
    return this.prisma.$transaction(async (db) => {
      await db.tenant.update({ where: { id: tenantId }, data: { updatedAt: new Date() } });
      // Validate staff exists
      const staff = await db.staff.findFirst({
        where: { id: dto.staffId, tenantId },
      });

      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }

      const attendanceDate = new Date(dto.date);
      attendanceDate.setUTCHours(0, 0, 0, 0);
      await assertHrPeriodWritable(db, tenantId, attendanceDate, attendanceDate);
      if (await db.employee.count({ where: { tenantId, staffId: dto.staffId } }))
        throw new BadRequestException(
          'Use reviewed HR attendance corrections for staff linked to payroll'
        );

      // Check for existing record
      const existing = await db.staffAttendance.findFirst({
        where: {
          tenantId,
          staffId: dto.staffId,
          date: attendanceDate,
        },
      });

      if (existing) {
        throw new ConflictException('Attendance already marked for this staff member on this date');
      }

      // Create record
      const record = await db.staffAttendance.create({
        data: {
          tenantId,
          staffId: dto.staffId,
          date: attendanceDate,
          status: dto.status,
          remarks: dto.remarks,
          timeIn: dto.checkInTime ? new Date(dto.checkInTime) : null,
          timeOut: dto.checkOutTime ? new Date(dto.checkOutTime) : null,
          markedBy: userId,
        },
        include: {
          staff: {
            select: {
              staffNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return record;
    });
  }

  async queryStaffAttendance(query: QueryStaffAttendanceDto) {
    const tenantId = this.tenantService.requireTenantContext();
    const { staffId, startDate, endDate, date, status } = query;

    const where: any = { tenantId };

    if (staffId) {
      where.staffId = staffId;
    }

    if (date) {
      const specificDate = new Date(date);
      specificDate.setUTCHours(0, 0, 0, 0);
      where.date = specificDate;
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (status) {
      where.status = status;
    }

    const records = await this.prisma.staffAttendance.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            staffNumber: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { staff: { lastName: 'asc' } }],
    });

    return records;
  }

  async getStaffAttendanceStats(staffId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId };
    if (staffId) {
      where.staffId = staffId;
    }

    const [total, present, absent, late, onLeave] = await Promise.all([
      this.prisma.staffAttendance.count({ where }),
      this.prisma.staffAttendance.count({
        where: { ...where, status: StaffAttendanceStatus.PRESENT },
      }),
      this.prisma.staffAttendance.count({
        where: { ...where, status: StaffAttendanceStatus.ABSENT },
      }),
      this.prisma.staffAttendance.count({
        where: { ...where, status: StaffAttendanceStatus.LATE },
      }),
      this.prisma.staffAttendance.count({
        where: {
          ...where,
          status: {
            in: [StaffAttendanceStatus.ON_LEAVE, StaffAttendanceStatus.SICK_LEAVE],
          },
        },
      }),
    ]);

    const attendanceRate = total > 0 ? (present / total) * 100 : 0;

    return {
      total,
      present,
      absent,
      late,
      onLeave,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
    };
  }
}
