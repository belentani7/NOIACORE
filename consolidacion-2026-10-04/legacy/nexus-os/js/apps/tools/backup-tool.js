'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Backup Tool
 *  Export/import app data, backup/restore with full lifecycle
 * ═══════════════════════════════════════════════════════════════
 */
class NexusBackupTool {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.logs = [];
    this.backups = [];
    this.selectedApps = new Set();
    this.progress = 0;
    this.isRunning = false;

    this.appData = {
      'terminal':      { name: 'Terminal',         icon: '⌨', size: 2400,  data: { history: 50, aliases: 8, config: true } },
      'calculator':    { name: 'Calculator',       icon: '🧮', size: 800,   data: { history: 30, settings: true } },
      'notepad':       { name: 'Notepad',          icon: '📝', size: 15600, data: { documents: 12, autosave: true } },
      'code-editor':   { name: 'Code Editor',      icon: '💻', size: 45200, data: { files: 28, sessions: 5, settings: true } },
      'file-explorer': { name: 'File Explorer',    icon: '📁', size: 3200,  data: { bookmarks: 6, viewPrefs: true } },
      'paint':         { name: 'Paint',            icon: '🎨', size: 89000, data: { canvases: 7, palettes: 3 } },
      'settings':      { name: 'Settings',         icon: '⚙', size: 1200,  data: { theme: true, layout: true, prefs: true } },
      'clock':         { name: 'Clock',            icon: '🕐', size: 600,   data: { alarms: 3, timezone: true } },
      'weather':       { name: 'Weather',          icon: '🌤', size: 4500,  data: { locations: 4, cache: true } },
      'music-studio':  { name: 'Music Studio',     icon: '🎵', size: 234000, data: { projects: 3, samples: 45, presets: 12 } },
      'synth-lab':     { name: 'Synth Lab',        icon: '🎹', size: 18000, data: { patches: 22, presets: 8 } },
      'drum-machine':  { name: 'Drum Machine',     icon: '🥁', size: 56000, data: { kits: 5, patterns: 16 } },
      'ai-chat':       { name: 'AI Chat',          icon: '🤖', size: 67000, data: { conversations: 15, context: true } },
      'game-saves':    { name: 'Game Saves',       icon: '🎮', size: 12400, data: { saves: 8, scores: true } },
    };

    this._loadBackups();
  }

  render() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/tools/backup-tool.css';
    this.container.appendChild(link);
    this._linkEl = link;

    this.element = document.createElement('div');
    this.element.className = 'nexus-backup-tool';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._bindEvents();
    this._renderAppList();
    this._renderBackups();
    this._renderLog();
  }

  destroy() {
    this._saveBackups();
    if (this._linkEl) this._linkEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <div class="bt-header">
        <h3>💾 BACKUP TOOL</h3>
        <span style="font-size:10px;color:#555">NEXUS Data Protection</span>
      </div>
      <div class="bt-body">
        <div class="bt-section">
          <h4>Select Applications to Backup</h4>
          <div class="bt-app-list" id="bt-app-list"></div>
          <div style="margin-top:8px;display:flex;gap:6px">
            <button class="bt-btn" id="bt-select-all">Select All</button>
            <button class="bt-btn" id="bt-deselect">Deselect All</button>
          </div>
        </div>

        <div class="bt-section">
          <h4>Actions</h4>
          <div class="bt-actions">
            <button class="bt-btn bt-btn-primary" id="bt-backup">⬇ Create Backup</button>
            <button class="bt-btn bt-btn-primary" id="bt-export">📤 Export JSON</button>
            <button class="bt-btn bt-btn-warn" id="bt-import">📥 Import Backup</button>
            <button class="bt-btn bt-btn-warn" id="bt-restore">🔄 Restore Selected</button>
          </div>
          <div class="bt-progress" id="bt-progress-wrap" style="display:none">
            <div class="bt-progress-bar" id="bt-progress-bar" style="width:0%"></div>
          </div>
        </div>

        <div class="bt-section">
          <h4>Backup History</h4>
          <div class="bt-backup-list" id="bt-backup-list"></div>
        </div>

        <div class="bt-section">
          <h4>Activity Log</h4>
          <div class="bt-log" id="bt-log"></div>
          <button class="bt-btn" id="bt-clear-log" style="margin-top:6px">Clear Log</button>
        </div>
      </div>
      <div class="bt-footer">
        <span id="bt-footer-size">Total backup size: 0 KB</span>
        <span id="bt-footer-count">0 backups stored</span>
      </div>
    `;
  }

  _bindEvents() {
    this.element.querySelector('#bt-select-all').addEventListener('click', () => {
      Object.keys(this.appData).forEach(k => this.selectedApps.add(k));
      this._renderAppList();
    });
    this.element.querySelector('#bt-deselect').addEventListener('click', () => {
      this.selectedApps.clear();
      this._renderAppList();
    });
    this.element.querySelector('#bt-backup').addEventListener('click', () => this._createBackup());
    this.element.querySelector('#bt-export').addEventListener('click', () => this._exportJSON());
    this.element.querySelector('#bt-import').addEventListener('click', () => this._importBackup());
    this.element.querySelector('#bt-restore').addEventListener('click', () => this._restoreSelected());
    this.element.querySelector('#bt-clear-log').addEventListener('click', () => {
      this.logs = [];
      this._renderLog();
    });

    this.element.querySelector('#bt-app-list').addEventListener('click', (e) => {
      const item = e.target.closest('.bt-app-item');
      if (!item) return;
      const key = item.dataset.key;
      if (this.selectedApps.has(key)) this.selectedApps.delete(key);
      else this.selectedApps.add(key);
      this._renderAppList();
    });
  }

  _renderAppList() {
    const el = this.element.querySelector('#bt-app-list');
    let totalSize = 0;
    el.innerHTML = Object.entries(this.appData).map(([key, app]) => {
      const sel = this.selectedApps.has(key);
      if (sel) totalSize += app.size;
      return `
        <div class="bt-app-item ${sel ? 'selected' : ''}" data-key="${key}">
          <input type="checkbox" class="bt-app-check" ${sel ? 'checked' : ''}>
          <span>${app.icon}</span>
          <span>${app.name}</span>
          <span class="bt-app-size">${this._fmtSize(app.size)}</span>
        </div>
      `;
    }).join('');
    this.element.querySelector('#bt-footer-size').textContent = `Selected size: ${this._fmtSize(totalSize)}`;
  }

  _renderBackups() {
    const el = this.element.querySelector('#bt-backup-list');
    if (this.backups.length === 0) {
      el.innerHTML = '<div style="font-size:11px;color:#444;padding:8px">No backups yet. Select apps and create a backup.</div>';
      return;
    }
    el.innerHTML = this.backups.map((b, i) => `
      <div class="bt-backup-item">
        <input type="checkbox" class="bt-app-check bt-backup-check" data-idx="${i}">
        <span class="bt-backup-date">${b.date}</span>
        <span>${b.apps.length} apps</span>
        <span style="color:#888">${b.apps.map(a => this.appData[a]?.icon || '?').join('')}</span>
        <span class="bt-backup-size">${this._fmtSize(b.size)}</span>
        <button class="bt-btn" data-action="delete" data-idx="${i}" style="padding:2px 8px;font-size:9px">✕</button>
      </div>
    `).join('');
    this.element.querySelector('#bt-footer-count').textContent = `${this.backups.length} backups stored`;

    el.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.backups.splice(parseInt(btn.dataset.idx), 1);
        this._saveBackups();
        this._renderBackups();
        this._log('Backup deleted', 'warn');
      });
    });
  }

  _renderLog() {
    const el = this.element.querySelector('#bt-log');
    el.innerHTML = this.logs.slice(-50).map(l =>
      `<div class="bt-log-entry"><span class="bt-log-time">${l.time}</span><span class="bt-log-${l.type}">${l.msg}</span></div>`
    ).join('');
    el.scrollTop = el.scrollHeight;
  }

  _log(msg, type = 'info') {
    const now = new Date();
    this.logs.push({
      time: now.toLocaleTimeString(),
      msg,
      type
    });
    this._renderLog();
  }

  async _createBackup() {
    if (this.isRunning) return;
    if (this.selectedApps.size === 0) {
      this._log('No applications selected for backup', 'warn');
      return;
    }

    this.isRunning = true;
    const apps = [...this.selectedApps];
    const totalSize = apps.reduce((s, k) => s + (this.appData[k]?.size || 0), 0);

    this._log(`Starting backup of ${apps.length} applications...`, 'info');
    this._showProgress(true);

    for (let i = 0; i < apps.length; i++) {
      const app = this.appData[apps[i]];
      await this._delay(300 + Math.random() * 400);
      this._setProgress(((i + 1) / apps.length) * 100);
      this._log(`Backed up ${app.icon} ${app.name} (${this._fmtSize(app.size)})`, 'ok');
    }

    const backup = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      apps: [...apps],
      size: totalSize,
      data: {}
    };

    // Simulate data capture
    apps.forEach(k => {
      backup.data[k] = { ...this.appData[k].data, timestamp: Date.now(), checksum: this._fakeHash() };
    });

    this.backups.unshift(backup);
    this._saveBackups();
    this._renderBackups();

    this._log(`Backup complete: ${this._fmtSize(totalSize)} total`, 'ok');
    this._showProgress(false);
    this.isRunning = false;
  }

  async _exportJSON() {
    if (this.backups.length === 0) {
      this._log('No backups to export', 'warn');
      return;
    }
    this._log('Exporting backup data as JSON...', 'info');
    await this._delay(500);

    const exportData = {
      nexus_backup: true,
      version: '1.0',
      exported: new Date().toISOString(),
      backups: this.backups.map(b => ({
        ...b,
        data: Object.fromEntries(
          Object.entries(b.data).map(([k, v]) => [k, { ...v, exported: true }])
        )
      }))
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this._log(`Exported ${this.backups.length} backups (${this._fmtSize(json.length)})`, 'ok');
  }

  async _importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      this._log(`Importing ${file.name}...`, 'info');
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.nexus_backup) {
          this._log('Invalid backup file format', 'err');
          return;
        }
        const count = data.backups?.length || 0;
        this.backups.unshift(...(data.backups || []));
        this._saveBackups();
        this._renderBackups();
        this._log(`Imported ${count} backups from ${file.name}`, 'ok');
      } catch (err) {
        this._log(`Import failed: ${err.message}`, 'err');
      }
    });
    input.click();
  }

  async _restoreSelected() {
    const checks = this.element.querySelectorAll('.bt-backup-check:checked');
    if (checks.length === 0) {
      this._log('No backups selected for restore', 'warn');
      return;
    }

    this.isRunning = true;
    this._showProgress(true);

    for (let i = 0; i < checks.length; i++) {
      const idx = parseInt(checks[i].dataset.idx);
      const backup = this.backups[idx];
      if (!backup) continue;

      this._log(`Restoring backup from ${backup.date}...`, 'info');
      for (let j = 0; j < backup.apps.length; j++) {
        const app = this.appData[backup.apps[j]];
        await this._delay(200 + Math.random() * 300);
        const pct = ((i * backup.apps.length + j + 1) / (checks.length * Math.max(backup.apps.length, 1))) * 100;
        this._setProgress(pct);
        if (app) this._log(`Restored ${app.icon} ${app.name}`, 'ok');
      }
    }

    this._log('All selected backups restored successfully', 'ok');
    this._showProgress(false);
    this.isRunning = false;
  }

  _showProgress(show) {
    this.element.querySelector('#bt-progress-wrap').style.display = show ? 'block' : 'none';
    if (!show) this._setProgress(0);
  }

  _setProgress(pct) {
    this.progress = Math.min(100, pct);
    this.element.querySelector('#bt-progress-bar').style.width = `${this.progress}%`;
  }

  _loadBackups() {
    try {
      const data = localStorage.getItem('nexus:backups');
      if (data) this.backups = JSON.parse(data);
    } catch (e) { this.backups = []; }
  }

  _saveBackups() {
    try {
      // Limit to 20 backups to avoid storage bloat
      localStorage.setItem('nexus:backups', JSON.stringify(this.backups.slice(0, 20)));
    } catch (e) { /* storage full */ }
  }

  _fmtSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  _fakeHash() {
    return Array.from({ length: 16 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
  }

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

window.NexusBackupTool = NexusBackupTool;
