'use client';

import React, { useState, useEffect } from 'react';
import {
  AdmissionApplication,
  AdmissionStage,
  AdmissionPaymentMethod,
} from '@krypton/types';
import { admissionsClient } from '@/lib/admissions-client';

const STAGES: {
  key: AdmissionStage;
  title: string;
  titleMl: string;
  color: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  icon: string;
}[] = [
  {
    key: 'INQUIRY_RECEIVED',
    title: 'Inquiry Received',
    titleMl: 'പുതിയ അപേക്ഷ',
    color: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    icon: '📥',
  },
  {
    key: 'INTERVIEW_SCHEDULED',
    title: 'Interview Scheduled',
    titleMl: 'അഭിമുഖം നിശ്ചയിച്ചു',
    color: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    icon: '🗓️',
  },
  {
    key: 'ACCEPTED',
    title: 'Accepted',
    titleMl: 'അംഗീകരിച്ചു',
    color: 'bg-purple-50',
    borderColor: 'border-purple-200',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    icon: '🎯',
  },
  {
    key: 'FEE_PAID',
    title: 'Fee Paid',
    titleMl: 'ഫീസ് അടച്ചു',
    color: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    icon: '💳',
  },
  {
    key: 'ADMITTED',
    title: 'Admitted',
    titleMl: 'ഔദ്യോഗികമായി ചേർത്തു',
    color: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    icon: '🎓',
  },
];

export function AdmissionKanbanBoard() {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<AdmissionStage | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  // Modals & Drawers
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [scheduleInterviewApp, setScheduleInterviewApp] = useState<AdmissionApplication | null>(null);
  const [recordPaymentApp, setRecordPaymentApp] = useState<AdmissionApplication | null>(null);
  const [admitStudentApp, setAdmitStudentApp] = useState<AdmissionApplication | null>(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // Interview Form State
  const [interviewForm, setInterviewForm] = useState(() => ({
    scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    scheduledTime: '10:00',
    interviewerName: 'Dr. K. R. Nambiar (Principal)',
    venueOrLink: 'Principal Chambers, Academic Block',
    isVirtual: false,
    notes: 'Assessment on foundational literacy, numeracy & general awareness.',
  }));

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState(() => ({
    amount: 25000,
    paymentMethod: 'UPI' as AdmissionPaymentMethod,
    receiptNumber: `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    feeType: 'Admission & Term 1 Tuition Fee',
    transactionId: `TXN-${Date.now().toString().slice(-8)}`,
  }));

  // Enrollment Form State
  const [enrollmentForm, setEnrollmentForm] = useState(() => ({
    officialAdmissionNumber: `KPS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    assignedClass: 'Grade 1',
    assignedSection: 'A',
    rollNumber: '01',
    welcomeKitDispatched: true,
  }));

  // Direct Lead Form State
  const [directLeadForm, setDirectLeadForm] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dateOfBirth: '2020-05-15',
    applyingForGrade: 'Grade 1',
    fatherName: '',
    phone: '',
    whatsappPhone: '',
    leadSource: 'WALK_IN' as any,
    priority: 'HIGH' as any,
    notes: '',
  });

  // Load from client storage
  const loadData = () => {
    const list = admissionsClient.getApplications({
      search,
      grade: gradeFilter,
      priority: priorityFilter,
      source: sourceFilter,
    });
    setApplications(list);
  };

  useEffect(() => {
    loadData();
  }, [search, gradeFilter, priorityFilter, sourceFilter]);

  const stats = admissionsClient.getFunnelStats();

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedAppId(id);
  };

  const handleDragOver = (e: React.DragEvent, stage: AdmissionStage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: AdmissionStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (!appId) return;

    const app = applications.find((a) => a.id === appId);
    if (!app || app.stage === targetStage) return;

    // Trigger stage-specific modal if required, or update stage directly
    if (targetStage === 'INTERVIEW_SCHEDULED' && !app.interview) {
      setScheduleInterviewApp(app);
    } else if (targetStage === 'FEE_PAID' && !app.payment) {
      setRecordPaymentApp(app);
    } else if (targetStage === 'ADMITTED' && !app.enrollment) {
      setEnrollmentForm((prev) => ({
        ...prev,
        assignedClass: app.student.applyingForGrade,
      }));
      setAdmitStudentApp(app);
    } else {
      admissionsClient.updateStage(
        appId,
        targetStage,
        'School Admin (Kanban Drag)',
        `Moved directly to ${targetStage.replace('_', ' ')}`
      );
      loadData();
    }
    setDraggedAppId(null);
  };

  // Stage Advance Helper
  const handleQuickAdvance = (app: AdmissionApplication) => {
    const stagesOrder: AdmissionStage[] = [
      'INQUIRY_RECEIVED',
      'INTERVIEW_SCHEDULED',
      'ACCEPTED',
      'FEE_PAID',
      'ADMITTED',
    ];
    const currentIndex = stagesOrder.indexOf(app.stage);
    if (currentIndex < stagesOrder.length - 1) {
      const nextStage = stagesOrder[currentIndex + 1];
      if (nextStage === 'INTERVIEW_SCHEDULED' && !app.interview) {
        setScheduleInterviewApp(app);
      } else if (nextStage === 'FEE_PAID' && !app.payment) {
        setRecordPaymentApp(app);
      } else if (nextStage === 'ADMITTED' && !app.enrollment) {
        setEnrollmentForm((prev) => ({
          ...prev,
          assignedClass: app.student.applyingForGrade,
        }));
        setAdmitStudentApp(app);
      } else {
        admissionsClient.updateStage(app.id, nextStage);
        loadData();
      }
    }
  };

  // Submit Modals
  const handleConfirmInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleInterviewApp) return;

    admissionsClient.scheduleInterview(scheduleInterviewApp.id, {
      scheduledDate: interviewForm.scheduledDate,
      scheduledTime: interviewForm.scheduledTime,
      interviewerName: interviewForm.interviewerName,
      venueOrLink: interviewForm.venueOrLink,
      isVirtual: interviewForm.isVirtual,
      notes: interviewForm.notes,
      result: 'PENDING',
    });

    setScheduleInterviewApp(null);
    loadData();
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordPaymentApp) return;

    admissionsClient.recordFeePayment(recordPaymentApp.id, {
      amount: Number(paymentForm.amount),
      currency: 'INR',
      receiptNumber: paymentForm.receiptNumber,
      paidAt: new Date().toISOString(),
      paymentMethod: paymentForm.paymentMethod,
      feeType: paymentForm.feeType,
      transactionId: paymentForm.transactionId,
    });

    setRecordPaymentApp(null);
    loadData();
  };

  const handleConfirmEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitStudentApp) return;

    admissionsClient.completeAdmission(admitStudentApp.id, {
      officialAdmissionNumber: enrollmentForm.officialAdmissionNumber,
      assignedClass: enrollmentForm.assignedClass,
      assignedSection: enrollmentForm.assignedSection,
      rollNumber: enrollmentForm.rollNumber,
      admittedAt: new Date().toISOString(),
      welcomeKitDispatched: enrollmentForm.welcomeKitDispatched,
    });

    setAdmitStudentApp(null);
    loadData();
  };

  const handleCreateDirectLead = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${directLeadForm.firstName} ${directLeadForm.lastName}`.trim();
    admissionsClient.createApplication({
      student: {
        firstName: directLeadForm.firstName,
        lastName: directLeadForm.lastName,
        fullName,
        gender: directLeadForm.gender,
        dateOfBirth: directLeadForm.dateOfBirth,
        applyingForGrade: directLeadForm.applyingForGrade,
        bloodGroup: 'B+ve',
        nationality: 'Indian',
      },
      parent: {
        fatherName: directLeadForm.fatherName,
        motherName: '',
        email: '',
        phone: directLeadForm.phone,
        whatsappPhone: directLeadForm.whatsappPhone || directLeadForm.phone,
        address: 'Walk-in / Front Desk inquiry',
        city: 'Kochi',
        pincode: '682301',
      },
      documents: {},
      leadSource: directLeadForm.leadSource,
      priority: directLeadForm.priority,
      notes: directLeadForm.notes,
    });

    setShowAddLeadModal(false);
    loadData();
  };

  return (
    <div className="w-full bg-slate-100 min-h-screen text-slate-900 pb-12">
      {/* Top Header & Metrics Banner */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                School Admissions CRM
              </span>
              <span className="text-xs text-slate-500 font-medium">Academic Session 2026-2027</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Admission Pipeline & Lead Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              അഡ്മിഷൻ പൈപ്പ്‌ലൈൻ കാൻബാൻ ബോർഡ് • Drag and drop leads across the 5 enrollment stages.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="/admissions/apply"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-4 py-2.5 rounded-xl border border-indigo-200 text-xs sm:text-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Public Admission Portal ➔</span>
            </a>

            <button
              type="button"
              onClick={() => setShowAddLeadModal(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md text-xs sm:text-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Add Walk-in Lead</span>
            </button>
          </div>
        </div>

        {/* Executive Funnel Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
              📥
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Total Inquiries</span>
              <strong className="text-xl font-extrabold text-slate-800">{stats.totalInquiries}</strong>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
              🗓️
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Interviews</span>
              <strong className="text-xl font-extrabold text-slate-800">{stats.interviewScheduledCount}</strong>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
              🎯
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Seats Offered</span>
              <strong className="text-xl font-extrabold text-slate-800">{stats.acceptedCount}</strong>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
              ₹
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Fee Collected</span>
              <strong className="text-xl font-extrabold text-emerald-700">₹{stats.totalFeeCollected.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
              🎓
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Admitted & Enrolled</span>
              <div className="flex items-baseline space-x-1.5">
                <strong className="text-xl font-extrabold text-indigo-700">{stats.admittedCount}</strong>
                <span className="text-xs text-indigo-600 font-semibold">({stats.conversionRate}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-slate-200">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by student, parent, phone, app no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Grades (എല്ലാ ക്ലാസുകളും)</option>
            <option value="Kindergarten">Kindergarten</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 11 - Science">Grade 11 - Science</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="NORMAL">Normal Priority</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Sources (ഉറവിടം)</option>
            <option value="WEBSITE_PORTAL">Website Portal</option>
            <option value="WALK_IN">Walk-in Inquiry</option>
            <option value="WHATSAPP">WhatsApp Campaign</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="PARENT_REFERRAL">Parent Referral</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setGradeFilter('ALL');
              setPriorityFilter('ALL');
              setSourceFilter('ALL');
            }}
            className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 underline"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Kanban Columns Board */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {STAGES.map((col) => {
            const colApps = applications.filter((a) => a.stage === col.key);
            const isTargetDrop = dragOverStage === col.key;

            return (
              <div
                key={col.key}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.key)}
                className={`rounded-2xl border ${col.borderColor} ${col.color} p-3.5 transition-all min-h-[600px] flex flex-col ${
                  isTargetDrop ? 'ring-4 ring-blue-400 border-blue-500 shadow-lg scale-[1.01]' : 'shadow-sm'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{col.icon}</span>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {col.title}
                      </h3>
                      <span className="text-[11px] text-slate-500">{col.titleMl}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${col.badgeBg} ${col.badgeText}`}
                  >
                    {colApps.length}
                  </span>
                </div>

                {/* Column Cards Dropzone */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-1">
                  {colApps.length === 0 ? (
                    <div className="h-36 border-2 border-dashed border-slate-300/80 rounded-xl flex flex-col items-center justify-center text-center p-4 text-xs text-slate-400">
                      <span>No leads in this stage</span>
                      <span className="text-[10px] mt-1 text-slate-400">Drag applicants here to advance</span>
                    </div>
                  ) : (
                    colApps.map((app) => (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-grab active:cursor-grabbing hover:border-blue-400 group relative"
                      >
                        {/* Card Header & Priority */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {app.applicationNumber}
                          </span>
                          <div className="flex items-center space-x-1">
                            {app.priority === 'HIGH' && (
                              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                                High
                              </span>
                            )}
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                              {app.leadSource.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Student Profile Info */}
                        <div className="flex items-start space-x-3 mb-2.5">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden border border-slate-300">
                            {app.documents.studentPhotoUrl ? (
                              <img
                                src={app.documents.studentPhotoUrl}
                                alt={app.student.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                                {app.student.firstName[0]}
                                {app.student.lastName[0]}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {app.student.fullName}
                            </h4>
                            {app.student.fullNameMl && (
                              <span className="text-[11px] text-slate-500 block truncate">
                                {app.student.fullNameMl}
                              </span>
                            )}
                            <div className="inline-block mt-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {app.student.applyingForGrade}
                            </div>
                          </div>
                        </div>

                        {/* Details badges */}
                        <div className="space-y-1.5 text-[11px] text-slate-600 py-2 border-t border-b border-slate-100 my-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Parent:</span>
                            <span className="font-medium text-slate-800 truncate max-w-[130px]">
                              {app.parent.fatherName || app.parent.motherName}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Phone:</span>
                            <span className="font-mono text-slate-700">{app.parent.phone}</span>
                          </div>

                          {/* Stage Specific Badges */}
                          {app.interview && (
                            <div className="bg-amber-50 p-1.5 rounded border border-amber-200 text-amber-900 text-[10px] mt-1 font-medium">
                              🗓️ {app.interview.scheduledDate} @ {app.interview.scheduledTime}
                            </div>
                          )}

                          {app.payment && (
                            <div className="bg-emerald-50 p-1.5 rounded border border-emerald-200 text-emerald-900 text-[10px] mt-1 font-bold">
                              💳 ₹{app.payment.amount.toLocaleString('en-IN')} Paid ({app.payment.receiptNumber})
                            </div>
                          )}

                          {app.enrollment && (
                            <div className="bg-indigo-50 p-1.5 rounded border border-indigo-200 text-indigo-950 text-[10px] mt-1 font-bold">
                              🎓 Adm No: {app.enrollment.officialAdmissionNumber} (Sec {app.enrollment.assignedSection})
                            </div>
                          )}
                        </div>

                        {/* Document Badges */}
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mb-3">
                          <span
                            className={`px-1.5 py-0.5 rounded border ${
                              app.documents.birthCertificateUrl
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            {app.documents.birthCertificateUrl ? '✓ Birth Cert' : '✗ No Birth Cert'}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded border ${
                              app.documents.studentPhotoUrl
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            {app.documents.studentPhotoUrl ? '✓ Photo' : '✗ No Photo'}
                          </span>
                          {app.transportRequired && (
                            <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                              🚌 Bus
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between gap-1 pt-1">
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => setSelectedApp(app)}
                              className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
                              title="View Full Profile & Documents"
                            >
                              👁️ View
                            </button>

                            <a
                              href={admissionsClient.generateWhatsAppUrl(
                                app,
                                app.stage === 'INTERVIEW_SCHEDULED'
                                  ? 'INTERVIEW'
                                  : app.stage === 'ACCEPTED'
                                  ? 'ACCEPTED'
                                  : app.stage === 'FEE_PAID'
                                  ? 'FEE_RECEIPT'
                                  : 'ADMISSION_CONFIRMED'
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-[11px] bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded"
                              title="Chat on WhatsApp"
                            >
                              💬
                            </a>

                            <a
                              href={`tel:${app.parent.phone}`}
                              className="p-1 text-[11px] bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
                              title="Call Parent"
                            >
                              📞
                            </a>
                          </div>

                          {col.key !== 'ADMITTED' && (
                            <button
                              type="button"
                              onClick={() => handleQuickAdvance(app)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm flex items-center space-x-0.5"
                              title="Advance to next pipeline stage"
                            >
                              <span>Advance</span>
                              <span>➔</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: APPLICATION PROFILE & DOCUMENT VIEWER DRAWER     */}
      {/* ======================================================== */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedApp.applicationNumber}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                    {selectedApp.student.fullName}
                  </h3>
                  {selectedApp.student.fullNameMl && (
                    <span className="text-sm text-slate-500 font-medium">
                      {selectedApp.student.fullNameMl}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Status Banner */}
              <div className="my-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase font-semibold block">Current Pipeline Stage</span>
                  <strong className="text-sm text-slate-800">{selectedApp.stage.replace('_', ' ')}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickAdvance(selectedApp)}
                  className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg"
                >
                  Advance Stage ➔
                </button>
              </div>

              {/* Student Bio */}
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm my-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Class Applied:</span>
                  <strong>{selectedApp.student.applyingForGrade}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Date of Birth:</span>
                  <strong>{selectedApp.student.dateOfBirth}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Gender:</span>
                  <strong>{selectedApp.student.gender}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Blood Group:</span>
                  <strong>{selectedApp.student.bloodGroup}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Father:</span>
                  <strong>{selectedApp.parent.fatherName || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Mother:</span>
                  <strong>{selectedApp.parent.motherName || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone:</span>
                  <strong className="font-mono">{selectedApp.parent.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Address:</span>
                  <span className="text-slate-700">{selectedApp.parent.address}, {selectedApp.parent.city}</span>
                </div>
              </div>

              {/* Uploaded Documents Preview */}
              <div className="my-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Uploaded Verification Documents (ഡോക്യുമെന്റുകൾ)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Photo Preview */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
                    <span className="text-xs font-semibold text-slate-700 block mb-2">
                      Passport Photo
                    </span>
                    {selectedApp.documents.studentPhotoUrl ? (
                      <div className="w-24 h-28 rounded-lg overflow-hidden mx-auto shadow border border-white">
                        <img
                          src={selectedApp.documents.studentPhotoUrl}
                          alt="Student"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-28 flex items-center justify-center text-xs text-slate-400">
                        No photo uploaded
                      </div>
                    )}
                  </div>

                  {/* Birth Certificate Preview */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
                    <span className="text-xs font-semibold text-slate-700 block mb-2">
                      Birth Certificate
                    </span>
                    {selectedApp.documents.birthCertificateUrl ? (
                      <div className="h-28 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center p-2">
                        <svg className="w-8 h-8 text-emerald-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <a
                          href={selectedApp.documents.birthCertificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-emerald-700 hover:underline truncate max-w-full"
                        >
                          View Document ➔
                        </a>
                      </div>
                    ) : (
                      <div className="h-28 flex items-center justify-center text-xs text-slate-400">
                        No birth cert uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="my-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Stage Audit Trail & History
                </h4>
                <div className="space-y-2">
                  {selectedApp.timeline.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start space-x-2"
                    >
                      <span className="text-blue-600 mt-0.5">●</span>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <strong>{item.title}</strong>
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex justify-between">
              <a
                href={admissionsClient.generateWhatsAppUrl(selectedApp, 'INTERVIEW')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-xl text-xs"
              >
                <span>💬 WhatsApp Parent</span>
              </a>

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2 rounded-xl text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: SCHEDULE INTERVIEW MODAL                        */}
      {/* ======================================================== */}
      {scheduleInterviewApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🗓️</span>
                <h3 className="text-base font-bold text-slate-900">
                  Schedule Assessment / Interview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setScheduleInterviewApp(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Scheduling interview for <strong>{scheduleInterviewApp.student.fullName}</strong> ({scheduleInterviewApp.student.applyingForGrade}).
            </p>

            <form onSubmit={handleConfirmInterview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Interview Date
                </label>
                <input
                  type="date"
                  required
                  value={interviewForm.scheduledDate}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Interview Time
                </label>
                <input
                  type="time"
                  required
                  value={interviewForm.scheduledTime}
                  onChange={(e) => setInterviewForm({ ...interviewForm, scheduledTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Interviewer Name / Panel
                </label>
                <input
                  type="text"
                  required
                  value={interviewForm.interviewerName}
                  onChange={(e) => setInterviewForm({ ...interviewForm, interviewerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Venue or Virtual Video Link
                </label>
                <input
                  type="text"
                  required
                  value={interviewForm.venueOrLink}
                  onChange={(e) => setInterviewForm({ ...interviewForm, venueOrLink: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assessment Focus / Instructions
                </label>
                <textarea
                  rows={2}
                  value={interviewForm.notes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setScheduleInterviewApp(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow"
                >
                  Save & Notify Parent ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: RECORD FEE PAYMENT MODAL                        */}
      {/* ======================================================== */}
      {recordPaymentApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl">💳</span>
                <h3 className="text-base font-bold text-slate-900">
                  Record Admission Fee Payment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRecordPaymentApp(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Confirming fee clearance for <strong>{recordPaymentApp.student.fullName}</strong> ({recordPaymentApp.student.applyingForGrade}).
            </p>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="NET_BANKING">Net Banking / IMPS</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash at Cashier Desk</option>
                  <option value="BANK_TRANSFER">Direct Bank Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Receipt Number
                </label>
                <input
                  type="text"
                  required
                  value={paymentForm.receiptNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, receiptNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Transaction / Ref ID
                </label>
                <input
                  type="text"
                  required
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRecordPaymentApp(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow"
                >
                  Confirm & Clear Fee ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: OFFICIALLY ADMIT STUDENT MODAL                  */}
      {/* ======================================================== */}
      {admitStudentApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🎓</span>
                <h3 className="text-base font-bold text-slate-900">
                  Complete Formal Admission
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAdmitStudentApp(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Enrolling <strong>{admitStudentApp.student.fullName}</strong> as an official student in the School ERP database.
            </p>

            <form onSubmit={handleConfirmEnrollment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Official Admission Number (അഡ്മിഷൻ നമ്പർ)
                </label>
                <input
                  type="text"
                  required
                  value={enrollmentForm.officialAdmissionNumber}
                  onChange={(e) => setEnrollmentForm({ ...enrollmentForm, officialAdmissionNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-indigo-300 font-mono text-sm font-bold text-indigo-700 bg-indigo-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Assigned Class
                  </label>
                  <input
                    type="text"
                    required
                    value={enrollmentForm.assignedClass}
                    onChange={(e) => setEnrollmentForm({ ...enrollmentForm, assignedClass: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Section Allotment
                  </label>
                  <select
                    value={enrollmentForm.assignedSection}
                    onChange={(e) => setEnrollmentForm({ ...enrollmentForm, assignedSection: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Roll Number
                </label>
                <input
                  type="text"
                  required
                  value={enrollmentForm.rollNumber}
                  onChange={(e) => setEnrollmentForm({ ...enrollmentForm, rollNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={enrollmentForm.welcomeKitDispatched}
                  onChange={(e) => setEnrollmentForm({ ...enrollmentForm, welcomeKitDispatched: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Dispatch digital welcome kit & student ID badge link</span>
              </label>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdmitStudentApp(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow"
                >
                  Formally Enroll Student 🎓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: ADD DIRECT WALK-IN LEAD MODAL                   */}
      {/* ======================================================== */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📋</span>
                <h3 className="text-base font-bold text-slate-900">
                  Quick Capture: Walk-in / Direct Inquiry
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLeadModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDirectLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Student First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={directLeadForm.firstName}
                    onChange={(e) => setDirectLeadForm({ ...directLeadForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={directLeadForm.lastName}
                    onChange={(e) => setDirectLeadForm({ ...directLeadForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Applying Grade *
                  </label>
                  <select
                    value={directLeadForm.applyingForGrade}
                    onChange={(e) => setDirectLeadForm({ ...directLeadForm, applyingForGrade: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="Kindergarten">Kindergarten</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 11 - Science">Grade 11 - Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Lead Source
                  </label>
                  <select
                    value={directLeadForm.leadSource}
                    onChange={(e) => setDirectLeadForm({ ...directLeadForm, leadSource: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="WALK_IN">Walk-in Visit</option>
                    <option value="WHATSAPP">WhatsApp Inquiry</option>
                    <option value="PARENT_REFERRAL">Parent Referral</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Parent / Guardian Name *
                </label>
                <input
                  type="text"
                  required
                  value={directLeadForm.fatherName}
                  onChange={(e) => setDirectLeadForm({ ...directLeadForm, fatherName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98470 12345"
                    value={directLeadForm.phone}
                    onChange={(e) => setDirectLeadForm({ ...directLeadForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={directLeadForm.priority}
                    onChange={(e) => setDirectLeadForm({ ...directLeadForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="HIGH">High (Urgent)</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="NORMAL">Normal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Reception Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Parent visited during open house; interested in school bus."
                  value={directLeadForm.notes}
                  onChange={(e) => setDirectLeadForm({ ...directLeadForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow"
                >
                  Create Lead In Pipeline ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
