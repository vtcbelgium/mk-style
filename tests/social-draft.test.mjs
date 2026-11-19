import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeSocialDraft,validateAiCaption,draftInput} from '../functions/_lib/social.js';
const config=JSON.parse(readFileSync(new URL('../data/site-config.json',import.meta.url),'utf8'));
test('Instagram, Facebook and Google drafts use verified business data only',()=>{
 for(const platform of ['instagram','facebook','google']){
  const draft=makeSocialDraft(config,{platform,topic:'walkin'});
  assert.equal(draft.platform,platform);
  assert.equal(draft.status,'draft');
  assert.equal(draft.posted,false);
  assert.equal(draft.requiresApproval,true);
  assert.equal(draft.mediaRequiresRightsCheck,true);
  assert.ok(draft.caption.includes('MK Style'));
  assert.ok(draft.caption.includes('Sint-Gertrudisplein 24'));
  assert.doesNotMatch(draft.caption,/korting|winactie|giveaway|gratis knipbeurt/i);
 }
});
test('service posts use the confirmed current price, not hardcoded prices',()=>{
 const updated=structuredClone(config);
 updated.services.find(x=>x.id==='knip').price='€29';
 const draft=makeSocialDraft(updated,{platform:'instagram',topic:'service',serviceId:'knip'});
 assert.ok(draft.caption.includes('€29'));
 assert.ok(!draft.caption.includes('€25'));
 assert.throws(()=>makeSocialDraft(updated,{platform:'instagram',topic:'service',serviceId:'not-a-service'}),/Kies een bestaande dienst/);
});
test('exception posts require an exception already stored in the live source config',()=>{
 assert.throws(()=>makeSocialDraft(config,{platform:'google',topic:'special_hours',date:'2026-12-25'}),/staat nog niet op de website/);
 const updated=structuredClone(config);
 updated.exceptions=[{date:'2026-12-25',closed:true,shifts:[],note:'Feestdag'}];
 const draft=makeSocialDraft(updated,{platform:'google',topic:'special_hours',date:'2026-12-25'});
 assert.match(draft.caption,/25 december 2026/);
 assert.match(draft.caption,/gesloten/);
});
test('unknown platform/topic and injected HTML cannot reach a draft',()=>{
 for(const bad of [
  {platform:'tiktok',topic:'walkin'},
  {platform:'facebook',topic:'free-discount'},
  {platform:'instagram',topic:'walkin',mode:'published'},
  {platform:'instagram',topic:'walkin',brief:'<script>alert(1)</script>'}
 ])assert.throws(()=>draftInput(bad,config));
});
test('AI output rejects invented discounts, links and unconfirmed prices',()=>{
 assert.equal(validateAiCaption('Frisse snit in Beverst — zonder afspraak!',config),'Frisse snit in Beverst — zonder afspraak!');
 for(const bad of [
  'Profiteer van 30% korting bij MK Style!',
  'Vandaag €99 voor knippen',
  'Boek meteen op https://evil.example',
  '<img src=x onerror=alert(1)>'
 ])assert.throws(()=>validateAiCaption(bad,config));
});
