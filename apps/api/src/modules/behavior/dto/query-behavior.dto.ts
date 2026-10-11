import { IsOptional, IsEnum, IsUUID, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BehaviorType, BehaviorCategory } from './create-behavior.dto';

export class QueryBehaviorDto {
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsEnum(BehaviorType)
  @IsOptional()
  behaviorType?: BehaviorType;

  @IsEnum(BehaviorCategory)
  @IsOptional()
  category?: BehaviorCategory;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
