/**
 * Date utility functions for Indian government & academic compliance (April–March academic year, IST)
 */
export class DateUtil {
  /**
   * Get Indian academic terms for a given start year (April–March)
   */
  static getIndianAcademicTerms(startYear: number): Array<{
    term: number;
    name: string;
    startDate: Date;
    endDate: Date;
  }> {
    return [
      {
        term: 1,
        name: 'Term 1 (Apr - Sep)',
        startDate: new Date(startYear, 3, 1), // April 1
        endDate: new Date(startYear, 8, 30), // September 30
      },
      {
        term: 2,
        name: 'Term 2 (Oct - Mar)',
        startDate: new Date(startYear, 9, 1), // October 1
        endDate: new Date(startYear + 1, 2, 31), // March 31
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
    const startYear = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
    const terms = this.getIndianAcademicTerms(startYear);

    for (const term of terms) {
      if (date >= term.startDate && date <= term.endDate) {
        return {
          term: term.term,
          name: term.name,
          year: startYear,
        };
      }
    }

    return {
      term: 1,
      name: 'Term 1 (Apr - Sep)',
      year: startYear,
    };
  }

  /**
   * Get next academic term
   */
  static getNextTerm(
    currentTerm: number,
    currentYear: number,
  ): {
    term: number;
    year: number;
  } {
    if (currentTerm >= 2) {
      return { term: 1, year: currentYear + 1 };
    }
    return { term: currentTerm + 1, year: currentYear };
  }

  /**
   * Calculate school days between two dates (excluding Sundays; Indian CBSE/State standard)
   */
  static calculateSchoolDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Get Indian national & major school holidays for a given year
   */
  static getIndianNationalHolidays(year: number): Array<{
    name: string;
    date: Date;
  }> {
    return [
      { name: "New Year's Day", date: new Date(year, 0, 1) },
      { name: 'Republic Day', date: new Date(year, 0, 26) },
      { name: 'May Day / Labour Day', date: new Date(year, 4, 1) },
      { name: 'Independence Day', date: new Date(year, 7, 15) },
      { name: 'Kerala Piravi / Foundation Day', date: new Date(year, 10, 1) },
      { name: 'Gandhi Jayanti', date: new Date(year, 9, 2) },
      { name: "Children's Day", date: new Date(year, 10, 14) },
      { name: 'Christmas Day', date: new Date(year, 11, 25) },
    ];
  }

  static formatDate(date: Date, format: 'ISO' | 'DD/MM/YYYY' | 'YYYY-MM-DD' = 'YYYY-MM-DD'): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    switch (format) {
      case 'ISO':
        return d.toISOString();
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
      default:
        return `${year}-${month}-${day}`;
    }
  }

  static getStartOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  static getEndOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  static getStartOfQuarter(year: number, quarter: number): Date {
    const month = (quarter - 1) * 3;
    return new Date(year, month, 1, 0, 0, 0, 0);
  }

  static getEndOfQuarter(year: number, quarter: number): Date {
    const month = quarter * 3;
    return new Date(year, month, 0, 23, 59, 59, 999);
  }

  static getCurrentQuarter(date: Date = new Date()): number {
    return Math.floor(date.getMonth() / 3) + 1;
  }

  static isWithinDays(date: Date, days: number): boolean {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const daysDiff = diff / (1000 * 60 * 60 * 24);
    return daysDiff >= 0 && daysDiff <= days;
  }

  static isOverdue(dueDate: Date): boolean {
    return new Date() > new Date(dueDate);
  }

  static daysUntil(date: Date): number {
    const now = new Date();
    const diff = new Date(date).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static getReportingPeriodName(
    type: 'MONTHLY' | 'TERMLY' | 'QUARTERLY' | 'ANNUAL',
    date: Date = new Date(),
  ): string {
    const year = date.getFullYear();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    switch (type) {
      case 'MONTHLY':
        return `${monthNames[date.getMonth()]} ${year}`;
      case 'TERMLY': {
        const term = this.getCurrentTerm(date);
        return term ? `${term.name} ${term.year}` : `${year}`;
      }
      case 'QUARTERLY':
        return `Q${this.getCurrentQuarter(date)} ${year}`;
      case 'ANNUAL':
      default: {
        const startYear = date.getMonth() >= 3 ? year : year - 1;
        return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
      }
    }
  }
}
