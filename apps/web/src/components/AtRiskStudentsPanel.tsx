'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import type { AIRiskReview, PredictiveAnalyticsReport, TeacherAIOptions } from '@krypton/types';
import { apiClient } from '@/lib/api-client';
import { messageFor } from '@/lib/workspace';
import { Panel } from './WorkspaceUI';
import { Button } from './ui';

export function AtRiskStudentsPanel() {
  const [report, setReport] = useState<PredictiveAnalyticsReport | null>(null);
  const [configured, setConfigured] = useState(false);
  const [reviews, setReviews] = useState<AIRiskReview | null>(null);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const active = useRef<AbortController | null>(null), generation = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    active.current?.abort(); const controller = new AbortController(); active.current = controller; setLoading(true); setError(''); setReviews(null);
    try {
      const [result, options] = await Promise.all([apiClient.get<PredictiveAnalyticsReport>('/predictive-analytics', { signal: controller.signal }), apiClient.get<TeacherAIOptions>('/teacher-ai/options', { signal: controller.signal })]);
      if (!controller.signal.aborted) { setReport(result.data); setConfigured(options.data.status.configured); }
    } catch (err) { if (!controller.signal.aborted) setError(messageFor(err)); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => { active.current?.abort(); generation.current?.abort(); }; }, [load]);
  const flagged = (report?.students ?? []).filter(s => [s.academic, s.dropout].some(r => ['HIGH', 'MODERATE'].includes(r.level)));
  const visible = flagged.slice(0, 5);
  const review = async () => {
    const controller = new AbortController(); generation.current = controller; setBusy(true); setError('');
    try {
      const { data } = await apiClient.post<AIRiskReview>('/teacher-ai/risk-review', { studentIds: visible.map(s => s.studentId), language: 'English' }, { timeout: 75000, signal: controller.signal });
      if (!controller.signal.aborted) setReviews(data);
    } catch (err) { if (!controller.signal.aborted) setError(messageFor(err)); } finally { setBusy(false); }
  };
  return <Panel title="At-Risk Students" subtitle="Falling marks and attendance signals · early support for school leadership" href="/school/predictive-analytics">
    <div className="panel-body content-stack">
      {loading ? <p role="status">Checking current student evidence…</p> : <>
        {error && <div className="state-box" role="alert">{error}<Button size="sm" variant="outline" onClick={() => void load()}>Retry</Button></div>}
        {report && <><div className="ai-risk-toolbar"><div><strong>{flagged.length} students need an academic or attendance review</strong><p className="muted">Support signals guide a staff check-in. An AI review creates a draft plan for your judgement.</p></div>
          <Button size="sm" leftIcon={<Sparkles size={15} />} disabled={!configured || !visible.length || loading} isLoading={busy} onClick={() => void review()}>AI support review</Button></div>
          {!configured && <p className="muted ai-evidence-summary">Your administrator can enable AI support reviews in server settings. Saved evidence is available below.</p>}
          {!flagged.length ? <p>No current academic or attendance warning flags. {report.summary.incompleteData} students have incomplete evidence.</p> : visible.map(student => {
            const ai = reviews?.students.find(r => r.studentId === student.studentId);
            const high = [student.academic, student.dropout].some(r => r.level === 'HIGH');
            return <article className="ai-risk-student" key={student.studentId}><div className="ai-remark-heading"><div><strong>{student.name}</strong><p className="muted">{student.className} · {student.admissionNumber}</p></div><span className={`pill ${high ? 'danger' : 'warning'}`}>{high ? 'High' : 'Moderate'} support priority</span></div>
              <p className="ai-evidence-summary">Latest exam: {student.metrics.latestAverage === null ? 'Limited evidence' : `${student.metrics.latestAverage}%`} · Trend estimate: {student.metrics.projectedAverage === null ? 'Limited evidence' : `${student.metrics.projectedAverage}%`} · Attendance: {student.metrics.attendanceRate === null ? 'Limited evidence' : `${student.metrics.attendanceRate}%`}</p>
              {ai && <div className="ai-answer"><strong>AI support review · {ai.priority.replaceAll('_', ' ').toLowerCase()}</strong><ul>{ai.reasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul><h4>Suggested support</h4><ul>{ai.supportPlan.map((action, i) => <li key={i}>{action}</li>)}</ul></div>}
            </article>;
          })}
          {flagged.length > visible.length && <Link href="/school/predictive-analytics" className="panel-link">Review all {flagged.length} flagged students →</Link>}
        </>}
      </>}
    </div>
  </Panel>;
}
