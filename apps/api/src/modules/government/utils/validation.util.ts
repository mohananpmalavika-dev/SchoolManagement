/**
 * Validation utilities for Indian government education integration (UDISE+, APAAR, CBSE/ICSE/State Board)
 */
export class ValidationUtil {
  /**
   * Validate Aadhaar last-4 digits or masked Aadhaar (XXXX-XXXX-1234)
   */
  static isValidAadhaarLast4(id: string): boolean {
    const cleaned = id.replace(/[\s-]/g, '');
    return /^\d{4}$/.test(cleaned) || /^X{8}\d{4}$/i.test(cleaned) || /^\d{12}$/.test(cleaned);
  }

  /**
   * Validate Indian Birth Certificate registration number
   */
  static isValidBirthCertificate(certNumber: string): boolean {
    return !!certNumber && certNumber.trim().length >= 6 && certNumber.trim().length <= 30;
  }

  /**
   * Validate UDISE+ National Teacher Code
   */
  static isValidTeacherCode(teacherCode: string): boolean {
    return /^[A-Z0-9]{6,15}$/i.test(teacherCode.trim());
  }

  /**
   * Validate 12-digit APAAR ID
   */
  static isValidApaarId(apaarId: string): boolean {
    return /^\d{12}$/.test(apaarId.replace(/[\s-]/g, ''));
  }

  /**
   * Validate 11-digit UDISE+ School Code
   */
  static isValidUdiseSchoolCode(schoolCode: string): boolean {
    return /^\d{11}$/.test(schoolCode.trim());
  }

  /**
   * Validate Board Affiliation / Centre Number (CBSE, ICSE, State Board)
   */
  static isValidBoardAffiliationNumber(affiliationNumber: string): boolean {
    return /^[A-Z0-9\/-]{4,20}$/i.test(affiliationNumber.trim());
  }

  /**
   * Validate Board Roll / Candidate Number
   */
  static isValidCandidateNumber(candidateNumber: string): boolean {
    return !!candidateNumber && candidateNumber.trim().length >= 6 && candidateNumber.trim().length <= 16;
  }

  /**
   * Validate Indian PIN Code
   */
  static isValidPincode(pincode: string): boolean {
    return /^[1-9]\d{5}$/.test(pincode.trim());
  }

  /**
   * Validate Indian mobile number (+91 / 0 / 10-digit)
   */
  static isValidIndianPhone(phone: string): boolean {
    return /^(\+?91|0)?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ''));
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
   * Validate age is within NEP 2020 / CBSE / Indian school range for education stage
   */
  static isValidAgeForLevel(
    dateOfBirth: Date,
    educationLevel: string,
  ): {
    valid: boolean;
    reason?: string;
  } {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    const adjustedAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
        ? age - 1
        : age;

    switch (educationLevel) {
      case 'PRE_PRIMARY':
        if (adjustedAge < 3 || adjustedAge > 6) {
          return { valid: false, reason: 'Age should be between 3-6 for Pre-Primary (Nursery/LKG/UKG)' };
        }
        break;
      case 'PRIMARY':
        if (adjustedAge < 5 || adjustedAge > 12) {
          return { valid: false, reason: 'Age should be between 5-12 for Primary (Classes 1-5)' };
        }
        break;
      case 'MIDDLE':
        if (adjustedAge < 10 || adjustedAge > 15) {
          return { valid: false, reason: 'Age should be between 10-15 for Middle Stage (Classes 6-8)' };
        }
        break;
      case 'SECONDARY':
        if (adjustedAge < 13 || adjustedAge > 17) {
          return { valid: false, reason: 'Age should be between 13-17 for Secondary (Classes 9-10)' };
        }
        break;
      case 'SENIOR_SECONDARY':
        if (adjustedAge < 15 || adjustedAge > 20) {
          return { valid: false, reason: 'Age should be between 15-20 for Senior Secondary (Classes 11-12)' };
        }
        break;
      default:
        return { valid: true };
    }

    return { valid: true };
  }

  static isValidAcademicYear(year: number): boolean {
    const currentYear = new Date().getFullYear();
    return year >= 2000 && year <= currentYear + 1;
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  static calculateCompleteness(data: any, requiredFields: string[]): number {
    let completedFields = 0;
    requiredFields.forEach((field) => {
      const value = data[field];
      if (value !== null && value !== undefined && value !== '') {
        completedFields++;
      }
    });
    return (completedFields / requiredFields.length) * 100;
  }

  /**
   * Check if student data is complete for UDISE+ SDMIS / APAAR submission
   */
  static validateStudentDataForUdise(student: any): {
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

    requiredFields.forEach((field) => {
      if (!student[field]) {
        missingFields.push(field);
      }
    });

    if (!student.aadhaarLast4 && !student.birthCertNumber && !student.apaarId) {
      missingFields.push('aadhaarLast4, apaarId, or birthCertNumber');
    }

    if (!student.currentClassId) {
      warnings.push('Student is not assigned to a class');
    }

    if (!student.guardianLinks || student.guardianLinks.length === 0) {
      warnings.push('No guardian information linked');
    } else {
      const hasPrimaryGuardian = student.guardianLinks.some((g: any) => g.isPrimary);
      if (!hasPrimaryGuardian) {
        warnings.push('No primary guardian designated');
      }
    }

    if (!student.bloodGroup) {
      warnings.push('Blood group not specified');
    }

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      warnings,
    };
  }
}
