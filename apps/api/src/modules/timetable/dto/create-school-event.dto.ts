import { Transform as RawBoolean } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  MinLength,
} from 'class-validator';

export enum EventType {
  HOLIDAY = 'HOLIDAY',
  EXAM = 'EXAM',
  MEETING = 'MEETING',
  SPORTS = 'SPORTS',
  CULTURAL = 'CULTURAL',
  ACADEMIC = 'ACADEMIC',
  TERM_START = 'TERM_START',
  TERM_END = 'TERM_END',
  OTHER = 'OTHER',
}

export enum EventCategory {
  ACADEMIC = 'ACADEMIC',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  EXTRACURRICULAR = 'EXTRACURRICULAR',
  HOLIDAY = 'HOLIDAY',
}

export class CreateSchoolEventDto {
  @ApiProperty({ description: 'Event title', example: 'Sports Day' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional({
    description: 'Event description',
    example: 'Annual school sports day',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Event type',
    enum: EventType,
  })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({
    description: 'Event category',
    enum: EventCategory,
  })
  @IsEnum(EventCategory)
  category: EventCategory;

  @ApiProperty({
    description: 'Start date (ISO 8601)',
    example: '2024-01-15',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date (ISO 8601)',
    example: '2024-01-15',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Is all-day event',
    default: true,
  })
  @IsOptional()
  @RawBoolean(({ obj, key }) => obj[key])
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({
    description: 'Start time (HH:MM)',
    example: '09:00',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time (HH:MM)',
    example: '15:00',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Location',
    example: 'School Playground',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Is school closure',
    default: false,
  })
  @IsOptional()
  @RawBoolean(({ obj, key }) => obj[key])
  @IsBoolean()
  isHoliday?: boolean;
}

export class UpdateSchoolEventDto {
  @ApiPropertyOptional({ description: 'Event title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Event type', enum: EventType })
  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @ApiPropertyOptional({ description: 'Event category', enum: EventCategory })
  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Is all-day event' })
  @IsOptional()
  @RawBoolean(({ obj, key }) => obj[key])
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({ description: 'Start time (HH:MM)' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:MM)' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Is school closure' })
  @IsOptional()
  @RawBoolean(({ obj, key }) => obj[key])
  @IsBoolean()
  isHoliday?: boolean;
}

export class QuerySchoolEventsDto {
  @ApiPropertyOptional({ description: 'Start date filter (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Event type filter', enum: EventType })
  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @ApiPropertyOptional({
    description: 'Event category filter',
    enum: EventCategory,
  })
  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @ApiPropertyOptional({ description: 'Holidays only' })
  @IsOptional()
  @RawBoolean(({ obj, key }) => obj[key])
  @IsBoolean()
  holidaysOnly?: boolean;
}
