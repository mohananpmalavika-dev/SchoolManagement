import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { StorageService } from '../../common/services/storage.service';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import {
  CreateChannelDto,
  SendChatMessageDto,
  ChannelType,
} from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    @Optional() private storage?: StorageService,
  ) {}

  async uploadAttachment(channelId: string, tenantId: string, userId: string, file: Express.Multer.File) {
    await this.authorizeChannel(channelId, tenantId, userId);
    if (!this.storage?.isConfigured()) throw new ServiceUnavailableException('Chat file storage is not configured. You can still send text messages.');
    if (!file?.buffer || file.size > 5 * 1024 * 1024) throw new BadRequestException('Choose a PNG, JPEG or PDF up to 5 MB');
    const bytes = file.buffer;
    const type = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png'
      : bytes[0]===255 && bytes[1]===216 && bytes[2]===255 ? 'image/jpeg'
      : bytes.subarray(0,5).toString()==='%PDF-' ? 'application/pdf' : '';
    if (!type || type !== file.mimetype) throw new BadRequestException('Choose a valid PNG, JPEG or PDF');
    const extension = type==='image/png' ? 'png' : type==='image/jpeg' ? 'jpg' : 'pdf';
    const uploaded = await this.storage.uploadFile(bytes, {tenantId,category:'documents',filename:`chat-${channelId}-${randomUUID()}.${extension}`,mimeType:type});
    return {name:file.originalname.slice(0,255),type,size:bytes.length,storageKey:uploaded.key,url:''};
  }

  private async resolveAttachments(attachments: unknown, channelId: string, tenantId: string) {
    if (!Array.isArray(attachments)) return null;
    return Promise.all(attachments.map(async attachment => {
      if (!attachment.storageKey) return attachment;
      this.validateStorageKey(attachment.storageKey, channelId, tenantId);
      if (!this.storage?.isConfigured()) return {...attachment,url:''};
      const {url} = await this.storage.getPresignedUrl(attachment.storageKey, 120, {tenantId});
      return {...attachment,url};
    }));
  }

  private validateStorageKey(key: unknown, channelId: string, tenantId: string) {
    if (typeof key !== 'string' || key.split('/').length!==5 || !key.startsWith(tenantId+'/documents/') || !key.split('/')[4].startsWith('chat-'+channelId+'-') || !/^[\w./-]+$/.test(key) || key.includes('..')) throw new BadRequestException('Attachment belongs to another conversation');
  }

  /**
   * Ensure default school channels exist for this tenant
   */
  async ensureDefaultChannels(tenantId: string, userId?: string) {
    const user = userId ? await this.prisma.user.findFirst({ where: { id: userId, tenantId, isActive: true } }) : null;
    if (!user) throw new ForbiddenException('Active school account required');
    await this.prisma.$transaction(async tx => {
      await tx.tenant.update({ where: { id: tenantId }, data: { updatedAt: new Date() } });
      const defaults = [
        { name: 'Announcements', description: 'Official school-wide updates, circulars, and notices', type: ChannelType.ANNOUNCEMENT, allowed: true },
        { name: 'Staff Room', description: 'Faculty, teachers, and administrative collaboration', type: ChannelType.GROUP, allowed: !['PARENT', 'STUDENT'].includes(user.role) },
        { name: 'Parents & Guardians Forum', description: 'Open discussion and community forum for school parents', type: ChannelType.GROUP, allowed: user.role === 'PARENT' || ['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN'].includes(user.role) },
        { name: 'Transport & Safety Desk', description: 'Live route alerts, bus updates, and arrival notices', type: ChannelType.GROUP, allowed: true },
      ];
      for (const ch of defaults) {
        let channel = await tx.chatChannel.findFirst({ where: { tenantId, description: ch.description, isArchived: false } });
        if (!channel) channel = await tx.chatChannel.create({ data: { tenantId, name: ch.name, description: ch.description, type: ch.type } });
        if (ch.allowed) await tx.chatChannelMember.upsert({ where: { channelId_userId: { channelId: channel.id, userId: user.id } }, update: {}, create: { channelId: channel.id, userId: user.id, role: 'MEMBER' } });
        else await tx.chatChannelMember.deleteMany({ where: { channelId: channel.id, userId: user.id } });
      }
    });
  }

  private async accessibleClasses(tenantId: string, user: { id: string; role: string }) {
    if (['PARENT', 'STUDENT'].includes(user.role)) {
      const children = await this.prisma.student.findMany({ where: { tenantId, deletedAt: null, ...(user.role === 'STUDENT' ? { userId: user.id } : { guardianLinks: { some: { guardian: { tenantId, userId: user.id } } } }) }, select: { currentClassId: true } });
      return children.map(child => child.currentClassId).filter((id): id is string => !!id);
    }
    if (['TEACHER', 'CLASS_TEACHER', 'EXAM_OFFICER'].includes(user.role)) {
      const staff = await this.prisma.staff.findFirst({ where: { tenantId, userId: user.id, status: 'ACTIVE' } });
      if (!staff) return [];
      const [entries, assignments] = await Promise.all([
        this.prisma.timetableEntry.findMany({ where: { tenantId, teacherId: staff.id }, select: { classId: true } }),
        this.prisma.preschoolStaffAssignment.findMany({ where: { tenantId, staffId: staff.id }, select: { classId: true } }),
      ]);
      return [...new Set([...entries, ...assignments].map(entry => entry.classId))];
    }
    if (['SUPER_ADMIN', 'SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN'].includes(user.role)) return (await this.prisma.class.findMany({ where: { tenantId }, select: { id: true } })).map(cls => cls.id);
    return [];
  }

  private async authorizeChannel(channelId: string, tenantId: string, userId: string) {
    const channel = await this.prisma.chatChannel.findFirst({ where: { id: channelId, tenantId, isArchived: false } });
    if (!channel) throw new NotFoundException('Channel not found');
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId, isActive: true } });
    if (!user) throw new ForbiddenException('Active school account required');
    if ((channel.name.includes('Staff Room') || channel.description === 'Faculty, teachers, and administrative collaboration') && ['PARENT', 'STUDENT'].includes(user.role)) throw new ForbiddenException('Staff channel access denied');
    if (channel.type === ChannelType.CLASS) {
      if (!channel.classId || !(await this.accessibleClasses(tenantId, user)).includes(channel.classId)) throw new ForbiddenException('Class conversation access denied');
    } else if (channel.type !== ChannelType.ANNOUNCEMENT && !await this.prisma.chatChannelMember.findUnique({ where: { channelId_userId: { channelId, userId } } })) throw new ForbiddenException('Access denied to this conversation');
    return channel;
  }

  /**
   * Get all accessible channels for the user
   */
  async getChannels(userId: string, tenantId: string) {
    await this.ensureDefaultChannels(tenantId, userId);
    const user = await this.prisma.user.findFirstOrThrow({ where: { id: userId, tenantId, isActive: true } });
    const classIds = await this.accessibleClasses(tenantId, user);

    // Fetch channels: public/group/announcement or direct channels where user is a member
    const channels = await this.prisma.chatChannel.findMany({
      where: {
        tenantId,
        isArchived: false,
        OR: [
          { type: ChannelType.ANNOUNCEMENT },
          { type: ChannelType.CLASS, classId: { in: classIds } },
          { type: { not: ChannelType.CLASS }, members: { some: { userId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return channels.map((channel) => {
      const membership = channel.members.find((m) => m.userId === userId);
      const lastMessage = channel.messages[0] || null;

      // Format direct chat title
      let displayName = channel.name;
      let displayAvatar = channel.avatar;

      if (channel.type === ChannelType.DIRECT) {
        const otherMember = channel.members.find((m) => m.userId !== userId);
        if (otherMember) {
          displayName = `${otherMember.user.firstName} ${otherMember.user.lastName}`;
          displayAvatar = otherMember.user.avatar;
        }
      }

      return {
        id: channel.id,
        name: displayName,
        rawName: channel.name,
        description: channel.description,
        type: channel.type,
        avatar: displayAvatar,
        classId: channel.classId,
        memberCount: channel.members.length,
        isMember: Boolean(membership),
        myRole: membership?.role || 'MEMBER',
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              senderName: `${lastMessage.sender.firstName} ${lastMessage.sender.lastName}`,
            }
          : null,
        updatedAt: channel.updatedAt,
      };
    });
  }

  /**
   * Create a new chat channel
   */
  async createChannel(userId: string, tenantId: string, dto: CreateChannelDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId, isActive: true } });
    if (!user || ['PARENT', 'STUDENT'].includes(user.role)) throw new ForbiddenException('Staff access required to create group channels');
    if (dto.type === ChannelType.DIRECT) throw new BadRequestException('Use the direct conversation endpoint');
    if (dto.type === ChannelType.ANNOUNCEMENT && !['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role)) throw new ForbiddenException('School management creates announcements');
    if (dto.classId && !await this.prisma.class.findFirst({ where: { id: dto.classId, tenantId } })) throw new BadRequestException('Class not found');
    if (dto.type === ChannelType.CLASS && !dto.classId) throw new BadRequestException('Class channel requires a class');
    if (dto.type === ChannelType.CLASS && !(await this.accessibleClasses(tenantId, user)).includes(dto.classId!)) throw new ForbiddenException('Class is not assigned to you');
    const memberIds = [...new Set([userId, ...(dto.memberUserIds || [])])];
    if (memberIds.length > 500 || await this.prisma.user.count({ where: { id: { in: memberIds }, tenantId, isActive: true } }) !== memberIds.length) throw new BadRequestException('Select active members from this school');
    return this.prisma.chatChannel.create({ data: { tenantId, name: dto.name, description: dto.description, type: dto.type || ChannelType.GROUP, classId: dto.classId, createdById: userId, members: { create: memberIds.map(id => ({ userId: id, role: id === userId ? 'ADMIN' : 'MEMBER' })) } } });
  }

  /**
   * Get messages for a channel
   */
  async getMessages(
    channelId: string,
    tenantId: string,
    userId: string,
    limit = 50,
  ) {
    await this.authorizeChannel(channelId, tenantId, userId);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new BadRequestException('Message limit must be between 1 and 100');
    await this.prisma.chatChannelMember.upsert({ where: { channelId_userId: { channelId, userId } }, update: { lastReadAt: new Date() }, create: { channelId, userId, lastReadAt: new Date(), role: 'MEMBER' } });

    const messages = await this.prisma.chatMessage.findMany({
      where: { channelId, isDeleted: false },
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return Promise.all(messages.reverse().map(async (m) => ({
      id: m.id,
      channelId: m.channelId,
      content: m.content,
      attachments: await this.resolveAttachments(m.attachments, channelId, tenantId),
      reactions: m.reactions,
      isEdited: m.isEdited,
      createdAt: m.createdAt,
      sender: {
        id: m.sender.id,
        name: `${m.sender.firstName} ${m.sender.lastName}`,
        avatar: m.sender.avatar,
        role: m.sender.role,
        isMe: m.sender.id === userId,
      },
      replyTo: m.replyTo
        ? {
            id: m.replyTo.id,
            content: m.replyTo.content,
            senderName: `${m.replyTo.sender.firstName} ${m.replyTo.sender.lastName}`,
          }
        : null,
    })));
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(
    channelId: string,
    tenantId: string,
    userId: string,
    dto: SendChatMessageDto,
  ) {
    const channel = await this.authorizeChannel(channelId, tenantId, userId);
    if (dto.replyToId && !await this.prisma.chatMessage.findFirst({ where: { id: dto.replyToId, channelId, isDeleted: false } })) throw new BadRequestException('Reply must reference a message in this conversation');
    if (dto.attachments && (!Array.isArray(dto.attachments) || dto.attachments.length > 5)) throw new BadRequestException('Attach up to five files');
    for (const attachment of dto.attachments || []) {
      if (!attachment || typeof attachment.name!=='string' || !attachment.name.trim() || attachment.name.length>255 || typeof attachment.type!=='string') throw new BadRequestException('Invalid attachment');
      if (attachment.storageKey) this.validateStorageKey(attachment.storageKey,channelId,tenantId);
      else { try { if(new URL(attachment.url).protocol!=='https:')throw new Error(); } catch { throw new BadRequestException('Attachments require HTTPS links'); } }
    }

    // Verify announcements permissions
    if (channel.type === ChannelType.ANNOUNCEMENT) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      const allowedRoles = [
        'SUPER_ADMIN',
        'SCHOOL_OWNER',
        'PRINCIPAL',
        'DEPUTY_PRINCIPAL',
        'SCHOOL_ADMIN',
      ];
      if (!user || !allowedRoles.includes(user.role)) {
        throw new ForbiddenException(
          'Only administrative staff can post to official announcements',
        );
      }
    }

    // Create the message
    const message = await this.prisma.chatMessage.create({
      data: {
        channelId,
        senderId: userId,
        content: dto.content,
        attachments: dto.attachments ? JSON.parse(JSON.stringify(dto.attachments.map(a=>a.storageKey?{...a,url:''}:a))) : null,
        replyToId: dto.replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Bump channel updatedAt and updater read pointer
    await this.prisma.chatChannel.update({
      where: { id: channelId },
      data: { updatedAt: new Date() },
    });

    await this.prisma.chatChannelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      update: { lastReadAt: new Date() },
      create: { channelId, userId, lastReadAt: new Date(), role: 'MEMBER' },
    });

    return {
      id: message.id,
      channelId: message.channelId,
      content: message.content,
      attachments: await this.resolveAttachments(message.attachments, channelId, tenantId),
      reactions: message.reactions,
      isEdited: message.isEdited,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        name: `${message.sender.firstName} ${message.sender.lastName}`,
        avatar: message.sender.avatar,
        role: message.sender.role,
        isMe: true,
      },
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            content: message.replyTo.content,
            senderName: `${message.replyTo.sender.firstName} ${message.replyTo.sender.lastName}`,
          }
        : null,
    };
  }

  /**
   * Add or toggle emoji reaction on a message
   */
  async addReaction(
    channelId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ) {
    const tenantId = this.tenantService.requireTenantContext();
    await this.authorizeChannel(channelId, tenantId, userId);
    if (typeof emoji !== 'string' || !emoji.trim() || emoji.length > 32) throw new BadRequestException('Invalid reaction');
    const updated = await this.prisma.$transaction(async tx => {
      const locked = await tx.chatMessage.updateMany({ where: { id: messageId, channelId, isDeleted: false }, data: { updatedAt: new Date() } });
      if (!locked.count) throw new NotFoundException('Message not found');
      const message = await tx.chatMessage.findFirstOrThrow({ where: { id: messageId, channelId } });
      const reactions: Record<string, string[]> = Object.assign(Object.create(null), message.reactions || {});
      const previous = reactions[emoji] || [];
      const next = previous.includes(userId) ? previous.filter(id => id !== userId) : [...previous, userId];
      if (next.length) reactions[emoji] = next; else delete reactions[emoji];
      return tx.chatMessage.update({ where: { id: messageId }, data: { reactions } });
    });

    return {
      messageId: updated.id,
      reactions: updated.reactions,
    };
  }

  /**
   * Find or create a direct chat conversation between two users
   */
  async getOrCreateDirectChannel(
    tenantId: string,
    userId: string,
    targetUserId: string,
    initialMessage?: string,
  ) {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot start a direct chat with yourself');
    }

    // Verify target user exists in same tenant
    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, tenantId, isActive: true },
      select: { id: true, firstName: true, lastName: true, role: true },
    });

    if (!target) {
      throw new NotFoundException('Contact not found');
    }

    const sender = await this.prisma.user.findFirst({ where: { id: userId, tenantId, isActive: true } });
    if (!sender || ['PARENT', 'STUDENT'].includes(sender.role) && ['PARENT', 'STUDENT'].includes(target.role)) throw new ForbiddenException('Families can contact school staff');

    // Look for existing direct channel between these two users
    const channelId = await this.prisma.$transaction(async tx => {
      await tx.tenant.update({ where: { id: tenantId }, data: { updatedAt: new Date() } });
    const existing = await tx.chatChannel.findFirst({
      where: {
        tenantId,
        type: ChannelType.DIRECT,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
    });

    let channelId = existing?.id;

    if (!channelId) {
      const created = await tx.chatChannel.create({
        data: {
          tenantId,
          name: `Direct: ${target.firstName} & You`,
          type: ChannelType.DIRECT,
          createdById: userId,
        },
      });
      channelId = created.id;

      // Add both members
      await tx.chatChannelMember.createMany({
        data: [
          { channelId, userId, role: 'ADMIN' },
          { channelId, userId: targetUserId, role: 'MEMBER' },
        ],
      });
    }

      return channelId!;
    });

    // Send initial message if provided
    if (initialMessage && initialMessage.trim().length > 0) {
      await this.sendMessage(channelId, tenantId, userId, {
        content: initialMessage.trim(),
      });
    }

    return {
      channelId,
      targetUser: target,
    };
  }

  /**
   * Get contact directory for current tenant to start direct chats
   */
  async getDirectory(tenantId: string, currentUserId: string) {
    const current = await this.prisma.user.findFirst({ where: { id: currentUserId, tenantId, isActive: true } });
    if (!current) throw new ForbiddenException('Active school account required');
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(['PARENT', 'STUDENT'].includes(current.role) ? { role: { notIn: ['PARENT', 'STUDENT'] as any } } : {}),
        id: { not: currentUserId },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        avatar: true,
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
      take: 100,
    });

    return users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
    }));
  }
}
