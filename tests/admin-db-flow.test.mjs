import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {onRequestGet as getAdmin,onRequestPatch as patchAdmin} from '../functions/api/admin/config.js';
import {onRequestPost as undoAdmin} from '../functions/api/admin/undo.js';
import {onRequestGet as getPublic} from '../functions/api/config.js';
import {onRequestGet as getHistory} from '../functions/api/admin/history.js';

// In-memory SQL engine implements the exact statements used by Cloudflare D1,
// with the same .prepare/.bind/.first/.run/.batch calling pattern. No cloud writes.
class MemoryD1 {
  constructor(){
    this.db=new DatabaseSync(':memory:');
    const schema=readFileSync(new URL('../migrations/0001_schema.sql',import.meta.url),'utf8');
    this.db.exec(schema);
    const site=JSON.parse(readFileSync(new URL('../data/site-config.json',import.meta.url),'utf8'));
    this.db.prepare('INSERT INTO site_config(id, config_json, version, updated_at) VALUES (?, ?, ?, ?)')
      .run('main',JSON.stringify(site),1,'2026-11-19T00:00:00Z');
  }
  prepare(sql){
    const db=this.db;
    return {bind(...params){
      return {
        async first(){return db.prepare(sql).get(...params)||null;},
        async all(){return {results:db.prepare(sql).all(...params)};},
        async run(){const result=db.prepare(sql).run(...params);return {meta:{changes:result.changes}};}
      };
    }};
  }
  async batch(statements) {
    this.db.exec('BEGIN');
    try{
      const results=[];
      for(const statement of statements)results.push(await statement.run());
      this.db.exec('COMMIT');
      return results;
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
}
test('authenticated admin writes, version conflicts, public read and one-step undo',async t=>{
  const team='https://mkstyle-test.cloudflareaccess.com',aud='mk-style-test';
  const {publicKey,privateKey}=await generateKeyPair('RS256');
  const publicJwk=await exportJWK(publicKey);
  publicJwk.kid='mk-style-test-key';publicJwk.use='sig';publicJwk.alg='RS256';
  const originalFetch=globalThis.fetch;
  let jwksRequests=0;
  globalThis.fetch=async input=>{
    const url=String(input);
    if(url===team+'/cdn-cgi/access/certs'){
      jwksRequests++;
      return new Response(JSON.stringify({keys:[publicJwk]}),{status:200,headers:{'content-type':'application/json'}});
    }
    throw new Error('Unexpected external fetch: '+url);
  };
  t.after(()=>{globalThis.fetch=originalFetch;});
  const jwt=await new SignJWT({email:'38mkstyle@gmail.com'})
    .setProtectedHeader({alg:'RS256',kid:'mk-style-test-key'})
    .setIssuer(team).setAudience(aud).setIssuedAt().setExpirationTime('2h').sign(privateKey);
  const DB=new MemoryD1();
  const env={TEAM_DOMAIN:team,POLICY_AUD:aud,ADMIN_EMAILS:'38mkstyle@gmail.com',DB};
  const host='https://mkstyle-test.pages.dev',url=host+'/api/admin/config';
  const headers={'Cf-Access-Jwt-Assertion':jwt,Origin:host,'Content-Type':'application/json'};
  const request=(method,path,body,withAuth=true,origin=host)=>new Request(host+path,{
    method,headers:withAuth?{...headers,Origin:origin}:{Origin:origin,'Content-Type':'application/json'},
    ...(method==='GET'?{}:{body:JSON.stringify(body)})
  });
  const before=await getAdmin({request:request('GET','/api/admin/config'),env});
  assert.equal(before.status,200);
  assert.equal((await before.json()).version,1);
  const change={expectedVersion:1,source:'manual',changes:{exceptions:[{
    date:'2026-12-25',closed:true,shifts:[],note:'Feestdag'
  }]}};
  const rejected=await patchAdmin({request:request('PATCH','/api/admin/config',change,false),env});
  assert.equal(rejected.status,401);
  const badOrigin=await patchAdmin({request:request('PATCH','/api/admin/config',change,true,'https://evil.example'),env});
  assert.equal(badOrigin.status,403);
  const saved=await patchAdmin({request:request('PATCH','/api/admin/config',change),env});
  const payload=await saved.json();
  assert.equal(saved.status,200);
  assert.equal(payload.version,2);
  assert.equal(payload.config.exceptions[0].date,'2026-12-25');
  const publicResponse=await getPublic({env});
  assert.equal(publicResponse.status,200);
  assert.equal((await publicResponse.json()).version,2);
  const conflict=await patchAdmin({request:request('PATCH','/api/admin/config',change),env});
  assert.equal(conflict.status,409);
  const rollback=await undoAdmin({request:request('POST','/api/admin/undo',{expectedVersion:2}),env});
  assert.equal(rollback.status,200);
  const undone=await rollback.json();
  assert.equal(undone.version,3);
  assert.deepEqual(undone.config.exceptions||[],[]);
  const revisions=DB.db.prepare('SELECT version,source FROM site_revisions ORDER BY version').all();
  assert.deepEqual(revisions.map(r=>r.version),[2,3]);
  const historyResponse=await getHistory({request:request('GET','/api/admin/history'),env});
  assert.equal(historyResponse.status,200);
  const audit=await historyResponse.json();
  assert.equal(audit.currentVersion,3);
  assert.deepEqual(audit.history.map(entry=>entry.version),[3,2]);
  assert.ok(audit.history.every(entry=>entry.actor==='38mkstyle@gmail.com'));
  assert.ok(audit.history.every(entry=>!('before_json' in entry)&&!('after_json' in entry)));
  assert.equal(jwksRequests,1);
});
