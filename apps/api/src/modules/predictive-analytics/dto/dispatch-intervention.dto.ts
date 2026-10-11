import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export enum InterventionChannel {
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  INTERNAL_NOTE = 'INTERNAL_NOTE',
}

export class DispatchInterventionDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(InterventionChannel)
  channel: InterventionChannel;

  @IsString()
  @IsOptional()
  customMessage?: string;

  @IsBoolean()
  @IsOptional()
  meetingRequested?: boolean;

  @IsString()
  @IsOptional()
  language?: string;
}
