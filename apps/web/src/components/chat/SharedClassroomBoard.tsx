'use client';
import { useEffect, useRef, useState } from 'react';
import { collaborationClient, LiveSession } from '@/lib/collaboration-client';
import { messageFor } from '@/lib/workspace';
import { InteractiveClassroomBoard } from './InteractiveClassroomBoard';
import { useAuth } from '@/contexts/AuthContext';
export function SharedClassroomBoard({
  channelId,
  channelName,
  onClose,
  onShareToChat,
}: {
  channelId: string;
  channelName: string;
  onClose: () => void;
  onShareToChat: (snapshot: string) => Promise<void>;
}) {
  const { user } = useAuth();
  const [session, setSession] = useState<LiveSession | null>(null),
    [error, setError] = useState(''),
    [ready, setReady] = useState(false),
    [attempt, setAttempt] = useState(0);
  const version = useRef(-1);
  useEffect(() => {
    let stopped = false,
      current: LiveSession | null = null,
      timer: ReturnType<typeof setTimeout>;
    setReady(false);
    setError('');
    setSession(null);
    version.current = -1;
    async function poll() {
      if (stopped || !current) return;
      const before = version.current;
      try {
        const result = await collaborationClient.poll(current, 0, before);
        if (stopped) return;
        setSession((prev) =>
          prev
            ? {
                ...prev,
                members: result.members,
                ...(result.board && result.version >= version.current
                  ? { board: result.board, version: result.version }
                  : {}),
              }
            : prev
        );
        version.current = Math.max(version.current, result.version);
        setReady(true);
        setError('');
      } catch (err) {
        if (stopped) return;
        setReady(false);
        setError(messageFor(err));
        if ([403, 404, 410].includes((err as any)?.response?.status)) return;
      }
      if (!stopped) timer = setTimeout(() => void poll(), 1200);
    }
    collaborationClient
      .join(channelId, 'BOARD')
      .then((joined) => {
        current = joined;
        if (stopped) {
          void collaborationClient.leave(joined).catch(() => {});
          return;
        }
        version.current = joined.version;
        setSession(joined);
        setReady(true);
        void poll();
      })
      .catch((err) => {
        if (!stopped) setError(messageFor(err));
      });
    return () => {
      stopped = true;
      clearTimeout(timer);
      if (current) void collaborationClient.leave(current).catch(() => {});
    };
  }, [channelId, attempt]);
  async function operation(op: Record<string, unknown>) {
    if (!session || !ready) throw new Error('Reconnect before changing the shared board.');
    try {
      const result = await collaborationClient.board(session, op);
      if (result.board && result.version >= version.current) {
        version.current = result.version;
        setSession((prev) =>
          prev ? { ...prev, board: result.board, version: result.version } : prev
        );
      }
    } catch (err) {
      throw new Error(messageFor(err));
    }
  }
  return (
    <div className="w-full max-w-5xl">
      {error && (
        <div role="alert" className="state-box mb-3">
          {error}
          <button className="underline ml-3" onClick={() => setAttempt((n) => n + 1)}>
            Rejoin board
          </button>
        </div>
      )}
      {!session ? (
        <div className="panel p-8">
          <p>{error ? 'Shared board is unavailable.' : 'Joining shared board…'}</p>
          <button className="underline mt-4" onClick={onClose}>
            Close board
          </button>
        </div>
      ) : (
        <InteractiveClassroomBoard
          key={session.roomId}
          channelName={channelName}
          userName={[user?.firstName, user?.lastName].filter(Boolean).join(' ')}
          userRole={user?.role}
          onClose={onClose}
          onShareToChat={onShareToChat}
          shared={{
            board: session.board,
            members: session.members,
            ready,
            canManage: [
              'SUPER_ADMIN',
              'SCHOOL_OWNER',
              'PRINCIPAL',
              'DEPUTY_PRINCIPAL',
              'SCHOOL_ADMIN',
              'TEACHER',
              'CLASS_TEACHER',
            ].includes(user?.role || ''),
            onOperation: operation,
          }}
        />
      )}
    </div>
  );
}
