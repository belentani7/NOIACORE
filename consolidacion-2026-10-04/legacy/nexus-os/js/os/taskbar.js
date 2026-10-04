/* ================================================================
   NEXUS OS — Taskbar & Start Menu Controller
   ================================================================
   Manages the taskbar: open app buttons, start menu toggle,
   app grid population, search filtering, pinned/recent apps,
   system tray, workspace switcher, and hover previews.
   ================================================================ */

(function (global) {
  'use strict';

  // ============================================================
  // SECTION 1: TASKBAR CLASS
  // ============================================================

  class TaskbarClass {
    constructor() {
      /** @type {HTMLElement} */
      this._taskbarEl = null;
      /** @type {HTMLElement} */
      this._appsContainer = null;
      /** @type {HTMLElement} */
      this._startMenu = null;
      /** @type {HTMLElement} */
      this._startBtn = null;
      /** @type {HTMLElement} */
      this._startSearchInput = null;

      /** Is start menu visible? */
      this._startMenuOpen = false;

      /** Track open apps in taskbar: appId -> { element, app, count } */
      this._taskbarApps = new Map();

      /** Recently launched apps (for recent section) */
      this._recentApps = [];
      this._maxRecent = 8;

      /** Pinned app IDs */
      this._pinnedApps = [];
    }

    /**
     * Initialize the taskbar
     */
    init() {
      this._taskbarEl = document.getElementById('taskbar');
      this._appsContainer = document.getElementById('taskbar-apps');
      this._startMenu = document.getElementById('start-menu');
      this._startBtn = document.getElementById('start-btn');
      this._startSearchInput = document.getElementById('start-search-input');

      // Start button toggle
      if (this._startBtn) {
        this._startBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleStartMenu();
        });
      }

      // Close start menu when clicking outside
      document.addEventListener('click', (e) => {
        if (this._startMenuOpen) {
          if (!this._startMenu.contains(e.target) &&
              !this._startBtn.contains(e.target)) {
            this.hideStartMenu();
          }
        }
      });

      // Search button in taskbar
      const searchBtn = document.getElementById('taskbar-search-btn');
      if (searchBtn) {
        searchBtn.addEventListener('click', () => {
          if (NexusKernel.search) {
            NexusKernel.search.show();
          }
        });
      }

      // Show desktop button
      const showDesktopBtn = document.getElementById('tray-show-desktop');
      if (showDesktopBtn) {
        showDesktopBtn.addEventListener('click', () => {
          if (NexusKernel.windowManager) {
            // Check if all are minimized — if so, restore all
            const allMinimized = NexusKernel.windowManager.getAllWindows()
              .every(w => w.minimized);
            if (allMinimized) {
              NexusKernel.windowManager.restoreAll();
            } else {
              NexusKernel.windowManager.showDesktop();
            }
          }
        });
      }

      // Populate start menu app grid
      this._populateStartMenu();

      // Setup start menu search
      this._setupStartMenuSearch();

      // Setup pinned apps
      this._setupPinnedApps();

      console.log('[Taskbar] Initialized');
    }

    // ==========================================================
    // TASKBAR APP MANAGEMENT
    // ==========================================================

    /**
     * Add an app to the taskbar
     * @param {string} appId
     * @param {object} app - App definition from registry
     */
    addApp(appId, app) {
      if (!this._appsContainer) return;

      // Check if already exists — increment count
      if (this._taskbarApps.has(appId)) {
        const entry = this._taskbarApps.get(appId);
        entry.count++;
        entry.element.classList.add('has-window');
        return;
      }

      // Create taskbar button
      const btn = document.createElement('button');
      btn.className = 'taskbar-app-btn has-window';
      btn.dataset.appId = appId;
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('title', app.name);
      btn.innerHTML = `
        <span class="taskbar-app-icon">${app.icon}</span>
        <span class="taskbar-app-label">${this._escapeHtml(app.name)}</span>
      `;

      // Click to focus/minimize
      btn.addEventListener('click', () => {
        this._handleTaskbarAppClick(appId);
      });

      this._appsContainer.appendChild(btn);

      // Track
      this._taskbarApps.set(appId, { element: btn, app, count: 1 });

      // Add to recent
      this._addToRecent(appId);
    }

    /**
     * Remove an app from the taskbar
     * @param {string} appId
     */
    removeApp(appId) {
      const entry = this._taskbarApps.get(appId);
      if (!entry) return;

      entry.count--;
      if (entry.count <= 0) {
        // Remove from DOM
        if (entry.element.parentNode) {
          entry.element.classList.add('anim-fade-out');
          setTimeout(() => {
            if (entry.element.parentNode) {
              entry.element.parentNode.removeChild(entry.element);
            }
          }, 200);
        }
        this._taskbarApps.delete(appId);
      }
    }

    /**
     * Set the active app in the taskbar (highlighted)
     * @param {string|null} appId
     */
    setActiveApp(appId) {
      this._appsContainer?.querySelectorAll('.taskbar-app-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.appId === appId);
      });
    }

    /**
     * Handle clicking a taskbar app button
     * @param {string} appId
     * @private
     */
    _handleTaskbarAppClick(appId) {
      const wm = NexusKernel.windowManager;
      if (!wm) return;

      const win = wm.getWindowByAppId(appId);
      if (!win) return;

      if (win.minimized) {
        // Restore
        wm.restoreWindow(win.id);
        wm.focusWindow(win.id);
      } else if (win.focused) {
        // Minimize if already focused
        wm.minimizeWindow(win.id);
      } else {
        // Focus
        wm.focusWindow(win.id);
      }
    }

    // ==========================================================
    // START MENU MANAGEMENT
    // ==========================================================

    /**
     * Toggle start menu visibility
     */
    toggleStartMenu() {
      this._startMenuOpen ? this.hideStartMenu() : this.showStartMenu();
    }

    /**
     * Show the start menu
     */
    showStartMenu() {
      if (!this._startMenu) return;

      this._startMenu.classList.remove('hidden', 'closing');
      this._startMenuOpen = true;
      this._startBtn.classList.add('active');
      this._startBtn.setAttribute('aria-expanded', 'true');

      // Focus search input
      if (this._startSearchInput) {
        setTimeout(() => this._startSearchInput.focus(), 100);
      }

      NexusKernel.events.emit('startmenu:show');
    }

    /**
     * Hide the start menu
     */
    hideStartMenu() {
      if (!this._startMenu || !this._startMenuOpen) return;

      this._startMenu.classList.add('closing');
      this._startBtn.classList.remove('active');
      this._startBtn.setAttribute('aria-expanded', 'false');

      setTimeout(() => {
        this._startMenu.classList.add('hidden');
        this._startMenu.classList.remove('closing');
        this._startMenuOpen = false;

        // Clear search
        if (this._startSearchInput) {
          this._startSearchInput.value = '';
          this._resetStartMenuFilter();
        }
      }, 200);

      NexusKernel.events.emit('startmenu:hide');
    }

    /**
     * Populate the start menu app grid by category
     * @private
     */
    _populateStartMenu() {
      const categories = ['ai', 'music', 'games', 'media', 'tools', 'system'];

      for (const cat of categories) {
        const container = document.getElementById(`apps-${cat}`);
        if (!container) continue;

        const apps = NexusKernel.getAppsByCategory(cat);
        container.innerHTML = '';

        for (const app of apps) {
          const tile = this._createAppTile(app);
          container.appendChild(tile);
        }
      }
    }

    /**
     * Create an app tile element for the start menu
     * @param {object} app
     * @returns {HTMLElement}
     * @private
     */
    _createAppTile(app) {
      const tile = document.createElement('div');
      tile.className = 'start-app-tile';
      tile.dataset.appId = app.id;
      tile.dataset.name = app.name.toLowerCase();
      tile.dataset.category = app.category;
      tile.setAttribute('title', app.description || app.name);
      tile.innerHTML = `
        <div class="start-app-tile-icon">${app.icon}</div>
        <div class="start-app-tile-label">${this._escapeHtml(app.name)}</div>
      `;

      // Click to launch
      tile.addEventListener('click', () => {
        NexusKernel.launchApp(app.id);
        this.hideStartMenu();
      });

      return tile;
    }

    /**
     * Setup pinned apps in the start menu
     * @private
     */
    _setupPinnedApps() {
      const pinnedContainer = document.getElementById('start-pinned');
      if (!pinnedContainer) return;

      const pinnedApps = NexusKernel.apps.filter(a => a.pinned);
      pinnedContainer.innerHTML = '';

      for (const app of pinnedApps) {
        const tile = this._createAppTile(app);
        tile.classList.add('pinned-tile');
        pinnedContainer.appendChild(tile);
      }
    }

    /**
     * Setup search filtering within the start menu
     * @private
     */
    _setupStartMenuSearch() {
      if (!this._startSearchInput) return;

      this._startSearchInput.addEventListener('input', () => {
        const query = this._startSearchInput.value.toLowerCase().trim();
        this._filterStartMenu(query);
      });

      // Enter key — launch first visible result
      this._startSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const firstVisible = this._startMenu?.querySelector('.start-app-tile:not([style*="display: none"])');
          if (firstVisible) {
            firstVisible.click();
          }
        }
      });
    }

    /**
     * Filter start menu apps based on search query
     * @param {string} query
     * @private
     */
    _filterStartMenu(query) {
      if (!this._startMenu) return;

      const allTiles = this._startMenu.querySelectorAll('.start-app-tile');
      const categories = this._startMenu.querySelectorAll('.start-category');

      if (!query) {
        this._resetStartMenuFilter();
        return;
      }

      // Show/hide tiles based on match
      let anyVisible = false;
      allTiles.forEach(tile => {
        const name = tile.dataset.name || '';
        const matches = name.includes(query);
        tile.style.display = matches ? '' : 'none';
        if (matches) anyVisible = true;
      });

      // Hide empty categories
      categories.forEach(cat => {
        const visibleTiles = cat.querySelectorAll('.start-app-tile:not([style*="display: none"])');
        cat.style.display = visibleTiles.length > 0 ? '' : 'none';
      });

      // Hide pinned section if searching
      const pinnedSection = this._startMenu.querySelector('.start-section');
      if (pinnedSection) {
        pinnedSection.style.display = query ? 'none' : '';
      }
    }

    /**
     * Reset start menu filter — show all
     * @private
     */
    _resetStartMenuFilter() {
      if (!this._startMenu) return;

      this._startMenu.querySelectorAll('.start-app-tile').forEach(tile => {
        tile.style.display = '';
      });

      this._startMenu.querySelectorAll('.start-category').forEach(cat => {
        cat.style.display = '';
      });

      const pinnedSection = this._startMenu.querySelector('.start-section');
      if (pinnedSection) {
        pinnedSection.style.display = '';
      }
    }

    // ==========================================================
    // RECENT APPS
    // ==========================================================

    /**
     * Add an app to the recent list
     * @param {string} appId
     * @private
     */
    _addToRecent(appId) {
      // Remove if already exists
      this._recentApps = this._recentApps.filter(id => id !== appId);
      // Add to front
      this._recentApps.unshift(appId);
      // Trim
      if (this._recentApps.length > this._maxRecent) {
        this._recentApps = this._recentApps.slice(0, this._maxRecent);
      }
    }

    /**
     * Get recent app IDs
     * @returns {string[]}
     */
    getRecentApps() {
      return [...this._recentApps];
    }

    // ==========================================================
    // UTILITY
    // ==========================================================

    /**
     * Escape HTML
     * @param {string} str
     * @returns {string}
     * @private
     */
    _escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  }


  // ============================================================
  // SECTION 2: WINDOW EVENT INTEGRATION
  // ============================================================

  /**
   * Listen for window events to update taskbar state
   */
  function setupWindowListeners() {
    const kernel = NexusKernel;

    // Window created — add to taskbar
    kernel.events.on('window:create', (winId, config) => {
      // Already handled in kernel.launchApp
    });

    // Window closed — remove from taskbar
    kernel.events.on('window:close', (winId) => {
      // Already handled in window manager
    });

    // Window focus — highlight in taskbar
    kernel.events.on('window:focus', (winId) => {
      const wm = kernel.windowManager;
      if (!wm) return;
      const win = wm.getWindow(winId);
      if (win) {
        taskbar.setActiveApp(win.appId);
      }
    });

    // Window minimize — update taskbar
    kernel.events.on('window:minimize', (winId) => {
      const wm = kernel.windowManager;
      if (!wm) return;
      const win = wm.getWindow(winId);
      if (win && win.focused) {
        // Clear active state
        const appsContainer = document.getElementById('taskbar-apps');
        if (appsContainer) {
          appsContainer.querySelectorAll('.taskbar-app-btn.active').forEach(btn => {
            btn.classList.remove('active');
          });
        }
      }
    });
  }


  // ============================================================
  // SECTION 3: INITIALIZE
  // ============================================================

  const taskbar = new TaskbarClass();

  // Expose globally
  global.NexusTaskbar = taskbar;

  // Attach to kernel and init when kernel is ready
  if (global.NexusKernel) {
    global.NexusKernel.taskbar = taskbar;

    // Defer init until DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        taskbar.init();
        setupWindowListeners();
      });
    } else {
      // DOM already loaded — init now (scripts are at bottom)
      taskbar.init();
      setupWindowListeners();
    }
  }

})(window);
