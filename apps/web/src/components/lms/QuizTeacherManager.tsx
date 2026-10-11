'use client';

import React, { useState } from 'react';
import {
  Timer,
  Plus,
  BarChart2,
  Users,
  Award,
  CheckCircle2,
  Trash2,
  X,
  FileQuestion,
  Sparkles,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { MCQQuiz, MCQQuestion, QuizAttempt } from '@krypton/types';
import { LMSStore } from '@/lib/lms-client';

interface QuizTeacherManagerProps {
  onNotify?: (msg: string) => void;
}

export function QuizTeacherManager({ onNotify }: QuizTeacherManagerProps) {
  const [quizzes, setQuizzes] = useState<MCQQuiz[]>(() => LMSStore.getQuizzes());
  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => LMSStore.getAttempts());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuizAnalytics, setSelectedQuizAnalytics] = useState<MCQQuiz | null>(null);

  // New Quiz Builder State
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizTitleMl, setNewQuizTitleMl] = useState('');
  const [newSubject, setNewSubject] = useState('General Science');
  const [newClass, setNewClass] = useState('Class 10-A');
  const [newDuration, setNewDuration] = useState<number>(10);
  const [newPassPct, setNewPassPct] = useState<number>(60);
  const [newDescription, setNewDescription] = useState('');

  // Questions builder state for the quiz
  const [questions, setQuestions] = useState<Array<Omit<MCQQuestion, 'id'>>>([
    {
      questionText: 'Which planet is known as the Red Planet?',
      questionTextMl: 'ചുവന്ന ഗ്രഹം എന്നറിയപ്പെടുന്ന ഗ്രഹം ഏതാണ്?',
      options: [
        { id: 'A', text: 'Venus (ശുക്രൻ)' },
        { id: 'B', text: 'Mars (ചൊവ്വ)' },
        { id: 'C', text: 'Jupiter (വ്യാഴം)' },
        { id: 'D', text: 'Mercury (ബുധൻ)' },
      ],
      correctOptionId: 'B',
      explanation: 'Mars appears reddish due to iron oxide (rust) on its surface.',
      explanationMl: 'ചൊവ്വയുടെ ഉപരിതലത്തിലെ അയേൺ ഓക്സൈഡ് കാരണമാണ് ചുവപ്പ് നിറം.',
      marks: 4,
    },
    {
      questionText: 'What is the chemical formula of common salt?',
      questionTextMl: 'കറിയുപ്പിന്റെ രാസസൂത്രം എന്താണ്?',
      options: [
        { id: 'A', text: 'NaCl' },
        { id: 'B', text: 'KCl' },
        { id: 'C', text: 'NaOH' },
        { id: 'D', text: 'HCl' },
      ],
      correctOptionId: 'A',
      explanation: 'Common table salt is Sodium Chloride (NaCl).',
      explanationMl: 'സോഡിയം ക്ലോറൈഡ് ആണ് കറിയുപ്പ്.',
      marks: 4,
    },
  ]);

  const [currentQText, setCurrentQText] = useState('');
  const [currentQTextMl, setCurrentQTextMl] = useState('');
  const [currentOptA, setCurrentOptA] = useState('');
  const [currentOptB, setCurrentOptB] = useState('');
  const [currentOptC, setCurrentOptC] = useState('');
  const [currentOptD, setCurrentOptD] = useState('');
  const [currentCorrectOpt, setCurrentCorrectOpt] = useState('A');
  const [currentExplanation, setCurrentExplanation] = useState('');
  const [currentMarks, setCurrentMarks] = useState<number>(3);

  const addQuestionToBuilder = () => {
    if (!currentQText.trim() || !currentOptA.trim() || !currentOptB.trim()) return;

    setQuestions((prev) => [
      ...prev,
      {
        questionText: currentQText,
        questionTextMl: currentQTextMl,
        options: [
          { id: 'A', text: currentOptA },
          { id: 'B', text: currentOptB },
          { id: 'C', text: currentOptC || 'Option C' },
          { id: 'D', text: currentOptD || 'Option D' },
        ],
        correctOptionId: currentCorrectOpt,
        explanation: currentExplanation || 'Standard scientific concept.',
        marks: Number(currentMarks) || 3,
      },
    ]);

    // Reset current question inputs
    setCurrentQText('');
    setCurrentQTextMl('');
    setCurrentOptA('');
    setCurrentOptB('');
    setCurrentOptC('');
    setCurrentOptD('');
    setCurrentExplanation('');
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim() || questions.length === 0) return;

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    const questionsWithIds: MCQQuestion[] = questions.map((q, i) => ({
      ...q,
      id: `q-${Date.now()}-${i}`,
    }));

    LMSStore.createQuiz({
      title: newQuizTitle,
      titleMl: newQuizTitleMl || newQuizTitle,
      description: newDescription || 'Timed online model exam for class assessment.',
      subject: newSubject,
      className: newClass,
      classId: 'cls-10a',
      durationMinutes: Number(newDuration) || 10,
      totalMarks,
      passPercentage: Number(newPassPct) || 60,
      instructions: [
        `Duration: ${newDuration} minutes. Auto-submits on timeout.`,
        'Each question has single correct choice.',
        'Immediate score calculation upon submission.',
      ],
      questions: questionsWithIds,
      status: 'ACTIVE',
    });

    setShowCreateModal(false);
    setQuizzes(LMSStore.getQuizzes());
    if (onNotify) onNotify('പുതിയ മോഡൽ പരീക്ഷ വിജയകരമായി തയ്യാറാക്കി! Online Quiz created.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
              ടീച്ചർ ക്വിസ് സ്റ്റുഡിയോ • Model Exam Creator
            </span>
            <span className="text-xs text-gray-500">Auto-Grading Engine</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-1">
            ഓൺലൈൻ മോഡൽ എക്സാം മാനേജർ & അനലിറ്റിക്സ്
          </h2>
          <p className="text-sm text-gray-600">
            Create timed MCQ model exams with automated mark calculations and view class attempt rankings.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm shadow-sm transition-all transform active:scale-95"
        >
          <Plus size={18} />
          <span>പുതിയ മോഡൽ പരീക്ഷ നിർമ്മിക്കുക</span>
        </button>
      </div>

      {/* Quizzes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizzes.map((quiz) => {
          const quizAttempts = attempts.filter((a) => a.quizId === quiz.id);
          const passCount = quizAttempts.filter((a) => a.passed).length;
          const avgScore = quizAttempts.length
            ? Math.round(
                quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttempts.length
              )
            : 0;

          return (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-violet-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700">
                    {quiz.subject} • {quiz.className}
                  </span>
                  <span className="text-xs font-bold text-gray-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    {quiz.totalMarks} Marks ({quiz.questions.length} Qs)
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 mt-2">{quiz.title}</h3>
                <p className="text-xs font-semibold text-violet-900 mt-0.5">{quiz.titleMl}</p>
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{quiz.description}</p>

                {/* Performance Mini Bar */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-center">
                  <div className="bg-gray-50 p-2 rounded-xl">
                    <span className="text-[10px] text-gray-500 block">Attempts</span>
                    <span className="text-sm font-bold text-gray-900">{quizAttempts.length}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-xl">
                    <span className="text-[10px] text-gray-500 block">Avg Score</span>
                    <span className="text-sm font-bold text-indigo-700">
                      {quizAttempts.length ? `${avgScore}%` : '—'}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-xl">
                    <span className="text-[10px] text-gray-500 block">Passed</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {quizAttempts.length ? `${passCount}/${quizAttempts.length}` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Timer size={13} className="text-violet-600" />
                  {quiz.durationMinutes} Minutes Countdown
                </span>

                <button
                  onClick={() => setSelectedQuizAnalytics(quiz)}
                  className="px-3.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <BarChart2 size={14} />
                  <span>ലീഡർബോർഡ് & മാർക്കുകൾ</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUIZ LEADERBOARD & ATTEMPTS MODAL */}
      {selectedQuizAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <span className="text-xs font-bold text-violet-700 uppercase">
                  Class Performance Analysis
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">
                  {selectedQuizAnalytics.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedQuizAnalytics(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-bold uppercase text-gray-700">
                കുട്ടികളുടെ സ്കോറുകൾ (Automated Student Scores)
              </h4>

              {(() => {
                const quizAttempts = attempts.filter(
                  (a) => a.quizId === selectedQuizAnalytics.id
                );

                if (quizAttempts.length === 0) {
                  return (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl">
                      <p className="text-xs text-gray-500">No student submissions recorded yet.</p>
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                    {quizAttempts.map((att, idx) => (
                      <div
                        key={att.id}
                        className="p-3.5 flex items-center justify-between hover:bg-gray-50 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-800 font-bold flex items-center justify-center text-[11px]">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-gray-900 block">{att.studentName}</span>
                            <span className="text-gray-500 text-[11px]">
                              Time spent: {Math.floor(att.timeSpentSeconds / 60)}m{' '}
                              {att.timeSpentSeconds % 60}s
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-extrabold text-sm text-gray-900">
                            {att.score} / {att.totalMarks} ({att.percentage}%)
                          </span>
                          <span
                            className={`block font-bold text-[10px] ${
                              att.passed ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {att.passed ? 'PASSED ✓' : 'FAILED'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* CREATE QUIZ MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">പുതിയ മോഡൽ പരീക്ഷ തയ്യാറാക്കുക</h3>
                <p className="text-xs text-gray-500">Build timed MCQ examination with instant auto-grading</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SSLC Physics Chapter 3 Model Exam"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Title in Malayalam (മലയാളം തലക്കെട്ട്)
                </label>
                <input
                  type="text"
                  placeholder="ഉദാഹരണം: പത്താം ക്ലാസ് ഫിസിക്സ് മാതൃകാ പരീക്ഷ"
                  value={newQuizTitleMl}
                  onChange={(e) => setNewQuizTitleMl(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subject</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  >
                    <option value="General Science">General Science (ശാസ്ത്രം)</option>
                    <option value="Mathematics">Mathematics (കണക്ക്)</option>
                    <option value="Physics">Physics</option>
                    <option value="Social Science">Social Science</option>
                    <option value="English">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Timer (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-gray-700">
                    ചോദ്യങ്ങൾ / Exam Questions ({questions.length})
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-2xl p-3 bg-gray-50">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-start justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-gray-900">
                          {idx + 1}. {q.questionText}
                        </span>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          Correct: Option {q.correctOptionId} • ({q.marks} Marks)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Question Mini Box */}
                <div className="mt-3 p-3 bg-violet-50/60 rounded-2xl border border-violet-100 space-y-2">
                  <span className="text-xs font-bold text-violet-900 block">
                    + ചോദ്യം ചേർക്കുക (Add Question to Test)
                  </span>

                  <input
                    type="text"
                    placeholder="Question text in English..."
                    value={currentQText}
                    onChange={(e) => setCurrentQText(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />

                  <input
                    type="text"
                    placeholder="ചോദ്യം മലയാളത്തിൽ (Malayalam translation)..."
                    value={currentQTextMl}
                    onChange={(e) => setCurrentQTextMl(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Option A"
                      value={currentOptA}
                      onChange={(e) => setCurrentOptA(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Option B"
                      value={currentOptB}
                      onChange={(e) => setCurrentOptB(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Option C"
                      value={currentOptC}
                      onChange={(e) => setCurrentOptC(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Option D"
                      value={currentOptD}
                      onChange={(e) => setCurrentOptD(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-gray-700">Correct Option:</span>
                      <select
                        value={currentCorrectOpt}
                        onChange={(e) => setCurrentCorrectOpt(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs font-bold"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={addQuestionToBuilder}
                      className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700"
                    >
                      + Add Question
                    </button>
                  </div>
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
                  disabled={questions.length === 0}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white shadow-sm disabled:opacity-50"
                >
                  പരീക്ഷ പബ്ലിഷ് ചെയ്യുക (Publish Test)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
