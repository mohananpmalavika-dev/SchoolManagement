import { IsString, IsEnum, IsOptional, IsUUID, IsDateString, MaxLength, Matches } from 'class-validator';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum MeetingType {
  IN_PERSON = 'IN_PERSON',
  VIRTUAL = 'VIRTUAL',
  PHONE = 'PHONE',
}

export class CreateBookingDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  teacherId: string;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  bookingDate: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string; // HH:MM format

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string; // HH:MM format

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  purpose?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  topic?: string;

  @IsEnum(MeetingType)
  @IsOptional()
  meetingType?: MeetingType = MeetingType.IN_PERSON;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  meetingLink?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  parentNotes?: string;
}
