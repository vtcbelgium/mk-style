import test from 'node:test';
import assert from 'node:assert/strict';
import { applyChanges, applyAiOperation, isIsoDate, localBelgianDate, datesInRange } from '../functions/_lib/site.js';
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

test('eleven-day holiday period closes exactly those dates and preserves the weekly schedule',()=>{
  const change=applyAiOperation(base,{action:'set_exception_range',startDate:'2027-08-10',endDate:'2027-08-20',closed:true,note:'Jaarlijks verlof'});
  const updated=applyChanges(base,change);
  assert.equal(updated.exceptions.length,11);
  assert.equal(updated.exceptions[0].date,'2027-08-10');
  assert.equal(updated.exceptions.at(-1).date,'2027-08-20');
  assert.ok(updated.exceptions.every(e=>e.closed&&e.shifts.length===0));
  assert.deepEqual(updated.hours,base.hours);
});
test('holiday range crosses summer-time switch without dropping a day',()=>{
  assert.deepEqual(datesInRange('2027-03-27','2027-03-29'),['2027-03-27','2027-03-28','2027-03-29']);
});
test('holiday range reuses existing exceptions without duplicates',()=>{
  const data={...base,exceptions:[{date:'2027-08-12',closed:false,shifts:[['10:00','12:00']],note:'oud'}]};
  const change=applyAiOperation(data,{action:'set_exception_range',startDate:'2027-08-10',endDate:'2027-08-13',closed:true,note:'Vakantie'});
  const next=applyChanges(data,change);
  assert.equal(next.exceptions.length,4);
  assert.equal(next.exceptions.filter(e=>e.date==='2027-08-12').length,1);
  assert.equal(next.exceptions.find(e=>e.date==='2027-08-12').note,'Vakantie');
});
test('unsafe holiday durations, invalid dates and open-range misuse are rejected',()=>{
  assert.throws(()=>datesInRange('2027-09-01','2027-08-01'));
  assert.throws(()=>datesInRange('2027-07-01','2027-08-01')); // 32 days
  assert.throws(()=>datesInRange('2027-02-30','2027-03-03'));
  assert.throws(()=>applyAiOperation(base,{action:'set_exception_range',startDate:'2027-08-10',endDate:'2027-08-13',closed:false}));
  assert.throws(()=>applyAiOperation(base,{action:'set_exception_range',startDate:'2027-08-10',endDate:'2027-08-13',closed:true,note:'<script>'}));
});
