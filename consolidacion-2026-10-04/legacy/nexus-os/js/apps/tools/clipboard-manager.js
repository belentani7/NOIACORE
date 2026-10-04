'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Clipboard Manager
 *  Copy/paste with history, pin, search, and type detection
 * ═══════════════════════════════════════════════════════════════
 */
class NexusClipboardManager {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.items = [];
    this.filter = '';
    this.filterType = 'all'; // all, text, url, code, number
    this.maxItems = 200;

    this._loadHistory();
    if (this.items.length === 0) this._seedDemo();
  }

  _seedDemo() {
    const demos = [
      { text: 'https://github.com/nexus-os/core', type: 'url' },
      { text: 'const fibonacci = (n) => n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);', type: 'code' },
      { text: 'SELECT * FROM users WHERE active = 1 ORDER BY created_at DESC;', type: 'code' },
      { text: 'Meeting notes: Discussed Q4 roadmap, prioritized AI integration features.', type: 'text' },
      { text: '42', type: 'number' },
      { text: 'ssh operator@nexus-server.local -p 2222 -i ~/.ssh/nexus_key', type: 'code' },
      { text: 'The quick brown fox jumps over the lazy dog', type: 'text' },
      { text: '3.14159265358979323846', type: 'number' },
      { text: 'https://docs.nexus-os.io/api/v2/endpoints', type: 'url' },
      { text: 'npm install --save-dev @nexus/toolkit@latest', type: 'code' },
      { text: 'Remember to backup before the migration!', type: 'text' },
      { text: '192.168.1.100:8080/api/health', type: 'url' },
    ];
    const now = Date.now();
    this.items = demos.map((d, i) => ({
      id: now - (demos.length - i) * 60000,
      text: d.text,
      type: d.type,
      pinned: i === 1,
      timestamp: now - (demos.length - i) * 60000,
      copies: Math.floor(Math.random() * 5) + 1
    }));
  }

  render() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/tools/clipboard-manager.css';
    this.container.appendChild(link);
    this._linkEl = link;

    this.element = document.createElement('div');
    this.element.className = 'nexus-clipboard-manager';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._bindEvents();
    this._renderItems();
    this._updateFooter();

    // Listen for clipboard events
    this._pasteHandler = (e) => {
      if (e.target.closest('.nexus-clipboard-manager')) return;
      const text = e.clipboardData?.getData('text');
      if (text) this._addItem(text);
    };
    document.addEventListener('paste', this._pasteHandler);
  }

  destroy() {
    this._saveHistory();
    document.removeEventListener('paste', this._pasteHandler);
    if (this._linkEl) this._linkEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <div class="cm-header">
        <h3>📋 CLIPBOARD MANAGER</h3>
        <span style="font-size:10px;color:#555" id="cm-count">0 items</span>
      </div>
      <div class="cm-toolbar">
        <input type="text" class="cm-search" id="cm-search" placeholder="Search clipboard history...">
        <button class="cm-filter-btn active" data-type="all">All</button>
        <button class="cm-filter-btn" data-type="text">Text</button>
        <button class="cm-filter-btn" data-type="url">URL</button>
        <button class="cm-filter-btn" data-type="code">Code</button>
        <button class="cm-filter-btn" data-type="number">Num</button>
      </div>
      <div class="cm-body" id="cm-body"></div>
      <div class="cm-add-area">
        <textarea class="cm-add-input" id="cm-add-input" placeholder="Add to clipboard..." rows="1"></textarea>
        <button class="cm-add-btn" id="cm-add-btn">+ Add</button>
      </div>
      <div class="cm-footer">
        <span id="cm-footer-info">Click to copy • Right-click for options</span>
        <button class="cm-filter-btn" id="cm-clear-all" style="font-size:9px">Clear All</button>
      </div>
    `;
  }

  _bindEvents() {
    this.element.querySelector('#cm-search').addEventListener('input', (e) => {
      this.filter = e.target.value.toLowerCase();
      this._renderItems();
    });

    this.element.querySelector('.cm-toolbar').addEventListener('click', (e) => {
      const btn = e.target.closest('.cm-filter-btn');
      if (!btn || !btn.dataset.type) return;
      this.element.querySelectorAll('.cm-toolbar .cm-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.filterType = btn.dataset.type;
      this._renderItems();
    });

    this.element.querySelector('#cm-body').addEventListener('click', (e) => {
      const action = e.target.closest('.cm-action-btn');
      if (action) {
        const id = parseInt(action.dataset.id);
        const act = action.dataset.action;
        if (act === 'copy') this._copyItem(id);
        else if (act === 'pin') this._togglePin(id);
        else if (act === 'delete') this._deleteItem(id);
        return;
      }
      const item = e.target.closest('.cm-item');
      if (item) {
        this._copyItem(parseInt(item.dataset.id));
      }
    });

    this.element.querySelector('#cm-add-btn').addEventListener('click', () => {
      const input = this.element.querySelector('#cm-add-input');
      const text = input.value.trim();
      if (text) {
        this._addItem(text);
        input.value = '';
      }
    });

    this.element.querySelector('#cm-add-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.element.querySelector('#cm-add-btn').click();
      }
    });

    this.element.querySelector('#cm-clear-all').addEventListener('click', () => {
      const pinned = this.items.filter(i => i.pinned);
      this.items = pinned;
      this._saveHistory();
      this._renderItems();
      this._updateFooter();
    });
  }

  _detectType(text) {
    if (/^https?:\/\//i.test(text) || /^[\w-]+\.[\w.-]+\.\w{2,}/i.test(text)) return 'url';
    if (/^-?\d+\.?\d*$/.test(text.trim()) && text.trim().length < 30) return 'number';
    if (/^(const |let |var |function |class |import |export |SELECT |INSERT |UPDATE |DELETE |CREATE |#include|def |fn |pub |async )/i.test(text) ||
        /[{}();]$/.test(text.trim()) || /^<\/?[a-z]/i.test(text.trim())) return 'code';
    if (text.includes('\n') || text.length > 200) return 'text';
    return 'text';
  }

  _getTypeIcon(type) {
    switch (type) {
      case 'url': return '🔗';
      case 'code': return '💻';
      case 'number': return '🔢';
      default: return '📝';
    }
  }

  _addItem(text) {
    // Deduplicate: if same text exists, move it to top and increment copies
    const existing = this.items.find(i => i.text === text);
    if (existing) {
      existing.copies++;
      existing.timestamp = Date.now();
      this.items.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.timestamp - a.timestamp;
      });
    } else {
      this.items.unshift({
        id: Date.now(),
        text,
        type: this._detectType(text),
        pinned: false,
        timestamp: Date.now(),
        copies: 1
      });
      if (this.items.length > this.maxItems) {
        this.items = this.items.slice(0, this.maxItems);
      }
    }
    this._saveHistory();
    this._renderItems();
    this._updateFooter();

    // Also copy to system clipboard
    try { navigator.clipboard.writeText(text); } catch (e) {}
  }

  _copyItem(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    try { navigator.clipboard.writeText(item.text); } catch (e) {}
    item.copies++;
    item.timestamp = Date.now();
    this._saveHistory();

    // Flash feedback
    const el = this.element.querySelector(`[data-id="${id}"]`);
    if (el) {
      el.style.borderColor = 'rgba(255, 200, 0, 0.6)';
      setTimeout(() => { el.style.borderColor = ''; }, 300);
    }
  }

  _togglePin(id) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.pinned = !item.pinned;
      this._saveHistory();
      this._renderItems();
    }
  }

  _deleteItem(id) {
    this.items = this.items.filter(i => i.id !== id);
    this._saveHistory();
    this._renderItems();
    this._updateFooter();
  }

  _getFiltered() {
    let list = [...this.items];
    if (this.filterType !== 'all') {
      list = list.filter(i => i.type === this.filterType);
    }
    if (this.filter) {
      list = list.filter(i => i.text.toLowerCase().includes(this.filter));
    }
    // Pinned first, then by timestamp
    list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.timestamp - a.timestamp;
    });
    return list;
  }

  _renderItems() {
    const body = this.element.querySelector('#cm-body');
    const items = this._getFiltered();

    if (items.length === 0) {
      body.innerHTML = `
        <div class="cm-empty">
          <div class="cm-empty-icon">📋</div>
          <div>${this.filter ? 'No matches found' : 'Clipboard is empty'}</div>
          <div style="font-size:10px;margin-top:4px">Copy text or add items below</div>
        </div>
      `;
      return;
    }

    body.innerHTML = items.map(item => {
      const age = this._fmtAge(Date.now() - item.timestamp);
      const preview = item.text.length > 120 ? item.text.substring(0, 120) + '...' : item.text;
      return `
        <div class="cm-item ${item.pinned ? 'pinned' : ''}" data-id="${item.id}">
          <div class="cm-item-icon">${this._getTypeIcon(item.type)}</div>
          <div class="cm-item-body">
            <div class="cm-item-text">${this._esc(preview)}</div>
            <div class="cm-item-meta">
              <span>${item.type}</span>
              <span>${age}</span>
              <span>${item.copies}× copied</span>
              <span>${item.text.length} chars</span>
              ${item.pinned ? '<span style="color:#ffc800">📌 Pinned</span>' : ''}
            </div>
          </div>
          <div class="cm-item-actions">
            <button class="cm-action-btn" data-action="copy" data-id="${item.id}" title="Copy">📋</button>
            <button class="cm-action-btn" data-action="pin" data-id="${item.id}" title="Pin">${item.pinned ? '📌' : '📍'}</button>
            <button class="cm-action-btn" data-action="delete" data-id="${item.id}" title="Delete">✕</button>
          </div>
        </div>
      `;
    }).join('');
  }

  _updateFooter() {
    const pinned = this.items.filter(i => i.pinned).length;
    this.element.querySelector('#cm-count').textContent = `${this.items.length} items (${pinned} pinned)`;
  }

  _loadHistory() {
    try {
      const data = localStorage.getItem('nexus:clipboard');
      if (data) this.items = JSON.parse(data);
    } catch (e) { this.items = []; }
  }

  _saveHistory() {
    try {
      localStorage.setItem('nexus:clipboard', JSON.stringify(this.items.slice(0, this.maxItems)));
    } catch (e) { /* storage full */ }
  }

  _fmtAge(ms) {
    if (ms < 60000) return 'just now';
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
    return `${Math.floor(ms / 86400000)}d ago`;
  }

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

window.NexusClipboardManager = NexusClipboardManager;
