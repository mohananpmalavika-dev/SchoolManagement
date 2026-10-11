'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, Sparkles, BookOpen } from 'lucide-react';
import { LearningManagement } from '@/components/LearningManagement';
import { HomeworkTeacherManager } from '@/components/lms/HomeworkTeacherManager';
import { QuizTeacherManager } from '@/components/lms/QuizTeacherManager';

export default function TeacherLearningPage() {
  const [viewMode, setViewMode] = useState<'HOMEWORK' | 'QUIZZES' | 'RESOURCES'>('HOMEWORK');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner & Sub Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
              ടീച്ചർ ലേണിംഗ് ഹബ് • Teacher LMS Portal
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mt-1">
            ഹോംവർക്ക്, അസൈൻമെന്റുകൾ & മോഡൽ എക്സാമുകൾ
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setViewMode('HOMEWORK')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'HOMEWORK'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ഹോംവർക്ക് & ഫോട്ടോ/PDF മൂല്യനിർണ്ണയം
          </button>
          <button
            onClick={() => setViewMode('QUIZZES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'QUIZZES'
                ? 'bg-white text-violet-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ടൈമർ MCQ ക്വിസ് ക്രിയേറ്റർ
          </button>
          <button
            onClick={() => setViewMode('RESOURCES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'RESOURCES'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            റിസോഴ്സ് ടേബിൾ
          </button>
        </div>
      </div>

      {viewMode === 'HOMEWORK' && <HomeworkTeacherManager />}
      {viewMode === 'QUIZZES' && <QuizTeacherManager />}
      {viewMode === 'RESOURCES' && <LearningManagement />}
    </div>
  );
}