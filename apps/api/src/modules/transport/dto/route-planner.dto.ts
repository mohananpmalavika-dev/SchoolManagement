import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSchoolLocationDto {
  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @IsOptional()
  @IsString()
  schoolNameMl?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  addressMl?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  pincode: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsString()
  @IsNotEmpty()
  campusGate: string;

  @IsString()
  @IsNotEmpty()
  morningReportingTime: string;

  @IsString()
  @IsNotEmpty()
  eveningDepartureTime: string;
}

export class RouteStopInputDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  nameMl?: string;

  @IsNumber()
  sequence: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  scheduledTime?: string;
}

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  nameMl?: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  vehicleRegistration: string;

  @IsString()
  @IsNotEmpty()
  vehicleModel: string;

  @IsString()
  @IsNotEmpty()
  driverName: string;

  @IsString()
  @IsNotEmpty()
  driverPhone: string;

  @IsNumber()
  @Min(1)
  totalCapacity: number;

  @IsString()
  direction: 'MORNING_PICKUP' | 'EVENING_DROPOFF';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopInputDto)
  stops: RouteStopInputDto[];
}

export class AutoGenerateRouteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  nameMl?: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  vehicleRegistration: string;

  @IsString()
  @IsNotEmpty()
  vehicleModel: string;

  @IsString()
  @IsNotEmpty()
  driverName: string;

  @IsString()
  @IsNotEmpty()
  driverPhone: string;

  @IsNumber()
  @Min(1)
  totalCapacity: number;

  @IsString()
  direction: 'MORNING_PICKUP' | 'EVENING_DROPOFF';

  @IsOptional()
  @IsString()
  corridorPresetId?: string;

  @ValidateNested()
  @Type(() => RouteStopInputDto)
  originStop: RouteStopInputDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopInputDto)
  intermediateStops?: RouteStopInputDto[];
}

