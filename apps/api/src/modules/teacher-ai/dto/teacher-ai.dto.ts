import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsIn, IsISO8601, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { TeachingLanguage, RemarksTone } from '@krypton/types';

export class ClassTermDto {
  @IsUUID() classId: string;
  @IsUUID() termId: string;
}
export class StudentObservationDto {
  @IsUUID() studentId: string;
  @IsOptional() @IsString() @MaxLength(800) behaviourObservation?: string;
}
export class GenerateRemarksDto extends ClassTermDto {
  @IsOptional() @IsIn(['NEP_HOLISTIC','HOLISTIC','ACADEMIC_RIGOR','GROWTH_MINDSET']) tone?: RemarksTone;
  @IsIn(['English', 'Hindi', 'Malayalam']) language: TeachingLanguage;
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
  @IsIn(['English', 'Hindi', 'Malayalam']) language: TeachingLanguage;
  @IsIn(['QUIZ', 'WORKSHEET', 'QUESTION_PAPER']) format: 'QUIZ' | 'WORKSHEET' | 'QUESTION_PAPER';
  @IsIn(['MCQ', 'SHORT_ANSWER', 'MIXED']) questionType: 'MCQ' | 'SHORT_ANSWER' | 'MIXED';
  @IsIn(['FOUNDATION', 'STANDARD', 'CHALLENGE']) difficulty: 'FOUNDATION' | 'STANDARD' | 'CHALLENGE';
}
export class RiskReviewDto {
  @IsIn(['English', 'Hindi', 'Malayalam']) language: TeachingLanguage;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10) @ArrayUnique() @IsUUID('all', { each: true }) studentIds: string[];
}

export class GenerateLessonPlanDto {
  @IsUUID() classId: string;
  @IsString() @MinLength(2) @MaxLength(100) subject: string;
  @IsString() @MinLength(2) @MaxLength(150) chapter: string;
  @IsOptional() @IsString() @MaxLength(150) strand?: string;
  @IsOptional() @IsString() @MaxLength(150) subStrand?: string;
  @IsOptional() @Type(() => Number) durationMinutes?: number;
  @IsOptional() @IsIn(['CBSE', 'ICSE', 'STATE_BOARD', 'NCERT', 'CAMBRIDGE']) curriculum?: 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'NCERT' | 'CAMBRIDGE';
  @IsOptional() @IsIn(['English', 'Hindi', 'Malayalam']) language?: TeachingLanguage;
  @IsOptional() @IsString() @MaxLength(1000) additionalNotes?: string;
}

export class GenerateSchemeOfWorkDto {
  @IsUUID() classId: string;
  @IsString() @MinLength(2) @MaxLength(100) subject: string;
  @IsString() @MinLength(2) @MaxLength(150) strand: string;
  @IsOptional() @IsString() @MaxLength(150) subStrand?: string;
  @IsOptional() @Type(() => Number) termNumber?: number;
  @IsOptional() @Type(() => Number) weeksCount?: number;
  @IsOptional() @Type(() => Number) lessonsPerWeek?: number;
  @IsOptional() @IsIn(['CBSE', 'ICSE', 'STATE_BOARD', 'NCERT', 'CAMBRIDGE']) curriculum?: 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'NCERT' | 'CAMBRIDGE';
  @IsOptional() @IsIn(['English', 'Hindi', 'Malayalam']) language?: TeachingLanguage;
  @IsOptional() @IsString() @MaxLength(1000) additionalNotes?: string;
}

export class ShareLessonToChatDto {
  @IsUUID() classId: string;
  @IsOptional() @IsUUID() channelId?: string;
  @IsString() @MinLength(3) @MaxLength(200) title: string;
  @IsString() @MinLength(10) @MaxLength(5000) content: string;
  @IsOptional() @IsIn(['LESSON_PLAN', 'SCHEME_OF_WORK']) type?: 'LESSON_PLAN' | 'SCHEME_OF_WORK';
}

export class CopilotQueryDto {
  @IsString() @MinLength(3) @MaxLength(500) query: string;
  @IsOptional() @IsIn(['English', 'Hindi', 'Malayalam']) language?: TeachingLanguage;
}

