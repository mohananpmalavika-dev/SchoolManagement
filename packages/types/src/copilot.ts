import { TeachingLanguage } from './teacher-ai';

export type RemarksTone = 'CBC' | 'HOLISTIC' | 'ACADEMIC_RIGOR' | 'GROWTH_MINDSET';

export interface ERPCopilotQueryRequest {
  query: string;
  language?: TeachingLanguage;
}

export interface ERPCopilotFilterBadge {
  label: string;
  value: string;
  badgeType: 'class' | 'attendance' | 'fee' | 'grades' | 'risk';
}

export interface ERPCopilotStudentMatch {
  studentId: string;
  name: string;
  admissionNumber: string;
  className: string;
  classId: string;
  attendanceRate: number | null;
  attendanceDays: number;
  latestAverage: number | null;
  outstandingBalance: number;
  overdueBalance: number;
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW' | 'NORMAL';
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  reasons: string[];
}

export interface ERPCopilotQueryResponse {
  originalQuery: string;
  interpretedIntent: string;
  parsedFilters: ERPCopilotFilterBadge[];
  matches: ERPCopilotStudentMatch[];
  totalCount: number;
  currency: string;
  summary: {
    totalOutstanding: number;
    averageAttendance: number;
    averageScore: number;
    highRiskCount: number;
  };
  suggestedActions: string[];
  naturalLanguageSummary: string;
  generatedAt: string;
}

export interface LessonPlanRequest {
  classId: string;
  subject: string;
  chapter: string;
  durationMinutes: number;
  curriculum: 'CBC' | 'STANDARD' | 'CAMBRIDGE' | 'NCERT';
  language?: TeachingLanguage;
  additionalNotes?: string;
}

export interface LessonPlanStep {
  phase: 'ENGAGE' | 'EXPLORE' | 'EXPLAIN' | 'ELABORATE' | 'EVALUATE';
  title: string;
  durationMinutes: number;
  teacherActivity: string;
  studentActivity: string;
  resourcesNeeded: string[];
}

export interface LessonPlanRubricLevel {
  level: 'EXCEEDING' | 'MEETING' | 'APPROACHING' | 'BELOW';
  descriptor: string;
  scoreRange: string;
}

export interface LessonPlanRubricCriterion {
  criterion: string;
  levels: LessonPlanRubricLevel[];
}

export interface LessonPlanResponse {
  title: string;
  gradeLevel: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  curriculum: string;
  learningObjectives: string[];
  coreCompetencies: string[];
  keyInquiryQuestions: string[];
  materials: string[];
  steps: LessonPlanStep[];
  differentiatedInstruction: {
    supportForStruggling: string[];
    extensionForAdvanced: string[];
  };
  assessmentRubrics: LessonPlanRubricCriterion[];
  homeworkAssignment: string;
  model: string;
  generatedAt: string;
}

export interface RemarksBatchRequest {
  classId: string;
  termId: string;
  language: TeachingLanguage;
  tone: RemarksTone;
  students: {
    studentId: string;
    behaviourObservation?: string;
  }[];
}
