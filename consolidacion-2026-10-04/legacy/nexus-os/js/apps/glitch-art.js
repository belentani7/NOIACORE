/**
 * NEXUS OS — Glitch Art Generator
 * Canvas-based image glitch effects with neon glassmorphism UI
 * Pure vanilla JS, no external dependencies
 */

class NexusGlitchArt {
  constructor(container) {
    this.container = typeof container === 'string'
      ? document.querySelector(container) : container;
    this.canvas = null;
    this.ctx = null;
    this.originalImageData = null;
    this.sourceImage = null;
    this.effectStack = [];
    this.animFrame = null;
    this.isAnimating = false;
    this.animSpeed = 150; // ms per frame
    this.seed = Math.random() * 10000;

    this.presets = {
      vhs: [
        { type: 'vhs', intensity: 70 },
        { type: 'scanlines', intensity: 50 },
        { type: 'chromatic', intensity: 8 },
        { type: 'noise', intensity: 15 }
      ],
      corrupted: [
        { type: 'blockCorrupt', intensity: 60 },
        { type: 'rgbShift', intensity: 15, r: 10, g: -5, b: 8 },
        { type: 'noise', intensity: 20 }
      ],
      datamosh: [
        { type: 'pixelSort', intensity: 80 },
        { type: 'scanlineDisplace', intensity: 50 },
        { type: 'chromatic', intensity: 12 }
      ],
      brokenLcd: [
        { type: 'mosaic', intensity: 40 },
        { type: 'blockCorrupt', intensity: 30 },
        { type: 'bitcrush', intensity: 60 }
      ],
      holographic: [
        { type: 'chromatic', intensity: 20 },
        { type: 'wave', intensity: 30 },
        { type: 'scanlines', intensity: 25 },
        { type: 'neonGlow', intensity: 50 }
      ]
    };
  }

  render() {
    this.container.innerHTML = '';
    this._injectStyles();
    this._buildUI();
    this._bindEvents();
  }

  destroy() {
    this.stopAnimation();
    this.container.innerHTML = '';
  }

  _injectStyles() {
    if (document.getElementById('nexus-glitch-art-styles')) return;
    const style = document.createElement('style');
    style.id = 'nexus-glitch-art-styles';
    style.textContent = `
      .nga-root {
        display: flex; height: 100%; background: #0a0a0f;
        font-family: 'Segoe UI', system-ui, sans-serif; color: #e0e0e0;
        overflow: hidden;
      }
      .nga-canvas-area {
        flex: 1; display: flex; flex-direction: column; min-width: 0;
        position: relative;
      }
      .nga-canvas-wrap {
        flex: 1; display: flex; align-items: center; justify-content: center;
        background: repeating-conic-gradient(#0d0d15 0% 25%, #0a0a12 0% 50%) 0 0 / 20px 20px;
        overflow: hidden; position: relative;
      }
      .nga-canvas-wrap canvas {
        max-width: 95%; max-height: 95%; image-rendering: auto;
        border: 1px solid rgba(255,0,60,0.1);
      }
      .nga-empty {
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: 16px; color: #555;
      }
      .nga-empty-icon { font-size: 64px; opacity: 0.3; }
      .nga-open-btn {
        padding: 10px 24px; background: rgba(255,0,60,0.15);
        border: 1px solid rgba(255,0,60,0.4); border-radius: 8px;
        color: #ff003c; cursor: pointer; font-size: 14px; transition: all 0.2s;
      }
      .nga-open-btn:hover {
        background: rgba(255,0,60,0.25); box-shadow: 0 0 15px rgba(255,0,60,0.2);
      }
      .nga-drop-overlay {
        position: absolute; inset: 0; background: rgba(255,0,60,0.15);
        border: 3px dashed #ff003c; display: none; align-items: center;
        justify-content: center; z-index: 20; font-size: 22px; color: #ff003c;
        backdrop-filter: blur(8px);
      }
      .nga-drop-overlay.active { display: flex; }

      .nga-bottom-bar {
        display: flex; align-items: center; gap: 8px; padding: 8px 12px;
        background: rgba(15,15,25,0.95); border-top: 1px solid rgba(255,0,60,0.1);
      }
      .nga-bar-btn {
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,0,60,0.15);
        color: #ccc; padding: 6px 14px; border-radius: 6px; cursor: pointer;
        font-size: 12px; transition: all 0.2s;
      }
      .nga-bar-btn:hover { background: rgba(255,0,60,0.1); color: #ff003c; }
      .nga-bar-btn.primary {
        background: rgba(255,0,60,0.2); color: #ff003c;
        border-color: rgba(255,0,60,0.5);
      }
      .nga-bar-btn.active {
        background: rgba(255,0,60,0.3); box-shadow: 0 0 10px rgba(255,0,60,0.2);
      }
      .nga-bar-spacer { flex: 1; }

      /* Sidebar */
      .nga-sidebar {
        width: 300px; background: rgba(15,15,25,0.95);
        border-left: 1px solid rgba(255,0,60,0.15);
        display: flex; flex-direction: column; overflow: hidden;
      }
      .nga-sidebar-header {
        padding: 12px; border-bottom: 1px solid rgba(255,0,60,0.1);
        font-size: 14px; font-weight: 600; color: #ff2d6b;
      }
      .nga-sidebar-scroll {
        flex: 1; overflow-y: auto; padding: 12px;
      }
      .nga-sidebar-scroll::-webkit-scrollbar { width: 4px; }
      .nga-sidebar-scroll::-webkit-scrollbar-thumb { background: #ff003c33; border-radius: 2px; }

      .nga-preset-row {
        display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;
      }
      .nga-preset-btn {
        padding: 5px 12px; font-size: 11px; background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,0,60,0.2); border-radius: 14px;
        color: #888; cursor: pointer; transition: all 0.2s;
      }
      .nga-preset-btn:hover { background: rgba(255,0,60,0.15); color: #ff003c; }
      .nga-preset-btn.active {
        background: rgba(255,0,60,0.25); color: #ff003c;
        border-color: #ff003c; box-shadow: 0 0 6px rgba(255,0,60,0.2);
      }

      .nga-section-title {
        font-size: 12px; color: #666; text-transform: uppercase;
        letter-spacing: 1px; margin: 12px 0 8px;
      }

      .nga-effect-item {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,0,60,0.08);
        border-radius: 8px; padding: 10px; margin-bottom: 8px;
        transition: all 0.2s;
      }
      .nga-effect-item:hover { border-color: rgba(255,0,60,0.2); }
      .nga-effect-header {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 6px;
      }
      .nga-effect-name { font-size: 12px; color: #ddd; }
      .nga-effect-remove {
        background: none; border: none; color: #ff003c44; cursor: pointer;
        font-size: 14px; padding: 0 4px; transition: color 0.2s;
      }
      .nga-effect-remove:hover { color: #ff003c; }
      .nga-effect-slider-row {
        display: flex; align-items: center; gap: 6px;
      }
      .nga-effect-slider {
        flex: 1; -webkit-appearance: none; height: 3px;
        background: rgba(255,255,255,0.1); border-radius: 2px; outline: none;
      }
      .nga-effect-slider::-webkit-slider-thumb {
        -webkit-appearance: none; width: 10px; height: 10px;
        background: #ff003c; border-radius: 50%; cursor: pointer;
        box-shadow: 0 0 4px #ff003c;
      }
      .nga-effect-val {
        font-size: 11px; color: #ff2d6b; width: 30px; text-align: right;
      }

      .nga-add-row {
        display: flex; gap: 6px; margin-top: 8px;
      }
      .nga-add-select {
        flex: 1; background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,0,60,0.15); color: #ccc;
        padding: 6px 8px; border-radius: 6px; font-size: 12px;
        outline: none; cursor: pointer;
      }
      .nga-add-select option { background: #1a1a2e; }
      .nga-add-btn {
        background: rgba(255,0,60,0.15); border: 1px solid rgba(255,0,60,0.3);
        color: #ff003c; padding: 6px 14px; border-radius: 6px;
        cursor: pointer; font-size: 12px; transition: all 0.2s;
      }
      .nga-add-btn:hover { background: rgba(255,0,60,0.25); }

      .nga-seed-row {
        display: flex; align-items: center; gap: 8px; margin-top: 12px;
        padding-top: 12px; border-top: 1px solid rgba(255,0,60,0.1);
      }
      .nga-seed-input {
        flex: 1; background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,0,60,0.15); color: #ccc;
        padding: 5px 8px; border-radius: 6px; font-size: 12px; outline: none;
      }
      .nga-seed-btn {
        background: none; border: 1px solid rgba(255,0,60,0.2);
        color: #888; padding: 5px 10px; border-radius: 6px;
        cursor: pointer; font-size: 12px; transition: all 0.2s;
      }
      .nga-seed-btn:hover { color: #ff003c; border-color: rgba(255,0,60,0.4); }
    `;
    document.head.appendChild(style);
  }

  _buildUI() {
    const root = document.createElement('div');
    root.className = 'nga-root';
    root.innerHTML = `
      <div class="nga-canvas-area">
        <div class="nga-canvas-wrap" data-nga="canvasWrap">
          <div class="nga-empty" data-nga="empty">
            <div class="nga-empty-icon">🎨</div>
            <div style="font-size:16px;">Load an image to start glitching</div>
            <button class="nga-open-btn" data-nga="openBtn">Open Image</button>
          </div>
          <canvas data-nga="canvas" style="display:none"></canvas>
          <div class="nga-drop-overlay" data-nga="dropOverlay">Drop image here</div>
        </div>
        <div class="nga-bottom-bar">
          <button class="nga-bar-btn" data-nga="applyBtn">⚡ Apply Effects</button>
          <button class="nga-bar-btn" data-nga="resetBtn">↺ Reset</button>
          <button class="nga-bar-btn" data-nga="randomBtn">🎲 Randomize</button>
          <div class="nga-bar-spacer"></div>
          <button class="nga-bar-btn" data-nga="animBtn">▶ Animate</button>
          <button class="nga-bar-btn primary" data-nga="saveBtn">💾 Save PNG</button>
        </div>
      </div>

      <div class="nga-sidebar">
        <div class="nga-sidebar-header">Glitch Effects</div>
        <div class="nga-sidebar-scroll">
          <div class="nga-section-title">Presets</div>
          <div class="nga-preset-row">
            <button class="nga-preset-btn" data-preset="vhs">VHS</button>
            <button class="nga-preset-btn" data-preset="corrupted">Corrupted</button>
            <button class="nga-preset-btn" data-preset="datamosh">Datamosh</button>
            <button class="nga-preset-btn" data-preset="brokenLcd">Broken LCD</button>
            <button class="nga-preset-btn" data-preset="holographic">Holographic</button>
          </div>

          <div class="nga-section-title">Effect Stack</div>
          <div data-nga="effectStack"></div>

          <div class="nga-add-row">
            <select class="nga-add-select" data-nga="addSelect">
              <option value="rgbShift">RGB Channel Shift</option>
              <option value="pixelSort">Pixel Sorting</option>
              <option value="dataBend">Data Bending</option>
              <option value="scanlineDisplace">Scanline Displace</option>
              <option value="blockCorrupt">Block Corruption</option>
              <option value="invert">Color Inversion</option>
              <option value="noise">Noise Injection</option>
              <option value="wave">Wave Distortion</option>
              <option value="mosaic">Mosaic Fragment</option>
              <option value="chromatic">Chromatic Aberration</option>
              <option value="vhs">VHS Degradation</option>
              <option value="crt">CRT Monitor</option>
              <option value="digitalCorrupt">Digital Corruption</option>
              <option value="zalgo">Glitch Text Overlay</option>
              <option value="dither">Dithering</option>
              <option value="posterize">Posterize</option>
              <option value="bitcrush">Bit-Crush</option>
              <option value="scanlines">Scanlines</option>
              <option value="neonGlow">Neon Glow</option>
            </select>
            <button class="nga-add-btn" data-nga="addBtn">+ Add</button>
          </div>

          <div class="nga-seed-row">
            <span style="font-size:11px;color:#666;">Seed:</span>
            <input type="number" class="nga-seed-input" data-nga="seedInput" value="0">
            <button class="nga-seed-btn" data-nga="seedRandomBtn">🎲</button>
            <button class="nga-seed-btn" data-nga="seedApplyBtn">Apply</button>
          </div>
        </div>
      </div>

      <input type="file" accept="image/*" style="display:none" data-nga="fileInput">
    `;
    this.container.appendChild(root);
    this.root = root;

    this.els = {};
    root.querySelectorAll('[data-nga]').forEach(el => {
      this.els[el.dataset.nga] = el;
    });
    this.canvas = this.els.canvas;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  _bindEvents() {
    const e = this.els;

    e.openBtn.onclick = () => e.fileInput.click();
    e.fileInput.onchange = (ev) => {
      if (ev.target.files[0]) this._loadImage(ev.target.files[0]);
    };

    e.applyBtn.onclick = () => this._applyEffectStack();
    e.resetBtn.onclick = () => this._resetToOriginal();
    e.randomBtn.onclick = () => this._randomizeAll();
    e.saveBtn.onclick = () => this._savePNG();
    e.animBtn.onclick = () => this._toggleAnimation();

    e.addBtn.onclick = () => {
      const type = e.addSelect.value;
      this._addToStack(type);
    };

    e.seedRandomBtn.onclick = () => {
      this.seed = Math.random() * 10000;
      e.seedInput.value = Math.floor(this.seed);
    };
    e.seedApplyBtn.onclick = () => {
      this.seed = parseFloat(e.seedInput.value) || 0;
      this._applyEffectStack();
    };

    // Presets
    this.root.querySelectorAll('.nga-preset-btn').forEach(btn => {
      btn.onclick = () => this._loadPreset(btn.dataset.preset);
    });

    // Drag and drop
    const wrap = e.canvasWrap;
    wrap.ondragover = (ev) => { ev.preventDefault(); e.dropOverlay.classList.add('active'); };
    wrap.ondragleave = () => e.dropOverlay.classList.remove('active');
    wrap.ondrop = (ev) => {
      ev.preventDefault();
      e.dropOverlay.classList.remove('active');
      const file = ev.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) this._loadImage(file);
    };
  }

  _loadImage(file) {
    const img = new Image();
    img.onload = () => {
      // Scale down large images
      const maxDim = 1200;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.floor(w * scale);
        h = Math.floor(h * scale);
      }
      this.canvas.width = w;
      this.canvas.height = h;
      this.ctx.drawImage(img, 0, 0, w, h);
      this.originalImageData = this.ctx.getImageData(0, 0, w, h);
      this.sourceImage = img;
      this.canvas.style.display = '';
      this.els.empty.style.display = 'none';
    };
    img.src = URL.createObjectURL(file);
  }

  _loadPreset(name) {
    const preset = this.presets[name];
    if (!preset) return;
    this.effectStack = preset.map(e => ({ ...e }));
    this._renderEffectStack();
    this._applyEffectStack();
    // Highlight preset button
    this.root.querySelectorAll('.nga-preset-btn').forEach(b => b.classList.remove('active'));
    this.root.querySelector(`[data-preset="${name}"]`)?.classList.add('active');
  }

  _addToStack(type) {
    this.effectStack.push({ type, intensity: 50 });
    this._renderEffectStack();
  }

  _renderEffectStack() {
    const container = this.els.effectStack;
    container.innerHTML = '';
    this.effectStack.forEach((effect, idx) => {
      const div = document.createElement('div');
      div.className = 'nga-effect-item';
      div.innerHTML = `
        <div class="nga-effect-header">
          <span class="nga-effect-name">${this._effectLabel(effect.type)}</span>
          <button class="nga-effect-remove" data-idx="${idx}">✕</button>
        </div>
        <div class="nga-effect-slider-row">
          <input type="range" class="nga-effect-slider" min="0" max="100" value="${effect.intensity}" data-idx="${idx}">
          <span class="nga-effect-val">${effect.intensity}</span>
        </div>
      `;
      const slider = div.querySelector('.nga-effect-slider');
      const val = div.querySelector('.nga-effect-val');
      slider.oninput = (ev) => {
        this.effectStack[idx].intensity = parseInt(ev.target.value);
        val.textContent = ev.target.value;
      };
      slider.onchange = () => this._applyEffectStack();
      div.querySelector('.nga-effect-remove').onclick = () => {
        this.effectStack.splice(idx, 1);
        this._renderEffectStack();
        this._applyEffectStack();
      };
      container.appendChild(div);
    });
  }

  _effectLabel(type) {
    const labels = {
      rgbShift: 'RGB Shift', pixelSort: 'Pixel Sort', dataBend: 'Data Bend',
      scanlineDisplace: 'Scanline Displace', blockCorrupt: 'Block Corrupt',
      invert: 'Color Invert', noise: 'Noise', wave: 'Wave Distort',
      mosaic: 'Mosaic', chromatic: 'Chromatic Aberration', vhs: 'VHS',
      crt: 'CRT Monitor', digitalCorrupt: 'Digital Corrupt', zalgo: 'Zalgo Text',
      dither: 'Dithering', posterize: 'Posterize', bitcrush: 'Bit-Crush',
      scanlines: 'Scanlines', neonGlow: 'Neon Glow'
    };
    return labels[type] || type;
  }

  /* ─── SEEDED RANDOM ─── */
  _seededRandom(s) {
    let seed = s || this.seed;
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  /* ─── APPLY EFFECT STACK ─── */
  _applyEffectStack() {
    if (!this.originalImageData) return;
    // Restore original
    this.ctx.putImageData(this.originalImageData, 0, 0);

    this.effectStack.forEach(effect => {
      this._applyEffect(effect);
    });
  }

  _resetToOriginal() {
    if (!this.originalImageData) return;
    this.ctx.putImageData(this.originalImageData, 0, 0);
    this.effectStack = [];
    this._renderEffectStack();
    this.root.querySelectorAll('.nga-preset-btn').forEach(b => b.classList.remove('active'));
  }

  _randomizeAll() {
    if (!this.originalImageData) return;
    const types = [
      'rgbShift', 'pixelSort', 'noise', 'wave', 'chromatic',
      'scanlines', 'blockCorrupt', 'bitcrush', 'posterize'
    ];
    this.effectStack = [];
    const count = 2 + Math.floor(Math.random() * 4);
    const shuffled = [...types].sort(() => Math.random() - 0.5);
    for (let i = 0; i < count && i < shuffled.length; i++) {
      this.effectStack.push({
        type: shuffled[i],
        intensity: 10 + Math.floor(Math.random() * 80)
      });
    }
    this.seed = Math.random() * 10000;
    this.els.seedInput.value = Math.floor(this.seed);
    this._renderEffectStack();
    this._applyEffectStack();
  }

  /* ─── EFFECT IMPLEMENTATIONS ─── */
  _applyEffect(effect) {
    const { type, intensity } = effect;
    const t = intensity / 100;
    const w = this.canvas.width;
    const h = this.canvas.height;

    switch (type) {
      case 'rgbShift': this._fxRGBShift(t, effect); break;
      case 'pixelSort': this._fxPixelSort(t); break;
      case 'dataBend': this._fxDataBend(t); break;
      case 'scanlineDisplace': this._fxScanlineDisplace(t); break;
      case 'blockCorrupt': this._fxBlockCorrupt(t); break;
      case 'invert': this._fxInvert(t); break;
      case 'noise': this._fxNoise(t); break;
      case 'wave': this._fxWave(t); break;
      case 'mosaic': this._fxMosaic(t); break;
      case 'chromatic': this._fxChromaticAberration(t); break;
      case 'vhs': this._fxVHS(t); break;
      case 'crt': this._fxCRT(t); break;
      case 'digitalCorrupt': this._fxDigitalCorrupt(t); break;
      case 'zalgo': this._fxZalgo(t); break;
      case 'dither': this._fxDither(t); break;
      case 'posterize': this._fxPosterize(t); break;
      case 'bitcrush': this._fxBitCrush(t); break;
      case 'scanlines': this._fxScanlines(t); break;
      case 'neonGlow': this._fxNeonGlow(t); break;
    }
  }

  _fxRGBShift(t, effect) {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const d = imgData.data;
    const r = effect.r || Math.floor(t * 20);
    const g = effect.g || Math.floor(t * -10);
    const b = effect.b || Math.floor(t * 15);
    const w = this.canvas.width;
    const copy = new Uint8ClampedArray(d);

    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const ri = (y * w + Math.min(w - 1, Math.max(0, x + r))) * 4;
        const gi = (y * w + Math.min(w - 1, Math.max(0, x + g))) * 4;
        const bi = (y * w + Math.min(w - 1, Math.max(0, x + b))) * 4;
        d[i] = copy[ri];
        d[i + 1] = copy[gi + 1];
        d[i + 2] = copy[bi + 2];
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxPixelSort(t) {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const d = imgData.data;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const threshold = (1 - t) * 255;
    const rng = this._seededRandom();

    for (let y = 0; y < h; y++) {
      if (rng() > t * 0.8) continue;
      const row = [];
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const brightness = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (brightness > threshold) {
          row.push({ r: d[i], g: d[i + 1], b: d[i + 2], x });
        }
      }
      row.sort((a, b) => (a.r + a.g + a.b) - (b.r + b.g + b.b));
      row.forEach((px, idx) => {
        const i = (y * w + px.x) * 4;
        d[i] = row[idx].r;
        d[i + 1] = row[idx].g;
        d[i + 2] = row[idx].b;
      });
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxDataBend(t) {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const d = imgData.data;
    const rng = this._seededRandom();
    const count = Math.floor(t * d.length * 0.1);

    for (let i = 0; i < count; i++) {
      const pos = Math.floor(rng() * (d.length - 4));
      const src = Math.floor(rng() * (d.length - 4));
      // Copy a chunk from one place to another
      const chunkSize = Math.floor(rng() * 20) + 1;
      for (let j = 0; j < chunkSize && pos + j < d.length && src + j < d.length; j++) {
        d[pos + j] = d[src + j];
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxScanlineDisplace(t) {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const d = imgData.data;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const copy = new Uint8ClampedArray(d);
    const rng = this._seededRandom();

    for (let y = 0; y < h; y++) {
      if (rng() > t * 0.5) continue;
      const shift = Math.floor((rng() - 0.5) * w * t * 0.5);
      for (let x = 0; x < w; x++) {
        const srcX = Math.min(w - 1, Math.max(0, x + shift));
        const di = (y * w + x) * 4;
        const si = (y * w + srcX) * 4;
        d[di] = copy[si];
        d[di + 1] = copy[si + 1];
        d[di + 2] = copy[si + 2];
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxBlockCorrupt(t) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const imgData = this.ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const copy = new Uint8ClampedArray(d);
    const rng = this._seededRandom();
    const blockCount = Math.floor(t * 30) + 3;

    for (let i = 0; i < blockCount; i++) {
      const bw = Math.floor(rng() * w * 0.3) + 10;
      const bh = Math.floor(rng() * h * 0.15) + 5;
      const sx = Math.floor(rng() * (w - bw));
      const sy = Math.floor(rng() * (h - bh));
      const dx = Math.floor(rng() * (w - bw));
      const dy = Math.floor(rng() * (h - bh));

      for (let y = 0; y < bh; y++) {
        for (let x = 0; x < bw; x++) {
          const si = ((sy + y) * w + sx + x) * 4;
          const di = ((dy + y) * w + dx + x) * 4;
          if (di >= 0 && di < d.length - 3 && si >= 0 && si < copy.length - 3) {
            d[di] = copy[si];
            d[di + 1] = copy[si + 1];
            d[di + 2] = copy[si + 2];
          }
        }
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxInvert(t) {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const d = imgData.data;
    const rng = this._seededRandom();

    for (let i = 0; i < d.length; i += 4) {
      if (rng() < t) {
        d[i] = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxNoise(t) {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const d = imgData.data;
    const rng = this._seededRandom();
    const density = t * 0.5;

    for (let i = 0; i < d.length; i += 4) {
      if (rng() < density) {
        const noise = (rng() - 0.5) * 255;
        d[i] = Math.max(0, Math.min(255, d[i] + noise));
        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + noise));
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + noise));
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxWave(t) {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const d = imgData.data;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const copy = new Uint8ClampedArray(d);
    const amplitude = t * 30;
    const frequency = t * 0.1 + 0.02;

    for (let y = 0; y < h; y++) {
      const shift = Math.floor(Math.sin(y * frequency + this.seed) * amplitude);
      for (let x = 0; x < w; x++) {
        const srcX = Math.min(w - 1, Math.max(0, x + shift));
        const di = (y * w + x) * 4;
        const si = (y * w + srcX) * 4;
        d[di] = copy[si];
        d[di + 1] = copy[si + 1];
        d[di + 2] = copy[si + 2];
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxMosaic(t) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const gridSize = Math.max(4, Math.floor((1 - t) * 40) + 4);
    const cols = Math.ceil(w / gridSize);
    const rows = Math.ceil(h / gridSize);

    // Create grid of tile data
    const tiles = [];
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        tiles.push({ gx, gy });
      }
    }

    // Shuffle tiles
    const rng = this._seededRandom();
    const shuffleCount = Math.floor(t * tiles.length);
    for (let i = 0; i < shuffleCount; i++) {
      const a = Math.floor(rng() * tiles.length);
      const b = Math.floor(rng() * tiles.length);
      [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
    }

    const srcData = this.ctx.getImageData(0, 0, w, h);
    const sd = srcData.data;
    const outData = this.ctx.createImageData(w, h);
    const od = outData.data;

    let tileIdx = 0;
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const src = tiles[tileIdx++];
        for (let py = 0; py < gridSize; py++) {
          for (let px = 0; px < gridSize; px++) {
            const dx = gx * gridSize + px;
            const dy = gy * gridSize + py;
            const sx = src.gx * gridSize + px;
            const sy = src.gy * gridSize + py;
            if (dx < w && dy < h && sx < w && sy < h) {
              const di = (dy * w + dx) * 4;
              const si = (sy * w + sx) * 4;
              od[di] = sd[si];
              od[di + 1] = sd[si + 1];
              od[di + 2] = sd[si + 2];
              od[di + 3] = sd[si + 3];
            }
          }
        }
      }
    }
    this.ctx.putImageData(outData, 0, 0);
  }

  _fxChromaticAberration(t) {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const d = imgData.data;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const copy = new Uint8ClampedArray(d);
    const offset = Math.floor(t * 15) + 2;
    const cx = w / 2, cy = h / 2;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.sqrt(cx * cx + cy * cy);
        const factor = (dist / maxDist) * offset;
        const normDx = dx / (dist || 1);
        const normDy = dy / (dist || 1);

        const rx = Math.min(w - 1, Math.max(0, Math.floor(x + normDx * factor)));
        const ry = Math.min(h - 1, Math.max(0, Math.floor(y + normDy * factor)));
        const bx = Math.min(w - 1, Math.max(0, Math.floor(x - normDx * factor)));
        const by = Math.min(h - 1, Math.max(0, Math.floor(y - normDy * factor)));

        const ri = (ry * w + rx) * 4;
        const bi = (by * w + bx) * 4;
        d[i] = copy[ri];
        d[i + 2] = copy[bi + 2];
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxVHS(t) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const imgData = this.ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const copy = new Uint8ClampedArray(d);
    const rng = this._seededRandom();

    // Tracking lines
    const trackingLines = Math.floor(t * 8) + 2;
    for (let i = 0; i < trackingLines; i++) {
      const y = Math.floor(rng() * h);
      const lineH = Math.floor(rng() * 5) + 1;
      const shift = Math.floor((rng() - 0.5) * 40 * t);
      for (let ly = y; ly < Math.min(h, y + lineH); ly++) {
        for (let x = 0; x < w; x++) {
          const sx = Math.min(w - 1, Math.max(0, x + shift));
          const di = (ly * w + x) * 4;
          const si = (ly * w + sx) * 4;
          d[di] = copy[si];
          d[di + 1] = copy[si + 1];
          d[di + 2] = copy[si + 2];
        }
      }
    }

    // Color bleed
    for (let y = 0; y < h; y++) {
      for (let x = 1; x < w; x++) {
        const i = (y * w + x) * 4;
        const pi = (y * w + x - 1) * 4;
        const bleed = t * 0.3;
        d[i] = Math.floor(d[i] * (1 - bleed) + d[pi] * bleed);
      }
    }

    // Noise
    for (let i = 0; i < d.length; i += 4) {
      if (rng() < t * 0.1) {
        const n = (rng() - 0.5) * 100;
        d[i] = Math.max(0, Math.min(255, d[i] + n));
        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxCRT(t) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const imgData = this.ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const copy = new Uint8ClampedArray(d);

    // Curved edges + scanlines + phosphor glow
    const cx = w / 2, cy = h / 2;
    const curveAmt = t * 0.15;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const di = (y * w + x) * 4;

        // Barrel distortion
        const nx = (x - cx) / cx;
        const ny = (y - cy) / cy;
        const r2 = nx * nx + ny * ny;
        const distort = 1 + curveAmt * r2;
        const sx = Math.floor(cx + nx * distort * cx);
        const sy = Math.floor(cy + ny * distort * cy);

        if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
          const si = (sy * w + sx) * 4;
          d[di] = copy[si];
          d[di + 1] = copy[si + 1];
          d[di + 2] = copy[si + 2];
        } else {
          d[di] = d[di + 1] = d[di + 2] = 0;
        }

        // Scanline darkening
        if (y % 3 === 0) {
          d[di] = Math.floor(d[di] * 0.7);
          d[di + 1] = Math.floor(d[di + 1] * 0.7);
          d[di + 2] = Math.floor(d[di + 2] * 0.7);
        }

        // Phosphor sub-pixel simulation
        const brightness = (d[di] + d[di + 1] + d[di + 2]) / 3;
        if (brightness > 180) {
          const glow = t * 15;
          d[di] = Math.min(255, d[di] + glow);
          d[di + 1] = Math.min(255, d[di + 1] + glow * 0.5);
        }
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxDigitalCorrupt(t) {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const d = imgData.data;
    const rng = this._seededRandom();
    const corruptionCount = Math.floor(t * d.length * 0.05);

    for (let i = 0; i < corruptionCount; i++) {
      const pos = Math.floor(rng() * d.length);
      // Byte-level manipulation: zero, max, swap
      const op = Math.floor(rng() * 4);
      switch (op) {
        case 0: d[pos] = 0; break;
        case 1: d[pos] = 255; break;
        case 2: {
          const other = Math.floor(rng() * d.length);
          [d[pos], d[other]] = [d[other], d[pos]];
          break;
        }
        case 3: d[pos] = d[pos] ^ 0xFF; break;
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxZalgo(t) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const zalgoChars = '̴̵̶̷̸̧̨̡̢̧̨̛͇͈͉͍͎̜̝̞̟̠̣̤̥̦̩̪̫̬̭̮̯̰̱̲̳̪̫̭̮̯̰̱̲̳̹̺̻̼͇͈͉͍͎̍̎̄̅̿̑̆̇̈̉̊̋̌̐̒̓̔̽̾̿̀́̂̃̄͆͊͋͌̏̐̑̒̓̔̀́̂̃̄̅̆̇̈̉̊̋̌̍̎̏̐̑̒̓̔̕̚̕̚';
    const phrases = ['ERROR', 'NULL', 'VOID', '0xDEAD', 'GLITCH', 'CORRUPT', '404', 'NaN', 'BREACH'];
    const rng = this._seededRandom();
    const count = Math.floor(t * 15) + 3;

    this.ctx.save();
    this.ctx.font = `${14 + Math.floor(t * 20)}px monospace`;

    for (let i = 0; i < count; i++) {
      const x = Math.floor(rng() * w);
      const y = Math.floor(rng() * h);
      let text = phrases[Math.floor(rng() * phrases.length)];
      // Add zalgo marks
      let zalgoed = '';
      for (const ch of text) {
        zalgoed += ch;
        const marks = Math.floor(rng() * t * 6);
        for (let m = 0; m < marks; m++) {
          zalgoed += zalgoChars[Math.floor(rng() * zalgoChars.length)];
        }
      }
      this.ctx.fillStyle = `rgba(255, ${Math.floor(rng() * 60)}, ${Math.floor(rng() * 100)}, ${0.5 + rng() * 0.5})`;
      this.ctx.fillText(zalgoed, x, y);
    }
    this.ctx.restore();
  }

  _fxDither(t) {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const d = imgData.data;
    const w = this.canvas.width;
    const levels = Math.max(2, Math.floor((1 - t) * 8) + 2);

    // Bayer 4x4 matrix
    const bayer = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5]
    ];

    for (let y = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const threshold = (bayer[y % 4][x % 4] / 16 - 0.5) * (256 / levels);
        for (let c = 0; c < 3; c++) {
          const val = d[i + c] + threshold;
          d[i + c] = Math.round(val / (256 / levels)) * (256 / (levels - 1));
          d[i + c] = Math.max(0, Math.min(255, d[i + c]));
        }
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxPosterize(t) {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const d = imgData.data;
    const levels = Math.max(2, Math.floor((1 - t) * 10) + 2);
    const step = 255 / (levels - 1);

    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.round(Math.round(d[i] / step) * step);
      d[i + 1] = Math.round(Math.round(d[i + 1] / step) * step);
      d[i + 2] = Math.round(Math.round(d[i + 2] / step) * step);
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxBitCrush(t) {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const d = imgData.data;
    const bits = Math.max(1, Math.floor((1 - t) * 7) + 1);
    const mask = ~((1 << (8 - bits)) - 1) & 0xFF;

    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i] & mask;
      d[i + 1] = d[i + 1] & mask;
      d[i + 2] = d[i + 2] & mask;
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  _fxScanlines(t) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.save();
    this.ctx.fillStyle = `rgba(0, 0, 0, ${t * 0.4})`;
    const gap = Math.max(2, Math.floor((1 - t) * 6) + 2);
    for (let y = 0; y < h; y += gap) {
      this.ctx.fillRect(0, y, w, 1);
    }
    this.ctx.restore();
  }

  _fxNeonGlow(t) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const imgData = this.ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    // Boost contrast and add neon color shift
    for (let i = 0; i < d.length; i += 4) {
      const brightness = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if (brightness > 128) {
        // Bright areas get neon pink/red glow
        d[i] = Math.min(255, d[i] + t * 80);
        d[i + 1] = Math.min(255, d[i + 1] * (1 - t * 0.3));
        d[i + 2] = Math.min(255, d[i + 2] + t * 40);
      } else {
        // Dark areas get deep blue tint
        d[i + 2] = Math.min(255, d[i + 2] + t * 30);
      }
    }

    // Edge detection for glow
    const copy = new Uint8ClampedArray(d);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        const iu = ((y - 1) * w + x) * 4;
        const id = ((y + 1) * w + x) * 4;
        const il = (y * w + x - 1) * 4;
        const ir = (y * w + x + 1) * 4;

        for (let c = 0; c < 3; c++) {
          const edge = Math.abs(copy[iu + c] - copy[id + c]) + Math.abs(copy[il + c] - copy[ir + c]);
          if (edge > 50) {
            d[i + c] = Math.min(255, d[i + c] + edge * t * 0.5);
          }
        }
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  /* ─── ANIMATION ─── */
  _toggleAnimation() {
    if (this.isAnimating) {
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
  }

  startAnimation() {
    if (!this.originalImageData || this.effectStack.length === 0) return;
    this.isAnimating = true;
    this.els.animBtn.textContent = '⏸ Stop';
    this.els.animBtn.classList.add('active');
    this._animLoop();
  }

  stopAnimation() {
    this.isAnimating = false;
    cancelAnimationFrame(this.animFrame);
    this.els.animBtn.textContent = '▶ Animate';
    this.els.animBtn.classList.remove('active');
  }

  _animLoop() {
    if (!this.isAnimating) return;
    // Change seed slightly each frame
    this.seed += 0.5;
    this._applyEffectStack();
    this.animFrame = setTimeout(() => {
      requestAnimationFrame(() => this._animLoop());
    }, this.animSpeed);
  }

  /* ─── SAVE ─── */
  _savePNG() {
    if (!this.canvas.width) return;
    const link = document.createElement('a');
    link.download = `glitch_${Date.now()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NexusGlitchArt;
}
window.NexusGlitchArt = NexusGlitchArt;
