import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { HrmsController } from './hrms.controller';
import { HrmsService } from './hrms.service';
import { HrScopeGuard } from './hrms-scope.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantService } from '../../database/tenant.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { exitSnapshot } from './hrms-exit';
import { hrManagerRoles, hrPayrollRoles, hrStaffRoles, requireHr } from './hrms.policy';

const preparationId = '10000000-0000-4000-8000-000000000099';
const manager = { tenantId: 'school', userId: 'manager', role: 'PRINCIPAL' };
const teacher = { ...manager, userId: 'teacher', role: 'TEACHER' };
const employee = {
  id: 'employee',
  userId: 'teacher',
  tenantId: 'school',
  staffId: 'staff',
  employmentStatus: 'ACTIVE',
  joiningDate: new Date('2020-01-01'),
  exitDate: null,
};
const context = (handler: Function, user: any, headers: any = {}) =>
  ({
    getClass: () => HrmsController,
    getHandler: () => handler,
    switchToHttp: () => ({ getRequest: () => ({ user, headers }) }),
  }) as unknown as ExecutionContext;
function fixture() {
  const fn = (value: any = null) => jest.fn().mockResolvedValue(value);
  const db: any = {
    tenant: { update: fn({}), findFirst: fn({ timezone: 'Asia/Kolkata' }) },
    employee: { findFirst: fn(employee), findMany: fn([employee]), update: fn(employee) },
    staff: { findFirst: fn({ id: 'staff' }) },
    staffAttendance: { findFirst: fn(null), create: fn(), upsert: fn() },
    resignation: { findFirst: fn(null) },
    punchLog: { findMany: fn([]), create: fn() },
    auditLog: { findFirst: fn({ userId: 'preparer' }), create: fn({}) },
    payslip: { findFirst: fn(null), updateMany: fn(), deleteMany: fn() },
    payrollRun: { findFirst: fn(), update: fn(), delete: fn() },
    employeeStatutoryProfile: { findFirst: fn(), upsert: fn() },
    payrollPeriod: { update: fn(), findFirst: fn() },
    leaveBalance: { findFirst: fn(), update: fn() },
    leaveRequest: { findFirst: fn(), findMany: fn([]), update: fn() },
    fullFinalSettlement: { findFirst: fn(), update: fn(), upsert: fn(), updateMany: fn() },
    shiftAssignment: { findFirst: fn(), update: fn() },
  };
  db.$transaction = jest.fn(async (work: any) => work(db));
  return { db, service: new HrmsService(db) };
}
describe('HR authorization boundary', () => {
  const matrix: Record<string, readonly string[]> = {};
  for (const name of [
    'account',
    'recruitment',
    'vacancy',
    'editVacancy',
    'candidate',
    'editCandidate',
    'candidateStage',
    'interview',
    'rescheduleInterview',
    'interviewReview',
    'offerDecision',
    'overview',
    'sync',
    'configure',
    'assignShift',
    'endShift',
    'attendance',
    'correct',
    'reviewLeave',
    'accrueLeave',
    'verifyLeaveDocument',
    'offers',
    'offer',
    'editOffer',
    'task',
    'convert',
    'reviewExit',
    'finalize',
    'completeExit',
    'relieve',
    'approve',
  ])
    matrix[name] = hrManagerRoles;
  for (const name of [
    'employees',
    'salary',
    'withdrawSalary',
    'statutory',
    'saveStatutory',
    'periods',
    'discard',
    'setup',
    'structures',
    'createMaster',
    'editMaster',
    'structure',
    'preview',
    'payroll',
    'settlement',
  ])
    matrix[name] = hrPayrollRoles;
  for (const name of [
    'profile',
    'employee',
    'shifts',
    'punch',
    'punches',
    'types',
    'leave',
    'leaves',
    'cancelLeave',
    'leaveBalances',
    'leaveDocument',
    'slips',
    'download',
    'resign',
    'resignations',
    'clearance',
    'letters',
  ])
    matrix[name] = hrStaffRoles;
  const handlers = Object.getOwnPropertyNames(HrmsController.prototype).filter(
    (n) => n !== 'constructor'
  ) as (keyof HrmsController)[];
  it('reviews every controller handler, including new handlers', () =>
    expect(handlers.sort()).toEqual(Object.keys(matrix).sort()));
  for (const handler of handlers)
    it(`${handler} enforces the reviewed role matrix`, () => {
      const guard = new RolesGuard(new Reflector());
      for (const role of [...hrStaffRoles, 'PARENT', 'STUDENT', 'UNKNOWN']) {
        const invoke = () =>
          guard.canActivate(context(HrmsController.prototype[handler], { ...manager, role }));
        if (matrix[handler].includes(role)) expect(invoke()).toBe(true);
        else expect(invoke).toThrow();
      }
      expect(() => guard.canActivate(context(HrmsController.prototype[handler], null))).toThrow();
    });
  it('requires an authenticated actor ID even for direct service use', () => {
    expect(() => requireHr({ ...manager, userId: '' })).toThrow();
  });
  it('requires explicit platform school selection and refuses a mismatched context', () => {
    const tenants = new TenantService(),
      guard = new HrScopeGuard(tenants);
    tenants.run(() => {
      const selected = '10000000-0000-4000-8000-000000000001';
      tenants.setTenantId(selected);
      expect(() => guard.canActivate(context(() => {}, manager))).toThrow();
      const user = { ...manager, role: 'SUPER_ADMIN' };
      expect(() => guard.canActivate(context(() => {}, user))).toThrow();
      const request = { user, headers: { 'x-tenant-id': selected } };
      const ctx = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;
      expect(guard.canActivate(ctx)).toBe(true);
      expect(request.user.tenantId).toBe(selected);
    });
  });
  it('denies another employee ID even when the school matches', async () => {
    const { db, service } = fixture();
    db.employee.findFirst.mockResolvedValue({ ...employee, userId: 'other' });
    await expect(service.getEmployeeById(teacher, 'other-employee')).rejects.toThrow(
      'own employee'
    );
  });
  it('does not silently select one of multiple legacy employee links', async () => {
    const { db, service } = fixture();
    db.employee.findMany.mockResolvedValue([employee, { ...employee, id: 'duplicate' }]);
    await expect(service.profile(teacher)).rejects.toThrow('Multiple HR employees');
    await expect(service.recordPunch(teacher, { punchType: 'CHECK_IN' })).rejects.toThrow(
      'Multiple HR employees'
    );
    expect(db.punchLog.create).not.toHaveBeenCalled();
  });
});
describe('HR financial and lifecycle gates', () => {
  it('blocks attendance even when a locked period has no employee payslip', async () => {
    const { db, service } = fixture();
    db.payrollPeriod.findFirst.mockResolvedValue({ status: 'LOCKED' });
    await expect(
      service.correctAttendance(manager, {
        employeeId: 'employee',
        date: '2026-10-01',
        status: 'ABSENT',
        reason: 'Reviewed absence',
      })
    ).rejects.toThrow('Payroll already covers');
    expect(db.staffAttendance.upsert).not.toHaveBeenCalled();
  });
  it('blocks self-review and draft changes to statutory profiles', async () => {
    const { db, service } = fixture();
    db.employee.findFirst.mockResolvedValue({ ...employee, userId: manager.userId });
    await expect(
      service.saveStatutoryProfile(manager, 'employee', {
        pfApplicable: false,
        esiApplicable: false,
      })
    ).rejects.toThrow('Another payroll officer');
    db.employee.findFirst.mockResolvedValue(employee);
    db.payslip.findFirst.mockResolvedValue({ status: 'DRAFT' });
    await expect(
      service.saveStatutoryProfile(manager, 'employee', {
        pfApplicable: false,
        esiApplicable: false,
      })
    ).rejects.toThrow('Discard draft');
    expect(db.employeeStatutoryProfile.upsert).not.toHaveBeenCalled();
  });
  it('never discards approved payroll or draft slips in a locked period', async () => {
    const { db, service } = fixture();
    for (const run of [
      { status: 'APPROVED', period: { status: 'LOCKED' } },
      { status: 'DRAFT', period: { status: 'LOCKED' } },
    ]) {
      db.payrollRun.findFirst.mockResolvedValue({ ...run, payslips: [] });
      await expect(
        service.discardPayroll(manager, 'run', 'Correct reviewed inputs')
      ).rejects.toThrow('stays locked');
    }
    expect(db.payslip.deleteMany).not.toHaveBeenCalled();
    expect(db.payrollRun.delete).not.toHaveBeenCalled();
  });
  it('prevents own salary assignment before any financial write', async () => {
    const { db, service } = fixture();
    db.employee.findFirst.mockResolvedValue({ ...employee, userId: manager.userId });
    await expect(service.assignSalary(manager, 'employee', {} as any)).rejects.toThrow(
      'Another payroll officer'
    );
    expect(db.employee.update).not.toHaveBeenCalled();
  });
  it('prevents managers completing their own joining and initial salary', async () => {
    const { service } = fixture();
    await expect(
      service.convertOfferToEmployee(manager, 'offer', { userId: manager.userId })
    ).rejects.toThrow('Another manager');
  });
  it.each(['same preparer', 'missing preparation audit'])(
    'rejects payroll approval with %s',
    async (condition) => {
      const { db, service } = fixture();
      db.payrollRun.findFirst.mockResolvedValue({ id: 'run', status: 'DRAFT' });
      db.auditLog.findFirst.mockResolvedValue(
        condition === 'same preparer' ? { userId: manager.userId } : null
      );
      await expect(service.approvePayroll(manager, 'run')).rejects.toThrow();
      expect(db.payrollRun.update).not.toHaveBeenCalled();
      expect(db.payslip.updateMany).not.toHaveBeenCalled();
    }
  );
  it('rejects a tampered draft even for an independent approver', async () => {
    const { db, service } = fixture();
    db.payrollRun.findFirst.mockResolvedValue({
      id: 'run',
      status: 'DRAFT',
      totalEmployees: 1,
      period: { tenantId: 'school', status: 'OPEN' },
      payslips: [],
    });
    await expect(service.approvePayroll(manager, 'run')).rejects.toThrow('inconsistent');
    expect(db.payrollRun.update).not.toHaveBeenCalled();
  });
  it('keeps a management attendance correction locked against self punches', async () => {
    const { db, service } = fixture();
    db.staffAttendance.findFirst.mockResolvedValue({ isRegularized: true });
    await expect(service.recordPunch(teacher, { punchType: 'CHECK_IN' })).rejects.toThrow(
      'corrected by management'
    );
    expect(db.staffAttendance.upsert).not.toHaveBeenCalled();
    expect(db.punchLog.create).not.toHaveBeenCalled();
  });
  it('blocks punching after the approved employment end', async () => {
    const { db, service } = fixture();
    db.resignation.findFirst.mockResolvedValue({ approvedExitDate: new Date('2020-01-01') });
    await expect(service.recordPunch(teacher, { punchType: 'CHECK_IN' })).rejects.toThrow(
      'exit date has passed'
    );
    expect(db.punchLog.create).not.toHaveBeenCalled();
  });
  it('blocks extending a shift into another assignment', async () => {
    const { db, service } = fixture();
    db.shiftAssignment.findFirst
      .mockResolvedValueOnce({
        id: 'shift',
        employeeId: 'employee',
        effectiveFrom: new Date('2026-01-01'),
      })
      .mockResolvedValueOnce({ id: 'another' });
    await expect(service.endShift(manager, 'shift', '2026-12-31')).rejects.toThrow('overlaps');
    expect(db.shiftAssignment.update).not.toHaveBeenCalled();
  });
  const clearances = ['ACCOUNTS', 'ASSETS_IT', 'LIBRARY', 'PRINCIPAL'].map((department, i) => ({
    id: 'clearance-' + i,
    tenantId: 'school',
    resignationId: 'resignation',
    employeeId: employee.id,
    department,
    status: 'CLEARED',
    duesAmount: 0,
    clearedBy: 'clearer',
    clearedAt: new Date('2026-11-20'),
    lockedAt: null,
  }));
  function completionCase() {
    const row: any = {
      id: 'resignation',
      tenantId: 'school',
      employeeId: employee.id,
      employee,
      status: 'APPROVED',
      clearances,
      approvedExitDate: new Date('2026-11-20'),
    };
    row.settlement = {
      id: 'settlement',
      tenantId: 'school',
      resignationId: row.id,
      employeeId: employee.id,
      status: 'CALCULATED',
      preparedBy: 'preparer',
      workingDaysInFinalMonth: 10,
      earnedSalary: 100,
      leaveEncashmentAmount: 0,
      noticePayRecovery: 0,
      assetDuesDeduction: 0,
      netSettlementAmount: 100,
    };
    row.settlement.preparedSnapshot = exitSnapshot(row, row.settlement, preparationId);
    return row;
  }
  it('prevents a settlement preparer approving the same amounts', async () => {
    const { db, service } = fixture();
    db.resignation.findFirst.mockResolvedValue(completionCase());
    db.auditLog.findFirst.mockResolvedValue({ userId: manager.userId });
    await expect(
      service.completeExit(manager, 'resignation', 'TEST-REF', preparationId)
    ).rejects.toThrow('different manager');
    expect(db.fullFinalSettlement.update).not.toHaveBeenCalled();
  });
  it('rechecks final-month payroll created after settlement preparation', async () => {
    const { db, service } = fixture();
    db.resignation.findFirst.mockResolvedValue(completionCase());
    db.auditLog.findMany = jest
      .fn()
      .mockResolvedValue(clearances.map((c) => ({ entityId: c.id, userId: c.clearedBy })));
    db.payslip.findFirst.mockResolvedValue({ id: 'new-payroll' });
    await expect(
      service.completeExit(manager, 'resignation', 'TEST-REF', preparationId)
    ).rejects.toThrow('Payroll now includes');
    expect(db.fullFinalSettlement.update).not.toHaveBeenCalled();
  });
  it('blocks duplicate final salary where a payslip already exists', async () => {
    const { db, service } = fixture();
    db.resignation.findFirst.mockResolvedValue({
      id: 'resignation',
      tenantId: 'school',
      status: 'APPROVED',
      employeeId: 'employee',
      employee,
      clearances,
      approvedExitDate: new Date('2026-11-20'),
      settlement: null,
    });
    db.payslip.findFirst.mockResolvedValue({ id: 'paid' });
    await expect(
      service.settle(manager, 'resignation', {
        workingDaysInFinalMonth: 10,
        earnedSalary: 100,
        leaveEncashmentAmount: 0,
        noticePayRecovery: 0,
      })
    ).rejects.toThrow('already includes final-month');
    expect(db.fullFinalSettlement.upsert).not.toHaveBeenCalled();
  });
  it('releases pending leave balance on personal cancellation', async () => {
    const { db, service } = fixture();
    const row = {
      id: 'leave',
      status: 'PENDING',
      employee,
      employeeId: employee.id,
      leaveTypeId: 'type',
      numberOfDays: 2,
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-12-02'),
    };
    db.leaveRequest.findFirst.mockResolvedValue(row);
    db.leaveBalance.findFirst.mockResolvedValue({ id: 'balance', pendingDays: 2 });
    db.leaveRequest.update.mockImplementation(async ({ data }: any) => ({ ...row, ...data }));
    expect((await service.cancelLeaveRequest(teacher, 'leave', 'Plans changed')).status).toBe(
      'CANCELLED'
    );
    expect(db.leaveBalance.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { pendingDays: { decrement: 2 } } })
    );
  });
  it('rechecks imported overlapping leave at approval before changing a balance', async () => {
    const { db, service } = fixture();
    const row = {
      id: 'pending',
      status: 'PENDING',
      employee,
      employeeId: employee.id,
      leaveType: { requiresDocument: false },
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-12-01'),
      isHalfDay: true,
      halfDaySession: 'AM',
      chargedDates: ['2026-12-01'],
    };
    db.leaveRequest.findFirst.mockResolvedValue(row);
    db.leaveRequest.findMany.mockResolvedValue([{ ...row, id: 'approved', status: 'APPROVED' }]);
    await expect(
      service.reviewLeaveRequest(manager, 'pending', { status: 'APPROVED' })
    ).rejects.toThrow('Approved leave overlaps');
    expect(db.leaveBalance.update).not.toHaveBeenCalled();
  });
  it('denies approved self-cancellation and cancellation after payroll', async () => {
    const { db, service } = fixture();
    const row = {
      id: 'leave',
      status: 'APPROVED',
      employee,
      employeeId: employee.id,
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-12-02'),
    };
    db.leaveRequest.findFirst.mockResolvedValue(row);
    await expect(service.cancelLeaveRequest(teacher, 'leave', 'Plans changed')).rejects.toThrow(
      'another manager'
    );
    db.payslip.findFirst.mockResolvedValue({ id: 'slip' });
    await expect(service.cancelLeaveRequest(manager, 'leave', 'Plans changed')).rejects.toThrow(
      'Payroll already covers'
    );
    expect(db.leaveBalance.update).not.toHaveBeenCalled();
  });
});
describe('Verified JWT identity before HR tenant scoping', () => {
  function jwtFixture() {
    const tenants = new TenantService();
    const user = {
      id: 'user',
      role: 'TEACHER',
      tenantId: 'school',
      isActive: true,
      tokenVersion: 2,
      tenant: { status: 'ACTIVE' },
    };
    const db: any = {
      user: { findUnique: jest.fn().mockResolvedValue(user) },
      executeWithoutTenantFilter: jest.fn(async (work: any) => work()),
    };
    return {
      user,
      tenants,
      db,
      strategy: new JwtStrategy(new ConfigService({ JWT_SECRET: 'test-only-secret' }), db, tenants),
    };
  }
  it('uses stored role and token version, not a claimed role', async () => {
    const { tenants, strategy } = jwtFixture();
    await tenants.run(async () => {
      const actor = await strategy.validate({
        sub: 'user',
        ver: 2,
        type: 'access',
        role: 'PRINCIPAL',
      });
      expect(actor.role).toBe('TEACHER');
      await expect(strategy.validate({ sub: 'user', ver: 1, type: 'access' })).rejects.toThrow();
    });
  });
  it('rejects revoked accounts and foreign-school context', async () => {
    const { user, tenants, strategy } = jwtFixture();
    await tenants.run(async () => {
      tenants.setTenantId('foreign');
      await expect(strategy.validate({ sub: 'user', ver: 2, type: 'access' })).rejects.toThrow();
      tenants.setTenantId('school');
      user.isActive = false;
      await expect(strategy.validate({ sub: 'user', ver: 2, type: 'access' })).rejects.toThrow();
    });
  });
  it('resolves a platform identity before applying a selected school', async () => {
    const { user, tenants, strategy, db } = jwtFixture();
    user.role = 'SUPER_ADMIN';
    await tenants.run(async () => {
      tenants.setTenantId('selected');
      expect((await strategy.validate({ sub: 'user', ver: 2, type: 'access' })).role).toBe(
        'SUPER_ADMIN'
      );
      expect(tenants.getTenantId()).toBe('selected');
      expect(db.user.findUnique).toHaveBeenCalled();
    });
  });
  it('executes lazy Prisma identity queries inside the isolated context', async () => {
    const { user, tenants, strategy, db } = jwtFixture();
    user.role = 'SUPER_ADMIN';
    db.user.findUnique.mockImplementation(() => ({
      then(resolve: any) {
        expect(tenants.getTenantId()).toBeNull();
        resolve(user);
      },
    }));
    await tenants.run(async () => {
      tenants.setTenantId('selected');
      expect((await strategy.validate({ sub: 'user', ver: 2, type: 'access' })).role).toBe(
        'SUPER_ADMIN'
      );
      expect(tenants.getTenantId()).toBe('selected');
    });
  });
});
