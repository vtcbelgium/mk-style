import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet as readAdmin, onRequestPatch as patchAdmin} from '../functions/api/admin/config.js';
import {onRequestGet as history} from '../functions/api/admin/history.js';
import {onRequestPost as propose} from '../functions/api/admin/propose.js';
import {onRequestPost as undo} from '../functions/api/admin/undo.js';

const routes=[
 ['GET','/api/admin/config',readAdmin],
 ['PATCH','/api/admin/config',patchAdmin],
 ['GET','/api/admin/history',history],
 ['POST','/api/admin/propose',propose],
 ['POST','/api/admin/undo',undo]
];
for (const [method,path,handler] of routes) {
 test(method+' '+path+' rejects preview visitors without configured Access',async()=>{
   const request=new Request('https://feat-production-readiness-20.mk-style.pages.dev'+path,{
     method,headers:method==='GET'?{}:{Origin:'https://feat-production-readiness-20.mk-style.pages.dev'},
     ...(method==='GET'?{}:{body:'{}'})
   });
   const response=await handler({request,env:{}});
   assert.equal(response.status,503);
   assert.match(response.headers.get('Content-Type')||'',/application\/json/);
 });
 test(method+' '+path+' rejects missing Access token even with policy configured',async()=>{
   const url='https://mk38style.be'+path;
   const request=new Request(url,{
     method,headers:method==='GET'?{}:{Origin:'https://mk38style.be'},
     ...(method==='GET'?{}:{body:'{}'})
   });
   const env={TEAM_DOMAIN:'https://example.cloudflareaccess.com',POLICY_AUD:'fake-aud',ADMIN_EMAILS:'38mkstyle@gmail.com'};
   const response=await handler({request,env});
   assert.equal(response.status,401);
 });
}
