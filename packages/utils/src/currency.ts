/**
 * Currency Utilities
 * Handle all currency operations in minor units (cents) for precision
 */

export const CURRENCY_PRECISION = 2;
export const MINOR_UNIT_MULTIPLIER = 100;

/**
 * Convert major units to minor units (e.g., KES 15.50 -> 1550 cents)
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * MINOR_UNIT_MULTIPLIER);
}

/**
 * Convert minor units to major units (e.g., 1550 cents -> KES 15.50)
 */
export function toMajorUnits(amount: number): number {
  return amount / MINOR_UNIT_MULTIPLIER;
}

/**
 * Format amount in minor units to currency string
 */
export function formatCurrency(
  amountInMinorUnits: number,
  currency: string = 'KES',
  locale: string = 'en-KE'
): string {
  const majorUnits = toMajorUnits(amountInMinorUnits);
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: CURRENCY_PRECISION,
    maximumFractionDigits: CURRENCY_PRECISION,
  }).format(majorUnits);
}

/**
 * Format amount without currency symbol
 */
export function formatAmount(
  amountInMinorUnits: number,
  locale: string = 'en-KE'
): string {
  const majorUnits = toMajorUnits(amountInMinorUnits);
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: CURRENCY_PRECISION,
    maximumFractionDigits: CURRENCY_PRECISION,
  }).format(majorUnits);
}

/**
 * Parse currency string to minor units
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and commas
  const cleaned = currencyString.replace(/[^\d.-]/g, '');
  const amount = parseFloat(cleaned);
  
  if (isNaN(amount)) {
    throw new Error('Invalid currency string');
  }
  
  return toMinorUnits(amount);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate balance
 */
export function calculateBalance(total: number, paid: number): number {
  return Math.max(0, total - paid);
}

/**
 * Check if amount is fully paid
 */
export function isFullyPaid(total: number, paid: number): boolean {
  return paid >= total;
}

/**
 * Check if amount is partially paid
 */
export function isPartiallyPaid(total: number, paid: number): boolean {
  return paid > 0 && paid < total;
}

/**
 * Validate M-Pesa phone number format
 */
export function formatMpesaPhone(phone: string): string {
  // Remove spaces, dashes, and plus signs
  let cleaned = phone.replace(/[\s\-\+]/g, '');
  
  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  // If doesn't start with 254, add it
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
}

/**
 * Validate M-Pesa phone number
 */
export function isValidMpesaPhone(phone: string): boolean {
  const formatted = formatMpesaPhone(phone);
  // Kenyan phone numbers: 254XXXXXXXXX (12 digits)
  return /^254[17]\d{8}$/.test(formatted);
}
