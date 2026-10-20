/* NOIACORE / Local Workbench
   Every entry in this catalog executes. No calls to paid providers or services.
   A text processor is described as a text processor, never as a trained AI. */
(function (global) {
  'use strict';
  const NOIA = global.NOIA = global.NOIA || {};
  const core = NOIA.core;
  const normalize = core.normalize;
  const $ = (id) => document.getElementById(id);
  const input = $('tool-input');
  const output = $('tool-output');
  if (!input || !output) return;
  const list = $('tools-list');
  const categories = $('tool-categories');
  const search = $('tool-search');
  const options = $('tool-options');
  const toolName = $('tool-title');
  const toolDescription = $('tool-description');
  const toolCategory = $('tool-category-label');
  const toolCode = $('tool-stage-code');
  const status = $('tool-status');
  function words(text) {
    return text.trim().match(/\S+/gu) || [];
  }
  function lines(text) {
    return text.replace(/\r\n?/g,'\n').split('\n');
  }
  function slug(text) {
    return normalize(text).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  }
  function titleCase(text) {
    return text.toLocaleLowerCase('es').replace(/(^|[\s([{"'«])([\p{L}])/gu,(_,start,letter)=>start+letter.toLocaleUpperCase('es'));
  }
  function sentences(text) {
    return text.toLocaleLowerCase('es').replace(/(^\s*|[.!?]\s+)([\p{L}])/gu,(_,start,letter)=>start+letter.toLocaleUpperCase('es'));
  }
  function protectCsv(value) {
    const raw = value == null ? '' : String(value);
    const escaped = /^[=+@\-\t\r]/.test(raw) ? "'"+raw : raw;
    return '"'+escaped.replaceAll('"','""')+'"';
  }
  function parseCsv(source) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i=0;i<source.length;i++) {
      const char = source[i];
      const next = source[i+1];
      if (char === '"') {
        if (quoted && next === '"') {cell+='"';i++;}
        else if (quoted) quoted=false;
        else if (cell.length===0) quoted=true;
        else throw new Error('CSV inválido: comillas inesperadas.');
      } else if (char === ',' && !quoted) {
        row.push(cell);cell='';
      } else if ((char === '\n' || char === '\r') && !quoted) {
        if (char==='\r' && next==='\n') i++;
        row.push(cell);rows.push(row);row=[];cell='';
      } else cell+=char;
    }
    if (quoted) throw new Error('CSV inválido: falta cerrar comillas.');
    if (cell || row.length) {row.push(cell);rows.push(row);}
    return rows;
  }
  function csvToJson(text) {
    const rows = parseCsv(text).filter((row)=>row.some((cell)=>cell.trim()));
    if (!rows.length) return '[]';
    const headers = rows.shift().map((x)=>x.trim());
    if (new Set(headers).size !== headers.length) throw new Error('Cabeceras CSV duplicadas.');
    return JSON.stringify(rows.map((row)=>Object.fromEntries(headers.map((header,i)=>[header,row[i]??'']))),null,2);
  }
  function jsonToCsv(text) {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('El JSON debe ser un array de objetos.');
    if (!data.length) return '';
    if (!data.every((row)=>row && typeof row==='object' && !Array.isArray(row))) {
      throw new Error('Todos los elementos deben ser objetos.');
    }
    const headers=[...new Set(data.flatMap((row)=>Object.keys(row)))];
    return [headers.map(protectCsv).join(','),...data.map((row)=>headers.map((key)=>protectCsv(row[key])).join(','))].join('\r\n');
  }
  function b64Encode(value) {
    const bytes = new TextEncoder().encode(value);
    let binary='';
    for (const byte of bytes) binary+=String.fromCharCode(byte);
    return btoa(binary);
  }
  function b64Decode(value) {
    const raw=atob(value.trim());
    return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,(character)=>character.charCodeAt(0)));
  }
  function htmlEscape(value) {
    return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function htmlUnescape(value) {
    return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|#39);/gi,(_,entity)=>{
      const map={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",'#39':"'"};
      const key=entity.toLowerCase();
      if (map[key]) return map[key];
      const number=key.startsWith('#x')?parseInt(key.slice(2),16):parseInt(key.slice(1),10);
      return Number.isInteger(number)&&number>=0&&number<=0x10ffff&&!(number>=0xd800&&number<=0xdfff)?String.fromCodePoint(number):'�';
    });
  }
  function extractUrls(text) {
    const matches=text.match(/https?:\/\/[^\s"'<>]+/g)||[];
    return [...new Set(matches.map((x)=>x.replace(/[),.?!;]+$/g,'')))].join('\n');
  }
  function extractEmails(text) {
    const result=text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi)||[];
    return [...new Set(result.map((x)=>x.toLowerCase()))].join('\n');
  }
  function analyseText(text) {
    const sentences=text.split(/[.!?]+/).map((x)=>x.trim()).filter(Boolean).length;
    const wordList=words(text);
    const charCount=[...text].length;
    const charactersWithoutSpaces=[...text.replace(/\s/g,'')].length;
    return [
      'PALABRAS: '+wordList.length,
      'CARACTERES: '+charCount,
      'CARACTERES SIN ESPACIOS: '+charactersWithoutSpaces,
      'LÍNEAS: '+lines(text).length,
      'FRASES (APROX.): '+sentences,
      'TIEMPO DE LECTURA (200 PALABRAS/MIN): '+Math.ceil(wordList.length/200)+' min',
      'BYTES UTF-8: '+new TextEncoder().encode(text).length
    ].join('\n');
  }
  function getOption(id, fallback='') {
    const field = options.querySelector(`[name="${id}"]`);
    return field ? field.value : fallback;
  }
  function regexMatches(text) {
    const pattern=getOption('pattern');
    if (!pattern) throw new Error('Introduce una expresión regular.');
    if (pattern.length>250) throw new Error('Patrón demasiado largo.');
    const flags=getOption('flags','giu');
    if (!/^[gimsuy]*$/.test(flags)||new Set(flags).size!==flags.length) throw new Error('Flags inválidos.');
    if (text.length>20000) throw new Error('Entrada demasiado larga para una prueba de regex.');
    const expression=new RegExp(pattern,flags.includes('g')?flags:flags+'g');
    const matches=[...text.matchAll(expression)].slice(0,100);
    return matches.length ? matches.map((m,i)=>(i+1)+'. '+JSON.stringify(m[0])+' [index '+m.index+']').join('\n') : 'Sin coincidencias.';
  }
  function contrast(text) {
    const colors=text.trim().split(/[\s,;]+/).filter(Boolean);
    if (colors.length!==2) throw new Error('Introduce dos colores HEX separados por un espacio.');
    function rgb(hex) {
      const clean=hex.replace(/^#/,'');
      const full=clean.length===3?clean.split('').map((x)=>x+x).join(''):clean;
      if (!/^[\da-f]{6}$/i.test(full)) throw new Error('Color HEX inválido: '+hex);
      return [0,2,4].map((i)=>parseInt(full.slice(i,i+2),16)/255);
    }
    const luminance = (arr) => arr.map((channel)=>channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4)
      .reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
    const [a,b]=colors.map((hex)=>luminance(rgb(hex)));
    const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    return [
      'CONTRASTE: '+ratio.toFixed(2)+':1',
      'WCAG AA texto normal: '+(ratio>=4.5?'SÍ':'NO'),
      'WCAG AA texto grande: '+(ratio>=3?'SÍ':'NO'),
      'WCAG AAA texto normal: '+(ratio>=7?'SÍ':'NO')
    ].join('\n');
  }
  const tool = (id,title,category,description,run,settings=[]) => ({id,title,category,description,run,settings});
  const catalog = [
    tool('upper','Mayúsculas','Texto','Convierte todos los caracteres al formato de mayúsculas.',(t)=>t.toLocaleUpperCase('es')),
    tool('lower','Minúsculas','Texto','Convierte a minúsculas respetando caracteres Unicode.',(t)=>t.toLocaleLowerCase('es')),
    tool('title','Tipo título','Texto','Capitaliza el inicio de cada palabra.',titleCase),
    tool('sentences','Tipo frase','Texto','Capitaliza el inicio de cada frase.',sentences),
    tool('slug','Crear slug','Texto','Genera una ruta URL legible a partir de texto.',slug),
    tool('trim','Recortar bordes','Texto','Elimina espacios sobrantes al comienzo y al final.',(t)=>t.trim()),
    tool('space','Compactar espacios','Texto','Normaliza espacios repetidos sin perder los párrafos.',(t)=>t.replace(/[^\S\n]+/g,' ').replace(/\n{3,}/g,'\n\n').trim()),
    tool('diacritics','Eliminar tildes','Texto','Genera texto latino sin marcas diacríticas.',(t)=>t.normalize('NFKD').replace(/[\u0300-\u036f]/g,'')),
    tool('dedupe','Líneas únicas','Texto','Elimina líneas duplicadas conservando la primera aparición.',(t)=>[...new Set(lines(t))].join('\n')),
    tool('sorted','Ordenar líneas','Texto','Ordena líneas alfabéticamente en español.',(t)=>lines(t).sort((a,b)=>a.localeCompare(b,'es')).join('\n')),
    tool('reverse','Invertir líneas','Texto','Invierte el orden de las líneas.',(t)=>lines(t).reverse().join('\n')),
    tool('number','Numerar líneas','Texto','Añade un número correlativo a cada línea.',(t)=>lines(t).map((x,i)=>String(i+1).padStart(2,'0')+'. '+x).join('\n')),
    tool('count','Analizar longitud','Texto','Cuenta palabras, caracteres, líneas y tiempo aproximado de lectura.',analyseText),
    tool('initials','Iniciales','Texto','Extrae la primera letra de cada palabra.',(t)=>words(t).map((w)=>[...w][0].toLocaleUpperCase('es')).join('')),
    tool('emails','Extraer emails','Extracción','Detecta y deduplica direcciones de correo dentro de un texto.',extractEmails),
    tool('urls','Extraer URLs','Extracción','Encuentra direcciones HTTP(S) en un texto.',extractUrls),
    tool('numbers','Extraer números','Extracción','Detecta números enteros y decimales.',(t)=>(t.match(/[-+]?\d+(?:[.,]\d+)?/g)||[]).join('\n')),
    tool('json-pretty','JSON legible','Datos','Valida el JSON y lo presenta con sangría de dos espacios.',(t)=>JSON.stringify(JSON.parse(t),null,2)),
    tool('json-compact','JSON compacto','Datos','Elimina espacios superfluos manteniendo el significado JSON.',(t)=>JSON.stringify(JSON.parse(t))),
    tool('json-valid','Validar JSON','Datos','Comprueba si el contenido es un JSON válido.',(t)=>{ const obj=JSON.parse(t); return 'JSON VÁLIDO\nTipo: '+(Array.isArray(obj)?'Array':obj===null?'null':typeof obj); }),
    tool('csv-json','CSV → JSON','Datos','Convierte un CSV separado por comas con cabeceras a objetos JSON.',csvToJson),
    tool('json-csv','JSON → CSV','Datos','Exporta un array de objetos como CSV, neutralizando fórmulas de hoja de cálculo.',jsonToCsv),
    tool('url-encode','Codificar URL','Codificación','Aplica encodeURIComponent para parámetros de URL.',encodeURIComponent),
    tool('url-decode','Decodificar URL','Codificación','Recupera un valor codificado como componente de URL.',decodeURIComponent),
    tool('html-encode','Escapar HTML','Codificación','Convierte caracteres reservados en entidades HTML seguras.',htmlEscape),
    tool('html-decode','Decodificar HTML','Codificación','Decodifica entidades HTML comunes y numéricas.',htmlUnescape),
    tool('base64-encode','Texto → Base64','Codificación','Codifica texto UTF-8 en Base64. No es cifrado.',b64Encode),
    tool('base64-decode','Base64 → texto','Codificación','Decodifica Base64 como texto UTF-8.',b64Decode),
    tool('uri-parts','Analizar URL','Datos','Extrae protocolo, host, ruta y parámetros de una URL.',(t)=>{
      const url=new URL(t.trim());
      return JSON.stringify({protocol:url.protocol,host:url.host,pathname:url.pathname,params:Object.fromEntries(url.searchParams.entries()),hash:url.hash},null,2);
    }),
    tool('regex','Prueba Regex','Desarrollo','Busca coincidencias de una expresión regular local.',regexMatches,[{name:'pattern',label:'PATRÓN',placeholder:'\\b[A-Z]+\\b'},{name:'flags',label:'FLAGS',value:'giu'}]),
    tool('replace','Buscar / reemplazar','Texto','Reemplaza texto literal sin expresiones regulares.',(t)=>{
      const find=getOption('find');
      if (!find) throw new Error('Escribe el texto que quieres buscar.');
      return t.split(find).join(getOption('replace'));
    },[{name:'find',label:'BUSCAR'},{name:'replace',label:'REEMPLAZAR'}]),
    tool('contrast','Contraste WCAG','Diseño','Calcula el contraste entre dos colores HEX y evalúa los umbrales WCAG.',contrast)
  ];
  const filters=['Todas',...new Set(catalog.map((t)=>t.category))];
  let active=catalog[0];
  let category='Todas';
  function categoryButton(text) {
    const button=core.create('button','',text);
    button.type='button';
    button.className=text===category?'active':'';
    button.addEventListener('click',()=>{
      category=text;
      renderCategories();
      renderList();
    });
    return button;
  }
  function renderCategories() {
    categories.replaceChildren(...filters.map(categoryButton));
  }
  function renderList() {
    list.replaceChildren();
    const value=normalize(search.value);
    const filtered=catalog.filter((item)=>{
      return (category==='Todas'||item.category===category)&&
        (!value||normalize(item.title+' '+item.description+' '+item.category).includes(value));
    });
    filtered.forEach((item)=>{
      const node=core.create('button','');
      node.type='button';
      node.setAttribute('role','option');
      node.setAttribute('aria-selected',String(active.id===item.id));
      node.append(core.create('span','',item.title),core.create('span','','↗'));
      node.addEventListener('click',()=>select(item));
      list.append(node);
    });
    if (!filtered.length) list.append(core.create('p','micro-label','NO RESULTS'));
  }
  function renderOptions(item) {
    options.replaceChildren();
    (item.settings||[]).forEach((setting)=>{
      const label=core.create('label','',setting.label);
      const field=document.createElement('input');
      field.name=setting.name;
      field.type='text';
      field.value=setting.value||'';
      field.placeholder=setting.placeholder||'';
      field.maxLength=250;
      label.append(field);
      options.append(label);
    });
  }
  function select(item) {
    active=item;
    toolName.textContent=item.title;
    toolDescription.textContent=item.description;
    toolCategory.textContent=item.category.toUpperCase();
    toolCode.textContent='LAB/'+String(catalog.indexOf(item)+1).padStart(3,'0');
    status.textContent='';
    output.value='';
    renderOptions(item);
    renderList();
  }
  function execute() {
    status.textContent='';
    if (!input.value.trim()) {
      status.textContent=NOIA.i18n.translate('lab.empty');
      input.focus();
      return;
    }
    try {
      const result=active.run(input.value);
      output.value=String(result??'');
      status.textContent=NOIA.i18n.translate('lab.ready');
      NOIA.water?.pulse();
    } catch (error) {
      output.value='';
      status.textContent=(error instanceof Error?error.message:NOIA.i18n.translate('lab.failed')).slice(0,200);
    }
  }
  async function copyResult() {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      core.toast(NOIA.i18n.translate('lab.copied'));
    } catch {
      output.focus();
      output.select();
      core.toast(NOIA.i18n.translate('copy.failed'));
    }
  }
  function init() {
    $('tools-count').textContent=String(catalog.length).padStart(2,'0');
    renderCategories();
    select(active);
    search.addEventListener('input',renderList);
    $('tool-run').addEventListener('click',execute);
    $('tool-clear').addEventListener('click',()=>{input.value='';output.value='';status.textContent='';input.focus();});
    $('tool-copy').addEventListener('click',copyResult);
    $('tool-download').addEventListener('click',()=>{
      if (!output.value) return;
      core.downloadText(output.value,'NOIACORE-'+active.id+'.txt');
    });
    input.addEventListener('keydown',(event)=>{
      if ((event.ctrlKey||event.metaKey)&&event.key==='Enter') {event.preventDefault();execute();}
    });
  }
  NOIA.lab={catalog,parseCsv,csvToJson,jsonToCsv,htmlEscape,slug,analyseText};
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})(window);
