/* NAVE / A semantic intent router, NOT a generative chatbot.
   Privacy: evaluates local text, saves at most a category id, and uses no fetch.
   Search heuristics are exposed so responses can explain their own evidence. */
(function (global) {
  'use strict';
  const NOIA = global.NOIA = global.NOIA || {};
  const { regions, commands } = NOIA.DATA;
  const normalize = NOIA.core.normalize;
  const stopWords = new Set([
    'el','la','los','las','de','del','por','para','un','una','unos','unas','con','sin',
    'en','al','que','como','quiero','necesito','hacer','me','mi','sobre','sobre','estoy',
    'and','the','with','for','from','find','need','want','i','a','an','to','is','in',
    'do','da','das','dos','uma','um','quero','preciso','fazer','ser','no','na','pra'
  ]);
  const safeStore = (key,value) => {
    try { localStorage.setItem(key,value); } catch { /* storage optional */ }
  };
  const phraseAliases = {
    'pagina web': 'web',
    'pagina de internet': 'web',
    'pagina interactiva': 'inmersiva',
    'site web': 'web',
    'web site': 'website',
    'seguranca': 'seguridad',
    'privacidade': 'privacidad',
    'design generativo': 'arte',
    'seguridad informatica': 'seguridad',
    'chatbot': 'asistente',
    'dashboard': 'sistemas',
    'landing page': 'web'
  };
  function tokens(input) {
    let clean = normalize(input).replace(/[^a-z0-9\s-]/g,' ');
    for (const [phrase, replacement] of Object.entries(phraseAliases)) {
      clean = clean.replaceAll(phrase,replacement);
    }
    const list = clean.split(/\s+/).filter(Boolean);
    return list.filter((word) => word.length >= 2 && !stopWords.has(word));
  }
  function scoreRegion(region, words, original) {
    const evidence = [];
    let score = 0;
    const synonyms = region.synonyms.map(normalize);
    const title = normalize(region.name);
    const description = normalize(region.description);
    const query = normalize(original);
    const used = new Set();
    for (const word of words) {
      if (used.has(word)) continue;
      used.add(word);
      if (synonyms.includes(word)) {
        score += 8;
        evidence.push(word);
      } else if (title.split(/\s+/).includes(word)) {
        score += 11;
        evidence.push(word);
      } else if (word.length > 4 && synonyms.some((syn) => syn.startsWith(word))) {
        score += 3;
        evidence.push(word);
      } else if (description.includes(word) && word.length > 4) {
        score += 2;
        evidence.push(word);
      }
    }
    if (query.includes(title)) score += 6;
    const key = normalize(region.key);
    if (query.includes(key) && key.length > 3) score += 5;
    return { region, score, evidence: [...new Set(evidence)].slice(0,8) };
  }
  function interpret(input) {
    const query = String(input||'').trim().slice(0,500);
    const words = tokens(query);
    const candidates = regions.map((region) => scoreRegion(region,words,query))
      .sort((a,b) => b.score-a.score || Number(a.region.number)-Number(b.region.number));
    const best = candidates[0];
    const matched = candidates.filter((x) => x.score > 0);
    const confidence = best && best.score ? Math.min(.95,.28 + best.score/65) : 0;
    const ambiguous = matched.length >= 2 && matched[1].score >= matched[0].score*.85;
    return {
      query,
      words,
      best: best?.score > 0 ? best : null,
      alternatives: matched.filter((x) => x !== best).slice(0,3),
      confidence,
      ambiguous,
      matches: matched,
      fallback: best?.score ? '' : NOIA.i18n.translate('nave.unknown')
    };
  }
  function writeCategory(result) {
    if (!result.best) return;
    safeStore('noiacore.last-region',result.best.region.id);
  }
  function createRouteChip(region) {
    const anchor = document.createElement('a');
    anchor.href = region.href;
    anchor.textContent = region.name + ' ↗';
    return anchor;
  }
  function renderAdaptive(result, mount) {
    if (!mount) return;
    mount.replaceChildren();
    const label = NOIA.core.create('span','micro-label',
      result.best ? NOIA.i18n.translate('nave.detected') : 'NO CLEAR SIGNAL');
    const title = NOIA.core.create('h3','',
      result.best ? result.best.region.name : 'Aún no existe una ruta única.');
    const desc = NOIA.core.create('p','',
      result.best ? result.best.region.longDescription : result.fallback);
    mount.append(label,title,desc);
    if (result.best) {
      const proof = NOIA.core.create('p','',
        'Señales: ' + (result.best.evidence.join(', ') || result.best.region.key) + '.');
      proof.className = 'micro-label';
      mount.append(proof);
    }
    const choices = NOIA.core.create('div','adaptive-choices');
    const regionsToShow = result.best ? [result.best.region,...result.alternatives.map((x)=>x.region)] : regions.slice(0,4);
    regionsToShow.forEach((region) => choices.append(createRouteChip(region)));
    mount.append(choices);
  }
  function renderHome(result) {
    const area = document.querySelector('[data-intent-result]');
    if (!area) return;
    area.replaceChildren();
    const heading = NOIA.core.create('h3','',result.best ? result.best.region.name : 'NO CLEAR MATCH');
    const desc = NOIA.core.create('p','',result.best ? result.best.region.description : result.fallback);
    area.append(heading,desc);
    if (result.best) area.append(createRouteChip(result.best.region));
    writeCategory(result);
    NOIA.water?.pulse();
  }
  function initHome() {
    const input = document.querySelector('[data-intent-input]');
    const button = document.querySelector('[data-intent-submit]');
    if (!input) return;
    const run = () => {
      const text = input.value.trim();
      if (!text) { input.focus(); return; }
      renderHome(interpret(text));
    };
    button?.addEventListener('click',run);
    input.addEventListener('keydown',(event) => {
      if (event.key === 'Enter') { event.preventDefault(); run(); }
    });
    document.querySelectorAll('[data-intent]').forEach((node) => {
      node.addEventListener('click',() => { input.value = node.dataset.intent; run(); });
    });
  }
  const node = document.getElementById('term-output');
  let history = [];
  let historyIndex = 0;
  function line(kind, body) {
    if (!node) return;
    const element = NOIA.core.create('div','term-line term-line--'+kind,body);
    node.append(element);
    node.scrollTop = node.scrollHeight;
    return element;
  }
  function multi(items,kind='system') {
    items.forEach((item) => line(kind,item));
  }
  function welcome() {
    line('system','NOIACORE / NAVE 1.0 \u2014 LOCAL INTENT ENGINE');
    line('system','────────────────────────────────────────────────────');
    line('nave',NOIA.i18n.translate('nave.welcome'));
    line('system',NOIA.i18n.translate('nave.hint'));
    line('system','────────────────────────────────────────────────────');
  }
  function renderTerminal(result) {
    if (!node) return;
    if (!result.best) {
      line('nave',result.fallback);
      multi(regions.slice(0,4).map((r) => r.number + ' / ' + r.name + ' — ' + r.description));
      renderAdaptive(result,document.getElementById('adaptive-panel'));
      return;
    }
    const first = result.best;
    line('nave',NOIA.i18n.translate('nave.detected') + ' / ' + first.region.name);
    line('nave',first.region.longDescription);
    line('system',NOIA.i18n.translate('nave.reasons') + ': ' + first.evidence.join(' · '));
    line('system','Relación heurística: ' + Math.round(result.confidence*100) + '% · No es una certeza estadística.');
    const route = line('nave','DESTINO → ');
    const anchor = NOIA.core.create('a','',first.region.name + ' ↗');
    anchor.href = first.region.href;
    route.append(anchor);
    if (result.alternatives.length) {
      line('system',NOIA.i18n.translate('nave.alternatives') + ': ' + result.alternatives.map((x) => x.region.name).join(' / '));
    }
    if (result.ambiguous) {
      line('system','La intención puede pertenecer a más de una región: puedes elegir la que prefieras.');
    }
    writeCategory(result);
    renderAdaptive(result,document.getElementById('adaptive-panel'));
    NOIA.water?.pulse();
  }
  function commandStatus() {
    const gl = Boolean(document.createElement('canvas').getContext('webgl'));
    return [
      'SYSTEM STATUS / VERIFIABLE',
      'Motor semántico: reglas JavaScript locales',
      'Conexión con modelos remotos: ninguna',
      'Telemetría / analítica: ninguna',
      'Render WebGL disponible: ' + (gl ? 'sí' : 'no'),
      'Movimiento: ' + (NOIA.core.motion ? 'activo' : 'reducido'),
      'Rutas catalogadas: ' + regions.length,
      'Datos del prompt persistidos: no'
    ];
  }
  function processCommand(value) {
    const raw = String(value || '').trim();
    if (!raw) return;
    line('user',raw);
    history.push(raw);
    if (history.length > 30) history.shift();
    historyIndex = history.length;
    const [cmd,...rest] = raw.split(/\s+/);
    const verb = normalize(cmd);
    const argument = rest.join(' ').trim();
    if (verb === 'help' || verb === '?') {
      multi(commands.map((c) => c.word.padEnd(18,' ') + c.description));
      return;
    }
    if (verb === 'status') { multi(commandStatus()); return; }
    if (verb === 'explore' || verb === 'map') {
      multi(regions.map((r) => r.number + ' / ' + r.name + ' — ' + r.description));
      return;
    }
    if (verb === 'clear') {
      node?.replaceChildren();
      welcome();
      return;
    }
    if (verb === 'time') { line('system',new Date().toLocaleString()); return; }
    if (verb === 'reset') {
      try { localStorage.removeItem('noiacore.last-region'); localStorage.removeItem('noiacore.motion'); }
      catch { /* optional */ }
      NOIA.core.setMotion(true);
      NOIA.water?.setActive(true);
      NOIA.eye?.setActive(true);
      line('system',NOIA.i18n.translate('nave.reset'));
      return;
    }
    if (verb === 'motion' || verb === 'water' || verb === 'eye') {
      if (!['on','off'].includes(normalize(argument))) {
        line('system',verb.toUpperCase() + ' ON / OFF');
        return;
      }
      const active = normalize(argument) === 'on';
      if (verb === 'motion') NOIA.core.setMotion(active);
      if (verb === 'water') NOIA.water?.setActive(active);
      if (verb === 'eye') NOIA.eye?.setActive(active);
      line('system',verb.toUpperCase() + ' / ' + argument.toUpperCase());
      return;
    }
    if (verb === 'lang') {
      const chosen = normalize(argument);
      const ok = NOIA.i18n.setLanguage(chosen);
      line('system',ok ? 'LANG / ' + chosen.toUpperCase() : 'LANG ES / EN / PT');
      return;
    }
    if (verb === 'open') {
      const match = regions.find((r) => normalize(r.name) === normalize(argument) || normalize(r.id) === normalize(argument));
      if (match) { NOIA.core.navigate(match.href); return; }
      line('system','Región no identificada. Usa EXPLORE.');
      return;
    }
    if (verb === 'search') {
      if (!argument) { line('system','Uso: SEARCH [descripción]'); return; }
      renderTerminal(interpret(argument));
      return;
    }
    if (['login','connect','model','ai'].includes(verb) && !argument) {
      line('system',NOIA.i18n.translate('nave.no-model'));
      return;
    }
    renderTerminal(interpret(raw));
  }
  function initPortal() {
    const form = document.getElementById('term-form');
    const input = document.getElementById('term-input');
    if (!form || !input) return;
    welcome();
    document.getElementById('term-clear')?.addEventListener('click',() => {
      node?.replaceChildren();
      welcome();
    });
    form.addEventListener('submit',(event) => {
      event.preventDefault();
      const value = input.value;
      input.value = '';
      processCommand(value);
      input.focus();
    });
    input.addEventListener('keydown',(event) => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      if (!history.length) return;
      event.preventDefault();
      historyIndex = event.key === 'ArrowUp' ? Math.max(0,historyIndex-1) : Math.min(history.length,historyIndex+1);
      input.value = history[historyIndex] || '';
      input.setSelectionRange(input.value.length,input.value.length);
    });
    document.querySelectorAll('[data-nave-query]').forEach((button) => {
      button.addEventListener('click',() => {
        const text = button.dataset.naveQuery;
        processCommand(text);
        input.focus();
      });
    });
    const clock = document.getElementById('terminal-clock');
    if (clock) {
      const format = () => { clock.textContent = new Date().toLocaleTimeString('es-ES',{hour12:false}); };
      format();
      const interval = setInterval(format,1000);
      global.addEventListener('pagehide',() => clearInterval(interval),{once:true});
    }
    try {
      const pending = sessionStorage.getItem('noia.pending');
      if (pending) {
        sessionStorage.removeItem('noia.pending');
        input.value = pending;
        processCommand(pending);
        input.value = '';
      }
    } catch { /* sessionStorage optional */ }
  }
  function init() {
    initHome();
    initPortal();
  }
  NOIA.nave = { interpret, processCommand, tokens, renderAdaptive };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})(window);
