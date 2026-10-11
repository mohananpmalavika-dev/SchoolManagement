import { Body, Controller, Get, Post, Request, ServiceUnavailableException, NotFoundException } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@krypton/types';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { WhatsAppService } from '../communications/whatsapp/whatsapp.service';
import { OperationPayload } from './operations.controller';
import { parseRecord } from '../workspace/records';
@Controller('school-messaging')
@Roles(UserRole.PRINCIPAL,UserRole.SCHOOL_OWNER,UserRole.SCHOOL_ADMIN)
export class SchoolMessagingController {
 constructor(private db:PrismaService,private tenants:TenantService,private provider:WhatsAppService){}
 @Get('status') status(){return {available:this.provider.isAvailable(),provider:'Twilio WhatsApp'};}
 @Get('recipients') recipients(){return this.db.guardian.findMany({where:{tenantId:this.tenants.requireTenantContext(),studentLinks:{some:{student:{deletedAt:null,status:'ACTIVE'}}}},select:{id:true,firstName:true,lastName:true},orderBy:{firstName:'asc'}});}
 @Post('messages') async send(@Request() req:any,@Body() body:OperationPayload){
  const data=parseRecord({model:'message',fields:{guardianId:'ref:guardian!',message:'long!'}},body.data);
  const tenantId=this.tenants.requireTenantContext();
  const guardian=await this.db.guardian.findFirst({where:{id:data.guardianId,tenantId,studentLinks:{some:{student:{deletedAt:null,status:'ACTIVE'}}}}});
  if(!guardian)throw new NotFoundException('School guardian not found');
  if(!this.provider.isAvailable())throw new ServiceUnavailableException('WhatsApp provider is not configured for this deployment');
  const recipient=this.provider.formatPhoneNumber(guardian.phone);
  await this.db.auditLog.create({data:{tenantId,userId:req.user.userId,action:'WHATSAPP_REQUESTED',entityType:'guardian',entityId:guardian.id}});
  const result=await this.provider.sendMessage({to:recipient,body:data.message});
  if(!result)throw new ServiceUnavailableException('The messaging provider did not accept this message');
  await this.db.auditLog.create({data:{tenantId,userId:req.user.userId,action:'WHATSAPP_ACCEPTED',entityType:'guardian',entityId:guardian.id,changes:{providerId:result.sid,status:result.status}}});
  return {accepted:true,status:result.status,providerId:result.sid};
 }
}
