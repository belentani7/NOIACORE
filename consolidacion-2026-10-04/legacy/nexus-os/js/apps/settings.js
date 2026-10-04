'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — System Settings
 *  Full OS configuration panel with neon glassmorphism
 * ═══════════════════════════════════════════════════════════════
 */
class NexusSettings {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.activeTab = 'appearance';

    // Current settings (loaded from storage)
    this.settings = {
      theme: 'neon-red',
      accentColor: '#ff003c',
      wallpaper: 'default',
      fontSize: 'medium',
      animations: true,
      transparency: 85,
      glowIntensity: 70,
      masterVolume: 75,
      systemSounds: true,
      notificationSounds: true,
      musicVolume: 50,
      notificationsEnabled: true,
      appNotifications: {
        terminal: true, 'code-editor': true, calculator: true,
        clock: true, weather: true, notepad: true,
        paint: true, 'file-explorer': true
      },
      doNotDisturb: false,
      notificationDuration: 5,
      shortcuts: {
        'Open Terminal': 'Ctrl+`',
        'File Explorer': 'Ctrl+E',
        'Search': 'Ctrl+K',
        'Lock Screen': 'Ctrl+L',
        'Screenshot': 'Ctrl+Shift+S',
        'Settings': 'Ctrl+,',
        'Workspace Left': 'Ctrl+Alt+Left',
        'Workspace Right': 'Ctrl+Alt+Right',
        'Close Window': 'Alt+F4',
        'Minimize All': 'Ctrl+D'
      }
    };

    this.konamiCode = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    this.konamiIndex = 0;
    this.konamiActive = false;

    this._loadSettings();
  }

  render() {
    const style = document.createElement('style');
    style.textContent = this._getStyles();
    this.container.appendChild(style);
    this._styleEl = style;

    this.element = document.createElement('div');
    this.element.className = 'nexus-settings';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._bindEvents();
    this._switchTab('appearance');
  }

  destroy() {
    this._saveSettings();
    if (this._styleEl) this._styleEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <div class="st-body">
        <!-- Sidebar -->
        <div class="st-sidebar">
          <div class="st-sidebar-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ff003c" stroke-width="1.5">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.6.85.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z"/>
            </svg>
            <span>Settings</span>
          </div>
          <div class="st-sidebar-item st-sidebar-active" data-tab="appearance">🎨 Appearance</div>
          <div class="st-sidebar-item" data-tab="sound">🔊 Sound</div>
          <div class="st-sidebar-item" data-tab="notifications">🔔 Notifications</div>
          <div class="st-sidebar-item" data-tab="shortcuts">⌨️ Shortcuts</div>
          <div class="st-sidebar-item" data-tab="storage">💾 Storage</div>
          <div class="st-sidebar-item" data-tab="privacy">🔒 Privacy</div>
          <div class="st-sidebar-item" data-tab="about">ℹ️ About</div>
        </div>

        <!-- Content -->
        <div class="st-content" id="st-content"></div>
      </div>
    `;
  }

  _bindEvents() {
    // Sidebar navigation
    this.element.querySelector('.st-sidebar').addEventListener('click', (e) => {
      const item = e.target.closest('.st-sidebar-item');
      if (!item) return;
      this._switchTab(item.dataset.tab);
    });

    // Konami code
    this._konamiHandler = (e) => {
      if (e.key === this.konamiCode[this.konamiIndex]) {
        this.konamiIndex++;
        if (this.konamiIndex === this.konamiCode.length) {
          this.konamiActive = !this.konamiActive;
          this.konamiIndex = 0;
          this._activateKonami();
        }
      } else {
        this.konamiIndex = 0;
      }
    };
    this.element.addEventListener('keydown', this._konamiHandler);
    this.element.tabIndex = 0;
  }

  _switchTab(tab) {
    this.activeTab = tab;
    this.element.querySelectorAll('.st-sidebar-item').forEach(el =>
      el.classList.toggle('st-sidebar-active', el.dataset.tab === tab)
    );
    const content = this.element.querySelector('#st-content');
    content.innerHTML = this._getTabHTML(tab);
    this._bindTabEvents(tab);
  }

  // ─── Tab Content ────────────────────────────────────────────────
  _getTabHTML(tab) {
    switch (tab) {
      case 'appearance': return this._appearanceHTML();
      case 'sound': return this._soundHTML();
      case 'notifications': return this._notificationsHTML();
      case 'shortcuts': return this._shortcutsHTML();
      case 'storage': return this._storageHTML();
      case 'privacy': return this._privacyHTML();
      case 'about': return this._aboutHTML();
      default: return '';
    }
  }

  _appearanceHTML() {
    return `
      <div class="st-section">
        <h2 class="st-section-title">Appearance</h2>
        <p class="st-section-desc">Customize the look and feel of NEXUS OS</p>

        <div class="st-setting-group">
          <div class="st-setting-row">
            <div class="st-setting-label">Theme</div>
            <div class="st-setting-control">
              <div class="st-theme-options">
                <div class="st-theme-option ${this.settings.theme === 'neon-red' ? 'st-theme-active' : ''}" data-theme="neon-red">
                  <div class="st-theme-preview" style="background:linear-gradient(135deg,#1a0008,#0a0015);border-color:#ff003c">
                    <div style="width:20px;height:2px;background:#ff003c;margin:4px"></div>
                    <div style="width:14px;height:2px;background:#ff2d6b;margin:4px"></div>
                  </div>
                  <span>Neon Red</span>
                </div>
                <div class="st-theme-option ${this.settings.theme === 'cyber-night' ? 'st-theme-active' : ''}" data-theme="cyber-night">
                  <div class="st-theme-preview" style="background:linear-gradient(135deg,#000a14,#050510);border-color:#00ccff">
                    <div style="width:20px;height:2px;background:#00ccff;margin:4px"></div>
                    <div style="width:14px;height:2px;background:#0088aa;margin:4px"></div>
                  </div>
                  <span>Cyber Night</span>
                </div>
                <div class="st-theme-option ${this.settings.theme === 'void-black' ? 'st-theme-active' : ''}" data-theme="void-black">
                  <div class="st-theme-preview" style="background:linear-gradient(135deg,#000,#0a0a0a);border-color:#ff2d6b">
                    <div style="width:20px;height:2px;background:#ff2d6b;margin:4px"></div>
                    <div style="width:14px;height:2px;background:#880033;margin:4px"></div>
                  </div>
                  <span>Void Black</span>
                </div>
              </div>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">Accent Color</div>
            <div class="st-setting-control">
              <input type="color" class="st-color-picker" id="st-accent-color" value="${this.settings.accentColor}">
              <div class="st-color-presets">
                ${['#ff003c','#00ccff','#00ff88','#ffaa00','#cc99ff','#ff6699','#ff2d6b','#44ddaa'].map(c =>
                  `<div class="st-color-preset" style="background:${c}" data-color="${c}" title="${c}"></div>`
                ).join('')}
              </div>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">Wallpaper</div>
            <div class="st-setting-control">
              <div class="st-wallpaper-options">
                ${['default', 'grid', 'particles', 'gradient', 'solid'].map(w =>
                  `<div class="st-wallpaper-option ${this.settings.wallpaper === w ? 'st-wp-active' : ''}" data-wp="${w}">
                    <div class="st-wp-preview st-wp-${w}"></div>
                    <span>${w.charAt(0).toUpperCase() + w.slice(1)}</span>
                  </div>`
                ).join('')}
              </div>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">Font Size</div>
            <div class="st-setting-control">
              <div class="st-radio-group">
                ${['small', 'medium', 'large'].map(s =>
                  `<label class="st-radio">
                    <input type="radio" name="fontsize" value="${s}" ${this.settings.fontSize === s ? 'checked' : ''}>
                    <span>${s.charAt(0).toUpperCase() + s.slice(1)}</span>
                  </label>`
                ).join('')}
              </div>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">Animations</div>
            <div class="st-setting-control">
              <label class="st-toggle">
                <input type="checkbox" id="st-animations" ${this.settings.animations ? 'checked' : ''}>
                <span class="st-toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">Transparency Level</div>
            <div class="st-setting-control">
              <input type="range" class="st-slider" id="st-transparency" min="0" max="100" value="${this.settings.transparency}">
              <span class="st-slider-val" id="st-transparency-val">${this.settings.transparency}%</span>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">Window Glow Intensity</div>
            <div class="st-setting-control">
              <input type="range" class="st-slider" id="st-glow" min="0" max="100" value="${this.settings.glowIntensity}">
              <span class="st-slider-val" id="st-glow-val">${this.settings.glowIntensity}%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _soundHTML() {
    return `
      <div class="st-section">
        <h2 class="st-section-title">Sound</h2>
        <p class="st-section-desc">Configure audio settings for NEXUS OS</p>

        <div class="st-setting-group">
          <div class="st-setting-row">
            <div class="st-setting-label">Master Volume</div>
            <div class="st-setting-control">
              <input type="range" class="st-slider" id="st-master-vol" min="0" max="100" value="${this.settings.masterVolume}">
              <span class="st-slider-val" id="st-master-vol-val">${this.settings.masterVolume}%</span>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">System Sounds</div>
            <div class="st-setting-control">
              <label class="st-toggle">
                <input type="checkbox" id="st-sys-sounds" ${this.settings.systemSounds ? 'checked' : ''}>
                <span class="st-toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">Notification Sounds</div>
            <div class="st-setting-control">
              <label class="st-toggle">
                <input type="checkbox" id="st-notif-sounds" ${this.settings.notificationSounds ? 'checked' : ''}>
                <span class="st-toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">Music Player Volume</div>
            <div class="st-setting-control">
              <input type="range" class="st-slider" id="st-music-vol" min="0" max="100" value="${this.settings.musicVolume}">
              <span class="st-slider-val" id="st-music-vol-val">${this.settings.musicVolume}%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _notificationsHTML() {
    return `
      <div class="st-section">
        <h2 class="st-section-title">Notifications</h2>
        <p class="st-section-desc">Manage notification preferences</p>

        <div class="st-setting-group">
          <div class="st-setting-row">
            <div class="st-setting-label">Enable Notifications</div>
            <div class="st-setting-control">
              <label class="st-toggle">
                <input type="checkbox" id="st-notif-enabled" ${this.settings.notificationsEnabled ? 'checked' : ''}>
                <span class="st-toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">Do Not Disturb</div>
            <div class="st-setting-control">
              <label class="st-toggle">
                <input type="checkbox" id="st-dnd" ${this.settings.doNotDisturb ? 'checked' : ''}>
                <span class="st-toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">Notification Duration (seconds)</div>
            <div class="st-setting-control">
              <input type="range" class="st-slider" id="st-notif-dur" min="2" max="15" value="${this.settings.notificationDuration}">
              <span class="st-slider-val" id="st-notif-dur-val">${this.settings.notificationDuration}s</span>
            </div>
          </div>

          <div class="st-setting-row st-setting-row-col">
            <div class="st-setting-label">Per-App Notifications</div>
            <div class="st-app-notifs">
              ${Object.entries(this.settings.appNotifications).map(([app, enabled]) =>
                `<div class="st-app-notif-row">
                  <span>${app}</span>
                  <label class="st-toggle st-toggle-sm">
                    <input type="checkbox" data-app-notif="${app}" ${enabled ? 'checked' : ''}>
                    <span class="st-toggle-slider"></span>
                  </label>
                </div>`
              ).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _shortcutsHTML() {
    return `
      <div class="st-section">
        <h2 class="st-section-title">Keyboard Shortcuts</h2>
        <p class="st-section-desc">View and customize keyboard shortcuts</p>

        <div class="st-shortcuts-list">
          ${Object.entries(this.settings.shortcuts).map(([action, shortcut]) =>
            `<div class="st-shortcut-row">
              <span class="st-shortcut-action">${action}</span>
              <span class="st-shortcut-key">
                ${shortcut.split('+').map(k => `<kbd>${k}</kbd>`).join(' + ')}
              </span>
            </div>`
          ).join('')}
        </div>
      </div>
    `;
  }

  _storageHTML() {
    // Calculate storage usage
    let totalUsed = 0;
    const appUsage = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key.startsWith('nexus:')) continue;
      const value = localStorage.getItem(key);
      const bytes = (key + value).length * 2; // UTF-16
      totalUsed += bytes;
      const ns = key.split(':')[1] || 'system';
      appUsage[ns] = (appUsage[ns] || 0) + bytes;
    }

    return `
      <div class="st-section">
        <h2 class="st-section-title">Storage</h2>
        <p class="st-section-desc">Manage data storage and cache</p>

        <div class="st-storage-overview">
          <div class="st-storage-bar-container">
            <div class="st-storage-bar" style="width:${Math.min((totalUsed / 5242880) * 100, 100)}%"></div>
          </div>
          <div class="st-storage-info">
            <span>${this._formatBytes(totalUsed)} used</span>
            <span>~5 MB available (localStorage limit)</span>
          </div>
        </div>

        <div class="st-setting-group">
          <div class="st-setting-label" style="margin-bottom:8px">Storage by App</div>
          ${Object.entries(appUsage).sort((a, b) => b[1] - a[1]).map(([app, bytes]) =>
            `<div class="st-storage-app">
              <div class="st-storage-app-info">
                <span class="st-storage-app-name">${app}</span>
                <span class="st-storage-app-size">${this._formatBytes(bytes)}</span>
              </div>
              <div class="st-storage-app-bar">
                <div class="st-storage-app-fill" style="width:${(bytes / totalUsed * 100).toFixed(1)}%"></div>
              </div>
              <button class="st-storage-clear-btn" data-clear-app="${app}">Clear</button>
            </div>`
          ).join('')}
        </div>
      </div>
    `;
  }

  _privacyHTML() {
    return `
      <div class="st-section">
        <h2 class="st-section-title">Privacy & Data</h2>
        <p class="st-section-desc">Manage your data and privacy settings</p>

        <div class="st-setting-group">
          <div class="st-setting-row">
            <div class="st-setting-label">
              Clear App Data
              <div class="st-setting-hint">Remove all cached application data</div>
            </div>
            <div class="st-setting-control">
              <button class="st-btn st-btn-warn" id="st-clear-apps">Clear App Data</button>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">
              Clear Chat Histories
              <div class="st-setting-hint">Remove all saved conversations</div>
            </div>
            <div class="st-setting-control">
              <button class="st-btn st-btn-warn" id="st-clear-chats">Clear Chats</button>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">
              Export All Data
              <div class="st-setting-hint">Download a backup of all NEXUS data</div>
            </div>
            <div class="st-setting-control">
              <button class="st-btn" id="st-export-data">Export Data</button>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">
              Import Data
              <div class="st-setting-hint">Restore from a previous backup</div>
            </div>
            <div class="st-setting-control">
              <button class="st-btn" id="st-import-data">Import Data</button>
            </div>
          </div>

          <div class="st-setting-row">
            <div class="st-setting-label">
              Reset All Settings
              <div class="st-setting-hint">Restore all settings to defaults. This cannot be undone.</div>
            </div>
            <div class="st-setting-control">
              <button class="st-btn st-btn-danger" id="st-reset-all">Reset Everything</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _aboutHTML() {
    const uptime = this._getUptime();
    return `
      <div class="st-section">
        <div class="st-about-header">
          <pre class="st-ascii-logo">
 ╔╗╔╔═╗╗  ╔╦╗╦  ╦╔═╗
 ║║║║╣ ╚╗╔╝║ ║  ║╚═╗
 ╝╚╝╚═╝ ╚╝ ╩╩═╝╩╚═╝</pre>
          <div class="st-about-info">
            <h2>NEXUS OS</h2>
            <div class="st-about-version">Version 4.2.1 "Neon Genesis"</div>
            <div class="st-about-build">Build 2026.09.01</div>
          </div>
        </div>

        <div class="st-setting-group">
          <div class="st-setting-row">
            <div class="st-setting-label">System</div>
            <div class="st-setting-value">NEXUS OS 4.2.1 — Neural Execution Unified System</div>
          </div>
          <div class="st-setting-row">
            <div class="st-setting-label">Browser</div>
            <div class="st-setting-value">${navigator.userAgent.split(' ').slice(-2).join(' ')}</div>
          </div>
          <div class="st-setting-row">
            <div class="st-setting-label">Screen Resolution</div>
            <div class="st-setting-value">${screen.width} × ${screen.height}</div>
          </div>
          <div class="st-setting-row">
            <div class="st-setting-label">Window Size</div>
            <div class="st-setting-value">${window.innerWidth} × ${window.innerHeight}</div>
          </div>
          <div class="st-setting-row">
            <div class="st-setting-label">Color Depth</div>
            <div class="st-setting-value">${screen.colorDepth}-bit</div>
          </div>
          <div class="st-setting-row">
            <div class="st-setting-label">Language</div>
            <div class="st-setting-value">${navigator.language}</div>
          </div>
          <div class="st-setting-row">
            <div class="st-setting-label">Platform</div>
            <div class="st-setting-value">${navigator.platform}</div>
          </div>
          <div class="st-setting-row">
            <div class="st-setting-label">Storage Used</div>
            <div class="st-setting-value">${this._getStorageUsed()}</div>
          </div>
        </div>

        <div class="st-about-lore">
          <p>NEXUS OS is a web-based operating system shell designed with a neon glassmorphism aesthetic. It represents the convergence of cyberpunk design philosophy and modern web technology.</p>
          <p>Built with pure vanilla JavaScript, CSS3, and HTML5. No frameworks. No dependencies. Just pure code.</p>
          <p class="st-about-quote">"In the space between silicon and light, NEXUS finds its purpose."</p>
        </div>

        <div class="st-about-credits">
          <div class="st-credits-title">Credits</div>
          <p>Designed and developed for the NEXUS project.</p>
          <p>© 2024-2026 NEXUS Corp. All rights reserved.</p>
          <p class="st-konami-hint">💡 Try the Konami code for a surprise...</p>
        </div>

        ${this.konamiActive ? '<div class="st-konami-overlay">🎮 KONAMI MODE ACTIVATED 🎮</div>' : ''}
      </div>
    `;
  }

  // ─── Tab Event Binding ──────────────────────────────────────────
  _bindTabEvents(tab) {
    const content = this.element.querySelector('#st-content');

    switch (tab) {
      case 'appearance':
        content.querySelectorAll('.st-theme-option').forEach(el => {
          el.addEventListener('click', () => {
            this.settings.theme = el.dataset.theme;
            content.querySelectorAll('.st-theme-option').forEach(t => t.classList.remove('st-theme-active'));
            el.classList.add('st-theme-active');
            this._emitThemeChange();
            this._saveSettings();
          });
        });

        const colorPicker = content.querySelector('#st-accent-color');
        if (colorPicker) {
          colorPicker.addEventListener('input', (e) => {
            this.settings.accentColor = e.target.value;
            this._saveSettings();
          });
        }

        content.querySelectorAll('.st-color-preset').forEach(el => {
          el.addEventListener('click', () => {
            this.settings.accentColor = el.dataset.color;
            const picker = content.querySelector('#st-accent-color');
            if (picker) picker.value = el.dataset.color;
            this._saveSettings();
          });
        });

        content.querySelectorAll('.st-wallpaper-option').forEach(el => {
          el.addEventListener('click', () => {
            this.settings.wallpaper = el.dataset.wp;
            content.querySelectorAll('.st-wallpaper-option').forEach(w => w.classList.remove('st-wp-active'));
            el.classList.add('st-wp-active');
            this._emitWallpaperChange();
            this._saveSettings();
          });
        });

        content.querySelectorAll('input[name="fontsize"]').forEach(r => {
          r.addEventListener('change', () => {
            this.settings.fontSize = r.value;
            this._saveSettings();
          });
        });

        const animToggle = content.querySelector('#st-animations');
        if (animToggle) animToggle.addEventListener('change', (e) => { this.settings.animations = e.target.checked; this._saveSettings(); });

        const transSlider = content.querySelector('#st-transparency');
        if (transSlider) transSlider.addEventListener('input', (e) => {
          this.settings.transparency = parseInt(e.target.value);
          content.querySelector('#st-transparency-val').textContent = e.target.value + '%';
          this._saveSettings();
        });

        const glowSlider = content.querySelector('#st-glow');
        if (glowSlider) glowSlider.addEventListener('input', (e) => {
          this.settings.glowIntensity = parseInt(e.target.value);
          content.querySelector('#st-glow-val').textContent = e.target.value + '%';
          this._saveSettings();
        });
        break;

      case 'sound':
        this._bindSlider(content, '#st-master-vol', '#st-master-vol-val', (v) => { this.settings.masterVolume = v; }, '%');
        this._bindToggle(content, '#st-sys-sounds', (v) => { this.settings.systemSounds = v; });
        this._bindToggle(content, '#st-notif-sounds', (v) => { this.settings.notificationSounds = v; });
        this._bindSlider(content, '#st-music-vol', '#st-music-vol-val', (v) => { this.settings.musicVolume = v; }, '%');
        break;

      case 'notifications':
        this._bindToggle(content, '#st-notif-enabled', (v) => { this.settings.notificationsEnabled = v; });
        this._bindToggle(content, '#st-dnd', (v) => { this.settings.doNotDisturb = v; });
        this._bindSlider(content, '#st-notif-dur', '#st-notif-dur-val', (v) => { this.settings.notificationDuration = v; }, 's');
        content.querySelectorAll('[data-app-notif]').forEach(cb => {
          cb.addEventListener('change', () => {
            this.settings.appNotifications[cb.dataset.appNotif] = cb.checked;
            this._saveSettings();
          });
        });
        break;

      case 'storage':
        content.querySelectorAll('[data-clear-app]').forEach(btn => {
          btn.addEventListener('click', () => {
            const app = btn.dataset.clearApp;
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key.startsWith(`nexus:${app}:`)) localStorage.removeItem(key);
            }
            this._switchTab('storage'); // Refresh
          });
        });
        break;

      case 'privacy':
        const clearApps = content.querySelector('#st-clear-apps');
        if (clearApps) clearApps.addEventListener('click', () => {
          if (confirm('Clear all application data? This cannot be undone.')) {
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key.startsWith('nexus:') && !key.includes('settings')) localStorage.removeItem(key);
            }
            this._notify('App data cleared');
          }
        });

        const clearChats = content.querySelector('#st-clear-chats');
        if (clearChats) clearChats.addEventListener('click', () => {
          if (confirm('Clear all chat histories?')) {
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key.includes('chat') || key.includes('conversation')) localStorage.removeItem(key);
            }
            this._notify('Chat histories cleared');
          }
        });

        const exportBtn = content.querySelector('#st-export-data');
        if (exportBtn) exportBtn.addEventListener('click', () => {
          const data = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('nexus:')) data[key] = localStorage.getItem(key);
          }
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'nexus-os-backup.json'; a.click();
          URL.revokeObjectURL(url);
          this._notify('Data exported');
        });

        const importBtn = content.querySelector('#st-import-data');
        if (importBtn) importBtn.addEventListener('click', () => {
          const input = document.createElement('input');
          input.type = 'file'; input.accept = '.json';
          input.addEventListener('change', () => {
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const data = JSON.parse(e.target.result);
                Object.entries(data).forEach(([key, val]) => localStorage.setItem(key, val));
                this._loadSettings();
                this._switchTab(this.activeTab);
                this._notify('Data imported successfully');
              } catch (err) {
                this._notify('Import failed: invalid file');
              }
            };
            reader.readAsText(input.files[0]);
          });
          input.click();
        });

        const resetBtn = content.querySelector('#st-reset-all');
        if (resetBtn) resetBtn.addEventListener('click', () => {
          if (confirm('⚠ RESET ALL SETTINGS? This will restore all NEXUS settings to factory defaults and cannot be undone.')) {
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key.startsWith('nexus:')) localStorage.removeItem(key);
            }
            location.reload();
          }
        });
        break;
    }
  }

  _bindSlider(content, sliderId, valId, setter, suffix) {
    const slider = content.querySelector(sliderId);
    const val = content.querySelector(valId);
    if (!slider) return;
    slider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      setter(v);
      if (val) val.textContent = v + (suffix || '');
      this._saveSettings();
    });
  }

  _bindToggle(content, toggleId, setter) {
    const toggle = content.querySelector(toggleId);
    if (!toggle) return;
    toggle.addEventListener('change', (e) => {
      setter(e.target.checked);
      this._saveSettings();
    });
  }

  // ─── Event Emission ─────────────────────────────────────────────
  _emitThemeChange() {
    try {
      if (typeof NexusEventBus !== 'undefined') {
        const bus = NexusEventBus.getInstance ? NexusEventBus.getInstance() : null;
        if (bus) bus.emit('system:theme-change', { theme: this.settings.theme, accent: this.settings.accentColor });
      }
    } catch (e) {}
  }

  _emitWallpaperChange() {
    try {
      if (typeof NexusEventBus !== 'undefined') {
        const bus = NexusEventBus.getInstance ? NexusEventBus.getInstance() : null;
        if (bus) bus.emit('system:wallpaper-change', { wallpaper: this.settings.wallpaper });
      }
    } catch (e) {}
  }

  _notify(msg) {
    try {
      if (typeof NexusEventBus !== 'undefined') {
        const bus = NexusEventBus.getInstance ? NexusEventBus.getInstance() : null;
        if (bus) bus.emit('system:notification', { title: 'Settings', body: msg });
      }
    } catch (e) {}
  }

  // ─── Konami Code ────────────────────────────────────────────────
  _activateKonami() {
    this.element.classList.toggle('st-konami-mode', this.konamiActive);
    if (this.activeTab === 'about') this._switchTab('about');
  }

  // ─── Persistence ────────────────────────────────────────────────
  _saveSettings() {
    try {
      localStorage.setItem('nexus:settings:config', JSON.stringify(this.settings));
    } catch (e) {}
  }

  _loadSettings() {
    try {
      const raw = localStorage.getItem('nexus:settings:config');
      if (raw) {
        const saved = JSON.parse(raw);
        this.settings = { ...this.settings, ...saved };
      }
    } catch (e) {}
  }

  // ─── Utilities ──────────────────────────────────────────────────
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  _getStorageUsed() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      total += (localStorage.key(i) + localStorage.getItem(localStorage.key(i))).length * 2;
    }
    return this._formatBytes(total);
  }

  _getUptime() {
    const perf = performance.now();
    const seconds = Math.floor(perf / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }

  // ─── Styles ─────────────────────────────────────────────────────
  _getStyles() {
    return `
      .nexus-settings {
        width: 100%; height: 100%;
        background: rgba(10, 5, 20, 0.96);
        border: 1px solid rgba(255, 0, 60, 0.2);
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 0 30px rgba(255, 0, 60, 0.1);
        font-family: 'Segoe UI', sans-serif;
      }

      .st-body { display: flex; height: 100%; }

      /* Sidebar */
      .st-sidebar {
        width: 190px; flex-shrink: 0;
        background: rgba(12, 6, 22, 0.9);
        border-right: 1px solid rgba(255, 0, 60, 0.12);
        padding: 12px 0;
      }
      .st-sidebar-title {
        display: flex; align-items: center; gap: 8px;
        padding: 6px 14px 14px; font-size: 15px; color: #ddd; font-weight: 600;
        border-bottom: 1px solid rgba(255, 0, 60, 0.08);
        margin-bottom: 8px;
      }
      .st-sidebar-item {
        padding: 8px 14px; font-size: 12px; color: #999;
        cursor: pointer; transition: all 0.15s;
      }
      .st-sidebar-item:hover { background: rgba(255, 0, 60, 0.06); color: #ddd; }
      .st-sidebar-active { background: rgba(255, 0, 60, 0.12) !important; color: #ff003c !important; border-left: 3px solid #ff003c; }

      /* Content */
      .st-content { flex: 1; overflow-y: auto; padding: 24px; }
      .st-content::-webkit-scrollbar { width: 4px; }
      .st-content::-webkit-scrollbar-thumb { background: rgba(255,0,60,0.3); border-radius: 2px; }

      .st-section { max-width: 600px; }
      .st-section-title { font-size: 20px; color: #eee; font-weight: 300; margin: 0 0 4px; }
      .st-section-desc { font-size: 12px; color: #888; margin: 0 0 20px; }

      .st-setting-group { margin-bottom: 20px; }
      .st-setting-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid rgba(255, 0, 60, 0.06);
      }
      .st-setting-row-col { flex-direction: column; align-items: flex-start; gap: 8px; }
      .st-setting-label { font-size: 13px; color: #ddd; }
      .st-setting-hint { font-size: 10px; color: #666; margin-top: 2px; }
      .st-setting-value { font-size: 12px; color: #888; text-align: right; max-width: 300px; word-break: break-all; }
      .st-setting-control { display: flex; align-items: center; gap: 8px; }

      /* Toggle */
      .st-toggle { position: relative; display: inline-block; width: 40px; height: 22px; }
      .st-toggle input { display: none; }
      .st-toggle-slider {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(255, 0, 60, 0.15); border-radius: 11px; cursor: pointer;
        transition: 0.2s;
      }
      .st-toggle-slider::before {
        content: ''; position: absolute; width: 18px; height: 18px;
        left: 2px; bottom: 2px; background: #888; border-radius: 50%;
        transition: 0.2s;
      }
      .st-toggle input:checked + .st-toggle-slider { background: rgba(255, 0, 60, 0.4); }
      .st-toggle input:checked + .st-toggle-slider::before { transform: translateX(18px); background: #ff003c; box-shadow: 0 0 6px rgba(255, 0, 60, 0.5); }

      .st-toggle-sm { width: 32px; height: 18px; }
      .st-toggle-sm .st-toggle-slider::before { width: 14px; height: 14px; }
      .st-toggle-sm input:checked + .st-toggle-slider::before { transform: translateX(14px); }

      /* Slider */
      .st-slider {
        width: 140px; height: 4px; -webkit-appearance: none; appearance: none;
        background: rgba(255, 0, 60, 0.15); border-radius: 2px; outline: none;
      }
      .st-slider::-webkit-slider-thumb {
        -webkit-appearance: none; width: 14px; height: 14px;
        background: #ff003c; border-radius: 50%; cursor: pointer;
        box-shadow: 0 0 6px rgba(255, 0, 60, 0.5);
      }
      .st-slider-val { font-size: 12px; color: #aaa; min-width: 30px; }

      /* Radio */
      .st-radio-group { display: flex; gap: 12px; }
      .st-radio { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #aaa; cursor: pointer; }
      .st-radio input { accent-color: #ff003c; }

      /* Color picker */
      .st-color-picker { width: 40px; height: 30px; border: none; cursor: pointer; background: transparent; }
      .st-color-presets { display: flex; gap: 4px; }
      .st-color-preset {
        width: 20px; height: 20px; border-radius: 50%; cursor: pointer;
        border: 2px solid transparent; transition: all 0.15s;
      }
      .st-color-preset:hover { border-color: #fff; transform: scale(1.15); }

      /* Theme options */
      .st-theme-options { display: flex; gap: 10px; }
      .st-theme-option { cursor: pointer; text-align: center; }
      .st-theme-preview {
        width: 80px; height: 50px; border-radius: 6px; border: 2px solid rgba(255, 0, 60, 0.2);
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        transition: all 0.15s; margin-bottom: 4px;
      }
      .st-theme-option span { font-size: 10px; color: #888; }
      .st-theme-active .st-theme-preview { border-color: #ff003c; box-shadow: 0 0 10px rgba(255, 0, 60, 0.3); }
      .st-theme-active span { color: #ff003c; }

      /* Wallpaper options */
      .st-wallpaper-options { display: flex; gap: 8px; flex-wrap: wrap; }
      .st-wallpaper-option { cursor: pointer; text-align: center; }
      .st-wp-preview {
        width: 60px; height: 40px; border-radius: 4px; border: 2px solid rgba(255, 0, 60, 0.15);
        margin-bottom: 3px; transition: all 0.15s;
      }
      .st-wp-default { background: radial-gradient(ellipse at center, rgba(255,0,60,0.1), rgba(0,0,0,0.9)); }
      .st-wp-grid { background: linear-gradient(rgba(255,0,60,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,60,0.1) 1px, transparent 1px); background-size: 8px 8px; background-color: #0a0010; }
      .st-wp-particles { background: radial-gradient(circle at 30% 40%, rgba(255,0,60,0.2), transparent 50%), radial-gradient(circle at 70% 60%, rgba(0,204,255,0.1), transparent 40%); background-color: #0a0010; }
      .st-wp-gradient { background: linear-gradient(135deg, #1a0008, #0a0020, #000a14); }
      .st-wp-solid { background: #0a0510; }
      .st-wallpaper-option span { font-size: 9px; color: #888; }
      .st-wp-active .st-wp-preview { border-color: #ff003c; box-shadow: 0 0 8px rgba(255,0,60,0.3); }
      .st-wp-active span { color: #ff003c; }

      /* App notifications */
      .st-app-notifs { width: 100%; }
      .st-app-notif-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 0; border-bottom: 1px solid rgba(255, 0, 60, 0.04);
        font-size: 12px; color: #aaa;
      }

      /* Shortcuts */
      .st-shortcuts-list { margin-top: 12px; }
      .st-shortcut-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 8px 0; border-bottom: 1px solid rgba(255, 0, 60, 0.06);
      }
      .st-shortcut-action { font-size: 13px; color: #ddd; }
      .st-shortcut-key kbd {
        background: rgba(255, 0, 60, 0.1); border: 1px solid rgba(255, 0, 60, 0.2);
        padding: 2px 6px; border-radius: 3px; font-size: 10px; color: #ddd;
        font-family: monospace;
      }

      /* Storage */
      .st-storage-overview { margin-bottom: 20px; }
      .st-storage-bar-container {
        height: 8px; background: rgba(255, 0, 60, 0.1);
        border-radius: 4px; overflow: hidden; margin-bottom: 6px;
      }
      .st-storage-bar {
        height: 100%; background: linear-gradient(90deg, #ff003c, #ff2d6b);
        border-radius: 4px; transition: width 0.3s;
      }
      .st-storage-info { display: flex; justify-content: space-between; font-size: 11px; color: #888; }

      .st-storage-app {
        display: flex; align-items: center; gap: 10px;
        padding: 6px 0; border-bottom: 1px solid rgba(255, 0, 60, 0.04);
      }
      .st-storage-app-info { flex: 1; min-width: 80px; }
      .st-storage-app-name { font-size: 12px; color: #ddd; }
      .st-storage-app-size { font-size: 10px; color: #888; display: block; }
      .st-storage-app-bar {
        flex: 1; height: 4px; background: rgba(255, 0, 60, 0.1);
        border-radius: 2px; overflow: hidden;
      }
      .st-storage-app-fill { height: 100%; background: #ff003c; border-radius: 2px; }
      .st-storage-clear-btn {
        padding: 2px 8px; font-size: 9px;
        background: rgba(255, 0, 60, 0.08); border: 1px solid rgba(255, 0, 60, 0.15);
        color: #aaa; border-radius: 3px; cursor: pointer;
      }
      .st-storage-clear-btn:hover { background: rgba(255, 0, 60, 0.2); color: #fff; }

      /* Buttons */
      .st-btn {
        padding: 6px 16px; font-size: 12px;
        background: rgba(255, 0, 60, 0.1); border: 1px solid rgba(255, 0, 60, 0.2);
        color: #ddd; border-radius: 4px; cursor: pointer;
        transition: all 0.15s;
      }
      .st-btn:hover { background: rgba(255, 0, 60, 0.2); }
      .st-btn-warn { border-color: rgba(255, 170, 0, 0.3); color: #ffaa00; }
      .st-btn-warn:hover { background: rgba(255, 170, 0, 0.15); }
      .st-btn-danger { border-color: rgba(255, 0, 60, 0.4); color: #ff003c; }
      .st-btn-danger:hover { background: rgba(255, 0, 60, 0.25); }

      /* About */
      .st-about-header {
        display: flex; align-items: center; gap: 20px;
        margin-bottom: 24px; padding-bottom: 16px;
        border-bottom: 1px solid rgba(255, 0, 60, 0.1);
      }
      .st-ascii-logo {
        font-family: monospace; font-size: 10px; color: #ff003c;
        text-shadow: 0 0 10px rgba(255, 0, 60, 0.5);
        margin: 0; white-space: pre; line-height: 1.2;
      }
      .st-about-info h2 { font-size: 24px; color: #eee; font-weight: 300; margin: 0; }
      .st-about-version { font-size: 14px; color: #ff003c; }
      .st-about-build { font-size: 11px; color: #666; }

      .st-about-lore {
        margin-top: 20px; padding: 16px;
        background: rgba(255, 0, 60, 0.03);
        border: 1px solid rgba(255, 0, 60, 0.06);
        border-radius: 8px;
      }
      .st-about-lore p { font-size: 12px; color: #888; margin: 0 0 8px; line-height: 1.6; }
      .st-about-quote { font-style: italic; color: #cc99ff !important; }

      .st-about-credits {
        margin-top: 16px; padding-top: 12px;
        border-top: 1px solid rgba(255, 0, 60, 0.06);
      }
      .st-credits-title { font-size: 12px; color: #ff003c; font-weight: 600; margin-bottom: 6px; }
      .st-about-credits p { font-size: 11px; color: #666; margin: 0 0 4px; }
      .st-konami-hint { color: #ffaa00 !important; font-size: 10px !important; margin-top: 8px !important; }

      .st-konami-overlay {
        margin-top: 12px; padding: 12px; text-align: center;
        background: linear-gradient(135deg, rgba(255,0,60,0.1), rgba(0,204,255,0.1));
        border: 1px solid rgba(255,0,60,0.3);
        border-radius: 8px; font-size: 14px; color: #fff;
        animation: st-konami-pulse 1s ease-in-out infinite alternate;
      }
      @keyframes st-konami-pulse {
        from { box-shadow: 0 0 10px rgba(255,0,60,0.2); }
        to { box-shadow: 0 0 30px rgba(0,204,255,0.3); }
      }

      .st-konami-mode {
        border-color: #00ccff !important;
        box-shadow: 0 0 40px rgba(0, 204, 255, 0.2) !important;
      }
    `;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.NexusSettings = NexusSettings;
}
