import { adminIdentity,sameOriginMutation } from '../../_lib/access.js';
import { json,jsonBody,safeError } from '../../_lib/http.js';
import { readSite,requireDb } from '../../_lib/db.js';
import { InputError } from '../../_lib/site.js';
// One-step undo, with a new revision preserving immutable history.
export async function onRequestPost({request,env}) {
  const user=await adminIdentity(request,env);
  if(user.error) return json({error:user.error},user.status);
  if(!sameOriginMutation(request)) return json({error:'Onjuiste herkomst'},403);
  try {
    const body=await jsonBody(request,250);
    if(!Number.isSafeInteger(body.expectedVersion) || body.expectedVersion<2) throw new InputError('Ongeldige versie');
    const current=await readSite(env);
    if(current.version!==body.expectedVersion) return json({error:'Conflict; herlaad de gegevens'},409);
    const db=requireDb(env);
    const previous=await db.prepare('SELECT before_json FROM site_revisions WHERE version=?').bind(current.version).first();
    if(!previous?.before_json) return json({error:'Geen vorige versie om te herstellen'},404);
    // Confirm the revision stores valid JSON before writing.
    const original=JSON.parse(previous.before_json);
    if(!original.hours || !Array.isArray(original.services)) throw new Error('Ongeldige herstelgegevens');
    const now=new Date().toISOString(),version=current.version+1;
    const writes=await db.batch([
      db.prepare('UPDATE site_config SET config_json=?,version=?,updated_at=? WHERE id=? AND version=?')
        .bind(previous.before_json,version,now,'main',current.version),
      db.prepare('INSERT OR IGNORE INTO site_revisions (version,before_json,after_json,actor,source,created_at) '
        + 'SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM site_config WHERE id=? AND version=?)')
        .bind(version,current.raw,previous.before_json,user.email,'manual',now,'main',version)
    ]);
    if(writes[0]?.meta?.changes!==1)return json({error:'Conflict; herlaad de gegevens'},409);
    if(writes[1]?.meta?.changes!==1)throw new Error('Herstelrevisie ontbreekt');
    const verified=await readSite(env);
    if(verified.version!==version || verified.raw!==previous.before_json) throw new Error('Herstelcontrole faalde');
    return json({version,config:verified.config,published:true,restoredFrom:current.version});
  }catch(err){return safeError(err);}
}
