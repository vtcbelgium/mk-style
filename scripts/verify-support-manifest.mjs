#!/usr/bin/env node
// Zero-dependency verifier for the OTHRYS support manifest (mk-style).
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function read(rel) {
  try {
    return readFileSync(resolve(root, rel), 'utf8');
  } catch (e) {
    errors.push(`${rel}: cannot read (${e.code || e.message})`);
    return null;
  }
}

function parseJson(rel, text) {
  if (text === null) return null;
  try {
    return JSON.parse(text.replace(/^﻿/, ''));
  } catch (e) {
    errors.push(`${rel}: invalid JSON (${e.message})`);
    return null;
  }
}

function expect(cond, msg) {
  if (!cond) errors.push(msg);
}

const manifest = parseJson('data/othrys-support.json', read('data/othrys-support.json'));
if (manifest) {
  expect(manifest.schema === 'othrys.support.site-manifest.v1', "schema must be 'othrys.support.site-manifest.v1'");
  expect(manifest.siteId === 'mk-style', "siteId must be 'mk-style'");
  expect(manifest.commercialGuard?.billingValve === 'closed_dormant', "commercialGuard.billingValve must be 'closed_dormant'");
  expect(manifest.commercialGuard?.billingEnabled === false, 'commercialGuard.billingEnabled must be false');
  expect(manifest.compliance?.aiDisclosureRequired === true, 'compliance.aiDisclosureRequired must be true');
  expect(manifest.compliance?.neverFabricateBookings === true, 'compliance.neverFabricateBookings must be true');
  expect(manifest.reporting?.missingMetricPolicy === 'UNAVAILABLE_NEVER_ZERO', "reporting.missingMetricPolicy must be 'UNAVAILABLE_NEVER_ZERO'");
}

const site = parseJson('data/site-config.json', read('data/site-config.json'));
if (site) {
  expect(typeof site.shopName === 'string' && site.shopName.trim() !== '', 'data/site-config.json: shopName must be non-empty');
}

const html = read('index.html');
if (html !== null) {
  expect(/<html[^>]*\slang=/i.test(html), 'index.html: missing <html lang=>');
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  expect(!!t && t[1].trim() !== '', 'index.html: missing or empty <title>');
}

if (errors.length) {
  console.error('verify-support-manifest FAILED:');
  for (const m of errors) console.error(` - ${m}`);
  process.exit(1);
}
console.log('verify-support-manifest OK');
process.exit(0);
