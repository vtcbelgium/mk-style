import { json, safeError } from '../_lib/http.js';
import { readSite } from '../_lib/db.js';
export async function onRequestGet({env}) {
  try {
    const {version,config} = await readSite(env);
    return json({version,config},200,{'Cache-Control':'public, max-age=15, must-revalidate'});
  } catch(err) { return safeError(err); }
}

export async function onRequestHead(context) {
  const res = await onRequestGet(context);
  return new Response(null, { status: res.status, headers: res.headers });
}
