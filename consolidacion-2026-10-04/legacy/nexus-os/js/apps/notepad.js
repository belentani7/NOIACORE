'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Notepad / Notes
 *  Rich text notes with tags, categories, and markdown support
 * ═══════════════════════════════════════════════════════════════
 */
class NexusNotepad {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.notes = [];
    this.activeNoteId = null;
    this.markdownMode = false;
    this.searchQuery = '';
    this.activeTag = null;
    this.activeFolder = 'all';
    this.noteIdCounter = 0;
    this.autoSaveTimer = null;

    this.folders = ['all', 'Personal', 'Work', 'Ideas', 'Archive'];
    this.tagColors = ['#ff003c', '#00ccff', '#00ff88', '#ffaa00', '#cc99ff', '#ff6699', '#ff2d6b', '#44ddaa'];

    this._loadNotes();
  }

  render() {
    const style = document.createElement('style');
    style.textContent = this._getStyles();
    this.container.appendChild(style);
    this._styleEl = style;

    this.element = document.createElement('div');
    this.element.className = 'nexus-notepad';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._bindEvents();
    this._renderNoteList();

    if (this.notes.length > 0) {
      this._selectNote(this.notes[0].id);
    }

    this.autoSaveTimer = setInterval(() => this._saveNotes(), 15000);
  }

  destroy() {
    this._saveCurrentNote();
    this._saveNotes();
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    if (this._styleEl) this._styleEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <div class="np-sidebar">
        <div class="np-sidebar-header">
          <span class="np-title">Notes</span>
          <button class="np-new-btn glass-btn" id="np-new-btn" title="New Note">+</button>
        </div>

        <div class="np-search-box">
          <input type="text" class="np-search glass-input" id="np-search" placeholder="Search notes...">
        </div>

        <!-- Folders -->
        <div class="np-folders">
          <div class="np-section-label">Folders</div>
          <div class="np-folder-list" id="np-folder-list"></div>
        </div>

        <!-- Tags -->
        <div class="np-tags-section">
          <div class="np-section-label">Tags</div>
          <div class="np-tag-list" id="np-tag-list"></div>
        </div>

        <!-- Note List -->
        <div class="np-note-list" id="np-note-list"></div>
      </div>

      <div class="np-main">
        <!-- Toolbar -->
        <div class="np-toolbar" id="np-toolbar">
          <div class="np-tb-group">
            <button class="np-tb-btn" data-cmd="bold" title="Bold (Ctrl+B)"><b>B</b></button>
            <button class="np-tb-btn" data-cmd="italic" title="Italic (Ctrl+I)"><i>I</i></button>
            <button class="np-tb-btn" data-cmd="underline" title="Underline (Ctrl+U)"><u>U</u></button>
            <button class="np-tb-btn" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
          </div>
          <div class="np-tb-divider"></div>
          <div class="np-tb-group">
            <button class="np-tb-btn" data-cmd="formatBlock" data-val="H1" title="Heading 1">H1</button>
            <button class="np-tb-btn" data-cmd="formatBlock" data-val="H2" title="Heading 2">H2</button>
            <button class="np-tb-btn" data-cmd="formatBlock" data-val="H3" title="Heading 3">H3</button>
          </div>
          <div class="np-tb-divider"></div>
          <div class="np-tb-group">
            <button class="np-tb-btn" data-cmd="insertUnorderedList" title="Bullet List">• List</button>
            <button class="np-tb-btn" data-cmd="insertOrderedList" title="Numbered List">1. List</button>
            <button class="np-tb-btn" data-cmd="formatBlock" data-val="BLOCKQUOTE" title="Quote">❝</button>
            <button class="np-tb-btn" data-cmd="code" title="Code Block">&lt;/&gt;</button>
          </div>
          <div class="np-tb-divider"></div>
          <div class="np-tb-group">
            <button class="np-tb-btn" data-cmd="justifyLeft" title="Align Left">⫷</button>
            <button class="np-tb-btn" data-cmd="justifyCenter" title="Align Center">≡</button>
            <button class="np-tb-btn" data-cmd="justifyRight" title="Align Right">⫸</button>
          </div>
          <div class="np-tb-divider"></div>
          <div class="np-tb-group">
            <select class="np-color-select" id="np-text-color" title="Text Color">
              <option value="">Color</option>
              <option value="#ff003c" style="color:#ff003c">● Red</option>
              <option value="#00ccff" style="color:#00ccff">● Cyan</option>
              <option value="#00ff88" style="color:#00ff88">● Green</option>
              <option value="#ffaa00" style="color:#ffaa00">● Amber</option>
              <option value="#cc99ff" style="color:#cc99ff">● Purple</option>
              <option value="#ff6699" style="color:#ff6699">● Pink</option>
              <option value="#ffffff" style="color:#fff">● White</option>
            </select>
            <select class="np-color-select" id="np-highlight-color" title="Highlight">
              <option value="">Highlight</option>
              <option value="rgba(255,0,60,0.3)" style="background:rgba(255,0,60,0.3)">● Red</option>
              <option value="rgba(0,204,255,0.3)" style="background:rgba(0,204,255,0.3)">● Cyan</option>
              <option value="rgba(0,255,136,0.3)" style="background:rgba(0,255,136,0.3)">● Green</option>
              <option value="rgba(255,170,0,0.3)" style="background:rgba(255,170,0,0.3)">● Yellow</option>
              <option value="rgba(204,153,255,0.3)" style="background:rgba(204,153,255,0.3)">● Purple</option>
            </select>
          </div>
          <div class="np-tb-spacer"></div>
          <div class="np-tb-group">
            <button class="np-tb-btn np-md-toggle" id="np-md-toggle" title="Markdown Mode">MD</button>
            <button class="np-tb-btn" data-action="export-md" title="Export as Markdown">⬇.md</button>
            <button class="np-tb-btn" data-action="export-html" title="Export as HTML">⬇.html</button>
            <button class="np-tb-btn" data-action="export-txt" title="Export as Text">⬇.txt</button>
            <button class="np-tb-btn" data-action="import" title="Import File">📂</button>
          </div>
        </div>

        <!-- Note Title -->
        <div class="np-title-bar">
          <input type="text" class="np-note-title glass-input" id="np-note-title" placeholder="Note title..." disabled>
          <div class="np-note-meta" id="np-note-meta"></div>
        </div>

        <!-- Tag Input -->
        <div class="np-tag-bar" id="np-tag-bar">
          <div class="np-note-tags" id="np-note-tags"></div>
          <input type="text" class="np-tag-input glass-input" id="np-tag-input" placeholder="+ Add tag" disabled>
          <select class="np-folder-select" id="np-folder-select" disabled>
            ${this.folders.filter(f => f !== 'all').map(f => `<option value="${f}">${f}</option>`).join('')}
          </select>
          <button class="np-pin-btn" id="np-pin-btn" title="Pin note" disabled>📌</button>
        </div>

        <!-- Editor -->
        <div class="np-editor-container">
          <div class="np-editor" id="np-editor" contenteditable="false"></div>
          <div class="np-md-preview" id="np-md-preview" style="display:none;"></div>
          <textarea class="np-md-editor" id="np-md-editor" style="display:none;" placeholder="Write markdown here..."></textarea>
        </div>

        <!-- Status Bar -->
        <div class="np-status-bar">
          <span id="np-word-count">0 words</span>
          <span id="np-char-count">0 characters</span>
          <span class="np-status-spacer"></span>
          <span id="np-save-status">Ready</span>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    // New note
    this.element.querySelector('#np-new-btn').addEventListener('click', () => this._createNote());

    // Search
    this.element.querySelector('#np-search').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this._renderNoteList();
    });

    // Toolbar formatting
    this.element.querySelector('#np-toolbar').addEventListener('click', (e) => {
      const btn = e.target.closest('.np-tb-btn');
      if (!btn) return;

      const cmd = btn.dataset.cmd;
      const val = btn.dataset.val;
      const action = btn.dataset.action;

      if (action) {
        this._handleAction(action);
        return;
      }

      if (cmd && !this.markdownMode) {
        if (cmd === 'code') {
          document.execCommand('insertHTML', false, '<pre class="np-code-block"><code>' + (window.getSelection().toString() || '') + '</code></pre>');
        } else if (val) {
          document.execCommand(cmd, false, val);
        } else {
          document.execCommand(cmd, false, null);
        }
        this._saveCurrentNote();
      }
    });

    // Text color
    this.element.querySelector('#np-text-color').addEventListener('change', (e) => {
      if (e.target.value) {
        document.execCommand('foreColor', false, e.target.value);
        e.target.value = '';
      }
    });

    // Highlight color
    this.element.querySelector('#np-highlight-color').addEventListener('change', (e) => {
      if (e.target.value) {
        document.execCommand('hiliteColor', false, e.target.value);
        e.target.value = '';
      }
    });

    // Markdown toggle
    this.element.querySelector('#np-md-toggle').addEventListener('click', () => this._toggleMarkdown());

    // Editor input
    this.element.querySelector('#np-editor').addEventListener('input', () => {
      this._updateCounts();
      this._saveCurrentNote();
    });

    this.element.querySelector('#np-md-editor').addEventListener('input', () => {
      this._updateMdPreview();
      this._updateCounts();
      this._saveCurrentNote();
    });

    // Title input
    this.element.querySelector('#np-note-title').addEventListener('input', (e) => {
      const note = this._getActiveNote();
      if (note) {
        note.title = e.target.value;
        note.modified = Date.now();
        this._renderNoteList();
      }
    });

    // Tag input
    this.element.querySelector('#np-tag-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        e.preventDefault();
        this._addTag(e.target.value.trim());
        e.target.value = '';
      }
    });

    // Folder select
    this.element.querySelector('#np-folder-select').addEventListener('change', (e) => {
      const note = this._getActiveNote();
      if (note) {
        note.folder = e.target.value;
        this._renderNoteList();
        this._renderFolders();
      }
    });

    // Pin
    this.element.querySelector('#np-pin-btn').addEventListener('click', () => {
      const note = this._getActiveNote();
      if (note) {
        note.pinned = !note.pinned;
        this._renderNoteList();
        this._updatePinButton();
      }
    });
  }

  // ─── Note CRUD ──────────────────────────────────────────────────
  _createNote() {
    const note = {
      id: ++this.noteIdCounter,
      title: 'Untitled Note',
      content: '',
      tags: [],
      folder: 'Personal',
      pinned: false,
      created: Date.now(),
      modified: Date.now()
    };
    this.notes.unshift(note);
    this._selectNote(note.id);
    this._renderNoteList();
    this._saveNotes();

    // Focus title
    setTimeout(() => {
      const titleEl = this.element.querySelector('#np-note-title');
      titleEl.focus();
      titleEl.select();
    }, 50);
  }

  _selectNote(id) {
    this._saveCurrentNote();
    this.activeNoteId = id;
    const note = this._getActiveNote();
    if (!note) return;

    const titleEl = this.element.querySelector('#np-note-title');
    const editorEl = this.element.querySelector('#np-editor');
    const mdEditorEl = this.element.querySelector('#np-md-editor');
    const tagInput = this.element.querySelector('#np-tag-input');
    const folderSelect = this.element.querySelector('#np-folder-select');
    const pinBtn = this.element.querySelector('#np-pin-btn');

    titleEl.value = note.title;
    titleEl.disabled = false;
    tagInput.disabled = false;
    folderSelect.disabled = false;
    pinBtn.disabled = false;
    folderSelect.value = note.folder || 'Personal';

    if (this.markdownMode) {
      mdEditorEl.value = note.content;
      this._updateMdPreview();
    } else {
      editorEl.innerHTML = note.content;
      editorEl.contentEditable = 'true';
    }

    this._renderNoteTags();
    this._updateCounts();
    this._updatePinButton();
    this._renderNoteList();
    this.element.querySelector('#np-save-status').textContent = `Saved ${this._timeAgo(note.modified)}`;
  }

  _deleteNote(id) {
    this.notes = this.notes.filter(n => n.id !== id);
    if (this.activeNoteId === id) {
      this.activeNoteId = null;
      this.element.querySelector('#np-editor').innerHTML = '';
      this.element.querySelector('#np-editor').contentEditable = 'false';
      this.element.querySelector('#np-note-title').value = '';
      this.element.querySelector('#np-note-title').disabled = true;
      if (this.notes.length > 0) this._selectNote(this.notes[0].id);
    }
    this._renderNoteList();
    this._saveNotes();
  }

  _getActiveNote() {
    return this.notes.find(n => n.id === this.activeNoteId) || null;
  }

  _saveCurrentNote() {
    const note = this._getActiveNote();
    if (!note) return;

    const editorEl = this.element.querySelector('#np-editor');
    const mdEditorEl = this.element.querySelector('#np-md-editor');

    if (this.markdownMode) {
      note.content = mdEditorEl.value;
    } else {
      note.content = editorEl.innerHTML;
    }
    note.modified = Date.now();
  }

  // ─── Render Note List ──────────────────────────────────────────
  _renderNoteList() {
    const listEl = this.element.querySelector('#np-note-list');
    let filtered = [...this.notes];

    // Filter by folder
    if (this.activeFolder !== 'all') {
      filtered = filtered.filter(n => n.folder === this.activeFolder);
    }

    // Filter by tag
    if (this.activeTag) {
      filtered = filtered.filter(n => n.tags && n.tags.includes(this.activeTag));
    }

    // Filter by search
    if (this.searchQuery) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(this.searchQuery) ||
        this._stripHtml(n.content).toLowerCase().includes(this.searchQuery)
      );
    }

    // Sort: pinned first, then by modified date
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.modified - a.modified;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="np-empty-list">No notes found</div>';
      return;
    }

    listEl.innerHTML = filtered.map(note => {
      const active = note.id === this.activeNoteId ? 'np-note-active' : '';
      const pinned = note.pinned ? 'np-note-pinned' : '';
      const preview = this._stripHtml(note.content).substring(0, 60);
      const date = new Date(note.modified).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `
        <div class="np-note-item ${active} ${pinned}" data-note-id="${note.id}">
          <div class="np-note-item-header">
            <span class="np-note-item-title">${note.pinned ? '📌 ' : ''}${this._escapeHtml(note.title)}</span>
            <button class="np-note-del" data-del-id="${note.id}" title="Delete">✕</button>
          </div>
          <div class="np-note-item-preview">${this._escapeHtml(preview)}</div>
          <div class="np-note-item-footer">
            <span class="np-note-item-date">${date}</span>
            ${note.tags ? note.tags.map(t => `<span class="np-note-item-tag">${this._escapeHtml(t)}</span>`).join('') : ''}
          </div>
        </div>
      `;
    }).join('');

    // Click handlers
    listEl.querySelectorAll('.np-note-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('np-note-del')) return;
        this._selectNote(parseInt(item.dataset.noteId));
      });
    });
    listEl.querySelectorAll('.np-note-del').forEach(btn => {
      btn.addEventListener('click', () => this._deleteNote(parseInt(btn.dataset.delId)));
    });

    this._renderFolders();
    this._renderTags();
  }

  _renderFolders() {
    const list = this.element.querySelector('#np-folder-list');
    const icons = { all: '📁', Personal: '👤', Work: '💼', Ideas: '💡', Archive: '📦' };
    list.innerHTML = this.folders.map(f => {
      const active = f === this.activeFolder ? 'np-folder-active' : '';
      const count = f === 'all' ? this.notes.length : this.notes.filter(n => n.folder === f).length;
      return `<div class="np-folder ${active}" data-folder="${f}">
        <span>${icons[f] || '📁'} ${f === 'all' ? 'All Notes' : f}</span>
        <span class="np-folder-count">${count}</span>
      </div>`;
    }).join('');

    list.querySelectorAll('.np-folder').forEach(el => {
      el.addEventListener('click', () => {
        this.activeFolder = el.dataset.folder;
        this.activeTag = null;
        this._renderNoteList();
      });
    });
  }

  _renderTags() {
    const allTags = new Set();
    this.notes.forEach(n => (n.tags || []).forEach(t => allTags.add(t)));
    const list = this.element.querySelector('#np-tag-list');
    list.innerHTML = [...allTags].map((tag, i) => {
      const active = tag === this.activeTag ? 'np-tag-active' : '';
      const color = this.tagColors[i % this.tagColors.length];
      return `<span class="np-tag ${active}" data-tag="${this._escapeHtml(tag)}" style="border-color:${color};color:${color}">${this._escapeHtml(tag)}</span>`;
    }).join('');

    list.querySelectorAll('.np-tag').forEach(el => {
      el.addEventListener('click', () => {
        this.activeTag = this.activeTag === el.dataset.tag ? null : el.dataset.tag;
        this._renderNoteList();
      });
    });
  }

  _renderNoteTags() {
    const note = this._getActiveNote();
    const container = this.element.querySelector('#np-note-tags');
    if (!note || !note.tags) { container.innerHTML = ''; return; }

    container.innerHTML = note.tags.map((tag, i) => {
      const color = this.tagColors[this._hash(tag) % this.tagColors.length];
      return `<span class="np-note-tag" style="background:${color}22;color:${color};border:1px solid ${color}44">
        ${this._escapeHtml(tag)}
        <span class="np-note-tag-rm" data-tag="${this._escapeHtml(tag)}">✕</span>
      </span>`;
    }).join('');

    container.querySelectorAll('.np-note-tag-rm').forEach(btn => {
      btn.addEventListener('click', () => this._removeTag(btn.dataset.tag));
    });
  }

  _addTag(tag) {
    const note = this._getActiveNote();
    if (!note) return;
    if (!note.tags) note.tags = [];
    if (!note.tags.includes(tag)) {
      note.tags.push(tag);
      note.modified = Date.now();
      this._renderNoteTags();
      this._renderNoteList();
      this._saveNotes();
    }
  }

  _removeTag(tag) {
    const note = this._getActiveNote();
    if (!note || !note.tags) return;
    note.tags = note.tags.filter(t => t !== tag);
    note.modified = Date.now();
    this._renderNoteTags();
    this._renderNoteList();
    this._saveNotes();
  }

  _updatePinButton() {
    const note = this._getActiveNote();
    const btn = this.element.querySelector('#np-pin-btn');
    if (note && btn) btn.textContent = note.pinned ? '📌' : '📍';
  }

  // ─── Markdown ───────────────────────────────────────────────────
  _toggleMarkdown() {
    this.markdownMode = !this.markdownMode;
    const editor = this.element.querySelector('#np-editor');
    const mdEditor = this.element.querySelector('#np-md-editor');
    const mdPreview = this.element.querySelector('#np-md-preview');
    const toggle = this.element.querySelector('#np-md-toggle');

    toggle.classList.toggle('np-md-active', this.markdownMode);

    if (this.markdownMode) {
      const note = this._getActiveNote();
      if (note) mdEditor.value = this._htmlToMarkdown(note.content);
      editor.style.display = 'none';
      mdEditor.style.display = 'block';
      mdPreview.style.display = 'block';
      mdEditor.disabled = !this.activeNoteId;
      this._updateMdPreview();
    } else {
      const note = this._getActiveNote();
      if (note) {
        editor.innerHTML = this._markdownToHtml(mdEditor.value);
        note.content = editor.innerHTML;
      }
      editor.style.display = 'block';
      editor.contentEditable = this.activeNoteId ? 'true' : 'false';
      mdEditor.style.display = 'none';
      mdPreview.style.display = 'none';
    }
  }

  _updateMdPreview() {
    const mdEditor = this.element.querySelector('#np-md-editor');
    const preview = this.element.querySelector('#np-md-preview');
    preview.innerHTML = this._markdownToHtml(mdEditor.value);
  }

  _markdownToHtml(md) {
    return md
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(.+)$/gm, (match) => {
        if (match.startsWith('<')) return match;
        return match;
      });
  }

  _htmlToMarkdown(html) {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<del>(.*?)<\/del>/gi, '~~$1~~')
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }

  // ─── Actions ────────────────────────────────────────────────────
  _handleAction(action) {
    const note = this._getActiveNote();
    if (!note) return;

    switch (action) {
      case 'export-md':
        this._exportFile(note.title + '.md', this._htmlToMarkdown(note.content), 'text/markdown');
        break;
      case 'export-html':
        this._exportFile(note.title + '.html', `<!DOCTYPE html><html><head><title>${this._escapeHtml(note.title)}</title></head><body>${note.content}</body></html>`, 'text/html');
        break;
      case 'export-txt':
        this._exportFile(note.title + '.txt', this._stripHtml(note.content), 'text/plain');
        break;
      case 'import':
        this._importFile();
        break;
    }
  }

  _exportFile(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  _importFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.html';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        this._createNote();
        const note = this._getActiveNote();
        if (note) {
          note.title = file.name.replace(/\.[^.]+$/, '');
          note.content = e.target.result;
          this._selectNote(note.id);
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  // ─── Counts & Status ────────────────────────────────────────────
  _updateCounts() {
    const note = this._getActiveNote();
    if (!note) return;
    const text = this.markdownMode ?
      this.element.querySelector('#np-md-editor').value :
      this._stripHtml(note.content || '');
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    this.element.querySelector('#np-word-count').textContent = `${words} words`;
    this.element.querySelector('#np-char-count').textContent = `${chars} characters`;
  }

  // ─── Persistence ────────────────────────────────────────────────
  _saveNotes() {
    try {
      const data = {
        notes: this.notes,
        noteIdCounter: this.noteIdCounter
      };
      localStorage.setItem('nexus:notepad:notes', JSON.stringify(data));
      this.element.querySelector('#np-save-status').textContent = 'Saved just now';
    } catch (e) { /* ignore */ }
  }

  _loadNotes() {
    try {
      const raw = localStorage.getItem('nexus:notepad:notes');
      if (raw) {
        const data = JSON.parse(raw);
        this.notes = data.notes || [];
        this.noteIdCounter = data.noteIdCounter || 0;
      }
    } catch (e) { this.notes = []; }

    // Create welcome note if empty
    if (this.notes.length === 0) {
      this.notes.push({
        id: ++this.noteIdCounter,
        title: 'Welcome to NEXUS Notepad',
        content: '<h2>Welcome to NEXUS Notepad</h2><p>This is your personal note-taking space.</p><p>Features:</p><ul><li><strong>Rich text formatting</strong> — Bold, Italic, Headings, Lists</li><li><strong>Markdown mode</strong> — Toggle MD button in toolbar</li><li><strong>Tags</strong> — Organize notes with colored tags</li><li><strong>Folders</strong> — Categorize your notes</li><li><strong>Pin notes</strong> — Keep important notes at the top</li><li><strong>Export</strong> — Download as .md, .html, or .txt</li><li><strong>Search</strong> — Find notes by title or content</li></ul><p>Start creating notes with the <strong>+</strong> button!</p>',
        tags: ['welcome', 'guide'],
        folder: 'Personal',
        pinned: true,
        created: Date.now(),
        modified: Date.now()
      });
      this._saveNotes();
    }
  }

  // ─── Utilities ──────────────────────────────────────────────────
  _stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  _escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  _timeAgo(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
    return Math.abs(h);
  }

  // ─── Styles ─────────────────────────────────────────────────────
  _getStyles() {
    return `
      .nexus-notepad {
        width: 100%; height: 100%;
        background: rgba(10, 5, 20, 0.96);
        border: 1px solid rgba(255, 0, 60, 0.2);
        border-radius: 8px;
        display: flex; overflow: hidden;
        box-shadow: 0 0 30px rgba(255, 0, 60, 0.1);
        font-family: 'Segoe UI', sans-serif;
      }

      /* Sidebar */
      .np-sidebar {
        width: 220px; flex-shrink: 0;
        background: rgba(12, 6, 22, 0.9);
        border-right: 1px solid rgba(255, 0, 60, 0.12);
        display: flex; flex-direction: column;
      }
      .np-sidebar-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(255, 0, 60, 0.1);
      }
      .np-title { font-size: 14px; color: #ddd; font-weight: 600; }
      .np-new-btn { width: 28px; height: 28px; padding: 0; font-size: 18px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }

      .np-search-box { padding: 6px 8px; }
      .np-search {
        width: 100%; padding: 5px 8px; font-size: 11px;
        background: rgba(20, 10, 35, 0.8); border: 1px solid rgba(255, 0, 60, 0.12);
        color: #ddd; border-radius: 4px; outline: none; box-sizing: border-box;
      }
      .np-search:focus { border-color: rgba(255, 0, 60, 0.3); }

      .np-section-label { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 1px; padding: 6px 12px 4px; }

      .np-folders { border-bottom: 1px solid rgba(255, 0, 60, 0.06); }
      .np-folder-list { padding: 0 4px 6px; }
      .np-folder {
        display: flex; justify-content: space-between; align-items: center;
        padding: 4px 10px; font-size: 11px; color: #999; cursor: pointer;
        border-radius: 4px; transition: background 0.1s;
      }
      .np-folder:hover { background: rgba(255, 0, 60, 0.06); }
      .np-folder-active { background: rgba(255, 0, 60, 0.12); color: #ff003c; }
      .np-folder-count { font-size: 9px; color: #555; }

      .np-tags-section { border-bottom: 1px solid rgba(255, 0, 60, 0.06); padding-bottom: 4px; }
      .np-tag-list { display: flex; flex-wrap: wrap; gap: 3px; padding: 0 8px 6px; }
      .np-tag {
        font-size: 9px; padding: 2px 6px; border-radius: 3px;
        border: 1px solid; cursor: pointer; transition: all 0.1s;
      }
      .np-tag:hover { opacity: 0.8; }
      .np-tag-active { opacity: 1 !important; font-weight: bold; }

      .np-note-list { flex: 1; overflow-y: auto; padding: 4px; }
      .np-note-list::-webkit-scrollbar { width: 3px; }
      .np-note-list::-webkit-scrollbar-thumb { background: rgba(255,0,60,0.3); border-radius: 2px; }

      .np-note-item {
        padding: 8px; margin-bottom: 3px;
        background: rgba(255, 0, 60, 0.03); border: 1px solid transparent;
        border-radius: 6px; cursor: pointer; transition: all 0.1s;
      }
      .np-note-item:hover { background: rgba(255, 0, 60, 0.08); }
      .np-note-active { background: rgba(255, 0, 60, 0.12) !important; border-color: rgba(255, 0, 60, 0.2); }
      .np-note-item-header { display: flex; justify-content: space-between; }
      .np-note-item-title { font-size: 11px; color: #ddd; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
      .np-note-del { background: none; border: none; color: #555; font-size: 10px; cursor: pointer; opacity: 0; transition: opacity 0.15s; }
      .np-note-item:hover .np-note-del { opacity: 1; }
      .np-note-del:hover { color: #ff003c; }
      .np-note-item-preview { font-size: 10px; color: #666; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .np-note-item-footer { display: flex; gap: 4px; margin-top: 4px; align-items: center; }
      .np-note-item-date { font-size: 9px; color: #555; }
      .np-note-item-tag { font-size: 8px; padding: 1px 4px; background: rgba(255,0,60,0.1); border-radius: 2px; color: #999; }
      .np-empty-list { text-align: center; color: #555; font-size: 11px; padding: 20px; }

      /* Main Area */
      .np-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

      /* Toolbar */
      .np-toolbar {
        display: flex; align-items: center; gap: 4px;
        padding: 4px 8px;
        background: rgba(15, 8, 25, 0.8);
        border-bottom: 1px solid rgba(255, 0, 60, 0.08);
        flex-shrink: 0; flex-wrap: wrap;
      }
      .np-tb-group { display: flex; gap: 2px; align-items: center; }
      .np-tb-divider { width: 1px; height: 18px; background: rgba(255, 0, 60, 0.12); margin: 0 3px; }
      .np-tb-spacer { flex: 1; }
      .np-tb-btn {
        background: rgba(255, 0, 60, 0.06); border: 1px solid rgba(255, 0, 60, 0.1);
        color: #aaa; padding: 3px 6px; border-radius: 3px; font-size: 11px;
        cursor: pointer; font-family: inherit; transition: all 0.1s;
        min-width: 24px; text-align: center;
      }
      .np-tb-btn:hover { background: rgba(255, 0, 60, 0.15); color: #fff; }
      .np-md-toggle { font-weight: bold; }
      .np-md-active { background: rgba(255, 0, 60, 0.25) !important; color: #ff003c !important; border-color: #ff003c !important; }

      .np-color-select {
        background: rgba(20, 10, 35, 0.8); border: 1px solid rgba(255, 0, 60, 0.12);
        color: #aaa; padding: 3px; border-radius: 3px; font-size: 10px; cursor: pointer;
      }

      /* Title Bar */
      .np-title-bar {
        display: flex; align-items: center; gap: 8px;
        padding: 6px 12px;
        border-bottom: 1px solid rgba(255, 0, 60, 0.06);
        flex-shrink: 0;
      }
      .np-note-title {
        flex: 1; padding: 4px 8px; font-size: 14px; font-weight: 600;
        background: transparent; border: 1px solid transparent;
        color: #eee; outline: none; border-radius: 4px;
      }
      .np-note-title:focus { border-color: rgba(255, 0, 60, 0.2); }
      .np-note-title:disabled { color: #555; }
      .np-note-meta { font-size: 9px; color: #555; }

      /* Tag Bar */
      .np-tag-bar {
        display: flex; align-items: center; gap: 6px;
        padding: 4px 12px;
        border-bottom: 1px solid rgba(255, 0, 60, 0.04);
        flex-shrink: 0;
      }
      .np-note-tags { display: flex; gap: 4px; flex-wrap: wrap; }
      .np-note-tag {
        font-size: 9px; padding: 2px 6px; border-radius: 3px;
        display: flex; align-items: center; gap: 3px;
      }
      .np-note-tag-rm { cursor: pointer; opacity: 0.5; }
      .np-note-tag-rm:hover { opacity: 1; }
      .np-tag-input {
        width: 80px; padding: 2px 6px; font-size: 10px;
        background: transparent; border: 1px solid rgba(255, 0, 60, 0.1);
        color: #aaa; border-radius: 3px; outline: none;
      }
      .np-folder-select {
        padding: 2px 4px; font-size: 10px;
        background: rgba(20, 10, 35, 0.8); border: 1px solid rgba(255, 0, 60, 0.1);
        color: #aaa; border-radius: 3px; cursor: pointer;
      }
      .np-pin-btn {
        background: none; border: none; cursor: pointer; font-size: 14px;
        opacity: 0.5; transition: opacity 0.15s;
      }
      .np-pin-btn:hover { opacity: 1; }
      .np-pin-btn:disabled { cursor: default; }

      /* Editor */
      .np-editor-container { flex: 1; overflow: hidden; position: relative; }
      .np-editor {
        width: 100%; height: 100%; padding: 16px;
        overflow-y: auto; color: #ddd; font-size: 14px;
        line-height: 1.6; outline: none;
      }
      .np-editor::-webkit-scrollbar { width: 4px; }
      .np-editor::-webkit-scrollbar-thumb { background: rgba(255,0,60,0.3); border-radius: 2px; }
      .np-editor h1 { color: #ff003c; border-bottom: 1px solid rgba(255,0,60,0.15); padding-bottom: 6px; }
      .np-editor h2 { color: #ff2d6b; }
      .np-editor h3 { color: #ff4488; }
      .np-editor a { color: #00ccff; }
      .np-editor blockquote { border-left: 3px solid #ff003c; padding-left: 12px; color: #aaa; font-style: italic; }
      .np-editor code { background: rgba(255,0,60,0.1); padding: 1px 4px; border-radius: 3px; font-family: monospace; color: #00ff88; }
      .np-code-block { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; border: 1px solid rgba(255,0,60,0.1); }
      .np-editor ul, .np-editor ol { padding-left: 24px; }
      .np-editor li { margin: 2px 0; }

      .np-md-editor {
        width: 100%; height: 50%; padding: 16px;
        background: transparent; border: none; outline: none;
        color: #ddd; font-family: monospace; font-size: 13px;
        resize: none; overflow-y: auto;
      }
      .np-md-preview {
        width: 100%; height: 50%; padding: 16px;
        overflow-y: auto; color: #ddd; font-size: 14px; line-height: 1.6;
        border-top: 1px solid rgba(255, 0, 60, 0.1);
      }
      .np-md-preview h1 { color: #ff003c; }
      .np-md-preview h2 { color: #ff2d6b; }
      .np-md-preview h3 { color: #ff4488; }
      .np-md-preview code { background: rgba(255,0,60,0.1); padding: 1px 4px; border-radius: 3px; color: #00ff88; font-family: monospace; }
      .np-md-preview blockquote { border-left: 3px solid #ff003c; padding-left: 12px; color: #aaa; }

      /* Status Bar */
      .np-status-bar {
        display: flex; gap: 16px; padding: 3px 12px;
        font-size: 10px; color: #666;
        background: rgba(15, 8, 25, 0.6);
        border-top: 1px solid rgba(255, 0, 60, 0.06);
        flex-shrink: 0;
      }
      .np-status-spacer { flex: 1; }
    `;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.NexusNotepad = NexusNotepad;
}
