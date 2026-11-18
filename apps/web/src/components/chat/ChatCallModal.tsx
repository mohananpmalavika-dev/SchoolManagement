'use client';
import { useEffect, useRef, useState } from 'react';
import { collaborationClient, LiveMember, LiveSession } from '@/lib/collaboration-client';
import { RtcMesh } from '@/lib/rtc-mesh';
import { messageFor } from '@/lib/workspace';
import { useAuth } from '@/contexts/AuthContext';
import { SharedClassroomBoard } from './SharedClassroomBoard';
function VideoTile({
  stream,
  name,
  local = false,
  state,
}: {
  stream: MediaStream | null;
  name: string;
  local?: boolean;
  state?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    if (video.current) {
      video.current.srcObject = stream;
      if (stream)
        void video.current
          .play()
          .then(() => setBlocked(false))
          .catch(() => setBlocked(true));
    }
  }, [stream]);
  return (
    <div className="rounded-xl bg-black overflow-hidden relative border border-slate-700">
      <video
        ref={video}
        autoPlay
        playsInline
        muted={local}
        aria-label={name + (local ? ' local video' : ' remote video')}
        className="w-full h-52 object-contain"
      />
      <div className="p-2 bg-slate-900 text-xs">
        {name}
        {local ? ' - You' : ''}
        {state ? ' - ' + state : ''}
        {!stream ? ' - Waiting for media' : ''}
      </div>
      {blocked && (
        <button
          className="absolute top-3 left-3 rounded bg-blue-700 p-2"
          onClick={() => void video.current?.play().then(() => setBlocked(false))}
        >
          Play audio/video
        </button>
      )}
    </div>
  );
}
export function ChatCallModal({
  channelId,
  channelName,
  callType,
  onEndCall,
  onShareToChat,
}: {
  channelId: string;
  channelName: string;
  callType: 'audio' | 'video';
  onEndCall: () => void;
  onShareToChat: (snapshot: string) => Promise<void>;
}) {
  const { user } = useAuth();
  const dialog = useRef<HTMLDialogElement>(null),
    mounted = useRef(true),
    joining = useRef(false),
    screenBusy = useRef(false);
  const local = useRef<MediaStream | null>(null),
    capture = useRef<MediaStream | null>(null),
    room = useRef<LiveSession | null>(null),
    mesh = useRef<RtcMesh | null>(null);
  const [session, setSession] = useState<LiveSession | null>(null),
    [preview, setPreview] = useState<MediaStream | null>(null),
    [members, setMembers] = useState<LiveMember[]>([]),
    [streams, setStreams] = useState<Record<string, MediaStream>>({}),
    [states, setStates] = useState<Record<string, string>>({});
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [muted, setMuted] = useState(false),
    [cameraOff, setCameraOff] = useState(false),
    [sharing, setSharing] = useState(false),
    [changingScreen, setChangingScreen] = useState(false),
    [boardOpen, setBoardOpen] = useState(false);
  function dispose() {
    mesh.current?.close();
    mesh.current = null;
    local.current?.getTracks().forEach((track) => track.stop());
    local.current = null;
    capture.current?.getTracks().forEach((track) => track.stop());
    capture.current = null;
    const previous = room.current;
    room.current = null;
    if (previous) void collaborationClient.leave(previous).catch(() => {});
  }
  function failed(message: string) {
    dispose();
    if (mounted.current) {
      setSession(null);
      setPreview(null);
      setStreams({});
      setMembers([]);
      setSharing(false);
      setError(message);
    }
  }
  useEffect(() => {
    mounted.current = true;
    dialog.current?.showModal();
    const hide = () => failed('Call stopped when this page was hidden. Rejoin to continue.');
    window.addEventListener('pagehide', hide);
    return () => {
      mounted.current = false;
      dispose();
      window.removeEventListener('pagehide', hide);
    };
  }, []);
  async function join() {
    if (joining.current || room.current) return;
    joining.current = true;
    setBusy(true);
    setError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection)
        throw new Error('Calling requires a supported browser over HTTPS.');
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video' ? { width: { ideal: 640 }, height: { ideal: 360 } } : false,
      });
      if (!mounted.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      local.current = media;
      const joined = await collaborationClient.join(channelId, 'CALL', callType);
      if (!mounted.current) {
        media.getTracks().forEach((track) => track.stop());
        void collaborationClient.leave(joined).catch(() => {});
        return;
      }
      room.current = joined;
      setSession(joined);
      setPreview(media);
      setMuted(false);
      setCameraOff(false);
      setStates({});
      mesh.current = new RtcMesh(joined, media, {
        members: setMembers,
        stream: (id, remote) =>
          setStreams((prev) => {
            const next = { ...prev };
            if (remote) next[id] = remote;
            else delete next[id];
            return next;
          }),
        state: (id, state) => setStates((prev) => ({ ...prev, [id]: state })),
        error: failed,
      });
      mesh.current.start();
    } catch (err) {
      failed(messageFor(err));
    } finally {
      joining.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function stopScreen() {
    const old = capture.current;
    capture.current = null;
    old?.getTracks().forEach((t) => {
      t.onended = null;
      t.stop();
    });
    await mesh.current?.replaceVideo(local.current?.getVideoTracks()[0] || null);
    if (mounted.current) {
      setPreview(local.current);
      setSharing(false);
    }
  }
  async function screen() {
    if (screenBusy.current) return;
    screenBusy.current = true;
    setChangingScreen(true);
    let acquired = false;
    try {
      if (sharing) {
        await stopScreen();
        return;
      }
      const next = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      if (!mounted.current || !room.current) {
        next.getTracks().forEach((t) => t.stop());
        return;
      }
      capture.current = next;
      acquired = true;
      const track = next.getVideoTracks()[0];
      if (!track) throw new Error('No screen video was selected.');
      await mesh.current?.replaceVideo(track);
      track.onended = () =>
        void stopScreen().catch(() => failed('Screen sharing ended. Rejoin to restore media.'));
      setPreview(next);
      setSharing(true);
    } catch (err) {
      if (acquired || sharing) failed('Could not switch call media. Rejoin the call.');
      else if (mounted.current) setError(messageFor(err));
    } finally {
      screenBusy.current = false;
      if (mounted.current) setChangingScreen(false);
    }
  }

  const self = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'You';
  return (
    <dialog
      ref={dialog}
      aria-labelledby="chat-call-title"
      className="w-[min(96vw,1100px)] max-w-none max-h-[94vh] overflow-auto rounded-2xl bg-slate-950 text-white p-0 border border-slate-700 backdrop:bg-black/80"
      onCancel={onEndCall}
    >
      <div className="modal-header">
        <div>
          <h2 id="chat-call-title">
            {callType === 'video' ? 'Video' : 'Voice'} call - {channelName}
          </h2>
          <p className="text-xs mt-1 text-slate-400">
            Up to 4 participants - Live camera/microphone media - No recording
          </p>
        </div>
        <button className="icon-button" aria-label="Close call" onClick={onEndCall}>
          &times;
        </button>
      </div>
      {error && (
        <div role="alert" className="p-4 text-red-300">
          {error}
        </div>
      )}
      {!session ? (
        <div className="p-6 space-y-4">
          <p>
            Join this conversation&apos;s call. Other members join using the call button in the same
            conversation.
          </p>
          <p className="text-sm text-slate-400">
            Your browser will ask for microphone{callType === 'video' ? ' and camera' : ''}{' '}
            permission.
          </p>
          <button
            className="px-4 py-2 rounded bg-blue-700 disabled:opacity-50"
            disabled={busy}
            onClick={() => void join()}
          >
            {busy ? 'Joining...' : 'Join call'}
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {!session.relayConfigured && (
            <p className="text-xs text-amber-200">
              A TURN relay is not configured. Calls may fail across different networks.
            </p>
          )}
          <p role="status">
            {members.length} participant{members.length === 1 ? '' : 's'} joined
            {members.length === 1 ? ' - Waiting for another member to join' : ''}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <VideoTile stream={preview} name={self} local />
            {members
              .filter((m) => m.id !== session.participantId)
              .map((member) => (
                <VideoTile
                  key={member.id}
                  stream={streams[member.id] || null}
                  name={member.name}
                  state={states[member.id] || 'connecting'}
                />
              ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="px-3 py-2 border rounded"
              onClick={() => {
                local.current?.getAudioTracks().forEach((t) => {
                  t.enabled = muted;
                });
                setMuted(!muted);
              }}
            >
              {muted ? 'Unmute microphone' : 'Mute microphone'}
            </button>
            {callType === 'video' && (
              <button
                className="px-3 py-2 border rounded"
                onClick={() => {
                  local.current?.getVideoTracks().forEach((t) => {
                    t.enabled = cameraOff;
                  });
                  setCameraOff(!cameraOff);
                }}
              >
                {cameraOff ? 'Turn camera on' : 'Turn camera off'}
              </button>
            )}
            <button
              className="px-3 py-2 border rounded"
              disabled={changingScreen}
              onClick={() => void screen()}
            >
              {sharing ? 'Stop sharing screen' : 'Share screen with call'}
            </button>
            <button className="px-3 py-2 border rounded" onClick={() => setBoardOpen(!boardOpen)}>
              {boardOpen ? 'Hide shared board' : 'Open shared board'}
            </button>
            <button className="px-3 py-2 bg-red-700 rounded" onClick={onEndCall}>
              Leave call
            </button>
          </div>
          {boardOpen && (
            <SharedClassroomBoard
              channelId={channelId}
              channelName={channelName}
              onClose={() => setBoardOpen(false)}
              onShareToChat={async (snapshot) => {
                await onShareToChat(snapshot);
                setBoardOpen(false);
              }}
            />
          )}
        </div>
      )}
    </dialog>
  );
}
