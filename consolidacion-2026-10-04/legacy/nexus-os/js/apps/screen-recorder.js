/**
 * NEXUS OS — Screen Recorder
 * Screen capture tool with neon glassmorphism UI
 * Pure vanilla JS, uses getDisplayMedia + MediaRecorder APIs
 */

class NexusScreenRecorder {
  constructor(container) {
    this.container = typeof container === 'string'
      ? document.querySelector(container) : container;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.isRecording = false;
    this.isPaused = false;
    this.recordingStartTime = 0;
    this.elapsedTime = 0;
    this.timerInterval = null;
    this.countdownTimer = null;
    this.recordedBlob = null;

    this.settings = {
      resolution: 'default',  // default | 720 | 1080
      framerate: 30,
      countdown: 3,
      audioCapture: 'none'   // none | system | mic | both
    };
  }

  render() {
    this.container.innerHTML = '';
    this._injectStyles();
    this._buildUI();
    this._bindEvents();
  }

  destroy() {
    this._stopRecording(true);
    clearInterval(this.timerInterval);
    clearInterval(this.countdownTimer);
    this.container.innerHTML = '';
  }

  _injectStyles() {
    if (document.getElementById('nexus-screen-recorder-styles')) return;
    const style = document.createElement('style');
    style.id = 'nexus-screen-recorder-styles';
    style.textContent = `
      .nsr-root {
        display: flex; flex-direction: column; height: 100%; background: #0a0a0f;
        font-family: 'Segoe UI', system-ui, sans-serif; color: #e0e0e0;
        overflow: hidden;
      }
      .nsr-header {
        padding: 16px 20px; background: rgba(15,15,25,0.95);
        border-bottom: 1px solid rgba(255,0,60,0.15);
      }
      .nsr-title {
        font-size: 18px; font-weight: 600; color: #ff2d6b; margin-bottom: 4px;
      }
      .nsr-subtitle { font-size: 12px; color: #666; }

      .nsr-main {
        flex: 1; display: flex; gap: 20px; padding: 20px; overflow-y: auto;
      }
      .nsr-panel {
        flex: 1; background: rgba(15,15,25,0.8); backdrop-filter: blur(12px);
        border: 1px solid rgba(255,0,60,0.15); border-radius: 12px;
        padding: 20px; display: flex; flex-direction: column;
      }
      .nsr-panel-title {
        font-size: 14px; font-weight: 600; color: #ff2d6b; margin-bottom: 16px;
        padding-bottom: 8px; border-bottom: 1px solid rgba(255,0,60,0.1);
      }

      .nsr-settings-group { margin-bottom: 16px; }
      .nsr-settings-label {
        font-size: 12px; color: #888; margin-bottom: 6px; display: block;
      }
      .nsr-select {
        width: 100%; background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,0,60,0.15); color: #ccc;
        padding: 8px 12px; border-radius: 8px; font-size: 13px;
        outline: none; cursor: pointer;
      }
      .nsr-select:focus { border-color: #ff003c; }
      .nsr-select option { background: #1a1a2e; }

      .nsr-slider-row {
        display: flex; align-items: center; gap: 10px;
      }
      .nsr-slider {
        flex: 1; -webkit-appearance: none; height: 4px;
        background: rgba(255,255,255,0.1); border-radius: 2px; outline: none;
      }
      .nsr-slider::-webkit-slider-thumb {
        -webkit-appearance: none; width: 14px; height: 14px;
        background: #ff003c; border-radius: 50%; cursor: pointer;
        box-shadow: 0 0 6px #ff003c;
      }
      .nsr-slider-val {
        font-size: 13px; color: #ff2d6b; min-width: 35px; text-align: right;
      }

      .nsr-controls {
        display: flex; gap: 10px; justify-content: center; padding: 20px;
        flex-wrap: wrap;
      }
      .nsr-btn {
        padding: 12px 28px; border-radius: 10px; font-size: 14px;
        cursor: pointer; transition: all 0.2s; border: 1px solid;
        display: flex; align-items: center; gap: 8px;
      }
      .nsr-btn-primary {
        background: rgba(255,0,60,0.2); border-color: rgba(255,0,60,0.5);
        color: #ff003c; box-shadow: 0 0 15px rgba(255,0,60,0.1);
      }
      .nsr-btn-primary:hover {
        background: rgba(255,0,60,0.3); box-shadow: 0 0 25px rgba(255,0,60,0.2);
      }
      .nsr-btn-secondary {
        background: rgba(255,255,255,0.05); border-color: rgba(255,0,60,0.15);
        color: #ccc;
      }
      .nsr-btn-secondary:hover {
        background: rgba(255,0,60,0.1); color: #ff003c;
      }
      .nsr-btn:disabled {
        opacity: 0.4; cursor: not-allowed;
      }
      .nsr-btn.recording {
        animation: nsr-pulse 1.5s ease-in-out infinite;
      }
      @keyframes nsr-pulse {
        0%, 100% { box-shadow: 0 0 15px rgba(255,0,60,0.2); }
        50% { box-shadow: 0 0 30px rgba(255,0,60,0.5); }
      }

      .nsr-timer {
        text-align: center; padding: 16px; font-size: 36px;
        font-variant-numeric: tabular-nums; color: #ff2d6b;
        font-weight: 300; letter-spacing: 2px;
      }
      .nsr-timer.recording { color: #ff003c; }

      .nsr-status {
        text-align: center; font-size: 12px; color: #666;
        padding: 8px;
      }
      .nsr-status.recording {
        color: #ff003c;
      }

      .nsr-countdown-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.85);
        display: none; align-items: center; justify-content: center;
        z-index: 99999; font-size: 120px; font-weight: 200; color: #ff003c;
        text-shadow: 0 0 40px #ff003c;
      }
      .nsr-countdown-overlay.active { display: flex; }

      .nsr-preview-area {
        flex: 1; display: flex; flex-direction: column; align-items: center;
        justify-content: center; min-height: 200px;
      }
      .nsr-preview-video {
        max-width: 100%; max-height: 300px; border-radius: 8px;
        border: 1px solid rgba(255,0,60,0.2); display: none;
      }
      .nsr-preview-empty {
        text-align: center; color: #444; font-size: 14px;
      }
      .nsr-preview-icon { font-size: 48px; margin-bottom: 8px; opacity: 0.3; }

      .nsr-download-row {
        display: flex; gap: 10px; justify-content: center; margin-top: 12px;
      }
      .nsr-file-info {
        text-align: center; font-size: 12px; color: #666; margin-top: 8px;
      }

      @media (max-width: 768px) {
        .nsr-main { flex-direction: column; }
      }
    `;
    document.head.appendChild(style);
  }

  _buildUI() {
    const root = document.createElement('div');
    root.className = 'nsr-root';
    root.innerHTML = `
      <div class="nsr-header">
        <div class="nsr-title">📹 Screen Recorder</div>
        <div class="nsr-subtitle">Capture screen, window, or tab with audio</div>
      </div>

      <div class="nsr-main">
        <div class="nsr-panel">
          <div class="nsr-panel-title">Settings</div>

          <div class="nsr-settings-group">
            <label class="nsr-settings-label">Capture Area</label>
            <select class="nsr-select" data-nsr="captureArea">
              <option value="screen">Full Screen</option>
              <option value="window">Application Window</option>
              <option value="tab">Browser Tab</option>
            </select>
          </div>

          <div class="nsr-settings-group">
            <label class="nsr-settings-label">Resolution</label>
            <select class="nsr-select" data-nsr="resolution">
              <option value="default">Native (System Default)</option>
              <option value="720">720p (1280×720)</option>
              <option value="1080">1080p (1920×1080)</option>
            </select>
          </div>

          <div class="nsr-settings-group">
            <label class="nsr-settings-label">Frame Rate</label>
            <div class="nsr-slider-row">
              <input type="range" class="nsr-slider" min="15" max="60" step="5" value="30" data-nsr="framerate">
              <span class="nsr-slider-val" data-nsr="framerateVal">30 fps</span>
            </div>
          </div>

          <div class="nsr-settings-group">
            <label class="nsr-settings-label">Audio Source</label>
            <select class="nsr-select" data-nsr="audioSource">
              <option value="none">No Audio</option>
              <option value="system">System Audio Only</option>
              <option value="mic">Microphone Only</option>
              <option value="both">System + Microphone</option>
            </select>
          </div>

          <div class="nsr-settings-group">
            <label class="nsr-settings-label">Countdown Before Start</label>
            <div class="nsr-slider-row">
              <input type="range" class="nsr-slider" min="0" max="10" step="1" value="3" data-nsr="countdown">
              <span class="nsr-slider-val" data-nsr="countdownVal">3s</span>
            </div>
          </div>
        </div>

        <div class="nsr-panel">
          <div class="nsr-panel-title">Recording</div>

          <div class="nsr-timer" data-nsr="timer">00:00:00</div>
          <div class="nsr-status" data-nsr="status">Ready to record</div>

          <div class="nsr-controls">
            <button class="nsr-btn nsr-btn-primary" data-nsr="startBtn">
              <span>⏺</span> Start Recording
            </button>
            <button class="nsr-btn nsr-btn-secondary" data-nsr="pauseBtn" disabled>
              <span>⏸</span> Pause
            </button>
            <button class="nsr-btn nsr-btn-secondary" data-nsr="stopBtn" disabled>
              <span>⏹</span> Stop
            </button>
          </div>

          <div class="nsr-preview-area">
            <div class="nsr-preview-empty" data-nsr="previewEmpty">
              <div class="nsr-preview-icon">🎬</div>
              <div>Recording preview will appear here</div>
            </div>
            <video class="nsr-preview-video" data-nsr="previewVideo" controls></video>
          </div>

          <div class="nsr-download-row">
            <button class="nsr-btn nsr-btn-primary" data-nsr="downloadBtn" disabled>
              💾 Download WebM
            </button>
            <button class="nsr-btn nsr-btn-secondary" data-nsr="discardBtn" disabled>
              🗑 Discard
            </button>
          </div>
          <div class="nsr-file-info" data-nsr="fileInfo"></div>
        </div>
      </div>

      <div class="nsr-countdown-overlay" data-nsr="countdownOverlay">
        <span data-nsr="countdownNum">3</span>
      </div>
    `;
    this.container.appendChild(root);
    this.root = root;

    this.els = {};
    root.querySelectorAll('[data-nsr]').forEach(el => {
      this.els[el.dataset.nsr] = el;
    });
  }

  _bindEvents() {
    const e = this.els;

    e.startBtn.onclick = () => this._startCountdown();
    e.pauseBtn.onclick = () => this._togglePause();
    e.stopBtn.onclick = () => this._stopRecording();
    e.downloadBtn.onclick = () => this._downloadRecording();
    e.discardBtn.onclick = () => this._discardRecording();

    e.framerate.oninput = (ev) => {
      this.settings.framerate = parseInt(ev.target.value);
      e.framerateVal.textContent = ev.target.value + ' fps';
    };
    e.countdown.oninput = (ev) => {
      this.settings.countdown = parseInt(ev.target.value);
      e.countdownVal.textContent = ev.target.value + 's';
    };
    e.resolution.onchange = (ev) => {
      this.settings.resolution = ev.target.value;
    };
    e.audioSource.onchange = (ev) => {
      this.settings.audioCapture = ev.target.value;
    };
  }

  async _startCountdown() {
    const count = this.settings.countdown;
    if (count === 0) {
      await this._startRecording();
      return;
    }

    const overlay = this.els.countdownOverlay;
    const num = this.els.countdownNum;
    overlay.classList.add('active');

    let current = count;
    num.textContent = current;

    return new Promise((resolve) => {
      this.countdownTimer = setInterval(() => {
        current--;
        if (current <= 0) {
          clearInterval(this.countdownTimer);
          overlay.classList.remove('active');
          this._startRecording();
          resolve();
        } else {
          num.textContent = current;
        }
      }, 1000);
    });
  }

  async _startRecording() {
    try {
      // Screen capture
      const constraints = {
        video: {
          displaySurface: this.els.captureArea.value
        }
      };

      if (this.settings.resolution !== 'default') {
        const res = this.settings.resolution === '720'
          ? { width: 1280, height: 720 }
          : { width: 1920, height: 1080 };
        constraints.video.width = { ideal: res.width };
        constraints.video.height = { ideal: res.height };
      }

      constraints.video.frameRate = { ideal: this.settings.framerate };

      // Request system audio if needed
      if (this.settings.audioCapture === 'system' || this.settings.audioCapture === 'both') {
        constraints.audio = true;
      }

      this.stream = await navigator.mediaDevices.getDisplayMedia(constraints);

      // Add microphone if needed
      if (this.settings.audioCapture === 'mic' || this.settings.audioCapture === 'both') {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStream.getAudioTracks().forEach(track => this.stream.addTrack(track));
        } catch (e) {
          console.warn('Mic access denied:', e);
        }
      }

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        videoBitsPerSecond: this.settings.resolution === '1080' ? 5000000 : 2500000
      });

      this.mediaRecorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) this.recordedChunks.push(ev.data);
      };

      this.mediaRecorder.onstop = () => this._onRecordingStopped();

      // Handle stream ending (user stops sharing)
      this.stream.getVideoTracks()[0].onended = () => this._stopRecording();

      this.mediaRecorder.start(1000); // collect data every second
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.elapsedTime = 0;

      // Update UI
      this.els.startBtn.disabled = true;
      this.els.pauseBtn.disabled = false;
      this.els.stopBtn.disabled = false;
      this.els.downloadBtn.disabled = true;
      this.els.discardBtn.disabled = true;
      this.els.startBtn.classList.add('recording');
      this.els.status.textContent = '● Recording...';
      this.els.status.classList.add('recording');
      this.els.timer.classList.add('recording');

      // Start timer
      this.timerInterval = setInterval(() => this._updateTimer(), 100);

    } catch (err) {
      console.error('Screen capture failed:', err);
      this.els.status.textContent = 'Recording cancelled or denied';
    }
  }

  _togglePause() {
    if (!this.mediaRecorder) return;
    if (this.isPaused) {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this.els.pauseBtn.innerHTML = '<span>⏸</span> Pause';
      this.els.status.textContent = '● Recording...';
      this.timerInterval = setInterval(() => this._updateTimer(), 100);
    } else {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.els.pauseBtn.innerHTML = '<span>▶</span> Resume';
      this.els.status.textContent = '⏸ Paused';
      clearInterval(this.timerInterval);
    }
  }

  _stopRecording(silent = false) {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') return;
    this.mediaRecorder.stop();

    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    clearInterval(this.timerInterval);
    clearInterval(this.countdownTimer);
    this.els.countdownOverlay.classList.remove('active');

    if (!silent) {
      this.isRecording = false;
      this.isPaused = false;
    }
  }

  _onRecordingStopped() {
    if (this.recordedChunks.length === 0) {
      this.els.status.textContent = 'No data recorded';
      return;
    }

    this.recordedBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(this.recordedBlob);

    // Show preview
    this.els.previewVideo.src = url;
    this.els.previewVideo.style.display = '';
    this.els.previewEmpty.style.display = 'none';

    // Update UI
    this.els.startBtn.disabled = false;
    this.els.startBtn.classList.remove('recording');
    this.els.pauseBtn.disabled = true;
    this.els.stopBtn.disabled = true;
    this.els.downloadBtn.disabled = false;
    this.els.discardBtn.disabled = false;
    this.els.status.textContent = '✓ Recording complete';
    this.els.status.classList.remove('recording');
    this.els.timer.classList.remove('recording');

    // File info
    const sizeMB = (this.recordedBlob.size / 1048576).toFixed(2);
    this.els.fileInfo.textContent = `File size: ${sizeMB} MB | Format: WebM`;
  }

  _downloadRecording() {
    if (!this.recordedBlob) return;
    const url = URL.createObjectURL(this.recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-recording_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  }

  _discardRecording() {
    this.recordedChunks = [];
    this.recordedBlob = null;
    this.els.previewVideo.src = '';
    this.els.previewVideo.style.display = 'none';
    this.els.previewEmpty.style.display = '';
    this.els.downloadBtn.disabled = true;
    this.els.discardBtn.disabled = true;
    this.els.timer.textContent = '00:00:00';
    this.els.status.textContent = 'Ready to record';
    this.els.fileInfo.textContent = '';
  }

  _updateTimer() {
    if (this.isPaused) return;
    const elapsed = Date.now() - this.recordingStartTime + this.elapsedTime;
    const hrs = Math.floor(elapsed / 3600000);
    const mins = Math.floor((elapsed % 3600000) / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    this.els.timer.textContent =
      `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NexusScreenRecorder;
}
window.NexusScreenRecorder = NexusScreenRecorder;
