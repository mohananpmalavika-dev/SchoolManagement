'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Camera,
  Timer,
  CheckCircle2,
  Sparkles,
  Smartphone,
  GraduationCap,
  Users,
  Award,
  ArrowRight,
  FileText,
  BarChart2,
  Clock,
  Layers,
} from 'lucide-react';
import { HomeworkTeacherManager } from '@/components/lms/HomeworkTeacherManager';
import { StudentHomeworkPortal } from '@/components/lms/StudentHomeworkPortal';
import { StudentMCQQuizRunner } from '@/components/lms/StudentMCQQuizRunner';
import { QuizTeacherManager } from '@/components/lms/QuizTeacherManager';
import { LMSStore } from '@/lib/lms-client';

export type LMSTabType = 'TEACHER_HOMEWORK' | 'STUDENT_HOMEWORK' | 'STUDENT_QUIZ' | 'TEACHER_QUIZ';

export default function LMSHubPage() {
  const [activeTab, setActiveTab] = useState<LMSTabType>('TEACHER_HOMEWORK');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const stats = LMSStore.getOverviewStats();

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const TABS = [
    {
      id: 'TEACHER_HOMEWORK' as const,
      label: 'Teacher: Homework & Evaluation',
      labelMl: 'ടീച്ചർ: ഹോംവർക്ക് & മൂല്യനിർണ്ണയം',
      icon: FileText,
      badge: 'Photo & PDF Evaluation',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      description: 'Upload worksheets, review submitted photos & PDFs, grade with feedback.',
    },
    {
      id: 'STUDENT_HOMEWORK' as const,
      label: 'Student: Mobile Homework Submission',
      labelMl: 'കുട്ടികൾ: മൊബൈൽ ഫോട്ടോ & PDF സബ്മിഷൻ',
      icon: Smartphone,
      badge: 'Mobile Camera & PDF',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      description: 'Submit notebook photos & PDF documents via mobile, view marks & feedback.',
    },
    {
      id: 'STUDENT_QUIZ' as const,
      label: 'Student: Timed MCQ Model Exam',
      labelMl: 'കുട്ടികൾ: ടൈമർ വെച്ചുള്ള മോഡൽ എക്സാം',
      icon: Timer,
      badge: 'Instant Auto-Grading',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      description: 'Timed online exam with instant automated mark calculation & answer review.',
    },
    {
      id: 'TEACHER_QUIZ' as const,
      label: 'Teacher: Quiz Creator & Analytics',
      labelMl: 'ടീച്ചർ: മോഡൽ എക്സാം ക്രിയേറ്റർ',
      icon: BarChart2,
      badge: 'Leaderboard & Analytics',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-400/30',
      description: 'Design timed MCQ quizzes, configure question banks, view class leaderboard.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-70 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-700 flex items-center gap-2.5 text-xs font-semibold animate-slideIn">
          <Sparkles className="text-amber-400" size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/40 relative overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <GraduationCap size={14} />
                  Digital Learning Management System (LMS)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ● Live Cloud Sync
                </span>
                <span className="text-xs text-slate-400 font-mono">Academic Year 2026-27</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                ഡിജിറ്റൽ ലേണിംഗ് മാനേജ്മെന്റ് സിസ്റ്റം (LMS)
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                ഹോംവർക്ക് & അസൈൻമെന്റുകൾ ഫോണിലൂടെ ഫോട്ടോയോ PDF-ഓ ആയി സമർപ്പിക്കലും, ടൈമർ വെച്ചുള്ള തത്സമയ ഓട്ടോമാറ്റിക് മാർക്ക് കാൽക്കുലേഷൻ നൽകുന്ന ഓൺലൈൻ മോഡൽ എക്സാമുകളും.
              </p>
            </div>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-xs">
                <div className="text-xl font-bold text-white">{stats.totalAssignments}</div>
                <div className="text-[11px] text-slate-400">Assignments</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-xs">
                <div className="text-xl font-bold text-emerald-400">{stats.gradedSubmissionsCount}</div>
                <div className="text-[11px] text-slate-400">Evaluated</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-xs">
                <div className="text-xl font-bold text-amber-400">{stats.totalQuizzes}</div>
                <div className="text-[11px] text-slate-400">Model Exams</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-xs">
                <div className="text-xl font-bold text-indigo-300">{stats.avgQuizScorePercentage}%</div>
                <div className="text-[11px] text-slate-400">Avg Score</div>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Mode Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-left p-4 rounded-2xl border transition-all duration-200 relative group ${
                    isActive
                      ? 'bg-white text-slate-900 border-white shadow-xl scale-[1.02] ring-2 ring-indigo-400/50'
                      : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-200'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tab.badgeColor}`}
                    >
                      {tab.badge}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h2
                      className={`text-sm font-bold leading-tight ${
                        isActive ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {tab.label}
                    </h2>
                    <p
                      className={`text-xs mt-0.5 font-medium ${
                        isActive ? 'text-indigo-900' : 'text-slate-400'
                      }`}
                    >
                      {tab.labelMl}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 pt-6">
        {activeTab === 'TEACHER_HOMEWORK' && (
          <HomeworkTeacherManager onNotify={showNotification} />
        )}

        {activeTab === 'STUDENT_HOMEWORK' && (
          <StudentHomeworkPortal onNotify={showNotification} />
        )}

        {activeTab === 'STUDENT_QUIZ' && (
          <StudentMCQQuizRunner onNotify={showNotification} />
        )}

        {activeTab === 'TEACHER_QUIZ' && (
          <QuizTeacherManager onNotify={showNotification} />
        )}
      </main>
    </div>
  );
}
