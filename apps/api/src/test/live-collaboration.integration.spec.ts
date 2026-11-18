/// <reference lib="dom" />
import { randomUUID, createHmac } from 'node:crypto';
import { Controller, Get, Request, ValidationPipe, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../database/prisma.service';
import { TenantService } from '../database/tenant.service';
import { JwtStrategy } from '../modules/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatService } from '../modules/chat/chat.service';
import { ChatController } from '../modules/chat/chat.controller';
import { CollaborationService } from '../modules/chat/collaboration.service';
import { CollaborationController } from '../modules/chat/collaboration.controller';
import { mkdir, writeFile } from 'node:fs/promises';

@Controller()
class SessionProbe {
  @Get('auth/me') me(@Request() req: any) {
    return req.user;
  }
  @Get('preschool/navigation') navigation() {
    return { programme: 'STANDARD' };
  }
}
const url = process.env.SCHOOL_TEST_DATABASE_URL;
const integration = url ? describe : describe.skip;
integration('Authenticated live video and shared board PostgreSQL workflows', () => {
  jest.setTimeout(120000);
  const tenant = randomUUID(),
    foreignTenant = randomUUID(),
    teacher = randomUUID(),
    parent = randomUUID(),
    outsider = randomUUID(),
    foreignUser = randomUUID(),
    channel = randomUUID();
  const secret = 'isolated-live-collaboration-test-secret';
  const jwt = new JwtService({ secret }),
    config = new ConfigService({ JWT_SECRET: secret, NODE_ENV: 'test' });
  let app: INestApplication, db: PrismaService, tenants: TenantService, base: string;
  const token = (user: string) =>
    jwt.sign({ sub: user, ver: 0, type: 'access' }, { expiresIn: '1h' });
  const actor = (id = teacher) => ({
    id,
    tenantId: tenant,
    role: id === teacher ? 'TEACHER' : 'PARENT',
    firstName: id === teacher ? 'Live Teacher' : 'Live Parent',
    lastName: 'Fixture',
  });
  async function post(path: string, data: any, user = teacher) {
    const response = await fetch(base + path, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token(user),
        'Content-Type': 'application/json',
        Connection: 'close',
      },
      body: JSON.stringify({ data }),
    });
    return { status: response.status, body: (await response.json()) as any };
  }
  const join = (kind = 'BOARD', user = teacher) =>
    post('/chat/channels/' + channel + '/live/join', { kind, media: 'video' }, user);
  beforeAll(async () => {
    if (!/(_test|_qa)$/.test(new URL(url!).pathname.slice(1)))
      throw new Error('Use an isolated _test or _qa database');
    tenants = new TenantService();
    const previous = process.env.DATABASE_URL;
    process.env.DATABASE_URL = url;
    db = new PrismaService(tenants);
    await db.$connect();
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
    await db.tenant.createMany({
      data: [tenant, foreignTenant].map((id) => ({
        id,
        name: 'Live collaboration fixture',
        subdomain: 'live-' + id,
        contactEmail: 'test@example.test',
        contactPhone: '000',
      })),
    });
    await db.user.createMany({
      data: [teacher, parent, outsider, foreignUser].map((id) => ({
        id,
        tenantId: id === foreignUser ? foreignTenant : tenant,
        email: id + '@example.test',
        firstName: id === teacher ? 'Live Teacher' : 'Live Parent',
        lastName: 'Fixture',
        role: id === teacher ? 'TEACHER' : 'PARENT',
        passwordHash: 'unused',
      })),
    });
    await db.chatChannel.create({
      data: {
        id: channel,
        tenantId: tenant,
        name: 'Live test classroom',
        type: 'GROUP',
        createdById: teacher,
        members: { create: [teacher, parent].map((userId) => ({ userId, role: 'MEMBER' })) },
      },
    });
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [ChatController, CollaborationController, SessionProbe],
      providers: [
        { provide: PrismaService, useValue: db },
        { provide: TenantService, useValue: tenants },
        { provide: ConfigService, useValue: config },
        { provide: JwtService, useValue: jwt },
        JwtStrategy,
        ChatService,
        CollaborationService,
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.use((_req: any, _res: any, next: () => void) => tenants.run(next));
    app.useGlobalGuards(new JwtAuthGuard(module.get(Reflector)));
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
    );
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
  }, 30000);
  afterAll(async () => {
    await app?.close();
    if (db) {
      await db.tenant.deleteMany({ where: { id: { in: [tenant, foreignTenant] } } });
      await db.$disconnect();
    }
  });
  it('rejects nonmembers, other schools and announcements', async () => {
    expect((await join('BOARD', outsider)).status).toBe(403);
    expect((await join('CALL', foreignUser)).status).toBe(404);
    const announcement = await db.chatChannel.create({
      data: { tenantId: tenant, name: 'Official announcements', type: 'ANNOUNCEMENT' },
    });
    expect(
      (await post('/chat/channels/' + announcement.id + '/live/join', { kind: 'CALL' })).status
    ).toBe(403);
  });
  it('serializes concurrent board joins and strokes and makes retries idempotent', async () => {
    const joined = await Promise.all([join(), join('BOARD', parent)]);
    expect(joined.map((r) => r.status)).toEqual([201, 201]);
    expect(joined[0].body.roomId).toBe(joined[1].body.roomId);
    const [a, b] = joined.map((r) => r.body),
      stroke = (x: number) => ({
        id: randomUUID(),
        tool: 'pen',
        color: '#ffffff',
        size: 4,
        points: [
          { x, y: 100 },
          { x: x + 40, y: 120 },
        ],
      });
    const one = stroke(100),
      two = stroke(300);
    expect(
      (
        await Promise.all([
          post('/chat/live/' + a.roomId + '/board', {
            participantId: a.participantId,
            operation: { type: 'stroke', stroke: one },
          }),
          post(
            '/chat/live/' + b.roomId + '/board',
            { participantId: b.participantId, operation: { type: 'stroke', stroke: two } },
            parent
          ),
        ])
      ).map((r) => r.status)
    ).toEqual([201, 201]);
    await post('/chat/live/' + a.roomId + '/board', {
      participantId: a.participantId,
      operation: { type: 'stroke', stroke: one },
    });
    const poll = await post('/chat/live/' + a.roomId + '/poll', {
      participantId: a.participantId,
      after: 0,
      boardVersion: -1,
    });
    expect(poll.body.board.actions).toHaveLength(2);
    expect(poll.body.board.actions.map((s: any) => s.authorId).sort()).toEqual(
      [teacher, parent].sort()
    );
    expect(
      (
        await post(
          '/chat/live/' + a.roomId + '/poll',
          { participantId: a.participantId, after: 0, boardVersion: -1 },
          parent
        )
      ).status
    ).toBe(410);
    expect(
      (
        await post(
          '/chat/live/' + b.roomId + '/board',
          { participantId: b.participantId, operation: { type: 'clear' } },
          parent
        )
      ).status
    ).toBe(403);
    await post(
      '/chat/live/' + b.roomId + '/board',
      { participantId: b.participantId, operation: { type: 'undo' } },
      parent
    );
    const after = await post('/chat/live/' + a.roomId + '/poll', {
      participantId: a.participantId,
      after: 0,
      boardVersion: -1,
    });
    expect(after.body.board.actions.map((s: any) => s.id)).toEqual([one.id]);
    expect(
      (
        await post('/chat/live/' + a.roomId + '/board', {
          participantId: a.participantId,
          operation: {
            type: 'stroke',
            stroke: { ...one, id: randomUUID(), points: [{ x: Infinity, y: 0 }] },
          },
        })
      ).status
    ).toBe(400);
    await post('/chat/live/' + a.roomId + '/board', {
      participantId: a.participantId,
      operation: { type: 'clear' },
    });
    await post('/chat/live/' + a.roomId + '/leave', { participantId: a.participantId });
    await post('/chat/live/' + b.roomId + '/leave', { participantId: b.participantId }, parent);
  });
  it('scopes signaling to the session participant and revokes removed members', async () => {
    const a = (await join('CALL')).body,
      b = (await join('CALL', parent)).body;
    const signal = { description: { type: 'offer', sdp: 'v=0\r\n' } };
    expect(
      (
        await post('/chat/live/' + a.roomId + '/signal', {
          participantId: a.participantId,
          targetId: randomUUID(),
          signal,
        })
      ).status
    ).toBe(400);
    expect(
      (
        await post('/chat/live/' + a.roomId + '/signal', {
          participantId: a.participantId,
          targetId: b.participantId,
          signal,
        })
      ).status
    ).toBe(201);
    const messages = await post(
      '/chat/live/' + b.roomId + '/poll',
      { participantId: b.participantId, after: 0, boardVersion: 0 },
      parent
    );
    expect(messages.body.signals).toHaveLength(1);
    expect(
      (
        await post('/chat/live/' + a.roomId + '/poll', {
          participantId: a.participantId,
          after: 0,
          boardVersion: 0,
        })
      ).body.signals
    ).toHaveLength(0);
    await db.chatChannelMember.delete({
      where: { channelId_userId: { channelId: channel, userId: parent } },
    });
    expect(
      (
        await post(
          '/chat/live/' + b.roomId + '/poll',
          { participantId: b.participantId, after: 0, boardVersion: 0 },
          parent
        )
      ).status
    ).toBe(403);
    await db.chatChannelMember.create({
      data: { channelId: channel, userId: parent, role: 'MEMBER' },
    });
    await post('/chat/live/' + a.roomId + '/leave', { participantId: a.participantId });
    await post('/chat/live/' + b.roomId + '/leave', { participantId: b.participantId }, parent);
    expect(await db.collaborationRoom.count({ where: { channelId: channel, kind: 'CALL' } })).toBe(
      0
    );
  });
  it('enforces capacity, expiry and production TURN configuration', async () => {
    const calls = await Promise.all([1, 2, 3, 4].map(() => join('CALL')));
    expect(calls.every((r) => r.status === 201)).toBe(true);
    expect((await join('CALL')).status).toBe(409);
    const room = calls[0].body;
    await db.collaborationRoom.update({
      where: { id: room.roomId },
      data: { expiresAt: new Date(0) },
    });
    expect(
      (
        await post('/chat/live/' + room.roomId + '/poll', {
          participantId: room.participantId,
          after: 0,
          boardVersion: 0,
        })
      ).status
    ).toBe(410);
    config.set('NODE_ENV', 'production');
    expect((await join('CALL')).status).toBe(503);
    config.set('NODE_ENV', 'test');
    config.set('WEBRTC_TURN_URLS', 'turn:relay.example.test:3478');
    config.set('WEBRTC_TURN_SECRET', 'x'.repeat(40));
    const relay = (await join('CALL', parent)).body,
      ice = relay.iceServers[0];
    expect(ice.username).toContain(':' + parent);
    expect(ice.credential).toBe(
      createHmac('sha1', 'x'.repeat(40)).update(ice.username).digest('base64')
    );
    expect(JSON.stringify(relay)).not.toContain('x'.repeat(40));
    await post(
      '/chat/live/' + relay.roomId + '/leave',
      { participantId: relay.participantId },
      parent
    );
    config.set('WEBRTC_TURN_URLS', '');
    config.set('WEBRTC_TURN_SECRET', '');
  });
  const browserCheck = process.env.LIVE_UI_BASE_URL ? it : it.skip;
  browserCheck(
    'exchanges native WebRTC media and synchronizes drawings between two signed-in browsers',
    async () => {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({
        headless: true,
        args: [
          '--use-fake-device-for-media-stream',
          '--use-fake-ui-for-media-stream',
          '--autoplay-policy=no-user-gesture-required',
          '--disable-features=WebRtcHideLocalIpsWithMdns',
        ],
      });
      let ending = false;
      const checks: string[] = [],
        errors: string[] = [];
      await mkdir('../../qa/live-collaboration', { recursive: true });
      async function pageFor(user: string) {
        const context = await browser.newContext({
          permissions: ['camera', 'microphone'],
          viewport: { width: 1440, height: 1000 },
          serviceWorkers: 'block',
        });
        await context.addInitScript((token) => {
          localStorage.setItem('accessToken', token);
          (window as any).auditPeers = [];
          (window as any).auditMedia = [];
          const Native = window.RTCPeerConnection;
          window.RTCPeerConnection = class extends Native {
            constructor(config?: RTCConfiguration) {
              super(config);
              (window as any).auditPeers.push(this);
            }
          };
          const get = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
          navigator.mediaDevices.getUserMedia = async (constraints) => {
            const stream = await get(constraints);
            (window as any).auditMedia.push(stream);
            return stream;
          };
        }, token(user));
        await context.addInitScript(() => {
          (window as any).auditScreens = [];
          navigator.mediaDevices.getDisplayMedia = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d')!;
            const paint = () => {
              ctx.fillStyle = '#e20b7a';
              ctx.fillRect(0, 0, 320, 240);
            };
            paint();
            const timer = setInterval(paint, 80),
              stream = canvas.captureStream(12);
            const track = stream.getVideoTracks()[0],
              stop = track.stop.bind(track);
            track.stop = () => {
              clearInterval(timer);
              stop();
            };
            (window as any).auditScreens.push(stream);
            return stream;
          };
        });
        await context.route('**/api/v1/**', async (route) => {
          const path = new URL(route.request().url()).pathname.replace('/api/v1', '');
          try {
            const response = await route.fetch({ url: base + path });
            await route.fulfill({ response });
          } catch (error) {
            if (!ending) throw error;
          }
        });
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(
          process.env.LIVE_UI_BASE_URL + (user === teacher ? '/teacher/chat' : '/dashboard/chat'),
          { timeout: 120000 }
        );
        await page.getByText('Live test classroom', { exact: true }).click();
        return { page, context };
      }
      try {
        const a = await pageFor(teacher),
          b = await pageFor(parent);
        await Promise.all([
          a.page.getByTitle('Shared classroom board').click(),
          b.page.getByTitle('Shared classroom board').click(),
        ]);
        const canvasA = a.page.getByLabel('Shared drawing board', { exact: true }),
          canvasB = b.page.getByLabel('Shared drawing board', { exact: true });
        await canvasA.waitFor();
        await canvasB.waitFor();
        async function draw(page: any, canvas: any, x: number, y: number) {
          const rect = await canvas.boundingBox(),
            scale = Math.min(rect.width / 1200, rect.height / 700);
          await page.mouse.click(
            rect.x + (rect.width - 1200 * scale) / 2 + x * scale,
            rect.y + (rect.height - 700 * scale) / 2 + y * scale
          );
        }
        await draw(a.page, canvasA, 420, 250);
        await b.page.waitForFunction(() => {
          const c = document.querySelector('canvas')!;
          const p = c.getContext('2d')!.getImageData(420, 250, 1, 1).data;
          return p[0] === 255 && p[1] === 255;
        });
        await draw(b.page, canvasB, 700, 450);
        await a.page.waitForFunction(
          () =>
            document.querySelector('canvas')!.getContext('2d')!.getImageData(700, 450, 1, 1)
              .data[0] === 255
        );
        await b.page.getByTitle('Undo', { exact: true }).click();
        await a.page.waitForFunction(
          () =>
            document.querySelector('canvas')!.getContext('2d')!.getImageData(700, 450, 1, 1)
              .data[0] !== 255
        );
        expect(
          await canvasA.evaluate(
            (c) => (c as HTMLCanvasElement).getContext('2d')!.getImageData(420, 250, 1, 1).data[0]
          )
        ).toBe(255);
        expect(await b.page.getByTitle('Clear Board', { exact: true }).isDisabled()).toBe(true);
        await a.page.getByTitle('Switch Theme', { exact: true }).click();
        await b.page.waitForFunction(
          () =>
            document.querySelector('canvas')!.getContext('2d')!.getImageData(10, 10, 1, 1)
              .data[0] === 255
        );
        await draw(b.page, canvasB, 800, 500);
        await a.page.waitForFunction(
          () =>
            document.querySelector('canvas')!.getContext('2d')!.getImageData(800, 500, 1, 1)
              .data[0] === 30
        );
        await a.page.getByTitle('Switch Theme', { exact: true }).click();
        await b.page.waitForFunction(
          () =>
            document.querySelector('canvas')!.getContext('2d')!.getImageData(10, 10, 1, 1)
              .data[0] === 20
        );
        checks.push(
          'Real database board strokes synchronize in both directions; parent undo preserves teacher strokes and parent cannot clear everyone’s work'
        );
        checks.push('Remote theme changes keep the next participant stroke visible');
        await a.page.getByTitle('Close Board').click();
        await b.page.getByTitle('Close Board').click();
        await Promise.all([
          a.page.getByTitle('Video call', { exact: true }).click(),
          b.page.getByTitle('Video call', { exact: true }).click(),
        ]);
        await Promise.all([
          a.page.getByRole('button', { name: 'Join call', exact: true }).click(),
          b.page.getByRole('button', { name: 'Join call', exact: true }).click(),
        ]);
        for (const page of [a.page, b.page])
          await page.waitForFunction(
            async () => {
              for (const pc of (window as any).auditPeers) {
                if (pc.connectionState !== 'connected') continue;
                const stats = await pc.getStats();
                let video = false,
                  audio = false;
                stats.forEach((s: any) => {
                  if (s.type === 'inbound-rtp' && s.kind === 'video' && s.framesDecoded > 0)
                    video = true;
                  if (s.type === 'inbound-rtp' && s.kind === 'audio' && s.packetsReceived > 0)
                    audio = true;
                });
                if (video && audio) return true;
              }
              return false;
            },
            {},
            { timeout: 45000 }
          );
        checks.push(
          'Two isolated signed-in browser contexts exchange decoded video frames and audio RTP through real RTCPeerConnection instances'
        );
        await a.page.getByRole('button', { name: 'Share screen with call', exact: true }).click();
        await b.page.waitForFunction(
          () => {
            const video = document.querySelector<HTMLVideoElement>(
              'video[aria-label$="remote video"]'
            );
            if (!video?.videoWidth) return false;
            const canvas = document.createElement('canvas');
            canvas.width = 10;
            canvas.height = 10;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(video, 0, 0, 10, 10);
            const p = ctx.getImageData(5, 5, 1, 1).data;
            return p[0] > 190 && p[1] < 45 && p[2] > 85 && p[2] < 170;
          },
          {},
          { timeout: 20000 }
        );
        await a.page.getByRole('button', { name: 'Stop sharing screen', exact: true }).click();
        expect(
          await a.page.evaluate(() =>
            (window as any).auditScreens.every((s: MediaStream) =>
              s.getTracks().every((t) => t.readyState === 'ended')
            )
          )
        ).toBe(true);
        checks.push(
          'A synthetic screen capture travels through the real peer connection and its tracks stop when sharing ends'
        );
        await a.page.getByRole('button', { name: 'Mute microphone', exact: true }).click();
        expect(
          await a.page.evaluate(() => (window as any).auditMedia[0].getAudioTracks()[0].enabled)
        ).toBe(false);
        await a.page.getByRole('button', { name: 'Turn camera off', exact: true }).click();
        expect(
          await a.page.evaluate(() => (window as any).auditMedia[0].getVideoTracks()[0].enabled)
        ).toBe(false);
        await a.page.getByRole('button', { name: 'Open shared board', exact: true }).click();
        await a.page.getByLabel('Shared drawing board', { exact: true }).waitFor();
        await a.page.screenshot({
          path: '../../qa/live-collaboration/call-and-board.png',
          fullPage: true,
        });
        await b.page.setViewportSize({ width: 390, height: 844 });
        await b.page.getByRole('button', { name: 'Open shared board', exact: true }).click();
        await b.page.getByLabel('Shared drawing board', { exact: true }).waitFor();
        expect(
          await b.page
            .locator('dialog[aria-labelledby="chat-call-title"]')
            .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth + 1)
        ).toBe(true);
        await b.page.getByLabel('Shared drawing board', { exact: true }).scrollIntoViewIfNeeded();
        await b.page.screenshot({
          path: '../../qa/live-collaboration/mobile-call-and-board.png',
          fullPage: true,
        });
        checks.push(
          'Mic/camera controls affect actual tracks and shared board opens inside an active video call'
        );
        await a.page.getByRole('button', { name: 'Leave call', exact: true }).click();
        expect(
          await a.page.evaluate(() =>
            (window as any).auditMedia.every((s: MediaStream) =>
              s.getTracks().every((t) => t.readyState === 'ended')
            )
          )
        ).toBe(true);
        await b.page.getByRole('status').filter({ hasText: '1 participant joined' }).waitFor();
        await b.page.getByRole('button', { name: 'Leave call', exact: true }).click();
        for (
          let n = 0;
          n < 50 &&
          (await db.collaborationRoom.count({
            where: { tenantId: tenant, channelId: channel, kind: 'CALL' },
          }));
          n++
        )
          await new Promise((resolve) => setTimeout(resolve, 100));
        expect(
          await db.collaborationRoom.count({
            where: { tenantId: tenant, channelId: channel, kind: 'CALL' },
          })
        ).toBe(0);
        checks.push(
          'Leaving stops camera/microphone tracks, removes the remote participant and deletes the empty call session'
        );
        expect(errors).toEqual([]);
        await writeFile(
          '../../qa/live-collaboration/results.json',
          JSON.stringify({ checks, errors }, null, 2)
        );
        ending = true;
        await a.context.unrouteAll({ behavior: 'wait' });
        await b.context.unrouteAll({ behavior: 'wait' });
        await a.context.close();
        await b.context.close();
      } finally {
        ending = true;
        await browser.close();
      }
    }
  );
});
