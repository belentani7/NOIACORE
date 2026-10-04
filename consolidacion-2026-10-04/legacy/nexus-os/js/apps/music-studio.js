/**
 * NexusMusicStudio — FL Studio-style DAW for NEXUS OS
 * Neon glassmorphism aesthetic, full Web Audio integration
 */
class NexusMusicStudio {
  constructor() {
    this.engine = null;
    this.container = null;
    this.currentView = 'channelRack';
    this.channels = [];
    this.numChannels = 16;
    this.stepsPerPattern = 16;
    this.patterns = {};
    this.currentPattern = 'Pattern 1';
    this.pianoRollNotes = [];
    this.pianoRollChannel = 0;
    this.pianoRollTool = 'pencil';
    this.pianoRollSnap = 4;
    this.pianoRollScale = 'chromatic';
    this.pianoRollScrollY = 36;
    this.pianoRollScrollX = 0;
    this.pianoRollZoomX = 1;
    this.pianoRollZoomY = 1;
    this.pianoRollDragging = null;
    this.arrangement = [];
    this.arrangementZoom = 1;
    this.arrangementScrollX = 0;
    this.loopStart = 0;
    this.loopEnd = 16;
    this.loopEnabled = true;
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndo = 50;
    this.projectName = 'Untitled Project';
    this.animFrameId = null;
    this.synthPresets = {};
    this.channelSynths = {};
    this.tapTimes = [];
    this._initPresets();
    this._initPatterns();
  }

  _initPresets() {
    this.synthPresets = {
      simpleSynth: [
        { name: 'Init', waveform: 'sawtooth', filterFreq: 5000, filterQ: 1, attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 },
        { name: 'Warm Lead', waveform: 'square', filterFreq: 2000, filterQ: 3, attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.4 },
        { name: 'Soft Sine', waveform: 'sine', filterFreq: 8000, filterQ: 0.5, attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.5 },
        { name: 'Brass', waveform: 'sawtooth', filterFreq: 1200, filterQ: 2, attack: 0.05, decay: 0.15, sustain: 0.8, release: 0.2 },
        { name: 'Flute', waveform: 'sine', filterFreq: 4000, filterQ: 0.5, attack: 0.08, decay: 0.1, sustain: 0.7, release: 0.3 },
        { name: 'Clarinet', waveform: 'square', filterFreq: 1800, filterQ: 1, attack: 0.03, decay: 0.1, sustain: 0.75, release: 0.2 },
        { name: 'Strings', waveform: 'sawtooth', filterFreq: 3000, filterQ: 0.5, attack: 0.2, decay: 0.3, sustain: 0.8, release: 0.8 },
        { name: 'Organ', waveform: 'sine', filterFreq: 6000, filterQ: 0.5, attack: 0.005, decay: 0.01, sustain: 0.9, release: 0.05 },
        { name: 'Pluck', waveform: 'triangle', filterFreq: 3500, filterQ: 2, attack: 0.001, decay: 0.15, sustain: 0.1, release: 0.2 },
        { name: 'Bell', waveform: 'sine', filterFreq: 8000, filterQ: 0.5, attack: 0.001, decay: 0.5, sustain: 0.05, release: 1.0 },
        { name: 'Harsh Lead', waveform: 'sawtooth', filterFreq: 4000, filterQ: 5, attack: 0.01, decay: 0.05, sustain: 0.9, release: 0.1 },
      ],
      bassSynth: [
        { name: 'Sub Bass', waveform: 'sine', subLevel: 1, filterFreq: 200, filterQ: 1, attack: 0.005, decay: 0.1, sustain: 0.8, release: 0.2 },
        { name: 'Analog Bass', waveform: 'sawtooth', subLevel: 0.5, filterFreq: 800, filterQ: 4, attack: 0.005, decay: 0.15, sustain: 0.5, release: 0.15 },
        { name: 'FM Bass', waveform: 'square', subLevel: 0.3, filterFreq: 1200, filterQ: 2, attack: 0.005, decay: 0.2, sustain: 0.4, release: 0.1 },
        { name: 'Wobble Bass', waveform: 'sawtooth', subLevel: 0.6, filterFreq: 600, filterQ: 8, attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.2 },
        { name: 'Reese Bass', waveform: 'sawtooth', subLevel: 0.4, filterFreq: 500, filterQ: 2, attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.4 },
        { name: '808 Bass', waveform: 'sine', subLevel: 1, filterFreq: 150, filterQ: 1, attack: 0.005, decay: 0.5, sustain: 0.3, release: 0.3 },
        { name: 'Acid Bass', waveform: 'sawtooth', subLevel: 0, filterFreq: 400, filterQ: 12, attack: 0.005, decay: 0.12, sustain: 0.3, release: 0.1 },
        { name: 'Pluck Bass', waveform: 'triangle', subLevel: 0.3, filterFreq: 1500, filterQ: 2, attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.15 },
        { name: 'Rubber Bass', waveform: 'sine', subLevel: 0.8, filterFreq: 300, filterQ: 1, attack: 0.02, decay: 0.15, sustain: 0.6, release: 0.15 },
        { name: 'Dist Bass', waveform: 'square', subLevel: 0.5, filterFreq: 900, filterQ: 3, attack: 0.005, decay: 0.1, sustain: 0.7, release: 0.1 },
      ],
      padSynth: [
        { name: 'Warm Pad', osc1: 'sawtooth', osc2: 'sawtooth', detune: 7, filterFreq: 2500, filterQ: 0.5, chorusRate: 0.8, chorusDepth: 0.003, attack: 0.5, decay: 0.5, sustain: 0.8, release: 1.5 },
        { name: 'Ice Pad', osc1: 'sine', osc2: 'triangle', detune: 12, filterFreq: 4000, filterQ: 0.5, chorusRate: 0.3, chorusDepth: 0.005, attack: 0.8, decay: 0.5, sustain: 0.7, release: 2.0 },
        { name: 'Choir Pad', osc1: 'sawtooth', osc2: 'sine', detune: 5, filterFreq: 1800, filterQ: 1, chorusRate: 0.5, chorusDepth: 0.004, attack: 0.6, decay: 0.4, sustain: 0.75, release: 1.8 },
        { name: 'Glass Pad', osc1: 'sine', osc2: 'sine', detune: 3, filterFreq: 6000, filterQ: 0.5, chorusRate: 1.2, chorusDepth: 0.002, attack: 1.0, decay: 0.3, sustain: 0.6, release: 2.5 },
        { name: 'Dark Pad', osc1: 'sawtooth', osc2: 'square', detune: 10, filterFreq: 800, filterQ: 2, chorusRate: 0.4, chorusDepth: 0.006, attack: 0.8, decay: 0.5, sustain: 0.8, release: 2.0 },
        { name: 'Strings Pad', osc1: 'sawtooth', osc2: 'sawtooth', detune: 8, filterFreq: 3000, filterQ: 0.5, chorusRate: 0.6, chorusDepth: 0.003, attack: 0.4, decay: 0.3, sustain: 0.85, release: 1.2 },
        { name: 'Ambient', osc1: 'sine', osc2: 'triangle', detune: 15, filterFreq: 2000, filterQ: 1, chorusRate: 0.2, chorusDepth: 0.008, attack: 1.5, decay: 0.8, sustain: 0.6, release: 3.0 },
        { name: 'Ethereal', osc1: 'sine', osc2: 'sine', detune: 20, filterFreq: 5000, filterQ: 0.5, chorusRate: 0.7, chorusDepth: 0.004, attack: 1.2, decay: 0.5, sustain: 0.5, release: 2.5 },
        { name: 'Tension', osc1: 'sawtooth', osc2: 'sawtooth', detune: 25, filterFreq: 600, filterQ: 4, chorusRate: 0.3, chorusDepth: 0.01, attack: 1.0, decay: 0.5, sustain: 0.7, release: 2.0 },
        { name: 'Shimmer', osc1: 'triangle', osc2: 'sine', detune: 6, filterFreq: 7000, filterQ: 0.5, chorusRate: 1.5, chorusDepth: 0.002, attack: 0.5, decay: 0.3, sustain: 0.7, release: 1.5 },
      ]
    };
    for (let i = 0; i < this.numChannels; i++) {
      this.channelSynths[i] = { type: 'simpleSynth', presetIndex: 0 };
    }
    this.channelSynths[0] = { type: 'drumSynth', drumType: 'kick' };
    this.channelSynths[1] = { type: 'drumSynth', drumType: 'snare' };
    this.channelSynths[2] = { type: 'drumSynth', drumType: 'hihat' };
    this.channelSynths[3] = { type: 'drumSynth', drumType: 'clap' };
  }

  _initPatterns() {
    this.patterns[this.currentPattern] = this._emptyPattern();
  }

  _emptyPattern() {
    const p = { steps: this.stepsPerPattern, channels: {} };
    for (let i = 0; i < this.numChannels; i++) {
      p.channels[i] = new Array(this.stepsPerPattern).fill(0);
    }
    return p;
  }

  _pushUndo() {
    this.undoStack.push(JSON.stringify({ patterns: this.patterns, arrangement: this.arrangement, currentPattern: this.currentPattern }));
    if (this.undoStack.length > this.maxUndo) this.undoStack.shift();
    this.redoStack = [];
  }

  _undo() {
    if (!this.undoStack.length) return;
    this.redoStack.push(JSON.stringify({ patterns: this.patterns, arrangement: this.arrangement, currentPattern: this.currentPattern }));
    const state = JSON.parse(this.undoStack.pop());
    this.patterns = state.patterns;
    this.arrangement = state.arrangement;
    this.currentPattern = state.currentPattern;
    this._refreshAll();
  }

  _redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(JSON.stringify({ patterns: this.patterns, arrangement: this.arrangement, currentPattern: this.currentPattern }));
    const state = JSON.parse(this.redoStack.pop());
    this.patterns = state.patterns;
    this.arrangement = state.arrangement;
    this.currentPattern = state.currentPattern;
    this._refreshAll();
  }

  async init(container) {
    this.container = container;
    this.engine = window.nexusAudio;
    await this.engine.init();
    for (let i = 0; i < this.numChannels; i++) {
      const names = ['Kick', 'Snare', 'HiHat', 'Clap', 'Bass', 'Lead', 'Pad', 'Keys', 'FX1', 'FX2', 'Ch10', 'Ch11', 'Ch12', 'Ch13', 'Ch14', 'Ch15'];
      this.engine.createChannel(i, names[i]);
      this.channels.push({
        name: names[i], color: this._channelColor(i), volume: 0.8, pan: 0,
        muted: false, solo: false, synthType: this.channelSynths[i].type
      });
    }
    this._injectStyles();
    this._buildDOM();
    this._bindEvents();
    this._startAnimation();
  }

  _channelColor(i) {
    const colors = ['#ff1744','#ff4081','#f50057','#e91e63','#ff6090','#d500f9','#aa00ff','#7c4dff',
                     '#651fff','#536dfe','#304ffe','#2979ff','#00b0ff','#00e5ff','#1de9b6','#76ff03'];
    return colors[i % colors.length];
  }

  _injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .nexus-studio { width:100%; height:100%; display:flex; flex-direction:column; background:rgba(10,5,15,0.95); color:#e0d0e8; font-family:'Segoe UI',sans-serif; font-size:12px; overflow:hidden; user-select:none; }
      .nexus-studio * { box-sizing:border-box; }
      .ns-toolbar { display:flex; align-items:center; gap:8px; padding:6px 12px; background:rgba(20,10,30,0.9); border-bottom:1px solid rgba(255,23,68,0.3); backdrop-filter:blur(10px); flex-shrink:0; }
      .ns-toolbar-btn { background:rgba(40,20,60,0.8); border:1px solid rgba(255,23,68,0.4); color:#ff6090; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:11px; transition:all 0.15s; }
      .ns-toolbar-btn:hover { background:rgba(255,23,68,0.2); border-color:#ff1744; }
      .ns-toolbar-btn.active { background:rgba(255,23,68,0.3); border-color:#ff1744; box-shadow:0 0 8px rgba(255,23,68,0.4); color:#fff; }
      .ns-toolbar-btn.play-btn.active { background:rgba(0,255,100,0.2); border-color:#00e676; color:#00e676; box-shadow:0 0 8px rgba(0,230,118,0.4); }
      .ns-toolbar-btn.stop-btn { color:#ff5252; }
      .ns-transport { display:flex; align-items:center; gap:4px; margin-left:auto; }
      .ns-bpm-display { display:flex; align-items:center; gap:4px; background:rgba(30,15,45,0.9); padding:3px 8px; border-radius:4px; border:1px solid rgba(255,23,68,0.2); }
      .ns-bpm-display input { width:45px; background:transparent; border:none; color:#ff4081; text-align:center; font-size:14px; font-weight:bold; outline:none; }
      .ns-bpm-display label { color:#888; font-size:10px; }
      .ns-pos-display { font-family:monospace; font-size:13px; color:#ff6090; background:rgba(30,15,45,0.9); padding:3px 10px; border-radius:4px; border:1px solid rgba(255,23,68,0.2); min-width:90px; text-align:center; }
      .ns-sig-select { background:rgba(30,15,45,0.9); border:1px solid rgba(255,23,68,0.2); color:#ff6090; padding:3px 6px; border-radius:4px; font-size:11px; outline:none; }
      .ns-main { flex:1; display:flex; flex-direction:column; overflow:hidden; position:relative; }
      .ns-tabs { display:flex; gap:0; background:rgba(15,8,25,0.9); border-bottom:1px solid rgba(255,23,68,0.2); flex-shrink:0; }
      .ns-tab { padding:8px 18px; cursor:pointer; color:#888; border-bottom:2px solid transparent; transition:all 0.15s; font-size:11px; text-transform:uppercase; letter-spacing:1px; }
      .ns-tab:hover { color:#ccc; }
      .ns-tab.active { color:#ff4081; border-bottom-color:#ff1744; background:rgba(255,23,68,0.05); }
      .ns-view { display:none; flex:1; overflow:auto; }
      .ns-view.active { display:flex; flex-direction:column; }

      /* Channel Rack */
      .ns-channel-rack { padding:8px; overflow-y:auto; flex:1; }
      .ns-channel-row { display:flex; align-items:center; gap:6px; margin-bottom:4px; background:rgba(25,12,40,0.7); border:1px solid rgba(255,23,68,0.1); border-radius:6px; padding:6px 8px; backdrop-filter:blur(5px); }
      .ns-ch-color { width:4px; height:36px; border-radius:2px; flex-shrink:0; }
      .ns-ch-name { width:60px; font-size:10px; color:#ccc; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; cursor:pointer; }
      .ns-ch-controls { display:flex; align-items:center; gap:4px; flex-shrink:0; }
      .ns-ch-btn { width:22px; height:22px; border-radius:3px; border:1px solid rgba(255,23,68,0.3); background:rgba(30,15,45,0.8); color:#888; font-size:9px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.1s; }
      .ns-ch-btn.mute.active { background:rgba(255,82,82,0.3); border-color:#ff5252; color:#ff5252; }
      .ns-ch-btn.solo.active { background:rgba(255,193,7,0.3); border-color:#ffc107; color:#ffc107; }
      .ns-knob-container { position:relative; width:28px; height:28px; cursor:pointer; }
      .ns-knob { width:28px; height:28px; border-radius:50%; background:radial-gradient(circle at 40% 35%, rgba(60,30,80,0.9), rgba(20,10,35,0.95)); border:2px solid rgba(255,23,68,0.3); position:relative; }
      .ns-knob::after { content:''; position:absolute; top:3px; left:50%; width:2px; height:10px; background:#ff4081; border-radius:1px; transform-origin:bottom center; transform:translateX(-50%); }
      .ns-knob-label { font-size:8px; color:#888; text-align:center; margin-top:1px; }
      .ns-fader-container { display:flex; flex-direction:column; align-items:center; width:20px; height:50px; position:relative; }
      .ns-fader-track { width:4px; height:100%; background:rgba(30,15,45,0.8); border-radius:2px; position:relative; border:1px solid rgba(255,23,68,0.2); }
      .ns-fader-fill { position:absolute; bottom:0; width:100%; background:linear-gradient(to top, #ff1744, #ff4081); border-radius:2px; }
      .ns-fader-thumb { position:absolute; left:50%; width:16px; height:8px; background:rgba(255,64,129,0.9); border:1px solid #ff80ab; border-radius:3px; transform:translateX(-50%); cursor:grab; box-shadow:0 0 6px rgba(255,23,68,0.5); }
      .ns-step-grid { display:flex; gap:1px; flex:1; align-items:center; }
      .ns-step { width:18px; height:18px; border-radius:2px; border:1px solid rgba(255,23,68,0.15); background:rgba(20,10,35,0.6); cursor:pointer; transition:background 0.08s, box-shadow 0.08s; flex-shrink:0; }
      .ns-step:hover { border-color:rgba(255,23,68,0.4); }
      .ns-step.active { box-shadow:0 0 6px currentColor; }
      .ns-step.current { border-color:rgba(255,255,255,0.6) !important; }
      .ns-step.beat-marker { border-bottom:2px solid rgba(255,23,68,0.3); }
      .ns-steps-select { background:rgba(30,15,45,0.9); border:1px solid rgba(255,23,68,0.2); color:#ff6090; padding:2px 4px; border-radius:3px; font-size:10px; outline:none; }
      .ns-pattern-controls { display:flex; gap:6px; padding:6px 8px; align-items:center; flex-shrink:0; }
      .ns-swing-slider { -webkit-appearance:none; width:80px; height:4px; background:rgba(255,23,68,0.2); border-radius:2px; outline:none; }
      .ns-swing-slider::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; background:#ff4081; border-radius:50%; cursor:pointer; box-shadow:0 0 4px rgba(255,23,68,0.5); }

      /* Piano Roll */
      .ns-piano-roll { flex:1; display:flex; flex-direction:column; overflow:hidden; }
      .ns-pr-toolbar { display:flex; gap:6px; padding:6px 8px; align-items:center; background:rgba(15,8,25,0.9); border-bottom:1px solid rgba(255,23,68,0.15); flex-shrink:0; flex-wrap:wrap; }
      .ns-pr-tool { padding:3px 8px; background:rgba(30,15,45,0.8); border:1px solid rgba(255,23,68,0.2); color:#888; border-radius:3px; cursor:pointer; font-size:10px; }
      .ns-pr-tool.active { background:rgba(255,23,68,0.2); border-color:#ff1744; color:#ff4081; }
      .ns-pr-canvas-container { flex:1; position:relative; overflow:hidden; }
      .ns-pr-canvas-container canvas { position:absolute; top:0; left:0; }
      .ns-velocity-bar { height:60px; background:rgba(15,8,25,0.9); border-top:1px solid rgba(255,23,68,0.2); flex-shrink:0; position:relative; }

      /* Mixer */
      .ns-mixer { display:flex; gap:4px; padding:8px; overflow-x:auto; flex:1; align-items:stretch; }
      .ns-mixer-strip { display:flex; flex-direction:column; align-items:center; gap:4px; min-width:55px; background:rgba(25,12,40,0.7); border:1px solid rgba(255,23,68,0.1); border-radius:6px; padding:8px 4px; backdrop-filter:blur(5px); }
      .ns-mixer-strip.master { border-color:rgba(255,23,68,0.4); min-width:65px; background:rgba(35,15,55,0.8); }
      .ns-strip-name { font-size:9px; color:#ccc; text-align:center; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .ns-strip-meter { width:8px; height:80px; background:rgba(10,5,15,0.8); border-radius:2px; position:relative; overflow:hidden; border:1px solid rgba(255,23,68,0.1); }
      .ns-strip-meter-fill { position:absolute; bottom:0; width:100%; background:linear-gradient(to top, #00e676, #ffeb3b, #ff5252); border-radius:2px; transition:height 0.05s; }
      .ns-strip-fader { width:4px; height:80px; background:rgba(30,15,45,0.8); border-radius:2px; position:relative; cursor:pointer; border:1px solid rgba(255,23,68,0.15); }
      .ns-strip-fader-fill { position:absolute; bottom:0; width:100%; background:linear-gradient(to top, #ff1744, #ff4081); border-radius:2px; }
      .ns-strip-fader-thumb { position:absolute; left:50%; width:14px; height:6px; background:#ff4081; border:1px solid #ff80ab; border-radius:2px; transform:translateX(-50%); box-shadow:0 0 4px rgba(255,23,68,0.5); }
      .ns-strip-pan { font-size:8px; color:#888; }
      .ns-strip-sends { display:flex; gap:2px; }
      .ns-strip-send { width:16px; height:16px; border-radius:50%; background:rgba(30,15,45,0.8); border:1px solid rgba(255,23,68,0.2); font-size:7px; display:flex; align-items:center; justify-content:center; color:#888; cursor:pointer; }
      .ns-strip-fx-slots { display:flex; flex-direction:column; gap:2px; }
      .ns-fx-slot { font-size:8px; color:#666; background:rgba(20,10,30,0.6); padding:2px 4px; border-radius:2px; border:1px solid rgba(255,23,68,0.1); cursor:pointer; text-align:center; min-width:40px; }
      .ns-fx-slot:hover { border-color:rgba(255,23,68,0.3); color:#aaa; }
      .ns-fx-slot.has-effect { color:#ff4081; border-color:rgba(255,23,68,0.4); }
      .ns-master-vu { width:40px; height:100px; }

      /* Playlist */
      .ns-playlist { flex:1; display:flex; flex-direction:column; overflow:hidden; }
      .ns-pl-toolbar { display:flex; gap:6px; padding:6px 8px; align-items:center; background:rgba(15,8,25,0.9); border-bottom:1px solid rgba(255,23,68,0.15); flex-shrink:0; }
      .ns-pl-canvas-container { flex:1; position:relative; overflow:auto; }
      .ns-pl-canvas-container canvas { display:block; }

      /* Synth Panel */
      .ns-synth-panel { padding:8px; background:rgba(15,8,25,0.9); border-top:1px solid rgba(255,23,68,0.15); flex-shrink:0; max-height:200px; overflow-y:auto; display:none; }
      .ns-synth-panel.visible { display:block; }
      .ns-synth-section { display:flex; gap:8px; align-items:center; margin-bottom:6px; flex-wrap:wrap; }
      .ns-synth-label { font-size:10px; color:#ff6090; font-weight:bold; min-width:50px; text-transform:uppercase; }
      .ns-preset-select { background:rgba(30,15,45,0.9); border:1px solid rgba(255,23,68,0.3); color:#ff6090; padding:3px 6px; border-radius:3px; font-size:10px; outline:none; }

      /* FX Panel */
      .ns-fx-panel { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(20,10,35,0.97); border:1px solid rgba(255,23,68,0.4); border-radius:12px; padding:20px; z-index:1000; min-width:350px; backdrop-filter:blur(20px); box-shadow:0 0 40px rgba(255,23,68,0.2); display:none; }
      .ns-fx-panel.visible { display:block; }
      .ns-fx-title { font-size:14px; color:#ff4081; margin-bottom:12px; text-transform:uppercase; letter-spacing:2px; }
      .ns-fx-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
      .ns-fx-row label { font-size:11px; color:#aaa; min-width:80px; }
      .ns-fx-row input[type=range] { flex:1; -webkit-appearance:none; height:4px; background:rgba(255,23,68,0.2); border-radius:2px; outline:none; }
      .ns-fx-row input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; background:#ff4081; border-radius:50%; cursor:pointer; box-shadow:0 0 6px rgba(255,23,68,0.5); }
      .ns-fx-row .val { font-size:11px; color:#ff6090; min-width:40px; text-align:right; font-family:monospace; }
      .ns-fx-close { position:absolute; top:8px; right:12px; background:none; border:none; color:#ff5252; font-size:18px; cursor:pointer; }
      .ns-fx-select { background:rgba(30,15,45,0.9); border:1px solid rgba(255,23,68,0.3); color:#ff6090; padding:3px 6px; border-radius:3px; font-size:11px; outline:none; }

      /* Scrollbars */
      .nexus-studio ::-webkit-scrollbar { width:6px; height:6px; }
      .nexus-studio ::-webkit-scrollbar-track { background:rgba(10,5,15,0.5); }
      .nexus-studio ::-webkit-scrollbar-thumb { background:rgba(255,23,68,0.3); border-radius:3px; }
      .nexus-studio ::-webkit-scrollbar-thumb:hover { background:rgba(255,23,68,0.5); }
    `;
    this.container.appendChild(style);
  }

  _buildDOM() {
    const root = document.createElement('div');
    root.className = 'nexus-studio';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'ns-toolbar';
    toolbar.innerHTML = `
      <button class="ns-toolbar-btn" data-action="new">New</button>
      <button class="ns-toolbar-btn" data-action="save">Save</button>
      <button class="ns-toolbar-btn" data-action="load">Load</button>
      <button class="ns-toolbar-btn" data-action="export-wav">Export WAV</button>
      <button class="ns-toolbar-btn" data-action="undo">Undo</button>
      <button class="ns-toolbar-btn" data-action="redo">Redo</button>
      <button class="ns-toolbar-btn" data-action="tap-tempo">Tap</button>
      <select class="ns-steps-select" data-bind="stepsPerPattern"><option value="16">16</option><option value="32">32</option><option value="64">64</option></select>
      <div class="ns-transport">
        <button class="ns-toolbar-btn play-btn" data-action="play">▶</button>
        <button class="ns-toolbar-btn" data-action="pause">⏸</button>
        <button class="ns-toolbar-btn stop-btn" data-action="stop">⏹</button>
        <button class="ns-toolbar-btn" data-action="record">⏺</button>
        <button class="ns-toolbar-btn" data-action="metronome">🔔</button>
        <div class="ns-bpm-display">
          <label>BPM</label>
          <button class="ns-toolbar-btn" data-action="bpm-dec" style="padding:2px 6px;">-</button>
          <input type="number" value="120" min="60" max="200" data-bind="bpm">
          <button class="ns-toolbar-btn" data-action="bpm-inc" style="padding:2px 6px;">+</button>
        </div>
        <select class="ns-sig-select" data-bind="timeSig">
          <option value="4/4">4/4</option><option value="3/4">3/4</option><option value="6/8">6/8</option>
        </select>
        <span class="ns-pos-display" data-bind="position">001:01:000</span>
        <label style="font-size:10px;color:#888;">Swing</label>
        <input type="range" class="ns-swing-slider" min="0" max="100" value="0" data-bind="swing">
      </div>
    `;
    root.appendChild(toolbar);

    // Main area with tabs
    const main = document.createElement('div');
    main.className = 'ns-main';

    const tabs = document.createElement('div');
    tabs.className = 'ns-tabs';
    ['Channel Rack', 'Piano Roll', 'Mixer', 'Playlist'].forEach((name, i) => {
      const tab = document.createElement('div');
      tab.className = 'ns-tab' + (i === 0 ? ' active' : '');
      tab.textContent = name;
      tab.dataset.view = ['channelRack', 'pianoRoll', 'mixer', 'playlist'][i];
      tabs.appendChild(tab);
    });
    main.appendChild(tabs);

    // Views
    this._buildChannelRackView(main);
    this._buildPianoRollView(main);
    this._buildMixerView(main);
    this._buildPlaylistView(main);

    root.appendChild(main);

    // FX Panel (modal)
    this.fxPanel = document.createElement('div');
    this.fxPanel.className = 'ns-fx-panel';
    root.appendChild(this.fxPanel);

    this.container.appendChild(root);
    this.root = root;
  }

  _buildChannelRackView(parent) {
    const view = document.createElement('div');
    view.className = 'ns-view active';
    view.dataset.view = 'channelRack';

    // Pattern controls
    const patControls = document.createElement('div');
    patControls.className = 'ns-pattern-controls';
    patControls.innerHTML = `
      <label style="font-size:10px;color:#888;">Pattern:</label>
      <select class="ns-preset-select" data-bind="patternSelect"></select>
      <button class="ns-toolbar-btn" data-action="new-pattern">+</button>
      <button class="ns-toolbar-btn" data-action="del-pattern">✕</button>
      <label style="font-size:10px;color:#888;margin-left:12px;">Steps:</label>
      <select class="ns-steps-select" data-bind="stepsSelect"><option value="16">16</option><option value="32">32</option><option value="64">64</option></select>
    `;
    view.appendChild(patControls);

    // Channel rack
    const rack = document.createElement('div');
    rack.className = 'ns-channel-rack';
    rack.dataset.role = 'channelRack';
    for (let i = 0; i < this.numChannels; i++) {
      const row = this._buildChannelRow(i);
      rack.appendChild(row);
    }
    view.appendChild(rack);
    parent.appendChild(view);
  }

  _buildChannelRow(index) {
    const ch = this.channels[index];
    const row = document.createElement('div');
    row.className = 'ns-channel-row';
    row.dataset.channel = index;

    // Color bar
    const colorBar = document.createElement('div');
    colorBar.className = 'ns-ch-color';
    colorBar.style.background = ch.color;
    row.appendChild(colorBar);

    // Name
    const name = document.createElement('div');
    name.className = 'ns-ch-name';
    name.textContent = ch.name;
    name.title = 'Click to rename';
    name.addEventListener('dblclick', () => {
      const n = prompt('Channel name:', ch.name);
      if (n) { ch.name = n; name.textContent = n; }
    });
    row.appendChild(name);

    // Synth type selector
    const synthSel = document.createElement('select');
    synthSel.className = 'ns-preset-select';
    synthSel.style.width = '70px';
    synthSel.style.fontSize = '9px';
    ['drumSynth', 'simpleSynth', 'bassSynth', 'padSynth'].forEach(t => {
      const o = document.createElement('option');
      o.value = t;
      o.textContent = t.replace('Synth', '');
      if (this.channelSynths[index].type === t) o.selected = true;
      synthSel.appendChild(o);
    });
    synthSel.addEventListener('change', () => {
      this.channelSynths[index].type = synthSel.value;
      ch.synthType = synthSel.value;
    });
    row.appendChild(synthSel);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'ns-ch-controls';

    // Mute
    const muteBtn = document.createElement('button');
    muteBtn.className = 'ns-ch-btn mute';
    muteBtn.textContent = 'M';
    muteBtn.addEventListener('click', () => {
      ch.muted = !ch.muted;
      muteBtn.classList.toggle('active', ch.muted);
      this.engine.setChannelMute(index, ch.muted);
    });
    controls.appendChild(muteBtn);

    // Solo
    const soloBtn = document.createElement('button');
    soloBtn.className = 'ns-ch-btn solo';
    soloBtn.textContent = 'S';
    soloBtn.addEventListener('click', () => {
      ch.solo = !ch.solo;
      soloBtn.classList.toggle('active', ch.solo);
      this.engine.setChannelSolo(index, ch.solo);
    });
    controls.appendChild(soloBtn);

    // Pan knob
    const panContainer = document.createElement('div');
    panContainer.className = 'ns-knob-container';
    const panKnob = document.createElement('div');
    panKnob.className = 'ns-knob';
    const panLabel = document.createElement('div');
    panLabel.className = 'ns-knob-label';
    panLabel.textContent = 'C';
    panContainer.appendChild(panKnob);
    panContainer.appendChild(panLabel);
    this._makeKnob(panKnob, 0, -1, 1, (v) => {
      this.engine.setChannelPan(index, v);
      ch.pan = v;
      panLabel.textContent = v === 0 ? 'C' : v < 0 ? `L${Math.round(-v*100)}` : `R${Math.round(v*100)}`;
    });
    controls.appendChild(panContainer);

    // Volume fader
    const faderC = document.createElement('div');
    faderC.className = 'ns-fader-container';
    const faderTrack = document.createElement('div');
    faderTrack.className = 'ns-fader-track';
    const faderFill = document.createElement('div');
    faderFill.className = 'ns-fader-fill';
    faderFill.style.height = (ch.volume * 100) + '%';
    const faderThumb = document.createElement('div');
    faderThumb.className = 'ns-fader-thumb';
    faderThumb.style.bottom = (ch.volume * 100) + '%';
    faderTrack.appendChild(faderFill);
    faderTrack.appendChild(faderThumb);
    faderC.appendChild(faderTrack);
    this._makeVerticalFader(faderTrack, faderFill, faderThumb, ch.volume, (v) => {
      this.engine.setChannelVolume(index, v);
      ch.volume = v;
    });
    controls.appendChild(faderC);

    row.appendChild(controls);

    // Step grid
    const grid = document.createElement('div');
    grid.className = 'ns-step-grid';
    grid.dataset.role = 'stepGrid';
    const pat = this.patterns[this.currentPattern];
    for (let s = 0; s < this.stepsPerPattern; s++) {
      const step = document.createElement('div');
      step.className = 'ns-step' + (pat && pat.channels[index] && pat.channels[index][s] ? ' active' : '');
      if (s % 4 === 0) step.classList.add('beat-marker');
      step.style.color = ch.color;
      if (pat && pat.channels[index] && pat.channels[index][s]) step.style.background = ch.color;
      step.dataset.channel = index;
      step.dataset.step = s;
      step.addEventListener('click', () => {
        this._pushUndo();
        const p = this.patterns[this.currentPattern];
        if (!p) return;
        p.channels[index][s] = p.channels[index][s] ? 0 : 1;
        step.classList.toggle('active');
        step.style.background = p.channels[index][s] ? ch.color : '';
      });
      grid.appendChild(step);
    }
    row.appendChild(grid);

    return row;
  }

  _buildPianoRollView(parent) {
    const view = document.createElement('div');
    view.className = 'ns-view';
    view.dataset.view = 'pianoRoll';

    const toolbar = document.createElement('div');
    toolbar.className = 'ns-pr-toolbar';
    toolbar.innerHTML = `
      <span style="color:#888;font-size:10px;">Channel:</span>
      <select class="ns-preset-select" data-bind="prChannel"></select>
      <span style="color:#888;font-size:10px;">Tool:</span>
      <button class="ns-pr-tool active" data-tool="pencil">✏ Pencil</button>
      <button class="ns-pr-tool" data-tool="eraser">🧹 Eraser</button>
      <button class="ns-pr-tool" data-tool="select">⬚ Select</button>
      <button class="ns-pr-tool" data-tool="slice">✂ Slice</button>
      <span style="color:#888;font-size:10px;">Snap:</span>
      <select class="ns-preset-select" data-bind="prSnap">
        <option value="1">1/1</option><option value="2">1/2</option><option value="4" selected>1/4</option>
        <option value="8">1/8</option><option value="16">1/16</option><option value="32">1/32</option>
      </select>
      <span style="color:#888;font-size:10px;">Scale:</span>
      <select class="ns-preset-select" data-bind="prScale">
        <option value="chromatic">Chromatic</option><option value="major">Major</option>
        <option value="minor">Minor</option><option value="pentatonic">Pentatonic</option><option value="blues">Blues</option>
      </select>
      <span style="color:#888;font-size:10px;">Chord:</span>
      <select class="ns-preset-select" data-bind="prChord">
        <option value="">None</option><option value="major">Major</option><option value="minor">Minor</option>
        <option value="dim">Dim</option><option value="aug">Aug</option><option value="7">7th</option>
        <option value="maj7">Maj7</option><option value="min7">Min7</option>
      </select>
      <button class="ns-toolbar-btn" data-action="pr-quantize">Quantize</button>
      <button class="ns-toolbar-btn" data-action="pr-clear">Clear</button>
    `;
    view.appendChild(toolbar);

    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'ns-pr-canvas-container';
    this.prCanvas = document.createElement('canvas');
    this.prCanvas.width = 1200;
    this.prCanvas.height = 600;
    canvasContainer.appendChild(this.prCanvas);
    view.appendChild(canvasContainer);

    const velBar = document.createElement('div');
    velBar.className = 'ns-velocity-bar';
    this.velCanvas = document.createElement('canvas');
    this.velCanvas.width = 1200;
    this.velCanvas.height = 60;
    velBar.appendChild(this.velCanvas);
    view.appendChild(velBar);

    parent.appendChild(view);
  }

  _buildMixerView(parent) {
    const view = document.createElement('div');
    view.className = 'ns-view';
    view.dataset.view = 'mixer';

    const mixer = document.createElement('div');
    mixer.className = 'ns-mixer';
    mixer.dataset.role = 'mixer';

    for (let i = 0; i < this.numChannels; i++) {
      mixer.appendChild(this._buildMixerStrip(i));
    }
    // Master strip
    mixer.appendChild(this._buildMasterStrip());
    view.appendChild(mixer);
    parent.appendChild(view);
  }

  _buildMixerStrip(index) {
    const ch = this.channels[index];
    const strip = document.createElement('div');
    strip.className = 'ns-mixer-strip';
    strip.dataset.channel = index;

    const nameEl = document.createElement('div');
    nameEl.className = 'ns-strip-name';
    nameEl.textContent = ch.name;
    strip.appendChild(nameEl);

    // Color dot
    const colorDot = document.createElement('div');
    colorDot.style.cssText = `width:8px;height:8px;border-radius:50%;background:${ch.color};margin:0 auto;`;
    strip.appendChild(colorDot);

    // FX slots
    const fxSlots = document.createElement('div');
    fxSlots.className = 'ns-strip-fx-slots';
    for (let s = 0; s < 3; s++) {
      const slot = document.createElement('div');
      slot.className = 'ns-fx-slot';
      slot.textContent = `FX${s+1}`;
      slot.addEventListener('click', () => this._openFXPanel(index, s));
      fxSlots.appendChild(slot);
    }
    strip.appendChild(fxSlots);

    // Sends
    const sends = document.createElement('div');
    sends.className = 'ns-strip-sends';
    for (let s = 0; s < 2; s++) {
      const send = document.createElement('div');
      send.className = 'ns-strip-send';
      send.textContent = `S${s+1}`;
      send.title = `Send ${s+1} level`;
      sends.appendChild(send);
    }
    strip.appendChild(sends);

    // Meter
    const meter = document.createElement('div');
    meter.className = 'ns-strip-meter';
    const meterFill = document.createElement('div');
    meterFill.className = 'ns-strip-meter-fill';
    meterFill.style.height = '0%';
    meterFill.dataset.role = 'meterFill';
    meter.appendChild(meterFill);
    strip.appendChild(meter);

    // Fader
    const fader = document.createElement('div');
    fader.className = 'ns-strip-fader';
    const faderFill = document.createElement('div');
    faderFill.className = 'ns-strip-fader-fill';
    faderFill.style.height = (ch.volume * 100) + '%';
    const faderThumb = document.createElement('div');
    faderThumb.className = 'ns-strip-fader-thumb';
    faderThumb.style.bottom = (ch.volume * 100) + '%';
    fader.appendChild(faderFill);
    fader.appendChild(faderThumb);
    this._makeVerticalFader(fader, faderFill, faderThumb, ch.volume, (v) => {
      this.engine.setChannelVolume(index, v);
      this.channels[index].volume = v;
    });
    strip.appendChild(fader);

    // Pan
    const panEl = document.createElement('div');
    panEl.className = 'ns-strip-pan';
    panEl.textContent = 'C';
    const panKnob = document.createElement('div');
    panKnob.className = 'ns-knob';
    panKnob.style.cssText = 'width:22px;height:22px;margin:0 auto;';
    this._makeKnob(panKnob, 0, -1, 1, (v) => {
      this.engine.setChannelPan(index, v);
      panEl.textContent = v === 0 ? 'C' : v < 0 ? `L${Math.round(-v*50)}` : `R${Math.round(v*50)}`;
    });
    strip.appendChild(panKnob);
    strip.appendChild(panEl);

    // Mute/Solo
    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:2px;';
    const mBtn = document.createElement('button');
    mBtn.className = 'ns-ch-btn mute';
    mBtn.textContent = 'M';
    mBtn.addEventListener('click', () => {
      ch.muted = !ch.muted;
      mBtn.classList.toggle('active');
      this.engine.setChannelMute(index, ch.muted);
    });
    const sBtn = document.createElement('button');
    sBtn.className = 'ns-ch-btn solo';
    sBtn.textContent = 'S';
    sBtn.addEventListener('click', () => {
      ch.solo = !ch.solo;
      sBtn.classList.toggle('active');
      this.engine.setChannelSolo(index, ch.solo);
    });
    btns.appendChild(mBtn);
    btns.appendChild(sBtn);
    strip.appendChild(btns);

    return strip;
  }

  _buildMasterStrip() {
    const strip = document.createElement('div');
    strip.className = 'ns-mixer-strip master';

    const nameEl = document.createElement('div');
    nameEl.className = 'ns-strip-name';
    nameEl.textContent = 'MASTER';
    nameEl.style.color = '#ff4081';
    nameEl.style.fontWeight = 'bold';
    strip.appendChild(nameEl);

    // VU canvas
    const vuCanvas = document.createElement('canvas');
    vuCanvas.width = 40;
    vuCanvas.height = 100;
    vuCanvas.className = 'ns-master-vu';
    vuCanvas.dataset.role = 'masterVU';
    this.masterVUCanvas = vuCanvas;
    strip.appendChild(vuCanvas);

    // Master fader
    const fader = document.createElement('div');
    fader.className = 'ns-strip-fader';
    fader.style.height = '100px';
    const faderFill = document.createElement('div');
    faderFill.className = 'ns-strip-fader-fill';
    faderFill.style.height = '80%';
    const faderThumb = document.createElement('div');
    faderThumb.className = 'ns-strip-fader-thumb';
    faderThumb.style.bottom = '80%';
    fader.appendChild(faderFill);
    fader.appendChild(faderThumb);
    this._makeVerticalFader(fader, faderFill, faderThumb, 0.8, (v) => {
      if (this.engine.masterGain) this.engine.masterGain.gain.setTargetAtTime(v, this.engine.ctx.currentTime, 0.01);
    });
    strip.appendChild(fader);

    return strip;
  }

  _buildPlaylistView(parent) {
    const view = document.createElement('div');
    view.className = 'ns-view';
    view.dataset.view = 'playlist';

    const toolbar = document.createElement('div');
    toolbar.className = 'ns-pl-toolbar';
    toolbar.innerHTML = `
      <label style="font-size:10px;color:#888;">Zoom:</label>
      <input type="range" class="ns-swing-slider" min="0.25" max="4" step="0.25" value="1" data-bind="plZoom" style="width:100px;">
      <button class="ns-toolbar-btn" data-action="pl-add-pattern">Add Pattern</button>
      <button class="ns-toolbar-btn" data-action="pl-clear">Clear</button>
      <span style="font-size:10px;color:#888;margin-left:auto;">Song Length:</span>
      <span style="font-size:11px;color:#ff6090;" data-bind="songLength">0 bars</span>
    `;
    view.appendChild(toolbar);

    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'ns-pl-canvas-container';
    this.plCanvas = document.createElement('canvas');
    this.plCanvas.width = 2000;
    this.plCanvas.height = 400;
    canvasContainer.appendChild(this.plCanvas);
    view.appendChild(canvasContainer);

    parent.appendChild(view);
  }

  _bindEvents() {
    // Tab switching
    this.root.querySelectorAll('.ns-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.root.querySelectorAll('.ns-tab').forEach(t => t.classList.remove('active'));
        this.root.querySelectorAll('.ns-view').forEach(v => v.classList.remove('active'));
        tab.classList.add('active');
        const viewEl = this.root.querySelector(`.ns-view[data-view="${tab.dataset.view}"]`);
        if (viewEl) viewEl.classList.add('active');
        this.currentView = tab.dataset.view;
        if (this.currentView === 'pianoRoll') this._drawPianoRoll();
        if (this.currentView === 'playlist') this._drawPlaylist();
      });
    });

    // Toolbar actions
    this.root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      switch (action) {
        case 'play': this._play(); btn.classList.add('active'); break;
        case 'pause': this._pause(); break;
        case 'stop': this._stop(); this.root.querySelector('.play-btn')?.classList.remove('active'); break;
        case 'record': this._toggleRecord(btn); break;
        case 'metronome':
          this.engine.metronomeEnabled = !this.engine.metronomeEnabled;
          btn.classList.toggle('active', this.engine.metronomeEnabled);
          break;
        case 'bpm-dec': this._setBPM(Math.max(60, this.engine.bpm - 1)); break;
        case 'bpm-inc': this._setBPM(Math.min(200, this.engine.bpm + 1)); break;
        case 'tap-tempo': this._tapTempo(); break;
        case 'new': this._newProject(); break;
        case 'save': this._saveProject(); break;
        case 'load': this._loadProject(); break;
        case 'export-wav': this._exportWAV(); break;
        case 'undo': this._undo(); break;
        case 'redo': this._redo(); break;
        case 'new-pattern': this._newPattern(); break;
        case 'del-pattern': this._deletePattern(); break;
        case 'pr-quantize': this._quantizePianoRoll(); break;
        case 'pr-clear': this._clearPianoRoll(); break;
        case 'pl-add-pattern': this._addPatternToPlaylist(); break;
        case 'pl-clear': this.arrangement = []; this._drawPlaylist(); break;
      }
    });

    // BPM input
    const bpmInput = this.root.querySelector('[data-bind="bpm"]');
    if (bpmInput) {
      bpmInput.addEventListener('change', () => {
        const v = parseInt(bpmInput.value);
        if (v >= 60 && v <= 200) this._setBPM(v);
      });
    }

    // Time signature
    const sigSel = this.root.querySelector('[data-bind="timeSig"]');
    if (sigSel) {
      sigSel.addEventListener('change', () => {
        const [n, d] = sigSel.value.split('/').map(Number);
        this.engine.timeSignature = [n, d];
      });
    }

    // Swing
    const swingSlider = this.root.querySelector('[data-bind="swing"]');
    if (swingSlider) {
      swingSlider.addEventListener('input', () => {
        this.engine.swing = parseInt(swingSlider.value);
      });
    }

    // Steps select
    const stepsSel = this.root.querySelector('[data-bind="stepsSelect"]');
    if (stepsSel) {
      stepsSel.addEventListener('change', () => {
        this._pushUndo();
        this.stepsPerPattern = parseInt(stepsSel.value);
        const pat = this.patterns[this.currentPattern];
        if (pat) {
          pat.steps = this.stepsPerPattern;
          for (let i = 0; i < this.numChannels; i++) {
            const old = pat.channels[i] || [];
            pat.channels[i] = new Array(this.stepsPerPattern).fill(0);
            for (let s = 0; s < Math.min(old.length, this.stepsPerPattern); s++) {
              pat.channels[i][s] = old[s];
            }
          }
        }
        this._rebuildChannelRack();
      });
    }

    // Pattern select
    const patSel = this.root.querySelector('[data-bind="patternSelect"]');
    if (patSel) {
      this._updatePatternSelect();
      patSel.addEventListener('change', () => {
        this.currentPattern = patSel.value;
        this._rebuildChannelRack();
      });
    }

    // Piano roll toolbar
    const prChannelSel = this.root.querySelector('[data-bind="prChannel"]');
    if (prChannelSel) {
      for (let i = 0; i < this.numChannels; i++) {
        const o = document.createElement('option');
        o.value = i;
        o.textContent = this.channels[i].name;
        prChannelSel.appendChild(o);
      }
      prChannelSel.addEventListener('change', () => {
        this.pianoRollChannel = parseInt(prChannelSel.value);
        this._drawPianoRoll();
      });
    }

    // Piano roll tools
    this.root.querySelectorAll('.ns-pr-tool').forEach(btn => {
      btn.addEventListener('click', () => {
        this.root.querySelectorAll('.ns-pr-tool').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.pianoRollTool = btn.dataset.tool;
      });
    });

    // Snap
    const snapSel = this.root.querySelector('[data-bind="prSnap"]');
    if (snapSel) {
      snapSel.addEventListener('change', () => { this.pianoRollSnap = parseInt(snapSel.value); });
    }

    // Scale
    const scaleSel = this.root.querySelector('[data-bind="prScale"]');
    if (scaleSel) {
      scaleSel.addEventListener('change', () => { this.pianoRollScale = scaleSel.value; this._drawPianoRoll(); });
    }

    // Piano roll canvas events
    if (this.prCanvas) {
      this.prCanvas.addEventListener('mousedown', (e) => this._prMouseDown(e));
      this.prCanvas.addEventListener('mousemove', (e) => this._prMouseMove(e));
      this.prCanvas.addEventListener('mouseup', (e) => this._prMouseUp(e));
      this.prCanvas.addEventListener('wheel', (e) => this._prWheel(e));
    }

    // Velocity canvas events
    if (this.velCanvas) {
      this.velCanvas.addEventListener('mousedown', (e) => this._velMouseDown(e));
      this.velCanvas.addEventListener('mousemove', (e) => this._velMouseMove(e));
      this.velCanvas.addEventListener('mouseup', () => this._velMouseUp());
    }

    // Playlist canvas events
    if (this.plCanvas) {
      this.plCanvas.addEventListener('mousedown', (e) => this._plMouseDown(e));
      this.plCanvas.addEventListener('mousemove', (e) => this._plMouseMove(e));
      this.plCanvas.addEventListener('mouseup', () => this._plMouseUp());
    }

    // Playlist zoom
    const plZoom = this.root.querySelector('[data-bind="plZoom"]');
    if (plZoom) {
      plZoom.addEventListener('input', () => {
        this.arrangementZoom = parseFloat(plZoom.value);
        this._drawPlaylist();
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this._undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); this._redo(); }
      if (e.key === ' ') { e.preventDefault(); this.engine.isPlaying ? this._pause() : this._play(); }
    });
  }

  /* ── Knob Control ── */
  _makeKnob(el, initial, min, max, onChange) {
    let value = initial;
    let dragging = false;
    let startY = 0;
    let startValue = 0;

    const update = () => {
      const norm = (value - min) / (max - min);
      const angle = -135 + norm * 270;
      el.style.transform = `rotate(${angle}deg)`;
      if (onChange) onChange(value);
    };
    update();

    el.addEventListener('mousedown', (e) => {
      dragging = true;
      startY = e.clientY;
      startValue = value;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dy = startY - e.clientY;
      const range = max - min;
      value = Math.max(min, Math.min(max, startValue + (dy / 150) * range));
      update();
    });

    document.addEventListener('mouseup', () => { dragging = false; });

    el.addEventListener('dblclick', () => {
      value = (min + max) / 2;
      update();
    });
  }

  /* ── Vertical Fader ── */
  _makeVerticalFader(track, fill, thumb, initial, onChange) {
    let value = initial;
    let dragging = false;

    const update = () => {
      fill.style.height = (value * 100) + '%';
      thumb.style.bottom = (value * 100) + '%';
      if (onChange) onChange(value);
    };
    update();

    const getPos = (e) => {
      const rect = track.getBoundingClientRect();
      return 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    };

    track.addEventListener('mousedown', (e) => {
      dragging = true;
      value = getPos(e);
      update();
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      value = getPos(e);
      update();
    });

    document.addEventListener('mouseup', () => { dragging = false; });
  }

  /* ── Transport ── */
  _play() {
    if (this.engine.isPlaying) return;
    const pat = this.patterns[this.currentPattern];
    if (!pat) return;
    const totalSteps = this.stepsPerPattern;

    this.engine.bpm = parseInt(this.root.querySelector('[data-bind="bpm"]')?.value || 120);
    this.engine.swing = parseInt(this.root.querySelector('[data-bind="swing"]')?.value || 0);

    this.engine.onStep = (step) => {
      this._highlightStep(step);
    };

    this.engine.start((step, time) => {
      this._playPatternStep(step, time, pat);
    }, totalSteps);
  }

  _playPatternStep(step, time, pat) {
    for (let ch = 0; ch < this.numChannels; ch++) {
      if (!pat.channels[ch] || !pat.channels[ch][step]) continue;
      const synth = this.channelSynths[ch];
      const chData = this.channels[ch];
      const velocity = 0.8;

      switch (synth.type) {
        case 'drumSynth':
          this._playDrumHit(ch, synth.drumType, time, velocity);
          break;
        case 'simpleSynth': {
          const preset = this.synthPresets.simpleSynth[synth.presetIndex || 0];
          const noteFreq = NexusAudioEngine.noteToFreq('C', 4);
          this.engine.playNote(noteFreq, 0.2, time, ch, {
            waveform: preset.waveform, velocity,
            attack: preset.attack, decay: preset.decay, sustain: preset.sustain, release: preset.release,
            filterFreq: preset.filterFreq, filterQ: preset.filterQ
          });
          break;
        }
        case 'bassSynth': {
          const preset = this.synthPresets.bassSynth[synth.presetIndex || 0];
          const noteFreq = NexusAudioEngine.noteToFreq('C', 2);
          this.engine.playNote(noteFreq, 0.2, time, ch, {
            waveform: preset.waveform, velocity,
            attack: preset.attack, decay: preset.decay, sustain: preset.sustain, release: preset.release,
            filterFreq: preset.filterFreq, filterQ: preset.filterQ
          });
          break;
        }
        case 'padSynth': {
          const preset = this.synthPresets.padSynth[synth.presetIndex || 0];
          const noteFreq = NexusAudioEngine.noteToFreq('C', 4);
          this.engine.playSynthNote(time, 0.4, ch, {
            frequency: noteFreq, velocity,
            oscillators: [
              { waveform: preset.osc1, detune: 0, octave: 0, level: 1 },
              { waveform: preset.osc2, detune: preset.detune, octave: 0, level: 0.8 }
            ],
            filter: { type: 'lowpass', cutoff: preset.filterFreq, resonance: preset.filterQ },
            envelope: { attack: preset.attack, decay: preset.decay, sustain: preset.sustain, release: preset.release }
          });
          break;
        }
      }
    }
  }

  _playDrumHit(channel, drumType, time, velocity) {
    const params = { velocity };
    switch (drumType) {
      case 'kick': this.engine.playKick(time, channel, params); break;
      case 'snare': this.engine.playSnare(time, channel, params); break;
      case 'hihat': this.engine.playHihat(time, channel, params); break;
      case 'clap': this.engine.playClap(time, channel, params); break;
      case 'tom': this.engine.playTom(time, channel, params); break;
      case 'rim': this.engine.playRim(time, channel, params); break;
      case 'crash': this.engine.playCrash(time, channel, params); break;
    }
  }

  _pause() {
    this.engine.pause();
    this.root.querySelector('.play-btn')?.classList.remove('active');
  }

  _stop() {
    this.engine.stop();
    this._highlightStep(-1);
  }

  _toggleRecord(btn) {
    btn.classList.toggle('active');
    // Record mode indicator only — actual recording handled by arrangement
  }

  _setBPM(bpm) {
    this.engine.bpm = bpm;
    const input = this.root.querySelector('[data-bind="bpm"]');
    if (input) input.value = bpm;
  }

  _tapTempo() {
    const now = performance.now();
    this.tapTimes.push(now);
    if (this.tapTimes.length > 8) this.tapTimes.shift();
    if (this.tapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < this.tapTimes.length; i++) {
        intervals.push(this.tapTimes[i] - this.tapTimes[i-1]);
      }
      const avg = intervals.reduce((a, b) => a + b) / intervals.length;
      const bpm = Math.round(60000 / avg);
      if (bpm >= 60 && bpm <= 200) this._setBPM(bpm);
    }
  }

  _highlightStep(step) {
    const rows = this.root.querySelectorAll('.ns-channel-row');
    rows.forEach(row => {
      const steps = row.querySelectorAll('.ns-step');
      steps.forEach((s, i) => {
        s.classList.toggle('current', i === step);
      });
    });
    // Update position display
    const posEl = this.root.querySelector('[data-bind="position"]');
    if (posEl && step >= 0) {
      const beatsPerBar = this.engine.timeSignature[0];
      const bar = Math.floor(step / (this.engine.stepsPerBeat * beatsPerBar)) + 1;
      const beat = Math.floor(step / this.engine.stepsPerBeat) % beatsPerBar + 1;
      const tick = (step % this.engine.stepsPerBeat) * Math.floor(960 / this.engine.stepsPerBeat);
      posEl.textContent = `${String(bar).padStart(3,'0')}:${String(beat).padStart(2,'0')}:${String(tick).padStart(3,'0')}`;
    }
  }

  /* ── Pattern Management ── */
  _newPattern() {
    const name = prompt('Pattern name:', `Pattern ${Object.keys(this.patterns).length + 1}`);
    if (!name) return;
    this._pushUndo();
    this.patterns[name] = this._emptyPattern();
    this.currentPattern = name;
    this._updatePatternSelect();
    this._rebuildChannelRack();
  }

  _deletePattern() {
    const keys = Object.keys(this.patterns);
    if (keys.length <= 1) { alert('Cannot delete the last pattern'); return; }
    this._pushUndo();
    delete this.patterns[this.currentPattern];
    this.currentPattern = Object.keys(this.patterns)[0];
    this._updatePatternSelect();
    this._rebuildChannelRack();
  }

  _updatePatternSelect() {
    const sel = this.root.querySelector('[data-bind="patternSelect"]');
    if (!sel) return;
    sel.innerHTML = '';
    Object.keys(this.patterns).forEach(name => {
      const o = document.createElement('option');
      o.value = name;
      o.textContent = name;
      if (name === this.currentPattern) o.selected = true;
      sel.appendChild(o);
    });
  }

  _rebuildChannelRack() {
    const rack = this.root.querySelector('[data-role="channelRack"]');
    if (!rack) return;
    rack.innerHTML = '';
    for (let i = 0; i < this.numChannels; i++) {
      rack.appendChild(this._buildChannelRow(i));
    }
  }

  _refreshAll() {
    this._rebuildChannelRack();
    this._updatePatternSelect();
    if (this.currentView === 'pianoRoll') this._drawPianoRoll();
    if (this.currentView === 'playlist') this._drawPlaylist();
  }

  /* ── Piano Roll ── */
  _getPianoRollNotes() {
    return this.pianoRollNotes.filter(n => n.channel === this.pianoRollChannel);
  }

  _drawPianoRoll() {
    const canvas = this.prCanvas;
    if (!canvas) return;
    const container = canvas.parentElement;
    canvas.width = container.clientWidth || 1200;
    canvas.height = container.clientHeight || 600;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pianoKeyWidth = 60;
    const gridW = w - pianoKeyWidth;
    const totalNotes = 88;
    const noteH = Math.max(8, 14 * this.pianoRollZoomY);
    const stepW = (gridW / this.stepsPerPattern) * this.pianoRollZoomX;

    ctx.fillStyle = 'rgba(10,5,15,1)';
    ctx.fillRect(0, 0, w, h);

    const noteNames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const scaleIntervals = {
      chromatic: [0,1,2,3,4,5,6,7,8,9,10,11],
      major: [0,2,4,5,7,9,11],
      minor: [0,2,3,5,7,8,10],
      pentatonic: [0,2,4,7,9],
      blues: [0,3,5,6,7,10]
    };
    const currentScale = scaleIntervals[this.pianoRollScale] || scaleIntervals.chromatic;

    // Draw piano keys
    for (let i = 0; i < totalNotes; i++) {
      const noteIndex = (totalNotes - 1 - i);
      const midi = noteIndex + 21;
      const noteName = noteNames[midi % 12];
      const octave = Math.floor(midi / 12) - 1;
      const y = i * noteH - this.pianoRollScrollY * noteH;
      if (y < -noteH || y > h) continue;

      const isBlack = [1,3,6,8,10].includes(midi % 12);
      const inScale = currentScale.includes(midi % 12);

      ctx.fillStyle = isBlack ? 'rgba(20,10,30,0.9)' : 'rgba(35,18,50,0.9)';
      ctx.fillRect(0, y, pianoKeyWidth, noteH);

      if (inScale && !isBlack) {
        ctx.fillStyle = 'rgba(255,23,68,0.08)';
        ctx.fillRect(pianoKeyWidth, y, gridW, noteH);
      }

      ctx.strokeStyle = 'rgba(255,23,68,0.08)';
      ctx.strokeRect(0, y, pianoKeyWidth, noteH);

      if (noteName === 'C') {
        ctx.fillStyle = '#ff4081';
        ctx.font = '10px monospace';
        ctx.fillText(`C${octave}`, 5, y + noteH - 3);
      } else if (!isBlack) {
        ctx.fillStyle = '#666';
        ctx.font = '9px monospace';
        ctx.fillText(noteName, 5, y + noteH - 3);
      }
    }

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255,23,68,0.06)';
    for (let i = 0; i <= totalNotes; i++) {
      const y = i * noteH - this.pianoRollScrollY * noteH;
      ctx.beginPath();
      ctx.moveTo(pianoKeyWidth, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    for (let s = 0; s <= this.stepsPerPattern; s++) {
      const x = pianoKeyWidth + s * stepW - this.pianoRollScrollX;
      ctx.strokeStyle = s % 4 === 0 ? 'rgba(255,23,68,0.2)' : 'rgba(255,23,68,0.06)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Draw notes
    const notes = this._getPianoRollNotes();
    notes.forEach(note => {
      const y = (87 - (note.midi - 21)) * noteH - this.pianoRollScrollY * noteH;
      const x = pianoKeyWidth + note.step * stepW - this.pianoRollScrollX;
      const noteW = note.duration * stepW;

      ctx.fillStyle = this.channels[this.pianoRollChannel]?.color || '#ff4081';
      ctx.globalAlpha = 0.3 + (note.velocity || 0.8) * 0.7;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, noteW - 2, noteH - 2, 3);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = this.channels[this.pianoRollChannel]?.color || '#ff4081';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, noteW - 2, noteH - 2, 3);
      ctx.stroke();

      // Resize handle
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + noteW - 4, y + 2, 3, noteH - 4);
    });

    // Draw velocity bar
    this._drawVelocityBar(notes, stepW);

    // Store layout info for mouse handling
    this._prLayout = { pianoKeyWidth, noteH, stepW, gridW, totalNotes };
  }

  _drawVelocityBar(notes, stepW) {
    const canvas = this.velCanvas;
    if (!canvas) return;
    const container = canvas.parentElement;
    canvas.width = container.clientWidth || 1200;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pianoKeyWidth = 60;

    ctx.fillStyle = 'rgba(10,5,15,1)';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255,23,68,0.06)';
    for (let s = 0; s <= this.stepsPerPattern; s++) {
      const x = pianoKeyWidth + s * stepW - this.pianoRollScrollX;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Velocity bars
    notes.forEach(note => {
      const x = pianoKeyWidth + note.step * stepW - this.pianoRollScrollX;
      const noteW = note.duration * stepW;
      const velH = (note.velocity || 0.8) * (h - 4);
      ctx.fillStyle = this.channels[this.pianoRollChannel]?.color || '#ff4081';
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x + 2, h - velH, noteW - 4, velH);
      ctx.globalAlpha = 1;
    });

    // Label
    ctx.fillStyle = '#888';
    ctx.font = '9px sans-serif';
    ctx.fillText('VEL', 5, h - 5);
  }

  _prMouseDown(e) {
    const rect = this.prCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const L = this._prLayout;
    if (!L) return;

    const gridX = x - L.pianoKeyWidth + this.pianoRollScrollX;
    const gridY = y + this.pianoRollScrollY * L.noteH;

    if (gridX < 0) return;

    const step = Math.floor(gridX / L.stepW);
    const noteRow = Math.floor(gridY / L.noteH);
    const midi = 87 - noteRow + 21;

    if (step < 0 || step >= this.stepsPerPattern || midi < 21 || midi > 108) return;

    const notes = this._getPianoRollNotes();

    if (this.pianoRollTool === 'pencil') {
      // Check for chord stamp
      const chordSel = this.root.querySelector('[data-bind="prChord"]');
      const chordType = chordSel?.value;
      if (chordType) {
        this._pushUndo();
        const intervals = this._getChordIntervals(chordType);
        intervals.forEach(interval => {
          this.pianoRollNotes.push({
            channel: this.pianoRollChannel, midi: midi + interval,
            step, duration: 1, velocity: 0.8
          });
        });
        this._drawPianoRoll();
        return;
      }

      // Check if clicking on existing note
      const existingNote = notes.find(n => {
        return n.midi === midi && step >= n.step && step < n.step + n.duration;
      });

      if (existingNote) {
        // Check resize handle
        const noteX = L.pianoKeyWidth + existingNote.step * L.stepW - this.pianoRollScrollX;
        const noteRight = noteX + existingNote.duration * L.stepW;
        if (x > noteRight - 6 && x < noteRight + 2) {
          this.pianoRollDragging = { type: 'resize', note: existingNote, startX: x };
        } else {
          this.pianoRollDragging = { type: 'move', note: existingNote, startStep: step, startMidi: midi };
        }
      } else {
        this._pushUndo();
        const snapStep = Math.floor(step / (4 / this.pianoRollSnap)) * (4 / this.pianoRollSnap);
        this.pianoRollNotes.push({
          channel: this.pianoRollChannel, midi,
          step: Math.floor(snapStep), duration: 1, velocity: 0.8
        });
        this._drawPianoRoll();
      }
    } else if (this.pianoRollTool === 'eraser') {
      const existingNote = notes.find(n => n.midi === midi && step >= n.step && step < n.step + n.duration);
      if (existingNote) {
        this._pushUndo();
        const idx = this.pianoRollNotes.indexOf(existingNote);
        this.pianoRollNotes.splice(idx, 1);
        this._drawPianoRoll();
      }
    } else if (this.pianoRollTool === 'select') {
      this.pianoRollDragging = { type: 'select', startStep: step, startMidi: midi, startX: x, startY: y };
    }
  }

  _prMouseMove(e) {
    if (!this.pianoRollDragging || !this._prLayout) return;
    const rect = this.prCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const L = this._prLayout;
    const drag = this.pianoRollDragging;

    if (drag.type === 'resize') {
      const gridX = x - L.pianoKeyWidth + this.pianoRollScrollX;
      const newDuration = Math.max(1, Math.round(gridX / L.stepW) - drag.note.step);
      drag.note.duration = Math.max(1, Math.min(this.stepsPerPattern - drag.note.step, newDuration));
      this._drawPianoRoll();
    } else if (drag.type === 'move') {
      const gridX = x - L.pianoKeyWidth + this.pianoRollScrollX;
      const gridY = (e.clientY - rect.top) + this.pianoRollScrollY * L.noteH;
      const newStep = Math.floor(gridX / L.stepW);
      const noteRow = Math.floor(gridY / L.noteH);
      const newMidi = 87 - noteRow + 21;
      drag.note.step = Math.max(0, Math.min(this.stepsPerPattern - drag.note.duration, newStep));
      drag.note.midi = Math.max(21, Math.min(108, newMidi));
      this._drawPianoRoll();
    }
  }

  _prMouseUp(e) {
    if (this.pianoRollDragging) {
      if (this.pianoRollDragging.type === 'move' || this.pianoRollDragging.type === 'resize') {
        this._pushUndo();
      }
      this.pianoRollDragging = null;
    }
  }

  _prWheel(e) {
    e.preventDefault();
    if (e.shiftKey) {
      this.pianoRollScrollX += e.deltaY * 0.5;
    } else {
      this.pianoRollScrollY += e.deltaY * 0.02;
    }
    this.pianoRollScrollY = Math.max(0, this.pianoRollScrollY);
    this.pianoRollScrollX = Math.max(0, this.pianoRollScrollX);
    this._drawPianoRoll();
  }

  _velMouseDown(e) {
    this._velDragging = true;
    this._velUpdateAt(e);
  }

  _velMouseMove(e) {
    if (!this._velDragging) return;
    this._velUpdateAt(e);
  }

  _velMouseUp() {
    this._velDragging = false;
  }

  _velUpdateAt(e) {
    const rect = this.velCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const L = this._prLayout;
    if (!L) return;

    const gridX = x - L.pianoKeyWidth + this.pianoRollScrollX;
    const step = Math.floor(gridX / L.stepW);
    const vel = 1 - Math.max(0, Math.min(1, y / rect.height));

    const notes = this._getPianoRollNotes();
    const note = notes.find(n => step >= n.step && step < n.step + n.duration);
    if (note) {
      note.velocity = vel;
      this._drawPianoRoll();
    }
  }

  _getChordIntervals(type) {
    switch (type) {
      case 'major': return [0, 4, 7];
      case 'minor': return [0, 3, 7];
      case 'dim': return [0, 3, 6];
      case 'aug': return [0, 4, 8];
      case '7': return [0, 4, 7, 10];
      case 'maj7': return [0, 4, 7, 11];
      case 'min7': return [0, 3, 7, 10];
      default: return [0];
    }
  }

  _quantizePianoRoll() {
    this._pushUndo();
    const snapSize = 4 / this.pianoRollSnap;
    this._getPianoRollNotes().forEach(note => {
      note.step = Math.round(note.step / snapSize) * snapSize;
    });
    this._drawPianoRoll();
  }

  _clearPianoRoll() {
    this._pushUndo();
    this.pianoRollNotes = this.pianoRollNotes.filter(n => n.channel !== this.pianoRollChannel);
    this._drawPianoRoll();
  }

  /* ── FX Panel ── */
  _openFXPanel(channelIndex, slotIndex) {
    const panel = this.fxPanel;
    const fxTypes = ['none', 'reverb', 'delay', 'distortion', 'chorus', 'compressor', 'eq', 'filter'];
    let currentFX = this.engine.channels[channelIndex]?.insertSlots[slotIndex];

    panel.innerHTML = '';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'ns-fx-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => panel.classList.remove('visible'));
    panel.appendChild(closeBtn);

    const title = document.createElement('div');
    title.className = 'ns-fx-title';
    title.textContent = `${this.channels[channelIndex].name} — FX Slot ${slotIndex + 1}`;
    panel.appendChild(title);

    // Type selector
    const typeRow = document.createElement('div');
    typeRow.className = 'ns-fx-row';
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Effect Type';
    const typeSelect = document.createElement('select');
    typeSelect.className = 'ns-fx-select';
    fxTypes.forEach(t => {
      const o = document.createElement('option');
      o.value = t;
      o.textContent = t.charAt(0).toUpperCase() + t.slice(1);
      if (currentFX && currentFX.type === t) o.selected = true;
      typeSelect.appendChild(o);
    });
    typeRow.appendChild(typeLabel);
    typeRow.appendChild(typeSelect);
    panel.appendChild(typeRow);

    // Params container
    const paramsContainer = document.createElement('div');
    paramsContainer.id = 'fx-params';
    panel.appendChild(paramsContainer);

    const buildParams = (type) => {
      paramsContainer.innerHTML = '';
      if (type === 'none') {
        this.engine.setInsert(channelIndex, slotIndex, null);
        return;
      }

      const paramDefs = this._getFXParamDefs(type);
      const params = {};

      paramDefs.forEach(def => {
        const row = document.createElement('div');
        row.className = 'ns-fx-row';

        const label = document.createElement('label');
        label.textContent = def.label;
        row.appendChild(label);

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = def.min;
        slider.max = def.max;
        slider.step = def.step || 0.01;
        slider.value = def.default;
        row.appendChild(slider);

        const valDisplay = document.createElement('span');
        valDisplay.className = 'val';
        valDisplay.textContent = parseFloat(def.default).toFixed(2);
        row.appendChild(valDisplay);

        slider.addEventListener('input', () => {
          const v = parseFloat(slider.value);
          valDisplay.textContent = v.toFixed(2);
          params[def.key] = v;
          const fx = this.engine.createEffect(type, params);
          this.engine.setInsert(channelIndex, slotIndex, fx);
        });

        params[def.key] = def.default;
        paramsContainer.appendChild(row);
      });

      const fx = this.engine.createEffect(type, params);
      this.engine.setInsert(channelIndex, slotIndex, fx);
    };

    typeSelect.addEventListener('change', () => buildParams(typeSelect.value));
    buildParams(typeSelect.value);

    panel.classList.add('visible');
  }

  _getFXParamDefs(type) {
    switch (type) {
      case 'reverb': return [
        { key: 'roomSize', label: 'Room Size', min: 0.1, max: 1, step: 0.01, default: 0.5 },
        { key: 'damping', label: 'Damping', min: 0, max: 1, step: 0.01, default: 0.5 },
        { key: 'mix', label: 'Wet/Dry', min: 0, max: 1, step: 0.01, default: 0.3 },
      ];
      case 'delay': return [
        { key: 'time', label: 'Time', min: 0.01, max: 1, step: 0.01, default: 0.3 },
        { key: 'feedback', label: 'Feedback', min: 0, max: 0.95, step: 0.01, default: 0.4 },
        { key: 'mix', label: 'Wet/Dry', min: 0, max: 1, step: 0.01, default: 0.3 },
      ];
      case 'distortion': return [
        { key: 'drive', label: 'Drive', min: 0, max: 100, step: 1, default: 20 },
        { key: 'tone', label: 'Tone', min: 200, max: 10000, step: 100, default: 3000 },
        { key: 'mix', label: 'Mix', min: 0, max: 1, step: 0.01, default: 0.5 },
      ];
      case 'chorus': return [
        { key: 'rate', label: 'Rate', min: 0.1, max: 10, step: 0.1, default: 1.5 },
        { key: 'depth', label: 'Depth', min: 0.001, max: 0.01, step: 0.001, default: 0.002 },
        { key: 'mix', label: 'Mix', min: 0, max: 1, step: 0.01, default: 0.4 },
      ];
      case 'compressor': return [
        { key: 'threshold', label: 'Threshold', min: -60, max: 0, step: 1, default: -24 },
        { key: 'ratio', label: 'Ratio', min: 1, max: 20, step: 0.5, default: 4 },
        { key: 'attack', label: 'Attack', min: 0.001, max: 0.5, step: 0.001, default: 0.003 },
        { key: 'release', label: 'Release', min: 0.01, max: 1, step: 0.01, default: 0.25 },
        { key: 'makeup', label: 'Makeup', min: 1, max: 4, step: 0.1, default: 1 },
      ];
      case 'eq': return [
        { key: 'lowFreq', label: 'Low Freq', min: 50, max: 500, step: 10, default: 200 },
        { key: 'lowGain', label: 'Low Gain', min: -12, max: 12, step: 0.5, default: 0 },
        { key: 'midFreq', label: 'Mid Freq', min: 200, max: 5000, step: 100, default: 1000 },
        { key: 'midGain', label: 'Mid Gain', min: -12, max: 12, step: 0.5, default: 0 },
        { key: 'highFreq', label: 'High Freq', min: 2000, max: 16000, step: 500, default: 4000 },
        { key: 'highGain', label: 'High Gain', min: -12, max: 12, step: 0.5, default: 0 },
      ];
      case 'filter': return [
        { key: 'cutoff', label: 'Cutoff', min: 20, max: 20000, step: 10, default: 1000 },
        { key: 'resonance', label: 'Resonance', min: 0.1, max: 30, step: 0.1, default: 1 },
      ];
      default: return [];
    }
  }

  /* ── Playlist / Arrangement ── */
  _addPatternToPlaylist() {
    this.arrangement.push({ pattern: this.currentPattern, startBar: this.arrangement.length * 4 });
    this._drawPlaylist();
    const lenEl = this.root.querySelector('[data-bind="songLength"]');
    if (lenEl) lenEl.textContent = `${this.arrangement.length * 4} bars`;
  }

  _drawPlaylist() {
    const canvas = this.plCanvas;
    if (!canvas) return;
    const container = canvas.parentElement;
    const zoom = this.arrangementZoom;
    const barWidth = 40 * zoom;
    const trackHeight = 30;
    const headerH = 25;
    const totalBars = Math.max(64, this.arrangement.reduce((max, a) => Math.max(max, a.startBar + 4), 0) + 16);

    canvas.width = Math.max(container.clientWidth, totalBars * barWidth + 80);
    canvas.height = Math.max(container.clientHeight, this.numChannels * trackHeight + headerH + 20);
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const offsetX = 80;

    ctx.fillStyle = 'rgba(10,5,15,1)';
    ctx.fillRect(0, 0, w, h);

    // Bar ruler
    ctx.fillStyle = 'rgba(20,10,35,0.9)';
    ctx.fillRect(0, 0, w, headerH);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#888';
    for (let b = 0; b < totalBars; b++) {
      const x = offsetX + b * barWidth;
      ctx.strokeStyle = 'rgba(255,23,68,0.1)';
      ctx.beginPath();
      ctx.moveTo(x, headerH);
      ctx.lineTo(x, h);
      ctx.stroke();
      if (b % 4 === 0) {
        ctx.fillStyle = '#888';
        ctx.fillText(`${b + 1}`, x + 2, headerH - 6);
      }
    }

    // Track names
    for (let i = 0; i < Math.min(8, this.numChannels); i++) {
      const y = headerH + i * trackHeight;
      ctx.fillStyle = 'rgba(20,10,35,0.8)';
      ctx.fillRect(0, y, offsetX, trackHeight);
      ctx.fillStyle = this.channels[i].color;
      ctx.fillRect(0, y, 3, trackHeight);
      ctx.fillStyle = '#ccc';
      ctx.font = '9px sans-serif';
      ctx.fillText(this.channels[i].name, 8, y + trackHeight / 2 + 3);
      ctx.strokeStyle = 'rgba(255,23,68,0.05)';
      ctx.strokeRect(offsetX, y, w - offsetX, trackHeight);
    }

    // Pattern blocks
    this.arrangement.forEach((item, idx) => {
      const x = offsetX + item.startBar * barWidth;
      const bw = 4 * barWidth;
      const y = headerH;
      const ph = Math.min(8, this.numChannels) * trackHeight;

      ctx.fillStyle = 'rgba(255,23,68,0.15)';
      ctx.fillRect(x, y, bw, ph);
      ctx.strokeStyle = 'rgba(255,23,68,0.5)';
      ctx.strokeRect(x, y, bw, ph);
      ctx.fillStyle = '#ff4081';
      ctx.font = '10px sans-serif';
      ctx.fillText(item.pattern, x + 4, y + 14);
    });

    // Playhead
    if (this.engine.isPlaying) {
      const step = this.engine.currentStep;
      const bar = Math.floor(step / (this.engine.stepsPerBeat * this.engine.timeSignature[0]));
      const beatInBar = Math.floor(step / this.engine.stepsPerBeat) % this.engine.timeSignature[0];
      const px = offsetX + (bar + beatInBar / this.engine.timeSignature[0]) * barWidth;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, headerH);
      ctx.lineTo(px, h);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  }

  _plMouseDown(e) {
    // Future: drag patterns on playlist
  }
  _plMouseMove(e) {}
  _plMouseUp() {}

  /* ── Project Management ── */
  _newProject() {
    if (!confirm('Create new project? Unsaved changes will be lost.')) return;
    this.patterns = {};
    this.currentPattern = 'Pattern 1';
    this.patterns[this.currentPattern] = this._emptyPattern();
    this.arrangement = [];
    this.pianoRollNotes = [];
    this.undoStack = [];
    this.redoStack = [];
    this.projectName = 'Untitled Project';
    this._refreshAll();
  }

  _saveProject() {
    const data = {
      name: this.projectName,
      bpm: this.engine.bpm,
      timeSignature: this.engine.timeSignature,
      swing: this.engine.swing,
      patterns: this.patterns,
      currentPattern: this.currentPattern,
      arrangement: this.arrangement,
      pianoRollNotes: this.pianoRollNotes,
      channels: this.channels.map(ch => ({
        name: ch.name, color: ch.color, volume: ch.volume, pan: ch.pan, muted: ch.muted, solo: ch.solo
      })),
      channelSynths: this.channelSynths,
      stepsPerPattern: this.stepsPerPattern
    };
    localStorage.setItem('nexus-music-studio-project', JSON.stringify(data));
    alert('Project saved!');
  }

  _loadProject() {
    const raw = localStorage.getItem('nexus-music-studio-project');
    if (!raw) { alert('No saved project found.'); return; }
    try {
      const data = JSON.parse(raw);
      this.projectName = data.name || 'Untitled';
      this.engine.bpm = data.bpm || 120;
      this.engine.timeSignature = data.timeSignature || [4, 4];
      this.engine.swing = data.swing || 0;
      this.patterns = data.patterns || {};
      this.currentPattern = data.currentPattern || Object.keys(this.patterns)[0];
      this.arrangement = data.arrangement || [];
      this.pianoRollNotes = data.pianoRollNotes || [];
      this.channelSynths = data.channelSynths || this.channelSynths;
      this.stepsPerPattern = data.stepsPerPattern || 16;
      if (data.channels) {
        data.channels.forEach((ch, i) => {
          if (this.channels[i]) {
            this.channels[i].name = ch.name;
            this.channels[i].color = ch.color;
            this.channels[i].volume = ch.volume;
            this.channels[i].pan = ch.pan;
            this.engine.setChannelVolume(i, ch.volume);
            this.engine.setChannelPan(i, ch.pan);
          }
        });
      }
      this._setBPM(this.engine.bpm);
      this._refreshAll();
    } catch (e) {
      alert('Failed to load project: ' + e.message);
    }
  }

  async _exportWAV() {
    const pat = this.patterns[this.currentPattern];
    if (!pat) { alert('No pattern to export.'); return; }
    const stepDuration = 60 / this.engine.bpm / this.engine.stepsPerBeat;
    const totalDuration = this.stepsPerPattern * stepDuration + 1;

    const buffer = await this.engine.renderToBuffer((step, time, offlineCtx, dest) => {
      for (let ch = 0; ch < this.numChannels; ch++) {
        if (!pat.channels[ch] || !pat.channels[ch][step]) continue;
        const synth = this.channelSynths[ch];
        const velocity = 0.6;

        if (synth.type === 'drumSynth') {
          this._offlineDrumHit(offlineCtx, dest, synth.drumType, time, velocity);
        } else {
          const osc = offlineCtx.createOscillator();
          const g = offlineCtx.createGain();
          const presets = synth.type === 'bassSynth' ? this.synthPresets.bassSynth :
                         synth.type === 'padSynth' ? this.synthPresets.padSynth :
                         this.synthPresets.simpleSynth;
          const preset = presets[synth.presetIndex || 0];
          osc.type = preset.waveform || 'sawtooth';
          const freq = synth.type === 'bassSynth' ? NexusAudioEngine.noteToFreq('C', 2) : NexusAudioEngine.noteToFreq('C', 4);
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0, time);
          g.gain.linearRampToValueAtTime(velocity, time + (preset.attack || 0.01));
          g.gain.linearRampToValueAtTime((preset.sustain || 0.6) * velocity, time + (preset.attack || 0.01) + (preset.decay || 0.1));
          g.gain.setValueAtTime((preset.sustain || 0.6) * velocity, time + stepDuration * 0.9);
          g.gain.linearRampToValueAtTime(0, time + stepDuration + (preset.release || 0.3));
          osc.connect(g);
          g.connect(dest);
          osc.start(time);
          osc.stop(time + stepDuration + (preset.release || 0.3) + 0.1);
        }
      }
    }, totalDuration, 44100);

    const blob = this.engine.audioBufferToWav(buffer);
    this.engine.downloadWav(blob, `${this.projectName}.wav`);
  }

  _offlineDrumHit(ctx, dest, drumType, time, velocity) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    switch (drumType) {
      case 'kick':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.07);
        g.gain.setValueAtTime(velocity, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        osc.connect(g); g.connect(dest);
        osc.start(time); osc.stop(time + 0.5);
        break;
      case 'snare': {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, time);
        g.gain.setValueAtTime(0.6 * velocity, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.connect(g); g.connect(dest);
        osc.start(time); osc.stop(time + 0.15);
        const nLen = ctx.sampleRate * 0.2;
        const nBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
        const nd = nBuf.getChannelData(0);
        for (let i = 0; i < nLen; i++) nd[i] = Math.random() * 2 - 1;
        const ns = ctx.createBufferSource();
        ns.buffer = nBuf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 1000;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.7 * velocity, time);
        ng.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        ns.connect(hp); hp.connect(ng); ng.connect(dest);
        ns.start(time); ns.stop(time + 0.25);
        break;
      }
      case 'hihat': {
        const nLen = ctx.sampleRate * 0.05;
        const nBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
        const nd = nBuf.getChannelData(0);
        for (let i = 0; i < nLen; i++) nd[i] = Math.random() * 2 - 1;
        const ns = ctx.createBufferSource();
        ns.buffer = nBuf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 7000;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.4 * velocity, time);
        ng.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        ns.connect(hp); hp.connect(ng); ng.connect(dest);
        ns.start(time); ns.stop(time + 0.08);
        break;
      }
      case 'clap': {
        for (let b = 0; b < 3; b++) {
          const off = b * 0.01;
          const nLen = ctx.sampleRate * 0.15;
          const nBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
          const nd = nBuf.getChannelData(0);
          for (let i = 0; i < nLen; i++) nd[i] = Math.random() * 2 - 1;
          const ns = ctx.createBufferSource();
          ns.buffer = nBuf;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass'; bp.frequency.value = 2000;
          const ng = ctx.createGain();
          ng.gain.setValueAtTime(0.5 * velocity, time + off);
          ng.gain.exponentialRampToValueAtTime(0.001, time + off + 0.15);
          ns.connect(bp); bp.connect(ng); ng.connect(dest);
          ns.start(time + off); ns.stop(time + off + 0.16);
        }
        break;
      }
      default:
        osc.type = 'sine';
        osc.frequency.value = 200;
        g.gain.setValueAtTime(velocity, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        osc.connect(g); g.connect(dest);
        osc.start(time); osc.stop(time + 0.3);
    }
  }

  /* ── Animation Loop ── */
  _startAnimation() {
    const animate = () => {
      this.animFrameId = requestAnimationFrame(animate);
      this._updateMeters();
      this._updateMasterVU();
      if (this.engine.isPlaying && this.currentView === 'playlist') {
        this._drawPlaylist();
      }
    };
    animate();
  }

  _updateMeters() {
    const strips = this.root.querySelectorAll('.ns-mixer-strip:not(.master)');
    strips.forEach((strip, i) => {
      const fill = strip.querySelector('[data-role="meterFill"]');
      if (!fill) return;
      const peak = this.engine.getChannelPeak(i);
      fill.style.height = (peak * 100) + '%';
    });
  }

  _updateMasterVU() {
    if (!this.masterVUCanvas) return;
    const ctx = this.masterVUCanvas.getContext('2d');
    const w = this.masterVUCanvas.width;
    const h = this.masterVUCanvas.height;
    ctx.fillStyle = 'rgba(10,5,15,1)';
    ctx.fillRect(0, 0, w, h);

    const data = this.engine.getMasterFrequencyData();
    const barW = w / 16;
    for (let i = 0; i < 16; i++) {
      const val = data[i * 4] / 255;
      const barH = val * h;
      const gradient = ctx.createLinearGradient(0, h, 0, 0);
      gradient.addColorStop(0, '#00e676');
      gradient.addColorStop(0.6, '#ffeb3b');
      gradient.addColorStop(1, '#ff5252');
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barW + 1, h - barH, barW - 2, barH);
    }
  }

  destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.engine.stop();
    if (this.root) this.root.remove();
  }
}

window.NexusMusicStudio = NexusMusicStudio;
