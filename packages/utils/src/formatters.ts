/**
 * Formatter Utilities
 */

/**
 * Format name (capitalize first letter of each word)
 */
export function formatName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format full name
 */
export function formatFullName(
  firstName: string,
  lastName: string,
  middleName?: string
): string {
  const parts = [firstName, middleName, lastName].filter(Boolean);
  return parts.map(formatName).join(' ');
}

/**
 * Get initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
  return (
    firstName.charAt(0).toUpperCase() +
    lastName.charAt(0).toUpperCase()
  );
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as +254 712 345 678
  if (cleaned.startsWith('254')) {
    return `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  
  // Format as 0712 345 678
  if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * Truncate text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format number with commas
 */
export function formatNumber(num: number, locale: string = 'en-KE'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Convert string to slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate random string
 */
export function generateRandomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generate random number string
 */
export function generateRandomNumber(length: number = 6): string {
  const chars = '0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Mask sensitive data
 */
export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    return `${cleaned.slice(0, 3)}****${cleaned.slice(-3)}`;
  }
  return phone;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Pluralize word
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  return `${count} ${plural || singular + 's'}`;
}
