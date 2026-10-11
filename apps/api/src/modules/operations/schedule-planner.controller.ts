import { Body, Controller, Post, Request } from '@nestjs/common';
import { OperationPayload } from './operations.controller';
import { SchedulePlannerService } from './schedule-planner.service';
@Controller('schedule-planner')
export class SchedulePlannerController {
 constructor(private service:SchedulePlannerService){}
 @Post('generate') generate(@Request() req:any,@Body() body:OperationPayload){return this.service.generate(req.user,body.data);}
}
