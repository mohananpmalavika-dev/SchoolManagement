import { IsString, IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from './create-booking.dto';

export class UpdateBookingDto {
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsString()
  @IsOptional()
  teacherNotes?: string;

  @IsString()
  @IsOptional()
  parentNotes?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  meetingLink?: string;
}

export class CancelBookingDto {
  @IsString()
  cancellationReason: string;
}
