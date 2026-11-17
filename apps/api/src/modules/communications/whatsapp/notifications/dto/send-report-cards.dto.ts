import { Transform as RawBoolean } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export class SendReportCardsDto {
  @ApiProperty({
    description: 'Send specific report card',
    example: 'uuid-of-report-card',
    required: false,
  })
  @IsString()
  @IsOptional()
  reportCardId?: string;

  @ApiProperty({
    description: 'Send all report cards for a term',
    example: 'uuid-of-term',
    required: false,
  })
  @IsString()
  @IsOptional()
  termId?: string;

  @ApiProperty({
    description: 'Send report cards for a specific class',
    example: 'uuid-of-class',
    required: false,
  })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiProperty({
    description: 'Send report card for specific student',
    example: 'uuid-of-student',
    required: false,
  })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty({
    description: 'Message language',
    example: 'en',
    enum: ['en', 'hi', 'ml'],
    required: false,
  })
  @IsEnum(['en', 'hi', 'ml'])
  @IsOptional()
  language?: 'en' | 'hi' | 'ml';

  @ApiProperty({
    description: "Include teacher's remarks in the message",
    example: true,
    required: false,
  })
  @RawBoolean(({ obj, key }) => obj[key])
  @IsBoolean()
  @IsOptional()
  includeRemarks?: boolean;
}

