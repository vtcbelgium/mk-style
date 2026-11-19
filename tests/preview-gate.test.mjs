import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware.js';
import { adminIdentity } from '../functions/_lib/access.js';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';

async function request(path, hostname = 'feat-production-readiness-20.mk-style.pages.dev', env = {}, headers = {}) {
  let nextCalls = 0;
  const response = await onRequest({
    request:new Request('https://' + hostname + path, {headers}),
    env,
    next:async()=>{nextCalls++;return new Response('ok', {status:200});}
  });
  return { response, nextCalls };
}
test('developer preview loads without an extra password for pages, assets and public API', async()=>{
  for(const path of ['/','/admin.html','/admin','/assets/js/admin-v2.js','/api/config']) {
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

test('production custom domain blocks every admin page alias before Cloudflare Access setup',async()=>{
  for(const path of ['/admin.html','/admin','/admin/']){
    const {response,nextCalls}=await request(path,'mk38style.be');
    assert.equal(response.status,503);
    assert.equal(nextCalls,0);
    assert.match(response.headers.get('Cache-Control'),/no-store/);
    assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
  }
});
test('production custom domain requires an Access JWT even when policy variables exist',async()=>{
  const env={TEAM_DOMAIN:'https://mkstyle-test.cloudflareaccess.com',
    POLICY_AUD:'test-app-audience',ADMIN_EMAILS:'38mkstyle@gmail.com'};
  for(const path of ['/admin.html','/admin','/admin/']){
    const {response,nextCalls}=await request(path,'mk38style.be',env);
    assert.equal(response.status,401);
    assert.equal(nextCalls,0);
  }
});
test('production public pages and public API are not gated by the admin middleware',async()=>{
  for(const path of ['/','/api/config','/assets/js/main.js']){
    const {response,nextCalls}=await request(path,'mk38style.be');
    assert.equal(response.status,200);
    assert.equal(nextCalls,1);
  }
});

test('signed Access JWT is required and allowed for production admin page',async t=>{
  const team='https://mk-style-middleware-test.cloudflareaccess.com',aud='mk-style-prod-owner';
  const {publicKey,privateKey}=await generateKeyPair('RS256');
  const jwk=await exportJWK(publicKey);
  Object.assign(jwk,{kid:'middleware-key',use:'sig',alg:'RS256'});
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async url=>{
    if(String(url)!==team+'/cdn-cgi/access/certs')throw Error('Unexpected outgoing fetch');
    return new Response(JSON.stringify({keys:[jwk]}),{headers:{'Content-Type':'application/json'}});
  };
  t.after(()=>{globalThis.fetch=originalFetch;});
  const env={TEAM_DOMAIN:team,POLICY_AUD:aud,ADMIN_EMAILS:'38mkstyle@gmail.com'};
  const issue=async(email,audience=aud)=>new SignJWT({email})
    .setProtectedHeader({alg:'RS256',kid:'middleware-key'})
    .setIssuer(team).setAudience(audience).setIssuedAt().setExpirationTime('30m')
    .sign(privateKey);
  const validJwt=await issue('38mkstyle@gmail.com');
  for(const path of ['/admin.html','/admin','/admin/']){
    const valid=await request(path,'mk38style.be',env,
      {'Cf-Access-Jwt-Assertion':validJwt});
    assert.equal(valid.response.status,200);
    assert.equal(valid.nextCalls,1);
    assert.match(valid.response.headers.get('cache-control'),/no-store/);
  }

  const wrongEmail=await request('/admin.html','mk38style.be',env,
    {'Cf-Access-Jwt-Assertion':await issue('random@example.com')});
  assert.equal(wrongEmail.response.status,403);
  assert.equal(wrongEmail.nextCalls,0);

  const wrongAudience=await request('/admin.html','mk38style.be',env,
    {'Cf-Access-Jwt-Assertion':await issue('38mkstyle@gmail.com','not-the-access-app')});
  assert.equal(wrongAudience.response.status,401);
  assert.equal(wrongAudience.nextCalls,0);
});
