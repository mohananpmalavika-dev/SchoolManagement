'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BarChart3,
  Calendar,
  Check,
  Flag,
  Flame,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { MCQQuiz, QuizAttempt, QuestionBreakdown } from '@krypton/types';
import { LMSStore } from '@/lib/lms-client';

interface StudentMCQQuizRunnerProps {
  onNotify?: (msg: string) => void;
}

export function StudentMCQQuizRunner({ onNotify }: StudentMCQQuizRunnerProps) {
  const [quizzes, setQuizzes] = useState<MCQQuiz[]>(() => LMSStore.getQuizzes());
  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => LMSStore.getAttempts());

  // Active exam state
  const [activeQuiz, setActiveQuiz] = useState<MCQQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0);
  const [examStartedAt, setExamStartedAt] = useState<number>(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Result state
  const [lastResult, setLastResult] = useState<QuizAttempt | null>(null);

  // Mock logged-in student info
  const studentInfo = {
    studentId: 'std-14',
    studentName: 'Rahul Sharma',
    classId: 'cls-10a',
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startQuiz = (quiz: MCQQuiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeRemainingSeconds(quiz.durationMinutes * 60);
    setExamStartedAt(Date.now());
    setLastResult(null);
    setShowConfirmSubmit(false);
  };

  // Timer countdown hook
  useEffect(() => {
    if (!activeQuiz) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Timer reached 0: Auto submit!
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeQuiz]);

  const handleAutoSubmit = () => {
    if (!activeQuiz) return;
    executeSubmission();
    if (onNotify) onNotify('സമയം പൂർത്തിയായി! പരീക്ഷ ഓട്ടോമാറ്റിക് ആയി സബ്മിറ്റ് ചെയ്യപ്പെട്ടു.');
  };

  const handleManualSubmit = () => {
    setShowConfirmSubmit(true);
  };

  const executeSubmission = () => {
    if (!activeQuiz) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpentSeconds = Math.max(
      1,
      Math.round((Date.now() - examStartedAt) / 1000)
    );

    // Instant automatic grade calculation!
    const result = LMSStore.submitQuizAttempt(
      activeQuiz.id,
      studentInfo,
      answers,
      timeSpentSeconds
    );

    setLastResult(result);
    setActiveQuiz(null);
    setShowConfirmSubmit(false);
    setAttempts(LMSStore.getAttempts());

    if (onNotify) {
      onNotify(
        `പരീക്ഷ പൂർത്തിയായി! നിങ്ങളുടെ മാർക്ക്: ${result.score} / ${result.totalMarks} (${result.percentage}%)`
      );
    }
  };

  const selectAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalAnsweredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      {/* CASE 1: RESULT SCREEN (INSTANT AUTOMATED SCORECARD) */}
      {lastResult && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden p-6 md:p-8 space-y-6 animate-fadeIn">
          {/* Result Header Hero */}
          <div
            className={`p-6 rounded-2xl text-center relative overflow-hidden ${
              lastResult.passed
                ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white'
                : 'bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 text-white'
            }`}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-3">
              <Sparkles size={14} />
              <span>തത്സമയ ഓട്ടോമാറ്റിക് മൂല്യനിർണ്ണയം • Instant Auto-Graded</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black">{lastResult.quizTitle}</h2>
            {lastResult.quizTitleMl && (
              <p className="text-sm font-medium opacity-90 mt-1">{lastResult.quizTitleMl}</p>
            )}

            <div className="mt-5 flex items-center justify-center gap-6">
              <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/25 text-center">
                <span className="text-xs uppercase tracking-wider block opacity-90">നേടിയ മാർക്ക്</span>
                <span className="text-4xl font-black">
                  {lastResult.score} / {lastResult.totalMarks}
                </span>
              </div>

              <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/25 text-center">
                <span className="text-xs uppercase tracking-wider block opacity-90">ശതമാനം</span>
                <span className="text-4xl font-black">{lastResult.percentage}%</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase bg-white text-gray-900 shadow">
                {lastResult.passed ? 'വിജയിച്ചു! PASSED' : 'കൂടുതൽ പരിശീലിക്കുക / NEEDS PRACTICE'}
              </span>
              <span className="text-xs opacity-90">
                • സമയം: {Math.floor(lastResult.timeSpentSeconds / 60)}m {lastResult.timeSpentSeconds % 60}s
              </span>
            </div>
          </div>

          {/* Action to Retake or Go Back */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                വിശദമായ ഉത്തരങ്ങൾ & വിശകലനം (Detailed Solution Review)
              </h3>
              <p className="text-xs text-gray-500">
                ചോദ്യങ്ങളും ശരിയായ ഉത്തരങ്ങളും വിശദീകരണത്തോടൊപ്പം താഴെ നൽകുന്നു
              </p>
            </div>

            <button
              onClick={() => {
                setLastResult(null);
                setQuizzes(LMSStore.getQuizzes());
              }}
              className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <RotateCcw size={14} />
              <span>മറ്റ് പരീക്ഷകൾ കാണുക (Back to Exams)</span>
            </button>
          </div>

          {/* Question-by-Question Solution Breakdown */}
          <div className="space-y-4">
            {lastResult.breakdown.map((item, idx) => {
              // Find question from initial quizzes to display full question text and options
              const matchedQuiz = quizzes.find((q) => q.id === lastResult.quizId);
              const question = matchedQuiz?.questions.find((q) => q.id === item.questionId);

              return (
                <div
                  key={item.questionId}
                  className={`p-5 rounded-2xl border transition-all ${
                    item.isCorrect
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-red-200 bg-red-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          item.isCorrect ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-gray-700">
                        {item.isCorrect ? 'ശരിയുത്തരം (+Marks awarded)' : 'തെറ്റായ ഉത്തരം (Incorrect)'}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md ${
                        item.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.marksAwarded} Marks
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 mt-2.5">
                    {question?.questionText}
                  </h4>
                  {question?.questionTextMl && (
                    <p className="text-xs font-medium text-indigo-900 mt-0.5">
                      {question.questionTextMl}
                    </p>
                  )}

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {question?.options.map((opt) => {
                      const isStudentSelected = item.selectedOptionId === opt.id;
                      const isCorrectAnswer = item.correctOptionId === opt.id;

                      let style = 'bg-white border-gray-200 text-gray-700';
                      if (isCorrectAnswer) {
                        style = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold';
                      } else if (isStudentSelected && !isCorrectAnswer) {
                        style = 'bg-red-100 border-red-400 text-red-950 line-through';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${style}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center font-bold text-[10px]">
                              {opt.id}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {isCorrectAnswer && <Check size={15} className="text-emerald-700" />}
                          {isStudentSelected && !isCorrectAnswer && (
                            <XCircle size={15} className="text-red-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Box */}
                  <div className="mt-3 p-3 bg-white/80 rounded-xl border border-gray-200 text-xs text-gray-700">
                    <span className="font-bold text-indigo-900 block mb-0.5">
                      വിശദീകരണം (Explanation):
                    </span>
                    <p>{item.explanation}</p>
                    {item.explanationMl && (
                      <p className="text-indigo-800 mt-1 font-medium">{item.explanationMl}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CASE 2: ACTIVE EXAM IN PROGRESS (WITH STICKY COUNTDOWN TIMER) */}
      {activeQuiz && !lastResult && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden animate-fadeIn">
          {/* Sticky Header with Timer & Progress */}
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 p-4 md:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-indigo-700 uppercase">
                  {activeQuiz.subject} • {activeQuiz.className}
                </span>
                <h3 className="text-base font-bold text-gray-900">{activeQuiz.title}</h3>
              </div>

              {/* Countdown Timer Display */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono font-bold text-lg shadow-sm transition-all ${
                  timeRemainingSeconds <= 120
                    ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                }`}
              >
                <Timer size={20} className={timeRemainingSeconds <= 120 ? 'text-red-600' : 'text-indigo-600'} />
                <span>{formatTimer(timeRemainingSeconds)}</span>
                <span className="text-[10px] font-sans uppercase text-gray-500">Left</span>
              </div>
            </div>

            {/* Question Quick Navigation Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 mt-2">
              {activeQuiz.questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentQuestionIndex;

                let pillStyle = 'bg-gray-100 text-gray-600 border-gray-200';
                if (isCurrent) {
                  pillStyle = 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-300';
                } else if (isAnswered) {
                  pillStyle = 'bg-emerald-500 text-white font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-8 h-8 rounded-xl text-xs flex items-center justify-center flex-shrink-0 border transition-all ${pillStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Area */}
          <div className="p-6 md:p-8 space-y-6">
            {(() => {
              const currentQuestion = activeQuiz.questions[currentQuestionIndex];
              const selectedOptId = answers[currentQuestion.id] || '';

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">
                      ചോദ്യം {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                      +{currentQuestion.marks} Marks
                    </span>
                  </div>

                  {/* Question Text */}
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 leading-relaxed">
                      {currentQuestion.questionText}
                    </h3>
                    {currentQuestion.questionTextMl && (
                      <p className="text-sm font-semibold text-indigo-900 mt-2 leading-relaxed">
                        {currentQuestion.questionTextMl}
                      </p>
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5 pt-2">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = selectedOptId === opt.id;

                      return (
                        <div
                          key={opt.id}
                          onClick={() => selectAnswer(currentQuestion.id, opt.id)}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 shadow-sm'
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold border transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-gray-700 border-gray-300'
                              }`}
                            >
                              {opt.id}
                            </span>
                            <span className="text-sm font-medium text-gray-900">{opt.text}</span>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Bottom Actions Bar */}
            <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 flex items-center gap-1.5"
              >
                <ChevronLeft size={16} />
                <span>മുൻപത്തെ ചോദ്യം</span>
              </button>

              <div className="flex items-center gap-2">
                {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow transition-all flex items-center gap-1.5"
                  >
                    <span>അടുത്ത ചോദ്യം</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={16} />
                    <span>പരീക്ഷ സബ്മിറ്റ് ചെയ്യുക (Submit Exam)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUBMISSION MODAL */}
      {showConfirmSubmit && activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto">
              <HelpCircle size={32} />
            </div>

            <h3 className="text-lg font-bold text-gray-900">പരീക്ഷ സബ്മിറ്റ് ചെയ്യണോ?</h3>
            <p className="text-xs text-gray-600">
              നിങ്ങൾ {activeQuiz.questions.length} ചോദ്യങ്ങളിൽ {totalAnsweredCount} എണ്ണത്തിന് ഉത്തരം നൽകിയിട്ടുണ്ട്.
              സബ്മിറ്റ് ചെയ്താൽ ഉടൻ തന്നെ മാർക്കുകൾ കണക്കാക്കപ്പെടും.
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 border border-gray-200"
              >
                തുടർന്ന് എഴുതുക (Resume)
              </button>
              <button
                type="button"
                onClick={executeSubmission}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow"
              >
                തീർച്ചയായും സബ്മിറ്റ് ചെയ്യുക
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CASE 3: EXAM CATALOG / LIST (WHEN NO EXAM IS ACTIVE) */}
      {!activeQuiz && !lastResult && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 rounded-3xl shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold">
                  ഓൺലൈൻ മോഡൽ പരീക്ഷകൾ • Timed MCQ Model Exams
                </span>
                <h2 className="text-2xl font-black mt-2">
                  SSLC / ക്ലാസ് മോഡൽ പരീക്ഷാ കേന്ദ്രം
                </h2>
                <p className="text-xs text-indigo-200 mt-1">
                  കുട്ടികൾ പരീക്ഷ സബ്മിറ്റ് ചെയ്യുമ്പോൾ തന്നെ തത്സമയം മാർക്കുകളും ഉത്തരങ്ങളുടെ വിശദീകരണവും ലഭിക്കുന്നു.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                <Flame className="text-amber-400" size={24} />
                <div>
                  <span className="text-[10px] text-indigo-200 block">Available Tests</span>
                  <span className="text-xl font-bold">{quizzes.length} Model Exams</span>
                </div>
              </div>
            </div>
          </div>

          {/* Available Quizzes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => {
              const quizAttempts = attempts.filter((a) => a.quizId === quiz.id);
              const bestScore = quizAttempts.length
                ? Math.max(...quizAttempts.map((a) => a.percentage))
                : null;

              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                        {quiz.subject}
                      </span>
                      <span className="text-xs font-bold text-gray-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                        {quiz.totalMarks} Marks
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 mt-2.5">{quiz.title}</h3>
                    <p className="text-xs font-semibold text-indigo-900 mt-0.5">{quiz.titleMl}</p>
                    <p className="text-xs text-gray-600 mt-2">{quiz.description}</p>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1 font-semibold text-indigo-700">
                        <Timer size={14} />
                        <span>{quiz.durationMinutes} Minutes Timer</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HelpCircle size={14} />
                        <span>{quiz.questions.length} Questions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award size={14} />
                        <span>Pass: {quiz.passPercentage}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      {bestScore !== null ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          Best Score: {bestScore}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not Attempted Yet</span>
                      )}
                    </div>

                    <button
                      onClick={() => startQuiz(quiz)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all transform active:scale-95 flex items-center gap-1.5"
                    >
                      <span>പരീക്ഷ തുടങ്ങുക (Start Test)</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Past Attempts Leaderboard / History */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="text-indigo-600" size={18} />
              <span>മുൻപത്തെ പരീക്ഷാ ഫലങ്ങൾ (Past Exam History & Automated Scores)</span>
            </h3>

            {attempts.length === 0 ? (
              <p className="text-xs text-gray-500 mt-2">No exam attempts recorded yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 mt-3">
                {attempts.map((att) => (
                  <div
                    key={att.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-gray-900">{att.quizTitle}</h4>
                      <span className="text-gray-500">
                        {att.studentName} • Time taken: {Math.floor(att.timeSpentSeconds / 60)}m{' '}
                        {att.timeSpentSeconds % 60}s
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-gray-900">
                          {att.score} / {att.totalMarks} ({att.percentage}%)
                        </span>
                        <span
                          className={`block font-bold text-[10px] ${
                            att.passed ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {att.passed ? 'PASSED' : 'NEEDS PRACTICE'}
                        </span>
                      </div>

                      <button
                        onClick={() => setLastResult(att)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100"
                      >
                        ഉത്തരങ്ങൾ കാണുക
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
