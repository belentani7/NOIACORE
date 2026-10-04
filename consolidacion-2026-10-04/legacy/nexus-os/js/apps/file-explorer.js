'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — File Explorer
 *  Full file management with virtual filesystem integration
 * ═══════════════════════════════════════════════════════════════
 */
class NexusFileExplorer {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.cwd = '/home/operator';
    this.viewMode = 'grid'; // grid | list
    this.sortBy = 'name'; // name | date | size | type
    this.sortAsc = true;
    this.selectedFiles = new Set();
    this.clipboard = [];
    this.clipboardOp = null; // copy | cut
    this.searchQuery = '';
    this.history = [];
    this.historyIndex = -1;
    this.trash = [];

    // Get filesystem reference
    this.fs = null;
    this._initFS();
  }

  _initFS() {
    // Try to use global NexusFilesystem, fallback to internal
    try {
      if (typeof NexusFilesystem !== 'undefined') {
        this.fs = NexusFilesystem;
        return;
      }
    } catch (e) {}

    // Fallback: internal filesystem (matches terminal's structure)
    this.fs = {
      type: 'dir',
      children: {
        'home': { type: 'dir', children: {
          'operator': { type: 'dir', children: {
            'documents': { type: 'dir', children: {
              'readme.txt': { type: 'file', content: 'Welcome to NEXUS OS\n\nYour personal document space.', size: 62, modified: Date.now() - 86400000 },
              'notes.md': { type: 'file', content: '# NEXUS Notes\nQuick reference and tips.', size: 45, modified: Date.now() - 3600000 },
              'report.txt': { type: 'file', content: 'Monthly Report\n=============\nAll systems operational.', size: 55, modified: Date.now() - 7200000 },
            }},
            'downloads': { type: 'dir', children: {
              'archive.zip': { type: 'file', content: '', size: 2048000, modified: Date.now() - 172800000 },
              'photo.png': { type: 'file', content: '', size: 512000, modified: Date.now() - 43200000 },
            }},
            'desktop': { type: 'dir', children: {
              'welcome.txt': { type: 'file', content: 'Welcome to NEXUS OS, Operator.', size: 32, modified: Date.now() },
            }},
            'music': { type: 'dir', children: {
              'track01.mp3': { type: 'file', content: '', size: 5242880, modified: Date.now() - 604800000 },
              'ambient.wav': { type: 'file', content: '', size: 20971520, modified: Date.now() - 259200000 },
            }},
            'pictures': { type: 'dir', children: {
              'screenshot.png': { type: 'file', content: '', size: 1024000, modified: Date.now() - 86400000 },
              'wallpaper.jpg': { type: 'file', content: '', size: 3072000, modified: Date.now() - 432000000 },
            }},
            '.bashrc': { type: 'file', content: '# NEXUS Shell Config\nalias ll="ls -la"', size: 42, modified: Date.now() - 2592000000 },
          }}
        }},
        'etc': { type: 'dir', children: {
          'nexus.conf': { type: 'file', content: '[system]\nname=NEXUS OS\nversion=4.2.1', size: 38, modified: Date.now() - 2592000000 },
          'hostname': { type: 'file', content: 'nexus-os', size: 9, modified: Date.now() - 2592000000 },
        }},
        'tmp': { type: 'dir', children: {} },
        'var': { type: 'dir', children: {
          'log': { type: 'dir', children: {
            'syslog': { type: 'file', content: '[2026-09-01] System boot initiated\n[2026-09-01] All systems nominal', size: 76, modified: Date.now() },
          }}
        }},
      }
    };
  }

  render() {
    const style = document.createElement('style');
    style.textContent = this._getStyles();
    this.container.appendChild(style);
    this._styleEl = style;

    this.element = document.createElement('div');
    this.element.className = 'nexus-file-explorer';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._bindEvents();
    this._navigate(this.cwd, true);
  }

  destroy() {
    if (this._styleEl) this._styleEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <!-- Toolbar -->
      <div class="fe-toolbar">
        <div class="fe-nav">
          <button class="fe-nav-btn" id="fe-back" title="Back (Alt+Left)">◀</button>
          <button class="fe-nav-btn" id="fe-forward" title="Forward (Alt+Right)">▶</button>
          <button class="fe-nav-btn" id="fe-up" title="Up">▲</button>
        </div>
        <div class="fe-address-bar">
          <input type="text" class="fe-address glass-input" id="fe-address" value="/home/operator">
          <button class="fe-go-btn glass-btn" id="fe-go">Go</button>
        </div>
        <div class="fe-toolbar-actions">
          <div class="fe-search-box">
            <input type="text" class="fe-search glass-input" id="fe-search" placeholder="Search...">
          </div>
          <button class="fe-view-btn" id="fe-view-toggle" title="Toggle View">▦</button>
          <select class="fe-sort-select" id="fe-sort">
            <option value="name">Name</option>
            <option value="date">Date</option>
            <option value="size">Size</option>
            <option value="type">Type</option>
          </select>
        </div>
      </div>

      <div class="fe-body">
        <!-- Sidebar -->
        <div class="fe-sidebar">
          <div class="fe-sidebar-section">
            <div class="fe-sidebar-label">Quick Access</div>
            <div class="fe-sidebar-item" data-path="/home/operator"><span>🏠</span> Home</div>
            <div class="fe-sidebar-item" data-path="/home/operator/desktop"><span>🖥</span> Desktop</div>
            <div class="fe-sidebar-item" data-path="/home/operator/documents"><span>📄</span> Documents</div>
            <div class="fe-sidebar-item" data-path="/home/operator/downloads"><span>📥</span> Downloads</div>
            <div class="fe-sidebar-item" data-path="/home/operator/music"><span>🎵</span> Music</div>
            <div class="fe-sidebar-item" data-path="/home/operator/pictures"><span>🖼</span> Pictures</div>
          </div>
          <div class="fe-sidebar-section">
            <div class="fe-sidebar-label">System</div>
            <div class="fe-sidebar-item" data-path="/"><span>💾</span> Root (/)</div>
            <div class="fe-sidebar-item" data-path="/etc"><span>⚙</span> System (/etc)</div>
            <div class="fe-sidebar-item" data-path="/tmp"><span>🗂</span> Temp (/tmp)</div>
            <div class="fe-sidebar-item fe-sidebar-trash" data-path="__trash__"><span>🗑</span> Trash</div>
          </div>

          <!-- Tree View -->
          <div class="fe-sidebar-section">
            <div class="fe-sidebar-label">Folders</div>
            <div class="fe-tree" id="fe-tree"></div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="fe-main">
          <!-- Breadcrumbs -->
          <div class="fe-breadcrumbs" id="fe-breadcrumbs"></div>

          <!-- File Grid/List -->
          <div class="fe-content" id="fe-content"></div>

          <!-- Context Menu -->
          <div class="fe-context-menu glass-panel" id="fe-context-menu" style="display:none;"></div>
        </div>

        <!-- Preview Panel -->
        <div class="fe-preview" id="fe-preview" style="display:none;">
          <div class="fe-preview-title" id="fe-preview-title"></div>
          <div class="fe-preview-content" id="fe-preview-content"></div>
          <div class="fe-preview-info" id="fe-preview-info"></div>
        </div>
      </div>

      <!-- Status Bar -->
      <div class="fe-status-bar">
        <span id="fe-status-items">0 items</span>
        <span id="fe-status-selected"></span>
        <span class="fe-status-spacer"></span>
        <span id="fe-status-path">/home/operator</span>
      </div>
    `;
  }

  _bindEvents() {
    // Navigation
    this.element.querySelector('#fe-back').addEventListener('click', () => this._historyBack());
    this.element.querySelector('#fe-forward').addEventListener('click', () => this._historyForward());
    this.element.querySelector('#fe-up').addEventListener('click', () => this._navigateUp());
    this.element.querySelector('#fe-go').addEventListener('click', () => {
      const path = this.element.querySelector('#fe-address').value.trim();
      this._navigate(path);
    });
    this.element.querySelector('#fe-address').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._navigate(e.target.value.trim());
    });

    // Search
    this.element.querySelector('#fe-search').addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this._renderContent();
    });

    // View toggle
    this.element.querySelector('#fe-view-toggle').addEventListener('click', () => {
      this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
      this.element.querySelector('#fe-view-toggle').textContent = this.viewMode === 'grid' ? '▦' : '☰';
      this._renderContent();
    });

    // Sort
    this.element.querySelector('#fe-sort').addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this._renderContent();
    });

    // Sidebar
    this.element.querySelector('.fe-sidebar').addEventListener('click', (e) => {
      const item = e.target.closest('.fe-sidebar-item');
      if (!item) return;
      const path = item.dataset.path;
      if (path === '__trash__') { this._showTrash(); return; }
      this._navigate(path);
    });

    // Keyboard
    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Delete') this._deleteSelected();
      if (e.key === 'F2') this._renameSelected();
      if (e.ctrlKey && e.key === 'c') this._copySelected();
      if (e.ctrlKey && e.key === 'x') this._cutSelected();
      if (e.ctrlKey && e.key === 'v') this._paste();
      if (e.ctrlKey && e.key === 'a') { e.preventDefault(); this._selectAll(); }
      if (e.altKey && e.key === 'ArrowLeft') this._historyBack();
      if (e.altKey && e.key === 'ArrowRight') this._historyForward();
    });
    this.element.tabIndex = 0;

    // Context menu close
    document.addEventListener('click', () => {
      const ctx = this.element.querySelector('#fe-context-menu');
      if (ctx) ctx.style.display = 'none';
    });
  }

  // ─── Navigation ─────────────────────────────────────────────────
  _navigate(path, noHistory) {
    const node = this._getNode(path);
    if (!node) { this._showError(`Path not found: ${path}`); return; }
    if (node.type !== 'dir') { this._openFile(path); return; }

    this.cwd = path;
    this.selectedFiles.clear();

    if (!noHistory) {
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(path);
      this.historyIndex = this.history.length - 1;
    }

    this.element.querySelector('#fe-address').value = path;
    this.element.querySelector('#fe-status-path').textContent = path;
    this._renderBreadcrumbs();
    this._renderContent();
    this._renderTree();
    this._updateSidebarActive();
  }

  _navigateUp() {
    if (this.cwd === '/') return;
    const parts = this.cwd.split('/').filter(Boolean);
    parts.pop();
    this._navigate('/' + parts.join('/'));
  }

  _historyBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this._navigate(this.history[this.historyIndex], true);
    }
  }

  _historyForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this._navigate(this.history[this.historyIndex], true);
    }
  }

  // ─── Filesystem Helpers ─────────────────────────────────────────
  _getNode(path) {
    const parts = (path || '/').split('/').filter(Boolean);
    let node = this.fs;
    for (const part of parts) {
      if (!node || node.type !== 'dir' || !node.children[part]) return null;
      node = node.children[part];
    }
    return node;
  }

  _getParentAndName(path) {
    const parts = path.split('/').filter(Boolean);
    const name = parts.pop();
    const parentPath = '/' + parts.join('/');
    const parent = this._getNode(parentPath || '/');
    return { parent, name, parentPath };
  }

  // ─── Render Content ─────────────────────────────────────────────
  _renderContent() {
    const node = this._getNode(this.cwd);
    if (!node || node.type !== 'dir') return;

    let entries = Object.entries(node.children);

    // Search filter
    if (this.searchQuery) {
      entries = entries.filter(([name]) => name.toLowerCase().includes(this.searchQuery));
    }

    // Sort
    entries.sort((a, b) => {
      // Directories first
      if (a[1].type !== b[1].type) return a[1].type === 'dir' ? -1 : 1;

      let cmp = 0;
      switch (this.sortBy) {
        case 'name': cmp = a[0].localeCompare(b[0]); break;
        case 'date': cmp = (b[1].modified || 0) - (a[1].modified || 0); break;
        case 'size': cmp = (a[1].size || 0) - (b[1].size || 0); break;
        case 'type':
          const extA = a[0].split('.').pop();
          const extB = b[0].split('.').pop();
          cmp = extA.localeCompare(extB);
          break;
      }
      return this.sortAsc ? cmp : -cmp;
    });

    this.element.querySelector('#fe-status-items').textContent = `${entries.length} items`;

    const content = this.element.querySelector('#fe-content');
    if (entries.length === 0) {
      content.innerHTML = '<div class="fe-empty">This folder is empty</div>';
      return;
    }

    if (this.viewMode === 'grid') {
      content.className = 'fe-content fe-grid';
      content.innerHTML = entries.map(([name, item]) => this._renderGridItem(name, item)).join('');
    } else {
      content.className = 'fe-content fe-list';
      content.innerHTML = `<div class="fe-list-header">
        <span class="fe-list-col-name">Name</span>
        <span class="fe-list-col-date">Modified</span>
        <span class="fe-list-col-size">Size</span>
        <span class="fe-list-col-type">Type</span>
      </div>` + entries.map(([name, item]) => this._renderListItem(name, item)).join('');
    }

    // Bind click events
    content.querySelectorAll('.fe-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const name = el.dataset.name;
        if (e.ctrlKey) {
          this._toggleSelect(name);
        } else if (e.shiftKey) {
          this._rangeSelect(name);
        } else {
          this.selectedFiles.clear();
          this.selectedFiles.add(name);
          this._renderContent();
        }
      });
      el.addEventListener('dblclick', () => {
        const name = el.dataset.name;
        const item = node.children[name];
        if (item.type === 'dir') this._navigate(this.cwd + '/' + name);
        else this._openFile(this.cwd + '/' + name);
      });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this._showContextMenu(e, el.dataset.name);
      });
    });
  }

  _renderGridItem(name, item) {
    const selected = this.selectedFiles.has(name) ? 'fe-selected' : '';
    const icon = this._getFileIcon(name, item.type);
    return `<div class="fe-item fe-grid-item ${selected}" data-name="${this._escapeHtml(name)}">
      <div class="fe-grid-icon">${icon}</div>
      <div class="fe-grid-name" title="${this._escapeHtml(name)}">${this._escapeHtml(name)}</div>
    </div>`;
  }

  _renderListItem(name, item) {
    const selected = this.selectedFiles.has(name) ? 'fe-selected' : '';
    const icon = this._getFileIcon(name, item.type);
    const size = item.type === 'dir' ? '--' : this._formatSize(item.size || 0);
    const date = item.modified ? new Date(item.modified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--';
    const type = item.type === 'dir' ? 'Folder' : this._getFileType(name);
    return `<div class="fe-item fe-list-item ${selected}" data-name="${this._escapeHtml(name)}">
      <span class="fe-list-col-name">${icon} ${this._escapeHtml(name)}</span>
      <span class="fe-list-col-date">${date}</span>
      <span class="fe-list-col-size">${size}</span>
      <span class="fe-list-col-type">${type}</span>
    </div>`;
  }

  // ─── Breadcrumbs ────────────────────────────────────────────────
  _renderBreadcrumbs() {
    const el = this.element.querySelector('#fe-breadcrumbs');
    const parts = this.cwd.split('/').filter(Boolean);
    let path = '';
    let html = `<span class="fe-breadcrumb" data-path="/">🏠 Root</span>`;
    parts.forEach((part, i) => {
      path += '/' + part;
      html += ` <span class="fe-breadcrumb-sep">›</span>
        <span class="fe-breadcrumb" data-path="${path}">${this._escapeHtml(part)}</span>`;
    });
    el.innerHTML = html;

    el.querySelectorAll('.fe-breadcrumb').forEach(bc => {
      bc.addEventListener('click', () => this._navigate(bc.dataset.path));
    });
  }

  // ─── Tree View ──────────────────────────────────────────────────
  _renderTree() {
    const treeEl = this.element.querySelector('#fe-tree');
    treeEl.innerHTML = this._renderTreeNode(this.fs, '', 0);

    treeEl.querySelectorAll('.fe-tree-folder').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this._navigate(el.dataset.path);
      });
    });
  }

  _renderTreeNode(node, path, depth) {
    if (node.type !== 'dir' || depth > 3) return '';
    const entries = Object.entries(node.children).filter(([, v]) => v.type === 'dir');
    if (entries.length === 0) return '';

    return entries.map(([name, child]) => {
      const fullPath = path + '/' + name;
      const isActive = fullPath === this.cwd ? 'fe-tree-active' : '';
      const hasChildren = child.type === 'dir' && Object.values(child.children).some(c => c.type === 'dir');
      return `<div class="fe-tree-folder ${isActive}" data-path="${fullPath}" style="padding-left:${depth * 12 + 8}px">
        <span class="fe-tree-icon">${hasChildren ? '▸' : '▹'}</span> 📁 ${this._escapeHtml(name)}
      </div>${hasChildren ? this._renderTreeNode(child, fullPath, depth + 1) : ''}`;
    }).join('');
  }

  _updateSidebarActive() {
    this.element.querySelectorAll('.fe-sidebar-item').forEach(el => {
      el.classList.toggle('fe-sidebar-active', el.dataset.path === this.cwd);
    });
  }

  // ─── File Operations ────────────────────────────────────────────
  _toggleSelect(name) {
    if (this.selectedFiles.has(name)) this.selectedFiles.delete(name);
    else this.selectedFiles.add(name);
    this._renderContent();
    this._updateStatusSelected();
  }

  _rangeSelect(name) {
    // Simple: select from last selected to current
    this.selectedFiles.add(name);
    this._renderContent();
    this._updateStatusSelected();
  }

  _selectAll() {
    const node = this._getNode(this.cwd);
    if (!node || node.type !== 'dir') return;
    Object.keys(node.children).forEach(n => this.selectedFiles.add(n));
    this._renderContent();
    this._updateStatusSelected();
  }

  _updateStatusSelected() {
    const el = this.element.querySelector('#fe-status-selected');
    el.textContent = this.selectedFiles.size > 0 ? `${this.selectedFiles.size} selected` : '';
  }

  _deleteSelected() {
    if (this.selectedFiles.size === 0) return;
    const node = this._getNode(this.cwd);
    if (!node) return;

    this.selectedFiles.forEach(name => {
      const item = node.children[name];
      if (item) {
        this.trash.push({ name, item: JSON.parse(JSON.stringify(item)), fromPath: this.cwd });
        delete node.children[name];
      }
    });
    this.selectedFiles.clear();
    this._renderContent();
  }

  _renameSelected() {
    if (this.selectedFiles.size !== 1) return;
    const oldName = [...this.selectedFiles][0];
    const newName = prompt('New name:', oldName);
    if (!newName || newName === oldName) return;

    const node = this._getNode(this.cwd);
    if (!node || !node.children[oldName]) return;
    node.children[newName] = node.children[oldName];
    delete node.children[oldName];
    this.selectedFiles.clear();
    this.selectedFiles.add(newName);
    this._renderContent();
  }

  _copySelected() {
    this.clipboard = [...this.selectedFiles].map(name => ({
      name, item: JSON.parse(JSON.stringify(this._getNode(this.cwd).children[name])), fromPath: this.cwd
    }));
    this.clipboardOp = 'copy';
  }

  _cutSelected() {
    this.clipboard = [...this.selectedFiles].map(name => ({
      name, item: JSON.parse(JSON.stringify(this._getNode(this.cwd).children[name])), fromPath: this.cwd
    }));
    this.clipboardOp = 'cut';
  }

  _paste() {
    const node = this._getNode(this.cwd);
    if (!node || node.type !== 'dir' || this.clipboard.length === 0) return;

    this.clipboard.forEach(({ name, item, fromPath }) => {
      node.children[name] = JSON.parse(JSON.stringify(item));
      if (this.clipboardOp === 'cut') {
        const srcNode = this._getNode(fromPath);
        if (srcNode && srcNode.children) delete srcNode.children[name];
      }
    });

    if (this.clipboardOp === 'cut') this.clipboard = [];
    this._renderContent();
  }

  _openFile(path) {
    const node = this._getNode(path);
    if (!node || node.type !== 'file') return;

    // Show preview
    const preview = this.element.querySelector('#fe-preview');
    const titleEl = this.element.querySelector('#fe-preview-title');
    const contentEl = this.element.querySelector('#fe-preview-content');
    const infoEl = this.element.querySelector('#fe-preview-info');

    preview.style.display = 'flex';
    const name = path.split('/').pop();
    titleEl.textContent = name;

    const ext = name.split('.').pop();
    if (['txt', 'md', 'json', 'conf', 'js', 'css', 'html', 'log'].includes(ext)) {
      contentEl.innerHTML = `<pre class="fe-preview-text">${this._escapeHtml(node.content || '(empty)')}</pre>`;
    } else {
      contentEl.innerHTML = `<div class="fe-preview-icon-large">${this._getFileIcon(name, 'file')}</div>`;
    }

    infoEl.innerHTML = `
      <div>Type: ${this._getFileType(name)}</div>
      <div>Size: ${this._formatSize(node.size || (node.content || '').length)}</div>
      <div>Modified: ${node.modified ? new Date(node.modified).toLocaleString() : 'Unknown'}</div>
      <div>Path: ${path}</div>
    `;
  }

  _showTrash() {
    const content = this.element.querySelector('#fe-content');
    this.element.querySelector('#fe-address').value = 'Trash';
    this.element.querySelector('#fe-status-path').textContent = 'Trash';

    if (this.trash.length === 0) {
      content.innerHTML = '<div class="fe-empty">🗑 Trash is empty</div>';
      return;
    }

    content.className = 'fe-content fe-grid';
    content.innerHTML = this.trash.map((item, i) => `
      <div class="fe-item fe-grid-item" data-trash-idx="${i}">
        <div class="fe-grid-icon">${this._getFileIcon(item.name, item.item.type)}</div>
        <div class="fe-grid-name">${this._escapeHtml(item.name)}</div>
        <button class="fe-trash-restore" data-restore="${i}">Restore</button>
      </div>
    `).join('');

    content.querySelectorAll('[data-restore]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.restore);
        const item = this.trash[idx];
        const parentNode = this._getNode(item.fromPath);
        if (parentNode && parentNode.children) {
          parentNode.children[item.name] = item.item;
        }
        this.trash.splice(idx, 1);
        this._showTrash();
      });
    });
  }

  // ─── Context Menu ───────────────────────────────────────────────
  _showContextMenu(e, name) {
    const ctx = this.element.querySelector('#fe-context-menu');
    const node = this._getNode(this.cwd);
    const item = node && node.children ? node.children[name] : null;

    const menuItems = [
      { label: '📂 Open', action: 'open' },
      { label: '✏️ Rename', action: 'rename' },
      { label: '📋 Copy', action: 'copy' },
      { label: '✂️ Cut', action: 'cut' },
      { label: '📄 Duplicate', action: 'duplicate' },
      { divider: true },
      { label: '🗑 Delete', action: 'delete' },
      { divider: true },
      { label: 'ℹ️ Properties', action: 'properties' },
      { label: '📋 Copy Path', action: 'copypath' },
    ];

    ctx.innerHTML = menuItems.map(m => {
      if (m.divider) return '<div class="fe-ctx-divider"></div>';
      return `<div class="fe-ctx-item" data-action="${m.action}" data-name="${this._escapeHtml(name)}">${m.label}</div>`;
    }).join('');

    ctx.style.display = 'block';
    ctx.style.left = Math.min(e.offsetX, this.element.offsetWidth - 180) + 'px';
    ctx.style.top = Math.min(e.offsetY, this.element.offsetHeight - 200) + 'px';

    ctx.querySelectorAll('.fe-ctx-item').forEach(el => {
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        ctx.style.display = 'none';
        this.selectedFiles.clear();
        this.selectedFiles.add(el.dataset.name);
        switch (el.dataset.action) {
          case 'open':
            const item2 = this._getNode(this.cwd).children[el.dataset.name];
            if (item2 && item2.type === 'dir') this._navigate(this.cwd + '/' + el.dataset.name);
            else this._openFile(this.cwd + '/' + el.dataset.name);
            break;
          case 'rename': this._renameSelected(); break;
          case 'copy': this._copySelected(); break;
          case 'cut': this._cutSelected(); break;
          case 'delete': this._deleteSelected(); break;
          case 'duplicate':
            this._copySelected();
            this._paste();
            break;
          case 'copypath':
            const fullPath = this.cwd + '/' + el.dataset.name;
            navigator.clipboard && navigator.clipboard.writeText(fullPath);
            break;
          case 'properties':
            this._openFile(this.cwd + '/' + el.dataset.name);
            break;
        }
      });
    });
  }

  // ─── Icons ──────────────────────────────────────────────────────
  _getFileIcon(name, type) {
    if (type === 'dir') return '📁';
    const ext = name.split('.').pop().toLowerCase();
    const icons = {
      'txt': '📄', 'md': '📝', 'json': '📋', 'js': '🟨', 'ts': '🔷',
      'html': '🌐', 'htm': '🌐', 'css': '🎨', 'py': '🐍',
      'png': '🖼', 'jpg': '🖼', 'jpeg': '🖼', 'gif': '🖼', 'svg': '🖼', 'webp': '🖼',
      'mp3': '🎵', 'wav': '🎵', 'flac': '🎵', 'ogg': '🎵',
      'mp4': '🎬', 'avi': '🎬', 'mkv': '🎬', 'webm': '🎬',
      'zip': '📦', 'rar': '📦', '7z': '📦', 'tar': '📦', 'gz': '📦',
      'pdf': '📕', 'doc': '📘', 'docx': '📘', 'xls': '📗', 'xlsx': '📗',
      'conf': '⚙', 'cfg': '⚙', 'ini': '⚙', 'log': '📊',
      'sh': '📜', 'bat': '📜',
    };
    return icons[ext] || '📄';
  }

  _getFileType(name) {
    const ext = name.split('.').pop().toLowerCase();
    const types = {
      'txt': 'Text File', 'md': 'Markdown', 'json': 'JSON', 'js': 'JavaScript', 'ts': 'TypeScript',
      'html': 'HTML', 'css': 'CSS', 'py': 'Python',
      'png': 'PNG Image', 'jpg': 'JPEG Image', 'gif': 'GIF Image', 'svg': 'SVG Image',
      'mp3': 'MP3 Audio', 'wav': 'WAV Audio', 'mp4': 'MP4 Video',
      'zip': 'ZIP Archive', 'pdf': 'PDF Document',
      'conf': 'Config', 'log': 'Log File',
    };
    return types[ext] || ext.toUpperCase() + ' File';
  }

  _formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  _showError(msg) {
    const content = this.element.querySelector('#fe-content');
    content.innerHTML = `<div class="fe-error">⚠ ${this._escapeHtml(msg)}</div>`;
  }

  _escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ─── Styles ─────────────────────────────────────────────────────
  _getStyles() {
    return `
      .nexus-file-explorer {
        width: 100%; height: 100%;
        background: rgba(10, 5, 20, 0.96);
        border: 1px solid rgba(255, 0, 60, 0.2);
        border-radius: 8px;
        display: flex; flex-direction: column;
        overflow: hidden;
        box-shadow: 0 0 30px rgba(255, 0, 60, 0.1);
        font-family: 'Segoe UI', sans-serif;
      }

      /* Toolbar */
      .fe-toolbar {
        display: flex; align-items: center; gap: 6px;
        padding: 6px 10px;
        background: rgba(15, 8, 25, 0.8);
        border-bottom: 1px solid rgba(255, 0, 60, 0.1);
        flex-shrink: 0;
      }
      .fe-nav { display: flex; gap: 2px; }
      .fe-nav-btn {
        background: rgba(255, 0, 60, 0.06); border: 1px solid rgba(255, 0, 60, 0.1);
        color: #aaa; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-size: 10px;
      }
      .fe-nav-btn:hover { background: rgba(255, 0, 60, 0.15); color: #fff; }
      .fe-address-bar { display: flex; flex: 1; gap: 4px; }
      .fe-address {
        flex: 1; padding: 5px 10px; font-size: 12px;
        background: rgba(20, 10, 35, 0.9); border: 1px solid rgba(255, 0, 60, 0.15);
        color: #ddd; border-radius: 4px; outline: none; font-family: monospace;
      }
      .fe-address:focus { border-color: #ff003c; }
      .fe-go-btn { padding: 5px 12px; font-size: 11px; }
      .fe-toolbar-actions { display: flex; gap: 4px; align-items: center; }
      .fe-search-box { width: 100px; }
      .fe-search {
        width: 100%; padding: 5px 8px; font-size: 11px;
        background: rgba(20, 10, 35, 0.9); border: 1px solid rgba(255, 0, 60, 0.12);
        color: #ddd; border-radius: 4px; outline: none; box-sizing: border-box;
      }
      .fe-view-btn {
        background: rgba(255, 0, 60, 0.06); border: 1px solid rgba(255, 0, 60, 0.1);
        color: #aaa; width: 28px; height: 28px; border-radius: 4px; cursor: pointer; font-size: 14px;
      }
      .fe-view-btn:hover { background: rgba(255, 0, 60, 0.15); }
      .fe-sort-select {
        padding: 4px; font-size: 11px;
        background: rgba(20, 10, 35, 0.9); border: 1px solid rgba(255, 0, 60, 0.12);
        color: #aaa; border-radius: 4px; cursor: pointer;
      }

      /* Body */
      .fe-body { flex: 1; display: flex; overflow: hidden; }

      /* Sidebar */
      .fe-sidebar {
        width: 170px; flex-shrink: 0;
        background: rgba(12, 6, 22, 0.8);
        border-right: 1px solid rgba(255, 0, 60, 0.1);
        overflow-y: auto; padding: 6px 0;
      }
      .fe-sidebar::-webkit-scrollbar { width: 3px; }
      .fe-sidebar::-webkit-scrollbar-thumb { background: rgba(255,0,60,0.3); }
      .fe-sidebar-section { margin-bottom: 8px; }
      .fe-sidebar-label {
        font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 1px;
        padding: 4px 10px 2px;
      }
      .fe-sidebar-item {
        display: flex; align-items: center; gap: 6px;
        padding: 4px 10px; font-size: 11px; color: #999; cursor: pointer;
        transition: all 0.1s;
      }
      .fe-sidebar-item:hover { background: rgba(255, 0, 60, 0.06); color: #ddd; }
      .fe-sidebar-active { background: rgba(255, 0, 60, 0.12) !important; color: #ff003c !important; }

      .fe-tree { padding: 0 4px; }
      .fe-tree-folder {
        padding: 3px 8px; font-size: 10px; color: #888; cursor: pointer;
        border-radius: 3px; transition: all 0.1s;
      }
      .fe-tree-folder:hover { background: rgba(255, 0, 60, 0.06); }
      .fe-tree-active { color: #ff003c; background: rgba(255, 0, 60, 0.1); }
      .fe-tree-icon { font-size: 8px; margin-right: 2px; }

      /* Main */
      .fe-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }

      .fe-breadcrumbs {
        display: flex; align-items: center; gap: 4px;
        padding: 4px 10px;
        background: rgba(15, 8, 25, 0.5);
        border-bottom: 1px solid rgba(255, 0, 60, 0.06);
        flex-shrink: 0;
      }
      .fe-breadcrumb { font-size: 11px; color: #888; cursor: pointer; }
      .fe-breadcrumb:hover { color: #ff003c; }
      .fe-breadcrumb-sep { font-size: 10px; color: #444; }

      .fe-content { flex: 1; overflow-y: auto; padding: 10px; }
      .fe-content::-webkit-scrollbar { width: 4px; }
      .fe-content::-webkit-scrollbar-thumb { background: rgba(255,0,60,0.3); border-radius: 2px; }

      /* Grid View */
      .fe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; }
      .fe-grid-item {
        display: flex; flex-direction: column; align-items: center;
        padding: 10px 6px; border-radius: 8px; cursor: pointer;
        transition: all 0.1s; border: 1px solid transparent;
      }
      .fe-grid-item:hover { background: rgba(255, 0, 60, 0.06); }
      .fe-selected { background: rgba(255, 0, 60, 0.12) !important; border-color: rgba(255, 0, 60, 0.2) !important; }
      .fe-grid-icon { font-size: 32px; margin-bottom: 4px; }
      .fe-grid-name {
        font-size: 10px; color: #ccc; text-align: center;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        width: 100%;
      }

      /* List View */
      .fe-list { display: flex; flex-direction: column; }
      .fe-list-header {
        display: flex; gap: 8px; padding: 4px 8px;
        font-size: 10px; color: #666; border-bottom: 1px solid rgba(255, 0, 60, 0.08);
        font-weight: 600;
      }
      .fe-list-item {
        display: flex; gap: 8px; align-items: center;
        padding: 5px 8px; cursor: pointer;
        border-radius: 4px; transition: all 0.1s;
        border: 1px solid transparent; font-size: 12px;
      }
      .fe-list-item:hover { background: rgba(255, 0, 60, 0.06); }
      .fe-list-col-name { flex: 2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #ddd; }
      .fe-list-col-date { flex: 1; color: #888; font-size: 11px; }
      .fe-list-col-size { width: 70px; color: #888; font-size: 11px; text-align: right; }
      .fe-list-col-type { width: 90px; color: #888; font-size: 11px; }

      /* Preview */
      .fe-preview {
        width: 200px; flex-shrink: 0;
        background: rgba(12, 6, 22, 0.8);
        border-left: 1px solid rgba(255, 0, 60, 0.1);
        flex-direction: column; padding: 12px;
        overflow-y: auto;
      }
      .fe-preview-title { font-size: 12px; color: #ddd; font-weight: 600; margin-bottom: 8px; word-break: break-all; }
      .fe-preview-content { margin-bottom: 10px; }
      .fe-preview-text {
        font-size: 10px; color: #aaa; font-family: monospace;
        white-space: pre-wrap; word-break: break-all;
        max-height: 200px; overflow-y: auto;
        background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;
      }
      .fe-preview-icon-large { font-size: 48px; text-align: center; padding: 20px 0; }
      .fe-preview-info { font-size: 10px; color: #888; }
      .fe-preview-info div { margin-bottom: 3px; }

      /* Context Menu */
      .fe-context-menu {
        position: absolute; z-index: 100;
        min-width: 160px; padding: 4px;
        background: rgba(15, 8, 25, 0.95);
        border: 1px solid rgba(255, 0, 60, 0.2);
        border-radius: 6px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      }
      .fe-ctx-item {
        padding: 6px 12px; font-size: 11px; color: #ccc; cursor: pointer;
        border-radius: 4px; transition: background 0.1s;
      }
      .fe-ctx-item:hover { background: rgba(255, 0, 60, 0.15); color: #fff; }
      .fe-ctx-divider { height: 1px; background: rgba(255, 0, 60, 0.1); margin: 3px 0; }

      /* Status Bar */
      .fe-status-bar {
        display: flex; gap: 16px; padding: 3px 10px;
        font-size: 10px; color: #666;
        background: rgba(255, 0, 60, 0.06);
        border-top: 1px solid rgba(255, 0, 60, 0.08);
        flex-shrink: 0;
      }
      .fe-status-spacer { flex: 1; }

      /* Empty / Error */
      .fe-empty { text-align: center; color: #555; font-size: 13px; padding: 40px 20px; }
      .fe-error { color: #ff003c; text-align: center; padding: 20px; font-size: 13px; }
      .fe-trash-restore {
        margin-top: 4px; padding: 2px 8px; font-size: 9px;
        background: rgba(0, 255, 136, 0.1); border: 1px solid rgba(0, 255, 136, 0.2);
        color: #00ff88; border-radius: 3px; cursor: pointer;
      }
    `;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.NexusFileExplorer = NexusFileExplorer;
}
