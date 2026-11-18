import { Body, Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { IsObject } from 'class-validator';
import { CollaborationService } from './collaboration.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Throttle } from '@nestjs/throttler';
class Payload {
  @IsObject() data: Record<string, unknown>;
}
@Controller('chat')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CollaborationController {
  constructor(private service: CollaborationService) {}
  @Post('channels/:channelId/live/join') join(
    @Request() req: any,
    @Param('channelId') id: string,
    @Body() body: Payload
  ) {
    return this.service.join(req.user, id, body.data);
  }
  @Throttle({ default: { limit: 1200, ttl: 60000 } })
  @Post('live/:id/poll')
  poll(@Request() req: any, @Param('id') id: string, @Body() body: Payload) {
    return this.service.poll(req.user, id, body.data);
  }
  @Throttle({ default: { limit: 600, ttl: 60000 } })
  @Post('live/:id/signal')
  signal(@Request() req: any, @Param('id') id: string, @Body() body: Payload) {
    return this.service.signal(req.user, id, body.data);
  }
  @Throttle({ default: { limit: 600, ttl: 60000 } })
  @Post('live/:id/board')
  board(@Request() req: any, @Param('id') id: string, @Body() body: Payload) {
    return this.service.board(req.user, id, body.data);
  }
  @Post('live/:id/leave') leave(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: Payload
  ) {
    return this.service.leave(req.user, id, body.data);
  }
}
