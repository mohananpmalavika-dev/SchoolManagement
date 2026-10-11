import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateTimetableEntryDto {
  @ApiProperty({ description: 'Class ID' })
  @IsUUID()
  classId: string;

  @ApiPropertyOptional({ description: 'Stream ID (optional)' })
  @IsOptional()
  @IsUUID()
  streamId?: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ description: 'Teacher/Staff ID' })
  @IsUUID()
  teacherId: string;

  @ApiProperty({
    description: 'Day of week (1=Monday, 7=Sunday)',
    minimum: 1,
    maximum: 7,
  })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @ApiProperty({
    description: 'Period number or name',
    example: '1',
  })
  @IsString()
  period: string;

  @ApiProperty({
    description: 'Start time (HH:MM format)',
    example: '08:00',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time (HH:MM format)',
    example: '09:00',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:MM format',
  })
  endTime: string;

  @ApiPropertyOptional({
    description: 'Room/Classroom',
    example: 'Room 101',
  })
  @IsOptional()
  @IsString()
  room?: string;
}

export class UpdateTimetableEntryDto {
  @ApiPropertyOptional({ description: 'Subject ID' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Teacher/Staff ID' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({
    description: 'Start time (HH:MM format)',
    example: '08:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time (HH:MM format)',
    example: '09:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime?: string;

  @ApiPropertyOptional({ description: 'Room/Classroom' })
  @IsOptional()
  @IsString()
  room?: string;
}

export class BulkCreateTimetableDto {
  @ApiProperty({
    description: 'Array of timetable entries',
    type: [CreateTimetableEntryDto],
  })
  entries: CreateTimetableEntryDto[];
}

export class QueryTimetableDto {
  @ApiPropertyOptional({ description: 'Class ID filter' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ description: 'Stream ID filter' })
  @IsOptional()
  @IsUUID()
  streamId?: string;

  @ApiPropertyOptional({ description: 'Teacher ID filter' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional({
    description: 'Day of week filter (1-7)',
    minimum: 1,
    maximum: 7,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;
}
