'use strict';
/**
 * NEXUS OS — Gradient Maker
 * Create CSS gradients with live preview, code output, and presets
 * Pure vanilla JS, no external dependencies
 */

class NexusGradientMaker {
  constructor(container) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.type = 'linear'; // linear, radial, conic
    this.angle = 135;
    this.stops = [
      { color: '#ff003c', position: 0 },
      { color: '#9966ff', position: 50 },
      { color: '#00ccff', position: 100 }
    ];
    this.radialShape = 'circle';
    this.conicFrom = 0;
    this.presets = [
      { stops: [{ color: '#ff003c', position: 0 }, { color: '#ff6600', position: 100 }], bg: 'linear-gradient(135deg, #ff003c, #ff6600)' },
      { stops: [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }], bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
      { stops: [{ color: '#f093fb', position: 0 }, { color: '#f5576c', position: 100 }], bg: 'linear-gradient(135deg, #f093fb, #f5576c)' },
      { stops: [{ color: '#4facfe', position: 0 }, { color: '#00f2fe', position: 100 }], bg: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
      { stops: [{ color: '#43e97b', position: 0 }, { color: '#38f9d7', position: 100 }], bg: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
      { stops: [{ color: '#fa709a', position: 0 }, { color: '#fee140', position: 100 }], bg: 'linear-gradient(135deg, #fa709a, #fee140)' },
      { stops: [{ color: '#a18cd1', position: 0 }, { color: '#fbc2eb', position: 100 }], bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
      { stops: [{ color: '#ff0000', position: 0 }, { color: '#ff7700', position: 17 }, { color: '#ffff00', position: 33 }, { color: '#00ff00', position: 50 }, { color: '#00ffff', position: 67 }, { color: '#0000ff', position: 83 }, { color: '#ff00ff', position: 100 }], bg: 'linear-gradient(90deg, #f00, #ff7700, #ff0, #0f0, #0ff, #00f, #f0f)' },
      { stops: [{ color: '#0c0c0c', position: 0 }, { color: '#1a1a2e', position: 50 }, { color: '#16213e', position: 100 }], bg: 'linear-gradient(135deg, #0c0c0c, #1a1a2e, #16213e)' },
      { stops: [{ color: '#ee9ca7', position: 0 }, { color: '#ffdde1', position: 100 }], bg: 'linear-gradient(135deg, #ee9ca7, #ffdde1)' },
      { stops: [{ color: '#2193b0', position: 0 }, { color: '#6dd5ed', position: 100 }], bg: 'linear-gradient(135deg, #2193b0, #6dd5ed)' },
      { stops: [{ color: '#cc2b5e', position: 0 }, { color: '#753a88', position: 100 }], bg: 'linear-gradient(135deg, #cc2b5e, #753a88)' }
    ];
  }

  render() {
    this._loadCSS();
    this._buildUI();
    this._bindEvents();
    this._update();
  }

  destroy() {
    if (this._root) this._root.remove();
  }

  _loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'js/apps/media/gradient-maker.css';
    document.head.appendChild(link);
  }

  _buildUI() {
    this._root = document.createElement('div');
    this._root.className = 'ngr-root';
    this._root.innerHTML = `
      <div class="ngr-left">
        <div class="ngr-preview" data-g="preview">
          <div class="ngr-preview-inner" data-g="previewInner"></div>
          <button class="ngr-copy-btn" data-g="copyCodeBtn">📋 Copy CSS</button>
        </div>
        <div class="ngr-code-area" style="position:relative">
          <div class="ngr-code" data-g="codeOutput"></div>
        </div>
      </div>
      <div class="ngr-right">
        <div class="ngr-title">Gradient Maker</div>
        <div class="ngr-section">Type</div>
        <div class="ngr-type-row">
          <div class="ngr-type-btn active" data-type="linear">Linear</div>
          <div class="ngr-type-btn" data-type="radial">Radial</div>
          <div class="ngr-type-btn" data-type="conic">Conic</div>
        </div>
        <div class="ngr-row" data-g="angleRow"><label>Angle</label><input type="range" class="ngr-slider" data-g="angleSlider" min="0" max="360" value="135"><span class="ngr-val" data-g="angleVal">135°</span></div>
        <div class="ngr-row" data-g="shapeRow" style="display:none"><label>Shape</label><select class="ngr-select" data-g="shapeSelect" style="flex:1"><option value="circle">Circle</option><option value="ellipse">Ellipse</option></select></div>
        <div class="ngr-section">Color Stops</div>
        <div class="ngr-stop-list" data-g="stopList"></div>
        <button class="ngr-add-stop" data-g="addStopBtn">+ Add Color Stop</button>
        <div class="ngr-section">Presets</div>
        <div class="ngr-preset-grid" data-g="presetGrid"></div>
        <div class="ngr-section" style="margin-top:12px">Actions</div>
        <div class="ngr-btn-row">
          <button class="ngr-btn" data-g="randomBtn">🎲 Random</button>
          <button class="ngr-btn" data-g="reverseBtn">↔ Reverse</button>
        </div>
        <button class="ngr-btn" data-g="downloadBtn" style="margin-top:6px">💾 Download PNG</button>
      </div>`;
    this.container.appendChild(this._root);
    this.els = {};
    this._root.querySelectorAll('[data-g]').forEach(el => { this.els[el.dataset.g] = el; });
    this._renderStops();
    this._renderPresets();
  }

  _bindEvents() {
    const e = this.els;

    // Type buttons
    this._root.querySelectorAll('.ngr-type-btn').forEach(btn => {
      btn.onclick = () => {
        this.type = btn.dataset.type;
        this._root.querySelectorAll('.ngr-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === this.type));
        e.angleRow.style.display = this.type === 'linear' ? '' : 'none';
        e.shapeRow.style.display = this.type === 'radial' ? '' : 'none';
        this._update();
      };
    });

    // Angle
    e.angleSlider.oninput = () => { this.angle = +e.angleSlider.value; e.angleVal.textContent = this.angle + '°'; this._update(); };
    e.shapeSelect.onchange = () => { this.radialShape = e.shapeSelect.value; this._update(); };

    // Add stop
    e.addStopBtn.onclick = () => {
      const midPos = this.stops.length > 1 ? Math.round((this.stops[this.stops.length - 2].position + this.stops[this.stops.length - 1].position) / 2) : 50;
      this.stops.push({ color: this._randomColor(), position: midPos });
      this.stops.sort((a, b) => a.position - b.position);
      this._renderStops();
      this._update();
    };

    // Random / Reverse / Download
    e.randomBtn.onclick = () => this._randomize();
    e.reverseBtn.onclick = () => { this.stops.forEach(s => s.position = 100 - s.position); this.stops.sort((a, b) => a.position - b.position); this._renderStops(); this._update(); };
    e.downloadBtn.onclick = () => this._downloadPNG();
    e.copyCodeBtn.onclick = () => this._copyCode();

    // Presets
    this._root.querySelectorAll('.ngr-preset').forEach(p => {
      p.onclick = () => {
        const idx = +p.dataset.idx;
        this.stops = JSON.parse(JSON.stringify(this.presets[idx].stops));
        this._renderStops();
        this._update();
      };
    });
  }

  _renderStops() {
    const list = this.els.stopList;
    list.innerHTML = '';
    this.stops.forEach((stop, idx) => {
      const div = document.createElement('div');
      div.className = 'ngr-stop-item';
      div.innerHTML = `
        <input type="color" class="ngr-stop-color" value="${stop.color}" data-idx="${idx}">
        <input class="ngr-stop-pct" type="number" min="0" max="100" value="${stop.position}" data-idx="${idx}">
        <span style="font-size:10px;color:#666">%</span>
        ${this.stops.length > 2 ? `<button class="ngr-stop-del" data-idx="${idx}">✕</button>` : ''}`;
      div.querySelector('.ngr-stop-color').oninput = (e) => { this.stops[idx].color = e.target.value; this._update(); };
      div.querySelector('.ngr-stop-pct').onchange = (e) => { this.stops[idx].position = Math.max(0, Math.min(100, +e.target.value)); this.stops.sort((a, b) => a.position - b.position); this._renderStops(); this._update(); };
      const del = div.querySelector('.ngr-stop-del');
      if (del) del.onclick = () => { this.stops.splice(idx, 1); this._renderStops(); this._update(); };
      list.appendChild(div);
    });
  }

  _renderPresets() {
    const grid = this.els.presetGrid;
    grid.innerHTML = '';
    this.presets.forEach((preset, idx) => {
      const div = document.createElement('div');
      div.className = 'ngr-preset';
      div.style.background = preset.bg;
      div.dataset.idx = idx;
      grid.appendChild(div);
    });
  }

  _generateCSS() {
    const stops = this.stops.map(s => `${s.color} ${s.position}%`).join(', ');
    if (this.type === 'linear') return `linear-gradient(${this.angle}deg, ${stops})`;
    if (this.type === 'radial') return `radial-gradient(${this.radialShape}, ${stops})`;
    if (this.type === 'conic') return `conic-gradient(from ${this.angle}deg, ${stops})`;
    return '';
  }

  _update() {
    const css = this._generateCSS();
    this.els.previewInner.style.background = css;
    const fullCode = `background: ${css};`;
    this.els.codeOutput.textContent = fullCode;
    this._lastCSS = fullCode;
  }

  _randomize() {
    const count = 2 + Math.floor(Math.random() * 4);
    this.stops = [];
    for (let i = 0; i < count; i++) {
      this.stops.push({ color: this._randomColor(), position: Math.round((i / (count - 1)) * 100) });
    }
    this.angle = Math.floor(Math.random() * 360);
    this.els.angleSlider.value = this.angle;
    this.els.angleVal.textContent = this.angle + '°';
    this._renderStops();
    this._update();
  }

  _randomColor() {
    const h = Math.floor(Math.random() * 360);
    const s = 50 + Math.floor(Math.random() * 50);
    const l = 30 + Math.floor(Math.random() * 50);
    return this._hslToHex(h, s, l);
  }

  _hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  async _copyCode() {
    if (!this._lastCSS) return;
    try {
      await navigator.clipboard.writeText(this._lastCSS);
      const orig = this.els.copyCodeBtn.textContent;
      this.els.copyCodeBtn.textContent = '✓ Copied!';
      setTimeout(() => { this.els.copyCodeBtn.textContent = orig; }, 1500);
    } catch {}
  }

  _downloadPNG() {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    let grad;
    if (this.type === 'linear') {
      const angle = (this.angle - 90) * Math.PI / 180;
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const len = Math.max(canvas.width, canvas.height);
      grad = ctx.createLinearGradient(
        cx + Math.cos(angle + Math.PI) * len / 2,
        cy + Math.sin(angle + Math.PI) * len / 2,
        cx + Math.cos(angle) * len / 2,
        cy + Math.sin(angle) * len / 2
      );
    } else if (this.type === 'radial') {
      grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2);
    } else {
      // Conic not natively supported — approximate with linear
      grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    }
    this.stops.forEach(s => grad.addColorStop(s.position / 100, s.color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const link = document.createElement('a');
    link.download = 'nexus-gradient.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}

window.NexusGradientMaker = NexusGradientMaker;
