import { Injectable, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantService } from '../../database/tenant.service';
import { OperationsService, Actor } from './operations.service';
import { parseRecord } from '../workspace/records';
@Injectable()
export class SchedulePlannerService {
 constructor(private db:PrismaService,private tenants:TenantService,private operations:OperationsService){}
 async generate(user:Actor,input:Record<string,unknown>){
  if(!['SCHOOL_OWNER','PRINCIPAL','SCHOOL_ADMIN','DEPUTY_PRINCIPAL'].includes(user.role))throw new ForbiddenException('School management access required');
  const {courses,...fields}=input;
  const data=parseRecord({model:'schedule',fields:{classId:'ref:class!',room:'text!',daysPerWeek:'int:1:5!',periodsPerDay:'int:1:8!',maxTeacherDailyPeriods:'int:1:8!'}},fields);
  await this.operations.classAccess(user,data.classId);
  if(!Array.isArray(courses)||!courses.length||courses.length>40)throw new BadRequestException('Choose the weekly subject and teacher requirements');
  const clean=courses.map(course=>{if(!course||typeof course!=='object'||Array.isArray(course))throw new BadRequestException('Invalid weekly requirement');return parseRecord({model:'course',fields:{subjectId:'ref:subject!',teacherId:'ref:teacher!',periodsPerWeek:'int:1:40!'}},course);});
  if(new Set(clean.map(c=>c.subjectId)).size!==clean.length)throw new BadRequestException('Each subject may appear once');
  const tenantId=this.tenants.requireTenantContext();
  for(const course of clean){if(!await this.db.subject.findFirst({where:{id:course.subjectId,tenantId}})||!await this.db.staff.findFirst({where:{id:course.teacherId,tenantId,isTeacher:true,status:'ACTIVE'}}))throw new BadRequestException('Choose saved subjects and active teachers');}
  const times=[['08:00','08:40'],['08:40','09:20'],['09:20','10:00'],['10:20','11:00'],['11:00','11:40'],['11:40','12:20'],['13:20','14:00'],['14:00','14:40']];
  return this.db.$transaction(async tx=>{
   // Every planner run and ordinary timetable write takes this same tenant lock.
   await tx.tenant.update({where:{id:tenantId},data:{updatedAt:new Date()}});
   const existing=await tx.timetableEntry.findMany({where:{tenantId}});
   const generated:any[]=[];const conflicts=(e:any,day:number,start:string,end:string)=>e.dayOfWeek===day&&e.startTime<end&&e.endTime>start;
   for(const course of [...clean].sort((a,b)=>b.periodsPerWeek-a.periodsPerWeek)){
    const already=existing.filter(e=>e.classId===data.classId&&e.subjectId===course.subjectId&&e.dayOfWeek<=data.daysPerWeek).length;
    if(already>course.periodsPerWeek)throw new ConflictException('Saved lessons exceed the requested subject count. Review the saved timetable first');
    for(let count=already;count<course.periodsPerWeek;count++){
     let chosen:any=null;
     const days=Array.from({length:data.daysPerWeek},(_,i)=>i+1).sort((a,b)=>[...existing,...generated].filter(e=>e.classId===data.classId&&e.subjectId===course.subjectId&&e.dayOfWeek===a).length-[...existing,...generated].filter(e=>e.classId===data.classId&&e.subjectId===course.subjectId&&e.dayOfWeek===b).length);
     for(const day of days){for(let i=0;i<data.periodsPerDay;i++){
      const [startTime,endTime]=times[i],all=[...existing,...generated];
      if(all.filter(e=>e.teacherId===course.teacherId&&e.dayOfWeek===day).length>=data.maxTeacherDailyPeriods)continue;
      if(all.some(e=>conflicts(e,day,startTime,endTime)&&(e.classId===data.classId||e.teacherId===course.teacherId||e.room===data.room)))continue;
      chosen={tenantId,classId:data.classId,teacherId:course.teacherId,subjectId:course.subjectId,room:data.room,dayOfWeek:day,period:String(i+1),startTime,endTime};break;
     }if(chosen)break;}
     if(!chosen)throw new ConflictException('The requested lessons do not fit available slots and teacher workloads. No changes were saved');
     generated.push(chosen);
    }
   }
   await tx.timetableEntry.createMany({data:generated});
   await tx.auditLog.create({data:{tenantId,userId:user.userId,action:'TIMETABLE_PLANNED',entityType:'class',entityId:data.classId,changes:{added:generated.length,requirements:clean}}});
   return {added:generated.length,entries:generated};
  });
 }
}
