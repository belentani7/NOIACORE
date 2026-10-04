/* ================================================================
   NEXUS OS — Window Manager
   ================================================================
   Complete window management system: create, close, minimize,
   maximize, drag, resize, focus, z-index, snap, animations.
   ================================================================ */

(function (global) {
  'use strict';

  // ============================================================
  // SECTION 1: WINDOW CLASS — Individual Window Instance
  // ============================================================

  class NxWindow {
    /**
     * @param {object} config
     * @param {string} config.id - Unique window ID
     * @param {string} config.title - Window title
     * @param {string} config.icon - SVG icon markup
     * @param {string} config.appId - Associated app ID
     * @param {string} config.pid - Process ID
     * @param {number} config.width - Initial width
     * @param {number} config.height - Initial height
     * @param {string} config.content - HTML content for body
     * @param {Function} [config.onClose] - Close callback
     */
    constructor(config) {
      this.id = config.id;
      this.title = config.title;
      this.icon = config.icon || '';
      this.appId = config.appId;
      this.pid = config.pid;
      this.onClose = config.onClose;

      // State
      this.focused = false;
      this.minimized = false;
      this.maximized = false;
      this.snapped = null; // null | 'left' | 'right'
      this.visible = true;

      // Position & size
      this.width = config.width || 680;
      this.height = config.height || 480;
      this.x = 0;
      this.y = 0;

      // Previous state (for restore from maximize/snap)
      this._prevState = null;

      // DOM element
      this.el = null;

      // Create the DOM
      this._createElement(config.content);
      this._centerOnScreen();
    }

    /**
     * Create the window DOM element
     * @param {string} content - HTML content
     * @private
     */
    _createElement(content) {
      const win = document.createElement('div');
      win.className = 'nx-window';
      win.id = this.id;
      win.dataset.appId = this.appId;
      win.setAttribute('role', 'dialog');
      win.setAttribute('aria-label', this.title);

      win.style.width = this.width + 'px';
      win.style.height = this.height + 'px';

      win.innerHTML = `
        <!-- Title bar -->
        <div class="nx-window-titlebar" data-window-drag="true">
          <div class="nx-window-icon">${this.icon}</div>
          <div class="nx-window-title">${this._escapeHtml(this.title)}</div>
          <div class="nx-window-controls">
            <button class="nx-win-btn nx-win-btn-minimize" data-window-action="minimize"
                    aria-label="Minimize" title="Minimize">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="2" y1="6" x2="10" y2="6"/>
              </svg>
            </button>
            <button class="nx-win-btn nx-win-btn-maximize" data-window-action="maximize"
                    aria-label="Maximize" title="Maximize">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="2" width="8" height="8" rx="1"/>
              </svg>
            </button>
            <button class="nx-win-btn nx-win-btn-close" data-window-action="close"
                    aria-label="Close" title="Close">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="2" y1="2" x2="10" y2="10"/>
                <line x1="10" y1="2" x2="2" y2="10"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="nx-window-body">${content || ''}</div>

        <!-- Resize handles -->
        <div class="nx-resize-handle nx-resize-n" data-resize="n"></div>
        <div class="nx-resize-handle nx-resize-s" data-resize="s"></div>
        <div class="nx-resize-handle nx-resize-e" data-resize="e"></div>
        <div class="nx-resize-handle nx-resize-w" data-resize="w"></div>
        <div class="nx-resize-handle nx-resize-ne" data-resize="ne"></div>
        <div class="nx-resize-handle nx-resize-nw" data-resize="nw"></div>
        <div class="nx-resize-handle nx-resize-se" data-resize="se"></div>
        <div class="nx-resize-handle nx-resize-sw" data-resize="sw"></div>
      `;

      this.el = win;
    }

    /**
     * Center window on screen
     * @private
     */
    _centerOnScreen() {
      const vw = window.innerWidth;
      const vh = window.innerHeight - 48; // account for taskbar
      this.x = Math.max(0, (vw - this.width) / 2);
      this.y = Math.max(0, (vh - this.height) / 2);

      // Add slight random offset so overlapping windows are visible
      this.x += (Math.random() - 0.5) * 40;
      this.y += (Math.random() - 0.5) * 30;

      this.x = Math.max(0, this.x);
      this.y = Math.max(0, this.y);

      this.el.style.left = this.x + 'px';
      this.el.style.top = this.y + 'px';
    }

    /**
     * Set window position
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y) {
      this.x = x;
      this.y = y;
      this.el.style.left = x + 'px';
      this.el.style.top = y + 'px';
    }

    /**
     * Set window size
     * @param {number} w
     * @param {number} h
     */
    setSize(w, h) {
      this.width = Math.max(320, w);
      this.height = Math.max(200, h);
      this.el.style.width = this.width + 'px';
      this.el.style.height = this.height + 'px';
    }

    /**
     * Focus this window
     */
    focus() {
      if (this.focused) return;
      this.focused = true;
      this.el.classList.add('focused');
    }

    /**
     * Unfocus this window
     */
    unfocus() {
      this.focused = false;
      this.el.classList.remove('focused');
    }

    /**
     * Minimize window
     */
    minimize() {
      if (this.minimized) return;
      this.minimized = true;
      this.visible = false;
      this.el.classList.add('minimizing');
      setTimeout(() => {
        this.el.style.display = 'none';
        this.el.classList.remove('minimizing');
      }, 300);
    }

    /**
     * Restore from minimized state
     */
    restore() {
      if (!this.minimized) return;
      this.minimized = false;
      this.visible = true;
      this.el.style.display = '';
      this.el.style.animation = 'none';
      // Force reflow
      void this.el.offsetHeight;
      this.el.style.animation = '';
      this.el.classList.add('anim-scale-in');
      setTimeout(() => this.el.classList.remove('anim-scale-in'), 250);
    }

    /**
     * Maximize window
     */
    maximize() {
      if (this.maximized) return;

      // Save previous state
      this._prevState = {
        x: this.x, y: this.y,
        width: this.width, height: this.height
      };

      this.maximized = true;
      this.snapped = null;
      this.el.classList.remove('snap-left', 'snap-right');
      this.el.classList.add('maximized', 'maximizing');
      setTimeout(() => this.el.classList.remove('maximizing'), 300);
    }

    /**
     * Restore from maximized state
     */
    restoreFromMaximize() {
      if (!this.maximized) return;

      this.maximized = false;
      this.el.classList.remove('maximized');
      this.el.classList.add('restoring');

      if (this._prevState) {
        this.setPosition(this._prevState.x, this._prevState.y);
        this.setSize(this._prevState.width, this._prevState.height);
        this._prevState = null;
      }

      setTimeout(() => this.el.classList.remove('restoring'), 300);
    }

    /**
     * Toggle maximize/restore
     */
    toggleMaximize() {
      this.maximized ? this.restoreFromMaximize() : this.maximize();
    }

    /**
     * Snap to left or right half
     * @param {'left'|'right'} side
     */
    snap(side) {
      if (this.snapped === side) {
        // Unsnap
        this.unsnap();
        return;
      }

      // Save state if not already snapped or maximized
      if (!this.snapped && !this.maximized) {
        this._prevState = {
          x: this.x, y: this.y,
          width: this.width, height: this.height
        };
      }

      this.maximized = false;
      this.el.classList.remove('maximized');
      this.snapped = side;
      this.el.classList.remove('snap-left', 'snap-right');
      this.el.classList.add(`snap-${side}`);
    }

    /**
     * Remove snap
     */
    unsnap() {
      if (!this.snapped) return;
      this.snapped = null;
      this.el.classList.remove('snap-left', 'snap-right');
      this.el.classList.add('restoring');

      if (this._prevState) {
        this.setPosition(this._prevState.x, this._prevState.y);
        this.setSize(this._prevState.width, this._prevState.height);
        this._prevState = null;
      }

      setTimeout(() => this.el.classList.remove('restoring'), 300);
    }

    /**
     * Set the window body content
     * @param {string} html
     */
    setContent(html) {
      const body = this.el.querySelector('.nx-window-body');
      if (body) body.innerHTML = html;
    }

    /**
     * Get the window body element
     * @returns {HTMLElement|null}
     */
    getBody() {
      return this.el ? this.el.querySelector('.nx-window-body') : null;
    }

    /**
     * Set window title
     * @param {string} title
     */
    setTitle(title) {
      this.title = title;
      const el = this.el.querySelector('.nx-window-title');
      if (el) el.textContent = title;
    }

    /**
     * Destroy the window (remove from DOM)
     */
    destroy() {
      this.el.classList.add('closing');
      setTimeout(() => {
        if (this.el.parentNode) {
          this.el.parentNode.removeChild(this.el);
        }
      }, 200);
    }

    /**
     * Escape HTML helper
     * @private
     */
    _escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  }


  // ============================================================
  // SECTION 2: WINDOW MANAGER — Manages All Windows
  // ============================================================

  class WindowManagerClass {
    constructor() {
      /** @type {Map<string, NxWindow>} */
      this._windows = new Map();

      /** @type {string|null} ID of currently focused window */
      this._focusedId = null;

      /** Z-index counter */
      this._zCounter = 100;

      /** Container element */
      this._container = null;

      /** Drag state */
      this._drag = {
        active: false,
        windowId: null,
        startX: 0,
        startY: 0,
        origX: 0,
        origY: 0,
      };

      /** Resize state */
      this._resize = {
        active: false,
        windowId: null,
        direction: null,
        startX: 0,
        startY: 0,
        origX: 0,
        origY: 0,
        origW: 0,
        origH: 0,
      };

      /** Window ID counter */
      this._nextId = 1;
    }

    /**
     * Initialize the window manager
     */
    init() {
      this._container = document.getElementById('window-container');

      // Global mouse events for drag and resize
      document.addEventListener('mousemove', (e) => this._onMouseMove(e));
      document.addEventListener('mouseup', (e) => this._onMouseUp(e));

      // Touch support
      document.addEventListener('touchmove', (e) => {
        if (this._drag.active || this._resize.active) {
          const touch = e.touches[0];
          this._onMouseMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {} });
        }
      }, { passive: false });

      document.addEventListener('touchend', (e) => {
        this._onMouseUp(e);
      });

      console.log('[WindowManager] Initialized');
    }

    /**
     * Create a new window
     * @param {object} config
     * @returns {NxWindow}
     */
    createWindow(config) {
      const id = 'win_' + this._nextId++;

      const win = new NxWindow({
        id,
        title: config.title || 'Untitled',
        icon: config.icon || '',
        appId: config.appId || 'unknown',
        pid: config.pid || '',
        width: config.width || 680,
        height: config.height || 480,
        content: config.content || '',
        onClose: config.onClose,
      });

      // Append to container
      this._container.appendChild(win.el);

      // Store in map
      this._windows.set(id, win);

      // Focus this window
      this.focusWindow(id);

      // Bind window events
      this._bindWindowEvents(win);

      // Emit event
      NexusKernel.events.emit('window:create', id, config);

      return win;
    }

    /**
     * Close a window by ID
     * @param {string} id
     */
    closeWindow(id) {
      const win = this._windows.get(id);
      if (!win) return;

      // Call close callback
      if (win.onClose) {
        try { win.onClose(); } catch (e) { console.error('[Window] onClose error:', e); }
      }

      // Destroy DOM element
      win.destroy();

      // Remove from map
      this._windows.delete(id);

      // If this was focused, focus another
      if (this._focusedId === id) {
        this._focusedId = null;
        this._focusTopWindow();
      }

      // Update taskbar
      if (NexusKernel.taskbar) {
        NexusKernel.taskbar.removeApp(win.appId);
      }

      // Emit event
      NexusKernel.events.emit('window:close', id);
    }

    /**
     * Minimize a window
     * @param {string} id
     */
    minimizeWindow(id) {
      const win = this._windows.get(id);
      if (!win) return;
      win.minimize();
      if (this._focusedId === id) {
        this._focusedId = null;
        this._focusTopWindow();
      }
      NexusKernel.events.emit('window:minimize', id);
    }

    /**
     * Restore a minimized window
     * @param {string} id
     */
    restoreWindow(id) {
      const win = this._windows.get(id);
      if (!win) return;
      win.restore();
      this.focusWindow(id);
      NexusKernel.events.emit('window:restore', id);
    }

    /**
     * Maximize a window
     * @param {string} id
     */
    maximizeWindow(id) {
      const win = this._windows.get(id);
      if (!win) return;
      win.toggleMaximize();
      NexusKernel.events.emit('window:maximize', id, win.maximized);
    }

    /**
     * Focus a window
     * @param {string} id
     */
    focusWindow(id) {
      const win = this._windows.get(id);
      if (!win) return;

      // Unfocus current
      if (this._focusedId && this._focusedId !== id) {
        const current = this._windows.get(this._focusedId);
        if (current) current.unfocus();
      }

      // Focus new
      win.focus();
      this._focusedId = id;

      // Bring to front
      this._zCounter++;
      win.el.style.zIndex = this._zCounter;

      // Update taskbar
      if (NexusKernel.taskbar) {
        NexusKernel.taskbar.setActiveApp(win.appId);
      }

      NexusKernel.events.emit('window:focus', id);
    }

    /**
     * Get a window by app ID (first match)
     * @param {string} appId
     * @returns {NxWindow|undefined}
     */
    getWindowByAppId(appId) {
      for (const win of this._windows.values()) {
        if (win.appId === appId) return win;
      }
      return undefined;
    }

    /**
     * Get a window by its ID
     * @param {string} id
     * @returns {NxWindow|undefined}
     */
    getWindow(id) {
      return this._windows.get(id);
    }

    /**
     * Get all windows
     * @returns {NxWindow[]}
     */
    getAllWindows() {
      return Array.from(this._windows.values());
    }

    /**
     * Get the currently focused window
     * @returns {NxWindow|null}
     */
    getFocusedWindow() {
      return this._focusedId ? this._windows.get(this._focusedId) : null;
    }

    /**
     * Snap a window to left or right half
     * @param {string} id
     * @param {'left'|'right'} side
     */
    snapWindow(id, side) {
      const win = this._windows.get(id);
      if (!win) return;
      win.snap(side);
      NexusKernel.events.emit('window:snap', id, side);
    }

    /**
     * Minimize all windows (show desktop)
     */
    showDesktop() {
      for (const win of this._windows.values()) {
        if (!win.minimized && win.visible) {
          win.minimize();
        }
      }
      this._focusedId = null;
      NexusKernel.events.emit('window:showDesktop');
    }

    /**
     * Restore all minimized windows
     */
    restoreAll() {
      for (const win of this._windows.values()) {
        if (win.minimized) {
          win.restore();
        }
      }
    }

    /**
     * Focus the topmost visible window
     * @private
     */
    _focusTopWindow() {
      let topWin = null;
      let topZ = -1;

      for (const win of this._windows.values()) {
        if (!win.minimized && win.visible) {
          const z = parseInt(win.el.style.zIndex) || 0;
          if (z > topZ) {
            topZ = z;
            topWin = win;
          }
        }
      }

      if (topWin) {
        this.focusWindow(topWin.id);
      } else if (NexusKernel.taskbar) {
        NexusKernel.taskbar.setActiveApp(null);
      }
    }

    /**
     * Bind events for a specific window
     * @param {NxWindow} win
     * @private
     */
    _bindWindowEvents(win) {
      const el = win.el;

      // Focus on click
      el.addEventListener('mousedown', () => {
        this.focusWindow(win.id);
      });

      // Title bar drag
      const titlebar = el.querySelector('.nx-window-titlebar');
      if (titlebar) {
        titlebar.addEventListener('mousedown', (e) => {
          // Don't drag if clicking a button
          if (e.target.closest('.nx-win-btn')) return;
          // Don't drag if maximized or snapped
          if (win.maximized || win.snapped) return;

          this._drag.active = true;
          this._drag.windowId = win.id;
          this._drag.startX = e.clientX;
          this._drag.startY = e.clientY;
          this._drag.origX = win.x;
          this._drag.origY = win.y;

          el.style.transition = 'none';
          document.body.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';

          e.preventDefault();
        });

        // Double-click to maximize
        titlebar.addEventListener('dblclick', (e) => {
          if (e.target.closest('.nx-win-btn')) return;
          this.maximizeWindow(win.id);
        });

        // Touch drag
        titlebar.addEventListener('touchstart', (e) => {
          if (e.target.closest('.nx-win-btn')) return;
          if (win.maximized || win.snapped) return;

          const touch = e.touches[0];
          this._drag.active = true;
          this._drag.windowId = win.id;
          this._drag.startX = touch.clientX;
          this._drag.startY = touch.clientY;
          this._drag.origX = win.x;
          this._drag.origY = win.y;

          el.style.transition = 'none';
          this.focusWindow(win.id);
        }, { passive: true });
      }

      // Window control buttons
      el.querySelectorAll('[data-window-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.windowAction;
          switch (action) {
            case 'minimize': this.minimizeWindow(win.id); break;
            case 'maximize': this.maximizeWindow(win.id); break;
            case 'close': this.closeWindow(win.id); break;
          }
        });
      });

      // Resize handles
      el.querySelectorAll('[data-resize]').forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
          if (win.maximized || win.snapped) return;

          this._resize.active = true;
          this._resize.windowId = win.id;
          this._resize.direction = handle.dataset.resize;
          this._resize.startX = e.clientX;
          this._resize.startY = e.clientY;
          this._resize.origX = win.x;
          this._resize.origY = win.y;
          this._resize.origW = win.width;
          this._resize.origH = win.height;

          el.style.transition = 'none';
          document.body.style.userSelect = 'none';

          e.preventDefault();
          e.stopPropagation();
        });
      });
    }

    /**
     * Global mouse move handler
     * @param {MouseEvent} e
     * @private
     */
    _onMouseMove(e) {
      // Handle drag
      if (this._drag.active) {
        const win = this._windows.get(this._drag.windowId);
        if (!win) return;

        const dx = e.clientX - this._drag.startX;
        const dy = e.clientY - this._drag.startY;

        let newX = this._drag.origX + dx;
        let newY = this._drag.origY + dy;

        // Constrain to viewport
        newX = Math.max(-win.width + 100, Math.min(window.innerWidth - 100, newX));
        newY = Math.max(0, Math.min(window.innerHeight - 48 - 40, newY));

        win.setPosition(newX, newY);
        e.preventDefault && e.preventDefault();
      }

      // Handle resize
      if (this._resize.active) {
        const win = this._windows.get(this._resize.windowId);
        if (!win) return;

        const dx = e.clientX - this._resize.startX;
        const dy = e.clientY - this._resize.startY;
        const dir = this._resize.direction;

        let newX = this._resize.origX;
        let newY = this._resize.origY;
        let newW = this._resize.origW;
        let newH = this._resize.origH;

        // Calculate new dimensions based on resize direction
        if (dir.includes('e')) {
          newW = this._resize.origW + dx;
        }
        if (dir.includes('w')) {
          newW = this._resize.origW - dx;
          newX = this._resize.origX + dx;
        }
        if (dir.includes('s')) {
          newH = this._resize.origH + dy;
        }
        if (dir.includes('n')) {
          newH = this._resize.origH - dy;
          newY = this._resize.origY + dy;
        }

        // Minimum size constraints
        const minW = 320;
        const minH = 200;

        if (newW < minW) {
          if (dir.includes('w')) newX = this._resize.origX + (this._resize.origW - minW);
          newW = minW;
        }
        if (newH < minH) {
          if (dir.includes('n')) newY = this._resize.origY + (this._resize.origH - minH);
          newH = minH;
        }

        win.setPosition(newX, newY);
        win.setSize(newW, newH);
        e.preventDefault && e.preventDefault();
      }
    }

    /**
     * Global mouse up handler
     * @param {MouseEvent} e
     * @private
     */
    _onMouseUp(e) {
      // End drag
      if (this._drag.active) {
        const win = this._windows.get(this._drag.windowId);
        if (win) {
          win.el.style.transition = '';

          // Check for snap zones
          const mouseX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
          if (mouseX !== undefined) {
            if (mouseX <= 5) {
              win.snap('left');
            } else if (mouseX >= window.innerWidth - 5) {
              win.snap('right');
            }
            // Check top edge for maximize
            const mouseY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
            if (mouseY <= 5 && !win.maximized) {
              win.maximize();
            }
          }
        }

        this._drag.active = false;
        this._drag.windowId = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }

      // End resize
      if (this._resize.active) {
        const win = this._windows.get(this._resize.windowId);
        if (win) {
          win.el.style.transition = '';
        }

        this._resize.active = false;
        this._resize.windowId = null;
        this._resize.direction = null;
        document.body.style.userSelect = '';
      }
    }
  }


  // ============================================================
  // SECTION 3: INITIALIZE AND EXPOSE
  // ============================================================

  /** Create window manager instance */
  const windowManager = new WindowManagerClass();

  // Expose globally
  global.NexusWindowManager = windowManager;

  // Attach to kernel
  if (global.NexusKernel) {
    global.NexusKernel.windowManager = windowManager;
    windowManager.init();
  }

})(window);
