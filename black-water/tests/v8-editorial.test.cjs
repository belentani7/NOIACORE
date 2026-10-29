'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..','..','src','main','resources','static');
const names=["manifesto","capacidades","arquitetura","sistema-latente","casos","processo","shader-atelier","signal","limites","telemetria","iteracao","terminal","axiomas","optica","galeria","neural","historico","mapa","fabrica","observatorio"];
test('NOIACORE v8 retains source and does not silently transmit personal briefs',()=>{
 const s=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(s.length>200000);
 assert.ok(s.includes('id="noia-next"'));
 assert.ok(s.includes('noiacore-editorial.css'));
 assert.ok(!s.includes("fetch('/api/contactos'"));
});
test('20 legacy environments have unique contextual content, navigation and discoverability',()=>{
 const css=fs.readFileSync(path.join(root,'noiacore-editorial.css'),'utf8');
 assert.match(css,/prefers-reduced-motion/);
 const titles=new Set();
 for(const name of names){
  const s=fs.readFileSync(path.join(root,name+'.html'),'utf8');
  assert.ok(s.includes('lang="pt-BR"'),'lang: '+name);
  assert.ok(s.includes('data-env-module="'+name+'"'));
  assert.ok(s.includes('href="/noiacore-editorial.css"'));
  assert.ok(s.includes('href="#conteudo"'));
  assert.ok(s.includes('<main id="conteudo">'));
  assert.match(s,/<meta name="description"/);
  const h=s.match(new RegExp('<h2 id="feature-'+name+'">([^<]+)</h2>'))?.[1];
  assert.ok(h,'missing heading: '+name);
  assert.ok(!titles.has(h),'repeated: '+name);
  titles.add(h);
 }
 assert.equal(titles.size,20);
});
