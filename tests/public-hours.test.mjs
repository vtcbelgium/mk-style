import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/js/main.js', import.meta.url), 'utf8');
const base = JSON.parse(readFileSync(new URL('../data/site-config.json', import.meta.url), 'utf8'));

function hoursFor(config, now) {
  const list = {innerHTML:''};
  const context = vm.createContext({
    __config:config,__now:now,
    document:{getElementById:id=>id==='hours-list'?list:null,addEventListener(){}},
    setInterval() {},console,Intl,Date
  });
  vm.runInContext(source, context);
  vm.runInContext('renderHours(__config,__now)', context);
  return list.innerHTML;
}
function dayCell(html,label){
  const at=html.indexOf(label);
  assert.ok(at>=0,'Expected '+label+' in hours schedule');
  const tail=html.slice(at);
  const match=tail.match(/<span class="hours-time">([\s\S]*?)<\/span>/);
  assert.ok(match,'Expected hours for '+label);
  return match[1];
}
test('tomorrow date-specific closure appears before its date arrives',()=>{
  const config=structuredClone(base);
  config.exceptions=[{date:'2026-11-19',closed:true,shifts:[],note:'Feestdag'}];
  const html=hoursFor(config,{dayIdx:3,dayKey:'wednesday',date:'2026-11-18'});
  assert.match(dayCell(html,'Donderdag'),/Gesloten \(Feestdag\)/);
  assert.match(dayCell(html,'Vrijdag'),/09:30/);
});
test('next week date-specific exception appears for a weekday already passed',()=>{
  const config=structuredClone(base);
  config.exceptions=[{date:'2026-11-23',closed:false,shifts:[['11:00','14:00']],note:'Uitzonderlijk open'}];
  const html=hoursFor(config,{dayIdx:3,dayKey:'wednesday',date:'2026-11-18'});
  assert.match(dayCell(html,'Maandag'),/11:00 – 14:00/);
  assert.doesNotMatch(dayCell(html,'Maandag'),/Gesloten/);
});
test('next occurrence uses correct calendar date across DST',()=>{
  const config=structuredClone(base);
  config.exceptions=[{date:'2027-03-29',closed:false,shifts:[['10:00','13:00']],note:'Uitzonderlijk open'}];
  const html=hoursFor(config,{dayIdx:6,dayKey:'saturday',date:'2027-03-27'});
  assert.match(dayCell(html,'Maandag'),/10:00 – 13:00/);
});
