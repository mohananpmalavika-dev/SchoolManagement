import { IsString, IsOptional, IsInt, IsEnum, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KnecExamLevel, RegistrationStatus } from '@prisma/client';

export class InitializeKnecDto {
  @ApiProperty({ description: 'KNEC Centre Number' })
  @IsString()
  knecCentreNumber: string;

  @ApiPropertyOptional({ description: 'KNEC API Key (encrypted)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'KNEC API Secret (encrypted)' })
  @IsOptional()
  @IsString()
  apiSecret?: string;
}

export class UpdateKnecConfigDto {
  @ApiPropertyOptional({ description: 'Enable/disable KNEC integration' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'KNEC API Key' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'KNEC API Secret' })
  @IsOptional()
  @IsString()
  apiSecret?: string;
}

export class RegisterCandidatesDto {
  @ApiProperty({ description: 'Examination year', example: 2024 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  examYear: number;

  @ApiProperty({ description: 'Examination session', example: 'November 2024' })
  @IsString()
  examSession: string;

  @ApiProperty({ 
    description: 'Examination level',
    enum: KnecExamLevel,
  })
  @IsEnum(KnecExamLevel)
  examLevel: KnecExamLevel;

  @ApiProperty({ description: 'Array of student IDs to register', type: [String] })
  @IsArray()
  @IsString({ each: true })
  studentIds: string[];
}

export class DownloadResultsDto {
  @ApiProperty({ description: 'Examination year', example: 2024 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  examYear: number;

  @ApiProperty({ 
    description: 'Examination level',
    enum: KnecExamLevel,
  })
  @IsEnum(KnecExamLevel)
  examLevel: KnecExamLevel;
}

export class GetExamTimetableDto {
  @ApiProperty({ description: 'Examination year', example: 2024 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  examYear: number;

  @ApiProperty({ 
    description: 'Examination level',
    enum: KnecExamLevel,
  })
  @IsEnum(KnecExamLevel)
  examLevel: KnecExamLevel;
}

export class SubmitIrregularityReportDto {
  @ApiProperty({ description: 'Candidate number' })
  @IsString()
  candidateNumber: string;

  @ApiProperty({ description: 'Type of irregularity', example: 'CHEATING' })
  @IsString()
  irregularityType: string;

  @ApiProperty({ description: 'Detailed description of the irregularity' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'URLs to evidence documents', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}

export class GetRegistrationsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by examination year' })
  @IsOptional()
  @IsInt()
  examYear?: number;

  @ApiPropertyOptional({ 
    description: 'Filter by examination level',
    enum: KnecExamLevel,
  })
  @IsOptional()
  @IsEnum(KnecExamLevel)
  examLevel?: KnecExamLevel;
}

export class KnecIntegrationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  knecCentreNumber: string;

  @ApiProperty()
  isEnabled: boolean;

  @ApiPropertyOptional()
  lastSyncAt?: Date;

  @ApiProperty()
  syncStatus: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class KnecRegistrationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  examYear: number;

  @ApiProperty()
  examSession: string;

  @ApiProperty()
  examLevel: KnecExamLevel;

  @ApiPropertyOptional()
  candidateNumber?: string;

  @ApiPropertyOptional()
  indexNumber?: string;

  @ApiProperty()
  registrationStatus: RegistrationStatus;

  @ApiProperty()
  subjects: any;

  @ApiProperty()
  registrationFee: number;

  @ApiProperty()
  isPaid: boolean;

  @ApiProperty()
  resultsAvailable: boolean;

  @ApiPropertyOptional()
  student?: any;
}

export class CandidateRegistrationResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  attempted: number;

  @ApiProperty()
  succeeded: number;

  @ApiProperty()
  failed: number;

  @ApiProperty({ type: [KnecRegistrationResponseDto] })
  registrations: KnecRegistrationResponseDto[];

  @ApiPropertyOptional({ type: [Object] })
  errors?: any[];
}

export class ResultsDownloadResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  attempted: number;

  @ApiProperty()
  succeeded: number;

  @ApiProperty()
  failed: number;

  @ApiProperty({ type: [Object] })
  downloaded: any[];

  @ApiPropertyOptional({ type: [Object] })
  errors?: any[];
}
