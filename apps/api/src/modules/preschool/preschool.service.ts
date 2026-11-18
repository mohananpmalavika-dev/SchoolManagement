import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@krypton/database';
import { PrismaService } from '../../database/prisma.service';
import { Actor } from '../operations/operations.service';
import { PreschoolAccessService, preschoolManagers } from './preschool-access.service';
import { PreschoolPickupService } from './preschool-pickup.service';
import {
  CareRecordDto,
  CheckOutDto,
  ObservationDto,
  PreschoolAssignmentDto,
  PreschoolQueryDto,
  SavePreschoolContentDto,
  SchoolProgrammeDto,
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
@Injectable()
export class PreschoolService {
  constructor(
    private db: PrismaService,
    private access: PreschoolAccessService,
    @Optional() private pickup?: PreschoolPickupService
  ) {}
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
    if (preschoolManagers.includes(user.role)) {
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
        where: { tenantId, ...(ids ? { id: { in: ids } } : {}) },
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
    if (!dto.programme && !dto.pickupVerification) {
      throw new BadRequestException('Choose a school programme or safe pickup setting to update');
    }
    const data: Prisma.SchoolUpdateManyMutationInput = {};
    if (dto.programme) data.programme = dto.programme;
    if (dto.pickupVerification) data.preschoolPickupVerification = dto.pickupVerification;
    return this.db.$transaction(async (tx) => {
      const result = await tx.school.updateMany({
        where: { id: schoolId, tenantId: this.tenant() },
        data,
      });
      if (!result.count) throw new NotFoundException('School not found');
      if (dto.programme) {
        await this.audit(tx, user, 'PRESCHOOL_PROGRAMME_' + dto.programme, schoolId);
      }
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
        ...(dto.programme ? { programme: dto.programme } : {}),
        ...(dto.pickupVerification ? { pickupVerification: dto.pickupVerification } : {}),
      };
    });
  }
  async stage(user: Actor, classId: string, stage: 'PLAYGROUP' | 'NURSERY' | 'LKG' | 'UKG') {
    this.access.allow(user, preschoolManagers);
    return this.db.$transaction(async (tx) => {
      const result = await tx.class.updateMany({
        where: { id: classId, tenantId: this.tenant() },
        data: { preschoolStage: stage, educationLevel: 'PRE_PRIMARY' },
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
  async roster(user: Actor, classId: string, offset = 0) {
    const classroom = await this.access.classroom(user, classId);
    const { today } = await this.clock();
    const date = preschoolDate(today);
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
      pickupVerification:
        (classroom.school?.preschoolPickupVerification as 'OPTIONAL' | 'REQUIRED') || 'OPTIONAL',
      students: students.map(({ preschoolDays, pickupPasses, ...student }) => ({
        ...student,
        day: preschoolDays[0] || null,
        activePickupPass: pickupPasses?.[0]
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
  async checkIn(user: Actor, studentId: string) {
    this.access.allow(user);
    const student = await this.access.student(user, studentId);
    const date = preschoolDate((await this.clock()).today),
      now = new Date();
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
        throw new ConflictException('Check-in has already been recorded today');
      const day = await tx.preschoolDayRecord.upsert({
        where: { tenantId_studentId_date: { tenantId: this.tenant(), studentId, date } },
        create: {
          tenantId: this.tenant(),
          studentId,
          date,
          checkInAt: now,
          checkedInBy: user.userId,
        },
        update: { checkInAt: now, checkedInBy: user.userId, version: { increment: 1 } },
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
          arrivalTime: now,
          markedBy: user.userId,
        },
        update: { status: 'PRESENT', arrivalTime: now, markedBy: user.userId },
      });
      await this.activity(
        tx,
        user,
        studentId,
        'Checked in at preschool',
        'Your child has arrived. The school recorded their check-in.',
        'ATTENDANCE'
      );
      await this.audit(tx, user, 'PRESCHOOL_CHECK_IN', day.id);
      return day;
    });
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
    const usingPass = !!(dto.pickupOtp?.trim() || dto.pickupQrToken?.trim());
    if (pickupPolicy === 'REQUIRED' && !usingPass) {
      throw new BadRequestException('Parent pickup OTP or QR pass is required for checkout');
    }
    if (!usingPass && !dto.guardianId) {
      throw new BadRequestException('Choose an authorized pickup guardian');
    }
    const { today } = await this.clock();
    const date = preschoolDate(today);
    const tenantId = this.tenant();
    return this.db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId, tenantId },
        data: { updatedAt: new Date() },
      });
      let resolvedGuardianId = dto.guardianId;
      let verificationMethod: 'MANUAL' | 'OTP' | 'QR' = 'MANUAL';
      let pickupPassId: string | null = null;
      let row = await tx.preschoolDayRecord.findFirst({
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
        throw new ConflictException('Checkout requires an active check-in today');
      const result = await tx.preschoolDayRecord.updateMany({
        where: { id: row.id, tenantId, checkOutAt: null, version: row.version },
        data: {
          checkOutAt: new Date(),
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
            : 'School staff verified the pickup.';
      await this.activity(
        tx,
        user,
        studentId,
        'Collected from preschool',
        `Collected by ${link.guardian.firstName} ${link.guardian.lastName}. ${verificationSummary}`,
        'ATTENDANCE'
      );
      const auditAction =
        verificationMethod === 'OTP'
          ? 'PRESCHOOL_CHECK_OUT_OTP_VERIFIED'
          : verificationMethod === 'QR'
            ? 'PRESCHOOL_CHECK_OUT_QR_VERIFIED'
            : 'PRESCHOOL_CHECK_OUT_IDENTITY_VERIFIED';
      await this.audit(tx, user, auditAction, row.id);
      return { id: row.id, verificationMethod, guardianId: resolvedGuardianId };
    });
  }
  async care(user: Actor, studentId: string, dto: CareRecordDto) {
    this.access.allow(user);
    await this.access.student(user, studentId);
    const date = preschoolDate((await this.clock()).today);
    const { version, shareWithParents, ...details } = dto;
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
          'Today’s meals, rest and classroom notes are available in your preschool workspace.'
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
  async child(user: Actor, studentId: string, query: PreschoolQueryDto) {
    const student = await this.access.student(user, studentId);
    const range = await this.range(query),
      tenantId = this.tenant(),
      parent = user.role === 'PARENT';
    const [days, observations, activities, content] = await Promise.all([
      this.db.preschoolDayRecord.findMany({
        where: { tenantId, studentId, date: range },
        orderBy: { date: 'desc' },
        take: 93,
      }),
      this.db.developmentObservation.findMany({
        where: { tenantId, studentId, observedOn: range, ...(parent ? { shared: true } : {}) },
        orderBy: [{ observedOn: 'desc' }, { createdAt: 'desc' }],
        take: 101,
        skip: query.offset || 0,
      }),
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
    const visibleDays = days.map((day) =>
      parent && !day.sharedAt
        ? {
            id: day.id,
            date: day.date,
            checkInAt: day.checkInAt,
            checkOutAt: day.checkOutAt,
            pickupVerificationMethod: day.pickupVerificationMethod,
            sharedAt: null,
          }
        : day
    );
    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        className: student.currentClass!.name,
      },
      days: visibleDays,
      observations: observations.slice(0, 100),
      hasMoreObservations: observations.length > 100,
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
  async report(user: Actor, query: PreschoolQueryDto) {
    if (!query.classId) throw new BadRequestException('Choose a class');
    await this.access.classroom(user, query.classId);
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
