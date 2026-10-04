'use strict';
/**
 * NEXUS OS — SVG Editor
 * Vector shape creation, selection, move/resize, and SVG export
 * Pure vanilla JS, no external dependencies
 */

class NexusSVGEditor {
  constructor(container) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.svgNS = 'http://www.w3.org/2000/svg';
    this.canvasW = 600;
    this.canvasH = 450;
    this.tool = 'select';
    this.elements = [];
    this.selectedIdx = -1;
    this.fillColor = '#ff003c';
    this.strokeColor = '#ffffff';
    this.strokeWidth = 2;
    this.noFill = false;
    this.opacity = 1;
    this.undoStack = [];
    this.redoStack = [];
    this.dragStart = null;
    this.shapeStart = null;
    this.isDragging = false;
  }

  render() {
    this._loadCSS();
    this._buildUI();
    this._bindEvents();
    this._renderSVG();
  }

  destroy() {
    if (this._root) this._root.remove();
  }

  _loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'js/apps/media/svg-editor.css';
    document.head.appendChild(link);
  }

  _buildUI() {
    this._root = document.createElement('div');
    this._root.className = 'nse-root';
    this._root.innerHTML = `
      <div class="nse-toolbar">
        <div class="nse-tool active" data-tool="select" title="Select (V)">⬚</div>
        <div class="nse-tool" data-tool="rect" title="Rectangle (R)">▭</div>
        <div class="nse-tool" data-tool="ellipse" title="Ellipse (O)">◯</div>
        <div class="nse-tool" data-tool="line" title="Line (L)">╱</div>
        <div class="nse-tool" data-tool="path" title="Pen (P)">✎</div>
        <div class="nse-tool" data-tool="text" title="Text (T)">T</div>
        <div class="nse-tool" data-tool="polygon" title="Polygon">⬡</div>
        <div class="nse-tool-sep"></div>
        <div class="nse-tool" data-action="delete" title="Delete (Del)">🗑</div>
        <div class="nse-tool" data-action="duplicate" title="Duplicate">⧉</div>
        <div class="nse-tool" data-action="bringfront" title="Bring Front">⬆</div>
        <div class="nse-tool" data-action="sendback" title="Send Back">⬇</div>
        <div class="nse-tool-sep"></div>
        <div class="nse-tool" data-action="undo" title="Undo (Ctrl+Z)">↩</div>
        <div class="nse-tool" data-action="redo" title="Redo (Ctrl+Y)">↪</div>
      </div>
      <div class="nse-canvas-area">
        <div class="nse-svg-wrap" data-s="svgWrap">
          <div class="nse-svg-container" data-s="svgContainer">
            <svg xmlns="http://www.w3.org/2000/svg" width="${this.canvasW}" height="${this.canvasH}" data-s="svg"></svg>
          </div>
        </div>
        <div class="nse-bottom-bar">
          <button class="nse-bar-btn" data-s="clearBtn">Clear All</button>
          <div class="nse-spacer"></div>
          <span style="color:#666" data-s="statusBar">Ready</span>
          <div class="nse-spacer"></div>
          <button class="nse-bar-btn primary" data-s="exportSvg">💾 SVG</button>
          <button class="nse-bar-btn" data-s="exportPng">💾 PNG</button>
        </div>
      </div>
      <div class="nse-right">
        <div class="nse-panel-title">Properties</div>
        <div class="nse-section">Fill</div>
        <div class="nse-color-row">
          <input type="color" class="nse-color-input" data-s="fillInput" value="#ff003c">
          <input class="nse-color-hex" data-s="fillHex" value="#ff003c" maxlength="7">
          <label class="nse-no-fill"><input type="checkbox" data-s="noFill"> None</label>
        </div>
        <div class="nse-section">Stroke</div>
        <div class="nse-color-row">
          <input type="color" class="nse-color-input" data-s="strokeInput" value="#ffffff">
          <input class="nse-color-hex" data-s="strokeHex" value="#ffffff" maxlength="7">
        </div>
        <div class="nse-slider-row"><label>Width</label><input type="range" class="nse-slider" data-s="strokeWidthSlider" min="0" max="20" value="2"><span class="nse-slider-val" data-s="strokeWidthVal">2</span></div>
        <div class="nse-slider-row"><label>Opacity</label><input type="range" class="nse-slider" data-s="opacitySlider" min="0" max="100" value="100"><span class="nse-slider-val" data-s="opacityVal">100%</span></div>
        <div class="nse-section">Transform</div>
        <div class="nse-prop-row"><span class="nse-prop-label">X</span><input class="nse-prop-input" data-s="propX" type="number"><span class="nse-prop-label">Y</span><input class="nse-prop-input" data-s="propY" type="number"></div>
        <div class="nse-prop-row"><span class="nse-prop-label">W</span><input class="nse-prop-input" data-s="propW" type="number"><span class="nse-prop-label">H</span><input class="nse-prop-input" data-s="propH" type="number"></div>
        <div class="nse-section">Layers</div>
        <div class="nse-layer-list" data-s="layerList"></div>
      </div>`;
    this.container.appendChild(this._root);
    this.els = {};
    this._root.querySelectorAll('[data-s]').forEach(el => { this.els[el.dataset.s] = el; });
    this.svg = this.els.svg;
  }

  _bindEvents() {
    // Tool selection
    this._root.querySelectorAll('.nse-tool[data-tool]').forEach(el => {
      el.onclick = () => { this.tool = el.dataset.tool; this._root.querySelectorAll('.nse-tool[data-tool]').forEach(e => e.classList.toggle('active', e.dataset.tool === this.tool)); };
    });
    this._root.querySelectorAll('.nse-tool[data-action]').forEach(el => {
      el.onclick = () => this._handleAction(el.dataset.action);
    });

    // SVG mouse events
    this.svg.addEventListener('mousedown', (e) => this._onMouseDown(e));
    this.svg.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.svg.addEventListener('mouseup', (e) => this._onMouseUp(e));

    // Color controls
    this.els.fillInput.oninput = (e) => { this.fillColor = e.target.value; this.els.fillHex.value = this.fillColor; this._updateSelected(); };
    this.els.fillHex.onchange = (e) => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) { this.fillColor = e.target.value; this.els.fillInput.value = this.fillColor; this._updateSelected(); } };
    this.els.strokeInput.oninput = (e) => { this.strokeColor = e.target.value; this.els.strokeHex.value = this.strokeColor; this._updateSelected(); };
    this.els.strokeHex.onchange = (e) => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) { this.strokeColor = e.target.value; this.els.strokeInput.value = this.strokeColor; this._updateSelected(); } };
    this.els.noFill.onchange = () => { this.noFill = this.els.noFill.checked; this._updateSelected(); };
    this.els.strokeWidthSlider.oninput = (e) => { this.strokeWidth = +e.target.value; this.els.strokeWidthVal.textContent = this.strokeWidth; this._updateSelected(); };
    this.els.opacitySlider.oninput = (e) => { this.opacity = +e.target.value / 100; this.els.opacityVal.textContent = e.target.value + '%'; this._updateSelected(); };

    // Transform inputs
    ['propX', 'propY', 'propW', 'propH'].forEach(prop => {
      this.els[prop].onchange = () => this._applyTransform();
    });

    // Export
    this.els.exportSvg.onclick = () => this._exportSVG();
    this.els.exportPng.onclick = () => this._exportPNG();
    this.els.clearBtn.onclick = () => { this.elements = []; this.selectedIdx = -1; this._renderSVG(); this._saveUndo(); };

    // Keyboard
    this._root.tabIndex = 0;
    this._root.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this._undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); this._redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') this._handleAction('delete');
      if (e.key === 'v') { this.tool = 'select'; this._root.querySelectorAll('.nse-tool[data-tool]').forEach(el => el.classList.toggle('active', el.dataset.tool === 'select')); }
      if (e.key === 'r') { this.tool = 'rect'; this._root.querySelectorAll('.nse-tool[data-tool]').forEach(el => el.classList.toggle('active', el.dataset.tool === 'rect')); }
      if (e.key === 'o') { this.tool = 'ellipse'; this._root.querySelectorAll('.nse-tool[data-tool]').forEach(el => el.classList.toggle('active', el.dataset.tool === 'ellipse')); }
    });
  }

  _getSVGPos(e) {
    const rect = this.svg.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  _onMouseDown(e) {
    const pos = this._getSVGPos(e);
    if (this.tool === 'select') {
      // Hit test (reverse order for top elements)
      this.selectedIdx = -1;
      for (let i = this.elements.length - 1; i >= 0; i--) {
        if (this._hitTest(this.elements[i], pos)) { this.selectedIdx = i; break; }
      }
      if (this.selectedIdx >= 0) {
        this.isDragging = true;
        this.dragStart = { ...pos, origX: this.elements[this.selectedIdx].x, origY: this.elements[this.selectedIdx].y };
        this._loadProps();
      }
      this._renderSVG();
    } else if (this.tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        this.elements.push({ type: 'text', x: pos.x, y: pos.y, text, fill: this.fillColor, stroke: this.strokeColor, strokeWidth: this.strokeWidth, opacity: this.opacity, fontSize: 24 });
        this.selectedIdx = this.elements.length - 1;
        this._renderSVG();
        this._saveUndo();
      }
    } else {
      this.shapeStart = pos;
      this.isDragging = true;
    }
    this._renderLayers();
  }

  _onMouseMove(e) {
    const pos = this._getSVGPos(e);
    this.els.statusBar.textContent = `${Math.round(pos.x)}, ${Math.round(pos.y)}`;

    if (!this.isDragging) return;

    if (this.tool === 'select' && this.selectedIdx >= 0) {
      const el = this.elements[this.selectedIdx];
      el.x = this.dragStart.origX + (pos.x - this.dragStart.x);
      el.y = this.dragStart.origY + (pos.y - this.dragStart.y);
      this._renderSVG();
      this._loadProps();
    } else if (this.shapeStart) {
      // Preview shape
      this._renderSVG();
      this._drawPreview(pos);
    }
  }

  _onMouseUp(e) {
    if (!this.isDragging) return;
    const pos = this._getSVGPos(e);

    if (this.tool !== 'select' && this.shapeStart) {
      const x = Math.min(this.shapeStart.x, pos.x);
      const y = Math.min(this.shapeStart.y, pos.y);
      const w = Math.abs(pos.x - this.shapeStart.x);
      const h = Math.abs(pos.y - this.shapeStart.y);

      if (w > 3 || h > 3) {
        let el;
        if (this.tool === 'rect') {
          el = { type: 'rect', x, y, w: Math.max(w, 5), h: Math.max(h, 5), fill: this.noFill ? 'none' : this.fillColor, stroke: this.strokeColor, strokeWidth: this.strokeWidth, opacity: this.opacity };
        } else if (this.tool === 'ellipse') {
          el = { type: 'ellipse', cx: x + w / 2, cy: y + h / 2, rx: Math.max(w / 2, 3), ry: Math.max(h / 2, 3), x, y, w, h, fill: this.noFill ? 'none' : this.fillColor, stroke: this.strokeColor, strokeWidth: this.strokeWidth, opacity: this.opacity };
        } else if (this.tool === 'line') {
          el = { type: 'line', x1: this.shapeStart.x, y1: this.shapeStart.y, x2: pos.x, y2: pos.y, x: this.shapeStart.x, y: this.shapeStart.y, w: 0, h: 0, fill: 'none', stroke: this.strokeColor, strokeWidth: this.strokeWidth, opacity: this.opacity };
        } else if (this.tool === 'polygon') {
          const cx = x + w / 2, cy = y + h / 2, r = Math.max(w, h) / 2;
          const points = [];
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            points.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
          }
          el = { type: 'polygon', points: points.join(' '), x, y, w, h, fill: this.noFill ? 'none' : this.fillColor, stroke: this.strokeColor, strokeWidth: this.strokeWidth, opacity: this.opacity };
        } else if (this.tool === 'path') {
          el = { type: 'path', d: `M${this.shapeStart.x},${this.shapeStart.y} L${pos.x},${pos.y}`, x: Math.min(this.shapeStart.x, pos.x), y: Math.min(this.shapeStart.y, pos.y), w, h, fill: 'none', stroke: this.strokeColor, strokeWidth: this.strokeWidth, opacity: this.opacity };
        }
        if (el) {
          this.elements.push(el);
          this.selectedIdx = this.elements.length - 1;
          this._saveUndo();
        }
      }
    } else if (this.tool === 'select') {
      this._saveUndo();
    }

    this.isDragging = false;
    this.shapeStart = null;
    this._renderSVG();
    this._renderLayers();
  }

  _hitTest(el, pos) {
    const margin = 5;
    const ex = el.x - margin, ey = el.y - margin;
    const ew = (el.w || el.rx * 2 || 50) + margin * 2;
    const eh = (el.h || el.ry * 2 || 20) + margin * 2;
    return pos.x >= ex && pos.x <= ex + ew && pos.y >= ey && pos.y <= ey + eh;
  }

  _drawPreview(pos) {
    const s = this.shapeStart;
    let preview;
    if (this.tool === 'rect') {
      preview = document.createElementNS(this.svgNS, 'rect');
      preview.setAttribute('x', Math.min(s.x, pos.x));
      preview.setAttribute('y', Math.min(s.y, pos.y));
      preview.setAttribute('width', Math.abs(pos.x - s.x));
      preview.setAttribute('height', Math.abs(pos.y - s.y));
      preview.setAttribute('fill', this.noFill ? 'none' : this.fillColor);
      preview.setAttribute('stroke', this.strokeColor);
      preview.setAttribute('stroke-width', this.strokeWidth);
      preview.setAttribute('stroke-dasharray', '4,4');
      preview.setAttribute('opacity', '0.6');
    } else if (this.tool === 'ellipse') {
      preview = document.createElementNS(this.svgNS, 'ellipse');
      const cx = (s.x + pos.x) / 2, cy = (s.y + pos.y) / 2;
      preview.setAttribute('cx', cx);
      preview.setAttribute('cy', cy);
      preview.setAttribute('rx', Math.abs(pos.x - s.x) / 2);
      preview.setAttribute('ry', Math.abs(pos.y - s.y) / 2);
      preview.setAttribute('fill', this.noFill ? 'none' : this.fillColor);
      preview.setAttribute('stroke', this.strokeColor);
      preview.setAttribute('stroke-width', this.strokeWidth);
      preview.setAttribute('stroke-dasharray', '4,4');
      preview.setAttribute('opacity', '0.6');
    } else if (this.tool === 'line') {
      preview = document.createElementNS(this.svgNS, 'line');
      preview.setAttribute('x1', s.x); preview.setAttribute('y1', s.y);
      preview.setAttribute('x2', pos.x); preview.setAttribute('y2', pos.y);
      preview.setAttribute('stroke', this.strokeColor);
      preview.setAttribute('stroke-width', this.strokeWidth);
      preview.setAttribute('stroke-dasharray', '4,4');
      preview.setAttribute('opacity', '0.6');
    } else if (this.tool === 'path') {
      preview = document.createElementNS(this.svgNS, 'line');
      preview.setAttribute('x1', s.x); preview.setAttribute('y1', s.y);
      preview.setAttribute('x2', pos.x); preview.setAttribute('y2', pos.y);
      preview.setAttribute('stroke', '#ff003c');
      preview.setAttribute('stroke-width', 1);
      preview.setAttribute('stroke-dasharray', '3,3');
    } else if (this.tool === 'polygon') {
      const x = Math.min(s.x, pos.x), y = Math.min(s.y, pos.y);
      const w = Math.abs(pos.x - s.x), h = Math.abs(pos.y - s.y);
      const cx = x + w / 2, cy = y + h / 2, r = Math.max(w, h) / 2;
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        pts.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
      }
      preview = document.createElementNS(this.svgNS, 'polygon');
      preview.setAttribute('points', pts.join(' '));
      preview.setAttribute('fill', this.noFill ? 'none' : this.fillColor);
      preview.setAttribute('stroke', this.strokeColor);
      preview.setAttribute('stroke-width', this.strokeWidth);
      preview.setAttribute('opacity', '0.6');
    }
    if (preview) this.svg.appendChild(preview);
  }

  _renderSVG() {
    // Clear and re-render
    while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);

    // Background
    const bg = document.createElementNS(this.svgNS, 'rect');
    bg.setAttribute('width', this.canvasW);
    bg.setAttribute('height', this.canvasH);
    bg.setAttribute('fill', '#ffffff');
    this.svg.appendChild(bg);

    this.elements.forEach((el, idx) => {
      let node;
      if (el.type === 'rect') {
        node = document.createElementNS(this.svgNS, 'rect');
        node.setAttribute('x', el.x); node.setAttribute('y', el.y);
        node.setAttribute('width', el.w); node.setAttribute('height', el.h);
        node.setAttribute('fill', el.fill); node.setAttribute('stroke', el.stroke);
        node.setAttribute('stroke-width', el.strokeWidth); node.setAttribute('opacity', el.opacity);
      } else if (el.type === 'ellipse') {
        node = document.createElementNS(this.svgNS, 'ellipse');
        node.setAttribute('cx', el.cx); node.setAttribute('cy', el.cy);
        node.setAttribute('rx', el.rx); node.setAttribute('ry', el.ry);
        node.setAttribute('fill', el.fill); node.setAttribute('stroke', el.stroke);
        node.setAttribute('stroke-width', el.strokeWidth); node.setAttribute('opacity', el.opacity);
      } else if (el.type === 'line') {
        node = document.createElementNS(this.svgNS, 'line');
        node.setAttribute('x1', el.x1); node.setAttribute('y1', el.y1);
        node.setAttribute('x2', el.x2); node.setAttribute('y2', el.y2);
        node.setAttribute('stroke', el.stroke); node.setAttribute('stroke-width', el.strokeWidth);
        node.setAttribute('opacity', el.opacity);
      } else if (el.type === 'text') {
        node = document.createElementNS(this.svgNS, 'text');
        node.setAttribute('x', el.x); node.setAttribute('y', el.y);
        node.setAttribute('fill', el.fill); node.setAttribute('font-size', el.fontSize || 24);
        node.setAttribute('font-family', 'Segoe UI, sans-serif');
        node.setAttribute('opacity', el.opacity);
        node.textContent = el.text;
      } else if (el.type === 'polygon') {
        node = document.createElementNS(this.svgNS, 'polygon');
        node.setAttribute('points', el.points);
        node.setAttribute('fill', el.fill); node.setAttribute('stroke', el.stroke);
        node.setAttribute('stroke-width', el.strokeWidth); node.setAttribute('opacity', el.opacity);
      } else if (el.type === 'path') {
        node = document.createElementNS(this.svgNS, 'path');
        node.setAttribute('d', el.d);
        node.setAttribute('fill', el.fill); node.setAttribute('stroke', el.stroke);
        node.setAttribute('stroke-width', el.strokeWidth); node.setAttribute('opacity', el.opacity);
      }
      if (node) this.svg.appendChild(node);

      // Selection outline
      if (idx === this.selectedIdx) {
        const sel = document.createElementNS(this.svgNS, 'rect');
        const ex = (el.x || 0) - 3, ey = (el.y || 0) - 3;
        const ew = (el.w || el.rx * 2 || 50) + 6, eh = (el.h || el.ry * 2 || 20) + 6;
        sel.setAttribute('x', ex); sel.setAttribute('y', ey);
        sel.setAttribute('width', ew); sel.setAttribute('height', eh);
        sel.setAttribute('fill', 'none'); sel.setAttribute('stroke', '#ff003c');
        sel.setAttribute('stroke-width', 1); sel.setAttribute('stroke-dasharray', '4,3');
        this.svg.appendChild(sel);
      }
    });
  }

  _handleAction(action) {
    if (action === 'delete' && this.selectedIdx >= 0) {
      this.elements.splice(this.selectedIdx, 1);
      this.selectedIdx = -1;
      this._renderSVG(); this._renderLayers(); this._saveUndo();
    } else if (action === 'duplicate' && this.selectedIdx >= 0) {
      const copy = { ...this.elements[this.selectedIdx] };
      copy.x += 20; copy.y += 20;
      if (copy.cx) { copy.cx += 20; copy.cy += 20; }
      if (copy.x1) { copy.x1 += 20; copy.y1 += 20; copy.x2 += 20; copy.y2 += 20; }
      this.elements.push(copy);
      this.selectedIdx = this.elements.length - 1;
      this._renderSVG(); this._renderLayers(); this._saveUndo();
    } else if (action === 'bringfront' && this.selectedIdx >= 0 && this.selectedIdx < this.elements.length - 1) {
      const [el] = this.elements.splice(this.selectedIdx, 1);
      this.elements.push(el);
      this.selectedIdx = this.elements.length - 1;
      this._renderSVG(); this._renderLayers(); this._saveUndo();
    } else if (action === 'sendback' && this.selectedIdx > 0) {
      const [el] = this.elements.splice(this.selectedIdx, 1);
      this.elements.unshift(el);
      this.selectedIdx = 0;
      this._renderSVG(); this._renderLayers(); this._saveUndo();
    } else if (action === 'undo') this._undo();
    else if (action === 'redo') this._redo();
  }

  _loadProps() {
    if (this.selectedIdx < 0) return;
    const el = this.elements[this.selectedIdx];
    this.els.propX.value = Math.round(el.x || 0);
    this.els.propY.value = Math.round(el.y || 0);
    this.els.propW.value = Math.round(el.w || el.rx * 2 || 0);
    this.els.propH.value = Math.round(el.h || el.ry * 2 || 0);
    if (el.fill && el.fill !== 'none') { this.els.fillInput.value = el.fill; this.els.fillHex.value = el.fill; }
    this.els.strokeInput.value = el.stroke || '#ffffff';
    this.els.strokeHex.value = el.stroke || '#ffffff';
    this.els.strokeWidthSlider.value = el.strokeWidth || 2;
    this.els.strokeWidthVal.textContent = el.strokeWidth || 2;
    this.els.opacitySlider.value = (el.opacity || 1) * 100;
    this.els.opacityVal.textContent = Math.round((el.opacity || 1) * 100) + '%';
    this.els.noFill.checked = el.fill === 'none';
  }

  _updateSelected() {
    if (this.selectedIdx < 0) return;
    const el = this.elements[this.selectedIdx];
    el.fill = this.noFill ? 'none' : this.fillColor;
    el.stroke = this.strokeColor;
    el.strokeWidth = this.strokeWidth;
    el.opacity = this.opacity;
    this._renderSVG();
  }

  _applyTransform() {
    if (this.selectedIdx < 0) return;
    const el = this.elements[this.selectedIdx];
    el.x = +this.els.propX.value; el.y = +this.els.propY.value;
    el.w = +this.els.propW.value; el.h = +this.els.propH.value;
    if (el.type === 'rect') { /* w/h already */ }
    if (el.type === 'ellipse') { el.cx = el.x + el.w / 2; el.cy = el.y + el.h / 2; el.rx = el.w / 2; el.ry = el.h / 2; }
    this._renderSVG(); this._saveUndo();
  }

  _renderLayers() {
    const list = this.els.layerList;
    list.innerHTML = '';
    const icons = { rect: '▭', ellipse: '◯', line: '╱', text: 'T', polygon: '⬡', path: '✎' };
    for (let i = this.elements.length - 1; i >= 0; i--) {
      const el = this.elements[i];
      const div = document.createElement('div');
      div.className = 'nse-layer-item' + (i === this.selectedIdx ? ' selected' : '');
      div.innerHTML = `<span class="nse-layer-icon">${icons[el.type] || '?'}</span><span class="nse-layer-name">${el.type} ${i + 1}</span><button class="nse-layer-del">✕</button>`;
      div.onclick = () => { this.selectedIdx = i; this._renderSVG(); this._renderLayers(); this._loadProps(); };
      div.querySelector('.nse-layer-del').onclick = (e) => { e.stopPropagation(); this.elements.splice(i, 1); if (this.selectedIdx === i) this.selectedIdx = -1; this._renderSVG(); this._renderLayers(); this._saveUndo(); };
      list.appendChild(div);
    }
  }

  _saveUndo() {
    this.undoStack.push(JSON.stringify(this.elements));
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  }

  _undo() {
    if (this.undoStack.length <= 1) return;
    this.redoStack.push(this.undoStack.pop());
    this.elements = JSON.parse(this.undoStack[this.undoStack.length - 1]);
    this.selectedIdx = -1;
    this._renderSVG(); this._renderLayers();
  }

  _redo() {
    if (!this.redoStack.length) return;
    const state = this.redoStack.pop();
    this.undoStack.push(state);
    this.elements = JSON.parse(state);
    this.selectedIdx = -1;
    this._renderSVG(); this._renderLayers();
  }

  _exportSVG() {
    const svgClone = this.svg.cloneNode(true);
    svgClone.setAttribute('xmlns', this.svgNS);
    // Remove selection rectangle
    svgClone.querySelectorAll('[stroke-dasharray="4,3"]').forEach(el => el.remove());
    const svgString = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'nexus-artwork.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  _exportPNG() {
    const svgClone = this.svg.cloneNode(true);
    svgClone.querySelectorAll('[stroke-dasharray="4,3"]').forEach(el => el.remove());
    const svgString = new XMLSerializer().serializeToString(svgClone);
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = this.canvasW * 2;
      canvas.height = this.canvasH * 2;
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = 'nexus-artwork.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  }
}

window.NexusSVGEditor = NexusSVGEditor;
