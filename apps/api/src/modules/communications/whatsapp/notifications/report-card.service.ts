import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp.service';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantService } from '../../../../database/tenant.service';

export interface ReportCardDeliveryOptions {
  reportCardId?: string; // Specific report card
  termId?: string; // All report cards for a term
  classId?: string; // All report cards for a class
  studentId?: string; // Report card for specific student
  language?: 'en' | 'sw';
  includeRemarks?: boolean; // Include teacher's remarks in message
}

export interface ReportCardDeliveryResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  details: Array<{
    studentId: string;
    studentName: string;
    guardianPhone: string;
    success: boolean;
    error?: string;
  }>;
}

@Injectable()
export class ReportCardService {
  private readonly logger = new Logger(ReportCardService.name);

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Send report cards via WhatsApp
   */
  async sendReportCards(
    options: ReportCardDeliveryOptions,
  ): Promise<ReportCardDeliveryResult> {
    const tenantId = this.tenantService.requireTenantContext();
    const language = options.language || 'en';

    // Get report cards based on criteria
    const reportCards = await this.getReportCards(tenantId, options);

    if (reportCards.length === 0) {
      this.logger.log('No report cards found matching the criteria');
      return {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        details: [],
      };
    }

    this.logger.log(`Processing ${reportCards.length} report card deliveries`);

    const results: ReportCardDeliveryResult = {
      totalProcessed: reportCards.length,
      successful: 0,
      failed: 0,
      details: [],
    };

    // Send WhatsApp message with report card to each guardian
    for (const reportCard of reportCards) {
      try {
        const guardianPhone = reportCard.student.guardian?.phoneNumber;
        const guardianWhatsApp = reportCard.student.guardian?.whatsappNumber;

        // Use WhatsApp number if available, otherwise try phone number
        const recipientPhone = guardianWhatsApp || guardianPhone;

        if (!recipientPhone) {
          this.logger.warn(
            `No contact number for student ${reportCard.student.firstName} ${reportCard.student.lastName}`,
          );
          results.failed++;
          results.details.push({
            studentId: reportCard.student.id,
            studentName: `${reportCard.student.firstName} ${reportCard.student.lastName}`,
            guardianPhone: 'N/A',
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
        const message = this.buildReportCardMessage(
          reportCard,
          language,
          options.includeRemarks,
        );

        // Check if report card has a PDF URL
        const pdfUrl = reportCard.pdfUrl;

        // Send WhatsApp message (with PDF if available)
        const result = await this.whatsAppService.sendMessage({
          to: formattedPhone,
          body: message,
          mediaUrl: pdfUrl || undefined,
        });

        if (result) {
          results.successful++;
          results.details.push({
            studentId: reportCard.student.id,
            studentName: `${reportCard.student.firstName} ${reportCard.student.lastName}`,
            guardianPhone: formattedPhone,
            success: true,
          });

          // Log the delivery in database
          await this.logReportCardDelivery(
            reportCard.id,
            formattedPhone,
            result.sid,
          );

          // Update report card as delivered
          await this.markAsDelivered(reportCard.id);
        } else {
          results.failed++;
          results.details.push({
            studentId: reportCard.student.id,
            studentName: `${reportCard.student.firstName} ${reportCard.student.lastName}`,
            guardianPhone: formattedPhone,
            success: false,
            error: 'Failed to send message',
          });
        }

        // Small delay to respect rate limits
        await this.delay(100);
      } catch (error) {
        this.logger.error(
          `Failed to send report card for student ${reportCard.student.firstName}`,
          error.message,
        );
        results.failed++;
        results.details.push({
          studentId: reportCard.student.id,
          studentName: `${reportCard.student.firstName} ${reportCard.student.lastName}`,
          guardianPhone: 'N/A',
          success: false,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Report card delivery completed: ${results.successful} successful, ${results.failed} failed`,
    );

    return results;
  }

  /**
   * Send individual report card with PDF
   */
  async sendReportCardWithPdf(
    reportCardId: string,
    pdfUrl: string,
    language: 'en' | 'sw' = 'en',
  ): Promise<boolean> {
    const tenantId = this.tenantService.requireTenantContext();

    const reportCard = await this.prisma.reportCard.findFirst({
      where: { id: reportCardId, tenantId },
      include: {
        student: {
          include: {
            guardian: true,
            class: true,
          },
        },
        term: true,
      },
    });

    if (!reportCard) {
      throw new Error('Report card not found');
    }

    const guardianPhone =
      reportCard.student.guardian?.whatsappNumber ||
      reportCard.student.guardian?.phoneNumber;

    if (!guardianPhone) {
      this.logger.warn('No contact number for report card delivery');
      return false;
    }

    const formattedPhone = this.whatsAppService.validatePhoneNumber(
      guardianPhone,
    )
      ? guardianPhone
      : this.whatsAppService.formatPhoneNumber(guardianPhone, '254');

    const message = this.buildReportCardMessage(reportCard, language, true);

    const result = await this.whatsAppService.sendDocument(
      formattedPhone,
      message,
      pdfUrl,
    );

    if (result) {
      await this.logReportCardDelivery(reportCard.id, formattedPhone, result.sid);
      await this.markAsDelivered(reportCard.id);
    }

    return !!result;
  }

  /**
   * Send report card summary (grades overview without PDF)
   */
  async sendReportCardSummary(
    reportCardId: string,
    language: 'en' | 'sw' = 'en',
  ): Promise<boolean> {
    const tenantId = this.tenantService.requireTenantContext();

    const reportCard = await this.prisma.reportCard.findFirst({
      where: { id: reportCardId, tenantId },
      include: {
        student: {
          include: {
            guardian: true,
            class: true,
          },
        },
        term: true,
        grades: {
          include: {
            subject: true,
          },
          orderBy: {
            subject: {
              name: 'asc',
            },
          },
        },
      },
    });

    if (!reportCard) {
      throw new Error('Report card not found');
    }

    const guardianPhone =
      reportCard.student.guardian?.whatsappNumber ||
      reportCard.student.guardian?.phoneNumber;

    if (!guardianPhone) {
      return false;
    }

    const formattedPhone = this.whatsAppService.validatePhoneNumber(
      guardianPhone,
    )
      ? guardianPhone
      : this.whatsAppService.formatPhoneNumber(guardianPhone, '254');

    const message = this.buildDetailedReportCardMessage(reportCard, language);

    const result = await this.whatsAppService.sendMessage({
      to: formattedPhone,
      body: message,
    });

    return !!result;
  }

  /**
   * Get report cards based on criteria
   */
  private async getReportCards(
    tenantId: string,
    options: ReportCardDeliveryOptions,
  ) {
    const where: any = {
      tenantId,
      status: 'APPROVED', // Only send approved report cards
    };

    // Specific report card
    if (options.reportCardId) {
      where.id = options.reportCardId;
    }

    // Filter by term
    if (options.termId) {
      where.termId = options.termId;
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

    return this.prisma.reportCard.findMany({
      where,
      include: {
        student: {
          include: {
            guardian: true,
            class: true,
          },
        },
        term: true,
        grades: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Build report card notification message
   */
  private buildReportCardMessage(
    reportCard: any,
    language: 'en' | 'sw',
    includeRemarks: boolean = false,
  ): string {
    const studentName = `${reportCard.student.firstName} ${reportCard.student.lastName}`;
    const className = reportCard.student.class?.name || 'N/A';
    const termName = reportCard.term?.name || 'Current Term';
    const totalMarks = reportCard.totalMarks || 0;
    const obtainedMarks = reportCard.obtainedMarks || 0;
    const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : '0.00';
    const grade = reportCard.overallGrade || 'N/A';
    const position = reportCard.position || 'N/A';
    const remarks = reportCard.teacherRemarks || '';

    if (language === 'sw') {
      // Swahili message
      return (
        `📊 *Kadi ya Ripoti Iko Tayari*\n\n` +
        `Mzazi mpendwa,\n\n` +
        `Mwanafunzi: *${studentName}*\n` +
        `Darasa: *${className}*\n` +
        `Muhula: *${termName}*\n\n` +
        `📈 Muhtasari wa Utendaji:\n` +
        `Jumla ya Alama: ${obtainedMarks}/${totalMarks}\n` +
        `Asilimia: ${percentage}%\n` +
        `Daraja: *${grade}*\n` +
        `Nafasi: *${position}*\n\n` +
        (includeRemarks && remarks ? `Maoni ya Mwalimu:\n${remarks}\n\n` : '') +
        `Tafadhali angalia kadi ya ripoti kamili iliyoambatishwa kama PDF.\n\n` +
        `Hongera! 🎉`
      );
    } else {
      // English message
      return (
        `📊 *Report Card Ready*\n\n` +
        `Dear Parent,\n\n` +
        `Student: *${studentName}*\n` +
        `Class: *${className}*\n` +
        `Term: *${termName}*\n\n` +
        `📈 Performance Summary:\n` +
        `Total Marks: ${obtainedMarks}/${totalMarks}\n` +
        `Percentage: ${percentage}%\n` +
        `Grade: *${grade}*\n` +
        `Position: *${position}*\n\n` +
        (includeRemarks && remarks ? `Teacher's Remarks:\n${remarks}\n\n` : '') +
        `Please find the detailed report card attached as PDF.\n\n` +
        `Congratulations! 🎉`
      );
    }
  }

  /**
   * Build detailed report card message with subject-wise breakdown
   */
  private buildDetailedReportCardMessage(
    reportCard: any,
    language: 'en' | 'sw',
  ): string {
    const studentName = `${reportCard.student.firstName} ${reportCard.student.lastName}`;
    const className = reportCard.student.class?.name || 'N/A';
    const termName = reportCard.term?.name || 'Current Term';
    const grade = reportCard.overallGrade || 'N/A';
    const position = reportCard.position || 'N/A';

    // Build subject-wise breakdown
    let subjectBreakdown = '';
    if (reportCard.grades && reportCard.grades.length > 0) {
      reportCard.grades.forEach((gradeEntry: any) => {
        const subjectName = gradeEntry.subject?.name || 'Unknown';
        const marks = gradeEntry.obtainedMarks || 0;
        const total = gradeEntry.totalMarks || 0;
        const subjectGrade = gradeEntry.grade || 'N/A';
        
        if (language === 'sw') {
          subjectBreakdown += `• ${subjectName}: ${marks}/${total} (${subjectGrade})\n`;
        } else {
          subjectBreakdown += `• ${subjectName}: ${marks}/${total} (${subjectGrade})\n`;
        }
      });
    }

    if (language === 'sw') {
      return (
        `📊 *Muhtasari wa Kadi ya Ripoti*\n\n` +
        `Mwanafunzi: *${studentName}*\n` +
        `Darasa: *${className}*\n` +
        `Muhula: *${termName}*\n\n` +
        `📚 Utendaji wa Masomo:\n${subjectBreakdown}\n` +
        `Daraja la Jumla: *${grade}*\n` +
        `Nafasi: *${position}*\n\n` +
        `Umefanya vizuri! 🎓`
      );
    } else {
      return (
        `📊 *Report Card Summary*\n\n` +
        `Student: *${studentName}*\n` +
        `Class: *${className}*\n` +
        `Term: *${termName}*\n\n` +
        `📚 Subject-wise Performance:\n${subjectBreakdown}\n` +
        `Overall Grade: *${grade}*\n` +
        `Position: *${position}*\n\n` +
        `Well done! 🎓`
      );
    }
  }

  /**
   * Mark report card as delivered
   */
  private async markAsDelivered(reportCardId: string): Promise<void> {
    try {
      await this.prisma.reportCard.update({
        where: { id: reportCardId },
        data: {
          deliveredAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to mark report card as delivered', error);
    }
  }

  /**
   * Log report card delivery in database
   */
  private async logReportCardDelivery(
    reportCardId: string,
    recipientPhone: string,
    twilioSid: string,
  ): Promise<void> {
    try {
      await this.prisma.communicationLog.create({
        data: {
          type: 'WHATSAPP',
          recipient: recipientPhone,
          subject: 'Report Card Delivery',
          status: 'SENT',
          sentAt: new Date(),
          metadata: {
            reportCardId,
            twilioSid,
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to log report card delivery', error);
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

