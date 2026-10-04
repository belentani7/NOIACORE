'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Paint Studio
 *  Full-featured drawing/painting tool with layers and effects
 * ═══════════════════════════════════════════════════════════════
 */
class NexusPaint {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.canvas = null;
    this.ctx = null;
    this.canvasWidth = 800;
    this.canvasHeight = 600;

    // Tool state
    this.tool = 'brush';
    this.brushSize = 8;
    this.brushOpacity = 1;
    this.brushHardness = 1;
    this.color = '#ff003c';
    this.secondaryColor = '#000000';
    this.recentColors = ['#ff003c', '#00ccff', '#00ff88', '#ffaa00', '#cc99ff', '#ffffff', '#000000'];

    // Drawing state
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.shapeStart = null;

    // Layers
    this.layers = [];
    this.activeLayerIndex = 0;
    this.maxLayers = 8;

    // Undo/Redo
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndo = 50;

    // View
    this.zoom = 1;
    this.showGrid = false;

    // Brush presets
    this.brushPresets = [
      { name: 'Round', size: 8, hardness: 1, opacity: 1, scatter: 0, type: 'round' },
      { name: 'Soft', size: 20, hardness: 0.3, opacity: 0.5, scatter: 0, type: 'round' },
      { name: 'Pencil', size: 2, hardness: 1, opacity: 1, scatter: 0, type: 'round' },
      { name: 'Marker', size: 12, hardness: 0.8, opacity: 0.7, scatter: 0, type: 'round' },
      { name: 'Spray', size: 30, hardness: 0.5, opacity: 0.3, scatter: 15, type: 'spray' },
      { name: 'Neon Glow', size: 6, hardness: 1, opacity: 1, scatter: 0, type: 'glow' },
      { name: 'Calligraphy', size: 4, hardness: 1, opacity: 1, scatter: 0, type: 'calligraphy' },
      { name: 'Flat', size: 16, hardness: 0.9, opacity: 0.9, scatter: 0, type: 'flat' },
      { name: 'Scatter', size: 10, hardness: 0.6, opacity: 0.5, scatter: 8, type: 'scatter' },
      { name: 'Pixel', size: 1, hardness: 1, opacity: 1, scatter: 0, type: 'round' },
    ];
  }

  render() {
    const style = document.createElement('style');
    style.textContent = this._getStyles();
    this.container.appendChild(style);
    this._styleEl = style;

    this.element = document.createElement('div');
    this.element.className = 'nexus-paint';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._initCanvas();
    this._initLayers();
    this._bindEvents();
    this._saveUndoState();
  }

  destroy() {
    if (this._styleEl) this._styleEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <!-- Toolbar -->
      <div class="pt-toolbar">
        <div class="pt-tool-group">
          <button class="pt-tool pt-tool-active" data-tool="brush" title="Brush (B)">🖌</button>
          <button class="pt-tool" data-tool="pencil" title="Pencil (P)">✏️</button>
          <button class="pt-tool" data-tool="eraser" title="Eraser (E)">🧽</button>
          <button class="pt-tool" data-tool="fill" title="Fill Bucket (G)">🪣</button>
          <button class="pt-tool" data-tool="line" title="Line (L)">📏</button>
          <button class="pt-tool" data-tool="rect" title="Rectangle (R)">▭</button>
          <button class="pt-tool" data-tool="ellipse" title="Ellipse (O)">◯</button>
          <button class="pt-tool" data-tool="text" title="Text (T)">T</button>
          <button class="pt-tool" data-tool="eyedropper" title="Eyedropper (I)">💉</button>
          <button class="pt-tool" data-tool="spray" title="Spray Can (S)">💨</button>
          <button class="pt-tool" data-tool="gradient" title="Gradient">🌈</button>
        </div>
        <div class="pt-tool-divider"></div>
        <div class="pt-tool-group">
          <button class="pt-action" data-action="undo" title="Undo (Ctrl+Z)">↩</button>
          <button class="pt-action" data-action="redo" title="Redo (Ctrl+Shift+Z)">↪</button>
        </div>
        <div class="pt-tool-divider"></div>
        <div class="pt-tool-group">
          <button class="pt-action" data-action="zoomin" title="Zoom In">+</button>
          <button class="pt-action" data-action="zoomout" title="Zoom Out">−</button>
          <span class="pt-zoom-level" id="pt-zoom">100%</span>
        </div>
        <div class="pt-tool-divider"></div>
        <div class="pt-tool-group">
          <button class="pt-action" data-action="grid" title="Toggle Grid">#</button>
          <button class="pt-action" data-action="clear" title="Clear Canvas">🗑</button>
          <button class="pt-action" data-action="new" title="New Canvas">📄</button>
          <button class="pt-action" data-action="open" title="Open Image">📂</button>
          <button class="pt-action" data-action="export-png" title="Export PNG">💾 PNG</button>
          <button class="pt-action" data-action="export-jpg" title="Export JPEG">💾 JPG</button>
        </div>
      </div>

      <div class="pt-body">
        <!-- Left Panel: Brush Settings -->
        <div class="pt-panel pt-panel-left">
          <div class="pt-panel-section">
            <div class="pt-panel-title">Brush</div>
            <div class="pt-slider-row">
              <label>Size</label>
              <input type="range" class="pt-slider" id="pt-brush-size" min="1" max="100" value="8">
              <span class="pt-slider-val" id="pt-size-val">8</span>
            </div>
            <div class="pt-slider-row">
              <label>Opacity</label>
              <input type="range" class="pt-slider" id="pt-brush-opacity" min="0" max="100" value="100">
              <span class="pt-slider-val" id="pt-opacity-val">100%</span>
            </div>
            <div class="pt-slider-row">
              <label>Hardness</label>
              <input type="range" class="pt-slider" id="pt-brush-hardness" min="0" max="100" value="100">
              <span class="pt-slider-val" id="pt-hardness-val">100%</span>
            </div>
          </div>

          <div class="pt-panel-section">
            <div class="pt-panel-title">Presets</div>
            <div class="pt-presets" id="pt-presets"></div>
          </div>

          <div class="pt-panel-section">
            <div class="pt-panel-title">Color</div>
            <div class="pt-color-swatches">
              <div class="pt-color-pair">
                <input type="color" class="pt-color-primary" id="pt-color-primary" value="#ff003c" title="Primary Color">
                <input type="color" class="pt-color-secondary" id="pt-color-secondary" value="#000000" title="Secondary Color">
              </div>
              <button class="pt-color-swap" id="pt-color-swap" title="Swap Colors">⇄</button>
            </div>
            <div class="pt-color-input-row">
              <label>Hex</label>
              <input type="text" class="pt-hex-input glass-input" id="pt-hex-input" value="#ff003c" maxlength="7">
            </div>
            <div class="pt-hsl-sliders">
              <div class="pt-slider-row">
                <label>H</label>
                <input type="range" class="pt-slider pt-slider-hue" id="pt-hue" min="0" max="360" value="348">
              </div>
              <div class="pt-slider-row">
                <label>S</label>
                <input type="range" class="pt-slider" id="pt-sat" min="0" max="100" value="100">
              </div>
              <div class="pt-slider-row">
                <label>L</label>
                <input type="range" class="pt-slider" id="pt-light" min="0" max="100" value="50">
              </div>
            </div>
            <div class="pt-recent-colors" id="pt-recent-colors"></div>
          </div>
        </div>

        <!-- Canvas Area -->
        <div class="pt-canvas-area" id="pt-canvas-area">
          <div class="pt-canvas-wrapper" id="pt-canvas-wrapper">
            <canvas class="pt-canvas" id="pt-canvas"></canvas>
            <canvas class="pt-overlay" id="pt-overlay"></canvas>
          </div>
        </div>

        <!-- Right Panel: Layers -->
        <div class="pt-panel pt-panel-right">
          <div class="pt-panel-section">
            <div class="pt-panel-title">
              Layers
              <button class="pt-layer-add" id="pt-layer-add" title="Add Layer">+</button>
            </div>
            <div class="pt-layer-list" id="pt-layer-list"></div>
          </div>
          <div class="pt-panel-section">
            <div class="pt-panel-title">Canvas Info</div>
            <div class="pt-info" id="pt-info">
              <div>Size: <span id="pt-info-size">800 × 600</span></div>
              <div>Cursor: <span id="pt-info-cursor">0, 0</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _initCanvas() {
    this.canvas = this.element.querySelector('#pt-canvas');
    this.overlay = this.element.querySelector('#pt-overlay');
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.overlay.width = this.canvasWidth;
    this.overlay.height = this.canvasHeight;
    this.ctx = this.canvas.getContext('2d');
    this.overlayCtx = this.overlay.getContext('2d');

    // White background on first layer
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  _initLayers() {
    this.layers = [{
      name: 'Background',
      visible: true,
      opacity: 1,
      data: this.ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight)
    }];
    this.activeLayerIndex = 0;
    this._renderLayers();
  }

  _bindEvents() {
    // Tool selection
    this.element.querySelector('.pt-toolbar').addEventListener('click', (e) => {
      const toolBtn = e.target.closest('[data-tool]');
      const actionBtn = e.target.closest('[data-action]');
      if (toolBtn) this._selectTool(toolBtn.dataset.tool);
      if (actionBtn) this._handleAction(actionBtn.dataset.action);
    });

    // Canvas drawing events
    this.overlay.addEventListener('mousedown', (e) => this._onMouseDown(e));
    this.overlay.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.overlay.addEventListener('mouseup', (e) => this._onMouseUp(e));
    this.overlay.addEventListener('mouseleave', (e) => this._onMouseUp(e));

    // Brush settings
    this.element.querySelector('#pt-brush-size').addEventListener('input', (e) => {
      this.brushSize = parseInt(e.target.value);
      this.element.querySelector('#pt-size-val').textContent = this.brushSize;
    });
    this.element.querySelector('#pt-brush-opacity').addEventListener('input', (e) => {
      this.brushOpacity = parseInt(e.target.value) / 100;
      this.element.querySelector('#pt-opacity-val').textContent = e.target.value + '%';
    });
    this.element.querySelector('#pt-brush-hardness').addEventListener('input', (e) => {
      this.brushHardness = parseInt(e.target.value) / 100;
      this.element.querySelector('#pt-hardness-val').textContent = e.target.value + '%';
    });

    // Color
    this.element.querySelector('#pt-color-primary').addEventListener('input', (e) => {
      this.color = e.target.value;
      this.element.querySelector('#pt-hex-input').value = this.color;
      this._updateHSL();
      this._addRecentColor(this.color);
    });
    this.element.querySelector('#pt-color-secondary').addEventListener('input', (e) => {
      this.secondaryColor = e.target.value;
    });
    this.element.querySelector('#pt-color-swap').addEventListener('click', () => {
      [this.color, this.secondaryColor] = [this.secondaryColor, this.color];
      this.element.querySelector('#pt-color-primary').value = this.color;
      this.element.querySelector('#pt-color-secondary').value = this.secondaryColor;
      this.element.querySelector('#pt-hex-input').value = this.color;
    });
    this.element.querySelector('#pt-hex-input').addEventListener('change', (e) => {
      const val = e.target.value;
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        this.color = val;
        this.element.querySelector('#pt-color-primary').value = val;
        this._updateHSL();
      }
    });

    // HSL sliders
    ['pt-hue', 'pt-sat', 'pt-light'].forEach(id => {
      this.element.querySelector('#' + id).addEventListener('input', () => this._updateFromHSL());
    });

    // Layer management
    this.element.querySelector('#pt-layer-add').addEventListener('click', () => this._addLayer());

    // Keyboard shortcuts
    this.element.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); this._undo(); }
      if (e.ctrlKey && e.key === 'z' && e.shiftKey) { e.preventDefault(); this._redo(); }
      if (e.key === 'b') this._selectTool('brush');
      if (e.key === 'p') this._selectTool('pencil');
      if (e.key === 'e') this._selectTool('eraser');
      if (e.key === 'g') this._selectTool('fill');
      if (e.key === 'l') this._selectTool('line');
      if (e.key === 'r') this._selectTool('rect');
      if (e.key === 'o') this._selectTool('ellipse');
      if (e.key === 't') this._selectTool('text');
      if (e.key === 'i') this._selectTool('eyedropper');
      if (e.key === 's' && !e.ctrlKey) this._selectTool('spray');
    });
    this.element.tabIndex = 0;

    // Render presets and recent colors
    this._renderPresets();
    this._renderRecentColors();
    this._updateHSL();
  }

  // ─── Tool Selection ─────────────────────────────────────────────
  _selectTool(tool) {
    this.tool = tool;
    this.element.querySelectorAll('.pt-tool').forEach(b => b.classList.toggle('pt-tool-active', b.dataset.tool === tool));
    this.overlay.style.cursor = this._getCursor(tool);
  }

  _getCursor(tool) {
    switch (tool) {
      case 'brush': case 'pencil': case 'spray': return 'crosshair';
      case 'eraser': return 'crosshair';
      case 'fill': return 'crosshair';
      case 'eyedropper': return 'crosshair';
      case 'text': return 'text';
      default: return 'crosshair';
    }
  }

  // ─── Drawing ────────────────────────────────────────────────────
  _getCanvasPos(e) {
    const rect = this.overlay.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / this.zoom,
      y: (e.clientY - rect.top) / this.zoom
    };
  }

  _onMouseDown(e) {
    const pos = this._getCanvasPos(e);
    this.isDrawing = true;
    this.lastX = pos.x;
    this.lastY = pos.y;
    this.shapeStart = { x: pos.x, y: pos.y };

    if (this.tool === 'fill') {
      this._floodFill(Math.floor(pos.x), Math.floor(pos.y), this.color);
      this._saveUndoState();
      this.isDrawing = false;
      return;
    }

    if (this.tool === 'eyedropper') {
      this._pickColor(Math.floor(pos.x), Math.floor(pos.y));
      this.isDrawing = false;
      return;
    }

    if (this.tool === 'text') {
      this._placeText(pos.x, pos.y);
      this.isDrawing = false;
      return;
    }

    if (this.tool === 'brush' || this.tool === 'pencil' || this.tool === 'eraser' || this.tool === 'spray') {
      this._drawDot(pos.x, pos.y);
    }
  }

  _onMouseMove(e) {
    const pos = this._getCanvasPos(e);

    // Update cursor info
    const cursorEl = this.element.querySelector('#pt-info-cursor');
    if (cursorEl) cursorEl.textContent = `${Math.floor(pos.x)}, ${Math.floor(pos.y)}`;

    if (!this.isDrawing) return;

    if (this.tool === 'brush' || this.tool === 'pencil' || this.tool === 'eraser') {
      this._drawLine(this.lastX, this.lastY, pos.x, pos.y);
      this.lastX = pos.x;
      this.lastY = pos.y;
    } else if (this.tool === 'spray') {
      this._sprayAt(pos.x, pos.y);
      this.lastX = pos.x;
      this.lastY = pos.y;
    } else if (this.tool === 'line' || this.tool === 'rect' || this.tool === 'ellipse' || this.tool === 'gradient') {
      this._drawShapePreview(pos.x, pos.y);
    }
  }

  _onMouseUp(e) {
    if (!this.isDrawing) return;

    if (this.tool === 'line' || this.tool === 'rect' || this.tool === 'ellipse') {
      const pos = this._getCanvasPos(e);
      this._drawShapeFinal(pos.x, pos.y);
      this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    } else if (this.tool === 'gradient') {
      const pos = this._getCanvasPos(e);
      this._drawGradientFinal(pos.x, pos.y);
      this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    }

    this.isDrawing = false;
    this._saveUndoState();
    this._updateLayerData();
  }

  _drawDot(x, y) {
    this.ctx.save();
    this.ctx.globalAlpha = this.brushOpacity;

    if (this.tool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
    }

    if (this.tool === 'brush' && this.brushHardness < 0.5) {
      // Soft brush with radial gradient
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, this.brushSize);
      gradient.addColorStop(0, this.color);
      gradient.addColorStop(this.brushHardness, this.color);
      gradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, this.brushSize, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (this.tool === 'spray') {
      this._sprayAt(x, y);
    } else {
      // Neon glow effect
      if (this.tool === 'brush') {
        this.ctx.shadowColor = this.color;
        this.ctx.shadowBlur = this.brushSize * 0.5;
      }

      this.ctx.fillStyle = this.tool === 'eraser' ? 'rgba(0,0,0,1)' : this.color;
      const size = this.tool === 'pencil' ? Math.max(1, this.brushSize * 0.3) : this.brushSize;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  _drawLine(x1, y1, x2, y2) {
    this.ctx.save();
    this.ctx.globalAlpha = this.brushOpacity;

    if (this.tool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
    }

    if (this.tool === 'brush') {
      this.ctx.shadowColor = this.color;
      this.ctx.shadowBlur = this.brushSize * 0.4;
    }

    this.ctx.strokeStyle = this.tool === 'eraser' ? 'rgba(0,0,0,1)' : this.color;
    this.ctx.lineWidth = this.tool === 'pencil' ? Math.max(1, this.brushSize * 0.3) : this.brushSize;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  _sprayAt(x, y) {
    this.ctx.save();
    this.ctx.globalAlpha = this.brushOpacity * 0.3;
    this.ctx.fillStyle = this.color;
    const density = this.brushSize * 2;
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.brushSize;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      this.ctx.fillRect(px, py, 1, 1);
    }
    this.ctx.restore();
  }

  _drawShapePreview(x, y) {
    this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    this.overlayCtx.save();
    this.overlayCtx.strokeStyle = this.color;
    this.overlayCtx.lineWidth = this.brushSize;
    this.overlayCtx.globalAlpha = 0.6;
    this.overlayCtx.setLineDash([5, 5]);

    const sx = this.shapeStart.x;
    const sy = this.shapeStart.y;

    if (this.tool === 'line') {
      this.overlayCtx.beginPath();
      this.overlayCtx.moveTo(sx, sy);
      this.overlayCtx.lineTo(x, y);
      this.overlayCtx.stroke();
    } else if (this.tool === 'rect') {
      this.overlayCtx.strokeRect(sx, sy, x - sx, y - sy);
    } else if (this.tool === 'ellipse') {
      const cx = (sx + x) / 2;
      const cy = (sy + y) / 2;
      const rx = Math.abs(x - sx) / 2;
      const ry = Math.abs(y - sy) / 2;
      this.overlayCtx.beginPath();
      this.overlayCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      this.overlayCtx.stroke();
    } else if (this.tool === 'gradient') {
      this.overlayCtx.setLineDash([3, 3]);
      this.overlayCtx.beginPath();
      this.overlayCtx.moveTo(sx, sy);
      this.overlayCtx.lineTo(x, y);
      this.overlayCtx.stroke();
    }

    this.overlayCtx.restore();
  }

  _drawShapeFinal(x, y) {
    const sx = this.shapeStart.x;
    const sy = this.shapeStart.y;
    this.ctx.save();
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.brushSize;
    this.ctx.globalAlpha = this.brushOpacity;
    this.ctx.lineCap = 'round';

    if (this.tool === 'line') {
      this.ctx.beginPath();
      this.ctx.moveTo(sx, sy);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    } else if (this.tool === 'rect') {
      this.ctx.strokeRect(sx, sy, x - sx, y - sy);
    } else if (this.tool === 'ellipse') {
      const cx = (sx + x) / 2;
      const cy = (sy + y) / 2;
      const rx = Math.abs(x - sx) / 2;
      const ry = Math.abs(y - sy) / 2;
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, rx || 1, ry || 1, 0, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  _drawGradientFinal(x, y) {
    const sx = this.shapeStart.x;
    const sy = this.shapeStart.y;
    this.ctx.save();
    this.ctx.globalAlpha = this.brushOpacity;
    const gradient = this.ctx.createLinearGradient(sx, sy, x, y);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, this.secondaryColor);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.ctx.restore();
  }

  // ─── Flood Fill ─────────────────────────────────────────────────
  _floodFill(startX, startY, fillColor) {
    const imageData = this.ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    const data = imageData.data;
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    const startIdx = (startY * w + startX) * 4;
    const startR = data[startIdx];
    const startG = data[startIdx + 1];
    const startB = data[startIdx + 2];
    const startA = data[startIdx + 3];

    // Parse fill color
    const fc = this._hexToRgb(fillColor);
    if (startR === fc.r && startG === fc.g && startB === fc.b) return;

    const tolerance = 30;
    const stack = [[startX, startY]];
    const visited = new Uint8Array(w * h);

    const matches = (idx) => {
      return Math.abs(data[idx] - startR) <= tolerance &&
             Math.abs(data[idx + 1] - startG) <= tolerance &&
             Math.abs(data[idx + 2] - startB) <= tolerance &&
             Math.abs(data[idx + 3] - startA) <= tolerance;
    };

    while (stack.length > 0) {
      const [px, py] = stack.pop();
      if (px < 0 || px >= w || py < 0 || py >= h) continue;
      const pixelIdx = py * w + px;
      if (visited[pixelIdx]) continue;
      const idx = pixelIdx * 4;
      if (!matches(idx)) continue;

      visited[pixelIdx] = 1;
      data[idx] = fc.r;
      data[idx + 1] = fc.g;
      data[idx + 2] = fc.b;
      data[idx + 3] = 255;

      stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  // ─── Eyedropper ─────────────────────────────────────────────────
  _pickColor(x, y) {
    const pixel = this.ctx.getImageData(x, y, 1, 1).data;
    const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
    this.color = hex;
    this.element.querySelector('#pt-color-primary').value = hex;
    this.element.querySelector('#pt-hex-input').value = hex;
    this._updateHSL();
    this._addRecentColor(hex);
  }

  // ─── Text Tool ──────────────────────────────────────────────────
  _placeText(x, y) {
    const text = prompt('Enter text:');
    if (!text) return;
    this.ctx.save();
    this.ctx.fillStyle = this.color;
    this.ctx.font = `${this.brushSize * 2}px 'Segoe UI', sans-serif`;
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
    this._saveUndoState();
    this._updateLayerData();
  }

  // ─── Undo / Redo ────────────────────────────────────────────────
  _saveUndoState() {
    const data = this.ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    this.undoStack.push(data);
    if (this.undoStack.length > this.maxUndo) this.undoStack.shift();
    this.redoStack = [];
  }

  _undo() {
    if (this.undoStack.length <= 1) return;
    const current = this.undoStack.pop();
    this.redoStack.push(current);
    const prev = this.undoStack[this.undoStack.length - 1];
    this.ctx.putImageData(prev, 0, 0);
  }

  _redo() {
    if (this.redoStack.length === 0) return;
    const data = this.redoStack.pop();
    this.undoStack.push(data);
    this.ctx.putImageData(data, 0, 0);
  }

  // ─── Layers ─────────────────────────────────────────────────────
  _addLayer() {
    if (this.layers.length >= this.maxLayers) return;
    // Save current layer
    this._updateLayerData();

    const newLayer = {
      name: `Layer ${this.layers.length + 1}`,
      visible: true,
      opacity: 1,
      data: null
    };
    this.layers.push(newLayer);
    this.activeLayerIndex = this.layers.length - 1;

    // Clear canvas for new layer
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this._renderLayers();
    this._saveUndoState();
  }

  _selectLayer(index) {
    if (index < 0 || index >= this.layers.length) return;
    // Save current
    this._updateLayerData();
    this.activeLayerIndex = index;
    // Load layer data
    if (this.layers[index].data) {
      this.ctx.putImageData(this.layers[index].data, 0, 0);
    } else {
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
    this._renderLayers();
  }

  _updateLayerData() {
    if (this.layers[this.activeLayerIndex]) {
      this.layers[this.activeLayerIndex].data = this.ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    }
  }

  _deleteLayer(index) {
    if (this.layers.length <= 1) return;
    this.layers.splice(index, 1);
    if (this.activeLayerIndex >= this.layers.length) this.activeLayerIndex = this.layers.length - 1;
    this._selectLayer(this.activeLayerIndex);
  }

  _toggleLayerVisibility(index) {
    this.layers[index].visible = !this.layers[index].visible;
    this._renderLayers();
  }

  _renderLayers() {
    const list = this.element.querySelector('#pt-layer-list');
    list.innerHTML = this.layers.map((layer, i) => {
      const active = i === this.activeLayerIndex ? 'pt-layer-active' : '';
      return `
        <div class="pt-layer-item ${active}" data-layer="${i}">
          <button class="pt-layer-vis" data-vis="${i}" title="Toggle Visibility">${layer.visible ? '👁' : '👁‍🗨'}</button>
          <span class="pt-layer-name">${layer.name}</span>
          <button class="pt-layer-del" data-ldel="${i}" title="Delete Layer">✕</button>
        </div>
      `;
    }).reverse().join('');

    list.querySelectorAll('.pt-layer-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-vis]') || e.target.closest('[data-ldel]')) return;
        this._selectLayer(parseInt(el.dataset.layer));
      });
    });
    list.querySelectorAll('[data-vis]').forEach(btn => {
      btn.addEventListener('click', () => this._toggleLayerVisibility(parseInt(btn.dataset.vis)));
    });
    list.querySelectorAll('[data-ldel]').forEach(btn => {
      btn.addEventListener('click', () => this._deleteLayer(parseInt(btn.dataset.ldel)));
    });
  }

  // ─── Actions ────────────────────────────────────────────────────
  _handleAction(action) {
    switch (action) {
      case 'undo': this._undo(); break;
      case 'redo': this._redo(); break;
      case 'zoomin': this._setZoom(this.zoom * 1.25); break;
      case 'zoomout': this._setZoom(this.zoom / 1.25); break;
      case 'grid': this._toggleGrid(); break;
      case 'clear': this._clearCanvas(); break;
      case 'new': this._newCanvas(); break;
      case 'open': this._openImage(); break;
      case 'export-png': this._exportCanvas('png'); break;
      case 'export-jpg': this._exportCanvas('jpeg'); break;
    }
  }

  _setZoom(z) {
    this.zoom = Math.max(0.25, Math.min(8, z));
    const wrapper = this.element.querySelector('#pt-canvas-wrapper');
    wrapper.style.transform = `scale(${this.zoom})`;
    wrapper.style.transformOrigin = 'top left';
    this.element.querySelector('#pt-zoom').textContent = Math.round(this.zoom * 100) + '%';
  }

  _toggleGrid() {
    this.showGrid = !this.showGrid;
    if (this.showGrid) {
      this.overlayCtx.save();
      this.overlayCtx.strokeStyle = 'rgba(255, 0, 60, 0.1)';
      this.overlayCtx.lineWidth = 0.5;
      for (let x = 0; x < this.canvasWidth; x += 20) {
        this.overlayCtx.beginPath(); this.overlayCtx.moveTo(x, 0); this.overlayCtx.lineTo(x, this.canvasHeight); this.overlayCtx.stroke();
      }
      for (let y = 0; y < this.canvasHeight; y += 20) {
        this.overlayCtx.beginPath(); this.overlayCtx.moveTo(0, y); this.overlayCtx.lineTo(this.canvasWidth, y); this.overlayCtx.stroke();
      }
      this.overlayCtx.restore();
    } else {
      this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    }
  }

  _clearCanvas() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    this._saveUndoState();
    this._updateLayerData();
  }

  _newCanvas() {
    const w = parseInt(prompt('Canvas width:', '800')) || 800;
    const h = parseInt(prompt('Canvas height:', '600')) || 600;
    this.canvasWidth = Math.min(w, 4000);
    this.canvasHeight = Math.min(h, 4000);
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.overlay.width = this.canvasWidth;
    this.overlay.height = this.canvasHeight;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.undoStack = [];
    this.redoStack = [];
    this._initLayers();
    this._saveUndoState();
    this.element.querySelector('#pt-info-size').textContent = `${this.canvasWidth} × ${this.canvasHeight}`;
  }

  _openImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => {
        this.canvasWidth = img.width;
        this.canvasHeight = img.height;
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.overlay.width = img.width;
        this.overlay.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        this.undoStack = [];
        this.redoStack = [];
        this._initLayers();
        this._saveUndoState();
        this._setZoom(1);
        this.element.querySelector('#pt-info-size').textContent = `${this.canvasWidth} × ${this.canvasHeight}`;
      };
      img.src = URL.createObjectURL(file);
    });
    input.click();
  }

  _exportCanvas(format) {
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const dataUrl = this.canvas.toDataURL(mimeType, 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `nexus-painting.${ext}`;
    a.click();
  }

  // ─── Presets ────────────────────────────────────────────────────
  _renderPresets() {
    const container = this.element.querySelector('#pt-presets');
    container.innerHTML = this.brushPresets.map((p, i) =>
      `<button class="pt-preset" data-preset="${i}" title="${p.name}">${p.name}</button>`
    ).join('');

    container.querySelectorAll('.pt-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = this.brushPresets[parseInt(btn.dataset.preset)];
        this.brushSize = preset.size;
        this.brushOpacity = preset.opacity;
        this.brushHardness = preset.hardness;
        this.element.querySelector('#pt-brush-size').value = preset.size;
        this.element.querySelector('#pt-brush-opacity').value = preset.opacity * 100;
        this.element.querySelector('#pt-brush-hardness').value = preset.hardness * 100;
        this.element.querySelector('#pt-size-val').textContent = preset.size;
        this.element.querySelector('#pt-opacity-val').textContent = Math.round(preset.opacity * 100) + '%';
        this.element.querySelector('#pt-hardness-val').textContent = Math.round(preset.hardness * 100) + '%';
        if (preset.type === 'spray') this._selectTool('spray');
        else this._selectTool('brush');
      });
    });
  }

  // ─── Color Helpers ──────────────────────────────────────────────
  _renderRecentColors() {
    const container = this.element.querySelector('#pt-recent-colors');
    container.innerHTML = this.recentColors.map(c =>
      `<div class="pt-recent-swatch" style="background:${c}" data-color="${c}" title="${c}"></div>`
    ).join('');

    container.querySelectorAll('.pt-recent-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        this.color = sw.dataset.color;
        this.element.querySelector('#pt-color-primary').value = this.color;
        this.element.querySelector('#pt-hex-input').value = this.color;
        this._updateHSL();
      });
    });
  }

  _addRecentColor(hex) {
    if (!this.recentColors.includes(hex)) {
      this.recentColors.unshift(hex);
      if (this.recentColors.length > 14) this.recentColors.pop();
    }
    this._renderRecentColors();
  }

  _updateHSL() {
    const rgb = this._hexToRgb(this.color);
    const hsl = this._rgbToHsl(rgb.r, rgb.g, rgb.b);
    this.element.querySelector('#pt-hue').value = Math.round(hsl.h);
    this.element.querySelector('#pt-sat').value = Math.round(hsl.s * 100);
    this.element.querySelector('#pt-light').value = Math.round(hsl.l * 100);
  }

  _updateFromHSL() {
    const h = parseInt(this.element.querySelector('#pt-hue').value);
    const s = parseInt(this.element.querySelector('#pt-sat').value) / 100;
    const l = parseInt(this.element.querySelector('#pt-light').value) / 100;
    const rgb = this._hslToRgb(h, s, l);
    const hex = '#' + [rgb.r, rgb.g, rgb.b].map(v => v.toString(16).padStart(2, '0')).join('');
    this.color = hex;
    this.element.querySelector('#pt-color-primary').value = hex;
    this.element.querySelector('#pt-hex-input').value = hex;
    this._addRecentColor(hex);
  }

  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  _rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s, l };
  }

  _hslToRgb(h, s, l) {
    h /= 360;
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  // ─── Styles ─────────────────────────────────────────────────────
  _getStyles() {
    return `
      .nexus-paint {
        width: 100%; height: 100%;
        background: rgba(10, 5, 20, 0.96);
        border: 1px solid rgba(255, 0, 60, 0.2);
        border-radius: 8px;
        display: flex; flex-direction: column;
        overflow: hidden;
        box-shadow: 0 0 30px rgba(255, 0, 60, 0.1);
        font-family: 'Segoe UI', sans-serif;
      }

      .pt-toolbar {
        display: flex; align-items: center; gap: 4px;
        padding: 4px 8px;
        background: rgba(15, 8, 25, 0.8);
        border-bottom: 1px solid rgba(255, 0, 60, 0.1);
        flex-shrink: 0; flex-wrap: wrap;
      }
      .pt-tool-group { display: flex; gap: 2px; align-items: center; flex-wrap: wrap; }
      .pt-tool-divider { width: 1px; height: 20px; background: rgba(255, 0, 60, 0.12); margin: 0 4px; }
      .pt-tool, .pt-action {
        background: rgba(255, 0, 60, 0.06); border: 1px solid rgba(255, 0, 60, 0.1);
        color: #aaa; padding: 4px 7px; border-radius: 4px; font-size: 12px;
        cursor: pointer; transition: all 0.1s;
      }
      .pt-tool:hover, .pt-action:hover { background: rgba(255, 0, 60, 0.15); color: #fff; }
      .pt-tool-active { background: rgba(255, 0, 60, 0.25) !important; color: #ff003c !important; border-color: #ff003c !important; }
      .pt-zoom-level { font-size: 10px; color: #888; min-width: 36px; text-align: center; }

      .pt-body { flex: 1; display: flex; overflow: hidden; }

      /* Panels */
      .pt-panel {
        background: rgba(12, 6, 22, 0.8);
        overflow-y: auto; padding: 8px;
      }
      .pt-panel::-webkit-scrollbar { width: 3px; }
      .pt-panel::-webkit-scrollbar-thumb { background: rgba(255,0,60,0.3); }
      .pt-panel-left { width: 180px; border-right: 1px solid rgba(255, 0, 60, 0.1); }
      .pt-panel-right { width: 160px; border-left: 1px solid rgba(255, 0, 60, 0.1); }

      .pt-panel-section { margin-bottom: 12px; }
      .pt-panel-title {
        font-size: 10px; color: #ff003c; font-weight: 600;
        text-transform: uppercase; letter-spacing: 1px;
        margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;
      }

      .pt-slider-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
      .pt-slider-row label { font-size: 10px; color: #888; width: 48px; }
      .pt-slider {
        flex: 1; height: 4px; -webkit-appearance: none; appearance: none;
        background: rgba(255, 0, 60, 0.15); border-radius: 2px; outline: none;
      }
      .pt-slider::-webkit-slider-thumb {
        -webkit-appearance: none; width: 12px; height: 12px;
        background: #ff003c; border-radius: 50%; cursor: pointer;
        box-shadow: 0 0 6px rgba(255, 0, 60, 0.5);
      }
      .pt-slider-hue {
        background: linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);
      }
      .pt-slider-val { font-size: 10px; color: #aaa; width: 30px; text-align: right; }

      /* Presets */
      .pt-presets { display: flex; flex-wrap: wrap; gap: 3px; }
      .pt-preset {
        font-size: 9px; padding: 3px 6px;
        background: rgba(255, 0, 60, 0.05); border: 1px solid rgba(255, 0, 60, 0.1);
        color: #aaa; border-radius: 3px; cursor: pointer;
      }
      .pt-preset:hover { background: rgba(255, 0, 60, 0.15); color: #fff; }

      /* Colors */
      .pt-color-swatches { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
      .pt-color-pair { display: flex; gap: 4px; }
      .pt-color-primary, .pt-color-secondary {
        width: 32px; height: 32px; border: 2px solid rgba(255, 0, 60, 0.3);
        border-radius: 6px; cursor: pointer; padding: 0;
      }
      .pt-color-primary { z-index: 2; }
      .pt-color-swap {
        background: none; border: none; color: #888; font-size: 16px; cursor: pointer;
      }
      .pt-color-swap:hover { color: #ff003c; }

      .pt-color-input-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
      .pt-color-input-row label { font-size: 10px; color: #888; }
      .pt-hex-input {
        width: 72px; padding: 3px 6px; font-size: 11px;
        background: rgba(20, 10, 35, 0.8); border: 1px solid rgba(255, 0, 60, 0.15);
        color: #ddd; border-radius: 3px; outline: none; font-family: monospace;
      }

      .pt-hsl-sliders { margin-bottom: 6px; }
      .pt-recent-colors { display: flex; flex-wrap: wrap; gap: 3px; }
      .pt-recent-swatch {
        width: 18px; height: 18px; border-radius: 3px; cursor: pointer;
        border: 1px solid rgba(255, 0, 60, 0.15); transition: transform 0.1s;
      }
      .pt-recent-swatch:hover { transform: scale(1.2); border-color: #ff003c; }

      /* Canvas Area */
      .pt-canvas-area {
        flex: 1; overflow: auto; background: rgba(5, 2, 10, 0.5);
        display: flex; align-items: flex-start; justify-content: flex-start;
        padding: 20px;
      }
      .pt-canvas-wrapper { position: relative; transform-origin: top left; }
      .pt-canvas {
        display: block; background: #fff;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      }
      .pt-overlay {
        position: absolute; top: 0; left: 0;
        pointer-events: auto; cursor: crosshair;
      }

      /* Layers */
      .pt-layer-add {
        background: rgba(255, 0, 60, 0.1); border: 1px solid rgba(255, 0, 60, 0.2);
        color: #aaa; width: 20px; height: 20px; border-radius: 3px;
        cursor: pointer; font-size: 12px;
      }
      .pt-layer-add:hover { color: #fff; }
      .pt-layer-list { display: flex; flex-direction: column; gap: 3px; }
      .pt-layer-item {
        display: flex; align-items: center; gap: 4px;
        padding: 4px 6px; border-radius: 4px; cursor: pointer;
        background: rgba(255, 0, 60, 0.03); border: 1px solid transparent;
      }
      .pt-layer-item:hover { background: rgba(255, 0, 60, 0.08); }
      .pt-layer-active { background: rgba(255, 0, 60, 0.12) !important; border-color: rgba(255, 0, 60, 0.2); }
      .pt-layer-vis { background: none; border: none; cursor: pointer; font-size: 12px; }
      .pt-layer-name { flex: 1; font-size: 10px; color: #aaa; }
      .pt-layer-del { background: none; border: none; color: #555; cursor: pointer; font-size: 10px; opacity: 0; }
      .pt-layer-item:hover .pt-layer-del { opacity: 1; }
      .pt-layer-del:hover { color: #ff003c; }

      .pt-info { font-size: 10px; color: #888; }
      .pt-info div { margin-bottom: 2px; }
    `;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.NexusPaint = NexusPaint;
}
