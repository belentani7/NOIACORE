/**
 * NexusDrumMachine — Drum pattern sequencer for NEXUS OS
 * 8 tracks, real-time synthesis, 64 patterns, song mode, humanize, fill generator
 */
class NexusDrumMachine {
  constructor() {
    this.engine = null;
    this.container = null;
    this.numTracks = 8;
    this.trackNames = ['Kick', 'Snare', 'HiHat C', 'HiHat O', 'Clap', 'Tom', 'Rim', 'Crash'];
    this.trackColors = ['#ff1744', '#ff4081', '#f50057', '#e91e63', '#d500f9', '#aa00ff', '#7c4dff', '#651fff'];
    this.trackDrumType = ['kick', 'snare', 'hihat', 'hihat', 'clap', 'tom', 'rim', 'crash'];
    this.tracks = [];
    this.stepsPerPattern = 16;
    this.currentBank = 0;
    this.currentPatternIndex = 0;
    this.patterns = {};
    this.songSequence = [];
    this.songMode = false;
    this.currentSongPos = 0;
    this.swing = 0;
    this.accentSteps = new Set();
    this.animFrameId = null;
    this._initTracks();
    this._initPatterns();
  }

  _initTracks() {
    for (let i = 0; i < this.numTracks; i++) {
      this.tracks.push({
        name: this.trackNames[i],
        color: this.trackColors[i],
        drumType: this.trackDrumType[i],
        volume: 0.8,
        pan: 0,
        tune: 0,
        decay: i === 0 ? 0.4 : i === 7 ? 1.5 : 0.2,
        attack: 0.005,
        muted: false,
        solo: false,
        params: {}
      });
    }
  }

  _initPatterns() {
    for (let b = 0; b < 8; b++) {
      const bankLetter = String.fromCharCode(65 + b);
      for (let p = 0; p < 8; p++) {
        const key = `${bankLetter}${p + 1}`;
        this.patterns[key] = this._emptyPattern();
      }
    }
    // Load some presets
    this._loadPresetPatterns();
  }

  _emptyPattern() {
    const p = { steps: this.stepsPerPattern, tracks: {}, velocities: {} };
    for (let i = 0; i < this.numTracks; i++) {
      p.tracks[i] = new Array(this.stepsPerPattern).fill(0);
      p.velocities[i] = new Array(this.stepsPerPattern).fill(0.8);
    }
    return p;
  }

  _currentPatternKey() {
    return `${String.fromCharCode(65 + this.currentBank)}${this.currentPatternIndex + 1}`;
  }

  _currentPattern() {
    return this.patterns[this._currentPatternKey()];
  }

  _loadPresetPatterns() {
    // Techno
    const techno = this.patterns['A1'];
    if (techno) {
      [0,4,8,12].forEach(s => techno.tracks[0][s] = 1); // kick 4-on-floor
      [4,12].forEach(s => techno.tracks[1][s] = 1); // snare
      for (let s = 0; s < 16; s += 2) techno.tracks[2][s] = 1; // hihat
      [2,6,10,14].forEach(s => techno.tracks[2][s] = 1); // offbeat hats
      techno.name = 'Techno';
    }
    // House
    const house = this.patterns['A2'];
    if (house) {
      [0,4,8,12].forEach(s => house.tracks[0][s] = 1);
      [4,12].forEach(s => house.tracks[1][s] = 1);
      [2,6,10,14].forEach(s => house.tracks[2][s] = 1);
      [4,12].forEach(s => house.tracks[4][s] = 1); // clap
      house.name = 'House';
    }
    // Hip-hop
    const hiphop = this.patterns['A3'];
    if (hiphop) {
      [0,5,8,13].forEach(s => hiphop.tracks[0][s] = 1);
      [4,12].forEach(s => hiphop.tracks[1][s] = 1);
      for (let s = 0; s < 16; s += 2) hiphop.tracks[2][s] = 1;
      hiphop.name = 'Hip-Hop';
    }
    // DnB
    const dnb = this.patterns['A4'];
    if (dnb) {
      [0,6,10].forEach(s => dnb.tracks[0][s] = 1);
      [4,12].forEach(s => dnb.tracks[1][s] = 1);
      for (let s = 0; s < 16; s++) dnb.tracks[2][s] = 1;
      dnb.name = 'DnB';
    }
  }

  async init(container) {
    this.container = container;
    this.engine = window.nexusAudio;
    await this.engine.init();
    for (let i = 0; i < this.numTracks; i++) {
      this.engine.createChannel(i, this.trackNames[i]);
    }
    this._injectStyles();
    this._buildDOM();
    this._bindEvents();
    this._startAnimation();
  }

  _injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .nexus-drums { width:100%; height:100%; display:flex; flex-direction:column; background:rgba(10,5,15,0.95); color:#e0d0e8; font-family:'Segoe UI',sans-serif; font-size:11px; overflow:hidden; user-select:none; }
      .nexus-drums * { box-sizing:border-box; }
      .nd-header { display:flex; align-items:center; gap:10px; padding:8px 12px; background:rgba(20,10,30,0.9); border-bottom:1px solid rgba(255,23,68,0.3); flex-shrink:0; }
      .nd-header h2 { margin:0; font-size:14px; color:#ff4081; letter-spacing:3px; text-transform:uppercase; text-shadow:0 0 10px rgba(255,23,68,0.5); }
      .nd-toolbar { display:flex; align-items:center; gap:8px; padding:6px 12px; background:rgba(15,8,25,0.9); border-bottom:1px solid rgba(255,23,68,0.15); flex-shrink:0; flex-wrap:wrap; }
      .nd-btn { background:rgba(40,20,60,0.8); border:1px solid rgba(255,23,68,0.4); color:#ff6090; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:11px; transition:all 0.15s; }
      .nd-btn:hover { background:rgba(255,23,68,0.2); border-color:#ff1744; }
      .nd-btn.active { background:rgba(255,23,68,0.3); border-color:#ff1744; box-shadow:0 0 8px rgba(255,23,68,0.4); color:#fff; }
      .nd-btn.play.active { background:rgba(0,255,100,0.2); border-color:#00e676; color:#00e676; }
      .nd-btn.stop { color:#ff5252; }
      .nd-bpm { display:flex; align-items:center; gap:4px; }
      .nd-bpm input { width:50px; background:rgba(30,15,45,0.9); border:1px solid rgba(255,23,68,0.2); color:#ff4081; text-align:center; font-size:14px; font-weight:bold; padding:3px; border-radius:4px; outline:none; }
      .nd-bpm label { color:#888; font-size:10px; }
      .nd-bank-selector { display:flex; gap:3px; }
      .nd-bank-btn { width:26px; height:26px; border-radius:4px; border:1px solid rgba(255,23,68,0.2); background:rgba(30,15,45,0.8); color:#888; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
      .nd-bank-btn.active { background:rgba(255,23,68,0.25); border-color:#ff1744; color:#ff4081; box-shadow:0 0 4px rgba(255,23,68,0.3); }
      .nd-pat-selector { display:flex; gap:3px; }
      .nd-main { flex:1; display:flex; flex-direction:column; overflow:auto; padding:8px; gap:4px; }
      .nd-track-row { display:flex; align-items:center; gap:6px; background:rgba(25,12,40,0.7); border:1px solid rgba(255,23,68,0.1); border-radius:6px; padding:6px 8px; backdrop-filter:blur(5px); }
      .nd-track-info { display:flex; align-items:center; gap:6px; min-width:130px; flex-shrink:0; }
      .nd-track-color { width:4px; height:32px; border-radius:2px; }
      .nd-track-name { font-size:10px; color:#ccc; width:50px; }
      .nd-track-controls { display:flex; align-items:center; gap:4px; }
      .nd-mini-btn { width:20px; height:20px; border-radius:3px; border:1px solid rgba(255,23,68,0.3); background:rgba(30,15,45,0.8); color:#888; font-size:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
      .nd-mini-btn.mute.active { background:rgba(255,82,82,0.3); border-color:#ff5252; color:#ff5252; }
      .nd-mini-btn.solo.active { background:rgba(255,193,7,0.3); border-color:#ffc107; color:#ffc107; }
      .nd-meter { width:4px; height:32px; background:rgba(10,5,15,0.8); border-radius:2px; overflow:hidden; }
      .nd-meter-fill { width:100%; background:linear-gradient(to top, #00e676, #ffeb3b, #ff5252); border-radius:2px; transition:height 0.05s; }
      .nd-param-knob { width:24px; height:24px; border-radius:50%; background:radial-gradient(circle at 40% 35%, rgba(60,30,80,0.9), rgba(20,10,35,0.95)); border:2px solid rgba(255,23,68,0.3); cursor:pointer; position:relative; }
      .nd-step-grid { display:flex; gap:2px; flex:1; align-items:center; }
      .nd-step { width:22px; height:22px; border-radius:3px; border:1px solid rgba(255,23,68,0.12); background:rgba(20,10,35,0.6); cursor:pointer; transition:all 0.08s; flex-shrink:0; position:relative; }
      .nd-step:hover { border-color:rgba(255,23,68,0.4); }
      .nd-step.active { box-shadow:0 0 8px currentColor; }
      .nd-step.current { border-color:rgba(255,255,255,0.5) !important; }
      .nd-step.beat { border-bottom:2px solid rgba(255,23,68,0.2); }
      .nd-step.accent { border-color:rgba(255,255,0,0.4) !important; }
      .nd-step-num { position:absolute; bottom:0; right:1px; font-size:6px; color:rgba(255,255,255,0.3); pointer-events:none; }
      .nd-footer { display:flex; gap:8px; padding:6px 12px; align-items:center; background:rgba(15,8,25,0.9); border-top:1px solid rgba(255,23,68,0.15); flex-shrink:0; flex-wrap:wrap; }
      .nd-slider { -webkit-appearance:none; width:80px; height:4px; background:rgba(255,23,68,0.2); border-radius:2px; outline:none; }
      .nd-slider::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; background:#ff4081; border-radius:50%; cursor:pointer; box-shadow:0 0 4px rgba(255,23,68,0.5); }
      .nd-footer label { font-size:10px; color:#888; }
      .nd-song-bar { display:flex; gap:4px; padding:6px 12px; background:rgba(15,8,25,0.7); border-top:1px solid rgba(255,23,68,0.1); flex-shrink:0; overflow-x:auto; align-items:center; }
      .nd-song-item { padding:4px 8px; background:rgba(255,23,68,0.1); border:1px solid rgba(255,23,68,0.2); border-radius:4px; font-size:10px; color:#ff6090; cursor:pointer; white-space:nowrap; }
      .nd-song-item.current { background:rgba(255,23,68,0.3); border-color:#ff1744; }
      .nd-song-item:hover { background:rgba(255,23,68,0.2); }
    `;
    this.container.appendChild(style);
  }

  _buildDOM() {
    const root = document.createElement('div');
    root.className = 'nexus-drums';

    // Header
    const header = document.createElement('div');
    header.className = 'nd-header';
    header.innerHTML = `<h2>Drum Machine</h2>`;
    root.appendChild(header);

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'nd-toolbar';
    toolbar.innerHTML = `
      <button class="nd-btn play" data-action="play">▶</button>
      <button class="nd-btn" data-action="pause">⏸</button>
      <button class="nd-btn stop" data-action="stop">⏹</button>
      <div class="nd-bpm">
        <label>BPM</label>
        <button class="nd-btn" data-action="bpm-dec" style="padding:2px 6px;">-</button>
        <input type="number" value="120" min="60" max="200" id="dm-bpm">
        <button class="nd-btn" data-action="bpm-inc" style="padding:2px 6px;">+</button>
      </div>
      <label style="color:#888;font-size:10px;">Bank:</label>
      <div class="nd-bank-selector" id="dm-banks"></div>
      <label style="color:#888;font-size:10px;">Pattern:</label>
      <div class="nd-pat-selector" id="dm-pats"></div>
      <label style="color:#888;font-size:10px;">Steps:</label>
      <select class="nd-btn" id="dm-steps" style="padding:3px 6px;">
        <option value="16" selected>16</option><option value="32">32</option>
      </select>
      <button class="nd-btn" data-action="song-mode" id="dm-song-btn">Song</button>
    `;
    root.appendChild(toolbar);

    // Song bar
    this.songBar = document.createElement('div');
    this.songBar.className = 'nd-song-bar';
    this.songBar.style.display = 'none';
    this.songBar.innerHTML = `<label style="font-size:10px;color:#888;">Song:</label>
      <button class="nd-btn" data-action="song-add">+ Add</button>
      <button class="nd-btn" data-action="song-clear">Clear</button>
      <div id="dm-song-list" style="display:flex;gap:3px;flex-wrap:wrap;"></div>`;
    root.appendChild(this.songBar);

    // Main grid
    const main = document.createElement('div');
    main.className = 'nd-main';
    main.id = 'dm-main';
    for (let i = 0; i < this.numTracks; i++) {
      main.appendChild(this._buildTrackRow(i));
    }
    root.appendChild(main);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'nd-footer';
    footer.innerHTML = `
      <label>Swing:</label>
      <input type="range" class="nd-slider" min="0" max="100" value="0" id="dm-swing">
      <label>Master Vol:</label>
      <input type="range" class="nd-slider" min="0" max="100" value="80" id="dm-master">
      <button class="nd-btn" data-action="humanize">Humanize</button>
      <button class="nd-btn" data-action="fill">Fill</button>
      <button class="nd-btn" data-action="clear">Clear</button>
      <button class="nd-btn" data-action="copy">Copy</button>
      <button class="nd-btn" data-action="export-wav">Export WAV</button>
    `;
    root.appendChild(footer);

    this.container.appendChild(root);
    this.root = root;
    this._buildBankSelector();
    this._buildPatternSelector();
  }

  _buildTrackRow(index) {
    const track = this.tracks[index];
    const row = document.createElement('div');
    row.className = 'nd-track-row';
    row.dataset.track = index;

    // Info
    const info = document.createElement('div');
    info.className = 'nd-track-info';

    const color = document.createElement('div');
    color.className = 'nd-track-color';
    color.style.background = track.color;
    info.appendChild(color);

    const name = document.createElement('div');
    name.className = 'nd-track-name';
    name.textContent = track.name;
    info.appendChild(name);

    // Mute
    const mute = document.createElement('button');
    mute.className = 'nd-mini-btn mute';
    mute.textContent = 'M';
    mute.addEventListener('click', () => {
      track.muted = !track.muted;
      mute.classList.toggle('active');
      this.engine.setChannelMute(index, track.muted);
    });
    info.appendChild(mute);

    // Solo
    const solo = document.createElement('button');
    solo.className = 'nd-mini-btn solo';
    solo.textContent = 'S';
    solo.addEventListener('click', () => {
      track.solo = !track.solo;
      solo.classList.toggle('active');
      this.engine.setChannelSolo(index, track.solo);
    });
    info.appendChild(solo);

    row.appendChild(info);

    // Controls: Volume knob, Pan, Tune, Decay
    const controls = document.createElement('div');
    controls.className = 'nd-track-controls';

    // Volume knob
    const volKnob = document.createElement('div');
    volKnob.className = 'nd-param-knob';
    volKnob.title = `Volume: ${Math.round(track.volume * 100)}%`;
    this._makeKnob(volKnob, track.volume, 0, 1, (v) => {
      track.volume = v;
      this.engine.setChannelVolume(index, v);
    });
    controls.appendChild(volKnob);

    // Pan knob
    const panKnob = document.createElement('div');
    panKnob.className = 'nd-param-knob';
    panKnob.title = 'Pan';
    this._makeKnob(panKnob, 0, -1, 1, (v) => {
      track.pan = v;
      this.engine.setChannelPan(index, v);
    });
    controls.appendChild(panKnob);

    // Tune knob
    const tuneKnob = document.createElement('div');
    tuneKnob.className = 'nd-param-knob';
    tuneKnob.title = 'Tune';
    this._makeKnob(tuneKnob, 0, -50, 50, (v) => { track.tune = v; });
    controls.appendChild(tuneKnob);

    // Decay knob
    const decayKnob = document.createElement('div');
    decayKnob.className = 'nd-param-knob';
    decayKnob.title = 'Decay';
    this._makeKnob(decayKnob, track.decay, 0.01, 2, (v) => { track.decay = v; });
    controls.appendChild(decayKnob);

    row.appendChild(controls);

    // Meter
    const meter = document.createElement('div');
    meter.className = 'nd-meter';
    const meterFill = document.createElement('div');
    meterFill.className = 'nd-meter-fill';
    meterFill.style.height = '0%';
    meterFill.dataset.role = 'meter';
    meter.appendChild(meterFill);
    row.appendChild(meter);

    // Step grid
    const grid = document.createElement('div');
    grid.className = 'nd-step-grid';
    grid.dataset.role = 'stepGrid';
    const pat = this._currentPattern();
    for (let s = 0; s < this.stepsPerPattern; s++) {
      const step = document.createElement('div');
      step.className = 'nd-step' + (pat.tracks[index][s] ? ' active' : '');
      if (s % 4 === 0) step.classList.add('beat');
      step.style.color = track.color;
      if (pat.tracks[index][s]) step.style.background = track.color;
      step.dataset.track = index;
      step.dataset.step = s;

      step.addEventListener('click', () => {
        const p = this._currentPattern();
        p.tracks[index][s] = p.tracks[index][s] ? 0 : 1;
        step.classList.toggle('active');
        step.style.background = p.tracks[index][s] ? track.color : '';
      });

      // Right-click for velocity
      step.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const p = this._currentPattern();
        const rect = step.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width;
        p.velocities[index][s] = Math.max(0.1, Math.min(1, relX));
        step.style.opacity = p.tracks[index][s] ? (0.5 + p.velocities[index][s] * 0.5) : 1;
      });

      grid.appendChild(step);
    }
    row.appendChild(grid);

    return row;
  }

  _makeKnob(el, initial, min, max, onChange) {
    let value = initial;
    let dragging = false;
    let startY = 0;
    let startVal = 0;

    const update = () => {
      const norm = (value - min) / (max - min);
      const angle = -135 + norm * 270;
      el.style.transform = `rotate(${angle}deg)`;
    };
    update();

    el.addEventListener('mousedown', (e) => {
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
    el.addEventListener('dblclick', () => { value = (min + max) / 2; update(); if (onChange) onChange(value); });
  }

  _buildBankSelector() {
    const container = this.root.querySelector('#dm-banks');
    if (!container) return;
    for (let b = 0; b < 8; b++) {
      const btn = document.createElement('button');
      btn.className = 'nd-bank-btn' + (b === 0 ? ' active' : '');
      btn.textContent = String.fromCharCode(65 + b);
      btn.addEventListener('click', () => {
        this.currentBank = b;
        container.querySelectorAll('.nd-bank-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._buildPatternSelector();
        this._rebuildGrid();
      });
      container.appendChild(btn);
    }
  }

  _buildPatternSelector() {
    const container = this.root.querySelector('#dm-pats');
    if (!container) return;
    container.innerHTML = '';
    for (let p = 0; p < 8; p++) {
      const btn = document.createElement('button');
      btn.className = 'nd-bank-btn' + (p === this.currentPatternIndex ? ' active' : '');
      btn.textContent = p + 1;
      btn.addEventListener('click', () => {
        this.currentPatternIndex = p;
        container.querySelectorAll('.nd-bank-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._rebuildGrid();
      });
      container.appendChild(btn);
    }
  }

  _rebuildGrid() {
    const main = this.root.querySelector('#dm-main');
    if (!main) return;
    main.innerHTML = '';
    for (let i = 0; i < this.numTracks; i++) {
      main.appendChild(this._buildTrackRow(i));
    }
  }

  _bindEvents() {
    this.root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      switch (btn.dataset.action) {
        case 'play': this._play(); btn.classList.add('active'); break;
        case 'pause': this._pause(); break;
        case 'stop':
          this._stop();
          this.root.querySelector('.play')?.classList.remove('active');
          break;
        case 'bpm-dec': this._setBPM(Math.max(60, this.engine.bpm - 1)); break;
        case 'bpm-inc': this._setBPM(Math.min(200, this.engine.bpm + 1)); break;
        case 'humanize': this._humanize(); break;
        case 'fill': this._generateFill(); break;
        case 'clear': this._clearCurrentPattern(); break;
        case 'copy': this._copyPattern(); break;
        case 'export-wav': this._exportWAV(); break;
        case 'song-mode':
          this.songMode = !this.songMode;
          btn.classList.toggle('active', this.songMode);
          this.songBar.style.display = this.songMode ? 'flex' : 'none';
          break;
        case 'song-add': this._addToSong(); break;
        case 'song-clear': this.songSequence = []; this._updateSongBar(); break;
      }
    });

    const bpmInput = this.root.querySelector('#dm-bpm');
    if (bpmInput) {
      bpmInput.addEventListener('change', () => {
        const v = parseInt(bpmInput.value);
        if (v >= 60 && v <= 200) this._setBPM(v);
      });
    }

    const swingSlider = this.root.querySelector('#dm-swing');
    if (swingSlider) {
      swingSlider.addEventListener('input', () => {
        this.swing = parseInt(swingSlider.value);
        this.engine.swing = this.swing;
      });
    }

    const masterSlider = this.root.querySelector('#dm-master');
    if (masterSlider) {
      masterSlider.addEventListener('input', () => {
        if (this.engine.masterGain) {
          this.engine.masterGain.gain.setTargetAtTime(parseInt(masterSlider.value) / 100, this.engine.ctx.currentTime, 0.01);
        }
      });
    }

    const stepsSel = this.root.querySelector('#dm-steps');
    if (stepsSel) {
      stepsSel.addEventListener('change', () => {
        this.stepsPerPattern = parseInt(stepsSel.value);
        const pat = this._currentPattern();
        if (pat) {
          pat.steps = this.stepsPerPattern;
          for (let i = 0; i < this.numTracks; i++) {
            const old = pat.tracks[i];
            pat.tracks[i] = new Array(this.stepsPerPattern).fill(0);
            pat.velocities[i] = new Array(this.stepsPerPattern).fill(0.8);
            for (let s = 0; s < Math.min(old.length, this.stepsPerPattern); s++) {
              pat.tracks[i][s] = old[s];
            }
          }
        }
        this._rebuildGrid();
      });
    }
  }

  _setBPM(bpm) {
    this.engine.bpm = bpm;
    const input = this.root.querySelector('#dm-bpm');
    if (input) input.value = bpm;
  }

  _play() {
    if (this.engine.isPlaying) return;
    const pat = this._currentPattern();
    if (!pat) return;

    this.engine.onStep = (step) => {
      this._highlightStep(step);
    };

    if (this.songMode && this.songSequence.length > 0) {
      this._playSong();
    } else {
      this.engine.start((step, time) => {
        this._playStep(step, time, pat);
      }, this.stepsPerPattern);
    }
  }

  _playSong() {
    this.currentSongPos = 0;
    this._playCurrentSongPattern();
  }

  _playCurrentSongPattern() {
    if (this.currentSongPos >= this.songSequence.length) {
      this.currentSongPos = 0;
    }
    const key = this.songSequence[this.currentSongPos];
    const pat = this.patterns[key];
    if (!pat) return;

    this.engine.stop();
    this.engine.start((step, time) => {
      this._playStep(step, time, pat);
      if (step === 0) this._updateSongBar();
    }, this.stepsPerPattern);

    // When pattern finishes, advance
    const checkAdvance = () => {
      if (!this.engine.isPlaying) return;
      if (this.engine.currentStep === 0 && this.engine.isPlaying) {
        this.currentSongPos++;
        if (this.currentSongPos < this.songSequence.length) {
          this._playCurrentSongPattern();
        }
      }
      setTimeout(checkAdvance, 50);
    };
    checkAdvance();
  }

  _playStep(step, time, pat) {
    const hasSolo = this.tracks.some(t => t.solo);

    for (let i = 0; i < this.numTracks; i++) {
      if (!pat.tracks[i] || !pat.tracks[i][step]) continue;
      if (this.tracks[i].muted) continue;
      if (hasSolo && !this.tracks[i].solo) continue;

      const vel = (pat.velocities[i]?.[step] || 0.8) * this.tracks[i].volume;
      const accent = this.accentSteps.has(step) ? 1.3 : 1;
      const velocity = Math.min(1, vel * accent);

      // Humanize timing
      const humanOffset = this._humanizeActive ? (Math.random() - 0.5) * 0.008 : 0;

      const params = {
        velocity,
        tune: this.tracks[i].tune * 2 + (this.trackDrumType[i] === 'kick' ? 150 : this.trackDrumType[i] === 'snare' ? 180 : this.trackDrumType[i] === 'tom' ? 200 : 0),
        decay: this.tracks[i].decay,
        tone: this.trackDrumType[i] === 'hihat' ? 7000 : undefined,
        open: i === 3 // HiHat Open
      };

      const hitTime = time + humanOffset;
      switch (this.tracks[i].drumType) {
        case 'kick': this.engine.playKick(hitTime, i, params); break;
        case 'snare': this.engine.playSnare(hitTime, i, params); break;
        case 'hihat': this.engine.playHihat(hitTime, i, { ...params, open: i === 3 }); break;
        case 'clap': this.engine.playClap(hitTime, i, params); break;
        case 'tom': this.engine.playTom(hitTime, i, params); break;
        case 'rim': this.engine.playRim(hitTime, i, params); break;
        case 'crash': this.engine.playCrash(hitTime, i, params); break;
      }
    }
  }

  _pause() {
    this.engine.pause();
    this.root.querySelector('.play')?.classList.remove('active');
  }

  _stop() {
    this.engine.stop();
    this.currentSongPos = 0;
    this._highlightStep(-1);
  }

  _highlightStep(step) {
    const rows = this.root.querySelectorAll('.nd-track-row');
    rows.forEach(row => {
      const steps = row.querySelectorAll('.nd-step');
      steps.forEach((s, i) => {
        s.classList.toggle('current', i === step);
      });
    });
  }

  _humanize() {
    this._humanizeActive = !this._humanizeActive;
  }

  _generateFill() {
    const pat = this._currentPattern();
    if (!pat) return;
    // Fill on last 4 steps
    const fillStart = this.stepsPerPattern - 4;
    for (let s = fillStart; s < this.stepsPerPattern; s++) {
      const trackIdx = Math.floor(Math.random() * this.numTracks);
      pat.tracks[trackIdx][s] = 1;
      pat.velocities[trackIdx][s] = 0.5 + Math.random() * 0.5;
    }
    // Snare roll
    for (let s = fillStart; s < this.stepsPerPattern; s++) {
      pat.tracks[1][s] = 1;
      pat.velocities[1][s] = 0.3 + ((s - fillStart) / 4) * 0.7;
    }
    this._rebuildGrid();
  }

  _clearCurrentPattern() {
    const pat = this._currentPattern();
    if (!pat) return;
    for (let i = 0; i < this.numTracks; i++) {
      pat.tracks[i].fill(0);
      pat.velocities[i].fill(0.8);
    }
    this._rebuildGrid();
  }

  _copyPattern() {
    const pat = this._currentPattern();
    if (!pat) return;
    const next = prompt('Copy to pattern (e.g., B1):', this._currentPatternKey());
    if (!next || !this.patterns[next]) { alert('Invalid pattern key'); return; }
    this.patterns[next] = JSON.parse(JSON.stringify(pat));
  }

  _randomizeTrack(trackIndex) {
    const pat = this._currentPattern();
    if (!pat) return;
    for (let s = 0; s < this.stepsPerPattern; s++) {
      pat.tracks[trackIndex][s] = Math.random() > 0.7 ? 1 : 0;
      pat.velocities[trackIndex][s] = 0.5 + Math.random() * 0.5;
    }
    this._rebuildGrid();
  }

  _addToSong() {
    this.songSequence.push(this._currentPatternKey());
    this._updateSongBar();
  }

  _updateSongBar() {
    const list = this.root.querySelector('#dm-song-list');
    if (!list) return;
    list.innerHTML = '';
    this.songSequence.forEach((key, i) => {
      const item = document.createElement('div');
      item.className = 'nd-song-item' + (i === this.currentSongPos ? ' current' : '');
      item.textContent = key;
      item.addEventListener('click', () => {
        this.songSequence.splice(i, 1);
        this._updateSongBar();
      });
      list.appendChild(item);
    });
  }

  async _exportWAV() {
    const pat = this._currentPattern();
    if (!pat) { alert('No pattern to export.'); return; }
    const stepDuration = 60 / this.engine.bpm / 4;
    const totalDuration = this.stepsPerPattern * stepDuration + 1;

    const buffer = await this.engine.renderToBuffer((step, time, ctx, dest) => {
      for (let i = 0; i < this.numTracks; i++) {
        if (!pat.tracks[i] || !pat.tracks[i][step]) continue;
        const vel = (pat.velocities[i]?.[step] || 0.8) * this.tracks[i].volume;
        this._offlineDrum(ctx, dest, this.tracks[i].drumType, time, vel, {
          tune: this.tracks[i].tune * 2 + (this.trackDrumType[i] === 'kick' ? 150 : 180),
          decay: this.tracks[i].decay,
          open: i === 3
        });
      }
    }, totalDuration, 44100);

    const blob = this.engine.audioBufferToWav(buffer);
    this.engine.downloadWav(blob, `drum-pattern-${this._currentPatternKey()}.wav`);
  }

  _offlineDrum(ctx, dest, type, time, vel, params = {}) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    switch (type) {
      case 'kick':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(params.tune || 150, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.07);
        g.gain.setValueAtTime(vel, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + (params.decay || 0.4));
        osc.connect(g); g.connect(dest);
        osc.start(time); osc.stop(time + 0.5);
        break;
      case 'snare': {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, time);
        g.gain.setValueAtTime(0.6 * vel, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.connect(g); g.connect(dest);
        osc.start(time); osc.stop(time + 0.15);
        const nL = ctx.sampleRate * 0.2;
        const nB = ctx.createBuffer(1, nL, ctx.sampleRate);
        const nd = nB.getChannelData(0);
        for (let j = 0; j < nL; j++) nd[j] = Math.random() * 2 - 1;
        const ns = ctx.createBufferSource(); ns.buffer = nB;
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1000;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.7 * vel, time);
        ng.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        ns.connect(hp); hp.connect(ng); ng.connect(dest);
        ns.start(time); ns.stop(time + 0.25);
        break;
      }
      case 'hihat': {
        const nL = ctx.sampleRate * (params.open ? 0.3 : 0.05);
        const nB = ctx.createBuffer(1, nL, ctx.sampleRate);
        const nd = nB.getChannelData(0);
        for (let j = 0; j < nL; j++) nd[j] = Math.random() * 2 - 1;
        const ns = ctx.createBufferSource(); ns.buffer = nB;
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.4 * vel, time);
        ng.gain.exponentialRampToValueAtTime(0.001, time + (params.open ? 0.3 : 0.05));
        ns.connect(hp); hp.connect(ng); ng.connect(dest);
        ns.start(time); ns.stop(time + 0.35);
        break;
      }
      case 'clap': {
        for (let b = 0; b < 3; b++) {
          const off = b * 0.01;
          const nL = ctx.sampleRate * 0.15;
          const nB = ctx.createBuffer(1, nL, ctx.sampleRate);
          const nd = nB.getChannelData(0);
          for (let j = 0; j < nL; j++) nd[j] = Math.random() * 2 - 1;
          const ns = ctx.createBufferSource(); ns.buffer = nB;
          const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2000;
          const ng = ctx.createGain();
          ng.gain.setValueAtTime(0.5 * vel, time + off);
          ng.gain.exponentialRampToValueAtTime(0.001, time + off + 0.15);
          ns.connect(bp); bp.connect(ng); ng.connect(dest);
          ns.start(time + off); ns.stop(time + off + 0.16);
        }
        break;
      }
      default:
        osc.type = 'sine'; osc.frequency.value = 200;
        g.gain.setValueAtTime(vel, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        osc.connect(g); g.connect(dest);
        osc.start(time); osc.stop(time + 0.3);
    }
  }

  _startAnimation() {
    const animate = () => {
      this.animFrameId = requestAnimationFrame(animate);
      this._updateMeters();
    };
    animate();
  }

  _updateMeters() {
    const rows = this.root.querySelectorAll('.nd-track-row');
    rows.forEach((row, i) => {
      const fill = row.querySelector('[data-role="meter"]');
      if (!fill) return;
      const peak = this.engine.getChannelPeak(i);
      fill.style.height = (peak * 100) + '%';
    });
  }

  destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.engine.stop();
    if (this.root) this.root.remove();
  }
}

window.NexusDrumMachine = NexusDrumMachine;
