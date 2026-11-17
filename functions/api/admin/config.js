import { adminIdentity,sameOriginMutation } from '../../_lib/access.js';
import { json,jsonBody,safeError } from '../../_lib/http.js';
import { readSite,requireDb } from '../../_lib/db.js';
import { applyChanges,InputError } from '../../_lib/site.js';
export async function onRequestGet({request,env}) {
  const user = await adminIdentity(request,env);
  if (user.error) return json({error:user.error},user.status);
  try {
    const {version,config} = await readSite(env);
    return json({version,config});
  } catch(err) { return safeError(err); }
}
export async function onRequestPatch({request,env}) {
  const user = await adminIdentity(request,env);
  if (user.error) return json({error:user.error},user.status);
  if (!sameOriginMutation(request)) return json({error:'Onjuiste herkomst van aanvraag'},403);
  try {
    const body = await jsonBody(request,20000);
    if (!Number.isSafeInteger(body.expectedVersion) || body.expectedVersion < 1) throw new InputError('Versie ontbreekt');
    if (!['manual','ai'].includes(body.source)) throw new InputError('Bron ontbreekt');
    const original = await readSite(env);
    if (original.version !== body.expectedVersion) return json({error:'Gegevens gewijzigd; herlaad en controleer opnieuw'},409);
    const next = applyChanges(original.config,body.changes);
    const serialized = JSON.stringify(next);
    if (serialized === original.raw) return json({version:original.version,config:next,unchanged:true});
    const db = requireDb(env), now = new Date().toISOString(), newVersion = original.version + 1;
    const results = await db.batch([
      db.prepare('UPDATE site_config SET config_json = ?, version = ?, updated_at = ? WHERE id = ? AND version = ?')
        .bind(serialized,newVersion,now,'main',original.version),
      db.prepare('INSERT OR IGNORE INTO site_revisions (version, before_json, after_json, actor, source, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(newVersion,original.raw,serialized,user.email,body.source,now)
    ]);
    if (results[0]?.meta?.changes !== 1) return json({error:'Conflict; herlaad de gegevens'},409);
    if (results[1]?.meta?.changes !== 1) throw new Error('Revisie niet geschreven');
    const verify = await readSite(env);
    if (verify.version !== newVersion || JSON.stringify(verify.config) !== serialized) throw new Error('Verificatie mislukt');
    return json({version:newVersion,config:verify.config,published:true});
  } catch(err) { return safeError(err); }
}
