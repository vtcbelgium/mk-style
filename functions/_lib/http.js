export function json(data,status=200,headers={}) {
  return new Response(JSON.stringify(data),{
    status,
    headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff', ...headers}
  });
}
export async function jsonBody(request,limit=10000) {
  const length = Number(request.headers.get('content-length')||0);
  if (length > limit) throw Object.assign(new Error('Aanvraag te groot'),{status:413});
  const raw = await request.text();
  if (raw.length > limit) throw Object.assign(new Error('Aanvraag te groot'),{status:413});
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error('Ongeldige JSON'),{status:400}); }
}
export function safeError(err) {
  if (err?.status && err.status < 500) return json({error:err.message},err.status);
  return json({error:'Interne fout; geen wijzigingen toegepast of resultaat nog te verifiëren'},503);
}
