import 'reflect-metadata';
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PreschoolAccessService } from './preschool-access.service';
import { PreschoolService, preschoolDate } from './preschool.service';
import { ClassroomCameraService, cameraWindow } from './classroom-camera.service';
import { PreschoolContentService } from './preschool-content.service';
import { preschoolTemplate } from './preschool-templates';
import { CameraDto, GeneratePreschoolDto, contentKinds, CheckOutDto } from './preschool.dto';

const manager = { userId: 'manager', role: 'SCHOOL_ADMIN' },
  teacher = { userId: 'teacher', role: 'TEACHER' },
  parent = { userId: 'parent', role: 'PARENT' };
const child = {
  id: 'child',
  currentClassId: 'class',
  currentClass: {
    name: 'Nursery',
    educationLevel: 'PRE_PRIMARY',
    school: { programme: 'PRESCHOOL', isActive: true },
  },
};
const draft = {
  classId: 'class',
  kind: 'STORY' as const,
  theme: 'Shapes',
  language: 'Malayalam',
  ageMinMonths: 30,
  ageMaxMonths: 48,
  durationMinutes: 15,
};
const fn = (result: unknown = null) => jest.fn().mockResolvedValue(result);
function setup() {
  const db: any = {
    tenant: { findFirst: fn({ timezone: 'Asia/Kolkata' }) },
    student: { findFirst: fn(child), update: fn(child) },
    class: { findFirst: fn({ id: 'class' }), updateMany: fn({ count: 1 }) },
    staff: { findFirst: fn({ id: 'staff' }) },
    timetableEntry: { findMany: fn([]) },
    preschoolStaffAssignment: { findMany: fn([{ classId: 'class' }]) },
    guardianStudentLink: {
      updateMany: fn({ count: 1 }),
      findFirst: fn({
        guardianId: 'guardian',
        canPickup: true,
        receiveUpdates: true,
        guardian: { firstName: 'Anu', lastName: 'M' },
      }),
    },
    preschoolDayRecord: {
      findFirst: fn(null),
      upsert: fn({ id: 'day' }),
      updateMany: fn({ count: 1 }),
      update: fn({ id: 'day' }),
      create: fn({ id: 'day' }),
      findMany: fn([]),
    },
    attendanceRecord: { upsert: fn({}) },
    activityFeed: { create: fn({}), findMany: fn([]) },
    auditLog: { create: fn({}) },
    developmentObservation: { create: fn({ id: 'obs' }), findMany: fn([]) },
    preschoolContent: {
      findMany: fn([]),
      findFirst: fn({ id: 'content', classId: 'class', scheduledOn: new Date('2026-11-17') }),
      updateMany: fn({ count: 1 }),
    },
    classroomCamera: {
      findFirst: fn({
        id: 'camera',
        classId: 'class',
        enabled: true,
        parentAccess: true,
        externalCameraRef: 'nursery_1',
        weekdays: [2],
        startMinute: 540,
        endMinute: 720,
      }),
    },
    classroomCameraConsent: { findFirst: fn({ grantedAt: new Date(), revokedAt: null }) },
  };
  db.$transaction = jest.fn(async (work: (tx: any) => unknown) => work(db));
  const access = new PreschoolAccessService(db, { requireTenantContext: () => 'tenant-a' } as any);
  const service = new PreschoolService(db, access);
  return { db, access, service };
}
describe('Preschool authorization and daily care', () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(new Date('2026-11-17T04:30:00Z')));
  afterEach(() => jest.useRealTimers());
  it('allows explicitly assigned teachers without a timetable and scopes queries to the tenant', async () => {
    const { db, access } = setup();
    await access.classroom(teacher, 'class');
    expect(db.preschoolStaffAssignment.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a', staffId: 'staff' },
      select: { classId: true },
    });
    expect(db.class.findFirst.mock.calls[0][0].where.tenantId).toBe('tenant-a');
    db.preschoolStaffAssignment.findMany.mockResolvedValue([]);
    await expect(access.classroom(teacher, 'other')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('denies non-teaching roles and parents who are not linked to the child', async () => {
    const { db, access } = setup();
    await expect(access.student({ ...parent, role: 'STUDENT' }, 'child')).rejects.toBeInstanceOf(
      ForbiddenException
    );
    db.guardianStudentLink.findFirst.mockResolvedValue(null);
    await expect(access.student(parent, 'child')).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.guardianStudentLink.findFirst.mock.calls[0][0].where.guardian).toEqual({
      tenantId: 'tenant-a',
      userId: 'parent',
    });
  });
  it('rejects regular school children and cross-tenant missing students', async () => {
    const { db, access } = setup();
    db.student.findFirst.mockResolvedValue(null);
    await expect(access.student(manager, 'foreign-child')).rejects.toBeInstanceOf(
      NotFoundException
    );
    db.student.findFirst.mockResolvedValue({
      ...child,
      currentClass: { ...child.currentClass, school: { programme: 'STANDARD', isActive: true } },
    });
    await expect(access.student(manager, 'child')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('records attendance, a parent update and an audit in the same transaction', async () => {
    const { db, service } = setup();
    await service.checkIn(manager, 'child');
    expect(db.student.update).toHaveBeenCalled();
    expect(db.attendanceRecord.upsert.mock.calls[0][0].create).toMatchObject({
      tenantId: 'tenant-a',
      studentId: 'child',
      status: 'PRESENT',
      classId: 'class',
    });
    expect(db.activityFeed.create).toHaveBeenCalledTimes(1);
    expect(db.auditLog.create).toHaveBeenCalledTimes(1);
    db.preschoolDayRecord.findFirst.mockResolvedValue({ id: 'day', checkInAt: new Date() });
    await expect(service.checkIn(manager, 'child')).rejects.toBeInstanceOf(ConflictException);
    expect(db.activityFeed.create).toHaveBeenCalledTimes(1);
  });
  it('requires verified pickup identity, a permitted guardian and an active check-in', async () => {
    const { db, service } = setup();
    await expect(
      service.checkOut(manager, 'child', { guardianId: 'guardian', identityVerified: false })
    ).rejects.toBeInstanceOf(BadRequestException);
    db.guardianStudentLink.findFirst.mockResolvedValue(null);
    await expect(
      service.checkOut(manager, 'child', { guardianId: 'stranger', identityVerified: true })
    ).rejects.toBeInstanceOf(BadRequestException);
    db.guardianStudentLink.findFirst.mockResolvedValue({
      guardian: { firstName: 'Anu', lastName: 'M' },
    });
    await expect(
      service.checkOut(manager, 'child', { guardianId: 'guardian', identityVerified: true })
    ).rejects.toBeInstanceOf(ConflictException);
    db.preschoolDayRecord.findFirst.mockResolvedValue({
      id: 'day',
      checkInAt: new Date(),
      checkOutAt: null,
      version: 2,
    });
    await service.checkOut(manager, 'child', { guardianId: 'guardian', identityVerified: true });
    expect(db.guardianStudentLink.findFirst.mock.calls.at(-1)[0].where).toMatchObject({
      guardianId: 'guardian',
      studentId: 'child',
      canPickup: true,
    });
    expect(db.preschoolDayRecord.updateMany.mock.calls[0][0]).toMatchObject({
      where: { tenantId: 'tenant-a', checkOutAt: null, version: 2 },
      data: { pickupGuardianId: 'guardian', checkedOutBy: 'manager' },
    });
  });
  it('rejects stale care edits before writing or notifying', async () => {
    const { db, service } = setup();
    db.preschoolDayRecord.findFirst.mockResolvedValue({ id: 'day', version: 3 });
    await expect(
      service.care(manager, 'child', { version: 2, notes: 'Old edit', shareWithParents: true })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(db.preschoolDayRecord.update).not.toHaveBeenCalled();
    expect(db.activityFeed.create).not.toHaveBeenCalled();
  });
  it('hides unshared care notes and filters unpublished observations/content for parents', async () => {
    const { db, service } = setup();
    db.preschoolDayRecord.findMany.mockResolvedValue([
      {
        id: 'day',
        date: new Date(),
        checkInAt: new Date(),
        checkOutAt: null,
        notes: 'Private staff note',
        meals: 'Private',
        sharedAt: null,
      },
    ]);
    const result = await service.child(parent, 'child', {});
    expect(result.days[0]).not.toHaveProperty('notes');
    expect(result.days[0]).not.toHaveProperty('meals');
    expect(db.developmentObservation.findMany.mock.calls[0][0].where).toMatchObject({
      tenantId: 'tenant-a',
      shared: true,
    });
    expect(db.preschoolContent.findMany.mock.calls[0][0].where.status).toBe('PUBLISHED');
  });
  it('uses the school timezone and rejects impossible or oversized date ranges', async () => {
    const { service } = setup();
    jest.setSystemTime(new Date('2026-11-17T20:00:00Z'));
    expect((await service.clock()).today).toBe('2026-11-18');
    expect(() => preschoolDate('2026-02-30')).toThrow(BadRequestException);
    await expect(
      service.child(parent, 'child', { from: '2026-01-01', to: '2026-11-17' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('requires a reviewed, scheduled and current draft before publishing', async () => {
    const { db, service } = setup();
    await expect(service.publish(manager, 'content', 1, false)).rejects.toBeInstanceOf(
      BadRequestException
    );
    db.preschoolContent.findFirst.mockResolvedValue({
      id: 'content',
      classId: 'class',
      scheduledOn: null,
    });
    await expect(service.publish(manager, 'content', 1, true)).rejects.toBeInstanceOf(
      BadRequestException
    );
    db.preschoolContent.findFirst.mockResolvedValue({
      id: 'content',
      classId: 'class',
      scheduledOn: new Date(),
    });
    db.preschoolContent.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.publish(manager, 'content', 1, true)).rejects.toBeInstanceOf(
      ConflictException
    );
  });
});
describe('Preschool teaching drafts', () => {
  it.each(['English', 'Malayalam', 'Hindi'])(
    'provides all nine original editable templates in %s',
    (language) => {
      for (const kind of contentKinds) {
        const result = preschoolTemplate({ ...draft, language, kind });
        expect(result.body.length).toBeGreaterThan(100);
        expect(result._source).toBe('TEMPLATE');
        expect(result.body).toContain('Shapes');
      }
    }
  );
  it('keeps student identifiers out of generation and labels template fallback accurately', async () => {
    const { access } = setup(),
      ai: any = { generate: fn(preschoolTemplate(draft)), status: () => ({ provider: 'Gemini' }) };
    const service = new PreschoolContentService(access, ai);
    const result = await service.generate(manager, draft);
    expect(result.source).toBe('Editable template library');
    expect(ai.generate.mock.calls[0][2]).not.toHaveProperty('classId');
    ai.generate.mockResolvedValue({ title: 'Incomplete' });
    await expect(service.generate(manager, draft)).rejects.toBeInstanceOf(BadGatewayException);
  });
  it('scopes INKY guidance to assigned staff and validates its response', async () => {
    const { access } = setup(),
      ai: any = {
        generate: fn({
          answer: 'Model a short turn and offer a quiet alternative.',
          suggestedActivities: ['Picture circle'],
          _source: 'TEMPLATE',
        }),
        status: () => ({ provider: 'FreeAI' }),
      };
    const service = new PreschoolContentService(access, ai);
    const result = await service.copilot(manager, {
      classId: 'class',
      question: 'How can I help children take turns?',
      language: 'English',
    });
    expect(result.source).toBe('Classroom guidance library');
    expect(ai.generate.mock.calls[0][2]).not.toHaveProperty('classId');
    await expect(
      service.copilot(parent, {
        classId: 'class',
        question: 'Give teaching ideas',
        language: 'English',
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('validates bounds, unknown fields and the camera weekday range', async () => {
    const invalidConsent = plainToInstance(
      CheckOutDto,
      { guardianId: '00000000-0000-4000-8000-000000000001', identityVerified: 'false' },
      { enableImplicitConversion: true }
    );
    expect(
      (await validate(invalidConsent)).some((error) => error.property === 'identityVerified')
    ).toBe(true);
    const invalid = plainToInstance(GeneratePreschoolDto, {
      ...draft,
      classId: 'x',
      ageMinMonths: 1,
      extra: true,
    });
    const errors = await validate(invalid, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.map((e) => e.property)).toEqual(
      expect.arrayContaining(['classId', 'ageMinMonths', 'extra'])
    );
    const camera = plainToInstance(CameraDto, {
      classId: 'bad',
      label: 'A',
      externalCameraRef: 'https://camera/',
      enabled: true,
      parentAccess: true,
      weekdays: [8],
      startMinute: -1,
      endMinute: 2000,
    });
    expect((await validate(camera)).length).toBeGreaterThan(4);
  });
});
describe('Private classroom cameras', () => {
  const post = jest.spyOn(axios, 'post');
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-17T04:30:00Z'));
    post.mockReset();
  });
  afterEach(() => jest.useRealTimers());
  function cameras() {
    const s = setup();
    const config = new ConfigService({
      CCTV_GATEWAY_URL: 'https://gateway.example.test/api',
      CCTV_GATEWAY_KEY: 'secret'.repeat(8),
      CCTV_PLAYBACK_ORIGINS: 'https://viewer.example.test',
    });
    return { ...s, cameras: new ClassroomCameraService(s.db, s.access, s.service, config) };
  }
  it('applies school-local days and excludes the exact end of the viewing window', () => {
    const c = { weekdays: [2], startMinute: 540, endMinute: 600 };
    expect(cameraWindow(c, 'Asia/Kolkata', new Date('2026-11-17T03:30:00Z'))).toBe(true);
    expect(cameraWindow(c, 'Asia/Kolkata', new Date('2026-11-17T04:30:00Z'))).toBe(false);
    expect(cameraWindow(c, 'Asia/Kolkata', new Date('2026-11-18T03:30:00Z'))).toBe(false);
  });
  it('denies missing consent and cameras outside the child’s class before calling the gateway', async () => {
    const { db, cameras } = camerasFactory();
    db.classroomCameraConsent.findFirst.mockResolvedValue(null);
    await expect(cameras.session(parent, 'child', 'camera')).rejects.toBeInstanceOf(
      ForbiddenException
    );
    expect(post).not.toHaveBeenCalled();
    db.classroomCamera.findFirst.mockResolvedValue(null);
    await expect(cameras.session(parent, 'child', 'foreign-camera')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
  function camerasFactory() {
    return cameras();
  }
  it('returns only an allowlisted, short-lived viewer and audits access', async () => {
    const { db, cameras } = camerasFactory();
    post.mockResolvedValue({
      data: {
        url: 'https://viewer.example.test/session/token',
        expiresAt: new Date(Date.now() + 120000).toISOString(),
      },
    });
    const result = await cameras.session(parent, 'child', 'camera');
    expect(result).not.toHaveProperty('externalCameraRef');
    expect(result).not.toHaveProperty('key');
    expect(post.mock.calls[0][1]).toMatchObject({
      tenantId: 'tenant-a',
      cameraRef: 'nursery_1',
      viewerId: 'parent',
      expiresIn: 120,
    });
    expect(db.auditLog.create.mock.calls[0][0].data.action).toBe('CLASSROOM_CAMERA_VIEWED');
    post.mockResolvedValue({
      data: {
        url: 'https://attacker.test/view',
        expiresAt: new Date(Date.now() + 120000).toISOString(),
      },
    });
    await expect(cameras.session(parent, 'child', 'camera')).rejects.toBeInstanceOf(
      BadGatewayException
    );
    post.mockResolvedValue({
      data: {
        url: 'https://viewer.example.test/view',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
    });
    await expect(cameras.session(parent, 'child', 'camera')).rejects.toBeInstanceOf(
      BadGatewayException
    );
  });
});
