import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const base=process.env.UI_BASE_URL || 'http://127.0.0.1:3127';
const out=new URL('../qa/preschool-academics/',import.meta.url); await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}); const checks=[], errors=[];
async function session(programme, multiple=false){
 const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
 await context.addInitScript(()=>localStorage.setItem('accessToken','preschool-academics-fixture'));
 const schools=[{id:'22222222-2222-4222-8222-222222222222',name:'Puthiyakaavu',programme,educationLevel:programme==='PRESCHOOL'?['PRE_PRIMARY']:['PRIMARY']}];
 if(multiple)schools.push({id:'33333333-3333-4333-8333-333333333333',name:'Regular campus',programme:'STANDARD',educationLevel:['PRIMARY']});
 const classes=[], writes=[];
 await context.route('**/api/**',route=>{
  const path=new URL(route.request().url()).pathname.replace(/^\/api\/v1/,'');const method=route.request().method();const ok=data=>route.fulfill({json:{success:true,data}});
  if(path==='/auth/me')return ok({id:'fixture-principal',tenantId:'fixture-school',role:'PRINCIPAL',firstName:'Preschool',lastName:'Principal'});
  if(path==='/preschool/navigation')return ok({programme:multiple?'COMBINED':programme});
  if(path==='/workspace/schools')return ok(schools);
  if(path==='/workspace/classes'){
   if(method==='GET')return ok(classes);
   const data=route.request().postDataJSON().data; writes.push(data);classes.push({id:'class-1',...data,studentCount:0});return ok({id:'class-1'});
  }
  if(path.startsWith('/workspace/classes/')&&method==='PATCH'){const data=route.request().postDataJSON().data;writes.push(data);Object.assign(classes[0],data);return ok({id:'class-1'});}
  if(path==='/preschool/options')return ok({today:'2026-11-19',timezone:'Asia/Kolkata',schools,classes,staff:[],students:[],assignments:[]});
  return ok([]);
 });
 const page=await context.newPage();page.setDefaultNavigationTimeout(120000);page.on('pageerror',e=>errors.push(e.message));return{context,page,writes,classes};
}
try{
 const s=await session('PRESCHOOL'),p=s.page;
 await p.goto(base+'/school/academics');await p.getByRole('heading',{name:'Preschool classes',exact:true}).waitFor();
 assert.equal(await p.getByRole('button',{name:'Subjects',exact:true}).count(),0);
 assert.equal(await p.getByRole('link',{name:/Year-end/}).count(),0);
 await p.getByRole('button',{name:'Find a page',exact:true}).click();
 const names=await p.getByRole('dialog').getByRole('link').allTextContents();
 for(const label of ['Gradebook','Examinations','Report cards','Timetable','Year-end promotion','Assignments & resources','Classroom check-in','Attendance'])assert(!names.some(name=>name.trim()===label),label+' must not appear for a preschool');
 assert(names.some(name=>name.trim()==='Classes & school years'));await p.keyboard.press('Escape');
 await p.getByRole('button',{name:'Add class',exact:true}).click();
 const modal=p.getByRole('dialog');await modal.getByLabel('Preschool stage',{exact:false}).waitFor();
 assert.equal(await modal.getByLabel('Campus',{exact:false}).inputValue(),'22222222-2222-4222-8222-222222222222');
 assert.equal(await modal.getByLabel('Education level',{exact:false}).count(),0);
 assert.deepEqual(await modal.getByLabel('Preschool stage',{exact:false}).locator('option').allTextContents(),['Select preschool stage','Playgroup','Nursery','LKG','UKG']);
 await modal.getByLabel('Class name',{exact:false}).fill('Nursery A');await modal.getByLabel('Preschool stage',{exact:false}).selectOption('NURSERY');
 await p.screenshot({path:fileURLToPath(new URL('preschool-add-class.png',out)),fullPage:true,animations:'disabled'});
 await modal.getByRole('button',{name:'Create record',exact:true}).click();await p.getByRole('dialog').waitFor({state:'hidden'});
 assert.deepEqual(s.writes[0],{name:'Nursery A',schoolId:'22222222-2222-4222-8222-222222222222',educationLevel:'PRE_PRIMARY',preschoolStage:'NURSERY',level:'Nursery'});
 await p.getByText('Pre-primary (preschool)',{exact:true}).waitFor();
 await p.getByRole('button',{name:'Edit Nursery A',exact:true}).click();await modal.getByLabel('Preschool stage',{exact:false}).selectOption('LKG');
 await modal.getByRole('button',{name:'Save changes',exact:true}).click();await modal.waitFor({state:'hidden'});assert.equal(s.writes[1].preschoolStage,'LKG');
 checks.push('Preschool academic flow hides school-age menus and subjects/promotion, creates stage-ready pre-primary classes, and preserves stage selection on edits');
 for(const width of [768,390,320]){await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await p.getByRole('button',{name:'Add class',exact:true}).click();await modal.getByLabel('Preschool stage',{exact:false}).waitFor();
 await p.screenshot({path:fileURLToPath(new URL('preschool-add-class-mobile.png',out)),fullPage:true,animations:'disabled'});await modal.getByRole('button',{name:'Cancel',exact:true}).click();
 for(const path of ['/school/examinations','/school/grades','/school/academics/promotion']){await p.goto(base+path);await p.waitForURL('**/school/preschool');}
 checks.push('Preschool setup fits mobile screens and school-age deep links return to the preschool workspace');await s.context.close();
 for(const programme of ['STANDARD','COMBINED']){
  const regular=await session(programme),p=regular.page;await p.goto(base+'/school/academics');await p.getByRole('button',{name:'Classes',exact:true}).click();await p.getByRole('button',{name:'Add class',exact:true}).click();
  const modal=p.getByRole('dialog');await modal.getByLabel('Education level',{exact:false}).waitFor();
  await modal.getByLabel('Class name',{exact:false}).fill('Class 1');await modal.getByLabel(/^Level/).fill('1');
  await modal.getByLabel('Education level',{exact:false}).selectOption('PRIMARY');await modal.getByRole('button',{name:'Create record',exact:true}).click();await modal.waitFor({state:'hidden'});
  assert.equal(regular.writes[0].educationLevel,'PRIMARY');assert(!('preschoolStage'in regular.writes[0]));await regular.context.close();
 }
 checks.push('Regular and combined schools retain regular classes and education-level choices');
 const mixed=await session('PRESCHOOL',true);await mixed.page.goto(base+'/school/academics');await mixed.page.getByRole('button',{name:'Classes',exact:true}).click();await mixed.page.getByRole('button',{name:'Add class',exact:true}).click();
 const m=mixed.page.getByRole('dialog');await m.getByLabel('Campus',{exact:false}).selectOption('22222222-2222-4222-8222-222222222222');await m.getByLabel('Preschool stage',{exact:false}).waitFor();assert.equal(await m.getByLabel('Education level',{exact:false}).count(),0);
 await m.getByLabel('Campus',{exact:false}).selectOption('33333333-3333-4333-8333-333333333333');await m.getByLabel('Education level',{exact:false}).waitFor();assert.equal(await m.getByLabel('Preschool stage',{exact:false}).count(),0);await mixed.context.close();
 checks.push('Mixed-campus class forms follow the selected campus rather than the overall tenant programme');
 assert.deepEqual(errors,[]);await writeFile(new URL('results.json',out),JSON.stringify({checks,errors,fixture:'Intercepted APIs; no production school records changed.'},null,2));console.log(JSON.stringify({passed:checks.length,checks},null,2));
}catch(error){for(const context of browser.contexts())for(const page of context.pages())console.error(page.url(),(await page.locator('body').innerText()).slice(-1800));console.error(errors);throw error;}finally{await browser.close();}
