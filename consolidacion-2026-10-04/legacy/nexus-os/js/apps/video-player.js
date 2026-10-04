/**
 * NEXUS OS — Video Player
 * Full-featured video player with neon glassmorphism UI
 * Pure vanilla JS, no external dependencies
 */

class NexusVideoPlayer {
  constructor(container) {
    this.container = typeof container === 'string'
      ? document.querySelector(container) : container;
    this.videoEl = null;
    this.controlsEl = null;
    this.playlistEl = null;
    this.miniPlayerEl = null;
    this.isMini = false;
    this.isFullscreen = false;
    this.playlist = [];
    this.currentIndex = -1;
    this.recentVideos = JSON.parse(localStorage.getItem('nexus-video-recent') || '[]');
    this.isDragging = false;
    this.hideControlsTimer = null;
    this.shortcutsBound = false;

    // Filter state
    this.filters = { brightness: 100, contrast: 100, saturation: 100, hue: 0 };

    // Overlay effects
    this.overlays = { scanlines: false, vignette: false, chromatic: false };

    // Subtitle state
    this.subtitleTrack = null;
    this.subtitleDisplay = null;

    this._boundKeyHandler = this._onKeyDown.bind(this);
    this._boundMouseMove = this._onMouseMove.bind(this);
  }

  render() {
    this.container.innerHTML = '';
    this._injectStyles();
    this._buildUI();
    this._bindEvents();
    document.addEventListener('keydown', this._boundKeyHandler);
    this.shortcutsBound = true;
  }

  destroy() {
    if (this.videoEl) {
      this.videoEl.pause();
      this.videoEl.src = '';
    }
    if (this.shortcutsBound) {
      document.removeEventListener('keydown', this._boundKeyHandler);
    }
    if (this.miniPlayerEl) {
      this.miniPlayerEl.remove();
    }
    clearTimeout(this.hideControlsTimer);
    this.container.innerHTML = '';
  }

  /* ─── STYLES ─── */
  _injectStyles() {
    if (document.getElementById('nexus-video-player-styles')) return;
    const style = document.createElement('style');
    style.id = 'nexus-video-player-styles';
    style.textContent = `
      .nvp-root {
        display: flex; height: 100%; background: #0a0a0f;
        font-family: 'Segoe UI', system-ui, sans-serif; color: #e0e0e0;
        position: relative; overflow: hidden;
      }
      .nvp-main { flex: 1; display: flex; flex-direction: column; position: relative; min-width: 0; }
      .nvp-video-area {
        flex: 1; position: relative; display: flex; align-items: center;
        justify-content: center; background: #000; overflow: hidden; cursor: none;
      }
      .nvp-video-area.show-cursor { cursor: default; }
      .nvp-video-area video {
        max-width: 100%; max-height: 100%; width: 100%; height: 100%;
        object-fit: contain;
      }
      .nvp-subtitle-overlay {
        position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
        padding: 6px 16px; background: rgba(0,0,0,0.75); border-radius: 4px;
        color: #fff; font-size: 16px; text-align: center; max-width: 80%;
        pointer-events: none; display: none; z-index: 5;
      }
      .nvp-subtitle-overlay.visible { display: block; }

      /* Overlay effects */
      .nvp-scanlines {
        position: absolute; inset: 0; pointer-events: none; z-index: 3;
        background: repeating-linear-gradient(
          0deg, transparent, transparent 2px,
          rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px
        );
        display: none;
      }
      .nvp-scanlines.active { display: block; }
      .nvp-vignette {
        position: absolute; inset: 0; pointer-events: none; z-index: 3;
        background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%);
        display: none;
      }
      .nvp-vignette.active { display: block; }
      .nvp-chromatic {
        position: absolute; inset: 0; pointer-events: none; z-index: 3;
        mix-blend-mode: screen; display: none;
      }
      .nvp-chromatic.active { display: block; }

      /* Drop overlay */
      .nvp-drop-overlay {
        position: absolute; inset: 0; background: rgba(255,0,60,0.15);
        border: 3px dashed #ff003c; display: none; align-items: center;
        justify-content: center; z-index: 20; font-size: 22px; color: #ff003c;
        backdrop-filter: blur(8px);
      }
      .nvp-drop-overlay.active { display: flex; }

      /* Controls */
      .nvp-controls {
        position: absolute; bottom: 0; left: 0; right: 0;
        background: linear-gradient(transparent, rgba(10,10,15,0.95));
        padding: 20px 16px 12px; z-index: 10; transition: opacity 0.3s;
        opacity: 0;
      }
      .nvp-video-area.show-cursor .nvp-controls,
      .nvp-controls:hover { opacity: 1; }
      .nvp-controls.force-visible { opacity: 1; }

      .nvp-progress-wrap {
        width: 100%; height: 6px; background: rgba(255,255,255,0.1);
        border-radius: 3px; cursor: pointer; position: relative; margin-bottom: 10px;
        transition: height 0.15s;
      }
      .nvp-progress-wrap:hover { height: 10px; }
      .nvp-progress-buffered {
        position: absolute; top: 0; left: 0; height: 100%;
        background: rgba(255,255,255,0.15); border-radius: 3px;
      }
      .nvp-progress-filled {
        position: absolute; top: 0; left: 0; height: 100%;
        background: linear-gradient(90deg, #ff003c, #ff2d6b);
        border-radius: 3px; box-shadow: 0 0 10px #ff003c;
      }
      .nvp-progress-thumb {
        position: absolute; top: 50%; width: 14px; height: 14px;
        background: #ff003c; border-radius: 50%; transform: translate(-50%, -50%);
        box-shadow: 0 0 8px #ff003c; opacity: 0; transition: opacity 0.15s;
      }
      .nvp-progress-wrap:hover .nvp-progress-thumb { opacity: 1; }
      .nvp-progress-tooltip {
        position: absolute; top: -30px; transform: translateX(-50%);
        background: rgba(10,10,15,0.9); padding: 2px 8px; border-radius: 4px;
        font-size: 12px; color: #ff2d6b; pointer-events: none; display: none;
        border: 1px solid rgba(255,0,60,0.3);
      }

      .nvp-controls-row {
        display: flex; align-items: center; gap: 10px;
      }
      .nvp-btn {
        background: none; border: none; color: #ccc; cursor: pointer;
        padding: 6px; border-radius: 6px; font-size: 16px; display: flex;
        align-items: center; justify-content: center; transition: all 0.2s;
        min-width: 32px; min-height: 32px;
      }
      .nvp-btn:hover { color: #ff003c; background: rgba(255,0,60,0.1); }
      .nvp-btn.active { color: #ff003c; }
      .nvp-btn svg { width: 20px; height: 20px; fill: currentColor; }

      .nvp-time {
        font-size: 12px; color: #888; font-variant-numeric: tabular-nums;
        white-space: nowrap; user-select: none;
      }
      .nvp-time .current { color: #ff2d6b; }

      .nvp-volume-wrap {
        display: flex; align-items: center; gap: 4px;
      }
      .nvp-volume-slider {
        width: 0; overflow: hidden; transition: width 0.2s;
      }
      .nvp-volume-wrap:hover .nvp-volume-slider { width: 80px; }
      .nvp-volume-slider input[type="range"] {
        -webkit-appearance: none; width: 80px; height: 4px;
        background: rgba(255,255,255,0.15); border-radius: 2px; outline: none;
      }
      .nvp-volume-slider input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; width: 12px; height: 12px;
        background: #ff003c; border-radius: 50%; cursor: pointer;
        box-shadow: 0 0 6px #ff003c;
      }

      .nvp-speed-select {
        background: rgba(255,255,255,0.08); border: 1px solid rgba(255,0,60,0.2);
        color: #ccc; padding: 3px 6px; border-radius: 4px; font-size: 12px;
        cursor: pointer; outline: none;
      }
      .nvp-speed-select option { background: #1a1a2e; }

      .nvp-spacer { flex: 1; }

      /* Playlist sidebar */
      .nvp-sidebar {
        width: 280px; background: rgba(15,15,25,0.95);
        border-left: 1px solid rgba(255,0,60,0.15);
        display: flex; flex-direction: column; overflow: hidden;
        transition: width 0.3s;
      }
      .nvp-sidebar.collapsed { width: 0; border: none; }
      .nvp-sidebar-header {
        padding: 12px; border-bottom: 1px solid rgba(255,0,60,0.1);
        display: flex; align-items: center; justify-content: space-between;
        font-size: 14px; font-weight: 600; color: #ff2d6b;
      }
      .nvp-sidebar-tabs {
        display: flex; border-bottom: 1px solid rgba(255,0,60,0.1);
      }
      .nvp-sidebar-tab {
        flex: 1; padding: 8px; text-align: center; font-size: 12px;
        cursor: pointer; color: #666; border-bottom: 2px solid transparent;
        transition: all 0.2s; background: none; border-top: none;
        border-left: none; border-right: none;
      }
      .nvp-sidebar-tab.active { color: #ff003c; border-bottom-color: #ff003c; }
      .nvp-playlist-list {
        flex: 1; overflow-y: auto; padding: 8px;
      }
      .nvp-playlist-list::-webkit-scrollbar { width: 4px; }
      .nvp-playlist-list::-webkit-scrollbar-thumb { background: #ff003c33; border-radius: 2px; }

      .nvp-playlist-item {
        display: flex; gap: 8px; padding: 8px; border-radius: 8px;
        cursor: pointer; transition: all 0.2s; margin-bottom: 4px;
        border: 1px solid transparent;
      }
      .nvp-playlist-item:hover { background: rgba(255,0,60,0.08); }
      .nvp-playlist-item.active {
        background: rgba(255,0,60,0.12);
        border-color: rgba(255,0,60,0.3);
      }
      .nvp-playlist-thumb {
        width: 80px; height: 45px; background: #1a1a2e; border-radius: 4px;
        flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        overflow: hidden; font-size: 18px;
      }
      .nvp-playlist-thumb video {
        width: 100%; height: 100%; object-fit: cover;
      }
      .nvp-playlist-info { min-width: 0; flex: 1; }
      .nvp-playlist-name {
        font-size: 12px; color: #ddd; white-space: nowrap;
        overflow: hidden; text-overflow: ellipsis;
      }
      .nvp-playlist-duration { font-size: 11px; color: #666; margin-top: 2px; }
      .nvp-playlist-remove {
        opacity: 0; background: none; border: none; color: #ff003c;
        cursor: pointer; font-size: 14px; padding: 2px; transition: opacity 0.2s;
        align-self: flex-start;
      }
      .nvp-playlist-item:hover .nvp-playlist-remove { opacity: 1; }

      /* Recent list */
      .nvp-recent-item {
        padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;
        color: #888; transition: all 0.2s; margin-bottom: 2px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .nvp-recent-item:hover { background: rgba(255,0,60,0.08); color: #ddd; }

      /* Filter panel */
      .nvp-filter-panel {
        position: absolute; top: 10px; right: 10px; z-index: 15;
        background: rgba(15,15,25,0.92); backdrop-filter: blur(12px);
        border: 1px solid rgba(255,0,60,0.2); border-radius: 12px;
        padding: 16px; width: 240px; display: none;
      }
      .nvp-filter-panel.open { display: block; }
      .nvp-filter-title {
        font-size: 13px; color: #ff2d6b; margin-bottom: 12px; font-weight: 600;
      }
      .nvp-filter-row {
        display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
      }
      .nvp-filter-label { font-size: 11px; color: #888; width: 70px; }
      .nvp-filter-slider {
        flex: 1; -webkit-appearance: none; height: 3px;
        background: rgba(255,255,255,0.1); border-radius: 2px; outline: none;
      }
      .nvp-filter-slider::-webkit-slider-thumb {
        -webkit-appearance: none; width: 10px; height: 10px;
        background: #ff003c; border-radius: 50%; cursor: pointer;
      }
      .nvp-filter-val { font-size: 11px; color: #666; width: 30px; text-align: right; }

      .nvp-effects-row {
        display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;
        border-top: 1px solid rgba(255,0,60,0.1); padding-top: 10px;
      }
      .nvp-effect-toggle {
        font-size: 11px; padding: 4px 10px; border-radius: 12px;
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,0,60,0.15);
        color: #888; cursor: pointer; transition: all 0.2s;
      }
      .nvp-effect-toggle.active {
        background: rgba(255,0,60,0.2); color: #ff003c;
        border-color: #ff003c; box-shadow: 0 0 8px rgba(255,0,60,0.2);
      }

      /* Empty state */
      .nvp-empty {
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; height: 100%; gap: 16px; color: #555;
      }
      .nvp-empty-icon { font-size: 64px; opacity: 0.3; }
      .nvp-empty-text { font-size: 16px; }
      .nvp-empty-hint { font-size: 12px; color: #444; }
      .nvp-open-btn {
        padding: 10px 24px; background: rgba(255,0,60,0.15);
        border: 1px solid rgba(255,0,60,0.4); border-radius: 8px;
        color: #ff003c; cursor: pointer; font-size: 14px; transition: all 0.2s;
      }
      .nvp-open-btn:hover {
        background: rgba(255,0,60,0.25); box-shadow: 0 0 15px rgba(255,0,60,0.2);
      }

      /* Mini player */
      .nvp-mini-player {
        position: fixed; bottom: 80px; right: 20px; width: 320px;
        background: rgba(10,10,15,0.95); border: 1px solid rgba(255,0,60,0.3);
        border-radius: 12px; overflow: hidden; z-index: 9999;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(255,0,60,0.1);
        display: none;
      }
      .nvp-mini-player.active { display: block; }
      .nvp-mini-player video { width: 100%; display: block; }
      .nvp-mini-controls {
        display: flex; align-items: center; gap: 6px; padding: 6px 10px;
      }
      .nvp-mini-close {
        position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.6);
        border: none; color: #fff; width: 24px; height: 24px; border-radius: 50%;
        cursor: pointer; font-size: 14px; display: flex; align-items: center;
        justify-content: center;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .nvp-sidebar { width: 0; border: none; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ─── UI BUILD ─── */
  _buildUI() {
    const root = document.createElement('div');
    root.className = 'nvp-root';
    root.innerHTML = `
      <div class="nvp-main">
        <div class="nvp-video-area" data-nvp="videoArea">
          <div class="nvp-empty" data-nvp="empty">
            <div class="nvp-empty-icon">▶</div>
            <div class="nvp-empty-text">No video loaded</div>
            <div class="nvp-empty-hint">Drag & drop a video file or click below</div>
            <button class="nvp-open-btn" data-nvp="openBtn">Open Video File</button>
          </div>
          <video data-nvp="video" preload="metadata" style="display:none"></video>
          <div class="nvp-subtitle-overlay" data-nvp="subtitleDisplay"></div>
          <div class="nvp-scanlines" data-nvp="scanlines"></div>
          <div class="nvp-vignette" data-nvp="vignette"></div>
          <div class="nvp-chromatic" data-nvp="chromatic"></div>
          <div class="nvp-drop-overlay" data-nvp="dropOverlay">Drop video here</div>

          <div class="nvp-controls force-visible" data-nvp="controls">
            <div class="nvp-progress-wrap" data-nvp="progressWrap">
              <div class="nvp-progress-buffered" data-nvp="buffered"></div>
              <div class="nvp-progress-filled" data-nvp="progressFilled"></div>
              <div class="nvp-progress-thumb" data-nvp="progressThumb"></div>
              <div class="nvp-progress-tooltip" data-nvp="progressTooltip"></div>
            </div>
            <div class="nvp-controls-row">
              <button class="nvp-btn" data-nvp="playBtn" title="Play/Pause (Space)">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <button class="nvp-btn" data-nvp="prevBtn" title="Previous">
                <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
              </button>
              <button class="nvp-btn" data-nvp="nextBtn" title="Next">
                <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
              <div class="nvp-volume-wrap">
                <button class="nvp-btn" data-nvp="muteBtn" title="Mute (M)">
                  <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                </button>
                <div class="nvp-volume-slider">
                  <input type="range" min="0" max="1" step="0.01" value="1" data-nvp="volumeSlider">
                </div>
              </div>
              <span class="nvp-time">
                <span class="current" data-nvp="currentTime">0:00</span>
                <span> / </span>
                <span data-nvp="duration">0:00</span>
              </span>
              <div class="nvp-spacer"></div>
              <select class="nvp-speed-select" data-nvp="speedSelect" title="Playback Speed">
                <option value="0.25">0.25x</option>
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1" selected>1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="1.75">1.75x</option>
                <option value="2">2x</option>
                <option value="2.5">2.5x</option>
                <option value="3">3x</option>
              </select>
              <button class="nvp-btn" data-nvp="subtitleBtn" title="Subtitles">CC</button>
              <button class="nvp-btn" data-nvp="filterBtn" title="Filters">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </button>
              <button class="nvp-btn" data-nvp="pipBtn" title="Picture-in-Picture">
                <svg viewBox="0 0 24 24"><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/></svg>
              </button>
              <button class="nvp-btn" data-nvp="miniBtn" title="Mini Player">
                <svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7h7v5h-7z"/></svg>
              </button>
              <button class="nvp-btn" data-nvp="fsBtn" title="Fullscreen (F)">
                <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              </button>
              <button class="nvp-btn" data-nvp="sidebarToggle" title="Toggle Playlist">
                <svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
              </button>
            </div>
          </div>

          <!-- Filter Panel -->
          <div class="nvp-filter-panel" data-nvp="filterPanel">
            <div class="nvp-filter-title">Video Filters</div>
            <div class="nvp-filter-row">
              <span class="nvp-filter-label">Brightness</span>
              <input type="range" class="nvp-filter-slider" min="0" max="200" value="100" data-nvp="fBrightness">
              <span class="nvp-filter-val" data-nvp="fBrightnessVal">100</span>
            </div>
            <div class="nvp-filter-row">
              <span class="nvp-filter-label">Contrast</span>
              <input type="range" class="nvp-filter-slider" min="0" max="200" value="100" data-nvp="fContrast">
              <span class="nvp-filter-val" data-nvp="fContrastVal">100</span>
            </div>
            <div class="nvp-filter-row">
              <span class="nvp-filter-label">Saturation</span>
              <input type="range" class="nvp-filter-slider" min="0" max="200" value="100" data-nvp="fSaturation">
              <span class="nvp-filter-val" data-nvp="fSaturationVal">100</span>
            </div>
            <div class="nvp-filter-row">
              <span class="nvp-filter-label">Hue</span>
              <input type="range" class="nvp-filter-slider" min="0" max="360" value="0" data-nvp="fHue">
              <span class="nvp-filter-val" data-nvp="fHueVal">0°</span>
            </div>
            <div class="nvp-effects-row">
              <button class="nvp-effect-toggle" data-nvp="toggleScanlines">Scanlines</button>
              <button class="nvp-effect-toggle" data-nvp="toggleVignette">Vignette</button>
              <button class="nvp-effect-toggle" data-nvp="toggleChromatic">Chromatic</button>
            </div>
          </div>
        </div>
      </div>

      <div class="nvp-sidebar" data-nvp="sidebar">
        <div class="nvp-sidebar-header">
          <span>Library</span>
          <button class="nvp-btn" data-nvp="addBtn" title="Add to playlist" style="padding:4px;">
            <svg viewBox="0 0 24 24" style="width:16px;height:16px;"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </button>
        </div>
        <div class="nvp-sidebar-tabs">
          <button class="nvp-sidebar-tab active" data-nvp="tabPlaylist">Playlist</button>
          <button class="nvp-sidebar-tab" data-nvp="tabRecent">Recent</button>
        </div>
        <div class="nvp-playlist-list" data-nvp="playlistContainer"></div>
        <div class="nvp-playlist-list" data-nvp="recentContainer" style="display:none"></div>
      </div>

      <input type="file" accept="video/*" multiple style="display:none" data-nvp="fileInput">
      <input type="file" accept=".srt,.vtt" style="display:none" data-nvp="subtitleInput">
    `;
    this.container.appendChild(root);
    this.root = root;

    // Cache element refs
    this.els = {};
    root.querySelectorAll('[data-nvp]').forEach(el => {
      this.els[el.dataset.nvp] = el;
    });
    this.videoEl = this.els.video;

    // Mini player (outside root, in body)
    this._buildMiniPlayer();
  }

  _buildMiniPlayer() {
    const mini = document.createElement('div');
    mini.className = 'nvp-mini-player';
    mini.innerHTML = `
      <button class="nvp-mini-close" title="Close mini player">✕</button>
      <video></video>
      <div class="nvp-mini-controls">
        <button class="nvp-btn" data-mini="playBtn" style="padding:4px">
          <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <span class="nvp-time" data-mini="time" style="font-size:11px;flex:1">0:00</span>
        <button class="nvp-btn" data-mini="expandBtn" style="padding:4px" title="Expand">
          <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
        </button>
      </div>
    `;
    document.body.appendChild(mini);
    this.miniPlayerEl = mini;
    this.miniVideoEl = mini.querySelector('video');

    mini.querySelector('.nvp-mini-close').onclick = () => this._exitMiniPlayer();
    mini.querySelector('[data-mini="expandBtn"]').onclick = () => this._exitMiniPlayer();
    mini.querySelector('[data-mini="playBtn"]').onclick = () => {
      if (this.videoEl.paused) this.videoEl.play();
      else this.videoEl.pause();
    };
  }

  /* ─── EVENTS ─── */
  _bindEvents() {
    const e = this.els;
    const v = this.videoEl;

    // Open file
    e.openBtn.onclick = () => e.fileInput.click();
    e.addBtn.onclick = () => e.fileInput.click();
    e.fileInput.onchange = (ev) => this._handleFiles(ev.target.files);

    // Subtitle input
    e.subtitleInput.onchange = (ev) => this._loadSubtitle(ev.target.files[0]);

    // Play/Pause
    e.playBtn.onclick = () => this._togglePlay();
    e.videoArea.ondblclick = () => this._toggleFullscreen();
    e.videoArea.onclick = (ev) => {
      if (ev.target.closest('.nvp-controls') || ev.target.closest('.nvp-filter-panel')) return;
      if (v.src) this._togglePlay();
    };

    v.onplay = () => this._updatePlayBtn(true);
    v.onpause = () => this._updatePlayBtn(false);
    v.onended = () => this._onVideoEnded();
    v.ontimeupdate = () => this._onTimeUpdate();
    v.onloadedmetadata = () => this._onMetadataLoaded();
    v.onprogress = () => this._onBufferProgress();
    v.onvolumechange = () => this._onVolumeChange();

    // Progress bar
    e.progressWrap.onmousedown = (ev) => this._startSeek(ev);
    e.progressWrap.onmousemove = (ev) => this._showProgressTooltip(ev);
    e.progressWrap.onmouseleave = () => { e.progressTooltip.style.display = 'none'; };

    // Volume
    e.volumeSlider.oninput = (ev) => {
      v.volume = parseFloat(ev.target.value);
      v.muted = v.volume === 0;
    };
    e.muteBtn.onclick = () => { v.muted = !v.muted; };

    // Speed
    e.speedSelect.onchange = (ev) => { v.playbackRate = parseFloat(ev.target.value); };

    // Buttons
    e.prevBtn.onclick = () => this._playPrev();
    e.nextBtn.onclick = () => this._playNext();
    e.fsBtn.onclick = () => this._toggleFullscreen();
    e.pipBtn.onclick = () => this._togglePiP();
    e.miniBtn.onclick = () => this._enterMiniPlayer();
    e.sidebarToggle.onclick = () => e.sidebar.classList.toggle('collapsed');
    e.subtitleBtn.onclick = () => e.subtitleInput.click();
    e.filterBtn.onclick = () => e.filterPanel.classList.toggle('open');

    // Filter sliders
    ['Brightness', 'Contrast', 'Saturation', 'Hue'].forEach(name => {
      const key = name.toLowerCase();
      e['f' + name].oninput = (ev) => {
        this.filters[key] = parseInt(ev.target.value);
        e['f' + name + 'Val'].textContent = key === 'hue' ? ev.target.value + '°' : ev.target.value;
        this._applyFilters();
      };
    });

    // Effect toggles
    e.toggleScanlines.onclick = () => this._toggleOverlay('scanlines');
    e.toggleVignette.onclick = () => this._toggleOverlay('vignette');
    e.toggleChromatic.onclick = () => this._toggleOverlay('chromatic');

    // Sidebar tabs
    e.tabPlaylist.onclick = () => this._switchTab('playlist');
    e.tabRecent.onclick = () => this._switchTab('recent');

    // Drag and drop
    const area = e.videoArea;
    area.ondragover = (ev) => { ev.preventDefault(); e.dropOverlay.classList.add('active'); };
    area.ondragleave = () => e.dropOverlay.classList.remove('active');
    area.ondrop = (ev) => {
      ev.preventDefault();
      e.dropOverlay.classList.remove('active');
      this._handleFiles(ev.dataTransfer.files);
    };

    // Mouse move for controls auto-hide
    e.videoArea.addEventListener('mousemove', this._boundMouseMove);
  }

  _onMouseMove() {
    this.els.videoArea.classList.add('show-cursor');
    clearTimeout(this.hideControlsTimer);
    this.hideControlsTimer = setTimeout(() => {
      if (!this.videoEl.paused) {
        this.els.videoArea.classList.remove('show-cursor');
      }
    }, 3000);
  }

  /* ─── KEYBOARD ─── */
  _onKeyDown(ev) {
    if (!this.root || !this.container.contains(this.root)) return;
    if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT') return;

    switch (ev.code) {
      case 'Space':
        ev.preventDefault();
        this._togglePlay();
        break;
      case 'ArrowLeft':
        ev.preventDefault();
        this.videoEl.currentTime = Math.max(0, this.videoEl.currentTime - (ev.shiftKey ? 10 : 5));
        break;
      case 'ArrowRight':
        ev.preventDefault();
        this.videoEl.currentTime = Math.min(this.videoEl.duration, this.videoEl.currentTime + (ev.shiftKey ? 10 : 5));
        break;
      case 'ArrowUp':
        ev.preventDefault();
        this.videoEl.volume = Math.min(1, this.videoEl.volume + 0.05);
        this.els.volumeSlider.value = this.videoEl.volume;
        break;
      case 'ArrowDown':
        ev.preventDefault();
        this.videoEl.volume = Math.max(0, this.videoEl.volume - 0.05);
        this.els.volumeSlider.value = this.videoEl.volume;
        break;
      case 'KeyM':
        this.videoEl.muted = !this.videoEl.muted;
        break;
      case 'KeyF':
        this._toggleFullscreen();
        break;
      case 'KeyP':
        this._togglePiP();
        break;
      case 'Digit0':
        this.videoEl.currentTime = 0;
        break;
    }
    // Number keys 1-9 for percentage seek
    if (ev.code.startsWith('Digit') && !ev.ctrlKey && !ev.altKey) {
      const n = parseInt(ev.code.replace('Digit', ''));
      if (n >= 1 && n <= 9 && this.videoEl.duration) {
        this.videoEl.currentTime = this.videoEl.duration * (n / 10);
      }
    }
  }

  /* ─── FILE HANDLING ─── */
  _handleFiles(fileList) {
    const videoFiles = Array.from(fileList).filter(f => f.type.startsWith('video/'));
    if (videoFiles.length === 0) return;

    videoFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      this.playlist.push({ name: file.name, url, size: file.size, file });
    });

    if (this.currentIndex === -1) {
      this._playIndex(0);
    }
    this._renderPlaylist();
  }

  _playIndex(index) {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentIndex = index;
    const item = this.playlist[index];

    this.videoEl.src = item.url;
    this.videoEl.style.display = '';
    this.els.empty.style.display = 'none';
    this.videoEl.play().catch(() => {});

    // Add to recent
    this._addToRecent(item.name);
    this._renderPlaylist();
  }

  _onVideoEnded() {
    if (this.currentIndex < this.playlist.length - 1) {
      this._playNext();
    }
  }

  _playNext() {
    if (this.currentIndex < this.playlist.length - 1) {
      this._playIndex(this.currentIndex + 1);
    }
  }

  _playPrev() {
    if (this.currentIndex > 0) {
      this._playIndex(this.currentIndex - 1);
    } else if (this.videoEl) {
      this.videoEl.currentTime = 0;
    }
  }

  /* ─── PLAYBACK ─── */
  _togglePlay() {
    if (!this.videoEl.src) return;
    if (this.videoEl.paused) this.videoEl.play();
    else this.videoEl.pause();
  }

  _updatePlayBtn(playing) {
    const svg = this.els.playBtn.querySelector('svg');
    svg.innerHTML = playing
      ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'
      : '<path d="M8 5v14l11-7z"/>';
  }

  _onTimeUpdate() {
    const v = this.videoEl;
    if (!v.duration) return;
    const pct = (v.currentTime / v.duration) * 100;
    this.els.progressFilled.style.width = pct + '%';
    this.els.progressThumb.style.left = pct + '%';
    this.els.currentTime.textContent = this._formatTime(v.currentTime);

    // Mini player time
    const miniTime = this.miniPlayerEl?.querySelector('[data-mini="time"]');
    if (miniTime) miniTime.textContent = this._formatTime(v.currentTime);

    // Subtitle update
    this._updateSubtitle(v.currentTime);
  }

  _onMetadataLoaded() {
    this.els.duration.textContent = this._formatTime(this.videoEl.duration);
    this._generateThumbnail();
  }

  _onBufferProgress() {
    const v = this.videoEl;
    if (v.buffered.length > 0) {
      const end = v.buffered.end(v.buffered.length - 1);
      const pct = (end / v.duration) * 100;
      this.els.buffered.style.width = pct + '%';
    }
  }

  _onVolumeChange() {
    const v = this.videoEl;
    this.els.volumeSlider.value = v.muted ? 0 : v.volume;
    const svg = this.els.muteBtn.querySelector('svg');
    if (v.muted || v.volume === 0) {
      svg.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
    } else if (v.volume < 0.5) {
      svg.innerHTML = '<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>';
    } else {
      svg.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
    }
  }

  /* ─── SEEK ─── */
  _startSeek(ev) {
    this.isDragging = true;
    this._doSeek(ev);
    const onMove = (e) => this._doSeek(e);
    const onUp = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  _doSeek(ev) {
    const rect = this.els.progressWrap.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
    if (this.videoEl.duration) {
      this.videoEl.currentTime = pct * this.videoEl.duration;
    }
  }

  _showProgressTooltip(ev) {
    const rect = this.els.progressWrap.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
    if (this.videoEl.duration) {
      const time = pct * this.videoEl.duration;
      this.els.progressTooltip.textContent = this._formatTime(time);
      this.els.progressTooltip.style.left = (pct * 100) + '%';
      this.els.progressTooltip.style.display = 'block';
    }
  }

  /* ─── FULLSCREEN ─── */
  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.root.requestFullscreen().catch(() => {});
      this.isFullscreen = true;
    } else {
      document.exitFullscreen();
      this.isFullscreen = false;
    }
  }

  /* ─── PIP ─── */
  async _togglePiP() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (this.videoEl.src) {
        await this.videoEl.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP not supported:', e);
    }
  }

  /* ─── MINI PLAYER ─── */
  _enterMiniPlayer() {
    if (!this.videoEl.src || this.isMini) return;
    this.isMini = true;

    // Clone video element stream
    this.miniVideoEl.srcObject = this.videoEl.captureStream?.() || this.videoEl.mozCaptureStream?.();
    this.miniVideoEl.currentTime = this.videoEl.currentTime;
    if (!this.videoEl.paused) this.miniVideoEl.play().catch(() => {});

    this.root.style.display = 'none';
    this.miniPlayerEl.classList.add('active');
  }

  _exitMiniPlayer() {
    this.isMini = false;
    this.miniPlayerEl.classList.remove('active');
    this.miniVideoEl.pause();
    this.miniVideoEl.srcObject = null;
    this.root.style.display = '';
  }

  /* ─── FILTERS ─── */
  _applyFilters() {
    const f = this.filters;
    this.videoEl.style.filter =
      `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%) hue-rotate(${f.hue}deg)`;
  }

  _toggleOverlay(name) {
    this.overlays[name] = !this.overlays[name];
    const el = this.els[name === 'scanlines' ? 'scanlines' : name === 'vignette' ? 'vignette' : 'chromatic'];
    el.classList.toggle('active', this.overlays[name]);
    const btn = this.els['toggle' + name.charAt(0).toUpperCase() + name.slice(1)];
    btn.classList.toggle('active', this.overlays[name]);
  }

  /* ─── SUBTITLES ─── */
  _loadSubtitle(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      if (file.name.endsWith('.vtt')) {
        this._parseVTT(text);
      } else {
        this._parseSRT(text);
      }
    };
    reader.readAsText(file);
  }

  _parseSRT(text) {
    const blocks = text.trim().split(/\n\s*\n/);
    this.subtitleTrack = [];
    blocks.forEach(block => {
      const lines = block.trim().split('\n');
      if (lines.length < 3) return;
      const timeMatch = lines[1].match(
        /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
      );
      if (!timeMatch) return;
      const start = +timeMatch[1]*3600 + +timeMatch[2]*60 + +timeMatch[3] + +timeMatch[4]/1000;
      const end = +timeMatch[5]*3600 + +timeMatch[6]*60 + +timeMatch[7] + +timeMatch[8]/1000;
      const content = lines.slice(2).join('<br>');
      this.subtitleTrack.push({ start, end, text: content });
    });
  }

  _parseVTT(text) {
    const lines = text.split('\n');
    this.subtitleTrack = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      const timeMatch = line.match(
        /(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/
      );
      if (timeMatch) {
        const start = +timeMatch[1]*3600 + +timeMatch[2]*60 + +timeMatch[3] + +timeMatch[4]/1000;
        const end = +timeMatch[5]*3600 + +timeMatch[6]*60 + +timeMatch[7] + +timeMatch[8]/1000;
        const content = [];
        i++;
        while (i < lines.length && lines[i].trim() !== '') {
          content.push(lines[i].trim());
          i++;
        }
        this.subtitleTrack.push({ start, end, text: content.join('<br>') });
      }
      i++;
    }
  }

  _updateSubtitle(time) {
    if (!this.subtitleTrack) return;
    const cue = this.subtitleTrack.find(c => time >= c.start && time <= c.end);
    const el = this.els.subtitleDisplay;
    if (cue) {
      el.innerHTML = cue.text;
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
    }
  }

  /* ─── PLAYLIST UI ─── */
  _renderPlaylist() {
    const container = this.els.playlistContainer;
    container.innerHTML = '';
    this.playlist.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'nvp-playlist-item' + (idx === this.currentIndex ? ' active' : '');
      div.innerHTML = `
        <div class="nvp-playlist-thumb">▶</div>
        <div class="nvp-playlist-info">
          <div class="nvp-playlist-name" title="${this._escHtml(item.name)}">${this._escHtml(item.name)}</div>
          <div class="nvp-playlist-duration">${item.duration || '--:--'}</div>
        </div>
        <button class="nvp-playlist-remove" title="Remove">✕</button>
      `;
      div.onclick = (ev) => {
        if (ev.target.closest('.nvp-playlist-remove')) {
          this._removeFromPlaylist(idx);
          return;
        }
        this._playIndex(idx);
      };
      container.appendChild(div);
    });
    if (this.playlist.length === 0) {
      container.innerHTML = '<div style="text-align:center;color:#444;padding:20px;font-size:12px;">No videos in playlist</div>';
    }
  }

  _removeFromPlaylist(idx) {
    URL.revokeObjectURL(this.playlist[idx].url);
    this.playlist.splice(idx, 1);
    if (this.playlist.length === 0) {
      this.currentIndex = -1;
      this.videoEl.src = '';
      this.videoEl.style.display = 'none';
      this.els.empty.style.display = '';
    } else if (idx === this.currentIndex) {
      this._playIndex(Math.min(idx, this.playlist.length - 1));
    } else if (idx < this.currentIndex) {
      this.currentIndex--;
    }
    this._renderPlaylist();
  }

  _renderRecent() {
    const container = this.els.recentContainer;
    container.innerHTML = '';
    this.recentVideos.forEach(name => {
      const div = document.createElement('div');
      div.className = 'nvp-recent-item';
      div.textContent = name;
      div.title = name;
      container.appendChild(div);
    });
    if (this.recentVideos.length === 0) {
      container.innerHTML = '<div style="text-align:center;color:#444;padding:20px;font-size:12px;">No recent videos</div>';
    }
  }

  _switchTab(tab) {
    this.els.tabPlaylist.classList.toggle('active', tab === 'playlist');
    this.els.tabRecent.classList.toggle('active', tab === 'recent');
    this.els.playlistContainer.style.display = tab === 'playlist' ? '' : 'none';
    this.els.recentContainer.style.display = tab === 'recent' ? '' : 'none';
    if (tab === 'recent') this._renderRecent();
  }

  _addToRecent(name) {
    this.recentVideos = this.recentVideos.filter(n => n !== name);
    this.recentVideos.unshift(name);
    if (this.recentVideos.length > 50) this.recentVideos.pop();
    localStorage.setItem('nexus-video-recent', JSON.stringify(this.recentVideos));
  }

  /* ─── THUMBNAILS ─── */
  _generateThumbnail() {
    if (this.currentIndex < 0 || !this.videoEl.duration) return;
    const v = this.videoEl;
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d');

    // Seek to 10% of video to capture frame
    const origTime = v.currentTime;
    v.currentTime = Math.min(v.duration * 0.1, 5);
    v.addEventListener('seeked', function onSeeked() {
      v.removeEventListener('seeked', onSeeked);
      ctx.drawImage(v, 0, 0, 160, 90);
      v.currentTime = origTime;
      // Update thumbnail in playlist
      const items = document.querySelectorAll('.nvp-playlist-item');
      if (items[this.currentIndex]) {
        const thumb = items[this.currentIndex].querySelector('.nvp-playlist-thumb');
        thumb.innerHTML = `<img src="${canvas.toDataURL()}" style="width:100%;height:100%;object-fit:cover">`;
      }
    }.bind(this), { once: true });

    // Also update duration in playlist
    const item = this.playlist[this.currentIndex];
    if (item) {
      item.duration = this._formatTime(v.duration);
    }
  }

  /* ─── UTILS ─── */
  _formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  _escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NexusVideoPlayer;
}
window.NexusVideoPlayer = NexusVideoPlayer;
