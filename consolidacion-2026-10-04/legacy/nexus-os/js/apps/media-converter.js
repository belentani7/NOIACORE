/**
 * NEXUS OS — Media Converter
 * Format conversion tool with neon glassmorphism UI
 * Pure vanilla JS, uses Canvas API for image conversion
 */

class NexusMediaConverter {
  constructor(container) {
    this.container = typeof container === 'string'
      ? document.querySelector(container) : container;
    this.files = [];
    this.convertedFiles = [];
    this.isConverting = false;
    this.currentFileIndex = -1;

    this.settings = {
      targetFormat: 'png',  // png | jpeg | webp | bmp
      quality: 90,          // 1-100 for JPEG/WebP
      maxWidth: 0,          // 0 = no resize
      maxHeight: 0
    };

    this.supportedFormats = {
      'image/png': { ext: 'png', label: 'PNG' },
      'image/jpeg': { ext: 'jpg', label: 'JPEG' },
      'image/webp': { ext: 'webp', label: 'WebP' },
      'image/bmp': { ext: 'bmp', label: 'BMP' }
    };
  }

  render() {
    this.container.innerHTML = '';
    this._injectStyles();
    this._buildUI();
    this._bindEvents();
  }

  destroy() {
    this.files = [];
    this.convertedFiles = [];
    this.container.innerHTML = '';
  }

  _injectStyles() {
    if (document.getElementById('nexus-media-converter-styles')) return;
    const style = document.createElement('style');
    style.id = 'nexus-media-converter-styles';
    style.textContent = `
      .nmc-root {
        display: flex; flex-direction: column; height: 100%; background: #0a0a0f;
        font-family: 'Segoe UI', system-ui, sans-serif; color: #e0e0e0;
        overflow: hidden;
      }
      .nmc-header {
        padding: 16px 20px; background: rgba(15,15,25,0.95);
        border-bottom: 1px solid rgba(255,0,60,0.15);
      }
      .nmc-title { font-size: 18px; font-weight: 600; color: #ff2d6b; }
      .nmc-subtitle { font-size: 12px; color: #666; margin-top: 2px; }

      .nmc-main {
        flex: 1; display: flex; gap: 20px; padding: 20px; overflow: hidden;
      }
      .nmc-panel {
        flex: 1; background: rgba(15,15,25,0.8); backdrop-filter: blur(12px);
        border: 1px solid rgba(255,0,60,0.15); border-radius: 12px;
        padding: 16px; display: flex; flex-direction: column; overflow: hidden;
      }
      .nmc-panel-title {
        font-size: 14px; font-weight: 600; color: #ff2d6b; margin-bottom: 12px;
        padding-bottom: 8px; border-bottom: 1px solid rgba(255,0,60,0.1);
      }

      .nmc-drop-zone {
        border: 2px dashed rgba(255,0,60,0.2); border-radius: 12px;
        padding: 30px; text-align: center; cursor: pointer;
        transition: all 0.2s; margin-bottom: 12px;
      }
      .nmc-drop-zone:hover, .nmc-drop-zone.dragover {
        border-color: #ff003c; background: rgba(255,0,60,0.05);
      }
      .nmc-drop-icon { font-size: 36px; opacity: 0.4; margin-bottom: 8px; }
      .nmc-drop-text { font-size: 14px; color: #888; }
      .nmc-drop-hint { font-size: 12px; color: #555; margin-top: 4px; }

      .nmc-file-list {
        flex: 1; overflow-y: auto; min-height: 0;
      }
      .nmc-file-list::-webkit-scrollbar { width: 4px; }
      .nmc-file-list::-webkit-scrollbar-thumb { background: #ff003c33; border-radius: 2px; }

      .nmc-file-item {
        display: flex; align-items: center; gap: 10px; padding: 10px;
        background: rgba(255,255,255,0.02); border-radius: 8px;
        margin-bottom: 6px; border: 1px solid rgba(255,0,60,0.05);
        transition: all 0.2s;
      }
      .nmc-file-item:hover { border-color: rgba(255,0,60,0.15); }
      .nmc-file-thumb {
        width: 50px; height: 50px; border-radius: 6px; object-fit: cover;
        background: #1a1a2e; flex-shrink: 0;
      }
      .nmc-file-info { flex: 1; min-width: 0; }
      .nmc-file-name {
        font-size: 12px; color: #ddd; white-space: nowrap;
        overflow: hidden; text-overflow: ellipsis;
      }
      .nmc-file-meta { font-size: 11px; color: #666; margin-top: 2px; }
      .nmc-file-remove {
        background: none; border: none; color: #ff003c55; cursor: pointer;
        font-size: 16px; padding: 4px; transition: color 0.2s;
      }
      .nmc-file-remove:hover { color: #ff003c; }

      .nmc-settings-group { margin-bottom: 14px; }
      .nmc-settings-label {
        font-size: 12px; color: #888; margin-bottom: 6px; display: block;
      }
      .nmc-select {
        width: 100%; background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,0,60,0.15); color: #ccc;
        padding: 8px 12px; border-radius: 8px; font-size: 13px;
        outline: none; cursor: pointer;
      }
      .nmc-select:focus { border-color: #ff003c; }
      .nmc-select option { background: #1a1a2e; }

      .nmc-slider-row { display: flex; align-items: center; gap: 10px; }
      .nmc-slider {
        flex: 1; -webkit-appearance: none; height: 4px;
        background: rgba(255,255,255,0.1); border-radius: 2px; outline: none;
      }
      .nmc-slider::-webkit-slider-thumb {
        -webkit-appearance: none; width: 14px; height: 14px;
        background: #ff003c; border-radius: 50%; cursor: pointer;
        box-shadow: 0 0 6px #ff003c;
      }
      .nmc-slider-val {
        font-size: 13px; color: #ff2d6b; min-width: 40px; text-align: right;
      }

      .nmc-action-row {
        display: flex; gap: 10px; margin-top: 12px;
        padding-top: 12px; border-top: 1px solid rgba(255,0,60,0.1);
      }
      .nmc-btn {
        flex: 1; padding: 10px 16px; border-radius: 8px; font-size: 13px;
        cursor: pointer; transition: all 0.2s; text-align: center; border: 1px solid;
      }
      .nmc-btn-primary {
        background: rgba(255,0,60,0.2); border-color: rgba(255,0,60,0.5);
        color: #ff003c;
      }
      .nmc-btn-primary:hover {
        background: rgba(255,0,60,0.3); box-shadow: 0 0 15px rgba(255,0,60,0.15);
      }
      .nmc-btn-secondary {
        background: rgba(255,255,255,0.05); border-color: rgba(255,0,60,0.15);
        color: #ccc;
      }
      .nmc-btn-secondary:hover {
        background: rgba(255,0,60,0.1); color: #ff003c;
      }
      .nmc-btn:disabled { opacity: 0.4; cursor: not-allowed; }

      .nmc-progress-wrap {
        height: 6px; background: rgba(255,255,255,0.05);
        border-radius: 3px; overflow: hidden; margin-top: 10px;
        display: none;
      }
      .nmc-progress-wrap.active { display: block; }
      .nmc-progress-bar {
        height: 100%; background: linear-gradient(90deg, #ff003c, #ff2d6b);
        border-radius: 3px; transition: width 0.3s; width: 0;
        box-shadow: 0 0 10px #ff003c;
      }
      .nmc-progress-text {
        font-size: 11px; color: #888; text-align: center; margin-top: 4px;
      }

      /* Results panel */
      .nmc-result-item {
        display: flex; align-items: center; gap: 10px; padding: 10px;
        background: rgba(255,255,255,0.02); border-radius: 8px;
        margin-bottom: 6px; border: 1px solid rgba(255,0,60,0.05);
      }
      .nmc-result-thumb {
        width: 50px; height: 50px; border-radius: 6px; object-fit: cover;
        background: #1a1a2e; flex-shrink: 0;
      }
      .nmc-result-info { flex: 1; min-width: 0; }
      .nmc-result-name {
        font-size: 12px; color: #ddd; white-space: nowrap;
        overflow: hidden; text-overflow: ellipsis;
      }
      .nmc-result-meta { font-size: 11px; color: #666; margin-top: 2px; }
      .nmc-result-savings { font-size: 11px; margin-top: 2px; }
      .nmc-result-savings.smaller { color: #4caf50; }
      .nmc-result-savings.larger { color: #ff9800; }
      .nmc-result-download {
        background: rgba(255,0,60,0.15); border: 1px solid rgba(255,0,60,0.3);
        color: #ff003c; padding: 5px 12px; border-radius: 6px;
        cursor: pointer; font-size: 11px; transition: all 0.2s;
      }
      .nmc-result-download:hover { background: rgba(255,0,60,0.25); }

      .nmc-download-all {
        margin-top: 10px; padding-top: 10px;
        border-top: 1px solid rgba(255,0,60,0.1);
      }

      .nmc-empty-results {
        text-align: center; color: #444; padding: 30px; font-size: 13px;
      }
      .nmc-empty-icon { font-size: 36px; opacity: 0.3; margin-bottom: 8px; }

      @media (max-width: 768px) {
        .nmc-main { flex-direction: column; overflow-y: auto; }
      }
    `;
    document.head.appendChild(style);
  }

  _buildUI() {
    const root = document.createElement('div');
    root.className = 'nmc-root';
    root.innerHTML = `
      <div class="nmc-header">
        <div class="nmc-title">🔄 Media Converter</div>
        <div class="nmc-subtitle">Convert images between PNG, JPEG, WebP, and BMP formats</div>
      </div>

      <div class="nmc-main">
        <div class="nmc-panel">
          <div class="nmc-panel-title">Source Files</div>

          <div class="nmc-drop-zone" data-nmc="dropZone">
            <div class="nmc-drop-icon">📁</div>
            <div class="nmc-drop-text">Drop images here or click to browse</div>
            <div class="nmc-drop-hint">Supports PNG, JPEG, WebP, BMP</div>
          </div>

          <div class="nmc-file-list" data-nmc="fileList"></div>

          <div class="nmc-action-row">
            <button class="nmc-btn nmc-btn-secondary" data-nmc="clearBtn">Clear All</button>
          </div>
        </div>

        <div class="nmc-panel">
          <div class="nmc-panel-title">Conversion Settings</div>

          <div class="nmc-settings-group">
            <label class="nmc-settings-label">Target Format</label>
            <select class="nmc-select" data-nmc="formatSelect">
              <option value="png">PNG (Lossless)</option>
              <option value="jpeg">JPEG (Lossy)</option>
              <option value="webp">WebP (Lossy/Lossless)</option>
              <option value="bmp">BMP (Uncompressed)</option>
            </select>
          </div>

          <div class="nmc-settings-group" data-nmc="qualityGroup">
            <label class="nmc-settings-label">Quality</label>
            <div class="nmc-slider-row">
              <input type="range" class="nmc-slider" min="1" max="100" value="90" data-nmc="qualitySlider">
              <span class="nmc-slider-val" data-nmc="qualityVal">90%</span>
            </div>
          </div>

          <div class="nmc-settings-group">
            <label class="nmc-settings-label">Max Width (0 = no resize)</label>
            <div class="nmc-slider-row">
              <input type="range" class="nmc-slider" min="0" max="4096" step="64" value="0" data-nmc="maxWidthSlider">
              <span class="nmc-slider-val" data-nmc="maxWidthVal">0</span>
            </div>
          </div>

          <div class="nmc-settings-group">
            <label class="nmc-settings-label">Max Height (0 = no resize)</label>
            <div class="nmc-slider-row">
              <input type="range" class="nmc-slider" min="0" max="4096" step="64" value="0" data-nmc="maxHeightSlider">
              <span class="nmc-slider-val" data-nmc="maxHeightVal">0</span>
            </div>
          </div>

          <div class="nmc-progress-wrap" data-nmc="progressWrap">
            <div class="nmc-progress-bar" data-nmc="progressBar"></div>
          </div>
          <div class="nmc-progress-text" data-nmc="progressText"></div>

          <div class="nmc-action-row">
            <button class="nmc-btn nmc-btn-primary" data-nmc="convertBtn" disabled>
              ⚡ Convert All
            </button>
          </div>
        </div>

        <div class="nmc-panel">
          <div class="nmc-panel-title">Results</div>
          <div class="nmc-file-list" data-nmc="resultList">
            <div class="nmc-empty-results" data-nmc="emptyResults">
              <div class="nmc-empty-icon">📦</div>
              <div>Converted files will appear here</div>
            </div>
          </div>
          <div class="nmc-download-all" data-nmc="downloadAllWrap" style="display:none">
            <button class="nmc-btn nmc-btn-primary" data-nmc="downloadAllBtn" style="width:100%">
              💾 Download All
            </button>
          </div>
        </div>
      </div>

      <input type="file" accept="image/*" multiple style="display:none" data-nmc="fileInput">
    `;
    this.container.appendChild(root);
    this.root = root;

    this.els = {};
    root.querySelectorAll('[data-nmc]').forEach(el => {
      this.els[el.dataset.nmc] = el;
    });
  }

  _bindEvents() {
    const e = this.els;

    // File input
    e.dropZone.onclick = () => e.fileInput.click();
    e.fileInput.onchange = (ev) => this._addFiles(ev.target.files);
    e.clearBtn.onclick = () => this._clearFiles();

    // Drag and drop
    const dz = e.dropZone;
    dz.ondragover = (ev) => { ev.preventDefault(); dz.classList.add('dragover'); };
    dz.ondragleave = () => dz.classList.remove('dragover');
    dz.ondrop = (ev) => {
      ev.preventDefault();
      dz.classList.remove('dragover');
      this._addFiles(ev.dataTransfer.files);
    };

    // Settings
    e.formatSelect.onchange = (ev) => {
      this.settings.targetFormat = ev.target.value;
      const showQuality = ev.target.value === 'jpeg' || ev.target.value === 'webp';
      e.qualityGroup.style.display = showQuality ? '' : 'none';
    };
    e.qualitySlider.oninput = (ev) => {
      this.settings.quality = parseInt(ev.target.value);
      e.qualityVal.textContent = ev.target.value + '%';
    };
    e.maxWidthSlider.oninput = (ev) => {
      this.settings.maxWidth = parseInt(ev.target.value);
      e.maxWidthVal.textContent = ev.target.value === '0' ? 'Auto' : ev.target.value;
    };
    e.maxHeightSlider.oninput = (ev) => {
      this.settings.maxHeight = parseInt(ev.target.value);
      e.maxHeightVal.textContent = ev.target.value === '0' ? 'Auto' : ev.target.value;
    };

    // Convert
    e.convertBtn.onclick = () => this._convertAll();
    e.downloadAllBtn.onclick = () => this._downloadAll();

    // Initial quality group visibility
    e.qualityGroup.style.display = '';
  }

  _addFiles(fileList) {
    const imageFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    imageFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      this.files.push({ name: file.name, size: file.size, type: file.type, url, file });
    });
    this._renderFileList();
    this.els.convertBtn.disabled = this.files.length === 0;
  }

  _clearFiles() {
    this.files.forEach(f => URL.revokeObjectURL(f.url));
    this.files = [];
    this._renderFileList();
    this.els.convertBtn.disabled = true;
  }

  _renderFileList() {
    const list = this.els.fileList;
    list.innerHTML = '';
    this.files.forEach((file, idx) => {
      const div = document.createElement('div');
      div.className = 'nmc-file-item';
      div.innerHTML = `
        <img class="nmc-file-thumb" src="${file.url}" alt="">
        <div class="nmc-file-info">
          <div class="nmc-file-name" title="${this._esc(file.name)}">${this._esc(file.name)}</div>
          <div class="nmc-file-meta">${this._formatSize(file.size)} · ${file.type.split('/')[1].toUpperCase()}</div>
        </div>
        <button class="nmc-file-remove" data-idx="${idx}" title="Remove">✕</button>
      `;
      div.querySelector('.nmc-file-remove').onclick = () => {
        URL.revokeObjectURL(file.url);
        this.files.splice(idx, 1);
        this._renderFileList();
        this.els.convertBtn.disabled = this.files.length === 0;
      };
      list.appendChild(div);
    });
    if (this.files.length === 0) {
      list.innerHTML = '<div style="text-align:center;color:#444;padding:20px;font-size:12px;">No files added</div>';
    }
  }

  async _convertAll() {
    if (this.files.length === 0 || this.isConverting) return;
    this.isConverting = true;
    this.els.convertBtn.disabled = true;
    this.els.progressWrap.classList.add('active');
    this.convertedFiles = [];
    this.els.resultList.innerHTML = '';
    this.els.emptyResults.style.display = 'none';
    this.els.downloadAllWrap.style.display = 'none';

    const total = this.files.length;
    for (let i = 0; i < total; i++) {
      const pct = ((i) / total * 100).toFixed(0);
      this.els.progressBar.style.width = pct + '%';
      this.els.progressText.textContent = `Converting ${i + 1} of ${total}...`;

      try {
        const result = await this._convertFile(this.files[i]);
        this.convertedFiles.push(result);
        this._addResultItem(result);
      } catch (err) {
        console.error(`Failed to convert ${this.files[i].name}:`, err);
      }

      // Yield to UI
      await new Promise(r => setTimeout(r, 50));
    }

    this.els.progressBar.style.width = '100%';
    this.els.progressText.textContent = `Done! ${this.convertedFiles.length} file(s) converted.`;
    this.isConverting = false;
    this.els.convertBtn.disabled = false;

    if (this.convertedFiles.length > 0) {
      this.els.downloadAllWrap.style.display = '';
    }
  }

  _convertFile(fileEntry) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Apply resize constraints
        if (this.settings.maxWidth > 0 && width > this.settings.maxWidth) {
          const ratio = this.settings.maxWidth / width;
          width = this.settings.maxWidth;
          height = Math.floor(height * ratio);
        }
        if (this.settings.maxHeight > 0 && height > this.settings.maxHeight) {
          const ratio = this.settings.maxHeight / height;
          height = this.settings.maxHeight;
          width = Math.floor(width * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // For JPEG, fill with white background (no transparency)
        if (this.settings.targetFormat === 'jpeg' || this.settings.targetFormat === 'bmp') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = `image/${this.settings.targetFormat}`;
        const quality = this.settings.quality / 100;

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Conversion failed: canvas toBlob returned null'));
            return;
          }

          const url = URL.createObjectURL(blob);
          const ext = this.settings.targetFormat === 'jpeg' ? 'jpg' : this.settings.targetFormat;
          const baseName = fileEntry.name.replace(/\.[^.]+$/, '');
          const newName = `${baseName}.${ext}`;

          resolve({
            name: newName,
            originalName: fileEntry.name,
            originalSize: fileEntry.size,
            newType: mimeType,
            blob,
            url,
            width,
            height
          });
        }, mimeType, quality);
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${fileEntry.name}`));
      img.src = fileEntry.url;
    });
  }

  _addResultItem(result) {
    const savings = ((result.originalSize - result.blob.size) / result.originalSize * 100);
    const savingsClass = savings >= 0 ? 'smaller' : 'larger';
    const savingsText = savings >= 0
      ? `↓ ${savings.toFixed(1)}% smaller`
      : `↑ ${Math.abs(savings).toFixed(1)}% larger`;

    const div = document.createElement('div');
    div.className = 'nmc-result-item';
    div.innerHTML = `
      <img class="nmc-result-thumb" src="${result.url}" alt="">
      <div class="nmc-result-info">
        <div class="nmc-result-name" title="${this._esc(result.name)}">${this._esc(result.name)}</div>
        <div class="nmc-result-meta">
          ${this._formatSize(result.blob.size)} · ${result.width}×${result.height}
        </div>
        <div class="nmc-result-savings ${savingsClass}">
          ${this._formatSize(result.originalSize)} → ${this._formatSize(result.blob.size)} (${savingsText})
        </div>
      </div>
      <button class="nmc-result-download" title="Download">💾</button>
    `;
    div.querySelector('.nmc-result-download').onclick = () => {
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.name;
      a.click();
    };
    this.els.resultList.appendChild(div);
  }

  _downloadAll() {
    this.convertedFiles.forEach((result, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = result.name;
        a.click();
      }, i * 200);
    });
  }

  _formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NexusMediaConverter;
}
window.NexusMediaConverter = NexusMediaConverter;
