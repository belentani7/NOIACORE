'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const source = readFileSync(join(__dirname,'../assets/js/nave.js'),'utf8');
const regions = [
  { id:'portal', name:'Portal', number:'01', description:'', longDescription:'', synonyms:[], href:'portal.html', key:'portal' },
  { id:'lab', name:'Lab', number:'02', description:'', longDescription:'', synonyms:[], href:'laboratorio.html', key:'lab' }
];

function engine(savedRegion = 'lab') {
  const store = new Map(savedRegion ? [['noiacore.last-region',savedRegion]] : []);
  const window = { NOIA: {
    DATA: { regions, commands: [] },
    core: { normalize:value=>String(value||'').toLowerCase(), motion:true },
    i18n: { current:'es', translate:key=>key }
  } };
  const context = {
    window,
    document: { readyState:'loading',getElementById(){return null;},addEventListener(){} },
    localStorage: {
      getItem:key=>store.get(key)||null,
      setItem:(key,value)=>store.set(key,value),
      removeItem:key=>store.delete(key)
    },
    console
  };
  vm.runInNewContext(source,context,{filename:'nave.js'});
  return window.NOIA.nave;
}

test('snapshot exports exactly preferences, never prompt histories or credentials',()=>{
  const value = engine().localSnapshot();
  assert.equal(value.region,'lab');
  assert.equal(value.language,'es');
  assert.equal(value.motion,true);
  assert.equal(value.version,1);
  const serialized = JSON.stringify(value);
  assert.doesNotMatch(serialized,/prompt|history|token|api[_-]?key|password/i);
  assert.equal(Object.keys(value).length,5);
});

test('strict import validation rejects unknown fields and arbitrary destinations',()=>{
  const nave = engine();
  const basic = {format:'NOIACORE_NAVE_STATE',version:1,region:'portal',language:'pt',motion:false};
  const valid = nave.validateSnapshot(basic);
  assert.equal(valid.region,'portal');
  assert.equal(valid.language,'pt');
  assert.equal(valid.motion,false);
  assert.equal(nave.validateSnapshot({...basic,region:'https://unsafe.example'}),null);
  assert.equal(nave.validateSnapshot({...basic,language:'javascript:alert(1)'}),null);
  assert.equal(nave.validateSnapshot({...basic,motion:'false'}),null);
  assert.equal(nave.validateSnapshot({...basic,secret:'do-not-export'}),null);
  assert.equal(nave.validateSnapshot({...basic,version:99}),null);
  assert.equal(nave.validateSnapshot(null),null);
});

test('stale region references are stripped rather than exported',()=>{
  assert.equal(engine('missing-region').localSnapshot().region,null);
});
