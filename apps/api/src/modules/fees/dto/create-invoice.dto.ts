import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsString,
  IsDateString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FeeCategory } from '@krypton/types';

export class InvoiceItemDto {
  @ApiProperty({ description: 'Item description', example: 'Tuition Fee - Term 1' })
  @IsString()
  @MinLength(2)
  description: string;

  @ApiProperty({
    description: 'Amount in minor units (cents)',
    example: 1500000,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Fee category',
    enum: FeeCategory,
  })
  feeCategory: FeeCategory;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Student ID' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ description: 'Term ID' })
  @IsUUID()
  termId: string;

  @ApiProperty({
    description: 'Invoice items',
    type: [InvoiceItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiPropertyOptional({
    description: 'Due date for payment',
    example: '2024-02-15',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
