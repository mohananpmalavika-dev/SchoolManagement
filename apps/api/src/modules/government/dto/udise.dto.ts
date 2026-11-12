import { IsString, IsOptional, IsBoolean, IsEnum, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UdiseSyncType } from '@prisma/client';

export class InitializeUdiseDto {
  @ApiProperty({ description: '11-digit UDISE+ School Code', example: '32080501204' })
  @IsString()
  udiseSchoolCode: string;

  @ApiPropertyOptional({ description: 'UDISE+ API Key (encrypted)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'UDISE+ API Secret (encrypted)' })
  @IsOptional()
  @IsString()
  apiSecret?: string;
}

export class UpdateUdiseConfigDto {
  @ApiPropertyOptional({ description: 'Enable/disable UDISE+ integration' })
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

  @ApiPropertyOptional({ description: 'Sync time in HH:MM format (IST)' })
  @IsOptional()
  @IsString()
  syncTime?: string;

  @ApiPropertyOptional({ description: 'UDISE+ API Key' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'UDISE+ API Secret' })
  @IsOptional()
  @IsString()
  apiSecret?: string;
}

export class SyncUdiseDto {
  @ApiProperty({ description: 'Type of sync to perform', enum: UdiseSyncType })
  @IsEnum(UdiseSyncType)
  syncType: UdiseSyncType;

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
  @ApiProperty({ description: 'Student ID to validate for UDISE+ / APAAR' })
  @IsString()
  studentId: string;
}

export class BulkSyncStudentsDto {
  @ApiProperty({ description: 'Array of student IDs to sync' })
  @IsArray()
  @IsString({ each: true })
  studentIds: string[];
}

export class UdiseIntegrationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  udiseSchoolCode: string;

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

  @ApiPropertyOptional()
  errors?: any[];
}

export class ValidationResultDto {
  @ApiProperty()
  isValid: boolean;

  @ApiProperty()
  errors: Array<{ field: string; message: string }>;

  @ApiProperty()
  warnings: string[];
}
