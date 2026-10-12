'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  GraduationCap,
  MessageCircle,
  Search,
  Sparkles,
  TrendingDown,
  UserCheck,
  Users,
} from 'lucide-react';
import type { PredictiveAnalyticsReport, StudentRiskProfile } from '@krypton/types';
import { EarlyWarningRadarChart } from './EarlyWarningRadarChart';
import { StudentInterventionModal } from './StudentInterventionModal';
import { Button } from '../ui';

interface EarlyWarningRadarViewProps {
  report: PredictiveAnalyticsReport;
  onRefresh?: () => void;
}

type QuickFilter = 'ALL' | 'HIGH' | 'MODERATE' | 'ACADEMIC_ALERT' | 'HOMEWORK_ALERT' | 'ATTENDANCE_ALERT';

export function EarlyWarningRadarView({ report, onRefresh }: EarlyWarningRadarViewProps) {
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<StudentRiskProfile | null>(null);

  const students = report.students ?? [];

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesQuery = `${s.name} ${s.admissionNumber} ${s.className}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesClass = !classFilter || s.classId === classFilter || (!s.classId && classFilter === 'unassigned');

    if (!matchesQuery || !matchesClass) return false;

    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'HIGH') return s.overall === 'HIGH';
    if (activeFilter === 'MODERATE') return s.overall === 'MODERATE';
    if (activeFilter === 'ACADEMIC_ALERT') return s.academic.level === 'HIGH' || s.academic.level === 'MODERATE';
    if (activeFilter === 'HOMEWORK_ALERT') return s.homework.level === 'HIGH' || s.homework.level === 'MODERATE';
    if (activeFilter === 'ATTENDANCE_ALERT') return s.dropout.level === 'HIGH' || s.dropout.level === 'MODERATE';

    return true;
  });

  const highCount = students.filter(s => s.overall === 'HIGH').length;
  const modCount = students.filter(s => s.overall === 'MODERATE').length;
  const homeworkAlertCount = students.filter(s => s.homework.level === 'HIGH' || s.homework.level === 'MODERATE').length;
  const academicAlertCount = students.filter(s => s.academic.level === 'HIGH' || s.academic.level === 'MODERATE').length;
  const attendanceAlertCount = students.filter(s => s.dropout.level === 'HIGH' || s.dropout.level === 'MODERATE').length;

  return (
    <div className="space-y-6">
      {/* Quick Summary Pill Bar */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeFilter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>All Students (എല്ലാവരും)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
            {students.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('HIGH')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeFilter === 'HIGH'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50/50'
          }`}
        >
          <span>🔴 High At-Risk (അടിയന്തിര ശ്രദ്ധ)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200">
            {highCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('MODERATE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeFilter === 'MODERATE'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50/50'
          }`}
        >
          <span>🟡 Moderate Support</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
            {modCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('HOMEWORK_ALERT')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeFilter === 'HOMEWORK_ALERT'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50 hover:bg-orange-50/50'
          }`}
        >
          <BookOpen size={13} />
          <span>Homework Deficit (ഹോംവർക്ക്)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200">
            {homeworkAlertCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('ACADEMIC_ALERT')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeFilter === 'ACADEMIC_ALERT'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50 hover:bg-purple-50/50'
          }`}
        >
          <GraduationCap size={13} />
          <span>Exam Warning (പരീക്ഷാ മാർക്ക്)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200">
            {academicAlertCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('ATTENDANCE_ALERT')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
            activeFilter === 'ATTENDANCE_ALERT'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50/50'
          }`}
        >
          <Clock size={13} />
          <span>Attendance Alert (ഹാജർ)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
            {attendanceAlertCount}
          </span>
        </button>
      </div>

      {/* Search & Class Selector Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search student or admission number..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Filter size={14} />
            <span>Class:</span>
          </div>
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Classes ({report.classes.length})</option>
            {report.classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {/* Student Radar Grid */}
      {!filteredStudents.length ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No students match this radar filter</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try switching filter to &apos;All Students&apos; or adjusting your search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(student => {
            const isHigh = student.overall === 'HIGH';
            const isMod = student.overall === 'MODERATE';

            const cardBorderColor = isHigh
              ? 'border-rose-200 dark:border-rose-900/50 hover:border-rose-300 dark:hover:border-rose-700 shadow-rose-100/50 dark:shadow-rose-950/20'
              : isMod
              ? 'border-amber-200 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-700 shadow-amber-100/50 dark:shadow-amber-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700';

            return (
              <div
                key={student.studentId}
                className={`relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-300 hover:shadow-xl ${cardBorderColor}`}
              >
                {/* Card Top: Student Identity & Priority Badge */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-md ${
                          isHigh
                            ? 'bg-gradient-to-tr from-rose-600 to-red-500 ring-2 ring-rose-300 dark:ring-rose-800'
                            : isMod
                            ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 ring-2 ring-amber-300 dark:ring-amber-800'
                            : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                        }`}
                      >
                        {student.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                          {student.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {student.admissionNumber} · {student.className}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isHigh
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : isMod
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {isHigh ? 'High Risk' : isMod ? 'Moderate' : 'On Track'}
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {student.priorityScore ?? student.radarMetrics.compositeRiskScore}/100 Risk
                      </p>
                    </div>
                  </div>

                  {/* Embedded Mini Radar Spider Chart */}
                  <div className="my-3 py-1 flex items-center justify-center bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <EarlyWarningRadarChart
                      metrics={student.radarMetrics}
                      size={200}
                      showLabels={false}
                    />
                  </div>

                  {/* The 3 Core Pillars Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 my-3 text-center">
                    {/* Pillar 1: Exam */}
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Exams</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {student.metrics.latestAverage !== null ? `${student.metrics.latestAverage}%` : 'N/A'}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {student.academic.level === 'HIGH' ? '🔴 Falling' : 'Stable'}
                      </div>
                    </div>

                    {/* Pillar 2: Attendance */}
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Attend.</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {student.metrics.attendanceRate !== null ? `${student.metrics.attendanceRate}%` : 'N/A'}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {student.dropout.level === 'HIGH' ? '🔴 Low' : 'Steady'}
                      </div>
                    </div>

                    {/* Pillar 3: Homework */}
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Homework</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {student.metrics.homeworkCompletionRate !== null ? `${student.metrics.homeworkCompletionRate}%` : 'N/A'}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {student.metrics.homeworkMissingCount > 0
                          ? `⚠️ ${student.metrics.homeworkMissingCount} Missed`
                          : 'Complete'}
                      </div>
                    </div>
                  </div>

                  {/* Warning Highlight Snippet */}
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 flex items-start gap-2">
                    <Sparkles size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                    <p className="line-clamp-2 text-[11px] leading-relaxed">
                      {student.homework.evidence[1] || student.academic.evidence[0] || 'Learning metrics stable this term.'}
                    </p>
                  </div>
                </div>

                {/* Card Actions Bottom */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 justify-center text-xs"
                    onClick={() => setSelectedStudent(student)}
                  >
                    Intervention Plan (നിർദ്ദേശങ്ങൾ)
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      const msg = encodeURIComponent(
                        `Dear Parent of ${student.name} (${student.admissionNumber}), this is an early learning alert from the School. Please contact our class teacher regarding recent academic and homework progress.`
                      );
                      window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
                    }}
                    title="Send Parent WhatsApp"
                    className="p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800"
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Intervention Modal Drawer */}
      <StudentInterventionModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        currency={report.currency}
      />
    </div>
  );
}
