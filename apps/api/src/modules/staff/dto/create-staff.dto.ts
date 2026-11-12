import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
} from 'class-validator';
import { Gender, StaffDepartment, EmploymentType, StaffStatus } from '@krypton/types';

export class CreateStaffDto {
  @ApiProperty({ description: 'Unique staff employee number' })
  @IsString()
  staffNumber: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Middle name' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ enum: Gender, description: 'Gender' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ description: 'Aadhaar last 4 digits', example: '4512' })
  @IsOptional()
  @IsString()
  aadhaarLast4?: string;

  @ApiPropertyOptional({ description: 'PAN Number (for TDS/Payroll)', example: 'ABCDE1234F' })
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Primary phone number' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Alternative phone number' })
  @IsOptional()
  @IsString()
  alternatePhone?: string;

  @ApiPropertyOptional({ description: 'Residential address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ enum: StaffDepartment, description: 'Department' })
  @IsEnum(StaffDepartment)
  department: StaffDepartment;

  @ApiProperty({ description: 'Designation / job title' })
  @IsString()
  position: string;

  @ApiProperty({ enum: EmploymentType, description: 'Employment contract type' })
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @ApiProperty({ description: 'Hire date (ISO string)' })
  @IsDateString()
  hireDate: string;

  @ApiPropertyOptional({ description: 'Whether the staff member is a teaching staff' })
  @IsOptional()
  @IsBoolean()
  isTeacher?: boolean;

  @ApiPropertyOptional({ description: 'Array of subject IDs the staff can teach' })
  @IsOptional()
  @IsArray()
  subjects?: string[];

  @ApiPropertyOptional({ enum: StaffStatus, description: 'Employment status' })
  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @ApiPropertyOptional({ description: 'Link to existing User account UUID' })
  @IsOptional()
  @IsString()
  userId?: string;
}
