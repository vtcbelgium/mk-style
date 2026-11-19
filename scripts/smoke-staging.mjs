// Read-only staging smoke check; never writes business data or accesses private admin APIs.
// Safe to run after preview deployments or manually: npm run smoke:staging
const base = new URL(process.env.MK_STYLE_STAGING_URL ||
  'https://feat-production-readiness-20.mk-style.pages.dev/');
const requireStatus = async(path,statuses,checks={})=>{
  const url=new URL(path,base);
  const method=checks.method||'GET';
  const response=await fetch(url,{
    redirect:'follow',method,
    ...(method==='POST'?{headers:{Origin:base.origin,'Content-Type':'application/json'},body:'{}'}:{}),
    signal:AbortSignal.timeout(12000)
  });
  const status=response.status;
  if(!statuses.includes(status))throw new Error(path+': unexpected HTTP '+status);
  const robots=response.headers.get('x-robots-tag')||'';
  if(checks.noindex&&!/noindex/i.test(robots))throw new Error(path+': missing staging noindex header');
  if(checks.csp){
    const csp=response.headers.get('content-security-policy')||'';
    if(!csp.includes("default-src 'self'")||
       !csp.includes("script-src 'self'")||
       !csp.includes("font-src 'self'")||
       /fonts\.googleapis|fonts\.gstatic/i.test(csp)) throw new Error(path+': invalid or leaky CSP header');
    if(response.headers.get('x-content-type-options')!=='nosniff')
      throw new Error(path+': missing X-Content-Type-Options nosniff header');
  }
  if(checks.seo){
    const html=await response.text();
    if(!html.includes('MK Style CommV.')||
       !html.includes('query_place_id=ChIJu8aXT6XgwEcRyp23QzZ2j2A')||
       !html.includes('"@type": "WebSite"')||
       html.includes('"@type": "FAQPage"')||
       html.includes('fonts.googleapis.com')||
       html.includes('fonts.gstatic.com')||
       !html.includes('privacy.html')) throw new Error(path+': missing local SEO/privacy/self-hosted-font content');
  }
  if(checks.privacy){
    const html=await response.text();
    if(!html.includes('MK Style CommV.')||
       !html.includes('BE1004.134.102')||
       !html.includes('Gegevensbeschermingsautoriteit')||
       html.includes('fonts.googleapis.com')||
       html.includes('fonts.gstatic.com')) throw new Error(path+': invalid GDPR privacy page content');
  }
  if(checks.font){
    const contentType=response.headers.get('content-type')||'';
    const bytes=await response.arrayBuffer();
    if(!/font\/woff2|application\/octet-stream/i.test(contentType)||bytes.byteLength<=1000)
      throw new Error(path+': invalid self-hosted woff2 response');
  }
  if(checks.health){
    const payload=await response.json();
    if(payload?.status!=='ok'||Object.keys(payload).length!==1) throw new Error(path+': unhealthy or over-sharing status');
  }
  if(checks.json){
    const payload=await response.json();
    if(payload?.config?.shopName!=='MK Style'||!Number.isSafeInteger(payload.version))
      throw new Error(path+': missing MK Style D1 configuration');
  }
  console.log(path+': '+status+' OK');
};
await requireStatus('/',[200],{noindex:true,seo:true,csp:true});
await requireStatus('/privacy.html',[200],{noindex:true,privacy:true,csp:true});
await requireStatus('/admin.html',[200],{noindex:true});
await requireStatus('/admin',[200],{noindex:true});
await requireStatus('/nonexistent-mk-style-health-check-page',[404],{noindex:true});
await requireStatus('/assets/js/main.js',[200],{noindex:true});
await requireStatus('/assets/css/fonts.css',[200],{noindex:true});
await requireStatus('/assets/fonts/outfit-latin.woff2',[200],{noindex:true,font:true});
await requireStatus('/api/config',[200],{noindex:true,json:true});
await requireStatus('/api/health',[200],{noindex:true,health:true});
// No credentials, even from environment: all administrative endpoints must fail closed.
await requireStatus('/api/admin/config',[401,403,503],{noindex:true});
await requireStatus('/api/admin/history',[401,403,503],{noindex:true});
await requireStatus('/api/admin/social-draft',[401,403,503],{noindex:true,method:'POST'});
await requireStatus('/api/admin/propose',[401,403,503],{noindex:true,method:'POST'});
await requireStatus('/api/admin/undo',[401,403,503],{noindex:true,method:'POST'});
console.log('MK Style staging smoke checks passed (read-only).');
