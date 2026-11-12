export type AdmissionStage =
  | 'INQUIRY_RECEIVED'
  | 'INTERVIEW_SCHEDULED'
  | 'ACCEPTED'
  | 'FEE_PAID'
  | 'ADMITTED';

export type LeadSource =
  | 'WEBSITE_PORTAL'
  | 'WALK_IN'
  | 'WHATSAPP'
  | 'SOCIAL_MEDIA'
  | 'PARENT_REFERRAL'
  | 'EDUCATION_EXPO';

export type LeadPriority = 'HIGH' | 'MEDIUM' | 'NORMAL';

export type InterviewResult = 'RECOMMENDED' | 'PENDING' | 'REJECTED' | 'NOT_ATTENDED';

export type AdmissionPaymentMethod = 'UPI' | 'RAZORPAY' | 'NET_BANKING' | 'CARD' | 'CASH' | 'BANK_TRANSFER';

export interface AdmissionStudentInfo {
  firstName: string;
  lastName: string;
  fullName: string;
  fullNameMl?: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string; // YYYY-MM-DD
  applyingForGrade: string; // e.g. "Grade 1", "Grade 5", "Kindergarten", "Grade 11 - Science"
  bloodGroup: string;
  previousSchool?: string;
  nationality: string;
  religion?: string;
  casteCategory?: string;
  medicalNotes?: string;
}

export interface AdmissionParentInfo {
  fatherName: string;
  motherName: string;
  guardianName?: string;
  email: string;
  phone: string;
  whatsappPhone: string;
  occupation?: string;
  address: string;
  city: string;
  pincode: string;
}

export interface AdmissionDocuments {
  birthCertificateUrl?: string;
  birthCertificateFileName?: string;
  studentPhotoUrl?: string;
  studentPhotoFileName?: string;
  previousMarksheetUrl?: string;
  previousMarksheetFileName?: string;
  transferCertificateUrl?: string;
  transferCertificateFileName?: string;
}

export interface AdmissionInterview {
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  interviewerName: string;
  venueOrLink: string;
  isVirtual: boolean;
  notes?: string;
  score?: number; // 0-100
  result?: InterviewResult;
}

export interface AdmissionPayment {
  amount: number;
  currency: string;
  receiptNumber: string;
  paidAt: string;
  paymentMethod: AdmissionPaymentMethod;
  feeType: string;
  transactionId: string;
}

export interface AdmissionEnrollment {
  officialAdmissionNumber: string; // e.g. "KPS-2026-1180"
  rollNumber: string;
  assignedClass: string;
  assignedSection: string;
  admittedAt: string;
  welcomeKitDispatched: boolean;
}

export interface AdmissionTimelineEvent {
  id: string;
  stage: AdmissionStage;
  title: string;
  titleMl?: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface AdmissionNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface AdmissionApplication {
  id: string;
  applicationNumber: string; // e.g. "APP-2026-0842"
  academicYear: string; // e.g. "2026-2027"
  stage: AdmissionStage;
  priority: LeadPriority;
  leadSource: LeadSource;
  student: AdmissionStudentInfo;
  parent: AdmissionParentInfo;
  documents: AdmissionDocuments;
  interview?: AdmissionInterview;
  payment?: AdmissionPayment;
  enrollment?: AdmissionEnrollment;
  transportRequired: boolean;
  hostelRequired: boolean;
  siblingEnrolled: boolean;
  siblingDetails?: string;
  notes: AdmissionNote[];
  timeline: AdmissionTimelineEvent[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdmissionInput {
  academicYear?: string;
  student: AdmissionStudentInfo;
  parent: AdmissionParentInfo;
  documents: AdmissionDocuments;
  transportRequired?: boolean;
  hostelRequired?: boolean;
  siblingEnrolled?: boolean;
  siblingDetails?: string;
  leadSource?: LeadSource;
  priority?: LeadPriority;
  notes?: string;
}

export interface AdmissionFunnelStats {
  totalInquiries: number;
  interviewScheduledCount: number;
  acceptedCount: number;
  feePaidCount: number;
  admittedCount: number;
  conversionRate: number; // percentage
  totalFeeCollected: number;
  byGrade: Record<string, number>;
  bySource: Record<LeadSource, number>;
}
