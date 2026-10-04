'use strict';
/**
 * NEXUS OS — Pixel Art Editor
 * Grid-based pixel art with tools, layers, palette, and export
 * Pure vanilla JS, no external dependencies
 */

class NexusPixelArt {
  constructor(container) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.gridW = 32;
    this.gridH = 32;
    this.zoom = 12;
    this.tool = 'pen';
    this.color = '#ff003c';
    this.layers = [];
    this.activeLayer = 0;
    this.showGrid = true;
    this.isDrawing = false;
    this.undoStack = [];
    this.redoStack = [];
    this.palette = [
      '#000000','#ffffff','#ff003c','#ff6600','#ffcc00','#00ff88','#00ccff','#9966ff',
      '#ff69b4','#8b4513','#808080','#c0c0c0','#ff4444','#ff8800','#ffff00','#44ff44',
      '#4488ff','#aa44ff','#ff4488','#664422','#444444','#888888','#cc0000','#cc6600',
      '#cccc00','#00cc00','#0066cc','#6600cc','#cc0066','#332211','#222222','#666666'
    ];
  }

  render() {
    this._loadCSS();
    this._buildUI();
    this._initLayers();
    this._bindEvents();
    this._renderCanvas();
  }

  destroy() {
    if (this._root) this._root.remove();
  }

  _loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'js/apps/media/pixel-art.css';
    document.head.appendChild(link);
  }

  _buildUI() {
    this._root = document.createElement('div');
    this._root.className = 'npa-root';
    this._root.innerHTML = `
      <div class="npa-toolbar">
        <div class="npa-tool active" data-tool="pen" title="Pen (P)">✏️</div>
        <div class="npa-tool" data-tool="eraser" title="Eraser (E)">🧽</div>
        <div class="npa-tool" data-tool="fill" title="Fill (G)">🪣</div>
        <div class="npa-tool" data-tool="line" title="Line (L)">📏</div>
        <div class="npa-tool" data-tool="rect" title="Rectangle (R)">▭</div>
        <div class="npa-tool" data-tool="circle" title="Circle (C)">◯</div>
        <div class="npa-tool" data-tool="picker" title="Eyedropper (I)">💉</div>
        <div class="npa-tool" data-tool="move" title="Move (M)">✥</div>
        <div class="npa-tool-sep"></div>
        <div class="npa-tool" data-action="undo" title="Undo (Ctrl+Z)">↩</div>
        <div class="npa-tool" data-action="redo" title="Redo (Ctrl+Y)">↪</div>
        <div class="npa-tool-sep"></div>
        <div class="npa-tool" data-action="grid" title="Toggle Grid">▦</div>
        <div class="npa-tool" data-action="clear" title="Clear Layer">🗑</div>
      </div>
      <div class="npa-canvas-area">
        <div class="npa-canvas-wrap" data-p="canvasWrap">
          <div class="npa-canvas-container" data-p="canvasContainer">
            <canvas data-p="pixelCanvas"></canvas>
            <canvas data-p="overlayCanvas"></canvas>
            <canvas data-p="gridCanvas" class="npa-grid-overlay"></canvas>
          </div>
        </div>
        <div class="npa-bottom-bar">
          <span data-p="info">32×32</span>
          <button class="npa-zoom-btn" data-p="zoomOut">−</button>
          <span data-p="zoomLabel">×12</span>
          <button class="npa-zoom-btn" data-p="zoomIn">+</button>
          <div class="npa-spacer"></div>
          <button class="npa-bar-btn" data-p="resizeBtn">Resize</button>
          <button class="npa-bar-btn primary" data-p="exportPng">💾 PNG</button>
          <button class="npa-bar-btn" data-p="exportGif">💾 GIF</button>
        </div>
      </div>
      <div class="npa-right">
        <div class="npa-panel-title">Color</div>
        <div class="npa-color-main">
          <input type="color" class="npa-color-swatch" data-p="colorPicker" value="#ff003c">
          <input class="npa-color-hex" data-p="hexInput" value="#ff003c" maxlength="7">
        </div>
        <div class="npa-section">Palette</div>
        <div class="npa-palette" data-p="palette"></div>
        <div class="npa-section">Layers</div>
        <div class="npa-layer-list" data-p="layerList"></div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="npa-bar-btn" data-p="addLayer">+ Layer</button>
          <button class="npa-bar-btn" data-p="delLayer">− Layer</button>
        </div>
        <div class="npa-section">Canvas Size</div>
        <div class="npa-size-row">
          <input class="npa-size-input" data-p="wInput" value="32" type="number" min="4" max="256">
          <span class="npa-size-x">×</span>
          <input class="npa-size-input" data-p="hInput" value="32" type="number" min="4" max="256">
          <button class="npa-bar-btn" data-p="applySize">OK</button>
        </div>
      </div>`;
    this.container.appendChild(this._root);
    this.els = {};
    this._root.querySelectorAll('[data-p]').forEach(el => { this.els[el.dataset.p] = el; });

    this.pixelCanvas = this.els.pixelCanvas;
    this.overlayCanvas = this.els.overlayCanvas;
    this.gridCanvas = this.els.gridCanvas;
    this.pixelCtx = this.pixelCanvas.getContext('2d');
    this.overlayCtx = this.overlayCanvas.getContext('2d');
    this.gridCtx = this.gridCanvas.getContext('2d');

    this._renderPalette();
  }

  _initLayers() {
    this.layers = [{ name: 'Layer 1', visible: true, data: {} }];
    this.activeLayer = 0;
    this._updateCanvasSize();
    this._renderLayers();
    this._saveUndo();
  }

  _updateCanvasSize() {
    const w = this.gridW * this.zoom;
    const h = this.gridH * this.zoom;
    for (const c of [this.pixelCanvas, this.overlayCanvas, this.gridCanvas]) {
      c.width = w;
      c.height = h;
      c.style.width = w + 'px';
      c.style.height = h + 'px';
    }
    this.els.canvasContainer.style.width = w + 'px';
    this.els.canvasContainer.style.height = h + 'px';
    this.els.info.textContent = `${this.gridW}×${this.gridH}`;
    this.els.wInput.value = this.gridW;
    this.els.hInput.value = this.gridH;
    this._drawGrid();
  }

  _drawGrid() {
    const ctx = this.gridCtx;
    const w = this.gridW * this.zoom;
    const h = this.gridH * this.zoom;
    ctx.clearRect(0, 0, w, h);
    if (!this.showGrid) return;
    ctx.strokeStyle = 'rgba(255,0,60,0.1)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= this.gridW; x++) {
      ctx.beginPath(); ctx.moveTo(x * this.zoom, 0); ctx.lineTo(x * this.zoom, h); ctx.stroke();
    }
    for (let y = 0; y <= this.gridH; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * this.zoom); ctx.lineTo(w, y * this.zoom); ctx.stroke();
    }
  }

  _bindEvents() {
    // Tool selection
    this._root.querySelectorAll('.npa-tool').forEach(el => {
      if (el.dataset.tool) el.onclick = () => this._selectTool(el.dataset.tool);
      if (el.dataset.action) el.onclick = () => this._handleAction(el.dataset.action);
    });

    // Canvas mouse events
    const oc = this.overlayCanvas;
    oc.addEventListener('mousedown', (e) => this._onMouseDown(e));
    oc.addEventListener('mousemove', (e) => this._onMouseMove(e));
    oc.addEventListener('mouseup', () => this._onMouseUp());
    oc.addEventListener('mouseleave', () => this._onMouseUp());

    // Color
    this.els.colorPicker.oninput = (e) => { this.color = e.target.value; this.els.hexInput.value = this.color; };
    this.els.hexInput.onchange = (e) => {
      if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
        this.color = e.target.value; this.els.colorPicker.value = this.color;
      }
    };

    // Zoom
    this.els.zoomIn.onclick = () => { this.zoom = Math.min(32, this.zoom + 2); this.els.zoomLabel.textContent = `×${this.zoom}`; this._updateCanvasSize(); this._renderCanvas(); };
    this.els.zoomOut.onclick = () => { this.zoom = Math.max(2, this.zoom - 2); this.els.zoomLabel.textContent = `×${this.zoom}`; this._updateCanvasSize(); this._renderCanvas(); };

    // Layers
    this.els.addLayer.onclick = () => this._addLayer();
    this.els.delLayer.onclick = () => this._deleteLayer();

    // Resize
    this.els.applySize.onclick = () => {
      const nw = Math.max(4, Math.min(256, +this.els.wInput.value));
      const nh = Math.max(4, Math.min(256, +this.els.hInput.value));
      if (nw !== this.gridW || nh !== this.gridH) {
        this.gridW = nw; this.gridH = nh;
        // Resize all layers
        for (const layer of this.layers) {
          const newData = {};
          for (const [key, val] of Object.entries(layer.data)) {
            const [x, y] = key.split(',').map(Number);
            if (x < nw && y < nh) newData[key] = val;
          }
          layer.data = newData;
        }
        this._updateCanvasSize();
        this._renderCanvas();
      }
    };

    // Export
    this.els.exportPng.onclick = () => this._exportPNG();
    this.els.exportGif.onclick = () => this._exportPNG(); // Fallback to PNG for GIF

    // Keyboard shortcuts
    this._root.tabIndex = 0;
    this._root.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this._undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); this._redo(); }
      if (e.key === 'p') this._selectTool('pen');
      if (e.key === 'e') this._selectTool('eraser');
      if (e.key === 'g') this._selectTool('fill');
      if (e.key === 'l') this._selectTool('line');
      if (e.key === 'r') this._selectTool('rect');
      if (e.key === 'c' && !e.ctrlKey) this._selectTool('circle');
      if (e.key === 'i') this._selectTool('picker');
      if (e.key === 'm') this._selectTool('move');
    });
  }

  _selectTool(tool) {
    this.tool = tool;
    this._root.querySelectorAll('.npa-tool[data-tool]').forEach(el => {
      el.classList.toggle('active', el.dataset.tool === tool);
    });
    this.overlayCanvas.style.cursor = tool === 'picker' ? 'crosshair' : 'crosshair';
  }

  _handleAction(action) {
    if (action === 'undo') this._undo();
    if (action === 'redo') this._redo();
    if (action === 'grid') { this.showGrid = !this.showGrid; this._drawGrid(); }
    if (action === 'clear') { this.layers[this.activeLayer].data = {}; this._renderCanvas(); this._saveUndo(); }
  }

  _getGridPos(e) {
    const rect = this.overlayCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.zoom);
    const y = Math.floor((e.clientY - rect.top) / this.zoom);
    return { x: Math.max(0, Math.min(this.gridW - 1, x)), y: Math.max(0, Math.min(this.gridH - 1, y)) };
  }

  _onMouseDown(e) {
    const pos = this._getGridPos(e);
    this.isDrawing = true;
    this.lastPos = pos;
    this.shapeStart = pos;

    const layer = this.layers[this.activeLayer];
    if (this.tool === 'pen') { this._setPixel(layer, pos.x, pos.y, this.color); this._renderCanvas(); }
    if (this.tool === 'eraser') { delete layer.data[`${pos.x},${pos.y}`]; this._renderCanvas(); }
    if (this.tool === 'fill') { this._floodFill(pos.x, pos.y, this.color); this._renderCanvas(); this._saveUndo(); this.isDrawing = false; }
    if (this.tool === 'picker') {
      for (let i = this.layers.length - 1; i >= 0; i--) {
        if (!this.layers[i].visible) continue;
        const c = this.layers[i].data[`${pos.x},${pos.y}`];
        if (c) { this.color = c; this.els.colorPicker.value = c; this.els.hexInput.value = c; break; }
      }
      this.isDrawing = false;
    }
  }

  _onMouseMove(e) {
    if (!this.isDrawing) return;
    const pos = this._getGridPos(e);
    const layer = this.layers[this.activeLayer];

    if (this.tool === 'pen') {
      this._drawLine(layer, this.lastPos, pos, this.color);
      this.lastPos = pos;
      this._renderCanvas();
    } else if (this.tool === 'eraser') {
      this._drawLine(layer, this.lastPos, pos, null);
      this.lastPos = pos;
      this._renderCanvas();
    } else if (this.tool === 'line' || this.tool === 'rect' || this.tool === 'circle') {
      this._drawShapePreview(pos);
    }
  }

  _onMouseUp() {
    if (!this.isDrawing) return;
    if (this.tool === 'line' || this.tool === 'rect' || this.tool === 'circle') {
      // Apply shape to layer
      const layer = this.layers[this.activeLayer];
      const imgData = this.overlayCtx.getImageData(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
      // Read from overlay and apply to layer data
      for (let y = 0; y < this.gridH; y++) {
        for (let x = 0; x < this.gridW; x++) {
          const px = x * this.zoom;
          const py = y * this.zoom;
          const idx = (py * this.overlayCanvas.width + px) * 4;
          if (imgData.data[idx + 3] > 0) {
            const r = imgData.data[idx], g = imgData.data[idx + 1], b = imgData.data[idx + 2];
            layer.data[`${x},${y}`] = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          }
        }
      }
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
      this._renderCanvas();
    }
    this.isDrawing = false;
    this._saveUndo();
  }

  _setPixel(layer, x, y, color) {
    if (x < 0 || x >= this.gridW || y < 0 || y >= this.gridH) return;
    layer.data[`${x},${y}`] = color;
  }

  _drawLine(layer, from, to, color) {
    const dx = Math.abs(to.x - from.x), dy = Math.abs(to.y - from.y);
    const sx = from.x < to.x ? 1 : -1, sy = from.y < to.y ? 1 : -1;
    let err = dx - dy, x = from.x, y = from.y;
    while (true) {
      if (color) this._setPixel(layer, x, y, color);
      else delete layer.data[`${x},${y}`];
      if (x === to.x && y === to.y) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  _floodFill(startX, startY, fillColor) {
    const layer = this.layers[this.activeLayer];
    const targetColor = layer.data[`${startX},${startY}`] || null;
    if (targetColor === fillColor) return;
    const stack = [[startX, startY]];
    const visited = new Set();
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;
      if (x < 0 || x >= this.gridW || y < 0 || y >= this.gridH) continue;
      if (visited.has(key)) continue;
      if ((layer.data[key] || null) !== targetColor) continue;
      visited.add(key);
      layer.data[key] = fillColor;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  _drawShapePreview(pos) {
    const ctx = this.overlayCtx;
    ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.6;
    const s = this.shapeStart;

    if (this.tool === 'line') {
      const dx = Math.abs(pos.x - s.x), dy = Math.abs(pos.y - s.y);
      const sx = s.x < pos.x ? 1 : -1, sy = s.y < pos.y ? 1 : -1;
      let err = dx - dy, x = s.x, y = s.y;
      while (true) {
        ctx.fillRect(x * this.zoom, y * this.zoom, this.zoom, this.zoom);
        if (x === pos.x && y === pos.y) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
      }
    } else if (this.tool === 'rect') {
      const minX = Math.min(s.x, pos.x), minY = Math.min(s.y, pos.y);
      const maxX = Math.max(s.x, pos.x), maxY = Math.max(s.y, pos.y);
      for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) {
        if (x === minX || x === maxX || y === minY || y === maxY)
          ctx.fillRect(x * this.zoom, y * this.zoom, this.zoom, this.zoom);
      }
    } else if (this.tool === 'circle') {
      const cx = (s.x + pos.x) / 2, cy = (s.y + pos.y) / 2;
      const rx = Math.abs(pos.x - s.x) / 2, ry = Math.abs(pos.y - s.y) / 2;
      const steps = Math.max(rx, ry) * 8;
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const px = Math.round(cx + Math.cos(angle) * rx);
        const py = Math.round(cy + Math.sin(angle) * ry);
        ctx.fillRect(px * this.zoom, py * this.zoom, this.zoom, this.zoom);
      }
    }
    ctx.globalAlpha = 1;
  }

  _renderCanvas() {
    const ctx = this.pixelCtx;
    const w = this.gridW * this.zoom;
    const h = this.gridH * this.zoom;
    // Checkerboard background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);
    const checkSize = this.zoom;
    for (let y = 0; y < this.gridH; y++) {
      for (let x = 0; x < this.gridW; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = '#161628';
          ctx.fillRect(x * checkSize, y * checkSize, checkSize, checkSize);
        }
      }
    }
    // Draw layers bottom to top
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      for (const [key, color] of Object.entries(layer.data)) {
        const [x, y] = key.split(',').map(Number);
        ctx.fillStyle = color;
        ctx.fillRect(x * this.zoom, y * this.zoom, this.zoom, this.zoom);
      }
    }
  }

  _renderPalette() {
    const pal = this.els.palette;
    pal.innerHTML = '';
    for (const color of this.palette) {
      const div = document.createElement('div');
      div.className = 'npa-palette-color' + (color === this.color ? ' active' : '');
      div.style.background = color;
      div.onclick = () => { this.color = color; this.els.colorPicker.value = color; this.els.hexInput.value = color; this._renderPalette(); };
      pal.appendChild(div);
    }
  }

  _addLayer() {
    this.layers.push({ name: `Layer ${this.layers.length + 1}`, visible: true, data: {} });
    this.activeLayer = this.layers.length - 1;
    this._renderLayers();
  }

  _deleteLayer() {
    if (this.layers.length <= 1) return;
    this.layers.splice(this.activeLayer, 1);
    this.activeLayer = Math.min(this.activeLayer, this.layers.length - 1);
    this._renderLayers();
    this._renderCanvas();
  }

  _renderLayers() {
    const list = this.els.layerList;
    list.innerHTML = '';
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      const div = document.createElement('div');
      div.className = 'npa-layer-item' + (i === this.activeLayer ? ' active' : '');
      div.innerHTML = `
        <button class="npa-layer-vis">${layer.visible ? '👁' : '○'}</button>
        <span class="npa-layer-name">${layer.name}</span>`;
      div.querySelector('.npa-layer-vis').onclick = (e) => { e.stopPropagation(); layer.visible = !layer.visible; this._renderLayers(); this._renderCanvas(); };
      div.onclick = () => { this.activeLayer = i; this._renderLayers(); };
      list.appendChild(div);
    }
  }

  _saveUndo() {
    const state = this.layers.map(l => ({ ...l, data: { ...l.data } }));
    this.undoStack.push(JSON.stringify(state));
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  }

  _undo() {
    if (this.undoStack.length <= 1) return;
    const current = this.undoStack.pop();
    this.redoStack.push(current);
    const prev = JSON.parse(this.undoStack[this.undoStack.length - 1]);
    this.layers = prev;
    this.activeLayer = Math.min(this.activeLayer, this.layers.length - 1);
    this._renderLayers();
    this._renderCanvas();
  }

  _redo() {
    if (!this.redoStack.length) return;
    const state = this.redoStack.pop();
    this.undoStack.push(state);
    this.layers = JSON.parse(state);
    this.activeLayer = Math.min(this.activeLayer, this.layers.length - 1);
    this._renderLayers();
    this._renderCanvas();
  }

  _exportPNG() {
    // Render at 1:1 scale
    const canvas = document.createElement('canvas');
    canvas.width = this.gridW;
    canvas.height = this.gridH;
    const ctx = canvas.getContext('2d');
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      for (const [key, color] of Object.entries(layer.data)) {
        const [x, y] = key.split(',').map(Number);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Scale up for nice export
    const exportCanvas = document.createElement('canvas');
    const scale = Math.max(1, Math.floor(512 / Math.max(this.gridW, this.gridH)));
    exportCanvas.width = this.gridW * scale;
    exportCanvas.height = this.gridH * scale;
    const ectx = exportCanvas.getContext('2d');
    ectx.imageSmoothingEnabled = false;
    ectx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
    const link = document.createElement('a');
    link.download = 'nexus-pixel-art.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }
}

window.NexusPixelArt = NexusPixelArt;
