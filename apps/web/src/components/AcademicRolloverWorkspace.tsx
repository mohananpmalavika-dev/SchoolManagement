'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { dateLabel, messageFor } from '@/lib/workspace';
import { EmptyState, PageHeading, Panel } from './WorkspaceUI';
import { Button } from './ui';

type Action = 'PROMOTE' | 'RETAIN' | 'GRADUATE';
type Allocation = { action: Action; classId: string; streamId: string };
type Year = { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean };
type SchoolClass = { id: string; name: string; schoolId: string; school?: { name: string } };
type Student = { id: string; firstName: string; lastName: string; admissionNumber: string; currentClassId: string | null; currentStreamId: string | null };
type Summary = { total: number; promoted: number; retained: number; graduated: number };
type Options = {
  years: Year[]; classes: SchoolClass[];
  streams: { id: string; classId: string; name: string; capacity: number }[];
  students: Student[];
  history: { id: string; sourceYearName: string; targetYearName: string; completedAt: string; summary: Summary }[];
};
type Plan = { sourceYearId: string; targetYearId: string; decisions: { studentId: string; action: Action; classId?: string; streamId?: string }[] };
type Review = { sourceYear: Year; targetYear: Year; previewToken: string; summary: Summary;
  rows: { studentId: string; name: string; admissionNumber: string; action: Action; sourceClassName: string; targetClassName: string | null; targetStreamName: string | null }[] };
const managers = ['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN'];
const empty: Options = { years: [], classes: [], streams: [], students: [], history: [] };
const defaultAllocation: Allocation = { action: 'PROMOTE', classId: '', streamId: '' };

export function AcademicRolloverWorkspace() {
  const { user } = useAuth();
  const allowed = managers.includes(user?.role || '');
  const [options, setOptions] = useState<Options>(empty);
  const [sourceYearId, setSource] = useState(''), [targetYearId, setTarget] = useState('');
  const [mappings, setMappings] = useState<Record<string, Allocation>>({});
  const [overrides, setOverrides] = useState<Record<string, Allocation>>({});
  const [search, setSearch] = useState(''), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [review, setReview] = useState<Review | null>(null), [reviewedPlan, setReviewedPlan] = useState<Plan | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await apiClient.get<Options>('/academic-rollover/options');
      setOptions(data); setSource(data.years.find(year => year.isCurrent)?.id || ''); setTarget('');
      setMappings({}); setOverrides({}); setReview(null); setReviewedPlan(null); setConfirmed(false);
    } catch (err) { setError(messageFor(err)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (allowed) void load(); }, [allowed, load]);

  const classById = new Map(options.classes.map(cls => [cls.id, cls]));
  const groups = new Map<string, Student[]>();
  for (const student of options.students) {
    const key = student.currentClassId || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(student);
  }
  function allocation(student: Student) { return overrides[student.id] || mappings[student.currentClassId || ''] || defaultAllocation; }
  function invalidate() { setReview(null); setReviewedPlan(null); setConfirmed(false); setNotice(''); }
  function changeAllocation(value: Allocation, action: Action, currentClassId: string): Allocation {
    return { ...value, action, classId: action === 'RETAIN' ? currentClassId : '', streamId: '' };
  }
  function allocationFields(value: Allocation, currentClassId: string, prefix: string, update: (next: Allocation) => void) {
    const sourceClass = classById.get(currentClassId);
    const candidates = options.classes.filter(cls => cls.schoolId === sourceClass?.schoolId &&
      (value.action === 'RETAIN' ? cls.id === currentClassId : cls.id !== currentClassId));
    return <div className="form-grid">
      <div className="field"><label htmlFor={prefix + '-action'}>Year-end decision</label><select id={prefix + '-action'} value={value.action}
        onChange={event => update(changeAllocation(value, event.target.value as Action, currentClassId))}>
        <option value="PROMOTE">Promote</option><option value="RETAIN">Retain in current class</option><option value="GRADUATE">Graduate</option>
      </select></div>
      {value.action !== 'GRADUATE' && <>
        <div className="field"><label htmlFor={prefix + '-class'}>Target class</label><select id={prefix + '-class'} value={value.classId}
          onChange={event => update({ ...value, classId: event.target.value, streamId: '' })}>
          <option value="">Choose a class</option>{candidates.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
        </select></div>
        <div className="field"><label htmlFor={prefix + '-stream'}>Target stream / section</label><select id={prefix + '-stream'} value={value.streamId}
          onChange={event => update({ ...value, streamId: event.target.value })}>
          <option value="">No stream assigned</option>{options.streams.filter(stream => stream.classId === value.classId).map(stream =>
            <option key={stream.id} value={stream.id}>{stream.name} (capacity {stream.capacity})</option>)}
        </select></div>
      </>}
    </div>;
  }

  async function preview() {
    invalidate(); setError('');
    if (!sourceYearId || !targetYearId) { setError('Choose the source and target academic years.'); return; }
    const decisions: Plan['decisions'] = [];
    for (const student of options.students) {
      const selected = allocation(student);
      if (selected.action !== 'GRADUATE' && !selected.classId) {
        setError('Choose a target class for ' + student.admissionNumber + '. Apply class mappings or add an individual exception.'); return;
      }
      decisions.push({ studentId: student.id, action: selected.action,
        ...(selected.action !== 'GRADUATE' ? { classId: selected.classId, ...(selected.streamId ? { streamId: selected.streamId } : {}) } : {}) });
    }
    const plan = { sourceYearId, targetYearId, decisions };
    setBusy(true);
    try { const { data } = await apiClient.post<Review>('/academic-rollover/preview', plan, { timeout: 60000 }); setReview(data); setReviewedPlan(plan); }
    catch (err) { setError(messageFor(err)); } finally { setBusy(false); }
  }
  async function complete() {
    if (!review || !reviewedPlan || !confirmed || busy) return;
    setBusy(true); setError('');
    try {
      const { data } = await apiClient.post<{ summary: Summary; alreadyCompleted: boolean }>('/academic-rollover/complete',
        { ...reviewedPlan, previewToken: review.previewToken }, { timeout: 90000 });
      setNotice(`${data.alreadyCompleted ? 'Rollover was already completed.' : 'Academic-year rollover completed.'} ${data.summary.promoted} promoted, ${data.summary.retained} retained, ${data.summary.graduated} graduated. Select the new current term in Academic setup.`);
      await load();
    } catch (err) { setError(messageFor(err)); setConfirmed(false); } finally { setBusy(false); }
  }

  if (user && !allowed) return <EmptyState title="School management access required" description="A school owner, principal or school administrator can complete year-end promotion." />;
  return <>
    <PageHeading eyebrow="ACADEMIC YEAR-END" title="Bulk promotion & year rollover"
      description="Review every active student across your school campuses, preserve enrollment history, and open the next academic year."
      actions={<><Link className="panel-link" href="/school/academics">Academic setup</Link><Button variant="outline" size="sm" disabled={busy || loading} onClick={() => void load()} leftIcon={<RefreshCw size={15} />}>Refresh roster</Button></>} />
    {error && <div className="state-box" role="alert">{error}</div>}
    {notice && <div className="state-box success" role="status">{notice}</div>}
    {loading ? <div className="skeleton h-64" aria-label="Loading promotion roster" /> : <div className="content-stack">
      <Panel title="1. Choose academic years" subtitle="Create the target academic year in Academic setup first. The source must be the current year.">
        <div className="panel-body form-grid">
          <div className="field"><label htmlFor="rollover-source">Source academic year</label><select id="rollover-source" disabled={busy} value={sourceYearId}
            onChange={event => { setSource(event.target.value); invalidate(); }}><option value="">Choose the current year</option>{options.years.filter(year => year.isCurrent).map(year => <option key={year.id} value={year.id}>{year.name}</option>)}</select></div>
          <div className="field"><label htmlFor="rollover-target">Target academic year</label><select id="rollover-target" disabled={busy} value={targetYearId}
            onChange={event => { setTarget(event.target.value); invalidate(); }}><option value="">Choose the next year</option>{options.years.filter(year => !year.isCurrent && new Date(year.startDate) > new Date(options.years.find(source => source.id === sourceYearId)?.endDate || '9999-12-31')).map(year => <option key={year.id} value={year.id}>{year.name}</option>)}</select></div>
        </div>
      </Panel>
      {options.students.length ? <>
        <Panel title="2. Apply class mappings" subtitle={`${options.students.length} active students. Choose each class destination, then review individual exceptions.`}>
          <fieldset className="panel-body space-y-5" disabled={busy}>
            {Array.from(groups.entries()).map(([classId, students]) => <div className="panel p-5" key={classId || 'unassigned'}>
              <h3 className="font-semibold mb-3">{classById.get(classId)?.name || 'Unassigned class'}{classById.get(classId)?.school && ` / ${classById.get(classId)!.school!.name}`} ({students.length} students)</h3>
              {classId ? allocationFields(mappings[classId] || defaultAllocation, classId, 'mapping-' + classId,
                next => { setMappings(current => ({ ...current, [classId]: next })); invalidate(); }) : <p className="muted">Assign these students a current class in Students before rollover.</p>}
            </div>)}
          </fieldset>
        </Panel>
        <Panel title="3. Review student exceptions" subtitle="Class mappings apply to everyone unless an individual exception is selected. Search only filters this view; every student remains in the rollover.">
          <fieldset className="panel-body space-y-4" disabled={busy}>
            <div className="field"><label htmlFor="promotion-search">Search students</label><input id="promotion-search" type="search" value={search} onChange={event => setSearch(event.target.value)} /></div>
            <div className="content-stack max-h-[36rem] overflow-auto">
              {options.students.filter(student => `${student.firstName} ${student.lastName} ${student.admissionNumber}`.toLowerCase().includes(search.toLowerCase())).map(student =>
                <div key={student.id} className="panel p-4">
                  <div className="flex flex-wrap justify-between gap-3 mb-3"><p><strong>{student.firstName} {student.lastName}</strong> / {student.admissionNumber}<br /><span className="muted text-sm">{classById.get(student.currentClassId || '')?.name || 'Unassigned'} / {allocation(student).action.toLowerCase()}{allocation(student).classId && ` to ${classById.get(allocation(student).classId)?.name || ''}`}</span></p>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!overrides[student.id]} onChange={event => {
                      if (event.target.checked) setOverrides(current => ({ ...current, [student.id]: { ...allocation(student) } }));
                      else setOverrides(current => { const next = { ...current }; delete next[student.id]; return next; });
                      invalidate();
                    }} />Individual exception for {student.admissionNumber}</label>
                  </div>
                  {overrides[student.id] && allocationFields(overrides[student.id], student.currentClassId || '', 'student-' + student.id,
                    next => { setOverrides(current => ({ ...current, [student.id]: next })); invalidate(); })}
                </div>)}
            </div>
            <Button disabled={busy || !sourceYearId || !targetYearId} isLoading={busy && !review} onClick={() => void preview()} leftIcon={<ArrowRight size={16} />}>Preview promotion plan</Button>
          </fieldset>
        </Panel>
      </> : <EmptyState title="No active students to promote" description="Add or activate students before using bulk year-end promotion." />}
      {review && <Panel title="4. Confirm the reviewed rollover" subtitle={`${review.sourceYear.name} to ${review.targetYear.name}`}>
        <div className="panel-body space-y-5">
          <p className="font-semibold">{review.summary.total} students: {review.summary.promoted} promoted, {review.summary.retained} retained, {review.summary.graduated} graduated.</p>
          <p className="muted text-sm">The target year becomes current. Graduates leave the active class roster. Current term selection is cleared; choose the new term in Academic setup after rollover. Existing marks, fees, attendance and enrollment records remain saved.</p>
          <div className="overflow-auto max-h-96"><table className="w-full text-sm"><thead><tr><th scope="col" className="text-left p-2">Student</th><th scope="col" className="text-left p-2">From class</th><th scope="col" className="text-left p-2">Decision</th><th scope="col" className="text-left p-2">To class / section</th></tr></thead><tbody>{review.rows.map(row => <tr key={row.studentId}><td className="p-2">{row.name}<br /><span className="muted">{row.admissionNumber}</span></td><td className="p-2">{row.sourceClassName}</td><td className="p-2">{row.action.toLowerCase()}</td><td className="p-2">{row.targetClassName || 'Graduated'}{row.targetStreamName && ` / ${row.targetStreamName}`}</td></tr>)}</tbody></table></div>
          <label className="flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" disabled={busy} checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />I reviewed every promotion, retention and graduation decision and am ready to open {review.targetYear.name}.</label>
          <Button disabled={!confirmed || busy} isLoading={busy} onClick={() => void complete()}>Complete academic-year rollover</Button>
        </div>
      </Panel>}
      <Panel title="Completed rollovers"><div className="panel-body space-y-4">{options.history.length ? options.history.map(item => <article className="panel p-4" key={item.id}><h3 className="font-semibold">{item.sourceYearName} to {item.targetYearName}</h3><p className="text-sm muted mt-2">{dateLabel(item.completedAt)} / {item.summary.promoted} promoted, {item.summary.retained} retained, {item.summary.graduated} graduated</p></article>) : <p className="muted">Completed year-end rollovers will appear here.</p>}</div></Panel>
    </div>}
  </>;
}
