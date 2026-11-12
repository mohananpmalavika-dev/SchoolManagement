/**
 * Currency Utilities
 * Handle all currency operations in minor units (paise) for precision
 */

export const CURRENCY_PRECISION = 2;
export const MINOR_UNIT_MULTIPLIER = 100;

/**
 * Convert major units to minor units (e.g., INR 15.50 -> 1550 paise)
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * MINOR_UNIT_MULTIPLIER);
}

/**
 * Convert minor units to major units (e.g., 1550 paise -> INR 15.50)
 */
export function toMajorUnits(amount: number): number {
  return amount / MINOR_UNIT_MULTIPLIER;
}

/**
 * Format amount in minor units to currency string (default INR / en-IN)
 */
export function formatCurrency(
  amountInMinorUnits: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
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
  locale: string = 'en-IN'
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
  return Math.round((part / total) * 100 * 100) / 100;
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
 * Normalize Indian mobile number to 91XXXXXXXXXX
 */
export function formatIndianPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+]/g, '');

  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '91' + cleaned.substring(1);
  }

  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }

  return cleaned;
}

/**
 * Validate Indian mobile number (10 digits starting 6-9, optional +91/0 prefix)
 */
export function isValidIndianPhoneNumber(phone: string): boolean {
  const formatted = formatIndianPhone(phone);
  return /^91[6-9]\d{9}$/.test(formatted);
}

/**
 * Validate UPI Virtual Payment Address (e.g., parent@okhdfcbank)
 */
export function isValidUpiId(vpa: string): boolean {
  return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(vpa.trim());
}
