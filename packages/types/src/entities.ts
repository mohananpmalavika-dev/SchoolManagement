/**
 * Entity Types (Domain Models)
 */

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  status: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  website?: string;
  timezone: string;
  locale: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  tenantId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender: string;
  aadhaarLast4?: string;
  apaarId?: string;
  penNumber?: string;
  state?: string;
  email?: string;
  phone?: string;
  currentClassId?: string;
  currentStreamId?: string;
  status: string;
  admissionDate: Date;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Guardian {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  aadhaarLast4?: string;
  email?: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
  occupation?: string;
  employer?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  studentId: string;
  termId: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  status: string;
  paymentDate: Date;
  receiptNumber?: string;
  receiptIssued: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  studentId: string;
  date: Date;
  status: string;
  period?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Examination {
  id: string;
  tenantId: string;
  termId: string;
  name: string;
  examType: string;
  startDate: Date;
  endDate: Date;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Grade {
  id: string;
  tenantId: string;
  examinationId: string;
  studentId: string;
  subjectId: string;
  marks?: number;
  grade?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportCard {
  id: string;
  tenantId: string;
  studentId: string;
  termId: string;
  overallGrade?: string;
  overallPercentage?: number;
  position?: number;
  totalStudents?: number;
  teacherComment?: string;
  principalComment?: string;
  status: string;
  generatedAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Class {
  id: string;
  tenantId: string;
  schoolId: string;
  name: string;
  level: string;
  educationLevel: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stream {
  id: string;
  tenantId: string;
  schoolId: string;
  classId: string;
  name: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  educationLevel: string;
  isCore: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff {
  id: string;
  tenantId: string;
  staffNumber: string;
  userId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: Date;
  gender: string;
  aadhaarLast4?: string;
  panNumber?: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  employmentType: string;
  hireDate: Date;
  isTeacher: boolean;
  status: string;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentGatewayTransaction {
  id: string;
  tenantId: string;
  gateway: 'RAZORPAY' | 'UPI';
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  transactionType: string;
  amount: number;
  currency: string;
  phoneNumber?: string;
  upiVpa?: string;
  utrNumber?: string;
  accountReference: string;
  receiptNumber?: string;
  transactionDate?: Date;
  resultCode?: string;
  resultDesc?: string;
  status: string;
  isReconciled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
