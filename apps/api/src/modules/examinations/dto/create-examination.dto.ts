import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  MinLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ExaminationType {
  FORMATIVE = 'FORMATIVE', // Continuous assessment
  SUMMATIVE = 'SUMMATIVE', // End of term
  DIAGNOSTIC = 'DIAGNOSTIC', // Placement/screening
  COMPETENCY = 'COMPETENCY', // CBC assessment
}

export enum GradingSystem {
  PERCENTAGE = 'PERCENTAGE', // 0-100
  LETTER = 'LETTER', // A, B, C, D, E
  COMPETENCY = 'COMPETENCY', // Exceeds, Meets, Approaches, Below
  POINTS = 'POINTS', // 12, 11, 10, 9...
}

export class CreateSubjectExamDto {
  @ApiProperty({ description: 'Subject ID' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({
    description: 'Total marks for this subject',
    example: 100,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Max(1000)
  totalMarks: number;

  @ApiPropertyOptional({ description: 'Pass mark', example: 40 })
  @IsOptional()
  @IsInt()
  @Min(0)
  passMark?: number;

  @ApiPropertyOptional({ description: 'Weighting factor', example: 1.0 })
  @IsOptional()
  weight?: number;
}

export class CreateExaminationDto {
  @ApiProperty({ description: 'Examination name', example: 'End Term 1 Exam 2024' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({ description: 'Examination description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Academic term ID' })
  @IsUUID()
  termId: string;

  @ApiProperty({ description: 'Class ID' })
  @IsUUID()
  classId: string;

  @ApiPropertyOptional({ description: 'Stream ID (optional)' })
  @IsOptional()
  @IsUUID()
  streamId?: string;

  @ApiProperty({
    description: 'Examination type',
    enum: ExaminationType,
    example: ExaminationType.SUMMATIVE,
  })
  @IsEnum(ExaminationType)
  examinationType: ExaminationType;

  @ApiProperty({
    description: 'Grading system',
    enum: GradingSystem,
    example: GradingSystem.PERCENTAGE,
  })
  @IsEnum(GradingSystem)
  gradingSystem: GradingSystem;

  @ApiPropertyOptional({ description: 'Exam start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Exam end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Subjects in this examination',
    type: [CreateSubjectExamDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubjectExamDto)
  subjects: CreateSubjectExamDto[];
}

export class UpdateExaminationDto {
  @ApiPropertyOptional({ description: 'Examination name' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
