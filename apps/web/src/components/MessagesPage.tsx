'use client';
import { useState, useEffect, useCallback } from 'react';
import { Send, MessageSquare, MessagesSquare, Radio } from 'lucide-react';
import { PageHeading, Panel, EmptyState, StatusPill } from './WorkspaceUI';
import { Button } from './ui';
import { apiClient } from '@/lib/api-client';
import { getRows, dateLabel, messageFor } from '@/lib/workspace';
import { SchoolChatHub } from './chat/SchoolChatHub';

export function MessagesPage() {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'BROADCAST'>('CHAT');
  const [messages, setMessages] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClass] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const [m, c] = await Promise.all([
        getRows('/workspace/messages'),
        getRows('/workspace/classes'),
      ]);
      setMessages(m);
      setClasses(c);
    } catch (err) {
      setError(messageFor(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const { data } = await apiClient.post('/workspace/messages', {
        data: { classId, subject, body },
      });
      setSubject('');
      setBody('');
      setNotice('Message delivered to ' + data.recipients + ' parent accounts.');
      await load();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading
          title="Communications Hub"
          description="Keep your school community connected with live channels, direct chats, and broadcast circulars."
        />
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-slate-300 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('CHAT')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'CHAT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <MessagesSquare size={15} />
            <span>Live Chat & Channels</span>
          </button>
          <button
            onClick={() => setActiveTab('BROADCAST')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'BROADCAST'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Radio size={15} />
            <span>Formal Broadcasts</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="state-box" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="state-box success" role="status">
          {notice}
        </div>
      )}

      {activeTab === 'CHAT' ? (
        <SchoolChatHub />
      ) : (
        <div className="dashboard-grid">
          <Panel title="Message history" subtitle="Your saved communications">
            {messages.length ? (
              <div className="panel-body">
                {messages.map((m) => (
                  <div className="activity-row" key={m.id}>
                    <div className="activity-icon">
                      <MessageSquare size={16} />
                    </div>
                    <div className="flex-1">
                      <strong>{m.subject}</strong>
                      <p>{m.body}</p>
                      <time>
                        {dateLabel(m.createdAt)} · {m.recipientCount} recipients
                      </time>
                    </div>
                    <StatusPill value={m.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="A conversation starts with hello"
                description="Broadcast circulars you send will appear here."
              />
            )}
          </Panel>
          <Panel
            title="Send an update"
            subtitle="Delivered to linked parent portal accounts"
          >
            <form className="panel-body space-y-5" onSubmit={send}>
              <div className="field">
                <label htmlFor="message-class">Class</label>
                <select
                  id="message-class"
                  required
                  value={classId}
                  onChange={(e) => setClass(e.target.value)}
                >
                  <option value="">Choose a class</option>
                  {classes.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="message-subject">Subject</label>
                <input
                  id="message-subject"
                  required
                  minLength={3}
                  maxLength={200}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="message-body">Message</label>
                <textarea
                  id="message-body"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                fullWidth
                isLoading={busy}
                leftIcon={<Send size={16} />}
              >
                Send to families
              </Button>
            </form>
          </Panel>
        </div>
      )}
    </div>
  );
}