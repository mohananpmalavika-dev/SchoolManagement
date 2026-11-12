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
  @ApiProperty({ description: 'Guardian first name', example: 'Deepa' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Guardian last name', example: 'Nair' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ description: 'Guardian middle name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @ApiPropertyOptional({ description: 'Aadhaar last 4 digits', example: '4512' })
  @IsOptional()
  @IsString()
  @Matches(/^(\d{4}|X{4}-X{4}-\d{4})$/i, {
    message: 'Aadhaar must be last 4 digits or XXXX-XXXX-1234 format',
  })
  aadhaarLast4?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'deepa.nair@example.in',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Primary Indian mobile number',
    example: '+919847012345',
  })
  @IsString()
  @Matches(/^(\+?91|0)?[6-9]\d{9}$/, {
    message: 'Phone must be a valid Indian mobile number',
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
