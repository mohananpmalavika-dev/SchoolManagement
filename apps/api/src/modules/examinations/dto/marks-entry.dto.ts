import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CompetencyLevel {
  EXCEEDS = 'EXCEEDS', // Exceeds expectations
  MEETS = 'MEETS', // Meets expectations
  APPROACHES = 'APPROACHES', // Approaches expectations
  BELOW = 'BELOW', // Below expectations
}

export class EnterGradeDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ description: 'Examination ID' })
  @IsUUID()
  examinationId: string;

  @ApiProperty({
    description: 'Score obtained',
    example: 85,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @Max(10000)
  score: number;

  @ApiPropertyOptional({
    description: 'Competency level (for CBC)',
    enum: CompetencyLevel,
  })
  @IsOptional()
  @IsEnum(CompetencyLevel)
  competencyLevel?: CompetencyLevel;

  @ApiPropertyOptional({ description: 'Teacher remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkEnterGradesDto {
  @ApiProperty({ description: 'Examination ID' })
  @IsUUID()
  examinationId: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({
    description: 'Grades for multiple students',
    type: [Object],
  })
  @IsArray()
  grades: Array<{
    studentId: string;
    score: number;
    competencyLevel?: CompetencyLevel;
    remarks?: string;
  }>;
}

export class UpdateGradeDto {
  @ApiPropertyOptional({ description: 'Updated score' })
  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number;

  @ApiPropertyOptional({
    description: 'Updated competency level',
    enum: CompetencyLevel,
  })
  @IsOptional()
  @IsEnum(CompetencyLevel)
  competencyLevel?: CompetencyLevel;

  @ApiPropertyOptional({ description: 'Updated remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class QueryGradesDto {
  @ApiPropertyOptional({ description: 'Filter by examination ID' })
  @IsOptional()
  @IsUUID()
  examinationId?: string;

  @ApiPropertyOptional({ description: 'Filter by student ID' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Filter by subject ID' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Filter by class ID' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ description: 'Filter by term ID' })
  @IsOptional()
  @IsUUID()
  termId?: string;
}
