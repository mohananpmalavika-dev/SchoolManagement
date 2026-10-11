import {
  GeofenceConfig,
  StaffCheckInRequest,
  StaffCheckInResult,
  StaffSmartAttendanceRecord,
  ScanStudentQRRequest,
  ScanStudentQRResult,
  DynamicProjectorSession,
  StudentIDCardData,
  ParentAbsenceApplication,
  SubmitAbsenceRequestDto,
  ReviewAbsenceRequestDto,
  AbsenceReasonCategory,
} from '@krypton/types';

// Haversine formula to compute geodesic distance between two GPS coordinates in meters
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Default School Geofence Center (Model Campus)
export const DEFAULT_GEOFENCE_CONFIG: GeofenceConfig = {
  id: 'geo-cfg-01',
  schoolName: 'Krypton Public School, Green Valley',
  schoolNameMl: 'ക്രിപ്റ്റൺ പബ്ലിക് സ്കൂൾ, ഗ്രീൻ വാലി ക്യാമ്പസ്',
  latitude: 10.0261,
  longitude: 76.3125,
  radiusMeters: 250, // 250 meters fence
  allowedCheckInStart: '07:00',
  lateThresholdTime: '08:45',
  allowedCheckOutStart: '15:30',
  address: 'Civil Lines Road, Educational Zone, Green Valley',
  addressMl: 'സിവിൽ ലൈൻസ് റോഡ്, എഡ്യൂക്കേഷൻ സോൺ, ഗ്രീൻ വാലി',
};

export interface MockStaffMember {
  id: string;
  staffNumber: string;
  name: string;
  nameMl: string;
  department: string;
  designation: string;
  phone: string;
  email: string;
  avatarUrl: string;
}

export const MOCK_STAFF_MEMBERS: MockStaffMember[] = [
  {
    id: 'stf-001',
    staffNumber: 'STF-2024-001',
    name: 'Dr. Priya Sharma',
    nameMl: 'ഡോ. പ്രിയ ശർമ്മ',
    department: 'Mathematics',
    designation: 'Senior Faculty & HOD',
    phone: '+91 98470 12345',
    email: 'priya.sharma@krypton.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'stf-002',
    staffNumber: 'STF-2024-002',
    name: 'Rajesh Varma',
    nameMl: 'രാജേഷ് വർമ്മ',
    department: 'Computer Science',
    designation: 'Lead ICT Instructor',
    phone: '+91 98470 23456',
    email: 'rajesh.varma@krypton.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'stf-003',
    staffNumber: 'STF-2024-003',
    name: 'Sarah Thomas',
    nameMl: 'സാറ തോമസ്',
    department: 'English & Literature',
    designation: 'Class Teacher - Grade 10',
    phone: '+91 98470 34567',
    email: 'sarah.thomas@krypton.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'stf-004',
    staffNumber: 'STF-2024-004',
    name: 'Mohammed Faizal',
    nameMl: 'മുഹമ്മദ് ഫൈസൽ',
    department: 'Physics',
    designation: 'Laboratory Head',
    phone: '+91 98470 45678',
    email: 'm.faizal@krypton.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'stf-005',
    staffNumber: 'STF-2024-005',
    name: 'Anjali Menon',
    nameMl: 'അഞ്ജലി മേനോൻ',
    department: 'Primary Section',
    designation: 'Headmistress (Primary)',
    phone: '+91 98470 56789',
    email: 'anjali.menon@krypton.edu',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
];

export const MOCK_STUDENTS: StudentIDCardData[] = [
  {
    id: 'stu-001',
    admissionNumber: 'KPS-2024-101',
    name: 'Aarav Patel',
    className: 'Grade 10',
    streamName: 'Stream A (Science)',
    bloodGroup: 'O+ve',
    emergencyContact: '+91 98470 11111',
    academicYear: '2026 - 2027',
    address: 'Green Valley Villa #12, Kochi',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    qrPayload: 'KRYPTON:ATTEND:stu-001:KPS-2024-101:Aarav Patel',
  },
  {
    id: 'stu-002',
    admissionNumber: 'KPS-2024-102',
    name: 'Ananya Sharma',
    className: 'Grade 10',
    streamName: 'Stream A (Science)',
    bloodGroup: 'B+ve',
    emergencyContact: '+91 98470 22222',
    academicYear: '2026 - 2027',
    address: 'Lakeview Heights Apt 4B, Kochi',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    qrPayload: 'KRYPTON:ATTEND:stu-002:KPS-2024-102:Ananya Sharma',
  },
  {
    id: 'stu-003',
    admissionNumber: 'KPS-2024-103',
    name: 'Malavika Nair',
    className: 'Grade 10',
    streamName: 'Stream B (Commerce)',
    bloodGroup: 'A+ve',
    emergencyContact: '+91 98470 33333',
    academicYear: '2026 - 2027',
    address: 'Rose Garden Colony, Flat 3C',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    qrPayload: 'KRYPTON:ATTEND:stu-003:KPS-2024-103:Malavika Nair',
  },
  {
    id: 'stu-004',
    admissionNumber: 'KPS-2024-104',
    name: 'Devadath Krishnan',
    className: 'Grade 10',
    streamName: 'Stream B (Commerce)',
    bloodGroup: 'AB+ve',
    emergencyContact: '+91 98470 44444',
    academicYear: '2026 - 2027',
    address: 'Valley View Residency 101',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    qrPayload: 'KRYPTON:ATTEND:stu-004:KPS-2024-104:Devadath Krishnan',
  },
  {
    id: 'stu-005',
    admissionNumber: 'KPS-2024-105',
    name: 'Rohan Matthew',
    className: 'Grade 9',
    streamName: 'Stream A',
    bloodGroup: 'O-ve',
    emergencyContact: '+91 98470 55555',
    academicYear: '2026 - 2027',
    address: 'Orchid Enclave, 2nd Cross',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    qrPayload: 'KRYPTON:ATTEND:stu-005:KPS-2024-105:Rohan Matthew',
  },
  {
    id: 'stu-006',
    admissionNumber: 'KPS-2024-106',
    name: 'Fatima Zahra',
    className: 'Grade 9',
    streamName: 'Stream B',
    bloodGroup: 'B+ve',
    emergencyContact: '+91 98470 66666',
    academicYear: '2026 - 2027',
    address: 'Palm Meadows Villa 7',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    qrPayload: 'KRYPTON:ATTEND:stu-006:KPS-2024-106:Fatima Zahra',
  },
];

export const INITIAL_LEAVE_APPLICATIONS: ParentAbsenceApplication[] = [
  {
    id: 'abs-001',
    studentId: 'stu-003',
    studentName: 'Malavika Nair',
    admissionNumber: 'KPS-2024-103',
    className: 'Grade 10 (Stream B)',
    guardianId: 'grd-003',
    guardianName: 'Radha Nair',
    guardianPhone: '+91 98470 33333',
    startDate: '2026-10-12',
    endDate: '2026-10-14',
    totalDays: 3,
    reasonCategory: 'SICK',
    reasonTitle: 'Viral Fever & Doctor Prescribed Rest',
    reasonTitleMl: 'വൈറൽ പനിയും ഡോക്ടറുടെ നിർദ്ദേശപ്രകാരമുള്ള വിശ്രമവും',
    explanation:
      'Malavika was diagnosed with severe viral fever on Sunday evening. The pediatrician has advised 3 days complete bed rest and medication. Medical certificate attached.',
    hasMedicalCertificate: true,
    medicalCertificateName: 'Medical_Certificate_Dr_Joseph_Pediatrics.pdf',
    medicalCertificateUrl: '#',
    status: 'APPROVED',
    reviewedBy: 'Dr. Priya Sharma (Class Coordinator)',
    reviewedAt: '2026-10-11 08:30 AM',
    reviewNotes: 'Approved. Get well soon Malavika. Notes will be shared on WhatsApp portal.',
    appliedAt: '2026-10-11 07:15 AM',
    attendanceAutoMarked: true,
  },
  {
    id: 'abs-002',
    studentId: 'stu-001',
    studentName: 'Aarav Patel',
    admissionNumber: 'KPS-2024-101',
    className: 'Grade 10 (Stream A)',
    guardianId: 'grd-001',
    guardianName: 'Suresh Patel',
    guardianPhone: '+91 98470 11111',
    startDate: '2026-10-13',
    endDate: '2026-10-13',
    totalDays: 1,
    reasonCategory: 'MEDICAL_APPOINTMENT',
    reasonTitle: 'Scheduled Orthodontic Treatment',
    reasonTitleMl: 'പല്ല് ചികിത്സയും സ്പെഷ്യലിസ്റ്റ് അപ്പോയിന്റ്മെന്റും',
    explanation:
      'Aarav has a scheduled dental bracket replacement appointment at Amrita Hospital at 10:30 AM.',
    hasMedicalCertificate: true,
    medicalCertificateName: 'Appointment_Slip_Amrita_Hospital.pdf',
    medicalCertificateUrl: '#',
    status: 'PENDING',
    appliedAt: '2026-10-11 09:40 AM',
    attendanceAutoMarked: false,
  },
  {
    id: 'abs-003',
    studentId: 'stu-004',
    studentName: 'Devadath Krishnan',
    admissionNumber: 'KPS-2024-104',
    className: 'Grade 10 (Stream B)',
    guardianId: 'grd-004',
    guardianName: 'Krishnan K.V.',
    guardianPhone: '+91 98470 44444',
    startDate: '2026-10-15',
    endDate: '2026-10-16',
    totalDays: 2,
    reasonCategory: 'FAMILY_EMERGENCY',
    reasonTitle: 'Family Wedding Out of Station',
    reasonTitleMl: 'കുടുംബത്തിലെ വിവാഹ ചടങ്ങ്',
    explanation:
      'Attending family wedding ceremony in Coimbatore. We will ensure Devadath catches up with assignments.',
    hasMedicalCertificate: false,
    status: 'PENDING',
    appliedAt: '2026-10-11 10:20 AM',
    attendanceAutoMarked: false,
  },
];

class SmartAttendanceService {
  private geofenceConfig: GeofenceConfig = DEFAULT_GEOFENCE_CONFIG;
  private staffRecords: StaffSmartAttendanceRecord[] = [];
  private studentScans: Array<{
    id: string;
    studentId: string;
    studentName: string;
    admissionNumber: string;
    className: string;
    time: string;
    status: 'PRESENT' | 'LATE';
    verifiedMethod: string;
  }> = [];
  private leaveApplications: ParentAbsenceApplication[] = [];
  private currentProjectorCode: string = '';
  private currentProjectorToken: string = '';
  private tokenExpiresAt: number = 0;

  constructor() {
    this.loadFromStorage();
    this.refreshProjectorCode();
  }

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private loadFromStorage() {
    if (!this.isClient()) {
      this.leaveApplications = [...INITIAL_LEAVE_APPLICATIONS];
      return;
    }

    try {
      const geo = localStorage.getItem('krypton_smart_geofence');
      if (geo) this.geofenceConfig = JSON.parse(geo);

      const staff = localStorage.getItem('krypton_smart_staff_records');
      if (staff) {
        this.staffRecords = JSON.parse(staff);
      } else {
        // Seed default records for today
        const todayStr = new Date().toISOString().split('T')[0];
        this.staffRecords = [
          {
            id: 'sar-01',
            staffId: 'stf-001',
            staffName: 'Dr. Priya Sharma',
            staffNumber: 'STF-2024-001',
            department: 'Mathematics',
            date: todayStr,
            checkInTime: '08:14 AM',
            latitude: 10.02615,
            longitude: 76.31248,
            distanceMeters: 28,
            status: 'PRESENT',
            verifiedMethod: 'GEOFENCE_GPS',
            deviceInfo: 'iPhone 15 Pro (Safari)',
            notes: 'Verified inside school campus geofence (28m from center)',
          },
          {
            id: 'sar-02',
            staffId: 'stf-002',
            staffName: 'Rajesh Varma',
            staffNumber: 'STF-2024-002',
            department: 'Computer Science',
            date: todayStr,
            checkInTime: '08:22 AM',
            latitude: 10.02602,
            longitude: 76.31261,
            distanceMeters: 45,
            status: 'PRESENT',
            verifiedMethod: 'GEOFENCE_GPS',
            deviceInfo: 'Samsung Galaxy S24 (Chrome)',
            notes: 'Verified inside school campus geofence (45m from center)',
          },
        ];
        this.saveStaffRecords();
      }

      const scans = localStorage.getItem('krypton_smart_student_scans');
      if (scans) {
        this.studentScans = JSON.parse(scans);
      } else {
        this.studentScans = [
          {
            id: 'scn-01',
            studentId: 'stu-001',
            studentName: 'Aarav Patel',
            admissionNumber: 'KPS-2024-101',
            className: 'Grade 10 (Stream A)',
            time: '08:05 AM',
            status: 'PRESENT',
            verifiedMethod: 'ID_CARD_SCAN',
          },
          {
            id: 'scn-02',
            studentId: 'stu-002',
            studentName: 'Ananya Sharma',
            admissionNumber: 'KPS-2024-102',
            className: 'Grade 10 (Stream A)',
            time: '08:12 AM',
            status: 'PRESENT',
            verifiedMethod: 'ID_CARD_SCAN',
          },
        ];
        this.saveStudentScans();
      }

      const leaves = localStorage.getItem('krypton_smart_leave_apps');
      if (leaves) {
        this.leaveApplications = JSON.parse(leaves);
      } else {
        this.leaveApplications = [...INITIAL_LEAVE_APPLICATIONS];
        this.saveLeaveApplications();
      }
    } catch (e) {
      console.error('Error loading smart attendance from storage', e);
    }
  }

  private saveStaffRecords() {
    if (this.isClient()) {
      localStorage.setItem('krypton_smart_staff_records', JSON.stringify(this.staffRecords));
    }
  }

  private saveStudentScans() {
    if (this.isClient()) {
      localStorage.setItem('krypton_smart_student_scans', JSON.stringify(this.studentScans));
    }
  }

  private saveLeaveApplications() {
    if (this.isClient()) {
      localStorage.setItem('krypton_smart_leave_apps', JSON.stringify(this.leaveApplications));
    }
  }

  // Geofence Config Methods
  getGeofenceConfig(): GeofenceConfig {
    return this.geofenceConfig;
  }

  updateGeofenceConfig(config: Partial<GeofenceConfig>): GeofenceConfig {
    this.geofenceConfig = { ...this.geofenceConfig, ...config };
    if (this.isClient()) {
      localStorage.setItem('krypton_smart_geofence', JSON.stringify(this.geofenceConfig));
    }
    return this.geofenceConfig;
  }

  // Geofenced Staff Check-in / Check-out
  checkInStaff(req: StaffCheckInRequest): StaffCheckInResult {
    const staff = MOCK_STAFF_MEMBERS.find((s) => s.id === req.staffId) || MOCK_STAFF_MEMBERS[0];
    const distanceMeters = calculateHaversineDistanceMeters(
      req.latitude,
      req.longitude,
      this.geofenceConfig.latitude,
      this.geofenceConfig.longitude
    );

    const isWithin = distanceMeters <= this.geofenceConfig.radiusMeters;
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayStr = now.toISOString().split('T')[0];

    if (!isWithin) {
      return {
        success: false,
        type: req.type,
        recordId: '',
        staffId: staff.id,
        staffName: staff.name,
        timestamp: timeFormatted,
        distanceMeters,
        isWithinGeofence: false,
        status: 'REJECTED',
        message: `Check-in rejected! You are ${distanceMeters} meters away from school campus. Permitted radius is ${this.geofenceConfig.radiusMeters}m.`,
        messageMl: `ചെക്ക്-ഇൻ നിരസിച്ചു! നിങ്ങൾ സ്കൂൾ കോമ്പൗണ്ടിൽ നിന്നും ${distanceMeters} മീറ്റർ അകലെയാണ്. അനുവദനീയമായ പരിധി ${this.geofenceConfig.radiusMeters} മീറ്റർ മാത്രമാണ്.`,
      };
    }

    // Check if late (e.g., after lateThresholdTime)
    const [lateH, lateM] = this.geofenceConfig.lateThresholdTime.split(':').map(Number);
    const lateThresholdDate = new Date();
    lateThresholdDate.setHours(lateH, lateM, 0, 0);
    const isLate = now > lateThresholdDate;
    const status = isLate ? 'LATE' : 'PRESENT';

    let existingRecord = this.staffRecords.find(
      (r) => r.staffId === staff.id && r.date === todayStr
    );

    if (req.type === 'CHECK_OUT') {
      if (existingRecord) {
        existingRecord.checkOutTime = timeFormatted;
        existingRecord.status = 'CHECKED_OUT';
        existingRecord.notes = (existingRecord.notes || '') + ` | Checked out at ${timeFormatted} (${distanceMeters}m from center)`;
      } else {
        existingRecord = {
          id: 'sar-' + Date.now(),
          staffId: staff.id,
          staffName: staff.name,
          staffNumber: staff.staffNumber,
          department: staff.department,
          date: todayStr,
          checkOutTime: timeFormatted,
          latitude: req.latitude,
          longitude: req.longitude,
          distanceMeters,
          status: 'CHECKED_OUT',
          verifiedMethod: 'GEOFENCE_GPS',
          deviceInfo: req.deviceInfo || 'Mobile Device',
          notes: `Check-out recorded (${distanceMeters}m from campus center)`,
        };
        this.staffRecords.unshift(existingRecord);
      }
      this.saveStaffRecords();

      return {
        success: true,
        type: 'CHECK_OUT',
        recordId: existingRecord.id,
        staffId: staff.id,
        staffName: staff.name,
        timestamp: timeFormatted,
        distanceMeters,
        isWithinGeofence: true,
        status: 'CHECKED_OUT',
        message: `Check-out successful! Time: ${timeFormatted}. Safe travels.`,
        messageMl: `ചെക്ക്-ഔട്ട് വിജയകരം! സമയം: ${timeFormatted}. ശുഭയാത്ര.`,
      };
    }

    // CHECK_IN
    if (existingRecord && existingRecord.checkInTime) {
      return {
        success: true,
        type: 'CHECK_IN',
        recordId: existingRecord.id,
        staffId: staff.id,
        staffName: staff.name,
        timestamp: existingRecord.checkInTime,
        distanceMeters,
        isWithinGeofence: true,
        status: existingRecord.status as any,
        message: `Already checked in today at ${existingRecord.checkInTime} (${existingRecord.status}).`,
        messageMl: `ഇന്ന് ${existingRecord.checkInTime}-ന് ഇതിനകം ചെക്ക്-ഇൻ പൂർത്തിയായിട്ടുണ്ട് (${existingRecord.status}).`,
      };
    }

    const newRecord: StaffSmartAttendanceRecord = {
      id: 'sar-' + Date.now(),
      staffId: staff.id,
      staffName: staff.name,
      staffNumber: staff.staffNumber,
      department: staff.department,
      date: todayStr,
      checkInTime: timeFormatted,
      latitude: req.latitude,
      longitude: req.longitude,
      distanceMeters,
      status,
      verifiedMethod: 'GEOFENCE_GPS',
      deviceInfo: req.deviceInfo || 'Mobile GPS Check-in',
      notes: `Verified within geofence (${distanceMeters}m from campus center). GPS accuracy: ${req.accuracyMeters || 12}m`,
    };

    this.staffRecords.unshift(newRecord);
    this.saveStaffRecords();

    return {
      success: true,
      type: 'CHECK_IN',
      recordId: newRecord.id,
      staffId: staff.id,
      staffName: staff.name,
      timestamp: timeFormatted,
      distanceMeters,
      isWithinGeofence: true,
      status,
      message: `Verified! Check-in recorded at ${timeFormatted} (${distanceMeters}m from campus center). Status: ${status}.`,
      messageMl: `പരിശോധന വിജയിച്ചു! ${distanceMeters} മീറ്റർ അകലെ വച്ച് ${timeFormatted}-ൽ ചെക്ക്-ഇൻ രേഖപ്പെടുത്തി. സ്റ്റാറ്റസ്: ${status === 'LATE' ? 'വൈകി എത്തിയത് (Late)' : 'ഹാജർ (Present)'}.`,
    };
  }

  getStaffRecords(dateFilter?: string): StaffSmartAttendanceRecord[] {
    const targetDate = dateFilter || new Date().toISOString().split('T')[0];
    return this.staffRecords.filter((r) => !dateFilter || r.date === targetDate);
  }

  getAllStaff(): MockStaffMember[] {
    return MOCK_STAFF_MEMBERS;
  }

  // Student QR Code Scanning
  scanStudentQR(req: ScanStudentQRRequest): ScanStudentQRResult {
    const raw = req.qrPayload.trim();
    let student: StudentIDCardData | undefined;

    // Parse payload: either "KRYPTON:ATTEND:stu-001:..." or direct studentId or admission number
    if (raw.startsWith('KRYPTON:ATTEND:')) {
      const parts = raw.split(':');
      const studentId = parts[2];
      student = MOCK_STUDENTS.find((s) => s.id === studentId || s.admissionNumber === parts[3]);
    } else {
      student = MOCK_STUDENTS.find(
        (s) =>
          s.id.toLowerCase() === raw.toLowerCase() ||
          s.admissionNumber.toLowerCase() === raw.toLowerCase() ||
          s.name.toLowerCase().includes(raw.toLowerCase())
      );
    }

    if (!student) {
      student = MOCK_STUDENTS[0]; // fallback demo
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const todayStr = now.toISOString().split('T')[0];

    const alreadyMarked = this.studentScans.some((s) => s.studentId === student!.id);

    if (alreadyMarked) {
      const existing = this.studentScans.find((s) => s.studentId === student!.id)!;
      return {
        success: true,
        alreadyMarked: true,
        student: {
          id: student.id,
          admissionNumber: student.admissionNumber,
          name: student.name,
          className: student.className,
          streamName: student.streamName,
          photoUrl: student.photoUrl,
          parentPhone: student.emergencyContact,
        },
        record: {
          id: existing.id,
          date: todayStr,
          time: existing.time,
          status: existing.status,
          verifiedMethod: 'ID_CARD_SCAN',
        },
        message: `${student.name} is already marked ${existing.status} today at ${existing.time}.`,
        messageMl: `${student.name}-ന്റെ ഹാജർ ഇന്ന് ${existing.time}-ൽ ${existing.status === 'LATE' ? 'വൈകിയതായി' : 'ഹാജരായി'} രേഖപ്പെടുത്തിയിട്ടുണ്ട്.`,
      };
    }

    // Check if after 08:45 AM
    const isLate = now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() >= 45);
    const status: 'PRESENT' | 'LATE' = isLate ? 'LATE' : 'PRESENT';


    const newScan = {
      id: 'scn-' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      admissionNumber: student.admissionNumber,
      className: `${student.className} (${student.streamName || ''})`,
      time: timeFormatted,
      status,
      verifiedMethod: req.source === 'PROJECTOR_KIOSK' ? 'DYNAMIC_QR' : 'ID_CARD_SCAN',
    };

    this.studentScans.unshift(newScan);
    this.saveStudentScans();

    return {
      success: true,
      alreadyMarked: false,
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        name: student.name,
        className: student.className,
        streamName: student.streamName,
        photoUrl: student.photoUrl,
        parentPhone: student.emergencyContact,
      },
      record: {
        id: newScan.id,
        date: todayStr,
        time: timeFormatted,
        status,
        verifiedMethod: newScan.verifiedMethod as any,
      },
      message: `Verified! ${student.name} (${student.admissionNumber}) marked ${status} at ${timeFormatted}.`,
      messageMl: `പരിശോധന വിജയിച്ചു! ${student.name} (${student.admissionNumber}) - ഹാജർ രേഖപ്പെടുത്തി (${timeFormatted}).`,
    };
  }

  getAllStudents(): StudentIDCardData[] {
    return MOCK_STUDENTS;
  }

  getStudentScans() {
    return this.studentScans;
  }

  // Dynamic Projector Screen Session
  refreshProjectorCode(): DynamicProjectorSession {
    const now = Date.now();
    const randomSalt = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.currentProjectorCode = `KRYPTON-ATTEND-${new Date().toISOString().slice(0, 10)}-${randomSalt}`;
    this.currentProjectorToken = Buffer.from(this.currentProjectorCode).toString('base64');
    this.tokenExpiresAt = now + 20000; // 20-second dynamic rotation

    const totalStudents = 120; // Simulated school strength for the grade
    const presentToday = this.studentScans.length;
    const lateToday = this.studentScans.filter((s) => s.status === 'LATE').length;
    const excusedToday = this.leaveApplications.filter((l) => l.status === 'APPROVED').length;
    const absentToday = Math.max(0, totalStudents - presentToday - excusedToday);
    const attendancePercentage = Math.round(((presentToday + excusedToday) / totalStudents) * 100);

    return {
      sessionId: 'sess-' + Math.floor(now / 20000),
      currentCode: this.currentProjectorCode,
      token: this.currentProjectorToken,
      validUntil: this.tokenExpiresAt,
      countdownSeconds: 20,
      refreshIntervalMs: 20000,
      schoolName: this.geofenceConfig.schoolName,
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      stats: {
        totalStudents,
        presentToday,
        lateToday,
        absentToday,
        excusedToday,
        attendancePercentage,
      },
      recentScans: this.studentScans.slice(0, 10),
    };
  }

  getProjectorSession(): DynamicProjectorSession {
    if (Date.now() >= this.tokenExpiresAt) {
      return this.refreshProjectorCode();
    }
    const totalStudents = 120;
    const presentToday = this.studentScans.length;
    const lateToday = this.studentScans.filter((s) => s.status === 'LATE').length;
    const excusedToday = this.leaveApplications.filter((l) => l.status === 'APPROVED').length;
    const absentToday = Math.max(0, totalStudents - presentToday - excusedToday);
    const attendancePercentage = Math.round(((presentToday + excusedToday) / totalStudents) * 100);

    return {
      sessionId: 'sess-' + Math.floor(this.tokenExpiresAt / 20000),
      currentCode: this.currentProjectorCode,
      token: this.currentProjectorToken,
      validUntil: this.tokenExpiresAt,
      countdownSeconds: Math.max(1, Math.round((this.tokenExpiresAt - Date.now()) / 1000)),
      refreshIntervalMs: 20000,
      schoolName: this.geofenceConfig.schoolName,
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      stats: {
        totalStudents,
        presentToday,
        lateToday,
        absentToday,
        excusedToday,
        attendancePercentage,
      },
      recentScans: this.studentScans.slice(0, 10),
    };
  }

  // Parent Planned Absence Portal
  submitAbsenceApplication(dto: SubmitAbsenceRequestDto): ParentAbsenceApplication {
    const student = MOCK_STUDENTS.find((s) => s.id === dto.studentId) || MOCK_STUDENTS[2];
    const startDateObj = new Date(dto.startDate);
    const endDateObj = new Date(dto.endDate);
    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const reasonTitles: Record<AbsenceReasonCategory, { en: string; ml: string }> = {
      SICK: { en: 'Illness / Medical Sickness', ml: 'അസുഖം / ശാരീരിക അസ്വാസ്ഥ്യം' },
      MEDICAL_APPOINTMENT: { en: 'Medical / Dental Appointment', ml: 'ഡോക്ടർ അപ്പോയിന്റ്മെന്റ്' },
      FAMILY_EMERGENCY: { en: 'Family Emergency / Function', ml: 'കുടുംബപരമായ അത്യാവശ്യം' },
      RELIGIOUS_OBLIGATION: { en: 'Religious Obligation / Festival', ml: 'മതപരമായ ചടങ്ങുകൾ' },
      TRAVEL: { en: 'Out of Station Travel', ml: 'യാത്ര' },
      SPORTS_OR_EVENT: { en: 'External Sports / Academic Competition', ml: 'കായിക / മത്സര രംഗം' },
      OTHER: { en: 'Personal / Other Reason', ml: 'മറ്റ് വ്യക്തിപരമായ കാരണങ്ങൾ' },
    };

    const reasonMeta = reasonTitles[dto.reasonCategory] || reasonTitles.OTHER;

    const newApp: ParentAbsenceApplication = {
      id: 'abs-' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      admissionNumber: student.admissionNumber,
      className: `${student.className} (${student.streamName || ''})`,
      guardianId: 'grd-' + student.id,
      guardianName: dto.guardianName || 'Parent / Guardian',
      guardianPhone: dto.guardianPhone || student.emergencyContact,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalDays,
      reasonCategory: dto.reasonCategory,
      reasonTitle: reasonMeta.en,
      reasonTitleMl: reasonMeta.ml,
      explanation: dto.explanation,
      hasMedicalCertificate: Boolean(dto.medicalCertificateName),
      medicalCertificateName: dto.medicalCertificateName,
      medicalCertificateBase64: dto.medicalCertificateBase64,
      medicalCertificateUrl: dto.medicalCertificateBase64 ? '#' : undefined,
      status: 'PENDING',
      appliedAt: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      attendanceAutoMarked: false,
    };

    this.leaveApplications.unshift(newApp);
    this.saveLeaveApplications();
    return newApp;
  }

  getLeaveApplications(statusFilter?: string): ParentAbsenceApplication[] {
    if (!statusFilter || statusFilter === 'ALL') {
      return this.leaveApplications;
    }
    return this.leaveApplications.filter((app) => app.status === statusFilter);
  }

  reviewAbsenceApplication(dto: ReviewAbsenceRequestDto): ParentAbsenceApplication {
    const app = this.leaveApplications.find((a) => a.id === dto.applicationId);
    if (!app) {
      throw new Error(`Application ${dto.applicationId} not found`);
    }

    app.status = dto.status;
    app.reviewedBy = dto.reviewerName || 'Teacher / Attendance In-Charge';
    app.reviewedAt = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    app.reviewNotes = dto.reviewNotes || (dto.status === 'APPROVED' ? 'Approved by Class Teacher' : 'Rejected');

    if (dto.status === 'APPROVED') {
      // Automatically marks attendance as EXCUSED in student daily register!
      app.attendanceAutoMarked = true;
    } else {
      app.attendanceAutoMarked = false;
    }

    this.saveLeaveApplications();
    return app;
  }

  resetDemoData() {
    if (this.isClient()) {
      localStorage.removeItem('krypton_smart_geofence');
      localStorage.removeItem('krypton_smart_staff_records');
      localStorage.removeItem('krypton_smart_student_scans');
      localStorage.removeItem('krypton_smart_leave_apps');
    }
    this.geofenceConfig = DEFAULT_GEOFENCE_CONFIG;
    this.loadFromStorage();
  }
}

export const smartAttendanceApi = new SmartAttendanceService();
