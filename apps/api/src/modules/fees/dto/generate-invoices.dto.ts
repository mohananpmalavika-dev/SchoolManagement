import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsDateString } from 'class-validator';

export class GenerateInvoicesDto {
  @ApiProperty({ description: 'Fee structure ID to generate invoices from' })
  @IsUUID()
  feeStructureId: string;

  @ApiPropertyOptional({ description: 'Class ID (if generating for specific class)' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ description: 'Stream ID (if generating for specific stream)' })
  @IsOptional()
  @IsUUID()
  streamId?: string;

  @ApiPropertyOptional({
    description: 'Due date for generated invoices',
    example: '2024-02-15',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
