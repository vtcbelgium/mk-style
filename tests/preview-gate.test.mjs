import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware.js';
import { adminIdentity } from '../functions/_lib/access.js';

async function request(path, hostname = 'feat-production-readiness-20.mk-style.pages.dev') {
  let nextCalls = 0;
  const response = await onRequest({
    request:new Request('https://' + hostname + path),
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
