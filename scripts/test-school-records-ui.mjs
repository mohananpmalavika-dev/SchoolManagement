import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base=process.env.UI_BASE_URL||'http://127.0.0.1:3111';
const output=new URL('../qa/school-records/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const checks=[],errors=[],writes=[];
const records={
  students:[{id:'student-1',name:'Anu Nair',firstName:'Anu',lastName:'Nair',admissionNumber:'S-001',dateOfBirth:'2020-01-01',admissionDate:'2026-04-01',gender:'FEMALE',currentClassId:'class-1',status:'ACTIVE'}],
  classes:[{id:'class-1',name:'Class 1'}],
  guardians:[{id:'guardian-1',name:'Parent Nair',firstName:'Parent',lastName:'Nair',phone:'9847012345',email:'parent@example.test',userId:'parent-account'}],
  'guardian-accounts':[{id:'parent-account',firstName:'Parent',lastName:'Nair',role:'PARENT'}],
  'student-accounts':[{id:'student-account',firstName:'Anu',lastName:'Nair',role:'STUDENT'}],
  'guardian-links':[{id:'link-1',guardianId:'guardian-1',studentId:'student-1',guardianName:'Parent Nair',studentName:'Anu Nair',relationship:'MOTHER'}],
  years:[{id:'year-1',name:'2026–27',startDate:'2026-04-01',endDate:'2027-03-31'}],
  terms:[],subjects:[],schools:[],
  inventory:[{id:'item-1',name:'Art supplies',category:'ART',quantity:5,unit:'box',reorderLevel:2}],
  books:[{id:'book-1',title:'Reading time',author:'Author',quantity:1,available:0}],
  borrowings:[{id:'loan-1',bookId:'book-1',bookTitle:'Reading time',borrowerId:'student-1',borrowerName:'Anu Nair',dueDate:'2030-01-01',status:'BORROWED'}],
  tickets:[],
  vehicles:[],routes:[],
};
async function session(role){
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
  await context.addInitScript(()=>localStorage.setItem('accessToken','qa-access'));
  await context.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname.replace(/^\/api\/v1/,'/api');
    const method=route.request().method();
    const ok=data=>route.fulfill({json:{success:true,data}});
    if(path==='/api/auth/me')return ok({id:'user-'+role,firstName:'School',lastName:'Staff',role,tenantId:'tenant-1'});
    if(path==='/api/workspace/users')return route.fulfill({status:403,json:{message:'Administrator access required'}});
    if(path.startsWith('/api/workspace/')){
      const [,resource,id]=path.split('/workspace/')[1].match(/^([^/]+)(?:\/([^/]+))?/)||[];
      if(method==='GET')return ok(records[resource]||[]);
      const body=route.request().postDataJSON();writes.push({path,method,body});
      if(method==='PATCH')Object.assign(records[resource]?.find(row=>row.id===id)||{},body.data);
      return ok({id:id||'saved-record'});
    }
    return ok([]);
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  return {page,context};
}
async function save(page){await page.getByRole('button',{name:'Save changes',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});}
try{
  const {page,context}=await session('RECEPTIONIST');
  await page.goto(base+'/school/guardians',{timeout:120000});
  await page.getByRole('button',{name:'Add guardian',exact:true}).click();
  await page.getByRole('button',{name:/More details/}).click();
  await page.getByRole('dialog').getByLabel('Portal account',{exact:true}).selectOption('parent-account');
  await page.getByRole('dialog').getByLabel('First name',{exact:false}).fill('New');
  await page.getByRole('dialog').getByLabel('Last name',{exact:false}).fill('Parent');
  await page.getByRole('dialog').getByLabel('Phone',{exact:false}).fill('9847012345');
  await page.getByRole('button',{name:'Create record',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal(writes.at(-1).body.data.userId,'parent-account');
  checks.push('Receptionist creates a guardian using scoped parent-account choices without administrator directory access');
  await page.getByRole('button',{name:'Edit Parent Nair',exact:true}).click();
  await page.getByRole('dialog').getByLabel('Email',{exact:true}).fill('');
  await page.getByRole('dialog').getByLabel('Portal account',{exact:true}).selectOption('');
  await save(page);
  assert.equal(writes.at(-1).body.data.email,null);assert.equal(writes.at(-1).body.data.userId,null);
  checks.push('Clearing guardian email and portal link sends explicit removals');
  await page.getByRole('button',{name:'Family connections',exact:true}).click();
  await page.getByRole('button',{name:'Edit Parent Nair',exact:true}).click();
  await page.getByRole('dialog').getByLabel('Relationship',{exact:false}).selectOption('GUARDIAN');await save(page);
  assert.equal(writes.at(-1).body.data.relationship,'GUARDIAN');
  checks.push('Existing guardian/student relationships can be corrected');
  await page.goto(base+'/school/students',{timeout:120000});
  await page.getByRole('button',{name:'Edit Anu Nair',exact:true}).click();
  await page.getByRole('dialog').getByLabel('Student portal account',{exact:true}).selectOption('student-account');
  await page.getByRole('dialog').getByLabel('Class',{exact:true}).selectOption('');await save(page);
  assert.equal(writes.at(-1).body.data.userId,'student-account');assert.equal(writes.at(-1).body.data.currentClassId,null);
  checks.push('Student directory links student logins and can clear a class allocation');
  await page.goto(base+'/school/support',{timeout:120000});
  await page.getByRole('button',{name:'Add record',exact:true}).click();
  await page.getByRole('dialog').getByLabel('Subject',{exact:false}).fill('Portal access');
  await page.getByRole('dialog').getByLabel('Description',{exact:false}).fill('Please check this portal account.');
  await page.getByRole('button',{name:'Create record',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal(writes.at(-1).path,'/api/workspace/tickets');
  checks.push('Operational staff can open school support tickets');
  await context.close();
  const admin=await session('SCHOOL_ADMIN');
  await admin.page.goto(base+'/school/academics',{timeout:120000});
  await admin.page.getByRole('button',{name:'Edit 2026–27',exact:true}).click();
  await admin.page.getByRole('dialog').getByLabel('End date',{exact:false}).fill('2027-03-30');await save(admin.page);
  assert.equal(writes.at(-1).body.data.endDate,'2027-03-30');
  checks.push('Academic year dates are editable through the setup screen');
  await admin.page.getByRole('button',{name:'Classes',exact:true}).click();
  await admin.page.getByRole('button',{name:'Add record',exact:true}).click();
  const levels=await admin.page.getByRole('dialog').getByLabel('Education level',{exact:false}).locator('option').evaluateAll(options=>options.map(option=>option.value));
  assert.ok(levels.includes('MIDDLE')&&levels.includes('SECONDARY'));
  assert.ok(!levels.includes('JUNIOR_SECONDARY'));
  await admin.page.getByRole('button',{name:'Cancel',exact:true}).click();
  checks.push('Academic setup uses the supported middle and secondary education levels');
  await admin.page.goto(base+'/school/inventory',{timeout:120000});
  await admin.page.getByRole('button',{name:'Edit Art supplies',exact:true}).click();
  await admin.page.getByRole('dialog').getByLabel('Quantity',{exact:false}).fill('0');await save(admin.page);
  assert.equal(writes.at(-1).body.data.quantity,0);
  checks.push('Inventory edits retain a zero stock count');
  await admin.page.goto(base+'/school/library',{timeout:120000});
  await admin.page.getByRole('button',{name:'Book loans',exact:true}).click();
  await admin.page.getByText('Anu Nair',{exact:true}).waitFor();
  await admin.page.getByRole('button',{name:'Return',exact:true}).click();
  await admin.page.getByRole('status').filter({hasText:'Return completed'}).waitFor();
  assert.equal(writes.at(-1).path,'/api/workspace/borrowings/loan-1/return');
  checks.push('Library loans identify the borrower by name and save returns');
  await admin.page.goto(base+'/school/transport/setup',{timeout:120000});
  await admin.page.getByRole('heading',{name:'Vehicles',exact:true}).waitFor();
  await admin.page.getByRole('button',{name:'Add record',exact:true}).click();
  await admin.page.getByRole('dialog').getByLabel('Registration number',{exact:false}).fill('KL-01-QA-1001');
  await admin.page.getByRole('dialog').getByLabel('Capacity',{exact:false}).fill('20');
  await admin.page.getByRole('button',{name:'Create record',exact:true}).click();
  await admin.page.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal(writes.at(-1).path,'/api/workspace/vehicles');
  await admin.page.getByRole('button',{name:'Routes',exact:true}).click();
  await admin.page.getByRole('button',{name:'Add record',exact:true}).click();
  await admin.page.getByRole('dialog').getByLabel('Name',{exact:false}).fill('School pickup');
  await admin.page.getByRole('button',{name:'Create record',exact:true}).click();
  await admin.page.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal(writes.at(-1).path,'/api/workspace/routes');
  assert.equal(await admin.page.getByRole('link',{name:'Manage stops, drivers & trips',exact:true}).getAttribute('href'),'/school/transport');
  assert.ok(!writes.some(write=>write.path.startsWith('/api/transport/')));
  await admin.page.screenshot({path:new URL('transport-setup.png',output).pathname.replace(/^\/(?:([A-Za-z]):)/,'$1:'),fullPage:true});
  checks.push('Transport setup saves vehicles and routes to the same durable API used by live trips');
  assert.deepEqual(errors,[]);
  await writeFile(new URL('results.json',output),JSON.stringify({checks,errors},null,2));
  console.log(JSON.stringify({passed:checks.length,checks},null,2));
  await admin.context.close();
}finally{await browser.close();}
