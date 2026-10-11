/**
 * Validation utilities for government integration data
 */
export class ValidationUtil {
  /**
   * Validate Kenyan National ID format
   */
  static isValidNationalId(id: string): boolean {
    // Kenyan National ID is typically 7-8 digits
    const nationalIdRegex = /^\d{7,8}$/;
    return nationalIdRegex.test(id);
  }

  /**
   * Validate Kenyan Birth Certificate Number
   */
  static isValidBirthCertificate(certNumber: string): boolean {
    // Birth certificate format varies, basic validation
    return certNumber && certNumber.length >= 6 && certNumber.length <= 20;
  }

  /**
   * Validate TSC (Teachers Service Commission) Number
   */
  static isValidTscNumber(tscNumber: string): boolean {
    // TSC number format: typically 6 digits
    const tscRegex = /^\d{6}$/;
    return tscRegex.test(tscNumber);
  }

  /**
   * Validate NEMIS UPI (Universal Personal Identifier)
   */
  static isValidNemisUpi(upi: string): boolean {
    // UPI format validation (alphanumeric)
    const upiRegex = /^[A-Z0-9]{8,12}$/;
    return upiRegex.test(upi.toUpperCase());
  }

  /**
   * Validate KNEC Centre Number
   */
  static isValidKnecCentreNumber(centreNumber: string): boolean {
    // Centre number is typically 5 digits
    const centreRegex = /^\d{5}$/;
    return centreRegex.test(centreNumber);
  }

  /**
   * Validate KNEC Candidate Number
   */
  static isValidCandidateNumber(candidateNumber: string): boolean {
    // Candidate number format varies
    return candidateNumber && candidateNumber.length >= 8 && candidateNumber.length <= 15;
  }

  /**
   * Validate KNEC Index Number
   */
  static isValidIndexNumber(indexNumber: string): boolean {
    // Index number format
    const indexRegex = /^\d{2,3}-\d{3,5}-\d{3,5}$/;
    return indexRegex.test(indexNumber);
  }

  /**
   * Validate Kenyan phone number
   */
  static isValidKenyanPhone(phone: string): boolean {
    // Kenyan phone formats: +254..., 254..., 07..., 01...
    const phoneRegex = /^(\+?254|0)[17]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Validate email address
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate date is not in the future
   */
  static isNotFutureDate(date: Date): boolean {
    return date <= new Date();
  }

  /**
   * Validate age is within reasonable range for education level
   */
  static isValidAgeForLevel(dateOfBirth: Date, educationLevel: string): {
    valid: boolean;
    reason?: string;
  } {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
      ? age - 1
      : age;

    switch (educationLevel) {
      case 'PRE_PRIMARY':
        if (adjustedAge < 3 || adjustedAge > 7) {
          return { valid: false, reason: 'Age should be between 3-7 for pre-primary' };
        }
        break;

      case 'PRIMARY':
        if (adjustedAge < 6 || adjustedAge > 16) {
          return { valid: false, reason: 'Age should be between 6-16 for primary' };
        }
        break;

      case 'JUNIOR_SECONDARY':
        if (adjustedAge < 11 || adjustedAge > 18) {
          return { valid: false, reason: 'Age should be between 11-18 for junior secondary' };
        }
        break;

      case 'SENIOR_SECONDARY':
        if (adjustedAge < 14 || adjustedAge > 21) {
          return { valid: false, reason: 'Age should be between 14-21 for senior secondary' };
        }
        break;

      default:
        return { valid: true };
    }

    return { valid: true };
  }

  /**
   * Validate academic year format
   */
  static isValidAcademicYear(year: number): boolean {
    const currentYear = new Date().getFullYear();
    return year >= 2000 && year <= currentYear + 1;
  }

  /**
   * Sanitize input to prevent injection attacks
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate data completeness percentage
   */
  static calculateCompleteness(data: any, requiredFields: string[]): number {
    let completedFields = 0;

    requiredFields.forEach(field => {
      const value = data[field];
      if (value !== null && value !== undefined && value !== '') {
        completedFields++;
      }
    });

    return (completedFields / requiredFields.length) * 100;
  }

  /**
   * Check if student data is complete for NEMIS submission
   */
  static validateStudentDataForNemis(student: any): {
    isComplete: boolean;
    missingFields: string[];
    warnings: string[];
  } {
    const requiredFields = [
      'firstName',
      'lastName',
      'dateOfBirth',
      'gender',
      'admissionNumber',
      'admissionDate',
    ];

    const missingFields: string[] = [];
    const warnings: string[] = [];

    requiredFields.forEach(field => {
      if (!student[field]) {
        missingFields.push(field);
      }
    });

    // Check identification
    if (!student.nationalId && !student.birthCertNumber) {
      missingFields.push('nationalId or birthCertNumber');
    }

    // Warnings for optional but important fields
    if (!student.currentClassId) warnings.push('Student not assigned to a class');
    if (!student.email && !student.phone) warnings.push('No contact information');
    if (!student.address) warnings.push('No address information');

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      warnings,
    };
  }

  /**
   * Check if teacher data is complete for TSC/NEMIS submission
   */
  static validateTeacherDataForNemis(teacher: any): {
    isComplete: boolean;
    missingFields: string[];
    warnings: string[];
  } {
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'staffNumber',
      'department',
      'position',
      'employmentType',
      'hireDate',
    ];

    const missingFields: string[] = [];
    const warnings: string[] = [];

    requiredFields.forEach(field => {
      if (!teacher[field]) {
        missingFields.push(field);
      }
    });

    // Warnings
    if (!teacher.nationalId) warnings.push('No national ID');
    if (teacher.isTeacher && !teacher.subjects) warnings.push('No subjects assigned');
    if (!teacher.dateOfBirth) warnings.push('No date of birth');

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      warnings,
    };
  }

  /**
   * Normalize Kenyan phone number to standard format
   */
  static normalizeKenyanPhone(phone: string): string {
    // Remove all spaces and special characters
    let normalized = phone.replace(/[\s\-\(\)]/g, '');

    // Convert to +254 format
    if (normalized.startsWith('0')) {
      normalized = '+254' + normalized.substring(1);
    } else if (normalized.startsWith('254')) {
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+254')) {
      normalized = '+254' + normalized;
    }

    return normalized;
  }

  /**
   * Format date for government APIs (ISO format)
   */
  static formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Validate and parse date string
   */
  static parseDateSafely(dateString: string): Date | null {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }
}
