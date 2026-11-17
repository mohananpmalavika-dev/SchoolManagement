'use client';
import { useState, type FormEvent } from 'react';
import { apiClient } from '@/lib/api-client';
import { messageFor } from '@/lib/workspace';
import { Panel } from '../WorkspaceUI';
import { Button } from '../ui';
import { Field, PreschoolArea } from './PreschoolFields';

export function PreschoolCopilot({
  classId,
  language: initialLanguage,
}: {
  classId: string;
  language: string;
}) {
  const [question, setQuestion] = useState(''),
    [language, setLanguage] = useState(initialLanguage),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [reply, setReply] = useState<{
      answer: string;
      suggestedActivities: string[];
      source: string;
    } | null>(null);
  async function ask(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setReply(null);
    try {
      const { data } = await apiClient.post(
        '/preschool/copilot',
        { classId, language, question },
        { timeout: 75000 }
      );
      setReply(data);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      title="INKY · Your preschool teaching assistant"
      subtitle="Get ideas for classroom routines, inclusive play and daily teaching."
    >
      <div className="panel-body space-y-5">
        <form className="space-y-4" onSubmit={ask}>
          <Field label="Reply language">
            {(id) => (
              <select id={id} value={language} onChange={(e) => setLanguage(e.target.value)}>
                {['English', 'Malayalam', 'Hindi'].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            )}
          </Field>
          <PreschoolArea
            label="Describe the classroom situation"
            value={question}
            onChange={setQuestion}
            maxLength={1000}
            required
          />
          <p className="text-sm muted">
            Describe the teaching situation without children’s names or private family information.
            Review suggestions before using them.
          </p>
          <Button type="submit" isLoading={busy} disabled={question.trim().length < 5}>
            Ask INKY
          </Button>
        </form>
        {error && (
          <p className="state-box" role="alert">
            {error}
          </p>
        )}
        {reply && (
          <section className="space-y-4 border rounded-xl p-5" aria-live="polite">
            <p className="text-xs muted">Source: {reply.source}</p>
            <p className="whitespace-pre-wrap">{reply.answer}</p>
            <h3 className="font-semibold">Activities to try</h3>
            <ul className="list-disc pl-5 space-y-2">
              {reply.suggestedActivities.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Panel>
  );
}
