import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';

export class StartTripDto {
  @IsString()
  @IsNotEmpty()
  routeId: string;

  @IsOptional()
  @IsString()
  direction?: 'MORNING_PICKUP' | 'EVENING_DROPOFF';

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  driverPhone?: string;

  @IsOptional()
  @IsString()
  vehicleRegistration?: string;
}

export class LocationPingDto {
  @IsString()
  @IsNotEmpty()
  tripId: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(250)
  speed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  heading?: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsString()
  timestamp?: string;
}

export class UpdateStudentStatusDto {
  @IsString()
  @IsNotEmpty()
  tripId: string;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsOptional()
  @IsString()
  stopId?: string;

  @IsString()
  @IsNotEmpty()
  status: 'WAITING' | 'BOARDED' | 'DROPPED' | 'ABSENT';
}

export class EndTripDto {
  @IsString()
  @IsNotEmpty()
  tripId: string;
}
