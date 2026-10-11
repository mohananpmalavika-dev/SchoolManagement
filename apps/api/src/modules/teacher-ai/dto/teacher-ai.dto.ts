import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsIn, IsISO8601, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { TeachingLanguage } from '@krypton/types';

export class ClassTermDto {
  @IsUUID() classId: string;
  @IsUUID() termId: string;
}
export class StudentObservationDto {
  @IsUUID() studentId: string;
  @IsOptional() @IsString() @MaxLength(800) behaviourObservation?: string;
}
export class GenerateRemarksDto extends ClassTermDto {
  @IsIn(['English', 'Malayalam', 'Swahili']) language: TeachingLanguage;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10) @ArrayUnique((s: StudentObservationDto) => s.studentId)
  @ValidateNested({ each: true }) @Type(() => StudentObservationDto) students: StudentObservationDto[];
}
export class SaveRemarkDto extends ClassTermDto {
  @IsUUID() studentId: string;
  @IsUUID() reportCardId: string;
  @IsISO8601({ strict: true }) expectedUpdatedAt: string;
  @IsString() @MinLength(10) @MaxLength(2000) remark: string;
}
export class GenerateQuizDto {
  @IsUUID() classId: string;
  @IsString() @MinLength(2) @MaxLength(100) subject: string;
  @IsString() @MinLength(2) @MaxLength(150) chapter: string;
  @IsString() @MinLength(80) @MaxLength(20000) sourceText: string;
  @IsIn(['English', 'Malayalam', 'Swahili']) language: TeachingLanguage;
  @IsIn(['QUIZ', 'WORKSHEET', 'QUESTION_PAPER']) format: 'QUIZ' | 'WORKSHEET' | 'QUESTION_PAPER';
  @IsIn(['MCQ', 'SHORT_ANSWER', 'MIXED']) questionType: 'MCQ' | 'SHORT_ANSWER' | 'MIXED';
  @IsIn(['FOUNDATION', 'STANDARD', 'CHALLENGE']) difficulty: 'FOUNDATION' | 'STANDARD' | 'CHALLENGE';
}
export class RiskReviewDto {
  @IsIn(['English', 'Malayalam', 'Swahili']) language: TeachingLanguage;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10) @ArrayUnique() @IsUUID('all', { each: true }) studentIds: string[];
}
