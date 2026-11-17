import { InputError } from './site.js';
export function requireDb(env) {
  if (!env.DB || typeof env.DB.prepare !== 'function') throw new InputError('Database nog niet gekoppeld',503);
  return env.DB;
}
export async function readSite(env) {
  const db = requireDb(env);
  const row = await db.prepare('SELECT version, config_json FROM site_config WHERE id = ?').bind('main').first();
  if (!row) throw new InputError('Sitegegevens nog niet ingevoerd',503);
  return { version:row.version, config:JSON.parse(row.config_json), raw:row.config_json };
}
