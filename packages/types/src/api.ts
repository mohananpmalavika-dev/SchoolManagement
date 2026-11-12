/**
 * API Request and Response Types
 */

import { PaginationMeta } from './common';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta | Record<string, any>;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ErrorDetail[];
}

export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  avatar?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// Student API Types
export interface CreateStudentRequest {
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  email?: string;
  phone?: string;
  currentClassId?: string;
  currentStreamId?: string;
  admissionDate: string;
  guardians?: GuardianLinkRequest[];
}

export interface UpdateStudentRequest extends Partial<CreateStudentRequest> {}

export interface GuardianLinkRequest {
  guardianId?: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  relationship: string;
  isPrimary?: boolean;
}

// Fee API Types
export interface CreateInvoiceRequest {
  studentId: string;
  termId: string;
  items: InvoiceItemRequest[];
  dueDate?: string;
}

export interface InvoiceItemRequest {
  description: string;
  amount: number;
  feeCategory: string;
}

// Razorpay / UPI Payment Gateway API Types
export interface CreatePaymentOrderRequest {
  invoiceId: string;
  gateway: 'RAZORPAY' | 'UPI';
  amount: number; // in paise
  upiVpa?: string;
  phoneNumber?: string;
  accountReference?: string;
  transactionDesc?: string;
}

export interface CreatePaymentOrderResponse {
  orderId: string;
  gatewayOrderId: string;
  gateway: 'RAZORPAY' | 'UPI';
  amount: number;
  currency: string;
  upiIntentUri?: string;
  razorpayKeyId?: string;
  customerMessage: string;
}

export interface PaymentWebhookPayload {
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
        vpa?: string;
        acquirer_data?: {
          rrn?: string;
          upi_transaction_id?: string;
        };
      };
    };
  };
}

// Dashboard API Types
export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalStaff: number;
  attendanceToday: {
    present: number;
    absent: number;
    percentage: number;
  };
  fees: {
    totalExpected: number;
    totalCollected: number;
    outstanding: number;
    collectionRate: number;
  };
  recentPayments: RecentPayment[];
  upcomingEvents: UpcomingEvent[];
}

export interface RecentPayment {
  id: string;
  studentName: string;
  amount: number;
  method: string;
  date: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  type: string;
}
