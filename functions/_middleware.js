import { adminIdentity } from './_lib/access.js';

// Public development preview: no extra password for the website or admin UI.
// Every /api/admin/* request still validates its Access JWT server-side.
// On production custom hosts, all Pages aliases (/admin, /admin/, /admin.html)
// require an Access JWT; Cloudflare Pages may rewrite *.html routes.
// This defends the admin UI if an edge Access rule is accidentally disabled.
export async function onRequest({request, env = {}, next}) {
  const url = new URL(request.url);
  const isPreview = url.hostname.toLowerCase().endsWith('.pages.dev');
  const isAdminPage = ['/admin', '/admin/', '/admin.html'].includes(url.pathname);
  if (!isPreview && isAdminPage) {
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
  if (!isPreview && !isAdminPage) return response;
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  if (isPreview || isAdminPage) {
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  return new Response(response.body, {
    status:response.status,statusText:response.statusText,headers
  });
}
