import { randomUUID } from 'node:crypto';
import { ConflictException, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AIProviderService } from '../teacher-ai/ai-provider.service';
import { StorageService } from '../../common/services/storage.service';
import { PreschoolController } from './preschool.controller';
import { PreschoolContentService } from './preschool-content.service';
import { PreschoolMediaService } from './preschool-media.service';
import { ClassroomCameraService } from './classroom-camera.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { OperationsService } from '../operations/operations.service';
import { SavedTransportService } from '../operations/transport.service';
import { PreschoolAccessService } from './preschool-access.service';
import { PreschoolPickupService } from './preschool-pickup.service';
import { PreschoolService } from './preschool.service';

// Explicit opt-in, disposable fixture tenants and a test-only database name.
// This suite exercises real PostgreSQL locks, foreign keys and transactions.
const testUrl = process.env.PRESCHOOL_TEST_DATABASE_URL;
const integration = testUrl ? describe : describe.skip;
integration('Preschool PostgreSQL integration', () => {
  let db: PrismaService,
    tenants: TenantService,
    service: PreschoolService,
    access: PreschoolAccessService,
    transport: SavedTransportService;
  const tenantA = randomUUID(),
    tenantB = randomUUID(),
    school = randomUUID(),
    cls = randomUUID(),
    student = randomUUID(),
    foreignStudent = randomUUID(),
    parentId = randomUUID(),
    guardianId = randomUUID(),
    managerId = randomUUID(),
    teacherId = randomUUID(),
    staffId = randomUUID();
  const manager = { userId: managerId, role: 'SCHOOL_ADMIN' },
    parent = { userId: parentId, role: 'PARENT' },
    teacher = { userId: teacherId, role: 'TEACHER' };
  const inTenant = <T>(id: string, work: () => Promise<T>) =>
    tenants.run(() => {
      tenants.setTenantId(id);
      return work();
    });
  let app: INestApplication, base: string;
  const secret = 'isolated-preschool-http-integration-secret-only';
  const jwt = new JwtService({ secret });
  const token = (userId: string) =>
    jwt.sign({ sub: userId, ver: 0, type: 'access' }, { expiresIn: '5m' });
  const request = async (
    path: string,
    userId?: string,
    method = 'GET',
    data?: unknown,
    tenantId?: string
  ) => {
    const response = await fetch(base + '/preschool' + path, {
      method,
      headers: {
        ...(userId ? { Authorization: 'Bearer ' + token(userId) } : {}),
        ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
        'Content-Type': 'application/json',
        Connection: 'close',
      },
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });
    const body = (await response.json()) as { students?: { id: string }[]; source?: string };
    return { status: response.status, body };
  };
  beforeAll(async () => {
    const url = new URL(testUrl!);
    if (!/(_test|_qa)$/.test(url.pathname.slice(1)))
      throw new Error('Use an isolated database whose name ends in _test or _qa');
    const original = process.env.DATABASE_URL;
    process.env.DATABASE_URL = testUrl;
    tenants = new TenantService();
    db = new PrismaService(tenants);
    await db.$connect();
    process.env.DATABASE_URL = original;
    access = new PreschoolAccessService(db, tenants);
    const pickup = new PreschoolPickupService(db, access, new ConfigService({ JWT_SECRET: secret }));
    service = new PreschoolService(db, access, pickup);
    transport = new SavedTransportService(db, tenants, new OperationsService(db, tenants, {} as any));
    await db.tenant.createMany({
      data: [tenantA, tenantB].map((id) => ({
        id,
        name: 'Preschool integration fixture',
        subdomain: 'test-' + id,
        contactEmail: 'test@example.test',
        contactPhone: '0000000000',
        timezone: 'Asia/Kolkata',
      })),
    });
    await db.user.createMany({
      data: [
        { id: managerId, role: 'SCHOOL_ADMIN' as const },
        { id: parentId, role: 'PARENT' as const },
        { id: teacherId, role: 'TEACHER' as const },
      ].map((u) => ({
        ...u,
        tenantId: tenantA,
        firstName: 'Test',
        lastName: 'Account',
        email: u.id + '@example.test',
        passwordHash: 'not-a-login-hash',
      })),
    });
    await db.school.create({
      data: {
        id: school,
        tenantId: tenantA,
        name: 'Test preschool',
        email: 'test@example.test',
        phone: '0000000000',
        address: 'Test only',
        city: 'Test',
        schoolType: 'PRIVATE',
        educationLevel: ['PRE_PRIMARY'],
        programme: 'PRESCHOOL',
      },
    });
    await db.class.create({
      data: {
        id: cls,
        tenantId: tenantA,
        schoolId: school,
        name: 'Nursery',
        level: 'Nursery',
        educationLevel: 'PRE_PRIMARY',
        preschoolStage: 'NURSERY',
      },
    });
    await db.student.createMany({
      data: [
        { id: student, tenantId: tenantA, currentClassId: cls },
        { id: foreignStudent, tenantId: tenantB, currentClassId: null },
      ].map((s) => ({
        ...s,
        admissionNumber: s.id,
        firstName: 'Test',
        lastName: 'Child',
        dateOfBirth: new Date('2023-01-01'),
        gender: 'FEMALE',
        admissionDate: new Date(),
      })),
    });
    await db.guardian.create({
      data: {
        id: guardianId,
        tenantId: tenantA,
        userId: parentId,
        firstName: 'Test',
        lastName: 'Parent',
        phone: '0000000000',
        email: 'test@example.test',
      },
    });
    await db.guardianStudentLink.create({
      data: { guardianId, studentId: student, relationship: 'MOTHER', canPickup: true },
    });
    await db.staff.create({
      data: {
        id: staffId,
        tenantId: tenantA,
        userId: teacherId,
        staffNumber: randomUUID(),
        firstName: 'Test',
        lastName: 'Teacher',
        email: 'teacher@example.test',
        phone: '0000000000',
        gender: 'FEMALE',
        department: 'TEACHING',
        position: 'Nursery teacher',
        employmentType: 'PERMANENT',
        hireDate: new Date(),
        isTeacher: true,
      },
    });
    await db.preschoolStaffAssignment.create({
      data: { tenantId: tenantA, classId: cls, staffId },
    });
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [PreschoolController],
      providers: [
        { provide: PrismaService, useValue: db },
        { provide: TenantService, useValue: tenants },
        {
          provide: ConfigService,
          useValue: new ConfigService({ JWT_SECRET: secret, AI_PROVIDER: 'FreeAI' }),
        },
        PreschoolAccessService,
        PreschoolPickupService,
        PreschoolService,
        PreschoolContentService,
        PreschoolMediaService,
        ClassroomCameraService,
        AIProviderService,
        StorageService,
        JwtStrategy,
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.use((req: any, _res: any, next: () => void) =>
      tenants.run(() => {
        if (req.headers['x-tenant-id']) tenants.setTenantId(req.headers['x-tenant-id']);
        next();
      })
    );
    app.useGlobalGuards(new JwtAuthGuard(module.get(Reflector)));
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
    if (!db) return;
    await db.transportJourney.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await db.travelAssignment.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await db.route.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await db.vehicle.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await db.preschoolDayRecord.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await db.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB] } } });
    await app?.close();
    await db.$disconnect();
  });
  it('enforces tenant ownership in PostgreSQL foreign keys', async () => {
    await expect(
      db.preschoolDayRecord.create({
        data: { tenantId: tenantA, studentId: foreignStudent, date: new Date('2026-11-17') },
      })
    ).rejects.toMatchObject({ code: 'P2003' });
    await inTenant(tenantB, async () =>
      expect(await db.preschoolStaffAssignment.findMany()).toHaveLength(0)
    );
  });
  it('enforces JWT, role, child-link and strict input rules over HTTP', async () => {
    expect((await request('/options')).status).toBe(401);
    expect((await request('/options', teacherId)).status).toBe(200);
    expect((await request('/options', parentId)).body.students?.[0].id).toBe(student);
    expect((await request('/options', managerId, 'GET', undefined, tenantB)).status).toBe(401);
    expect((await request('/students/' + foreignStudent, parentId)).status).toBe(404);
    expect((await request('/students/' + student + '/check-in', parentId, 'POST')).status).toBe(
      403
    );
    expect(
      (
        await request('/students/' + student + '/check-out', managerId, 'POST', {
          guardianId,
          identityVerified: 'false',
        })
      ).status
    ).toBe(400);
    expect(
      (
        await request('/staff-assignments', managerId, 'POST', {
          classId: cls,
          staffId,
          assigned: false,
          tenantId: tenantB,
        })
      ).status
    ).toBe(400);
    expect(
      (await request('/schools/' + school, teacherId, 'PATCH', { programme: 'STANDARD' })).status
    ).toBe(403);
    const response = await request('/copilot', teacherId, 'POST', {
      classId: cls,
      language: 'English',
      question: 'How can I help children take turns?',
    });
    expect(response.status).toBe(201);
    expect(response.body.source).toBe('Classroom guidance library');
  });
  it('supports school activation and teacher assignment changes through the API', async () => {
    expect((await request('/navigation', managerId)).status).toBe(200);
    expect(
      (
        await request('/staff-assignments', managerId, 'POST', {
          classId: cls,
          staffId,
          assigned: false,
        })
      ).status
    ).toBe(201);
    expect((await request('/classes/' + cls + '/roster', teacherId)).status).toBe(403);
    expect(
      (
        await request('/staff-assignments', managerId, 'POST', {
          classId: cls,
          staffId,
          assigned: true,
        })
      ).status
    ).toBe(201);
    expect((await request('/classes/' + cls + '/roster', teacherId)).status).toBe(200);
    expect(
      (await request('/schools/' + school, managerId, 'PATCH', { programme: 'STANDARD' })).status
    ).toBe(403);
    // Simulate a platform-controlled type change to verify downstream visibility.
    await inTenant(tenantA, () => db.school.update({ where: { id: school }, data: { programme: 'STANDARD' } }));
    expect((await request('/students/' + student, parentId)).status).toBe(404);
    expect(
      (await request('/schools/' + school, managerId, 'PATCH', { programme: 'COMBINED' })).status
    ).toBe(403);
    await inTenant(tenantA, () => db.school.update({ where: { id: school }, data: { programme: 'COMBINED' } }));
    expect(
      (await request('/classes/' + cls, managerId, 'PATCH', { stage: 'NURSERY' })).status
    ).toBe(200);
    expect((await request('/students/' + student, parentId)).status).toBe(200);
  });
  it('supports nursery assignments and serializes concurrent duplicate check-ins', async () =>
    inTenant(tenantA, async () => {
      await access.classroom(teacher, cls);
      const results = await Promise.allSettled([
        service.checkIn(teacher, student),
        service.checkIn(teacher, student),
      ]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
      expect(rejected.reason).toBeInstanceOf(ConflictException);
      expect(await db.attendanceRecord.count({ where: { studentId: student } })).toBe(1);
      expect(
        await db.activityFeed.count({ where: { studentId: student, activityType: 'ATTENDANCE' } })
      ).toBe(1);
    }));
  it('rejects stale concurrent edits and keeps private observations out of the parent view', async () =>
    inTenant(tenantA, async () => {
      const day = await db.preschoolDayRecord.findFirstOrThrow({ where: { studentId: student } });
      const results = await Promise.allSettled([
        service.care(teacher, student, {
          version: day.version,
          notes: 'Private one',
          shareWithParents: false,
        }),
        service.care(teacher, student, {
          version: day.version,
          notes: 'Private two',
          shareWithParents: false,
        }),
      ]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const today = (await service.clock()).today;
      await service.observe(teacher, {
        studentId: student,
        domain: 'LANGUAGE',
        level: 'EMERGING',
        skill: 'Requests help',
        observation: 'Used a gesture during play.',
        observedOn: today,
        shared: false,
      });
      const view = await service.child(parent, student, {});
      expect(view.observations).toHaveLength(0);
      expect(view.days[0]).not.toHaveProperty('notes');
      await expect(inTenant(tenantB, () => service.child(parent, student, {}))).rejects.toThrow();
    }));
  it('records authorized checkout once and rolls back blocked attempts', async () =>
    inTenant(tenantA, async () => {
      await service.pickupPermission(manager, student, guardianId, false);
      await expect(
        service.checkOut(manager, student, { guardianId, identityVerified: true })
      ).rejects.toThrow();
      expect(
        (await db.preschoolDayRecord.findFirstOrThrow({ where: { studentId: student } })).checkOutAt
      ).toBeNull();
      await service.pickupPermission(manager, student, guardianId, true);
      await service.checkOut(manager, student, { guardianId, identityVerified: true });
      await expect(
        service.checkOut(manager, student, { guardianId, identityVerified: true })
      ).rejects.toBeInstanceOf(ConflictException);
    }));
  it('persists bus alerts once and rolls back unsafe trip completion', async () =>
    inTenant(tenantA, async () => {
      const vehicle = await db.vehicle.create({
        data: { tenantId: tenantA, registrationNumber: randomUUID(), capacity: 8 },
      });
      const route = await db.route.create({
        data: { tenantId: tenantA, name: 'Test route', vehicleId: vehicle.id },
      });
      const stop = await db.routeStop.create({
        data: {
          routeId: route.id,
          name: 'Test stop',
          sequence: 1,
          latitude: 10,
          longitude: 76,
          scheduledTime: '09:00',
        },
      });
      await db.travelAssignment.create({
        data: { tenantId: tenantA, studentId: student, routeId: route.id, stopId: stop.id },
      });
      const trip = await transport.start(manager, {
        routeId: route.id,
        direction: 'MORNING_PICKUP',
      });
      await transport.ping(manager, trip.id, { latitude: 10, longitude: 76, accuracy: 20 });
      await transport.ping(manager, trip.id, { latitude: 10, longitude: 76, accuracy: 20 });
      expect(await db.transportAlert.count({ where: { tripId: trip.id, kind: 'ARRIVING' } })).toBe(
        1
      );
      await transport.passenger(manager, trip.id, { studentId: student, status: 'BOARDED' });
      await expect(transport.end(manager, trip.id)).rejects.toBeInstanceOf(ConflictException);
      expect((await db.transportJourney.findFirstOrThrow({ where: { id: trip.id } })).status).toBe(
        'IN_TRANSIT'
      );
      await transport.passenger(manager, trip.id, { studentId: student, status: 'DROPPED' });
      await transport.end(manager, trip.id);
      expect((await db.transportJourney.findFirstOrThrow({ where: { id: trip.id } })).status).toBe(
        'COMPLETED'
      );
    }));
});
