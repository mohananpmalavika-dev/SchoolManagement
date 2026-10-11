import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp.service';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantService } from '../../../../database/tenant.service';

export interface AttendanceAlertOptions {
  date?: Date; // Specific date (defaults to today)
  classId?: string; // Specific class
  studentId?: string; // Specific student
  status?: 'ABSENT' | 'LATE' | 'EXCUSED' | 'ALL'; // Alert for specific status
  language?: 'en' | 'sw' | 'ml';
}

export interface AttendanceAlertResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  details: Array<{
    studentId: string;
    studentName: string;
    guardianPhone: string;
    status: string;
    success: boolean;
    error?: string;
  }>;
}

@Injectable()
export class AttendanceAlertService {
  private readonly logger = new Logger(AttendanceAlertService.name);

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Send attendance alerts via WhatsApp
   */
  async sendAttendanceAlerts(
    options: AttendanceAlertOptions,
  ): Promise<AttendanceAlertResult> {
    const tenantId = this.tenantService.requireTenantContext();
    const language = options.language || 'en';
    const alertDate = options.date || new Date();

    // Get attendance records for the specified criteria
    const attendanceRecords = await this.getAttendanceRecords(tenantId, options);

    if (attendanceRecords.length === 0) {
      this.logger.log('No attendance records found matching the criteria');
      return {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        details: [],
      };
    }

    this.logger.log(`Processing ${attendanceRecords.length} attendance alerts`);

    const results: AttendanceAlertResult = {
      totalProcessed: attendanceRecords.length,
      successful: 0,
      failed: 0,
      details: [],
    };

    // Send WhatsApp message to each guardian
    for (const record of attendanceRecords) {
      try {
        const guardianPhone = record.student.guardian?.phoneNumber;
        const guardianWhatsApp = record.student.guardian?.whatsappNumber;

        // Use WhatsApp number if available, otherwise try phone number
        const recipientPhone = guardianWhatsApp || guardianPhone;

        if (!recipientPhone) {
          this.logger.warn(
            `No contact number for student ${record.student.firstName} ${record.student.lastName}`,
          );
          results.failed++;
          results.details.push({
            studentId: record.student.id,
            studentName: `${record.student.firstName} ${record.student.lastName}`,
            guardianPhone: 'N/A',
            status: record.status,
            success: false,
            error: 'No contact number available',
          });
          continue;
        }

        // Format and validate phone number
        const formattedPhone = this.whatsAppService.validatePhoneNumber(
          recipientPhone,
        )
          ? recipientPhone
          : this.whatsAppService.formatPhoneNumber(recipientPhone, '254');

        // Build message
        const message = this.buildAttendanceAlertMessage(record, language);

        // Send WhatsApp message
        const result = await this.whatsAppService.sendMessage({
          to: formattedPhone,
          body: message,
        });

        if (result) {
          results.successful++;
          results.details.push({
            studentId: record.student.id,
            studentName: `${record.student.firstName} ${record.student.lastName}`,
            guardianPhone: formattedPhone,
            status: record.status,
            success: true,
          });

          // Log the alert in database
          await this.logAttendanceAlert(record.id, formattedPhone, result.sid);
        } else {
          results.failed++;
          results.details.push({
            studentId: record.student.id,
            studentName: `${record.student.firstName} ${record.student.lastName}`,
            guardianPhone: formattedPhone,
            status: record.status,
            success: false,
            error: 'Failed to send message',
          });
        }

        // Small delay to respect rate limits
        await this.delay(100);
      } catch (error) {
        this.logger.error(
          `Failed to send alert for student ${record.student.firstName}`,
          error.message,
        );
        results.failed++;
        results.details.push({
          studentId: record.student.id,
          studentName: `${record.student.firstName} ${record.student.lastName}`,
          guardianPhone: 'N/A',
          status: record.status,
          success: false,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Attendance alerts completed: ${results.successful} successful, ${results.failed} failed`,
    );

    return results;
  }

  /**
   * Send daily attendance summary to all parents
   */
  async sendDailyAttendanceSummary(
    date?: Date,
    language: 'en' | 'sw' = 'en',
  ): Promise<AttendanceAlertResult> {
    const tenantId = this.tenantService.requireTenantContext();
    const summaryDate = date || new Date();

    // Get all attendance records for the day
    const startOfDay = new Date(summaryDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(summaryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        tenantId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        student: {
          include: {
            guardian: true,
            class: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (attendanceRecords.length === 0) {
      this.logger.log('No attendance records found for daily summary');
      return {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        details: [],
      };
    }

    this.logger.log(`Sending daily summary for ${attendanceRecords.length} students`);

    const results: AttendanceAlertResult = {
      totalProcessed: attendanceRecords.length,
      successful: 0,
      failed: 0,
      details: [],
    };

    for (const record of attendanceRecords) {
      try {
        const guardianPhone =
          record.student.guardian?.whatsappNumber ||
          record.student.guardian?.phoneNumber;

        if (!guardianPhone) {
          results.failed++;
          continue;
        }

        const formattedPhone = this.whatsAppService.validatePhoneNumber(
          guardianPhone,
        )
          ? guardianPhone
          : this.whatsAppService.formatPhoneNumber(guardianPhone, '254');

        const message = this.buildDailySummaryMessage(record, language);

        const result = await this.whatsAppService.sendMessage({
          to: formattedPhone,
          body: message,
        });

        if (result) {
          results.successful++;
          results.details.push({
            studentId: record.student.id,
            studentName: `${record.student.firstName} ${record.student.lastName}`,
            guardianPhone: formattedPhone,
            status: record.status,
            success: true,
          });
        }

        await this.delay(100);
      } catch (error) {
        this.logger.error('Failed to send daily summary', error);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Send instant alert when student is marked absent or late
   */
  async sendInstantAlert(
    attendanceId: string,
    language: 'en' | 'sw' = 'en',
  ): Promise<boolean> {
    const tenantId = this.tenantService.requireTenantContext();

    const attendance = await this.prisma.attendance.findFirst({
      where: { id: attendanceId, tenantId },
      include: {
        student: {
          include: {
            guardian: true,
            class: true,
          },
        },
      },
    });

    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    // Only send instant alerts for ABSENT or LATE
    if (attendance.status !== 'ABSENT' && attendance.status !== 'LATE') {
      this.logger.log(
        `Skipping instant alert for status: ${attendance.status}`,
      );
      return false;
    }

    const guardianPhone =
      attendance.student.guardian?.whatsappNumber ||
      attendance.student.guardian?.phoneNumber;

    if (!guardianPhone) {
      this.logger.warn('No contact number for instant alert');
      return false;
    }

    const formattedPhone = this.whatsAppService.validatePhoneNumber(
      guardianPhone,
    )
      ? guardianPhone
      : this.whatsAppService.formatPhoneNumber(guardianPhone, '254');

    const message = this.buildAttendanceAlertMessage(attendance, language);

    const result = await this.whatsAppService.sendMessage({
      to: formattedPhone,
      body: message,
    });

    if (result) {
      await this.logAttendanceAlert(attendance.id, formattedPhone, result.sid);
    }

    return !!result;
  }

  /**
   * Get attendance records based on options
   */
  private async getAttendanceRecords(
    tenantId: string,
    options: AttendanceAlertOptions,
  ) {
    const alertDate = options.date || new Date();
    const startOfDay = new Date(alertDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(alertDate);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      tenantId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    // Filter by status
    if (options.status && options.status !== 'ALL') {
      where.status = options.status;
    } else {
      // By default, only alert for ABSENT and LATE
      where.status = {
        in: ['ABSENT', 'LATE'],
      };
    }

    // Filter by class
    if (options.classId) {
      where.student = {
        classId: options.classId,
      };
    }

    // Filter by student
    if (options.studentId) {
      where.studentId = options.studentId;
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            guardian: true,
            class: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * Build attendance alert message
   */
  private buildAttendanceAlertMessage(
    attendance: any,
    language: 'en' | 'sw' | 'ml',
  ): string {
    const studentName = `${attendance.student.firstName} ${attendance.student.lastName}`;
    const className = attendance.student.class?.name || 'N/A';
    const date = this.formatDate(attendance.date);
    const status = attendance.status;
    const remarks = attendance.remarks || '';

    if (language === 'ml') {
      if (status === 'ABSENT') {
        return (
          `🏫 *സ്കൂൾ ഹാജർ അറിയിപ്പ് (Absence Alert)*\n\n` +
          `പ്രിയ രക്ഷിതാവേ,\n\n` +
          `വിദ്യാർത്ഥി: *${studentName}*\n` +
          `ക്ലാസ്സ്: *${className}*\n` +
          `തീയതി: *${date}*\n\n` +
          `⚠️ നിങ്ങളുടെ കുട്ടി ഇന്ന് സ്കൂളിൽ ഹാജരായിട്ടില്ലെന്ന് ക്ലാസ്സ് ടീച്ചർ രേഖപ്പെടുത്തിയിട്ടുണ്ട്.\n\n` +
          (remarks ? `വിശദാംശങ്ങൾ: ${remarks}\n\n` : '') +
          `കുട്ടി സുരക്ഷിതമായി വീട്ടിൽ തന്നെയുണ്ടെന്ന് ഉറപ്പുവരുത്തുക. അപ്രതീക്ഷിതമാണെങ്കിൽ ദയവായി സ്കൂൾ ഹെൽപ്പ്‌ലൈനിൽ ബന്ധപ്പെടുക.\n\n` +
          `നന്ദി`
        );
      } else if (status === 'LATE') {
        return (
          `🏫 *വൈകിയെത്തിയ വിവരം (Late Notice)*\n\n` +
          `പ്രിയ രക്ഷിതാവേ,\n\n` +
          `വിദ്യാർത്ഥി: *${studentName}*\n` +
          `ക്ലാസ്സ്: *${className}*\n` +
          `തീയതി: *${date}*\n\n` +
          `ℹ️ നിങ്ങളുടെ കുട്ടി ഇന്ന് സ്കൂളിൽ വൈകിയാണ് എത്തിയത്.\n\n` +
          (remarks ? `കാരണം: ${remarks}\n\n` : '') +
          `നന്ദി`
        );
      } else {
        return (
          `🏫 *സ്കൂൾ ഹാജർ അറിയിപ്പ്*\n\n` +
          `പ്രിയ രക്ഷിതാവേ,\n\n` +
          `വിദ്യാർത്ഥി: *${studentName}*\n` +
          `ക്ലാസ്സ്: *${className}*\n` +
          `തീയതി: *${date}*\n` +
          `സ്റ്റാറ്റസ്: *${status}*\n\n` +
          `നന്ദി`
        );
      }
    } else if (language === 'sw') {
      // Swahili message
      if (status === 'ABSENT') {
        return (
          `🏫 *Arifa ya Mahudhurio*\n\n` +
          `Mzazi mpendwa,\n\n` +
          `Mwanafunzi: *${studentName}*\n` +
          `Darasa: *${className}*\n` +
          `Tarehe: *${date}*\n\n` +
          `⚠️ Mtoto wako hakuhudhuria shuleni leo.\n\n` +
          (remarks ? `Maelezo: ${remarks}\n\n` : '') +
          `Ikiwa hii ni jambo la ajabu, tafadhali wasiliana na shule.\n\n` +
          `Asante`
        );
      } else if (status === 'LATE') {
        return (
          `🏫 *Arifa ya Kuchelewa*\n\n` +
          `Mzazi mpendwa,\n\n` +
          `Mwanafunzi: *${studentName}*\n` +
          `Darasa: *${className}*\n` +
          `Tarehe: *${date}*\n\n` +
          `ℹ️ Mtoto wako alifika shuleni kwa kuchelewa leo.\n\n` +
          (remarks ? `Maelezo: ${remarks}\n\n` : '') +
          `Asante`
        );
      } else {
        return (
          `🏫 *Arifa ya Mahudhurio*\n\n` +
          `Mzazi mpendwa,\n\n` +
          `Mwanafunzi: *${studentName}*\n` +
          `Darasa: *${className}*\n` +
          `Tarehe: *${date}*\n` +
          `Hali: *${status}*\n\n` +
          (remarks ? `Maelezo: ${remarks}\n\n` : '') +
          `Asante`
        );
      }
    } else {
      // English message
      if (status === 'ABSENT') {
        return (
          `🏫 *Attendance Alert*\n\n` +
          `Dear Parent,\n\n` +
          `Student: *${studentName}*\n` +
          `Class: *${className}*\n` +
          `Date: *${date}*\n\n` +
          `⚠️ Your child was marked absent from school today.\n\n` +
          (remarks ? `Remarks: ${remarks}\n\n` : '') +
          `If this is unexpected, please contact the school.\n\n` +
          `Thank you`
        );
      } else if (status === 'LATE') {
        return (
          `🏫 *Late Arrival Notice*\n\n` +
          `Dear Parent,\n\n` +
          `Student: *${studentName}*\n` +
          `Class: *${className}*\n` +
          `Date: *${date}*\n\n` +
          `ℹ️ Your child arrived late to school today.\n\n` +
          (remarks ? `Remarks: ${remarks}\n\n` : '') +
          `Thank you`
        );
      } else {
        return (
          `🏫 *Attendance Notice*\n\n` +
          `Dear Parent,\n\n` +
          `Student: *${studentName}*\n` +
          `Class: *${className}*\n` +
          `Date: *${date}*\n` +
          `Status: *${status}*\n\n` +
          (remarks ? `Remarks: ${remarks}\n\n` : '') +
          `Thank you`
        );
      }
    }
  }

  /**
   * Build daily summary message
   */
  private buildDailySummaryMessage(
    attendance: any,
    language: 'en' | 'sw',
  ): string {
    const studentName = `${attendance.student.firstName} ${attendance.student.lastName}`;
    const className = attendance.student.class?.name || 'N/A';
    const date = this.formatDate(attendance.date);
    const status = attendance.status;

    const statusEmoji = {
      PRESENT: '✅',
      ABSENT: '❌',
      LATE: '⏰',
      EXCUSED: '📝',
    };

    const emoji = statusEmoji[status] || 'ℹ️';

    if (language === 'sw') {
      const statusText = {
        PRESENT: 'Yupo',
        ABSENT: 'Hayupo',
        LATE: 'Amechelewa',
        EXCUSED: 'Ruhusa',
      };

      return (
        `🏫 *Muhtasari wa Mahudhurio ya Kila Siku*\n\n` +
        `Mwanafunzi: *${studentName}*\n` +
        `Darasa: *${className}*\n` +
        `Tarehe: *${date}*\n\n` +
        `Hali: ${emoji} *${statusText[status] || status}*\n\n` +
        `Asante`
      );
    } else {
      return (
        `🏫 *Daily Attendance Summary*\n\n` +
        `Student: *${studentName}*\n` +
        `Class: *${className}*\n` +
        `Date: *${date}*\n\n` +
        `Status: ${emoji} *${status}*\n\n` +
        `Thank you`
      );
    }
  }

  /**
   * Log attendance alert in database
   */
  private async logAttendanceAlert(
    attendanceId: string,
    recipientPhone: string,
    twilioSid: string,
  ): Promise<void> {
    try {
      await this.prisma.communicationLog.create({
        data: {
          type: 'WHATSAPP',
          recipient: recipientPhone,
          subject: 'Attendance Alert',
          status: 'SENT',
          sentAt: new Date(),
          metadata: {
            attendanceId,
            twilioSid,
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to log attendance alert', error);
    }
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
