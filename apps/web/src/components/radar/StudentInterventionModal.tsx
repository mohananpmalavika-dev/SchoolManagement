'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  ExternalLink,
  GraduationCap,
  Languages,
  MessageCircle,
  Send,
  Sparkles,
  TrendingDown,
  UserCheck,
  X,
  BookOpen,
  FileCheck,
} from 'lucide-react';
import type { StudentRiskProfile } from '@krypton/types';
import { apiClient } from '@/lib/api-client';
import { messageFor } from '@/lib/workspace';
import { EarlyWarningRadarChart } from './EarlyWarningRadarChart';
import { Button } from '../ui';

interface StudentInterventionModalProps {
  student: StudentRiskProfile | null;
  onClose: () => void;
  currency?: string;
}

export function StudentInterventionModal({
  student,
  onClose,
  currency = 'KES',
}: StudentInterventionModalProps) {
  const [lang, setLang] = useState<'ml' | 'en'>('ml');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [checkedTeacherTasks, setCheckedTeacherTasks] = useState<Record<number, boolean>>({});

  if (!student) return null;

  const isHighRisk = student.overall === 'HIGH';
  const isModerateRisk = student.overall === 'MODERATE';

  const riskBadge = isHighRisk ? (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
      🔴 High At-Risk (അടിയന്തിര ശ്രദ്ധ)
    </span>
  ) : isModerateRisk ? (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
      🟡 Moderate Support (ശ്രദ്ധ നൽകണം)
    </span>
  ) : (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
      🟢 On Track (തൃപ്തികരം)
    </span>
  );

  const toggleTask = (index: number) => {
    setCheckedTeacherTasks(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const teacherAdviceList =
    lang === 'ml' && student.interventions?.malayalamSummary?.teacherAdvice?.length
      ? student.interventions.malayalamSummary.teacherAdvice
      : student.interventions?.teacherActions ?? [];

  const parentAdviceList =
    lang === 'ml' && student.interventions?.malayalamSummary?.parentAdvice?.length
      ? student.interventions.malayalamSummary.parentAdvice
      : student.interventions?.parentGuidance ?? [];

  const handleSendWhatsApp = () => {
    const parentMsg =
      lang === 'ml'
        ? `പ്രിയ രക്ഷിതാവേ, ${student.name} ന്റെ (${student.admissionNumber}) പഠനനിലവാരത്തെ സംബന്ധിച്ച് സ്കൂളിൽ നിന്നുള്ള അറിയിപ്പാണിത്. പരീക്ഷാ മാർക്ക് (${student.metrics.latestAverage ?? 'N/A'}%), ഹാജർനില (${student.metrics.attendanceRate ?? 'N/A'}%), ഹോംവർക്ക് സബ്മിഷൻ (${student.metrics.homeworkCompletionRate ?? 'N/A'}%) എന്നിവയിൽ കുട്ടിയെ സഹായിക്കാൻ അധ്യാപകരുമായി ഉടൻ സംസാരിക്കാൻ അഭ്യർത്ഥിക്കുന്നു.`
        : `Dear Parent of ${student.name} (${student.admissionNumber}), this is an early learning update from the School. Based on our AI radar (Exams: ${student.metrics.latestAverage ?? 'N/A'}%, Attendance: ${student.metrics.attendanceRate ?? 'N/A'}%, Homework: ${student.metrics.homeworkCompletionRate ?? 'N/A'}%), our class teacher would like to collaborate with you to support ${student.name}'s progress.`;

    const url = `https://wa.me/?text=${encodeURIComponent(parentMsg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDispatchOfficialIntervention = async () => {
    setSending(true);
    setError('');
    setSentSuccess(null);
    try {
      const response = await apiClient.post('/predictive-analytics/intervene', {
        studentId: student.studentId,
        channel: 'WHATSAPP',
        language: lang,
        meetingRequested: true,
      });
      setSentSuccess(`Official intervention recorded and sent! Notification dispatched.`);
      if (response.data.whatsappUrl) {
        window.open(response.data.whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intervention-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="intervention-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
                  {student.name}
                </h2>
                {riskBadge}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {student.admissionNumber} · {student.className} · Priority Index:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {student.priorityScore ?? student.radarMetrics.compositeRiskScore}/100
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setLang('ml')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  lang === 'ml'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                മലയാളം
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  lang === 'en'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-sm border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {sentSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-sm border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>{sentSuccess}</span>
            </div>
          )}

          {/* Top Section: Radar Chart & The 3 Analysis Pillars */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Radar Spider Visualization */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-500" />
                AI Early Warning Radar Analysis
              </h3>
              <EarlyWarningRadarChart metrics={student.radarMetrics} size={250} />
            </div>

            {/* The 3 Core Pillars: Exam Marks, Attendance, Homework */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Core Academic Warning Pillars (പ്രധാന ഘടകങ്ങൾ)
              </h3>

              {/* Pillar 1: Exam Marks (പരീക്ഷാ മാർക്ക്) */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <GraduationCap size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      1. Exam Marks (പരീക്ഷാ മാർക്ക്)
                    </h4>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {student.metrics.latestAverage !== null ? `${student.metrics.latestAverage}% Avg` : 'No Exam Data'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {student.academic.evidence.join(' ')}
                  </p>
                </div>
              </div>

              {/* Pillar 2: Attendance Status (ഹാജർ നില) */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Clock size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      2. Attendance Status (ഹാജർ നില)
                    </h4>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {student.metrics.attendanceRate !== null ? `${student.metrics.attendanceRate}% Attendance` : 'Limited Records'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {student.dropout.evidence.join(' ')}
                  </p>
                </div>
              </div>

              {/* Pillar 3: Homework Submissions (ഹോംവർക്ക് സബ്മിഷൻ) */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <BookOpen size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      3. Homework Submissions (ഹോംവർക്ക് സബ്മിഷൻ)
                    </h4>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {student.metrics.homeworkCompletionRate !== null
                        ? `${student.metrics.homeworkCompletionRate}% Submitted`
                        : 'No HW Records'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {student.homework.evidence.join(' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Interventions Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Teacher Intervention Protocol (അധ്യാപകർക്കുള്ള നിർദ്ദേശങ്ങൾ) */}
            <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                  <UserCheck size={18} className="text-indigo-600" />
                  {lang === 'ml' ? 'അധ്യാപകർക്കുള്ള ഇന്റർവെൻഷൻ നിർദ്ദേശങ്ങൾ' : 'Teacher Actionable Intervention Plan'}
                </h4>
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100/60 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                  Classroom Protocol
                </span>
              </div>
              <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">
                {lang === 'ml'
                  ? 'പഠനത്തിൽ പിന്നാക്കം പോകുന്ന കുട്ടിയെ സഹായിക്കാൻ അധ്യാപകർ ചെയ്യേണ്ട കാര്യങ്ങൾ:'
                  : 'Targeted actions for the class teacher and subject instructors:'}
              </p>
              <ul className="space-y-2.5">
                {teacherAdviceList.map((advice, i) => (
                  <li
                    key={i}
                    onClick={() => toggleTask(i)}
                    className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer p-2 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedTeacherTasks[i]}
                      onChange={() => toggleTask(i)}
                      className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <span className={checkedTeacherTasks[i] ? 'line-through text-slate-400' : ''}>
                      {advice}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Parent Guidance Protocol (രക്ഷിതാക്കൾക്കുള്ള നിർദ്ദേശങ്ങൾ) */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-600" />
                  {lang === 'ml' ? 'രക്ഷിതാക്കൾക്കുള്ള നിർദ്ദേശങ്ങൾ' : 'Parent Home-Support Guidance'}
                </h4>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                  Home Partnership
                </span>
              </div>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                {lang === 'ml'
                  ? 'കുട്ടിയുടെ പഠന പുരോഗതിക്കായി രക്ഷിതാക്കൾ വീട്ടിൽ ശ്രദ്ധിക്കേണ്ട കാര്യങ്ങൾ:'
                  : 'Practical, supportive recommendations to communicate to the parents:'}
              </p>
              <ul className="space-y-2.5">
                {parentAdviceList.map((guidance, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 p-2 rounded-lg bg-white/60 dark:bg-slate-800/40"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{guidance}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer with Direct Multi-Channel Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Instant parent alert & intervention dispatch triggers
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* WhatsApp Alert Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSendWhatsApp}
              leftIcon={<MessageCircle size={15} className="text-emerald-600" />}
            >
              {lang === 'ml' ? 'വാട്‌സ്ആപ്പ് അറിയിപ്പ് അയക്കുക' : 'Send WhatsApp Notice'}
            </Button>

            {/* Schedule PTM Meeting */}
            <Link href={`/school/calendar`} passHref>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Calendar size={15} />}
              >
                {lang === 'ml' ? 'കൂടിക്കാഴ്ച ക്രമീകരിക്കുക' : 'Schedule PTM'}
              </Button>
            </Link>

            {/* Official Intervention Dispatch */}
            <Button
              type="button"
              size="sm"
              isLoading={sending}
              onClick={handleDispatchOfficialIntervention}
              leftIcon={<Send size={15} />}
            >
              {lang === 'ml' ? 'ഇന്റർവെൻഷൻ രേഖപ്പെടുത്തുക' : 'Dispatch Intervention'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
