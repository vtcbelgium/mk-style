import { adminIdentity } from './_lib/access.js';

// Public development preview: no extra password for the website or admin UI.
// Every /api/admin/* request still validates its Access JWT server-side.
// On the *production custom host*, /admin.html also requires an Access JWT.
// This defends the admin UI if an edge Access rule is accidentally disabled.
export async function onRequest({request, env = {}, next}) {
  const url = new URL(request.url);
  const isPreview = url.hostname.toLowerCase().endsWith('.pages.dev');
  if (!isPreview && url.pathname === '/admin.html') {
    const identity = await adminIdentity(request, env);
    if (identity.error) {
      return new Response(identity.error, {
        status:identity.status,
        headers:{
          'Cache-Control':'no-store',
          'X-Robots-Tag':'noindex, nofollow, noarchive',
          'X-Content-Type-Options':'nosniff'
        }
      });
    }
  }

  const response = await next();
  if (!isPreview && url.pathname !== '/admin.html') return response;
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  if (isPreview || url.pathname === '/admin.html') {
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  return new Response(response.body, {
    status:response.status,statusText:response.statusText,headers
  });
}
