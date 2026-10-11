import { apiClient } from './api-client';

export interface ChatAttachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  content: string;
  attachments?: ChatAttachment[] | null;
  reactions?: Record<string, string[]> | null;
  isEdited?: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar?: string | null;
    role: string;
    isMe: boolean;
  };
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  } | null;
}

export interface ChatChannel {
  id: string;
  name: string;
  rawName: string;
  description?: string | null;
  type: 'DIRECT' | 'GROUP' | 'ANNOUNCEMENT' | 'CLASS';
  avatar?: string | null;
  classId?: string | null;
  memberCount: number;
  isMember: boolean;
  myRole: string;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    senderName: string;
  } | null;
  updatedAt: string;
}

export interface ChatContact {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

class ChatClient {
  private fallbackChannels: ChatChannel[] = [
    {
      id: 'default-announcements',
      name: '📢 Official Announcements',
      rawName: 'Official Announcements',
      description: 'School circulars, term calendars, and verified official communications',
      type: 'ANNOUNCEMENT',
      memberCount: 240,
      isMember: true,
      myRole: 'MEMBER',
      lastMessage: {
        id: 'msg-1',
        content: 'Welcome to Term 3! Please review the updated examination and fees timetable.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        senderName: 'Principal Office',
      },
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'default-staff',
      name: '☕ Staff & Faculty Room',
      rawName: 'Staff & Faculty Room',
      description: 'Teacher collaboration, duty schedules, and academic discussions',
      type: 'GROUP',
      memberCount: 38,
      isMember: true,
      myRole: 'MEMBER',
      lastMessage: {
        id: 'msg-2',
        content: 'All CBC Grade 4 assessment scores have been uploaded for moderation.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        senderName: 'Mrs. Wanjiku (HOD)',
      },
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'default-parents',
      name: '🤝 Parents & Guardians Association',
      rawName: 'Parents & Guardians Association',
      description: 'Parent-Teacher community discussions and school event coordination',
      type: 'GROUP',
      memberCount: 195,
      isMember: true,
      myRole: 'MEMBER',
      lastMessage: {
        id: 'msg-3',
        content: 'Reminder: Virtual PTM parent meetings open for booking on Friday.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        senderName: 'Dean of Students',
      },
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'default-transport',
      name: '🚌 Transport & Route A Desk',
      rawName: 'Transport & Route A Desk',
      description: 'Real-time school bus tracking, pick-up notices, and route assistance',
      type: 'GROUP',
      memberCount: 42,
      isMember: true,
      myRole: 'MEMBER',
      lastMessage: {
        id: 'msg-4',
        content: 'Morning pickup completed safely. All students checked in.',
        createdAt: new Date(Date.now() - 900000).toISOString(),
        senderName: 'Driver Omondi',
      },
      updatedAt: new Date(Date.now() - 900000).toISOString(),
    },
  ];

  async getChannels(): Promise<ChatChannel[]> {
    try {
      const response = await apiClient.get('/chat/channels');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return this.fallbackChannels;
    } catch {
      return this.fallbackChannels;
    }
  }

  async getMessages(channelId: string): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get(`/chat/channels/${channelId}/messages`);
      if (Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Fallback sample messages for demo
    }

    const now = Date.now();
    return [
      {
        id: 'sample-1',
        channelId,
        content: 'Good morning everyone! Welcome to the HustlerTech school communications forum.',
        createdAt: new Date(now - 3600000 * 3).toISOString(),
        sender: {
          id: 'user-admin',
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
          isMe: false,
        },
      },
      {
        id: 'sample-2',
        channelId,
        content: 'Please make sure all student progress records for Term 3 are updated before the weekend.',
        createdAt: new Date(now - 3600000 * 2).toISOString(),
        sender: {
          id: 'user-principal',
          name: 'Dr. Kamau (Principal)',
          role: 'PRINCIPAL',
          isMe: false,
        },
        reactions: { '👍': ['user-1', 'user-2'], '👏': ['user-3'] },
      },
      {
        id: 'sample-3',
        channelId,
        content: 'Noted! The gradebook and CBC rubric reports have been uploaded to the portal.',
        createdAt: new Date(now - 1800000).toISOString(),
        sender: {
          id: 'user-me',
          name: 'You',
          role: 'TEACHER',
          isMe: true,
        },
      },
    ];
  }

  async sendMessage(
    channelId: string,
    content: string,
    attachments?: ChatAttachment[],
    replyToId?: string,
  ): Promise<ChatMessage> {
    try {
      const response = await apiClient.post(`/chat/channels/${channelId}/messages`, {
        content,
        attachments,
        replyToId,
      });
      return response.data;
    } catch {
      // Optimistic message fallback
      return {
        id: 'local-' + Date.now(),
        channelId,
        content,
        attachments: attachments || null,
        createdAt: new Date().toISOString(),
        sender: {
          id: 'me',
          name: 'You',
          role: 'STAFF',
          isMe: true,
        },
        replyTo: null,
      };
    }
  }

  async addReaction(channelId: string, messageId: string, emoji: string) {
    try {
      const response = await apiClient.post(
        `/chat/channels/${channelId}/messages/${messageId}/reactions`,
        { emoji },
      );
      return response.data;
    } catch {
      return { messageId, reactions: { [emoji]: ['me'] } };
    }
  }

  async startDirectChat(targetUserId: string, initialMessage?: string) {
    const response = await apiClient.post('/chat/direct', {
      targetUserId,
      initialMessage,
    });
    return response.data;
  }

  async getContacts(): Promise<ChatContact[]> {
    try {
      const response = await apiClient.get('/chat/contacts');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch {}

    return [
      {
        id: 'c-1',
        name: 'Dr. Kamau (Principal)',
        email: 'principal@demoacademy.ac.ke',
        role: 'PRINCIPAL',
      },
      {
        id: 'c-2',
        name: 'Mrs. Wanjiku (Deputy Principal)',
        email: 'deputy@demoacademy.ac.ke',
        role: 'DEPUTY_PRINCIPAL',
      },
      {
        id: 'c-3',
        name: 'Mr. Joseph Kiprop (Senior Teacher)',
        email: 'joseph.kiprop@demoacademy.ac.ke',
        role: 'TEACHER',
      },
      {
        id: 'c-4',
        name: 'Faith Achieng (Bursar / Accounts)',
        email: 'accounts@demoacademy.ac.ke',
        role: 'ACCOUNTANT',
      },
      {
        id: 'c-5',
        name: 'Mary Nduta (Parent Representative)',
        email: 'mary.nduta@parent.ke',
        role: 'PARENT',
      },
    ];
  }
}

export const chatClient = new ChatClient();
