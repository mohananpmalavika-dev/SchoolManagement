import { apiClient } from './api-client';
export interface LiveMember {
  id: string;
  userId: string;
  name: string;
  role: string;
  media: string;
}
export interface BoardStroke {
  id: string;
  tool: string;
  color: string;
  size: number;
  points: { x: number; y: number }[];
  text?: string;
  author: string;
  authorRole: string;
  authorId?: string;
}
export interface BoardState {
  actions: BoardStroke[];
  theme: 'chalkboard' | 'whiteboard';
}
export interface LiveSession {
  roomId: string;
  participantId: string;
  members: LiveMember[];
  board: BoardState;
  version: number;
  iceServers?: RTCIceServer[];
  relayConfigured?: boolean;
  expiresAt: string;
}
export interface LivePoll {
  members: LiveMember[];
  board: BoardState | null;
  version: number;
  cursor: number;
  signals: {
    id: number;
    from: string;
    to: string;
    signal: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
  }[];
}
export const collaborationClient = {
  join: async (
    channelId: string,
    kind: 'CALL' | 'BOARD',
    media?: 'audio' | 'video'
  ): Promise<LiveSession> =>
    (await apiClient.post(`/chat/channels/${channelId}/live/join`, { data: { kind, media } })).data,
  poll: async (session: LiveSession, after: number, boardVersion: number): Promise<LivePoll> =>
    (
      await apiClient.post(`/chat/live/${session.roomId}/poll`, {
        data: { participantId: session.participantId, after, boardVersion },
      })
    ).data,
  signal: async (
    session: LiveSession,
    targetId: string,
    signal: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }
  ) =>
    (
      await apiClient.post(`/chat/live/${session.roomId}/signal`, {
        data: { participantId: session.participantId, targetId, signal },
      })
    ).data,
  board: async (
    session: LiveSession,
    operation: Record<string, unknown>
  ): Promise<{ version: number; board: BoardState }> =>
    (
      await apiClient.post(`/chat/live/${session.roomId}/board`, {
        data: { participantId: session.participantId, operation },
      })
    ).data,
  leave: async (session: LiveSession) =>
    (
      await apiClient.post(`/chat/live/${session.roomId}/leave`, {
        data: { participantId: session.participantId },
      })
    ).data,
};
