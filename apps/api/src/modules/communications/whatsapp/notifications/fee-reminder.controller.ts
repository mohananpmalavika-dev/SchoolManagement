import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FeeReminderService } from './fee-reminder.service';
import { SendFeeRemindersDto } from './dto/send-fee-reminders.dto';

@ApiTags('WhatsApp - Fee Reminders')
@Controller('whatsapp/fee-reminders')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is set up
export class FeeReminderController {
  constructor(private readonly feeReminderService: FeeReminderService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send fee reminders via WhatsApp' })
  @ApiResponse({
    status: 200,
    description: 'Fee reminders sent successfully',
    schema: {
      example: {
        totalProcessed: 25,
        successful: 23,
        failed: 2,
        details: [
          {
            studentId: 'uuid',
            studentName: 'John Doe',
            guardianPhone: '+254712345678',
            success: true,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  async sendFeeReminders(@Body() dto: SendFeeRemindersDto) {
    return this.feeReminderService.sendFeeReminders({
      invoiceId: dto.invoiceId,
      classId: dto.classId,
      studentId: dto.studentId,
      daysBeforeDue: dto.daysBeforeDue,
      overdueOnly: dto.overdueOnly,
      language: dto.language,
    });
  }

  @Post('send-overdue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send reminders for all overdue fees' })
  @ApiResponse({
    status: 200,
    description: 'Overdue fee reminders sent',
  })
  async sendOverdueReminders(@Body() dto: { language?: 'en' | 'sw' }) {
    return this.feeReminderService.sendFeeReminders({
      overdueOnly: true,
      language: dto.language || 'en',
    });
  }

  @Post('send-upcoming')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send reminders for fees due soon' })
  @ApiResponse({
    status: 200,
    description: 'Upcoming fee reminders sent',
  })
  async sendUpcomingReminders(
    @Body() dto: { days?: number; language?: 'en' | 'sw' },
  ) {
    return this.feeReminderService.sendFeeReminders({
      daysBeforeDue: dto.days || 7, // Default 7 days before due
      language: dto.language || 'en',
    });
  }

  @Post('payment-confirmation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send payment confirmation via WhatsApp' })
  @ApiResponse({
    status: 200,
    description: 'Payment confirmation sent',
  })
  async sendPaymentConfirmation(
    @Body() dto: { paymentId: string; language?: 'en' | 'sw' },
  ) {
    const result = await this.feeReminderService.sendPaymentConfirmation(
      dto.paymentId,
      dto.language || 'en',
    );

    return {
      success: result,
      message: result
        ? 'Payment confirmation sent successfully'
        : 'Failed to send payment confirmation',
    };
  }
}

