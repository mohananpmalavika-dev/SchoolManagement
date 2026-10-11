from pathlib import Path
import re
p=Path('apps/api/src/modules/workspace/workspace.service.ts');s=p.read_text()
s=s.replace("  if(resource==='recipients')","  if(resource==='users'){if(!managers.includes(user.role))throw new ForbiddenException('Administrator access required');return this.prisma.user.findMany({where:{tenantId,isActive:true},select:{id:true,firstName:true,lastName:true,role:true}});}\n  if(resource==='recipients')")
s=s.replace('  const spec=this.writer(user,resource);',"  if(resource==='messages')return this.sendMessage(user,input);\n  const spec=this.writer(user,resource);",1)
s=s.replace(' async readNotification(user:any,id:string)',""" async sendMessage(user:any,input:Record<string,unknown>){
  const data=parseRecord({model:'communication',fields:{classId:'ref:class!',subject:'text!',body:'long!'}},input);
  await this.authorizeClass(user,data.classId);
  if(![...managers,...teacherRoles].includes(user.role))throw new ForbiddenException('Cannot send messages');
  const guardians=await this.prisma.guardian.findMany({where:{tenantId:this.tenant(),userId:{not:null},studentLinks:{some:{student:{currentClassId:data.classId,deletedAt:null},receiveUpdates:true}}},select:{userId:true}});
  const users=await this.prisma.user.findMany({where:{tenantId:this.tenant(),id:{in:guardians.map(g=>g.userId!).filter(Boolean)},role:'PARENT',isActive:true},select:{id:true}});
  const recipients=[...new Set(users.map(u=>u.id))];if(!recipients.length)throw new BadRequestException('No linked parent accounts in this class');
  await this.prisma.communication.create({data:{tenantId:this.tenant(),channel:'IN_APP',messageType:'ANNOUNCEMENT',subject:data.subject,body:data.body,status:'SENT',sentBy:user.userId,recipientCount:recipients.length,deliveredCount:recipients.length,sentAt:new Date(),logs:{create:recipients.map(id=>({recipient:id,channel:'IN_APP',status:'SENT',sentAt:new Date()}))}}});
  await this.audit(user,'MESSAGE_SENT','class',data.classId);return {recipients:recipients.length};
 }
 async readNotification(user:any,id:string)""");p.write_text(s)
p=Path('apps/web/src/components/ResourcePage.tsx');s=p.read_text().replace('editable=false,action}', 'editable=false,createAllowed=true,action}').replace('editable?:boolean;action?:','editable?:boolean;createAllowed?:boolean;action?:')
s=s.replace("const canWrite=!!fields&&!['AUDITOR','ACCOUNTANT','RECEPTIONIST'].includes(user?.role||'');","const canWrite=!!fields&&(['SUPER_ADMIN','SCHOOL_OWNER','PRINCIPAL','DEPUTY_PRINCIPAL','SCHOOL_ADMIN'].includes(user?.role||'')||user?.role==='ACCOUNTANT'&&/invoices|payments/.test(endpoint)||user?.role==='LIBRARIAN'&&/books|borrowings/.test(endpoint)||user?.role==='TRANSPORT_OFFICER'&&/vehicles|routes/.test(endpoint)||user?.role==='RECEPTIONIST'&&/students|guardians|guardian-links/.test(endpoint));")
s=s.replace('{canWrite&&<Button','{canWrite&&createAllowed&&<Button');p.write_text(s)
p=Path('apps/web/src/components/RecordModal.tsx');s=p.read_text().replace("String(initial?.[f.key]??'')","f.type==='date'&&initial?.[f.key]?String(initial[f.key]).slice(0,10):String(initial?.[f.key]??'')").replace('required={f.required}',"required={f.required&&!(initial&&f.type==='password')}");p.write_text(s)
p=Path('apps/web/src/components/ui/Input.tsx');s=p.read_text().replace('forwardRef, ReactNode','forwardRef, ReactNode, useId')
s=re.sub(r'const inputId = id \|\| .+?;', 'const generatedId = useId();\n    const inputId = id || generatedId;',s)
s=s.replace('            id={inputId}',"            id={inputId}\n            aria-invalid={!!error}\n            aria-describedby={error || helpText ? inputId + '-help' : undefined}").replace('<p className="mt-1.5',"<p id={inputId + '-help'} className=\"mt-1.5");p.write_text(s)
p=Path('apps/web/src/components/ui/Button.tsx');s=p.read_text().replace("variant = 'primary',","variant = 'primary',\n  type = 'button',").replace('<button\n','<button\n      type={type}\n      aria-busy={isLoading}\n').replace('border-2 border-primary-600 text-primary-600','border border-gray-300 text-gray-700').replace("md: 'px-4 py-2.5 text-base'","md: 'px-4 py-2.5 text-sm'");p.write_text(s)
p=Path('apps/web/src/components/ui/Card.tsx');s=p.read_text().replace('bg-white rounded-xl shadow-sm border border-gray-200','panel');p.write_text(s)
p=Path('apps/web/tailwind.config.js');s=p.read_text();colors={'f0f9ff':'f0f7f4','e0f2fe':'d9ede4','bae6fd':'b5dacc','7dd3fc':'89bda7','38bdf8':'60a58c','0ea5e9':'378b74','0284c7':'0f766e','0369a1':'115e59','075985':'134e4a','0c4a6e':'102c36'}
for a,b in colors.items():s=s.replace('#'+a,'#'+b)
s=s.replace("sans: ['Inter', 'sans-serif']","sans: ['Inter', 'Segoe UI', 'Arial', 'sans-serif']");p.write_text(s)
p=Path('apps/web/src/components/AppShell.tsx');s=p.read_text().replace("['examinations','Examinations',ClipboardCheck]","['attendance','Attendance',ClipboardCheck],['grades','Gradebook',BookOpen],['examinations','Examinations',ClipboardCheck]").replace("['library','Library',Library]","['timetable','Timetable',CalendarDays],['library','Library',Library]").replace("['messages','Communications',MessageSquare]","['inventory','Inventory',Library],['support','Support',LifeBuoy],['messages','Communications',MessageSquare]");p.write_text(s)
