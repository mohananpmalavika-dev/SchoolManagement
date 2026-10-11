'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  QrCode,
  MonitorPlay,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Smartphone,
  Printer,
  CalendarDays,
  ExternalLink,
} from 'lucide-react';
import { StaffGeofenceCheckIn } from '@/components/attendance/StaffGeofenceCheckIn';
import { StudentQRScannerAndIDCard } from '@/components/attendance/StudentQRScannerAndIDCard';
import { DynamicProjectorScreen } from '@/components/attendance/DynamicProjectorScreen';
import { ParentAbsencePortal } from '@/components/attendance/ParentAbsencePortal';

export type SmartAttendanceTab = 'STAFF_GEOFENCE' | 'STUDENT_QR' | 'PROJECTOR_DYNAMIC' | 'PARENT_ABSENCE';

export default function SmartAttendanceHubPage() {
  const [activeTab, setActiveTab] = useState<SmartAttendanceTab>('STAFF_GEOFENCE');

  const TABS = [
    {
      id: 'STAFF_GEOFENCE' as const,
      label: 'Geofenced Staff Mobile Attendance',
      labelMl: 'സ്റ്റാഫ് ജിയോ-ഫെൻസ് ചെക്ക്-ഇൻ',
      icon: MapPin,
      badge: 'GPS Mobile Verification',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    },
    {
      id: 'STUDENT_QR' as const,
      label: 'Student ID Card QR & Scanner',
      labelMl: 'സ്റ്റുഡന്റ് ക്യുആർ സ്കാനർ & ഐഡി കാർഡ്',
      icon: QrCode,
      badge: 'Zero-Hardware Scanner',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    },
    {
      id: 'PROJECTOR_DYNAMIC' as const,
      label: 'Dynamic QR Projector / Screen',
      labelMl: 'പ്രൊജക്ടർ ഡൈനാമിക് സ്ക്രീൻ',
      icon: MonitorPlay,
      badge: 'Anti-Fraud Dynamic Token',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    },
    {
      id: 'PARENT_ABSENCE' as const,
      label: 'Parent Planned Absence Portal',
      labelMl: 'രക്ഷിതാക്കളുടെ മുൻകൂട്ടി ലീവ് അപേക്ഷ',
      icon: FileText,
      badge: 'Auto Excused Sync',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                100% HARDWARE-FREE SMART ATTENDANCE • ബയോമെട്രിക് മെഷീൻ ഇല്ലാതെ പഴുതടച്ച അറ്റൻഡൻസ്
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Smart Software Attendance Suite
            </h1>
            <p className="text-sm text-indigo-200 mt-2 max-w-2xl leading-relaxed">
              GPS ജിയോ-ഫെൻസിങ് വഴി അധ്യാപകരുടെ മൊബൈൽ ചെക്ക്-ഇൻ, സ്റ്റുഡന്റ് ഐഡി കാർഡ് ക്യുആർ സ്കാനിംഗ്, സ്മാർട്ട് പ്രൊജക്ടർ സ്ക്രീൻ മോഡ്, രക്ഷിതാക്കൾക്കുള്ള മുൻകൂട്ടിയുള്ള ലീവ് പോർട്ടൽ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard/attendance"
              className="text-xs px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 font-bold backdrop-blur-md border border-white/20 transition flex items-center gap-1.5"
            >
              <span>Daily Class Register</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Highlight Feature Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2.5 text-indigo-200">
            <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0" />
            <span>
              <strong>GPS Geofence:</strong> Rejects check-ins outside 250m campus radius
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-indigo-200">
            <Smartphone size={18} className="text-indigo-400 flex-shrink-0" />
            <span>
              <strong>Optical QR Scanner:</strong> Phone camera reads ID badge instantly
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-indigo-200">
            <CalendarDays size={18} className="text-amber-400 flex-shrink-0" />
            <span>
              <strong>Parent Absence:</strong> Approved leaves auto-mark &quot;Excused Leave&quot;
            </span>
          </div>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-3xl text-left transition-all border relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-white border-indigo-600 shadow-lg ring-2 ring-indigo-500/20'
                  : 'bg-white/80 hover:bg-white border-gray-200 text-gray-700 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
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

              <div>
                <h3 className={`text-sm font-bold ${isActive ? 'text-indigo-950' : 'text-gray-900'}`}>
                  {tab.label}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{tab.labelMl}</p>
              </div>

              {isActive && (
                <div className="w-full h-1 bg-indigo-600 rounded-full mt-3" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="transition-all animate-in fade-in">
        {activeTab === 'STAFF_GEOFENCE' && <StaffGeofenceCheckIn />}
        {activeTab === 'STUDENT_QR' && <StudentQRScannerAndIDCard />}
        {activeTab === 'PROJECTOR_DYNAMIC' && <DynamicProjectorScreen />}
        {activeTab === 'PARENT_ABSENCE' && <ParentAbsencePortal />}
      </div>
    </div>
  );
}
