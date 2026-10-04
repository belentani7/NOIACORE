'use strict';
/**
 * NEXUS OS — GIF Maker
 * Create animated GIFs from image frames with pure JS GIF89a encoding
 * No external dependencies — includes LZW encoder
 */

class NexusGifMaker {
  constructor(container) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.frames = [];
    this.frameDuration = 100; // ms per frame
    this.loopCount = 0; // 0 = infinite
    this.isPlaying = false;
    this.playIdx = 0;
    this.playTimer = null;
    this.selectedFrame = -1;
    this.maxDim = 400;
    this.quality = 10; // color quantization quality (1=best, 30=fast)
  }

  render() {
    this._loadCSS();
    this._buildUI();
    this._bindEvents();
  }

  destroy() {
    this._stopPlay();
    if (this._root) this._root.remove();
  }

  _loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'js/apps/media/gif-maker.css';
    document.head.appendChild(link);
  }

  _buildUI() {
    this._root = document.createElement('div');
    this._root.className = 'ngm-root';
    this._root.innerHTML = `
      <div class="ngm-left">
        <div class="ngm-preview-area" data-g="previewArea">
          <div class="ngm-empty" data-g="empty">
            <div class="ngm-empty-icon">🎞️</div>
            <div style="font-size:16px">Add frames to create an animated GIF</div>
            <button class="ngm-open-btn" data-g="addFramesBtn">+ Add Frames</button>
          </div>
          <canvas data-g="canvas" style="display:none"></canvas>
          <div class="ngm-drop-overlay" data-g="dropOverlay">Drop frames here</div>
        </div>
        <div class="ngm-bottom-bar">
          <button class="ngm-bar-btn" data-g="playBtn">▶ Play</button>
          <button class="ngm-bar-btn" data-g="stopBtn">⏹ Stop</button>
          <button class="ngm-bar-btn" data-g="prevBtn">⏮</button>
          <button class="ngm-bar-btn" data-g="nextBtn">⏭</button>
          <span style="color:#666;font-size:11px" data-g="frameCounter">0 / 0</span>
          <div class="ngm-bar-spacer"></div>
          <button class="ngm-bar-btn" data-g="addMoreBtn">+ Add</button>
          <button class="ngm-bar-btn primary" data-g="exportBtn">💾 Export GIF</button>
        </div>
      </div>
      <div class="ngm-right">
        <div class="ngm-sidebar-header">GIF Settings</div>
        <div class="ngm-sidebar-scroll">
          <div class="ngm-section-title">Frame Duration</div>
          <div class="ngm-row"><label>Delay</label><input type="range" class="ngm-slider" data-g="delaySlider" min="20" max="1000" value="100" step="10"><span class="ngm-val" data-g="delayVal">100ms</span></div>
          <div class="ngm-section-title">Loop</div>
          <select class="ngm-select" data-g="loopSelect">
            <option value="0">Infinite</option>
            <option value="1">Once</option>
            <option value="3">3 times</option>
            <option value="5">5 times</option>
            <option value="10">10 times</option>
          </select>
          <div class="ngm-section-title">Quality</div>
          <div class="ngm-row"><label>Colors</label><input type="range" class="ngm-slider" data-g="qualitySlider" min="1" max="30" value="10"><span class="ngm-val" data-g="qualityVal">10</span></div>
          <label class="ngm-checkbox"><input type="checkbox" data-g="ditherCheck" checked> Dithering</label>
          <div class="ngm-section-title">Frames</div>
          <div class="ngm-frame-strip" data-g="frameStrip"></div>
          <div style="display:flex;gap:4px">
            <button class="ngm-bar-btn" data-g="moveUpBtn">↑ Up</button>
            <button class="ngm-bar-btn" data-g="moveDownBtn">↓ Down</button>
            <button class="ngm-bar-btn" data-g="dupBtn">⧉ Dup</button>
            <button class="ngm-bar-btn" data-g="delBtn">🗑</button>
          </div>
          <div class="ngm-progress" data-g="progress"><div class="ngm-progress-bar" data-g="progressBar"></div></div>
          <div class="ngm-status" data-g="status"></div>
        </div>
      </div>
      <input type="file" accept="image/*" multiple style="display:none" data-g="fileInput">`;
    this.container.appendChild(this._root);
    this.els = {};
    this._root.querySelectorAll('[data-g]').forEach(el => { this.els[el.dataset.g] = el; });
    this.canvas = this.els.canvas;
    this.ctx = this.canvas.getContext('2d');
  }

  _bindEvents() {
    const e = this.els;

    // Add frames
    e.addFramesBtn.onclick = () => e.fileInput.click();
    e.addMoreBtn.onclick = () => e.fileInput.click();
    e.fileInput.onchange = (ev) => this._addFrames(ev.target.files);

    // Drag and drop
    const area = e.previewArea;
    area.ondragover = (ev) => { ev.preventDefault(); e.dropOverlay.classList.add('active'); };
    area.ondragleave = () => e.dropOverlay.classList.remove('active');
    area.ondrop = (ev) => {
      ev.preventDefault();
      e.dropOverlay.classList.remove('active');
      const files = [...ev.dataTransfer.files].filter(f => f.type.startsWith('image/'));
      if (files.length) this._addFrames(files);
    };

    // Playback
    e.playBtn.onclick = () => this._startPlay();
    e.stopBtn.onclick = () => this._stopPlay();
    e.prevBtn.onclick = () => { if (this.frames.length) { this.selectedFrame = (this.selectedFrame - 1 + this.frames.length) % this.frames.length; this._showFrame(this.selectedFrame); this._renderStrip(); } };
    e.nextBtn.onclick = () => { if (this.frames.length) { this.selectedFrame = (this.selectedFrame + 1) % this.frames.length; this._showFrame(this.selectedFrame); this._renderStrip(); } };

    // Settings
    e.delaySlider.oninput = () => { this.frameDuration = +e.delaySlider.value; e.delayVal.textContent = this.frameDuration + 'ms'; };
    e.loopSelect.onchange = () => { this.loopCount = +e.loopSelect.value; };
    e.qualitySlider.oninput = () => { this.quality = +e.qualitySlider.value; e.qualityVal.textContent = this.quality; };

    // Frame manipulation
    e.moveUpBtn.onclick = () => this._moveFrame(-1);
    e.moveDownBtn.onclick = () => this._moveFrame(1);
    e.dupBtn.onclick = () => this._duplicateFrame();
    e.delBtn.onclick = () => this._deleteFrame();

    // Export
    e.exportBtn.onclick = () => this._exportGIF();
  }

  _addFrames(files) {
    const promises = [...files].map(file => new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > this.maxDim || h > this.maxDim) {
          const scale = this.maxDim / Math.max(w, h);
          w = Math.floor(w * scale);
          h = Math.floor(h * scale);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ canvas, width: w, height: h, thumb: canvas.toDataURL('image/jpeg', 0.3) });
      };
      img.src = URL.createObjectURL(file);
    }));

    Promise.all(promises).then(frames => {
      this.frames.push(...frames);
      this.selectedFrame = this.frames.length - 1;
      this.els.empty.style.display = 'none';
      this.canvas.style.display = '';
      this._showFrame(this.selectedFrame);
      this._renderStrip();
    });
  }

  _showFrame(idx) {
    if (idx < 0 || idx >= this.frames.length) return;
    const frame = this.frames[idx];
    this.canvas.width = frame.width;
    this.canvas.height = frame.height;
    this.ctx.drawImage(frame.canvas, 0, 0);
    this.els.frameCounter.textContent = `${idx + 1} / ${this.frames.length}`;
  }

  _renderStrip() {
    const strip = this.els.frameStrip;
    strip.innerHTML = '';
    this.frames.forEach((frame, idx) => {
      const div = document.createElement('div');
      div.className = 'ngm-frame-item' + (idx === this.selectedFrame ? ' active' : '');
      div.innerHTML = `<img class="ngm-frame-thumb" src="${frame.thumb}"><div class="ngm-frame-info">#${idx + 1} <span>${frame.width}×${frame.height}</span></div>`;
      div.onclick = () => { this.selectedFrame = idx; this._showFrame(idx); this._renderStrip(); };
      strip.appendChild(div);
    });
  }

  _moveFrame(dir) {
    const idx = this.selectedFrame;
    const newIdx = idx + dir;
    if (idx < 0 || newIdx < 0 || newIdx >= this.frames.length) return;
    [this.frames[idx], this.frames[newIdx]] = [this.frames[newIdx], this.frames[idx]];
    this.selectedFrame = newIdx;
    this._renderStrip();
  }

  _duplicateFrame() {
    if (this.selectedFrame < 0) return;
    const frame = this.frames[this.selectedFrame];
    this.frames.splice(this.selectedFrame + 1, 0, { ...frame });
    this.selectedFrame++;
    this._renderStrip();
  }

  _deleteFrame() {
    if (this.selectedFrame < 0) return;
    this.frames.splice(this.selectedFrame, 1);
    this.selectedFrame = Math.min(this.selectedFrame, this.frames.length - 1);
    if (this.frames.length === 0) { this.els.empty.style.display = ''; this.canvas.style.display = 'none'; }
    else this._showFrame(this.selectedFrame);
    this._renderStrip();
  }

  _startPlay() {
    if (this.frames.length < 2) return;
    this.isPlaying = true;
    this.playIdx = 0;
    this.els.playBtn.classList.add('active');
    this._playNext();
  }

  _playNext() {
    if (!this.isPlaying) return;
    this._showFrame(this.playIdx);
    this.selectedFrame = this.playIdx;
    this._renderStrip();
    this.playIdx = (this.playIdx + 1) % this.frames.length;
    this.playTimer = setTimeout(() => this._playNext(), this.frameDuration);
  }

  _stopPlay() {
    this.isPlaying = false;
    clearTimeout(this.playTimer);
    this.els.playBtn.classList.remove('active');
  }

  // ─── GIF89a Encoder (Pure JS) ───
  async _exportGIF() {
    if (this.frames.length === 0) return;
    this.els.progress.classList.add('active');
    this.els.status.textContent = 'Encoding GIF...';
    this.els.progressBar.style.width = '0%';

    await new Promise(r => setTimeout(r, 50));

    try {
      const gif = this._encodeGIF();
      const blob = new Blob([gif], { type: 'image/gif' });
      const link = document.createElement('a');
      link.download = 'nexus-animation.gif';
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      this.els.status.textContent = `Done! ${(gif.byteLength / 1024).toFixed(1)} KB`;
      this.els.progressBar.style.width = '100%';
    } catch (err) {
      this.els.status.textContent = `Error: ${err.message}`;
    }
    setTimeout(() => this.els.progress.classList.remove('active'), 2000);
  }

  _encodeGIF() {
    const frames = this.frames;
    const w = frames[0].width;
    const h = frames[0].height;
    const delay = Math.round(this.frameDuration / 10); // GIF delay is in 1/100s

    // Build global color table from first frame (256 colors)
    const palette = this._quantizePalette(frames[0].canvas, 256);
    const colorTableSize = 256;
    const colorTableBits = 7; // 2^(7+1) = 256

    const bytes = [];
    const writeByte = (b) => bytes.push(b & 0xFF);
    const writeShort = (s) => { writeByte(s & 0xFF); writeByte((s >> 8) & 0xFF); };
    const writeStr = (s) => { for (let i = 0; i < s.length; i++) writeByte(s.charCodeAt(i)); };

    // Header
    writeStr('GIF89a');

    // Logical Screen Descriptor
    writeShort(w);
    writeShort(h);
    writeByte(0x80 | (colorTableBits << 4) | colorTableBits); // GCT flag, color resolution, GCT size
    writeByte(0); // BG color index
    writeByte(0); // Pixel aspect ratio

    // Global Color Table
    for (let i = 0; i < colorTableSize; i++) {
      writeByte(palette[i * 3] || 0);
      writeByte(palette[i * 3 + 1] || 0);
      writeByte(palette[i * 3 + 2] || 0);
    }

    // Netscape extension (looping)
    writeByte(0x21); // Extension
    writeByte(0xFF); // App extension
    writeByte(11); // Block size
    writeStr('NETSCAPE2.0');
    writeByte(3); // Sub-block size
    writeByte(1); // Sub-block ID
    writeShort(this.loopCount); // Loop count
    writeByte(0); // Terminator

    // Encode each frame
    for (let f = 0; f < frames.length; f++) {
      this.els.progressBar.style.width = `${((f + 1) / frames.length * 100).toFixed(0)}%`;
      this.els.status.textContent = `Encoding frame ${f + 1}/${frames.length}`;

      // Graphic Control Extension
      writeByte(0x21); // Extension
      writeByte(0xF9); // GCE
      writeByte(4); // Block size
      writeByte(0x04); // Disposal: restore to bg
      writeShort(delay); // Delay
      writeByte(0); // Transparent color (none)
      writeByte(0); // Terminator

      // Image Descriptor
      writeByte(0x2C); // Image separator
      writeShort(0); // Left
      writeShort(0); // Top
      writeShort(w); // Width
      writeShort(h); // Height
      writeByte(0); // No LCT

      // Get pixel indices
      const ctx = frames[f].canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, w, h);
      const pixels = this._mapToIndices(imageData.data, palette, w * h);

      // LZW encode
      const minCodeSize = 8;
      writeByte(minCodeSize);
      const lzwData = this._lzwEncode(pixels, minCodeSize);

      // Write sub-blocks
      let offset = 0;
      while (offset < lzwData.length) {
        const chunkSize = Math.min(255, lzwData.length - offset);
        writeByte(chunkSize);
        for (let i = 0; i < chunkSize; i++) writeByte(lzwData[offset + i]);
        offset += chunkSize;
      }
      writeByte(0); // Block terminator
    }

    // Trailer
    writeByte(0x3B);

    return new Uint8Array(bytes);
  }

  _quantizePalette(canvas, maxColors) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple median-cut quantization
    const pixels = [];
    for (let i = 0; i < data.length; i += 4) {
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }

    // Use uniform quantization for speed
    const palette = new Uint8Array(maxColors * 3);
    const step = Math.max(1, Math.floor(pixels.length / 5000));
    const sample = [];
    for (let i = 0; i < pixels.length; i += step) sample.push(pixels[i]);

    // Simple bucket approach
    const buckets = [sample];
    while (buckets.length < maxColors) {
      let maxRange = -1, maxIdx = 0;
      for (let i = 0; i < buckets.length; i++) {
        const b = buckets[i];
        if (b.length < 2) continue;
        for (let ch = 0; ch < 3; ch++) {
          let min = 255, max = 0;
          for (const p of b) { if (p[ch] < min) min = p[ch]; if (p[ch] > max) max = p[ch]; }
          const range = max - min;
          if (range > maxRange) { maxRange = range; maxIdx = i; }
        }
      }
      const bucket = buckets[maxIdx];
      if (bucket.length < 2) break;

      // Find channel with largest range
      let bestCh = 0, bestRange = 0;
      for (let ch = 0; ch < 3; ch++) {
        let min = 255, max = 0;
        for (const p of bucket) { if (p[ch] < min) min = p[ch]; if (p[ch] > max) max = p[ch]; }
        if (max - min > bestRange) { bestRange = max - min; bestCh = ch; }
      }

      bucket.sort((a, b) => a[bestCh] - b[bestCh]);
      const mid = Math.floor(bucket.length / 2);
      buckets.splice(maxIdx, 1, bucket.slice(0, mid), bucket.slice(mid));
    }

    for (let i = 0; i < maxColors; i++) {
      if (i < buckets.length && buckets[i].length > 0) {
        const b = buckets[i];
        let r = 0, g = 0, bl = 0;
        for (const p of b) { r += p[0]; g += p[1]; bl += p[2]; }
        palette[i * 3] = Math.round(r / b.length);
        palette[i * 3 + 1] = Math.round(g / b.length);
        palette[i * 3 + 2] = Math.round(bl / b.length);
      }
    }

    return palette;
  }

  _mapToIndices(data, palette, count) {
    const indices = new Uint8Array(count);
    const cache = new Map();
    for (let i = 0; i < count; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      if (cache.has(key)) {
        indices[i] = cache.get(key);
      } else {
        let bestDist = Infinity, bestIdx = 0;
        for (let j = 0; j < 256; j++) {
          const dr = r - palette[j * 3];
          const dg = g - palette[j * 3 + 1];
          const db = b - palette[j * 3 + 2];
          const dist = dr * dr + dg * dg + db * db;
          if (dist < bestDist) { bestDist = dist; bestIdx = j; if (dist === 0) break; }
        }
        cache.set(key, bestIdx);
        indices[i] = bestIdx;
      }
    }
    return indices;
  }

  _lzwEncode(pixels, minCodeSize) {
    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    const maxCode = 4096;

    // Initialize code table
    let codeTable = new Map();
    const resetTable = () => {
      codeTable = new Map();
      for (let i = 0; i < clearCode; i++) {
        codeTable.set(String(i), i);
      }
      nextCode = eoiCode + 1;
      codeSize = minCodeSize + 1;
    };
    resetTable();

    // Bit packing
    const output = [];
    let bitBuf = 0, bitCount = 0;
    const writeBits = (code, size) => {
      bitBuf |= code << bitCount;
      bitCount += size;
      while (bitCount >= 8) {
        output.push(bitBuf & 0xFF);
        bitBuf >>= 8;
        bitCount -= 8;
      }
    };

    // Encode
    writeBits(clearCode, codeSize);

    if (pixels.length === 0) {
      writeBits(eoiCode, codeSize);
      if (bitCount > 0) output.push(bitBuf & 0xFF);
      return output;
    }

    let current = String(pixels[0]);

    for (let i = 1; i < pixels.length; i++) {
      const next = String(pixels[i]);
      const combined = current + ',' + next;

      if (codeTable.has(combined)) {
        current = combined;
      } else {
        writeBits(codeTable.get(current), codeSize);

        if (nextCode < maxCode) {
          codeTable.set(combined, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
        } else {
          writeBits(clearCode, codeSize);
          resetTable();
        }
        current = next;
      }
    }

    writeBits(codeTable.get(current), codeSize);
    writeBits(eoiCode, codeSize);
    if (bitCount > 0) output.push(bitBuf & 0xFF);

    return output;
  }
}

window.NexusGifMaker = NexusGifMaker;
