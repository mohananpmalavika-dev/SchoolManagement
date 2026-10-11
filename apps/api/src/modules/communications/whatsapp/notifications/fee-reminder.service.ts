import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp.service';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantService } from '../../../../database/tenant.service';

export interface FeeReminderOptions {
  invoiceId?: string; // Send reminder for specific invoice
  classId?: string; // Send reminders to all students in a class
  studentId?: string; // Send reminder to specific student
  daysBeforeDue?: number; // Send reminder X days before due date
  overdueOnly?: boolean; // Only send to overdue invoices
  language?: 'en' | 'sw' | 'ml';
}

export interface FeeReminderResult {
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
export class FeeReminderService {
  private readonly logger = new Logger(FeeReminderService.name);

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Send fee reminders via WhatsApp based on options
   */
  async sendFeeReminders(options: FeeReminderOptions): Promise<FeeReminderResult> {
    const tenantId = this.tenantService.requireTenantContext();
    const language = options.language || 'en';

    // Build query to find invoices that need reminders
    const invoices = await this.getInvoicesForReminder(tenantId, options);

    if (invoices.length === 0) {
      this.logger.log('No invoices found matching the reminder criteria');
      return {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        details: [],
      };
    }

    this.logger.log(`Processing ${invoices.length} fee reminders`);

    const results: FeeReminderResult = {
      totalProcessed: invoices.length,
      successful: 0,
      failed: 0,
      details: [],
    };

    // Send WhatsApp message to each guardian
    for (const invoice of invoices) {
      try {
        const guardianPhone = invoice.student.guardian?.phoneNumber;
        const guardianWhatsApp = invoice.student.guardian?.whatsappNumber;
        
        // Use WhatsApp number if available, otherwise try phone number
        const recipientPhone = guardianWhatsApp || guardianPhone;

        if (!recipientPhone) {
          this.logger.warn(
            `No contact number for student ${invoice.student.firstName} ${invoice.student.lastName}`,
          );
          results.failed++;
          results.details.push({
            studentId: invoice.student.id,
            studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
            guardianPhone: 'N/A',
            success: false,
            error: 'No contact number available',
          });
          continue;
        }

        // Format and validate phone number
        const formattedPhone = this.whatsAppService.validatePhoneNumber(recipientPhone)
          ? recipientPhone
          : this.whatsAppService.formatPhoneNumber(recipientPhone, '254'); // Default to Kenya

        // Build message
        const message = this.buildFeeReminderMessage(invoice, language);

        // Send WhatsApp message
        const result = await this.whatsAppService.sendMessage({
          to: formattedPhone,
          body: message,
        });

        if (result) {
          results.successful++;
          results.details.push({
            studentId: invoice.student.id,
            studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
            guardianPhone: formattedPhone,
            success: true,
          });

          // Log the reminder in database
          await this.logFeeReminder(invoice.id, formattedPhone, result.sid);
        } else {
          results.failed++;
          results.details.push({
            studentId: invoice.student.id,
            studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
            guardianPhone: formattedPhone,
            success: false,
            error: 'Failed to send message',
          });
        }

        // Small delay to respect rate limits
        await this.delay(100);
      } catch (error) {
        this.logger.error(
          `Failed to send reminder for invoice ${invoice.invoiceNumber}`,
          error.message,
        );
        results.failed++;
        results.details.push({
          studentId: invoice.student.id,
          studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
          guardianPhone: 'N/A',
          success: false,
          error: error.message,
        });
      }
    }

    this.logger.log(
      `Fee reminders completed: ${results.successful} successful, ${results.failed} failed`,
    );

    return results;
  }

  /**
   * Send immediate payment confirmation via WhatsApp
   */
  async sendPaymentConfirmation(
    paymentId: string,
    language: 'en' | 'sw' = 'en',
  ): Promise<boolean> {
    const tenantId = this.tenantService.requireTenantContext();

    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        invoice: {
          include: {
            student: {
              include: {
                guardian: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const paymentData = payment as any;
    const guardianPhone =
      paymentData.invoice?.student?.guardian?.whatsappNumber ||
      paymentData.invoice?.student?.guardian?.phoneNumber;

    if (!guardianPhone) {
      this.logger.warn('No contact number for payment confirmation');
      return false;
    }

    const formattedPhone = this.whatsAppService.validatePhoneNumber(guardianPhone)
      ? guardianPhone
      : this.whatsAppService.formatPhoneNumber(guardianPhone, '254');

    const message = this.buildPaymentConfirmationMessage(payment, language);

    const result = await this.whatsAppService.sendMessage({
      to: formattedPhone,
      body: message,
    });

    return !!result;
  }

  /**
   * Query invoices that need reminders
   */
  private async getInvoicesForReminder(tenantId: string, options: FeeReminderOptions) {
    const where: any = {
      tenantId,
      status: { not: 'PAID' }, // Don't send reminders for paid invoices
    };

    // Specific invoice
    if (options.invoiceId) {
      where.id = options.invoiceId;
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

    // Overdue only
    if (options.overdueOnly) {
      where.dueDate = {
        lt: new Date(),
      };
      where.status = 'OVERDUE';
    }

    // Days before due
    if (options.daysBeforeDue && !options.overdueOnly) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + options.daysBeforeDue);

      where.dueDate = {
        lte: targetDate,
        gte: new Date(),
      };
    }

    return (this.prisma as any).invoice.findMany({
      where,
      include: {
        student: {
          include: {
            guardian: true,
            class: true,
          },
        },
        feeStructure: {
          include: {
            term: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  /**
   * Build fee reminder message
   */
  private buildFeeReminderMessage(invoice: any, language: 'en' | 'sw' | 'ml'): string {
    const studentName = `${invoice.student.firstName} ${invoice.student.lastName}`;
    const amount = this.formatAmount(invoice.totalAmount - invoice.paidAmount);
    const dueDate = this.formatDate(invoice.dueDate);
    const invoiceNumber = invoice.invoiceNumber;
    const className = invoice.student.class?.name || 'N/A';
    const termName = invoice.feeStructure?.term?.name || 'Current Term';
    const isOverdue = new Date(invoice.dueDate) < new Date();
    const upiLink = `upi://pay?pa=schoolfees@icici&pn=School+Fees&am=${invoice.totalAmount - invoice.paidAmount}&cu=INR&tn=${invoiceNumber}`;

    if (language === 'ml') {
      if (isOverdue) {
        return `🏫 *സ്കൂൾ ഫീ കുടിശ്ശിക അറിയിപ്പ് (Overdue Fee)*\n\n` +
          `പ്രിയ രക്ഷിതാവേ,\n\n` +
          `വിദ്യാർത്ഥി: *${studentName}*\n` +
          `ക്ലാസ്സ്: *${className}*\n` +
          `ടേം: *${termName}*\n\n` +
          `⚠️ നിങ്ങളുടെ കുട്ടിയുടെ സ്കൂൾ ഫീസ് അവസാന തീയതി കഴിഞ്ഞിരിക്കുന്നു.\n\n` +
          `• അടയ്ക്കേണ്ട തുക: *${amount}*\n` +
          `• അവസാന തീയതി: *${dueDate}*\n` +
          `• ഇൻവോയ്സ് നമ്പർ: ${invoiceNumber}\n\n` +
          `⚡ *1-ക്ലിക്ക് യു.പി.ഐ പേയ്‌മെന്റ് ലിങ്ക്:*\n` +
          `${upiLink}\n\n` +
          `താഴെയുള്ള ലിങ്കിൽ ക്ലിക്ക് ചെയ്ത് ഗൂഗിൾ പേ/ഫോൺപേ/Paytm വഴി സെക്കൻഡുകൾക്കുള്ളിൽ പണമടയ്ക്കാം.\n\n` +
          `നന്ദി`;
      } else {
        return `🏫 *സ്കൂൾ ഫീ പേയ്‌മെന്റ് റിമൈൻഡർ*\n\n` +
          `പ്രിയ രക്ഷിതാവേ,\n\n` +
          `വിദ്യാർത്ഥി: *${studentName}*\n` +
          `ക്ലാസ്സ്: *${className}*\n` +
          `ടേം: *${termName}*\n\n` +
          `• അടയ്ക്കേണ്ട തുക: *${amount}*\n` +
          `• അവസാന തീയതി: *${dueDate}*\n` +
          `• ഇൻവോയ്സ് നമ്പർ: ${invoiceNumber}\n\n` +
          `⚡ *1-ക്ലിക്ക് യു.പി.ഐ പേയ്‌മെന്റ് ലിങ്ക്:*\n` +
          `${upiLink}\n\n` +
          `ബാങ്കിലോ സ്കൂളിലോ വരിനിൽക്കാതെ മുകളിലെ ലിങ്കിൽ ക്ലിക്ക് ചെയ്ത് യു.പി.ഐ വഴി ഉടൻ പണമടയ്ക്കാം.\n\n` +
          `നന്ദി`;
      }
    } else if (language === 'sw') {
      // Swahili message
      if (isOverdue) {
        return `🏫 *Notisi ya Ada ya Shule*\n\n` +
          `Mzazi mpendwa,\n\n` +
          `Mwanafunzi: *${studentName}*\n` +
          `Darasa: *${className}*\n` +
          `Muhula: *${termName}*\n\n` +
          `⚠️ Malipo ya ada ya mtoto wako yamechelewa.\n\n` +
          `Kiasi Kilichobaki: *${amount}*\n` +
          `Tarehe ya Mwisho: *${dueDate}*\n` +
          `Nambari ya Ankara: ${invoiceNumber}\n\n` +
          `Tafadhali fanya malipo haraka iwezekanavyo ili kuepuka usumbufu wowote.\n\n` +
          `Asante`;
      } else {
        return `🏫 *Kikumbusho cha Ada ya Shule*\n\n` +
          `Mzazi mpendwa,\n\n` +
          `Mwanafunzi: *${studentName}*\n` +
          `Darasa: *${className}*\n` +
          `Muhula: *${termName}*\n\n` +
          `Kiasi Kilichobaki: *${amount}*\n` +
          `Tarehe ya Mwisho: *${dueDate}*\n` +
          `Nambari ya Ankara: ${invoiceNumber}\n\n` +
          `Tafadhali hakikisha malipo yanafanywa kabla ya tarehe ya mwisho.\n\n` +
          `Asante`;
      }
    } else {
      // English message
      if (isOverdue) {
        return `🏫 *School Fee Notice*\n\n` +
          `Dear Parent,\n\n` +
          `Student: *${studentName}*\n` +
          `Class: *${className}*\n` +
          `Term: *${termName}*\n\n` +
          `⚠️ Your child's fee payment is overdue.\n\n` +
          `Outstanding Amount: *${amount}*\n` +
          `Due Date: *${dueDate}*\n` +
          `Invoice Number: ${invoiceNumber}\n\n` +
          `Please make the payment as soon as possible to avoid any inconvenience.\n\n` +
          `Thank you`;
      } else {
        return `🏫 *School Fee Reminder*\n\n` +
          `Dear Parent,\n\n` +
          `Student: *${studentName}*\n` +
          `Class: *${className}*\n` +
          `Term: *${termName}*\n\n` +
          `Outstanding Amount: *${amount}*\n` +
          `Due Date: *${dueDate}*\n` +
          `Invoice Number: ${invoiceNumber}\n\n` +
          `Please ensure payment is made by the due date.\n\n` +
          `Thank you`;
      }
    }
  }

  /**
   * Build payment confirmation message
   */
  private buildPaymentConfirmationMessage(payment: any, language: 'en' | 'sw'): string {
    const studentName = `${payment.invoice.student.firstName} ${payment.invoice.student.lastName}`;
    const amount = this.formatAmount(payment.amount);
    const paymentDate = this.formatDate(payment.paymentDate);
    const receiptNumber = payment.receiptNumber;
    const balance = this.formatAmount(
      payment.invoice.totalAmount - payment.invoice.paidAmount - payment.amount,
    );

    if (language === 'sw') {
      return `✅ *Uthibitisho wa Malipo*\n\n` +
        `Mzazi mpendwa,\n\n` +
        `Mwanafunzi: *${studentName}*\n\n` +
        `Malipo yako yamepokelewa kwa mafanikio.\n\n` +
        `Kiasi Kilicholipwa: *${amount}*\n` +
        `Tarehe: ${paymentDate}\n` +
        `Nambari ya Risiti: ${receiptNumber}\n` +
        `Kiasi Kilichobaki: *${balance}*\n\n` +
        `Asante!`;
    } else {
      return `✅ *Payment Confirmation*\n\n` +
        `Dear Parent,\n\n` +
        `Student: *${studentName}*\n\n` +
        `Your payment has been successfully received.\n\n` +
        `Amount Paid: *${amount}*\n` +
        `Date: ${paymentDate}\n` +
        `Receipt Number: ${receiptNumber}\n` +
        `Balance: *${balance}*\n\n` +
        `Thank you!`;
    }
  }

  /**
   * Log fee reminder in database
   */
  private async logFeeReminder(
    invoiceId: string,
    recipientPhone: string,
    twilioSid: string,
  ): Promise<void> {
    try {
      await (this.prisma as any).communicationLog.create({
        data: {
          channel: 'WHATSAPP',
          recipient: recipientPhone,
          status: 'SENT',
          sentAt: new Date(),
          metadata: {
            invoiceId,
            twilioSid,
          },
        } as any,
      });
    } catch (error) {
      this.logger.error('Failed to log fee reminder', error);
    }
  }

  /**
   * Format amount with currency
   */
  private formatAmount(amount: number): string {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
