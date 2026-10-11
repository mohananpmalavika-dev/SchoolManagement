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
 * Validate Kenyan phone number
 */
export function isValidKenyanPhone(phone: string): boolean {
  // Remove spaces, dashes, and plus signs
  const cleaned = phone.replace(/[\s\-\+]/g, '');
  
  // Valid formats:
  // 0712345678 (10 digits starting with 07 or 01)
  // 254712345678 (12 digits starting with 254)
  // 712345678 (9 digits)
  
  return /^(254|0)?[17]\d{8}$/.test(cleaned);
}

/**
 * Validate national ID (Kenya)
 */
export function isValidKenyanNationalId(id: string): boolean {
  // Kenyan national IDs are typically 7-8 digits
  const cleaned = id.replace(/\s/g, '');
  return /^\d{7,8}$/.test(cleaned);
}

/**
 * Validate birth certificate number (Kenya)
 */
export function isValidBirthCertNumber(certNumber: string): boolean {
  // Kenyan birth certificates vary in format
  // Basic validation: alphanumeric, 6-20 characters
  return /^[A-Z0-9]{6,20}$/i.test(certNumber);
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
