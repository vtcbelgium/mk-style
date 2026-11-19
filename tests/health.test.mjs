import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet } from '../functions/api/health.js';
import { readFileSync } from 'node:fs';

const config=JSON.parse(readFileSync(new URL('../data/site-config.json',import.meta.url),'utf8'));
function fakeDb(row) {
  return {prepare(){return {bind(){return {first:async()=>row};}};}};
}

test('public monitoring endpoint returns only a minimal green status with healthy D1',async()=>{
  const response=await onRequestGet({env:{DB:fakeDb({version:1,config_json:JSON.stringify(config)})}});
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{status:'ok'});
  assert.match(response.headers.get('cache-control'),/no-store/);
  assert.match(response.headers.get('x-robots-tag'),/noindex/);
});
test('monitoring endpoint fails closed and does not disclose DB or client records',async()=>{
  for(const env of [
    {},{DB:fakeDb(null)},{DB:fakeDb({version:1,config_json:'{invalid'})},
    {DB:fakeDb({version:0,config_json:JSON.stringify(config)})}
  ]) {
    const response=await onRequestGet({env});
    assert.equal(response.status,503);
    assert.deepEqual(await response.json(),{status:'unavailable'});
  }
});
