import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@krypton/types';

export class MarkStudentAttendanceDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({
    description: 'Attendance status',
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
  })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Reason for absence/lateness' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Time of arrival (for late students)' })
  @IsOptional()
  @IsDateString({ strict: true })
  arrivalTime?: string;
}

export class BulkMarkAttendanceDto {
  @ApiProperty({ description: 'Class ID' })
  @IsUUID()
  classId: string;

  @ApiPropertyOptional({ description: 'Stream ID (optional)' })
  @IsOptional()
  @IsUUID()
  streamId?: string;

  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  @IsDateString({ strict: true })
  date: string;

  @ApiPropertyOptional({ description: 'Academic period/session' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  period?: number;

  @ApiProperty({
    description: 'Attendance records for each student',
    type: [MarkStudentAttendanceDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkStudentAttendanceDto)
  attendance: MarkStudentAttendanceDto[];
}

export class MarkSingleAttendanceDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  @IsDateString({ strict: true })
  date: string;

  @ApiPropertyOptional({ description: 'Academic period/session (1-10)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  period?: number;

  @ApiProperty({
    description: 'Attendance status',
    enum: AttendanceStatus,
  })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Reason for absence/lateness' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Time of arrival (for late students)' })
  @IsOptional()
  @IsDateString({ strict: true })
  arrivalTime?: string;
}

export class UpdateAttendanceDto {
  @ApiPropertyOptional({
    description: 'Updated attendance status',
    enum: AttendanceStatus,
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Updated remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Updated arrival time' })
  @IsOptional()
  @IsDateString({ strict: true })
  arrivalTime?: string;
}
