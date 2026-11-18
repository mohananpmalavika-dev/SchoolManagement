import 'reflect-metadata';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PreschoolAccessService } from './preschool-access.service';
import { PICKUP_QR_PREFIX, PreschoolPickupService } from './preschool-pickup.service';
import { PreschoolService } from './preschool.service';
import { CheckOutDto, PickupPassDto, SchoolProgrammeDto } from './preschool.dto';

const manager = { userId: 'manager', role: 'SCHOOL_ADMIN' };
const parent = { userId: 'parent', role: 'PARENT' };
const guardianId = '00000000-0000-4000-8000-000000000003';
const otherGuardianId = '00000000-0000-4000-8000-000000000004';
const studentId = '00000000-0000-4000-8000-000000000001';

function buildFixture(pickupPolicy: 'OPTIONAL' | 'REQUIRED' = 'OPTIONAL') {
  const passes: any[] = [];
  const child = {
    id: studentId,
    firstName: 'Maya',
    lastName: 'M',
    currentClassId: 'class',
    currentClass: {
      name: 'Nursery',
      educationLevel: 'PRE_PRIMARY',
      school: {
        programme: 'PRESCHOOL',
        isActive: true,
        preschoolPickupVerification: pickupPolicy,
      },
    },
  };
  const day = {
    id: 'day-1',
    studentId,
    checkInAt: new Date('2026-11-18T03:30:00Z'),
    checkOutAt: null as Date | null,
    pickupVerificationMethod: null as string | null,
    pickupGuardian: null as any,
    version: 1,
  };
  const links = [
    {
      guardianId,
      studentId,
      relationship: 'MOTHER',
      canPickup: true,
      guardian: {
        id: guardianId,
        userId: 'parent',
        firstName: 'Anu',
        lastName: 'Menon',
        phone: '+919876543210',
        email: 'anu@example.test',
      },
    },
    {
      guardianId: otherGuardianId,
      studentId,
      relationship: 'GRANDPARENT',
      canPickup: true,
      guardian: {
        id: otherGuardianId,
        userId: null,
        firstName: 'Rajan',
        lastName: 'Menon',
        phone: '+919876543211',
        email: null,
      },
    },
  ];

  const db: any = {
    tenant: { findFirst: jest.fn().mockResolvedValue({ timezone: 'Asia/Kolkata' }) },
    school: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    class: { findFirst: jest.fn().mockResolvedValue({ id: 'class', school: child.currentClass.school }) },
    student: { findFirst: jest.fn().mockResolvedValue(child), update: jest.fn().mockResolvedValue(child) },
    guardianStudentLink: {
      findMany: jest.fn().mockResolvedValue(links),
      findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
        return (
          links.find((l) => {
            if (where?.guardianId && l.guardianId !== where.guardianId) return false;
            if (where?.canPickup !== undefined && l.canPickup !== where.canPickup) return false;
            if (where?.guardian?.userId && l.guardian.userId !== where.guardian.userId) return false;
            return true;
          }) || null
        );
      }),
      updateMany: jest.fn().mockImplementation(async ({ where }: any) => {
        const matched = links.filter(
          (l) =>
            (!where?.guardianId || l.guardianId === where.guardianId) &&
            (where?.canPickup === undefined || l.canPickup === where.canPickup)
        );
        return { count: matched.length };
      }),
    },
    preschoolDayRecord: {
      findFirst: jest.fn().mockImplementation(async () => day),
      updateMany: jest.fn().mockImplementation(async ({ data }: any) => {
        Object.assign(day, data);
        return { count: 1 };
      }),
    },
    preschoolPickupPass: {
      create: jest.fn().mockImplementation(async ({ data }: any) => {
        const row = {
          id: 'pass-' + (passes.length + 1),
          failedAttempts: 0,
          usedAt: null,
          revokedAt: null,
          createdAt: new Date(),
          ...data,
          guardian: links.find((l) => l.guardianId === data.guardianId)?.guardian,
        };
        passes.push(row);
        return row;
      }),
      findFirst: jest.fn().mockImplementation(async ({ where }: any) => {
        const now = where?.expiresAt?.gt || new Date(0);
        const candidates = passes.filter(
          (p) =>
            p.studentId === where.studentId &&
            (where.usedAt === undefined || p.usedAt === where.usedAt) &&
            (where.revokedAt === undefined || p.revokedAt === where.revokedAt) &&
            p.expiresAt > now
        );
        return candidates.at(-1) || null;
      }),
      updateMany: jest.fn().mockImplementation(async ({ where, data }: any) => {
        let count = 0;
        for (const p of passes) {
          if (where.id && p.id !== where.id) continue;
          if (where.studentId && p.studentId !== where.studentId) continue;
          if (where.usedAt === null && p.usedAt !== null) continue;
          if (where.revokedAt === null && p.revokedAt !== null) continue;
          if (where.expiresAt?.gt && !(p.expiresAt > where.expiresAt.gt)) continue;
          Object.assign(p, data);
          count++;
        }
        return { count };
      }),
    },
    activityFeed: { create: jest.fn().mockResolvedValue({}) },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  };
  db.$transaction = jest.fn(async (work: (tx: any) => unknown) => work(db));

  const config = new ConfigService({
    PICKUP_PASS_SECRET: 'super-secure-pickup-test-secret-key-2026',
  });
  const email = { sendPickupOtp: jest.fn().mockResolvedValue(true) };
  const whatsapp = {
    hasLiveProvider: jest.fn().mockReturnValue(true),
    sendMessage: jest.fn().mockResolvedValue({ sid: 'wa-1', status: 'sent', provider: 'META_CLOUD_API' }),
  };

  const access = new PreschoolAccessService(db, { requireTenantContext: () => 'tenant-a' } as any);
  const pickup = new PreschoolPickupService(db, access, config, email as any, whatsapp as any);
  const service = new PreschoolService(db, access, pickup);
  return { db, access, pickup, service, email, whatsapp, passes, day };
}

describe('Preschool Safe Pickup OTP & QR Verification', () => {
  beforeEach(() => jest.useFakeTimers().setSystemTime(new Date('2026-11-18T05:00:00Z')));
  afterEach(() => jest.useRealTimers());

  it('issues an OTP and QR pass to a linked parent and hides secrets from staff', async () => {
    const { pickup, email, whatsapp } = buildFixture();

    // Staff requests a pass for the parent: staff MUST NOT receive otp or qrPayload.
    const staffIssued = await pickup.issue(manager, studentId, { guardianId });
    expect(staffIssued).not.toHaveProperty('otp');
    expect(staffIssued).not.toHaveProperty('qrPayload');
    expect(staffIssued.deliveryChannels).toEqual(expect.arrayContaining(['PORTAL', 'WHATSAPP', 'EMAIL']));
    expect(whatsapp.sendMessage).toHaveBeenCalledTimes(1);
    expect(email.sendPickupOtp).toHaveBeenCalledTimes(1);

    // Staff status check also never leaks otp or qrPayload.
    const staffStatus = await pickup.status(manager, studentId);
    expect(staffStatus.activePass).toBeTruthy();
    expect(staffStatus.activePass).not.toHaveProperty('otp');
    expect(staffStatus.activePass).not.toHaveProperty('qrPayload');

    // Authenticated linked parent sees decrypted OTP + QR pass on their phone.
    const parentStatus = await pickup.status(parent, studentId);
    expect((parentStatus.activePass as any).otp).toMatch(/^\d{6}$/);
    expect((parentStatus.activePass as any).qrPayload.startsWith(PICKUP_QR_PREFIX)).toBe(true);
  });

  it('verifies checkout with a valid 6-digit OTP and prevents replay', async () => {
    const { pickup, service, db } = buildFixture('REQUIRED');
    const issued: any = await pickup.issue(parent, studentId, {});

    // Manual checkout without OTP/QR must be rejected when school requires verification.
    await expect(
      service.checkOut(manager, studentId, { guardianId, identityVerified: true })
    ).rejects.toBeInstanceOf(BadRequestException);

    // Valid OTP succeeds, marks pass used, and logs OTP-verified audit action.
    const result = await service.checkOut(manager, studentId, {
      guardianId,
      identityVerified: true,
      pickupOtp: issued.otp,
    });
    expect(result).toMatchObject({ verificationMethod: 'OTP', guardianId });
    expect(db.auditLog.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({ action: 'PRESCHOOL_CHECK_OUT_OTP_VERIFIED' }),
    });
    expect(db.activityFeed.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({
        description: expect.stringContaining('Verified with parent pickup OTP'),
      }),
    });

    // Already checked out -> conflict on replay.
    await expect(
      service.checkOut(manager, studentId, {
        guardianId,
        identityVerified: true,
        pickupOtp: issued.otp,
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('verifies checkout with a parent QR pass even without pre-selecting guardianId', async () => {
    const { pickup, service, db } = buildFixture('REQUIRED');
    const issued: any = await pickup.issue(parent, studentId, { guardianId: otherGuardianId });

    // Mismatched guardianId should be rejected.
    await expect(
      service.checkOut(manager, studentId, {
        guardianId,
        identityVerified: true,
        pickupQrToken: issued.qrPayload,
      })
    ).rejects.toBeInstanceOf(BadRequestException);

    // Omitting guardianId resolves the authorized guardian bound to the QR pass.
    const result = await service.checkOut(manager, studentId, {
      identityVerified: true,
      pickupQrToken: issued.qrPayload,
    });
    expect(result).toMatchObject({ verificationMethod: 'QR', guardianId: otherGuardianId });
    expect(db.auditLog.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({ action: 'PRESCHOOL_CHECK_OUT_QR_VERIFIED' }),
    });
  });

  it('tracks failed OTP attempts and locks the pass after 5 wrong guesses', async () => {
    const { pickup, service, passes } = buildFixture('OPTIONAL');
    const issued: any = await pickup.issue(parent, studentId, {});
    const wrongOtp = issued.otp === '000000' ? '111111' : '000000';

    for (let i = 0; i < 4; i++) {
      await expect(
        service.checkOut(manager, studentId, {
          guardianId,
          identityVerified: true,
          pickupOtp: wrongOtp,
        })
      ).rejects.toBeInstanceOf(BadRequestException);
    }
    expect(passes[0].failedAttempts).toBe(4);
    expect(passes[0].revokedAt).toBeNull();

    // 5th wrong attempt locks & revokes the pass.
    await expect(
      service.checkOut(manager, studentId, {
        guardianId,
        identityVerified: true,
        pickupOtp: wrongOtp,
      })
    ).rejects.toThrow(/locked/i);
    expect(passes[0].failedAttempts).toBe(5);
    expect(passes[0].revokedAt).toBeInstanceOf(Date);

    // Even the real OTP no longer works once locked.
    await expect(
      service.checkOut(manager, studentId, {
        guardianId,
        identityVerified: true,
        pickupOtp: issued.otp,
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('keeps manual checkout working when verification mode is OPTIONAL', async () => {
    const { service, db } = buildFixture('OPTIONAL');
    const result = await service.checkOut(manager, studentId, {
      guardianId,
      identityVerified: true,
    });
    expect(result).toMatchObject({ verificationMethod: 'MANUAL', guardianId });
    expect(db.auditLog.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({ action: 'PRESCHOOL_CHECK_OUT_IDENTITY_VERIFIED' }),
    });
  });

  it('allows managers to toggle school safe pickup verification policy and validates DTOs', async () => {
    const { service, db } = buildFixture('OPTIONAL');
    const updated = await service.programme(manager, 'school-1', { pickupVerification: 'REQUIRED' });
    expect(updated).toEqual({ id: 'school-1', pickupVerification: 'REQUIRED' });
    expect(db.school.updateMany).toHaveBeenCalledWith({
      where: { id: 'school-1', tenantId: 'tenant-a' },
      data: { preschoolPickupVerification: 'REQUIRED' },
    });

    const badOtp = plainToInstance(CheckOutDto, {
      guardianId,
      identityVerified: true,
      pickupOtp: '12ab',
    });
    expect((await validate(badOtp)).some((e) => e.property === 'pickupOtp')).toBe(true);

    const badTtl = plainToInstance(PickupPassDto, { ttlMinutes: 999 });
    expect((await validate(badTtl)).some((e) => e.property === 'ttlMinutes')).toBe(true);

    const validPolicy = plainToInstance(SchoolProgrammeDto, { pickupVerification: 'REQUIRED' });
    expect(await validate(validPolicy)).toHaveLength(0);
  });
});
