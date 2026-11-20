import { createHash, randomUUID } from 'node:crypto';

import { PushSubscription } from '@krypton/database';
import { ConflictException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import * as webpush from 'web-push';

import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';

import { PushEndpointDto, SavePushSubscriptionDto } from './push.dto';
import { pushEndpointHash, validatePushKeys } from './push-endpoint';

interface PushActor { userId: string; tokenVersion: number }
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private running = false;
  constructor(private db: PrismaService, private tenants: TenantService, private config: ConfigService) {}

  configuration() {
    const publicKey = this.config.get<string>('WEB_PUSH_PUBLIC_KEY');
    const enabled = !!(publicKey && this.config.get('WEB_PUSH_PRIVATE_KEY') && this.config.get('WEB_PUSH_SUBJECT'));
    return { enabled, publicKey: enabled ? publicKey : null };
  }

  private requireConfiguration() {
    if (!this.configuration().enabled) throw new ServiceUnavailableException('Background push is not configured by your school yet');
  }

  async subscribe(actor: PushActor, input: SavePushSubscriptionDto) {
    this.requireConfiguration();
    const tenantId = this.tenants.requireTenantContext(), endpointHash = pushEndpointHash(input.endpoint);
    validatePushKeys(input.keys);
    const expirationAt = input.expirationTime == null ? null : new Date(input.expirationTime);
    if (expirationAt && (!Number.isFinite(expirationAt.getTime()) || expirationAt <= new Date()))
      throw new ConflictException('The browser subscription has expired. Enable notifications again');
    // A browser endpoint is shared by accounts using the same profile. Possession
    // of both browser keys permits rebinding on sign-in without retaining the old user.
    return this.tenants.run(() => this.db.$transaction(async tx => {
      const user = await tx.user.findFirst({ where: { id: actor.userId, tenantId, isActive: true, tokenVersion: actor.tokenVersion } });
      if (!user) throw new ConflictException('An active school session is required. Sign in again before enabling notifications');
      const previous = await tx.pushSubscription.findUnique({ where: { endpointHash } });
      if (previous && (previous.p256dh !== input.keys.p256dh || previous.auth !== input.keys.auth))
        throw new ConflictException('This endpoint has different browser keys. Reset the browser subscription');
      const reset = !previous || previous.userId !== user.id || previous.tenantId !== tenantId || previous.tokenVersion !== user.tokenVersion;
      const now = new Date();
      const data = { tenantId, userId: user.id, tokenVersion: user.tokenVersion, endpoint: input.endpoint,
        p256dh: input.keys.p256dh, auth: input.keys.auth, expirationAt,
        ...(reset ? { cursorAt: now, cursorId: '', retryCount: 0, nextAttemptAt: now, leaseUntil: null, leaseToken: null, lastError: null, lastPushAt: null } : {}) };
      await tx.pushSubscription.upsert({ where: { endpointHash }, create: { ...data, endpointHash }, update: data });
      return { subscribed: true };
    }, { isolationLevel: 'Serializable' })).catch(error => {
      if (['P2034', 'P2002'].includes((error as { code?: string }).code || ''))
        throw new ConflictException('Another device binding changed. Try enabling notifications again');
      throw error;
    });
  }

  async status(actor: PushActor, input: PushEndpointDto) {
    const row = await this.db.pushSubscription.findFirst({ where: {
      tenantId: this.tenants.requireTenantContext(), userId: actor.userId, tokenVersion: actor.tokenVersion, endpointHash: pushEndpointHash(input.endpoint),
    }, select: { id: true, lastPushAt: true, lastError: true } });
    return { subscribed: !!row, lastPushAt: row?.lastPushAt || null, lastError: row?.lastError || null };
  }

  async unsubscribe(actor: PushActor, input: PushEndpointDto) {
    await this.db.pushSubscription.deleteMany({ where: {
      tenantId: this.tenants.requireTenantContext(), userId: actor.userId, endpointHash: pushEndpointHash(input.endpoint),
    } });
    return { subscribed: false };
  }

  private async send(subscription: PushSubscription, tag: string, test = false) {
    // Revalidate stored endpoints, including records inserted outside this API.
    pushEndpointHash(subscription.endpoint);
    return webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify({ title: 'Krypton School ERP', body: test ? 'Background notifications are enabled on this device.' : 'You have a new school update. Open the app to view it.',
        url: '/notifications', tag: `school-${tag}` }), {
        vapidDetails: { subject: this.config.getOrThrow('WEB_PUSH_SUBJECT'), publicKey: this.config.getOrThrow('WEB_PUSH_PUBLIC_KEY'), privateKey: this.config.getOrThrow('WEB_PUSH_PRIVATE_KEY') },
        TTL: 86400, urgency: 'normal', timeout: 5000,
        topic: createHash('sha256').update(tag).digest('base64url').slice(0, 32),
      });
  }

  async test(actor: PushActor, input: PushEndpointDto) {
    this.requireConfiguration();
    const tenantId = this.tenants.requireTenantContext();
    const row = await this.db.pushSubscription.findFirst({ where: { tenantId, userId: actor.userId, endpointHash: pushEndpointHash(input.endpoint) }, include: { user: true } });
    if (!row || !row.user.isActive || row.tokenVersion !== row.user.tokenVersion || row.tokenVersion !== actor.tokenVersion) throw new ConflictException('Enable notifications on this device first');
    try {
      await this.send(row, 'test-' + randomUUID(), true);
      return { accepted: true, message: 'The push provider accepted the test notification' };
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await this.db.pushSubscription.deleteMany({ where: { id: row.id, tenantId, userId: actor.userId } });
      throw new ServiceUnavailableException('The test could not be delivered. Enable notifications again or try later');
    }
  }

  // The durable communication log is the outbox. Cursor state survives API restarts;
  // no open tab, polling client or request-scoped authentication token is needed.
  @Interval(10000)
  async dispatch() {
    if (this.running || !this.configuration().enabled) return;
    this.running = true;
    try {
      await this.tenants.run(async () => {
        const now = new Date();
        await this.db.pushSubscription.deleteMany({ where: { expirationAt: { lte: now } } });
        const subscriptions = await this.db.pushSubscription.findMany({ where: {
          nextAttemptAt: { lte: now }, OR: [{ leaseUntil: null }, { leaseUntil: { lte: now } }],
        }, orderBy: [{ nextAttemptAt: 'asc' }, { id: 'asc' }], take: 50 });
        for (let offset = 0; offset < subscriptions.length; offset += 10)
          await Promise.allSettled(subscriptions.slice(offset, offset + 10).map(subscription => this.deliver(subscription)));
      });
    } catch { this.logger.warn('Background push scan failed; the next scheduled scan will retry'); }
    finally { this.running = false; }
  }

  private async deliver(subscription: PushSubscription) {
    return this.tenants.run(async () => {
      const tenantId = subscription.tenantId; this.tenants.setTenantId(tenantId);
      const leaseToken = randomUUID(), now = new Date();
      // A scan can outlive a rebind, revocation or another delivery. Claim only
      // the scanned revision so stale work cannot change a newer device binding.
      const claimed = await this.db.pushSubscription.updateMany({ where: {
        id: subscription.id, tenantId, userId: subscription.userId,
        tokenVersion: subscription.tokenVersion, cursorAt: subscription.cursorAt, cursorId: subscription.cursorId,
        updatedAt: subscription.updatedAt,
        nextAttemptAt: { lte: now }, OR: [{ leaseUntil: null }, { leaseUntil: { lte: now } }],
      }, data: { leaseToken, leaseUntil: new Date(Date.now() + 60000) } });
      if (!claimed.count) return;
      const owned = { id: subscription.id, tenantId, userId: subscription.userId, tokenVersion: subscription.tokenVersion, leaseToken };
      const release = { leaseToken: null, leaseUntil: null, nextAttemptAt: new Date(Date.now() + 10000) };
      try {
        const user = await this.db.user.findFirst({ where: { id: subscription.userId, tenantId, isActive: true,
          tokenVersion: subscription.tokenVersion, tenant: { status: { in: ['ACTIVE', 'TRIAL'] } } } });
        if (!user) { await this.db.pushSubscription.deleteMany({ where: owned }); return; }
        const log = await this.db.communicationLog.findFirst({ where: {
          recipient: user.id, channel: 'IN_APP', status: { in: ['SENT', 'DELIVERED'] }, readAt: null,
          communication: { tenantId, status: { in: ['SENT', 'PARTIALLY_SENT'] } },
          OR: [{ createdAt: { gt: subscription.cursorAt } }, { createdAt: subscription.cursorAt, id: { gt: subscription.cursorId } }],
        }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: { id: true, createdAt: true } });
        if (!log) { await this.db.pushSubscription.updateMany({ where: owned, data: release }); return; }
        try {
          await this.send(subscription, log.id);
          await this.db.pushSubscription.updateMany({ where: owned, data: {
            ...release, cursorAt: log.createdAt, cursorId: log.id, retryCount: 0, lastError: null, lastPushAt: new Date(),
          } });
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) { await this.db.pushSubscription.deleteMany({ where: owned }); return; }
          const retryCount = subscription.retryCount + 1;
          // Repeated failure skips only this push alert; the durable inbox is intact.
          const exhausted = retryCount >= 5;
          await this.db.pushSubscription.updateMany({ where: owned, data: {
            ...release, retryCount: exhausted ? 0 : retryCount,
            nextAttemptAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** (retryCount - 1))),
            lastError: exhausted ? 'Push delivery failed after retries' : 'Push delivery will be retried',
            ...(exhausted ? { cursorAt: log.createdAt, cursorId: log.id } : {}),
          } });
        }
      } catch {
        await this.db.pushSubscription.updateMany({ where: owned, data: release }).catch(() => undefined);
      }
    });
  }
}
