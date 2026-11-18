import { IsBoolean, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class SchoolPaymentAccountDto {
  @IsString() @MaxLength(100)
  expectedAccountId: string;

  @IsString() @MinLength(2) @MaxLength(100)
  merchantName: string;

  @Transform(({ obj, key }) => obj[key])
  @IsBoolean()
  razorpayEnabled: boolean;

  @ValidateIf((_o, value) => value !== undefined)
  @IsString() @Matches(/^$|^rzp_(test|live)_[a-zA-Z0-9]{4,80}$/)
  razorpayKeyId?: string;

  @ValidateIf((_o, value) => value !== undefined)
  @IsString() @MinLength(8) @MaxLength(256)
  razorpayKeySecret?: string;

  @ValidateIf((_o, value) => value !== undefined)
  @IsString() @MinLength(8) @MaxLength(256)
  razorpayWebhookSecret?: string;

  @IsString() @Matches(/^$|^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/)
  upiVpa: string;
}

export class AssignInvoiceSchoolDto {
  @IsString() @MinLength(1) @MaxLength(100)
  invoiceNumber: string;
}

export class PaymentOptionsQueryDto {
  @IsString() @MinLength(1) @MaxLength(100)
  invoiceId: string;
}
