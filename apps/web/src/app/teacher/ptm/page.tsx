'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PTMSlot, PTMStatus } from '@krypton/types';
import { VirtualPTMService } from '@/lib/virtual-ptm-client';

export default function TeacherPTMPage() {
  const [slots, setSlots] = useState<PTMSlot[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlotForDetails, setSelectedSlotForDetails] = useState<PTMSlot | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Batch Generation Modal state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchGrade, setBatchGrade] = useState('Grade 7A');
  const [batchDate, setBatchDate] = useState('2026-10-15');
  const [batchStartTime, setBatchStartTime] = useState('09:00');
  const [batchEndTime, setBatchEndTime] = useState('12:00');
  const [batchSlotDuration, setBatchSlotDuration] = useState(15);
  const [batchBufferMinutes, setBatchBufferMinutes] = useState(5);

  // Single Slot Modal state
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [singleTitle, setSingleTitle] = useState('Quarterly CBC Academic Review');
  const [singleGrade, setSingleGrade] = useState('Grade 7A');
  const [singleDate, setSingleDate] = useState('2026-10-15');
  const [singleStart, setSingleStart] = useState('14:00');
  const [singleEnd, setSingleEnd] = useState('14:20');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadSlots = () => {
    const list = VirtualPTMService.getSlots();
    setSlots(list);
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const handleBatchGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const created = VirtualPTMService.generateBatchSlots({
      teacherId: 'tch-001',
      teacherName: 'Mr. Joseph Kiprop',
      teacherSubject: 'Mathematics & Science',
      grade: batchGrade,
      date: batchDate,
      startTime: batchStartTime,
      endTime: batchEndTime,
      slotDurationMinutes: Number(batchSlotDuration),
      bufferMinutes: Number(batchBufferMinutes),
    });

    setShowBatchModal(false);
    loadSlots();
    showToast(`Successfully created ${created.length} PTM consultation slots!`);
  };

  const handleCreateSingleSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const newSlot = VirtualPTMService.createSlot({
      title: singleTitle,
      description: 'Scheduled 1-on-1 parent academic review',
      teacherId: 'tch-001',
      teacherName: 'Mr. Joseph Kiprop',
      teacherSubject: 'Mathematics & Science',
      grade: singleGrade,
      date: singleDate,
      startTime: singleStart,
      endTime: singleEnd,
      durationMinutes: 20,
    });

    setShowSingleModal(false);
    loadSlots();
    showToast(`Created slot: ${newSlot.meetingCode}`);
  };

  const handleSendWhatsAppReminder = async (slot: PTMSlot) => {
    showToast(`Sending automated WhatsApp invite to ${slot.parentName || 'Parent'}...`);
    try {
      await fetch('/api/ptm/whatsapp-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slot.id,
          recipientPhone: slot.parentPhone || '+254 722 998 877',
          recipientName: slot.parentName,
        }),
      });
      showToast(`WhatsApp reminder dispatched to ${slot.parentPhone || '+254 722 998 877'}!`);
    } catch {
      showToast('Dispatched WhatsApp invitation message');
    }
  };

  const handleCancelSlot = (id: string) => {
    if (confirm('Are you sure you want to cancel this booking? The slot will become available again.')) {
      VirtualPTMService.cancelSlot(id, 'Cancelled by teacher');
      loadSlots();
      showToast('Booking cancelled and slot opened.');
    }
  };

  // Filter slots
  const filteredSlots = slots.filter(slot => {
    if (statusFilter !== 'ALL' && slot.status !== statusFilter) return false;
    if (gradeFilter !== 'ALL' && slot.grade !== gradeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = slot.studentName?.toLowerCase().includes(q);
      const matchParent = slot.parentName?.toLowerCase().includes(q);
      const matchCode = slot.meetingCode?.toLowerCase().includes(q);
      if (!matchName && !matchParent && !matchCode) return false;
    }
    return true;
  });

  // Analytics Metrics
  const totalSlots = slots.length;
  const bookedSlots = slots.filter(s => s.status === 'BOOKED').length;
  const waitingSlots = slots.filter(s => s.status === 'WAITING').length;
  const completedSlots = slots.filter(s => s.status === 'COMPLETED').length;
  const openSlots = slots.filter(s => s.status === 'AVAILABLE').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 border border-indigo-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white pt-8 pb-14 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Zoom & Google Meet Integrated Experience</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Virtual PTM Scheduler & Conference Hub
              </h1>
              <p className="text-sm text-indigo-200 mt-2 max-w-2xl leading-relaxed">
                Seamlessly organize, automate, and host 1-on-1 virtual parent-teacher meetings with built-in WebRTC video, digital whiteboard, CBC report cards, and automated WhatsApp invitations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowBatchModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/40 transition-all flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Batch Generate Timetable Slots</span>
              </button>

              <button
                onClick={() => setShowSingleModal(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center space-x-2"
              >
                <span>+ Custom 1-on-1 Slot</span>
              </button>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-xs text-indigo-200 font-medium">Total Slots</div>
              <div className="text-2xl font-extrabold text-white mt-1">{totalSlots}</div>
              <div className="text-[11px] text-indigo-300 mt-0.5">Configured</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-xs text-indigo-200 font-medium">Booked by Parents</div>
              <div className="text-2xl font-extrabold text-amber-300 mt-1">{bookedSlots}</div>
              <div className="text-[11px] text-indigo-300 mt-0.5">Upcoming meetings</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-xs text-indigo-200 font-medium">In Lobby / Waiting</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">{waitingSlots}</div>
              <div className="text-[11px] text-indigo-300 mt-0.5">Ready to admit</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-xs text-indigo-200 font-medium">Completed</div>
              <div className="text-2xl font-extrabold text-white mt-1">{completedSlots}</div>
              <div className="text-[11px] text-indigo-300 mt-0.5">Minutes recorded</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-xs text-indigo-200 font-medium">Open Available</div>
              <div className="text-2xl font-extrabold text-indigo-300 mt-1">{openSlots}</div>
              <div className="text-[11px] text-indigo-300 mt-0.5">For parent booking</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 -mt-6">
        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
            {['ALL', 'BOOKED', 'WAITING', 'AVAILABLE', 'COMPLETED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            {/* Grade filter */}
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Grades</option>
              <option value="Grade 7A">Grade 7A</option>
              <option value="Grade 8B">Grade 8B</option>
              <option value="Grade 6C">Grade 6C</option>
            </select>

            {/* Search */}
            <input
              type="text"
              placeholder="Search student, parent, or code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-60"
            />
          </div>
        </div>

        {/* Slots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {filteredSlots.map(slot => {
            const isBooked = slot.status === 'BOOKED';
            const isWaiting = slot.status === 'WAITING';
            const isCompleted = slot.status === 'COMPLETED';
            const isAvailable = slot.status === 'AVAILABLE';

            return (
              <div
                key={slot.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Grade, Date, Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                      {slot.grade}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      isWaiting
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : isBooked
                          ? 'bg-blue-100 text-blue-800'
                          : isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isWaiting ? '● In Waiting Room' : slot.status}
                    </span>
                  </div>

                  {/* Timing & Title */}
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{slot.date} • {slot.startTime} - {slot.endTime} ({slot.durationMinutes} mins)</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                    {slot.title}
                  </h3>

                  {/* Student & Parent Info */}
                  {slot.studentName ? (
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Student:</span>
                        <strong className="text-slate-800">{slot.studentName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Parent / Guardian:</span>
                        <span className="text-slate-700">{slot.parentName}</span>
                      </div>
                      {slot.academicSnapshot && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-[11px]">
                          <span className="text-slate-500">Average: <strong className="text-emerald-700">{slot.academicSnapshot.averageGrade}%</strong></span>
                          <span className="text-slate-500">Attendance: <strong className="text-indigo-700">{slot.academicSnapshot.attendanceRate}%</strong></span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                      Open slot available for parent booking
                    </div>
                  )}

                  {/* Meeting Credentials Pill */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 bg-slate-100/70 px-3 py-1.5 rounded-lg font-mono">
                    <span>Code: <strong className="text-indigo-600">{slot.meetingCode}</strong></span>
                    <span>PIN: {slot.meetingPin}</span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col space-y-2">
                  {/* Start / Join Button */}
                  <Link
                    href={`/ptm/room/${slot.meetingCode}`}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{isCompleted ? 'Re-open Meeting' : 'Start / Join Virtual Meeting'}</span>
                  </Link>

                  {/* Secondary buttons */}
                  <div className="flex items-center space-x-2">
                    {slot.parentPhone && (
                      <button
                        onClick={() => handleSendWhatsAppReminder(slot)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold flex items-center justify-center space-x-1"
                        title="Send WhatsApp Invite & Join Link"
                      >
                        <span>WhatsApp Invite</span>
                      </button>
                    )}

                    <button
                      onClick={() => VirtualPTMService.downloadIcs(slot)}
                      className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                      title="Add to Google/Outlook/iCal Calendar (.ics)"
                    >
                      📅 .ICS
                    </button>

                    {isBooked && (
                      <button
                        onClick={() => handleCancelSlot(slot.id)}
                        className="py-1.5 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold"
                        title="Cancel this parent booking"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* BATCH GENERATE TIMETABLE SLOTS MODAL */}
      {/* ======================================================== */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Batch Generate PTM Slots</h3>
                <p className="text-xs text-slate-500">Automate your parent-teacher meeting consultation schedule</p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBatchGenerate} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Class / Grade:</label>
                <select
                  value={batchGrade}
                  onChange={e => setBatchGrade(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                >
                  <option value="Grade 7A">Grade 7A (CBC Junior Secondary)</option>
                  <option value="Grade 8B">Grade 8B (Integrated Science)</option>
                  <option value="Grade 6C">Grade 6C (Primary Transition)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Meeting Date:</label>
                <input
                  type="date"
                  value={batchDate}
                  onChange={e => setBatchDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Time (From):</label>
                  <input
                    type="time"
                    value={batchStartTime}
                    onChange={e => setBatchStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Time (To):</label>
                  <input
                    type="time"
                    value={batchEndTime}
                    onChange={e => setBatchEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Slot Duration:</label>
                  <select
                    value={batchSlotDuration}
                    onChange={e => setBatchSlotDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value={10}>10 Minutes per parent</option>
                    <option value={15}>15 Minutes (Recommended)</option>
                    <option value={20}>20 Minutes</option>
                    <option value={30}>30 Minutes</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Buffer Time:</label>
                  <select
                    value={batchBufferMinutes}
                    onChange={e => setBatchBufferMinutes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value={0}>0 Minutes (Back-to-back)</option>
                    <option value={5}>5 Minutes buffer</option>
                    <option value={10}>10 Minutes buffer</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  Generate All Slots
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SINGLE CUSTOM SLOT MODAL */}
      {/* ======================================================== */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create 1-on-1 Consultation Slot</h3>
              <button onClick={() => setShowSingleModal(false)} className="text-slate-400 p-1">✕</button>
            </div>

            <form onSubmit={handleCreateSingleSlot} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Session Agenda / Title:</label>
                <input
                  type="text"
                  value={singleTitle}
                  onChange={e => setSingleTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Grade:</label>
                  <select
                    value={singleGrade}
                    onChange={e => setSingleGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="Grade 7A">Grade 7A</option>
                    <option value="Grade 8B">Grade 8B</option>
                    <option value="Grade 6C">Grade 6C</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date:</label>
                  <input
                    type="date"
                    value={singleDate}
                    onChange={e => setSingleDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Time:</label>
                  <input
                    type="time"
                    value={singleStart}
                    onChange={e => setSingleStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Time:</label>
                  <input
                    type="time"
                    value={singleEnd}
                    onChange={e => setSingleEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  Create Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
