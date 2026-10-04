'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — JSON Formatter
 *  Format, validate, search, and transform JSON with syntax highlighting
 * ═══════════════════════════════════════════════════════════════
 */
class NexusJSONFormatter {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.inputJSON = '';
    this.searchTerm = '';
    this.indentSize = 2;
    this.parsed = null;
    this.error = null;

    this.demoJSON = JSON.stringify({
      "nexus_os": {
        "version": "4.2.1",
        "codename": "Neon Genesis",
        "build": 20260901,
        "features": ["terminal", "music-studio", "ai-chat", "code-editor"],
        "config": {
          "theme": "neon-red",
          "accent": "#ff003c",
          "transparency": 0.85,
          "animations": true,
          "max_windows": 12
        },
        "users": [
          { "id": 1, "name": "operator", "role": "admin", "active": true, "last_login": "2026-09-01T00:00:01Z" },
          { "id": 2, "name": "guest", "role": "viewer", "active": false, "last_login": null },
          { "id": 3, "name": "nexus-ai", "role": "system", "active": true, "last_login": "2026-09-01T12:00:00Z" }
        ],
        "stats": {
          "uptime_hours": 168,
          "total_requests": 1247893,
          "error_rate": 0.0023,
          "avg_latency_ms": 42
        },
        "metadata": null
      }
    }, null, 2);
  }

  render() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/tools/json-formatter.css';
    this.container.appendChild(link);
    this._linkEl = link;

    this.element = document.createElement('div');
    this.element.className = 'nexus-json-formatter';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._bindEvents();
    this.element.querySelector('#jf-input').value = this.demoJSON;
    this.inputJSON = this.demoJSON;
    this._parse();
    this._renderOutput();
  }

  destroy() {
    if (this._linkEl) this._linkEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <div class="jf-header">
        <h3>{ } JSON FORMATTER</h3>
        <span style="font-size:10px;color:#555" id="jf-status-badge">—</span>
      </div>
      <div class="jf-toolbar">
        <button class="jf-tool-btn" id="jf-format">Format</button>
        <button class="jf-tool-btn" id="jf-minify">Minify</button>
        <button class="jf-tool-btn" id="jf-sort-keys">Sort Keys</button>
        <button class="jf-tool-btn" id="jf-escape">Escape</button>
        <button class="jf-tool-btn" id="jf-copy">Copy</button>
        <button class="jf-tool-btn" id="jf-clear">Clear</button>
        <button class="jf-tool-btn" id="jf-sample">Sample</button>
        <select class="jf-tool-btn" id="jf-indent" style="cursor:pointer">
          <option value="2">2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="tab">Tab</option>
        </select>
      </div>
      <div class="jf-search-wrap">
        <input type="text" class="jf-search" id="jf-search" placeholder="Search keys and values...">
        <span style="font-size:10px;color:#555" id="jf-search-count"></span>
      </div>
      <div class="jf-body">
        <div class="jf-panel">
          <div class="jf-panel-label">INPUT</div>
          <textarea class="jf-editor" id="jf-input" spellcheck="false" placeholder="Paste JSON here..."></textarea>
        </div>
        <div class="jf-divider"></div>
        <div class="jf-panel">
          <div class="jf-panel-label">OUTPUT</div>
          <div class="jf-output" id="jf-output"></div>
        </div>
      </div>
      <div class="jf-error-bar" id="jf-error"></div>
      <div class="jf-status" id="jf-status">
        <span class="jf-status-item">Lines: <span id="jf-lines">0</span></span>
        <span class="jf-status-item">Keys: <span id="jf-keys">0</span></span>
        <span class="jf-status-item">Size: <span id="jf-size">0 B</span></span>
        <span class="jf-status-item">Depth: <span id="jf-depth">0</span></span>
      </div>
      <div class="jf-footer">
        <span>Ctrl+Enter to format • Tab to indent in editor</span>
        <span id="jf-footer-time"></span>
      </div>
    `;
  }

  _bindEvents() {
    const inputEl = this.element.querySelector('#jf-input');
    const searchEl = this.element.querySelector('#jf-search');

    // Live parse on input
    let debounce;
    inputEl.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        this.inputJSON = inputEl.value;
        this._parse();
        this._renderOutput();
      }, 300);
    });

    searchEl.addEventListener('input', () => {
      this.searchTerm = searchEl.value;
      this._renderOutput();
    });

    // Toolbar actions
    this.element.querySelector('#jf-format').addEventListener('click', () => this._format());
    this.element.querySelector('#jf-minify').addEventListener('click', () => this._minify());
    this.element.querySelector('#jf-sort-keys').addEventListener('click', () => this._sortKeys());
    this.element.querySelector('#jf-escape').addEventListener('click', () => this._escapeString());
    this.element.querySelector('#jf-copy').addEventListener('click', () => this._copyOutput());
    this.element.querySelector('#jf-clear').addEventListener('click', () => {
      inputEl.value = '';
      this.inputJSON = '';
      this.parsed = null;
      this.error = null;
      this._renderOutput();
    });
    this.element.querySelector('#jf-sample').addEventListener('click', () => {
      inputEl.value = this.demoJSON;
      this.inputJSON = this.demoJSON;
      this._parse();
      this._renderOutput();
    });

    this.element.querySelector('#jf-indent').addEventListener('change', (e) => {
      this.indentSize = e.target.value === 'tab' ? '\t' : parseInt(e.target.value);
      this._renderOutput();
    });

    // Ctrl+Enter to format
    inputEl.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this._format();
      }
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const start = inputEl.selectionStart;
        const indent = typeof this.indentSize === 'string' ? this.indentSize : ' '.repeat(this.indentSize);
        inputEl.value = inputEl.value.substring(0, start) + indent + inputEl.value.substring(inputEl.selectionEnd);
        inputEl.selectionStart = inputEl.selectionEnd = start + indent.length;
        this.inputJSON = inputEl.value;
        this._parse();
        this._renderOutput();
      }
    });
  }

  _parse() {
    this.error = null;
    this.parsed = null;

    if (!this.inputJSON.trim()) {
      this._updateStatus(null);
      return;
    }

    try {
      this.parsed = JSON.parse(this.inputJSON);
      this._updateStatus(this.parsed);
    } catch (e) {
      this.error = e.message;
      this._updateStatus(null);
    }
  }

  _renderOutput() {
    const output = this.element.querySelector('#jf-output');
    const errBar = this.element.querySelector('#jf-error');
    const badge = this.element.querySelector('#jf-status-badge');

    if (this.error) {
      errBar.textContent = `⚠ ${this.error}`;
      errBar.classList.add('visible');
      badge.textContent = 'INVALID';
      badge.style.color = '#ff4444';
      output.innerHTML = `<span class="jf-invalid">${this._esc(this.inputJSON)}</span>`;
      return;
    }

    errBar.classList.remove('visible');

    if (this.parsed === null && !this.inputJSON.trim()) {
      badge.textContent = '—';
      badge.style.color = '#555';
      output.innerHTML = '<span style="color:#444">Paste JSON in the input panel</span>';
      return;
    }

    badge.textContent = 'VALID';
    badge.style.color = '#00ff88';

    const formatted = JSON.stringify(this.parsed, null, this.indentSize);
    const highlighted = this._syntaxHighlight(formatted);

    output.innerHTML = highlighted;
    this.element.querySelector('#jf-footer-time').textContent = new Date().toLocaleTimeString();
  }

  _syntaxHighlight(json) {
    let searchMatches = 0;
    const esc = (s) => this._esc(s);

    let result = json
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // Keys
      .replace(/"([^"\\]*(\\.[^"\\]*)*)"\s*:/g, '<span class="jf-key">"$1"</span>:')
      // String values
      .replace(/:\s*"([^"\\]*(\\.[^"\\]*)*)"/g, ': <span class="jf-string">"$1"</span>')
      // Standalone strings (in arrays)
      .replace(/(?<=[\[,]\s*)"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="jf-string">"$1"</span>')
      // Numbers
      .replace(/:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g, ': <span class="jf-number">$1</span>')
      .replace(/(?<=[\[,]\s*)(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g, '<span class="jf-number">$1</span>')
      // Booleans
      .replace(/:\s*(true|false)/g, ': <span class="jf-boolean">$1</span>')
      .replace(/(?<=[\[,]\s*)(true|false)/g, '<span class="jf-boolean">$1</span>')
      // Null
      .replace(/:\s*(null)/g, ': <span class="jf-null">$1</span>')
      .replace(/(?<=[\[,]\s*)(null)/g, '<span class="jf-null">$1</span>')
      // Brackets
      .replace(/([{}[\]])/g, '<span class="jf-bracket">$1</span>')
      // Commas
      .replace(/(,)(?=\s*[\n\r{["\d\-tfn])/g, '<span class="jf-comma">$1</span>');

    // Search highlighting
    if (this.searchTerm && this.searchTerm.length > 0) {
      const escapedSearch = this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(${escapedSearch})`, 'gi');
      result = result.replace(re, (match) => {
        searchMatches++;
        return `<span class="jf-search-match">${match}</span>`;
      });
    }

    this.element.querySelector('#jf-search-count').textContent =
      this.searchTerm ? `${searchMatches} found` : '';

    return result;
  }

  _updateStatus(obj) {
    const text = this.inputJSON;
    this.element.querySelector('#jf-lines').textContent = text.split('\n').length;
    this.element.querySelector('#jf-size').textContent = this._fmtSize(text.length);

    if (obj && typeof obj === 'object') {
      const stats = this._countStats(obj);
      this.element.querySelector('#jf-keys').textContent = stats.keys;
      this.element.querySelector('#jf-depth').textContent = stats.depth;
    } else {
      this.element.querySelector('#jf-keys').textContent = '—';
      this.element.querySelector('#jf-depth').textContent = '—';
    }
  }

  _countStats(obj, depth = 0) {
    let keys = 0;
    let maxDepth = depth;

    if (obj && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        keys += obj.length;
        obj.forEach(item => {
          const sub = this._countStats(item, depth + 1);
          keys += sub.keys;
          maxDepth = Math.max(maxDepth, sub.depth);
        });
      } else {
        const entries = Object.keys(obj);
        keys += entries.length;
        entries.forEach(key => {
          const sub = this._countStats(obj[key], depth + 1);
          keys += sub.keys;
          maxDepth = Math.max(maxDepth, sub.depth);
        });
      }
    }

    return { keys, depth: maxDepth };
  }

  _format() {
    if (!this.parsed) return;
    const inputEl = this.element.querySelector('#jf-input');
    inputEl.value = JSON.stringify(this.parsed, null, this.indentSize);
    this.inputJSON = inputEl.value;
    this._parse();
    this._renderOutput();
  }

  _minify() {
    if (!this.parsed) return;
    const inputEl = this.element.querySelector('#jf-input');
    inputEl.value = JSON.stringify(this.parsed);
    this.inputJSON = inputEl.value;
    this._parse();
    this._renderOutput();
  }

  _sortKeys() {
    if (!this.parsed) return;
    const sorted = this._deepSort(this.parsed);
    const inputEl = this.element.querySelector('#jf-input');
    inputEl.value = JSON.stringify(sorted, null, this.indentSize);
    this.inputJSON = inputEl.value;
    this._parse();
    this._renderOutput();
  }

  _deepSort(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this._deepSort(item));

    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = this._deepSort(obj[key]);
    });
    return sorted;
  }

  _escapeString() {
    const inputEl = this.element.querySelector('#jf-input');
    const sel = inputEl.value.substring(inputEl.selectionStart, inputEl.selectionEnd);
    if (sel) {
      const escaped = sel.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
      const before = inputEl.value.substring(0, inputEl.selectionStart);
      const after = inputEl.value.substring(inputEl.selectionEnd);
      inputEl.value = before + escaped + after;
    } else {
      inputEl.value = JSON.stringify(inputEl.value);
    }
    this.inputJSON = inputEl.value;
    this._parse();
    this._renderOutput();
  }

  _copyOutput() {
    if (!this.parsed) return;
    const text = JSON.stringify(this.parsed, null, this.indentSize);
    try { navigator.clipboard.writeText(text); } catch (e) {}

    const btn = this.element.querySelector('#jf-copy');
    const orig = btn.textContent;
    btn.textContent = '✓ Copied';
    setTimeout(() => { btn.textContent = orig; }, 1500);
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

window.NexusJSONFormatter = NexusJSONFormatter;
