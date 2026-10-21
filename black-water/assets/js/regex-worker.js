'use strict';

function matchRegex({ text, pattern, flags }) {
  const expression=new RegExp(pattern,flags.includes('g')?flags:flags+'g');
  const matches=[];
  for (const match of String(text).matchAll(expression)) {
    matches.push((matches.length+1)+'. '+JSON.stringify(match[0])+' [index '+match.index+']');
    if (matches.length>=100) break;
  }
  return matches.length?matches.join('\n'):'Sin coincidencias.';
}

function handle(data, post) {
  try { post({result:matchRegex(data)}); }
  catch (error) { post({error:error instanceof Error?error.message:'Expresión regular inválida.'}); }
}

if (typeof module!=='undefined'&&module.exports) {
  const { isMainThread, parentPort }=require('node:worker_threads');
  module.exports={matchRegex};
  if (!isMainThread) parentPort.on('message',(data)=>handle(data,(result)=>parentPort.postMessage(result)));
} else {
  self.onmessage=(event)=>handle(event.data,(result)=>self.postMessage(result));
}
