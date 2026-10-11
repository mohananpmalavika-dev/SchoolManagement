from pathlib import Path
p=Path('apps/api/src/modules/workspace/workspace.module.ts');s=p.read_text();s="import {ExaminationsModule} from '../examinations/examinations.module';\n"+s;s=s.replace('imports:[FeesModule,','imports:[ExaminationsModule,FeesModule,');p.write_text(s)
p=Path('apps/api/src/modules/workspace/workspace.service.ts');s=p.read_text();s="import {ExaminationsService} from '../examinations/examinations.service';\n"+s;s=s.replace('private timetable:TimetableService)','private timetable:TimetableService,private exams:ExaminationsService)')
s=s.replace("'messages','recipients'","'messages','recipients','assignments','materials','submissions'")
s=s.replace("  const spec=recordSpecs[resource];if(!spec)","  if(resource==='submissions')return this.prisma.assignmentSubmission.findMany({where:{tenantId,...(classes?{assignment:{classId:{in:classes}}}:{})},include:{assignment:true,student:true},orderBy:{submittedAt:'desc'}}).then(rows=>rows.map(r=>({...r,assignmentTitle:r.assignment.title,maxMarks:r.assignment.maxMarks,studentName:r.student.firstName+' '+r.student.lastName})));\n  const spec=recordSpecs[resource];if(!spec)",1)
s=s.replace("  else if(resource==='borrowings')", "  else if(resource==='report-cards')rows=await this.prisma.reportCard.findMany({where:{tenantId},include:{student:true,term:true},orderBy:{createdAt:'desc'}});\n  else if(resource==='assignments'||resource==='materials')rows=await db[spec.model].findMany({where:{tenantId,...(classes?{classId:{in:classes}}:{})},orderBy:{createdAt:'desc'}});\n  else if(resource==='borrowings')",1)
s=s.replace("  if(resource==='messages')return", "  if(resource==='submissions')return this.submission(user,input,id);\n  if(resource==='messages')return",1)
s=s.replace("   if(key==='userId'&&resource==='guardians'", "   if(key==='userId'&&resource==='students'&&ref.role!=='STUDENT')throw new BadRequestException('Student account must have the student role');\n   if(key==='userId'&&resource==='guardians'")
s=s.replace('  let result:any;',"  if(['assignments','materials'].includes(resource)){if(id){const old=await db[spec.model].findFirst({where:{id,tenantId}});await this.authorizeClass(user,old.classId);}if(data.classId)await this.authorizeClass(user,data.classId);if(!id)data.createdBy=user.userId;}\n  let result:any;",1)
s=s.replace("  if(resource==='invoices')", "  if(resource==='report-cards')result=await this.exams.generateReportCard(data as any,user.userId);\n  else if(resource==='invoices')",1)
s=s.replace("  if(resource==='borrowings'&&action==='return')", "  if(resource==='report-cards'&&action==='publish'){const card=await this.prisma.reportCard.findFirst({where:{id,tenantId}});if(!card)throw new NotFoundException('Report not found');await this.prisma.reportCard.update({where:{id,tenantId},data:{status:'PUBLISHED',publishedAt:new Date(),approvedBy:user.userId,approvedAt:new Date()}});}\n  else if(resource==='borrowings'&&action==='return')",1)
s=s.replace(' async notifications(user:any)',""" async submission(user:any,input:Record<string,unknown>,id?:string){
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
 async notifications(user:any)""")
p.write_text(s)
p=Path('apps/web/src/components/ResourcePage.tsx');s=p.read_text().replace("const canWrite=!!fields&&(","const canWrite=!!fields&&(['TEACHER','CLASS_TEACHER','EXAM_OFFICER'].includes(user?.role||'')&&/assignments|materials|submissions/.test(endpoint)||");p.write_text(s)
