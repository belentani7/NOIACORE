/**
 * NexusVoiceRecorder — Voice recording studio for NEXUS OS
 * Record, edit, trim, effects, export, IndexedDB persistence
 */
class NexusVoiceRecorder {
  constructor() {
    this.engine = null;
    this.container = null;
    this.isRecording = false;
    this.isPaused = false;
    this.isPlaying = false;
    this.recordings = [];
    this.selectedRecording = null;
    this.currentRecordingBlob = null;
    this.currentRecordingBuffer = null;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.startTime = 0;
    this.elapsedTime = 0;
    this.pauseAccum = 0;
    this.animFrameId = null;
    this.timerInterval = null;
    this.sampleRate = 44100;
    this.trimStart = 0;
    this.trimEnd = 1;
    this.trimDragging = null;
    this.playbackSource = null;
    this.playbackStartTime = 0;
    this.db = null;
    this.waveformCanvas = null;
    this.inputMeterCanvas = null;
    this.inputAnalyser = null;
  }

  async init(container) {
    this.container = container;
    this.engine = window.nexusAudio;
    await this.engine.init();
    await this._initDB();
    await this._loadRecordings();
    this._injectStyles();
    this._buildDOM();
    this._bindEvents();
    this._startAnimation();
  }

  async _initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NexusVoiceRecorder', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('recordings')) {
          const store = db.createObjectStore('recordings', { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date');
          store.createIndex('title', 'title');
        }
      };
      request.onsuccess = (e) => { this.db = e.target.result; resolve(); };
      request.onerror = (e) => { console.error('DB error:', e); resolve(); };
    });
  }

  async _loadRecordings() {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db.transaction('recordings', 'readonly');
      const store = tx.objectStore('recordings');
      const request = store.getAll();
      request.onsuccess = () => {
        this.recordings = request.result || [];
        resolve();
      };
      request.onerror = () => resolve();
    });
  }

  async _saveRecordingToDB(data) {
    if (!this.db) return null;
    return new Promise((resolve) => {
      const tx = this.db.transaction('recordings', 'readwrite');
      const store = tx.objectStore('recordings');
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  async _deleteRecordingFromDB(id) {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db.transaction('recordings', 'readwrite');
      const store = tx.objectStore('recordings');
      store.delete(id);
      tx.oncomplete = () => resolve();
    });
  }

  _injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .nexus-recorder { width:100%; height:100%; display:flex; flex-direction:column; background:rgba(10,5,15,0.95); color:#e0d0e8; font-family:'Segoe UI',sans-serif; font-size:11px; overflow:hidden; user-select:none; }
      .nexus-recorder * { box-sizing:border-box; }
      .nr-header { display:flex; align-items:center; gap:10px; padding:8px 12px; background:rgba(20,10,30,0.9); border-bottom:1px solid rgba(255,23,68,0.3); flex-shrink:0; }
      .nr-header h2 { margin:0; font-size:14px; color:#ff4081; letter-spacing:3px; text-transform:uppercase; text-shadow:0 0 10px rgba(255,23,68,0.5); }
      .nr-main { flex:1; display:flex; overflow:hidden; }
      .nr-editor { flex:1; display:flex; flex-direction:column; padding:8px; gap:8px; overflow:hidden; }
      .nr-sidebar { width:250px; background:rgba(15,8,25,0.9); border-left:1px solid rgba(255,23,68,0.15); display:flex; flex-direction:column; overflow:hidden; }
      .nr-sidebar-header { padding:8px; background:rgba(20,10,30,0.9); border-bottom:1px solid rgba(255,23,68,0.15); font-size:10px; color:#ff4081; text-transform:uppercase; letter-spacing:1px; }
      .nr-recording-list { flex:1; overflow-y:auto; padding:4px; }
      .nr-recording-item { display:flex; flex-direction:column; gap:2px; padding:8px; margin-bottom:4px; background:rgba(25,12,40,0.7); border:1px solid rgba(255,23,68,0.1); border-radius:6px; cursor:pointer; transition:all 0.15s; }
      .nr-recording-item:hover { border-color:rgba(255,23,68,0.3); }
      .nr-recording-item.selected { border-color:#ff1744; background:rgba(255,23,68,0.1); }
      .nr-rec-title { font-size:11px; color:#ddd; font-weight:bold; }
      .nr-rec-info { font-size:9px; color:#888; display:flex; gap:8px; }
      .nr-rec-tags { display:flex; gap:3px; flex-wrap:wrap; margin-top:2px; }
      .nr-tag { font-size:8px; background:rgba(255,23,68,0.15); color:#ff6090; padding:1px 5px; border-radius:8px; }
      .nr-rec-canvas { width:100%; height:30px; background:rgba(10,5,15,0.8); border-radius:3px; margin-top:4px; }
      .nr-controls { display:flex; align-items:center; gap:8px; padding:8px 12px; background:rgba(20,10,30,0.9); border-bottom:1px solid rgba(255,23,68,0.15); flex-shrink:0; }
      .nr-btn { background:rgba(40,20,60,0.8); border:1px solid rgba(255,23,68,0.4); color:#ff6090; padding:6px 14px; border-radius:6px; cursor:pointer; font-size:12px; transition:all 0.15s; }
      .nr-btn:hover { background:rgba(255,23,68,0.2); border-color:#ff1744; }
      .nr-btn.record { color:#ff5252; border-color:rgba(255,82,82,0.5); }
      .nr-btn.record.active { background:rgba(255,23,68,0.3); border-color:#ff1744; box-shadow:0 0 12px rgba(255,23,68,0.5); animation:pulse-rec 1s infinite; }
      @keyframes pulse-rec { 0%,100%{box-shadow:0 0 8px rgba(255,23,68,0.4)} 50%{box-shadow:0 0 16px rgba(255,23,68,0.7)} }
      .nr-btn.play.active { background:rgba(0,255,100,0.2); border-color:#00e676; color:#00e676; }
      .nr-timer { font-family:monospace; font-size:18px; color:#ff4081; min-width:100px; text-align:center; text-shadow:0 0 6px rgba(255,23,68,0.4); }
      .nr-input-meter { width:8px; height:40px; background:rgba(10,5,15,0.8); border-radius:4px; overflow:hidden; border:1px solid rgba(255,23,68,0.1); }
      .nr-input-meter-fill { width:100%; background:linear-gradient(to top, #00e676, #ffeb3b, #ff5252); border-radius:4px; transition:height 0.03s; }
      .nr-waveform-container { flex:1; background:rgba(10,5,15,0.9); border:1px solid rgba(255,23,68,0.15); border-radius:8px; position:relative; overflow:hidden; min-height:100px; }
      .nr-waveform-container canvas { width:100%; height:100%; display:block; }
      .nr-trim-handle { position:absolute; top:0; width:6px; height:100%; background:rgba(255,23,68,0.6); cursor:ew-resize; z-index:2; }
      .nr-trim-handle.start { left:0; border-radius:3px 0 0 3px; }
      .nr-trim-handle.end { right:0; border-radius:0 3px 3px 0; }
      .nr-trim-region { position:absolute; top:0; height:100%; background:rgba(255,23,68,0.05); border-left:2px solid rgba(255,23,68,0.3); border-right:2px solid rgba(255,23,68,0.3); pointer-events:none; }
      .nr-playhead { position:absolute; top:0; width:2px; height:100%; background:#fff; z-index:3; pointer-events:none; box-shadow:0 0 4px rgba(255,255,255,0.5); }
      .nr-edit-tools { display:flex; gap:6px; padding:8px 12px; background:rgba(15,8,25,0.9); border-top:1px solid rgba(255,23,68,0.15); flex-shrink:0; flex-wrap:wrap; align-items:center; }
      .nr-settings { display:flex; gap:12px; padding:6px 12px; background:rgba(10,5,15,0.9); border-top:1px solid rgba(255,23,68,0.1); flex-shrink:0; align-items:center; }
      .nr-settings label { font-size:10px; color:#888; }
      .nr-select { background:rgba(30,15,45,0.9); border:1px solid rgba(255,23,68,0.2); color:#ff6090; padding:2px 6px; border-radius:3px; font-size:10px; outline:none; }
      .nr-meta-panel { padding:8px; background:rgba(15,8,25,0.9); border-top:1px solid rgba(255,23,68,0.15); flex-shrink:0; }
      .nr-meta-row { display:flex; gap:8px; align-items:center; margin-bottom:6px; }
      .nr-meta-row label { font-size:10px; color:#888; min-width:50px; }
      .nr-meta-input { flex:1; background:rgba(30,15,45,0.8); border:1px solid rgba(255,23,68,0.2); color:#e0d0e8; padding:3px 8px; border-radius:3px; font-size:10px; outline:none; }
      .nr-meta-input:focus { border-color:#ff1744; }
    `;
    this.container.appendChild(style);
  }

  _buildDOM() {
    const root = document.createElement('div');
    root.className = 'nexus-recorder';

    // Header
    const header = document.createElement('div');
    header.className = 'nr-header';
    header.innerHTML = `<h2>Voice Recorder</h2>`;
    root.appendChild(header);

    // Controls bar
    const controls = document.createElement('div');
    controls.className = 'nr-controls';
    controls.innerHTML = `
      <button class="nr-btn record" data-action="record">⏺ Record</button>
      <button class="nr-btn" data-action="pause">⏸ Pause</button>
      <button class="nr-btn" data-action="stop">⏹ Stop</button>
      <button class="nr-btn play" data-action="play">▶ Play</button>
      <span class="nr-timer" id="nr-timer">00:00.000</span>
      <div class="nr-input-meter">
        <div class="nr-input-meter-fill" id="nr-input-meter" style="height:0%"></div>
      </div>
    `;
    root.appendChild(controls);

    // Main area
    const main = document.createElement('div');
    main.className = 'nr-main';

    // Editor
    const editor = document.createElement('div');
    editor.className = 'nr-editor';

    // Waveform
    const waveContainer = document.createElement('div');
    waveContainer.className = 'nr-waveform-container';
    waveContainer.id = 'nr-wave-container';
    this.waveformCanvas = document.createElement('canvas');
    this.waveformCanvas.id = 'nr-waveform';
    waveContainer.appendChild(this.waveformCanvas);

    // Trim handles
    const trimStart = document.createElement('div');
    trimStart.className = 'nr-trim-handle start';
    trimStart.id = 'nr-trim-start';
    waveContainer.appendChild(trimStart);

    const trimEnd = document.createElement('div');
    trimEnd.className = 'nr-trim-handle end';
    trimEnd.id = 'nr-trim-end';
    waveContainer.appendChild(trimEnd);

    // Trim region overlay
    const trimRegion = document.createElement('div');
    trimRegion.className = 'nr-trim-region';
    trimRegion.id = 'nr-trim-region';
    waveContainer.appendChild(trimRegion);

    // Playhead
    const playhead = document.createElement('div');
    playhead.className = 'nr-playhead';
    playhead.id = 'nr-playhead';
    playhead.style.left = '0%';
    waveContainer.appendChild(playhead);

    editor.appendChild(waveContainer);
    main.appendChild(editor);

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'nr-sidebar';
    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'nr-sidebar-header';
    sidebarHeader.textContent = 'Recordings';
    sidebar.appendChild(sidebarHeader);

    const recList = document.createElement('div');
    recList.className = 'nr-recording-list';
    recList.id = 'nr-rec-list';
    sidebar.appendChild(recList);
    main.appendChild(sidebar);

    root.appendChild(main);

    // Edit tools
    const editTools = document.createElement('div');
    editTools.className = 'nr-edit-tools';
    editTools.innerHTML = `
      <button class="nr-btn" data-action="trim">✂ Trim</button>
      <button class="nr-btn" data-action="normalize">📊 Normalize</button>
      <button class="nr-btn" data-action="fade-in">↗ Fade In</button>
      <button class="nr-btn" data-action="fade-out">↘ Fade Out</button>
      <button class="nr-btn" data-action="export">💾 Export WAV</button>
      <button class="nr-btn" data-action="delete" style="color:#ff5252;border-color:rgba(255,82,82,0.4)">🗑 Delete</button>
    `;
    root.appendChild(editTools);

    // Metadata panel
    const metaPanel = document.createElement('div');
    metaPanel.className = 'nr-meta-panel';
    metaPanel.innerHTML = `
      <div class="nr-meta-row">
        <label>Title:</label>
        <input type="text" class="nr-meta-input" id="nr-meta-title" placeholder="Recording title">
      </div>
      <div class="nr-meta-row">
        <label>Notes:</label>
        <input type="text" class="nr-meta-input" id="nr-meta-notes" placeholder="Notes...">
      </div>
      <div class="nr-meta-row">
        <label>Tags:</label>
        <input type="text" class="nr-meta-input" id="nr-meta-tags" placeholder="tag1, tag2, ...">
      </div>
    `;
    root.appendChild(metaPanel);

    // Settings
    const settings = document.createElement('div');
    settings.className = 'nr-settings';
    settings.innerHTML = `
      <label>Sample Rate:</label>
      <select class="nr-select" id="nr-sample-rate">
        <option value="22050">22050 Hz</option>
        <option value="44100" selected>44100 Hz</option>
        <option value="48000">48000 Hz</option>
      </select>
      <label>Quality:</label>
      <span style="color:#ff6090;font-size:10px;" id="nr-quality-label">CD Quality</span>
    `;
    root.appendChild(settings);

    this.container.appendChild(root);
    this.root = root;
    this._updateRecordingList();
  }

  _bindEvents() {
    this.root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      switch (btn.dataset.action) {
        case 'record': this._startRecording(btn); break;
        case 'pause': this._togglePause(btn); break;
        case 'stop': this._stopRecording(); break;
        case 'play': this._togglePlayback(btn); break;
        case 'trim': this._applyTrim(); break;
        case 'normalize': this._normalize(); break;
        case 'fade-in': this._fadeIn(); break;
        case 'fade-out': this._fadeOut(); break;
        case 'export': this._exportWAV(); break;
        case 'delete': this._deleteSelected(); break;
      }
    });

    // Sample rate change
    const srSelect = this.root.querySelector('#nr-sample-rate');
    if (srSelect) {
      srSelect.addEventListener('change', () => {
        this.sampleRate = parseInt(srSelect.value);
        const label = this.root.querySelector('#nr-quality-label');
        if (label) {
          label.textContent = this.sampleRate >= 44100 ? 'CD Quality' : this.sampleRate >= 22050 ? 'Radio Quality' : 'Low Quality';
        }
      });
    }

    // Trim handle dragging
    const trimStartEl = this.root.querySelector('#nr-trim-start');
    const trimEndEl = this.root.querySelector('#nr-trim-end');
    if (trimStartEl) {
      this._makeTrimHandle(trimStartEl, 'start');
    }
    if (trimEndEl) {
      this._makeTrimHandle(trimEndEl, 'end');
    }

    // Metadata auto-save
    ['nr-meta-title', 'nr-meta-notes', 'nr-meta-tags'].forEach(id => {
      const el = this.root.querySelector(`#${id}`);
      if (el) {
        el.addEventListener('change', () => this._saveMetadata());
      }
    });
  }

  _makeTrimHandle(el, side) {
    let dragging = false;
    el.addEventListener('mousedown', (e) => {
      dragging = true;
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const container = this.root.querySelector('#nr-wave-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (side === 'start') {
        this.trimStart = Math.min(pct, this.trimEnd - 0.01);
        el.style.left = (this.trimStart * 100) + '%';
      } else {
        this.trimEnd = Math.max(pct, this.trimStart + 0.01);
        el.style.right = ((1 - this.trimEnd) * 100) + '%';
      }
      this._updateTrimRegion();
    });
    document.addEventListener('mouseup', () => { dragging = false; });
  }

  _updateTrimRegion() {
    const region = this.root.querySelector('#nr-trim-region');
    if (!region) return;
    region.style.left = (this.trimStart * 100) + '%';
    region.style.width = ((this.trimEnd - this.trimStart) * 100) + '%';
  }

  async _startRecording(btn) {
    if (this.isRecording) return;
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: this.sampleRate, echoCancellation: false, noiseSuppression: false }
      });
    } catch (e) {
      alert('Microphone access denied: ' + e.message);
      return;
    }

    // Create input analyser for metering
    const source = this.engine.ctx.createMediaStreamSource(this.mediaStream);
    this.inputAnalyser = this.engine.ctx.createAnalyser();
    this.inputAnalyser.fftSize = 256;
    source.connect(this.inputAnalyser);

    // Setup media recorder
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.mediaStream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };

    this.mediaRecorder.start(100);
    this.isRecording = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.pauseAccum = 0;
    btn.classList.add('active');

    this.timerInterval = setInterval(() => this._updateTimer(), 10);
  }

  _togglePause(btn) {
    if (!this.isRecording) return;
    if (this.isPaused) {
      this.mediaRecorder.resume();
      this.isPaused = false;
      btn.classList.remove('active');
    } else {
      this.mediaRecorder.pause();
      this.isPaused = true;
      btn.classList.add('active');
    }
  }

  async _stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    this.isPaused = false;

    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }

    const recordBtn = this.root.querySelector('.nr-btn.record');
    if (recordBtn) recordBtn.classList.remove('active');

    return new Promise((resolve) => {
      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.currentRecordingBlob = blob;

        // Convert to AudioBuffer for editing
        const arrayBuffer = await blob.arrayBuffer();
        try {
          this.currentRecordingBuffer = await this.engine.ctx.decodeAudioData(arrayBuffer);
        } catch (e) {
          console.error('Decode error:', e);
          this.currentRecordingBuffer = null;
        }

        this.trimStart = 0;
        this.trimEnd = 1;

        // Save to DB
        const audioData = await blob.arrayBuffer();
        const duration = this.currentRecordingBuffer ? this.currentRecordingBuffer.duration : 0;
        const recData = {
          title: `Recording ${this.recordings.length + 1}`,
          date: new Date().toISOString(),
          duration: duration,
          audioData: audioData,
          notes: '',
          tags: [],
          sampleRate: this.sampleRate
        };
        const id = await this._saveRecordingToDB(recData);
        recData.id = id;
        this.recordings.push(recData);
        this.selectedRecording = recData;
        this._updateRecordingList();
        this._drawWaveform();
        this._updateTrimHandles();
        this._loadMetadata(recData);

        // Stop stream
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(t => t.stop());
          this.mediaStream = null;
        }

        resolve();
      };
      this.mediaRecorder.stop();
    });
  }

  _togglePlayback(btn) {
    if (this.isPlaying) {
      this._stopPlayback();
      btn.classList.remove('active');
      return;
    }
    if (!this.currentRecordingBuffer) return;

    const source = this.engine.ctx.createBufferSource();
    source.buffer = this.currentRecordingBuffer;
    source.connect(this.engine.ctx.destination);

    const startOffset = this.trimStart * this.currentRecordingBuffer.duration;
    const endOffset = this.trimEnd * this.currentRecordingBuffer.duration;
    const duration = endOffset - startOffset;

    source.start(0, startOffset, duration);
    this.playbackSource = source;
    this.playbackStartTime = this.engine.ctx.currentTime - startOffset;
    this.isPlaying = true;
    btn.classList.add('active');

    source.onended = () => {
      this.isPlaying = false;
      btn.classList.remove('active');
    };
  }

  _stopPlayback() {
    if (this.playbackSource) {
      try { this.playbackSource.stop(); } catch (e) {}
      this.playbackSource = null;
    }
    this.isPlaying = false;
  }

  _updateTimer() {
    if (!this.isRecording) return;
    const elapsed = Date.now() - this.startTime - this.pauseAccum;
    const ms = elapsed % 1000;
    const secs = Math.floor(elapsed / 1000) % 60;
    const mins = Math.floor(elapsed / 60000);
    const timerEl = this.root.querySelector('#nr-timer');
    if (timerEl) {
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    }
  }

  _updateRecordingList() {
    const list = this.root.querySelector('#nr-rec-list');
    if (!list) return;
    list.innerHTML = '';

    this.recordings.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(rec => {
      const item = document.createElement('div');
      item.className = 'nr-recording-item' + (this.selectedRecording?.id === rec.id ? ' selected' : '');

      const title = document.createElement('div');
      title.className = 'nr-rec-title';
      title.textContent = rec.title;
      item.appendChild(title);

      const info = document.createElement('div');
      info.className = 'nr-rec-info';
      info.textContent = `${new Date(rec.date).toLocaleDateString()} — ${this._formatDuration(rec.duration)}`;
      item.appendChild(info);

      if (rec.tags && rec.tags.length > 0) {
        const tags = document.createElement('div');
        tags.className = 'nr-rec-tags';
        rec.tags.forEach(t => {
          const tag = document.createElement('span');
          tag.className = 'nr-tag';
          tag.textContent = t;
          tags.appendChild(tag);
        });
        item.appendChild(tags);
      }

      // Thumbnail waveform
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.className = 'nr-rec-canvas';
      thumbCanvas.width = 220;
      thumbCanvas.height = 30;
      item.appendChild(thumbCanvas);
      this._drawThumbnail(thumbCanvas, rec);

      item.addEventListener('click', () => this._selectRecording(rec));
      item.addEventListener('dblclick', () => {
        this._selectRecording(rec);
        const playBtn = this.root.querySelector('[data-action="play"]');
        if (playBtn) this._togglePlayback(playBtn);
      });

      list.appendChild(item);
    });
  }

  async _selectRecording(rec) {
    this._stopPlayback();
    this.selectedRecording = rec;
    this.trimStart = 0;
    this.trimEnd = 1;

    // Decode audio data
    try {
      const arrayBuffer = rec.audioData.slice(0);
      this.currentRecordingBuffer = await this.engine.ctx.decodeAudioData(arrayBuffer);
      this.currentRecordingBlob = new Blob([rec.audioData], { type: 'audio/webm' });
    } catch (e) {
      console.error('Decode error:', e);
      this.currentRecordingBuffer = null;
    }

    this._updateRecordingList();
    this._drawWaveform();
    this._updateTrimHandles();
    this._loadMetadata(rec);
  }

  _loadMetadata(rec) {
    const titleEl = this.root.querySelector('#nr-meta-title');
    const notesEl = this.root.querySelector('#nr-meta-notes');
    const tagsEl = this.root.querySelector('#nr-meta-tags');
    if (titleEl) titleEl.value = rec.title || '';
    if (notesEl) notesEl.value = rec.notes || '';
    if (tagsEl) tagsEl.value = (rec.tags || []).join(', ');
  }

  async _saveMetadata() {
    if (!this.selectedRecording) return;
    const titleEl = this.root.querySelector('#nr-meta-title');
    const notesEl = this.root.querySelector('#nr-meta-notes');
    const tagsEl = this.root.querySelector('#nr-meta-tags');

    this.selectedRecording.title = titleEl?.value || 'Untitled';
    this.selectedRecording.notes = notesEl?.value || '';
    this.selectedRecording.tags = (tagsEl?.value || '').split(',').map(t => t.trim()).filter(Boolean);

    // Update in DB
    if (this.db && this.selectedRecording.id) {
      const tx = this.db.transaction('recordings', 'readwrite');
      const store = tx.objectStore('recordings');
      store.put(this.selectedRecording);
    }
    this._updateRecordingList();
  }

  _drawWaveform() {
    if (!this.waveformCanvas || !this.currentRecordingBuffer) return;
    const container = this.root.querySelector('#nr-wave-container');
    if (container) {
      this.waveformCanvas.width = container.clientWidth;
      this.waveformCanvas.height = container.clientHeight;
    }
    const ctx = this.waveformCanvas.getContext('2d');
    const w = this.waveformCanvas.width;
    const h = this.waveformCanvas.height;
    const buffer = this.currentRecordingBuffer;
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / w);

    ctx.fillStyle = 'rgba(10,5,15,1)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#ff4081';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(255,23,68,0.5)';
    ctx.shadowBlur = 2;
    ctx.beginPath();

    for (let i = 0; i < w; i++) {
      let min = 1, max = -1;
      for (let j = 0; j < step; j++) {
        const idx = i * step + j;
        if (idx >= data.length) break;
        const val = data[idx];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      const yMin = (1 - max) * h / 2;
      const yMax = (1 - min) * h / 2;

      ctx.moveTo(i, yMin);
      ctx.lineTo(i, yMax);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center line
    ctx.strokeStyle = 'rgba(255,23,68,0.1)';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Trim overlay
    if (this.trimStart > 0 || this.trimEnd < 1) {
      ctx.fillStyle = 'rgba(10,5,15,0.5)';
      ctx.fillRect(0, 0, this.trimStart * w, h);
      ctx.fillRect(this.trimEnd * w, 0, (1 - this.trimEnd) * w, h);
    }
  }

  _drawThumbnail(canvas, rec) {
    if (!rec.audioData) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = 'rgba(10,5,15,0.8)';
    ctx.fillRect(0, 0, w, h);

    // Decode and draw mini waveform
    this.engine.ctx.decodeAudioData(rec.audioData.slice(0)).then(buffer => {
      const data = buffer.getChannelData(0);
      const step = Math.ceil(data.length / w);

      ctx.strokeStyle = 'rgba(255,64,129,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < w; i++) {
        let min = 1, max = -1;
        for (let j = 0; j < step; j++) {
          const idx = i * step + j;
          if (idx >= data.length) break;
          const val = data[idx];
          if (val < min) min = val;
          if (val > max) max = val;
        }
        ctx.moveTo(i, (1 - max) * h / 2);
        ctx.lineTo(i, (1 - min) * h / 2);
      }
      ctx.stroke();
    }).catch(() => {});
  }

  _updateTrimHandles() {
    const startEl = this.root.querySelector('#nr-trim-start');
    const endEl = this.root.querySelector('#nr-trim-end');
    if (startEl) startEl.style.left = (this.trimStart * 100) + '%';
    if (endEl) endEl.style.right = ((1 - this.trimEnd) * 100) + '%';
    this._updateTrimRegion();
  }

  async _applyTrim() {
    if (!this.currentRecordingBuffer || !this.selectedRecording) return;
    const buffer = this.currentRecordingBuffer;
    const sr = buffer.sampleRate;
    const startSample = Math.floor(this.trimStart * buffer.length);
    const endSample = Math.floor(this.trimEnd * buffer.length);
    const newLength = endSample - startSample;
    if (newLength <= 0) return;

    const newBuffer = this.engine.ctx.createBuffer(buffer.numberOfChannels, newLength, sr);
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const src = buffer.getChannelData(c);
      const dst = newBuffer.getChannelData(c);
      for (let i = 0; i < newLength; i++) {
        dst[i] = src[startSample + i];
      }
    }

    this.currentRecordingBuffer = newBuffer;
    this.trimStart = 0;
    this.trimEnd = 1;

    // Re-encode and save
    await this._saveBufferToRecording(newBuffer);
    this._drawWaveform();
    this._updateTrimHandles();
  }

  _normalize() {
    if (!this.currentRecordingBuffer) return;
    const buffer = this.currentRecordingBuffer;
    let max = 0;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < data.length; i++) {
        const abs = Math.abs(data[i]);
        if (abs > max) max = abs;
      }
    }
    if (max === 0) return;
    const gain = 0.95 / max;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < data.length; i++) {
        data[i] *= gain;
      }
    }
    this._drawWaveform();
    this._saveBufferToRecording(buffer);
  }

  _fadeIn() {
    if (!this.currentRecordingBuffer) return;
    const buffer = this.currentRecordingBuffer;
    const fadeLength = Math.min(buffer.length, Math.floor(buffer.sampleRate * 0.5));
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < fadeLength; i++) {
        data[i] *= i / fadeLength;
      }
    }
    this._drawWaveform();
    this._saveBufferToRecording(buffer);
  }

  _fadeOut() {
    if (!this.currentRecordingBuffer) return;
    const buffer = this.currentRecordingBuffer;
    const fadeLength = Math.min(buffer.length, Math.floor(buffer.sampleRate * 0.5));
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < fadeLength; i++) {
        data[buffer.length - 1 - i] *= i / fadeLength;
      }
    }
    this._drawWaveform();
    this._saveBufferToRecording(buffer);
  }

  async _saveBufferToRecording(buffer) {
    if (!this.selectedRecording) return;
    // Convert buffer to WAV blob, then save
    const wavBlob = this.engine.audioBufferToWav(buffer);
    const arrayBuffer = await wavBlob.arrayBuffer();
    this.selectedRecording.audioData = arrayBuffer;
    this.selectedRecording.duration = buffer.duration;

    if (this.db && this.selectedRecording.id) {
      const tx = this.db.transaction('recordings', 'readwrite');
      const store = tx.objectStore('recordings');
      store.put(this.selectedRecording);
    }
    this._updateRecordingList();
  }

  _exportWAV() {
    if (!this.currentRecordingBuffer) { alert('No recording to export.'); return; }
    const blob = this.engine.audioBufferToWav(this.currentRecordingBuffer);
    const title = this.selectedRecording?.title || 'recording';
    this.engine.downloadWav(blob, `${title}.wav`);
  }

  async _deleteSelected() {
    if (!this.selectedRecording) return;
    if (!confirm(`Delete "${this.selectedRecording.title}"?`)) return;
    const id = this.selectedRecording.id;
    await this._deleteRecordingFromDB(id);
    this.recordings = this.recordings.filter(r => r.id !== id);
    this.selectedRecording = null;
    this.currentRecordingBuffer = null;
    this._updateRecordingList();
    this._drawWaveform();
  }

  _formatDuration(seconds) {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  _startAnimation() {
    const animate = () => {
      this.animFrameId = requestAnimationFrame(animate);
      this._updateInputMeter();
      this._updatePlayhead();
      if (this.isRecording) this._drawLiveWaveform();
    };
    animate();
  }

  _updateInputMeter() {
    if (!this.inputAnalyser || !this.isRecording) return;
    const meterFill = this.root.querySelector('#nr-input-meter');
    if (!meterFill) return;
    const data = new Uint8Array(this.inputAnalyser.fftSize);
    this.inputAnalyser.getByteTimeDomainData(data);
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i] - 128) / 128;
      if (v > peak) peak = v;
    }
    meterFill.style.height = (peak * 100) + '%';
  }

  _updatePlayhead() {
    if (!this.isPlaying || !this.currentRecordingBuffer) return;
    const playhead = this.root.querySelector('#nr-playhead');
    if (!playhead) return;
    const elapsed = this.engine.ctx.currentTime - this.playbackStartTime;
    const duration = this.currentRecordingBuffer.duration;
    const pct = Math.min(1, elapsed / duration);
    playhead.style.left = (pct * 100) + '%';
  }

  _drawLiveWaveform() {
    if (!this.inputAnalyser || !this.waveformCanvas) return;
    const ctx = this.waveformCanvas.getContext('2d');
    const w = this.waveformCanvas.width;
    const h = this.waveformCanvas.height;
    const data = new Uint8Array(this.inputAnalyser.fftSize);
    this.inputAnalyser.getByteTimeDomainData(data);

    ctx.fillStyle = 'rgba(10,5,15,0.95)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#ff4081';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255,23,68,0.6)';
    ctx.shadowBlur = 4;
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
  }

  destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.timerInterval) clearInterval(this.timerInterval);
    this._stopPlayback();
    if (this.mediaStream) this.mediaStream.getTracks().forEach(t => t.stop());
    if (this.root) this.root.remove();
  }
}

window.NexusVoiceRecorder = NexusVoiceRecorder;
