import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AttendanceAlertService } from './attendance-alert.service';
import { SendAttendanceAlertsDto } from './dto/send-attendance-alerts.dto';

@ApiTags('WhatsApp - Attendance Alerts')
@Controller('whatsapp/attendance-alerts')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is set up
export class AttendanceAlertController {
  constructor(
    private readonly attendanceAlertService: AttendanceAlertService,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send attendance alerts via WhatsApp' })
  @ApiResponse({
    status: 200,
    description: 'Attendance alerts sent successfully',
    schema: {
      example: {
        totalProcessed: 15,
        successful: 14,
        failed: 1,
        details: [
          {
            studentId: 'uuid',
            studentName: 'John Doe',
            guardianPhone: '+254712345678',
            status: 'ABSENT',
            success: true,
          },
        ],
      },
    },
  })
  async sendAttendanceAlerts(@Body() dto: SendAttendanceAlertsDto) {
    return this.attendanceAlertService.sendAttendanceAlerts({
      date: dto.date ? new Date(dto.date) : new Date(),
      classId: dto.classId,
      studentId: dto.studentId,
      status: dto.status,
      language: dto.language,
    });
  }

  @Post('send-absent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send alerts for absent students only' })
  @ApiResponse({
    status: 200,
    description: 'Absent student alerts sent',
  })
  async sendAbsentAlerts(
    @Body() dto: { date?: string; classId?: string; language?: 'en' | 'sw' },
  ) {
    return this.attendanceAlertService.sendAttendanceAlerts({
      date: dto.date ? new Date(dto.date) : new Date(),
      classId: dto.classId,
      status: 'ABSENT',
      language: dto.language || 'en',
    });
  }

  @Post('send-late')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send alerts for late arrivals only' })
  @ApiResponse({
    status: 200,
    description: 'Late arrival alerts sent',
  })
  async sendLateAlerts(
    @Body() dto: { date?: string; classId?: string; language?: 'en' | 'sw' },
  ) {
    return this.attendanceAlertService.sendAttendanceAlerts({
      date: dto.date ? new Date(dto.date) : new Date(),
      classId: dto.classId,
      status: 'LATE',
      language: dto.language || 'en',
    });
  }

  @Post('send-daily-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send daily attendance summary to all parents',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily summaries sent',
  })
  async sendDailySummary(
    @Body() dto: { date?: string; language?: 'en' | 'sw' },
  ) {
    return this.attendanceAlertService.sendDailyAttendanceSummary(
      dto.date ? new Date(dto.date) : new Date(),
      dto.language || 'en',
    );
  }

  @Post('instant-alert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send instant alert for a specific attendance record',
  })
  @ApiResponse({
    status: 200,
    description: 'Instant alert sent',
  })
  async sendInstantAlert(
    @Body() dto: { attendanceId: string; language?: 'en' | 'sw' },
  ) {
    const result = await this.attendanceAlertService.sendInstantAlert(
      dto.attendanceId,
      dto.language || 'en',
    );

    return {
      success: result,
      message: result
        ? 'Instant alert sent successfully'
        : 'Failed to send instant alert',
    };
  }
}

