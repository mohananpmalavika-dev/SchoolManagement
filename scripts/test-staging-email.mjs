import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
if(process.env.RELEASE_STAGING_CONFIRM!=='release_test')throw Error('Explicit isolated staging confirmation required');
const base='http://127.0.0.1:23001/api/v1',mail='http://127.0.0.1:28025/api/v1';
async function post(path,data,status=200){const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const body=await r.json();assert.equal(r.status,status);return body.data??body;}
const email='driver2@demoacademy.ac.ke';
await post('/auth/password-reset/request',{email});
let message;
for(let i=0;i<20;i++){const list=await(await fetch(mail+'/messages')).json();message=list.messages.find(m=>m.To.some(to=>to.Address===email));if(message)break;await new Promise(resolve=>setTimeout(resolve,500));}
assert(message,'Recovery email must arrive through real SMTP in local Mailpit');
const detail=await(await fetch(mail+'/message/'+message.ID)).json();
const token=/[?&]token=([a-f0-9]{64})/.exec(detail.HTML||detail.Text)?.[1];assert(token,'Email must contain the recovery link');
assert.equal((await post('/auth/password-reset/verify',{token})).valid,true);
await post('/auth/password-reset/reset',{token,newPassword:'StageRecovery@2026!'});
await post('/auth/login',{email,password:'StageRecovery@2026!'});
assert.equal((await post('/auth/password-reset/verify',{token})).valid,false);
// Return this isolated fixture to its documented test password using the ordinary account API.
const account=await post('/auth/login',{email,password:'StageRecovery@2026!'});
const r=await fetch(base+'/auth/password',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+account.accessToken},body:JSON.stringify({currentPassword:'StageRecovery@2026!',newPassword:'KryptonDemo@2026'})});assert.equal(r.status,200);
await writeFile('qa/release/email-results.json',JSON.stringify({time:new Date().toISOString(),checks:['Real SMTP delivery to local Mailpit','Recovery link verification','Password reset and login','Single-use recovery token','Fixture password restored']},null,2));
console.log('PASS 5 real SMTP and account recovery checks. No message was sent to a real mailbox.');
