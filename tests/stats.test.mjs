import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { generateKeyPair, SignJWT } from 'jose';
import { onRequestPost as recordVisit } from '../functions/api/visit.js';
import { onRequestGet as getStats } from '../functions/api/admin/stats.js';

function createMockD1() {
  const sqlite = new DatabaseSync(':memory:');
  return {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              const stmt = sqlite.prepare(sql);
              return stmt.get(...args);
            },
            async all() {
              const stmt = sqlite.prepare(sql);
              return { results: stmt.all(...args) };
            },
            async run() {
              const stmt = sqlite.prepare(sql);
              stmt.run(...args);
              return { success: true };
            }
          };
        },
        async first() {
          const stmt = sqlite.prepare(sql);
          return stmt.get();
        },
        async all() {
          const stmt = sqlite.prepare(sql);
          return { results: stmt.all() };
        },
        async run() {
          const stmt = sqlite.prepare(sql);
          stmt.run();
          return { success: true };
        }
      };
    }
  };
}

test('POST /api/visit records and increments daily visits without personal data', async () => {
  const db = createMockD1();
  const env = { DB: db };

  // First visit
  const res1 = await recordVisit({ request: new Request('https://mkstyle.be/api/visit', { method: 'POST' }), env });
  assert.equal(res1.status, 200);
  const data1 = await res1.json();
  assert.equal(data1.ok, true);

  // Second visit on same day
  const res2 = await recordVisit({ request: new Request('https://mkstyle.be/api/visit', { method: 'POST' }), env });
  assert.equal(res2.status, 200);

  // Verify in DB directly
  const row = await db.prepare('SELECT visits FROM daily_visits WHERE day = ?').bind(data1.day).first();
  assert.equal(row.visits, 2);
});

test('GET /api/admin/stats returns visits, Google Business Profile and Cloudflare metrics when authenticated', async () => {
  const db = createMockD1();
  const day = new Date().toISOString().slice(0, 10);
  await db.prepare('CREATE TABLE IF NOT EXISTS daily_visits (day TEXT PRIMARY KEY, visits INTEGER NOT NULL DEFAULT 1)').run();
  await db.prepare('INSERT INTO daily_visits (day, visits) VALUES (?, 15)').bind(day).run();

  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const team = 'https://fake-test-tenant.cloudflareaccess.com';
  const aud = 'mk-test-policy-aud';
  const email = '38mkstyle@gmail.com';

  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setIssuer(team)
    .setAudience(aud)
    .setExpirationTime('2h')
    .sign(privateKey);

  const jwk = await exportJWK(publicKey);
  jwk.kid = 'k1';
  jwk.alg = 'RS256';

  const origFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes('/cdn-cgi/access/certs')) {
      return new Response(JSON.stringify({ keys: [jwk] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return origFetch(url);
  };

  try {
    const env = {
      DB: db,
      TEAM_DOMAIN: team,
      POLICY_AUD: aud,
      ADMIN_EMAILS: email
    };
    const req = new Request('https://mkstyle.be/api/admin/stats', {
      headers: { 'Cf-Access-Jwt-Assertion': token }
    });
    const res = await getStats({ request: req, env });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.visits.today, 15);
    assert.equal(data.google.placeId, 'ChIJu8aXT6XgwEcRyp23QzZ2j2A');
    assert.equal(data.google.rating, 4.8);
    assert.equal(data.google.reviewsCount, 133);
    assert.equal(data.cloudflare.status, 'UP');
    assert.equal(data.cloudflare.sslDaysRemaining, 89);
  } finally {
    globalThis.fetch = origFetch;
  }
});

async function exportJWK(key) {
  const { exportJWK } = await import('jose');
  return exportJWK(key);
}
