'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Disk Analyzer
 *  Storage analysis with visual breakdown and cleanup recommendations
 * ═══════════════════════════════════════════════════════════════
 */
class NexusDiskAnalyzer {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.scanning = false;

    this.totalDisk = 512 * 1024; // 512 GB in MB
    this.categories = [
      { name: 'System',       color: '#ff003c', size: 28400,  icon: '⚙',  items: ['nexus-kernel (4.2 GB)', 'System libraries (8.1 GB)', 'Drivers (3.8 GB)', 'Boot files (1.2 GB)', 'Firmware (2.1 GB)', 'System cache (9.0 GB)'] },
      { name: 'Applications', color: '#00c8ff', size: 67800,  icon: '📦', items: ['Music Studio (12.4 GB)', 'Code Editor (8.2 GB)', 'AI Chat (6.8 GB)', 'Media tools (15.2 GB)', 'Games (18.6 GB)', 'Utilities (6.6 GB)'] },
      { name: 'Documents',    color: '#b400ff', size: 23500,  icon: '📄', items: ['Projects (8.4 GB)', 'Notes & docs (3.2 GB)', 'Downloads (7.8 GB)', 'Archives (4.1 GB)'] },
      { name: 'Media',        color: '#ff6400', size: 145000, icon: '🎬', items: ['Videos (68.2 GB)', 'Music (32.1 GB)', 'Images (24.8 GB)', 'Audio samples (19.9 GB)'] },
      { name: 'Databases',    color: '#00ff88', size: 18200,  icon: '🗄', items: ['App databases (6.2 GB)', 'Cache DB (5.4 GB)', 'Logs DB (3.8 GB)', 'Backups (2.8 GB)'] },
      { name: 'Cache & Temp', color: '#ffc800', size: 12600,  icon: '🗑', items: ['Browser cache (4.8 GB)', 'App temp files (3.2 GB)', 'Thumbnails (1.8 GB)', 'Build artifacts (2.8 GB)'] },
      { name: 'Other',        color: '#888888', size: 8900,   icon: '📎', items: ['Misc data (5.2 GB)', 'Orphaned files (2.4 GB)', 'Unknown (1.3 GB)'] },
    ];

    this.cleanupItems = [
      { name: 'Temporary files',          size: 3200,  checked: false, safe: true },
      { name: 'Old log files (>30 days)', size: 1800,  checked: false, safe: true },
      { name: 'Browser cache',            size: 4800,  checked: false, safe: true },
      { name: 'Thumbnail cache',          size: 1800,  checked: false, safe: true },
      { name: 'Build artifacts',          size: 2800,  checked: false, safe: true },
      { name: 'Download duplicates',      size: 2400,  checked: false, safe: true },
      { name: 'Orphaned packages',        size: 1200,  checked: false, safe: true },
      { name: 'Old crash dumps',          size: 800,   checked: false, safe: true },
      { name: 'Stale index files',        size: 400,   checked: false, safe: true },
      { name: 'Unused app data',          size: 3600,  checked: false, safe: false },
      { name: 'Old system snapshots',     size: 5200,  checked: false, safe: false },
    ];

    this.fileTree = [
      { name: '/system',        size: 28400, icon: '📁', expanded: false, children: [
        { name: 'kernel', size: 4200, icon: '📁' },
        { name: 'lib', size: 8100, icon: '📁' },
        { name: 'drivers', size: 3800, icon: '📁' },
        { name: 'boot', size: 1200, icon: '📁' },
      ]},
      { name: '/home/operator', size: 145000, icon: '📁', expanded: false, children: [
        { name: 'Documents', size: 23500, icon: '📁' },
        { name: 'Media', size: 89000, icon: '📁' },
        { name: 'Projects', size: 18200, icon: '📁' },
        { name: 'Downloads', size: 7800, icon: '📁' },
        { name: '.cache', size: 6500, icon: '📁' },
      ]},
      { name: '/var',           size: 18200, icon: '📁', expanded: false, children: [
        { name: 'log', size: 3800, icon: '📁' },
        { name: 'db', size: 6200, icon: '📁' },
        { name: 'cache', size: 5400, icon: '📁' },
        { name: 'tmp', size: 2800, icon: '📁' },
      ]},
      { name: '/apps',          size: 67800, icon: '📁', expanded: false, children: [
        { name: 'music-studio', size: 12400, icon: '📦' },
        { name: 'code-editor', size: 8200, icon: '📦' },
        { name: 'ai-chat', size: 6800, icon: '📦' },
        { name: 'games', size: 18600, icon: '🎮' },
        { name: 'media-tools', size: 15200, icon: '📦' },
      ]},
    ];
  }

  render() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/tools/disk-analyzer.css';
    this.container.appendChild(link);
    this._linkEl = link;

    this.element = document.createElement('div');
    this.element.className = 'nexus-disk-analyzer';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._bindEvents();
    this._drawRing();
    this._renderBreakdown();
    this._renderTree();
    this._renderCleanup();
    this._updateOverview();
  }

  destroy() {
    if (this._linkEl) this._linkEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <div class="da-header">
        <h3>💿 DISK ANALYZER</h3>
        <button class="da-btn" id="da-scan">⟳ Rescan</button>
      </div>
      <div class="da-body">
        <div class="da-overview">
          <div class="da-card">
            <div class="da-card-value" id="da-total">${this._fmtSize(this.totalDisk * 1048576)}</div>
            <div class="da-card-label">Total Disk</div>
          </div>
          <div class="da-card">
            <div class="da-card-value" id="da-used" style="color:#ff4444">—</div>
            <div class="da-card-label">Used</div>
          </div>
          <div class="da-card">
            <div class="da-card-value" id="da-free" style="color:#00ff88">—</div>
            <div class="da-card-label">Free</div>
          </div>
        </div>

        <div style="display:flex;gap:20px;align-items:flex-start">
          <div class="da-ring-wrap">
            <div class="da-ring">
              <canvas id="da-ring-canvas" width="200" height="200"></canvas>
              <div class="da-ring-label" id="da-ring-pct">0%</div>
            </div>
          </div>
          <div class="da-breakdown" id="da-breakdown" style="flex:1"></div>
        </div>

        <div class="da-section">
          <h4>File System Tree</h4>
          <div class="da-tree" id="da-tree"></div>
        </div>

        <div class="da-section">
          <h4>Cleanup Recommendations</h4>
          <div id="da-cleanup-list"></div>
          <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
            <button class="da-btn" id="da-clean">🧹 Clean Selected</button>
            <button class="da-btn" id="da-clean-all">Select All Safe</button>
            <span id="da-clean-total" style="margin-left:auto;font-size:11px;color:#b400ff"></span>
          </div>
        </div>
      </div>
      <div class="da-footer">
        <span id="da-footer-info">Last scan: never</span>
        <span id="da-footer-status">Ready</span>
      </div>
    `;
  }

  _bindEvents() {
    this.element.querySelector('#da-scan').addEventListener('click', () => this._rescan());
    this.element.querySelector('#da-clean').addEventListener('click', () => this._runCleanup());
    this.element.querySelector('#da-clean-all').addEventListener('click', () => {
      this.cleanupItems.forEach(c => { if (c.safe) c.checked = true; });
      this._renderCleanup();
    });

    this.element.querySelector('#da-tree').addEventListener('click', (e) => {
      const item = e.target.closest('.da-tree-item');
      if (!item || !item.dataset.idx) return;
      const idx = parseInt(item.dataset.idx);
      if (this.fileTree[idx]) {
        this.fileTree[idx].expanded = !this.fileTree[idx].expanded;
        this._renderTree();
      }
    });

    this.element.querySelector('#da-cleanup-list').addEventListener('change', (e) => {
      if (e.target.classList.contains('da-cleanup-check')) {
        const idx = parseInt(e.target.dataset.idx);
        this.cleanupItems[idx].checked = e.target.checked;
        this._updateCleanTotal();
      }
    });
  }

  _drawRing() {
    const canvas = this.element.querySelector('#da-ring-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 200;
    const cx = size / 2, cy = size / 2, r = 80, lw = 18;

    ctx.clearRect(0, 0, size, size);

    // Background ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = lw;
    ctx.stroke();

    // Category segments
    const totalUsed = this.categories.reduce((s, c) => s + c.size, 0);
    let angle = -Math.PI / 2;
    this.categories.forEach(cat => {
      const sweep = (cat.size / totalUsed) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, angle, angle + sweep);
      ctx.strokeStyle = cat.color;
      ctx.lineWidth = lw;
      ctx.shadowColor = cat.color;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
      angle += sweep;
    });

    const pct = ((totalUsed / this.totalDisk) * 100).toFixed(1);
    this.element.querySelector('#da-ring-pct').textContent = `${pct}%`;
  }

  _renderBreakdown() {
    const el = this.element.querySelector('#da-breakdown');
    const totalUsed = this.categories.reduce((s, c) => s + c.size, 0);

    // Stacked bar
    let barHTML = '<div class="da-breakdown-bar">';
    this.categories.forEach(cat => {
      const pct = (cat.size / this.totalDisk * 100).toFixed(2);
      barHTML += `<div class="da-breakdown-seg" style="width:${pct}%;background:${cat.color}" title="${cat.name}: ${this._fmtSize(cat.size * 1048576)}"></div>`;
    });
    barHTML += '</div>';

    // Legend
    barHTML += '<div style="margin-top:10px">';
    this.categories.forEach(cat => {
      const pct = (cat.size / totalUsed * 100).toFixed(1);
      barHTML += `
        <div class="da-breakdown-item">
          <div class="da-breakdown-color" style="background:${cat.color}"></div>
          <span>${cat.icon}</span>
          <span class="da-breakdown-name">${cat.name}</span>
          <span class="da-breakdown-size">${this._fmtSize(cat.size * 1048576)} (${pct}%)</span>
        </div>
      `;
    });
    barHTML += '</div>';

    el.innerHTML = barHTML;
  }

  _renderTree() {
    const el = this.element.querySelector('#da-tree');
    let html = '';
    this.fileTree.forEach((node, i) => {
      html += `<div class="da-tree-item" data-idx="${i}">
        <span class="da-tree-icon">${node.expanded ? '📂' : node.icon}</span>
        <span class="da-tree-name">${node.name}</span>
        <span class="da-tree-size">${this._fmtSize(node.size * 1048576)}</span>
      </div>`;
      if (node.expanded && node.children) {
        node.children.forEach(child => {
          html += `<div class="da-tree-item" style="padding-left:28px">
            <span class="da-tree-icon">${child.icon}</span>
            <span class="da-tree-name">${child.name}</span>
            <span class="da-tree-size">${this._fmtSize(child.size * 1048576)}</span>
          </div>`;
        });
      }
    });
    el.innerHTML = html;
  }

  _renderCleanup() {
    const el = this.element.querySelector('#da-cleanup-list');
    el.innerHTML = this.cleanupItems.map((item, i) => `
      <div class="da-cleanup-item">
        <input type="checkbox" class="da-cleanup-check" data-idx="${i}" ${item.checked ? 'checked' : ''}>
        <span>${item.name}</span>
        ${item.safe ? '<span style="color:#00ff88;font-size:9px">SAFE</span>' : '<span style="color:#ffaa00;font-size:9px">⚠ REVIEW</span>'}
        <span class="da-cleanup-size">${this._fmtSize(item.size * 1048576)}</span>
      </div>
    `).join('');
    this._updateCleanTotal();
  }

  _updateCleanTotal() {
    const total = this.cleanupItems.filter(c => c.checked).reduce((s, c) => s + c.size, 0);
    this.element.querySelector('#da-clean-total').textContent = `Would free: ${this._fmtSize(total * 1048576)}`;
  }

  async _rescan() {
    if (this.scanning) return;
    this.scanning = true;
    this.element.querySelector('#da-footer-status').textContent = 'Scanning...';
    this.element.querySelector('#da-scan').disabled = true;

    // Simulate scan with random variation
    for (const cat of this.categories) {
      await this._delay(150 + Math.random() * 200);
      cat.size = Math.max(100, cat.size + Math.floor((Math.random() - 0.5) * 2000));
    }

    this._drawRing();
    this._renderBreakdown();
    this._updateOverview();

    this.element.querySelector('#da-footer-info').textContent = `Last scan: ${new Date().toLocaleTimeString()}`;
    this.element.querySelector('#da-footer-status').textContent = 'Scan complete';
    this.element.querySelector('#da-scan').disabled = false;
    this.scanning = false;
  }

  async _runCleanup() {
    const selected = this.cleanupItems.filter(c => c.checked);
    if (selected.length === 0) return;

    this.element.querySelector('#da-footer-status').textContent = 'Cleaning...';
    for (const item of selected) {
      await this._delay(200 + Math.random() * 300);
    }

    const total = selected.reduce((s, c) => s + c.size, 0);
    // Reduce cache/temp category
    const cacheCat = this.categories.find(c => c.name === 'Cache & Temp');
    if (cacheCat) cacheCat.size = Math.max(500, cacheCat.size - total);

    // Reset checks
    selected.forEach(c => { c.checked = false; c.size = Math.floor(Math.random() * 500); });

    this._drawRing();
    this._renderBreakdown();
    this._renderCleanup();
    this._updateOverview();

    this.element.querySelector('#da-footer-status').textContent = `Cleaned ${this._fmtSize(total * 1048576)}`;
  }

  _updateOverview() {
    const used = this.categories.reduce((s, c) => s + c.size, 0);
    const free = this.totalDisk - used;
    this.element.querySelector('#da-used').textContent = this._fmtSize(used * 1048576);
    this.element.querySelector('#da-free').textContent = this._fmtSize(free * 1048576);
  }

  _fmtSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1073741824).toFixed(1)} GB`;
  }

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

window.NexusDiskAnalyzer = NexusDiskAnalyzer;
