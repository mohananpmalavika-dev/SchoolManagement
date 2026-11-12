import { Controller, Get, Post, Patch, Body, Param, Query, Request } from '@nestjs/common';
import { IsObject, IsArray, ArrayMinSize, ArrayMaxSize, ValidateNested, IsUUID, IsDateString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@krypton/types';
import { WorkspaceService } from './workspace.service';
import { InitiatePaymentDto } from '../payments-gateway/dto/gateway-payment.dto';

class RecordDto { @IsObject() data: Record<string, unknown>; }
class AttendanceItem { @IsUUID() studentId: string; @IsEnum(AttendanceStatus) status: AttendanceStatus; }
class RegisterDto { @IsUUID() classId: string; @IsDateString() date: string; @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => AttendanceItem) records: AttendanceItem[]; }
class MarkItem { @IsUUID() studentId: string; @IsInt() @Min(0) @Max(1000) score: number; }
class MarksDto { @IsUUID() examinationId: string; @IsUUID() subjectId: string; @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => MarkItem) records: MarkItem[]; }

@Controller('workspace')
export class WorkspaceController {
  constructor(private service: WorkspaceService) {}
  @Get('overview') overview(@Request() req: any) { return this.service.overview(req.user); }
  @Get('children') children(@Request() req: any) { return this.service.children(req.user); }
  @Get('student/:id') student(@Request() req: any, @Param('id') id: string) { return this.service.studentData(req.user, id); }
  @Get('notifications') notifications(@Request() req: any) { return this.service.notifications(req.user); }
  @Post('notifications/:id/read') read(@Request() req: any, @Param('id') id: string) { return this.service.readNotification(req.user, id); }
  @Post('pay') pay(@Request() req: any, @Body() dto: InitiatePaymentDto) { return this.service.pay(req.user, dto); }
  @Get('register') register(@Request() req: any, @Query('classId') id: string, @Query('date') date: string) { return this.service.register(req.user, id, date); }
  @Post('register') save(@Request() req: any, @Body() dto: RegisterDto) { return this.service.saveRegister(req.user, dto); }
  @Get('gradebook') gradebook(@Request() req: any, @Query('examinationId') id: string, @Query('subjectId') subject: string) { return this.service.gradebook(req.user, id, subject); }
  @Post('gradebook') marks(@Request() req: any, @Body() dto: MarksDto) { return this.service.saveMarks(req.user, dto); }
  @Get('performance') performance(@Request() req: any) { return this.service.performance(req.user); }
  @Get(':resource') list(@Request() req: any, @Param('resource') resource: string) { return this.service.list(req.user, resource); }
  @Post(':resource') create(@Request() req: any, @Param('resource') resource: string, @Body() dto: RecordDto) { return this.service.write(req.user, resource, dto.data); }
  @Patch(':resource/:id') update(@Request() req: any, @Param('resource') resource: string, @Param('id') id: string, @Body() dto: RecordDto) { return this.service.write(req.user, resource, dto.data, id); }
  @Post(':resource/:id/:action') action(@Request() req: any, @Param('resource') resource: string, @Param('id') id: string, @Param('action') action: string) { return this.service.action(req.user, resource, id, action); }
}
