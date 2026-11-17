export type WhatsAppDeliveryStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'REPLIED' | 'READY_TO_OPEN';

export type WhatsAppGatewayProvider =
  | 'META_CLOUD_API'
  | 'TWILIO'
  | 'GUPSHUP'
  | 'WHATSAPP_WEB';

export interface WhatsAppWebLink {
  waMeUrl: string;
  webWhatsAppUrl: string;
  phone: string;
  encodedMessage: string;
  previewText: string;
}

export interface WhatsAppLiveDispatchResult {
  success: boolean;
  provider: WhatsAppGatewayProvider;
  messageId?: string;
  status: string;
  waLink?: WhatsAppWebLink;
  error?: string;
}

export type WhatsAppMessageType =
  | 'ABSENCE_ALERT'
  | 'FEE_PAYMENT_LINK'
  | 'REPORT_CARD_PDF'
  | 'FEE_RECEIPT_PDF'
  | 'SCHOOL_NOTICE_PDF'
  | 'CUSTOM_ANNOUNCEMENT';

export type WhatsAppLanguage = 'en' | 'hi' | 'ml';

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
  bodyTextHi?: string;
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
    upiId?: string;
    paymentMethod?: 'UPI' | 'RAZORPAY' | 'NET_BANKING' | 'CARD';
    razorpayOrderId?: string;
    utrNumber?: string;
    paymentReceiptNumber?: string;
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

export interface MetaCloudGatewayConfig {
  wabaId: string;
  phoneNumberId: string;
  accessToken?: string;
  apiVersion?: string;
  webhookVerifyToken?: string;
}

export interface TwilioGatewayConfig {
  accountSid: string;
  authToken?: string;
  whatsappNumber: string;
}

export interface GupshupGatewayConfig {
  apiKey?: string;
  appName: string;
  sourceNumber: string;
}

export interface WhatsAppAutomationConfig {
  activeProvider: WhatsAppGatewayProvider;
  freePlayschoolMode: boolean;
  defaultCountryCode?: string;
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
  metaConfig?: MetaCloudGatewayConfig;
  twilioConfig?: TwilioGatewayConfig;
  gupshupConfig?: GupshupGatewayConfig;
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
