import { json, safeError } from '../_lib/http.js';
import { requireDb } from '../_lib/db.js';

export async function onRequestPost({ request, env }) {
  try {
    const db = requireDb(env);
    const day = new Date().toISOString().slice(0, 10);
    // Ensure table exists fail-soft
    await db.prepare(
      'CREATE TABLE IF NOT EXISTS daily_visits (day TEXT PRIMARY KEY, visits INTEGER NOT NULL DEFAULT 1 CHECK(visits >= 0))'
    ).run();
    await db.prepare(
      'INSERT INTO daily_visits (day, visits) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET visits = visits + 1'
    ).bind(day).run();
    return json({ ok: true, day }, 200, { 'Cache-Control': 'no-store' });
  } catch (err) {
    return safeError(err);
  }
}
