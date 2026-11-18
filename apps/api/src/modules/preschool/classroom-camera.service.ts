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
import { CameraDto, CameraGatewayStreamDto } from './preschool.dto';

const INTERNAL_GATEWAY_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '[::1]',
  'cctv-gateway',
  'krypton_oci_cctv_gateway',
]);

export interface GatewayCameraSummary {
  tenantId: string;
  cameraRef: string;
  label: string;
  vendor: 'hikvision' | 'dahua' | 'cpplus' | 'rtsp' | 'push';
  mode: 'pull' | 'push';
  host: string;
  port: number;
  channel: number;
  stream: 'sub' | 'main';
  username: string;
  hasPassword: boolean;
  rtspPath: string;
  hasCustomRtspUrl: boolean;
  rtspTransport: 'tcp' | 'udp';
  tls: boolean;
  sourceOnDemand: boolean;
  hasCustomPublishSecret: boolean;
  streamPath: string;
  redactedSourceUrl: string;
}

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
  ) { }

  private configured() {
    return !!(
      this.config.get<string>('CCTV_GATEWAY_URL') &&
      this.config.get<string>('CCTV_GATEWAY_KEY') &&
      this.config.get<string>('CCTV_PLAYBACK_ORIGINS')
    );
  }

  private allowInsecureHttp() {
    return (
      String(this.config.get<string>('CCTV_ALLOW_INSECURE_HTTP') || '').toLowerCase() === 'true'
    );
  }

  private gatewayEndpoint(): { base: string; key: string } {
    if (!this.configured()) {
      throw new ServiceUnavailableException('Classroom camera service is not configured');
    }
    const base = this.config.get<string>('CCTV_GATEWAY_URL')!.trim();
    const key = this.config.get<string>('CCTV_GATEWAY_KEY')!.trim();
    let endpoint: URL;
    try {
      endpoint = new URL(base);
    } catch {
      throw new ServiceUnavailableException('Camera gateway configuration is invalid');
    }
    const protocolAllowed =
      endpoint.protocol === 'https:' ||
      (endpoint.protocol === 'http:' &&
        (this.allowInsecureHttp() || INTERNAL_GATEWAY_HOSTS.has(endpoint.hostname.toLowerCase())));
    if (
      !protocolAllowed ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash
    ) {
      throw new ServiceUnavailableException('Camera gateway must use HTTPS');
    }
    return { base: base.replace(/\/+$/, ''), key };
  }

  private isAllowedPlaybackUrl(url: URL, origins: string[]) {
    const protocolAllowed =
      url.protocol === 'https:' || (this.allowInsecureHttp() && url.protocol === 'http:');
    return protocolAllowed && !url.username && !url.password && origins.includes(url.origin);
  }

  private async fetchGatewayState(tenantId: string): Promise<{
    reachable: boolean;
    camerasByRef: Map<string, GatewayCameraSummary>;
    mediamtx: string | null;
    registryWritable: boolean | null;
    httpsEnforced: boolean;
    error: string | null;
  }> {
    const fallback = {
      reachable: false,
      camerasByRef: new Map<string, GatewayCameraSummary>(),
      mediamtx: null,
      registryWritable: null,
      httpsEnforced: !this.allowInsecureHttp(),
      error: null as string | null,
    };
    if (!this.configured()) return fallback;
    let endpoint: { base: string; key: string };
    try {
      endpoint = this.gatewayEndpoint();
    } catch (err) {
      return {
        ...fallback,
        error: err instanceof Error ? err.message : 'Invalid gateway configuration',
      };
    }

    try {
      const response = await axios.get(`${endpoint.base}/cameras`, {
        params: { tenantId },
        headers: { Authorization: `Bearer ${endpoint.key}` },
        timeout: 5000,
        maxRedirects: 0,
        maxContentLength: 65536,
      });
      const list = Array.isArray(response.data?.cameras)
        ? (response.data.cameras as GatewayCameraSummary[])
        : [];
      const map = new Map<string, GatewayCameraSummary>();
      for (const cam of list) {
        if (cam?.cameraRef) map.set(cam.cameraRef, cam);
      }
      const gw = response.data?.gateway;
      return {
        reachable: true,
        camerasByRef: map,
        mediamtx: typeof gw?.mediamtx === 'string' ? gw.mediamtx : null,
        registryWritable: typeof gw?.registryWritable === 'boolean' ? gw.registryWritable : null,
        httpsEnforced:
          typeof gw?.httpsEnforced === 'boolean' ? gw.httpsEnforced : !this.allowInsecureHttp(),
        error: null,
      };
    } catch {
      return {
        ...fallback,
        error: 'CCTV gateway is configured but currently unreachable',
      };
    }
  }

  private async syncCameraToGateway(
    tenantId: string,
    cameraRef: string,
    label: string,
    gatewayStream: CameraGatewayStreamDto
  ): Promise<{ camera?: GatewayCameraSummary; mediamtxSynced?: boolean; mediamtxWarning?: string }> {
    const { base, key } = this.gatewayEndpoint();
    try {
      const response = await axios.put(
        `${base}/cameras`,
        {
          tenantId,
          cameraRef,
          label,
          ...gatewayStream,
        },
        {
          headers: { Authorization: `Bearer ${key}` },
          timeout: 10000,
          maxRedirects: 0,
          maxContentLength: 32000,
        }
      );
      return response.data || {};
    } catch (err: any) {
      const status = err?.response?.status;
      const gatewayMessage =
        typeof err?.response?.data?.error === 'string' ? err.response.data.error : null;
      if (status === 400 && gatewayMessage) {
        throw new BadRequestException(gatewayMessage);
      }
      throw new BadGatewayException(
        gatewayMessage || 'Could not sync camera stream configuration to the CCTV gateway'
      );
    }
  }

  private async removeCameraFromGateway(tenantId: string, cameraRef: string): Promise<boolean> {
    if (!this.configured()) return false;
    try {
      const { base, key } = this.gatewayEndpoint();
      await axios.delete(
        `${base}/cameras/${encodeURIComponent(tenantId)}/${encodeURIComponent(cameraRef)}`,
        {
          headers: { Authorization: `Bearer ${key}` },
          timeout: 5000,
          maxRedirects: 0,
          maxContentLength: 16000,
        }
      );
      return true;
    } catch {
      return false;
    }
  }

  async list(user: Actor, classId: string) {
    await this.access.classroom(user, classId);
    const tenantId = this.access.tenant();
    const [cameras, gwState, clock] = await Promise.all([
      this.db.classroomCamera.findMany({
        where: { tenantId, classId },
        orderBy: { label: 'asc' },
      }),
      this.fetchGatewayState(tenantId),
      this.preschool.clock(),
    ]);
    return {
      cameras: cameras.map((camera) => {
        const gwCam = gwState.camerasByRef.get(camera.externalCameraRef) || null;
        return {
          ...camera,
          gatewayRegistered: Boolean(gwCam),
          gatewayStream: gwCam,
        };
      }),
      gatewayConfigured: this.configured(),
      gatewayReachable: gwState.reachable,
      gatewayHttpsEnforced: gwState.httpsEnforced,
      gatewayMediamtx: gwState.mediamtx,
      gatewayRegistryWritable: gwState.registryWritable,
      gatewayError: gwState.error,
      ...clock,
    };
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
    if (dto.gatewayStream && !this.configured())
      throw new ServiceUnavailableException(
        'Configure the classroom camera gateway before registering camera stream settings'
      );

    const tenantId = this.access.tenant();
    const { gatewayStream, ...cameraData } = dto;

    let previousRef: string | null = null;
    if (id) {
      const existing = await this.db.classroomCamera.findFirst({
        where: { id, tenantId, classId: dto.classId },
        select: { id: true, externalCameraRef: true },
      });
      if (!existing) throw new NotFoundException('Camera not found');
      previousRef = existing.externalCameraRef;
    }

    let syncResult: {
      camera?: GatewayCameraSummary;
      mediamtxSynced?: boolean;
      mediamtxWarning?: string;
    } | null = null;
    if (gatewayStream) {
      syncResult = await this.syncCameraToGateway(
        tenantId,
        cameraData.externalCameraRef,
        cameraData.label,
        gatewayStream
      );
    }

    const saved = await this.db.$transaction(async (tx) => {
      let savedId = id;
      try {
        if (id) {
          const result = await tx.classroomCamera.updateMany({
            where: { id, tenantId, classId: cameraData.classId },
            data: cameraData,
          });
          if (!result.count) throw new NotFoundException('Camera not found');
        } else {
          savedId = (
            await tx.classroomCamera.create({ data: { ...cameraData, tenantId } })
          ).id;
        }
      } catch (error) {
        if ((error as { code?: string }).code === 'P2002')
          throw new ConflictException('This camera reference is already configured');
        throw error;
      }
      await this.preschool.audit(tx, user, 'CLASSROOM_CAMERA_CONFIGURED', savedId!);
      return { id: savedId! };
    });

    if (previousRef && previousRef !== cameraData.externalCameraRef && this.configured()) {
      await this.removeCameraFromGateway(tenantId, previousRef);
    }

    return {
      id: saved.id,
      gatewaySynced: Boolean(syncResult),
      ...(syncResult
        ? {
          mediamtxSynced: Boolean(syncResult.mediamtxSynced),
          mediamtxWarning: syncResult.mediamtxWarning || null,
          streamPath: syncResult.camera?.streamPath || null,
        }
        : {}),
    };
  }

  async remove(user: Actor, id: string) {
    this.access.allow(user, preschoolManagers);
    const tenantId = this.access.tenant();
    const camera = await this.db.classroomCamera.findFirst({
      where: { id, tenantId },
      select: { id: true, classId: true, externalCameraRef: true },
    });
    if (!camera) throw new NotFoundException('Camera not found');
    await this.access.classroom(user, camera.classId);

    await this.db.$transaction(async (tx) => {
      await tx.classroomCamera.deleteMany({ where: { id: camera.id, tenantId } });
      await this.preschool.audit(tx, user, 'CLASSROOM_CAMERA_REMOVED', camera.id);
    });

    const gatewayRemoved = await this.removeCameraFromGateway(tenantId, camera.externalCameraRef);
    return { deleted: true, id: camera.id, gatewayRemoved };
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

    const { base, key } = this.gatewayEndpoint();
    try {
      // The gateway owns RTSP credentials, transcoding and playback expiry. The ERP
      // only asks for a short-lived browser viewer, never returns a raw camera URL.
      const response = await axios.post(
        `${base}/sessions`,
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
        !this.isAllowedPlaybackUrl(url, origins) ||
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
