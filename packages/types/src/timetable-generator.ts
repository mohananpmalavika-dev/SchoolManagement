export type RoomType =
  | 'CLASSROOM'
  | 'COMPUTER_LAB'
  | 'PHYSICS_LAB'
  | 'CHEMISTRY_LAB'
  | 'BIOLOGY_LAB'
  | 'AUDIO_VISUAL'
  | 'SPORTS_GROUND';

export type SubjectCategory = 'STEM' | 'LANGUAGE' | 'HUMANITIES' | 'ACTIVITY' | 'LAB';

export type TimingPreference = 'MORNING' | 'AFTERNOON' | 'ANY';

export type CurriculumPreset = 'CBSE_STANDARD' | 'KERALA_STATE_SYLLABUS' | 'ICSE_STEM';

export interface SchoolRoom {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  building?: string;
}

export interface SubjectRule {
  id: string;
  name: string;
  code: string;
  category: SubjectCategory;
  periodsPerWeek: number;
  requiredRoomType: RoomType;
  preferredTiming: TimingPreference;
  maxPerDay: number;
  consecutiveBlock?: boolean; // e.g. 2 continuous periods for lab
}

export interface TeacherConstraint {
  teacherId: string;
  teacherName: string;
  teacherNameMl?: string;
  department: string;
  primarySubject: string;
  qualifiedSubjectCodes: string[];
  maxPeriodsPerDay: number;
  maxPeriodsPerWeek: number;
  maxConsecutivePeriods: number;
}

export interface AutoTimetableConfig {
  daysPerWeek: number; // 5 (Mon-Fri) or 6 (Mon-Sat)
  periodsPerDay: number; // usually 8 periods
  maxTeacherDailyPeriods: number;
  maxConsecutiveTeaching: number;
  prioritizeMorningStem: boolean; // Math, Science in periods 1-4
  allowDoubleLabPeriods: boolean;
  curriculumPreset: CurriculumPreset;
}

export interface AutoTimetableSlot {
  id: string;
  dayOfWeek: number; // 1 = Monday ... 5 = Friday, 6 = Saturday
  dayName: string; // 'Monday', 'Tuesday', ...
  periodNumber: number; // 1 - 8
  periodName: string; // 'Period 1'
  timeSlot: string; // '08:30 AM - 09:15 AM'
  classId: string;
  className: string; // e.g. 'Class 10A'
  subjectId: string;
  subjectName: string; // 'Mathematics'
  subjectCode: string; // 'MATH'
  category: SubjectCategory;
  teacherId: string;
  teacherName: string;
  teacherNameMl?: string;
  roomId: string;
  roomName: string; // 'Room 301' or 'Computer Lab 1'
  isLab: boolean;
  lessonPlanNote?: string;
}

export interface TimetableConflictAuditResult {
  isConflictFree: boolean;
  totalSlotsScheduled: number;
  teacherConflicts: number;
  roomConflicts: number;
  classConflicts: number;
  consecutiveViolations: number;
  teacherWorkloadFairnessScore: number; // 0 - 100%
  morningCoreSubjectRatio: number; // 0 - 100%
  roomUtilizationScore: number; // 0 - 100%
  conflictLog: string[];
}

export interface GeneratedTimetableResult {
  slots: AutoTimetableSlot[];
  audit: TimetableConflictAuditResult;
  generatedAt: string;
  generationDurationMs: number;
  metadata: {
    totalClasses: number;
    totalTeachers: number;
    totalRooms: number;
    preset: CurriculumPreset;
  };
}
