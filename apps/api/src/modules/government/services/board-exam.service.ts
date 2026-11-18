import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BoardSyncType,
  SyncStatus,
  BoardExamLevel,
  RegistrationStatus,
} from '@prisma/client';

import { EncryptionUtil } from '../../../common/utils/encryption.util';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Indian Board Examination Integration Service
 * Supports CBSE (AISSE Class 10 / AISSCE Class 12), ICSE / ISC, and State Boards (e.g., Kerala SSLC / DHSE Plus Two)
 */
@Injectable()
export class BoardExamService {
  private readonly logger = new Logger(BoardExamService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly encryptionUtil: EncryptionUtil,
  ) {}

  private requireOfficialIntegration(): void {
    throw new HttpException('Official government API integration is not available. Export the reviewed school report and submit it through the official portal.', HttpStatus.NOT_IMPLEMENTED);
  }

  async initializeIntegration(
    tenantId: string,
    affiliationNumber: string,
    boardName: string = 'CBSE',
    schoolCode?: string,
    apiKey?: string,
    apiSecret?: string,
  ) {
    try {
      const integration = await this.prisma.boardIntegration.upsert({
        where: { affiliationNumber, tenantId },
        update: {
          boardName,
          schoolCode,
          apiKey: apiKey ? await this.encryptionUtil.encrypt(apiKey) : undefined,
          apiSecret: apiSecret ? await this.encryptionUtil.encrypt(apiSecret) : undefined,
          isEnabled: false,
        },
        create: {
          tenantId,
          boardName,
          affiliationNumber,
          schoolCode,
          apiKey: apiKey ? await this.encryptionUtil.encrypt(apiKey) : null,
          apiSecret: apiSecret ? await this.encryptionUtil.encrypt(apiSecret) : null,
          isEnabled: false,
        },
      });

      this.logger.log(`Board Exam (${boardName}) integration initialized for tenant: ${tenantId}`);
      const safe = { ...integration };
      delete safe.apiKey;
      delete safe.apiSecret;
      return { ...safe, externalApiAvailable: false };
    } catch (error: any) {
      this.logger.error(`Failed to initialize Board integration: ${error.message}`);
      throw new HttpException(
        'Failed to initialize Board integration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getIntegration(tenantId: string) {
    const integration = await this.prisma.boardIntegration.findFirst({
      where: { tenantId },
    });
    if (!integration) return null;
    const safe = { ...integration };
    delete safe.apiKey;
    delete safe.apiSecret;
    return { ...safe, externalApiAvailable: false };
  }

  async registerCandidates(
    tenantId: string,
    examYear: number,
    examSession: string,
    examLevel: BoardExamLevel,
    studentIds: string[],
  ) {
    this.requireOfficialIntegration();
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('Board exam integration not configured', HttpStatus.BAD_REQUEST);
    }

    const syncLog = await this.createSyncLog(
      tenantId,
      integration.id,
      BoardSyncType.CANDIDATE_REGISTRATION,
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
          results.errors.push({ studentId, error: error.message });
        }
      }

      await this.updateSyncLog(syncLog.id, {
        status: results.failed === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIAL_SUCCESS,
        recordsAttempted: results.attempted,
        recordsSucceeded: results.succeeded,
        recordsFailed: results.failed,
        errorDetails: results.errors.length > 0 ? results.errors : null,
      });

      return { success: true, ...results };
    } catch (error: any) {
      this.logger.error(`Board candidate registration failed: ${error.message}`);
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  private async registerCandidate(
    integration: any,
    studentId: string,
    examYear: number,
    examSession: string,
    examLevel: BoardExamLevel,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        currentClass: true,
        guardianLinks: { include: { guardian: true } },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    this.validateCandidateEligibility(student, examLevel);
    const subjects = await this.getExamSubjects(student.tenantId, examLevel);

    const candidateData = {
      board: integration.boardName,
      affiliation_number: integration.affiliationNumber,
      school_code: integration.schoolCode,
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
        aadhaar_last4: student.aadhaarLast4,
        apaar_id: student.apaarId,
        birth_cert_number: student.birthCertNumber,
      },
      subjects: subjects.map((s: any) => s.code),
    };

    const response = await this.callBoardApi(
      integration,
      '/loc/candidates/register',
      'POST',
      candidateData,
    );

    return this.prisma.boardExamRegistration.create({
      data: {
        tenantId: student.tenantId,
        boardIntegrationId: integration.id,
        studentId: student.id,
        examYear,
        examSession,
        examLevel,
        candidateNumber: response.candidate_number,
        locReference: response.loc_reference,
        registrationDate: new Date(),
        registrationStatus: RegistrationStatus.SUBMITTED,
        subjects: subjects.map((s: any) => ({ code: s.code, name: s.name })),
        syncStatus: SyncStatus.COMPLETED,
        lastSyncedAt: new Date(),
        registrationFee: this.getRegistrationFee(examLevel),
      },
    });
  }

  async downloadResults(tenantId: string, examYear: number, examLevel: BoardExamLevel) {
    this.requireOfficialIntegration();
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('Board exam integration not configured', HttpStatus.BAD_REQUEST);
    }

    const syncLog = await this.createSyncLog(
      tenantId,
      integration.id,
      BoardSyncType.RESULTS_DOWNLOAD,
    );

    try {
      const registrations = await this.prisma.boardExamRegistration.findMany({
        where: {
          tenantId,
          examYear,
          examLevel,
          registrationStatus: { in: [RegistrationStatus.SUBMITTED, RegistrationStatus.CONFIRMED, RegistrationStatus.APPROVED] },
        },
      });

      const results = {
        attempted: registrations.length,
        succeeded: 0,
        failed: 0,
        results: [] as any[],
        errors: [] as any[],
      };

      for (const reg of registrations) {
        try {
          const response = await this.callBoardApi(
            integration,
            `/results/${examYear}/${examLevel}/${reg.candidateNumber}`,
            'GET',
          );

          await this.prisma.boardExamRegistration.update({
            where: { id: reg.id },
            data: {
              resultsAvailable: true,
              resultsDownloadedAt: new Date(),
              results: response.results,
              lastSyncedAt: new Date(),
            },
          });

          results.results.push({ candidateNumber: reg.candidateNumber, ...response.results });
          results.succeeded++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({ candidateNumber: reg.candidateNumber, error: error.message });
        }
      }

      await this.updateSyncLog(syncLog.id, {
        status: results.failed === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIAL_SUCCESS,
        recordsAttempted: results.attempted,
        recordsSucceeded: results.succeeded,
        recordsFailed: results.failed,
      });

      return { success: true, ...results };
    } catch (error: any) {
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  async getExamTimetable(tenantId: string, examYear: number, examLevel: BoardExamLevel) {
    this.requireOfficialIntegration();
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('Board exam integration not configured', HttpStatus.BAD_REQUEST);
    }

    const response = await this.callBoardApi(
      integration,
      `/datesheet/${examYear}/${examLevel}`,
      'GET',
    );
    return {
      board: integration.boardName,
      examYear,
      examLevel,
      timetable: response.timetable,
    };
  }

  async getRegistrations(
    tenantId: string,
    examYear?: number,
    examLevel?: BoardExamLevel,
    status?: RegistrationStatus,
  ) {
    const where: any = { tenantId };
    if (examYear) where.examYear = examYear;
    if (examLevel) where.examLevel = examLevel;
    if (status) where.registrationStatus = status;

    return this.prisma.boardExamRegistration.findMany({
      where,
      orderBy: [{ examYear: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getCandidateStatus(tenantId: string, candidateNumber: string) {
    const reg = await this.prisma.boardExamRegistration.findFirst({
      where: { tenantId, candidateNumber },
    });
    if (!reg) {
      throw new HttpException('Candidate registration not found', HttpStatus.NOT_FOUND);
    }
    return reg;
  }

  async submitIrregularityReport(
    tenantId: string,
    candidateNumber: string,
    irregularityType: string,
    description: string,
    evidenceUrls?: string[],
  ) {
    this.requireOfficialIntegration();
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('Board exam integration not configured', HttpStatus.BAD_REQUEST);
    }

    const response = await this.callBoardApi(integration, '/irregularities/report', 'POST', {
      candidate_number: candidateNumber,
      irregularity_type: irregularityType,
      description,
      evidence_urls: evidenceUrls,
    });

    return { success: true, reportId: response.report_id };
  }

  async getSyncHistory(tenantId: string, limit: number = 50) {
    return this.prisma.boardSyncLog.findMany({
      where: { tenantId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  private validateCandidateEligibility(student: any, examLevel: BoardExamLevel) {
    if (!student.dateOfBirth) {
      throw new Error('Student date of birth is required for Board LOC registration');
    }
    const age = this.calculateAge(student.dateOfBirth);
    if (
      (examLevel === BoardExamLevel.CBSE_AISSE ||
        examLevel === BoardExamLevel.ICSE_10 ||
        examLevel === BoardExamLevel.STATE_SSLC) &&
      age < 13
    ) {
      throw new Error('Candidate must be at least 13 years old for Class 10 Board Exam');
    }
    if (
      (examLevel === BoardExamLevel.CBSE_AISSCE ||
        examLevel === BoardExamLevel.ISC_12 ||
        examLevel === BoardExamLevel.STATE_HSC) &&
      age < 15
    ) {
      throw new Error('Candidate must be at least 15 years old for Class 12 Board Exam');
    }
  }

  private async getExamSubjects(tenantId: string, examLevel: BoardExamLevel) {
    const isSenior =
      examLevel === BoardExamLevel.CBSE_AISSCE ||
      examLevel === BoardExamLevel.ISC_12 ||
      examLevel === BoardExamLevel.STATE_HSC;

    const educationLevel = isSenior ? 'SENIOR_SECONDARY' : 'SECONDARY';
    return this.prisma.subject.findMany({
      where: { tenantId, educationLevel, isCore: true },
      select: { id: true, name: true, code: true },
    });
  }

  private getRegistrationFee(examLevel: BoardExamLevel): number {
    // Board registration fees in INR minor units (paise)
    switch (examLevel) {
      case BoardExamLevel.CBSE_AISSE:
      case BoardExamLevel.ICSE_10:
      case BoardExamLevel.STATE_SSLC:
        return 150000; // INR 1,500
      case BoardExamLevel.CBSE_AISSCE:
      case BoardExamLevel.ISC_12:
      case BoardExamLevel.STATE_HSC:
        return 210000; // INR 2,100
      default:
        return 0;
    }
  }

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

  private async createSyncLog(tenantId: string, boardIntegrationId: string, syncType: BoardSyncType) {
    return this.prisma.boardSyncLog.create({
      data: {
        tenantId,
        boardIntegrationId,
        syncType,
        status: SyncStatus.IN_PROGRESS,
      },
    });
  }

  private async updateSyncLog(syncLogId: string, data: any) {
    return this.prisma.boardSyncLog.update({
      where: { id: syncLogId },
      data: {
        ...data,
        completedAt: new Date(),
      },
    });
  }

  private async callBoardApi(_integration: any, _endpoint: string, _method: string, _data?: any): Promise<any> {
    this.requireOfficialIntegration();
    throw new HttpException('Official API unavailable', HttpStatus.NOT_IMPLEMENTED);
  }
}
