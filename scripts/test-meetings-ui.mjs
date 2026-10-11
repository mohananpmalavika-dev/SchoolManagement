import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.UI_BASE_URL||'http://localhost:3105';
const browser=await chromium.launch({headless:true});
const checks=[],requests=[],errors=[];
let meeting=null,availability=[],slotsError=false;
async function session(role){
 const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
 await context.addInitScript(()=>localStorage.setItem('accessToken','test-access'));
 await context.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/^\/api\/v1/,'/api');
  const method=route.request().method(),body=route.request().postDataJSON();requests.push({path,method,body});
  const ok=data=>route.fulfill({json:{success:true,data}});
  if(path==='/api/auth/me')return ok({id:'user-1',firstName:role==='PARENT'?'Family':'Teacher',lastName:'Mwangi',email:'qa@example.test',role,tenantId:'school-1'});
  if(path==='/api/bookings/options')return ok({teachers:[{id:'teacher-1',name:'Teacher Mwangi'}],...(role==='PARENT'?{guardianId:'guardian-1'}:{teacherId:'teacher-1'})});
  if(path==='/api/bookings')return ok(meeting?[meeting]:[]);
  if(path==='/api/workspace/children')return ok([{id:'student-1',firstName:'Learner',lastName:'One'}]);
  if(path.startsWith('/api/bookings/available-slots/'))return slotsError?route.fulfill({status:503,json:{message:'Meeting times are temporarily unavailable'}}):ok(meeting&&meeting.status!=='CANCELLED'?[]:[{startTime:'15:00',endTime:'15:30',duration:30}]);
  if(path==='/api/parent-portal/bookings'&&method==='POST'){meeting={id:'meeting-1',...body,status:'PENDING',student:{firstName:'Learner',lastName:'One'},guardian:{firstName:'Family',lastName:'Mwangi'}};return ok(meeting);}
  if(path==='/api/bookings/availability'&&method==='POST'){availability.push({id:'hours-1',...body});return ok(availability[0]);}
  if(path==='/api/bookings/availability/teacher/teacher-1')return ok(availability);
  if(path==='/api/bookings/availability/hours-1'&&method==='DELETE'){availability=[];return ok({});}
  if(path==='/api/bookings/meeting-1'&&method==='PATCH'){meeting={...meeting,...body};return ok(meeting);}
  if(path==='/api/bookings/meeting-1/confirm'){meeting.status='CONFIRMED';return ok(meeting);}
  if(path==='/api/bookings/meeting-1/cancel'){meeting.status='CANCELLED';return ok(meeting);}
  return ok([]);
 });
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));return{context,page};
}
try{
 await mkdir('qa/meetings',{recursive:true});
 const family=await session('PARENT');
 await family.page.goto(base+'/dashboard/ptm',{timeout:120000});
 await family.page.getByRole('heading',{name:'Request a conversation',exact:true}).waitFor();
 await family.page.getByLabel('Meeting date',{exact:true}).fill('2026-12-14');
 await family.page.getByLabel('Available time',{exact:true}).selectOption('15:00-15:30');
 await family.page.getByLabel('Topic',{exact:true}).fill('Learning progress');
 await family.page.getByLabel('Anything to prepare? (optional)',{exact:true}).fill('Please review recent assignments.');
 await family.page.getByRole('button',{name:'Request meeting',exact:true}).click();
 await family.page.getByRole('status').filter({hasText:'teacher will confirm'}).waitFor();
 assert.deepEqual(requests.find(request=>request.path==='/api/parent-portal/bookings')?.body,{studentId:'student-1',teacherId:'teacher-1',bookingDate:'2026-12-14',startTime:'15:00',endTime:'15:30',topic:'Learning progress',purpose:'Please review recent assignments.'});
 await family.page.getByText('pending',{exact:true}).waitFor();
 await family.page.screenshot({path:'qa/meetings/family-desktop.png',fullPage:true});
 checks.push('Families request actual consultation slots with linked child and teacher IDs and see pending confirmation');
 const teacher=await session('TEACHER');
 await teacher.page.goto(base+'/teacher/ptm',{timeout:120000});
 await teacher.page.getByRole('heading',{name:'Publish consultation hours',exact:true}).waitFor();
 await teacher.page.getByLabel('Day',{exact:true}).selectOption('1');
 await teacher.page.getByLabel('Start time',{exact:true}).fill('15:00');
 await teacher.page.getByLabel('End time',{exact:true}).fill('17:00');
 await teacher.page.getByRole('button',{name:'Publish availability',exact:true}).click();
 await teacher.page.getByRole('status').filter({hasText:'availability has been saved'}).waitFor();
 assert.deepEqual(requests.find(request=>request.path==='/api/bookings/availability'&&request.method==='POST')?.body,{dayOfWeek:1,startTime:'15:00',endTime:'17:00',slotDuration:30});
 await teacher.page.getByRole('button',{name:'Edit meeting details',exact:true}).click();
 await teacher.page.getByLabel('Meeting location',{exact:true}).fill('School office');
 await teacher.page.getByLabel('Notes for the family',{exact:true}).fill('Please bring the recent workbook.');
 await teacher.page.getByRole('button',{name:'Save meeting details',exact:true}).click();
 await teacher.page.getByRole('status').filter({hasText:'details have been saved'}).waitFor();
 assert.deepEqual(requests.find(request=>request.path==='/api/bookings/meeting-1'&&request.method==='PATCH')?.body,{location:'School office',teacherNotes:'Please bring the recent workbook.'});
 await teacher.page.getByRole('button',{name:'Confirm',exact:true}).click();
 await teacher.page.getByText('confirmed',{exact:true}).waitFor();
 await teacher.page.screenshot({path:'qa/meetings/teacher-desktop.png',fullPage:true});
 await teacher.page.getByRole('button',{name:'Remove Monday availability',exact:true}).click();
 await teacher.page.getByRole('heading',{name:'Make space for a conversation',exact:true}).waitFor();
 checks.push('Teachers save recurring consultation hours, confirm family requests and remove availability without deleting appointments');
 await family.page.getByRole('button',{name:'Refresh',exact:true}).click();
 await family.page.getByText('confirmed',{exact:true}).waitFor();
 await family.page.getByText('Location: School office',{exact:true}).waitFor();
 await family.page.getByRole('button',{name:'Cancel appointment',exact:true}).click();
 await family.page.getByText('cancelled',{exact:true}).waitFor();
 slotsError=true;
 await family.page.getByLabel('Meeting date',{exact:true}).fill('2026-12-15');
 await family.page.getByRole('alert').filter({hasText:'times are temporarily unavailable'}).waitFor();
 assert.equal(await family.page.getByRole('button',{name:'Request meeting',exact:true}).isDisabled(),true);
 slotsError=false;
 await family.page.getByRole('button',{name:'Reload times',exact:true}).click();
 await family.page.getByLabel('Available time',{exact:true}).selectOption('15:00-15:30');
 await family.page.setViewportSize({width:390,height:844});
 assert.equal(await family.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await family.page.screenshot({path:'qa/meetings/family-mobile.png',fullPage:true});
 checks.push('Families can cancel appointments; unavailable-time errors disable booking and recover through retry; mobile layout fits');
 assert.deepEqual(errors,[]);
 await writeFile('qa/meetings/results.json',JSON.stringify({checks,errors,fixture:'Mocked API responses; no live school records changed'},null,2));
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
 await family.context.close();await teacher.context.close();
}finally{await browser.close();}