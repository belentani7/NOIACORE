/**
 * NEXUS OS — Audio Visualizer
 * Music visualization with multiple canvas-rendered modes
 * Pure vanilla JS, no external dependencies
 */

class NexusAudioVisualizer {
  constructor(container) {
    this.container = typeof container === 'string'
      ? document.querySelector(container) : container;
    this.canvas = null;
    this.ctx = null;
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.freqData = null;
    this.timeData = null;
    this.animFrame = null;
    this.isRunning = false;
    this.currentMode = 'bars';
    this.audioElement = null;

    // Visual settings
    this.settings = {
      primaryColor: '#ff003c',
      secondaryColor: '#ff2d6b',
      bgColor: '#0a0a0f',
      sensitivity: 1.5,
      smoothing: 0.8,
      fftSize: 256
    };

    // Beat detection
    this.beatThreshold = 1.3;
    this.beatDecay = 0.98;
    this.lastBeatEnergy = 0;
    this.beatPulse = 0;
    this.avgEnergy = 0;

    // Particle system state
    this.particles = [];
    this.galaxyAngle = 0;
    this.matrixColumns = [];
    this.gridOffset = 0;
    this.liquidData = null;
    this.dnaAngle = 0;
    this.terrainSeed = Math.random() * 100;

    // Presets
    this.presets = JSON.parse(localStorage.getItem('nexus-viz-presets') || '{}');
  }

  render() {
    this.container.innerHTML = '';
    this._injectStyles();
    this._buildUI();
    this._bindEvents();
  }

  destroy() {
    this.stop();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
    this.container.innerHTML = '';
  }

  _injectStyles() {
    if (document.getElementById('nexus-audio-viz-styles')) return;
    const style = document.createElement('style');
    style.id = 'nexus-audio-viz-styles';
    style.textContent = `
      .nav-root {
        display: flex; height: 100%; background: #0a0a0f;
        font-family: 'Segoe UI', system-ui, sans-serif; color: #e0e0e0;
        overflow: hidden;
      }
      .nav-main {
        flex: 1; display: flex; flex-direction: column; position: relative; min-width: 0;
      }
      .nav-canvas-area {
        flex: 1; position: relative; overflow: hidden; background: #0a0a0f;
      }
      .nav-canvas-area canvas {
        width: 100%; height: 100%; display: block;
      }
      .nav-toolbar {
        display: flex; align-items: center; gap: 6px; padding: 8px 12px;
        background: rgba(15,15,25,0.95); border-top: 1px solid rgba(255,0,60,0.1);
        flex-wrap: wrap;
      }
      .nav-btn {
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,0,60,0.15);
        color: #ccc; padding: 6px 12px; border-radius: 6px; cursor: pointer;
        font-size: 12px; transition: all 0.2s; white-space: nowrap;
      }
      .nav-btn:hover { background: rgba(255,0,60,0.1); color: #ff003c; }
      .nav-btn.active {
        background: rgba(255,0,60,0.2); color: #ff003c;
        border-color: #ff003c; box-shadow: 0 0 8px rgba(255,0,60,0.2);
      }
      .nav-sep { width: 1px; height: 20px; background: rgba(255,0,60,0.15); margin: 0 4px; }
      .nav-spacer { flex: 1; }
      .nav-select {
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,0,60,0.15);
        color: #ccc; padding: 5px 8px; border-radius: 6px; font-size: 12px;
        outline: none; cursor: pointer;
      }
      .nav-select option { background: #1a1a2e; }

      /* Sidebar */
      .nav-sidebar {
        width: 260px; background: rgba(15,15,25,0.95);
        border-left: 1px solid rgba(255,0,60,0.15);
        display: flex; flex-direction: column; overflow: hidden;
        transition: width 0.3s;
      }
      .nav-sidebar.collapsed { width: 0; border: none; }
      .nav-sidebar-header {
        padding: 12px; border-bottom: 1px solid rgba(255,0,60,0.1);
        font-size: 14px; font-weight: 600; color: #ff2d6b;
      }
      .nav-sidebar-scroll { flex: 1; overflow-y: auto; padding: 12px; }
      .nav-sidebar-scroll::-webkit-scrollbar { width: 4px; }
      .nav-sidebar-scroll::-webkit-scrollbar-thumb { background: #ff003c33; border-radius: 2px; }

      .nav-mode-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 16px;
      }
      .nav-mode-btn {
        padding: 8px; font-size: 11px; text-align: center;
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,0,60,0.1);
        border-radius: 6px; color: #888; cursor: pointer; transition: all 0.2s;
      }
      .nav-mode-btn:hover { background: rgba(255,0,60,0.08); color: #ddd; }
      .nav-mode-btn.active {
        background: rgba(255,0,60,0.15); color: #ff003c;
        border-color: #ff003c; box-shadow: 0 0 8px rgba(255,0,60,0.15);
      }

      .nav-setting-group {
        margin-bottom: 16px;
      }
      .nav-setting-title {
        font-size: 11px; color: #666; text-transform: uppercase;
        letter-spacing: 1px; margin-bottom: 8px;
      }
      .nav-setting-row {
        display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
      }
      .nav-setting-label { font-size: 12px; color: #888; width: 70px; }
      .nav-setting-slider {
        flex: 1; -webkit-appearance: none; height: 3px;
        background: rgba(255,255,255,0.1); border-radius: 2px; outline: none;
      }
      .nav-setting-slider::-webkit-slider-thumb {
        -webkit-appearance: none; width: 10px; height: 10px;
        background: #ff003c; border-radius: 50%; cursor: pointer;
      }
      .nav-setting-val { font-size: 11px; color: #ff2d6b; width: 30px; text-align: right; }
      .nav-color-input {
        width: 30px; height: 24px; border: 1px solid rgba(255,0,60,0.2);
        border-radius: 4px; cursor: pointer; background: none; padding: 0;
      }

      .nav-preset-row {
        display: flex; gap: 6px; margin-bottom: 8px;
      }
      .nav-preset-btn {
        flex: 1; padding: 5px; font-size: 11px; text-align: center;
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,0,60,0.1);
        border-radius: 6px; color: #888; cursor: pointer; transition: all 0.2s;
      }
      .nav-preset-btn:hover { background: rgba(255,0,60,0.08); color: #ddd; }

      .nav-source-indicator {
        padding: 8px 12px; background: rgba(255,0,60,0.05);
        border: 1px solid rgba(255,0,60,0.15); border-radius: 6px;
        font-size: 12px; color: #666; margin-bottom: 12px; text-align: center;
      }
      .nav-source-indicator.active { color: #ff2d6b; border-color: rgba(255,0,60,0.3); }
    `;
    document.head.appendChild(style);
  }

  _buildUI() {
    const root = document.createElement('div');
    root.className = 'nav-root';
    root.innerHTML = `
      <div class="nav-main">
        <div class="nav-canvas-area" data-nav="canvasArea">
          <canvas data-nav="canvas"></canvas>
        </div>
        <div class="nav-toolbar">
          <button class="nav-btn" data-nav="micBtn" title="Microphone">🎤 Mic</button>
          <button class="nav-btn" data-nav="fileBtn" title="Audio File">🎵 File</button>
          <div class="nav-sep"></div>
          <button class="nav-btn" data-nav="playPauseBtn" title="Play/Pause" disabled>▶</button>
          <div class="nav-sep"></div>
          <select class="nav-select" data-nav="modeSelect" title="Visualization Mode">
            <option value="bars">Bars</option>
            <option value="waveform">Waveform</option>
            <option value="circular">Circular</option>
            <option value="particles">Particles</option>
            <option value="galaxy">Galaxy</option>
            <option value="matrix">Matrix</option>
            <option value="neonGrid">Neon Grid</option>
            <option value="liquid">Liquid</option>
            <option value="spectrum">Spectrum</option>
            <option value="kaleidoscope">Kaleidoscope</option>
            <option value="dna">DNA Helix</option>
            <option value="terrain">Terrain</option>
          </select>
          <div class="nav-spacer"></div>
          <button class="nav-btn" data-nav="fullscreenBtn">⛶ Fullscreen</button>
          <button class="nav-btn" data-nav="settingsToggle">⚙</button>
        </div>
      </div>

      <div class="nav-sidebar" data-nav="sidebar">
        <div class="nav-sidebar-header">Settings</div>
        <div class="nav-sidebar-scroll">
          <div class="nav-source-indicator" data-nav="sourceIndicator">No audio source</div>

          <div class="nav-setting-group">
            <div class="nav-setting-title">Visualization Mode</div>
            <div class="nav-mode-grid">
              <button class="nav-mode-btn active" data-mode="bars">▊ Bars</button>
              <button class="nav-mode-btn" data-mode="waveform">∿ Wave</button>
              <button class="nav-mode-btn" data-mode="circular">◎ Circular</button>
              <button class="nav-mode-btn" data-mode="particles">✦ Particles</button>
              <button class="nav-mode-btn" data-mode="galaxy">🌀 Galaxy</button>
              <button class="nav-mode-btn" data-mode="matrix">⟨⟩ Matrix</button>
              <button class="nav-mode-btn" data-mode="neonGrid">▦ Grid</button>
              <button class="nav-mode-btn" data-mode="liquid">〰 Liquid</button>
              <button class="nav-mode-btn" data-mode="spectrum">∿ Spectrum</button>
              <button class="nav-mode-btn" data-mode="kaleidoscope">❖ Kaleid</button>
              <button class="nav-mode-btn" data-mode="dna">🧬 DNA</button>
              <button class="nav-mode-btn" data-mode="terrain">⛰ Terrain</button>
            </div>
          </div>

          <div class="nav-setting-group">
            <div class="nav-setting-title">Colors</div>
            <div class="nav-setting-row">
              <span class="nav-setting-label">Primary</span>
              <input type="color" class="nav-color-input" data-nav="colorPrimary" value="#ff003c">
            </div>
            <div class="nav-setting-row">
              <span class="nav-setting-label">Secondary</span>
              <input type="color" class="nav-color-input" data-nav="colorSecondary" value="#ff2d6b">
            </div>
            <div class="nav-setting-row">
              <span class="nav-setting-label">Background</span>
              <input type="color" class="nav-color-input" data-nav="colorBg" value="#0a0a0f">
            </div>
          </div>

          <div class="nav-setting-group">
            <div class="nav-setting-title">Audio</div>
            <div class="nav-setting-row">
              <span class="nav-setting-label">Sensitivity</span>
              <input type="range" class="nav-setting-slider" min="0.1" max="3" step="0.1" value="1.5" data-nav="sensitivity">
              <span class="nav-setting-val" data-nav="sensitivityVal">1.5</span>
            </div>
            <div class="nav-setting-row">
              <span class="nav-setting-label">Smoothing</span>
              <input type="range" class="nav-setting-slider" min="0" max="0.95" step="0.05" value="0.8" data-nav="smoothing">
              <span class="nav-setting-val" data-nav="smoothingVal">0.8</span>
            </div>
            <div class="nav-setting-row">
              <span class="nav-setting-label">FFT Size</span>
              <select class="nav-select" data-nav="fftSelect" style="flex:1">
                <option value="128">128</option>
                <option value="256" selected>256</option>
                <option value="512">512</option>
                <option value="1024">1024</option>
                <option value="2048">2048</option>
              </select>
            </div>
          </div>

          <div class="nav-setting-group">
            <div class="nav-setting-title">Presets</div>
            <div class="nav-preset-row">
              <button class="nav-preset-btn" data-nav="savePresetBtn">💾 Save</button>
              <button class="nav-preset-btn" data-nav="loadPresetBtn">📂 Load</button>
              <button class="nav-preset-btn" data-nav="resetSettingsBtn">↺ Reset</button>
            </div>
          </div>
        </div>
      </div>

      <input type="file" accept="audio/*" style="display:none" data-nav="fileInput">
    `;
    this.container.appendChild(root);
    this.root = root;

    this.els = {};
    root.querySelectorAll('[data-nav]').forEach(el => {
      this.els[el.dataset.nav] = el;
    });
    this.canvas = this.els.canvas;
    this.ctx = this.canvas.getContext('2d');

    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());
  }

  _bindEvents() {
    const e = this.els;

    e.micBtn.onclick = () => this._connectMicrophone();
    e.fileBtn.onclick = () => e.fileInput.click();
    e.fileInput.onchange = (ev) => {
      if (ev.target.files[0]) this._loadAudioFile(ev.target.files[0]);
    };
    e.playPauseBtn.onclick = () => this._togglePlayPause();
    e.fullscreenBtn.onclick = () => this._toggleFullscreen();
    e.settingsToggle.onclick = () => e.sidebar.classList.toggle('collapsed');

    e.modeSelect.onchange = (ev) => this._setMode(ev.target.value);

    // Mode buttons
    root.querySelectorAll('[data-mode]').forEach(btn => {
      btn.onclick = () => this._setMode(btn.dataset.mode);
    });

    // Colors
    e.colorPrimary.oninput = (ev) => { this.settings.primaryColor = ev.target.value; };
    e.colorSecondary.oninput = (ev) => { this.settings.secondaryColor = ev.target.value; };
    e.colorBg.oninput = (ev) => { this.settings.bgColor = ev.target.value; };

    // Settings
    e.sensitivity.oninput = (ev) => {
      this.settings.sensitivity = parseFloat(ev.target.value);
      e.sensitivityVal.textContent = ev.target.value;
    };
    e.smoothing.oninput = (ev) => {
      this.settings.smoothing = parseFloat(ev.target.value);
      if (this.analyser) this.analyser.smoothingTimeConstant = this.settings.smoothing;
      e.smoothingVal.textContent = ev.target.value;
    };
    e.fftSelect.onchange = (ev) => {
      this.settings.fftSize = parseInt(ev.target.value);
      if (this.analyser) {
        this.analyser.fftSize = this.settings.fftSize;
        this._initDataArrays();
      }
    };

    // Presets
    e.savePresetBtn.onclick = () => this._savePreset();
    e.loadPresetBtn.onclick = () => this._loadPreset();
    e.resetSettingsBtn.onclick = () => this._resetSettings();
  }

  _resizeCanvas() {
    const area = this.els.canvasArea;
    this.canvas.width = area.clientWidth * window.devicePixelRatio;
    this.canvas.height = area.clientHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  _initAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  _setupAnalyser() {
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = this.settings.fftSize;
    this.analyser.smoothingTimeConstant = this.settings.smoothing;
    this._initDataArrays();
  }

  _initDataArrays() {
    const bufLen = this.analyser.frequencyBinCount;
    this.freqData = new Uint8Array(bufLen);
    this.timeData = new Uint8Array(bufLen);
    // Reset mode-specific state
    this.particles = [];
    this.matrixColumns = [];
  }

  async _connectMicrophone() {
    try {
      this._initAudioContext();
      this._setupAnalyser();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (this.source) this.source.disconnect();
      this.source = this.audioCtx.createMediaStreamSource(stream);
      this.source.connect(this.analyser);
      this.els.sourceIndicator.textContent = '🎤 Microphone active';
      this.els.sourceIndicator.classList.add('active');
      this.els.micBtn.classList.add('active');
      this.els.playPauseBtn.disabled = true;
      this._startVisualization();
    } catch (e) {
      this.els.sourceIndicator.textContent = 'Mic access denied';
      console.error('Mic error:', e);
    }
  }

  _loadAudioFile(file) {
    this._initAudioContext();
    this._setupAnalyser();

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    this.audioElement = new Audio();
    this.audioElement.src = URL.createObjectURL(file);
    this.audioElement.crossOrigin = 'anonymous';

    if (this.source) this.source.disconnect();
    this.source = this.audioCtx.createMediaElementSource(this.audioElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    this.audioElement.play();
    this.els.sourceIndicator.textContent = '🎵 ' + file.name;
    this.els.sourceIndicator.classList.add('active');
    this.els.playPauseBtn.disabled = false;
    this.els.playPauseBtn.textContent = '⏸';
    this._startVisualization();

    this.audioElement.onended = () => {
      this.els.playPauseBtn.textContent = '▶';
    };
  }

  _togglePlayPause() {
    if (!this.audioElement) return;
    if (this.audioElement.paused) {
      this.audioElement.play();
      this.els.playPauseBtn.textContent = '⏸';
    } else {
      this.audioElement.pause();
      this.els.playPauseBtn.textContent = '▶';
    }
  }

  _setMode(mode) {
    this.currentMode = mode;
    this.els.modeSelect.value = mode;
    // Update mode buttons
    this.root.querySelectorAll('[data-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    // Reset mode-specific state
    this.particles = [];
    this.matrixColumns = [];
  }

  /* ─── VISUALIZATION LOOP ─── */
  _startVisualization() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._renderLoop();
  }

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrame);
  }

  _renderLoop() {
    if (!this.isRunning) return;
    this.animFrame = requestAnimationFrame(() => this._renderLoop());

    if (!this.analyser) return;
    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getByteTimeDomainData(this.timeData);

    // Beat detection
    this._detectBeat();

    // Render current mode
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.fillStyle = this.settings.bgColor;
    this.ctx.fillRect(0, 0, w, h);

    switch (this.currentMode) {
      case 'bars': this._renderBars(w, h); break;
      case 'waveform': this._renderWaveform(w, h); break;
      case 'circular': this._renderCircular(w, h); break;
      case 'particles': this._renderParticles(w, h); break;
      case 'galaxy': this._renderGalaxy(w, h); break;
      case 'matrix': this._renderMatrix(w, h); break;
      case 'neonGrid': this._renderNeonGrid(w, h); break;
      case 'liquid': this._renderLiquid(w, h); break;
      case 'spectrum': this._renderSpectrum(w, h); break;
      case 'kaleidoscope': this._renderKaleidoscope(w, h); break;
      case 'dna': this._renderDNA(w, h); break;
      case 'terrain': this._renderTerrain(w, h); break;
    }
  }

  _detectBeat() {
    let energy = 0;
    const bassEnd = Math.floor(this.freqData.length * 0.1);
    for (let i = 0; i < bassEnd; i++) {
      energy += this.freqData[i];
    }
    energy /= bassEnd;
    this.avgEnergy = this.avgEnergy * this.beatDecay + energy * (1 - this.beatDecay);
    if (energy > this.avgEnergy * this.beatThreshold) {
      this.beatPulse = 1;
    }
    this.beatPulse *= 0.92;
  }

  /* ─── RENDERERS ─── */
  _renderBars(w, h) {
    const bars = this.freqData.length;
    const barW = w / bars;
    const sens = this.settings.sensitivity;

    for (let i = 0; i < bars; i++) {
      const val = this.freqData[i] * sens;
      const barH = (val / 255) * h * 0.85;
      const x = i * barW;

      const gradient = this.ctx.createLinearGradient(x, h, x, h - barH);
      gradient.addColorStop(0, this.settings.primaryColor);
      gradient.addColorStop(1, this.settings.secondaryColor);
      this.ctx.fillStyle = gradient;

      this.ctx.fillRect(x + 1, h - barH, barW - 2, barH);

      // Glow
      this.ctx.shadowColor = this.settings.primaryColor;
      this.ctx.shadowBlur = 8;
      this.ctx.fillRect(x + 1, h - barH, barW - 2, 2);
      this.ctx.shadowBlur = 0;
    }
  }

  _renderWaveform(w, h) {
    const data = this.timeData;
    const sliceW = w / data.length;
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this.settings.primaryColor;
    this.ctx.shadowColor = this.settings.primaryColor;
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * h) / 2;
      if (i === 0) this.ctx.moveTo(0, y);
      else this.ctx.lineTo(i * sliceW, y);
    }
    this.ctx.stroke();

    // Mirror
    this.ctx.strokeStyle = this.settings.secondaryColor + '44';
    this.ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = h - (v * h) / 2;
      if (i === 0) this.ctx.moveTo(0, y);
      else this.ctx.lineTo(i * sliceW, y);
    }
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  _renderCircular(w, h) {
    const cx = w / 2, cy = h / 2;
    const baseRadius = Math.min(w, h) * 0.2;
    const sens = this.settings.sensitivity;

    this.ctx.save();
    this.ctx.translate(cx, cy);

    // Outer ring
    for (let i = 0; i < this.freqData.length; i++) {
      const angle = (i / this.freqData.length) * Math.PI * 2;
      const val = this.freqData[i] * sens;
      const r = baseRadius + (val / 255) * baseRadius * 1.5;
      const x1 = Math.cos(angle) * baseRadius;
      const y1 = Math.sin(angle) * baseRadius;
      const x2 = Math.cos(angle) * r;
      const y2 = Math.sin(angle) * r;

      const t = i / this.freqData.length;
      this.ctx.strokeStyle = this._lerpColor(this.settings.primaryColor, this.settings.secondaryColor, t);
      this.ctx.lineWidth = 2;
      this.ctx.shadowColor = this.settings.primaryColor;
      this.ctx.shadowBlur = 6;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }

    // Center circle with beat pulse
    const pulse = baseRadius * 0.5 * (1 + this.beatPulse * 0.3);
    this.ctx.fillStyle = this.settings.primaryColor + '33';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, pulse, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  _renderParticles(w, h) {
    const sens = this.settings.sensitivity;
    const avgFreq = this.freqData.reduce((a, b) => a + b, 0) / this.freqData.length * sens;

    // Spawn new particles on beat
    if (this.beatPulse > 0.5) {
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: w / 2, y: h / 2,
          vx: (Math.random() - 0.5) * avgFreq * 0.15,
          vy: (Math.random() - 0.5) * avgFreq * 0.15,
          life: 1, size: 2 + Math.random() * 4,
          color: Math.random() > 0.5 ? this.settings.primaryColor : this.settings.secondaryColor
        });
      }
    }

    // Spawn based on frequency
    const bassAvg = this._getFrequencyRangeAvg(0, 0.1) * sens;
    if (Math.random() < bassAvg / 200) {
      this.particles.push({
        x: Math.random() * w, y: h,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * (bassAvg / 50),
        life: 1, size: 1 + Math.random() * 3,
        color: Math.random() > 0.5 ? this.settings.primaryColor : this.settings.secondaryColor
      });
    }

    // Update and render
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.01;
      p.vy += 0.02; // gravity

      if (p.life <= 0) return false;

      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      this.ctx.fill();
      return true;
    });

    // Cap particles
    if (this.particles.length > 500) this.particles = this.particles.slice(-500);

    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }

  _renderGalaxy(w, h) {
    const cx = w / 2, cy = h / 2;
    const sens = this.settings.sensitivity;
    const bass = this._getFrequencyRangeAvg(0, 0.1) * sens;

    this.galaxyAngle += 0.005 + bass * 0.0001;
    const arms = 3;
    const pointsPerArm = 200;
    const maxRadius = Math.min(w, h) * 0.4 * (1 + this.beatPulse * 0.1);

    this.ctx.save();
    this.ctx.translate(cx, cy);

    for (let arm = 0; arm < arms; arm++) {
      const armOffset = (arm / arms) * Math.PI * 2;
      for (let i = 0; i < pointsPerArm; i++) {
        const t = i / pointsPerArm;
        const freqIdx = Math.floor(t * this.freqData.length);
        const val = this.freqData[freqIdx] * sens / 255;

        const angle = this.galaxyAngle + armOffset + t * Math.PI * 3;
        const radius = t * maxRadius;
        const wobble = Math.sin(angle * 3 + this.galaxyAngle * 2) * 10 * val;

        const x = Math.cos(angle) * (radius + wobble);
        const y = Math.sin(angle) * (radius + wobble);
        const size = 1 + val * 3;

        this.ctx.fillStyle = this._lerpColor(this.settings.primaryColor, this.settings.secondaryColor, t);
        this.ctx.globalAlpha = 0.3 + val * 0.7;
        this.ctx.shadowColor = this.settings.primaryColor;
        this.ctx.shadowBlur = 4;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Center glow
    const centerGlow = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 30 + bass * 0.3);
    centerGlow.addColorStop(0, this.settings.primaryColor + 'AA');
    centerGlow.addColorStop(1, 'transparent');
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = centerGlow;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 30 + bass * 0.3, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  _renderMatrix(w, h) {
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';
    const fontSize = 14;
    const columns = Math.floor(w / fontSize);

    if (this.matrixColumns.length !== columns) {
      this.matrixColumns = Array.from({ length: columns }, () => ({
        y: Math.random() * h, speed: 1 + Math.random() * 3
      }));
    }

    this.ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < columns; i++) {
      const freqIdx = Math.floor((i / columns) * this.freqData.length);
      const val = this.freqData[freqIdx] * this.settings.sensitivity / 255;
      const col = this.matrixColumns[i];

      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = col.y;

      // Brightness based on frequency
      this.ctx.fillStyle = `rgba(255, 0, 60, ${0.1 + val * 0.9})`;
      this.ctx.shadowColor = this.settings.primaryColor;
      this.ctx.shadowBlur = val * 8;
      this.ctx.fillText(char, x, y);

      col.y += col.speed * (1 + val * 2);
      if (col.y > h) {
        col.y = 0;
        col.speed = 1 + Math.random() * 3;
      }
    }
    this.ctx.shadowBlur = 0;
  }

  _renderNeonGrid(w, h) {
    const sens = this.settings.sensitivity;
    const bass = this._getFrequencyRangeAvg(0, 0.15) * sens;
    this.gridOffset = (this.gridOffset + 1 + bass * 0.05) % 40;

    const horizon = h * 0.4;
    const gridSpacing = 40;
    const rows = 20;

    this.ctx.strokeStyle = this.settings.primaryColor + '66';
    this.ctx.lineWidth = 1;

    // Horizontal lines with perspective
    for (let i = 0; i < rows; i++) {
      const t = i / rows;
      const y = horizon + t * t * (h - horizon);
      const freqIdx = Math.floor(t * this.freqData.length * 0.5);
      const val = this.freqData[freqIdx] * sens / 255;
      const wobble = val * 10;

      this.ctx.strokeStyle = this._lerpColor(
        this.settings.primaryColor, this.settings.secondaryColor, t
      ) + (Math.floor(40 + val * 60)).toString(16).padStart(2, '0');

      this.ctx.beginPath();
      this.ctx.moveTo(0, y + wobble);
      for (let x = 0; x <= w; x += 20) {
        const waveY = y + Math.sin(x * 0.02 + this.gridOffset * 0.1) * wobble;
        this.ctx.lineTo(x, waveY);
      }
      this.ctx.stroke();
    }

    // Vertical lines converging to vanishing point
    const vpx = w / 2;
    for (let i = -10; i <= 10; i++) {
      const x = vpx + i * gridSpacing * 3;
      this.ctx.strokeStyle = this.settings.primaryColor + '33';
      this.ctx.beginPath();
      this.ctx.moveTo(vpx, horizon);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }

    // Sun/circle at horizon
    const sunGrad = this.ctx.createRadialGradient(vpx, horizon, 0, vpx, horizon, 80 + bass * 0.5);
    sunGrad.addColorStop(0, this.settings.primaryColor);
    sunGrad.addColorStop(0.5, this.settings.secondaryColor + '88');
    sunGrad.addColorStop(1, 'transparent');
    this.ctx.fillStyle = sunGrad;
    this.ctx.beginPath();
    this.ctx.arc(vpx, horizon, 80 + bass * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  _renderLiquid(w, h) {
    const sens = this.settings.sensitivity;
    const mid = this._getFrequencyRangeAvg(0.3, 0.6) * sens;
    const bass = this._getFrequencyRangeAvg(0, 0.1) * sens;

    // Layered fluid waves
    for (let layer = 0; layer < 4; layer++) {
      const baseY = h * 0.3 + layer * h * 0.15;
      const alpha = 0.15 + layer * 0.1;
      const speed = 0.01 + layer * 0.005;

      this.ctx.beginPath();
      this.ctx.moveTo(0, h);

      for (let x = 0; x <= w; x += 3) {
        const freqIdx = Math.floor((x / w) * this.freqData.length * 0.5);
        const val = this.freqData[freqIdx] * sens / 255;
        const y = baseY +
          Math.sin(x * 0.01 + Date.now() * speed * 0.001 + layer) * (20 + val * 40) +
          Math.sin(x * 0.02 + Date.now() * speed * 0.002) * (10 + mid * 0.2) +
          this.beatPulse * 20 * (layer === 0 ? 1 : 0.5);
        this.ctx.lineTo(x, y);
      }

      this.ctx.lineTo(w, h);
      this.ctx.closePath();

      const gradient = this.ctx.createLinearGradient(0, baseY - 50, 0, h);
      gradient.addColorStop(0, this.settings.primaryColor + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, this.settings.secondaryColor + Math.floor(alpha * 128).toString(16).padStart(2, '0'));
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
  }

  _renderSpectrum(w, h) {
    const sens = this.settings.sensitivity;
    const data = this.freqData;
    const points = data.length;

    // Draw smooth curve
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    for (let i = 0; i < points; i++) {
      const x = (i / points) * w;
      const val = data[i] * sens / 255;
      const y = h - val * h * 0.8;
      if (i === 0) this.ctx.moveTo(x, y);
      else {
        const prevX = ((i - 1) / points) * w;
        const cpx = (prevX + x) / 2;
        this.ctx.quadraticCurveTo(prevX, h - data[i - 1] * sens / 255 * h * 0.8, cpx, (h - data[i - 1] * sens / 255 * h * 0.8 + y) / 2);
      }
    }

    // Fill with gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, this.settings.primaryColor);
    gradient.addColorStop(1, this.settings.secondaryColor + '11');
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Glow line on top
    this.ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const x = (i / points) * w;
      const val = data[i] * sens / 255;
      const y = h - val * h * 0.8;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.strokeStyle = this.settings.primaryColor;
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = this.settings.primaryColor;
    this.ctx.shadowBlur = 15;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  _renderKaleidoscope(w, h) {
    const cx = w / 2, cy = h / 2;
    const segments = 8;
    const sens = this.settings.sensitivity;
    const angleStep = (Math.PI * 2) / segments;

    this.ctx.save();
    this.ctx.translate(cx, cy);

    for (let seg = 0; seg < segments; seg++) {
      this.ctx.save();
      this.ctx.rotate(seg * angleStep);
      if (seg % 2 === 1) this.ctx.scale(-1, 1); // mirror alternating segments

      for (let i = 0; i < this.freqData.length / 2; i++) {
        const val = this.freqData[i] * sens / 255;
        const angle = (i / (this.freqData.length / 2)) * angleStep * 0.5;
        const radius = 20 + val * Math.min(w, h) * 0.3;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const size = 2 + val * 5;

        this.ctx.fillStyle = this._lerpColor(
          this.settings.primaryColor, this.settings.secondaryColor, i / (this.freqData.length / 2)
        );
        this.ctx.globalAlpha = 0.3 + val * 0.7;
        this.ctx.shadowColor = this.settings.primaryColor;
        this.ctx.shadowBlur = val * 6;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  _renderDNA(w, h) {
    const cx = w / 2;
    const sens = this.settings.sensitivity;
    this.dnaAngle += 0.03;
    const points = this.freqData.length;

    for (let strand = 0; strand < 2; strand++) {
      const offset = strand * Math.PI;
      this.ctx.beginPath();

      for (let i = 0; i < points; i++) {
        const t = i / points;
        const y = t * h;
        const freq = this.freqData[i] * sens / 255;
        const angle = this.dnaAngle + t * Math.PI * 6 + offset;
        const radius = 60 + freq * 80;
        const x = cx + Math.cos(angle) * radius;

        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);

        // Draw node
        if (i % 4 === 0) {
          this.ctx.fillStyle = strand === 0 ? this.settings.primaryColor : this.settings.secondaryColor;
          this.ctx.shadowColor = strand === 0 ? this.settings.primaryColor : this.settings.secondaryColor;
          this.ctx.shadowBlur = 6;
          this.ctx.beginPath();
          this.ctx.arc(x, y, 3 + freq * 3, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      this.ctx.strokeStyle = (strand === 0 ? this.settings.primaryColor : this.settings.secondaryColor) + '88';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Cross-links
    for (let i = 0; i < points; i += 8) {
      const t = i / points;
      const y = t * h;
      const angle1 = this.dnaAngle + t * Math.PI * 6;
      const angle2 = angle1 + Math.PI;
      const freq = this.freqData[i] * sens / 255;
      const radius = 60 + freq * 80;

      const x1 = cx + Math.cos(angle1) * radius;
      const x2 = cx + Math.cos(angle2) * radius;

      this.ctx.strokeStyle = this.settings.primaryColor + '33';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y);
      this.ctx.lineTo(x2, y);
      this.ctx.stroke();
    }
    this.ctx.shadowBlur = 0;
  }

  _renderTerrain(w, h) {
    const sens = this.settings.sensitivity;
    const bass = this._getFrequencyRangeAvg(0, 0.15) * sens;
    const rows = 30;
    const cols = 60;
    this.terrainSeed += 0.01;

    for (let r = 0; r < rows; r++) {
      const t = r / rows;
      const baseY = h * 0.3 + t * h * 0.6;
      const perspective = t * t;
      const freqIdx = Math.floor(t * this.freqData.length * 0.5);
      const freqVal = this.freqData[freqIdx] * sens / 255;

      this.ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const x = (c / cols) * w;
        const fIdx = Math.floor((c / cols) * this.freqData.length * 0.3);
        const fVal = this.freqData[fIdx] * sens / 255;
        const noise = Math.sin(c * 0.3 + this.terrainSeed + r * 0.5) *
          Math.cos(c * 0.2 - this.terrainSeed * 0.5) * 30;
        const y = baseY + noise * (0.5 + fVal) - fVal * 60 * perspective;

        if (c === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }

      const alpha = Math.floor((0.1 + freqVal * 0.5) * 255).toString(16).padStart(2, '0');
      this.ctx.strokeStyle = this._lerpColor(this.settings.primaryColor, this.settings.secondaryColor, t) + alpha;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  /* ─── PRESETS ─── */
  _savePreset() {
    const name = 'preset_' + Date.now();
    this.presets[name] = { ...this.settings, mode: this.currentMode };
    localStorage.setItem('nexus-viz-presets', JSON.stringify(this.presets));
  }

  _loadPreset() {
    const keys = Object.keys(this.presets);
    if (keys.length === 0) return;
    const latest = this.presets[keys[keys.length - 1]];
    Object.assign(this.settings, latest);
    if (latest.mode) this._setMode(latest.mode);
    this._applySettingsToUI();
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = this.settings.smoothing;
      this.analyser.fftSize = this.settings.fftSize;
      this._initDataArrays();
    }
  }

  _resetSettings() {
    this.settings = {
      primaryColor: '#ff003c', secondaryColor: '#ff2d6b',
      bgColor: '#0a0a0f', sensitivity: 1.5, smoothing: 0.8, fftSize: 256
    };
    this._applySettingsToUI();
    if (this.analyser) {
      this.analyser.smoothingTimeConstant = this.settings.smoothing;
      this.analyser.fftSize = this.settings.fftSize;
      this._initDataArrays();
    }
  }

  _applySettingsToUI() {
    const e = this.els;
    e.colorPrimary.value = this.settings.primaryColor;
    e.colorSecondary.value = this.settings.secondaryColor;
    e.colorBg.value = this.settings.bgColor;
    e.sensitivity.value = this.settings.sensitivity;
    e.sensitivityVal.textContent = this.settings.sensitivity;
    e.smoothing.value = this.settings.smoothing;
    e.smoothingVal.textContent = this.settings.smoothing;
    e.fftSelect.value = this.settings.fftSize;
  }

  /* ─── UTILITIES ─── */
  _getFrequencyRangeAvg(startPct, endPct) {
    const start = Math.floor(startPct * this.freqData.length);
    const end = Math.floor(endPct * this.freqData.length);
    let sum = 0;
    for (let i = start; i < end; i++) sum += this.freqData[i];
    return sum / (end - start || 1);
  }

  _lerpColor(c1, c2, t) {
    const r1 = parseInt(c1.substr(1, 2), 16);
    const g1 = parseInt(c1.substr(3, 2), 16);
    const b1 = parseInt(c1.substr(5, 2), 16);
    const r2 = parseInt(c2.substr(1, 2), 16);
    const g2 = parseInt(c2.substr(3, 2), 16);
    const b2 = parseInt(c2.substr(5, 2), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.root.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NexusAudioVisualizer;
}
window.NexusAudioVisualizer = NexusAudioVisualizer;
