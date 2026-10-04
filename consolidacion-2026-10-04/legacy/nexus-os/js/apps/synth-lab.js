/**
 * NexusSynthLab — Virtual Analog Synthesizer for NEXUS OS
 * Full polyphonic synth with oscillators, filters, envelopes, LFOs, effects, presets
 */
class NexusSynthLab {
  constructor() {
    this.engine = null;
    this.container = null;
    this.channelIndex = 0;
    this.activeNotes = new Map();
    this.octave = 4;
    this.sustain = false;
    this.sustainedNotes = [];
    this.animFrameId = null;
    this.oscConfig = [
      { waveform: 'sawtooth', detune: 0, octave: 0, level: 1, enabled: true },
      { waveform: 'square', detune: 7, octave: 0, level: 0.7, enabled: false },
      { waveform: 'triangle', detune: -5, octave: -1, level: 0.5, enabled: false }
    ];
    this.filterConfig = {
      a: { type: 'lowpass', cutoff: 5000, resonance: 1, enabled: true },
      b: { type: 'lowpass', cutoff: 8000, resonance: 0.5, enabled: false },
      routing: 'series',
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.3, amount: 3000 }
    };
    this.ampEnvelope = { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 };
    this.lfoConfig = [
      { waveform: 'sine', rate: 5, depth: 0, destination: 'pitch', sync: false },
      { waveform: 'triangle', rate: 0.5, depth: 0, destination: 'filter', sync: false }
    ];
    this.effects = {
      distortion: { enabled: false, drive: 20, tone: 3000, mix: 0.5 },
      chorus: { enabled: false, rate: 1.5, depth: 0.002, mix: 0.4 },
      delay: { enabled: false, time: 0.3, feedback: 0.4, mix: 0.3 },
      reverb: { enabled: false, roomSize: 0.5, damping: 0.5, mix: 0.3 }
    };
    this.modMatrix = [];
    this.presets = {};
    this.currentPreset = null;
    this._initPresets();
    this._keyMap = {};
    this._heldKeys = new Set();
  }

  _initPresets() {
    this.presets = {
      Leads: [
        { name: 'Fat Lead', osc: [{waveform:'sawtooth',detune:0,octave:0,level:1,enabled:true},{waveform:'sawtooth',detune:12,octave:0,level:0.6,enabled:true}], filter:{a:{type:'lowpass',cutoff:3000,resonance:4,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.02,decay:0.15,sustain:0.3,release:0.2,amount:4000}}, amp:{attack:0.01,decay:0.1,sustain:0.8,release:0.2} },
        { name: 'Scream Lead', osc: [{waveform:'square',detune:0,octave:0,level:1,enabled:true},{waveform:'sawtooth',detune:-7,octave:0,level:0.8,enabled:true}], filter:{a:{type:'lowpass',cutoff:2000,resonance:8,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.01,decay:0.1,sustain:0.5,release:0.15,amount:5000}}, amp:{attack:0.005,decay:0.05,sustain:0.9,release:0.1} },
        { name: 'Pluck Lead', osc: [{waveform:'triangle',detune:0,octave:0,level:1,enabled:true}], filter:{a:{type:'lowpass',cutoff:4000,resonance:2,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.001,decay:0.2,sustain:0.05,release:0.1,amount:6000}}, amp:{attack:0.001,decay:0.2,sustain:0.1,release:0.15} },
        { name: 'Whistle Lead', osc: [{waveform:'sine',detune:0,octave:1,level:1,enabled:true}], filter:{a:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.05,decay:0.1,sustain:0.6,release:0.3,amount:2000}}, amp:{attack:0.05,decay:0.1,sustain:0.7,release:0.3} },
        { name: 'Brass Lead', osc: [{waveform:'sawtooth',detune:0,octave:0,level:1,enabled:true},{waveform:'sawtooth',detune:5,octave:0,level:0.7,enabled:true}], filter:{a:{type:'lowpass',cutoff:1200,resonance:2,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.05,decay:0.15,sustain:0.6,release:0.2,amount:3000}}, amp:{attack:0.05,decay:0.15,sustain:0.8,release:0.2} },
      ],
      Basses: [
        { name: 'Sub Bass', osc: [{waveform:'sine',detune:0,octave:-1,level:1,enabled:true}], filter:{a:{type:'lowpass',cutoff:200,resonance:1,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.01,decay:0.1,sustain:0.8,release:0.2,amount:100}}, amp:{attack:0.005,decay:0.1,sustain:0.8,release:0.2} },
        { name: 'Growl Bass', osc: [{waveform:'sawtooth',detune:0,octave:-1,level:1,enabled:true},{waveform:'square',detune:3,octave:-1,level:0.5,enabled:true}], filter:{a:{type:'lowpass',cutoff:800,resonance:8,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.01,decay:0.2,sustain:0.4,release:0.1,amount:3000}}, amp:{attack:0.005,decay:0.1,sustain:0.7,release:0.1} },
        { name: 'Pluck Bass', osc: [{waveform:'triangle',detune:0,octave:-1,level:1,enabled:true}], filter:{a:{type:'lowpass',cutoff:1500,resonance:2,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.001,decay:0.25,sustain:0.05,release:0.1,amount:4000}}, amp:{attack:0.001,decay:0.2,sustain:0.1,release:0.15} },
        { name: 'FM Bass', osc: [{waveform:'square',detune:0,octave:-1,level:1,enabled:true},{waveform:'sine',detune:0,octave:-2,level:0.6,enabled:true}], filter:{a:{type:'lowpass',cutoff:1200,resonance:2,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.005,decay:0.2,sustain:0.4,release:0.1,amount:2000}}, amp:{attack:0.005,decay:0.15,sustain:0.5,release:0.1} },
        { name: 'Acid Bass', osc: [{waveform:'sawtooth',detune:0,octave:-1,level:1,enabled:true}], filter:{a:{type:'lowpass',cutoff:400,resonance:14,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.001,decay:0.12,sustain:0.2,release:0.05,amount:5000}}, amp:{attack:0.005,decay:0.1,sustain:0.3,release:0.1} },
        { name: 'Reese Bass', osc: [{waveform:'sawtooth',detune:-7,octave:-1,level:1,enabled:true},{waveform:'sawtooth',detune:7,octave:-1,level:1,enabled:true}], filter:{a:{type:'lowpass',cutoff:500,resonance:2,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.02,decay:0.2,sustain:0.6,release:0.3,amount:1500}}, amp:{attack:0.05,decay:0.2,sustain:0.7,release:0.4} },
      ],
      Pads: [
        { name: 'Warm Pad', osc: [{waveform:'sawtooth',detune:0,octave:0,level:1,enabled:true},{waveform:'sawtooth',detune:7,octave:0,level:0.8,enabled:true}], filter:{a:{type:'lowpass',cutoff:2500,resonance:0.5,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.1,decay:0.3,sustain:0.7,release:0.5,amount:2000}}, amp:{attack:0.5,decay:0.5,sustain:0.8,release:1.5} },
        { name: 'Ice Pad', osc: [{waveform:'sine',detune:0,octave:0,level:1,enabled:true},{waveform:'triangle',detune:12,octave:0,level:0.6,enabled:true}], filter:{a:{type:'lowpass',cutoff:4000,resonance:0.5,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.1,decay:0.3,sustain:0.6,release:0.5,amount:3000}}, amp:{attack:0.8,decay:0.5,sustain:0.7,release:2.0} },
        { name: 'Choir Pad', osc: [{waveform:'sawtooth',detune:0,octave:0,level:1,enabled:true},{waveform:'sine',detune:5,octave:0,level:0.7,enabled:true}], filter:{a:{type:'lowpass',cutoff:1800,resonance:1,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.08,decay:0.3,sustain:0.5,release:0.5,amount:2500}}, amp:{attack:0.6,decay:0.4,sustain:0.75,release:1.8} },
        { name: 'Ambient Pad', osc: [{waveform:'sine',detune:0,octave:0,level:1,enabled:true},{waveform:'triangle',detune:15,octave:1,level:0.4,enabled:true}], filter:{a:{type:'lowpass',cutoff:2000,resonance:1,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.2,decay:0.5,sustain:0.5,release:0.8,amount:3000}}, amp:{attack:1.5,decay:0.8,sustain:0.6,release:3.0} },
        { name: 'Glass Pad', osc: [{waveform:'sine',detune:0,octave:0,level:1,enabled:true},{waveform:'sine',detune:3,octave:1,level:0.5,enabled:true}], filter:{a:{type:'lowpass',cutoff:6000,resonance:0.5,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.1,decay:0.2,sustain:0.5,release:0.4,amount:4000}}, amp:{attack:1.0,decay:0.3,sustain:0.6,release:2.5} },
        { name: 'Evolving Pad', osc: [{waveform:'sawtooth',detune:-10,octave:0,level:1,enabled:true},{waveform:'sawtooth',detune:10,octave:0,level:1,enabled:true}], filter:{a:{type:'lowpass',cutoff:800,resonance:3,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.15,decay:0.5,sustain:0.6,release:0.8,amount:6000}}, amp:{attack:1.2,decay:0.5,sustain:0.7,release:2.5} },
      ],
      Plucks: [
        { name: 'Guitar Pluck', osc: [{waveform:'sawtooth',detune:0,octave:0,level:1,enabled:true}], filter:{a:{type:'lowpass',cutoff:3500,resonance:2,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.001,decay:0.3,sustain:0.05,release:0.1,amount:5000}}, amp:{attack:0.001,decay:0.2,sustain:0.1,release:0.2} },
        { name: 'Harp Pluck', osc: [{waveform:'triangle',detune:0,octave:0,level:1,enabled:true}], filter:{a:{type:'lowpass',cutoff:5000,resonance:1,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.001,decay:0.4,sustain:0.05,release:0.1,amount:4000}}, amp:{attack:0.001,decay:0.3,sustain:0.08,release:0.3} },
        { name: 'Digital Pluck', osc: [{waveform:'square',detune:0,octave:0,level:1,enabled:true}], filter:{a:{type:'lowpass',cutoff:2000,resonance:5,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.001,decay:0.15,sustain:0.05,release:0.05,amount:6000}}, amp:{attack:0.001,decay:0.1,sustain:0.05,release:0.1} },
        { name: 'Kalimba', osc: [{waveform:'sine',detune:0,octave:0,level:1,enabled:true},{waveform:'triangle',detune:0,octave:1,level:0.3,enabled:true}], filter:{a:{type:'lowpass',cutoff:4000,resonance:1,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.001,decay:0.5,sustain:0.02,release:0.2,amount:3000}}, amp:{attack:0.001,decay:0.4,sustain:0.05,release:0.5} },
      ],
      FX: [
        { name: 'Riser', osc: [{waveform:'sawtooth',detune:0,octave:0,level:1,enabled:true},{waveform:'sawtooth',detune:5,octave:0,level:0.8,enabled:true}], filter:{a:{type:'lowpass',cutoff:200,resonance:5,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.5,decay:0.5,sustain:0.8,release:1.0,amount:10000}}, amp:{attack:1.0,decay:0.5,sustain:0.8,release:0.5} },
        { name: 'Sweep', osc: [{waveform:'sawtooth',detune:0,octave:0,level:1,enabled:true}], filter:{a:{type:'lowpass',cutoff:100,resonance:8,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.3,decay:0.5,sustain:0.5,release:0.8,amount:15000}}, amp:{attack:0.5,decay:0.5,sustain:0.6,release:1.0} },
        { name: 'Laser', osc: [{waveform:'sawtooth',detune:0,octave:1,level:1,enabled:true}], filter:{a:{type:'lowpass',cutoff:8000,resonance:3,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.001,decay:0.3,sustain:0.01,release:0.1,amount:-7000}}, amp:{attack:0.001,decay:0.3,sustain:0.01,release:0.1} },
        { name: 'Explosion', osc: [{waveform:'sawtooth',detune:0,octave:-1,level:1,enabled:true},{waveform:'square',detune:12,octave:-1,level:0.6,enabled:true}], filter:{a:{type:'lowpass',cutoff:5000,resonance:2,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.001,decay:0.5,sustain:0.1,release:0.3,amount:-4000}}, amp:{attack:0.001,decay:0.5,sustain:0.1,release:0.8} },
        { name: 'Wind', osc: [{waveform:'sawtooth',detune:0,octave:0,level:0.5,enabled:true}], filter:{a:{type:'bandpass',cutoff:1000,resonance:3,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.2,decay:0.3,sustain:0.6,release:0.5,amount:2000}}, amp:{attack:0.8,decay:0.5,sustain:0.6,release:1.5} },
        { name: 'Rain', osc: [{waveform:'triangle',detune:0,octave:1,level:0.3,enabled:true}], filter:{a:{type:'highpass',cutoff:3000,resonance:1,enabled:true},b:{type:'lowpass',cutoff:8000,resonance:0.5,enabled:false},routing:'series',envelope:{attack:0.1,decay:0.2,sustain:0.4,release:0.3,amount:3000}}, amp:{attack:0.5,decay:0.3,sustain:0.5,release:1.0} },
      ]
    };
  }

  async init(container) {
    this.container = container;
    this.engine = window.nexusAudio;
    await this.engine.init();
    this.engine.createChannel(this.channelIndex, 'SynthLab');
    this.engine.setChannelVolume(this.channelIndex, 0.8);
    this._injectStyles();
    this._buildDOM();
    this._bindEvents();
    this._setupKeyboard();
    this._startAnimation();
  }

  _injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .nexus-synth { width:100%; height:100%; background:rgba(10,5,15,0.95); color:#e0d0e8; font-family:'Segoe UI',sans-serif; font-size:11px; overflow-y:auto; user-select:none; display:flex; flex-direction:column; }
      .nexus-synth * { box-sizing:border-box; }
      .ns-header { display:flex; align-items:center; gap:10px; padding:8px 12px; background:rgba(20,10,30,0.9); border-bottom:1px solid rgba(255,23,68,0.3); flex-shrink:0; }
      .ns-header h2 { margin:0; font-size:14px; color:#ff4081; letter-spacing:3px; text-transform:uppercase; text-shadow:0 0 10px rgba(255,23,68,0.5); }
      .ns-preset-bar { display:flex; align-items:center; gap:8px; padding:6px 12px; background:rgba(15,8,25,0.9); border-bottom:1px solid rgba(255,23,68,0.15); flex-shrink:0; flex-wrap:wrap; }
      .ns-preset-cat { background:rgba(30,15,45,0.8); border:1px solid rgba(255,23,68,0.2); color:#ff6090; padding:3px 8px; border-radius:3px; font-size:10px; outline:none; }
      .ns-preset-list { background:rgba(30,15,45,0.8); border:1px solid rgba(255,23,68,0.2); color:#ff6090; padding:3px 8px; border-radius:3px; font-size:10px; outline:none; min-width:120px; }
      .ns-preset-name { font-size:13px; color:#fff; font-weight:bold; min-width:100px; text-align:center; }
      .ns-synth-body { flex:1; display:flex; flex-wrap:wrap; gap:8px; padding:8px; overflow-y:auto; align-content:flex-start; }
      .ns-section { background:rgba(20,10,35,0.8); border:1px solid rgba(255,23,68,0.15); border-radius:8px; padding:10px; backdrop-filter:blur(5px); }
      .ns-section-title { font-size:10px; color:#ff4081; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px; padding-bottom:4px; border-bottom:1px solid rgba(255,23,68,0.15); }
      .ns-osc-section { width:calc(50% - 4px); }
      .ns-mixer-section { width:calc(50% - 4px); }
      .ns-filter-section { width:calc(50% - 4px); }
      .ns-env-section { width:calc(50% - 4px); }
      .ns-lfo-section { width:calc(33.33% - 6px); }
      .ns-fx-section { width:calc(33.33% - 6px); }
      .ns-mod-section { width:calc(33.33% - 6px); }
      .ns-keyboard-section { width:100%; }
      .ns-viz-section { width:100%; display:flex; gap:8px; }
      .ns-viz-box { flex:1; background:rgba(10,5,15,0.9); border:1px solid rgba(255,23,68,0.15); border-radius:6px; overflow:hidden; }
      .ns-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap; }
      .ns-label { font-size:9px; color:#888; min-width:45px; text-transform:uppercase; }
      .ns-val { font-size:10px; color:#ff6090; min-width:35px; text-align:right; font-family:monospace; }
      .ns-knob-s { position:relative; width:32px; height:32px; cursor:pointer; }
      .ns-knob-s .knob-body { width:32px; height:32px; border-radius:50%; background:radial-gradient(circle at 40% 35%, rgba(60,30,80,0.9), rgba(20,10,35,0.95)); border:2px solid rgba(255,23,68,0.3); position:relative; transition:transform 0.05s; }
      .ns-knob-s .knob-indicator { position:absolute; top:3px; left:50%; width:2px; height:12px; background:#ff4081; border-radius:1px; transform-origin:bottom center; transform:translateX(-50%); }
      .ns-knob-s .knob-label { font-size:8px; color:#888; text-align:center; margin-top:2px; }
      .ns-wave-sel { display:flex; gap:2px; }
      .ns-wave-btn { width:24px; height:20px; border:1px solid rgba(255,23,68,0.2); background:rgba(30,15,45,0.8); color:#888; font-size:10px; border-radius:3px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
      .ns-wave-btn.active { background:rgba(255,23,68,0.25); border-color:#ff1744; color:#ff4081; box-shadow:0 0 4px rgba(255,23,68,0.3); }
      .ns-toggle { width:28px; height:16px; border-radius:8px; background:rgba(30,15,45,0.8); border:1px solid rgba(255,23,68,0.2); cursor:pointer; position:relative; }
      .ns-toggle::after { content:''; position:absolute; top:2px; left:2px; width:10px; height:10px; border-radius:50%; background:#666; transition:all 0.15s; }
      .ns-toggle.active::after { left:14px; background:#ff4081; box-shadow:0 0 4px rgba(255,23,68,0.5); }
      .ns-toggle.active { border-color:rgba(255,23,68,0.4); }
      .ns-slider { -webkit-appearance:none; width:80px; height:4px; background:rgba(255,23,68,0.2); border-radius:2px; outline:none; }
      .ns-slider::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; background:#ff4081; border-radius:50%; cursor:pointer; box-shadow:0 0 4px rgba(255,23,68,0.5); }
      .ns-select { background:rgba(30,15,45,0.9); border:1px solid rgba(255,23,68,0.2); color:#ff6090; padding:2px 6px; border-radius:3px; font-size:10px; outline:none; }
      .ns-env-display { width:100%; height:40px; background:rgba(10,5,15,0.8); border:1px solid rgba(255,23,68,0.1); border-radius:4px; }
      .ns-keyboard { display:flex; position:relative; height:100px; width:100%; }
      .ns-white-key { flex:1; background:linear-gradient(to bottom, rgba(40,20,60,0.9), rgba(25,12,40,0.95)); border:1px solid rgba(255,23,68,0.15); border-radius:0 0 4px 4px; cursor:pointer; transition:background 0.05s; position:relative; z-index:1; }
      .ns-white-key:hover { background:rgba(255,23,68,0.15); }
      .ns-white-key.active { background:rgba(255,23,68,0.3); box-shadow:inset 0 0 10px rgba(255,23,68,0.3); }
      .ns-black-key { position:absolute; width:28px; height:60px; background:linear-gradient(to bottom, rgba(15,8,25,0.98), rgba(10,5,15,0.98)); border:1px solid rgba(255,23,68,0.2); border-radius:0 0 3px 3px; cursor:pointer; z-index:2; transition:background 0.05s; }
      .ns-black-key:hover { background:rgba(255,23,68,0.2); }
      .ns-black-key.active { background:rgba(255,23,68,0.35); box-shadow:0 0 8px rgba(255,23,68,0.4); }
      .ns-key-label { position:absolute; bottom:3px; left:50%; transform:translateX(-50%); font-size:8px; color:#666; pointer-events:none; }
      .ns-pitch-mod { display:flex; gap:12px; align-items:center; }
      .ns-wheel { width:30px; height:80px; background:rgba(20,10,35,0.9); border:1px solid rgba(255,23,68,0.2); border-radius:4px; position:relative; cursor:grab; overflow:hidden; }
      .ns-wheel-fill { position:absolute; bottom:0; width:100%; background:rgba(255,23,68,0.3); border-radius:0 0 3px 3px; }
      .ns-wheel-label { font-size:8px; color:#888; text-align:center; margin-top:2px; }
      .ns-mod-row { display:flex; align-items:center; gap:4px; margin-bottom:4px; }
      .ns-mod-select { background:rgba(30,15,45,0.9); border:1px solid rgba(255,23,68,0.2); color:#ff6090; padding:1px 4px; border-radius:2px; font-size:9px; outline:none; width:70px; }
      .ns-mod-add { background:rgba(255,23,68,0.2); border:1px solid rgba(255,23,68,0.3); color:#ff4081; padding:2px 6px; border-radius:3px; cursor:pointer; font-size:9px; }
      .ns-mod-remove { background:rgba(255,50,50,0.2); border:1px solid rgba(255,50,50,0.3); color:#ff5252; padding:1px 4px; border-radius:2px; cursor:pointer; font-size:8px; }
      .ns-oct-btn { background:rgba(30,15,45,0.8); border:1px solid rgba(255,23,68,0.2); color:#ff6090; padding:3px 8px; border-radius:3px; cursor:pointer; font-size:10px; }
      .ns-oct-btn:hover { background:rgba(255,23,68,0.2); }
    `;
    this.container.appendChild(style);
  }

  _buildDOM() {
    const root = document.createElement('div');
    root.className = 'nexus-synth';

    // Header
    const header = document.createElement('div');
    header.className = 'ns-header';
    header.innerHTML = `<h2>Synth Lab</h2>`;
    root.appendChild(header);

    // Preset bar
    const presetBar = document.createElement('div');
    presetBar.className = 'ns-preset-bar';
    const catSel = document.createElement('select');
    catSel.className = 'ns-preset-cat';
    catSel.id = 'sl-cat';
    Object.keys(this.presets).forEach(cat => {
      const o = document.createElement('option');
      o.value = cat;
      o.textContent = cat;
      catSel.appendChild(o);
    });
    const listSel = document.createElement('select');
    listSel.className = 'ns-preset-list';
    listSel.id = 'sl-list';
    const presetName = document.createElement('span');
    presetName.className = 'ns-preset-name';
    presetName.id = 'sl-pname';
    presetName.textContent = 'Init';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'ns-mod-add';
    saveBtn.textContent = 'Save Preset';
    saveBtn.id = 'sl-save';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search...';
    searchInput.style.cssText = 'background:rgba(30,15,45,0.9);border:1px solid rgba(255,23,68,0.2);color:#ff6090;padding:3px 8px;border-radius:3px;font-size:10px;outline:none;width:100px;';
    searchInput.id = 'sl-search';

    presetBar.appendChild(catSel);
    presetBar.appendChild(listSel);
    presetBar.appendChild(presetName);
    presetBar.appendChild(saveBtn);
    presetBar.appendChild(searchInput);
    root.appendChild(presetBar);

    // Body
    const body = document.createElement('div');
    body.className = 'ns-synth-body';

    // Oscillators section
    body.appendChild(this._buildOscSection());
    // Mixer section
    body.appendChild(this._buildMixerSection());
    // Filters section
    body.appendChild(this._buildFilterSection());
    // Envelopes section
    body.appendChild(this._buildEnvelopeSection());
    // LFO section
    body.appendChild(this._buildLFOSection());
    // Effects section
    body.appendChild(this._buildEffectsSection());
    // Mod matrix
    body.appendChild(this._buildModMatrixSection());
    // Visualizations
    body.appendChild(this._buildVizSection());
    // Keyboard
    body.appendChild(this._buildKeyboardSection());

    root.appendChild(body);
    this.container.appendChild(root);
    this.root = root;

    this._updatePresetList();
  }

  _createKnob(label, initial, min, max, onChange) {
    const container = document.createElement('div');
    container.className = 'ns-knob-s';
    const body = document.createElement('div');
    body.className = 'knob-body';
    const indicator = document.createElement('div');
    indicator.className = 'knob-indicator';
    body.appendChild(indicator);
    container.appendChild(body);
    const labelEl = document.createElement('div');
    labelEl.className = 'knob-label';
    labelEl.textContent = label;
    container.appendChild(labelEl);

    let value = initial;
    let dragging = false;
    let startY = 0;
    let startVal = 0;

    const update = () => {
      const norm = (value - min) / (max - min);
      const angle = -135 + norm * 270;
      body.style.transform = `rotate(${angle}deg)`;
    };
    update();

    body.addEventListener('mousedown', (e) => {
      dragging = true;
      startY = e.clientY;
      startVal = value;
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dy = startY - e.clientY;
      value = Math.max(min, Math.min(max, startVal + (dy / 150) * (max - min)));
      update();
      if (onChange) onChange(value);
    });
    document.addEventListener('mouseup', () => { dragging = false; });
    body.addEventListener('dblclick', () => { value = (min + max) / 2; update(); if (onChange) onChange(value); });

    container._setValue = (v) => { value = Math.max(min, Math.min(max, v)); update(); if (onChange) onChange(value); };
    container._getValue = () => value;
    return container;
  }

  _buildOscSection() {
    const section = document.createElement('div');
    section.className = 'ns-section ns-osc-section';
    section.innerHTML = '<div class="ns-section-title">Oscillators</div>';

    const waveforms = ['sine', 'square', 'sawtooth', 'triangle'];
    const waveSymbols = ['∿', '⊓', '⩘', '△'];

    for (let i = 0; i < 3; i++) {
      const row = document.createElement('div');
      row.className = 'ns-row';

      // Enable toggle
      const toggle = document.createElement('div');
      toggle.className = 'ns-toggle' + (this.oscConfig[i].enabled ? ' active' : '');
      toggle.addEventListener('click', () => {
        this.oscConfig[i].enabled = !this.oscConfig[i].enabled;
        toggle.classList.toggle('active', this.oscConfig[i].enabled);
      });
      row.appendChild(toggle);

      // OSC label
      const label = document.createElement('span');
      label.style.cssText = 'font-size:10px;color:#ff4081;font-weight:bold;min-width:30px;';
      label.textContent = `OSC${i+1}`;
      row.appendChild(label);

      // Waveform selector
      const waveSel = document.createElement('div');
      waveSel.className = 'ns-wave-sel';
      waveforms.forEach((wf, wi) => {
        const btn = document.createElement('div');
        btn.className = 'ns-wave-btn' + (this.oscConfig[i].waveform === wf ? ' active' : '');
        btn.textContent = waveSymbols[wi];
        btn.title = wf;
        btn.addEventListener('click', () => {
          waveSel.querySelectorAll('.ns-wave-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.oscConfig[i].waveform = wf;
        });
        waveSel.appendChild(btn);
      });
      row.appendChild(waveSel);

      // Octave
      const octLabel = document.createElement('span');
      octLabel.className = 'ns-label';
      octLabel.textContent = 'Oct';
      row.appendChild(octLabel);
      const octKnob = this._createKnob('Oct', this.oscConfig[i].octave, -2, 2, (v) => {
        this.oscConfig[i].octave = Math.round(v);
      });
      row.appendChild(octKnob);

      // Detune
      const detKnob = this._createKnob('Det', this.oscConfig[i].detune, -100, 100, (v) => {
        this.oscConfig[i].detune = v;
      });
      row.appendChild(detKnob);

      // Level
      const lvlKnob = this._createKnob('Lvl', this.oscConfig[i].level, 0, 1, (v) => {
        this.oscConfig[i].level = v;
      });
      row.appendChild(lvlKnob);

      section.appendChild(row);
    }
    return section;
  }

  _buildMixerSection() {
    const section = document.createElement('div');
    section.className = 'ns-section ns-mixer-section';
    section.innerHTML = '<div class="ns-section-title">Mixer</div>';

    const row = document.createElement('div');
    row.className = 'ns-row';

    const volKnob = this._createKnob('Vol', 0.8, 0, 1, (v) => {
      this.engine.setChannelVolume(this.channelIndex, v);
    });
    row.appendChild(volKnob);

    const panKnob = this._createKnob('Pan', 0, -1, 1, (v) => {
      this.engine.setChannelPan(this.channelIndex, v);
    });
    row.appendChild(panKnob);

    section.appendChild(row);
    return section;
  }

  _buildFilterSection() {
    const section = document.createElement('div');
    section.className = 'ns-section ns-filter-section';
    section.innerHTML = '<div class="ns-section-title">Filters</div>';

    ['a', 'b'].forEach(id => {
      const row = document.createElement('div');
      row.className = 'ns-row';
      const cfg = this.filterConfig[id];

      const toggle = document.createElement('div');
      toggle.className = 'ns-toggle' + (cfg.enabled ? ' active' : '');
      toggle.addEventListener('click', () => {
        cfg.enabled = !cfg.enabled;
        toggle.classList.toggle('active', cfg.enabled);
      });
      row.appendChild(toggle);

      const label = document.createElement('span');
      label.style.cssText = 'font-size:10px;color:#ff4081;font-weight:bold;';
      label.textContent = `Filter ${id.toUpperCase()}`;
      row.appendChild(label);

      // Type select
      const typeSel = document.createElement('select');
      typeSel.className = 'ns-select';
      ['lowpass', 'highpass', 'bandpass', 'notch'].forEach(t => {
        const o = document.createElement('option');
        o.value = t;
        o.textContent = t.charAt(0).toUpperCase() + t.slice(1, 3);
        if (cfg.type === t) o.selected = true;
        typeSel.appendChild(o);
      });
      typeSel.addEventListener('change', () => { cfg.type = typeSel.value; });
      row.appendChild(typeSel);

      const cutoffKnob = this._createKnob('Cut', cfg.cutoff, 20, 20000, (v) => { cfg.cutoff = v; });
      row.appendChild(cutoffKnob);

      const resKnob = this._createKnob('Res', cfg.resonance, 0.1, 30, (v) => { cfg.resonance = v; });
      row.appendChild(resKnob);

      section.appendChild(row);
    });

    // Routing
    const routeRow = document.createElement('div');
    routeRow.className = 'ns-row';
    const routeLabel = document.createElement('span');
    routeLabel.className = 'ns-label';
    routeLabel.textContent = 'Route';
    routeRow.appendChild(routeLabel);
    const routeSel = document.createElement('select');
    routeSel.className = 'ns-select';
    ['series', 'parallel'].forEach(r => {
      const o = document.createElement('option');
      o.value = r;
      o.textContent = r.charAt(0).toUpperCase() + r.slice(1);
      if (this.filterConfig.routing === r) o.selected = true;
      routeSel.appendChild(o);
    });
    routeSel.addEventListener('change', () => { this.filterConfig.routing = routeSel.value; });
    routeRow.appendChild(routeSel);
    section.appendChild(routeRow);

    // Filter envelope
    const envLabel = document.createElement('div');
    envLabel.style.cssText = 'font-size:9px;color:#888;margin-top:4px;';
    envLabel.textContent = 'Filter Envelope';
    section.appendChild(envLabel);

    const fe = this.filterConfig.envelope;
    const envRow = document.createElement('div');
    envRow.className = 'ns-row';
    ['attack', 'decay', 'sustain', 'release', 'amount'].forEach(param => {
      const max = param === 'amount' ? 15000 : 2;
      const min = param === 'amount' ? -5000 : 0.001;
      const knob = this._createKnob(param.charAt(0).toUpperCase(), fe[param], min, max, (v) => {
        fe[param] = v;
      });
      envRow.appendChild(knob);
    });
    section.appendChild(envRow);

    return section;
  }

  _buildEnvelopeSection() {
    const section = document.createElement('div');
    section.className = 'ns-section ns-env-section';
    section.innerHTML = '<div class="ns-section-title">Amp Envelope</div>';

    const row = document.createElement('div');
    row.className = 'ns-row';

    ['attack', 'decay', 'sustain', 'release'].forEach(param => {
      const max = param === 'attack' || param === 'decay' ? 2 : param === 'sustain' ? 1 : 3;
      const knob = this._createKnob(param.charAt(0).toUpperCase(), this.ampEnvelope[param], 0.001, max, (v) => {
        this.ampEnvelope[param] = v;
        this._drawEnvelopeDisplay();
      });
      row.appendChild(knob);
    });

    section.appendChild(row);

    // ADSR display
    this.envCanvas = document.createElement('canvas');
    this.envCanvas.className = 'ns-env-display';
    this.envCanvas.width = 400;
    this.envCanvas.height = 40;
    section.appendChild(this.envCanvas);

    return section;
  }

  _drawEnvelopeDisplay() {
    if (!this.envCanvas) return;
    const ctx = this.envCanvas.getContext('2d');
    const w = this.envCanvas.width;
    const h = this.envCanvas.height;
    const env = this.ampEnvelope;
    const total = env.attack + env.decay + 0.3 + env.release;

    ctx.fillStyle = 'rgba(10,5,15,1)';
    ctx.fillRect(0, 0, w, h);

    const scaleX = (w - 20) / total;
    const x0 = 10;
    const yBottom = h - 5;
    const yTop = 5;
    const ySustain = yBottom - (yBottom - yTop) * env.sustain;

    ctx.strokeStyle = '#ff4081';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255,23,68,0.5)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(x0, yBottom);
    ctx.lineTo(x0 + env.attack * scaleX, yTop);
    ctx.lineTo(x0 + (env.attack + env.decay) * scaleX, ySustain);
    ctx.lineTo(x0 + (env.attack + env.decay + 0.3) * scaleX, ySustain);
    ctx.lineTo(x0 + total * scaleX, yBottom);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Labels
    ctx.fillStyle = '#666';
    ctx.font = '8px monospace';
    ctx.fillText('A', x0 + env.attack * scaleX * 0.5, h - 1);
    ctx.fillText('D', x0 + (env.attack + env.decay * 0.5) * scaleX, h - 1);
    ctx.fillText('S', x0 + (env.attack + env.decay + 0.15) * scaleX, h - 1);
    ctx.fillText('R', x0 + (total - env.release * 0.5) * scaleX, h - 1);
  }

  _buildLFOSection() {
    const section = document.createElement('div');
    section.className = 'ns-section ns-lfo-section';
    section.innerHTML = '<div class="ns-section-title">LFO</div>';

    for (let i = 0; i < 2; i++) {
      const cfg = this.lfoConfig[i];
      const row = document.createElement('div');
      row.className = 'ns-row';

      const label = document.createElement('span');
      label.style.cssText = 'font-size:10px;color:#ff4081;font-weight:bold;min-width:30px;';
      label.textContent = `LFO${i+1}`;
      row.appendChild(label);

      // Waveform
      const waveSel = document.createElement('select');
      waveSel.className = 'ns-select';
      ['sine', 'square', 'sawtooth', 'triangle'].forEach(w => {
        const o = document.createElement('option');
        o.value = w;
        o.textContent = w.charAt(0).toUpperCase() + w.slice(1, 4);
        if (cfg.waveform === w) o.selected = true;
        waveSel.appendChild(o);
      });
      waveSel.addEventListener('change', () => { cfg.waveform = waveSel.value; });
      row.appendChild(waveSel);

      const rateKnob = this._createKnob('Rate', cfg.rate, 0.1, 20, (v) => { cfg.rate = v; });
      row.appendChild(rateKnob);

      const depthKnob = this._createKnob('Depth', cfg.depth, 0, 1, (v) => { cfg.depth = v; });
      row.appendChild(depthKnob);

      // Destination
      const destSel = document.createElement('select');
      destSel.className = 'ns-select';
      ['pitch', 'filter', 'volume', 'pan'].forEach(d => {
        const o = document.createElement('option');
        o.value = d;
        o.textContent = d.charAt(0).toUpperCase() + d.slice(1);
        if (cfg.destination === d) o.selected = true;
        destSel.appendChild(o);
      });
      destSel.addEventListener('change', () => { cfg.destination = destSel.value; });
      row.appendChild(destSel);

      section.appendChild(row);
    }
    return section;
  }

  _buildEffectsSection() {
    const section = document.createElement('div');
    section.className = 'ns-section ns-fx-section';
    section.innerHTML = '<div class="ns-section-title">Effects</div>';

    ['distortion', 'chorus', 'delay', 'reverb'].forEach(fxName => {
      const cfg = this.effects[fxName];
      const row = document.createElement('div');
      row.className = 'ns-row';

      const toggle = document.createElement('div');
      toggle.className = 'ns-toggle' + (cfg.enabled ? ' active' : '');
      toggle.addEventListener('click', () => {
        cfg.enabled = !cfg.enabled;
        toggle.classList.toggle('active', cfg.enabled);
        this._rebuildEffects();
      });
      row.appendChild(toggle);

      const label = document.createElement('span');
      label.style.cssText = 'font-size:10px;color:#ff6090;min-width:55px;';
      label.textContent = fxName.charAt(0).toUpperCase() + fxName.slice(1);
      row.appendChild(label);

      const mixKnob = this._createKnob('Mix', cfg.mix, 0, 1, (v) => {
        cfg.mix = v;
        this._rebuildEffects();
      });
      row.appendChild(mixKnob);

      section.appendChild(row);
    });

    return section;
  }

  _buildModMatrixSection() {
    const section = document.createElement('div');
    section.className = 'ns-section ns-mod-section';
    section.innerHTML = '<div class="ns-section-title">Mod Matrix</div>';

    this.modMatrixContainer = document.createElement('div');
    section.appendChild(this.modMatrixContainer);

    const addBtn = document.createElement('button');
    addBtn.className = 'ns-mod-add';
    addBtn.textContent = '+ Add Route';
    addBtn.addEventListener('click', () => {
      this.modMatrix.push({ source: 'lfo1', destination: 'pitch', amount: 0 });
      this._rebuildModMatrix();
    });
    section.appendChild(addBtn);

    return section;
  }

  _rebuildModMatrix() {
    if (!this.modMatrixContainer) return;
    this.modMatrixContainer.innerHTML = '';
    const sources = ['lfo1', 'lfo2', 'env1', 'env2', 'keyboard'];
    const dests = ['osc1_pitch', 'osc2_pitch', 'osc3_pitch', 'filter_a_cut', 'filter_b_cut', 'volume', 'pan'];

    this.modMatrix.forEach((route, idx) => {
      const row = document.createElement('div');
      row.className = 'ns-mod-row';

      const srcSel = document.createElement('select');
      srcSel.className = 'ns-mod-select';
      sources.forEach(s => {
        const o = document.createElement('option');
        o.value = s;
        o.textContent = s;
        if (route.source === s) o.selected = true;
        srcSel.appendChild(o);
      });
      srcSel.addEventListener('change', () => { route.source = srcSel.value; });
      row.appendChild(srcSel);

      const arrow = document.createElement('span');
      arrow.style.cssText = 'color:#888;font-size:10px;';
      arrow.textContent = '→';
      row.appendChild(arrow);

      const dstSel = document.createElement('select');
      dstSel.className = 'ns-mod-select';
      dests.forEach(d => {
        const o = document.createElement('option');
        o.value = d;
        o.textContent = d;
        if (route.destination === d) o.selected = true;
        dstSel.appendChild(o);
      });
      dstSel.addEventListener('change', () => { route.destination = dstSel.value; });
      row.appendChild(dstSel);

      const amtKnob = this._createKnob('Amt', route.amount, -1, 1, (v) => { route.amount = v; });
      row.appendChild(amtKnob);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'ns-mod-remove';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', () => {
        this.modMatrix.splice(idx, 1);
        this._rebuildModMatrix();
      });
      row.appendChild(removeBtn);

      this.modMatrixContainer.appendChild(row);
    });
  }

  _buildVizSection() {
    const section = document.createElement('div');
    section.className = 'ns-section ns-viz-section';

    // Oscilloscope
    const scopeBox = document.createElement('div');
    scopeBox.className = 'ns-viz-box';
    this.scopeCanvas = document.createElement('canvas');
    this.scopeCanvas.width = 400;
    this.scopeCanvas.height = 100;
    scopeBox.appendChild(this.scopeCanvas);
    section.appendChild(scopeBox);

    // Spectrum
    const specBox = document.createElement('div');
    specBox.className = 'ns-viz-box';
    this.specCanvas = document.createElement('canvas');
    this.specCanvas.width = 400;
    this.specCanvas.height = 100;
    specBox.appendChild(this.specCanvas);
    section.appendChild(specBox);

    return section;
  }

  _buildKeyboardSection() {
    const section = document.createElement('div');
    section.className = 'ns-section ns-keyboard-section';
    section.innerHTML = '<div class="ns-section-title">Keyboard</div>';

    const controls = document.createElement('div');
    controls.className = 'ns-row';

    // Octave
    const octDown = document.createElement('button');
    octDown.className = 'ns-oct-btn';
    octDown.textContent = 'Oct -';
    octDown.addEventListener('click', () => { this.octave = Math.max(1, this.octave - 1); });
    controls.appendChild(octDown);

    const octDisplay = document.createElement('span');
    octDisplay.style.cssText = 'color:#ff4081;font-size:14px;font-weight:bold;min-width:30px;text-align:center;';
    octDisplay.textContent = this.octave;
    octDisplay.id = 'sl-oct';
    controls.appendChild(octDisplay);

    const octUp = document.createElement('button');
    octUp.className = 'ns-oct-btn';
    octUp.textContent = 'Oct +';
    octUp.addEventListener('click', () => { this.octave = Math.min(7, this.octave + 1); const d = document.getElementById('sl-oct'); if(d) d.textContent = this.octave; });
    controls.appendChild(octUp);

    section.appendChild(controls);

    // Pitch and mod wheels
    const wheels = document.createElement('div');
    wheels.className = 'ns-pitch-mod';

    const pitchWheel = document.createElement('div');
    const pitchFill = document.createElement('div');
    pitchFill.className = 'ns-wheel-fill';
    pitchFill.style.height = '50%';
    pitchWheel.className = 'ns-wheel';
    pitchWheel.appendChild(pitchFill);
    const pitchLabel = document.createElement('div');
    pitchLabel.className = 'ns-wheel-label';
    pitchLabel.textContent = 'Pitch';
    wheels.appendChild(pitchWheel);
    wheels.appendChild(pitchLabel);

    const modWheel = document.createElement('div');
    const modFill = document.createElement('div');
    modFill.className = 'ns-wheel-fill';
    modFill.style.height = '0%';
    modWheel.className = 'ns-wheel';
    modWheel.appendChild(modFill);
    const modLabel = document.createElement('div');
    modLabel.className = 'ns-wheel-label';
    modLabel.textContent = 'Mod';
    wheels.appendChild(modWheel);
    wheels.appendChild(modLabel);

    this._makeWheel(pitchWheel, pitchFill, (v) => { this._pitchBend = v; });
    this._makeWheel(modWheel, modFill, (v) => { this._modWheel = v; });

    controls.appendChild(wheels);
    section.appendChild(controls);

    // Keyboard
    const kb = document.createElement('div');
    kb.className = 'ns-keyboard';
    kb.id = 'sl-keyboard';

    const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackNotes = { 'C': 'C#', 'D': 'D#', 'F': 'F#', 'G': 'G#', 'A': 'A#' };
    const computerKeys = ['a','w','s','e','d','f','t','g','y','h','u','j','k','o','l','p',';'];

    let whiteKeyIndex = 0;
    for (let oct = 0; oct < 2; oct++) {
      for (let n = 0; n < 7; n++) {
        const note = whiteNotes[n];
        const key = document.createElement('div');
        key.className = 'ns-white-key';
        key.dataset.note = note;
        key.dataset.octave = this.octave + oct;
        key.dataset.midi = (this.octave + oct + 1) * 12 + { 'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11 }[note];
        const lbl = document.createElement('div');
        lbl.className = 'ns-key-label';
        lbl.textContent = computerKeys[whiteKeyIndex] || '';
        key.appendChild(lbl);

        key.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this._noteOn(parseInt(key.dataset.midi));
          key.classList.add('active');
        });
        key.addEventListener('mouseup', () => {
          this._noteOff(parseInt(key.dataset.midi));
          key.classList.remove('active');
        });
        key.addEventListener('mouseleave', () => {
          if (key.classList.contains('active')) {
            this._noteOff(parseInt(key.dataset.midi));
            key.classList.remove('active');
          }
        });

        kb.appendChild(key);
        whiteKeyIndex++;
      }
    }

    // Black keys (positioned absolutely)
    const whiteKeyWidth = 100 / 14; // percentage
    let bkIdx = 0;
    for (let oct = 0; oct < 2; oct++) {
      ['C', 'D', 'F', 'G', 'A'].forEach((note, i) => {
        const blackNote = note + '#';
        const whiteKeyIdx = oct * 7 + ['C','D','E','F','G','A','B'].indexOf(note);
        const left = ((whiteKeyIdx + 1) * whiteKeyWidth) - (whiteKeyWidth * 0.3);

        const key = document.createElement('div');
        key.className = 'ns-black-key';
        key.style.left = left + '%';
        key.dataset.note = blackNote;
        key.dataset.octave = this.octave + oct;
        key.dataset.midi = (this.octave + oct + 1) * 12 + { 'C#':1,'D#':3,'F#':6,'G#':8,'A#':10 }[blackNote];

        key.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this._noteOn(parseInt(key.dataset.midi));
          key.classList.add('active');
        });
        key.addEventListener('mouseup', () => {
          this._noteOff(parseInt(key.dataset.midi));
          key.classList.remove('active');
        });
        key.addEventListener('mouseleave', () => {
          if (key.classList.contains('active')) {
            this._noteOff(parseInt(key.dataset.midi));
            key.classList.remove('active');
          }
        });

        kb.appendChild(key);
      });
    }

    section.appendChild(kb);
    return section;
  }

  _makeWheel(wheel, fill, onChange) {
    let value = 0.5;
    let dragging = false;
    let startY = 0;

    const update = () => {
      fill.style.height = (value * 100) + '%';
      if (onChange) onChange((value - 0.5) * 2);
    };

    wheel.addEventListener('mousedown', (e) => {
      dragging = true;
      startY = e.clientY;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dy = startY - e.clientY;
      value = Math.max(0, Math.min(1, value + dy * 0.005));
      startY = e.clientY;
      update();
    });

    document.addEventListener('mouseup', () => {
      if (dragging && wheel === wheel) {
        // Reset pitch wheel on release
        value = 0.5;
        update();
      }
      dragging = false;
    });
  }

  _bindEvents() {
    // Preset category
    const catSel = this.root.querySelector('#sl-cat');
    const listSel = this.root.querySelector('#sl-list');
    const presetName = this.root.querySelector('#sl-pname');
    const saveBtn = this.root.querySelector('#sl-save');
    const searchInput = this.root.querySelector('#sl-search');

    catSel?.addEventListener('change', () => this._updatePresetList());
    listSel?.addEventListener('change', () => this._loadPreset(listSel.value));
    saveBtn?.addEventListener('click', () => {
      const name = prompt('Preset name:');
      if (name) {
        const cat = catSel.value;
        if (!this.presets[cat]) this.presets[cat] = [];
        this.presets[cat].push(this._getCurrentState());
        this.presets[cat][this.presets[cat].length - 1].name = name;
        this._updatePresetList();
      }
    });
    searchInput?.addEventListener('input', () => this._searchPresets(searchInput.value));
  }

  _updatePresetList() {
    const catSel = this.root.querySelector('#sl-cat');
    const listSel = this.root.querySelector('#sl-list');
    if (!catSel || !listSel) return;
    const cat = catSel.value;
    listSel.innerHTML = '';
    const presets = this.presets[cat] || [];
    presets.forEach((p, i) => {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = p.name;
      listSel.appendChild(o);
    });
  }

  _searchPresets(query) {
    const listSel = this.root.querySelector('#sl-list');
    if (!listSel) return;
    listSel.innerHTML = '';
    const q = query.toLowerCase();
    Object.entries(this.presets).forEach(([cat, presets]) => {
      presets.forEach((p, i) => {
        if (p.name.toLowerCase().includes(q)) {
          const o = document.createElement('option');
          o.value = `${cat}:${i}`;
          o.textContent = `${cat} > ${p.name}`;
          listSel.appendChild(o);
        }
      });
    });
  }

  _getCurrentState() {
    return {
      osc: JSON.parse(JSON.stringify(this.oscConfig)),
      filter: JSON.parse(JSON.stringify(this.filterConfig)),
      amp: JSON.parse(JSON.stringify(this.ampEnvelope)),
      lfo: JSON.parse(JSON.stringify(this.lfoConfig)),
      effects: JSON.parse(JSON.stringify(this.effects))
    };
  }

  _loadPreset(index) {
    const catSel = this.root.querySelector('#sl-cat');
    const listSel = this.root.querySelector('#sl-list');
    const presetName = this.root.querySelector('#sl-pname');
    const cat = catSel?.value;
    let preset;
    if (typeof index === 'string' && index.includes(':')) {
      const [c, i] = index.split(':');
      preset = this.presets[c]?.[parseInt(i)];
    } else {
      preset = this.presets[cat]?.[parseInt(index)];
    }
    if (!preset) return;

    // Apply preset
    if (preset.osc) {
      preset.osc.forEach((osc, i) => {
        if (i < 3) Object.assign(this.oscConfig[i], osc);
      });
    }
    if (preset.filter) Object.assign(this.filterConfig, JSON.parse(JSON.stringify(preset.filter)));
    if (preset.amp) Object.assign(this.ampEnvelope, preset.amp);

    if (presetName) presetName.textContent = preset.name;
    this._drawEnvelopeDisplay();
  }

  _setupKeyboard() {
    const keyMap = {
      'a': 0, 'w': 1, 's': 2, 'e': 3, 'd': 4, 'f': 5, 't': 6,
      'g': 7, 'y': 8, 'h': 9, 'u': 10, 'j': 11, 'k': 12, 'o': 13, 'l': 14, 'p': 15, ';': 16
    };

    document.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.key === ' ') { e.preventDefault(); this.sustain = !this.sustain; return; }
      const offset = keyMap[e.key.toLowerCase()];
      if (offset !== undefined && !this._heldKeys.has(e.key.toLowerCase())) {
        this._heldKeys.add(e.key.toLowerCase());
        const midi = (this.octave + 1) * 12 + offset;
        this._noteOn(midi);
        // Highlight key
        const keys = this.root.querySelectorAll('.ns-white-key, .ns-black-key');
        keys.forEach(k => {
          if (parseInt(k.dataset.midi) === midi) k.classList.add('active');
        });
      }
      if (e.key === 'z' || e.key === 'Z') {
        this.octave = Math.max(1, this.octave - 1);
        const d = this.root.querySelector('#sl-oct');
        if (d) d.textContent = this.octave;
      }
      if (e.key === 'x' || e.key === 'X') {
        this.octave = Math.min(7, this.octave + 1);
        const d = this.root.querySelector('#sl-oct');
        if (d) d.textContent = this.octave;
      }
    });

    document.addEventListener('keyup', (e) => {
      const offset = keyMap[e.key.toLowerCase()];
      if (offset !== undefined) {
        this._heldKeys.delete(e.key.toLowerCase());
        const midi = (this.octave + 1) * 12 + offset;
        if (this.sustain) {
          this.sustainedNotes.push(midi);
        } else {
          this._noteOff(midi);
        }
        const keys = this.root.querySelectorAll('.ns-white-key, .ns-black-key');
        keys.forEach(k => {
          if (parseInt(k.dataset.midi) === midi) k.classList.remove('active');
        });
      }
      if (e.key === ' ') {
        this.sustainedNotes.forEach(midi => this._noteOff(midi));
        this.sustainedNotes = [];
      }
    });
  }

  _noteOn(midi) {
    if (this.activeNotes.has(midi)) return;
    const freq = NexusAudioEngine.midiToFreq(midi);
    const time = this.engine.ctx.currentTime;
    const duration = 10; // long note, stopped on noteOff

    const oscillators = this.oscConfig.filter(o => o.enabled).map(o => ({
      waveform: o.waveform,
      detune: o.detune + (this._pitchBend || 0) * 100,
      octave: o.octave,
      level: o.level
    }));

    if (oscillators.length === 0) return;

    const config = {
      frequency: freq,
      velocity: 0.7,
      oscillators,
      filter: this.filterConfig.a.enabled ? {
        type: this.filterConfig.a.type,
        cutoff: this.filterConfig.a.cutoff,
        resonance: this.filterConfig.a.resonance
      } : null,
      filterEnvelope: this.filterConfig.envelope.amount !== 0 ? {
        startFreq: this.filterConfig.a.cutoff,
        peakFreq: this.filterConfig.a.cutoff + this.filterConfig.envelope.amount,
        sustainFreq: this.filterConfig.a.cutoff + this.filterConfig.envelope.amount * this.filterConfig.envelope.sustain,
        attack: this.filterConfig.envelope.attack,
        decay: this.filterConfig.envelope.decay
      } : null,
      envelope: { ...this.ampEnvelope },
      lfo: this.lfoConfig[0].depth > 0 ? {
        waveform: this.lfoConfig[0].waveform,
        rate: this.lfoConfig[0].rate,
        depth: this.lfoConfig[0].depth,
        destination: this.lfoConfig[0].destination
      } : null
    };

    this.engine.playSynthNote(time, duration, this.channelIndex, config);
    this.activeNotes.set(midi, { time, duration, config });
  }

  _noteOff(midi) {
    // Note will naturally decay via envelope release
    this.activeNotes.delete(midi);
  }

  _rebuildEffects() {
    // Rebuild effect chain on channel
    let slot = 0;
    if (this.effects.distortion.enabled) {
      const fx = this.engine.createEffect('distortion', this.effects.distortion);
      this.engine.setInsert(this.channelIndex, slot++, fx);
    }
    if (this.effects.chorus.enabled && slot < 3) {
      const fx = this.engine.createEffect('chorus', this.effects.chorus);
      this.engine.setInsert(this.channelIndex, slot++, fx);
    }
    if (this.effects.delay.enabled && slot < 3) {
      const fx = this.engine.createEffect('delay', this.effects.delay);
      this.engine.setInsert(this.channelIndex, slot++, fx);
    }
    if (this.effects.reverb.enabled && slot < 3) {
      const fx = this.engine.createEffect('reverb', this.effects.reverb);
      this.engine.setInsert(this.channelIndex, slot++, fx);
    }
  }

  _startAnimation() {
    const animate = () => {
      this.animFrameId = requestAnimationFrame(animate);
      this._drawOscilloscope();
      this._drawSpectrum();
    };
    animate();
  }

  _drawOscilloscope() {
    if (!this.scopeCanvas) return;
    const ctx = this.scopeCanvas.getContext('2d');
    const w = this.scopeCanvas.width;
    const h = this.scopeCanvas.height;
    const container = this.scopeCanvas.parentElement;
    if (container) {
      this.scopeCanvas.width = container.clientWidth || 400;
      this.scopeCanvas.height = container.clientHeight || 100;
    }

    const data = this.engine.getChannelTimeDomainData(this.channelIndex);
    ctx.fillStyle = 'rgba(10,5,15,1)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#ff4081';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255,23,68,0.6)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    const sliceWidth = w / data.length;
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * h) / 2;
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * sliceWidth, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center line
    ctx.strokeStyle = 'rgba(255,23,68,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }

  _drawSpectrum() {
    if (!this.specCanvas) return;
    const ctx = this.specCanvas.getContext('2d');
    const w = this.specCanvas.width;
    const h = this.specCanvas.height;
    const container = this.specCanvas.parentElement;
    if (container) {
      this.specCanvas.width = container.clientWidth || 400;
      this.specCanvas.height = container.clientHeight || 100;
    }

    const data = this.engine.getChannelFrequencyData(this.channelIndex);
    ctx.fillStyle = 'rgba(10,5,15,1)';
    ctx.fillRect(0, 0, w, h);

    const barCount = 64;
    const barW = w / barCount;
    for (let i = 0; i < barCount; i++) {
      const val = data[i * 2] / 255;
      const barH = val * h;
      const gradient = ctx.createLinearGradient(0, h, 0, h - barH);
      gradient.addColorStop(0, 'rgba(255,23,68,0.8)');
      gradient.addColorStop(1, 'rgba(255,64,129,0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barW + 1, h - barH, barW - 2, barH);
    }
  }

  destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.root) this.root.remove();
  }
}

window.NexusSynthLab = NexusSynthLab;
