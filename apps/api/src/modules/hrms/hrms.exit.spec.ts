import { HrmsService } from './hrms.service';
import { assertExitClearances, exitSnapshot } from './hrms-exit';
const preparationId = '10000000-0000-4000-8000-000000000099';
const actor = { tenantId: 'school', userId: 'approver', role: 'PRINCIPAL' };
const day = new Date('2026-01-01');
function fixture() {
  const fn = (value: any = null) => jest.fn().mockResolvedValue(value);
  const employee = {
    id: 'employee',
    tenantId: 'school',
    userId: 'leaver',
    staffId: 'staff',
    email: 'leaver@example.test',
    firstName: 'Exit',
    lastName: 'Fixture',
    employeeCode: 'EXIT-1',
    employmentStatus: 'ACTIVE',
    joiningDate: day,
    exitDate: null,
  };
  const row: any = {
    id: 'resignation',
    tenantId: 'school',
    employeeId: employee.id,
    employee,
    status: 'APPROVED',
    approvedExitDate: day,
    clearances: ['ACCOUNTS', 'ASSETS_IT', 'LIBRARY', 'PRINCIPAL'].map((department, i) => ({
      id: 'c' + i,
      tenantId: 'school',
      employeeId: employee.id,
      resignationId: 'resignation',
      department,
      status: 'CLEARED',
      duesAmount: 0,
      clearedBy: 'clearer',
      clearedAt: day,
      lockedAt: null,
    })),
  };
  row.settlement = {
    id: 'settlement',
    tenantId: 'school',
    resignationId: row.id,
    employeeId: employee.id,
    status: 'CALCULATED',
    preparedBy: 'preparer',
    workingDaysInFinalMonth: 1,
    earnedSalary: 1000,
    leaveEncashmentAmount: 200,
    noticePayRecovery: 100,
    assetDuesDeduction: 0,
    netSettlementAmount: 1100,
  };
  row.settlement.preparedSnapshot = exitSnapshot(row, row.settlement, preparationId);
  const staff = {
    id: 'staff',
    userId: 'leaver',
    tenantId: 'school',
    email: employee.email,
    status: 'ACTIVE',
  };
  const db: any = {
    tenant: { update: fn(), findFirst: fn({ timezone: 'Asia/Kolkata' }) },
    resignation: { findFirst: fn(row), updateMany: fn({ count: 1 }) },
    auditLog: {
      findFirst: fn({ userId: 'preparer' }),
      findMany: fn(row.clearances.map((c: any) => ({ entityId: c.id, userId: c.clearedBy }))),
      create: fn(),
    },
    payslip: { findFirst: fn() },
    leaveRequest: { findFirst: fn() },
    employeeOrderLetter: { findFirst: fn(), create: fn({ id: 'letter' }) },
    staff: { findFirst: fn(), updateMany: fn({ count: 1 }) },
    user: {
      findFirst: fn({
        id: 'leaver',
        email: employee.email,
        role: 'TEACHER',
        isActive: true,
        tokenVersion: 4,
      }),
      updateMany: fn({ count: 1 }),
    },
    employee: { findFirst: fn(), updateMany: fn({ count: 1 }) },
    exitClearance: { updateMany: fn({ count: 4 }) },
    fullFinalSettlement: { updateMany: fn({ count: 1 }) },
    pushSubscription: { deleteMany: fn({ count: 2 }) },
  };
  db.staff.findFirst.mockResolvedValueOnce(staff);
  db.$transaction = jest.fn(async (work: any) => work(db));
  return { row, db, service: new HrmsService(db) };
}
describe('Atomic school exit completion', () => {
  it('rejects stale preparation even when the reviewed amounts are unchanged', async () => {
    const { row, db, service } = fixture();
    row.settlement.preparedSnapshot = exitSnapshot(
      row,
      row.settlement,
      '10000000-0000-4000-8000-000000000088'
    );
    await expect(
      service.completeExit(actor, 'resignation', 'STALE-REF', preparationId)
    ).rejects.toThrow('Prepare the settlement again');
    expect(db.exitClearance.updateMany).not.toHaveBeenCalled();
  });
  it('requires the reviewed preparation identifier on every completion path', async () => {
    const { service } = fixture();
    await expect(service.completeExit(actor, 'resignation', 'MISSING-REF')).rejects.toThrow(
      'current settlement preparation'
    );
    await expect(service.finalizeSettlement(actor, 'resignation', 'MISSING-REF')).rejects.toThrow(
      'current settlement preparation'
    );
    await expect(service.issueRelievingLetter(actor, 'resignation', 'MISSING-REF')).rejects.toThrow(
      'current settlement preparation'
    );
  });
  it('commits settlement, clearance locks, linked letter, employment and revocation in one transaction', async () => {
    const { db, service } = fixture();
    const result = await service.completeExit(actor, 'resignation', ' REF-1 ', preparationId);
    expect(result).toMatchObject({
      status: 'COMPLETED',
      accountRevoked: true,
      letter: { id: 'letter' },
    });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.employeeOrderLetter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resignationId: 'resignation',
          settlementId: 'settlement',
          referenceNumber: 'REF-1',
        }),
      })
    );
    expect(db.user.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: 'leaver', tenantId: 'school', tokenVersion: 4 }),
      data: { isActive: false, tokenVersion: { increment: 1 } },
    });
    expect(db.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { tenantId: 'school', userId: 'leaver' },
    });
    expect(db.resignation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ completedBy: actor.userId, revokedTokenVersion: 5 }),
      })
    );
  });
  it.each(['exitClearance', 'fullFinalSettlement', 'employee', 'staff', 'user', 'resignation'])(
    'fails completion if the %s update affects zero records',
    async (model) => {
      const { db, service } = fixture();
      db[model].updateMany.mockResolvedValue({ count: 0 });
      await expect(
        service.completeExit(actor, 'resignation', 'REF-2', preparationId)
      ).rejects.toThrow();
      expect(db.auditLog.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'HR_EXIT_COMPLETED' }) })
      );
    }
  );
  it('rejects changed settlement inputs before writing final state', async () => {
    const { row, db, service } = fixture();
    row.settlement.earnedSalary = 999;
    await expect(
      service.completeExit(actor, 'resignation', 'REF-3', preparationId)
    ).rejects.toThrow('Prepare the settlement again');
    expect(db.exitClearance.updateMany).not.toHaveBeenCalled();
  });
  it('rejects missing preparation evidence and future effective exits', async () => {
    const { row, db, service } = fixture();
    row.settlement.preparedSnapshot = null;
    await expect(
      service.completeExit(actor, 'resignation', 'REF-4', preparationId)
    ).rejects.toThrow('Prepare the settlement again');
    row.approvedExitDate = new Date('2199-01-01');
    await expect(
      service.completeExit(actor, 'resignation', 'REF-4', preparationId)
    ).rejects.toThrow('on or after');
    expect(db.exitClearance.updateMany).not.toHaveBeenCalled();
  });
  it('rejects self-completion, the financial preparer and platform account revocation', async () => {
    const first = fixture();
    first.row.employee.userId = actor.userId;
    await expect(
      first.service.completeExit(actor, 'resignation', 'REF-5', preparationId)
    ).rejects.toThrow('Another manager');
    const second = fixture();
    second.db.auditLog.findFirst.mockResolvedValue({ userId: actor.userId });
    await expect(
      second.service.completeExit(actor, 'resignation', 'REF-5', preparationId)
    ).rejects.toThrow('different manager');
    const third = fixture();
    third.db.user.findFirst.mockResolvedValue({
      id: 'leaver',
      email: third.row.employee.email,
      role: 'SUPER_ADMIN',
      isActive: true,
      tokenVersion: 4,
    });
    await expect(
      third.service.completeExit(actor, 'resignation', 'REF-5', preparationId)
    ).rejects.toThrow('account chain');
  });
  it('refuses unresolved leave, draft payroll, duplicate references and ambiguous identities', async () => {
    const a = fixture();
    a.db.leaveRequest.findFirst.mockResolvedValue({ id: 'pending' });
    await expect(
      a.service.completeExit(actor, 'resignation', 'REF-6', preparationId)
    ).rejects.toThrow('Resolve pending leave');
    const b = fixture();
    b.row.settlement.earnedSalary = 0;
    b.row.settlement.netSettlementAmount = 100;
    b.row.settlement.preparedSnapshot = exitSnapshot(b.row, b.row.settlement, preparationId);
    b.db.payslip.findFirst.mockResolvedValue({ status: 'DRAFT' });
    await expect(
      b.service.completeExit(actor, 'resignation', 'REF-6', preparationId)
    ).rejects.toThrow('draft payroll');
    const c = fixture();
    c.db.employeeOrderLetter.findFirst.mockResolvedValue({ id: 'existing' });
    await expect(
      c.service.completeExit(actor, 'resignation', 'REF-6', preparationId)
    ).rejects.toThrow('already exists');
    const d = fixture();
    d.db.employee.findFirst.mockResolvedValue({ id: 'another' });
    await expect(
      d.service.completeExit(actor, 'resignation', 'REF-6', preparationId)
    ).rejects.toThrow('account chain');
  });
  it('blocks standalone settlement finalization and keeps both old routes on the atomic operation', async () => {
    const { service } = fixture();
    await expect(service.finalizeSettlement(actor, 'resignation')).rejects.toThrow(
      'cannot be finalized separately'
    );
    const complete = jest
      .spyOn(service, 'completeExit')
      .mockResolvedValue({ letter: { id: 'letter' } } as any);
    await service.finalizeSettlement(actor, 'resignation', 'REF-7', preparationId);
    expect(
      await service.issueRelievingLetter(actor, 'resignation', 'REF-8', preparationId)
    ).toEqual({
      id: 'letter',
    });
    expect(complete.mock.calls.map((c) => c[2])).toEqual(['REF-7', 'REF-8']);
  });
});
describe('Exit preparation evidence', () => {
  it('requires each distinct department and its independent signed clearance', () => {
    const { row } = fixture();
    assertExitClearances(row);
    row.clearances[0].department = 'LIBRARY';
    expect(() => assertExitClearances(row)).toThrow('distinct');
  });
  it.each(['missing reviewer', 'self review', 'dues', 'locked'])(
    'rejects invalid clearance evidence: %s',
    (condition) => {
      const { row } = fixture(),
        c = row.clearances[0];
      if (condition === 'missing reviewer') c.clearedBy = null;
      if (condition === 'self review') c.clearedBy = 'leaver';
      if (condition === 'dues') c.duesAmount = 100;
      if (condition === 'locked') c.lockedAt = day;
      expect(() => assertExitClearances(row)).toThrow();
    }
  );
  it('takes a stable snapshot independent of department ordering', () => {
    const { row } = fixture(),
      snapshot = exitSnapshot(row, row.settlement);
    row.clearances.reverse();
    expect(exitSnapshot(row, row.settlement)).toEqual(snapshot);
    row.clearances[0].remarks = 'Changed evidence';
    expect(exitSnapshot(row, row.settlement)).not.toEqual(snapshot);
  });
});
