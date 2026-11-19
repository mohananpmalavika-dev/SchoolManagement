import { ParentEngagementNotificationsService } from '../parent-engagement-notifications/parent-engagement-notifications.service';
import {ExaminationsService} from '../examinations/examinations.service';
import {Injectable,BadRequestException,ForbiddenException,NotFoundException} from '@nestjs/common';
import {PrismaService} from '../../database/prisma.service';
import {TenantService} from '../../database/tenant.service';
import { FeesService } from '../fees/fees.service';
import { PaymentsGatewayService } from '../payments-gateway/payments-gateway.service';
import { TimetableService } from '../timetable/timetable.service';
import { FeeCategory } from '@krypton/types';
import { recordSpecs, managers, parseRecord } from './records';
import { recordEnrollment } from '../students/student-enrollment';
import { prepareAcademicClass } from './academic-class';
import { schoolEducationLevels } from '../preschool/school-programme';
const teacherRoles = ['TEACHER', 'CLASS_TEACHER', 'EXAM_OFFICER'];
@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService, private tenants: TenantService, private fees: FeesService, private paymentsGateway: PaymentsGatewayService, private timetable: TimetableService, private exams: ExaminationsService, private familyNotifications: ParentEngagementNotificationsService) {}
 private tenant(){return this.tenants.requireTenantContext();}
 private staffRole(user:any){if(['PARENT','STUDENT'].includes(user.role))throw new ForbiddenException('Staff access required');}
 private async classIds(user:any):Promise<string[]|null>{
  this.staffRole(user);if(!teacherRoles.includes(user.role))return null;
  const staff=await this.prisma.staff.findFirst({where:{tenantId:this.tenant(),userId:user.userId,status:'ACTIVE'}});
  if(!staff)return [];
  const [entries,assignments]=await Promise.all([
   this.prisma.timetableEntry.findMany({where:{tenantId:this.tenant(),teacherId:staff.id},select:{classId:true}}),
   this.prisma.preschoolStaffAssignment.findMany({where:{tenantId:this.tenant(),staffId:staff.id},select:{classId:true}}),
  ]);
  return [...new Set([...entries,...assignments].map(e=>e.classId))];
 }
 async authorizeClass(user:any,id:string){const classes=await this.classIds(user);if(classes&&!classes.includes(id))throw new ForbiddenException('This class is not assigned to you');
  if(!await this.prisma.class.findFirst({where:{id,tenantId:this.tenant()}}))throw new NotFoundException('Class not found');}
 private writer(user:any,resource:string){const spec=recordSpecs[resource];if(!spec)throw new NotFoundException('Unknown resource');const allowed=spec.roles||managers;if(!allowed.includes(user.role)&&user.role!=='SUPER_ADMIN')throw new ForbiddenException('You cannot edit this resource');return spec;}
 async children(user:any){if(user.role!=='PARENT')throw new ForbiddenException('Family access required');return this.prisma.student.findMany({where:{tenantId:this.tenant(),deletedAt:null,guardianLinks:{some:{guardian:{userId:user.userId,tenantId:this.tenant()}}}},include:{currentClass:true,currentStream:true},orderBy:{firstName:'asc'}});}
 async authorizeStudent(user:any,id:string){
  const student=await this.prisma.student.findFirst({where:{id,tenantId:this.tenant(),deletedAt:null},include:{currentClass:true,currentStream:true}});
  if(!student)throw new NotFoundException('Student not found');
  if(user.role==='PARENT'){const children=await this.children(user);if(!children.some(s=>s.id===id))throw new ForbiddenException('Access denied to this student');}
  else{this.staffRole(user);if(teacherRoles.includes(user.role))await this.authorizeClass(user,student.currentClassId||'');}
  return student;
 }
 async studentData(user:any,id:string){
  const student=await this.authorizeStudent(user,id);const tenantId=this.tenant();
  const [invoices,payments,attendance,grades,reportCards,events]=await Promise.all([
   this.prisma.invoice.findMany({where:{tenantId,studentId:id},orderBy:{createdAt:'desc'},include:{term:true}}),
   this.prisma.payment.findMany({where:{tenantId,invoice:{studentId:id},status:'COMPLETED'},orderBy:{paymentDate:'desc'}}),
   this.prisma.attendanceRecord.findMany({where:{tenantId,studentId:id},orderBy:{date:'desc'},take:365}),
   this.prisma.grade.findMany({where:{tenantId,studentId:id,...(user.role==='PARENT'?{examination:{isPublished:true}}:{})},include:{subject:true,examination:true},orderBy:{createdAt:'desc'}}),
   this.prisma.reportCard.findMany({where:{tenantId,studentId:id,...(user.role==='PARENT'?{status:'PUBLISHED'}:{})},include:{term:true},orderBy:{createdAt:'desc'}}),
   this.prisma.schoolEvent.findMany({where:{tenantId,startDate:{gte:new Date()}},orderBy:{startDate:'asc'},take:5})
  ]);
  const present=attendance.filter(a=>['PRESENT','LATE'].includes(a.status)).length;
  return {student,invoices,payments,attendance,grades,reportCards,events,attendanceSummary:{totalDays:attendance.length,presentCount:present,attendanceRate:attendance.length?Math.round(present/attendance.length*100):0}};
 }
 async pay(user:any,dto:any){const invoice=await this.prisma.invoice.findFirst({where:{id:dto.invoiceId,tenantId:this.tenant()}});if(!invoice)throw new NotFoundException('Invoice not found');await this.authorizeStudent(user,invoice.studentId);return this.paymentsGateway.initiatePayment(dto,user.userId);}
 async list(user:any,resource:string){
  this.staffRole(user);const tenantId=this.tenant();const classes=await this.classIds(user);
  const scope=classes?{currentClassId:{in:classes}}:{};
  const accountRoles:Record<string,string[]>={'guardian-accounts':['PARENT'],'student-accounts':['STUDENT'],'staff-accounts':[...managers,...teacherRoles,'ACCOUNTANT','LIBRARIAN','TRANSPORT_OFFICER','RECEPTIONIST','AUDITOR']};
  if(accountRoles[resource]){
   const editor=resource==='guardian-accounts'?'guardians':resource==='student-accounts'?'students':'staff';
   this.writer(user,editor);
   return this.prisma.user.findMany({where:{tenantId,isActive:true,role:{in:accountRoles[resource] as any}},select:{id:true,firstName:true,lastName:true,role:true},orderBy:{firstName:'asc'}});
  }
  if(teacherRoles.includes(user.role)&&!['classes','students','examinations','subjects','timetable','messages','recipients','assignments','materials','submissions'].includes(resource))throw new ForbiddenException('Resource is not available to teachers');
  if(resource==='users'){if(!managers.includes(user.role))throw new ForbiddenException('Administrator access required');return this.prisma.user.findMany({where:{tenantId,isActive:true},select:{id:true,firstName:true,lastName:true,role:true}});}
  if(resource==='recipients')return this.prisma.guardian.findMany({where:{tenantId,studentLinks:{some:{student:scope}}},select:{id:true,firstName:true,lastName:true,userId:true}});
  if(resource==='messages')return this.prisma.communication.findMany({where:{tenantId,...(classes?{sentBy:user.userId}:{})},orderBy:{createdAt:'desc'},take:500});
  const limited:Record<string,string[]>={ACCOUNTANT:['students','guardians','classes','terms','invoices','payments','examinations','tickets'],LIBRARIAN:['students','classes','books','borrowings','tickets'],TRANSPORT_OFFICER:['students','classes','vehicles','routes','tickets'],RECEPTIONIST:['students','guardians','guardian-links','classes','schools','tickets']};
  if(limited[user.role]&&!limited[user.role].includes(resource))throw new ForbiddenException('Resource is not available to your role');
  if(resource==='submissions')return this.prisma.assignmentSubmission.findMany({where:{tenantId,...(classes?{assignment:{classId:{in:classes}}}:{})},include:{assignment:true,student:true},orderBy:{submittedAt:'desc'}}).then(rows=>rows.map(r=>({...r,assignmentTitle:r.assignment.title,maxMarks:r.assignment.maxMarks,studentName:r.student.firstName+' '+r.student.lastName})));
  const spec=recordSpecs[resource];if(!spec)throw new NotFoundException('Unknown resource');
  let rows:any[];
  const db=this.prisma as any;
  if(resource==='students')rows=await this.prisma.student.findMany({where:{tenantId,deletedAt:null,...scope},include:{currentClass:true,currentStream:true},orderBy:{firstName:'asc'},take:5000});
  else if(resource==='classes')rows=await this.prisma.class.findMany({where:{tenantId,...(classes?{id:{in:classes}}:{})},include:{_count:{select:{currentStudents:true}}},orderBy:{sortOrder:'asc'}});
  else if(resource==='examinations')rows=await this.prisma.examination.findMany({where:{tenantId,...(classes?{classId:{in:classes}}:{})},include:{class:true,term:true,subjects:{include:{subject:true}}},orderBy:{createdAt:'desc'}});
  else if(resource==='invoices')rows=await this.prisma.invoice.findMany({where:{tenantId},include:{student:true,term:true},orderBy:{createdAt:'desc'},take:5000});
  else if(resource==='payments')rows=await this.prisma.payment.findMany({where:{tenantId},include:{invoice:{include:{student:true}}},orderBy:{paymentDate:'desc'},take:5000});
  else if(resource==='report-cards')rows=await this.prisma.reportCard.findMany({where:{tenantId},include:{student:true,term:true},orderBy:{createdAt:'desc'}});
  else if(resource==='assignments'||resource==='materials')rows=await db[spec.model].findMany({where:{tenantId,...(classes?{classId:{in:classes}}:{})},orderBy:{createdAt:'desc'}});
  else if(resource==='borrowings')rows=await this.prisma.bookBorrowing.findMany({where:{tenantId},include:{book:true},orderBy:{createdAt:'desc'},take:5000});
  else if(resource==='timetable'){const staff=classes?await this.prisma.staff.findFirst({where:{tenantId,userId:user.userId}}):null;rows=await this.prisma.timetableEntry.findMany({where:{tenantId,...(classes?{teacherId:staff?.id||''}:{})},include:{class:true,subject:true,teacher:true},orderBy:[{dayOfWeek:'asc'},{startTime:'asc'}]});}
  else if(resource==='guardian-links')rows=await this.prisma.guardianStudentLink.findMany({where:{guardian:{tenantId}},include:{guardian:true,student:true}});
  else if(resource==='tickets')rows=await this.prisma.supportTicket.findMany({where:{tenantId,...(!managers.includes(user.role)?{createdBy:user.userId}:{})},orderBy:{createdAt:'desc'},take:5000});
  else rows=await db[spec.model].findMany({where:{tenantId},orderBy:{createdAt:'desc'},take:5000});
  if(resource==='schools')rows=rows.map(({razorpayKeySecret,razorpayWebhookSecret,...safe})=>safe);
  if(resource==='borrowings'){
   const borrowers=await this.prisma.student.findMany({where:{tenantId,id:{in:rows.filter(r=>r.borrowerType==='STUDENT').map(r=>r.borrowerId)}},select:{id:true,firstName:true,lastName:true}});
   const names=new Map(borrowers.map(student=>[student.id,student.firstName+' '+student.lastName]));
   rows=rows.map(row=>({...row,borrowerName:names.get(row.borrowerId)||row.borrowerId}));
  }
  return rows.map(r=>({...r,name:r.name||(r.firstName?r.firstName+' '+r.lastName:undefined),studentName:r.student?r.student.firstName+' '+r.student.lastName:undefined,className:r.currentClass?.name||r.class?.name,termName:r.term?.name,bookTitle:r.book?.title,guardianName:r.guardian?r.guardian.firstName+' '+r.guardian.lastName:undefined,subjectName:r.subject?.name,teacherName:r.teacher?r.teacher.firstName+' '+r.teacher.lastName:undefined,studentCount:r._count?.currentStudents,day:r.dayOfWeek?['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][r.dayOfWeek-1]:undefined}));
 }
 async write(user:any,resource:string,input:Record<string,unknown>,id?:string){
  if(resource==='submissions')return this.submission(user,input,id);
  if(resource==='messages')return this.sendMessage(user,input);
  const spec=this.writer(user,resource);const tenantId=this.tenant();const data=parseRecord(spec,input,!!id);const db=this.prisma as any;
  for(const [key,rule] of Object.entries(spec.fields))if(rule.startsWith('ref:')&&data[key]){
   const model=rule.replace(/!$/,'').slice(4);const ref=await db[model].findFirst({where:{id:data[key],tenantId}});
   if(!ref)throw new BadRequestException('Selected '+key+' is unavailable');
   if(key==='userId'&&resource==='students'&&ref.role!=='STUDENT')throw new BadRequestException('Student account must have the student role');
   if(key==='userId'&&resource==='guardians'&&ref.role!=='PARENT')throw new BadRequestException('Guardian account must have the parent role');
   if(key==='userId'&&resource==='staff'&&![...managers,...teacherRoles,'ACCOUNTANT','LIBRARIAN','TRANSPORT_OFFICER','RECEPTIONIST','AUDITOR'].includes(ref.role))throw new BadRequestException('Linked staff account must have a staff role');
  }
  if(id){const where=resource==='guardian-links'?{id,guardian:{tenantId}}:{id,tenantId,...(resource==='tickets'&&!managers.includes(user.role)?{createdBy:user.userId}:{})};if(!await db[spec.model].findFirst({where}))throw new NotFoundException('Record not found');
   if(['invoices','payments','examinations','borrowings','timetable'].includes(resource))throw new BadRequestException('This record cannot be edited here');
   if(['years','terms','events'].includes(resource)){const existing=await db[spec.model].findFirst({where});if((data.startDate||existing.startDate)>(data.endDate||existing.endDate))throw new BadRequestException('End date must follow start date');}
  }
  if(resource==='streams'){
   const existing=id?await this.prisma.stream.findFirstOrThrow({where:{id,tenantId}}):null;
   const cls=await this.prisma.class.findFirst({where:{id:data.classId||existing?.classId,tenantId}});
   if(cls?.schoolId!==(data.schoolId||existing?.schoolId))throw new BadRequestException('Class belongs to a different campus');
  }
  if(resource==='classes'&&id&&data.schoolId&&await this.prisma.stream.count({where:{tenantId,classId:id,schoolId:{not:data.schoolId}}}))throw new BadRequestException('Move or remove the class streams before changing campus');
  if(['assignments','materials'].includes(resource)){if(id){const old=await db[spec.model].findFirst({where:{id,tenantId}});await this.authorizeClass(user,old.classId);}if(data.classId)await this.authorizeClass(user,data.classId);if(!id)data.createdBy=user.userId;}
  let result:any;
  if(resource==='students'){
   result=await this.prisma.$transaction(async tx=>{
    await tx.tenant.update({where:{id:tenantId},data:{updatedAt:new Date()}});
    const old=id?await tx.student.update({where:{id,tenantId},data:{updatedAt:new Date()}}):null;
    if(data.currentClassId!==undefined&&data.currentClassId!==old?.currentClassId)data.currentStreamId=null;
    const student=id?await tx.student.update({where:{id,tenantId},data}):await tx.student.create({data:{...data,tenantId} as any});
    if(student.currentClassId&&(data.currentClassId!==undefined||!id)){
     await recordEnrollment(tx,tenantId,student);
    }
    return student;
   });
  }
  else if(['years','terms','classes','streams'].includes(resource))result=await this.prisma.$transaction(async tx=>{
   await tx.tenant.update({where:{id:tenantId},data:{updatedAt:new Date()}});
   if(resource==='classes')await prepareAcademicClass(tx,tenantId,data,id);
   const model=(tx as any)[spec.model];return id?model.update({where:{id,tenantId},data}):model.create({data:{...data,tenantId}});
  });
  else if(resource==='report-cards')result=await this.exams.generateReportCard(data as any,user.userId);
  else if(resource==='invoices'){const {studentId,termId,description,amount,dueDate}=data;result=await this.fees.createInvoice({studentId,termId,items:[{description,amount,feeCategory:FeeCategory.TUITION}],dueDate:dueDate?.toISOString()});}
  else if(resource==='payments')result=await this.fees.recordPayment({...data,paymentDate:data.paymentDate?.toISOString()} as any,user.userId);
  else if(resource==='timetable')result=await this.timetable.createEntry(data as any);
  else if(resource==='examinations'){const {subjectId,totalMarks,...exam}=data;result=await this.prisma.examination.create({data:{...exam,tenantId,subjects:{create:{subjectId,totalMarks}}} as any});}
  else if(resource==='borrowings'){
   if(data.dueDate<new Date())throw new BadRequestException('Due date must be in the future');
   result=await this.prisma.$transaction(async tx=>{
    const available=await tx.book.updateMany({where:{id:data.bookId,tenantId,available:{gt:0}},data:{available:{decrement:1}}});
    if(!available.count)throw new BadRequestException('No copies are available');
    return tx.bookBorrowing.create({data:{...data,tenantId,borrowerType:'STUDENT'} as any});
   });
  }else{
   if(resource==='schools'&&!id){
    const schools=await this.prisma.school.findMany({where:{tenantId,isActive:true},select:{programme:true,educationLevel:true}});
    data.programme=schools.length&&schools.every(s=>s.programme==='PRESCHOOL')?'PRESCHOOL':schools.some(s=>s.programme!=='STANDARD')?'COMBINED':'STANDARD';
    data.educationLevel=schoolEducationLevels(data.programme,schools.flatMap(s=>s.educationLevel));
   }
   if(resource==='staff'&&data.department!==undefined)data.isTeacher=data.department==='TEACHING';
   if(resource==='books'&&!id)data.available=data.quantity;
   if(resource==='tickets'&&!id)data.createdBy=user.userId;
   if(resource==='books'&&id&&data.quantity!==undefined){
    result=await this.prisma.$transaction(async tx=>{
     // Serialize stock edits with the same book row used by borrowing transactions.
     await tx.book.update({where:{id,tenantId},data:{updatedAt:new Date()}});
     const book=await tx.book.findFirstOrThrow({where:{id,tenantId}});const onLoan=book.quantity-book.available;
     if(data.quantity<onLoan)throw new BadRequestException('Quantity cannot be smaller than copies on loan');
     return tx.book.update({where:{id,tenantId},data:{...data,available:data.quantity-onLoan}});
    });
   }else result=id?await db[spec.model].update({where:{id},data}):await db[spec.model].create({data:{...data,...(resource==='guardian-links'?{}:{tenantId})}});
  }
  await this.audit(user,id?'RECORD_UPDATED':'RECORD_CREATED',resource,result.id);return {id:result.id};
 }
 private async audit(user:any,action:string,entityType:string,entityId?:string){await this.prisma.auditLog.create({data:{tenantId:this.tenant(),userId:user.userId,action,entityType,entityId}});}
 async action(user:any,resource:string,id:string,action:string){
  this.writer(user,resource);const tenantId=this.tenant();
  if(resource==='report-cards'&&action==='publish'){await this.exams.publishReportCard(id,user.userId);}
  else if(resource==='borrowings'&&action==='return'){await this.prisma.$transaction(async tx=>{const loan=await tx.bookBorrowing.findFirst({where:{id,tenantId}});if(!loan)throw new NotFoundException('Loan not found');const changed=await tx.bookBorrowing.updateMany({where:{id,tenantId,status:{in:['BORROWED','OVERDUE']}},data:{status:'RETURNED',returnDate:new Date()}});if(changed.count)await tx.book.update({where:{id:loan.bookId,tenantId},data:{available:{increment:1}}});});}
  else if(['years','terms'].includes(resource)&&action==='current'){const model=recordSpecs[resource].model;const db=this.prisma as any;if(!await db[model].findFirst({where:{id,tenantId}}))throw new NotFoundException('Record not found');await this.prisma.$transaction(async tx=>{await tx.tenant.update({where:{id:tenantId},data:{updatedAt:new Date()}});await (tx as any)[model].updateMany({where:{tenantId},data:{isCurrent:false}});await (tx as any)[model].update({where:{id,tenantId},data:{isCurrent:true}});});}
  else if(resource==='examinations'&&action==='publish'){if(!await this.prisma.examination.findFirst({where:{id,tenantId}}))throw new NotFoundException('Assessment not found');await this.prisma.examination.update({where:{id,tenantId},data:{isPublished:true}});}
  else throw new BadRequestException('Unknown action');
  await this.audit(user,'RECORD_'+action.toUpperCase(),resource,id);return {message:'Action completed'};
 }
 async register(user:any,classId:string,date:string){
  await this.authorizeClass(user,classId);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new BadRequestException('Choose a valid date');
  const tenantId=this.tenant();const [students,records]=await Promise.all([this.prisma.student.findMany({where:{tenantId,currentClassId:classId,status:'ACTIVE',deletedAt:null},orderBy:{firstName:'asc'}}),this.prisma.attendanceRecord.findMany({where:{tenantId,classId,date:new Date(date),period:1}})]);
  const approved=await this.prisma.absenceRequest.findMany({where:{tenantId,studentId:{in:students.map(s=>s.id)},status:'APPROVED',startDate:{lte:new Date(date)},endDate:{gte:new Date(date)}},select:{studentId:true}});
  return students.map(s=>({id:s.id,name:s.firstName+' '+s.lastName,admissionNumber:s.admissionNumber,streamId:s.currentStreamId,status:records.find(r=>r.studentId===s.id)?.status||(approved.some(a=>a.studentId===s.id)?'EXCUSED':'')}));
 }
 async saveRegister(user:any,dto:any){
  if(![...managers,...teacherRoles].includes(user.role))throw new ForbiddenException('Cannot save attendance');
  await this.authorizeClass(user,dto.classId);const roster=await this.register(user,dto.classId,dto.date);const ids=new Set(dto.records.map((r:any)=>r.studentId));
  if(ids.size!==dto.records.length||dto.records.some((r:any)=>!roster.some(s=>s.id===r.studentId)))throw new BadRequestException('Invalid or duplicate students');
  const tenantId=this.tenant();await this.prisma.$transaction(dto.records.map((r:any)=>this.prisma.attendanceRecord.upsert({where:{tenantId_studentId_date_period:{tenantId,studentId:r.studentId,date:new Date(dto.date),period:1}},create:{tenantId,studentId:r.studentId,classId:dto.classId,streamId:roster.find(s=>s.id===r.studentId)?.streamId,date:new Date(dto.date),period:1,status:r.status,markedBy:user.userId},update:{classId:dto.classId,streamId:roster.find(s=>s.id===r.studentId)?.streamId,status:r.status,markedBy:user.userId}})));
  const absent=await this.prisma.attendanceRecord.findMany({where:{tenantId,classId:dto.classId,date:new Date(dto.date),studentId:{in:dto.records.map((r:any)=>r.studentId)},status:'ABSENT'},select:{id:true}});for(const record of absent)await this.familyNotifications.sendAttendanceAlert(record.id);
  await this.audit(user,'ATTENDANCE_SAVED','class',dto.classId);return {saved:dto.records.length};
 }
 async gradebook(user:any,id:string,subjectId:string){
  this.staffRole(user);const exam=await this.prisma.examination.findFirst({where:{id,tenantId:this.tenant()},include:{subjects:true}});if(!exam||!exam.classId)throw new NotFoundException('Assessment not found');
  await this.authorizeClass(user,exam.classId);const subject=exam.subjects.find(s=>s.subjectId===subjectId);if(!subject)throw new BadRequestException('Subject is not part of this assessment');
  const [students,grades]=await Promise.all([this.prisma.student.findMany({where:{tenantId:this.tenant(),currentClassId:exam.classId,status:'ACTIVE',deletedAt:null},orderBy:{firstName:'asc'}}),this.prisma.grade.findMany({where:{tenantId:this.tenant(),examinationId:id,subjectId}})]);
  return {totalMarks:subject.totalMarks,isPublished:exam.isPublished,rows:students.map(s=>({id:s.id,name:s.firstName+' '+s.lastName,admissionNumber:s.admissionNumber,score:grades.find(g=>g.studentId===s.id)?.score??''}))};
 }
 async saveMarks(user:any,dto:any){
  if(![...managers,...teacherRoles].includes(user.role))throw new ForbiddenException('Cannot save grades');
  const book=await this.gradebook(user,dto.examinationId,dto.subjectId);if(book.isPublished)throw new BadRequestException('Published assessments are locked');
  const ids=new Set(dto.records.map((r:any)=>r.studentId));if(ids.size!==dto.records.length||dto.records.some((r:any)=>r.score>book.totalMarks||!book.rows.some(s=>s.id===r.studentId)))throw new BadRequestException('Invalid students or marks');
  const tenantId=this.tenant();await this.prisma.$transaction(dto.records.map((r:any)=>{const percentage=r.score/book.totalMarks*100;const letterGrade=percentage>=91?'A1':percentage>=81?'A2':percentage>=71?'B1':percentage>=61?'B2':percentage>=51?'C1':percentage>=41?'C2':percentage>=33?'D':'E';const data={score:r.score,totalMarks:book.totalMarks,percentage,letterGrade,marks:r.score,grade:letterGrade,enteredBy:user.userId};return this.prisma.grade.upsert({where:{examinationId_studentId_subjectId:{examinationId:dto.examinationId,studentId:r.studentId,subjectId:dto.subjectId}},create:{tenantId,examinationId:dto.examinationId,studentId:r.studentId,subjectId:dto.subjectId,...data},update:data});}));
  await this.audit(user,'GRADES_SAVED','examination',dto.examinationId);return {saved:dto.records.length};
 }
 async submission(user:any,input:Record<string,unknown>,id?:string){
  const tenantId=this.tenant();
  if(user.role==='STUDENT'){
   const data=parseRecord({model:'assignmentSubmission',fields:{assignmentId:'ref:assignment!',text:'long!'}},input);
   const student=await this.prisma.student.findFirst({where:{tenantId,userId:user.userId,deletedAt:null}});if(!student)throw new ForbiddenException('Student account is not linked');
   const assignment=await this.prisma.assignment.findFirst({where:{id:data.assignmentId,tenantId,classId:student.currentClassId||''}});if(!assignment)throw new NotFoundException('Assignment not found');
   const previous=await this.prisma.assignmentSubmission.findUnique({where:{assignmentId_studentId:{assignmentId:assignment.id,studentId:student.id}}});if(previous?.status==='GRADED')throw new BadRequestException('Graded submissions are locked');
   return this.prisma.assignmentSubmission.upsert({where:{assignmentId_studentId:{assignmentId:assignment.id,studentId:student.id}},create:{tenantId,assignmentId:assignment.id,studentId:student.id,text:data.text},update:{text:data.text,submittedAt:new Date(),status:'SUBMITTED'}}).then(s=>({id:s.id}));
  }
  if(!id||![...managers,...teacherRoles].includes(user.role))throw new ForbiddenException('Only teachers can grade submissions');
  const data=parseRecord({model:'assignmentSubmission',fields:{score:'int:0:1000!',feedback:'long'}},input);
  const submission=await this.prisma.assignmentSubmission.findFirst({where:{id,tenantId},include:{assignment:true}});if(!submission)throw new NotFoundException('Submission not found');
  await this.authorizeClass(user,submission.assignment.classId);if(data.score>submission.assignment.maxMarks)throw new BadRequestException('Score exceeds the maximum marks');
  const result=await this.prisma.assignmentSubmission.update({where:{id,tenantId},data:{...data,status:'GRADED'}});await this.audit(user,'SUBMISSION_GRADED','assignmentSubmission',id);return {id:result.id};
 }
 async notifications(user:any){
  const logs=await this.prisma.communicationLog.findMany({where:{recipient:user.userId,channel:'IN_APP',communication:{tenantId:this.tenant()}},include:{communication:true},orderBy:{createdAt:'desc'},take:100});
  const announcements=await this.prisma.announcement.findMany({where:{status:'PUBLISHED'},orderBy:{publishedAt:'desc'},take:20});
  return [...logs.map(l=>({id:l.id,title:l.communication.subject,body:l.communication.body,createdAt:l.createdAt,read:!!l.readAt})),...announcements.map(a=>({id:a.id,title:a.title,body:a.body,createdAt:a.publishedAt,read:true,platform:true}))].sort((a,b)=>new Date(b.createdAt!).getTime()-new Date(a.createdAt!).getTime());
 }
 async sendMessage(user:any,input:Record<string,unknown>){
  const data=parseRecord({model:'communication',fields:{classId:'ref:class!',subject:'text!',body:'long!'}},input);
  await this.authorizeClass(user,data.classId);
  if(![...managers,...teacherRoles].includes(user.role))throw new ForbiddenException('Cannot send messages');
  const guardians=await this.prisma.guardian.findMany({where:{tenantId:this.tenant(),userId:{not:null},studentLinks:{some:{student:{currentClassId:data.classId,deletedAt:null},receiveUpdates:true}}},select:{userId:true}});
  const users=await this.prisma.user.findMany({where:{tenantId:this.tenant(),id:{in:guardians.map(g=>g.userId!).filter(Boolean)},role:'PARENT',isActive:true},select:{id:true}});
  const recipients=[...new Set(users.map(u=>u.id))];if(!recipients.length)throw new BadRequestException('No linked parent accounts in this class');
  await this.prisma.communication.create({data:{tenantId:this.tenant(),channel:'IN_APP',messageType:'ANNOUNCEMENT',subject:data.subject,body:data.body,status:'SENT',sentBy:user.userId,recipientCount:recipients.length,deliveredCount:recipients.length,sentAt:new Date(),logs:{create:recipients.map(id=>({recipient:id,channel:'IN_APP',status:'SENT',sentAt:new Date()}))}}});
  await this.audit(user,'MESSAGE_SENT','class',data.classId);return {recipients:recipients.length};
 }
 async readNotification(user:any,id:string){const result=await this.prisma.communicationLog.updateMany({where:{id,recipient:user.userId,channel:'IN_APP',communication:{tenantId:this.tenant()}},data:{readAt:new Date(),status:'READ'}});if(!result.count)throw new NotFoundException('Message not found');return {message:'Marked as read'};}
 async overview(user:any){
  this.staffRole(user);const tenantId=this.tenant();const classes=await this.classIds(user);const classFilter=classes?{classId:{in:classes}}:{};
  const today=new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
  const [students,staff,classCount,examinations,balance,attendance,events,activities,records]=await Promise.all([
   this.prisma.student.count({where:{tenantId,status:'ACTIVE',deletedAt:null,...(classes?{currentClassId:{in:classes}}:{})}}),
   this.prisma.staff.count({where:{tenantId,status:'ACTIVE'}}),this.prisma.class.count({where:{tenantId,...(classes?{id:{in:classes}}:{})}}),
   this.prisma.examination.count({where:{tenantId,...classFilter}}),
   this.prisma.invoice.aggregate({where:{tenantId,status:{in:['PENDING','PARTIALLY_PAID','OVERDUE']}},_sum:{balanceAmount:true}}),
   this.prisma.attendanceRecord.findMany({where:{tenantId,date:today,period:1,...classFilter}}),
   this.prisma.schoolEvent.findMany({where:{tenantId,startDate:{gte:today}},orderBy:{startDate:'asc'},take:5}),
   this.prisma.auditLog.findMany({where:{tenantId,...(classes?{userId:user.userId}:{})},orderBy:{createdAt:'desc'},take:5}),
   this.prisma.attendanceRecord.findMany({where:{tenantId,date:{gte:new Date(today.getTime()-7*86400000)},period:1,...classFilter}})
  ]);
  const weekdays:Date[]=[];let date=new Date(today);while(weekdays.length<5){if(date.getUTCDay()!==0&&date.getUTCDay()!==6)weekdays.unshift(new Date(date));date=new Date(date.getTime()-86400000);}
  const rate=(rows:any[])=>rows.length?Math.round(rows.filter(r=>['PRESENT','LATE'].includes(r.status)).length/rows.length*100):0;
  return {students,staff,classes:classCount,examinations,balance:balance._sum.balanceAmount||0,attendanceTotal:attendance.length,attendanceRate:rate(attendance),weekly:weekdays.map(day=>{const rows=records.filter(r=>r.date.toISOString().slice(0,10)===day.toISOString().slice(0,10));return {date:day.toISOString(),total:rows.length,rate:rate(rows)};}),events,activities};
 }
 async performance(user:any){const classes=await this.classIds(user);const grades=await this.prisma.grade.groupBy({by:['subjectId'],where:{tenantId:this.tenant(),...(classes?{examination:{classId:{in:classes}}}:{})},_avg:{percentage:true},_count:true});const subjects=await this.prisma.subject.findMany({where:{tenantId:this.tenant()}});return grades.map(g=>({id:g.subjectId,subjectName:subjects.find(s=>s.id===g.subjectId)?.name||'Subject',average:Math.round((g._avg.percentage||0)*10)/10,assessments:g._count}));}
}
