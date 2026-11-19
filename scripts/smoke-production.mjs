// Read-only production acceptance gate.
// Run only AFTER Cloudflare zone activation, SSL and custom domain setup.
// It never logs in, reads secrets, changes D1, or publishes anything.
const origin='https://mk38style.be';
const request=async(path,options={})=>fetch(origin+path,{
  redirect:options.redirect||'manual',
  signal:AbortSignal.timeout(12000)
});
function expect(ok,message){if(!ok)throw new Error(message);}
function ok(response,path){expect(response.status===200,path+' returned HTTP '+response.status);}
const home=await request('/');
ok(home,'homepage');
const html=await home.text();
expect(/<title>MK Style/.test(html),'Unexpected home page title');
expect(html.includes('MK Style CommV.')&&html.includes('38mkstyle@gmail.com'),
  'Public legal/contact footer is missing');
expect(!/noindex/i.test(home.headers.get('x-robots-tag')||''),
  'Production homepage is accidentally noindex');
const csp=home.headers.get('content-security-policy')||'';
expect(csp.includes("default-src 'self'")&&csp.includes("script-src 'self'"),
  'Production CSP is missing or too permissive');
expect(home.headers.get('x-content-type-options')==='nosniff',
  'Production X-Content-Type-Options is missing');
const missing=await request('/nonexistent-mk-style-launch-check');
expect(missing.status===404,'Unknown production URL must return HTTP 404');

const api=await request('/api/config');
ok(api,'public config');
const data=await api.json();
expect(data.config?.shopName==='MK Style'&&data.config?.legalName==='MK Style CommV.',
  'Public API does not return MK Style business identity');
expect(Array.isArray(data.config.services)&&data.config.services.length===6,
  'Expected six MK Style services in production D1');
const health=await request('/api/health');
ok(health,'health');
expect((await health.json()).status==='ok','Production D1 health check failed');
for(const path of ['/robots.txt','/sitemap.xml']){
 const r=await request(path);ok(r,path);
}
for(const path of ['/admin.html','/admin','/admin/','/api/admin/config','/api/admin/history']){
 const res=await request(path);
 // 503 means the Access policy is still unconfigured; that must BLOCK launch.
 const redirect=res.headers.get('location')||'';
 const isAccessRedirect=[301,302,303,307,308].includes(res.status)&&
   (/cloudflareaccess\.com/.test(redirect) ||
    redirect.includes('/cdn-cgi/access/login'));
 expect([401,403].includes(res.status)||isAccessRedirect,
   'Admin Access not ready or unauthorized endpoint exposed: '+path+' => '+res.status);
}
const www=await fetch('https://www.mk38style.be/',{redirect:'manual',signal:AbortSignal.timeout(12000)});
expect([301,302,307,308].includes(www.status),'www must redirect to canonical apex');
const location=new URL(www.headers.get('location')||'/', 'https://www.mk38style.be');
expect(location.origin===origin,'www redirect targets an unexpected host');
console.log('MK Style production acceptance checks passed (read-only).');
