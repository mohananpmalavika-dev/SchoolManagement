/**
 * Validation Utilities
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Indian phone number
 */
export function isValidIndianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\+]/g, '');

  // Valid formats:
  // 9847012345 (10 digits starting with 6-9)
  // 09847012345 (11 digits starting with 0)
  // 919847012345 (12 digits starting with 91)
  return /^(91|0)?[6-9]\d{9}$/.test(cleaned);
}

/**
 * Validate Aadhaar number (12 digits) or masked last-4 format (XXXX-XXXX-1234 or 4 digits)
 */
export function isValidAadhaarLast4(value: string): boolean {
  const cleaned = value.replace(/[\s-]/g, '');
  return /^\d{4}$/.test(cleaned) || /^X{8}\d{4}$/i.test(cleaned) || /^\d{12}$/.test(cleaned);
}

/**
 * Validate APAAR ID (12-digit Academic Bank of Credits / APAAR ID)
 */
export function isValidApaarId(apaarId: string): boolean {
  return /^\d{12}$/.test(apaarId.replace(/[\s-]/g, ''));
}

/**
 * Validate Indian PIN code (6 digits, cannot start with 0)
 */
export function isValidPincode(pincode: string): boolean {
  return /^[1-9]\d{5}$/.test(pincode.trim());
}

/**
 * Validate UDISE+ 11-digit school code
 */
export function isValidUdiseCode(code: string): boolean {
  return /^\d{11}$/.test(code.trim());
}

/**
 * Validate birth certificate number (India municipal/panchayat registration)
 */
export function isValidBirthCertNumber(certNumber: string): boolean {
  return /^[A-Z0-9\/-]{6,30}$/i.test(certNumber.trim());
}

/**
 * Validate admission number
 */
export function isValidAdmissionNumber(admissionNumber: string): boolean {
  // Alphanumeric, 3-20 characters
  return /^[A-Z0-9]{3,20}$/i.test(admissionNumber);
}

/**
 * Validate password strength
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string (remove potentially dangerous characters)
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

/**
 * Validate non-negative number
 */
export function isNonNegativeNumber(value: any): boolean {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

/**
 * Validate amount (must be positive integer in minor units)
 */
export function isValidAmount(amount: any): boolean {
  const num = Number(amount);
  return Number.isInteger(num) && num > 0;
}

/**
 * Validate UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
