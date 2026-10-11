/**
 * Application Constants
 */

// Kenyan Education System
export const KENYAN_EDUCATION_LEVELS = {
  PRE_PRIMARY: 'Pre-Primary',
  PRIMARY: 'Primary',
  JUNIOR_SECONDARY: 'Junior Secondary',
  SENIOR_SECONDARY: 'Senior Secondary',
} as const;

export const PRIMARY_GRADES = [
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
] as const;

export const JUNIOR_SECONDARY_GRADES = [
  'Grade 7',
  'Grade 8',
  'Grade 9',
] as const;

export const SENIOR_SECONDARY_FORMS = [
  'Form 1',
  'Form 2',
  'Form 3',
  'Form 4',
] as const;

// Kenyan CBC Subjects (Primary)
export const CBC_PRIMARY_SUBJECTS = [
  { code: 'MATH', name: 'Mathematics' },
  { code: 'ENG', name: 'English' },
  { code: 'KIS', name: 'Kiswahili' },
  { code: 'SCI', name: 'Science and Technology' },
  { code: 'SST', name: 'Social Studies' },
  { code: 'CRE', name: 'Christian Religious Education' },
  { code: 'IRE', name: 'Islamic Religious Education' },
  { code: 'HRE', name: 'Hindu Religious Education' },
  { code: 'CA', name: 'Creative Arts' },
  { code: 'PE', name: 'Physical Education' },
  { code: 'HYGIENE', name: 'Hygiene and Nutrition' },
  { code: 'AGRI', name: 'Agriculture' },
] as const;

// Payment Methods
export const PAYMENT_METHODS = {
  MPESA: 'M-Pesa',
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  CARD: 'Card',
  OTHER: 'Other',
} as const;

// Fee Categories
export const FEE_CATEGORIES = {
  TUITION: 'Tuition',
  ADMISSION: 'Admission',
  EXAMINATION: 'Examination',
  TRANSPORT: 'Transport',
  BOARDING: 'Boarding',
  MEALS: 'Meals',
  LIBRARY: 'Library',
  SPORTS: 'Sports',
  ACTIVITY: 'Activity',
  UNIFORM: 'Uniform',
  BOOKS: 'Books',
  LABORATORY: 'Laboratory',
  OTHER: 'Other',
} as const;

// Kenyan Counties
export const KENYAN_COUNTIES = [
  'Baringo',
  'Bomet',
  'Bungoma',
  'Busia',
  'Elgeyo-Marakwet',
  'Embu',
  'Garissa',
  'Homa Bay',
  'Isiolo',
  'Kajiado',
  'Kakamega',
  'Kericho',
  'Kiambu',
  'Kilifi',
  'Kirinyaga',
  'Kisii',
  'Kisumu',
  'Kitui',
  'Kwale',
  'Laikipia',
  'Lamu',
  'Machakos',
  'Makueni',
  'Mandera',
  'Marsabit',
  'Meru',
  'Migori',
  'Mombasa',
  'Murang\'a',
  'Nairobi',
  'Nakuru',
  'Nandi',
  'Narok',
  'Nyamira',
  'Nyandarua',
  'Nyeri',
  'Samburu',
  'Siaya',
  'Taita-Taveta',
  'Tana River',
  'Tharaka-Nithi',
  'Trans-Nzoia',
  'Turkana',
  'Uasin Gishu',
  'Vihiga',
  'Wajir',
  'West Pokot',
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

// M-Pesa
export const MPESA_TIMEOUT_SECONDS = 30;
export const MPESA_MIN_AMOUNT = 10; // KES 0.10
export const MPESA_MAX_AMOUNT = 70000000; // KES 70,000
