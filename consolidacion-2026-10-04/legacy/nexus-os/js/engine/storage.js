/**
 * NEXUS OS — Persistent Storage Engine
 * Namespaced localStorage, IndexedDB binary store, encryption, compression,
 * auto-save, import/export, and migration system.
 * @module NexusStorage
 * @version 1.0.0
 */

// ─── Constants ───────────────────────────────────────────────────────

const STORAGE_PREFIX = 'nexus:';
const META_KEY = STORAGE_PREFIX + '__meta__';
const DEFAULT_QUOTA = 10 * 1024 * 1024; // 10MB soft limit
const AUTOSAVE_DEBOUNCE = 500;
const COMPRESSION_THRESHOLD = 1024; // Compress payloads > 1KB
const DB_NAME = 'NexusOS_Storage';
const DB_VERSION = 1;
const BINARY_STORE = 'binaries';
const CACHE_STORE = 'cache';

// ─── Compression Helpers (LZ-string style, self-contained) ──────────

/**
 * Minimal LZW-based string compression.
 * Not as fast as lz-string but zero-dependency.
 */
const Compress = {
  /**
   * Compress a string to a Base64-encoded compressed string.
   * @param {string} input
   * @returns {string}
   */
  compress(input) {
    if (!input) return '';
    const dict = new Map();
    const data = String(input);
    let dictSize = 256;
    for (let i = 0; i < 256; i++) dict.set(String.fromCharCode(i), i);

    const result = [];
    let w = '';
    for (let i = 0; i < data.length; i++) {
      const c = data[i];
      const wc = w + c;
      if (dict.has(wc)) {
        w = wc;
      } else {
        result.push(dict.get(w));
        dict.set(wc, dictSize++);
        w = c;
      }
    }
    if (w) result.push(dict.get(w));

    // Pack into Uint16 array then Base64
    const buf = new Uint16Array(result.length);
    for (let i = 0; i < result.length; i++) buf[i] = result[i];
    const bytes = new Uint8Array(buf.buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  },

  /**
   * Decompress a Base64-encoded compressed string.
   * @param {string} compressed
   * @returns {string}
   */
  decompress(compressed) {
    if (!compressed) return '';
    const binary = atob(compressed);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const codes = new Uint16Array(bytes.buffer);

    const dict = new Map();
    let dictSize = 256;
    for (let i = 0; i < 256; i++) dict.set(i, String.fromCharCode(i));

    let w = dict.get(codes[0]);
    const result = [w];
    for (let i = 1; i < codes.length; i++) {
      const k = codes[i];
      let entry;
      if (dict.has(k)) {
        entry = dict.get(k);
      } else if (k === dictSize) {
        entry = w + w[0];
      } else {
        throw new Error('Invalid compressed data');
      }
      result.push(entry);
      dict.set(dictSize++, w + entry[0]);
      w = entry;
    }
    return result.join('');
  }
};

// ─── Encryption Helper (Web Crypto API) ─────────────────────────────

/**
 * AES-GCM encryption using SubtleCrypto.
 */
const Crypto = {
  /**
   * Derive an AES-GCM key from a passphrase.
   * @param {string} passphrase
   * @param {Uint8Array} salt
   * @returns {Promise<CryptoKey>}
   */
  async deriveKey(passphrase, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await globalThis.crypto.subtle.importKey(
      'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
    );
    return globalThis.crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Encrypt a string with AES-GCM.
   * @param {string} plaintext
   * @param {string} passphrase
   * @returns {Promise<{ciphertext: string, iv: string, salt: string}>}
   */
  async encrypt(plaintext, passphrase) {
    const enc = new TextEncoder();
    const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(passphrase, salt);
    const encrypted = await globalThis.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plaintext)
    );
    const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
    return {
      ciphertext: toB64(encrypted),
      iv: toB64(iv),
      salt: toB64(salt)
    };
  },

  /**
   * Decrypt an AES-GCM payload.
   * @param {{ciphertext: string, iv: string, salt: string}} payload
   * @param {string} passphrase
   * @returns {Promise<string>}
   */
  async decrypt(payload, passphrase) {
    const fromB64 = (s) => new Uint8Array(atob(s).split('').map(c => c.charCodeAt(0)));
    const salt = fromB64(payload.salt);
    const iv = fromB64(payload.iv);
    const ciphertext = fromB64(payload.ciphertext);
    const key = await this.deriveKey(passphrase, salt);
    const decrypted = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  }
};

// ─── Main Storage Class ─────────────────────────────────────────────

/**
 * Persistent storage system for NEXUS OS.
 * Provides namespaced localStorage, IndexedDB for binary data,
 * AES-GCM encryption, LZW compression, auto-save, and workspace import/export.
 */
class NexusStorage {
  /**
   * @param {Object} [options]
   * @param {string} [options.prefix='nexus:'] - Global key prefix
   * @param {number} [options.quota=10485760] - Soft quota in bytes
   * @param {boolean} [options.autoCompress=true] - Compress large payloads
   * @param {boolean} [options.debug=false]
   */
  constructor(options = {}) {
    this._prefix = options.prefix || STORAGE_PREFIX;
    this._quota = options.quota || DEFAULT_QUOTA;
    this._autoCompress = options.autoCompress !== false;
    this._debug = options.debug || false;
    /** @type {Map<string, Map<string, *>>} In-memory cache per namespace */
    this._cache = new Map();
    /** @type {Map<string, {timer: number, data: *, key: string}>} Pending auto-saves */
    this._pendingSaves = new Map();
    /** @type {IDBDatabase|null} */
    this._db = null;
    /** @type {string|null} */
    this._encryptionKey = null;
    /** @type {Map<string, number>} Migration version registry */
    this._migrations = new Map();
    /** @type {Map<string, number>} Per-namespace usage tracking */
    this._usage = new Map();
  }

  // ─── Initialization ──────────────────────────────────────────────

  /**
   * Initialize storage — load meta, open IndexedDB.
   * @returns {Promise<NexusStorage>}
   */
  async init() {
    this._loadMeta();
    await this._openDB();
    this._calculateUsage();
    return this;
  }

  /** @private Load metadata from localStorage */
  _loadMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (raw) this._meta = JSON.parse(raw);
    } catch { /* ignore */ }
    if (!this._meta) {
      this._meta = { version: 1, namespaces: {}, created: Date.now() };
    }
  }

  /** @private Save metadata */
  _saveMeta() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(this._meta));
    } catch (e) {
      console.error('[Storage] Failed to save meta:', e);
    }
  }

  /** @private Open IndexedDB */
  async _openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(BINARY_STORE)) {
          db.createObjectStore(BINARY_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = (e) => {
        this._db = e.target.result;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /** @private Calculate approximate usage per namespace */
  _calculateUsage() {
    this._usage.clear();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key.startsWith(this._prefix)) continue;
      const ns = key.split(':')[1] || '__global__';
      const val = localStorage.getItem(key) || '';
      const size = (key.length + val.length) * 2; // UTF-16
      this._usage.set(ns, (this._usage.get(ns) || 0) + size);
    }
  }

  // ─── Namespace Management ────────────────────────────────────────

  /**
   * Get a scoped storage interface for a namespace (app).
   * @param {string} namespace - App/module identifier
   * @returns {Object} Scoped get/set/remove/etc.
   */
  namespace(namespace) {
    const self = this;
    const prefix = `${this._prefix}${namespace}:`;

    return {
      /**
       * Get a value.
       * @param {string} key
       * @param {*} [defaultValue]
       * @returns {*}
       */
      get(key, defaultValue) {
        return self.get(key, defaultValue, namespace);
      },
      /**
       * Set a value.
       * @param {string} key
       * @param {*} value
       * @param {Object} [opts]
       */
      set(key, value, opts) {
        return self.set(key, value, namespace, opts);
      },
      /**
       * Remove a value.
       * @param {string} key
       */
      remove(key) {
        return self.remove(key, namespace);
      },
      /**
       * Check if key exists.
       * @param {string} key
       * @returns {boolean}
       */
      has(key) {
        return self.has(key, namespace);
      },
      /**
       * Get all keys in namespace.
       * @returns {string[]}
       */
      keys() {
        return self.keys(namespace);
      },
      /**
       * Clear entire namespace.
       */
      clear() {
        return self.clearNamespace(namespace);
      },
      /**
       * Get usage for this namespace.
       * @returns {number}
       */
      usage() {
        return self._usage.get(namespace) || 0;
      },
      /**
       * Export namespace as object.
       * @returns {Object}
       */
      export() {
        return self.exportNamespace(namespace);
      },
      /**
       * Import data into namespace.
       * @param {Object} data
       */
      import(data) {
        return self.importNamespace(namespace, data);
      },
      /** The namespace string */
      _ns: namespace,
      /** Access to parent */
      _storage: self
    };
  }

  // ─── Core CRUD ───────────────────────────────────────────────────

  /**
   * Get a value from storage.
   * @param {string} key
   * @param {*} [defaultValue]
   * @param {string} [namespace]
   * @returns {*}
   */
  get(key, defaultValue, namespace) {
    const fullKey = this._buildKey(key, namespace);
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw === null) return defaultValue;
      return this._deserialize(raw);
    } catch (e) {
      if (this._debug) console.warn(`[Storage] get("${key}") error:`, e);
      return defaultValue;
    }
  }

  /**
   * Set a value in storage.
   * @param {string} key
   * @param {*} value
   * @param {string} [namespace]
   * @param {Object} [opts]
   * @param {boolean} [opts.compress] - Force compression
   * @param {boolean} [opts.encrypt] - Encrypt with current key
   * @param {number} [opts.ttl] - Time-to-live in ms
   * @returns {boolean} Success
   */
  set(key, value, namespace, opts = {}) {
    const fullKey = this._buildKey(key, namespace);
    try {
      let serialized = this._serialize(value);

      // Compression
      const shouldCompress = opts.compress || (this._autoCompress && serialized.length > COMPRESSION_THRESHOLD);
      if (shouldCompress) {
        serialized = JSON.stringify({ __compressed: true, data: Compress.compress(serialized) });
      }

      // Encryption (use setEncrypted() for async encryption — this path logs a warning)
      if (opts.encrypt && this._encryptionKey) {
        console.warn('[Storage] Synchronous set() cannot encrypt. Use setEncrypted() instead.');
      }

      // TTL metadata
      if (opts.ttl) {
        const meta = { expires: Date.now() + opts.ttl };
        serialized = JSON.stringify({ __ttl: true, meta, data: serialized });
      }

      localStorage.setItem(fullKey, serialized);
      this._updateUsage(namespace || '__global__', fullKey, serialized);
      this._trackNamespaceKey(namespace, key);

      if (this._debug) console.log(`[Storage] set("${key}" in ${namespace || 'global'}, ${serialized.length}b)`);
      return true;
    } catch (e) {
      console.error(`[Storage] set("${key}") error:`, e);
      return false;
    }
  }

  /**
   * Remove a key.
   * @param {string} key
   * @param {string} [namespace]
   * @returns {boolean}
   */
  remove(key, namespace) {
    const fullKey = this._buildKey(key, namespace);
    try {
      localStorage.removeItem(fullKey);
      this._calculateUsage();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a key exists.
   * @param {string} key
   * @param {string} [namespace]
   * @returns {boolean}
   */
  has(key, namespace) {
    const fullKey = this._buildKey(key, namespace);
    return localStorage.getItem(fullKey) !== null;
  }

  /**
   * List all keys in a namespace.
   * @param {string} [namespace]
   * @returns {string[]}
   */
  keys(namespace) {
    const prefix = namespace ? `${this._prefix}${namespace}:` : this._prefix;
    const result = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(prefix) && key !== META_KEY) {
        result.push(key.slice(prefix.length));
      }
    }
    return result;
  }

  // ─── Auto-Save System ────────────────────────────────────────────

  /**
   * Queue a value for debounced auto-save.
   * @param {string} key
   * @param {*} value
   * @param {string} [namespace]
   * @param {number} [debounceMs]
   */
  autoSave(key, value, namespace, debounceMs = AUTOSAVE_DEBOUNCE) {
    const fullKey = this._buildKey(key, namespace);
    const existing = this._pendingSaves.get(fullKey);
    if (existing) clearTimeout(existing.timer);

    const timer = setTimeout(() => {
      this.set(key, value, namespace);
      this._pendingSaves.delete(fullKey);
    }, debounceMs);

    this._pendingSaves.set(fullKey, { timer, data: value, key: fullKey });
  }

  /**
   * Flush all pending auto-saves immediately.
   */
  flushAutoSaves() {
    for (const [fullKey, entry] of this._pendingSaves) {
      clearTimeout(entry.timer);
      // Parse namespace back from fullKey
      const parts = fullKey.slice(this._prefix.length).split(':');
      const namespace = parts.length > 1 ? parts[0] : undefined;
      const key = parts.slice(1).join(':') || parts[0];
      this.set(key, entry.data, namespace);
    }
    this._pendingSaves.clear();
  }

  /**
   * Get number of pending auto-saves.
   * @returns {number}
   */
  get pendingCount() {
    return this._pendingSaves.size;
  }

  // ─── Namespace Operations ────────────────────────────────────────

  /**
   * Clear all keys in a namespace.
   * @param {string} namespace
   * @returns {number} Keys removed
   */
  clearNamespace(namespace) {
    const keys = this.keys(namespace);
    for (const key of keys) {
      this.remove(key, namespace);
    }
    // Clear meta tracking
    if (this._meta.namespaces[namespace]) {
      delete this._meta.namespaces[namespace];
      this._saveMeta();
    }
    return keys.length;
  }

  /**
   * Export a namespace as a plain object.
   * @param {string} namespace
   * @returns {Object}
   */
  exportNamespace(namespace) {
    const result = {};
    for (const key of this.keys(namespace)) {
      result[key] = this.get(key, undefined, namespace);
    }
    return result;
  }

  /**
   * Import a plain object into a namespace.
   * @param {string} namespace
   * @param {Object} data
   * @param {boolean} [merge=false] - If true, merge with existing; if false, clear first
   * @returns {number} Keys imported
   */
  importNamespace(namespace, data, merge = false) {
    if (!merge) this.clearNamespace(namespace);
    let count = 0;
    for (const [key, value] of Object.entries(data)) {
      if (this.set(key, value, namespace)) count++;
    }
    return count;
  }

  // ─── Full Workspace Export/Import ────────────────────────────────

  /**
   * Export the entire workspace (all nexus: keys) as a JSON string.
   * @returns {string}
   */
  exportWorkspace() {
    const workspace = {
      _nexusExport: true,
      version: 1,
      timestamp: Date.now(),
      namespaces: {}
    };

    // Collect all namespaces
    const nsSet = new Set();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this._prefix) && key !== META_KEY) {
        const parts = key.slice(this._prefix.length).split(':');
        if (parts.length > 1) nsSet.add(parts[0]);
      }
    }

    for (const ns of nsSet) {
      workspace.namespaces[ns] = this.exportNamespace(ns);
    }

    return JSON.stringify(workspace, null, 2);
  }

  /**
   * Import a workspace from a JSON string.
   * @param {string} json
   * @param {boolean} [merge=false]
   * @returns {{imported: number, namespaces: string[]}}
   */
  importWorkspace(json, merge = false) {
    const workspace = typeof json === 'string' ? JSON.parse(json) : json;
    if (!workspace._nexusExport) throw new Error('Invalid NEXUS workspace export');

    let total = 0;
    const namespaces = Object.keys(workspace.namespaces);
    for (const ns of namespaces) {
      total += this.importNamespace(ns, workspace.namespaces[ns], merge);
    }

    return { imported: total, namespaces };
  }

  // ─── IndexedDB Binary Store ──────────────────────────────────────

  /**
   * Store a binary blob in IndexedDB.
   * @param {string} id - Unique identifier
   * @param {Blob|ArrayBuffer} data
   * @param {Object} [metadata]
   * @returns {Promise<void>}
   */
  async putBinary(id, data, metadata = {}) {
    if (!this._db) throw new Error('Storage not initialized');
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(BINARY_STORE, 'readwrite');
      const store = tx.objectStore(BINARY_STORE);
      store.put({ id, data, metadata, stored: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Retrieve a binary blob from IndexedDB.
   * @param {string} id
   * @returns {Promise<{data: Blob|ArrayBuffer, metadata: Object}|null>}
   */
  async getBinary(id) {
    if (!this._db) throw new Error('Storage not initialized');
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(BINARY_STORE, 'readonly');
      const store = tx.objectStore(BINARY_STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Remove a binary entry from IndexedDB.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async removeBinary(id) {
    if (!this._db) throw new Error('Storage not initialized');
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(BINARY_STORE, 'readwrite');
      const store = tx.objectStore(BINARY_STORE);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * List all binary entry ids.
   * @returns {Promise<string[]>}
   */
  async listBinaries() {
    if (!this._db) throw new Error('Storage not initialized');
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(BINARY_STORE, 'readonly');
      const store = tx.objectStore(BINARY_STORE);
      const req = store.getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  // ─── Cache Store (IndexedDB) ─────────────────────────────────────

  /**
   * Cache data in IndexedDB with optional TTL.
   * @param {string} key
   * @param {*} data
   * @param {number} [ttlMs] - Time-to-live in milliseconds
   * @returns {Promise<void>}
   */
  async cachePut(key, data, ttlMs) {
    if (!this._db) throw new Error('Storage not initialized');
    const entry = {
      key,
      data,
      stored: Date.now(),
      expires: ttlMs ? Date.now() + ttlMs : null
    };
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(CACHE_STORE, 'readwrite');
      const store = tx.objectStore(CACHE_STORE);
      store.put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Get cached data, returning null if expired.
   * @param {string} key
   * @returns {Promise<*>}
   */
  async cacheGet(key) {
    if (!this._db) throw new Error('Storage not initialized');
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(CACHE_STORE, 'readonly');
      const store = tx.objectStore(CACHE_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        const entry = req.result;
        if (!entry) return resolve(null);
        if (entry.expires && Date.now() > entry.expires) {
          // Expired — clean up
          const delTx = this._db.transaction(CACHE_STORE, 'readwrite');
          delTx.objectStore(CACHE_STORE).delete(key);
          return resolve(null);
        }
        resolve(entry.data);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // ─── Encryption ──────────────────────────────────────────────────

  /**
   * Set the encryption passphrase for encrypted storage operations.
   * @param {string} passphrase
   */
  setEncryptionKey(passphrase) {
    this._encryptionKey = passphrase;
  }

  /**
   * Store an encrypted value.
   * @param {string} key
   * @param {*} value
   * @param {string} [namespace]
   * @param {string} [passphrase] - Override encryption key
   * @returns {Promise<boolean>}
   */
  async setEncrypted(key, value, namespace, passphrase) {
    const pass = passphrase || this._encryptionKey;
    if (!pass) throw new Error('No encryption key set');

    const fullKey = this._buildKey(key, namespace);
    const plaintext = this._serialize(value);
    const encrypted = await Crypto.encrypt(plaintext, pass);
    const payload = JSON.stringify({ __encrypted: true, ...encrypted });

    try {
      localStorage.setItem(fullKey, payload);
      this._trackNamespaceKey(namespace, key);
      return true;
    } catch (e) {
      console.error('[Storage] setEncrypted error:', e);
      return false;
    }
  }

  /**
   * Retrieve and decrypt a value.
   * @param {string} key
   * @param {string} [namespace]
   * @param {string} [passphrase]
   * @param {*} [defaultValue]
   * @returns {Promise<*>}
   */
  async getEncrypted(key, namespace, passphrase, defaultValue) {
    const pass = passphrase || this._encryptionKey;
    if (!pass) throw new Error('No encryption key set');

    const fullKey = this._buildKey(key, namespace);
    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return defaultValue;
      const parsed = JSON.parse(raw);
      if (!parsed.__encrypted) return defaultValue;
      const decrypted = await Crypto.decrypt(parsed, pass);
      return this._deserialize(decrypted);
    } catch (e) {
      if (this._debug) console.warn('[Storage] getEncrypted error:', e);
      return defaultValue;
    }
  }

  // ─── Migrations ──────────────────────────────────────────────────

  /**
   * Register a migration function.
   * @param {number} version - Target version number
   * @param {Function} migrate - (storage) => void
   */
  registerMigration(version, migrate) {
    this._migrations.set(version, migrate);
  }

  /**
   * Run all pending migrations.
   * @returns {Promise<number>} Number of migrations applied
   */
  async runMigrations() {
    const currentVersion = this._meta.version || 1;
    const pending = Array.from(this._migrations.entries())
      .filter(([v]) => v > currentVersion)
      .sort((a, b) => a[0] - b[0]);

    let applied = 0;
    for (const [version, migrate] of pending) {
      try {
        await migrate(this);
        this._meta.version = version;
        this._saveMeta();
        applied++;
        if (this._debug) console.log(`[Storage] Migration v${version} applied`);
      } catch (e) {
        console.error(`[Storage] Migration v${version} failed:`, e);
        break;
      }
    }
    return applied;
  }

  // ─── Quota Management ────────────────────────────────────────────

  /**
   * Get total estimated storage usage.
   * @returns {{used: number, quota: number, percent: number, byNamespace: Object}}
   */
  getQuotaInfo() {
    this._calculateUsage();
    let used = 0;
    const byNamespace = {};
    for (const [ns, size] of this._usage) {
      used += size;
      byNamespace[ns] = size;
    }
    return {
      used,
      quota: this._quota,
      percent: Math.round((used / this._quota) * 100),
      byNamespace
    };
  }

  /**
   * Check if storage is near quota.
   * @param {number} [threshold=0.9]
   * @returns {boolean}
   */
  isNearQuota(threshold = 0.9) {
    const info = this.getQuotaInfo();
    return info.percent >= threshold * 100;
  }

  // ─── Internal Helpers ────────────────────────────────────────────

  /** @private Build full storage key */
  _buildKey(key, namespace) {
    return namespace ? `${this._prefix}${namespace}:${key}` : `${this._prefix}${key}`;
  }

  /** @private Serialize a value for storage */
  _serialize(value) {
    if (value === undefined) return '__undefined__';
    if (value === null) return '__null__';
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }

  /** @private Deserialize a stored value */
  _deserialize(raw) {
    if (raw === '__undefined__') return undefined;
    if (raw === '__null__') return null;

    // Check for wrapped payloads
    try {
      const parsed = JSON.parse(raw);

      // TTL check
      if (parsed && parsed.__ttl) {
        if (parsed.meta.expires && Date.now() > parsed.meta.expires) return undefined;
        return this._deserialize(parsed.data);
      }

      // Compressed
      if (parsed && parsed.__compressed) {
        return this._deserialize(Compress.decompress(parsed.data));
      }

      return parsed;
    } catch {
      return raw; // Plain string
    }
  }

  /** @private Update usage tracking */
  _updateUsage(namespace, key, serialized) {
    const size = (key.length + serialized.length) * 2;
    this._usage.set(namespace, (this._usage.get(namespace) || 0) + size);
  }

  /** @private Track keys per namespace in meta */
  _trackNamespaceKey(namespace, key) {
    if (!namespace) return;
    if (!this._meta.namespaces[namespace]) {
      this._meta.namespaces[namespace] = { keys: new Set(), created: Date.now() };
    }
    this._meta.namespaces[namespace].keys.add(key);
    // Debounce meta save
    if (this._metaSaveTimer) clearTimeout(this._metaSaveTimer);
    this._metaSaveTimer = setTimeout(() => this._saveMeta(), 1000);
  }

  // ─── Cleanup ─────────────────────────────────────────────────────

  /**
   * Purge all expired TTL entries across all namespaces.
   * @returns {number} Entries purged
   */
  purgeExpired() {
    let count = 0;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key.startsWith(this._prefix)) continue;
      try {
        const raw = localStorage.getItem(key);
        const parsed = JSON.parse(raw);
        if (parsed && parsed.__ttl && parsed.meta.expires && Date.now() > parsed.meta.expires) {
          localStorage.removeItem(key);
          count++;
        }
      } catch { /* not TTL-wrapped, skip */ }
    }
    if (count > 0) this._calculateUsage();
    return count;
  }

  /**
   * Destroy the storage engine.
   * Flushes auto-saves and closes IndexedDB.
   */
  destroy() {
    this.flushAutoSaves();
    if (this._metaSaveTimer) clearTimeout(this._metaSaveTimer);
    if (this._db) {
      this._db.close();
      this._db = null;
    }
    this._cache.clear();
    this._encryptionKey = null;
  }
}

export default NexusStorage;
export { NexusStorage, Compress, Crypto };
