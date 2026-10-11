'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Download, FileCheck, Printer, Sparkles } from 'lucide-react';
import type { AIQuestionPaper, AIRemarkResult, GeneratedRemark, TeacherAIOptions, TeacherAIRoster, TeachingLanguage } from '@krypton/types';
import { apiClient } from '@/lib/api-client';
import { exportCsv, messageFor } from '@/lib/workspace';
import { predictiveAnalyticsRoles, teacherRoles } from '@/lib/session';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { EmptyState, PageHeading, Panel } from './WorkspaceUI';
import { Button } from './ui';

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
function paperText(paper: AIQuestionPaper, key = false) {
  return [paper.title, key ? 'TEACHER ANSWER KEY' : paper.instructions, '', ...paper.questions.map((q, i) => key ?
    `${i + 1}. ${q.answer}\n${q.explanation}\n` : `${i + 1}. ${q.question} (${q.marks} marks)\n${q.options.map((o, n) => `${String.fromCharCode(65 + n)}. ${o}`).join('\n')}\n`)].join('\n');
}
const languages: TeachingLanguage[] = ['English', 'Malayalam', 'Swahili'];
export function TeacherAIStudio() {
  return <ProtectedRoute allowedRoles={[...teacherRoles, ...predictiveAnalyticsRoles]}><TeachingTools /></ProtectedRoute>;
}

function TeachingTools() {
  const { user } = useAuth();
  const [options, setOptions] = useState<TeacherAIOptions | null>(null);
  const [roster, setRoster] = useState<TeacherAIRoster | null>(null);
  const [classId, setClassId] = useState(''); const [termId, setTermId] = useState('');
  const [language, setLanguage] = useState<TeachingLanguage>('English');
  const [tab, setTab] = useState<'remarks' | 'quiz'>('remarks');
  const [selected, setSelected] = useState<string[]>([]);
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, GeneratedRemark>>({});
  const [page, setPage] = useState(1); const [rosterLoading, setRosterLoading] = useState(false);
  const [busy, setBusy] = useState(false); const [saving, setSaving] = useState('');
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [paper, setPaper] = useState<AIQuestionPaper | null>(null); const [showAnswers, setShowAnswers] = useState(false);
  const [subject, setSubject] = useState(''); const [chapter, setChapter] = useState(''); const [sourceText, setSourceText] = useState('');
  const [format, setFormat] = useState('QUIZ'); const [questionType, setQuestionType] = useState('MCQ'); const [difficulty, setDifficulty] = useState('STANDARD');
  const generation = useRef<AbortController | null>(null);
  const optionsRequest = useRef<AbortController | null>(null);
  const loadOptions = useCallback(async () => {
    optionsRequest.current?.abort(); const controller = new AbortController(); optionsRequest.current = controller;
    setError('');
    try {
      const { data } = await apiClient.get<TeacherAIOptions>('/teacher-ai/options', { signal: controller.signal });
      if (!controller.signal.aborted) { setOptions(data); setClassId(data.classes[0]?.id ?? ''); setTermId(data.terms.find(t => t.isCurrent)?.id ?? data.terms[0]?.id ?? ''); }
    } catch (err) { if (!controller.signal.aborted) setError(messageFor(err)); }
  }, []);
  useEffect(() => { void loadOptions(); return () => { optionsRequest.current?.abort(); generation.current?.abort(); }; }, [loadOptions]);
  const loadRoster = useCallback(async (signal?: AbortSignal) => {
    if (!classId || !termId) return;
    setRosterLoading(true);
    try {
      const { data } = await apiClient.get<TeacherAIRoster>('/teacher-ai/roster', { params: { classId, termId }, signal });
      if (!signal?.aborted) { setRoster(data); setSelected(data.students.map(s => s.id)); }
    } catch (err) { if (!signal?.aborted) setError(messageFor(err)); }
    finally { if (!signal?.aborted) setRosterLoading(false); }
  }, [classId, termId]);
  useEffect(() => {
    const controller = new AbortController(); setRoster(null); setDrafts({}); setObservations({}); setPaper(null); setSelected([]); setPage(1); setError(''); setNotice('');
    void loadRoster(controller.signal); return () => controller.abort();
  }, [loadRoster]);
  const configured = options?.status.configured ?? false;
  const generateRemarks = async () => {
    if (!selected.length) return;
    const controller = new AbortController(); generation.current = controller; setBusy(true); setError(''); let completed = 0;
    try {
      for (let i = 0; i < selected.length; i += 10) {
        if (controller.signal.aborted) break;
        setNotice(`Generating remarks: ${completed} of ${selected.length} students complete…`);
        const { data } = await apiClient.post<AIRemarkResult>('/teacher-ai/remarks', { classId, termId, language,
          students: selected.slice(i, i + 10).map(studentId => ({ studentId, behaviourObservation: observations[studentId] || undefined })) },
        { timeout: 75000, signal: controller.signal });
        if (controller.signal.aborted) break;
        setDrafts(current => ({ ...current, ...Object.fromEntries(data.remarks.map(r => [r.studentId, r])) })); completed += data.remarks.length;
      }
      if (!controller.signal.aborted) setNotice(`${completed} AI remarks ready. Review and edit each draft before saving.`);
    } catch (err) { if (!controller.signal.aborted) { setError(messageFor(err)); setNotice(`${completed} remarks generated before the interruption. Completed drafts are available below.`); } }
    finally { setBusy(false); }
  };
  const prepare = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      await apiClient.post('/teacher-ai/report-cards', { classId, termId }, { timeout: 75000 });
      await loadRoster(); setNotice('Draft report-card preparation finished. Students with recorded marks can have draft reports; existing reports are preserved.');
    } catch (err) { setError(messageFor(err)); } finally { setBusy(false); }
  };
  const save = async (id: string) => {
    const student = roster?.students.find(s => s.id === id), draft = drafts[id];
    if (!student?.reportCard || !draft) return;
    setSaving(id); setError('');
    try {
      const { data } = await apiClient.post<{ updatedAt: string; comment: string }>('/teacher-ai/remarks/save', {
        classId, termId, studentId: id, reportCardId: student.reportCard.id, expectedUpdatedAt: student.reportCard.updatedAt, remark: draft.text,
      });
      setRoster(current => current ? { ...current, students: current.students.map(s => s.id === id && s.reportCard ? { ...s, reportCard: { ...s.reportCard, updatedAt: data.updatedAt, comment: data.comment } } : s) } : current);
      setNotice(`Reviewed remark saved to ${student.name}'s draft report card.`);
    } catch (err) { setError(messageFor(err)); } finally { setSaving(''); }
  };
  const generateQuiz = async () => {
    const controller = new AbortController(); generation.current = controller; setBusy(true); setError(''); setNotice(''); setPaper(null); setShowAnswers(false);
    try {
      const { data } = await apiClient.post<AIQuestionPaper>('/teacher-ai/quiz', { classId, subject: subject.trim(), chapter: chapter.trim(), sourceText: sourceText.trim(), language, format, questionType, difficulty }, { timeout: 75000, signal: controller.signal });
      if (!controller.signal.aborted) { setPaper(data); setNotice('Ten questions are ready. Check the questions and answer key before using them with students.'); }
    } catch (err) { if (!controller.signal.aborted) setError(messageFor(err)); } finally { setBusy(false); }
  };
  const exportRemarks = () => exportCsv('reviewed-student-remarks', [
    { key: 'name', label: 'Student' }, { key: 'admission', label: 'Admission number' }, { key: 'remark', label: 'AI-assisted draft remark' }, { key: 'evidence', label: 'Evidence' },
  ], (roster?.students ?? []).filter(s => drafts[s.id]).map(s => ({ name: s.name, admission: s.admissionNumber, remark: drafts[s.id].text, evidence: drafts[s.id].evidence.join(' | ') })));
  const students = roster?.students ?? [], pages = Math.max(1, Math.ceil(students.length / 8)), currentPage = Math.min(page, pages);
  const visible = students.slice((currentPage - 1) * 8, currentPage * 8);
  const base = user && predictiveAnalyticsRoles.includes(user.role) ? '/school' : '/teacher';
  return <div className="ai-studio"><div className="ai-screen content-stack">
    <PageHeading eyebrow="MORE TIME FOR TEACHING" title="AI teaching studio" description="Thoughtful report-card remarks and classroom-ready questions, drafted from your evidence." />
    {error && <div className="state-box" role="alert">{error}{!options && <Button variant="outline" size="sm" onClick={() => void loadOptions()}>Try again</Button>}</div>}
    {notice && <div className="state-box success" role="status">{notice}</div>}
    {!options ? !error && <div className="panel panel-body" role="status">Loading your teaching workspace…</div> : <>
      <div className="analytics-intro"><Sparkles size={25} /><div><strong>{configured ? 'AI drafts. Your professional judgement.' : 'AI teaching tools need configuration'}</strong><p>{options.status.message}</p><small>Use classroom observations and leave out health or family details. Check every draft before saving or sharing.</small></div></div>
      {!options.classes.length ? <EmptyState title="No assigned classes" description="Ask your administrator to link your staff account and timetable assignments." /> : <>
        <div className="ai-controls panel panel-body"><label className="field">Class<select aria-label="Class" value={classId} disabled={busy || !!saving} onChange={e => setClassId(e.target.value)}>{options.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="field">Report-card term<select aria-label="Report-card term" value={termId} disabled={busy || !!saving} onChange={e => setTermId(e.target.value)}><option value="">Select term</option>{options.terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <label className="field">Output language<select aria-label="Output language" value={language} disabled={busy} onChange={e => setLanguage(e.target.value as TeachingLanguage)}>{languages.map(l => <option key={l}>{l}</option>)}</select></label></div>
        <div className="section-tabs" role="group" aria-label="Teaching tools"><button className={tab === 'remarks' ? 'selected' : ''} aria-pressed={tab === 'remarks'} disabled={busy} onClick={() => setTab('remarks')}><FileCheck size={16} className="inline mr-2" />Student remarks</button><button className={tab === 'quiz' ? 'selected' : ''} aria-pressed={tab === 'quiz'} disabled={busy} onClick={() => setTab('quiz')}><BookOpen size={16} className="inline mr-2" />Quiz & question paper maker</button></div>
        {tab === 'remarks' ? <Panel title="Professional student remarks" subtitle="Marks and attendance come from saved records. Add a classroom observation when useful.">
          <div className="panel-body ai-action-row"><Button size="sm" isLoading={busy} disabled={!configured || !selected.length || rosterLoading || !!saving} leftIcon={<Sparkles size={15} />} onClick={() => void generateRemarks()}>Generate selected remarks ({selected.length})</Button>
            <Button size="sm" variant="outline" disabled={busy || !termId || !classId || rosterLoading || !!saving} onClick={() => void prepare()}>Prepare draft report cards</Button>
            <Button size="sm" variant="outline" leftIcon={<Download size={15} />} disabled={!Object.keys(drafts).length || busy} onClick={exportRemarks}>Export drafts</Button>
            <Button size="sm" variant="ghost" disabled={busy || rosterLoading} onClick={() => { setError(''); void loadRoster(); }}>Reload roster</Button></div>
          {rosterLoading ? <div className="panel-body" role="status">Loading class evidence…</div> : !termId ? <EmptyState title="Select a term" description="Choose a term to load saved marks and attendance." /> : !students.length ? <EmptyState title="No active students in this class" /> : <>
            <div className="ai-selection"><label><input type="checkbox" aria-label="Select all students" checked={selected.length === students.length} disabled={busy} onChange={e => setSelected(e.target.checked ? students.map(s => s.id) : [])} /> Select all {students.length} students</label><span>Saved reports stay in the normal approval workflow.</span></div>
            <div className="ai-remark-list">{visible.map(student => <section className="ai-remark" key={student.id}>
              <div className="ai-remark-heading"><label><input type="checkbox" checked={selected.includes(student.id)} aria-label={`Select ${student.name}`} disabled={busy} onChange={e => setSelected(current => e.target.checked ? [...current, student.id] : current.filter(id => id !== student.id))} /><strong>{student.name}</strong></label><span className="pill neutral">{student.reportCard?.status.replaceAll('_', ' ').toLowerCase() ?? 'No report card'}</span></div>
              <p className="muted ai-evidence-summary">{student.admissionNumber} · Term average: {student.average === null ? 'No marks' : `${student.average}%`} · Recorded attendance: {student.attendanceRate === null ? 'No records' : `${student.attendanceRate}% across ${student.attendanceDays} days`}</p>
              <div className="ai-remark-fields"><label className="field">Classroom behaviour observation (optional)<textarea aria-label={`Behaviour observation for ${student.name}`} maxLength={800} value={observations[student.id] || ''} disabled={busy} placeholder="For example: participates in group work and is building confidence when presenting." onChange={e => setObservations(current => ({ ...current, [student.id]: e.target.value }))} /></label>
                <label className="field">{drafts[student.id] ? 'AI draft — edit before saving' : 'Current report-card remark'}<textarea aria-label={`Remark for ${student.name}`} maxLength={2000} disabled={busy || !drafts[student.id] || saving === student.id} value={drafts[student.id]?.text ?? student.reportCard?.comment ?? ''} placeholder="Generate a draft from this student's evidence." onChange={e => setDrafts(current => ({ ...current, [student.id]: { ...current[student.id], text: e.target.value } }))} /></label></div>
              {drafts[student.id] && <><ul className="ai-source-list">{drafts[student.id].evidence.map((e, i) => <li key={i}>{e}</li>)}</ul><div className="ai-action-row"><Button size="sm" isLoading={saving === student.id} disabled={busy || !!saving || student.reportCard?.status !== 'DRAFT' || drafts[student.id].text.trim().length < 10} onClick={() => void save(student.id)}>Save reviewed remark</Button>{student.reportCard?.status !== 'DRAFT' && <span className="muted">{student.reportCard ? 'Approved or published reports are locked.' : 'Prepare a draft report card first.'}</span>}</div></>}
            </section>)}</div>
            <div className="table-pagination"><span>{(currentPage - 1) * 8 + 1}–{Math.min(currentPage * 8, students.length)} of {students.length} students</span><div className="flex gap-3"><Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div>
          </>}
        </Panel> : <Panel title="Quiz & question paper maker" subtitle="Paste chapter or syllabus text. AI will draft ten questions and a separate teacher answer key.">
          <form className="panel-body content-stack" onSubmit={e => { e.preventDefault(); void generateQuiz(); }}>
            <div className="form-grid"><label className="field">Subject<input aria-label="Subject" required minLength={2} maxLength={100} value={subject} disabled={busy} onChange={e => setSubject(e.target.value)} /></label><label className="field">Chapter or topic<input aria-label="Chapter or topic" required minLength={2} maxLength={150} value={chapter} disabled={busy} onChange={e => setChapter(e.target.value)} /></label></div>
            <div className="ai-controls"><label className="field">Format<select aria-label="Format" value={format} disabled={busy} onChange={e => setFormat(e.target.value)}><option value="QUIZ">Quiz</option><option value="WORKSHEET">Worksheet</option><option value="QUESTION_PAPER">Question paper</option></select></label><label className="field">Question type<select aria-label="Question type" value={questionType} disabled={busy} onChange={e => setQuestionType(e.target.value)}><option value="MCQ">Multiple choice</option><option value="SHORT_ANSWER">Short answer</option><option value="MIXED">Mixed</option></select></label><label className="field">Difficulty<select aria-label="Difficulty" value={difficulty} disabled={busy} onChange={e => setDifficulty(e.target.value)}><option value="FOUNDATION">Foundation</option><option value="STANDARD">Standard</option><option value="CHALLENGE">Challenge</option></select></label></div>
            <label className="field">Chapter or syllabus content<textarea aria-label="Chapter or syllabus content" className="ai-source-input" required minLength={80} maxLength={20000} value={sourceText} disabled={busy} placeholder="Paste the lesson content you want assessed. Questions will be based on this source." onChange={e => setSourceText(e.target.value)} /><small className="muted">{sourceText.length.toLocaleString()} / 20,000 characters · minimum 80</small></label>
            <div><Button type="submit" isLoading={busy} disabled={!configured || !classId} leftIcon={<Sparkles size={16} />}>Generate 10 questions</Button></div>
          </form>
        </Panel>}
        {tab === 'quiz' && paper && <Panel title={paper.title} subtitle={`${paper.questions.length} questions · ${paper.questions.reduce((n, q) => n + q.marks, 0)} marks · AI draft for teacher review`}>
          <div className="panel-body content-stack"><p>{paper.instructions}</p>{paper.warnings.map((warning, i) => <div key={i} className="state-box">{warning}</div>)}<div className="ai-action-row"><Button variant="outline" size="sm" leftIcon={<Download size={15} />} onClick={() => downloadText('student-question-paper.txt', paperText(paper))}>Download student copy</Button><Button variant="outline" size="sm" onClick={() => downloadText('teacher-answer-key.txt', paperText(paper, true))}>Download answer key</Button><Button variant="outline" size="sm" leftIcon={<Printer size={15} />} onClick={() => window.print()}>Print student copy</Button><label><input type="checkbox" checked={showAnswers} onChange={e => setShowAnswers(e.target.checked)} /> Show answer key</label></div>
            {paper.questions.map((q, i) => <article className="ai-question" key={i}><div className="ai-question-heading"><h3>{i + 1}. {q.question}</h3><span>{q.marks} marks</span></div>{q.options.length > 0 && <ol type="A">{q.options.map(option => <li key={option}>{option}</li>)}</ol>}{showAnswers && <div className="ai-answer"><strong>Answer: {q.answer}</strong><p>{q.explanation}</p></div>}</article>)}
          </div>
        </Panel>}
        <div className="ai-action-row muted"><Link className="panel-link" href={`${base}/grades`}>Open gradebook →</Link>{base === '/school' && <Link className="panel-link" href="/school/report-cards">Report-card approval & publishing →</Link>}</div>
      </>}
    </>}
  </div>{paper && <section className="ai-print-paper"><h1>{paper.title}</h1><p>Name: ____________________  Class: __________  Date: __________</p><p>{paper.instructions}</p>{paper.questions.map((q, i) => <article key={i}><h3>{i + 1}. {q.question} ({q.marks} marks)</h3><ol type="A">{q.options.map(option => <li key={option}>{option}</li>)}</ol>{q.type === 'SHORT_ANSWER' && <p>________________________________________________________________</p>}</article>)}</section>}</div>;
}
