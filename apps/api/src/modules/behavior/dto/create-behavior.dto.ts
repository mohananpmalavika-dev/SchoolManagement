import { Transform as RawBoolean } from 'class-transformer';
import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsUUID, IsDateString } from 'class-validator';

export enum BehaviorType {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  NEUTRAL = 'NEUTRAL',
}

export enum BehaviorCategory {
  // Positive
  ACADEMIC_EXCELLENCE = 'ACADEMIC_EXCELLENCE',
  GOOD_CONDUCT = 'GOOD_CONDUCT',
  LEADERSHIP = 'LEADERSHIP',
  HELPFULNESS = 'HELPFULNESS',
  PARTICIPATION = 'PARTICIPATION',
  PUNCTUALITY = 'PUNCTUALITY',
  
  // Negative
  LATE_ARRIVAL = 'LATE_ARRIVAL',
  ABSENCE = 'ABSENCE',
  DISRUPTION = 'DISRUPTION',
  INCOMPLETE_WORK = 'INCOMPLETE_WORK',
  UNIFORM_VIOLATION = 'UNIFORM_VIOLATION',
  BULLYING = 'BULLYING',
  DISRESPECT = 'DISRESPECT',
  
  // Neutral
  OBSERVATION = 'OBSERVATION',
  OTHER = 'OTHER',
}

export class CreateBehaviorDto {
  @IsUUID()
  studentId: string;

  @IsEnum(BehaviorType)
  behaviorType: BehaviorType;

  @IsEnum(BehaviorCategory)
  category: BehaviorCategory;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  incidentDate: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsInt()
  @IsOptional()
  points?: number = 0;

  @IsString()
  @IsOptional()
  actionTaken?: string;

  @RawBoolean(({ obj, key }) => obj[key])
  @IsBoolean()
  @IsOptional()
  followUpRequired?: boolean = false;

  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @RawBoolean(({ obj, key }) => obj[key])
  @IsBoolean()
  @IsOptional()
  parentNotified?: boolean = false;
}
