import * as nodemailer from 'nodemailer';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import {
  SendMessageDto,
  SendBulkMessageDto,
  SendAbsentAlertDto,
  SendFeeReminderDto,
  MessageChannel,
  MessageType,
  MessagePriority,
} from './dto/send-message.dto';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
} from './dto/message-template.dto';
import axios from 'axios';
import { formatCurrency } from '@krypton/utils';

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);
  private readonly smsApiKey: string;
  private readonly smsUsername: string;
  private readonly smtpHost: string;
  private readonly smtpPort: number;
  private readonly smtpUser: string;
  private readonly smtpPassword: string;

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private configService: ConfigService,
  ) {
    // SMS Configuration (Africa's Talking)
    this.smsApiKey = this.configService.get('SMS_API_KEY', '');
    this.smsUsername = this.configService.get('SMS_USERNAME', '');

    // Email Configuration
    this.smtpHost = this.configService.get('SMTP_HOST', '');
    this.smtpPort = this.configService.get<number>('SMTP_PORT', 1025);
    this.smtpUser = this.configService.get('SMTP_USER', '');
    this.smtpPassword = this.configService.get('SMTP_PASSWORD', this.configService.get('SMTP_PASS', ''));
  }

  // ==================== MESSAGING ====================

  async sendMessage(dto: SendMessageDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    if(dto.scheduledAt) throw new BadRequestException('Scheduled delivery requires a configured job queue');
    if(dto.channel===MessageChannel.PUSH) throw new BadRequestException('Push delivery is not configured');
    if(!dto.recipients.length||dto.recipients.length>500) throw new BadRequestException('Select between 1 and 500 recipients');
    // Create communication record
    const communication = await this.prisma.communication.create({
      data: {
        tenantId,
        channel: dto.channel,
        messageType: dto.messageType || MessageType.GENERAL,
        subject: dto.subject,
        body: dto.message,
        recipientCount: dto.recipients.length,
        priority: dto.priority || 'NORMAL',
        status: 'PENDING',
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        sentBy: userId,
      },
    });

    // Send immediately or schedule
    if (!dto.scheduledAt) {
      await this.processMessage(communication.id, dto.recipients);
    }

    return this.prisma.communication.findUnique({where:{id:communication.id}});
  }

  async sendBulkMessage(dto: SendBulkMessageDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Get students in class/stream
    const students = await this.prisma.student.findMany({
      where: {
        tenantId,
        currentClassId: dto.classId,
        ...(dto.streamId && { currentStreamId: dto.streamId }),
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        guardianLinks: {
          include: {
            guardian: true,
          },
        },
      },
    });

    if (students.length === 0) {
      throw new BadRequestException('No students found in this class/stream');
    }

    // Collect recipients
    const recipients: string[] = [];

    if (dto.includeParents !== false) {
      students.forEach((student) => {
        student.guardianLinks.forEach((link) => {
          if (dto.channel === MessageChannel.SMS && link.guardian.phone) {
            recipients.push(link.guardian.phone);
          } else if (dto.channel === MessageChannel.EMAIL && link.guardian.email) {
            recipients.push(link.guardian.email);
          }
        });
      });
    }

    if (dto.includeStudents) {
      students.forEach((student) => {
        if (dto.channel === MessageChannel.SMS && student.phone) {
          recipients.push(student.phone);
        } else if (dto.channel === MessageChannel.EMAIL && student.email) {
          recipients.push(student.email);
        }
      });
    }

    // Remove duplicates
    const uniqueRecipients = [...new Set(recipients)];

    if (uniqueRecipients.length === 0) {
      throw new BadRequestException('No valid recipients found');
    }

    return this.sendMessage(
      {
        channel: dto.channel,
        recipients: uniqueRecipients,
        subject: dto.subject,
        message: dto.message,
        messageType: dto.messageType,
      },
      userId,
    );
  }

  async sendAbsentAlerts(dto: SendAbsentAlertDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    const attendanceDate = new Date(dto.date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Get absent students
    const absentRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        date: attendanceDate,
        status: {
          in: ['ABSENT'],
        },
        ...(dto.classId && { classId: dto.classId }),
      },
      include: {
        student: {
          include: {
            guardianLinks: {
              include: {
                guardian: true,
              },
              where: {
                isPrimary: true,
              },
            },
            currentClass: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (absentRecords.length === 0) {
      return {
        success: true,
        message: 'No absent students found',
        sent: 0,
      };
    }

    const channels = dto.channels || [MessageChannel.SMS];
    let totalSent = 0;

    for (const record of absentRecords) {
      const student = record.student;
      const primaryGuardian = student.guardianLinks[0]?.guardian;

      if (!primaryGuardian) continue;

      for (const channel of channels) {
        try {
          const message = this.renderTemplate('ABSENCE_ALERT', {
            parentName: primaryGuardian.firstName,
            studentName: `${student.firstName} ${student.lastName}`,
            date: dto.date,
            class: student.currentClass?.name || 'N/A',
            reason: record.remarks || 'No reason provided',
          });

          const recipient =
            channel === MessageChannel.SMS
              ? primaryGuardian.phone
              : primaryGuardian.email;

          if (recipient) {
            await this.sendMessage(
              {
                channel,
                recipients: [recipient],
                subject: 'Student Absence Alert',
                message,
                messageType: MessageType.ATTENDANCE_ALERT,
                priority: MessagePriority.HIGH,
              },
              userId,
            );
            totalSent++;
          }
        } catch (error: any) {
          this.logger.error(
            `Failed to send absence alert for student ${student.id}`,
            error,
          );
        }
      }
    }

    return {
      success: true,
      absentStudents: absentRecords.length,
      sent: totalSent,
    };
  }

  async sendFeeReminders(dto: SendFeeReminderDto, userId?: string) {
    const tenantId = this.tenantService.requireTenantContext();

    // Get invoices with outstanding balance
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: {
          in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'],
        },
        balanceAmount: {
          gte: dto.minimumAmount || 100, // Minimum 1 KES
        },
        ...(dto.classId && {
          student: {
            currentClassId: dto.classId,
          },
        }),
      },
      include: {
        student: {
          include: {
            guardianLinks: {
              include: {
                guardian: true,
              },
              where: {
                isPrimary: true,
              },
            },
            currentClass: {
              select: { name: true },
            },
          },
        },
        term: {
          select: { name: true },
        },
      },
    });

    if (invoices.length === 0) {
      return {
        success: true,
        message: 'No outstanding invoices found',
        sent: 0,
      };
    }

    const channels = dto.channels || [MessageChannel.SMS];
    let totalSent = 0;

    for (const invoice of invoices) {
      const student = invoice.student;
      const primaryGuardian = student.guardianLinks[0]?.guardian;

      if (!primaryGuardian) continue;

      for (const channel of channels) {
        try {
          const message = this.renderTemplate('FEE_REMINDER', {
            parentName: primaryGuardian.firstName,
            studentName: `${student.firstName} ${student.lastName}`,
            class: student.currentClass?.name || 'N/A',
            term: invoice.term.name,
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: formatCurrency(invoice.totalAmount),
            paidAmount: formatCurrency(invoice.paidAmount),
            balanceAmount: formatCurrency(invoice.balanceAmount),
            dueDate: invoice.dueDate
              ? new Date(invoice.dueDate).toLocaleDateString()
              : 'Not specified',
          });

          const recipient =
            channel === MessageChannel.SMS
              ? primaryGuardian.phone
              : primaryGuardian.email;

          if (recipient) {
            await this.sendMessage(
              {
                channel,
                recipients: [recipient],
                subject: 'School Fee Reminder',
                message,
                messageType: MessageType.FEE_REMINDER,
                priority: MessagePriority.NORMAL,
              },
              userId,
            );
            totalSent++;
          }
        } catch (error: any) {
          this.logger.error(
            `Failed to send fee reminder for invoice ${invoice.id}`,
            error,
          );
        }
      }
    }

    return {
      success: true,
      invoices: invoices.length,
      sent: totalSent,
    };
  }

  // ==================== MESSAGE PROCESSING ====================

  private async processMessage(communicationId: string, recipients: string[]) {
    const communication = await this.prisma.communication.findUnique({
      where: { id: communicationId },
    });

    if (!communication) {
      throw new NotFoundException('Communication not found');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Send messages based on channel
    switch (communication.channel) {
      case MessageChannel.SMS:
        await this.sendSMS(communication, recipients, results);
        break;
      case MessageChannel.EMAIL:
        await this.sendEmail(communication, recipients, results);
        break;
      case MessageChannel.IN_APP:
        await this.sendInApp(communication, recipients, results);
        break;
    }

    // Update communication status
    await this.prisma.communication.update({
      where: { id: communicationId },
      data: {
        status: results.success === 0 ? 'FAILED' : results.failed > 0 ? 'PARTIALLY_SENT' : 'SENT',
        sentAt: new Date(),
        deliveredCount: results.success,
        failedCount: results.failed,
      },
    });

    return results;
  }

  private async sendSMS(
    communication: any,
    recipients: string[],
    results: any,
  ) {
    if (!this.smsApiKey || !this.smsUsername) {
      this.logger.warn('SMS credentials not configured');
      results.failed = recipients.length;
      return;
    }

    try {
      // Africa's Talking SMS API
      const response = await axios.post(
        'https://api.africastalking.com/version1/messaging',
        {
          username: this.smsUsername,
          to: recipients.join(','),
          message: communication.body,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            apiKey: this.smsApiKey,
          },
        },
      );

      const reports = response.data?.SMSMessageData?.Recipients || [];
      for (const recipient of recipients) {
        const report = reports.find((item:any) => item.number === recipient);
        const accepted = report?.status === 'Success';
        await this.prisma.communicationLog.create({
          data: {
            communicationId: communication.id,
            recipient,
            channel: MessageChannel.SMS,
            status: accepted ? 'SENT' : 'FAILED',
            sentAt: new Date(),
          },
        });
        if(accepted) results.success++; else results.failed++;
      }

      this.logger.log(`SMS sent to ${recipients.length} recipients`);
    } catch (error: any) {
      this.logger.error('Failed to send SMS', error);
      results.failed = recipients.length;
      results.errors.push({ error: error.message });
    }
  }

  private async sendEmail(communication:any,recipients:string[],results:any){
    if(!this.smtpHost){results.failed=recipients.length;return;}
    const transport=nodemailer.createTransport({host:this.smtpHost,port:Number(this.smtpPort),secure:this.configService.get('SMTP_SECURE')==='true',auth:this.smtpUser?{user:this.smtpUser,pass:this.smtpPassword}:undefined,connectionTimeout:10000,socketTimeout:20000,disableFileAccess:true,disableUrlAccess:true});
    for(const recipient of recipients){
      try{
        const response=await transport.sendMail({from:this.configService.get('EMAIL_FROM'),to:recipient,subject:communication.subject||'School update',text:communication.body});
        if(!response.accepted?.length)throw new Error('SMTP server rejected recipient');
        await this.prisma.communicationLog.create({data:{communicationId:communication.id,recipient,channel:'EMAIL',status:'SENT',sentAt:new Date()}});results.success++;
      }catch(error:any){
        await this.prisma.communicationLog.create({data:{communicationId:communication.id,recipient,channel:'EMAIL',status:'FAILED',errorMessage:'Email delivery failed'}});results.failed++;results.errors.push({recipient,error:'Email delivery failed'});
      }
    }
    transport.close();
  }

  private async sendInApp(
    communication: any,
    recipients: string[],
    results: any,
  ) {
    // In-app notifications stored in database
    for (const recipient of recipients) {
      try {
        await this.prisma.communicationLog.create({
          data: {
            communicationId: communication.id,
            recipient,
            channel: MessageChannel.IN_APP,
            status: 'SENT',
            sentAt: new Date(),
          },
        });
        results.success++;
      } catch (error: any) {
        results.failed++;
      }
    }
  }

  // ==================== TEMPLATES ====================

  private renderTemplate(templateName: string, variables: Record<string, any>): string {
    const templates: Record<string, string> = {
      ABSENCE_ALERT: `Dear {{parentName}}, your child {{studentName}} ({{class}}) was absent on {{date}}. Reason: {{reason}}. Please contact the school if you have any questions.`,
      FEE_REMINDER: `Dear {{parentName}}, this is a reminder that {{studentName}} ({{class}}) has an outstanding balance of {{balanceAmount}} for {{term}}. Invoice: {{invoiceNumber}}. Due: {{dueDate}}. Please make payment at your earliest convenience.`,
      PAYMENT_RECEIPT: `Dear {{parentName}}, we confirm receipt of {{paidAmount}} for {{studentName}} ({{class}}). Invoice: {{invoiceNumber}}. New balance: {{balanceAmount}}. Receipt: {{receiptNumber}}. Thank you.`,
    };

    let message = templates[templateName] || '';

    // Replace variables
    Object.keys(variables).forEach((key) => {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
    });

    return message;
  }

  async createTemplate(dto: CreateTemplateDto) {
    const tenantId = this.tenantService.requireTenantContext();

    const template = await this.prisma.messageTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        messageType: dto.messageType,
        subject: dto.subject,
        body: dto.body,
        channels: dto.channels,
        variables: dto.variables || {},
        isActive: dto.isActive !== false,
      },
    });

    return template;
  }

  async findAllTemplates() {
    const tenantId = this.tenantService.requireTenantContext();

    const templates = await this.prisma.messageTemplate.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return templates;
  }

  async getCommunicationStats() {
    const tenantId = this.tenantService.requireTenantContext();

    const [total, sent, failed, pending] = await Promise.all([
      this.prisma.communication.count({ where: { tenantId } }),
      this.prisma.communication.count({
        where: { tenantId, status: 'SENT' },
      }),
      this.prisma.communication.count({
        where: { tenantId, status: 'FAILED' },
      }),
      this.prisma.communication.count({
        where: { tenantId, status: 'PENDING' },
      }),
    ]);

    return {
      total,
      sent,
      failed,
      pending,
    };
  }
}
