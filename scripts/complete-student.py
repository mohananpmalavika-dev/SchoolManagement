from pathlib import Path
import json
p=Path('apps/api/src/modules/students/students.service.ts');s=p.read_text(encoding='utf-8');s=s[:s.index('  async resolveStudentForUser(')]+Path('scripts/student-methods.txt').read_text(encoding='utf-8');p.write_text(s,encoding='utf-8')
p=Path('packages/database/prisma/schema.prisma');s=p.read_text();s=s.replace('model Student {','model Student {\n  userId String? @unique\n  submissions AssignmentSubmission[]');s=s.replace('model Class {','model Class {\n  assignments Assignment[]').replace('model Subject {','model Subject {\n  assignments Assignment[]');s+='''
model Assignment {
 id String @id @default(uuid())
 tenantId String
 classId String
 subjectId String
 title String
 description String @db.Text
 dueDate DateTime
 maxMarks Int @default(100)
 createdBy String
 createdAt DateTime @default(now())
 updatedAt DateTime @updatedAt
 class Class @relation(fields: [classId], references: [id])
 subject Subject @relation(fields: [subjectId], references: [id])
 submissions AssignmentSubmission[]
 @@index([tenantId,classId])
 @@map("assignments")
}
model AssignmentSubmission {
 id String @id @default(uuid())
 tenantId String
 assignmentId String
 studentId String
 text String @db.Text
 score Int?
 feedback String? @db.Text
 status String @default("SUBMITTED")
 submittedAt DateTime @default(now())
 createdAt DateTime @default(now())
 updatedAt DateTime @updatedAt
 assignment Assignment @relation(fields: [assignmentId], references: [id])
 student Student @relation(fields: [studentId], references: [id])
 @@unique([assignmentId,studentId])
 @@index([tenantId,studentId])
 @@map("assignment_submissions")
}
model LearningMaterial {
 id String @id @default(uuid())
 tenantId String
 classId String?
 subjectId String?
 title String
 description String?
 url String
 createdBy String
 createdAt DateTime @default(now())
 updatedAt DateTime @updatedAt
 @@index([tenantId,classId])
 @@map("learning_materials")
}
''';p.write_text(s)
p=Path('packages/database/src/middleware/tenant-filter.ts');s=p.read_text().replace("'SupportTicket'","'SupportTicket','Assignment','AssignmentSubmission','LearningMaterial'");p.write_text(s)
p=Path('apps/api/src/modules/workspace/records.ts');s=p.read_text();prefix='export const recordSpecs:Record<string,RecordSpec> = ';start=s.index(prefix)+len(prefix);end=s.index(';\nexport const managers',start);records=json.loads(s[start:end]);records['students']['fields']['userId']='ref:user'
records.update({'assignments':{'model':'assignment','roles':['SUPER_ADMIN','SCHOOL_OWNER','PRINCIPAL','SCHOOL_ADMIN','TEACHER','CLASS_TEACHER','EXAM_OFFICER'],'fields':{'title':'text!','classId':'ref:class!','subjectId':'ref:subject!','description':'long!','dueDate':'date!','maxMarks':'int:1:1000!'}},'materials':{'model':'learningMaterial','roles':['SUPER_ADMIN','SCHOOL_OWNER','PRINCIPAL','SCHOOL_ADMIN','TEACHER','CLASS_TEACHER','EXAM_OFFICER'],'fields':{'title':'text!','classId':'ref:class!','subjectId':'ref:subject!','description':'long','url':'url!'}},'report-cards':{'model':'reportCard','fields':{'studentId':'ref:student!','termId':'ref:term!','classTeacherComments':'long','principalComments':'long'}}})
s=s[:start]+json.dumps(records,indent=2)+s[end:];s=s.replace("  if(kind==='email'&&!isEmail(trimmed))", "  if(kind==='url'){try{if(new URL(trimmed).protocol!=='https:')throw new Error();}catch{throw new BadRequestException('Use an HTTPS resource link');}}\n  if(kind==='email'&&!isEmail(trimmed))");p.write_text(s)
p=Path('apps/api/src/common/guards/portal-scope.guard.ts');s=p.read_text();s=s.replace("  if(['PARENT'", "  if(role==='STUDENT'&&/^\\/students\\/me(?:\\/|$)/.test(path))return true;\n  if(role==='PARENT'&&path==='/students/my-children')return true;\n  if(['PARENT'");p.write_text(s)
p=Path('apps/api/src/modules/platform/platform.service.ts');s=p.read_text().replace('TRANSPORT_OFFICER,PARENT,RECEPTIONIST','TRANSPORT_OFFICER,PARENT,STUDENT,RECEPTIONIST');p.write_text(s)
