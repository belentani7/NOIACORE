'use strict';
/**
 * NEXUS OS — Color Palette Generator
 * Generate palettes, color harmonies, contrast check, export formats
 * Pure vanilla JS, no external dependencies
 */

class NexusColorPalette {
  constructor(container) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.baseColor = { h: 348, s: 100, l: 50 }; // #ff003c
    this.harmony = 'complementary';
    this.palette = [];
    this.exportFormat = 'css';
    this.harmonies = ['complementary', 'analogous', 'triadic', 'split-complementary', 'tetradic', 'monochromatic', 'shades', 'tints'];
    this.savedPalettes = [];
  }

  render() {
    this._loadCSS();
    this._buildUI();
    this._bindEvents();
    this._drawWheel();
    this._generatePalette();
  }

  destroy() {
    if (this._root) this._root.remove();
  }

  _loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'js/apps/media/color-palette.css';
    document.head.appendChild(link);
  }

  _buildUI() {
    this._root = document.createElement('div');
    this._root.className = 'ncp-root';
    this._root.innerHTML = `
      <div class="ncp-left">
        <div class="ncp-title">Color Palette</div>
        <div class="ncp-section">Base Color</div>
        <div class="ncp-color-input-row">
          <input type="color" class="ncp-color-swatch" data-c="baseSwatch" value="#ff003c">
          <input class="ncp-color-hex" data-c="baseHex" value="#ff003c" maxlength="7">
        </div>
        <div class="ncp-wheel-wrap"><canvas class="ncp-wheel" data-c="wheel" width="200" height="200"><div class="ncp-wheel-marker" data-c="marker"></div></canvas></div>
        <div class="ncp-slider-row"><label>H</label><input type="range" class="ncp-slider" data-c="hSlider" min="0" max="360" value="348"><span class="ncp-slider-val" data-c="hVal">348</span></div>
        <div class="ncp-slider-row"><label>S</label><input type="range" class="ncp-slider" data-c="sSlider" min="0" max="100" value="100"><span class="ncp-slider-val" data-c="sVal">100</span></div>
        <div class="ncp-slider-row"><label>L</label><input type="range" class="ncp-slider" data-c="lSlider" min="0" max="100" value="50"><span class="ncp-slider-val" data-c="lVal">50</span></div>
        <div class="ncp-section">Harmony</div>
        <div class="ncp-harmony-row" data-c="harmonyRow">
          ${this.harmonies.map(h => `<div class="ncp-harmony-btn${h === this.harmony ? ' active' : ''}" data-harmony="${h}">${h.replace('-', ' ')}</div>`).join('')}
        </div>
        <div class="ncp-section">Actions</div>
        <div class="ncp-actions">
          <button class="ncp-action-btn" data-c="randomBtn">🎲</button>
          <button class="ncp-action-btn" data-c="saveBtn">💾 Save</button>
        </div>
      </div>
      <div class="ncp-right">
        <div class="ncp-section">Palette</div>
        <div class="ncp-palette-display" data-c="paletteDisplay"></div>
        <div class="ncp-contrast-info" data-c="contrastInfo"></div>
        <div class="ncp-section">Export Format</div>
        <div class="ncp-format-row">
          <div class="ncp-format-btn active" data-format="css">CSS</div>
          <div class="ncp-format-btn" data-format="scss">SCSS</div>
          <div class="ncp-format-btn" data-format="tailwind">Tailwind</div>
          <div class="ncp-format-btn" data-format="json">JSON</div>
          <div class="ncp-format-btn" data-format="array">Array</div>
        </div>
        <div class="ncp-actions" style="margin-top:8px">
          <button class="ncp-action-btn primary" data-c="copyExport">📋 Copy Code</button>
        </div>
        <div class="ncp-export-area" data-c="exportArea"></div>
        <div class="ncp-section" style="margin-top:12px">Saved Palettes</div>
        <div data-c="savedList"></div>
      </div>`;
    this.container.appendChild(this._root);
    this.els = {};
    this._root.querySelectorAll('[data-c]').forEach(el => { this.els[el.dataset.c] = el; });
    this.wheelCanvas = this.els.wheel;
    this.wheelCtx = this.wheelCanvas.getContext('2d');
  }

  _bindEvents() {
    const e = this.els;

    // Base color input
    e.baseSwatch.oninput = (ev) => { this._setBaseFromHex(ev.target.value); };
    e.baseHex.onchange = (ev) => { if (/^#[0-9a-fA-F]{6}$/.test(ev.target.value)) this._setBaseFromHex(ev.target.value); };

    // HSL sliders
    e.hSlider.oninput = () => { this.baseColor.h = +e.hSlider.value; e.hVal.textContent = this.baseColor.h; this._syncFromHSL(); this._generatePalette(); };
    e.sSlider.oninput = () => { this.baseColor.s = +e.sSlider.value; e.sVal.textContent = this.baseColor.s; this._syncFromHSL(); this._generatePalette(); };
    e.lSlider.oninput = () => { this.baseColor.l = +e.lSlider.value; e.lVal.textContent = this.baseColor.l; this._syncFromHSL(); this._generatePalette(); };

    // Harmony
    this._root.querySelectorAll('.ncp-harmony-btn').forEach(btn => {
      btn.onclick = () => {
        this.harmony = btn.dataset.harmony;
        this._root.querySelectorAll('.ncp-harmony-btn').forEach(b => b.classList.toggle('active', b.dataset.harmony === this.harmony));
        this._generatePalette();
      };
    });

    // Export format
    this._root.querySelectorAll('.ncp-format-btn').forEach(btn => {
      btn.onclick = () => {
        this.exportFormat = btn.dataset.format;
        this._root.querySelectorAll('.ncp-format-btn').forEach(b => b.classList.toggle('active', b.dataset.format === this.exportFormat));
        this._updateExport();
      };
    });

    // Actions
    e.randomBtn.onclick = () => {
      this.baseColor = { h: Math.floor(Math.random() * 360), s: 40 + Math.floor(Math.random() * 60), l: 30 + Math.floor(Math.random() * 40) };
      this._syncFromHSL();
      this._generatePalette();
    };
    e.saveBtn.onclick = () => this._savePalette();
    e.copyExport.onclick = () => this._copyExport();

    // Wheel click
    this.wheelCanvas.addEventListener('click', (ev) => {
      const rect = this.wheelCanvas.getBoundingClientRect();
      const x = ev.clientX - rect.left - 100;
      const y = ev.clientY - rect.top - 100;
      const dist = Math.sqrt(x * x + y * y);
      if (dist <= 100) {
        const angle = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        const sat = Math.min(100, (dist / 100) * 100);
        this.baseColor.h = Math.round(angle);
        this.baseColor.s = Math.round(sat);
        this._syncFromHSL();
        this._generatePalette();
      }
    });
  }

  _drawWheel() {
    const ctx = this.wheelCtx;
    const cx = 100, cy = 100, r = 98;
    const imageData = ctx.createImageData(200, 200);
    for (let y = 0; y < 200; y++) {
      for (let x = 0; x < 200; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= r) {
          const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
          const sat = (dist / r) * 100;
          const [cr, cg, cb] = this._hslToRgb(angle, sat, 50);
          const idx = (y * 200 + x) * 4;
          imageData.data[idx] = cr;
          imageData.data[idx + 1] = cg;
          imageData.data[idx + 2] = cb;
          imageData.data[idx + 3] = 255;
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    // Draw marker
    this._drawWheelMarker();
  }

  _drawWheelMarker() {
    const ctx = this.wheelCtx;
    this._drawWheel();
    const angle = this.baseColor.h * Math.PI / 180;
    const dist = (this.baseColor.s / 100) * 98;
    const mx = 100 + Math.cos(angle) * dist;
    const my = 100 + Math.sin(angle) * dist;
    ctx.beginPath();
    ctx.arc(mx, my, 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mx, my, 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  _setBaseFromHex(hex) {
    const [h, s, l] = this._hexToHsl(hex);
    this.baseColor = { h, s, l };
    this._syncFromHSL();
    this._generatePalette();
  }

  _syncFromHSL() {
    const e = this.els;
    e.hSlider.value = this.baseColor.h; e.hVal.textContent = this.baseColor.h;
    e.sSlider.value = this.baseColor.s; e.sVal.textContent = this.baseColor.s;
    e.lSlider.value = this.baseColor.l; e.lVal.textContent = this.baseColor.l;
    const hex = this._hslToHex(this.baseColor.h, this.baseColor.s, this.baseColor.l);
    e.baseSwatch.value = hex;
    e.baseHex.value = hex;
    this._drawWheelMarker();
  }

  _generatePalette() {
    const { h, s, l } = this.baseColor;
    this.palette = [];

    switch (this.harmony) {
      case 'complementary':
        this.palette = [
          { h, s, l },
          { h: (h + 180) % 360, s, l }
        ];
        break;
      case 'analogous':
        this.palette = [
          { h: (h - 30 + 360) % 360, s, l },
          { h, s, l },
          { h: (h + 30) % 360, s, l },
          { h: (h + 60) % 360, s, l: Math.min(100, l + 15) },
          { h: (h - 60 + 360) % 360, s, l: Math.max(0, l - 15) }
        ];
        break;
      case 'triadic':
        this.palette = [
          { h, s, l },
          { h: (h + 120) % 360, s, l },
          { h: (h + 240) % 360, s, l }
        ];
        break;
      case 'split-complementary':
        this.palette = [
          { h, s, l },
          { h: (h + 150) % 360, s, l },
          { h: (h + 210) % 360, s, l }
        ];
        break;
      case 'tetradic':
        this.palette = [
          { h, s, l },
          { h: (h + 90) % 360, s, l },
          { h: (h + 180) % 360, s, l },
          { h: (h + 270) % 360, s, l }
        ];
        break;
      case 'monochromatic':
        this.palette = [
          { h, s, l: Math.max(0, l - 30) },
          { h, s, l: Math.max(0, l - 15) },
          { h, s, l },
          { h, s, l: Math.min(100, l + 15) },
          { h, s, l: Math.min(100, l + 30) }
        ];
        break;
      case 'shades':
        for (let i = 0; i < 7; i++) {
          this.palette.push({ h, s, l: Math.max(5, l - (i * 7)) });
        }
        break;
      case 'tints':
        for (let i = 0; i < 7; i++) {
          this.palette.push({ h, s, l: Math.min(95, l + (i * 7)) });
        }
        break;
    }

    this._renderPalette();
    this._updateExport();
  }

  _renderPalette() {
    const display = this.els.paletteDisplay;
    display.innerHTML = '';
    for (const c of this.palette) {
      const hex = this._hslToHex(c.h, c.s, c.l);
      const div = document.createElement('div');
      div.className = 'ncp-palette-color';
      div.style.background = hex;
      div.innerHTML = `<span class="ncp-palette-label">${hex}</span>`;
      div.onclick = () => { this.baseColor = { ...c }; this._syncFromHSL(); this._generatePalette(); };
      display.appendChild(div);
    }

    // Contrast info
    if (this.palette.length >= 2) {
      const c1 = this._hslToHex(this.palette[0].h, this.palette[0].s, this.palette[0].l);
      const c2 = this._hslToHex(this.palette[1].h, this.palette[1].s, this.palette[1].l);
      const ratio = this._contrastRatio(c1, c2);
      const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA Large' : 'Fail';
      this.els.contrastInfo.innerHTML = `Contrast: <strong style="color:#ff2d6b">${ratio.toFixed(2)}:1</strong> — WCAG ${level}<br><small>${c1} on ${c2}</small>`;
    }
  }

  _updateExport() {
    const hexes = this.palette.map(c => this._hslToHex(c.h, c.s, c.l));
    let output;

    switch (this.exportFormat) {
      case 'css':
        output = `:root {\n${hexes.map((h, i) => `  --color-${i + 1}: ${h};`).join('\n')}\n}`;
        break;
      case 'scss':
        output = hexes.map((h, i) => `$color-${i + 1}: ${h};`).join('\n');
        break;
      case 'tailwind':
        output = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${hexes.map((h, i) => `        'nexus-${i + 1}': '${h}',`).join('\n')}\n      }\n    }\n  }\n}`;
        break;
      case 'json':
        output = JSON.stringify(hexes.reduce((obj, h, i) => { obj[`color-${i + 1}`] = h; return obj; }, {}), null, 2);
        break;
      case 'array':
        output = `const palette = [${hexes.map(h => `'${h}'`).join(', ')}];`;
        break;
      default:
        output = hexes.join('\n');
    }

    this.els.exportArea.textContent = output;
    this._lastExport = output;
  }

  async _copyExport() {
    if (!this._lastExport) return;
    try {
      await navigator.clipboard.writeText(this._lastExport);
      const orig = this.els.copyExport.textContent;
      this.els.copyExport.textContent = '✓ Copied!';
      setTimeout(() => { this.els.copyExport.textContent = orig; }, 1500);
    } catch {}
  }

  _savePalette() {
    const hexes = this.palette.map(c => this._hslToHex(c.h, c.s, c.l));
    this.savedPalettes.push({ harmony: this.harmony, colors: hexes, base: this._hslToHex(this.baseColor.h, this.baseColor.s, this.baseColor.l) });
    this._renderSaved();
  }

  _renderSaved() {
    const list = this.els.savedList;
    list.innerHTML = '';
    this.savedPalettes.forEach((p, idx) => {
      const div = document.createElement('div');
      div.style.cssText = 'display:flex;gap:3px;margin-bottom:6px;cursor:pointer;align-items:center';
      div.innerHTML = `<span style="font-size:10px;color:#666;width:60px">${p.harmony.slice(0, 8)}</span>${p.colors.map(c => `<div style="width:20px;height:20px;border-radius:4px;background:${c}"></div>`).join('')}`;
      div.onclick = () => {
        this._setBaseFromHex(p.base);
        this.harmony = p.harmony;
        this._root.querySelectorAll('.ncp-harmony-btn').forEach(b => b.classList.toggle('active', b.dataset.harmony === this.harmony));
        this._generatePalette();
      };
      list.appendChild(div);
    });
  }

  // ─── Color Utilities ───
  _hslToHex(h, s, l) {
    const [r, g, b] = this._hslToRgb(h, s, l);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  _hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)));
    };
    return [f(0), f(8), f(4)];
  }

  _hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
    }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }

  _luminance(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const toLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  _contrastRatio(hex1, hex2) {
    const l1 = this._luminance(hex1);
    const l2 = this._luminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }
}

window.NexusColorPalette = NexusColorPalette;
