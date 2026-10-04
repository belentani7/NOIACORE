/**
 * NEXUS OS — Global Event Bus
 * Inter-app communication, event history, module namespaces, and cross-process messaging.
 * @module NexusEventBus
 * @version 1.0.0
 */

/**
 * @typedef {Object} EventEntry
 * @property {string} event - Event name
 * @property {Array<*>} args - Arguments passed
 * @property {number} timestamp - Unix timestamp (ms)
 * @property {string|null} source - Originating module
 * @property {number} id - Monotonic event id
 */

/**
 * @typedef {Object} Listener
 * @property {Function} callback
 * @property {Object|null} context
 * @property {boolean} once
 * @property {number} priority - Higher fires first
 * @property {string} id - Unique listener id
 */

/** @type {number} Global monotonic counter */
let _eid = 0;
/** @type {number} Listener id counter */
let _lid = 0;

/** Generate a unique listener id */
const genListenerId = () => `lid_${++_lid}_${Date.now().toString(36)}`;

/**
 * Core event bus powering all NEXUS OS inter-module communication.
 * Supports namespaced events, priority listeners, wildcard subscriptions,
 * event replay from history, module lifecycle hooks, and cross-app messaging.
 */
class NexusEventBus {
  /**
   * @param {Object} [options]
   * @param {number} [options.historySize=100] - Max history entries
   * @param {boolean} [options.debug=false] - Log all events to console
   * @param {number} [options.maxListenersPerEvent=50] - Safety cap
   * @param {boolean} [options.enableWildcard=true] - Allow '*' subscriptions
   */
  constructor(options = {}) {
    /** @type {Map<string, Listener[]>} */
    this._listeners = new Map();
    /** @type {EventEntry[]} */
    this._history = [];
    /** @type {Map<string, {name: string, namespace: string, events: string[], registered: number}>} */
    this._modules = new Map();
    /** @type {Map<string, Function[]>} */
    this._waiting = new Map();
    /** @type {Set<Function>} */
    this._globalInterceptors = new Set();
    /** @type {Map<string, Function>} */
    this._moduleMiddleware = new Map();
    /** @type {Array<{from: string, to: string, event: string, timestamp: number}>} */
    this._messageLog = [];

    /** @type {number} */
    this.historySize = options.historySize ?? 100;
    /** @type {boolean} */
    this.debug = options.debug ?? false;
    /** @type {number} */
    this.maxListenersPerEvent = options.maxListenersPerEvent ?? 50;
    /** @type {boolean} */
    this.enableWildcard = options.enableWildcard ?? true;
    /** @type {number} */
    this._emitDepth = 0;
    /** @type {number} */
    this._maxEmitDepth = 10;
    /** @type {boolean} */
    this._destroyed = false;
    /** @type {Set<string>} */
    this._suppressedEvents = new Set();
    /** @type {Map<string, number>} */
    this._eventStats = new Map();
  }

  // ─── Core Pub/Sub ────────────────────────────────────────────────

  /**
   * Subscribe to an event.
   * @param {string} event - Event name or pattern (supports '*' wildcard at end)
   * @param {Function} callback - Handler function
   * @param {Object} [options]
   * @param {Object} [options.context] - `this` binding for callback
   * @param {number} [options.priority=0] - Higher priority fires first
   * @param {boolean} [options.once=false] - Auto-remove after first call
   * @returns {string} Listener id (use to unsubscribe)
   */
  on(event, callback, options = {}) {
    if (this._destroyed) throw new Error('EventBus destroyed');
    if (typeof callback !== 'function') throw new TypeError('callback must be a function');
    if (typeof event !== 'string' || !event) throw new TypeError('event must be a non-empty string');

    const id = genListenerId();
    const listener = {
      id,
      callback,
      context: options.context || null,
      once: options.once || false,
      priority: options.priority || 0
    };

    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    const arr = this._listeners.get(event);
    if (arr.length >= this.maxListenersPerEvent) {
      console.warn(`[EventBus] Max listeners (${this.maxListenersPerEvent}) reached for "${event}"`);
    }
    arr.push(listener);
    // Sort by priority descending
    arr.sort((a, b) => b.priority - a.priority);

    if (this.debug) {
      console.log(`[EventBus] on("${event}", priority=${listener.priority}, once=${listener.once}) → ${id}`);
    }
    return id;
  }

  /**
   * Subscribe to an event, auto-remove after first invocation.
   * @param {string} event
   * @param {Function} callback
   * @param {Object} [options]
   * @returns {string} Listener id
   */
  once(event, callback, options = {}) {
    return this.on(event, callback, { ...options, once: true });
  }

  /**
   * Unsubscribe a listener by id or by event+callback match.
   * @param {string} eventOrId - Event name or listener id
   * @param {Function} [callback] - Required if eventOrId is an event name
   * @returns {boolean} Whether a listener was removed
   */
  off(eventOrId, callback) {
    if (this._destroyed) return false;

    // If it's a listener id, search all events
    if (!callback) {
      for (const [event, arr] of this._listeners) {
        const idx = arr.findIndex(l => l.id === eventOrId);
        if (idx !== -1) {
          arr.splice(idx, 1);
          if (arr.length === 0) this._listeners.delete(event);
          return true;
        }
      }
      return false;
    }

    // Match by event + callback reference
    if (!this._listeners.has(eventOrId)) return false;
    const arr = this._listeners.get(eventOrId);
    const idx = arr.findIndex(l => l.callback === callback);
    if (idx === -1) return false;
    arr.splice(idx, 1);
    if (arr.length === 0) this._listeners.delete(eventOrId);
    return true;
  }

  /**
   * Remove all listeners for an event, or all listeners entirely.
   * @param {string} [event] - If omitted, removes everything
   * @returns {number} Number of listeners removed
   */
  offAll(event) {
    if (this._destroyed) return 0;
    if (!event) {
      let count = 0;
      for (const arr of this._listeners.values()) count += arr.length;
      this._listeners.clear();
      return count;
    }
    if (!this._listeners.has(event)) return 0;
    const count = this._listeners.get(event).length;
    this._listeners.delete(event);
    return count;
  }

  /**
   * Emit an event to all matching listeners (exact match + wildcard subscribers).
   * @param {string} event - Event name
   * @param {...*} args - Arguments forwarded to listeners
   * @returns {number} Number of listeners invoked
   */
  emit(event, ...args) {
    if (this._destroyed || this._suppressedEvents.has(event)) return 0;
    if (this._emitDepth >= this._maxEmitDepth) {
      console.error(`[EventBus] Max emit depth exceeded for "${event}" — possible infinite loop`);
      return 0;
    }

    // Record stats
    this._eventStats.set(event, (this._eventStats.get(event) || 0) + 1);

    // Push to history
    const entry = {
      event,
      args: args.length <= 3 ? args.slice() : args.slice(0, 3),
      timestamp: Date.now(),
      source: this._currentModule || null,
      id: ++_eid
    };
    this._history.push(entry);
    if (this._history.length > this.historySize) {
      this._history.shift();
    }

    // Run global interceptors
    let intercepted = false;
    for (const interceptor of this._globalInterceptors) {
      try {
        if (interceptor(event, args) === false) intercepted = true;
      } catch (e) {
        console.error('[EventBus] Interceptor error:', e);
      }
    }
    if (intercepted) return 0;

    if (this.debug) {
      console.log(`[EventBus] emit("${event}", ${args.length} args)`);
    }

    this._emitDepth++;
    let count = 0;

    // Collect matching listeners: exact + wildcard patterns
    const matched = this._collectListeners(event);
    const toRemove = [];

    for (const { listener, pattern } of matched) {
      try {
        // For wildcard, append the actual event name as last arg
        const finalArgs = pattern !== event ? [...args, event] : args;
        listener.callback.apply(listener.context, finalArgs);
        count++;
        if (listener.once) toRemove.push({ listener, pattern });
      } catch (err) {
        console.error(`[EventBus] Listener error on "${event}":`, err);
        this.emit('eventbus:error', { event, error: err, listenerId: listener.id });
      }
    }

    // Clean up once listeners
    for (const { listener, pattern } of toRemove) {
      const arr = this._listeners.get(pattern);
      if (arr) {
        const idx = arr.indexOf(listener);
        if (idx !== -1) arr.splice(idx, 1);
        if (arr.length === 0) this._listeners.delete(pattern);
      }
    }

    this._emitDepth--;

    // Notify waitFor listeners
    this._resolveWaiters(event, args);

    return count;
  }

  /**
   * Collect all listeners matching an event (exact + wildcard patterns).
   * @private
   * @param {string} event
   * @returns {Array<{listener: Listener, pattern: string}>}
   */
  _collectListeners(event) {
    const matched = [];

    // Exact match
    if (this._listeners.has(event)) {
      for (const l of this._listeners.get(event)) {
        matched.push({ listener: l, pattern: event });
      }
    }

    // Wildcard patterns
    if (this.enableWildcard) {
      for (const [pattern, arr] of this._listeners) {
        if (pattern === event) continue;
        if (pattern === '*') {
          for (const l of arr) matched.push({ listener: l, pattern });
        } else if (pattern.endsWith('.*') || pattern.endsWith(':*')) {
          const prefix = pattern.slice(0, -1);
          if (event.startsWith(prefix)) {
            for (const l of arr) matched.push({ listener: l, pattern });
          }
        } else if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          if (regex.test(event)) {
            for (const l of arr) matched.push({ listener: l, pattern });
          }
        }
      }
    }

    // Sort all by priority
    matched.sort((a, b) => b.listener.priority - a.listener.priority);
    return matched;
  }

  // ─── Async Waiting ───────────────────────────────────────────────

  /**
   * Wait for multiple events to fire (at least once each), then call back.
   * Returns a Promise if no callback provided.
   * @param {string[]} events - Events to wait for
   * @param {Function} [callback] - Called with Map<event, lastArgs>
   * @returns {Promise<Map<string, Array>>|void}
   */
  waitFor(events, callback) {
    if (!Array.isArray(events) || events.length === 0) {
      throw new TypeError('waitFor requires a non-empty array of event names');
    }

    const promise = new Promise((resolve) => {
      const received = new Map();
      const remaining = new Set(events);
      const key = `wait_${++_eid}`;

      const handler = (event, args) => {
        if (!remaining.has(event)) return;
        received.set(event, args);
        remaining.delete(event);
        if (remaining.size === 0) {
          this._waiting.delete(key);
          resolve(received);
        }
      };

      this._waiting.set(key, events.map(e => ({ event: e, handler })));

      // Subscribe to each event
      const ids = events.map(e => this.once(e, (...args) => handler(e, args)));
      // Store ids for potential cancellation
      this._waiting.get(key).ids = ids;
    });

    if (typeof callback === 'function') {
      promise.then(callback);
      return;
    }
    return promise;
  }

  /**
   * Cancel a pending waitFor.
   * @param {string[]} events - The events originally passed to waitFor
   */
  cancelWait(events) {
    for (const [key, entry] of this._waiting) {
      const entryEvents = entry.map(e => e.event);
      if (events.length === entryEvents.length && events.every(e => entryEvents.includes(e))) {
        for (const { handler } of entry) {
          // Remove the once listeners
          for (const e of events) {
            this.off(e, handler);
          }
        }
        this._waiting.delete(key);
        return true;
      }
    }
    return false;
  }

  /** @private */
  _resolveWaiters(event, args) {
    for (const [key, entries] of this._waiting) {
      for (const entry of entries) {
        if (entry.event === event) {
          entry.handler(event, args);
        }
      }
    }
  }

  // ─── Module Registration ─────────────────────────────────────────

  /**
   * Register a module with its event namespace.
   * @param {string} moduleId - Unique module identifier
   * @param {Object} config
   * @param {string} config.namespace - Event prefix (e.g., 'app.music')
   * @param {string[]} [config.events] - Declared events this module emits
   * @param {string} [config.version] - Module version
   * @returns {Object} Scoped emitter for the module
   */
  registerModule(moduleId, config = {}) {
    if (this._modules.has(moduleId)) {
      console.warn(`[EventBus] Module "${moduleId}" already registered, updating.`);
    }

    const namespace = config.namespace || moduleId;
    this._modules.set(moduleId, {
      name: moduleId,
      namespace,
      events: config.events || [],
      version: config.version || '1.0.0',
      registered: Date.now()
    });

    // Return a scoped emitter that auto-prefixes events
    const self = this;
    return {
      /** Emit with namespace prefix */
      emit(event, ...args) {
        self._currentModule = moduleId;
        const result = self.emit(`${namespace}:${event}`, ...args);
        self._currentModule = null;
        return result;
      },
      /** Subscribe with namespace prefix */
      on(event, callback, options) {
        return self.on(`${namespace}:${event}`, callback, options);
      },
      /** Subscribe once with namespace prefix */
      once(event, callback, options) {
        return self.once(`${namespace}:${event}`, callback, options);
      },
      /** Unsubscribe */
      off(eventOrId, callback) {
        if (callback) return self.off(`${namespace}:${eventOrId}`, callback);
        return self.off(eventOrId);
      },
      /** Unregister this module's listeners */
      destroy() {
        self.unregisterModule(moduleId);
      },
      /** Access the raw bus */
      bus: self
    };
  }

  /**
   * Unregister a module and remove all its namespaced listeners.
   * @param {string} moduleId
   * @returns {number} Number of listeners removed
   */
  unregisterModule(moduleId) {
    const mod = this._modules.get(moduleId);
    if (!mod) return 0;
    let count = 0;
    const prefix = `${mod.namespace}:`;
    for (const [event, arr] of this._listeners) {
      if (event.startsWith(prefix)) {
        count += arr.length;
        this._listeners.delete(event);
      }
    }
    this._modules.delete(moduleId);
    this.emit('eventbus:module-unregistered', { moduleId });
    return count;
  }

  /**
   * List all registered modules.
   * @returns {Array<Object>}
   */
  listModules() {
    return Array.from(this._modules.values());
  }

  // ─── Inter-App Messaging ─────────────────────────────────────────

  /**
   * Send a message from one module to another.
   * @param {string} fromModule - Sender module id
   * @param {string} toModule - Target module id
   * @param {string} message - Message event name (without namespace)
   * @param {*} data - Payload
   * @returns {boolean} Whether the message was delivered
   */
  sendMessage(fromModule, toModule, message, data) {
    const target = this._modules.get(toModule);
    if (!target) {
      console.warn(`[EventBus] sendMessage: target module "${toModule}" not registered`);
      return false;
    }

    this._messageLog.push({
      from: fromModule,
      to: toModule,
      event: message,
      timestamp: Date.now()
    });

    // Keep log bounded
    if (this._messageLog.length > 500) this._messageLog.shift();

    const fullEvent = `${target.namespace}:${message}`;
    this._currentModule = fromModule;
    const count = this.emit(fullEvent, { from: fromModule, data });
    this._currentModule = null;

    // Also emit on the inbox channel
    this.emit('eventbus:message', {
      from: fromModule,
      to: toModule,
      message,
      data
    });

    return count > 0;
  }

  /**
   * Broadcast a message to all registered modules.
   * @param {string} fromModule - Sender module id
   * @param {string} message - Message event name
   * @param {*} data - Payload
   * @returns {number} Number of modules that received it
   */
  broadcast(fromModule, message, data) {
    let delivered = 0;
    for (const [moduleId] of this._modules) {
      if (moduleId === fromModule) continue;
      if (this.sendMessage(fromModule, moduleId, message, data)) delivered++;
    }
    return delivered;
  }

  /**
   * Get message history between modules.
   * @param {string} [fromModule]
   * @param {string} [toModule]
   * @returns {Array}
   */
  getMessageLog(fromModule, toModule) {
    return this._messageLog.filter(m => {
      if (fromModule && m.from !== fromModule) return false;
      if (toModule && m.to !== toModule) return false;
      return true;
    });
  }

  // ─── Event History & Replay ──────────────────────────────────────

  /**
   * Get the event history buffer.
   * @param {Object} [filter]
   * @param {string} [filter.event] - Filter by event name (supports prefix match with '*')
   * @param {number} [filter.since] - Unix timestamp lower bound
   * @param {number} [filter.limit] - Max entries to return
   * @returns {EventEntry[]}
   */
  getHistory(filter = {}) {
    let result = this._history.slice();
    if (filter.event) {
      if (filter.event.endsWith('*')) {
        const prefix = filter.event.slice(0, -1);
        result = result.filter(e => e.event.startsWith(prefix));
      } else {
        result = result.filter(e => e.event === filter.event);
      }
    }
    if (filter.since) {
      result = result.filter(e => e.timestamp >= filter.since);
    }
    if (filter.limit && filter.limit > 0) {
      result = result.slice(-filter.limit);
    }
    return result;
  }

  /**
   * Replay a historical event to current listeners.
   * @param {number} eventId - The id from EventEntry
   * @returns {boolean}
   */
  replay(eventId) {
    const entry = this._history.find(e => e.id === eventId);
    if (!entry) return false;
    this.emit(`replay:${entry.event}`, ...entry.args);
    return true;
  }

  /**
   * Replay all history matching a filter.
   * @param {Object} filter - Same as getHistory filter
   * @returns {number} Number of events replayed
   */
  replayHistory(filter = {}) {
    const entries = this.getHistory(filter);
    for (const entry of entries) {
      this.emit(`replay:${entry.event}`, ...entry.args);
    }
    return entries.length;
  }

  /**
   * Clear event history.
   * @param {string} [event] - Clear only matching events
   */
  clearHistory(event) {
    if (!event) {
      this._history.length = 0;
      return;
    }
    this._history = this._history.filter(e => e.event !== event);
  }

  // ─── Interceptors & Middleware ────────────────────────────────────

  /**
   * Add a global interceptor that runs before every emit.
   * Return false from the interceptor to suppress the event.
   * @param {Function} interceptor - (event, args) => boolean|void
   * @returns {Function} Remove function
   */
  addInterceptor(interceptor) {
    if (typeof interceptor !== 'function') throw new TypeError('interceptor must be a function');
    this._globalInterceptors.add(interceptor);
    return () => this._globalInterceptors.delete(interceptor);
  }

  /**
   * Remove a global interceptor.
   * @param {Function} interceptor
   */
  removeInterceptor(interceptor) {
    this._globalInterceptors.delete(interceptor);
  }

  /**
   * Add middleware for a specific module namespace.
   * Middleware can transform args before they reach listeners.
   * @param {string} namespace
   * @param {Function} middleware - (event, args) => transformedArgs
   * @returns {Function} Remove function
   */
  addModuleMiddleware(namespace, middleware) {
    this._moduleMiddleware.set(namespace, middleware);
    return () => this._moduleMiddleware.delete(namespace);
  }

  // ─── Suppression ─────────────────────────────────────────────────

  /**
   * Temporarily suppress an event (emits are silently dropped).
   * @param {string} event
   */
  suppress(event) {
    this._suppressedEvents.add(event);
  }

  /**
   * Unsuppress a previously suppressed event.
   * @param {string} event
   */
  unsuppress(event) {
    this._suppressedEvents.delete(event);
  }

  /**
   * Check if an event is suppressed.
   * @param {string} event
   * @returns {boolean}
   */
  isSuppressed(event) {
    return this._suppressedEvents.has(event);
  }

  // ─── Statistics & Introspection ───────────────────────────────────

  /**
   * Get emission statistics.
   * @returns {Map<string, number>}
   */
  getStats() {
    return new Map(this._eventStats);
  }

  /**
   * Get the most frequently emitted events.
   * @param {number} [top=10]
   * @returns {Array<{event: string, count: number}>}
   */
  getTopEvents(top = 10) {
    return Array.from(this._eventStats.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([event, count]) => ({ event, count }));
  }

  /**
   * Count listeners for an event.
   * @param {string} event
   * @returns {number}
   */
  listenerCount(event) {
    const exact = this._listeners.has(event) ? this._listeners.get(event).length : 0;
    let wildcard = 0;
    if (this.enableWildcard) {
      for (const [pattern, arr] of this._listeners) {
        if (pattern === event) continue;
        if (pattern === '*' || (pattern.endsWith('*') && event.startsWith(pattern.slice(0, -1)))) {
          wildcard += arr.length;
        }
      }
    }
    return exact + wildcard;
  }

  /**
   * List all event names that have listeners.
   * @returns {string[]}
   */
  eventNames() {
    return Array.from(this._listeners.keys());
  }

  /**
   * Get all listener details for an event.
   * @param {string} event
   * @returns {Listener[]}
   */
  listeners(event) {
    return (this._listeners.get(event) || []).slice();
  }

  // ─── Convenience Emitters ────────────────────────────────────────

  /**
   * Emit with a delay.
   * @param {string} event
   * @param {number} ms - Delay in milliseconds
   * @param {...*} args
   * @returns {number} Timer id (for clearTimeout)
   */
  emitLater(event, ms, ...args) {
    return setTimeout(() => this.emit(event, ...args), ms);
  }

  /**
   * Emit on next microtask.
   * @param {string} event
   * @param {...*} args
   */
  emitAsync(event, ...args) {
    Promise.resolve().then(() => this.emit(event, ...args));
  }

  /**
   * Emit only if the event hasn't been emitted in the last `ms` milliseconds.
   * @param {string} event
   * @param {number} ms - Throttle window
   * @param {...*} args
   * @returns {boolean} Whether it was emitted
   */
  emitThrottled(event, ms, ...args) {
    const key = `_throttle_${event}`;
    const now = Date.now();
    if (this[key] && now - this[key] < ms) return false;
    this[key] = now;
    this.emit(event, ...args);
    return true;
  }

  /**
   * Debounce an event — only emit after `ms` of silence.
   * @param {string} event
   * @param {number} ms - Debounce window
   * @param {...*} args
   */
  emitDebounced(event, ms, ...args) {
    const key = `_debounce_${event}`;
    if (this[key]) clearTimeout(this[key]);
    this[key] = setTimeout(() => {
      delete this[key];
      this.emit(event, ...args);
    }, ms);
  }

  // ─── Module Lifecycle Hooks ───────────────────────────────────────

  /**
   * Convenience: register standard lifecycle hooks for a module.
   * Emits: module:init, module:start, module:stop, module:destroy
   * @param {string} moduleId
   * @param {Object} hooks - { onInit, onStart, onStop, onDestroy }
   * @returns {Object} Scoped emitter
   */
  registerLifecycle(moduleId, hooks = {}) {
    const scoped = this.registerModule(moduleId, { namespace: moduleId });

    if (hooks.onInit) scoped.on('init', hooks.onInit);
    if (hooks.onStart) scoped.on('start', hooks.onStart);
    if (hooks.onStop) scoped.on('stop', hooks.onStop);
    if (hooks.onDestroy) scoped.on('destroy', hooks.onDestroy);

    // Emit init
    scoped.emit('init', { moduleId, timestamp: Date.now() });
    this.emit('eventbus:module-registered', { moduleId });

    return scoped;
  }

  // ─── Pub/Sub Patterns ────────────────────────────────────────────

  /**
   * Create a request-response pattern (RPC over event bus).
   * @param {string} requestEvent - Event name for the request
   * @param {Function} handler - (data) => responseData
   * @returns {Function} Unsubscribe function
   */
  handleRequest(requestEvent, handler) {
    const responseEvent = `${requestEvent}:response`;
    const id = this.on(requestEvent, async (data) => {
      try {
        const result = await handler(data);
        this.emit(responseEvent, { success: true, result, requestId: data?.requestId });
      } catch (error) {
        this.emit(responseEvent, { success: false, error: error.message, requestId: data?.requestId });
      }
    });
    return () => this.off(id);
  }

  /**
   * Send a request and wait for a response.
   * @param {string} requestEvent
   * @param {*} data
   * @param {number} [timeout=5000]
   * @returns {Promise<*>}
   */
  request(requestEvent, data, timeout = 5000) {
    const responseEvent = `${requestEvent}:response`;
    const requestId = `req_${++_eid}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(listenerId);
        reject(new Error(`Request timeout: ${requestEvent}`));
      }, timeout);

      const listenerId = this.once(responseEvent, (response) => {
        clearTimeout(timer);
        if (response.success) {
          resolve(response.result);
        } else {
          reject(new Error(response.error || 'Unknown error'));
        }
      });

      this.emit(requestEvent, { ...data, requestId });
    });
  }

  // ─── Pipe / Stream ───────────────────────────────────────────────

  /**
   * Pipe events from one event name to another.
   * @param {string} source - Source event
   * @param {string} target - Target event
   * @param {Function} [transform] - Optional data transform
   * @returns {Function} Unpipe function
   */
  pipe(source, target, transform) {
    const id = this.on(source, (...args) => {
      const data = transform ? transform(...args) : args;
      if (Array.isArray(data)) {
        this.emit(target, ...data);
      } else {
        this.emit(target, data);
      }
    });
    return () => this.off(id);
  }

  // ─── Serialization ───────────────────────────────────────────────

  /**
   * Export the bus state (listeners metadata, history, modules) as JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      modules: this.listModules(),
      history: this._history.slice(),
      listenerCounts: Object.fromEntries(
        Array.from(this._listeners.entries()).map(([k, v]) => [k, v.length])
      ),
      stats: Object.fromEntries(this._eventStats),
      messageLog: this._messageLog.slice(-100)
    };
  }

  // ─── Cleanup ─────────────────────────────────────────────────────

  /**
   * Destroy the bus, removing all listeners and clearing state.
   */
  destroy() {
    this._listeners.clear();
    this._history.length = 0;
    this._modules.clear();
    this._waiting.clear();
    this._globalInterceptors.clear();
    this._moduleMiddleware.clear();
    this._messageLog.length = 0;
    this._eventStats.clear();
    this._suppressedEvents.clear();
    this._destroyed = true;
  }

  /**
   * Reset statistics without destroying the bus.
   */
  resetStats() {
    this._eventStats.clear();
    this._messageLog.length = 0;
  }
}

// ─── Singleton ─────────────────────────────────────────────────────

/** @type {NexusEventBus|null} */
let _instance = null;

/**
 * Get or create the global NexusEventBus singleton.
 * @param {Object} [options] - Only used on first call
 * @returns {NexusEventBus}
 */
NexusEventBus.getInstance = function (options) {
  if (!_instance) _instance = new NexusEventBus(options);
  return _instance;
};

/**
 * Reset the singleton (for testing).
 */
NexusEventBus.resetInstance = function () {
  if (_instance) _instance.destroy();
  _instance = null;
};

export default NexusEventBus;
export { NexusEventBus };
