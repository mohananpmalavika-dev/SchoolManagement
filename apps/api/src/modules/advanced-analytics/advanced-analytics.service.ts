import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AdvancedAnalyticsOptions, SchoolBenchmarkReport } from '@krypton/types';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';
import { AnalyticsFacts, buildExecutiveReport, DAY, isoDay, metrics, prepareFacts } from './analytics-engine';
import { AnalyticsPeriodDto, AnalyticsQueryDto, SchoolBenchmarkQueryDto } from './dto/analytics-query.dto';

const leaders = ['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN'];
export function analyticsPeriod(query: AnalyticsPeriodDto, now: Date) {
  const today = new Date(isoDay(now)), to = query.to ?? isoDay(today), from = query.from ?? isoDay(new Date(today.getTime() - 89 * DAY));
  const start = new Date(`${from}T00:00:00.000Z`), end = new Date(`${to}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || isoDay(start) !== from || isoDay(end) !== to) throw new BadRequestException('Use valid calendar dates (YYYY-MM-DD)');
  const days = (end.getTime() - start.getTime()) / DAY + 1;
  if (days < 1 || days > 366 || end > today) throw new BadRequestException('Choose a period of 1–366 days ending on or before today');
  const until = new Date(end.getTime() + DAY), previousFrom = new Date(start.getTime() - days * DAY);
  return { from: start, until, previousFrom };
}

async function pages<T extends { id: string }>(fetch: (cursor?: string) => Promise<T[]>): Promise<T[]> {
  const rows: T[] = []; let cursor: string | undefined;
  while (true) {
    const batch = await fetch(cursor); rows.push(...batch);
    if (batch.length < 1000) break;
    const next = batch[batch.length - 1].id;
    if (next === cursor) throw new BadRequestException('Analytics pagination could not advance');
    cursor = next;
  }
  return rows;
}
@Injectable()
export class AdvancedAnalyticsService {
  constructor(private readonly prisma: PrismaService, private readonly tenants: TenantService) {}
  private tenant(user: CurrentUserData) {
    const id = this.tenants.requireTenantContext();
    if (!leaders.includes(user.role) || user.tenantId !== id) throw new ForbiddenException('School leadership analytics access required');
    return id;
  }
  async options(user: CurrentUserData): Promise<AdvancedAnalyticsOptions> {
    const tenantId = this.tenant(user), now = new Date(), range = analyticsPeriod({}, now);
    const [classes, subjects, terms] = await Promise.all([
      this.prisma.class.findMany({ where: { tenantId }, select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.subject.findMany({ where: { tenantId }, select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.term.findMany({ where: { tenantId }, select: { id: true, name: true, startDate: true, endDate: true, isCurrent: true }, orderBy: { startDate: 'desc' }, take: 30 }),
    ]);
    return { classes, subjects, terms: terms.map(t => ({ ...t, startDate: isoDay(t.startDate), endDate: isoDay(t.endDate) })), defaults: { from: isoDay(range.from), to: isoDay(new Date(range.until.getTime() - DAY)) } };
  }
  private async facts(tenantId: string, query: AnalyticsQueryDto, range: ReturnType<typeof analyticsPeriod>, now: Date): Promise<AnalyticsFacts> {
    if (query.classId && !await this.prisma.class.findFirst({ where: { id: query.classId, tenantId }, select: { id: true } })) throw new NotFoundException('Class not found');
    if (query.subjectId && !await this.prisma.subject.findFirst({ where: { id: query.subjectId, tenantId }, select: { id: true } })) throw new NotFoundException('Subject not found');
    const cohort = { tenantId, status: 'ACTIVE' as const, deletedAt: null, ...(query.classId ? { currentClassId: query.classId } : {}) };
    const dated = { gte: range.previousFrom, lt: range.until };
    const pageArgs = (cursor?: string) => ({ orderBy: { id: 'asc' as const }, take: 1000, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
    const [students, classes, subjects, grades, attendance, invoices, payments] = await Promise.all([
      pages(cursor => this.prisma.student.findMany({ where: cohort, select: { id: true, currentClassId: true }, ...pageArgs(cursor) })),
      this.prisma.class.findMany({ where: { tenantId, ...(query.classId ? { id: query.classId } : {}) }, select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } }),
      this.prisma.subject.findMany({ where: { tenantId, ...(query.subjectId ? { id: query.subjectId } : {}) }, select: { id: true, name: true }, orderBy: { sortOrder: 'asc' } }),
      pages(cursor => this.prisma.grade.findMany({ where: { tenantId, student: cohort, createdAt: { lte: now }, ...(query.subjectId ? { subjectId: query.subjectId } : {}),
        examination: { tenantId, OR: [{ endDate: dated }, { endDate: null, startDate: dated }, { endDate: null, startDate: null, createdAt: dated }] } },
        select: { id: true, studentId: true, subjectId: true, score: true, marks: true, totalMarks: true,
          examination: { select: { startDate: true, endDate: true, createdAt: true, subjects: { select: { subjectId: true, passMark: true, totalMarks: true } } } } }, ...pageArgs(cursor) })),
      pages(cursor => this.prisma.attendanceRecord.findMany({ where: { tenantId, student: cohort, date: dated }, select: { id: true, studentId: true, date: true, status: true }, ...pageArgs(cursor) })),
      pages(cursor => this.prisma.invoice.findMany({ where: { tenantId, student: cohort, createdAt: { lte: now }, status: { notIn: ['DRAFT', 'CANCELLED'] } },
        select: { id: true, studentId: true, totalAmount: true, paidAmount: true, balanceAmount: true, dueDate: true, createdAt: true, status: true }, ...pageArgs(cursor) })),
      pages(cursor => this.prisma.payment.findMany({ where: { tenantId, status: 'COMPLETED', paymentDate: dated, invoice: { tenantId, student: cohort } },
        select: { id: true, amount: true, paymentDate: true, status: true, invoice: { select: { studentId: true } } }, ...pageArgs(cursor) })),
    ]);
    return { students, classes, subjects, grades, attendance, invoices, payments };
  }
  async report(user: CurrentUserData, query: AnalyticsQueryDto) {
    const tenantId = this.tenant(user), now = new Date(), range = analyticsPeriod(query, now);
    const tenant = await this.prisma.tenant.findFirst({ where: { id: tenantId }, select: { name: true, currency: true } });
    if (!tenant) throw new NotFoundException('School not found');
    const facts = await this.facts(tenantId, query, range, now);
    return buildExecutiveReport(facts, range.from, range.until, now, tenant.currency, tenant.name, { classId: query.classId ?? null, subjectId: query.subjectId ?? null });
  }
  async benchmarks(user: CurrentUserData, query: SchoolBenchmarkQueryDto): Promise<SchoolBenchmarkReport> {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Platform administrator access required');
    const now = new Date(), range = analyticsPeriod(query, now), page = query.page ?? 1, pageSize = 10;
    return this.prisma.executeWithoutTenantFilter(async () => {
      const [tenants, total] = await Promise.all([
        this.prisma.tenant.findMany({ select: { id: true, name: true, currency: true, status: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
        this.prisma.tenant.count(),
      ]);
      const schools = [];
      // Scope every data query explicitly even inside the authorized platform operation.
      for (const tenant of tenants) {
        const data = await this.facts(tenant.id, {}, range, now);
        schools.push({ ...tenant, ...metrics(prepareFacts(data, now), range.from, range.until, now) });
      }
      return { generatedAt: now.toISOString(), period: { from: isoDay(range.from), to: isoDay(new Date(range.until.getTime() - DAY)) }, schools, page, pageSize, total,
        methodology: ['Platform administrators can compare aggregate tenant/school communities. No student identity, raw grades or payment records are returned.',
          'Comparisons use the same calendar window and current active cohorts. Assessment scores and pass rates depend on school assessment difficulty and pass settings; they are not school-quality rankings.',
          'Attendance uses recorded student-days; missing/leave/sickness records are excluded. Review record coverage and sample counts.',
          'Keep money comparisons within the same currency. Outstanding/overdue and invoice settlement are current snapshots; receipts and billed are period totals.'] };
    });
  }
}
