'use client';

import React, { useState, useEffect } from 'react';
import {
  MonitorPlay,
  Maximize2,
  Minimize2,
  RefreshCw,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { smartAttendanceApi } from '@/lib/smart-attendance-client';
import { DynamicProjectorSession } from '@krypton/types';
import { QRCodeSVG } from './QRCodeSVG';

export function DynamicProjectorScreen() {
  const [session, setSession] = useState<DynamicProjectorSession>(() =>
    smartAttendanceApi.getProjectorSession()
  );
  const [countdown, setCountdown] = useState<number>(20);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const fresh = smartAttendanceApi.refreshProjectorCode();
          setSession(fresh);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch((e) => console.log(e));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch((e) => console.log(e));
      setIsFullscreen(false);
    }
  };

  const handleManualRefresh = () => {
    const fresh = smartAttendanceApi.refreshProjectorCode();
    setSession(fresh);
    setCountdown(20);
  };

  return (
    <div
      className={`space-y-6 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-8 overflow-y-auto' : ''
      }`}
    >
      {/* Projector Header */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              SMART PROJECTOR & AUDITORIUM SCREEN • പ്രൊജക്ടർ സ്ക്രീൻ മോഡ്
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Live Dynamic QR Attendance
          </h2>
          <p className="text-xs text-indigo-200 mt-1">
            {session.schoolName} • {session.date}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-bold backdrop-blur-md transition flex items-center gap-2 border border-white/10"
          >
            <RefreshCw size={14} />
            <span>Regenerate Token</span>
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition flex items-center gap-2"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Projector Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Main Stage Grid: Rotating QR Code on Left, Live Stats on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Dynamic QR Display Card */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Rotating Token Badge */}
          <div className="flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
            <Sparkles size={14} />
            <span>Time-Synchronized Dynamic Token (ആന്റി-ഫ്രോഡ് ക്യുആർ)</span>
          </div>

          {/* QR Code Container with Glowing Frame */}
          <div className="relative p-6 rounded-3xl bg-white shadow-2xl border-4 border-indigo-400/80 my-2">
            <QRCodeSVG
              value={session.currentCode}
              size={240}
              darkColor="#020617"
              includeMargin={false}
            />
            {/* Visual scan line animation */}
            <div className="absolute inset-x-6 top-1/2 h-0.5 bg-emerald-500 shadow-[0_0_15px_#10b981] animate-pulse" />
          </div>

          {/* Countdown Timer Bar */}
          <div className="w-full max-w-xs mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <Clock size={14} className="text-amber-400" />
                Token Rotates in:
              </span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                00:{countdown.toString().padStart(2, '0')}s
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-1000"
                style={{ width: `${(countdown / 20) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              New secure token automatically generated every 20 seconds to prevent screenshot sharing.
            </p>
          </div>
        </div>

        {/* Live Attendance Dashboard on Right */}
        <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white">
              <span className="text-xs text-slate-400 font-medium">Registered</span>
              <p className="text-2xl font-black mt-1 text-slate-200">
                {session.stats.totalStudents}
              </p>
              <span className="text-[10px] text-slate-500">Students</span>
            </div>

            <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-2xl p-4 text-white">
              <span className="text-xs text-emerald-400 font-medium">Present Today</span>
              <p className="text-2xl font-black mt-1 text-emerald-300">
                {session.stats.presentToday}
              </p>
              <span className="text-[10px] text-emerald-400/80">On time</span>
            </div>

            <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-2xl p-4 text-white">
              <span className="text-xs text-indigo-400 font-medium">Attendance Rate</span>
              <p className="text-2xl font-black mt-1 text-indigo-300">
                {session.stats.attendancePercentage}%
              </p>
              <span className="text-[10px] text-indigo-400/80">Auditorium Rate</span>
            </div>

            <div className="bg-amber-950/60 border border-amber-800/60 rounded-2xl p-4 text-white">
              <span className="text-xs text-amber-400 font-medium">Late Marks</span>
              <p className="text-2xl font-black mt-1 text-amber-300">
                {session.stats.lateToday}
              </p>
              <span className="text-[10px] text-amber-400/80">After 08:45 AM</span>
            </div>

            <div className="bg-blue-950/60 border border-blue-800/60 rounded-2xl p-4 text-white">
              <span className="text-xs text-blue-400 font-medium">Excused Leave</span>
              <p className="text-2xl font-black mt-1 text-blue-300">
                {session.stats.excusedToday}
              </p>
              <span className="text-[10px] text-blue-400/80">Approved from Portal</span>
            </div>

            <div className="bg-rose-950/60 border border-rose-800/60 rounded-2xl p-4 text-white">
              <span className="text-xs text-rose-400 font-medium">Absent</span>
              <p className="text-2xl font-black mt-1 text-rose-300">
                {session.stats.absentToday}
              </p>
              <span className="text-[10px] text-rose-400/80">Unexcused</span>
            </div>
          </div>

          {/* Recent Scans Live Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <UserCheck size={16} className="text-emerald-400" />
                Live Attendance Feed (തത്സമയ ഹാജർ ഫീഡ്)
              </h4>
              <span className="text-[11px] text-slate-400">Auditorium Screen Terminal</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 flex-1">
              {session.recentScans.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Awaiting first scan...
                </div>
              ) : (
                session.recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <span className="font-bold text-slate-100">{scan.studentName}</span>
                      <p className="text-[10px] text-slate-400">
                        {scan.admissionNumber} • {scan.className}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-emerald-400 font-bold">{scan.time}</span>
                      <span className="block text-[9px] text-emerald-500 font-semibold uppercase">
                        {scan.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
