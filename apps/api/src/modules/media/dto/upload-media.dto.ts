import { IsString, IsEnum, IsOptional, IsBoolean, IsUUID, IsDateString } from 'class-validator';

export enum MediaType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

export class UploadMediaDto {
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsUUID()
  @IsOptional()
  activityFeedId?: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsDateString()
  @IsOptional()
  takenAt?: string;

  @IsBoolean()
  @IsOptional()
  isVisibleToParents?: boolean = true;
}
