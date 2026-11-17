import { apiClient } from './api-client';

export interface ChatAttachment {
  name: string;
  url: string;
  type: string;
  size?: number;
  storageKey?: string;
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
  async uploadAttachment(channelId: string, file: File): Promise<ChatAttachment> {
    const body = new FormData();
    body.append('file', file);
    return (
      await apiClient.post(`/chat/channels/${channelId}/attachments`, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data;
  }
  async getChannels(): Promise<ChatChannel[]> {
    return (await apiClient.get('/chat/channels')).data;
  }
  async getMessages(channelId: string): Promise<ChatMessage[]> {
    return (await apiClient.get(`/chat/channels/${channelId}/messages`)).data;
  }
  async sendMessage(
    channelId: string,
    content: string,
    attachments?: ChatAttachment[],
    replyToId?: string
  ): Promise<ChatMessage> {
    return (
      await apiClient.post(`/chat/channels/${channelId}/messages`, {
        content,
        attachments,
        replyToId,
      })
    ).data;
  }
  async addReaction(channelId: string, messageId: string, emoji: string) {
    return (
      await apiClient.post(`/chat/channels/${channelId}/messages/${messageId}/reactions`, { emoji })
    ).data;
  }
  async createChannel(
    name: string,
    description: string,
    memberUserIds: string[]
  ): Promise<{ id: string }> {
    return (
      await apiClient.post('/chat/channels', { name, description, type: 'GROUP', memberUserIds })
    ).data;
  }
  async startDirectChat(targetUserId: string, initialMessage?: string) {
    return (await apiClient.post('/chat/direct', { targetUserId, initialMessage })).data;
  }
  async getContacts(): Promise<ChatContact[]> {
    return (await apiClient.get('/chat/contacts')).data;
  }
}
export const chatClient = new ChatClient();
