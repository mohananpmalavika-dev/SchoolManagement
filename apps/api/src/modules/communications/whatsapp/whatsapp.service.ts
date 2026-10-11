import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';

export interface WhatsAppMessage {
  to: string; // Phone number in E.164 format (e.g., +254712345678)
  body: string;
  mediaUrl?: string; // Optional media URL for images/documents
}

export interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  templateParams?: Record<string, string>;
  language?: 'en' | 'sw'; // English or Swahili
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private twilioClient: twilio.Twilio;
  private whatsappNumber: string;
  private isConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    this.initializeTwilio();
  }

  private initializeTwilio(): void {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.whatsappNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886'); // Default Twilio sandbox

    if (!accountSid || !authToken) {
      this.logger.warn(
        'Twilio credentials not configured. WhatsApp service will be disabled. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.',
      );
      this.isConfigured = false;
      return;
    }

    try {
      this.twilioClient = (twilio as any)(accountSid, authToken);
      this.isConfigured = true;
      this.logger.log('WhatsApp service initialized successfully');
    } catch (error: any) {
      this.logger.error('Failed to initialize Twilio client', error?.message || String(error));
      this.isConfigured = false;
    }
  }

  /**
   * Check if WhatsApp service is properly configured
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Send a simple text message via WhatsApp
   */
  async sendMessage(message: WhatsAppMessage): Promise<MessageInstance | null> {
    if (!this.isConfigured) {
      this.logger.warn('WhatsApp service not configured, message not sent');
      return null;
    }

    try {
      const formattedTo = message.to.startsWith('whatsapp:')
        ? message.to
        : `whatsapp:${message.to}`;

      const twilioMessage = await this.twilioClient.messages.create({
        from: this.whatsappNumber,
        to: formattedTo,
        body: message.body,
        ...(message.mediaUrl && { mediaUrl: [message.mediaUrl] }),
      });

      this.logger.log(
        `WhatsApp message sent successfully to ${message.to}. SID: ${twilioMessage.sid}`,
      );

      return twilioMessage;
    } catch (error: any) {
      this.logger.error(
        `Failed to send WhatsApp message to ${message.to}`,
        error?.message || String(error),
      );
      throw error;
    }
  }

  /**
   * Send a message using a predefined template
   */
  async sendTemplateMessage(
    template: WhatsAppTemplateMessage,
  ): Promise<MessageInstance | null> {
    if (!this.isConfigured) {
      this.logger.warn('WhatsApp service not configured, template message not sent');
      return null;
    }

    try {
      const body = this.buildTemplateMessage(
        template.templateName,
        template.templateParams || {},
        template.language || 'en',
      );

      return await this.sendMessage({
        to: template.to,
        body,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to send template message to ${template.to}`,
        error?.message || String(error),
      );
      throw error;
    }
  }

  /**
   * Send bulk messages (with rate limiting consideration)
   */
  async sendBulkMessages(
    messages: WhatsAppMessage[],
  ): Promise<Array<MessageInstance | null>> {
    if (!this.isConfigured) {
      this.logger.warn('WhatsApp service not configured, bulk messages not sent');
      return [];
    }

    const results: Array<MessageInstance | null> = [];

    // Twilio has rate limits, so we'll process messages with a slight delay
    for (const message of messages) {
      try {
        const result = await this.sendMessage(message);
        results.push(result);

        // Add small delay between messages to respect rate limits (100ms)
        await this.delay(100);
      } catch (error) {
        this.logger.error(`Failed to send bulk message to ${message.to}`, error);
        results.push(null);
      }
    }

    this.logger.log(`Bulk WhatsApp send completed: ${results.filter(r => r !== null).length}/${messages.length} successful`);
    return results;
  }

  /**
   * Send a message with a PDF attachment
   */
  async sendDocument(
    to: string,
    message: string,
    documentUrl: string,
  ): Promise<MessageInstance | null> {
    return this.sendMessage({
      to,
      body: message,
      mediaUrl: documentUrl,
    });
  }

  /**
   * Build a message from a template with parameters
   */
  private buildTemplateMessage(
    templateName: string,
    params: Record<string, string>,
    language: 'en' | 'sw',
  ): string {
    // This will be replaced with actual template system
    // For now, we'll use a simple string replacement
    const templates = this.getTemplates(language);
    let template = templates[templateName];

    if (!template) {
      this.logger.warn(`Template ${templateName} not found, using default`);
      template = 'Message from school: {message}';
    }

    // Replace all {paramName} with actual values
    Object.keys(params).forEach((key) => {
      template = template.replace(new RegExp(`\\{${key}\\}`, 'g'), params[key]);
    });

    return template;
  }

  /**
   * Get message templates (will be moved to database later)
   */
  private getTemplates(language: 'en' | 'sw'): Record<string, string> {
    // Placeholder - these will be stored in database
    const templates = {
      en: {
        welcome: 'Welcome to {schoolName}! We are excited to have {studentName} join us.',
        generic: '{message}',
      },
      sw: {
        welcome: 'Karibu {schoolName}! Tunafurahi kuwa na {studentName} akiungana nasi.',
        generic: '{message}',
      },
    };

    return templates[language] || templates.en;
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate phone number format (E.164)
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // E.164 format: +[country code][number]
    // Example: +254712345678 (Kenya), +919876543210 (India)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164 if possible
   */
  formatPhoneNumber(phoneNumber: string, defaultCountryCode: string = '254'): string {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');

    // If already starts with +, assume it's in E.164 format
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // If starts with 0, remove it and add country code
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    // Add + and country code if not present
    return `+${defaultCountryCode}${cleaned}`;
  }
}
