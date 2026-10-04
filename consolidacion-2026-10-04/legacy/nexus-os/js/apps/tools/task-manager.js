'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Task Manager
 *  Process management with start/stop, kill, resource tracking
 * ═══════════════════════════════════════════════════════════════
 */
class NexusTaskManager {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.processes = [];
    this.selectedPid = null;
    this.sortCol = 'pid';
    this.sortAsc = true;
    this.filter = '';
    this.cpuHistory = [];
    this.memHistory = [];
    this.historyMax = 60;
    this.tickInterval = null;
    this.nextPid = 1000;
    this._initProcesses();
  }

  _initProcesses() {
    const defs = [
      { name: 'nexus-kernel', module: 'system', priority: 'REALTIME', autoRestart: true },
      { name: 'nexus-wm', module: 'system', priority: 'HIGH', autoRestart: true },
      { name: 'nexus-taskbar', module: 'system', priority: 'HIGH' },
      { name: 'nexus-desktop', module: 'system', priority: 'NORMAL' },
      { name: 'nexus-network', module: 'network', priority: 'HIGH' },
      { name: 'nexus-audio', module: 'media', priority: 'NORMAL' },
      { name: 'nexus-storage', module: 'io', priority: 'HIGH' },
      { name: 'nexus-auth', module: 'security', priority: 'REALTIME' },
      { name: 'nexus-logger', module: 'system', priority: 'LOW' },
      { name: 'nexus-scheduler', module: 'system', priority: 'NORMAL' },
      { name: 'nexus-compositor', module: 'display', priority: 'HIGH' },
      { name: 'terminal', module: 'app', priority: 'NORMAL' },
      { name: 'file-explorer', module: 'app', priority: 'NORMAL' },
      { name: 'code-editor', module: 'app', priority: 'NORMAL' },
      { name: 'nexus-indexer', module: 'io', priority: 'LOW' },
      { name: 'nexus-notifications', module: 'ui', priority: 'LOW' },
      { name: 'nexus-clipboard', module: 'ui', priority: 'LOW' },
      { name: 'nexus-backup-agent', module: 'system', priority: 'LOW' },
    ];
    this.processes = defs.map((d, i) => ({
      pid: 100 + i,
      name: d.name,
      module: d.module,
      state: Math.random() > 0.05 ? 'running' : 'sleeping',
      priority: d.priority,
      cpu: +(Math.random() * (d.priority === 'REALTIME' ? 5 : d.priority === 'HIGH' ? 8 : 15)).toFixed(1),
      mem: +(Math.random() * (d.module === 'system' ? 120 : 80) + 5).toFixed(1),
      threads: Math.floor(Math.random() * 8) + 1,
      uptime: Math.floor(Math.random() * 86400),
      autoRestart: d.autoRestart || false,
      parentPid: i < 4 ? 1 : 100 + Math.floor(Math.random() * 4),
      startTime: Date.now() - Math.floor(Math.random() * 86400000),
      ioRead: Math.floor(Math.random() * 500),
      ioWrite: Math.floor(Math.random() * 200),
      handles: Math.floor(Math.random() * 100) + 10
    }));
    this.nextPid = 100 + defs.length;
  }

  render() {
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/tools/task-manager.css';
    this.container.appendChild(link);
    this._linkEl = link;

    this.element = document.createElement('div');
    this.element.className = 'nexus-task-manager';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._bindEvents();
    this._renderTable();
    this._updateStats();
    this._drawGraph();

    this.tickInterval = setInterval(() => this._tick(), 1500);
  }

  destroy() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this._linkEl) this._linkEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <div class="tm-header">
        <h3>⚙ TASK MANAGER</h3>
        <div class="tm-stats">
          <div class="tm-stat">Processes: <span id="tm-count">0</span></div>
          <div class="tm-stat">CPU: <span id="tm-cpu">0%</span></div>
          <div class="tm-stat">MEM: <span id="tm-mem">0 MB</span></div>
          <div class="tm-stat">Uptime: <span id="tm-uptime">0:00</span></div>
        </div>
      </div>
      <div class="tm-toolbar">
        <button class="tm-btn" id="tm-refresh">↻ Refresh</button>
        <button class="tm-btn" id="tm-new">+ New Process</button>
        <button class="tm-btn tm-btn-danger" id="tm-kill" disabled>✕ Kill</button>
        <button class="tm-btn" id="tm-pause" disabled>⏸ Pause</button>
        <button class="tm-btn" id="tm-resume" disabled>▶ Resume</button>
        <input type="text" class="tm-search" id="tm-search" placeholder="Filter processes...">
      </div>
      <div class="tm-graph"><canvas id="tm-graph-canvas"></canvas></div>
      <div class="tm-table-wrap">
        <table class="tm-table">
          <thead>
            <tr>
              <th data-col="pid">PID</th>
              <th data-col="name">Name</th>
              <th data-col="state">State</th>
              <th data-col="priority">Priority</th>
              <th data-col="cpu">CPU %</th>
              <th data-col="mem">Memory</th>
              <th data-col="threads">Threads</th>
              <th data-col="uptime">Uptime</th>
            </tr>
          </thead>
          <tbody id="tm-tbody"></tbody>
        </table>
      </div>
      <div class="tm-footer">
        <span id="tm-footer-info">Select a process to view details</span>
        <span id="tm-footer-time"></span>
      </div>
    `;
  }

  _bindEvents() {
    this.element.querySelector('#tm-search').addEventListener('input', (e) => {
      this.filter = e.target.value.toLowerCase();
      this._renderTable();
    });

    this.element.querySelector('#tm-refresh').addEventListener('click', () => {
      this._tick();
      this._renderTable();
    });

    this.element.querySelector('#tm-new').addEventListener('click', () => this._createProcess());
    this.element.querySelector('#tm-kill').addEventListener('click', () => this._killSelected());
    this.element.querySelector('#tm-pause').addEventListener('click', () => this._pauseSelected());
    this.element.querySelector('#tm-resume').addEventListener('click', () => this._resumeSelected());

    this.element.querySelector('.tm-table thead').addEventListener('click', (e) => {
      const th = e.target.closest('th');
      if (!th) return;
      const col = th.dataset.col;
      if (this.sortCol === col) this.sortAsc = !this.sortAsc;
      else { this.sortCol = col; this.sortAsc = true; }
      this._renderTable();
    });

    this.element.querySelector('#tm-tbody').addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      this.selectedPid = parseInt(tr.dataset.pid);
      this._updateButtons();
      this._renderTable();
      this._updateFooter();
    });
  }

  _tick() {
    this.processes.forEach(p => {
      if (p.state === 'running') {
        p.cpu = Math.max(0, p.cpu + (Math.random() - 0.5) * 3);
        p.cpu = +p.cpu.toFixed(1);
        p.mem = Math.max(1, p.mem + (Math.random() - 0.48) * 2);
        p.mem = +p.mem.toFixed(1);
        p.uptime += 1.5;
        p.ioRead += Math.floor(Math.random() * 5);
        p.ioWrite += Math.floor(Math.random() * 2);
      } else if (p.state === 'sleeping') {
        if (Math.random() > 0.9) p.state = 'running';
        p.cpu = +(Math.random() * 0.5).toFixed(1);
      }
    });

    const totalCpu = this.processes.reduce((s, p) => s + p.cpu, 0);
    const totalMem = this.processes.reduce((s, p) => s + p.mem, 0);
    this.cpuHistory.push(totalCpu);
    this.memHistory.push(totalMem);
    if (this.cpuHistory.length > this.historyMax) this.cpuHistory.shift();
    if (this.memHistory.length > this.historyMax) this.memHistory.shift();

    this._updateStats();
    this._drawGraph();
    this._renderTable();
  }

  _updateStats() {
    const running = this.processes.filter(p => p.state === 'running').length;
    const totalCpu = this.processes.reduce((s, p) => s + p.cpu, 0);
    const totalMem = this.processes.reduce((s, p) => s + p.mem, 0);
    const upSec = Math.floor((Date.now() - (Date.now() - 86400000)) / 1000);

    this.element.querySelector('#tm-count').textContent = `${running}/${this.processes.length}`;
    this.element.querySelector('#tm-cpu').textContent = `${totalCpu.toFixed(1)}%`;
    this.element.querySelector('#tm-mem').textContent = `${totalMem.toFixed(0)} MB`;

    const bootTime = this.processes.length > 0 ? this.processes[0].startTime : Date.now();
    const up = Math.floor((Date.now() - bootTime) / 1000);
    const h = Math.floor(up / 3600);
    const m = Math.floor((up % 3600) / 60);
    this.element.querySelector('#tm-uptime').textContent = `${h}:${String(m).padStart(2, '0')}`;
    this.element.querySelector('#tm-footer-time').textContent = new Date().toLocaleTimeString();
  }

  _drawGraph() {
    const canvas = this.element.querySelector('#tm-graph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    const w = rect.width, h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255, 0, 60, 0.08)';
    ctx.lineWidth = 0.5;
    for (let y = 0; y < h; y += 10) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const drawLine = (data, color) => {
      if (data.length < 2) return;
      const max = Math.max(...data, 1);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      data.forEach((v, i) => {
        const x = (i / (this.historyMax - 1)) * w;
        const y = h - (v / max) * (h - 4);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    drawLine(this.cpuHistory, '#ff003c');
    drawLine(this.memHistory.map(v => v / 10), '#00ccff');
  }

  _getFiltered() {
    let list = [...this.processes];
    if (this.filter) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(this.filter) ||
        String(p.pid).includes(this.filter) ||
        p.module.toLowerCase().includes(this.filter) ||
        p.state.toLowerCase().includes(this.filter)
      );
    }
    list.sort((a, b) => {
      let va = a[this.sortCol], vb = b[this.sortCol];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return this.sortAsc ? -1 : 1;
      if (va > vb) return this.sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }

  _renderTable() {
    const tbody = this.element.querySelector('#tm-tbody');
    if (!tbody) return;
    const list = this._getFiltered();
    const maxCpu = Math.max(...this.processes.map(p => p.cpu), 1);
    const maxMem = Math.max(...this.processes.map(p => p.mem), 1);

    tbody.innerHTML = list.map(p => `
      <tr data-pid="${p.pid}" class="${p.pid === this.selectedPid ? 'selected' : ''}">
        <td>${p.pid}</td>
        <td>${this._esc(p.name)}</td>
        <td class="tm-state-${p.state}">${p.state}</td>
        <td>${p.priority}</td>
        <td>${p.cpu.toFixed(1)}<div class="tm-bar-wrap"><div class="tm-bar tm-bar-cpu ${p.cpu > 10 ? 'tm-bar-high' : ''}" style="width:${(p.cpu / maxCpu * 100).toFixed(0)}%"></div></div></td>
        <td>${p.mem.toFixed(0)} MB<div class="tm-bar-wrap"><div class="tm-bar tm-bar-mem ${p.mem > 80 ? 'tm-bar-high' : ''}" style="width:${(p.mem / maxMem * 100).toFixed(0)}%"></div></div></td>
        <td>${p.threads}</td>
        <td>${this._fmtUptime(p.uptime)}</td>
      </tr>
    `).join('');

    // Update sort indicators
    this.element.querySelectorAll('.tm-table th').forEach(th => {
      th.classList.remove('sorted', 'sorted-asc');
      if (th.dataset.col === this.sortCol) {
        th.classList.add(this.sortAsc ? 'sorted-asc' : 'sorted');
      }
    });
  }

  _updateButtons() {
    const p = this.processes.find(p => p.pid === this.selectedPid);
    const kill = this.element.querySelector('#tm-kill');
    const pause = this.element.querySelector('#tm-pause');
    const resume = this.element.querySelector('#tm-resume');
    kill.disabled = !p || p.pid <= 3;
    pause.disabled = !p || p.state !== 'running';
    resume.disabled = !p || (p.state !== 'paused' && p.state !== 'sleeping');
  }

  _updateFooter() {
    const p = this.processes.find(p => p.pid === this.selectedPid);
    const info = this.element.querySelector('#tm-footer-info');
    if (!p) { info.textContent = 'Select a process to view details'; return; }
    info.textContent = `PID ${p.pid} | ${p.name} | Module: ${p.module} | IO R:${p.ioRead} W:${p.ioWrite} | Handles: ${p.handles} | Parent: ${p.parentPid} | Auto-restart: ${p.autoRestart ? 'Yes' : 'No'}`;
  }

  _createProcess() {
    const name = `nexus-worker-${this.nextPid}`;
    this.processes.push({
      pid: this.nextPid++,
      name,
      module: 'app',
      state: 'running',
      priority: 'NORMAL',
      cpu: +(Math.random() * 5).toFixed(1),
      mem: +(Math.random() * 40 + 5).toFixed(1),
      threads: Math.floor(Math.random() * 4) + 1,
      uptime: 0,
      autoRestart: false,
      parentPid: 100,
      startTime: Date.now(),
      ioRead: 0, ioWrite: 0, handles: Math.floor(Math.random() * 20) + 5
    });
    this._renderTable();
    this._updateStats();
  }

  _killSelected() {
    if (!this.selectedPid) return;
    const idx = this.processes.findIndex(p => p.pid === this.selectedPid);
    if (idx < 0) return;
    const p = this.processes[idx];
    if (p.pid <= 3) return; // Can't kill kernel processes
    if (p.autoRestart) {
      p.state = 'crashed';
      setTimeout(() => {
        p.state = 'running';
        p.cpu = +(Math.random() * 5).toFixed(1);
        p.mem = +(Math.random() * 30 + 5).toFixed(1);
        this._renderTable();
      }, 2000);
    } else {
      this.processes.splice(idx, 1);
    }
    this.selectedPid = null;
    this._updateButtons();
    this._renderTable();
    this._updateStats();
  }

  _pauseSelected() {
    const p = this.processes.find(p => p.pid === this.selectedPid);
    if (p && p.state === 'running') {
      p.state = 'paused';
      p.cpu = 0;
      this._updateButtons();
      this._renderTable();
    }
  }

  _resumeSelected() {
    const p = this.processes.find(p => p.pid === this.selectedPid);
    if (p && (p.state === 'paused' || p.state === 'sleeping')) {
      p.state = 'running';
      p.cpu = +(Math.random() * 5).toFixed(1);
      this._updateButtons();
      this._renderTable();
    }
  }

  _fmtUptime(sec) {
    if (sec < 60) return `${Math.floor(sec)}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ${Math.floor(sec % 60)}s`;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  }

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

window.NexusTaskManager = NexusTaskManager;
