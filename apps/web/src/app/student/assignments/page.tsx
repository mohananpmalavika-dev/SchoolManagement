'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Smartphone, BookOpen, Timer } from 'lucide-react';
import { StudentHomeworkPortal } from '@/components/lms/StudentHomeworkPortal';
import { StudentWorkspace } from '@/components/StudentWorkspace';

export default function StudentAssignmentsPage() {
  const [mode, setMode] = useState<'MOBILE_PORTAL' | 'CLASSIC'>('MOBILE_PORTAL');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            സ്റ്റുഡന്റ് അസൈൻമെന്റ് പോർട്ടൽ • Student Assignments
          </span>
          <h1 className="text-2xl font-black text-gray-900 mt-1">
            ഹോംവർക്ക് & അസൈൻമെന്റുകൾ
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/student/quizzes"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5 transition-all"
          >
            <Timer size={14} />
            <span>ഓൺലൈൻ മോഡൽ എക്സാമുകൾ (MCQ Quizzes)</span>
          </Link>

          <div className="bg-gray-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setMode('MOBILE_PORTAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'MOBILE_PORTAL' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600'
              }`}
            >
              ഫോട്ടോ/PDF സബ്മിഷൻ
            </button>
            <button
              onClick={() => setMode('CLASSIC')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'CLASSIC' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-600'
              }`}
            >
              ക്ലാസിക് വ്യൂ
            </button>
          </div>
        </div>
      </div>

      {mode === 'MOBILE_PORTAL' ? <StudentHomeworkPortal /> : <StudentWorkspace view="assignments" />}
    </div>
  );
}