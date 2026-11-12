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

  @ApiProperty({ description: 'Guardian phone number', example: '+919847012345' })
  @IsString()
  @Matches(/^(\+?91|0)?[6-9]\d{9}$/, {
    message: 'Phone must be a valid Indian mobile number',
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

  @ApiProperty({ description: 'Student first name', example: 'Ananya' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'Student last name', example: 'Nair' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ description: 'Student middle name', example: 'K.' })
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
    description: 'Aadhaar last 4 digits (masked storage for student privacy)',
    example: '4512',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\d{4}|X{4}-X{4}-\d{4})$/i, {
    message: 'Aadhaar must be last 4 digits or XXXX-XXXX-1234 format',
  })
  aadhaarLast4?: string;

  @ApiPropertyOptional({
    description: '12-digit APAAR ID (One Nation One Student ID)',
    example: '910012345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{12}$/, {
    message: 'APAAR ID must be 12 digits',
  })
  apaarId?: string;

  @ApiPropertyOptional({
    description: 'UDISE+ Permanent Education Number (PEN)',
  })
  @IsOptional()
  @IsString()
  penNumber?: string;

  @ApiPropertyOptional({
    description: 'Birth certificate number',
  })
  @IsOptional()
  @IsString()
  birthCertNumber?: string;

  @ApiPropertyOptional({
    description: 'Student email address',
    example: 'ananya.nair@kryptonschool.edu.in',
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
    description: 'District',
    example: 'Ernakulam',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: 'Indian State / Union Territory',
    example: 'Kerala',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Indian 6-digit PIN Code',
    example: '682301',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[1-9]\d{5}$/, {
    message: 'PIN code must be 6 digits',
  })
  pincode?: string;

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
    example: '2026-04-06',
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
