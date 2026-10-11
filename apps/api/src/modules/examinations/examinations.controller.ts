import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ExaminationsService } from './examinations.service';
import {
  CreateExaminationDto,
  UpdateExaminationDto,
} from './dto/create-examination.dto';
import {
  EnterGradeDto,
  BulkEnterGradesDto,
  UpdateGradeDto,
  QueryGradesDto,
} from './dto/marks-entry.dto';
import {
  GenerateReportCardDto,
  BulkGenerateReportCardsDto,
  UpdateReportCardDto,
  ApproveReportCardDto,
  QueryReportCardsDto,
} from './dto/report-card.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@krypton/types';

@ApiTags('examinations')
@ApiBearerAuth()
@Controller('examinations')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ExaminationsController {
  constructor(private readonly examinationsService: ExaminationsService) {}

  // ==================== EXAMINATIONS ====================

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.EXAMINATION_OFFICER,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new examination' })
  @ApiResponse({ status: 201, description: 'Examination created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Term, class, or subjects not found' })
  createExamination(
    @Body() dto: CreateExaminationDto,
    @CurrentUser() user: any,
  ) {
    return this.examinationsService.createExamination(dto, user?.id);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
    UserRole.EXAMINATION_OFFICER,
  )
  @ApiOperation({ summary: 'Get all examinations with optional filters' })
  @ApiResponse({ status: 200, description: 'Examinations retrieved successfully' })
  findAllExaminations(
    @Query('termId') termId?: string,
    @Query('classId') classId?: string,
    @Query('streamId') streamId?: string,
  ) {
    return this.examinationsService.findAllExaminations(termId, classId, streamId);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
    UserRole.EXAMINATION_OFFICER,
  )
  @ApiOperation({ summary: 'Get examination by ID with full details' })
  @ApiParam({ name: 'id', description: 'Examination ID' })
  @ApiResponse({ status: 200, description: 'Examination retrieved' })
  @ApiResponse({ status: 404, description: 'Examination not found' })
  findOneExamination(@Param('id') id: string) {
    return this.examinationsService.findOneExamination(id);
  }

  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.EXAMINATION_OFFICER,
  )
  @ApiOperation({ summary: 'Update examination details' })
  @ApiParam({ name: 'id', description: 'Examination ID' })
  @ApiResponse({ status: 200, description: 'Examination updated' })
  @ApiResponse({ status: 404, description: 'Examination not found' })
  updateExamination(
    @Param('id') id: string,
    @Body() dto: UpdateExaminationDto,
    @CurrentUser() user: any,
  ) {
    return this.examinationsService.updateExamination(id, dto, user?.id);
  }

  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete examination (only if no grades entered)' })
  @ApiParam({ name: 'id', description: 'Examination ID' })
  @ApiResponse({ status: 200, description: 'Examination deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete examination with grades' })
  @ApiResponse({ status: 404, description: 'Examination not found' })
  deleteExamination(@Param('id') id: string) {
    return this.examinationsService.deleteExamination(id);
  }

  @Get(':id/stats')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.EXAMINATION_OFFICER,
  )
  @ApiOperation({ summary: 'Get examination statistics and grade distribution' })
  @ApiParam({ name: 'id', description: 'Examination ID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  getExaminationStats(@Param('id') id: string) {
    return this.examinationsService.getExaminationStats(id);
  }

  // ==================== GRADES ====================

  @Post('grades')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
    UserRole.EXAMINATION_OFFICER,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enter grade for a single student' })
  @ApiResponse({ status: 201, description: 'Grade entered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or score exceeds total' })
  @ApiResponse({ status: 404, description: 'Student, examination, or subject not found' })
  @ApiResponse({ status: 409, description: 'Grade already exists' })
  enterGrade(@Body() dto: EnterGradeDto, @CurrentUser() user: any) {
    return this.examinationsService.enterGrade(dto, user?.id);
  }

  @Post('grades/bulk')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
    UserRole.EXAMINATION_OFFICER,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enter grades for multiple students (bulk)' })
  @ApiResponse({ status: 201, description: 'Grades entered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 409, description: 'Some grades already exist' })
  bulkEnterGrades(@Body() dto: BulkEnterGradesDto, @CurrentUser() user: any) {
    return this.examinationsService.bulkEnterGrades(dto, user?.id);
  }

  @Patch('grades/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
    UserRole.EXAMINATION_OFFICER,
  )
  @ApiOperation({ summary: 'Update existing grade' })
  @ApiParam({ name: 'id', description: 'Grade ID' })
  @ApiResponse({ status: 200, description: 'Grade updated' })
  @ApiResponse({ status: 404, description: 'Grade not found' })
  updateGrade(
    @Param('id') id: string,
    @Body() dto: UpdateGradeDto,
    @CurrentUser() user: any,
  ) {
    return this.examinationsService.updateGrade(id, dto, user?.id);
  }

  @Get('grades/query')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
    UserRole.EXAMINATION_OFFICER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  @ApiOperation({ summary: 'Query grades with filters' })
  @ApiResponse({ status: 200, description: 'Grades retrieved' })
  queryGrades(@Query() query: QueryGradesDto) {
    return this.examinationsService.queryGrades(query);
  }

  // ==================== REPORT CARDS ====================

  @Post('report-cards')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.EXAMINATION_OFFICER,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate report card for a student' })
  @ApiResponse({ status: 201, description: 'Report card generated' })
  @ApiResponse({ status: 400, description: 'No grades found for student in term' })
  @ApiResponse({ status: 404, description: 'Student or term not found' })
  @ApiResponse({ status: 409, description: 'Report card already exists' })
  generateReportCard(
    @Body() dto: GenerateReportCardDto,
    @CurrentUser() user: any,
  ) {
    return this.examinationsService.generateReportCard(dto, user?.id);
  }

  @Post('report-cards/bulk')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.EXAMINATION_OFFICER,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate report cards for entire class/stream' })
  @ApiResponse({ status: 201, description: 'Report cards generated' })
  @ApiResponse({ status: 400, description: 'No students found' })
  bulkGenerateReportCards(
    @Body() dto: BulkGenerateReportCardsDto,
    @CurrentUser() user: any,
  ) {
    return this.examinationsService.bulkGenerateReportCards(dto, user?.id);
  }

  @Get('report-cards')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.EXAMINATION_OFFICER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  @ApiOperation({ summary: 'Get all report cards with filters' })
  @ApiResponse({ status: 200, description: 'Report cards retrieved' })
  findAllReportCards(@Query() query: QueryReportCardsDto) {
    return this.examinationsService.findAllReportCards(query);
  }

  @Get('report-cards/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
    UserRole.EXAMINATION_OFFICER,
    UserRole.PARENT,
    UserRole.STUDENT,
  )
  @ApiOperation({ summary: 'Get report card by ID with grades' })
  @ApiParam({ name: 'id', description: 'Report card ID' })
  @ApiResponse({ status: 200, description: 'Report card retrieved' })
  @ApiResponse({ status: 404, description: 'Report card not found' })
  findOneReportCard(@Param('id') id: string) {
    return this.examinationsService.findOneReportCard(id);
  }

  @Patch('report-cards/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.CLASS_TEACHER,
  )
  @ApiOperation({ summary: 'Update report card comments and status' })
  @ApiParam({ name: 'id', description: 'Report card ID' })
  @ApiResponse({ status: 200, description: 'Report card updated' })
  @ApiResponse({ status: 404, description: 'Report card not found' })
  updateReportCard(
    @Param('id') id: string,
    @Body() dto: UpdateReportCardDto,
    @CurrentUser() user: any,
  ) {
    return this.examinationsService.updateReportCard(id, dto, user?.id);
  }

  @Post('report-cards/approve')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve report card for publishing' })
  @ApiResponse({ status: 200, description: 'Report card approved' })
  @ApiResponse({ status: 400, description: 'Report card already published' })
  @ApiResponse({ status: 404, description: 'Report card not found' })
  approveReportCard(
    @Body() dto: ApproveReportCardDto,
    @CurrentUser() user: any,
  ) {
    return this.examinationsService.approveReportCard(dto, user?.id);
  }
}
