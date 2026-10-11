import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Matches, Max, Min } from 'class-validator';

export class AnalyticsPeriodDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) from?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) to?: string;
}
export class AnalyticsQueryDto extends AnalyticsPeriodDto {
  @IsOptional() @IsUUID() classId?: string;
  @IsOptional() @IsUUID() subjectId?: string;
}
export class SchoolBenchmarkQueryDto extends AnalyticsPeriodDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000) page: number = 1;
}
