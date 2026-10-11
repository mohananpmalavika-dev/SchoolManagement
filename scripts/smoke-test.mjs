import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.SMOKE_API_URL||'http://localhost:3001/api/v1';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Smoke tests are restricted to a local test server');
const suffix=Date.now().toString(36),passed=[];
async function request(path,{token,method='GET',data,status=200}={}){
 const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});
 const body=await response.json();assert.equal(response.status,status,path+': '+(body.message||body.error?.message||response.status));
 return body.data??body;
}
async function test(name,fn){await fn();passed.push(name);console.log('PASS '+name);}
async function login(email){return request('/auth/login',{method:'POST',data:{email,password:process.env.SMOKE_PASSWORD||'KryptonDemo@2026'}});}
const admin=await login('admin@kryptonschool.com'),principal=await login('principal@demoacademy.ac.ke'),teacher=await login('teacher@demoacademy.ac.ke'),parent=await login('parent@demoacademy.ac.ke'),outsider=await login('outsider@isolation.test');
const a=admin.accessToken,p=principal.accessToken,t=teacher.accessToken,f=parent.accessToken,o=outsider.accessToken;
assert.notEqual((await request('/admin/system',{token:a})).environment,'production','Refusing to mutate a production server');
const students=await request('/workspace/students',{token:p});const classes=await request('/workspace/classes',{token:p});const cls=classes.find(c=>c.name==='Grade 5'),other=classes.find(c=>c.name==='Grade 6');const child=students.find(s=>s.admissionNumber==='GF0001'),unlinked=students.find(s=>s.admissionNumber==='GF0003');
const post=(path,data,token=p,status=201)=>request(path,{method:'POST',data,token,status});
await test('Health verifies the database',async()=>assert.equal((await request('/health')).checks.database,'healthy'));
await test('Anonymous records are rejected',()=>request('/workspace/students',{status:401}));
await test('Parent cannot access platform administration',()=>request('/admin/users',{token:f,status:403}));
await test('Parent sees only linked children',async()=>assert.equal((await request('/workspace/children',{token:f})).length,2));
await test('Parent cannot read an unlinked student',()=>request('/workspace/student/'+unlinked.id,{token:f,status:403}));
await test('Cross-school student records are inaccessible',()=>request('/workspace/student/'+child.id,{token:o,status:404}));
await test('Concurrent tenants retain isolated context',async()=>{await Promise.all(Array.from({length:8},async(_,i)=>{const rows=await request('/workspace/students',{token:i%2?p:o});assert.equal(rows.length,i%2?12:0);}));});
await test('Teacher sees only assigned classes',async()=>{const rows=await request('/workspace/classes',{token:t});assert.equal(rows.length,1);assert.equal(rows[0].id,cls.id);});
await test('Unassigned class access is rejected',()=>request('/workspace/register?classId='+other.id+'&date=2026-12-01',{token:t,status:403}));
await test('Unexpected privileged fields are rejected',()=>post('/workspace/books',{data:{title:'Invalid',quantity:1,tenantId:outsider.user.tenantId}},p,400));
const date=new Date(Date.now()+86400000*14).toISOString().slice(0,10);
await test('Attendance persists and can be corrected',async()=>{
 await post('/workspace/register',{classId:cls.id,date,records:[{studentId:child.id,status:'PRESENT'},{studentId:unlinked.id,status:'ABSENT'}]},t);
 let rows=await request('/workspace/register?classId='+cls.id+'&date='+date,{token:t});assert.equal(rows.find(r=>r.id===child.id).status,'PRESENT');
 await post('/workspace/register',{classId:cls.id,date,records:[{studentId:child.id,status:'LATE'}]},t);rows=await request('/workspace/register?classId='+cls.id+'&date='+date,{token:t});assert.equal(rows.find(r=>r.id===child.id).status,'LATE');
});
await test('Invalid nested attendance is rejected',()=>post('/workspace/register',{classId:cls.id,date,records:[{studentId:child.id,status:'INVALID'}]},t,400));
const exams=await request('/workspace/examinations',{token:t});const exam=exams.find(e=>!e.isPublished);const subjectId=exam.subjects[0].subjectId;
await test('Zero marks are saved accurately',async()=>{await post('/workspace/gradebook',{examinationId:exam.id,subjectId,records:[{studentId:child.id,score:0}]},t);const book=await request('/workspace/gradebook?examinationId='+exam.id+'&subjectId='+subjectId,{token:t});assert.equal(book.rows.find(r=>r.id===child.id).score,0);});
await test('Scores above maximum are rejected',()=>post('/workspace/gradebook',{examinationId:exam.id,subjectId,records:[{studentId:child.id,score:101}]},t,400));
await test('Unpublished grades stay hidden from families',async()=>{const data=await request('/workspace/student/'+child.id,{token:f});assert(!data.grades.some(g=>g.examinationId===exam.id));});
const years=await request('/workspace/years',{token:p});const term=await post('/workspace/terms',{data:{name:'Smoke '+suffix,academicYearId:years[0].id,termNumber:3,startDate:'2026-10-01',endDate:'2026-12-31'}});
const invoice=await post('/workspace/invoices',{data:{studentId:child.id,termId:term.id,description:'Smoke test tuition',amount:10000}});
let successfulReference;
await test('Concurrent payments cannot overpay an invoice',async()=>{
 const candidates=[{invoiceId:invoice.id,amount:6000,paymentMethod:'CASH',reference:'PAY-A-'+suffix},{invoiceId:invoice.id,amount:6000,paymentMethod:'CASH',reference:'PAY-B-'+suffix}];
 const results=await Promise.all(candidates.map(async data=>{const r=await fetch(base+'/workspace/payments',{method:'POST',headers:{Authorization:'Bearer '+p,'Content-Type':'application/json'},body:JSON.stringify({data})});return {status:r.status,reference:data.reference};}));
 assert.equal(results.filter(r=>r.status===201).length,1);assert.equal(results.filter(r=>r.status===400).length,1);successfulReference=results.find(r=>r.status===201).reference;
 const invoices=await request('/workspace/invoices',{token:p});assert.equal(invoices.find(i=>i.id===invoice.id).balanceAmount,4000);
});
await test('Repeated payment reference is idempotent',async()=>{await post('/workspace/payments',{data:{invoiceId:invoice.id,amount:6000,paymentMethod:'CASH',reference:successfulReference}});const invoices=await request('/workspace/invoices',{token:p});assert.equal(invoices.find(i=>i.id===invoice.id).balanceAmount,4000);});
await test('Parent payment cannot target another child',async()=>{const inv=(await request('/workspace/invoices',{token:p})).find(i=>i.studentId===unlinked.id);await post('/workspace/pay',{invoiceId:inv.id,phoneNumber:'254700000101',amount:100},f,403);});
await test('Unauthenticated callback credentials are rejected',()=>post('/mpesa/stk-push/callback',{Body:{stkCallback:{}}},undefined,503));
const book=await post('/workspace/books',{data:{title:'Smoke loan '+suffix,quantity:1}});let loan;
await test('Concurrent library loans cannot exceed available stock',async()=>{
 const results=await Promise.all([1,2].map(async()=>{const r=await fetch(base+'/workspace/borrowings',{method:'POST',headers:{Authorization:'Bearer '+p,'Content-Type':'application/json'},body:JSON.stringify({data:{bookId:book.id,borrowerId:child.id,dueDate:'2027-01-01'}})});return {status:r.status,body:await r.json()};}));
 assert.equal(results.filter(r=>r.status===201).length,1);assert.equal(results.filter(r=>r.status===400).length,1);loan=results.find(r=>r.status===201).body.data.id;
});
await test('Returning a library loan twice preserves stock',async()=>{await post('/workspace/borrowings/'+loan+'/return');await post('/workspace/borrowings/'+loan+'/return');const books=await request('/workspace/books',{token:p});assert.equal(books.find(b=>b.id===book.id).available,1);});
await test('Class announcements reach linked parent accounts',async()=>{await post('/workspace/messages',{data:{classId:cls.id,subject:'Smoke update '+suffix,body:'A saved school update for this test.'}},t);const inbox=await request('/workspace/notifications',{token:f});const message=inbox.find(m=>m.title==='Smoke update '+suffix);assert(message);await post('/workspace/notifications/'+message.id+'/read',undefined,f);assert((await request('/workspace/notifications',{token:f})).find(m=>m.id===message.id).read);});
await test('Platform user list omits password and MFA secrets',async()=>{const users=await request('/admin/users',{token:a});assert(users.length>=5);for(const user of users){assert(!('passwordHash' in user));assert(!('mfaSecret' in user));}});
await test('Admin cannot suspend their own account',()=>request('/admin/users/'+admin.user.id,{method:'PATCH',token:a,data:{data:{status:'SUSPENDED'}},status:400}));
await test('Logout revokes access and refresh tokens',async()=>{await request('/auth/logout',{method:'POST',token:f});await request('/auth/me',{token:f,status:401});await request('/auth/refresh',{method:'POST',data:{refreshToken:parent.refreshToken},status:401});});
await mkdir('qa',{recursive:true});await writeFile('qa/smoke-results.json',JSON.stringify({timestamp:new Date().toISOString(),passed:passed.length,checks:passed},null,2));
console.log('\n'+passed.length+' integration checks passed.');
