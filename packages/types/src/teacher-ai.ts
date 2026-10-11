export type TeachingLanguage = 'English' | 'Malayalam' | 'Swahili';
export type TeacherAIProvider = 'FreeAI' | 'Gemini' | 'Groq' | 'Pollinations' | 'Ollama' | 'OpenAI' | string;
export interface TeacherAIStatus { configured: boolean; provider: TeacherAIProvider; model: string; message: string }
export interface TeacherAIOptions { classes: { id: string; name: string }[]; terms: { id: string; name: string; isCurrent: boolean }[]; status: TeacherAIStatus }
export interface RemarkStudent {
  id: string; name: string; admissionNumber: string;
  average: number | null; attendanceRate: number | null; attendanceDays: number;
  reportCard: { id: string; status: string; updatedAt: string; comment: string | null } | null;
}
export interface TeacherAIRoster { classId: string; termId: string; students: RemarkStudent[] }
export interface GeneratedRemark { studentId: string; text: string; evidence: string[] }
export interface AIRemarkResult { remarks: GeneratedRemark[]; model: string; generatedAt: string }
export interface AIQuestion { type: 'MCQ' | 'SHORT_ANSWER'; question: string; options: string[]; answer: string; explanation: string; marks: number }
export interface AIQuestionPaper { title: string; instructions: string; questions: AIQuestion[]; warnings: string[]; model: string; generatedAt: string }
export interface AIRiskReview { students: { studentId: string; priority: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_DATA'; reasons: string[]; supportPlan: string[] }[]; model: string; generatedAt: string }
