import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
if(process.env.RELEASE_STAGING_CONFIRM!=='release_test')throw Error('Explicit isolated staging confirmation required');
const base='http://127.0.0.1:23001/api/v1',suffix=Date.now().toString(36),env=Object.fromEntries((await readFile('qa/release/api.env','utf8')).trim().split(/\r?\n/).map(line=>[line.slice(0,line.indexOf('=')),line.slice(line.indexOf('=')+1)]));
const checkout='fixture-checkout-'+suffix,merchant='fixture-merchant-'+suffix;
const provider=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;res.setHeader('Content-Type','application/json');if(req.url.startsWith('/oauth/'))res.end(JSON.stringify({access_token:'local-fixture-token',expires_in:'3600'}));else if(req.url==='/mpesa/stkpush/v1/processrequest'){const data=JSON.parse(body);assert.equal(data.Amount,10);res.end(JSON.stringify({MerchantRequestID:merchant,CheckoutRequestID:checkout,ResponseCode:'0',ResponseDescription:'Fixture accepted',CustomerMessage:'Fixture only'}));}else{res.statusCode=404;res.end('{}');}});
await new Promise(resolve=>provider.listen(23002,'0.0.0.0',resolve));
async function request(path,{token,method='GET',data,status=200}={}){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});const body=await r.json();assert.equal(r.status,status,path.split('?')[0]+': '+JSON.stringify(body.error||body.message||{}));return body.data??body;}
try{
 const login=async email=>(await request('/auth/login',{method:'POST',data:{email,password:'KryptonDemo@2026'}})).accessToken;
 const p=await login('principal@demoacademy.ac.ke'),f=await login('parent@demoacademy.ac.ke');
 const child=(await request('/operations/options',{token:f})).students[0],term=(await request('/workspace/terms',{token:p}))[0];
 const invoice=(await request('/workspace/invoices',{token:p})).find(x=>x.studentId===child.id&&x.balanceAmount>=1000);assert(invoice);
 const initiated=await request('/workspace/pay',{method:'POST',token:f,status:201,data:{invoiceId:invoice.id,phoneNumber:'254700000101',amount:1000}});assert.equal(initiated.checkoutRequestId,checkout);
 const payload=amount=>({Body:{stkCallback:{MerchantRequestID:merchant,CheckoutRequestID:checkout,ResultCode:0,ResultDesc:'Fixture payment',CallbackMetadata:{Item:[{Name:'Amount',Value:amount},{Name:'MpesaReceiptNumber',Value:'FIX-'+suffix},{Name:'TransactionDate',Value:20261012080000},{Name:'PhoneNumber',Value:254700000101}]}}}});
 await request('/mpesa/stk-push/callback',{method:'POST',data:payload(10),status:401});
 const callback='/mpesa/stk-push/callback?token='+encodeURIComponent(env.MPESA_CALLBACK_TOKEN);
 await request(callback,{method:'POST',data:payload(11),status:400});
 await Promise.all([1,2].map(()=>request(callback,{method:'POST',data:payload(10)})));
 const saved=(await request('/workspace/invoices',{token:p})).find(x=>x.id===invoice.id);assert.equal(saved.paidAmount,invoice.paidAmount+1000);assert.equal(saved.balanceAmount,invoice.balanceAmount-1000);
 const payments=await request('/workspace/payments',{token:p});assert.equal(payments.filter(x=>x.reference==='FIX-'+suffix).length,1);
 await writeFile('qa/release/payment-results.json',JSON.stringify({time:new Date().toISOString(),provider:'Local HTTP fixture, not Safaricom sandbox',checks:['STK initiation through HTTP provider fixture','Missing callback credential rejected','Mismatched amount rejected','Concurrent duplicate callbacks produce one payment','Invoice balance reconciled from saved payment']},null,2));
 console.log('PASS 5 payment integration checks using a local provider fixture. Live Safaricom validation remains separate.');
}finally{await new Promise(resolve=>provider.close(resolve));}
