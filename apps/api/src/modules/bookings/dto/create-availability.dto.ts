import { Transform as RawBoolean } from 'class-transformer';
import { IsInt, IsString, IsBoolean, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

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
  slotDuration?: number; // minutes, defaults to 30 when creating

  @RawBoolean(({ obj, key }) => obj[key])
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;
}

export class UpdateAvailabilityDto extends PartialType(CreateAvailabilityDto) {}
