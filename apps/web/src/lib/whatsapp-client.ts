import {
  WhatsAppCloudMessage,
  WhatsAppAutomationConfig,
  WhatsAppAutomationStats,
  WhatsAppDeliveryStatus,
  WhatsAppMessageType,
  WhatsAppLanguage,
  WhatsAppGatewayProvider,
  WhatsAppWebLink,
  WhatsAppLiveDispatchResult,
} from '@krypton/types';

export interface StudentParentContact {
  id: string;
  admissionNo: string;
  name: string;
  nameHi?: string;
  nameMl?: string;
  className: string;
  rollNumber: string;
  parentName: string;
  parentNameHi?: string;
  parentNameMl?: string;
  phone: string; // Indian format: +91 9XX XXX XXXX
  isAbsentToday: boolean;
  absentReportedTime?: string;
  feeStatus: 'PAID' | 'DUE' | 'OVERDUE';
  feeAmountInr: number;
  pendingInvoiceId?: string;
}

export interface FeeInvoiceItem {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  amountInr: number;
  currency: 'INR';
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  description: string;
  descriptionHi?: string;
  descriptionMl?: string;
  upiId: string;
  razorpayOrderId: string;
  utrNumber?: string;
  paidAt?: string;
  transactionId?: string;
}

export interface SchoolPdfDocument {
  id: string;
  title: string;
  titleHi?: string;
  titleMl?: string;
  type: 'REPORT_CARD' | 'FEE_RECEIPT' | 'CIRCULAR_NOTICE';
  targetClass?: string;
  studentId?: string;
  studentName?: string;
  fileSizeBytes: number;
  pagesCount: number;
  publishedDate: string;
  downloadUrl: string;
  termOrSession?: string;
  summary: string;
  summaryHi?: string;
  summaryMl?: string;
}

// Indian School Students Dataset (KPS Kochi, Kerala)
export const INITIAL_STUDENTS: StudentParentContact[] = [
  {
    id: 'std-ind-101',
    admissionNo: 'KPS/2026/0142',
    name: 'Aarav Menon',
    nameHi: 'आरव मेनन',
    nameMl: 'ആരവ് മേനോൻ',
    className: 'Class 8B (CBSE)',
    rollNumber: '14',
    parentName: 'Rajesh Menon',
    parentNameHi: 'राजेश मेनन',
    parentNameMl: 'രാജേഷ് മേനോൻ',
    phone: '+91 98470 34567',
    isAbsentToday: true,
    absentReportedTime: '08:15 AM',
    feeStatus: 'DUE',
    feeAmountInr: 14850,
    pendingInvoiceId: 'INV-2026-884',
  },
  {
    id: 'std-ind-102',
    admissionNo: 'KPS/2026/0089',
    name: 'Ananya Sharma',
    nameHi: 'अनन्या शर्मा',
    nameMl: 'അനന്യ ശർമ്മ',
    className: 'Class 10A (CBSE)',
    rollNumber: '06',
    parentName: 'Ramesh Sharma',
    parentNameHi: 'रमेश शर्मा',
    parentNameMl: 'രമേഷ് ശർമ്മ',
    phone: '+91 98471 98765',
    isAbsentToday: true,
    absentReportedTime: '08:20 AM',
    feeStatus: 'OVERDUE',
    feeAmountInr: 8750,
    pendingInvoiceId: 'INV-2026-791',
  },
  {
    id: 'std-ind-103',
    admissionNo: 'KPS/2026/0201',
    name: 'Rohan Nambiar',
    nameHi: 'रोहन नांबियार',
    nameMl: 'രോഹൻ നമ്പ്യാർ',
    className: 'Class 9A (CBSE)',
    rollNumber: '21',
    parentName: 'Sandeep Nambiar',
    parentNameHi: 'संदीप नांबियार',
    parentNameMl: 'സന്ദീപ് നമ്പ്യാർ',
    phone: '+91 98951 45678',
    isAbsentToday: true,
    absentReportedTime: '08:25 AM',
    feeStatus: 'PAID',
    feeAmountInr: 0,
  },
  {
    id: 'std-ind-104',
    admissionNo: 'KPS/2026/0312',
    name: 'Diya Krishnan',
    nameHi: 'दीया कृष्णन',
    nameMl: 'ദിയ കൃഷ്ണൻ',
    className: 'Class 7B (CBSE)',
    rollNumber: '09',
    parentName: 'Pradeep Krishnan',
    parentNameHi: 'प्रदीप कृष्णन',
    parentNameMl: 'പ്രദീപ് കൃഷ്ണൻ',
    phone: '+91 98472 67890',
    isAbsentToday: false,
    feeStatus: 'DUE',
    feeAmountInr: 6200,
    pendingInvoiceId: 'INV-2026-912',
  },
  {
    id: 'std-ind-105',
    admissionNo: 'KPS/2026/0055',
    name: 'Siddharth Nair',
    nameHi: 'सिद्धार्थ नायर',
    nameMl: 'സിദ്ധാർത്ഥ് നായർ',
    className: 'Class 11B (Science)',
    rollNumber: '18',
    parentName: 'Gopinathan Nair',
    parentNameHi: 'गोपीनाथन नायर',
    parentNameMl: 'ഗോപിനാഥൻ നായർ',
    phone: '+91 94471 78901',
    isAbsentToday: false,
    feeStatus: 'PAID',
    feeAmountInr: 0,
  },
];

// Indian School Invoices (Razorpay / NPCI UPI: kryptonfees@icici)
export const INITIAL_INVOICES: FeeInvoiceItem[] = [
  {
    id: 'INV-2026-884',
    invoiceNumber: 'INV-2026-884',
    studentId: 'std-ind-101',
    studentName: 'Aarav Menon',
    className: 'Class 8B (CBSE)',
    parentName: 'Rajesh Menon',
    parentPhone: '+91 98470 34567',
    amountInr: 14850,
    currency: 'INR',
    dueDate: '2026-10-18',
    status: 'PENDING',
    description: 'Term 1 Tuition Fee & Kakkanad School Bus Transport',
    descriptionHi: 'प्रथम सत्र शिक्षण शुल्क एवं विद्यालय बस परिवहन शुल्क',
    upiId: 'kryptonfees@icici',
    razorpayOrderId: 'order_KPS_2026_884',
  },
  {
    id: 'INV-2026-791',
    invoiceNumber: 'INV-2026-791',
    studentId: 'std-ind-102',
    studentName: 'Ananya Sharma',
    className: 'Class 10A (CBSE)',
    parentName: 'Ramesh Sharma',
    parentPhone: '+91 98471 98765',
    amountInr: 8750,
    currency: 'INR',
    dueDate: '2026-10-05',
    status: 'OVERDUE',
    description: 'CBSE Class 10 Board Exam Registration & Science Lab Kit',
    descriptionHi: 'CBSE कक्षा 10 बोर्ड परीक्षा पंजीकरण एवं विज्ञान प्रयोगशाला शुल्क',
    upiId: 'kryptonfees@icici',
    razorpayOrderId: 'order_KPS_2026_791',
  },
  {
    id: 'INV-2026-912',
    invoiceNumber: 'INV-2026-912',
    studentId: 'std-ind-104',
    studentName: 'Diya Krishnan',
    className: 'Class 7B (CBSE)',
    parentName: 'Pradeep Krishnan',
    parentPhone: '+91 98472 67890',
    amountInr: 6200,
    currency: 'INR',
    dueDate: '2026-10-25',
    status: 'PENDING',
    description: 'Term 1 Atal Tinkering Lab Robotics & Smart Classroom Facility',
    descriptionHi: 'प्रथम सत्र रोबोटिक्स लैब एवं स्मार्ट क्लासरूम सुविधा शुल्क',
    upiId: 'kryptonfees@icici',
    razorpayOrderId: 'order_KPS_2026_912',
  },
];

// Indian School Official PDF Documents
export const INITIAL_PDF_DOCUMENTS: SchoolPdfDocument[] = [
  {
    id: 'doc-rc-101',
    title: 'CBSE Holistic Progress Report Card (Term 1)',
    titleHi: 'आधिकारिक प्रगति पत्रक एवं मूल्यांकन रिपोर्ट (CBSE)',
    titleMl: 'ഔദ്യോഗിക പ്രോഗ്രസ് റിപ്പോർട്ട് കാർഡ് (CBSE)',
    type: 'REPORT_CARD',
    studentId: 'std-ind-101',
    studentName: 'Aarav Menon (Class 8B)',
    fileSizeBytes: 245000,
    pagesCount: 2,
    publishedDate: '2026-10-10',
    downloadUrl: '/documents/report-card-aarav-menon-term1.pdf',
    termOrSession: 'Term 1 Assessment 2026-27',
    summary: 'Total Marks: 462/500 (92.4%), Grade: A1, Class Rank: 3rd. Principal remark: Outstanding performance in Mathematics, Science, and Languages.',
    summaryHi: 'कुल अंक: 462/500 (92.4%), ग्रेड: A1, कक्षा स्थान: तीसरा। प्राचार्य टिप्पणी: गणित, विज्ञान और भाषाओं में उत्कृष्ट प्रदर्शन।',
    summaryMl: 'ആകെ മാർക്ക്: 462/500 (92.4%), ഗ്രേഡ്: A1, ക്ലാസ്സ് റാങ്ക്: 3. പ്രിൻസിപ്പൽ കുറിപ്പ്: ഗണിതത്തിലും ശാസ്ത്രത്തിലും മികച്ച പ്രകടനം.',
  },
  {
    id: 'doc-rec-884',
    title: 'Official UPI / Razorpay School Fee Receipt',
    titleHi: 'आधिकारिक UPI / Razorpay विद्यालय शुल्क रसीद',
    titleMl: 'ഔദ്യോഗിക UPI / Razorpay ഫീസ് രസീത്',
    type: 'FEE_RECEIPT',
    studentId: 'std-ind-101',
    studentName: 'Aarav Menon (Class 8B)',
    fileSizeBytes: 182000,
    pagesCount: 1,
    publishedDate: '2026-10-11',
    downloadUrl: '/documents/upi-receipt-aarav-menon-884.pdf',
    termOrSession: 'Term 1 Fee Receipt',
    summary: 'Paid ₹14,850 via NPCI UPI / Razorpay (UTR: UTR6284910234). Verified by Razorpay Webhook & School Accounts Office.',
    summaryHi: 'NPCI UPI / Razorpay द्वारा ₹14,850 का भुगतान सफलतापूर्वक प्राप्त (UTR: UTR6284910234)।',
    summaryMl: 'NPCI UPI / Razorpay വഴി ₹14,850 വിജയകരമായി അടച്ചു (UTR: UTR6284910234).',
  },
  {
    id: 'doc-not-cir-04',
    title: 'Official Circular: Autumn Break & Annual Sports Meet',
    titleHi: 'आधिकारिक परिपत्र: शरद अवकाश एवं वार्षिक खेल दिवस',
    titleMl: 'ഔദ്യോഗിക സർക്കുലർ: ശരത്കാല അവധിയും വാർഷിക കായികമേളയും',
    type: 'CIRCULAR_NOTICE',
    targetClass: 'All Classes (Nursery - Class 12)',
    fileSizeBytes: 310000,
    pagesCount: 3,
    publishedDate: '2026-10-09',
    downloadUrl: '/documents/school-circular-term1-break-2026.pdf',
    termOrSession: 'October 2026 Circular',
    summary: 'CBSE & Kerala school calendar updates: Autumn vacation dates, Kochi bus schedules, and inter-house athletics trials at Maharaja’s Stadium.',
    summaryHi: 'CBSE एवं विद्यालय कैलेंडर अपडेट: शरद अवकाश की तिथियां, स्कूल बस समय-सारिणी और वार्षिक खेल प्रतियोगिता।',
    summaryMl: 'സ്കൂൾ കലണ്ടർ അറിയിപ്പ്: അവധി ദിവസങ്ങൾ, ബസ് സമയം, വാർഷിക കായികമേള വിശദാംശങ്ങൾ.',
  },
];

// WhatsApp Initial Messages (English, Hindi & Malayalam)
export const INITIAL_MESSAGES: WhatsAppCloudMessage[] = [
  {
    id: 'msg-wa-001',
    tenantId: 'tenant-kps-kochi',
    recipientPhone: '+91 98470 34567',
    parentName: 'Rajesh Menon',
    studentId: 'std-ind-101',
    studentName: 'Aarav Menon',
    studentClass: 'Class 8B (CBSE)',
    type: 'ABSENCE_ALERT',
    language: 'ml',
    headerText: '🔴 സ്കൂൾ ഹാജർ അറിയിപ്പ് (Absence Alert)',
    bodyText:
      'പ്രിയ Rajesh Menon,\n\nനിങ്ങളുടെ മകൻ Aarav Menon (Class 8B, Roll: 14) ഇന്ന് രാവിലെ 8:15 AM-നുള്ള ഹാജർ പരിശോധനയിൽ ക്ലാസ്സിൽ എത്തിയിട്ടില്ലെന്ന് രേഖപ്പെടുത്തിയിട്ടുണ്ട്.\n\nകുട്ടി വീട്ടിൽ സുരക്ഷിതനാണോ എന്നും അവധിയാണെങ്കിൽ കാരണമെന്താണെന്നും ദയവായി അറിയിക്കുക.',
    footerText: 'Krypton Public School, Kochi • Meta Cloud API',
    buttons: [
      {
        type: 'QUICK_REPLY',
        text: '🤒 അസുഖം / Sick Leave',
        payload: 'REASON_SICK',
      },
      {
        type: 'QUICK_REPLY',
        text: '🚌 യാത്രാ തടസ്സം / Late',
        payload: 'REASON_TRAVEL',
      },
      {
        type: 'PHONE_NUMBER',
        text: '📞 Call School Office',
        phoneNumber: '+914842350111',
      },
    ],
    attendanceDetails: {
      date: '2026-10-11',
      rollNumber: '14',
      reportedTime: '08:15 AM',
      parentAcknowledged: false,
    },
    status: 'READ',
    sentAt: '08:20 AM',
    deliveredAt: '08:20 AM',
    readAt: '08:22 AM',
    wabaMessageId: 'wamid.HBgMOTE5ODQ3MTExMjIzFQIAERgSMzAyNjk5',
  },
  {
    id: 'msg-wa-002',
    tenantId: 'tenant-kps-kochi',
    recipientPhone: '+91 98471 98765',
    parentName: 'Ramesh Sharma',
    studentId: 'std-ind-102',
    studentName: 'Ananya Sharma',
    studentClass: 'Class 10A (CBSE)',
    type: 'FEE_PAYMENT_LINK',
    language: 'hi',
    headerText: '💳 विद्यालय शुल्क अनुस्मारक (UPI / Razorpay)',
    bodyText:
      'प्रिय Ramesh Sharma,\n\nविद्यार्थी Ananya Sharma (Class 10A) का विद्यालय शुल्क लंबित है:\n\n• चालान: INV-2026-791\n• राशि: ₹8,750\n• UPI ID: kryptonfees@icici\n• ऑर्डर ID: order_KPS_2026_791\n\nनीचे दिए गए बटन पर क्लिक करें और Google Pay, PhonePe, Paytm या BHIM UPI से तुरंत भुगतान करें।',
    footerText: 'Razorpay & NPCI UPI Gateway • Krypton Public School',
    paymentDetails: {
      invoiceId: 'INV-2026-791',
      invoiceNumber: 'INV-2026-791',
      amount: 8750,
      currency: 'INR',
      dueDate: '2026-10-05',
      paymentUrl: 'https://pay.kryptonschool.edu.in/inv/791',
      upiId: 'kryptonfees@icici',
      razorpayOrderId: 'order_KPS_2026_791',
      paymentMethod: 'UPI',
      status: 'OVERDUE',
    },
    buttons: [
      {
        type: 'URL',
        text: '⚡ Pay ₹8,750 via UPI / Razorpay',
        url: 'https://pay.kryptonschool.edu.in/upi/pay/791',
      },
      {
        type: 'URL',
        text: '📄 View Fee Breakdown',
        url: 'https://pay.kryptonschool.edu.in/inv/791',
      },
    ],
    status: 'READ',
    sentAt: '08:30 AM',
    deliveredAt: '08:30 AM',
    readAt: '08:32 AM',
    wabaMessageId: 'wamid.HBgMOTE5ODQ3MjIyMzM0FQIAERgSMzAyNzAx',
  },
  {
    id: 'msg-wa-003',
    tenantId: 'tenant-kps-kochi',
    recipientPhone: '+91 98470 34567',
    parentName: 'Rajesh Menon',
    studentId: 'std-ind-101',
    studentName: 'Aarav Menon',
    studentClass: 'Class 8B (CBSE)',
    type: 'REPORT_CARD_PDF',
    language: 'en',
    headerText: '🎓 Official Progress Report Card (PDF)',
    bodyText:
      'Dear Rajesh Menon,\n\nThe official CBSE Term 1 Progress Report Card for Aarav Menon (Class 8B) is attached below.\n\n📊 Score: 462/500 (92.4% - Grade A1)\n🏆 Class Rank: 3rd\n\nDownload and save the verified PDF directly here on WhatsApp.',
    attachment: {
      type: 'DOCUMENT',
      filename: 'Report_Card_Aarav_Menon_Term1.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 245000,
      url: '/documents/report-card-aarav-menon-term1.pdf',
      caption: 'CBSE Term 1 Holistic Progress Report 2026-27',
    },
    pdfDetails: {
      documentId: 'doc-rc-101',
      documentTitle: 'CBSE Holistic Progress Report Card (Term 1)',
      documentType: 'REPORT_CARD',
      termOrPeriod: 'Term 1 Assessment 2026-27',
      downloadUrl: '/documents/report-card-aarav-menon-term1.pdf',
      pagesCount: 2,
    },
    footerText: 'Signed by Principal • Krypton Public School, Kochi',
    buttons: [
      {
        type: 'URL',
        text: '📥 Download Report PDF (245 KB)',
        url: '/documents/report-card-aarav-menon-term1.pdf',
      },
      {
        type: 'QUICK_REPLY',
        text: '👍 Acknowledged',
        payload: 'ACK_REPORT_CARD',
      },
    ],
    status: 'READ',
    sentAt: '08:40 AM',
    deliveredAt: '08:40 AM',
    readAt: '08:42 AM',
    wabaMessageId: 'wamid.HBgMOTE5ODQ3MTExMjIzFQIAERgSMzAyNzAy',
  },
];

class WhatsAppClientStore {
  private messages: WhatsAppCloudMessage[] = [...INITIAL_MESSAGES];
  private students: StudentParentContact[] = [...INITIAL_STUDENTS];
  private invoices: FeeInvoiceItem[] = [...INITIAL_INVOICES];
  private pdfDocuments: SchoolPdfDocument[] = [...INITIAL_PDF_DOCUMENTS];
  private config: WhatsAppAutomationConfig = {
    activeProvider: 'META_CLOUD_API',
    freePlayschoolMode: false,
    defaultCountryCode: '91',
    wabaId: 'WABA_919847000111',
    phoneNumberId: 'PNID_919847000111',
    displayPhoneNumber: '+91 98470 00111',
    businessName: 'Krypton Public School, Kochi (Official)',
    apiTokenConfigured: true,
    webhookVerified: true,
    morningAbsenceTriggerTime: '08:30 AM',
    autoFeeReminderDaysBeforeDue: 3,
    autoPdfDeliveryEnabled: true,
    defaultLanguage: 'en',
    metaConfig: {
      wabaId: 'WABA_919847000111',
      phoneNumberId: 'PNID_919847000111',
      accessToken: '',
      apiVersion: 'v19.0',
      webhookVerifyToken: 'krypton_whatsapp_verify_token',
    },
    twilioConfig: {
      accountSid: '',
      authToken: '',
      whatsappNumber: 'whatsapp:+14155238886',
    },
    gupshupConfig: {
      apiKey: '',
      appName: '',
      sourceNumber: '919847000111',
    },
  };

  private readonly STORAGE_KEY = 'krypton_whatsapp_gateway_config_v1';

  constructor() {
    this.hydrateConfig();
  }

  private hydrateConfig() {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = {
          ...this.config,
          ...parsed,
          metaConfig: { ...this.config.metaConfig, ...(parsed.metaConfig || {}) },
          twilioConfig: { ...this.config.twilioConfig, ...(parsed.twilioConfig || {}) },
          gupshupConfig: { ...this.config.gupshupConfig, ...(parsed.gupshupConfig || {}) },
        };
      }
    } catch {
      // Ignore storage errors
    }
  }

  getMessages(): WhatsAppCloudMessage[] {
    return [...this.messages];
  }

  getStudents(): StudentParentContact[] {
    return [...this.students];
  }

  getInvoices(): FeeInvoiceItem[] {
    return [...this.invoices];
  }

  getPdfDocuments(): SchoolPdfDocument[] {
    return [...this.pdfDocuments];
  }

  getConfig(): WhatsAppAutomationConfig {
    return {
      ...this.config,
      metaConfig: this.config.metaConfig ? { ...this.config.metaConfig } : undefined,
      twilioConfig: this.config.twilioConfig ? { ...this.config.twilioConfig } : undefined,
      gupshupConfig: this.config.gupshupConfig ? { ...this.config.gupshupConfig } : undefined,
    };
  }

  updateConfig(partial: Partial<WhatsAppAutomationConfig>): WhatsAppAutomationConfig {
    this.config = {
      ...this.config,
      ...partial,
      metaConfig: partial.metaConfig
        ? { ...(this.config.metaConfig || { wabaId: '', phoneNumberId: '' }), ...partial.metaConfig }
        : this.config.metaConfig,
      twilioConfig: partial.twilioConfig
        ? { ...(this.config.twilioConfig || { accountSid: '', whatsappNumber: '' }), ...partial.twilioConfig }
        : this.config.twilioConfig,
      gupshupConfig: partial.gupshupConfig
        ? { ...(this.config.gupshupConfig || { appName: '', sourceNumber: '' }), ...partial.gupshupConfig }
        : this.config.gupshupConfig,
    };
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
      } catch {
        // Ignore storage quota errors
      }
    }
    return this.getConfig();
  }

  /**
   * Zero-Cost Play-School Mode: Build direct Click-to-Chat WhatsApp Web / Mobile links (wa.me)
   */
  buildWhatsAppWebLink(
    phone: string,
    messageText: string,
    defaultCountryCode?: string,
  ): WhatsAppWebLink {
    const cc = (defaultCountryCode || this.config.defaultCountryCode || '91').replace(/[^\d]/g, '');
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('0')) {
      cleaned = cc + cleaned.substring(1);
    } else if (cleaned.length === 10) {
      cleaned = cc + cleaned;
    }

    const encodedMessage = encodeURIComponent(messageText);
    return {
      waMeUrl: `https://wa.me/${cleaned}?text=${encodedMessage}`,
      webWhatsAppUrl: `https://web.whatsapp.com/send?phone=${cleaned}&text=${encodedMessage}`,
      phone: `+${cleaned}`,
      encodedMessage,
      previewText: messageText,
    };
  }

  /**
   * Generate ready-to-open WhatsApp Web link for a student's absence alert
   */
  getAbsenteeWhatsAppWebLink(
    studentId: string,
    language: WhatsAppLanguage = 'en',
  ): { student: StudentParentContact; link: WhatsAppWebLink } {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let bodyText = `🔴 *School Absence Alert*\n\nDear Parent (${student.parentName}),\n\nYour child *${student.name}* (${student.className}, Roll: ${student.rollNumber}) has been marked *ABSENT* today during morning roll call at ${currentTime}.\n\nPlease ensure your child is safe and reply with the reason for absence.\n\n- ${this.config.businessName}`;

    if (language === 'ml') {
      bodyText = `🔴 *സ്കൂൾ ഹാജർ അറിയിപ്പ് (Absence Alert)*\n\nപ്രിയ രക്ഷിതാവേ (${student.parentNameMl || student.parentName}),\n\nനിങ്ങളുടെ കുട്ടി *${student.nameMl || student.name}* (${student.className}, റോൾ നമ്പർ: ${student.rollNumber}) ഇന്ന് രാവിലെ ${currentTime}-നുള്ള ഹാജർ നിലയിൽ എത്തിയിട്ടില്ലെന്ന് രേഖപ്പെടുത്തിയിട്ടുണ്ട്.\n\nകുട്ടി സുരക്ഷിതമാണെന്ന് ഉറപ്പുവരുത്തുകയും അവധി കാരണം മറുപടിയായി അറിയിക്കുകയും ചെയ്യുക.\n\n- ${this.config.businessName}`;
    } else if (language === 'hi') {
      bodyText = `🔴 *विद्यालय उपस्थिति सूचना (Absence Alert)*\n\nप्रिय अभिभावक (${student.parentNameHi || student.parentName}),\n\nआपका बच्चा *${student.nameHi || student.name}* (${student.className}, रोल नं: ${student.rollNumber}) आज सुबह ${currentTime} बजे की उपस्थिति में अनुपस्थित दर्ज किया गया है।\n\nकृपया बच्चे की सुरक्षा सुनिश्चित करें और अनुपस्थिति का कारण बताएं।\n\n- ${this.config.businessName}`;
    }

    return {
      student,
      link: this.buildWhatsAppWebLink(student.phone, bodyText),
    };
  }

  /**
   * Generate ready-to-open WhatsApp Web link for a student's fee reminder with UPI details
   */
  getFeeReminderWhatsAppWebLink(
    invoiceId: string,
    language: WhatsAppLanguage = 'en',
  ): { invoice: FeeInvoiceItem; link: WhatsAppWebLink } {
    const invoice = this.invoices.find((i) => i.id === invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const amountFormatted = `₹${invoice.amountInr.toLocaleString('en-IN')}`;
    const paymentLink = `https://pay.kryptonschool.edu.in/upi/pay/${invoice.invoiceNumber}`;

    let bodyText = `💳 *School Fee Reminder*\n\nDear ${invoice.parentName},\n\nFee reminder for *${invoice.studentName}* (${invoice.className}).\n\n• Invoice No: ${invoice.invoiceNumber}\n• Details: ${invoice.description}\n• Amount Due: *${amountFormatted}*\n• Due Date: ${invoice.dueDate}\n• UPI ID: ${invoice.upiId}\n\n⚡ Quick Pay Link: ${paymentLink}\n\nThank you,\n${this.config.businessName}`;

    if (language === 'ml') {
      bodyText = `💳 *സ്കൂൾ ഫീസ് ഓർമ്മപ്പെടുത്തൽ*\n\nപ്രിയ ${invoice.parentName},\n\n*${invoice.studentName}* (${invoice.className}) എന്ന വിദ്യാർത്ഥിയുടെ ഫീസ് വിവരങ്ങൾ:\n\n• ഇൻവോയ്സ് നമ്പർ: ${invoice.invoiceNumber}\n• അടയ്ക്കേണ്ട തുക: *${amountFormatted}*\n• അവസാന തീയതി: ${invoice.dueDate}\n• UPI ID: ${invoice.upiId}\n\n⚡ യു.പി.ഐ പേയ്‌മെന്റ് ലിങ്ക്:\n${paymentLink}\n\nഗൂഗിൾ പേ, ഫോൺപേ വഴി ഉടൻ പണമടയ്ക്കാവുന്നതാണ്.\nനന്ദി,\n${this.config.businessName}`;
    } else if (language === 'hi') {
      bodyText = `💳 *विद्यालय शुल्क अनुस्मारक*\n\nप्रिय ${invoice.parentName},\n\n*${invoice.studentName}* (${invoice.className}) के विद्यालय शुल्क का विवरण:\n\n• चालान संख्या: ${invoice.invoiceNumber}\n• बकाया राशि: *${amountFormatted}*\n• अंतिम तिथि: ${invoice.dueDate}\n• UPI ID: ${invoice.upiId}\n\n⚡ तुरंत भुगतान लिंक:\n${paymentLink}\n\nधन्यवाद,\n${this.config.businessName}`;
    }

    return {
      invoice,
      link: this.buildWhatsAppWebLink(invoice.parentPhone, bodyText),
    };
  }

  /**
   * Generate ready-to-open WhatsApp Web link for sharing a school PDF document
   */
  getPdfWhatsAppWebLink(
    documentId: string,
    language: WhatsAppLanguage = 'en',
  ): { doc: SchoolPdfDocument; link: WhatsAppWebLink } {
    const doc = this.pdfDocuments.find((d) => d.id === documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    const docUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${doc.downloadUrl}`
        : `https://school.krypton.edu.in${doc.downloadUrl}`;

    let bodyText = `📄 *${doc.title}*\n\nDear Parent,\n\n${doc.summary}\n\n📥 Download Document: ${docUrl}\n\n- ${this.config.businessName}`;

    if (language === 'ml') {
      bodyText = `📄 *${doc.titleMl || doc.title}*\n\nപ്രിയ രക്ഷിതാവേ,\n\n${doc.summaryMl || doc.summary}\n\n📥 ഡോക്യുമെന്റ് ഡൗൺലോഡ് ലിങ്ക്: ${docUrl}\n\n- ${this.config.businessName}`;
    } else if (language === 'hi') {
      bodyText = `📄 *${doc.titleHi || doc.title}*\n\nप्रिय अभिभावक,\n\n${doc.summaryHi || doc.summary}\n\n📥 दस्तावेज़ डाउनलोड लिंक: ${docUrl}\n\n- ${this.config.businessName}`;
    }

    return {
      doc,
      link: this.buildWhatsAppWebLink('+91 98470 34567', bodyText),
    };
  }

  /**
   * Query live backend WhatsApp gateway status
   */
  async fetchBackendGatewayStatus(): Promise<{
    reachable: boolean;
    available: boolean;
    liveGatewayConfigured: boolean;
    activeProvider: WhatsAppGatewayProvider;
    configuredProviders: WhatsAppGatewayProvider[];
    message?: string;
  }> {
    try {
      const resp = await fetch('/api/whatsapp/status', { cache: 'no-store' });
      if (!resp.ok) {
        return {
          reachable: false,
          available: true,
          liveGatewayConfigured: false,
          activeProvider: this.config.activeProvider,
          configuredProviders: ['WHATSAPP_WEB'],
          message: 'Backend API offline; using local WhatsApp Web & simulator controls.',
        };
      }
      const data = await resp.json();
      return {
        reachable: true,
        available: !!data.available,
        liveGatewayConfigured: !!data.liveGatewayConfigured,
        activeProvider: data.activeProvider || this.config.activeProvider,
        configuredProviders: data.configuredProviders || ['WHATSAPP_WEB'],
        message: data.message,
      };
    } catch {
      return {
        reachable: false,
        available: true,
        liveGatewayConfigured: false,
        activeProvider: this.config.activeProvider,
        configuredProviders: ['WHATSAPP_WEB'],
        message: 'Backend API unreachable; Zero-Cost WhatsApp Web mode ready directly in browser.',
      };
    }
  }

  /**
   * Dispatch a live message via Backend API (Meta Cloud API / Gupshup / Twilio) or WhatsApp Web link
   */
  async dispatchLiveMessage(
    to: string,
    message: string,
    options?: {
      mediaUrl?: string;
      provider?: WhatsAppGatewayProvider;
    },
  ): Promise<WhatsAppLiveDispatchResult> {
    const provider = options?.provider || this.config.activeProvider;

    if (provider === 'WHATSAPP_WEB') {
      const waLink = this.buildWhatsAppWebLink(to, message);
      return {
        success: true,
        provider: 'WHATSAPP_WEB',
        messageId: `wa_web_${Date.now()}`,
        status: 'READY_TO_OPEN',
        waLink,
      };
    }

    try {
      const resp = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          message,
          mediaUrl: options?.mediaUrl,
          provider,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        return {
          success: false,
          provider,
          status: 'FAILED',
          error: data?.message || `Live API returned HTTP ${resp.status}`,
        };
      }
      return {
        success: true,
        provider: data.provider || provider,
        messageId: data.messageId,
        status: data.status || 'SENT',
        waLink: data.waLink,
      };
    } catch (error: any) {
      return {
        success: false,
        provider,
        status: 'FAILED',
        error: error?.message || 'Unable to connect to live WhatsApp backend.',
      };
    }
  }

  /**
   * Test live provider credentials through backend endpoint
   */
  async testProviderConnection(payload: {
    provider: WhatsAppGatewayProvider;
    testPhone?: string;
    testMessage?: string;
    metaAccessToken?: string;
    metaPhoneNumberId?: string;
    metaWabaId?: string;
    metaApiVersion?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioWhatsappNumber?: string;
    gupshupApiKey?: string;
    gupshupAppName?: string;
    gupshupSourceNumber?: string;
  }): Promise<{
    success: boolean;
    provider: WhatsAppGatewayProvider;
    message: string;
    waLink?: WhatsAppWebLink;
  }> {
    if (payload.provider === 'WHATSAPP_WEB') {
      const waLink = this.buildWhatsAppWebLink(
        payload.testPhone || '+919847034567',
        payload.testMessage ||
          `✅ Hello! Test message from ${this.config.businessName} using Zero-Cost WhatsApp Web Mode (No API fees).`,
      );
      return {
        success: true,
        provider: 'WHATSAPP_WEB',
        message: 'WhatsApp Web link generated! Click to open directly in WhatsApp.',
        waLink,
      };
    }

    try {
      const resp = await fetch('/api/whatsapp/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      return {
        success: !!data.success,
        provider: payload.provider,
        message: data.message || (data.success ? 'Verified successfully' : 'Verification failed'),
        waLink: data.result?.waLink,
      };
    } catch (error: any) {
      return {
        success: false,
        provider: payload.provider,
        message:
          error?.message ||
          'Backend server is not reachable. Ensure apps/api is running on port 3001 to verify live credentials.',
      };
    }
  }

  getStats(): WhatsAppAutomationStats {
    const totalSent = this.messages.length;
    const totalDelivered = this.messages.filter((m) => ['DELIVERED', 'READ', 'REPLIED'].includes(m.status)).length;
    const totalRead = this.messages.filter((m) => ['READ', 'REPLIED'].includes(m.status)).length;
    const openRatePercentage = totalDelivered > 0 ? Number(((totalRead / totalDelivered) * 100).toFixed(1)) : 98.6;

    const paidInvoices = this.invoices.filter((i) => i.status === 'PAID');
    const paymentCollected = paidInvoices.reduce((acc, curr) => acc + curr.amountInr, 0);

    return {
      totalSentToday: totalSent + 185,
      totalDelivered: totalDelivered + 182,
      totalRead: totalRead + 180,
      openRatePercentage: 98.9,
      paymentConversionsCount: paidInvoices.length + 42,
      paymentCollectedAmount: paymentCollected + 420000, // in INR
      pdfDownloadsCount: 215,
      avgReadTimeMinutes: 2.4,
    };
  }

  // Feature 1: Trigger Absentee Notifications (India Context)
  sendAbsenteeAlert(studentId: string, language: WhatsAppLanguage = 'en'): WhatsAppCloudMessage {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    const isHi = language === 'hi';
    const isMl = language === 'ml';
    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    let header = '🔴 School Absence Alert';
    let bodyText = `Dear Parent (${student.parentName}),\n\nYour child ${student.name} (${student.className}, Roll: ${student.rollNumber}) has been marked ABSENT today during morning roll call at ${currentTime}.\n\nPlease ensure your child is safe. If this is an unexpected absence, please contact the school administration immediately.`;
    let sickBtn = '🤒 Sick Leave';
    let busBtn = '🚌 Transport Delay';
    let callBtn = '📞 Call School Office';

    if (isHi) {
      header = '🔴 विद्यालय उपस्थिति सूचना (Absence Alert)';
      bodyText = `प्रिय अभिभावक (${student.parentName}),\n\nआपका बच्चा ${student.name} (${student.className}, Roll: ${student.rollNumber}) आज सुबह ${currentTime} बजे की उपस्थिति में अनुपस्थित दर्ज किया गया है।\n\nकृपया बच्चे की सुरक्षा सुनिश्चित करें और अनुपस्थिति का कारण बताएं।`;
      sickBtn = '🤒 अस्वस्थ / Sick Leave';
      busBtn = '🚌 बस विलंब / Late';
      callBtn = '📞 विद्यालय कार्यालय';
    } else if (isMl) {
      header = '🔴 സ്കൂൾ ഹാജർ അറിയിപ്പ് (Absence Alert)';
      bodyText = `പ്രിയ രക്ഷിതാവേ (${student.parentName}), നിങ്ങളുടെ കുട്ടി ${student.name} (${student.className}, Roll: ${student.rollNumber}) ഇന്ന് രാവിലത്തെ ഹാജർ നിലയിൽ എത്തിയിട്ടില്ലെന്ന് രേഖപ്പെടുത്തിയിട്ടുണ്ട്. കുട്ടി സുരക്ഷിതമാണെന്ന് ഉറപ്പുവരുത്തുക.`;
      sickBtn = '🤒 അസുഖം / Sick Leave';
      busBtn = '🚌 യാത്രാ തടസ്സം / Late';
      callBtn = '📞 സ്കൂളുമായി ബന്ധപ്പെടുക';
    }

    const newMsg: WhatsAppCloudMessage = {
      id: `msg-wa-${Date.now()}`,
      tenantId: 'tenant-kps-kochi',
      recipientPhone: student.phone,
      parentName: student.parentName,
      studentId: student.id,
      studentName: student.name,
      studentClass: student.className,
      type: 'ABSENCE_ALERT',
      language,
      headerText: header,
      bodyText,
      footerText: 'Krypton Public School, Kochi • Meta Cloud API',
      buttons: [
        {
          type: 'QUICK_REPLY',
          text: sickBtn,
          payload: 'REASON_SICK',
        },
        {
          type: 'QUICK_REPLY',
          text: busBtn,
          payload: 'REASON_TRAVEL',
        },
        {
          type: 'PHONE_NUMBER',
          text: callBtn,
          phoneNumber: '+914842350111',
        },
      ],
      attendanceDetails: {
        date: new Date().toISOString().split('T')[0],
        rollNumber: student.rollNumber,
        reportedTime: currentTime,
        parentAcknowledged: false,
      },
      status: 'READ',
      sentAt: currentTime,
      deliveredAt: currentTime,
      readAt: currentTime,
      wabaMessageId: `wamid.HBgM${Date.now()}`,
    };

    this.messages.unshift(newMsg);
    return newMsg;
  }

  // Feature 2: Trigger 1-Click Fee Payment Link (UPI / Razorpay)
  sendFeeReminder(invoiceId: string, language: WhatsAppLanguage = 'en'): WhatsAppCloudMessage {
    const invoice = this.invoices.find((i) => i.id === invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const isHi = language === 'hi';
    const isMl = language === 'ml';
    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    let header = '💳 School Fee Reminder (UPI / Razorpay)';
    let bodyText = `Dear ${invoice.parentName},\n\nFee due reminder for ${invoice.studentName} (${invoice.className}).\n\n• Invoice No: ${invoice.invoiceNumber}\n• Description: ${invoice.description}\n• Amount Due: ₹${invoice.amountInr.toLocaleString('en-IN')}\n• Due Date: ${invoice.dueDate}\n• UPI ID: ${invoice.upiId}\n• Order ID: ${invoice.razorpayOrderId}\n\nTap Pay via UPI below to complete payment using Google Pay, PhonePe, Paytm, or BHIM.`;
    let payBtnText = `⚡ Pay ₹${invoice.amountInr.toLocaleString('en-IN')} via UPI / Razorpay`;
    let viewBtnText = '📄 View Fee Breakdown';

    if (isHi) {
      header = '💳 विद्यालय शुल्क अनुस्मारक (UPI / Razorpay)';
      bodyText = `प्रिय ${invoice.parentName},\n\n${invoice.studentName} (${invoice.className}) के विद्यालय शुल्क का विवरण:\n\n• चालान संख्या: ${invoice.invoiceNumber}\n• विवरण: ${invoice.descriptionHi || invoice.description}\n• बकाया राशि: ₹${invoice.amountInr.toLocaleString('en-IN')}\n• अंतिम तिथि: ${invoice.dueDate}\n• UPI ID: ${invoice.upiId}\n\nGoogle Pay, PhonePe या Paytm से तुरंत भुगतान करने के लिए नीचे क्लिक करें।`;
      payBtnText = `⚡ ₹${invoice.amountInr.toLocaleString('en-IN')} UPI से भुगतान करें`;
      viewBtnText = '📄 चालान विवरण देखें';
    } else if (isMl) {
      header = '💳 സ്കൂൾ ഫീ പേയ്‌മെന്റ് റിമൈൻഡർ (UPI / Razorpay)';
      bodyText = `പ്രിയ ${invoice.parentName}, ${invoice.studentName} (${invoice.className}) യുടെ സ്കൂൾ ഫീസ് ₹${invoice.amountInr.toLocaleString('en-IN')} UPI / Razorpay വഴി അടയ്ക്കാൻ താഴെയുള്ള ബട്ടൺ ക്ലിക്ക് ചെയ്യുക. UPI: ${invoice.upiId}, Inv: ${invoice.invoiceNumber}.`;
      payBtnText = `⚡ Pay ₹${invoice.amountInr.toLocaleString('en-IN')} via UPI`;
      viewBtnText = '📄 ഇൻവോയ്സ് വിവരങ്ങൾ';
    }

    const newMsg: WhatsAppCloudMessage = {
      id: `msg-wa-${Date.now()}`,
      tenantId: 'tenant-kps-kochi',
      recipientPhone: invoice.parentPhone,
      parentName: invoice.parentName,
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      studentClass: invoice.className,
      type: 'FEE_PAYMENT_LINK',
      language,
      headerText: header,
      bodyText,
      footerText: 'Razorpay & NPCI UPI Gateway • Instant Receipt',
      paymentDetails: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amountInr,
        currency: 'INR',
        dueDate: invoice.dueDate,
        paymentUrl: `https://pay.kryptonschool.edu.in/inv/${invoice.invoiceNumber}`,
        paymentMethod: 'UPI',
        upiId: invoice.upiId,
        razorpayOrderId: invoice.razorpayOrderId,
        status: invoice.status,
      },
      buttons: [
        {
          type: 'URL',
          text: payBtnText,
          url: `https://pay.kryptonschool.edu.in/upi/pay/${invoice.invoiceNumber}`,
        },
        {
          type: 'URL',
          text: viewBtnText,
          url: `https://pay.kryptonschool.edu.in/inv/${invoice.invoiceNumber}`,
        },
      ],
      status: 'READ',
      sentAt: currentTime,
      deliveredAt: currentTime,
      readAt: currentTime,
      wabaMessageId: `wamid.HBgM${Date.now()}`,
    };

    this.messages.unshift(newMsg);
    return newMsg;
  }

  // Feature 3: Digital PDF Delivery (CBSE Report Card, UPI Receipt, Circular)
  sendPdfDelivery(documentId: string, language: WhatsAppLanguage = 'en'): WhatsAppCloudMessage {
    const doc = this.pdfDocuments.find((d) => d.id === documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    const isHi = language === 'hi';
    const isMl = language === 'ml';
    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    let header = '';
    let bodyText = '';
    const recipientPhone = '+91 98470 34567';
    const parentName = 'Rajesh Menon';
    const studentName = 'Aarav Menon';
    const studentClass = 'Class 8B (CBSE)';
    const studentId = 'std-ind-101';
    let msgType: WhatsAppMessageType = 'REPORT_CARD_PDF';

    if (doc.type === 'REPORT_CARD') {
      msgType = 'REPORT_CARD_PDF';
      if (isHi) {
        header = '🎓 आधिकारिक प्रगति पत्रक (CBSE PDF)';
        bodyText = `प्रिय ${parentName},\n\n${studentName} का सत्र-1 प्रगति पत्रक (CBSE Assessment) संलग्न है।\n\n${doc.summaryHi || doc.summary}\n\nआप सीधे WhatsApp से सत्यापित PDF डाउनलोड कर सकते हैं।`;
      } else if (isMl) {
        header = '🎓 പരീക്ഷാ ഫല പ്രോഗ്രസ് കാർഡ് (PDF)';
        bodyText = `പ്രിയ ${parentName},\n\n${studentName} ന്റെ ഔദ്യോഗിക പരീക്ഷാ ഫലം (PDF) താഴെ നൽകുന്നു.\n\n${doc.summaryMl || doc.summary}`;
      } else {
        header = '🎓 Official Progress Report Card (PDF)';
        bodyText = `Dear ${parentName},\n\nOfficial Term 1 Progress Report Card for ${studentName} is attached below.\n\n${doc.summary}\n\nYou can download and save the verified signed document directly from WhatsApp.`;
      }
    } else if (doc.type === 'FEE_RECEIPT') {
      msgType = 'FEE_RECEIPT_PDF';
      if (isHi) {
        header = '🧾 आधिकारिक UPI शुल्क रसीद (Verified PDF)';
        bodyText = `प्रिय ${parentName},\n\n${studentName} का विद्यालय शुल्क भुगतान UPI / Razorpay द्वारा सफलतापूर्वक प्राप्त हो गया है। सत्यापित रसीद संलग्न है।\n\n${doc.summaryHi || doc.summary}`;
      } else if (isMl) {
        header = '🧾 UPI / Razorpay ഫീ റെസീപ്റ്റ് (Official PDF)';
        bodyText = `പ്രിയ ${parentName},\n\n${studentName} ന്റെ UPI ഫീ പേയ്‌മെന്റ് വിജയകരമായി സ്വീകരിച്ചു. ഔദ്യോഗിക രസീത് PDF താഴെ ഡൗൺലോഡ് ചെയ്യാം.\n\n${doc.summaryMl || doc.summary}`;
      } else {
        header = '🧾 Official UPI / Razorpay Fee Receipt (PDF)';
        bodyText = `Dear ${parentName},\n\nUPI fee payment received successfully for ${studentName}. Your official verified PDF fee receipt is attached.\n\n${doc.summary}`;
      }
    } else {
      msgType = 'SCHOOL_NOTICE_PDF';
      if (isHi) {
        header = '📢 आधिकारिक विद्यालय सूचना (Notice PDF)';
        bodyText = `प्रिय अभिभावक,\n\nविद्यालय प्रशासन की महत्वपूर्ण सूचना: ${doc.titleHi || doc.title}.\n\n${doc.summaryHi || doc.summary}`;
      } else if (isMl) {
        header = '📢 സ്കൂൾ നോട്ടീസ് & സർക്കുലർ (PDF)';
        bodyText = `പ്രിയ രക്ഷിതാവേ, സ്കൂൾ നോട്ടീസ് താഴെ നൽകുന്നു: ${doc.titleMl || doc.title}.\n\n${doc.summaryMl || doc.summary}`;
      } else {
        header = '📢 Official School Notice (PDF)';
        bodyText = `Dear Parent,\n\nOfficial circular from the School Administration: ${doc.title}.\n\n${doc.summary}\n\nPlease download and review the official notice.`;
      }
    }

    const newMsg: WhatsAppCloudMessage = {
      id: `msg-wa-${Date.now()}`,
      tenantId: 'tenant-kps-kochi',
      recipientPhone,
      parentName,
      studentId,
      studentName,
      studentClass,
      type: msgType,
      language,
      headerText: header,
      bodyText,
      footerText: 'Krypton Public School, Kochi • Official Verified PDF',
      attachment: {
        type: 'DOCUMENT',
        filename: `${doc.title.replace(/\s+/g, '_')}.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: doc.fileSizeBytes,
        url: doc.downloadUrl,
        caption: isHi ? (doc.titleHi || doc.title) : isMl ? (doc.titleMl || doc.title) : doc.title,
      },
      pdfDetails: {
        documentId: doc.id,
        documentTitle: doc.title,
        documentType: doc.type,
        termOrPeriod: doc.termOrSession,
        downloadUrl: doc.downloadUrl,
        pagesCount: doc.pagesCount,
      },
      buttons: [
        {
          type: 'URL',
          text: `📥 ${isHi ? 'PDF डाउनलोड करें' : isMl ? 'Download PDF' : 'Download PDF'} (${(doc.fileSizeBytes / 1024).toFixed(0)} KB)`,
          url: doc.downloadUrl,
        },
        {
          type: 'QUICK_REPLY',
          text: isHi ? '✅ प्राप्त हुआ' : isMl ? '✅ കണ്ടു / Acknowledged' : '✅ Acknowledged',
          payload: 'ACK_PDF',
        },
      ],
      status: 'READ',
      sentAt: currentTime,
      deliveredAt: currentTime,
      readAt: currentTime,
      wabaMessageId: `wamid.HBgM${Date.now()}`,
    };

    this.messages.unshift(newMsg);
    return newMsg;
  }

  // Interactive Simulator Action: Parent completes UPI payment or clicks quick reply
  simulateParentAction(
    messageId: string,
    action: 'LEAVE_REASON' | 'PAY_FEE' | 'ACKNOWLEDGE',
    payloadValue?: string,
  ): { success: boolean; feedbackMessage: string; followUpMessage?: WhatsAppCloudMessage } {
    const msg = this.messages.find((m) => m.id === messageId);
    if (!msg) {
      return { success: false, feedbackMessage: 'Message not found' };
    }

    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    if (action === 'LEAVE_REASON') {
      if (msg.attendanceDetails) {
        msg.attendanceDetails.parentAcknowledged = true;
        msg.attendanceDetails.reason = payloadValue || 'Medical / Sick Leave';
        msg.attendanceDetails.acknowledgedAt = currentTime;
      }
      msg.status = 'REPLIED';

      // Auto-reply confirmation from school bot in Hindi/Malayalam/English
      const followUp: WhatsAppCloudMessage = {
        id: `msg-wa-${Date.now()}`,
        tenantId: 'tenant-kps-kochi',
        recipientPhone: msg.recipientPhone,
        parentName: msg.parentName,
        studentId: msg.studentId,
        studentName: msg.studentName,
        studentClass: msg.studentClass,
        type: 'CUSTOM_ANNOUNCEMENT',
        language: msg.language,
        headerText:
          msg.language === 'hi'
            ? '✅ अनुपस्थिति सूचना दर्ज हो गई है'
            : msg.language === 'ml'
            ? '✅ അവധി കാരണം രേഖപ്പെടുത്തി'
            : '✅ Leave Reason Acknowledged',
        bodyText:
          msg.language === 'hi'
            ? `धन्यवाद ${msg.parentName}। ${msg.studentName} की अनुपस्थिति का कारण ("${payloadValue || 'चिकित्सा अवकाश'}") विद्यालय रिकॉर्ड में दर्ज कर लिया गया है और कक्षा अध्यापक को सूचित कर दिया गया है।`
            : msg.language === 'ml'
            ? `നന്ദി ${msg.parentName}. ${msg.studentName}-ന്റെ അവധി കാരണം ("${payloadValue || 'ചികിത്സാ അവധി'}") സ്കൂൾ രജിസ്റ്ററിൽ രേഖപ്പെടുത്തി ക്ലാസ്സ് ടീച്ചറെ അറിയിച്ചിട്ടുണ്ട്.`
            : `Thank you ${msg.parentName}. The absence reason for ${msg.studentName} ("${payloadValue || 'Medical Leave'}") has been logged into the school portal and the class teacher has been notified.`,
        footerText: 'Krypton Public School Automated Desk',
        status: 'READ',
        sentAt: currentTime,
        deliveredAt: currentTime,
        readAt: currentTime,
        wabaMessageId: `wamid.HBgM${Date.now()}`,
      };
      this.messages.unshift(followUp);

      return {
        success: true,
        feedbackMessage: 'Absence reason updated in school register!',
        followUpMessage: followUp,
      };
    }

    if (action === 'PAY_FEE') {
      const utrRef = `UTR${Math.floor(100000 + Math.random() * 900000)}`;
      if (msg.paymentDetails) {
        msg.paymentDetails.status = 'PAID';
        msg.paymentDetails.paidAt = currentTime;
        msg.paymentDetails.transactionId = utrRef;
        msg.paymentDetails.utrNumber = utrRef;
        msg.paymentDetails.paymentReceiptNumber = `RCPT-IN-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      msg.status = 'REPLIED';

      // Update invoice in store
      const inv = this.invoices.find((i) => i.id === msg.paymentDetails?.invoiceId);
      if (inv) {
        inv.status = 'PAID';
        inv.paidAt = currentTime;
        inv.transactionId = utrRef;
        inv.utrNumber = utrRef;
      }

      // Generate & auto-deliver official PDF UPI Receipt
      const receiptDoc = this.pdfDocuments.find((d) => d.type === 'FEE_RECEIPT') || this.pdfDocuments[1];
      const followUpReceipt = this.sendPdfDelivery(receiptDoc.id, msg.language);

      return {
        success: true,
        feedbackMessage: `UPI payment of ₹${msg.paymentDetails?.amount.toLocaleString('en-IN')} settled (Ref: ${utrRef})! Verified PDF receipt dispatched on WhatsApp.`,
        followUpMessage: followUpReceipt,
      };
    }

    if (action === 'ACKNOWLEDGE') {
      msg.status = 'REPLIED';
      return {
        success: true,
        feedbackMessage: 'Document receipt acknowledged by parent.',
      };
    }

    return { success: true, feedbackMessage: 'Updated' };
  }
}

export const whatsAppClient = new WhatsAppClientStore();
