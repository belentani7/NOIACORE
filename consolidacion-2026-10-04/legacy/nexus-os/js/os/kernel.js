/* ================================================================
   NEXUS OS — Kernel (Core Runtime)
   ================================================================
   Central orchestrator for the entire operating system shell.
   Manages processes, apps, windows, events, filesystem bridge,
   settings, notifications, clipboard, hotkeys, context menus,
   workspaces, snapping, dialogs, boot sequence, lock screen,
   system tray, and the global search index.
   ================================================================ */

(function (global) {
  'use strict';

  // ============================================================
  // SECTION 1: UTILITY HELPERS
  // ============================================================

  /** Generate a unique ID */
  const uid = () => 'nx_' + Math.random().toString(36).substr(2, 9);

  /** Clamp a number between min and max */
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  /** Debounce function */
  const debounce = (fn, ms) => {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  };

  /** Throttle function */
  const throttle = (fn, ms) => {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn(...args); }
    };
  };

  /** Deep clone */
  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

  /** Escape HTML */
  const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  /** Format time to HH:MM */
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  /** Format date */
  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  /** Format short date */
  const formatShortDate = (date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };


  // ============================================================
  // SECTION 2: EVENT BUS — Global pub/sub
  // ============================================================

  class EventBus {
    constructor() {
      /** @type {Map<string, Set<Function>>} */
      this._listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
      if (!this._listeners.has(event)) {
        this._listeners.set(event, new Set());
      }
      this._listeners.get(event).add(callback);
      return () => this.off(event, callback);
    }

    /**
     * Subscribe once
     * @param {string} event
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
      const wrapper = (...args) => {
        this.off(event, wrapper);
        callback(...args);
      };
      return this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event
     * @param {Function} callback
     */
    off(event, callback) {
      const set = this._listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this._listeners.delete(event);
      }
    }

    /**
     * Emit an event
     * @param {string} event
     * @param  {...any} args
     */
    emit(event, ...args) {
      const set = this._listeners.get(event);
      if (set) {
        for (const cb of set) {
          try { cb(...args); }
          catch (err) { console.error(`[EventBus] Error in "${event}" handler:`, err); }
        }
      }
    }

    /**
     * Get all registered event names
     * @returns {string[]}
     */
    eventNames() {
      return Array.from(this._listeners.keys());
    }

    /**
     * Remove all listeners, optionally for a specific event
     * @param {string} [event]
     */
    clear(event) {
      if (event) {
        this._listeners.delete(event);
      } else {
        this._listeners.clear();
      }
    }
  }


  // ============================================================
  // SECTION 3: APP REGISTRY — App definitions with metadata
  // ============================================================

  /**
   * Each app entry:
   * {
   *   id: string,         // unique identifier
   *   name: string,       // display name
   *   icon: string,       // SVG icon (inline markup)
   *   category: string,   // ai|music|games|media|tools|system
   *   handler: Function,  // function to launch the app
   *   pinned: boolean,    // show in pinned row
   *   singleton: boolean, // only one instance allowed
   *   description: string // short description
   * }
   */

  /** SVG icon shortcuts for common icons */
  const ICONS = {
    terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="4,17 10,11 4,5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
    files: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001.08 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1.08z"/></svg>',
    neural: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="20" height="12" rx="3"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="10" r="1" fill="currentColor"/><circle cx="18" cy="12" r="1" fill="currentColor"/><circle cx="16" cy="14" r="1" fill="currentColor"/><circle cx="14" cy="12" r="1" fill="currentColor"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>',
    browser: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
    database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12,2 2,7 12,12 22,7"/><polyline points="2,17 12,22 22,17"/><polyline points="2,12 12,17 22,12"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    command: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    headphones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    radio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></svg>',
    disc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    paint: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    puzzle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 01-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 10-3.214 3.214c.446.166.855.497.925.968a.979.979 0 01-.276.837l-1.61 1.61a2.404 2.404 0 01-1.705.707 2.402 2.402 0 01-1.704-.706l-1.568-1.568a1.026 1.026 0 00-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 11-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 00-.289-.877l-1.568-1.568A2.402 2.402 0 011.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 103.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0112 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 113.237 3.237c-.464.18-.894.527-.967 1.02z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>',
  };

  /**
   * Master app list — 30+ apps across 6 categories
   */
  const APP_REGISTRY = [
    // ---- AI & Mystic ----
    { id: 'tarot', name: 'Tarot Reader', icon: ICONS.neural, category: 'ai', pinned: true, singleton: false, description: '78-card tarot readings with spreads and interpretations' },
    { id: 'oracle', name: 'Oracle', icon: ICONS.database, category: 'ai', pinned: true, singleton: false, description: 'I Ching, Runes, Spirit Board, Magic 8-Ball divination' },
    { id: 'archetype-interpreter', name: 'Archetype Interpreter', icon: ICONS.eye, category: 'ai', pinned: false, singleton: false, description: 'Jungian archetype assessment with 36-question quiz' },
    { id: 'dream-analyzer', name: 'Dream Analyzer', icon: ICONS.book, category: 'ai', pinned: false, singleton: false, description: 'Dream journal and symbol analysis with 200+ meanings' },
    { id: 'song-writer', name: 'Song Writer', icon: ICONS.music, category: 'ai', pinned: false, singleton: false, description: 'AI-powered songwriting with lyrics, chords, and structure' },
    { id: 'ai-chat', name: 'AI Chat', icon: ICONS.chat, category: 'ai', pinned: false, singleton: false, description: 'Chat with 8 unique AI personalities' },
    { id: 'horoscope', name: 'Horoscope', icon: ICONS.star, category: 'ai', pinned: false, singleton: false, description: 'Zodiac readings, compatibility, and birth chart' },
    { id: 'numerology', name: 'Numerology', icon: ICONS.grid, category: 'ai', pinned: false, singleton: false, description: 'Life path, destiny, and name analysis' },

    // ---- Music & Audio ----
    { id: 'music-studio', name: 'Music Studio', icon: ICONS.headphones, category: 'music', pinned: true, singleton: true, description: 'FL Studio-style DAW with channel rack, piano roll, mixer' },
    { id: 'synth-lab', name: 'Synth Lab', icon: ICONS.activity, category: 'music', pinned: true, singleton: true, description: 'Virtual analog synthesizer with 3 oscillators and effects' },
    { id: 'drum-machine', name: 'Drum Machine', icon: ICONS.disc, category: 'music', pinned: false, singleton: true, description: 'Beat maker with 8 synthesized drums and 64 patterns' },
    { id: 'sequencer', name: 'Groove Box', icon: ICONS.grid, category: 'music', pinned: false, singleton: true, description: '8-track step sequencer with live mode' },
    { id: 'voice-recorder', name: 'Voice Recorder', icon: ICONS.mic, category: 'music', pinned: false, singleton: true, description: 'Record, trim, and apply effects to audio' },

    // ---- Games ----
    { id: 'escape-room', name: 'Escape Room', icon: ICONS.grid, category: 'games', pinned: true, singleton: true, description: '5-room cyberpunk escape with code and logic puzzles' },
    { id: 'terminal-hacker', name: 'Terminal Hacker', icon: ICONS.terminal, category: 'games', pinned: false, singleton: true, description: '10-level hacking simulation with fake terminal' },
    { id: 'neon-pong', name: 'Neon Pong', icon: ICONS.zap, category: 'games', pinned: false, singleton: true, description: 'Classic pong with neon trails and power-ups' },
    { id: 'memory-game', name: 'Memory Game', icon: ICONS.layers, category: 'games', pinned: false, singleton: true, description: 'Card matching with 5 themes and combo system' },
    { id: 'cyber-puzzle', name: 'Cyber Puzzle', icon: ICONS.puzzle, category: 'games', pinned: false, singleton: true, description: 'Sudoku, Nonogram, Minesweeper, 2048, Word Search' },
    { id: 'snake', name: 'Neon Snake', icon: ICONS.zap, category: 'games', pinned: false, singleton: true, description: 'Classic snake with gradient glow and power-ups' },
    { id: 'tetris', name: 'Neon Tetris', icon: ICONS.grid, category: 'games', pinned: false, singleton: true, description: 'Full SRS rotation with ghost piece and marathon mode' },
    { id: 'chess', name: 'Chess', icon: ICONS.grid, category: 'games', pinned: false, singleton: true, description: 'Full chess with minimax AI opponent (depth 3)' },
    { id: 'wordle', name: 'Wordle', icon: ICONS.text, category: 'games', pinned: false, singleton: true, description: '5-letter word guessing with 6 attempts and keyboard' },
    { id: 'hangman', name: 'Hangman', icon: ICONS.text, category: 'games', pinned: false, singleton: true, description: 'Classic hangman with word categories' },
    { id: 'trivia', name: 'Trivia', icon: ICONS.book, category: 'games', pinned: false, singleton: true, description: '100+ question quiz with categories and scoring' },
    { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', icon: ICONS.grid, category: 'games', pinned: false, singleton: true, description: 'Classic game vs unbeatable minimax AI' },
    { id: 'connect-four', name: 'Connect Four', icon: ICONS.grid, category: 'games', pinned: false, singleton: true, description: 'Drop discs with gravity physics vs AI opponent' },
    { id: 'battleship', name: 'Battleship', icon: ICONS.grid, category: 'games', pinned: false, singleton: true, description: 'Ship placement and guessing game vs AI' },
    { id: 'blackjack', name: 'Blackjack', icon: ICONS.grid, category: 'games', pinned: false, singleton: true, description: 'Card game with dealer AI and betting system' },
    { id: 'simon-says', name: 'Simon Says', icon: ICONS.grid, category: 'games', pinned: false, singleton: true, description: 'Memory sequence game with increasing difficulty' },
    { id: 'breakout', name: 'Breakout', icon: ICONS.zap, category: 'games', pinned: false, singleton: true, description: 'Classic brick breaker with paddle and ball physics' },
    { id: 'space-invaders', name: 'Space Invaders', icon: ICONS.zap, category: 'games', pinned: false, singleton: true, description: 'Classic arcade shooter with waves of aliens' },

    // ---- Media & Creative ----
    { id: 'video-player', name: 'Video Player', icon: ICONS.video, category: 'media', pinned: true, singleton: false, description: 'Video playback with filters and neon overlays' },
    { id: 'image-viewer', name: 'Image Viewer', icon: ICONS.image, category: 'media', pinned: true, singleton: false, description: 'View, edit, and apply filters to images' },
    { id: 'audio-visualizer', name: 'Audio Visualizer', icon: ICONS.activity, category: 'media', pinned: false, singleton: true, description: '12 visualization modes: bars, particles, galaxy, DNA helix' },
    { id: 'neon-photo-viewer', name: 'Neon Photo Frame', icon: ICONS.camera, category: 'media', pinned: false, singleton: false, description: 'Photo viewer with animated neon frame effects' },
    { id: 'glitch-art', name: 'Glitch Art', icon: ICONS.paint, category: 'media', pinned: false, singleton: true, description: '19 canvas effects: RGB shift, pixel sort, VHS, CRT' },
    { id: 'screen-recorder', name: 'Screen Recorder', icon: ICONS.film, category: 'media', pinned: false, singleton: true, description: 'Capture screen with audio and download as WebM' },
    { id: 'media-converter', name: 'Media Converter', icon: ICONS.download, category: 'media', pinned: false, singleton: true, description: 'Convert images between PNG, JPEG, WebP, BMP' },
    { id: 'qr-generator', name: 'QR Generator', icon: ICONS.grid, category: 'media', pinned: false, singleton: true, description: 'Generate QR codes from text, download PNG/SVG' },
    { id: 'meme-generator', name: 'Meme Generator', icon: ICONS.image, category: 'media', pinned: false, singleton: true, description: 'Add text to images, templates, drag-and-drop' },
    { id: 'pixel-art', name: 'Pixel Art', icon: ICONS.paint, category: 'media', pinned: false, singleton: true, description: 'Create pixel art with tools, layers, export' },
    { id: 'svg-editor', name: 'SVG Editor', icon: ICONS.code, category: 'media', pinned: false, singleton: true, description: 'Create/edit SVG with vector tools and shapes' },
    { id: 'ascii-art', name: 'ASCII Art', icon: ICONS.terminal, category: 'media', pinned: false, singleton: true, description: 'Convert images to ASCII art, save as .txt' },
    { id: 'gradient-maker', name: 'Gradient Maker', icon: ICONS.palette, category: 'media', pinned: false, singleton: true, description: 'Create CSS gradients with live preview and presets' },
    { id: 'color-palette', name: 'Color Palette', icon: ICONS.palette, category: 'media', pinned: false, singleton: true, description: 'Generate palettes, harmonies, contrast check, export' },
    { id: 'gif-maker', name: 'GIF Maker', icon: ICONS.film, category: 'media', pinned: false, singleton: true, description: 'Create animated GIFs from frames with LZW encoding' },

    // ---- Tools & Utilities ----
    { id: 'terminal', name: 'Terminal', icon: ICONS.terminal, category: 'tools', pinned: true, singleton: false, description: 'Command-line interface with 30+ built-in commands' },
    { id: 'file-explorer', name: 'File Explorer', icon: ICONS.files, category: 'tools', pinned: true, singleton: true, description: 'Browse virtual filesystem with drag-drop' },
    { id: 'code-editor', name: 'Code Editor', icon: ICONS.text, category: 'tools', pinned: false, singleton: false, description: 'Syntax highlighting for JS, HTML, CSS, Python' },
    { id: 'calculator', name: 'Calculator', icon: ICONS.calc, category: 'tools', pinned: true, singleton: true, description: 'Scientific calculator with graph mode and unit converter' },
    { id: 'notepad', name: 'Notepad', icon: ICONS.book, category: 'tools', pinned: false, singleton: false, description: 'Rich text notes with tags, search, and markdown' },
    { id: 'clock', name: 'Clock', icon: ICONS.grid, category: 'tools', pinned: false, singleton: true, description: 'Clock, world clock, alarm, stopwatch, pomodoro' },
    { id: 'weather', name: 'Weather', icon: ICONS.globe, category: 'tools', pinned: false, singleton: true, description: '5-day forecast with animated weather icons' },
    { id: 'paint', name: 'Paint', icon: ICONS.paint, category: 'tools', pinned: false, singleton: true, description: 'Drawing tool with layers, brushes, and neon glow' },

    // ---- System ----
    { id: 'settings', name: 'Settings', icon: ICONS.settings, category: 'system', pinned: true, singleton: true, description: 'System settings & preferences' },
    { id: 'system-monitor', name: 'System Monitor', icon: ICONS.cpu, category: 'system', pinned: false, singleton: true, description: 'CPU, memory, disk usage' },
    { id: 'process-manager', name: 'Process Manager', icon: ICONS.activity, category: 'system', pinned: false, singleton: true, description: 'Manage running processes' },
    { id: 'security', name: 'Security Center', icon: ICONS.shield, category: 'system', pinned: false, singleton: true, description: 'Security & firewall' },
    { id: 'about', name: 'About NEXUS', icon: ICONS.info, category: 'system', pinned: false, singleton: true, description: 'System information' },
  ];


  // ============================================================
  // SECTION 4: PROCESS MANAGER
  // ============================================================

  class ProcessManager {
    constructor(kernel) {
      this._kernel = kernel;
      /** @type {Map<string, {id: string, appId: string, status: string, startTime: number, data: any}>} */
      this._processes = new Map();
      this._nextPid = 1;
    }

    /**
     * Register a new process
     * @param {string} appId - Associated app ID
     * @param {object} [data] - Additional process data
     * @returns {string} Process ID
     */
    register(appId, data = {}) {
      const pid = 'pid_' + this._nextPid++;
      this._processes.set(pid, {
        id: pid,
        appId,
        status: 'running',
        startTime: Date.now(),
        data
      });
      this._kernel.events.emit('process:start', pid, appId);
      return pid;
    }

    /**
     * Stop a process
     * @param {string} pid
     */
    stop(pid) {
      const proc = this._processes.get(pid);
      if (proc) {
        proc.status = 'stopped';
        this._processes.delete(pid);
        this._kernel.events.emit('process:stop', pid, proc.appId);
      }
    }

    /**
     * Get a process by ID
     * @param {string} pid
     * @returns {object|undefined}
     */
    get(pid) {
      return this._processes.get(pid);
    }

    /**
     * List all running processes
     * @returns {Array}
     */
    list() {
      return Array.from(this._processes.values());
    }

    /**
     * Get process count
     * @returns {number}
     */
    get count() {
      return this._processes.size;
    }

    /**
     * Kill all processes for a given app ID
     * @param {string} appId
     */
    killByApp(appId) {
      for (const [pid, proc] of this._processes) {
        if (proc.appId === appId) {
          this.stop(pid);
        }
      }
    }
  }


  // ============================================================
  // SECTION 5: SETTINGS MANAGER
  // ============================================================

  class SettingsManager {
    constructor(kernel) {
      this._kernel = kernel;
      this._defaults = {
        theme: 'nexus-dark',
        accentColor: '#ff003c',
        wallpaper: 'grid',
        fontSize: 13,
        animations: true,
        sounds: true,
        notifications: true,
        volume: 75,
        brightness: 100,
        language: 'en',
        timezone: 'auto',
        dateFormat: 'locale',
        showSeconds: false,
        taskbarPosition: 'bottom',
        taskbarIconSize: 'medium',
        showDesktopIcons: true,
        snapWindows: true,
        multipleDesktops: true,
      };
      /** @type {object} */
      this._settings = {};
      this._load();
    }

    /**
     * Get a setting value
     * @param {string} key
     * @param {any} [fallback]
     * @returns {any}
     */
    get(key, fallback) {
      if (key in this._settings) return this._settings[key];
      if (key in this._defaults) return this._defaults[key];
      return fallback;
    }

    /**
     * Set a setting value
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {
      const old = this._settings[key];
      this._settings[key] = value;
      this._save();
      this._kernel.events.emit('settings:change', key, value, old);
    }

    /**
     * Get all settings
     * @returns {object}
     */
    getAll() {
      return { ...this._defaults, ...this._settings };
    }

    /**
     * Reset to defaults
     */
    reset() {
      this._settings = {};
      this._save();
      this._kernel.events.emit('settings:reset');
    }

    /**
     * Load settings from localStorage
     * @private
     */
    _load() {
      try {
        const raw = localStorage.getItem('nexus_settings');
        if (raw) {
          this._settings = JSON.parse(raw);
        }
      } catch (e) {
        console.warn('[Settings] Failed to load settings:', e);
        this._settings = {};
      }
    }

    /**
     * Save settings to localStorage
     * @private
     */
    _save() {
      try {
        localStorage.setItem('nexus_settings', JSON.stringify(this._settings));
      } catch (e) {
        console.warn('[Settings] Failed to save settings:', e);
      }
    }
  }


  // ============================================================
  // SECTION 6: NOTIFICATION SYSTEM
  // ============================================================

  class NotificationSystem {
    constructor(kernel) {
      this._kernel = kernel;
      /** @type {Array<{id: string, app: string, title: string, body: string, time: Date, read: boolean}>} */
      this._notifications = [];
      this._toastQueue = [];
      this._maxToasts = 5;
      this._toastDuration = 5000;
    }

    /**
     * Send a notification
     * @param {string} app - Source app name
     * @param {string} title - Notification title
     * @param {string} body - Notification body text
     * @param {string} [type='info'] - Type: info|success|warning|error
     * @returns {string} Notification ID
     */
    notify(app, title, body, type = 'info') {
      const id = uid();
      const notif = { id, app, title, body, time: new Date(), read: false, type };
      this._notifications.unshift(notif);

      // Update badge
      this._updateBadge();

      // Emit event
      this._kernel.events.emit('notification:new', notif);

      // Show toast
      this._showToast(notif);

      return id;
    }

    /**
     * Get all notifications
     * @returns {Array}
     */
    getAll() {
      return [...this._notifications];
    }

    /**
     * Get unread count
     * @returns {number}
     */
    get unreadCount() {
      return this._notifications.filter(n => !n.read).length;
    }

    /**
     * Mark a notification as read
     * @param {string} id
     */
    markRead(id) {
      const notif = this._notifications.find(n => n.id === id);
      if (notif) {
        notif.read = true;
        this._updateBadge();
        this._kernel.events.emit('notification:read', id);
      }
    }

    /**
     * Mark all as read
     */
    markAllRead() {
      this._notifications.forEach(n => n.read = true);
      this._updateBadge();
      this._kernel.events.emit('notification:allRead');
    }

    /**
     * Clear all notifications
     */
    clearAll() {
      this._notifications = [];
      this._updateBadge();
      this._kernel.events.emit('notification:clear');
    }

    /**
     * Remove a single notification
     * @param {string} id
     */
    remove(id) {
      this._notifications = this._notifications.filter(n => n.id !== id);
      this._updateBadge();
      this._kernel.events.emit('notification:remove', id);
    }

    /**
     * Update the notification badge in system tray
     * @private
     */
    _updateBadge() {
      const badge = document.getElementById('notif-badge');
      if (badge) {
        const count = this.unreadCount;
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.toggle('hidden', count === 0);
      }
    }

    /**
     * Show a toast notification
     * @param {object} notif
     * @private
     */
    _showToast(notif) {
      if (!this._kernel.settings.get('notifications')) return;

      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast toast-${notif.type}`;
      toast.dataset.id = notif.id;
      toast.innerHTML = `
        <div class="toast-icon">${this._getToastIcon(notif.type)}</div>
        <div class="toast-content">
          <div class="toast-title">${escapeHtml(notif.title)}</div>
          <div class="toast-message">${escapeHtml(notif.body)}</div>
        </div>
        <div class="toast-close" data-close="true">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
      `;

      // Click to dismiss
      toast.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) {
          this._removeToast(toast);
        }
      });

      container.appendChild(toast);

      // Auto-remove after duration
      const timer = setTimeout(() => {
        this._removeToast(toast);
      }, this._toastDuration);

      // Store timer reference
      toast._timer = timer;

      // Limit visible toasts
      const toasts = container.querySelectorAll('.toast');
      if (toasts.length > this._maxToasts) {
        this._removeToast(toasts[0]);
      }
    }

    /**
     * Remove a toast element with animation
     * @param {HTMLElement} toast
     * @private
     */
    _removeToast(toast) {
      if (!toast || !toast.parentNode) return;
      clearTimeout(toast._timer);
      toast.classList.add('removing');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }

    /**
     * Get icon SVG for toast type
     * @param {string} type
     * @returns {string}
     * @private
     */
    _getToastIcon(type) {
      switch (type) {
        case 'success':
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"/></svg>';
        case 'warning':
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
        case 'error':
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
        default:
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
      }
    }
  }


  // ============================================================
  // SECTION 7: CLIPBOARD MANAGER
  // ============================================================

  class ClipboardManager {
    constructor(kernel) {
      this._kernel = kernel;
      this._history = [];
      this._maxHistory = 20;
    }

    /**
     * Copy text to clipboard
     * @param {string} text
     */
    copy(text) {
      this._history.unshift({ text, time: Date.now() });
      if (this._history.length > this._maxHistory) {
        this._history.pop();
      }
      // Also write to system clipboard if available
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
      this._kernel.events.emit('clipboard:copy', text);
    }

    /**
     * Get the most recent clipboard content
     * @returns {string|null}
     */
    get() {
      return this._history.length > 0 ? this._history[0].text : null;
    }

    /**
     * Get clipboard history
     * @returns {Array}
     */
    getHistory() {
      return [...this._history];
    }

    /**
     * Clear clipboard history
     */
    clear() {
      this._history = [];
    }
  }


  // ============================================================
  // SECTION 8: KEYBOARD SHORTCUT SYSTEM
  // ============================================================

  class HotkeyManager {
    constructor(kernel) {
      this._kernel = kernel;
      /** @type {Map<string, {handler: Function, description: string}>} */
      this._hotkeys = new Map();
      this._setupListener();
    }

    /**
     * Register a global hotkey
     * @param {string} combo - Key combination (e.g., 'ctrl+k', 'alt+f4')
     * @param {Function} handler - Handler function
     * @param {string} [description] - Human-readable description
     */
    register(combo, handler, description = '') {
      const normalized = this._normalize(combo);
      this._hotkeys.set(normalized, { handler, description });
    }

    /**
     * Unregister a hotkey
     * @param {string} combo
     */
    unregister(combo) {
      this._hotkeys.delete(this._normalize(combo));
    }

    /**
     * List all registered hotkeys
     * @returns {Array<{combo: string, description: string}>}
     */
    list() {
      return Array.from(this._hotkeys.entries()).map(([combo, { description }]) => ({
        combo, description
      }));
    }

    /**
     * Normalize a key combo string
     * @param {string} combo
     * @returns {string}
     * @private
     */
    _normalize(combo) {
      return combo.toLowerCase()
        .replace(/\s+/g, '')
        .split('+')
        .sort()
        .join('+');
    }

    /**
     * Build combo string from keyboard event
     * @param {KeyboardEvent} e
     * @returns {string}
     * @private
     */
    _buildCombo(e) {
      const parts = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.altKey) parts.push('alt');
      if (e.shiftKey) parts.push('shift');
      const key = e.key.toLowerCase();
      if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
        parts.push(key);
      }
      return parts.sort().join('+');
    }

    /**
     * Set up the global keyboard listener
     * @private
     */
    _setupListener() {
      document.addEventListener('keydown', (e) => {
        const combo = this._buildCombo(e);
        const binding = this._hotkeys.get(combo);
        if (binding) {
          e.preventDefault();
          e.stopPropagation();
          try { binding.handler(e); }
          catch (err) { console.error('[Hotkey] Error in handler:', err); }
          this._kernel.events.emit('hotkey:triggered', combo);
        }
      });
    }
  }


  // ============================================================
  // SECTION 9: CONTEXT MENU SYSTEM
  // ============================================================

  class ContextMenuSystem {
    constructor(kernel) {
      this._kernel = kernel;
      this._menu = null;
      this._visible = false;
    }

    /**
     * Initialize the context menu system
     */
    init() {
      this._menu = document.getElementById('context-menu');

      // Show context menu on right-click on desktop
      document.getElementById('desktop-icons').addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.show(e.clientX, e.clientY);
      });

      // Also on window container background
      const container = document.getElementById('window-container');
      if (container) {
        container.addEventListener('contextmenu', (e) => {
          // Only show if clicking on the container itself, not a window
          if (e.target === container) {
            e.preventDefault();
            this.show(e.clientX, e.clientY);
          }
        });
      }

      // Hide on click anywhere
      document.addEventListener('click', () => {
        if (this._visible) this.hide();
      });

      // Handle menu item clicks
      if (this._menu) {
        this._menu.addEventListener('click', (e) => {
          const item = e.target.closest('.context-menu-item');
          if (item) {
            const action = item.dataset.action;
            this._handleAction(action);
            this.hide();
          }
        });
      }
    }

    /**
     * Show context menu at position
     * @param {number} x
     * @param {number} y
     */
    show(x, y) {
      if (!this._menu) return;

      this._menu.classList.remove('hidden');
      this._visible = true;

      // Position the menu, keeping it on screen
      const rect = this._menu.getBoundingClientRect();
      const maxX = window.innerWidth - 220;
      const maxY = window.innerHeight - 300;

      this._menu.style.left = Math.min(x, maxX) + 'px';
      this._menu.style.top = Math.min(y, maxY) + 'px';

      this._kernel.events.emit('contextmenu:show', x, y);
    }

    /**
     * Hide context menu
     */
    hide() {
      if (!this._menu || !this._visible) return;
      this._menu.classList.add('closing');
      setTimeout(() => {
        this._menu.classList.add('hidden');
        this._menu.classList.remove('closing');
        this._visible = false;
      }, 100);
    }

    /**
     * Handle a context menu action
     * @param {string} action
     * @private
     */
    _handleAction(action) {
      switch (action) {
        case 'new-folder':
          this._kernel.events.emit('desktop:newFolder');
          break;
        case 'new-file':
          this._kernel.events.emit('desktop:newFile');
          break;
        case 'refresh':
          this._kernel.events.emit('desktop:refresh');
          break;
        case 'terminal':
          this._kernel.launchApp('terminal');
          break;
        case 'settings':
          this._kernel.launchApp('settings');
          break;
        case 'wallpaper':
          this._kernel.events.emit('desktop:changeWallpaper');
          break;
        case 'sort':
          this._kernel.events.emit('desktop:sort');
          break;
      }
    }
  }


  // ============================================================
  // SECTION 10: WORKSPACE MANAGER (Multiple Desktops)
  // ============================================================

  class WorkspaceManager {
    constructor(kernel) {
      this._kernel = kernel;
      /** @type {Array<{id: number, name: string, windows: Set<string>}>} */
      this._workspaces = [
        { id: 0, name: 'WS 1', windows: new Set() },
        { id: 1, name: 'WS 2', windows: new Set() },
        { id: 2, name: 'WS 3', windows: new Set() },
      ];
      this._current = 0;
    }

    /** Get current workspace index */
    get current() { return this._current; }

    /** Get all workspaces */
    get all() { return this._workspaces; }

    /**
     * Switch to a workspace
     * @param {number} index
     */
    switchTo(index) {
      if (index < 0 || index >= this._workspaces.length) return;
      if (index === this._current) return;

      const prev = this._current;
      this._current = index;

      // Update pill UI
      document.querySelectorAll('.workspace-pill[data-workspace]').forEach(pill => {
        const ws = parseInt(pill.dataset.workspace);
        pill.classList.toggle('active', ws === index);
        pill.setAttribute('aria-selected', ws === index ? 'true' : 'false');
      });

      this._kernel.events.emit('workspace:switch', index, prev);
    }

    /**
     * Add a new workspace
     * @returns {number} New workspace ID
     */
    add() {
      const id = this._workspaces.length;
      this._workspaces.push({ id, name: `WS ${id + 1}`, windows: new Set() });

      // Create pill UI element
      const switcher = document.getElementById('workspace-switcher');
      const addBtn = document.getElementById('workspace-add-btn');
      if (switcher && addBtn) {
        const pill = document.createElement('button');
        pill.className = 'workspace-pill';
        pill.dataset.workspace = id;
        pill.setAttribute('role', 'tab');
        pill.setAttribute('aria-selected', 'false');
        pill.innerHTML = `
          <svg viewBox="0 0 16 16" width="14" height="14"><rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
          <span>WS ${id + 1}</span>
        `;
        pill.addEventListener('click', () => this.switchTo(id));
        switcher.insertBefore(pill, addBtn);
      }

      this._kernel.events.emit('workspace:add', id);
      return id;
    }

    /**
     * Assign a window to the current workspace
     * @param {string} windowId
     */
    assignWindow(windowId) {
      this._workspaces[this._current].windows.add(windowId);
    }

    /**
     * Get windows in current workspace
     * @returns {Set<string>}
     */
    getCurrentWindows() {
      return this._workspaces[this._current].windows;
    }

    /**
     * Initialize workspace UI
     */
    init() {
      // Pill click handlers
      document.querySelectorAll('.workspace-pill[data-workspace]').forEach(pill => {
        pill.addEventListener('click', () => {
          this.switchTo(parseInt(pill.dataset.workspace));
        });
      });

      // Add workspace button
      const addBtn = document.getElementById('workspace-add-btn');
      if (addBtn) {
        addBtn.addEventListener('click', () => this.add());
      }
    }
  }


  // ============================================================
  // SECTION 11: DIALOG SYSTEM
  // ============================================================

  class DialogSystem {
    constructor(kernel) {
      this._kernel = kernel;
      this._overlay = null;
      this._resolve = null;
    }

    /**
     * Initialize dialog system
     */
    init() {
      this._overlay = document.getElementById('dialog-overlay');
      const okBtn = document.getElementById('dialog-ok');
      const cancelBtn = document.getElementById('dialog-cancel');
      const input = document.getElementById('dialog-input');

      if (okBtn) {
        okBtn.addEventListener('click', () => {
          const val = input && !input.classList.contains('hidden') ? input.value : true;
          this._close(val);
        });
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          this._close(null);
        });
      }

      // Close on overlay click
      if (this._overlay) {
        this._overlay.addEventListener('click', (e) => {
          if (e.target === this._overlay) this._close(null);
        });
      }

      // Enter key to confirm
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            this._close(input.value);
          }
        });
      }
    }

    /**
     * Show an alert dialog
     * @param {string} title
     * @param {string} message
     * @returns {Promise<boolean>}
     */
    alert(title, message) {
      return this._show(title, message, 'alert');
    }

    /**
     * Show a confirm dialog
     * @param {string} title
     * @param {string} message
     * @returns {Promise<boolean>}
     */
    confirm(title, message) {
      return this._show(title, message, 'confirm');
    }

    /**
     * Show a prompt dialog
     * @param {string} title
     * @param {string} message
     * @param {string} [defaultValue='']
     * @returns {Promise<string|null>}
     */
    prompt(title, message, defaultValue = '') {
      return this._show(title, message, 'prompt', defaultValue);
    }

    /**
     * Internal show method
     * @private
     */
    _show(title, message, type, defaultValue = '') {
      return new Promise((resolve) => {
        this._resolve = resolve;

        const titleEl = document.getElementById('dialog-title');
        const msgEl = document.getElementById('dialog-message');
        const inputEl = document.getElementById('dialog-input');
        const cancelBtn = document.getElementById('dialog-cancel');

        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;

        // Show/hide input for prompt
        if (inputEl) {
          if (type === 'prompt') {
            inputEl.classList.remove('hidden');
            inputEl.value = defaultValue;
            setTimeout(() => inputEl.focus(), 100);
          } else {
            inputEl.classList.add('hidden');
            inputEl.value = '';
          }
        }

        // Show/hide cancel button for alert
        if (cancelBtn) {
          cancelBtn.classList.toggle('hidden', type === 'alert');
        }

        this._overlay.classList.remove('hidden');
      });
    }

    /**
     * Close dialog with a result
     * @param {any} result
     * @private
     */
    _close(result) {
      if (this._overlay) {
        this._overlay.classList.add('closing');
        setTimeout(() => {
          this._overlay.classList.add('hidden');
          this._overlay.classList.remove('closing');
        }, 200);
      }
      if (this._resolve) {
        this._resolve(result);
        this._resolve = null;
      }
    }
  }


  // ============================================================
  // SECTION 12: SEARCH INDEX
  // ============================================================

  class SearchIndex {
    constructor(kernel) {
      this._kernel = kernel;
      /** @type {Array<{id: string, name: string, category: string, icon: string, description: string, type: string}>} */
      this._entries = [];
    }

    /**
     * Build the search index from app registry and settings
     */
    build() {
      this._entries = [];

      // Index all apps
      for (const app of APP_REGISTRY) {
        this._entries.push({
          id: app.id,
          name: app.name,
          category: app.category,
          icon: app.icon,
          description: app.description,
          type: 'app'
        });
      }

      // Index settings
      const settingEntries = [
        { id: 'setting-theme', name: 'Theme Settings', description: 'Change color theme', type: 'setting' },
        { id: 'setting-wallpaper', name: 'Wallpaper', description: 'Change desktop background', type: 'setting' },
        { id: 'setting-sound', name: 'Sound Settings', description: 'Volume and audio', type: 'setting' },
        { id: 'setting-notifications', name: 'Notification Settings', description: 'Manage alerts', type: 'setting' },
        { id: 'setting-display', name: 'Display Settings', description: 'Resolution and scaling', type: 'setting' },
        { id: 'setting-keyboard', name: 'Keyboard Shortcuts', description: 'View and customize hotkeys', type: 'setting' },
        { id: 'setting-about', name: 'About System', description: 'System information', type: 'setting' },
      ];

      for (const s of settingEntries) {
        this._entries.push({
          ...s,
          category: 'system',
          icon: ICONS.settings
        });
      }
    }

    /**
     * Search the index
     * @param {string} query
     * @param {number} [limit=10]
     * @returns {Array}
     */
    search(query, limit = 10) {
      if (!query || !query.trim()) return [];

      const q = query.toLowerCase().trim();
      const scored = [];

      for (const entry of this._entries) {
        let score = 0;
        const nameLower = entry.name.toLowerCase();
        const descLower = entry.description.toLowerCase();

        // Exact name match
        if (nameLower === q) score += 100;
        // Name starts with query
        else if (nameLower.startsWith(q)) score += 80;
        // Name contains query
        else if (nameLower.includes(q)) score += 60;
        // Description contains query
        else if (descLower.includes(q)) score += 30;
        // Category matches
        else if (entry.category && entry.category.includes(q)) score += 20;

        // Fuzzy match: each word in query matches
        const words = q.split(/\s+/);
        for (const word of words) {
          if (nameLower.includes(word)) score += 15;
          if (descLower.includes(word)) score += 5;
        }

        if (score > 0) {
          scored.push({ ...entry, score });
        }
      }

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, limit);
    }
  }


  // ============================================================
  // SECTION 13: LOCK SCREEN CONTROLLER
  // ============================================================

  class LockScreenController {
    constructor(kernel) {
      this._kernel = kernel;
      this._timeEl = null;
      this._dateEl = null;
      this._timer = null;
    }

    /**
     * Initialize the lock screen
     */
    init() {
      this._timeEl = document.getElementById('lock-time');
      this._dateEl = document.getElementById('lock-date');
      this._passwordInput = document.getElementById('lock-password');
      this._unlockBtn = document.getElementById('lock-unlock-btn');

      // Start clock
      this._updateClock();
      this._timer = setInterval(() => this._updateClock(), 1000);

      // Generate particles
      this._generateParticles();

      // Unlock handlers
      if (this._passwordInput) {
        this._passwordInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this._unlock();
        });
      }

      if (this._unlockBtn) {
        this._unlockBtn.addEventListener('click', () => this._unlock());
      }

      // Focus password field
      setTimeout(() => {
        if (this._passwordInput) this._passwordInput.focus();
      }, 700);
    }

    /**
     * Lock the screen
     */
    lock() {
      const lockScreen = document.getElementById('lock-screen');
      const desktop = document.getElementById('desktop');
      if (lockScreen) {
        lockScreen.classList.remove('hidden', 'fade-out');
      }
      document.body.dataset.state = 'locked';
      this._updateClock();
      if (this._passwordInput) this._passwordInput.value = '';
      this._kernel.events.emit('lock:lock');
    }

    /**
     * Unlock the screen
     * @private
     */
    _unlock() {
      const lockScreen = document.getElementById('lock-screen');
      const desktop = document.getElementById('desktop');

      lockScreen.classList.add('fade-out');
      setTimeout(() => {
        lockScreen.classList.add('hidden');
        desktop.classList.remove('hidden');
        document.body.dataset.state = 'desktop';
        clearInterval(this._timer);
        this._kernel.events.emit('lock:unlock');
        this._kernel.notifications.notify('System', 'Welcome back', 'Session unlocked successfully', 'success');
      }, 600);
    }

    /**
     * Update the clock display
     * @private
     */
    _updateClock() {
      const now = new Date();
      if (this._timeEl) {
        this._timeEl.textContent = formatTime(now);
        this._timeEl.dataset.text = formatTime(now);
      }
      if (this._dateEl) {
        this._dateEl.textContent = formatDate(now);
      }
    }

    /**
     * Generate floating particles for lock screen
     * @private
     */
    _generateParticles() {
      const container = document.getElementById('lock-particles');
      if (!container) return;

      for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = (1 + Math.random() * 3) + 'px';
        particle.style.height = particle.style.width;
        particle.style.setProperty('--duration', (8 + Math.random() * 15) + 's');
        particle.style.animationDelay = (-Math.random() * 15) + 's';
        particle.style.opacity = (0.2 + Math.random() * 0.4).toString();
        container.appendChild(particle);
      }
    }
  }


  // ============================================================
  // SECTION 14: DESKTOP ICON MANAGER
  // ============================================================

  class DesktopIconManager {
    constructor(kernel) {
      this._kernel = kernel;
      this._container = null;
    }

    /**
     * Initialize desktop icons
     */
    init() {
      this._container = document.getElementById('desktop-icons');
      this._populate();
    }

    /**
     * Populate desktop with pinned and default icons
     * @private
     */
    _populate() {
      if (!this._container) return;

      const pinnedApps = APP_REGISTRY.filter(app => app.pinned);
      this._container.innerHTML = '';

      for (const app of pinnedApps) {
        const icon = document.createElement('div');
        icon.className = 'desktop-icon';
        icon.dataset.appId = app.id;
        icon.setAttribute('role', 'gridcell');
        icon.setAttribute('tabindex', '0');
        icon.innerHTML = `
          <div class="desktop-icon-img">${app.icon}</div>
          <div class="desktop-icon-label">${escapeHtml(app.name)}</div>
        `;

        // Double-click to launch
        icon.addEventListener('dblclick', () => {
          this._kernel.launchApp(app.id);
        });

        // Single click to select
        icon.addEventListener('click', (e) => {
          this._container.querySelectorAll('.desktop-icon.selected').forEach(el => {
            el.classList.remove('selected');
          });
          icon.classList.add('selected');
        });

        // Enter key to launch
        icon.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this._kernel.launchApp(app.id);
        });

        this._container.appendChild(icon);
      }
    }

    /**
     * Refresh desktop icons
     */
    refresh() {
      this._populate();
    }
  }


  // ============================================================
  // SECTION 15: SYSTEM CLOCK (Taskbar)
  // ============================================================

  class SystemClock {
    constructor(kernel) {
      this._kernel = kernel;
      this._timeEl = null;
      this._dateEl = null;
      this._timer = null;
    }

    /**
     * Start the system clock
     */
    start() {
      this._timeEl = document.getElementById('clock-time');
      this._dateEl = document.getElementById('clock-date');
      this._update();
      this._timer = setInterval(() => this._update(), 1000);
    }

    /**
     * Stop the clock
     */
    stop() {
      clearInterval(this._timer);
    }

    /**
     * Update display
     * @private
     */
    _update() {
      const now = new Date();
      if (this._timeEl) this._timeEl.textContent = formatTime(now);
      if (this._dateEl) this._dateEl.textContent = formatShortDate(now);
    }
  }


  // ============================================================
  // SECTION 16: SEARCH OVERLAY CONTROLLER
  // ============================================================

  class SearchController {
    constructor(kernel) {
      this._kernel = kernel;
      this._overlay = null;
      this._input = null;
      this._results = null;
      this._selectedIndex = -1;
      this._currentResults = [];
      this._visible = false;
    }

    /**
     * Initialize search overlay
     */
    init() {
      this._overlay = document.getElementById('search-overlay');
      this._input = document.getElementById('search-main-input');
      this._results = document.getElementById('search-results');

      // Input handler
      if (this._input) {
        this._input.addEventListener('input', debounce(() => {
          this._performSearch(this._input.value);
        }, 150));

        // Keyboard navigation
        this._input.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            this._moveSelection(1);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this._moveSelection(-1);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            this._activateSelection();
          } else if (e.key === 'Escape') {
            this.hide();
          }
        });
      }

      // Close on backdrop click
      const backdrop = this._overlay?.querySelector('.search-backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', () => this.hide());
      }
    }

    /**
     * Show the search overlay
     */
    show() {
      if (!this._overlay) return;
      this._overlay.classList.remove('hidden');
      this._visible = true;
      this._input.value = '';
      this._results.innerHTML = '<div class="search-hint">Type to search apps, files, settings, and more</div>';
      this._selectedIndex = -1;
      this._currentResults = [];
      setTimeout(() => this._input.focus(), 100);
      this._kernel.events.emit('search:show');
    }

    /**
     * Hide the search overlay
     */
    hide() {
      if (!this._overlay || !this._visible) return;
      this._overlay.classList.add('hidden');
      this._visible = false;
      this._kernel.events.emit('search:hide');
    }

    /**
     * Toggle visibility
     */
    toggle() {
      this._visible ? this.hide() : this.show();
    }

    /**
     * Perform search
     * @param {string} query
     * @private
     */
    _performSearch(query) {
      const results = this._kernel.searchIndex.search(query);
      this._currentResults = results;
      this._selectedIndex = results.length > 0 ? 0 : -1;
      this._renderResults(results);
    }

    /**
     * Render search results
     * @param {Array} results
     * @private
     */
    _renderResults(results) {
      if (!this._results) return;

      if (results.length === 0) {
        this._results.innerHTML = '<div class="search-hint">No results found</div>';
        return;
      }

      this._results.innerHTML = results.map((r, i) => `
        <div class="search-result-item ${i === this._selectedIndex ? 'selected' : ''}"
             data-index="${i}" data-id="${r.id}" data-type="${r.type}">
          <div class="search-result-icon">${r.icon || ''}</div>
          <div class="search-result-info">
            <div class="search-result-name">${escapeHtml(r.name)}</div>
            <div class="search-result-desc">${escapeHtml(r.description || '')}</div>
          </div>
          <div class="search-result-category">${r.category || ''}</div>
        </div>
      `).join('');

      // Click handlers
      this._results.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const idx = parseInt(item.dataset.index);
          this._selectedIndex = idx;
          this._activateSelection();
        });
      });
    }

    /**
     * Move selection up/down
     * @param {number} delta
     * @private
     */
    _moveSelection(delta) {
      if (this._currentResults.length === 0) return;
      this._selectedIndex = clamp(
        this._selectedIndex + delta,
        0,
        this._currentResults.length - 1
      );
      this._renderResults(this._currentResults);

      // Scroll selected into view
      const selected = this._results?.querySelector('.selected');
      if (selected) selected.scrollIntoView({ block: 'nearest' });
    }

    /**
     * Activate the currently selected result
     * @private
     */
    _activateSelection() {
      if (this._selectedIndex < 0 || this._selectedIndex >= this._currentResults.length) return;
      const result = this._currentResults[this._selectedIndex];

      if (result.type === 'app') {
        this._kernel.launchApp(result.id);
      } else if (result.type === 'setting') {
        this._kernel.launchApp('settings');
      }

      this.hide();
    }
  }


  // ============================================================
  // SECTION 17: BACKGROUND PARTICLE GENERATOR
  // ============================================================

  class BackgroundParticles {
    constructor() {
      this._container = null;
    }

    /**
     * Initialize background particles
     */
    init() {
      this._container = document.getElementById('bg-particles');
      if (!this._container) return;

      const count = 20;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'bg-particle';
        const size = 1 + Math.random() * 3;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = Math.random() * 100 + '%';
        p.style.setProperty('--duration', (10 + Math.random() * 20) + 's');
        p.style.setProperty('--particle-drift', (Math.random() * 60 - 30) + 'px');
        p.style.setProperty('--particle-drift2', (Math.random() * 60 - 30) + 'px');
        p.style.animationDelay = (-Math.random() * 20) + 's';
        p.style.opacity = (0.1 + Math.random() * 0.3).toString();
        this._container.appendChild(p);
      }
    }
  }


  // ============================================================
  // SECTION 18: MAIN KERNEL — NEXUS KERNEL
  // ============================================================

  class NexusKernelClass {
    constructor() {
      // Core subsystems
      this.events = new EventBus();
      this.processes = null;
      this.settings = null;
      this.notifications = null;
      this.clipboard = null;
      this.hotkeys = null;
      this.contextMenu = null;
      this.workspaces = null;
      this.dialogs = null;
      this.searchIndex = null;
      this.search = null;
      this.lockScreen = null;
      this.desktopIcons = null;
      this.clock = null;
      this.bgParticles = null;

      // Window manager and taskbar are initialized externally
      this.windowManager = null;
      this.taskbar = null;

      // App registry
      this.apps = APP_REGISTRY;
      this.icons = ICONS;
    }

    /**
     * Initialize the kernel and all subsystems
     */
    init() {
      console.log('[NEXUS Kernel] Initializing...');

      // Initialize subsystems
      this.processes = new ProcessManager(this);
      this.settings = new SettingsManager(this);
      this.notifications = new NotificationSystem(this);
      this.clipboard = new ClipboardManager(this);
      this.hotkeys = new HotkeyManager(this);
      this.contextMenu = new ContextMenuSystem(this);
      this.workspaces = new WorkspaceManager(this);
      this.dialogs = new DialogSystem(this);
      this.searchIndex = new SearchIndex(this);
      this.search = new SearchController(this);
      this.lockScreen = new LockScreenController(this);
      this.desktopIcons = new DesktopIconManager(this);
      this.clock = new SystemClock(this);
      this.bgParticles = new BackgroundParticles();

      // Build search index
      this.searchIndex.build();

      // Initialize subsystems that need DOM
      this.contextMenu.init();
      this.workspaces.init();
      this.dialogs.init();
      this.search.init();
      this.desktopIcons.init();
      this.bgParticles.init();

      // Register global hotkeys
      this._registerHotkeys();

      // Start system clock
      this.clock.start();

      // Setup workspace switcher visibility
      this._setupWorkspaceVisibility();

      // Setup notification center toggle
      this._setupNotificationCenter();

      // Setup volume popup
      this._setupVolumePopup();

      // Setup start menu power buttons
      this._setupPowerButtons();

      // Show workspace switcher on mouse near top
      this._setupWorkspaceHover();

      console.log('[NEXUS Kernel] Initialized. Apps:', APP_REGISTRY.length);
    }

    /**
     * Get an app definition by ID
     * @param {string} appId
     * @returns {object|undefined}
     */
    getApp(appId) {
      return APP_REGISTRY.find(a => a.id === appId);
    }

    /**
     * Get all apps in a category
     * @param {string} category
     * @returns {Array}
     */
    getAppsByCategory(category) {
      return APP_REGISTRY.filter(a => a.category === category);
    }

    /**
     * Launch an app by ID
     * @param {string} appId
     * @param {object} [options]
     */
    async launchApp(appId, options = {}) {
      const app = this.getApp(appId);
      if (!app) {
        console.warn(`[Kernel] App not found: ${appId}`);
        return;
      }

      // Check singleton
      if (app.singleton && this.windowManager) {
        const existing = this.windowManager.getWindowByAppId(appId);
        if (existing) {
          this.windowManager.focusWindow(existing.id);
          if (existing.minimized) {
            this.windowManager.restoreWindow(existing.id);
          }
          return;
        }
      }

      // Register process
      const pid = this.processes.register(appId, options);

      // Determine window size - entertainment apps get maximum screen real estate
      const isEntertainment = ['games', 'music', 'media'].includes(app.category);
      const defaultWidth = isEntertainment ? window.innerWidth - 40 : (app.defaultWidth || 680);
      const defaultHeight = isEntertainment ? window.innerHeight - 80 : (app.defaultHeight || 480);

      // Create window via window manager
      if (this.windowManager) {
        const win = this.windowManager.createWindow({
          title: app.name,
          icon: app.icon,
          appId: appId,
          pid: pid,
          width: options.width || defaultWidth,
          height: options.height || defaultHeight,
          content: '<div class="app-loading"><div class="app-loading-spinner"></div><p>Loading ' + escapeHtml(app.name) + '...</p></div>',
          onClose: () => {
            this.processes.stop(pid);
            // Destroy app instance if it has destroy method
            if (win._appInstance && typeof win._appInstance.destroy === 'function') {
              win._appInstance.destroy();
            }
          }
        });

        // Auto-maximize entertainment apps for immersive experience
        if (isEntertainment && this.windowManager.maximizeWindow) {
          setTimeout(() => this.windowManager.maximizeWindow(win.id), 100);
        }

        // Assign to workspace
        this.workspaces.assignWindow(win.id);

        // Launch the real app via AppLoader
        if (window.AppLoader && window.AppLoader.has(appId)) {
          const body = win.el.querySelector('.nx-window-body');
          if (body) {
            try {
              const instance = await window.AppLoader.launch(appId, body);
              win._appInstance = instance;
            } catch (err) {
              console.error(`[Kernel] Failed to launch app ${appId}:`, err);
              body.innerHTML = '<div class="app-error"><h2>Failed to load</h2><p>' + escapeHtml(err.message) + '</p></div>';
            }
          }
        }
      }

      // Update taskbar
      if (this.taskbar) {
        this.taskbar.addApp(appId, app);
      }

      this.events.emit('app:launch', appId, pid);
    }

    /**
     * Register global keyboard shortcuts
     * @private
     */
    _registerHotkeys() {
      // Ctrl+K — Search
      this.hotkeys.register('ctrl+k', () => {
        this.search.toggle();
      }, 'Open search');

      // Escape — Close overlays
      this.hotkeys.register('escape', () => {
        if (this.search._visible) {
          this.search.hide();
        }
      }, 'Close search');

      // Ctrl+L — Lock screen
      this.hotkeys.register('ctrl+l', () => {
        this.lockScreen.lock();
      }, 'Lock screen');

      // Super/Win — Start menu
      this.hotkeys.register('meta', () => {
        if (this.taskbar) this.taskbar.toggleStartMenu();
      }, 'Toggle start menu');

      // Ctrl+1/2/3 — Switch workspaces
      this.hotkeys.register('ctrl+1', () => this.workspaces.switchTo(0), 'Workspace 1');
      this.hotkeys.register('ctrl+2', () => this.workspaces.switchTo(1), 'Workspace 2');
      this.hotkeys.register('ctrl+3', () => this.workspaces.switchTo(2), 'Workspace 3');
    }

    /**
     * Setup workspace switcher hover visibility
     * @private
     */
    _setupWorkspaceVisibility() {
      const switcher = document.getElementById('workspace-switcher');
      if (!switcher) return;

      // Show when mouse is near top of screen
      document.addEventListener('mousemove', throttle((e) => {
        if (e.clientY < 50) {
          switcher.classList.add('visible');
        } else if (!switcher.matches(':hover')) {
          switcher.classList.remove('visible');
        }
      }, 100));
    }

    /**
     * Setup notification center toggle
     * @private
     */
    _setupNotificationCenter() {
      const btn = document.getElementById('tray-notif-btn');
      const center = document.getElementById('notification-center');

      if (btn && center) {
        btn.addEventListener('click', () => {
          const isVisible = !center.classList.contains('hidden');
          if (isVisible) {
            center.classList.add('closing');
            setTimeout(() => {
              center.classList.add('hidden');
              center.classList.remove('closing');
            }, 250);
          } else {
            center.classList.remove('hidden');
            this._renderNotificationList();
          }
        });
      }

      // Clear all button
      const clearBtn = document.getElementById('notif-clear-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.notifications.clearAll();
          this._renderNotificationList();
        });
      }
    }

    /**
     * Render notification list in notification center
     * @private
     */
    _renderNotificationList() {
      const list = document.getElementById('notif-list');
      const empty = document.getElementById('notif-empty');
      if (!list) return;

      const notifs = this.notifications.getAll();

      if (notifs.length === 0) {
        list.innerHTML = '';
        if (empty) list.appendChild(empty);
        empty.classList.remove('hidden');
        return;
      }

      list.innerHTML = notifs.map(n => `
        <div class="notif-card" data-id="${n.id}">
          <div class="notif-card-header">
            <span class="notif-card-app">${escapeHtml(n.app)}</span>
            <span class="notif-card-time">${formatTime(n.time)}</span>
          </div>
          <div class="notif-card-title">${escapeHtml(n.title)}</div>
          <div class="notif-card-body">${escapeHtml(n.body)}</div>
        </div>
      `).join('');
    }

    /**
     * Setup volume popup
     * @private
     */
    _setupVolumePopup() {
      const btn = document.getElementById('tray-volume-btn');
      const popup = document.getElementById('volume-popup');
      const slider = document.getElementById('volume-slider');
      const value = document.getElementById('volume-value');

      if (btn && popup) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          popup.classList.toggle('hidden');
        });

        // Close when clicking elsewhere
        document.addEventListener('click', (e) => {
          if (!popup.contains(e.target) && e.target !== btn) {
            popup.classList.add('hidden');
          }
        });
      }

      if (slider && value) {
        slider.addEventListener('input', () => {
          const vol = parseInt(slider.value);
          value.textContent = vol + '%';
          this.settings.set('volume', vol);
          btn.setAttribute('aria-label', `Volume: ${vol}%`);
        });
      }
    }

    /**
     * Setup start menu power buttons
     * @private
     */
    _setupPowerButtons() {
      // Lock
      const lockBtn = document.getElementById('btn-lock');
      if (lockBtn) {
        lockBtn.addEventListener('click', () => {
          if (this.taskbar) this.taskbar.hideStartMenu();
          setTimeout(() => this.lockScreen.lock(), 300);
        });
      }

      // Restart
      const restartBtn = document.getElementById('btn-restart');
      if (restartBtn) {
        restartBtn.addEventListener('click', () => {
          if (this.taskbar) this.taskbar.hideStartMenu();
          this.notifications.notify('System', 'Restarting', 'NEXUS OS is restarting...', 'warning');
          setTimeout(() => location.reload(), 1500);
        });
      }

      // Shutdown
      const shutdownBtn = document.getElementById('btn-shutdown');
      if (shutdownBtn) {
        shutdownBtn.addEventListener('click', () => {
          if (this.taskbar) this.taskbar.hideStartMenu();
          document.body.style.transition = 'opacity 1.5s';
          document.body.style.opacity = '0';
          setTimeout(() => {
            document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#ff003c;font-family:monospace;font-size:14px;">System halted. Refresh to restart.</div>';
            document.body.style.opacity = '1';
          }, 1500);
        });
      }
    }
  }


  // ============================================================
  // SECTION 19: GLOBAL INSTANCE
  // ============================================================

  /** Create the global kernel singleton */
  global.NexusKernel = new NexusKernelClass();

})(window);
