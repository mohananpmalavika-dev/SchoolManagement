import { 
  Controller, 
  Post, 
  Get, 
  Put,
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { KnecService } from '../services/knec.service';
import {
  InitializeKnecDto,
  UpdateKnecConfigDto,
  RegisterCandidatesDto,
  DownloadResultsDto,
  GetExamTimetableDto,
  SubmitIrregularityReportDto,
  GetRegistrationsQueryDto,
  KnecIntegrationResponseDto,
  KnecRegistrationResponseDto,
  CandidateRegistrationResultDto,
  ResultsDownloadResultDto,
} from '../dto';

@ApiTags('Government - KNEC Integration')
@ApiBearerAuth()
@Controller('government/knec')
export class KnecController {
  constructor(private readonly knecService: KnecService) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize KNEC integration' })
  @ApiResponse({ status: 201, description: 'KNEC integration initialized successfully' })
  async initialize(
    @Request() req: any,
    @Body() dto: InitializeKnecDto,
  ): Promise<KnecIntegrationResponseDto> {
    const tenantId = req.user.tenantId;
    return this.knecService.initializeIntegration(
      tenantId,
      dto.knecCentreNumber,
      dto.apiKey,
      dto.apiSecret,
    );
  }

  @Get('integration')
  @ApiOperation({ summary: 'Get KNEC integration settings' })
  @ApiResponse({ status: 200, description: 'Integration settings retrieved' })
  async getIntegration(@Request() req: any): Promise<KnecIntegrationResponseDto> {
    const tenantId = req.user.tenantId;
    return this.knecService.getIntegration(tenantId);
  }

  @Put('integration')
  @ApiOperation({ summary: 'Update KNEC integration settings' })
  @ApiResponse({ status: 200, description: 'Integration settings updated' })
  async updateIntegration(
    @Request() req: any,
    @Body() dto: UpdateKnecConfigDto,
  ): Promise<KnecIntegrationResponseDto> {
    const tenantId = req.user.tenantId;
    // Update logic would go here
    return this.knecService.getIntegration(tenantId);
  }

  @Post('register-candidates')
  @ApiOperation({ summary: 'Register candidates for KNEC examination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Candidates registered successfully',
    type: CandidateRegistrationResultDto,
  })
  async registerCandidates(
    @Request() req: any,
    @Body() dto: RegisterCandidatesDto,
  ): Promise<CandidateRegistrationResultDto> {
    const tenantId = req.user.tenantId;
    return this.knecService.registerCandidates(
      tenantId,
      dto.examYear,
      dto.examSession,
      dto.examLevel,
      dto.studentIds,
    );
  }

  @Post('download-results')
  @ApiOperation({ summary: 'Download examination results from KNEC' })
  @ApiResponse({ 
    status: 200, 
    description: 'Results downloaded successfully',
    type: ResultsDownloadResultDto,
  })
  async downloadResults(
    @Request() req: any,
    @Body() dto: DownloadResultsDto,
  ): Promise<ResultsDownloadResultDto> {
    const tenantId = req.user.tenantId;
    return this.knecService.downloadResults(
      tenantId,
      dto.examYear,
      dto.examLevel,
    );
  }

  @Post('exam-timetable')
  @ApiOperation({ summary: 'Get examination timetable from KNEC' })
  @ApiResponse({ status: 200, description: 'Timetable retrieved successfully' })
  async getExamTimetable(
    @Request() req: any,
    @Body() dto: GetExamTimetableDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.knecService.getExamTimetable(
      tenantId,
      dto.examYear,
      dto.examLevel,
    );
  }

  @Get('registrations')
  @ApiOperation({ summary: 'Get all candidate registrations' })
  @ApiResponse({ 
    status: 200, 
    description: 'Registrations retrieved',
    type: [KnecRegistrationResponseDto],
  })
  async getRegistrations(
    @Request() req: any,
    @Query() query: GetRegistrationsQueryDto,
  ): Promise<KnecRegistrationResponseDto[]> {
    const tenantId = req.user.tenantId;
    return this.knecService.getRegistrations(
      tenantId,
      query.examYear,
      query.examLevel,
    );
  }

  @Get('registrations/:registrationId')
  @ApiOperation({ summary: 'Get specific candidate registration' })
  @ApiResponse({ status: 200, description: 'Registration retrieved' })
  async getRegistration(
    @Request() req: any,
    @Param('registrationId') registrationId: string,
  ) {
    // Implementation would fetch from database
    return { message: 'Not implemented yet' };
  }

  @Get('candidate/:candidateNumber/status')
  @ApiOperation({ summary: 'Get candidate registration status from KNEC' })
  @ApiResponse({ status: 200, description: 'Candidate status retrieved' })
  async getCandidateStatus(
    @Request() req: any,
    @Param('candidateNumber') candidateNumber: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.knecService.getCandidateStatus(tenantId, candidateNumber);
  }

  @Post('irregularity-report')
  @ApiOperation({ summary: 'Submit exam irregularity report to KNEC' })
  @ApiResponse({ status: 200, description: 'Irregularity report submitted' })
  async submitIrregularityReport(
    @Request() req: any,
    @Body() dto: SubmitIrregularityReportDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.knecService.submitIrregularityReport(
      tenantId,
      dto.candidateNumber,
      dto.irregularityType,
      dto.description,
      dto.evidenceUrls,
    );
  }

  @Get('sync-history')
  @ApiOperation({ summary: 'Get KNEC sync history' })
  @ApiResponse({ status: 200, description: 'Sync history retrieved' })
  async getSyncHistory(
    @Request() req: any,
    @Query('limit') limit?: number,
  ) {
    const tenantId = req.user.tenantId;
    return this.knecService.getSyncHistory(tenantId, limit || 50);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get KNEC registration statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics(@Request() req: any) {
    const tenantId = req.user.tenantId;
    const registrations = await this.knecService.getRegistrations(tenantId);
    
    const stats = {
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

    return stats;
  }
}
