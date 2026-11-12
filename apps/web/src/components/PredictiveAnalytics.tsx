'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  BrainCircuit,
  CreditCard,
  Download,
  GraduationCap,
  Radar,
  RefreshCw,
  Search,
  Sparkles,
  Table,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import type { PredictiveAnalyticsReport, RiskAssessment, RiskKind, RiskLevel, StudentRiskProfile } from '@krypton/types';
import { apiClient } from '@/lib/api-client';
import { exportCsv, messageFor } from '@/lib/workspace';
import { predictiveAnalyticsRoles } from '@/lib/session';
import { ProtectedRoute } from './ProtectedRoute';
import { EmptyState, PageHeading, Panel, StatCard } from './WorkspaceUI';
import { Button } from './ui';
import { EarlyWarningRadarView } from './radar/EarlyWarningRadarView';
import { StudentInterventionModal } from './radar/StudentInterventionModal';

const labels: Record<RiskLevel, string> = { HIGH: 'High', MODERATE: 'Moderate', LOW: 'Low', INSUFFICIENT_DATA: 'Limited evidence' };
const kinds: { key: RiskKind; label: string; href: string }[] = [
  { key: 'academic', label: 'Academic failure risk', href: '/school/grades' },
  { key: 'homework', label: 'Homework submission deficit', href: '/school/learning' },
  { key: 'dropout', label: 'Dropout support signal', href: '/school/attendance' },
  { key: 'feeDefault', label: 'Fee default risk', href: '/school/fees' },
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
  const [viewMode, setViewMode] = useState<'radar' | 'table'>('radar');
  const [query, setQuery] = useState('');
  const [classId, setClassId] = useState('');
  const [kind, setKind] = useState<RiskKind | 'all'>('all');
  const [level, setLevel] = useState('AT_RISK');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [interventionStudent, setInterventionStudent] = useState<StudentRiskProfile | null>(null);

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
  const currency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: report?.currency ?? 'INR', maximumFractionDigits: 0 }).format(amount / 100);
  const exportReport = () => {
    const records = rows.map(s => ({
      name: safeCsv(s.name), admission: safeCsv(s.admissionNumber), className: safeCsv(s.className),
      overall: labels[s.overall], academic: s.academic.score ?? 'Limited evidence',
      homework: s.homework.score ?? 'Limited evidence', fee: s.feeDefault.score ?? 'Limited evidence',
      dropout: s.dropout.score ?? 'Limited evidence', attendance: s.metrics.attendanceRate ?? 'Limited evidence',
      homeworkCompletion: s.metrics.homeworkCompletionRate ?? 'Limited evidence',
      outstanding: s.metrics.outstandingBalance / 100,
      evidence: safeCsv(kinds.map(k => `${k.label}: ${s[k.key].evidence.join(' ')}`).join(' | ')),
      generatedAt: report!.generatedAt,
    }));
    exportCsv('student-risk-review', [
      { key: 'name', label: 'Student' }, { key: 'admission', label: 'Admission number' }, { key: 'className', label: 'Class' },
      { key: 'overall', label: 'Review priority' }, { key: 'academic', label: 'Academic risk index /100' },
      { key: 'homework', label: 'Homework deficit index /100' },
      { key: 'fee', label: 'Fee risk index /100' }, { key: 'dropout', label: 'Dropout support index /100' },
      { key: 'attendance', label: 'Attendance %' }, { key: 'homeworkCompletion', label: 'Homework Completion %' },
      { key: 'outstanding', label: `Outstanding (${report!.currency})` },
      { key: 'evidence', label: 'Evidence' }, { key: 'generatedAt', label: 'Generated at (UTC)' },
    ], records);
  };
  return <div className="content-stack analytics-page">
    <PageHeading
      eyebrow="EARLY SUPPORT · BETTER OUTCOMES"
      title="🎯 AI Student At-Risk & Early Warning Radar"
      description="Automated multi-factor radar analyzing exam marks (പരീക്ഷ), attendance (ഹാജർ) and homework submissions (ഹോംവർക്ക്) with tailored teacher and parent interventions."
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('radar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'radar'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Radar size={14} />
              <span>Early Warning Radar</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Table size={14} />
              <span>Review Table</span>
            </button>
          </div>
          <Button size="sm" variant="outline" isLoading={loading} leftIcon={<RefreshCw size={15} />} onClick={() => void load()}>Refresh</Button>
          <Button size="sm" disabled={!rows.length || loading} leftIcon={<Download size={15} />} onClick={exportReport}>Export review list</Button>
        </div>
      }
    />
    {loading && <div className="panel panel-body" role="status"><span className="spinner mr-2" /> Analysing exam, attendance & homework radar records…</div>}
    {error && <div className="state-box" role="alert">{error} <Button size="sm" variant="outline" onClick={() => void load()}>Try again</Button></div>}
    {report && <>
      <div className="analytics-intro"><BrainCircuit size={28} /><div><strong>Proactive Detection. Targeted Intervention.</strong>
        <p>The radar proactively identifies learners needing support across examinations, attendance patterns, and homework submissions, providing actionable recommendations for educators and guardians.</p>
        <small>Updated {new Date(report.generatedAt).toLocaleString()} · {report.summary.students} active students · {report.summary.incompleteData} with incomplete evidence</small></div></div>
      <div className="metric-grid">
        <StatCard label="Students to review" value={report.summary.atRisk} note="High or moderate in any dimension" icon={Users} />
        <StatCard label="Exam warning (പരീക്ഷ)" value={report.summary.academicHigh} note="High academic risk" icon={GraduationCap} />
        <StatCard label="Homework warning (ഹോംവർക്ക്)" value={report.summary.homeworkHigh ?? 0} note="Severe homework deficit" icon={BookOpen} />
        <StatCard label="Attendance alert (ഹാജർ)" value={report.summary.dropoutHigh} note="Attendance-based warning" icon={UserRoundCheck} />
        <StatCard label="Fee warning (ഫീസ്)" value={report.summary.feeDefaultHigh} note={`${currency(report.summary.overdueBalance)} overdue`} icon={CreditCard} />
      </div>

      {viewMode === 'radar' ? (
        <EarlyWarningRadarView report={report} onRefresh={() => void load()} />
      ) : (
        <>
          <details className="panel analytics-methodology"><summary>How predictions work & model readiness</summary>
            <p>{report.methodology}</p>
            <div className="analytics-model-grid">{(['academic', 'feeDefault'] as const).map(key => {
              const model = report.models[key];
              return <div key={key}><strong>{key === 'academic' ? 'Academic model' : 'Fee default model'}</strong>
                <span className={`pill ${model.status === 'ACTIVE' ? '' : 'neutral'}`}>{model.status === 'ACTIVE' ? 'School-trained model active' : model.status === 'VALIDATION_FAILED' ? 'Early-warning mode · validation did not pass' : 'Early-warning mode · more history needed'}</span>
                <p>{model.samples} historical examples · {model.validationSamples} held out for validation{model.balancedAccuracy !== null ? ` · balanced accuracy ${Math.round(model.balancedAccuracy * 100)}% · Brier score ${model.brierScore}` : ''}.</p></div>;
            })}</div>
            <p>Risk dimensions are evaluated against exam history, attendance logs, and homework submissions. Early warnings guide timely human interventions.</p>
          </details>

          {selected && <Panel title="Student support review" subtitle="Review the evidence before taking action">
            <div className="panel-body analytics-review">
              <div className="analytics-review-heading">
                <div>
                  <h3 ref={detailHeading} tabIndex={-1}>{selected.name}</h3>
                  <p>{selected.admissionNumber} · {selected.className}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setInterventionStudent(selected)} leftIcon={<Sparkles size={14} />}>
                    Open Intervention Plan
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(null)}>Close review</Button>
                </div>
              </div>
              <div className="analytics-evidence-grid">{kinds.map(k => <EvidenceCard key={k.key} student={selected} kind={k} />)}</div>
              <div className="analytics-facts">
                <span>Latest exam <strong>{selected.metrics.latestAverage === null ? 'Unavailable' : `${selected.metrics.latestAverage}%`}</strong></span>
                <span>Attendance <strong>{selected.metrics.attendanceRate === null ? 'Limited evidence' : `${selected.metrics.attendanceRate}%`}</strong></span>
                <span>Homework <strong>{selected.metrics.homeworkCompletionRate === null ? 'No data' : `${selected.metrics.homeworkCompletionRate}% submitted`}</strong></span>
                <span>Outstanding fees <strong>{currency(selected.metrics.outstandingBalance)}</strong></span>
              </div>
            </div>
          </Panel>}

          <Panel title="Student watchlist" subtitle="Highest risk scores first. Open a review to see evidence and suggested support.">
            <div className="table-toolbar analytics-filters"><label className="search-field"><Search size={16} /><input aria-label="Search student or admission number" value={query} placeholder="Student or admission number" onChange={e => setQuery(e.target.value)} /></label>
              <label>Class<select aria-label="Class" value={classId} onChange={e => setClassId(e.target.value)}><option value="">All classes</option>{report.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}<option value="unassigned">Unassigned</option></select></label>
              <label>Risk dimension<select aria-label="Risk dimension" value={kind} onChange={e => setKind(e.target.value as RiskKind | 'all')}><option value="all">Any dimension</option>{kinds.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}</select></label>
              <label>Priority<select aria-label="Priority" value={level} onChange={e => setLevel(e.target.value)}><option value="AT_RISK">High & moderate</option><option value="ALL">All students</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            {!report.students.length ? <EmptyState title="No active students yet" description="Analytics will appear as students, exam results, attendance and fee records are added." /> : !rows.length ?
              <EmptyState title="No students match this view" description="Change the class, risk or priority filters to review other students." /> : <>
                <div className="table-wrap"><table><caption className="sr-only">Student early-warning risk indices, scored out of 100</caption>
                  <thead><tr><th>Student</th><th>Priority</th><th>Exam (പരീക്ഷ)</th><th>Homework (ഹോംവർക്ക്)</th><th>Attendance (ഹാജർ)</th><th>Fee default</th><th>Interventions</th></tr></thead>
                  <tbody>{visible.map(s => <tr key={s.studentId}><td><strong>{s.name}</strong><small className="analytics-student-meta">{s.admissionNumber} · {s.className}</small></td><td><RiskPill risk={{ level: s.overall, score: null }} /></td>{kinds.map(k => <td key={k.key}><RiskPill risk={s[k.key]} /></td>)}
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" aria-label={`Review ${s.name}`} aria-pressed={selectedId === s.studentId} onClick={() => setSelectedId(s.studentId)}>Evidence</Button>
                        <Button size="sm" onClick={() => setInterventionStudent(s)} leftIcon={<Sparkles size={13} />}>Plan</Button>
                      </div>
                    </td></tr>)}</tbody></table></div>
                <div className="table-pagination"><span>{(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, rows.length)} of {rows.length} students</span><div className="flex items-center gap-3"><Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><span>Page {currentPage} of {pageCount}</span><Button variant="outline" size="sm" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div>
              </>}
          </Panel>
        </>
      )}

      {/* Floating Intervention Modal */}
      <StudentInterventionModal
        student={interventionStudent}
        onClose={() => setInterventionStudent(null)}
        currency={report.currency}
      />
    </>}
  </div>;
}

function EvidenceCard({ student, kind }: { student: StudentRiskProfile; kind: typeof kinds[number] }) {
  const risk = student[kind.key];
  return <section className="analytics-evidence"><h3>{kind.label}</h3><RiskPill risk={risk} />
    <p className="analytics-basis">{risk.basis === 'SCHOOL_MODEL' ? 'School-trained model' : 'Explainable early-warning indicator'}</p>
    <h4>Why this appears</h4><ul>{risk.evidence.map(e => <li key={e}>{e}</li>)}</ul>
    <h4>Suggested support</h4><ul>{risk.actions.map(a => <li key={a}>{a}</li>)}</ul>
    <Link className="panel-link" href={kind.href}>Open {kind.key === 'academic' ? 'gradebook' : kind.key === 'homework' ? 'assignments' : kind.key === 'feeDefault' ? 'fee records' : 'attendance'} →</Link>
  </section>;
}

