import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  MinLength,
  IsArray,
  IsObject,
} from 'class-validator';
import { BillingCycle } from './subscription.dto';

export class CreatePlanDto {
  @ApiProperty({ description: 'Plan name', example: 'Professional' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'professional',
  })
  @IsString()
  @MinLength(3)
  slug: string;

  @ApiPropertyOptional({
    description: 'Plan description',
    example: 'Perfect for medium-sized schools',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Price in INR minor units (paise)',
    example: 4000000, // INR 40,000
  })
  @IsInt()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Billing cycle',
    enum: BillingCycle,
    default: BillingCycle.ANNUAL,
  })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({
    description: 'Trial period in days',
    default: 14,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;

  @ApiProperty({
    description: 'Maximum number of students',
    example: 500,
  })
  @IsInt()
  @Min(1)
  maxStudents: number;

  @ApiProperty({
    description: 'Maximum number of staff',
    example: 100,
  })
  @IsInt()
  @Min(1)
  maxStaff: number;

  @ApiPropertyOptional({
    description: 'Maximum storage in MB',
    default: 10000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxStorageMB?: number;

  @ApiPropertyOptional({
    description: 'Monthly SMS credits',
    default: 1000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  smsCredits?: number;

  @ApiProperty({
    description: 'Feature flags (array of feature names)',
    example: [
      'attendance',
      'examinations',
      'communications',
      'timetable',
      'razorpay_upi',
    ],
  })
  @IsArray()
  features: string[];

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ description: 'Plan name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Plan description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Price in INR minor units (paise)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Billing cycle', enum: BillingCycle })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ description: 'Trial period in days' })
  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;

  @ApiPropertyOptional({ description: 'Maximum students' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxStudents?: number;

  @ApiPropertyOptional({ description: 'Maximum staff' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxStaff?: number;

  @ApiPropertyOptional({ description: 'Maximum storage in MB' })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxStorageMB?: number;

  @ApiPropertyOptional({ description: 'Monthly SMS credits' })
  @IsOptional()
  @IsInt()
  @Min(0)
  smsCredits?: number;

  @ApiPropertyOptional({ description: 'Feature flags' })
  @IsOptional()
  @IsArray()
  features?: string[];

  @ApiPropertyOptional({ description: 'Is plan active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
