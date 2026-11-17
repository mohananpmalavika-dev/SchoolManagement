import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../../database/prisma.service';
import { Actor } from '../operations/operations.service';
import { PreschoolAccessService, preschoolManagers } from './preschool-access.service';
import { PreschoolService } from './preschool.service';
import { CameraDto } from './preschool.dto';

export function cameraWindow(
  camera: { weekdays: number[]; startMinute: number; endMinute: number },
  timezone: string,
  now = new Date()
) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(part('weekday'));
  const minute = Number(part('hour')) * 60 + Number(part('minute'));
  return camera.weekdays.includes(day) && minute >= camera.startMinute && minute < camera.endMinute;
}

@Injectable()
export class ClassroomCameraService {
  constructor(
    private db: PrismaService,
    private access: PreschoolAccessService,
    private preschool: PreschoolService,
    private config: ConfigService
  ) {}
  private configured() {
    return !!(
      this.config.get<string>('CCTV_GATEWAY_URL') &&
      this.config.get<string>('CCTV_GATEWAY_KEY') &&
      this.config.get<string>('CCTV_PLAYBACK_ORIGINS')
    );
  }
  async list(user: Actor, classId: string) {
    await this.access.classroom(user, classId);
    const cameras = await this.db.classroomCamera.findMany({
      where: { tenantId: this.access.tenant(), classId },
      orderBy: { label: 'asc' },
    });
    return { cameras, gatewayConfigured: this.configured(), ...(await this.preschool.clock()) };
  }
  async save(user: Actor, dto: CameraDto, id?: string) {
    this.access.allow(user, preschoolManagers);
    await this.access.classroom(user, dto.classId);
    if (dto.startMinute >= dto.endMinute)
      throw new BadRequestException('Viewing hours must start and end on the same day');
    if (dto.enabled && !this.configured())
      throw new ServiceUnavailableException(
        'Configure the classroom camera gateway before enabling a camera'
      );
    return this.db.$transaction(async (tx) => {
      let savedId = id;
      try {
        if (id) {
          const result = await tx.classroomCamera.updateMany({
            where: { id, tenantId: this.access.tenant(), classId: dto.classId },
            data: dto,
          });
          if (!result.count) throw new NotFoundException('Camera not found');
        } else
          savedId = (
            await tx.classroomCamera.create({ data: { ...dto, tenantId: this.access.tenant() } })
          ).id;
      } catch (error) {
        if ((error as { code?: string }).code === 'P2002')
          throw new ConflictException('This camera reference is already configured');
        throw error;
      }
      await this.preschool.audit(tx, user, 'CLASSROOM_CAMERA_CONFIGURED', savedId!);
      return { id: savedId };
    });
  }
  async parentList(user: Actor, studentId: string) {
    const student = await this.access.student(user, studentId);
    const link = await this.access.guardian(user, studentId);
    const clock = await this.preschool.clock();
    const [cameras, consent] = await Promise.all([
      this.db.classroomCamera.findMany({
        where: {
          tenantId: this.access.tenant(),
          classId: student.currentClassId!,
          enabled: true,
          parentAccess: true,
        },
        select: { id: true, label: true, weekdays: true, startMinute: true, endMinute: true },
      }),
      this.db.classroomCameraConsent.findFirst({
        where: { tenantId: this.access.tenant(), studentId, guardianId: link.guardianId },
      }),
    ]);
    return {
      ...clock,
      cameras: cameras.map((c) => ({
        ...c,
        available: cameraWindow(c, clock.timezone) && this.configured() && link.receiveUpdates,
      })),
      consent: !!(consent?.grantedAt && !consent.revokedAt),
    };
  }
  async consent(user: Actor, studentId: string, consent: boolean) {
    const link = await this.access.guardian(user, studentId),
      tenantId = this.access.tenant();
    return this.db.$transaction(async (tx) => {
      await tx.classroomCameraConsent.upsert({
        where: {
          tenantId_studentId_guardianId: { tenantId, studentId, guardianId: link.guardianId },
        },
        create: {
          tenantId,
          studentId,
          guardianId: link.guardianId,
          grantedAt: consent ? new Date() : null,
          revokedAt: consent ? null : new Date(),
        },
        update: { grantedAt: consent ? new Date() : null, revokedAt: consent ? null : new Date() },
      });
      await this.preschool.audit(
        tx,
        user,
        consent ? 'CLASSROOM_CAMERA_CONSENT_GRANTED' : 'CLASSROOM_CAMERA_CONSENT_REVOKED',
        studentId
      );
      return { consent };
    });
  }
  async session(user: Actor, studentId: string, cameraId: string) {
    const student = await this.access.student(user, studentId);
    const camera = await this.db.classroomCamera.findFirst({
      where: {
        id: cameraId,
        tenantId: this.access.tenant(),
        classId: student.currentClassId!,
        enabled: true,
      },
    });
    if (!camera) throw new NotFoundException('Camera not available for this classroom');
    const { timezone } = await this.preschool.clock();
    if (user.role === 'PARENT') {
      const link = await this.access.guardian(user, studentId);
      const consent = await this.db.classroomCameraConsent.findFirst({
        where: {
          tenantId: this.access.tenant(),
          studentId,
          guardianId: link.guardianId,
          revokedAt: null,
          grantedAt: { not: null },
        },
      });
      if (
        !camera.parentAccess ||
        !link.receiveUpdates ||
        !consent ||
        !cameraWindow(camera, timezone)
      )
        throw new ForbiddenException(
          'Camera viewing requires consent and an active classroom viewing window'
        );
    }
    if (!this.configured())
      throw new ServiceUnavailableException('Classroom camera service is not configured');
    const base = this.config.get<string>('CCTV_GATEWAY_URL')!,
      key = this.config.get<string>('CCTV_GATEWAY_KEY')!;
    let endpoint: URL;
    try {
      endpoint = new URL(base);
    } catch {
      throw new ServiceUnavailableException('Camera gateway configuration is invalid');
    }
    if (
      endpoint.protocol !== 'https:' ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash
    )
      throw new ServiceUnavailableException('Camera gateway must use HTTPS');
    try {
      // The gateway owns RTSP credentials, transcoding and playback expiry. The ERP
      // only asks for a short-lived browser viewer, never returns a raw camera URL.
      const response = await axios.post(
        base.replace(/\/$/, '') + '/sessions',
        {
          tenantId: this.access.tenant(),
          cameraRef: camera.externalCameraRef,
          viewerId: user.userId,
          expiresIn: 120,
        },
        {
          headers: { Authorization: `Bearer ${key}` },
          timeout: 10000,
          maxRedirects: 0,
          maxContentLength: 16000,
        }
      );
      const result = response.data;
      const url = new URL(result?.url),
        expiresAt = new Date(result?.expiresAt);
      const origins = (this.config.get<string>('CCTV_PLAYBACK_ORIGINS') || '')
        .split(',')
        .map((value) => value.trim());
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        !origins.includes(url.origin) ||
        !Number.isFinite(expiresAt.getTime()) ||
        expiresAt.getTime() <= Date.now() ||
        expiresAt.getTime() > Date.now() + 125000
      )
        throw new Error('Invalid gateway session');
      await this.db.$transaction((tx) =>
        this.preschool.audit(tx, user, 'CLASSROOM_CAMERA_VIEWED', camera.id)
      );
      return { url: url.toString(), expiresAt: expiresAt.toISOString(), label: camera.label };
    } catch {
      throw new BadGatewayException(
        'The classroom camera gateway could not provide a secure viewing session'
      );
    }
  }
}
