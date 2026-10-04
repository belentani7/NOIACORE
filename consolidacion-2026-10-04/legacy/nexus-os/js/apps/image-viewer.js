/**
 * NEXUS OS — Image Viewer
 * Image viewing and basic editing with neon glassmorphism UI
 * Pure vanilla JS, no external dependencies
 */

class NexusImageViewer {
  constructor(container) {
    this.container = typeof container === 'string'
      ? document.querySelector(container) : container;
    this.images = [];
    this.currentIndex = -1;
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.cropMode = false;
    this.cropRect = null;
    this.isCropping = false;
    this.cropStartX = 0;
    this.cropStartY = 0;
    this.slideshowInterval = null;
    this.slideshowDelay = 3000;
    this.viewMode = 'single'; // single | grid

    // Adjustments
    this.adjustments = {
      brightness: 100, contrast: 100, saturation: 100,
      exposure: 0, temperature: 0
    };

    // Transform
    this.rotation = 0;
    this.flipH = false;
    this.flipV = false;
  }

  render() {
    this.container.innerHTML = '';
    this._injectStyles();
    this._buildUI();
    this._bindEvents();
  }

  destroy() {
    this.stopSlideshow();
    if (this.images) {
      this.images.forEach(img => {
        if (img.url && img.url.startsWith('blob:')) URL.revokeObjectURL(img.url);
      });
    }
    this.container.innerHTML = '';
  }

  _injectStyles() {
    if (document.getElementById('nexus-image-viewer-styles')) return;
    const style = document.createElement('style');
    style.id = 'nexus-image-viewer-styles';
    style.textContent = `
      .niv-root {
        display: flex; height: 100%; background: #0a0a0f;
        font-family: 'Segoe UI', system-ui, sans-serif; color: #e0e0e0;
        overflow: hidden;
      }
      .niv-sidebar {
        width: 220px; background: rgba(15,15,25,0.95);
        border-right: 1px solid rgba(255,0,60,0.15);
        display: flex; flex-direction: column; overflow: hidden;
        transition: width 0.3s;
      }
      .niv-sidebar.collapsed { width: 0; border: none; }
      .niv-sidebar-header {
        padding: 12px; border-bottom: 1px solid rgba(255,0,60,0.1);
        font-size: 14px; font-weight: 600; color: #ff2d6b;
        display: flex; align-items: center; justify-content: space-between;
      }
      .niv-thumb-list {
        flex: 1; overflow-y: auto; padding: 8px;
      }
      .niv-thumb-list::-webkit-scrollbar { width: 4px; }
      .niv-thumb-list::-webkit-scrollbar-thumb { background: #ff003c33; border-radius: 2px; }
      .niv-thumb {
        width: 100%; height: 80px; object-fit: cover; border-radius: 6px;
        cursor: pointer; margin-bottom: 6px; border: 2px solid transparent;
        transition: all 0.2s; opacity: 0.7;
      }
      .niv-thumb:hover { opacity: 1; }
      .niv-thumb.active {
        border-color: #ff003c; opacity: 1;
        box-shadow: 0 0 10px rgba(255,0,60,0.3);
      }

      .niv-main { flex: 1; display: flex; flex-direction: column; position: relative; min-width: 0; }
      .niv-toolbar {
        display: flex; align-items: center; gap: 6px; padding: 8px 12px;
        background: rgba(15,15,25,0.9); border-bottom: 1px solid rgba(255,0,60,0.1);
        flex-wrap: wrap;
      }
      .niv-tool-btn {
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,0,60,0.15);
        color: #ccc; padding: 6px 12px; border-radius: 6px; cursor: pointer;
        font-size: 12px; transition: all 0.2s; white-space: nowrap;
      }
      .niv-tool-btn:hover {
        background: rgba(255,0,60,0.1); color: #ff003c;
        border-color: rgba(255,0,60,0.4);
      }
      .niv-tool-btn.active {
        background: rgba(255,0,60,0.2); color: #ff003c;
        border-color: #ff003c; box-shadow: 0 0 8px rgba(255,0,60,0.2);
      }
      .niv-tool-sep {
        width: 1px; height: 20px; background: rgba(255,0,60,0.15); margin: 0 4px;
      }

      .niv-canvas-area {
        flex: 1; position: relative; overflow: hidden; background: #000;
        display: flex; align-items: center; justify-content: center;
      }
      .niv-canvas-area.drag-over {
        background: rgba(255,0,60,0.05);
      }
      .niv-image-container {
        position: relative; cursor: grab;
        transform-origin: center center;
      }
      .niv-image-container.dragging { cursor: grabbing; }
      .niv-image-container img {
        max-width: 100%; max-height: 100%; user-select: none;
        pointer-events: none;
      }

      .niv-crop-overlay {
        position: absolute; border: 2px dashed #ff003c;
        background: rgba(255,0,60,0.1); cursor: crosshair;
        pointer-events: none; display: none;
      }
      .niv-crop-overlay.active { display: block; pointer-events: auto; }

      .niv-drop-overlay {
        position: absolute; inset: 0; background: rgba(255,0,60,0.15);
        border: 3px dashed #ff003c; display: none; align-items: center;
        justify-content: center; z-index: 20; font-size: 22px; color: #ff003c;
        backdrop-filter: blur(8px);
      }
      .niv-drop-overlay.active { display: flex; }

      .niv-empty {
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; height: 100%; gap: 16px; color: #555;
      }
      .niv-empty-icon { font-size: 64px; opacity: 0.3; }
      .niv-empty-text { font-size: 16px; }
      .niv-open-btn {
        padding: 10px 24px; background: rgba(255,0,60,0.15);
        border: 1px solid rgba(255,0,60,0.4); border-radius: 8px;
        color: #ff003c; cursor: pointer; font-size: 14px; transition: all 0.2s;
      }
      .niv-open-btn:hover {
        background: rgba(255,0,60,0.25); box-shadow: 0 0 15px rgba(255,0,60,0.2);
      }

      .niv-adjust-panel {
        position: absolute; right: 10px; top: 10px; z-index: 15;
        background: rgba(15,15,25,0.92); backdrop-filter: blur(12px);
        border: 1px solid rgba(255,0,60,0.2); border-radius: 12px;
        padding: 16px; width: 240px; display: none;
      }
      .niv-adjust-panel.open { display: block; }
      .niv-adjust-title {
        font-size: 13px; color: #ff2d6b; margin-bottom: 12px; font-weight: 600;
      }
      .niv-adjust-row {
        display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
      }
      .niv-adjust-label { font-size: 11px; color: #888; width: 75px; }
      .niv-adjust-slider {
        flex: 1; -webkit-appearance: none; height: 3px;
        background: rgba(255,255,255,0.1); border-radius: 2px; outline: none;
      }
      .niv-adjust-slider::-webkit-slider-thumb {
        -webkit-appearance: none; width: 10px; height: 10px;
        background: #ff003c; border-radius: 50%; cursor: pointer;
      }
      .niv-adjust-val { font-size: 11px; color: #666; width: 30px; text-align: right; }

      .niv-filter-grid {
        display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;
        margin-top: 12px; border-top: 1px solid rgba(255,0,60,0.1); padding-top: 12px;
      }
      .niv-filter-btn {
        padding: 6px; font-size: 11px; background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,0,60,0.15); border-radius: 6px;
        color: #888; cursor: pointer; transition: all 0.2s; text-align: center;
      }
      .niv-filter-btn:hover { background: rgba(255,0,60,0.1); color: #ff003c; }
      .niv-filter-btn.active {
        background: rgba(255,0,60,0.2); color: #ff003c;
        border-color: #ff003c;
      }

      .niv-info-bar {
        padding: 6px 12px; background: rgba(15,15,25,0.9);
        border-top: 1px solid rgba(255,0,60,0.1); font-size: 11px;
        color: #666; display: flex; gap: 16px;
      }
      .niv-info-item { display: flex; gap: 4px; }
      .niv-info-label { color: #888; }
      .niv-info-val { color: #ff2d6b; }

      /* Grid view */
      .niv-grid-view {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 12px; padding: 20px; overflow-y: auto; height: 100%;
      }
      .niv-grid-item {
        aspect-ratio: 1; border-radius: 8px; overflow: hidden;
        cursor: pointer; border: 2px solid transparent; transition: all 0.2s;
        background: #1a1a2e;
      }
      .niv-grid-item:hover {
        border-color: rgba(255,0,60,0.4);
        box-shadow: 0 0 15px rgba(255,0,60,0.2);
      }
      .niv-grid-item img {
        width: 100%; height: 100%; object-fit: cover;
      }

      /* Slideshow */
      .niv-slideshow-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.95);
        z-index: 9999; display: none; align-items: center; justify-content: center;
      }
      .niv-slideshow-overlay.active { display: flex; }
      .niv-slideshow-img {
        max-width: 90%; max-height: 90%; object-fit: contain;
        transition: opacity 0.5s, transform 3s;
      }
      .niv-slideshow-close {
        position: absolute; top: 20px; right: 20px; background: rgba(255,0,60,0.2);
        border: 1px solid rgba(255,0,60,0.4); color: #ff003c; padding: 8px 16px;
        border-radius: 6px; cursor: pointer; font-size: 14px;
      }
    `;
    document.head.appendChild(style);
  }

  _buildUI() {
    const root = document.createElement('div');
    root.className = 'niv-root';
    root.innerHTML = `
      <div class="niv-sidebar" data-niv="sidebar">
        <div class="niv-sidebar-header">
          <span>Images</span>
          <button class="niv-tool-btn" data-niv="openFolderBtn" style="padding:4px 8px;font-size:11px;">Open</button>
        </div>
        <div class="niv-thumb-list" data-niv="thumbList"></div>
      </div>

      <div class="niv-main">
        <div class="niv-toolbar">
          <button class="niv-tool-btn" data-niv="openBtn">📁 Open</button>
          <div class="niv-tool-sep"></div>
          <button class="niv-tool-btn" data-niv="zoomInBtn">🔍+ Zoom In</button>
          <button class="niv-tool-btn" data-niv="zoomOutBtn">🔍- Zoom Out</button>
          <button class="niv-tool-btn" data-niv="zoomResetBtn">↺ Reset</button>
          <div class="niv-tool-sep"></div>
          <button class="niv-tool-btn" data-niv="rotateLeftBtn">↶ Rotate L</button>
          <button class="niv-tool-btn" data-niv="rotateRightBtn">↷ Rotate R</button>
          <button class="niv-tool-btn" data-niv="flipHBtn">⇔ Flip H</button>
          <button class="niv-tool-btn" data-niv="flipVBtn">⇕ Flip V</button>
          <div class="niv-tool-sep"></div>
          <button class="niv-tool-btn" data-niv="cropBtn">✂ Crop</button>
          <button class="niv-tool-btn" data-niv="adjustBtn">⚙ Adjust</button>
          <div class="niv-tool-sep"></div>
          <button class="niv-tool-btn" data-niv="gridViewBtn">⊞ Grid</button>
          <button class="niv-tool-btn" data-niv="slideshowBtn">▶ Slideshow</button>
          <div class="niv-tool-sep"></div>
          <button class="niv-tool-btn" data-niv="exportBtn">💾 Export</button>
          <button class="niv-tool-btn" data-niv="fullscreenBtn">⛶ Fullscreen</button>
        </div>

        <div class="niv-canvas-area" data-niv="canvasArea">
          <div class="niv-empty" data-niv="empty">
            <div class="niv-empty-icon">🖼</div>
            <div class="niv-empty-text">No image loaded</div>
            <button class="niv-open-btn" data-niv="emptyOpenBtn">Open Image</button>
          </div>
          <div class="niv-image-container" data-niv="imageContainer" style="display:none">
            <img data-niv="imageEl" draggable="false">
            <div class="niv-crop-overlay" data-niv="cropOverlay"></div>
          </div>
          <div class="niv-grid-view" data-niv="gridView" style="display:none"></div>
          <div class="niv-drop-overlay" data-niv="dropOverlay">Drop images here</div>

          <div class="niv-adjust-panel" data-niv="adjustPanel">
            <div class="niv-adjust-title">Adjustments</div>
            <div class="niv-adjust-row">
              <span class="niv-adjust-label">Brightness</span>
              <input type="range" class="niv-adjust-slider" min="0" max="200" value="100" data-niv="adjBrightness">
              <span class="niv-adjust-val" data-niv="adjBrightnessVal">100</span>
            </div>
            <div class="niv-adjust-row">
              <span class="niv-adjust-label">Contrast</span>
              <input type="range" class="niv-adjust-slider" min="0" max="200" value="100" data-niv="adjContrast">
              <span class="niv-adjust-val" data-niv="adjContrastVal">100</span>
            </div>
            <div class="niv-adjust-row">
              <span class="niv-adjust-label">Saturation</span>
              <input type="range" class="niv-adjust-slider" min="0" max="200" value="100" data-niv="adjSaturation">
              <span class="niv-adjust-val" data-niv="adjSaturationVal">100</span>
            </div>
            <div class="niv-adjust-row">
              <span class="niv-adjust-label">Exposure</span>
              <input type="range" class="niv-adjust-slider" min="-100" max="100" value="0" data-niv="adjExposure">
              <span class="niv-adjust-val" data-niv="adjExposureVal">0</span>
            </div>
            <div class="niv-adjust-row">
              <span class="niv-adjust-label">Temperature</span>
              <input type="range" class="niv-adjust-slider" min="-100" max="100" value="0" data-niv="adjTemperature">
              <span class="niv-adjust-val" data-niv="adjTemperatureVal">0</span>
            </div>
            <div class="niv-filter-grid">
              <button class="niv-filter-btn" data-filter="none">None</button>
              <button class="niv-filter-btn" data-filter="grayscale">Grayscale</button>
              <button class="niv-filter-btn" data-filter="sepia">Sepia</button>
              <button class="niv-filter-btn" data-filter="invert">Invert</button>
              <button class="niv-filter-btn" data-filter="neon">Neon Glow</button>
              <button class="niv-filter-btn" data-filter="vintage">Vintage</button>
              <button class="niv-filter-btn" data-filter="cyberpunk">Cyberpunk</button>
              <button class="niv-filter-btn" data-filter="blur">Blur</button>
            </div>
          </div>
        </div>

        <div class="niv-info-bar" data-niv="infoBar">
          <div class="niv-info-item">
            <span class="niv-info-label">Dimensions:</span>
            <span class="niv-info-val" data-niv="infoDims">--</span>
          </div>
          <div class="niv-info-item">
            <span class="niv-info-label">Size:</span>
            <span class="niv-info-val" data-niv="infoSize">--</span>
          </div>
          <div class="niv-info-item">
            <span class="niv-info-label">Format:</span>
            <span class="niv-info-val" data-niv="infoFormat">--</span>
          </div>
          <div class="niv-info-item">
            <span class="niv-info-label">Zoom:</span>
            <span class="niv-info-val" data-niv="infoZoom">100%</span>
          </div>
        </div>
      </div>

      <input type="file" accept="image/*" multiple style="display:none" data-niv="fileInput">
      <div class="niv-slideshow-overlay" data-niv="slideshowOverlay">
        <img class="niv-slideshow-img" data-niv="slideshowImg">
        <button class="niv-slideshow-close" data-niv="slideshowClose">✕ Close Slideshow</button>
      </div>
    `;
    this.container.appendChild(root);
    this.root = root;

    this.els = {};
    root.querySelectorAll('[data-niv]').forEach(el => {
      this.els[el.dataset.niv] = el;
    });
  }

  _bindEvents() {
    const e = this.els;

    e.openBtn.onclick = () => e.fileInput.click();
    e.emptyOpenBtn.onclick = () => e.fileInput.click();
    e.openFolderBtn.onclick = () => e.fileInput.click();
    e.fileInput.onchange = (ev) => this._handleFiles(ev.target.files);

    e.zoomInBtn.onclick = () => this._setZoom(this.zoom * 1.2);
    e.zoomOutBtn.onclick = () => this._setZoom(this.zoom / 1.2);
    e.zoomResetBtn.onclick = () => this._resetView();
    e.rotateLeftBtn.onclick = () => this._rotate(-90);
    e.rotateRightBtn.onclick = () => this._rotate(90);
    e.flipHBtn.onclick = () => { this.flipH = !this.flipH; this._applyTransform(); };
    e.flipVBtn.onclick = () => { this.flipV = !this.flipV; this._applyTransform(); };
    e.cropBtn.onclick = () => this._toggleCrop();
    e.adjustBtn.onclick = () => e.adjustPanel.classList.toggle('open');
    e.gridViewBtn.onclick = () => this._toggleGridView();
    e.slideshowBtn.onclick = () => this.startSlideshow();
    e.exportBtn.onclick = () => this._exportImage();
    e.fullscreenBtn.onclick = () => this._toggleFullscreen();

    // Adjustments
    ['Brightness', 'Contrast', 'Saturation', 'Exposure', 'Temperature'].forEach(name => {
      const key = name.toLowerCase();
      e['adj' + name].oninput = (ev) => {
        this.adjustments[key] = parseInt(ev.target.value);
        e['adj' + name + 'Val'].textContent = ev.target.value;
        this._applyAdjustments();
      };
    });

    // Filters
    root.querySelectorAll('.niv-filter-btn').forEach(btn => {
      btn.onclick = () => {
        root.querySelectorAll('.niv-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this._applyAdjustments();
      };
    });

    // Canvas area interactions
    const area = e.canvasArea;
    area.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const delta = ev.deltaY > 0 ? 0.9 : 1.1;
      this._setZoom(this.zoom * delta);
    }, { passive: false });

    area.addEventListener('mousedown', (ev) => this._onMouseDown(ev));
    area.addEventListener('mousemove', (ev) => this._onMouseMove(ev));
    area.addEventListener('mouseup', () => this._onMouseUp());
    area.addEventListener('mouseleave', () => this._onMouseUp());

    // Drag and drop
    area.ondragover = (ev) => { ev.preventDefault(); e.dropOverlay.classList.add('active'); };
    area.ondragleave = () => e.dropOverlay.classList.remove('active');
    area.ondrop = (ev) => {
      ev.preventDefault();
      e.dropOverlay.classList.remove('active');
      this._handleFiles(ev.dataTransfer.files);
    };

    // Slideshow close
    e.slideshowClose.onclick = () => this.stopSlideshow();
  }

  _handleFiles(fileList) {
    const imageFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    imageFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      this.images.push({ name: file.name, url, size: file.size, type: file.type, file });
    });

    if (this.currentIndex === -1) {
      this._showImage(0);
    }
    this._renderThumbnails();
  }

  _showImage(index) {
    if (index < 0 || index >= this.images.length) return;
    this.currentIndex = index;
    const img = this.images[index];

    this.els.imageEl.src = img.url;
    this.els.imageEl.onload = () => {
      this.els.infoDims.textContent = `${this.els.imageEl.naturalWidth} × ${this.els.imageEl.naturalHeight}`;
      this._resetView();
    };
    this.els.empty.style.display = 'none';
    this.els.imageContainer.style.display = '';
    this.els.gridView.style.display = 'none';
    this.viewMode = 'single';

    // Update info
    this.els.infoSize.textContent = this._formatSize(img.size);
    this.els.infoFormat.textContent = img.type.split('/')[1].toUpperCase();

    this._renderThumbnails();
    this._applyAdjustments();
  }

  _renderThumbnails() {
    const list = this.els.thumbList;
    list.innerHTML = '';
    this.images.forEach((img, idx) => {
      const thumb = document.createElement('img');
      thumb.className = 'niv-thumb' + (idx === this.currentIndex ? ' active' : '');
      thumb.src = img.url;
      thumb.onclick = () => this._showImage(idx);
      list.appendChild(thumb);
    });
  }

  _setZoom(z) {
    this.zoom = Math.max(0.1, Math.min(10, z));
    this._applyTransform();
    this.els.infoZoom.textContent = Math.round(this.zoom * 100) + '%';
  }

  _resetView() {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this._applyTransform();
    this.els.infoZoom.textContent = '100%';
  }

  _applyTransform() {
    const container = this.els.imageContainer;
    container.style.transform = `
      translate(${this.panX}px, ${this.panY}px)
      scale(${this.zoom})
      rotate(${this.rotation}deg)
      scaleX(${this.flipH ? -1 : 1})
      scaleY(${this.flipV ? -1 : 1})
    `;
  }

  _rotate(deg) {
    this.rotation = (this.rotation + deg) % 360;
    this._applyTransform();
  }

  _onMouseDown(ev) {
    if (this.cropMode) return;
    if (ev.target.closest('.niv-adjust-panel')) return;
    this.isDragging = true;
    this.lastMouseX = ev.clientX;
    this.lastMouseY = ev.clientY;
    this.els.imageContainer.classList.add('dragging');
  }

  _onMouseMove(ev) {
    if (this.cropMode && this.isCropping) {
      this._updateCrop(ev);
      return;
    }
    if (!this.isDragging) return;
    const dx = ev.clientX - this.lastMouseX;
    const dy = ev.clientY - this.lastMouseY;
    this.panX += dx;
    this.panY += dy;
    this.lastMouseX = ev.clientX;
    this.lastMouseY = ev.clientY;
    this._applyTransform();
  }

  _onMouseUp() {
    this.isDragging = false;
    this.isCropping = false;
    this.els.imageContainer.classList.remove('dragging');
  }

  _toggleCrop() {
    this.cropMode = !this.cropMode;
    this.els.cropBtn.classList.toggle('active', this.cropMode);
    if (this.cropMode) {
      this.els.cropOverlay.classList.add('active');
      this.els.canvasArea.addEventListener('mousedown', this._startCrop.bind(this));
    } else {
      this.els.cropOverlay.classList.remove('active');
      this.els.cropOverlay.style.width = '0';
      this.els.cropOverlay.style.height = '0';
    }
  }

  _startCrop(ev) {
    if (!this.cropMode) return;
    this.isCropping = true;
    const rect = this.els.canvasArea.getBoundingClientRect();
    this.cropStartX = ev.clientX - rect.left;
    this.cropStartY = ev.clientY - rect.top;
    this.els.cropOverlay.style.left = this.cropStartX + 'px';
    this.els.cropOverlay.style.top = this.cropStartY + 'px';
    this.els.cropOverlay.style.width = '0';
    this.els.cropOverlay.style.height = '0';
  }

  _updateCrop(ev) {
    const rect = this.els.canvasArea.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const w = Math.abs(x - this.cropStartX);
    const h = Math.abs(y - this.cropStartY);
    const left = Math.min(x, this.cropStartX);
    const top = Math.min(y, this.cropStartY);
    this.els.cropOverlay.style.left = left + 'px';
    this.els.cropOverlay.style.top = top + 'px';
    this.els.cropOverlay.style.width = w + 'px';
    this.els.cropOverlay.style.height = h + 'px';
  }

  _applyAdjustments() {
    const a = this.adjustments;
    let filter = `
      brightness(${a.brightness + a.exposure}%)
      contrast(${a.contrast}%)
      saturate(${a.saturation}%)
    `;
    if (this.adjustments.temperature > 0) {
      filter += ` sepia(${this.adjustments.temperature}%)`;
    } else if (this.adjustments.temperature < 0) {
      filter += ` hue-rotate(${this.adjustments.temperature}deg)`;
    }

    // Apply preset filter
    if (this.currentFilter && this.currentFilter !== 'none') {
      switch (this.currentFilter) {
        case 'grayscale': filter += ' grayscale(100%)'; break;
        case 'sepia': filter += ' sepia(100%)'; break;
        case 'invert': filter += ' invert(100%)'; break;
        case 'neon': filter += ' contrast(150%) saturate(200%) brightness(110%)'; break;
        case 'vintage': filter += ' sepia(50%) contrast(90%) brightness(90%)'; break;
        case 'cyberpunk': filter += ' hue-rotate(180deg) saturate(150%) contrast(120%)'; break;
        case 'blur': filter += ' blur(2px)'; break;
      }
    }

    this.els.imageEl.style.filter = filter;
  }

  _toggleGridView() {
    if (this.viewMode === 'grid') {
      this._showImage(this.currentIndex);
      this.els.gridViewBtn.classList.remove('active');
    } else {
      this.viewMode = 'grid';
      this.els.gridViewBtn.classList.add('active');
      this.els.imageContainer.style.display = 'none';
      this.els.gridView.style.display = '';
      this._renderGrid();
    }
  }

  _renderGrid() {
    const grid = this.els.gridView;
    grid.innerHTML = '';
    this.images.forEach((img, idx) => {
      const item = document.createElement('div');
      item.className = 'niv-grid-item';
      item.innerHTML = `<img src="${img.url}" alt="${img.name}">`;
      item.onclick = () => this._showImage(idx);
      grid.appendChild(item);
    });
  }

  startSlideshow() {
    if (this.images.length === 0) return;
    this.els.slideshowOverlay.classList.add('active');
    this.slideshowIndex = 0;
    this._showSlideshowImage();
    this.slideshowInterval = setInterval(() => {
      this.slideshowIndex = (this.slideshowIndex + 1) % this.images.length;
      this._showSlideshowImage();
    }, this.slideshowDelay);
  }

  stopSlideshow() {
    this.els.slideshowOverlay.classList.remove('active');
    clearInterval(this.slideshowInterval);
    this.slideshowInterval = null;
  }

  _showSlideshowImage() {
    const img = this.els.slideshowImg;
    img.style.opacity = '0';
    setTimeout(() => {
      img.src = this.images[this.slideshowIndex].url;
      img.style.opacity = '1';
    }, 300);
  }

  _exportImage() {
    if (this.currentIndex < 0) return;
    const canvas = document.createElement('canvas');
    const img = this.els.imageEl;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');

    ctx.filter = img.style.filter || 'none';
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.scale(this.flipH ? -1 : 1, this.flipV ? -1 : 1);
    ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.images[this.currentIndex].name.replace(/\.[^.]+$/, '') + '_edited.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.root.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  _formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NexusImageViewer;
}
window.NexusImageViewer = NexusImageViewer;
