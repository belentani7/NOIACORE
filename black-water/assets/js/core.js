/* NOIACORE core / site navigation, motion, command palette, progressive enhancement. */
(function (global) {
  'use strict';
  const NOIA = global.NOIA = global.NOIA || {};
  const root = document.documentElement;
  const storageKey = 'noiacore.motion';
  const doc = document;
  const dom = {
    page: doc.body.dataset.page,
    header: doc.getElementById('site-header'),
    menu: doc.getElementById('nav-toggle'),
    nav: doc.getElementById('primary-nav'),
    progress: doc.getElementById('page-progress'),
    launcher: doc.getElementById('global-command'),
    command: doc.getElementById('command-surface'),
    commandInput: doc.getElementById('command-input'),
    commandSuggestions: doc.getElementById('command-suggestions'),
    toastStack: doc.getElementById('toast-stack'),
    motion: doc.getElementById('motion-toggle')
  };
  const preferReduced = global.matchMedia('(prefers-reduced-motion: reduce)');
  function readPreference() {
    try { return localStorage.getItem(storageKey); }
    catch { return null; }
  }
  function writePreference(value) {
    try { localStorage.setItem(storageKey, value); }
    catch { /* preserve non-persistent access */ }
  }
  let moving = readPreference() !== 'off' && !preferReduced.matches;
  let paletteOpen = false;
  let returnFocus = null;
  let scrollScheduled = false;
  const listeners = new Set();
  function subscribeMotion(callback) {
    listeners.add(callback);
    callback(moving);
    return () => listeners.delete(callback);
  }
  function updateMotion(value, persist = true) {
    moving = Boolean(value);
    doc.body.classList.toggle('motion-off', !moving);
    if (dom.motion) {
      dom.motion.setAttribute('aria-pressed', String(!moving));
      dom.motion.textContent = moving ? 'Reducir movimiento' : 'Activar movimiento';
    }
    if (persist) writePreference(moving ? 'on' : 'off');
    listeners.forEach((callback) => callback(moving));
    global.dispatchEvent(new CustomEvent('noia:motion', { detail: { enabled: moving } }));
  }
  function normalize(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function compact(value, limit = 90) {
    const str = String(value || '');
    return str.length > limit ? str.slice(0, limit - 1) + '…' : str;
  }
  function create(tag, className, value) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (value != null) node.textContent = value;
    return node;
  }
  function toast(message) {
    if (!dom.toastStack) return;
    const node = create('div', 'toast', compact(message, 160));
    node.setAttribute('role', 'status');
    dom.toastStack.prepend(node);
    while (dom.toastStack.children.length > 3) {
      dom.toastStack.lastChild.remove();
    }
    global.setTimeout(() => {
      node.classList.add('removing');
      global.setTimeout(() => node.remove(), 420);
    }, 3800);
  }
  function setMenu(open) {
    if (!dom.menu) return;
    dom.header.classList.toggle('menu-open', open);
    dom.menu.setAttribute('aria-expanded', String(open));
    dom.menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  function updateScroll() {
    scrollScheduled = false;
    const y = Math.max(0, global.scrollY);
    const maximum = doc.documentElement.scrollHeight - global.innerHeight;
    const percent = maximum > 0 ? Math.min(100, y / maximum * 100) : 0;
    if (dom.progress) dom.progress.style.width = percent.toFixed(2) + '%';
    if (dom.header) dom.header.classList.toggle('scrolled', y > 27);
  }
  function onScroll() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(updateScroll);
  }
  function navigate(href) {
    if (typeof href !== 'string') return false;
    if (!/^[a-z0-9-]+\.html(?:#[a-z0-9-]+)?$/i.test(href)) return false;
    global.location.assign(href);
    return true;
  }
  function regionMatches(query) {
    const n = normalize(query);
    return (NOIA.DATA?.regions || []).filter((item) => {
      const content = `${item.name} ${item.description} ${item.signal} ${item.key} ${item.synonyms.join(' ')}`;
      return normalize(content).includes(n);
    });
  }
  function commandResults(query = '') {
    if (!dom.commandSuggestions) return;
    dom.commandSuggestions.replaceChildren();
    const all = NOIA.DATA?.regions || [];
    const matches = query ? regionMatches(query).slice(0, 5) : all.slice(0, 5);
    matches.forEach((item) => {
      const button = create('button');
      button.type = 'button';
      const label = create('span', '', item.name + ' / ' + item.signal);
      const icon = create('span', '', '↗');
      button.append(label, icon);
      button.addEventListener('click', () => navigate(item.href));
      dom.commandSuggestions.append(button);
    });
    if (!matches.length) {
      const message = create('button', '', 'Interpretar esta intención en NAVE ↗');
      message.type = 'button';
      message.addEventListener('click', () => {
        const text = dom.commandInput?.value || '';
        try { sessionStorage.setItem('noia.pending', text.slice(0, 500)); }
        catch { /* Browser may disable storage */ }
        navigate('portal.html');
      });
      dom.commandSuggestions.append(message);
    }
  }
  function openPalette() {
    if (!dom.command) return;
    if (paletteOpen) return;
    returnFocus = doc.activeElement;
    dom.command.hidden = false;
    paletteOpen = true;
    commandResults();
    global.setTimeout(() => dom.commandInput?.focus(), 0);
  }
  function closePalette() {
    if (!paletteOpen) return;
    paletteOpen = false;
    dom.command.hidden = true;
    if (dom.commandInput) dom.commandInput.value = '';
    if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
  }
  function onGlobalKeyboard(event) {
    if (event.key === 'Escape') {
      closePalette();
      setMenu(false);
      return;
    }
    const target = event.target;
    const editable = target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement ||
      target?.isContentEditable;
    if (!editable && (event.key === '/' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'))) {
      event.preventDefault();
      openPalette();
    }
    if (paletteOpen && event.key === 'Tab') {
      const focusable = [...dom.command.querySelectorAll('button, input')].filter((x) => !x.disabled && x.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
  function observeReveals() {
    const targets = doc.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in global)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .07, rootMargin: '0px 0px -20px 0px' });
    targets.forEach((element) => observer.observe(element));
  }
  function connectContactForm() {
    const form = doc.getElementById('briefing-form');
    if (!form) return;
    const feedback = doc.getElementById('form-feedback');
    const lastDraft = { content: '' };
    function content() {
      const data = new FormData(form);
      const selected = doc.getElementById('brief-area')?.value || '';
      const title = 'NOIACORE / BRIEFING · ' + selected;
      return [
        title,
        '========================================',
        '',
        'Generado localmente: ' + new Date().toLocaleString(),
        'Área: ' + selected,
        'Nombre: ' + (data.get('name') || 'No especificado').toString().trim(),
        'Contacto: ' + (data.get('email') || 'No especificado').toString().trim(),
        '',
        'CONTEXTO Y OBJETIVO',
        (data.get('need') || '').toString().trim(),
        '',
        '---',
        'Documento personal. No se ha enviado automáticamente a ningún destino.'
      ].join('\n');
    }
    function downloadText(text, filename) {
      const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(file);
      const anchor = create('a');
      anchor.download = filename;
      anchor.href = url;
      doc.body.append(anchor);
      anchor.click();
      anchor.remove();
      global.setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) {
        feedback.textContent = NOIA.i18n.translate('brief.pending');
        return;
      }
      lastDraft.content = content();
      downloadText(lastDraft.content, 'NOIACORE-briefing.txt');
      feedback.textContent = NOIA.i18n.translate('brief.ready');
      toast('BRIEFING · Guardado en tu dispositivo');
    });
    doc.getElementById('contact-email')?.addEventListener('click', () => {
      if (!form.reportValidity()) {
        feedback.textContent = NOIA.i18n.translate('brief.pending');
        return;
      }
      const body = content();
      const subject = 'NOIACORE / Propuesta de colaboración';
      const mail = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      global.location.href = mail;
      feedback.textContent = 'Borrador preparado en tu aplicación de correo. Elige el destinatario y envíalo tú.';
    });
  }
  function setListeners() {
    dom.menu?.addEventListener('click', () => setMenu(dom.menu.getAttribute('aria-expanded') !== 'true'));
    dom.nav?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMenu(false));
    });
    dom.launcher?.addEventListener('click', openPalette);
    dom.command?.querySelectorAll('[data-close-command]').forEach((node) => node.addEventListener('click', closePalette));
    dom.commandInput?.addEventListener('input', () => commandResults(dom.commandInput.value));
    dom.commandInput?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const value = dom.commandInput.value.trim();
      const first = value ? regionMatches(value)[0] : null;
      if (first) { navigate(first.href); return; }
      try { sessionStorage.setItem('noia.pending', value.slice(0, 500)); }
      catch { /* Optional one-use session handoff. */ }
      navigate('portal.html');
    });
    dom.motion?.addEventListener('click', () => updateMotion(!moving));
    doc.addEventListener('keydown', onGlobalKeyboard);
    global.addEventListener('scroll', onScroll, { passive: true });
    global.addEventListener('resize', onScroll, { passive: true });
    preferReduced.addEventListener?.('change', (event) => {
      if (readPreference() === null) updateMotion(!event.matches, false);
    });
    doc.querySelectorAll('[data-nav]').forEach((anchor) => {
      if (anchor.dataset.nav === dom.page) anchor.setAttribute('aria-current', 'page');
    });
    connectContactForm();
  }
  function init() {
    root.classList.add('js-ready');
    observeReveals();
    setListeners();
    updateMotion(moving, false);
    updateScroll();
  }
  NOIA.core = {
    normalize, clamp, compact, create, toast, navigate,
    subscribeMotion, setMotion: updateMotion,
    get motion() { return moving; },
    get page() { return dom.page; },
    downloadText(text, name = 'NOIACORE-export.txt') {
      const url = URL.createObjectURL(new Blob([String(text)], { type: 'text/plain;charset=utf-8' }));
      const a = create('a');
      a.href = url; a.download = name; doc.body.append(a); a.click(); a.remove();
      global.setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
  };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
