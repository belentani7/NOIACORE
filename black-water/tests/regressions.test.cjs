'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Worker: NodeWorker } = require('node:worker_threads');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function classList() {
  const values = new Set();
  return {
    add(value) { values.add(value); },
    contains(value) { return values.has(value); },
    toggle(value, enabled) {
      if (enabled === undefined) enabled = !values.has(value);
      if (enabled) values.add(value);
      else values.delete(value);
      return enabled;
    }
  };
}

function loadCore({ reducedMotion = false, preference = null, reveals = [], readyState = 'loading' } = {}) {
  const saved = new Map(preference === null ? [] : [['noiacore.motion', preference]]);
  const storage = {
    getItem(key) { return saved.has(key) ? saved.get(key) : null; },
    setItem(key, value) { saved.set(key, value); },
    removeItem(key) { saved.delete(key); }
  };
  const body = { dataset: { page: 'portal' }, classList: classList() };
  const rootElement = { classList: classList(), scrollHeight: 1200 };
  const revealTargets = reveals;
  const document = {
    readyState,
    body,
    documentElement: rootElement,
    activeElement: null,
    getElementById() { return null; },
    querySelectorAll(selector) {
      return selector === '[data-reveal]' ? revealTargets : [];
    },
    addEventListener() {}
  };
  const media = { matches: reducedMotion, addEventListener() {} };
  const window = {
    NOIA: {},
    matchMedia() { return media; },
    addEventListener() {},
    dispatchEvent() {},
    setTimeout,
    scrollY: 0,
    innerHeight: 800
  };
  const context = {
    window,
    document,
    localStorage: storage,
    CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
    HTMLInputElement: class {},
    HTMLTextAreaElement: class {},
    HTMLSelectElement: class {},
    requestAnimationFrame() { return 1; },
    console
  };
  vm.runInNewContext(read('assets/js/core.js'), context, { filename: 'core.js' });
  return { core: window.NOIA.core, body, targetClassList: reveals[0]?.classList, saved, window, document };
}

function loadLab({ WorkerCtor, fields = {} } = {}) {
  const defaults = {
    pattern: { value: 'a' },
    flags: { value: 'g' }
  };
  const settings = { ...defaults, ...fields };
  const options = {
    querySelector(selector) {
      const name = /name="([^"]+)"/.exec(selector)?.[1];
      return settings[name] || null;
    }
  };
  const document = {
    readyState: 'loading',
    getElementById(id) {
      if (id === 'tool-input' || id === 'tool-output') return {};
      if (id === 'tool-options') return options;
      return null;
    },
    addEventListener() {}
  };
  const window = {
    NOIA: {
      core: {
        normalize(value) {
          return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        }
      },
      Worker: WorkerCtor
    },
    Worker: WorkerCtor,
    setTimeout,
    clearTimeout
  };
  const context = { window, document, TextEncoder, URL, Uint8Array, atob, btoa, setTimeout, clearTimeout, console };
  vm.runInNewContext(read('assets/js/lab.js'), context, { filename: 'lab.js' });
  return { lab: window.NOIA.lab, fields: settings };
}

class BrowserWorkerAdapter {
  constructor(url) {
    this.terminated = false;
    BrowserWorkerAdapter.last = this;
    this.worker = new NodeWorker(path.resolve(root, url));
    this.worker.on('message', (data) => this.onmessage?.({ data }));
    this.worker.on('error', (error) => this.onerror?.({ message: error.message }));
  }
  postMessage(data) { this.worker.postMessage(data); }
  terminate() {
    this.terminated = true;
    return this.worker.terminate();
  }
}

function loadAtlas({ motion = false } = {}) {
  const handlers = new Map();
  const resetHandlers = new Map();
  const navigations = [];
  const centerXs = [];
  const regions = [
    { id: 'one', name: 'Region 1', number: '01', key: 'ONE', description: '', href: 'one.html', node: [-.6, -.4] },
    { id: 'two', name: 'Region 2', number: '02', key: 'TWO', description: '', href: 'two.html', node: [.6, -.4] },
    { id: 'three', name: 'Region 3', number: '03', key: 'THREE', description: '', href: 'three.html', node: [-.6, .4] },
    { id: 'four', name: 'Region 4', number: '04', key: 'FOUR', description: '', href: 'four.html', node: [0, 0] },
    { id: 'five', name: 'Region 5', number: '05', key: 'FIVE', description: '', href: 'five.html', node: [.6, .4] },
    { id: 'six', name: 'Region 6', number: '06', key: 'SIX', description: '', href: 'six.html', node: [-.3, .6] }
  ];
  const ctx = {
    createRadialGradient() { return { addColorStop() {} }; },
    setTransform() {}, fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, arc() {}, fill() {},
    fillText(text, x) { if (text === 'Region 4') centerXs.push(x); }
  };
  const canvas = {
    width: 0,
    height: 0,
    style: {},
    getContext() { return ctx; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 600, height: 600 }; },
    addEventListener(name, callback) { handlers.set(name, callback); },
    setPointerCapture() {}
  };
  const resetButton = { addEventListener(name, callback) { resetHandlers.set(name, callback); } };
  let ready;
  const document = {
    readyState: 'loading',
    hidden: false,
    getElementById(id) {
      if (id === 'atlas-canvas') return canvas;
      if (id === 'atlas-reset') return resetButton;
      return null;
    },
    addEventListener(name, callback) { if (name === 'DOMContentLoaded') ready = callback; }
  };
  let nextFrame = 1;
  const frames = new Map();
  const window = {
    NOIA: {
      DATA: { regions },
      core: {
        motion,
        create() { return {}; },
        subscribeMotion(callback) { callback(motion); return () => {}; },
        navigate(href) { navigations.push(href); }
      }
    },
    devicePixelRatio: 1,
    requestAnimationFrame(callback) { const id = nextFrame++; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    addEventListener() {}
  };
  const context = {
    window,
    document,
    performance: { now: () => 0 },
    requestAnimationFrame: window.requestAnimationFrame,
    cancelAnimationFrame: window.cancelAnimationFrame,
    Math
  };
  vm.runInNewContext(read('assets/js/atlas.js'), context, { filename: 'atlas.js' });
  ready();
  function flush(time = 100) {
    const entry = frames.entries().next().value;
    if (!entry) return;
    const [id, callback] = entry;
    frames.delete(id);
    callback(time);
  }
  return { atlas: window.NOIA.atlas, handlers, resetHandlers, navigations, centerXs, flush };
}

test('reset restores the operating-system reduced-motion preference', () => {
  const { core, saved } = loadCore({ reducedMotion: true, preference: 'off' });
  core.setMotion(true);
  assert.equal(core.motion, true);
  assert.equal(typeof core.resetMotionPreference, 'function');
  core.resetMotionPreference();
  assert.equal(core.motion, false);
  assert.equal(saved.has('noiacore.motion'), false);
});

test('CSV to JSON rejects data rows with more fields than the header', () => {
  const { lab } = loadLab();
  assert.throws(() => lab.csvToJson('name,age\nAda,37,unexpected'), /columnas|campos/i);
});

test('regex tool returns a promise so matching can be isolated and timed out', async () => {
  class NeverRespondWorker {
    constructor() { this.terminated = false; NeverRespondWorker.last = this; }
    postMessage() {}
    terminate() { this.terminated = true; }
  }
  const { lab } = loadLab({ WorkerCtor: NeverRespondWorker });
  const regex = lab.catalog.find((item) => item.id === 'regex');
  const result = regex.run('abc abc');
  assert.equal(typeof result?.then, 'function');
  await assert.rejects(result, /tiempo|timeout/i);
  assert.equal(NeverRespondWorker.last.terminated, true);
});

test('regex worker returns safe matches and stops pathological expressions', async () => {
  const { lab, fields } = loadLab({ WorkerCtor: BrowserWorkerAdapter });
  const regex = lab.catalog.find((item) => item.id === 'regex');
  const safe = regex.run('abc abc');
  assert.equal(typeof safe?.then, 'function');
  assert.equal(await safe, '1. "a" [index 0]\n2. "a" [index 4]');

  fields.pattern.value = '^(a+)+$';
  const started = Date.now();
  const hostile = regex.run('a'.repeat(12000) + '!');
  assert.equal(typeof hostile?.then, 'function');
  await assert.rejects(hostile, /tiempo|timeout/i);
  assert.ok(Date.now() - started < 2000, 'pathological matching must not block the page');
  assert.equal(BrowserWorkerAdapter.last.terminated, true);
});

test('JSON to CSV rejects nested object and array values instead of stringifying them', () => {
  const { lab } = loadLab();
  assert.throws(() => lab.jsonToCsv('[{"name":{"first":"Ada"}}]'), /anidad|compuest|scalar/i);
  assert.throws(() => lab.jsonToCsv('[{"name":["Ada"]}]'), /anidad|compuest|scalar/i);
});

test('dragging the atlas does not activate the node under the release point', () => {
  const { handlers, navigations, flush } = loadAtlas({ motion: false });
  handlers.get('pointerdown')({ clientX: 300, clientY: 318, pointerId: 1 });
  handlers.get('pointermove')({ clientX: 320, clientY: 318, buttons: 1, pointerId: 1 });
  flush(100);
  handlers.get('pointerup')({ pointerId: 1 });
  handlers.get('click')({ clientX: 320, clientY: 318 });
  assert.deepEqual(navigations, []);
});

test('atlas recenters immediately when reduced motion is enabled', () => {
  const { handlers, resetHandlers, centerXs, flush } = loadAtlas({ motion: false });
  flush(100);
  handlers.get('pointerdown')({ clientX: 300, clientY: 318, pointerId: 1 });
  handlers.get('pointermove')({ clientX: 340, clientY: 318, buttons: 1, pointerId: 1 });
  flush(200);
  handlers.get('pointerup')({ pointerId: 1 });
  assert.equal(centerXs.at(-1), 340);
  resetHandlers.get('click')();
  flush(300);
  assert.equal(centerXs.at(-1), 300);
});

test('atlas reset snaps to center without easing when motion is enabled', () => {
  const { handlers, resetHandlers, centerXs, flush } = loadAtlas({ motion: true });
  flush(100);
  handlers.get('pointerdown')({ clientX: 300, clientY: 318, pointerId: 1 });
  handlers.get('pointermove')({ clientX: 340, clientY: 318, buttons: 1, pointerId: 1 });
  flush(200);
  handlers.get('pointerup')({ pointerId: 1 });
  resetHandlers.get('click')();
  flush(300);
  assert.equal(centerXs.at(-1), 300);
});

test('reveal content stays visible when IntersectionObserver is unavailable', () => {
  const target = { classList: classList() };
  loadCore({ reducedMotion: false, reveals: [target], readyState: 'complete' });
  assert.equal(target.classList.contains('revealed'), true);
});
