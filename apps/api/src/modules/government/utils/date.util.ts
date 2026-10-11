/**
 * Date utility functions for government integration
 */
export class DateUtil {
  /**
   * Get Kenyan academic terms for a given year
   */
  static getKenyanAcademicTerms(year: number): Array<{
    term: number;
    name: string;
    startDate: Date;
    endDate: Date;
  }> {
    return [
      {
        term: 1,
        name: 'Term 1',
        startDate: new Date(year, 0, 2), // January 2
        endDate: new Date(year, 3, 15), // April 15
      },
      {
        term: 2,
        name: 'Term 2',
        startDate: new Date(year, 4, 1), // May 1
        endDate: new Date(year, 7, 15), // August 15
      },
      {
        term: 3,
        name: 'Term 3',
        startDate: new Date(year, 8, 1), // September 1
        endDate: new Date(year, 10, 30), // November 30
      },
    ];
  }

  /**
   * Get current academic term
   */
  static getCurrentTerm(date: Date = new Date()): {
    term: number;
    name: string;
    year: number;
  } | null {
    const year = date.getFullYear();
    const terms = this.getKenyanAcademicTerms(year);

    for (const term of terms) {
      if (date >= term.startDate && date <= term.endDate) {
        return {
          term: term.term,
          name: term.name,
          year,
        };
      }
    }

    // If between terms, return the next term
    const nextYear = year + 1;
    const nextTerms = this.getKenyanAcademicTerms(nextYear);
    
    if (date > terms[2].endDate) {
      return {
        term: 1,
        name: 'Term 1',
        year: nextYear,
      };
    }

    return null;
  }

  /**
   * Get next academic term
   */
  static getNextTerm(currentTerm: number, currentYear: number): {
    term: number;
    year: number;
  } {
    if (currentTerm === 3) {
      return { term: 1, year: currentYear + 1 };
    }
    return { term: currentTerm + 1, year: currentYear };
  }

  /**
   * Calculate school days between two dates (excluding weekends)
   */
  static calculateSchoolDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // Exclude weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Get Kenyan public holidays for a given year
   */
  static getKenyanPublicHolidays(year: number): Array<{
    name: string;
    date: Date;
  }> {
    return [
      { name: 'New Year\'s Day', date: new Date(year, 0, 1) },
      { name: 'Labour Day', date: new Date(year, 4, 1) },
      { name: 'Madaraka Day', date: new Date(year, 5, 1) },
      { name: 'Mashujaa Day', date: new Date(year, 9, 20) },
      { name: 'Jamhuri Day', date: new Date(year, 11, 12) },
      { name: 'Christmas Day', date: new Date(year, 11, 25) },
      { name: 'Boxing Day', date: new Date(year, 11, 26) },
      // Note: Eid ul-Fitr and Eid ul-Adha dates vary and should be added dynamically
    ];
  }

  /**
   * Check if a date is a Kenyan public holiday
   */
  static isPublicHoliday(date: Date): boolean {
    const holidays = this.getKenyanPublicHolidays(date.getFullYear());
    return holidays.some(holiday => 
      holiday.date.getDate() === date.getDate() &&
      holiday.date.getMonth() === date.getMonth()
    );
  }

  /**
   * Check if a date is a school day
   */
  static isSchoolDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    // Not a weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    // Not a public holiday
    if (this.isPublicHoliday(date)) return false;
    // Within term dates
    const currentTerm = this.getCurrentTerm(date);
    return currentTerm !== null;
  }

  /**
   * Get age from date of birth
   */
  static calculateAge(dateOfBirth: Date, referenceDate: Date = new Date()): number {
    const age = referenceDate.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = referenceDate.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dateOfBirth.getDate())) {
      return age - 1;
    }
    
    return age;
  }

  /**
   * Format date range
   */
  static formatDateRange(startDate: Date, endDate: Date): string {
    const start = startDate.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const end = endDate.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return `${start} - ${end}`;
  }

  /**
   * Get start and end of month
   */
  static getMonthBounds(year: number, month: number): {
    start: Date;
    end: Date;
  } {
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0),
    };
  }

  /**
   * Get start and end of year
   */
  static getYearBounds(year: number): {
    start: Date;
    end: Date;
  } {
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 11, 31),
    };
  }

  /**
   * Get quarter bounds
   */
  static getQuarterBounds(year: number, quarter: number): {
    start: Date;
    end: Date;
  } {
    const startMonth = (quarter - 1) * 3;
    const endMonth = startMonth + 2;
    
    return {
      start: new Date(year, startMonth, 1),
      end: new Date(year, endMonth + 1, 0),
    };
  }

  /**
   * Add business days to a date
   */
  static addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let addedDays = 0;

    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !this.isPublicHoliday(result)) {
        addedDays++;
      }
    }

    return result;
  }

  /**
   * Get days until deadline
   */
  static getDaysUntilDeadline(deadline: Date): number {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if deadline is approaching (within specified days)
   */
  static isDeadlineApproaching(deadline: Date, daysThreshold: number = 7): boolean {
    const daysUntil = this.getDaysUntilDeadline(deadline);
    return daysUntil >= 0 && daysUntil <= daysThreshold;
  }

  /**
   * Check if date is overdue
   */
  static isOverdue(deadline: Date): boolean {
    return deadline < new Date();
  }

  /**
   * Get fiscal year (Kenya: July - June)
   */
  static getFiscalYear(date: Date = new Date()): {
    startYear: number;
    endYear: number;
    startDate: Date;
    endDate: Date;
  } {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Fiscal year starts in July (month 6)
    const startYear = month >= 6 ? year : year - 1;
    const endYear = startYear + 1;

    return {
      startYear,
      endYear,
      startDate: new Date(startYear, 6, 1), // July 1
      endDate: new Date(endYear, 5, 30), // June 30
    };
  }

  /**
   * Convert date to ISO string (YYYY-MM-DD)
   */
  static toIsoDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Parse ISO date string safely
   */
  static parseIsoDate(dateString: string): Date | null {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }
}
