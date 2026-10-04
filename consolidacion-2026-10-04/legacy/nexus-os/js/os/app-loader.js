/**
 * NEXUS OS — App Loader
 * Maps appId to application classes and handles instantiation
 * Supports both API patterns:
 *   - Pattern A: new App(container) + app.render()
 *   - Pattern B: new App() + await app.init(container)
 */

(function (global) {
  'use strict';

  const AppLoader = {
    // Registry: appId → { Class, pattern }
    // pattern: 'constructor' = new App(container), 'async-init' = new App() + init(container)
    registry: {
      // System Tools
      'terminal':              { Class: 'NexusTerminal',            pattern: 'constructor' },
      'file-explorer':         { Class: 'NexusFileExplorer',        pattern: 'constructor' },
      'code-editor':           { Class: 'NexusCodeEditor',          pattern: 'constructor' },
      'calculator':            { Class: 'NexusCalculator',          pattern: 'constructor' },
      'notepad':               { Class: 'NexusNotepad',             pattern: 'constructor' },
      'clock':                 { Class: 'NexusClock',               pattern: 'constructor' },
      'weather':               { Class: 'NexusWeather',             pattern: 'constructor' },
      'paint':                 { Class: 'NexusPaint',               pattern: 'constructor' },
      'settings':              { Class: 'NexusSettings',            pattern: 'constructor' },

      // System Tools
      'task-manager':          { Class: 'NexusTaskManager',         pattern: 'constructor' },
      'backup-tool':           { Class: 'NexusBackupTool',          pattern: 'constructor' },
      'disk-analyzer':         { Class: 'NexusDiskAnalyzer',        pattern: 'constructor' },
      'network-monitor':       { Class: 'NexusNetworkMonitor',      pattern: 'constructor' },
      'clipboard-manager':     { Class: 'NexusClipboardManager',    pattern: 'constructor' },
      'hash-calculator':       { Class: 'NexusHashCalculator',      pattern: 'constructor' },
      'regex-tester':          { Class: 'NexusRegexTester',         pattern: 'constructor' },
      'json-formatter':        { Class: 'NexusJSONFormatter',       pattern: 'constructor' },

      // Media Apps
      'video-player':          { Class: 'NexusVideoPlayer',         pattern: 'constructor' },
      'image-viewer':          { Class: 'NexusImageViewer',         pattern: 'constructor' },
      'audio-visualizer':      { Class: 'NexusAudioVisualizer',     pattern: 'constructor' },
      'neon-photo-viewer':     { Class: 'NexusPhotoFrame',          pattern: 'constructor' },
      'glitch-art':            { Class: 'NexusGlitchArt',           pattern: 'constructor' },
      'screen-recorder':       { Class: 'NexusScreenRecorder',      pattern: 'constructor' },
      'media-converter':       { Class: 'NexusMediaConverter',      pattern: 'constructor' },
      'qr-generator':          { Class: 'NexusQRGenerator',         pattern: 'constructor' },
      'meme-generator':        { Class: 'NexusMemeGenerator',       pattern: 'constructor' },
      'pixel-art':             { Class: 'NexusPixelArt',            pattern: 'constructor' },
      'svg-editor':            { Class: 'NexusSVGEditor',           pattern: 'constructor' },
      'ascii-art':             { Class: 'NexusAsciiArt',            pattern: 'constructor' },
      'gradient-maker':        { Class: 'NexusGradientMaker',       pattern: 'constructor' },
      'color-palette':         { Class: 'NexusColorPalette',        pattern: 'constructor' },
      'gif-maker':             { Class: 'NexusGifMaker',            pattern: 'constructor' },

      // Music Studio (async-init pattern)
      'music-studio':          { Class: 'NexusMusicStudio',         pattern: 'async-init' },
      'synth-lab':             { Class: 'NexusSynthLab',            pattern: 'async-init' },
      'drum-machine':          { Class: 'NexusDrumMachine',         pattern: 'async-init' },
      'voice-recorder':        { Class: 'NexusVoiceRecorder',       pattern: 'async-init' },
      'sequencer':             { Class: 'NexusSequencer',           pattern: 'async-init' },

      // AI & Mystic
      'tarot':                 { Class: 'TarotApp',                 pattern: 'constructor' },
      'oracle':                { Class: 'OracleApp',                pattern: 'constructor' },
      'archetype-interpreter': { Class: 'ArchetypeInterpreterApp',  pattern: 'constructor' },
      'dream-analyzer':        { Class: 'DreamAnalyzerApp',         pattern: 'constructor' },
      'song-writer':           { Class: 'SongWriterApp',            pattern: 'constructor' },
      'ai-chat':               { Class: 'AIChatApp',                pattern: 'constructor' },
      'horoscope':             { Class: 'HoroscopeApp',             pattern: 'constructor' },
      'numerology':            { Class: 'NumerologyApp',            pattern: 'constructor' },

      // Games
      'escape-room':           { Class: 'EscapeRoom',               pattern: 'constructor' },
      'terminal-hacker':       { Class: 'TerminalHacker',           pattern: 'constructor' },
      'neon-pong':             { Class: 'NeonPong',                 pattern: 'constructor' },
      'memory-game':           { Class: 'MemoryGame',               pattern: 'constructor' },
      'cyber-puzzle':          { Class: 'CyberPuzzle',              pattern: 'constructor' },
      'snake':                 { Class: 'NeonSnake',                pattern: 'constructor' },
      'tetris':                { Class: 'NeonTetris',               pattern: 'constructor' },
      'chess':                 { Class: 'Chess',                    pattern: 'constructor' },
      'wordle':                { Class: 'Wordle',                   pattern: 'constructor' },
      'hangman':               { Class: 'Hangman',                  pattern: 'constructor' },
      'trivia':                { Class: 'Trivia',                   pattern: 'constructor' },
      'tic-tac-toe':           { Class: 'TicTacToe',                pattern: 'constructor' },
      'connect-four':          { Class: 'ConnectFour',              pattern: 'constructor' },
      'battleship':            { Class: 'Battleship',               pattern: 'constructor' },
      'blackjack':             { Class: 'Blackjack',                pattern: 'constructor' },
      'simon-says':            { Class: 'SimonSays',                pattern: 'constructor' },
      'breakout':              { Class: 'Breakout',                 pattern: 'constructor' },
      'space-invaders':        { Class: 'SpaceInvaders',            pattern: 'constructor' }
    },

    /**
     * Launch an app by ID
     * @param {string} appId - Application ID
     * @param {HTMLElement} container - DOM element to mount app into
     * @returns {Promise<Object|null>} App instance or null if failed
     */
    async launch(appId, container) {
      const entry = this.registry[appId];
      if (!entry) {
        console.warn(`[AppLoader] Unknown app: ${appId}`);
        return null;
      }

      const AppClass = global[entry.Class];
      if (!AppClass) {
        console.warn(`[AppLoader] Class not found: ${entry.Class}`);
        return null;
      }

      try {
        let instance;

        if (entry.pattern === 'async-init') {
          // Pattern B: constructor() + async init(container)
          instance = new AppClass();
          await instance.init(container);
        } else {
          // Pattern A: constructor(container) + render()
          instance = new AppClass(container);
          if (typeof instance.render === 'function') {
            instance.render();
          }
        }

        return instance;
      } catch (err) {
        console.error(`[AppLoader] Failed to launch ${appId}:`, err);
        return null;
      }
    },

    /**
     * Check if an app is registered
     * @param {string} appId
     * @returns {boolean}
     */
    has(appId) {
      return appId in this.registry;
    },

    /**
     * Get list of all registered app IDs
     * @returns {string[]}
     */
    list() {
      return Object.keys(this.registry);
    }
  };

  global.AppLoader = AppLoader;
})(window);
