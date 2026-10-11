import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateStudentDto } from './create-student.dto';
import { StudentStatus } from '@krypton/types';

export class UpdateStudentDto extends PartialType(
  OmitType(CreateStudentDto, ['admissionNumber', 'guardians'] as const)
) {
  @ApiPropertyOptional({
    description: 'Student status',
    enum: StudentStatus,
  })
  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;
}
