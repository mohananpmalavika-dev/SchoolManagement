import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdvancedAnalyticsController } from './advanced-analytics.controller';
import { AdvancedAnalyticsService, analyticsPeriod } from './advanced-analytics.service';
import { AnalyticsFacts, buildExecutiveReport } from './analytics-engine';
import { AnalyticsQueryDto, SchoolBenchmarkQueryDto } from './dto/analytics-query.dto';

const date = (d: string) => new Date(`${d}T00:00:00.000Z`);
const now = new Date('2026-10-11T12:00:00Z');
const from = date('2026-10-01'), until = date('2026-10-11');
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
function fixture(): AnalyticsFacts {
  return { students: [{ id: 'a', currentClassId: 'c' }, { id: 'b', currentClassId: 'c' }, { id: 'z', currentClassId: null }], classes: [{ id: 'c', name: 'Class 5' }], subjects: [{ id: 'math', name: 'Mathematics' }],
    grades: [0, 60].map((score, i) => ({ studentId: i ? 'b' : 'a', subjectId: 'math', score, marks: null, totalMarks: 100,
      examination: { startDate: date('2026-10-05'), endDate: null, createdAt: date('2026-10-01'), subjects: [{ subjectId: 'math', totalMarks: 100, passMark: 50 }] } })),
    attendance: [{ studentId: 'a', date: date('2026-10-05'), status: 'PRESENT' }, { studentId: 'a', date: date('2026-10-05'), status: 'ABSENT' }, { studentId: 'b', date: date('2026-10-05'), status: 'LATE' }, { studentId: 'z', date: date('2026-10-05'), status: 'SICK_LEAVE' }],
    invoices: [{ studentId: 'a', totalAmount: 10000, paidAmount: 4000, balanceAmount: 6000, dueDate: date('2026-10-06'), createdAt: date('2026-10-02'), status: 'PARTIALLY_PAID' },
      { studentId: 'b', totalAmount: 5000, paidAmount: 0, balanceAmount: 5000, dueDate: date('2026-11-01'), createdAt: date('2026-09-01'), status: 'PENDING' }],
    payments: [{ amount: 4000, paymentDate: date('2026-10-04'), status: 'COMPLETED', invoice: { studentId: 'a' } }],
  };
}
const report = (facts = fixture()) => buildExecutiveReport(facts, from, until, now, 'INR', 'Test school', { classId: null, subjectId: null });
describe('executive analytics calculations', () => {
  it('counts zero marks, assessment pass thresholds and current cohort coverage', () => {
    const m = report().current;
    expect(m).toMatchObject({ students: 3, assessedStudents: 2, assessmentCount: 2, averageScore: 30, passRate: 50, attendanceStudents: 2 });
  });
  it('averages periods within a student-day and excludes missing, leave and sickness records', () => {
    expect(report().current).toMatchObject({ attendanceDays: 2, attendanceRate: 75 });
    const facts = fixture(); facts.attendance = []; expect(report(facts).current.attendanceRate).toBeNull();
  });
  it('leaves unrecorded assessments unscored rather than assigning failure', () => {
    const facts = fixture(); facts.grades = [];
    expect(report(facts).current).toMatchObject({ averageScore: null, passRate: null, assessedStudents: 0 });
    expect(report(facts).insights.some(i => i.title === 'Incomplete learning evidence')).toBe(true);
  });
  it('excludes invalid, future and out-of-cohort results', () => {
    const facts = fixture(), template = facts.grades[0];
    facts.grades.push({ ...template, totalMarks: 0 }, { ...template, marks: -1 }, { ...template, marks: 101 }, { ...template, studentId: 'foreign' },
      { ...template, examination: { ...template.examination, endDate: date('2026-11-01') } });
    expect(report(facts).current.assessmentCount).toBe(2);
  });
  it('uses marks alias before score and supports different total marks', () => {
    const facts = fixture(); facts.grades = [{ ...facts.grades[0], marks: 100, score: 0, totalMarks: 200 }];
    expect(report(facts).current).toMatchObject({ averageScore: 50, passRate: 100 });
  });
  it('falls back to 40 percent when no pass threshold is configured', () => {
    const facts = fixture(); facts.grades[0].examination.subjects[0].passMark = null;
    expect(report(facts).current.passRate).toBe(50);
  });
  it('separates dated receipts and billing from current outstanding balances', () => {
    expect(report().current).toMatchObject({ billed: 10000, receipts: 4000, invoiceSettlementRate: 40, outstanding: 11000, overdue: 6000 });
    expect(report().previous.receipts).toBe(0); expect(report().previous.outstanding).toBe(11000);
  });
  it('excludes draft/cancelled invoices, non-completed payments and foreign cohort records', () => {
    const facts = fixture(); facts.invoices.push({ ...facts.invoices[0], status: 'DRAFT' }, { ...facts.invoices[0], status: 'CANCELLED' }, { ...facts.invoices[0], studentId: 'foreign' });
    facts.payments.push({ ...facts.payments[0], status: 'REFUNDED' }, { ...facts.payments[0], status: 'FAILED' }, { ...facts.payments[0], invoice: { studentId: 'foreign' } });
    expect(report(facts).current).toMatchObject({ receipts: 4000, outstanding: 11000, billed: 10000 });
  });
  it('compares equal calendar periods and keeps empty daily rates null', () => {
    const r = report(); expect(r.period).toEqual({ from: '2026-10-01', to: '2026-10-10', previousFrom: '2026-09-21', previousTo: '2026-09-30' });
    expect(r.trend).toHaveLength(10); expect(r.trend[0]).toMatchObject({ averageScore: null, attendanceRate: null, receipts: 0 });
    expect(r.trend[4]).toMatchObject({ averageScore: 30, attendanceRate: 75, assessmentCount: 2, attendanceDays: 2 });
  });
  it('groups classes and subjects without leaking unassigned students into a class', () => {
    const r = report(); expect(r.classes[0]).toMatchObject({ students: 2, assessedStudents: 2, averageScore: 30 });
    expect(r.classes[1]).toMatchObject({ id: 'unassigned', students: 1, averageScore: null });
    expect(r.subjects[0]).toMatchObject({ assessedStudents: 2, assessmentCount: 2, averageScore: 30, receipts: 0 });
  });
  it('produces source-linked declining learning and attendance insights', () => {
    const facts = fixture(); facts.grades.push({ ...facts.grades[0], score: 90, examination: { ...facts.grades[0].examination, endDate: date('2026-09-25') } });
    facts.attendance.push({ studentId: 'a', date: date('2026-09-25'), status: 'PRESENT' });
    const insights = report(facts).insights;
    expect(insights).toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Assessment scores declined', href: '/school/grades' }), expect.objectContaining({ title: 'Attendance trend fell', href: '/school/attendance' })]));
  });
});

function setup() {
  const empty = () => ({ findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue({ id: uuid(3) }) });
  const prisma = { student: empty(), class: empty(), subject: empty(), term: empty(), grade: empty(), attendanceRecord: empty(), invoice: empty(), payment: empty(),
    tenant: { findFirst: jest.fn().mockResolvedValue({ name: 'School A', currency: 'INR' }), findMany: jest.fn().mockResolvedValue([{ id: uuid(2), name: 'School A', currency: 'INR', status: 'ACTIVE' }]), count: jest.fn().mockResolvedValue(1) },
    executeWithoutTenantFilter: jest.fn().mockImplementation(async operation => operation()) };
  const service = new AdvancedAnalyticsService(prisma as any, { requireTenantContext: () => uuid(2) } as any);
  const user = { userId: uuid(1), tenantId: uuid(2), email: 'principal@example.test', role: 'PRINCIPAL' };
  return { prisma, service, user };
}
describe('analytics scope, pagination and request validation', () => {
  it('rejects non-leaders and a mismatched tenant before data access', async () => {
    const { service, prisma, user } = setup();
    await expect(service.report({ ...user, role: 'TEACHER' }, {})).rejects.toThrow('leadership');
    await expect(service.report({ ...user, tenantId: uuid(99) }, {})).rejects.toThrow('leadership');
    expect(prisma.tenant.findFirst).not.toHaveBeenCalled();
  });
  it.each(['classId', 'subjectId'])('rejects a foreign %s filter before loading facts', async field => {
    const { service, prisma, user } = setup(); (field === 'classId' ? prisma.class : prisma.subject).findFirst.mockResolvedValue(null as any);
    await expect(service.report(user, { [field]: uuid(99) })).rejects.toThrow('not found'); expect(prisma.student.findMany).not.toHaveBeenCalled();
  });
  it('scopes every root and nested student relation and keeps subject filtering academic-only', async () => {
    const { service, prisma, user } = setup(); await service.report(user, { from: '2026-10-01', to: '2026-10-10', classId: uuid(3), subjectId: uuid(4) });
    for (const model of ['student', 'grade', 'attendanceRecord', 'invoice', 'payment'] as const) expect(prisma[model].findMany.mock.calls[0][0].where.tenantId).toBe(uuid(2));
    const grade = prisma.grade.findMany.mock.calls[0][0] as any; expect(grade.where).toMatchObject({ subjectId: uuid(4), student: { tenantId: uuid(2), currentClassId: uuid(3), status: 'ACTIVE', deletedAt: null }, examination: { tenantId: uuid(2) } });
    const payment = prisma.payment.findMany.mock.calls[0][0] as any; expect(payment.where.invoice.tenantId).toBe(uuid(2)); expect(payment.where.invoice.student.currentClassId).toBe(uuid(3));
    expect(prisma.attendanceRecord.findMany.mock.calls[0][0].where.subjectId).toBeUndefined();
  });
  it('continues beyond a thousand students without silent truncation', async () => {
    const { service, prisma, user } = setup();
    prisma.student.findMany.mockResolvedValueOnce(Array.from({ length: 1000 }, (_, i) => ({ id: uuid(i + 100), currentClassId: null }))).mockResolvedValueOnce([{ id: uuid(2000), currentClassId: null }]);
    const r = await service.report(user, {}); expect(r.current.students).toBe(1001);
    expect(prisma.student.findMany.mock.calls[1][0]).toMatchObject({ skip: 1, cursor: { id: uuid(1099) } });
  });
  it('restricts cross-school aggregation to platform administrators before clearing tenant context', async () => {
    const { service, prisma, user } = setup(); await expect(service.benchmarks(user, { page: 1 })).rejects.toThrow('Platform administrator');
    expect(prisma.executeWithoutTenantFilter).not.toHaveBeenCalled();
  });
  it('returns paged aggregate school metrics without student identities or raw records', async () => {
    const { service, prisma, user } = setup(); const r = await service.benchmarks({ ...user, role: 'SUPER_ADMIN' }, { page: 2 });
    expect(prisma.tenant.findMany.mock.calls[0][0]).toMatchObject({ skip: 10, take: 10 });
    expect(r.schools[0]).toMatchObject({ name: 'School A', currency: 'INR', averageScore: null });
    expect(r.schools[0]).not.toHaveProperty('grades'); expect(r.schools[0]).not.toHaveProperty('firstName');
    expect(prisma.student.findMany.mock.calls[0][0].where.tenantId).toBe(uuid(2));
  });
  it.each([{ from: '2026-02-30', to: '2026-03-01' }, { from: '2026-10-10', to: '2026-10-01' }, { from: '2025-01-01', to: '2026-10-01' }, { from: '2026-10-01', to: '2026-10-12' }])('rejects invalid, reversed, oversized and future calendar ranges: %j', query => expect(() => analyticsPeriod(query, now)).toThrow());
  it('accepts a leap-day range and a single-day range', () => {
    expect(analyticsPeriod({ from: '2024-02-29', to: '2024-02-29' }, now).until).toEqual(date('2024-03-01'));
    expect(analyticsPeriod({ from: '2026-10-11', to: '2026-10-11' }, now).previousFrom).toEqual(date('2026-10-10'));
  });
  it('rejects malformed filter IDs and invalid platform pagination', async () => {
    expect((await validate(plainToInstance(AnalyticsQueryDto, { classId: 'foreign', from: 'tomorrow' }))).length).toBeGreaterThan(0);
    expect((await validate(plainToInstance(SchoolBenchmarkQueryDto, { page: -1 }))).length).toBeGreaterThan(0);
    expect(await validate(plainToInstance(SchoolBenchmarkQueryDto, { page: '2' }))).toHaveLength(0);
  });
  it.each(['TEACHER', 'PARENT', 'STUDENT', 'ACCOUNTANT', 'SUPER_ADMIN'])('enforces executive endpoint role checks for %s', role => {
    const ctx = { getHandler: () => AdvancedAnalyticsController.prototype.report, getClass: () => AdvancedAnalyticsController, switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }) } as unknown as ExecutionContext;
    expect(() => new RolesGuard(new Reflector()).canActivate(ctx)).toThrow('Insufficient permissions');
  });
  it('enforces platform-only school benchmarking at the controller', () => {
    const ctx = { getHandler: () => AdvancedAnalyticsController.prototype.schools, getClass: () => AdvancedAnalyticsController, switchToHttp: () => ({ getRequest: () => ({ user: { role: 'PRINCIPAL' } }) }) } as unknown as ExecutionContext;
    expect(() => new RolesGuard(new Reflector()).canActivate(ctx)).toThrow('Insufficient permissions');
  });
});
