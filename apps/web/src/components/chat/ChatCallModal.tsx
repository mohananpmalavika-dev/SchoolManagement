'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { teacherRoles } from '@/lib/session';
import Link from 'next/link';

interface Props {
  channelName: string;
  callType: 'audio' | 'video';
  onEndCall: () => void;
  onOpenWhiteboard?: () => void;
  onOpenScreenShare?: () => void;
}
export function ChatCallModal({ channelName, callType, onEndCall }: Props) {
  const { user } = useAuth();
  const dialog = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState('');
  let valid = false;
  try {
    valid = new URL(url).protocol === 'https:';
  } catch {}
  const meetings =
    user?.role === 'PARENT'
      ? '/dashboard/ptm'
      : teacherRoles.includes(user?.role || '')
        ? '/teacher/ptm'
        : null;
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="chat-call-title"
      className="submission-dialog"
      onCancel={onEndCall}
    >
      <div className="modal-header">
        <h2 id="chat-call-title">
          {callType === 'video' ? 'Video' : 'Voice'} meeting · {channelName}
        </h2>
        <button className="icon-button" aria-label="Close meeting" onClick={onEndCall}>
          ×
        </button>
      </div>
      <div className="p-6 space-y-5">
        <p>Open the HTTPS meeting link provided by your school to join its calling service.</p>
        <div className="field">
          <label htmlFor="chat-call-link">School meeting link</label>
          <input
            id="chat-call-link"
            type="url"
            autoFocus
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>
        {valid && (
          <a className="panel-link" href={url} target="_blank" rel="noopener noreferrer">
            Open meeting
          </a>
        )}
        {meetings && (
          <p>
            <Link className="panel-link" href={meetings} onClick={onEndCall}>
              Manage parent meetings
            </Link>
          </p>
        )}
      </div>
    </dialog>
  );
}
