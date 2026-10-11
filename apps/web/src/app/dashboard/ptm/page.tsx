'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PTMSlot } from '@krypton/types';
import { VirtualPTMService } from '@/lib/virtual-ptm-client';

export default function ParentPTMPage() {
  const [slots, setSlots] = useState<PTMSlot[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Booking Modal State
  const [selectedSlotToBook, setSelectedSlotToBook] = useState<PTMSlot | null>(null);
  const [parentName, setParentName] = useState('Mrs. Grace Wanjiku');
  const [parentPhone, setParentPhone] = useState('+254 722 998 877');
  const [parentEmail, setParentEmail] = useState('grace.wanjiku@gmail.com');
  const [studentName, setStudentName] = useState('Alan Kiprop');
  const [admissionNumber, setAdmissionNumber] = useState('ADM-2024-0089');
  const [parentDiscussionNotes, setParentDiscussionNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

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

  const handleBookSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotToBook) return;

    setIsBooking(true);
    try {
      const booked = VirtualPTMService.bookSlot({
        slotId: selectedSlotToBook.id,
        studentId: 'std-1001',
        studentName,
        admissionNumber,
        parentId: 'par-501',
        parentName,
        parentPhone,
        parentEmail,
        parentNotes: parentDiscussionNotes,
      });

      setSelectedSlotToBook(null);
      loadSlots();
      showToast(`PTM meeting confirmed with ${booked.teacherName} on ${booked.date}!`);
      setParentDiscussionNotes('');
    } catch (err: any) {
      showToast('Booking failed: ' + err.message);
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBooking = (slotId: string) => {
    if (confirm('Are you sure you want to cancel this scheduled consultation?')) {
      VirtualPTMService.cancelSlot(slotId, 'Cancelled by parent');
      loadSlots();
      showToast('Meeting cancelled successfully.');
    }
  };

  // Divide slots into "My Scheduled PTMs" and "Available to Book"
  const myBookedSlots = slots.filter(s => s.status === 'BOOKED' || s.status === 'WAITING' || s.status === 'IN_PROGRESS');
  const availableSlots = slots.filter(s => s.status === 'AVAILABLE');
  const pastSlots = slots.filter(s => s.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 border border-indigo-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white pt-8 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Virtual Parent-Teacher Meetings</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Virtual PTM & Consultation Hub
              </h1>
              <p className="text-sm text-indigo-200 mt-2 max-w-xl">
                Connect directly with your child’s teachers from home or office through encrypted video meetings. Review CBC assessments, discuss homework, and agree on personalized academic progress goals.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-right">
              <div className="text-xs text-indigo-200">Active Student</div>
              <div className="text-lg font-bold text-white mt-0.5">Alan Kiprop Wanjiku</div>
              <div className="text-xs text-emerald-300 font-medium">Grade 7A (CBC Junior Secondary)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-6 space-y-8">
        {/* ======================================================== */}
        {/* 1. MY UPCOMING SCHEDULED PTMS */}
        {/* ======================================================== */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>My Scheduled Consultation Meetings</span>
            </h2>
            <span className="text-xs text-slate-500">{myBookedSlots.length} active sessions</span>
          </div>

          {myBookedSlots.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-800">No Scheduled Meetings</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                You have not booked any parent-teacher meetings yet. Select an available slot below to connect with your child's teachers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {myBookedSlots.map(slot => (
                <div
                  key={slot.id}
                  className="bg-white rounded-3xl p-6 border-2 border-indigo-500/20 shadow-lg shadow-indigo-100 hover:border-indigo-500 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Status badge & time */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                        {slot.date} • {slot.startTime} - {slot.endTime}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold animate-pulse">
                        ● Confirmed
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {slot.title}
                    </h3>

                    {/* Teacher profile pill */}
                    <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                          {slot.teacherName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{slot.teacherName}</div>
                          <div className="text-[11px] text-slate-500">{slot.teacherSubject}</div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600">{slot.grade}</span>
                    </div>

                    {/* Meeting Credentials */}
                    <div className="mt-3 p-3 bg-indigo-950/5 rounded-xl border border-indigo-100 flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Meeting Code:</span>
                        <strong className="text-indigo-700">{slot.meetingCode}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 text-[11px] block">Passcode PIN:</span>
                        <strong className="text-slate-800">{slot.meetingPin}</strong>
                      </div>
                    </div>

                    {/* Parent Discussion Note preview */}
                    {slot.parentNotes && (
                      <div className="mt-3 text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        "Your note: {slot.parentNotes}"
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col space-y-2">
                    <Link
                      href={`/ptm/room/${slot.meetingCode}`}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Join Virtual Meeting Room</span>
                    </Link>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => VirtualPTMService.downloadIcs(slot)}
                        className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <span>📅 Add to Calendar (.ICS)</span>
                      </button>

                      <button
                        onClick={() => handleCancelBooking(slot.id)}
                        className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 2. AVAILABLE SLOTS FOR PARENT TO BOOK */}
        {/* ======================================================== */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Available Consultation Slots (Open for Booking)</span>
            </h2>
            <span className="text-xs text-slate-500">{availableSlots.length} slots open</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {availableSlots.map(slot => (
              <div
                key={slot.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                      Available Slot
                    </span>
                    <span className="text-xs font-bold text-indigo-600">{slot.grade}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-1">{slot.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{slot.description}</p>

                  <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Teacher:</span>
                      <strong className="text-slate-800">{slot.teacherName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subject:</span>
                      <span className="text-slate-700">{slot.teacherSubject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <strong className="text-indigo-600">{slot.date}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Time:</span>
                      <span className="text-slate-700">{slot.startTime} - {slot.endTime} ({slot.durationMinutes}m)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedSlotToBook(slot)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>Book Consultation Slot</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. PAST COMPLETED PTMS & MINUTES */}
        {/* ======================================================== */}
        {pastSlots.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Past Meetings & Progress Notes History</span>
            </h2>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              {pastSlots.map(slot => (
                <div key={slot.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{slot.title}</h4>
                      <p className="text-slate-500">With {slot.teacherName} • Completed on {slot.date}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      Completed
                    </span>
                  </div>

                  {slot.teacherNotes && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700">
                      <strong className="text-slate-900 block mb-0.5">Teacher Progress Notes:</strong>
                      <p>{slot.teacherNotes}</p>
                    </div>
                  )}

                  {slot.actionItems && slot.actionItems.length > 0 && (
                    <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-indigo-900">
                      <strong className="block mb-1">Agreed Joint Action Items:</strong>
                      <ul className="list-disc list-inside space-y-0.5">
                        {slot.actionItems.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* BOOKING MODAL */}
      {/* ======================================================== */}
      {selectedSlotToBook && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Confirm PTM Slot Booking</h3>
                <p className="text-xs text-slate-500">Virtual consultation with {selectedSlotToBook.teacherName}</p>
              </div>
              <button
                onClick={() => setSelectedSlotToBook(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookSlot} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="font-bold text-indigo-900 text-sm">{selectedSlotToBook.title}</div>
                <div className="text-indigo-700 mt-0.5">
                  🗓 {selectedSlotToBook.date} • ⏰ {selectedSlotToBook.startTime} - {selectedSlotToBook.endTime}
                </div>
                <div className="text-indigo-600 mt-1">
                  Educator: {selectedSlotToBook.teacherName} ({selectedSlotToBook.teacherSubject})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Student Name:</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Admission No:</label>
                  <input
                    type="text"
                    value={admissionNumber}
                    onChange={e => setAdmissionNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Parent / Guardian:</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={e => setParentName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">WhatsApp / Phone:</label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Topics or Questions for the Teacher:</label>
                <textarea
                  value={parentDiscussionNotes}
                  onChange={e => setParentDiscussionNotes(e.target.value)}
                  placeholder="e.g. Discuss Term 3 algebra score, homework habits, preparation for national assessment..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSlotToBook(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBooking}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  {isBooking ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
