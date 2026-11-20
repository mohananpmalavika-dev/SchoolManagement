import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@krypton/database';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { isDeepStrictEqual } from 'node:util';
import { isStrongPassword, isUUID } from 'class-validator';
import { PrismaService } from '../../database/prisma.service';
import {
  HrCandidateDto,
  HrCandidateStageDto,
  HrInterviewDto,
  HrInterviewReviewDto,
  HrOfferDecisionDto,
  HrVacancyDto,
} from './hrms-recruitment.dto';
import {
  candidateInclude,
  changeCandidateStage,
  recruitmentCandidate,
  reviewInterview,
  saveCandidate,
  saveVacancy,
  scheduleInterview,
} from './hrms-recruitment';
import {
  HrActor,
  hrManager,
  hrPayroll,
  hrManagerRoles,
  hrStaffRoles,
  hrPayrollRoles,
  requireHr,
} from './hrms.policy';
import {
  HrAccountDto,
  HrAttendanceDto,
  HrLeaveDto,
  HrOfferDto,
  HrPayrollDto,
  HrSettlementDto,
  HrStructureDto,
  HrSalaryAssignmentDto,
  HrShiftAssignmentDto,
  HrStatutoryDto,
  HrConvertOfferDto,
} from './hrms.dto';
import {
  hrDate,
  hrDay,
  hrLeaveDays,
  hrLocalDay,
  hrPunchState,
  hrRound,
  hrSalary,
  hrTimestamp,
  hrAttendanceRule,
} from './hrms.engine';
import { hrMasterSpecs, parseHrMaster } from './hrms-masters';
import { assertHrPeriodWritable } from './hrms-period';
import { assertExitClearances, exitSnapshot } from './hrms-exit';
import {
  leaveCharge,
  leaveCovers,
  leaveDates,
  leaveDocumentUrl,
  leaveEntitlement,
  leavesOverlap,
} from './hrms-leave';

type Tx = Prisma.TransactionClient;
const summary = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  department: { select: { name: true } },
  designation: { select: { title: true } },
} as const;
// Deliberate API allowlist: identity/medical and unused private profile fields stay internal.
const employeeView = {
  id: true,
  employeeCode: true,
  staffId: true,
  userId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  joiningDate: true,
  employmentType: true,
  employmentStatus: true,
  exitDate: true,
  departmentId: true,
  designationId: true,
  gradeId: true,
  department: true,
  designation: true,
  grade: true,
} as const;
@Injectable()
export class HrmsService {
  constructor(private readonly prisma: PrismaService) {}
  async recruitment(u: HrActor) {
    requireHr(u, hrManagerRoles);
    const [vacancies, candidates, interviewers] = await Promise.all([
      this.prisma.recruitmentVacancy.findMany({
        where: { tenantId: u.tenantId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.recruitmentCandidate.findMany({
        where: { tenantId: u.tenantId },
        include: candidateInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findMany({
        where: {
          tenantId: u.tenantId,
          isActive: true,
          role: {
            in: [
              'PRINCIPAL',
              'SCHOOL_ADMIN',
              'SCHOOL_OWNER',
              'DEPUTY_PRINCIPAL',
              'TEACHER',
              'CLASS_TEACHER',
            ],
          },
        },
        select: { id: true, firstName: true, lastName: true },
      }),
    ]);
    return { vacancies, candidates, interviewers };
  }
  private async recruitmentChange<T>(
    u: HrActor,
    action: string,
    work: (db: Tx) => Promise<T & { id: string }>
  ) {
    requireHr(u, hrManagerRoles);
    return this.transaction(u, async (db) => {
      const row = await work(db);
      await this.audit(db, u, action, row.id);
      return row;
    });
  }
  saveVacancy(u: HrActor, dto: HrVacancyDto, id?: string) {
    return this.recruitmentChange(u, id ? 'VACANCY_UPDATED' : 'VACANCY_CREATED', (db) =>
      saveVacancy(db, u, dto, id)
    );
  }
  saveCandidate(u: HrActor, dto: HrCandidateDto, id?: string) {
    return this.recruitmentChange(u, id ? 'CANDIDATE_UPDATED' : 'CANDIDATE_CREATED', (db) =>
      saveCandidate(db, u, dto, id)
    );
  }
  candidateStage(u: HrActor, id: string, dto: HrCandidateStageDto) {
    return this.recruitmentChange(u, 'CANDIDATE_STAGE_CHANGED', (db) =>
      changeCandidateStage(db, u, id, dto)
    );
  }
  scheduleInterview(u: HrActor, candidateId: string, dto: HrInterviewDto, id?: string) {
    return this.recruitmentChange(u, id ? 'INTERVIEW_RESCHEDULED' : 'INTERVIEW_SCHEDULED', (db) =>
      scheduleInterview(db, u, candidateId, dto, id)
    );
  }
  reviewInterview(u: HrActor, id: string, dto: HrInterviewReviewDto) {
    return this.recruitmentChange(u, 'INTERVIEW_REVIEWED', (db) => reviewInterview(db, u, id, dto));
  }
  offerDecision(u: HrActor, id: string, dto: HrOfferDecisionDto) {
    return this.recruitmentChange(u, 'OFFER_' + dto.status, async (db) => {
      const offer = await db.jobOffer.findFirst({ where: { id, tenantId: u.tenantId } });
      if (!offer || offer.status !== 'OFFERED' || offer.employeeId)
        throw new ConflictException('Only open offers can be declined or withdrawn');
      if (dto.reason.trim().length < 5)
        throw new BadRequestException('Enter an offer decision reason');
      if (offer.candidateId)
        await db.recruitmentCandidate.update({
          where: { id: offer.candidateId, tenantId: u.tenantId },
          data: {
            status: dto.status === 'DECLINED' ? 'WITHDRAWN' : 'REJECTED',
            decisionReason: dto.reason.trim(),
          },
        });
      return db.jobOffer.update({
        where: { id, tenantId: u.tenantId },
        data: { status: dto.status, decisionReason: dto.reason.trim() },
      });
    });
  }
  async createAccount(u: HrActor, data: HrAccountDto) {
    requireHr(u, hrManagerRoles);
    if (!data.firstName.trim() || !data.lastName.trim())
      throw new BadRequestException('Enter the staff member’s first and last name');
    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.transaction(u, async (db) => {
      const row = await db.user.create({
        data: {
          tenantId: u.tenantId,
          email: data.email.trim().toLowerCase(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          role: data.role as any,
          passwordHash,
          mustChangePassword: true,
        },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      });
      await this.audit(db, u, 'ACCOUNT_CREATED', row.id);
      return row;
    });
  }
  private async transaction<T>(user: HrActor, work: (db: Tx) => Promise<T>): Promise<T> {
    requireHr(user);
    return this.prisma.$transaction(
      async (db) => {
        await db.tenant.update({ where: { id: user.tenantId }, data: { updatedAt: new Date() } });
        return work(db);
      },
      { timeout: 20000 }
    );
  }
  private audit(db: Tx, u: HrActor, action: string, entityId: string) {
    return db.auditLog.create({
      data: {
        tenantId: u.tenantId,
        userId: u.userId,
        action: 'HR_' + action,
        entityType: 'hrms',
        entityId,
      },
    });
  }
  private async independentReview(db: Tx, u: HrActor, action: string, entityId: string) {
    const prepared = await db.auditLog.findFirst({
      where: { tenantId: u.tenantId, entityType: 'hrms', action: 'HR_' + action, entityId },
      orderBy: { createdAt: 'desc' },
    });
    if (!prepared?.userId)
      throw new ConflictException(
        'No preparation audit exists. Reconcile this legacy record before approval.'
      );
    if (prepared.userId === u.userId)
      throw new ForbiddenException(
        'A different manager must review and approve these financial amounts'
      );
    return prepared;
  }
  private async writablePeriod(db: Tx, u: HrActor, from: Date, to?: Date) {
    await assertHrPeriodWritable(db, u.tenantId, from, to);
  }
  private async shiftFor(db: Tx, u: HrActor, employeeId: string, date: Date) {
    const assignment = await db.shiftAssignment.findFirst({
      where: {
        tenantId: u.tenantId,
        employeeId,
        effectiveFrom: { lte: date },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
      },
      orderBy: { effectiveFrom: 'desc' },
      include: { shift: true },
    });
    const shift =
      assignment?.shift ||
      (await db.shift.findFirst({ where: { tenantId: u.tenantId, isDefault: true } }));
    if (!shift || shift.tenantId !== u.tenantId)
      throw new BadRequestException(
        'Assign a daytime shift or configure a default shift before attendance'
      );
    return shift;
  }
  private statutoryView(
    row: {
      pfApplicable: boolean;
      esiApplicable: boolean;
      panNumber: string | null;
      uanNumber: string | null;
      pfNumber: string | null;
      esiNumber: string | null;
    } | null
  ) {
    if (!row) return null;
    const mask = (value: string | null) =>
      value ? '*'.repeat(Math.max(0, value.length - 4)) + value.slice(-4) : null;
    return {
      pfApplicable: row.pfApplicable,
      esiApplicable: row.esiApplicable,
      panMasked: mask(row.panNumber),
      uanMasked: mask(row.uanNumber),
      pfMasked: mask(row.pfNumber),
      esiMasked: mask(row.esiNumber),
    };
  }
  async statutoryProfile(u: HrActor, id: string) {
    requireHr(u, hrPayrollRoles);
    await this.employee(u, id, this.prisma, true);
    return this.statutoryView(
      await this.prisma.employeeStatutoryProfile.findFirst({
        where: { tenantId: u.tenantId, employeeId: id },
      })
    );
  }
  async saveStatutoryProfile(u: HrActor, id: string, data: HrStatutoryDto) {
    requireHr(u, hrPayrollRoles);
    return this.transaction(u, async (db) => {
      const emp = await this.employee(u, id, db, true);
      if (emp.userId === u.userId)
        throw new ForbiddenException('Another payroll officer must review your statutory profile');
      if (
        await db.payslip.findFirst({
          where: { tenantId: u.tenantId, employeeId: id, status: 'DRAFT' },
        })
      )
        throw new ConflictException('Discard draft payroll before changing its statutory profile');
      const existing = await db.employeeStatutoryProfile.findFirst({
        where: { tenantId: u.tenantId, employeeId: id },
      });
      const next = { ...existing, ...data };
      if (next.pfApplicable && !next.uanNumber && !next.pfNumber)
        throw new BadRequestException(
          'Enter the reviewed UAN or PF account number when PF applies'
        );
      if (next.esiApplicable && !next.esiNumber)
        throw new BadRequestException('Enter the reviewed ESI number when ESI applies');
      const row = await db.employeeStatutoryProfile.upsert({
        where: { employeeId: id },
        create: { ...data, tenantId: u.tenantId, employeeId: id },
        update: data,
      });
      await this.audit(db, u, 'STATUTORY_PROFILE_REVIEWED', id);
      return this.statutoryView(row);
    });
  }
  private async employmentEnd(db: Tx, u: HrActor, employee: { id: string; exitDate: Date | null }) {
    if (employee.exitDate) return employee.exitDate;
    return (
      await db.resignation.findFirst({
        where: { tenantId: u.tenantId, employeeId: employee.id, status: 'APPROVED' },
        select: { approvedExitDate: true },
      })
    )?.approvedExitDate;
  }
  private async clock(u: HrActor, db: Tx = this.prisma) {
    const tenant = await db.tenant.findFirst({
      where: { id: u.tenantId },
      select: { timezone: true },
    });
    const timezone = tenant?.timezone || 'Asia/Kolkata',
      now = new Date();
    return { now, timezone, today: hrLocalDay(now, timezone) };
  }
  private async employee(u: HrActor, id?: string, db: Tx = this.prisma, management = hrManager(u)) {
    requireHr(u);
    const matches = id
      ? []
      : await db.employee.findMany({ where: { tenantId: u.tenantId, userId: u.userId }, take: 2 });
    if (matches.length > 1)
      throw new ConflictException(
        'Multiple HR employees link to this login. Reconcile the legacy staff links first.'
      );
    const row = id
      ? await db.employee.findFirst({ where: { tenantId: u.tenantId, id } })
      : matches[0];
    if (!row)
      throw new NotFoundException(
        'HR employee is not linked. Ask management to sync staff and link your school account.'
      );
    if (!management && row.userId !== u.userId)
      throw new ForbiddenException('You can only access your own employee record');
    return row;
  }
  private active(
    e: { employmentStatus: string; staffId: string | null; joiningDate: Date },
    today?: string
  ) {
    if (e.employmentStatus !== 'ACTIVE' || !e.staffId)
      throw new BadRequestException('An active employee linked to school staff is required');
    if (today && hrDay(e.joiningDate) > today)
      throw new BadRequestException('Employment has not started yet');
  }
  private async scope(u: HrActor, team: boolean, id?: string) {
    requireHr(u);
    if (team && !id) return {};
    return { employeeId: (await this.employee(u, id, this.prisma, team)).id };
  }
  async profile(u: HrActor) {
    requireHr(u);
    const rows = await this.prisma.employee.findMany({
      where: { tenantId: u.tenantId, userId: u.userId },
      take: 2,
      select: {
        ...employeeView,
        leaveBalances: { where: { tenantId: u.tenantId }, include: { leaveType: true } },
      },
    });
    if (rows.length > 1)
      throw new ConflictException(
        'Multiple HR employees link to this login. Reconcile the legacy staff links first.'
      );
    return rows[0] || null;
  }
  async getHrmsOverview(u: HrActor) {
    requireHr(u, hrManagerRoles);
    const { today, timezone } = await this.clock(u),
      tenantId = u.tenantId;
    const [totalEmployees, activeEmployees, pendingLeaves, pendingResignations, staffCount] =
      await Promise.all([
        this.prisma.employee.count({ where: { tenantId } }),
        this.prisma.employee.count({ where: { tenantId, employmentStatus: 'ACTIVE' } }),
        this.prisma.leaveRequest.count({ where: { tenantId, status: 'PENDING' } }),
        this.prisma.resignation.count({ where: { tenantId, status: 'SUBMITTED' } }),
        this.prisma.staff.count({ where: { tenantId, status: 'ACTIVE' } }),
      ]);
    return {
      today,
      timezone,
      stats: { totalEmployees, activeEmployees, pendingLeaves, pendingResignations, staffCount },
    };
  }
  async listEmployees(u: HrActor) {
    requireHr(u, hrPayrollRoles);
    const { today } = await this.clock(u);
    const rows = await this.prisma.employee.findMany({
      where: { tenantId: u.tenantId },
      select: {
        ...employeeView,
        staff: { select: { id: true, staffNumber: true, isTeacher: true, status: true } },
        salaryAssignments: {
          where: { tenantId: u.tenantId },
          orderBy: { effectiveFrom: 'desc' },
          include: { structure: true },
        },
        shiftAssignments: {
          where: { tenantId: u.tenantId },
          orderBy: { effectiveFrom: 'desc' },
          include: { shift: true },
        },
      },
      orderBy: { employeeCode: 'asc' },
    });
    return rows.map((row) => ({
      ...row,
      currentSalary: row.salaryAssignments.find((a) => hrDay(a.effectiveFrom) <= today) || null,
      salaryAssignments: row.salaryAssignments.map((a, index) => ({
        ...a,
        effectiveTo: index
          ? new Date(row.salaryAssignments[index - 1].effectiveFrom.getTime() - 86400000)
          : null,
      })),
    }));
  }
  async getEmployeeById(u: HrActor, id: string) {
    const row = await this.employee(u, id, this.prisma, hrPayroll(u));
    return this.prisma.employee.findFirst({
      where: { id: row.id, tenantId: u.tenantId },
      select: employeeView,
    });
  }
  async syncStaff(u: HrActor) {
    requireHr(u, hrManagerRoles);
    return this.transaction(u, async (db) => {
      const tenantId = u.tenantId,
        staff = await db.staff.findMany({ where: { tenantId }, orderBy: { id: 'asc' } });
      let created = 0,
        linked = 0;
      for (const s of staff) {
        const old =
          (await db.employee.findFirst({ where: { tenantId, staffId: s.id } })) ||
          (await db.employee.findFirst({ where: { tenantId, employeeCode: s.staffNumber } }));
        if (old?.staffId && old.staffId !== s.id)
          throw new ConflictException(
            'Employee code belongs to another staff record: ' + s.staffNumber
          );
        if (old && old.email.toLowerCase() !== s.email.toLowerCase())
          throw new ConflictException(
            'Employee code has a different email. Reconcile this legacy record before staff sync.'
          );
        if (
          s.userId &&
          (await db.employee.findFirst({
            where: { tenantId, userId: s.userId, ...(old ? { id: { not: old.id } } : {}) },
          }))
        )
          throw new ConflictException('School account is linked to more than one employee');
        const department = await db.department.upsert({
          where: { tenantId_name: { tenantId, name: s.department } },
          create: { tenantId, name: s.department },
          update: {},
        });
        const designation = await db.designation.upsert({
          where: { tenantId_title: { tenantId, title: s.position } },
          create: { tenantId, title: s.position },
          update: {},
        });
        const data = {
          staffId: s.id,
          userId: s.userId,
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
          phone: s.phone,
          gender: s.gender,
          departmentId: old?.departmentId || department.id,
          designationId: old?.designationId || designation.id,
          ...(s.status !== 'ACTIVE' ? { employmentStatus: s.status } : {}),
        };
        if (old) {
          await db.employee.update({ where: { id: old.id, tenantId }, data });
          linked++;
        } else {
          await db.employee.create({
            data: {
              ...data,
              tenantId,
              employeeCode: s.staffNumber,
              joiningDate: s.hireDate,
              employmentStatus: s.status,
            },
          });
          created++;
        }
      }
      await this.audit(db, u, 'STAFF_SYNCED', tenantId);
      return { created, linked };
    });
  }
  async setup(u: HrActor) {
    requireHr(u, hrPayrollRoles);
    const tenantId = u.tenantId;
    const [
      departments,
      designations,
      grades,
      shifts,
      leaveTypes,
      components,
      structures,
      accounts,
    ] = await Promise.all([
      this.prisma.department.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
      this.prisma.designation.findMany({ where: { tenantId }, orderBy: { title: 'asc' } }),
      this.prisma.employeeGrade.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
      this.prisma.shift.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
      this.prisma.leaveType.findMany({ where: { tenantId }, orderBy: { name: 'asc' } }),
      this.prisma.salaryComponent.findMany({ where: { tenantId }, orderBy: { code: 'asc' } }),
      this.prisma.salaryStructure.findMany({
        where: { tenantId },
        include: { components: { include: { component: true } } },
        orderBy: { name: 'asc' },
      }),
      hrManager(u)
        ? this.prisma.user.findMany({
            where: {
              tenantId,
              isActive: true,
              role: {
                in: [
                  'TEACHER',
                  'CLASS_TEACHER',
                  'ACCOUNTANT',
                  'LIBRARIAN',
                  'TRANSPORT_OFFICER',
                  'RECEPTIONIST',
                  'SCHOOL_ADMIN',
                ],
              },
            },
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          })
        : [],
    ]);
    return {
      departments,
      designations,
      grades,
      shifts,
      leaveTypes,
      components,
      structures,
      accounts,
    };
  }
  async saveMaster(u: HrActor, resource: string, input: Record<string, unknown>, id?: string) {
    requireHr(u, resource === 'salary-components' ? hrPayrollRoles : hrManagerRoles);
    const data = parseHrMaster(resource, input, !!id),
      spec = hrMasterSpecs[resource];
    return this.transaction(u, async (db) => {
      const tenantId = u.tenantId,
        table = (db as any)[spec.model],
        old = id ? await table.findFirst({ where: { id, tenantId } }) : null;
      if (id && !old) throw new NotFoundException('HR master not found');
      const next = { ...old, ...data },
        minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
      if (resource === 'leave-types') {
        if (!id && !data.effectiveFrom)
          data.effectiveFrom = hrDate((await this.clock(u, db)).today.slice(0, 4) + '-01-01');
        if (next.effectiveTo && next.effectiveTo < (data.effectiveFrom || next.effectiveFrom))
          throw new BadRequestException('Policy end must follow its effective start');
      }
      if (
        id &&
        resource === 'shifts' &&
        ((await db.shiftAssignment.count({ where: { tenantId, shiftId: id } })) ||
          (await db.staffAttendance.count({ where: { tenantId, shiftId: id } })))
      )
        throw new ConflictException(
          'Used shifts are immutable. Create a new shift for revised hours.'
        );
      if (
        id &&
        resource === 'leave-types' &&
        ((await db.leaveRequest.count({ where: { tenantId, leaveTypeId: id } })) ||
          (await db.leaveBalance.count({ where: { tenantId, leaveTypeId: id } })))
      )
        throw new ConflictException(
          'Used leave types are immutable. Create a new policy for revisions.'
        );
      if (
        resource === 'shifts' &&
        (next.startTime >= next.endTime ||
          next.halfDayMinutes >
            (next.fullDayMinutes ?? minutes(next.endTime) - minutes(next.startTime)) ||
          (next.fullDayMinutes != null &&
            next.fullDayMinutes > minutes(next.endTime) - minutes(next.startTime)))
      )
        throw new BadRequestException(
          'Use a daytime shift with end after start and a valid half-day threshold'
        );
      if (resource === 'salary-components') {
        if (!id && data.statutoryType === undefined)
          data.statutoryType = next.isStatutory ? 'OTHER' : 'NONE';
        const scheme = data.statutoryType ?? next.statutoryType;
        if (
          (next.isStatutory &&
            (!['PF', 'ESI', 'OTHER'].includes(scheme) || next.type === 'EARNING')) ||
          (!next.isStatutory && scheme !== 'NONE')
        )
          throw new BadRequestException(
            'Select a statutory scheme for deductions or employer contributions only'
          );
        if (next.calculationType === 'BASE' && (next.code !== 'BASIC' || next.type !== 'EARNING'))
          throw new BadRequestException('BASE is reserved for the BASIC earning component');
        if (next.calculationType === 'PERCENT_OF_BASIC' && next.percentage == null)
          throw new BadRequestException('Enter a percentage');
        if (
          id &&
          (await db.salaryStructureComponent.count({
            where: {
              componentId: id,
              structure: { tenantId, assignments: { some: { tenantId } } },
            },
          }))
        )
          throw new ConflictException(
            'Assigned salary components are immutable. Create a new component/structure for revisions.'
          );
      }
      const key =
        resource === 'designations'
          ? 'title'
          : ['leave-types', 'salary-components'].includes(resource)
            ? 'code'
            : 'name';
      if (
        await table.findFirst({
          where: {
            tenantId,
            [key]: { equals: next[key], mode: 'insensitive' },
            ...(id ? { id: { not: id } } : {}),
          },
        })
      )
        throw new ConflictException('This HR master already exists');
      if (resource === 'shifts' && data.isDefault)
        await db.shift.updateMany({ where: { tenantId }, data: { isDefault: false } });
      const row = id
        ? await table.update({ where: { id, tenantId }, data })
        : await table.create({ data: { ...data, tenantId } });
      await this.audit(db, u, 'MASTER_SAVED', row.id);
      return row;
    });
  }
  async saveStructure(u: HrActor, data: HrStructureDto) {
    requireHr(u, hrPayrollRoles);
    return this.transaction(u, async (db) => {
      if (new Set(data.components.map((c) => c.componentId)).size !== data.components.length)
        throw new BadRequestException('Components cannot be repeated');
      const components = await db.salaryComponent.findMany({
        where: { tenantId: u.tenantId, id: { in: data.components.map((c) => c.componentId) } },
      });
      if (components.length !== data.components.length)
        throw new BadRequestException('Choose components from this school');
      // Validate the structure with a sufficiently large base; actual assignment totals are checked separately.
      hrSalary(
        10000000,
        data.components.map((line) => ({
          amount: line.amount,
          component: components.find((c) => c.id === line.componentId)!,
        }))
      );
      const row = await db.salaryStructure.create({
        data: {
          tenantId: u.tenantId,
          name: data.name.trim(),
          components: { create: data.components },
        },
      });
      await this.audit(db, u, 'STRUCTURE_CREATED', row.id);
      return row;
    });
  }
  async configureEmployee(
    u: HrActor,
    id: string,
    data: { departmentId?: string; designationId?: string; gradeId?: string }
  ) {
    requireHr(u, hrManagerRoles);
    return this.transaction(u, async (db) => {
      await this.employee(u, id, db);
      for (const [key, model] of [
        ['departmentId', 'department'],
        ['designationId', 'designation'],
        ['gradeId', 'employeeGrade'],
      ] as const)
        if (
          data[key] &&
          !(await (db[model] as any).findFirst({ where: { id: data[key], tenantId: u.tenantId } }))
        )
          throw new BadRequestException('Choose ' + model + ' from this school');
      const row = await db.employee.update({
        where: { id, tenantId: u.tenantId },
        data,
        select: employeeView,
      });
      await this.audit(db, u, 'EMPLOYEE_CONFIGURED', id);
      return row;
    });
  }
  async assignShift(u: HrActor, id: string, data: HrShiftAssignmentDto) {
    requireHr(u, hrManagerRoles);
    return this.transaction(u, async (db) => {
      await this.employee(u, id, db);
      if (!(await db.shift.findFirst({ where: { id: data.shiftId, tenantId: u.tenantId } })))
        throw new BadRequestException('Choose a shift from this school');
      const effectiveFrom = hrDate(data.effectiveFrom),
        effectiveTo = data.effectiveTo ? hrDate(data.effectiveTo) : null;
      if (effectiveTo && effectiveTo < effectiveFrom)
        throw new BadRequestException('Shift end date precedes start');
      await this.writablePeriod(db, u, effectiveFrom, effectiveTo || undefined);
      if (
        await db.shiftAssignment.findFirst({
          where: {
            tenantId: u.tenantId,
            employeeId: id,
            effectiveFrom: { lte: effectiveTo || new Date('2200-12-31') },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveFrom } }],
          },
        })
      )
        throw new ConflictException(
          'Shift assignments overlap. End the previous assignment first.'
        );
      const row = await db.shiftAssignment.create({
        data: {
          tenantId: u.tenantId,
          employeeId: id,
          shiftId: data.shiftId,
          effectiveFrom,
          effectiveTo,
        },
      });
      await this.audit(db, u, 'SHIFT_ASSIGNED', row.id);
      return row;
    });
  }
  async endShift(u: HrActor, id: string, endDate: string) {
    requireHr(u, hrManagerRoles);
    return this.transaction(u, async (db) => {
      const row = await db.shiftAssignment.findFirst({ where: { id, tenantId: u.tenantId } });
      if (!row) throw new NotFoundException('Shift assignment not found');
      const effectiveTo = hrDate(endDate);
      if (effectiveTo < row.effectiveFrom)
        throw new BadRequestException('End date precedes assignment');
      const boundary =
        row.effectiveTo && row.effectiveTo < effectiveTo ? row.effectiveTo : effectiveTo;
      await this.writablePeriod(
        db,
        u,
        new Date(boundary.getTime() + 86400000),
        row.effectiveTo && row.effectiveTo > effectiveTo ? row.effectiveTo : undefined
      );
      if (
        await db.shiftAssignment.findFirst({
          where: {
            tenantId: u.tenantId,
            employeeId: row.employeeId,
            id: { not: id },
            effectiveFrom: { lte: effectiveTo },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: row.effectiveFrom } }],
          },
        })
      )
        throw new ConflictException('The revised end date overlaps another shift assignment');
      const result = await db.shiftAssignment.update({
        where: { id, tenantId: u.tenantId },
        data: { effectiveTo },
      });
      await this.audit(db, u, 'SHIFT_ENDED', id);
      return result;
    });
  }
  async assignSalary(u: HrActor, id: string, data: HrSalaryAssignmentDto) {
    requireHr(u, hrPayrollRoles);
    return this.transaction(u, async (db) => {
      const emp = await this.employee(u, id, db, true),
        tenantId = u.tenantId;
      if (emp.userId === u.userId)
        throw new ForbiddenException('Another payroll officer must assign your salary');
      const structure = await db.salaryStructure.findFirst({
        where: { id: data.structureId, tenantId },
        include: { components: { include: { component: true } } },
      });
      if (!structure) throw new BadRequestException('Choose a salary structure from this school');
      hrSalary(data.baseMonthlySalary, structure.components);
      const effectiveFrom = hrDate(data.effectiveFrom);
      if (effectiveFrom < hrDate(hrDay(emp.joiningDate)))
        throw new BadRequestException('Salary cannot start before employment');
      const employmentEnd = await this.employmentEnd(db, u, emp);
      if (employmentEnd && effectiveFrom > hrDate(hrDay(employmentEnd)))
        throw new BadRequestException('Salary cannot start after employment ends');
      await this.writablePeriod(db, u, effectiveFrom);
      if (
        await db.payslip.findFirst({
          where: {
            tenantId,
            employeeId: id,
            OR: [
              { year: { gt: effectiveFrom.getUTCFullYear() } },
              {
                year: effectiveFrom.getUTCFullYear(),
                month: { gte: effectiveFrom.getUTCMonth() + 1 },
              },
            ],
          },
        })
      )
        throw new ConflictException(
          'A payslip covers this date. Add a revision after the processed period.'
        );
      if (
        await db.employeeSalaryAssignment.findFirst({
          where: {
            tenantId,
            employeeId: id,
            effectiveFrom: {
              gte: effectiveFrom,
              lt: new Date(effectiveFrom.getTime() + 86400000),
            },
          },
        })
      )
        throw new ConflictException('A salary assignment already starts on this date');
      const row = await db.employeeSalaryAssignment.create({
        data: {
          tenantId,
          employeeId: id,
          structureId: structure.id,
          baseMonthlySalary: data.baseMonthlySalary,
          effectiveFrom,
        },
      });
      await this.audit(db, u, 'SALARY_ASSIGNED', row.id);
      return row;
    });
  }
  async withdrawSalary(u: HrActor, id: string, reason: string) {
    requireHr(u, hrPayrollRoles);
    if (!reason?.trim() || reason.trim().length < 5)
      throw new BadRequestException('Explain why this revision must be withdrawn');
    return this.transaction(u, async (db) => {
      const row = await db.employeeSalaryAssignment.findFirst({
        where: { id, tenantId: u.tenantId },
      });
      if (!row) throw new NotFoundException('Salary revision not found');
      const employee = await this.employee(u, row.employeeId, db, true);
      if (employee.userId === u.userId)
        throw new ForbiddenException('Another payroll officer must revise your salary');
      await this.writablePeriod(db, u, row.effectiveFrom);
      await db.auditLog.create({
        data: {
          tenantId: u.tenantId,
          userId: u.userId,
          action: 'HR_SALARY_WITHDRAWN',
          entityType: 'hrms',
          entityId: id,
          changes: {
            reason: reason.trim(),
            employeeId: row.employeeId,
            effectiveFrom: hrDay(row.effectiveFrom),
            structureId: row.structureId,
            baseMonthlySalary: row.baseMonthlySalary,
          },
        },
      });
      await db.employeeSalaryAssignment.delete({ where: { id, tenantId: u.tenantId } });
      return { id, withdrawn: true };
    });
  }
  async listShifts(u: HrActor) {
    requireHr(u);
    return this.prisma.shift.findMany({
      where: { tenantId: u.tenantId },
      orderBy: { name: 'asc' },
    });
  }
  async listLeaveTypes(u: HrActor) {
    requireHr(u);
    return this.prisma.leaveType.findMany({
      where: { tenantId: u.tenantId },
      orderBy: { name: 'asc' },
    });
  }
  async attendance(u: HrActor, date: string) {
    requireHr(u, hrManagerRoles);
    return this.prisma.staffAttendance.findMany({
      where: { tenantId: u.tenantId, date: hrDate(date) },
      include: {
        staff: { select: { id: true, firstName: true, lastName: true, staffNumber: true } },
      },
      orderBy: { staffId: 'asc' },
    });
  }
  async correctAttendance(u: HrActor, data: HrAttendanceDto) {
    requireHr(u, hrManagerRoles);
    return this.transaction(u, async (db) => {
      const emp = await this.employee(u, data.employeeId, db),
        { today, timezone } = await this.clock(u, db),
        tenantId = u.tenantId;
      const exit = await this.employmentEnd(db, u, emp);
      if (emp.userId === u.userId)
        throw new ForbiddenException('Another manager must correct your attendance');
      if (
        !emp.staffId ||
        data.date > today ||
        data.date < hrDay(emp.joiningDate) ||
        (exit && data.date > hrDay(exit))
      )
        throw new BadRequestException('Select an eligible employment date on or before today');
      const date = hrDate(data.date);
      await this.writablePeriod(db, u, date, date);
      if (
        await db.payslip.findFirst({
          where: {
            tenantId,
            employeeId: emp.id,
            year: date.getUTCFullYear(),
            month: date.getUTCMonth() + 1,
          },
        })
      )
        throw new ConflictException('Payroll already covers this attendance');
      const firstIn =
          data.status === 'ABSENT' ? null : hrTimestamp(data.date, data.timeIn || '', timezone),
        lastOut =
          data.status === 'ABSENT' ? null : hrTimestamp(data.date, data.timeOut || '', timezone);
      if (firstIn && lastOut && lastOut <= firstIn)
        throw new BadRequestException('Checkout must follow check-in');
      if (data.status === 'ABSENT' && (data.timeIn || data.timeOut || data.breakMinutes))
        throw new BadRequestException('Absent corrections cannot include worked times');
      const shift = await this.shiftFor(db, u, emp.id, date);
      const worked =
        firstIn && lastOut
          ? Math.floor((lastOut.getTime() - firstIn.getTime()) / 60000) - (data.breakMinutes || 0)
          : 0;
      if (worked < 0) throw new BadRequestException('Break time exceeds attendance duration');
      const rule = firstIn
        ? hrAttendanceRule(shift, worked, firstIn, true, timezone)
        : { status: 'ABSENT', lateMinutes: 0, overtimeMinutes: 0 };
      if (rule.status !== data.status)
        throw new BadRequestException(
          'Attendance status must match the shift rules and net worked minutes'
        );
      const calculated = {
        shiftId: shift.id,
        totalWorkMinutes: worked,
        lateMinutes: rule.lateMinutes,
        overtimeMinutes: rule.overtimeMinutes,
      };
      const row = await db.staffAttendance.upsert({
        where: { tenantId_staffId_date: { tenantId, staffId: emp.staffId, date } },
        create: {
          tenantId,
          staffId: emp.staffId,
          date,
          status: data.status,
          firstIn,
          lastOut,
          timeIn: firstIn,
          timeOut: lastOut,
          isRegularized: true,
          markedBy: u.userId,
          remarks: data.reason,
          ...calculated,
        },
        update: {
          status: data.status,
          firstIn,
          lastOut,
          timeIn: firstIn,
          timeOut: lastOut,
          isRegularized: true,
          markedBy: u.userId,
          remarks: data.reason,
          ...calculated,
        },
      });
      await db.attendanceCorrection.create({
        data: {
          tenantId,
          employeeId: emp.id,
          staffAttendanceId: row.id,
          date,
          requestedIn: firstIn,
          requestedOut: lastOut,
          reason: data.reason,
          status: 'APPROVED',
          approvedBy: u.userId,
          approvedAt: new Date(),
        },
      });
      await this.audit(db, u, 'ATTENDANCE_CORRECTED', row.id);
      return row;
    });
  }
  async recordPunch(u: HrActor, payload: { employeeId?: string; punchType: string }) {
    return this.transaction(u, async (db) => {
      const emp = await this.employee(u, payload.employeeId, db, false),
        tenantId = u.tenantId;
      const { now, today, timezone } = await this.clock(u, db);
      await this.writablePeriod(db, u, hrDate(today), hrDate(today));
      this.active(emp, today);
      const exit = await this.employmentEnd(db, u, emp);
      if (exit && today > hrDay(exit))
        throw new ConflictException('Approved employment exit date has passed');
      const savedAttendance = await db.staffAttendance.findFirst({
        where: { tenantId, staffId: emp.staffId!, date: hrDate(today) },
      });
      if (savedAttendance?.isRegularized)
        throw new ConflictException(
          'Attendance was corrected by management. Request a reviewed correction.'
        );
      if (
        !(await db.staff.findFirst({
          where: { id: emp.staffId!, tenantId, userId: u.userId, status: 'ACTIVE' },
        }))
      )
        throw new BadRequestException('Linked school staff record is inactive');
      const approvedLeave = await db.leaveRequest.findMany({
        where: {
          tenantId,
          employeeId: emp.id,
          status: 'APPROVED',
          startDate: { lte: hrDate(today) },
          endDate: { gte: hrDate(today) },
        },
      });
      if (
        approvedLeave
          .filter((row) => leaveCovers(row, today))
          .reduce((n, row) => n + (row.isHalfDay ? 0.5 : 1), 0) >= 1
      )
        throw new ConflictException('Approved full-day leave exists for today');
      const recent = await db.punchLog.findMany({
        where: {
          tenantId,
          employeeId: emp.id,
          punchTime: { gte: new Date(now.getTime() - 36 * 3600000), lte: now },
        },
        orderBy: { punchTime: 'asc' },
      });
      const state = hrPunchState([
        ...recent.filter((p) => hrLocalDay(p.punchTime, timezone) === today),
        { punchType: payload.punchType, punchTime: now },
      ]);
      const shift = await this.shiftFor(db, u, emp.id, hrDate(today));
      const rule = hrAttendanceRule(
        shift,
        state.totalWorkMinutes,
        state.firstIn!,
        !!state.lastOut,
        timezone
      );
      const data = {
        shiftId: shift.id,
        firstIn: state.firstIn,
        timeIn: state.firstIn,
        lastOut: state.lastOut,
        timeOut: state.lastOut,
        totalWorkMinutes: state.totalWorkMinutes,
        ...rule,
        status: rule.status as 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT',
      };
      const attendance = await db.staffAttendance.upsert({
        where: { tenantId_staffId_date: { tenantId, staffId: emp.staffId!, date: hrDate(today) } },
        create: { tenantId, staffId: emp.staffId!, date: hrDate(today), ...data },
        update: data,
      });
      const log = await db.punchLog.create({
        data: {
          tenantId,
          employeeId: emp.id,
          staffAttendanceId: attendance.id,
          punchTime: now,
          punchType: payload.punchType,
          verificationMode: 'WEB_PORTAL',
        },
      });
      await this.audit(db, u, 'PUNCH_' + payload.punchType, log.id);
      return log;
    });
  }
  async getTodayPunchLogs(u: HrActor) {
    const scope = await this.scope(u, hrManager(u)),
      { now, today, timezone } = await this.clock(u);
    const rows = await this.prisma.punchLog.findMany({
      where: {
        tenantId: u.tenantId,
        ...scope,
        punchTime: { gte: new Date(now.getTime() - 36 * 3600000), lte: now },
      },
      include: { employee: { select: summary } },
      orderBy: { punchTime: 'desc' },
    });
    return rows.filter((row) => hrLocalDay(row.punchTime, timezone) === today);
  }
  private async leaveBalanceProjection(
    db: Tx,
    u: HrActor,
    emp: any,
    type: any,
    year: number,
    today: string
  ) {
    const exit = await this.employmentEnd(db, u, emp);
    const records = await db.leaveBalance.findMany({
      where: {
        tenantId: u.tenantId,
        employeeId: emp.id,
        leaveTypeId: type.id,
        year: { lte: year },
      },
    });
    let carried = 0,
      accrued = 0,
      allocated = 0;
    for (
      let y =
        year > Number(today.slice(0, 4))
          ? year + 1
          : Math.max(2000, emp.joiningDate.getUTCFullYear());
      y <= year;
      y++
    ) {
      accrued = leaveEntitlement(type, emp.joiningDate, exit ?? null, y, today);
      if (
        (type.effectiveTo && type.effectiveTo < hrDate(`${y}-01-01`)) ||
        (exit && exit < hrDate(`${y}-01-01`))
      )
        carried = 0;
      allocated = hrRound(accrued + carried);
      const saved = records.find((b) => b.year === y);
      // Preserve the recorded grant of an earlier legacy year until explicitly reconciled.
      if (y < year && saved && !saved.accruedThrough) allocated = saved.allocatedDays;
      if (y < year) {
        if (type.carryForwardLimit && saved?.pendingDays)
          throw new ConflictException(
            'Review prior-year pending leave before carrying its balance forward'
          );
        carried = Math.min(
          type.carryForwardLimit || 0,
          Math.max(0, allocated - (saved?.usedDays || 0) - (saved?.pendingDays || 0))
        );
      }
    }
    if (year > Number(today.slice(0, 4))) {
      accrued = 0;
      carried = 0;
      allocated = 0;
    }
    const saved = records.find((b) => b.year === year),
      usedDays = saved?.usedDays || 0,
      pendingDays = saved?.pendingDays || 0;
    return {
      saved,
      employeeId: emp.id,
      leaveTypeId: type.id,
      leaveType: type,
      year,
      accruedDays: accrued,
      carriedDays: carried,
      allocatedDays: allocated,
      usedDays,
      pendingDays,
      availableDays: hrRound(allocated - usedDays - pendingDays),
      accruedThrough: today,
    };
  }
  private async ensureLeaveBalance(
    db: Tx,
    u: HrActor,
    emp: any,
    type: any,
    year: number,
    today: string
  ) {
    const projected = await this.leaveBalanceProjection(db, u, emp, type, year, today);
    if (projected.availableDays < 0)
      throw new ConflictException(
        'Accrued entitlement is below committed leave. Reconcile the balance before continuing.'
      );
    const { saved, accruedDays, carriedDays, allocatedDays } = projected;
    const data = { accruedDays, carriedDays, allocatedDays, accruedThrough: hrDate(today) };
    if (
      saved &&
      saved.allocatedDays === allocatedDays &&
      saved.accruedDays === accruedDays &&
      saved.carriedDays === carriedDays &&
      saved.accruedThrough &&
      hrDay(saved.accruedThrough) === today
    )
      return saved;
    const row = await db.leaveBalance.upsert({
      where: {
        tenantId_employeeId_leaveTypeId_year: {
          tenantId: u.tenantId,
          employeeId: emp.id,
          leaveTypeId: type.id,
          year,
        },
      },
      create: { tenantId: u.tenantId, employeeId: emp.id, leaveTypeId: type.id, year, ...data },
      update: data,
    });
    await db.auditLog.create({
      data: {
        tenantId: u.tenantId,
        userId: u.userId,
        action: 'HR_LEAVE_BALANCE_ACCRUED',
        entityType: 'hrms',
        entityId: row.id,
        changes: {
          year,
          accruedDays,
          carriedDays,
          allocatedDays,
          asOf: today,
          previousAllocatedDays: saved?.allocatedDays ?? null,
        },
      },
    });
    return row;
  }
  async listLeaveBalances(u: HrActor, q: { employeeId?: string; year?: number }) {
    const emp = await this.employee(u, q.employeeId, this.prisma, hrManager(u)),
      { today } = await this.clock(u),
      year = q.year ?? Number(today.slice(0, 4));
    const types = await this.prisma.leaveType.findMany({
      where: { tenantId: u.tenantId },
      orderBy: { name: 'asc' },
    });
    const rows = [];
    for (const type of types) {
      const { saved, ...row } = await this.leaveBalanceProjection(
        this.prisma,
        u,
        emp,
        type,
        year,
        today
      );
      rows.push({ ...row, id: saved?.id });
    }
    return rows;
  }
  async accrueLeaveBalances(u: HrActor, q: { employeeId?: string; year: number }) {
    requireHr(u, hrManagerRoles);
    return this.transaction(u, async (db) => {
      const emp = await this.employee(u, q.employeeId, db, true),
        { today } = await this.clock(u, db);
      if (q.year > Number(today.slice(0, 4)))
        throw new BadRequestException('Future leave cannot be accrued early');
      const types = await db.leaveType.findMany({ where: { tenantId: u.tenantId } }),
        rows = [];
      for (const type of types)
        rows.push(await this.ensureLeaveBalance(db, u, emp, type, q.year, today));
      return rows;
    });
  }
  async replaceLeaveDocument(u: HrActor, id: string, documentUrl: string) {
    leaveDocumentUrl(documentUrl);
    return this.transaction(u, async (db) => {
      const row = await db.leaveRequest.findFirst({
        where: { id, tenantId: u.tenantId },
        include: { employee: true },
      });
      if (!row) throw new NotFoundException('Leave request not found');
      if (row.employee.userId !== u.userId)
        throw new ForbiddenException('Only the applicant can replace supporting evidence');
      if (row.status !== 'PENDING')
        throw new ConflictException('Only pending leave evidence can be replaced');
      await this.writablePeriod(db, u, row.startDate, row.endDate);
      const result = await db.leaveRequest.update({
        where: { id, tenantId: u.tenantId },
        data: {
          documentUrl,
          documentStatus: 'PENDING',
          documentVerifiedBy: null,
          documentVerifiedAt: null,
          documentRemarks: null,
        },
      });
      await this.audit(db, u, 'LEAVE_DOCUMENT_REPLACED', id);
      return result;
    });
  }
  async reviewLeaveDocument(
    u: HrActor,
    id: string,
    data: { status: 'VERIFIED' | 'REJECTED'; remarks: string }
  ) {
    requireHr(u, hrManagerRoles);
    if (data.remarks.trim().length < 3)
      throw new BadRequestException('Record the document verification findings');
    return this.transaction(u, async (db) => {
      const row = await db.leaveRequest.findFirst({
        where: { id, tenantId: u.tenantId },
        include: { employee: true },
      });
      if (!row) throw new NotFoundException('Leave request not found');
      if (row.employee.userId === u.userId)
        throw new ForbiddenException('Another manager must verify your leave evidence');
      if (row.status !== 'PENDING' || !row.documentUrl)
        throw new ConflictException('Only pending leave with evidence can be verified');
      if (row.documentStatus !== 'PENDING')
        throw new ConflictException('Replace evidence before repeating its review');
      leaveDocumentUrl(row.documentUrl);
      await this.writablePeriod(db, u, row.startDate, row.endDate);
      const result = await db.leaveRequest.update({
        where: { id, tenantId: u.tenantId },
        data: {
          documentStatus: data.status,
          documentRemarks: data.remarks.trim(),
          documentVerifiedBy: u.userId,
          documentVerifiedAt: new Date(),
        },
      });
      await this.audit(db, u, 'LEAVE_DOCUMENT_' + data.status, id);
      return result;
    });
  }
  async submitLeaveRequest(u: HrActor, data: HrLeaveDto) {
    hrLeaveDays(data.startDate, data.endDate, data.isHalfDay);
    if (data.reason.trim().length < 3) throw new BadRequestException('Enter a leave reason');
    return this.transaction(u, async (db) => {
      const emp = await this.employee(u, data.employeeId, db, false),
        tenantId = u.tenantId;
      this.active(emp);
      if (
        !(await db.staff.findFirst({
          where: { id: emp.staffId!, tenantId, userId: u.userId, status: 'ACTIVE' },
        }))
      )
        throw new ConflictException(
          'Staff/account link changed. Ask management to reconcile staff HR.'
        );
      const startDate = hrDate(data.startDate),
        endDate = hrDate(data.endDate);
      await this.writablePeriod(db, u, startDate, endDate);
      if (startDate < hrDate(hrDay(emp.joiningDate)))
        throw new BadRequestException('Leave cannot precede employment');
      const exit = await this.employmentEnd(db, u, emp);
      if (exit && endDate > hrDate(hrDay(exit)))
        throw new BadRequestException(
          'Leave cannot extend beyond the approved employment exit date'
        );
      const type = await db.leaveType.findFirst({ where: { id: data.leaveTypeId, tenantId } });
      if (!type) throw new BadRequestException('Choose a leave type from this school');
      const { dates, count } = leaveCharge(
        data.startDate,
        data.endDate,
        !!data.isHalfDay,
        data.halfDaySession,
        type
      );
      if (data.numberOfDays !== undefined && data.numberOfDays !== count)
        throw new BadRequestException(
          'Leave days must match the policy chargeable dates and half-day session'
        );
      const { today } = await this.clock(u, db);
      if (startDate < new Date(emp.joiningDate.getTime() + type.waitingDays * 86400000))
        throw new BadRequestException(
          'Leave starts before the policy eligibility waiting period ends'
        );
      const notice = (startDate.getTime() - hrDate(today).getTime()) / 86400000;
      if ((!type.allowBackdated && notice < 0) || (notice >= 0 && notice < type.minNoticeDays))
        throw new BadRequestException(
          'Leave does not meet the policy backdating or minimum notice rule'
        );
      const requiresDocument = type.requiresDocument && count >= type.documentAfterDays;
      if (requiresDocument && !data.documentUrl)
        throw new BadRequestException('This leave type requires a document link');
      if (data.documentUrl) leaveDocumentUrl(data.documentUrl);
      const overlapping = await db.leaveRequest.findMany({
        where: {
          tenantId,
          employeeId: emp.id,
          status: { in: ['PENDING', 'APPROVED'] },
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      });
      if (
        overlapping.some((row) => leavesOverlap(row, dates, !!data.isHalfDay, data.halfDaySession))
      )
        throw new ConflictException('A pending or approved leave request overlaps these dates');
      if (
        await db.payslip.findFirst({
          where: {
            tenantId,
            employeeId: emp.id,
            year: startDate.getUTCFullYear(),
            month: { gte: startDate.getUTCMonth() + 1, lte: endDate.getUTCMonth() + 1 },
          },
        })
      )
        throw new ConflictException('Payroll already covers these dates');
      const year = startDate.getUTCFullYear();
      const balance = await this.ensureLeaveBalance(db, u, emp, type, year, today);
      if (balance.allocatedDays - balance.usedDays - balance.pendingDays < count)
        throw new BadRequestException('Insufficient available leave balance');
      const row = await db.leaveRequest.create({
        data: {
          tenantId,
          employeeId: emp.id,
          leaveTypeId: type.id,
          startDate,
          endDate,
          numberOfDays: count,
          isHalfDay: data.isHalfDay || false,
          halfDaySession: data.halfDaySession,
          chargedDates: dates,
          reason: data.reason.trim(),
          documentUrl: data.documentUrl,
          documentStatus: data.documentUrl || requiresDocument ? 'PENDING' : 'NOT_REQUIRED',
        },
      });
      await db.leaveBalance.update({
        where: { id: balance.id, tenantId },
        data: { pendingDays: { increment: count } },
      });
      await this.audit(db, u, 'LEAVE_REQUESTED', row.id);
      return row;
    });
  }
  async listLeaveRequests(u: HrActor) {
    const scope = await this.scope(u, hrManager(u));
    return this.prisma.leaveRequest.findMany({
      where: { tenantId: u.tenantId, ...scope },
      include: { employee: { select: summary }, leaveType: true },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }
  async reviewLeaveRequest(
    u: HrActor,
    id: string,
    data: { status: 'APPROVED' | 'REJECTED'; reviewerRemarks?: string }
  ) {
    requireHr(u, hrManagerRoles);
    return this.transaction(u, async (db) => {
      const tenantId = u.tenantId,
        row = await db.leaveRequest.findFirst({
          where: { id, tenantId },
          include: { employee: true, leaveType: true },
        });
      if (!row) throw new NotFoundException('Leave request not found');
      if (row.employee.userId === u.userId)
        throw new ForbiddenException('Another manager must review your leave');
      if (row.status !== 'PENDING')
        throw new ConflictException('This leave request has already been reviewed');
      if (
        data.status === 'APPROVED' &&
        (row.documentUrl ||
          (row.leaveType.requiresDocument &&
            row.numberOfDays >= row.leaveType.documentAfterDays)) &&
        (!row.documentUrl ||
          row.documentStatus !== 'VERIFIED' ||
          !row.documentVerifiedBy ||
          !row.documentVerifiedAt)
      )
        throw new ConflictException('Verify the supporting document before approving leave');
      if (data.status === 'APPROVED') {
        this.active(row.employee);
        const exit = await this.employmentEnd(db, u, row.employee);
        if (exit && row.endDate > exit)
          throw new ConflictException('Leave extends beyond the approved employment exit date');
        const others = await db.leaveRequest.findMany({
          where: {
            tenantId,
            employeeId: row.employeeId,
            id: { not: id },
            status: 'APPROVED',
            startDate: { lte: row.endDate },
            endDate: { gte: row.startDate },
          },
        });
        const charged = row.chargedDates.length
          ? row.chargedDates
          : leaveDates(hrDay(row.startDate), hrDay(row.endDate), { daysPerYear: 0 });
        if (
          others.some((other) =>
            leavesOverlap(other, charged, row.isHalfDay, row.halfDaySession || undefined)
          )
        )
          throw new ConflictException(
            'Approved leave overlaps this request. Reconcile it before approval.'
          );
      }
      await this.writablePeriod(db, u, row.startDate, row.endDate);
      if (
        await db.payslip.findFirst({
          where: {
            tenantId,
            employeeId: row.employeeId,
            year: row.startDate.getUTCFullYear(),
            month: { gte: row.startDate.getUTCMonth() + 1, lte: row.endDate.getUTCMonth() + 1 },
          },
        })
      )
        throw new ConflictException('Payroll already covers these dates');
      const balance = await db.leaveBalance.findFirst({
        where: {
          tenantId,
          employeeId: row.employeeId,
          leaveTypeId: row.leaveTypeId,
          year: row.startDate.getUTCFullYear(),
        },
      });
      if (!balance || balance.pendingDays < row.numberOfDays)
        throw new ConflictException('Reconcile the leave balance before review');
      await db.leaveBalance.update({
        where: { id: balance.id, tenantId },
        data: {
          pendingDays: { decrement: row.numberOfDays },
          ...(data.status === 'APPROVED' ? { usedDays: { increment: row.numberOfDays } } : {}),
        },
      });
      const result = await db.leaveRequest.update({
        where: { id, tenantId },
        data: { ...data, reviewedBy: u.userId, reviewedAt: new Date() },
      });
      await this.audit(db, u, 'LEAVE_' + data.status, id);
      return result;
    });
  }
  async cancelLeaveRequest(u: HrActor, id: string, reason: string) {
    return this.transaction(u, async (db) => {
      const tenantId = u.tenantId;
      const row = await db.leaveRequest.findFirst({
        where: { id, tenantId },
        include: { employee: true },
      });
      if (!row) throw new NotFoundException('Leave request not found');
      const own = row.employee.userId === u.userId;
      if ((!own && !hrManager(u)) || (row.status === 'APPROVED' && (own || !hrManager(u))))
        throw new ForbiddenException(
          'Pending personal requests can be cancelled; approved leave needs another manager'
        );
      if (!['PENDING', 'APPROVED'].includes(row.status))
        throw new ConflictException('Only pending or approved leave can be cancelled');
      await this.writablePeriod(db, u, row.startDate, row.endDate);
      if (
        await db.payslip.findFirst({
          where: {
            tenantId,
            employeeId: row.employeeId,
            year: row.startDate.getUTCFullYear(),
            month: { gte: row.startDate.getUTCMonth() + 1, lte: row.endDate.getUTCMonth() + 1 },
          },
        })
      )
        throw new ConflictException('Payroll already covers these leave dates');
      const balance = await db.leaveBalance.findFirst({
        where: {
          tenantId,
          employeeId: row.employeeId,
          leaveTypeId: row.leaveTypeId,
          year: row.startDate.getUTCFullYear(),
        },
      });
      const bucket = row.status === 'PENDING' ? 'pendingDays' : 'usedDays';
      if (!balance || balance[bucket] < row.numberOfDays)
        throw new ConflictException('Reconcile the leave balance before cancellation');
      await db.leaveBalance.update({
        where: { id: balance.id, tenantId },
        data: { [bucket]: { decrement: row.numberOfDays } },
      });
      const result = await db.leaveRequest.update({
        where: { id, tenantId },
        data: {
          status: 'CANCELLED',
          reviewedBy: u.userId,
          reviewedAt: new Date(),
          reviewerRemarks: reason.trim(),
        },
      });
      await this.audit(db, u, 'LEAVE_CANCELLED', id);
      return result;
    });
  }
  async previewPayroll(u: HrActor, data: HrPayrollDto, db: Tx = this.prisma) {
    requireHr(u, hrPayrollRoles);
    const tenantId = u.tenantId,
      start = hrDate(`${data.year}-${String(data.month).padStart(2, '0')}-01`),
      end = new Date(Date.UTC(data.year, data.month, 0));
    const dates = [...new Set(data.workingDates)].sort();
    if (
      !dates.length ||
      dates.length !== data.workingDates.length ||
      dates.some((date) => hrDate(date) < start || hrDate(date) > end)
    )
      throw new BadRequestException('Choose unique working dates within the payroll month');
    const { today } = await this.clock(u, db);
    if (hrDay(end) >= today)
      throw new BadRequestException('Payroll can only be processed after the month has ended');
    await this.writablePeriod(db, u, start, end);
    const employees = await db.employee.findMany({
      where: {
        tenantId,
        joiningDate: { lte: end },
        OR: [{ exitDate: null, employmentStatus: 'ACTIVE' }, { exitDate: { gte: start } }],
      },
      include: {
        statutoryProfile: true,
        resignations: {
          where: { tenantId, status: 'APPROVED' },
          select: { approvedExitDate: true },
        },
        salaryAssignments: {
          where: { tenantId, effectiveFrom: { lte: end } },
          include: { structure: { include: { components: { include: { component: true } } } } },
          orderBy: { effectiveFrom: 'desc' },
        },
      },
    });
    const slips: any[] = [],
      settledEmployees: { employeeId: string; employeeCode: string }[] = [],
      issues: string[] = [];
    for (const emp of employees) {
      if (
        await db.fullFinalSettlement.findFirst({
          where: {
            tenantId,
            employeeId: emp.id,
            status: 'FINALIZED',
            earnedSalary: { gt: 0 },
            resignation: { approvedExitDate: { gte: start, lte: end } },
          },
        })
      ) {
        settledEmployees.push({ employeeId: emp.id, employeeCode: emp.employeeCode });
        continue;
      }
      const exitDate = emp.exitDate || emp.resignations[0]?.approvedExitDate;
      const eligible = dates.filter(
        (day) => day >= hrDay(emp.joiningDate) && (!exitDate || day <= hrDay(exitDate))
      );
      if (!eligible.length) continue;
      if (
        new Set(emp.salaryAssignments.map((a) => hrDay(a.effectiveFrom))).size !==
        emp.salaryAssignments.length
      ) {
        issues.push(
          emp.employeeCode + ': reconcile multiple salary revisions on the same effective date'
        );
        continue;
      }
      if (!emp.staffId) {
        issues.push(emp.employeeCode + ': link the school staff record');
        continue;
      }
      const [attendance, leaves, pendingLeave] = await Promise.all([
        db.staffAttendance.findMany({
          where: { tenantId, staffId: emp.staffId, date: { gte: start, lte: end } },
        }),
        db.leaveRequest.findMany({
          where: {
            tenantId,
            employeeId: emp.id,
            status: 'APPROVED',
            startDate: { lte: end },
            endDate: { gte: start },
          },
          include: { leaveType: true },
        }),
        db.leaveRequest.findFirst({
          where: {
            tenantId,
            employeeId: emp.id,
            status: 'PENDING',
            startDate: { lte: end },
            endDate: { gte: start },
          },
        }),
      ]);
      if (pendingLeave) {
        issues.push(emp.employeeCode + ': review pending leave before payroll');
        continue;
      }
      const totals = new Map<
        string,
        { code: string; name: string; type: string; amount: number; isStatutory: boolean }
      >();
      let workedDays = 0,
        lossOfPayDays = 0,
        invalid = false;
      for (const date of eligible) {
        const assigned = emp.salaryAssignments.find((a) => hrDay(a.effectiveFrom) <= date);
        if (!assigned) {
          issues.push(`${emp.employeeCode}: no salary assignment for ${date}`);
          invalid = true;
          break;
        }
        let salary: ReturnType<typeof hrSalary>;
        try {
          salary = hrSalary(
            assigned.baseMonthlySalary,
            assigned.structure.components,
            emp.statutoryProfile
          );
        } catch (err) {
          issues.push(`${emp.employeeCode}: ${(err as Error).message}`);
          invalid = true;
          break;
        }
        const record = attendance.find((a) => hrDay(a.date) === date),
          dayLeaves = leaves.filter((l) => leaveCovers(l, date)),
          leaveFraction = dayLeaves.reduce((n, l) => n + (l.isHalfDay ? 0.5 : 1), 0),
          paidLeave = dayLeaves.reduce(
            (n, l) => n + (l.leaveType.isPaid ? (l.isHalfDay ? 0.5 : 1) : 0),
            0
          );
        if (
          leaveFraction > 1 ||
          dayLeaves.some((l, i) =>
            dayLeaves
              .slice(i + 1)
              .some((r) => leavesOverlap(l, [date], r.isHalfDay, r.halfDaySession || undefined))
          )
        ) {
          issues.push(`${emp.employeeCode}: overlapping approved leave for ${date}`);
          invalid = true;
          continue;
        }
        let weight = 0;
        if (leaveFraction === 1) weight = paidLeave;
        else if (record?.status === 'ABSENT') weight = paidLeave;
        else if (record && record.firstIn && record.lastOut)
          weight =
            Math.min(
              1 - leaveFraction,
              record.status === 'HALF_DAY'
                ? 0.5
                : ['PRESENT', 'LATE'].includes(record.status)
                  ? 1
                  : 0
            ) + paidLeave;
        else {
          issues.push(`${emp.employeeCode}: missing or incomplete attendance for ${date}`);
          invalid = true;
          continue;
        }
        workedDays += weight;
        lossOfPayDays += 1 - weight;
        for (const line of salary.items) {
          const old = totals.get(line.code) || { ...line, amount: 0 };
          old.amount += (line.amount * weight) / dates.length;
          totals.set(line.code, old);
        }
      }
      if (invalid) continue;
      const components = [...totals.values()].map((c) => ({ ...c, amount: hrRound(c.amount) }));
      const sum = (type: string) =>
        hrRound(components.filter((c) => c.type === type).reduce((n, c) => n + c.amount, 0));
      const grossSalary = sum('EARNING'),
        totalDeductions = sum('DEDUCTION');
      if (grossSalary < totalDeductions) {
        issues.push(emp.employeeCode + ': deductions exceed earnings');
        continue;
      }
      slips.push({
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.firstName + ' ' + emp.lastName,
        workedDays,
        lossOfPayDays,
        grossSalary,
        totalDeductions,
        netSalary: hrRound(grossSalary - totalDeductions),
        breakdown: {
          components,
          statutory: emp.statutoryProfile
            ? {
                pfApplicable: emp.statutoryProfile.pfApplicable,
                esiApplicable: emp.statutoryProfile.esiApplicable,
              }
            : null,
          salaryRevisions: emp.salaryAssignments
            .filter((a) =>
              eligible.some(
                (day) =>
                  emp.salaryAssignments.find((candidate) => hrDay(candidate.effectiveFrom) <= day)
                    ?.id === a.id
              )
            )
            .map((a) => ({
              assignmentId: a.id,
              structureId: a.structureId,
              effectiveFrom: hrDay(a.effectiveFrom),
              baseMonthlySalary: a.baseMonthlySalary,
            })),
          workingDates: dates,
          eligibleDates: eligible,
          employerContributions: sum('EMPLOYER_CONTRIBUTION'),
          calculation:
            'Configured components prorated over reviewed working dates; no automatic statutory rates.',
        },
      });
    }
    if (!slips.length && !issues.length) issues.push('No eligible employees found');
    return {
      year: data.year,
      month: data.month,
      workingDates: dates,
      settledEmployees,
      issues,
      slips,
      totalNet: hrRound(slips.reduce((n, s) => n + s.netSalary, 0)),
      totalGross: hrRound(slips.reduce((n, s) => n + s.grossSalary, 0)),
    };
  }
  async generateMonthlyPayroll(u: HrActor, data: HrPayrollDto) {
    requireHr(u, hrPayrollRoles);
    return this.transaction(u, async (db) => {
      const tenantId = u.tenantId,
        period = await db.payrollPeriod.findFirst({
          where: { tenantId, year: data.year, month: data.month },
        });
      if (
        period?.status === 'LOCKED' ||
        (period && (await db.payrollRun.findFirst({ where: { tenantId, periodId: period.id } }))) ||
        (await db.payslip.findFirst({ where: { tenantId, year: data.year, month: data.month } }))
      )
        throw new ConflictException(
          'Payroll already exists for this month. Review the existing run.'
        );
      const preview = await this.previewPayroll(u, data, db);
      if (preview.issues.length) throw new BadRequestException(preview.issues.join('; '));
      const selected =
        period ||
        (await db.payrollPeriod.create({
          data: {
            tenantId,
            year: data.year,
            month: data.month,
            startDate: new Date(Date.UTC(data.year, data.month - 1, 1)),
            endDate: new Date(Date.UTC(data.year, data.month, 0)),
            totalWorkingDays: preview.workingDates.length,
            status: 'OPEN',
          },
        }));
      if (period)
        await db.payrollPeriod.update({
          where: { id: period.id, tenantId },
          data: {
            startDate: new Date(Date.UTC(data.year, data.month - 1, 1)),
            endDate: new Date(Date.UTC(data.year, data.month, 0)),
            totalWorkingDays: preview.workingDates.length,
          },
        });
      const run = await db.payrollRun.create({
        data: {
          tenantId,
          periodId: selected.id,
          status: 'DRAFT',
          totalEmployees: preview.slips.length,
          totalGrossSalary: preview.totalGross,
          totalNetSalary: preview.totalNet,
          totalDeductions: hrRound(preview.slips.reduce((n, s) => n + s.totalDeductions, 0)),
        },
      });
      for (const { employeeCode, employeeName, ...slip } of preview.slips)
        await db.payslip.create({
          data: {
            ...slip,
            tenantId,
            runId: run.id,
            year: data.year,
            month: data.month,
            status: 'DRAFT',
          },
        });
      await this.audit(db, u, 'PAYROLL_DRAFTED', run.id);
      return { run, count: preview.slips.length, totalNet: preview.totalNet };
    });
  }
  async approvePayroll(u: HrActor, id: string) {
    requireHr(u, hrManagerRoles);
    return this.transaction(u, async (db) => {
      const tenantId = u.tenantId,
        run = await db.payrollRun.findFirst({
          where: { id, tenantId },
          include: { period: true, payslips: true },
        });
      if (!run) throw new NotFoundException('Payroll run not found');
      if (run.status !== 'DRAFT') throw new ConflictException('Only draft payroll can be approved');
      await this.independentReview(db, u, 'PAYROLL_DRAFTED', id);
      const sum = (field: 'grossSalary' | 'totalDeductions' | 'netSalary') =>
        hrRound(run.payslips.reduce((n, p) => n + p[field], 0));
      if (
        run.period.tenantId !== tenantId ||
        run.period.status !== 'OPEN' ||
        !run.payslips.length ||
        run.totalEmployees !== run.payslips.length ||
        new Set(run.payslips.map((p) => p.employeeId)).size !== run.payslips.length ||
        run.payslips.some(
          (p) =>
            ![p.grossSalary, p.totalDeductions, p.netSalary].every(
              (value) => Number.isFinite(value) && value >= 0
            ) ||
            p.tenantId !== tenantId ||
            p.status !== 'DRAFT' ||
            p.year !== run.period.year ||
            p.month !== run.period.month ||
            hrRound(p.grossSalary - p.totalDeductions) !== p.netSalary
        ) ||
        sum('grossSalary') !== hrRound(run.totalGrossSalary) ||
        sum('netSalary') !== hrRound(run.totalNetSalary) ||
        sum('totalDeductions') !== hrRound(run.totalDeductions)
      )
        throw new ConflictException(
          'Payroll totals or period are inconsistent. Reconcile this draft before approval.'
        );
      await db.payrollRun.update({ where: { id, tenantId }, data: { status: 'APPROVED' } });
      await db.payslip.updateMany({
        where: { tenantId, runId: id, status: 'DRAFT' },
        data: { status: 'APPROVED' },
      });
      await db.payrollPeriod.update({
        where: { id: run.periodId, tenantId },
        data: { status: 'LOCKED' },
      });
      await this.audit(db, u, 'PAYROLL_APPROVED', id);
      return { id };
    });
  }
  async payrollPeriods(u: HrActor, query: { year?: number; month?: number }) {
    requireHr(u, hrPayrollRoles);
    return this.prisma.payrollPeriod.findMany({
      where: {
        tenantId: u.tenantId,
        ...(query.year ? { year: query.year } : {}),
        ...(query.month ? { month: query.month } : {}),
      },
      include: { runs: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 120,
    });
  }
  async discardPayroll(u: HrActor, id: string, reason: string) {
    requireHr(u, hrPayrollRoles);
    if (!reason?.trim() || reason.trim().length < 5)
      throw new BadRequestException('Explain why this draft must be discarded');
    return this.transaction(u, async (db) => {
      const tenantId = u.tenantId;
      const run = await db.payrollRun.findFirst({
        where: { id, tenantId },
        include: { period: true, payslips: true },
      });
      if (!run) throw new NotFoundException('Payroll run not found');
      if (
        run.status !== 'DRAFT' ||
        run.period.status !== 'OPEN' ||
        run.period.tenantId !== tenantId ||
        run.payslips.some((p) => p.tenantId !== tenantId || p.status !== 'DRAFT')
      )
        throw new ConflictException(
          'Only an open draft can be discarded. Approved payroll stays locked.'
        );
      await db.auditLog.create({
        data: {
          tenantId,
          userId: u.userId,
          action: 'HR_PAYROLL_DISCARDED',
          entityType: 'hrms',
          entityId: id,
          changes: {
            reason: reason.trim(),
            year: run.period.year,
            month: run.period.month,
            totalNetSalary: run.totalNetSalary,
            totalEmployees: run.totalEmployees,
          },
        },
      });
      await db.payslip.deleteMany({ where: { tenantId, runId: id, status: 'DRAFT' } });
      await db.payrollRun.delete({ where: { id, tenantId } });
      return { id, discarded: true };
    });
  }
  async listPayslips(u: HrActor, query: { year?: number; month?: number; employeeId?: string }) {
    const scope = await this.scope(u, hrPayroll(u), query.employeeId);
    const rows = await this.prisma.payslip.findMany({
      where: {
        tenantId: u.tenantId,
        ...scope,
        ...(query.year ? { year: query.year } : {}),
        ...(query.month ? { month: query.month } : {}),
        ...(!hrPayroll(u) ? { status: 'APPROVED' } : {}),
      },
      include: { employee: { select: summary }, run: { select: { id: true, status: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { employeeId: 'asc' }],
    });
    if (!hrManager(u) || !rows.length) return rows;
    const authors = await this.prisma.auditLog.findMany({
      where: {
        tenantId: u.tenantId,
        entityType: 'hrms',
        action: 'HR_PAYROLL_DRAFTED',
        entityId: { in: [...new Set(rows.map((r) => r.runId))] },
      },
      select: { entityId: true, userId: true },
    });
    return rows.map((row) => ({
      ...row,
      run: { ...row.run, preparedBy: authors.find((a) => a.entityId === row.runId)?.userId },
    }));
  }
  async payslipCsv(u: HrActor, id: string) {
    const scope = await this.scope(u, hrPayroll(u));
    const row = await this.prisma.payslip.findFirst({
      where: {
        id,
        tenantId: u.tenantId,
        ...scope,
        ...(!hrPayroll(u) ? { status: 'APPROVED' } : {}),
      },
      include: { employee: { select: summary } },
    });
    if (!row) throw new NotFoundException('Payslip not found');
    const cell = (value: unknown) =>
      '"' +
      String(value ?? '')
        .replace(/^[=+@\-\t\r]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    const details: unknown[][] = [
      ['Employee', row.employee.employeeCode],
      ['Name', row.employee.firstName + ' ' + row.employee.lastName],
      ['Period', `${row.year}-${row.month}`],
      ['Status', row.status],
      ['Paid days', row.workedDays],
      ['Loss of pay days', row.lossOfPayDays],
      ['Gross', row.grossSalary],
      ['Deductions', row.totalDeductions],
      ['Net', row.netSalary],
    ];
    for (const line of (row.breakdown as any)?.components || [])
      details.push([line.name, line.type, line.amount]);
    return '\uFEFF' + details.map((line) => line.map(cell).join(',')).join('\r\n');
  }
  async listJobOffers(u: HrActor) {
    requireHr(u, hrManagerRoles);
    return this.prisma.jobOffer.findMany({
      where: { tenantId: u.tenantId },
      include: { joiningTasks: true },
      orderBy: { createdAt: 'desc' },
    });
  }
  async createJobOffer(u: HrActor, data: HrOfferDto, id?: string) {
    requireHr(u, hrManagerRoles);
    if (data.candidateName.trim().length < 2 || data.designationTitle.trim().length < 2)
      throw new BadRequestException('Enter a candidate name and designation');
    return this.transaction(u, async (db) => {
      if (id) {
        const existing = await db.jobOffer.findFirst({ where: { id, tenantId: u.tenantId } });
        if (!existing || existing.status !== 'OFFERED' || existing.employeeId)
          throw new ConflictException('Only open offers can be configured');
        if ((existing.candidateId || undefined) !== data.candidateId)
          throw new ConflictException('An offer cannot change its linked candidate');
      }
      if (data.candidateId) {
        const candidate = await recruitmentCandidate(db, u, data.candidateId);
        if (
          (!id && (candidate.status !== 'SELECTED' || candidate.offer)) ||
          (id && candidate.offer?.id !== id)
        )
          throw new ConflictException('Select the candidate before creating one linked offer');
        if (
          candidate.name !== data.candidateName.trim() ||
          candidate.email !== data.candidateEmail.trim().toLowerCase() ||
          candidate.phone !== data.candidatePhone.trim() ||
          candidate.vacancy.departmentId !== data.departmentId
        )
          throw new BadRequestException(
            'Offer identity and department must match the selected candidate'
          );
        if (!id) {
          if (candidate.vacancy.status !== 'OPEN')
            throw new ConflictException('Reopen the vacancy before issuing an offer');
          const committed = await db.recruitmentCandidate.count({
            where: {
              tenantId: u.tenantId,
              vacancyId: candidate.vacancyId,
              status: { in: ['OFFERED', 'HIRED'] },
            },
          });
          if (committed >= candidate.vacancy.positions)
            throw new ConflictException('All vacancy positions are already offered or filled');
        }
      }
      if (
        !(await db.department.findFirst({
          where: { id: data.departmentId, tenantId: u.tenantId },
        })) ||
        !(await db.salaryStructure.findFirst({
          where: { id: data.structureId, tenantId: u.tenantId },
        }))
      )
        throw new BadRequestException('Configure a school department and salary structure first');
      if (
        (data.schoolDepartment === 'TEACHING') !==
        ['TEACHER', 'CLASS_TEACHER'].includes(data.accountRole)
      )
        throw new BadRequestException(
          'Teaching offers require a teacher role; non-teaching offers require a staff role'
        );
      const fields = {
        ...data,
        candidateName: data.candidateName.trim(),
        candidateEmail: data.candidateEmail.trim().toLowerCase(),
        joiningDate: hrDate(data.joiningDate),
      };
      const tasks = [
        'Verify qualifications and identity',
        'Review employment terms',
        'Verify payroll and bank details',
        'Prepare school account and joining date',
      ].map((title) => ({ title, tenantId: u.tenantId, category: 'HR_FORMALITY' }));
      const row = id
        ? await db.jobOffer.update({ where: { id, tenantId: u.tenantId }, data: fields })
        : await db.jobOffer.create({
            data: { ...fields, tenantId: u.tenantId, joiningTasks: { create: tasks } },
          });
      if (id && !(await db.onboardingTask.count({ where: { tenantId: u.tenantId, offerId: id } })))
        await db.onboardingTask.createMany({
          data: tasks.map((task) => ({ ...task, offerId: id })),
        });
      else if (id)
        await db.onboardingTask.updateMany({
          where: { tenantId: u.tenantId, offerId: id },
          data: { isCompleted: false, completedAt: null },
        });
      await this.audit(db, u, id ? 'OFFER_UPDATED' : 'OFFER_CREATED', row.id);
      if (data.candidateId && !id)
        await db.recruitmentCandidate.update({
          where: { id: data.candidateId, tenantId: u.tenantId },
          data: { status: 'OFFERED' },
        });
      return row;
    });
  }
  async completeTask(u: HrActor, id: string, isCompleted: boolean) {
    requireHr(u, hrManagerRoles);
    return this.transaction(u, async (db) => {
      const task = await db.onboardingTask.findFirst({
        where: { id, tenantId: u.tenantId },
        include: { offer: true },
      });
      if (!task?.offer || task.offer.status !== 'OFFERED')
        throw new ConflictException('Only open offer tasks can be updated');
      const row = await db.onboardingTask.update({
        where: { id, tenantId: u.tenantId },
        data: { isCompleted, completedAt: isCompleted ? new Date() : null },
      });
      await this.audit(db, u, 'ONBOARDING_TASK_UPDATED', id);
      return row;
    });
  }
  async convertOfferToEmployee(u: HrActor, offerId: string, data: HrConvertOfferDto) {
    requireHr(u, hrManagerRoles);
    if (!!data.userId === !!data.newAccount)
      throw new BadRequestException(
        'Choose an existing account or supply a new joining account, exclusively'
      );
    if (data.userId === u.userId)
      throw new ForbiddenException('Another manager must complete your joining and initial salary');
    if (
      data.newAccount &&
      (!data.newAccount.firstName?.trim() ||
        !data.newAccount.lastName?.trim() ||
        data.newAccount.firstName.trim().length > 100 ||
        data.newAccount.lastName.trim().length > 100 ||
        typeof data.newAccount.password !== 'string' ||
        data.newAccount.password.length > 128 ||
        !isStrongPassword(data.newAccount.password, { minLength: 12 }))
    )
      throw new BadRequestException(
        'Enter the joining account names and a strong temporary password of 12–128 characters'
      );
    const passwordHash = data.newAccount
      ? await bcrypt.hash(data.newAccount.password, 12)
      : undefined;
    return this.transaction(u, async (db) => {
      const tenantId = u.tenantId,
        offer = await db.jobOffer.findFirst({
          where: { id: offerId, tenantId },
          include: { joiningTasks: true },
        });
      if (!offer) throw new NotFoundException('Offer not found');
      if (offer.status !== 'OFFERED' || offer.employeeId)
        throw new ConflictException('This offer has already been converted');
      if (!offer.joiningTasks.length || offer.joiningTasks.some((t) => !t.isCompleted))
        throw new BadRequestException('Complete all onboarding checks before joining');
      if (
        ![
          'TEACHER',
          'CLASS_TEACHER',
          'ACCOUNTANT',
          'LIBRARIAN',
          'TRANSPORT_OFFICER',
          'RECEPTIONIST',
          'SCHOOL_ADMIN',
        ].includes(offer.accountRole) ||
        (offer.schoolDepartment === 'TEACHING') !==
          ['TEACHER', 'CLASS_TEACHER'].includes(offer.accountRole)
      )
        throw new BadRequestException(
          'Review the offer school department and permitted account role'
        );
      const email = offer.candidateEmail.trim().toLowerCase();
      const emailAccounts = await db.user.findMany({
        where: { tenantId, email: { equals: email, mode: 'insensitive' } },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
        take: 2,
      });
      if (emailAccounts.length > 1)
        throw new ConflictException(
          'Multiple school accounts use this email. Reconcile them before joining.'
        );
      if (data.newAccount && emailAccounts.length)
        throw new ConflictException(
          'A school account already uses this email. Select the existing account.'
        );
      const userId = data.userId || randomUUID();
      const account = data.newAccount
        ? {
            id: userId,
            email,
            role: offer.accountRole,
            isActive: true,
            firstName: data.newAccount.firstName.trim(),
            lastName: data.newAccount.lastName.trim(),
          }
        : await db.user.findFirst({
            where: { id: userId, tenantId, isActive: true },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
            },
          });
      if (
        !account ||
        account.email.trim().toLowerCase() !== email ||
        account.role !== offer.accountRole ||
        (data.userId && emailAccounts[0]?.id !== data.userId)
      )
        throw new BadRequestException(
          'Choose the active school account matching the offer email and role'
        );
      const staffMatches = await db.staff.findMany({
        where: { tenantId, OR: [{ userId }, { email: { equals: email, mode: 'insensitive' } }] },
        take: 2,
      });
      const oldStaff = staffMatches[0];
      const employeeMatches = await db.employee.findMany({
        where: {
          tenantId,
          OR: [
            { userId },
            { email: { equals: email, mode: 'insensitive' } },
            ...(oldStaff ? [{ staffId: oldStaff.id }] : []),
          ],
        },
        take: 2,
      });
      const oldEmployee = employeeMatches[0];
      if (
        staffMatches.length > 1 ||
        employeeMatches.length > 1 ||
        (oldStaff &&
          (oldStaff.email.trim().toLowerCase() !== email ||
            (oldStaff.userId && oldStaff.userId !== userId) ||
            oldStaff.status !== 'ACTIVE' ||
            oldStaff.terminationDate ||
            hrDay(oldStaff.hireDate) !== hrDay(offer.joiningDate) ||
            oldStaff.department !== offer.schoolDepartment ||
            oldStaff.isTeacher !== (offer.schoolDepartment === 'TEACHING'))) ||
        (oldEmployee &&
          (oldEmployee.email.trim().toLowerCase() !== email ||
            (oldEmployee.userId && oldEmployee.userId !== userId) ||
            (oldEmployee.staffId && oldEmployee.staffId !== oldStaff?.id) ||
            oldEmployee.employmentStatus !== 'ACTIVE' ||
            oldEmployee.exitDate ||
            hrDay(oldEmployee.joiningDate) !== hrDay(offer.joiningDate)))
      )
        throw new ConflictException(
          'Existing staff or employee identity/employment conflicts with this offer. Reconcile the records before joining.'
        );
      const salaries = oldEmployee
        ? await db.employeeSalaryAssignment.findMany({
            where: { tenantId, employeeId: oldEmployee.id },
          })
        : [];
      if (
        oldEmployee &&
        ((await db.jobOffer.findFirst({
          where: { tenantId, employeeId: oldEmployee.id, id: { not: offerId } },
        })) ||
          (await db.payslip.findFirst({ where: { tenantId, employeeId: oldEmployee.id } })))
      )
        throw new ConflictException(
          'This employee already belongs to another offer or has payroll history'
        );
      if (
        salaries.length > 1 ||
        salaries.some(
          (s) =>
            hrDay(s.effectiveFrom) !== hrDay(offer.joiningDate) ||
            s.structureId !== offer.structureId ||
            s.baseMonthlySalary !== offer.offeredCtcMonthly
        )
      )
        throw new ConflictException(
          'Existing salary terms differ from the reviewed offer. Reconcile them before joining.'
        );
      const structure = await db.salaryStructure.findFirst({
        where: { id: offer.structureId || '', tenantId },
        include: { components: { include: { component: true } } },
      });
      if (
        !structure ||
        !(await db.department.findFirst({ where: { id: offer.departmentId || '', tenantId } }))
      )
        throw new BadRequestException('Offer needs a school department and salary structure');
      hrSalary(offer.offeredCtcMonthly, structure.components);
      await this.writablePeriod(db, u, offer.joiningDate);
      const designation = await db.designation.upsert({
        where: { tenantId_title: { tenantId, title: offer.designationTitle } },
        create: { tenantId, title: offer.designationTitle },
        update: {},
      });
      if (data.newAccount) {
        await db.user.create({
          data: {
            id: userId,
            tenantId,
            email,
            role: offer.accountRole as any,
            firstName: account.firstName,
            lastName: account.lastName,
            phone: offer.candidatePhone,
            passwordHash: passwordHash!,
            mustChangePassword: true,
          },
          select: { id: true },
        });
        await this.audit(db, u, 'ACCOUNT_CREATED', userId);
      }
      const employeeCode =
        oldEmployee?.employeeCode ||
        oldStaff?.staffNumber ||
        'EMP-' + randomUUID().slice(0, 8).toUpperCase();
      const staff = oldStaff
        ? await db.staff.update({ where: { id: oldStaff.id, tenantId }, data: { userId } })
        : await db.staff.create({
            data: {
              tenantId,
              userId,
              staffNumber: employeeCode,
              firstName: account.firstName,
              lastName: account.lastName,
              email,
              phone: offer.candidatePhone,
              gender: 'OTHER',
              department: offer.schoolDepartment as any,
              isTeacher: offer.schoolDepartment === 'TEACHING',
              position: offer.designationTitle,
              employmentType: 'PERMANENT',
              hireDate: offer.joiningDate,
            },
          });
      const employeeData = {
        staffId: staff.id,
        userId,
        firstName: account.firstName,
        lastName: account.lastName,
        email,
        phone: offer.candidatePhone,
        joiningDate: offer.joiningDate,
        departmentId: offer.departmentId,
        designationId: designation.id,
      };
      const emp = oldEmployee
        ? await db.employee.update({
            where: { id: oldEmployee.id, tenantId },
            data: employeeData,
            select: employeeView,
          })
        : await db.employee.create({
            select: employeeView,
            data: { ...employeeData, tenantId, employeeCode },
          });
      if (!salaries.length)
        await db.employeeSalaryAssignment.create({
          data: {
            tenantId,
            employeeId: emp.id,
            structureId: structure.id,
            baseMonthlySalary: offer.offeredCtcMonthly,
            effectiveFrom: offer.joiningDate,
          },
        });
      await db.onboardingTask.updateMany({
        where: { tenantId, offerId },
        data: { employeeId: emp.id },
      });
      await db.jobOffer.update({
        where: { id: offerId, tenantId },
        data: { status: 'JOINED', employeeId: emp.id },
      });
      await this.audit(db, u, 'OFFER_JOINED', offerId);
      if (offer.candidateId)
        await db.recruitmentCandidate.update({
          where: { id: offer.candidateId, tenantId },
          data: { status: 'HIRED' },
        });
      return emp;
    });
  }
  async submitResignation(
    u: HrActor,
    data: { employeeId?: string; reason: string; preferredExitDate: string }
  ) {
    return this.transaction(u, async (db) => {
      const emp = await this.employee(u, data.employeeId, db, false);
      this.active(emp);
      if (
        !(await db.staff.findFirst({
          where: { id: emp.staffId!, tenantId: u.tenantId, userId: u.userId, status: 'ACTIVE' },
        }))
      )
        throw new ConflictException(
          'Staff/account link changed. Ask management to reconcile staff HR.'
        );
      const { today } = await this.clock(u, db),
        preferredExitDate = hrDate(data.preferredExitDate);
      if (data.preferredExitDate < today || preferredExitDate < emp.joiningDate)
        throw new BadRequestException('Choose an exit date on or after today and joining');
      if (
        await db.resignation.findFirst({
          where: {
            tenantId: u.tenantId,
            employeeId: emp.id,
            status: { in: ['SUBMITTED', 'APPROVED', 'COMPLETED'] },
          },
        })
      )
        throw new ConflictException('An active resignation already exists');
      const row = await db.resignation.create({
        data: {
          tenantId: u.tenantId,
          employeeId: emp.id,
          reason: data.reason.trim(),
          preferredExitDate,
          clearances: {
            create: ['LIBRARY', 'ACCOUNTS', 'ASSETS_IT', 'PRINCIPAL'].map((department) => ({
              tenantId: u.tenantId,
              employeeId: emp.id,
              department,
            })),
          },
        },
      });
      await this.audit(db, u, 'RESIGNATION_SUBMITTED', row.id);
      return row;
    });
  }
  async listResignations(u: HrActor) {
    const team = hrManager(u) || ['ACCOUNTANT', 'LIBRARIAN'].includes(u.role),
      scope = await this.scope(u, team);
    return this.prisma.resignation.findMany({
      where: { tenantId: u.tenantId, ...scope },
      select: {
        id: true,
        employeeId: true,
        reason: hrManager(u) || !team,
        preferredExitDate: true,
        approvedExitDate: true,
        status: true,
        completedAt: true,
        completedBy: hrManager(u),
        relievingLetter: { select: { id: true, referenceNumber: true, issueDate: true } },
        reviewRemarks: hrManager(u) || !team,
        employee: { select: summary },
        clearances: {
          where: {
            tenantId: u.tenantId,
            ...(!hrManager(u) && team
              ? { department: u.role === 'ACCOUNTANT' ? 'ACCOUNTS' : 'LIBRARY' }
              : {}),
          },
        },
        settlement: hrPayroll(u) || !team ? true : false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  async reviewResignation(
    u: HrActor,
    id: string,
    data: { status: 'APPROVED' | 'REJECTED'; approvedExitDate?: string; reviewerRemarks?: string }
  ) {
    requireHr(u, hrManagerRoles);
    return this.transaction(u, async (db) => {
      const row = await db.resignation.findFirst({
        where: { id, tenantId: u.tenantId },
        include: { employee: true },
      });
      if (!row) throw new NotFoundException('Resignation not found');
      if (row.employee.userId === u.userId)
        throw new ForbiddenException('Another manager must review your resignation');
      if (row.status !== 'SUBMITTED')
        throw new ConflictException('Only submitted resignations can be reviewed');
      const exit = data.status === 'APPROVED' ? hrDate(data.approvedExitDate || '') : null;
      if (exit && exit < row.employee.joiningDate)
        throw new BadRequestException('Exit date precedes joining');
      const result = await db.resignation.update({
        where: { id, tenantId: u.tenantId },
        data: {
          status: data.status,
          approvedExitDate: exit,
          reviewRemarks: data.reviewerRemarks,
          reviewedBy: u.userId,
          reviewedAt: new Date(),
        },
      });
      await this.audit(db, u, 'RESIGNATION_' + data.status, id);
      return result;
    });
  }
  async reviewClearance(
    u: HrActor,
    id: string,
    data: { status: 'CLEARED' | 'DUES_PENDING'; duesAmount: number; remarks?: string }
  ) {
    return this.transaction(u, async (db) => {
      const row = await db.exitClearance.findFirst({
        where: { id, tenantId: u.tenantId },
        include: { resignation: true, employee: true },
      });
      if (!row) throw new NotFoundException('Clearance not found');
      if (
        !hrManager(u) &&
        !(u.role === 'ACCOUNTANT' && row.department === 'ACCOUNTS') &&
        !(u.role === 'LIBRARIAN' && row.department === 'LIBRARY')
      )
        throw new ForbiddenException('You can only review your department clearance');
      if (row.employee.userId === u.userId)
        throw new ForbiddenException('Another staff member must clear your case');
      if (row.resignation.status !== 'APPROVED')
        throw new ConflictException('Approve the resignation before clearance');
      if (data.status === 'CLEARED' && data.duesAmount !== 0)
        throw new BadRequestException('Cleared items must have zero outstanding dues');
      const finalized = await db.fullFinalSettlement.findFirst({
        where: { tenantId: u.tenantId, resignationId: row.resignationId, status: 'FINALIZED' },
      });
      if (row.lockedAt || finalized?.finalizedBy)
        throw new ConflictException('Settlement is finalized');
      const result = await db.exitClearance.update({
        where: { id, tenantId: u.tenantId },
        data: { ...data, clearedBy: u.userId, clearedAt: new Date() },
      });
      await db.fullFinalSettlement.updateMany({
        where: {
          tenantId: u.tenantId,
          resignationId: row.resignationId,
          status: { in: ['CALCULATED', 'FINALIZED'] },
          finalizedBy: null,
        },
        data: { status: 'REVIEW_REQUIRED' },
      });
      await this.audit(db, u, 'CLEARANCE_REVIEWED', id);
      return result;
    });
  }
  async settle(u: HrActor, id: string, data: HrSettlementDto) {
    requireHr(u, hrPayrollRoles);
    return this.transaction(u, async (db) => {
      const r = await db.resignation.findFirst({
        where: { id, tenantId: u.tenantId },
        include: { clearances: true, employee: true, settlement: true },
      });
      if (!r || r.status !== 'APPROVED' || !r.approvedExitDate)
        throw new ConflictException('Approved resignation with an exit date required');
      if (r.employee.userId === u.userId)
        throw new ForbiddenException('Another payroll officer must prepare your settlement');
      assertExitClearances(r);
      if (r.settlement?.finalizedBy) throw new ConflictException('Settlement already finalized');
      if (data.workingDaysInFinalMonth > r.approvedExitDate.getUTCDate())
        throw new BadRequestException('Final-month working days exceed the approved exit date');
      if (
        data.earnedSalary > 0 &&
        (await db.payslip.findFirst({
          where: {
            tenantId: u.tenantId,
            employeeId: r.employeeId,
            year: r.approvedExitDate.getUTCFullYear(),
            month: r.approvedExitDate.getUTCMonth() + 1,
          },
        }))
      )
        throw new ConflictException(
          'Payroll already includes final-month salary. Review it and set earned salary to zero here.'
        );
      if (
        await db.employeeOrderLetter.findFirst({
          where: { tenantId: u.tenantId, employeeId: r.employeeId, letterType: 'RELIEVING_LETTER' },
        })
      )
        throw new ConflictException(
          'An existing relieving letter requires reconciliation before preparing this case'
        );
      const preparedSnapshot = exitSnapshot(r, data, randomUUID());
      const netSettlementAmount = hrRound(
        data.earnedSalary + data.leaveEncashmentAmount - data.noticePayRecovery
      );
      const row = await db.fullFinalSettlement.upsert({
        where: { resignationId: id },
        create: {
          ...data,
          tenantId: u.tenantId,
          resignationId: id,
          employeeId: r.employeeId,
          assetDuesDeduction: 0,
          netSettlementAmount,
          preparedSnapshot,
          preparedBy: u.userId,
        },
        update: {
          ...data,
          netSettlementAmount,
          preparedSnapshot,
          preparedBy: u.userId,
          status: 'CALCULATED',
          settlementDate: null,
          finalizedBy: null,
        },
      });
      if (r.settlement?.status === 'FINALIZED')
        await this.audit(db, u, 'LEGACY_SETTLEMENT_REPREPARED', row.id);
      await this.audit(db, u, 'SETTLEMENT_PREPARED', row.id);
      return row;
    });
  }
  async finalizeSettlement(
    u: HrActor,
    id: string,
    referenceNumber?: string,
    preparationId?: string
  ) {
    requireHr(u, hrManagerRoles);
    if (!referenceNumber)
      throw new BadRequestException(
        'Complete exit requires a relieving-letter reference; settlement cannot be finalized separately'
      );
    return this.completeExit(u, id, referenceNumber, preparationId);
  }
  async issueRelievingLetter(
    u: HrActor,
    id: string,
    referenceNumber: string,
    preparationId?: string
  ) {
    return (await this.completeExit(u, id, referenceNumber, preparationId)).letter;
  }
  async completeExit(u: HrActor, id: string, referenceNumber: string, preparationId?: string) {
    requireHr(u, hrManagerRoles);
    if (!preparationId || !isUUID(preparationId))
      throw new BadRequestException(
        'Review the current settlement preparation before completing exit'
      );
    referenceNumber = referenceNumber.trim();
    if (
      referenceNumber.length < 3 ||
      referenceNumber.length > 80 ||
      /[\u0000-\u001f\u007f]/.test(referenceNumber)
    )
      throw new BadRequestException('Enter a valid relieving-letter reference of 3–80 characters');
    return this.transaction(u, async (db) => {
      const tenantId = u.tenantId;
      const row = await db.resignation.findFirst({
        where: { id, tenantId },
        include: { employee: true, clearances: true, settlement: true },
      });
      if (
        !row ||
        row.status !== 'APPROVED' ||
        !row.approvedExitDate ||
        row.completedAt ||
        row.settlement?.status !== 'CALCULATED'
      )
        throw new ConflictException(
          'Approve resignation, complete clearances and prepare a reviewed settlement before completing exit'
        );
      const { today } = await this.clock(u, db);
      if (hrDay(row.approvedExitDate) > today)
        throw new BadRequestException('Complete exit on or after the approved exit date');
      if (row.employee.userId === u.userId)
        throw new ForbiddenException('Another manager must complete your exit');
      this.active(row.employee);
      if (row.approvedExitDate < row.employee.joiningDate || !row.employee.userId)
        throw new ConflictException(
          'Reconcile the employee employment and account link before exit'
        );
      assertExitClearances(row);
      const settlement = row.settlement!;
      if (
        settlement.tenantId !== tenantId ||
        settlement.employeeId !== row.employeeId ||
        settlement.resignationId !== id ||
        !settlement.preparedSnapshot ||
        !settlement.preparedBy ||
        !isDeepStrictEqual(
          settlement.preparedSnapshot,
          exitSnapshot(row, settlement, preparationId)
        ) ||
        settlement.netSettlementAmount !== exitSnapshot(row, settlement).amounts.netSettlementAmount
      )
        throw new ConflictException(
          'Exit details or amounts changed. Prepare the settlement again before completion.'
        );
      const preparation = await this.independentReview(db, u, 'SETTLEMENT_PREPARED', settlement.id);
      if (preparation.userId !== settlement.preparedBy)
        throw new ConflictException('Settlement preparation evidence changed; prepare it again');
      const clearanceAudits = await db.auditLog.findMany({
        where: {
          tenantId,
          entityType: 'hrms',
          action: 'HR_CLEARANCE_REVIEWED',
          entityId: { in: row.clearances.map((c) => c.id) },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (
        row.clearances.some(
          (c) => clearanceAudits.find((a) => a.entityId === c.id)?.userId !== c.clearedBy
        )
      )
        throw new ConflictException('Review department clearance evidence before completing exit');
      const finalPayslip = await db.payslip.findFirst({
        where: {
          tenantId,
          employeeId: row.employeeId,
          year: row.approvedExitDate.getUTCFullYear(),
          month: row.approvedExitDate.getUTCMonth() + 1,
        },
      });
      if (finalPayslip && settlement.earnedSalary > 0)
        throw new ConflictException(
          'Payroll now includes final-month salary. Prepare the settlement again with earned salary set to zero.'
        );
      if (finalPayslip && finalPayslip.status !== 'APPROVED')
        throw new ConflictException(
          'Approve or discard final-month draft payroll before completing exit'
        );
      if (
        await db.leaveRequest.findFirst({
          where: {
            tenantId,
            employeeId: row.employeeId,
            OR: [
              { status: 'PENDING' },
              { status: 'APPROVED', endDate: { gt: row.approvedExitDate } },
            ],
          },
        })
      )
        throw new ConflictException(
          'Resolve pending leave and approved leave beyond the exit date first'
        );
      const staff = await db.staff.findFirst({
        where: {
          id: row.employee.staffId!,
          tenantId,
          userId: row.employee.userId,
          status: 'ACTIVE',
        },
      });
      const account = await db.user.findFirst({
        where: { id: row.employee.userId, tenantId },
        select: { id: true, email: true, role: true, isActive: true, tokenVersion: true },
      });
      if (
        !staff ||
        !account ||
        account.role === 'SUPER_ADMIN' ||
        !hrStaffRoles.includes(account.role as any) ||
        staff.email.trim().toLowerCase() !== row.employee.email.trim().toLowerCase() ||
        account.email.trim().toLowerCase() !== row.employee.email.trim().toLowerCase() ||
        (await db.employee.findFirst({
          where: {
            tenantId,
            id: { not: row.employeeId },
            employmentStatus: 'ACTIVE',
            OR: [{ userId: account.id }, { staffId: staff.id }],
          },
        })) ||
        (await db.staff.findFirst({
          where: { tenantId, id: { not: staff.id }, userId: account.id, status: 'ACTIVE' },
        }))
      )
        throw new ConflictException(
          'Reconcile the active staff, employee and school account chain before revocation'
        );
      if (
        await db.employeeOrderLetter.findFirst({
          where: {
            tenantId,
            OR: [
              { referenceNumber: { equals: referenceNumber, mode: 'insensitive' } },
              { resignationId: id },
              { settlementId: settlement.id },
              { employeeId: row.employeeId, letterType: 'RELIEVING_LETTER' },
            ],
          },
        })
      )
        throw new ConflictException(
          'Letter reference or relieving letter already exists; reconcile the case'
        );
      const now = new Date();
      const locked = await db.exitClearance.updateMany({
        where: {
          tenantId,
          resignationId: id,
          employeeId: row.employeeId,
          status: 'CLEARED',
          duesAmount: 0,
          lockedAt: null,
        },
        data: { lockedAt: now },
      });
      if (locked.count !== 4)
        throw new ConflictException('Clearances changed while completing exit');
      const finalized = await db.fullFinalSettlement.updateMany({
        where: {
          id: settlement.id,
          tenantId,
          resignationId: id,
          employeeId: row.employeeId,
          status: 'CALCULATED',
        },
        data: { status: 'FINALIZED', settlementDate: now, finalizedBy: u.userId },
      });
      if (finalized.count !== 1)
        throw new ConflictException('Settlement changed while completing exit');
      const letter = await db.employeeOrderLetter.create({
        data: {
          tenantId,
          employeeId: row.employeeId,
          resignationId: id,
          settlementId: settlement.id,
          letterType: 'RELIEVING_LETTER',
          referenceNumber,
          content: `${row.employee.firstName} ${row.employee.lastName} (${row.employee.employeeCode}) is relieved from school duties effective ${hrDay(row.approvedExitDate)} following approved resignation, departmental clearances and finalized settlement.`,
          issuedBy: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.userId,
        },
      });
      const departed = await db.employee.updateMany({
        where: {
          id: row.employeeId,
          tenantId,
          employmentStatus: 'ACTIVE',
          staffId: staff.id,
          userId: account.id,
          email: row.employee.email,
          exitDate: row.employee.exitDate,
        },
        data: { employmentStatus: 'RESIGNED', exitDate: row.approvedExitDate },
      });
      if (departed.count !== 1)
        throw new ConflictException('Employee link changed while completing exit');
      const terminated = await db.staff.updateMany({
        where: { id: staff.id, tenantId, userId: account.id, status: 'ACTIVE', email: staff.email },
        data: { status: 'TERMINATED', terminationDate: row.approvedExitDate },
      });
      if (terminated.count !== 1)
        throw new ConflictException('Staff link changed while completing exit');
      const revoked = await db.user.updateMany({
        where: {
          id: account.id,
          tenantId,
          isActive: account.isActive,
          tokenVersion: account.tokenVersion,
          email: account.email,
        },
        data: { isActive: false, tokenVersion: { increment: 1 } },
      });
      if (revoked.count !== 1)
        throw new ConflictException('Account changed while revoking access; retry completion');
      await db.pushSubscription.deleteMany({ where: { tenantId, userId: account.id } });
      const completed = await db.resignation.updateMany({
        where: { id, tenantId, status: 'APPROVED', approvedExitDate: row.approvedExitDate },
        data: {
          status: 'COMPLETED',
          completedAt: now,
          completedBy: u.userId,
          revokedUserId: account.id,
          revokedTokenVersion: account.tokenVersion + 1,
        },
      });
      if (completed.count !== 1)
        throw new ConflictException('Resignation changed while completing exit');
      await this.audit(db, u, 'SETTLEMENT_FINALIZED', settlement.id);
      await this.audit(db, u, 'RELIEVING_ISSUED', letter.id);
      await this.audit(db, u, 'EXIT_COMPLETED', id);
      return {
        resignationId: id,
        status: 'COMPLETED',
        completedAt: now,
        settlementId: settlement.id,
        letter,
        accountRevoked: true,
      };
    });
  }
  async letters(u: HrActor) {
    const scope = await this.scope(u, hrManager(u));
    return this.prisma.employeeOrderLetter.findMany({
      where: { tenantId: u.tenantId, ...scope },
      orderBy: { issueDate: 'desc' },
    });
  }
}
