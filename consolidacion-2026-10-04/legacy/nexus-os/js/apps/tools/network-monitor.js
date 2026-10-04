'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Network Monitor
 *  Monitor API usage, bandwidth, connections, and endpoints
 * ═══════════════════════════════════════════════════════════════
 */
class NexusNetworkMonitor {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.tickInterval = null;

    // Stats
    this.bytesIn = 0;
    this.bytesOut = 0;
    this.packetsIn = 0;
    this.packetsOut = 0;
    this.totalRequests = 0;
    this.totalErrors = 0;
    this.bandwidthHistory = []; // { in, out }
    this.maxHistory = 60;

    // Simulated connections
    this.connections = [
      { host: 'api.nexus-os.local', port: 443, proto: 'HTTPS', state: 'active', bytes: 0, latency: 12 },
      { host: 'ai.nexus-cloud.io', port: 443, proto: 'HTTPS', state: 'active', bytes: 0, latency: 45 },
      { host: 'storage.nexus.local', port: 9200, proto: 'TCP', state: 'active', bytes: 0, latency: 3 },
      { host: 'ws.nexus-os.local', port: 8080, proto: 'WS', state: 'active', bytes: 0, latency: 2 },
      { host: 'cdn.assets.net', port: 443, proto: 'HTTPS', state: 'idle', bytes: 0, latency: 78 },
      { host: 'telemetry.nexus.io', port: 443, proto: 'HTTPS', state: 'idle', bytes: 0, latency: 120 },
      { host: 'dns.nexus.local', port: 53, proto: 'UDP', state: 'active', bytes: 0, latency: 1 },
      { host: 'ntp.pool.org', port: 123, proto: 'UDP', state: 'idle', bytes: 0, latency: 35 },
    ];

    // API usage tracking
    this.apiEndpoints = [
      { name: 'AI Chat (/v1/chat)', calls: 0, errors: 0, avgLatency: 0, latencies: [] },
      { name: 'Storage (/api/store)', calls: 0, errors: 0, avgLatency: 0, latencies: [] },
      { name: 'Auth (/api/auth)', calls: 0, errors: 0, avgLatency: 0, latencies: [] },
      { name: 'Search (/api/search)', calls: 0, errors: 0, avgLatency: 0, latencies: [] },
      { name: 'Files (/api/files)', calls: 0, errors: 0, avgLatency: 0, latencies: [] },
      { name: 'Config (/api/config)', calls: 0, errors: 0, avgLatency: 0, latencies: [] },
      { name: 'Events (/ws/events)', calls: 0, errors: 0, avgLatency: 0, latencies: [] },
      { name: 'Media (/api/media)', calls: 0, errors: 0, avgLatency: 0, latencies: [] },
    ];
  }

  render() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/tools/network-monitor.css';
    this.container.appendChild(link);
    this._linkEl = link;

    this.element = document.createElement('div');
    this.element.className = 'nexus-network-monitor';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._tick();
    this._renderStats();
    this._renderConnections();
    this._renderAPIs();
    this._drawChart();

    this.tickInterval = setInterval(() => {
      this._tick();
      this._renderStats();
      this._renderConnections();
      this._renderAPIs();
      this._drawChart();
    }, 2000);
  }

  destroy() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this._linkEl) this._linkEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <div class="nm-header">
        <h3>📡 NETWORK MONITOR</h3>
        <div class="nm-status">
          <div class="nm-dot"></div>
          <span>Connected</span>
        </div>
      </div>
      <div class="nm-body">
        <div class="nm-stats">
          <div class="nm-stat">
            <div class="nm-stat-value" id="nm-bw-in">0</div>
            <div class="nm-stat-label">↓ Bandwidth In</div>
          </div>
          <div class="nm-stat">
            <div class="nm-stat-value" id="nm-bw-out">0</div>
            <div class="nm-stat-label">↑ Bandwidth Out</div>
          </div>
          <div class="nm-stat">
            <div class="nm-stat-value" id="nm-requests">0</div>
            <div class="nm-stat-label">Total Requests</div>
          </div>
          <div class="nm-stat">
            <div class="nm-stat-value" id="nm-errors" style="color:#ff4444">0</div>
            <div class="nm-stat-label">Errors</div>
          </div>
        </div>

        <div class="nm-chart">
          <canvas id="nm-chart-canvas"></canvas>
          <div class="nm-chart-legend">
            <div class="nm-legend-item"><div class="nm-legend-dot" style="background:#00ff88"></div>In</div>
            <div class="nm-legend-item"><div class="nm-legend-dot" style="background:#00c8ff"></div>Out</div>
          </div>
        </div>

        <div class="nm-connections">
          <h4>Active Connections</h4>
          <table class="nm-conn-table">
            <thead>
              <tr>
                <th>Host</th>
                <th>Port</th>
                <th>Proto</th>
                <th>State</th>
                <th>Latency</th>
                <th>Transferred</th>
              </tr>
            </thead>
            <tbody id="nm-conn-body"></tbody>
          </table>
        </div>

        <div class="nm-api-section">
          <h4 style="margin:0 0 8px;font-size:11px;font-weight:600;color:#00ff88;text-transform:uppercase;letter-spacing:0.5px">API Usage</h4>
          <div id="nm-api-list"></div>
        </div>
      </div>
      <div class="nm-footer">
        <span id="nm-footer-packets">Packets: 0 in / 0 out</span>
        <span id="nm-footer-time"></span>
      </div>
    `;
  }

  _tick() {
    // Simulate network activity
    const newIn = Math.floor(Math.random() * 50000) + 5000;
    const newOut = Math.floor(Math.random() * 30000) + 3000;
    this.bytesIn += newIn;
    this.bytesOut += newOut;
    this.packetsIn += Math.floor(newIn / 1400) + 1;
    this.packetsOut += Math.floor(newOut / 1400) + 1;

    this.bandwidthHistory.push({ in: newIn, out: newOut });
    if (this.bandwidthHistory.length > this.maxHistory) this.bandwidthHistory.shift();

    // Update connections
    this.connections.forEach(conn => {
      conn.bytes += Math.floor(Math.random() * 10000);
      conn.latency = Math.max(1, conn.latency + (Math.random() - 0.5) * 10);
      conn.latency = +conn.latency.toFixed(0);
      if (conn.state === 'idle' && Math.random() > 0.85) conn.state = 'active';
      else if (conn.state === 'active' && Math.random() > 0.92) conn.state = 'idle';
    });

    // Simulate API calls
    this.apiEndpoints.forEach(api => {
      if (Math.random() > 0.5) {
        const calls = Math.floor(Math.random() * 5) + 1;
        api.calls += calls;
        this.totalRequests += calls;
        const latency = Math.floor(Math.random() * 200) + 10;
        api.latencies.push(latency);
        if (api.latencies.length > 20) api.latencies.shift();
        api.avgLatency = Math.floor(api.latencies.reduce((a, b) => a + b, 0) / api.latencies.length);
        if (Math.random() > 0.95) {
          api.errors++;
          this.totalErrors++;
        }
      }
    });
  }

  _renderStats() {
    this.element.querySelector('#nm-bw-in').textContent = this._fmtBytes(this.bytesIn);
    this.element.querySelector('#nm-bw-out').textContent = this._fmtBytes(this.bytesOut);
    this.element.querySelector('#nm-requests').textContent = this.totalRequests.toLocaleString();
    this.element.querySelector('#nm-errors').textContent = this.totalErrors;
    this.element.querySelector('#nm-footer-packets').textContent =
      `Packets: ${this.packetsIn.toLocaleString()} in / ${this.packetsOut.toLocaleString()} out`;
    this.element.querySelector('#nm-footer-time').textContent = new Date().toLocaleTimeString();
  }

  _renderConnections() {
    const body = this.element.querySelector('#nm-conn-body');
    body.innerHTML = this.connections.map(c => `
      <tr>
        <td>${c.host}</td>
        <td>${c.port}</td>
        <td>${c.proto}</td>
        <td class="nm-state-${c.state}">${c.state}</td>
        <td>${c.latency}ms</td>
        <td>${this._fmtBytes(c.bytes)}</td>
      </tr>
    `).join('');
  }

  _renderAPIs() {
    const el = this.element.querySelector('#nm-api-list');
    const maxCalls = Math.max(...this.apiEndpoints.map(a => a.calls), 1);
    el.innerHTML = this.apiEndpoints.map(api => `
      <div class="nm-api-item">
        <span class="nm-api-name">${api.name}</span>
        <span class="nm-api-calls">${api.calls}</span>
        <span style="color:#888;font-size:10px">${api.avgLatency}ms</span>
        ${api.errors > 0 ? `<span class="nm-api-err">${api.errors} err</span>` : ''}
        <div class="nm-api-bar">
          <div class="nm-api-bar-fill" style="width:${(api.calls / maxCalls * 100).toFixed(0)}%"></div>
        </div>
      </div>
    `).join('');
  }

  _drawChart() {
    const canvas = this.element.querySelector('#nm-chart-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    const w = rect.width, h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.06)';
    ctx.lineWidth = 0.5;
    for (let y = 0; y < h; y += 15) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    if (this.bandwidthHistory.length < 2) return;

    const maxVal = Math.max(
      ...this.bandwidthHistory.map(b => b.in),
      ...this.bandwidthHistory.map(b => b.out),
      1
    );

    const drawArea = (data, key, color) => {
      ctx.fillStyle = color.replace('1)', '0.1)');
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;

      ctx.beginPath();
      data.forEach((d, i) => {
        const x = (i / (this.maxHistory - 1)) * w;
        const y = h - (d[key] / maxVal) * (h - 8);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Fill area
      ctx.lineTo((data.length - 1) / (this.maxHistory - 1) * w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    drawArea(this.bandwidthHistory, 'in', 'rgba(0, 255, 136, 1)');
    drawArea(this.bandwidthHistory, 'out', 'rgba(0, 200, 255, 1)');
  }

  _fmtBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1073741824).toFixed(2)} GB`;
  }
}

window.NexusNetworkMonitor = NexusNetworkMonitor;
