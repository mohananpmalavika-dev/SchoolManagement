import { IsString, IsOptional, IsInt, IsEnum, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BoardExamLevel, RegistrationStatus } from '@prisma/client';

export class InitializeBoardDto {
  @ApiPropertyOptional({ description: 'Board Name (CBSE, ICSE, STATE_BOARD)', default: 'CBSE' })
  @IsOptional()
  @IsString()
  boardName?: string;

  @ApiProperty({ description: 'Board Affiliation Number', example: '930124' })
  @IsString()
  affiliationNumber: string;

  @ApiPropertyOptional({ description: 'Board School Code', example: '75432' })
  @IsOptional()
  @IsString()
  schoolCode?: string;

  @ApiPropertyOptional({ description: 'Board Portal API Key (encrypted)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Board Portal API Secret (encrypted)' })
  @IsOptional()
  @IsString()
  apiSecret?: string;
}

export class UpdateBoardConfigDto {
  @ApiPropertyOptional({ description: 'Enable/disable Board Exam integration' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Board API Key' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Board API Secret' })
  @IsOptional()
  @IsString()
  apiSecret?: string;
}

export class RegisterCandidatesDto {
  @ApiProperty({ description: 'Examination year', example: 2027 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  examYear: number;

  @ApiProperty({ description: 'Examination session', example: 'March 2027' })
  @IsString()
  examSession: string;

  @ApiProperty({ description: 'Board examination level', enum: BoardExamLevel })
  @IsEnum(BoardExamLevel)
  examLevel: BoardExamLevel;

  @ApiProperty({ description: 'Array of student IDs to register', type: [String] })
  @IsArray()
  @IsString({ each: true })
  studentIds: string[];
}

export class DownloadResultsDto {
  @ApiProperty({ description: 'Examination year', example: 2027 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  examYear: number;

  @ApiProperty({ description: 'Board examination level', enum: BoardExamLevel })
  @IsEnum(BoardExamLevel)
  examLevel: BoardExamLevel;
}

export class GetExamTimetableDto {
  @ApiProperty({ description: 'Examination year', example: 2027 })
  @IsInt()
  @Min(2020)
  @Max(2100)
  examYear: number;

  @ApiProperty({ description: 'Board examination level', enum: BoardExamLevel })
  @IsEnum(BoardExamLevel)
  examLevel: BoardExamLevel;
}

export class SubmitIrregularityReportDto {
  @ApiProperty({ description: 'Candidate Roll Number' })
  @IsString()
  candidateNumber: string;

  @ApiProperty({ description: 'Type of irregularity', example: 'UNFAIR_MEANS' })
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

  @ApiPropertyOptional({ description: 'Filter by examination level', enum: BoardExamLevel })
  @IsOptional()
  @IsEnum(BoardExamLevel)
  examLevel?: BoardExamLevel;

  @ApiPropertyOptional({ description: 'Filter by registration status', enum: RegistrationStatus })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;
}

export class BoardIntegrationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  boardName: string;

  @ApiProperty()
  affiliationNumber: string;

  @ApiPropertyOptional()
  schoolCode?: string;

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

export class BoardRegistrationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  examYear: number;

  @ApiProperty()
  examSession: string;

  @ApiProperty()
  examLevel: BoardExamLevel;

  @ApiPropertyOptional()
  candidateNumber?: string;

  @ApiPropertyOptional()
  locReference?: string;

  @ApiProperty()
  registrationStatus: RegistrationStatus;

  @ApiProperty()
  resultsAvailable: boolean;

  @ApiProperty()
  registrationFee: number;

  @ApiProperty()
  isPaid: boolean;

  @ApiProperty()
  createdAt: Date;
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

  @ApiPropertyOptional()
  registrations?: any[];

  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
  results?: any[];

  @ApiPropertyOptional()
  errors?: any[];
}
