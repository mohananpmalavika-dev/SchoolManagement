import 'reflect-metadata';

import { randomUUID } from 'node:crypto';

import { Prisma } from '@krypton/database';

import { CompleteRolloverDto, PromotionAction, RolloverPlanDto } from './academic-rollover.dto';
import { AcademicRolloverService } from './academic-rollover.service';

describe('Academic-year bulk promotion', () => {
  const tenantId = randomUUID(), campus = randomUUID(), sourceId = randomUUID(), targetId = randomUUID();
  const classA = randomUUID(), classB = randomUUID(), classC = randomUUID(), streamA = randomUUID(), streamB = randomUUID();
  const ids = [randomUUID(), randomUUID(), randomUUID()];
  const manager = { userId: randomUUID(), role: 'PRINCIPAL' };
  let service: AcademicRolloverService, db: any, state: any, plan: RolloverPlanDto;
  const copy = <T>(value: T): T => structuredClone(value);
  const whereTenant = (rows: any[]) => rows.filter(row => row.tenantId === tenantId).sort((a, b) => a.id.localeCompare(b.id));
  beforeEach(() => {
    state = {
      years: [
        { id: sourceId, tenantId, name: '2025-26', isCurrent: true, startDate: new Date('2025-04-01'), endDate: new Date('2026-03-31') },
        { id: targetId, tenantId, name: '2026-27', isCurrent: false, startDate: new Date('2026-04-01'), endDate: new Date('2027-03-31') },
      ],
      classes: [classA, classB, classC].map((id, index) => ({ id, tenantId, name: 'Class ' + (index + 1), schoolId: campus })),
      streams: [{ id: streamA, tenantId, classId: classA, schoolId: campus, name: 'A', capacity: 40 }, { id: streamB, tenantId, classId: classB, schoolId: campus, name: 'B', capacity: 2 }],
      students: ids.map((id, index) => ({ id, tenantId, firstName: 'Student', lastName: String(index), admissionNumber: 'ADM-' + index,
        status: 'ACTIVE', deletedAt: null, currentClassId: index === 2 ? classC : classA, currentStreamId: index === 0 ? streamA : null,
        admissionDate: new Date('2025-06-01'), updatedAt: new Date('2026-03-15') })),
      enrollments: [{ id: randomUUID(), tenantId, studentId: ids[0], classId: classA, streamId: streamA, academicYearId: sourceId, enrollmentDate: new Date('2025-06-01') }],
      terms: [{ id: randomUUID(), tenantId, academicYearId: sourceId, isCurrent: true }], runs: [], audits: [],
    };
    db = {
      tenant: { update: jest.fn() },
      academicYear: {
        findMany: jest.fn(async () => copy(whereTenant(state.years))),
        updateMany: jest.fn(async ({data}: any) => { state.years.forEach((row: any) => Object.assign(row, data)); }),
        update: jest.fn(async ({where, data}: any) => { Object.assign(state.years.find((row: any) => row.id === where.id), data); }),
      },
      class: { findMany: jest.fn(async () => copy(whereTenant(state.classes))) },
      stream: { findMany: jest.fn(async () => copy(whereTenant(state.streams))) },
      student: {
        findMany: jest.fn(async () => copy(whereTenant(state.students).filter((row: any) => row.status === 'ACTIVE' && !row.deletedAt))),
        updateMany: jest.fn(async ({where, data}: any) => {
          const selected = state.students.filter((row: any) => row.tenantId === where.tenantId && where.id.in.includes(row.id) && row.status === where.status && !row.deletedAt);
          selected.forEach((row: any) => Object.assign(row, data)); return { count: selected.length };
        }),
      },
      enrollment: {
        findMany: jest.fn(async () => copy(whereTenant(state.enrollments))),
        createMany: jest.fn(async ({data}: any) => { state.enrollments.push(...data.map((row: any) => ({...copy(row), id: randomUUID()}))); }),
      },
      term: { findMany: jest.fn(async () => copy(whereTenant(state.terms))),
        updateMany: jest.fn(async ({data}: any) => { state.terms.forEach((row: any) => Object.assign(row, data)); }) },
      academicYearRollover: {
        findFirst: jest.fn(async ({where}: any) => copy(state.runs.find((row: any) => Object.entries(where).every(([key, value]) => row[key] === value)) || null)),
        findMany: jest.fn(async () => copy(state.runs)),
        create: jest.fn(async ({data}: any) => { const row = {...copy(data), id: randomUUID()}; state.runs.push(row); return row; }),
      },
      auditLog: { create: jest.fn(async ({data}: any) => { state.audits.push(copy(data)); }) },
    };
    db.$transaction = jest.fn(async (work: any) => {
      const saved = copy(state);
      try { return await work(db); } catch (error) { state = saved; throw error; }
    });
    service = new AcademicRolloverService(db, { requireTenantContext: () => tenantId } as any);
    plan = { sourceYearId: sourceId, targetYearId: targetId, decisions: [
      { studentId: ids[0], action: PromotionAction.PROMOTE, classId: classB, streamId: streamB },
      { studentId: ids[1], action: PromotionAction.RETAIN, classId: classA },
      { studentId: ids[2], action: PromotionAction.GRADUATE },
    ] };
  });
  async function approved(): Promise<CompleteRolloverDto> { return { ...plan, previewToken: (await service.preview(manager, plan)).previewToken }; }

  it('previews the full cohort without writing records', async () => {
    const result = await service.preview(manager, plan);
    expect(result.summary).toEqual({total: 3, promoted: 1, retained: 1, graduated: 1});
    expect(result.rows).toHaveLength(3); expect(result.previewToken).toMatch(/^[a-f0-9]{64}$/);
    expect(db.student.updateMany).not.toHaveBeenCalled(); expect(db.academicYear.update).not.toHaveBeenCalled();
    expect(db.$transaction.mock.calls[0][1].isolationLevel).toBe(Prisma.TransactionIsolationLevel.RepeatableRead);
  });

  it('preserves existing history, records retained enrollment and graduates terminal students atomically', async () => {
    const original = copy(state.enrollments[0]);
    const result = await service.complete(manager, await approved());
    expect(result.alreadyCompleted).toBe(false);expect(state.enrollments[0]).toEqual(original);
    expect(state.enrollments.filter((row: any) => row.academicYearId === sourceId)).toHaveLength(3);
    const target = state.enrollments.filter((row: any) => row.academicYearId === targetId);
    expect(target).toHaveLength(2);
    expect(target).toEqual(expect.arrayContaining([
      expect.objectContaining({studentId: ids[0], classId: classB, streamId: streamB}),
      expect.objectContaining({studentId: ids[1], classId: classA, streamId: null}),
    ]));
    expect(state.students[2]).toMatchObject({status: 'GRADUATED', currentClassId: null, currentStreamId: null, graduationDate: new Date('2026-03-31')});
    expect(state.years.find((row: any) => row.id === targetId).isCurrent).toBe(true);
    expect(state.years.find((row: any) => row.id === sourceId).isCurrent).toBe(false);
    expect(state.terms[0].isCurrent).toBe(false);
    expect(state.runs).toHaveLength(1); expect(state.audits[0].action).toBe('ACADEMIC_YEAR_ROLLOVER');
    const transactions = db.$transaction.mock.calls;
    expect(transactions[transactions.length - 1][1].isolationLevel).toBe(Prisma.TransactionIsolationLevel.Serializable);
  });

  it('returns the original completion on an exact retry without duplicating enrollments', async () => {
    const request = await approved();const first = await service.complete(manager, request);
    const count = state.enrollments.length; const retry = await service.complete(manager, request);
    expect(retry).toMatchObject({id: first.id, alreadyCompleted: true});
    expect(state.enrollments).toHaveLength(count);expect(state.runs).toHaveLength(1);
    await expect(service.complete(manager, {...request, decisions: request.decisions.map(row => row.studentId === ids[0] ? {...row, streamId: undefined} : row)})).rejects.toThrow('already been rolled over');
  });

  it.each(['PARENT', 'STUDENT', 'TEACHER', 'RECEPTIONIST', 'ACCOUNTANT', 'SUPER_ADMIN'])('denies rollover access to %s', async role => {
    await expect(service.options({...manager, role})).rejects.toThrow('management access');
    await expect(service.preview({...manager, role}, plan)).rejects.toThrow('management access');
    await expect(service.complete({...manager, role}, {...plan, previewToken: 'a'.repeat(64)})).rejects.toThrow('management access');
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('requires the entire current active cohort once each', async () => {
    await expect(service.preview(manager, {...plan, decisions: plan.decisions.slice(1)})).rejects.toThrow('every active student');
    await expect(service.preview(manager, {...plan, decisions: [plan.decisions[0], plan.decisions[0]]})).rejects.toThrow('exactly once');
    await expect(service.preview(manager, {...plan, decisions: [...plan.decisions.slice(1), {...plan.decisions[0], studentId: randomUUID()}]})).rejects.toThrow('every active student');
  });

  it('rejects missing years, overlapping dates and a noncurrent source', async () => {
    await expect(service.preview(manager, {...plan, targetYearId: sourceId})).rejects.toThrow('different');
    await expect(service.preview(manager, {...plan, targetYearId: randomUUID()})).rejects.toThrow('in your school');
    state.years[1].startDate = new Date('2026-03-01');
    await expect(service.preview(manager, plan)).rejects.toThrow('start after');
    state.years[0].isCurrent = false;
    await expect(service.preview(manager, plan)).rejects.toThrow('only current');
  });

  it('rejects stale preview after a roster, capacity or plan change', async () => {
    const request = await approved();
    state.students[1].updatedAt = new Date('2026-03-16');
    await expect(service.complete(manager, request)).rejects.toThrow('changed after preview');
    const fresh = await approved();state.streams[1].capacity = 3;
    await expect(service.complete(manager, fresh)).rejects.toThrow('changed after preview');
    const third = await approved();third.decisions = third.decisions.map(row => row.studentId === ids[0] ? {...row, streamId: undefined} : row);
    await expect(service.complete(manager, third)).rejects.toThrow('changed after preview');
    expect(state.runs).toHaveLength(0);
  });

  it('rejects admissions added after preview and students with no current class', async () => {
    const request = await approved();state.students.push({...copy(state.students[0]), id: randomUUID()});
    await expect(service.complete(manager, request)).rejects.toThrow('every active student');
    state.students.pop();state.students[1].currentClassId = null;
    await expect(service.preview(manager, plan)).rejects.toThrow('Assign a current class');
  });

  it('rejects preexisting target enrollments, even for unselected students', async () => {
    state.enrollments.push({...state.enrollments[0], id: randomUUID(), studentId: randomUUID(), academicYearId: targetId});
    await expect(service.preview(manager, plan)).rejects.toThrow('already has enrollments');
  });

  it('validates promote/retain/graduate destinations and campus ownership', async () => {
    const changed = (action: PromotionAction, classId?: string) => ({...plan, decisions: plan.decisions.map((row, index) => index === 0 ? {studentId: row.studentId, action, classId} : row)});
    await expect(service.preview(manager, changed(PromotionAction.PROMOTE, classA))).rejects.toThrow('different class');
    await expect(service.preview(manager, changed(PromotionAction.RETAIN, classB))).rejects.toThrow('current class');
    await expect(service.preview(manager, changed(PromotionAction.GRADUATE, classB))).rejects.toThrow('cannot have a target');
    state.classes.find((row: any) => row.id === classB).schoolId = randomUUID();
    await expect(service.preview(manager, plan)).rejects.toThrow('same campus');
  });

  it('validates target stream ownership and final cohort capacity', async () => {
    plan.decisions[0].streamId = streamA;
    await expect(service.preview(manager, plan)).rejects.toThrow('target class');
    plan.decisions[0].streamId = streamB;
    state.streams[1].capacity = 0;
    await expect(service.preview(manager, plan)).rejects.toThrow('exceeds its capacity');
  });

  it('rolls back every write if the final audit fails', async () => {
    const request = await approved(), before = copy(state);
    db.auditLog.create.mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(service.complete(manager, request)).rejects.toThrow('audit unavailable');
    expect(state).toEqual(before);
  });

  it('reports concurrent database conflicts without silently retrying an approval', async () => {
    const request = await approved();db.$transaction.mockRejectedValueOnce({code: 'P2034'});
    await expect(service.complete(manager, request)).rejects.toThrow('overlapped');
    expect(state.runs).toHaveLength(0);
  });

  it('scopes all saved roster and setup reads to the requested school', async () => {
    await service.preview(manager, plan);
    for (const model of ['academicYear', 'student', 'class', 'stream', 'enrollment', 'term']) {
      expect(db[model].findMany.mock.calls[0][0].where.tenantId).toBe(tenantId);
    }
  });
});
