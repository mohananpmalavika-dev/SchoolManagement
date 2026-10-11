import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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
import { AttendanceService } from './attendance.service';
import {
  BulkMarkAttendanceDto,
  MarkSingleAttendanceDto,
  UpdateAttendanceDto,
} from './dto/mark-attendance.dto';
import {
  QueryAttendanceDto,
  AttendanceSummaryDto,
  StudentAttendanceReportDto,
} from './dto/query-attendance.dto';
import {
  BulkMarkStaffAttendanceDto,
  MarkSingleStaffAttendanceDto,
  QueryStaffAttendanceDto,
} from './dto/staff-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@krypton/types';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ==================== STUDENT ATTENDANCE ====================

  @Post('students/bulk')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Mark attendance for multiple students (class/stream)' })
  @ApiResponse({ status: 201, description: 'Attendance marked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or students not in class' })
  @ApiResponse({ status: 409, description: 'Attendance already marked' })
  markBulkAttendance(
    @Body() dto: BulkMarkAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.markBulkAttendance(dto, user?.id);
  }

  @Post('students/single')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Mark attendance for a single student' })
  @ApiResponse({ status: 201, description: 'Attendance marked successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 409, description: 'Attendance already marked' })
  markSingleAttendance(
    @Body() dto: MarkSingleAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.markSingleAttendance(dto, user?.id);
  }

  @Patch('students/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
  )
  @ApiOperation({ summary: 'Update attendance record' })
  @ApiParam({ name: 'id', description: 'Attendance record ID' })
  @ApiResponse({ status: 200, description: 'Attendance updated successfully' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  updateAttendance(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.updateAttendance(id, dto, user?.id);
  }

  @Get('students')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
  )
  @ApiOperation({ summary: 'Query attendance records with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Attendance records retrieved' })
  queryAttendance(@Query() query: QueryAttendanceDto) {
    return this.attendanceService.queryAttendance(query);
  }

  @Get('students/summary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
  )
  @ApiOperation({ summary: 'Get attendance summary statistics' })
  @ApiResponse({ status: 200, description: 'Summary statistics retrieved' })
  getAttendanceSummary(@Query() query: AttendanceSummaryDto) {
    return this.attendanceService.getAttendanceSummary(query);
  }

  @Get('students/report')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Get detailed attendance report for a student' })
  @ApiResponse({ status: 200, description: 'Student attendance report retrieved' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getStudentReport(@Query() query: StudentAttendanceReportDto) {
    return this.attendanceService.getStudentAttendanceReport(query);
  }

  @Get('students/today')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.CLASS_TEACHER,
  )
  @ApiOperation({ summary: "Get today's attendance for a class/stream" })
  @ApiResponse({ status: 200, description: 'Today attendance retrieved' })
  getTodayAttendance(
    @Query('classId') classId?: string,
    @Query('streamId') streamId?: string,
  ) {
    return this.attendanceService.getTodayAttendance(classId, streamId);
  }

  // ==================== STAFF ATTENDANCE ====================

  @Post('staff/bulk')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Mark attendance for multiple staff members' })
  @ApiResponse({ status: 201, description: 'Staff attendance marked' })
  @ApiResponse({ status: 409, description: 'Attendance already marked' })
  markBulkStaffAttendance(
    @Body() dto: BulkMarkStaffAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.markBulkStaffAttendance(dto, user?.id);
  }

  @Post('staff/single')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Mark attendance for a single staff member' })
  @ApiResponse({ status: 201, description: 'Staff attendance marked' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  @ApiResponse({ status: 409, description: 'Attendance already marked' })
  markSingleStaffAttendance(
    @Body() dto: MarkSingleStaffAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.markSingleStaffAttendance(dto, user?.id);
  }

  @Get('staff')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Query staff attendance records' })
  @ApiResponse({ status: 200, description: 'Staff attendance records retrieved' })
  queryStaffAttendance(@Query() query: QueryStaffAttendanceDto) {
    return this.attendanceService.queryStaffAttendance(query);
  }

  @Get('staff/stats')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.DEPUTY_PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
  )
  @ApiOperation({ summary: 'Get staff attendance statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  getStaffAttendanceStats(@Query('staffId') staffId?: string) {
    return this.attendanceService.getStaffAttendanceStats(staffId);
  }
}
