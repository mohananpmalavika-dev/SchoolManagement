// Digital Learning Management System (LMS) Type Definitions

export type LMSFileType = 'IMAGE' | 'PDF' | 'DOC';

export interface AssignmentAttachment {
  id: string;
  name: string;
  fileType: LMSFileType;
  url: string;
  size: string;
}

export interface SubmissionFile {
  id: string;
  name: string;
  fileType: 'IMAGE' | 'PDF';
  url: string;
  previewUrl?: string;
  sizeBytes: number;
  uploadedAt: string;
}

export type AssignmentStatus = 'ACTIVE' | 'ARCHIVED' | 'UPCOMING';

export interface Assignment {
  id: string;
  title: string;
  titleMl: string;
  description: string;
  descriptionMl?: string;
  subject: string;
  subjectMl?: string;
  className: string;
  classId: string;
  teacherId: string;
  teacherName: string;
  dueDate: string;
  maxMarks: number;
  attachments: AssignmentAttachment[];
  status: AssignmentStatus;
  submissionCount: number;
  gradedCount: number;
  totalStudents: number;
  allowLateSubmission: boolean;
  createdAt: string;
}

export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'GRADED' | 'RESUBMISSION_REQUESTED';

export interface HomeworkSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  className: string;
  classId: string;
  submissionDate: string;
  isLate: boolean;
  files: SubmissionFile[];
  studentNotes?: string;
  status: SubmissionStatus;
  grade?: number;
  maxMarks: number;
  feedback?: string;
  gradedAt?: string;
  gradedByName?: string;
}

// -------------------------------------------------------------
// Online MCQ Quizzes & Model Examinations (ടൈമർ വെച്ചുള്ള പരീക്ഷകൾ)
// -------------------------------------------------------------

export interface MCQOption {
  id: string; // 'A', 'B', 'C', 'D'
  text: string;
  textMl?: string;
}

export interface MCQQuestion {
  id: string;
  questionText: string;
  questionTextMl?: string;
  options: MCQOption[];
  correctOptionId: string;
  explanation: string;
  explanationMl?: string;
  marks: number;
  subjectCategory?: string;
}

export type QuizStatus = 'ACTIVE' | 'UPCOMING' | 'EXPIRED';

export interface MCQQuiz {
  id: string;
  title: string;
  titleMl: string;
  description: string;
  descriptionMl?: string;
  subject: string;
  subjectMl?: string;
  className: string;
  classId: string;
  durationMinutes: number; // e.g. 15, 30, 45, 60
  totalMarks: number;
  passPercentage: number;
  instructions: string[];
  instructionsMl?: string[];
  questions: MCQQuestion[];
  status: QuizStatus;
  totalAttempts: number;
  createdAt: string;
}

export interface QuestionBreakdown {
  questionId: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  marksAwarded: number;
  explanation: string;
  explanationMl?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  quizTitleMl?: string;
  subject: string;
  studentId: string;
  studentName: string;
  classId: string;
  startedAt: string;
  submittedAt: string;
  timeSpentSeconds: number;
  answers: Record<string, string>; // questionId -> selectedOptionId
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  breakdown: QuestionBreakdown[];
}

export interface LMSOverviewStats {
  totalAssignments: number;
  activeAssignments: number;
  pendingSubmissionsCount: number;
  gradedSubmissionsCount: number;
  totalQuizzes: number;
  activeQuizzes: number;
  totalQuizAttempts: number;
  avgQuizScorePercentage: number;
}
