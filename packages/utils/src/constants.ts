/**
 * Application Constants (India Education System - CBSE, ICSE, State Boards)
 */

export const INDIAN_EDUCATION_LEVELS = {
  PRE_PRIMARY: 'Pre-Primary',
  PRIMARY: 'Primary',
  MIDDLE: 'Middle',
  SECONDARY: 'Secondary',
  SENIOR_SECONDARY: 'Senior Secondary',
} as const;

export const INDIAN_EDUCATION_BOARDS = [
  'CBSE',
  'ICSE',
  'STATE_BOARD',
  'IB',
  'IGCSE',
] as const;

export const PRE_PRIMARY_CLASSES = ['Nursery', 'LKG', 'UKG'] as const;

export const PRIMARY_CLASSES = [
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
] as const;

export const MIDDLE_CLASSES = [
  'Class 6',
  'Class 7',
  'Class 8',
] as const;

export const SECONDARY_CLASSES = [
  'Class 9',
  'Class 10',
] as const;

export const SENIOR_SECONDARY_CLASSES = [
  'Class 11',
  'Class 12',
] as const;

export const ALL_INDIAN_CLASSES = [
  ...PRE_PRIMARY_CLASSES,
  ...PRIMARY_CLASSES,
  ...MIDDLE_CLASSES,
  ...SECONDARY_CLASSES,
  ...SENIOR_SECONDARY_CLASSES,
] as const;

// Standard CBSE / NCERT / State Board Subjects
export const INDIAN_SCHOOL_SUBJECTS = [
  { code: 'MATH', name: 'Mathematics' },
  { code: 'ENG', name: 'English' },
  { code: 'HIN', name: 'Hindi' },
  { code: 'MAL', name: 'Malayalam' },
  { code: 'SAN', name: 'Sanskrit' },
  { code: 'SCI', name: 'Science' },
  { code: 'EVS', name: 'Environmental Studies (EVS)' },
  { code: 'SST', name: 'Social Science' },
  { code: 'CS', name: 'Computer Science & AI' },
  { code: 'PHY', name: 'Physics' },
  { code: 'CHEM', name: 'Chemistry' },
  { code: 'BIO', name: 'Biology' },
  { code: 'ACC', name: 'Accountancy' },
  { code: 'BST', name: 'Business Studies' },
  { code: 'ECO', name: 'Economics' },
  { code: 'PE', name: 'Physical Education' },
  { code: 'ART', name: 'Art & Craft' },
] as const;

// Payment Methods
export const PAYMENT_METHODS = {
  RAZORPAY: 'Razorpay',
  UPI: 'UPI',
  NET_BANKING: 'NetBanking (NEFT/RTGS/IMPS)',
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque / DD',
  CARD: 'Card',
  OTHER: 'Other',
} as const;

// Fee Categories
export const FEE_CATEGORIES = {
  TUITION: 'Tuition Fee',
  ADMISSION: 'Admission Fee',
  EXAMINATION: 'Examination Fee',
  TRANSPORT: 'Bus / Transport Fee',
  BOARDING: 'Hostel / Boarding Fee',
  MEALS: 'Canteen / Mess Fee',
  LIBRARY: 'Library Fee',
  SPORTS: 'Sports & Games Fee',
  ACTIVITY: 'Co-Curricular / Activity Fee',
  UNIFORM: 'Uniform Fee',
  BOOKS: 'Books & Stationery',
  LABORATORY: 'Science & Computer Lab Fee',
  OTHER: 'Other Fee',
} as const;

// Indian States and Union Territories
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export const KERALA_DISTRICTS = [
  'Alappuzha',
  'Ernakulam',
  'Idukki',
  'Kannur',
  'Kasaragod',
  'Kollam',
  'Kottayam',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Pathanamthitta',
  'Thiruvananthapuram',
  'Thrissur',
  'Wayanad',
] as const;

// Days of Week
export const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// File Upload Limits
export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// API Rate Limits
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;

// Session/Token Expiry
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const SESSION_EXPIRY_DAYS = 7;

// Razorpay & UPI (in paise)
export const GATEWAY_TIMEOUT_SECONDS = 300;
export const RAZORPAY_MIN_AMOUNT = 100; // INR 1.00 (100 paise)
export const UPI_MAX_AMOUNT = 10000000; // INR 1,00,000 (NPCI per-txn cap)
