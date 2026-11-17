import test from 'node:test';
import assert from 'node:assert/strict';
import { applyChanges, applyAiOperation, isIsoDate, localBelgianDate } from '../functions/_lib/site.js';
const base = {
  hours:Object.fromEntries(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day=>[day,{label:day,closed:true,shifts:[],note:''}])),
  services:[{id:'knip',name:'Herenknipbeurt',desc:'Knippen',price:'€25',tag:''}],
  announcement:{active:false,type:'info',text:'',forceClosedToday:false},exceptions:[],
  phoneTel:'+32484073908'
};
test('one-off closure does not modify weekly hours',()=>{
  const change=applyAiOperation(base,{action:'set_exception',date:'2026-11-25',closed:true,note:'Verlof'});
  const next=applyChanges(base,change);
  assert.equal(next.exceptions[0].date,'2026-11-25');
  assert.deepEqual(next.hours,base.hours);
});
test('invalid dates are rejected',()=>{
  assert.equal(isIsoDate('2026-02-30'),false);
  assert.equal(isIsoDate('2028-02-29'),true);
  assert.throws(()=>applyChanges(base,{exceptions:[{date:'2026-02-30',closed:true,shifts:[],note:''}]}));
});
test('duplicate exception and inverted time ranges rejected',()=>{
  const e={date:'2026-11-25',closed:false,shifts:[['16:00','09:00']],note:''};
  assert.throws(()=>applyChanges(base,{exceptions:[e]}));
  assert.throws(()=>applyChanges(base,{exceptions:[{...e,closed:true,shifts:[]},{...e,closed:true,shifts:[]}]}));
});
test('unknown field never writable by AI or admin',()=>{
  assert.throws(()=>applyChanges(base,{phoneTel:'00000000'}));
  assert.throws(()=>applyAiOperation(base,{action:'run_shell',cmd:'rm -rf /'}));
});
test('price changes target known service only',()=>{
  const changes=applyAiOperation(base,{action:'set_price',serviceId:'knip',price:'€27'});
  assert.equal(applyChanges(base,changes).services[0].price,'€27');
  assert.throws(()=>applyChanges(base,{services:[{...base.services[0],price:'free'}]}));
});
test('no accidental unbounded closure from announcement',()=>{
  const n=applyChanges(base,{announcement:{active:true,type:'alert',text:'Vandaag gesloten',forceClosedToday:true}});
  assert.equal(n.announcement.forceClosedToday,false);
});
test('Brussels date boundary is timezone aware',()=>{
  assert.equal(localBelgianDate(new Date('2026-11-17T23:30:00Z')),'2026-11-18');
});
