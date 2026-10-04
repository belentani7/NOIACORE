'use strict';
/**
 * NEXUS OS — QR Code Generator
 * Pure JS QR code generation with canvas rendering
 * No external dependencies
 */

class NexusQRGenerator {
  constructor(container) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.fgColor = '#000000';
    this.bgColor = '#ffffff';
    this.size = 256;
    this.errorCorrection = 'M';
  }

  render() {
    this._loadCSS();
    this._buildUI();
    this._bindEvents();
    this._generate();
  }

  destroy() {
    if (this._styleEl) this._styleEl.remove();
    if (this._root) this._root.remove();
  }

  _loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'js/apps/media/qr-generator.css';
    document.head.appendChild(link);
  }

  _buildUI() {
    this._root = document.createElement('div');
    this._root.className = 'nqr-root';
    this._root.innerHTML = `
      <div class="nqr-left">
        <div class="nqr-preview" data-q="preview"><div class="nqr-preview-empty">Type something to generate QR code</div></div>
      </div>
      <div class="nqr-right">
        <div class="nqr-title">QR Code Generator</div>
        <div class="nqr-section">Content</div>
        <textarea class="nqr-input" data-q="input" placeholder="Enter text, URL, email, phone...">https://nexus-os.dev</textarea>
        <div class="nqr-section">Options</div>
        <div class="nqr-row"><label>Size</label><input type="range" class="nqr-slider" data-q="sizeSlider" min="128" max="512" value="256"><span class="nqr-val" data-q="sizeVal">256</span></div>
        <div class="nqr-row"><label>Error Correction</label><select class="nqr-select" data-q="ecSelect"><option value="L">Low (7%)</option><option value="M" selected>Medium (15%)</option><option value="Q">Quartile (25%)</option><option value="H">High (30%)</option></select></div>
        <div class="nqr-section">Colors</div>
        <div class="nqr-row"><label>Foreground</label><input type="color" class="nqr-color-input" data-q="fgColor" value="#000000"><label style="margin-left:12px">Background</label><input type="color" class="nqr-color-input" data-q="bgColor" value="#ffffff"></div>
        <div class="nqr-section">Actions</div>
        <div class="nqr-btn-row">
          <button class="nqr-btn" data-q="downloadPng">💾 PNG</button>
          <button class="nqr-btn secondary" data-q="downloadSvg">💾 SVG</button>
        </div>
        <button class="nqr-btn secondary" data-q="copyBtn" style="margin-top:4px">📋 Copy to Clipboard</button>
      </div>`;
    this.container.appendChild(this._root);
    this.els = {};
    this._root.querySelectorAll('[data-q]').forEach(el => { this.els[el.dataset.q] = el; });
  }

  _bindEvents() {
    const e = this.els;
    let timer;
    e.input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => this._generate(), 200); });
    e.sizeSlider.addEventListener('input', () => { this.size = +e.sizeSlider.value; e.sizeVal.textContent = this.size; this._generate(); });
    e.ecSelect.addEventListener('change', () => { this.errorCorrection = e.ecSelect.value; this._generate(); });
    e.fgColor.addEventListener('input', () => { this.fgColor = e.fgColor.value; this._generate(); });
    e.bgColor.addEventListener('input', () => { this.bgColor = e.bgColor.value; this._generate(); });
    e.downloadPng.onclick = () => this._downloadPNG();
    e.downloadSvg.onclick = () => this._downloadSVG();
    e.copyBtn.onclick = () => this._copyToClipboard();
  }

  // ─── QR CODE ENCODING (Pure JS, Version 1-10, EC: L/M/Q/H) ───
  _generate() {
    const text = this.els.input.value.trim();
    if (!text) { this.els.preview.innerHTML = '<div class="nqr-preview-empty">Type something to generate QR code</div>'; return; }
    try {
      const matrix = this._encode(text, this.errorCorrection);
      this._renderMatrix(matrix);
      this._lastMatrix = matrix;
    } catch (err) {
      this.els.preview.innerHTML = `<div class="nqr-preview-empty" style="color:#ff003c">Error: ${err.message}</div>`;
    }
  }

  _encode(text, ec) {
    // QR encoding: determine version, encode data, add EC, interleave, place modules
    const ecLevels = { L: 0, M: 1, Q: 2, H: 3 };
    const ecLevel = ecLevels[ec] || 1;
    const bytes = new TextEncoder().encode(text);

    // Version capacities (byte mode) for EC levels L,M,Q,H
    const caps = [
      [17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],
      [134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],
      [321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],
      [520,412,292,220],[586,450,322,250],[644,504,364,280],[718,560,394,310],
      [792,624,442,338],[858,666,482,382],[929,711,509,403],[1003,779,565,439],
      [1091,857,611,461],[1171,911,661,511],[1273,997,715,535],[1367,1059,751,593],
      [1465,1125,805,625],[1528,1190,868,658],[1628,1264,908,698],[1732,1370,982,742],
      [1840,1452,1030,790],[1952,1538,1112,842],[2068,1628,1168,898],[2188,1722,1228,958],
      [2303,1809,1283,983],[2431,1911,1351,1051],[2563,1989,1423,1093],[2699,2099,1499,1139],
      [2809,2213,1579,1219],[2953,2331,1663,1273]
    ];

    let version = 1;
    for (; version <= 40; version++) {
      if (caps[version - 1][ecLevel] >= bytes.length) break;
    }
    if (version > 40) throw new Error('Text too long for QR');

    const size = version * 4 + 17;
    const matrix = Array.from({ length: size }, () => Array(size).fill(null));
    const reserved = Array.from({ length: size }, () => Array(size).fill(false));

    // Place finder patterns
    const placeFinder = (r, c) => {
      for (let dr = -1; dr <= 7; dr++) for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        matrix[rr][cc] = (inInner || (inOuter && onBorder)) ? 1 : 0;
        reserved[rr][cc] = true;
      }
    };
    placeFinder(0, 0);
    placeFinder(0, size - 7);
    placeFinder(size - 7, 0);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      if (!reserved[6][i]) { matrix[6][i] = i % 2 === 0 ? 1 : 0; reserved[6][i] = true; }
      if (!reserved[i][6]) { matrix[i][6] = i % 2 === 0 ? 1 : 0; reserved[i][6] = true; }
    }

    // Alignment patterns for version >= 2
    if (version >= 2) {
      const alignPos = this._getAlignmentPositions(version);
      for (const ar of alignPos) for (const ac of alignPos) {
        if (reserved[ar]?.[ac]) continue;
        for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
          const rr = ar + dr, cc = ac + dc;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
          if (reserved[rr][cc]) continue;
          const isEdge = Math.abs(dr) === 2 || Math.abs(dc) === 2;
          const isCenter = dr === 0 && dc === 0;
          matrix[rr][cc] = (isEdge || isCenter) ? 1 : 0;
          reserved[rr][cc] = true;
        }
      }
    }

    // Reserve format info areas
    for (let i = 0; i < 8; i++) {
      reserved[8][i] = true; reserved[8][size - 1 - i] = true;
      reserved[i][8] = true; reserved[size - 1 - i][8] = true;
    }
    reserved[8][8] = true;
    // Dark module
    matrix[size - 8][8] = 1; reserved[size - 8][8] = true;

    // Encode data bits (byte mode)
    const dataBits = [];
    // Mode indicator: byte = 0100
    dataBits.push(0, 1, 0, 0);
    // Character count
    const ccBits = version <= 9 ? 8 : 16;
    for (let i = ccBits - 1; i >= 0; i--) dataBits.push((bytes.length >> i) & 1);
    // Data bytes
    for (const b of bytes) for (let i = 7; i >= 0; i--) dataBits.push((b >> i) & 1);
    // Terminator
    for (let i = 0; i < 4 && dataBits.length < this._totalDataBits(version, ecLevel); i++) dataBits.push(0);
    // Pad to byte boundary
    while (dataBits.length % 8 !== 0) dataBits.push(0);
    // Pad bytes
    const totalBits = this._totalDataBits(version, ecLevel);
    const padBytes = [0xEC, 0x11];
    let pi = 0;
    while (dataBits.length < totalBits) {
      const pb = padBytes[pi % 2]; pi++;
      for (let i = 7; i >= 0; i--) dataBits.push((pb >> i) & 1);
    }

    // Convert to byte array
    const dataBytes = [];
    for (let i = 0; i < dataBits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | (dataBits[i + j] || 0);
      dataBytes.push(byte);
    }

    // Error correction
    const ecInfo = this._getECInfo(version, ecLevel);
    const blocks = this._splitIntoBlocks(dataBytes, ecInfo);
    const ecBlocks = blocks.map(b => this._computeEC(b, ecInfo.ecPerBlock));
    const interleaved = this._interleave(blocks, ecBlocks, ecInfo);

    // Place data modules
    const allBits = [];
    for (const b of interleaved) for (let i = 7; i >= 0; i--) allBits.push((b >> i) & 1);

    let bitIdx = 0;
    let upward = true;
    for (let col = size - 1; col >= 0; col -= 2) {
      if (col === 6) col = 5;
      const rows = upward ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
      for (const row of rows) {
        for (const dc of [0, -1]) {
          const c = col + dc;
          if (c < 0 || c >= size || reserved[row][c]) continue;
          matrix[row][c] = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
        }
      }
      upward = !upward;
    }

    // Apply mask (pattern 0: (row + col) % 2 === 0)
    let bestMask = 0, bestPenalty = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      const test = matrix.map(r => [...r]);
      this._applyMask(test, reserved, mask, size);
      this._placeFormatInfo(test, ecLevel, mask, size);
      const penalty = this._calcPenalty(test, size);
      if (penalty < bestPenalty) { bestPenalty = penalty; bestMask = mask; }
    }
    this._applyMask(matrix, reserved, bestMask, size);
    this._placeFormatInfo(matrix, ecLevel, bestMask, size);

    return { modules: matrix, size, version };
  }

  _getAlignmentPositions(v) {
    if (v === 1) return [];
    const positions = [6];
    const step = v <= 6 ? Math.ceil((v * 4 + 1) / 2) * 2 : Math.ceil((v * 4 + 1) / (Math.ceil(v / 7) + 1)) * 2;
    let pos = v * 4 + 10;
    const last = pos;
    positions.push(last);
    const mid = [];
    pos = last;
    while (pos > 6 + step) { pos -= step; mid.unshift(pos); }
    positions.splice(1, 0, ...mid);
    // Simpler approach for common versions
    if (v <= 6) return [6, v * 4 + 10];
    const n = Math.floor(v / 7) + 2;
    const first = 6, last2 = v * 4 + 10;
    const step2 = Math.ceil((last2 - first) / (n - 1));
    const result = [first];
    for (let i = 1; i < n - 1; i++) result.push(first + i * step2);
    result.push(last2);
    return result;
  }

  _totalDataBits(version, ecLevel) {
    return this._getECInfo(version, ecLevel).dataBytes * 8;
  }

  _getECInfo(version, ecLevel) {
    // EC info table [dataBytes, ecPerBlock, blocks] for versions 1-40
    const table = {
      1: [[19,7,1],[16,10,1],[13,13,1],[9,17,1]],
      2: [[34,10,1],[28,16,1],[22,22,1],[16,28,1]],
      3: [[55,15,1],[44,26,1],[34,18,2],[26,22,2]],
      4: [[80,20,1],[64,18,2],[48,26,2],[36,16,4]],
      5: [[108,26,1],[86,24,2],[62,18,2],[46,22,2],[0,0,4]],
      6: [[136,18,2],[108,16,4],[76,24,4],[60,28,4]],
      7: [[156,20,2],[124,18,4],[88,18,2],[66,26,2],[0,0,4]],
      8: [[194,24,2],[154,22,2],[110,22,2],[86,26,2],[0,0,4]],
      9: [[232,30,2],[182,22,3],[132,20,4],[100,24,4],[0,0,4]],
      10: [[274,18,2],[216,26,2],[154,28,4],[122,24,4],[0,0,4]]
    };
    // Simplified — use a lookup for common versions
    const info = table[version];
    if (info) {
      const entry = info[ecLevel];
      if (entry && entry[0] > 0) return { dataBytes: entry[0], ecPerBlock: entry[1], numBlocks: entry[2] };
    }
    // Fallback approximation for higher versions
    const totalModules = (version * 4 + 17);
    const approxData = Math.floor((totalModules * totalModules - 200) / 8 * 0.6);
    const ecPer = [7, 10, 15, 20][ecLevel] || 10;
    const numBlocks = Math.max(1, Math.floor(approxData / (ecPer * 3)));
    return { dataBytes: approxData, ecPerBlock: ecPer, numBlocks };
  }

  _splitIntoBlocks(data, ecInfo) {
    const blocks = [];
    const perBlock = Math.floor(ecInfo.dataBytes / ecInfo.numBlocks);
    let offset = 0;
    for (let i = 0; i < ecInfo.numBlocks; i++) {
      const len = i < ecInfo.numBlocks - 1 ? perBlock : ecInfo.dataBytes - offset;
      blocks.push(data.slice(offset, offset + len));
      offset += len;
    }
    return blocks;
  }

  _computeEC(data, ecCount) {
    // GF(256) Reed-Solomon error correction
    const gfExp = new Uint8Array(512);
    const gfLog = new Uint8Array(256);
    let val = 1;
    for (let i = 0; i < 255; i++) {
      gfExp[i] = val;
      gfLog[val] = i;
      val <<= 1;
      if (val >= 256) val ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) gfExp[i] = gfExp[i - 255];

    const gfMul = (a, b) => a === 0 || b === 0 ? 0 : gfExp[gfLog[a] + gfLog[b]];

    // Generator polynomial
    let gen = [1];
    for (let i = 0; i < ecCount; i++) {
      const newGen = new Array(gen.length + 1).fill(0);
      for (let j = 0; j < gen.length; j++) {
        newGen[j] ^= gen[j];
        newGen[j + 1] ^= gfMul(gen[j], gfExp[i]);
      }
      gen = newGen;
    }

    const msg = new Uint8Array(data.length + ecCount);
    for (let i = 0; i < data.length; i++) msg[i] = data[i];

    for (let i = 0; i < data.length; i++) {
      const coeff = msg[i];
      if (coeff !== 0) {
        for (let j = 0; j < gen.length; j++) {
          msg[i + j] ^= gfMul(gen[j], coeff);
        }
      }
    }

    return Array.from(msg.slice(data.length));
  }

  _interleave(dataBlocks, ecBlocks, ecInfo) {
    const result = [];
    const maxDataLen = Math.max(...dataBlocks.map(b => b.length));
    for (let i = 0; i < maxDataLen; i++) {
      for (const block of dataBlocks) if (i < block.length) result.push(block[i]);
    }
    const maxECLen = Math.max(...ecBlocks.map(b => b.length));
    for (let i = 0; i < maxECLen; i++) {
      for (const block of ecBlocks) if (i < block.length) result.push(block[i]);
    }
    return result;
  }

  _applyMask(matrix, reserved, mask, size) {
    const fns = [
      (r, c) => (r + c) % 2 === 0,
      (r, c) => r % 2 === 0,
      (r, c) => c % 3 === 0,
      (r, c) => (r + c) % 3 === 0,
      (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
      (r, c) => ((r * c) % 2 + (r * c) % 3) === 0,
      (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
      (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0
    ];
    const fn = fns[mask];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!reserved[r][c] && fn(r, c)) matrix[r][c] ^= 1;
      }
    }
  }

  _placeFormatInfo(matrix, ecLevel, mask, size) {
    const ecBits = [1, 0, 3, 2]; // L, M, Q, H
    let data = (ecBits[ecLevel] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) { rem <<= 1; if (rem & 0x400) rem ^= 0x537; }
    const format = ((data << 10) | rem) ^ 0x5412;
    const bits = [];
    for (let i = 14; i >= 0; i--) bits.push((format >> i) & 1);

    // Place around finder patterns
    const positions1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
    const positions2 = [];
    for (let i = 0; i < 7; i++) positions2.push([size - 1 - i, 8]);
    for (let i = 0; i < 8; i++) positions2.push([8, size - 8 + i]);

    for (let i = 0; i < 15; i++) {
      const [r1, c1] = positions1[i];
      matrix[r1][c1] = bits[i];
      if (i < positions2.length) {
        const [r2, c2] = positions2[i];
        matrix[r2][c2] = bits[i];
      }
    }
  }

  _calcPenalty(matrix, size) {
    let penalty = 0;
    // Rule 1: runs of same color
    for (let r = 0; r < size; r++) {
      let run = 1;
      for (let c = 1; c < size; c++) {
        if (matrix[r][c] === matrix[r][c - 1]) { run++; } else { if (run >= 5) penalty += run - 2; run = 1; }
      }
      if (run >= 5) penalty += run - 2;
    }
    for (let c = 0; c < size; c++) {
      let run = 1;
      for (let r = 1; r < size; r++) {
        if (matrix[r][c] === matrix[r - 1][c]) { run++; } else { if (run >= 5) penalty += run - 2; run = 1; }
      }
      if (run >= 5) penalty += run - 2;
    }
    return penalty;
  }

  _renderMatrix(qr) {
    const { modules, size } = qr;
    const scale = Math.max(1, Math.floor(this.size / (size + 8)));
    const quiet = 4;
    const totalSize = (size + quiet * 2) * scale;
    const canvas = document.createElement('canvas');
    canvas.width = totalSize;
    canvas.height = totalSize;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, totalSize, totalSize);

    ctx.fillStyle = this.fgColor;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (modules[r][c]) {
          ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
        }
      }
    }

    this.els.preview.innerHTML = '';
    this.els.preview.appendChild(canvas);
    this._lastCanvas = canvas;
  }

  _downloadPNG() {
    if (!this._lastCanvas) return;
    const link = document.createElement('a');
    link.download = 'nexus-qr.png';
    link.href = this._lastCanvas.toDataURL('image/png');
    link.click();
  }

  _downloadSVG() {
    if (!this._lastMatrix) return;
    const { modules, size } = this._lastMatrix;
    const quiet = 4;
    const total = size + quiet * 2;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${this.size}" height="${this.size}">`;
    svg += `<rect width="${total}" height="${total}" fill="${this.bgColor}"/>`;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (modules[r][c]) svg += `<rect x="${c + quiet}" y="${r + quiet}" width="1" height="1" fill="${this.fgColor}"/>`;
      }
    }
    svg += '</svg>';
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'nexus-qr.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async _copyToClipboard() {
    if (!this._lastCanvas) return;
    try {
      this._lastCanvas.toBlob(async (blob) => {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        const orig = this.els.copyBtn.textContent;
        this.els.copyBtn.textContent = '✓ Copied!';
        setTimeout(() => { this.els.copyBtn.textContent = orig; }, 1500);
      });
    } catch { /* clipboard API not available */ }
  }
}

window.NexusQRGenerator = NexusQRGenerator;
