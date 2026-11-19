import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@krypton/database';
import { PrismaService } from '../../database/prisma.service';
import { Actor } from '../operations/operations.service';
import { PreschoolAccessService, preschoolManagers } from './preschool-access.service';
import { PreschoolPickupService } from './preschool-pickup.service';
import { ParentEngagementNotificationsService } from '../parent-engagement-notifications/parent-engagement-notifications.service';
import {
  BulkCareRecordDto,
  BulkCheckInDto,
  BulkMarkAbsentDto,
  CareRecordDto,
  CheckInDto,
  CheckOutDto,
  CorrectDayTimesDto,
  MarkAbsentDto,
  ObservationDto,
  PreschoolAssignmentDto,
  PreschoolQueryDto,
  SavePreschoolContentDto,
  SchoolProgrammeDto,
  UndoDayActionDto,
  UpdateObservationDto,
  UpdatePreschoolContentDto,
} from './preschool.dto';

export function preschoolDate(value: string) {
  const date = new Date(value + 'T00:00:00.000Z');
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    throw new BadRequestException('Choose a valid calendar date');
  return date;
}

export function preschoolTimestamp(dateStr: string, timeStr: string, timezone: string): Date {
  preschoolDate(dateStr);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr)) {
    throw new BadRequestException('Choose a valid 24-hour time (HH:mm)');
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const desiredUtc = Date.UTC(y, m - 1, d, hh, mm, 0, 0);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  let guess = desiredUtc;
  for (let i = 0; i < 2; i++) {
    const parts = formatter.formatToParts(new Date(guess));
    const num = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
    const localAsUtc = Date.UTC(
      num('year'),
      num('month') - 1,
      num('day'),
      num('hour') === 24 ? 0 : num('hour'),
      num('minute'),
      0,
      0
    );
    const diff = desiredUtc - localAsUtc;
    if (diff === 0) break;
    guess += diff;
  }
  return new Date(guess);
}
@Injectable()
export class PreschoolService {
  constructor(
    private db: PrismaService,
    private access: PreschoolAccessService,
    @Optional() private pickup?: PreschoolPickupService,
    @Optional() private notifications?: ParentEngagementNotificationsService
  ) { }
  private tenant() {
    return this.access.tenant();
  }
  async navigation(user: Actor) {
    const tenantId = this.tenant();
    if (user.role === 'PARENT') {
      const children = await this.db.student.findMany({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
          guardianLinks: { some: { guardian: { tenantId, userId: user.userId } } },
        },
        select: {
          currentClass: {
            select: { educationLevel: true, school: { select: { programme: true } } },
          },
        },
      });
      const early = children.filter(
        (c) =>
          c.currentClass?.educationLevel === 'PRE_PRIMARY' &&
          c.currentClass.school.programme !== 'STANDARD'
      );
      return {
        programme: !early.length
          ? 'STANDARD'
          : early.length === children.length
            ? 'PRESCHOOL'
            : 'COMBINED',
      };
    }
    if ([...preschoolManagers, 'ACCOUNTANT', 'LIBRARIAN', 'TRANSPORT_OFFICER', 'RECEPTIONIST', 'AUDITOR', 'EXAM_OFFICER'].includes(user.role)) {
      const schools = await this.db.school.findMany({
        where: { tenantId, isActive: true },
        select: { programme: true },
      });
      return {
        programme:
          schools.length && schools.every((s) => s.programme === 'PRESCHOOL')
            ? 'PRESCHOOL'
            : schools.some((s) => s.programme !== 'STANDARD')
              ? 'COMBINED'
              : 'STANDARD',
      };
    }
    if (!['TEACHER', 'CLASS_TEACHER'].includes(user.role)) return { programme: 'STANDARD' };
    const ids = await this.access.classIds(user);
    const classes = await this.db.class.findMany({
      where: { tenantId, id: { in: ids || [] } },
      select: { educationLevel: true, school: { select: { programme: true } } },
    });
    const early = classes.filter(
      (c) => c.educationLevel === 'PRE_PRIMARY' && c.school.programme !== 'STANDARD'
    );
    return {
      programme: !early.length
        ? 'STANDARD'
        : early.length === classes.length
          ? 'PRESCHOOL'
          : 'COMBINED',
    };
  }
  async clock() {
    const tenant = await this.db.tenant.findFirst({
      where: { id: this.tenant() },
      select: { timezone: true },
    });
    const timezone = tenant?.timezone || 'Asia/Kolkata';
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const part = (type: string) => parts.find((p) => p.type === type)?.value;
    return { today: `${part('year')}-${part('month')}-${part('day')}`, timezone };
  }
  async audit(tx: Prisma.TransactionClient, user: Actor, action: string, id: string) {
    await tx.auditLog.create({
      data: {
        tenantId: this.tenant(),
        userId: user.userId,
        action,
        entityType: 'preschool',
        entityId: id,
      },
    });
  }
  async options(user: Actor) {
    const tenantId = this.tenant();
    const clock = await this.clock();
    if (user.role === 'PARENT') {
      const students = await this.db.student.findMany({
        where: {
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
          guardianLinks: { some: { guardian: { tenantId, userId: user.userId } } },
          currentClass: {
            educationLevel: 'PRE_PRIMARY',
            school: { programme: { in: ['PRESCHOOL', 'COMBINED'] }, isActive: true },
          },
        },
        select: { id: true, firstName: true, lastName: true, currentClassId: true },
        orderBy: { firstName: 'asc' },
      });
      return { ...clock, students, schools: [], classes: [], staff: [], assignments: [] };
    }
    const ids = await this.access.classIds(user);
    const manager = preschoolManagers.includes(user.role);
    const [schools, classes, staff, assignments] = await Promise.all([
      manager
        ? this.db.school.findMany({
          where: { tenantId, isActive: true },
          select: { id: true, name: true, programme: true, preschoolPickupVerification: true },
          orderBy: { name: 'asc' },
        })
        : [],
      this.db.class.findMany({
        where: { tenantId, school: { isActive: true }, ...(ids ? { id: { in: ids } } : {}) },
        select: {
          id: true,
          name: true,
          schoolId: true,
          educationLevel: true,
          preschoolStage: true,
          school: { select: { programme: true, preschoolPickupVerification: true } },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      manager
        ? this.db.staff.findMany({
          where: { tenantId, status: 'ACTIVE', isTeacher: true, userId: { not: null } },
          select: { id: true, firstName: true, lastName: true },
        })
        : [],
      manager ? this.db.preschoolStaffAssignment.findMany({ where: { tenantId } }) : [],
    ]);
    return { ...clock, schools, classes, staff, assignments, students: [] };
  }
  async programme(user: Actor, schoolId: string, dto: SchoolProgrammeDto) {
    this.access.allow(user, preschoolManagers);
    if (dto.programme !== undefined) {
      throw new ForbiddenException('Only the platform Super Admin can change school type');
    }
    if (!dto.pickupVerification) {
      throw new BadRequestException('Choose a safe pickup setting to update');
    }
    const data: Prisma.SchoolUpdateManyMutationInput = {};
    if (dto.pickupVerification) data.preschoolPickupVerification = dto.pickupVerification;
    return this.db.$transaction(async (tx) => {
      const result = await tx.school.updateMany({
        where: { id: schoolId, tenantId: this.tenant() },
        data,
      });
      if (!result.count) throw new NotFoundException('School not found');
      if (dto.pickupVerification) {
        await this.audit(
          tx,
          user,
          'PRESCHOOL_PICKUP_VERIFICATION_' + dto.pickupVerification,
          schoolId
        );
      }
      return {
        id: schoolId,
        ...(dto.pickupVerification ? { pickupVerification: dto.pickupVerification } : {}),
      };
    });
  }
  async stage(user: Actor, classId: string, stage: 'PLAYGROUP' | 'NURSERY' | 'LKG' | 'UKG') {
    this.access.allow(user, preschoolManagers);
    return this.db.$transaction(async (tx) => {
      const classroom = await tx.class.findFirst({ where: { id: classId, tenantId: this.tenant() }, include: { school: true } });
      if (!classroom) throw new NotFoundException('Class not found');
      if (!classroom.school.isActive || classroom.school.programme === 'STANDARD') throw new BadRequestException('Enable preschool or combined mode for this campus before assigning a preschool stage');
      const result = await tx.class.updateMany({
        where: { id: classId, tenantId: this.tenant() },
        data: { preschoolStage: stage, educationLevel: 'PRE_PRIMARY', level: { PLAYGROUP: 'Playgroup', NURSERY: 'Nursery', LKG: 'LKG', UKG: 'UKG' }[stage] },
      });
      if (!result.count) throw new NotFoundException('Class not found');
      await this.audit(tx, user, 'PRESCHOOL_STAGE_' + stage, classId);
      return { id: classId };
    });
  }
  async assign(user: Actor, dto: PreschoolAssignmentDto) {
    this.access.allow(user, preschoolManagers);
    await this.access.classroom(user, dto.classId);
    if (
      !(await this.db.staff.findFirst({
        where: {
          id: dto.staffId,
          tenantId: this.tenant(),
          status: 'ACTIVE',
          isTeacher: true,
          userId: { not: null },
        },
      }))
    )
      throw new BadRequestException('Choose an active teacher with a linked account');
    return this.db.$transaction(async (tx) => {
      if (dto.assigned)
        await tx.preschoolStaffAssignment.upsert({
          where: {
            tenantId_classId_staffId: {
              tenantId: this.tenant(),
              classId: dto.classId,
              staffId: dto.staffId,
            },
          },
          create: { tenantId: this.tenant(), classId: dto.classId, staffId: dto.staffId },
          update: {},
        });
      else
        await tx.preschoolStaffAssignment.deleteMany({
          where: { tenantId: this.tenant(), classId: dto.classId, staffId: dto.staffId },
        });
      await this.audit(
        tx,
        user,
        dto.assigned ? 'PRESCHOOL_TEACHER_ASSIGNED' : 'PRESCHOOL_TEACHER_REMOVED',
        dto.classId
      );
      return { assigned: dto.assigned };
    });
  }
  private async range(query: PreschoolQueryDto) {
    const clock = await this.clock();
    const from = preschoolDate(query.from || clock.today),
      to = preschoolDate(query.to || clock.today);
    if (from > to || to.getTime() - from.getTime() > 92 * 86400000)
      throw new BadRequestException('Choose a date range of up to 93 days');
    return { gte: from, lte: to };
  }
  private async resolveServiceDate(dateStr?: string, maxDaysBack = 93) {
    const { today, timezone } = await this.clock();
    const target = dateStr || today;
    const date = preschoolDate(target);
    const todayDate = preschoolDate(today);
    if (date > todayDate) {
      throw new BadRequestException('Choose today or a past date');
    }
    if (todayDate.getTime() - date.getTime() > maxDaysBack * 86400000) {
      throw new BadRequestException(`Choose a date within the last ${maxDaysBack} days`);
    }
    return { dateStr: target, date, today, timezone, isToday: target === today };
  }
  private resolveEventTime(
    ctx: { dateStr: string; timezone: string; isToday: boolean },
    timeStr: string | undefined,
    defaultBackfillTime: string
  ) {
    if (timeStr) {
      const ts = preschoolTimestamp(ctx.dateStr, timeStr, ctx.timezone);
      if (ctx.isToday && ts.getTime() > Date.now() + 60000) {
        throw new BadRequestException('Time cannot be in the future');
      }
      return ts;
    }
    return ctx.isToday
      ? new Date()
      : preschoolTimestamp(ctx.dateStr, defaultBackfillTime, ctx.timezone);
  }
  async roster(user: Actor, classId: string, offset = 0, dateStr?: string) {
    const classroom = await this.access.classroom(user, classId);
    const ctx = await this.resolveServiceDate(dateStr, 365);
    const { today, date, isToday } = ctx;
    const now = new Date();
    const [students, total] = await Promise.all([
      this.db.student.findMany({
        where: {
          tenantId: this.tenant(),
          currentClassId: classId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          guardianLinks: {
            where: { guardian: { tenantId: this.tenant() } },
            select: {
              guardianId: true,
              canPickup: true,
              relationship: true,
              guardian: { select: { firstName: true, lastName: true } },
            },
          },
          preschoolDays: {
            where: { tenantId: this.tenant(), date },
            take: 1,
          },
          attendanceRecords: {
            where: { tenantId: this.tenant(), date, period: 1 },
            select: { id: true, status: true, remarks: true },
            take: 1,
          },
          pickupPasses: {
            where: {
              tenantId: this.tenant(),
              date,
              usedAt: null,
              revokedAt: null,
              expiresAt: { gt: now },
            },
            select: {
              id: true,
              guardianId: true,
              issuedByRole: true,
              deliveryChannels: true,
              expiresAt: true,
              guardian: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: [{ firstName: 'asc' }, { id: 'asc' }],
        take: 50,
        skip: offset,
      }),
      this.db.student.count({
        where: {
          tenantId: this.tenant(),
          currentClassId: classId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
    ]);
    return {
      today,
      date: ctx.dateStr,
      isToday,
      pickupVerification:
        (classroom.school?.preschoolPickupVerification as 'OPTIONAL' | 'REQUIRED') || 'OPTIONAL',
      students: students.map(({ preschoolDays, attendanceRecords, pickupPasses, ...student }) => ({
        ...student,
        day: preschoolDays[0] || null,
        attendance: attendanceRecords?.[0]
          ? {
            status: attendanceRecords[0].status,
            remarks: attendanceRecords[0].remarks || null,
          }
          : preschoolDays[0]?.checkInAt
            ? { status: 'PRESENT', remarks: null }
            : null,
        activePickupPass:
          isToday && pickupPasses?.[0]
            ? {
              id: pickupPasses[0].id,
              guardianId: pickupPasses[0].guardianId,
              guardianName:
                `${pickupPasses[0].guardian.firstName} ${pickupPasses[0].guardian.lastName}`.trim(),
              issuedByRole: pickupPasses[0].issuedByRole,
              deliveryChannels: pickupPasses[0].deliveryChannels,
              expiresAt: pickupPasses[0].expiresAt,
            }
            : null,
      })),
      total,
      offset,
    };
  }
  private async activity(
    tx: Prisma.TransactionClient,
    user: Actor,
    studentId: string,
    title: string,
    description: string,
    type: 'ATTENDANCE' | 'OTHER' = 'OTHER'
  ) {
    return tx.activityFeed.create({
      data: {
        tenantId: this.tenant(),
        studentId,
        title,
        description,
        activityType: type,
        createdBy: user.userId,
        isVisibleToParents: true,
      },
    });
  }
  async checkIn(user: Actor, studentId: string, dto: CheckInDto = {}) {
    this.access.allow(user);
    const student = await this.access.student(user, studentId);
    const ctx = await this.resolveServiceDate(dto?.date);
    const { date, dateStr, isToday } = ctx;
    const now = new Date();
    const checkInAt = this.resolveEventTime(ctx, dto?.time, '09:00');
    return this.db.$transaction(async (tx) => {
      // Serialize attendance and care writes for this child across API instances.
      await tx.student.update({
        where: { id: studentId, tenantId: this.tenant() },
        data: { updatedAt: now },
      });
      const existing = await tx.preschoolDayRecord.findFirst({
        where: { tenantId: this.tenant(), studentId, date },
      });
      if (existing?.checkInAt || existing?.checkOutAt)
        throw new ConflictException(
          isToday
            ? 'Check-in has already been recorded today'
            : `Check-in has already been recorded for ${dateStr}`
        );
      const day = await tx.preschoolDayRecord.upsert({
        where: { tenantId_studentId_date: { tenantId: this.tenant(), studentId, date } },
        create: {
          tenantId: this.tenant(),
          studentId,
          date,
          checkInAt,
          checkedInBy: user.userId,
        },
        update: { checkInAt, checkedInBy: user.userId, version: { increment: 1 } },
      });
      await tx.attendanceRecord.upsert({
        where: {
          tenantId_studentId_date_period: { tenantId: this.tenant(), studentId, date, period: 1 },
        },
        create: {
          tenantId: this.tenant(),
          studentId,
          classId: student.currentClassId,
          date,
          period: 1,
          status: 'PRESENT',
          arrivalTime: checkInAt,
          markedBy: user.userId,
        },
        update: { status: 'PRESENT', arrivalTime: checkInAt, remarks: null, markedBy: user.userId },
      });
      await this.activity(
        tx,
        user,
        studentId,
        'Checked in at preschool',
        isToday
          ? 'Your child has arrived. The school recorded their check-in.'
          : `The school recorded a check-in for ${dateStr}.`,
        'ATTENDANCE'
      );
      await this.audit(
        tx,
        user,
        isToday ? 'PRESCHOOL_CHECK_IN' : 'PRESCHOOL_CHECK_IN_BACKFILLED',
        day.id
      );
      return day;
    });
  }
  async markAbsent(user: Actor, studentId: string, dto: MarkAbsentDto = {}) {
    this.access.allow(user);
    const student = await this.access.student(user, studentId);
    const ctx = await this.resolveServiceDate(dto?.date);
    const { date, dateStr, isToday } = ctx;
    const now = new Date(),
      tenantId = this.tenant();
    const remarks = dto?.remarks?.trim() || null;
    const record = await this.db.$transaction(async (tx) => {
      // Serialize attendance and care writes for this child across API instances.
      await tx.student.update({
        where: { id: studentId, tenantId },
        data: { updatedAt: now },
      });
      const existingDay = await tx.preschoolDayRecord.findFirst({
        where: { tenantId, studentId, date },
      });
      if (existingDay?.checkInAt || existingDay?.checkOutAt) {
        throw new ConflictException(
          isToday
            ? 'Cannot mark absent because check-in has already been recorded today'
            : `Cannot mark absent because check-in has already been recorded for ${dateStr}`
        );
      }
      const existingAttendance = await tx.attendanceRecord.findFirst({
        where: { tenantId, studentId, date, period: 1 },
      });
      if (existingAttendance?.status === 'ABSENT') {
        throw new ConflictException(
          isToday
            ? 'Absence has already been recorded today'
            : `Absence has already been recorded for ${dateStr}`
        );
      }
      const saved = await tx.attendanceRecord.upsert({
        where: {
          tenantId_studentId_date_period: { tenantId, studentId, date, period: 1 },
        },
        create: {
          tenantId,
          studentId,
          classId: student.currentClassId,
          date,
          period: 1,
          status: 'ABSENT',
          arrivalTime: null,
          remarks,
          markedBy: user.userId,
        },
        update: {
          status: 'ABSENT',
          arrivalTime: null,
          remarks,
          markedBy: user.userId,
        },
      });
      await this.activity(
        tx,
        user,
        studentId,
        'Marked absent at preschool',
        isToday
          ? remarks
            ? `Your child was marked absent today (${remarks}). Contact the class teacher if this is incorrect.`
            : 'Your child was marked absent today. Contact the class teacher if this is incorrect.'
          : remarks
            ? `Your child was marked absent on ${dateStr} (${remarks}).`
            : `Your child was marked absent on ${dateStr}.`,
        'ATTENDANCE'
      );
      await this.audit(tx, user, 'PRESCHOOL_MARK_ABSENT', saved?.id || studentId);
      return saved;
    });
    if (isToday && this.notifications && record?.id) {
      await this.notifications.sendAttendanceAlert(record.id);
    }
    return {
      id: record?.id || null,
      studentId,
      date: dateStr,
      status: 'ABSENT' as const,
      remarks,
    };
  }
  async bulkCheckIn(user: Actor, classId: string, dto: BulkCheckInDto = {}) {
    this.access.allow(user);
    await this.access.classroom(user, classId);
    const ctx = await this.resolveServiceDate(dto?.date);
    const { date, dateStr, isToday } = ctx;
    const now = new Date();
    const checkInAt = this.resolveEventTime(ctx, dto?.time, '09:00');
    const tenantId = this.tenant();
    const requestedIds = dto.studentIds?.length ? [...new Set(dto.studentIds)] : undefined;
    return this.db.$transaction(async (tx) => {
      const students = await tx.student.findMany({
        where: {
          tenantId,
          currentClassId: classId,
          status: 'ACTIVE',
          deletedAt: null,
          ...(requestedIds ? { id: { in: requestedIds } } : {}),
        },
        select: { id: true },
        orderBy: { id: 'asc' },
      });
      if (requestedIds && students.length !== requestedIds.length) {
        throw new BadRequestException('All selected children must belong to this preschool class');
      }
      const targetIds = students.map((student) => student.id);
      if (!targetIds.length) {
        return {
          classId,
          date: dateStr,
          checkedInCount: 0,
          skippedCount: 0,
          checkedInStudentIds: [],
          skippedStudentIds: [],
        };
      }
      // Serialize concurrent attendance and care writes for these students.
      await tx.student.updateMany({
        where: { tenantId, id: { in: targetIds } },
        data: { updatedAt: now },
      });
      const [existingDays, existingAttendance] = await Promise.all([
        tx.preschoolDayRecord.findMany({
          where: { tenantId, date, studentId: { in: targetIds } },
          select: { id: true, studentId: true, checkInAt: true, checkOutAt: true },
        }),
        tx.attendanceRecord.findMany({
          where: { tenantId, date, period: 1, studentId: { in: targetIds } },
          select: { studentId: true, status: true },
        }),
      ]);
      const existingByStudent = new Map(existingDays.map((row) => [row.studentId, row]));
      const existingAttendanceByStudent = new Map(
        existingAttendance.map((row) => [row.studentId, row])
      );
      const skippedStudentIds: string[] = [];
      const checkedInStudentIds: string[] = [];
      for (const sid of targetIds) {
        const existing = existingByStudent.get(sid);
        const attendance = existingAttendanceByStudent.get(sid);
        if (
          existing?.checkInAt ||
          existing?.checkOutAt ||
          (!requestedIds && attendance?.status === 'ABSENT')
        ) {
          skippedStudentIds.push(sid);
        } else {
          checkedInStudentIds.push(sid);
        }
      }
      if (checkedInStudentIds.length) {
        const newDayIds = checkedInStudentIds.filter((sid) => !existingByStudent.has(sid));
        const existingDayIds = checkedInStudentIds.filter((sid) => existingByStudent.has(sid));
        if (newDayIds.length) {
          await tx.preschoolDayRecord.createMany({
            data: newDayIds.map((studentId) => ({
              tenantId,
              studentId,
              date,
              checkInAt,
              checkedInBy: user.userId,
            })),
          });
        }
        if (existingDayIds.length) {
          await tx.preschoolDayRecord.updateMany({
            where: {
              tenantId,
              date,
              studentId: { in: existingDayIds },
              checkInAt: null,
              checkOutAt: null,
            },
            data: { checkInAt, checkedInBy: user.userId, version: { increment: 1 } },
          });
        }
        const newAttendanceIds = checkedInStudentIds.filter(
          (sid) => !existingAttendanceByStudent.has(sid)
        );
        const updateAttendanceIds = checkedInStudentIds.filter((sid) =>
          existingAttendanceByStudent.has(sid)
        );
        if (newAttendanceIds.length) {
          await tx.attendanceRecord.createMany({
            data: newAttendanceIds.map((studentId) => ({
              tenantId,
              studentId,
              classId,
              date,
              period: 1,
              status: 'PRESENT',
              arrivalTime: checkInAt,
              markedBy: user.userId,
            })),
          });
        }
        if (updateAttendanceIds.length) {
          await tx.attendanceRecord.updateMany({
            where: { tenantId, date, period: 1, studentId: { in: updateAttendanceIds } },
            data: { status: 'PRESENT', arrivalTime: checkInAt, remarks: null, markedBy: user.userId },
          });
        }
        await tx.activityFeed.createMany({
          data: checkedInStudentIds.map((studentId) => ({
            tenantId,
            studentId,
            title: 'Checked in at preschool',
            description: isToday
              ? 'Your child has arrived. The school recorded their check-in.'
              : `The school recorded a check-in for ${dateStr}.`,
            activityType: 'ATTENDANCE',
            createdBy: user.userId,
            isVisibleToParents: true,
          })),
        });
        await this.audit(tx, user, 'PRESCHOOL_BULK_CHECK_IN', classId);
      }
      return {
        classId,
        date: dateStr,
        checkedInCount: checkedInStudentIds.length,
        skippedCount: skippedStudentIds.length,
        checkedInStudentIds,
        skippedStudentIds,
      };
    });
  }
  async bulkMarkAbsent(user: Actor, classId: string, dto: BulkMarkAbsentDto = {}) {
    this.access.allow(user);
    await this.access.classroom(user, classId);
    const ctx = await this.resolveServiceDate(dto?.date);
    const { date, dateStr, isToday } = ctx;
    const now = new Date();
    const tenantId = this.tenant();
    const remarks = dto?.remarks?.trim() || null;
    const requestedIds = dto.studentIds?.length ? [...new Set(dto.studentIds)] : undefined;
    const result = await this.db.$transaction(async (tx) => {
      const students = await tx.student.findMany({
        where: {
          tenantId,
          currentClassId: classId,
          status: 'ACTIVE',
          deletedAt: null,
          ...(requestedIds ? { id: { in: requestedIds } } : {}),
        },
        select: { id: true },
        orderBy: { id: 'asc' },
      });
      if (requestedIds && students.length !== requestedIds.length) {
        throw new BadRequestException('All selected children must belong to this preschool class');
      }
      const targetIds = students.map((student) => student.id);
      if (!targetIds.length) {
        return {
          classId,
          date: dateStr,
          absentCount: 0,
          skippedCount: 0,
          absentStudentIds: [] as string[],
          skippedStudentIds: [] as string[],
          alertRecordIds: [] as string[],
        };
      }
      // Serialize concurrent attendance and care writes for these students.
      await tx.student.updateMany({
        where: { tenantId, id: { in: targetIds } },
        data: { updatedAt: now },
      });
      const [existingDays, existingAttendance] = await Promise.all([
        tx.preschoolDayRecord.findMany({
          where: { tenantId, date, studentId: { in: targetIds } },
          select: { id: true, studentId: true, checkInAt: true, checkOutAt: true },
        }),
        tx.attendanceRecord.findMany({
          where: { tenantId, date, period: 1, studentId: { in: targetIds } },
          select: { id: true, studentId: true, status: true },
        }),
      ]);
      const existingByStudent = new Map(existingDays.map((row) => [row.studentId, row]));
      const existingAttendanceByStudent = new Map(
        existingAttendance.map((row) => [row.studentId, row])
      );
      const skippedStudentIds: string[] = [];
      const absentStudentIds: string[] = [];
      for (const sid of targetIds) {
        const existing = existingByStudent.get(sid);
        const attendance = existingAttendanceByStudent.get(sid);
        if (existing?.checkInAt || existing?.checkOutAt || attendance?.status === 'ABSENT') {
          skippedStudentIds.push(sid);
        } else {
          absentStudentIds.push(sid);
        }
      }
      let alertRecordIds: string[] = [];
      if (absentStudentIds.length) {
        const newAttendanceIds = absentStudentIds.filter(
          (sid) => !existingAttendanceByStudent.has(sid)
        );
        const updateAttendanceIds = absentStudentIds.filter((sid) =>
          existingAttendanceByStudent.has(sid)
        );
        if (newAttendanceIds.length) {
          await tx.attendanceRecord.createMany({
            data: newAttendanceIds.map((studentId) => ({
              tenantId,
              studentId,
              classId,
              date,
              period: 1,
              status: 'ABSENT',
              arrivalTime: null,
              remarks,
              markedBy: user.userId,
            })),
          });
        }
        if (updateAttendanceIds.length) {
          await tx.attendanceRecord.updateMany({
            where: { tenantId, date, period: 1, studentId: { in: updateAttendanceIds } },
            data: { status: 'ABSENT', arrivalTime: null, remarks, markedBy: user.userId },
          });
        }
        await tx.activityFeed.createMany({
          data: absentStudentIds.map((studentId) => ({
            tenantId,
            studentId,
            title: 'Marked absent at preschool',
            description: isToday
              ? remarks
                ? `Your child was marked absent today (${remarks}). Contact the class teacher if this is incorrect.`
                : 'Your child was marked absent today. Contact the class teacher if this is incorrect.'
              : remarks
                ? `Your child was marked absent on ${dateStr} (${remarks}).`
                : `Your child was marked absent on ${dateStr}.`,
            activityType: 'ATTENDANCE',
            createdBy: user.userId,
            isVisibleToParents: true,
          })),
        });
        await this.audit(tx, user, 'PRESCHOOL_BULK_MARK_ABSENT', classId);
        if (isToday && this.notifications) {
          const savedRows = await tx.attendanceRecord.findMany({
            where: { tenantId, date, period: 1, status: 'ABSENT', studentId: { in: absentStudentIds } },
            select: { id: true },
          });
          alertRecordIds = savedRows.map((r) => r.id);
        }
      }
      return {
        classId,
        date: dateStr,
        absentCount: absentStudentIds.length,
        skippedCount: skippedStudentIds.length,
        absentStudentIds,
        skippedStudentIds,
        alertRecordIds,
      };
    });
    if (isToday && this.notifications && result.alertRecordIds.length) {
      for (const recordId of result.alertRecordIds) {
        await this.notifications.sendAttendanceAlert(recordId);
      }
    }
    const { alertRecordIds: _alertRecordIds, ...response } = result;
    return response;
  }
  async pickupPermission(user: Actor, studentId: string, guardianId: string, canPickup: boolean) {
    this.access.allow(user, preschoolManagers);
    await this.access.student(user, studentId);
    return this.db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId, tenantId: this.tenant() },
        data: { updatedAt: new Date() },
      });
      const result = await tx.guardianStudentLink.updateMany({
        where: {
          studentId,
          guardianId,
          guardian: { tenantId: this.tenant() },
          student: { tenantId: this.tenant() },
        },
        data: { canPickup },
      });
      if (!result.count) throw new NotFoundException('Linked guardian not found');
      await this.audit(
        tx,
        user,
        canPickup ? 'PRESCHOOL_PICKUP_ALLOWED' : 'PRESCHOOL_PICKUP_REVOKED',
        studentId
      );
      return { canPickup };
    });
  }
  async checkOut(user: Actor, studentId: string, dto: CheckOutDto) {
    this.access.allow(user);
    const student = await this.access.student(user, studentId);
    if (!dto.identityVerified)
      throw new BadRequestException('Verify the collecting guardian’s identity before checkout');
    const pickupPolicy =
      (student.currentClass?.school?.preschoolPickupVerification as 'OPTIONAL' | 'REQUIRED') ||
      'OPTIONAL';
    const ctx = await this.resolveServiceDate(dto.date);
    const { today, date, dateStr, isToday } = ctx;
    const usingPass = !!(dto.pickupOtp?.trim() || dto.pickupQrToken?.trim());
    if (!isToday && usingPass) {
      throw new BadRequestException(
        'Pickup OTP or QR passes can only be used for today. Choose an authorized guardian to backfill a past checkout.'
      );
    }
    if (isToday && pickupPolicy === 'REQUIRED' && !usingPass) {
      throw new BadRequestException('Parent pickup OTP or QR pass is required for checkout');
    }
    if (!usingPass && !dto.guardianId) {
      throw new BadRequestException('Choose an authorized pickup guardian');
    }
    const checkOutAt = this.resolveEventTime(ctx, dto.time, '15:00');
    const tenantId = this.tenant();
    return this.db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId, tenantId },
        data: { updatedAt: new Date() },
      });
      let resolvedGuardianId = dto.guardianId;
      let verificationMethod: 'MANUAL' | 'OTP' | 'QR' = 'MANUAL';
      let pickupPassId: string | null = null;
      const row = await tx.preschoolDayRecord.findFirst({
        where: { tenantId, studentId, date },
      });

      if (usingPass) {
        if (!row?.checkInAt || row.checkOutAt)
          throw new ConflictException('Checkout requires an active check-in today');
        if (!this.pickup) {
          throw new BadRequestException('Safe pickup OTP/QR verification is unavailable');
        }
        const verified = await this.pickup.verifyForCheckout(
          tx,
          tenantId,
          studentId,
          today,
          date,
          dto
        );
        resolvedGuardianId = verified.guardianId;
        verificationMethod = verified.method;
        pickupPassId = verified.passId;
      }

      // Lock the authorized link as well: legacy guardian unlink operations must
      // not remove pickup authorization between verification and commit.
      const authorized = await tx.guardianStudentLink.updateMany({
        where: {
          studentId,
          guardianId: resolvedGuardianId!,
          canPickup: true,
          guardian: { tenantId },
          student: { tenantId },
        },
        data: { canPickup: true },
      });
      if (!authorized.count)
        throw new BadRequestException(
          'This person is not an authorized pickup guardian for this child'
        );
      const link = await tx.guardianStudentLink.findFirst({
        where: {
          studentId,
          guardianId: resolvedGuardianId!,
          canPickup: true,
          guardian: { tenantId },
          student: { tenantId },
        },
        include: { guardian: { select: { firstName: true, lastName: true } } },
      });
      if (!link)
        throw new BadRequestException(
          'This person is not an authorized pickup guardian for this child'
        );
      if (!row?.checkInAt || row.checkOutAt)
        throw new ConflictException(
          isToday
            ? 'Checkout requires an active check-in today'
            : `Checkout requires an active check-in for ${dateStr}`
        );
      if (checkOutAt.getTime() < new Date(row.checkInAt).getTime()) {
        throw new BadRequestException('Checkout time cannot be earlier than check-in time');
      }
      const result = await tx.preschoolDayRecord.updateMany({
        where: { id: row.id, tenantId, checkOutAt: null, version: row.version },
        data: {
          checkOutAt,
          checkedOutBy: user.userId,
          pickupGuardianId: resolvedGuardianId!,
          pickupVerificationMethod: verificationMethod,
          ...(pickupPassId ? { pickupPassId } : {}),
          version: { increment: 1 },
        },
      });
      if (!result.count) throw new ConflictException('Record changed. Refresh before trying again');
      const verificationSummary =
        verificationMethod === 'OTP'
          ? 'Verified with parent pickup OTP.'
          : verificationMethod === 'QR'
            ? 'Verified with parent pickup QR pass.'
            : isToday
              ? 'School staff verified the pickup.'
              : `Recorded by school staff for ${dateStr}.`;
      await this.activity(
        tx,
        user,
        studentId,
        'Collected from preschool',
        `Collected by ${link.guardian.firstName} ${link.guardian.lastName}. ${verificationSummary}`,
        'ATTENDANCE'
      );
      const auditAction = !isToday
        ? 'PRESCHOOL_CHECK_OUT_BACKFILLED'
        : verificationMethod === 'OTP'
          ? 'PRESCHOOL_CHECK_OUT_OTP_VERIFIED'
          : verificationMethod === 'QR'
            ? 'PRESCHOOL_CHECK_OUT_QR_VERIFIED'
            : 'PRESCHOOL_CHECK_OUT_IDENTITY_VERIFIED';
      await this.audit(tx, user, auditAction, row.id);
      return { id: row.id, verificationMethod, guardianId: resolvedGuardianId };
    });
  }
  async undoCheckIn(user: Actor, studentId: string, dto: UndoDayActionDto = {}) {
    this.access.allow(user);
    await this.access.student(user, studentId);
    const { date, dateStr, isToday } = await this.resolveServiceDate(dto?.date);
    const tenantId = this.tenant();
    const now = new Date();
    return this.db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId, tenantId },
        data: { updatedAt: now },
      });
      const existing = await tx.preschoolDayRecord.findFirst({
        where: { tenantId, studentId, date },
      });
      if (!existing?.checkInAt) {
        throw new ConflictException(
          isToday
            ? 'No check-in is recorded today'
            : `No check-in is recorded for ${dateStr}`
        );
      }
      if (existing.checkOutAt) {
        throw new ConflictException('Undo checkout before undoing check-in');
      }
      const updated = await tx.preschoolDayRecord.updateMany({
        where: { id: existing.id, tenantId, checkOutAt: null, version: existing.version },
        data: { checkInAt: null, checkedInBy: null, version: { increment: 1 } },
      });
      if (!updated.count) {
        throw new ConflictException('Record changed. Refresh before trying again');
      }
      await tx.attendanceRecord.deleteMany({
        where: { tenantId, studentId, date, period: 1, status: 'PRESENT' },
      });
      await this.activity(
        tx,
        user,
        studentId,
        'Check-in corrected',
        isToday
          ? 'School staff cleared today’s check-in entry.'
          : `School staff cleared the check-in entry for ${dateStr}.`,
        'ATTENDANCE'
      );
      await this.audit(tx, user, 'PRESCHOOL_CHECK_IN_UNDONE', existing.id);
      return { undone: true, id: existing.id, studentId, date: dateStr };
    });
  }
  async undoCheckOut(user: Actor, studentId: string, dto: UndoDayActionDto = {}) {
    this.access.allow(user);
    await this.access.student(user, studentId);
    const { date, dateStr, isToday } = await this.resolveServiceDate(dto?.date);
    const tenantId = this.tenant();
    const now = new Date();
    return this.db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId, tenantId },
        data: { updatedAt: now },
      });
      const existing = await tx.preschoolDayRecord.findFirst({
        where: { tenantId, studentId, date },
      });
      if (!existing?.checkOutAt) {
        throw new ConflictException(
          isToday
            ? 'No checkout is recorded today'
            : `No checkout is recorded for ${dateStr}`
        );
      }
      const updated = await tx.preschoolDayRecord.updateMany({
        where: { id: existing.id, tenantId, version: existing.version },
        data: {
          checkOutAt: null,
          checkedOutBy: null,
          pickupGuardianId: null,
          pickupVerificationMethod: null,
          pickupPassId: null,
          version: { increment: 1 },
        },
      });
      if (!updated.count) {
        throw new ConflictException('Record changed. Refresh before trying again');
      }
      await this.activity(
        tx,
        user,
        studentId,
        'Checkout corrected',
        isToday
          ? 'School staff reopened today’s checkout entry.'
          : `School staff reopened the checkout entry for ${dateStr}.`,
        'ATTENDANCE'
      );
      await this.audit(tx, user, 'PRESCHOOL_CHECK_OUT_UNDONE', existing.id);
      return { undone: true, id: existing.id, studentId, date: dateStr };
    });
  }
  async undoAbsent(user: Actor, studentId: string, dto: UndoDayActionDto = {}) {
    this.access.allow(user);
    await this.access.student(user, studentId);
    const { date, dateStr, isToday } = await this.resolveServiceDate(dto?.date);
    const tenantId = this.tenant();
    const now = new Date();
    return this.db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId, tenantId },
        data: { updatedAt: now },
      });
      const existing = await tx.attendanceRecord.findFirst({
        where: { tenantId, studentId, date, period: 1 },
      });
      if (existing?.status !== 'ABSENT') {
        throw new ConflictException(
          isToday
            ? 'No absence is recorded today'
            : `No absence is recorded for ${dateStr}`
        );
      }
      await tx.attendanceRecord.deleteMany({
        where: { tenantId, studentId, date, period: 1, status: 'ABSENT' },
      });
      await this.activity(
        tx,
        user,
        studentId,
        'Attendance corrected',
        isToday
          ? 'School staff cleared today’s absence entry.'
          : `School staff cleared the absence entry for ${dateStr}.`,
        'ATTENDANCE'
      );
      await this.audit(tx, user, 'PRESCHOOL_ABSENCE_UNDONE', existing.id);
      return { undone: true, studentId, date: dateStr };
    });
  }
  async correctDayTimes(user: Actor, studentId: string, dto: CorrectDayTimesDto) {
    this.access.allow(user);
    await this.access.student(user, studentId);
    if (!dto.checkInTime && !dto.checkOutTime && !dto.pickupGuardianId) {
      throw new BadRequestException(
        'Choose a check-in time, checkout time or collecting guardian to update'
      );
    }
    const ctx = await this.resolveServiceDate(dto.date);
    const { date, dateStr, isToday, timezone } = ctx;
    const tenantId = this.tenant();
    const now = new Date();
    return this.db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId, tenantId },
        data: { updatedAt: now },
      });
      const row = await tx.preschoolDayRecord.findFirst({
        where: { tenantId, studentId, date },
      });
      if (!row) {
        throw new NotFoundException('Daily attendance record not found for this date');
      }
      if (row.version !== dto.version) {
        throw new ConflictException('Daily record changed. Refresh before saving');
      }
      let nextCheckInAt: Date | undefined;
      if (dto.checkInTime) {
        if (!row.checkInAt) {
          throw new BadRequestException('Record a check-in before adjusting its time');
        }
        nextCheckInAt = preschoolTimestamp(dateStr, dto.checkInTime, timezone);
        if (isToday && nextCheckInAt.getTime() > Date.now() + 60000) {
          throw new BadRequestException('Check-in time cannot be in the future');
        }
      }
      let nextCheckOutAt: Date | undefined;
      if (dto.checkOutTime) {
        if (!row.checkOutAt) {
          throw new BadRequestException('Record a checkout before adjusting its time');
        }
        nextCheckOutAt = preschoolTimestamp(dateStr, dto.checkOutTime, timezone);
        if (isToday && nextCheckOutAt.getTime() > Date.now() + 60000) {
          throw new BadRequestException('Checkout time cannot be in the future');
        }
      }
      const effectiveIn = nextCheckInAt || (row.checkInAt ? new Date(row.checkInAt) : null);
      const effectiveOut = nextCheckOutAt || (row.checkOutAt ? new Date(row.checkOutAt) : null);
      if (effectiveIn && effectiveOut && effectiveOut.getTime() < effectiveIn.getTime()) {
        throw new BadRequestException('Checkout time cannot be earlier than check-in time');
      }
      let nextPickupGuardianId: string | undefined;
      if (dto.pickupGuardianId) {
        if (!row.checkOutAt) {
          throw new BadRequestException('Record a checkout before updating the collecting guardian');
        }
        const authorized = await tx.guardianStudentLink.findFirst({
          where: {
            studentId,
            guardianId: dto.pickupGuardianId,
            canPickup: true,
            guardian: { tenantId },
            student: { tenantId },
          },
        });
        if (!authorized) {
          throw new BadRequestException(
            'This person is not an authorized pickup guardian for this child'
          );
        }
        nextPickupGuardianId = dto.pickupGuardianId;
      }
      const result = await tx.preschoolDayRecord.updateMany({
        where: { id: row.id, tenantId, version: dto.version },
        data: {
          ...(nextCheckInAt ? { checkInAt: nextCheckInAt } : {}),
          ...(nextCheckOutAt ? { checkOutAt: nextCheckOutAt } : {}),
          ...(nextPickupGuardianId ? { pickupGuardianId: nextPickupGuardianId } : {}),
          version: { increment: 1 },
        },
      });
      if (!result.count) {
        throw new ConflictException('Daily record changed. Refresh before saving');
      }
      if (nextCheckInAt) {
        await tx.attendanceRecord.updateMany({
          where: { tenantId, studentId, date, period: 1 },
          data: { arrivalTime: nextCheckInAt, markedBy: user.userId },
        });
      }
      await this.audit(tx, user, 'PRESCHOOL_ATTENDANCE_CORRECTED', row.id);
      return {
        id: row.id,
        date: dateStr,
        checkInAt: effectiveIn,
        checkOutAt: effectiveOut,
        pickupGuardianId: nextPickupGuardianId || row.pickupGuardianId || null,
      };
    });
  }
  async care(user: Actor, studentId: string, dto: CareRecordDto) {
    this.access.allow(user);
    await this.access.student(user, studentId);
    const { date, dateStr, isToday } = await this.resolveServiceDate(dto.date);
    const { version, shareWithParents, date: _date, ...details } = dto;
    return this.db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId, tenantId: this.tenant() },
        data: { updatedAt: new Date() },
      });
      const row = await tx.preschoolDayRecord.findFirst({
        where: { tenantId: this.tenant(), studentId, date },
      });
      if ((row?.version || 0) !== version)
        throw new ConflictException('Daily record changed. Refresh before saving');
      const data = { ...details, sharedAt: shareWithParents ? new Date() : null };
      const saved = row
        ? await tx.preschoolDayRecord.update({
          where: { id: row.id, tenantId: this.tenant() },
          data: { ...data, version: { increment: 1 } },
        })
        : await tx.preschoolDayRecord.create({
          data: { tenantId: this.tenant(), studentId, date, ...data },
        });
      if (shareWithParents)
        await this.activity(
          tx,
          user,
          studentId,
          'Daily care update',
          isToday
            ? 'Today’s meals, rest and classroom notes are available in your preschool workspace.'
            : `Care notes for ${dateStr} are available in your preschool workspace.`
        );
      await this.audit(
        tx,
        user,
        shareWithParents ? 'PRESCHOOL_CARE_SHARED' : 'PRESCHOOL_CARE_SAVED',
        saved.id
      );
      return saved;
    });
  }
  async bulkCare(user: Actor, classId: string, dto: BulkCareRecordDto) {
    this.access.allow(user);
    await this.access.classroom(user, classId);
    const patch: {
      meals?: string;
      sleepMinutes?: number | null;
      toileting?: string;
      mood?: string;
      notes?: string;
    } = {};
    if (dto.meals !== undefined) patch.meals = dto.meals;
    if (dto.sleepMinutes !== undefined) patch.sleepMinutes = dto.sleepMinutes;
    if (dto.toileting !== undefined) patch.toileting = dto.toileting;
    if (dto.mood !== undefined) patch.mood = dto.mood;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    if (!Object.keys(patch).length && !dto.shareWithParents) {
      throw new BadRequestException(
        'Choose at least one care detail to update or enable sharing with parents'
      );
    }
    const { date, dateStr, isToday } = await this.resolveServiceDate(dto.date);
    const now = new Date();
    const tenantId = this.tenant();
    const requestedIds = dto.studentIds?.length ? [...new Set(dto.studentIds)] : undefined;
    return this.db.$transaction(async (tx) => {
      const students = await tx.student.findMany({
        where: {
          tenantId,
          currentClassId: classId,
          status: 'ACTIVE',
          deletedAt: null,
          ...(requestedIds ? { id: { in: requestedIds } } : {}),
        },
        select: { id: true },
        orderBy: { id: 'asc' },
      });
      if (requestedIds && students.length !== requestedIds.length) {
        throw new BadRequestException('All selected children must belong to this preschool class');
      }
      const targetIds = students.map((student) => student.id);
      if (!targetIds.length) {
        return {
          classId,
          date: dateStr,
          updatedCount: 0,
          skippedCount: 0,
          sharedWithParents: dto.shareWithParents,
          updatedStudentIds: [],
          skippedStudentIds: [],
        };
      }
      await tx.student.updateMany({
        where: { tenantId, id: { in: targetIds } },
        data: { updatedAt: now },
      });
      const existingDays = await tx.preschoolDayRecord.findMany({
        where: { tenantId, date, studentId: { in: targetIds } },
        select: { id: true, studentId: true, checkInAt: true },
      });
      const existingByStudent = new Map(existingDays.map((row) => [row.studentId, row]));
      const updatedStudentIds: string[] = [];
      const skippedStudentIds: string[] = [];
      for (const sid of targetIds) {
        const existing = existingByStudent.get(sid);
        if (dto.checkedInOnly && !existing?.checkInAt) skippedStudentIds.push(sid);
        else updatedStudentIds.push(sid);
      }
      if (updatedStudentIds.length) {
        const newDayIds = updatedStudentIds.filter((sid) => !existingByStudent.has(sid));
        const existingDayIds = updatedStudentIds.filter((sid) => existingByStudent.has(sid));
        if (newDayIds.length) {
          await tx.preschoolDayRecord.createMany({
            data: newDayIds.map((studentId) => ({
              tenantId,
              studentId,
              date,
              ...patch,
              sharedAt: dto.shareWithParents ? now : null,
            })),
          });
        }
        if (existingDayIds.length) {
          await tx.preschoolDayRecord.updateMany({
            where: { tenantId, date, studentId: { in: existingDayIds } },
            data: {
              ...patch,
              ...(dto.shareWithParents ? { sharedAt: now } : {}),
              version: { increment: 1 },
            },
          });
        }
        if (dto.shareWithParents) {
          await tx.activityFeed.createMany({
            data: updatedStudentIds.map((studentId) => ({
              tenantId,
              studentId,
              title: 'Daily care update',
              description: isToday
                ? 'Today’s meals, rest and classroom notes are available in your preschool workspace.'
                : `Care notes for ${dateStr} are available in your preschool workspace.`,
              activityType: 'OTHER',
              createdBy: user.userId,
              isVisibleToParents: true,
            })),
          });
        }
        await this.audit(
          tx,
          user,
          dto.shareWithParents ? 'PRESCHOOL_BULK_CARE_SHARED' : 'PRESCHOOL_BULK_CARE_SAVED',
          classId
        );
      }
      return {
        classId,
        date: dateStr,
        updatedCount: updatedStudentIds.length,
        skippedCount: skippedStudentIds.length,
        sharedWithParents: dto.shareWithParents,
        updatedStudentIds,
        skippedStudentIds,
      };
    });
  }
  async observe(user: Actor, dto: ObservationDto) {
    this.access.allow(user);
    await this.access.student(user, dto.studentId);
    if (dto.skill.trim().length < 2 || dto.observation.trim().length < 5)
      throw new BadRequestException('Describe the observed skill and what happened');
    const date = preschoolDate(dto.observedOn);
    if (date > preschoolDate((await this.clock()).today))
      throw new BadRequestException('Observation date cannot be in the future');
    return this.db.$transaction(async (tx) => {
      const row = await tx.developmentObservation.create({
        data: {
          ...dto,
          skill: dto.skill.trim(),
          observation: dto.observation.trim(),
          observedOn: date,
          tenantId: this.tenant(),
          createdBy: user.userId,
        },
      });
      if (dto.shared)
        await this.activity(
          tx,
          user,
          dto.studentId,
          'New development observation',
          `${dto.skill}: ${dto.observation}`
        );
      await this.audit(tx, user, 'PRESCHOOL_OBSERVATION_RECORDED', row.id);
      return row;
    });
  }
  async updateObservation(user: Actor, id: string, dto: UpdateObservationDto) {
    this.access.allow(user);
    const tenantId = this.tenant();
    const existing = await this.db.developmentObservation.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Observation not found');
    await this.access.student(user, existing.studentId);
    const skill = dto.skill.trim();
    const observation = dto.observation.trim();
    if (skill.length < 2 || observation.length < 5)
      throw new BadRequestException('Describe the observed skill and what happened');
    const date = preschoolDate(dto.observedOn);
    if (date > preschoolDate((await this.clock()).today))
      throw new BadRequestException('Observation date cannot be in the future');
    return this.db.$transaction(async (tx) => {
      const updated = await tx.developmentObservation.updateMany({
        where: { id, tenantId },
        data: {
          domain: dto.domain,
          level: dto.level,
          skill,
          observation,
          observedOn: date,
          shared: dto.shared,
        },
      });
      if (!updated.count) throw new NotFoundException('Observation not found');
      if (!existing.shared && dto.shared) {
        await this.activity(
          tx,
          user,
          existing.studentId,
          'New development observation',
          `${skill}: ${observation}`
        );
      }
      await this.audit(tx, user, 'PRESCHOOL_OBSERVATION_UPDATED', id);
      return {
        ...existing,
        domain: dto.domain,
        level: dto.level,
        skill,
        observation,
        observedOn: date,
        shared: dto.shared,
      };
    });
  }
  async deleteObservation(user: Actor, id: string) {
    this.access.allow(user);
    const tenantId = this.tenant();
    const existing = await this.db.developmentObservation.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Observation not found');
    await this.access.student(user, existing.studentId);
    return this.db.$transaction(async (tx) => {
      const result = await tx.developmentObservation.deleteMany({ where: { id, tenantId } });
      if (!result.count) throw new NotFoundException('Observation not found');
      await this.audit(tx, user, 'PRESCHOOL_OBSERVATION_DELETED', id);
      return { deleted: true, id };
    });
  }
  async child(user: Actor, studentId: string, query: PreschoolQueryDto) {
    const student = await this.access.student(user, studentId);
    const range = await this.range(query),
      tenantId = this.tenant(),
      parent = user.role === 'PARENT';
    const observationWhere = {
      tenantId,
      studentId,
      observedOn: range,
      ...(parent ? { shared: true } : {}),
    };
    const [days, attendanceRecords, observations, groupedObservations, activities, content] =
      await Promise.all([
        this.db.preschoolDayRecord.findMany({
          where: { tenantId, studentId, date: range },
          orderBy: { date: 'desc' },
          take: 93,
        }),
        this.db.attendanceRecord.findMany({
          where: { tenantId, studentId, date: range, period: 1 },
          select: { id: true, date: true, status: true, remarks: true },
          orderBy: { date: 'desc' },
          take: 93,
        }),
        this.db.developmentObservation.findMany({
          where: observationWhere,
          orderBy: [{ observedOn: 'desc' }, { createdAt: 'desc' }],
          take: 101,
          skip: query.offset || 0,
        }),
        typeof this.db.developmentObservation.groupBy === 'function'
          ? this.db.developmentObservation.groupBy({
              by: ['domain', 'level'],
              where: observationWhere,
              _count: { _all: true },
            })
          : Promise.resolve(null),
        this.db.activityFeed.findMany({
          where: { tenantId, studentId, isVisibleToParents: true },
          select: { id: true, title: true, description: true, createdAt: true, activityType: true },
          orderBy: { createdAt: 'desc' },
          take: 30,
        }),
        this.db.preschoolContent.findMany({
          where: {
            tenantId,
            classId: student.currentClassId!,
            status: 'PUBLISHED',
            scheduledOn: range,
          },
          orderBy: { scheduledOn: 'desc' },
          take: 100,
        }),
      ]);
    const dayKey = (value: Date | string) =>
      value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
    const attendanceByDate = new Map(
      (attendanceRecords || []).map((rec) => [dayKey(rec.date), rec])
    );
    const seenDates = new Set<string>();
    const visibleDays = days.map((day) => {
      const key = dayKey(day.date);
      seenDates.add(key);
      const att = attendanceByDate.get(key);
      const attendanceStatus = att?.status || (day.checkInAt ? 'PRESENT' : null);
      const attendanceRemarks = att?.remarks || null;
      return parent && !day.sharedAt
        ? {
          id: day.id,
          date: day.date,
          checkInAt: day.checkInAt,
          checkOutAt: day.checkOutAt,
          pickupVerificationMethod: day.pickupVerificationMethod,
          attendanceStatus,
          attendanceRemarks,
          sharedAt: null,
        }
        : {
          ...day,
          attendanceStatus,
          attendanceRemarks,
        };
    });
    for (const att of attendanceRecords || []) {
      const key = dayKey(att.date);
      if (seenDates.has(key) || att.status !== 'ABSENT') continue;
      visibleDays.push({
        id: 'att-' + att.id,
        date: att.date,
        checkInAt: null,
        checkOutAt: null,
        pickupVerificationMethod: null,
        attendanceStatus: att.status,
        attendanceRemarks: att.remarks || null,
        sharedAt: null,
      });
    }
    visibleDays.sort((a, b) => dayKey(b.date).localeCompare(dayKey(a.date)));
    const domainSummary = Array.isArray(groupedObservations)
      ? groupedObservations.map((row) => ({
          domain: row.domain,
          level: row.level,
          _count: { _all: row._count._all },
        }))
      : Object.values(
          observations.reduce<
            Record<string, { domain: string; level: string; _count: { _all: number } }>
          >((acc, obs) => {
            const key = `${obs.domain}::${obs.level}`;
            if (!acc[key]) {
              acc[key] = { domain: obs.domain, level: obs.level, _count: { _all: 0 } };
            }
            acc[key]._count._all += 1;
            return acc;
          }, {})
        );
    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        className: student.currentClass!.name,
        preschoolStage: student.currentClass!.preschoolStage || null,
        schoolName: student.currentClass!.school?.name || '',
        dateOfBirth: student.dateOfBirth || null,
      },
      days: visibleDays,
      observations: observations.slice(0, 100),
      hasMoreObservations: observations.length > 100,
      domainSummary,
      activities,
      content,
    };
  }
  async content(user: Actor, query: PreschoolQueryDto) {
    if (!query.classId) throw new BadRequestException('Choose a class');
    await this.access.classroom(user, query.classId);
    const rows = await this.db.preschoolContent.findMany({
      where: { tenantId: this.tenant(), classId: query.classId },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: 51,
      skip: query.offset || 0,
    });
    return { items: rows.slice(0, 50), hasMore: rows.length > 50 };
  }
  private validateContent(dto: SavePreschoolContentDto) {
    if (
      dto.ageMinMonths > dto.ageMaxMonths ||
      !dto.theme.trim() ||
      !dto.title.trim() ||
      !dto.body.trim() ||
      !dto.learningGoals.trim()
    )
      throw new BadRequestException('Check the age range and teaching content');
    return { ...dto, scheduledOn: dto.scheduledOn ? preschoolDate(dto.scheduledOn) : null };
  }
  async saveContent(user: Actor, dto: SavePreschoolContentDto) {
    await this.access.classroom(user, dto.classId);
    return this.db.$transaction(async (tx) => {
      const row = await tx.preschoolContent.create({
        data: { ...this.validateContent(dto), tenantId: this.tenant(), createdBy: user.userId },
      });
      await this.audit(tx, user, 'PRESCHOOL_CONTENT_CREATED', row.id);
      return row;
    });
  }
  async updateContent(user: Actor, id: string, dto: UpdatePreschoolContentDto) {
    const row = await this.db.preschoolContent.findFirst({
      where: { id, tenantId: this.tenant() },
    });
    if (!row) throw new NotFoundException('Teaching content not found');
    await this.access.classroom(user, row.classId);
    if (row.classId !== dto.classId)
      throw new BadRequestException('Content cannot be moved to another class');
    const { version, ...data } = dto;
    return this.db.$transaction(async (tx) => {
      const result = await tx.preschoolContent.updateMany({
        where: { id, tenantId: this.tenant(), version },
        data: {
          ...this.validateContent(data),
          status: 'DRAFT',
          publishedAt: null,
          publishedBy: null,
          version: { increment: 1 },
        },
      });
      if (!result.count) throw new ConflictException('Content changed. Refresh before saving');
      await this.audit(tx, user, 'PRESCHOOL_CONTENT_UPDATED', id);
      return { id };
    });
  }
  async publish(user: Actor, id: string, version: number, reviewed: boolean) {
    this.access.allow(user);
    if (!reviewed)
      throw new BadRequestException('Review the content before sharing it with families');
    const row = await this.db.preschoolContent.findFirst({
      where: { id, tenantId: this.tenant() },
    });
    if (!row) throw new NotFoundException('Teaching content not found');
    await this.access.classroom(user, row.classId);
    if (!row.scheduledOn)
      throw new BadRequestException('Choose a scheduled date before publishing');
    return this.db.$transaction(async (tx) => {
      const result = await tx.preschoolContent.updateMany({
        where: { id, tenantId: this.tenant(), version, status: 'DRAFT' },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedBy: user.userId,
          version: { increment: 1 },
        },
      });
      if (!result.count) throw new ConflictException('Content changed or is already published');
      await this.audit(tx, user, 'PRESCHOOL_CONTENT_PUBLISHED', id);
      return { id };
    });
  }
  async deleteContent(user: Actor, id: string) {
    this.access.allow(user);
    const tenantId = this.tenant();
    const row = await this.db.preschoolContent.findFirst({
      where: { id, tenantId },
    });
    if (!row) throw new NotFoundException('Teaching content not found');
    await this.access.classroom(user, row.classId);
    return this.db.$transaction(async (tx) => {
      const result = await tx.preschoolContent.deleteMany({ where: { id, tenantId } });
      if (!result.count) throw new NotFoundException('Teaching content not found');
      await this.audit(tx, user, 'PRESCHOOL_CONTENT_DELETED', id);
      return { deleted: true, id };
    });
  }
  async report(user: Actor, query: PreschoolQueryDto) {
    if (!query.classId) throw new BadRequestException('Choose a class');
    const classroom = await this.access.classroom(user, query.classId);
    const range = await this.range(query),
      tenantId = this.tenant();
    const students = await this.db.student.findMany({
      where: { tenantId, currentClassId: query.classId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, admissionDate: true, status: true },
      orderBy: { firstName: 'asc' },
    });
    const ids = students.map((s) => s.id);
    const [days, observations, invoices, attendance] = await Promise.all([
      this.db.preschoolDayRecord.findMany({
        where: { tenantId, studentId: { in: ids }, date: range },
        select: { studentId: true, date: true, checkInAt: true, checkOutAt: true, sharedAt: true },
      }),
      this.db.developmentObservation.groupBy({
        by: ['studentId', 'domain', 'level'],
        where: { tenantId, studentId: { in: ids }, observedOn: range },
        _count: { _all: true },
      }),
      preschoolManagers.includes(user.role)
        ? this.db.invoice.groupBy({
          by: ['studentId'],
          where: { tenantId, studentId: { in: ids }, status: { not: 'CANCELLED' } },
          _sum: { balanceAmount: true },
        })
        : [],
      this.db.attendanceRecord.groupBy({
        by: ['studentId', 'status'],
        where: { tenantId, studentId: { in: ids }, date: range, period: 1 },
        _count: { _all: true },
      }),
    ]);
    return {
      range,
      classroom: {
        id: classroom.id,
        name: classroom.name,
        preschoolStage: classroom.preschoolStage || null,
        schoolName: classroom.school?.name || '',
      },
      students: students.map((s) => ({
        ...s,
        checkIns: days.filter((d) => d.studentId === s.id && d.checkInAt).length,
        checkOuts: days.filter((d) => d.studentId === s.id && d.checkOutAt).length,
        careUpdates: days.filter((d) => d.studentId === s.id && d.sharedAt).length,
        observations: observations.filter((o) => o.studentId === s.id),
        attendance: attendance.filter((a) => a.studentId === s.id),
        ...(preschoolManagers.includes(user.role)
          ? {
            outstandingBalance:
              invoices.find((i) => i.studentId === s.id)?._sum.balanceAmount || 0,
          }
          : {}),
      })),
      admissionsInRange: students.filter(
        (s) =>
          s.admissionDate >= range.gte && s.admissionDate < new Date(range.lte.getTime() + 86400000)
      ).length,
    };
  }
}
