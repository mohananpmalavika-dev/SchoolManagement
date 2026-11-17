import { Transform as RawBoolean } from 'class-transformer';
import { IsString, IsEnum, IsOptional, IsBoolean, IsObject, IsUUID } from 'class-validator';

export enum ActivityType {
  ATTENDANCE = 'ATTENDANCE',
  PARTICIPATION = 'PARTICIPATION',
  ACHIEVEMENT = 'ACHIEVEMENT',
  ASSIGNMENT = 'ASSIGNMENT',
  BEHAVIOR = 'BEHAVIOR',
  EVENT = 'EVENT',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  MEAL = 'MEAL',
  TRANSPORT = 'TRANSPORT',
  OTHER = 'OTHER',
}

export class CreateActivityDto {
  @IsUUID()
  studentId: string;

  @IsEnum(ActivityType)
  activityType: ActivityType;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: any;

  @RawBoolean(({ obj, key }) => obj[key])
  @IsBoolean()
  @IsOptional()
  isVisibleToParents?: boolean = true;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsUUID()
  @IsOptional()
  subjectId?: string;
}
