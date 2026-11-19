import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const cfg=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
test('Cloudflare Pages app uses a separate database for preview and production',()=>{
 assert.equal(cfg.name,'mk-style');
 assert.equal(cfg.pages_build_output_dir,'./dist');
 const [fallback]=cfg.d1_databases;
 const [preview]=cfg.env.preview.d1_databases;
 const [production]=cfg.env.production.d1_databases;
 assert.equal(fallback.binding,'DB');
 assert.equal(preview.binding,'DB');
 assert.equal(production.binding,'DB');
 assert.equal(fallback.database_id,preview.database_id);
 assert.notEqual(preview.database_id,production.database_id);
 assert.equal(preview.database_name,'mk-style-staging');
 assert.equal(production.database_name,'mk-style-production');
});
test('published site configuration contains confirmed business contact details',()=>{
 const data=JSON.parse(readFileSync(new URL('../data/site-config.json',import.meta.url),'utf8'));
 assert.equal(data.shopName,'MK Style');
 assert.equal(data.legalName,'MK Style CommV.');
 assert.equal(data.vatNumber,'BE1004.134.102');
 assert.equal(data.businessEmail,'38mkstyle@gmail.com');
 assert.equal(data.services.length,6);
});
