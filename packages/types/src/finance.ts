export type PaymentGatewayType =
  | 'RAZORPAY'
  | 'UPI'
  | 'NET_BANKING'
  | 'CARD'
  | 'STRIPE'
  | 'PAYPAL';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  exchangeRateToUSD: number; // For multi-currency checkout display
}

export type DunningStage =
  | 'UPCOMING_SOFT'       // 7 days before due date
  | 'DUE_ALERT'           // On due date (0 days)
  | 'OVERDUE_LATE_FEE'    // 1-14 days overdue (late fee applied)
  | 'PAYMENT_PLAN_OFFER'  // 15+ days overdue (automatic installment offer)
  | 'SETTLED';            // Paid in full

export interface DunningNotice {
  id: string;
  invoiceId: string;
  studentId: string;
  studentName: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  stage: DunningStage;
  dueDate: string;
  daysRemainingOrOverdue: number; // Negative for overdue
  originalAmount: number;
  lateFeeAmount: number;
  totalPayable: number;
  currency: CurrencyCode;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL';
  messagePreview: string;
  sentAt?: string;
  paymentPlanEligible: boolean;
  paymentPlanOffered?: boolean;
}

export interface PaymentPlanInstallment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt?: string;
  paymentReference?: string;
}

export interface PaymentPlan {
  id: string;
  invoiceId: string;
  studentId: string;
  studentName: string;
  totalAmount: number;
  installmentsCount: number;
  installments: PaymentPlanInstallment[];
  interestRatePercent: number; // 0% default for education relief
  status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED';
  createdAt: string;
}

export type ConcessionType =
  | 'SIBLING'
  | 'STAFF_CHILD'
  | 'MERIT'
  | 'NEED_BASED'
  | 'SPORTS_QUOTA'
  | 'EARLY_BIRD';

export interface ConcessionRule {
  id: string;
  name: string;
  nameMl?: string;
  type: ConcessionType;
  discountPercentage: number;
  flatDiscountAmount?: number;
  applicableFeeCategories: string[]; // ['TUITION', 'ADMISSION', etc.]
  criteriaDescription: string;
  isActive: boolean;
  autoApply: boolean;
}

export interface StudentConcessionMatch {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  grade: string;
  siblingCount?: number;
  siblingNames?: string[];
  isStaffChild: boolean;
  staffParentName?: string;
  academicGpaPercent?: number;
  appliedConcessions: {
    ruleId: string;
    ruleName: string;
    concessionType: ConcessionType;
    discountAmount: number;
    description: string;
  }[];
  originalTuition: number;
  totalConcessionAmount: number;
  netTuitionPayable: number;
}

export interface StaffSalaryComponent {
  basicSalary: number;
  hra: number;                    // House Rent Allowance
  travelAllowance: number;
  specialAllowance: number;
  providentFundRate: number;      // e.g. 12%
  professionalTax: number;
  tdsRate: number;                // Tax Deducted at Source %
}

export interface StaffPayrollProfile {
  id: string;
  staffId: string;
  staffNumber: string;
  fullName: string;
  department: string;
  position: string;
  isTeaching: boolean;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    routingOrIfsc: string;
    accountHolder: string;
  };
  salaryComponents: StaffSalaryComponent;
  monthlyGrossSalary: number;
}

export interface PayslipItem {
  name: string;
  amount: number;
  type: 'EARNING' | 'DEDUCTION';
}

export interface StaffPayslip {
  id: string;
  payrollRunId: string;
  staffId: string;
  staffNumber: string;
  staffName: string;
  department: string;
  position: string;
  month: string;           // e.g., "October 2026"
  year: number;
  payPeriod: string;       // "01 Oct 2026 - 31 Oct 2026"
  paymentDate: string;
  bankDetails: {
    bankName: string;
    accountNumberMasked: string;
    ifscOrCode: string;
  };
  
  // Attendance & Leave Metrics
  totalWorkingDays: number;
  daysPresent: number;
  approvedPaidLeaves: number;
  unpaidLeaves: number;
  leaveDeductionAmount: number;

  // Earnings Breakdown
  basicSalary: number;
  hra: number;
  travelAllowance: number;
  specialAllowance: number;
  totalEarnings: number;

  // Deductions Breakdown
  pfDeduction: number;
  tdsDeduction: number;
  professionalTax: number;
  unpaidLeaveDeduction: number;
  totalDeductions: number;

  // Final Net Pay
  netPayable: number;
  currency: CurrencyCode;
  paymentStatus: 'DRAFT' | 'PROCESSED' | 'PAID';
  paymentReference: string;
  verificationHash: string;
  generatedAt: string;
}

export interface MonthlyPayrollRun {
  id: string;
  month: string;
  year: number;
  totalStaffCount: number;
  totalGrossPayout: number;
  totalDeductions: number;
  totalNetDisbursed: number;
  currency: CurrencyCode;
  runStatus: 'DRAFT' | 'EXECUTING' | 'COMPLETED';
  processedBy: string;
  processedAt: string;
  payslips: StaffPayslip[];
}

export interface FinanceSummaryMetrics {
  totalInvoiced: number;
  totalCollected: number;
  outstandingBalance: number;
  collectionRatePercent: number;
  dunningNoticesPending: number;
  concessionsGrantedTotal: number;
  monthlyPayrollLiability: number;
  currency: CurrencyCode;
}
