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
import { UdiseService } from '../services/udise.service';
import {
  InitializeUdiseDto,
  UpdateUdiseConfigDto,
  ValidateStudentDto,
  SyncResultDto,
  ValidationResultDto,
} from '../dto';

@ApiTags('Government - UDISE+ & APAAR Integration (India)')
@ApiBearerAuth()
@Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
@Controller('government/udise')
export class UdiseController {
  constructor(private readonly udiseService: UdiseService) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize UDISE+ integration' })
  @ApiResponse({ status: 201, description: 'UDISE+ integration initialized successfully' })
  async initialize(@Request() req: any, @Body() dto: InitializeUdiseDto): Promise<any> {
    return this.udiseService.initializeIntegration(
      req.user.tenantId,
      dto.udiseSchoolCode,
      dto.apiKey,
      dto.apiSecret,
    );
  }

  @Get('integration')
  @ApiOperation({ summary: 'Get UDISE+ integration settings' })
  async getIntegration(@Request() req: any): Promise<any> {
    return this.udiseService.getIntegration(req.user.tenantId);
  }

  @Put('integration')
  @ApiOperation({ summary: 'Update UDISE+ integration settings' })
  async updateIntegration(@Request() req: any, @Body() _dto: UpdateUdiseConfigDto): Promise<any> {
    return this.udiseService.getIntegration(req.user.tenantId);
  }

  @Post('sync/students')
  @ApiOperation({ summary: 'Sync student enrollment data to UDISE+ SDMIS' })
  @ApiResponse({ status: 200, description: 'Student sync completed', type: SyncResultDto })
  async syncStudents(@Request() req: any): Promise<SyncResultDto> {
    return this.udiseService.syncStudentEnrollment(req.user.tenantId);
  }

  @Post('sync/teachers')
  @ApiOperation({ summary: 'Sync teacher registry data to UDISE+' })
  @ApiResponse({ status: 200, description: 'Teacher sync completed', type: SyncResultDto })
  async syncTeachers(@Request() req: any): Promise<SyncResultDto> {
    return this.udiseService.syncTeacherData(req.user.tenantId);
  }

  @Post('sync/school-profile')
  @ApiOperation({ summary: 'Sync school profile to UDISE+' })
  async syncSchoolProfile(@Request() req: any) {
    return this.udiseService.syncSchoolProfile(req.user.tenantId);
  }

  @Post('sync/attendance')
  @ApiOperation({ summary: 'Sync attendance data to UDISE+' })
  async syncAttendance(
    @Request() req: any,
    @Body() dto: { startDate: string; endDate: string },
  ) {
    return this.udiseService.syncAttendanceData(
      req.user.tenantId,
      new Date(dto.startDate),
      new Date(dto.endDate),
    );
  }

  @Post('sync/full')
  @ApiOperation({ summary: 'Perform full UDISE+ sync' })
  async performFullSync(@Request() req: any) {
    return this.udiseService.performFullSync(req.user.tenantId);
  }

  @Post('validate/student')
  @ApiOperation({ summary: 'Validate student data against UDISE+ / APAAR requirements' })
  @ApiResponse({ status: 200, description: 'Validation completed', type: ValidationResultDto })
  async validateStudent(@Body() dto: ValidateStudentDto): Promise<ValidationResultDto> {
    return this.udiseService.validateStudentData(dto.studentId);
  }

  @Get('sync-history')
  @ApiOperation({ summary: 'Get UDISE+ sync history' })
  async getSyncHistory(@Request() req: any, @Query('limit') limit?: number) {
    return this.udiseService.getSyncHistory(req.user.tenantId, limit || 50);
  }

  @Get('students/:studentId/udise-record')
  @ApiOperation({ summary: 'Get UDISE+ / APAAR record for a student' })
  async getStudentUdiseRecord(@Param('studentId') studentId: string) {
    return this.udiseService.validateStudentData(studentId);
  }
}
