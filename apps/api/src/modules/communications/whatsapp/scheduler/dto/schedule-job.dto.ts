import { ApiProperty } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';

export class ScheduleJobDto {
  @ApiProperty({
    description: 'Job payload (varies based on job type)',
    example: {
      classId: 'uuid-of-class',
      overdueOnly: true,
    },
  })
  @IsObject()
  payload: any;

  @ApiProperty({
    description: 'Delay in minutes before job execution',
    example: 30,
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  delayMinutes?: number;

  @ApiProperty({
    description: 'Job priority (1-10, higher is more important)',
    example: 5,
    required: false,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  priority?: number;

  @ApiProperty({
    description: 'Message language',
    example: 'en',
    enum: ['en', 'sw'],
    required: false,
  })
  @IsEnum(['en', 'sw'])
  @IsOptional()
  language?: 'en' | 'sw';
}

