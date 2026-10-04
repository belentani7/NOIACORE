/**
 * NEXUS OS — Network Layer
 * HTTP client with retry/backoff, WebSocket manager, offline queue,
 * API key management, CORS proxy fallback, request caching, and bandwidth monitoring.
 * @module NexusNetwork
 * @version 1.0.0
 */

// ─── Constants ───────────────────────────────────────────────────────

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_QUEUE_SIZE = 200;
const BANDWIDTH_WINDOW_MS = 5000;
const DEFAULT_CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url='
];

// ─── HTTP Client ────────────────────────────────────────────────────

/**
 * Full-featured HTTP client with retries, caching, and offline queue.
 */
class NexusHttpClient {
  /**
   * @param {Object} [options]
   * @param {string} [options.baseUrl] - Base URL for all requests
   * @param {Object} [options.headers] - Default headers
   * @param {number} [options.timeout] - Default timeout ms
   * @param {number} [options.retries] - Default retry count
   * @param {boolean} [options.cacheEnabled] - Enable response caching
   * @param {Function} [options.onRequest] - Request interceptor
   * @param {Function} [options.onResponse] - Response interceptor
   * @param {Function} [options.onError] - Error interceptor
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '';
    this.defaultHeaders = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.retries = options.retries ?? DEFAULT_RETRIES;
    this.cacheEnabled = options.cacheEnabled !== false;
    this._onRequest = options.onRequest || null;
    this._onResponse = options.onResponse || null;
    this._onError = options.onError || null;
    /** @type {Map<string, {data: *, timestamp: number, ttl: number}>} */
    this._cache = new Map();
    /** @type {Array<{request: Object, resolve: Function, reject: Function}>} */
    this._offlineQueue = [];
    /** @type {boolean} */
    this._isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    /** @type {number} */
    this._bytesDownloaded = 0;
    /** @type {number} */
    this._bytesUploaded = 0;
    /** @type {Array<{bytes: number, timestamp: number}>} */
    this._bandwidthSamples = [];

    this._bindOnlineEvents();
  }

  /** @private Listen for online/offline browser events */
  _bindOnlineEvents() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', () => {
      this._isOnline = true;
      this._flushOfflineQueue();
    });
    window.addEventListener('offline', () => {
      this._isOnline = false;
    });
  }

  /**
   * Perform an HTTP request.
   * @param {string} url - URL (relative to baseUrl or absolute)
   * @param {Object} [options]
   * @param {string} [options.method='GET']
   * @param {Object} [options.headers]
   * @param {*} [options.body]
   * @param {number} [options.timeout]
   * @param {number} [options.retries]
   * @param {boolean} [options.cache] - Override cache setting
   * @param {number} [options.cacheTtl] - Cache TTL in ms
   * @param {string} [options.corsProxy] - Custom CORS proxy URL prefix
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<{status: number, headers: Headers, data: *, ok: boolean}>}
   */
  async request(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    // Check cache for GET requests
    if (method === 'GET' && (options.cache ?? this.cacheEnabled)) {
      const cached = this._getCache(fullUrl);
      if (cached) return cached;
    }

    // If offline and GET, queue
    if (!this._isOnline && method === 'GET') {
      return this._queueOfflineRequest(fullUrl, options);
    }

    const headers = { ...this.defaultHeaders, ...(options.headers || {}) };
    const body = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined;

    if (body) {
      this._trackBandwidth(body.length, 'upload');
    }

    const controller = new AbortController();
    const timeout = options.timeout || this.timeout;
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const signal = options.signal
      ? options.signal
      : controller.signal;

    // Request interceptor
    const reqConfig = { url: fullUrl, method, headers, body, signal };
    if (this._onRequest) {
      try { await this._onRequest(reqConfig); } catch { /* interceptor error */ }
    }

    const maxRetries = options.retries ?? this.retries;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(reqConfig.url, {
          method,
          headers: reqConfig.headers,
          body,
          signal
        });

        clearTimeout(timeoutId);

        // Track bandwidth
        const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
        if (contentLength) this._trackBandwidth(contentLength, 'download');

        const data = await this._parseResponse(response);
        const result = {
          status: response.status,
          headers: response.headers,
          data,
          ok: response.ok
        };

        // Cache GET responses
        if (method === 'GET' && response.ok && (options.cache ?? this.cacheEnabled)) {
          this._setCache(fullUrl, result, options.cacheTtl || CACHE_TTL_MS);
        }

        // Response interceptor
        if (this._onResponse) {
          try { await this._onResponse(result); } catch { /* interceptor error */ }
        }

        if (!response.ok && attempt < maxRetries && this._isRetryable(response.status)) {
          await this._backoff(attempt);
          continue;
        }

        return result;
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err;

        if (err.name === 'AbortError') {
          throw new Error(`Request timeout: ${method} ${fullUrl} (${timeout}ms)`);
        }

        if (attempt < maxRetries) {
          await this._backoff(attempt);
          continue;
        }

        // Error interceptor
        if (this._onError) {
          try { await this._onError(err, reqConfig); } catch { /* interceptor error */ }
        }

        throw err;
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * Attempt to re-request through a CORS proxy.
   * @param {string} url
   * @param {Object} [options]
   * @param {string} [proxyUrl]
   * @returns {Promise<Object>}
   */
  async requestWithCorsProxy(url, options = {}, proxyUrl) {
    const proxies = proxyUrl ? [proxyUrl] : DEFAULT_CORS_PROXIES;
    for (const proxy of proxies) {
      try {
        const proxiedUrl = `${proxy}${encodeURIComponent(url)}`;
        return await this.request(proxiedUrl, { ...options, retries: 0 });
      } catch {
        continue;
      }
    }
    throw new Error(`All CORS proxies failed for: ${url}`);
  }

  // ─── Convenience Methods ─────────────────────────────────────────

  /** GET request */
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  /** POST request */
  async post(url, body, options = {}) {
    return this.request(url, { ...options, method: 'POST', body });
  }

  /** PUT request */
  async put(url, body, options = {}) {
    return this.request(url, { ...options, method: 'PUT', body });
  }

  /** PATCH request */
  async patch(url, body, options = {}) {
    return this.request(url, { ...options, method: 'PATCH', body });
  }

  /** DELETE request */
  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  /** HEAD request */
  async head(url, options = {}) {
    return this.request(url, { ...options, method: 'HEAD' });
  }

  // ─── Cache ───────────────────────────────────────────────────────

  /** @private */
  _getCache(url) {
    const entry = this._cache.get(url);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this._cache.delete(url);
      return null;
    }
    return entry.data;
  }

  /** @private */
  _setCache(url, data, ttl) {
    this._cache.set(url, { data, timestamp: Date.now(), ttl });
    // Evict oldest if cache too large
    if (this._cache.size > 500) {
      const oldest = this._cache.keys().next().value;
      this._cache.delete(oldest);
    }
  }

  /** Clear the response cache. */
  clearCache() {
    this._cache.clear();
  }

  // ─── Offline Queue ───────────────────────────────────────────────

  /** @private */
  _queueOfflineRequest(url, options) {
    if (this._offlineQueue.length >= MAX_QUEUE_SIZE) {
      return Promise.reject(new Error('Offline queue full'));
    }
    return new Promise((resolve, reject) => {
      this._offlineQueue.push({ request: { url, options }, resolve, reject });
    });
  }

  /** @private Flush queued requests */
  async _flushOfflineQueue() {
    const queue = this._offlineQueue.splice(0);
    for (const { request, resolve, reject } of queue) {
      try {
        const result = await this.request(request.url, request.options);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }
  }

  /** Get the current offline queue length. */
  get queueLength() {
    return this._offlineQueue.length;
  }

  /** Clear the offline queue. */
  clearQueue() {
    for (const { reject } of this._offlineQueue) {
      reject(new Error('Queue cleared'));
    }
    this._offlineQueue.length = 0;
  }

  // ─── Bandwidth Tracking ──────────────────────────────────────────

  /** @private */
  _trackBandwidth(bytes, direction) {
    const now = Date.now();
    this._bandwidthSamples.push({ bytes, direction, timestamp: now });
    if (direction === 'download') this._bytesDownloaded += bytes;
    else this._bytesUploaded += bytes;

    // Prune old samples
    const cutoff = now - BANDWIDTH_WINDOW_MS * 2;
    this._bandwidthSamples = this._bandwidthSamples.filter(s => s.timestamp > cutoff);
  }

  /**
   * Get bandwidth statistics.
   * @returns {{totalDownloaded: number, totalUploaded: number, currentRateDown: number, currentRateUp: number}}
   */
  getBandwidthStats() {
    const now = Date.now();
    const window = this._bandwidthSamples.filter(s => now - s.timestamp < BANDWIDTH_WINDOW_MS);
    const downBytes = window.filter(s => s.direction === 'download').reduce((a, s) => a + s.bytes, 0);
    const upBytes = window.filter(s => s.direction === 'upload').reduce((a, s) => a + s.bytes, 0);

    return {
      totalDownloaded: this._bytesDownloaded,
      totalUploaded: this._bytesUploaded,
      currentRateDown: Math.round(downBytes / (BANDWIDTH_WINDOW_MS / 1000)), // bytes/sec
      currentRateUp: Math.round(upBytes / (BANDWIDTH_WINDOW_MS / 1000))
    };
  }

  // ─── Internal ────────────────────────────────────────────────────

  /** @private Parse response body based on content type */
  async _parseResponse(response) {
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { return await response.json(); } catch { return await response.text(); }
    }
    if (ct.includes('text/')) return response.text();
    if (ct.includes('application/octet-stream') || ct.includes('image/') || ct.includes('audio/')) {
      return response.blob();
    }
    return response.text();
  }

  /** @private Check if status code is retryable */
  _isRetryable(status) {
    return [408, 425, 429, 500, 502, 503, 504].includes(status);
  }

  /** @private Exponential backoff with jitter */
  _backoff(attempt) {
    const delay = Math.min(BACKOFF_BASE_MS * Math.pow(2, attempt), BACKOFF_MAX_MS);
    const jitter = delay * (0.5 + Math.random() * 0.5);
    return new Promise(r => setTimeout(r, jitter));
  }

  /**
   * Check online status.
   * @returns {boolean}
   */
  isOnline() {
    return this._isOnline;
  }
}

// ─── WebSocket Manager ──────────────────────────────────────────────

/**
 * Manages WebSocket connections with auto-reconnect, heartbeat, and message routing.
 */
class NexusWebSocketManager {
  /**
   * @param {Object} [options]
   * @param {number} [options.reconnectDelay=3000]
   * @param {number} [options.maxReconnectAttempts=10]
   * @param {number} [options.heartbeatInterval=30000]
   * @param {boolean} [options.debug=false]
   */
  constructor(options = {}) {
    this.reconnectDelay = options.reconnectDelay || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.debug = options.debug || false;
    /** @type {Map<string, NexusWebSocket>} */
    this._connections = new Map();
  }

  /**
   * Create and connect a WebSocket.
   * @param {string} id - Connection identifier
   * @param {string} url - WebSocket URL
   * @param {Object} [options]
   * @param {string|string[]} [options.protocols]
   * @param {Function} [options.onMessage]
   * @param {Function} [options.onOpen]
   * @param {Function} [options.onClose]
   * @param {Function} [options.onError]
   * @param {boolean} [options.autoReconnect=true]
   * @param {string|Function} [options.heartbeat] - Heartbeat message
   * @returns {NexusWebSocket}
   */
  connect(id, url, options = {}) {
    if (this._connections.has(id)) {
      this._connections.get(id).close();
    }
    const ws = new NexusWebSocket(url, {
      ...options,
      reconnectDelay: this.reconnectDelay,
      maxReconnectAttempts: this.maxReconnectAttempts,
      heartbeatInterval: this.heartbeatInterval,
      debug: this.debug
    });
    this._connections.set(id, ws);
    ws.connect();
    return ws;
  }

  /**
   * Get an active connection.
   * @param {string} id
   * @returns {NexusWebSocket|undefined}
   */
  get(id) {
    return this._connections.get(id);
  }

  /**
   * Close and remove a connection.
   * @param {string} id
   */
  disconnect(id) {
    const ws = this._connections.get(id);
    if (ws) {
      ws.close();
      this._connections.delete(id);
    }
  }

  /**
   * Close all connections.
   */
  disconnectAll() {
    for (const [id, ws] of this._connections) {
      ws.close();
    }
    this._connections.clear();
  }

  /**
   * List all connections and their states.
   * @returns {Array<{id: string, url: string, state: string, reconnects: number}>}
   */
  listConnections() {
    return Array.from(this._connections.entries()).map(([id, ws]) => ({
      id,
      url: ws.url,
      state: ws.state,
      reconnects: ws._reconnectCount
    }));
  }
}

/**
 * Single WebSocket connection with auto-reconnect and heartbeat.
 */
class NexusWebSocket {
  /**
   * @param {string} url
   * @param {Object} options
   */
  constructor(url, options = {}) {
    this.url = url;
    this._protocols = options.protocols || undefined;
    this._onMessage = options.onMessage || null;
    this._onOpen = options.onOpen || null;
    this._onClose = options.onClose || null;
    this._onError = options.onError || null;
    this._autoReconnect = options.autoReconnect !== false;
    this._heartbeatMsg = options.heartbeat || null;
    this._reconnectDelay = options.reconnectDelay || 3000;
    this._maxReconnects = options.maxReconnectAttempts || 10;
    this._heartbeatInterval = options.heartbeatInterval || 30000;
    this._debug = options.debug || false;

    /** @type {WebSocket|null} */
    this._ws = null;
    /** @type {number} */
    this._reconnectCount = 0;
    /** @type {number|null} */
    this._reconnectTimer = null;
    /** @type {number|null} */
    this._heartbeatTimer = null;
    /** @type {boolean} */
    this._intentionalClose = false;
    /** @type {Array<*>} */
    this._sendQueue = [];
    /** @type {Array<Function>} */
    this._messageListeners = [];
  }

  /** Current connection state */
  get state() {
    if (!this._ws) return 'disconnected';
    const states = ['connecting', 'open', 'closing', 'closed'];
    return states[this._ws.readyState] || 'unknown';
  }

  /** Connect the WebSocket */
  connect() {
    if (this._ws && this._ws.readyState <= 1) return;
    this._intentionalClose = false;

    try {
      this._ws = new WebSocket(this.url, this._protocols);
    } catch (e) {
      if (this._debug) console.error('[WS] Connect error:', e);
      this._scheduleReconnect();
      return;
    }

    this._ws.onopen = (e) => {
      this._reconnectCount = 0;
      this._startHeartbeat();
      // Flush send queue
      while (this._sendQueue.length > 0) {
        this._ws.send(this._sendQueue.shift());
      }
      if (this._onOpen) this._onOpen(e);
    };

    this._ws.onmessage = (e) => {
      let data = e.data;
      try { data = JSON.parse(data); } catch { /* keep as string */ }
      for (const listener of this._messageListeners) {
        try { listener(data, e); } catch (err) { console.error('[WS] Listener error:', err); }
      }
      if (this._onMessage) this._onMessage(data, e);
    };

    this._ws.onclose = (e) => {
      this._stopHeartbeat();
      if (this._onClose) this._onClose(e);
      if (!this._intentionalClose && this._autoReconnect) {
        this._scheduleReconnect();
      }
    };

    this._ws.onerror = (e) => {
      if (this._onError) this._onError(e);
    };
  }

  /**
   * Send a message. Queues if not connected.
   * @param {*} data
   */
  send(data) {
    const msg = typeof data === 'string' ? data : JSON.stringify(data);
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(msg);
    } else {
      this._sendQueue.push(msg);
    }
  }

  /**
   * Add a message listener.
   * @param {Function} listener
   * @returns {Function} Unsubscribe function
   */
  onMessage(listener) {
    this._messageListeners.push(listener);
    return () => {
      const idx = this._messageListeners.indexOf(listener);
      if (idx !== -1) this._messageListeners.splice(idx, 1);
    };
  }

  /** Close the connection (no auto-reconnect) */
  close() {
    this._intentionalClose = true;
    this._stopHeartbeat();
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
    this._sendQueue.length = 0;
  }

  /** @private */
  _scheduleReconnect() {
    if (this._reconnectCount >= this._maxReconnects) {
      if (this._debug) console.warn('[WS] Max reconnect attempts reached');
      return;
    }
    const delay = this._reconnectDelay * Math.pow(1.5, this._reconnectCount);
    this._reconnectCount++;
    if (this._debug) console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this._reconnectCount})`);
    this._reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  /** @private */
  _startHeartbeat() {
    if (!this._heartbeatMsg) return;
    this._heartbeatTimer = setInterval(() => {
      const msg = typeof this._heartbeatMsg === 'function' ? this._heartbeatMsg() : this._heartbeatMsg;
      this.send(msg);
    }, this._heartbeatInterval);
  }

  /** @private */
  _stopHeartbeat() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
  }
}

// ─── API Key Manager ────────────────────────────────────────────────

/**
 * Secure API key storage for user-provided credentials.
 */
class NexusAPIKeyManager {
  constructor() {
    /** @type {Map<string, {key: string, name: string, added: number, lastUsed: number|null}>} */
    this._keys = new Map();
    this._storageKey = 'nexus:apikeys';
    this._load();
  }

  /** @private Load keys from localStorage */
  _load() {
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        for (const [id, entry] of Object.entries(data)) {
          this._keys.set(id, entry);
        }
      }
    } catch { /* ignore */ }
  }

  /** @private Persist keys */
  _save() {
    const data = {};
    for (const [id, entry] of this._keys) {
      data[id] = entry;
    }
    localStorage.setItem(this._storageKey, JSON.stringify(data));
  }

  /**
   * Store an API key.
   * @param {string} id - Service identifier (e.g., 'openai', 'stability')
   * @param {string} key - The API key
   * @param {string} [name] - Human-readable name
   */
  set(id, key, name) {
    this._keys.set(id, {
      key,
      name: name || id,
      added: Date.now(),
      lastUsed: null
    });
    this._save();
  }

  /**
   * Retrieve an API key.
   * @param {string} id
   * @returns {string|null}
   */
  get(id) {
    const entry = this._keys.get(id);
    if (!entry) return null;
    entry.lastUsed = Date.now();
    this._save();
    return entry.key;
  }

  /**
   * Remove an API key.
   * @param {string} id
   * @returns {boolean}
   */
  remove(id) {
    const result = this._keys.delete(id);
    if (result) this._save();
    return result;
  }

  /**
   * List all stored key ids (never exposes actual keys in listing).
   * @returns {Array<{id: string, name: string, added: number, lastUsed: number|null}>}
   */
  list() {
    return Array.from(this._keys.entries()).map(([id, entry]) => ({
      id,
      name: entry.name,
      added: entry.added,
      lastUsed: entry.lastUsed
    }));
  }

  /**
   * Check if a key exists.
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return this._keys.has(id);
  }

  /**
   * Clear all stored keys.
   */
  clearAll() {
    this._keys.clear();
    this._save();
  }
}

// ─── Main Network Class ─────────────────────────────────────────────

/**
 * Unified network layer for NEXUS OS.
 * Combines HTTP client, WebSocket manager, API key storage, and bandwidth monitoring.
 */
class NexusNetwork {
  /**
   * @param {Object} [options]
   * @param {string} [options.baseUrl] - Base URL for HTTP client
   * @param {Object} [options.http] - Options passed to NexusHttpClient
   * @param {Object} [options.ws] - Options passed to NexusWebSocketManager
   * @param {string} [options.corsProxy] - Default CORS proxy
   */
  constructor(options = {}) {
    /** @type {NexusHttpClient} */
    this.http = new NexusHttpClient({
      baseUrl: options.baseUrl || '',
      ...options.http
    });
    /** @type {NexusWebSocketManager} */
    this.ws = new NexusWebSocketManager(options.ws || {});
    /** @type {NexusAPIKeyManager} */
    this.apiKeys = new NexusAPIKeyManager();
    /** @type {string|null} */
    this.defaultCorsProxy = options.corsProxy || null;
  }

  /**
   * Fetch with automatic CORS proxy fallback.
   * @param {string} url
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async fetch(url, options = {}) {
    try {
      return await this.http.request(url, options);
    } catch (err) {
      // If it looks like a CORS error, try proxy
      if (err.message && (err.message.includes('CORS') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch'))) {
        return this.http.requestWithCorsProxy(url, options, this.defaultCorsProxy);
      }
      throw err;
    }
  }

  /**
   * Check connectivity status.
   * @returns {{online: boolean, queueLength: number, bandwidth: Object}}
   */
  getStatus() {
    return {
      online: this.http.isOnline(),
      queueLength: this.http.queueLength,
      bandwidth: this.http.getBandwidthStats(),
      connections: this.ws.listConnections()
    };
  }

  /**
   * Inject an API key into all matching request headers.
   * Call before making requests to services that need auth.
   * @param {string} serviceId
   * @param {string} headerName - e.g., 'Authorization', 'x-api-key'
   * @param {Function} [format] - Transform key (e.g., k => `Bearer ${k}`)
   * @returns {boolean} Whether the key was found and injected
   */
  injectAPIKey(serviceId, headerName = 'Authorization', format) {
    const key = this.apiKeys.get(serviceId);
    if (!key) return false;
    this.http.defaultHeaders[headerName] = format ? format(key) : key;
    return true;
  }

  /**
   * Remove an injected header.
   * @param {string} headerName
   */
  clearInjectedHeader(headerName) {
    delete this.http.defaultHeaders[headerName];
  }

  /**
   * Destroy all connections and clear state.
   */
  destroy() {
    this.ws.disconnectAll();
    this.http.clearCache();
    this.http.clearQueue();
  }
}

export default NexusNetwork;
export { NexusNetwork, NexusHttpClient, NexusWebSocketManager, NexusWebSocket, NexusAPIKeyManager };
