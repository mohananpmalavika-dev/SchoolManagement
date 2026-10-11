import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class AssignClassDto {
  @ApiProperty({ description: 'Class ID to assign student to' })
  @IsUUID()
  classId: string;

  @ApiPropertyOptional({ description: 'Stream ID to assign student to' })
  @IsOptional()
  @IsUUID()
  streamId?: string;
}
