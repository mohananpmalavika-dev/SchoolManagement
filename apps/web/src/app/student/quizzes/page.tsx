'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StudentMCQQuizRunner } from '@/components/lms/StudentMCQQuizRunner';

export default function StudentQuizzesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>തിരികെ ഡാഷ്‌ബോർഡിലേക്ക് (Back to Dashboard)</span>
        </Link>

        <Link
          href="/dashboard/lms"
          className="text-xs font-semibold text-indigo-600 hover:underline"
        >
          Open Master LMS Hub
        </Link>
      </div>

      <StudentMCQQuizRunner />
    </div>
  );
}
