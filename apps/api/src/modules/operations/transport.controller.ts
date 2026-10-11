import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { SavedTransportService } from './transport.service';
import { OperationPayload } from './operations.controller';
@Controller('operations-transport')
export class SavedTransportController {
 constructor(private service:SavedTransportService){}
 @Get('routes') routes(@Request() req:any){return this.service.routes(req.user);}
 @Post('stops') stop(@Request() req:any,@Body() body:OperationPayload){return this.service.saveStop(req.user,body.data);}
 @Post('routes/:id/driver') driver(@Request() req:any,@Param('id') id:string,@Body() body:OperationPayload){return this.service.driver(req.user,id,body.data);}
 @Post('trips') start(@Request() req:any,@Body() body:OperationPayload){return this.service.start(req.user,body.data);}
 @Get('trips/:id') trip(@Request() req:any,@Param('id') id:string){return this.service.trip(req.user,id);}
 @Post('trips/:id/location') location(@Request() req:any,@Param('id') id:string,@Body() body:OperationPayload){return this.service.ping(req.user,id,body.data);}
 @Post('trips/:id/passenger') passenger(@Request() req:any,@Param('id') id:string,@Body() body:OperationPayload){return this.service.passenger(req.user,id,body.data);}
 @Post('trips/:id/end') end(@Request() req:any,@Param('id') id:string){return this.service.end(req.user,id);}
 @Get('tracking/:studentId') tracking(@Request() req:any,@Param('studentId') id:string){return this.service.tracking(req.user,id);}
}
