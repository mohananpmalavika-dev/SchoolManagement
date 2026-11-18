'use client';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowUpRight, FilePlus2, RotateCcw, Send, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import {
  buildDraftFromInkySuggestion,
  timeLabel,
  type PreschoolContent,
  type PreschoolCopilotMessage,
} from '@/lib/preschool';
import { messageFor } from '@/lib/workspace';
import { Panel, StatusPill } from '../WorkspaceUI';
import { Button } from '../ui';
import { Field } from './PreschoolFields';

const STARTER_PROMPTS: Record<string, string[]> = {
  English: [
    'How can I help new children settle calmly at morning drop-off?',
    'Give gentle ideas for helping toddlers take turns during block play.',
    'Suggest a calm 10-minute transition activity after outdoor play.',
  ],
  Malayalam: [
    'രാവിലെ സ്കൂളിൽ എത്തുമ്പോൾ കരയുന്ന കുട്ടികളെ ശാന്തമായി ഇണക്കിച്ചേർക്കാൻ എന്തു ചെയ്യാം?',
    'കളിപ്പാട്ടങ്ങൾ പങ്കുവെയ്ക്കാനും ഊഴമെടുക്കാനും കുട്ടികളെ എങ്ങനെ സഹായിക്കാം?',
    'പുറത്തുള്ള കളിക്ക് ശേഷം ക്ലാസിലേക്ക് ശാന്തമായി മടങ്ങാൻ ഒരു ചെറിയ പ്രവർത്തനം നിർദ്ദേശിക്കാമോ?',
  ],
  Hindi: [
    'सुबह स्कूल आने पर रोने वाले बच्चों को शांत होकर घुलने-मिलने में कैसे मदद करें?',
    'खेल के दौरान बच्चों को बारी लेने और साझा करने की आदत कैसे सिखाएँ?',
    'बाहर खेलने के बाद कक्षा में शांत लौटने के लिए 10 मिनट की गतिविधि सुझाएँ।',
  ],
};

function makeMessageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `inky-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PreschoolCopilot({
  classId,
  className,
  stage,
  today,
  timezone,
  language: initialLanguage,
  messages,
  onMessagesChange,
  onDraftCreated,
  onOpenDraft,
}: {
  classId: string;
  className?: string;
  stage?: string | null;
  today: string;
  timezone: string;
  language: string;
  messages: PreschoolCopilotMessage[];
  onMessagesChange: (
    updater: (prev: PreschoolCopilotMessage[]) => PreschoolCopilotMessage[]
  ) => void;
  onDraftCreated: (content: PreschoolContent, sourceLabel: string) => void;
  onOpenDraft: (content: PreschoolContent, sourceLabel: string) => void;
}) {
  const [question, setQuestion] = useState('');
  const [language, setLanguage] = useState(initialLanguage);
  const [busy, setBusy] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState('');
  const [convertingKey, setConvertingKey] = useState('');
  const [error, setError] = useState('');
  const threadEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    if (messages.length > 0 || pendingQuestion) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages.length, pendingQuestion]);

  const turnCount = messages.filter((m) => m.role === 'assistant').length;
  const starters = STARTER_PROMPTS[language] || STARTER_PROMPTS.English;

  async function submitQuestion() {
    const trimmed = question.trim();
    if (trimmed.length < 5 || busy) return;

    setBusy(true);
    setError('');
    setPendingQuestion(trimmed);
    setQuestion('');

    const history = messages.slice(-10).map((item) => ({
      role: item.role,
      content:
        item.role === 'assistant' && item.suggestedActivities?.length
          ? `${item.content}\nSuggested activities: ${item.suggestedActivities.join('; ')}`.slice(
              0,
              3000
            )
          : item.content.slice(0, 3000),
    }));

    try {
      const { data } = await apiClient.post<{
        answer: string;
        suggestedActivities: string[];
        source: string;
      }>(
        '/preschool/copilot',
        {
          classId,
          language,
          question: trimmed,
          ...(history.length ? { history } : {}),
        },
        { timeout: 75000 }
      );

      const now = new Date().toISOString();
      const userMessage: PreschoolCopilotMessage = {
        id: makeMessageId(),
        role: 'user',
        content: trimmed,
        language,
        createdAt: now,
      };
      const assistantMessage: PreschoolCopilotMessage = {
        id: makeMessageId(),
        role: 'assistant',
        content: data.answer,
        language,
        createdAt: new Date().toISOString(),
        source: data.source,
        suggestedActivities: Array.isArray(data.suggestedActivities)
          ? data.suggestedActivities
          : [],
        draftedPlans: {},
      };

      onMessagesChange((prev) => [...prev, userMessage, assistantMessage].slice(-40));
    } catch (err) {
      setQuestion(trimmed);
      setError(messageFor(err));
    } finally {
      setPendingQuestion('');
      setBusy(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void submitQuestion();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      void submitQuestion();
    }
  }

  function precedingQuestionFor(messageId: string) {
    const idx = messages.findIndex((m) => m.id === messageId);
    for (let i = idx - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'user') return messages[i].content;
    }
    return '';
  }

  async function convertToDraft(
    message: PreschoolCopilotMessage,
    activityIndex: number | null,
    activityText?: string
  ) {
    const planKey = activityIndex === null ? 'plan' : `activity-${activityIndex}`;
    const existing = message.draftedPlans?.[planKey];
    const sourceLabel = `INKY · ${message.source || 'Assistant'}`;
    if (existing) {
      onOpenDraft(existing, sourceLabel);
      return;
    }

    const busyKey = `${message.id}:${planKey}`;
    setConvertingKey(busyKey);
    setError('');

    try {
      const payload = buildDraftFromInkySuggestion({
        classId,
        stage,
        today,
        language: message.language || language,
        question: precedingQuestionFor(message.id),
        answer: message.content,
        activity: activityText,
        allActivities: message.suggestedActivities || [],
      });
      const { data: created } = await apiClient.post<PreschoolContent>(
        '/preschool/content',
        payload
      );
      onMessagesChange((prev) =>
        prev.map((item) =>
          item.id === message.id
            ? {
                ...item,
                draftedPlans: { ...(item.draftedPlans || {}), [planKey]: created },
              }
            : item
        )
      );
      onDraftCreated(created, sourceLabel);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setConvertingKey('');
    }
  }

  return (
    <Panel
      title="INKY · Your preschool teaching assistant"
      subtitle="Multi-turn ideas for classroom routines, inclusive play and daily teaching — convert any suggestion into an Activities & plans draft in one click."
    >
      <div className="panel-body space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="flex flex-wrap items-center gap-2 text-sm muted">
            {className && <span className="font-medium text-slate-700">{className}</span>}
            {className && <span>·</span>}
            <span>
              {turnCount === 0
                ? 'Start a conversation with INKY'
                : `${turnCount} ${turnCount === 1 ? 'reply' : 'replies'} in this session`}
            </span>
          </div>
          {messages.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<RotateCcw size={14} />}
              disabled={busy || !!convertingKey}
              onClick={() => {
                setError('');
                onMessagesChange(() => []);
              }}
            >
              New chat
            </Button>
          )}
        </div>

        {messages.length === 0 && !pendingQuestion ? (
          <div className="rounded-xl border border-dashed p-5 space-y-3 bg-slate-50/60">
            <p className="text-sm font-medium">Try a classroom starter prompt:</p>
            <div className="flex flex-wrap gap-2">
              {starters.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setQuestion(prompt);
                    inputRef.current?.focus();
                  }}
                  className="text-left text-sm rounded-lg border bg-white px-3 py-2 hover:bg-slate-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="space-y-4 max-h-[34rem] overflow-y-auto pr-1"
            role="log"
            aria-label="INKY conversation history"
            aria-live="polite"
          >
            {messages.map((msg) => {
              const sourceLabel = `INKY · ${msg.source || 'Assistant'}`;
              const fullPlanDraft = msg.draftedPlans?.plan;

              if (msg.role === 'user') {
                return (
                  <article
                    key={msg.id}
                    className="rounded-xl border bg-slate-50 p-4 space-y-1.5 ml-auto max-w-3xl"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs muted">
                      <span className="font-semibold text-slate-700">You</span>
                      <span>
                        {msg.language} · {timeLabel(msg.createdAt, timezone)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </article>
                );
              }

              return (
                <article
                  key={msg.id}
                  className="rounded-xl border border-teal-200/80 bg-white p-5 space-y-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs muted">
                    <span className="font-semibold text-teal-800 inline-flex items-center gap-1.5">
                      <Sparkles size={14} />
                      INKY
                    </span>
                    <span>
                      Source: {msg.source || 'Assistant'} · {msg.language} ·{' '}
                      {timeLabel(msg.createdAt, timezone)}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {msg.suggestedActivities && msg.suggestedActivities.length > 0 && (
                    <div className="space-y-2.5">
                      <h3 className="text-sm font-semibold">Activities to try</h3>
                      <ul className="space-y-2">
                        {msg.suggestedActivities.map((activity, idx) => {
                          const planKey = `activity-${idx}`;
                          const savedDraft = msg.draftedPlans?.[planKey];
                          const isConverting = convertingKey === `${msg.id}:${planKey}`;

                          return (
                            <li
                              key={idx}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-slate-50/70 p-3"
                            >
                              <span className="text-sm flex-1 min-w-[200px]">{activity}</span>
                              <div className="flex items-center gap-2">
                                {savedDraft ? (
                                  <>
                                    <StatusPill value="Draft" />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      leftIcon={<ArrowUpRight size={14} />}
                                      disabled={busy || !!convertingKey}
                                      onClick={() => onOpenDraft(savedDraft, sourceLabel)}
                                    >
                                      Open draft
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<FilePlus2 size={14} />}
                                    isLoading={isConverting}
                                    disabled={busy || (!!convertingKey && !isConverting)}
                                    onClick={() => void convertToDraft(msg, idx, activity)}
                                  >
                                    Draft in Activities & plans
                                  </Button>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                    <span className="text-xs muted">
                      Save INKY’s guidance directly as an editable draft in Activities & plans.
                    </span>
                    {fullPlanDraft ? (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<ArrowUpRight size={14} />}
                        disabled={busy || !!convertingKey}
                        onClick={() => onOpenDraft(fullPlanDraft, sourceLabel)}
                      >
                        Open lesson plan draft
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<FilePlus2 size={14} />}
                        isLoading={convertingKey === `${msg.id}:plan`}
                        disabled={
                          busy || (!!convertingKey && convertingKey !== `${msg.id}:plan`)
                        }
                        onClick={() => void convertToDraft(msg, null)}
                      >
                        Draft full guidance as lesson plan
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}

            {pendingQuestion && (
              <>
                <article className="rounded-xl border bg-slate-50 p-4 space-y-1.5 ml-auto max-w-3xl opacity-80">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs muted">
                    <span className="font-semibold text-slate-700">You</span>
                    <span>{language}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{pendingQuestion}</p>
                </article>
                <div
                  className="rounded-xl border border-teal-100 bg-teal-50/40 p-4 text-sm muted flex items-center gap-2"
                  role="status"
                >
                  <Sparkles size={15} className="text-teal-700" />
                  INKY is preparing classroom ideas…
                </div>
              </>
            )}
            <div ref={threadEndRef} />
          </div>
        )}

        {error && (
          <p className="state-box" role="alert">
            {error}
          </p>
        )}

        <form className="space-y-4 border-t pt-4" onSubmit={handleSubmit}>
          <div className="form-grid">
            <Field label="Reply language">
              {(id) => (
                <select
                  id={id}
                  value={language}
                  disabled={busy}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {['English', 'Malayalam', 'Hindi'].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <Field
            label={
              messages.length > 0
                ? 'Ask a follow-up question'
                : 'Describe the classroom situation'
            }
          >
            {(id) => (
              <textarea
                id={id}
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={1000}
                rows={3}
                required
                disabled={busy}
                placeholder={
                  messages.length > 0
                    ? 'Ask INKY to adapt an idea for younger toddlers, simplify materials, or suggest a rhyme…'
                    : 'Describe the routine, play goal or classroom situation…'
                }
              />
            )}
          </Field>
          <p className="text-sm muted">
            Describe the teaching situation without children’s names or private family information.
            Review suggestions before using them.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              isLoading={busy}
              leftIcon={<Send size={15} />}
              disabled={question.trim().length < 5 || !!convertingKey}
            >
              {messages.length > 0 ? 'Ask follow-up' : 'Ask INKY'}
            </Button>
            <span className="text-xs muted">Tip: Press Ctrl + Enter to send</span>
          </div>
        </form>
      </div>
    </Panel>
  );
}
