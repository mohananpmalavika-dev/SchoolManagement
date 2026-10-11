import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class LinkStudentDto {
  @ApiProperty({ description: 'Student ID to link' })
  @IsUUID()
  studentId: string;

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

  @ApiPropertyOptional({ description: 'Can pick up student', default: true })
  @IsOptional()
  @IsBoolean()
  canPickup?: boolean;

  @ApiPropertyOptional({ description: 'Receive updates', default: true })
  @IsOptional()
  @IsBoolean()
  receiveUpdates?: boolean;
}
