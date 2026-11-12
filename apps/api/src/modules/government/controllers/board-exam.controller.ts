import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';
import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BoardExamService } from '../services/board-exam.service';
import {
  InitializeBoardDto,
  UpdateBoardConfigDto,
  RegisterCandidatesDto,
  DownloadResultsDto,
  GetExamTimetableDto,
  SubmitIrregularityReportDto,
  GetRegistrationsQueryDto,
  BoardRegistrationResponseDto,
  CandidateRegistrationResultDto,
  ResultsDownloadResultDto,
} from '../dto';

@ApiTags('Government - Indian Board Exam Integration (CBSE / ICSE / State Board)')
@ApiBearerAuth()
@Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
@Controller('government/board-exam')
export class BoardExamController {
  constructor(private readonly boardExamService: BoardExamService) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize Board Exam integration (CBSE/ICSE/State Board)' })
  @ApiResponse({ status: 201, description: 'Board Exam integration initialized' })
  async initialize(@Request() req: any, @Body() dto: InitializeBoardDto): Promise<any> {
    return this.boardExamService.initializeIntegration(
      req.user.tenantId,
      dto.affiliationNumber,
      dto.boardName || 'CBSE',
      dto.schoolCode,
      dto.apiKey,
      dto.apiSecret,
    );
  }

  @Get('integration')
  @ApiOperation({ summary: 'Get Board Exam integration settings' })
  async getIntegration(@Request() req: any): Promise<any> {
    return this.boardExamService.getIntegration(req.user.tenantId);
  }

  @Put('integration')
  @ApiOperation({ summary: 'Update Board Exam integration settings' })
  async updateIntegration(@Request() req: any, @Body() _dto: UpdateBoardConfigDto): Promise<any> {
    return this.boardExamService.getIntegration(req.user.tenantId);
  }

  @Post('register-candidates')
  @ApiOperation({ summary: 'Register candidates for Board Exam (LOC)' })
  @ApiResponse({ status: 200, type: CandidateRegistrationResultDto })
  async registerCandidates(
    @Request() req: any,
    @Body() dto: RegisterCandidatesDto,
  ): Promise<CandidateRegistrationResultDto> {
    return this.boardExamService.registerCandidates(
      req.user.tenantId,
      dto.examYear,
      dto.examSession,
      dto.examLevel,
      dto.studentIds,
    );
  }

  @Post('download-results')
  @ApiOperation({ summary: 'Download Board Exam results' })
  @ApiResponse({ status: 200, type: ResultsDownloadResultDto })
  async downloadResults(
    @Request() req: any,
    @Body() dto: DownloadResultsDto,
  ): Promise<ResultsDownloadResultDto> {
    return this.boardExamService.downloadResults(
      req.user.tenantId,
      dto.examYear,
      dto.examLevel,
    );
  }

  @Post('exam-timetable')
  @ApiOperation({ summary: 'Get Board Exam datesheet/timetable' })
  async getExamTimetable(@Request() req: any, @Body() dto: GetExamTimetableDto) {
    return this.boardExamService.getExamTimetable(
      req.user.tenantId,
      dto.examYear,
      dto.examLevel,
    );
  }

  @Get('registrations')
  @ApiOperation({ summary: 'Get all Board Exam candidate registrations' })
  @ApiResponse({ status: 200, type: [BoardRegistrationResponseDto] })
  async getRegistrations(@Request() req: any, @Query() query: GetRegistrationsQueryDto): Promise<any> {
    return this.boardExamService.getRegistrations(
      req.user.tenantId,
      query.examYear,
      query.examLevel,
      query.status,
    );
  }

  @Get('candidate/:candidateNumber/status')
  @ApiOperation({ summary: 'Get candidate registration status' })
  async getCandidateStatus(
    @Request() req: any,
    @Param('candidateNumber') candidateNumber: string,
  ) {
    return this.boardExamService.getCandidateStatus(req.user.tenantId, candidateNumber);
  }

  @Post('irregularity-report')
  @ApiOperation({ summary: 'Submit exam irregularity report to Board' })
  async submitIrregularityReport(@Request() req: any, @Body() dto: SubmitIrregularityReportDto) {
    return this.boardExamService.submitIrregularityReport(
      req.user.tenantId,
      dto.candidateNumber,
      dto.irregularityType,
      dto.description,
      dto.evidenceUrls,
    );
  }

  @Get('sync-history')
  @ApiOperation({ summary: 'Get Board Exam sync history' })
  async getSyncHistory(@Request() req: any, @Query('limit') limit?: number) {
    return this.boardExamService.getSyncHistory(req.user.tenantId, limit || 50);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get Board Exam registration statistics' })
  async getStatistics(@Request() req: any) {
    const registrations = await this.boardExamService.getRegistrations(req.user.tenantId);

    return {
      totalRegistrations: registrations.length,
      byExamLevel: registrations.reduce((acc: any, reg: any) => {
        acc[reg.examLevel] = (acc[reg.examLevel] || 0) + 1;
        return acc;
      }, {}),
      byStatus: registrations.reduce((acc: any, reg: any) => {
        acc[reg.registrationStatus] = (acc[reg.registrationStatus] || 0) + 1;
        return acc;
      }, {}),
      pendingPayment: registrations.filter((r: any) => !r.isPaid).length,
      resultsAvailable: registrations.filter((r: any) => r.resultsAvailable).length,
    };
  }
}
