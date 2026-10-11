import { IsInt, IsString, IsBoolean, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class CreateAvailabilityDto {
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number; // 1=Monday, 7=Sunday

  @IsString()
  startTime: string; // HH:MM format

  @IsString()
  endTime: string; // HH:MM format

  @IsInt()
  @Min(15)
  @Max(120)
  @IsOptional()
  slotDuration?: number = 30; // minutes

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;
}
