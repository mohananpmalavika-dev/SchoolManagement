import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { IsString, IsUUID, MaxLength } from 'class-validator';
import { CheckInService } from './check-in.service';
class OpenCheckIn { @IsUUID() classId: string; }
class ScanCheckIn { @IsString() @MaxLength(150) token: string; }
@Controller('check-in')
export class CheckInController {
  constructor(private service: CheckInService) {}
  @Post('sessions') open(@Request() req: any, @Body() body: OpenCheckIn) { return this.service.open(req.user, body.classId); }
  @Get('sessions/:id') code(@Request() req: any, @Param('id') id: string) { return this.service.code(req.user, id); }
  @Post('sessions/:id/close') close(@Request() req: any, @Param('id') id: string) { return this.service.close(req.user, id); }
  @Post('scan') scan(@Request() req: any, @Body() body: ScanCheckIn) { return this.service.attend(req.user, body.token); }
}
