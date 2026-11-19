// Read-only staging smoke check; never writes business data or accesses private admin APIs.
// Safe to run after preview deployments or manually: npm run smoke:staging
const base = new URL(process.env.MK_STYLE_STAGING_URL ||
  'https://feat-production-readiness-20.mk-style.pages.dev/');
const requireStatus = async(path,statuses,checks={})=>{
  const url=new URL(path,base);
  const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(12000)});
  const status=response.status;
  if(!statuses.includes(status))throw new Error(path+': unexpected HTTP '+status);
  const robots=response.headers.get('x-robots-tag')||'';
  if(checks.noindex&&!/noindex/i.test(robots))throw new Error(path+': missing staging noindex header');
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
await requireStatus('/',[200],{noindex:true});
await requireStatus('/admin.html',[200],{noindex:true});
await requireStatus('/admin',[200],{noindex:true});
await requireStatus('/nonexistent-mk-style-health-check-page',[404],{noindex:true});
await requireStatus('/assets/js/main.js',[200],{noindex:true});
await requireStatus('/api/config',[200],{noindex:true,json:true});
await requireStatus('/api/health',[200],{noindex:true,health:true});
// No credentials, even from environment: all administrative endpoints must fail closed.
await requireStatus('/api/admin/config',[401,403,503],{noindex:true});
await requireStatus('/api/admin/history',[401,403,503],{noindex:true});
console.log('MK Style staging smoke checks passed (read-only).');
