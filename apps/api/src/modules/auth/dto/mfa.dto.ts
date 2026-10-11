import { IsString, Length, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyMfaTokenDto {
  @ApiProperty({
    description: 'TOTP token from authenticator app (6 digits) or backup code (8 characters)',
    example: '123456',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(8)
  token: string;
}

export class DisableMfaDto {
  @ApiProperty({
    description: 'Current password for confirmation',
    example: 'MySecurePassword123!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class RegenerateBackupCodesDto {
  @ApiProperty({
    description: 'TOTP token for verification',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  mfaToken: string;
}
