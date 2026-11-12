/**
 * Date Utilities
 */

import { format, parseISO, isValid, addDays, differenceInDays, startOfDay, endOfDay } from 'date-fns';

export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
export const DEFAULT_DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
export const DISPLAY_DATE_FORMAT = 'dd MMM yyyy';
export const DISPLAY_DATETIME_FORMAT = 'dd MMM yyyy, HH:mm';

/**
 * Format date to string
 */
export function formatDate(date: Date | string, formatString: string = DISPLAY_DATE_FORMAT): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) {
    return '';
  }
  
  return format(dateObj, formatString);
}

/**
 * Format datetime to string
 */
export function formatDateTime(date: Date | string, formatString: string = DISPLAY_DATETIME_FORMAT): string {
  return formatDate(date, formatString);
}

/**
 * Format date for API (ISO format)
 */
export function formatDateForAPI(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) {
    throw new Error('Invalid date');
  }
  
  return format(dateObj, DEFAULT_DATE_FORMAT);
}

/**
 * Parse date string
 */
export function parseDate(dateString: string): Date {
  const date = parseISO(dateString);
  
  if (!isValid(date)) {
    throw new Error('Invalid date string');
  }
  
  return date;
}

/**
 * Check if date is valid
 */
export function isValidDate(date: any): boolean {
  if (date instanceof Date) {
    return isValid(date);
  }
  
  if (typeof date === 'string') {
    return isValid(parseISO(date));
  }
  
  return false;
}

/**
 * Get current Indian academic year (defaults to April start -> e.g., 2026-27)
 */
export function getCurrentAcademicYear(startMonth: number = 4): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

  const startYear = currentMonth >= startMonth ? currentYear : currentYear - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  const today = new Date();
  
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Check if date is overdue
 */
export function isOverdue(dueDate: Date | string): boolean {
  const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  return due < new Date();
}

/**
 * Get days until due date
 */
export function daysUntilDue(dueDate: Date | string): number {
  const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  return differenceInDays(due, new Date());
}

/**
 * Add days to date
 */
export function addDaysToDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addDays(dateObj, days);
}

/**
 * Get start of day
 */
export function getStartOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(dateObj);
}

/**
 * Get end of day
 */
export function getEndOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(dateObj);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Get Indian academic term dates (standard April–March 2-term CBSE/ICSE system)
 */
export function getIndianAcademicTermDates(startYear: number) {
  return {
    term1: {
      start: new Date(startYear, 3, 1), // April 1
      end: new Date(startYear, 8, 30), // September 30
    },
    term2: {
      start: new Date(startYear, 9, 1), // October 1
      end: new Date(startYear + 1, 2, 31), // March 31
    },
  };
}
