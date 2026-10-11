import { IsString, IsEnum, IsOptional, MaxLength, IsUrl } from 'class-validator';
import { BookingStatus } from './create-booking.dto';

export class UpdateBookingDto {
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
  teacherNotes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
  parentNotes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  location?: string;

  @IsString()
  @IsOptional()
  @IsUrl({protocols:['https'],require_protocol:true})
  @MaxLength(2048)
  meetingLink?: string;
}

export class CancelBookingDto {
  @IsString()
  @MaxLength(1000)
  cancellationReason: string;
}
