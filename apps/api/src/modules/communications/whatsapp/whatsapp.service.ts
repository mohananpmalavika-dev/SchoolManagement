import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import {
  WhatsAppGatewayProvider,
  WhatsAppWebLink,
} from '@krypton/types';

export interface WhatsAppMessage {
  to: string; // Phone number in E.164 format (e.g., +919876543210)
  body: string;
  mediaUrl?: string; // Optional media URL for images/documents
  mediaFilename?: string;
  providerOverride?: WhatsAppGatewayProvider;
}

export interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  templateParams?: Record<string, string>;
  language?: 'en' | 'hi' | 'ml'; // English, Hindi, or Malayalam
  providerOverride?: WhatsAppGatewayProvider;
}

export interface WhatsAppSendResult {
  sid: string;
  status: string;
  provider: WhatsAppGatewayProvider;
  waLink?: WhatsAppWebLink;
  raw?: any;
}

export interface ProviderCredentialsOverride {
  provider: WhatsAppGatewayProvider;
  metaAccessToken?: string;
  metaPhoneNumberId?: string;
  metaWabaId?: string;
  metaApiVersion?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsappNumber?: string;
  gupshupApiKey?: string;
  gupshupAppName?: string;
  gupshupSourceNumber?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  // Active provider selected via WHATSAPP_PROVIDER or auto-detected
  private activeProvider: WhatsAppGatewayProvider = 'WHATSAPP_WEB';

  // Meta Cloud API credentials
  private metaAccessToken: string = '';
  private metaPhoneNumberId: string = '';
  private metaWabaId: string = '';
  private metaApiVersion: string = 'v19.0';
  private metaVerifyToken: string = '';
  private metaConfigured: boolean = false;

  // Twilio credentials
  private twilioClient: twilio.Twilio | null = null;
  private twilioWhatsappNumber: string = '';
  private twilioConfigured: boolean = false;

  // Gupshup credentials
  private gupshupApiKey: string = '';
  private gupshupAppName: string = '';
  private gupshupSourceNumber: string = '';
  private gupshupConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // 1. Initialize Meta WhatsApp Cloud API
    this.metaAccessToken =
      this.configService.get<string>('META_WHATSAPP_ACCESS_TOKEN') ||
      this.configService.get<string>('META_WHATSAPP_TOKEN') ||
      '';
    this.metaPhoneNumberId =
      this.configService.get<string>('META_WHATSAPP_PHONE_NUMBER_ID') || '';
    this.metaWabaId =
      this.configService.get<string>('META_WHATSAPP_WABA_ID') || '';
    this.metaApiVersion =
      this.configService.get<string>('META_WHATSAPP_API_VERSION') || 'v19.0';
    this.metaVerifyToken =
      this.configService.get<string>('META_WHATSAPP_VERIFY_TOKEN') ||
      'krypton_whatsapp_verify_token';

    if (this.metaAccessToken && this.metaPhoneNumberId) {
      this.metaConfigured = true;
      this.logger.log(
        `Meta WhatsApp Cloud API configured (Phone ID: ${this.metaPhoneNumberId})`,
      );
    }

    // 2. Initialize Gupshup Enterprise API
    this.gupshupApiKey =
      this.configService.get<string>('GUPSHUP_API_KEY') || '';
    this.gupshupAppName =
      this.configService.get<string>('GUPSHUP_APP_NAME') || '';
    this.gupshupSourceNumber =
      this.configService.get<string>('GUPSHUP_SOURCE_NUMBER') || '';

    if (
      this.gupshupApiKey &&
      this.gupshupAppName &&
      this.gupshupSourceNumber
    ) {
      this.gupshupConfigured = true;
      this.logger.log(
        `Gupshup WhatsApp Gateway configured (App: ${this.gupshupAppName})`,
      );
    }

    // 3. Initialize Twilio WhatsApp API
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioWhatsappNumber = this.configService.get<string>(
      'TWILIO_WHATSAPP_NUMBER',
      '',
    );

    if (
      accountSid &&
      authToken &&
      /^whatsapp:\+\d{8,15}$/.test(this.twilioWhatsappNumber)
    ) {
      try {
        this.twilioClient = (twilio as any)(accountSid, authToken);
        this.twilioConfigured = true;
        this.logger.log('Twilio WhatsApp Gateway configured');
      } catch (error: any) {
        this.logger.error(
          'Failed to initialize Twilio client',
          error?.message || String(error),
        );
        this.twilioConfigured = false;
      }
    }

    // 4. Determine default active provider
    const explicitProvider = (
      this.configService.get<string>('WHATSAPP_PROVIDER') || ''
    ).toUpperCase() as WhatsAppGatewayProvider;

    if (
      explicitProvider &&
      ['META_CLOUD_API', 'TWILIO', 'GUPSHUP', 'WHATSAPP_WEB'].includes(
        explicitProvider,
      )
    ) {
      this.activeProvider = explicitProvider;
    } else if (this.metaConfigured) {
      this.activeProvider = 'META_CLOUD_API';
    } else if (this.gupshupConfigured) {
      this.activeProvider = 'GUPSHUP';
    } else if (this.twilioConfigured) {
      this.activeProvider = 'TWILIO';
    } else {
      // Zero-cost fallback for small playschools / unconfigured environments
      this.activeProvider = 'WHATSAPP_WEB';
      this.logger.log(
        'No live WhatsApp API credentials configured. Defaulting to Zero-Cost WhatsApp Web (Click-to-Chat) mode.',
      );
    }

    this.logger.log(`Active WhatsApp Gateway Provider: ${this.activeProvider}`);
  }

  /**
   * Returns active provider name
   */
  getActiveProvider(): WhatsAppGatewayProvider {
    return this.activeProvider;
  }

  /**
   * Returns comprehensive gateway status for admin dashboards
   */
  getGatewayStatus() {
    const configuredProviders: WhatsAppGatewayProvider[] = ['WHATSAPP_WEB'];
    if (this.metaConfigured) configuredProviders.push('META_CLOUD_API');
    if (this.gupshupConfigured) configuredProviders.push('GUPSHUP');
    if (this.twilioConfigured) configuredProviders.push('TWILIO');

    return {
      available: this.isAvailable(),
      liveGatewayConfigured:
        this.metaConfigured || this.gupshupConfigured || this.twilioConfigured,
      activeProvider: this.activeProvider,
      configuredProviders,
      playschoolWebModeAvailable: true,
      providers: {
        META_CLOUD_API: {
          configured: this.metaConfigured,
          phoneNumberId: this.metaPhoneNumberId || null,
          wabaId: this.metaWabaId || null,
          apiVersion: this.metaApiVersion,
        },
        GUPSHUP: {
          configured: this.gupshupConfigured,
          appName: this.gupshupAppName || null,
          sourceNumber: this.gupshupSourceNumber || null,
        },
        TWILIO: {
          configured: this.twilioConfigured,
          whatsappNumber: this.twilioWhatsappNumber || null,
        },
        WHATSAPP_WEB: {
          configured: true,
          description:
            'Zero-cost Click-to-Chat mode (wa.me / WhatsApp Web) ideal for small play-schools & preschools.',
        },
      },
    };
  }

  /**
   * Verify Meta webhook token
   */
  verifyMetaWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.metaVerifyToken) {
      this.logger.log('Meta WhatsApp Webhook verified successfully');
      return challenge;
    }
    return null;
  }

  /**
   * Check if any WhatsApp sending mechanism is available
   * Note: Live API check is available via hasLiveProvider(), while isAvailable() returns true
   * if either a live gateway is configured or WHATSAPP_WEB mode is active.
   */
  isAvailable(): boolean {
    if (this.activeProvider === 'META_CLOUD_API') return this.metaConfigured;
    if (this.activeProvider === 'GUPSHUP') return this.gupshupConfigured;
    if (this.activeProvider === 'TWILIO') return this.twilioConfigured;
    return true; // WHATSAPP_WEB is always available
  }

  hasLiveProvider(): boolean {
    return this.metaConfigured || this.gupshupConfigured || this.twilioConfigured;
  }

  /**
   * Generate Zero-Cost WhatsApp Web / Mobile Click-to-Chat links (for small playschools)
   */
  generateWhatsAppWebLink(
    phoneNumber: string,
    message: string,
    defaultCountryCode: string = '91',
  ): WhatsAppWebLink {
    const e164 = this.validatePhoneNumber(phoneNumber)
      ? phoneNumber
      : this.formatPhoneNumber(phoneNumber, defaultCountryCode);
    // wa.me requires digits only without leading +
    const digitsOnly = e164.replace(/[^\d]/g, '');
    const encodedMessage = encodeURIComponent(message);

    return {
      waMeUrl: `https://wa.me/${digitsOnly}?text=${encodedMessage}`,
      webWhatsAppUrl: `https://web.whatsapp.com/send?phone=${digitsOnly}&text=${encodedMessage}`,
      phone: e164,
      encodedMessage,
      previewText: message,
    };
  }

  /**
   * Send a message using the active provider (or an explicit provider override)
   */
  async sendMessage(
    message: WhatsAppMessage,
    credentialsOverride?: ProviderCredentialsOverride,
  ): Promise<WhatsAppSendResult | null> {
    const provider =
      credentialsOverride?.provider ||
      message.providerOverride ||
      this.activeProvider;

    const formattedTo = this.validatePhoneNumber(message.to)
      ? message.to
      : this.formatPhoneNumber(message.to, '91');

    const normalizedMessage: WhatsAppMessage = {
      ...message,
      to: formattedTo,
    };

    switch (provider) {
      case 'META_CLOUD_API':
        return this.sendViaMetaCloudApi(normalizedMessage, credentialsOverride);
      case 'GUPSHUP':
        return this.sendViaGupshup(normalizedMessage, credentialsOverride);
      case 'TWILIO':
        return this.sendViaTwilio(normalizedMessage, credentialsOverride);
      case 'WHATSAPP_WEB':
      default:
        return this.sendViaWhatsAppWeb(normalizedMessage);
    }
  }

  /**
   * 1. Meta WhatsApp Cloud API (Official Graph API)
   */
  private async sendViaMetaCloudApi(
    message: WhatsAppMessage,
    override?: ProviderCredentialsOverride,
  ): Promise<WhatsAppSendResult | null> {
    const accessToken = override?.metaAccessToken || this.metaAccessToken;
    const phoneNumberId = override?.metaPhoneNumberId || this.metaPhoneNumberId;
    const apiVersion = override?.metaApiVersion || this.metaApiVersion || 'v19.0';

    if (!accessToken || !phoneNumberId) {
      this.logger.warn(
        'Meta WhatsApp Cloud API credentials not configured. Falling back to WhatsApp Web link.',
      );
      return this.sendViaWhatsAppWeb(message);
    }

    const recipientDigits = message.to.replace(/[^\d]/g, '');
    const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    let payload: Record<string, any>;

    if (message.mediaUrl) {
      const isPdf = message.mediaUrl.toLowerCase().endsWith('.pdf');
      payload = isPdf
        ? {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientDigits,
            type: 'document',
            document: {
              link: message.mediaUrl,
              caption: message.body,
              filename: message.mediaFilename || 'SchoolDocument.pdf',
            },
          }
        : {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientDigits,
            type: 'image',
            image: {
              link: message.mediaUrl,
              caption: message.body,
            },
          };
    } else {
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientDigits,
        type: 'text',
        text: {
          preview_url: true,
          body: message.body,
        },
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: any = await response.json();

      if (!response.ok) {
        const errMsg =
          data?.error?.message || `Meta Cloud API HTTP ${response.status}`;
        this.logger.error(`Meta Cloud API dispatch failed: ${errMsg}`);
        throw new Error(errMsg);
      }

      const wamid = data?.messages?.[0]?.id || `wamid.meta.${Date.now()}`;
      this.logger.log(
        `Meta WhatsApp Cloud API sent message to ${message.to}. ID: ${wamid}`,
      );

      return {
        sid: wamid,
        status: 'sent',
        provider: 'META_CLOUD_API',
        raw: data,
      };
    } catch (error: any) {
      this.logger.error(
        `Meta Cloud API error for ${message.to}: ${error?.message || String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 2. Gupshup WhatsApp Enterprise API (Popular for Indian Schools)
   */
  private async sendViaGupshup(
    message: WhatsAppMessage,
    override?: ProviderCredentialsOverride,
  ): Promise<WhatsAppSendResult | null> {
    const apiKey = override?.gupshupApiKey || this.gupshupApiKey;
    const appName = override?.gupshupAppName || this.gupshupAppName;
    const sourceNumber =
      override?.gupshupSourceNumber || this.gupshupSourceNumber;

    if (!apiKey || !appName || !sourceNumber) {
      this.logger.warn(
        'Gupshup WhatsApp credentials not configured. Falling back to WhatsApp Web link.',
      );
      return this.sendViaWhatsAppWeb(message);
    }

    const destinationDigits = message.to.replace(/[^\d]/g, '');
    const sourceDigits = sourceNumber.replace(/[^\d]/g, '');
    const endpoint = 'https://api.gupshup.io/wa/api/v1/msg';

    const msgObj = message.mediaUrl
      ? {
          type: message.mediaUrl.toLowerCase().endsWith('.pdf')
            ? 'file'
            : 'image',
          url: message.mediaUrl,
          caption: message.body,
          filename: message.mediaFilename || 'SchoolDocument.pdf',
        }
      : {
          type: 'text',
          text: message.body,
        };

    const formBody = new URLSearchParams({
      channel: 'whatsapp',
      source: sourceDigits,
      destination: destinationDigits,
      'src.name': appName,
      message: JSON.stringify(msgObj),
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
        },
        body: formBody.toString(),
      });

      const data: any = await response.json();

      if (!response.ok || data?.status === 'error') {
        const errMsg =
          data?.message || `Gupshup API HTTP ${response.status}`;
        this.logger.error(`Gupshup dispatch failed: ${errMsg}`);
        throw new Error(errMsg);
      }

      const msgId = data?.messageId || `gs_${Date.now()}`;
      this.logger.log(
        `Gupshup WhatsApp sent message to ${message.to}. ID: ${msgId}`,
      );

      return {
        sid: msgId,
        status: data?.status || 'submitted',
        provider: 'GUPSHUP',
        raw: data,
      };
    } catch (error: any) {
      this.logger.error(
        `Gupshup API error for ${message.to}: ${error?.message || String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 3. Twilio WhatsApp API
   */
  private async sendViaTwilio(
    message: WhatsAppMessage,
    override?: ProviderCredentialsOverride,
  ): Promise<WhatsAppSendResult | null> {
    let client = this.twilioClient;
    let fromNumber = this.twilioWhatsappNumber;

    if (
      override?.twilioAccountSid &&
      override?.twilioAuthToken &&
      override?.twilioWhatsappNumber
    ) {
      client = (twilio as any)(
        override.twilioAccountSid,
        override.twilioAuthToken,
      );
      fromNumber = override.twilioWhatsappNumber;
    }

    if (!client || !fromNumber) {
      this.logger.warn(
        'Twilio WhatsApp not configured. Falling back to WhatsApp Web link.',
      );
      return this.sendViaWhatsAppWeb(message);
    }

    try {
      const formattedTo = message.to.startsWith('whatsapp:')
        ? message.to
        : `whatsapp:${message.to}`;

      const formattedFrom = fromNumber.startsWith('whatsapp:')
        ? fromNumber
        : `whatsapp:${fromNumber}`;

      const twilioMessage = await client.messages.create({
        from: formattedFrom,
        to: formattedTo,
        body: message.body,
        ...(message.mediaUrl && { mediaUrl: [message.mediaUrl] }),
      });

      this.logger.log(
        `Twilio WhatsApp message sent to ${message.to}. SID: ${twilioMessage.sid}`,
      );

      return {
        sid: twilioMessage.sid,
        status: twilioMessage.status,
        provider: 'TWILIO',
        raw: twilioMessage,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send Twilio WhatsApp message to ${message.to}`,
        error?.message || String(error),
      );
      throw error;
    }
  }

  /**
   * 4. Zero-Cost WhatsApp Web / Click-to-Chat (Play-School Free Mode)
   */
  private async sendViaWhatsAppWeb(
    message: WhatsAppMessage,
  ): Promise<WhatsAppSendResult> {
    const bodyWithMedia = message.mediaUrl
      ? `${message.body}\n\n📎 Document Link: ${message.mediaUrl}`
      : message.body;

    const waLink = this.generateWhatsAppWebLink(message.to, bodyWithMedia);

    this.logger.log(
      `Generated Zero-Cost WhatsApp Web link for ${waLink.phone}`,
    );

    return {
      sid: `wa_web_${Date.now()}`,
      status: 'ready_to_open',
      provider: 'WHATSAPP_WEB',
      waLink,
    };
  }

  /**
   * Send a message using a predefined template
   */
  async sendTemplateMessage(
    template: WhatsAppTemplateMessage,
  ): Promise<WhatsAppSendResult | null> {
    try {
      const body = this.buildTemplateMessage(
        template.templateName,
        template.templateParams || {},
        template.language || 'en',
      );

      return await this.sendMessage({
        to: template.to,
        body,
        providerOverride: template.providerOverride,
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
  ): Promise<Array<WhatsAppSendResult | null>> {
    const results: Array<WhatsAppSendResult | null> = [];

    for (const message of messages) {
      try {
        const result = await this.sendMessage(message);
        results.push(result);

        // Rate-limit spacing for live APIs (100ms)
        if (this.activeProvider !== 'WHATSAPP_WEB') {
          await this.delay(100);
        }
      } catch (error) {
        this.logger.error(
          `Failed to send bulk message to ${message.to}`,
          error,
        );
        results.push(null);
      }
    }

    this.logger.log(
      `Bulk WhatsApp dispatch completed (${this.activeProvider}): ${
        results.filter((r) => r !== null).length
      }/${messages.length} successful`,
    );
    return results;
  }

  /**
   * Send a message with a PDF attachment
   */
  async sendDocument(
    to: string,
    message: string,
    documentUrl: string,
    filename?: string,
  ): Promise<WhatsAppSendResult | null> {
    return this.sendMessage({
      to,
      body: message,
      mediaUrl: documentUrl,
      mediaFilename: filename,
    });
  }

  /**
   * Test live provider credentials or send a real verification message
   */
  async testProviderConnection(
    credentials: ProviderCredentialsOverride,
    testPhone?: string,
    testMessage?: string,
  ): Promise<{
    success: boolean;
    provider: WhatsAppGatewayProvider;
    message: string;
    result?: WhatsAppSendResult | null;
  }> {
    try {
      if (credentials.provider === 'WHATSAPP_WEB') {
        const phone = testPhone || '+919847000111';
        const link = this.generateWhatsAppWebLink(
          phone,
          testMessage ||
            'Hello! This is a Zero-Cost WhatsApp Web test message from Krypton School Management.',
        );
        return {
          success: true,
          provider: 'WHATSAPP_WEB',
          message:
            'Zero-Cost WhatsApp Web (wa.me) mode is ready! No API credentials required.',
          result: {
            sid: `wa_web_test_${Date.now()}`,
            status: 'ready_to_open',
            provider: 'WHATSAPP_WEB',
            waLink: link,
          },
        };
      }

      if (testPhone) {
        const sendRes = await this.sendMessage(
          {
            to: testPhone,
            body:
              testMessage ||
              '✅ Krypton School ERP: Your live WhatsApp Business Gateway connection is active and verified!',
            providerOverride: credentials.provider,
          },
          credentials,
        );

        return {
          success: !!sendRes,
          provider: credentials.provider,
          message: `Test message dispatched via ${credentials.provider}!`,
          result: sendRes,
        };
      }

      // Credential validation without sending a message
      if (credentials.provider === 'META_CLOUD_API') {
        const token = credentials.metaAccessToken || this.metaAccessToken;
        const phoneId =
          credentials.metaPhoneNumberId || this.metaPhoneNumberId;
        const version = credentials.metaApiVersion || this.metaApiVersion;
        if (!token || !phoneId) {
          return {
            success: false,
            provider: 'META_CLOUD_API',
            message: 'Missing Meta Access Token or Phone Number ID.',
          };
        }
        const resp = await fetch(
          `https://graph.facebook.com/${version}/${phoneId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data: any = await resp.json();
        if (!resp.ok) {
          return {
            success: false,
            provider: 'META_CLOUD_API',
            message:
              data?.error?.message || 'Meta Graph API authentication failed.',
          };
        }
        return {
          success: true,
          provider: 'META_CLOUD_API',
          message: `Meta Cloud API verified! Display Number: ${
            data.display_phone_number || phoneId
          }`,
        };
      }

      if (credentials.provider === 'TWILIO') {
        const sid = credentials.twilioAccountSid;
        const token = credentials.twilioAuthToken;
        if (!sid || !token) {
          return {
            success: false,
            provider: 'TWILIO',
            message: 'Missing Twilio Account SID or Auth Token.',
          };
        }
        const client = (twilio as any)(sid, token);
        const account = await client.api.accounts(sid).fetch();
        return {
          success: true,
          provider: 'TWILIO',
          message: `Twilio Account verified! Friendly Name: ${account.friendlyName} (${account.status})`,
        };
      }

      if (credentials.provider === 'GUPSHUP') {
        if (
          !credentials.gupshupApiKey ||
          !credentials.gupshupAppName ||
          !credentials.gupshupSourceNumber
        ) {
          return {
            success: false,
            provider: 'GUPSHUP',
            message:
              'Missing Gupshup API Key, App Name, or Source Number.',
          };
        }
        return {
          success: true,
          provider: 'GUPSHUP',
          message: `Gupshup configuration formatted for App "${credentials.gupshupAppName}". Provide a test phone number to send a live verification ping.`,
        };
      }

      return {
        success: false,
        provider: credentials.provider,
        message: 'Unsupported provider.',
      };
    } catch (error: any) {
      return {
        success: false,
        provider: credentials.provider,
        message: error?.message || 'Connection test failed.',
      };
    }
  }

  /**
   * Build a message from a template with parameters
   */
  private buildTemplateMessage(
    templateName: string,
    params: Record<string, string>,
    language: 'en' | 'hi' | 'ml',
  ): string {
    const templates = this.getTemplates(language);
    let template = templates[templateName];

    if (!template) {
      this.logger.warn(`Template ${templateName} not found, using default`);
      template = 'Message from school: {message}';
    }

    Object.keys(params).forEach((key) => {
      template = template.replace(new RegExp(`\\{${key}\\}`, 'g'), params[key]);
    });

    return template;
  }

  /**
   * Get message templates
   */
  private getTemplates(language: 'en' | 'hi' | 'ml'): Record<string, string> {
    const templates = {
      en: {
        welcome:
          'Welcome to {schoolName}! We are excited to have {studentName} join us.',
        generic: '{message}',
      },
      hi: {
        welcome:
          '{schoolName} में आपका स्वागत है! {studentName} का हमारे विद्यालय परिवार में जुड़ना हमारे लिए अत्यंत हर्ष का विषय है।',
        generic: '{message}',
      },
      ml: {
        welcome:
          '{schoolName}-ലേക്ക് സ്വാഗതം! {studentName} ഞങ്ങളോടൊപ്പം ചേരുന്നതിൽ ഞങ്ങൾക്ക് അതിയായ സന്തോഷമുണ്ട്.',
        generic: '{message}',
      },
    };

    return templates[language] || templates.en;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate phone number format (E.164)
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164 if possible
   */
  formatPhoneNumber(
    phoneNumber: string,
    defaultCountryCode: string = '91',
  ): string {
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');

    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    return `+${defaultCountryCode}${cleaned}`;
  }
}
