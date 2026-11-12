import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
  MinLength,
  IsBoolean,
} from 'class-validator';

export enum MessageChannel {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum MessagePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum MessageType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  ATTENDANCE_ALERT = 'ATTENDANCE_ALERT',
  FEE_REMINDER = 'FEE_REMINDER',
  EXAM_NOTIFICATION = 'EXAM_NOTIFICATION',
  REPORT_CARD = 'REPORT_CARD',
  GENERAL = 'GENERAL',
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Message channel',
    enum: MessageChannel,
    example: MessageChannel.SMS,
  })
  @IsEnum(MessageChannel)
  channel: MessageChannel;

  @ApiProperty({
    description: 'Recipient phone numbers (for SMS) or emails',
    example: ['919876543210', '919847012345'],
  })
  @IsArray()
  @IsString({ each: true })
  recipients: string[];

  @ApiProperty({
    description: 'Message subject (for email)',
    example: 'School Announcement',
  })
  @IsString()
  @MinLength(3)
  subject: string;

  @ApiProperty({
    description: 'Message body',
    example: 'Dear parent, your child was absent today.',
  })
  @IsString()
  @MinLength(10)
  message: string;

  @ApiPropertyOptional({
    description: 'Message type',
    enum: MessageType,
    default: MessageType.GENERAL,
  })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @ApiPropertyOptional({
    description: 'Message priority',
    enum: MessagePriority,
    default: MessagePriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(MessagePriority)
  priority?: MessagePriority;

  @ApiPropertyOptional({ description: 'Schedule send time (ISO 8601)' })
  @IsOptional()
  @IsString()
  scheduledAt?: string;
}

export class SendBulkMessageDto {
  @ApiProperty({ description: 'Message channel', enum: MessageChannel })
  @IsEnum(MessageChannel)
  channel: MessageChannel;

  @ApiProperty({ description: 'Class ID (for filtering students)' })
  @IsUUID()
  classId: string;

  @ApiPropertyOptional({ description: 'Stream ID (optional filter)' })
  @IsOptional()
  @IsUUID()
  streamId?: string;

  @ApiProperty({ description: 'Message subject' })
  @IsString()
  @MinLength(3)
  subject: string;

  @ApiProperty({ description: 'Message body' })
  @IsString()
  @MinLength(10)
  message: string;

  @ApiPropertyOptional({ description: 'Include parents', default: true })
  @IsOptional()
  @IsBoolean()
  includeParents?: boolean;

  @ApiPropertyOptional({ description: 'Include students', default: false })
  @IsOptional()
  @IsBoolean()
  includeStudents?: boolean;

  @ApiPropertyOptional({ description: 'Message type', enum: MessageType })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;
}

export class SendAbsentAlertDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  @IsString()
  date: string;

  @ApiPropertyOptional({ description: 'Class ID (optional filter)' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ description: 'Channels', enum: MessageChannel, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(MessageChannel, { each: true })
  channels?: MessageChannel[];
}

export class SendFeeReminderDto {
  @ApiPropertyOptional({ description: 'Minimum outstanding amount (cents)' })
  @IsOptional()
  minimumAmount?: number;

  @ApiPropertyOptional({ description: 'Class ID (optional filter)' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ description: 'Channels', enum: MessageChannel, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(MessageChannel, { each: true })
  channels?: MessageChannel[];
}
