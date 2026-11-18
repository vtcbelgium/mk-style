// Staging is private. The public production site becomes available only on its approved custom domain.
// This runs before static pages, images and API routes, including directly guessed URLs.
const previewHeaders = {
  'Cache-Control':'no-store',
  'X-Robots-Tag':'noindex, nofollow, noarchive',
  'X-Content-Type-Options':'nosniff'
};
async function samePassword(given, expected) {
  const enc = new TextEncoder();
  const [a,b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(given)),
    crypto.subtle.digest('SHA-256', enc.encode(expected))
  ]);
  const aa = new Uint8Array(a), bb = new Uint8Array(b);
  let diff = 0;
  for(let i=0;i<aa.length;i++) diff |= aa[i]^bb[i];
  return diff===0;
}
export async function onRequest({request,env,next}) {
  const host = new URL(request.url).hostname.toLowerCase();
  const protectedEnvironment = host.endsWith('.pages.dev') || env.STAGING_GATE_REQUIRED !== 'false';
  if (!protectedEnvironment) return next();
  const password=String(env.STAGING_ACCESS_PASSWORD||'');
  if(password.length<24) return new Response('MK Style staging is nog niet toegankelijk.',{
    status:503,headers:previewHeaders
  });
  let authorized=false;
  const authorization=request.headers.get('Authorization')||'';
  const match=/^Basic\s+([A-Za-z0-9+/=]+)$/.exec(authorization);
  if(match){
    try{
      const decoded=atob(match[1]), colon=decoded.indexOf(':');
      const name=decoded.slice(0,colon), supplied=decoded.slice(colon+1);
      if(colon>0 && name==='mkstyle-staging') authorized=await samePassword(supplied,password);
    }catch{ /* malformed header, deny */ }
  }
  if(!authorized) return new Response('Deze omgeving is alleen voor de ontwikkelaar.',{
    status:401,headers:{...previewHeaders,'WWW-Authenticate':'Basic realm="MK Style staging", charset="UTF-8"'}
  });
  const response=await next();
  const headers=new Headers(response.headers);
  headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
  headers.set('Cache-Control','no-store');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
