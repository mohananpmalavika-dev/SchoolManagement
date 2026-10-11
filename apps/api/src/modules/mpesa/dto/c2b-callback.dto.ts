import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class C2BCallbackDto {
  @ApiProperty({ description: 'Transaction type' })
  @IsString()
  TransactionType: string;

  @ApiProperty({ description: 'M-Pesa transaction ID' })
  @IsString()
  TransID: string;

  @ApiProperty({ description: 'Transaction timestamp' })
  @IsString()
  TransTime: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber()
  TransAmount: number;

  @ApiProperty({ description: 'Business short code' })
  @IsString()
  BusinessShortCode: string;

  @ApiProperty({ description: 'Bill reference number (invoice number)' })
  @IsString()
  BillRefNumber: string;

  @ApiProperty({ description: 'Invoice number' })
  @IsOptional()
  @IsString()
  InvoiceNumber?: string;

  @ApiProperty({ description: 'Organization account balance' })
  @IsOptional()
  @IsString()
  OrgAccountBalance?: string;

  @ApiProperty({ description: 'Third party transaction ID' })
  @IsOptional()
  @IsString()
  ThirdPartyTransID?: string;

  @ApiProperty({ description: 'Customer phone number' })
  @IsString()
  MSISDN: string;

  @ApiProperty({ description: 'Customer first name' })
  @IsOptional()
  @IsString()
  FirstName?: string;

  @ApiProperty({ description: 'Customer middle name' })
  @IsOptional()
  @IsString()
  MiddleName?: string;

  @ApiProperty({ description: 'Customer last name' })
  @IsOptional()
  @IsString()
  LastName?: string;
}

export class C2BValidationDto {
  @ApiProperty({ description: 'Transaction type' })
  TransactionType: string;

  @ApiProperty({ description: 'M-Pesa transaction ID' })
  TransID: string;

  @ApiProperty({ description: 'Transaction amount' })
  TransAmount: number;

  @ApiProperty({ description: 'Business short code' })
  BusinessShortCode: string;

  @ApiProperty({ description: 'Bill reference number' })
  BillRefNumber: string;

  @ApiProperty({ description: 'Customer phone number' })
  MSISDN: string;
}

export class C2BValidationResponseDto {
  @ApiProperty({ description: 'Result code (0 = Accept, non-zero = Reject)' })
  ResultCode: number;

  @ApiProperty({ description: 'Result description' })
  ResultDesc: string;

  @ApiProperty({ description: 'Third party transaction ID', required: false })
  ThirdPartyTransID?: string;
}

export class C2BConfirmationResponseDto {
  @ApiProperty({ description: 'Result code (0 = Success)' })
  ResultCode: number;

  @ApiProperty({ description: 'Result description' })
  ResultDesc: string;
}
