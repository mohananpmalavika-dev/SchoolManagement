'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Smartphone,
  CheckCircle2,
  Clock,
  MapPin,
  BookOpen,
  Calendar,
  AlertCircle,
  MessageCircle,
  CheckCheck,
  ChevronRight,
  ShieldCheck,
  Send,
  HelpCircle,
  FileText,
  UserCheck,
  Sparkles,
  ArrowLeft,
  X,
} from 'lucide-react';
import {
  SubstitutionAssignment,
  SubstitutionNotificationLog,
} from '@krypton/types';
import { smartSubstitutionApi, TEACHER_PROFILES, TeacherProfile } from '@/lib/substitution-client';

export function TeacherProxyMobileView() {
  // Currently logged-in / previewed teacher persona
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('stf-001'); // Dr. Priya Sharma
  const [assignments, setAssignments] = useState<SubstitutionAssignment[]>([]);
  const [notifications, setNotifications] = useState<SubstitutionNotificationLog[]>([]);
  const [activeTab, setActiveTab] = useState<'PROXIES' | 'MY_SCHEDULE'>('PROXIES');

  // Interactive feedback
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [completionModalAssignment, setCompletionModalAssignment] = useState<SubstitutionAssignment | null>(null);
  const [classRemarks, setClassRemarks] = useState<string>('Completed chapter review and gave practice questions.');
  const [whatsAppModalText, setWhatsAppModalText] = useState<string | null>(null);

  const currentTeacher: TeacherProfile =
    TEACHER_PROFILES.find((t) => t.id === selectedTeacherId) || TEACHER_PROFILES[0];

  const refreshData = () => {
    setAssignments(smartSubstitutionApi.getAssignments(undefined, selectedTeacherId));
    setNotifications(smartSubstitutionApi.getNotificationLogs(selectedTeacherId));
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = smartSubstitutionApi.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [selectedTeacherId]);

  const regularSchedule = smartSubstitutionApi.getTeacherRegularSchedule(selectedTeacherId);

  // Handle acknowledge
  const handleAcknowledge = (assignmentId: string) => {
    smartSubstitutionApi.acknowledgeAssignment(assignmentId);
    setActionToast('✅ Substitution duty acknowledged! Confirmation sent to Academic Office.');
    setTimeout(() => setActionToast(null), 4000);
  };

  // Handle complete
  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionModalAssignment) return;

    smartSubstitutionApi.completeAssignment(completionModalAssignment.id, classRemarks);
    setCompletionModalAssignment(null);
    setActionToast('🎉 Class marked as completed with attendance recorded!');
    setTimeout(() => setActionToast(null), 4000);
  };

  const pendingCount = assignments.filter((a) => a.status === 'NOTIFIED' || a.status === 'AUTO_ASSIGNED').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Alert */}
      {actionToast && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm rounded-2xl flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{actionToast}</span>
        </div>
      )}

      {/* Header and Teacher Persona Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-indigo-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={currentTeacher.avatarUrl}
              alt={currentTeacher.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-400 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-semibold border border-indigo-400/30">
                  Teacher Mobile Portal
                </span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-slate-300 font-sans">അധ്യാപക പോർട്ടൽ</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                {currentTeacher.name}
              </h1>
              <p className="text-xs text-slate-400 font-sans">
                {currentTeacher.nameMl} • {currentTeacher.department} ({currentTeacher.primarySubject})
              </p>
            </div>
          </div>

          {/* Persona Switcher Dropdown */}
          <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              Switch Teacher Persona (ടെസ്റ്റ് പ്രിവ്യൂ)
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="text-xs bg-slate-900 text-white border border-slate-700 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500 w-full"
            >
              {TEACHER_PROFILES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.primarySubject})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Urgent Notification Banner if Teacher has proxy duty */}
        {assignments.length > 0 ? (
          <div className="p-4 bg-indigo-600/30 border border-indigo-400/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500 text-white shadow">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white flex items-center gap-2">
                  <span>🔔 Substitution Alert Received</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-black">
                    {pendingCount > 0 ? `${pendingCount} Duty Pending Action` : 'Acknowledged'}
                  </span>
                </div>
                <p className="text-xs text-indigo-200 mt-0.5 font-sans leading-relaxed">
                  നിങ്ങൾക്ക് ഇന്ന് സബ്സ്റ്റിറ്റ്യൂഷൻ ഡ്യൂട്ടി ലഭിച്ചിട്ടുണ്ട്. താഴെയുള്ള വിവരങ്ങൾ പരിശോധിച്ച് Acknowledge ചെയ്യുക.
                </p>
              </div>
            </div>

            <Link
              href="/school/substitution"
              className="text-xs font-bold text-indigo-300 hover:text-white underline self-end sm:self-center"
            >
              View Admin Hub &gt;
            </Link>
          </div>
        ) : (
          <div className="p-3 bg-slate-800/40 rounded-xl text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No substitution duties assigned for {currentTeacher.name} right now.</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('PROXIES')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'PROXIES'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>My Proxy Duties Today</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            {assignments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('MY_SCHEDULE')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'MY_SCHEDULE'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>My Complete Schedule for Today</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {regularSchedule.length} Regular
          </span>
        </button>
      </div>

      {/* TAB 1: Assigned Proxies */}
      {activeTab === 'PROXIES' && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                No Proxy Duties for {currentTeacher.name}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All classes are on regular schedule. If a substitution is auto-assigned, you will receive an instant push &amp; WhatsApp alert here.
              </p>
            </div>
          ) : (
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border-2 border-indigo-500/30 shadow-lg space-y-4"
              >
                {/* Header Callout: The exact requirement string */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      <Smartphone className="w-5 h-5" />
                    </span>
                    <div>
                      <span className="text-[11px] font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
                        Instant Notification Received
                      </span>
                      {/* Exact prompt sentence */}
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        &ldquo;You have substitution in {assignment.className} - {assignment.periodName}&rdquo;
                      </h3>
                    </div>
                  </div>

                  <span
                    className={`self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold ${
                      assignment.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : assignment.status === 'ACKNOWLEDGED'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {assignment.status === 'COMPLETED'
                      ? 'Completed'
                      : assignment.status === 'ACKNOWLEDGED'
                      ? 'Duty Acknowledged'
                      : 'Pending Acknowledgment'}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Class</span>
                    <strong className="text-sm text-slate-900 dark:text-white">{assignment.className}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Time Slot</span>
                    <strong className="text-sm text-slate-900 dark:text-white">{assignment.timeSlot}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Subject</span>
                    <strong className="text-sm text-indigo-600 dark:text-indigo-400">{assignment.subjectName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Room</span>
                    <strong className="text-sm text-slate-900 dark:text-white">{assignment.room}</strong>
                  </div>
                </div>

                {/* Replacing Teacher Info */}
                <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="text-slate-600 dark:text-slate-300">
                      Replacing absent faculty:{' '}
                      <strong className="text-slate-900 dark:text-white">
                        {assignment.absentTeacherName} ({assignment.absentTeacherNameMl})
                      </strong>{' '}
                      — Reason: <span className="text-rose-500 font-medium">{assignment.absentReason}</span>
                    </span>
                  </div>
                </div>

                {/* Handover & Lesson Plan Notes */}
                {assignment.lessonPlanHandover && (
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Lesson Plan &amp; Instructions Left for Class
                    </span>
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-200">
                      {assignment.lessonPlanHandover}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => {
                      const log = notifications.find((n) => n.assignmentId === assignment.id);
                      setWhatsAppModalText(
                        log ? log.whatsappPreview : `You have substitution in ${assignment.className} - ${assignment.periodName}`
                      );
                    }}
                    className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>View WhatsApp Message Template</span>
                  </button>

                  <div className="flex items-center gap-2.5">
                    {assignment.status !== 'ACKNOWLEDGED' && assignment.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleAcknowledge(assignment.id)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>Acknowledge Duty</span>
                      </button>
                    )}

                    {assignment.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => setCompletionModalAssignment(assignment)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Class Completed</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Class Completed &amp; Recorded</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Complete Schedule for Today */}
      {activeTab === 'MY_SCHEDULE' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Daily Schedule Matrix ({currentTeacher.name})
              </h3>
              <p className="text-xs text-slate-500">
                Combined view of regular classes and allocated substitution periods
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((periodNum) => {
              const regularSlot = regularSchedule.find((s) => s.periodNumber === periodNum);
              const proxySlot = assignments.find((a) => a.periodNumber === periodNum);

              return (
                <div
                  key={periodNum}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    proxySlot
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-400/50 shadow-sm'
                      : regularSlot
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                      : 'bg-white dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-sm text-slate-700 dark:text-slate-300">
                      P{periodNum}
                    </span>

                    <div>
                      {proxySlot ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-sm text-indigo-600 dark:text-indigo-400">
                              {proxySlot.className} — {proxySlot.subjectName}
                            </strong>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                              PROXY DUTY
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Room: {proxySlot.room}</span>
                            <span>•</span>
                            <span>Replacing: {proxySlot.absentTeacherName}</span>
                          </div>
                        </div>
                      ) : regularSlot ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-sm text-slate-900 dark:text-white">
                              {regularSlot.className} — {regularSlot.subjectName}
                            </strong>
                            <span className="text-xs text-slate-400">Regular Class</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Room: {regularSlot.room} • {regularSlot.timeSlot}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic">
                          Free Period (No regular class assigned)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-400">
                    {proxySlot?.timeSlot || regularSlot?.timeSlot || 'Free Slot'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Class Completion Modal */}
      {completionModalAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Mark Proxy Class Completed
              </h3>
              <button
                onClick={() => setCompletionModalAssignment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Record completion notes for {completionModalAssignment.className} - {completionModalAssignment.periodName}. This note will be shared with the regular teacher upon return.
            </p>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topics Covered &amp; Homework Assigned
                </label>
                <textarea
                  rows={3}
                  value={classRemarks}
                  onChange={(e) => setClassRemarks(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. Conducted revision test, assigned exercises 4.1 to 4.5."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletionModalAssignment(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                >
                  Submit &amp; Mark Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Message Preview Modal */}
      {whatsAppModalText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-500" />
                <span>WhatsApp Notification Template</span>
              </h3>
              <button
                onClick={() => setWhatsAppModalText(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl text-xs font-mono text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed">
              {whatsAppModalText}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setWhatsAppModalText(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
