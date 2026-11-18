import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  UdiseSyncType,
  SyncStatus,
  SyncDirection,
  ValidationStatus,
} from '@prisma/client';

import { EncryptionUtil } from '../../../common/utils/encryption.util';
import { PrismaService } from '../../../database/prisma.service';

/**
 * UDISE+ / APAAR Integration Service (India)
 * Handles synchronization & validation with UDISE+ (Unified District Information System for Education Plus) and APAAR
 */
@Injectable()
export class UdiseService {
  private readonly logger = new Logger(UdiseService.name);

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
    udiseSchoolCode: string,
    apiKey?: string,
    apiSecret?: string,
  ) {
    try {
      const integration = await this.prisma.udiseIntegration.upsert({
        where: { udiseSchoolCode, tenantId },
        update: {
          apiKey: apiKey ? await this.encryptionUtil.encrypt(apiKey) : undefined,
          apiSecret: apiSecret ? await this.encryptionUtil.encrypt(apiSecret) : undefined,
          isEnabled: false,
        },
        create: {
          tenantId,
          udiseSchoolCode,
          apiKey: apiKey ? await this.encryptionUtil.encrypt(apiKey) : null,
          apiSecret: apiSecret ? await this.encryptionUtil.encrypt(apiSecret) : null,
          isEnabled: false,
          autoSync: false,
          syncFrequency: 'DAILY',
          syncTime: '02:00',
        },
      });

      this.logger.log(`UDISE+ integration initialized for tenant: ${tenantId}`);
      const safe = { ...integration };
      delete safe.apiKey;
      delete safe.apiSecret;
      return { ...safe, externalApiAvailable: false };
    } catch (error: any) {
      this.logger.error(`Failed to initialize UDISE+ integration: ${error.message}`);
      throw new HttpException(
        'Failed to initialize UDISE+ integration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getIntegration(tenantId: string) {
    const integration = await this.prisma.udiseIntegration.findFirst({
      where: { tenantId },
    });
    if (!integration) return null;
    const safe = { ...integration };
    delete safe.apiKey;
    delete safe.apiSecret;
    return { ...safe, externalApiAvailable: false };
  }

  async syncStudentEnrollment(tenantId: string) {
    this.requireOfficialIntegration();
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('UDISE+ integration not configured', HttpStatus.BAD_REQUEST);
    }

    const syncLog = await this.createSyncLog(
      tenantId,
      integration.id,
      UdiseSyncType.STUDENT_ENROLLMENT,
    );

    try {
      const students = await this.prisma.student.findMany({
        where: { tenantId, status: 'ACTIVE' },
        include: {
          currentClass: true,
          currentStream: true,
          guardianLinks: { include: { guardian: true } },
        },
      });

      const syncResults = {
        attempted: students.length,
        succeeded: 0,
        failed: 0,
        errors: [] as any[],
      };

      for (const student of students) {
        try {
          await this.syncStudentToUdise(integration, student);
          syncResults.succeeded++;
        } catch (error: any) {
          syncResults.failed++;
          syncResults.errors.push({
            studentId: student.id,
            admissionNumber: student.admissionNumber,
            error: error.message,
          });
        }
      }

      await this.updateSyncLog(syncLog.id, {
        status: syncResults.failed === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIAL_SUCCESS,
        recordsAttempted: syncResults.attempted,
        recordsSucceeded: syncResults.succeeded,
        recordsFailed: syncResults.failed,
        errorDetails: syncResults.errors.length > 0 ? syncResults.errors : null,
      });

      await this.prisma.udiseIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          syncStatus: syncResults.failed === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIAL_SUCCESS,
        },
      });

      return { success: true, ...syncResults };
    } catch (error: any) {
      this.logger.error(`Student enrollment sync failed: ${error.message}`);
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  private async syncStudentToUdise(integration: any, student: any) {
    const udiseRecord = await this.prisma.udiseStudentRecord.findUnique({
      where: { studentId: student.id },
    });

    const udiseData = {
      admission_number: student.admissionNumber,
      first_name: student.firstName,
      middle_name: student.middleName,
      last_name: student.lastName,
      date_of_birth: student.dateOfBirth,
      gender: student.gender,
      aadhaar_last4: student.aadhaarLast4,
      apaar_id: student.apaarId,
      pen_number: student.penNumber,
      birth_cert_number: student.birthCertNumber,
      class: student.currentClass?.name,
      section: student.currentStream?.name,
      state: student.state,
      district: student.district,
      pincode: student.pincode,
      status: student.status,
      admission_date: student.admissionDate,
      guardians: (student.guardianLinks || []).map((link: any) => ({
        name: `${link.guardian.firstName} ${link.guardian.lastName}`,
        relationship: link.relationship,
        phone: link.guardian.phone,
        email: link.guardian.email,
        is_primary: link.isPrimary,
      })),
    };

    const response = await this.callUdiseApi(
      integration,
      '/sdmis/students/prepare-export',
      'POST',
      udiseData,
    );

    if (!udiseRecord) {
      await this.prisma.udiseStudentRecord.create({
        data: {
          tenantId: integration.tenantId,
          studentId: student.id,
          apaarId: student.apaarId || response.apaar_id,
          penNumber: student.penNumber || response.pen_number,
          udiseStudentId: response.udise_student_id,
          syncStatus: SyncStatus.COMPLETED,
          lastSyncedAt: new Date(),
          validationStatus: ValidationStatus.VALID,
          lastSyncedData: udiseData as any,
        },
      });
    } else {
      await this.prisma.udiseStudentRecord.update({
        where: { id: udiseRecord.id },
        data: {
          apaarId: student.apaarId || udiseRecord.apaarId,
          penNumber: student.penNumber || udiseRecord.penNumber,
          syncStatus: SyncStatus.COMPLETED,
          lastSyncedAt: new Date(),
          validationStatus: ValidationStatus.VALID,
          lastSyncedData: udiseData as any,
        },
      });
    }
  }

  async syncTeacherData(tenantId: string) {
    this.requireOfficialIntegration();
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('UDISE+ integration not configured', HttpStatus.BAD_REQUEST);
    }

    const syncLog = await this.createSyncLog(
      tenantId,
      integration.id,
      UdiseSyncType.TEACHER_DATA,
    );

    try {
      const teachers = await this.prisma.staff.findMany({
        where: { tenantId, isTeacher: true, status: 'ACTIVE' },
      });

      const syncResults = {
        attempted: teachers.length,
        succeeded: 0,
        failed: 0,
        errors: [] as any[],
      };

      for (const teacher of teachers) {
        try {
          await this.syncTeacherToUdise(integration, teacher);
          syncResults.succeeded++;
        } catch (error: any) {
          syncResults.failed++;
          syncResults.errors.push({
            staffId: teacher.id,
            staffNumber: teacher.staffNumber,
            error: error.message,
          });
        }
      }

      await this.updateSyncLog(syncLog.id, {
        status: syncResults.failed === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIAL_SUCCESS,
        recordsAttempted: syncResults.attempted,
        recordsSucceeded: syncResults.succeeded,
        recordsFailed: syncResults.failed,
        errorDetails: syncResults.errors.length > 0 ? syncResults.errors : null,
      });

      return { success: true, ...syncResults };
    } catch (error: any) {
      this.logger.error(`Teacher data sync failed: ${error.message}`);
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  private async syncTeacherToUdise(integration: any, teacher: any) {
    const teacherRecord = await this.prisma.udiseStaffRecord.findUnique({
      where: { staffId: teacher.id },
    });

    const teacherData = {
      staff_number: teacher.staffNumber,
      first_name: teacher.firstName,
      middle_name: teacher.middleName,
      last_name: teacher.lastName,
      aadhaar_last4: teacher.aadhaarLast4,
      pan_number: teacher.panNumber,
      email: teacher.email,
      phone: teacher.phone,
      gender: teacher.gender,
      date_of_birth: teacher.dateOfBirth,
      employment_type: teacher.employmentType,
      hire_date: teacher.hireDate,
      subjects: teacher.subjects,
    };

    const response = await this.callUdiseApi(
      integration,
      '/teachers/prepare-export',
      'POST',
      teacherData,
    );

    if (!teacherRecord) {
      await this.prisma.udiseStaffRecord.create({
        data: {
          tenantId: integration.tenantId,
          staffId: teacher.id,
          teacherCode: response.teacher_code,
          udiseStaffId: response.udise_staff_id,
          isRegistered: true,
          registrationDate: new Date(),
          syncStatus: SyncStatus.COMPLETED,
          lastSyncedAt: new Date(),
          validationStatus: ValidationStatus.VALID,
          lastSyncedData: teacherData as any,
        },
      });
    } else {
      await this.prisma.udiseStaffRecord.update({
        where: { id: teacherRecord.id },
        data: {
          syncStatus: SyncStatus.COMPLETED,
          lastSyncedAt: new Date(),
          validationStatus: ValidationStatus.VALID,
          lastSyncedData: teacherData as any,
        },
      });
    }
  }

  async syncSchoolProfile(tenantId: string) {
    this.requireOfficialIntegration();
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('UDISE+ integration not configured', HttpStatus.BAD_REQUEST);
    }

    const school = await this.prisma.school.findFirst({ where: { tenantId } });
    if (!school) {
      throw new HttpException('School profile not found', HttpStatus.NOT_FOUND);
    }

    const [studentCount, teacherCount, classCount] = await Promise.all([
      this.prisma.student.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.staff.count({ where: { tenantId, isTeacher: true, status: 'ACTIVE' } }),
      this.prisma.class.count({ where: { tenantId } }),
    ]);

    const schoolData = {
      udise_school_code: integration.udiseSchoolCode,
      name: school.name,
      board_affiliation: school.boardAffiliation,
      affiliation_number: school.affiliationNumber,
      registration_number: school.registrationNumber,
      school_type: school.schoolType,
      education_levels: school.educationLevel,
      email: school.email,
      phone: school.phone,
      address: school.address,
      city: school.city,
      district: school.district,
      state: school.state,
      pincode: school.pincode,
      country: school.country,
      statistics: {
        total_students: studentCount,
        total_teachers: teacherCount,
        total_classes: classCount,
      },
    };

    const syncLog = await this.createSyncLog(
      tenantId,
      integration.id,
      UdiseSyncType.SCHOOL_PROFILE,
    );

    try {
      await this.callUdiseApi(integration, '/schools/profile', 'PUT', schoolData);
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.COMPLETED,
        recordsAttempted: 1,
        recordsSucceeded: 1,
        recordsFailed: 0,
      });
      return { success: true, schoolData };
    } catch (error: any) {
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  async syncAttendanceData(tenantId: string, startDate: Date, endDate: Date) {
    this.requireOfficialIntegration();
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('UDISE+ integration not configured', HttpStatus.BAD_REQUEST);
    }

    const syncLog = await this.createSyncLog(
      tenantId,
      integration.id,
      UdiseSyncType.ATTENDANCE_DATA,
    );

    try {
      const attendanceRecords = await this.prisma.attendanceRecord.findMany({
        where: { tenantId, date: { gte: startDate, lte: endDate } },
        include: {
          student: { select: { admissionNumber: true, firstName: true, lastName: true, apaarId: true } },
        },
      });

      const groupedByDate = attendanceRecords.reduce((acc: any, record: any) => {
        const dateKey = record.date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = { date: dateKey, total: 0, present: 0, absent: 0, late: 0 };
        }
        acc[dateKey].total++;
        if (record.status === 'PRESENT') acc[dateKey].present++;
        if (record.status === 'ABSENT') acc[dateKey].absent++;
        if (record.status === 'LATE') acc[dateKey].late++;
        return acc;
      }, {});

      const summary = Object.values(groupedByDate);
      await this.callUdiseApi(integration, '/attendance/summary', 'POST', {
        udise_school_code: integration.udiseSchoolCode,
        start_date: startDate,
        end_date: endDate,
        daily_summaries: summary,
      });

      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.COMPLETED,
        recordsAttempted: attendanceRecords.length,
        recordsSucceeded: attendanceRecords.length,
        recordsFailed: 0,
      });

      return { success: true, recordsSynced: attendanceRecords.length, summary };
    } catch (error: any) {
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  async validateStudentData(studentId: string): Promise<{
    isValid: boolean;
    errors: Array<{ field: string; message: string }>;
    warnings: string[];
  }> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        currentClass: true,
        guardianLinks: { include: { guardian: true } },
      },
    });

    if (!student) {
      throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
    }

    const validationErrors: Array<{ field: string; message: string }> = [];
    const warnings: string[] = [];

    if (!student.firstName) validationErrors.push({ field: 'firstName', message: 'First name is required' });
    if (!student.lastName) validationErrors.push({ field: 'lastName', message: 'Last name is required' });
    if (!student.dateOfBirth) validationErrors.push({ field: 'dateOfBirth', message: 'Date of birth is required' });
    if (!student.gender) validationErrors.push({ field: 'gender', message: 'Gender is required' });
    if (!student.admissionNumber) validationErrors.push({ field: 'admissionNumber', message: 'Admission number is required' });

    if (!student.aadhaarLast4 && !student.apaarId && !student.birthCertNumber) {
      validationErrors.push({
        field: 'identification',
        message: 'Either Aadhaar (last 4), APAAR ID, or Birth Certificate number is required for UDISE+ SDMIS',
      });
    }

    if (student.apaarId && !/^\d{12}$/.test(student.apaarId)) {
      validationErrors.push({ field: 'apaarId', message: 'APAAR ID must be a 12-digit number' });
    }

    if (!student.guardianLinks || student.guardianLinks.length === 0) {
      validationErrors.push({ field: 'guardians', message: 'At least one guardian must be linked' });
    } else {
      const primaryGuardian = student.guardianLinks.find((g: any) => g.isPrimary);
      if (!primaryGuardian) {
        warnings.push('No primary guardian designated');
      }
      student.guardianLinks.forEach((link: any, index: number) => {
        if (!link.guardian.phone) {
          validationErrors.push({
            field: `guardian_${index}_phone`,
            message: 'Guardian phone number is required',
          });
        }
      });
    }

    if (!student.currentClass) {
      warnings.push('Student not assigned to a class');
    }

    const isValid = validationErrors.length === 0;

    await this.prisma.udiseStudentRecord.upsert({
      where: { studentId: student.id },
      update: {
        validationStatus: isValid ? ValidationStatus.VALID : ValidationStatus.INVALID,
        validationErrors: (validationErrors.length > 0 ? validationErrors : null) as any,
      },
      create: {
        tenantId: student.tenantId,
        studentId: student.id,
        validationStatus: isValid ? ValidationStatus.VALID : ValidationStatus.INVALID,
        validationErrors: (validationErrors.length > 0 ? validationErrors : null) as any,
      },
    });

    return { isValid, errors: validationErrors, warnings };
  }

  async performFullSync(tenantId: string) {
    this.requireOfficialIntegration();
    const studentSync = await this.syncStudentEnrollment(tenantId);
    const teacherSync = await this.syncTeacherData(tenantId);
    await this.syncSchoolProfile(tenantId);

    const errors = [...(studentSync.errors || []), ...(teacherSync.errors || [])];
    return {
      success: errors.length === 0,
      results: {
        students: studentSync,
        teachers: teacherSync,
        errors,
      },
    };
  }

  async getSyncHistory(tenantId: string, limit: number = 50) {
    return this.prisma.udiseSyncLog.findMany({
      where: { tenantId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  private async createSyncLog(tenantId: string, udiseIntegrationId: string, syncType: UdiseSyncType) {
    return this.prisma.udiseSyncLog.create({
      data: {
        tenantId,
        udiseIntegrationId,
        syncType,
        status: SyncStatus.IN_PROGRESS,
        direction: SyncDirection.OUTBOUND,
      },
    });
  }

  private async updateSyncLog(syncLogId: string, data: any) {
    return this.prisma.udiseSyncLog.update({
      where: { id: syncLogId },
      data: {
        ...data,
        completedAt: new Date(),
      },
    });
  }

  private async callUdiseApi(_integration: any, _endpoint: string, _method: string, _data?: any): Promise<any> {
    this.requireOfficialIntegration();
    throw new HttpException('Official API unavailable', HttpStatus.NOT_IMPLEMENTED);
  }
}
