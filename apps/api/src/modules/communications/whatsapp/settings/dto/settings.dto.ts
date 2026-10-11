import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({
    description: 'Enable/disable WhatsApp integration',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({
    description: 'Twilio Account SID',
    example: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    required: false,
  })
  @IsString()
  @IsOptional()
  accountSid?: string;

  @ApiProperty({
    description: 'Twilio Auth Token',
    example: 'your-auth-token',
    required: false,
  })
  @IsString()
  @IsOptional()
  authToken?: string;

  @ApiProperty({
    description: 'WhatsApp number in Twilio format',
    example: 'whatsapp:+14155238886',
    required: false,
  })
  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @ApiProperty({
    description: 'Default language for messages',
    example: 'en',
    enum: ['en', 'sw'],
    required: false,
  })
  @IsEnum(['en', 'sw'])
  @IsOptional()
  defaultLanguage?: 'en' | 'sw';

  @ApiProperty({
    description: 'Auto-send fee reminders',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  autoSendFeeReminders?: boolean;

  @ApiProperty({
    description: 'Auto-send attendance alerts',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  autoSendAttendanceAlerts?: boolean;

  @ApiProperty({
    description: 'Auto-send report cards',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  autoSendReportCards?: boolean;

  @ApiProperty({
    description: 'Cron expression for fee reminder schedule',
    example: '0 9 * * *',
    required: false,
  })
  @IsString()
  @IsOptional()
  feeReminderSchedule?: string;

  @ApiProperty({
    description: 'Cron expression for attendance alert schedule',
    example: '0 11 * * 1-5',
    required: false,
  })
  @IsString()
  @IsOptional()
  attendanceAlertSchedule?: string;
}

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Custom Fee Reminder',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Template type',
    example: 'FEE_REMINDER',
    enum: ['FEE_REMINDER', 'ATTENDANCE_ALERT', 'REPORT_CARD', 'CUSTOM'],
  })
  @IsEnum(['FEE_REMINDER', 'ATTENDANCE_ALERT', 'REPORT_CARD', 'CUSTOM'])
  type: 'FEE_REMINDER' | 'ATTENDANCE_ALERT' | 'REPORT_CARD' | 'CUSTOM';

  @ApiProperty({
    description: 'Template language',
    example: 'en',
    enum: ['en', 'sw'],
  })
  @IsEnum(['en', 'sw'])
  language: 'en' | 'sw';

  @ApiProperty({
    description: 'Template content with variables in {variableName} format',
    example: 'Dear Parent, {studentName} has {amount} due by {dueDate}.',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'List of variables used in template',
    example: ['studentName', 'amount', 'dueDate'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];
}

export class UpdateTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Updated Fee Reminder',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Template content',
    example: 'Updated content with {variables}',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    description: 'Template active status',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class GetLogsDto {
  @ApiProperty({
    description: 'Filter by communication type',
    example: 'WHATSAPP',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'Filter by status',
    example: 'SENT',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Start date (ISO format)',
    example: '2024-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date (ISO format)',
    example: '2024-01-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Limit number of results',
    example: 100,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}

export class GetStatsDto {
  @ApiProperty({
    description: 'Start date for statistics (ISO format)',
    example: '2024-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for statistics (ISO format)',
    example: '2024-01-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

