import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsInt,
  Min,
  Matches,
  IsOptional,
  IsEnum,
} from 'class-validator';

export enum TransactionType {
  CustomerPayBillOnline = 'CustomerPayBillOnline',
  CustomerBuyGoodsOnline = 'CustomerBuyGoodsOnline',
}

export class InitiateSTKPushDto {
  @ApiProperty({
    description: 'Invoice ID to pay for',
    example: 'uuid',
  })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({
    description: 'Phone number in format 254XXXXXXXXX',
    example: '254712345678',
  })
  @IsString()
  @Matches(/^254\d{9}$/, {
    message: 'Phone number must be in format 254XXXXXXXXX',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Amount to pay in minor units (cents)',
    example: 500000,
    minimum: 100,
  })
  @IsInt()
  @Min(100) // Minimum KES 1.00
  amount: number;

  @ApiPropertyOptional({
    description: 'Account reference (defaults to invoice number)',
  })
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

export class STKPushResponseDto {
  @ApiProperty({ description: 'M-Pesa Checkout Request ID' })
  checkoutRequestId: string;

  @ApiProperty({ description: 'Merchant Request ID' })
  merchantRequestId: string;

  @ApiProperty({ description: 'Response code from M-Pesa' })
  responseCode: string;

  @ApiProperty({ description: 'Response description' })
  responseDescription: string;

  @ApiProperty({ description: 'Customer message' })
  customerMessage: string;

  @ApiProperty({ description: 'Invoice ID being paid' })
  invoiceId: string;

  @ApiProperty({ description: 'Payment amount in minor units' })
  amount: number;
}

export class STKPushCallbackDto {
  @ApiProperty()
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
  };
}

export class QuerySTKStatusDto {
  @ApiProperty({
    description: 'Checkout Request ID from STK Push initiation',
  })
  @IsString()
  checkoutRequestId: string;
}
