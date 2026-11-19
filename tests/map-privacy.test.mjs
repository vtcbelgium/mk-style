import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../assets/js/main.js',import.meta.url),'utf8');

test('map placeholder loads no third-party iframe before visitor click',()=>{
  assert.match(html,/id="load-map-btn"/);
  assert.match(html,/data-map-src="https:\/\/www\.openstreetmap\.org\/export\/embed\.html/);
  assert.doesNotMatch(html,/<iframe\b/i);
  assert.match(html,/De kaart wordt pas geladen wanneer je op de knop klikt/);
});
test('click adds one OpenStreetMap iframe without sending a referrer',()=>{
  let click=null,attached=null;
  const button={
    dataset:{mapSrc:'https://www.openstreetmap.org/export/embed.html?bbox=1&layer=mapnik'},
    addEventListener:(type,handler,opts)=>{assert.equal(type,'click');assert.equal(opts.once,true);click=handler;}
  };
  const container={replaceChildren:(element)=>{attached=element;}};
  const context=vm.createContext({
    document:{
      addEventListener(){},
      getElementById(id){return id==='load-map-btn'?button:id==='map-container'?container:null;},
      createElement(tag){assert.equal(tag,'iframe');return {};}
    },
    window:{location:{href:'https://mkstyle.be/'}},
    Date,Intl,URL,console,setInterval() {}
  });
  vm.runInContext(source,context);
  vm.runInContext('setupMapOptIn()',context);
  assert.equal(typeof click,'function');
  assert.equal(attached,null,'The embed must not load before a deliberate click');
  click();
  assert.equal(attached.referrerPolicy,'no-referrer');
  assert.equal(attached.loading,'eager');
  assert.match(attached.src,/^https:\/\/www\.openstreetmap\.org\/export\/embed\.html/);
  assert.match(attached.title,/MK Style/);
});
test('map loader refuses third-party origins even if data attribute changes',()=>{
  let click=null,attached=false;
  const button={dataset:{mapSrc:'https://evil.example/embed.html'},addEventListener:(_,fn)=>{click=fn;}};
  const container={replaceChildren(){attached=true;}};
  const context=vm.createContext({
    document:{addEventListener(){},getElementById:id=>id==='load-map-btn'?button:container},
    window:{location:{href:'https://mkstyle.be/'}},Date,Intl,URL,console
  });
  vm.runInContext(source,context);
  vm.runInContext('setupMapOptIn()',context);
  click();
  assert.equal(attached,false);
});
