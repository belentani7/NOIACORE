'use strict';
/**
 * NEXUS OS — Meme Generator
 * Add text to images with templates, drag positioning, export PNG
 * Pure vanilla JS, no external dependencies
 */

class NexusMemeGenerator {
  constructor(container) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.canvas = null;
    this.ctx = null;
    this.image = null;
    this.topText = '';
    this.bottomText = '';
    this.customTexts = [];
    this.fontSize = 48;
    this.fontFamily = 'Impact, sans-serif';
    this.textColor = '#ffffff';
    this.strokeColor = '#000000';
    this.strokeWidth = 3;
    this.templates = [
      { name: 'Drake', top: 'Nah that ain\'t it', bottom: 'Oh yeah that\'s the stuff' },
      { name: 'Distracted BF', top: 'Current project', bottom: 'New shiny framework' },
      { name: 'This Is Fine', top: 'Everything is fine', bottom: 'Server on fire' },
      { name: 'Expanding Brain', top: 'Using console.log', bottom: 'Using debugger' },
      { name: 'Change My Mind', top: 'Tabs > Spaces', bottom: 'Change my mind' },
      { name: 'Galaxy Brain', top: 'Writing tests', bottom: 'AI writes the tests' },
      { name: 'Two Buttons', top: 'Ship it now', bottom: 'Add more features' },
      { name: 'Custom', top: '', bottom: '' }
    ];
  }

  render() {
    this._loadCSS();
    this._buildUI();
    this._bindEvents();
  }

  destroy() {
    if (this._styleEl) this._styleEl.remove();
    if (this._root) this._root.remove();
  }

  _loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'js/apps/media/meme-generator.css';
    document.head.appendChild(link);
  }

  _buildUI() {
    this._root = document.createElement('div');
    this._root.className = 'nmg-root';
    this._root.innerHTML = `
      <div class="nmg-canvas-area">
        <div class="nmg-canvas-wrap" data-m="canvasWrap">
          <div class="nmg-empty" data-m="empty">
            <div class="nmg-empty-icon">🖼️</div>
            <div style="font-size:16px;">Drop an image or pick a template</div>
            <button class="nmg-open-btn" data-m="openBtn">Open Image</button>
          </div>
          <canvas data-m="canvas" style="display:none"></canvas>
          <div class="nmg-drop-overlay" data-m="dropOverlay">Drop image here</div>
        </div>
        <div class="nmg-bottom-bar">
          <button class="nmg-bar-btn" data-m="resetBtn">↺ Reset Text</button>
          <button class="nmg-bar-btn" data-m="flipBtn">↕ Flip Text</button>
          <div class="nmg-bar-spacer"></div>
          <button class="nmg-bar-btn primary" data-m="saveBtn">💾 Save PNG</button>
        </div>
      </div>
      <div class="nmg-sidebar">
        <div class="nmg-sidebar-header">Meme Generator</div>
        <div class="nmg-sidebar-scroll">
          <div class="nmg-section-title">Template Text</div>
          <select class="nmg-select" data-m="templateSelect">
            ${this.templates.map((t, i) => `<option value="${i}">${t.name}</option>`).join('')}
          </select>
          <div class="nmg-section-title">Top Text</div>
          <input class="nmg-text-input" data-m="topInput" placeholder="Top text..." value="">
          <div class="nmg-section-title">Bottom Text</div>
          <input class="nmg-text-input" data-m="bottomInput" placeholder="Bottom text..." value="">
          <div class="nmg-section-title">Extra Text Overlay</div>
          <input class="nmg-text-input" data-m="extraInput" placeholder="Drag on canvas to place...">
          <div class="nmg-section-title">Font</div>
          <select class="nmg-select" data-m="fontSelect">
            <option value="Impact, sans-serif">Impact (Classic)</option>
            <option value="Arial Black, sans-serif">Arial Black</option>
            <option value="Comic Sans MS, cursive">Comic Sans</option>
            <option value="Courier New, monospace">Courier New</option>
            <option value="'Segoe UI', sans-serif">Segoe UI</option>
          </select>
          <div class="nmg-row"><label>Size</label><input type="range" class="nmg-slider" data-m="sizeSlider" min="16" max="120" value="48"><span style="font-size:11px;color:#ff2d6b;width:30px" data-m="sizeVal">48</span></div>
          <div class="nmg-row"><label>Stroke</label><input type="range" class="nmg-slider" data-m="strokeSlider" min="0" max="8" value="3"><span style="font-size:11px;color:#ff2d6b;width:20px" data-m="strokeVal">3</span></div>
          <div class="nmg-section-title">Colors</div>
          <div class="nmg-row"><label>Text</label><input type="color" class="nmg-color" data-m="textColor" value="#ffffff"><label style="margin-left:8px">Stroke</label><input type="color" class="nmg-color" data-m="strokeColor" value="#000000"></div>
          <div class="nmg-section-title">Quick Templates</div>
          <div class="nmg-template-grid">
            ${this.templates.map((t, i) => `<div class="nmg-template-btn" data-tpl="${i}">${t.name}</div>`).join('')}
          </div>
        </div>
      </div>
      <input type="file" accept="image/*" style="display:none" data-m="fileInput">`;
    this.container.appendChild(this._root);
    this.els = {};
    this._root.querySelectorAll('[data-m]').forEach(el => { this.els[el.dataset.m] = el; });
    this.canvas = this.els.canvas;
    this.ctx = this.canvas.getContext('2d');
  }

  _bindEvents() {
    const e = this.els;
    e.openBtn.onclick = () => e.fileInput.click();
    e.fileInput.onchange = (ev) => { if (ev.target.files[0]) this._loadImage(ev.target.files[0]); };

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

    // Text inputs
    e.topInput.oninput = () => { this.topText = e.topInput.value; this._render(); };
    e.bottomInput.oninput = () => { this.bottomText = e.bottomInput.value; this._render(); };
    e.extraInput.onkeydown = (ev) => {
      if (ev.key === 'Enter' && e.extraInput.value.trim()) {
        this.customTexts.push({ text: e.extraInput.value.trim(), x: this.canvas.width / 2, y: this.canvas.height / 2, dragging: false });
        e.extraInput.value = '';
        this._render();
      }
    };

    // Font
    e.fontSelect.onchange = () => { this.fontFamily = e.fontSelect.value; this._render(); };
    e.sizeSlider.oninput = () => { this.fontSize = +e.sizeSlider.value; e.sizeVal.textContent = this.fontSize; this._render(); };
    e.strokeSlider.oninput = () => { this.strokeWidth = +e.strokeSlider.value; e.strokeVal.textContent = this.strokeWidth; this._render(); };
    e.textColor.oninput = () => { this.textColor = e.textColor.value; this._render(); };
    e.strokeColor.oninput = () => { this.strokeColor = e.strokeColor.value; this._render(); };

    // Templates
    e.templateSelect.onchange = () => this._applyTemplate(+e.templateSelect.value);
    this._root.querySelectorAll('.nmg-template-btn').forEach(btn => {
      btn.onclick = () => this._applyTemplate(+btn.dataset.tpl);
    });

    // Buttons
    e.resetBtn.onclick = () => { this.topText = ''; this.bottomText = ''; this.customTexts = []; e.topInput.value = ''; e.bottomInput.value = ''; this._render(); };
    e.flipBtn.onclick = () => { [this.topText, this.bottomText] = [this.bottomText, this.topText]; e.topInput.value = this.topText; e.bottomInput.value = this.bottomText; this._render(); };
    e.saveBtn.onclick = () => this._savePNG();

    // Canvas drag for custom texts
    let dragIdx = -1, dragOff = { x: 0, y: 0 };
    this.canvas.onmousedown = (ev) => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = this.canvas.width / rect.width;
      const sy = this.canvas.height / rect.height;
      const mx = (ev.clientX - rect.left) * sx;
      const my = (ev.clientY - rect.top) * sy;
      for (let i = this.customTexts.length - 1; i >= 0; i--) {
        const t = this.customTexts[i];
        this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        const w = this.ctx.measureText(t.text).width;
        if (mx > t.x - w / 2 - 10 && mx < t.x + w / 2 + 10 && my > t.y - this.fontSize && my < t.y + 10) {
          dragIdx = i; dragOff = { x: mx - t.x, y: my - t.y }; break;
        }
      }
    };
    this.canvas.onmousemove = (ev) => {
      if (dragIdx < 0) return;
      const rect = this.canvas.getBoundingClientRect();
      const sx = this.canvas.width / rect.width;
      const sy = this.canvas.height / rect.height;
      this.customTexts[dragIdx].x = (ev.clientX - rect.left) * sx - dragOff.x;
      this.customTexts[dragIdx].y = (ev.clientY - rect.top) * sy - dragOff.y;
      this._render();
    };
    this.canvas.onmouseup = () => { dragIdx = -1; };
    this.canvas.ondblclick = (ev) => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = this.canvas.width / rect.width;
      const sy = this.canvas.height / rect.height;
      const mx = (ev.clientX - rect.left) * sx;
      const my = (ev.clientY - rect.top) * sy;
      for (let i = this.customTexts.length - 1; i >= 0; i--) {
        const t = this.customTexts[i];
        this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        const w = this.ctx.measureText(t.text).width;
        if (mx > t.x - w / 2 - 10 && mx < t.x + w / 2 + 10 && my > t.y - this.fontSize && my < t.y + 10) {
          this.customTexts.splice(i, 1); this._render(); break;
        }
      }
    };
  }

  _loadImage(file) {
    const img = new Image();
    img.onload = () => {
      this.image = img;
      const maxDim = 800;
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.floor(w * scale);
        h = Math.floor(h * scale);
      }
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.display = '';
      this.els.empty.style.display = 'none';
      this._render();
    };
    img.src = URL.createObjectURL(file);
  }

  _applyTemplate(idx) {
    const tpl = this.templates[idx];
    this.topText = tpl.top;
    this.bottomText = tpl.bottom;
    this.els.topInput.value = tpl.top;
    this.els.bottomInput.value = tpl.bottom;
    this.els.templateSelect.value = idx;
    if (!this.image) this._createBlankCanvas();
    this._render();
  }

  _createBlankCanvas() {
    this.canvas.width = 600;
    this.canvas.height = 600;
    this.image = null;
    this.canvas.style.display = '';
    this.els.empty.style.display = 'none';
  }

  _render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Draw image or blank
    if (this.image) {
      ctx.drawImage(this.image, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, w, h);
    }

    const font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.lineWidth = this.strokeWidth;
    ctx.lineJoin = 'round';

    // Top text
    if (this.topText) {
      this._drawMemeText(ctx, this.topText, w / 2, this.fontSize + 10, w - 20);
    }

    // Bottom text
    if (this.bottomText) {
      this._drawMemeText(ctx, this.bottomText, w / 2, h - 20, w - 20);
    }

    // Custom overlay texts
    for (const t of this.customTexts) {
      this._drawMemeText(ctx, t.text, t.x, t.y, w - 20);
    }
  }

  _drawMemeText(ctx, text, x, y, maxWidth) {
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    // Word wrap
    const words = text.toUpperCase().split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      const test = currentLine ? currentLine + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = this.fontSize * 1.2;
    const startY = y;

    for (let i = 0; i < lines.length; i++) {
      const ly = startY + i * lineHeight;
      if (this.strokeWidth > 0) {
        ctx.strokeStyle = this.strokeColor;
        ctx.strokeText(lines[i], x, ly);
      }
      ctx.fillStyle = this.textColor;
      ctx.fillText(lines[i], x, ly);
    }
  }

  _savePNG() {
    const link = document.createElement('a');
    link.download = 'nexus-meme.png';
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}

window.NexusMemeGenerator = NexusMemeGenerator;
