'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Calendar, MessageCircle, Sparkles, TrendingDown, UserCheck } from 'lucide-react';
import type { AIRiskReview, PredictiveAnalyticsReport, TeacherAIOptions } from '@krypton/types';
import { apiClient } from '@/lib/api-client';
import { fetchAtRiskStudents } from '@/lib/copilot-client';
import { messageFor } from '@/lib/workspace';
import { Panel } from './WorkspaceUI';
import { Button } from './ui';

export function AtRiskStudentsPanel() {
  const [report, setReport] = useState<PredictiveAnalyticsReport | null>(null);
  const [configured, setConfigured] = useState(false);
  const [reviews, setReviews] = useState<AIRiskReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentAlerts, setSentAlerts] = useState<Record<string, boolean>>({});
  const active = useRef<AbortController | null>(null);
  const generation = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setError('');
    setReviews(null);

    try {
      const [result, options] = await Promise.all([
        fetchAtRiskStudents(controller.signal),
        apiClient.get<TeacherAIOptions>('/teacher-ai/options', { signal: controller.signal }),
      ]);
      if (!controller.signal.aborted) {
        setReport(result);
        setConfigured(options.data.status.configured);
      }
    } catch (err) {
      if (!controller.signal.aborted) setError(messageFor(err));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      active.current?.abort();
      generation.current?.abort();
    };
  }, [load]);

  const flagged = (report?.students ?? []).filter(s =>
    [s.academic, s.dropout].some(r => ['HIGH', 'MODERATE'].includes(r.level)) ||
    (s.metrics.latestAverage !== null && s.metrics.projectedAverage !== null && s.metrics.latestAverage - s.metrics.projectedAverage >= 10) ||
    (s.metrics.attendanceDays >= 5 && s.metrics.attendanceRate !== null && s.metrics.attendanceRate < 80) ||
    s.metrics.outstandingBalance > 0
  );

  const visible = flagged.slice(0, 5);

  const review = async () => {
    const controller = new AbortController();
    generation.current = controller;
    setBusy(true);
    setError('');
    try {
      const { data } = await apiClient.post<AIRiskReview>(
        '/teacher-ai/risk-review',
        { studentIds: visible.map(s => s.studentId), language: 'English' },
        { timeout: 75000, signal: controller.signal }
      );
      if (!controller.signal.aborted) setReviews(data);
    } catch (err) {
      if (!controller.signal.aborted) setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  };

  const handleWhatsAppAlert = (student: typeof flagged[0]) => {
    const text = encodeURIComponent(
      `Dear Parent of ${student.name} (${student.admissionNumber}), this is a gentle academic notification from the School. ` +
      `We noticed an attendance rate of ${student.metrics.attendanceRate ?? 'N/A'}% and exam average of ${student.metrics.latestAverage ?? 'N/A'}%. ` +
      `Our class teacher would love to schedule a brief check-in to support their progress.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    setSentAlerts(prev => ({ ...prev, [student.studentId]: true }));
  };

  return (
    <Panel
      title="AI Student Early-Warning & Dropout Predictor"
      subtitle="Proactive intervention for students with falling attendance, exam drops, or fee alerts"
      href="/school/predictive-analytics"
    >
      <div className="panel-body content-stack">
        {loading ? (
          <p role="status" className="text-sm text-gray-500 py-3">
            Checking academic records, test drops, and attendance trends…
          </p>
        ) : (
          <>
            {error && (
              <div className="state-box" role="alert">
                {error}
                <Button size="sm" variant="outline" onClick={() => void load()}>
                  Retry
                </Button>
              </div>
            )}
            {report && (
              <>
                <div className="ai-risk-toolbar flex items-center justify-between bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl">
                  <div>
                    <strong className="text-amber-950 text-sm flex items-center gap-1.5 font-semibold">
                      <AlertCircle size={16} className="text-amber-600" />
                      {flagged.length} At-Risk Students Flagged for Proactive Intervention
                    </strong>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Flagged on Principal & Class Teacher radar. Take immediate action before term ends.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      leftIcon={<Sparkles size={15} />}
                      disabled={!configured || !visible.length || loading}
                      isLoading={busy}
                      onClick={() => void review()}
                    >
                      AI Support Review
                    </Button>
                    <Link
                      href="/dashboard/copilot"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow-sm transition-all"
                    >
                      Ask Copilot →
                    </Link>
                  </div>
                </div>

                {!flagged.length ? (
                  <p className="text-sm text-gray-500 py-4">
                    No active student warning flags detected. Attendance and academic performance are stable across your classes.
                  </p>
                ) : (
                  <div className="space-y-3 pt-1">
                    {visible.map(student => {
                      const ai = reviews?.students.find(r => r.studentId === student.studentId);
                      const high = [student.academic, student.dropout].some(r => r.level === 'HIGH');
                      const attLow = student.metrics.attendanceRate !== null && student.metrics.attendanceRate < 80;
                      const hasFee = student.metrics.outstandingBalance > 0;
                      const isSent = !!sentAlerts[student.studentId];

                      return (
                        <article
                          className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-all shadow-sm"
                          key={student.studentId}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <strong className="text-sm font-semibold text-gray-900">{student.name}</strong>
                              <span className="text-xs text-gray-500 ml-2">
                                {student.className} · {student.admissionNumber}
                              </span>
                            </div>
                            <span className={`pill ${high ? 'danger' : 'warning'}`}>
                              {high ? 'High At-Risk' : 'Moderate Review'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${attLow ? 'bg-red-50 text-red-700 border border-red-200 font-medium' : 'bg-gray-100 text-gray-700'}`}>
                              <TrendingDown size={12} />
                              Attendance: {student.metrics.attendanceRate !== null ? `${student.metrics.attendanceRate}%` : 'N/A'}
                            </span>
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                              Latest Exam: {student.metrics.latestAverage !== null ? `${student.metrics.latestAverage}%` : 'N/A'}
                            </span>
                            {hasFee && (
                              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                                Fee Balance: {report.currency} {(student.metrics.outstandingBalance / 100).toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Quick Proactive Intervention Actions */}
                          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Proactive Interventions:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleWhatsAppAlert(student)}
                                className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1 transition-all ${
                                  isSent
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-600 border-gray-200'
                                }`}
                              >
                                <MessageCircle size={13} />
                                {isSent ? 'Alert Dispatched' : 'WhatsApp Notice'}
                              </button>
                              <Link
                                href="/dashboard/ptm"
                                className="text-xs px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1 transition-all"
                              >
                                <Calendar size={13} />
                                Schedule PTM
                              </Link>
                            </div>
                          </div>

                          {ai && (
                            <div className="mt-3 p-3 bg-indigo-50/60 rounded-lg text-xs text-indigo-950 border border-indigo-100">
                              <strong className="block mb-1 text-indigo-900">
                                AI Intervention Strategy · {ai.priority.replaceAll('_', ' ').toLowerCase()}
                              </strong>
                              <ul className="list-disc list-inside space-y-0.5 text-indigo-900 mb-2">
                                {ai.reasons.map((reason, i) => (
                                  <li key={i}>{reason}</li>
                                ))}
                              </ul>
                              <span className="font-semibold block text-indigo-900 mb-0.5">Staff Support Plan:</span>
                              <ul className="list-disc list-inside space-y-0.5 text-indigo-800">
                                {ai.supportPlan.map((action, i) => (
                                  <li key={i}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  {flagged.length > visible.length && (
                    <Link href="/school/predictive-analytics" className="panel-link text-xs">
                      Review all {flagged.length} flagged students in full analytics →
                    </Link>
                  )}
                  <Link href="/dashboard/copilot" className="panel-link text-xs ml-auto">
                    Search cohort with ERP Copilot →
                  </Link>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
