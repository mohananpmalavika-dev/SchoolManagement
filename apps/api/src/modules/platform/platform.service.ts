import {Injectable,NotFoundException,BadRequestException} from '@nestjs/common';
import {PrismaService} from '../../database/prisma.service';
import {RecordSpec,parseRecord} from '../workspace/records';
import * as bcrypt from 'bcryptjs';
const specs:Record<string,RecordSpec> = {
  "schools": {
    "model": "tenant",
    "fields": {
      "name": "text!",
      "subdomain": "slug!",
      "contactEmail": "email!",
      "contactPhone": "text!",
      "address": "text",
      "status": "enum:ACTIVE,TRIAL,SUSPENDED,EXPIRED,CANCELLED"
    }
  },
  "users": {
    "model": "user",
    "fields": {
      "tenantId": "ref:tenant!",
      "email": "email!",
      "firstName": "text!",
      "lastName": "text!",
      "password": "password!",
      "role": "enum:SUPER_ADMIN,SCHOOL_OWNER,PRINCIPAL,DEPUTY_PRINCIPAL,SCHOOL_ADMIN,ACCOUNTANT,TEACHER,CLASS_TEACHER,EXAM_OFFICER,LIBRARIAN,TRANSPORT_OFFICER,PARENT,RECEPTIONIST,AUDITOR!",
      "status": "enum:ACTIVE,SUSPENDED"
    }
  },
  "subscriptions": {
    "model": "subscription",
    "fields": {
      "tenantId": "ref:tenant!",
      "planId": "ref:plan!",
      "startDate": "date!",
      "endDate": "date!",
      "status": "enum:TRIAL,ACTIVE,PAST_DUE,CANCELLED,EXPIRED!"
    }
  },
  "tickets": {
    "model": "supportTicket",
    "fields": {
      "status": "enum:OPEN,IN_PROGRESS,RESOLVED,CLOSED!",
      "priority": "enum:LOW,NORMAL,HIGH,URGENT"
    }
  },
  "announcements": {
    "model": "announcement",
    "fields": {
      "title": "text!",
      "body": "long!"
    }
  }
};
@Injectable()
export class PlatformService{
 constructor(private prisma:PrismaService){}
 async list(resource:string){return this.prisma.executeWithoutTenantFilter(async()=>{
  if(resource==='plans')return this.prisma.plan.findMany({where:{isActive:true},orderBy:{sortOrder:'asc'}});
  const spec=specs[resource];if(!spec)throw new NotFoundException('Unknown resource');
  if(resource==='users'){const users=await this.prisma.user.findMany({select:{id:true,tenantId:true,email:true,firstName:true,lastName:true,role:true,isActive:true,createdAt:true,tenant:{select:{name:true}}},orderBy:{createdAt:'desc'},take:5000});return users.map(u=>({...u,name:u.firstName+' '+u.lastName,schoolName:u.tenant.name,status:u.isActive?'ACTIVE':'SUSPENDED'}));}
  if(resource==='subscriptions'){const rows=await this.prisma.subscription.findMany({include:{plan:true,tenant:{select:{name:true}}},orderBy:{createdAt:'desc'},take:5000});return rows.map(r=>({...r,schoolName:r.tenant.name,planName:r.plan.name,price:r.plan.price}));}
  return (this.prisma as any)[spec.model].findMany({orderBy:{createdAt:'desc'},take:5000});
 });}
 async write(user:any,resource:string,input:Record<string,unknown>,id?:string){return this.prisma.executeWithoutTenantFilter(async()=>{
  const spec=specs[resource];if(!spec)throw new NotFoundException('Unknown resource');if(resource==='tickets'&&!id)throw new BadRequestException('Tickets are opened by schools');
  const data=parseRecord(spec,input,!!id);const db=this.prisma as any;
  if(data.subdomain&&!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(data.subdomain))throw new BadRequestException('Use 3?63 lowercase letters, numbers, or hyphens for the subdomain');
  for(const [key,rule] of Object.entries(spec.fields))if(rule.startsWith('ref:')&&data[key]){const model=rule.replace(/!$/,'').slice(4);if(!await db[model].findFirst({where:{id:data[key]}}))throw new BadRequestException('Invalid '+key);}
  const existing=id?await db[spec.model].findUnique({where:{id}}):null;if(id&&!existing)throw new NotFoundException('Record not found');
  if(resource==='users'){
   if(id===user.userId&&(data.status==='SUSPENDED'||data.role&&data.role!=='SUPER_ADMIN'||data.tenantId&&data.tenantId!==user.tenantId))throw new BadRequestException('You cannot disable or demote your own account');
   if(id&&data.tenantId&&data.tenantId!==existing.tenantId)throw new BadRequestException('User accounts cannot move between schools');
   if(data.password){data.passwordHash=await bcrypt.hash(data.password,12);delete data.password;}
   if(data.status){data.isActive=data.status==='ACTIVE';delete data.status;}
   if(id)data.tokenVersion={increment:1};
  }
  if(resource==='subscriptions'&&existing){if(data.tenantId&&data.tenantId!==existing.tenantId)throw new BadRequestException('Subscriptions cannot move between schools');if((data.startDate||existing.startDate)>(data.endDate||existing.endDate))throw new BadRequestException('End date must follow start date');}
  if(resource==='announcements'&&!id)data.createdBy=user.userId;
  const result=await this.prisma.$transaction(async tx=>{
   const entity=id?await (tx as any)[spec.model].update({where:{id},data}):await (tx as any)[spec.model].create({data});
   if(resource==='schools'&&!id)await tx.school.create({data:{tenantId:entity.id,name:entity.name,email:entity.contactEmail,phone:entity.contactPhone,address:entity.address||'Not provided',city:'Not provided',county:'Not provided',schoolType:'PRIVATE',educationLevel:['PRIMARY']}});
   await tx.auditLog.create({data:{tenantId:user.tenantId,userId:user.userId,action:id?'PLATFORM_RECORD_UPDATED':'PLATFORM_RECORD_CREATED',entityType:resource,entityId:entity.id}});
   return entity;
  });return {id:result.id};
 });}
 async publish(user:any,id:string){return this.prisma.executeWithoutTenantFilter(async()=>{const a=await this.prisma.announcement.findUnique({where:{id}});if(!a)throw new NotFoundException('Announcement not found');await this.prisma.$transaction([this.prisma.announcement.update({where:{id},data:{status:'PUBLISHED',publishedAt:new Date()}}),this.prisma.auditLog.create({data:{tenantId:user.tenantId,userId:user.userId,action:'ANNOUNCEMENT_PUBLISHED',entityType:'announcement',entityId:id}})]);return {message:'Published'};});}
 async overview(){return this.prisma.executeWithoutTenantFilter(async()=>{
  const [schools,students,staff,subscriptions,recentSchools,activities]=await Promise.all([this.prisma.tenant.count(),this.prisma.student.count({where:{deletedAt:null,status:'ACTIVE'}}),this.prisma.staff.count({where:{status:'ACTIVE'}}),this.prisma.subscription.findMany({where:{status:'ACTIVE',endDate:{gte:new Date()}},include:{plan:true}}),this.prisma.tenant.findMany({orderBy:{createdAt:'desc'},take:5,select:{id:true,name:true,status:true,createdAt:true}}),this.prisma.auditLog.findMany({orderBy:{createdAt:'desc'},take:5})]);
  return {schools,students,staff,subscriptions:subscriptions.length,balance:subscriptions.reduce((sum,s)=>sum+s.plan.price*(s.plan.billingCycle==='MONTHLY'?12:1),0),recentSchools,activities,events:[]};
 });}
 async system(){const start=Date.now();let database='healthy';try{await this.prisma.$queryRaw`SELECT 1`;}catch{database='unavailable';}return {database,databaseLatency:Date.now()-start,uptimeSeconds:Math.floor(process.uptime()),memoryMB:Math.round(process.memoryUsage().rss/1048576),environment:process.env.NODE_ENV||'development',timestamp:new Date().toISOString()};}
}