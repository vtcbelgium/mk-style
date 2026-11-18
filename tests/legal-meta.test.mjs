import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const index=readFileSync(new URL('../index.html', import.meta.url),'utf8');
const config=JSON.parse(readFileSync(new URL('../data/site-config.json',import.meta.url),'utf8'));

test('footer exposes company identity and direct contact without sign-in',()=>{
 assert.ok(index.includes('MK Style CommV.'));
 assert.ok(index.includes('Ondernemingsnr. 1004.134.102'));
 assert.ok(index.includes('BE1004.134.102'));
 assert.ok(index.includes('mailto:'+config.businessEmail));
 assert.ok(index.includes('tel:'+config.phoneTel));
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
