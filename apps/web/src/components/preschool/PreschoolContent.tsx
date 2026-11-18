'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  friendly,
  kinds,
  type PreschoolAction,
  type PreschoolContent as Content,
} from '@/lib/preschool';
import { messageFor } from '@/lib/workspace';
import { Button } from '../ui';
import { EmptyState, Panel, StatusPill } from '../WorkspaceUI';
import { Field, PreschoolArea, PreschoolText } from './PreschoolFields';

export function PreschoolPrint({ content, close }: { content: Content; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  const cards =
    content.kind === 'FLASHCARDS'
      ? content.body
        .split('\n')
        .filter((line) => /^\d+[.)]\s/.test(line))
        .slice(0, 4)
        .map((line) => line.replace(/^\d+[.)]\s*/, ''))
      : [];
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      aria-label="Printable teaching sheet"
      className="preschool-print-overlay fixed inset-0 z-50 overflow-auto bg-white p-6 w-screen h-screen max-w-none max-h-none m-0"
    >
      <div className="preschool-print-controls mx-auto flex max-w-3xl gap-3 mb-6">
        <Button onClick={() => window.print()}>Print / Save PDF</Button>
        <Button variant="outline" onClick={close}>
          Close printable sheet
        </Button>
      </div>
      <article className="preschool-print-sheet mx-auto max-w-3xl text-black">
        <h1 className="text-3xl font-bold mb-3">{content.title}</h1>
        <p>
          {content.language} · {content.ageMinMonths}–{content.ageMaxMonths} months ·{' '}
          {content.durationMinutes} minutes
        </p>
        <h2 className="text-lg font-bold mt-5">Learning goals</h2>
        <p className="whitespace-pre-wrap">{content.learningGoals}</p>
        <h2 className="text-lg font-bold mt-5">Materials</h2>
        <p className="whitespace-pre-wrap">{content.materials}</p>
        <div className="whitespace-pre-wrap my-6 leading-relaxed">{content.body}</div>
        {cards.length > 0 && (
          <div className="grid grid-cols-2 gap-5 my-6">
            {cards.map((word, index) => (
              <section
                key={index}
                className="border-2 border-black rounded-xl p-5 min-h-64 flex flex-col items-center justify-between"
              >
                <div
                  className="h-40 w-full border border-dashed rounded-xl"
                  aria-label="Space to draw a matching picture"
                />
                <h2 className="text-3xl font-bold mt-4 text-center">{word}</h2>
              </section>
            ))}
          </div>
        )}
        {['COLOURING', 'WORKSHEET'].includes(content.kind) && (
          <>
            <svg
              className="w-full border rounded-xl"
              viewBox="0 0 700 330"
              role="img"
              aria-label="Large circle, square, triangle and matching shapes for drawing and colouring"
              fill="none"
              stroke="black"
              strokeWidth="4"
            >
              <circle cx="115" cy="100" r="65" />
              <rect x="285" y="35" width="130" height="130" rx="4" />
              <path d="M560 35 L630 165 H490 Z" />
              <rect x="50" y="230" width="80" height="80" />
              <circle cx="350" cy="270" r="40" />
              <path d="M560 230 L600 310 H520 Z" />
            </svg>
            <div
              className="my-5 h-56 border-2 border-black rounded-xl"
              aria-label="Blank space for your own drawing"
            />
          </>
        )}
      </article>
    </dialog>
  );
}
export function PreschoolContent({
  classId,
  today,
  language,
  refresh,
  action,
  busy,
  initialEdit,
  onConsumeInitialEdit,
}: {
  classId: string;
  today: string;
  language: string;
  refresh: number;
  action: PreschoolAction;
  busy: boolean;
  initialEdit?: { content: Content; sourceLabel?: string } | null;
  onConsumeInitialEdit?: () => void;
}) {
  const initial = {
    classId,
    kind: 'ACTIVITY',
    theme: '',
    language,
    ageMinMonths: 36,
    ageMaxMonths: 60,
    durationMinutes: 15,
    title: '',
    body: '',
    materials: '',
    learningGoals: '',
    scheduledOn: today,
  };
  const [draft, setDraft] = useState(initial),
    [editing, setEditing] = useState<Content | null>(null),
    [items, setItems] = useState<Content[]>([]),
    [offset, setOffset] = useState(0),
    [more, setMore] = useState(false),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [generating, setGenerating] = useState(false),
    [source, setSource] = useState(''),
    [reviewed, setReviewed] = useState(false),
    [print, setPrint] = useState<Content | null>(null);
  const dirtyRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const edit = useCallback(
    (item: Content, sourceLabel = '') => {
      dirtyRef.current = false;
      setEditing(item);
      const {
        classId: itemClassId,
        kind,
        theme,
        language: itemLanguage,
        ageMinMonths,
        ageMaxMonths,
        durationMinutes,
        title,
        body,
        materials,
        learningGoals,
        scheduledOn,
      } = item;
      setDraft({
        classId: itemClassId,
        kind,
        theme,
        language: itemLanguage,
        ageMinMonths,
        ageMaxMonths,
        durationMinutes,
        title,
        body,
        materials,
        learningGoals,
        scheduledOn: scheduledOn?.slice(0, 10) || today,
      });
      setReviewed(false);
      setSource(sourceLabel);
    },
    [today]
  );
  useEffect(() => {
    setDraft({
      classId,
      kind: 'ACTIVITY',
      theme: '',
      language,
      ageMinMonths: 36,
      ageMaxMonths: 60,
      durationMinutes: 15,
      title: '',
      body: '',
      materials: '',
      learningGoals: '',
      scheduledOn: today,
    });
    setEditing(null);
    setReviewed(false);
    setSource('');
    setOffset(0);
    dirtyRef.current = false;
  }, [classId, today, language]);
  useEffect(() => {
    if (!initialEdit || initialEdit.content.classId !== classId) return;
    edit(initialEdit.content, initialEdit.sourceLabel || '');
    onConsumeInitialEdit?.();
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [initialEdit, classId, edit, onConsumeInitialEdit]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setItems([]);
    setReviewed(false);
    apiClient
      .get('/preschool/content', { params: { classId, offset }, signal: controller.signal })
      .then(({ data }) => {
        setItems(data.items);
        setMore(data.hasMore);
        setEditing((current) => {
          if (!current) return current;
          const fresh = (data.items as Content[]).find((item) => item.id === current.id);
          if (!fresh || fresh.version <= current.version) return current;
          if (!dirtyRef.current) {
            setDraft({
              classId: fresh.classId,
              kind: fresh.kind,
              theme: fresh.theme,
              language: fresh.language,
              ageMinMonths: fresh.ageMinMonths,
              ageMaxMonths: fresh.ageMaxMonths,
              durationMinutes: fresh.durationMinutes,
              title: fresh.title,
              body: fresh.body,
              materials: fresh.materials,
              learningGoals: fresh.learningGoals,
              scheduledOn: fresh.scheduledOn?.slice(0, 10) || today,
            });
          }
          return fresh;
        });
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(messageFor(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [classId, offset, refresh, today]);
  function update(key: string, value: string | number) {
    dirtyRef.current = true;
    setDraft((current) => ({ ...current, [key]: value }));
    setReviewed(false);
  }
  async function generate() {
    setGenerating(true);
    setError('');
    try {
      const { classId, kind, theme, language, ageMinMonths, ageMaxMonths, durationMinutes } = draft;
      const { data } = await apiClient.post(
        '/preschool/content/generate',
        { classId, kind, theme, language, ageMinMonths, ageMaxMonths, durationMinutes },
        { timeout: 75000 }
      );
      dirtyRef.current = true;
      setDraft((current) => ({
        ...current,
        title: data.title,
        body: data.body,
        materials: data.materials,
        learningGoals: data.learningGoals,
      }));
      setSource(data.source);
      setReviewed(false);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setGenerating(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    const saved = await action(
      '/content' + (editing ? '/' + editing.id : ''),
      { ...draft, ...(editing ? { version: editing.version } : {}) },
      editing ? 'patch' : 'post'
    );
    if (saved) {
      dirtyRef.current = false;
      setEditing(null);
      setDraft(initial);
      setReviewed(false);
      setSource('');
    }
  }
  return (
    <div className="content-stack">
      {error && (
        <div role="alert" className="state-box">
          {error}
        </div>
      )}
      <Panel
        title={editing ? 'Edit teaching content' : 'Plan a playful learning activity'}
        subtitle="Create a draft, review it, then share the scheduled plan with families."
      >
        <form ref={formRef} className="panel-body space-y-4" onSubmit={save}>
          <fieldset disabled={busy || generating} className="space-y-4">
            <div className="form-grid">
              <Field label="Content type">
                {(id) => (
                  <select
                    id={id}
                    value={draft.kind}
                    onChange={(e) => update('kind', e.target.value)}
                  >
                    {kinds.map((kind) => (
                      <option key={kind} value={kind}>
                        {friendly(kind)}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <PreschoolText
                label="Theme / topic"
                value={draft.theme}
                onChange={(v) => update('theme', v)}
                maxLength={120}
              />
              <Field label="Content language">
                {(id) => (
                  <select
                    id={id}
                    value={draft.language}
                    onChange={(e) => update('language', e.target.value)}
                  >
                    {['English', 'Malayalam', 'Hindi'].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                )}
              </Field>
              <PreschoolText
                label="Minimum age (months)"
                type="number"
                value={String(draft.ageMinMonths)}
                onChange={(v) => update('ageMinMonths', Number(v))}
                min={18}
                max={84}
              />
              <PreschoolText
                label="Maximum age (months)"
                type="number"
                value={String(draft.ageMaxMonths)}
                onChange={(v) => update('ageMaxMonths', Number(v))}
                min={draft.ageMinMonths}
                max={84}
              />
              <PreschoolText
                label="Duration (minutes)"
                type="number"
                value={String(draft.durationMinutes)}
                onChange={(v) => update('durationMinutes', Number(v))}
                min={5}
                max={60}
              />
            </div>
            <Button
              variant="outline"
              disabled={
                busy ||
                generating ||
                draft.theme.trim().length < 2 ||
                draft.ageMinMonths > draft.ageMaxMonths
              }
              isLoading={generating}
              onClick={() => void generate()}
            >
              Prepare teaching draft
            </Button>
            {source && (
              <p className="text-sm muted" role="status">
                Source: {source}. Review and adapt this draft for your children.
              </p>
            )}
            <PreschoolText label="Title" value={draft.title} onChange={(v) => update('title', v)} />
            <PreschoolArea
              label="Learning goals"
              value={draft.learningGoals}
              onChange={(v) => update('learningGoals', v)}
              maxLength={3000}
              required
            />
            <PreschoolArea
              label="Materials"
              value={draft.materials}
              onChange={(v) => update('materials', v)}
              maxLength={3000}
            />
            <PreschoolArea
              label="Story, rhyme, instructions or worksheet tasks"
              value={draft.body}
              onChange={(v) => update('body', v)}
              maxLength={20000}
              rows={10}
              required
            />
            <PreschoolText
              label="Scheduled date"
              type="date"
              value={draft.scheduledOn}
              onChange={(v) => update('scheduledOn', v)}
            />
            <div className="flex gap-3">
              <Button type="submit" disabled={generating} isLoading={busy}>
                Save draft
              </Button>
              {editing && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(null);
                    setDraft(initial);
                  }}
                >
                  Cancel editing
                </Button>
              )}
            </div>
          </fieldset>
        </form>
      </Panel>
      <Panel
        title="Teaching library & plans"
        subtitle="Only reviewed, published content appears in the family workspace."
      >
        <div className="panel-body space-y-5">
          {loading ? (
            <p role="status">Loading teaching library…</p>
          ) : !items.length ? (
            <EmptyState
              title="No teaching content yet"
              description="Prepare your first age-appropriate plan above."
            />
          ) : (
            items.map((item) => (
              <article key={item.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="font-semibold">{item.title}</h3>
                  <StatusPill value={item.status} />
                </div>
                <p className="text-sm muted">
                  {friendly(item.kind)} · {item.language} ·{' '}
                  {item.scheduledOn?.slice(0, 10) || 'Unscheduled'}
                </p>
                <details>
                  <summary className="cursor-pointer">Read teaching content</summary>
                  <p className="whitespace-pre-wrap mt-3">{item.body}</p>
                </details>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || generating}
                    onClick={() => edit(item)}
                  >
                    Edit draft
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPrint(item)}>
                    Printable sheet
                  </Button>
                  {item.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      disabled={busy || !reviewed}
                      onClick={() =>
                        void action('/content/' + item.id + '/publish', {
                          version: item.version,
                          reviewed,
                        })
                      }
                    >
                      Publish to families
                    </Button>
                  )}
                </div>
              </article>
            ))
          )}
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            I have reviewed the content I am publishing for accuracy, age suitability and classroom
            safety.
          </label>
          <div className="flex gap-3">
            <Button
              size="sm"
              variant="outline"
              disabled={!offset || loading}
              onClick={() => setOffset((v) => Math.max(0, v - 50))}
            >
              Previous plans
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!more || loading}
              onClick={() => setOffset((v) => v + 50)}
            >
              More plans
            </Button>
          </div>
        </div>
      </Panel>
      {print && <PreschoolPrint content={print} close={() => setPrint(null)} />}
    </div>
  );
}
