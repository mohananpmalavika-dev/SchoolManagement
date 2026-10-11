'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  Filter,
  GraduationCap,
  HelpCircle,
  MessageCircle,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import type {
  ERPCopilotQueryResponse,
  ERPCopilotStudentMatch,
  TeachingLanguage,
} from '@krypton/types';
import { runCopilotQuery } from '@/lib/copilot-client';
import { exportCsv, messageFor } from '@/lib/workspace';
import { Button } from '@/components/ui';
import { PageHeading, Panel, StatCard } from '@/components/WorkspaceUI';

const SUGGESTED_QUERIES = [
  'Show me all Grade 9 students who have attendance < 80% and unpaid fee balance',
  'Find students with fee arrears over 10000 in Grade 10',
  'Which students had marks drop below 40% or need academic support?',
  'Students with low attendance < 75% across the school',
  'Show high-risk dropout students with falling attendance',
  'Find top academic achievers with marks > 85%',
];

interface ERPCopilotViewProps {
  portal?: 'admin' | 'teacher' | 'school' | 'dashboard';
}

export function ERPCopilotView({ portal = 'school' }: ERPCopilotViewProps) {
  const [query, setQuery] = useState('Show me all Grade 9 students who have attendance < 80% and unpaid fee balance');
  const [language, setLanguage] = useState<TeachingLanguage>('English');
  const [result, setResult] = useState<ERPCopilotQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<ERPCopilotStudentMatch | null>(null);
  const [whatsappNoticeSent, setWhatsappNoticeSent] = useState<Record<string, boolean>>({});
  const activeRequest = useRef<AbortController | null>(null);

  const executeSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;

    setLoading(true);
    setError('');
    setSelectedStudent(null);

    try {
      const data = await runCopilotQuery(searchQuery.trim(), language, controller.signal);
      if (!controller.signal.aborted) {
        setResult(data);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(messageFor(err));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [language]);

  // Run initial query on mount
  useEffect(() => {
    void executeSearch(query);
    return () => activeRequest.current?.abort();
  }, []);

  const handlePromptClick = (promptText: string) => {
    setQuery(promptText);
    void executeSearch(promptText);
  };

  const handleExportCsv = () => {
    if (!result || !result.matches.length) return;
    const records = result.matches.map(m => ({
      name: m.name,
      admission: m.admissionNumber,
      className: m.className,
      attendance: m.attendanceRate !== null ? `${m.attendanceRate}%` : 'N/A',
      examAverage: m.latestAverage !== null ? `${m.latestAverage}%` : 'N/A',
      feeBalance: m.outstandingBalance / 100,
      riskLevel: m.riskLevel,
      parentName: m.parentName || 'N/A',
      parentPhone: m.parentPhone || 'N/A',
      reasons: m.reasons.join(' | '),
    }));

    exportCsv('copilot-executive-results', [
      { key: 'name', label: 'Student Name' },
      { key: 'admission', label: 'Admission Number' },
      { key: 'className', label: 'Class' },
      { key: 'attendance', label: 'Attendance Rate' },
      { key: 'examAverage', label: 'Latest Exam Average' },
      { key: 'feeBalance', label: `Outstanding Fee (${result.currency})` },
      { key: 'riskLevel', label: 'Risk Priority' },
      { key: 'parentName', label: 'Parent Name' },
      { key: 'parentPhone', label: 'Parent Phone' },
      { key: 'reasons', label: 'Identified Signals' },
    ], records);
  };

  const openWhatsAppAlert = (student: ERPCopilotStudentMatch) => {
    const parentPhone = student.parentPhone?.replace(/[^0-9]/g, '') || '';
    const message = encodeURIComponent(
      `Dear Parent of ${student.name} (${student.admissionNumber}), this is an official academic & attendance update from the School Administration.\n\n` +
      `Current Attendance: ${student.attendanceRate !== null ? `${student.attendanceRate}%` : 'Under Review'}\n` +
      `Academic Average: ${student.latestAverage !== null ? `${student.latestAverage}%` : 'Under Review'}\n` +
      (student.outstandingBalance > 0 ? `Pending Fee Balance: ${result?.currency ?? 'KES'} ${(student.outstandingBalance / 100).toLocaleString()}\n` : '') +
      `\nPlease contact the Class Teacher or schedule a Virtual PTM at your earliest convenience.`
    );

    const url = parentPhone
      ? `https://wa.me/${parentPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(url, '_blank', 'noopener,noreferrer');
    setWhatsappNoticeSent(prev => ({ ...prev, [student.studentId]: true }));
  };

  const currencySymbol = result?.currency ?? 'KES';

  return (
    <div className="content-stack copilot-workspace">
      <PageHeading
        eyebrow="INTELLIGENT ACADEMIC & ERP COPILOT"
        title="Ask ERP Copilot"
        description="Type natural language queries to search, filter, and extract actionable insights across attendance, marks, fees, and student risks in seconds."
        actions={
          <div className="flex items-center gap-2">
            <select
              aria-label="Copilot Language"
              value={language}
              onChange={e => setLanguage(e.target.value as TeachingLanguage)}
              className="text-sm bg-white border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="English">English</option>
              <option value="Malayalam">Malayalam (മലയാളം)</option>
              <option value="Swahili">Swahili (Kiswahili)</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              disabled={loading || !result?.matches.length}
              leftIcon={<Download size={15} />}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Printer size={15} />}
              onClick={() => window.print()}
            >
              Print Report
            </Button>
          </div>
        }
      />

      {/* Main NLP Search Bar */}
      <div className="studio-banner bg-gradient-to-r from-indigo-900 via-primary-900 to-indigo-950 p-6 rounded-2xl shadow-xl text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Bot size={22} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Natural Language Executive Search
              <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full font-mono">
                AI Powered
              </span>
            </h2>
            <p className="text-xs text-indigo-200">
              Query student rosters, fee arrears, attendance rates, and exam drops in conversational English or regional terms.
            </p>
          </div>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            void executeSearch(query);
          }}
          className="relative mt-2"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-indigo-300" size={20} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. Show me all Grade 9 students who have attendance < 80% and unpaid fee balance"
              className="w-full pl-12 pr-32 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-indigo-200 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-primary-600 hover:from-indigo-600 hover:to-primary-700 text-white font-medium text-sm rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Ask Copilot
            </button>
          </div>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block mb-2">
            Try Suggested Queries:
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUERIES.map((sq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromptClick(sq)}
                className="text-xs text-left bg-white/10 hover:bg-white/20 active:bg-white/30 text-indigo-100 border border-white/15 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
              >
                <Sparkles size={12} className="text-indigo-300 flex-shrink-0" />
                <span>{sq}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="state-box" role="alert">
          {error}
          <Button size="sm" variant="outline" onClick={() => void executeSearch(query)}>
            Retry Query
          </Button>
        </div>
      )}

      {loading && (
        <div className="panel panel-body text-center py-10" role="status">
          <RefreshCw size={32} className="animate-spin text-primary-600 mx-auto mb-3" />
          <p className="font-medium text-gray-800">Copilot is analyzing student records, attendance registers, and payment balances…</p>
          <span className="text-xs text-gray-500">Applying multi-parameter filter predicates in real time.</span>
        </div>
      )}

      {result && !loading && (
        <>
          {/* Active Filter Badges */}
          {result.parsedFilters.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                <Filter size={14} /> Filter Breakdown:
              </span>
              {result.parsedFilters.map((badge, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white text-indigo-800 border border-indigo-200 shadow-sm"
                >
                  <strong className="text-indigo-600">{badge.label}:</strong>
                  <span>{badge.value}</span>
                </span>
              ))}
            </div>
          )}

          {/* Metric Summary Cards */}
          <div className="metric-grid">
            <StatCard
              label="Matching Students"
              value={result.totalCount}
              note="Meeting all query parameters"
              icon={Users}
            />
            <StatCard
              label="Outstanding Fee Arrears"
              value={`${currencySymbol} ${(result.summary.totalOutstanding / 100).toLocaleString()}`}
              note="Cumulative debt in this cohort"
              icon={Wallet}
            />
            <StatCard
              label="Cohort Attendance Rate"
              value={result.summary.averageAttendance > 0 ? `${result.summary.averageAttendance}%` : 'N/A'}
              note="Average recorded across group"
              icon={UserCheck}
            />
            <StatCard
              label="High Intervention Priority"
              value={result.summary.highRiskCount}
              note="Requires immediate staff action"
              icon={AlertTriangle}
            />
          </div>

          {/* Natural Language Executive Briefing */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-base mb-1">
                  Executive Intelligence Briefing
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  {result.naturalLanguageSummary}
                </p>

                {result.suggestedActions.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1.5">
                      Recommended Proactive Steps:
                    </span>
                    <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                      {result.suggestedActions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Matches Table */}
          <Panel
            title={`Cohort Records (${result.totalCount} Students)`}
            subtitle="Sorted by risk priority and outstanding debt balance. Click any student to review details or trigger interventions."
          >
            {!result.matches.length ? (
              <div className="p-8 text-center">
                <HelpCircle className="mx-auto text-gray-400 mb-2" size={32} />
                <h4 className="font-medium text-gray-900">No students matched this exact query</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Try broadening the attendance percentage (e.g. &lt; 85%) or clearing the class filter.
                </p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-3">Class</th>
                      <th className="py-3 px-3">Attendance</th>
                      <th className="py-3 px-3">Exam Avg</th>
                      <th className="py-3 px-3">Fee Arrears</th>
                      <th className="py-3 px-3">Risk Level</th>
                      <th className="py-3 px-4 text-right">Proactive Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {result.matches.map(student => {
                      const isHigh = student.riskLevel === 'HIGH';
                      const isMod = student.riskLevel === 'MODERATE';
                      const noticeSent = !!whatsappNoticeSent[student.studentId];

                      return (
                        <tr
                          key={student.studentId}
                          className="hover:bg-indigo-50/40 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <strong className="block text-gray-900 font-semibold">{student.name}</strong>
                            <span className="text-xs text-gray-500 font-mono">{student.admissionNumber}</span>
                          </td>
                          <td className="py-3 px-3 text-gray-700">
                            {student.className}
                          </td>
                          <td className="py-3 px-3">
                            {student.attendanceRate !== null ? (
                              <span className={`font-medium ${student.attendanceRate < 80 ? 'text-red-600' : 'text-gray-900'}`}>
                                {student.attendanceRate}%
                                <small className="text-gray-400 block text-xs">
                                  {student.attendanceDays} days recorded
                                </small>
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">No records</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {student.latestAverage !== null ? (
                              <span className={`font-medium ${student.latestAverage < 50 ? 'text-amber-600' : 'text-gray-900'}`}>
                                {student.latestAverage}%
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">No grades</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {student.outstandingBalance > 0 ? (
                              <span className="font-semibold text-red-600">
                                {currencySymbol} {(student.outstandingBalance / 100).toLocaleString()}
                                {student.overdueBalance > 0 && (
                                  <span className="block text-xs font-normal text-red-500">Overdue</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-emerald-600 text-xs font-medium">Cleared</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`pill ${
                                isHigh ? 'danger' : isMod ? 'warning' : 'neutral'
                              }`}
                            >
                              {student.riskLevel}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* WhatsApp Direct Notice */}
                              <button
                                type="button"
                                title="Send WhatsApp alert to parent"
                                onClick={() => openWhatsAppAlert(student)}
                                className={`p-1.5 rounded-lg border transition-all text-xs flex items-center gap-1 ${
                                  noticeSent
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-600 border-gray-200 hover:border-emerald-300'
                                }`}
                              >
                                <MessageCircle size={15} />
                                <span className="hidden sm:inline">
                                  {noticeSent ? 'Sent' : 'WhatsApp'}
                                </span>
                              </button>

                              {/* Virtual PTM Booking */}
                              <Link
                                href={`/dashboard/ptm`}
                                title="Schedule Virtual PTM Meeting"
                                className="p-1.5 rounded-lg bg-white hover:bg-indigo-50 text-indigo-600 border border-gray-200 hover:border-indigo-300 transition-all text-xs flex items-center gap-1"
                              >
                                <Calendar size={15} />
                                <span className="hidden sm:inline">PTM</span>
                              </Link>

                              {/* Student Details Drawer/Modal */}
                              <button
                                type="button"
                                title="View details"
                                onClick={() => setSelectedStudent(student)}
                                className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition-all text-xs"
                              >
                                <ChevronRight size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {/* Student Detailed Review Modal/Drawer */}
          {selectedStudent && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between border-b pb-3 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedStudent.name}</h3>
                    <p className="text-xs text-gray-500">
                      Admission #{selectedStudent.admissionNumber} · {selectedStudent.className}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-gray-400 hover:text-gray-600 text-lg font-semibold px-2 py-1"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-xs text-gray-500 block">Attendance Rate</span>
                      <strong className="text-base text-gray-900">
                        {selectedStudent.attendanceRate !== null ? `${selectedStudent.attendanceRate}%` : 'N/A'}
                      </strong>
                      <small className="text-xs text-gray-400 block">{selectedStudent.attendanceDays} days logged</small>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-xs text-gray-500 block">Exam Average</span>
                      <strong className="text-base text-gray-900">
                        {selectedStudent.latestAverage !== null ? `${selectedStudent.latestAverage}%` : 'N/A'}
                      </strong>
                      <small className="text-xs text-gray-400 block">Term examination score</small>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-xs text-gray-500 block">Fee Arrears</span>
                      <strong className="text-base text-red-600">
                        {currencySymbol} {(selectedStudent.outstandingBalance / 100).toLocaleString()}
                      </strong>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-xs text-gray-500 block">Support Priority</span>
                      <span className={`pill ${selectedStudent.riskLevel === 'HIGH' ? 'danger' : selectedStudent.riskLevel === 'MODERATE' ? 'warning' : 'neutral'}`}>
                        {selectedStudent.riskLevel}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Parent / Guardian Contact
                    </h4>
                    <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-xs space-y-1">
                      <p><strong>Name:</strong> {selectedStudent.parentName || 'Not specified'}</p>
                      <p><strong>Phone:</strong> {selectedStudent.parentPhone || 'Not provided'}</p>
                      <p><strong>Email:</strong> {selectedStudent.parentEmail || 'Not provided'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Identified Signal Details
                    </h4>
                    <ul className="text-xs text-gray-700 space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {selectedStudent.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-primary-600 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openWhatsAppAlert(selectedStudent)}
                      leftIcon={<MessageCircle size={15} />}
                    >
                      Send WhatsApp Notice
                    </Button>
                    <Link
                      href="/dashboard/ptm"
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow-sm"
                    >
                      <Calendar size={15} />
                      Book Virtual PTM
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
