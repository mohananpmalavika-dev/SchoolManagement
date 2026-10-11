import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsInt,
  Min,
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
  MinLength,
} from 'class-validator';
import { PaymentMethod } from '@krypton/types';

export class RecordPaymentDto {
  @ApiProperty({ description: 'Invoice ID to allocate payment to' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({
    description: 'Payment amount in minor units (cents)',
    example: 500000,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.MPESA,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Payment reference (M-Pesa code, receipt number, etc.)',
    example: 'QGH123XYZ',
  })
  @IsString()
  @MinLength(3)
  reference: string;

  @ApiPropertyOptional({
    description: 'Payment date (defaults to now)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
