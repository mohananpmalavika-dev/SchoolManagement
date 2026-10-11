'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Bell,
  Smartphone,
  ChevronRight,
  BookOpen,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  UserCheck,
  CheckCheck,
  Printer,
  ShieldCheck,
  Info,
  Layers,
  Zap,
  Award,
  MessageCircle,
  HelpCircle,
  PlusCircle,
  X,
} from 'lucide-react';
import {
  SubstitutionPeriod,
  TeacherCandidateScore,
  SubstitutionAssignment,
  AbsentTeacherSchedule,
  SubstitutionNotificationLog,
  SubstitutionDailySummary,
  AssignProxyRequestDto,
} from '@krypton/types';
import { smartSubstitutionApi, TEACHER_PROFILES, PERIOD_SLOTS } from '@/lib/substitution-client';

export function SmartSubstitutionHub() {
  const [summary, setSummary] = useState<SubstitutionDailySummary>(smartSubstitutionApi.getDailySummary());
  const [absentTeachers, setAbsentTeachers] = useState<AbsentTeacherSchedule[]>(smartSubstitutionApi.getAbsentTeachers());
  const [vacantPeriods, setVacantPeriods] = useState<SubstitutionPeriod[]>(smartSubstitutionApi.getVacantPeriods());
  const [assignments, setAssignments] = useState<SubstitutionAssignment[]>(smartSubstitutionApi.getAssignments());
  const [notifications, setNotifications] = useState<SubstitutionNotificationLog[]>(smartSubstitutionApi.getNotificationLogs());

  // UI States
  const [activeTab, setActiveTab] = useState<'VACANT_PERIODS' | 'DAILY_GRID' | 'NOTIFICATION_LOG' | 'TEACHER_WORKLOAD'>('VACANT_PERIODS');
  const [selectedPeriodForAssign, setSelectedPeriodForAssign] = useState<SubstitutionPeriod | null>(null);
  const [candidateList, setCandidateList] = useState<TeacherCandidateScore[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [autoAssignToast, setAutoAssignToast] = useState<string | null>(null);
  const [notificationToast, setNotificationToast] = useState<{ title: string; body: string } | null>(null);

  // Absence report form
  const [selectedTeacherToReport, setSelectedTeacherToReport] = useState<string>('stf-006');
  const [absenceReasonText, setAbsenceReasonText] = useState<string>('Medical Leave / Personal Emergency');

  // Reload data from reactive client
  const refreshData = () => {
    setSummary(smartSubstitutionApi.getDailySummary());
    setAbsentTeachers(smartSubstitutionApi.getAbsentTeachers());
    setVacantPeriods(smartSubstitutionApi.getVacantPeriods());
    setAssignments(smartSubstitutionApi.getAssignments());
    setNotifications(smartSubstitutionApi.getNotificationLogs());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = smartSubstitutionApi.subscribe(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, []);

  // Handle opening candidate modal
  const handleOpenAssignModal = (period: SubstitutionPeriod) => {
    setSelectedPeriodForAssign(period);
    const candidates = smartSubstitutionApi.getRecommendedCandidates(period);
    setCandidateList(candidates);
    setIsAssignModalOpen(true);
  };

  // Handle assigning a specific teacher
  const handleAssignCandidate = (candidate: TeacherCandidateScore) => {
    if (!selectedPeriodForAssign) return;

    try {
      const assignment = smartSubstitutionApi.assignProxy({
        periodId: selectedPeriodForAssign.id,
        absentTeacherId: selectedPeriodForAssign.originalTeacherId,
        substituteTeacherId: candidate.teacherId,
        date: new Date().toISOString().split('T')[0],
        periodNumber: selectedPeriodForAssign.periodNumber,
        className: selectedPeriodForAssign.className,
        subjectName: selectedPeriodForAssign.subjectName,
        room: selectedPeriodForAssign.room,
        lessonPlanHandover: selectedPeriodForAssign.lessonPlanNote,
        notifyImmediately: true,
      });

      setIsAssignModalOpen(false);
      setSelectedPeriodForAssign(null);

      // Trigger realistic Toast alert
      setNotificationToast({
        title: `⚡ Proxy Assigned & Instant Alert Sent!`,
        body: `You have substitution in ${assignment.className} - ${assignment.periodName} dispatched to ${assignment.substituteTeacherName}'s phone.`,
      });

      setTimeout(() => {
        setNotificationToast(null);
      }, 6000);
    } catch (e: any) {
      alert(e.message || 'Error assigning proxy');
    }
  };

  // 1-Click Auto Assign All
  const handleAutoAssignAll = () => {
    setIsAutoAssigning(true);
    setTimeout(() => {
      const result = smartSubstitutionApi.autoAssignAllProxies();
      setIsAutoAssigning(false);

      if (result.newAssignmentsCount > 0) {
        setAutoAssignToast(
          `🚀 Auto-Assign Complete! ${result.newAssignmentsCount} periods successfully covered with instant mobile alerts sent.`
        );
        setNotificationToast({
          title: `🔔 Instant Broadcast Dispatched`,
          body: `Substitutions assigned automatically. All substitute teachers received push & WhatsApp notifications.`,
        });
      } else {
        setAutoAssignToast(`All absent periods are already covered!`);
      }

      setTimeout(() => setAutoAssignToast(null), 5000);
      setTimeout(() => setNotificationToast(null), 6000);
    }, 600);
  };

  // Report absence submit
  const handleReportAbsenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherToReport) return;

    smartSubstitutionApi.reportTeacherAbsence(selectedTeacherToReport, absenceReasonText);
    setIsReportModalOpen(false);
    setAutoAssignToast(`Teacher absence recorded. Associated timetable periods are now open for proxy assignment.`);
    setTimeout(() => setAutoAssignToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification for Mobile Alert Simulation */}
      {notificationToast && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full bg-slate-900 border-2 border-indigo-500 shadow-2xl rounded-2xl p-4 text-white animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md animate-pulse">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase">
                  Mobile Push Simulation
                </span>
                <span className="text-xs text-slate-400">Just now</span>
              </div>
              <h4 className="font-semibold text-sm text-white mt-0.5">{notificationToast.title}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 font-mono">
                &ldquo;{notificationToast.body}&rdquo;
              </p>
            </div>
            <button
              onClick={() => setNotificationToast(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" style={{ animationDuration: '4s' }} />
              <span>Smart Proxy / Substitution Engine</span>
              <span className="text-slate-400">|</span>
              <span className="font-normal font-sans">സ്മാർട്ട് സബ്സ്റ്റിറ്റ്യൂഷൻ & ഓട്ടോ-പ്രോക്സി</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Instant Proxy Scheduling & Automated Teacher Substitution
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              ടീച്ചർമാർ ലീവ് ആകുമ്പോൾ അവരുടെ അന്നത്തെ ടൈംടേബിൾ പരിശോധിച്ച്, ഫ്രീ ആയിട്ടുള്ള മറ്റ്
              അനുയോജ്യമായ അധ്യാപകരെ സിസ്റ്റം ഓട്ടോമാറ്റിക് ആയി കണ്ടെത്തി പ്രോക്സി അസൈൻ ചെയ്യുന്നു.
              പകരമുള്ള ടീച്ചർമാരുടെ ഫോണിലേക്ക് ഇൻസ്റ്റന്റ് നോട്ടിഫിക്കേഷൻ തൽക്ഷണം ലഭ്യമാകും!
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={handleAutoAssignAll}
              disabled={isAutoAssigning || vacantPeriods.length === 0}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${
                vacantPeriods.length === 0
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5'
              }`}
            >
              {isAutoAssigning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Matching Faculty...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>1-Click Auto Assign All</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-sm font-semibold transition-all hover:border-slate-600"
            >
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span>Report Teacher Leave</span>
            </button>

            <Link
              href="/teacher/substitution"
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 hover:text-white border border-indigo-400/30 text-sm font-semibold transition-all"
            >
              <Smartphone className="w-4 h-4 text-cyan-300" />
              <span>Teacher Phone View</span>
            </Link>
          </div>
        </div>

        {/* Auto Assign Toast Banner */}
        {autoAssignToast && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-200 text-sm flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{autoAssignToast}</span>
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.totalAbsentTeachers}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Absent Teachers Today
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              അവധിയിലുള്ളവർ
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.totalPeriodsToCover}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Periods to Cover
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              പകരം ക്ലാസുകൾ
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.assignedCount} / {summary.totalPeriodsToCover}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Proxies Assigned ({summary.coveragePercentage}%)
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              കവറേജ് നിരക്ക്
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <CheckCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.acknowledgedCount}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Confirmed on Mobile
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              സ്ഥിരീകരിച്ച ഡ്യൂട്ടികൾ
            </div>
          </div>
        </div>
      </div>

      {/* Absent Teachers Quick Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>Today&apos;s Absent Faculty & Leave Applications</span>
            <span className="text-xs text-slate-400 font-normal">
              (ഇന്ന് അവധിയിലുള്ള അധ്യാപകരുടെ വിവരങ്ങൾ)
            </span>
          </h3>
          <span className="text-xs font-medium text-slate-500">
            Date: {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {absentTeachers.map((teacher) => (
            <div
              key={teacher.teacherId}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60"
            >
              <div className="flex items-center gap-3">
                <img
                  src={teacher.avatarUrl}
                  alt={teacher.teacherName}
                  className="w-11 h-11 rounded-full object-cover border-2 border-rose-400/40"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <span>{teacher.teacherName}</span>
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-sans">
                      ({teacher.teacherNameMl})
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{teacher.department}</span>
                    <span>•</span>
                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                      {teacher.absenceReason}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  {teacher.periods.length} Periods to cover
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('VACANT_PERIODS')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'VACANT_PERIODS'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Vacant Periods & Proxy Assignments</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {summary.totalPeriodsToCover}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('DAILY_GRID')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'DAILY_GRID'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Master Period Matrix (1-8)</span>
          </button>

          <button
            onClick={() => setActiveTab('NOTIFICATION_LOG')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'NOTIFICATION_LOG'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Instant Mobile & WhatsApp Dispatches</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {notifications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('TEACHER_WORKLOAD')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'TEACHER_WORKLOAD'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Faculty Workload & Fair Allocation</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Vacant Periods & Assignments List */}
      {activeTab === 'VACANT_PERIODS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Today&apos;s Substitution Schedule by Period
            </h3>
            <span className="text-xs text-slate-500">
              Showing all periods of absent teachers today
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {absentTeachers.flatMap((t) => t.periods).map((period) => {
              // Find if this period has an assignment
              const assignment = assignments.find(
                (a) => a.absentTeacherId === period.originalTeacherId && a.periodNumber === period.periodNumber
              );

              return (
                <div
                  key={period.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    assignment
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-800/60 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Period & Class Information */}
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                        <span className="text-xs font-semibold text-slate-500">Period</span>
                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                          {period.periodNumber}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-slate-900 dark:text-white">
                            {period.className}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {period.subjectName}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Room {period.room}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {period.timeSlot}
                          </span>
                          <span>•</span>
                          <span>
                            Regular Faculty:{' '}
                            <strong className="text-slate-700 dark:text-slate-200">
                              {period.originalTeacherName}
                            </strong>{' '}
                            <span className="text-rose-500">(Absent)</span>
                          </span>
                        </div>

                        {period.lessonPlanNote && (
                          <div className="mt-2 text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 p-2 rounded-lg border border-slate-200/70 dark:border-slate-700/60 font-mono">
                            <span className="font-semibold text-slate-900 dark:text-white">Lesson Note:</span>{' '}
                            {period.lessonPlanNote}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Proxy Status or Find Proxy Action */}
                    <div className="flex items-center justify-end gap-3 shrink-0">
                      {assignment ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-300/60 dark:border-emerald-800/60">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={assignment.substituteTeacherAvatar}
                              alt={assignment.substituteTeacherName}
                              className="w-9 h-9 rounded-full object-cover border border-emerald-400/50"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{assignment.substituteTeacherName}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">
                                  {assignment.matchScore}% Match
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  {assignment.status === 'ACKNOWLEDGED'
                                    ? '✅ Acknowledged on Phone'
                                    : '🔔 Notification Sent'}
                                </span>
                                <span>•</span>
                                <span>{assignment.assignedAt}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pl-2 border-l border-emerald-200 dark:border-emerald-800">
                            <button
                              onClick={() => handleOpenAssignModal(period)}
                              className="px-2.5 py-1 text-xs rounded-lg font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
                            >
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAssignModal(period)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Find Proxy Teacher</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Master Daily Period Matrix */}
      {activeTab === 'DAILY_GRID' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Master Daily Period Matrix (Periods 1 to 8)
              </h3>
              <p className="text-xs text-slate-500">
                School-wide timetable slot view indicating regular vs substituted sessions
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block" />
                <span>Regular Active</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-500/20 border border-indigo-500/40 inline-block" />
                <span>Proxy Assigned</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40 inline-block" />
                <span>Vacant (Needs Cover)</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Faculty Member</th>
                  <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Dept</th>
                  {PERIOD_SLOTS.map((s) => (
                    <th key={s.number} className="p-2.5 font-bold text-center text-slate-600 dark:text-slate-300">
                      <div>{s.name}</div>
                      <div className="text-[10px] font-normal text-slate-400">{s.timeSlot.split(' - ')[0]}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {TEACHER_PROFILES.map((teacher) => {
                  const isAbsent = absentTeachers.some((a) => a.teacherId === teacher.id);
                  const schedule = smartSubstitutionApi.getTeacherRegularSchedule(teacher.id);

                  return (
                    <tr
                      key={teacher.id}
                      className={isAbsent ? 'bg-rose-50/30 dark:bg-rose-950/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}
                    >
                      <td className="p-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={teacher.avatarUrl}
                            alt={teacher.name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <div>{teacher.name}</div>
                            {isAbsent && (
                              <span className="text-[10px] text-rose-500 font-bold uppercase">
                                ABSENT TODAY
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">{teacher.department}</td>

                      {PERIOD_SLOTS.map((slot) => {
                        const regularClass = schedule.find((s) => s.periodNumber === slot.number);
                        const proxyAssignment = assignments.find(
                          (a) => a.substituteTeacherId === teacher.id && a.periodNumber === slot.number
                        );
                        const absentAssignment = isAbsent
                          ? assignments.find(
                              (a) => a.absentTeacherId === teacher.id && a.periodNumber === slot.number
                            )
                          : null;

                        return (
                          <td key={slot.number} className="p-1.5 text-center">
                            {isAbsent ? (
                              absentAssignment ? (
                                <div className="p-1 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30 text-[10px]">
                                  <div className="font-bold">{absentAssignment.className}</div>
                                  <div className="text-[9px] truncate">Proxy: {absentAssignment.substituteTeacherName.split(' ')[1] || absentAssignment.substituteTeacherName}</div>
                                </div>
                              ) : (
                                <div className="p-1 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-400/30 text-[10px]">
                                  <div className="font-bold">{regularClass ? regularClass.className : 'Vacant'}</div>
                                  <div className="text-[9px]">Unassigned</div>
                                </div>
                              )
                            ) : proxyAssignment ? (
                              <div className="p-1 rounded bg-indigo-600 text-white shadow text-[10px]">
                                <div className="font-bold">{proxyAssignment.className}</div>
                                <div className="text-[9px]">Proxy Duty</div>
                              </div>
                            ) : regularClass ? (
                              <div className="p-1 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-[10px]">
                                <div className="font-bold">{regularClass.className}</div>
                                <div className="text-[9px] text-slate-500">{regularClass.room}</div>
                              </div>
                            ) : (
                              <div className="p-1 text-slate-300 dark:text-slate-600 text-[11px] font-mono">
                                — Free —
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Instant Mobile & WhatsApp Dispatches */}
      {activeTab === 'NOTIFICATION_LOG' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispatch Log List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Real-Time Notification Dispatch Trail
              </h3>
              <span className="text-xs text-slate-500">
                {notifications.length} alerts delivered to mobile phones
              </span>
            </div>

            <div className="space-y-3">
              {notifications.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        <MessageCircle className="w-4 h-4" />
                      </span>
                      <strong className="text-sm text-slate-900 dark:text-white">
                        {log.teacherName}
                      </strong>
                      <span className="text-xs text-slate-500 font-mono">
                        ({log.teacherPhone})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Delivered ({log.sentAt})
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {log.title}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 font-sans leading-relaxed">
                    {log.body}
                  </p>

                  <div className="text-[11px] text-slate-500 font-sans">
                    {log.bodyMl}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Phone Simulator showing Push Notification */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-500" />
              <span>Teacher Phone Lockscreen Preview</span>
            </h3>

            <div className="bg-slate-950 border-4 border-slate-800 rounded-[36px] p-4 shadow-2xl relative overflow-hidden text-white min-h-[460px] flex flex-col justify-between">
              {/* Phone Notch */}
              <div className="w-24 h-4 bg-slate-800 rounded-b-xl mx-auto -mt-2 mb-4" />

              {/* Time & Date Display */}
              <div className="text-center space-y-1 mb-6">
                <div className="text-4xl font-extralight tracking-tight font-mono">
                  09:41
                </div>
                <div className="text-xs text-slate-400">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Lockscreen Notification Cards */}
              <div className="space-y-3 flex-1">
                {notifications.slice(0, 2).map((notif, idx) => (
                  <div
                    key={notif.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-lg backdrop-blur-md animate-in slide-in-from-top-2 duration-300"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span>HUSTLERTECH SCHOOL ERP</span>
                      </div>
                      <span>{notif.sentAt}</span>
                    </div>

                    <div className="font-bold text-xs text-white">
                      {notif.title}
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                      &ldquo;{notif.body}&rdquo;
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" />
                        <span>Instant Push Notification</span>
                      </span>
                      <span className="text-indigo-400 underline font-medium cursor-pointer">
                        View Duty &gt;
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Phone Indicator */}
              <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-4" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Faculty Workload & Fair Allocation */}
      {activeTab === 'TEACHER_WORKLOAD' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Faculty Daily Workload & Proxy Distribution Equity
            </h3>
            <p className="text-xs text-slate-500">
              The engine automatically prioritizes faculty with lighter workloads to avoid teacher burnout
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEACHER_PROFILES.map((teacher) => {
              const schedule = smartSubstitutionApi.getTeacherRegularSchedule(teacher.id);
              const proxyCount = assignments.filter((a) => a.substituteTeacherId === teacher.id).length;
              const totalClasses = schedule.length + proxyCount;
              const isAbsent = absentTeachers.some((a) => a.teacherId === teacher.id);

              return (
                <div
                  key={teacher.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={teacher.avatarUrl}
                      alt={teacher.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {teacher.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {teacher.primarySubject} • {teacher.department}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Classes: {teacher.assignedClasses.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    {isAbsent ? (
                      <span className="px-2 py-1 rounded text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        Absent Today
                      </span>
                    ) : (
                      <>
                        <div className="text-lg font-black text-slate-900 dark:text-white">
                          {totalClasses} / {teacher.maxPeriodsPerDay}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {schedule.length} regular + {proxyCount} proxy
                        </div>
                        <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden ml-auto">
                          <div
                            className={`h-full ${
                              totalClasses > 4 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${(totalClasses / teacher.maxPeriodsPerDay) * 100}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Candidate Recommendation Modal */}
      {isAssignModalOpen && selectedPeriodForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Smart Recommendation Engine
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Find Proxy for {selectedPeriodForAssign.className} - {selectedPeriodForAssign.periodName}
                </h3>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>Subject: {selectedPeriodForAssign.subjectName}</span>
                  <span>•</span>
                  <span>Time: {selectedPeriodForAssign.timeSlot}</span>
                  <span>•</span>
                  <span>Room: {selectedPeriodForAssign.room}</span>
                </div>
              </div>

              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Ranked Candidates List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              <div className="text-xs font-semibold text-slate-500">
                Ranked by AI Scoring Algorithm (Availability, Subject Fit, Workload Equity & Class Familiarity):
              </div>

              {candidateList.map((candidate, idx) => (
                <div
                  key={candidate.teacherId}
                  className={`p-4 rounded-2xl border transition-all ${
                    candidate.isAvailable
                      ? idx === 0
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800/80 shadow-md ring-1 ring-indigo-400/30'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                      : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={candidate.avatarUrl}
                        alt={candidate.teacherName}
                        className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-300 dark:border-slate-600"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm text-slate-900 dark:text-white">
                            {candidate.teacherName}
                          </strong>
                          <span className="text-xs text-slate-400 font-sans">
                            ({candidate.teacherNameMl})
                          </span>

                          {idx === 0 && candidate.isAvailable && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30 flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              <span>Top Match</span>
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{candidate.department}</span>
                          <span>•</span>
                          <span>{candidate.currentPeriodsToday} classes today</span>
                        </div>

                        {/* Reasons Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {candidate.reasons.map((reason, rIdx) => (
                            <span
                              key={rIdx}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                candidate.isAvailable
                                  ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Match Score & Action */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                      {candidate.isAvailable ? (
                        <>
                          <div className="text-right">
                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                              {candidate.matchScore}%
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              Match Score
                            </span>
                          </div>

                          <button
                            onClick={() => handleAssignCandidate(candidate)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all hover:-translate-y-0.5 flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Assign & Notify</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-right text-xs text-rose-500 font-semibold">
                          Unavailable
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Absence Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Record Teacher Absence / Leave
              </h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              When a teacher is recorded on leave, their timetable slots for today will immediately open
              for proxy assignment.
            </p>

            <form onSubmit={handleReportAbsenceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Teacher
                </label>
                <select
                  value={selectedTeacherToReport}
                  onChange={(e) => setSelectedTeacherToReport(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {TEACHER_PROFILES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.department} - {t.primarySubject})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Absence
                </label>
                <input
                  type="text"
                  value={absenceReasonText}
                  onChange={(e) => setAbsenceReasonText(e.target.value)}
                  placeholder="e.g. Sick Leave, Family Emergency, Official Training"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow"
                >
                  Confirm Absence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
