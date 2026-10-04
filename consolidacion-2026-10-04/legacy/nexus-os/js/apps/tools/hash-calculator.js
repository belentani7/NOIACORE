'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Hash Calculator
 *  SHA-1, SHA-256, SHA-384, SHA-512, MD5, CRC32 with file support
 * ═══════════════════════════════════════════════════════════════
 */
class NexusHashCalculator {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.inputText = '';
    this.selectedAlgos = new Set(['SHA-256', 'SHA-1', 'MD5', 'CRC32']);
    this.results = {};
    this.fileData = null;

    this.algorithms = [
      { name: 'MD5', bits: 128, available: true },
      { name: 'SHA-1', bits: 160, available: true },
      { name: 'SHA-256', bits: 256, available: true },
      { name: 'SHA-384', bits: 384, available: true },
      { name: 'SHA-512', bits: 512, available: true },
      { name: 'CRC32', bits: 32, available: true },
    ];
  }

  render() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/tools/hash-calculator.css';
    this.container.appendChild(link);
    this._linkEl = link;

    this.element = document.createElement('div');
    this.element.className = 'nexus-hash-calculator';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._bindEvents();
    this._renderAlgorithms();
    this._computeHashes();
  }

  destroy() {
    if (this._linkEl) this._linkEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <div class="hc-header">
        <h3>#️⃣ HASH CALCULATOR</h3>
        <span style="font-size:10px;color:#555">Web Crypto API</span>
      </div>
      <div class="hc-body">
        <div class="hc-input-section">
          <label>Input Text</label>
          <textarea class="hc-textarea" id="hc-input" placeholder="Enter text to hash..."></textarea>
          <div style="display:flex;gap:8px;margin-top:4px">
            <button class="hc-algo-btn" id="hc-clear" style="padding:3px 10px">Clear</button>
            <button class="hc-algo-btn" id="hc-compute" style="padding:3px 10px;color:#ff6400">⚡ Compute</button>
            <span id="hc-char-count" style="font-size:10px;color:#555;align-self:center;margin-left:auto">0 chars</span>
          </div>
        </div>

        <div class="hc-input-section">
          <label>Or Drop a File</label>
          <div class="hc-file-drop" id="hc-file-drop">
            <div class="hc-file-drop-icon">📄</div>
            <div>Drag & drop file here or click to select</div>
            <div id="hc-file-info" style="margin-top:6px;color:#ff6400;font-size:10px"></div>
          </div>
          <input type="file" id="hc-file-input" style="display:none">
        </div>

        <div class="hc-input-section">
          <label>Algorithms</label>
          <div class="hc-algo-grid" id="hc-algo-grid"></div>
        </div>

        <div class="hc-input-section">
          <label>Results</label>
          <div class="hc-results" id="hc-results">
            <div style="font-size:11px;color:#444;padding:8px">Enter text or drop a file to compute hashes</div>
          </div>
        </div>

        <div class="hc-compare">
          <div class="hc-compare-title">Hash Comparison</div>
          <div class="hc-compare-inputs">
            <input type="text" class="hc-compare-input" id="hc-cmp-a" placeholder="Paste hash A...">
            <input type="text" class="hc-compare-input" id="hc-cmp-b" placeholder="Paste hash B...">
          </div>
          <div class="hc-compare-result" id="hc-cmp-result"></div>
        </div>
      </div>
      <div class="hc-footer">
        <span id="hc-footer-time">Ready</span>
        <span id="hc-footer-input">No input</span>
      </div>
    `;
  }

  _bindEvents() {
    const input = this.element.querySelector('#hc-input');
    input.addEventListener('input', () => {
      this.inputText = input.value;
      this.fileData = null;
      this.element.querySelector('#hc-char-count').textContent = `${input.value.length} chars`;
      this.element.querySelector('#hc-file-info').textContent = '';
    });

    this.element.querySelector('#hc-clear').addEventListener('click', () => {
      input.value = '';
      this.inputText = '';
      this.fileData = null;
      this.results = {};
      this._renderResults();
      this.element.querySelector('#hc-char-count').textContent = '0 chars';
      this.element.querySelector('#hc-file-info').textContent = '';
    });

    this.element.querySelector('#hc-compute').addEventListener('click', () => this._computeHashes());

    // File drop
    const dropZone = this.element.querySelector('#hc-file-drop');
    const fileInput = this.element.querySelector('#hc-file-input');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) this._loadFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) this._loadFile(e.target.files[0]);
    });

    // Compare
    const cmpA = this.element.querySelector('#hc-cmp-a');
    const cmpB = this.element.querySelector('#hc-cmp-b');
    const cmpResult = this.element.querySelector('#hc-cmp-result');
    const doCompare = () => {
      const a = cmpA.value.trim().toLowerCase();
      const b = cmpB.value.trim().toLowerCase();
      if (!a || !b) { cmpResult.textContent = ''; cmpResult.className = 'hc-compare-result'; return; }
      if (a === b) {
        cmpResult.textContent = '✓ HASHES MATCH';
        cmpResult.className = 'hc-compare-result hc-match';
      } else {
        cmpResult.textContent = '✕ HASHES DO NOT MATCH';
        cmpResult.className = 'hc-compare-result hc-no-match';
      }
    };
    cmpA.addEventListener('input', doCompare);
    cmpB.addEventListener('input', doCompare);

    // Enter key to compute
    input.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') this._computeHashes();
    });
  }

  _renderAlgorithms() {
    const grid = this.element.querySelector('#hc-algo-grid');
    grid.innerHTML = this.algorithms.map(algo => `
      <button class="hc-algo-btn ${this.selectedAlgos.has(algo.name) ? 'active' : ''}" data-algo="${algo.name}">
        ${algo.name}<br><span style="font-size:8px;color:#666">${algo.bits}-bit</span>
      </button>
    `).join('');

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.hc-algo-btn');
      if (!btn) return;
      const algo = btn.dataset.algo;
      if (this.selectedAlgos.has(algo)) this.selectedAlgos.delete(algo);
      else this.selectedAlgos.add(algo);
      this._renderAlgorithms();
      if (this.inputText || this.fileData) this._computeHashes();
    });
  }

  async _loadFile(file) {
    this.element.querySelector('#hc-file-info').textContent = `${file.name} (${this._fmtSize(file.size)})`;
    this.element.querySelector('#hc-input').value = '';
    this.inputText = '';

    try {
      this.fileData = await file.arrayBuffer();
      this._computeHashes();
    } catch (e) {
      this.element.querySelector('#hc-file-info').textContent = `Error reading file: ${e.message}`;
    }
  }

  async _computeHashes() {
    const hasInput = this.inputText.length > 0 || this.fileData;
    if (!hasInput) return;

    const startTime = performance.now();
    const data = this.fileData || new TextEncoder().encode(this.inputText);
    const results = {};

    for (const algo of this.selectedAlgos) {
      try {
        if (algo === 'CRC32') {
          results[algo] = this._crc32(data);
        } else if (algo === 'MD5') {
          results[algo] = this._md5(data instanceof ArrayBuffer ? new Uint8Array(data) : data);
        } else {
          const hashBuffer = await crypto.subtle.digest(algo, data);
          const hashArray = new Uint8Array(hashBuffer);
          results[algo] = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
        }
      } catch (e) {
        results[algo] = `Error: ${e.message}`;
      }
    }

    const elapsed = (performance.now() - startTime).toFixed(2);
    this.results = results;
    this._renderResults();
    this.element.querySelector('#hc-footer-time').textContent = `Computed in ${elapsed}ms`;
    this.element.querySelector('#hc-footer-input').textContent =
      this.fileData ? `${this._fmtSize(data.byteLength)}` : `${this.inputText.length} chars`;
  }

  _renderResults() {
    const el = this.element.querySelector('#hc-results');
    const keys = Object.keys(this.results);
    if (keys.length === 0) {
      el.innerHTML = '<div style="font-size:11px;color:#444;padding:8px">Enter text or drop a file to compute hashes</div>';
      return;
    }

    el.innerHTML = keys.map(algo => `
      <div class="hc-result-item">
        <span class="hc-result-algo">${algo}</span>
        <span class="hc-result-hash">${this.results[algo]}</span>
        <button class="hc-copy-btn" data-hash="${this._esc(this.results[algo])}" title="Copy">📋</button>
      </div>
    `).join('');

    el.querySelectorAll('.hc-copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const hash = btn.dataset.hash;
        try { navigator.clipboard.writeText(hash); } catch (e) {}
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = '📋'; }, 1000);
      });
    });
  }

  // ─── CRC32 Implementation ───────────────────────────────────
  _crc32(data) {
    const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    let crc = 0xFFFFFFFF;
    const table = this._getCRC32Table();
    for (let i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ bytes[i]) & 0xFF];
    }
    return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
  }

  _getCRC32Table() {
    if (!this._crc32Table) {
      this._crc32Table = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
          c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        this._crc32Table[i] = c >>> 0;
      }
    }
    return this._crc32Table;
  }

  // ─── MD5 Implementation (pure JS) ────────────────────────────
  _md5(bytes) {
    const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const len = arr.length;

    // Pre-processing: padding
    const bitLen = len * 8;
    const padded = new Uint8Array(len + 1 + 8 + ((55 - len % 64 + 64) % 64));
    padded.set(arr);
    padded[len] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, bitLen & 0xFFFFFFFF, true);
    view.setUint32(padded.length - 4, Math.floor(bitLen / 0x100000000), true);

    const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
               5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
               4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
               6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];

    const K = [];
    for (let i = 0; i < 64; i++) {
      K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
    }

    let a0 = 0x67452301, b0 = 0xEFCDAB89, c0 = 0x98BADCFE, d0 = 0x10325476;

    const rotl = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;

    for (let offset = 0; offset < padded.length; offset += 64) {
      const M = new Uint32Array(16);
      for (let j = 0; j < 16; j++) {
        M[j] = view.getUint32(offset + j * 4, true);
      }

      let A = a0, B = b0, C = c0, D = d0;

      for (let i = 0; i < 64; i++) {
        let F, g;
        if (i < 16) { F = (B & C) | (~B & D); g = i; }
        else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
        else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * i) % 16; }

        F = (F + A + K[i] + M[g]) >>> 0;
        A = D; D = C; C = B;
        B = (B + rotl(F, S[i])) >>> 0;
      }

      a0 = (a0 + A) >>> 0;
      b0 = (b0 + B) >>> 0;
      c0 = (c0 + C) >>> 0;
      d0 = (d0 + D) >>> 0;
    }

    const toHex = (n) => {
      let s = '';
      for (let i = 0; i < 4; i++) s += ((n >> (i * 8)) & 0xFF).toString(16).padStart(2, '0');
      return s;
    };

    return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
  }

  _fmtSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

window.NexusHashCalculator = NexusHashCalculator;
