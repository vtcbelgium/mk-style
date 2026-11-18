#!/usr/bin/env node
// OTHRYS support pilot drills (mk-style). Node built-ins only; fully deterministic.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const SCHEMA = 'othrys.support.pilot-drills.v1';
const UNAVAILABLE = 'UNAVAILABLE';
const WATCHDOG_LIMIT_S = 900;

const sha256 = (s) => createHash('sha256').update(s).digest('hex');
function stable(v) {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v === undefined ? null : v);
}

function loadInputs(rootDir) {
  const text = (rel) => readFileSync(resolve(rootDir, rel), 'utf8').replace(/^﻿/, '');
  return {
    manifest: JSON.parse(text('data/othrys-support.json')),
    checklist: JSON.parse(text('data/support-compliance-checklist.json')),
    site: JSON.parse(text('data/site-config.json')),
    html: text('index.html'),
  };
}

function check(name, passed) {
  return { name, passed: passed === true };
}

function finish(id, checks, evidence) {
  return {
    id,
    passed: checks.every((c) => c.passed),
    checks,
    evidenceSha256: sha256(stable(evidence)),
  };
}

// --- Drill 1: outage deduplication + watchdog ---
function deduplicate(alerts) {
  const groups = new Map();
  for (const a of alerts) {
    const key = `${a.siteId}|${a.kind}`;
    if (!groups.has(key)) groups.set(key, { key, sources: [], firstSeen: a.at });
    const g = groups.get(key);
    if (!g.sources.includes(a.source)) g.sources.push(a.source);
    if (a.at < g.firstSeen) g.firstSeen = a.at;
  }
  return [...groups.values()].map((g) => ({ ...g, sources: g.sources.sort() }));
}

function watchdog(heartbeatAgeSeconds) {
  if (heartbeatAgeSeconds === null || heartbeatAgeSeconds === undefined) {
    return { severity: 'CRITICAL', reason: 'heartbeat_unavailable' };
  }
  return heartbeatAgeSeconds > WATCHDOG_LIMIT_S
    ? { severity: 'CRITICAL', reason: 'heartbeat_stale' }
    : { severity: 'OK', reason: 'heartbeat_fresh' };
}

function drillOutage() {
  const at = '2026-11-16T06:00:00Z';
  const alerts = ['betterstack', 'cloudflare', 'argus'].map((source) => ({
    source, siteId: 'mk-style', kind: 'outage', at,
  }));
  const incidents = deduplicate(alerts);
  const stale = watchdog(1200);
  const fresh = watchdog(60);
  const checks = [
    check('three_alerts_received', alerts.length === 3),
    check('incident_count_is_1', incidents.length === 1),
    check('incident_has_all_sources', incidents[0]?.sources.join(',') === 'argus,betterstack,cloudflare'),
    check('stale_t590_heartbeat_critical', stale.severity === 'CRITICAL'),
    check('fresh_heartbeat_not_critical', fresh.severity === 'OK'),
  ];
  return finish('outage_deduplication', checks, { incidentCount: incidents.length, incidents, stale, fresh });
}

// --- Drill 2: broken journey smoke ---
function jsonLdNodes(html) {
  const nodes = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(re)) {
    try {
      const data = JSON.parse(m[1]);
      nodes.push(...(Array.isArray(data['@graph']) ? data['@graph'] : [data]));
    } catch { /* unparseable block is caught by the HairSalon check */ }
  }
  return nodes;
}
const typesOf = (n) => [].concat(n['@type'] ?? []);

function journeySmoke(site, html) {
  const nodes = jsonLdNodes(html);
  const salon = nodes.find((n) => typesOf(n).includes('HairSalon'));
  const high = [];
  if (site.shopName !== 'MK Style') high.push('shopName');
  if (site.phoneTel !== '+32484073908') high.push('phoneTel');
  if (site.walkInOnly !== true) high.push('walkInOnly');
  if (!salon) high.push('jsonld_hairsalon_missing');
  if (nodes.some((n) => typesOf(n).includes('Person'))) high.push('jsonld_person_node');
  if (salon && salon.telephone !== site.phoneTel) high.push('jsonld_phone_mismatch');
  if (!html.includes(`tel:${site.phoneTel}`)) high.push('html_tel_link_missing');
  return { severity: high.length ? 'HIGH' : 'OK', failures: high.sort() };
}

function drillJourney({ site, html }) {
  const real = journeySmoke(site, html);
  const corrupted = journeySmoke({ ...site, phoneTel: '+3200000' }, html.split('+32484073908').join('+3200000x'));
  const nodes = jsonLdNodes(html);
  const checks = [
    check('shopName_mk_style', site.shopName === 'MK Style'),
    check('phoneTel_expected', site.phoneTel === '+32484073908'),
    check('walkInOnly_true', site.walkInOnly === true),
    check('html_has_mk_style', html.includes('MK Style')),
    check('jsonld_hairsalon_present', nodes.some((n) => typesOf(n).includes('HairSalon'))),
    check('jsonld_no_person_node', !nodes.some((n) => typesOf(n).includes('Person'))),
    check('real_journey_ok', real.severity === 'OK'),
    check('corrupted_payload_fails_closed_high', corrupted.severity === 'HIGH' && corrupted.failures.includes('phoneTel')),
  ];
  return finish('broken_journey_smoke', checks, { real, corrupted });
}

// --- Drill 3: bad release rollback ---
function rollbackProposal(probe, release) {
  if (probe.status < 500) return null;
  return {
    severity: 'HIGH',
    trigger: `post_deploy_http_${probe.status}`,
    rollbackTo: release.previous,
    autoExecuteProduction: false,
    requiresOwnerAuthorization: true,
  };
}

function drillRollback() {
  const proposal = rollbackProposal({ url: 'https://mk38style.be/', status: 500 }, { current: 'sha-bad', previous: 'sha-good' });
  const healthy = rollbackProposal({ url: 'https://mk38style.be/', status: 200 }, { current: 'sha-ok', previous: 'sha-good' });
  const checks = [
    check('http_500_yields_proposal', proposal !== null),
    check('auto_execute_false', proposal?.autoExecuteProduction === false),
    check('owner_authorization_required', proposal?.requiresOwnerAuthorization === true),
    check('healthy_release_no_proposal', healthy === null),
  ];
  return finish('bad_release_rollback', checks, { proposal, healthy });
}

// --- Drill 4: missing-data Monday report ---
function brusselsParts(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels', weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  return { weekday: get('weekday'), time: `${get('hour')}:${get('minute')}` };
}

function renderDigest({ manifest, checklist, site, metrics, sentAt }) {
  const val = (v) => (v === null || v === undefined ? UNAVAILABLE : v);
  const bookingsApplicable = site.walkInOnly !== true;
  return {
    schedule: manifest.reporting?.schedule,
    sentAt,
    local: brusselsParts(new Date(sentAt)),
    metrics: {
      searchConsoleClicks: val(metrics.searchConsoleClicks),
      bookings: bookingsApplicable ? val(metrics.bookings) : UNAVAILABLE,
    },
    recommendation: metrics.notableChange ? metrics.notableChange : manifest.reporting?.quietWeekPolicy,
    billingValve: checklist.businessGuard?.billingValve,
    aiDisclosure: 'Dit rapport is automatisch opgesteld door een AI-assistent (EU AI Act, art. 50).',
  };
}

function drillMonday({ manifest, checklist, site }) {
  const digest = renderDigest({
    manifest, checklist, site,
    sentAt: '2026-11-16T07:00:00Z',
    metrics: { searchConsoleClicks: null, bookings: null, notableChange: null },
  });
  const gdprOk = checklist.gdpr?.role === 'data_processor' && checklist.gdpr.writtenScopeRequired === true
    && checklist.gdpr.trackingCookies === false && checklist.gdpr.syntheticTrafficExcluded === true;
  const aiOk = checklist.euAiAct?.article50TransparencyRequired === true
    && checklist.euAiAct.failClosedWithoutDisclosure === true && /art\. 50/.test(digest.aiDisclosure);
  const checks = [
    check('monday_0800_brussels', digest.local.weekday === 'Monday' && digest.local.time === '08:00'),
    check('schedule_matches_manifest', digest.schedule === 'MON 08:00 Europe/Brussels'),
    check('search_console_unavailable', digest.metrics.searchConsoleClicks === UNAVAILABLE),
    check('bookings_unavailable_not_zero', digest.metrics.bookings === UNAVAILABLE && digest.metrics.bookings !== 0),
    check('walk_in_only_no_invented_bookings', site.walkInOnly === true && checklist.businessGuard?.neverFabricateBookings === true),
    check('quiet_week_no_forced_recommendation', digest.recommendation === 'NO_FORCED_RECOMMENDATION'),
    check('billing_valve_closed_dormant', digest.billingValve === 'closed_dormant' && checklist.businessGuard.billingEnabled === false),
    check('gdpr_checklist_passes', gdprOk),
    check('eu_ai_act_art50_passes', aiOk),
  ];
  return finish('missing_data_monday_report', checks, { digest, gdprOk, aiOk });
}

export function runAllPilotDrills(rootDir) {
  const inputs = loadInputs(rootDir);
  const drills = [drillOutage(), drillJourney(inputs), drillRollback(), drillMonday(inputs)]
    .sort((a, b) => a.id.localeCompare(b.id));
  const passedCount = drills.filter((d) => d.passed).length;
  const receiptSha256 = sha256(stable(drills.map((d) => ({ id: d.id, passed: d.passed, evidenceSha256: d.evidenceSha256 }))));
  return { schema: SCHEMA, siteId: 'mk-style', drills, passedCount, allPassed: passedCount === drills.length, receiptSha256 };
}

function main(argv) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const oi = argv.indexOf('--output');
  const out = oi >= 0 ? argv[oi + 1] : null;
  if (oi >= 0 && !out) {
    console.error('--output requires a path');
    return 2;
  }
  let result;
  try {
    result = runAllPilotDrills(root);
  } catch (e) {
    console.error(`run-pilot-drills ERROR: ${e.message}`);
    return 1;
  }
  const json = `${JSON.stringify(result, null, 2)}\n`;
  if (out) writeFileSync(resolve(out), json);
  if (argv.includes('--json')) process.stdout.write(json);
  else {
    for (const d of result.drills) {
      const bad = d.checks.filter((c) => !c.passed).map((c) => c.name).join(', ');
      console.log(`${d.passed ? 'PASS' : 'FAIL'} ${d.id}${d.passed ? '' : `: ${bad}`}`);
    }
    console.log(`${result.passedCount}/${result.drills.length} passed receipt=${result.receiptSha256}`);
  }
  return result.allPassed ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exit(main(process.argv.slice(2)));
}
