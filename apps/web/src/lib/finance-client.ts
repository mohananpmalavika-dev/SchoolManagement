import {
  PaymentGatewayType,
  CurrencyCode,
  CurrencyConfig,
  DunningStage,
  DunningNotice,
  PaymentPlan,
  PaymentPlanInstallment,
  ConcessionRule,
  StudentConcessionMatch,
  StaffPayrollProfile,
  StaffPayslip,
  MonthlyPayrollRun,
  FinanceSummaryMetrics,
} from '@krypton/types';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', exchangeRateToUSD: 0.012 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRateToUSD: 1.0 },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', exchangeRateToUSD: 0.0077 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', exchangeRateToUSD: 1.08 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', exchangeRateToUSD: 1.29 },
};

export interface DemoInvoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  grade: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  term: string;
  tuitionFee: number;
  activityFee: number;
  transportFee: number;
  concessionApplied: number;
  concessionNote?: string;
  lateFee: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'PENDING' | 'OVERDUE' | 'PARTIALLY_PAID' | 'PAID' | 'PAYMENT_PLAN';
  dueDate: string;
  paymentPlanId?: string;
}

// Default Concession Rules
export const INITIAL_CONCESSION_RULES: ConcessionRule[] = [
  {
    id: 'rule-sibling-2',
    name: 'Sibling Concession (2nd Child)',
    nameMl: 'രണ്ടാമത്തെ കുട്ടിക്ക് സിബ്ലിംഗ് ഡിസ്കൗണ്ട്',
    type: 'SIBLING',
    discountPercentage: 15,
    applicableFeeCategories: ['TUITION'],
    criteriaDescription: 'Auto-applied when 2 siblings are enrolled in school under same guardian',
    isActive: true,
    autoApply: true,
  },
  {
    id: 'rule-sibling-3',
    name: 'Sibling Concession (3rd Child+)',
    nameMl: 'മൂന്നാമത്തെ കുട്ടിക്ക് സിബ്ലിംഗ് ഡിസ്കൗണ്ട്',
    type: 'SIBLING',
    discountPercentage: 25,
    applicableFeeCategories: ['TUITION'],
    criteriaDescription: 'Auto-applied for 3rd and subsequent siblings enrolled under same guardian',
    isActive: true,
    autoApply: true,
  },
  {
    id: 'rule-staff-child',
    name: 'Staff Dependent Concession',
    nameMl: 'ജീവനക്കാരുടെ മക്കൾക്കുള്ള കൺസെഷൻ',
    type: 'STAFF_CHILD',
    discountPercentage: 50,
    applicableFeeCategories: ['TUITION'],
    criteriaDescription: '50% tuition waiver for biological children of full-time teaching/non-teaching staff',
    isActive: true,
    autoApply: true,
  },
  {
    id: 'rule-merit-super',
    name: 'Academic Excellence Merit Scholarship',
    nameMl: 'മെറിറ്റ് സ്കോളർഷിപ്പ് (90%+ മാർക്ക്)',
    type: 'MERIT',
    discountPercentage: 30,
    applicableFeeCategories: ['TUITION'],
    criteriaDescription: 'Awarded to students scoring ≥ 90% in previous term/board examinations',
    isActive: true,
    autoApply: true,
  },
  {
    id: 'rule-need-based',
    name: 'EWS / Financial Aid Grant',
    nameMl: 'സാമ്പത്തിക സഹായ ഗ്രാന്റ്',
    type: 'NEED_BASED',
    discountPercentage: 40,
    applicableFeeCategories: ['TUITION'],
    criteriaDescription: 'Need-based waiver for families facing temporary financial hardship',
    isActive: true,
    autoApply: false,
  },
];

// Initial Staff Roster for HRMS Payroll
export const INITIAL_STAFF_PROFILES: StaffPayrollProfile[] = [
  {
    id: 'st-01',
    staffId: 'st-01',
    staffNumber: 'STF-101',
    fullName: 'Lakshmi Menon',
    department: 'TEACHING',
    position: 'PGT English & Academic Coordinator',
    isTeaching: true,
    bankAccount: {
      bankName: 'State Bank of India',
      accountNumber: '••••••••4821',
      routingOrIfsc: 'SBIN0004521',
      accountHolder: 'Lakshmi Menon',
    },
    salaryComponents: {
      basicSalary: 42000,
      hra: 12600,
      travelAllowance: 4000,
      specialAllowance: 6400,
      providentFundRate: 12,
      professionalTax: 200,
      tdsRate: 5,
    },
    monthlyGrossSalary: 65000,
  },
  {
    id: 'st-02',
    staffId: 'st-02',
    staffNumber: 'STF-102',
    fullName: 'Rajesh Varma',
    department: 'TEACHING',
    position: 'Senior Mathematics Faculty',
    isTeaching: true,
    bankAccount: {
      bankName: 'HDFC Bank',
      accountNumber: '••••••••9012',
      routingOrIfsc: 'HDFC0001890',
      accountHolder: 'Rajesh Varma',
    },
    salaryComponents: {
      basicSalary: 40000,
      hra: 12000,
      travelAllowance: 4000,
      specialAllowance: 5000,
      providentFundRate: 12,
      professionalTax: 200,
      tdsRate: 5,
    },
    monthlyGrossSalary: 61000,
  },
  {
    id: 'st-03',
    staffId: 'st-03',
    staffNumber: 'STF-103',
    fullName: 'Dr. Anita George',
    department: 'TEACHING',
    position: 'Head of Science Department',
    isTeaching: true,
    bankAccount: {
      bankName: 'Federal Bank',
      accountNumber: '••••••••3145',
      routingOrIfsc: 'FDRL0001045',
      accountHolder: 'Dr. Anita George',
    },
    salaryComponents: {
      basicSalary: 48000,
      hra: 14400,
      travelAllowance: 4500,
      specialAllowance: 8100,
      providentFundRate: 12,
      professionalTax: 200,
      tdsRate: 8,
    },
    monthlyGrossSalary: 75000,
  },
  {
    id: 'st-04',
    staffId: 'st-04',
    staffNumber: 'STF-104',
    fullName: 'Manoj Kumar',
    department: 'FINANCE',
    position: 'Senior Finance Officer & Accountant',
    isTeaching: false,
    bankAccount: {
      bankName: 'Canara Bank',
      accountNumber: '••••••••6632',
      routingOrIfsc: 'CNRB0002130',
      accountHolder: 'Manoj Kumar',
    },
    salaryComponents: {
      basicSalary: 32000,
      hra: 9600,
      travelAllowance: 3500,
      specialAllowance: 4900,
      providentFundRate: 12,
      professionalTax: 200,
      tdsRate: 5,
    },
    monthlyGrossSalary: 50000,
  },
  {
    id: 'st-05',
    staffId: 'st-05',
    staffNumber: 'STF-105',
    fullName: 'Suresh Babu',
    department: 'TRANSPORT',
    position: 'Transport Fleet Supervisor',
    isTeaching: false,
    bankAccount: {
      bankName: 'State Bank of India',
      accountNumber: '••••••••7721',
      routingOrIfsc: 'SBIN0004521',
      accountHolder: 'Suresh Babu',
    },
    salaryComponents: {
      basicSalary: 22000,
      hra: 6600,
      travelAllowance: 3000,
      specialAllowance: 2400,
      providentFundRate: 12,
      professionalTax: 200,
      tdsRate: 0,
    },
    monthlyGrossSalary: 34000,
  },
];

// Initial Invoices showcasing different Dunning & Concession states
export const INITIAL_INVOICES: DemoInvoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2026-081',
    studentId: 'stud-101',
    studentName: 'Ananya Nair',
    admissionNumber: 'ADM-2024-001',
    grade: 'Grade 8-A',
    guardianName: 'Gopinathan Nair',
    guardianPhone: '+91 98471 23456',
    guardianEmail: 'gopinath.nair@gmail.com',
    term: 'Term 2 (2026-27)',
    tuitionFee: 32000,
    activityFee: 4500,
    transportFee: 6500,
    concessionApplied: 0,
    lateFee: 0,
    totalAmount: 43000,
    paidAmount: 0,
    balanceAmount: 43000,
    status: 'PENDING',
    dueDate: '2026-10-18', // 7 days from now (Oct 11) -> Soft Reminder
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2026-082',
    studentId: 'stud-102',
    studentName: 'Arjun Nair', // Sibling of Ananya
    admissionNumber: 'ADM-2024-002',
    grade: 'Grade 5-B',
    guardianName: 'Gopinathan Nair',
    guardianPhone: '+91 98471 23456',
    guardianEmail: 'gopinath.nair@gmail.com',
    term: 'Term 2 (2026-27)',
    tuitionFee: 28000,
    activityFee: 4000,
    transportFee: 6500,
    concessionApplied: 4200, // 15% sibling discount on tuition
    concessionNote: '15% Sibling Concession applied',
    lateFee: 0,
    totalAmount: 34300,
    paidAmount: 0,
    balanceAmount: 34300,
    status: 'PENDING',
    dueDate: '2026-10-18',
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2026-045',
    studentId: 'stud-103',
    studentName: 'Devika Menon', // Child of Staff Lakshmi Menon
    admissionNumber: 'ADM-2023-019',
    grade: 'Grade 10-A',
    guardianName: 'Lakshmi Menon (Staff)',
    guardianPhone: '+91 94470 12890',
    guardianEmail: 'lakshmi.menon@kryptonschool.edu',
    term: 'Term 2 (2026-27)',
    tuitionFee: 36000,
    activityFee: 5000,
    transportFee: 0,
    concessionApplied: 18000, // 50% staff child discount
    concessionNote: '50% Staff Dependent Tuition Concession',
    lateFee: 0,
    totalAmount: 23000,
    paidAmount: 23000,
    balanceAmount: 0,
    status: 'PAID',
    dueDate: '2026-10-05',
  },
  {
    id: 'inv-004',
    invoiceNumber: 'INV-2026-029',
    studentId: 'stud-104',
    studentName: 'Rahul Krishnan', // Merit scholarship holder (95%)
    admissionNumber: 'ADM-2022-088',
    grade: 'Grade 11 - Science',
    guardianName: 'K. R. Krishnan',
    guardianPhone: '+91 97461 88231',
    guardianEmail: 'krishnan.kr@outlook.com',
    term: 'Term 2 (2026-27)',
    tuitionFee: 40000,
    activityFee: 6000,
    transportFee: 7000,
    concessionApplied: 12000, // 30% merit scholarship
    concessionNote: '30% Academic Excellence Merit Scholarship (Score 95.4%)',
    lateFee: 0,
    totalAmount: 41000,
    paidAmount: 0,
    balanceAmount: 41000,
    status: 'PENDING',
    dueDate: '2026-10-11', // Today is due date -> Due Alert
  },
  {
    id: 'inv-005',
    invoiceNumber: 'INV-2026-012',
    studentId: 'stud-105',
    studentName: 'Fathima Zahra',
    admissionNumber: 'ADM-2021-042',
    grade: 'Grade 9-C',
    guardianName: 'Abdul Rahman',
    guardianPhone: '+91 98950 44123',
    guardianEmail: 'abdul.rahman.z@gmail.com',
    term: 'Term 2 (2026-27)',
    tuitionFee: 34000,
    activityFee: 4500,
    transportFee: 6000,
    concessionApplied: 0,
    lateFee: 1725, // 5% late fee
    totalAmount: 46225,
    paidAmount: 10000,
    balanceAmount: 36225,
    status: 'OVERDUE',
    dueDate: '2026-09-25', // 16 days overdue -> Payment Plan Eligible
  },
  {
    id: 'inv-006',
    invoiceNumber: 'INV-2026-004',
    studentId: 'stud-106',
    studentName: 'Kavya Pillai',
    admissionNumber: 'ADM-2020-015',
    grade: 'Grade 12 - Commerce',
    guardianName: 'Sivasankaran Pillai',
    guardianPhone: '+91 94477 99012',
    guardianEmail: 'sivapillai@yahoo.co.in',
    term: 'Term 2 (2026-27)',
    tuitionFee: 38000,
    activityFee: 5000,
    transportFee: 7000,
    concessionApplied: 0,
    lateFee: 2500,
    totalAmount: 52500,
    paidAmount: 0,
    balanceAmount: 52500,
    status: 'OVERDUE',
    dueDate: '2026-09-15', // 26 days overdue -> Escalated & Payment Plan Offered
  },
];

const STORAGE_KEYS = {
  INVOICES: 'krypton_finance_invoices_v1',
  CONCESSION_RULES: 'krypton_finance_concessions_v1',
  STAFF_PROFILES: 'krypton_finance_staff_v1',
  PAYROLL_RUNS: 'krypton_finance_payroll_v1',
  PAYMENT_PLANS: 'krypton_finance_payment_plans_v1',
  DUNNING_NOTICES: 'krypton_finance_dunning_v1',
  PAYMENTS: 'krypton_finance_payments_v1',
};

class FinanceClientService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // ===================== INVOICE & GENERAL =====================
  getInvoices(): DemoInvoice[] {
    if (!this.isBrowser()) return INITIAL_INVOICES;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (stored) return JSON.parse(stored);
      this.saveInvoices(INITIAL_INVOICES);
      return INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  }

  saveInvoices(invoices: DemoInvoice[]) {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed to save invoices to storage', e);
    }
  }

  // ===================== MULTI-GATEWAY CHECKOUT =====================
  async processPayment(params: {
    invoiceId: string;
    amount: number;
    gateway: PaymentGatewayType;
    currency: CurrencyCode;
    payerDetails: {
      payerName: string;
      email?: string;
      phone?: string;
      cardNumberMasked?: string;
      upiId?: string;
      mpesaPhone?: string;
      paypalPayerId?: string;
    };
  }): Promise<{
    success: boolean;
    transactionReference: string;
    receiptNumber: string;
    timestamp: string;
    invoice: DemoInvoice;
    paymentRecord: any;
  }> {
    const invoices = this.getInvoices();
    const invoiceIndex = invoices.findIndex((i) => i.id === params.invoiceId);
    if (invoiceIndex === -1) {
      throw new Error(`Invoice with ID ${params.invoiceId} not found`);
    }

    const invoice = invoices[invoiceIndex];
    const newPaidAmount = invoice.paidAmount + params.amount;
    const newBalance = Math.max(0, invoice.totalAmount - newPaidAmount);
    const newStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

    const transactionReference = `TXN-${params.gateway}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptNumber = `RCP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const timestamp = new Date().toISOString();

    invoice.paidAmount = newPaidAmount;
    invoice.balanceAmount = newBalance;
    invoice.status = newStatus;
    invoices[invoiceIndex] = invoice;
    this.saveInvoices(invoices);

    const paymentRecord = {
      id: `pay-${Date.now()}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      studentName: invoice.studentName,
      amount: params.amount,
      currency: params.currency,
      gateway: params.gateway,
      reference: transactionReference,
      receiptNumber,
      payerDetails: params.payerDetails,
      timestamp,
      status: 'COMPLETED',
    };

    this.savePaymentRecord(paymentRecord);

    return {
      success: true,
      transactionReference,
      receiptNumber,
      timestamp,
      invoice,
      paymentRecord,
    };
  }

  getPaymentRecords(): any[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private savePaymentRecord(record: any) {
    if (!this.isBrowser()) return;
    try {
      const records = this.getPaymentRecords();
      records.unshift(record);
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(records));
    } catch (e) {
      console.error(e);
    }
  }

  // ===================== DUNNING & ESCALATION ENGINE =====================
  evaluateDunningSchedule(invoices?: DemoInvoice[]): DunningNotice[] {
    const list = invoices || this.getInvoices();
    const today = new Date('2026-10-11T00:00:00'); // Consistent reference date

    const notices: DunningNotice[] = [];

    for (const inv of list) {
      if (inv.status === 'PAID') continue;

      const due = new Date(inv.dueDate);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // >0: days remaining, <=0: overdue days

      let stage: DunningStage = 'SETTLED';
      let lateFee = 0;
      let channel: 'WHATSAPP' | 'SMS' | 'EMAIL' = 'WHATSAPP';
      let preview = '';
      let paymentPlanEligible = false;

      if (diffDays >= 1 && diffDays <= 7) {
        // T - 7: Soft Reminder
        stage = 'UPCOMING_SOFT';
        channel = 'WHATSAPP';
        preview = `Friendly reminder: School fee of ₹${inv.balanceAmount.toLocaleString()} for ${inv.studentName} is due in ${diffDays} days (${inv.dueDate}). Pay with 1-click via portal link.`;
      } else if (diffDays === 0) {
        // T - 0: Due Alert
        stage = 'DUE_ALERT';
        channel = 'WHATSAPP';
        preview = `URGENT: Today is the due date for ${inv.studentName}'s Term 2 fee (₹${inv.balanceAmount.toLocaleString()}). Please settle today to avoid late fees.`;
      } else if (diffDays < 0 && diffDays >= -14) {
        // T + 1 to T + 14: Overdue + Late Fee Escalation
        stage = 'OVERDUE_LATE_FEE';
        const overdueDays = Math.abs(diffDays);
        // Late fee calculation: 5% of tuition or ₹50/day flat rate
        lateFee = Math.round(Math.min(inv.tuitionFee * 0.05, overdueDays * 100));
        channel = 'SMS';
        preview = `OVERDUE NOTICE: Fee payment for ${inv.studentName} is ${overdueDays} days overdue. Late fee of ₹${lateFee} has been accrued. Balance payable: ₹${(inv.balanceAmount + lateFee).toLocaleString()}.`;
        paymentPlanEligible = true;
      } else if (diffDays < -14) {
        // 15+ days overdue: Severe escalation & Offer Flexible Payment Plan
        stage = 'PAYMENT_PLAN_OFFER';
        const overdueDays = Math.abs(diffDays);
        lateFee = Math.round(Math.min(inv.tuitionFee * 0.08, overdueDays * 100));
        channel = 'EMAIL';
        preview = `FEE RELIEF NOTICE: Overdue payment for ${inv.studentName} has reached ${overdueDays} days. Krypton School has unlocked an automatic 3-Month Interest-Free Installment Payment Plan to assist your family.`;
        paymentPlanEligible = true;
      } else {
        continue;
      }

      notices.push({
        id: `dun-${inv.id}`,
        invoiceId: inv.id,
        studentId: inv.studentId,
        studentName: inv.studentName,
        guardianName: inv.guardianName,
        guardianPhone: inv.guardianPhone,
        guardianEmail: inv.guardianEmail,
        stage,
        dueDate: inv.dueDate,
        daysRemainingOrOverdue: diffDays,
        originalAmount: inv.balanceAmount,
        lateFeeAmount: lateFee,
        totalPayable: inv.balanceAmount + lateFee,
        currency: 'INR',
        channel,
        messagePreview: preview,
        sentAt: undefined,
        paymentPlanEligible,
        paymentPlanOffered: inv.status === 'PAYMENT_PLAN',
      });
    }

    return notices;
  }

  // Create an automatic Payment Plan (Installment offer)
  createPaymentPlan(invoiceId: string, installmentsCount: 2 | 3 | 4 = 3): PaymentPlan {
    const invoices = this.getInvoices();
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) throw new Error('Invoice not found');

    const totalToSplit = inv.balanceAmount + (inv.lateFee || 0);
    const installmentAmount = Math.round(totalToSplit / installmentsCount);

    const installments: PaymentPlanInstallment[] = [];
    const baseDate = new Date('2026-10-15');

    for (let i = 1; i <= installmentsCount; i++) {
      const nextDue = new Date(baseDate);
      nextDue.setMonth(baseDate.getMonth() + (i - 1));
      installments.push({
        installmentNumber: i,
        dueDate: nextDue.toISOString().split('T')[0],
        amount: i === installmentsCount ? totalToSplit - installmentAmount * (installmentsCount - 1) : installmentAmount,
        status: i === 1 ? 'PENDING' : 'PENDING',
      });
    }

    const plan: PaymentPlan = {
      id: `plan-${Date.now().toString(36)}`,
      invoiceId: inv.id,
      studentId: inv.studentId,
      studentName: inv.studentName,
      totalAmount: totalToSplit,
      installmentsCount,
      installments,
      interestRatePercent: 0, // 0% relief
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    // Update invoice status to PAYMENT_PLAN
    inv.status = 'PAYMENT_PLAN';
    inv.paymentPlanId = plan.id;
    this.saveInvoices(invoices);

    // Save plan
    const plans = this.getPaymentPlans();
    plans.push(plan);
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.PAYMENT_PLANS, JSON.stringify(plans));
    }

    return plan;
  }

  getPaymentPlans(): PaymentPlan[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENT_PLANS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // ===================== CONCESSION MATRIX =====================
  getConcessionRules(): ConcessionRule[] {
    if (!this.isBrowser()) return INITIAL_CONCESSION_RULES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONCESSION_RULES);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.CONCESSION_RULES, JSON.stringify(INITIAL_CONCESSION_RULES));
      return INITIAL_CONCESSION_RULES;
    } catch {
      return INITIAL_CONCESSION_RULES;
    }
  }

  saveConcessionRules(rules: ConcessionRule[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.CONCESSION_RULES, JSON.stringify(rules));
  }

  // Evaluate Concession Matrix for all students
  evaluateConcessionsMatrix(): StudentConcessionMatch[] {
    const invoices = this.getInvoices();
    const rules = this.getConcessionRules();

    // Group by guardian phone to identify siblings
    const guardianMap: Record<string, DemoInvoice[]> = {};
    for (const inv of invoices) {
      const phone = inv.guardianPhone.trim();
      if (!guardianMap[phone]) guardianMap[phone] = [];
      guardianMap[phone].push(inv);
    }

    const results: StudentConcessionMatch[] = [];

    for (const inv of invoices) {
      const siblingsWithSameParent = guardianMap[inv.guardianPhone.trim()] || [];
      const siblingCount = siblingsWithSameParent.length;
      const siblingNames = siblingsWithSameParent.filter((s) => s.id !== inv.id).map((s) => s.studentName);

      // Check Staff child (guardianName includes "Staff" or matching Staff list)
      const isStaffChild = inv.guardianName.toLowerCase().includes('staff') || inv.guardianEmail.includes('@kryptonschool.edu');

      // Check Merit GPA (example: Rahul Krishnan has merit)
      const isMerit = inv.studentName.includes('Rahul Krishnan');
      const academicGpa = isMerit ? 95.4 : 84.0;

      const appliedConcessions: StudentConcessionMatch['appliedConcessions'] = [];
      let totalConcession = 0;

      // 1. Sibling Rule Check
      if (siblingCount >= 2 && siblingsWithSameParent[1]?.id === inv.id) {
        // Second child gets 15%
        const sibRule = rules.find((r) => r.id === 'rule-sibling-2' && r.isActive);
        if (sibRule) {
          const discount = Math.round((inv.tuitionFee * sibRule.discountPercentage) / 100);
          appliedConcessions.push({
            ruleId: sibRule.id,
            ruleName: sibRule.name,
            concessionType: 'SIBLING',
            discountAmount: discount,
            description: `15% discount for 2nd sibling (${siblingNames.join(', ')})`,
          });
          totalConcession += discount;
        }
      } else if (siblingCount >= 3 && siblingsWithSameParent[2]?.id === inv.id) {
        // Third child gets 25%
        const sibRule = rules.find((r) => r.id === 'rule-sibling-3' && r.isActive);
        if (sibRule) {
          const discount = Math.round((inv.tuitionFee * sibRule.discountPercentage) / 100);
          appliedConcessions.push({
            ruleId: sibRule.id,
            ruleName: sibRule.name,
            concessionType: 'SIBLING',
            discountAmount: discount,
            description: `25% discount for 3rd sibling (${siblingNames.join(', ')})`,
          });
          totalConcession += discount;
        }
      }

      // 2. Staff Dependent Concession
      if (isStaffChild) {
        const staffRule = rules.find((r) => r.id === 'rule-staff-child' && r.isActive);
        if (staffRule) {
          const discount = Math.round((inv.tuitionFee * staffRule.discountPercentage) / 100);
          appliedConcessions.push({
            ruleId: staffRule.id,
            ruleName: staffRule.name,
            concessionType: 'STAFF_CHILD',
            discountAmount: discount,
            description: `50% institutional waiver for staff child`,
          });
          totalConcession += discount;
        }
      }

      // 3. Merit Scholarship Check
      if (isMerit && academicGpa >= 90) {
        const meritRule = rules.find((r) => r.id === 'rule-merit-super' && r.isActive);
        if (meritRule) {
          const discount = Math.round((inv.tuitionFee * meritRule.discountPercentage) / 100);
          appliedConcessions.push({
            ruleId: meritRule.id,
            ruleName: meritRule.name,
            concessionType: 'MERIT',
            discountAmount: discount,
            description: `30% Merit Scholarship (Academic Score ${academicGpa}%)`,
          });
          totalConcession += discount;
        }
      }

      results.push({
        studentId: inv.studentId,
        studentName: inv.studentName,
        admissionNumber: inv.admissionNumber,
        grade: inv.grade,
        siblingCount,
        siblingNames,
        isStaffChild,
        staffParentName: isStaffChild ? 'Lakshmi Menon (PGT)' : undefined,
        academicGpaPercent: academicGpa,
        appliedConcessions,
        originalTuition: inv.tuitionFee,
        totalConcessionAmount: totalConcession,
        netTuitionPayable: Math.max(0, inv.tuitionFee - totalConcession),
      });
    }

    return results;
  }

  // ===================== STAFF HRMS & 1-CLICK PAYROLL =====================
  getStaffProfiles(): StaffPayrollProfile[] {
    if (!this.isBrowser()) return INITIAL_STAFF_PROFILES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAFF_PROFILES);
      if (data) return JSON.parse(data);
      localStorage.setItem(STORAGE_KEYS.STAFF_PROFILES, JSON.stringify(INITIAL_STAFF_PROFILES));
      return INITIAL_STAFF_PROFILES;
    } catch {
      return INITIAL_STAFF_PROFILES;
    }
  }

  // Generate payslip for an individual staff member
  calculateStaffPayslip(
    profile: StaffPayrollProfile,
    month: string = 'October 2026',
    year: number = 2026,
    unpaidLeaves: number = 0,
    payrollRunId: string = 'RUN-OCT-2026'
  ): StaffPayslip {
    const totalWorkingDays = 26; // Mon-Sat excluding holidays
    const approvedPaidLeaves = 2;
    const daysPresent = Math.max(0, totalWorkingDays - (approvedPaidLeaves + unpaidLeaves));

    const { basicSalary, hra, travelAllowance, specialAllowance, providentFundRate, professionalTax, tdsRate } =
      profile.salaryComponents;

    const totalEarnings = basicSalary + hra + travelAllowance + specialAllowance;

    // Daily rate for unpaid leave deduction: gross / totalWorkingDays
    const dailyRate = Math.round(totalEarnings / totalWorkingDays);
    const leaveDeductionAmount = unpaidLeaves * dailyRate;

    // Standard Deductions
    const pfDeduction = Math.round((basicSalary * providentFundRate) / 100);
    const tdsDeduction = Math.round((totalEarnings * tdsRate) / 100);
    const totalDeductions = pfDeduction + tdsDeduction + professionalTax + leaveDeductionAmount;

    const netPayable = Math.max(0, totalEarnings - totalDeductions);

    const ref = `SAL-${year}-${profile.staffNumber}-${Math.floor(1000 + Math.random() * 9000)}`;
    const hash = `KRYP-SEC-${profile.id.toUpperCase()}-${Date.now().toString(16).toUpperCase()}`;

    return {
      id: `ps-${profile.id}-${year}-${month.replace(/\s+/g, '')}`,
      payrollRunId,
      staffId: profile.staffId,
      staffNumber: profile.staffNumber,
      staffName: profile.fullName,
      department: profile.department,
      position: profile.position,
      month,
      year,
      payPeriod: `01 ${month} - 31 ${month}`,
      paymentDate: '2026-10-31',
      bankDetails: {
        bankName: profile.bankAccount.bankName,
        accountNumberMasked: profile.bankAccount.accountNumber,
        ifscOrCode: profile.bankAccount.routingOrIfsc,
      },
      totalWorkingDays,
      daysPresent,
      approvedPaidLeaves,
      unpaidLeaves,
      leaveDeductionAmount,
      basicSalary,
      hra,
      travelAllowance,
      specialAllowance,
      totalEarnings,
      pfDeduction,
      tdsDeduction,
      professionalTax,
      unpaidLeaveDeduction: leaveDeductionAmount,
      totalDeductions,
      netPayable,
      currency: 'INR',
      paymentStatus: 'PROCESSED',
      paymentReference: ref,
      verificationHash: hash,
      generatedAt: new Date().toISOString(),
    };
  }

  // 1-Click Monthly Payroll Run Execution
  executeMonthlyPayrollRun(
    month: string = 'October 2026',
    year: number = 2026,
    leaveMap: Record<string, number> = { 'st-02': 1, 'st-05': 2 }
  ): MonthlyPayrollRun {
    const profiles = this.getStaffProfiles();
    const runId = `RUN-${month.slice(0, 3).toUpperCase()}-${year}-${Math.floor(100 + Math.random() * 900)}`;

    const payslips: StaffPayslip[] = profiles.map((p) => {
      const unpaid = leaveMap[p.id] || 0;
      return this.calculateStaffPayslip(p, month, year, unpaid, runId);
    });

    const totalGrossPayout = payslips.reduce((acc, curr) => acc + curr.totalEarnings, 0);
    const totalDeductions = payslips.reduce((acc, curr) => acc + curr.totalDeductions, 0);
    const totalNetDisbursed = payslips.reduce((acc, curr) => acc + curr.netPayable, 0);

    const run: MonthlyPayrollRun = {
      id: runId,
      month,
      year,
      totalStaffCount: profiles.length,
      totalGrossPayout,
      totalDeductions,
      totalNetDisbursed,
      currency: 'INR',
      runStatus: 'COMPLETED',
      processedBy: 'Manoj Kumar (Senior Finance Officer)',
      processedAt: new Date().toISOString(),
      payslips,
    };

    const existingRuns = this.getPayrollRuns();
    const filtered = existingRuns.filter((r) => !(r.month === month && r.year === year));
    filtered.unshift(run);

    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEYS.PAYROLL_RUNS, JSON.stringify(filtered));
    }

    return run;
  }

  getPayrollRuns(): MonthlyPayrollRun[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYROLL_RUNS);
      if (data) return JSON.parse(data);
      // Generate default completed run for demo
      const defRun = this.executeMonthlyPayrollRun('October 2026', 2026);
      return [defRun];
    } catch {
      return [];
    }
  }

  // Summary Metrics for executive dashboard
  getSummaryMetrics(): FinanceSummaryMetrics {
    const invoices = this.getInvoices();
    const staff = this.getStaffProfiles();
    const dunning = this.evaluateDunningSchedule(invoices);

    const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalCollected = invoices.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const outstandingBalance = invoices.reduce((acc, curr) => acc + curr.balanceAmount, 0);
    const concessionsGranted = invoices.reduce((acc, curr) => acc + (curr.concessionApplied || 0), 0);
    const monthlyPayrollLiability = staff.reduce((acc, curr) => acc + curr.monthlyGrossSalary, 0);

    const collectionRatePercent = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

    return {
      totalInvoiced,
      totalCollected,
      outstandingBalance,
      collectionRatePercent,
      dunningNoticesPending: dunning.length,
      concessionsGrantedTotal: concessionsGranted,
      monthlyPayrollLiability,
      currency: 'INR',
    };
  }
}

export const financeClient = new FinanceClientService();
