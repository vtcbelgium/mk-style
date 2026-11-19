import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const headers=readFileSync(new URL('../_headers',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const admin=readFileSync(new URL('../admin.html',import.meta.url),'utf8');
const privacy=readFileSync(new URL('../privacy.html',import.meta.url),'utf8');
test('public pages require a CSP without arbitrary third-party JS or external font hosts',()=>{
  const csp=headers.split('\n').find(line=>line.trim().startsWith('Content-Security-Policy:'))||'';
  assert.match(csp,/default-src 'self'/);
  assert.match(csp,/script-src 'self';/);
  assert.match(csp,/object-src 'none'/);
  assert.match(csp,/frame-ancestors 'none'/);
  assert.doesNotMatch(csp,/unsafe-eval/);
  assert.doesNotMatch(csp,/script-src[^;]*unsafe-inline/);
  assert.match(csp,/font-src 'self';/);
  assert.doesNotMatch(csp,/fonts\.googleapis|fonts\.gstatic/);
  assert.match(csp,/frame-src https:\/\/www\.openstreetmap\.org/);
});
test('all HTML pages use self-hosted fonts only and declare external active resources in CSP',()=>{
  for (const [name, html] of [['index.html', index], ['admin.html', admin], ['privacy.html', privacy]]) {
    assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/, `${name} must not depend on external Google Fonts`);
    assert.match(html, /\.\/assets\/css\/fonts\.css/, `${name} must load local self-hosted fonts.css`);
  }
  assert.match(index,/https:\/\/www\.openstreetmap\.org\/export\/embed/);
  const allScripts=[...index.matchAll(/<script\b([^>]*)>/gi),...admin.matchAll(/<script\b([^>]*)>/gi),...privacy.matchAll(/<script\b([^>]*)>/gi)];
  assert.ok(allScripts.every(match=>/src=["']\.\/assets\/js\//.test(match[1])||
      /type=["']application\/ld\+json/.test(match[1])));
});
