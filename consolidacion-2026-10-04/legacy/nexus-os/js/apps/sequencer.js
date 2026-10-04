/**
 * NexusSequencer — Step sequencer / groove box for NEXUS OS
 * 8 tracks x 16 steps, live mode, pattern chaining, presets
 */
class NexusSequencer {
  constructor() {
    this.engine = null;
    this.container = null;
    this.numTracks = 8;
    this.stepsPerPattern = 16;
    this.trackNames = ['Kick', 'Snare', 'HiHat', 'Bass', 'Lead', 'Chord', 'Perc', 'FX'];
    this.trackColors = ['#ff1744', '#ff4081', '#f50057', '#d500f9', '#7c4dff', '#448aff', '#00e5ff', '#76ff03'];
    this.tracks = [];
    this.patterns = {};
    this.currentPattern = 'Pattern 1';
    this.patternChain = [];
    this.liveMode = false;
    this.nextPattern = null;
    this.animFrameId = null;
    this._initTracks();
    this._initPatterns();
  }

  _initTracks() {
    const types = ['kick', 'snare', 'hihat', 'bass', 'lead', 'chord', 'perc', 'fx'];
    for (let i = 0; i < this.numTracks; i++) {
      this.tracks.push({
        name: this.trackNames[i],
        color: this.trackColors[i],
        type: types[i],
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        params: this._defaultParams(types[i])
      });
    }
  }

  _defaultParams(type) {
    switch (type) {
      case 'kick': return { tune: 150, decay: 0.4 };
      case 'snare': return { tune: 180, decay: 0.2, tone: 1000 };
      case 'hihat': return { tone: 7000, decay: 0.05 };
      case 'bass': return { waveform: 'sawtooth', note: 'C2', filterFreq: 800, filterQ: 3, attack: 0.005, decay: 0.15, sustain: 0.5, release: 0.1 };
      case 'lead': return { waveform: 'square', note: 'C4', filterFreq: 3000, filterQ: 2, attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.2 };
      case 'chord': return { waveform: 'sawtooth', note: 'C4', filterFreq: 2000, filterQ: 0.5, attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.5 };
      case 'perc': return { tune: 3000, decay: 0.02 };
      case 'fx': return { waveform: 'sine', note: 'C5', filterFreq: 5000, filterQ: 1, attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.0 };
      default: return {};
    }
  }

  _initPatterns() {
    for (let i = 1; i <= 16; i++) {
      this.patterns[`Pattern ${i}`] = this._emptyPattern();
    }
    this.patterns[this.currentPattern] = this._emptyPattern();
    this._loadPresets();
  }

  _emptyPattern() {
    const p = { steps: this.stepsPerPattern, tracks: {}, velocities: {} };
    for (let i = 0; i < this.numTracks; i++) {
      p.tracks[i] = new Array(this.stepsPerPattern).fill(0);
      p.velocities[i] = new Array(this.stepsPerPattern).fill(0.8);
    }
    return p;
  }

  _loadPresets() {
    // Techno
    const techno = JSON.parse(JSON.stringify(this._emptyPattern()));
    [0,4,8,12].forEach(s => techno.tracks[0][s] = 1);
    [4,12].forEach(s => techno.tracks[1][s] = 1);
    for (let s = 0; s < 16; s += 2) techno.tracks[2][s] = 1;
    [2,6,10,14].forEach(s => { techno.tracks[2][s] = 1; techno.velocities[2][s] = 0.5; });
    [0,8].forEach(s => techno.tracks[3][s] = 1);
    this.patterns['Techno'] = techno;

    // House
    const house = JSON.parse(JSON.stringify(this._emptyPattern()));
    [0,4,8,12].forEach(s => house.tracks[0][s] = 1);
    [4,12].forEach(s => house.tracks[1][s] = 1);
    [2,6,10,14].forEach(s => house.tracks[2][s] = 1);
    [4,12].forEach(s => house.tracks[1][s] = 1);
    [0,4,8,12].forEach(s => house.tracks[3][s] = 1);
    [4,12].forEach(s => { house.tracks[2][s] = 0; house.tracks[2][s+1] = 1; });
    this.patterns['House'] = house;

    // Hip-Hop
    const hiphop = JSON.parse(JSON.stringify(this._emptyPattern()));
    [0,5,8,13].forEach(s => hiphop.tracks[0][s] = 1);
    [4,12].forEach(s => hiphop.tracks[1][s] = 1);
    for (let s = 0; s < 16; s += 2) hiphop.tracks[2][s] = 1;
    [0,5,10].forEach(s => hiphop.tracks[3][s] = 1);
    this.patterns['Hip-Hop'] = hiphop;

    // DnB
    const dnb = JSON.parse(JSON.stringify(this._emptyPattern()));
    [0,10].forEach(s => dnb.tracks[0][s] = 1);
    [4,14].forEach(s => dnb.tracks[1][s] = 1);
    for (let s = 0; s < 16; s++) dnb.tracks[2][s] = 1;
    [2,6,8,12].forEach(s => { dnb.tracks[2][s] = 0; });
    [0,3,6,10,13].forEach(s => dnb.tracks[3][s] = 1);
    this.patterns['DnB'] = dnb;
  }

  async init(container) {
    this.container = container;
    this.engine = window.nexusAudio;
    await this.engine.init();
    for (let i = 0; i < this.numTracks; i++) {
      this.engine.createChannel(i, this.trackNames[i]);
      this.engine.setChannelVolume(i, this.tracks[i].volume);
    }
    this._injectStyles();
    this._buildDOM();
    this._bindEvents();
    this._startAnimation();
  }

  _injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .nexus-seq { width:100%; height:100%; display:flex; flex-direction:column; background:rgba(10,5,15,0.95); color:#e0d0e8; font-family:'Segoe UI',sans-serif; font-size:11px; overflow:hidden; user-select:none; }
      .nexus-seq * { box-sizing:border-box; }
      .nqs-header { display:flex; align-items:center; gap:10px; padding:8px 12px; background:rgba(20,10,30,0.9); border-bottom:1px solid rgba(255,23,68,0.3); flex-shrink:0; }
      .nqs-header h2 { margin:0; font-size:14px; color:#ff4081; letter-spacing:3px; text-transform:uppercase; text-shadow:0 0 10px rgba(255,23,68,0.5); }
      .nqs-toolbar { display:flex; align-items:center; gap:8px; padding:6px 12px; background:rgba(15,8,25,0.9); border-bottom:1px solid rgba(255,23,68,0.15); flex-shrink:0; flex-wrap:wrap; }
      .nqs-btn { background:rgba(40,20,60,0.8); border:1px solid rgba(255,23,68,0.4); color:#ff6090; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:11px; transition:all 0.15s; }
      .nqs-btn:hover { background:rgba(255,23,68,0.2); border-color:#ff1744; }
      .nqs-btn.active { background:rgba(255,23,68,0.3); border-color:#ff1744; box-shadow:0 0 8px rgba(255,23,68,0.4); color:#fff; }
      .nqs-btn.play.active { background:rgba(0,255,100,0.2); border-color:#00e676; color:#00e676; }
      .nqs-btn.stop { color:#ff5252; }
      .nqs-bpm { display:flex; align-items:center; gap:4px; }
      .nqs-bpm input { width:50px; background:rgba(30,15,45,0.9); border:1px solid rgba(255,23,68,0.2); color:#ff4081; text-align:center; font-size:14px; font-weight:bold; padding:3px; border-radius:4px; outline:none; }
      .nqs-bpm label { color:#888; font-size:10px; }
      .nqs-select { background:rgba(30,15,45,0.9); border:1px solid rgba(255,23,68,0.2); color:#ff6090; padding:3px 6px; border-radius:3px; font-size:10px; outline:none; }
      .nqs-slider { -webkit-appearance:none; width:80px; height:4px; background:rgba(255,23,68,0.2); border-radius:2px; outline:none; }
      .nqs-slider::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; background:#ff4081; border-radius:50%; cursor:pointer; box-shadow:0 0 4px rgba(255,23,68,0.5); }
      .nqs-main { flex:1; display:flex; flex-direction:column; overflow:auto; padding:8px; gap:4px; }
      .nqs-track-row { display:flex; align-items:center; gap:6px; background:rgba(25,12,40,0.7); border:1px solid rgba(255,23,68,0.1); border-radius:6px; padding:6px 8px; backdrop-filter:blur(5px); }
      .nqs-track-info { display:flex; align-items:center; gap:6px; min-width:120px; flex-shrink:0; }
      .nqs-track-color { width:4px; height:28px; border-radius:2px; }
      .nqs-track-name { font-size:10px; color:#ccc; width:40px; cursor:pointer; }
      .nqs-track-name:hover { color:#fff; }
      .nqs-mini-btn { width:18px; height:18px; border-radius:3px; border:1px solid rgba(255,23,68,0.3); background:rgba(30,15,45,0.8); color:#888; font-size:7px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
      .nqs-mini-btn.mute.active { background:rgba(255,82,82,0.3); border-color:#ff5252; color:#ff5252; }
      .nqs-mini-btn.solo.active { background:rgba(255,193,7,0.3); border-color:#ffc107; color:#ffc107; }
      .nqs-param-btn { background:rgba(30,15,45,0.8); border:1px solid rgba(255,23,68,0.2); color:#888; padding:2px 6px; border-radius:3px; cursor:pointer; font-size:9px; }
      .nqs-param-btn:hover { border-color:rgba(255,23,68,0.4); color:#ccc; }
      .nqs-meter { width:4px; height:28px; background:rgba(10,5,15,0.8); border-radius:2px; overflow:hidden; }
      .nqs-meter-fill { width:100%; background:linear-gradient(to top, #00e676, #ffeb3b, #ff5252); border-radius:2px; transition:height 0.05s; }
      .nqs-step-grid { display:flex; gap:2px; flex:1; align-items:center; }
      .nqs-step { width:24px; height:24px; border-radius:3px; border:1px solid rgba(255,23,68,0.12); background:rgba(20,10,35,0.6); cursor:pointer; transition:all 0.08s; flex-shrink:0; position:relative; }
      .nqs-step:hover { border-color:rgba(255,23,68,0.4); }
      .nqs-step.active { box-shadow:0 0 8px currentColor; }
      .nqs-step.current { border-color:rgba(255,255,255,0.5) !important; box-shadow:0 0 4px rgba(255,255,255,0.3); }
      .nqs-step.beat { border-bottom:2px solid rgba(255,23,68,0.2); }
      .nqs-chain { display:flex; gap:4px; padding:6px 12px; background:rgba(15,8,25,0.9); border-top:1px solid rgba(255,23,68,0.15); flex-shrink:0; overflow-x:auto; align-items:center; }
      .nqs-chain-item { padding:4px 8px; background:rgba(255,23,68,0.1); border:1px solid rgba(255,23,68,0.2); border-radius:4px; font-size:10px; color:#ff6090; cursor:pointer; white-space:nowrap; }
      .nqs-chain-item.current { background:rgba(255,23,68,0.3); border-color:#ff1744; color:#fff; }
      .nqs-chain-item:hover { background:rgba(255,23,68,0.2); }
      .nqs-live-grid { display:flex; gap:4px; padding:6px 12px; background:rgba(15,8,25,0.7); border-top:1px solid rgba(255,23,68,0.1); flex-shrink:0; flex-wrap:wrap; align-items:center; }
      .nqs-live-btn { width:40px; height:30px; border-radius:4px; border:1px solid rgba(255,23,68,0.2); background:rgba(30,15,45,0.8); color:#888; font-size:9px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
      .nqs-live-btn:hover { border-color:rgba(255,23,68,0.4); }
      .nqs-live-btn.queued { border-color:#ffc107; color:#ffc107; background:rgba(255,193,7,0.1); }
      .nqs-live-btn.active { border-color:#ff1744; color:#fff; background:rgba(255,23,68,0.3); box-shadow:0 0 6px rgba(255,23,68,0.4); }
      .nqs-params-panel { padding:8px 12px; background:rgba(20,10,30,0.95); border-top:1px solid rgba(255,23,68,0.2); display:none; flex-shrink:0; }
      .nqs-params-panel.visible { display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
      .nqs-param-group { display:flex; align-items:center; gap:4px; }
      .nqs-param-label { font-size:9px; color:#888; }
      .nqs-knob-sm { width:22px; height:22px; border-radius:50%; background:radial-gradient(circle at 40% 35%, rgba(60,30,80,0.9), rgba(20,10,35,0.95)); border:2px solid rgba(255,23,68,0.3); cursor:pointer; }
    `;
    this.container.appendChild(style);
  }

  _buildDOM() {
    const root = document.createElement('div');
    root.className = 'nexus-seq';

    // Header
    const header = document.createElement('div');
    header.className = 'nqs-header';
    header.innerHTML = `<h2>Sequencer</h2>`;
    root.appendChild(header);

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'nqs-toolbar';
    toolbar.innerHTML = `
      <button class="nqs-btn play" data-action="play">▶</button>
      <button class="nqs-btn" data-action="pause">⏸</button>
      <button class="nqs-btn stop" data-action="stop">⏹</button>
      <div class="nqs-bpm">
        <label>BPM</label>
        <button class="nqs-btn" data-action="bpm-dec" style="padding:2px 6px;">-</button>
        <input type="number" value="120" min="60" max="200" id="nqs-bpm">
        <button class="nqs-btn" data-action="bpm-inc" style="padding:2px 6px;">+</button>
      </div>
      <label style="color:#888;font-size:10px;">Swing:</label>
      <input type="range" class="nqs-slider" min="0" max="100" value="0" id="nqs-swing">
      <label style="color:#888;font-size:10px;">Master:</label>
      <input type="range" class="nqs-slider" min="0" max="100" value="80" id="nqs-master">
      <label style="color:#888;font-size:10px;">Pattern:</label>
      <select class="nqs-select" id="nqs-pattern"></select>
      <button class="nqs-btn" data-action="live-mode" id="nqs-live-btn">Live</button>
      <button class="nqs-btn" data-action="copy">Copy</button>
      <button class="nqs-btn" data-action="clear">Clear</button>
      <button class="nqs-btn" data-action="export">Export WAV</button>
    `;
    root.appendChild(toolbar);

    // Main grid
    const main = document.createElement('div');
    main.className = 'nqs-main';
    main.id = 'nqs-main';
    for (let i = 0; i < this.numTracks; i++) {
      main.appendChild(this._buildTrackRow(i));
    }
    root.appendChild(main);

    // Params panel
    this.paramsPanel = document.createElement('div');
    this.paramsPanel.className = 'nqs-params-panel';
    root.appendChild(this.paramsPanel);

    // Pattern chain
    this.chainBar = document.createElement('div');
    this.chainBar.className = 'nqs-chain';
    this.chainBar.innerHTML = `<label style="font-size:10px;color:#888;">Chain:</label>
      <button class="nqs-btn" data-action="chain-add">+</button>
      <button class="nqs-btn" data-action="chain-clear">Clear</button>
      <div id="nqs-chain-list" style="display:flex;gap:3px;"></div>`;
    root.appendChild(this.chainBar);

    // Live mode buttons
    this.liveGrid = document.createElement('div');
    this.liveGrid.className = 'nqs-live-grid';
    this.liveGrid.style.display = 'none';
    this.liveGrid.innerHTML = `<label style="font-size:10px;color:#888;">Live:</label>`;
    root.appendChild(this.liveGrid);
    this._buildLiveGrid();

    this.container.appendChild(root);
    this.root = root;
    this._updatePatternSelect();
  }

  _buildTrackRow(index) {
    const track = this.tracks[index];
    const row = document.createElement('div');
    row.className = 'nqs-track-row';
    row.dataset.track = index;

    // Info
    const info = document.createElement('div');
    info.className = 'nqs-track-info';

    const color = document.createElement('div');
    color.className = 'nqs-track-color';
    color.style.background = track.color;
    info.appendChild(color);

    const name = document.createElement('div');
    name.className = 'nqs-track-name';
    name.textContent = track.name;
    name.addEventListener('dblclick', () => {
      const n = prompt('Track name:', track.name);
      if (n) { track.name = n; name.textContent = n; }
    });
    info.appendChild(name);

    // Mute
    const mute = document.createElement('button');
    mute.className = 'nqs-mini-btn mute';
    mute.textContent = 'M';
    mute.addEventListener('click', () => {
      track.muted = !track.muted;
      mute.classList.toggle('active');
      this.engine.setChannelMute(index, track.muted);
    });
    info.appendChild(mute);

    // Solo
    const solo = document.createElement('button');
    solo.className = 'nqs-mini-btn solo';
    solo.textContent = 'S';
    solo.addEventListener('click', () => {
      track.solo = !track.solo;
      solo.classList.toggle('active');
      this.engine.setChannelSolo(index, track.solo);
    });
    info.appendChild(solo);

    // Params button
    const paramBtn = document.createElement('button');
    paramBtn.className = 'nqs-param-btn';
    paramBtn.textContent = 'Edit';
    paramBtn.addEventListener('click', () => this._openTrackParams(index));
    info.appendChild(paramBtn);

    // Randomize button
    const randBtn = document.createElement('button');
    randBtn.className = 'nqs-param-btn';
    randBtn.textContent = 'Rand';
    randBtn.addEventListener('click', () => this._randomizeTrack(index));
    info.appendChild(randBtn);

    row.appendChild(info);

    // Meter
    const meter = document.createElement('div');
    meter.className = 'nqs-meter';
    const meterFill = document.createElement('div');
    meterFill.className = 'nqs-meter-fill';
    meterFill.style.height = '0%';
    meterFill.dataset.role = 'meter';
    meter.appendChild(meterFill);
    row.appendChild(meter);

    // Step grid
    const grid = document.createElement('div');
    grid.className = 'nqs-step-grid';
    grid.dataset.role = 'stepGrid';
    const pat = this.patterns[this.currentPattern];
    for (let s = 0; s < this.stepsPerPattern; s++) {
      const step = document.createElement('div');
      step.className = 'nqs-step' + (pat.tracks[index][s] ? ' active' : '');
      if (s % 4 === 0) step.classList.add('beat');
      step.style.color = track.color;
      if (pat.tracks[index][s]) step.style.background = track.color;
      step.dataset.track = index;
      step.dataset.step = s;

      step.addEventListener('click', () => {
        const p = this.patterns[this.currentPattern];
        p.tracks[index][s] = p.tracks[index][s] ? 0 : 1;
        step.classList.toggle('active');
        step.style.background = p.tracks[index][s] ? track.color : '';
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

  _updatePatternSelect() {
    const sel = this.root?.querySelector('#nqs-pattern');
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

  _buildLiveGrid() {
    const grid = this.liveGrid;
    if (!grid) return;
    Object.keys(this.patterns).forEach(name => {
      const btn = document.createElement('button');
      btn.className = 'nqs-live-btn';
      btn.textContent = name.replace('Pattern ', 'P');
      btn.dataset.pattern = name;
      btn.addEventListener('click', () => this._queuePattern(name));
      grid.appendChild(btn);
    });
  }

  _openTrackParams(index) {
    const panel = this.paramsPanel;
    if (!panel) return;
    panel.innerHTML = '';
    const track = this.tracks[index];
    const params = track.params;

    const title = document.createElement('span');
    title.style.cssText = 'color:#ff4081;font-size:10px;font-weight:bold;min-width:50px;';
    title.textContent = track.name;
    panel.appendChild(title);

    // Volume
    const volKnob = document.createElement('div');
    volKnob.className = 'nqs-knob-sm';
    const volGroup = document.createElement('div');
    volGroup.className = 'nqs-param-group';
    const volLabel = document.createElement('span');
    volLabel.className = 'nqs-param-label';
    volLabel.textContent = 'Vol';
    volGroup.appendChild(volLabel);
    volGroup.appendChild(volKnob);
    this._makeKnob(volKnob, track.volume, 0, 1, (v) => {
      track.volume = v;
      this.engine.setChannelVolume(index, v);
    });
    panel.appendChild(volGroup);

    // Pan
    const panKnob = document.createElement('div');
    panKnob.className = 'nqs-knob-sm';
    const panGroup = document.createElement('div');
    panGroup.className = 'nqs-param-group';
    const panLabel = document.createElement('span');
    panLabel.className = 'nqs-param-label';
    panLabel.textContent = 'Pan';
    panGroup.appendChild(panLabel);
    panGroup.appendChild(panKnob);
    this._makeKnob(panKnob, track.pan, -1, 1, (v) => {
      track.pan = v;
      this.engine.setChannelPan(index, v);
    });
    panel.appendChild(panGroup);

    // Type-specific params
    if (['kick', 'snare', 'hihat', 'perc'].includes(track.type)) {
      // Tune
      const tuneKnob = document.createElement('div');
      tuneKnob.className = 'nqs-knob-sm';
      const tuneGroup = document.createElement('div');
      tuneGroup.className = 'nqs-param-group';
      const tuneLabel = document.createElement('span');
      tuneLabel.className = 'nqs-param-label';
      tuneLabel.textContent = 'Tune';
      tuneGroup.appendChild(tuneLabel);
      tuneGroup.appendChild(tuneKnob);
      this._makeKnob(tuneKnob, params.tune || 150, 20, 8000, (v) => { params.tune = v; });
      panel.appendChild(tuneGroup);

      // Decay
      const decKnob = document.createElement('div');
      decKnob.className = 'nqs-knob-sm';
      const decGroup = document.createElement('div');
      decGroup.className = 'nqs-param-group';
      const decLabel = document.createElement('span');
      decLabel.className = 'nqs-param-label';
      decLabel.textContent = 'Decay';
      decGroup.appendChild(decLabel);
      decGroup.appendChild(decKnob);
      this._makeKnob(decKnob, params.decay || 0.2, 0.01, 2, (v) => { params.decay = v; });
      panel.appendChild(decGroup);
    } else {
      // Synth params: Filter freq, filter Q
      const cutKnob = document.createElement('div');
      cutKnob.className = 'nqs-knob-sm';
      const cutGroup = document.createElement('div');
      cutGroup.className = 'nqs-param-group';
      const cutLabel = document.createElement('span');
      cutLabel.className = 'nqs-param-label';
      cutLabel.textContent = 'Cutoff';
      cutGroup.appendChild(cutLabel);
      cutGroup.appendChild(cutKnob);
      this._makeKnob(cutKnob, params.filterFreq || 2000, 20, 20000, (v) => { params.filterFreq = v; });
      panel.appendChild(cutGroup);

      const qKnob = document.createElement('div');
      qKnob.className = 'nqs-knob-sm';
      const qGroup = document.createElement('div');
      qGroup.className = 'nqs-param-group';
      const qLabel = document.createElement('span');
      qLabel.className = 'nqs-param-label';
      qLabel.textContent = 'Res';
      qGroup.appendChild(qLabel);
      qGroup.appendChild(qKnob);
      this._makeKnob(qKnob, params.filterQ || 1, 0.1, 30, (v) => { params.filterQ = v; });
      panel.appendChild(qGroup);
    }

    panel.classList.add('visible');
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
        case 'live-mode':
          this.liveMode = !this.liveMode;
          btn.classList.toggle('active', this.liveMode);
          this.liveGrid.style.display = this.liveMode ? 'flex' : 'none';
          break;
        case 'copy': this._copyPattern(); break;
        case 'clear': this._clearPattern(); break;
        case 'export': this._exportWAV(); break;
        case 'chain-add': this._addToChain(); break;
        case 'chain-clear': this.patternChain = []; this._updateChain(); break;
      }
    });

    const bpmInput = this.root.querySelector('#nqs-bpm');
    if (bpmInput) {
      bpmInput.addEventListener('change', () => {
        const v = parseInt(bpmInput.value);
        if (v >= 60 && v <= 200) this._setBPM(v);
      });
    }

    const swingSlider = this.root.querySelector('#nqs-swing');
    if (swingSlider) {
      swingSlider.addEventListener('input', () => {
        this.engine.swing = parseInt(swingSlider.value);
      });
    }

    const masterSlider = this.root.querySelector('#nqs-master');
    if (masterSlider) {
      masterSlider.addEventListener('input', () => {
        if (this.engine.masterGain) {
          this.engine.masterGain.gain.setTargetAtTime(parseInt(masterSlider.value) / 100, this.engine.ctx.currentTime, 0.01);
        }
      });
    }

    const patSel = this.root.querySelector('#nqs-pattern');
    if (patSel) {
      patSel.addEventListener('change', () => {
        this.currentPattern = patSel.value;
        this._rebuildGrid();
      });
    }

    // Keyboard shortcuts for live mode
    document.addEventListener('keydown', (e) => {
      if (!this.liveMode) return;
      const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7 };
      const patKeys = Object.keys(this.patterns);
      if (keyMap[e.key] !== undefined && keyMap[e.key] < patKeys.length) {
        this._queuePattern(patKeys[keyMap[e.key]]);
      }
    });
  }

  _setBPM(bpm) {
    this.engine.bpm = bpm;
    const input = this.root.querySelector('#nqs-bpm');
    if (input) input.value = bpm;
  }

  _play() {
    if (this.engine.isPlaying) return;
    const pat = this.patterns[this.currentPattern];
    if (!pat) return;

    this.engine.onStep = (step) => this._highlightStep(step);

    this.engine.start((step, time) => {
      const currentPat = this.patterns[this.currentPattern];
      if (!currentPat) return;
      this._playStep(step, time, currentPat);

      // Handle pattern chain
      if (step === 0 && this.patternChain.length > 1) {
        const currentIdx = this.patternChain.indexOf(this.currentPattern);
        if (currentIdx >= 0 && currentIdx < this.patternChain.length - 1) {
          // Will switch at next pattern boundary
        }
      }

      // Handle live mode pattern switch
      if (step === 0 && this.nextPattern) {
        this.currentPattern = this.nextPattern;
        this.nextPattern = null;
        this._updateLiveButtons();
        const sel = this.root.querySelector('#nqs-pattern');
        if (sel) sel.value = this.currentPattern;
      }
    }, this.stepsPerPattern);
  }

  _playStep(step, time, pat) {
    const hasSolo = this.tracks.some(t => t.solo);
    for (let i = 0; i < this.numTracks; i++) {
      if (!pat.tracks[i] || !pat.tracks[i][step]) continue;
      if (this.tracks[i].muted) continue;
      if (hasSolo && !this.tracks[i].solo) continue;

      const vel = (pat.velocities[i]?.[step] || 0.8) * this.tracks[i].volume;
      const track = this.tracks[i];
      const params = track.params;

      switch (track.type) {
        case 'kick':
          this.engine.playKick(time, i, { velocity: vel, tune: params.tune, decay: params.decay });
          break;
        case 'snare':
          this.engine.playSnare(time, i, { velocity: vel, tune: params.tune, decay: params.decay, tone: params.tone });
          break;
        case 'hihat':
          this.engine.playHihat(time, i, { velocity: vel, tone: params.tone, decay: params.decay });
          break;
        case 'perc':
          this.engine.playRim(time, i, { velocity: vel, tune: params.tune });
          break;
        case 'bass':
        case 'lead':
        case 'chord':
        case 'fx': {
          const noteFreq = NexusAudioEngine.noteToFreq('C', track.type === 'bass' ? 2 : track.type === 'fx' ? 5 : 4);
          const stepDuration = 60 / this.engine.bpm / 4;
          this.engine.playNote(noteFreq, stepDuration * 0.9, time, i, {
            waveform: params.waveform || 'sawtooth',
            velocity: vel,
            attack: params.attack || 0.01,
            decay: params.decay || 0.1,
            sustain: params.sustain || 0.6,
            release: params.release || 0.2,
            filterFreq: params.filterFreq,
            filterQ: params.filterQ
          });
          // For chord track, add extra notes
          if (track.type === 'chord') {
            const third = noteFreq * Math.pow(2, 4/12);
            const fifth = noteFreq * Math.pow(2, 7/12);
            this.engine.playNote(third, stepDuration * 0.9, time, i, {
              waveform: params.waveform || 'sawtooth', velocity: vel * 0.7,
              attack: params.attack, decay: params.decay, sustain: params.sustain, release: params.release,
              filterFreq: params.filterFreq, filterQ: params.filterQ
            });
            this.engine.playNote(fifth, stepDuration * 0.9, time, i, {
              waveform: params.waveform || 'sawtooth', velocity: vel * 0.5,
              attack: params.attack, decay: params.decay, sustain: params.sustain, release: params.release,
              filterFreq: params.filterFreq, filterQ: params.filterQ
            });
          }
          break;
        }
      }
    }
  }

  _pause() {
    this.engine.pause();
    this.root.querySelector('.play')?.classList.remove('active');
  }

  _stop() {
    this.engine.stop();
    this._highlightStep(-1);
  }

  _highlightStep(step) {
    const rows = this.root.querySelectorAll('.nqs-track-row');
    rows.forEach(row => {
      const steps = row.querySelectorAll('.nqs-step');
      steps.forEach((s, i) => {
        s.classList.toggle('current', i === step);
      });
    });
  }

  _queuePattern(name) {
    if (!this.patterns[name]) return;
    this.nextPattern = name;
    this._updateLiveButtons();
  }

  _updateLiveButtons() {
    const buttons = this.liveGrid.querySelectorAll('.nqs-live-btn');
    buttons.forEach(btn => {
      btn.classList.remove('active', 'queued');
      if (btn.dataset.pattern === this.currentPattern) btn.classList.add('active');
      if (btn.dataset.pattern === this.nextPattern) btn.classList.add('queued');
    });
  }

  _copyPattern() {
    const pat = this.patterns[this.currentPattern];
    if (!pat) return;
    const newName = prompt('Copy to:', `Pattern ${Object.keys(this.patterns).length + 1}`);
    if (!newName) return;
    this.patterns[newName] = JSON.parse(JSON.stringify(pat));
    this._updatePatternSelect();
    this._updateLiveGrid();
  }

  _clearPattern() {
    const pat = this.patterns[this.currentPattern];
    if (!pat) return;
    for (let i = 0; i < this.numTracks; i++) {
      pat.tracks[i].fill(0);
      pat.velocities[i].fill(0.8);
    }
    this._rebuildGrid();
  }

  _randomizeTrack(index) {
    const pat = this.patterns[this.currentPattern];
    if (!pat) return;
    for (let s = 0; s < this.stepsPerPattern; s++) {
      pat.tracks[index][s] = Math.random() > 0.65 ? 1 : 0;
      pat.velocities[index][s] = 0.5 + Math.random() * 0.5;
    }
    this._rebuildGrid();
  }

  _rebuildGrid() {
    const main = this.root.querySelector('#nqs-main');
    if (!main) return;
    main.innerHTML = '';
    for (let i = 0; i < this.numTracks; i++) {
      main.appendChild(this._buildTrackRow(i));
    }
  }

  _updateLiveGrid() {
    const grid = this.liveGrid;
    if (!grid) return;
    // Keep label, clear buttons, rebuild
    const label = grid.querySelector('label');
    grid.innerHTML = '';
    if (label) grid.appendChild(label);
    else {
      const l = document.createElement('label');
      l.style.cssText = 'font-size:10px;color:#888;';
      l.textContent = 'Live:';
      grid.appendChild(l);
    }
    Object.keys(this.patterns).forEach(name => {
      const btn = document.createElement('button');
      btn.className = 'nqs-live-btn';
      btn.textContent = name.length > 5 ? name.substring(0, 5) : name;
      btn.dataset.pattern = name;
      if (name === this.currentPattern) btn.classList.add('active');
      btn.addEventListener('click', () => this._queuePattern(name));
      grid.appendChild(btn);
    });
  }

  _addToChain() {
    this.patternChain.push(this.currentPattern);
    this._updateChain();
  }

  _updateChain() {
    const list = this.root.querySelector('#nqs-chain-list');
    if (!list) return;
    list.innerHTML = '';
    this.patternChain.forEach((name, i) => {
      const item = document.createElement('div');
      item.className = 'nqs-chain-item' + (name === this.currentPattern ? ' current' : '');
      item.textContent = name;
      item.addEventListener('click', () => {
        this.patternChain.splice(i, 1);
        this._updateChain();
      });
      list.appendChild(item);
    });
  }

  async _exportWAV() {
    const pat = this.patterns[this.currentPattern];
    if (!pat) { alert('No pattern to export.'); return; }
    const stepDuration = 60 / this.engine.bpm / 4;
    const totalDuration = this.stepsPerPattern * stepDuration + 1;

    const buffer = await this.engine.renderToBuffer((step, time, ctx, dest) => {
      for (let i = 0; i < this.numTracks; i++) {
        if (!pat.tracks[i] || !pat.tracks[i][step]) continue;
        const vel = (pat.velocities[i]?.[step] || 0.8) * this.tracks[i].volume;
        const track = this.tracks[i];
        const params = track.params;

        switch (track.type) {
          case 'kick': {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(params.tune || 150, time);
            osc.frequency.exponentialRampToValueAtTime(30, time + 0.07);
            g.gain.setValueAtTime(vel, time);
            g.gain.exponentialRampToValueAtTime(0.001, time + (params.decay || 0.4));
            osc.connect(g); g.connect(dest);
            osc.start(time); osc.stop(time + 0.5);
            break;
          }
          case 'snare': {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(params.tune || 180, time);
            g.gain.setValueAtTime(0.6 * vel, time);
            g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
            osc.connect(g); g.connect(dest);
            osc.start(time); osc.stop(time + 0.15);
            const nL = ctx.sampleRate * 0.2;
            const nB = ctx.createBuffer(1, nL, ctx.sampleRate);
            const nd = nB.getChannelData(0);
            for (let j = 0; j < nL; j++) nd[j] = Math.random() * 2 - 1;
            const ns = ctx.createBufferSource(); ns.buffer = nB;
            const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = params.tone || 1000;
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(0.7 * vel, time);
            ng.gain.exponentialRampToValueAtTime(0.001, time + (params.decay || 0.2));
            ns.connect(hp); hp.connect(ng); ng.connect(dest);
            ns.start(time); ns.stop(time + 0.25);
            break;
          }
          case 'hihat': {
            const nL = ctx.sampleRate * 0.06;
            const nB = ctx.createBuffer(1, nL, ctx.sampleRate);
            const nd = nB.getChannelData(0);
            for (let j = 0; j < nL; j++) nd[j] = Math.random() * 2 - 1;
            const ns = ctx.createBufferSource(); ns.buffer = nB;
            const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = params.tone || 7000;
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(0.4 * vel, time);
            ng.gain.exponentialRampToValueAtTime(0.001, time + (params.decay || 0.05));
            ns.connect(hp); hp.connect(ng); ng.connect(dest);
            ns.start(time); ns.stop(time + 0.1);
            break;
          }
          default: {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = params.waveform || 'sawtooth';
            osc.frequency.value = track.type === 'bass' ? NexusAudioEngine.noteToFreq('C', 2) : NexusAudioEngine.noteToFreq('C', 4);
            g.gain.setValueAtTime(0, time);
            g.gain.linearRampToValueAtTime(vel, time + (params.attack || 0.01));
            g.gain.linearRampToValueAtTime((params.sustain || 0.6) * vel, time + (params.attack || 0.01) + (params.decay || 0.1));
            g.gain.setValueAtTime((params.sustain || 0.6) * vel, time + stepDuration * 0.8);
            g.gain.linearRampToValueAtTime(0, time + stepDuration + (params.release || 0.2));
            osc.connect(g); g.connect(dest);
            osc.start(time); osc.stop(time + stepDuration + 0.5);
          }
        }
      }
    }, totalDuration, 44100);

    const blob = this.engine.audioBufferToWav(buffer);
    this.engine.downloadWav(blob, `seq-${this.currentPattern}.wav`);
  }

  _startAnimation() {
    const animate = () => {
      this.animFrameId = requestAnimationFrame(animate);
      this._updateMeters();
    };
    animate();
  }

  _updateMeters() {
    const rows = this.root.querySelectorAll('.nqs-track-row');
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

window.NexusSequencer = NexusSequencer;
