import 'reflect-metadata';
import { createECDH, randomBytes } from 'node:crypto';

import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

import { TenantService } from '../../database/tenant.service';

import { pushEndpointHash, validatePushKeys } from './push-endpoint';
import { PushService } from './push.service';

jest.mock('web-push', () => ({ sendNotification: jest.fn() }));
jest.mock('@nestjs/schedule', () => ({ Interval: () => () => undefined }));
const send = webpush.sendNotification as jest.Mock;

describe('Server background push delivery', () => {
  const pair = createECDH('prime256v1');pair.generateKeys();
  const keys = {p256dh: pair.getPublicKey().toString('base64url'), auth: randomBytes(16).toString('base64url')};
  const endpoint = 'https://fcm.googleapis.com/fcm/send/browser-secret';
  let db: any, service: PushService, tenants: TenantService, subscription: any, config: ConfigService;
  const actor = {userId: 'parent', tokenVersion: 2};
  const inSchool = <T>(work: () => T) => tenants.run(() => {tenants.setTenantId('school');return work();});
  beforeEach(() => {
    jest.clearAllMocks();
    tenants = new TenantService();
    config = new ConfigService({WEB_PUSH_PUBLIC_KEY: pair.getPublicKey().toString('base64url'), WEB_PUSH_PRIVATE_KEY: pair.getPrivateKey().toString('base64url'), WEB_PUSH_SUBJECT: 'mailto:school@example.test'});
    subscription = {id: 'device', tenantId: 'school', userId: 'parent', tokenVersion: 2,
      endpoint, endpointHash: pushEndpointHash(endpoint), ...keys, cursorAt: new Date('2026-01-01'), cursorId: '', retryCount: 0,
      updatedAt: new Date('2026-01-01')};
    db = {
      user: {findFirst: jest.fn().mockResolvedValue({id: 'parent', tenantId: 'school', isActive: true, tokenVersion: 2})},
      pushSubscription: {
        findMany: jest.fn(async () => [{...subscription}]), findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue({...subscription, user: {isActive: true, tokenVersion: 2}}),
        upsert: jest.fn().mockResolvedValue(subscription), updateMany: jest.fn().mockResolvedValue({count: 1}), deleteMany: jest.fn(),
      },
      communicationLog: {findFirst: jest.fn().mockResolvedValue({id: 'log-1', createdAt: new Date('2026-11-18')})},
    };
    db.$transaction = jest.fn(async (work: any) => work(db));
    service = new PushService(db, tenants, config); send.mockResolvedValue({statusCode: 201});
  });

  it('exposes only the public VAPID key', () => {
    expect(service.configuration()).toEqual({enabled: true, publicKey: config.get('WEB_PUSH_PUBLIC_KEY')});
    expect(JSON.stringify(service.configuration())).not.toContain(config.get('WEB_PUSH_PRIVATE_KEY'));
  });

  it('saves browser subscriptions for the authenticated user and school', async () => {
    await inSchool(() => service.subscribe(actor, {endpoint, keys, expirationTime: null}));
    expect(db.user.findFirst).toHaveBeenCalledWith({where: {id: 'parent', tenantId: 'school', isActive: true, tokenVersion: 2}});
    expect(db.pushSubscription.upsert.mock.calls[0][0].create).toMatchObject({tenantId: 'school', userId: 'parent', tokenVersion: 2, endpointHash: pushEndpointHash(endpoint)});
    expect(db.pushSubscription.upsert.mock.calls[0][0].create.cursorAt).toBeInstanceOf(Date);
  });

  it('preserves delivery cursor when the same device reopens the app', async () => {
    db.pushSubscription.findUnique.mockResolvedValue(subscription);
    await inSchool(() => service.subscribe(actor, {endpoint, keys}));
    expect(db.pushSubscription.upsert.mock.calls[0][0].update).not.toHaveProperty('cursorAt');
  });

  it('does not bind a session revoked after its request was authenticated', async () => {
    db.user.findFirst.mockImplementation(async ({where}: any) => where.tokenVersion === 3
      ? {id: 'parent', tokenVersion: 3} : null);
    await expect(inSchool(() => service.subscribe(actor, {endpoint, keys}))).rejects.toThrow('Sign in again');
    expect(db.pushSubscription.upsert).not.toHaveBeenCalled();
  });

  it('rejects concurrent ownership conflicts instead of overwriting another browser binding', async () => {
    db.$transaction.mockRejectedValueOnce({code: 'P2034'});
    await expect(inSchool(() => service.subscribe(actor, {endpoint, keys}))).rejects.toThrow('Another device binding');
  });

  it('rebinds a shared browser only when both browser keys match, clearing old delivery state', async () => {
    db.pushSubscription.findUnique.mockResolvedValue({...subscription, tenantId: 'old-school', userId: 'old-user'});
    await inSchool(() => service.subscribe(actor, {endpoint, keys}));
    expect(db.pushSubscription.upsert.mock.calls[0][0].update).toMatchObject({tenantId: 'school', userId: 'parent', cursorId: '', leaseToken: null});
    db.pushSubscription.findUnique.mockResolvedValue({...subscription, auth: 'different'});
    await expect(inSchool(() => service.subscribe(actor, {endpoint, keys}))).rejects.toThrow('different browser keys');
  });

  it('resets the binding after token revocation and rejects expired browser subscriptions', async () => {
    db.pushSubscription.findUnique.mockResolvedValue({...subscription, tokenVersion: 1});
    await inSchool(() => service.subscribe(actor, {endpoint, keys}));
    expect(db.pushSubscription.upsert.mock.calls[0][0].update).toHaveProperty('cursorAt');
    await expect(inSchool(() => service.subscribe(actor, {endpoint, keys, expirationTime: 0}))).rejects.toThrow('expired');
  });

  it('keeps disable and status queries scoped to their owner', async () => {
    await inSchool(() => service.unsubscribe(actor, {endpoint}));
    expect(db.pushSubscription.deleteMany).toHaveBeenCalledWith({where: {tenantId: 'school', userId: 'parent', endpointHash: pushEndpointHash(endpoint)}});
    await inSchool(() => service.status(actor, {endpoint}));
    expect(db.pushSubscription.findFirst.mock.calls[0][0].where).toMatchObject({tenantId: 'school', userId: 'parent'});
  });

  it('sends saved inbox updates without an open tab, using a private generic payload', async () => {
    await service.dispatch();
    expect(send).toHaveBeenCalledTimes(1);
    const [target, body, options] = send.mock.calls[0];
    expect(target).toEqual({endpoint, keys});expect(JSON.parse(body)).toMatchObject({url: '/notifications', tag: 'school-log-1'});
    expect(body).not.toMatch(/parent|student|password|tokenVersion/);
    expect(options).toMatchObject({TTL: 86400, timeout: 5000, urgency: 'normal'});
    expect(db.communicationLog.findFirst.mock.calls[0][0].where).toMatchObject({recipient: 'parent', channel: 'IN_APP', readAt: null, communication: {tenantId: 'school', status: {in: ['SENT','PARTIALLY_SENT']}}});
    expect(db.pushSubscription.updateMany.mock.calls[1][0].data).toMatchObject({cursorId: 'log-1', retryCount: 0, leaseToken: null});
  });

  it('does not send when another worker owns the device lease', async () => {
    db.pushSubscription.updateMany.mockResolvedValueOnce({count: 0});
    await service.dispatch();expect(send).not.toHaveBeenCalled();
  });

  it.each([
    {userId: 'new-account'}, {tokenVersion: 3}, {cursorId: 'already-sent'},
    {cursorAt: new Date('2026-11-19')}, {updatedAt: new Date('2026-11-19')},
  ])('discards a scanned device changed before lease acquisition: %p', async change => {
    const current = {...subscription, ...change};
    // Model the database's conditional update after a concurrent rebind or delivery.
    db.pushSubscription.updateMany.mockImplementation(async ({where}: any) => ({count:
      ['userId','tokenVersion','cursorAt','cursorId','updatedAt'].every(key => !(key in where) ||
        (where[key] instanceof Date ? where[key].getTime() === current[key].getTime() : where[key] === current[key])) ? 1 : 0,
    }));
    await service.dispatch();
    expect(send).not.toHaveBeenCalled();
    expect(db.user.findFirst).not.toHaveBeenCalled();
    expect(db.pushSubscription.deleteMany).toHaveBeenCalledTimes(1); // Only the expired-device sweep.
  });

  it('does not send historical/read messages when no new unread inbox update exists', async () => {
    db.communicationLog.findFirst.mockResolvedValue(null);
    await service.dispatch();expect(send).not.toHaveBeenCalled();
    expect(db.communicationLog.findFirst.mock.calls[0][0].where.OR[0]).toEqual({createdAt: {gt: subscription.cursorAt}});
  });

  it('removes inactive accounts, inactive schools and revoked sessions before sending', async () => {
    db.user.findFirst.mockResolvedValue(null);await service.dispatch();
    expect(send).not.toHaveBeenCalled();
    expect(db.user.findFirst.mock.calls[0][0].where).toMatchObject({id: 'parent', tenantId: 'school', isActive: true, tokenVersion: 2, tenant: {status: {in: ['ACTIVE','TRIAL']}}});
    expect(db.pushSubscription.deleteMany.mock.calls[1][0].where).toMatchObject({id: 'device', userId: 'parent', tenantId: 'school'});
  });

  it.each([404, 410])('removes expired provider endpoints on HTTP %s', async statusCode => {
    send.mockRejectedValueOnce({statusCode});await service.dispatch();
    expect(db.pushSubscription.deleteMany.mock.calls[1][0].where.id).toBe('device');
  });

  it('retries provider failures without advancing the durable inbox cursor', async () => {
    send.mockRejectedValueOnce({statusCode: 503});await service.dispatch();
    const data = db.pushSubscription.updateMany.mock.calls[1][0].data;
    expect(data.retryCount).toBe(1);expect(data).not.toHaveProperty('cursorId');expect(data.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
    expect(JSON.stringify(data)).not.toContain('browser-secret');
  });

  it('caps repeated push failures without deleting the original inbox message', async () => {
    subscription.retryCount = 4;send.mockRejectedValueOnce({statusCode: 503});await service.dispatch();
    expect(db.pushSubscription.updateMany.mock.calls[1][0].data).toMatchObject({cursorId: 'log-1', retryCount: 0, lastError: 'Push delivery failed after retries'});
    expect(db.communicationLog).not.toHaveProperty('deleteMany');
  });

  it('does no background work without complete VAPID configuration', async () => {
    service = new PushService(db, tenants, new ConfigService({}));
    expect(service.configuration()).toEqual({enabled: false, publicKey: null});await service.dispatch();
    expect(db.pushSubscription.findMany).not.toHaveBeenCalled();
    await expect(inSchool(() => service.subscribe(actor, {endpoint, keys}))).rejects.toThrow('not configured');
  });

  it('allows a test only for the current user device and does not report provider acceptance as final delivery', async () => {
    expect(await inSchool(() => service.test(actor, {endpoint}))).toMatchObject({accepted: true});
    db.pushSubscription.findFirst.mockResolvedValue(null);
    await expect(inSchool(() => service.test(actor, {endpoint}))).rejects.toThrow('Enable notifications');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('does not report a revoked device binding as enabled or send a test through it', async () => {
    await inSchool(() => service.status(actor, {endpoint}));
    expect(db.pushSubscription.findFirst.mock.calls[0][0].where.tokenVersion).toBe(2);
    db.pushSubscription.findFirst.mockResolvedValue({...subscription, tokenVersion: 1,
      user: {isActive: true, tokenVersion: 2}});
    await expect(inSchool(() => service.test(actor, {endpoint}))).rejects.toThrow('Enable notifications');
    expect(send).not.toHaveBeenCalled();
  });

  it.each(['http://fcm.googleapis.com/a', 'https://127.0.0.1/admin', 'https://fcm.googleapis.com.evil.test/x', 'https://fcm.googleapis.com:8443/x', 'https://user:secret@fcm.googleapis.com/x', 'https://school.example.test/api', 'not-a-url'])('rejects arbitrary outbound endpoint %s', url => {
    expect(() => pushEndpointHash(url)).toThrow();
  });

  it('rejects invalid browser encryption keys', () => {
    expect(() => validatePushKeys({p256dh: 'AAAA', auth: keys.auth})).toThrow('keys');
    expect(() => validatePushKeys({p256dh: keys.p256dh, auth: 'a'})).toThrow('keys');
  });
});
