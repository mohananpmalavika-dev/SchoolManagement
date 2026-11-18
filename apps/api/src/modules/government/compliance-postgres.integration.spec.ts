import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

import { INestApplication, ValidationPipe, Controller, Get, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';

import { ComplianceController } from './controllers/compliance.controller';
import { ComplianceService } from './services/compliance.service';


@Controller()
class ComplianceBrowserProbe {
  @Get('auth/me') me(@Request() req: any) {
    return req.user;
  }
  @Get('preschool/navigation') navigation() {
    return { programme: 'STANDARD' };
  }
  @Get('push/config') push() {
    return { enabled: false };
  }
}

const url = process.env.COMPLIANCE_TEST_DATABASE_URL;
const integration = url ? describe : describe.skip;
jest.setTimeout(60000);
integration('Compliance real PostgreSQL and authenticated HTTP', () => {
  let db: PrismaService, service: ComplianceService, app: INestApplication;
  const tenant = randomUUID(),
    foreign = randomUUID(),
    school = randomUUID(),
    cls = randomUUID(),
    year = randomUUID(),
    term = randomUUID(),
    child = randomUUID(),
    staff = randomUUID(),
    maker = randomUUID(),
    reviewer = randomUUID(),
    parent = randomUUID(),
    outsider = randomUUID();
  const secret = 'disposable-compliance-jwt-test-secret',
    jwt = new JwtService({ secret });
  const call = (method: 'get' | 'post', path: string, user: string = maker, body?: any): any => {
    const req = request(app.getHttpServer())[method]('/government/compliance' + path);
    if (user) req.set('Authorization', 'Bearer ' + jwt.sign({ sub: user, ver: 0, type: 'access' }));
    return body ? req.send(body) : req;
  };
  const staffDto = {
    reportType: 'TEACHER_DATA_REPORT' as const,
    reportPeriod: '2026 teacher return',
    reportYear: 2026,
  };
  let reportId: string, exportId: string;
  beforeAll(async () => {
    if (
      !/^postgres(ql)?:$/.test(new URL(url!).protocol) ||
      !/(_test|_qa)$/.test(new URL(url!).pathname)
    )
      throw new Error('Use a migrated disposable database ending in _test or _qa');
    const previous = process.env.DATABASE_URL;
    process.env.DATABASE_URL = url;
    const tenants = new TenantService();
    db = new PrismaService(tenants);
    await db.$connect();
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
    await db.tenant.createMany({
      data: [tenant, foreign].map((id) => ({
        id,
        name: 'Disposable compliance fixture',
        subdomain: 'comp-' + id,
        contactEmail: 'fixture@example.test',
        contactPhone: '0000000000',
        status: 'ACTIVE',
      })),
    });
    await db.user.createMany({
      data: [
        [maker, 'SCHOOL_ADMIN'],
        [reviewer, 'PRINCIPAL'],
        [parent, 'PARENT'],
        [outsider, 'PRINCIPAL'],
      ].map(([id, role]) => ({
        id,
        tenantId: id === outsider ? foreign : tenant,
        firstName: 'Fixture',
        lastName: role,
        email: id + '@example.test',
        passwordHash: 'not-a-login-hash',
        role: role as any,
      })),
    });
    await db.school.create({
      data: {
        id: school,
        tenantId: tenant,
        name: 'Compliance test school',
        email: 'school@example.test',
        phone: '0000000000',
        address: 'Test address',
        city: 'Kochi',
        schoolType: 'PRIVATE',
        educationLevel: ['PRIMARY'],
        affiliationNumber: 'FIXTURE-1',
      },
    });
    await db.academicYear.create({
      data: {
        id: year,
        tenantId: tenant,
        name: '2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      },
    });
    await db.term.create({
      data: {
        id: term,
        tenantId: tenant,
        academicYearId: year,
        name: 'Term 2026',
        termNumber: 1,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      },
    });
    await db.class.create({
      data: {
        id: cls,
        tenantId: tenant,
        schoolId: school,
        name: 'Class 4',
        level: '4',
        educationLevel: 'PRIMARY',
      },
    });
    await db.student.create({
      data: {
        id: child,
        tenantId: tenant,
        admissionNumber: 'COMP-1',
        firstName: 'അനു',
        lastName: 'Nair',
        dateOfBirth: new Date('2016-01-01'),
        gender: 'FEMALE',
        admissionDate: new Date('2026-01-01'),
        currentClassId: cls,
        penNumber: 'PEN-VERIFIED-1',
        apaarId: '123456789012',
        birthCertNumber: 'BIRTH-1',
      },
    });
    await db.enrollment.create({
      data: {
        tenantId: tenant,
        studentId: child,
        classId: cls,
        academicYearId: year,
        enrollmentDate: new Date('2026-01-01'),
      },
    });
    await db.staff.create({
      data: {
        id: staff,
        tenantId: tenant,
        staffNumber: 'COMP-T1',
        firstName: 'Anu',
        lastName: 'Teacher',
        gender: 'FEMALE',
        email: 'teacher@example.test',
        phone: '9847000000',
        department: 'TEACHING',
        position: 'Teacher',
        employmentType: 'PERMANENT',
        hireDate: new Date('2020-01-01'),
        isTeacher: true,
      },
    });
    await db.udiseStaffRecord.create({
      data: {
        tenantId: tenant,
        staffId: staff,
        teacherCode: 'T' + tenant.replace(/-/g, '').slice(0, 10),
      },
    });
    service = new ComplianceService(db);
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [ComplianceController],
      providers: [
        { provide: ComplianceService, useValue: service },
        { provide: PrismaService, useValue: db },
        { provide: TenantService, useValue: tenants },
        { provide: ConfigService, useValue: new ConfigService({ JWT_SECRET: secret }) },
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
      ],
    }).compile();
    app = module.createNestApplication();
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
  // Evidence is intentionally append-only. Retain this run's uniquely scoped
  // fixture tenant in the disposable DB; the isolated cluster can be removed as a whole.
  afterAll(async () => {
    await app?.close();
    await db?.$disconnect();
  });
  it('rejects anonymous/family access and persists a tenant-scoped enrollment snapshot', async () => {
    await call('get', '/reports', '').expect(401);
    await call('get', '/reports', parent).expect(403);
    const report = (
      await call('post', '/reports/generate', maker, {
        reportType: 'ENROLLMENT_STATISTICS',
        reportPeriod: '2026 census',
        reportYear: 2026,
        academicYearId: year,
      }).expect(201)
    ).body;
    expect(report.reportData.summary.totalStudents).toBe(1);
    expect(report.reportData.rows[0].className).toBe('Class 4');
    expect(report.reportData.rows[0].name).toContain('അനു');
    await call('get', '/reports/' + report.id, outsider).expect(404);
    expect(
      (await new ComplianceService(db).getReports(tenant)).some((r) => r.id === report.id)
    ).toBe(true);
  });
  it('uses real SQL date/status filters and includes last-day receipts exactly once', async () => {
    const invoice = await db.invoice.create({
      data: {
        tenantId: tenant,
        studentId: child,
        termId: term,
        invoiceNumber: 'COMP-JAN',
        totalAmount: 1000,
        balanceAmount: 1000,
        createdAt: new Date('2026-01-02'),
      },
    });
    await db.invoice.create({
      data: {
        tenantId: tenant,
        studentId: child,
        termId: term,
        invoiceNumber: 'COMP-CANCELLED',
        totalAmount: 9000,
        balanceAmount: 9000,
        status: 'CANCELLED',
        createdAt: new Date('2026-01-02'),
      },
    });
    await db.payment.createMany({
      data: [
        { amount: 200, status: 'COMPLETED', paymentDate: new Date('2026-01-31T23:59:59.999Z') },
        { amount: 800, status: 'COMPLETED', paymentDate: new Date('2026-02-01') },
        { amount: 500, status: 'PENDING', paymentDate: new Date('2026-01-12') },
      ].map((p, i) => ({
        ...p,
        status: p.status as any,
        tenantId: tenant,
        invoiceId: invoice.id,
        paymentMethod: 'CASH',
        reference: 'COMP-' + i,
      })),
    });
    const report = (
      await call('post', '/reports/generate', maker, {
        reportType: 'FINANCIAL_SUMMARY',
        reportPeriod: 'January 2026',
        reportYear: 2026,
        reportMonth: 1,
      }).expect(201)
    ).body;
    expect(report.reportData.summary).toEqual({
      totalInvoices: 1,
      totalExpectedRevenue: 1000,
      totalCollectedRevenue: 200,
      totalOutstanding: 800,
    });
  });
  it('counts saved calendar days and rejects invalid attendance boundaries', async () => {
    await db.schoolEvent.create({
      data: {
        tenantId: tenant,
        title: 'Fixture holiday',
        eventType: 'HOLIDAY',
        category: 'HOLIDAY',
        isHoliday: true,
        startDate: new Date('2026-11-17'),
        endDate: new Date('2026-11-17'),
      },
    });
    await db.attendanceRecord.createMany({
      data: ['2026-11-16', '2026-11-18'].map((date) => ({
        tenantId: tenant,
        studentId: child,
        classId: cls,
        date: new Date(date),
        status: 'PRESENT',
      })),
    });
    const data = {
      reportType: 'ATTENDANCE_SUMMARY',
      reportPeriod: 'November window',
      reportYear: 2026,
      startDate: '2026-11-16',
      endDate: '2026-11-18',
    };
    const report = (await call('post', '/reports/generate', maker, data).expect(201)).body;
    expect(report.reportData.period.totalDays).toBe(2);
    expect(report.reportData.summary.attendanceRate).toBe(100);
    await call('post', '/reports/generate', maker, {
      ...data,
      startDate: data.endDate,
      endDate: data.startDate,
    }).expect(400);
  });
  it('retains zero marks, uses configured subject maxima and protects published grade corrections', async () => {
    const subject = await db.subject.create({
      data: { tenantId: tenant, name: 'Mathematics', code: '041', educationLevel: 'PRIMARY' },
    });
    const exam = await db.examination.create({
      data: { tenantId: tenant, termId: term, name: 'Fixture assessment', classId: cls },
    });
    await db.examinationSubject.create({
      data: { examinationId: exam.id, subjectId: subject.id, totalMarks: 50, passMark: 15 },
    });
    const grade = await db.grade.create({
      data: {
        tenantId: tenant,
        examinationId: exam.id,
        studentId: child,
        subjectId: subject.id,
        score: 0,
        marks: 0,
        totalMarks: 50,
        percentage: 0,
      },
    });
    const request = {
      reportType: 'EXAMINATION_ANALYSIS',
      reportPeriod: 'Term analysis',
      reportYear: 2026,
      termId: term,
    };
    const report = (await call('post', '/reports/generate', maker, request).expect(201)).body;
    expect(report.reportData.rows[0].marks).toBe(0);
    expect(report.reportData.summary.passingRate).toBe(0);
    const correction = {
      entityType: 'GRADE',
      entityId: grade.id,
      entityName: 'Mathematics',
      action: 'CORRECTED',
      reason: 'Verified original marking sheet',
      changes: [{ field: 'score', oldValue: 0, newValue: 25 }],
    };
    const updated = (await call('post', '/audit-trail/override', maker, correction).expect(201))
      .body;
    expect(updated.record.percentage).toBe(50);
    expect(updated.record.marks).toBe(25);
    await db.examination.update({ where: { id: exam.id }, data: { isPublished: true } });
    await call('post', '/audit-trail/override', maker, {
      ...correction,
      changes: [{ field: 'score', oldValue: 25, newValue: 30 }],
    }).expect(409);
    expect((await service.getReport(tenant, report.id)).reportData).toEqual(report.reportData);
  });
  it('serializes concurrent cron retries into one saved report and one ledger event', async () => {
    const results = await Promise.all(
      [1, 2, 3].map(() =>
        service.generateReport(tenant, staffDto, 'SYSTEM', 'fixture-concurrent-job')
      )
    );
    expect(new Set(results.map((r) => r.id)).size).toBe(1);
    expect(
      await db.complianceReport.count({
        where: { tenantId: tenant, idempotencyKey: 'fixture-concurrent-job' },
      })
    ).toBe(1);
    expect(
      await db.complianceLedger.count({
        where: { tenantId: tenant, entityId: results[0].id, action: 'GENERATED' },
      })
    ).toBe(1);
  });
  it('requires independent approval and saves genuine downloadable XLSX bytes', async () => {
    const report = (await call('post', '/reports/generate', maker, staffDto).expect(201)).body;
    reportId = report.id;
    await call('post', '/reports/action', maker, { reportId, action: 'REQUEST_REVIEW' }).expect(
      201
    );
    await call('post', '/reports/action', maker, { reportId, action: 'APPROVE' }).expect(403);
    await call('post', '/reports/action', outsider, { reportId, action: 'APPROVE' }).expect(404);
    await call('post', '/reports/action', reviewer, { reportId, action: 'APPROVE' }).expect(201);
    const file = (
      await call('post', '/portal-export', maker, {
        reportId,
        templateId: 'TEACHER_MANDATORY_DISCLOSURE',
        format: 'xlsx',
      }).expect(201)
    ).body;
    exportId = file.id;
    const saved = await service.download(tenant, exportId);
    expect(saved.content.readUInt32LE(0)).toBe(0x04034b50);
    await mkdir('../../qa/compliance', { recursive: true });
    await writeFile('../../qa/compliance/real-export.xlsx', saved.content);
    await call('get', '/downloads/' + exportId)
      .expect(200)
      .expect('Content-Type', /spreadsheetml/);
    await call('get', '/downloads/' + exportId, outsider).expect(404);
  });
  it('records one receipt under concurrent retries and preserves rejection/replacement history', async () => {
    const data = {
      reportId,
      exportId,
      portal: 'Reviewed official portal',
      receiptReference: 'COMP-RECEIPT',
      submittedAt: new Date().toISOString(),
      portalFormatReviewed: true,
    };
    await call('post', '/reports/manual-submission', maker, {
      ...data,
      portalFormatReviewed: 'false',
    }).expect(400);
    await Promise.all(
      [1, 2, 3].map(() => call('post', '/reports/manual-submission', maker, data).expect(201))
    );
    expect(
      await db.complianceLedger.count({
        where: { tenantId: tenant, entityId: reportId, action: 'MANUALLY_SUBMITTED' },
      })
    ).toBe(1);
    await call('post', '/reports/outcome', maker, {
      reportId,
      status: 'REJECTED',
      notes: 'Portal requested correction',
    }).expect(201);
    await call('post', '/reports/action', maker, { reportId, action: 'REOPEN' }).expect(409);
    const replacement = (
      await call('post', '/reports/generate', maker, {
        ...staffDto,
        replacesReportId: reportId,
      }).expect(201)
    ).body;
    expect(replacement.metadata.replacesReportId).toBe(reportId);
    const previous = await service.getReport(tenant, reportId);
    expect(previous.status).toBe('REJECTED');
    expect((previous.metadata as any).manualSubmission.receiptReference).toBe('COMP-RECEIPT');
  });
  it('enforces append-only ledger/exports and immutable report data in PostgreSQL', async () => {
    const event = await db.complianceLedger.findFirstOrThrow({ where: { tenantId: tenant } });
    await expect(
      db.complianceLedger.update({ where: { id: event.id }, data: { action: 'FORGED' } })
    ).rejects.toThrow('append-only');
    await expect(db.complianceLedger.delete({ where: { id: event.id } })).rejects.toThrow(
      'append-only'
    );
    await expect(
      db.complianceExport.update({
        where: { id: exportId },
        data: { content: Buffer.from('forged') },
      })
    ).rejects.toThrow('append-only');
    await expect(
      db.complianceReport.update({
        where: { id: reportId },
        data: { reportData: { altered: true } },
      })
    ).rejects.toThrow('replacement');
  });
  it('deduplicates deadline alerts across concurrent worker runs and scopes all mutations', async () => {
    const checklist = await service.createChecklist(
      tenant,
      'Compliance deadline',
      'Fixture',
      'BOARD_COMPLIANCE',
      'School board',
      'ONCE',
      new Date('2020-01-01'),
      maker
    );
    await Promise.all([1, 2, 3].map(() => service.checkDeadlines(tenant)));
    const list = await service.getAlerts(tenant);
    expect(list.filter((a) => a.relatedEntityId === checklist.id)).toHaveLength(1);
    await expect(service.completeChecklist(foreign, checklist.id, outsider)).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.acknowledgeAlert(foreign, list[0].id, outsider)).rejects.toMatchObject({
      status: 404,
    });
    await service.acknowledgeAlert(tenant, list[0].id, maker);
    expect((await service.getAlerts(tenant)).find((a) => a.id === list[0].id)?.status).toBe(
      'ACKNOWLEDGED'
    );
  });
  it('persists measured audits and rechecks source corrections without fabricating sync status', async () => {
    const before = await service.runDataQualityAudit(tenant, 'STAFF_DATA', maker);
    expect(before?.overallScore).toBe(100);
    const code = await db.udiseStaffRecord.findFirstOrThrow({
      where: { tenantId: tenant, staffId: staff },
    });
    const updated = (
      await call('post', '/audit-trail/override', maker, {
        entityType: 'STAFF_RECORD',
        entityId: staff,
        entityName: 'Teacher',
        action: 'CORRECTED',
        reason: 'Verified national teacher code document',
        changes: [
          {
            field: 'teacherCode',
            oldValue: code.teacherCode,
            newValue: 'V' + tenant.replace(/-/g, '').slice(0, 10),
          },
        ],
      }).expect(201)
    ).body;
    expect(updated.record.syncStatus).toBe('NEVER_SYNCED');
    expect(updated.record.isRegistered).toBe(false);
    const result = await service.resolveAudit(tenant, before!.id, maker);
    expect(result.overallScore).toBe(100);
    expect((await service.getAudit(tenant, before!.id)).resolvedAt).not.toBeNull();
    await expect(service.getAudit(foreign, before!.id)).rejects.toMatchObject({ status: 404 });
  });
  it('records manual candidate/results/timetable evidence without an external adapter', async () => {
    const candidate = {
      kind: 'CANDIDATE',
      examLevel: 'CBSE_AISSE',
      examYear: 2026,
      studentId: child,
      candidateNumber: '000123',
      portalReference: 'LOC-FIXTURE',
      notes: 'Verified the registration receipt',
    };
    await call('post', '/board-records', outsider, candidate).expect(404);
    const entry = (await call('post', '/board-records', maker, candidate).expect(201)).body;
    const repeated = (await call('post', '/board-records', maker, candidate).expect(201)).body;
    expect(repeated.id).toBe(entry.id);
    await call('post', '/board-records', maker, {
      ...candidate,
      kind: 'RESULT',
      subjectCode: '041',
      marks: 101,
      totalMarks: 100,
    }).expect(400);
    const result = (
      await call('post', '/board-records', maker, {
        ...candidate,
        kind: 'RESULT',
        subjectCode: '041',
        marks: 88,
        totalMarks: 100,
      }).expect(201)
    ).body;
    expect(result.payload.marks).toBe(88);
    await call('post', '/board-records', maker, {
      kind: 'TIMETABLE',
      examLevel: 'CBSE_AISSE',
      examYear: 2026,
      subjectCode: '041',
      examDate: '2026-03-01',
      startTime: '09:00',
      endTime: '12:00',
      portalReference: 'DATESHEET-1',
      notes: 'Verified the published datesheet',
    }).expect(201);
    expect((await call('get', '/board-records', outsider).expect(200)).body).toHaveLength(0);
    expect((await call('get', '/board-records', maker).expect(200)).body).toHaveLength(3);
    const corrected = (
      await call('post', '/board-records', maker, {
        ...candidate,
        candidateNumber: '000124',
        replacesId: entry.id,
        notes: 'Verified corrected portal receipt',
      }).expect(201)
    ).body;
    expect(corrected.payload.replacesId).toBe(entry.id);
  });
  it('applies justified source corrections atomically and detects stale values', async () => {
    const data = {
      entityType: 'STUDENT_RECORD',
      entityId: child,
      entityName: 'Student',
      action: 'CORRECTED',
      reason: 'Original birth record verified',
      changes: [{ field: 'birthCertNumber', oldValue: 'BIRTH-1', newValue: 'BIRTH-UPDATED' }],
    };
    await call('post', '/audit-trail/override', outsider, data).expect(404);
    await call('post', '/audit-trail/override', maker, data).expect(201);
    await call('post', '/audit-trail/override', maker, data).expect(409);
    expect(
      (await db.student.findFirstOrThrow({ where: { tenantId: tenant, id: child } }))
        .birthCertNumber
    ).toBe('BIRTH-UPDATED');
    const verified = await service.verifyAuditChain(tenant);
    expect(verified.isValid).toBe(true);
    expect(verified.totalBlocksVerified).toBeGreaterThan(15);
    expect((await service.getAuditTrail(foreign)).length).toBe(0);
  });
  (process.env.COMPLIANCE_UI_BASE_URL ? it : it.skip)(
    'runs the browser report-to-accepted-receipt flow against the real database API',
    async () => {
      const tenants = new TenantService();
      const module = await Test.createTestingModule({
        imports: [PassportModule],
        controllers: [ComplianceController, ComplianceBrowserProbe],
        providers: [
          { provide: ComplianceService, useValue: service },
          { provide: PrismaService, useValue: db },
          { provide: TenantService, useValue: tenants },
          { provide: ConfigService, useValue: new ConfigService({ JWT_SECRET: secret }) },
          JwtStrategy,
          JwtAuthGuard,
          RolesGuard,
        ],
      }).compile();
      const live = module.createNestApplication();
      live.use((_req: any, _res: any, next: any) => tenants.run(next));
      live.useGlobalGuards(module.get(JwtAuthGuard), module.get(RolesGuard));
      live.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: { enableImplicitConversion: true },
        })
      );
      live.useGlobalInterceptors(new TransformInterceptor());
      live.setGlobalPrefix('api/v1');
      await live.listen(15437, '127.0.0.1');
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({ headless: true });
      try {
        const context = await browser.newContext({
          viewport: { width: 1440, height: 1100 },
          serviceWorkers: 'block',
        });
        await context.addInitScript(
          (token) => {
            if (!localStorage.getItem('accessToken')) localStorage.setItem('accessToken', token);
          },
          jwt.sign({ sub: maker, ver: 0, type: 'access' })
        );
        const page = await context.newPage(),
          errors: string[] = [];
        page.setDefaultTimeout(15000);
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(process.env.COMPLIANCE_UI_BASE_URL + '/school/compliance', {
          timeout: 120000,
        });
        await page.getByLabel('Report type', { exact: true }).selectOption('TEACHER_DATA_REPORT');
        const period = 'Browser manual return ' + tenant.slice(0, 8);
        await page.getByLabel('Reporting period', { exact: true }).fill(period);
        await page.getByLabel('First day', { exact: true }).fill('2026-01-01');
        await page.getByLabel('Last day', { exact: true }).fill('2026-11-18');
        await page.getByRole('button', { name: 'Generate saved report', exact: true }).click();
        await page.getByRole('heading', { name: 'Review: ' + period, exact: true }).waitFor();
        await page.getByRole('button', { name: 'Request review', exact: true }).click();
        await page.getByText('A different school manager must approve the report.').waitFor();
        await page.evaluate(
          (token) => localStorage.setItem('accessToken', token),
          jwt.sign({ sub: reviewer, ver: 0, type: 'access' })
        );
        await page.reload();
        await page.getByRole('button', { name: 'Review ' + period, exact: true }).click();
        await page.getByRole('button', { name: 'Approve report', exact: true }).click();
        await page
          .getByRole('heading', { name: 'Record a manual portal submission', exact: true })
          .waitFor();
        const downloading = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
        const file = await downloading;
        expect(file.suggestedFilename()).toMatch(/\.csv$/);
        await page.getByLabel('Government portal', { exact: true }).fill('Verified fixture portal');
        await page.getByLabel('Portal receipt reference').fill('BROWSER-RECEIPT');
        const now = await page.evaluate(() => {
          const date = new Date();
          date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
          return date.toISOString().slice(0, 19);
        });
        await page.getByLabel('Submission time', { exact: true }).fill(now);
        await page
          .getByLabel(
            'I reviewed the current official portal format and uploaded this approved export.'
          )
          .check();
        await page.getByRole('button', { name: 'Record portal receipt', exact: true }).click();
        await page.getByLabel('Portal outcome', { exact: true }).waitFor();
        await page
          .getByLabel('Review or portal response notes')
          .fill('Accepted on the fixture portal');
        await page.getByRole('button', { name: 'Record portal outcome', exact: true }).click();
        await page.getByText('Portal outcome recorded.', { exact: true }).waitFor();
        const persisted = await db.complianceReport.findFirstOrThrow({
          where: { tenantId: tenant, reportPeriod: period },
        });
        expect(persisted.status).toBe('ACKNOWLEDGED');
        expect((persisted.metadata as any).manualSubmission.receiptReference).toBe(
          'BROWSER-RECEIPT'
        );
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(() => window.scrollTo(0, 0));
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        );
        await page.screenshot({
          path: '../../qa/compliance/real-workflow-mobile.png',
          fullPage: true,
        });
        expect(errors).toEqual([]);
        await writeFile(
          '../../qa/compliance/real-browser-results.json',
          JSON.stringify(
            { acceptedReportId: persisted.id, realDatabase: true, apiFixtures: false, errors },
            null,
            2
          )
        );
      } finally {
        await browser.close();
        await live.close();
      }
    },
    120000
  );
});
