'use client';

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Plus,
  CheckCircle2,
  Clock,
  Eye,
  Award,
  Search,
  Filter,
  Paperclip,
  Download,
  X,
  Sparkles,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Assignment, HomeworkSubmission, SubmissionFile } from '@krypton/types';
import { LMSStore } from '@/lib/lms-client';

interface HomeworkTeacherManagerProps {
  onNotify?: (msg: string) => void;
}

export function HomeworkTeacherManager({ onNotify }: HomeworkTeacherManagerProps) {
  const [assignments, setAssignments] = useState<Assignment[]>(() => LMSStore.getAssignments());
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>(() => LMSStore.getSubmissions());
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<HomeworkSubmission | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<SubmissionFile | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [submissionFilter, setSubmissionFilter] = useState<'ALL' | 'PENDING' | 'GRADED'>('ALL');

  // Grading form state
  const [gradeInput, setGradeInput] = useState<number | ''>('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  // Create Assignment Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTitleMl, setNewTitleMl] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newSubjectMl, setNewSubjectMl] = useState('കണക്ക്');
  const [newClass, setNewClass] = useState('Class 10-A');
  const [newDueDate, setNewDueDate] = useState(
    () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newMaxMarks, setNewMaxMarks] = useState<number>(20);
  const [newDescription, setNewDescription] = useState('');
  const [newDescriptionMl, setNewDescriptionMl] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');

  const refreshData = () => {
    setAssignments(LMSStore.getAssignments());
    setSubmissions(LMSStore.getSubmissions());
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    LMSStore.createAssignment({
      title: newTitle,
      titleMl: newTitleMl || newTitle,
      description: newDescription,
      descriptionMl: newDescriptionMl || newDescription,
      subject: newSubject,
      subjectMl: newSubjectMl,
      className: newClass,
      classId: 'cls-10a',
      teacherId: 'tch-01',
      teacherName: 'Suresh Kumar (Teacher)',
      dueDate: newDueDate,
      maxMarks: Number(newMaxMarks) || 20,
      attachments: attachedFileName
        ? [
            {
              id: window.crypto.randomUUID(),
              name: attachedFileName,
              fileType: attachedFileName.endsWith('.pdf') ? 'PDF' : 'IMAGE',
              url: '#',
              size: '1.2 MB',
            },
          ]
        : [],
      status: 'ACTIVE',
      totalStudents: 32,
      allowLateSubmission: true,
    });

    setShowCreateModal(false);
    resetCreateForm();
    refreshData();
    if (onNotify) onNotify('അസൈൻമെന്റ് വിജയകരമായി പബ്ലിഷ് ചെയ്തു! Assignment published successfully.');
  };

  const resetCreateForm = () => {
    setNewTitle('');
    setNewTitleMl('');
    setNewDescription('');
    setNewDescriptionMl('');
    setAttachedFileName('');
    setNewMaxMarks(20);
  };

  const openGradingModal = (sub: HomeworkSubmission) => {
    setSelectedSubmission(sub);
    setGradeInput(sub.grade !== undefined ? sub.grade : '');
    setFeedbackInput(sub.feedback || '');
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setIsGrading(true);
    const score = Number(gradeInput) || 0;
    LMSStore.gradeSubmission(
      selectedSubmission.id,
      score,
      feedbackInput || 'Work evaluated and verified.',
      'Suresh Kumar (Teacher)'
    );

    setIsGrading(false);
    setSelectedSubmission(null);
    refreshData();
    if (onNotify) onNotify(`മാർക്ക് നൽകി വിജയകരമായി സേവ് ചെയ്തു (${score}/${selectedSubmission.maxMarks})`);
  };

  const quickFeedbackChips = [
    'വളരെ മികച്ച ശൈലി! Excellent presentation.',
    'സ്റ്റെപ്പുകൾ കൃത്യമായി എഴുതിയിട്ടുണ്ട്. Steps well-explained.',
    'കയ്യക്ഷരം കൂടുതൽ വൃത്തിയാക്കുക. Work on neatness.',
    'ചോദ്യം 3 വീണ്ടും കണക്കുകൂട്ടി പരിശോധിക്കുക. Re-check question 3.',
    'ഡയഗ്രമുകൾ പെൻസിൽ ഉപയോഗിച്ച് കൃത്യമായി വരച്ചിരിക്കുന്നു.',
  ];

  const filteredAssignments = assignments.filter((a) => {
    const matchesSubject = filterSubject === 'ALL' || a.subject === filterSubject;
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.titleMl.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const activeSubmissionsList = submissions.filter((s) => {
    if (selectedAssignment && s.assignmentId !== selectedAssignment.id) return false;
    if (submissionFilter === 'PENDING') return s.status === 'SUBMITTED';
    if (submissionFilter === 'GRADED') return s.status === 'GRADED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              ടീച്ചർ പോർട്ടൽ • Teacher LMS
            </span>
            <span className="text-xs text-gray-500">Class 10-A • Academic Year 2026-27</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-1">
            ഹോംവർക്ക് & അസൈൻമെന്റ് മാനേജ്മെന്റ്
          </h2>
          <p className="text-sm text-gray-600">
            Create assignments, upload worksheets, and review photos/PDFs submitted by students.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all transform active:scale-95"
        >
          <Plus size={18} />
          <span>പുതിയ അസൈൻമെന്റ് ചേർക്കുക</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={17} />
          <input
            type="text"
            placeholder="അസൈൻമെന്റ് തിരയുക / Search assignment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full py-2.5 px-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">എല്ലാ വിഷയങ്ങളും (All Subjects)</option>
            <option value="Mathematics">Mathematics (കണക്ക്)</option>
            <option value="Physics">Physics (ഭൗതികശാസ്ത്രം)</option>
            <option value="Malayalam">Malayalam (മലയാളം)</option>
            <option value="Computer Science">Computer Science</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setSelectedAssignment(null)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
              selectedAssignment === null
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            എല്ലാ അസൈൻമെന്റുകളും ({assignments.length})
          </button>
          {selectedAssignment && (
            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded font-medium truncate max-w-[150px]">
              {selectedAssignment.subject}
            </span>
          )}
        </div>
      </div>

      {/* Assignments List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssignments.map((asg) => {
          const isSelected = selectedAssignment?.id === asg.id;
          const percentageSubmitted = Math.round((asg.submissionCount / asg.totalStudents) * 100);

          return (
            <div
              key={asg.id}
              className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-md'
                  : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800">
                      {asg.className}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700">
                      {asg.subject} {asg.subjectMl && `(${asg.subjectMl})`}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    Max: {asg.maxMarks} Marks
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 mt-2.5 line-clamp-1">{asg.title}</h3>
                <p className="text-xs font-medium text-indigo-900 mt-0.5 line-clamp-1">{asg.titleMl}</p>
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{asg.description}</p>

                {/* Attachments preview */}
                {asg.attachments.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium">
                      <Paperclip size={13} className="text-gray-500" />
                      <span className="truncate max-w-[200px]">{asg.attachments[0].name}</span>
                      <span className="text-[10px] text-gray-400">({asg.attachments[0].size})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress & Actions */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-gray-400" />
                    <span>Due: {asg.dueDate}</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {asg.submissionCount}/{asg.totalStudents} Submitted ({percentageSubmitted}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentageSubmitted}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    {asg.gradedCount} Evaluated
                  </span>

                  <button
                    onClick={() => setSelectedAssignment(isSelected ? null : asg)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600'
                    }`}
                  >
                    <span>{isSelected ? 'Selected' : 'View Submissions'}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submissions Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="text-indigo-600" size={20} />
              <span>വിദ്യാർത്ഥികളുടെ സബ്മിഷനുകൾ (Student Submissions)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {selectedAssignment
                ? `Showing submissions for: "${selectedAssignment.title}"`
                : 'Showing all student submissions across assignments'}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setSubmissionFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                submissionFilter === 'ALL' ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'text-gray-600'
              }`}
            >
              All ({activeSubmissionsList.length})
            </button>
            <button
              onClick={() => setSubmissionFilter('PENDING')}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                submissionFilter === 'PENDING' ? 'bg-white text-amber-700 font-bold shadow-xs' : 'text-gray-600'
              }`}
            >
              Pending Evaluation
            </button>
            <button
              onClick={() => setSubmissionFilter('GRADED')}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                submissionFilter === 'GRADED' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-gray-600'
              }`}
            >
              Graded
            </button>
          </div>
        </div>

        {activeSubmissionsList.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="mx-auto text-gray-300" size={40} />
            <p className="text-sm font-semibold text-gray-700 mt-3">സബ്മിഷനുകൾ കണ്ടെത്തിയില്ല</p>
            <p className="text-xs text-gray-500 mt-1">No submissions matching the selected filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 mt-2">
            {activeSubmissionsList.map((sub) => {
              const asg = assignments.find((a) => a.id === sub.assignmentId);

              return (
                <div
                  key={sub.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/70 p-3 rounded-xl transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {sub.studentRollNo}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">{sub.studentName}</h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {sub.className} • Roll {sub.studentRollNo}
                        </span>
                        {sub.isLate && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
                            LATE
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        Assignment: <span className="text-indigo-900">{asg?.title || 'Coursework'}</span>
                      </p>

                      {sub.studentNotes && (
                        <p className="text-xs text-gray-500 mt-1 italic bg-amber-50/60 p-1.5 rounded border border-amber-100/80">
                          &quot;{sub.studentNotes}&quot;
                        </p>
                      )}

                      {/* File Attachments */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {sub.files.map((file) => (
                          <button
                            key={file.id}
                            onClick={() => setPreviewFile(file)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-all"
                          >
                            <Eye size={13} />
                            <span>{file.name}</span>
                            <span className="text-[10px] text-indigo-500">
                              ({file.fileType === 'IMAGE' ? 'Photo' : 'PDF'})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Grading status & action */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    {sub.status === 'GRADED' ? (
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-emerald-700 font-bold text-base">
                          <Award size={18} />
                          <span>
                            {sub.grade} / {sub.maxMarks}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500">Evaluated</span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                        Pending Marks
                      </span>
                    )}

                    <button
                      onClick={() => openGradingModal(sub)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        sub.status === 'GRADED'
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      }`}
                    >
                      {sub.status === 'GRADED' ? 'മാർക്ക് തിരുത്തുക' : 'മൂല്യനിർണ്ണയം / Grade Now'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE ASSIGNMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">പുതിയ അസൈൻമെന്റ് നൽകുക</h3>
                <p className="text-xs text-gray-500">Create new homework assignment for students</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Assignment Title (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quadratic Equations Ex 4.2"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Title in Malayalam (മലയാളം തലക്കെട്ട്)
                </label>
                <input
                  type="text"
                  placeholder="ഉദാഹരണം: ക്വാഡ്രാറ്റിക് സമവാക്യങ്ങൾ - ഹോംവർക്ക് 4.2"
                  value={newTitleMl}
                  onChange={(e) => setNewTitleMl(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subject</label>
                  <select
                    value={newSubject}
                    onChange={(e) => {
                      setNewSubject(e.target.value);
                      if (e.target.value === 'Mathematics') setNewSubjectMl('കണക്ക്');
                      if (e.target.value === 'Physics') setNewSubjectMl('ഭൗതികശാസ്ത്രം');
                      if (e.target.value === 'Malayalam') setNewSubjectMl('മലയാളം');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Malayalam">Malayalam</option>
                    <option value="English">English</option>
                    <option value="Social Science">Social Science</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Class</label>
                  <select
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Class 10-A">Class 10-A</option>
                    <option value="Class 10-B">Class 10-B</option>
                    <option value="Class 9-A">Class 9-A</option>
                    <option value="Class 8-A">Class 8-A</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Maximum Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Instructions / ചോദ്യവിവരങ്ങൾ
                </label>
                <textarea
                  rows={3}
                  placeholder="കുട്ടികൾ ചെയ്യേണ്ട കാര്യങ്ങൾ വിശദീകരിക്കുക..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Worksheet Attachment (PDF / Question Image)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Chapter_4_Quadratic_Equations_Worksheet.pdf"
                    value={attachedFileName}
                    onChange={(e) => setAttachedFileName(e.target.value)}
                    className="flex-1 px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachedFileName('Model_Question_Paper_Worksheet.pdf')}
                    className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                  >
                    + Add Sample PDF
                  </button>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  പബ്ലിഷ് ചെയ്യുക (Publish Assignment)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRADING & EVALUATION MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  മൂല്യനിർണ്ണയ ബോർഡ് • Student Submission Evaluation
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">
                  {selectedSubmission.studentName} (Roll No: {selectedSubmission.studentRollNo})
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              {/* Left Column: Student Submitted Files Viewer */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-gray-700 flex items-center gap-1.5">
                  <Paperclip size={14} />
                  <span>സബ്മിറ്റ് ചെയ്ത പേജുകൾ / Documents ({selectedSubmission.files.length})</span>
                </h4>

                <div className="border border-gray-200 rounded-2xl p-2 bg-gray-50 space-y-2">
                  {selectedSubmission.files.map((file, idx) => (
                    <div key={file.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                      <div className="p-2.5 bg-gray-100 flex items-center justify-between text-xs font-semibold text-gray-700">
                        <span>
                          Page {idx + 1}: {file.name}
                        </span>
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <Eye size={13} />
                          Full View
                        </button>
                      </div>

                      {/* Document Preview Frame */}
                      <div className="p-2 flex justify-center bg-gray-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={file.url}
                          alt={file.name}
                          className="max-h-[380px] w-auto object-contain rounded shadow"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {selectedSubmission.studentNotes && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                    <span className="font-bold text-amber-900">Student Note: </span>
                    <span className="text-amber-800">{selectedSubmission.studentNotes}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Teacher Marks & Feedback Form */}
              <form onSubmit={handleSaveGrade} className="space-y-4">
                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                  <label className="block text-xs font-bold text-indigo-900 uppercase mb-1">
                    മാർക്കുകൾ നൽകുക / Enter Marks (Out of {selectedSubmission.maxMarks}) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min="0"
                      max={selectedSubmission.maxMarks}
                      value={gradeInput}
                      onChange={(e) => setGradeInput(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 19"
                      className="w-32 text-2xl font-bold px-3 py-2 bg-white border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-indigo-950"
                    />
                    <span className="text-xl font-bold text-gray-500">/ {selectedSubmission.maxMarks} Marks</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    ടീച്ചറുടെ ഫീഡ്ബാക്ക് / Constructive Feedback
                  </label>
                  <textarea
                    rows={4}
                    placeholder="കുട്ടിയുടെ നോട്ട്ബുക്കിലെ ഉത്തരങ്ങളെക്കുറിച്ചുള്ള അഭിപ്രായങ്ങൾ..."
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Quick Feedback Chips */}
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Quick Remarks:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickFeedbackChips.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setFeedbackInput((prev) => (prev ? `${prev} ${chip}` : chip))
                        }
                        className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 transition-all text-left"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setSelectedSubmission(null)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGrading || gradeInput === ''}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>സേവ് ചെയ്യുക & കുട്ടിയെ അറിയിക്കുക</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW LIGHTBOX */}
      {previewFile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            <div className="p-3 bg-gray-900 text-white flex items-center justify-between">
              <span className="text-sm font-semibold">{previewFile.name}</span>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 bg-gray-950 flex-1 overflow-auto flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-h-[80vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
