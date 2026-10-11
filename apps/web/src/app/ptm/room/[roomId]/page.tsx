'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { PTMSlot } from '@krypton/types';
import { VirtualPTMService, INITIAL_PTM_SLOTS } from '@/lib/virtual-ptm-client';
import { VirtualPTMConferenceRoom } from '@/components/ptm/VirtualPTMConferenceRoom';

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function PTMRoomPage({ params }: PageProps) {
  const router = useRouter();
  const { roomId } = use(params);
  const [slot, setSlot] = useState<PTMSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'TEACHER' | 'PARENT' | 'ADMIN'>('TEACHER');
  const [userName, setUserName] = useState<string>('Mr. Joseph Kiprop');
  const [inLobby, setInLobby] = useState(true);
  const [micTest, setMicTest] = useState(true);
  const [cameraTest, setCameraTest] = useState(true);

  useEffect(() => {
    let found = VirtualPTMService.getSlotByCode(roomId);
    if (!found) {
      found = VirtualPTMService.getSlotById(roomId);
    }

    if (found) {
      setSlot(found);
    } else {
      // Instant Fallback Meeting Creation (like Google Meet / Zoom new meeting)
      const instantSlot: PTMSlot = {
        id: `ptm-instant-${Date.now()}`,
        meetingCode: roomId,
        meetingPin: Math.floor(100000 + Math.random() * 900000).toString(),
        title: 'Virtual Parent-Teacher Conference',
        description: 'Instant CBC Academic Assessment & Progress Consultation Room',
        grade: 'Grade 7A',
        teacherId: 'tch-001',
        teacherName: 'Mr. Joseph Kiprop',
        teacherSubject: 'Mathematics & Science',
        parentId: 'par-501',
        parentName: 'Mrs. Grace Wanjiku',
        parentPhone: '+254 722 998 877',
        studentId: 'std-1001',
        studentName: 'Alan Kiprop',
        studentGrade: 'Grade 7A',
        admissionNumber: 'ADM-2024-0089',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '10:30',
        durationMinutes: 30,
        status: 'IN_PROGRESS',
        waitingRoom: true,
        meetingUrl: `/ptm/room/${roomId}`,
        academicSnapshot: {
          averageGrade: 84.5,
          attendanceRate: 96.8,
          conduct: 'Excellent - Highly Focused',
          topSubject: 'Integrated Science (91%)',
          needsImprovement: 'Mathematics - Algebra (76%)',
          termExamRank: '5th out of 42',
          homeworkCompletionRate: 88,
          cbcCoreCompetencies: {
            communication: 'EXCEEDING',
            criticalThinking: 'EXCEEDING',
            collaboration: 'MEETING',
            digitalLiteracy: 'EXCEEDING',
          },
        },
      };
      setSlot(instantSlot);
    }
    setLoading(false);
  }, [roomId]);

  if (loading || !slot) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <p className="text-slate-400 font-medium text-sm">Connecting to Krypton Meeting Server...</p>
      </div>
    );
  }

  // Pre-Meeting Lobby / Device Check Screen (Google Meet / Zoom Greenroom)
  if (inLobby) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
        {/* Lobby Header */}
        <header className="flex items-center justify-between max-w-5xl mx-auto w-full pt-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100">Krypton Meet</h1>
              <p className="text-xs text-indigo-400 font-medium">Virtual PTM Conferencing</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>256-Bit Encrypted Meeting</span>
          </div>
        </header>

        {/* Center Device Check / Greenroom Area */}
        <main className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto items-center">
          {/* Left: Video Preview Greenroom Box */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 relative shadow-2xl flex flex-col items-center justify-center">
              {cameraTest ? (
                <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-indigo-950/40 to-slate-900 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
                    {userName.charAt(0)}
                  </div>
                  <span className="mt-4 text-xs font-semibold text-slate-300">Camera Preview Ready</span>
                </div>
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-300">Camera is off</p>
                </div>
              )}

              {/* In-Preview Mic & Camera Toggles */}
              <div className="absolute bottom-4 flex items-center space-x-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setMicTest(!micTest)}
                  className={`p-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    micTest ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-red-600 text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>{micTest ? 'Mic On' : 'Mic Off'}</span>
                </button>

                <button
                  onClick={() => setCameraTest(!cameraTest)}
                  className={`p-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    cameraTest ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-red-600 text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{cameraTest ? 'Camera On' : 'Camera Off'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Meeting Details & Join Action Box */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-5">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold mb-2">
                {slot.grade} • Scheduled Session
              </div>
              <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight leading-snug">
                {slot.title}
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {slot.description}
              </p>
            </div>

            {/* Meeting metadata pills */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Teacher:</span>
                <span className="font-semibold">{slot.teacherName}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Student:</span>
                <span className="font-semibold">{slot.studentName || 'Open Registration'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Scheduled Time:</span>
                <span className="font-semibold">{slot.date} • {slot.startTime} - {slot.endTime}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Meeting Code:</span>
                <span className="font-mono font-bold text-indigo-400">{slot.meetingCode}</span>
              </div>
            </div>

            {/* Role selection toggle for testing / joining */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Join As:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUserRole('TEACHER');
                    setUserName(slot.teacherName);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    userRole === 'TEACHER'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Teacher (Host)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserRole('PARENT');
                    setUserName(slot.parentName || 'Mrs. Grace Wanjiku');
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    userRole === 'PARENT'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Parent / Guardian
                </button>
              </div>
            </div>

            {/* Join Button */}
            <button
              onClick={() => setInLobby(false)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-2xl shadow-indigo-600/40 transition-all flex items-center justify-center space-x-2 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Join Meeting Now</span>
            </button>
          </div>
        </main>

        <footer className="text-center text-xs text-slate-600 py-2">
          Krypton School ERP • Cloud Virtual Conferencing Suite • CBC Kenya
        </footer>
      </div>
    );
  }

  // Active Zoom / Google Meet Conference
  return (
    <VirtualPTMConferenceRoom
      initialSlot={slot}
      currentUserRole={userRole}
      currentUserName={userName}
      onLeave={() => router.push(userRole === 'TEACHER' ? '/teacher/ptm' : '/dashboard/ptm')}
    />
  );
}
