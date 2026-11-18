import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const contentKinds = [
  'LESSON_PLAN',
  'ACTIVITY',
  'STORY',
  'RHYME',
  'FLASHCARDS',
  'COLOURING',
  'WORKSHEET',
  'GAME',
  'OBSERVATION_SHEET',
] as const;
export const domains = [
  'LANGUAGE',
  'COGNITIVE',
  'FINE_MOTOR',
  'GROSS_MOTOR',
  'SOCIAL_EMOTIONAL',
  'SELF_CARE',
  'CREATIVE',
] as const;
export class SchoolProgrammeDto {
  @IsOptional() @IsIn(['STANDARD', 'PRESCHOOL', 'COMBINED']) programme?: 'STANDARD' | 'PRESCHOOL' | 'COMBINED';
  @IsOptional() @IsIn(['OPTIONAL', 'REQUIRED']) pickupVerification?: 'OPTIONAL' | 'REQUIRED';
}
export class PreschoolClassDto {
  @IsIn(['PLAYGROUP', 'NURSERY', 'LKG', 'UKG']) stage: 'PLAYGROUP' | 'NURSERY' | 'LKG' | 'UKG';
}
export class PreschoolAssignmentDto {
  @IsUUID() classId: string;
  @IsUUID() staffId: string;
  @Transform(({ obj, key }) => obj[key]) @IsBoolean() assigned: boolean;
}
export class PreschoolQueryDto {
  @IsOptional() @IsUUID() classId?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) from?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) to?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) offset?: number;
}
export class CheckInDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) time?: string;
}
export class CheckOutDto {
  @IsOptional() @IsUUID() guardianId?: string;
  @Transform(({ obj, key }) => obj[key]) @IsBoolean() identityVerified: boolean;
  @IsOptional() @IsString() @Matches(/^\d{6}$/) pickupOtp?: string;
  @IsOptional() @IsString() @MinLength(16) @MaxLength(256) pickupQrToken?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) time?: string;
}
export class UndoDayActionDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
}
export class CorrectDayTimesDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
  @IsInt() @Min(0) version: number;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) checkInTime?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) checkOutTime?: string;
  @IsOptional() @IsUUID() pickupGuardianId?: string;
}
export class PickupPassDto {
  @IsOptional() @IsUUID() guardianId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(5) @Max(120) ttlMinutes?: number;
}
export class PickupPermissionDto {
  @Transform(({ obj, key }) => obj[key]) @IsBoolean() canPickup: boolean;
}
export class CareRecordDto {
  @IsInt() @Min(0) version: number;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
  @IsOptional() @IsString() @MaxLength(2000) meals?: string;
  @IsOptional() @IsInt() @Min(0) @Max(720) sleepMinutes?: number | null;
  @IsOptional() @IsIn(['NOT_RECORDED', 'INDEPENDENT', 'ASSISTED', 'CHANGED']) toileting?: string;
  @IsOptional() @IsIn(['HAPPY', 'SETTLED', 'TIRED', 'UPSET', 'NOT_RECORDED']) mood?: string;
  @IsOptional() @IsString() @MaxLength(5000) notes?: string;
  @Transform(({ obj, key }) => obj[key]) @IsBoolean() shareWithParents: boolean;
}
export class BulkCheckInDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  studentIds?: string[];
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) time?: string;
}
export class MarkAbsentDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
  @IsOptional() @IsString() @MaxLength(500) remarks?: string;
}
export class BulkMarkAbsentDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  studentIds?: string[];
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
  @IsOptional() @IsString() @MaxLength(500) remarks?: string;
}
export class BulkCareRecordDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  studentIds?: string[];
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) date?: string;
  @IsOptional() @Transform(({ obj, key }) => obj[key]) @IsBoolean() checkedInOnly?: boolean;
  @IsOptional() @IsString() @MaxLength(2000) meals?: string;
  @IsOptional() @IsInt() @Min(0) @Max(720) sleepMinutes?: number | null;
  @IsOptional() @IsIn(['NOT_RECORDED', 'INDEPENDENT', 'ASSISTED', 'CHANGED']) toileting?: string;
  @IsOptional() @IsIn(['HAPPY', 'SETTLED', 'TIRED', 'UPSET', 'NOT_RECORDED']) mood?: string;
  @IsOptional() @IsString() @MaxLength(5000) notes?: string;
  @Transform(({ obj, key }) => obj[key]) @IsBoolean() shareWithParents: boolean;
}
export class ObservationDto {
  @IsUUID() studentId: string;
  @IsIn(domains) domain: (typeof domains)[number];
  @IsIn(['EMERGING', 'DEVELOPING', 'CONSISTENT']) level: 'EMERGING' | 'DEVELOPING' | 'CONSISTENT';
  @IsString() @MinLength(2) @MaxLength(200) skill: string;
  @IsString() @MinLength(5) @MaxLength(5000) observation: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) observedOn: string;
  @Transform(({ obj, key }) => obj[key]) @IsBoolean() shared: boolean;
}
export class UpdateObservationDto {
  @IsIn(domains) domain: (typeof domains)[number];
  @IsIn(['EMERGING', 'DEVELOPING', 'CONSISTENT']) level: 'EMERGING' | 'DEVELOPING' | 'CONSISTENT';
  @IsString() @MinLength(2) @MaxLength(200) skill: string;
  @IsString() @MinLength(5) @MaxLength(5000) observation: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) observedOn: string;
  @Transform(({ obj, key }) => obj[key]) @IsBoolean() shared: boolean;
}
export class GeneratePreschoolDto {
  @IsUUID() classId: string;
  @IsIn(contentKinds) kind: (typeof contentKinds)[number];
  @IsString() @MinLength(2) @MaxLength(120) theme: string;
  @IsIn(['English', 'Malayalam', 'Hindi']) language: string;
  @IsInt() @Min(18) @Max(84) ageMinMonths: number;
  @IsInt() @Min(18) @Max(84) ageMaxMonths: number;
  @IsInt() @Min(5) @Max(60) durationMinutes: number;
}
export class SavePreschoolContentDto extends GeneratePreschoolDto {
  @IsString() @MinLength(2) @MaxLength(200) title: string;
  @IsString() @MinLength(10) @MaxLength(20000) body: string;
  @IsString() @MaxLength(3000) materials: string;
  @IsString() @MinLength(2) @MaxLength(3000) learningGoals: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) scheduledOn?: string;
}
export class UpdatePreschoolContentDto extends SavePreschoolContentDto {
  @IsInt() @Min(1) version: number;
}
export class PublishPreschoolContentDto {
  @IsInt() @Min(1) version: number;
  @Transform(({ obj, key }) => obj[key]) @IsBoolean() reviewed: boolean;
}
export class CameraGatewayStreamDto {
  @IsIn(['hikvision', 'dahua', 'cpplus', 'rtsp', 'push'])
  vendor: 'hikvision' | 'dahua' | 'cpplus' | 'rtsp' | 'push';
  @IsOptional() @IsIn(['pull', 'push']) mode?: 'pull' | 'push';
  @IsOptional() @IsString() @MaxLength(255) host?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(65535) port?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(256) channel?: number;
  @IsOptional() @IsIn(['sub', 'main']) stream?: 'sub' | 'main';
  @IsOptional() @IsString() @MaxLength(120) username?: string;
  @IsOptional() @IsString() @MaxLength(200) password?: string;
  @IsOptional() @IsString() @MaxLength(500) rtspUrl?: string;
  @IsOptional() @IsString() @MaxLength(200) rtspPath?: string;
  @IsOptional() @IsIn(['tcp', 'udp']) rtspTransport?: 'tcp' | 'udp';
  @IsOptional() @Transform(({ obj, key }) => obj[key]) @IsBoolean() tls?: boolean;
  @IsOptional() @Transform(({ obj, key }) => obj[key]) @IsBoolean() sourceOnDemand?: boolean;
  @IsOptional() @IsString() @MaxLength(200) publishSecret?: string;
}
export class CameraDto {
  @IsUUID() classId: string;
  @IsString() @MinLength(2) @MaxLength(120) label: string;
  @IsString() @Matches(/^[A-Za-z0-9_-]{1,100}$/) externalCameraRef: string;
  @Transform(({ obj, key }) => obj[key]) @IsBoolean() enabled: boolean;
  @Transform(({ obj, key }) => obj[key]) @IsBoolean() parentAccess: boolean;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays: number[];
  @IsInt() @Min(0) @Max(1439) startMinute: number;
  @IsInt() @Min(1) @Max(1440) endMinute: number;
  @IsOptional()
  @ValidateNested()
  @Type(() => CameraGatewayStreamDto)
  gatewayStream?: CameraGatewayStreamDto;
}
export class CameraConsentDto {
  @Transform(({ obj, key }) => obj[key]) @IsBoolean() consent: boolean;
}
export class PreschoolPhotoDto {
  @IsString() @MaxLength(1000) caption: string;
}
export class PreschoolCopilotHistoryItemDto {
  @IsIn(['user', 'assistant']) role: 'user' | 'assistant';
  @IsString() @MinLength(1) @MaxLength(3000) content: string;
}
export class PreschoolCopilotDto {
  @IsUUID() classId: string;
  @IsIn(['English', 'Malayalam', 'Hindi']) language: string;
  @IsString() @MinLength(5) @MaxLength(1000) question: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => PreschoolCopilotHistoryItemDto)
  history?: PreschoolCopilotHistoryItemDto[];
}
