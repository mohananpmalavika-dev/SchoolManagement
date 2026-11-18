/// <reference lib="dom" />
import { createHmac, randomUUID } from 'node:crypto';
import { Controller, Get, Request, INestApplication, ValidationPipe } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../database/prisma.service';
import { TenantService } from '../database/tenant.service';
import { JwtStrategy } from '../modules/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SchoolRecordAccessGuard } from '../common/guards/school-record-access.guard';
import { WorkspaceController } from '../modules/workspace/workspace.controller';
import { WorkspaceService } from '../modules/workspace/workspace.service';
import { FeesController } from '../modules/fees/fees.controller';
import { FeesService } from '../modules/fees/fees.service';
import { AttendanceController } from '../modules/attendance/attendance.controller';
import { AttendanceService } from '../modules/attendance/attendance.service';
import { QRAttendanceService } from '../modules/attendance/services/qr-attendance.service';
import { RedisService } from '../common/services/redis.service';
import { ExaminationsController } from '../modules/examinations/examinations.controller';
import { ExaminationsService } from '../modules/examinations/examinations.service';
import { TimetableService } from '../modules/timetable/timetable.service';
import { TimetableController } from '../modules/timetable/timetable.controller';
import { PaymentsGatewayService } from '../modules/payments-gateway/payments-gateway.service';
import { SchoolPaymentAccountsService } from '../modules/payments-gateway/school-payment-accounts.service';
import { EncryptionUtil } from '../common/utils/encryption.util';
import { PaymentCallbackGuard } from '../common/guards/payment-callback.guard';
import { PaymentsGatewayController } from '../modules/payments-gateway/payments-gateway.controller';
import { StaffController } from '../modules/staff/staff.controller';
import { StaffService } from '../modules/staff/staff.service';
import { GuardiansController } from '../modules/guardians/guardians.controller';
import { GuardiansService } from '../modules/guardians/guardians.service';
import { StudentsController } from '../modules/students/students.controller';
import { StudentsService } from '../modules/students/students.service';
import { HomeworkService } from '../modules/homework/homework.service';
import { HomeworkController } from '../modules/homework/homework.controller';
import { ActivityFeedService } from '../modules/activity-feed/activity-feed.service';
import { ActivityFeedController } from '../modules/activity-feed/activity-feed.controller';
import { BehaviorService } from '../modules/behavior/behavior.service';
import { BehaviorController } from '../modules/behavior/behavior.controller';
import { ChatService } from '../modules/chat/chat.service';
import { ChatController } from '../modules/chat/chat.controller';
import { ParentEngagementNotificationsService } from '../modules/parent-engagement-notifications/parent-engagement-notifications.service';
import { OperationsService } from '../modules/operations/operations.service';
import { AcademicRolloverService } from '../modules/operations/academic-rollover.service';
import { AcademicRolloverController } from '../modules/operations/academic-rollover.controller';
import { AdmissionAccountsService } from '../modules/operations/admission-accounts.service';
import { PasswordResetService } from '../modules/auth/services/password-reset.service';
import { EmailService } from '../common/services/email.service';
import { OperationsController } from '../modules/operations/operations.controller';
import { StorageService } from '../common/services/storage.service';
import { SavedTransportController } from '../modules/operations/transport.controller';
import { SavedTransportService } from '../modules/operations/transport.service';
import { PlatformController } from '../modules/platform/platform.controller';
import { PlatformService } from '../modules/platform/platform.service';
import { SubscriptionsController } from '../modules/subscriptions/subscriptions.controller';
import { SubscriptionsService } from '../modules/subscriptions/subscriptions.service';
import { SubscriptionsScopeInterceptor } from '../modules/subscriptions/subscriptions-scope.interceptor';

@Controller()
class SchoolBrowserSessionProbe {
  @Get('auth/me') me(@Request() request: any) { return request.user; }
  @Get('preschool/navigation') navigation() { return { programme: 'STANDARD' }; }
}

const url = process.env.SCHOOL_TEST_DATABASE_URL;
jest.setTimeout(30000); // Authenticated multi-request database workflows also run on slower CI workers.
const integration = url ? describe : describe.skip;
integration('School PostgreSQL and authenticated HTTP workflows', () => {
  let db: PrismaService, tenants: TenantService, app: INestApplication, base: string;
  const id = () => randomUUID();
  const tenant = id(),
    foreignTenant = id(),
    school = id(),
    cls = id(),
    otherClass = id(),
    year = id(),
    term = id(),
    subject = id();
  const principal = id(),
    platformAdmin = id(),
    teacher = id(),
    otherTeacher = id(),
    parent = id(),
    otherParent = id(),
    studentUser = id(),
    outsider = id();
  const staff = id(),
    otherStaff = id(),
    child = id(),
    otherChild = id(),
    guardian = id(),
    otherGuardian = id(),
    assignment = id();
  const secret = 'isolated-school-http-regression-secret';
  const jwt = new JwtService({ secret });
  const inTenant = <T>(work: () => Promise<T>) =>
    tenants.run(() => {
      tenants.setTenantId(tenant);
      return work();
    });
  const request = async (
    path: string,
    user: string = principal,
    method = 'GET',
    data?: unknown
  ) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(user
          ? {
              Authorization:
                'Bearer ' + jwt.sign({ sub: user, ver: 0, type: 'access' }, { expiresIn: '5m' }),
            }
          : {}),
        'Content-Type': 'application/json',
        Connection: 'close',
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  };
  const createInvoice = (studentId: string = child, termId: string = term) =>
    request('/fees/invoices', principal, 'POST', {
      studentId,
      termId,
      items: [{ description: 'Tuition', amount: 10000, feeCategory: 'TUITION' }],
    });
  const newTerm = () =>
    db.term.create({
      data: {
        tenantId: tenant,
        academicYearId: year,
        name: id(),
        termNumber: 2,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      },
    });

  beforeAll(async () => {
    if (!/(_test|_qa)$/.test(new URL(url!).pathname.slice(1)))
      throw new Error('Use a disposable _test or _qa database');
    const original = process.env.DATABASE_URL;
    process.env.DATABASE_URL = url;
    tenants = new TenantService();
    db = new PrismaService(tenants);
    await db.$connect();
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
    await db.tenant.createMany({
      data: [tenant, foreignTenant].map((id) => ({
        id,
        name: 'Isolated school workflow test',
        subdomain: 'test-' + id,
        contactEmail: 'test@example.test',
        contactPhone: '0000000000',
      })),
    });
    await db.user.createMany({
      data: [
        [principal, 'PRINCIPAL'],
        [platformAdmin, 'SUPER_ADMIN'],
        [teacher, 'TEACHER'],
        [otherTeacher, 'TEACHER'],
        [parent, 'PARENT'],
        [otherParent, 'PARENT'],
        [studentUser, 'STUDENT'],
        [outsider, 'PRINCIPAL'],
      ].map(([id, role]) => ({
        id,
        role: role as any,
        tenantId: id === outsider ? foreignTenant : tenant,
        firstName: 'Test',
        lastName: role,
        email: id + '@example.test',
        passwordHash: 'not-a-login-hash',
      })),
    });
    await db.school.create({
      data: {
        id: school,
        tenantId: tenant,
        name: 'Test school',
        schoolType: 'PRIVATE',
        educationLevel: ['PRIMARY'],
        address: 'Test',
        city: 'Test',
        email: 'test@example.test',
        phone: '0000000000',
      },
    });
    await db.schoolPaymentAccount.create({ data: { tenantId: tenant, schoolId: school, merchantName: 'Fixture school',
      upiVpa: 'fixture-school@upi', configuredBy: principal } });
    await db.class.createMany({
      data: [cls, otherClass].map((id) => ({
        id,
        tenantId: tenant,
        schoolId: school,
        name: id,
        level: 'Class 1',
        educationLevel: 'PRIMARY',
      })),
    });
    await db.academicYear.create({
      data: {
        id: year,
        tenantId: tenant,
        name: 'Test 2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      },
    });
    await db.term.create({
      data: {
        id: term,
        tenantId: tenant,
        academicYearId: year,
        name: 'Term 1',
        termNumber: 1,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      },
    });
    await db.subject.create({
      data: {
        id: subject,
        tenantId: tenant,
        name: 'Math',
        code: 'MATH',
        educationLevel: 'PRIMARY',
      },
    });
    await db.staff.createMany({
      data: [
        [staff, teacher],
        [otherStaff, otherTeacher],
      ].map(([id, userId]) => ({
        id,
        userId,
        tenantId: tenant,
        staffNumber: id,
        firstName: 'Test',
        lastName: 'Teacher',
        email: id + '@example.test',
        phone: '0000000000',
        gender: 'FEMALE',
        department: 'TEACHING',
        position: 'Teacher',
        employmentType: 'PERMANENT',
        hireDate: new Date('2026-01-01'),
        isTeacher: true,
      })),
    });
    await db.timetableEntry.createMany({
      data: [
        [staff, cls],
        [otherStaff, otherClass],
      ].map(([teacherId, classId]) => ({
        tenantId: tenant,
        teacherId,
        classId,
        subjectId: subject,
        dayOfWeek: 1,
        period: '1',
        startTime: '09:00',
        endTime: '10:00',
      })),
    });
    await db.student.createMany({
      data: [child, otherChild].map((id) => ({
        id,
        tenantId: tenant,
        userId: id === child ? studentUser : null,
        currentClassId: id === child ? cls : otherClass,
        admissionNumber: id,
        firstName: 'Test',
        lastName: 'Student',
        dateOfBirth: new Date('2020-01-01'),
        admissionDate: new Date('2026-01-01'),
        gender: 'FEMALE',
      })),
    });
    await db.guardian.createMany({
      data: [
        [guardian, parent],
        [otherGuardian, otherParent],
      ].map(([id, userId]) => ({
        id,
        userId,
        tenantId: tenant,
        firstName: 'Test',
        lastName: 'Parent',
        phone: '0000000000',
      })),
    });
    await db.guardianStudentLink.createMany({
      data: [
        [guardian, child],
        [otherGuardian, otherChild],
      ].map(([guardianId, studentId]) => ({ guardianId, studentId, relationship: 'MOTHER' })),
    });
    await db.assignment.create({
      data: {
        id: assignment,
        tenantId: tenant,
        classId: cls,
        subjectId: subject,
        title: 'Math homework',
        description: 'Practice',
        dueDate: new Date('2027-01-01'),
        maxMarks: 10,
        createdBy: teacher,
      },
    });
    const redisData = new Map<string, string>(); // Only QR metadata; all school records use PostgreSQL.
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [
        SchoolBrowserSessionProbe,
        PlatformController,
        SubscriptionsController,
        SavedTransportController,
        OperationsController,
        AcademicRolloverController,
        WorkspaceController,
        FeesController,
        AttendanceController,
        ExaminationsController,
        HomeworkController,
        ChatController,
        ActivityFeedController,
        BehaviorController,
        TimetableController,
        PaymentsGatewayController,
        StaffController,
        GuardiansController,
        StudentsController,
      ],
      providers: [
        PlatformService,
        SubscriptionsService,
        SubscriptionsScopeInterceptor,
        {provide:StorageService,useValue:{
          isConfigured:()=>true,
          uploadFile:async(bytes:Buffer,options:any)=>({key:tenant+'/documents/2026/11/'+options.filename}),
          getPresignedUrl:async(key:string)=>({url:'https://private-storage.example.test/'+key+'?signed=fixture'})
        }},
        { provide: PrismaService, useValue: db },
        { provide: TenantService, useValue: tenants },
        {
          provide: ConfigService,
          useValue: new ConfigService({ JWT_SECRET: secret, SCHOOL_UPI_VPA: 'fixture-school@upi', RAZORPAY_WEBHOOK_SECRET: secret }),
        },
        { provide: JwtService, useValue: jwt },
        {
          provide: RedisService,
          useValue: {
            set: async (key: string, value: string) => redisData.set(key, value),
            get: async (key: string) => redisData.get(key),
            exists: async (key: string) => redisData.has(key),
            del: async (key: string) => redisData.delete(key),
            keys: async (pattern: string) =>
              [...redisData.keys()].filter((key) => key.startsWith(pattern.replace('*', ''))),
          },
        },
        JwtStrategy,
        SchoolRecordAccessGuard,
        WorkspaceService,
        SavedTransportService,
        OperationsService,
        AcademicRolloverService,
        AdmissionAccountsService,
        PasswordResetService,
        { provide: EmailService, useValue: { sendAccountInvitation: jest.fn().mockResolvedValue(true), sendPasswordChanged: jest.fn().mockResolvedValue(true) } },
        FeesService,
        AttendanceService,
        QRAttendanceService,
        ExaminationsService,
        TimetableService,
        HomeworkService,
        ChatService,
        ParentEngagementNotificationsService,
        ActivityFeedService,
        BehaviorService,
        PaymentsGatewayService,
        SchoolPaymentAccountsService,
        EncryptionUtil,
        PaymentCallbackGuard,
        StaffService,
        GuardiansService,
        StudentsService,
      ],
    }).compile();
    app = module.createNestApplication({ logger: false, rawBody: true });
    app.use((_req: any, _res: any, next: () => void) => tenants.run(next));
    app.useGlobalGuards(
      new JwtAuthGuard(module.get(Reflector)),
      new RolesGuard(module.get(Reflector))
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      })
    );
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
  }, 30000);
  afterAll(async () => {
    await app?.close();
    if (db) {
      try {
        for (const model of [
          'transportJourney',
          'travelAssignment',
          'route',
          'vehicle',
          'bookBorrowing',
          'book',
          'inventoryItem',
          'supportTicket',
          'chatChannel',
          'communication',
          'activityFeed',
          'behaviorRecord',
          'attendanceRecord',
          'assignmentSubmission',
          'assignment',
          'grade',
          'reportCard',
          'examination',
          'paymentGatewayTransaction',
          'payment',
          'invoice',
          'schoolPaymentAccount',
          'timetableEntry',
        ])
          await (db as any)[model].deleteMany({
            where: { tenantId: { in: [tenant, foreignTenant] } },
          });
        await db.tenant.deleteMany({ where: { id: { in: [tenant, foreignTenant] } } });
      } finally {
        await db.$disconnect();
      }
    }
  });

  it('connects platform school, account and subscription administration across schools', async () => {
    let planId: string | undefined;
    let createdTenant: string | undefined;
    try {
      expect((await request('/admin/schools', principal)).status).toBe(403);
      const school = await request('/admin/schools', platformAdmin, 'POST', { data: {
        name: 'Provisioned school', subdomain: 'qa-' + id(), contactEmail: 'office@example.test', contactPhone: '0000000000',
      } });
      expect(school.status).toBe(201);
      createdTenant = school.body.id;
      expect(await db.school.count({ where: { tenantId: createdTenant } })).toBe(1);
      const account = await request('/admin/users', platformAdmin, 'POST', { data: {
        tenantId: createdTenant, email: id() + '@example.test', firstName: 'New', lastName: 'Principal', role: 'PRINCIPAL', password: 'Test-password-1234',
      } });
      expect(account.status).toBe(201);
      expect((await request('/admin/users', platformAdmin)).body.find((u: any) => u.id === account.body.id)).not.toHaveProperty('passwordHash');
      expect((await request('/admin/users/' + platformAdmin, platformAdmin, 'PATCH', { data: { status: 'SUSPENDED' } })).status).toBe(400);
      const plan = await request('/subscriptions/plans', platformAdmin, 'POST', {
        name: 'Test plan', slug: 'qa-' + id(), price: 120000, maxStudents: 100, maxStaff: 10,
        features: [], trialDays: 0, smsCredits: 0, maxStorageMB: 0,
      });
      expect(plan.status).toBe(201);
      planId = plan.body.id;
      expect(plan.body).toMatchObject({ trialDays: 0, smsCredits: 0, maxStorageMB: 0 });
      const subscription = await request('/subscriptions', platformAdmin, 'POST', { tenantId: createdTenant, planId });
      expect(subscription.status).toBe(201);
      const subscriptionId = subscription.body.id;
      expect((await request('/subscriptions/' + subscriptionId, platformAdmin)).status).toBe(200);
      expect((await request('/subscriptions?status=ACTIVE', platformAdmin)).body.every((s: any) => s.status === 'ACTIVE')).toBe(true);
      expect((await request('/subscriptions?status=TRIAL', platformAdmin)).body.some((s: any) => s.id === subscriptionId)).toBe(true);
      expect((await request('/subscriptions/' + subscriptionId + '/cancel', principal, 'POST', { reason: 'Cross-school attempt' })).status).toBe(404);
      expect((await request('/subscriptions/' + subscriptionId, platformAdmin, 'PATCH', { autoRenew: false })).status).toBe(200);
      expect((await request('/admin/subscriptions', platformAdmin)).body.some((s: any) => s.id === subscriptionId)).toBe(true);
      await db.subscription.update({ where: { id: subscriptionId }, data: { status: 'EXPIRED' } });
      expect((await request('/subscriptions?includeExpired=false', platformAdmin)).body.some((s: any) => s.id === subscriptionId)).toBe(false);
      expect((await request('/subscriptions?includeExpired=true', platformAdmin)).body.some((s: any) => s.id === subscriptionId)).toBe(true);
      expect((await request('/subscriptions?status=EXPIRED', platformAdmin)).body.some((s: any) => s.id === subscriptionId)).toBe(true);
      expect((await request('/admin/users/' + account.body.id, platformAdmin, 'PATCH', { data: { status: 'SUSPENDED' } })).status).toBe(200);
      expect((await request('/workspace/overview', account.body.id)).status).toBe(401);
    } finally {
      if (createdTenant) await db.tenant.delete({ where: { id: createdTenant } });
      if (planId) await db.plan.deleteMany({ where: { id: planId } });
    }
  });

  it('serves plan discovery before the subscription ID route', async () => {
    const plan = await db.plan.create({ data: {
      name: 'Inactive QA plan', slug: 'qa-' + id(), price: 0, maxStudents: 10, maxStaff: 2, features: [], isActive: false,
    } });
    try {
    const result = await request('/subscriptions/plans?activeOnly=true', principal);
    expect(result.status).toBe(200);
    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.some((row: any) => row.id === plan.id)).toBe(false);
    expect((await request('/subscriptions/plans?activeOnly=false', principal)).body.some((row: any) => row.id === plan.id)).toBe(true);
    expect((await request('/subscriptions/plans?activeOnly=invalid', principal)).status).toBe(400);
    } finally { await db.plan.delete({ where: { id: plan.id } }); }
  });

  it('requires authentication and denies cross-tenant records', async () => {
    expect((await request('/workspace/students', '')).status).toBe(401);
    expect((await request('/workspace/student/' + child, outsider)).status).toBe(404);
  });
  it('requires teachers to select an assigned class in original attendance APIs', async () => {
    expect((await request('/attendance/students', teacher)).status).toBe(403);
    expect((await request('/attendance/students?classId=' + otherClass, teacher)).status).toBe(403);
    expect((await request('/attendance/students?classId=' + cls, teacher)).status).toBe(200);
  });
  it('denies family attendance access to another child', async () => {
    expect(
      (await request('/attendance/students/report?studentId=' + otherChild, parent)).status
    ).toBe(403);
    expect((await request('/attendance/students/report?studentId=' + child, parent)).status).toBe(
      200
    );
  });
  it('saves attendance, counts absence once, and delivers one retry-safe family update', async () => {
    const data = {
      classId: cls,
      date: '2026-11-17',
      records: [{ studentId: child, status: 'ABSENT' }],
    };
    expect((await request('/workspace/register', teacher, 'POST', data)).status).toBe(201);
    expect((await request('/workspace/register', teacher, 'POST', data)).status).toBe(201);
    const report = await request('/attendance/students/report?studentId=' + child, parent);
    expect(report.body.summary.absent).toBe(1);
    expect(
      (await request('/workspace/notifications', parent)).body.filter(
        (m: any) => m.title === 'Attendance update'
      )
    ).toHaveLength(1);
    expect((await request('/workspace/notifications', otherParent)).body).toHaveLength(0);
  });
  it('keeps original attendance writes and shared registers on the same calendar date', async () => {
    const date = '2026-12-08';
    const saved = await request('/attendance/students/single', teacher, 'POST', {
      studentId: child, date, status: 'PRESENT',
    });
    expect(saved.status).toBe(201);
    expect(saved.body.date).toBe(date + 'T00:00:00.000Z');
    const register = await request(`/workspace/register?classId=${cls}&date=${date}`, teacher);
    expect(register.body.find((row: any) => row.id === child).status).toBe('PRESENT');
    await request('/workspace/register', teacher, 'POST', {
      classId: cls, date, records: [{ studentId: child, status: 'LATE' }],
    });
    const original = await request(`/attendance/students?classId=${cls}&date=${date}`, teacher);
    expect(original.body.data.filter((row: any) => row.studentId === child)).toHaveLength(1);
    expect(original.body.data.find((row: any) => row.studentId === child).status).toBe('LATE');
    const staffSaved = await request('/attendance/staff/single', principal, 'POST', {
      staffId: staff, date, status: 'PRESENT',
    });
    expect(staffSaved.status).toBe(201);
    expect(staffSaved.body.date).toBe(date + 'T00:00:00.000Z');
    const staffRows = await request(`/attendance/staff?date=${date}`, principal);
    expect(staffRows.status).toBe(200);
    expect(staffRows.body.find((row: any) => row.staffId === staff).status).toBe('PRESENT');
  });

  it('updates attendance class allocation after a same-day student move', async () => {
    const date = '2026-12-09';
    try {
      await request('/workspace/register', principal, 'POST', {
        classId: cls, date, records: [{ studentId: child, status: 'PRESENT' }],
      });
      await db.student.update({ where: { id: child }, data: { currentClassId: otherClass } });
      expect((await request('/workspace/register', principal, 'POST', {
        classId: otherClass, date, records: [{ studentId: child, status: 'LATE' }],
      })).status).toBe(201);
      const register = await request(`/workspace/register?classId=${otherClass}&date=${date}`, principal);
      expect(register.body.find((row: any) => row.id === child).status).toBe('LATE');
      const rows = await db.attendanceRecord.findMany({ where: { tenantId: tenant, studentId: child, date: new Date(date) } });
      expect(rows).toHaveLength(1);
      expect(rows[0].classId).toBe(otherClass);
    } finally {
      await db.student.update({ where: { id: child }, data: { currentClassId: cls } });
    }
  });

  it('binds homework guardian IDs to the signed-in parent and assignment to the child class', async () => {
    expect(
      (await request(`/homework/student/${otherChild}/guardian/${otherGuardian}`, parent)).status
    ).toBe(403);
    expect(
      (await request(`/homework/student/${child}/guardian/${otherGuardian}`, parent)).status
    ).toBe(403);
    expect(
      (await request(`/homework/student/${child}/guardian/${guardian}`, parent)).body.data
    ).toHaveLength(1);
    expect(
      (
        await request(
          `/homework/assignment/${assignment}/student/${otherChild}/guardian/${otherGuardian}`,
          otherParent
        )
      ).status
    ).toBe(404);
  });
  let exam: string, grade: string, card: string;
  it('persists zero marks and rejects invalid nested bulk grades', async () => {
    const created = await request('/workspace/examinations', principal, 'POST', {
      data: {
        name: 'Term assessment',
        classId: cls,
        termId: term,
        startDate: '2026-11-01',
        endDate: '2026-11-20',
        subjectId: subject,
        totalMarks: 100,
      },
    });
    expect(created.status).toBe(201);
    exam = created.body.id;
    expect(
      (
        await request('/examinations/grades/bulk', teacher, 'POST', {
          examinationId: exam,
          subjectId: subject,
          grades: [{ studentId: child, score: -1 }],
        })
      ).status
    ).toBe(400);
    const result = await request('/examinations/grades', teacher, 'POST', {
      examinationId: exam,
      subjectId: subject,
      studentId: child,
      score: 0,
    });
    expect(result.status).toBe(201);
    grade = result.body.id;
    expect(
      (await request('/examinations/grades/' + grade, teacher, 'PATCH', { score: 101 })).status
    ).toBe(400);
    expect(
      (await request('/examinations/grades/query?studentId=' + child, parent)).body
    ).toHaveLength(0);
    expect(
      (await request('/examinations/grades/query?studentId=' + otherChild, parent)).status
    ).toBe(403);
  });
  it('releases only published grades and cards, and teachers cannot self-approve', async () => {
    const generated = await request('/examinations/report-cards', principal, 'POST', {
      studentId: child,
      termId: term,
    });
    expect(generated.status).toBe(201);
    card = generated.body.id;
    expect((await request('/examinations/report-cards/' + card, parent)).status).toBe(404);
    expect(
      (await request('/examinations/report-cards?studentId=' + child + '&status=DRAFT', parent))
        .body
    ).toHaveLength(0);
    expect(
      (
        await request('/examinations/report-cards/' + card, teacher, 'PATCH', {
          status: 'PUBLISHED',
        })
      ).status
    ).toBe(403);
    expect(
      (await request('/workspace/examinations/' + exam + '/publish', principal, 'POST')).status
    ).toBe(201);
    expect(
      (await request('/examinations/grades/query?studentId=' + child, parent)).body[0].score
    ).toBe(0);
    expect(
      (await request('/examinations/grades/' + grade, teacher, 'PATCH', { score: 50 })).status
    ).toBe(400);
    expect(
      (await request('/workspace/report-cards/' + card + '/publish', principal, 'POST')).status
    ).toBe(201);
    expect((await request('/examinations/report-cards/' + card, parent)).status).toBe(200);
    expect((await request('/examinations/report-cards/' + card, otherParent)).status).toBe(403);
    const snapshot = (await request('/examinations/report-cards/' + card, parent)).body;
    expect(snapshot.gradeSnapshot).toHaveLength(1);
    expect(snapshot.grades[0].score).toBe(0);
    const laterExam = await db.examination.create({ data: { tenantId: tenant, name: 'Later published assessment', classId: cls, termId: term, isPublished: true } });
    await db.grade.create({ data: { tenantId: tenant, studentId: child, examinationId: laterExam.id, subjectId: subject, score: 100, totalMarks: 100, percentage: 100 } });
    const frozen = (await request('/examinations/report-cards/' + card, parent)).body;
    expect(frozen.grades).toHaveLength(1); expect(frozen.averagePercentage).toBe(0);
  });
  let invoice: string;
  it('accepts real invoice item DTOs and serializes concurrent term invoicing', async () => {
    const results = await Promise.all([createInvoice(), createInvoice()]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    invoice = results.find((r) => r.status === 201)!.body.id;
    expect((await request('/fees/invoices/' + invoice, parent)).status).toBe(200);
    expect((await request('/fees/invoices/' + invoice, otherParent)).status).toBe(403);
    expect((await request('/fees/invoices', teacher)).status).toBe(403);
  });
  it('makes simultaneous full-payment retries idempotent without double collection', async () => {
    const payment = { invoiceId: invoice, amount: 10000, reference: id(), paymentMethod: 'CASH' };
    const results = await Promise.all([
      request('/fees/payments', principal, 'POST', payment),
      request('/fees/payments', principal, 'POST', payment),
    ]);
    expect(results.map((r) => r.status)).toEqual([201, 201]);
    expect(results[0].body.id).toBe(results[1].body.id);
    expect((await request('/fees/invoices/' + invoice)).body.balanceAmount).toBe(0);
    expect(
      (await request('/fees/invoices/' + invoice + '/cancel', principal, 'PATCH')).status
    ).toBe(400);
  });
  it('serializes cancellation against collection without cancelled paid invoices', async () => {
    const term = await newTerm();
    const created = await createInvoice(child, term.id);
    const invoiceId = created.body.id;
    const results = await Promise.all([
      request('/fees/invoices/' + invoiceId + '/cancel', principal, 'PATCH'),
      request('/fees/payments', principal, 'POST', {
        invoiceId,
        amount: 10000,
        reference: id(),
        paymentMethod: 'CASH',
      }),
    ]);
    expect(results.filter((r) => r.status >= 200 && r.status < 300)).toHaveLength(1);
    const saved = (await request('/fees/invoices/' + invoiceId)).body;
    expect(saved.status === 'CANCELLED' ? saved.paidAmount : saved.balanceAmount).toBe(0);
  });
  it('keeps private activity hidden and behavior notification flags reflect actual inbox delivery', async () => {
    expect(
      (
        await request('/activity-feed', teacher, 'POST', {
          studentId: child,
          activityType: 'OTHER',
          title: 'Invalid visibility',
          isVisibleToParents: 'false',
        })
      ).status
    ).toBe(400);
    const activity = await request('/activity-feed', teacher, 'POST', {
      studentId: child,
      activityType: 'OTHER',
      title: 'Private observation',
      isVisibleToParents: false,
    });
    expect(activity.status).toBe(201);
    expect(
      (await request('/workspace/notifications', parent)).body.some(
        (m: any) => m.title === 'Classroom activity'
      )
    ).toBe(false);
    expect((await request('/activity-feed/' + activity.body.id, otherTeacher)).status).toBe(403);
    expect(
      (
        await request('/activity-feed/' + activity.body.id, teacher, 'PATCH', {
          isVisibleToParents: true,
        })
      ).status
    ).toBe(200);
    expect(
      (await request('/workspace/notifications', parent)).body.some(
        (m: any) => m.title === 'Classroom activity'
      )
    ).toBe(true);
    const behavior = await request('/behavior', teacher, 'POST', {
      studentId: child,
      behaviorType: 'POSITIVE',
      category: 'OTHER',
      title: 'Helpful student',
      incidentDate: '2026-11-17',
      parentNotified: true,
    });
    expect(behavior.status).toBe(201);
    expect(behavior.body.parentNotified).toBe(true);
    expect(
      (await request('/workspace/notifications', parent)).body.some(
        (m: any) => m.title === 'Student wellbeing update'
      )
    ).toBe(true);
  });
  let privateChannel: string, otherChannel: string, privateMessage: string;
  it('initializes default chat channels once without giving parents access to the staff room', async () => {
    const results = await Promise.all([
      request('/chat/channels', parent),
      request('/chat/channels', teacher),
    ]);
    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(results[0].body.some((c: any) => c.name === 'Staff Room')).toBe(false);
    const room = results[1].body.find((c: any) => c.name === 'Staff Room');
    expect(room).toBeDefined();
    expect((await request('/chat/channels/' + room.id + '/messages', parent)).status).toBe(403);
    expect(await db.chatChannel.count({ where: { tenantId: tenant } })).toBe(4);
  });
  it('validates channel members against tenant and restricts private reads, writes and reactions', async () => {
    expect(
      (
        await request('/chat/channels', teacher, 'POST', {
          name: 'Invalid members',
          memberUserIds: [outsider],
        })
      ).status
    ).toBe(400);
    const result = await request('/chat/channels', teacher, 'POST', {
      name: 'Private teaching group',
      memberUserIds: [otherTeacher],
    });
    expect(result.status).toBe(201);
    privateChannel = result.body.id;
    const sent = await request('/chat/channels/' + privateChannel + '/messages', teacher, 'POST', {
      content: 'Private class note',
    });
    expect(sent.status).toBe(201);
    privateMessage = sent.body.id;
    expect((await request('/chat/channels/' + privateChannel + '/messages', parent)).status).toBe(
      403
    );
    expect(
      (
        await request('/chat/channels/' + privateChannel + '/messages', parent, 'POST', {
          content: 'Forged',
        })
      ).status
    ).toBe(403);
    expect(
      (
        await request(
          '/chat/channels/' + privateChannel + '/messages/' + privateMessage + '/reactions',
          parent,
          'POST',
          { emoji: '👍' }
        )
      ).status
    ).toBe(403);
    const second = await request('/chat/channels', teacher, 'POST', { name: 'Other group' });
    otherChannel = second.body.id;
    expect(
      (
        await request('/chat/channels/' + otherChannel + '/messages', teacher, 'POST', {
          content: 'Forged reply',
          replyToId: privateMessage,
        })
      ).status
    ).toBe(400);
  });
  it('returns the latest bounded chat history and preserves simultaneous reactions', async () => {
    for (const content of ['second', 'third'])
      expect(
        (
          await request('/chat/channels/' + privateChannel + '/messages', teacher, 'POST', {
            content,
          })
        ).status
      ).toBe(201);
    const history = await request(
      '/chat/channels/' + privateChannel + '/messages?limit=2',
      teacher
    );
    expect(history.body.map((m: any) => m.content)).toEqual(['second', 'third']);
    expect(
      (await request('/chat/channels/' + privateChannel + '/messages?limit=-1', teacher)).status
    ).toBe(400);
    await Promise.all(
      [teacher, otherTeacher].map((u) =>
        request(
          '/chat/channels/' + privateChannel + '/messages/' + privateMessage + '/reactions',
          u,
          'POST',
          { emoji: '👍' }
        )
      )
    );
    expect(
      (await db.chatMessage.findUniqueOrThrow({ where: { id: privateMessage } })).reactions
    ).toEqual({ '👍': expect.arrayContaining([teacher, otherTeacher]) });
  });
  it('keeps family contacts limited to staff and direct conversations single-instance under retry', async () => {
    const contacts = await request('/chat/contacts', parent);
    expect(contacts.body.some((u: any) => ['PARENT', 'STUDENT'].includes(u.role))).toBe(false);
    expect(
      (await request('/chat/direct', parent, 'POST', { targetUserId: otherParent })).status
    ).toBe(403);
    const results = await Promise.all(
      [1, 2].map(() => request('/chat/direct', parent, 'POST', { targetUserId: teacher }))
    );
    expect(results.every((r) => r.status === 201)).toBe(true);
    expect(results[0].body.channelId).toBe(results[1].body.channelId);
  });
  it('signs real QR JWTs and binds scans and session metadata to the actor', async () => {
    const created = await request('/attendance/qr/generate-token', teacher, 'POST', {
      classId: cls,
      type: 'class_attendance',
    });
    expect(created.status).toBe(201);
    expect(jwt.verify(created.body.token).classId).toBe(cls);
    expect(
      (await request('/attendance/qr/session/' + created.body.sessionId, otherTeacher)).status
    ).toBe(401);
    expect(
      (
        await request('/attendance/qr/scan', studentUser, 'POST', {
          token: created.body.token,
          studentId: otherChild,
        })
      ).status
    ).toBe(403);
  });
  it('rejects nonexistent calendar dates and cross-class student timetables', async () => {
    expect((await request('/attendance/students/single', principal, 'POST', {
      studentId: child, date: '2026-02-30', status: 'PRESENT',
    })).status).toBe(400);
    expect((await request('/attendance/students?date=2026-02-30', principal)).status).toBe(400);
    expect((await request('/attendance/staff/single', principal, 'POST', {
      staffId: staff, date: '2026-02-30', status: 'PRESENT',
    })).status).toBe(400);
    expect(
      (
        await request('/workspace/events', principal, 'POST', {
          data: {
            title: 'Invalid date',
            eventType: 'HOLIDAY',
            category: 'HOLIDAY',
            startDate: '2027-02-30',
            endDate: '2027-03-02',
          },
        })
      ).status
    ).toBe(400);
    expect((await request('/timetable/class/' + otherClass, studentUser)).status).toBe(403);
    expect((await request('/timetable/class/' + cls, studentUser)).status).toBe(200);
  });
  it('restricts guardian directories to assigned classes and omits sensitive staff identity fields', async () => {
    const directory = await request('/guardians', teacher);
    expect(directory.status).toBe(200);
    expect(directory.body.map((g: any) => g.id)).toEqual([guardian]);
    expect((await request('/guardians/' + otherGuardian, teacher)).status).toBe(404);
    const people = await request('/staff', teacher);
    expect(people.status).toBe(200);
    expect(
      people.body.data.every(
        (s: any) => !('panNumber' in s) && !('aadhaarLast4' in s) && !('address' in s)
      )
    ).toBe(true);
  });
  it('binds payment initiation and status to the linked family and keeps UPI intents pending', async () => {
    const t = await newTerm();
    const inv = await createInvoice(child, t.id);
    const payload = { invoiceId: inv.body.id, amount: 10000, gateway: 'UPI' };
    expect((await request('/payments-gateway/initiate', otherParent, 'POST', payload)).status).toBe(
      403
    );
    const order = await request('/payments-gateway/initiate', parent, 'POST', payload);
    expect(order.status).toBe(201);
    expect(order.body.upiIntentUri).toContain('pa=fixture-school%40upi');
    expect(
      (
        await request('/payments-gateway/status', otherParent, 'POST', {
          gatewayOrderId: order.body.gatewayOrderId,
        })
      ).status
    ).toBe(403);
    const status = await request('/payments-gateway/status', parent, 'POST', {
      gatewayOrderId: order.body.gatewayOrderId,
    });
    expect(status.status).toBe(201);
    expect(status.body.status).toBe('PENDING');
    expect((await request('/fees/invoices/' + inv.body.id)).body.paidAmount).toBe(0);
  });
  it('keeps billed school routing after a pupil transfers and blocks cross-school reconciliation', async () => {
    const schoolB = await db.school.create({ data: { tenantId: tenant, name: 'Separate receiving school', schoolType: 'PRIVATE',
      educationLevel: ['PRIMARY'], address: 'Test', city: 'Test', email: 'separate@example.test', phone: '0000000000' } });
    const classB = await db.class.create({ data: { tenantId: tenant, schoolId: schoolB.id, name: 'Separate class',
      level: 'Class 1', educationLevel: 'PRIMARY' } });
    const settings = { expectedAccountId: '', merchantName: 'Separate school fees', razorpayEnabled: false, upiVpa: 'separate-school@upi' };
    expect((await request('/payments-gateway/school-accounts/' + schoolB.id, parent, 'PUT', settings)).status).toBe(403);
    const configured = await request('/payments-gateway/school-accounts/' + schoolB.id, principal, 'PUT', settings);
    expect(configured.status).toBe(200);
    expect(configured.body).not.toHaveProperty('razorpayKeySecret');
    const oldTerm = await newTerm(), nextTerm = await newTerm();
    const original = await db.student.findUniqueOrThrow({ where: { id: child } });
    const oldInvoice = await createInvoice(child, oldTerm.id);
    expect(oldInvoice.body.paymentSchoolId).toBe(school);
    try {
      await db.student.update({ where: { id: child }, data: { currentClassId: classB.id, currentStreamId: null } });
      const nextInvoice = await createInvoice(child, nextTerm.id);
      expect(nextInvoice.body.paymentSchoolId).toBe(schoolB.id);
      const oldOrder = await request('/payments-gateway/initiate', parent, 'POST', { invoiceId: oldInvoice.body.id, gateway: 'UPI', amount: 10000 });
      const newOrder = await request('/payments-gateway/initiate', parent, 'POST', { invoiceId: nextInvoice.body.id, gateway: 'UPI', amount: 10000 });
      expect(oldOrder.status).toBe(201); expect(newOrder.status).toBe(201);
      expect(oldOrder.body.upiIntentUri).toContain('pa=fixture-school%40upi');
      expect(newOrder.body.upiIntentUri).toContain('pa=separate-school%40upi');
      const stored = await db.paymentGatewayTransaction.findFirstOrThrow({ where: { gatewayOrderId: newOrder.body.gatewayOrderId } });
      expect(stored.paymentAccountId).toBe(configured.body.id);
      expect((await request('/payments-gateway/options?invoiceId=' + nextInvoice.body.id, otherParent)).status).toBe(403);
      expect((await request('/payments-gateway/reconcile/manual', principal, 'POST', { transactionId: stored.id, invoiceId: oldInvoice.body.id })).status).toBe(400);
      expect(await db.payment.count({ where: { invoiceId: oldInvoice.body.id } })).toBe(0);
      expect(await db.payment.count({ where: { invoiceId: nextInvoice.body.id } })).toBe(0);
      expect((await request('/payments-gateway/school-accounts/' + schoolB.id, principal, 'PUT', settings)).status).toBe(409);
    } finally {
      await db.student.update({ where: { id: child }, data: { currentClassId: original.currentClassId, currentStreamId: original.currentStreamId } });
    }
  });
  it('commits captured gateway settlement and fee allocation atomically, including webhook retries', async () => {
    const t = await newTerm();
    const inv = await createInvoice(child, t.id);
    const order = await db.paymentGatewayTransaction.create({
      data: {
        tenantId: tenant,
        gateway: 'RAZORPAY',
        transactionType: 'RAZORPAY_ORDER',
        gatewayOrderId: 'order_' + id().replace(/-/g, ''),
        amount: 10000,
        currency: 'INR',
        accountReference: inv.body.id,
        invoiceId: inv.body.id,
        initiatedBy: parent,
      },
    });
    const payload = {
      entity: 'event',
      account_id: 'acc_fixture',
      contains: ['payment'],
      created_at: Math.floor(Date.now() / 1000),
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_' + id(),
            order_id: order.gatewayOrderId!,
            amount: 10000,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    };
    // Real provider envelope and noncanonical JSON bytes through the public HTTP endpoint.
    const raw = JSON.stringify(payload, null, 2);
    const signature = createHmac('sha256', secret).update(raw).digest('hex');
    const deliver = (body: string, signed: string) => fetch(base + '/payments-gateway/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': signed, Connection: 'close' },
      body,
    });
    const rejected = await deliver(raw + ' ', signature);
    expect(rejected.status).toBe(401);
    await rejected.text();
    expect(await db.payment.count({ where: { invoiceId: inv.body.id } })).toBe(0);
    const results = await Promise.all([1, 2].map(() => deliver(raw, signature)));
    for (const result of results) {
      expect(result.status).toBe(200);
      expect(await result.json()).toEqual({ received: true });
    }
    const saved = await db.paymentGatewayTransaction.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.isReconciled).toBe(true);
    expect(saved.paymentId).toBeTruthy();
    expect(await db.payment.count({ where: { invoiceId: inv.body.id } })).toBe(1);
    expect((await request('/fees/invoices/' + inv.body.id)).body.balanceAmount).toBe(0);
  });
  it('rolls back gateway completion when the ledger write fails, so delivery can be retried', async () => {
    const t = await newTerm();
    const inv = await createInvoice(child, t.id);
    const order = await db.paymentGatewayTransaction.create({
      data: {
        tenantId: tenant,
        gateway: 'RAZORPAY',
        transactionType: 'RAZORPAY_ORDER',
        gatewayOrderId: 'order_' + id().replace(/-/g, ''),
        amount: 10000,
        currency: 'INR',
        accountReference: inv.body.id,
        invoiceId: inv.body.id,
        initiatedBy: parent,
      },
    });
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_' + id(),
            order_id: order.gatewayOrderId!,
            amount: 10000,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    };
    const fees = app.get(FeesService),
      service = app.get(PaymentsGatewayService);
    const fault = jest
      .spyOn(fees, 'recordPayment')
      .mockRejectedValueOnce(new Error('Simulated ledger connection failure'));
    try {
      await expect(inTenant(() => service.handleWebhook(payload))).rejects.toThrow(
        'Simulated ledger connection failure'
      );
    } finally {
      fault.mockRestore();
    }
    expect(
      (await db.paymentGatewayTransaction.findUniqueOrThrow({ where: { id: order.id } }))
        .callbackReceived
    ).toBe(false);
    expect((await request('/fees/invoices/' + inv.body.id)).body.paidAmount).toBe(0);
    await inTenant(() => service.handleWebhook(payload));
    expect((await request('/fees/invoices/' + inv.body.id)).body.paidAmount).toBe(10000);
  });
  it('creates student records with real date-only form values and handles duplicate admission numbers', async () => {
    const admissionNumber = 'QA' + id().replace(/-/g, '').slice(0, 12).toUpperCase();
    const payload = { admissionNumber, firstName: 'New', lastName: 'Student', dateOfBirth: '2020-02-01', gender: 'FEMALE', admissionDate: '2026-04-01', currentClassId: cls, guardians: [{ guardianId: guardian, firstName: 'Test', lastName: 'Parent', phone: '9847012345', relationship: 'MOTHER' }] };
    const created = await request('/students', principal, 'POST', payload);
    expect(created.status).toBe(201); expect(created.body.dateOfBirth.slice(0,10)).toBe('2020-02-01');
    expect((await request('/students', principal, 'POST', payload)).status).toBe(409);
    expect((await request('/students', principal, 'POST', { ...payload, admissionNumber: admissionNumber + 'X', dateOfBirth: '2020-02-30' })).status).toBe(400);
    expect((await request('/students/' + created.body.id, principal, 'PATCH', { dateOfBirth: '2020-02-02' })).status).toBe(200);
    await request('/students/' + created.body.id + '/assign-class', principal, 'POST', { classId: cls });
    await request('/students/' + created.body.id + '/assign-class', principal, 'POST', { classId: cls });
    expect(await db.enrollment.count({ where: { tenantId: tenant, studentId: created.body.id } })).toBe(1);
  });
  it('shares class chats with current families and revokes access after a class change', async () => {
    const result = await request('/chat/channels', teacher, 'POST', { name: 'Class learning', type: 'CLASS', classId: cls });
    expect(result.status).toBe(201); const channelId = result.body.id;
    expect((await request('/chat/channels', parent)).body.some((c: any) => c.id === channelId)).toBe(true);
    expect((await request('/chat/channels/' + channelId + '/messages', parent)).status).toBe(200);
    expect((await request('/chat/channels/' + channelId + '/messages', otherParent)).status).toBe(403);
    expect((await request('/chat/channels', teacher, 'POST', { name: 'Wrong class', type: 'CLASS', classId: otherClass })).status).toBe(403);
    await db.student.update({ where: { id: child }, data: { currentClassId: otherClass } });
    // The new enrollment from the previous test still belongs to this family;
    // revoke its link too before checking that stored channel membership grants nothing.
    const links = await db.guardianStudentLink.findMany({ where: { guardianId: guardian }, select: { studentId: true } });
    for (const link of links) await db.student.update({ where: { id: link.studentId }, data: { currentClassId: otherClass } });
    expect((await request('/chat/channels/' + channelId + '/messages', parent)).status).toBe(403);
    expect((await request('/chat/channels', parent)).body.some((c: any) => c.id === channelId)).toBe(false);
  });

  it('preserves teacher access after a partial staff edit',async()=>{
    expect((await request('/workspace/staff/'+staff,principal,'PATCH',{data:{phone:'9847012345'}})).status).toBe(200);
    expect((await db.staff.findUniqueOrThrow({where:{id:staff}})).isTeacher).toBe(true);
  });

  it('uploads chat files through membership checks and signs private links when messages are read',async()=>{
    const created=await request('/chat/channels',teacher,'POST',{name:'Private attachment test',type:'GROUP',memberUserIds:[parent]});
    expect(created.status).toBe(201);const channelId=created.body.id;
    const upload=async(userId:string,bytes:string)=>{
      const body=new FormData();body.append('file',new Blob([bytes],{type:'application/pdf'}),'class-notes.pdf');
      const response=await fetch(base+'/chat/channels/'+channelId+'/attachments',{method:'POST',body,headers:{Authorization:'Bearer '+jwt.sign({sub:userId,ver:0,type:'access'},{expiresIn:'5m'}),Connection:'close'}});
      return {status:response.status,body:await response.json() as {name:string;type:string;size:number;storageKey:string;url:string}};
    };
    expect((await upload(otherParent,'%PDF-1.4 fixture')).status).toBe(403);
    expect((await upload(teacher,'invalid bytes')).status).toBe(400);
    const uploaded=await upload(teacher,'%PDF-1.4 fixture');expect(uploaded.status).toBe(201);
    expect(uploaded.body.url).toBe('');
    const sent=await request('/chat/channels/'+channelId+'/messages',teacher,'POST',{content:'Class notes',attachments:[uploaded.body]});
    expect(sent.status).toBe(201);expect(sent.body.attachments[0].url).toContain('?signed=fixture');
    const stored=await db.chatMessage.findUniqueOrThrow({where:{id:sent.body.id}});
    expect((stored.attachments as any)[0].url).toBe('');
    const read=await request('/chat/channels/'+channelId+'/messages',parent);expect(read.status).toBe(200);expect(read.body[0].attachments[0].url).toContain('?signed=fixture');
    expect((await request('/chat/channels/'+channelId+'/messages',otherParent)).status).toBe(403);
    expect((await request('/chat/channels/'+channelId+'/messages',teacher,'POST',{content:'Invalid scope',attachments:[{...uploaded.body,storageKey:uploaded.body.storageKey.replace('chat-'+channelId,'chat-'+id())}]})).status).toBe(400);
    expect((await request('/chat/channels/'+channelId+'/messages',teacher,'POST',{content:'Invalid attachment',attachments:[null]})).status).toBe(400);
  });

  it('saves admission enrollment history and prevents duplicate enrollment on retry',async()=>{
    const created=await request('/operations/admissions',principal,'POST',{data:{schoolId:school,firstName:'Admitted',lastName:'Child',dateOfBirth:'2020-02-01',gender:'FEMALE',grade:'Class 1',guardianName:'New Parent',guardianEmail:'new-parent@example.test',guardianPhone:'9847012345'}});
    expect(created.status).toBe(201);
    const applicationId=created.body.id;
    expect((await request('/operations/admissions/'+applicationId+'/accept',principal,'POST',{data:{}})).status).toBe(201);
    expect((await request('/operations/admissions/'+applicationId+'/admit',principal,'POST',{data:{classId:cls,admissionNumber:'FLOW-'+id()}})).status).toBe(201);
    const application=await db.admissionRecord.findUniqueOrThrow({where:{id:applicationId}});
    expect(application.stage).toBe('ADMITTED');
    const access=application.portalAccess as any;
    expect(access.parent.status).toBe('SENT');expect(access.student.status).toBe('SENT');
    const admitted=await db.student.findUniqueOrThrow({where:{id:application.studentId!},include:{guardianLinks:{include:{guardian:true}}}});
    expect(admitted.userId).toBe(access.student.userId);
    expect(admitted.guardianLinks[0].guardian.userId).toBe(access.parent.userId);
    expect((await request('/operations/options',access.parent.userId)).body.students.map((s:any)=>s.id)).toContain(admitted.id);
    expect((await request('/operations/options',access.student.userId)).body.students.map((s:any)=>s.id)).toEqual([admitted.id]);
    expect(await db.enrollment.findMany({where:{studentId:application.studentId!}})).toEqual([expect.objectContaining({tenantId:tenant,classId:cls,academicYearId:year})]);
    expect((await request('/operations/admissions/'+applicationId+'/admit',principal,'POST',{data:{classId:cls,admissionNumber:'RETRY-'+id()}})).status).toBe(409);
    expect(await db.enrollment.count({where:{studentId:application.studentId!}})).toBe(1);
  });

  it('keeps school directory class changes and enrollment history consistent',async()=>{
    const created=await request('/workspace/students',principal,'POST',{data:{admissionNumber:'DIRECTORY-'+id(),firstName:'Directory',lastName:'Learner',dateOfBirth:'2020-01-01',admissionDate:'2026-04-01',gender:'FEMALE',currentClassId:cls}});
    expect(created.status).toBe(201);
    const studentId=created.body.id;
    expect(await db.enrollment.count({where:{studentId}})).toBe(1);
    const stream=await db.stream.create({data:{tenantId:tenant,schoolId:school,classId:cls,name:'History '+id(),capacity:30}});
    expect((await request('/workspace/streams/'+stream.id,principal,'PATCH',{data:{name:'Updated stream'}})).status).toBe(200);
    await db.student.update({where:{id:studentId},data:{currentStreamId:stream.id}});
    const transfers=await Promise.all([1,2].map(()=>request('/workspace/students/'+studentId,principal,'PATCH',{data:{currentClassId:otherClass}})));
    expect(transfers.map(r=>r.status)).toEqual([200,200]);
    expect(await db.student.findUniqueOrThrow({where:{id:studentId}})).toMatchObject({currentClassId:otherClass,currentStreamId:null});
    expect(await db.enrollment.count({where:{studentId,classId:otherClass}})).toBe(1);
    expect((await request('/workspace/students/'+studentId,principal,'PATCH',{data:{currentClassId:null}})).status).toBe(200);
    expect(await db.student.findUniqueOrThrow({where:{id:studentId}})).toMatchObject({currentClassId:null,currentStreamId:null});
    expect(await db.enrollment.count({where:{studentId}})).toBe(2);
    expect((await request('/students/'+studentId,principal,'PATCH',{currentClassId:cls})).status).toBe(200);
    expect(await db.enrollment.count({where:{studentId}})).toBe(2);
    expect((await request('/students/'+studentId,principal,'PATCH',{currentClassId:otherClass,currentStreamId:stream.id})).status).toBe(400);
  });

  it('provides scoped portal choices and lets reception staff link or remove parent accounts',async()=>{
    const receptionist=id();
    await db.user.create({data:{id:receptionist,tenantId:tenant,email:receptionist+'@example.test',firstName:'Reception',lastName:'Staff',role:'RECEPTIONIST',passwordHash:'unused'}});
    const additionalStudent=id(),inactiveStudent=id(),foreignStudent=id();
    await db.user.createMany({data:[
      {id:additionalStudent,tenantId:tenant,isActive:true},
      {id:inactiveStudent,tenantId:tenant,isActive:false},
      {id:foreignStudent,tenantId:foreignTenant,isActive:true},
    ].map(account=>({...account,email:account.id+'@example.test',firstName:'Directory',lastName:'Student',role:'STUDENT' as const,passwordHash:'unused'}))});
    const choices=await request('/workspace/guardian-accounts',receptionist);
    expect(choices.status).toBe(200);
    expect(choices.body.every((u:any)=>u.role==='PARENT'&&!('passwordHash' in u))).toBe(true);
    expect(choices.body.map((u:any)=>u.id)).toContain(parent);
    expect((await request('/workspace/staff-accounts',receptionist)).status).toBe(403);
    const studentChoices=await request('/workspace/student-accounts',receptionist);
    expect(studentChoices.status).toBe(200);
    expect(studentChoices.body.every((u:any)=>u.role==='STUDENT'&&!('passwordHash' in u))).toBe(true);
    const studentChoiceIds=studentChoices.body.map((u:any)=>u.id);
    expect(studentChoiceIds).toEqual(expect.arrayContaining([studentUser,additionalStudent]));
    expect(studentChoiceIds).not.toContain(inactiveStudent);
    expect(studentChoiceIds).not.toContain(foreignStudent);
    expect(studentChoiceIds).not.toContain(parent);
    expect((await request('/workspace/guardian-accounts',parent)).status).toBe(403);
    const created=await request('/workspace/guardians',receptionist,'POST',{data:{firstName:'New',lastName:'Guardian',phone:'9847012345',email:'clear@example.test',userId:parent}});
    expect(created.status).toBe(201);
    expect((await request('/workspace/guardians/'+created.body.id,receptionist,'PATCH',{data:{email:null,userId:null}})).status).toBe(200);
    expect(await db.guardian.findUniqueOrThrow({where:{id:created.body.id}})).toMatchObject({email:null,userId:null});
  });

  it('lets operational staff open their own support requests without editing other staff tickets',async()=>{
    const receptionist=await db.user.findFirstOrThrow({where:{tenantId:tenant,role:'RECEPTIONIST'}});
    const created=await request('/workspace/tickets',receptionist.id,'POST',{data:{subject:'Portal access',description:'Please check our portal account.',priority:'HIGH'}});
    expect(created.status).toBe(201);
    const adminTicket=await request('/workspace/tickets',principal,'POST',{data:{subject:'Admin support',description:'Admin details'}});
    expect(adminTicket.status).toBe(201);
    const own=await request('/workspace/tickets',receptionist.id);
    expect(own.body.map((ticket:any)=>ticket.id)).toEqual([created.body.id]);
    expect((await request('/workspace/tickets/'+adminTicket.body.id,receptionist.id,'PATCH',{data:{subject:'Unauthorized'}})).status).toBe(404);
    expect((await request('/workspace/tickets',parent,'POST',{data:{subject:'Denied',description:'Denied'}})).status).toBe(403);
  });

  it('checks partial calendar edits against the saved date range',async()=>{
    const event=await request('/workspace/events',principal,'POST',{data:{title:'Range test',eventType:'ACADEMIC',category:'ACADEMIC',startDate:'2027-01-10',endDate:'2027-01-12'}});
    expect(event.status).toBe(201);
    expect((await request('/workspace/events/'+event.body.id,principal,'PATCH',{data:{startDate:'2027-01-13'}})).status).toBe(400);
    expect((await request('/workspace/events/'+event.body.id,principal,'PATCH',{data:{endDate:'2027-01-09'}})).status).toBe(400);
    expect((await request('/workspace/events/'+event.body.id,principal,'PATCH',{data:{endDate:'2027-01-15'}})).status).toBe(200);
  });

  it('keeps library stock correct under concurrent borrowing and repeated returns',async()=>{
    const book=await request('/workspace/books',principal,'POST',{data:{title:'One copy',author:'Author',quantity:1}});
    expect(book.status).toBe(201);
    const borrowing=()=>request('/workspace/borrowings',principal,'POST',{data:{bookId:book.body.id,borrowerId:child,dueDate:'2030-01-01'}});
    const results=await Promise.all([borrowing(),borrowing()]);
    expect(results.map(r=>r.status).sort()).toEqual([201,400]);
    const loan=results.find(r=>r.status===201)!.body;
    const list=await request('/workspace/borrowings',principal);
    expect(list.body.find((r:any)=>r.id===loan.id).borrowerName).toBeTruthy();
    expect(list.body.find((r:any)=>r.id===loan.id).borrowerName).not.toBe(child);
    await Promise.all([1,2].map(()=>request('/workspace/borrowings/'+loan.id+'/return',principal,'POST')));
    expect(await db.book.findUniqueOrThrow({where:{id:book.body.id}})).toMatchObject({available:1,quantity:1});
    expect((await request('/workspace/books/'+book.body.id,principal,'PATCH',{data:{author:null}})).status).toBe(200);
  });

  it('connects saved transport setup to student assignments, trips and family tracking',async()=>{
    const vehicle=await request('/workspace/vehicles',principal,'POST',{data:{registrationNumber:'QA-'+id(),capacity:20,status:'ACTIVE'}});
    expect(vehicle.status).toBe(201);
    const route=await request('/workspace/routes',principal,'POST',{data:{name:'Saved route',vehicleId:vehicle.body.id}});
    expect(route.status).toBe(201);
    const savedRoutes=await request('/operations-transport/routes',principal);
    expect(savedRoutes.body.find((r:any)=>r.id===route.body.id).vehicle.id).toBe(vehicle.body.id);
    const stop=await request('/operations-transport/stops',principal,'POST',{data:{routeId:route.body.id,name:'Home stop',sequence:1,latitude:9.95,longitude:76.34,scheduledTime:'08:00'}});
    expect(stop.status).toBe(201);
    expect((await request('/operations/travel-assignments',principal,'POST',{data:{studentId:child,routeId:route.body.id,stopId:stop.body.id}})).status).toBe(201);
    const trip=await request('/operations-transport/trips',principal,'POST',{data:{routeId:route.body.id,direction:'MORNING_PICKUP'}});
    expect(trip.status).toBe(201);
    expect((await request('/operations-transport/trips/'+trip.body.id+'/location',principal,'POST',{data:{latitude:9.95,longitude:76.34,accuracy:10,speed:20}})).status).toBe(201);
    expect((await request('/operations-transport/tracking/'+child,parent)).body).toMatchObject({assignment:{routeName:'Saved route'},trip:{id:trip.body.id,latitude:9.95,longitude:76.34}});
    expect((await request('/operations-transport/tracking/'+child,otherParent)).status).toBe(403);
    expect((await request('/operations-transport/trips/'+trip.body.id+'/passenger',principal,'POST',{data:{studentId:child,status:'BOARDED'}})).status).toBe(201);
    expect((await request('/operations-transport/trips/'+trip.body.id+'/end',principal,'POST')).status).toBe(409);
    expect((await request('/operations-transport/trips/'+trip.body.id+'/passenger',principal,'POST',{data:{studentId:child,status:'DROPPED'}})).status).toBe(201);
    expect((await request('/operations-transport/trips/'+trip.body.id+'/end',principal,'POST')).status).toBe(201);
    expect((await request('/operations-transport/tracking/'+child,parent)).body.trip).toBeNull();
  });

  it('saves zero inventory counts and rejects negative stock',async()=>{
    const item=await request('/workspace/inventory',principal,'POST',{data:{name:'Art supplies',quantity:5,reorderLevel:2}});
    expect(item.status).toBe(201);
    expect((await request('/workspace/inventory/'+item.body.id,principal,'PATCH',{data:{quantity:0}})).status).toBe(200);
    expect((await request('/workspace/inventory/'+item.body.id,principal,'PATCH',{data:{quantity:-1}})).status).toBe(400);
    expect(await db.inventoryItem.findUniqueOrThrow({where:{id:item.body.id}})).toMatchObject({quantity:0});
  });

  const browserTest = process.env.SCHOOL_UI_BASE_URL ? it : it.skip;
  browserTest('persists browser-created students and shares saved attendance with the family', async () => {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const errors: string[] = [];
    const output = '../../qa/functionality-real-browser';
    await mkdir(output, { recursive: true });
    async function pageFor(user: string) {
      const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1440, height: 1000 } });
      await context.addInitScript(token => localStorage.setItem('accessToken', token),
        jwt.sign({ sub: user, ver: 0, type: 'access' }, { expiresIn: '10m' }));
      await context.route('**/api/v1/**', async route => {
        const url = new URL(route.request().url());
        const response = await route.fetch({ url: base + url.pathname.replace(/^\/api\/v1/, '') + url.search });
        await route.fulfill({ response });
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      return page;
    }
    try {
      await db.student.update({ where: { id: child }, data: { currentClassId: cls } });
      const page = await pageFor(principal);
      const admissionNumber = 'BROWSER-' + id();
      await page.goto(process.env.SCHOOL_UI_BASE_URL + '/school/students');
      await page.getByRole('button', { name: 'Add student', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Admission no.').fill(admissionNumber);
      await dialog.getByLabel('First name').fill('Browser');
      await dialog.getByLabel('Last name').fill('Learner');
      await dialog.getByLabel('Date of birth').fill('2018-04-12');
      await dialog.getByLabel('Admission date').fill('2026-11-18');
      await dialog.getByLabel('Gender').selectOption('FEMALE');
      await dialog.getByRole('button', { name: /More details/ }).click();
      await dialog.getByLabel('Class', { exact: true }).selectOption(cls);
      await dialog.getByRole('button', { name: 'Create record', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      const pupil = await db.student.findUniqueOrThrow({ where: { tenantId_admissionNumber: { tenantId: tenant, admissionNumber } } });
      expect(pupil.currentClassId).toBe(cls);
      expect(await db.enrollment.count({ where: { tenantId: tenant, studentId: pupil.id } })).toBe(1);
      await page.reload();
      await page.getByRole('searchbox', { name: 'Search Students' }).fill(admissionNumber);
      await page.getByRole('button', { name: 'View Browser Learner', exact: true }).waitFor();
      await page.screenshot({ path: output + '/saved-student.png', fullPage: true });

      const date = '2026-12-11';
      await page.goto(process.env.SCHOOL_UI_BASE_URL + '/school/attendance');
      await page.getByLabel('Class', { exact: true }).selectOption(cls);
      await page.getByLabel('Register date').fill(date);
      await page.getByLabel('Attendance for Browser Learner', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Mark all present', exact: true }).click();
      await page.getByRole('button', { name: 'Save register', exact: true }).click();
      await page.getByRole('status').filter({ hasText: 'records saved successfully' }).waitFor();
      expect(await db.attendanceRecord.count({ where: { tenantId: tenant, studentId: { in: [child, pupil.id] }, date: new Date(date), status: 'PRESENT' } })).toBe(2);
      await page.reload();
      await page.getByLabel('Class', { exact: true }).selectOption(cls);
      await page.getByLabel('Register date').fill(date);
      await page.waitForFunction(() => {
        const input = document.querySelector('select[aria-label="Attendance for Browser Learner"]') as HTMLSelectElement | null;
        return input?.value === 'PRESENT';
      });
      const family = await pageFor(parent);
      await family.goto(process.env.SCHOOL_UI_BASE_URL + '/dashboard/attendance');
      await family.getByLabel('Viewing your child', { exact: true }).selectOption(child);
      await family.getByRole('row').filter({ hasText: /11 Dec 2026|Dec 11, 2026|11 Dec, 2026/ }).filter({ hasText: /present/i }).waitFor();
      await family.screenshot({ path: output + '/family-attendance.png', fullPage: true });
      expect(errors).toEqual([]);
      await writeFile(output + '/results.json', JSON.stringify({
        checks: ['Browser record creation persists with enrollment history', 'Reload reads saved student',
          'Attendance saves through real HTTP into PostgreSQL', 'Reload retains attendance', 'Family sees the same saved attendance'],
        records: 'Real disposable PostgreSQL records; API requests forwarded to authenticated Nest controllers',
        authentication: 'Test-issued JWTs; login-provider delivery is not exercised here', errors,
      }, null, 2));
    } finally { await browser.close(); }
  }, 90000);

  it('grants shared school tools to explicitly assigned preschool teachers and revokes them when unassigned',async()=>{
    await db.timetableEntry.deleteMany({where:{teacherId:staff,tenantId:tenant}});
    await db.preschoolStaffAssignment.create({data:{tenantId:tenant,classId:cls,staffId:staff}});
    expect((await request('/workspace/classes',teacher)).body.map((row:any)=>row.id)).toEqual([cls]);
    expect((await request('/operations/options',teacher)).body.classes.map((row:any)=>row.id)).toEqual([cls]);
    await db.student.update({where:{id:child},data:{currentClassId:cls}});
    expect((await request('/operations/portfolio',teacher,'POST',{data:{studentId:child,title:'Class participation',category:'OTHER',achievedOn:'2026-11-17'}})).status).toBe(201);
    await db.preschoolStaffAssignment.deleteMany({where:{tenantId:tenant,staffId:staff}});
    expect((await request('/workspace/classes',teacher)).body).toEqual([]);
    expect((await request('/operations/options',teacher)).body.classes).toEqual([]);
    expect((await request('/operations/portfolio',teacher,'POST',{data:{studentId:child,title:'Unassigned class',category:'OTHER',achievedOn:'2026-11-17'}})).status).toBe(403);
  });

  it('previews and completes one authenticated school-wide rollover with durable history and safe retries', async () => {
    // This is intentionally last: rollover changes the fixture school's current year.
    await db.academicYear.updateMany({where:{tenantId:tenant},data:{isCurrent:false}});
    await db.academicYear.update({where:{id:year},data:{isCurrent:true,startDate:new Date('2026-01-01'),endDate:new Date('2026-12-31')}});
    await db.student.updateMany({where:{tenantId:tenant,status:'ACTIVE',deletedAt:null},data:{currentClassId:cls,currentStreamId:null}});
    const next=await db.academicYear.create({data:{tenantId:tenant,name:'Rollover target '+id(),startDate:new Date('2027-01-01'),endDate:new Date('2027-12-31')}});
    expect((await request('/academic-rollover/options',parent)).status).toBe(403);
    const options=await request('/academic-rollover/options');expect(options.status).toBe(200);
    expect(options.body.students.length).toBeGreaterThan(1);
    const decisions=options.body.students.map((student:any,index:number)=>({studentId:student.id,action:index===0?'PROMOTE':index===1?'GRADUATE':'RETAIN',...(index!==1?{classId:index===0?otherClass:cls}:{})}));
    const plan={sourceYearId:year,targetYearId:next.id,decisions};
    const preview=await request('/academic-rollover/preview',principal,'POST',plan);expect(preview.status).toBe(201);
    expect(await db.academicYearRollover.count({where:{tenantId:tenant}})).toBe(0);
    const firstStudent=decisions[0].studentId;
    await db.student.update({where:{id:firstStudent},data:{updatedAt:new Date(Date.now()+5000)}});
    expect((await request('/academic-rollover/complete',principal,'POST',{...plan,previewToken:preview.body.previewToken})).status).toBe(409);
    const fresh=await request('/academic-rollover/preview',principal,'POST',plan);expect(fresh.status).toBe(201);
    const approved={...plan,previewToken:fresh.body.previewToken};
    const complete=await request('/academic-rollover/complete',principal,'POST',approved);expect(complete.status).toBe(201);
    expect(complete.body.summary.total).toBe(decisions.length);
    const repeat=await request('/academic-rollover/complete',principal,'POST',approved);
    expect(repeat.status).toBe(201);expect(repeat.body.alreadyCompleted).toBe(true);expect(repeat.body.id).toBe(complete.body.id);
    expect(await db.enrollment.count({where:{tenantId:tenant,academicYearId:next.id}})).toBe(decisions.length-1);
    expect(await db.enrollment.count({where:{tenantId:tenant,academicYearId:year,studentId:firstStudent}})).toBeGreaterThan(0);
    expect((await db.student.findUniqueOrThrow({where:{id:decisions[1].studentId}})).status).toBe('GRADUATED');
    expect((await db.academicYear.findUniqueOrThrow({where:{id:next.id}})).isCurrent).toBe(true);
    expect(await db.term.count({where:{tenantId:tenant,isCurrent:true}})).toBe(0);
    expect(await db.academicYearRollover.count({where:{tenantId:tenant,sourceYearId:year}})).toBe(1);
  });
});
