export type SubstitutionAssignmentStatus =
  | 'PENDING'
  | 'AUTO_ASSIGNED'
  | 'MANUALLY_ASSIGNED'
  | 'NOTIFIED'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DECLINED';

export interface SubstitutionPeriod {
  id: string;
  periodNumber: number;
  periodName: string; // e.g. "Period 3"
  startTime: string;  // e.g. "10:15 AM"
  endTime: string;    // e.g. "11:00 AM"
  timeSlot: string;   // e.g. "10:15 AM - 11:00 AM"
  classId: string;
  className: string;  // e.g. "Class 8B"
  subjectId: string;
  subjectName: string;// e.g. "Mathematics"
  room: string;       // e.g. "Room 204"
  originalTeacherId: string;
  originalTeacherName: string;
  originalTeacherNameMl?: string;
  originalTeacherDepartment: string;
  lessonPlanNote?: string;
}

export interface CandidateScoreBreakdown {
  isFree: boolean;
  subjectScore: number;          // 0-40 pts
  workloadScore: number;         // 0-25 pts (fewer classes today = higher score)
  classFamiliarityScore: number; // 0-25 pts (already teaches this class in other periods)
  departmentScore: number;       // 0-10 pts (same faculty department)
}

export interface TeacherCandidateScore {
  teacherId: string;
  teacherNumber: string;
  teacherName: string;
  teacherNameMl: string;
  department: string;
  phone: string;
  email: string;
  avatarUrl: string;
  isAvailable: boolean;          // true if totally free in this period & present today
  conflictReason?: string;       // e.g. "Already has Class 10A in Period 3"
  currentPeriodsToday: number;
  maxPeriodsPerDay: number;
  weeklySubstitutionCount: number;
  matchScore: number;            // 0 - 100%
  breakdown: CandidateScoreBreakdown;
  reasons: string[];
  reasonsMl: string[];
}

export interface SubstitutionAssignment {
  id: string;
  date: string;                  // YYYY-MM-DD
  periodNumber: number;
  periodName: string;            // "Period 3"
  timeSlot: string;              // "10:15 AM - 11:00 AM"
  classId: string;
  className: string;             // "Class 8B"
  subjectName: string;           // "Mathematics"
  room: string;                  // "Room 204"
  absentTeacherId: string;
  absentTeacherName: string;
  absentTeacherNameMl: string;
  absentReason: string;          // e.g. "Medical Leave / Sick"
  substituteTeacherId: string;
  substituteTeacherName: string;
  substituteTeacherNameMl: string;
  substituteTeacherPhone: string;
  substituteTeacherAvatar: string;
  status: SubstitutionAssignmentStatus;
  matchScore: number;
  assignedAt: string;
  assignedBy: string;
  notificationSentAt?: string;
  notificationChannels?: Array<'PUSH' | 'SMS' | 'WHATSAPP' | 'IN_APP'>;
  acknowledgedAt?: string;
  completedAt?: string;
  lessonPlanHandover?: string;
  classNotes?: string;
}

export interface AbsentTeacherSchedule {
  teacherId: string;
  teacherName: string;
  teacherNameMl: string;
  department: string;
  phone: string;
  avatarUrl: string;
  absenceDate: string;
  absenceReason: string;
  attendanceStatus: 'ABSENT' | 'ON_LEAVE';
  totalPeriodsToCover: number;
  periods: SubstitutionPeriod[];
}

export interface SubstitutionNotificationLog {
  id: string;
  assignmentId: string;
  teacherId: string;
  teacherName: string;
  teacherPhone: string;
  channel: 'PUSH' | 'SMS' | 'WHATSAPP' | 'IN_APP';
  title: string;
  titleMl: string;
  body: string;
  bodyMl: string;
  whatsappPreview: string;
  sentAt: string;
  delivered: boolean;
  status: 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED';
}

export interface SubstitutionDailySummary {
  date: string;
  totalAbsentTeachers: number;
  totalPeriodsToCover: number;
  assignedCount: number;
  pendingCount: number;
  acknowledgedCount: number;
  coveragePercentage: number;
}

export interface AssignProxyRequestDto {
  periodId: string;
  absentTeacherId: string;
  substituteTeacherId: string;
  date: string;
  periodNumber: number;
  className: string;
  subjectName: string;
  room: string;
  lessonPlanHandover?: string;
  notifyImmediately?: boolean;
}

export interface AutoAssignEngineResult {
  date: string;
  totalProcessedPeriods: number;
  newAssignmentsCount: number;
  unassignedPeriodsCount: number;
  assignments: SubstitutionAssignment[];
  notificationsSent: number;
}
