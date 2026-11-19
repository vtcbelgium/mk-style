import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../assets/js/admin-v2.js',import.meta.url),'utf8');
const context=vm.createContext({document:{addEventListener(){}},Date,console});
vm.runInContext(source,context);
function dates(start,end){
  context.__start=start;context.__end=end;
  return Array.from(vm.runInContext('datesForPeriod(__start,__end)',context));
}
test('admin holiday dates include both endpoints',()=>{
  const result=dates('2027-08-10','2027-08-20');
  assert.equal(result.length,11);
  assert.equal(result[0],'2027-08-10');
  assert.equal(result.at(-1),'2027-08-20');
});
test('admin holiday date arithmetic survives the summer-time change',()=>{
  assert.deepEqual(dates('2027-03-27','2027-03-29'),['2027-03-27','2027-03-28','2027-03-29']);
});
test('admin rejects missing, reversed, invalid and overlong dates',()=>{
  assert.throws(()=>dates('','2027-08-20'));
  assert.throws(()=>dates('2027-08-20','2027-08-10'));
  assert.throws(()=>dates('2027-02-30','2027-03-02'));
  assert.throws(()=>dates('2027-07-01','2027-08-01'));
});
