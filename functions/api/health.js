import { json } from '../_lib/http.js';
import { readSite } from '../_lib/db.js';

// Public, read-only liveness probe for OTHRYS monitoring.
// Never expose the D1 database ID, site configuration or credentials.
export async function onRequestGet({ env }) {
  const headers = { 'X-Robots-Tag': 'noindex, nofollow, noarchive' };
  try {
    const site = await readSite(env);
    if (!Number.isSafeInteger(site.version) || site.version < 1 ||
        !site.config?.hours || !Array.isArray(site.config?.services)) {
      throw new Error('Invalid stored config');
    }
    return json({ status: 'ok' }, 200, headers);
  } catch {
    return json({ status: 'unavailable' }, 503, headers);
  }
}
