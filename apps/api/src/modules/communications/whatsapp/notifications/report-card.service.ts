import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp.service';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantService } from '../../../../database/tenant.service';

export interface ReportCardDeliveryOptions {
  reportCardId?: string; // Specific report card
  termId?: string; // All report cards for a term
  classId?: string; // All report cards for a class
  studentId?: string; // Report card for specific student
  language?: 'en' | 'hi' | 'ml';
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
          : this.whatsAppService.formatPhoneNumber(recipientPhone, '91');

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
    language: 'en' | 'hi' | 'ml' = 'en',
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
      : this.whatsAppService.formatPhoneNumber(guardianPhone, '91');

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
    language: 'en' | 'hi' | 'ml' = 'en',
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
      : this.whatsAppService.formatPhoneNumber(guardianPhone, '91');

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
    language: 'en' | 'hi' | 'ml',
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

    if (language === 'ml') {
      return (
        `📊 *പരീക്ഷാ ഫലം ലഭ്യമാണ് (Report Card)*\n\n` +
        `പ്രിയ രക്ഷിതാവേ,\n\n` +
        `വിദ്യാർത്ഥി: *${studentName}*\n` +
        `ക്ലാസ്സ്: *${className}*\n` +
        `ടേം: *${termName}*\n\n` +
        `📈 പരീക്ഷാ പ്രകടനം:\n` +
        `മൊത്തം മാർക്ക്: ${obtainedMarks}/${totalMarks}\n` +
        `ശതമാനം: ${percentage}%\n` +
        `ഗ്രേഡ്: *${grade}*\n` +
        `ക്ലാസ്സ് റാങ്ക്: *${position}*\n\n` +
        (includeRemarks && remarks ? `ടീച്ചറുടെ വിലയിരുത്തൽ:\n${remarks}\n\n` : '') +
        `ഔദ്യോഗിക ഡിജിറ്റൽ പ്രോഗ്രസ് കാർഡ് PDF താഴെ ചേർത്തിരിക്കുന്നു. ചാറ്റിൽ നിന്ന് നേരിട്ട് ഡൗൺലോഡ് ചെയ്യാം.\n\n` +
        `അഭിനന്ദനങ്ങൾ! 🎉`
      );
    } else if (language === 'hi') {
      // Hindi message
      return (
        `📊 *प्रगति पत्र तैयार है (Report Card Ready)*\n\n` +
        `प्रिय अभिभावक,\n\n` +
        `विद्यार्थी: *${studentName}*\n` +
        `कक्षा: *${className}*\n` +
        `सत्र: *${termName}*\n\n` +
        `📈 प्रदर्शन सारांश:\n` +
        `कुल अंक: ${obtainedMarks}/${totalMarks}\n` +
        `प्रतिशत: ${percentage}%\n` +
        `ग्रेड: *${grade}*\n` +
        `स्थान: *${position}*\n\n` +
        (includeRemarks && remarks ? `शिक्षक की टिप्पणी:\n${remarks}\n\n` : '') +
        `विस्तृत प्रगति पत्र PDF के रूप में संलग्न है।\n\n` +
        `हार्दिक बधाई! 🎉`
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
    language: 'en' | 'hi' | 'ml',
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
        
        subjectBreakdown += `• ${subjectName}: ${marks}/${total} (${subjectGrade})\n`;
      });
    }

    if (language === 'ml') {
      return (
        `📊 *വിശദമായ പ്രോഗ്രസ് റിപ്പോർട്ട്*\n\n` +
        `വിദ്യാർത്ഥി: *${studentName}*\n` +
        `ക്ലാസ്സ്: *${className}*\n` +
        `ടേം: *${termName}*\n\n` +
        `📚 വിഷയാടിസ്ഥാനത്തിലുള്ള മാർക്കുകൾ:\n${subjectBreakdown}\n` +
        `ആകെ ഗ്രേഡ്: *${grade}*\n` +
        `ക്ലാസ്സ് റാങ്ക്: *${position}*\n\n` +
        `മികച്ച പ്രകടനം തുടരുക! 🎓`
      );
    } else if (language === 'hi') {
      return (
        `📊 *विस्तृत प्रगति पत्र सारांश*\n\n` +
        `विद्यार्थी: *${studentName}*\n` +
        `कक्षा: *${className}*\n` +
        `सत्र: *${termName}*\n\n` +
        `📚 विषयवार अंक विवरण:\n${subjectBreakdown}\n` +
        `समग्र ग्रेड: *${grade}*\n` +
        `स्थान: *${position}*\n\n` +
        `बहुत बढ़िया प्रदर्शन! 🎓`
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

