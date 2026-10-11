import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

export enum ReconciliationAction {
  MATCH = 'MATCH',
  UNMATCH = 'UNMATCH',
  MARK_DUPLICATE = 'MARK_DUPLICATE',
  REFUND = 'REFUND',
}

export enum ReconciliationStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  UNMATCHED = 'UNMATCHED',
  DUPLICATE = 'DUPLICATE',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export class ReconcileTransactionDto {
  @ApiProperty({ description: 'M-Pesa transaction ID' })
  @IsUUID()
  transactionId: string;

  @ApiProperty({
    description: 'Reconciliation action',
    enum: ReconciliationAction,
  })
  @IsEnum(ReconciliationAction)
  action: ReconciliationAction;

  @ApiPropertyOptional({ description: 'Invoice ID to match with' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Reconciliation notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryUnmatchedTransactionsDto {
  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsEnum(ReconciliationStatus)
  status?: ReconciliationStatus;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

export class ManualReconciliationDto {
  @ApiProperty({ description: 'M-Pesa transaction reference' })
  @IsString()
  mpesaReference: string;

  @ApiProperty({ description: 'Invoice ID to allocate payment to' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({
    description: 'Amount in minor units (cents)',
    minimum: 100,
  })
  @IsInt()
  @Min(100)
  amount: number;

  @ApiPropertyOptional({ description: 'Transaction date' })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({ description: 'Customer phone number' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
