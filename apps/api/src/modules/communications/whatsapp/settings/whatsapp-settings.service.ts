import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantService } from '../../../../database/tenant.service';

export interface WhatsAppSettings {
  id: string;
  enabled: boolean;
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
  defaultLanguage: 'en' | 'hi' | 'ml';
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
  language: 'en' | 'hi' | 'ml';
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
  ) { }

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
  async getTemplates(type?: string, language?: 'en' | 'hi' | 'ml'): Promise<MessageTemplate[]> {
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
    language: 'en' | 'hi' | 'ml';
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
      // Fee Reminder - Hindi
      {
        name: 'Fee Reminder - Hindi',
        type: 'FEE_REMINDER' as const,
        language: 'hi' as const,
        content:
          '🏫 *विद्यालय शुल्क अनुस्मारक*\n\nप्रिय अभिभावक,\n\nविद्यार्थी: *{studentName}*\nकक्षा: *{className}*\nसत्र: *{termName}*\n\nबकाया राशि: *{amount}*\nअंतिम तिथि: *{dueDate}*\nचालान संख्या: {invoiceNumber}\n\nकृपया अंतिम तिथि से पहले शुल्क भुगतान सुनिश्चित करें।\n\nधन्यवाद',
      },
      // Fee Reminder - Malayalam
      {
        name: 'Fee Reminder - Malayalam',
        type: 'FEE_REMINDER' as const,
        language: 'ml' as const,
        content:
          '🏫 *സ്കൂൾ ഫീ പേയ്‌മെന്റ് റിമൈൻഡർ*\n\nപ്രിയ രക്ഷിതാവേ,\n\nവിദ്യാർത്ഥി: *{studentName}*\nക്ലാസ്സ്: *{className}*\nടേം: *{termName}*\n\nഅടയ്ക്കേണ്ട തുക: *{amount}*\nഅവസാന തീയതി: *{dueDate}*\nഇൻവോയ്സ് നമ്പർ: {invoiceNumber}\n\nഅവസാന തീയതിക്ക് മുമ്പ് ഫീസ് അടയ്ക്കുവാൻ ശ്രദ്ധിക്കുക.\n\nനന്ദി',
      },
      // Attendance Alert - English
      {
        name: 'Absence Alert - English',
        type: 'ATTENDANCE_ALERT' as const,
        language: 'en' as const,
        content:
          '🏫 *Attendance Alert*\n\nDear Parent,\n\nStudent: *{studentName}*\nClass: *{className}*\nDate: *{date}*\n\n⚠️ Your child was marked absent from school today.\n\nIf this is unexpected, please contact the school.\n\nThank you',
      },
      // Attendance Alert - Hindi
      {
        name: 'Absence Alert - Hindi',
        type: 'ATTENDANCE_ALERT' as const,
        language: 'hi' as const,
        content:
          '🏫 *उपस्थिति सूचना*\n\nप्रिय अभिभावक,\n\nविद्यार्थी: *{studentName}*\nकक्षा: *{className}*\nदिनांक: *{date}*\n\n⚠️ आज आपका बच्चा विद्यालय में अनुपस्थित रहा है।\n\nयदि यह अप्रत्याशित है, तो कृपया विद्यालय से संपर्क करें।\n\nधन्यवाद',
      },
      // Attendance Alert - Malayalam
      {
        name: 'Absence Alert - Malayalam',
        type: 'ATTENDANCE_ALERT' as const,
        language: 'ml' as const,
        content:
          '🏫 *ഹാജർ അറിയിപ്പ്*\n\nപ്രിയ രക്ഷിതാവേ,\n\nവിദ്യാർത്ഥി: *{studentName}*\nക്ലാസ്സ്: *{className}*\nതീയതി: *{date}*\n\n⚠️ നിങ്ങളുടെ കുട്ടി ഇന്ന് സ്കൂളിൽ ഹാജരായിട്ടില്ല.\n\nഇത് മുൻകൂട്ടി അറിയിക്കാത്തതാണെങ്കിൽ ദയവായി സ്കൂളുമായി ബന്ധപ്പെടുക.\n\nനന്ദി',
      },
      // Report Card - English
      {
        name: 'Report Card Ready - English',
        type: 'REPORT_CARD' as const,
        language: 'en' as const,
        content:
          '📊 *Report Card Ready*\n\nDear Parent,\n\nStudent: *{studentName}*\nClass: *{className}*\nTerm: *{termName}*\n\n📈 Performance Summary:\nTotal Marks: {obtainedMarks}/{totalMarks}\nPercentage: {percentage}%\nGrade: *{grade}*\nPosition: *{position}*\n\nPlease find the detailed report card attached.\n\nCongratulations! 🎉',
      },
      // Report Card - Hindi
      {
        name: 'Report Card Ready - Hindi',
        type: 'REPORT_CARD' as const,
        language: 'hi' as const,
        content:
          '📊 *प्रगति पत्र तैयार है*\n\nप्रिय अभिभावक,\n\nविद्यार्थी: *{studentName}*\nकक्षा: *{className}*\nसत्र: *{termName}*\n\n📈 प्रदर्शन सारांश:\nकुल अंक: {obtainedMarks}/{totalMarks}\nप्रतिशत: {percentage}%\nग्रेड: *{grade}*\nस्थान: *{position}*\n\nविस्तृत प्रगति पत्र संलग्न है।\n\nहार्दिक बधाई! 🎉',
      },
      // Report Card - Malayalam
      {
        name: 'Report Card Ready - Malayalam',
        type: 'REPORT_CARD' as const,
        language: 'ml' as const,
        content:
          '📊 *പ്രോഗ്രസ് റിപ്പോർട്ട് തയ്യാറാണ്*\n\nപ്രിയ രക്ഷിതാവേ,\n\nവിദ്യാർത്ഥി: *{studentName}*\nക്ലാസ്സ്: *{className}*\nടേം: *{termName}*\n\n📈 പഠന നിലവാരം:\nആകെ മാർക്ക്: {obtainedMarks}/{totalMarks}\nശതമാനം: {percentage}%\nഗ്രേഡ്: *{grade}*\nസ്ഥാനം: *{position}*\n\nവിശദമായ റിപ്പോർട്ട് കാർഡ് ഇതോടൊപ്പം ചേർക്കുന്നു.\n\nഅഭിനന്ദനങ്ങൾ! 🎉',
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

