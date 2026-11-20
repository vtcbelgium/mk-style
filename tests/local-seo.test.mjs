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

test('homepage and privacy JSON-LD include WebPage/BreadcrumbList graph, InStoreOnly offers and zero Person nodes',()=>{
 const privacyHtml=readFileSync(new URL('../privacy.html',import.meta.url),'utf8');
 const privacyJsonld=JSON.parse(privacyHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 const page=nodes.find(x=>x['@type']==='WebPage'&&x['@id']==='https://mkstyle.be/#webpage');
 const breadcrumb=nodes.find(x=>x['@type']==='BreadcrumbList'&&x['@id']==='https://mkstyle.be/#breadcrumb');
 const site=nodes.find(x=>x['@type']==='WebSite');
 assert.ok(page,'Expected WebPage node in homepage JSON-LD');
 assert.equal(page.isPartOf['@id'],site['@id']);
 assert.equal(page.about['@id'],business['@id']);
 assert.equal(page.mainEntity['@id'],business['@id']);
 assert.equal(page.breadcrumb['@id'],breadcrumb['@id']);
 assert.ok(breadcrumb,'Expected BreadcrumbList node in homepage JSON-LD');
 assert.equal(breadcrumb.itemListElement.length,1);
 assert.equal(business.mainEntityOfPage['@id'],page['@id']);
 assert.equal(business.hasOfferCatalog.itemListElement.length,6);
 for(const offer of business.hasOfferCatalog.itemListElement){
  assert.equal(offer.availability,'https://schema.org/InStoreOnly');
  assert.equal(offer.url,'https://mkstyle.be/#diensten');
 }
 const allNodes=[...nodes,...privacyJsonld['@graph']];
 const hasPerson=allNodes.some(node=>{
  const t=Array.isArray(node['@type'])?node['@type']:[node['@type']];
  return t.includes('Person');
 });
 assert.equal(hasPerson,false);
 const privacyPage=privacyJsonld['@graph'].find(x=>x['@type']==='WebPage');
 const privacyCrumb=privacyJsonld['@graph'].find(x=>x['@type']==='BreadcrumbList');
 assert.ok(privacyPage.description);
 assert.equal(privacyPage.breadcrumb['@id'],privacyCrumb['@id']);
});

test('llms.txt and agents.txt provide accurate AI-scanner discovery files',()=>{
 const llms=readFileSync(new URL('../llms.txt',import.meta.url),'utf8');
 const agentsRoot=readFileSync(new URL('../agents.txt',import.meta.url),'utf8');
 const agentsWellKnown=readFileSync(new URL('../.well-known/agents.txt',import.meta.url),'utf8');
 assert.equal(agentsRoot,agentsWellKnown);
 assert.ok(llms.startsWith('# MK Style'));
 assert.ok(llms.includes('https://mkstyle.be/api/config'));
 assert.ok(html.includes('rel="alternate" type="text/plain"')&&html.includes('href="https://mkstyle.be/llms.txt"'));
 for(const srv of publicConfig.services){
  assert.ok(llms.includes(srv.name),`llms.txt missing service ${srv.name}`);
  assert.ok(llms.includes(srv.price),`llms.txt missing price ${srv.price}`);
 }
 assert.ok(agentsRoot.includes('Name: MK Style'));
 assert.ok(agentsRoot.includes('Public-Config-API: https://mkstyle.be/api/config'));
 assert.match(agentsRoot,/walk-in|zonder afspraak/i);
 assert.ok(agentsRoot.includes('Disallow: /admin\n')||agentsRoot.includes('Disallow: /admin\r\n'));
 assert.ok(agentsRoot.includes('Disallow: /admin.html'));
 assert.ok(agentsRoot.includes('Disallow: /api/admin/'));
});

test('every User-agent block in robots.txt explicitly disallows admin paths',()=>{
 const blocks=robots.split(/(?=^User-agent:)/m).filter(b=>b.trim().startsWith('User-agent:'));
 assert.ok(blocks.length>=2);
 for(const block of blocks){
  assert.ok(block.includes('Disallow: /admin.html'),`Missing /admin.html disallow in:\n${block}`);
  assert.ok(/Disallow:\s*\/admin(\r?\n|$)/.test(block),`Missing /admin disallow in:\n${block}`);
  assert.ok(block.includes('Disallow: /api/admin/'),`Missing /api/admin/ disallow in:\n${block}`);
 }
});

test('footer keeps admin link visible as Beheer with rel=nofollow on public pages',()=>{
 const privacyHtml=readFileSync(new URL('../privacy.html',import.meta.url),'utf8');
 for(const [name,doc] of [['index.html',html],['privacy.html',privacyHtml]]){
  assert.doesNotMatch(doc,/AI Beheer/,`${name} must not still show AI Beheer`);
  assert.match(doc,/<a\b[^>]*href=["']\.\/admin\.html["'][^>]*rel=["'][^"']*nofollow[^"']*["'][^>]*>[\s\S]*?\bBeheer\b[\s\S]*?<\/a>/i,
   `${name} must link to ./admin.html as Beheer with rel="nofollow"`);
 }
});
