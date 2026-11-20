// Real Nest HTTP, validation, role guards, tenant middleware and PostgreSQL workflows.
// Signed JWTs are validated against real test users, account revocation and tenant resolution.
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const root = path.resolve(__dirname, '..'),
  req = createRequire(path.join(root, 'apps/api/package.json'));
const url = process.env.HRMS_TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test'))
  throw new Error('Set HRMS_TEST_DATABASE_URL to a migrated disposable database ending in _test');
process.env.DATABASE_URL = url;
req('ts-node').register({
  project: path.join(root, 'apps/api/tsconfig.json'),
  transpileOnly: true,
});
req('tsconfig-paths').register({
  baseUrl: path.join(root, 'apps/api'),
  paths: req('./tsconfig.json').compilerOptions.paths,
});
req('reflect-metadata');
const { Test } = req('@nestjs/testing'),
  { Reflector } = req('@nestjs/core'),
  { ValidationPipe, Logger } = req('@nestjs/common');
const { PassportModule } = req('@nestjs/passport'),
  { JwtService } = req('@nestjs/jwt'),
  { ConfigService } = req('@nestjs/config');
const request = req('supertest'),
  { PrismaClient } = req('@prisma/client');
const source = (file) => require(path.join(root, 'apps/api/src', file));
const { HrmsService } = source('modules/hrms/hrms.service.ts'),
  { HrmsController } = source('modules/hrms/hrms.controller.ts');
const { AttendanceService } = source('modules/attendance/attendance.service.ts');
const { AuthService } = source('modules/auth/auth.service.ts');
const { PrismaService } = source('database/prisma.service.ts'),
  { TenantService } = source('database/tenant.service.ts');
const { JwtAuthGuard } = source('common/guards/jwt-auth.guard.ts'),
  { RolesGuard } = source('common/guards/roles.guard.ts');
const { JwtStrategy } = source('modules/auth/strategies/jwt.strategy.ts'),
  { TenantResolutionMiddleware } = source('common/middleware/tenant-resolution.middleware.ts'),
  { HrScopeGuard } = source('modules/hrms/hrms-scope.guard.ts');
const { TransformInterceptor } = source('common/interceptors/transform.interceptor.ts'),
  { HttpExceptionFilter } = source('common/filters/http-exception.filter.ts');
const db = new PrismaClient(),
  tenants = new TenantService(),
  scoped = new PrismaService(tenants),
  checks = [];
const tid = randomUUID(),
  otherTid = randomUUID(),
  fixture = randomUUID().slice(0, 8),
  actors = {};
let app,
  testCount = 0;
const date = (text) => new Date(text + 'T00:00:00Z');
const jwtSecret = randomUUID();
const jwt = new JwtService({ secret: jwtSecret });
const tokenFor = (key) =>
  jwt.sign({ sub: actors[key].id, ver: 0, type: 'access' }, { expiresIn: '15m' });
const check = (label) => {
  checks.push(label);
  console.log('PASS ' + label);
};
(async () => {
  Logger.overrideLogger(['error']);
  await db.tenant.createMany({
    data: [tid, otherTid].map((id, i) => ({
      id,
      name: 'HR fixture ' + i,
      subdomain: 'hr-' + fixture + i,
      contactEmail: 'fixture@example.test',
      contactPhone: '000',
      timezone: 'Asia/Kolkata',
    })),
  });
  for (const [key, role, tenantId] of [
    ['manager', 'PRINCIPAL', tid],
    ['teacher', 'TEACHER', tid],
    ['other', 'TEACHER', tid],
    ['accountant', 'ACCOUNTANT', tid],
    ['librarian', 'LIBRARIAN', tid],
    ['parent', 'PARENT', tid],
    ['foreign', 'TEACHER', otherTid],
    ['candidate', 'TEACHER', tid],
  ]) {
    const u = await db.user.create({
      data: {
        tenantId,
        email: `${key}-${fixture}@example.test`,
        firstName: 'Fixture',
        lastName: key,
        passwordHash: randomUUID(),
        role,
      },
    });
    actors[key] = { ...u, userId: u.id };
    if (!['parent', 'candidate'].includes(key))
      await db.staff.create({
        data: {
          tenantId,
          userId: u.id,
          staffNumber: key.toUpperCase(),
          firstName: u.firstName,
          lastName: u.lastName,
          gender: 'OTHER',
          email: u.email,
          phone: '00000000',
          department:
            role === 'TEACHER'
              ? 'TEACHING'
              : role === 'ACCOUNTANT'
                ? 'FINANCE'
                : role === 'LIBRARIAN'
                  ? 'LIBRARY'
                  : 'ADMINISTRATION',
          position: role,
          employmentType: 'PERMANENT',
          hireDate: date('2026-01-01'),
          isTeacher: role === 'TEACHER',
        },
      });
  }
  const legacyEmployee = await db.employee.create({
    data: {
      tenantId: tid,
      employeeCode: 'TEACHER',
      firstName: 'Fixture',
      lastName: 'teacher',
      email: actors.teacher.email,
      joiningDate: date('2026-01-01'),
      dob: date('1990-01-01'),
      bloodGroup: 'TEST-PRIVATE',
      maritalStatus: 'TEST-PRIVATE',
    },
  });
  const service = new HrmsService(scoped);
  for (const [key, role] of [
    ['reviewer', 'SCHOOL_ADMIN'],
    ['superadmin', 'SUPER_ADMIN'],
    ['student', 'STUDENT'],
    ['owner', 'SCHOOL_OWNER'],
    ['deputy', 'DEPUTY_PRINCIPAL'],
    ['receptionist', 'RECEPTIONIST'],
    ['auditor', 'AUDITOR'],
    ['classTeacher', 'CLASS_TEACHER'],
    ['examOfficer', 'EXAM_OFFICER'],
    ['transportOfficer', 'TRANSPORT_OFFICER'],
  ]) {
    actors[key] = await db.user.create({
      data: {
        tenantId: key === 'superadmin' ? otherTid : tid,
        firstName: 'Security',
        lastName: key,
        email: `${key}-${fixture}@example.test`,
        passwordHash: randomUUID(),
        role,
      },
    });
  }
  const module = await Test.createTestingModule({
    imports: [PassportModule],
    controllers: [HrmsController],
    providers: [
      { provide: HrmsService, useValue: service },
      { provide: TenantService, useValue: tenants },
      { provide: PrismaService, useValue: scoped },
      { provide: ConfigService, useValue: new ConfigService({ JWT_SECRET: jwtSecret }) },
      JwtStrategy,
      HrScopeGuard,
    ],
  }).compile();
  app = module.createNestApplication({ logger: false });
  app.use((http, _res, next) =>
    tenants.run(() => {
      new TenantResolutionMiddleware(scoped, tenants).use(http, _res, next);
    })
  );
  app.setGlobalPrefix('api/v1');
  app.useGlobalGuards(new JwtAuthGuard(new Reflector()), new RolesGuard(new Reflector()));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  const call = async (
    method,
    endpoint,
    body,
    actor = 'manager',
    status = method === 'post' ? 201 : 200
  ) => {
    testCount++;
    let r = request(app.getHttpServer())
      [method]('/api/v1/hrms/' + endpoint)
      .set('Authorization', 'Bearer ' + tokenFor(actor));
    if (body !== undefined) r = r.send(body);
    const result = await r;
    assert.equal(
      result.status,
      status,
      `${method} ${endpoint} as ${actor}: ${JSON.stringify(result.body)}`
    );
    return result.body.data ?? result.body;
  };
  await call('post', 'employees/sync', {});
  await call('post', 'employees/sync', {});
  await call('post', 'employees/sync', {}, 'foreign', 403);
  const employees = await call('get', 'employees');
  assert.equal(employees.length, 5);
  const e = (key) => employees.find((row) => row.userId === actors[key].id);
  assert(e('teacher').staffId);
  assert.equal(e('teacher').id, legacyEmployee.id);
  assert.equal(e('teacher').dob, undefined);
  assert.equal(e('teacher').bloodGroup, undefined);
  assert.equal(await db.employee.count({ where: { tenantId: tid } }), 5);
  assert.equal((await request(app.getHttpServer()).get('/api/v1/hrms/employees')).status, 401);
  const forgedRole = jwt.sign({
    sub: actors.teacher.id,
    ver: 0,
    type: 'access',
    role: 'PRINCIPAL',
  });
  assert.equal(
    (
      await request(app.getHttpServer())
        .get('/api/v1/hrms/employees')
        .set('Authorization', 'Bearer ' + forgedRole)
    ).status,
    403
  );
  const expired = jwt.sign({ sub: actors.teacher.id, ver: 0, type: 'access' }, { expiresIn: -1 });
  assert.equal(
    (
      await request(app.getHttpServer())
        .get('/api/v1/hrms/employees/me')
        .set('Authorization', 'Bearer ' + expired)
    ).status,
    401
  );
  await db.user.update({ where: { id: actors.teacher.id }, data: { role: 'PARENT' } });
  await call('get', 'employees/me', undefined, 'teacher', 403);
  await db.user.update({ where: { id: actors.teacher.id }, data: { role: 'TEACHER' } });
  assert.equal(
    (
      await request(app.getHttpServer())
        .get('/api/v1/hrms/employees')
        .set('Authorization', 'Bearer ' + tokenFor('manager'))
        .set('x-tenant-id', otherTid)
    ).status,
    401
  );
  await call('get', 'employees', undefined, 'student', 403);
  await call('get', 'employees', undefined, 'superadmin', 403);
  const platform = await request(app.getHttpServer())
    .get('/api/v1/hrms/employees')
    .set('Authorization', 'Bearer ' + tokenFor('superadmin'))
    .set('x-tenant-id', tid);
  assert.equal(platform.status, 200);
  assert.equal(platform.body.data.length, 5);
  for (const key of [
    'deputy',
    'receptionist',
    'auditor',
    'classTeacher',
    'examOfficer',
    'transportOfficer',
  ])
    await call('get', 'employees', undefined, key, 403);
  check('Staff sync is idempotent and links active school accounts and teaching staff');
  for (const endpoint of [
    'employees',
    'employees/me',
    'employees/' + e('teacher').id,
    'payroll/payslips',
    'leaves/types',
    'punches/today',
    'exit/resignations',
  ])
    await call('get', endpoint, undefined, 'parent', 403);
  await call('get', 'employees/' + e('other').id, undefined, 'teacher', 403);
  const foreignEmp = await db.employee.create({
    data: {
      tenantId: otherTid,
      userId: actors.foreign.id,
      employeeCode: 'FOREIGN',
      firstName: 'Foreign',
      lastName: 'Fixture',
      email: actors.foreign.email,
    },
  });
  await call('get', 'employees/' + foreignEmp.id, undefined, 'manager', 404);
  await call('get', 'overview', undefined, 'teacher', 403);
  await call('post', 'punch', { employeeId: e('other').id, punchType: 'CHECK_IN' }, 'teacher', 403);
  await call('post', 'punch', { punchType: 'CHECK_IN', tenantId: otherTid }, 'teacher', 400);
  check(
    'Parents, cross-school IDs and employee impersonation are denied by real HTTP guards and validation'
  );
  const master = async (resource, data, actor = 'manager') =>
    call('post', 'masters/' + resource, { data }, actor);
  const shift = await master('shifts', {
    name: 'School day',
    startTime: '09:00',
    endTime: '17:00',
    graceMinutes: 10,
    halfDayMinutes: 240,
    fullDayMinutes: 420,
    isDefault: true,
  });
  await master('departments', { name: 'Learning support' });
  await master('grades', { name: 'Grade A' });
  const setup = await call('get', 'setup');
  const temporaryPassword = 'Hr-' + randomUUID() + 'A1!';
  const accountInput = {
    firstName: 'Additional',
    lastName: 'Teacher',
    email: `additional-${fixture}@example.test`,
    role: 'TEACHER',
    password: temporaryPassword,
  };
  await call('post', 'accounts', accountInput, 'teacher', 403);
  await call('post', 'accounts', { ...accountInput, password: 'weakpass' }, 'manager', 400);
  const schoolLogin = await call('post', 'accounts', accountInput);
  assert.equal(schoolLogin.passwordHash, undefined);
  const storedLogin = await db.user.findUnique({ where: { id: schoolLogin.id } });
  assert.equal(storedLogin.mustChangePassword, true);
  assert.notEqual(storedLogin.passwordHash, temporaryPassword);
  assert(setup.shifts.some((row) => row.id === shift.id));
  await call(
    'post',
    'masters/shifts',
    {
      data: {
        name: 'Night',
        startTime: '22:00',
        endTime: '06:00',
        graceMinutes: 10,
        halfDayMinutes: 240,
      },
    },
    'manager',
    400
  );
  const foreignDept = await db.department.create({
    data: { tenantId: otherTid, name: 'Foreign department' },
  });
  await call(
    'patch',
    'employees/' + e('teacher').id,
    { departmentId: foreignDept.id },
    'manager',
    400
  );
  check(
    'HR setup persists masters and refuses foreign references and unsupported overnight shifts'
  );
  await call('post', 'punch', { punchType: 'CHECK_OUT' }, 'teacher', 409);
  await call('post', 'punch', { punchType: 'CHECK_IN' }, 'teacher', 200);
  const open = await db.staffAttendance.findFirst({
    where: { tenantId: tid, staffId: e('teacher').staffId },
  });
  assert.equal(open.timeOut, null);
  await call('post', 'punch', { punchType: 'CHECK_IN' }, 'teacher', 409);
  await call('post', 'punch', { punchType: 'BREAK_OUT' }, 'teacher', 200);
  await call('post', 'punch', { punchType: 'CHECK_OUT' }, 'teacher', 409);
  await call('post', 'punch', { punchType: 'BREAK_IN' }, 'teacher', 200);
  await call('post', 'punch', { punchType: 'CHECK_OUT' }, 'teacher', 200);
  const teacherPunches = await call('get', 'punches/today', undefined, 'teacher');
  assert(teacherPunches.every((row) => row.employeeId === e('teacher').id));
  check('Punch sequence, break transitions, open checkout fields and personal punch scope work');
  await db.staffAttendance.update({ where: { id: open.id }, data: { isRegularized: true } });
  await call('post', 'punch', { punchType: 'CHECK_IN' }, 'teacher', 409);
  const leaveType = await master('leave-types', {
    name: 'Personal leave',
    code: 'PL',
    daysPerYear: 5,
    isPaid: true,
    requiresDocument: false,
  });
  const leave = {
    leaveTypeId: leaveType.id,
    startDate: '2026-12-01',
    endDate: '2026-12-02',
    numberOfDays: 2,
    reason: 'Fixture leave',
  };
  await call('post', 'leaves/apply', { ...leave, employeeId: e('other').id }, 'teacher', 403);
  await call('post', 'leaves/apply', { ...leave, numberOfDays: -1 }, 'teacher', 400);
  await call('post', 'leaves/apply', { ...leave, leaveTypeId: randomUUID() }, 'teacher', 400);
  const requested = await call('post', 'leaves/apply', leave, 'teacher');
  await call('post', 'leaves/apply', leave, 'teacher', 409);
  let balance = await db.leaveBalance.findFirst({ where: { employeeId: e('teacher').id } });
  assert.equal(balance.pendingDays, 2);
  await call('patch', `leaves/requests/${requested.id}/review`, { status: 'APPROVED' });
  await call(
    'patch',
    `leaves/requests/${requested.id}/review`,
    { status: 'APPROVED' },
    'manager',
    409
  );
  balance = await db.leaveBalance.findFirst({ where: { employeeId: e('teacher').id } });
  assert.equal(balance.pendingDays, 0);
  assert.equal(balance.usedDays, 2);
  await call(
    'post',
    `leaves/requests/${requested.id}/cancel`,
    { reason: 'Personal cancellation' },
    'teacher',
    403
  );
  const pending = await call(
    'post',
    'leaves/apply',
    { ...leave, startDate: '2026-12-04', endDate: '2026-12-04', numberOfDays: 1 },
    'teacher'
  );
  await call(
    'post',
    `leaves/requests/${pending.id}/cancel`,
    { reason: 'Personal plans changed' },
    'teacher'
  );
  await call(
    'post',
    `leaves/requests/${pending.id}/cancel`,
    { reason: 'Repeated cancellation' },
    'teacher',
    409
  );
  balance = await db.leaveBalance.findFirst({
    where: { employeeId: e('teacher').id, leaveTypeId: leaveType.id },
  });
  assert.equal(balance.pendingDays, 0);
  await call('post', `leaves/requests/${requested.id}/cancel`, {
    reason: 'Manager reviewed changed plans',
  });
  balance = await db.leaveBalance.findFirst({
    where: { employeeId: e('teacher').id, leaveTypeId: leaveType.id },
  });
  assert.equal(balance.usedDays, 0);
  const myLeaves = await call('get', 'leaves/requests', undefined, 'other');
  assert.equal(myLeaves.length, 0);
  check('Leave validation, overlap prevention, atomic pending/used balances and self scope work');
  const monthlyLeave = await master('leave-types', {
    name: 'Monthly working-day leave',
    code: 'ML',
    daysPerYear: 12,
    accrualMethod: 'MONTHLY',
    effectiveFrom: '2025-01-01',
    carryForwardLimit: 3,
    dayBasis: 'WORKING_DAYS',
    workingWeekdays: [1, 2, 3, 4, 5],
    excludedDates: ['2026-12-02'],
    allowBackdated: false,
    minNoticeDays: 2,
    maxDaysPerRequest: 2,
  });
  const monthlyRequest = {
    leaveTypeId: monthlyLeave.id,
    startDate: '2026-12-01',
    endDate: '2026-12-02',
    reason: 'Policy leave',
  };
  await call('post', 'leaves/apply', { ...monthlyRequest, numberOfDays: 2 }, 'teacher', 400);
  const monthlyBooked = await call('post', 'leaves/apply', monthlyRequest, 'teacher');
  assert.equal(monthlyBooked.numberOfDays, 1);
  assert.deepEqual(monthlyBooked.chargedDates, ['2026-12-01']);
  await call(
    'post',
    'leaves/apply',
    { ...monthlyRequest, startDate: '2026-12-05', endDate: '2026-12-06' },
    'teacher',
    400
  );
  await call(
    'post',
    'leaves/apply',
    { ...monthlyRequest, startDate: '2026-11-01', endDate: '2026-11-01' },
    'teacher',
    400
  );
  const localToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
    new Date()
  );
  await call(
    'post',
    'leaves/apply',
    { ...monthlyRequest, startDate: localToday, endDate: localToday },
    'teacher',
    400
  );
  await call(
    'post',
    'leaves/apply',
    { ...monthlyRequest, startDate: '2026-12-07', endDate: '2026-12-09' },
    'teacher',
    400
  );
  const beforeBalances = await db.leaveBalance.count({ where: { tenantId: tid } });
  const liveBalances = await call('get', 'leaves/balances', undefined, 'teacher');
  assert.equal(await db.leaveBalance.count({ where: { tenantId: tid } }), beforeBalances);
  const liveMonthly = liveBalances.find((b) => b.leaveTypeId === monthlyLeave.id);
  assert.equal(liveMonthly.accruedDays, 10);
  assert.equal(liveMonthly.availableDays, 9);
  await call('get', `leaves/balances?employeeId=${e('other').id}`, undefined, 'teacher', 403);
  await call(
    'post',
    'leaves/balances/accrue',
    { employeeId: e('other').id, year: 2026 },
    'teacher',
    403
  );
  await call(
    'post',
    'leaves/balances/accrue',
    { employeeId: e('teacher').id, year: 2027 },
    'manager',
    400
  );
  await call(
    'patch',
    `masters/leave-types/${monthlyLeave.id}`,
    { data: { daysPerYear: 50 } },
    'manager',
    409
  );
  const waitingLeave = await master('leave-types', {
    name: 'Waiting leave',
    code: 'WAIT',
    daysPerYear: 12,
    waitingDays: 366,
  });
  await call('post', 'leaves/apply', { ...leave, leaveTypeId: waitingLeave.id }, 'teacher', 400);
  const noHalf = await master('leave-types', {
    name: 'Full days only',
    code: 'FULL',
    daysPerYear: 12,
    allowHalfDay: false,
  });
  await call(
    'post',
    'leaves/apply',
    {
      ...leave,
      leaveTypeId: noHalf.id,
      endDate: leave.startDate,
      numberOfDays: 0.5,
      isHalfDay: true,
      halfDaySession: 'AM',
    },
    'teacher',
    400
  );
  check(
    'Leave policies enforce working dates, holidays, notice, backdating, waiting periods and limits; balance reads are live and read-only'
  );

  const medicalLeave = await master('leave-types', {
    name: 'Reviewed medical leave',
    code: 'MED',
    daysPerYear: 20,
    requiresDocument: true,
    documentAfterDays: 1,
  });
  const medical = {
    leaveTypeId: medicalLeave.id,
    startDate: '2026-12-08',
    endDate: '2026-12-08',
    reason: 'Medical appointment',
  };
  await call('post', 'leaves/apply', medical, 'teacher', 400);
  await call('post', 'leaves/apply', { ...medical, documentUrl: 'https://' }, 'teacher', 400);
  await call(
    'post',
    'leaves/apply',
    { ...medical, documentUrl: 'https://user:secret@example.test/proof' },
    'teacher',
    400
  );
  const evidence = await call(
    'post',
    'leaves/apply',
    { ...medical, documentUrl: 'https://example.test/medical.pdf' },
    'teacher'
  );
  assert.equal(evidence.documentStatus, 'PENDING');
  await call(
    'patch',
    `leaves/requests/${evidence.id}/review`,
    { status: 'APPROVED' },
    'manager',
    409
  );
  await call(
    'patch',
    `leaves/requests/${evidence.id}/document-review`,
    { status: 'VERIFIED', remarks: 'Reviewed original' },
    'teacher',
    403
  );
  await call(
    'patch',
    `leaves/requests/${evidence.id}/document`,
    { documentUrl: 'https://example.test/other.pdf' },
    'manager',
    403
  );
  await call('patch', `leaves/requests/${evidence.id}/document-review`, {
    status: 'REJECTED',
    remarks: 'Dates are unreadable',
  });
  await call(
    'patch',
    `leaves/requests/${evidence.id}/review`,
    { status: 'APPROVED' },
    'manager',
    409
  );
  const replaced = await call(
    'patch',
    `leaves/requests/${evidence.id}/document`,
    { documentUrl: 'https://example.test/replacement.pdf' },
    'teacher'
  );
  assert.equal(replaced.documentStatus, 'PENDING');
  assert.equal(replaced.documentVerifiedBy, null);
  const verified = await call('patch', `leaves/requests/${evidence.id}/document-review`, {
    status: 'VERIFIED',
    remarks: 'Dates and applicant match',
  });
  assert.equal(verified.documentVerifiedBy, actors.manager.id);
  assert(verified.documentVerifiedAt);
  await call(
    'patch',
    `leaves/requests/${evidence.id}/document-review`,
    { status: 'VERIFIED', remarks: 'Repeated review' },
    'manager',
    409
  );
  await call('patch', `leaves/requests/${evidence.id}/review`, { status: 'APPROVED' });
  await call(
    'patch',
    `leaves/requests/${evidence.id}/document`,
    { documentUrl: 'https://example.test/late.pdf' },
    'teacher',
    409
  );
  await call(
    'patch',
    `leaves/requests/${evidence.id}/document-review`,
    { status: 'VERIFIED', remarks: 'Foreign request' },
    'foreign',
    403
  );
  const managerMedical = await call('post', 'leaves/apply', {
    ...medical,
    startDate: '2026-12-09',
    endDate: '2026-12-09',
    documentUrl: 'https://example.test/manager.pdf',
  });
  await call(
    'patch',
    `leaves/requests/${managerMedical.id}/document-review`,
    { status: 'VERIFIED', remarks: 'Self verification' },
    'manager',
    403
  );
  await call('post', `leaves/requests/${managerMedical.id}/cancel`, {
    reason: 'Manager fixture completed',
  });
  const halfInput = {
    leaveTypeId: medicalLeave.id,
    startDate: '2026-12-10',
    endDate: '2026-12-10',
    isHalfDay: true,
    reason: 'Half-day appointment',
    numberOfDays: 0.5,
  };
  await call('post', 'leaves/apply', halfInput, 'teacher', 400);
  const morning = await call(
    'post',
    'leaves/apply',
    { ...halfInput, halfDaySession: 'AM' },
    'teacher'
  );
  assert.equal(morning.documentStatus, 'NOT_REQUIRED');
  await call('post', 'leaves/apply', { ...halfInput, halfDaySession: 'AM' }, 'teacher', 409);
  const afternoon = await call(
    'post',
    'leaves/apply',
    { ...halfInput, halfDaySession: 'PM' },
    'teacher'
  );
  await call(
    'post',
    'leaves/apply',
    {
      ...halfInput,
      isHalfDay: false,
      numberOfDays: 1,
      documentUrl: 'https://example.test/full.pdf',
    },
    'teacher',
    409
  );
  await call('patch', `leaves/requests/${morning.id}/review`, { status: 'APPROVED' });
  await call('patch', `leaves/requests/${afternoon.id}/review`, { status: 'APPROVED' });
  const duplicateHalf = {
    ...halfInput,
    startDate: '2026-12-11',
    endDate: '2026-12-11',
    halfDaySession: 'AM',
  };
  const concurrentLeave = await Promise.all(
    [1, 2].map(() =>
      request(app.getHttpServer())
        .post('/api/v1/hrms/leaves/apply')
        .set('Authorization', 'Bearer ' + tokenFor('teacher'))
        .send(duplicateHalf)
    )
  );
  testCount += 2;
  assert.deepEqual(concurrentLeave.map((r) => r.status).sort(), [201, 409]);
  const medicalBalance = await db.leaveBalance.findFirst({
    where: { employeeId: e('teacher').id, leaveTypeId: medicalLeave.id },
  });
  assert.equal(medicalBalance.usedDays, 2);
  assert.equal(medicalBalance.pendingDays, 0.5);
  check(
    'Evidence must be independently verified before approval, resubmission resets verification, and complementary half days reserve balances without duplicate sessions'
  );
  const unpaidLeave = await master('leave-types', {
    name: 'Unpaid leave',
    code: 'UP',
    daysPerYear: 12,
    carryForwardLimit: 3,
    isPaid: false,
  });
  const basic = await master('salary-components', {
    name: 'Basic salary',
    code: 'BASIC',
    type: 'EARNING',
    calculationType: 'BASE',
    isStatutory: false,
  });
  const allowance = await master('salary-components', {
    name: 'Allowance',
    code: 'ALLOW',
    type: 'EARNING',
    calculationType: 'FIXED',
    isStatutory: false,
  });
  // These are deliberately configured fixture percentages, not statutory-rate defaults.
  const pf = await master('salary-components', {
    name: 'Fixture PF',
    code: 'PF',
    type: 'DEDUCTION',
    calculationType: 'PERCENT_OF_BASIC',
    percentage: 10,
    isStatutory: true,
    statutoryType: 'PF',
  });
  const employerPf = await master('salary-components', {
    name: 'Fixture employer PF',
    code: 'PF_EMP',
    type: 'EMPLOYER_CONTRIBUTION',
    calculationType: 'PERCENT_OF_BASIC',
    percentage: 5,
    isStatutory: true,
    statutoryType: 'PF',
  });
  const structure = await call('post', 'payroll/structures', {
    name: 'School salary',
    components: [
      { componentId: basic.id, amount: 0 },
      { componentId: allowance.id, amount: 1000 },
      { componentId: pf.id, amount: 0 },
      { componentId: employerPf.id, amount: 0 },
    ],
  });
  for (const employee of employees)
    await call(
      'post',
      `employees/${employee.id}/salary`,
      {
        structureId: structure.id,
        effectiveFrom: '2026-01-01',
        baseMonthlySalary: 30000,
      },
      employee.userId === actors.manager.id ? 'accountant' : 'manager'
    );
  await call(
    'patch',
    `masters/salary-components/${basic.id}`,
    { data: { name: 'Change assigned component' } },
    'manager',
    409
  );
  const payroll = { year: 2026, month: 10, workingDates: ['2026-10-01', '2026-10-02'] };
  assert(
    (await call('post', 'payroll/preview', payroll)).issues.some((issue) =>
      issue.includes('statutory profile')
    )
  );
  await call(
    'post',
    'attendance/corrections',
    {
      employeeId: e('teacher').id,
      date: '2026-10-03',
      status: 'PRESENT',
      timeIn: '09:00',
      timeOut: '13:00',
      breakMinutes: 60,
      reason: 'Invalid net worked minutes',
    },
    'manager',
    400
  );
  const corrected = await call('post', 'attendance/corrections', {
    employeeId: e('teacher').id,
    date: '2026-10-03',
    status: 'PRESENT',
    timeIn: '09:00',
    timeOut: '17:00',
    breakMinutes: 60,
    reason: 'Reviewed full-day work excluding lunch',
  });
  assert.equal(corrected.totalWorkMinutes, 420);
  assert.equal(corrected.overtimeMinutes, 0);
  check('Reviewed attendance excludes unpaid breaks and enforces configured net-work thresholds');
  const profilePath = `employees/${e('teacher').id}/statutory`;
  await call('get', profilePath, undefined, 'teacher', 403);
  await call(
    'patch',
    `employees/${foreignEmp.id}/statutory`,
    { pfApplicable: false, esiApplicable: false },
    'manager',
    404
  );
  await call(
    'patch',
    profilePath,
    { pfApplicable: true, esiApplicable: false, uanNumber: 'bad' },
    'manager',
    400
  );
  for (const employee of employees)
    await call(
      'patch',
      `employees/${employee.id}/statutory`,
      {
        pfApplicable: employee.id === e('teacher').id,
        esiApplicable: false,
        ...(employee.id === e('teacher').id ? { uanNumber: '123456789012' } : {}),
      },
      employee.userId === actors.manager.id ? 'accountant' : 'manager'
    );
  const masked = await call('get', profilePath, undefined, 'accountant');
  assert.equal(masked.uanMasked, '********9012');
  assert(!JSON.stringify(masked).includes('123456789012'));
  await call(
    'patch',
    `employees/${e('manager').id}/statutory`,
    { pfApplicable: false, esiApplicable: false },
    'manager',
    403
  );
  await call('post', `employees/${e('teacher').id}/salary`, {
    structureId: structure.id,
    effectiveFrom: '2026-10-02',
    baseMonthlySalary: 40000,
  });
  await call(
    'post',
    `employees/${e('teacher').id}/salary`,
    { structureId: structure.id, effectiveFrom: '2026-10-02', baseMonthlySalary: 45000 },
    'manager',
    409
  );
  await call('post', `employees/${e('teacher').id}/salary`, {
    structureId: structure.id,
    effectiveFrom: '2199-01-01',
    baseMonthlySalary: 90000,
  });
  const revised = (await call('get', 'employees')).find((row) => row.id === e('teacher').id);
  assert.equal(revised.currentSalary.baseMonthlySalary, 40000);
  const legacyDuplicate = await db.employeeSalaryAssignment.create({
    data: {
      tenantId: tid,
      employeeId: e('teacher').id,
      structureId: structure.id,
      effectiveFrom: new Date('2026-10-02T12:00:00Z'),
      baseMonthlySalary: 45000,
    },
  });
  assert(
    (await call('post', 'payroll/preview', payroll)).issues.some((issue) =>
      issue.includes('same effective date')
    )
  );
  await db.employeeSalaryAssignment.delete({ where: { id: legacyDuplicate.id } });
  assert.equal(revised.salaryAssignments[1].effectiveTo.slice(0, 10), '2198-12-31');
  await call(
    'post',
    `salary-assignments/${revised.salaryAssignments[0].id}/withdraw`,
    { reason: 'Correct future salary terms' },
    'accountant'
  );
  assert(
    await db.auditLog.findFirst({
      where: { entityId: revised.salaryAssignments[0].id, action: 'HR_SALARY_WITHDRAWN' },
    })
  );
  await call('post', `employees/${e('teacher').id}/salary`, {
    structureId: structure.id,
    effectiveFrom: '2199-01-01',
    baseMonthlySalary: 90000,
  });
  check(
    'Statutory profiles enforce school/payroll scope, masking, applicability and dated salary revision history'
  );
  await call(
    'post',
    `employees/${e('manager').id}/salary`,
    { structureId: structure.id, effectiveFrom: '2026-02-01', baseMonthlySalary: 100000 },
    'manager',
    403
  );
  let preview = await call('post', 'payroll/preview', payroll);
  assert(preview.issues.length > 0);
  await call('post', 'payroll/generate', payroll, 'manager', 400);
  assert.equal(await db.payrollRun.count({ where: { tenantId: tid } }), 0);
  for (const employee of employees)
    for (const day of payroll.workingDates)
      await db.staffAttendance.create({
        data: {
          tenantId: tid,
          staffId: employee.staffId,
          date: date(day),
          status: 'PRESENT',
          firstIn: new Date(day + 'T03:30:00Z'),
          lastOut: new Date(day + 'T11:30:00Z'),
          timeIn: new Date(day + 'T03:30:00Z'),
          timeOut: new Date(day + 'T11:30:00Z'),
          totalWorkMinutes: 480,
        },
      });
  const paidHalf = await call(
    'post',
    'leaves/apply',
    {
      leaveTypeId: leaveType.id,
      startDate: '2026-10-02',
      endDate: '2026-10-02',
      isHalfDay: true,
      halfDaySession: 'AM',
      reason: 'Paid morning',
    },
    'teacher'
  );
  const unpaidHalf = await call(
    'post',
    'leaves/apply',
    {
      leaveTypeId: unpaidLeave.id,
      startDate: '2026-10-02',
      endDate: '2026-10-02',
      isHalfDay: true,
      halfDaySession: 'PM',
      reason: 'Unpaid afternoon',
    },
    'teacher'
  );
  for (const half of [paidHalf, unpaidHalf])
    await call('patch', `leaves/requests/${half.id}/review`, { status: 'APPROVED' });
  const halfPreview = await call('post', 'payroll/preview', payroll);
  assert.deepEqual(halfPreview.issues, []);
  const halfSlip = halfPreview.slips.find((row) => row.employeeId === e('teacher').id);
  assert.equal(halfSlip.workedDays, 1.5);
  assert.equal(halfSlip.netSalary, 23250);
  for (const half of [paidHalf, unpaidHalf])
    await call('post', `leaves/requests/${half.id}/cancel`, {
      reason: 'Restore fixture attendance day',
    });
  check(
    'Payroll combines paid and unpaid AM/PM leave correctly and cancellation restores the original working-day pay'
  );
  const holidayPolicy = await master('leave-types', {
    name: 'Working dates only',
    code: 'WK',
    daysPerYear: 12,
    dayBasis: 'WORKING_DAYS',
    workingWeekdays: [1, 2, 3, 4, 5],
    excludedDates: ['2026-10-02'],
  });
  const holidayLeave = await call(
    'post',
    'leaves/apply',
    {
      leaveTypeId: holidayPolicy.id,
      startDate: '2026-10-01',
      endDate: '2026-10-02',
      reason: 'One chargeable day',
    },
    'teacher'
  );
  assert.equal(holidayLeave.numberOfDays, 1);
  await call('patch', `leaves/requests/${holidayLeave.id}/review`, { status: 'APPROVED' });
  const excludedAttendance = await db.staffAttendance.findFirst({
    where: { tenantId: tid, staffId: e('teacher').staffId, date: date('2026-10-02') },
  });
  await db.staffAttendance.update({
    where: { id: excludedAttendance.id },
    data: { status: 'ABSENT' },
  });
  const holidayPreview = await call('post', 'payroll/preview', payroll);
  assert.deepEqual(holidayPreview.issues, []);
  const holidaySlip = holidayPreview.slips.find((row) => row.employeeId === e('teacher').id);
  assert.equal(holidaySlip.workedDays, 1);
  assert.equal(holidaySlip.netSalary, 14000);
  await call('post', `leaves/requests/${holidayLeave.id}/cancel`, {
    reason: 'Restore fixture working days',
  });
  await db.staffAttendance.update({
    where: { id: excludedAttendance.id },
    data: { status: 'PRESENT' },
  });
  check(
    'Payroll uses the stored chargeable dates rather than crediting excluded holidays inside a leave range'
  );
  preview = await call('post', 'payroll/preview', payroll);
  assert.deepEqual(preview.issues, []);
  const teacherPreview = preview.slips.find((row) => row.employeeId === e('teacher').id);
  assert.equal(teacherPreview.netSalary, 32500);
  assert.equal(teacherPreview.breakdown.employerContributions, 1750);
  assert.equal(teacherPreview.breakdown.salaryRevisions.length, 2);
  await call('patch', profilePath, { pfApplicable: false, esiApplicable: false });
  assert.equal(
    (await call('post', 'payroll/preview', payroll)).slips.find(
      (row) => row.employeeId === e('teacher').id
    ).netSalary,
    36000
  );
  await call('patch', profilePath, { pfApplicable: true, esiApplicable: false });
  const parallelRuns = await Promise.all(
    [1, 2].map(() =>
      request(app.getHttpServer())
        .post('/api/v1/hrms/payroll/generate')
        .set('Authorization', 'Bearer ' + tokenFor('accountant'))
        .send(payroll)
    )
  );
  testCount += 2;
  assert.deepEqual(parallelRuns.map((r) => r.status).sort(), [201, 409]);
  let drafted = parallelRuns.find((r) => r.status === 201).body.data;
  await call('patch', profilePath, { pfApplicable: false, esiApplicable: false }, 'manager', 409);
  await call(
    'post',
    'attendance/corrections',
    {
      employeeId: e('teacher').id,
      date: '2026-10-31',
      status: 'ABSENT',
      reason: 'Draft freeze check',
    },
    'manager',
    409
  );
  await call(
    'post',
    `payroll/runs/${drafted.run.id}/discard`,
    { reason: 'Correct reviewed inputs' },
    'accountant'
  );
  assert(
    await db.auditLog.findFirst({
      where: { entityId: drafted.run.id, action: 'HR_PAYROLL_DISCARDED' },
    })
  );
  assert.equal(await db.payslip.count({ where: { runId: drafted.run.id } }), 0);
  await call('post', 'attendance/corrections', {
    employeeId: e('teacher').id,
    date: '2026-10-31',
    status: 'ABSENT',
    reason: 'Reviewed after draft discard',
  });
  drafted = await call('post', 'payroll/generate', payroll, 'accountant');
  await db.user.update({ where: { id: actors.accountant.id }, data: { role: 'SCHOOL_ADMIN' } });
  await call('post', `payroll/runs/${drafted.run.id}/approve`, {}, 'accountant', 403);
  await db.user.update({ where: { id: actors.accountant.id }, data: { role: 'ACCOUNTANT' } });
  await call('post', 'payroll/generate', payroll, 'accountant', 409);
  assert.equal(
    (await call('get', 'payroll/payslips?year=2026&month=10', undefined, 'teacher')).length,
    0
  );
  await call('post', `payroll/runs/${drafted.run.id}/approve`, {}, 'manager');
  await call(
    'post',
    `payroll/runs/${drafted.run.id}/discard`,
    { reason: 'Cannot discard approval' },
    'accountant',
    409
  );
  await call('post', 'payroll/preview', payroll, 'accountant', 409);
  await call(
    'post',
    `salary-assignments/${revised.salaryAssignments[1].id}/withdraw`,
    { reason: 'Cannot revise approved history' },
    'accountant',
    409
  );
  assert.equal((await call('get', 'payroll/periods?year=2026&month=10'))[0].status, 'LOCKED');
  await db.payrollPeriod.create({
    data: {
      tenantId: tid,
      year: 2026,
      month: 9,
      startDate: date('2026-09-01'),
      endDate: date('2026-09-30'),
      totalWorkingDays: 20,
      status: 'LOCKED',
    },
  });
  const legacyAttendance = new AttendanceService(scoped, tenants, {});
  const inSchool = (work) =>
    tenants.run(async () => {
      tenants.setTenantId(tid);
      return await work();
    });
  await assert.rejects(
    () =>
      inSchool(() =>
        legacyAttendance.markSingleStaffAttendance(
          { staffId: e('teacher').staffId, date: '2026-09-30', status: 'PRESENT' },
          actors.manager.id
        )
      ),
    /Payroll already covers/
  );
  await assert.rejects(
    () =>
      inSchool(() =>
        legacyAttendance.markBulkStaffAttendance(
          {
            date: '2026-09-30',
            attendance: [{ staffId: e('teacher').staffId, status: 'PRESENT' }],
          },
          actors.manager.id
        )
      ),
    /Payroll already covers/
  );
  await assert.rejects(
    () =>
      inSchool(() =>
        legacyAttendance.markSingleStaffAttendance(
          { staffId: e('teacher').staffId, date: '2026-11-01', status: 'PRESENT' },
          actors.manager.id
        )
      ),
    /reviewed HR attendance/
  );
  await call(
    'post',
    'attendance/corrections',
    {
      employeeId: e('teacher').id,
      date: '2026-09-30',
      status: 'ABSENT',
      reason: 'No payslip but locked period',
    },
    'manager',
    409
  );
  check(
    'Drafts freeze period inputs, audited discard permits rebuilding, and approval locks even dates without payslips'
  );
  const slips = await call('get', 'payroll/payslips?year=2026&month=10', undefined, 'teacher');
  assert.equal(slips.length, 1);
  assert.equal(slips[0].employeeId, e('teacher').id);
  const csv = await request(app.getHttpServer())
    .get(`/api/v1/hrms/payroll/payslips/${slips[0].id}/download`)
    .set('Authorization', 'Bearer ' + tokenFor('teacher'));
  assert.equal(csv.status, 200);
  assert.match(csv.text, /32500/);
  assert.match(csv.headers['content-type'], /text\/csv/);
  const otherSlip = await db.payslip.findFirst({ where: { employeeId: e('other').id } });
  await call('get', `payroll/payslips/${otherSlip.id}/download`, undefined, 'teacher', 404);
  await call(
    'post',
    'attendance/corrections',
    {
      employeeId: e('teacher').id,
      date: '2026-10-01',
      status: 'ABSENT',
      reason: 'Fixture correction',
    },
    'manager',
    409
  );
  check(
    'Payroll requires assignments/attendance, creates one draft per month, releases only approved self slips and downloads genuine CSV'
  );
  const department = setup.departments[0];
  const vacancyData = {
    title: 'Science teacher',
    departmentId: department.id,
    description: 'Teach science and conduct practical lessons.',
    positions: 1,
    status: 'DRAFT',
  };
  const vacancy = await call('post', 'recruitment/vacancies', vacancyData);
  const application = {
    vacancyId: vacancy.id,
    name: 'Recruitment Teacher',
    email: `recruited-${fixture}@example.test`,
    phone: '1234567890',
    source: 'REFERRAL',
    resumeUrl: 'https://example.test/resume.pdf',
    notes: 'Science specialist',
  };
  await call('post', 'recruitment/candidates', application, 'manager', 409);
  await call('patch', `recruitment/vacancies/${vacancy.id}`, { ...vacancyData, status: 'OPEN' });
  const applicant = await call('post', 'recruitment/candidates', application);
  await call(
    'post',
    'recruitment/candidates',
    { ...application, email: application.email.toUpperCase() },
    'manager',
    409
  );
  await call(
    'post',
    'recruitment/candidates',
    { ...application, email: 'new@example.test', tenantId: otherTid },
    'manager',
    400
  );
  await call('get', 'recruitment', undefined, 'teacher', 403);
  await call('get', 'recruitment', undefined, 'accountant', 403);
  await call(
    'patch',
    `recruitment/candidates/${applicant.id}/stage`,
    { status: 'SELECTED', reason: 'Skip process' },
    'manager',
    409
  );
  await call('patch', `recruitment/candidates/${applicant.id}/stage`, {
    status: 'SCREENING',
    reason: 'Review qualifications',
  });
  await call('patch', `recruitment/candidates/${applicant.id}/stage`, {
    status: 'SHORTLISTED',
    reason: 'Meets teaching criteria',
  });
  const slot = {
    round: 'Teaching demonstration',
    interviewerId: actors.manager.id,
    startsAt: new Date(Date.now() + 3600000).toISOString(),
    endsAt: new Date(Date.now() + 7200000).toISOString(),
    location: 'Science lab',
  };
  const interview = await call('post', `recruitment/candidates/${applicant.id}/interviews`, slot);
  await call('post', `recruitment/candidates/${applicant.id}/interviews`, slot, 'manager', 409);
  await call(
    'patch',
    `recruitment/interviews/${interview.id}/review`,
    { status: 'COMPLETED', result: 'RECOMMENDED', rating: 4, feedback: 'Strong subject knowledge' },
    'manager',
    409
  );
  await call(
    'patch',
    `recruitment/candidates/${applicant.id}/stage`,
    { status: 'SELECTED', reason: 'Interview pending' },
    'manager',
    409
  );
  await call('patch', `recruitment/candidates/${applicant.id}/interviews/${interview.id}`, {
    ...slot,
    location: 'Updated science lab',
  });
  await db.recruitmentInterview.update({
    where: { id: interview.id },
    data: { startsAt: new Date(Date.now() - 7200000), endsAt: new Date(Date.now() - 3600000) },
  });
  await call(
    'patch',
    `recruitment/interviews/${interview.id}/review`,
    { status: 'COMPLETED', feedback: 'Incomplete scoring' },
    'manager',
    400
  );
  await call('patch', `recruitment/interviews/${interview.id}/review`, {
    status: 'COMPLETED',
    result: 'RECOMMENDED',
    rating: 4,
    feedback: 'Strong subject knowledge',
  });
  await call('patch', `recruitment/candidates/${applicant.id}/stage`, {
    status: 'SELECTED',
    reason: 'Recommended by panel',
  });
  const linkedTerms = {
    candidateId: applicant.id,
    candidateName: application.name,
    candidateEmail: application.email,
    candidatePhone: application.phone,
    designationTitle: vacancy.title,
    joiningDate: '2026-11-20',
    offeredCtcMonthly: 32000,
    departmentId: department.id,
    structureId: structure.id,
    schoolDepartment: 'TEACHING',
    accountRole: 'TEACHER',
  };
  await call(
    'post',
    'onboarding/offers',
    { ...linkedTerms, candidateEmail: 'forged@example.test' },
    'manager',
    400
  );
  const linkedOffers = await Promise.all(
    [0, 1].map(async () => {
      const result = await request(app.getHttpServer())
        .post('/api/v1/hrms/onboarding/offers')
        .set('Authorization', 'Bearer ' + tokenFor('manager'))
        .send(linkedTerms);
      return result;
    })
  );
  assert.deepEqual(linkedOffers.map((r) => r.status).sort(), [201, 409]);
  const recruitmentOffer = linkedOffers.find((r) => r.status === 201).body.data;
  assert.equal(
    (await db.recruitmentCandidate.findUnique({ where: { id: applicant.id } })).status,
    'OFFERED'
  );
  for (const t of await db.onboardingTask.findMany({ where: { offerId: recruitmentOffer.id } }))
    await call('patch', `onboarding/tasks/${t.id}`, { isCompleted: true });
  const recruitedEmployee = await call('post', `onboarding/offers/${recruitmentOffer.id}/convert`, {
    newAccount: {
      firstName: 'Recruitment',
      lastName: 'Teacher',
      password: 'Recruitment-Temporary-42!',
    },
  });
  assert(recruitedEmployee.id);
  assert.equal(
    (await db.recruitmentCandidate.findUnique({ where: { id: applicant.id } })).status,
    'HIRED'
  );
  const pipeline = await call('get', 'recruitment');
  assert.equal(
    pipeline.candidates.find((c) => c.id === applicant.id).offer.employeeId,
    recruitedEmployee.id
  );
  assert(!JSON.stringify(pipeline).includes('passwordHash'));
  await call('patch', `recruitment/candidates/${applicant.id}`, application, 'manager', 409);
  const scopedPipeline = await tenants.run(async () => {
    tenants.setTenantId(otherTid);
    return await scoped.recruitmentCandidate.findMany();
  });
  assert(!scopedPipeline.some((c) => c.id === applicant.id));
  // The composite foreign key prevents cross-school links even without middleware.
  await assert.rejects(
    db.recruitmentCandidate.create({
      data: { ...application, vacancyId: vacancy.id, tenantId: otherTid },
    })
  );
  const second = await call('post', 'recruitment/candidates', {
    ...application,
    email: `declined-${fixture}@example.test`,
  });
  await call('patch', `recruitment/candidates/${second.id}/stage`, {
    status: 'SCREENING',
    reason: 'Initial review complete',
  });
  await call('patch', `recruitment/candidates/${second.id}/stage`, {
    status: 'SHORTLISTED',
    reason: 'Meets initial criteria',
  });
  const cancelled = await call('post', `recruitment/candidates/${second.id}/interviews`, {
    ...slot,
    startsAt: new Date(Date.now() + 10800000).toISOString(),
    endsAt: new Date(Date.now() + 14400000).toISOString(),
  });
  await call('patch', `recruitment/candidates/${second.id}/stage`, {
    status: 'WITHDRAWN',
    reason: 'Candidate withdrew application',
  });
  assert.equal(
    (await db.recruitmentInterview.findUnique({ where: { id: cancelled.id } })).status,
    'CANCELLED'
  );
  check(
    'Recruitment validates vacancy intake, duplicate applications, stage evidence, interview scheduling/conflicts, concurrent linked offers, school isolation and atomic employee joining'
  );
  const offer = await call('post', 'onboarding/offers', {
    candidateName: 'Fixture candidate',
    candidateEmail: actors.candidate.email,
    candidatePhone: '00000000',
    designationTitle: 'Teacher',
    joiningDate: '2026-11-20',
    offeredCtcMonthly: 32000,
    departmentId: department.id,
    structureId: structure.id,
    schoolDepartment: 'TEACHING',
    accountRole: 'TEACHER',
  });
  await call(
    'post',
    `onboarding/offers/${offer.id}/convert`,
    { userId: actors.candidate.id },
    'manager',
    400
  );
  const tasks = await db.onboardingTask.findMany({ where: { offerId: offer.id } });
  await db.jobOffer.update({
    where: { id: offer.id },
    data: { structureId: null, departmentId: null },
  });
  await call('patch', `onboarding/offers/${offer.id}`, {
    candidateName: offer.candidateName,
    candidateEmail: offer.candidateEmail,
    candidatePhone: offer.candidatePhone,
    designationTitle: offer.designationTitle,
    joiningDate: offer.joiningDate.slice(0, 10),
    offeredCtcMonthly: offer.offeredCtcMonthly,
    departmentId: department.id,
    structureId: structure.id,
    schoolDepartment: 'TEACHING',
    accountRole: 'TEACHER',
  });
  await call('patch', `onboarding/tasks/${tasks[0].id}`, { isCompleted: 'true' }, 'manager', 400);
  for (const task of tasks)
    await call('patch', `onboarding/tasks/${task.id}`, { isCompleted: true });
  await call('patch', `onboarding/offers/${offer.id}`, {
    candidateName: offer.candidateName,
    candidateEmail: offer.candidateEmail,
    candidatePhone: offer.candidatePhone,
    designationTitle: offer.designationTitle,
    joiningDate: offer.joiningDate.slice(0, 10),
    offeredCtcMonthly: 33000,
    departmentId: department.id,
    structureId: structure.id,
    schoolDepartment: 'TEACHING',
    accountRole: 'TEACHER',
  });
  await call(
    'post',
    `onboarding/offers/${offer.id}/convert`,
    { userId: actors.candidate.id },
    'manager',
    400
  );
  for (const task of tasks)
    await call('patch', `onboarding/tasks/${task.id}`, { isCompleted: true });
  const joined = await call('post', `onboarding/offers/${offer.id}/convert`, {
    userId: actors.candidate.id,
  });
  assert(joined.staffId);
  assert.equal(joined.userId, actors.candidate.id);
  const joinedStaff = await db.staff.findUnique({ where: { id: joined.staffId } });
  assert.equal(joinedStaff.department, 'TEACHING');
  assert.equal(joinedStaff.isTeacher, true);
  assert.equal(await db.employeeSalaryAssignment.count({ where: { employeeId: joined.id } }), 1);
  await call(
    'post',
    `onboarding/offers/${offer.id}/convert`,
    { userId: actors.candidate.id },
    'manager',
    409
  );
  check(
    'Joining enforces completed checklist and links Employee, Staff, login and salary atomically exactly once'
  );
  const readyOffer = async (label, overrides = {}) => {
    const row = await call('post', 'onboarding/offers', {
      candidateName: 'Joining ' + label,
      candidateEmail: `${label}-${fixture}@example.test`,
      candidatePhone: '00000000',
      designationTitle: 'Teacher',
      joiningDate: '2026-11-20',
      offeredCtcMonthly: 32000,
      departmentId: department.id,
      structureId: structure.id,
      schoolDepartment: 'TEACHING',
      accountRole: 'TEACHER',
      ...overrides,
    });
    for (const task of await db.onboardingTask.findMany({ where: { offerId: row.id } }))
      await call('patch', `onboarding/tasks/${task.id}`, { isCompleted: true });
    return row;
  };
  const joiningAccount = {
    firstName: 'Joining',
    lastName: 'Teacher',
    password: 'Fixture-Joining-42!',
  };
  const convert = (row, body, status = 201) =>
    call('post', `onboarding/offers/${row.id}/convert`, body, 'manager', status);
  const freshOffer = await readyOffer('fresh-joining');
  await convert(freshOffer, {}, 400);
  await convert(freshOffer, { userId: actors.candidate.id, newAccount: joiningAccount }, 400);
  await convert(freshOffer, { newAccount: { ...joiningAccount, password: 'weak' } }, 400);
  await convert(freshOffer, { newAccount: { ...joiningAccount, role: 'SUPER_ADMIN' } }, 400);
  await convert(freshOffer, { userId: actors.foreign.id }, 400);
  const fresh = await convert(freshOffer, { newAccount: joiningAccount });
  const freshLogin = await db.user.findUnique({ where: { id: fresh.userId } });
  const freshStaff = await db.staff.findUnique({ where: { id: fresh.staffId } });
  assert.equal(freshLogin.email, freshOffer.candidateEmail);
  assert.equal(freshLogin.role, 'TEACHER');
  assert.equal(freshLogin.mustChangePassword, true);
  assert(await req('bcryptjs').compare(joiningAccount.password, freshLogin.passwordHash));
  assert.equal(freshStaff.userId, freshLogin.id);
  assert.equal(freshStaff.staffNumber, fresh.employeeCode);
  assert.equal(freshStaff.hireDate.toISOString().slice(0, 10), '2026-11-20');
  assert.equal(fresh.passwordHash, undefined);
  assert.equal(fresh.password, undefined);
  const freshSalary = await db.employeeSalaryAssignment.findFirst({
    where: { employeeId: fresh.id },
  });
  assert.equal(freshSalary.baseMonthlySalary, 32000);
  assert.equal(freshSalary.structureId, structure.id);
  assert.equal(freshSalary.effectiveFrom.toISOString().slice(0, 10), '2026-11-20');
  assert.equal(
    (await db.jobOffer.findUnique({ where: { id: freshOffer.id } })).employeeId,
    fresh.id
  );
  assert(
    (await db.onboardingTask.findMany({ where: { offerId: freshOffer.id } })).every(
      (t) => t.employeeId === fresh.id
    )
  );
  await convert(freshOffer, { newAccount: joiningAccount }, 409);
  check(
    'Joining provisions a hashed password-change login and the complete staff, employee, salary and checklist chain'
  );

  for (const partial of ['staff-only', 'employee-only', 'linked-with-salary']) {
    const row = await readyOffer(partial);
    let oldStaff, oldEmployee, oldSalary;
    if (partial !== 'employee-only')
      oldStaff = await db.staff.create({
        data: {
          tenantId: tid,
          staffNumber: 'PART-' + randomUUID(),
          firstName: 'Joining',
          lastName: 'Teacher',
          email: row.candidateEmail,
          phone: '00000000',
          gender: 'OTHER',
          department: 'TEACHING',
          isTeacher: true,
          position: 'Teacher',
          employmentType: 'PERMANENT',
          hireDate: date('2026-11-20'),
        },
      });
    if (partial !== 'staff-only')
      oldEmployee = await db.employee.create({
        data: {
          tenantId: tid,
          employeeCode: 'PART-' + randomUUID(),
          staffId: oldStaff?.id,
          firstName: 'Joining',
          lastName: 'Teacher',
          email: row.candidateEmail,
          joiningDate: date('2026-11-20'),
        },
      });
    if (partial === 'linked-with-salary')
      oldSalary = await db.employeeSalaryAssignment.create({
        data: {
          tenantId: tid,
          employeeId: oldEmployee.id,
          structureId: structure.id,
          baseMonthlySalary: 32000,
          effectiveFrom: date('2026-11-20'),
        },
      });
    if (oldSalary) {
      await db.employeeSalaryAssignment.update({
        where: { id: oldSalary.id },
        data: { baseMonthlySalary: 32001 },
      });
      await convert(row, { newAccount: joiningAccount }, 409);
      assert.equal(await db.user.count({ where: { tenantId: tid, email: row.candidateEmail } }), 0);
      await db.employeeSalaryAssignment.update({
        where: { id: oldSalary.id },
        data: { baseMonthlySalary: 32000 },
      });
      await db.employee.update({
        where: { id: oldEmployee.id },
        data: { employmentStatus: 'RESIGNED', exitDate: date('2026-11-21') },
      });
      await convert(row, { newAccount: joiningAccount }, 409);
      await db.employee.update({
        where: { id: oldEmployee.id },
        data: { employmentStatus: 'ACTIVE', exitDate: null },
      });
    }
    let body = { newAccount: joiningAccount };
    if (partial === 'staff-only') {
      const login = await db.user.create({
        data: {
          tenantId: tid,
          email: row.candidateEmail,
          firstName: 'Joining',
          lastName: 'Teacher',
          role: 'TEACHER',
          passwordHash: randomUUID(),
        },
      });
      body = { userId: login.id };
    }
    const recovered = await convert(row, body);
    if (oldStaff) assert.equal(recovered.staffId, oldStaff.id);
    if (oldEmployee) assert.equal(recovered.id, oldEmployee.id);
    assert.equal(await db.staff.count({ where: { tenantId: tid, email: row.candidateEmail } }), 1);
    assert.equal(
      await db.employee.count({ where: { tenantId: tid, email: row.candidateEmail } }),
      1
    );
    const salaryRows = await db.employeeSalaryAssignment.findMany({
      where: { employeeId: recovered.id },
    });
    assert.equal(salaryRows.length, 1);
    if (oldSalary) assert.equal(salaryRows[0].id, oldSalary.id);
    assert.equal(
      (await db.staff.findUnique({ where: { id: recovered.staffId } })).userId,
      recovered.userId
    );
  }
  const existingEmailOffer = await readyOffer('existing-email', {
    candidateEmail: actors.reviewer.email,
    accountRole: 'SCHOOL_ADMIN',
    schoolDepartment: 'ADMINISTRATION',
  });
  await convert(existingEmailOffer, { newAccount: joiningAccount }, 409);
  await db.user.update({ where: { id: actors.reviewer.id }, data: { isActive: false } });
  await convert(existingEmailOffer, { userId: actors.reviewer.id }, 400);
  await db.user.update({ where: { id: actors.reviewer.id }, data: { isActive: true } });
  await db.jobOffer.update({
    where: { id: existingEmailOffer.id },
    data: { accountRole: 'ACCOUNTANT' },
  });
  await convert(existingEmailOffer, { userId: actors.reviewer.id }, 400);
  const conflictOffer = await readyOffer('identity-conflict');
  await db.staff.create({
    data: {
      tenantId: tid,
      staffNumber: 'CONFLICT-' + randomUUID(),
      userId: actors.teacher.id,
      firstName: 'Wrong',
      lastName: 'Link',
      email: conflictOffer.candidateEmail,
      phone: '00000000',
      gender: 'OTHER',
      department: 'TEACHING',
      isTeacher: true,
      position: 'Teacher',
      employmentType: 'PERMANENT',
      hireDate: date('2026-11-20'),
    },
  });
  await convert(conflictOffer, { newAccount: joiningAccount }, 409);
  assert.equal(
    await db.user.count({ where: { tenantId: tid, email: conflictOffer.candidateEmail } }),
    0
  );
  const frozenOffer = await readyOffer('frozen-joining', { joiningDate: '2026-10-01' });
  await convert(frozenOffer, { newAccount: joiningAccount }, 409);
  assert.equal(
    await db.user.count({ where: { tenantId: tid, email: frozenOffer.candidateEmail } }),
    0
  );
  check(
    'Joining repairs compatible partial chains without duplicates and rejects conflicting identities, roles, inactive logins and frozen salary periods'
  );

  const rollbackOffer = await readyOffer('rollback-joining');
  const originalAudit = service.audit;
  service.audit = async function (db, actor, action, recordId) {
    if (action === 'OFFER_JOINED' && recordId === rollbackOffer.id)
      throw new Error('Injected final audit failure');
    return originalAudit.call(this, db, actor, action, recordId);
  };
  try {
    await convert(rollbackOffer, { newAccount: joiningAccount }, 500);
  } finally {
    service.audit = originalAudit;
  }
  for (const model of ['user', 'staff', 'employee'])
    assert.equal(
      await db[model].count({ where: { tenantId: tid, email: rollbackOffer.candidateEmail } }),
      0
    );
  assert.equal(
    (await db.jobOffer.findUnique({ where: { id: rollbackOffer.id } })).status,
    'OFFERED'
  );
  assert(
    (await db.onboardingTask.findMany({ where: { offerId: rollbackOffer.id } })).every(
      (t) => !t.employeeId
    )
  );
  await convert(rollbackOffer, { newAccount: joiningAccount });
  const competingOffer = await readyOffer('competing-joining');
  const responses = await Promise.all(
    [1, 2].map(() =>
      request(app.getHttpServer())
        .post(`/api/v1/hrms/onboarding/offers/${competingOffer.id}/convert`)
        .set('Authorization', 'Bearer ' + tokenFor('manager'))
        .send({ newAccount: joiningAccount })
    )
  );
  testCount += responses.length;
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
  const competing = await db.employee.findFirst({
    where: { tenantId: tid, email: competingOffer.candidateEmail },
  });
  assert.equal(
    await db.user.count({ where: { tenantId: tid, email: competingOffer.candidateEmail } }),
    1
  );
  assert.equal(
    await db.staff.count({ where: { tenantId: tid, email: competingOffer.candidateEmail } }),
    1
  );
  assert.equal(
    await db.employee.count({ where: { tenantId: tid, email: competingOffer.candidateEmail } }),
    1
  );
  assert.equal(await db.employeeSalaryAssignment.count({ where: { employeeId: competing.id } }), 1);
  check(
    'A late joining failure rolls back the entire chain and concurrent conversion creates exactly one complete chain'
  );
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const resignation = await call(
    'post',
    'exit/resignations',
    { preferredExitDate: today, reason: 'Fixture departure' },
    'other'
  );
  await call(
    'post',
    'exit/relieving-letter',
    {
      resignationId: resignation.id,
      referenceNumber: 'FIX-' + fixture,
      preparationId: randomUUID(),
    },
    'manager',
    409
  );
  await call('patch', `exit/resignations/${resignation.id}/review`, {
    status: 'APPROVED',
    approvedExitDate: today,
  });
  const clearances = await db.exitClearance.findMany({ where: { resignationId: resignation.id } });
  await call(
    'patch',
    `exit/clearance/${clearances.find((c) => c.department === 'PRINCIPAL').id}`,
    { status: 'CLEARED', duesAmount: 0 },
    'librarian',
    403
  );
  for (const clearance of clearances)
    await call(
      'patch',
      `exit/clearance/${clearance.id}`,
      { status: 'CLEARED', duesAmount: 0 },
      clearance.department === 'LIBRARY'
        ? 'librarian'
        : clearance.department === 'ACCOUNTS'
          ? 'accountant'
          : 'manager'
    );
  await call(
    'post',
    `exit/resignations/${resignation.id}/settlement`,
    {
      workingDaysInFinalMonth: 10,
      earnedSalary: 15000,
      leaveEncashmentAmount: 1000,
      noticePayRecovery: 0,
    },
    'accountant'
  );
  const completePath = `exit/resignations/${resignation.id}/complete`;
  const exitReference = 'FIX-' + fixture;
  let preparationId = randomUUID();
  await call('post', `exit/resignations/${resignation.id}/settlement/finalize`, {}, 'manager', 400);
  await call(
    'post',
    completePath,
    { referenceNumber: exitReference, preparationId },
    'accountant',
    403
  );
  await call('post', completePath, { referenceNumber: exitReference, preparationId }, 'other', 403);
  let exitSettlement = await db.fullFinalSettlement.findUnique({
    where: { resignationId: resignation.id },
  });
  assert.equal(exitSettlement.status, 'CALCULATED');
  assert(exitSettlement.preparedSnapshot);
  preparationId = exitSettlement.preparedSnapshot.preparationId;
  const stalePreparationId = preparationId;
  await call('post', completePath, { referenceNumber: exitReference }, 'manager', 400);
  const settlementInput = {
    workingDaysInFinalMonth: 10,
    earnedSalary: 15000,
    leaveEncashmentAmount: 1000,
    noticePayRecovery: 0,
  };
  const prepareExit = async () => {
    const prepared = await call(
      'post',
      `exit/resignations/${resignation.id}/settlement`,
      settlementInput,
      'accountant'
    );
    preparationId = prepared.preparedSnapshot.preparationId;
    return prepared;
  };
  // Legacy staged financial approval must be reviewed again before joining the atomic flow.
  await db.fullFinalSettlement.update({
    where: { id: exitSettlement.id },
    data: {
      status: 'FINALIZED',
      preparedSnapshot: null,
      preparedBy: null,
      settlementDate: new Date(),
    },
  });
  await call(
    'post',
    completePath,
    { referenceNumber: exitReference, preparationId },
    'manager',
    409
  );
  await prepareExit();
  assert.notEqual(preparationId, stalePreparationId);
  await call(
    'post',
    completePath,
    { referenceNumber: exitReference, preparationId: stalePreparationId },
    'manager',
    409
  );
  const principalClearance = clearances.find((c) => c.department === 'PRINCIPAL');
  await call('patch', `exit/clearance/${principalClearance.id}`, {
    status: 'CLEARED',
    duesAmount: 0,
    remarks: 'Reviewed final evidence',
  });
  assert.equal(
    (await db.fullFinalSettlement.findUnique({ where: { id: exitSettlement.id } })).status,
    'REVIEW_REQUIRED'
  );
  await call(
    'post',
    completePath,
    { referenceNumber: exitReference, preparationId },
    'manager',
    409
  );
  await prepareExit();
  await db.fullFinalSettlement.update({
    where: { id: exitSettlement.id },
    data: { netSettlementAmount: 99999 },
  });
  await call(
    'post',
    completePath,
    { referenceNumber: exitReference, preparationId },
    'manager',
    409
  );
  await db.fullFinalSettlement.update({
    where: { id: exitSettlement.id },
    data: { netSettlementAmount: 16000 },
  });
  const libraryClearance = clearances.find((c) => c.department === 'LIBRARY');
  await db.exitClearance.update({
    where: { id: libraryClearance.id },
    data: { department: 'ACCOUNTS' },
  });
  await call(
    'post',
    completePath,
    { referenceNumber: exitReference, preparationId },
    'manager',
    409
  );
  await db.exitClearance.update({
    where: { id: libraryClearance.id },
    data: { department: 'LIBRARY' },
  });
  await db.staff.update({ where: { id: e('other').staffId }, data: { userId: actors.teacher.id } });
  await call(
    'post',
    completePath,
    { referenceNumber: exitReference, preparationId },
    'manager',
    409
  );
  await db.staff.update({ where: { id: e('other').staffId }, data: { userId: actors.other.id } });
  const futureExit = new Date(date(today).getTime() + 86400000).toISOString().slice(0, 10);
  await db.resignation.update({
    where: { id: resignation.id },
    data: { approvedExitDate: date(futureExit) },
  });
  await call(
    'post',
    completePath,
    { referenceNumber: exitReference, preparationId },
    'manager',
    400
  );
  await db.resignation.update({
    where: { id: resignation.id },
    data: { approvedExitDate: date(today) },
  });
  const oldUser = await db.user.findUnique({ where: { id: actors.other.id } });
  const push = await db.pushSubscription.create({
    data: {
      tenantId: tid,
      userId: actors.other.id,
      tokenVersion: oldUser.tokenVersion,
      endpointHash: randomUUID(),
      endpoint: 'https://example.test/exit-push',
      p256dh: 'fixture',
      auth: 'fixture',
    },
  });
  const foreignPush = await db.pushSubscription.create({
    data: {
      tenantId: otherTid,
      userId: actors.foreign.id,
      tokenVersion: 0,
      endpointHash: randomUUID(),
      endpoint: 'https://example.test/foreign-push',
      p256dh: 'fixture',
      auth: 'fixture',
    },
  });
  const refreshSecret = randomUUID();
  const exitAuth = new AuthService(
    scoped,
    jwt,
    new ConfigService({ JWT_REFRESH_SECRET: refreshSecret }),
    {},
    {}
  );
  const oldRefresh = jwt.sign(
    { sub: actors.other.id, type: 'refresh', ver: oldUser.tokenVersion },
    { secret: refreshSecret, expiresIn: '5m' }
  );
  assert((await exitAuth.refreshToken(oldRefresh)).accessToken);
  const originalExitAudit = service.audit;
  service.audit = async function (tx, actor, action, entityId) {
    if (action === 'EXIT_COMPLETED' && entityId === resignation.id)
      throw new Error('Injected exit completion audit failure');
    return originalExitAudit.call(this, tx, actor, action, entityId);
  };
  try {
    await call(
      'post',
      completePath,
      { referenceNumber: exitReference, preparationId },
      'manager',
      500
    );
  } finally {
    service.audit = originalExitAudit;
  }
  const rolledBack = await db.resignation.findUnique({
    where: { id: resignation.id },
    include: { settlement: true, clearances: true },
  });
  assert.equal(rolledBack.status, 'APPROVED');
  assert.equal(rolledBack.completedAt, null);
  assert.equal(rolledBack.settlement.status, 'CALCULATED');
  assert.equal(rolledBack.settlement.finalizedBy, null);
  assert.equal(rolledBack.settlement.settlementDate, null);
  assert(rolledBack.clearances.every((c) => !c.lockedAt));
  assert.equal(
    (await db.employee.findUnique({ where: { id: e('other').id } })).employmentStatus,
    'ACTIVE'
  );
  assert.equal((await db.staff.findUnique({ where: { id: e('other').staffId } })).status, 'ACTIVE');
  assert.equal(
    (await db.user.findUnique({ where: { id: actors.other.id } })).tokenVersion,
    oldUser.tokenVersion
  );
  assert.equal((await db.user.findUnique({ where: { id: actors.other.id } })).isActive, true);
  assert.equal(
    await db.employeeOrderLetter.count({ where: { tenantId: tid, resignationId: resignation.id } }),
    0
  );
  assert.equal(await db.pushSubscription.count({ where: { id: push.id } }), 1);
  assert.equal(
    await db.auditLog.count({
      where: { tenantId: tid, entityId: resignation.id, action: 'HR_EXIT_COMPLETED' },
    }),
    0
  );
  await call('get', 'employees/me', undefined, 'other');
  assert((await exitAuth.refreshToken(oldRefresh)).accessToken);
  check(
    'Exit preparation detects changed clearances, amounts, dates and account identities; a late failure rolls back settlement, letter, clearance locks and revocation'
  );
  const competingExits = await Promise.all(
    [1, 2].map(() =>
      request(app.getHttpServer())
        .post('/api/v1/hrms/' + completePath)
        .set('Authorization', 'Bearer ' + tokenFor('manager'))
        .send({ referenceNumber: exitReference, preparationId })
    )
  );
  testCount += 2;
  assert.deepEqual(competingExits.map((r) => r.status).sort(), [201, 409]);
  const completedExit = competingExits.find((r) => r.status === 201).body.data;
  assert.equal(completedExit.status, 'COMPLETED');
  assert.equal(completedExit.accountRevoked, true);
  assert.equal(completedExit.letter.resignationId, resignation.id);
  assert.equal(completedExit.letter.settlementId, exitSettlement.id);
  assert.equal(
    await db.employeeOrderLetter.count({ where: { tenantId: tid, resignationId: resignation.id } }),
    1
  );
  assert.equal(await db.pushSubscription.count({ where: { id: push.id } }), 0);
  assert.equal(await db.pushSubscription.count({ where: { id: foreignPush.id } }), 1);
  const completedRow = await db.resignation.findUnique({
    where: { id: resignation.id },
    include: { settlement: true, clearances: true },
  });
  assert.equal(completedRow.settlement.status, 'FINALIZED');
  assert.equal(completedRow.settlement.finalizedBy, actors.manager.id);
  assert.equal(completedRow.revokedUserId, actors.other.id);
  assert.equal(completedRow.revokedTokenVersion, oldUser.tokenVersion + 1);
  assert(completedRow.completedAt);
  assert(completedRow.clearances.every((c) => c.lockedAt));
  await call('get', 'employees/me', undefined, 'other', 401);
  await assert.rejects(() => exitAuth.refreshToken(oldRefresh), /Session expired/);
  await db.user.update({ where: { id: actors.other.id }, data: { isActive: true } });
  await call('get', 'employees/me', undefined, 'other', 401);
  await assert.rejects(() => exitAuth.refreshToken(oldRefresh), /Session expired/);
  await db.user.update({ where: { id: actors.other.id }, data: { isActive: false } });
  await call(
    'patch',
    `exit/clearance/${principalClearance.id}`,
    { status: 'CLEARED', duesAmount: 0 },
    'manager',
    409
  );
  await call(
    'post',
    `exit/resignations/${resignation.id}/settlement`,
    settlementInput,
    'accountant',
    409
  );
  await assert.rejects(
    () =>
      db.employeeOrderLetter.create({
        data: {
          tenantId: tid,
          employeeId: e('other').id,
          resignationId: resignation.id,
          settlementId: exitSettlement.id,
          letterType: 'RELIEVING_LETTER',
          referenceNumber: 'SECOND-' + fixture,
          content: 'Duplicate fixture',
          issuedBy: 'Fixture',
        },
      }),
    (error) => error.code === 'P2002'
  );
  await call(
    'post',
    'exit/relieving-letter',
    { resignationId: resignation.id, referenceNumber: 'FIX2-' + fixture, preparationId },
    'manager',
    409
  );
  assert.equal(
    (await db.employee.findUnique({ where: { id: e('other').id } })).employmentStatus,
    'RESIGNED'
  );
  assert.equal((await db.user.findUnique({ where: { id: actors.other.id } })).isActive, false);
  assert.equal(
    (await db.resignation.findUnique({ where: { id: resignation.id } })).status,
    'COMPLETED'
  );
  check(
    'Exit enforces approval, department permissions, settlement and date; completion deactivates staff/login and blocks repeats'
  );
  const readyExit = async (label) => {
    const login = await db.user.create({
      data: {
        tenantId: tid,
        email: `exit-${label}-${fixture}@example.test`,
        firstName: 'Exit',
        lastName: label,
        role: 'TEACHER',
        passwordHash: randomUUID(),
      },
    });
    actors[label] = login;
    const staff = await db.staff.create({
      data: {
        tenantId: tid,
        userId: login.id,
        staffNumber: 'EXIT-' + randomUUID(),
        firstName: 'Exit',
        lastName: label,
        email: login.email,
        phone: '00000000',
        gender: 'OTHER',
        department: 'TEACHING',
        isTeacher: true,
        position: 'Teacher',
        employmentType: 'PERMANENT',
        hireDate: date('2026-01-01'),
      },
    });
    const employee = await db.employee.create({
      data: {
        tenantId: tid,
        staffId: staff.id,
        userId: login.id,
        employeeCode: staff.staffNumber,
        firstName: 'Exit',
        lastName: label,
        email: login.email,
        joiningDate: date('2026-01-01'),
      },
    });
    const resignation = await call(
      'post',
      'exit/resignations',
      { preferredExitDate: today, reason: 'Fixture departure' },
      label
    );
    await call('patch', `exit/resignations/${resignation.id}/review`, {
      status: 'APPROVED',
      approvedExitDate: today,
    });
    for (const c of await db.exitClearance.findMany({ where: { resignationId: resignation.id } }))
      await call('patch', `exit/clearance/${c.id}`, { status: 'CLEARED', duesAmount: 0 });
    const prepared = await call(
      'post',
      `exit/resignations/${resignation.id}/settlement`,
      {
        workingDaysInFinalMonth: 0,
        earnedSalary: 0,
        leaveEncashmentAmount: 0,
        noticePayRecovery: 0,
      },
      'accountant'
    );
    return { resignation, employee, login, preparationId: prepared.preparedSnapshot.preparationId };
  };
  const firstAlias = await readyExit('finalize-alias');
  const firstCompletion = await call(
    'post',
    `exit/resignations/${firstAlias.resignation.id}/settlement/finalize`,
    { referenceNumber: 'ALIAS-' + fixture, preparationId: firstAlias.preparationId }
  );
  assert.equal(firstCompletion.status, 'COMPLETED');
  assert.equal((await db.user.findUnique({ where: { id: firstAlias.login.id } })).isActive, false);
  const secondAlias = await readyExit('letter-alias');
  await call(
    'post',
    'exit/relieving-letter',
    {
      resignationId: secondAlias.resignation.id,
      referenceNumber: 'alias-' + fixture,
      preparationId: secondAlias.preparationId,
    },
    'manager',
    409
  );
  assert.equal(
    (await db.resignation.findUnique({ where: { id: secondAlias.resignation.id } })).status,
    'APPROVED'
  );
  const aliasLetter = await call('post', 'exit/relieving-letter', {
    resignationId: secondAlias.resignation.id,
    referenceNumber: 'RELIEVE-' + fixture,
    preparationId: secondAlias.preparationId,
  });
  assert.equal(aliasLetter.resignationId, secondAlias.resignation.id);
  assert.equal(
    (
      await db.fullFinalSettlement.findUnique({
        where: { resignationId: secondAlias.resignation.id },
      })
    ).status,
    'FINALIZED'
  );
  assert.equal((await db.user.findUnique({ where: { id: secondAlias.login.id } })).isActive, false);
  check(
    'Concurrent exit completion issues one linked letter, rejects stale access/refresh credentials, and both legacy routes commit the same atomic workflow'
  );
  assert(
    (await db.auditLog.count({ where: { tenantId: tid, action: { startsWith: 'HR_' } } })) > 20
  );
  await scoped.$connect();
  await tenants.run(async () => {
    tenants.setTenantId(tid);
    assert.equal(
      await scoped.employee.count({ where: { tenantId: otherTid } }),
      await db.employee.count({ where: { tenantId: tid } })
    );
  });
  const carryEmployee = await db.employee.create({
    data: {
      tenantId: tid,
      employeeCode: 'CARRY-' + fixture,
      firstName: 'Carry',
      lastName: 'Fixture',
      email: `carry-${fixture}@example.test`,
      joiningDate: date('2025-01-01'),
    },
  });
  const priorBalance = await db.leaveBalance.create({
    data: {
      tenantId: tid,
      employeeId: carryEmployee.id,
      leaveTypeId: monthlyLeave.id,
      year: 2025,
      allocatedDays: 12,
      accruedDays: 12,
      usedDays: 2,
    },
  });
  const carryPath = `leaves/balances?employeeId=${carryEmployee.id}&year=2026`;
  const carryRows = await call('get', carryPath);
  const carry = carryRows.find((b) => b.leaveTypeId === monthlyLeave.id);
  assert.equal(carryRows.find((b) => b.leaveTypeId === unpaidLeave.id).carriedDays, 0);
  assert.equal(carry.carriedDays, 3);
  assert.equal(carry.accruedDays, 10);
  assert.equal(carry.allocatedDays, 13);
  assert.equal(
    await db.leaveBalance.count({ where: { employeeId: carryEmployee.id, year: 2026 } }),
    0
  );
  await call('post', 'leaves/balances/accrue', { employeeId: carryEmployee.id, year: 2026 });
  const accrualAuditCount = await db.auditLog.count({
    where: { tenantId: tid, action: 'HR_LEAVE_BALANCE_ACCRUED' },
  });
  await call('post', 'leaves/balances/accrue', { employeeId: carryEmployee.id, year: 2026 });
  assert.equal(
    await db.auditLog.count({ where: { tenantId: tid, action: 'HR_LEAVE_BALANCE_ACCRUED' } }),
    accrualAuditCount
  );
  assert.equal(
    (
      await db.leaveBalance.findFirst({
        where: { employeeId: carryEmployee.id, leaveTypeId: monthlyLeave.id, year: 2026 },
      })
    ).allocatedDays,
    13
  );
  const futureCarry = (
    await call('get', `leaves/balances?employeeId=${carryEmployee.id}&year=2027`)
  ).find((b) => b.leaveTypeId === monthlyLeave.id);
  assert.equal(futureCarry.allocatedDays, 0);
  await db.leaveBalance.update({ where: { id: priorBalance.id }, data: { pendingDays: 1 } });
  await call('get', carryPath, undefined, 'manager', 409);
  await db.leaveBalance.update({ where: { id: priorBalance.id }, data: { pendingDays: 0 } });
  check(
    'Monthly accrual and capped year-end carry-forward are idempotent, do not borrow future entitlement and require prior pending leave to be resolved'
  );
  check('HR actions create audit records and shared tenant middleware scopes HR tables');
  const output = path.join(root, 'qa/hrms-repair');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(
    path.join(output, 'database-results.json'),
    JSON.stringify(
      {
        checks,
        httpAssertions: testCount,
        database: 'Disposable PostgreSQL database ending in _test; generated tenant fixtures only',
        authentication:
          'Test-issued signed JWTs; real signature validation, stored roles, account revocation, tenant resolution, controller guards and PostgreSQL transactions',
      },
      null,
      2
    )
  );
  console.log(JSON.stringify({ checks: checks.length, httpAssertions: testCount }, null, 2));
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (app) await app.close();
    await scoped.$disconnect();
    await db.$disconnect();
  });
