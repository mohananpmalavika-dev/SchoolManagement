import { Transform as RawBoolean } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsEnum,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FeeCategory } from '@krypton/types';

export class FeeItemDto {
  @ApiProperty({ description: 'Fee item name', example: 'Tuition Fee' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ description: 'Fee item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Amount in minor units (cents)',
    example: 1500000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Fee category',
    enum: FeeCategory,
    example: FeeCategory.TUITION,
  })
  @IsEnum(FeeCategory)
  feeCategory: FeeCategory;

  @ApiPropertyOptional({ description: 'Is this fee optional?', default: false })
  @IsOptional()
  @RawBoolean(({ obj, key }) => obj[key])
  @IsBoolean()
  isOptional?: boolean;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateFeeStructureDto {
  @ApiProperty({ description: 'Fee structure name', example: 'Grade 1 Term 1 Fees 2024' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({ description: 'Fee structure description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Term ID this fee structure applies to' })
  @IsUUID()
  termId: string;

  @ApiPropertyOptional({ description: 'Class ID (if specific to a class)' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiProperty({
    description: 'Fee items in this structure',
    type: [FeeItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeItemDto)
  feeItems: FeeItemDto[];
}
