import { randomUUID } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';

import { ValidationPipe, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';

import { ComplianceController } from './controllers/compliance.controller';
import { GovernmentSchedulerService } from './jobs/government-scheduler.service';
import { GovernmentSyncProcessor } from './jobs/government-sync.processor';
import { auditData } from './services/compliance-audits';
import { bounds, calendar, sha } from './services/compliance-core';
import { buildReport } from './services/compliance-reports';
import { ComplianceService } from './services/compliance.service';
import { csv, xlsx } from './utils/workbook';

// Jest's CommonJS runtime cannot load this dependency's ESM decorator barrel.
// Only the decorator is substituted; scheduling and queue methods run unchanged.
jest.mock('@nestjs/schedule', () => ({ Cron: () => () => undefined }));
jest.mock('@nestjs/bull', () =>
  Object.fromEntries(
    [
      'InjectQueue',
      'Processor',
      'Process',
      'OnQueueActive',
      'OnQueueCompleted',
      'OnQueueFailed',
    ].map((name) => [name, () => () => undefined])
  )
);

// In-memory persistence for fast authenticated HTTP contract tests. A separate
// PostgreSQL suite covers constraints, transactional concurrency and triggers.
function fixture() {
  const tables: Record<string, any[]> = {};
  const matches = (row: any, where: any = {}): boolean =>
    Object.entries(where).every(([key, value]: [string, any]) => {
      if (key === 'OR') return value.some((w: any) => matches(row, w));
      if (key === 'AND') return value.every((w: any) => matches(row, w));
      const actual = row[key];
      if (value instanceof Date) return +new Date(actual) === +value;
      if (value !== null && typeof value === 'object') {
        if ('path' in value)
          return value.path.reduce((a: any, k: string) => a?.[k], actual) === value.equals;
        return Object.entries(value).every(([op, v]: [string, any]) =>
          op === 'in'
            ? v.includes(actual)
            : op === 'notIn'
              ? !v.includes(actual)
              : op === 'not'
                ? actual !== v
                : op === 'gte'
                  ? actual >= v
                  : op === 'gt'
                    ? actual > v
                    : op === 'lte'
                      ? actual <= v
                      : op === 'lt'
                        ? actual < v
                        : matches(actual || {}, { [op]: v })
        );
      }
      return actual === value;
    });
  const db: any = { $executeRaw: jest.fn().mockResolvedValue(1) };
  db.$transaction = async (work: any) => {
    const saved = Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.slice()]));
    try {
      return await work(db);
    } catch (error) {
      Object.assign(tables, saved);
      throw error;
    }
  };
  for (const name of [
    'complianceReport',
    'complianceLedger',
    'complianceExport',
    'complianceChecklist',
    'complianceAlert',
    'dataQualityAudit',
    'student',
    'staff',
    'academicYear',
    'term',
    'schoolEvent',
    'enrollment',
    'grade',
    'invoice',
    'payment',
    'udiseStaffRecord',
    'school',
    'examination',
    'tenant',
    'user',
  ]) {
    tables[name] = [];
    const find = (args: any = {}) => {
      let rows = tables[name].filter((row) => matches(row, args.where));
      for (const order of (Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy])
        .filter(Boolean)
        .reverse()) {
        const [key, direction] = Object.entries(order)[0];
        rows.sort(
          (a, b) =>
            (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (direction === 'desc' ? -1 : 1)
        );
      }
      if (args.take) rows = rows.slice(0, args.take);
      return args.select
        ? rows.map((row) =>
            Object.fromEntries(
              Object.keys(args.select)
                .filter((k) => args.select[k])
                .map((k) => [k, row[k]])
            )
          )
        : rows;
    };
    db[name] = {
      findMany: jest.fn(async (args: any) => find(args)),
      findFirst: jest.fn(async (args: any) => find(args)[0] || null),
      findUnique: jest.fn(async (args: any) => find(args)[0] || null),
      create: jest.fn(async ({ data }: any) => {
        const row = {
          id: randomUUID(),
          createdAt: new Date(),
          ...(name === 'complianceReport'
            ? { metadata: null, status: 'DRAFT' }
            : name === 'complianceChecklist'
              ? { status: 'PENDING' }
              : name === 'complianceAlert'
                ? { status: 'ACTIVE' }
                : {}),
          ...data,
        };
        tables[name].push(row);
        return row;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const i = tables[name].findIndex((row) => matches(row, where));
        if (i < 0) throw new Error('Scoped update found no row');
        tables[name][i] = { ...tables[name][i], ...data };
        return tables[name][i];
      }),
      groupBy: jest.fn(async (args: any) => {
        const rows = find(args),
          groups = new Map<string, number>();
        for (const row of rows)
          groups.set(row.invoiceId, (groups.get(row.invoiceId) || 0) + row.amount);
        return [...groups].map(([invoiceId, amount]) => ({ invoiceId, _sum: { amount } }));
      }),
    };
  }
  const tenantId = 'school-a',
    teacher = {
      id: 'teacher-record',
      tenantId,
      staffNumber: 'T-1',
      firstName: 'Anu',
      lastName: 'Nair',
      gender: 'FEMALE',
      email: 'anu@example.test',
      phone: '9847000000',
      department: 'TEACHING',
      employmentType: 'PERMANENT',
      hireDate: new Date('2020-01-01'),
      terminationDate: null,
      isTeacher: true,
      status: 'ACTIVE',
    };
  tables.staff.push(teacher);
  tables.udiseStaffRecord.push({
    id: 'code',
    tenantId,
    staffId: teacher.id,
    teacherCode: 'TEACHER123',
  });
  tables.term.push({
    id: 'term-a',
    tenantId,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    name: 'Term 1',
  });
  tables.user.push(
    ...[
      ['maker', 'SCHOOL_ADMIN'],
      ['reviewer', 'PRINCIPAL'],
      ['parent', 'PARENT'],
      ['outsider', 'PRINCIPAL'],
    ].map(([id, role]) => ({
      id,
      role,
      isActive: true,
      tokenVersion: 0,
      tenantId: id === 'outsider' ? 'school-b' : tenantId,
      tenant: { status: 'ACTIVE' },
      email: id + '@example.test',
      firstName: id,
      lastName: 'Test',
    }))
  );
  return { db, tables, service: new ComplianceService(db), tenantId };
}
const dto = {
  reportType: 'TEACHER_DATA_REPORT' as const,
  reportPeriod: '2026 staff',
  reportYear: 2026,
};

describe('Compliance calculations, files and automation', () => {
  it('rejects reversed, invalid calendar dates, mismatched years and unsupported ranges', () => {
    for (const data of [
      { startDate: '2026-11-18', endDate: '2026-11-01' },
      { startDate: '2026-02-30', endDate: '2026-03-01' },
      { startDate: '2025-01-01', endDate: '2025-01-02' },
      { reportMonth: 13 },
      { reportMonth: 1, reportQuarter: 1 },
    ])
      expect(() => bounds({ reportYear: 2026, ...data })).toThrow();
    expect(bounds({ reportYear: 2026, reportMonth: 2 }).end.toISOString()).toBe(
      '2026-02-28T00:00:00.000Z'
    );
  });
  it('counts inclusive saved term weekdays and excludes holidays', async () => {
    const { db, tables } = fixture();
    tables.schoolEvent.push({
      tenantId: 'school-a',
      isHoliday: true,
      startDate: new Date('2026-11-17'),
      endDate: new Date('2026-11-17'),
    });
    const result = await calendar(db, 'school-a', new Date('2026-11-16'), new Date('2026-11-18'));
    expect(result.dates).toEqual(['2026-11-16', '2026-11-18']);
  });
  it('filters invoice periods, cancelled invoices, receipt status and payment cutoff', async () => {
    const { db, tables } = fixture();
    tables.invoice.push(
      ...[
        ['issued', 1000, 'PENDING', '2026-01-02'],
        ['cancelled', 5000, 'CANCELLED', '2026-01-02'],
        ['older', 3000, 'PENDING', '2025-01-02'],
      ].map(([id, totalAmount, status, date]) => ({
        id,
        tenantId: 'school-a',
        invoiceNumber: id,
        totalAmount,
        status,
        createdAt: new Date(date as string),
      }))
    );
    for (const [id, invoiceId, amount, status, date] of [
      ['p1', 'issued', 200, 'COMPLETED', '2026-01-31T23:59:00Z'],
      ['p2', 'issued', 800, 'COMPLETED', '2026-02-01'],
      ['p3', 'cancelled', 500, 'COMPLETED', '2026-01-12'],
      ['p4', 'older', 100, 'COMPLETED', '2026-01-12'],
      ['p5', 'issued', 900, 'PENDING', '2026-01-12'],
    ])
      tables.payment.push({
        id,
        tenantId: 'school-a',
        invoiceId,
        amount,
        status,
        paymentDate: new Date(date as string),
        invoice: tables.invoice.find((i) => i.id === invoiceId),
      });
    const result = await buildReport(db, 'school-a', {
      reportType: 'FINANCIAL_SUMMARY',
      reportPeriod: 'January',
      reportYear: 2026,
      reportMonth: 1,
    });
    expect(result.summary).toEqual({
      totalInvoices: 1,
      totalExpectedRevenue: 1000,
      totalCollectedRevenue: 300,
      totalOutstanding: 800,
    });
    expect(result.payments.map((p: any) => p.id)).toEqual(['p1', 'p4']);
  });
  it('uses historical enrollment classes rather than current student classes', async () => {
    const { db, tables } = fixture();
    tables.academicYear.push({
      id: '2025',
      tenantId: 'school-a',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
    });
    const student = {
      id: 's',
      tenantId: 'school-a',
      deletedAt: null,
      admissionNumber: 'ADM-1',
      firstName: 'Anu',
      lastName: 'Nair',
      gender: 'FEMALE',
      dateOfBirth: new Date('2015-01-01'),
      guardianLinks: [],
      currentClassId: 'new-class',
    };
    tables.enrollment.push({
      id: 'old',
      tenantId: 'school-a',
      studentId: 's',
      academicYearId: '2025',
      enrollmentDate: new Date('2025-01-01'),
      student,
      class: { name: 'Class 4' },
    });
    const result = await buildReport(db, 'school-a', {
      reportType: 'ENROLLMENT_STATISTICS',
      reportPeriod: '2025',
      reportYear: 2025,
    });
    expect(result.rows[0].className).toBe('Class 4');
    expect(result.summary.totalStudents).toBe(1);
  });
  it('reports zero for an empty audit instead of fixed accuracy scores', async () => {
    const { db, tables } = fixture();
    tables.student = [];
    const result = await auditData(db, 'school-a', 'STUDENT_DATA');
    expect(result.overallScore).toBe(0);
    expect(result.accuracy).toBe(0);
    expect(result.issues[0].field).toBe('records');
  });
  it('escapes CSV formulas, newlines, quotes and Unicode', () => {
    const text = csv([
      ['name', 'value'],
      ['=HYPERLINK("bad")', 'മലയാളം\n"quoted"'],
      [' +SUM(A1)', 10],
    ]).toString();
    expect(text).toContain("'=HYPERLINK");
    expect(text).toContain('മലയാളം\n""quoted""');
    expect(text).toContain("' +SUM");
  });
  it('creates a real OOXML ZIP with text cells and no executable formulas', () => {
    const bytes = xlsx([
      ['name', 'score'],
      ['മലയാളം =SUM(A1)', 0],
    ]);
    expect(bytes.readUInt32LE(0)).toBe(0x04034b50);
    const files: Record<string, string> = {};
    let offset = 0;
    while (bytes.readUInt32LE(offset) === 0x04034b50) {
      const size = bytes.readUInt32LE(offset + 18),
        nameLength = bytes.readUInt16LE(offset + 26),
        extra = bytes.readUInt16LE(offset + 28),
        start = offset + 30 + nameLength + extra;
      files[bytes.subarray(offset + 30, offset + 30 + nameLength).toString()] = inflateRawSync(
        bytes.subarray(start, start + size)
      ).toString();
      offset = start + size;
    }
    expect(files['[Content_Types].xml']).toContain('spreadsheetml');
    expect(files['xl/worksheets/sheet1.xml']).toContain('മലയാളം');
    expect(files['xl/worksheets/sheet1.xml']).not.toContain('<f>');
    expect(files['xl/worksheets/sheet1.xml']).toContain('<v>0</v>');
  });
  it('wires deadline jobs and rejects missing attendance dates', async () => {
    const compliance: any = { checkDeadlines: jest.fn().mockResolvedValue({ created: 1 }) };
    const worker = new GovernmentSyncProcessor({} as any, {} as any, compliance);
    expect(
      await worker.processComplianceDeadlines({ data: { tenantId: 'school-a' } } as any)
    ).toEqual({ created: 1 });
    await expect(
      worker.processGenerateComplianceReport({ data: { reportType: 'ATTENDANCE_SUMMARY' } } as any)
    ).rejects.toMatchObject({ status: 400 });
  });
  it('assigns stable queue IDs and the complete last day of the previous month', async () => {
    const queue: any = { add: jest.fn() },
      db: any = { tenant: { findMany: jest.fn().mockResolvedValue([{ id: 'school-a' }]) } };
    const scheduler = new GovernmentSchedulerService(queue, db);
    (scheduler as any).today = () => '2026-03-01';
    await scheduler.generateMonthlyReports();
    const calls = queue.add.mock.calls;
    expect(calls).toHaveLength(3);
    expect(calls[1][1].startDate).toBe('2026-02-01T00:00:00.000Z');
    expect(calls[1][1].endDate).toBe('2026-02-28T00:00:00.000Z');
    expect(new Set(calls.map((c: any) => c[2].jobId)).size).toBe(3);
    await scheduler.generateMonthlyReports();
    expect(queue.add.mock.calls[3][2].jobId).toBe(calls[0][2].jobId);
  });
});

describe('Compliance authenticated HTTP workflow (isolated persistence)', () => {
  let app: INestApplication, f: ReturnType<typeof fixture>;
  const secret = 'compliance-contract-tests-only',
    jwt = new JwtService({ secret });
  const token = (id: string) => jwt.sign({ sub: id, ver: 0, type: 'access' });
  const call = (method: 'get' | 'post', path: string, id = 'maker', body?: any): any => {
    const req = request(app.getHttpServer())[method]('/government/compliance' + path);
    if (id) req.set('Authorization', 'Bearer ' + token(id));
    return body ? req.send(body) : req;
  };
  beforeAll(async () => {
    f = fixture();
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [ComplianceController],
      providers: [
        { provide: ComplianceService, useValue: f.service },
        { provide: PrismaService, useValue: f.db },
        { provide: ConfigService, useValue: new ConfigService({ JWT_SECRET: secret }) },
        TenantService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
      ],
    }).compile();
    app = module.createNestApplication();
    const tenants = module.get(TenantService);
    app.use((_req: any, _res: any, next: any) => tenants.run(next));
    app.useGlobalGuards(module.get(JwtAuthGuard), module.get(RolesGuard));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      })
    );
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
  });
  it('requires a valid session and rejects parents', async () => {
    await call('get', '/reports', '').expect(401);
    await call('get', '/reports', 'parent').expect(403);
  });
  it('rejects unsupported types, extra fields and reversed date ranges with 400', async () => {
    await call('post', '/reports/generate', 'maker', { ...dto, reportType: 'SAFETY_AUDIT' }).expect(
      400
    );
    await call('post', '/reports/generate', 'maker', { ...dto, tenantId: 'school-b' }).expect(400);
    await call('post', '/reports/generate', 'maker', {
      ...dto,
      startDate: '2026-11-18',
      endDate: '2026-11-01',
    }).expect(400);
  });
  it('completes generation → independent approval → download → receipt → rejection → replacement', async () => {
    const created = (await call('post', '/reports/generate', 'maker', dto).expect(201)).body,
      id = created.id;
    expect(created.status).toBe('DRAFT');
    expect(created.reportData.summary.totalTeachers).toBe(1);
    await call('get', '/reports/' + id, 'outsider').expect(404);
    await call('post', '/reports/action', 'maker', { reportId: id, action: 'APPROVE' }).expect(409);
    await call('post', '/reports/action', 'maker', {
      reportId: id,
      action: 'REQUEST_REVIEW',
    }).expect(201);
    await call('post', '/reports/action', 'maker', { reportId: id, action: 'APPROVE' }).expect(403);
    await call('post', '/reports/action', 'reviewer', { reportId: id, action: 'APPROVE' }).expect(
      201
    );
    const file = (
      await call('post', '/portal-export', 'maker', {
        reportId: id,
        templateId: 'TEACHER_MANDATORY_DISCLOSURE',
        format: 'xlsx',
      }).expect(201)
    ).body;
    expect(file.validation.complianceVerified).toBe(false);
    expect(file.validation.ready).toBe(true);
    await call('get', '/downloads/' + file.id, 'outsider').expect(404);
    const downloaded = await call('get', '/downloads/' + file.id)
      .expect(200)
      .expect('Content-Type', /spreadsheetml/);
    expect(downloaded.headers['content-disposition']).toContain('.xlsx');
    const receipt = {
      reportId: id,
      exportId: file.id,
      portal: 'School portal',
      receiptReference: 'PORTAL-1',
      submittedAt: new Date().toISOString(),
      portalFormatReviewed: true,
    };
    await call('post', '/reports/manual-submission', 'maker', {
      ...receipt,
      portalFormatReviewed: false,
    }).expect(400);
    await call('post', '/reports/manual-submission', 'outsider', receipt).expect(404);
    await call('post', '/reports/manual-submission', 'maker', receipt).expect(201);
    await call('post', '/reports/manual-submission', 'maker', receipt).expect(201);
    expect(
      f.tables.complianceLedger.filter(
        (e) => e.action === 'MANUALLY_SUBMITTED' && e.entityId === id
      )
    ).toHaveLength(1);
    await call('post', '/reports/outcome', 'maker', {
      reportId: id,
      status: 'REJECTED',
      notes: 'Portal needs corrected teacher information',
    }).expect(201);
    await call('post', '/reports/action', 'maker', { reportId: id, action: 'REOPEN' }).expect(409);
    const replacement = (
      await call('post', '/reports/generate', 'maker', { ...dto, replacesReportId: id }).expect(201)
    ).body;
    expect(replacement.id).not.toBe(id);
    expect(replacement.metadata.replacesReportId).toBe(id);
    const reviewed = (await call('get', '/reports/' + id).expect(200)).body;
    expect(reviewed.status).toBe('REJECTED');
    expect(reviewed.metadata.manualSubmission.receiptReference).toBe('PORTAL-1');
    expect(reviewed.history.some((e: any) => e.action === 'PORTAL_REJECTED')).toBe(true);
    const verified = (await call('post', '/audit-trail/verify', 'maker', {}).expect(201)).body;
    expect(verified.isValid).toBe(true);
    expect(verified.totalBlocksVerified).toBeGreaterThan(5);
  });
  it('blocks invalid-template exports and unsupported formats', async () => {
    const id = f.tables.complianceReport[0].id;
    await call('post', '/portal-export', 'maker', {
      reportId: id,
      templateId: 'UDISE_PLUS_SDMIS',
      format: 'csv',
    }).expect(400);
    await call('post', '/portal-export', 'maker', {
      reportId: id,
      templateId: 'SCHOOL_REPORT',
      format: 'exe',
    }).expect(400);
  });
  it('saves checklists, emits deadline alerts once and retains acknowledged alerts', async () => {
    const checklist = (
      await call('post', '/checklists', 'maker', {
        title: 'Annual return',
        requiredBy: 'School board',
        complianceArea: 'BOARD_COMPLIANCE',
        frequency: 'ANNUAL',
        dueDate: '2020-01-01',
      }).expect(201)
    ).body;
    await call('get', '/checklists/' + checklist.id, 'outsider').expect(404);
    await call('post', '/deadlines/check', 'maker', {}).expect(201);
    await call('post', '/deadlines/check', 'maker', {}).expect(201);
    const alerts = (await call('get', '/alerts').expect(200)).body;
    expect(alerts.filter((a: any) => a.relatedEntityId === checklist.id)).toHaveLength(1);
    const alertId = alerts.find((a: any) => a.relatedEntityId === checklist.id).id;
    await call('post', '/alerts/acknowledge', 'outsider', { alertId }).expect(404);
    await call('post', '/alerts/acknowledge', 'maker', { alertId }).expect(201);
    expect(
      (await call('get', '/alerts').expect(200)).body.find((a: any) => a.id === alertId).status
    ).toBe('ACKNOWLEDGED');
    await call('post', '/alerts/resolve', 'maker', {
      alertId,
      resolutionNotes: 'Completed reviewed return',
    }).expect(201);
    await call('post', '/checklists/complete', 'outsider', { checklistId: checklist.id }).expect(
      404
    );
    await call('post', '/checklists/complete', 'maker', {
      checklistId: checklist.id,
      evidence: { reference: 'DOC-1' },
      notes: 'Reviewed',
    }).expect(201);
  });
  it('persists real audits and exposes scoped history/details/rechecks', async () => {
    const audit = (
      await call('post', '/audits/run', 'maker', { auditType: 'STAFF_DATA' }).expect(201)
    ).body;
    expect(audit.overallScore).toBe(100);
    await call('get', '/audits/' + audit.id, 'outsider').expect(404);
    expect(
      (await call('get', '/audits').expect(200)).body.some((a: any) => a.id === audit.id)
    ).toBe(true);
    await call('post', '/audits/' + audit.id + '/recheck', 'maker', {}).expect(201);
  });
  it('never pretends to submit directly', async () => {
    await call('post', '/reports/submit', 'maker', {
      reportId: f.tables.complianceReport[0].id,
    }).expect(501);
  });
  it('detects a modified hash-chain payload', async () => {
    const event = f.tables.complianceLedger[0],
      original = event.payload;
    event.payload = { changed: true };
    expect((await call('post', '/audit-trail/verify', 'maker', {}).expect(201)).body.isValid).toBe(
      false
    );
    event.payload = original;
  });
  it('detects a changed saved export', async () => {
    const file = f.tables.complianceExport[0],
      original = file.content;
    file.content = Buffer.from('tampered');
    await call('get', '/downloads/' + file.id).expect(409);
    expect((await call('post', '/audit-trail/verify', 'maker', {}).expect(201)).body.isValid).toBe(
      false
    );
    file.content = original;
    expect(sha(original)).toBe(file.contentHash);
  });
});
