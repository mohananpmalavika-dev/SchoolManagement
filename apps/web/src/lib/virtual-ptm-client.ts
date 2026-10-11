import {
  PTMSlot,
  PTMStatus,
  PTMCreateSlotRequest,
  PTMBookSlotRequest,
  PTMScheduleFilter,
  PTMChatMessage,
} from '@krypton/types';

// Default initial mock PTM slots covering various scenarios
export const INITIAL_PTM_SLOTS: PTMSlot[] = [
  {
    id: 'ptm-slot-101',
    meetingCode: 'ptm-724-krm',
    meetingPin: '482910',
    title: 'Term 3 CBC Performance & Mathematics Progress Review',
    description: 'Quarterly parent-teacher assessment discussion on algebraic thinking, homework consistency, and term exam goals.',
    grade: 'Grade 7A',
    teacherId: 'tch-001',
    teacherName: 'Mr. Joseph Kiprop',
    teacherSubject: 'Mathematics & Science',
    teacherEmail: 'joseph.kiprop@kryptonschool.ac.ke',
    teacherPhone: '+254 712 345 678',
    parentId: 'par-501',
    parentName: 'Mrs. Grace Wanjiku',
    parentPhone: '+254 722 998 877',
    parentEmail: 'grace.wanjiku@gmail.com',
    studentId: 'std-1001',
    studentName: 'Alan Kiprop Wanjiku',
    studentGrade: 'Grade 7A',
    admissionNumber: 'ADM-2024-0089',
    date: '2026-10-15',
    startTime: '09:00',
    endTime: '09:15',
    durationMinutes: 15,
    status: 'BOOKED',
    waitingRoom: true,
    meetingUrl: '/ptm/room/ptm-724-krm',
    parentNotes: 'Requesting advice on additional geometry worksheets and preparation for end-of-year CBC national assessment.',
    teacherNotes: 'Strong analytical skills. Needs to submit weekly workbook assignments on time.',
    actionItems: [
      'Assign 15 minutes daily revision on algebraic linear equations',
      'Provide parent access to digital textbook exercises on portal',
      'Follow-up check in 3 weeks before mid-term assessments'
    ],
    academicSnapshot: {
      averageGrade: 84.5,
      attendanceRate: 96.8,
      conduct: 'Excellent - Highly Focused',
      topSubject: 'Integrated Science (91%)',
      needsImprovement: 'Mathematics - Algebra (76%)',
      termExamRank: '5th out of 42',
      homeworkCompletionRate: 88,
      cbcCoreCompetencies: {
        communication: 'EXCEEDING',
        criticalThinking: 'EXCEEDING',
        collaboration: 'MEETING',
        digitalLiteracy: 'EXCEEDING',
      },
    },
    recordingAvailable: false,
    bookedAt: '2026-10-10T14:20:00Z',
  },
  {
    id: 'ptm-slot-102',
    meetingCode: 'ptm-831-qzt',
    meetingPin: '319502',
    title: 'English Language & Creative Writing Assessment',
    description: 'Review of term reading log, essay writing, and oral presentation competencies.',
    grade: 'Grade 7A',
    teacherId: 'tch-001',
    teacherName: 'Mr. Joseph Kiprop',
    teacherSubject: 'Mathematics & Science',
    teacherEmail: 'joseph.kiprop@kryptonschool.ac.ke',
    teacherPhone: '+254 712 345 678',
    parentId: 'par-502',
    parentName: 'Mr. David Omondi',
    parentPhone: '+254 733 112 233',
    parentEmail: 'david.omondi@yahoo.com',
    studentId: 'std-1002',
    studentName: 'Brian Omondi',
    studentGrade: 'Grade 7A',
    admissionNumber: 'ADM-2024-0112',
    date: '2026-10-15',
    startTime: '09:20',
    endTime: '09:35',
    durationMinutes: 15,
    status: 'WAITING',
    waitingRoom: true,
    meetingUrl: '/ptm/room/ptm-831-qzt',
    parentNotes: 'Brian seems distracted during evening homework. Wanted to discuss focus strategies.',
    teacherNotes: 'Very creative thinker. Participates actively in team projects.',
    actionItems: [
      'Teacher will set up structured daily homework checklist',
      'Parent will inspect school planner every evening'
    ],
    academicSnapshot: {
      averageGrade: 78.2,
      attendanceRate: 92.4,
      conduct: 'Good - Occasionally Inattentive',
      topSubject: 'Social Studies (86%)',
      needsImprovement: 'English Composition (68%)',
      termExamRank: '12th out of 42',
      homeworkCompletionRate: 75,
      cbcCoreCompetencies: {
        communication: 'MEETING',
        criticalThinking: 'APPROACHING',
        collaboration: 'EXCEEDING',
        digitalLiteracy: 'MEETING',
      },
    },
    recordingAvailable: false,
    bookedAt: '2026-10-11T08:15:00Z',
  },
  {
    id: 'ptm-slot-103',
    meetingCode: 'ptm-914-mxv',
    meetingPin: '602184',
    title: 'Open Slot - Grade 7A Progress Consultation',
    description: 'Individual parent consultation slot for academic progress and co-curricular feedback.',
    grade: 'Grade 7A',
    teacherId: 'tch-001',
    teacherName: 'Mr. Joseph Kiprop',
    teacherSubject: 'Mathematics & Science',
    teacherEmail: 'joseph.kiprop@kryptonschool.ac.ke',
    date: '2026-10-15',
    startTime: '09:40',
    endTime: '09:55',
    durationMinutes: 15,
    status: 'AVAILABLE',
    waitingRoom: true,
    meetingUrl: '/ptm/room/ptm-914-mxv',
    recordingAvailable: false,
  },
  {
    id: 'ptm-slot-104',
    meetingCode: 'ptm-529-yhb',
    meetingPin: '918273',
    title: 'Open Slot - Grade 7A Progress Consultation',
    description: 'Individual parent consultation slot for academic progress and co-curricular feedback.',
    grade: 'Grade 7A',
    teacherId: 'tch-001',
    teacherName: 'Mr. Joseph Kiprop',
    teacherSubject: 'Mathematics & Science',
    teacherEmail: 'joseph.kiprop@kryptonschool.ac.ke',
    date: '2026-10-15',
    startTime: '10:00',
    endTime: '10:15',
    durationMinutes: 15,
    status: 'AVAILABLE',
    waitingRoom: true,
    meetingUrl: '/ptm/room/ptm-529-yhb',
    recordingAvailable: false,
  },
  {
    id: 'ptm-slot-105',
    meetingCode: 'ptm-608-lpw',
    meetingPin: '739201',
    title: 'Science Practical Skills & Term Assessment Discussion',
    description: 'Completed consultation with Faith Mutua regarding physics experiments and laboratory safety.',
    grade: 'Grade 8B',
    teacherId: 'tch-002',
    teacherName: 'Ms. Sarah Achieng',
    teacherSubject: 'Integrated Science & Biology',
    teacherEmail: 'sarah.achieng@kryptonschool.ac.ke',
    teacherPhone: '+254 721 887 766',
    parentId: 'par-503',
    parentName: 'Dr. Peter Mutua',
    parentPhone: '+254 720 445 566',
    parentEmail: 'peter.mutua@health.go.ke',
    studentId: 'std-1003',
    studentName: 'Faith Mutua',
    studentGrade: 'Grade 8B',
    admissionNumber: 'ADM-2023-0442',
    date: '2026-10-11',
    startTime: '11:00',
    endTime: '11:20',
    durationMinutes: 20,
    status: 'COMPLETED',
    waitingRoom: true,
    meetingUrl: '/ptm/room/ptm-608-lpw',
    parentNotes: 'Thank you for the detailed feedback on Faith science project.',
    teacherNotes: 'Faith scored top marks in the chemistry quiz. Selected for the regional Science Congress.',
    actionItems: [
      'Register Faith for East Africa Junior Science Olympiad',
      'Provide supplementary laboratory reading modules'
    ],
    academicSnapshot: {
      averageGrade: 93.8,
      attendanceRate: 99.1,
      conduct: 'Exemplary - Class Science Prefect',
      topSubject: 'Integrated Science (97%)',
      needsImprovement: 'Geography (82%)',
      termExamRank: '1st out of 38',
      homeworkCompletionRate: 98,
      cbcCoreCompetencies: {
        communication: 'EXCEEDING',
        criticalThinking: 'EXCEEDING',
        collaboration: 'EXCEEDING',
        digitalLiteracy: 'EXCEEDING',
      },
    },
    recordingAvailable: true,
    recordingUrl: 'https://storage.kryptonschool.ac.ke/recordings/ptm-608-lpw.webm',
    bookedAt: '2026-10-08T09:30:00Z',
  },
  {
    id: 'ptm-slot-106',
    meetingCode: 'ptm-331-kvd',
    meetingPin: '554201',
    title: 'Junior Secondary CBC Readiness Consultation',
    description: 'Review of learning materials, continuous assessments, and extracurricular sports progress.',
    grade: 'Grade 6C',
    teacherId: 'tch-003',
    teacherName: 'Mr. Emmanuel Mutiso',
    teacherSubject: 'Social Studies & Swahili',
    teacherEmail: 'emmanuel.mutiso@kryptonschool.ac.ke',
    parentId: 'par-504',
    parentName: 'Mrs. Beatrice Njeri',
    parentPhone: '+254 711 654 321',
    parentEmail: 'beatrice.njeri@gmail.com',
    studentId: 'std-1004',
    studentName: 'Kelvin Kariuki',
    studentGrade: 'Grade 6C',
    admissionNumber: 'ADM-2025-0211',
    date: '2026-10-16',
    startTime: '14:00',
    endTime: '14:20',
    durationMinutes: 20,
    status: 'BOOKED',
    waitingRoom: true,
    meetingUrl: '/ptm/room/ptm-331-kvd',
    parentNotes: 'Kelvin shows keen interest in robotics club and Kiswahili poetry.',
    teacherNotes: 'Very articulate speaker, well-behaved in class.',
    academicSnapshot: {
      averageGrade: 81.0,
      attendanceRate: 95.0,
      conduct: 'Very Good',
      topSubject: 'Kiswahili (89%)',
      needsImprovement: 'Mathematics (72%)',
      termExamRank: '8th out of 40',
      homeworkCompletionRate: 90,
      cbcCoreCompetencies: {
        communication: 'EXCEEDING',
        criticalThinking: 'MEETING',
        collaboration: 'EXCEEDING',
        digitalLiteracy: 'MEETING',
      },
    },
    recordingAvailable: false,
    bookedAt: '2026-10-10T16:00:00Z',
  }
];

const STORAGE_KEY = 'krypton_virtual_ptm_slots_v1';

export class VirtualPTMService {
  private static getStoredSlots(): PTMSlot[] {
    if (typeof window === 'undefined') return INITIAL_PTM_SLOTS;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PTM_SLOTS));
        return INITIAL_PTM_SLOTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_PTM_SLOTS;
    }
  }

  private static saveSlots(slots: PTMSlot[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    } catch (e) {
      console.error('Failed to save PTM slots to localStorage', e);
    }
  }

  public static getSlots(filter?: PTMScheduleFilter): PTMSlot[] {
    const slots = this.getStoredSlots();
    if (!filter) return slots;

    return slots.filter(slot => {
      if (filter.date && slot.date !== filter.date) return false;
      if (filter.grade && slot.grade !== filter.grade) return false;
      if (filter.status && slot.status !== filter.status) return false;
      if (filter.teacherId && slot.teacherId !== filter.teacherId) return false;
      if (filter.search) {
        const query = filter.search.toLowerCase();
        const matchesStudent = slot.studentName?.toLowerCase().includes(query);
        const matchesParent = slot.parentName?.toLowerCase().includes(query);
        const matchesTeacher = slot.teacherName?.toLowerCase().includes(query);
        const matchesTitle = slot.title.toLowerCase().includes(query);
        const matchesCode = slot.meetingCode.toLowerCase().includes(query);
        if (!matchesStudent && !matchesParent && !matchesTeacher && !matchesTitle && !matchesCode) {
          return false;
        }
      }
      return true;
    });
  }

  public static getSlotById(id: string): PTMSlot | null {
    const slots = this.getStoredSlots();
    return slots.find(s => s.id === id) || null;
  }

  public static getSlotByCode(meetingCode: string): PTMSlot | null {
    const slots = this.getStoredSlots();
    const cleanCode = meetingCode.trim().toLowerCase();
    return slots.find(s => s.meetingCode.toLowerCase() === cleanCode) || null;
  }

  public static createSlot(req: PTMCreateSlotRequest): PTMSlot {
    const slots = this.getStoredSlots();
    const randomSuffix = Math.random().toString(36).substring(2, 5);
    const meetingCode = `ptm-${Math.floor(100 + Math.random() * 900)}-${randomSuffix}`;
    const meetingPin = Math.floor(100000 + Math.random() * 900000).toString();

    const newSlot: PTMSlot = {
      id: `ptm-slot-${Date.now()}`,
      meetingCode,
      meetingPin,
      title: req.title,
      description: req.description || 'Virtual Parent-Teacher Conference',
      grade: req.grade,
      teacherId: req.teacherId,
      teacherName: req.teacherName,
      teacherSubject: req.teacherSubject,
      date: req.date,
      startTime: req.startTime,
      endTime: req.endTime,
      durationMinutes: req.durationMinutes,
      status: req.studentId ? 'BOOKED' : 'AVAILABLE',
      waitingRoom: req.waitingRoom ?? true,
      meetingUrl: `/ptm/room/${meetingCode}`,
      studentId: req.studentId,
      studentName: req.studentName,
      admissionNumber: req.admissionNumber,
      parentId: req.parentId,
      parentName: req.parentName,
      parentPhone: req.parentPhone,
      parentEmail: req.parentEmail,
      recordingAvailable: false,
    };

    slots.unshift(newSlot);
    this.saveSlots(slots);
    return newSlot;
  }

  public static generateBatchSlots(params: {
    teacherId: string;
    teacherName: string;
    teacherSubject: string;
    grade: string;
    date: string;
    startTime: string; // e.g. "09:00"
    endTime: string;   // e.g. "12:00"
    slotDurationMinutes: number; // e.g. 15
    bufferMinutes: number; // e.g. 5
  }): PTMSlot[] {
    const slots = this.getStoredSlots();
    const createdSlots: PTMSlot[] = [];

    const [startH, startM] = params.startTime.split(':').map(Number);
    const [endH, endM] = params.endTime.split(':').map(Number);

    let currentTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = endH * 60 + endM;

    let index = 1;
    while (currentTotalMinutes + params.slotDurationMinutes <= endTotalMinutes) {
      const slotStartH = Math.floor(currentTotalMinutes / 60);
      const slotStartM = currentTotalMinutes % 60;
      const slotEndTotal = currentTotalMinutes + params.slotDurationMinutes;
      const slotEndH = Math.floor(slotEndTotal / 60);
      const slotEndM = slotEndTotal % 60;

      const formatTime = (h: number, m: number) =>
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      const sTime = formatTime(slotStartH, slotStartM);
      const eTime = formatTime(slotEndH, slotEndM);

      const randomSuffix = Math.random().toString(36).substring(2, 5);
      const meetingCode = `ptm-${Math.floor(100 + Math.random() * 900)}-${randomSuffix}`;
      const meetingPin = Math.floor(100000 + Math.random() * 900000).toString();

      const newSlot: PTMSlot = {
        id: `ptm-batch-${Date.now()}-${index}`,
        meetingCode,
        meetingPin,
        title: `${params.grade} PTM Consultation - Session ${index}`,
        description: `Scheduled virtual 1-on-1 consultation slot for ${params.grade} parents.`,
        grade: params.grade,
        teacherId: params.teacherId,
        teacherName: params.teacherName,
        teacherSubject: params.teacherSubject,
        date: params.date,
        startTime: sTime,
        endTime: eTime,
        durationMinutes: params.slotDurationMinutes,
        status: 'AVAILABLE',
        waitingRoom: true,
        meetingUrl: `/ptm/room/${meetingCode}`,
        recordingAvailable: false,
      };

      createdSlots.push(newSlot);
      currentTotalMinutes += params.slotDurationMinutes + params.bufferMinutes;
      index++;
    }

    const updated = [...createdSlots, ...slots];
    this.saveSlots(updated);
    return createdSlots;
  }

  public static bookSlot(req: PTMBookSlotRequest): PTMSlot {
    const slots = this.getStoredSlots();
    const index = slots.findIndex(s => s.id === req.slotId);
    if (index === -1) {
      throw new Error('PTM Slot not found');
    }

    const slot = slots[index];
    slot.status = 'BOOKED';
    slot.studentId = req.studentId;
    slot.studentName = req.studentName;
    slot.admissionNumber = req.admissionNumber;
    slot.parentId = req.parentId;
    slot.parentName = req.parentName;
    slot.parentPhone = req.parentPhone;
    slot.parentEmail = req.parentEmail;
    slot.parentNotes = req.parentNotes;
    slot.bookedAt = new Date().toISOString();

    // Attach mock academic snapshot if not already present
    if (!slot.academicSnapshot) {
      slot.academicSnapshot = {
        averageGrade: Math.round(72 + Math.random() * 22),
        attendanceRate: Math.round(90 + Math.random() * 9),
        conduct: 'Respectful, participates actively',
        topSubject: 'Social Studies & Kiswahili',
        needsImprovement: 'Mathematics - Fractions & Algebra',
        termExamRank: `${Math.floor(1 + Math.random() * 15)}th in class`,
        homeworkCompletionRate: Math.round(80 + Math.random() * 18),
        cbcCoreCompetencies: {
          communication: 'MEETING',
          criticalThinking: 'MEETING',
          collaboration: 'EXCEEDING',
          digitalLiteracy: 'MEETING',
        },
      };
    }

    slots[index] = slot;
    this.saveSlots(slots);
    return slot;
  }

  public static updateSlot(id: string, updates: Partial<PTMSlot>): PTMSlot {
    const slots = this.getStoredSlots();
    const index = slots.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('PTM Slot not found');
    }

    slots[index] = { ...slots[index], ...updates };
    this.saveSlots(slots);
    return slots[index];
  }

  public static cancelSlot(id: string, reason?: string): PTMSlot {
    const slots = this.getStoredSlots();
    const index = slots.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('PTM Slot not found');
    }

    slots[index].status = 'AVAILABLE';
    slots[index].parentId = undefined;
    slots[index].parentName = undefined;
    slots[index].parentPhone = undefined;
    slots[index].parentEmail = undefined;
    slots[index].studentId = undefined;
    slots[index].studentName = undefined;
    slots[index].admissionNumber = undefined;
    slots[index].parentNotes = undefined;
    slots[index].teacherNotes = reason ? `Previous booking cancelled: ${reason}` : undefined;

    this.saveSlots(slots);
    return slots[index];
  }

  public static saveMeetingMinutes(slotId: string, notes: string, actionItems: string[]): PTMSlot {
    const slots = this.getStoredSlots();
    const index = slots.findIndex(s => s.id === slotId);
    if (index === -1) {
      throw new Error('PTM Slot not found');
    }

    slots[index].teacherNotes = notes;
    slots[index].actionItems = actionItems;
    slots[index].status = 'COMPLETED';

    this.saveSlots(slots);
    return slots[index];
  }

  public static generateCalendarIcs(slot: PTMSlot): string {
    const dateFormatted = slot.date.replace(/-/g, '');
    const startFormatted = `${dateFormatted}T${slot.startTime.replace(':', '')}00Z`;
    const endFormatted = `${dateFormatted}T${slot.endTime.replace(':', '')}00Z`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Krypton School ERP//Virtual PTM Scheduler//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:ptm-${slot.id}@kryptonschool.ac.ke`,
      `DTSTAMP:${dateFormatted}T000000Z`,
      `DTSTART:${startFormatted}`,
      `DTEND:${endFormatted}`,
      `SUMMARY:Virtual PTM: ${slot.teacherName} & ${slot.studentName || 'Parent'}`,
      `DESCRIPTION:Virtual Parent-Teacher Meeting on Krypton ERP Meet.\\nMeeting Code: ${slot.meetingCode}\\nPasscode: ${slot.meetingPin}\\nJoin Link: ${typeof window !== 'undefined' ? window.location.origin : ''}${slot.meetingUrl}`,
      `LOCATION:Krypton Virtual Meeting Room (${slot.meetingCode})`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Virtual PTM starts in 15 minutes',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  }

  public static downloadIcs(slot: PTMSlot): void {
    if (typeof window === 'undefined') return;
    const ics = this.generateCalendarIcs(slot);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `virtual-ptm-${slot.meetingCode}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
