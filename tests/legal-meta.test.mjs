import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const index=readFileSync(new URL('../index.html', import.meta.url),'utf8');
const privacy=readFileSync(new URL('../privacy.html', import.meta.url),'utf8');
const config=JSON.parse(readFileSync(new URL('../data/site-config.json',import.meta.url),'utf8'));

test('footer exposes company identity, privacy page link, and direct contact without sign-in',()=>{
 assert.ok(index.includes('MK Style CommV.'));
 assert.ok(index.includes('Ondernemingsnr. 1004.134.102'));
 assert.ok(index.includes('BE1004.134.102'));
 assert.ok(index.includes('mailto:'+config.businessEmail));
 assert.ok(index.includes('tel:'+config.phoneTel));
 assert.ok(index.includes('href="./privacy.html"'));
 assert.ok(privacy.includes('MK Style CommV.'));
 assert.ok(privacy.includes('BE1004.134.102'));
 assert.ok(privacy.includes('Gegevensbeschermingsautoriteit'));
 assert.ok(privacy.includes('OpenStreetMap'));
 assert.doesNotMatch(privacy,/fonts\.googleapis\.com/);
});
test('every homepage image declares alt text and explicit width/height dimensions',()=>{
 const imgs=[...index.matchAll(/<img\b([^>]*)>/gi)];
 assert.ok(imgs.length>=12);
 for(const m of imgs){
  assert.match(m[1],/\balt=["'][^"']+["']/,`Missing alt: ${m[0]}`);
  assert.match(m[1],/\bwidth=["']\d+["']/,`Missing width: ${m[0]}`);
  assert.match(m[1],/\bheight=["']\d+["']/,`Missing height: ${m[0]}`);
 }
});
test('structured LocalBusiness SEO metadata is valid and has a reachable contact address',()=>{
 const match=index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
 assert.ok(match,'Expected business structured data');
 const data=JSON.parse(match[1]);
 const business=data['@graph'].find(x=>Array.isArray(x['@type'])&&x['@type'].includes('HairSalon'));
 assert.ok(business);
 assert.equal(business.url,'https://mk38style.be/');
 assert.equal(business.email,config.businessEmail);
 assert.equal(business.telephone,config.phoneTel);
 assert.equal(business.paymentAccepted,undefined,'Payment types not confirmed by Murat');
});
