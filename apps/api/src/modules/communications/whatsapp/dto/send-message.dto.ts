import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsPhoneNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SendMessageDto {
  @ApiProperty({
    description: 'Recipient phone number in E.164 format',
    example: '+254712345678',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello! This is a test message from Krypton School.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Optional media URL (for images/documents)',
    example: 'https://example.com/report.pdf',
    required: false,
  })
  @IsString()
  @IsOptional()
  mediaUrl?: string;
}

export class RecipientDto {
  @ApiProperty({
    description: 'Recipient phone number',
    example: '+254712345678',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'Recipient name (optional, used for personalization)',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;
}

export class SendBulkMessageDto {
  @ApiProperty({
    description: 'List of recipients',
    type: [RecipientDto],
    example: [
      { phoneNumber: '+254712345678', name: 'John Doe' },
      { phoneNumber: '+254723456789', name: 'Jane Smith' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  recipients: RecipientDto[];

  @ApiProperty({
    description: 'Message template (use {name} for personalization)',
    example: 'Dear {name}, your child\'s fee payment is due.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class SendTemplateMessageDto {
  @ApiProperty({
    description: 'Recipient phone number',
    example: '+254712345678',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Template name',
    example: 'fee_reminder',
  })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({
    description: 'Template parameters',
    example: {
      studentName: 'John Doe',
      amount: '5000',
      dueDate: '2024-01-31',
    },
    required: false,
  })
  @IsOptional()
  templateParams?: Record<string, string>;

  @ApiProperty({
    description: 'Message language',
    example: 'en',
    enum: ['en', 'sw'],
    required: false,
  })
  @IsString()
  @IsOptional()
  language?: 'en' | 'sw';
}

