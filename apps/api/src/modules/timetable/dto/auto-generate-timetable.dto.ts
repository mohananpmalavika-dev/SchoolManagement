import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum CurriculumPresetEnum {
  CBSE_STANDARD = 'CBSE_STANDARD',
  KERALA_STATE_SYLLABUS = 'KERALA_STATE_SYLLABUS',
  ICSE_STEM = 'ICSE_STEM',
}

export class AutoGenerateTimetableDto {
  @ApiPropertyOptional({
    description: 'Number of active school days per week (5 or 6)',
    default: 5,
    minimum: 5,
    maximum: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(6)
  daysPerWeek?: number = 5;

  @ApiPropertyOptional({
    description: 'Number of periods per day',
    default: 8,
    minimum: 6,
    maximum: 9,
  })
  @IsOptional()
  @IsInt()
  @Min(6)
  @Max(9)
  periodsPerDay?: number = 8;

  @ApiPropertyOptional({
    description: 'Max periods assigned to a single teacher per day',
    default: 5,
    minimum: 3,
    maximum: 7,
  })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(7)
  maxTeacherDailyPeriods?: number = 5;

  @ApiPropertyOptional({
    description: 'Prioritize Core STEM subjects (Math, Science) in morning periods 1-4',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  prioritizeMorningStem?: boolean = true;

  @ApiPropertyOptional({
    description: 'Curriculum standard model',
    enum: CurriculumPresetEnum,
    default: CurriculumPresetEnum.CBSE_STANDARD,
  })
  @IsOptional()
  @IsEnum(CurriculumPresetEnum)
  curriculumPreset?: CurriculumPresetEnum = CurriculumPresetEnum.CBSE_STANDARD;
}
