'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BrainCircuit, CreditCard, Download, GraduationCap, RefreshCw, Search, UserRoundCheck, Users } from 'lucide-react';
import type { PredictiveAnalyticsReport, RiskAssessment, RiskKind, RiskLevel, StudentRiskProfile } from '@krypton/types';
import { apiClient } from '@/lib/api-client';
import { exportCsv, messageFor } from '@/lib/workspace';
import { predictiveAnalyticsRoles } from '@/lib/session';
import { ProtectedRoute } from './ProtectedRoute';
import { EmptyState, PageHeading, Panel, StatCard } from './WorkspaceUI';
import { Button } from './ui';

const labels: Record<RiskLevel, string> = { HIGH: 'High', MODERATE: 'Moderate', LOW: 'Low', INSUFFICIENT_DATA: 'Limited evidence' };
const kinds: { key: RiskKind; label: string; href: string }[] = [
  { key: 'academic', label: 'Academic failure risk', href: '/school/grades' },
  { key: 'feeDefault', label: 'Fee default risk', href: '/school/fees' },
  { key: 'dropout', label: 'Dropout support signal', href: '/school/attendance' },
];
function RiskPill({ risk }: { risk: Pick<RiskAssessment, 'level' | 'score'> }) {
  return <span className={`pill ${risk.level === 'HIGH' ? 'danger' : risk.level === 'MODERATE' ? 'warning' : risk.level === 'INSUFFICIENT_DATA' ? 'neutral' : ''}`}>
    {labels[risk.level]}{risk.score !== null && <span> · {risk.score}/100</span>}
  </span>;
}
// Spreadsheet formula injection protection for school-entered names and evidence.
const safeCsv = (value: string) => /^[\s]*[=+@-]/.test(value) ? "'" + value : value;

export function PredictiveAnalytics() {
  return <ProtectedRoute allowedRoles={predictiveAnalyticsRoles}><AnalyticsDashboard /></ProtectedRoute>;
}

function AnalyticsDashboard() {
  const [report, setReport] = useState<PredictiveAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [classId, setClassId] = useState('');
  const [kind, setKind] = useState<RiskKind | 'all'>('all');
  const [level, setLevel] = useState('AT_RISK');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setError(''); setReport(null); setSelectedId(null);
    try {
      const response = await apiClient.get<PredictiveAnalyticsReport>('/predictive-analytics', { signal: controller.signal });
      if (!controller.signal.aborted) setReport(response.data);
    } catch (err) {
      if (!controller.signal.aborted) setError(messageFor(err));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); return () => request.current?.abort(); }, [load]);
  useEffect(() => { setPage(1); }, [query, classId, kind, level, report]);
  useEffect(() => { if (selectedId) detailHeading.current?.focus(); }, [selectedId]);
  const selected = report?.students.find(s => s.studentId === selectedId);
  const rows = (report?.students ?? []).filter(student => {
    const riskLevel = kind === 'all' ? student.overall : student[kind].level;
    return (!classId || (classId === 'unassigned' ? !student.classId : student.classId === classId)) &&
      `${student.name} ${student.admissionNumber}`.toLowerCase().includes(query.trim().toLowerCase()) &&
      (level === 'ALL' || (level === 'AT_RISK' ? ['HIGH', 'MODERATE'].includes(riskLevel) : riskLevel === level));
  });
  const pageCount = Math.max(1, Math.ceil(rows.length / 10));
  const currentPage = Math.min(page, pageCount);
  const visible = rows.slice((currentPage - 1) * 10, currentPage * 10);
  const currency = (amount: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: report?.currency ?? 'KES', maximumFractionDigits: 0 }).format(amount / 100);
  const exportReport = () => {
    const records = rows.map(s => ({
      name: safeCsv(s.name), admission: safeCsv(s.admissionNumber), className: safeCsv(s.className),
      overall: labels[s.overall], academic: s.academic.score ?? 'Limited evidence', fee: s.feeDefault.score ?? 'Limited evidence',
      dropout: s.dropout.score ?? 'Limited evidence', attendance: s.metrics.attendanceRate ?? 'Limited evidence',
      outstanding: s.metrics.outstandingBalance / 100,
      evidence: safeCsv(kinds.map(k => `${k.label}: ${s[k.key].evidence.join(' ')}`).join(' | ')),
      generatedAt: report!.generatedAt,
    }));
    exportCsv('student-risk-review', [
      { key: 'name', label: 'Student' }, { key: 'admission', label: 'Admission number' }, { key: 'className', label: 'Class' },
      { key: 'overall', label: 'Review priority' }, { key: 'academic', label: 'Academic risk index /100' },
      { key: 'fee', label: 'Fee risk index /100' }, { key: 'dropout', label: 'Dropout support index /100' },
      { key: 'attendance', label: 'Attendance %' }, { key: 'outstanding', label: `Outstanding (${report!.currency})` },
      { key: 'evidence', label: 'Evidence' }, { key: 'generatedAt', label: 'Generated at (UTC)' },
    ], records);
  };
  return <div className="content-stack analytics-page">
    <PageHeading eyebrow="EARLY SUPPORT · BETTER OUTCOMES" title="AI Predictive Analytics" description="Spot academic, fee and attendance warning signs while there is time to help."
      actions={<><Button size="sm" variant="outline" isLoading={loading} leftIcon={<RefreshCw size={15} />} onClick={() => void load()}>Refresh</Button>
        <Button size="sm" disabled={!rows.length || loading} leftIcon={<Download size={15} />} onClick={exportReport}>Export review list</Button></>} />
    {loading && <div className="panel panel-body" role="status"><span className="spinner mr-2" /> Analysing school records…</div>}
    {error && <div className="state-box" role="alert">{error} <Button size="sm" variant="outline" onClick={() => void load()}>Try again</Button></div>}
    {report && <>
      <div className="analytics-intro"><BrainCircuit size={28} /><div><strong>Early signals. A chance to intervene.</strong>
        <p>Scores help staff prioritise a supportive review. They do not establish that a student will fail, default or leave school.</p>
        <small>Updated {new Date(report.generatedAt).toLocaleString()} · {report.summary.students} active students · {report.summary.incompleteData} with incomplete evidence</small></div></div>
      <div className="metric-grid">
        <StatCard label="Students to review" value={report.summary.atRisk} note="High or moderate in any dimension" icon={Users} />
        <StatCard label="Academic warning" value={report.summary.academicHigh} note="High academic risk" icon={GraduationCap} />
        <StatCard label="Fee warning" value={report.summary.feeDefaultHigh} note={`${currency(report.summary.overdueBalance)} overdue across the school`} icon={CreditCard} />
        <StatCard label="Retention support" value={report.summary.dropoutHigh} note="High attendance-based support signal" icon={UserRoundCheck} />
      </div>
      <details className="panel analytics-methodology"><summary>How predictions work & model readiness</summary>
        <p>{report.methodology}</p>
        <div className="analytics-model-grid">{(['academic', 'feeDefault'] as const).map(key => {
          const model = report.models[key];
          return <div key={key}><strong>{key === 'academic' ? 'Academic model' : 'Fee default model'}</strong>
            <span className={`pill ${model.status === 'ACTIVE' ? '' : 'neutral'}`}>{model.status === 'ACTIVE' ? 'School-trained model active' : model.status === 'VALIDATION_FAILED' ? 'Early-warning mode · validation did not pass' : 'Early-warning mode · more history needed'}</span>
            <p>{model.samples} historical examples · {model.validationSamples} held out for validation{model.balancedAccuracy !== null ? ` · balanced accuracy ${Math.round(model.balancedAccuracy * 100)}% · Brier score ${model.brierScore}` : ''}.</p></div>;
        })}</div>
        <p>Models need at least 60 examples, both outcomes, and a later-date validation set. Fee learning requires reconciled payment ledgers and applies seven days before the due date. High: 65–100; moderate: 35–64; low: 0–34. A missing score means limited evidence. Health, gender and family demographics are excluded. Dropout support uses attendance and declining exam trends.</p>
      </details>
      {selected && <Panel title="Student support review" subtitle="Review the evidence before taking action">
        <div className="panel-body analytics-review"><div className="analytics-review-heading"><div><h3 ref={detailHeading} tabIndex={-1}>{selected.name}</h3><p>{selected.admissionNumber} · {selected.className}</p></div><Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}>Close review</Button></div>
          <div className="analytics-evidence-grid">{kinds.map(k => <EvidenceCard key={k.key} student={selected} kind={k} />)}</div>
          <div className="analytics-facts"><span>Latest exam <strong>{selected.metrics.latestAverage === null ? 'Unavailable' : `${selected.metrics.latestAverage}%`}</strong></span>
            <span>Attendance <strong>{selected.metrics.attendanceRate === null ? 'Limited evidence' : `${selected.metrics.attendanceRate}%`}</strong></span>
            <span>Outstanding fees <strong>{currency(selected.metrics.outstandingBalance)}</strong></span></div>
        </div>
      </Panel>}
      <Panel title="Student watchlist" subtitle="Highest risk scores first. Open a review to see the evidence and suggested support.">
        <div className="table-toolbar analytics-filters"><label className="search-field"><Search size={16} /><input aria-label="Search student or admission number" value={query} placeholder="Student or admission number" onChange={e => setQuery(e.target.value)} /></label>
          <label>Class<select aria-label="Class" value={classId} onChange={e => setClassId(e.target.value)}><option value="">All classes</option>{report.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}<option value="unassigned">Unassigned</option></select></label>
          <label>Risk dimension<select aria-label="Risk dimension" value={kind} onChange={e => setKind(e.target.value as RiskKind | 'all')}><option value="all">Any dimension</option>{kinds.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}</select></label>
          <label>Priority<select aria-label="Priority" value={level} onChange={e => setLevel(e.target.value)}><option value="AT_RISK">High & moderate</option><option value="ALL">All students</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        {!report.students.length ? <EmptyState title="No active students yet" description="Analytics will appear as students, exam results, attendance and fee records are added." /> : !rows.length ?
          <EmptyState title="No students match this view" description="Change the class, risk or priority filters to review other students." /> : <>
            <div className="table-wrap"><table><caption className="sr-only">Student early-warning risk indices, scored out of 100</caption><thead><tr><th>Student</th><th>Review priority</th><th>Academic</th><th>Fee default</th><th>Dropout support</th><th>Action</th></tr></thead>
              <tbody>{visible.map(s => <tr key={s.studentId}><td><strong>{s.name}</strong><small className="analytics-student-meta">{s.admissionNumber} · {s.className}</small></td><td><RiskPill risk={{ level: s.overall, score: null }} /></td>{kinds.map(k => <td key={k.key}><RiskPill risk={s[k.key]} /></td>)}
                <td><Button variant="outline" size="sm" aria-label={`Review ${s.name}`} aria-pressed={selectedId === s.studentId} onClick={() => setSelectedId(s.studentId)}>Review</Button></td></tr>)}</tbody></table></div>
            <div className="table-pagination"><span>{(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, rows.length)} of {rows.length} students</span><div className="flex items-center gap-3"><Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><span>Page {currentPage} of {pageCount}</span><Button variant="outline" size="sm" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div>
          </>}
      </Panel>
    </>}
  </div>;
}

function EvidenceCard({ student, kind }: { student: StudentRiskProfile; kind: typeof kinds[number] }) {
  const risk = student[kind.key];
  return <section className="analytics-evidence"><h3>{kind.label}</h3><RiskPill risk={risk} />
    <p className="analytics-basis">{risk.basis === 'SCHOOL_MODEL' ? 'School-trained model' : 'Explainable early-warning indicator'}</p>
    <h4>Why this appears</h4><ul>{risk.evidence.map(e => <li key={e}>{e}</li>)}</ul>
    <h4>Suggested support</h4><ul>{risk.actions.map(a => <li key={a}>{a}</li>)}</ul>
    <Link className="panel-link" href={kind.href}>Open {kind.key === 'academic' ? 'gradebook' : kind.key === 'feeDefault' ? 'fee records' : 'attendance'} →</Link>
  </section>;
}
