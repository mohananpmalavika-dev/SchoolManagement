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
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NemisService } from '../services/nemis.service';
import {
  InitializeNemisDto,
  UpdateNemisConfigDto,
  SyncNemisDto,
  ValidateStudentDto,
  BulkSyncStudentsDto,
  NemisIntegrationResponseDto,
  SyncResultDto,
  ValidationResultDto,
} from '../dto';

@ApiTags('Government - NEMIS Integration')
@ApiBearerAuth()
@Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
@Controller('government/nemis')
export class NemisController {
  constructor(private readonly nemisService: NemisService) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize NEMIS integration' })
  @ApiResponse({ status: 201, description: 'NEMIS integration initialized successfully' })
  async initialize(
    @Request() req: any,
    @Body() dto: InitializeNemisDto,
  ): Promise<any> {
    const tenantId = req.user.tenantId;
    return this.nemisService.initializeIntegration(
      tenantId,
      dto.nemisSchoolCode,
      dto.apiKey,
      dto.apiSecret,
    );
  }

  @Get('integration')
  @ApiOperation({ summary: 'Get NEMIS integration settings' })
  @ApiResponse({ status: 200, description: 'Integration settings retrieved' })
  async getIntegration(@Request() req: any): Promise<any> {
    const tenantId = req.user.tenantId;
    return this.nemisService.getIntegration(tenantId);
  }

  @Put('integration')
  @ApiOperation({ summary: 'Update NEMIS integration settings' })
  @ApiResponse({ status: 200, description: 'Integration settings updated' })
  async updateIntegration(
    @Request() req: any,
    @Body() dto: UpdateNemisConfigDto,
  ): Promise<any> {
    const tenantId = req.user.tenantId;
    const integration = await this.nemisService.getIntegration(tenantId);
    
    // Update logic would go here
    return integration;
  }

  @Post('sync/students')
  @ApiOperation({ summary: 'Sync student enrollment data to NEMIS' })
  @ApiResponse({ status: 200, description: 'Student sync completed', type: SyncResultDto })
  async syncStudents(@Request() req: any): Promise<SyncResultDto> {
    const tenantId = req.user.tenantId;
    return this.nemisService.syncStudentEnrollment(tenantId);
  }

  @Post('sync/teachers')
  @ApiOperation({ summary: 'Sync teacher data to NEMIS' })
  @ApiResponse({ status: 200, description: 'Teacher sync completed', type: SyncResultDto })
  async syncTeachers(@Request() req: any): Promise<SyncResultDto> {
    const tenantId = req.user.tenantId;
    return this.nemisService.syncTeacherData(tenantId);
  }

  @Post('sync/school-profile')
  @ApiOperation({ summary: 'Sync school profile to NEMIS' })
  @ApiResponse({ status: 200, description: 'School profile sync completed' })
  async syncSchoolProfile(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.nemisService.syncSchoolProfile(tenantId);
  }

  @Post('sync/attendance')
  @ApiOperation({ summary: 'Sync attendance data to NEMIS' })
  @ApiResponse({ status: 200, description: 'Attendance sync completed' })
  async syncAttendance(
    @Request() req: any,
    @Body() dto: { startDate: string; endDate: string },
  ) {
    const tenantId = req.user.tenantId;
    return this.nemisService.syncAttendanceData(
      tenantId,
      new Date(dto.startDate),
      new Date(dto.endDate),
    );
  }

  @Post('sync/full')
  @ApiOperation({ summary: 'Perform full NEMIS sync (all data)' })
  @ApiResponse({ status: 200, description: 'Full sync completed' })
  async performFullSync(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.nemisService.performFullSync(tenantId);
  }

  @Post('validate/student')
  @ApiOperation({ summary: 'Validate student data against NEMIS requirements' })
  @ApiResponse({ status: 200, description: 'Validation completed', type: ValidationResultDto })
  async validateStudent(
    @Body() dto: ValidateStudentDto,
  ): Promise<ValidationResultDto> {
    return this.nemisService.validateStudentData(dto.studentId);
  }

  @Get('sync-history')
  @ApiOperation({ summary: 'Get NEMIS sync history' })
  @ApiResponse({ status: 200, description: 'Sync history retrieved' })
  async getSyncHistory(
    @Request() req: any,
    @Query('limit') limit?: number,
  ) {
    const tenantId = req.user.tenantId;
    return this.nemisService.getSyncHistory(tenantId, limit || 50);
  }

  @Get('students/:studentId/nemis-record')
  @ApiOperation({ summary: 'Get NEMIS record for a student' })
  @ApiResponse({ status: 200, description: 'NEMIS record retrieved' })
  async getStudentNemisRecord(
    @Request() req: any,
    @Param('studentId') studentId: string,
  ) {
    // Implementation would fetch from database
    return { message: 'Not implemented yet' };
  }

  @Get('staff/:staffId/nemis-record')
  @ApiOperation({ summary: 'Get NEMIS record for a staff member' })
  @ApiResponse({ status: 200, description: 'NEMIS record retrieved' })
  async getStaffNemisRecord(
    @Request() req: any,
    @Param('staffId') staffId: string,
  ) {
    // Implementation would fetch from database
    return { message: 'Not implemented yet' };
  }
}
