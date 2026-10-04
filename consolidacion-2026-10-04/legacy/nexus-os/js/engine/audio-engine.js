/**
 * NexusAudioEngine — Core Web Audio API engine for NEXUS OS
 * Provides: context management, synth voices, effects, mixer, scheduling, export,
 * drum synthesis, channel routing, recording, analysis
 * @module NexusAudioEngine
 */

// ─── Constants ───────────────────────────────────────────────────────
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const A4_FREQ = 440;
const A4_MIDI = 69;

const SCALES = Object.freeze({
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  pentatonicMajor: [0, 2, 4, 7, 9],
  pentatonicMinor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
});

// ─── Utility Functions ───────────────────────────────────────────────

function midiToFreq(midi) {
  return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
}

function freqToMidi(freq) {
  return Math.round(12 * Math.log2(freq / A4_FREQ) + A4_MIDI);
}

function midiToNoteName(midi) {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}

function noteToFreq(note, octave) {
  const semitone = NOTE_NAMES.indexOf(note);
  if (semitone === -1) return 440;
  const midi = (octave + 1) * 12 + semitone;
  return midiToFreq(midi);
}

// ─── Envelope ────────────────────────────────────────────────────────

class Envelope {
  constructor(opts = {}) {
    this.attack = opts.attack ?? 0.01;
    this.decay = opts.decay ?? 0.1;
    this.sustain = opts.sustain ?? 0.6;
    this.release = opts.release ?? 0.3;
  }
  apply(gainNode, time, peak = 1) {
    const ctx = gainNode.context;
    gainNode.gain.cancelScheduledValues(time);
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(peak, time + this.attack);
    gainNode.gain.linearRampToValueAtTime(this.sustain * peak, time + this.attack + this.decay);
    return time + this.attack + this.decay;
  }
  releaseFrom(gainNode, time) {
    const current = gainNode.gain.value;
    gainNode.gain.cancelScheduledValues(time);
    gainNode.gain.setValueAtTime(current, time);
    gainNode.gain.linearRampToValueAtTime(0, time + this.release);
    return time + this.release + 0.01;
  }
}

// ─── Voice ───────────────────────────────────────────────────────────

class Voice {
  constructor(ctx, opts = {}) {
    this.ctx = ctx;
    this.osc = null;
    this.gain = ctx.createGain();
    this.gain.gain.value = 0;
    this.filterNode = ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = opts.filterFreq ?? 8000;
    this.filterNode.Q.value = opts.filterQ ?? 1;
    this.output = this.ctx.createGain();
    this.output.gain.value = 1;
    this.filterNode.connect(this.gain);
    this.gain.connect(this.output);
    this.envelope = new Envelope(opts.envelope);
    this.active = false;
    this.type = opts.type ?? 'sawtooth';
    this._releaseTime = 0;
  }
  setType(type) { this.type = type; }
  setFilter(opts = {}) {
    if (opts.type) this.filterNode.type = opts.type;
    if (opts.frequency != null) this.filterNode.frequency.value = opts.frequency;
    if (opts.Q != null) this.filterNode.Q.value = opts.Q;
  }
  noteOn(freq, velocity = 0.8) {
    if (this.osc) { try { this.osc.stop(); } catch(e) {} }
    this.osc = this.ctx.createOscillator();
    this.osc.type = this.type;
    this.osc.frequency.value = freq;
    this.osc.connect(this.filterNode);
    this.envelope.apply(this.gain, this.ctx.currentTime, velocity);
    this.osc.start();
    this.active = true;
  }
  noteOff() {
    if (!this.osc || !this.active) return;
    const endTime = this.envelope.releaseFrom(this.gain, this.ctx.currentTime);
    this._releaseTime = endTime;
    try { this.osc.stop(endTime); } catch(e) {}
    this.active = false;
  }
  destroy() {
    if (this.osc) { try { this.osc.stop(); } catch(e) {} this.osc.disconnect(); }
    this.gain.disconnect();
    this.filterNode.disconnect();
    this.output.disconnect();
  }
}

// ─── Effects ─────────────────────────────────────────────────────────

class AudioEffect {
  constructor(ctx, params = {}) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain.gain.value = params.mix ?? 0.3;
    this.dryGain.gain.value = 1 - (params.mix ?? 0.3);
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
  }
  setMix(val) {
    this.wetGain.gain.value = val;
    this.dryGain.gain.value = 1 - val;
  }
  destroy() {
    this.input.disconnect();
    this.output.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
  }
}

class DelayEffect extends AudioEffect {
  constructor(ctx, params = {}) {
    super(ctx, params);
    this.delay = ctx.createDelay(2.0);
    this.delay.delayTime.value = params.time ?? 0.3;
    this.feedback = ctx.createGain();
    this.feedback.gain.value = params.feedback ?? 0.4;
    this.input.connect(this.delay);
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.wetGain);
    this.wetGain.connect(this.output);
  }
}

class ReverbEffect extends AudioEffect {
  constructor(ctx, params = {}) {
    super(ctx, params);
    this.convolver = ctx.createConvolver();
    const duration = (params.roomSize ?? 0.5) * 3 + 0.5;
    const damping = params.damping ?? 0.5;
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const buffer = ctx.createBuffer(2, length, rate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, damping * 3 + 1);
      }
    }
    this.convolver.buffer = buffer;
    this.input.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.output);
  }
}

class DistortionEffect extends AudioEffect {
  constructor(ctx, params = {}) {
    super(ctx, params);
    this.shaper = ctx.createWaveShaper();
    const amount = params.drive ?? 20;
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    this.shaper.curve = curve;
    this.shaper.oversample = '4x';
    this.toneFilter = ctx.createBiquadFilter();
    this.toneFilter.type = 'lowpass';
    this.toneFilter.frequency.value = params.tone ?? 3000;
    this.input.connect(this.shaper);
    this.shaper.connect(this.toneFilter);
    this.toneFilter.connect(this.wetGain);
    this.wetGain.connect(this.output);
  }
}

class CompressorEffect extends AudioEffect {
  constructor(ctx, params = {}) {
    super(ctx, { mix: 1 });
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = params.threshold ?? -24;
    this.compressor.ratio.value = params.ratio ?? 4;
    this.compressor.attack.value = params.attack ?? 0.003;
    this.compressor.release.value = params.release ?? 0.25;
    this.makeup = ctx.createGain();
    this.makeup.gain.value = params.makeup ?? 1;
    this.input.connect(this.compressor);
    this.compressor.connect(this.makeup);
    this.makeup.connect(this.output);
  }
}

class ChorusEffect extends AudioEffect {
  constructor(ctx, params = {}) {
    super(ctx, params);
    this.delay = ctx.createDelay(0.1);
    this.delay.delayTime.value = 0.005;
    this.lfo = ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = params.rate ?? 1.5;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = params.depth ?? 0.002;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.delay.delayTime);
    this.lfo.start();
    this.input.connect(this.delay);
    this.delay.connect(this.wetGain);
    this.wetGain.connect(this.output);
  }
  destroy() { super.destroy(); try { this.lfo.stop(); } catch(e) {} }
}

class FilterEffect extends AudioEffect {
  constructor(ctx, params = {}) {
    super(ctx, { mix: 1 });
    this.filter = ctx.createBiquadFilter();
    this.filter.type = params.filterType ?? 'lowpass';
    this.filter.frequency.value = params.cutoff ?? 1000;
    this.filter.Q.value = params.resonance ?? 1;
    this.input.connect(this.filter);
    this.filter.connect(this.output);
  }
}

class EQEffect extends AudioEffect {
  constructor(ctx, params = {}) {
    super(ctx, { mix: 1 });
    this.low = ctx.createBiquadFilter();
    this.low.type = 'lowshelf';
    this.low.frequency.value = params.lowFreq ?? 200;
    this.low.gain.value = params.lowGain ?? 0;
    this.mid = ctx.createBiquadFilter();
    this.mid.type = 'peaking';
    this.mid.frequency.value = params.midFreq ?? 1000;
    this.mid.Q.value = 1;
    this.mid.gain.value = params.midGain ?? 0;
    this.high = ctx.createBiquadFilter();
    this.high.type = 'highshelf';
    this.high.frequency.value = params.highFreq ?? 4000;
    this.high.gain.value = params.highGain ?? 0;
    this.input.connect(this.low);
    this.low.connect(this.mid);
    this.mid.connect(this.high);
    this.high.connect(this.output);
  }
}

// ─── Step Sequencer ──────────────────────────────────────────────────

class StepSequencer {
  constructor(engine, opts = {}) {
    this.engine = engine;
    this.steps = opts.steps ?? 16;
    this.bpm = opts.bpm ?? 120;
    this.stepsPerBeat = opts.stepsPerBeat ?? 4;
    this.swing = opts.swing ?? 0;
    this.currentStep = 0;
    this.isPlaying = false;
    this.nextNoteTime = 0;
    this.scheduleAheadTime = 0.1;
    this.lookahead = 25;
    this.pattern = {};
    this.onStep = null;
    this.onBeat = null;
    this._timer = null;
  }
  setPattern(trackIndex, steps) {
    this.pattern[trackIndex] = steps.slice(0, this.steps);
  }
  start(callback) {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.engine.ctx.currentTime + 0.05;
    this._schedule(callback);
  }
  _schedule(callback) {
    if (!this.isPlaying) return;
    while (this.nextNoteTime < this.engine.ctx.currentTime + this.scheduleAheadTime) {
      const step = this.currentStep;
      const time = this.nextNoteTime;
      let swingOffset = 0;
      if (this.swing > 0 && step % 2 === 1) {
        const beatDuration = 60.0 / this.bpm / this.stepsPerBeat;
        swingOffset = beatDuration * (this.swing / 100) * 0.5;
      }
      if (callback) callback(step, time + swingOffset);
      if (this.onStep) this.onStep(step, time + swingOffset);
      const beatInBar = Math.floor(step / this.stepsPerBeat) % 4;
      if (step % this.stepsPerBeat === 0 && this.onBeat) this.onBeat(beatInBar, time + swingOffset);
      const stepDuration = 60.0 / this.bpm / this.stepsPerBeat;
      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % this.steps;
    }
    this._timer = setTimeout(() => this._schedule(callback), this.lookahead);
  }
  stop() {
    this.isPlaying = false;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this.currentStep = 0;
  }
  pause() {
    this.isPlaying = false;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  }
}

// ─── Main Audio Engine ──────────────────────────────────────────────

class NexusAudioEngine {
  constructor(options = {}) {
    this.ctx = null;
    this._sampleRate = options.sampleRate || 44100;
    this._maxVoices = options.maxVoices || 16;
    this.masterGain = null;
    this.masterPan = null;
    this.masterAnalyser = null;
    this.masterCompressor = null;
    this.analyser = null;
    this._voices = [];
    this._activeNotes = new Map();
    this._effects = [];
    this._buffers = new Map();
    this._freqData = null;
    this._waveData = null;
    this._initialized = false;
    // Channel routing
    this.channels = [];
    this.sendBuses = [];
    // Scheduler
    this._seqTimer = null;
    this.isPlaying = false;
    this.isRecording = false;
    this.currentStep = 0;
    this.bpm = 120;
    this.timeSignature = [4, 4];
    this.stepsPerBeat = 4;
    this.nextNoteTime = 0;
    this.scheduleAheadTime = 0.1;
    this.lookahead = 25;
    this.swing = 0;
    this.metronomeEnabled = false;
    this.metronomeGain = 0.5;
    this.onStep = null;
    this.onBeat = null;
    // Recorder
    this._recorder = null;
    this._recordedChunks = [];
    this.recording = false;
    this._micStream = null;
    this._micSource = null;
  }

  async init() {
    if (this._initialized) return this;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: this._sampleRate });
    // Master chain: compressor → gain → pan → analyser → destination
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.value = -6;
    this.masterCompressor.knee.value = 10;
    this.masterCompressor.ratio.value = 4;
    this.masterCompressor.attack.value = 0.003;
    this.masterCompressor.release.value = 0.25;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterPan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 2048;
    this.masterAnalyser.smoothingTimeConstant = 0.85;
    this.analyser = this.masterAnalyser;
    this._freqData = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this._waveData = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    // Connect master chain
    this.masterCompressor.connect(this.masterGain);
    this.masterGain.connect(this.masterPan || this.masterAnalyser);
    if (this.masterPan) this.masterPan.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);
    // Voice pool
    for (let i = 0; i < this._maxVoices; i++) {
      this._voices.push(new Voice(this.ctx, { gain: 0 }));
    }
    // Send buses
    for (let i = 0; i < 2; i++) {
      const bus = { gain: this.ctx.createGain(), returnGain: this.ctx.createGain(), effects: [] };
      bus.gain.gain.value = 0;
      bus.returnGain.gain.value = 1;
      bus.returnGain.connect(this.masterCompressor);
      this.sendBuses.push(bus);
    }
    this._initialized = true;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    return this;
  }

  async resume() { if (this.ctx && this.ctx.state === 'suspended') await this.ctx.resume(); }
  get currentTime() { return this.ctx ? this.ctx.currentTime : 0; }

  // ── Channel Management ──────────────────────────────────────────────

  createChannel(index, name) {
    const ch = {
      index, name: name || `Ch ${index + 1}`,
      gain: this.ctx.createGain(),
      pan: this.ctx.createStereoPanner(),
      analyser: this.ctx.createAnalyser(),
      muteGain: this.ctx.createGain(),
      sendGains: [this.ctx.createGain(), this.ctx.createGain()],
      insertSlots: [null, null, null],
      volume: 0.8, panValue: 0, muted: false, solo: false,
      instrument: null
    };
    ch.analyser.fftSize = 256;
    ch.gain.gain.value = ch.volume;
    ch.pan.pan.value = 0;
    ch.muteGain.gain.value = 1;
    ch.sendGains.forEach(g => g.gain.value = 0);
    ch.gain.connect(ch.pan);
    ch.pan.connect(ch.analyser);
    ch.analyser.connect(ch.muteGain);
    ch.muteGain.connect(this.masterCompressor);
    ch.sendGains.forEach((g, i) => g.connect(this.sendBuses[i].returnGain));
    this.channels[index] = ch;
    return ch;
  }

  setChannelVolume(index, value) {
    const ch = this.channels[index]; if (!ch) return;
    ch.volume = value;
    ch.gain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.01);
  }

  setChannelPan(index, value) {
    const ch = this.channels[index]; if (!ch) return;
    ch.panValue = value;
    ch.pan.pan.setTargetAtTime(value, this.ctx.currentTime, 0.01);
  }

  setChannelMute(index, muted) {
    const ch = this.channels[index]; if (!ch) return;
    ch.muted = muted;
    const hasSolo = this.channels.some(c => c && c.solo);
    const shouldMute = muted || (hasSolo && !ch.solo);
    ch.muteGain.gain.setTargetAtTime(shouldMute ? 0 : 1, this.ctx.currentTime, 0.01);
  }

  setChannelSolo(index, solo) {
    const ch = this.channels[index]; if (!ch) return;
    ch.solo = solo;
    this._updateSoloState();
  }

  _updateSoloState() {
    const hasSolo = this.channels.some(c => c && c.solo);
    this.channels.forEach(ch => {
      if (!ch) return;
      const shouldMute = ch.muted || (hasSolo && !ch.solo);
      ch.muteGain.gain.setTargetAtTime(shouldMute ? 0 : 1, this.ctx.currentTime, 0.01);
    });
  }

  setSendLevel(channelIndex, sendIndex, level) {
    const ch = this.channels[channelIndex]; if (!ch) return;
    ch.sendGains[sendIndex].gain.setTargetAtTime(level, this.ctx.currentTime, 0.01);
  }

  // ── Insert Effects ─────────────────────────────────────────────────

  createEffect(type, params = {}) {
    const e = { type, nodes: [], params: {} };
    switch (type) {
      case 'reverb': {
        const convolver = this.ctx.createConvolver();
        const dur = (params.roomSize ?? 0.5) * 3 + 0.5;
        const damp = params.damping ?? 0.5;
        const rate = this.ctx.sampleRate;
        const len = rate * dur;
        const buf = this.ctx.createBuffer(2, len, rate);
        for (let c = 0; c < 2; c++) {
          const d = buf.getChannelData(c);
          for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, damp * 3 + 1);
        }
        convolver.buffer = buf;
        const wet = this.ctx.createGain();
        wet.gain.value = params.mix ?? 0.3;
        e.nodes = [convolver, wet]; e.wetGain = wet;
        e.params = { roomSize: params.roomSize ?? 0.5, damping: damp, mix: wet.gain.value };
        break;
      }
      case 'delay': {
        const delay = this.ctx.createDelay(2.0);
        delay.delayTime.value = params.time ?? 0.3;
        const fb = this.ctx.createGain(); fb.gain.value = params.feedback ?? 0.4;
        const wet = this.ctx.createGain(); wet.gain.value = params.mix ?? 0.3;
        delay.connect(fb); fb.connect(delay);
        e.nodes = [delay, fb, wet]; e.wetGain = wet;
        e.params = { time: delay.delayTime.value, feedback: fb.gain.value, mix: wet.gain.value };
        break;
      }
      case 'distortion': {
        const shaper = this.ctx.createWaveShaper();
        const amount = params.drive ?? 20;
        const samples = 44100; const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < samples; i++) {
          const x = (i * 2) / samples - 1;
          curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        shaper.curve = curve; shaper.oversample = '4x';
        const tone = this.ctx.createBiquadFilter();
        tone.type = 'lowpass'; tone.frequency.value = params.tone ?? 3000;
        const wet = this.ctx.createGain(); wet.gain.value = params.mix ?? 0.5;
        e.nodes = [shaper, tone, wet]; e.wetGain = wet;
        e.params = { drive: amount, tone: params.tone ?? 3000, mix: wet.gain.value };
        break;
      }
      case 'chorus': {
        const delay = this.ctx.createDelay(0.1); delay.delayTime.value = 0.005;
        const lfo = this.ctx.createOscillator(); lfo.type = 'sine';
        lfo.frequency.value = params.rate ?? 1.5;
        const lfoGain = this.ctx.createGain(); lfoGain.gain.value = params.depth ?? 0.002;
        lfo.connect(lfoGain); lfoGain.connect(delay.delayTime); lfo.start();
        const wet = this.ctx.createGain(); wet.gain.value = params.mix ?? 0.4;
        e.nodes = [delay, lfo, lfoGain, wet]; e.wetGain = wet; e.lfo = lfo;
        e.params = { rate: params.rate ?? 1.5, depth: params.depth ?? 0.002, mix: wet.gain.value };
        break;
      }
      case 'compressor': {
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = params.threshold ?? -24;
        comp.ratio.value = params.ratio ?? 4;
        comp.attack.value = params.attack ?? 0.003;
        comp.release.value = params.release ?? 0.25;
        const makeup = this.ctx.createGain(); makeup.gain.value = params.makeup ?? 1;
        e.nodes = [comp, makeup];
        e.params = { threshold: comp.threshold.value, ratio: comp.ratio.value, attack: comp.attack.value, release: comp.release.value, makeup: makeup.gain.value };
        break;
      }
      case 'eq': {
        const low = this.ctx.createBiquadFilter(); low.type = 'lowshelf';
        low.frequency.value = params.lowFreq ?? 200; low.gain.value = params.lowGain ?? 0;
        const mid = this.ctx.createBiquadFilter(); mid.type = 'peaking';
        mid.frequency.value = params.midFreq ?? 1000; mid.Q.value = 1; mid.gain.value = params.midGain ?? 0;
        const high = this.ctx.createBiquadFilter(); high.type = 'highshelf';
        high.frequency.value = params.highFreq ?? 4000; high.gain.value = params.highGain ?? 0;
        e.nodes = [low, mid, high];
        e.params = { lowFreq: 200, lowGain: 0, midFreq: 1000, midGain: 0, highFreq: 4000, highGain: 0 };
        break;
      }
      case 'filter': {
        const filt = this.ctx.createBiquadFilter();
        filt.type = params.filterType ?? 'lowpass';
        filt.frequency.value = params.cutoff ?? 1000;
        filt.Q.value = params.resonance ?? 1;
        e.nodes = [filt];
        e.params = { filterType: filt.type, cutoff: params.cutoff ?? 1000, resonance: params.resonance ?? 1 };
        break;
      }
    }
    return e;
  }

  setInsert(channelIndex, slotIndex, effect) {
    const ch = this.channels[channelIndex];
    if (!ch || slotIndex > 2) return;
    const old = ch.insertSlots[slotIndex];
    if (old && old.lfo) { try { old.lfo.stop(); } catch(e) {} }
    ch.insertSlots[slotIndex] = effect;
    this._rebuildChannelChain(ch);
  }

  _rebuildChannelChain(ch) {
    try { ch.analyser.disconnect(); } catch(e) {}
    try { ch.muteGain.disconnect(); } catch(e) {}
    ch.sendGains.forEach(g => { try { g.disconnect(); } catch(e) {} });
    let lastNode = ch.analyser;
    const hasInserts = ch.insertSlots.some(s => s);
    for (let i = 0; i < 3; i++) {
      const fx = ch.insertSlots[i];
      if (fx && fx.nodes.length > 0) {
        lastNode.connect(fx.nodes[0]);
        for (let j = 0; j < fx.nodes.length - 1; j++) {
          if (fx.nodes[j].connect) fx.nodes[j].connect(fx.nodes[j + 1]);
        }
        const lastFxNode = fx.nodes[fx.nodes.length - 1];
        if (fx.wetGain) {
          lastFxNode.connect(fx.wetGain);
          fx.wetGain.connect(ch.muteGain);
          lastNode = fx.wetGain;
        } else {
          lastNode = lastFxNode;
        }
      }
    }
    if (!hasInserts) {
      ch.analyser.connect(ch.muteGain);
    } else {
      lastNode.connect(ch.muteGain);
    }
    ch.sendGains.forEach((g, i) => { g.connect(this.sendBuses[i].returnGain); ch.analyser.connect(g); });
  }

  // ── Metronome ──────────────────────────────────────────────────────

  _playMetronomeClick(time, isDownbeat) {
    if (!this.metronomeEnabled) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = isDownbeat ? 1000 : 800;
    g.gain.setValueAtTime(this.metronomeGain * 0.5, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(time); osc.stop(time + 0.05);
  }

  // ── Scheduler ──────────────────────────────────────────────────────

  start(patternCallback, stepsTotal) {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this._scheduleStep(patternCallback, stepsTotal);
  }

  _scheduleStep(patternCallback, stepsTotal) {
    if (!this.isPlaying) return;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      const step = this.currentStep;
      const time = this.nextNoteTime;
      const beatsPerBar = this.timeSignature[0];
      const isDownbeat = step % (this.stepsPerBeat * beatsPerBar) === 0;
      const beatInBar = Math.floor(step / this.stepsPerBeat) % beatsPerBar;
      const isBeat = step % this.stepsPerBeat === 0;
      let swingOffset = 0;
      if (this.swing > 0 && step % 2 === 1) {
        const beatDuration = 60.0 / this.bpm / this.stepsPerBeat;
        swingOffset = beatDuration * (this.swing / 100) * 0.5;
      }
      this._playMetronomeClick(time + swingOffset, isDownbeat);
      if (patternCallback) patternCallback(step, time + swingOffset);
      if (this.onStep) this.onStep(step, time + swingOffset);
      if (isBeat && this.onBeat) this.onBeat(beatInBar, time + swingOffset);
      const stepDuration = 60.0 / this.bpm / this.stepsPerBeat;
      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % stepsTotal;
    }
    this._seqTimer = setTimeout(() => this._scheduleStep(patternCallback, stepsTotal), this.lookahead);
  }

  stop() {
    this.isPlaying = false;
    if (this._seqTimer) { clearTimeout(this._seqTimer); this._seqTimer = null; }
    this.currentStep = 0;
  }

  pause() {
    this.isPlaying = false;
    if (this._seqTimer) { clearTimeout(this._seqTimer); this._seqTimer = null; }
  }

  // ── Voice Playback ─────────────────────────────────────────────────

  _getFreeVoice() {
    for (const v of this._voices) { if (!v.active) return v; }
    return this._voices[0];
  }

  playNote(frequency, duration, time, channel, options = {}) {
    const ch = this.channels[channel];
    if (!ch) return;
    const osc = this.ctx.createOscillator();
    osc.type = options.waveform || 'sawtooth';
    osc.frequency.setValueAtTime(frequency, time);
    if (options.detune) osc.detune.value = options.detune;
    const env = this.ctx.createGain();
    const a = options.attack || 0.01;
    const d = options.decay || 0.1;
    const s = options.sustain || 0.6;
    const r = options.release || 0.3;
    const vel = options.velocity || 0.8;
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(vel, time + a);
    env.gain.linearRampToValueAtTime(s * vel, time + a + d);
    env.gain.setValueAtTime(s * vel, time + duration);
    env.gain.linearRampToValueAtTime(0, time + duration + r);
    if (options.filterFreq) {
      const filt = this.ctx.createBiquadFilter();
      filt.type = options.filterType || 'lowpass';
      filt.frequency.setValueAtTime(options.filterFreq, time);
      if (options.filterEnv) {
        filt.frequency.linearRampToValueAtTime(options.filterFreq * options.filterEnv, time + a);
        filt.frequency.linearRampToValueAtTime(options.filterFreq, time + a + d * 2);
      }
      filt.Q.value = options.filterQ || 1;
      osc.connect(filt); filt.connect(env);
    } else {
      osc.connect(env);
    }
    env.connect(ch.gain);
    osc.start(time); osc.stop(time + duration + r + 0.1);
  }

  playSynthNote(time, duration, channel, config = {}) {
    const ch = this.channels[channel];
    if (!ch) return;
    const freq = config.frequency || 440;
    const vel = config.velocity || 0.8;
    const output = this.ctx.createGain();
    output.gain.value = 1;
    output.connect(ch.gain);
    const oscs = config.oscillators || [{ waveform: 'sawtooth', detune: 0, octave: 0, level: 1 }];
    const mixer = this.ctx.createGain();
    mixer.gain.value = 1 / Math.max(1, oscs.length);
    oscs.forEach(oscCfg => {
      const osc = this.ctx.createOscillator();
      osc.type = oscCfg.waveform || 'sawtooth';
      osc.frequency.setValueAtTime(freq * Math.pow(2, (oscCfg.octave || 0)), time);
      osc.detune.value = oscCfg.detune || 0;
      const oscGain = this.ctx.createGain();
      oscGain.gain.value = oscCfg.level || 1;
      osc.connect(oscGain); oscGain.connect(mixer);
      osc.start(time); osc.stop(time + duration + 1.5);
    });
    let lastNode = mixer;
    if (config.filter) {
      const filt = this.ctx.createBiquadFilter();
      filt.type = config.filter.type || 'lowpass';
      filt.frequency.setValueAtTime(config.filter.cutoff || 2000, time);
      filt.Q.value = config.filter.resonance || 1;
      if (config.filterEnvelope) {
        const fe = config.filterEnvelope;
        filt.frequency.setValueAtTime(fe.startFreq || 200, time);
        filt.frequency.linearRampToValueAtTime(fe.peakFreq || 5000, time + (fe.attack || 0.05));
        filt.frequency.linearRampToValueAtTime(fe.sustainFreq || 2000, time + (fe.attack || 0.05) + (fe.decay || 0.2));
      }
      lastNode.connect(filt);
      lastNode = filt;
    }
    const ampEnv = this.ctx.createGain();
    const env = config.envelope || { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 };
    ampEnv.gain.setValueAtTime(0, time);
    ampEnv.gain.linearRampToValueAtTime(vel, time + env.attack);
    ampEnv.gain.linearRampToValueAtTime(vel * env.sustain, time + env.attack + env.decay);
    ampEnv.gain.setValueAtTime(vel * env.sustain, time + duration);
    ampEnv.gain.linearRampToValueAtTime(0, time + duration + env.release);
    lastNode.connect(ampEnv);
    ampEnv.connect(output);
    if (config.lfo) {
      const lfo = this.ctx.createOscillator();
      lfo.type = config.lfo.waveform || 'sine';
      lfo.frequency.value = config.lfo.rate || 5;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = config.lfo.depth || 0;
      lfo.connect(lfoGain);
      if (config.lfo.destination === 'filter' && lastNode.frequency) {
        lfoGain.connect(lastNode.frequency);
      } else {
        lfoGain.connect(ampEnv.gain);
      }
      lfo.start(time); lfo.stop(time + duration + 1.5);
    }
  }

  // ── Drum Synthesis ─────────────────────────────────────────────────

  playKick(time, channel, params = {}) {
    const ch = this.channels[channel]; if (!ch) return;
    const vel = params.velocity || 1;
    const startFreq = params.tune || 150;
    const decay = params.decay || 0.4;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(params.endFreq || 30, time + 0.07);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + decay);
    if (params.click !== false) {
      const click = this.ctx.createOscillator();
      click.type = 'square'; click.frequency.value = 1200;
      const clickG = this.ctx.createGain();
      clickG.gain.setValueAtTime(0.3 * vel, time);
      clickG.gain.exponentialRampToValueAtTime(0.001, time + 0.01);
      click.connect(clickG); clickG.connect(ch.gain);
      click.start(time); click.stop(time + 0.02);
    }
    osc.connect(g); g.connect(ch.gain);
    osc.start(time); osc.stop(time + decay + 0.01);
  }

  playSnare(time, channel, params = {}) {
    const ch = this.channels[channel]; if (!ch) return;
    const vel = params.velocity || 1;
    const decay = params.decay || 0.2;
    // Noise burst
    const noiseLen = this.ctx.sampleRate * decay;
    const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) noiseData[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource(); noise.buffer = noiseBuf;
    const noiseFilt = this.ctx.createBiquadFilter();
    noiseFilt.type = 'highpass'; noiseFilt.frequency.value = params.tone || 1000;
    const noiseG = this.ctx.createGain();
    noiseG.gain.setValueAtTime(0.7 * vel, time);
    noiseG.gain.exponentialRampToValueAtTime(0.001, time + decay);
    noise.connect(noiseFilt); noiseFilt.connect(noiseG); noiseG.connect(ch.gain);
    noise.start(time); noise.stop(time + decay + 0.01);
    // Body
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(params.tune || 180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.05);
    const oscG = this.ctx.createGain();
    oscG.gain.setValueAtTime(0.6 * vel, time);
    oscG.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(oscG); oscG.connect(ch.gain);
    osc.start(time); osc.stop(time + 0.12);
  }

  playHihat(time, channel, params = {}) {
    const ch = this.channels[channel]; if (!ch) return;
    const vel = params.velocity || 0.8;
    const decay = params.open ? (params.decay || 0.3) : (params.decay || 0.05);
    const noiseLen = this.ctx.sampleRate * (decay + 0.01);
    const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) d[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource(); noise.buffer = noiseBuf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = params.tone || 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.4 * vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + decay);
    noise.connect(hp); hp.connect(g); g.connect(ch.gain);
    noise.start(time); noise.stop(time + decay + 0.02);
  }

  playClap(time, channel, params = {}) {
    const ch = this.channels[channel]; if (!ch) return;
    const vel = params.velocity || 0.8;
    for (let b = 0; b < 3; b++) {
      const offset = b * 0.01;
      const noiseLen = this.ctx.sampleRate * 0.15;
      const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) d[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource(); noise.buffer = noiseBuf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = params.tone || 2000; bp.Q.value = 1.5;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.5 * vel, time + offset);
      g.gain.exponentialRampToValueAtTime(0.001, time + offset + (b === 2 ? 0.15 : 0.02));
      noise.connect(bp); bp.connect(g); g.connect(ch.gain);
      noise.start(time + offset); noise.stop(time + offset + 0.16);
    }
  }

  playTom(time, channel, params = {}) {
    const ch = this.channels[channel]; if (!ch) return;
    const vel = params.velocity || 0.8;
    const startF = params.tune || 200;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startF, time);
    osc.frequency.exponentialRampToValueAtTime(startF * 0.4, time + 0.15);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.8 * vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + (params.decay || 0.3));
    osc.connect(g); g.connect(ch.gain);
    osc.start(time); osc.stop(time + (params.decay || 0.3) + 0.01);
  }

  playRim(time, channel, params = {}) {
    const ch = this.channels[channel]; if (!ch) return;
    const vel = params.velocity || 0.7;
    const noiseLen = this.ctx.sampleRate * 0.02;
    const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) d[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource(); noise.buffer = noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = params.tone || 3000; bp.Q.value = 5;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.6 * vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    noise.connect(bp); bp.connect(g); g.connect(ch.gain);
    noise.start(time); noise.stop(time + 0.03);
  }

  playCrash(time, channel, params = {}) {
    const ch = this.channels[channel]; if (!ch) return;
    const vel = params.velocity || 0.7;
    const decay = params.decay || 1.5;
    const noiseLen = this.ctx.sampleRate * decay;
    const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) d[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource(); noise.buffer = noiseBuf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = params.tone || 5000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.4 * vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + decay);
    noise.connect(hp); hp.connect(g); g.connect(ch.gain);
    noise.start(time); noise.stop(time + decay + 0.02);
  }

  // ── Analysis ───────────────────────────────────────────────────────

  getChannelFrequencyData(channelIndex) {
    const ch = this.channels[channelIndex];
    if (!ch) return new Uint8Array(128);
    const data = new Uint8Array(ch.analyser.frequencyBinCount);
    ch.analyser.getByteFrequencyData(data);
    return data;
  }

  getChannelTimeDomainData(channelIndex) {
    const ch = this.channels[channelIndex];
    if (!ch) return new Uint8Array(128);
    const data = new Uint8Array(ch.analyser.frequencyBinCount);
    ch.analyser.getByteTimeDomainData(data);
    return data;
  }

  getMasterFrequencyData() {
    if (!this.masterAnalyser) return new Uint8Array(512);
    const data = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getByteFrequencyData(data);
    return data;
  }

  getMasterTimeDomainData() {
    if (!this.masterAnalyser) return new Uint8Array(512);
    const data = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getByteTimeDomainData(data);
    return data;
  }

  getChannelPeak(channelIndex) {
    const data = this.getChannelTimeDomainData(channelIndex);
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i] - 128) / 128;
      if (v > peak) peak = v;
    }
    return peak;
  }

  getMasterPeak() {
    const data = this.getMasterTimeDomainData();
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i] - 128) / 128;
      if (v > peak) peak = v;
    }
    return peak;
  }

  getFrequencyData() { return this.getMasterFrequencyData(); }
  getWaveformData() { return this.getMasterTimeDomainData(); }
  getVolumeLevel() {
    const data = this.getMasterTimeDomainData();
    let sum = 0;
    for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
    return Math.sqrt(sum / data.length);
  }

  setMasterVolume(gain) { if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, gain)); }
  getMasterVolume() { return this.masterGain ? this.masterGain.gain.value : 0; }
  setMasterPan(pan) { if (this.masterPan) this.masterPan.pan.value = Math.max(-1, Math.min(1, pan)); }
  stopAll() { this._activeNotes.forEach(v => v.noteOff()); this._activeNotes.clear(); }

  // ── Buffer Management ──────────────────────────────────────────────

  async loadAudio(url, id) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    if (id) this._buffers.set(id, audioBuffer);
    return audioBuffer;
  }

  playBuffer(idOrBuffer, options = {}) {
    const buffer = typeof idOrBuffer === 'string' ? this._buffers.get(idOrBuffer) : idOrBuffer;
    if (!buffer) return null;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop || false;
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = options.volume ?? 1;
    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start(options.when ?? this.ctx.currentTime, options.startTime ?? 0);
    return source;
  }

  // ── Microphone ─────────────────────────────────────────────────────

  async startMicrophone(options = {}) {
    if (this._micSource) return this._micSource;
    this._micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this._micSource = this.ctx.createMediaStreamSource(this._micStream);
    if (options.monitor) this._micSource.connect(this.masterGain);
    return this._micSource;
  }

  stopMicrophone() {
    if (this._micSource) { this._micSource.disconnect(); this._micSource = null; }
    if (this._micStream) { this._micStream.getTracks().forEach(t => t.stop()); this._micStream = null; }
  }

  getMicrophoneSource() { return this._micSource; }

  // ── Recording ──────────────────────────────────────────────────────

  startRecording(mimeType = 'audio/webm') {
    if (this.recording) return;
    const dest = this.ctx.createMediaStreamDestination();
    this.masterGain.connect(dest);
    this._recordedChunks = [];
    this._recorder = new MediaRecorder(dest.stream, { mimeType });
    this._recorder.ondataavailable = (e) => { if (e.data.size > 0) this._recordedChunks.push(e.data); };
    this._recorder.start(100);
    this.recording = true;
  }

  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this._recorder || !this.recording) { reject(new Error('Not recording')); return; }
      this._recorder.onstop = () => {
        const blob = new Blob(this._recordedChunks, { type: this._recorder.mimeType });
        this.recording = false;
        this._recordedChunks = [];
        resolve(blob);
      };
      this._recorder.stop();
    });
  }

  // ── WAV Export ─────────────────────────────────────────────────────

  async renderToBuffer(callback, durationSeconds, sampleRate) {
    const sr = sampleRate || 44100;
    const offline = new OfflineAudioContext(2, sr * durationSeconds, sr);
    const masterGain = offline.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(offline.destination);
    const totalSteps = Math.ceil(durationSeconds * (this.bpm / 60) * this.stepsPerBeat);
    const stepDuration = 60 / this.bpm / this.stepsPerBeat;
    for (let step = 0; step < totalSteps; step++) {
      const time = step * stepDuration;
      if (callback) callback(step, time, offline, masterGain);
    }
    return await offline.startRendering();
  }

  audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = buffer.length * blockAlign;
    const totalSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);
    const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);
    const channels = [];
    for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = Math.max(-1, Math.min(1, channels[c][i]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  exportWAV(audioBuffer) { return this.audioBufferToWav(audioBuffer); }

  downloadWav(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename || 'nexus-export.wav';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Static Helpers ─────────────────────────────────────────────────

  static noteToFreq(note, octave) { return noteToFreq(note, octave); }
  static midiToFreq(midi) { return midiToFreq(midi); }
  static freqToMidi(freq) { return freqToMidi(freq); }
  static midiToNoteName(midi) { return midiToNoteName(midi); }
}

// ─── Exports ────────────────────────────────────────────────────────

window.NexusAudioEngine = NexusAudioEngine;
window.nexusAudio = new NexusAudioEngine();
// Legacy compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NexusAudioEngine, Envelope, Voice, AudioEffect, DelayEffect, ReverbEffect, DistortionEffect, CompressorEffect, ChorusEffect, FilterEffect, EQEffect, StepSequencer, midiToFreq, freqToMidi, midiToNoteName, noteToFreq, SCALES, NOTE_NAMES };
}
