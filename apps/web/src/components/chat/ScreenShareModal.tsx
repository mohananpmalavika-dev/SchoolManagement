'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, ScreenShare, X } from 'lucide-react';
import { messageFor } from '@/lib/workspace';

export interface ScreenShareModalProps {
  channelName: string;
  onClose: () => void;
  onOpenWhiteboard?: () => void;
  onSendSnapshotToChat?: (dataUrl: string) => Promise<void>;
}

export function ScreenShareModal({
  channelName,
  onClose,
  onOpenWhiteboard,
  onSendSnapshotToChat,
}: ScreenShareModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const capture = useRef<MediaStream | null>(null);
  const mounted = useRef(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const stop = () => {
    capture.current?.getTracks().forEach((track) => track.stop());
    capture.current = null;
    setStream(null);
  };
  useEffect(() => {
    mounted.current = true;
    dialog.current?.showModal();
    return () => {
      mounted.current = false;
      capture.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);
  useEffect(() => {
    if (video.current) video.current.srcObject = stream;
  }, [stream]);
  async function start() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (!navigator.mediaDevices?.getDisplayMedia)
        throw new Error(
          'Screen capture is unavailable in this browser. Use a supported browser over HTTPS.'
        );
      const next = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      if (!mounted.current) {
        next.getTracks().forEach((track) => track.stop());
        return;
      }
      capture.current?.getTracks().forEach((track) => track.stop());
      capture.current = next;
      setStream(next);
      next.getVideoTracks().forEach((track) => {
        track.onended = () => {
          if (capture.current === next) stop();
        };
      });
    } catch (err) {
      if (mounted.current) setError(messageFor(err));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function snapshot() {
    if (!video.current || !stream || !video.current.videoWidth || busy || !onSendSnapshotToChat)
      return;
    setBusy(true);
    setError('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.current.videoWidth;
      canvas.height = video.current.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Screen capture is unavailable.');
      context.drawImage(video.current, 0, 0);
      await onSendSnapshotToChat(canvas.toDataURL('image/png'));
    } catch (err) {
      if (mounted.current) setError(messageFor(err));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="w-[min(95vw,1000px)] max-h-[92vh] rounded-2xl bg-slate-900 text-white p-0 border border-slate-700 backdrop:bg-black/80"
      aria-labelledby="screen-capture-title"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onClose();
      }}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div>
          <h2 id="screen-capture-title" className="font-bold">
            Screen preview · {channelName}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Preview a window locally and share a saved snapshot with this conversation.
          </p>
        </div>
        <button className="p-2" aria-label="Close screen preview" disabled={busy} onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {error && (
        <p role="alert" className="p-4 text-red-300">
          {error}
        </p>
      )}
      <div className="bg-black min-h-64 flex items-center justify-center">
        {stream ? (
          <video
            ref={video}
            autoPlay
            playsInline
            muted
            className="w-full max-h-[60vh] object-contain"
          />
        ) : (
          <p className="p-8 text-slate-300">Choose a window or screen to preview.</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button
          className="px-4 py-2 bg-cyan-700 rounded-lg"
          disabled={busy}
          onClick={() => void start()}
        >
          <ScreenShare className="inline mr-2" size={16} />
          {stream ? 'Change window' : 'Choose screen'}
        </button>
        <button
          className="px-4 py-2 bg-emerald-700 rounded-lg disabled:opacity-40"
          disabled={busy || !stream || !onSendSnapshotToChat}
          onClick={() => void snapshot()}
        >
          <Camera className="inline mr-2" size={16} />
          {busy ? 'Please wait…' : 'Snapshot to Chat'}
        </button>
        {stream && (
          <button
            className="px-4 py-2 border border-slate-600 rounded-lg"
            disabled={busy}
            onClick={stop}
          >
            Stop capture
          </button>
        )}
        {onOpenWhiteboard && (
          <button className="underline" disabled={busy} onClick={onOpenWhiteboard}>
            Open board
          </button>
        )}
      </div>
    </dialog>
  );
}
