import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  IsObject,
} from 'class-validator';
import { MessageType, MessageChannel } from './send-message.dto';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'Absence Alert' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
  })
  @IsEnum(MessageType)
  messageType: MessageType;

  @ApiProperty({
    description: 'Template subject',
    example: 'Student Absence Alert - {{date}}',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Template body with placeholders',
    example: 'Dear {{parentName}}, {{studentName}} was absent on {{date}}.',
  })
  @IsString()
  @MinLength(10)
  body: string;

  @ApiProperty({
    description: 'Supported channels',
    enum: MessageChannel,
    isArray: true,
  })
  @IsEnum(MessageChannel, { each: true })
  channels: MessageChannel[];

  @ApiPropertyOptional({ description: 'Template variables description' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Is template active', default: true })
  @IsOptional()
  isActive?: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Template subject' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Template body' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Is template active' })
  @IsOptional()
  isActive?: boolean;
}
