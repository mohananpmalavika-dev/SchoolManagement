import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';

export class SendAttendanceAlertsDto {
  @ApiProperty({
    description: 'Date for attendance alerts (ISO format)',
    example: '2024-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({
    description: 'Send alerts for specific class',
    example: 'uuid-of-class',
    required: false,
  })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiProperty({
    description: 'Send alert for specific student',
    example: 'uuid-of-student',
    required: false,
  })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty({
    description: 'Send alerts for specific status (defaults to ABSENT and LATE)',
    example: 'ABSENT',
    enum: ['ABSENT', 'LATE', 'EXCUSED', 'ALL'],
    required: false,
  })
  @IsEnum(['ABSENT', 'LATE', 'EXCUSED', 'ALL'])
  @IsOptional()
  status?: 'ABSENT' | 'LATE' | 'EXCUSED' | 'ALL';

  @ApiProperty({
    description: 'Message language',
    example: 'en',
    enum: ['en', 'hi', 'ml'],
    required: false,
  })
  @IsEnum(['en', 'hi', 'ml'])
  @IsOptional()
  language?: 'en' | 'hi' | 'ml';
}

