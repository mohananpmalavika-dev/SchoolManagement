import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { IsObject } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { OperationsService } from './operations.service';
export class OperationPayload { @IsObject() data:Record<string,unknown>; }
@Controller('operations')
export class OperationsController {
 constructor(private service:OperationsService){}
 @Get('options') options(@Request() req:any){return this.service.options(req.user);}
 @Get('learning/:studentId') learning(@Request() req:any,@Param('studentId') id:string){return this.service.learning(req.user,id);}
 @Get(':resource') list(@Request() req:any,@Param('resource') resource:string){return this.service.list(req.user,resource);}
 @Post(':resource') create(@Request() req:any,@Param('resource') resource:string,@Body() body:OperationPayload){return this.service.create(req.user,resource,body.data);}
 @Post(':resource/:id/:action') action(@Request() req:any,@Param('resource') resource:string,@Param('id') id:string,@Param('action') action:string,@Body() body:OperationPayload){return this.service.action(req.user,resource,id,action,body.data);}
}
@Controller('school-public')
@Public()
export class SchoolPublicController {
 constructor(private service:OperationsService){}
 @Get('schools') schools(){return this.service.publicSchools();}
 @Post('applications') @Throttle({default:{limit:5,ttl:60000}}) apply(@Body() body:OperationPayload){return this.service.publicApply(body.data);}
 @Post('applications/track') @Throttle({default:{limit:10,ttl:60000}}) track(@Body() body:OperationPayload){return this.service.publicTrack(body.data);}
 @Get('certificates/:token') @Throttle({default:{limit:20,ttl:60000}}) verify(@Param('token') token:string){return this.service.verifyCertificate(token);}
}
