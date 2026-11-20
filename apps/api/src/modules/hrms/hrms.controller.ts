import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { HrmsService } from './hrms.service';
import { HrScopeGuard } from './hrms-scope.guard';
import {
  HrCandidateDto,
  HrCandidateStageDto,
  HrInterviewDto,
  HrInterviewReviewDto,
  HrOfferDecisionDto,
  HrVacancyDto,
} from './hrms-recruitment.dto';
import { HrActor, hrManagerRoles, hrPayrollRoles, hrStaffRoles } from './hrms.policy';
import {
  HrAccountDto,
  HrAttendanceDto,
  HrEndShiftDto,
  HrClearanceDto,
  HrCompleteExitDto,
  HrCancelLeaveDto,
  HrConvertOfferDto,
  HrEmployeeSetupDto,
  HrExitReviewDto,
  HrLeaveDto,
  HrLeaveBalanceQuery,
  HrLeaveAccrualDto,
  HrLeaveDocumentDto,
  HrLeaveDocumentReviewDto,
  HrMasterDto,
  HrOfferDto,
  HrPayrollDto,
  HrPeriodQuery,
  HrPunchDto,
  HrRelievingDto,
  HrResignationDto,
  HrReviewDto,
  HrSalaryAssignmentDto,
  HrSettlementDto,
  HrShiftAssignmentDto,
  HrStructureDto,
  HrTaskDto,
  HrStatutoryDto,
} from './hrms.dto';

type Req = { user: HrActor };
@ApiTags('hrms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, HrScopeGuard)
@Roles(...hrStaffRoles)
@Controller('hrms')
export class HrmsController {
  constructor(private service: HrmsService) {}
  @Get('recruitment') @Roles(...hrManagerRoles) recruitment(@Request() r: Req) {
    return this.service.recruitment(r.user);
  }
  @Post('recruitment/vacancies') @Roles(...hrManagerRoles) vacancy(
    @Request() r: Req,
    @Body() dto: HrVacancyDto
  ) {
    return this.service.saveVacancy(r.user, dto);
  }
  @Patch('recruitment/vacancies/:id') @Roles(...hrManagerRoles) editVacancy(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrVacancyDto
  ) {
    return this.service.saveVacancy(r.user, dto, id);
  }
  @Post('recruitment/candidates') @Roles(...hrManagerRoles) candidate(
    @Request() r: Req,
    @Body() dto: HrCandidateDto
  ) {
    return this.service.saveCandidate(r.user, dto);
  }
  @Patch('recruitment/candidates/:id') @Roles(...hrManagerRoles) editCandidate(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrCandidateDto
  ) {
    return this.service.saveCandidate(r.user, dto, id);
  }
  @Patch('recruitment/candidates/:id/stage') @Roles(...hrManagerRoles) candidateStage(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrCandidateStageDto
  ) {
    return this.service.candidateStage(r.user, id, dto);
  }
  @Post('recruitment/candidates/:id/interviews') @Roles(...hrManagerRoles) interview(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrInterviewDto
  ) {
    return this.service.scheduleInterview(r.user, id, dto);
  }
  @Patch('recruitment/candidates/:candidateId/interviews/:id')
  @Roles(...hrManagerRoles)
  rescheduleInterview(
    @Request() r: Req,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrInterviewDto
  ) {
    return this.service.scheduleInterview(r.user, candidateId, dto, id);
  }
  @Patch('recruitment/interviews/:id/review') @Roles(...hrManagerRoles) interviewReview(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrInterviewReviewDto
  ) {
    return this.service.reviewInterview(r.user, id, dto);
  }
  @Patch('onboarding/offers/:id/decision') @Roles(...hrManagerRoles) offerDecision(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrOfferDecisionDto
  ) {
    return this.service.offerDecision(r.user, id, dto);
  }
  @Post('salary-assignments/:id/withdraw') @Roles(...hrPayrollRoles) withdrawSalary(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrCancelLeaveDto
  ) {
    return this.service.withdrawSalary(r.user, id, dto.reason);
  }
  @Post('accounts') @Roles(...hrManagerRoles) account(
    @Request() r: Req,
    @Body() dto: HrAccountDto
  ) {
    return this.service.createAccount(r.user, dto);
  }
  @Get('overview') @Roles(...hrManagerRoles) overview(@Request() r: Req) {
    return this.service.getHrmsOverview(r.user);
  }
  @Get('employees') @Roles(...hrPayrollRoles) employees(@Request() r: Req) {
    return this.service.listEmployees(r.user);
  }
  @Get('employees/me') profile(@Request() r: Req) {
    return this.service.profile(r.user);
  }
  @Post('employees/sync') @Roles(...hrManagerRoles) sync(@Request() r: Req) {
    return this.service.syncStaff(r.user);
  }
  @Get('employees/:id') employee(@Request() r: Req, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.getEmployeeById(r.user, id);
  }
  @Patch('employees/:id') @Roles(...hrManagerRoles) configure(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrEmployeeSetupDto
  ) {
    return this.service.configureEmployee(r.user, id, dto);
  }
  @Post('employees/:id/shifts') @Roles(...hrManagerRoles) assignShift(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrShiftAssignmentDto
  ) {
    return this.service.assignShift(r.user, id, dto);
  }
  @Patch('shift-assignments/:id/end') @Roles(...hrManagerRoles) endShift(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrEndShiftDto
  ) {
    return this.service.endShift(r.user, id, dto.effectiveTo);
  }
  @Get('attendance') @Roles(...hrManagerRoles) attendance(
    @Request() r: Req,
    @Query('date') date: string
  ) {
    return this.service.attendance(r.user, date);
  }
  @Post('attendance/corrections') @Roles(...hrManagerRoles) correct(
    @Request() r: Req,
    @Body() dto: HrAttendanceDto
  ) {
    return this.service.correctAttendance(r.user, dto);
  }
  @Post('employees/:id/salary') @Roles(...hrPayrollRoles) salary(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrSalaryAssignmentDto
  ) {
    return this.service.assignSalary(r.user, id, dto);
  }
  @Get('employees/:id/statutory') @Roles(...hrPayrollRoles) statutory(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.service.statutoryProfile(r.user, id);
  }
  @Patch('employees/:id/statutory') @Roles(...hrPayrollRoles) saveStatutory(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrStatutoryDto
  ) {
    return this.service.saveStatutoryProfile(r.user, id, dto);
  }
  @Get('payroll/periods') @Roles(...hrPayrollRoles) periods(
    @Request() r: Req,
    @Query() q: HrPeriodQuery
  ) {
    return this.service.payrollPeriods(r.user, q);
  }
  @Post('payroll/runs/:id/discard') @Roles(...hrPayrollRoles) discard(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrCancelLeaveDto
  ) {
    return this.service.discardPayroll(r.user, id, dto.reason);
  }
  @Get('setup') @Roles(...hrPayrollRoles) setup(@Request() r: Req) {
    return this.service.setup(r.user);
  }
  @Get('payroll/structures') @Roles(...hrPayrollRoles) async structures(@Request() r: Req) {
    return (await this.service.setup(r.user)).structures;
  }
  @Post('masters/:resource') @Roles(...hrPayrollRoles) createMaster(
    @Request() r: Req,
    @Param('resource') resource: string,
    @Body() dto: HrMasterDto
  ) {
    return this.service.saveMaster(r.user, resource, dto.data);
  }
  @Patch('masters/:resource/:id') @Roles(...hrPayrollRoles) editMaster(
    @Request() r: Req,
    @Param('resource') resource: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrMasterDto
  ) {
    return this.service.saveMaster(r.user, resource, dto.data, id);
  }
  @Post('payroll/structures') @Roles(...hrPayrollRoles) structure(
    @Request() r: Req,
    @Body() dto: HrStructureDto
  ) {
    return this.service.saveStructure(r.user, dto);
  }
  @Get('shifts') shifts(@Request() r: Req) {
    return this.service.listShifts(r.user);
  }
  @Post('punch') @HttpCode(200) punch(@Request() r: Req, @Body() dto: HrPunchDto) {
    return this.service.recordPunch(r.user, dto);
  }
  @Get('punches/today') punches(@Request() r: Req) {
    return this.service.getTodayPunchLogs(r.user);
  }
  @Get('leaves/types') types(@Request() r: Req) {
    return this.service.listLeaveTypes(r.user);
  }
  @Get('leaves/balances') leaveBalances(@Request() r: Req, @Query() q: HrLeaveBalanceQuery) {
    return this.service.listLeaveBalances(r.user, q);
  }
  @Post('leaves/balances/accrue') @Roles(...hrManagerRoles) accrueLeave(
    @Request() r: Req,
    @Body() dto: HrLeaveAccrualDto
  ) {
    return this.service.accrueLeaveBalances(r.user, dto);
  }
  @Patch('leaves/requests/:id/document') leaveDocument(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrLeaveDocumentDto
  ) {
    return this.service.replaceLeaveDocument(r.user, id, dto.documentUrl);
  }
  @Patch('leaves/requests/:id/document-review') @Roles(...hrManagerRoles) verifyLeaveDocument(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrLeaveDocumentReviewDto
  ) {
    return this.service.reviewLeaveDocument(r.user, id, dto);
  }
  @Post('leaves/apply') leave(@Request() r: Req, @Body() dto: HrLeaveDto) {
    return this.service.submitLeaveRequest(r.user, dto);
  }
  @Get('leaves/requests') leaves(@Request() r: Req) {
    return this.service.listLeaveRequests(r.user);
  }
  @Post('leaves/requests/:id/cancel') cancelLeave(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrCancelLeaveDto
  ) {
    return this.service.cancelLeaveRequest(r.user, id, dto.reason);
  }
  @Patch('leaves/requests/:id/review') @Roles(...hrManagerRoles) reviewLeave(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrReviewDto
  ) {
    return this.service.reviewLeaveRequest(r.user, id, dto);
  }
  @Post('payroll/preview') @Roles(...hrPayrollRoles) preview(
    @Request() r: Req,
    @Body() dto: HrPayrollDto
  ) {
    return this.service.previewPayroll(r.user, dto);
  }
  @Post('payroll/generate') @Roles(...hrPayrollRoles) payroll(
    @Request() r: Req,
    @Body() dto: HrPayrollDto
  ) {
    return this.service.generateMonthlyPayroll(r.user, dto);
  }
  @Post('payroll/runs/:id/approve') @Roles(...hrManagerRoles) approve(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.service.approvePayroll(r.user, id);
  }
  @Get('payroll/payslips') slips(@Request() r: Req, @Query() q: HrPeriodQuery) {
    return this.service.listPayslips(r.user, q);
  }
  @Get('payroll/payslips/:id/download') async download(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response
  ) {
    const csv = await this.service.payslipCsv(r.user, id);
    res.type('text/csv').attachment('payslip.csv').send(csv);
  }
  @Get('onboarding/offers') @Roles(...hrManagerRoles) offers(@Request() r: Req) {
    return this.service.listJobOffers(r.user);
  }
  @Post('onboarding/offers') @Roles(...hrManagerRoles) offer(
    @Request() r: Req,
    @Body() dto: HrOfferDto
  ) {
    return this.service.createJobOffer(r.user, dto);
  }
  @Patch('onboarding/offers/:id') @Roles(...hrManagerRoles) editOffer(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrOfferDto
  ) {
    return this.service.createJobOffer(r.user, dto, id);
  }
  @Patch('onboarding/tasks/:id') @Roles(...hrManagerRoles) task(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrTaskDto
  ) {
    return this.service.completeTask(r.user, id, dto.isCompleted);
  }
  @Post('onboarding/offers/:id/convert') @Roles(...hrManagerRoles) convert(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrConvertOfferDto
  ) {
    return this.service.convertOfferToEmployee(r.user, id, dto);
  }
  @Post('exit/resignations') resign(@Request() r: Req, @Body() dto: HrResignationDto) {
    return this.service.submitResignation(r.user, dto);
  }
  @Get('exit/resignations') resignations(@Request() r: Req) {
    return this.service.listResignations(r.user);
  }
  @Patch('exit/resignations/:id/review') @Roles(...hrManagerRoles) reviewExit(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrExitReviewDto
  ) {
    return this.service.reviewResignation(r.user, id, dto);
  }
  @Patch('exit/clearance/:id') clearance(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrClearanceDto
  ) {
    return this.service.reviewClearance(r.user, id, dto);
  }
  @Post('exit/resignations/:id/settlement') @Roles(...hrPayrollRoles) settlement(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrSettlementDto
  ) {
    return this.service.settle(r.user, id, dto);
  }
  @Post('exit/resignations/:id/settlement/finalize') @Roles(...hrManagerRoles) finalize(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrCompleteExitDto
  ) {
    return this.service.finalizeSettlement(r.user, id, dto.referenceNumber, dto.preparationId);
  }
  @Post('exit/resignations/:id/complete') @Roles(...hrManagerRoles) completeExit(
    @Request() r: Req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HrCompleteExitDto
  ) {
    return this.service.completeExit(r.user, id, dto.referenceNumber, dto.preparationId);
  }
  @Post('exit/relieving-letter') @Roles(...hrManagerRoles) relieve(
    @Request() r: Req,
    @Body() dto: HrRelievingDto
  ) {
    return this.service.issueRelievingLetter(
      r.user,
      dto.resignationId,
      dto.referenceNumber,
      dto.preparationId
    );
  }
  @Get('exit/letters') letters(@Request() r: Req) {
    return this.service.letters(r.user);
  }
}
