import {
  WhatsAppCloudMessage,
  WhatsAppAutomationConfig,
  WhatsAppAutomationStats,
  WhatsAppDeliveryStatus,
  WhatsAppMessageType,
  WhatsAppLanguage,
} from '@krypton/types';

export interface StudentParentContact {
  id: string;
  admissionNo: string;
  name: string;
  nameSw?: string;
  className: string;
  rollNumber: string;
  parentName: string;
  parentNameSw?: string;
  phone: string; // Kenyan format: +254 7XX XXX XXX
  isAbsentToday: boolean;
  absentReportedTime?: string;
  feeStatus: 'PAID' | 'DUE' | 'OVERDUE';
  feeAmountKsh: number;
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
  amountKsh: number;
  currency: 'KES';
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  description: string;
  descriptionSw: string;
  mpesaPaybill: string;
  mpesaAccountNumber: string;
  mpesaReceiptNumber?: string;
  paidAt?: string;
  transactionId?: string;
}

export interface SchoolPdfDocument {
  id: string;
  title: string;
  titleSw: string;
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
  summarySw: string;
}

// Kenyan School Students Dataset (Nairobi, Kenya)
export const INITIAL_STUDENTS: StudentParentContact[] = [
  {
    id: 'std-ken-101',
    admissionNo: 'KPS/2024/0142',
    name: 'Brian Kipchoge',
    nameSw: 'Brian Kipchoge',
    className: 'Grade 8B (JSS)',
    rollNumber: '14',
    parentName: 'David Kipchoge',
    parentNameSw: 'David Kipchoge',
    phone: '+254 712 345 678',
    isAbsentToday: true,
    absentReportedTime: '08:15 AM',
    feeStatus: 'DUE',
    feeAmountKsh: 14850,
    pendingInvoiceId: 'INV-2024-884',
  },
  {
    id: 'std-ken-102',
    admissionNo: 'KPS/2024/0089',
    name: 'Faith Wanjiku',
    nameSw: 'Faith Wanjiku',
    className: 'Form 4A (KCSE)',
    rollNumber: '06',
    parentName: 'Grace Wanjiku',
    parentNameSw: 'Grace Wanjiku',
    phone: '+254 722 987 654',
    isAbsentToday: true,
    absentReportedTime: '08:20 AM',
    feeStatus: 'OVERDUE',
    feeAmountKsh: 8750,
    pendingInvoiceId: 'INV-2024-791',
  },
  {
    id: 'std-ken-103',
    admissionNo: 'KPS/2024/0201',
    name: 'Emmanuel Ochieng',
    nameSw: 'Emmanuel Ochieng',
    className: 'Grade 9A (JSS)',
    rollNumber: '21',
    parentName: 'Peter Ochieng',
    parentNameSw: 'Peter Ochieng',
    phone: '+254 733 456 789',
    isAbsentToday: true,
    absentReportedTime: '08:25 AM',
    feeStatus: 'PAID',
    feeAmountKsh: 0,
  },
  {
    id: 'std-ken-104',
    admissionNo: 'KPS/2024/0312',
    name: 'Mercy Achieng',
    nameSw: 'Mercy Achieng',
    className: 'Grade 7B (CBC)',
    rollNumber: '09',
    parentName: 'Mary Achieng',
    parentNameSw: 'Mary Achieng',
    phone: '+254 745 678 901',
    isAbsentToday: false,
    feeStatus: 'DUE',
    feeAmountKsh: 6200,
    pendingInvoiceId: 'INV-2024-912',
  },
  {
    id: 'std-ken-105',
    admissionNo: 'KPS/2024/0055',
    name: 'Kelvin Mwangi',
    nameSw: 'Kelvin Mwangi',
    className: 'Form 3B (KCSE)',
    rollNumber: '18',
    parentName: 'John Mwangi',
    parentNameSw: 'John Mwangi',
    phone: '+254 756 789 012',
    isAbsentToday: false,
    feeStatus: 'PAID',
    feeAmountKsh: 0,
  },
];

// Kenyan School Invoices (Lipa Na M-Pesa Paybill: 174379)
export const INITIAL_INVOICES: FeeInvoiceItem[] = [
  {
    id: 'INV-2024-884',
    invoiceNumber: 'INV-2024-884',
    studentId: 'std-ken-101',
    studentName: 'Brian Kipchoge',
    className: 'Grade 8B (JSS)',
    parentName: 'David Kipchoge',
    parentPhone: '+254 712 345 678',
    amountKsh: 14850,
    currency: 'KES',
    dueDate: '2024-10-18',
    status: 'PENDING',
    description: 'Term 2 Tuition Fee & Nairobi West Bus Transport',
    descriptionSw: 'Ada ya Masomo Muhula wa 2 na Usafiri wa Basi (Nairobi West)',
    mpesaPaybill: '174379',
    mpesaAccountNumber: 'INV-2024-884',
  },
  {
    id: 'INV-2024-791',
    invoiceNumber: 'INV-2024-791',
    studentId: 'std-ken-102',
    studentName: 'Faith Wanjiku',
    className: 'Form 4A (KCSE)',
    parentName: 'Grace Wanjiku',
    parentPhone: '+254 722 987 654',
    amountKsh: 8750,
    currency: 'KES',
    dueDate: '2024-10-05',
    status: 'OVERDUE',
    description: 'KNEC KCSE National Examination Fee & Science Lab Kit',
    descriptionSw: 'Ada ya Mtihani wa Kitaifa wa KCSE na Vifaa vya Maabara ya Sayansi',
    mpesaPaybill: '174379',
    mpesaAccountNumber: 'INV-2024-791',
  },
  {
    id: 'INV-2024-912',
    invoiceNumber: 'INV-2024-912',
    studentId: 'std-ken-104',
    studentName: 'Mercy Achieng',
    className: 'Grade 7B (CBC)',
    parentName: 'Mary Achieng',
    parentPhone: '+254 745 678 901',
    amountKsh: 6200,
    currency: 'KES',
    dueDate: '2024-10-25',
    status: 'PENDING',
    description: 'Term 2 Junior Secondary CBC Robotics & Smart Classroom Facility',
    descriptionSw: 'Ada ya Klabu ya Roboti na Madarasa ya Kidijitali ya CBC',
    mpesaPaybill: '174379',
    mpesaAccountNumber: 'INV-2024-912',
  },
];

// Kenyan School Official PDF Documents
export const INITIAL_PDF_DOCUMENTS: SchoolPdfDocument[] = [
  {
    id: 'doc-rc-101',
    title: 'Junior Secondary Assessment Progress Report Card (CBC)',
    titleSw: 'Ripoti Rasmi ya Maendeleo ya Mtihani (CBC Grade 8)',
    type: 'REPORT_CARD',
    studentId: 'std-ken-101',
    studentName: 'Brian Kipchoge (Grade 8B)',
    fileSizeBytes: 245000,
    pagesCount: 2,
    publishedDate: '2024-10-10',
    downloadUrl: '/documents/report-card-brian-kipchoge-term2.pdf',
    termOrSession: 'Term 2 Mid-Term 2024',
    summary: 'Total Marks: 462/500 (92.4%), Mean Grade: A, Position: 3rd. Principal remark: Exceeding Expectations in STEM and Kiswahili.',
    summarySw: 'Jumla ya Alama: 462/500 (92.4%), Daraja: A, Nafasi ya 3. Maoni ya Mkuu wa Shule: Ufaulu wa hali ya juu katika Sayansi na Kiswahili.',
  },
  {
    id: 'doc-rec-884',
    title: 'Official M-Pesa School Fee Tax Receipt & Invoice',
    titleSw: 'Risiti Rasmi ya Malipo ya Ada Kupitia M-Pesa',
    type: 'FEE_RECEIPT',
    studentId: 'std-ken-101',
    studentName: 'Brian Kipchoge (Grade 8B)',
    fileSizeBytes: 182000,
    pagesCount: 1,
    publishedDate: '2024-10-11',
    downloadUrl: '/documents/mpesa-receipt-brian-kipchoge-884.pdf',
    termOrSession: 'Term 2 Fee Receipt',
    summary: 'Paid KSh 14,850 via Lipa Na M-Pesa (Ref: QKJ8129ABC). Verified by Safaricom Daraja API & KRA Tax Invoice Seal.',
    summarySw: 'Imelipwa KSh 14,850 kupitia Lipa Na M-Pesa (Ref: QKJ8129ABC). Imethibitishwa na Safaricom Daraja API na KRA.',
  },
  {
    id: 'doc-not-cir-04',
    title: 'Official Circular: MoE Term 2 Mid-Term Break & Annual Sports Day',
    titleSw: 'Waraka Rasmi: Mapumziko ya Muhula wa 2 na Siku ya Michezo',
    type: 'CIRCULAR_NOTICE',
    targetClass: 'All Classes (Grade 1 - Form 4)',
    fileSizeBytes: 310000,
    pagesCount: 3,
    publishedDate: '2024-10-09',
    downloadUrl: '/documents/school-circular-term2-break-2024.pdf',
    termOrSession: 'October 2024 Circular',
    summary: 'Ministry of Education Kenya calendar updates: Half-term break dates, bus schedules, and upcoming inter-county athletics trials at Nyayo Stadium.',
    summarySw: 'Mwongozo wa Wizara ya Elimu kuhusu likizo fupi ya muhula, ratiba ya mabasi, na mashindano ya riadha uwanja wa Nyayo.',
  },
];

// WhatsApp Initial Messages (Swahili & English)
export const INITIAL_MESSAGES: WhatsAppCloudMessage[] = [
  {
    id: 'msg-wa-001',
    tenantId: 'tenant-kps-kenya',
    recipientPhone: '+254 712 345 678',
    parentName: 'David Kipchoge',
    studentId: 'std-ken-101',
    studentName: 'Brian Kipchoge',
    studentClass: 'Grade 8B (JSS)',
    type: 'ABSENCE_ALERT',
    language: 'sw',
    headerText: '🔴 Arifa ya Mahudhurio (School Absence Alert)',
    bodyText:
      'Hujambo David Kipchoge, \n\nMwanao Brian Kipchoge (Grade 8B, Roll: 14) hajaonekana shuleni leo asubuhi wakati wa mahudhurio ya saa 8:15 AM.\n\nTafadhali thibitisha ikiwa yuko salama nyumbani au ikiwa ni sababu ya kiafya/usafiri.',
    footerText: 'Krypton Academy Nairobi • Safaricom / Meta Cloud API',
    buttons: [
      {
        type: 'QUICK_REPLY',
        text: '🤒 Mtoto ni Mgonjwa (Sick Leave)',
        payload: 'REASON_SICK',
      },
      {
        type: 'QUICK_REPLY',
        text: '🚌 Kuchelewa kwa Basi (Transport)',
        payload: 'REASON_TRAVEL',
      },
      {
        type: 'PHONE_NUMBER',
        text: '📞 Piga Simu Shuleni',
        phoneNumber: '+254712000111',
      },
    ],
    attendanceDetails: {
      date: '2024-10-11',
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
    tenantId: 'tenant-kps-kenya',
    recipientPhone: '+254 722 987 654',
    parentName: 'Grace Wanjiku',
    studentId: 'std-ken-102',
    studentName: 'Faith Wanjiku',
    studentClass: 'Form 4A (KCSE)',
    type: 'FEE_PAYMENT_LINK',
    language: 'sw',
    headerText: '💳 Kikumbusho cha Ada ya Shule (Lipa Na M-Pesa)',
    bodyText:
      'Mpendwa Grace Wanjiku, \n\nAda ya shule kwa mwanafunzi Faith Wanjiku (Form 4A) imepita tarehe ya malipo:\n\n• Ankara: INV-2024-791\n• Kiasi: KSh 8,750\n• M-Pesa Paybill: 174379\n• Nambari ya Akaunti: INV-2024-791\n\nBofya kitufe cha M-Pesa hapa chini ili upokee arifa ya STK Push moja kwa moja kwenye simu yako na ulipe kwa sekunde chache.',
    footerText: 'Safaricom Daraja M-Pesa Gateway • Krypton Academy',
    paymentDetails: {
      invoiceId: 'INV-2024-791',
      invoiceNumber: 'INV-2024-791',
      amount: 8750,
      currency: 'KES',
      dueDate: '2024-10-05',
      paymentUrl: 'https://pay.kryptonschool.co.ke/inv/791',
      mpesaPaybill: '174379',
      mpesaAccountNumber: 'INV-2024-791',
      paymentMethod: 'MPESA_STK',
      status: 'OVERDUE',
    },
    buttons: [
      {
        type: 'URL',
        text: '⚡ Lipa KSh 8,750 via M-Pesa (STK Push)',
        url: 'https://pay.kryptonschool.co.ke/mpesa/pay/791',
      },
      {
        type: 'URL',
        text: '📄 Tazama Mchanganuo wa Ada',
        url: 'https://pay.kryptonschool.co.ke/inv/791',
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
    tenantId: 'tenant-kps-kenya',
    recipientPhone: '+254 712 345 678',
    parentName: 'David Kipchoge',
    studentId: 'std-ken-101',
    studentName: 'Brian Kipchoge',
    studentClass: 'Grade 8B (JSS)',
    type: 'REPORT_CARD_PDF',
    language: 'sw',
    headerText: '🎓 Kadi ya Ripoti ya Mtihani (Official PDF)',
    bodyText:
      'Hujambo David Kipchoge,\n\nKadi rasmi ya ripoti ya mtihani wa muhula wa pili (Grade 8 CBC) kwa Brian Kipchoge imeambatishwa hapa.\n\n📊 Alama: 462/500 (92.4% - Daraja A)\n🏆 Nafasi: Ya 3 Darasani\n\nPakua PDF hapa chini na uhifadhi.',
    attachment: {
      type: 'DOCUMENT',
      filename: 'Report_Card_Brian_Kipchoge_Term2.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 245000,
      url: '/documents/report-card-brian-kipchoge-term2.pdf',
      caption: 'Ripoti Rasmi ya Maendeleo ya Mtihani 2024',
    },
    pdfDetails: {
      documentId: 'doc-rc-101',
      documentTitle: 'Junior Secondary Assessment Progress Report Card (CBC)',
      documentType: 'REPORT_CARD',
      termOrPeriod: 'Term 2 Mid-Term 2024',
      downloadUrl: '/documents/report-card-brian-kipchoge-term2.pdf',
      pagesCount: 2,
    },
    footerText: 'Imethibitishwa na Mkuu wa Shule • Krypton Academy Nairobi',
    buttons: [
      {
        type: 'URL',
        text: '📥 Pakua Ripoti ya PDF (245 KB)',
        url: '/documents/report-card-brian-kipchoge-term2.pdf',
      },
      {
        type: 'QUICK_REPLY',
        text: '👍 Nimeona / Acknowledged',
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
    wabaId: 'WABA_254700889900',
    phoneNumberId: 'PNID_254712000111',
    displayPhoneNumber: '+254 712 000 111',
    businessName: 'Krypton Academy Nairobi (Official)',
    apiTokenConfigured: true,
    webhookVerified: true,
    morningAbsenceTriggerTime: '08:30 AM',
    autoFeeReminderDaysBeforeDue: 3,
    autoPdfDeliveryEnabled: true,
    defaultLanguage: 'sw',
  };

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
    return { ...this.config };
  }

  updateConfig(partial: Partial<WhatsAppAutomationConfig>): WhatsAppAutomationConfig {
    this.config = { ...this.config, ...partial };
    return { ...this.config };
  }

  getStats(): WhatsAppAutomationStats {
    const totalSent = this.messages.length;
    const totalDelivered = this.messages.filter((m) => ['DELIVERED', 'READ', 'REPLIED'].includes(m.status)).length;
    const totalRead = this.messages.filter((m) => ['READ', 'REPLIED'].includes(m.status)).length;
    const openRatePercentage = totalDelivered > 0 ? Number(((totalRead / totalDelivered) * 100).toFixed(1)) : 98.6;

    const paidInvoices = this.invoices.filter((i) => i.status === 'PAID');
    const paymentCollected = paidInvoices.reduce((acc, curr) => acc + curr.amountKsh, 0);

    return {
      totalSentToday: totalSent + 185,
      totalDelivered: totalDelivered + 182,
      totalRead: totalRead + 180,
      openRatePercentage: 98.9,
      paymentConversionsCount: paidInvoices.length + 42,
      paymentCollectedAmount: paymentCollected + 420000, // in KSh
      pdfDownloadsCount: 215,
      avgReadTimeMinutes: 2.4,
    };
  }

  // Feature 1: Trigger Absentee Notifications (Kenya Context)
  sendAbsenteeAlert(studentId: string, language: WhatsAppLanguage = 'sw'): WhatsAppCloudMessage {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    const isSw = language === 'sw';
    const isMl = language === 'ml';
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let header = '🔴 School Absence Alert';
    let bodyText = `Dear Parent (${student.parentName}), \n\nYour child ${student.name} (${student.className}, Roll: ${student.rollNumber}) has been marked ABSENT today during morning roll call at ${currentTime}.\n\nPlease ensure your child is safe. If this is an unexpected absence, please contact the school administration immediately.`;
    let sickBtn = '🤒 Sick Leave';
    let busBtn = '🚗 Transport Delay';
    let callBtn = '📞 Call School Office';

    if (isSw) {
      header = '🔴 Arifa ya Mahudhurio (Absence Alert)';
      bodyText = `Mpendwa Mzazi (${student.parentName}), \n\nMwanao ${student.name} (${student.className}, Roll: ${student.rollNumber}) hakuhudhuria shuleni leo asubuhi wakati wa mahudhurio ya saa ${currentTime}.\n\nTafadhali thibitisha ikiwa yuko salama nyumbani au unahitaji usaidizi kutoka kwa uongozi wa shule.`;
      sickBtn = '🤒 Mtoto ni Mgonjwa (Sick)';
      busBtn = '🚌 Basi Lilichelewa (Late)';
      callBtn = '📞 Piga Simu Shuleni';
    } else if (isMl) {
      header = '🔴 സ്കൂൾ ഹാജർ അറിയിപ്പ് (Absence Alert)';
      bodyText = `പ്രിയ രക്ഷിതാവേ (${student.parentName}), നിങ്ങളുടെ കുട്ടി ${student.name} (${student.className}, Roll: ${student.rollNumber}) ഇന്ന് രാവിലത്തെ ഹാജർ നിലയിൽ എത്തിയിട്ടില്ലെന്ന് രേഖപ്പെടുത്തിയിട്ടുണ്ട്. കുട്ടി സുരക്ഷിതമാണെന്ന് ഉറപ്പുവരുത്തുക.`;
      sickBtn = '🤒 അസുഖം / Sick Leave';
      busBtn = '🚌 യാത്രാ തടസ്സം / Late';
      callBtn = '📞 സ്കൂളുമായി ബന്ധപ്പെടുക';
    }

    const newMsg: WhatsAppCloudMessage = {
      id: `msg-wa-${Date.now()}`,
      tenantId: 'tenant-kps-kenya',
      recipientPhone: student.phone,
      parentName: student.parentName,
      studentId: student.id,
      studentName: student.name,
      studentClass: student.className,
      type: 'ABSENCE_ALERT',
      language,
      headerText: header,
      bodyText,
      footerText: 'Krypton Academy Nairobi • Safaricom Meta Cloud API',
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
          phoneNumber: '+254712000111',
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

  // Feature 2: Trigger 1-Click Fee Payment Link (M-Pesa STK Push)
  sendFeeReminder(invoiceId: string, language: WhatsAppLanguage = 'sw'): WhatsAppCloudMessage {
    const invoice = this.invoices.find((i) => i.id === invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const isSw = language === 'sw';
    const isMl = language === 'ml';
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let header = '💳 School Fee Reminder (Lipa Na M-Pesa)';
    let bodyText = `Dear ${invoice.parentName}, \n\nFee due reminder for ${invoice.studentName} (${invoice.className}).\n\n• Invoice No: ${invoice.invoiceNumber}\n• Description: ${invoice.description}\n• Amount Due: KSh ${invoice.amountKsh.toLocaleString()}\n• Due Date: ${invoice.dueDate}\n• M-Pesa Paybill: ${invoice.mpesaPaybill}\n• Account No: ${invoice.mpesaAccountNumber}\n\nTap the 1-Click M-Pesa button below to trigger an instant STK PIN prompt directly on your Safaricom line.`;
    let payBtnText = `⚡ 1-Click Pay KSh ${invoice.amountKsh.toLocaleString()} via M-Pesa`;
    let viewBtnText = '📄 View Fee Breakdown';

    if (isSw) {
      header = '💳 Kikumbusho cha Ada (Lipa Na M-Pesa)';
      bodyText = `Mpendwa ${invoice.parentName}, \n\nKikumbusho cha ada ya shule ya ${invoice.studentName} (${invoice.className}).\n\n• Nambari ya Ankara: ${invoice.invoiceNumber}\n• Maelezo: ${invoice.descriptionSw}\n• Kiasi Kinachodaiwa: KSh ${invoice.amountKsh.toLocaleString()}\n• Tarehe ya Mwisho: ${invoice.dueDate}\n• M-Pesa Paybill: ${invoice.mpesaPaybill}\n• Akaunti: ${invoice.mpesaAccountNumber}\n\nBofya kitufe cha M-Pesa hapa chini kupokea arifa ya papo hapo (STK Push) kwenye simu yako na uweke PIN yako ya M-Pesa kwa urahisi.`;
      payBtnText = `⚡ Lipa KSh ${invoice.amountKsh.toLocaleString()} via M-Pesa`;
      viewBtnText = '📄 Tazama Ankara';
    } else if (isMl) {
      header = '💳 സ്കൂൾ ഫീ പേയ്‌മെന്റ് റിമൈൻഡർ (M-Pesa)';
      bodyText = `പ്രിയ ${invoice.parentName}, ${invoice.studentName} (${invoice.className}) യുടെ സ്കൂൾ ഫീസ് KSh ${invoice.amountKsh.toLocaleString()} M-Pesa വഴി അടയ്ക്കാൻ താഴെയുള്ള ബട്ടൺ ക്ലിക്ക് ചെയ്യുക. Paybill: ${invoice.mpesaPaybill}, Acc: ${invoice.mpesaAccountNumber}.`;
      payBtnText = `⚡ Pay KSh ${invoice.amountKsh.toLocaleString()} via M-Pesa`;
      viewBtnText = '📄 ഇൻവോയ്സ് വിവരങ്ങൾ';
    }

    const newMsg: WhatsAppCloudMessage = {
      id: `msg-wa-${Date.now()}`,
      tenantId: 'tenant-kps-kenya',
      recipientPhone: invoice.parentPhone,
      parentName: invoice.parentName,
      studentId: invoice.studentId,
      studentName: invoice.studentName,
      studentClass: invoice.className,
      type: 'FEE_PAYMENT_LINK',
      language,
      headerText: header,
      bodyText,
      footerText: 'Safaricom Daraja API • Instant M-Pesa Receipt',
      paymentDetails: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amountKsh,
        currency: 'KES',
        dueDate: invoice.dueDate,
        paymentUrl: `https://pay.kryptonschool.co.ke/inv/${invoice.invoiceNumber}`,
        paymentMethod: 'MPESA_STK',
        mpesaPaybill: invoice.mpesaPaybill,
        mpesaAccountNumber: invoice.mpesaAccountNumber,
        status: invoice.status,
      },
      buttons: [
        {
          type: 'URL',
          text: payBtnText,
          url: `https://pay.kryptonschool.co.ke/mpesa/pay/${invoice.invoiceNumber}`,
        },
        {
          type: 'URL',
          text: viewBtnText,
          url: `https://pay.kryptonschool.co.ke/inv/${invoice.invoiceNumber}`,
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

  // Feature 3: Digital PDF Delivery (Kenyan Report Card, M-Pesa Receipt, Circular)
  sendPdfDelivery(documentId: string, language: WhatsAppLanguage = 'sw'): WhatsAppCloudMessage {
    const doc = this.pdfDocuments.find((d) => d.id === documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    const isSw = language === 'sw';
    const isMl = language === 'ml';
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let header = '';
    let bodyText = '';
    let recipientPhone = '+254 712 345 678';
    let parentName = 'David Kipchoge';
    let studentName = 'Brian Kipchoge';
    let studentClass = 'Grade 8B (JSS)';
    let studentId = 'std-ken-101';
    let msgType: WhatsAppMessageType = 'REPORT_CARD_PDF';

    if (doc.type === 'REPORT_CARD') {
      msgType = 'REPORT_CARD_PDF';
      if (isSw) {
        header = '🎓 Ripoti Rasmi ya Mtihani (CBC PDF)';
        bodyText = `Mpendwa ${parentName},\n\nKadi rasmi ya ripoti ya mtihani wa ${studentName} kwa Muhula wa 2 (CBC Assessment) imeambatishwa hapa.\n\n${doc.summarySw}\n\nUnaweza kupakua na kuhifadhi nakala rasmi ya PDF hapa hapa WhatsApp bila kuingia kwenye tovuti.`;
      } else if (isMl) {
        header = '🎓 പരീക്ഷാ ഫല പ്രോഗ്രസ് കാർഡ് (PDF)';
        bodyText = `പ്രിയ ${parentName},\n\n${studentName} ന്റെ ഔദ്യോഗിക പരീക്ഷാ ഫലം (PDF) താഴെ നൽകുന്നു.\n\n${doc.summary}`;
      } else {
        header = '🎓 Official Assessment Report Card (PDF)';
        bodyText = `Dear ${parentName},\n\nOfficial Term 2 Progress Report Card for ${studentName} is attached below.\n\n${doc.summary}\n\nYou can download and save the verified signed document directly from WhatsApp.`;
      }
    } else if (doc.type === 'FEE_RECEIPT') {
      msgType = 'FEE_RECEIPT_PDF';
      if (isSw) {
        header = '🧾 Risiti Rasmi ya M-Pesa (Verified PDF)';
        bodyText = `Mpendwa ${parentName},\n\nMalipo ya ada ya ${studentName} kupitia Lipa Na M-Pesa yamepokelewa kikamilifu. Risiti yako rasmi ya PDF yenye stempu ya KRA imeambatishwa.\n\n${doc.summarySw}`;
      } else if (isMl) {
        header = '🧾 എം-പെസ ഫീ റെസീപ്റ്റ് (Official PDF)';
        bodyText = `പ്രിയ ${parentName},\n\n${studentName} ന്റെ M-Pesa ഫീ പേയ്‌മെന്റ് വിജയകരമായി സ്വീകരിച്ചു. ഔദ്യോഗിക രസീത് PDF താഴെ ഡൗൺലോഡ് ചെയ്യാം.\n\n${doc.summary}`;
      } else {
        header = '🧾 Official M-Pesa Fee Receipt (PDF)';
        bodyText = `Dear ${parentName},\n\nM-Pesa fee payment received successfully for ${studentName}. Your official verified PDF tax receipt is attached.\n\n${doc.summary}`;
      }
    } else {
      msgType = 'SCHOOL_NOTICE_PDF';
      if (isSw) {
        header = '📢 Waraka Rasmi wa Shule (Notice PDF)';
        bodyText = `Mpendwa Mzazi,\n\nTangazo muhimu kutoka kwa uongozi wa shule: ${doc.titleSw}.\n\n${doc.summarySw}\n\nTafadhali pakua na usome waraka kamili ulioambatishwa.`;
      } else if (isMl) {
        header = '📢 സ്കൂൾ നോട്ടീസ് & സർക്കുലർ (PDF)';
        bodyText = `പ്രിയ രക്ഷിതാവേ, സ്കൂൾ നോട്ടീസ് താഴെ നൽകുന്നു: ${doc.title}.\n\n${doc.summary}`;
      } else {
        header = '📢 Official School Notice (PDF)';
        bodyText = `Dear Parent,\n\nOfficial circular from the School Administration: ${doc.title}.\n\n${doc.summary}\n\nPlease download and review the official notice.`;
      }
    }

    const newMsg: WhatsAppCloudMessage = {
      id: `msg-wa-${Date.now()}`,
      tenantId: 'tenant-kps-kenya',
      recipientPhone,
      parentName,
      studentId,
      studentName,
      studentClass,
      type: msgType,
      language,
      headerText: header,
      bodyText,
      footerText: 'Krypton Academy Nairobi • Official Verified PDF',
      attachment: {
        type: 'DOCUMENT',
        filename: `${doc.title.replace(/\s+/g, '_')}.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: doc.fileSizeBytes,
        url: doc.downloadUrl,
        caption: isSw ? doc.titleSw : doc.title,
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
          text: `📥 ${isSw ? 'Pakua PDF' : isMl ? 'Download PDF' : 'Download PDF'} (${(doc.fileSizeBytes / 1024).toFixed(0)} KB)`,
          url: doc.downloadUrl,
        },
        {
          type: 'QUICK_REPLY',
          text: isSw ? '✅ Nimeona / Sawa' : isMl ? '✅ കണ്ടു / Acknowledged' : '✅ Acknowledged',
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

  // Interactive Simulator Action: Parent completes M-Pesa STK push or clicks quick reply
  simulateParentAction(
    messageId: string,
    action: 'LEAVE_REASON' | 'PAY_FEE' | 'ACKNOWLEDGE',
    payloadValue?: string,
  ): { success: boolean; feedbackMessage: string; followUpMessage?: WhatsAppCloudMessage } {
    const msg = this.messages.find((m) => m.id === messageId);
    if (!msg) {
      return { success: false, feedbackMessage: 'Message not found' };
    }

    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (action === 'LEAVE_REASON') {
      if (msg.attendanceDetails) {
        msg.attendanceDetails.parentAcknowledged = true;
        msg.attendanceDetails.reason = payloadValue || 'Ugonjwa / Sick Leave';
        msg.attendanceDetails.acknowledgedAt = currentTime;
      }
      msg.status = 'REPLIED';

      // Auto-reply confirmation from school bot in Swahili/English
      const followUp: WhatsAppCloudMessage = {
        id: `msg-wa-${Date.now()}`,
        tenantId: 'tenant-kps-kenya',
        recipientPhone: msg.recipientPhone,
        parentName: msg.parentName,
        studentId: msg.studentId,
        studentName: msg.studentName,
        studentClass: msg.studentClass,
        type: 'CUSTOM_ANNOUNCEMENT',
        language: msg.language,
        headerText: msg.language === 'sw' ? '✅ Sababu ya Kutohudhuria Imerekodiwa' : '✅ Leave Reason Acknowledged',
        bodyText:
          msg.language === 'sw'
            ? `Asante ${msg.parentName}. Taarifa yako kuhusu kutohudhuria kwa ${msg.studentName} ("${payloadValue || 'Mgonjwa'}") imerekodiwa katika sajili ya shule na mwalimu wa darasa amearifiwa.`
            : `Thank you ${msg.parentName}. The absence reason for ${msg.studentName} ("${payloadValue || 'Medical Leave'}") has been logged into the school portal and the class teacher has been notified.`,
        footerText: 'Krypton Academy Automated Desk',
        status: 'READ',
        sentAt: currentTime,
        deliveredAt: currentTime,
        readAt: currentTime,
        wabaMessageId: `wamid.HBgM${Date.now()}`,
      };
      this.messages.unshift(followUp);

      return {
        success: true,
        feedbackMessage: 'Sababu ya kutohudhuria imesasishwa kwenye mfumo wa shule!',
        followUpMessage: followUp,
      };
    }

    if (action === 'PAY_FEE') {
      const mpesaRef = `QKJ${Math.floor(1000 + Math.random() * 9000)}ABC`;
      if (msg.paymentDetails) {
        msg.paymentDetails.status = 'PAID';
        msg.paymentDetails.paidAt = currentTime;
        msg.paymentDetails.transactionId = mpesaRef;
        msg.paymentDetails.mpesaReceiptNumber = mpesaRef;
      }
      msg.status = 'REPLIED';

      // Update invoice in store
      const inv = this.invoices.find((i) => i.id === msg.paymentDetails?.invoiceId);
      if (inv) {
        inv.status = 'PAID';
        inv.paidAt = currentTime;
        inv.transactionId = mpesaRef;
        inv.mpesaReceiptNumber = mpesaRef;
      }

      // Generate & auto-deliver official PDF M-Pesa Receipt
      const receiptDoc = this.pdfDocuments.find((d) => d.type === 'FEE_RECEIPT') || this.pdfDocuments[1];
      const followUpReceipt = this.sendPdfDelivery(receiptDoc.id, msg.language);

      return {
        success: true,
        feedbackMessage: `Malipo ya KSh ${msg.paymentDetails?.amount.toLocaleString()} kupitia M-Pesa (Ref: ${mpesaRef}) yamekamilika! Risiti ya PDF imetumwa WhatsApp.`,
        followUpMessage: followUpReceipt,
      };
    }

    if (action === 'ACKNOWLEDGE') {
      msg.status = 'REPLIED';
      return {
        success: true,
        feedbackMessage: 'Taarifa imethibitishwa na mzazi.',
      };
    }

    return { success: true, feedbackMessage: 'Updated' };
  }
}

export const whatsAppClient = new WhatsAppClientStore();
