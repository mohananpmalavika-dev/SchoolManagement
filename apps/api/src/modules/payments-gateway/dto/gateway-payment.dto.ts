import { Transform as RawBoolean } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsInt,
  Min,
  Matches,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  IsArray,
} from 'class-validator';

export enum GatewayChoice {
  RAZORPAY = 'RAZORPAY',
  UPI = 'UPI',
}

export enum ReconciliationStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  UNMATCHED = 'UNMATCHED',
  FAILED = 'FAILED',
}

export enum ReconciliationAction {
  AUTO_MATCH = 'AUTO_MATCH',
  MANUAL_MATCH = 'MANUAL_MATCH',
  MARK_DISPUTED = 'MARK_DISPUTED',
}

export class InitiatePaymentDto {
  @ApiProperty({ description: 'Invoice ID to pay for' })
  @IsUUID()
  invoiceId: string;

  @ApiPropertyOptional({
    description: 'Payment gateway choice (RAZORPAY or UPI)',
    enum: GatewayChoice,
    default: GatewayChoice.RAZORPAY,
  })
  @IsOptional()
  @IsEnum(GatewayChoice)
  gateway?: GatewayChoice;

  @ApiPropertyOptional({
    description: 'Indian mobile number (10 digits or +91/91XXXXXXXXXX)',
    example: '+919847012345',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\+?91|0)?[6-9]\d{9}$/, {
    message: 'Phone number must be a valid Indian mobile number',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Payer UPI Virtual Payment Address (for UPI collect/intent)',
    example: 'parent@okhdfcbank',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/, {
    message: 'Enter a valid UPI ID (e.g., name@okhdfcbank)',
  })
  upiVpa?: string;

  @ApiProperty({
    description: 'Amount to pay in minor units (paise, e.g., 500000 = INR 5,000)',
    example: 500000,
    minimum: 100,
  })
  @IsInt()
  @Min(100) // Minimum INR 1.00
  amount: number;

  @ApiPropertyOptional({ description: 'Account reference (defaults to invoice number)' })
  @IsOptional()
  @IsString()
  accountReference?: string;

  @ApiPropertyOptional({
    description: 'Transaction description',
    default: 'School Fee Payment',
  })
  @IsOptional()
  @IsString()
  transactionDesc?: string;
}

export class PaymentOrderResponseDto {
  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  gatewayOrderId: string;

  @ApiProperty()
  gateway: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  razorpayKeyId?: string;

  @ApiPropertyOptional()
  upiIntentUri?: string;

  @ApiProperty()
  invoiceId: string;

  @ApiProperty()
  customerMessage: string;
}

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Razorpay Order ID' })
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({ description: 'Razorpay Payment ID' })
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({ description: 'HMAC-SHA256 signature from Razorpay Checkout' })
  @IsString()
  razorpaySignature: string;

  @ApiPropertyOptional({ description: 'UPI UTR / RRN reference if paid via UPI' })
  @IsOptional()
  @IsString()
  utrNumber?: string;
}

export class PaymentWebhookDto {
  @IsOptional()
  @IsString()
  entity?: string;

  @IsOptional()
  @IsString()
  account_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contains?: string[];

  @IsOptional()
  @IsInt()
  created_at?: number;

  @ApiProperty()
  @IsString()
  event: string;

  @ApiProperty()
  @IsObject()
  payload: Record<string, any>;
}

export class QueryGatewayStatusDto {
  @ApiProperty({ description: 'Gateway Order ID' })
  @IsString()
  gatewayOrderId: string;
}

export class QueryUnmatchedTransactionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @RawBoolean(({ obj, key }) => obj[key] === 'true' ? true : obj[key] === 'false' ? false : obj[key])
  @IsBoolean()
  isReconciled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class ManualReconciliationDto {
  @ApiProperty()
  @IsUUID()
  transactionId: string;

  @ApiProperty()
  @IsUUID()
  invoiceId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

