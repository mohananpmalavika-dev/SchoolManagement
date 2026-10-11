import { IsString, IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';

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
  bookingDate: string;

  @IsString()
  startTime: string; // HH:MM format

  @IsString()
  endTime: string; // HH:MM format

  @IsString()
  @IsOptional()
  purpose?: string;

  @IsString()
  @IsOptional()
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
  parentNotes?: string;
}
