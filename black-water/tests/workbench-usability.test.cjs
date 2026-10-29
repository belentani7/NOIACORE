'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const load=(file)=>fs.readFileSync(path.join(root,file),'utf8');
function workbench(){
 const global={NOIA:{core:{normalize:(value)=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}}};
 const document={readyState:'loading',getElementById:(id)=>id==='tool-input'||id==='tool-output'?{}:id==='tool-options'?{querySelector:()=>null}:null,addEventListener(){}};
 vm.runInNewContext(load('assets/js/lab.js'),{window:global,document,TextEncoder,TextDecoder,URL,Uint8Array,atob,btoa,setTimeout,clearTimeout,console},{filename:'lab.js'});
 return global.NOIA.lab;
}
test('CSV with UTF-8 BOM, multiline quoted fields and empty final cells',()=>{
 const lab=workbench();
 const records=JSON.parse(lab.csvToJson('\uFEFFname,note,age\r\n"Ada","hello\nworld",37\r\n"Jo","",'));
 assert.equal(records.length,2);
 assert.deepEqual(records[0],{name:'Ada',note:'hello\nworld',age:'37'});
 assert.deepEqual(records[1],{name:'Jo',note:'',age:''});
});
test('CSV rejects ambiguous header names and surplus columns',()=>{
 const lab=workbench();
 assert.throws(()=>lab.csvToJson('name,,age\nAda,foo,37'),/cabecera/i);
 assert.throws(()=>lab.csvToJson('name,name\nAda,Jo'),/duplicadas/i);
 assert.throws(()=>lab.csvToJson('name\nAda,Jo'),/columnas/i);
});
test('CSV neutralizes formulas even when preceded by whitespace',()=>{
 const lab=workbench();
 const csv=lab.jsonToCsv(JSON.stringify([{name:' =SUM(1,2)',cmd:'\t+7',normal:'safe'}]));
 assert.match(csv,/"' =SUM\(1,2\)"/);
 assert.match(csv,/"'\t\+7"/);
 assert.match(csv,/"safe"/);
});
test('workbench uses native accessible buttons and local file selection',()=>{
 const html=load('laboratorio.html');
 const script=load('assets/js/lab.js');
 const css=load('assets/css/experiences.css');
 assert.match(html,/id="tools-list"[^>]*role="group"/);
 assert.doesNotMatch(html,/role="listbox"/);
 assert.match(html,/id="tool-file"[^>]*type="file"/);
 assert.match(html,/id="tool-input" maxlength="262144"/);
 assert.match(html,/id="tool-status" role="status"/);
 assert.match(script,/aria-pressed/);
 assert.match(script,/ArrowDown.*ArrowUp.*Home.*End/);
 assert.match(script,/TextDecoder\('utf-8',\{fatal:true\}\)/);
 assert.match(script,/file.size>262144/);
 assert.match(css,/tools-list button:focus-visible/);
});
