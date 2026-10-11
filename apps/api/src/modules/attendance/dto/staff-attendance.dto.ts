import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum StaffAttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  ON_LEAVE = 'ON_LEAVE',
  SICK_LEAVE = 'SICK_LEAVE',
  OFFICIAL_DUTY = 'OFFICIAL_DUTY',
}

export class MarkStaffAttendanceItemDto {
  @ApiProperty({ description: 'Staff ID' })
  @IsUUID()
  staffId: string;

  @ApiProperty({
    description: 'Attendance status',
    enum: StaffAttendanceStatus,
  })
  @IsEnum(StaffAttendanceStatus)
  status: StaffAttendanceStatus;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Check-in time' })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiPropertyOptional({ description: 'Check-out time' })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;
}

export class BulkMarkStaffAttendanceDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Attendance records',
    type: [MarkStaffAttendanceItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkStaffAttendanceItemDto)
  attendance: MarkStaffAttendanceItemDto[];
}

export class MarkSingleStaffAttendanceDto {
  @ApiProperty({ description: 'Staff ID' })
  @IsUUID()
  staffId: string;

  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Attendance status',
    enum: StaffAttendanceStatus,
  })
  @IsEnum(StaffAttendanceStatus)
  status: StaffAttendanceStatus;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Check-in time' })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiPropertyOptional({ description: 'Check-out time' })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;
}

export class QueryStaffAttendanceDto {
  @ApiPropertyOptional({ description: 'Filter by staff ID' })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Specific date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: StaffAttendanceStatus,
  })
  @IsOptional()
  @IsEnum(StaffAttendanceStatus)
  status?: StaffAttendanceStatus;
}
