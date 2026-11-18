import { Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

class PushKeysDto {
  @IsString() @MaxLength(100) p256dh: string;
  @IsString() @MaxLength(50) auth: string;
}
export class PushEndpointDto {
  @IsString() @MaxLength(2048) endpoint: string;
}
export class SavePushSubscriptionDto extends PushEndpointDto {
  @IsOptional() @IsInt() @Min(0) expirationTime?: number | null;
  @IsObject() @ValidateNested() @Type(() => PushKeysDto) keys: PushKeysDto;
}
