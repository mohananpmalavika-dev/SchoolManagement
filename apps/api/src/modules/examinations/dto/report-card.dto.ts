import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';

export enum ReportCardStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
}

export class GenerateReportCardDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'Term ID' })
  @IsUUID()
  termId: string;

  @ApiPropertyOptional({ description: 'Class teacher comments' })
  @IsOptional()
  @IsString()
  classTeacherComments?: string;

  @ApiPropertyOptional({ description: 'Principal comments' })
  @IsOptional()
  @IsString()
  principalComments?: string;
}

export class BulkGenerateReportCardsDto {
  @ApiProperty({ description: 'Term ID' })
  @IsUUID()
  termId: string;

  @ApiProperty({ description: 'Class ID' })
  @IsUUID()
  classId: string;

  @ApiPropertyOptional({ description: 'Stream ID (optional)' })
  @IsOptional()
  @IsUUID()
  streamId?: string;
}

export class UpdateReportCardDto {
  @ApiPropertyOptional({ description: 'Class teacher comments' })
  @IsOptional()
  @IsString()
  classTeacherComments?: string;

  @ApiPropertyOptional({ description: 'Principal comments' })
  @IsOptional()
  @IsString()
  principalComments?: string;

  @ApiPropertyOptional({
    description: 'Report card status',
    enum: ReportCardStatus,
  })
  @IsOptional()
  @IsEnum(ReportCardStatus)
  status?: ReportCardStatus;
}

export class ApproveReportCardDto {
  @ApiProperty({ description: 'Report card ID' })
  @IsUUID()
  reportCardId: string;

  @ApiPropertyOptional({ description: 'Principal comments' })
  @IsOptional()
  @IsString()
  principalComments?: string;
}

export class QueryReportCardsDto {
  @ApiPropertyOptional({ description: 'Filter by term ID' })
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional({ description: 'Filter by student ID' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Filter by class ID' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ReportCardStatus,
  })
  @IsOptional()
  @IsEnum(ReportCardStatus)
  status?: ReportCardStatus;
}
