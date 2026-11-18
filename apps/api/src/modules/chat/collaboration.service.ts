import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'node:crypto';
import { isUUID } from 'class-validator';
import { PrismaService } from '../../database/prisma.service';
import { ChatService } from './chat.service';

type Actor = { id: string; tenantId: string; firstName?: string; lastName?: string; role: string };
export interface Member {
  id: string;
  userId: string;
  name: string;
  role: string;
  seen: number;
  media: string;
}
export interface Stroke {
  id: string;
  tool: string;
  color: string;
  size: number;
  points: { x: number; y: number }[];
  text?: string;
  author: string;
  authorRole: string;
  authorId: string;
}
export interface State {
  members: Member[];
  signals: { id: number; from: string; to: string; signal: any; at: number }[];
  actions: Stroke[];
  theme: 'chalkboard' | 'whiteboard';
}
const managers = [
  'SUPER_ADMIN',
  'SCHOOL_OWNER',
  'PRINCIPAL',
  'DEPUTY_PRINCIPAL',
  'SCHOOL_ADMIN',
  'TEACHER',
  'CLASS_TEACHER',
];
const lease = 45000,
  lifetime = 2 * 60 * 60 * 1000;
@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);
  private cleanupTimer?: ReturnType<typeof setInterval>;
  constructor(
    private db: PrismaService,
    private chat: ChatService,
    private config: ConfigService
  ) {}
  onModuleInit() {
    this.cleanupTimer = setInterval(
      () => {
        void this.cleanup().catch(() => this.logger.warn('Expired live-session cleanup failed'));
      },
      15 * 60 * 1000
    );
    this.cleanupTimer.unref();
  }
  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
  }
  private clean(state: State) {
    const now = Date.now();
    state.members = state.members.filter((m) => now - m.seen < lease);
    state.signals = state.signals.filter((s) => now - s.at < 120000).slice(-256);
    return state;
  }
  private async access(user: Actor, channelId: string) {
    const channel = await this.chat.authorizeChannel(channelId, user.tenantId, user.id);
    if (channel.type === 'ANNOUNCEMENT')
      throw new ForbiddenException(
        'Use a private group, direct chat or class conversation for live sessions'
      );
    return channel;
  }
  private ice(user: Actor) {
    const urls = String(this.config.get('WEBRTC_TURN_URLS') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const secret = this.config.get<string>('WEBRTC_TURN_SECRET');
    if (this.config.get('NODE_ENV') === 'production' && (!urls.length || !secret))
      throw new ServiceUnavailableException(
        'School calling relay is not configured. Ask the administrator to configure TURN.'
      );
    const servers: any[] = [];
    const stun = String(this.config.get('WEBRTC_STUN_URLS') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (stun.length) servers.push({ urls: stun });
    if (urls.length && secret) {
      const username = Math.floor(Date.now() / 1000 + 7200) + ':' + user.id;
      servers.push({
        urls,
        username,
        credential: createHmac('sha1', secret).update(username).digest('base64'),
      });
    }
    return { iceServers: servers, relayConfigured: !!urls.length && !!secret };
  }
  async join(user: Actor, channelId: string, input: any) {
    if (
      !['CALL', 'BOARD'].includes(input.kind) ||
      !['audio', 'video', undefined].includes(input.media)
    )
      throw new BadRequestException('Choose a call or board session');
    await this.access(user, channelId);
    const rtc = input.kind === 'CALL' ? this.ice(user) : undefined;
    return this.db.$transaction(async (tx) => {
      // One active room per channel/kind, including simultaneous first joins across API instances.
      await tx.chatChannel.update({
        where: { id: channelId, tenantId: user.tenantId },
        data: { updatedAt: new Date() },
      });
      await tx.collaborationRoom.deleteMany({
        where: { tenantId: user.tenantId, expiresAt: { lte: new Date() } },
      });
      let room = await tx.collaborationRoom.findFirst({
        where: {
          channelId,
          tenantId: user.tenantId,
          kind: input.kind,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (room)
        room = await tx.collaborationRoom.update({
          where: { id: room.id, tenantId: user.tenantId },
          data: { updatedAt: new Date() },
        });
      const state = this.clean(
        room
          ? (room.state as unknown as State)
          : { members: [], signals: [], actions: [], theme: 'chalkboard' }
      );
      if (state.members.length >= (input.kind === 'CALL' ? 4 : 20))
        throw new ConflictException('This session is full');
      const member: Member = {
        id: randomUUID(),
        userId: user.id,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'School member',
        role: user.role,
        seen: Date.now(),
        media: input.media || 'video',
      };
      state.members.push(member);
      const data = { state: state as any };
      room = room
        ? await tx.collaborationRoom.update({
            where: { id: room.id, tenantId: user.tenantId },
            data,
          })
        : await tx.collaborationRoom.create({
            data: {
              ...data,
              tenantId: user.tenantId,
              channelId,
              kind: input.kind,
              createdBy: user.id,
              expiresAt: new Date(Date.now() + lifetime),
            },
          });
      return {
        roomId: room.id,
        participantId: member.id,
        kind: room.kind,
        members: state.members,
        version: room.version,
        board: { actions: state.actions, theme: state.theme },
        expiresAt: room.expiresAt,
        ...rtc,
      };
    });
  }
  private async room(
    user: Actor,
    id: string,
    participantId: string,
    work: (tx: any, room: any, state: State, member: Member, dirty: boolean) => Promise<any>
  ) {
    if (!isUUID(id) || !isUUID(participantId))
      throw new BadRequestException('Invalid live session');
    const existing = await this.db.collaborationRoom.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) throw new NotFoundException('Live session not found');
    await this.access(user, existing.channelId);
    return this.db.$transaction(async (tx) => {
      const room = await tx.collaborationRoom.update({
        where: { id, tenantId: user.tenantId },
        data: { updatedAt: new Date() },
      });
      if (room.expiresAt.getTime() <= Date.now())
        throw new GoneException('Session expired. Rejoin to start a new session.');
      const oldState = room.state as unknown as State,
        memberCount = oldState.members.length,
        signalCount = oldState.signals.length;
      const state = this.clean(oldState),
        member = state.members.find((m) => m.id === participantId && m.userId === user.id);
      if (!member)
        throw new GoneException(
          'You have left this session or your connection expired. Rejoin to continue.'
        );
      const dirty =
        Date.now() - member.seen > 10000 ||
        state.members.length !== memberCount ||
        state.signals.length !== signalCount;
      member.seen = Date.now();
      return work(tx, room, state, member, dirty);
    });
  }
  async poll(user: Actor, id: string, input: any) {
    if (
      !Number.isSafeInteger(input.after) ||
      input.after < 0 ||
      !Number.isSafeInteger(input.boardVersion) ||
      input.boardVersion < -1
    )
      throw new BadRequestException('Invalid session cursor');
    return this.room(user, id, input.participantId, async (tx, room, state, member, dirty) => {
      const signals = state.signals.filter((s) => s.to === member.id && s.id > input.after),
        count = state.signals.length;
      state.signals = state.signals.filter((s) => s.to !== member.id || s.id > input.after);
      if (dirty || count !== state.signals.length)
        await tx.collaborationRoom.update({ where: { id }, data: { state: state as any } });
      return {
        members: state.members,
        version: room.version,
        board:
          input.boardVersion !== room.version
            ? { actions: state.actions, theme: state.theme }
            : null,
        signals,
        cursor: room.signalSequence,
      };
    });
  }
  async signal(user: Actor, id: string, input: any) {
    const s = input.signal;
    if (!s || typeof s !== 'object' || Array.isArray(s) || JSON.stringify(s).length > 30000)
      throw new BadRequestException('Invalid calling signal');
    if (s.description) {
      if (
        !['offer', 'answer'].includes(s.description.type) ||
        typeof s.description.sdp !== 'string' ||
        s.description.sdp.length > 25000
      )
        throw new BadRequestException('Invalid media description');
    } else if (s.candidate) {
      if (typeof s.candidate.candidate !== 'string' || s.candidate.candidate.length > 2000)
        throw new BadRequestException('Invalid media candidate');
    } else throw new BadRequestException('Missing media description or candidate');
    return this.room(user, id, input.participantId, async (tx, room, state, member) => {
      if (
        room.kind !== 'CALL' ||
        !state.members.some((m) => m.id === input.targetId && m.id !== member.id)
      )
        throw new BadRequestException('Participant is not in this call');
      state.signals.push({
        id: room.signalSequence + 1,
        from: member.id,
        to: input.targetId,
        signal: s,
        at: Date.now(),
      });
      state.signals = state.signals.slice(-256);
      await tx.collaborationRoom.update({
        where: { id },
        data: { state: state as any, signalSequence: { increment: 1 } },
      });
      return { saved: true };
    });
  }
  async board(user: Actor, id: string, input: any) {
    return this.room(user, id, input.participantId, async (tx, room, state, member) => {
      if (room.kind !== 'BOARD') throw new BadRequestException('This is not a board session');
      const op = input.operation;
      if (!op || typeof op !== 'object') throw new BadRequestException('Choose a board action');
      if (op.type === 'stroke') {
        const s = op.stroke;
        if (
          !s ||
          !isUUID(s.id) ||
          !['pen', 'highlighter', 'eraser', 'rect', 'circle', 'arrow', 'text'].includes(s.tool) ||
          !/^#[a-f\d]{6}$/i.test(s.color) ||
          ![2, 4, 8].includes(s.size) ||
          !Array.isArray(s.points) ||
          s.points.length < 1 ||
          s.points.length > 256 ||
          s.points.some(
            (p: any) =>
              !p ||
              !Number.isFinite(p.x) ||
              !Number.isFinite(p.y) ||
              p.x < 0 ||
              p.x > 1200 ||
              p.y < 0 ||
              p.y > 700
          ) ||
          (s.tool === 'text' &&
            (typeof s.text !== 'string' || !s.text.trim() || s.text.length > 500))
        )
          throw new BadRequestException('Invalid board stroke');
        const duplicate = state.actions.find((a) => a.id === s.id);
        if (duplicate) {
          if (duplicate.authorId !== user.id)
            throw new ConflictException('Stroke belongs to another member');
          return { version: room.version, board: { actions: state.actions, theme: state.theme } };
        }
        if (state.actions.length >= 200)
          throw new ConflictException(
            'Board is full. Save a snapshot and ask a teacher to clear it.'
          );
        state.actions.push({
          id: s.id,
          tool: s.tool,
          color: s.color,
          size: s.size,
          points: s.points.map((p: any) => ({
            x: Math.round(p.x * 10) / 10,
            y: Math.round(p.y * 10) / 10,
          })),
          ...(s.tool === 'text' ? { text: s.text.trim() } : {}),
          author: member.name,
          authorRole: member.role,
          authorId: user.id,
        });
      } else if (op.type === 'undo') {
        const index = state.actions.map((a) => a.authorId).lastIndexOf(user.id);
        if (index >= 0) state.actions.splice(index, 1);
      } else if (op.type === 'clear' || op.type === 'theme') {
        if (!managers.includes(user.role))
          throw new ForbiddenException(
            'Only teaching staff can clear the shared board or change its theme'
          );
        if (op.type === 'clear') state.actions = [];
        else {
          if (!['chalkboard', 'whiteboard'].includes(op.theme))
            throw new BadRequestException('Invalid board theme');
          state.theme = op.theme;
        }
      } else throw new BadRequestException('Unknown board action');
      const saved = await tx.collaborationRoom.update({
        where: { id },
        data: { state: state as any, version: { increment: 1 } },
      });
      return { version: saved.version, board: { actions: state.actions, theme: state.theme } };
    });
  }
  async leave(user: Actor, id: string, input: any) {
    try {
      return await this.room(user, id, input.participantId, async (tx, room, state, member) => {
        state.members = state.members.filter((m) => m.id !== member.id);
        state.signals = state.signals.filter((s) => s.to !== member.id && s.from !== member.id);
        if (room.kind === 'CALL' && !state.members.length)
          await tx.collaborationRoom.delete({ where: { id } });
        else await tx.collaborationRoom.update({ where: { id }, data: { state: state as any } });
        return { left: true };
      });
    } catch (error) {
      if (error instanceof GoneException || error instanceof NotFoundException)
        return { left: true };
      throw error;
    }
  }
  async cleanup() {
    await this.db.executeWithoutTenantFilter(() =>
      this.db.collaborationRoom.deleteMany({ where: { expiresAt: { lte: new Date() } } })
    );
  }
}
