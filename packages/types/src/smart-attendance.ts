export type AttendanceVerificationMethod = 'GEOFENCE_GPS' | 'DYNAMIC_QR' | 'ID_CARD_SCAN' | 'PARENT_EXCUSED' | 'MANUAL';

export interface GeofenceConfig {
  id: string;
  schoolName: string;
  schoolNameMl: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  allowedCheckInStart: string; // "07:00"
  lateThresholdTime: string;   // "08:30"
  allowedCheckOutStart: string; // "15:30"
  address: string;
  addressMl: string;
}

export interface StaffCheckInRequest {
  staffId: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  deviceInfo?: string;
  remarks?: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
}

export interface StaffCheckInResult {
  success: boolean;
  type: 'CHECK_IN' | 'CHECK_OUT';
  recordId: string;
  staffId: string;
  staffName: string;
  timestamp: string;
  distanceMeters: number;
  isWithinGeofence: boolean;
  status: 'PRESENT' | 'LATE' | 'CHECKED_OUT' | 'REJECTED';
  message: string;
  messageMl: string;
}

export interface StaffSmartAttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffNumber: string;
  department: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'ON_LEAVE' | 'CHECKED_OUT';
  verifiedMethod: AttendanceVerificationMethod;
  deviceInfo?: string;
  notes?: string;
}

// Student QR Code Attendance
export interface StudentQRData {
  studentId: string;
  admissionNumber: string;
  name: string;
  className: string;
  streamName?: string;
  schoolId: string;
  validToken?: string;
  timestamp?: number;
}

export interface ScanStudentQRRequest {
  qrPayload: string;
  source: 'CAMERA_SCAN' | 'BARCODE_SCANNER' | 'PROJECTOR_KIOSK';
  scannedBy?: string;
}

export interface ScanStudentQRResult {
  success: boolean;
  alreadyMarked: boolean;
  student: {
    id: string;
    admissionNumber: string;
    name: string;
    className: string;
    streamName?: string;
    photoUrl?: string;
    parentPhone?: string;
  };
  record: {
    id: string;
    date: string;
    time: string;
    status: 'PRESENT' | 'LATE';
    verifiedMethod: AttendanceVerificationMethod;
  };
  message: string;
  messageMl: string;
}

export interface DynamicProjectorSession {
  sessionId: string;
  currentCode: string;
  token: string;
  validUntil: number;
  countdownSeconds: number;
  refreshIntervalMs: number;
  schoolName: string;
  date: string;
  stats: {
    totalStudents: number;
    presentToday: number;
    lateToday: number;
    absentToday: number;
    excusedToday: number;
    attendancePercentage: number;
  };
  recentScans: Array<{
    id: string;
    studentName: string;
    admissionNumber: string;
    className: string;
    time: string;
    status: 'PRESENT' | 'LATE';
  }>;
}

export interface StudentIDCardData {
  id: string;
  admissionNumber: string;
  name: string;
  className: string;
  streamName?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  emergencyContact: string;
  address?: string;
  photoUrl?: string;
  academicYear: string;
  qrPayload: string;
}

// Parent Planned Absence Portal
export type AbsenceReasonCategory =
  | 'SICK'
  | 'MEDICAL_APPOINTMENT'
  | 'FAMILY_EMERGENCY'
  | 'RELIGIOUS_OBLIGATION'
  | 'TRAVEL'
  | 'SPORTS_OR_EVENT'
  | 'OTHER';

export type AbsenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ParentAbsenceApplication {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  streamName?: string;
  guardianId: string;
  guardianName: string;
  guardianPhone: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number;
  reasonCategory: AbsenceReasonCategory;
  reasonTitle: string;
  reasonTitleMl: string;
  explanation: string;
  hasMedicalCertificate: boolean;
  medicalCertificateName?: string;
  medicalCertificateUrl?: string;
  medicalCertificateBase64?: string;
  status: AbsenceStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  appliedAt: string;
  attendanceAutoMarked: boolean;
}

export interface SubmitAbsenceRequestDto {
  studentId: string;
  startDate: string;
  endDate: string;
  reasonCategory: AbsenceReasonCategory;
  explanation: string;
  medicalCertificateName?: string;
  medicalCertificateBase64?: string;
  guardianName?: string;
  guardianPhone?: string;
}

export interface ReviewAbsenceRequestDto {
  applicationId: string;
  status: 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  reviewerName?: string;
}
