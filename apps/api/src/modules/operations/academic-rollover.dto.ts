import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, IsUUID, Matches, ValidateNested } from 'class-validator';

export enum PromotionAction { PROMOTE = 'PROMOTE', RETAIN = 'RETAIN', GRADUATE = 'GRADUATE' }

export class PromotionDecisionDto {
  @IsUUID() studentId: string;
  @IsEnum(PromotionAction) action: PromotionAction;
  @IsOptional() @IsUUID() classId?: string;
  @IsOptional() @IsUUID() streamId?: string;
}

export class RolloverPlanDto {
  @IsUUID() sourceYearId: string;
  @IsUUID() targetYearId: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(5000)
  @ValidateNested({ each: true }) @Type(() => PromotionDecisionDto)
  decisions: PromotionDecisionDto[];
}

export class CompleteRolloverDto extends RolloverPlanDto {
  @IsString() @Matches(/^[a-f0-9]{64}$/) previewToken: string;
}
