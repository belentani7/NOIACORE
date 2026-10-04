'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Regex Tester
 *  Test regex patterns with highlights, groups, and categories
 * ═══════════════════════════════════════════════════════════════
 */
class NexusRegexTester {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.pattern = '';
    this.flags = 'g';
    this.testText = '';
    this.matches = [];
    this.error = null;

    this.categories = [
      { cat: 'Email',       name: 'Email',         pattern: '[\\w.-]+@[\\w.-]+\\.\\w{2,}', flags: 'g' },
      { cat: 'URL',         name: 'URL',           pattern: 'https?://[\\w\\-._~:/?#\\[\\]@!$&\'()*+,;=%]+', flags: 'g' },
      { cat: 'IPv4',        name: 'IPv4 Address',  pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
      { cat: 'IPv6',        name: 'IPv6 Address',  pattern: '[\\da-fA-F]{1,4}(?::[\\da-fA-F]{1,4}){7}', flags: 'g' },
      { cat: 'Phone',       name: 'Phone Number',  pattern: '\\+?\\d[\\d\\s\\-()]{7,}\\d', flags: 'g' },
      { cat: 'Date',        name: 'Date (ISO)',    pattern: '\\d{4}-\\d{2}-\\d{2}', flags: 'g' },
      { cat: 'Time',        name: 'Time (24h)',    pattern: '\\b(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?\\b', flags: 'g' },
      { cat: 'Hex',         name: 'Hex Color',     pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', flags: 'g' },
      { cat: 'UUID',        name: 'UUID',          pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', flags: 'g' },
      { cat: 'ZIP',         name: 'ZIP Code',      pattern: '\\b\\d{5}(?:-\\d{4})?\\b', flags: 'g' },
      { cat: 'CreditCard',  name: 'Credit Card',   pattern: '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b', flags: 'g' },
      { cat: 'HTML',        name: 'HTML Tag',      pattern: '<\\/?[a-zA-Z][a-zA-Z0-9]*(?:\\s[^>]*)?>', flags: 'g' },
      { cat: 'SSN',         name: 'SSN',           pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b', flags: 'g' },
      { cat: 'MAC',         name: 'MAC Address',   pattern: '(?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}', flags: 'g' },
      { cat: 'Semver',      name: 'Semver',        pattern: '\\bv?\\d+\\.\\d+\\.\\d+(?:-[\\w.]+)?\\b', flags: 'g' },
      { cat: 'Base64',      name: 'Base64',        pattern: '(?:[A-Za-z0-9+/]{4}){2,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?', flags: 'g' },
    ];
  }

  render() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/tools/regex-tester.css';
    this.container.appendChild(link);
    this._linkEl = link;

    this.element = document.createElement('div');
    this.element.className = 'nexus-regex-tester';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._bindEvents();
    this._renderCategories();
    this._test();
  }

  destroy() {
    if (this._linkEl) this._linkEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <div class="rx-header">
        <h3>🔍 REGEX TESTER</h3>
        <span style="font-size:10px;color:#555">JavaScript RegExp</span>
      </div>
      <div class="rx-body">
        <div class="rx-pattern-section">
          <div class="rx-pattern-wrap">
            <span class="rx-slash">/</span>
            <input type="text" class="rx-pattern-input" id="rx-pattern" placeholder="Enter regex pattern..." value="">
            <span class="rx-slash">/</span>
            <input type="text" class="rx-flags-input" id="rx-flags" value="g" maxlength="6" placeholder="flags">
          </div>
          <div class="rx-quick-flags" id="rx-flags-btns">
            <button class="rx-flag-btn active" data-flag="g">global</button>
            <button class="rx-flag-btn" data-flag="i">case-insensitive</button>
            <button class="rx-flag-btn" data-flag="m">multiline</button>
            <button class="rx-flag-btn" data-flag="s">dotAll</button>
            <button class="rx-flag-btn" data-flag="u">unicode</button>
          </div>
        </div>

        <div class="rx-test-section">
          <span class="rx-test-label">Test String</span>
          <textarea class="rx-test-input" id="rx-test" placeholder="Enter test string here...">Hello World! Contact us at admin@nexus-os.io or visit https://nexus-os.io/docs.
Our server is at 192.168.1.100 and the backup is at 10.0.0.5.
Meeting on 2026-09-01 at 14:30:00. Order ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890.
Payment card: 4111 1111 1111 1111. Reference: v2.1.0-beta.3
MAC: AA:BB:CC:DD:EE:FF | ZIP: 90210-1234 | SSN: 123-45-6789</textarea>
        </div>

        <div class="rx-result-section" id="rx-result-section">
          <div class="rx-match-info" id="rx-match-info"></div>
          <div id="rx-error-area"></div>
          <div class="rx-highlighted" id="rx-highlighted"></div>
          <div class="rx-groups" id="rx-groups"></div>
        </div>
      </div>

      <div class="rx-categories">
        <div class="rx-cat-title">Quick Patterns (click to load)</div>
        <div class="rx-cat-grid" id="rx-cat-grid"></div>
      </div>

      <div class="rx-footer">
        <span id="rx-footer-info">Type a pattern to test</span>
        <span>JavaScript RegExp Engine</span>
      </div>
    `;
  }

  _bindEvents() {
    const patternEl = this.element.querySelector('#rx-pattern');
    const flagsEl = this.element.querySelector('#rx-flags');
    const testEl = this.element.querySelector('#rx-test');

    const update = () => {
      this.pattern = patternEl.value;
      this.flags = flagsEl.value;
      this.testText = testEl.value;
      this._test();
    };

    patternEl.addEventListener('input', update);
    flagsEl.addEventListener('input', () => {
      this.flags = flagsEl.value;
      this._updateFlagButtons();
      update();
    });
    testEl.addEventListener('input', update);

    // Flag buttons
    this.element.querySelector('#rx-flags-btns').addEventListener('click', (e) => {
      const btn = e.target.closest('.rx-flag-btn');
      if (!btn) return;
      const flag = btn.dataset.flag;
      if (this.flags.includes(flag)) {
        this.flags = this.flags.replace(flag, '');
      } else {
        this.flags += flag;
      }
      flagsEl.value = this.flags;
      this._updateFlagButtons();
      this.pattern = patternEl.value;
      this.testText = testEl.value;
      this._test();
    });

    // Categories
    this.element.querySelector('#rx-cat-grid').addEventListener('click', (e) => {
      const item = e.target.closest('.rx-cat-item');
      if (!item) return;
      const cat = item.dataset.cat;
      const entry = this.categories.find(c => c.cat === cat);
      if (!entry) return;
      patternEl.value = entry.pattern;
      flagsEl.value = entry.flags;
      this.flags = entry.flags;
      this._updateFlagButtons();
      update();
    });

    // Initialize test text
    this.testText = testEl.value;
  }

  _updateFlagButtons() {
    this.element.querySelectorAll('.rx-flag-btn').forEach(btn => {
      btn.classList.toggle('active', this.flags.includes(btn.dataset.flag));
    });
  }

  _test() {
    this.error = null;
    this.matches = [];

    if (!this.pattern) {
      this._renderResults();
      return;
    }

    const startTime = performance.now();

    try {
      const re = new RegExp(this.pattern, this.flags);
      let match;
      const seen = new Set();

      if (this.flags.includes('g')) {
        while ((match = re.exec(this.testText)) !== null) {
          if (match.index === re.lastIndex) re.lastIndex++;
          const key = `${match.index}:${match[0]}`;
          if (seen.has(key)) break;
          seen.add(key);
          this.matches.push({
            index: match.index,
            text: match[0],
            groups: match.slice(1),
            namedGroups: match.groups || null,
            length: match[0].length
          });
          if (this.matches.length > 500) break;
        }
      } else {
        match = re.exec(this.testText);
        if (match) {
          this.matches.push({
            index: match.index,
            text: match[0],
            groups: match.slice(1),
            namedGroups: match.groups || null,
            length: match[0].length
          });
        }
      }
    } catch (e) {
      this.error = e.message;
    }

    const elapsed = (performance.now() - startTime).toFixed(3);
    this._renderResults(elapsed);
  }

  _renderResults(elapsed) {
    const infoEl = this.element.querySelector('#rx-match-info');
    const errEl = this.element.querySelector('#rx-error-area');
    const highlightEl = this.element.querySelector('#rx-highlighted');
    const groupsEl = this.element.querySelector('#rx-groups');

    if (this.error) {
      infoEl.innerHTML = '<span class="rx-match-count" style="color:#ff4444">Invalid Pattern</span>';
      errEl.innerHTML = `<div class="rx-error">${this._esc(this.error)}</div>`;
      highlightEl.innerHTML = this._esc(this.testText);
      groupsEl.innerHTML = '';
      return;
    }

    errEl.innerHTML = '';
    const count = this.matches.length;
    infoEl.innerHTML = `
      <span class="rx-match-count">${count} match${count !== 1 ? 'es' : ''}</span>
      ${elapsed ? `<span class="rx-match-time">${elapsed}ms</span>` : ''}
    `;

    // Highlighted text
    if (this.matches.length === 0 || !this.testText) {
      highlightEl.innerHTML = this._esc(this.testText || '');
    } else {
      let html = '';
      let lastIdx = 0;
      const sorted = [...this.matches].sort((a, b) => a.index - b.index);

      sorted.forEach(m => {
        if (m.index > lastIdx) {
          html += this._esc(this.testText.substring(lastIdx, m.index));
        }
        html += `<span class="rx-highlight" title="Match at ${m.index}">${this._esc(m.text)}</span>`;
        lastIdx = m.index + m.length;
      });
      if (lastIdx < this.testText.length) {
        html += this._esc(this.testText.substring(lastIdx));
      }
      highlightEl.innerHTML = html;
    }

    // Groups
    if (this.matches.length > 0 && this.matches[0].groups.length > 0) {
      const m = this.matches[0];
      let ghtml = '<div style="font-size:10px;color:#666;margin-bottom:4px">First match groups:</div>';
      m.groups.forEach((g, i) => {
        const name = m.namedGroups ? Object.keys(m.namedGroups).find(k => m.namedGroups[k] === g) : null;
        ghtml += `
          <div class="rx-group-item">
            <span class="rx-group-name">${name ? `$<${name}>` : `$${i + 1}`}</span>
            <span class="rx-group-value">${g !== undefined ? this._esc(g) : '<span style="color:#555">undefined</span>'}</span>
          </div>
        `;
      });
      groupsEl.innerHTML = ghtml;
    } else {
      groupsEl.innerHTML = '';
    }

    this.element.querySelector('#rx-footer-info').textContent =
      this.pattern ? `/${this.pattern}/${this.flags}` : 'Type a pattern to test';
  }

  _renderCategories() {
    const grid = this.element.querySelector('#rx-cat-grid');
    grid.innerHTML = this.categories.map(c => `
      <div class="rx-cat-item" data-cat="${c.cat}">
        <span class="rx-cat-name">${c.name}</span>
        <span class="rx-cat-pattern">${this._esc('/' + c.pattern.substring(0, 20) + '...')}</span>
      </div>
    `).join('');
  }

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

window.NexusRegexTester = NexusRegexTester;
