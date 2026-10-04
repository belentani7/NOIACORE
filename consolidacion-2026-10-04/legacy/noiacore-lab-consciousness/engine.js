(() => {
'use strict';

/* ============ Persisted state — "cada F5 fortalece o nucleo" ============ */
const LS_KEY = 'noiacore_state_v1';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) {}

const state = {
  iteration: Math.min(12, (saved.iteration | 0) || 1),
  reboots: (saved.reboots | 0) + 1,
  mood: 'DORMANT',
  god: false,
  matrixOn: false,
  particles: true,
  hue: 0,
  variation: Math.floor(Math.random() * 300) + 1,
  startedAt: performance.now(),
  frame: 0,
  fps: 60,
  gx: 0.5,
  gy: 0.5,
};

function persist() {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ iteration: state.iteration, reboots: state.reboots })); } catch (e) {}
}
persist();

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const set = (sel, val) => { const el = $(sel); if (el) el.textContent = val; };

/* ============ Boot sequence ============ */
(function boot() {
  const bootEl = $('#boot');
  const pct = $('#boot-pct');
  const fill = $('#boot-fill');
  const log = $('#boot-log');
  const lv = $('#boot-lv');
  const skip = $('#boot-skip');
  if (lv) lv.textContent = String(state.iteration).padStart(2, '0');

  const lines = [
    'INIT KERNEL // NOIACORE',
    'LOADING PERCEPTION LAYER...',
    'CALIBRATING BAYESIAN PRIORS...',
    'MAPPING PHENOMENAL SPACE...',
    `REBOOT #${state.reboots} — ITERATION ${state.iteration}`,
    'CORE STATUS: INVISIBLE',
    'READY.',
  ];
  let li = 0, p = 0, done = false;

  function tick() {
    if (done) return;
    p += 2 + Math.random() * 6;
    if (li < lines.length && p >= (li + 1) * (100 / lines.length)) {
      if (log) {
        const d = document.createElement('div');
        d.textContent = '> ' + lines[li];
        log.appendChild(d);
        log.scrollTop = log.scrollHeight;
      }
      li++;
    }
    p = Math.min(p, 100);
    if (pct) pct.textContent = Math.floor(p) + '%';
    if (fill) fill.style.width = p + '%';
    if (p >= 100) { finish(); return; }
    requestAnimationFrame(tick);
  }
  function finish() {
    if (done) return;
    done = true;
    if (bootEl) { bootEl.style.opacity = '0'; bootEl.style.visibility = 'hidden'; }
    document.body.classList.remove('locked');
  }
  if (skip) skip.addEventListener('click', finish);
  requestAnimationFrame(tick);
  setTimeout(finish, 4200); // safety net: never trap the visitor
})();

/* ============ Custom cursor ============ */
(function cursor() {
  const ring = $('.c-ring');
  const dot = $('.c-dot');
  const coords = $('#ccoords');
  if (!ring || !dot) return;
  let rx = innerWidth / 2, ry = innerHeight / 2, tx = rx, ty = ry;

  window.addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    if (innerWidth > 0) state.gx = clamp(e.clientX / innerWidth, 0, 1);
    if (innerHeight > 0) state.gy = clamp(e.clientY / innerHeight, 0, 1);
    document.documentElement.style.setProperty('--spot-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--spot-y', e.clientY + 'px');
    dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    if (coords) {
      coords.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
      coords.textContent = `X ${state.gx.toFixed(3)} · Y ${state.gy.toFixed(3)}`;
    }
  }, { passive: true });

  $$('a, button, .cell, .limit, input').forEach((el) => {
    el.addEventListener('mouseenter', () => { ring.style.width = '64px'; ring.style.height = '64px'; ring.style.borderColor = 'rgba(125,155,255,.8)'; });
    el.addEventListener('mouseleave', () => { ring.style.width = ''; ring.style.height = ''; ring.style.borderColor = ''; });
  });

  (function raf() {
    rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(raf);
  })();
})();

/* ============ Shared defensive canvas setup ============
   Guards against the classic zero-width crash (canvas mounted in a
   hidden/backgrounded tab before first layout) by retrying instead of
   drawing into a zero-sized buffer. */
function setupCanvas(id) {
  const c = document.getElementById(id);
  if (!c) return null;
  const ctx = c.getContext('2d');
  function resize() {
    const w = c.clientWidth || innerWidth;
    const h = c.clientHeight || innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = Math.max(1, Math.floor(w * dpr));
    c.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);
  return { c, ctx, resize };
}

/* ============ #gl — main consciousness plasma ============ */
(function glLayer() {
  const s = setupCanvas('gl');
  if (!s) return;
  const { c, ctx } = s;
  let t = 0;
  function loop() {
    if (c.width < 2 || c.height < 2) { s.resize(); requestAnimationFrame(loop); return; }
    t += 0.006;
    const w = c.clientWidth, h = c.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const cx = w * (0.3 + 0.4 * state.gx), cy = h * (0.3 + 0.4 * state.gy);
    const baseA = state.god ? 0.16 : 0.07;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6);
    grd.addColorStop(0, `hsla(${230 + state.hue},90%,70%,${baseA})`);
    grd.addColorStop(0.5, `hsla(${260 + state.hue},80%,55%,${baseA * 0.5})`);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    if (state.particles) {
      const n = state.god ? 90 : 46;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + t * 0.5;
        const r = (Math.sin(t * 0.7 + i) * 0.5 + 0.5) * Math.min(w, h) * 0.32 + 40;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a * 1.3) * r * 0.6;
        const rad = Math.max(0.4, 1 + Math.sin(t * 2 + i) * 0.8 + 1.2);
        ctx.beginPath();
        ctx.fillStyle = `hsla(${220 + state.hue + i},95%,${state.god ? 75 : 65}%,${0.5 + 0.3 * Math.sin(t + i)})`;
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ============ #mind-layer — slow abstract screen-blend layer ============ */
(function mindLayer() {
  const s = setupCanvas('mind-layer');
  if (!s) return;
  const { c, ctx } = s;
  let t = 0;
  function loop() {
    if (c.width < 2 || c.height < 2) { s.resize(); requestAnimationFrame(loop); return; }
    t += 0.002;
    const w = c.clientWidth, h = c.clientHeight;
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) {
      const x = w * (0.5 + 0.4 * Math.sin(t * (0.6 + i * 0.2) + i * 2));
      const y = h * (0.5 + 0.4 * Math.cos(t * (0.5 + i * 0.15) + i * 3));
      const r = Math.min(w, h) * (0.25 + 0.05 * i);
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, `hsla(${190 + i * 40 + state.hue},90%,60%,0.10)`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    }
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ============ #fx — gravitational-wave ripples on click ============ */
const ripples = [];
function emitWave(x, y) {
  ripples.push({ x, y, age: 0, life: 60 });
  set('#h-grav', (Math.random() * 9.8).toFixed(2));
}
(function fxLayer() {
  const s = setupCanvas('fx');
  if (!s) return;
  const { c, ctx } = s;
  function loop() {
    if (c.width < 2 || c.height < 2) { s.resize(); requestAnimationFrame(loop); return; }
    const w = c.clientWidth, h = c.clientHeight;
    ctx.clearRect(0, 0, w, h);
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.age += 1;
      const p = r.age / r.life;
      if (p >= 1) { ripples.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${225 + state.hue},90%,70%,${(1 - p) * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.arc(r.x, r.y, p * Math.max(w, h) * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    requestAnimationFrame(loop);
  }
  loop();
})();
document.addEventListener('click', (e) => {
  if (e.target.closest('button, a, input, #term')) return;
  emitWave(e.clientX, e.clientY);
});

/* ============ #mtx — red matrix rain (the "codigo rojo" effect) ============ */
(function matrixLayer() {
  const s = setupCanvas('mtx');
  if (!s) return;
  const { c, ctx } = s;
  const chars = 'ノイアコアΛ01アイウエオカキクケコサシスセソ';
  let cols = [], fontSize = 16;
  function setupCols() {
    const count = Math.ceil((c.clientWidth || innerWidth) / fontSize);
    cols = new Array(count).fill(0).map(() => Math.random() * -50);
  }
  setupCols();
  window.addEventListener('resize', setupCols);
  function loop() {
    if (c.width < 2 || c.height < 2) { s.resize(); requestAnimationFrame(loop); return; }
    const w = c.clientWidth, h = c.clientHeight;
    ctx.fillStyle = 'rgba(4,2,3,0.18)';
    ctx.fillRect(0, 0, w, h);
    ctx.font = fontSize + 'px "JetBrains Mono", monospace';
    for (let i = 0; i < cols.length; i++) {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize, y = cols[i] * fontSize;
      ctx.fillStyle = state.god ? 'rgba(255,40,60,0.9)' : 'rgba(255,80,90,0.55)';
      ctx.fillText(ch, x, y);
      if (y > h && Math.random() > 0.975) cols[i] = 0;
      cols[i] += 0.6 + (state.god ? 0.6 : 0);
    }
    requestAnimationFrame(loop);
  }
  loop();
  window.__mtxToggle = (on) => { c.style.opacity = on ? '1' : '0'; };
})();

/* ============ #scope + #spectrum — decorative signal panels ============ */
(function scopeLayer() {
  const s = setupCanvas('scope');
  if (!s) return;
  const { c, ctx } = s;
  let t = 0;
  function loop() {
    if (c.width < 2 || c.height < 2) { s.resize(); requestAnimationFrame(loop); return; }
    t += 0.05;
    const w = c.clientWidth, h = c.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(125,155,255,0.85)';
    ctx.lineWidth = 1.4;
    for (let x = 0; x < w; x++) {
      const v = Math.sin(x * 0.05 + t) * (1 + Math.sin(t * 0.3)) * 0.5 + Math.sin(x * 0.13 + t * 1.7) * 0.25;
      const y = h / 2 + v * h * 0.28;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (state.frame % 12 === 0) set('#scope-hz', (40 + Math.random() * 20).toFixed(2) + ' Hz');
    requestAnimationFrame(loop);
  }
  loop();
})();

(function spectrumLayer() {
  const s = setupCanvas('spectrum');
  if (!s) return;
  const { c, ctx } = s;
  const bars = 32;
  const vals = new Array(bars).fill(0);
  function loop() {
    if (c.width < 2 || c.height < 2) { s.resize(); requestAnimationFrame(loop); return; }
    const w = c.clientWidth, h = c.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const bw = w / bars;
    let peak = 0;
    for (let i = 0; i < bars; i++) {
      const target = Math.abs(Math.sin(i * 0.5 + performance.now() * 0.001)) * (0.3 + 0.7 * Math.random());
      vals[i] += (target - vals[i]) * 0.2;
      peak = Math.max(peak, vals[i]);
      const bh = vals[i] * h * 0.85;
      ctx.fillStyle = `rgba(125,155,255,${0.35 + vals[i] * 0.5})`;
      ctx.fillRect(i * bw + 1, h - bh, bw - 2, bh);
    }
    if (state.frame % 15 === 0) set('#spec-peak', (-(1 - peak) * 40).toFixed(1) + ' dB');
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ============ Sparklines ============ */
function makeSparkline(id, getValue) {
  const s = setupCanvas(id);
  if (!s) return;
  const { c, ctx } = s;
  const hist = new Array(40).fill(0);
  function loop() {
    if (c.width < 2 || c.height < 2) { s.resize(); requestAnimationFrame(loop); return; }
    hist.push(getValue()); hist.shift();
    const w = c.clientWidth, h = c.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const max = Math.max(0.001, ...hist);
    ctx.beginPath();
    hist.forEach((v, i) => {
      const x = (i / (hist.length - 1)) * w;
      const y = h - (v / max) * h * 0.9 - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = 'rgba(125,155,255,0.9)';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    requestAnimationFrame(loop);
  }
  loop();
}
makeSparkline('sp-fps', () => state.fps);
makeSparkline('sp-thr', () => parseFloat($('#h-thr')?.textContent) || 0);
makeSparkline('sp1', () => state.frame % 300);
makeSparkline('sp2', () => parseFloat($('#d-inf')?.textContent) || 0);
makeSparkline('sp3', () => parseFloat($('#d-lat')?.textContent) || 0);
makeSparkline('sp4', () => parseFloat($('#d-sig')?.textContent) || 0);

/* ============ Corezone — the "eye": mask reveal + a pupil that actually
   tracks the cursor, not just the spotlight mask around it ============ */
(function corezone() {
  const zone = $('#corezone');
  if (!zone) return;
  const svg = zone.querySelector('svg');
  if (!svg) return;
  const pupil = svg.querySelector('circle:last-of-type');
  const rings = Array.from(svg.querySelectorAll('circle')).filter((c) => c !== pupil);
  const lines = Array.from(svg.querySelectorAll('line'));
  const reach = 18; // svg units — keeps the pupil inside the r=48 ring

  // Liquid gold, not the site's usual blue-white — this eye is meant to
  // stand out as something alive rather than blend into the HUD palette.
  const GOLD = '#e8b34d';
  const GOLD_SOFT = 'rgba(232,179,77,0.6)';
  if (pupil) {
    pupil.setAttribute('fill', GOLD);
    pupil.style.transition = 'cx 0.12s ease-out, cy 0.12s ease-out';
    pupil.classList.add('liquid-gold-pulse');
  }
  rings.forEach((ring) => { ring.style.stroke = GOLD_SOFT; });
  lines.forEach((line) => {
    line.style.stroke = GOLD_SOFT;
    line.style.transformOrigin = '100px 100px';
    line.style.transition = 'transform 0.15s ease-out';
  });

  zone.addEventListener('pointermove', (e) => {
    const r = zone.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return; // not laid out yet — skip rather than compute NaN
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    zone.style.setProperty('--cx', px * 100 + '%');
    zone.style.setProperty('--cy', py * 100 + '%');

    const dx = clamp((px - 0.5) * 2, -1, 1);
    const dy = clamp((py - 0.5) * 2, -1, 1);
    if (pupil) {
      pupil.setAttribute('cx', String(100 + dx * reach));
      pupil.setAttribute('cy', String(100 + dy * reach));
    }
    lines.forEach((line) => {
      line.style.transform = `translate(${dx * reach * 0.3}px, ${dy * reach * 0.3}px)`;
    });
  });
  zone.addEventListener('pointerleave', () => {
    if (pupil) { pupil.setAttribute('cx', '100'); pupil.setAttribute('cy', '100'); }
    lines.forEach((line) => { line.style.transform = 'translate(0,0)'; });
  });
  zone.addEventListener('click', (e) => emitWave(e.clientX, e.clientY));
})();

/* ============ Scroll progress + reveal-on-scroll + nav-spy ============ */
(function scrollFx() {
  const progress = $('#progress');
  const sections = $$('section[id]');
  const navLinks = $$('.nav a[data-spy]');
  const revealEls = $$('.reveal');

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) en.target.classList.add('in'); });
  }, { threshold: 0.15 });
  revealEls.forEach((el) => io.observe(el));

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle('active', a.dataset.spy === en.target.id));
    });
  }, { threshold: 0.5 });
  sections.forEach((sec) => spy.observe(sec));

  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
    if (progress) progress.style.width = clamp(pct, 0, 100) + '%';
  }, { passive: true });
})();

/* ============ HUD telemetry (decorative, matches the "alive system" copy) ============ */
(function telemetry() {
  function fmtUptime(ms) {
    const s = Math.floor(ms / 1000);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }
  let lastFrameTime = 0;
  function frame(now) {
    state.frame++;
    if (!lastFrameTime) lastFrameTime = now;
    const dt = now - lastFrameTime;
    lastFrameTime = now;
    state.fps = Math.round(1000 / Math.max(1, dt));
    set('#h-fps', state.fps);
    set('#f-fps', state.fps);
    set('#t-fr', String(state.frame).padStart(6, '0'));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  setInterval(() => {
    set('#h-up', fmtUptime(performance.now() - state.startedAt));
    set('#h-thr', (40 + Math.random() * 20 + state.iteration * 3).toFixed(1));
    set('#h-temp', (2.7 + Math.random() * 0.4).toFixed(1) + 'K');
    set('#h-var', String(state.variation).padStart(3, '0') + '/300');
    set('#t-lat', (state.gy * 90 - 45).toFixed(3));
    set('#t-lon', (state.gx * 180 - 90).toFixed(3));
    set('#t-dt', (Math.random() * 8).toFixed(2));
    set('#t-sig', (95 + Math.random() * 4.9).toFixed(1));
    set('#t-ent', (0.08 + Math.random() * 0.1).toFixed(2));
    set('#d-frames', state.frame);
    set('#d-inf', (1.2 + state.iteration * 0.3 + Math.random() * 0.4).toFixed(1));
    set('#d-lat', Math.round(8 + Math.random() * 6));
    set('#d-sig', (96 + Math.random() * 3.9).toFixed(1));

    [['g1', 'gv1', 0.7], ['g2', 'gv2', 0.55], ['g3', 'gv3', 0.82]].forEach(([id, vid, base]) => {
      const v = clamp(base + (state.god ? 0.15 : 0) + (Math.random() - 0.5) * 0.06, 0, 1);
      const el = document.getElementById(id);
      if (el) el.style.strokeDashoffset = (163 * (1 - v)).toFixed(1);
      set('#' + vid, Math.round(v * 100) + '%');
    });
  }, 900);

  setInterval(() => {
    if (state.god) state.mood = 'OVERCLOCKED';
    else if (performance.now() - state.startedAt > 20000) state.mood = 'AWARE';
    set('#h-mood', state.mood);
    set('#state-tag', `CORE STATE · ${state.mood} · ITERATION ${String(state.iteration).padStart(2, '0')}`);
    set('#h-lv', String(state.iteration).padStart(2, '0'));
    set('#f-lv', String(state.iteration).padStart(2, '0'));
    set('#h-reb', state.reboots);
    set('#iter-total', state.reboots);
    set('#iter-num', String(state.iteration).padStart(2, '0'));
    const fill = $('#h-lvfill'); if (fill) fill.style.width = (state.iteration / 12 * 100) + '%';
    const ifill = $('#iter-fill'); if (ifill) ifill.style.width = (state.iteration / 12 * 100) + '%';
    set('#yr', new Date().getFullYear());
  }, 1000);
})();

/* ============ God mode / Overload / Reboot / Audio ============ */
function setGod(on) {
  state.god = on;
  document.body.classList.toggle('glitch-dom', on);
  const btn = $('#god-btn');
  if (btn) btn.textContent = on ? 'GOD MODE ●' : 'GOD MODE';
  window.__mtxToggle?.(on || state.matrixOn);
  if (on) setTimeout(() => setGod(false), 2400);
}
function overload() {
  const nova = $('.supernova');
  if (nova) { nova.style.animation = 'none'; void nova.offsetWidth; nova.style.animation = 'nova 1.1s ease-out'; }
  state.iteration = Math.min(12, state.iteration + 1);
  persist();
}
function reboot() {
  state.reboots++;
  state.iteration = Math.min(12, state.iteration + 1);
  persist();
  const bootEl = $('#boot');
  if (bootEl) { bootEl.style.visibility = 'visible'; bootEl.style.opacity = '1'; document.body.classList.add('locked'); }
  const log = $('#boot-log'); if (log) log.innerHTML = '';
  set('#boot-pct', '0%');
  const fill = $('#boot-fill'); if (fill) fill.style.width = '0%';
  setTimeout(() => {
    if (bootEl) { bootEl.style.opacity = '0'; bootEl.style.visibility = 'hidden'; }
    document.body.classList.remove('locked');
  }, 1200);
}
$('#god-btn')?.addEventListener('click', () => setGod(!state.god));
$$('.overload-btn').forEach((b) => b.addEventListener('click', overload));

let audioCtx = null, audioOsc = null, audioOn = false;
$('#audio-btn')?.addEventListener('click', function () {
  audioOn = !audioOn;
  this.textContent = audioOn ? 'AUDIO ON' : 'AUDIO OFF';
  this.setAttribute('aria-pressed', String(audioOn));
  if (audioOn) {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    audioOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    audioOsc.type = 'sine';
    audioOsc.frequency.value = 55;
    gain.gain.value = 0.02;
    audioOsc.connect(gain).connect(audioCtx.destination);
    audioOsc.start();
  } else if (audioOsc) {
    audioOsc.stop();
    audioOsc.disconnect();
    audioOsc = null;
  }
});

/* ============ Terminal do Observador ============ */
(function terminal() {
  const input = $('#term-input');
  const log = $('#term-log');
  if (!input || !log) return;
  function print(line) {
    const d = document.createElement('div');
    d.textContent = line;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }
  print('NOIACORE observer terminal — digite "help"');
  const commands = {
    help: () => print('help · core · status · limits · level · overload · reboot · god · matrix · hack · mind · awake · sleep · clear · theme · fps · particles'),
    core: () => print('CORE: invisible · ' + state.mood),
    status: () => print(`STATUS iter=${state.iteration}/12 reboots=${state.reboots} fps=${state.fps} god=${state.god}`),
    limits: () => { print('8 limites carregados — rolando ate #limites'); $('#limites')?.scrollIntoView({ behavior: 'smooth' }); },
    level: () => print(`ITERATION LEVEL ${state.iteration}/12`),
    overload: () => { print('FORCANDO PICO...'); overload(); },
    reboot: () => { print('REINICIANDO CICLO...'); reboot(); },
    god: () => { print(state.god ? 'GOD MODE OFF' : 'GOD MODE ON — ENTROPIA MAXIMA'); setGod(!state.god); },
    hack: () => { print('INJETANDO RUIDO...'); setGod(true); },
    matrix: () => { state.matrixOn = !state.matrixOn; window.__mtxToggle?.(state.matrixOn || state.god); print('MATRIX ' + (state.matrixOn ? 'ON' : 'OFF')); },
    mind: () => { const l = $('#mind-layer'); if (l) l.style.opacity = l.style.opacity === '1' ? '0.6' : '1'; print('MIND LAYER PULSADA'); },
    awake: () => { state.mood = 'AWARE'; print('MOOD -> AWARE'); },
    sleep: () => { state.mood = 'DORMANT'; print('MOOD -> DORMANT'); },
    clear: () => { log.innerHTML = ''; },
    theme: () => { state.hue = (state.hue + 60) % 360; print('HUE +60'); },
    fps: () => print(`FPS ${state.fps}`),
    particles: () => { state.particles = !state.particles; print('PARTICLES ' + (state.particles ? 'ON' : 'OFF')); },
  };
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const raw = input.value.trim();
    if (!raw) return;
    print('Λ> ' + raw);
    const cmd = raw.toLowerCase().split(/\s+/)[0];
    if (commands[cmd]) commands[cmd]();
    else print('comando desconhecido: ' + cmd + ' (help)');
    input.value = '';
  });
})();
})();
