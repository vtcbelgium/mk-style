// Development preview is public and intentionally has no extra password prompt.
// Administrative mutations remain protected by their own Cloudflare Access JWT
// verification and explicit email allowlist in functions/_lib/access.js.
export async function onRequest({request, next}) {
  const host = new URL(request.url).hostname.toLowerCase();
  const response = await next();
  if (!host.endsWith('.pages.dev')) return response;
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(response.body, {
    status: response.status, statusText: response.statusText, headers
  });
}
