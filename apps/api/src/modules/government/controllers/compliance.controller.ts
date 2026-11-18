import { UserRole } from '@krypton/types';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  Res,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { Roles } from '../../../common/decorators/roles.decorator';
import {
  GenerateReportDto,
  GetReportsQueryDto,
  ApproveReportDto,
  SubmitReportDto,
  CreateChecklistDto,
  CompleteChecklistDto,
  GetChecklistsQueryDto,
  RunDataAuditDto,
  CreateAlertDto,
  GetAlertsQueryDto,
  AcknowledgeAlertDto,
  ResolveAlertDto,
  ExportPortalDataDto,
  LogAuditRecordOverrideDto,
  ReportActionDto,
  ManualSubmissionDto,
  SubmissionOutcomeDto,
  ManualBoardRecordDto,
} from '../dto';
import { ComplianceService } from '../services/compliance.service';

@ApiTags('Government - School reporting and manual submissions')
@ApiBearerAuth()
@Roles(UserRole.SCHOOL_OWNER, UserRole.PRINCIPAL, UserRole.SCHOOL_ADMIN)
@Controller('government/compliance')
export class ComplianceController {
  constructor(private readonly service: ComplianceService) {}
  @Get('board-records') boardRecords(@Request() req: any) {
    return this.service.getManualBoardRecords(req.user.tenantId);
  }
  @Post('board-records') recordBoard(@Request() req: any, @Body() dto: ManualBoardRecordDto) {
    return this.service.recordManualBoard(req.user.tenantId, req.user.userId, dto);
  }
  @Get('options') options(@Request() req: any) {
    return this.service.options(req.user.tenantId);
  }
  @Post('reports/generate') generateReport(@Request() req: any, @Body() dto: GenerateReportDto) {
    return this.service.generateReport(req.user.tenantId, dto, req.user.userId);
  }
  @Get('reports') getReports(@Request() req: any, @Query() query: GetReportsQueryDto) {
    return this.service.getReports(req.user.tenantId, query.reportType, query.status);
  }
  @Get('reports/:reportId') getReport(@Request() req: any, @Param('reportId') id: string) {
    return this.service.getReport(req.user.tenantId, id);
  }
  @Post('reports/action') action(@Request() req: any, @Body() dto: ReportActionDto) {
    return this.service.action(
      req.user.tenantId,
      req.user.userId,
      dto.reportId,
      dto.action,
      dto.notes
    );
  }
  @Post('reports/approve') approveReport(@Request() req: any, @Body() dto: ApproveReportDto) {
    return this.service.approveReport(req.user.tenantId, dto.reportId, req.user.userId);
  }
  @Post('reports/submit') submitReport(@Request() req: any, @Body() dto: SubmitReportDto) {
    return this.service.submitReport(dto.reportId, req.user.userId);
  }
  @Post('reports/manual-submission') manualSubmission(
    @Request() req: any,
    @Body() dto: ManualSubmissionDto
  ) {
    return this.service.recordSubmission(req.user.tenantId, req.user.userId, dto);
  }
  @Post('reports/outcome') outcome(@Request() req: any, @Body() dto: SubmissionOutcomeDto) {
    return this.service.recordOutcome(req.user.tenantId, req.user.userId, dto);
  }
  @Get('reports/:reportId/validation') validation(
    @Request() req: any,
    @Param('reportId') id: string,
    @Query('templateId') templateId = 'SCHOOL_REPORT'
  ) {
    return this.service.validateExport(req.user.tenantId, id, templateId);
  }
  @Post('portal-export') exportPortalData(@Request() req: any, @Body() dto: ExportPortalDataDto) {
    return this.service.exportPortalData(req.user.tenantId, req.user.userId, dto);
  }
  @Get('downloads/:exportId') async download(
    @Request() req: any,
    @Param('exportId') id: string,
    @Res() res: Response
  ) {
    const file = await this.service.download(req.user.tenantId, id);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Length', file.content.length);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(file.content);
  }
  @Post('checklists') createChecklist(@Request() req: any, @Body() dto: CreateChecklistDto) {
    return this.service.createChecklist(
      req.user.tenantId,
      dto.title,
      dto.description || '',
      dto.complianceArea,
      dto.requiredBy,
      dto.frequency,
      dto.dueDate ? new Date(dto.dueDate) : undefined,
      req.user.userId
    );
  }
  @Get('checklists') getChecklists(@Request() req: any, @Query() query: GetChecklistsQueryDto) {
    return this.service.getChecklists(req.user.tenantId, query.complianceArea, query.status);
  }
  @Get('checklists/:checklistId') getChecklist(
    @Request() req: any,
    @Param('checklistId') id: string
  ) {
    return this.service.getChecklist(req.user.tenantId, id);
  }
  @Post('checklists/complete') completeChecklist(
    @Request() req: any,
    @Body() dto: CompleteChecklistDto
  ) {
    return this.service.completeChecklist(
      req.user.tenantId,
      dto.checklistId,
      req.user.userId,
      dto.evidence,
      dto.notes
    );
  }
  @Post('audits/run') runAudit(@Request() req: any, @Body() dto: RunDataAuditDto) {
    return this.service.runDataQualityAudit(req.user.tenantId, dto.auditType, req.user.userId);
  }
  @Get('audits') getAudits(
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number
  ) {
    return this.service.getAudits(req.user.tenantId, limit);
  }
  @Get('audits/:auditId') getAudit(@Request() req: any, @Param('auditId') id: string) {
    return this.service.getAudit(req.user.tenantId, id);
  }
  @Post('audits/:auditId/recheck') recheck(@Request() req: any, @Param('auditId') id: string) {
    return this.service.resolveAudit(req.user.tenantId, id, req.user.userId);
  }
  @Post('alerts') createAlert(@Request() req: any, @Body() dto: CreateAlertDto) {
    return this.service.createAlert(
      req.user.tenantId,
      dto.alertType,
      dto.severity,
      dto.title,
      dto.message,
      dto.relatedEntity,
      dto.relatedEntityId
    );
  }
  @Get('alerts') getAlerts(@Request() req: any, @Query() query: GetAlertsQueryDto) {
    return this.service.getAlerts(req.user.tenantId, query.status);
  }
  @Post('alerts/acknowledge') acknowledgeAlert(
    @Request() req: any,
    @Body() dto: AcknowledgeAlertDto
  ) {
    return this.service.acknowledgeAlert(req.user.tenantId, dto.alertId, req.user.userId);
  }
  @Post('alerts/resolve') resolveAlert(@Request() req: any, @Body() dto: ResolveAlertDto) {
    return this.service.resolveAlert(
      req.user.tenantId,
      dto.alertId,
      req.user.userId,
      dto.resolutionNotes
    );
  }
  @Post('deadlines/check') checkDeadlines(@Request() req: any) {
    return this.service.checkDeadlines(req.user.tenantId);
  }
  @Get('dashboard') getDashboard(@Request() req: any) {
    return this.service.dashboard(req.user.tenantId);
  }
  @Get('stats') getStatistics(@Request() req: any) {
    return this.service.dashboard(req.user.tenantId);
  }
  @Get('audit-trail') getAuditTrail(@Request() req: any, @Query('entityType') entityType?: string) {
    return this.service.getAuditTrail(req.user.tenantId, entityType);
  }
  @Post('audit-trail/verify') verifyAuditChain(@Request() req: any) {
    return this.service.verifyAuditChain(req.user.tenantId);
  }
  @Post('audit-trail/override') logOverrideRecord(
    @Request() req: any,
    @Body() dto: LogAuditRecordOverrideDto
  ) {
    return this.service.override(req.user.tenantId, req.user.userId, dto);
  }
}
