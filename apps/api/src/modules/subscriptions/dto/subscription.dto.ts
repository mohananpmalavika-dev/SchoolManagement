import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Tenant ID' })
  @IsUUID()
  tenantId: string;

  @ApiProperty({ description: 'Plan ID' })
  @IsUUID()
  planId: string;

  @ApiPropertyOptional({
    description: 'Start date (ISO 8601)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Auto-renew subscription',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'UPI',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: 'Plan ID (for upgrades/downgrades)' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({ description: 'Auto-renew setting' })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ description: 'Payment method' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class RenewSubscriptionDto {
  @ApiProperty({ description: 'Payment reference (Razorpay ID / UTR / receipt)' })
  @IsString()
  paymentReference: string;

  @ApiPropertyOptional({
    description: 'Payment amount in INR (minor units)',
    example: 4000000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Payment date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;
}

export class CancelSubscriptionDto {
  @ApiProperty({
    description: 'Cancellation reason',
    example: 'Switching to another system',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Cancel immediately or at period end',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean;
}

export class UpdateUsageDto {
  @ApiPropertyOptional({ description: 'Current student count' })
  @IsOptional()
  @IsInt()
  @Min(0)
  studentCount?: number;

  @ApiPropertyOptional({ description: 'Current staff count' })
  @IsOptional()
  @IsInt()
  @Min(0)
  staffCount?: number;

  @ApiPropertyOptional({ description: 'Storage used in MB' })
  @IsOptional()
  @IsInt()
  @Min(0)
  storageUsedMB?: number;

  @ApiPropertyOptional({ description: 'Remaining SMS credits' })
  @IsOptional()
  @IsInt()
  @Min(0)
  smsCredits?: number;
}

export class QuerySubscriptionsDto {
  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: SubscriptionStatus,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ description: 'Filter by plan ID' })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional({ description: 'Include expired' })
  @IsOptional()
  @IsBoolean()
  includeExpired?: boolean;
}
