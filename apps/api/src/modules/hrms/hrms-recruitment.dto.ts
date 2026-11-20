import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class HrVacancyDto {
  @IsString() @MinLength(2) @MaxLength(150) title: string;
  @IsUUID() departmentId: string;
  @IsString() @MinLength(10) @MaxLength(4000) description: string;
  @IsInt() @Min(1) @Max(1000) positions: number;
  @IsIn(['DRAFT', 'OPEN', 'CLOSED']) status: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  closingDate?: string;
}
export class HrCandidateDto {
  @IsUUID() vacancyId: string;
  @IsString() @MinLength(2) @MaxLength(150) name: string;
  @IsEmail() @MaxLength(255) email: string;
  @IsString() @MinLength(5) @MaxLength(30) phone: string;
  @IsIn(['DIRECT', 'REFERRAL', 'JOB_BOARD', 'AGENCY', 'OTHER']) source: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2000)
  resumeUrl?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}
export class HrCandidateStageDto {
  @IsIn(['SCREENING', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'WITHDRAWN']) status: string;
  @IsString() @MinLength(5) @MaxLength(2000) reason: string;
}
export class HrInterviewDto {
  @IsString() @MinLength(2) @MaxLength(150) round: string;
  @IsUUID() interviewerId: string;
  @IsDateString({ strict: true }) startsAt: string;
  @IsDateString({ strict: true }) endsAt: string;
  @IsString() @MinLength(2) @MaxLength(500) location: string;
}
export class HrInterviewReviewDto {
  @IsIn(['COMPLETED', 'CANCELLED', 'NO_SHOW']) status: string;
  @IsOptional() @IsIn(['RECOMMENDED', 'HOLD', 'NOT_RECOMMENDED']) result?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number;
  @IsString() @MinLength(5) @MaxLength(4000) feedback: string;
}
export class HrOfferDecisionDto {
  @IsIn(['DECLINED', 'WITHDRAWN']) status: string;
  @IsString() @MinLength(5) @MaxLength(2000) reason: string;
}
