import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { parseDutchCommand, resolveDutchDate } from '../functions/_lib/nl-parser.js';
import { extractJsonObject, generateStructuredJson, hasConfiguredAiProvider } from '../functions/_lib/ai-provider.js';
import { onRequestPost as propose } from '../functions/api/admin/propose.js';
import { onRequestPost as socialDraft } from '../functions/api/admin/social-draft.js';

const baseConfig = JSON.parse(readFileSync(new URL('../data/site-config.json', import.meta.url), 'utf8'));

class MemoryD1 {
  constructor() {
    this.db = new DatabaseSync(':memory:');
    const schema = readFileSync(new URL('../migrations/0001_schema.sql', import.meta.url), 'utf8');
    this.db.exec(schema);
    this.db.prepare('INSERT INTO site_config(id, config_json, version, updated_at) VALUES (?, ?, ?, ?)')
      .run('main', JSON.stringify(baseConfig), 1, '2026-11-19T00:00:00Z');
  }
  prepare(sql) {
    const db = this.db;
    const call = (params) => ({
      async first() { return db.prepare(sql).get(...params) || null; },
      async all() { return { results: db.prepare(sql).all(...params) }; },
      async run() { const r = db.prepare(sql).run(...params); return { meta: { changes: r.changes } }; }
    });
    return { ...call([]), bind(...params) { return call(params); } };
  }
}

async function adminEnv(DB, extra = {}, fetchHandler = null) {
  const team = 'https://mkstyle-ai-test.cloudflareaccess.com';
  const aud = 'mk-style-ai-test';
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = 'ai-key'; publicJwk.use = 'sig'; publicJwk.alg = 'RS256';
  const jwt = await new SignJWT({ email: 'vtcbelgium@gmail.com' })
    .setProtectedHeader({ alg: 'RS256', kid: 'ai-key' })
    .setIssuer(team).setAudience(aud).setIssuedAt().setExpirationTime('2h').sign(privateKey);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url === team + '/cdn-cgi/access/certs') {
      return new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (fetchHandler) return fetchHandler(url, init);
    throw new Error('Unexpected fetch: ' + url);
  };
  return {
    env: { TEAM_DOMAIN: team, POLICY_AUD: aud, ADMIN_EMAILS: 'vtcbelgium@gmail.com', DB, ...extra },
    headers: { 'Cf-Access-Jwt-Assertion': jwt, Origin: 'https://mkstyle.be', 'Content-Type': 'application/json' },
    restore: () => { globalThis.fetch = originalFetch; }
  };
}

test('resolveDutchDate handles relative days, Dutch months, slashes and upcoming weekdays', () => {
  const today = '2026-11-19'; // Thursday
  assert.equal(resolveDutchDate('vandaag', today), '2026-11-19');
  assert.equal(resolveDutchDate('morgen', today), '2026-11-20');
  assert.equal(resolveDutchDate('overmorgen', today), '2026-11-21');
  assert.equal(resolveDutchDate('25 december', today), '2026-12-25');
  assert.equal(resolveDutchDate('25/12/2026', today), '2026-12-25');
  assert.equal(resolveDutchDate('10 augustus', today), '2027-08-10');
  assert.equal(resolveDutchDate('komende zaterdag', today), '2026-11-21');
});

test('parseDutchCommand deterministically parses clear salon operations and skips ambiguous ones', () => {
  const today = '2026-11-19';
  const closed = parseDutchCommand('Morgen gesloten wegens familiedag', baseConfig, today);
  assert.equal(closed.operation.action, 'set_exception');
  assert.equal(closed.operation.date, '2026-11-20');
  assert.equal(closed.operation.closed, true);
  assert.match(closed.changes.exceptions[0].note, /familiedag/i);

  const customHours = parseDutchCommand('Morgen open van 10:00 tot 14:00', baseConfig, today);
  assert.equal(customHours.operation.action, 'set_exception');
  assert.equal(customHours.operation.closed, false);
  assert.deepEqual(customHours.operation.shifts, [['10:00', '14:00']]);

  const holiday = parseDutchCommand('Verlof van 10 augustus tot 20 augustus', baseConfig, today);
  assert.equal(holiday.operation.action, 'set_exception_range');
  assert.equal(holiday.changes.exceptions.length, 11);

  const withExc = { ...baseConfig, exceptions: [{ date: '2026-12-25', closed: true, shifts: [], note: 'Kerstmis' }] };
  const removed = parseDutchCommand('Verwijder uitzondering op 25 december 2026', withExc, today);
  assert.equal(removed.operation.action, 'remove_exception');
  assert.deepEqual(removed.changes.exceptions, []);

  const price = parseDutchCommand('Verander de prijs van de herenknipbeurt naar €27', baseConfig, today);
  assert.equal(price.operation.action, 'set_price');
  assert.equal(price.operation.serviceId, 'knip');
  assert.equal(price.operation.price, '€27');

  const hide = parseDutchCommand('Verberg de melding bovenaan de website', baseConfig, today);
  assert.deepEqual(hide.operation, { action: 'set_announcement', active: false, type: 'info', text: '' });

  const show = parseDutchCommand('Toon melding: Zaterdag doorlopend open zonder afspraak', baseConfig, today);
  assert.equal(show.operation.action, 'set_announcement');
  assert.equal(show.operation.active, true);

  assert.equal(parseDutchCommand('Op JJJJ-MM-DD gesloten', baseConfig, today), null);
  assert.equal(parseDutchCommand('Zet iets leuks bovenaan voor Pasen', baseConfig, today), null);
});

test('ai-provider supports JSON extraction, Cloudflare AI fallback and Pollinations (keyed + 402 fallback)', async (t) => {
  assert.equal(hasConfiguredAiProvider({}), false);
  assert.deepEqual(extractJsonObject('```json\n{"ok":true}\n```'), { ok: true });
  assert.deepEqual(extractJsonObject('Antwoord: {"caption":"Hallo Beverst!"} Dankje'), { caption: 'Hallo Beverst!' });

  let calls = [];
  const cfEnv = {
    AI: {
      async run(model) {
        calls.push(model);
        if (model.includes('mistral')) throw new Error('primary down');
        return { response: '{"operation":{"action":"clarify"},"summary":"Welke datum?","socialDraft":""}' };
      }
    }
  };
  const cfRes = await generateStructuredJson(cfEnv, { system: 's', user: 'u' });
  assert.equal(cfRes.provider, 'cloudflare-ai');
  assert.match(cfRes.model, /llama-3\.1-8b/);
  assert.equal(calls.length, 2);

  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (url, init) => {
    calls.push(String(url));
    if (String(url).startsWith('https://text.pollinations.ai/')) {
      return new Response(JSON.stringify({ error: { code: 'FREE_LIMIT' } }), { status: 402 });
    }
    if (String(url).startsWith('https://gen.pollinations.ai/')) {
      assert.match(init.headers.Authorization, /^Bearer pln_test$/);
      return new Response(JSON.stringify({ model: 'openai', choices: [{ message: { content: '{"caption":"Klaar!"}' } }] }), { status: 200 });
    }
    throw new Error('Unexpected ' + url);
  };

  calls = [];
  const polKeyRes = await generateStructuredJson(
    { POLLINATIONS_API_KEY: 'pln_test', AI_PROVIDER: 'pollinations' },
    { system: 's', user: 'u' }
  );
  assert.equal(polKeyRes.provider, 'pollinations');
  assert.equal(polKeyRes.data.caption, 'Klaar!');

  calls = [];
  const polFallbackToCf = await generateStructuredJson(
    {
      POLLINATIONS_ENABLED: 'true',
      AI_PROVIDER: 'pollinations',
      AI: { async run() { return { response: '{"caption":"Via CF fallback"}' }; } }
    },
    { system: 's', user: 'u' }
  );
  assert.equal(polFallbackToCf.provider, 'cloudflare-ai');
  assert.equal(polFallbackToCf.data.caption, 'Via CF fallback');
});

test('/api/admin/propose uses zero-quota deterministic parser first, then Cloudflare AI without writing D1', async (t) => {
  const DB = new MemoryD1();
  const { env, headers, restore } = await adminEnv(DB, {
    AI: {
      async run(_model, input) {
        const sys = input?.messages?.[0]?.content || '';
        if (sys.includes('socialmediacaption')) {
          return { response: JSON.stringify({ caption: 'Spring gerust binnen in Beverst bij MK Style, altijd zonder afspraak!' }) };
        }
        return {
          response: JSON.stringify({
            operation: { action: 'set_announcement', active: true, type: 'info', text: 'Komende zaterdag doorlopend open!' },
            summary: 'Vriendelijke zaterdagmelding klaargezet.',
            socialDraft: 'Zaterdag staan we doorlopend klaar bij MK Style in Beverst!'
          })
        };
      }
    }
  });
  t.after(restore);

  const req = (path, body) => new Request('https://mkstyle.be' + path, { method: 'POST', headers, body: JSON.stringify(body) });

  // Deterministic path -> 0 DB ai_daily_usage rows consumed
  const r1 = await propose({ request: req('/api/admin/propose', { prompt: 'Morgen gesloten wegens familiedag', expectedVersion: 1 }), env });
  assert.equal(r1.status, 200);
  const p1 = await r1.json();
  assert.equal(p1.engine, 'deterministic');
  assert.equal(p1.provider, 'local-parser');
  assert.equal(DB.db.prepare('SELECT COUNT(*) AS n FROM ai_daily_usage').get().n, 0);

  // Ambiguous phrasing -> invokes Cloudflare Workers AI + consumes 1 quota unit, zero site_config write
  const r2 = await propose({ request: req('/api/admin/propose', { prompt: 'Zet een warme boodschap bovenaan voor komende zaterdag zonder afspraak', expectedVersion: 1 }), env });
  assert.equal(r2.status, 200);
  const p2 = await r2.json();
  assert.equal(p2.engine, 'ai');
  assert.equal(p2.provider, 'cloudflare-ai');
  assert.equal(p2.preview.after.announcement.active, true);
  assert.equal(DB.db.prepare('SELECT version FROM site_config WHERE id=?').get('main').version, 1);
  assert.equal(DB.db.prepare('SELECT SUM(requests) AS total FROM ai_daily_usage').get().total, 1);

  // Social Studio AI polish works via Cloudflare AI without mutating config
  const r3 = await socialDraft({ request: req('/api/admin/social-draft', { platform: 'instagram', topic: 'walkin', mode: 'ai', expectedVersion: 1 }), env });
  assert.equal(r3.status, 200);
  const s3 = await r3.json();
  assert.equal(s3.mode, 'ai');
  assert.equal(s3.provider, 'cloudflare-ai');
  assert.equal(s3.posted, false);
});
