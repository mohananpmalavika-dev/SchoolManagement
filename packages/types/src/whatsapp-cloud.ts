export type WhatsAppDeliveryStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'REPLIED';

export type WhatsAppMessageType =
  | 'ABSENCE_ALERT'
  | 'FEE_PAYMENT_LINK'
  | 'REPORT_CARD_PDF'
  | 'FEE_RECEIPT_PDF'
  | 'SCHOOL_NOTICE_PDF'
  | 'CUSTOM_ANNOUNCEMENT';

export type WhatsAppLanguage = 'ml' | 'en' | 'sw';

export interface WhatsAppButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  payload?: string;
  url?: string;
  phoneNumber?: string;
}

export interface WhatsAppMediaAttachment {
  type: 'DOCUMENT' | 'IMAGE' | 'AUDIO' | 'VIDEO';
  url: string;
  filename: string;
  mimeType: string;
  fileSizeBytes?: number;
  caption?: string;
}

export interface WhatsAppCloudMessage {
  id: string;
  tenantId: string;
  recipientPhone: string;
  parentName: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  type: WhatsAppMessageType;
  language: WhatsAppLanguage;
  headerText?: string;
  bodyText: string;
  bodyTextMl?: string;
  footerText?: string;
  buttons?: WhatsAppButton[];
  attachment?: WhatsAppMediaAttachment;
  paymentDetails?: {
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    dueDate: string;
    paymentUrl: string;
    upiUri?: string;
    paymentMethod?: 'MPESA_STK' | 'MPESA_PAYBILL' | 'AIRTEL_MONEY' | 'UPI' | 'CARD';
    mpesaPaybill?: string;
    mpesaAccountNumber?: string;
    mpesaReceiptNumber?: string;
    stkPushPromptSent?: boolean;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    paidAt?: string;
    transactionId?: string;
  };
  attendanceDetails?: {
    date: string;
    rollNumber: string;
    reportedTime: string;
    reason?: string;
    parentAcknowledged?: boolean;
    acknowledgedAt?: string;
  };
  pdfDetails?: {
    documentId: string;
    documentTitle: string;
    documentType: 'REPORT_CARD' | 'FEE_RECEIPT' | 'CIRCULAR_NOTICE';
    termOrPeriod?: string;
    downloadUrl: string;
    pagesCount: number;
  };
  status: WhatsAppDeliveryStatus;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  wabaMessageId: string;
}

export interface WhatsAppAutomationConfig {
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  businessName: string;
  apiTokenConfigured: boolean;
  webhookVerified: boolean;
  morningAbsenceTriggerTime: string; // e.g. "09:30 AM"
  autoFeeReminderDaysBeforeDue: number; // e.g. 3
  autoPdfDeliveryEnabled: boolean;
  defaultLanguage: WhatsAppLanguage;
}

export interface WhatsAppAutomationStats {
  totalSentToday: number;
  totalDelivered: number;
  totalRead: number;
  openRatePercentage: number;
  paymentConversionsCount: number;
  paymentCollectedAmount: number;
  pdfDownloadsCount: number;
  avgReadTimeMinutes: number;
}

export interface SendAbsenteeAlertRequest {
  studentIds: string[];
  date: string;
  language: WhatsAppLanguage;
  customNote?: string;
}

export interface SendFeeLinkRequest {
  invoiceIds: string[];
  language: WhatsAppLanguage;
  includeDiscount?: boolean;
}

export interface SendPdfDocumentRequest {
  documentType: 'REPORT_CARD' | 'FEE_RECEIPT' | 'CIRCULAR_NOTICE';
  studentIds?: string[];
  classId?: string;
  documentTitle: string;
  documentUrl: string;
  language: WhatsAppLanguage;
}
