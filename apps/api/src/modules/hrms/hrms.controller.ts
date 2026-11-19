import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';
import { HrmsService } from './hrms.service';

@ApiTags('hrms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('hrms')
export class HrmsController {
  constructor(private readonly hrmsService: HrmsService) {}

  // 1. Overview
  @Get('overview')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  @ApiOperation({ summary: 'Get HRMS workforce and attendance summary' })
  getOverview(@Request() req: any) {
    return this.hrmsService.getHrmsOverview(req.user.tenantId);
  }

  // 2. Staff Directory
  @Get('employees')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  listEmployees(@Request() req: any) {
    return this.hrmsService.listEmployees(req.user.tenantId);
  }

  @Get('employees/me')
  getMyEmployeeProfile(@Request() req: any) {
    return this.hrmsService.getEmployeeByUserId(req.user.tenantId, req.user.userId);
  }

  @Get('employees/:id')
  getEmployee(@Request() req: any, @Param('id') id: string) {
    return this.hrmsService.getEmployeeById(req.user.tenantId, id);
  }

  // 3. Shifts & Punching
  @Get('shifts')
  listShifts(@Request() req: any) {
    return this.hrmsService.listShifts(req.user.tenantId);
  }

  @Post('shifts')
  @Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  createShift(@Request() req: any, @Body() body: any) {
    return this.hrmsService.createShift(req.user.tenantId, body);
  }

  @Post('punch')
  @HttpCode(HttpStatus.OK)
  async recordPunch(@Request() req: any, @Body() body: any) {
    // If employeeId is not provided, derive from authenticated user
    let employeeId = body.employeeId;
    if (!employeeId) {
      const emp = await this.hrmsService.getEmployeeByUserId(req.user.tenantId, req.user.userId);
      if (emp) employeeId = emp.id;
    }
    return this.hrmsService.recordPunch(req.user.tenantId, employeeId, body);
  }

  @Get('punches/today')
  getTodayPunches(@Request() req: any) {
    return this.hrmsService.getTodayPunchLogs(req.user.tenantId);
  }

  // 4. Leave Management
  @Get('leaves/types')
  listLeaveTypes(@Request() req: any) {
    return this.hrmsService.listLeaveTypes(req.user.tenantId);
  }

  @Post('leaves/apply')
  async applyLeave(@Request() req: any, @Body() body: any) {
    let employeeId = body.employeeId;
    if (!employeeId) {
      const emp = await this.hrmsService.getEmployeeByUserId(req.user.tenantId, req.user.userId);
      if (emp) employeeId = emp.id;
    }
    return this.hrmsService.submitLeaveRequest(req.user.tenantId, employeeId, body);
  }

  @Get('leaves/requests')
  listLeaveRequests(@Request() req: any, @Query('status') status?: string) {
    return this.hrmsService.listLeaveRequests(req.user.tenantId, status);
  }

  @Patch('leaves/requests/:id/review')
  @Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  reviewLeaveRequest(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; reviewerRemarks?: string },
  ) {
    return this.hrmsService.reviewLeaveRequest(req.user.tenantId, id, {
      ...body,
      reviewedBy: `${req.user.firstName} ${req.user.lastName}`,
    });
  }

  // 5. Payroll
  @Get('payroll/structures')
  listSalaryStructures(@Request() req: any) {
    return this.hrmsService.listSalaryStructures(req.user.tenantId);
  }

  @Post('payroll/generate')
  @Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.ACCOUNTANT)
  generatePayroll(@Request() req: any, @Body() body: { year: number; month: number }) {
    return this.hrmsService.generateMonthlyPayroll(
      req.user.tenantId,
      Number(body.year),
      Number(body.month),
    );
  }

  @Get('payroll/payslips')
  listPayslips(
    @Request() req: any,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.hrmsService.listPayslips(
      req.user.tenantId,
      year ? Number(year) : undefined,
      month ? Number(month) : undefined,
    );
  }

  // 6. Onboarding & Offers
  @Get('onboarding/offers')
  @Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  listOffers(@Request() req: any) {
    return this.hrmsService.listJobOffers(req.user.tenantId);
  }

  @Post('onboarding/offers')
  @Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  createOffer(@Request() req: any, @Body() body: any) {
    return this.hrmsService.createJobOffer(req.user.tenantId, body);
  }

  @Post('onboarding/offers/:id/convert')
  @Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  convertOffer(@Request() req: any, @Param('id') id: string) {
    return this.hrmsService.convertOfferToEmployee(req.user.tenantId, id);
  }

  // 7. Resignations & Exit
  @Post('exit/resignations')
  async submitResignation(@Request() req: any, @Body() body: any) {
    let employeeId = body.employeeId;
    if (!employeeId) {
      const emp = await this.hrmsService.getEmployeeByUserId(req.user.tenantId, req.user.userId);
      if (emp) employeeId = emp.id;
    }
    return this.hrmsService.submitResignation(req.user.tenantId, employeeId, body);
  }

  @Get('exit/resignations')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
  )
  listResignations(@Request() req: any) {
    return this.hrmsService.listResignations(req.user.tenantId);
  }

  @Patch('exit/clearance/:id')
  @Roles(
    UserRole.SCHOOL_OWNER,
    UserRole.PRINCIPAL,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.LIBRARIAN,
  )
  updateClearance(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: 'CLEARED' | 'DUES_PENDING'; duesAmount?: number; remarks?: string },
  ) {
    return this.hrmsService.reviewClearance(req.user.tenantId, id, {
      ...body,
      clearedBy: `${req.user.firstName} ${req.user.lastName}`,
    });
  }

  @Post('exit/relieving-letter')
  @Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
  issueRelievingLetter(@Request() req: any, @Body() body: any) {
    return this.hrmsService.issueRelievingLetter(req.user.tenantId, body.employeeId, {
      referenceNumber: body.referenceNumber || `REL-${Date.now()}`,
      content: body.content,
      issuedBy: `${req.user.firstName} ${req.user.lastName} (Principal)`,
    });
  }
}
