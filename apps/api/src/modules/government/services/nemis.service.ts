import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@krypton/database';
import { 
  NemisSyncType, 
  SyncStatus, 
  SyncDirection, 
  ValidationStatus 
} from '@prisma/client';
import axios, { AxiosInstance } from 'axios';

/**
 * NEMIS Integration Service
 * Handles synchronization with National Education Management Information System
 */
@Injectable()
export class NemisService {
  private readonly logger = new Logger(NemisService.name);
  private axiosInstance: AxiosInstance;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Initialize NEMIS integration for a tenant
   */
  async initializeIntegration(
    tenantId: string,
    nemisSchoolCode: string,
    apiKey?: string,
    apiSecret?: string,
  ) {
    try {
      const integration = await this.prisma.nemisIntegration.upsert({
        where: { nemisSchoolCode },
        update: {
          apiKey: apiKey ? this.encryptCredential(apiKey) : undefined,
          apiSecret: apiSecret ? this.encryptCredential(apiSecret) : undefined,
          isEnabled: true,
        },
        create: {
          tenantId,
          nemisSchoolCode,
          apiKey: apiKey ? this.encryptCredential(apiKey) : null,
          apiSecret: apiSecret ? this.encryptCredential(apiSecret) : null,
          isEnabled: true,
          autoSync: true,
          syncFrequency: 'DAILY',
          syncTime: '02:00',
        },
      });

      this.logger.log(`NEMIS integration initialized for tenant: ${tenantId}`);
      return integration;
    } catch (error) {
      this.logger.error(`Failed to initialize NEMIS integration: ${error.message}`);
      throw new HttpException(
        'Failed to initialize NEMIS integration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get NEMIS integration settings
   */
  async getIntegration(tenantId: string) {
    return this.prisma.nemisIntegration.findFirst({
      where: { tenantId },
    });
  }

  /**
   * Sync student enrollment data with NEMIS
   */
  async syncStudentEnrollment(tenantId: string) {
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('NEMIS integration not configured', HttpStatus.BAD_REQUEST);
    }

    const syncLog = await this.createSyncLog(
      tenantId,
      integration.id,
      NemisSyncType.STUDENT_ENROLLMENT,
    );

    try {
      // Fetch students that need syncing
      const students = await this.prisma.student.findMany({
        where: {
          tenantId,
          status: 'ACTIVE',
        },
        include: {
          currentClass: true,
          currentStream: true,
          guardianLinks: {
            include: {
              guardian: true,
            },
          },
        },
      });

      const syncResults = {
        attempted: students.length,
        succeeded: 0,
        failed: 0,
        errors: [] as any[],
      };

      // Process each student
      for (const student of students) {
        try {
          await this.syncStudentToNemis(integration, student);
          syncResults.succeeded++;
        } catch (error) {
          syncResults.failed++;
          syncResults.errors.push({
            studentId: student.id,
            admissionNumber: student.admissionNumber,
            error: error.message,
          });
        }
      }

      // Update sync log
      await this.updateSyncLog(syncLog.id, {
        status: syncResults.failed === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIAL_SUCCESS,
        recordsAttempted: syncResults.attempted,
        recordsSucceeded: syncResults.succeeded,
        recordsFailed: syncResults.failed,
        errorDetails: syncResults.errors.length > 0 ? syncResults.errors : null,
      });

      // Update integration last sync time
      await this.prisma.nemisIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          syncStatus: syncResults.failed === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIAL_SUCCESS,
        },
      });

      return {
        success: true,
        ...syncResults,
      };
    } catch (error) {
      this.logger.error(`Student enrollment sync failed: ${error.message}`);
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Sync individual student to NEMIS
   */
  private async syncStudentToNemis(integration: any, student: any) {
    // Check if student already has NEMIS record
    let nemisRecord = await this.prisma.nemisStudentRecord.findUnique({
      where: { studentId: student.id },
    });

    // Prepare student data for NEMIS
    const nemisData = {
      admission_number: student.admissionNumber,
      first_name: student.firstName,
      middle_name: student.middleName,
      last_name: student.lastName,
      date_of_birth: student.dateOfBirth,
      gender: student.gender,
      national_id: student.nationalId,
      birth_cert_number: student.birthCertNumber,
      class: student.currentClass?.name,
      stream: student.currentStream?.name,
      status: student.status,
      admission_date: student.admissionDate,
      guardians: student.guardianLinks.map((link: any) => ({
        name: `${link.guardian.firstName} ${link.guardian.lastName}`,
        relationship: link.relationship,
        phone: link.guardian.phone,
        email: link.guardian.email,
        is_primary: link.isPrimary,
      })),
    };

    // Simulate NEMIS API call (replace with actual API integration)
    const response = await this.callNemisApi(
      integration,
      '/students/register',
      'POST',
      nemisData,
    );

    // Update or create NEMIS student record
    if (!nemisRecord) {
      nemisRecord = await this.prisma.nemisStudentRecord.create({
        data: {
          tenantId: student.tenantId,
          studentId: student.id,
          nemisUpi: response.upi,
          nemisStudentId: response.student_id,
          syncStatus: SyncStatus.COMPLETED,
          lastSyncedAt: new Date(),
          validationStatus: ValidationStatus.VALID,
          lastSyncedData: nemisData,
        },
      });
    } else {
      await this.prisma.nemisStudentRecord.update({
        where: { id: nemisRecord.id },
        data: {
          nemisUpi: response.upi || nemisRecord.nemisUpi,
          nemisStudentId: response.student_id || nemisRecord.nemisStudentId,
          syncStatus: SyncStatus.COMPLETED,
          lastSyncedAt: new Date(),
          validationStatus: ValidationStatus.VALID,
          lastSyncedData: nemisData,
        },
      });
    }

    return nemisRecord;
  }

  /**
   * Sync teacher data with NEMIS
   */
  async syncTeacherData(tenantId: string) {
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('NEMIS integration not configured', HttpStatus.BAD_REQUEST);
    }

    const syncLog = await this.createSyncLog(
      tenantId,
      integration.id,
      NemisSyncType.TEACHER_DATA,
    );

    try {
      // Fetch teachers (staff who are teachers)
      const teachers = await this.prisma.staff.findMany({
        where: {
          tenantId,
          isTeacher: true,
          status: 'ACTIVE',
        },
      });

      const syncResults = {
        attempted: teachers.length,
        succeeded: 0,
        failed: 0,
        errors: [] as any[],
      };

      // Process each teacher
      for (const teacher of teachers) {
        try {
          await this.syncTeacherToNemis(integration, teacher);
          syncResults.succeeded++;
        } catch (error) {
          syncResults.failed++;
          syncResults.errors.push({
            staffId: teacher.id,
            staffNumber: teacher.staffNumber,
            error: error.message,
          });
        }
      }

      // Update sync log
      await this.updateSyncLog(syncLog.id, {
        status: syncResults.failed === 0 ? SyncStatus.COMPLETED : SyncStatus.PARTIAL_SUCCESS,
        recordsAttempted: syncResults.attempted,
        recordsSucceeded: syncResults.succeeded,
        recordsFailed: syncResults.failed,
        errorDetails: syncResults.errors.length > 0 ? syncResults.errors : null,
      });

      // Update integration
      await this.prisma.nemisIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      });

      return {
        success: true,
        ...syncResults,
      };
    } catch (error) {
      this.logger.error(`Teacher data sync failed: ${error.message}`);
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Sync individual teacher to NEMIS
   */
  private async syncTeacherToNemis(integration: any, teacher: any) {
    let nemisRecord = await this.prisma.nemisStaffRecord.findUnique({
      where: { staffId: teacher.id },
    });

    const nemisData = {
      staff_number: teacher.staffNumber,
      first_name: teacher.firstName,
      middle_name: teacher.middleName,
      last_name: teacher.lastName,
      date_of_birth: teacher.dateOfBirth,
      gender: teacher.gender,
      national_id: teacher.nationalId,
      email: teacher.email,
      phone: teacher.phone,
      position: teacher.position,
      department: teacher.department,
      employment_type: teacher.employmentType,
      hire_date: teacher.hireDate,
      subjects: teacher.subjects,
    };

    const response = await this.callNemisApi(
      integration,
      '/teachers/register',
      'POST',
      nemisData,
    );

    if (!nemisRecord) {
      nemisRecord = await this.prisma.nemisStaffRecord.create({
        data: {
          tenantId: teacher.tenantId,
          staffId: teacher.id,
          tscNumber: response.tsc_number,
          nemisStaffId: response.staff_id,
          isRegistered: true,
          registrationDate: new Date(),
          syncStatus: SyncStatus.COMPLETED,
          lastSyncedAt: new Date(),
          validationStatus: ValidationStatus.VALID,
          lastSyncedData: nemisData,
        },
      });
    } else {
      await this.prisma.nemisStaffRecord.update({
        where: { id: nemisRecord.id },
        data: {
          tscNumber: response.tsc_number || nemisRecord.tscNumber,
          nemisStaffId: response.staff_id || nemisRecord.nemisStaffId,
          syncStatus: SyncStatus.COMPLETED,
          lastSyncedAt: new Date(),
          lastSyncedData: nemisData,
        },
      });
    }

    return nemisRecord;
  }

  /**
   * Sync school profile data
   */
  async syncSchoolProfile(tenantId: string) {
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('NEMIS integration not configured', HttpStatus.BAD_REQUEST);
    }

    const syncLog = await this.createSyncLog(
      tenantId,
      integration.id,
      NemisSyncType.SCHOOL_PROFILE,
    );

    try {
      const school = await this.prisma.school.findFirst({
        where: { tenantId },
      });

      if (!school) {
        throw new Error('School not found');
      }

      const schoolData = {
        school_code: integration.nemisSchoolCode,
        name: school.name,
        registration_number: school.registrationNumber,
        school_type: school.schoolType,
        education_levels: school.educationLevel,
        email: school.email,
        phone: school.phone,
        address: school.address,
        city: school.city,
        county: school.county,
        postal_code: school.postalCode,
        country: school.country,
      };

      await this.callNemisApi(
        integration,
        '/schools/update',
        'PUT',
        schoolData,
      );

      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.COMPLETED,
        recordsAttempted: 1,
        recordsSucceeded: 1,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`School profile sync failed: ${error.message}`);
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Sync attendance data
   */
  async syncAttendanceData(tenantId: string, startDate: Date, endDate: Date) {
    const integration = await this.getIntegration(tenantId);
    if (!integration || !integration.isEnabled) {
      throw new HttpException('NEMIS integration not configured', HttpStatus.BAD_REQUEST);
    }

    const syncLog = await this.createSyncLog(
      tenantId,
      integration.id,
      NemisSyncType.ATTENDANCE_DATA,
    );

    try {
      const attendanceRecords = await this.prisma.attendanceRecord.findMany({
        where: {
          tenantId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          student: true,
        },
      });

      // Group by date and calculate statistics
      const attendanceByDate = new Map<string, any>();
      
      attendanceRecords.forEach((record) => {
        const dateKey = record.date.toISOString().split('T')[0];
        if (!attendanceByDate.has(dateKey)) {
          attendanceByDate.set(dateKey, {
            date: dateKey,
            total_students: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
          });
        }

        const stats = attendanceByDate.get(dateKey);
        stats.total_students++;
        
        switch (record.status) {
          case 'PRESENT':
            stats.present++;
            break;
          case 'ABSENT':
            stats.absent++;
            break;
          case 'LATE':
            stats.late++;
            break;
          case 'EXCUSED':
          case 'SICK':
            stats.excused++;
            break;
        }
      });

      const attendanceData = {
        school_code: integration.nemisSchoolCode,
        start_date: startDate,
        end_date: endDate,
        daily_attendance: Array.from(attendanceByDate.values()),
      };

      await this.callNemisApi(
        integration,
        '/attendance/bulk-upload',
        'POST',
        attendanceData,
      );

      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.COMPLETED,
        recordsAttempted: attendanceRecords.length,
        recordsSucceeded: attendanceRecords.length,
      });

      return { success: true, recordsSynced: attendanceRecords.length };
    } catch (error) {
      this.logger.error(`Attendance sync failed: ${error.message}`);
      await this.updateSyncLog(syncLog.id, {
        status: SyncStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Perform full sync of all data
   */
  async performFullSync(tenantId: string) {
    this.logger.log(`Starting full NEMIS sync for tenant: ${tenantId}`);

    const results = {
      schoolProfile: null as any,
      studentEnrollment: null as any,
      teacherData: null as any,
      errors: [] as string[],
    };

    try {
      results.schoolProfile = await this.syncSchoolProfile(tenantId);
    } catch (error) {
      results.errors.push(`School profile sync failed: ${error.message}`);
    }

    try {
      results.studentEnrollment = await this.syncStudentEnrollment(tenantId);
    } catch (error) {
      results.errors.push(`Student enrollment sync failed: ${error.message}`);
    }

    try {
      results.teacherData = await this.syncTeacherData(tenantId);
    } catch (error) {
      results.errors.push(`Teacher data sync failed: ${error.message}`);
    }

    return {
      success: results.errors.length === 0,
      results,
    };
  }

  /**
   * Get sync history
   */
  async getSyncHistory(tenantId: string, limit = 50) {
    const integration = await this.getIntegration(tenantId);
    if (!integration) {
      throw new HttpException('NEMIS integration not configured', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.nemisSyncLog.findMany({
      where: {
        tenantId,
        nemisIntegrationId: integration.id,
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Validate student data against NEMIS requirements
   */
  async validateStudentData(studentId: string) {
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
      throw new HttpException('Student not found', HttpStatus.NOT_FOUND);
    }

    const validationErrors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!student.firstName) validationErrors.push('First name is required');
    if (!student.lastName) validationErrors.push('Last name is required');
    if (!student.dateOfBirth) validationErrors.push('Date of birth is required');
    if (!student.gender) validationErrors.push('Gender is required');
    if (!student.admissionNumber) validationErrors.push('Admission number is required');
    if (!student.admissionDate) validationErrors.push('Admission date is required');

    // Identification validation
    if (!student.nationalId && !student.birthCertNumber) {
      validationErrors.push('Either National ID or Birth Certificate Number is required');
    }

    // Guardian validation
    if (student.guardianLinks.length === 0) {
      validationErrors.push('At least one guardian is required');
    } else {
      const primaryGuardian = student.guardianLinks.find(link => link.isPrimary);
      if (!primaryGuardian) {
        warnings.push('No primary guardian specified');
      }
    }

    // Class assignment
    if (!student.currentClass) {
      warnings.push('Student not assigned to a class');
    }

    const isValid = validationErrors.length === 0;

    // Update NEMIS student record validation status
    await this.prisma.nemisStudentRecord.upsert({
      where: { studentId: student.id },
      update: {
        validationStatus: isValid ? ValidationStatus.VALID : ValidationStatus.INVALID,
        validationErrors: validationErrors.length > 0 ? validationErrors : null,
      },
      create: {
        tenantId: student.tenantId,
        studentId: student.id,
        validationStatus: isValid ? ValidationStatus.VALID : ValidationStatus.INVALID,
        validationErrors: validationErrors.length > 0 ? validationErrors : null,
      },
    });

    return {
      isValid,
      errors: validationErrors,
      warnings,
    };
  }

  /**
   * Create sync log entry
   */
  private async createSyncLog(
    tenantId: string,
    nemisIntegrationId: string,
    syncType: NemisSyncType,
  ) {
    return this.prisma.nemisSyncLog.create({
      data: {
        tenantId,
        nemisIntegrationId,
        syncType,
        status: SyncStatus.IN_PROGRESS,
        direction: SyncDirection.OUTBOUND,
      },
    });
  }

  /**
   * Update sync log entry
   */
  private async updateSyncLog(syncLogId: string, data: any) {
    return this.prisma.nemisSyncLog.update({
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
   * Call NEMIS API
   */
  private async callNemisApi(
    integration: any,
    endpoint: string,
    method: string,
    data?: any,
  ) {
    const apiKey = this.decryptCredential(integration.apiKey);
    const apiSecret = this.decryptCredential(integration.apiSecret);

    // In production, implement actual API calls
    // For now, simulate successful response
    this.logger.debug(`NEMIS API Call: ${method} ${endpoint}`);
    
    // Log the API call
    await this.logApiCall(integration.tenantId, 'NEMIS', endpoint, method, data);

    // Simulate API response
    return {
      success: true,
      upi: `UPI-${Date.now()}`,
      student_id: `NEMIS-STU-${Date.now()}`,
      staff_id: `NEMIS-STF-${Date.now()}`,
      tsc_number: `TSC-${Date.now()}`,
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

  /**
   * Encrypt credential (simplified - use proper encryption in production)
   */
  private encryptCredential(credential: string): string {
    // TODO: Implement proper encryption using crypto
    return Buffer.from(credential).toString('base64');
  }

  /**
   * Decrypt credential (simplified - use proper decryption in production)
   */
  private decryptCredential(encryptedCredential: string | null): string | null {
    if (!encryptedCredential) return null;
    // TODO: Implement proper decryption using crypto
    return Buffer.from(encryptedCredential, 'base64').toString('utf-8');
  }
}
