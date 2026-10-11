'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Camera,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  Eye,
  Trash2,
  Sparkles,
  Paperclip,
  Check,
  ChevronRight,
  ArrowLeft,
  X,
  FileCheck,
} from 'lucide-react';
import { Assignment, HomeworkSubmission, SubmissionFile } from '@krypton/types';
import { LMSStore, SAMPLE_NOTEBOOK_PAGE_SVG, SAMPLE_PHYSICS_NOTEBOOK_SVG } from '@/lib/lms-client';

interface StudentHomeworkPortalProps {
  onNotify?: (msg: string) => void;
}

export function StudentHomeworkPortal({ onNotify }: StudentHomeworkPortalProps) {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'SUBMITTED'>('PENDING');
  const [assignments, setAssignments] = useState<Assignment[]>(() => LMSStore.getAssignments());
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>(() => LMSStore.getSubmissions());
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Student info (Mock logged in student)
  const currentStudent = {
    id: 'std-14',
    name: 'Rahul Sharma',
    rollNo: '14',
    className: 'Class 10-A',
    classId: 'cls-10a',
  };

  // Upload modal state
  const [uploadedFiles, setUploadedFiles] = useState<SubmissionFile[]>([]);
  const [studentNotes, setStudentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [previewModalFile, setPreviewModalFile] = useState<SubmissionFile | null>(null);

  const refreshData = () => {
    setAssignments(LMSStore.getAssignments());
    setSubmissions(LMSStore.getSubmissions());
  };

  // Check which assignments the student has already submitted
  const studentSubmissionsMap = new Map<string, HomeworkSubmission>();
  submissions
    .filter((s) => s.studentId === currentStudent.id)
    .forEach((s) => studentSubmissionsMap.set(s.assignmentId, s));

  const pendingAssignments = assignments.filter((a) => !studentSubmissionsMap.has(a.id));
  const completedSubmissions = submissions.filter((s) => s.studentId === currentStudent.id);

  // Handle file selection from phone camera or gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const filesArray = Array.from(e.target.files);
    filesArray.forEach((file) => {
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const reader = new FileReader();
      reader.onload = () => {
        const resultUrl = (reader.result as string) || SAMPLE_NOTEBOOK_PAGE_SVG;
        const newFile: SubmissionFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          fileType: isPdf ? 'PDF' : 'IMAGE',
          url: resultUrl,
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
        };
        setUploadedFiles((prev) => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Quick Demo Add Note Photo / PDF
  const addQuickDemoPhoto = () => {
    const demo: SubmissionFile = {
      id: `file-demo-${Date.now()}`,
      name: `Notebook_Scan_Page_${uploadedFiles.length + 1}.png`,
      fileType: 'IMAGE',
      url: uploadedFiles.length % 2 === 0 ? SAMPLE_NOTEBOOK_PAGE_SVG : SAMPLE_PHYSICS_NOTEBOOK_SVG,
      sizeBytes: 450000,
      uploadedAt: new Date().toISOString(),
    };
    setUploadedFiles((prev) => [...prev, demo]);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleHomeworkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || uploadedFiles.length === 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      LMSStore.submitHomework({
        assignmentId: selectedAssignment.id,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentRollNo: currentStudent.rollNo,
        className: currentStudent.className,
        classId: currentStudent.classId,
        files: uploadedFiles,
        studentNotes,
      });

      setIsSubmitting(false);
      setSubmissionSuccess(true);
      refreshData();
      if (onNotify) onNotify('ഹോംവർക്ക് വിജയകരമായി സമർപ്പിച്ചു! Homework submitted successfully.');
    }, 700);
  };

  const closeSubmissionFlow = () => {
    setSelectedAssignment(null);
    setUploadedFiles([]);
    setStudentNotes('');
    setSubmissionSuccess(false);
  };

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="studio-banner bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
              <Smartphone size={14} />
              <span>വിദ്യാർത്ഥി മൊബൈൽ പോർട്ടൽ • Student Mobile View</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              ഹലോ, {currentStudent.name}!
            </h2>
            <p className="text-sm text-emerald-100 mt-1">
              {currentStudent.className} • Roll No: {currentStudent.rollNo} • സബ്മിറ്റ് ചെയ്യാനുള്ള ഹോംവർക്കുകൾ
            </p>
          </div>

          {/* Quick stats pills */}
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center">
              <span className="text-xs text-emerald-100 block">Pending</span>
              <span className="text-2xl font-extrabold">{pendingAssignments.length}</span>
            </div>
            <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center">
              <span className="text-xs text-emerald-100 block">Submitted</span>
              <span className="text-2xl font-extrabold">{completedSubmissions.length}</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'PENDING'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Clock size={16} />
          <span>ചെയ്യാനുള്ള ഹോംവർക്കുകൾ (Pending: {pendingAssignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SUBMITTED')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'SUBMITTED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>സമർപ്പിച്ചവ & മാർക്കുകൾ (Completed & Graded: {completedSubmissions.length})</span>
        </button>
      </div>

      {/* PENDING ASSIGNMENTS TAB */}
      {activeTab === 'PENDING' && (
        <div className="space-y-4">
          {pendingAssignments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
              <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
              <h3 className="text-lg font-bold text-gray-900 mt-3">എല്ലാ ഹോംവർക്കുകളും പൂർത്തിയായി!</h3>
              <p className="text-sm text-gray-500 mt-1">
                You have completed all assignments assigned by your teachers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingAssignments.map((asg) => (
                <div
                  key={asg.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-emerald-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {asg.subject} {asg.subjectMl && `(${asg.subjectMl})`}
                      </span>
                      <span className="text-xs font-bold text-gray-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        {asg.maxMarks} Marks
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 mt-2">{asg.title}</h3>
                    <p className="text-xs font-medium text-emerald-800 mt-0.5">{asg.titleMl}</p>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{asg.description}</p>

                    {/* Teacher's attached worksheet */}
                    {asg.attachments.length > 0 && (
                      <div className="mt-3 p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Paperclip size={13} className="text-emerald-600" />
                          <span className="font-medium truncate max-w-[180px]">{asg.attachments[0].name}</span>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-semibold cursor-pointer hover:underline">
                          ഡൗൺലോഡ്
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                      <Clock size={13} />
                      <span>Due: {asg.dueDate}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedAssignment(asg);
                        setUploadedFiles([]);
                        setSubmissionSuccess(false);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all transform active:scale-95"
                    >
                      <Camera size={14} />
                      <span>ഫോട്ടോ / PDF സബ്മിറ്റ് ചെയ്യുക</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPLETED & GRADED SUBMISSIONS TAB */}
      {activeTab === 'SUBMITTED' && (
        <div className="space-y-4">
          {completedSubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
              <Clock className="mx-auto text-gray-400" size={48} />
              <h3 className="text-lg font-bold text-gray-900 mt-3">സമർപ്പിച്ച വർക്കുകൾ ലഭ്യമല്ല</h3>
              <p className="text-sm text-gray-500 mt-1">Submitted assignments will appear here with teacher marks.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedSubmissions.map((sub) => {
                const asg = assignments.find((a) => a.id === sub.assignmentId);

                return (
                  <div key={sub.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {asg?.subject || 'Coursework'}
                        </span>
                        <h4 className="text-base font-bold text-gray-900 mt-1.5">
                          {asg?.title || 'Assignment'}
                        </h4>
                      </div>

                      {/* Marks Awarded Pill */}
                      {sub.status === 'GRADED' ? (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-emerald-700 font-extrabold text-lg">
                            <Award size={20} />
                            <span>
                              {sub.grade} / {sub.maxMarks}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            വിലയിരുത്തി (Graded)
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          ടീച്ചറുടെ പരിശോധനയിൽ
                        </span>
                      )}
                    </div>

                    {/* Teacher's feedback comment */}
                    {sub.feedback && (
                      <div className="mt-3 p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                        <span className="text-xs font-bold text-emerald-900 block">
                          ടീച്ചറുടെ വിലയിരുത്തൽ (Feedback):
                        </span>
                        <p className="text-xs text-emerald-800 mt-1">{sub.feedback}</p>
                        {sub.gradedByName && (
                          <span className="text-[10px] text-emerald-600 mt-1.5 block">
                            — {sub.gradedByName}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Submitted files preview */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span>Submitted on {new Date(sub.submissionDate).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1.5">
                        {sub.files.map((file) => (
                          <button
                            key={file.id}
                            onClick={() => setPreviewModalFile(file)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                          >
                            <Eye size={12} />
                            <span>{file.fileType === 'IMAGE' ? 'Photo' : 'PDF'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MOBILE HOMEWORK SUBMISSION MODAL */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            {!submissionSuccess ? (
              <form onSubmit={handleHomeworkSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      {selectedAssignment.subject}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-1">
                      {selectedAssignment.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeSubmissionFlow}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 border border-gray-200">
                  <p className="font-semibold text-gray-800">നിർദ്ദേശങ്ങൾ (Instructions):</p>
                  <p className="mt-1">{selectedAssignment.description}</p>
                </div>

                {/* Upload Section - Mobile Style */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase">
                    ഹോംവർക്ക് ഫോട്ടോ / PDF അപ്ലോഡ് ചെയ്യുക *
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Camera Capture Button */}
                    <label className="flex flex-col items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100 border-2 border-dashed border-emerald-300 rounded-2xl cursor-pointer transition-all text-center">
                      <Camera className="text-emerald-700 mb-1" size={26} />
                      <span className="text-xs font-bold text-emerald-900">ഫോൺ ക്യാമറ</span>
                      <span className="text-[10px] text-emerald-700">Take Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {/* Gallery or PDF Picker */}
                    <label className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 border-2 border-dashed border-indigo-300 rounded-2xl cursor-pointer transition-all text-center">
                      <Upload className="text-indigo-700 mb-1" size={26} />
                      <span className="text-xs font-bold text-indigo-900">ഫയൽ / PDF</span>
                      <span className="text-[10px] text-indigo-700">Choose PDF / Image</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Quick Browser Demo Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={addQuickDemoPhoto}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
                    >
                      <Sparkles size={13} />
                      <span>+ ഡെമോ നോട്ട്ബുക്ക് പേജ് ഫോട്ടോ ചേർക്കുക (Quick Demo Photo)</span>
                    </button>
                  </div>
                </div>

                {/* Selected Files Preview List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-gray-700 block">
                      അപ്ലോഡ് ചെയ്ത പേജുകൾ ({uploadedFiles.length}):
                    </span>

                    <div className="space-y-2">
                      {uploadedFiles.map((file, idx) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-xl"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {/* Thumbnail */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-10 h-10 object-cover rounded-lg border border-gray-200 bg-white"
                            />
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-gray-800 truncate">{file.name}</p>
                              <span className="text-[10px] text-emerald-600 font-medium">
                                Page {idx + 1} • {file.fileType}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewModalFile(file)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-white"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-white"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Student Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    ടീച്ചറോട് പറയാനുള്ളത് / Student Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ഉദാഹരണം: സർ, ഗ്രാഫ് വരച്ച് പേജ് 2-ൽ ചേർത്തിട്ടുണ്ട്..."
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeSubmissionFlow}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || uploadedFiles.length === 0}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <span>അപ്ലോഡ് ചെയ്യുന്നു...</span>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>സബ്മിറ്റ് ചെയ്യുക (Submit Work)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success Confirmation Card */
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">ഹോംവർക്ക് സമർപ്പിച്ചു!</h3>
                <p className="text-xs text-gray-600 max-w-xs mx-auto">
                  നിങ്ങളുടെ അസൈൻമെന്റ് വിജയകരമായി ടീച്ചർക്ക് കൈമാറി. മൂല്യനിർണ്ണയത്തിന് ശേഷം മാർക്ക് ഇവിടെ കാണാം.
                </p>
                <button
                  onClick={closeSubmissionFlow}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow"
                >
                  ശരി (Done)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW LIGHTBOX */}
      {previewModalFile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            <div className="p-3 bg-gray-900 text-white flex items-center justify-between">
              <span className="text-sm font-semibold">{previewModalFile.name}</span>
              <button
                onClick={() => setPreviewModalFile(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 bg-gray-950 flex-1 overflow-auto flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewModalFile.url}
                alt={previewModalFile.name}
                className="max-h-[80vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
