import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@krypton/types';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TeacherAIService } from './teacher-ai.service';
import { ClassTermDto, GenerateQuizDto, GenerateRemarksDto, RiskReviewDto, SaveRemarkDto } from './dto/teacher-ai.dto';

@ApiTags('teacher-ai')
@ApiBearerAuth()
@Controller('teacher-ai')
@UseGuards(TenantGuard)
@Roles(UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.EXAM_OFFICER, UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL, UserRole.SCHOOL_ADMIN)
export class TeacherAIController {
  constructor(private readonly service: TeacherAIService) {}
  @Get('options') options(@CurrentUser() user: CurrentUserData) { return this.service.options(user); }
  @Get('roster') roster(@CurrentUser() user: CurrentUserData, @Query() dto: ClassTermDto) { return this.service.roster(user, dto); }
  @Post('remarks') @Throttle({ default: { limit: 12, ttl: 60000 } }) remarks(@CurrentUser() user: CurrentUserData, @Body() dto: GenerateRemarksDto) { return this.service.remarks(user, dto); }
  @Post('report-cards') prepare(@CurrentUser() user: CurrentUserData, @Body() dto: ClassTermDto) { return this.service.prepareReports(user, dto); }
  @Post('remarks/save') save(@CurrentUser() user: CurrentUserData, @Body() dto: SaveRemarkDto) { return this.service.saveRemark(user, dto); }
  @Post('quiz') @Throttle({ default: { limit: 8, ttl: 60000 } }) quiz(@CurrentUser() user: CurrentUserData, @Body() dto: GenerateQuizDto) { return this.service.quiz(user, dto); }
  @Post('risk-review') @Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.DEPUTY_PRINCIPAL, UserRole.SCHOOL_ADMIN)
  @Throttle({ default: { limit: 8, ttl: 60000 } }) risk(@CurrentUser() user: CurrentUserData, @Body() dto: RiskReviewDto) { return this.service.riskReview(user, dto); }
}
