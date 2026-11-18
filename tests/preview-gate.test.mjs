import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequest} from '../functions/_middleware.js';
const demoPass='example-testing-password-32-chars-long';
function run({url='https://staging.mk-style.pages.dev/',password=demoPass,auth='',gate='true'}={}){
  let requests=0;
  const p=onRequest({request:new Request(url,{headers:auth?{Authorization:auth}:{}}),
    env:{STAGING_GATE_REQUIRED:gate,STAGING_ACCESS_PASSWORD:password},
    next:async()=>{requests++;return new Response('private',{status:200});}});
  return p.then(r=>({response:r,nextCalls:requests}));
}
test('preview blocks unauthenticated requests including static assets',async()=>{
  for(const path of ['/','/assets/images/logo.webp','/api/config','/admin.html']){
    const {response,nextCalls}=await run({url:'https://preview.mk-style.pages.dev'+path});
    assert.equal(response.status,401);assert.equal(nextCalls,0);
    assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow, noarchive');
  }
});
test('preview fails closed without secret',async()=>{
  const {response,nextCalls}=await run({password:''});
  assert.equal(response.status,503);assert.equal(nextCalls,0);
});
test('valid preview basic authentication allows one request and noindex',async()=>{
  const header='Basic '+Buffer.from('mkstyle-staging:'+demoPass).toString('base64');
  const {response,nextCalls}=await run({auth:header});
  assert.equal(response.status,200);assert.equal(nextCalls,1);
  assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow, noarchive');
});
test('wrong preview password denied',async()=>{
  const header='Basic '+Buffer.from('mkstyle-staging:incorrect').toString('base64');
  const {response,nextCalls}=await run({auth:header});
  assert.equal(response.status,401);assert.equal(nextCalls,0);
});
test('production custom host is public; pages.dev remains gated',async()=>{
  const publicResult=await run({url:'https://mk38style.be/',gate:'false',password:''});
  assert.equal(publicResult.response.status,200);
  const pagesResult=await run({url:'https://mk-style.pages.dev/',gate:'false',password:''});
  assert.equal(pagesResult.response.status,503);
});
