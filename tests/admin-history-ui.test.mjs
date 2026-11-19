import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../assets/js/admin-v2.js',import.meta.url),'utf8');

function createUi(history) {
  const root={
    children:[],textContent:'',
    replaceChildren(){this.children=[];},
    append(...items){this.children.push(...items);}
  };
  let unsafeHtmlSet=false;
  const document={
    addEventListener(){},
    getElementById(id){return id==='change-history'?root:null;},
    createElement(tag){
      const item={
        tag,children:[],style:{},_text:'',
        set textContent(s){this._text=String(s);},
        get textContent(){return this._text;},
        set innerHTML(_s){unsafeHtmlSet=true;},
        append(...items){this.children.push(...items);}
      };
      return item;
    }
  };
  const context=vm.createContext({
    document,
    fetch:async()=>({ok:true,json:async()=>({history})}),
    Date,Intl,console,clearTimeout(){},setTimeout(){}
  });
  vm.runInContext(source,context);
  return {root,context,get unsafeHtmlSet(){return unsafeHtmlSet;}};
}

test('admin history shows last 10 entries as text, never as HTML',async()=>{
  const history=Array.from({length:12},(_,i)=>({
    version:12-i,source:i?'manual':'ai',
    created_at:'2026-11-19T10:30:00Z',
    actor:i?'38mkstyle@gmail.com':'<img src=x onerror=alert(1)>'
  }));
  const ui=createUi(history);
  await vm.runInContext('refreshHistory()',ui.context);
  assert.equal(ui.root.children.length,10);
  assert.match(ui.root.children[0].children[0].textContent,/Versie 12 · AI-voorstel bevestigd/);
  assert.match(ui.root.children[0].children[1].textContent,/<img src=x onerror=alert\(1\)>/);
  assert.equal(ui.unsafeHtmlSet,false);
});
test('empty audit history is explained instead of presenting a broken UI',async()=>{
  const ui=createUi([]);
  await vm.runInContext('refreshHistory()',ui.context);
  assert.match(ui.root.children[0].textContent,/Nog geen wijzigingen/);
});
