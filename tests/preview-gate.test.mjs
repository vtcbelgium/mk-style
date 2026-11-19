import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware.js';
import { adminIdentity } from '../functions/_lib/access.js';

async function request(path, hostname = 'feat-production-readiness-20.mk-style.pages.dev', env = {}) {
  let nextCalls = 0;
  const response = await onRequest({
    request:new Request('https://' + hostname + path),
    env,
    next:async()=>{nextCalls++;return new Response('ok', {status:200});}
  });
  return { response, nextCalls };
}
test('developer preview loads without an extra password for pages, assets and public API', async()=>{
  for(const path of ['/','/admin.html','/assets/js/admin-v2.js','/api/config']) {
    const {response,nextCalls} = await request(path);
    assert.equal(response.status,200);
    assert.equal(nextCalls,1);
    assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow, noarchive');
    assert.equal(response.headers.get('Cache-Control'),'no-store');
  }
});
test('production host is not altered by development preview middleware', async()=>{
  const {response,nextCalls}=await request('/','mk38style.be');
  assert.equal(response.status,200);
  assert.equal(nextCalls,1);
  assert.equal(response.headers.get('X-Robots-Tag'),null);
});
test('administrative API independently refuses access until Access is configured', async()=>{
  const identity=await adminIdentity(new Request('https://mk-style.pages.dev/api/admin/config'),{});
  assert.equal(identity.status,503);
  assert.ok(identity.error);
});

test('production custom domain blocks admin HTML before Cloudflare Access setup',async()=>{
  const {response,nextCalls}=await request('/admin.html','mk38style.be');
  assert.equal(response.status,503);
  assert.equal(nextCalls,0);
  assert.match(response.headers.get('Cache-Control'),/no-store/);
  assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
});
test('production custom domain requires an Access JWT even when policy variables exist',async()=>{
  const env={TEAM_DOMAIN:'https://mkstyle-test.cloudflareaccess.com',
    POLICY_AUD:'test-app-audience',ADMIN_EMAILS:'38mkstyle@gmail.com'};
  const {response,nextCalls}=await request('/admin.html','mk38style.be',env);
  assert.equal(response.status,401);
  assert.equal(nextCalls,0);
});
test('production public pages and public API are not gated by the admin middleware',async()=>{
  for(const path of ['/','/api/config','/assets/js/main.js']){
    const {response,nextCalls}=await request(path,'mk38style.be');
    assert.equal(response.status,200);
    assert.equal(nextCalls,1);
  }
});
