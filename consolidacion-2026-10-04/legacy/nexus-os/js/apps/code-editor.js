'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Code Editor
 *  Full-featured code editor with syntax highlighting
 * ═══════════════════════════════════════════════════════════════
 */
class NexusCodeEditor {
  constructor(container) {
    this.container = container;
    this.element = null;

    // State
    this.tabs = [];
    this.activeTabIndex = -1;
    this.tabIdCounter = 0;
    this.tabSize = 2;
    this.wordWrap = true;
    this.showMinimap = true;
    this.showConsole = false;
    this.fontSize = 14;

    // Editor elements (set during render)
    this.textarea = null;
    this.highlightEl = null;
    this.lineNumbersEl = null;
    this.statusBar = null;
    this.consoleEl = null;
    this.findBar = null;

    // Undo/redo stacks per tab
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndo = 200;

    // Auto-save
    this.autoSaveTimer = null;
    this.lastSaveTime = null;

    // Language detection map
    this.languageMap = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'javascript',
      'html': 'html', 'htm': 'html',
      'css': 'css', 'scss': 'css', 'less': 'css',
      'py': 'python', 'python': 'python',
      'json': 'json',
      'md': 'markdown', 'markdown': 'markdown',
      'txt': 'plaintext'
    };

    // Console output
    this.consoleOutput = [];
  }

  // ─── Render ─────────────────────────────────────────────────────
  render() {
    const style = document.createElement('style');
    style.textContent = this._getStyles();
    this.container.appendChild(style);
    this._styleEl = style;

    this.element = document.createElement('div');
    this.element.className = 'nexus-code-editor';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    // Cache elements
    this.tabBarEl = this.element.querySelector('.ce-tab-bar');
    this.toolbarEl = this.element.querySelector('.ce-toolbar');
    this.lineNumbersEl = this.element.querySelector('.ce-line-numbers');
    this.highlightEl = this.element.querySelector('.ce-highlight');
    this.textarea = this.element.querySelector('.ce-textarea');
    this.minimapEl = this.element.querySelector('.ce-minimap');
    this.minimapCanvas = this.element.querySelector('.ce-minimap-canvas');
    this.statusBar = this.element.querySelector('.ce-status-bar');
    this.consoleEl = this.element.querySelector('.ce-console');
    this.consoleOutputEl = this.element.querySelector('.ce-console-output');
    this.findBar = this.element.querySelector('.ce-find-bar');
    this.findInput = this.element.querySelector('.ce-find-input');
    this.replaceInput = this.element.querySelector('.ce-replace-input');
    this.findCount = this.element.querySelector('.ce-find-count');

    // Events
    this._bindEvents();

    // Create initial tab
    this._createTab('untitled.js', '// Welcome to NEXUS Code Editor\n// Start typing or open a file\n\nfunction hello() {\n  console.log("Hello, NEXUS!");\n}\n\nhello();\n');

    // Restore auto-saved state
    this._restoreAutoSave();

    // Start auto-save
    this.autoSaveTimer = setInterval(() => this._autoSave(), 30000);
  }

  destroy() {
    this._autoSave();
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    if (this._styleEl) this._styleEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <!-- Tab Bar -->
      <div class="ce-tab-bar">
        <div class="ce-tabs" id="ce-tabs"></div>
        <button class="ce-tab-add" title="New File (Ctrl+N)">+</button>
      </div>

      <!-- Toolbar -->
      <div class="ce-toolbar">
        <div class="ce-toolbar-group">
          <button class="ce-tb-btn" data-action="new" title="New (Ctrl+N)">
            <svg viewBox="0 0 16 16" width="14" height="14"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
          </button>
          <button class="ce-tb-btn" data-action="open" title="Open (Ctrl+O)">
            <svg viewBox="0 0 16 16" width="14" height="14"><path d="M2 4h4l2 2h6v7H2V4z" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
          </button>
          <button class="ce-tb-btn" data-action="save" title="Save (Ctrl+S)">
            <svg viewBox="0 0 16 16" width="14" height="14"><rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/><rect x="5" y="2" width="6" height="4" stroke="currentColor" stroke-width="1" fill="none"/></svg>
          </button>
          <button class="ce-tb-btn" data-action="saveas" title="Save As (Ctrl+Shift+S)">
            <svg viewBox="0 0 16 16" width="14" height="14"><rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M8 5v6M5 8l3 3 3-3" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
          </button>
        </div>
        <div class="ce-toolbar-divider"></div>
        <div class="ce-toolbar-group">
          <button class="ce-tb-btn" data-action="find" title="Find (Ctrl+F)">
            <svg viewBox="0 0 16 16" width="14" height="14"><circle cx="7" cy="7" r="4" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M10 10l3.5 3.5" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
          <button class="ce-tb-btn" data-action="replace" title="Replace (Ctrl+H)">
            <svg viewBox="0 0 16 16" width="14" height="14"><circle cx="6" cy="6" r="3.5" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M9 9l4 4M12 6h2M13 5v2" stroke="currentColor" stroke-width="1.2"/></svg>
          </button>
          <button class="ce-tb-btn" data-action="goto" title="Go to Line (Ctrl+G)">
            <svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 4h10M3 8h6M3 12h8" stroke="currentColor" stroke-width="1.2"/></svg>
          </button>
        </div>
        <div class="ce-toolbar-divider"></div>
        <div class="ce-toolbar-group">
          <button class="ce-tb-btn" data-action="wrap" title="Toggle Word Wrap">Wrap</button>
          <button class="ce-tb-btn" data-action="minimap" title="Toggle Minimap">Map</button>
          <button class="ce-tb-btn" data-action="fontplus" title="Increase Font (Ctrl+=)">A+</button>
          <button class="ce-tb-btn" data-action="fontminus" title="Decrease Font (Ctrl+-)">A-</button>
        </div>
        <div class="ce-toolbar-divider"></div>
        <div class="ce-toolbar-group">
          <select class="ce-lang-select" title="Language">
            <option value="javascript">JavaScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="python">Python</option>
            <option value="json">JSON</option>
            <option value="markdown">Markdown</option>
            <option value="plaintext">Plain Text</option>
          </select>
        </div>
        <div class="ce-toolbar-spacer"></div>
        <button class="ce-run-btn" data-action="run" title="Run JavaScript">
          <svg viewBox="0 0 16 16" width="14" height="14"><polygon points="3,2 13,8 3,14" fill="currentColor"/></svg>
          <span>Run</span>
        </button>
      </div>

      <!-- Find Bar (hidden by default) -->
      <div class="ce-find-bar" style="display:none;">
        <div class="ce-find-row">
          <input type="text" class="ce-find-input glass-input" placeholder="Find...">
          <span class="ce-find-count">0 results</span>
          <button class="ce-find-btn" data-find="prev" title="Previous">▲</button>
          <button class="ce-find-btn" data-find="next" title="Next">▼</button>
          <button class="ce-find-btn" data-find="regex" title="Regex">.*</button>
          <button class="ce-find-btn" data-find="case" title="Case Sensitive">Aa</button>
          <button class="ce-find-btn" data-find="close" title="Close">✕</button>
        </div>
        <div class="ce-find-row ce-replace-row" style="display:none;">
          <input type="text" class="ce-replace-input glass-input" placeholder="Replace...">
          <button class="ce-find-btn" data-find="replace" title="Replace">Replace</button>
          <button class="ce-find-btn" data-find="replaceall" title="Replace All">All</button>
        </div>
      </div>

      <!-- Editor Area -->
      <div class="ce-editor-area">
        <div class="ce-line-numbers"></div>
        <div class="ce-code-container">
          <pre class="ce-highlight" aria-hidden="true"><code></code></pre>
          <textarea class="ce-textarea" spellcheck="false" autocorrect="off" autocapitalize="off"></textarea>
        </div>
        <div class="ce-minimap">
          <canvas class="ce-minimap-canvas"></canvas>
          <div class="ce-minimap-viewport"></div>
        </div>
      </div>

      <!-- Console (hidden by default) -->
      <div class="ce-console" style="display:none;">
        <div class="ce-console-header">
          <span>Console Output</span>
          <button class="ce-console-clear" title="Clear">✕</button>
        </div>
        <div class="ce-console-output"></div>
      </div>

      <!-- Status Bar -->
      <div class="ce-status-bar">
        <span class="ce-status-item ce-status-cursor">Ln 1, Col 1</span>
        <span class="ce-status-item ce-status-selection"></span>
        <span class="ce-status-item ce-status-lines">0 lines</span>
        <span class="ce-status-item ce-status-lang">JavaScript</span>
        <span class="ce-status-item">UTF-8</span>
        <span class="ce-status-item ce-status-tabs">Spaces: 2</span>
        <span class="ce-status-item">LF</span>
        <span class="ce-status-spacer"></span>
        <span class="ce-status-item ce-status-save"></span>
        <span class="ce-status-item ce-status-words">0 words</span>
      </div>
    `;
  }

  // ─── Event Binding ──────────────────────────────────────────────
  _bindEvents() {
    // Textarea events
    this.textarea.addEventListener('input', () => this._onInput());
    this.textarea.addEventListener('scroll', () => this._onScroll());
    this.textarea.addEventListener('keydown', (e) => this._onKeyDown(e));
    this.textarea.addEventListener('click', () => this._updateStatus());
    this.textarea.addEventListener('keyup', () => this._updateStatus());
    this.textarea.addEventListener('select', () => this._updateStatus());
    this.textarea.addEventListener('mouseup', () => this._updateStatus());

    // Tab bar
    this.element.querySelector('.ce-tab-add').addEventListener('click', () => this._createTab());
    this.element.querySelector('#ce-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.ce-tab');
      if (!tab) return;
      const idx = parseInt(tab.dataset.index);
      if (e.target.classList.contains('ce-tab-close')) {
        this._closeTab(idx);
      } else {
        this._switchTab(idx);
      }
    });

    // Toolbar
    this.element.querySelector('.ce-toolbar').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      this._handleToolbarAction(btn.dataset.action);
    });

    // Language selector
    this.element.querySelector('.ce-lang-select').addEventListener('change', (e) => {
      if (this.activeTabIndex >= 0 && this.tabs[this.activeTabIndex]) {
        this.tabs[this.activeTabIndex].language = e.target.value;
        this._updateHighlight();
        this._updateStatus();
      }
    });

    // Run button
    this.element.querySelector('.ce-run-btn').addEventListener('click', () => this._runCode());

    // Find bar
    this.findInput.addEventListener('input', () => this._performFind());
    this.findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this._findNext(e.shiftKey ? -1 : 1); }
      if (e.key === 'Escape') this._hideFindBar();
    });
    this.replaceInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this._performReplace(); }
    });
    this.findBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-find]');
      if (!btn) return;
      const action = btn.dataset.find;
      if (action === 'next') this._findNext(1);
      else if (action === 'prev') this._findNext(-1);
      else if (action === 'close') this._hideFindBar();
      else if (action === 'replace') this._performReplace();
      else if (action === 'replaceall') this._performReplaceAll();
      else if (action === 'regex') btn.classList.toggle('active');
      else if (action === 'case') btn.classList.toggle('active');
    });

    // Console
    this.element.querySelector('.ce-console-clear').addEventListener('click', () => {
      this.consoleOutputEl.innerHTML = '';
      this.consoleOutput = [];
    });

    // Minimap click
    this.minimapEl.addEventListener('click', (e) => {
      const rect = this.minimapCanvas.getBoundingClientRect();
      const ratio = (e.clientY - rect.top) / rect.height;
      this.textarea.scrollTop = ratio * this.textarea.scrollHeight;
    });

    // Drag and drop
    this.element.addEventListener('dragover', (e) => { e.preventDefault(); this.element.classList.add('ce-dragover'); });
    this.element.addEventListener('dragleave', () => this.element.classList.remove('ce-dragover'));
    this.element.addEventListener('drop', (e) => {
      e.preventDefault();
      this.element.classList.remove('ce-dragover');
      const files = e.dataTransfer.files;
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this._createTab(file.name, ev.target.result);
        };
        reader.readAsText(file);
      }
    });

    // Global keyboard shortcuts
    this._globalKeyDown = (e) => this._handleGlobalKeys(e);
    this.element.addEventListener('keydown', this._globalKeyDown);
  }

  _handleGlobalKeys(e) {
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === 's') {
      e.preventDefault();
      if (e.shiftKey) this._saveAs();
      else this._save();
      return;
    }
    if (ctrl && e.key === 'n') { e.preventDefault(); this._createTab(); return; }
    if (ctrl && e.key === 'o') { e.preventDefault(); this._openFile(); return; }
    if (ctrl && e.key === 'f') { e.preventDefault(); this._showFindBar(false); return; }
    if (ctrl && e.key === 'h') { e.preventDefault(); this._showFindBar(true); return; }
    if (ctrl && e.key === 'g') { e.preventDefault(); this._goToLine(); return; }
    if (ctrl && e.key === 'z' && e.shiftKey) { e.preventDefault(); this._redo(); return; }
    if (ctrl && e.key === 'z') { e.preventDefault(); this._undo(); return; }
    if (ctrl && (e.key === '=' || e.key === '+')) { e.preventDefault(); this._changeFontSize(1); return; }
    if (ctrl && e.key === '-') { e.preventDefault(); this._changeFontSize(-1); return; }
    if (ctrl && e.key === 'w') { e.preventDefault(); if (this.activeTabIndex >= 0) this._closeTab(this.activeTabIndex); return; }
  }

  _handleToolbarAction(action) {
    switch (action) {
      case 'new': this._createTab(); break;
      case 'open': this._openFile(); break;
      case 'save': this._save(); break;
      case 'saveas': this._saveAs(); break;
      case 'find': this._showFindBar(false); break;
      case 'replace': this._showFindBar(true); break;
      case 'goto': this._goToLine(); break;
      case 'wrap': this._toggleWordWrap(); break;
      case 'minimap': this._toggleMinimap(); break;
      case 'fontplus': this._changeFontSize(1); break;
      case 'fontminus': this._changeFontSize(-1); break;
    }
  }

  // ─── Tab Management ─────────────────────────────────────────────
  _createTab(name, content) {
    const id = ++this.tabIdCounter;
    const ext = name ? name.split('.').pop() : 'js';
    const language = this.languageMap[ext] || 'plaintext';
    const tab = {
      id, name: name || `untitled-${id}.js`,
      content: content || '',
      language,
      modified: false,
      cursorPos: 0,
      scrollTop: 0
    };
    this.tabs.push(tab);
    this._switchTab(this.tabs.length - 1);
    this._renderTabs();
    return tab;
  }

  _switchTab(index) {
    if (index < 0 || index >= this.tabs.length) return;

    // Save current tab state
    if (this.activeTabIndex >= 0 && this.tabs[this.activeTabIndex]) {
      const cur = this.tabs[this.activeTabIndex];
      cur.content = this.textarea.value;
      cur.cursorPos = this.textarea.selectionStart;
      cur.scrollTop = this.textarea.scrollTop;
    }

    this.activeTabIndex = index;
    const tab = this.tabs[index];

    this.textarea.value = tab.content;
    this.textarea.setSelectionRange(tab.cursorPos, tab.cursorPos);
    this.textarea.scrollTop = tab.scrollTop;

    // Reset undo/redo for this tab
    this.undoStack = [];
    this.redoStack = [];

    // Update language selector
    this.element.querySelector('.ce-lang-select').value = tab.language;

    this._updateHighlight();
    this._updateLineNumbers();
    this._updateStatus();
    this._updateMinimap();
    this._renderTabs();
  }

  _closeTab(index) {
    if (this.tabs.length <= 1) {
      // Don't close last tab, just clear it
      this.tabs[0].content = '';
      this.tabs[0].name = 'untitled.js';
      this.tabs[0].modified = false;
      this.textarea.value = '';
      this._updateHighlight();
      this._updateLineNumbers();
      this._updateStatus();
      this._renderTabs();
      return;
    }

    this.tabs.splice(index, 1);
    if (this.activeTabIndex >= this.tabs.length) {
      this.activeTabIndex = this.tabs.length - 1;
    } else if (this.activeTabIndex > index) {
      this.activeTabIndex--;
    }
    this._switchTab(this.activeTabIndex);
  }

  _renderTabs() {
    const tabsEl = this.element.querySelector('#ce-tabs');
    tabsEl.innerHTML = this.tabs.map((tab, i) => {
      const active = i === this.activeTabIndex ? 'ce-tab-active' : '';
      const modified = tab.modified ? 'ce-tab-modified' : '';
      return `<div class="ce-tab ${active} ${modified}" data-index="${i}">
        <span class="ce-tab-name">${this._escapeHtml(tab.name)}</span>
        <span class="ce-tab-close" data-index="${i}" title="Close">✕</span>
      </div>`;
    }).join('');
  }

  // ─── Input Handling ─────────────────────────────────────────────
  _onInput() {
    const tab = this.tabs[this.activeTabIndex];
    if (!tab) return;

    // Save undo state
    this.undoStack.push({
      content: tab.content,
      cursor: this.textarea.selectionStart
    });
    if (this.undoStack.length > this.maxUndo) this.undoStack.shift();
    this.redoStack = [];

    tab.content = this.textarea.value;
    if (!tab.modified) {
      tab.modified = true;
      this._renderTabs();
    }

    this._updateHighlight();
    this._updateLineNumbers();
    this._updateStatus();
    this._updateMinimap();
  }

  _onKeyDown(e) {
    // Tab key — insert spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.textarea.selectionStart;
      const end = this.textarea.selectionEnd;
      const val = this.textarea.value;
      const spaces = ' '.repeat(this.tabSize);

      if (e.shiftKey) {
        // Dedent
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const lineContent = val.substring(lineStart, start);
        const dedentSpaces = spaces.length;
        if (lineContent.startsWith(spaces)) {
          this.textarea.value = val.substring(0, lineStart) + val.substring(lineStart + dedentSpaces);
          this.textarea.setSelectionRange(start - dedentSpaces, end - dedentSpaces);
        }
      } else {
        this.textarea.value = val.substring(0, start) + spaces + val.substring(end);
        this.textarea.setSelectionRange(start + this.tabSize, start + this.tabSize);
      }
      this._onInput();
      return;
    }

    // Enter — auto-indent
    if (e.key === 'Enter') {
      e.preventDefault();
      const start = this.textarea.selectionStart;
      const val = this.textarea.value;
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const lineContent = val.substring(lineStart, start);
      const indent = lineContent.match(/^(\s*)/)[1];
      const lastChar = val[start - 1];
      let newIndent = indent;
      if (lastChar === '{' || lastChar === '(' || lastChar === '[') {
        newIndent += ' '.repeat(this.tabSize);
      }
      const insertion = '\n' + newIndent;
      this.textarea.value = val.substring(0, start) + insertion + val.substring(this.textarea.selectionEnd);
      this.textarea.setSelectionRange(start + insertion.length, start + insertion.length);
      this._onInput();
      return;
    }

    // Auto-close brackets and quotes
    const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };
    if (pairs[e.key]) {
      const start = this.textarea.selectionStart;
      const end = this.textarea.selectionEnd;
      const val = this.textarea.value;

      // Skip if closing bracket already exists
      if (')]}"\'`'.includes(e.key) && val[start] === e.key) {
        e.preventDefault();
        this.textarea.setSelectionRange(start + 1, start + 1);
        return;
      }

      if (start !== end) {
        // Wrap selection
        e.preventDefault();
        const selected = val.substring(start, end);
        this.textarea.value = val.substring(0, start) + e.key + selected + pairs[e.key] + val.substring(end);
        this.textarea.setSelectionRange(start + 1, end + 1);
        this._onInput();
        return;
      }

      e.preventDefault();
      this.textarea.value = val.substring(0, start) + e.key + pairs[e.key] + val.substring(end);
      this.textarea.setSelectionRange(start + 1, start + 1);
      this._onInput();
      return;
    }

    // Backspace — remove matching bracket
    if (e.key === 'Backspace') {
      const start = this.textarea.selectionStart;
      const val = this.textarea.value;
      if (start > 0 && start === this.textarea.selectionEnd) {
        const before = val[start - 1];
        const after = val[start];
        if ((before === '(' && after === ')') ||
            (before === '[' && after === ']') ||
            (before === '{' && after === '}') ||
            (before === '"' && after === '"') ||
            (before === "'" && after === "'") ||
            (before === '`' && after === '`')) {
          e.preventDefault();
          this.textarea.value = val.substring(0, start - 1) + val.substring(start + 1);
          this.textarea.setSelectionRange(start - 1, start - 1);
          this._onInput();
          return;
        }
      }
    }
  }

  _onScroll() {
    // Sync highlight and line numbers
    this.highlightEl.scrollTop = this.textarea.scrollTop;
    this.highlightEl.scrollLeft = this.textarea.scrollLeft;
    this.lineNumbersEl.scrollTop = this.textarea.scrollTop;
    this._updateMinimapViewport();
  }

  // ─── Undo / Redo ────────────────────────────────────────────────
  _undo() {
    if (this.undoStack.length === 0) return;
    const state = this.undoStack.pop();
    this.redoStack.push({
      content: this.textarea.value,
      cursor: this.textarea.selectionStart
    });
    this.textarea.value = state.content;
    this.textarea.setSelectionRange(state.cursor, state.cursor);
    const tab = this.tabs[this.activeTabIndex];
    if (tab) tab.content = state.content;
    this._updateHighlight();
    this._updateLineNumbers();
    this._updateStatus();
  }

  _redo() {
    if (this.redoStack.length === 0) return;
    const state = this.redoStack.pop();
    this.undoStack.push({
      content: this.textarea.value,
      cursor: this.textarea.selectionStart
    });
    this.textarea.value = state.content;
    this.textarea.setSelectionRange(state.cursor, state.cursor);
    const tab = this.tabs[this.activeTabIndex];
    if (tab) tab.content = state.content;
    this._updateHighlight();
    this._updateLineNumbers();
    this._updateStatus();
  }

  // ─── Syntax Highlighting ────────────────────────────────────────
  _updateHighlight() {
    const tab = this.tabs[this.activeTabIndex];
    if (!tab) return;
    const code = this.textarea.value;
    const highlighted = this._highlight(code, tab.language);
    this.highlightEl.querySelector('code').innerHTML = highlighted + '\n';
  }

  _highlight(code, language) {
    const escaped = this._escapeHtml(code);
    if (language === 'plaintext') return escaped;
    return this._tokenize(escaped, language);
  }

  _tokenize(code, lang) {
    // Language-specific keyword sets
    const keywords = {
      javascript: ['const','let','var','function','return','if','else','for','while','do','switch','case','break','continue',
        'class','extends','new','this','super','import','export','default','from','async','await','try','catch','finally',
        'throw','typeof','instanceof','in','of','null','undefined','true','false','void','delete','yield','static','get','set'],
      python: ['def','class','if','elif','else','for','while','return','import','from','as','try','except','finally',
        'raise','with','yield','lambda','pass','break','continue','and','or','not','is','in','True','False','None',
        'global','nonlocal','assert','del','print','self'],
      css: ['color','background','border','margin','padding','font','display','position','width','height','top','right',
        'bottom','left','flex','grid','align','justify','transform','transition','animation','opacity','overflow',
        'z-index','box-shadow','text','cursor','content','visibility','float','clear'],
      html: [],
      json: [],
      markdown: []
    };

    const langKeywords = keywords[lang] || keywords.javascript;

    // Token patterns (order matters — first match wins)
    const patterns = [
      // Multi-line comments
      { regex: /\/\*[\s\S]*?\*\//g, cls: 'ce-comment' },
      // Single-line comments
      { regex: /\/\/.*$/gm, cls: 'ce-comment' },
      // Python comments
      { regex: /#.*$/gm, cls: 'ce-comment', langs: ['python'] },
      // Template literals
      { regex: /`(?:[^`\\]|\\.)*`/g, cls: 'ce-string' },
      // Double-quoted strings
      { regex: /"(?:[^"\\]|\\.)*"/g, cls: 'ce-string' },
      // Single-quoted strings
      { regex: /'(?:[^'\\]|\\.)*'/g, cls: 'ce-string' },
      // Numbers
      { regex: /\b\d+\.?\d*(?:e[+-]?\d+)?\b/gi, cls: 'ce-number' },
      // HTML tags
      { regex: /&lt;\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^&]*?)?\/?\s*&gt;/g, cls: 'ce-tag', langs: ['html'] },
      // CSS properties
      { regex: /\b[a-z-]+(?=\s*:)/g, cls: 'ce-property', langs: ['css'] },
      // Function calls
      { regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, cls: 'ce-function' },
      // Operators
      { regex: /[+\-*/%=!<>&|^~?:]+/g, cls: 'ce-operator' },
      // Punctuation
      { regex: /[{}[\]();,.]/g, cls: 'ce-punctuation' },
    ];

    // Build keyword pattern
    if (langKeywords.length > 0) {
      const kwPattern = new RegExp('\\b(' + langKeywords.join('|') + ')\\b', 'g');
      patterns.unshift({ regex: kwPattern, cls: 'ce-keyword' });
    }

    // HTML-specific: highlight tag names
    if (lang === 'html') {
      patterns.unshift({ regex: /(&lt;\/?)([a-zA-Z][a-zA-Z0-9-]*)/g, cls: 'ce-tag-name', replace: true });
      patterns.push({ regex: /\b([a-zA-Z-]+)(=)/g, cls: 'ce-attribute', langs: ['html'] });
    }

    // JSON-specific
    if (lang === 'json') {
      patterns.unshift({ regex: /"([^"]+)"(\s*:)/g, cls: 'ce-json-key' });
    }

    // Markdown-specific
    if (lang === 'markdown') {
      return this._highlightMarkdown(code);
    }

    // Apply tokenization using placeholder approach
    const tokens = [];
    let tokenIdx = 0;
    let result = code;

    for (const pattern of patterns) {
      if (pattern.langs && !pattern.langs.includes(lang)) continue;

      result = result.replace(pattern.regex, (match) => {
        const placeholder = `\x00${tokenIdx}\x00`;
        tokens.push(`<span class="${pattern.cls}">${match}</span>`);
        tokenIdx++;
        return placeholder;
      });
    }

    // Restore tokens
    for (let i = 0; i < tokens.length; i++) {
      result = result.replace(`\x00${i}\x00`, tokens[i]);
    }

    return result;
  }

  _highlightMarkdown(code) {
    return code
      .replace(/^(#{1,6}\s.*)$/gm, '<span class="ce-md-heading">$1</span>')
      .replace(/^(\s*[-*+]\s)/gm, '<span class="ce-md-list">$1</span>')
      .replace(/(`[^`]+`)/g, '<span class="ce-md-code">$1</span>')
      .replace(/(\*\*[^*]+\*\*)/g, '<span class="ce-md-bold">$1</span>')
      .replace(/(\*[^*]+\*)/g, '<span class="ce-md-italic">$1</span>')
      .replace(/(^&gt;.*$)/gm, '<span class="ce-md-quote">$1</span>')
      .replace(/(\[.*?\]\(.*?\))/g, '<span class="ce-md-link">$1</span>');
  }

  // ─── Line Numbers ───────────────────────────────────────────────
  _updateLineNumbers() {
    const lines = this.textarea.value.split('\n');
    const count = lines.length;
    let html = '';
    for (let i = 1; i <= count; i++) {
      html += `<div class="ce-ln">${i}</div>`;
    }
    this.lineNumbersEl.innerHTML = html;
  }

  // ─── Status Bar ─────────────────────────────────────────────────
  _updateStatus() {
    const val = this.textarea.value;
    const pos = this.textarea.selectionStart;
    const before = val.substring(0, pos);
    const line = before.split('\n').length;
    const col = pos - before.lastIndexOf('\n');
    const totalLines = val.split('\n').length;
    const words = val.trim() ? val.trim().split(/\s+/).length : 0;
    const selected = Math.abs(this.textarea.selectionEnd - this.textarea.selectionStart);

    const tab = this.tabs[this.activeTabIndex];
    const lang = tab ? tab.language : 'plaintext';

    this.element.querySelector('.ce-status-cursor').textContent = `Ln ${line}, Col ${col}`;
    this.element.querySelector('.ce-status-lines').textContent = `${totalLines} lines`;
    this.element.querySelector('.ce-status-lang').textContent = this._langDisplayName(lang);
    this.element.querySelector('.ce-status-words').textContent = `${words} words`;
    this.element.querySelector('.ce-status-tabs').textContent = `Spaces: ${this.tabSize}`;

    const selEl = this.element.querySelector('.ce-status-selection');
    selEl.textContent = selected > 0 ? `(${selected} selected)` : '';

    const saveEl = this.element.querySelector('.ce-status-save');
    if (this.lastSaveTime) {
      saveEl.textContent = `Saved ${this._timeAgo(this.lastSaveTime)}`;
    }
  }

  _langDisplayName(lang) {
    const names = {
      javascript: 'JavaScript', html: 'HTML', css: 'CSS',
      python: 'Python', json: 'JSON', markdown: 'Markdown', plaintext: 'Plain Text'
    };
    return names[lang] || lang;
  }

  _timeAgo(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  // ─── Minimap ────────────────────────────────────────────────────
  _updateMinimap() {
    if (!this.showMinimap) return;
    const canvas = this.minimapCanvas;
    const ctx = canvas.getContext('2d');
    const lines = this.textarea.value.split('\n');
    const lineH = 3;
    const charW = 1.5;
    const height = Math.min(lines.length * lineH, 2000);

    canvas.width = 120;
    canvas.height = height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colors = {
      keyword: '#ff2d6b', string: '#00ff88', comment: '#444466',
      number: '#ffaa00', func: '#00ccff', other: '#888'
    };

    lines.forEach((line, i) => {
      const y = i * lineH;
      if (y > height) return;
      const trimmed = line.trimStart();
      if (!trimmed) return;

      let color = colors.other;
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        color = colors.comment;
      } else if (/^\s*(function|class|const|let|var|if|else|for|while|return|import|export)/.test(line)) {
        color = colors.keyword;
      } else if (/["'`]/.test(trimmed) && !trimmed.startsWith('//')) {
        color = colors.string;
      }

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.6;
      const width = Math.min(trimmed.length * charW, canvas.width - 4);
      ctx.fillRect(2, y, width, lineH - 1);
    });
    ctx.globalAlpha = 1;
    this._updateMinimapViewport();
  }

  _updateMinimapViewport() {
    const viewport = this.element.querySelector('.ce-minimap-viewport');
    if (!viewport || !this.showMinimap) return;
    const scrollRatio = this.textarea.scrollTop / (this.textarea.scrollHeight || 1);
    const viewRatio = this.textarea.clientHeight / (this.textarea.scrollHeight || 1);
    const canvasH = this.minimapCanvas.height;
    viewport.style.top = (scrollRatio * canvasH) + 'px';
    viewport.style.height = Math.max(viewRatio * canvasH, 10) + 'px';
  }

  // ─── Find & Replace ─────────────────────────────────────────────
  _showFindBar(withReplace) {
    this.findBar.style.display = 'block';
    const replaceRow = this.findBar.querySelector('.ce-replace-row');
    replaceRow.style.display = withReplace ? 'flex' : 'none';
    this.findInput.focus();
    this.findInput.select();
  }

  _hideFindBar() {
    this.findBar.style.display = 'none';
    this.textarea.focus();
  }

  _performFind() {
    const query = this.findInput.value;
    if (!query) { this.findCount.textContent = ''; return; }

    const text = this.textarea.value;
    const isRegex = this.findBar.querySelector('[data-find="regex"]').classList.contains('active');
    const isCaseSensitive = this.findBar.querySelector('[data-find="case"]').classList.contains('active');

    let regex;
    try {
      regex = new RegExp(isRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        isCaseSensitive ? 'g' : 'gi');
    } catch (e) {
      this.findCount.textContent = 'Invalid regex';
      return;
    }

    const matches = [...text.matchAll(regex)];
    this._findMatches = matches;
    this._findIndex = -1;
    this.findCount.textContent = `${matches.length} result${matches.length !== 1 ? 's' : ''}`;
  }

  _findNext(dir) {
    if (!this._findMatches || this._findMatches.length === 0) return;
    this._findIndex = (this._findIndex + dir + this._findMatches.length) % this._findMatches.length;
    const match = this._findMatches[this._findIndex];
    this.textarea.setSelectionRange(match.index, match.index + match[0].length);
    this.textarea.focus();
    // Scroll into view
    const lines = this.textarea.value.substring(0, match.index).split('\n');
    const lineHeight = parseInt(getComputedStyle(this.textarea).lineHeight) || 20;
    this.textarea.scrollTop = (lines.length - 3) * lineHeight;
  }

  _performReplace() {
    if (!this._findMatches || this._findMatches.length === 0 || this._findIndex < 0) return;
    const match = this._findMatches[this._findIndex];
    const replacement = this.replaceInput.value;
    const val = this.textarea.value;
    this.textarea.value = val.substring(0, match.index) + replacement + val.substring(match.index + match[0].length);
    this._onInput();
    this._performFind();
  }

  _performReplaceAll() {
    const query = this.findInput.value;
    if (!query) return;
    const text = this.textarea.value;
    const isRegex = this.findBar.querySelector('[data-find="regex"]').classList.contains('active');
    const isCaseSensitive = this.findBar.querySelector('[data-find="case"]').classList.contains('active');
    const replacement = this.replaceInput.value;

    let regex;
    try {
      regex = new RegExp(isRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        isCaseSensitive ? 'g' : 'gi');
    } catch (e) { return; }

    this.textarea.value = text.replace(regex, replacement);
    this._onInput();
    this._performFind();
  }

  // ─── Go to Line ─────────────────────────────────────────────────
  _goToLine() {
    const input = prompt('Go to line:');
    if (!input) return;
    const lineNum = parseInt(input);
    if (isNaN(lineNum) || lineNum < 1) return;

    const lines = this.textarea.value.split('\n');
    if (lineNum > lines.length) return;

    let pos = 0;
    for (let i = 0; i < lineNum - 1; i++) pos += lines[i].length + 1;
    this.textarea.setSelectionRange(pos, pos);
    this.textarea.focus();

    const lineHeight = parseInt(getComputedStyle(this.textarea).lineHeight) || 20;
    this.textarea.scrollTop = (lineNum - 5) * lineHeight;
  }

  // ─── File Operations ────────────────────────────────────────────
  _openFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.js,.ts,.jsx,.tsx,.html,.htm,.css,.scss,.py,.json,.md,.txt,.xml,.yaml,.yml,.sh,.bat,.cfg,.conf,.ini';
    input.multiple = true;
    input.addEventListener('change', () => {
      for (const file of input.files) {
        const reader = new FileReader();
        reader.onload = (e) => this._createTab(file.name, e.target.result);
        reader.readAsText(file);
      }
    });
    input.click();
  }

  _save() {
    const tab = this.tabs[this.activeTabIndex];
    if (!tab) return;

    // Try to save to virtual filesystem
    try {
      if (typeof NexusFilesystem !== 'undefined') {
        // Would save to VFS here
      }
    } catch (e) { /* fallback to download */ }

    this._downloadFile(tab.name, tab.content);
    tab.modified = false;
    this.lastSaveTime = Date.now();
    this._renderTabs();
    this._updateStatus();
  }

  _saveAs() {
    const tab = this.tabs[this.activeTabIndex];
    if (!tab) return;
    const name = prompt('Save as:', tab.name);
    if (!name) return;
    tab.name = name;
    const ext = name.split('.').pop();
    tab.language = this.languageMap[ext] || 'plaintext';
    this.element.querySelector('.ce-lang-select').value = tab.language;
    this._downloadFile(name, tab.content);
    tab.modified = false;
    this.lastSaveTime = Date.now();
    this._renderTabs();
    this._updateStatus();
  }

  _downloadFile(name, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Auto-save ──────────────────────────────────────────────────
  _autoSave() {
    try {
      const state = {
        tabs: this.tabs.map(t => ({ name: t.name, content: t.content, language: t.language })),
        activeIndex: this.activeTabIndex,
        tabSize: this.tabSize,
        fontSize: this.fontSize,
        timestamp: Date.now()
      };
      if (typeof NexusStorage !== 'undefined') {
        const store = NexusStorage.getInstance ? NexusStorage.getInstance() : null;
        if (store) { store.set('editor-state', state, 'code-editor'); return; }
      }
      localStorage.setItem('nexus:code-editor:state', JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  _restoreAutoSave() {
    try {
      let state = null;
      if (typeof NexusStorage !== 'undefined') {
        const store = NexusStorage.getInstance ? NexusStorage.getInstance() : null;
        if (store) state = store.get('editor-state', null, 'code-editor');
      }
      if (!state) {
        const raw = localStorage.getItem('nexus:code-editor:state');
        if (raw) state = JSON.parse(raw);
      }
      if (!state || !state.tabs || state.tabs.length === 0) return;

      // Clear the initial tab
      this.tabs = [];
      this.activeTabIndex = -1;

      state.tabs.forEach(t => this._createTab(t.name, t.content));
      if (state.activeIndex < this.tabs.length) this._switchTab(state.activeIndex);
      if (state.tabSize) this.tabSize = state.tabSize;
      if (state.fontSize) this._changeFontSize(0, state.fontSize);
    } catch (e) { /* ignore */ }
  }

  // ─── Code Execution ─────────────────────────────────────────────
  _runCode() {
    const tab = this.tabs[this.activeTabIndex];
    if (!tab) return;
    if (tab.language !== 'javascript') {
      this._consoleLog('error', 'Run is only supported for JavaScript files.');
      this._showConsole(true);
      return;
    }

    this._showConsole(true);
    this.consoleOutputEl.innerHTML = '';
    this.consoleOutput = [];
    this._consoleLog('info', `▶ Running ${tab.name}...`);

    // Sandbox console
    const sandboxConsole = {
      log: (...args) => this._consoleLog('log', args.map(a => this._formatValue(a)).join(' ')),
      error: (...args) => this._consoleLog('error', args.map(a => this._formatValue(a)).join(' ')),
      warn: (...args) => this._consoleLog('warn', args.map(a => this._formatValue(a)).join(' ')),
      info: (...args) => this._consoleLog('info', args.map(a => this._formatValue(a)).join(' ')),
      clear: () => { this.consoleOutputEl.innerHTML = ''; }
    };

    const startTime = performance.now();
    try {
      const fn = new Function('console', tab.content);
      const result = fn(sandboxConsole);
      const elapsed = (performance.now() - startTime).toFixed(2);
      if (result !== undefined) {
        this._consoleLog('result', `← ${this._formatValue(result)}`);
      }
      this._consoleLog('dim', `Completed in ${elapsed}ms`);
    } catch (err) {
      const elapsed = (performance.now() - startTime).toFixed(2);
      this._consoleLog('error', `✗ ${err.name}: ${err.message}`);
      if (err.stack) {
        const line = err.stack.match(/:(\d+):(\d+)/);
        if (line) this._consoleLog('error', `  at line ${line[1]}, column ${line[2]}`);
      }
      this._consoleLog('dim', `Failed after ${elapsed}ms`);
    }
  }

  _consoleLog(type, text) {
    const div = document.createElement('div');
    div.className = `ce-console-line ce-console-${type}`;
    div.textContent = text;
    this.consoleOutputEl.appendChild(div);
    this.consoleOutputEl.scrollTop = this.consoleOutputEl.scrollHeight;
  }

  _showConsole(show) {
    this.showConsole = show;
    this.consoleEl.style.display = show ? 'flex' : 'none';
  }

  _formatValue(val) {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'object') {
      try { return JSON.stringify(val, null, 2); }
      catch (e) { return String(val); }
    }
    return String(val);
  }

  // ─── Toggles ────────────────────────────────────────────────────
  _toggleWordWrap() {
    this.wordWrap = !this.wordWrap;
    this.textarea.style.whiteSpace = this.wordWrap ? 'pre-wrap' : 'pre';
    this.textarea.style.overflowX = this.wordWrap ? 'hidden' : 'auto';
    this.highlightEl.style.whiteSpace = this.wordWrap ? 'pre-wrap' : 'pre';
  }

  _toggleMinimap() {
    this.showMinimap = !this.showMinimap;
    this.minimapEl.style.display = this.showMinimap ? 'block' : 'none';
    if (this.showMinimap) this._updateMinimap();
  }

  _changeFontSize(delta, absolute) {
    if (absolute !== undefined) {
      this.fontSize = absolute;
    } else {
      this.fontSize = Math.max(10, Math.min(28, this.fontSize + delta));
    }
    this.textarea.style.fontSize = this.fontSize + 'px';
    this.highlightEl.style.fontSize = this.fontSize + 'px';
    this.lineNumbersEl.style.fontSize = this.fontSize + 'px';
    this._updateLineNumbers();
  }

  // ─── Utilities ──────────────────────────────────────────────────
  _escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ─── Styles ─────────────────────────────────────────────────────
  _getStyles() {
    return `
      .nexus-code-editor {
        width: 100%; height: 100%;
        background: rgba(8, 4, 16, 0.97);
        border: 1px solid rgba(255, 0, 60, 0.2);
        border-radius: 8px;
        display: flex; flex-direction: column;
        font-family: 'Courier New', 'Fira Code', 'Consolas', monospace;
        overflow: hidden;
        box-shadow: 0 0 30px rgba(255, 0, 60, 0.1);
      }

      .nexus-code-editor.ce-dragover {
        border-color: #ff003c;
        box-shadow: 0 0 40px rgba(255, 0, 60, 0.3), inset 0 0 40px rgba(255, 0, 60, 0.05);
      }

      /* Tab Bar */
      .ce-tab-bar {
        display: flex; align-items: center;
        background: rgba(15, 8, 25, 0.9);
        border-bottom: 1px solid rgba(255, 0, 60, 0.12);
        height: 34px; flex-shrink: 0;
      }
      .ce-tabs { display: flex; overflow-x: auto; flex: 1; }
      .ce-tabs::-webkit-scrollbar { height: 0; }
      .ce-tab {
        display: flex; align-items: center; gap: 6px;
        padding: 0 12px; height: 34px;
        font-size: 11px; color: #777;
        border-right: 1px solid rgba(255, 0, 60, 0.08);
        cursor: pointer; white-space: nowrap;
        transition: background 0.15s;
      }
      .ce-tab:hover { background: rgba(255, 0, 60, 0.06); }
      .ce-tab-active { background: rgba(255, 0, 60, 0.12) !important; color: #ddd; border-bottom: 2px solid #ff003c; }
      .ce-tab-modified .ce-tab-name::after { content: '●'; color: #ffaa00; margin-left: 4px; font-size: 8px; }
      .ce-tab-close { font-size: 12px; opacity: 0.4; cursor: pointer; padding: 2px; border-radius: 3px; }
      .ce-tab-close:hover { opacity: 1; background: rgba(255, 0, 60, 0.3); color: #fff; }
      .ce-tab-add {
        background: none; border: none; color: #666; font-size: 16px;
        padding: 0 10px; cursor: pointer; height: 34px;
      }
      .ce-tab-add:hover { color: #ff003c; }

      /* Toolbar */
      .ce-toolbar {
        display: flex; align-items: center; gap: 4px;
        padding: 4px 8px;
        background: rgba(12, 6, 22, 0.8);
        border-bottom: 1px solid rgba(255, 0, 60, 0.08);
        flex-shrink: 0;
      }
      .ce-toolbar-group { display: flex; gap: 2px; align-items: center; }
      .ce-toolbar-divider { width: 1px; height: 18px; background: rgba(255, 0, 60, 0.15); margin: 0 4px; }
      .ce-toolbar-spacer { flex: 1; }
      .ce-tb-btn {
        background: rgba(255, 0, 60, 0.08); border: 1px solid rgba(255, 0, 60, 0.12);
        color: #aaa; padding: 3px 8px; border-radius: 4px; font-size: 10px;
        cursor: pointer; display: flex; align-items: center; gap: 4px;
        font-family: inherit; transition: all 0.15s;
      }
      .ce-tb-btn:hover { background: rgba(255, 0, 60, 0.2); color: #fff; border-color: rgba(255, 0, 60, 0.3); }
      .ce-lang-select {
        background: rgba(20, 10, 35, 0.9); border: 1px solid rgba(255, 0, 60, 0.15);
        color: #aaa; padding: 3px 6px; border-radius: 4px; font-size: 10px;
        font-family: inherit; outline: none; cursor: pointer;
      }
      .ce-run-btn {
        background: rgba(0, 255, 136, 0.12); border: 1px solid rgba(0, 255, 136, 0.3);
        color: #00ff88; padding: 4px 12px; border-radius: 4px; font-size: 11px;
        cursor: pointer; display: flex; align-items: center; gap: 5px;
        font-family: inherit; transition: all 0.15s;
      }
      .ce-run-btn:hover { background: rgba(0, 255, 136, 0.25); box-shadow: 0 0 12px rgba(0, 255, 136, 0.2); }

      /* Find Bar */
      .ce-find-bar {
        padding: 6px 10px;
        background: rgba(15, 8, 25, 0.95);
        border-bottom: 1px solid rgba(255, 0, 60, 0.12);
        flex-shrink: 0;
      }
      .ce-find-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
      .ce-find-row:last-child { margin-bottom: 0; }
      .ce-find-input {
        flex: 1; padding: 4px 8px; font-size: 12px;
        background: rgba(20, 10, 35, 0.9); border: 1px solid rgba(255, 0, 60, 0.2);
        color: #ddd; border-radius: 4px; outline: none; font-family: inherit;
      }
      .ce-find-input:focus { border-color: #ff003c; }
      .ce-find-count { font-size: 10px; color: #888; min-width: 60px; }
      .ce-find-btn {
        background: rgba(255, 0, 60, 0.1); border: 1px solid rgba(255, 0, 60, 0.15);
        color: #aaa; padding: 3px 8px; border-radius: 3px; font-size: 11px;
        cursor: pointer; font-family: inherit;
      }
      .ce-find-btn:hover { background: rgba(255, 0, 60, 0.2); color: #fff; }
      .ce-find-btn.active { background: rgba(255, 0, 60, 0.3); color: #ff003c; border-color: #ff003c; }

      /* Editor Area */
      .ce-editor-area {
        flex: 1; display: flex; overflow: hidden; position: relative;
      }
      .ce-line-numbers {
        width: 48px; flex-shrink: 0;
        background: rgba(10, 5, 20, 0.6);
        border-right: 1px solid rgba(255, 0, 60, 0.08);
        padding: 8px 0; overflow: hidden;
        text-align: right; user-select: none;
      }
      .ce-ln {
        padding: 0 8px; font-size: 12px; line-height: 1.5;
        color: #444; height: 1.5em;
      }
      .ce-code-container {
        flex: 1; position: relative; overflow: hidden;
      }
      .ce-highlight {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        padding: 8px; margin: 0; overflow: hidden;
        font-size: 14px; line-height: 1.5;
        color: #c8c8d8; white-space: pre-wrap;
        word-wrap: break-word; pointer-events: none;
        font-family: 'Courier New', 'Fira Code', 'Consolas', monospace;
      }
      .ce-highlight code { font-family: inherit; font-size: inherit; }
      .ce-textarea {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        padding: 8px; margin: 0; border: none; outline: none;
        background: transparent; color: transparent;
        caret-color: #ff003c; resize: none;
        font-size: 14px; line-height: 1.5;
        white-space: pre-wrap; word-wrap: break-word;
        font-family: 'Courier New', 'Fira Code', 'Consolas', monospace;
        tab-size: 2; overflow: auto;
        z-index: 2;
      }
      .ce-textarea::selection { background: rgba(255, 0, 60, 0.3); }

      /* Syntax highlighting colors */
      .ce-keyword { color: #ff2d6b; font-weight: bold; }
      .ce-string { color: #00ff88; }
      .ce-comment { color: #555577; font-style: italic; }
      .ce-number { color: #ffaa00; }
      .ce-function { color: #00ccff; }
      .ce-operator { color: #ff003c; }
      .ce-punctuation { color: #888; }
      .ce-tag { color: #ff4488; }
      .ce-tag-name { color: #ff4488; }
      .ce-attribute { color: #cc99ff; }
      .ce-property { color: #cc99ff; }
      .ce-json-key { color: #00ccff; }
      .ce-md-heading { color: #ff003c; font-weight: bold; }
      .ce-md-bold { color: #fff; font-weight: bold; }
      .ce-md-italic { color: #ddd; font-style: italic; }
      .ce-md-code { color: #00ff88; background: rgba(0,255,136,0.08); }
      .ce-md-quote { color: #666; }
      .ce-md-list { color: #ff003c; }
      .ce-md-link { color: #00ccff; }

      /* Minimap */
      .ce-minimap {
        width: 120px; flex-shrink: 0;
        background: rgba(5, 2, 10, 0.5);
        border-left: 1px solid rgba(255, 0, 60, 0.08);
        position: relative; overflow: hidden;
        cursor: pointer;
      }
      .ce-minimap-canvas { width: 100%; height: 100%; }
      .ce-minimap-viewport {
        position: absolute; left: 0; right: 0;
        background: rgba(255, 0, 60, 0.08);
        border: 1px solid rgba(255, 0, 60, 0.2);
        pointer-events: none;
      }

      /* Console */
      .ce-console {
        height: 150px; flex-shrink: 0;
        border-top: 1px solid rgba(255, 0, 60, 0.15);
        display: flex; flex-direction: column;
        background: rgba(5, 2, 10, 0.9);
      }
      .ce-console-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 4px 10px; font-size: 10px; color: #888;
        background: rgba(15, 8, 25, 0.8);
        border-bottom: 1px solid rgba(255, 0, 60, 0.08);
      }
      .ce-console-clear {
        background: none; border: none; color: #666; cursor: pointer; font-size: 12px;
      }
      .ce-console-clear:hover { color: #ff003c; }
      .ce-console-output {
        flex: 1; overflow-y: auto; padding: 6px 10px;
        font-size: 12px; line-height: 1.5;
      }
      .ce-console-line { padding: 1px 0; }
      .ce-console-log { color: #c8c8d8; }
      .ce-console-error { color: #ff003c; }
      .ce-console-warn { color: #ffaa00; }
      .ce-console-info { color: #00ccff; }
      .ce-console-result { color: #00ff88; }
      .ce-console-dim { color: #555; font-size: 11px; }

      /* Status Bar */
      .ce-status-bar {
        display: flex; align-items: center; gap: 12px;
        padding: 2px 10px; height: 22px;
        background: rgba(255, 0, 60, 0.12);
        border-top: 1px solid rgba(255, 0, 60, 0.15);
        font-size: 10px; color: #999; flex-shrink: 0;
      }
      .ce-status-spacer { flex: 1; }
      .ce-status-item { white-space: nowrap; }
    `;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.NexusCodeEditor = NexusCodeEditor;
}
