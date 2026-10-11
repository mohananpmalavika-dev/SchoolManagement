import {
  SubstitutionPeriod,
  TeacherCandidateScore,
  SubstitutionAssignment,
  AbsentTeacherSchedule,
  SubstitutionNotificationLog,
  SubstitutionDailySummary,
  AssignProxyRequestDto,
  AutoAssignEngineResult,
  SubstitutionAssignmentStatus,
} from '@krypton/types';

export interface TeacherProfile {
  id: string;
  staffNumber: string;
  name: string;
  nameMl: string;
  department: string;
  primarySubject: string;
  alliedSubjects: string[];
  assignedClasses: string[]; // classes they already teach regularly
  phone: string;
  email: string;
  avatarUrl: string;
  maxPeriodsPerDay: number;
}

export interface TeacherTimetableSlot {
  periodNumber: number;
  periodName: string;
  timeSlot: string;
  classId: string;
  className: string;
  subjectName: string;
  room: string;
  lessonPlanNote?: string;
}

export const PERIOD_SLOTS: Array<{ number: number; name: string; timeSlot: string }> = [
  { number: 1, name: 'Period 1', timeSlot: '08:30 AM - 09:15 AM' },
  { number: 2, name: 'Period 2', timeSlot: '09:15 AM - 10:00 AM' },
  { number: 3, name: 'Period 3', timeSlot: '10:15 AM - 11:00 AM' },
  { number: 4, name: 'Period 4', timeSlot: '11:00 AM - 11:45 AM' },
  { number: 5, name: 'Period 5', timeSlot: '12:30 PM - 01:15 PM' },
  { number: 6, name: 'Period 6', timeSlot: '01:15 PM - 02:00 PM' },
  { number: 7, name: 'Period 7', timeSlot: '02:00 PM - 02:45 PM' },
  { number: 8, name: 'Period 8', timeSlot: '02:45 PM - 03:30 PM' },
];

export const TEACHER_PROFILES: TeacherProfile[] = [
  {
    id: 'stf-001',
    staffNumber: 'STF-2024-001',
    name: 'Dr. Priya Sharma',
    nameMl: 'ഡോ. പ്രിയ ശർമ്മ',
    department: 'Mathematics',
    primarySubject: 'Mathematics',
    alliedSubjects: ['Physics', 'Computer Science', 'Statistics'],
    assignedClasses: ['Class 10A', 'Class 10B', 'Class 9A', 'Class 8B'],
    phone: '+91 98470 12345',
    email: 'priya.sharma@krypton.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    maxPeriodsPerDay: 5,
  },
  {
    id: 'stf-002',
    staffNumber: 'STF-2024-002',
    name: 'Rajesh Varma',
    nameMl: 'രാജേഷ് വർമ്മ',
    department: 'Computer Science',
    primarySubject: 'Computer Science',
    alliedSubjects: ['ICT', 'Mathematics', 'Robotics'],
    assignedClasses: ['Class 10A', 'Class 8B', 'Class 9A', 'Class 7C'],
    phone: '+91 98470 23456',
    email: 'rajesh.varma@krypton.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    maxPeriodsPerDay: 5,
  },
  {
    id: 'stf-003',
    staffNumber: 'STF-2024-003',
    name: 'Sarah Thomas',
    nameMl: 'സാറ തോമസ്',
    department: 'Languages',
    primarySubject: 'English & Literature',
    alliedSubjects: ['Social Studies', 'History'],
    assignedClasses: ['Class 10A', 'Class 8B', 'Class 8A', 'Class 9B'],
    phone: '+91 98470 34567',
    email: 'sarah.thomas@krypton.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80',
    maxPeriodsPerDay: 5,
  },
  {
    id: 'stf-004',
    staffNumber: 'STF-2024-004',
    name: 'Mohammed Faizal',
    nameMl: 'മുഹമ്മദ് ഫൈസൽ',
    department: 'Science',
    primarySubject: 'Physics',
    alliedSubjects: ['General Science', 'Chemistry', 'Mathematics'],
    assignedClasses: ['Class 10B', 'Class 8B', 'Class 9B', 'Class 7B'],
    phone: '+91 98470 45678',
    email: 'm.faizal@krypton.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    maxPeriodsPerDay: 5,
  },
  {
    id: 'stf-005',
    staffNumber: 'STF-2024-005',
    name: 'Anjali Menon',
    nameMl: 'അഞ്ജലി മേനോൻ',
    department: 'Social Science',
    primarySubject: 'Social Studies',
    alliedSubjects: ['History', 'Geography', 'EVS'],
    assignedClasses: ['Class 7A', 'Class 8B', 'Class 6A', 'Class 7C'],
    phone: '+91 98470 56789',
    email: 'anjali.menon@krypton.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    maxPeriodsPerDay: 5,
  },
  {
    id: 'stf-006',
    staffNumber: 'STF-2024-006',
    name: 'Kavitha Nair',
    nameMl: 'കവിത നായർ',
    department: 'Science',
    primarySubject: 'Biology',
    alliedSubjects: ['General Science', 'Chemistry', 'Health Education'],
    assignedClasses: ['Class 10A', 'Class 9A', 'Class 8A', 'Class 7A'],
    phone: '+91 98470 67890',
    email: 'kavitha.nair@krypton.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    maxPeriodsPerDay: 5,
  },
  {
    id: 'stf-007',
    staffNumber: 'STF-2024-007',
    name: 'Arun Kumar',
    nameMl: 'അരുൺ കുമാർ',
    department: 'Science',
    primarySubject: 'Chemistry',
    alliedSubjects: ['Physics', 'General Science', 'Mathematics'],
    assignedClasses: ['Class 10B', 'Class 9A', 'Class 8B', 'Class 7B'],
    phone: '+91 98470 78901',
    email: 'arun.kumar@krypton.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    maxPeriodsPerDay: 5,
  },
  {
    id: 'stf-008',
    staffNumber: 'STF-2024-008',
    name: 'Deepa Chandran',
    nameMl: 'ദീപ ചന്ദ്രൻ',
    department: 'Languages',
    primarySubject: 'Malayalam & Hindi',
    alliedSubjects: ['English', 'Social Studies'],
    assignedClasses: ['Class 8A', 'Class 8B', 'Class 9C', 'Class 7A'],
    phone: '+91 98470 89012',
    email: 'deepa.chandran@krypton.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    maxPeriodsPerDay: 5,
  },
];

// Full regular schedule for each teacher on today's weekday
export const MASTER_TIMETABLE: Record<string, TeacherTimetableSlot[]> = {
  // Dr. Priya Sharma (Mathematics) - Free in Period 3 and Period 6
  'stf-001': [
    { periodNumber: 1, periodName: 'Period 1', timeSlot: '08:30 AM - 09:15 AM', classId: 'cls-10a', className: 'Class 10A', subjectName: 'Mathematics', room: 'Room 301' },
    { periodNumber: 2, periodName: 'Period 2', timeSlot: '09:15 AM - 10:00 AM', classId: 'cls-10b', className: 'Class 10B', subjectName: 'Mathematics', room: 'Room 303' },
    // Period 3 FREE! (10:15 - 11:00)
    { periodNumber: 4, periodName: 'Period 4', timeSlot: '11:00 AM - 11:45 AM', classId: 'cls-9a', className: 'Class 9A', subjectName: 'Mathematics', room: 'Room 202' },
    { periodNumber: 5, periodName: 'Period 5', timeSlot: '12:30 PM - 01:15 PM', classId: 'cls-8a', className: 'Class 8A', subjectName: 'Mathematics', room: 'Room 203' },
    // Period 6 FREE!
    { periodNumber: 7, periodName: 'Period 7', timeSlot: '02:00 PM - 02:45 PM', classId: 'cls-9b', className: 'Class 9B', subjectName: 'Statistics', room: 'Room 205' },
  ],

  // Rajesh Varma (Computer Science) - ABSENT TODAY
  'stf-002': [
    { periodNumber: 1, periodName: 'Period 1', timeSlot: '08:30 AM - 09:15 AM', classId: 'cls-10a', className: 'Class 10A', subjectName: 'Computer Science', room: 'Room 302', lessonPlanNote: 'Finish Section 3.2 on Boolean Logic exercises.' },
    { periodNumber: 3, periodName: 'Period 3', timeSlot: '10:15 AM - 11:00 AM', classId: 'cls-8b', className: 'Class 8B', subjectName: 'Computer Science', room: 'Room 204', lessonPlanNote: 'Introduction to Python Loops: Complete page 62 coding exercises in notebook.' },
    { periodNumber: 5, periodName: 'Period 5', timeSlot: '12:30 PM - 01:15 PM', classId: 'cls-9a', className: 'Class 9A', subjectName: 'ICT & Coding Lab', room: 'Computer Lab 2', lessonPlanNote: 'HTML & CSS Styling Project: Supervise student lab work.' },
    { periodNumber: 7, periodName: 'Period 7', timeSlot: '02:00 PM - 02:45 PM', classId: 'cls-7c', className: 'Class 7C', subjectName: 'Computer Science', room: 'Room 105', lessonPlanNote: 'Scratch animations chapter review quiz.' },
  ],

  // Sarah Thomas (English) - Free in Period 1, 3, 5
  'stf-003': [
    // Period 1 FREE!
    { periodNumber: 2, periodName: 'Period 2', timeSlot: '09:15 AM - 10:00 AM', classId: 'cls-10a', className: 'Class 10A', subjectName: 'English Literature', room: 'Room 301' },
    // Period 3 FREE! (10:15 - 11:00)
    { periodNumber: 4, periodName: 'Period 4', timeSlot: '11:00 AM - 11:45 AM', classId: 'cls-8a', className: 'Class 8A', subjectName: 'English Grammar', room: 'Room 203' },
    // Period 5 FREE!
    { periodNumber: 6, periodName: 'Period 6', timeSlot: '01:15 PM - 02:00 PM', classId: 'cls-9b', className: 'Class 9B', subjectName: 'English Literature', room: 'Room 205' },
    { periodNumber: 8, periodName: 'Period 8', timeSlot: '02:45 PM - 03:30 PM', classId: 'cls-8b', className: 'Class 8B', subjectName: 'Reading Club', room: 'Room 204' },
  ],

  // Mohammed Faizal (Physics) - ABSENT TODAY
  'stf-004': [
    { periodNumber: 2, periodName: 'Period 2', timeSlot: '09:15 AM - 10:00 AM', classId: 'cls-10b', className: 'Class 10B', subjectName: 'Physics', room: 'Room 305', lessonPlanNote: 'Electromagnetism problem solving from Chapter 7.' },
    { periodNumber: 4, periodName: 'Period 4', timeSlot: '11:00 AM - 11:45 AM', classId: 'cls-8b', className: 'Class 8B', subjectName: 'Physics', room: 'Room 204', lessonPlanNote: 'Light & Reflection: Ray diagrams practice.' },
    { periodNumber: 6, periodName: 'Period 6', timeSlot: '01:15 PM - 02:00 PM', classId: 'cls-9b', className: 'Class 9B', subjectName: 'Physics Lab', room: 'Physics Lab', lessonPlanNote: 'Pendulum oscillation measurements.' },
  ],

  // Anjali Menon (Social Studies) - Free in Period 1, 2, 4, 7
  'stf-005': [
    // Period 1 & 2 FREE!
    { periodNumber: 3, periodName: 'Period 3', timeSlot: '10:15 AM - 11:00 AM', classId: 'cls-7a', className: 'Class 7A', subjectName: 'Social Studies', room: 'Room 102' },
    // Period 4 FREE!
    { periodNumber: 5, periodName: 'Period 5', timeSlot: '12:30 PM - 01:15 PM', classId: 'cls-8b', className: 'Class 8B', subjectName: 'Geography', room: 'Room 204' },
    { periodNumber: 6, periodName: 'Period 6', timeSlot: '01:15 PM - 02:00 PM', classId: 'cls-6a', className: 'Class 6A', subjectName: 'Social Studies', room: 'Room 101' },
    // Period 7 & 8 FREE!
  ],

  // Kavitha Nair (Biology) - Free in Period 3, 4, 6
  'stf-006': [
    { periodNumber: 1, periodName: 'Period 1', timeSlot: '08:30 AM - 09:15 AM', classId: 'cls-10a', className: 'Class 10A', subjectName: 'Biology', room: 'Room 301' },
    { periodNumber: 2, periodName: 'Period 2', timeSlot: '09:15 AM - 10:00 AM', classId: 'cls-9a', className: 'Class 9A', subjectName: 'General Science', room: 'Room 202' },
    // Period 3 & 4 FREE!
    { periodNumber: 5, periodName: 'Period 5', timeSlot: '12:30 PM - 01:15 PM', classId: 'cls-8a', className: 'Class 8A', subjectName: 'Biology', room: 'Room 203' },
    // Period 6 FREE!
    { periodNumber: 7, periodName: 'Period 7', timeSlot: '02:00 PM - 02:45 PM', classId: 'cls-7a', className: 'Class 7A', subjectName: 'General Science', room: 'Room 102' },
  ],

  // Arun Kumar (Chemistry) - Free in Period 1, 3, 5, 7
  'stf-007': [
    // Period 1 FREE!
    { periodNumber: 2, periodName: 'Period 2', timeSlot: '09:15 AM - 10:00 AM', classId: 'cls-10b', className: 'Class 10B', subjectName: 'Chemistry', room: 'Room 305' },
    // Period 3 FREE! (10:15 - 11:00)
    { periodNumber: 4, periodName: 'Period 4', timeSlot: '11:00 AM - 11:45 AM', classId: 'cls-9a', className: 'Class 9A', subjectName: 'Chemistry', room: 'Room 202' },
    // Period 5 FREE!
    { periodNumber: 6, periodName: 'Period 6', timeSlot: '01:15 PM - 02:00 PM', classId: 'cls-8b', className: 'Class 8B', subjectName: 'General Science', room: 'Room 204' },
    // Period 7 FREE!
  ],

  // Deepa Chandran (Malayalam & Hindi) - Free in Period 1, 2, 5, 8
  'stf-008': [
    // Period 1 & 2 FREE!
    { periodNumber: 3, periodName: 'Period 3', timeSlot: '10:15 AM - 11:00 AM', classId: 'cls-8a', className: 'Class 8A', subjectName: 'Malayalam', room: 'Room 203' },
    { periodNumber: 4, periodName: 'Period 4', timeSlot: '11:00 AM - 11:45 AM', classId: 'cls-8b', className: 'Class 8B', subjectName: 'Hindi', room: 'Room 204' },
    // Period 5 FREE!
    { periodNumber: 6, periodName: 'Period 6', timeSlot: '01:15 PM - 02:00 PM', classId: 'cls-9c', className: 'Class 9C', subjectName: 'Malayalam', room: 'Room 206' },
    { periodNumber: 7, periodName: 'Period 7', timeSlot: '02:00 PM - 02:45 PM', classId: 'cls-7a', className: 'Class 7A', subjectName: 'Hindi', room: 'Room 102' },
  ],
};

// Initial state of absent teachers today
export const INITIAL_ABSENT_TEACHERS: AbsentTeacherSchedule[] = [
  {
    teacherId: 'stf-002',
    teacherName: 'Rajesh Varma',
    teacherNameMl: 'രാജേഷ് വർമ്മ',
    department: 'Computer Science',
    phone: '+91 98470 23456',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    absenceDate: new Date().toISOString().split('T')[0],
    absenceReason: 'Viral Fever & Medical Rest (1 Day Sick Leave)',
    attendanceStatus: 'ON_LEAVE',
    totalPeriodsToCover: 4,
    periods: MASTER_TIMETABLE['stf-002'].map((p) => ({
      id: `per-stf-002-${p.periodNumber}`,
      periodNumber: p.periodNumber,
      periodName: p.periodName,
      startTime: p.timeSlot.split(' - ')[0],
      endTime: p.timeSlot.split(' - ')[1],
      timeSlot: p.timeSlot,
      classId: p.classId,
      className: p.className,
      subjectId: 'sub-cs',
      subjectName: p.subjectName,
      room: p.room,
      originalTeacherId: 'stf-002',
      originalTeacherName: 'Rajesh Varma',
      originalTeacherNameMl: 'രാജേഷ് വർമ്മ',
      originalTeacherDepartment: 'Computer Science',
      lessonPlanNote: p.lessonPlanNote,
    })),
  },
  {
    teacherId: 'stf-004',
    teacherName: 'Mohammed Faizal',
    teacherNameMl: 'മുഹമ്മദ് ഫൈസൽ',
    department: 'Science (Physics)',
    phone: '+91 98470 45678',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    absenceDate: new Date().toISOString().split('T')[0],
    absenceReason: 'Urgent Family Emergency (Out of station)',
    attendanceStatus: 'ABSENT',
    totalPeriodsToCover: 3,
    periods: MASTER_TIMETABLE['stf-004'].map((p) => ({
      id: `per-stf-004-${p.periodNumber}`,
      periodNumber: p.periodNumber,
      periodName: p.periodName,
      startTime: p.timeSlot.split(' - ')[0],
      endTime: p.timeSlot.split(' - ')[1],
      timeSlot: p.timeSlot,
      classId: p.classId,
      className: p.className,
      subjectId: 'sub-phy',
      subjectName: p.subjectName,
      room: p.room,
      originalTeacherId: 'stf-004',
      originalTeacherName: 'Mohammed Faizal',
      originalTeacherNameMl: 'മുഹമ്മദ് ഫൈസൽ',
      originalTeacherDepartment: 'Science',
      lessonPlanNote: p.lessonPlanNote,
    })),
  },
];

class SmartSubstitutionService {
  private absentTeachers: AbsentTeacherSchedule[] = [];
  private assignments: SubstitutionAssignment[] = [];
  private notificationLogs: SubstitutionNotificationLog[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadState();
  }

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private loadState() {
    if (!this.isClient()) {
      this.absentTeachers = [...INITIAL_ABSENT_TEACHERS];
      return;
    }

    try {
      const storedAbsent = localStorage.getItem('krypton_proxy_absent_teachers');
      if (storedAbsent) {
        this.absentTeachers = JSON.parse(storedAbsent);
      } else {
        this.absentTeachers = [...INITIAL_ABSENT_TEACHERS];
        this.saveAbsentTeachers();
      }

      const storedAssignments = localStorage.getItem('krypton_proxy_assignments');
      if (storedAssignments) {
        this.assignments = JSON.parse(storedAssignments);
      } else {
        // Seed 1 active sample assignment so user can see it right away
        const todayStr = new Date().toISOString().split('T')[0];
        const sampleAssignment: SubstitutionAssignment = {
          id: 'sub-init-01',
          date: todayStr,
          periodNumber: 1,
          periodName: 'Period 1',
          timeSlot: '08:30 AM - 09:15 AM',
          classId: 'cls-10a',
          className: 'Class 10A',
          subjectName: 'Computer Science',
          room: 'Room 302',
          absentTeacherId: 'stf-002',
          absentTeacherName: 'Rajesh Varma',
          absentTeacherNameMl: 'രാജേഷ് വർമ്മ',
          absentReason: 'Viral Fever & Medical Rest',
          substituteTeacherId: 'stf-007',
          substituteTeacherName: 'Arun Kumar',
          substituteTeacherNameMl: 'അരുൺ കുമാർ',
          substituteTeacherPhone: '+91 98470 78901',
          substituteTeacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          status: 'NOTIFIED',
          matchScore: 92,
          assignedAt: '08:05 AM',
          assignedBy: 'AI Smart Engine (Auto)',
          notificationSentAt: '08:06 AM',
          notificationChannels: ['PUSH', 'WHATSAPP'],
          lessonPlanHandover: 'Finish Section 3.2 on Boolean Logic exercises in textbook.',
        };
        this.assignments = [sampleAssignment];
        this.saveAssignments();

        this.notificationLogs = [
          {
            id: 'notif-01',
            assignmentId: 'sub-init-01',
            teacherId: 'stf-007',
            teacherName: 'Arun Kumar',
            teacherPhone: '+91 98470 78901',
            channel: 'WHATSAPP',
            title: 'Substitution Assigned: Class 10A - Period 1',
            titleMl: 'പ്രോക്സി അസൈൻ ചെയ്തു: ക്ലാസ്സ് 10A - പീരീഡ് 1',
            body: 'You have substitution in Class 10A - Period 1 (08:30 AM - 09:15 AM) replacing Rajesh Varma.',
            bodyMl: 'ക്ലാസ്സ് 10A - പീരീഡ് 1-ൽ നിങ്ങൾക്ക് സബ്സ്റ്റിറ്റ്യൂഷൻ അസൈൻ ചെയ്തിട്ടുണ്ട് (പകരം: രാജേഷ് വർമ്മ).',
            whatsappPreview: '📢 *KRYPTON PROXY ALERT*\nDear Arun Kumar, you have substitution in Class 10A - Period 1 (08:30 AM) replacing Rajesh Varma. Room: 302.',
            sentAt: '08:06 AM',
            delivered: true,
            status: 'SENT',
          },
        ];
        this.saveNotifications();
      }

      const storedNotifs = localStorage.getItem('krypton_proxy_notifications');
      if (storedNotifs) {
        this.notificationLogs = JSON.parse(storedNotifs);
      }
    } catch (e) {
      console.error('Error loading proxy engine state:', e);
    }
  }

  private saveAbsentTeachers() {
    if (this.isClient()) {
      localStorage.setItem('krypton_proxy_absent_teachers', JSON.stringify(this.absentTeachers));
    }
    this.notifyListeners();
  }

  private saveAssignments() {
    if (this.isClient()) {
      localStorage.setItem('krypton_proxy_assignments', JSON.stringify(this.assignments));
    }
    this.notifyListeners();
  }

  private saveNotifications() {
    if (this.isClient()) {
      localStorage.setItem('krypton_proxy_notifications', JSON.stringify(this.notificationLogs));
    }
    this.notifyListeners();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  // ==================== QUERY METHODS ====================

  public getAbsentTeachers(date?: string): AbsentTeacherSchedule[] {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.absentTeachers.filter((t) => !t.absenceDate || t.absenceDate === targetDate);
  }

  public getAllTeachers(): TeacherProfile[] {
    return TEACHER_PROFILES;
  }

  public getTeacherProfile(id: string): TeacherProfile | undefined {
    return TEACHER_PROFILES.find((t) => t.id === id);
  }

  public getTeacherRegularSchedule(teacherId: string): TeacherTimetableSlot[] {
    return MASTER_TIMETABLE[teacherId] || [];
  }

  public getAssignments(date?: string, teacherId?: string): SubstitutionAssignment[] {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.assignments.filter((a) => {
      const matchDate = !a.date || a.date === targetDate;
      const matchTeacher = !teacherId || a.substituteTeacherId === teacherId;
      return matchDate && matchTeacher;
    });
  }

  public getVacantPeriods(date?: string): SubstitutionPeriod[] {
    const absent = this.getAbsentTeachers(date);
    const existingAssignments = this.getAssignments(date);
    const assignedPeriodKeys = new Set(
      existingAssignments.map((a) => `${a.absentTeacherId}-${a.periodNumber}`)
    );

    const vacant: SubstitutionPeriod[] = [];
    absent.forEach((teacher) => {
      teacher.periods.forEach((period) => {
        const key = `${teacher.teacherId}-${period.periodNumber}`;
        if (!assignedPeriodKeys.has(key)) {
          vacant.push(period);
        }
      });
    });

    return vacant.sort((a, b) => a.periodNumber - b.periodNumber);
  }

  public getDailySummary(date?: string): SubstitutionDailySummary {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const absent = this.getAbsentTeachers(targetDate);
    const totalPeriodsToCover = absent.reduce((acc, t) => acc + t.periods.length, 0);
    const dayAssignments = this.getAssignments(targetDate);
    const assignedCount = dayAssignments.length;
    const acknowledgedCount = dayAssignments.filter((a) => a.status === 'ACKNOWLEDGED' || a.status === 'COMPLETED').length;
    const pendingCount = Math.max(0, totalPeriodsToCover - assignedCount);
    const coveragePercentage = totalPeriodsToCover === 0 ? 100 : Math.round((assignedCount / totalPeriodsToCover) * 100);

    return {
      date: targetDate,
      totalAbsentTeachers: absent.length,
      totalPeriodsToCover,
      assignedCount,
      pendingCount,
      acknowledgedCount,
      coveragePercentage,
    };
  }

  public getNotificationLogs(teacherId?: string): SubstitutionNotificationLog[] {
    if (teacherId) {
      return this.notificationLogs.filter((n) => n.teacherId === teacherId);
    }
    return this.notificationLogs;
  }

  // ==================== SMART MATCHING & SCORING ALGORITHM ====================

  /**
   * Core Smart Engine: Evaluates all teachers for a given vacant period and scores them.
   * Considers:
   * 1. 100% Hard Constraint: Teacher must be FREE in this period (no scheduled class & no other proxy assignment), and must NOT be absent.
   * 2. Subject Expertise (40%): Same subject or allied subject.
   * 3. Workload Balancing (25%): Teachers with fewer periods today scored higher to prevent burnout.
   * 4. Class Familiarity (25%): Teacher already teaches this specific class (e.g. 8B) in another period.
   * 5. Department Affinity (10%): Same academic department.
   */
  public getRecommendedCandidates(period: SubstitutionPeriod, date?: string): TeacherCandidateScore[] {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const absentTeacherIds = new Set(this.getAbsentTeachers(targetDate).map((t) => t.teacherId));
    const activeAssignments = this.getAssignments(targetDate);

    // Map teacher -> Set of periods they are already assigned proxy
    const teacherProxyPeriods = new Map<string, Set<number>>();
    // Map teacher -> total proxies assigned today
    const teacherProxyCount = new Map<string, number>();

    activeAssignments.forEach((a) => {
      if (!teacherProxyPeriods.has(a.substituteTeacherId)) {
        teacherProxyPeriods.set(a.substituteTeacherId, new Set<number>());
      }
      teacherProxyPeriods.get(a.substituteTeacherId)!.add(a.periodNumber);
      teacherProxyCount.set(a.substituteTeacherId, (teacherProxyCount.get(a.substituteTeacherId) || 0) + 1);
    });

    const candidates: TeacherCandidateScore[] = [];

    for (const teacher of TEACHER_PROFILES) {
      // Rule 0: Cannot assign the absent teacher themselves or any other absent teacher
      if (absentTeacherIds.has(teacher.id)) {
        continue;
      }

      // Check regular schedule for conflicts
      const schedule = this.getTeacherRegularSchedule(teacher.id);
      const regularClassInPeriod = schedule.find((s) => s.periodNumber === period.periodNumber);
      const hasProxyInPeriod = teacherProxyPeriods.get(teacher.id)?.has(period.periodNumber) ?? false;

      let isAvailable = true;
      let conflictReason: string | undefined;

      if (regularClassInPeriod) {
        isAvailable = false;
        conflictReason = `Busy: Teaching ${regularClassInPeriod.className} (${regularClassInPeriod.subjectName})`;
      } else if (hasProxyInPeriod) {
        isAvailable = false;
        conflictReason = `Busy: Already assigned substitution in Period ${period.periodNumber}`;
      }

      // Workload calculation
      const regularPeriodsToday = schedule.length;
      const proxyPeriodsToday = teacherProxyCount.get(teacher.id) || 0;
      const totalPeriodsToday = regularPeriodsToday + proxyPeriodsToday;

      // Score computation
      let subjectScore = 0;
      let classFamiliarityScore = 0;
      let workloadScore = 0;
      let departmentScore = 0;
      const reasons: string[] = [];
      const reasonsMl: string[] = [];

      if (isAvailable) {
        // 1. Subject Match (0 to 40)
        const isExactSubject =
          teacher.primarySubject.toLowerCase().includes(period.subjectName.toLowerCase()) ||
          period.subjectName.toLowerCase().includes(teacher.primarySubject.toLowerCase());

        const isAlliedSubject = teacher.alliedSubjects.some(
          (s) =>
            s.toLowerCase().includes(period.subjectName.toLowerCase()) ||
            period.subjectName.toLowerCase().includes(s.toLowerCase())
        );

        if (isExactSubject) {
          subjectScore = 40;
          reasons.push(`🎯 Exact subject specialist (${teacher.primarySubject})`);
          reasonsMl.push(`🎯 അതേ വിഷയത്തിലെ വിദഗ്ദ്ധൻ (${teacher.primarySubject})`);
        } else if (isAlliedSubject) {
          subjectScore = 26;
          reasons.push(`🔬 Allied subject expertise (${teacher.primarySubject} & allied)`);
          reasonsMl.push(`🔬 അനുബന്ധ വിഷയ വൈദഗ്ദ്ധ്യം (${teacher.primarySubject})`);
        } else {
          subjectScore = 12;
          reasons.push('General faculty substitution');
          reasonsMl.push('ജനറൽ ഫാക്കൽറ്റി സബ്സ്റ്റിറ്റ്യൂഷൻ');
        }

        // 2. Class Familiarity (0 to 25)
        const teachesThisClass = teacher.assignedClasses.includes(period.className);
        const gradeLevel = period.className.split(' ')[1]?.replace(/[A-Z]/, '') || '';
        const teachesSameGrade = teacher.assignedClasses.some((c) => c.includes(gradeLevel));

        if (teachesThisClass) {
          classFamiliarityScore = 25;
          reasons.push(`👨‍🏫 Regularly teaches ${period.className} (high rapport)`);
          reasonsMl.push(`👨‍🏫 ${period.className}-ൽ സ്ഥിരമായി ക്ലാസെടുക്കുന്ന ടീച്ചർ (കുട്ടികൾക്ക് പരിചിതം)`);
        } else if (teachesSameGrade) {
          classFamiliarityScore = 16;
          reasons.push(`Grade ${gradeLevel} curriculum familiarity`);
          reasonsMl.push(`ഗ്രേഡ് ${gradeLevel} കരിക്കുലം പരിചയം`);
        } else {
          classFamiliarityScore = 8;
        }

        // 3. Workload Balancing (0 to 25)
        if (totalPeriodsToday <= 2) {
          workloadScore = 25;
          reasons.push(`⚖️ Very light workload today (only ${totalPeriodsToday} classes)`);
          reasonsMl.push(`⚖️ ഇന്ന് കുറഞ്ഞ ജോലിഭാരം (${totalPeriodsToday} ക്ലാസുകൾ മാത്രം)`);
        } else if (totalPeriodsToday === 3) {
          workloadScore = 20;
          reasons.push(`⚖️ Balanced workload (${totalPeriodsToday} classes)`);
          reasonsMl.push(`⚖️ ബാലൻസ്ഡ് വർക്ക്‌ലോഡ് (${totalPeriodsToday} ക്ലാസുകൾ)`);
        } else if (totalPeriodsToday === 4) {
          workloadScore = 12;
          reasons.push(`Workload: 4 classes today`);
          reasonsMl.push(`ഇന്ന് 4 ക്ലാസുകൾ ഉണ്ട്`);
        } else {
          workloadScore = 4;
          reasons.push(`High workload (${totalPeriodsToday} classes today)`);
          reasonsMl.push(`കൂടിയ വർക്ക്‌ലോഡ് (${totalPeriodsToday} ക്ലാസുകൾ)`);
        }

        // 4. Department Score (0 to 10)
        if (teacher.department.toLowerCase().includes(period.originalTeacherDepartment.toLowerCase())) {
          departmentScore = 10;
          reasons.push(`🏛️ Same department (${teacher.department})`);
          reasonsMl.push(`🏛️ അതേ ഡിപ്പാർട്ട്മെന്റ് (${teacher.department})`);
        } else {
          departmentScore = 3;
        }
      } else {
        reasons.push(`❌ ${conflictReason}`);
        reasonsMl.push(`❌ ലഭ്യമല്ല: ${conflictReason}`);
      }

      const matchScore = isAvailable ? Math.min(100, Math.round(subjectScore + classFamiliarityScore + workloadScore + departmentScore)) : 0;

      candidates.push({
        teacherId: teacher.id,
        teacherNumber: teacher.staffNumber,
        teacherName: teacher.name,
        teacherNameMl: teacher.nameMl,
        department: teacher.department,
        phone: teacher.phone,
        email: teacher.email,
        avatarUrl: teacher.avatarUrl,
        isAvailable,
        conflictReason,
        currentPeriodsToday: totalPeriodsToday,
        maxPeriodsPerDay: teacher.maxPeriodsPerDay,
        weeklySubstitutionCount: proxyPeriodsToday + 1,
        matchScore,
        breakdown: {
          isFree: isAvailable,
          subjectScore,
          workloadScore,
          classFamiliarityScore,
          departmentScore,
        },
        reasons,
        reasonsMl,
      });
    }

    // Sort available candidates by matchScore DESC, then unavailable at the bottom
    return candidates.sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return b.matchScore - a.matchScore;
    });
  }

  // ==================== ACTIONS ====================

  /**
   * Assign a proxy teacher to a vacant period & trigger instant notification
   */
  public assignProxy(dto: AssignProxyRequestDto): SubstitutionAssignment {
    const subTeacher = this.getTeacherProfile(dto.substituteTeacherId);
    if (!subTeacher) {
      throw new Error(`Teacher with id ${dto.substituteTeacherId} not found`);
    }

    const absentSchedule = this.absentTeachers.find((t) => t.teacherId === dto.absentTeacherId);
    const absentTeacherName = absentSchedule ? absentSchedule.teacherName : 'Absent Faculty';
    const absentTeacherNameMl = absentSchedule ? absentSchedule.teacherNameMl : 'അധ്യാപകൻ';
    const absentReason = absentSchedule ? absentSchedule.absenceReason : 'Leave';

    // Format current time
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Look up slot time
    const slot = PERIOD_SLOTS.find((s) => s.number === dto.periodNumber);
    const timeSlot = slot ? slot.timeSlot : `Period ${dto.periodNumber}`;

    // Remove any previous assignment for this specific teacher & period if present
    this.assignments = this.assignments.filter(
      (a) => !(a.absentTeacherId === dto.absentTeacherId && a.periodNumber === dto.periodNumber && a.date === dto.date)
    );

    const newAssignment: SubstitutionAssignment = {
      id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      date: dto.date,
      periodNumber: dto.periodNumber,
      periodName: `Period ${dto.periodNumber}`,
      timeSlot,
      classId: `cls-${dto.className.toLowerCase().replace(/\s+/g, '-')}`,
      className: dto.className,
      subjectName: dto.subjectName,
      room: dto.room,
      absentTeacherId: dto.absentTeacherId,
      absentTeacherName,
      absentTeacherNameMl,
      absentReason,
      substituteTeacherId: subTeacher.id,
      substituteTeacherName: subTeacher.name,
      substituteTeacherNameMl: subTeacher.nameMl,
      substituteTeacherPhone: subTeacher.phone,
      substituteTeacherAvatar: subTeacher.avatarUrl,
      status: 'NOTIFIED',
      matchScore: 94,
      assignedAt: timeString,
      assignedBy: 'Academic Coordinator',
      notificationSentAt: timeString,
      notificationChannels: ['PUSH', 'SMS', 'WHATSAPP'],
      lessonPlanHandover: dto.lessonPlanHandover || `Regular syllabus progression for ${dto.subjectName}.`,
    };

    this.assignments.unshift(newAssignment);
    this.saveAssignments();

    // Trigger instant notification
    this.dispatchInstantNotification(newAssignment);

    return newAssignment;
  }

  /**
   * One-Click Engine: Automatically assigns optimal proxies for ALL vacant periods today!
   */
  public autoAssignAllProxies(date?: string): AutoAssignEngineResult {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const vacantPeriods = this.getVacantPeriods(targetDate);
    const newAssignments: SubstitutionAssignment[] = [];
    let notificationsSent = 0;

    for (const period of vacantPeriods) {
      // Re-run recommendation engine (which accounts for newly assigned teachers dynamically)
      const recommendations = this.getRecommendedCandidates(period, targetDate);
      const bestCandidate = recommendations.find((c) => c.isAvailable);

      if (bestCandidate) {
        const assignment = this.assignProxy({
          periodId: period.id,
          absentTeacherId: period.originalTeacherId,
          substituteTeacherId: bestCandidate.teacherId,
          date: targetDate,
          periodNumber: period.periodNumber,
          className: period.className,
          subjectName: period.subjectName,
          room: period.room,
          lessonPlanHandover: period.lessonPlanNote,
          notifyImmediately: true,
        });

        assignment.matchScore = bestCandidate.matchScore;
        assignment.assignedBy = 'Smart Proxy Engine (Auto-Match)';
        newAssignments.push(assignment);
        notificationsSent++;
      }
    }

    this.saveAssignments();

    return {
      date: targetDate,
      totalProcessedPeriods: vacantPeriods.length,
      newAssignmentsCount: newAssignments.length,
      unassignedPeriodsCount: vacantPeriods.length - newAssignments.length,
      assignments: newAssignments,
      notificationsSent,
    };
  }

  /**
   * Dispatch Instant Push & WhatsApp notification to substitute teacher
   */
  public dispatchInstantNotification(assignment: SubstitutionAssignment) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const pushTitle = `🔔 Substitution Assigned: ${assignment.className} - ${assignment.periodName}`;
    const pushTitleMl = `🔔 പ്രോക്സി ഡ്യൂട്ടി: ${assignment.className} - ${assignment.periodName}`;

    // Exact user requirement format:
    // "You have substitution in Class 8B - Period 3"
    const pushBody = `You have substitution in ${assignment.className} - ${assignment.periodName} (${assignment.timeSlot}) replacing ${assignment.absentTeacherName} (${assignment.subjectName}). Room: ${assignment.room}`;
    const pushBodyMl = `${assignment.className} - ${assignment.periodName}-ൽ (${assignment.timeSlot}) നിങ്ങൾക്ക് സബ്സ്റ്റിറ്റ്യൂഷൻ അസൈൻ ചെയ്തിട്ടുണ്ട്. പകരം: ${assignment.absentTeacherNameMl} (${assignment.subjectName}). റൂം: ${assignment.room}`;

    const whatsappPreview =
      `📢 *KRYPTON SCHOOL PROXY DUTY*\n\n` +
      `നമസ്കാരം ${assignment.substituteTeacherName},\n\n` +
      `ഇന്നത്തെ ടൈംടേബിൾ പ്രകാരം നിങ്ങൾക്ക് സബ്സ്റ്റിറ്റ്യൂഷൻ അസൈൻ ചെയ്തിട്ടുണ്ട്:\n` +
      `🏫 *ക്ലാസ്സ്*: ${assignment.className}\n` +
      `⏰ *പീരീഡ്*: ${assignment.periodName} (${assignment.timeSlot})\n` +
      `📚 *വിഷയം*: ${assignment.subjectName}\n` +
      `🚪 *റൂം*: ${assignment.room}\n` +
      `👤 *പകരം*: ${assignment.absentTeacherName} (${assignment.absentReason})\n\n` +
      `📝 *നിർദ്ദേശം*: ${assignment.lessonPlanHandover || 'സിലബസ് തുടരുക.'}\n\n` +
      `ദയവായി താഴെ ക്ലിക്ക് ചെയ്ത് Acknowledge ചെയ്യുക:\n` +
      `👉 https://krypton.edu/teacher/substitution?id=${assignment.id}`;

    const log: SubstitutionNotificationLog = {
      id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      assignmentId: assignment.id,
      teacherId: assignment.substituteTeacherId,
      teacherName: assignment.substituteTeacherName,
      teacherPhone: assignment.substituteTeacherPhone,
      channel: 'WHATSAPP',
      title: pushTitle,
      titleMl: pushTitleMl,
      body: pushBody,
      bodyMl: pushBodyMl,
      whatsappPreview,
      sentAt: timeString,
      delivered: true,
      status: 'SENT',
    };

    this.notificationLogs.unshift(log);
    this.saveNotifications();
  }

  /**
   * Teacher acknowledges substitution assignment from their phone / portal
   */
  public acknowledgeAssignment(assignmentId: string, notes?: string): SubstitutionAssignment {
    const index = this.assignments.findIndex((a) => a.id === assignmentId);
    if (index === -1) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.assignments[index] = {
      ...this.assignments[index],
      status: 'ACKNOWLEDGED',
      acknowledgedAt: timeString,
      classNotes: notes || this.assignments[index].classNotes,
    };

    this.saveAssignments();
    return this.assignments[index];
  }

  /**
   * Mark substitution completed after class period finishes
   */
  public completeAssignment(assignmentId: string, remarks?: string): SubstitutionAssignment {
    const index = this.assignments.findIndex((a) => a.id === assignmentId);
    if (index === -1) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.assignments[index] = {
      ...this.assignments[index],
      status: 'COMPLETED',
      completedAt: timeString,
      classNotes: remarks || 'Class conducted successfully as per lesson plan.',
    };

    this.saveAssignments();
    return this.assignments[index];
  }

  /**
   * Report a teacher absent / on leave for today
   */
  public reportTeacherAbsence(teacherId: string, reason: string, date?: string): AbsentTeacherSchedule {
    const teacher = this.getTeacherProfile(teacherId);
    if (!teacher) {
      throw new Error(`Teacher with id ${teacherId} not found`);
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Check if already reported
    const existing = this.absentTeachers.find((t) => t.teacherId === teacherId && t.absenceDate === targetDate);
    if (existing) {
      existing.absenceReason = reason;
      this.saveAbsentTeachers();
      return existing;
    }

    const schedule = this.getTeacherRegularSchedule(teacherId);
    const periods: SubstitutionPeriod[] = schedule.map((p) => ({
      id: `per-${teacherId}-${p.periodNumber}`,
      periodNumber: p.periodNumber,
      periodName: p.periodName,
      startTime: p.timeSlot.split(' - ')[0],
      endTime: p.timeSlot.split(' - ')[1],
      timeSlot: p.timeSlot,
      classId: p.classId,
      className: p.className,
      subjectId: `sub-${teacher.primarySubject.toLowerCase()}`,
      subjectName: p.subjectName,
      room: p.room,
      originalTeacherId: teacher.id,
      originalTeacherName: teacher.name,
      originalTeacherNameMl: teacher.nameMl,
      originalTeacherDepartment: teacher.department,
      lessonPlanNote: p.lessonPlanNote || `Chapter review & exercises for ${p.subjectName}.`,
    }));

    const newAbsent: AbsentTeacherSchedule = {
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherNameMl: teacher.nameMl,
      department: teacher.department,
      phone: teacher.phone,
      avatarUrl: teacher.avatarUrl,
      absenceDate: targetDate,
      absenceReason: reason,
      attendanceStatus: 'ON_LEAVE',
      totalPeriodsToCover: periods.length,
      periods,
    };

    this.absentTeachers.push(newAbsent);
    this.saveAbsentTeachers();
    return newAbsent;
  }

  /**
   * Cancel absence / Mark teacher back present
   */
  public cancelTeacherAbsence(teacherId: string, date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    this.absentTeachers = this.absentTeachers.filter(
      (t) => !(t.teacherId === teacherId && (!t.absenceDate || t.absenceDate === targetDate))
    );
    this.assignments = this.assignments.filter(
      (a) => !(a.absentTeacherId === teacherId && (!a.date || a.date === targetDate))
    );
    this.saveAbsentTeachers();
    this.saveAssignments();
  }
}

export const smartSubstitutionApi = new SmartSubstitutionService();
