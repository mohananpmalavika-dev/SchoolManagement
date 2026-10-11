'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Paperclip,
  User,
  HeartPulse,
  Send,
  Eye,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import {
  smartAttendanceApi,
  MOCK_STUDENTS,
} from '@/lib/smart-attendance-client';
import {
  ParentAbsenceApplication,
  AbsenceReasonCategory,
  StudentIDCardData,
} from '@krypton/types';

export function ParentAbsencePortal() {
  const [activeView, setActiveView] = useState<'PARENT_APPLY' | 'STAFF_REVIEW'>('PARENT_APPLY');
  const [applications, setApplications] = useState<ParentAbsenceApplication[]>(() =>
    smartAttendanceApi.getLeaveApplications()
  );

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string>(MOCK_STUDENTS[2].id); // Malavika Nair
  const [startDate, setStartDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const afterTomorrow = new Date();
    afterTomorrow.setDate(afterTomorrow.getDate() + 2);
    return afterTomorrow.toISOString().split('T')[0];
  });
  const [reasonCategory, setReasonCategory] = useState<AbsenceReasonCategory>('SICK');
  const [explanation, setExplanation] = useState<string>('');
  const [medicalCertName, setMedicalCertName] = useState<string>('Medical_Certificate_Apollo_Clinic.pdf');
  const [hasCert, setHasCert] = useState<boolean>(true);
  const [guardianName, setGuardianName] = useState<string>('Radha Nair (Mother)');
  const [guardianPhone, setGuardianPhone] = useState<string>('+91 98470 33333');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Review Filter & Modal
  const [reviewFilter, setReviewFilter] = useState<string>('ALL');
  const [viewingCertApp, setViewingCertApp] = useState<ParentAbsenceApplication | null>(null);

  const refreshApplications = () => {
    setApplications([...smartAttendanceApi.getLeaveApplications(reviewFilter)]);
  };

  useEffect(() => {
    refreshApplications();
  }, [reviewFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!explanation.trim()) {
      alert('Please enter a brief explanation for the leave request.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const created = smartAttendanceApi.submitAbsenceApplication({
        studentId: selectedStudentId,
        startDate,
        endDate,
        reasonCategory,
        explanation,
        medicalCertificateName: hasCert ? medicalCertName : undefined,
        guardianName,
        guardianPhone,
      });

      setSubmitting(false);
      setSubmitSuccess(
        `Leave application submitted for ${created.studentName} (${created.startDate} to ${created.endDate}). Awaiting teacher approval.`
      );
      setExplanation('');
      refreshApplications();
    }, 600);
  };

  const handleApprove = (id: string) => {
    smartAttendanceApi.reviewAbsenceApplication({
      applicationId: id,
      status: 'APPROVED',
      reviewerName: 'Dr. Priya Sharma (Class Coordinator)',
      reviewNotes: 'Leave approved. Attendance register automatically updated with status EXCUSED.',
    });
    refreshApplications();
  };

  const handleReject = (id: string) => {
    const reason = prompt('Enter reason for rejection:', 'Prior examination scheduled on this date.');
    if (reason !== null) {
      smartAttendanceApi.reviewAbsenceApplication({
        applicationId: id,
        status: 'REJECTED',
        reviewerName: 'Dr. Priya Sharma (Class Coordinator)',
        reviewNotes: reason || 'Application rejected.',
      });
      refreshApplications();
    }
  };

  const REASON_OPTIONS: Array<{
    value: AbsenceReasonCategory;
    label: string;
    labelMl: string;
    icon: any;
  }> = [
    { value: 'SICK', label: 'Illness / Viral Sickness', labelMl: 'അസുഖം / പനി', icon: HeartPulse },
    { value: 'MEDICAL_APPOINTMENT', label: 'Doctor / Medical Appointment', labelMl: 'ഡോക്ടർ അപ്പോയിന്റ്മെന്റ്', icon: FileCheck },
    { value: 'FAMILY_EMERGENCY', label: 'Family Emergency / Function', labelMl: 'കുടുംബപരമായ അത്യാവശ്യം', icon: User },
    { value: 'RELIGIOUS_OBLIGATION', label: 'Religious Obligation', labelMl: 'മതപരമായ ചടങ്ങുകൾ', icon: Calendar },
    { value: 'TRAVEL', label: 'Out of Town Travel', labelMl: 'യാത്ര', icon: Calendar },
    { value: 'SPORTS_OR_EVENT', label: 'External Sports / Event', labelMl: 'മത്സര രംഗം', icon: Sparkles },
    { value: 'OTHER', label: 'Other Reason', labelMl: 'മറ്റ് കാരണങ്ങൾ', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Switcher Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView('PARENT_APPLY')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              activeView === 'PARENT_APPLY'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Send size={15} />
            <span>Parent Application Form (മുൻകൂട്ടി ലീവ് അപേക്ഷ)</span>
          </button>
          <button
            onClick={() => setActiveView('STAFF_REVIEW')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              activeView === 'STAFF_REVIEW'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ShieldCheck size={15} />
            <span>Teacher & Admin Review Desk (ലീവ് പരിശോധന & അപ്രൂവൽ)</span>
          </button>
        </div>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
          <CheckCircle2 size={13} />
          <span>Auto-Syncs with Daily Register as &quot;Excused Leave&quot;</span>
        </span>
      </div>

      {activeView === 'PARENT_APPLY' ? (
        /* PARENT PERSPECTIVE: APPLICATION FORM */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                Apply for Student Planned Absence
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                കുട്ടിക്ക് അസുഖമോ മറ്റ് ആവശ്യങ്ങളോ വരുമ്പോൾ മുൻകൂട്ടി ലീവ് അപേക്ഷ സമർപ്പിക്കുക
              </p>
            </div>

            {submitSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3 animate-in fade-in">
                <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold">{submitSuccess}</p>
                  <p className="text-xs text-emerald-800 mt-1">
                    അധ്യാപകർ ഇത് പരിശോധിച്ച് അപ്രൂവ് ചെയ്യുമ്പോൾ ആ ദിവസങ്ങളിലെ അറ്റൻഡൻസിൽ ഓട്ടോമാറ്റിക് ആയി &quot;Excused Leave&quot; എന്ന് രേഖപ്പെടുത്തപ്പെടും.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Select Child */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Select Student (കുട്ടിയുടെ പേര്):
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {MOCK_STUDENTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.admissionNumber}) • {s.className}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Absence Start Date (മുതൽ):
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs font-semibold bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Absence End Date (വരെ):
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs font-semibold bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Reason Category */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Reason Category (അവധിയുടെ കാരണം):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {REASON_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setReasonCategory(opt.value)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                          reasonCategory === opt.value
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon size={16} className={reasonCategory === opt.value ? 'text-indigo-600' : 'text-gray-400'} />
                        <div className="min-w-0">
                          <p className="text-xs truncate">{opt.label}</p>
                          <p className="text-[10px] text-gray-500 truncate">{opt.labelMl}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Explanation */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Detailed Explanation (വിശദീകരണം):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the specific reason, medical diagnosis, or event details..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Medical Certificate / Document Upload */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                    <Paperclip size={15} className="text-indigo-600" />
                    Medical Certificate / Document (മെഡിക്കൽ സർട്ടിഫിക്കറ്റ്):
                  </label>
                  <label className="text-xs flex items-center gap-1.5 cursor-pointer text-indigo-700">
                    <input
                      type="checkbox"
                      checked={hasCert}
                      onChange={(e) => setHasCert(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Attach Certificate</span>
                  </label>
                </div>

                {hasCert && (
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-200 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                      <FileCheck size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {medicalCertName}
                      </p>
                      <p className="text-[10px] text-gray-400">PDF Document • 420 KB • Ready to attach</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setMedicalCertName(
                          prompt('Enter file name / URL:', medicalCertName) || medicalCertName
                        )
                      }
                      className="text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Guardian Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Guardian Name (രക്ഷിതാവ്):
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Contact Phone:
                  </label>
                  <input
                    type="text"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
              >
                <Send size={16} />
                <span>
                  {submitting ? 'Submitting Application...' : 'Submit Leave Application (അപേക്ഷ അയക്കുക)'}
                </span>
              </button>
            </form>
          </div>

          {/* Right Column: Track Submitted Applications */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h4 className="text-base font-bold text-gray-900">
              My Leave History & Status (സമർപ്പിച്ച അപേക്ഷകൾ)
            </h4>
            <p className="text-xs text-gray-500">Track status of past and upcoming absences</p>

            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{app.studentName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-gray-700">
                    {app.reasonTitle} ({app.reasonTitleMl})
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <Calendar size={13} />
                    <span>
                      {app.startDate} to {app.endDate} ({app.totalDays} {app.totalDays > 1 ? 'days' : 'day'})
                    </span>
                  </div>

                  {app.hasMedicalCertificate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-medium">
                      <FileCheck size={13} />
                      <span className="truncate">{app.medicalCertificateName}</span>
                    </div>
                  )}

                  {app.status === 'APPROVED' && (
                    <div className="p-2 rounded-xl bg-emerald-50 text-[11px] text-emerald-900 font-medium border border-emerald-200/60 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>Automatic Attendance Marked: &quot;Excused Leave&quot;</span>
                    </div>
                  )}

                  {app.status === 'REJECTED' && app.reviewNotes && (
                    <p className="text-[11px] text-rose-700 font-medium">
                      Note: {app.reviewNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* TEACHER / STAFF PERSPECTIVE: REVIEW & APPROVAL DESK */
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck size={20} className="text-indigo-600" />
                Staff Review Desk • രക്ഷിതാക്കളുടെ ലീവ് അപേക്ഷാ പരിശോധന
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                അംഗീകരിച്ചാൽ ആ ദിവസങ്ങളിലെ അറ്റൻഡൻസിൽ ഓട്ടോമാറ്റിക് ആയി &quot;Excused Leave&quot; രേഖപ്പെടുത്തപ്പെടും.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setReviewFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    reviewFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Applications Table / Cards */}
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-500">No leave applications under &quot;{reviewFilter}&quot;.</p>
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-3xl border border-gray-200 bg-gray-50/50 hover:bg-white transition shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                        {app.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-gray-900">
                            {app.studentName}
                          </h4>
                          <span className="text-xs text-gray-500 font-mono">
                            {app.admissionNumber}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {app.className} • Guardian: {app.guardianName} ({app.guardianPhone})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>

                  {/* Dates & Reason */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-white rounded-2xl border border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-400 block font-medium">Leave Dates:</span>
                      <strong className="text-gray-800">
                        {app.startDate} to {app.endDate} ({app.totalDays} {app.totalDays > 1 ? 'days' : 'day'})
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Category:</span>
                      <strong className="text-gray-800">
                        {app.reasonTitle} ({app.reasonTitleMl})
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Applied At:</span>
                      <span className="text-gray-600">{app.appliedAt}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed bg-white p-3 rounded-2xl border border-gray-100">
                    <strong className="text-gray-900 block mb-0.5">Explanation:</strong>
                    {app.explanation}
                  </p>

                  {/* Attachment & Action Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    {app.hasMedicalCertificate ? (
                      <button
                        onClick={() => setViewingCertApp(app)}
                        className="text-xs text-indigo-600 font-bold flex items-center gap-1.5 hover:underline"
                      >
                        <FileCheck size={15} />
                        <span>View Medical Certificate ({app.medicalCertificateName})</span>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">No document attached</span>
                    )}

                    {app.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReject(app.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition flex items-center gap-1.5"
                        >
                          <X size={14} />
                          <span>Reject (നിരസിക്കുക)</span>
                        </button>
                        <button
                          onClick={() => handleApprove(app.id)}
                          className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          <span>Approve & Mark Excused (അംഗീകരിക്കുക)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>Reviewed by: {app.reviewedBy}</span>
                        {app.attendanceAutoMarked && (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <ShieldCheck size={13} /> Synchronized to register
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Medical Certificate Preview Modal */}
      {viewingCertApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileCheck size={18} className="text-indigo-600" />
                Medical Certificate Preview
              </h3>
              <button
                onClick={() => setViewingCertApp(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-5 p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center">
                <HeartPulse size={32} />
              </div>
              <h4 className="text-sm font-bold text-gray-900">
                Official Clinical Prescription & Medical Certificate
              </h4>
              <p className="text-xs text-gray-500">
                Patient: <strong>{viewingCertApp.studentName}</strong> • {viewingCertApp.admissionNumber}
              </p>
              <div className="p-3 bg-white rounded-xl text-left text-xs border border-gray-200 text-gray-700 space-y-1">
                <p><strong>Issuing Authority:</strong> Dr. K. Joseph, MD (Pediatrics) - Reg: 44219</p>
                <p><strong>Diagnosis:</strong> Acute viral pyrexia & upper respiratory tract infection.</p>
                <p><strong>Advice:</strong> Prescribed bed rest from {viewingCertApp.startDate} to {viewingCertApp.endDate}. Unfit to attend school during this duration.</p>
              </div>
              <p className="text-[11px] text-gray-400 font-mono">
                File: {viewingCertApp.medicalCertificateName}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setViewingCertApp(null)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
