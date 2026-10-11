import { IsString, IsOptional, IsBoolean, IsEnum, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NemisSyncType } from '@prisma/client';

export class InitializeNemisDto {
  @ApiProperty({ description: 'NEMIS School Code' })
  @IsString()
  nemisSchoolCode: string;

  @ApiPropertyOptional({ description: 'NEMIS API Key (encrypted)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'NEMIS API Secret (encrypted)' })
  @IsOptional()
  @IsString()
  apiSecret?: string;
}

export class UpdateNemisConfigDto {
  @ApiPropertyOptional({ description: 'Enable/disable NEMIS integration' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable automatic sync' })
  @IsOptional()
  @IsBoolean()
  autoSync?: boolean;

  @ApiPropertyOptional({ description: 'Sync frequency: HOURLY, DAILY, WEEKLY, MONTHLY' })
  @IsOptional()
  @IsString()
  syncFrequency?: string;

  @ApiPropertyOptional({ description: 'Sync time in HH:MM format' })
  @IsOptional()
  @IsString()
  syncTime?: string;

  @ApiPropertyOptional({ description: 'NEMIS API Key' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'NEMIS API Secret' })
  @IsOptional()
  @IsString()
  apiSecret?: string;
}

export class SyncNemisDto {
  @ApiProperty({ 
    description: 'Type of sync to perform',
    enum: NemisSyncType,
  })
  @IsEnum(NemisSyncType)
  syncType: NemisSyncType;

  @ApiPropertyOptional({ description: 'Start date for date-range syncs' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for date-range syncs' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ValidateStudentDto {
  @ApiProperty({ description: 'Student ID to validate' })
  @IsString()
  studentId: string;
}

export class BulkSyncStudentsDto {
  @ApiProperty({ description: 'Array of student IDs to sync' })
  @IsArray()
  @IsString({ each: true })
  studentIds: string[];
}

export class NemisIntegrationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nemisSchoolCode: string;

  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty()
  autoSync: boolean;

  @ApiProperty()
  syncFrequency: string;

  @ApiPropertyOptional()
  syncTime?: string;

  @ApiPropertyOptional()
  lastSyncAt?: Date;

  @ApiProperty()
  syncStatus: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SyncResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  attempted: number;

  @ApiProperty()
  succeeded: number;

  @ApiProperty()
  failed: number;

  @ApiPropertyOptional({ type: [Object] })
  errors?: any[];
}

export class ValidationResultDto {
  @ApiProperty()
  isValid: boolean;

  @ApiProperty({ type: [String] })
  errors: string[];

  @ApiProperty({ type: [String] })
  warnings: string[];
}
