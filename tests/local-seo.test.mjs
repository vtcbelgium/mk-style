import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html', import.meta.url),'utf8');
const robots=readFileSync(new URL('../robots.txt', import.meta.url),'utf8');
const sitemap=readFileSync(new URL('../sitemap.xml', import.meta.url),'utf8');
const publicConfig=JSON.parse(readFileSync(new URL('../data/site-config.json',import.meta.url),'utf8'));
const profile=JSON.parse(readFileSync(new URL('../config/client-profile.json',import.meta.url),'utf8'));
const jsonld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const nodes=jsonld['@graph'];
const business=nodes.find(x=>Array.isArray(x['@type'])&&x['@type'].includes('HairSalon'));

test('structured MK Style local business matches public company and address',()=>{
 assert.ok(business);
 assert.equal(business.name,publicConfig.shopName);
 assert.equal(business.legalName,publicConfig.legalName);
 assert.equal(business.vatID,publicConfig.vatNumber);
 assert.equal(business.taxID,publicConfig.enterpriseNumber);
 assert.equal(business.telephone,publicConfig.phoneTel);
 assert.equal(business.email,publicConfig.businessEmail);
 assert.equal(business.address.streetAddress,publicConfig.address.street);
 assert.equal(business.address.postalCode,publicConfig.address.postalCode);
 assert.equal(business.address.addressCountry,publicConfig.address.country);
 assert.equal(business.hasMap,profile.google_business.listing_url);
 assert.match(business.hasMap,/query_place_id=ChIJu8aXT6XgwEcRyp23QzZ2j2A/);
});
test('structured website and canonical are coherent, with no self-serving review claims',()=>{
 const site=nodes.find(x=>x['@type']==='WebSite');
 assert.equal(site.url,'https://mkstyle.be/');
 assert.equal(site.publisher['@id'],business['@id']);
 assert.ok(html.includes('<link rel="canonical" href="https://mkstyle.be/"'));
 assert.equal(nodes.some(x=>x['@type']==='FAQPage'),false);
 assert.equal('aggregateRating' in business,false);
 assert.equal('review' in business,false);
 assert.equal('priceRange' in business,false);
 assert.match(html,/name="twitter:card" content="summary_large_image"/);
});
test('public metadata and robots prevent admin URLs from being indexed',()=>{
 assert.ok(robots.includes('Disallow: /admin.html'));
 assert.ok(robots.includes('Disallow: /admin'));
 assert.ok(robots.includes('Disallow: /api/admin/'));
 assert.ok(sitemap.includes('<loc>https://mkstyle.be/</loc>'));
 assert.ok(sitemap.includes('<lastmod>2026-11-19</lastmod>'));
 assert.ok(html.includes('Google-beoordelingen'));
 assert.ok(!html.includes('<meta name="keywords"'));
});
test('GBP connection is pending, with no false claim that profile is controlled',()=>{
 assert.equal(profile.google_business.public_listing_found,true);
 assert.equal(profile.google_business.owner_access_status,'not_verified');
 assert.equal(profile.google_business.sync_status,'not_activated');
 assert.equal(profile.google_business.no_duplicate_listing,true);
});
test('homepage title and description are concise and locally specific',()=>{
 const title=html.match(/<title>([^<]+)<\/title>/)?.[1]||'';
 const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1]||'';
 assert.ok(title.length>=35&&title.length<=65,title);
 assert.ok(description.length>=110&&description.length<=165,description);
 assert.match(title,/Herenkapper Beverst zonder afspraak/);
 assert.match(title,/MK Style Bilzen-Hoeselt/);
 assert.match(description,/Sint-Gertrudisplein 24/);
});
