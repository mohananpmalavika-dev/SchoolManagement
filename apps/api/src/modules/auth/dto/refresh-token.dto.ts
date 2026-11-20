import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token (optional when provided via HttpOnly cookie)',
    required: false,
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
