import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '@krypton/types';

class GuardianInfoDto {
  @ApiPropertyOptional({ description: 'Existing guardian ID (if linking existing guardian)' })
  @IsOptional()
  @IsUUID()
  guardianId?: string;

  @ApiProperty({ description: 'Guardian first name' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Guardian last name' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ description: 'Guardian middle name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @ApiProperty({ description: 'Guardian phone number' })
  @IsString()
  @Matches(/^(\+?254|0)?[17]\d{8}$/, {
    message: 'Phone must be a valid Kenyan number',
  })
  phone: string;

  @ApiPropertyOptional({ description: 'Guardian email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Relationship to student',
    enum: ['MOTHER', 'FATHER', 'GUARDIAN', 'GRANDPARENT', 'SIBLING', 'AUNT', 'UNCLE', 'OTHER'],
  })
  @IsEnum(['MOTHER', 'FATHER', 'GUARDIAN', 'GRANDPARENT', 'SIBLING', 'AUNT', 'UNCLE', 'OTHER'])
  relationship: string;

  @ApiPropertyOptional({ description: 'Is primary guardian', default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Guardian occupation' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({ description: 'Guardian address' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateStudentDto {
  @ApiProperty({
    description: 'Student admission number (unique per school)',
    example: 'STD001',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Admission number must contain only uppercase letters and numbers',
  })
  admissionNumber: string;

  @ApiProperty({ description: 'Student first name', example: 'Jane' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Student last name', example: 'Wanjiku' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ description: 'Student middle name', example: 'Njeri' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '2015-05-15',
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    description: 'Student gender',
    enum: Gender,
    example: Gender.FEMALE,
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({
    description: 'National ID number',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{7,8}$/, {
    message: 'National ID must be 7-8 digits',
  })
  nationalId?: string;

  @ApiPropertyOptional({
    description: 'Birth certificate number',
  })
  @IsOptional()
  @IsString()
  birthCertNumber?: string;

  @ApiPropertyOptional({
    description: 'Student email address',
    example: 'jane.wanjiku@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Student phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Student address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'County',
    example: 'Nairobi',
  })
  @IsOptional()
  @IsString()
  county?: string;

  @ApiPropertyOptional({
    description: 'Blood group',
    example: 'O+',
  })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({
    description: 'Known allergies',
  })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiPropertyOptional({
    description: 'Medical conditions',
  })
  @IsOptional()
  @IsString()
  medicalConditions?: string;

  @ApiPropertyOptional({
    description: 'Class ID to assign student to',
  })
  @IsOptional()
  @IsUUID()
  currentClassId?: string;

  @ApiPropertyOptional({
    description: 'Stream ID to assign student to',
  })
  @IsOptional()
  @IsUUID()
  currentStreamId?: string;

  @ApiProperty({
    description: 'Admission date',
    example: '2024-01-08',
  })
  @IsDateString()
  admissionDate: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Guardian information (at least one required)',
    type: [GuardianInfoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianInfoDto)
  guardians: GuardianInfoDto[];
}
