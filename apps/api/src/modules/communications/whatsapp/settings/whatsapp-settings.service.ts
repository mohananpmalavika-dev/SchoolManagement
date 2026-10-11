import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantService } from '../../../../database/tenant.service';

export interface WhatsAppSettings {
  id: string;
  enabled: boolean;
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
  defaultLanguage: 'en' | 'sw';
  autoSendFeeReminders: boolean;
  autoSendAttendanceAlerts: boolean;
  autoSendReportCards: boolean;
  feeReminderSchedule: string; // Cron expression
  attendanceAlertSchedule: string; // Cron expression
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'FEE_REMINDER' | 'ATTENDANCE_ALERT' | 'REPORT_CARD' | 'CUSTOM';
  language: 'en' | 'sw';
  content: string;
  variables: string[]; // Array of variable names like ['studentName', 'amount']
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class WhatsAppSettingsService {
  private readonly logger = new Logger(WhatsAppSettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Get WhatsApp settings for tenant
   */
  async getSettings(): Promise<WhatsAppSettings | null> {
    const tenantId = this.tenantService.requireTenantContext();

    const settings = await this.prisma.whatsAppSettings.findFirst({
      where: { tenantId },
    });

    return settings as WhatsAppSettings | null;
  }

  /**
   * Update WhatsApp settings
   */
  async updateSettings(data: Partial<WhatsAppSettings>): Promise<WhatsAppSettings> {
    const tenantId = this.tenantService.requireTenantContext();

    const existingSettings = await this.prisma.whatsAppSettings.findFirst({
      where: { tenantId },
    });

    let settings;

    if (existingSettings) {
      settings = await this.prisma.whatsAppSettings.update({
        where: { id: existingSettings.id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } else {
      settings = await this.prisma.whatsAppSettings.create({
        data: {
          tenantId,
          ...data,
        },
      });
    }

    this.logger.log(`WhatsApp settings updated for tenant ${tenantId}`);
    return settings as WhatsAppSettings;
  }

  /**
   * Get all message templates
   */
  async getTemplates(type?: string, language?: 'en' | 'sw'): Promise<MessageTemplate[]> {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId };

    if (type) {
      where.type = type;
    }

    if (language) {
      where.language = language;
    }

    const templates = await this.prisma.messageTemplate.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return templates as MessageTemplate[];
  }

  /**
   * Get a single template by ID
   */
  async getTemplate(id: string): Promise<MessageTemplate> {
    const tenantId = this.tenantService.requireTenantContext();

    const template = await this.prisma.messageTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template as MessageTemplate;
  }

  /**
   * Create a new message template
   */
  async createTemplate(data: {
    name: string;
    type: 'FEE_REMINDER' | 'ATTENDANCE_ALERT' | 'REPORT_CARD' | 'CUSTOM';
    language: 'en' | 'sw';
    content: string;
    variables?: string[];
  }): Promise<MessageTemplate> {
    const tenantId = this.tenantService.requireTenantContext();

    // Extract variables from content (e.g., {studentName}, {amount})
    const extractedVariables =
      data.variables || this.extractVariables(data.content);

    const template = await this.prisma.messageTemplate.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type,
        language: data.language,
        content: data.content,
        variables: extractedVariables,
        isActive: true,
      },
    });

    this.logger.log(`Created message template: ${template.id}`);
    return template as MessageTemplate;
  }

  /**
   * Update a message template
   */
  async updateTemplate(
    id: string,
    data: Partial<MessageTemplate>,
  ): Promise<MessageTemplate> {
    const tenantId = this.tenantService.requireTenantContext();

    const existingTemplate = await this.prisma.messageTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!existingTemplate) {
      throw new NotFoundException('Template not found');
    }

    // Re-extract variables if content is being updated
    if (data.content) {
      data.variables = this.extractVariables(data.content);
    }

    const template = await this.prisma.messageTemplate.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Updated message template: ${id}`);
    return template as MessageTemplate;
  }

  /**
   * Delete a message template
   */
  async deleteTemplate(id: string): Promise<void> {
    const tenantId = this.tenantService.requireTenantContext();

    const template = await this.prisma.messageTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await this.prisma.messageTemplate.delete({
      where: { id },
    });

    this.logger.log(`Deleted message template: ${id}`);
  }

  /**
   * Toggle template active status
   */
  async toggleTemplate(id: string): Promise<MessageTemplate> {
    const tenantId = this.tenantService.requireTenantContext();

    const template = await this.prisma.messageTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const updated = await this.prisma.messageTemplate.update({
      where: { id },
      data: {
        isActive: !template.isActive,
      },
    });

    return updated as MessageTemplate;
  }

  /**
   * Get communication logs/history
   */
  async getCommunicationLogs(filters?: {
    type?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.sentAt = {};
      if (filters.startDate) {
        where.sentAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.sentAt.lte = filters.endDate;
      }
    }

    const logs = await this.prisma.communicationLog.findMany({
      where,
      orderBy: {
        sentAt: 'desc',
      },
      take: filters?.limit || 100,
    });

    return logs;
  }

  /**
   * Get communication statistics
   */
  async getStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    const tenantId = this.tenantService.requireTenantContext();

    const where: any = { tenantId, type: 'WHATSAPP' };

    if (startDate || endDate) {
      where.sentAt = {};
      if (startDate) {
        where.sentAt.gte = startDate;
      }
      if (endDate) {
        where.sentAt.lte = endDate;
      }
    }

    const [total, sent, failed, bySubject] = await Promise.all([
      this.prisma.communicationLog.count({ where }),
      this.prisma.communicationLog.count({
        where: { ...where, status: 'SENT' },
      }),
      this.prisma.communicationLog.count({
        where: { ...where, status: 'FAILED' },
      }),
      this.prisma.communicationLog.groupBy({
        by: ['subject'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      sent,
      failed,
      successRate: total > 0 ? ((sent / total) * 100).toFixed(2) : 0,
      byType: bySubject.map((item) => ({
        type: item.subject,
        count: item._count,
      })),
    };
  }

  /**
   * Create default templates for a new tenant
   */
  async createDefaultTemplates(): Promise<void> {
    const tenantId = this.tenantService.requireTenantContext();

    const defaultTemplates = [
      // Fee Reminder - English
      {
        name: 'Fee Reminder - English',
        type: 'FEE_REMINDER' as const,
        language: 'en' as const,
        content:
          '🏫 *School Fee Reminder*\n\nDear Parent,\n\nStudent: *{studentName}*\nClass: *{className}*\nTerm: *{termName}*\n\nOutstanding Amount: *{amount}*\nDue Date: *{dueDate}*\nInvoice Number: {invoiceNumber}\n\nPlease ensure payment is made by the due date.\n\nThank you',
      },
      // Fee Reminder - Swahili
      {
        name: 'Fee Reminder - Swahili',
        type: 'FEE_REMINDER' as const,
        language: 'sw' as const,
        content:
          '🏫 *Kikumbusho cha Ada ya Shule*\n\nMzazi mpendwa,\n\nMwanafunzi: *{studentName}*\nDarasa: *{className}*\nMuhula: *{termName}*\n\nKiasi Kilichobaki: *{amount}*\nTarehe ya Mwisho: *{dueDate}*\nNambari ya Ankara: {invoiceNumber}\n\nTafadhali hakikisha malipo yanafanywa kabla ya tarehe ya mwisho.\n\nAsante',
      },
      // Attendance Alert - English
      {
        name: 'Absence Alert - English',
        type: 'ATTENDANCE_ALERT' as const,
        language: 'en' as const,
        content:
          '🏫 *Attendance Alert*\n\nDear Parent,\n\nStudent: *{studentName}*\nClass: *{className}*\nDate: *{date}*\n\n⚠️ Your child was marked absent from school today.\n\nIf this is unexpected, please contact the school.\n\nThank you',
      },
      // Attendance Alert - Swahili
      {
        name: 'Absence Alert - Swahili',
        type: 'ATTENDANCE_ALERT' as const,
        language: 'sw' as const,
        content:
          '🏫 *Arifa ya Mahudhurio*\n\nMzazi mpendwa,\n\nMwanafunzi: *{studentName}*\nDarasa: *{className}*\nTarehe: *{date}*\n\n⚠️ Mtoto wako hakuhudhuria shuleni leo.\n\nIkiwa hii ni jambo la ajabu, tafadhali wasiliana na shule.\n\nAsante',
      },
      // Report Card - English
      {
        name: 'Report Card Ready - English',
        type: 'REPORT_CARD' as const,
        language: 'en' as const,
        content:
          '📊 *Report Card Ready*\n\nDear Parent,\n\nStudent: *{studentName}*\nClass: *{className}*\nTerm: *{termName}*\n\n📈 Performance Summary:\nTotal Marks: {obtainedMarks}/{totalMarks}\nPercentage: {percentage}%\nGrade: *{grade}*\nPosition: *{position}*\n\nPlease find the detailed report card attached.\n\nCongratulations! 🎉',
      },
      // Report Card - Swahili
      {
        name: 'Report Card Ready - Swahili',
        type: 'REPORT_CARD' as const,
        language: 'sw' as const,
        content:
          '📊 *Kadi ya Ripoti Iko Tayari*\n\nMzazi mpendwa,\n\nMwanafunzi: *{studentName}*\nDarasa: *{className}*\nMuhula: *{termName}*\n\n📈 Muhtasari wa Utendaji:\nJumla ya Alama: {obtainedMarks}/{totalMarks}\nAsilimia: {percentage}%\nDaraja: *{grade}*\nNafasi: *{position}*\n\nTafadhali angalia kadi ya ripoti kamili iliyoambatishwa.\n\nHongera! 🎉',
      },
    ];

    for (const template of defaultTemplates) {
      await this.prisma.messageTemplate.create({
        data: {
          tenantId,
          ...template,
          variables: this.extractVariables(template.content),
          isActive: true,
        },
      });
    }

    this.logger.log(`Created ${defaultTemplates.length} default templates`);
  }

  /**
   * Extract variable names from template content
   */
  private extractVariables(content: string): string[] {
    const regex = /\{([a-zA-Z0-9_]+)\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }
}

