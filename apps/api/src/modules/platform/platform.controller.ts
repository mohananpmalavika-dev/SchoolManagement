import {Controller,Get,Post,Patch,Param,Body,Request} from '@nestjs/common';
import {IsIn,IsObject} from 'class-validator';
import {Roles} from '../../common/decorators/roles.decorator';
import {UserRole} from '@krypton/types';
import {PlatformService} from './platform.service';
class AdminRecordDto {@IsObject() data:Record<string,unknown>;}
export class AdminSchoolProgrammeDto {
 @IsIn(['STANDARD','PRESCHOOL','COMBINED']) programme: 'STANDARD'|'PRESCHOOL'|'COMBINED';
}
@Controller('admin') @Roles(UserRole.SUPER_ADMIN)
export class PlatformController{
 constructor(private service:PlatformService){}
 @Get('overview') overview(){return this.service.overview();}
 @Get('system') system(){return this.service.system();}
 @Get('school-setup') schoolSetup(@Request() req:any){return this.service.schoolSetup(req.user);}
 @Patch('school-setup/:id') schoolProgramme(@Request() req:any,@Param('id') id:string,@Body() dto:AdminSchoolProgrammeDto){return this.service.schoolProgramme(req.user,id,dto.programme);}
 @Get(':resource') list(@Param('resource') resource:string){return this.service.list(resource);}
 @Post(':resource') create(@Request() req:any,@Param('resource') resource:string,@Body() dto:AdminRecordDto){return this.service.write(req.user,resource,dto.data);}
 @Patch(':resource/:id') update(@Request() req:any,@Param('resource') resource:string,@Param('id') id:string,@Body() dto:AdminRecordDto){return this.service.write(req.user,resource,dto.data,id);}
 @Post('announcements/:id/publish') publish(@Request() req:any,@Param('id') id:string){return this.service.publish(req.user,id);}
}
