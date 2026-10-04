/**
 * NEXUS OS — Process Manager
 * Simulated OS-level process management: lifecycle, priorities, resource tracking,
 * process trees, inter-process communication, auto-restart, and monitoring.
 * @module ProcessManager
 * @version 1.0.0
 */

// ─── Constants ───────────────────────────────────────────────────────

/** @enum {string} */
const ProcessState = Object.freeze({
  INIT: 'init',
  RUNNING: 'running',
  PAUSED: 'paused',
  SLEEPING: 'sleeping',
  TERMINATED: 'terminated',
  CRASHED: 'crashed',
  ZOMBIE: 'zombie'
});

/** @enum {number} */
const Priority = Object.freeze({
  IDLE: 0,
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  REALTIME: 4
});

const MAX_PROCESSES = 256;
const TICK_INTERVAL = 1000;
const MAX_LOG_ENTRIES = 500;
const AUTO_RESTART_DELAY = 2000;
const ZOMBIE_REAP_INTERVAL = 10000;
const RESOURCE_HISTORY_SIZE = 60; // Keep 60 seconds of history

/** @type {number} PID counter */
let _nextPid = 1;

// ─── Process Class ──────────────────────────────────────────────────

/**
 * Represents a single running process in NEXUS OS.
 */
class Process {
  /**
   * @param {Object} config
   * @param {string} config.name - Human-readable process name
   * @param {string} config.module - Module/app identifier
   * @param {Function} [config.start] - Start callback
   * @param {Function} [config.stop] - Stop callback
   * @param {Function} [config.tick] - Called every tick while running
   * @param {Function} [config.onCrash] - Called when process crashes
   * @param {number} [config.priority] - Initial priority
   * @param {number} [config.parentPid] - Parent process id
   * @param {boolean} [config.autoRestart] - Auto-restart on crash
   * @param {number} [config.maxRestarts] - Max restarts before giving up
   * @param {Object} [config.resources] - Resource limits {cpu, memory}
   * @param {Object} [config.metadata] - Arbitrary metadata
   */
  constructor(config) {
    /** @type {number} */
    this.pid = _nextPid++;
    /** @type {string} */
    this.name = config.name || `process-${this.pid}`;
    /** @type {string} */
    this.module = config.module || 'unknown';
    /** @type {string} */
    this.state = ProcessState.INIT;
    /** @type {number} */
    this.priority = config.priority ?? Priority.NORMAL;
    /** @type {number|null} */
    this.parentPid = config.parentPid || null;
    /** @type {Set<number>} */
    this.childPids = new Set();
    /** @type {boolean} */
    this.autoRestart = config.autoRestart ?? false;
    /** @type {number} */
    this.maxRestarts = config.maxRestarts ?? 5;
    /** @type {number} */
    this.restartCount = 0;

    // Callbacks
    this._start = config.start || null;
    this._stop = config.stop || null;
    this._tick = config.tick || null;
    this._onCrash = config.onCrash || null;

    // Resource tracking
    /** @type {{cpu: number, memory: number}} Current simulated usage */
    this.resources = {
      cpu: 0,
      memory: config.resources?.memory || Math.random() * 50 + 10
    };
    /** @type {{cpu: number, memory: number}} Resource limits */
    this.resourceLimits = {
      cpu: config.resources?.cpu || 100,
      memory: config.resources?.memory || 512
    };
    /** @type {Array<{cpu: number, memory: number, timestamp: number}>} */
    this.resourceHistory = [];

    // Timing
    /** @type {number} */
    this.createdAt = Date.now();
    /** @type {number|null} */
    this.startedAt = null;
    /** @type {number|null} */
    this.stoppedAt = null;
    /** @type {number} */
    this.cpuTimeMs = 0;

    // Metadata
    /** @type {Object} */
    this.metadata = config.metadata || {};
    /** @type {string|null} */
    this.exitReason = null;
    /** @type {number|null} */
    this.exitCode = null;
    /** @type {string[]} */
    this.log = [];

    // IPC
    /** @type {Map<string, Function[]>} */
    this._channels = new Map();
  }

  /**
   * Uptime in milliseconds.
   * @returns {number}
   */
  get uptime() {
    if (!this.startedAt) return 0;
    const end = this.stoppedAt || Date.now();
    return end - this.startedAt;
  }

  /**
   * CPU usage percentage (simulated).
   * @returns {number}
   */
  get cpuPercent() {
    return this.resources.cpu;
  }

  /**
   * Memory usage in MB (simulated).
   * @returns {number}
   */
  get memoryMB() {
    return this.resources.memory;
  }

  /**
   * Add a log entry.
   * @param {string} message
   */
  addLog(message) {
    this.log.push(`[${new Date().toISOString()}] ${message}`);
    if (this.log.length > MAX_LOG_ENTRIES) this.log.shift();
  }

  /**
   * Register an IPC channel handler.
   * @param {string} channel
   * @param {Function} handler
   * @returns {Function} Unsubscribe function
   */
  onChannel(channel, handler) {
    if (!this._channels.has(channel)) this._channels.set(channel, []);
    this._channels.get(channel).push(handler);
    return () => {
      const arr = this._channels.get(channel);
      const idx = arr.indexOf(handler);
      if (idx !== -1) arr.splice(idx, 1);
    };
  }

  /**
   * Send a message on an IPC channel.
   * @param {string} channel
   * @param {*} data
   * @returns {number} Number of handlers called
   */
  sendChannel(channel, data) {
    const handlers = this._channels.get(channel) || [];
    for (const h of handlers) {
      try { h(data, this.pid); } catch (e) { console.error(`[Process ${this.pid}] IPC error:`, e); }
    }
    return handlers.length;
  }

  /**
   * Snapshot of process state (serializable).
   * @returns {Object}
   */
  toJSON() {
    return {
      pid: this.pid,
      name: this.name,
      module: this.module,
      state: this.state,
      priority: this.priority,
      parentPid: this.parentPid,
      childPids: Array.from(this.childPids),
      cpu: this.resources.cpu,
      memory: this.resources.memory,
      uptime: this.uptime,
      restartCount: this.restartCount,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      exitReason: this.exitReason,
      exitCode: this.exitCode
    };
  }
}

// ─── Process Manager ────────────────────────────────────────────────

/**
 * Manages all NEXUS OS processes: creation, scheduling, resource allocation,
 * process trees, auto-restart, monitoring, and inter-process communication.
 */
class ProcessManager {
  /**
   * @param {Object} [options]
   * @param {number} [options.tickInterval=1000] - Tick frequency ms
   * @param {number} [options.maxProcesses=256] - Max concurrent processes
   * @param {boolean} [options.debug=false]
   */
  constructor(options = {}) {
    /** @type {Map<number, Process>} */
    this._processes = new Map();
    /** @type {number} */
    this._tickInterval = options.tickInterval || TICK_INTERVAL;
    /** @type {number} */
    this._maxProcesses = options.maxProcesses || MAX_PROCESSES;
    /** @type {boolean} */
    this._debug = options.debug || false;
    /** @type {number|null} */
    this._tickTimer = null;
    /** @type {number|null} */
    this._reapTimer = null;
    /** @type {boolean} */
    this._running = false;

    // System-wide resource tracking
    /** @type {{totalCpu: number, totalMemory: number, processCount: number}} */
    this._systemResources = { totalCpu: 0, totalMemory: 0, processCount: 0 };
    /** @type {Array<{totalCpu: number, totalMemory: number, timestamp: number}>} */
    this._systemHistory = [];

    // Event callbacks
    /** @type {Map<string, Function[]>} */
    this._events = new Map();
  }

  // ─── Lifecycle ───────────────────────────────────────────────────

  /**
   * Start the process manager tick loop.
   */
  start() {
    if (this._running) return;
    this._running = true;
    this._tickTimer = setInterval(() => this._tick(), this._tickInterval);
    this._reapTimer = setInterval(() => this._reapZombies(), ZOMBIE_REAP_INTERVAL);
    this._emitEvent('manager:started');
  }

  /**
   * Stop the process manager and terminate all processes.
   */
  stop() {
    this._running = false;
    if (this._tickTimer) { clearInterval(this._tickTimer); this._tickTimer = null; }
    if (this._reapTimer) { clearInterval(this._reapTimer); this._reapTimer = null; }
    // Terminate all running processes
    for (const proc of this._processes.values()) {
      if (proc.state === ProcessState.RUNNING || proc.state === ProcessState.PAUSED) {
        this.kill(proc.pid);
      }
    }
    this._emitEvent('manager:stopped');
  }

  // ─── Process Creation ────────────────────────────────────────────

  /**
   * Spawn a new process.
   * @param {Object} config - Process configuration (see Process constructor)
   * @returns {Process}
   * @throws {Error} If max processes reached
   */
  spawn(config) {
    if (this._processes.size >= this._maxProcesses) {
      throw new Error(`Max processes (${this._maxProcesses}) reached`);
    }

    const proc = new Process(config);

    // Link to parent
    if (proc.parentPid && this._processes.has(proc.parentPid)) {
      this._processes.get(proc.parentPid).childPids.add(proc.pid);
    }

    this._processes.set(proc.pid, proc);
    proc.addLog(`Process spawned (module: ${proc.module})`);
    this._emitEvent('process:spawned', proc);

    if (this._debug) console.log(`[ProcMgr] Spawned PID ${proc.pid}: ${proc.name}`);
    return proc;
  }

  /**
   * Spawn and immediately start a process.
   * @param {Object} config
   * @returns {Process}
   */
  spawnAndStart(config) {
    const proc = this.spawn(config);
    this.startProcess(proc.pid);
    return proc;
  }

  // ─── Process Control ─────────────────────────────────────────────

  /**
   * Start a process (transition from INIT/PAUSED to RUNNING).
   * @param {number} pid
   * @returns {boolean}
   */
  startProcess(pid) {
    const proc = this._getProcess(pid);
    if (!proc) return false;
    if (proc.state !== ProcessState.INIT && proc.state !== ProcessState.PAUSED && proc.state !== ProcessState.SLEEPING) {
      return false;
    }

    proc.state = ProcessState.RUNNING;
    proc.startedAt = proc.startedAt || Date.now();
    proc.stoppedAt = null;
    proc.exitReason = null;
    proc.exitCode = null;

    try {
      if (proc._start) proc._start(proc);
    } catch (e) {
      this._handleCrash(proc, e);
      return false;
    }

    proc.addLog('Started');
    this._emitEvent('process:started', proc);
    return true;
  }

  /**
   * Pause a running process.
   * @param {number} pid
   * @returns {boolean}
   */
  pause(pid) {
    const proc = this._getProcess(pid);
    if (!proc || proc.state !== ProcessState.RUNNING) return false;
    proc.state = ProcessState.PAUSED;
    proc.addLog('Paused');
    this._emitEvent('process:paused', proc);
    return true;
  }

  /**
   * Resume a paused process.
   * @param {number} pid
   * @returns {boolean}
   */
  resume(pid) {
    return this.startProcess(pid);
  }

  /**
   * Put a process to sleep (low-resource state).
   * @param {number} pid
   * @returns {boolean}
   */
  sleep(pid) {
    const proc = this._getProcess(pid);
    if (!proc || proc.state !== ProcessState.RUNNING) return false;
    proc.state = ProcessState.SLEEPING;
    proc.resources.cpu = 0;
    proc.addLog('Sleeping');
    this._emitEvent('process:sleeping', proc);
    return true;
  }

  /**
   * Gracefully terminate a process.
   * @param {number} pid
   * @param {number} [exitCode=0]
   * @param {string} [reason]
   * @returns {boolean}
   */
  kill(pid, exitCode = 0, reason) {
    const proc = this._getProcess(pid);
    if (!proc) return false;
    if (proc.state === ProcessState.TERMINATED || proc.state === ProcessState.ZOMBIE) return false;

    try {
      if (proc._stop) proc._stop(proc);
    } catch (e) {
      console.error(`[ProcMgr] Error in stop callback for PID ${pid}:`, e);
    }

    proc.state = ProcessState.TERMINATED;
    proc.stoppedAt = Date.now();
    proc.exitCode = exitCode;
    proc.exitReason = reason || 'Killed';
    proc.resources.cpu = 0;
    proc.addLog(`Terminated (code: ${exitCode}, reason: ${proc.exitReason})`);

    // Orphan children
    for (const childPid of proc.childPids) {
      const child = this._processes.get(childPid);
      if (child) child.parentPid = null;
    }

    // Remove from parent's child list
    if (proc.parentPid) {
      const parent = this._processes.get(proc.parentPid);
      if (parent) parent.childPids.delete(pid);
    }

    this._emitEvent('process:terminated', proc);
    return true;
  }

  /**
   * Kill a process and all its descendants (process tree kill).
   * @param {number} pid
   * @returns {number} Total processes killed
   */
  killTree(pid) {
    const proc = this._getProcess(pid);
    if (!proc) return 0;

    let count = 0;
    // Kill children first (bottom-up)
    for (const childPid of proc.childPids) {
      count += this.killTree(childPid);
    }
    if (this.kill(pid, 9, 'Tree kill')) count++;
    return count;
  }

  /**
   * Restart a process.
   * @param {number} pid
   * @returns {boolean}
   */
  restart(pid) {
    const proc = this._getProcess(pid);
    if (!proc) return false;
    this.kill(pid, 0, 'Restart');
    proc.state = ProcessState.INIT;
    proc.startedAt = null;
    proc.stoppedAt = null;
    proc.restartCount++;
    return this.startProcess(pid);
  }

  /**
   * Change a process's priority.
   * @param {number} pid
   * @param {number} priority - Priority level (0-4)
   * @returns {boolean}
   */
  setPriority(pid, priority) {
    const proc = this._getProcess(pid);
    if (!proc) return false;
    const oldPriority = proc.priority;
    proc.priority = Math.max(Priority.IDLE, Math.min(Priority.REALTIME, priority));
    proc.addLog(`Priority changed: ${oldPriority} → ${proc.priority}`);
    return true;
  }

  // ─── Process Lookup ──────────────────────────────────────────────

  /**
   * Get a process by PID.
   * @param {number} pid
   * @returns {Process|null}
   */
  get(pid) {
    return this._processes.get(pid) || null;
  }

  /**
   * Find processes by name.
   * @param {string} name
   * @returns {Process[]}
   */
  findByName(name) {
    return Array.from(this._processes.values()).filter(p => p.name === name);
  }

  /**
   * Find processes by module.
   * @param {string} module
   * @returns {Process[]}
   */
  findByModule(module) {
    return Array.from(this._processes.values()).filter(p => p.module === module);
  }

  /**
   * Find processes by state.
   * @param {string} state
   * @returns {Process[]}
   */
  findByState(state) {
    return Array.from(this._processes.values()).filter(p => p.state === state);
  }

  /**
   * Get all children of a process.
   * @param {number} pid
   * @returns {Process[]}
   */
  getChildren(pid) {
    const proc = this._getProcess(pid);
    if (!proc) return [];
    return Array.from(proc.childPids).map(cpid => this._processes.get(cpid)).filter(Boolean);
  }

  /**
   * Get the full ancestor chain from a process to root.
   * @param {number} pid
   * @returns {Process[]}
   */
  getAncestors(pid) {
    const chain = [];
    let current = this._processes.get(pid);
    while (current && current.parentPid) {
      current = this._processes.get(current.parentPid);
      if (current) chain.push(current);
    }
    return chain;
  }

  /**
   * Get the entire process tree rooted at a PID.
   * @param {number} [rootPid] - Root process (omit for all roots)
   * @returns {Object} Tree structure { process, children: [...] }
   */
  getTree(rootPid) {
    const buildNode = (proc) => ({
      process: proc.toJSON(),
      children: Array.from(proc.childPids)
        .map(cpid => this._processes.get(cpid))
        .filter(Boolean)
        .map(buildNode)
    });

    if (rootPid) {
      const root = this._processes.get(rootPid);
      if (!root) return null;
      return buildNode(root);
    }

    // All root processes (no parent or parent not in manager)
    const roots = Array.from(this._processes.values()).filter(
      p => !p.parentPid || !this._processes.has(p.parentPid)
    );
    return roots.map(buildNode);
  }

  // ─── Process Listing ─────────────────────────────────────────────

  /**
   * List all processes.
   * @param {Object} [filter]
   * @param {string} [filter.state]
   * @param {string} [filter.module]
   * @param {number} [filter.minPriority]
   * @returns {Object[]} Array of process snapshots
   */
  list(filter = {}) {
    let procs = Array.from(this._processes.values());
    if (filter.state) procs = procs.filter(p => p.state === filter.state);
    if (filter.module) procs = procs.filter(p => p.module === filter.module);
    if (filter.minPriority !== undefined) procs = procs.filter(p => p.priority >= filter.minPriority);
    return procs.map(p => p.toJSON());
  }

  /**
   * Get a summary dashboard object.
   * @returns {Object}
   */
  getDashboard() {
    const all = Array.from(this._processes.values());
    const running = all.filter(p => p.state === ProcessState.RUNNING);
    const paused = all.filter(p => p.state === ProcessState.PAUSED);
    const sleeping = all.filter(p => p.state === ProcessState.SLEEPING);
    const crashed = all.filter(p => p.state === ProcessState.CRASHED);
    const terminated = all.filter(p => p.state === ProcessState.TERMINATED);

    const totalCpu = running.reduce((sum, p) => sum + p.resources.cpu, 0);
    const totalMemory = all.reduce((sum, p) => sum + p.resources.memory, 0);

    return {
      total: all.length,
      running: running.length,
      paused: paused.length,
      sleeping: sleeping.length,
      crashed: crashed.length,
      terminated: terminated.length,
      systemCpu: Math.round(totalCpu),
      systemMemory: Math.round(totalMemory * 10) / 10,
      history: this._systemHistory.slice(-RESOURCE_HISTORY_SIZE),
      topCpu: running.sort((a, b) => b.resources.cpu - a.resources.cpu).slice(0, 5).map(p => p.toJSON()),
      topMemory: all.sort((a, b) => b.resources.memory - a.resources.memory).slice(0, 5).map(p => p.toJSON())
    };
  }

  // ─── Inter-Process Communication ─────────────────────────────────

  /**
   * Send a message from one process to another via IPC channel.
   * @param {number} fromPid
   * @param {number} toPid
   * @param {string} channel
   * @param {*} data
   * @returns {boolean}
   */
  sendIPC(fromPid, toPid, channel, data) {
    const target = this._processes.get(toPid);
    if (!target) return false;
    const wrapped = { from: fromPid, channel, data, timestamp: Date.now() };
    target.sendChannel(channel, wrapped);
    this._emitEvent('ipc:message', { from: fromPid, to: toPid, channel });
    return true;
  }

  /**
   * Broadcast to all processes in a module.
   * @param {number} fromPid
   * @param {string} module
   * @param {string} channel
   * @param {*} data
   * @returns {number}
   */
  broadcastIPC(fromPid, module, channel, data) {
    let count = 0;
    for (const proc of this._processes.values()) {
      if (proc.module === module && proc.pid !== fromPid && proc.state === ProcessState.RUNNING) {
        this.sendIPC(fromPid, proc.pid, channel, data);
        count++;
      }
    }
    return count;
  }

  // ─── Events ──────────────────────────────────────────────────────

  /**
   * Listen for process manager events.
   * @param {string} event
   * @param {Function} handler
   * @returns {Function} Unsubscribe
   */
  on(event, handler) {
    if (!this._events.has(event)) this._events.set(event, []);
    this._events.get(event).push(handler);
    return () => {
      const arr = this._events.get(event);
      const idx = arr.indexOf(handler);
      if (idx !== -1) arr.splice(idx, 1);
    };
  }

  /** @private */
  _emitEvent(event, data) {
    const handlers = this._events.get(event) || [];
    for (const h of handlers) {
      try { h(data); } catch (e) { console.error(`[ProcMgr] Event handler error (${event}):`, e); }
    }
  }

  // ─── Internal Tick Loop ──────────────────────────────────────────

  /** @private Main tick — update resources, run process ticks, check health */
  _tick() {
    if (!this._running) return;

    let totalCpu = 0;
    let totalMemory = 0;

    for (const proc of this._processes.values()) {
      if (proc.state !== ProcessState.RUNNING) continue;

      // Simulate resource usage with small random walk
      proc.resources.cpu = Math.max(0, Math.min(100,
        proc.resources.cpu + (Math.random() - 0.5) * 10 * (proc.priority + 1)
      ));
      proc.resources.memory = Math.max(1, proc.resources.memory + (Math.random() - 0.5) * 2);

      // Enforce limits
      if (proc.resources.cpu > proc.resourceLimits.cpu) {
        proc.resources.cpu = proc.resourceLimits.cpu;
      }
      if (proc.resources.memory > proc.resourceLimits.memory) {
        proc.resources.memory = proc.resourceLimits.memory;
        proc.addLog('Memory limit reached — throttling');
      }

      // CPU time tracking
      proc.cpuTimeMs += this._tickInterval * (proc.resources.cpu / 100);

      // Record history
      proc.resourceHistory.push({
        cpu: proc.resources.cpu,
        memory: proc.resources.memory,
        timestamp: Date.now()
      });
      if (proc.resourceHistory.length > RESOURCE_HISTORY_SIZE) {
        proc.resourceHistory.shift();
      }

      // Run process tick callback
      if (proc._tick) {
        try {
          proc._tick(proc, this._tickInterval);
        } catch (e) {
          this._handleCrash(proc, e);
        }
      }

      totalCpu += proc.resources.cpu;
      totalMemory += proc.resources.memory;
    }

    // Update system resources
    this._systemResources.totalCpu = totalCpu;
    this._systemResources.totalMemory = totalMemory;
    this._systemResources.processCount = this.findByState(ProcessState.RUNNING).length;

    this._systemHistory.push({
      totalCpu,
      totalMemory,
      timestamp: Date.now(),
      processCount: this._systemResources.processCount
    });
    if (this._systemHistory.length > RESOURCE_HISTORY_SIZE) {
      this._systemHistory.shift();
    }
  }

  /** @private Handle process crash */
  _handleCrash(proc, error) {
    proc.state = ProcessState.CRASHED;
    proc.exitReason = error?.message || 'Unknown error';
    proc.exitCode = -1;
    proc.resources.cpu = 0;
    proc.addLog(`CRASHED: ${proc.exitReason}`);

    try {
      if (proc._onCrash) proc._onCrash(proc, error);
    } catch { /* ignore crash handler errors */ }

    this._emitEvent('process:crashed', proc);

    // Auto-restart logic
    if (proc.autoRestart && proc.restartCount < proc.maxRestarts) {
      proc.addLog(`Auto-restart scheduled (${proc.restartCount + 1}/${proc.maxRestarts})`);
      setTimeout(() => {
        if (proc.state === ProcessState.CRASHED) {
          this.restart(proc.pid);
        }
      }, AUTO_RESTART_DELAY);
    }
  }

  /** @private Reap zombie/terminated processes older than threshold */
  _reapZombies() {
    const threshold = Date.now() - 60000; // 1 minute
    for (const [pid, proc] of this._processes) {
      if ((proc.state === ProcessState.TERMINATED || proc.state === ProcessState.CRASHED)
          && proc.stoppedAt && proc.stoppedAt < threshold) {
        proc.state = ProcessState.ZOMBIE;
        this._processes.delete(pid);
        this._emitEvent('process:reaped', proc);
      }
    }
  }

  /** @private */
  _getProcess(pid) {
    const proc = this._processes.get(pid);
    if (!proc && this._debug) console.warn(`[ProcMgr] PID ${pid} not found`);
    return proc || null;
  }

  // ─── Utility ─────────────────────────────────────────────────────

  /**
   * Get total process count.
   * @returns {number}
   */
  get count() {
    return this._processes.size;
  }

  /**
   * Get running process count.
   * @returns {number}
   */
  get runningCount() {
    return this.findByState(ProcessState.RUNNING).length;
  }

  /**
   * Get system-wide resource usage.
   * @returns {{totalCpu: number, totalMemory: number, processCount: number}}
   */
  getSystemResources() {
    return { ...this._systemResources };
  }

  /**
   * Export all process data as JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      running: this._running,
      processes: this.list(),
      system: this._systemResources,
      history: this._systemHistory.slice(-10)
    };
  }

  /**
   * Destroy the process manager.
   */
  destroy() {
    this.stop();
    this._processes.clear();
    this._events.clear();
    this._systemHistory.length = 0;
  }
}

export default ProcessManager;
export { ProcessManager, Process, ProcessState, Priority };
