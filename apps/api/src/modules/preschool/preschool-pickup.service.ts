import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@krypton/database';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { WhatsAppService } from '../communications/whatsapp/whatsapp.service';
import { Actor } from '../operations/operations.service';
import { PreschoolAccessService } from './preschool-access.service';
import { CheckOutDto, PickupPassDto } from './preschool.dto';

export const PICKUP_QR_PREFIX = 'KRYPTON-PICKUP-1:';
const MAX_FAILED_ATTEMPTS = 5;
const DEFAULT_TTL_MINUTES = 30;

export type PickupVerificationMethod = 'MANUAL' | 'OTP' | 'QR';

export interface VerifiedPickupPass {
  method: 'OTP' | 'QR';
  guardianId: string;
  passId: string;
}

function schoolDate(timezone: string): { today: string; date: Date } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  return { today, date: new Date(today + 'T00:00:00.000Z') };
}

@Injectable()
export class PreschoolPickupService {
  private readonly logger = new Logger(PreschoolPickupService.name);

  constructor(
    private db: PrismaService,
    private access: PreschoolAccessService,
    @Optional() private config?: ConfigService,
    @Optional() private email?: EmailService,
    @Optional() private whatsapp?: WhatsAppService
  ) {}

  private tenant() {
    return this.access.tenant();
  }

  private secret(): string {
    const configured =
      this.config?.get<string>('PICKUP_PASS_SECRET') ||
      this.config?.get<string>('JWT_SECRET') ||
      process.env.PICKUP_PASS_SECRET ||
      process.env.JWT_SECRET;
    if (configured && configured.length >= 16) return configured;
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
      return 'preschool-pickup-test-only-fallback-secret';
    }
    throw new Error('PICKUP_PASS_SECRET or JWT_SECRET must be configured for safe pickup passes');
  }

  private deriveKey(purpose: string): Buffer {
    return createHash('sha256').update(`${purpose}:${this.secret()}`).digest();
  }

  private hashOtp(tenantId: string, studentId: string, dateStr: string, otp: string): string {
    return createHmac('sha256', this.deriveKey('krypton:pickup:otp:v1'))
      .update(`${tenantId}:${studentId}:${dateStr}:${otp}`)
      .digest('hex');
  }

  private hashQrToken(tenantId: string, qrToken: string): string {
    return createHmac('sha256', this.deriveKey('krypton:pickup:qr:v1'))
      .update(`${tenantId}:${qrToken}`)
      .digest('hex');
  }

  private matchesHash(expectedHex: string, candidateHex: string): boolean {
    const a = Buffer.from(expectedHex, 'hex');
    const b = Buffer.from(candidateHex, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private encryptPayload(payload: { otp: string; qrPayload: string }): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.deriveKey('krypton:pickup:enc:v1'), iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
  }

  private decryptPayload(blob: string): { otp: string; qrPayload: string } | null {
    try {
      const [ivB64, tagB64, dataB64] = blob.split('.');
      if (!ivB64 || !tagB64 || !dataB64) return null;
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.deriveKey('krypton:pickup:enc:v1'),
        Buffer.from(ivB64, 'base64url')
      );
      decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(dataB64, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
      const parsed = JSON.parse(decrypted) as { otp?: string; qrPayload?: string };
      if (!parsed.otp || !parsed.qrPayload) return null;
      return { otp: parsed.otp, qrPayload: parsed.qrPayload };
    } catch {
      return null;
    }
  }

  private async clock() {
    const tenant = await this.db.tenant.findFirst({
      where: { id: this.tenant() },
      select: { timezone: true },
    });
    const timezone = tenant?.timezone || 'Asia/Kolkata';
    return { timezone, ...schoolDate(timezone) };
  }

  async status(user: Actor, studentId: string) {
    const student = await this.access.student(user, studentId);
    const tenantId = this.tenant();
    const { today, date } = await this.clock();
    const now = new Date();
    const isParent = user.role === 'PARENT';

    const [day, pass, authorizedLinks] = await Promise.all([
      this.db.preschoolDayRecord.findFirst({
        where: { tenantId, studentId, date },
        select: {
          id: true,
          checkInAt: true,
          checkOutAt: true,
          pickupVerificationMethod: true,
          pickupGuardian: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.db.preschoolPickupPass.findFirst({
        where: {
          tenantId,
          studentId,
          date,
          usedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        include: {
          guardian: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      isParent
        ? this.db.guardianStudentLink.findMany({
            where: {
              studentId,
              canPickup: true,
              guardian: { tenantId },
              student: { tenantId },
            },
            select: {
              guardianId: true,
              relationship: true,
              guardian: { select: { id: true, userId: true, firstName: true, lastName: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const policy =
      (student.currentClass?.school?.preschoolPickupVerification as 'OPTIONAL' | 'REQUIRED') ||
      'OPTIONAL';

    let activePass: Record<string, unknown> | null = null;
    if (pass) {
      const guardianLink = authorizedLinks.find((l) => l.guardianId === pass.guardianId);
      const base = {
        id: pass.id,
        guardianId: pass.guardianId,
        guardianName: `${pass.guardian.firstName} ${pass.guardian.lastName}`.trim(),
        relationship: guardianLink?.relationship || null,
        issuedByRole: pass.issuedByRole,
        deliveryChannels: pass.deliveryChannels,
        failedAttempts: pass.failedAttempts,
        maxAttempts: MAX_FAILED_ATTEMPTS,
        expiresAt: pass.expiresAt,
        createdAt: pass.createdAt,
      };
      if (isParent) {
        const secrets = this.decryptPayload(pass.encryptedPayload);
        activePass = secrets ? { ...base, otp: secrets.otp, qrPayload: secrets.qrPayload } : base;
      } else {
        // Staff must NEVER receive the plaintext OTP or QR token.
        activePass = base;
      }
    }

    return {
      today,
      pickupVerification: policy,
      checkedIn: !!day?.checkInAt,
      checkedOut: !!day?.checkOutAt,
      checkInAt: day?.checkInAt || null,
      checkOutAt: day?.checkOutAt || null,
      pickupVerificationMethod: day?.pickupVerificationMethod || null,
      collectedBy: day?.pickupGuardian
        ? `${day.pickupGuardian.firstName} ${day.pickupGuardian.lastName}`.trim()
        : null,
      activePass,
      ...(isParent
        ? {
            selfGuardianId:
              authorizedLinks.find((l) => l.guardian.userId === user.userId)?.guardianId || null,
            authorizedGuardians: authorizedLinks.map((l) => ({
              guardianId: l.guardianId,
              name: `${l.guardian.firstName} ${l.guardian.lastName}`.trim(),
              relationship: l.relationship,
              isSelf: l.guardian.userId === user.userId,
            })),
          }
        : {}),
    };
  }

  async issue(user: Actor, studentId: string, dto: PickupPassDto = {}) {
    const student = await this.access.student(user, studentId);
    const tenantId = this.tenant();
    const { today, date } = await this.clock();
    const now = new Date();
    const isParent = user.role === 'PARENT';
    const ttlMinutes = dto.ttlMinutes ?? DEFAULT_TTL_MINUTES;

    let targetGuardianId = dto.guardianId;
    if (isParent && !targetGuardianId) {
      const ownLink = await this.db.guardianStudentLink.findFirst({
        where: {
          studentId,
          canPickup: true,
          guardian: { tenantId, userId: user.userId },
          student: { tenantId },
        },
        select: { guardianId: true },
      });
      if (!ownLink) {
        throw new BadRequestException(
          'Your parent account does not have pickup permission for this child. Choose another authorized guardian or contact the school office.'
        );
      }
      targetGuardianId = ownLink.guardianId;
    }
    if (!targetGuardianId) {
      throw new BadRequestException('Choose an authorized pickup guardian');
    }

    const link = await this.db.guardianStudentLink.findFirst({
      where: {
        studentId,
        guardianId: targetGuardianId,
        canPickup: true,
        guardian: { tenantId },
        student: { tenantId },
      },
      include: {
        guardian: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
      },
    });
    if (!link) {
      throw new BadRequestException(
        'This person is not an authorized pickup guardian for this child'
      );
    }

    const otp = String(randomInt(100000, 1000000));
    const qrPayload = `${PICKUP_QR_PREFIX}${randomBytes(24).toString('base64url')}`;
    const otpHash = this.hashOtp(tenantId, studentId, today, otp);
    const qrTokenHash = this.hashQrToken(tenantId, qrPayload);
    const encryptedPayload = this.encryptPayload({ otp, qrPayload });
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
    const guardianName = `${link.guardian.firstName} ${link.guardian.lastName}`.trim();
    const studentName = `${student.firstName} ${student.lastName}`.trim();

    const created = await this.db.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId, tenantId },
        data: { updatedAt: now },
      });
      const day = await tx.preschoolDayRecord.findFirst({
        where: { tenantId, studentId, date },
      });
      if (!day?.checkInAt || day.checkOutAt) {
        throw new ConflictException(
          'A pickup pass can only be created while the child is checked in today'
        );
      }
      await tx.preschoolPickupPass.updateMany({
        where: {
          tenantId,
          studentId,
          date,
          usedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: now },
      });
      const pass = await tx.preschoolPickupPass.create({
        data: {
          tenantId,
          studentId,
          guardianId: link.guardianId,
          date,
          otpHash,
          qrTokenHash,
          encryptedPayload,
          issuedByUserId: user.userId,
          issuedByRole: user.role,
          deliveryChannels: ['PORTAL'],
          expiresAt,
        },
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: user.userId,
          action: isParent ? 'PRESCHOOL_PICKUP_PASS_ISSUED' : 'PRESCHOOL_PICKUP_PASS_REQUESTED',
          entityType: 'preschool',
          entityId: pass.id,
        },
      });
      if (!isParent) {
        await tx.activityFeed.create({
          data: {
            tenantId,
            studentId,
            title: 'Safe pickup pass ready',
            description: `School staff requested a safe pickup verification pass for ${guardianName}. Open your Safe Pickup Pass in the preschool workspace to view the 6-digit OTP or QR code.`,
            activityType: 'ATTENDANCE',
            createdBy: user.userId,
            isVisibleToParents: true,
          },
        });
      }
      return pass;
    });

    // Best-effort out-of-band delivery (never exposes OTP/wa.me links back to staff)
    const channels = ['PORTAL'];
    if (this.whatsapp?.hasLiveProvider() && link.guardian.phone) {
      try {
        const result = await this.whatsapp.sendMessage({
          to: link.guardian.phone,
          body: `Krypton Safe Pickup OTP for ${studentName} (${guardianName}): ${otp}. Valid for ${ttlMinutes} minutes. You can also show the QR pass in your Parent Portal. Share only with the collecting guardian.`,
        });
        if (result && result.provider !== 'WHATSAPP_WEB') channels.push('WHATSAPP');
      } catch (err) {
        this.logger.warn(`WhatsApp pickup OTP delivery failed for pass ${created.id}: ${String(err)}`);
      }
    }
    if (this.email && link.guardian.email) {
      try {
        const sent = await this.email.sendPickupOtp(link.guardian.email, {
          guardianName,
          studentName,
          otp,
          expiresMinutes: ttlMinutes,
        });
        if (sent) channels.push('EMAIL');
      } catch (err) {
        this.logger.warn(`Email pickup OTP delivery failed for pass ${created.id}: ${String(err)}`);
      }
    }
    if (channels.length > 1) {
      await this.db.preschoolPickupPass.updateMany({
        where: { id: created.id, tenantId },
        data: { deliveryChannels: channels },
      });
    }

    const base = {
      id: created.id,
      guardianId: link.guardianId,
      guardianName,
      relationship: link.relationship,
      issuedByRole: created.issuedByRole,
      deliveryChannels: channels,
      failedAttempts: 0,
      maxAttempts: MAX_FAILED_ATTEMPTS,
      expiresAt: created.expiresAt,
      createdAt: created.createdAt,
    };

    // Staff must NEVER receive the plaintext OTP or QR payload.
    return isParent ? { ...base, otp, qrPayload } : base;
  }

  async revoke(user: Actor, studentId: string) {
    await this.access.student(user, studentId);
    const tenantId = this.tenant();
    const { date } = await this.clock();
    const now = new Date();
    return this.db.$transaction(async (tx) => {
      const result = await tx.preschoolPickupPass.updateMany({
        where: {
          tenantId,
          studentId,
          date,
          usedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: now },
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: user.userId,
          action: 'PRESCHOOL_PICKUP_PASS_REVOKED',
          entityType: 'preschool',
          entityId: studentId,
        },
      });
      return { revoked: result.count };
    });
  }

  async verifyForCheckout(
    tx: Prisma.TransactionClient,
    tenantId: string,
    studentId: string,
    today: string,
    date: Date,
    dto: CheckOutDto
  ): Promise<VerifiedPickupPass> {
    const otp = dto.pickupOtp?.trim();
    const qrToken = dto.pickupQrToken?.trim();
    if (!otp && !qrToken) {
      throw new BadRequestException('Parent pickup OTP or QR pass is required for checkout');
    }

    const now = new Date();
    const pass = await tx.preschoolPickupPass.findFirst({
      where: {
        tenantId,
        studentId,
        date,
        usedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!pass) {
      throw new BadRequestException(
        'No active pickup pass found for today. Ask the parent to generate a pass or send a new pickup OTP.'
      );
    }

    if (pass.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      await this.db.preschoolPickupPass.updateMany({
        where: { id: pass.id, tenantId, revokedAt: null },
        data: { revokedAt: now },
      });
      throw new BadRequestException(
        'Pickup pass locked after too many invalid attempts. Generate a new pass.'
      );
    }

    let method: 'OTP' | 'QR';
    let matched = false;
    if (qrToken && otp) {
      const qrMatched = this.matchesHash(pass.qrTokenHash, this.hashQrToken(tenantId, qrToken));
      const otpMatched = this.matchesHash(
        pass.otpHash,
        this.hashOtp(tenantId, studentId, today, otp)
      );
      matched = qrMatched && otpMatched;
      method = 'QR';
    } else if (qrToken) {
      matched = this.matchesHash(pass.qrTokenHash, this.hashQrToken(tenantId, qrToken));
      method = 'QR';
    } else {
      matched = this.matchesHash(
        pass.otpHash,
        this.hashOtp(tenantId, studentId, today, otp!)
      );
      method = 'OTP';
    }

    if (!matched) {
      const nextAttempts = pass.failedAttempts + 1;
      // Persist failed attempts on the root Prisma client so transaction rollback does not erase brute-force tracking.
      await this.db.preschoolPickupPass.updateMany({
        where: { id: pass.id, tenantId, usedAt: null },
        data: {
          failedAttempts: nextAttempts,
          ...(nextAttempts >= MAX_FAILED_ATTEMPTS ? { revokedAt: now } : {}),
        },
      });
      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
        throw new BadRequestException(
          'Pickup pass locked after too many invalid attempts. Generate a new pass.'
        );
      }
      throw new BadRequestException(
        method === 'QR'
          ? 'Invalid or expired pickup QR pass. Ask the parent to refresh their pass.'
          : 'Invalid pickup OTP. Check the 6-digit code on the parent’s phone.'
      );
    }

    if (dto.guardianId && dto.guardianId !== pass.guardianId) {
      throw new BadRequestException(
        'This pickup pass was issued for a different authorized guardian'
      );
    }

    const consumed = await tx.preschoolPickupPass.updateMany({
      where: {
        id: pass.id,
        tenantId,
        usedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (!consumed.count) {
      throw new ConflictException('This pickup pass has already been used or expired');
    }

    return { method, guardianId: pass.guardianId, passId: pass.id };
  }
}
