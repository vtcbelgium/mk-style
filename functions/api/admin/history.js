import { adminIdentity } from '../../_lib/access.js';
import { json,safeError } from '../../_lib/http.js';
import { readSite,requireDb } from '../../_lib/db.js';
export async function onRequestGet({request,env}) {
  const user=await adminIdentity(request,env);
  if(user.error) return json({error:user.error},user.status);
  try {
    const {version}=await readSite(env);
    const db=requireDb(env);
    const {results}=await db.prepare(
      'SELECT version, actor, source, created_at FROM site_revisions ORDER BY version DESC LIMIT 30'
    ).all();
    return json({currentVersion:version,history:results||[]});
  } catch(err){return safeError(err);}
}
