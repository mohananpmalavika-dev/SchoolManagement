import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';

export class SendFeeRemindersDto {
  @ApiProperty({
    description: 'Send reminder for specific invoice',
    example: 'uuid-of-invoice',
    required: false,
  })
  @IsString()
  @IsOptional()
  invoiceId?: string;

  @ApiProperty({
    description: 'Send reminders to all students in a class',
    example: 'uuid-of-class',
    required: false,
  })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiProperty({
    description: 'Send reminder to specific student',
    example: 'uuid-of-student',
    required: false,
  })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty({
    description: 'Send reminder X days before due date',
    example: 7,
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  daysBeforeDue?: number;

  @ApiProperty({
    description: 'Only send to overdue invoices',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  overdueOnly?: boolean;

  @ApiProperty({
    description: 'Message language',
    example: 'en',
    enum: ['en', 'hi', 'ml'],
    required: false,
  })
  @IsEnum(['en', 'hi', 'ml'])
  @IsOptional()
  language?: 'en' | 'hi' | 'ml';
}

