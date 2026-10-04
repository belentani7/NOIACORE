'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Clock & Timer
 *  Multi-tool time management with neon glassmorphism
 * ═══════════════════════════════════════════════════════════════
 */
class NexusClock {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.activeTab = 'clock';
    this.animFrame = null;
    this.clockInterval = null;

    // Stopwatch state
    this.swRunning = false;
    this.swStart = 0;
    this.swElapsed = 0;
    this.swLaps = [];
    this.swInterval = null;

    // Timer state
    this.timerRunning = false;
    this.timerEnd = 0;
    this.timerTotal = 0;
    this.timerInterval = null;

    // Alarm state
    this.alarms = [];
    this.alarmCheckInterval = null;

    // Pomodoro state
    this.pomodoroRunning = false;
    this.pomodoroPhase = 'work'; // work, break
    this.pomodoroEnd = 0;
    this.pomodoroCount = 0;
    this.pomodoroWorkMin = 25;
    this.pomodoroBreakMin = 5;
    this.pomodoroInterval = null;

    // World clocks
    this.worldCities = [
      { name: 'New York', tz: 'America/New_York' },
      { name: 'London', tz: 'Europe/London' },
      { name: 'Paris', tz: 'Europe/Paris' },
      { name: 'Tokyo', tz: 'Asia/Tokyo' },
      { name: 'Sydney', tz: 'Australia/Sydney' },
      { name: 'Dubai', tz: 'Asia/Dubai' },
      { name: 'São Paulo', tz: 'America/Sao_Paulo' },
      { name: 'Mumbai', tz: 'Asia/Kolkata' },
      { name: 'Singapore', tz: 'Asia/Singapore' },
      { name: 'Berlin', tz: 'Europe/Berlin' },
      { name: 'Los Angeles', tz: 'America/Los_Angeles' },
      { name: 'Mexico City', tz: 'America/Mexico_City' },
      { name: 'Cairo', tz: 'Africa/Cairo' },
      { name: 'Moscow', tz: 'Europe/Moscow' },
      { name: 'Beijing', tz: 'Asia/Shanghai' },
      { name: 'Seoul', tz: 'Asia/Seoul' },
      { name: 'Barcelona', tz: 'Europe/Madrid' },
      { name: 'Toronto', tz: 'America/Toronto' },
      { name: 'Bangkok', tz: 'Asia/Bangkok' },
      { name: 'Istanbul', tz: 'Europe/Istanbul' }
    ];

    this._loadAlarms();
  }

  render() {
    const style = document.createElement('style');
    style.textContent = this._getStyles();
    this.container.appendChild(style);
    this._styleEl = style;

    this.element = document.createElement('div');
    this.element.className = 'nexus-clock';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._bindEvents();
    this._startClock();
    this._switchTab('clock');
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.swInterval) clearInterval(this.swInterval);
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.alarmCheckInterval) clearInterval(this.alarmCheckInterval);
    if (this.pomodoroInterval) clearInterval(this.pomodoroInterval);
    if (this._styleEl) this._styleEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <div class="clk-tabs">
        <button class="clk-tab clk-tab-active" data-tab="clock">🕐 Clock</button>
        <button class="clk-tab" data-tab="world">🌍 World</button>
        <button class="clk-tab" data-tab="alarm">⏰ Alarm</button>
        <button class="clk-tab" data-tab="stopwatch">⏱ Stopwatch</button>
        <button class="clk-tab" data-tab="timer">⏳ Timer</button>
        <button class="clk-tab" data-tab="pomodoro">🍅 Pomo</button>
      </div>

      <div class="clk-content">
        <!-- Clock Tab -->
        <div class="clk-panel" id="clk-panel-clock">
          <div class="clk-analog-container">
            <svg class="clk-analog" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="clockGlow">
                  <feGaussianBlur stdDeviation="2" result="g"/>
                  <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <!-- Face -->
              <circle cx="100" cy="100" r="90" fill="rgba(10,5,20,0.6)" stroke="rgba(255,0,60,0.3)" stroke-width="2"/>
              <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,0,60,0.1)" stroke-width="1"/>
              <!-- Hour markers -->
              <g class="clk-markers" id="clk-markers"></g>
              <!-- Hands -->
              <line id="clk-hour-hand" x1="100" y1="100" x2="100" y2="45" stroke="#ff003c" stroke-width="3" stroke-linecap="round" filter="url(#clockGlow)"/>
              <line id="clk-min-hand" x1="100" y1="100" x2="100" y2="30" stroke="#ff2d6b" stroke-width="2" stroke-linecap="round" filter="url(#clockGlow)"/>
              <line id="clk-sec-hand" x1="100" y1="100" x2="100" y2="25" stroke="#ff4488" stroke-width="1" stroke-linecap="round" filter="url(#clockGlow)"/>
              <circle cx="100" cy="100" r="4" fill="#ff003c" filter="url(#clockGlow)"/>
            </svg>
          </div>
          <div class="clk-digital">
            <div class="clk-digital-time" id="clk-digital-time">00:00:00</div>
            <div class="clk-digital-date" id="clk-digital-date">Monday, January 1, 2026</div>
          </div>
        </div>

        <!-- World Clock Tab -->
        <div class="clk-panel" id="clk-panel-world" style="display:none;">
          <div class="clk-world-grid" id="clk-world-grid"></div>
        </div>

        <!-- Alarm Tab -->
        <div class="clk-panel" id="clk-panel-alarm" style="display:none;">
          <div class="clk-alarm-add">
            <input type="time" class="clk-alarm-time glass-input" id="alarm-time-input" value="07:00">
            <input type="text" class="clk-alarm-label glass-input" id="alarm-label-input" placeholder="Label (optional)" maxlength="30">
            <button class="clk-alarm-add-btn glass-btn" id="alarm-add-btn">+ Add Alarm</button>
          </div>
          <div class="clk-alarm-list" id="alarm-list"></div>
        </div>

        <!-- Stopwatch Tab -->
        <div class="clk-panel" id="clk-panel-stopwatch" style="display:none;">
          <div class="sw-display" id="sw-display">00:00:00.000</div>
          <div class="sw-controls">
            <button class="sw-btn sw-btn-start glass-btn" id="sw-start">Start</button>
            <button class="sw-btn glass-btn" id="sw-lap">Lap</button>
            <button class="sw-btn glass-btn" id="sw-reset">Reset</button>
          </div>
          <div class="sw-laps" id="sw-laps"></div>
        </div>

        <!-- Timer Tab -->
        <div class="clk-panel" id="clk-panel-timer" style="display:none;">
          <div class="timer-input-row">
            <div class="timer-input-group">
              <input type="number" class="timer-input glass-input" id="timer-hours" min="0" max="99" value="0" placeholder="H">
              <label>Hrs</label>
            </div>
            <span class="timer-sep">:</span>
            <div class="timer-input-group">
              <input type="number" class="timer-input glass-input" id="timer-minutes" min="0" max="59" value="5" placeholder="M">
              <label>Min</label>
            </div>
            <span class="timer-sep">:</span>
            <div class="timer-input-group">
              <input type="number" class="timer-input glass-input" id="timer-seconds" min="0" max="59" value="0" placeholder="S">
              <label>Sec</label>
            </div>
          </div>
          <div class="timer-display" id="timer-display">00:05:00</div>
          <div class="timer-progress">
            <svg viewBox="0 0 200 200" class="timer-progress-ring">
              <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,0,60,0.1)" stroke-width="4"/>
              <circle id="timer-progress-circle" cx="100" cy="100" r="85" fill="none" stroke="#ff003c" stroke-width="4"
                      stroke-dasharray="534" stroke-dashoffset="0" stroke-linecap="round"
                      transform="rotate(-90 100 100)" filter="url(#clockGlow)"/>
            </svg>
          </div>
          <div class="timer-controls">
            <button class="timer-btn timer-btn-start glass-btn" id="timer-start">Start</button>
            <button class="timer-btn glass-btn" id="timer-reset">Reset</button>
          </div>
        </div>

        <!-- Pomodoro Tab -->
        <div class="clk-panel" id="clk-panel-pomodoro" style="display:none;">
          <div class="pomo-phase" id="pomo-phase">🍅 WORK SESSION</div>
          <div class="pomo-display" id="pomo-display">25:00</div>
          <div class="pomo-count" id="pomo-count">Completed: 0 pomodoros</div>
          <div class="pomo-controls">
            <button class="pomo-btn pomo-btn-start glass-btn" id="pomo-start">Start</button>
            <button class="pomo-btn glass-btn" id="pomo-skip">Skip</button>
            <button class="pomo-btn glass-btn" id="pomo-reset">Reset</button>
          </div>
          <div class="pomo-settings">
            <label>Work: <input type="number" class="pomo-input glass-input" id="pomo-work" value="25" min="1" max="60"> min</label>
            <label>Break: <input type="number" class="pomo-input glass-input" id="pomo-break" value="5" min="1" max="30"> min</label>
          </div>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    // Tab switching
    this.element.querySelector('.clk-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.clk-tab');
      if (!tab) return;
      this._switchTab(tab.dataset.tab);
    });

    // Alarm
    this.element.querySelector('#alarm-add-btn').addEventListener('click', () => this._addAlarm());

    // Stopwatch
    this.element.querySelector('#sw-start').addEventListener('click', () => this._swToggle());
    this.element.querySelector('#sw-lap').addEventListener('click', () => this._swLap());
    this.element.querySelector('#sw-reset').addEventListener('click', () => this._swReset());

    // Timer
    this.element.querySelector('#timer-start').addEventListener('click', () => this._timerToggle());
    this.element.querySelector('#timer-reset').addEventListener('click', () => this._timerReset());

    // Pomodoro
    this.element.querySelector('#pomo-start').addEventListener('click', () => this._pomoToggle());
    this.element.querySelector('#pomo-skip').addEventListener('click', () => this._pomoSkip());
    this.element.querySelector('#pomo-reset').addEventListener('click', () => this._pomoReset());
    this.element.querySelector('#pomo-work').addEventListener('change', (e) => { this.pomodoroWorkMin = parseInt(e.target.value) || 25; });
    this.element.querySelector('#pomo-break').addEventListener('change', (e) => { this.pomodoroBreakMin = parseInt(e.target.value) || 5; });
  }

  _switchTab(tab) {
    this.activeTab = tab;
    this.element.querySelectorAll('.clk-tab').forEach(t => t.classList.toggle('clk-tab-active', t.dataset.tab === tab));
    this.element.querySelectorAll('.clk-panel').forEach(p => p.style.display = 'none');
    const panel = this.element.querySelector(`#clk-panel-${tab}`);
    if (panel) panel.style.display = 'flex';

    if (tab === 'world') this._renderWorldClocks();
    if (tab === 'alarm') this._renderAlarms();
  }

  // ─── Main Clock ─────────────────────────────────────────────────
  _startClock() {
    // Generate hour markers
    const markersEl = this.element.querySelector('#clk-markers');
    let markersHTML = '';
    for (let i = 0; i < 12; i++) {
      const angle = i * 30;
      const rad = angle * Math.PI / 180;
      const x1 = 100 + 75 * Math.sin(rad);
      const y1 = 100 - 75 * Math.cos(rad);
      const x2 = 100 + 82 * Math.sin(rad);
      const y2 = 100 - 82 * Math.cos(rad);
      markersHTML += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,0,60,0.5)" stroke-width="2" stroke-linecap="round"/>`;
      // Number
      const nx = 100 + 68 * Math.sin(rad);
      const ny = 100 - 68 * Math.cos(rad);
      markersHTML += `<text x="${nx}" y="${ny + 4}" text-anchor="middle" fill="rgba(255,45,107,0.5)" font-size="10" font-family="monospace">${i === 0 ? 12 : i}</text>`;
    }
    // Minute dots
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue;
      const angle = i * 6;
      const rad = angle * Math.PI / 180;
      const x = 100 + 80 * Math.sin(rad);
      const y = 100 - 80 * Math.cos(rad);
      markersHTML += `<circle cx="${x}" cy="${y}" r="1" fill="rgba(255,0,60,0.2)"/>`;
    }
    markersEl.innerHTML = markersHTML;

    // Update every second
    this.clockInterval = setInterval(() => this._updateClock(), 100);
    this._updateClock();

    // Alarm checker
    this.alarmCheckInterval = setInterval(() => this._checkAlarms(), 1000);
  }

  _updateClock() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();

    // Analog hands
    const secAngle = (s + ms / 1000) * 6;
    const minAngle = (m + s / 60) * 6;
    const hourAngle = ((h % 12) + m / 60) * 30;

    const secHand = this.element.querySelector('#clk-sec-hand');
    const minHand = this.element.querySelector('#clk-min-hand');
    const hourHand = this.element.querySelector('#clk-hour-hand');

    if (secHand) secHand.setAttribute('transform', `rotate(${secAngle} 100 100)`);
    if (minHand) minHand.setAttribute('transform', `rotate(${minAngle} 100 100)`);
    if (hourHand) hourHand.setAttribute('transform', `rotate(${hourAngle} 100 100)`);

    // Digital
    const timeEl = this.element.querySelector('#clk-digital-time');
    const dateEl = this.element.querySelector('#clk-digital-date');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ─── World Clocks ───────────────────────────────────────────────
  _renderWorldClocks() {
    const grid = this.element.querySelector('#clk-world-grid');
    grid.innerHTML = this.worldCities.map(city => {
      const time = this._getTimeInTZ(city.tz);
      const diff = this._getTZOffset(city.tz);
      return `
        <div class="clk-world-card">
          <svg viewBox="0 0 60 60" class="clk-world-face">
            <circle cx="30" cy="30" r="26" fill="rgba(10,5,20,0.5)" stroke="rgba(255,0,60,0.2)" stroke-width="1"/>
            ${this._miniClockHands(time)}
          </svg>
          <div class="clk-world-name">${city.name}</div>
          <div class="clk-world-time">${time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
          <div class="clk-world-diff">${diff}</div>
        </div>
      `;
    }).join('');
  }

  _miniClockHands(date) {
    const h = date.getHours() % 12;
    const m = date.getMinutes();
    const hourAngle = (h + m / 60) * 30;
    const minAngle = m * 6;
    const hx = 30 + 14 * Math.sin(hourAngle * Math.PI / 180);
    const hy = 30 - 14 * Math.cos(hourAngle * Math.PI / 180);
    const mx = 30 + 19 * Math.sin(minAngle * Math.PI / 180);
    const my = 30 - 19 * Math.cos(minAngle * Math.PI / 180);
    return `
      <line x1="30" y1="30" x2="${hx}" y2="${hy}" stroke="#ff003c" stroke-width="2" stroke-linecap="round"/>
      <line x1="30" y1="30" x2="${mx}" y2="${my}" stroke="#ff2d6b" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="30" cy="30" r="2" fill="#ff003c"/>
    `;
  }

  _getTimeInTZ(tz) {
    try {
      const str = new Date().toLocaleString('en-US', { timeZone: tz });
      return new Date(str);
    } catch (e) {
      return new Date();
    }
  }

  _getTZOffset(tz) {
    try {
      const now = new Date();
      const local = new Date(now.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
      const remote = new Date(now.toLocaleString('en-US', { timeZone: tz }));
      const diffH = Math.round((remote - local) / 3600000);
      if (diffH === 0) return 'UTC±0';
      return `UTC${diffH > 0 ? '+' : ''}${diffH}`;
    } catch (e) { return ''; }
  }

  // ─── Alarms ─────────────────────────────────────────────────────
  _addAlarm() {
    const time = this.element.querySelector('#alarm-time-input').value;
    const label = this.element.querySelector('#alarm-label-input').value.trim() || 'Alarm';
    if (!time) return;
    this.alarms.push({ id: Date.now(), time, label, enabled: true, triggered: false });
    this._saveAlarms();
    this._renderAlarms();
    this.element.querySelector('#alarm-label-input').value = '';
  }

  _renderAlarms() {
    const list = this.element.querySelector('#alarm-list');
    if (this.alarms.length === 0) {
      list.innerHTML = '<div class="clk-empty">No alarms set. Add one above.</div>';
      return;
    }
    list.innerHTML = this.alarms.map(a => `
      <div class="clk-alarm-item ${a.enabled ? '' : 'clk-alarm-disabled'}">
        <div class="clk-alarm-item-time">${a.time}</div>
        <div class="clk-alarm-item-label">${this._escapeHtml(a.label)}</div>
        <label class="clk-alarm-toggle">
          <input type="checkbox" ${a.enabled ? 'checked' : ''} data-alarm-id="${a.id}" class="alarm-enable">
          <span class="clk-toggle-slider"></span>
        </label>
        <button class="clk-alarm-del" data-alarm-del="${a.id}">✕</button>
      </div>
    `).join('');

    list.querySelectorAll('.alarm-enable').forEach(cb => {
      cb.addEventListener('change', () => {
        const alarm = this.alarms.find(a => a.id === parseInt(cb.dataset.alarmId));
        if (alarm) { alarm.enabled = cb.checked; alarm.triggered = false; this._saveAlarms(); this._renderAlarms(); }
      });
    });
    list.querySelectorAll('[data-alarm-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.alarms = this.alarms.filter(a => a.id !== parseInt(btn.dataset.alarmDel));
        this._saveAlarms();
        this._renderAlarms();
      });
    });
  }

  _checkAlarms() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hh}:${mm}`;

    this.alarms.forEach(a => {
      if (a.enabled && !a.triggered && a.time === currentTime && now.getSeconds() === 0) {
        a.triggered = true;
        this._triggerAlarm(a);
      }
      // Reset trigger at next minute
      if (a.triggered && a.time !== currentTime) a.triggered = false;
    });
  }

  _triggerAlarm(alarm) {
    // Visual notification
    try {
      if (typeof NexusEventBus !== 'undefined') {
        const bus = NexusEventBus.getInstance ? NexusEventBus.getInstance() : null;
        if (bus) bus.emit('system:notification', { title: `⏰ ${alarm.label}`, body: `Alarm: ${alarm.time}` });
      }
    } catch (e) { /* ignore */ }
  }

  _saveAlarms() {
    try { localStorage.setItem('nexus:clock:alarms', JSON.stringify(this.alarms)); } catch (e) {}
  }

  _loadAlarms() {
    try {
      const raw = localStorage.getItem('nexus:clock:alarms');
      if (raw) this.alarms = JSON.parse(raw);
    } catch (e) { this.alarms = []; }
  }

  // ─── Stopwatch ──────────────────────────────────────────────────
  _swToggle() {
    if (this.swRunning) {
      this.swElapsed += Date.now() - this.swStart;
      clearInterval(this.swInterval);
      this.swRunning = false;
      this.element.querySelector('#sw-start').textContent = 'Resume';
      this.element.querySelector('#sw-start').classList.remove('sw-btn-running');
    } else {
      this.swStart = Date.now();
      this.swRunning = true;
      this.swInterval = setInterval(() => this._swUpdate(), 10);
      this.element.querySelector('#sw-start').textContent = 'Stop';
      this.element.querySelector('#sw-start').classList.add('sw-btn-running');
    }
  }

  _swLap() {
    if (!this.swRunning) return;
    const elapsed = this.swElapsed + (Date.now() - this.swStart);
    const prevLapTotal = this.swLaps.length > 0 ? this.swLaps[this.swLaps.length - 1].total : 0;
    this.swLaps.push({ total: elapsed, split: elapsed - prevLapTotal });
    this._renderLaps();
  }

  _swReset() {
    clearInterval(this.swInterval);
    this.swRunning = false;
    this.swElapsed = 0;
    this.swLaps = [];
    this.element.querySelector('#sw-display').textContent = '00:00:00.000';
    this.element.querySelector('#sw-start').textContent = 'Start';
    this.element.querySelector('#sw-start').classList.remove('sw-btn-running');
    this.element.querySelector('#sw-laps').innerHTML = '';
  }

  _swUpdate() {
    const elapsed = this.swElapsed + (Date.now() - this.swStart);
    this.element.querySelector('#sw-display').textContent = this._formatMs(elapsed);
  }

  _renderLaps() {
    const container = this.element.querySelector('#sw-laps');
    container.innerHTML = this.swLaps.map((lap, i) => {
      const best = this.swLaps.reduce((min, l) => l.split < min.split ? l : min, this.swLaps[0]);
      const worst = this.swLaps.reduce((max, l) => l.split > max.split ? l : max, this.swLaps[0]);
      let cls = '';
      if (this.swLaps.length > 2) {
        if (lap === best) cls = 'sw-lap-best';
        if (lap === worst) cls = 'sw-lap-worst';
      }
      return `<div class="sw-lap ${cls}">
        <span>Lap ${i + 1}</span>
        <span>${this._formatMs(lap.split)}</span>
        <span>${this._formatMs(lap.total)}</span>
      </div>`;
    }).reverse().join('');
  }

  // ─── Timer ──────────────────────────────────────────────────────
  _timerToggle() {
    if (this.timerRunning) {
      clearInterval(this.timerInterval);
      this.timerRunning = false;
      this.element.querySelector('#timer-start').textContent = 'Resume';
    } else {
      if (this.timerEnd === 0) {
        const h = parseInt(this.element.querySelector('#timer-hours').value) || 0;
        const m = parseInt(this.element.querySelector('#timer-minutes').value) || 0;
        const s = parseInt(this.element.querySelector('#timer-seconds').value) || 0;
        this.timerTotal = (h * 3600 + m * 60 + s) * 1000;
        if (this.timerTotal === 0) return;
        this.timerEnd = Date.now() + this.timerTotal;
      }
      this.timerRunning = true;
      this.timerInterval = setInterval(() => this._timerUpdate(), 100);
      this.element.querySelector('#timer-start').textContent = 'Pause';
    }
  }

  _timerReset() {
    clearInterval(this.timerInterval);
    this.timerRunning = false;
    this.timerEnd = 0;
    this.timerTotal = 0;
    this.element.querySelector('#timer-display').textContent = '00:00:00';
    this.element.querySelector('#timer-start').textContent = 'Start';
    this._updateTimerProgress(1);
  }

  _timerUpdate() {
    const remaining = Math.max(0, this.timerEnd - Date.now());
    this.element.querySelector('#timer-display').textContent = this._formatHMS(remaining);
    this._updateTimerProgress(remaining / this.timerTotal);

    if (remaining <= 0) {
      clearInterval(this.timerInterval);
      this.timerRunning = false;
      this.timerEnd = 0;
      this.element.querySelector('#timer-display').textContent = '00:00:00';
      this.element.querySelector('#timer-display').classList.add('timer-done');
      this.element.querySelector('#timer-start').textContent = 'Start';
      setTimeout(() => this.element.querySelector('#timer-display').classList.remove('timer-done'), 3000);

      try {
        if (typeof NexusEventBus !== 'undefined') {
          const bus = NexusEventBus.getInstance ? NexusEventBus.getInstance() : null;
          if (bus) bus.emit('system:notification', { title: '⏳ Timer', body: 'Time is up!' });
        }
      } catch (e) {}
    }
  }

  _updateTimerProgress(ratio) {
    const circle = this.element.querySelector('#timer-progress-circle');
    if (!circle) return;
    const circumference = 2 * Math.PI * 85;
    circle.setAttribute('stroke-dasharray', circumference);
    circle.setAttribute('stroke-dashoffset', circumference * (1 - ratio));
  }

  // ─── Pomodoro ───────────────────────────────────────────────────
  _pomoToggle() {
    if (this.pomodoroRunning) {
      clearInterval(this.pomodoroInterval);
      this.pomodoroRunning = false;
      this.element.querySelector('#pomo-start').textContent = 'Resume';
    } else {
      if (this.pomodoroEnd === 0) {
        const minutes = this.pomodoroPhase === 'work' ? this.pomodoroWorkMin : this.pomodoroBreakMin;
        this.pomodoroEnd = Date.now() + minutes * 60000;
      }
      this.pomodoroRunning = true;
      this.pomodoroInterval = setInterval(() => this._pomoUpdate(), 1000);
      this.element.querySelector('#pomo-start').textContent = 'Pause';
    }
  }

  _pomoSkip() {
    this._pomoNextPhase();
  }

  _pomoReset() {
    clearInterval(this.pomodoroInterval);
    this.pomodoroRunning = false;
    this.pomodoroEnd = 0;
    this.pomodoroPhase = 'work';
    this.pomodoroCount = 0;
    this._pomoUpdateDisplay();
    this.element.querySelector('#pomo-start').textContent = 'Start';
  }

  _pomoUpdate() {
    const remaining = Math.max(0, this.pomodoroEnd - Date.now());
    if (remaining <= 0) {
      this._pomoNextPhase();
      return;
    }
    const min = Math.floor(remaining / 60000);
    const sec = Math.floor((remaining % 60000) / 1000);
    this.element.querySelector('#pomo-display').textContent =
      `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  _pomoNextPhase() {
    clearInterval(this.pomodoroInterval);
    this.pomodoroRunning = false;
    this.pomodoroEnd = 0;

    if (this.pomodoroPhase === 'work') {
      this.pomodoroCount++;
      this.pomodoroPhase = 'break';
    } else {
      this.pomodoroPhase = 'work';
    }

    this._pomoUpdateDisplay();
    this.element.querySelector('#pomo-start').textContent = 'Start';

    try {
      if (typeof NexusEventBus !== 'undefined') {
        const bus = NexusEventBus.getInstance ? NexusEventBus.getInstance() : null;
        if (bus) bus.emit('system:notification', {
          title: this.pomodoroPhase === 'work' ? '🍅 Work Time!' : '☕ Break Time!',
          body: this.pomodoroPhase === 'work' ? 'Back to work session' : 'Take a break!'
        });
      }
    } catch (e) {}
  }

  _pomoUpdateDisplay() {
    const minutes = this.pomodoroPhase === 'work' ? this.pomodoroWorkMin : this.pomodoroBreakMin;
    this.element.querySelector('#pomo-display').textContent = `${String(minutes).padStart(2, '0')}:00`;
    this.element.querySelector('#pomo-phase').textContent =
      this.pomodoroPhase === 'work' ? '🍅 WORK SESSION' : '☕ BREAK TIME';
    this.element.querySelector('#pomo-count').textContent = `Completed: ${this.pomodoroCount} pomodoros`;
  }

  // ─── Utilities ──────────────────────────────────────────────────
  _formatMs(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const mil = ms % 1000;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(mil).padStart(3,'0')}`;
  }

  _formatHMS(ms) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  _escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ─── Styles ─────────────────────────────────────────────────────
  _getStyles() {
    return `
      .nexus-clock {
        width: 100%; height: 100%;
        background: rgba(10, 5, 20, 0.96);
        border: 1px solid rgba(255, 0, 60, 0.2);
        border-radius: 8px;
        display: flex; flex-direction: column;
        overflow: hidden;
        box-shadow: 0 0 30px rgba(255, 0, 60, 0.1);
        font-family: 'Segoe UI', sans-serif;
      }

      .clk-tabs {
        display: flex; border-bottom: 1px solid rgba(255, 0, 60, 0.12);
        flex-shrink: 0; flex-wrap: wrap;
      }
      .clk-tab {
        flex: 1; padding: 7px 4px; font-size: 10px; min-width: 50px;
        background: rgba(15, 8, 25, 0.8); color: #777;
        border: none; cursor: pointer; transition: all 0.15s;
        white-space: nowrap;
      }
      .clk-tab:hover { color: #bbb; }
      .clk-tab-active { color: #ff003c !important; border-bottom: 2px solid #ff003c; background: rgba(255, 0, 60, 0.1); }

      .clk-content { flex: 1; overflow: hidden; }
      .clk-panel { flex-direction: column; align-items: center; padding: 16px; height: 100%; overflow-y: auto; }

      /* Clock Tab */
      .clk-analog-container { width: 200px; height: 200px; margin: 0 auto 16px; }
      .clk-analog { width: 100%; height: 100%; }
      .clk-digital { text-align: center; }
      .clk-digital-time {
        font-size: 2.4em; font-family: 'Courier New', monospace;
        color: #eee; text-shadow: 0 0 15px rgba(255, 0, 60, 0.4);
        letter-spacing: 3px;
      }
      .clk-digital-date { font-size: 12px; color: #888; margin-top: 4px; }

      /* World Clock */
      .clk-world-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px; width: 100%;
      }
      .clk-world-card {
        text-align: center; padding: 10px;
        background: rgba(255, 0, 60, 0.04); border: 1px solid rgba(255, 0, 60, 0.08);
        border-radius: 8px;
      }
      .clk-world-face { width: 50px; height: 50px; margin: 0 auto 6px; display: block; }
      .clk-world-name { font-size: 10px; color: #aaa; font-weight: bold; }
      .clk-world-time { font-size: 14px; color: #eee; font-family: monospace; }
      .clk-world-diff { font-size: 9px; color: #666; }

      /* Alarms */
      .clk-alarm-add {
        display: flex; gap: 8px; width: 100%; margin-bottom: 12px; flex-wrap: wrap;
      }
      .clk-alarm-time { width: 100px; padding: 6px; }
      .clk-alarm-label { flex: 1; min-width: 100px; padding: 6px; }
      .clk-alarm-add-btn { padding: 6px 14px; font-size: 12px; white-space: nowrap; }
      .clk-alarm-list { width: 100%; }
      .clk-alarm-item {
        display: flex; align-items: center; gap: 10px;
        padding: 10px; margin-bottom: 6px;
        background: rgba(255, 0, 60, 0.04); border: 1px solid rgba(255, 0, 60, 0.08);
        border-radius: 6px;
      }
      .clk-alarm-disabled { opacity: 0.4; }
      .clk-alarm-item-time { font-size: 1.4em; color: #eee; font-family: monospace; min-width: 60px; }
      .clk-alarm-item-label { flex: 1; font-size: 12px; color: #aaa; }
      .clk-alarm-toggle { position: relative; display: inline-block; width: 36px; height: 20px; }
      .clk-alarm-toggle input { display: none; }
      .clk-toggle-slider {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(255, 0, 60, 0.15); border-radius: 10px; cursor: pointer;
        transition: 0.2s;
      }
      .clk-toggle-slider::before {
        content: ''; position: absolute; width: 16px; height: 16px;
        left: 2px; bottom: 2px; background: #888; border-radius: 50%;
        transition: 0.2s;
      }
      .clk-alarm-toggle input:checked + .clk-toggle-slider { background: rgba(255, 0, 60, 0.4); }
      .clk-alarm-toggle input:checked + .clk-toggle-slider::before { transform: translateX(16px); background: #ff003c; }
      .clk-alarm-del { background: none; border: none; color: #555; cursor: pointer; font-size: 14px; }
      .clk-alarm-del:hover { color: #ff003c; }
      .clk-empty { color: #555; font-size: 12px; text-align: center; padding: 20px; }

      /* Stopwatch */
      .sw-display {
        font-size: 2.6em; font-family: 'Courier New', monospace;
        color: #eee; text-shadow: 0 0 15px rgba(255, 0, 60, 0.3);
        text-align: center; margin: 10px 0 16px;
        letter-spacing: 2px;
      }
      .sw-controls { display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; }
      .sw-btn { padding: 8px 20px; font-size: 12px; }
      .sw-btn-start { background: rgba(0, 255, 136, 0.15); border-color: rgba(0, 255, 136, 0.3); color: #00ff88; }
      .sw-btn-running { background: rgba(255, 0, 60, 0.2) !important; border-color: rgba(255, 0, 60, 0.4) !important; color: #ff003c !important; }
      .sw-laps { width: 100%; max-height: 150px; overflow-y: auto; }
      .sw-lap {
        display: flex; justify-content: space-between;
        padding: 4px 8px; font-size: 11px; color: #888;
        font-family: monospace;
        border-bottom: 1px solid rgba(255, 0, 60, 0.05);
      }
      .sw-lap-best { color: #00ff88; }
      .sw-lap-worst { color: #ff003c; }

      /* Timer */
      .timer-input-row { display: flex; align-items: center; gap: 6px; justify-content: center; margin-bottom: 10px; }
      .timer-input-group { display: flex; flex-direction: column; align-items: center; }
      .timer-input { width: 50px; text-align: center; padding: 6px; font-size: 16px; font-family: monospace; }
      .timer-input-group label { font-size: 9px; color: #666; margin-top: 2px; }
      .timer-sep { font-size: 1.4em; color: #555; margin: 0 2px; align-self: flex-start; margin-top: 6px; }
      .timer-display {
        font-size: 2.8em; font-family: 'Courier New', monospace;
        color: #eee; text-shadow: 0 0 15px rgba(255, 0, 60, 0.3);
        text-align: center; margin: 4px 0;
        letter-spacing: 3px;
      }
      .timer-done { color: #00ff88 !important; text-shadow: 0 0 20px rgba(0, 255, 136, 0.5) !important; animation: timer-pulse 0.5s 6; }
      @keyframes timer-pulse { 50% { opacity: 0.3; } }
      .timer-progress { width: 160px; height: 160px; margin: 8px auto; }
      .timer-progress-ring { width: 100%; height: 100%; }
      .timer-controls { display: flex; gap: 8px; justify-content: center; }
      .timer-btn { padding: 8px 20px; font-size: 12px; }
      .timer-btn-start { background: rgba(0, 255, 136, 0.15); border-color: rgba(0, 255, 136, 0.3); color: #00ff88; }

      /* Pomodoro */
      .pomo-phase { font-size: 14px; color: #ff003c; font-weight: bold; letter-spacing: 2px; margin-bottom: 10px; }
      .pomo-display {
        font-size: 3em; font-family: 'Courier New', monospace;
        color: #eee; text-shadow: 0 0 15px rgba(255, 0, 60, 0.4);
        text-align: center; letter-spacing: 4px;
      }
      .pomo-count { font-size: 11px; color: #888; margin: 8px 0 16px; }
      .pomo-controls { display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; }
      .pomo-btn { padding: 8px 18px; font-size: 12px; }
      .pomo-btn-start { background: rgba(0, 255, 136, 0.15); border-color: rgba(0, 255, 136, 0.3); color: #00ff88; }
      .pomo-settings {
        display: flex; gap: 16px; font-size: 11px; color: #888;
      }
      .pomo-input {
        width: 40px; padding: 3px; text-align: center;
        background: rgba(20, 10, 35, 0.8); border: 1px solid rgba(255, 0, 60, 0.15);
        color: #ddd; border-radius: 3px; font-family: monospace;
      }
    `;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.NexusClock = NexusClock;
}
