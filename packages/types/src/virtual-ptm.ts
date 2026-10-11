export type PTMStatus = 'AVAILABLE' | 'BOOKED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type PTMRole = 'TEACHER' | 'PARENT' | 'ADMIN' | 'OBSERVER';

export interface PTMAcademicSnapshot {
  averageGrade: number;
  attendanceRate: number;
  conduct: string;
  topSubject: string;
  needsImprovement: string;
  termExamRank: string;
  homeworkCompletionRate: number;
  cbcCoreCompetencies: {
    communication: 'EXCEEDING' | 'MEETING' | 'APPROACHING' | 'EMERGING';
    criticalThinking: 'EXCEEDING' | 'MEETING' | 'APPROACHING' | 'EMERGING';
    collaboration: 'EXCEEDING' | 'MEETING' | 'APPROACHING' | 'EMERGING';
    digitalLiteracy: 'EXCEEDING' | 'MEETING' | 'APPROACHING' | 'EMERGING';
  };
}

export interface PTMSlot {
  id: string;
  meetingCode: string; // e.g., "ptm-892-vkm"
  meetingPin: string;  // e.g., "829401"
  title: string;
  description: string;
  grade: string;
  teacherId: string;
  teacherName: string;
  teacherSubject: string;
  teacherEmail?: string;
  teacherPhone?: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  studentId?: string;
  studentName?: string;
  studentGrade?: string;
  admissionNumber?: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  durationMinutes: number;
  status: PTMStatus;
  waitingRoom: boolean;
  meetingUrl: string;
  parentNotes?: string;
  teacherNotes?: string;
  actionItems?: string[];
  academicSnapshot?: PTMAcademicSnapshot;
  recordingAvailable?: boolean;
  recordingUrl?: string;
  bookedAt?: string;
}

export interface PTMParticipant {
  id: string;
  name: string;
  role: 'HOST' | 'CO_HOST' | 'PARTICIPANT';
  audio: boolean;
  video: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  avatarBg: string;
  isLocal?: boolean;
  networkQuality?: 'EXCELLENT' | 'GOOD' | 'FAIR';
}

export interface PTMChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'TEACHER' | 'PARENT' | 'ADMIN' | 'SYSTEM';
  message: string;
  timestamp: string;
  isPrivate?: boolean;
  reactions?: string[];
}

export interface PTMWhiteboardElement {
  id: string;
  type: 'pen' | 'line' | 'rect' | 'circle' | 'text';
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  size: number;
}

export interface PTMMeetingSettings {
  muteParticipantsOnEntry: boolean;
  allowParticipantUnmute: boolean;
  allowScreenShare: boolean;
  allowChat: boolean;
  waitingRoom: boolean;
  lockMeeting: boolean;
  noiseSuppression: boolean;
  enableCaptions: boolean;
  virtualBackground: 'none' | 'blur' | 'classroom' | 'library' | 'campus';
}

export interface PTMScheduleFilter {
  date?: string;
  teacherId?: string;
  grade?: string;
  status?: PTMStatus;
  search?: string;
}

export interface PTMCreateSlotRequest {
  title: string;
  description?: string;
  teacherId: string;
  teacherName: string;
  teacherSubject: string;
  grade: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  waitingRoom?: boolean;
  studentId?: string;
  studentName?: string;
  admissionNumber?: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export interface PTMBookSlotRequest {
  slotId: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  parentId: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  parentNotes?: string;
}
