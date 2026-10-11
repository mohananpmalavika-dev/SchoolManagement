import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import { SendMessageDto, SendBulkMessageDto } from './dto/send-message.dto';

@ApiTags('WhatsApp')
@Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
@Controller('whatsapp')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is set up
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Get('status')
  @ApiOperation({ summary: 'Check WhatsApp service status' })
  @ApiResponse({
    status: 200,
    description: 'WhatsApp service status',
    schema: {
      example: {
        available: true,
        message: 'WhatsApp service is configured and ready',
      },
    },
  })
  getStatus() {
    const available = this.whatsAppService.isAvailable();
    return {
      available,
      message: available
        ? 'WhatsApp service is configured and ready'
        : 'WhatsApp service is not configured. Please set Twilio credentials.',
    };
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a WhatsApp message' })
  @ApiResponse({
    status: 200,
    description: 'Message sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid phone number or message',
  })
  async sendMessage(@Body() dto: SendMessageDto) {
    // Validate phone number
    if (!this.whatsAppService.validatePhoneNumber(dto.to)) {
      const formatted = this.whatsAppService.formatPhoneNumber(dto.to);
      dto.to = formatted;
    }

    const result = await this.whatsAppService.sendMessage({
      to: dto.to,
      body: dto.message,
      mediaUrl: dto.mediaUrl,
    });

    return {
      success: !!result,
      messageId: result?.sid,
      status: result?.status,
    };
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
      details: results.map((r, index) => ({
        to: dto.recipients[index].phoneNumber,
        success: !!r,
        messageId: r?.sid,
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
}
