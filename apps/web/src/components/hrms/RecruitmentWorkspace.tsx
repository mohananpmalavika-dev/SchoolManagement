'use client';
import { useState } from 'react';
import { Panel, StatusPill, EmptyState } from '@/components/WorkspaceUI';
import { Button } from '@/components/ui';
import type { HrField, HrForm } from './HRMSForm';

const options = (values: string[]) =>
  values.map((value) => ({ value, label: value.replaceAll('_', ' ') }));
const field = (key: string, label: string, type = 'text', required = true): HrField => ({
  key,
  label,
  type,
  required,
});
const pick = (key: string, label: string, values: { value: string; label: string }[]): HrField => ({
  key,
  label,
  options: values,
  required: true,
});
const stages: Record<string, string[]> = {
  APPLIED: ['SCREENING', 'REJECTED', 'WITHDRAWN'],
  SCREENING: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
  SHORTLISTED: ['REJECTED', 'WITHDRAWN'],
  INTERVIEWING: ['SELECTED', 'REJECTED', 'WITHDRAWN'],
  SELECTED: ['REJECTED', 'WITHDRAWN'],
};
const localInput = (date: string) => {
  const value = new Date(date);
  return new Date(+value - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export function RecruitmentWorkspace({
  data,
  departments,
  busy,
  open,
  offer,
  joining,
}: {
  data: { vacancies: any[]; candidates: any[]; interviewers: any[] };
  departments: any[];
  busy: boolean;
  open: (config: HrForm) => void;
  offer: (candidate: any) => void;
  joining: () => void;
}) {
  const [search, setSearch] = useState(''),
    [vacancyId, setVacancyId] = useState(''),
    [stage, setStage] = useState('');
  const vacancyForm = (v?: any): HrForm => ({
    title: v ? 'Edit vacancy' : 'New vacancy',
    path: 'recruitment/vacancies' + (v ? '/' + v.id : ''),
    method: v ? 'patch' : 'post',
    initial: v
      ? { ...v, closingDate: v.closingDate?.slice(0, 10) || '' }
      : { status: 'DRAFT', positions: 1 },
    description:
      'Open the vacancy to accept applications. Closing a vacancy stops new applications and offers; interviews already in progress can still be resolved.',
    fields: [
      field('title', 'Job title'),
      pick(
        'departmentId',
        'HR department',
        departments.map((d) => ({ value: d.id, label: d.name }))
      ),
      field('description', 'Job description', 'textarea'),
      { ...field('positions', 'Positions', 'number'), min: 1, max: 1000 },
      pick('status', 'Vacancy status', options(['DRAFT', 'OPEN', 'CLOSED'])),
      field('closingDate', 'Closing date', 'date', false),
    ],
  });
  const candidateForm = (c?: any): HrForm => ({
    title: c ? 'Edit candidate' : 'Add candidate',
    path: 'recruitment/candidates' + (c ? '/' + c.id : ''),
    method: c ? 'patch' : 'post',
    initial: c || { vacancyId, source: 'DIRECT' },
    fields: [
      pick(
        'vacancyId',
        'Vacancy',
        data.vacancies
          .filter((v) => (c ? v.id === c.vacancyId : v.status === 'OPEN'))
          .map((v) => ({ value: v.id, label: v.title }))
      ),
      field('name', 'Candidate name'),
      field('email', 'Candidate email', 'email'),
      field('phone', 'Candidate phone'),
      pick(
        'source',
        'Application source',
        options(['DIRECT', 'REFERRAL', 'JOB_BOARD', 'AGENCY', 'OTHER'])
      ),
      field('resumeUrl', 'Resume link (HTTPS)', 'url', false),
      field('notes', 'Application notes', 'textarea', false),
    ],
  });
  const interviewForm = (c: any, i?: any): HrForm => ({
    title: i ? 'Reschedule interview' : 'Schedule interview',
    path: `recruitment/candidates/${c.id}/interviews` + (i ? '/' + i.id : ''),
    method: i ? 'patch' : 'post',
    initial: i ? { ...i, startsAt: localInput(i.startsAt), endsAt: localInput(i.endsAt) } : {},
    description: `Times use your device timezone (${Intl.DateTimeFormat().resolvedOptions().timeZone}). Candidate and interviewer availability are checked when saving.`,
    fields: [
      field('round', 'Interview round'),
      pick(
        'interviewerId',
        'Interviewer',
        data.interviewers.map((p) => ({ value: p.id, label: `${p.firstName} ${p.lastName}` }))
      ),
      field('startsAt', 'Interview start', 'datetime-local'),
      field('endsAt', 'Interview end', 'datetime-local'),
      field('location', 'Room or meeting link'),
    ],
    prepare: (v) => ({
      round: v.round,
      interviewerId: v.interviewerId,
      startsAt: new Date(v.startsAt).toISOString(),
      endsAt: new Date(v.endsAt).toISOString(),
      location: v.location,
    }),
  });
  const candidates = data.candidates.filter(
    (c) =>
      (!vacancyId || c.vacancyId === vacancyId) &&
      (!stage || c.status === stage) &&
      `${c.name} ${c.email} ${c.vacancy.title}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-4">
      <Panel
        title="Recruitment vacancies"
        subtitle="Vacancy → screening → shortlist → interview → selection → offer → joining"
      >
        <div className="panel-body space-y-3">
          <Button disabled={busy || !departments.length} onClick={() => open(vacancyForm())}>
            New vacancy
          </Button>
          {!departments.length && (
            <p className="muted">Create an HR department in HR setup first.</p>
          )}
          {!data.vacancies.length && (
            <EmptyState
              title="No recruitment vacancies"
              description="Create a vacancy and open it to begin accepting candidates."
            />
          )}
          {data.vacancies.map((v) => (
            <article key={v.id} className="border rounded-xl p-4 space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                <h3 className="font-semibold">{v.title}</h3>
                <StatusPill value={v.status} />
              </div>
              <p className="whitespace-pre-wrap break-words">{v.description}</p>
              <p className="muted">
                {departments.find((d) => d.id === v.departmentId)?.name} · {v.positions} position(s)
                · {data.candidates.filter((c) => c.vacancyId === v.id).length} application(s)
                {v.closingDate ? ` · Closes ${v.closingDate.slice(0, 10)}` : ''}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => open(vacancyForm(v))}
              >
                Edit vacancy {v.title}
              </Button>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Candidate pipeline">
        <div className="panel-body space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={busy || !data.vacancies.some((v) => v.status === 'OPEN')}
              onClick={() => open(candidateForm())}
            >
              Add candidate
            </Button>
            <Button variant="outline" onClick={joining}>
              View offers and joining
            </Button>
          </div>
          <div className="form-grid">
            <label className="field">
              Search candidates
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email or vacancy"
              />
            </label>
            <label className="field">
              Filter vacancy
              <select value={vacancyId} onChange={(e) => setVacancyId(e.target.value)}>
                <option value="">All vacancies</option>
                {data.vacancies.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Filter stage
              <select value={stage} onChange={(e) => setStage(e.target.value)}>
                <option value="">All stages</option>
                {options([
                  'APPLIED',
                  'SCREENING',
                  'SHORTLISTED',
                  'INTERVIEWING',
                  'SELECTED',
                  'OFFERED',
                  'HIRED',
                  'REJECTED',
                  'WITHDRAWN',
                ]).map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="muted">{candidates.length} matching candidate(s)</p>
          {!candidates.length && (
            <EmptyState
              title="No matching candidates"
              description="Add an application or adjust the filters."
            />
          )}
          {candidates.map((c) => (
            <article key={c.id} className="border rounded-xl p-4 space-y-3 break-words">
              <div className="flex flex-wrap gap-2 items-center">
                <h3 className="font-semibold">{c.name}</h3>
                <StatusPill value={c.status} />
              </div>
              <p>
                {c.vacancy.title} · {c.email} · {c.phone}
              </p>
              <p className="muted">Source: {c.source.replaceAll('_', ' ')}</p>
              {c.resumeUrl && (
                <a
                  className="underline"
                  href={c.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View resume for {c.name}
                </a>
              )}
              {c.notes && <p className="whitespace-pre-wrap">{c.notes}</p>}
              {c.decisionReason && <p>Decision: {c.decisionReason}</p>}
              <div className="flex flex-wrap gap-2">
                {stages[c.status] && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => open(candidateForm(c))}
                    >
                      Edit candidate {c.name}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        open({
                          title: 'Candidate decision',
                          path: `recruitment/candidates/${c.id}/stage`,
                          method: 'patch',
                          description:
                            'Selection requires a recommended completed interview and no unresolved interview rounds.',
                          fields: [
                            pick('status', 'Next stage', options(stages[c.status])),
                            field('reason', 'Decision reason', 'textarea'),
                          ],
                        })
                      }
                    >
                      Update stage {c.name}
                    </Button>
                  </>
                )}
                {['SHORTLISTED', 'INTERVIEWING'].includes(c.status) && (
                  <Button size="sm" disabled={busy} onClick={() => open(interviewForm(c))}>
                    Schedule interview {c.name}
                  </Button>
                )}
                {c.status === 'SELECTED' && (
                  <Button size="sm" disabled={busy} onClick={() => offer(c)}>
                    Create offer {c.name}
                  </Button>
                )}
                {c.offer && (
                  <Button size="sm" variant="outline" onClick={joining}>
                    View {c.offer.status.toLowerCase()} offer
                  </Button>
                )}
              </div>
              {c.interviews.map((i: any) => (
                <div key={i.id} className="border rounded-lg p-3 space-y-2">
                  <p className="font-semibold">
                    {i.round} <StatusPill value={i.status} />
                  </p>
                  <p>
                    {i.interviewerName} · {new Date(i.startsAt).toLocaleString()} –{' '}
                    {new Date(i.endsAt).toLocaleTimeString()} · {i.location}
                  </p>
                  {i.feedback && (
                    <p className="whitespace-pre-wrap">
                      {i.result ? `${i.result.replaceAll('_', ' ')} · ${i.rating}/5 · ` : ''}
                      {i.feedback}
                    </p>
                  )}
                  {i.status === 'SCHEDULED' && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => open(interviewForm(c, i))}
                      >
                        Reschedule {i.round}
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          open({
                            title: 'Interview outcome',
                            path: `recruitment/interviews/${i.id}/review`,
                            method: 'patch',
                            initial: { status: 'COMPLETED' },
                            fields: [
                              pick(
                                'status',
                                'Interview status',
                                options(['COMPLETED', 'NO_SHOW', 'CANCELLED'])
                              ),
                              {
                                ...pick(
                                  'result',
                                  'Recommendation',
                                  options(['RECOMMENDED', 'HOLD', 'NOT_RECOMMENDED'])
                                ),
                                when: { field: 'status', equals: 'COMPLETED' },
                              },
                              {
                                ...field('rating', 'Rating (1–5)', 'number'),
                                min: 1,
                                max: 5,
                                when: { field: 'status', equals: 'COMPLETED' },
                              },
                              field('feedback', 'Feedback or cancellation reason', 'textarea'),
                            ],
                            prepare: (v) => ({
                              status: v.status,
                              feedback: v.feedback,
                              ...(v.status === 'COMPLETED'
                                ? { result: v.result, rating: v.rating }
                                : {}),
                            }),
                          })
                        }
                      >
                        Record outcome {i.round}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
