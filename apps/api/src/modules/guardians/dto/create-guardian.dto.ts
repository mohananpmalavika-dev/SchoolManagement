import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
} from 'class-validator';

export class CreateGuardianDto {
  @ApiProperty({ description: 'Guardian first name', example: 'Mary' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Guardian last name', example: 'Wanjiku' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ description: 'Guardian middle name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @ApiPropertyOptional({ description: 'National ID number' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{7,8}$/, {
    message: 'National ID must be 7-8 digits',
  })
  nationalId?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'mary.wanjiku@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Primary phone number',
    example: '+254700123456',
  })
  @IsString()
  @Matches(/^(\+?254|0)?[17]\d{8}$/, {
    message: 'Phone must be a valid Kenyan number',
  })
  phone: string;

  @ApiPropertyOptional({
    description: 'Alternate phone number',
  })
  @IsOptional()
  @IsString()
  alternatePhone?: string;

  @ApiPropertyOptional({
    description: 'Physical address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Occupation',
    example: 'Teacher',
  })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({
    description: 'Employer name',
  })
  @IsOptional()
  @IsString()
  employer?: string;

  @ApiPropertyOptional({
    description: 'Is emergency contact',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isEmergencyContact?: boolean;
}
