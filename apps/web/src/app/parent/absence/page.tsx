'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ParentAbsencePortal } from '@/components/attendance/ParentAbsencePortal';

export default function DirectParentAbsencePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-gray-500 hover:text-indigo-600 flex items-center gap-1.5 transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
      <ParentAbsencePortal />
    </div>
  );
}
