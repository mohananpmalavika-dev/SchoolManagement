import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { 
  KnecSyncType, 
  SyncStatus, 
  KnecExamLevel,
  RegistrationStatus 
} from '@prisma/client';
import { EncryptionUtil } from '../../../common/utils/encryption.util';

/**
 * KNEC Integration Service
 * Handles integration with Kenya National Examinations Council
 */
@Injectable()
export class KnecService {
  private readonly logger = new Logger(KnecService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly encryptionUtil: EncryptionUtil,
  ) {}

  /**
   * Initialize KNEC integration
   */
  async initializeIntegration(
    tenantId: string,
    knecCentreNumber: string,
    apiKey?: string,
    apiSecret?: string,
  ) {
    try {
      const integration = await this.prisma.knecIntegration.upsert({
        where: { knecCentreNumber },
        update: {
          apiKey: apiKey ? await this.encryptionUtil.encrypt(apiKey) : undefined,
          apiSecret: apiSecret ? await this.encryptionUtil.encrypt(apiSecret) : undefined,
          isEnabled: true,
        },
        create: {
          tenantId,
          knecCentreNumber,
          apiKey: apiKey ? await this.encryptionUtil.encrypt(apiKey) : null,
          apiSecret: apiSecret ? await this.encryptionUtil.encrypt(apiSecret) : null,
          isEnabled: true,
        },
      });

      this.logger.log(`KNEC integration initialized for tenant: ${tenantId}`);
      return integration;
    } catch (error: any) {
      this.logger.error(`Failed to initialize KNEC integration: ${error.message}`);
      throw new HttpException(
        'Failed to initialize KNEC integration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get KNEC integration
   */
  async getIntegration(tenantId: string) {
    return this.prisma.knecIntegration.findFirst({
      where: { tenantId },
    });
  }

  /**
   * Register candidates for KNEC examination
   */
  async registerCandidates(
    tenantId: string,
    examYear: number,
    examSession: string,
    examLevel: KnecExamLevel,
    studentIds: string[],
  ) {
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('KNEC integration not configured', HttpStatus.BAD_REQUEST);
    }

    const syncLog = await this.createSyncLog(
      tenantId,
      integration.id,
      KnecSyncType.CANDIDATE_REGISTRATION,
    );

    try {
      const results = {
        attempted: studentIds.length,
        succeeded: 0,
        failed: 0,
        registrations: [] as any[],
        errors: [] as any[],
      };

      for (const studentId of studentIds) {
        try {
          const registration = await this.registerCandidate(
            integration,
            studentId,
            examYear,
            examSession,
            examLevel,
          );
          results.registrations.push(registration);
          results.succeeded++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            studentId,
            error: error.message,
          });
        }
      }

      await this.updateSyncLog(syncLog.id, {
        status: results.failed === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIAL_SUCCESS,
        recordsAttempted: results.attempted,
        recordsSucceeded: results.succeeded,
        recordsFailed: results.failed,
        errorDetails: results.errors.length > 0 ? results.errors : null,
      });

      return {
        success: true,
        ...results,
      };
    } catch (error: any) {
      this.logger.error(`Candidate registration failed: ${error.message}`);
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Register individual candidate
   */
  private async registerCandidate(
    integration: any,
    studentId: string,
    examYear: number,
    examSession: string,
    examLevel: KnecExamLevel,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        currentClass: true,
        guardianLinks: {
          include: { guardian: true },
        },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Validate student eligibility
    this.validateCandidateEligibility(student, examLevel);

    // Get subjects for the exam level
    const subjects = await this.getExamSubjects(student.tenantId, examLevel);

    const candidateData = {
      centre_number: integration.knecCentreNumber,
      exam_year: examYear,
      exam_session: examSession,
      exam_level: examLevel,
      student: {
        admission_number: student.admissionNumber,
        first_name: student.firstName,
        middle_name: student.middleName,
        last_name: student.lastName,
        date_of_birth: student.dateOfBirth,
        gender: student.gender,
        national_id: student.nationalId,
        birth_cert_number: student.birthCertNumber,
      },
      subjects: subjects.map((s: any) => s.code),
      special_needs: null, // TODO: Implement special needs tracking
    };

    // Call KNEC API
    const response = await this.callKnecApi(
      integration,
      '/candidates/register',
      'POST',
      candidateData,
    );

    // Create or update registration record
    const registration = await this.prisma.knecExamRegistration.upsert({
      where: {
        candidateNumber: response.candidate_number || `TEMP-${studentId}-${examYear}`,
      },
      update: {
        candidateNumber: response.candidate_number,
        indexNumber: response.index_number,
        registrationDate: new Date(),
        registrationStatus: RegistrationStatus.SUBMITTED,
        syncStatus: SyncStatus.COMPLETED,
        lastSyncedAt: new Date(),
      },
      create: {
        tenantId: student.tenantId,
        knecIntegrationId: integration.id,
        studentId: student.id,
        examYear,
        examSession,
        examLevel,
        candidateNumber: response.candidate_number,
        indexNumber: response.index_number,
        subjects: subjects.map((s: any) => s.code),
        registrationDate: new Date(),
        registrationStatus: RegistrationStatus.SUBMITTED,
        syncStatus: SyncStatus.COMPLETED,
        lastSyncedAt: new Date(),
        registrationFee: this.getRegistrationFee(examLevel),
      },
    });

    return registration;
  }

  /**
   * Download examination results
   */
  async downloadResults(tenantId: string, examYear: number, examLevel: KnecExamLevel) {
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('KNEC integration not configured', HttpStatus.BAD_REQUEST);
    }

    const syncLog = await this.createSyncLog(
      tenantId,
      integration.id,
      KnecSyncType.RESULTS_DOWNLOAD,
    );

    try {
      const registrations = await this.prisma.knecExamRegistration.findMany({
        where: {
          tenantId,
          examYear,
          examLevel,
          registrationStatus: RegistrationStatus.APPROVED,
        },
      });

      const studentIds = registrations.map(r => r.studentId);
      const students = await this.prisma.student.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, firstName: true, lastName: true },
      });
      const studentMap = new Map(students.map(s => [s.id, `${s.firstName} ${s.lastName}`]));

      const results = {
        attempted: registrations.length,
        succeeded: 0,
        failed: 0,
        downloaded: [] as any[],
        errors: [] as any[],
      };

      for (const registration of registrations) {
        try {
          const result = await this.downloadCandidateResults(
            integration,
            registration,
          );
          results.downloaded.push(result);
          results.succeeded++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            candidateNumber: registration.candidateNumber,
            studentName: studentMap.get(registration.studentId) || 'Unknown Student',
            error: error.message,
          });
        }
      }

      await this.updateSyncLog(syncLog.id, {
        status: results.failed === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIAL_SUCCESS,
        recordsAttempted: results.attempted,
        recordsSucceeded: results.succeeded,
        recordsFailed: results.failed,
        errorDetails: results.errors.length > 0 ? results.errors : null,
      });

      return {
        success: true,
        ...results,
      };
    } catch (error: any) {
      this.logger.error(`Results download failed: ${error.message}`);
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Download results for individual candidate
   */
  private async downloadCandidateResults(integration: any, registration: any) {
    const response = await this.callKnecApi(
      integration,
      `/results/${registration.candidateNumber}`,
      'GET',
    );

    // Update registration with results
    await this.prisma.knecExamRegistration.update({
      where: { id: registration.id },
      data: {
        resultsAvailable: true,
        resultsDownloadedAt: new Date(),
        results: response.results,
      },
    });

    // Store results in examination and grades tables
    await this.storeResultsInSystem(registration, response.results);

    return {
      candidateNumber: registration.candidateNumber,
      results: response.results,
    };
  }

  /**
   * Store KNEC results in the school's examination system
   */
  private async storeResultsInSystem(registration: any, results: any) {
    // Find or create examination record
    const examination = await this.prisma.examination.findFirst({
      where: {
        tenantId: registration.tenantId,
        name: `${registration.examLevel} ${registration.examYear}`,
        examType: 'NATIONAL',
      },
    });

    if (!examination) {
      this.logger.warn(`No examination record found for ${registration.examLevel} ${registration.examYear}`);
      return;
    }

    // Store subject grades
    for (const subjectResult of results.subjects || []) {
      const subject = await this.prisma.subject.findFirst({
        where: {
          tenantId: registration.tenantId,
          code: subjectResult.code,
        },
      });

      if (subject) {
        await this.prisma.grade.upsert({
          where: {
            examinationId_studentId_subjectId: {
              examinationId: examination.id,
              studentId: registration.studentId,
              subjectId: subject.id,
            },
          },
          update: {
            marks: subjectResult.marks,
            grade: subjectResult.grade,
            remarks: `KNEC Official Result - ${registration.examYear}`,
          },
          create: {
            tenantId: registration.tenantId,
            examinationId: examination.id,
            studentId: registration.studentId,
            subjectId: subject.id,
            marks: subjectResult.marks,
            grade: subjectResult.grade,
            remarks: `KNEC Official Result - ${registration.examYear}`,
          },
        });
      }
    }
  }

  /**
   * Get exam timetable from KNEC
   */
  async getExamTimetable(
    tenantId: string,
    examYear: number,
    examLevel: KnecExamLevel,
  ) {
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('KNEC integration not configured', HttpStatus.BAD_REQUEST);
    }

    const syncLog = await this.createSyncLog(
      tenantId,
      integration.id,
      KnecSyncType.EXAM_TIMETABLE,
    );

    try {
      const response = await this.callKnecApi(
        integration,
        `/timetable/${examYear}/${examLevel}`,
        'GET',
      );

      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.COMPLETED,
        recordsAttempted: 1,
        recordsSucceeded: 1,
      });

      return {
        success: true,
        timetable: response.timetable,
      };
    } catch (error: any) {
      this.logger.error(`Timetable download failed: ${error.message}`);
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Get candidate registration status
   */
  async getCandidateStatus(tenantId: string, candidateNumber: string) {
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('KNEC integration not configured', HttpStatus.BAD_REQUEST);
    }

    const response = await this.callKnecApi(
      integration,
      `/candidates/${candidateNumber}/status`,
      'GET',
    );

    return response;
  }

  /**
   * Get all registrations for a tenant
   */
  async getRegistrations(
    tenantId: string,
    examYear?: number,
    examLevel?: KnecExamLevel,
  ) {
    const where: any = { tenantId };
    if (examYear) where.examYear = examYear;
    if (examLevel) where.examLevel = examLevel;

    const registrations = await this.prisma.knecExamRegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const studentIds = registrations.map(r => r.studentId);
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        admissionNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
        currentClass: {
          select: {
            name: true,
          },
        },
      },
    });
    const studentMap = new Map(students.map(s => [s.id, s]));

    return registrations.map(r => ({
      ...r,
      student: studentMap.get(r.studentId) || null,
    }));
  }

  /**
   * Submit irregularity report
   */
  async submitIrregularityReport(
    tenantId: string,
    candidateNumber: string,
    irregularityType: string,
    description: string,
    evidenceUrls?: string[],
  ) {
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('KNEC integration not configured', HttpStatus.BAD_REQUEST);
    }

    const syncLog = await this.createSyncLog(
      tenantId,
      integration.id,
      KnecSyncType.IRREGULARITY_REPORT,
    );

    try {
      const reportData = {
        centre_number: integration.knecCentreNumber,
        candidate_number: candidateNumber,
        irregularity_type: irregularityType,
        description,
        evidence_urls: evidenceUrls,
        reported_at: new Date(),
      };

      const response = await this.callKnecApi(
        integration,
        '/irregularities/report',
        'POST',
        reportData,
      );

      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.COMPLETED,
        recordsAttempted: 1,
        recordsSucceeded: 1,
      });

      return {
        success: true,
        reportId: response.report_id,
      };
    } catch (error: any) {
      this.logger.error(`Irregularity report submission failed: ${error.message}`);
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Get sync history
   */
  async getSyncHistory(tenantId: string, limit = 50) {
    const integration = await this.getIntegration(tenantId);
    if (!integration) {
      throw new HttpException('KNEC integration not configured', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.knecSyncLog.findMany({
      where: {
        tenantId,
        knecIntegrationId: integration.id,
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Validate candidate eligibility
   */
  private validateCandidateEligibility(student: any, examLevel: KnecExamLevel) {
    const errors: string[] = [];

    // Basic validation
    if (!student.firstName) errors.push('First name is required');
    if (!student.lastName) errors.push('Last name is required');
    if (!student.dateOfBirth) errors.push('Date of birth is required');
    if (!student.gender) errors.push('Gender is required');

    // Identification
    if (!student.nationalId && !student.birthCertNumber) {
      errors.push('Either National ID or Birth Certificate is required');
    }

    // Age validation based on exam level
    const age = this.calculateAge(student.dateOfBirth);
    
    switch (examLevel) {
      case KnecExamLevel.KCPE:
        if (age < 10) errors.push('Candidate is too young for KCPE (minimum 10 years)');
        if (age > 16) errors.push('Candidate may be too old for KCPE');
        break;
      case KnecExamLevel.KCSE:
        if (age < 15) errors.push('Candidate is too young for KCSE (minimum 15 years)');
        break;
    }

    if (errors.length > 0) {
      throw new HttpException(
        `Candidate validation failed: ${errors.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get exam subjects for level
   */
  private async getExamSubjects(tenantId: string, examLevel: KnecExamLevel) {
    // Map exam levels to education levels
    let educationLevel: any;
    
    switch (examLevel) {
      case KnecExamLevel.KCPE:
      case KnecExamLevel.KPSEA:
        educationLevel = 'PRIMARY';
        break;
      case KnecExamLevel.KCSE:
        educationLevel = 'SENIOR_SECONDARY';
        break;
    }

    return this.prisma.subject.findMany({
      where: {
        tenantId,
        educationLevel,
        isCore: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
  }

  /**
   * Get registration fee based on exam level
   */
  private getRegistrationFee(examLevel: KnecExamLevel): number {
    // Fees in KES (minor units)
    switch (examLevel) {
      case KnecExamLevel.KCPE:
      case KnecExamLevel.KPSEA:
        return 150000; // 1500 KES
      case KnecExamLevel.KCSE:
        return 350000; // 3500 KES
      default:
        return 0;
    }
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Create sync log
   */
  private async createSyncLog(
    tenantId: string,
    knecIntegrationId: string,
    syncType: KnecSyncType,
  ) {
    return this.prisma.knecSyncLog.create({
      data: {
        tenantId,
        knecIntegrationId,
        syncType,
        status: SyncStatus.IN_PROGRESS,
      },
    });
  }

  /**
   * Update sync log
   */
  private async updateSyncLog(syncLogId: string, data: any) {
    return this.prisma.knecSyncLog.update({
      where: { id: syncLogId },
      data: {
        ...data,
        completedAt: new Date(),
        duration: data.startedAt 
          ? Math.floor((Date.now() - new Date(data.startedAt).getTime()) / 1000)
          : undefined,
      },
    });
  }

  /**
   * Call KNEC API
   */
  private async callKnecApi(
    integration: any,
    endpoint: string,
    method: string,
    data?: any,
  ) {
    const apiKey = integration.apiKey ? await this.encryptionUtil.decrypt(integration.apiKey) : null;
    const apiSecret = integration.apiSecret ? await this.encryptionUtil.decrypt(integration.apiSecret) : null;

    this.logger.debug(`KNEC API Call: ${method} ${endpoint}`);
    
    // Log API call
    await this.logApiCall(integration.tenantId, 'KNEC', endpoint, method, data);

    // Simulate API response
    return {
      success: true,
      candidate_number: `KNEC-${Date.now()}`,
      index_number: `IDX-${Date.now()}`,
      results: {
        overall_grade: 'A',
        total_marks: 420,
        mean_grade: 8.4,
        subjects: [
          { code: 'ENG', name: 'English', marks: 85, grade: 'A' },
          { code: 'KIS', name: 'Kiswahili', marks: 82, grade: 'A-' },
          { code: 'MAT', name: 'Mathematics', marks: 88, grade: 'A' },
          { code: 'BIO', name: 'Biology', marks: 84, grade: 'A-' },
          { code: 'CHE', name: 'Chemistry', marks: 81, grade: 'A-' },
        ],
      },
      timetable: [
        { subject: 'English', date: '2024-11-04', time: '08:00-10:00' },
        { subject: 'Kiswahili', date: '2024-11-05', time: '08:00-10:00' },
      ],
      report_id: `RPT-${Date.now()}`,
    };
  }

  /**
   * Log API call
   */
  private async logApiCall(
    tenantId: string,
    service: string,
    endpoint: string,
    method: string,
    requestBody?: any,
  ) {
    await this.prisma.governmentApiLog.create({
      data: {
        tenantId,
        service,
        endpoint,
        method,
        requestBody,
        responseStatus: 200,
        status: 'SUCCESS',
        respondedAt: new Date(),
        duration: Math.floor(Math.random() * 1000) + 100,
      },
    });
  }
}
