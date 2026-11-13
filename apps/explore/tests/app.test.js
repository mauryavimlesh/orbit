// App wiring regression only: a DOM double is not a browser/accessibility audit.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
function fixture(storage) {
 const elements=[];
 for(const match of html.matchAll(/<(\w+)([^>]+)>/g)) {
  const attrs=Object.fromEntries([...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  const classes=new Set((attrs.class||'').split(' '));
  const events={};
  elements.push({attrs,id:attrs.id,textContent:'',value:attrs.value||'',style:{},hidden:false,tabIndex:0,
   dataset:Object.fromEntries(Object.entries(attrs).filter(([k])=>k.startsWith('data-')).map(([k,v])=>[k.slice(5),v])),
   classList:{contains:k=>classes.has(k),remove:k=>classes.delete(k),toggle(k,on){if(on===undefined)on=!classes.has(k);on?classes.add(k):classes.delete(k)}},
   setAttribute(k,v){attrs[k]=v},getAttribute:k=>attrs[k]??null,
   addEventListener(k,cb){(events[k]??=[]).push(cb)},focus(){},
   fire(k,extra={}){const e={target:this,preventDefault(){},...extra};this['on'+k]?.(e);for(const cb of events[k]||[])cb(e)},
   getContext:()=>null,
  });
 }
 const doc={getElementById:id=>elements.find(e=>e.id===id),querySelectorAll(selector){const [,key,value]=selector.match(/^\[([^=\]]+)(?:="([^"]+)")?\]$/)||[];return elements.filter(e=>key in e.attrs&&(value===undefined||e.attrs[key]===value))}};
 globalThis.document=doc;globalThis.window={matchMedia:()=>({matches:true})};
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get:storage});
 globalThis.requestAnimationFrame=()=>{};
 return doc;
}
test('app starts and core handlers work with denied storage and no canvas context',async()=>{
 const doc=fixture(()=>{throw Error('denied')});
 await import('../src/app.js?blocked');
 const get=id=>doc.getElementById(id);
 assert.equal(get('play').getAttribute('aria-label'),'Play simulation');
 assert.equal(get('radiusText').textContent,'1.000 AU');
 get('graphics').fire('click');assert.equal(get('graphics').getAttribute('aria-pressed'),'true');
 get('language').value='hi';get('language').fire('change');assert.equal(get('headline').lang,'hi');
 get('play').fire('click');assert.equal(get('play').getAttribute('aria-label'),'Pause simulation');
 doc.querySelectorAll('[data-preset]').find(e=>e.dataset.preset==='escape').fire('click');assert.equal(get('speed').value,155);
 get('reset').fire('click');assert.equal(get('time').value,0);
 doc.querySelectorAll('[data-answer]').find(e=>e.dataset.answer==='escape').fire('click');assert.equal(get('masteryCount').textContent,'1 / 1 concepts');
});
test('startup preserves unsupported preferences rather than writing defaults over them',async()=>{
 let writes=0;fixture(()=>({getItem:()=>'{"schemaVersion":999}',setItem:()=>writes++}));
 await import('../src/app.js?unsupported');assert.equal(writes,0);
});
