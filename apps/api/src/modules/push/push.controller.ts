import { Body, Controller, Delete, Get, Post, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PushEndpointDto, SavePushSubscriptionDto } from './push.dto';
import { PushService } from './push.service';

@Controller('push')
export class PushController {
  constructor(private push: PushService) {}
  @Get('config') config() { return this.push.configuration(); }
  @Post('subscriptions') subscribe(@Request() req: any, @Body() body: SavePushSubscriptionDto) { return this.push.subscribe(req.user, body); }
  @Post('status') status(@Request() req: any, @Body() body: PushEndpointDto) { return this.push.status(req.user, body); }
  @Delete('subscriptions') unsubscribe(@Request() req: any, @Body() body: PushEndpointDto) { return this.push.unsubscribe(req.user, body); }
  @Post('test') @Throttle({ default: { limit: 3, ttl: 60000 } })
  test(@Request() req: any, @Body() body: PushEndpointDto) { return this.push.test(req.user, body); }
}
