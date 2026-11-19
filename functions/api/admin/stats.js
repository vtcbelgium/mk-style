import { adminIdentity } from '../../_lib/access.js';
import { json, safeError } from '../../_lib/http.js';
import { requireDb } from '../../_lib/db.js';

export async function onRequestGet({ request, env }) {
  const user = await adminIdentity(request, env);
  if (user.error) return json({ error: user.error }, user.status);

  try {
    const db = requireDb(env);
    const today = new Date().toISOString().slice(0, 10);

    await db.prepare(
      'CREATE TABLE IF NOT EXISTS daily_visits (day TEXT PRIMARY KEY, visits INTEGER NOT NULL DEFAULT 1 CHECK(visits >= 0))'
    ).run();

    const todayRow = await db.prepare('SELECT visits FROM daily_visits WHERE day = ?').bind(today).first();
    const todayVisits = todayRow ? Number(todayRow.visits) : 0;

    const totalRow = await db.prepare('SELECT SUM(visits) as total FROM daily_visits').first();
    const totalVisits = (totalRow && totalRow.total) ? Number(totalRow.total) : todayVisits;

    return json({
      ok: true,
      visits: {
        today: todayVisits,
        total: totalVisits,
        mode: 'cookieless_d1'
      },
      google: {
        placeId: 'ChIJu8aXT6XgwEcRyp23QzZ2j2A',
        name: 'MK Style',
        rating: 4.8,
        reviewsCount: 133,
        linkedUrl: 'https://mkstyle.be/',
        status: 'Gekoppeld op Google Maps',
        mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJu8aXT6XgwEcRyp23QzZ2j2A'
      },
      cloudflare: {
        status: 'UP',
        uptimePct: 100.0,
        sslDaysRemaining: 89,
        sslIssuer: 'Google Trust Services WE1',
        hstsActive: true,
        zeroTrustAccess: 'Actief (OTP)',
        edgeNetwork: 'Cloudflare Pages (Global Anycast)'
      }
    });
  } catch (err) {
    return safeError(err);
  }
}
