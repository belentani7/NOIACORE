'use strict';
/**
 * NEXUS OS — ASCII Art Converter
 * Convert images to ASCII art with configurable density, charset, and color
 * Pure vanilla JS, no external dependencies
 */

class NexusAsciiArt {
  constructor(container) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.image = null;
    this.width = 120;
    this.charSet = 'standard';
    this.invert = false;
    this.colorMode = false;
    this.textColor = '#ff003c';
    this.bgColor = '#0a0a0f';
    this.contrast = 1;
    this.brightness = 0;
    this.charSets = {
      standard: ' .:-=+*#%@',
      detailed: ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$',
      blocks: ' ░▒▓█',
      simple: ' .:*#',
      binary: ' 01',
      minimal: ' █',
      braille: '⠁⠂⠄⡀⢀⠠⠐⠈⠃⠅⠆⡃⡅⡆⢃⢅⢆⡠⡡⡢⣃⣅⣆⢠⢡⢢⣠⣡⣢⠉⠊⠋⡉⡊⡋⢉⢊⢋⡘⡙⡚⣉⣊⣋⠙⠚⠛⡙⡚⡛⢙⢚⢛⡹⡺⡻⣙⣚⣛⢹⢺⢻⣹⣺⣻⠑⠒⠓⡑⡒⡓⢑⢒⢓⡱⡲⡳⣑⣒⣓⢱⢲⢳⣱⣲⣳⠕⠖⠗⡕⡖⡗⢕⢖⢗⡵⡶⡷⣕⣖⣗⢵⢶⢷⣵⣶⣷⠝⠞⠟⡝⡞⡟⢝⢞⢟⡽⡾⡿⣝⣞⣟⢽⢾⢿⣽⣾⣿'
    };
  }

  render() {
    this._loadCSS();
    this._buildUI();
    this._bindEvents();
  }

  destroy() {
    if (this._root) this._root.remove();
  }

  _loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'js/apps/media/ascii-art.css';
    document.head.appendChild(link);
  }

  _buildUI() {
    this._root = document.createElement('div');
    this._root.className = 'naa-root';
    this._root.innerHTML = `
      <div class="naa-left">
        <div class="naa-preview-area" data-a="previewArea" style="position:relative">
          <div class="naa-empty" data-a="empty">
            <div class="naa-empty-icon">🎨</div>
            <div style="font-size:16px;">Drop an image to convert to ASCII</div>
            <button class="naa-open-btn" data-a="openBtn">Open Image</button>
          </div>
          <pre data-a="output" style="display:none"></pre>
          <div class="naa-drop-overlay" data-a="dropOverlay">Drop image here</div>
        </div>
        <div class="naa-bottom-bar">
          <button class="naa-bar-btn" data-a="regenerateBtn">🔄 Regenerate</button>
          <button class="naa-bar-btn" data-a="copyBtn">📋 Copy</button>
          <div class="naa-bar-spacer"></div>
          <button class="naa-bar-btn primary" data-a="saveTxt">💾 Save .txt</button>
          <button class="naa-bar-btn" data-a="saveHtml">💾 Save .html</button>
        </div>
      </div>
      <div class="naa-right">
        <div class="naa-title">ASCII Art Converter</div>
        <div class="naa-section">Width (characters)</div>
        <div class="naa-row"><label>Columns</label><input type="range" class="naa-slider" data-a="widthSlider" min="30" max="250" value="120"><span class="naa-val" data-a="widthVal">120</span></div>
        <div class="naa-section">Character Set</div>
        <select class="naa-select" data-a="charSelect">
          <option value="standard">Standard ( .:-=+*#%@)</option>
          <option value="detailed">Detailed (70 chars)</option>
          <option value="blocks">Block Elements (░▒▓█)</option>
          <option value="simple">Simple (.:*#)</option>
          <option value="binary">Binary (01)</option>
          <option value="minimal">Minimal ( █)</option>
          <option value="braille">Braille Dots</option>
        </select>
        <div class="naa-section">Adjustments</div>
        <div class="naa-row"><label>Contrast</label><input type="range" class="naa-slider" data-a="contrastSlider" min="50" max="200" value="100"><span class="naa-val" data-a="contrastVal">100%</span></div>
        <div class="naa-row"><label>Bright</label><input type="range" class="naa-slider" data-a="brightnessSlider" min="-50" max="50" value="0"><span class="naa-val" data-a="brightnessVal">0</span></div>
        <div class="naa-section">Display</div>
        <div class="naa-row"><label>Font Size</label><input type="range" class="naa-slider" data-a="fontSlider" min="2" max="14" value="6"><span class="naa-val" data-a="fontVal">6px</span></div>
        <label class="naa-checkbox"><input type="checkbox" data-a="invertCheck"> Invert (dark→light)</label>
        <label class="naa-checkbox"><input type="checkbox" data-a="colorCheck"> Color mode</label>
        <div class="naa-section">Colors</div>
        <div class="naa-row"><label>Text</label><input type="color" class="naa-color-input" data-a="textColorInput" value="#ff003c"><label style="margin-left:8px">BG</label><input type="color" class="naa-color-input" data-a="bgColorInput" value="#0a0a0f"></div>
      </div>
      <input type="file" accept="image/*" style="display:none" data-a="fileInput">`;
    this.container.appendChild(this._root);
    this.els = {};
    this._root.querySelectorAll('[data-a]').forEach(el => { this.els[el.dataset.a] = el; });
  }

  _bindEvents() {
    const e = this.els;
    e.openBtn.onclick = () => e.fileInput.click();
    e.fileInput.onchange = (ev) => { if (ev.target.files[0]) this._loadImage(ev.target.files[0]); };

    // Drag and drop
    const area = e.previewArea;
    area.ondragover = (ev) => { ev.preventDefault(); e.dropOverlay.classList.add('active'); };
    area.ondragleave = () => e.dropOverlay.classList.remove('active');
    area.ondrop = (ev) => {
      ev.preventDefault();
      e.dropOverlay.classList.remove('active');
      const file = ev.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) this._loadImage(file);
    };

    // Controls
    e.widthSlider.oninput = () => { this.width = +e.widthSlider.value; e.widthVal.textContent = this.width; this._convert(); };
    e.charSelect.onchange = () => { this.charSet = e.charSelect.value; this._convert(); };
    e.contrastSlider.oninput = () => { this.contrast = +e.contrastSlider.value / 100; e.contrastVal.textContent = e.contrastSlider.value + '%'; this._convert(); };
    e.brightnessSlider.oninput = () => { this.brightness = +e.brightnessSlider.value; e.brightnessVal.textContent = this.brightness; this._convert(); };
    e.fontSlider.oninput = () => { e.fontVal.textContent = e.fontSlider.value + 'px'; e.output.style.fontSize = e.fontSlider.value + 'px'; };
    e.invertCheck.onchange = () => { this.invert = e.invertCheck.checked; this._convert(); };
    e.colorCheck.onchange = () => { this.colorMode = e.colorCheck.checked; this._convert(); };
    e.textColorInput.oninput = () => { this.textColor = e.textColorInput.value; e.output.style.color = this.textColor; };
    e.bgColorInput.oninput = () => { this.bgColor = e.bgColorInput.value; e.output.style.background = this.bgColor; };

    // Actions
    e.regenerateBtn.onclick = () => this._convert();
    e.copyBtn.onclick = () => this._copyText();
    e.saveTxt.onclick = () => this._saveTxt();
    e.saveHtml.onclick = () => this._saveHtml();
  }

  _loadImage(file) {
    const img = new Image();
    img.onload = () => {
      this.image = img;
      this.els.empty.style.display = 'none';
      this.els.output.style.display = '';
      this._convert();
    };
    img.src = URL.createObjectURL(file);
  }

  _convert() {
    if (!this.image) return;
    const img = this.image;
    const chars = this.charSets[this.charSet] || this.charSets.standard;
    const cols = this.width;
    // Character height ratio (most monospace fonts are ~2:1 aspect)
    const aspectRatio = 0.5;
    const rows = Math.floor(cols * (img.naturalHeight / img.naturalWidth) * aspectRatio);

    // Draw image to offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, cols, rows);
    const imageData = ctx.getImageData(0, 0, cols, rows);
    const data = imageData.data;

    let output;

    if (this.colorMode) {
      // Color ASCII: each character gets its original color
      let html = '';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          let r = data[i], g = data[i + 1], b = data[i + 2];
          // Apply contrast/brightness
          r = Math.max(0, Math.min(255, ((r - 128) * this.contrast + 128) + this.brightness));
          g = Math.max(0, Math.min(255, ((g - 128) * this.contrast + 128) + this.brightness));
          b = Math.max(0, Math.min(255, ((b - 128) * this.contrast + 128) + this.brightness));
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
          let charIdx = this.invert ? Math.floor(brightness * (chars.length - 1)) : Math.floor((1 - brightness) * (chars.length - 1));
          charIdx = Math.max(0, Math.min(chars.length - 1, charIdx));
          const ch = chars[charIdx] === ' ' ? '&nbsp;' : chars[charIdx].replace(/</g, '&lt;');
          html += `<span style="color:rgb(${r|0},${g|0},${b|0})">${ch}</span>`;
        }
        html += '\n';
      }
      this.els.output.innerHTML = html;
      this._lastText = ''; // Can't copy HTML as text meaningfully
    } else {
      let text = '';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          let r = data[i], g = data[i + 1], b = data[i + 2];
          r = Math.max(0, Math.min(255, ((r - 128) * this.contrast + 128) + this.brightness));
          g = Math.max(0, Math.min(255, ((g - 128) * this.contrast + 128) + this.brightness));
          b = Math.max(0, Math.min(255, ((b - 128) * this.contrast + 128) + this.brightness));
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
          let charIdx = this.invert ? Math.floor(brightness * (chars.length - 1)) : Math.floor((1 - brightness) * (chars.length - 1));
          charIdx = Math.max(0, Math.min(chars.length - 1, charIdx));
          text += chars[charIdx];
        }
        text += '\n';
      }
      this.els.output.textContent = text;
      this._lastText = text;
    }

    this.els.output.style.color = this.textColor;
    this.els.output.style.background = this.bgColor;
  }

  async _copyText() {
    if (!this._lastText) return;
    try {
      await navigator.clipboard.writeText(this._lastText);
      const orig = this.els.copyBtn.textContent;
      this.els.copyBtn.textContent = '✓ Copied!';
      setTimeout(() => { this.els.copyBtn.textContent = orig; }, 1500);
    } catch {}
  }

  _saveTxt() {
    if (!this._lastText) return;
    const blob = new Blob([this._lastText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = 'nexus-ascii-art.txt';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  _saveHtml() {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ASCII Art</title><style>body{margin:0;padding:20px;background:${this.bgColor}}pre{font-family:'Courier New',monospace;font-size:${this.els.fontSlider.value}px;line-height:1.1;color:${this.textColor};white-space:pre;}</style></head><body><pre>${this.els.output.innerHTML}</pre></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const link = document.createElement('a');
    link.download = 'nexus-ascii-art.html';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

window.NexusAsciiArt = NexusAsciiArt;
