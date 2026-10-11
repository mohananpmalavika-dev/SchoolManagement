import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
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
  ) {}

  /**
   * Ensure default school channels exist for this tenant
   */
  async ensureDefaultChannels(tenantId: string, userId?: string) {
    const existing = await this.prisma.chatChannel.count({
      where: { tenantId },
    });

    if (existing === 0) {
      this.logger.log(`Initializing default chat channels for tenant ${tenantId}`);
      const defaults = [
        {
          name: '📢 Announcements',
          description: 'Official school-wide updates, circulars, and notices',
          type: ChannelType.ANNOUNCEMENT,
        },
        {
          name: '☕ Staff Room',
          description: 'Faculty, teachers, and administrative collaboration',
          type: ChannelType.GROUP,
        },
        {
          name: '🤝 Parents & Guardians Forum',
          description: 'Open discussion and community forum for school parents',
          type: ChannelType.GROUP,
        },
        {
          name: '🚌 Transport & Safety Desk',
          description: 'Live route alerts, bus updates, and arrival notices',
          type: ChannelType.GROUP,
        },
      ];

      for (const ch of defaults) {
        const created = await this.prisma.chatChannel.create({
          data: {
            tenantId,
            name: ch.name,
            description: ch.description,
            type: ch.type,
            createdById: userId,
          },
        });

        // Add creator as member if present
        if (userId) {
          await this.prisma.chatChannelMember.create({
            data: {
              channelId: created.id,
              userId,
              role: 'ADMIN',
            },
          });
        }
      }
    }
  }

  /**
   * Get all accessible channels for the user
   */
  async getChannels(userId: string, tenantId: string) {
    await this.ensureDefaultChannels(tenantId, userId);

    // Fetch channels: public/group/announcement or direct channels where user is a member
    const channels = await this.prisma.chatChannel.findMany({
      where: {
        tenantId,
        isArchived: false,
        OR: [
          { type: { in: [ChannelType.GROUP, ChannelType.ANNOUNCEMENT, ChannelType.CLASS] } },
          { members: { some: { userId } } },
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
    const channel = await this.prisma.chatChannel.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        type: dto.type || ChannelType.GROUP,
        classId: dto.classId,
        createdById: userId,
      },
    });

    // Add creator as ADMIN member
    await this.prisma.chatChannelMember.create({
      data: {
        channelId: channel.id,
        userId,
        role: 'ADMIN',
      },
    });

    // Add initial members if provided
    if (dto.memberUserIds && dto.memberUserIds.length > 0) {
      const uniqueIds = Array.from(new Set(dto.memberUserIds)).filter(
        (id) => id !== userId,
      );
      for (const mId of uniqueIds) {
        await this.prisma.chatChannelMember.upsert({
          where: { channelId_userId: { channelId: channel.id, userId: mId } },
          update: {},
          create: { channelId: channel.id, userId: mId, role: 'MEMBER' },
        });
      }
    }

    return channel;
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
    const channel = await this.prisma.chatChannel.findFirst({
      where: { id: channelId, tenantId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Auto-join member if open channel
    if (
      channel.type === ChannelType.GROUP ||
      channel.type === ChannelType.ANNOUNCEMENT
    ) {
      await this.prisma.chatChannelMember.upsert({
        where: { channelId_userId: { channelId, userId } },
        update: { lastReadAt: new Date() },
        create: { channelId, userId, lastReadAt: new Date(), role: 'MEMBER' },
      });
    } else {
      // Direct or restricted: ensure membership
      const member = await this.prisma.chatChannelMember.findUnique({
        where: { channelId_userId: { channelId, userId } },
      });
      if (!member) {
        throw new ForbiddenException('Access denied to this conversation');
      }
      await this.prisma.chatChannelMember.update({
        where: { channelId_userId: { channelId, userId } },
        data: { lastReadAt: new Date() },
      });
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: { channelId, isDeleted: false },
      take: limit,
      orderBy: { createdAt: 'asc' },
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

    return messages.map((m) => ({
      id: m.id,
      channelId: m.channelId,
      content: m.content,
      attachments: m.attachments,
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
    }));
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
    const channel = await this.prisma.chatChannel.findFirst({
      where: { id: channelId, tenantId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Verify announcements permissions
    if (channel.type === ChannelType.ANNOUNCEMENT) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      const allowedRoles = [
        'SUPER_ADMIN',
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
        attachments: dto.attachments ? JSON.parse(JSON.stringify(dto.attachments)) : null,
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
      attachments: message.attachments,
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
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message || message.channelId !== channelId) {
      throw new NotFoundException('Message not found');
    }

    const currentReactions: Record<string, string[]> =
      (message.reactions as Record<string, string[]>) || {};

    const usersForEmoji = currentReactions[emoji] || [];
    let updatedUsers: string[];

    if (usersForEmoji.includes(userId)) {
      // Toggle off
      updatedUsers = usersForEmoji.filter((id) => id !== userId);
    } else {
      // Toggle on
      updatedUsers = [...usersForEmoji, userId];
    }

    if (updatedUsers.length > 0) {
      currentReactions[emoji] = updatedUsers;
    } else {
      delete currentReactions[emoji];
    }

    const updated = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { reactions: currentReactions },
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
      where: { id: targetUserId, tenantId },
      select: { id: true, firstName: true, lastName: true, role: true },
    });

    if (!target) {
      throw new NotFoundException('Contact not found');
    }

    // Look for existing direct channel between these two users
    const existing = await this.prisma.chatChannel.findFirst({
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
      const created = await this.prisma.chatChannel.create({
        data: {
          tenantId,
          name: `Direct: ${target.firstName} & You`,
          type: ChannelType.DIRECT,
          createdById: userId,
        },
      });
      channelId = created.id;

      // Add both members
      await this.prisma.chatChannelMember.createMany({
        data: [
          { channelId, userId, role: 'ADMIN' },
          { channelId, userId: targetUserId, role: 'MEMBER' },
        ],
      });
    }

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
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
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
