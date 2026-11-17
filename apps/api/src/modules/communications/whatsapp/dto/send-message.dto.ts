import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsPhoneNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SendMessageDto {
  @ApiProperty({
    description: 'Recipient phone number in E.164 format',
    example: '+919876543210',
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

  @ApiProperty({
    description: 'Optional gateway provider override',
    enum: ['META_CLOUD_API', 'TWILIO', 'GUPSHUP', 'WHATSAPP_WEB'],
    required: false,
  })
  @IsString()
  @IsOptional()
  provider?: 'META_CLOUD_API' | 'TWILIO' | 'GUPSHUP' | 'WHATSAPP_WEB';
}

export class RecipientDto {
  @ApiProperty({
    description: 'Recipient phone number',
    example: '+919876543210',
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
      { phoneNumber: '+919876543210', name: 'Rajesh Nair' },
      { phoneNumber: '+919847012345', name: 'Priya Menon' },
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
    example: '+919876543210',
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
    enum: ['en', 'hi', 'ml'],
    required: false,
  })
  @IsString()
  @IsOptional()
  language?: 'en' | 'hi' | 'ml';
}

export class GenerateWaLinkDto {
  @ApiProperty({
    description: 'Recipient phone number',
    example: '+919847034567',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Message text to pre-fill in WhatsApp Web / Mobile',
    example: 'പ്രിയ രക്ഷിതാവേ, ഫീസ് ഓർമ്മപ്പെടുത്തൽ...',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Default country code (e.g. 91)',
    example: '91',
    required: false,
  })
  @IsString()
  @IsOptional()
  countryCode?: string;
}

export class TestProviderConnectionDto {
  @ApiProperty({
    description: 'Gateway provider to test',
    enum: ['META_CLOUD_API', 'TWILIO', 'GUPSHUP', 'WHATSAPP_WEB'],
  })
  @IsString()
  @IsNotEmpty()
  provider: 'META_CLOUD_API' | 'TWILIO' | 'GUPSHUP' | 'WHATSAPP_WEB';

  @IsString()
  @IsOptional()
  testPhone?: string;

  @IsString()
  @IsOptional()
  testMessage?: string;

  @IsString()
  @IsOptional()
  metaAccessToken?: string;

  @IsString()
  @IsOptional()
  metaPhoneNumberId?: string;

  @IsString()
  @IsOptional()
  metaWabaId?: string;

  @IsString()
  @IsOptional()
  metaApiVersion?: string;

  @IsString()
  @IsOptional()
  twilioAccountSid?: string;

  @IsString()
  @IsOptional()
  twilioAuthToken?: string;

  @IsString()
  @IsOptional()
  twilioWhatsappNumber?: string;

  @IsString()
  @IsOptional()
  gupshupApiKey?: string;

  @IsString()
  @IsOptional()
  gupshupAppName?: string;

  @IsString()
  @IsOptional()
  gupshupSourceNumber?: string;
}


