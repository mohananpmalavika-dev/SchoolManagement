import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';
import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  HttpStatus,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import {
  SendMessageDto,
  SendBulkMessageDto,
  GenerateWaLinkDto,
  TestProviderConnectionDto,
} from './dto/send-message.dto';

@ApiTags('WhatsApp')
@Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Get('status')
  @ApiOperation({ summary: 'Check WhatsApp multi-provider gateway status' })
  @ApiResponse({
    status: 200,
    description: 'WhatsApp gateway provider status (Meta Cloud API, Gupshup, Twilio, WhatsApp Web)',
  })
  getStatus() {
    const gatewayStatus = this.whatsAppService.getGatewayStatus();
    return {
      ...gatewayStatus,
      message: gatewayStatus.liveGatewayConfigured
        ? `Live WhatsApp Gateway active (${gatewayStatus.activeProvider})`
        : 'Zero-Cost WhatsApp Web (Click-to-Chat) mode active. Configure Meta Cloud API, Gupshup, or Twilio for automated server dispatch.',
    };
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a WhatsApp message via active live provider or WhatsApp Web link' })
  @ApiResponse({
    status: 200,
    description: 'Message dispatched or WhatsApp Web link generated',
  })
  async sendMessage(@Body() dto: SendMessageDto) {
    if (!this.whatsAppService.validatePhoneNumber(dto.to)) {
      dto.to = this.whatsAppService.formatPhoneNumber(dto.to);
    }

    const result = await this.whatsAppService.sendMessage({
      to: dto.to,
      body: dto.message,
      mediaUrl: dto.mediaUrl,
      providerOverride: dto.provider,
    });

    return {
      success: !!result,
      messageId: result?.sid,
      status: result?.status,
      provider: result?.provider || this.whatsAppService.getActiveProvider(),
      waLink: result?.waLink,
    };
  }

  @Post('wa-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate Zero-Cost Play-School WhatsApp Web / wa.me Click-to-Chat link' })
  generateWaLink(@Body() dto: GenerateWaLinkDto) {
    const waLink = this.whatsAppService.generateWhatsAppWebLink(
      dto.to,
      dto.message,
      dto.countryCode || '91',
    );
    return {
      success: true,
      provider: 'WHATSAPP_WEB',
      ...waLink,
    };
  }

  @Post('test-connection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test live WhatsApp provider credentials (Meta Cloud API, Gupshup, Twilio, or WhatsApp Web)' })
  async testConnection(@Body() dto: TestProviderConnectionDto) {
    return this.whatsAppService.testProviderConnection(
      {
        provider: dto.provider,
        metaAccessToken: dto.metaAccessToken,
        metaPhoneNumberId: dto.metaPhoneNumberId,
        metaWabaId: dto.metaWabaId,
        metaApiVersion: dto.metaApiVersion,
        twilioAccountSid: dto.twilioAccountSid,
        twilioAuthToken: dto.twilioAuthToken,
        twilioWhatsappNumber: dto.twilioWhatsappNumber,
        gupshupApiKey: dto.gupshupApiKey,
        gupshupAppName: dto.gupshupAppName,
        gupshupSourceNumber: dto.gupshupSourceNumber,
      },
      dto.testPhone,
      dto.testMessage,
    );
  }

  @Post('send-bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send bulk WhatsApp messages' })
  @ApiResponse({
    status: 200,
    description: 'Bulk messages processing initiated',
  })
  async sendBulkMessages(@Body() dto: SendBulkMessageDto) {
    const messages = dto.recipients.map((recipient) => ({
      to: this.whatsAppService.validatePhoneNumber(recipient.phoneNumber)
        ? recipient.phoneNumber
        : this.whatsAppService.formatPhoneNumber(recipient.phoneNumber),
      body: dto.message.replace(/\{name\}/g, recipient.name || ''),
    }));

    const results = await this.whatsAppService.sendBulkMessages(messages);

    const successCount = results.filter((r) => r !== null).length;
    const failureCount = results.length - successCount;

    return {
      total: results.length,
      successful: successCount,
      failed: failureCount,
      provider: this.whatsAppService.getActiveProvider(),
      details: results.map((r, index) => ({
        to: dto.recipients[index].phoneNumber,
        success: !!r,
        messageId: r?.sid,
        waLink: r?.waLink,
      })),
    };
  }

  @Post('validate-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate phone number format' })
  validatePhoneNumber(@Body() body: { phoneNumber: string }) {
    const isValid = this.whatsAppService.validatePhoneNumber(body.phoneNumber);
    const formatted = isValid
      ? body.phoneNumber
      : this.whatsAppService.formatPhoneNumber(body.phoneNumber);

    return {
      original: body.phoneNumber,
      isValid,
      formatted,
    };
  }

  @Get('webhook')
  @ApiOperation({ summary: 'Meta WhatsApp Cloud API webhook verification endpoint' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const verified = this.whatsAppService.verifyMetaWebhook(
      mode,
      token,
      challenge,
    );
    if (!verified) {
      throw new ForbiddenException('Webhook verification failed');
    }
    return verified;
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive WhatsApp delivery status webhooks (Meta / Gupshup / Twilio)' })
  handleWebhook(@Body() payload: any) {
    // Log delivery status updates / parent replies cleanly
    return {
      received: true,
      object: payload?.object || 'whatsapp_webhook',
    };
  }
}
