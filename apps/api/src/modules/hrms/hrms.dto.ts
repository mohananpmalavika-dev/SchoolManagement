import { Type, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class HrEmployeeQuery {
  @IsOptional() @IsUUID() employeeId?: string;
}
export class HrPeriodQuery extends HrEmployeeQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(2000) @Max(2200) year?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12) month?: number;
}
export class HrPunchDto extends HrEmployeeQuery {
  @IsIn(['CHECK_IN', 'CHECK_OUT', 'BREAK_OUT', 'BREAK_IN']) punchType: string;
}
export class HrLeaveDto extends HrEmployeeQuery {
  @IsUUID() leaveTypeId: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) startDate: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) endDate: string;
  @IsOptional()
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 1 })
  @Min(0.5)
  @Max(366)
  numberOfDays?: number;
  @IsOptional() @Transform(({ obj, key }) => obj[key]) @IsBoolean() isHalfDay?: boolean;
  @IsOptional() @IsIn(['AM', 'PM']) halfDaySession?: string;
  @IsString() @MinLength(3) @MaxLength(2000) reason: string;
  @IsOptional() @Matches(/^https:\/\//) @MaxLength(2000) documentUrl?: string;
}
export class HrLeaveBalanceQuery extends HrEmployeeQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(2000) @Max(2200) year?: number;
}
export class HrLeaveAccrualDto extends HrEmployeeQuery {
  @IsInt() @Min(2000) @Max(2200) year: number;
}
export class HrLeaveDocumentDto {
  @IsString() @MaxLength(2000) documentUrl: string;
}
export class HrLeaveDocumentReviewDto {
  @IsIn(['VERIFIED', 'REJECTED']) status: 'VERIFIED' | 'REJECTED';
  @IsString() @MinLength(3) @MaxLength(2000) remarks: string;
}
export class HrReviewDto {
  @IsIn(['APPROVED', 'REJECTED']) status: 'APPROVED' | 'REJECTED';
  @IsOptional() @IsString() @MaxLength(2000) reviewerRemarks?: string;
}
export class HrCancelLeaveDto {
  @IsString() @MinLength(5) @MaxLength(2000) reason: string;
}
export class HrPayrollDto {
  @IsInt() @Min(2000) @Max(2200) year: number;
  @IsInt() @Min(1) @Max(12) month: number;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(31)
  @ArrayUnique()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { each: true })
  workingDates: string[];
}
export class HrOfferDto {
  @IsOptional() @IsUUID() candidateId?: string;
  @IsString() @MinLength(2) @MaxLength(150) candidateName: string;
  @IsEmail() @MaxLength(255) candidateEmail: string;
  @IsString() @MinLength(5) @MaxLength(30) candidatePhone: string;
  @IsString() @MinLength(2) @MaxLength(150) designationTitle: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) joiningDate: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(10000000) offeredCtcMonthly: number;
  @IsUUID() departmentId: string;
  @IsUUID() structureId: string;
  @IsIn([
    'TEACHING',
    'ADMINISTRATION',
    'FINANCE',
    'LIBRARY',
    'TRANSPORT',
    'MAINTENANCE',
    'SECURITY',
    'IT',
    'OTHER',
  ])
  schoolDepartment: string;
  @IsIn([
    'TEACHER',
    'CLASS_TEACHER',
    'ACCOUNTANT',
    'LIBRARIAN',
    'TRANSPORT_OFFICER',
    'RECEPTIONIST',
    'SCHOOL_ADMIN',
  ])
  accountRole: string;
}
export class HrJoiningAccountDto {
  @IsString() @MinLength(1) @MaxLength(100) firstName: string;
  @IsString() @MinLength(1) @MaxLength(100) lastName: string;
  @IsString() @IsStrongPassword({ minLength: 12 }) @MaxLength(128) password: string;
}
export class HrConvertOfferDto {
  @IsOptional() @IsUUID() userId?: string;
  @IsOptional() @ValidateNested() @Type(() => HrJoiningAccountDto) newAccount?: HrJoiningAccountDto;
}
export class HrAccountDto {
  @IsEmail() @MaxLength(255) email: string;
  @IsString() @MinLength(1) @MaxLength(100) firstName: string;
  @IsString() @MinLength(1) @MaxLength(100) lastName: string;
  @IsIn([
    'TEACHER',
    'CLASS_TEACHER',
    'ACCOUNTANT',
    'LIBRARIAN',
    'TRANSPORT_OFFICER',
    'RECEPTIONIST',
    'SCHOOL_ADMIN',
  ])
  role: string;
  @IsString() @IsStrongPassword({ minLength: 12 }) @MaxLength(128) password: string;
}
export class HrTaskDto {
  @Transform(({ obj, key }) => obj[key]) @IsBoolean() isCompleted: boolean;
}
export class HrResignationDto extends HrEmployeeQuery {
  @IsString() @MinLength(3) @MaxLength(2000) reason: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) preferredExitDate: string;
}
export class HrExitReviewDto extends HrReviewDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  approvedExitDate?: string;
}
export class HrClearanceDto {
  @IsIn(['CLEARED', 'DUES_PENDING']) status: 'CLEARED' | 'DUES_PENDING';
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(10000000) duesAmount: number;
  @IsOptional() @IsString() @MaxLength(2000) remarks?: string;
}
export class HrSettlementDto {
  @IsNumber({ maxDecimalPlaces: 1 }) @Min(0) @Max(31) workingDaysInFinalMonth: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(10000000) earnedSalary: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(10000000) leaveEncashmentAmount: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(10000000) noticePayRecovery: number;
}
export class HrCompleteExitDto {
  @IsString() @MinLength(3) @MaxLength(80) referenceNumber: string;
  @IsUUID() preparationId: string;
}
export class HrRelievingDto extends HrCompleteExitDto {
  @IsUUID() resignationId: string;
}
export class HrMasterDto {
  @IsObject() data: Record<string, unknown>;
}
export class HrEmployeeSetupDto {
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsUUID() designationId?: string;
  @IsOptional() @IsUUID() gradeId?: string;
}
export class HrShiftAssignmentDto {
  @IsUUID() shiftId: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) effectiveFrom: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  effectiveTo?: string;
}
export class HrEndShiftDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) effectiveTo: string;
}
export class HrAttendanceDto {
  @IsUUID() employeeId: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) date: string;
  @IsIn(['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT']) status:
    'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT';
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) timeIn?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) timeOut?: string;
  @IsOptional() @IsInt() @Min(0) @Max(720) breakMinutes?: number;
  @IsString() @MinLength(5) @MaxLength(2000) reason: string;
}
export class HrStatutoryDto {
  @Transform(({ obj, key }) => obj[key]) @IsBoolean() pfApplicable: boolean;
  @Transform(({ obj, key }) => obj[key]) @IsBoolean() esiApplicable: boolean;
  @IsOptional() @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/) panNumber?: string | null;
  @IsOptional() @Matches(/^[0-9]{12}$/) uanNumber?: string | null;
  @IsOptional() @Matches(/^[A-Za-z0-9/\-]{3,50}$/) pfNumber?: string | null;
  @IsOptional() @Matches(/^[0-9]{10,17}$/) esiNumber?: string | null;
}
export class HrSalaryAssignmentDto {
  @IsUUID() structureId: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) effectiveFrom: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(10000000) baseMonthlySalary: number;
}
export class HrStructureLineDto {
  @IsUUID() componentId: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(10000000) amount: number;
}
export class HrStructureDto {
  @IsString() @MinLength(2) @MaxLength(120) name: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => HrStructureLineDto)
  components: HrStructureLineDto[];
}
