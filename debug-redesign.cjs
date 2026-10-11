const { chromium } = require('./node_modules/.pnpm/playwright@1.64.0/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.addInitScript(()=>localStorage.setItem('accessToken','qa-token'));
 await context.route('**/api/**',async r=>{
  const p=new URL(r.request().url()).pathname;
  console.log('request',p);
  await r.fulfill({json:{success:true,data:p.endsWith('/auth/me')?{id:'u',firstName:'Amara',lastName:'Mwangi',email:'test@example.test',role:'SCHOOL_ADMIN',tenantId:'t'}:p.endsWith('/overview')?{students:1248,staff:86,balance:24000000,attendanceTotal:100,attendanceRate:96,weekly:[],events:[],activities:[]}:[]}});
 });
 const page=await context.newPage();
 page.on('pageerror',e=>console.log('ERROR',e.message));
 page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,400));});
 await page.goto('http://localhost:3105/school/dashboard',{timeout:120000});
 await page.waitForTimeout(6000);
 console.log(await page.locator('body').innerText());
 await page.screenshot({path:'qa/redesign/debug.png',fullPage:true});
 await browser.close();
})().catch(console.error);
