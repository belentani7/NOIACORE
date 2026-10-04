'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Terminal Emulator
 *  Full-featured command-line interface with neon glassmorphism
 * ═══════════════════════════════════════════════════════════════
 */
class NexusTerminal {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.outputEl = null;
    this.inputEl = null;
    this.cursorEl = null;
    this.promptEl = null;

    // State
    this.cwd = '/home/operator';
    this.history = [];
    this.historyIndex = -1;
    this.historyMax = 100;
    this.commandCount = 0;
    this.startTime = Date.now();
    this.accentColor = '#ff003c';
    this.matrixAnimId = null;

    // Aliases
    this.aliases = {};

    // Environment variables
    this.env = {
      PATH: '/usr/bin:/usr/local/bin:/nexus/bin',
      HOME: '/home/operator',
      USER: 'operator',
      SHELL: '/nexus/bin/nxsh',
      TERM: 'nexus-256color',
      HOSTNAME: 'nexus-os',
      LANG: 'en_US.UTF-8',
      EDITOR: 'nexus-edit',
      PS1: '\\u@nexus:\\w$ '
    };

    // Processes (mock)
    this.processes = [
      { pid: 1, name: 'nexus-kernel', cpu: '0.1', mem: '12.4', state: 'S' },
      { pid: 2, name: 'nexus-wm', cpu: '1.2', mem: '45.8', state: 'S' },
      { pid: 3, name: 'nexus-taskbar', cpu: '0.3', mem: '18.2', state: 'S' },
      { pid: 4, name: 'nexus-desktop', cpu: '0.5', mem: '32.1', state: 'S' },
      { pid: 100, name: 'terminal', cpu: '0.8', mem: '24.6', state: 'R' }
    ];
    this.nextPid = 101;

    // Virtual filesystem (fallback)
    this.fs = this._createDefaultFS();

    // Fortune quotes
    this.fortunes = [
      '"The network is the battlefield." — NEXUS Core Doctrine',
      '"In the void between zeros and ones, truth hides." — Anonymous Hacker',
      '"Every system has a backdoor. The question is who holds the key." — NEXUS Architect',
      '"Memory is volatile. Legacy is persistent." — Silicon Proverb',
      '"The best firewall is paranoia." — NEXUS Security Manual v3',
      '"You cannot debug a system you do not understand." — First Law of Ops',
      '"Root access is a privilege, not a right." — NEXUS Admin Handbook',
      '"The cloud is just someone else\'s computer. NEXUS is your own." — Operator\'s Creed',
      '"When the terminal goes dark, trust the keyboard." — Old Sysadmin Wisdom',
      '"Encryption is the last line of defense. Make it count." — NEXUS Crypto Division',
      '"A clean terminal is a happy terminal. Keep your history short." — Minimalist Hacker',
      '"The best code is the code you never have to write." — NEXUS Dev Philosophy',
      '"In cyberspace, no one can hear you scream. But they can read your logs." — SecOps',
      '"Beware of sudo bearing gifts." — NEXUS Warning Label #47',
      '"Uptime is a vanity metric. Impact is what matters." — SRE Manifesto',
      '"The ping that never returns tells you more than the one that does." — Network Zen',
      '"Every byte has a story. Every packet, a journey." — Data Flow Chronicles',
      '"Trust nothing. Verify everything. Execute with confidence." — Zero Trust Doctrine',
      '"A terminal without history is a terminal without lessons." — NEXUS Academy',
      '"The matrix has you... but NEXUS gives you the red pill." — System Architect',
      '"Behind every great OS is a filesystem that doesn\'t corrupt." — Storage Engineer\'s Prayer',
      '"When in doubt, cat the config file." — Troubleshooting 101',
      '"The neon glow of a fresh terminal. Nothing quite like it." — NEXUS UI Designer',
      '"Fork carefully. Every process is someone\'s baby." — Process Management Guide'
    ];

    // Load persisted state
    this._loadState();
  }

  // ─── Default Virtual Filesystem ─────────────────────────────────
  _createDefaultFS() {
    return {
      type: 'dir',
      children: {
        'home': {
          type: 'dir',
          children: {
            'operator': {
              type: 'dir',
              children: {
                'documents': {
                  type: 'dir',
                  children: {
                    'readme.txt': { type: 'file', content: 'Welcome to NEXUS OS\n\nThis is your personal document space.\nUse the terminal or file explorer to manage files.\n\nNEXUS OS v4.2.1 — Neural Execution Unified System' },
                    'notes.md': { type: 'file', content: '# NEXUS Notes\n\n## Quick Reference\n- Terminal: Full command-line interface\n- Code Editor: Syntax-highlighted editing\n- File Explorer: Visual file management\n\n## Tips\n- Use `help` to see all terminal commands\n- Use `neofetch` for system info\n- Tab completion works for commands and paths' },
                    'todo.txt': { type: 'file', content: 'TODO List\n=========\n[x] Boot NEXUS OS\n[x] Configure terminal\n[ ] Set up workspace\n[ ] Explore all applications\n[ ] Customize theme' }
                  }
                },
                'downloads': { type: 'dir', children: {} },
                'desktop': {
                  type: 'dir',
                  children: {
                    'welcome.txt': { type: 'file', content: '╔══════════════════════════════════════╗\n║     Welcome to NEXUS OS, Operator    ║\n║                                      ║\n║  Type "help" to get started          ║\n║  Type "neofetch" for system info     ║\n║  Type "fortune" for wisdom           ║\n╚══════════════════════════════════════╝' }
                  }
                },
                '.bashrc': { type: 'file', content: '# NEXUS Shell Configuration\nalias ll="ls -la"\nalias cls="clear"\nalias sysinfo="neofetch"\n\nexport PS1="\\u@nexus:\\w$ "' },
                '.nexushistory': { type: 'file', content: '' }
              }
            }
          }
        },
        'usr': {
          type: 'dir',
          children: {
            'bin': { type: 'dir', children: {} },
            'local': { type: 'dir', children: { 'bin': { type: 'dir', children: {} } } },
            'share': { type: 'dir', children: {} }
          }
        },
        'etc': {
          type: 'dir',
          children: {
            'nexus.conf': { type: 'file', content: '# NEXUS OS Configuration\n[system]\nname=NEXUS OS\nversion=4.2.1\nbuild=2026.09.01\ncodename=Neon Genesis\n\n[display]\ntheme=nexus-dark\naccent=#ff003c\ntransparency=0.85\n\n[network]\nhostname=nexus-os\ndomain=nexus.local' },
            'hostname': { type: 'file', content: 'nexus-os' },
            'motd': { type: 'file', content: '═══════════════════════════════════════════════\n  NEXUS OS 4.2.1 "Neon Genesis"\n  Neural Execution Unified System\n  (c) 2024-2026 NEXUS Corp.\n═══════════════════════════════════════════════\n\n  Welcome back, Operator.\n  System integrity: VERIFIED\n  Network uplink: ACTIVE\n  All subsystems: NOMINAL\n\n═══════════════════════════════════════════════' },
            'passwd': { type: 'file', content: 'root:x:0:0:root:/root:/nexus/bin/nxsh\noperator:x:1000:1000:NEXUS Operator:/home/operator:/nexus/bin/nxsh\nnexus:x:999:999:NEXUS System:/var/nexus:/usr/sbin/nologin' },
            'resolv.conf': { type: 'file', content: '# NEXUS DNS Configuration\nnameserver 10.0.0.1\nnameserver 10.0.0.2\nsearch nexus.local' }
          }
        },
        'tmp': { type: 'dir', children: {} },
        'var': {
          type: 'dir',
          children: {
            'log': {
              type: 'dir',
              children: {
                'syslog': { type: 'file', content: '[2026-09-01 00:00:01] NEXUS kernel: System boot initiated\n[2026-09-01 00:00:02] NEXUS kernel: Memory check passed (8192 MB)\n[2026-09-01 00:00:02] NEXUS kernel: Filesystem mounted /\n[2026-09-01 00:00:03] NEXUS wm: Window manager started\n[2026-09-01 00:00:03] NEXUS desktop: Desktop environment ready\n[2026-09-01 00:00:04] NEXUS net: Network uplink established\n[2026-09-01 00:00:04] NEXUS auth: Lock screen active' },
                'auth.log': { type: 'file', content: '[2026-09-01 00:00:04] auth: Lock screen engaged\n[2026-09-01 00:00:05] auth: Awaiting authentication...' }
              }
            },
            'nexus': { type: 'dir', children: {} }
          }
        },
        'nexus': {
          type: 'dir',
          children: {
            'bin': { type: 'dir', children: {} },
            'apps': { type: 'dir', children: {} },
            'themes': {
              type: 'dir',
              children: {
                'neon-red.json': { type: 'file', content: '{\n  "name": "Neon Red",\n  "accent": "#ff003c",\n  "bg": "rgba(10,5,15,0.95)",\n  "glass": "rgba(255,0,60,0.08)"\n}' },
                'cyber-night.json': { type: 'file', content: '{\n  "name": "Cyber Night",\n  "accent": "#00ccff",\n  "bg": "rgba(5,10,20,0.95)",\n  "glass": "rgba(0,204,255,0.08)"\n}' },
                'void-black.json': { type: 'file', content: '{\n  "name": "Void Black",\n  "accent": "#ff2d6b",\n  "bg": "rgba(0,0,0,0.98)",\n  "glass": "rgba(255,45,107,0.06)"\n}' }
              }
            }
          }
        }
      }
    };
  }

  // ─── Load / Save State ──────────────────────────────────────────
  _loadState() {
    try {
      if (typeof NexusStorage !== 'undefined') {
        const store = NexusStorage.getInstance ? NexusStorage.getInstance() : null;
        if (store) {
          const h = store.get('history', [], 'terminal');
          if (Array.isArray(h)) this.history = h;
          const a = store.get('aliases', {}, 'terminal');
          if (a && typeof a === 'object') this.aliases = a;
        }
      } else {
        const h = localStorage.getItem('nexus:terminal:history');
        if (h) this.history = JSON.parse(h);
        const a = localStorage.getItem('nexus:terminal:aliases');
        if (a) this.aliases = JSON.parse(a);
      }
    } catch (e) { /* ignore */ }
  }

  _saveState() {
    try {
      if (typeof NexusStorage !== 'undefined') {
        const store = NexusStorage.getInstance ? NexusStorage.getInstance() : null;
        if (store) {
          store.set('history', this.history.slice(-this.historyMax), 'terminal');
          store.set('aliases', this.aliases, 'terminal');
          return;
        }
      }
      localStorage.setItem('nexus:terminal:history', JSON.stringify(this.history.slice(-this.historyMax)));
      localStorage.setItem('nexus:terminal:aliases', JSON.stringify(this.aliases));
    } catch (e) { /* ignore */ }
  }

  // ─── Filesystem Helpers ─────────────────────────────────────────
  _resolvePath(inputPath) {
    let path = inputPath || this.cwd;
    if (!path.startsWith('/')) {
      path = this.cwd + '/' + path;
    }
    // Normalize
    const parts = path.split('/').filter(Boolean);
    const resolved = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') { resolved.pop(); continue; }
      resolved.push(part);
    }
    return '/' + resolved.join('/');
  }

  _getNode(path) {
    const resolved = this._resolvePath(path);
    if (resolved === '/') return this.fs;
    const parts = resolved.split('/').filter(Boolean);
    let node = this.fs;
    for (const part of parts) {
      if (!node || node.type !== 'dir' || !node.children[part]) return null;
      node = node.children[part];
    }
    return node;
  }

  _getParentAndName(path) {
    const resolved = this._resolvePath(path);
    const parts = resolved.split('/').filter(Boolean);
    const name = parts.pop();
    const parentPath = '/' + parts.join('/');
    const parent = this._getNode(parentPath || '/');
    return { parent, name, parentPath };
  }

  // ─── Render ─────────────────────────────────────────────────────
  render() {
    const style = document.createElement('style');
    style.textContent = this._getStyles();
    this.container.appendChild(style);
    this._styleEl = style;

    this.element = document.createElement('div');
    this.element.className = 'nexus-terminal';
    this.element.innerHTML = `
      <div class="term-toolbar">
        <div class="term-toolbar-dots">
          <span class="term-dot term-dot-red"></span>
          <span class="term-dot term-dot-yellow"></span>
          <span class="term-dot term-dot-green"></span>
        </div>
        <span class="term-toolbar-title">NEXUS Terminal — nxsh</span>
        <span class="term-toolbar-pid">PID ${this.nextPid}</span>
      </div>
      <div class="term-output" id="term-output"></div>
      <div class="term-input-line">
        <span class="term-prompt" id="term-prompt"></span>
        <input type="text" class="term-input" id="term-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
        <span class="term-cursor" id="term-cursor">█</span>
      </div>
    `;
    this.container.appendChild(this.element);

    this.outputEl = this.element.querySelector('#term-output');
    this.inputEl = this.element.querySelector('#term-input');
    this.promptEl = this.element.querySelector('#term-prompt');
    this.cursorEl = this.element.querySelector('#term-cursor');

    this._updatePrompt();
    this._printBanner();
    this.inputEl.focus();

    // Events
    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundInput = this._onInput.bind(this);
    this._boundClick = this._onClick.bind(this);
    this._boundTabComplete = this._onTabComplete.bind(this);

    this.inputEl.addEventListener('keydown', this._boundKeyDown);
    this.inputEl.addEventListener('input', this._boundInput);
    this.element.addEventListener('click', this._boundClick);
  }

  destroy() {
    this._saveState();
    if (this.matrixAnimId) cancelAnimationFrame(this.matrixAnimId);
    if (this.inputEl) this.inputEl.removeEventListener('keydown', this._boundKeyDown);
    if (this.inputEl) this.inputEl.removeEventListener('input', this._boundInput);
    if (this.element) this.element.removeEventListener('click', this._boundClick);
    if (this._styleEl) this._styleEl.remove();
    if (this.element) this.element.remove();
  }

  // ─── Event Handlers ─────────────────────────────────────────────
  _onClick() {
    this.inputEl.focus();
  }

  _onInput() {
    this._updatePrompt();
  }

  _onKeyDown(e) {
    // Ctrl+C — cancel current input
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      this._println(`<span class="term-cmd">${this._escapeHtml(this._getPromptText())}^C</span>`);
      this.inputEl.value = '';
      this.historyIndex = -1;
      this._updatePrompt();
      return;
    }

    // Ctrl+L — clear
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      this.outputEl.innerHTML = '';
      return;
    }

    // Ctrl+R — reverse search (simplified)
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      // Simple: cycle through history matches
      return;
    }

    // Enter — execute command
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = this.inputEl.value.trim();
      this._println(`<span class="term-cmd">${this._escapeHtml(this._getPromptText() + cmd)}</span>`);
      this.inputEl.value = '';

      if (cmd) {
        this.history.push(cmd);
        if (this.history.length > this.historyMax) this.history.shift();
        this.historyIndex = -1;
        this._executeCommand(cmd);
        this._saveState();
      }
      this._updatePrompt();
      this._scrollToBottom();
      return;
    }

    // Up arrow — previous history
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.history.length === 0) return;
      if (this.historyIndex === -1) this.historyIndex = this.history.length;
      this.historyIndex = Math.max(0, this.historyIndex - 1);
      this.inputEl.value = this.history[this.historyIndex] || '';
      this._moveCursorEnd();
      return;
    }

    // Down arrow — next history
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex === -1) return;
      this.historyIndex = Math.min(this.history.length, this.historyIndex + 1);
      this.inputEl.value = this.historyIndex < this.history.length ? this.history[this.historyIndex] : '';
      this._moveCursorEnd();
      return;
    }

    // Tab — autocomplete
    if (e.key === 'Tab') {
      e.preventDefault();
      this._onTabComplete();
      return;
    }
  }

  _moveCursorEnd() {
    const len = this.inputEl.value.length;
    this.inputEl.setSelectionRange(len, len);
  }

  _onTabComplete() {
    const val = this.inputEl.value;
    const parts = val.split(/\s+/);
    const isCommand = parts.length <= 1 && !val.includes(' ');
    const partial = parts[parts.length - 1] || '';

    let matches = [];

    if (isCommand) {
      // Complete commands
      const cmds = Object.keys(this._getCommands());
      matches = cmds.filter(c => c.startsWith(partial));
    } else {
      // Complete file paths
      const lastSlash = partial.lastIndexOf('/');
      let dirPath, prefix;
      if (lastSlash >= 0) {
        dirPath = partial.substring(0, lastSlash) || '/';
        prefix = partial.substring(lastSlash + 1);
      } else {
        dirPath = this.cwd;
        prefix = partial;
      }
      const node = this._getNode(dirPath);
      if (node && node.type === 'dir') {
        matches = Object.keys(node.children).filter(n => n.startsWith(prefix));
        if (lastSlash >= 0) {
          matches = matches.map(m => (dirPath === '/' ? '/' : dirPath + '/') + m);
        }
      }
    }

    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      this.inputEl.value = parts.join(' ');
      this._moveCursorEnd();
    } else if (matches.length > 1) {
      this._println(`<span class="term-cmd">${this._escapeHtml(this._getPromptText() + val)}</span>`);
      this._println(matches.map(m => `<span class="term-info">${this._escapeHtml(m)}</span>`).join('  '));
    }
  }

  // ─── Prompt & Output Helpers ────────────────────────────────────
  _getPromptText() {
    const user = this.env.USER || 'operator';
    let dir = this.cwd;
    if (dir.startsWith(this.env.HOME)) {
      dir = '~' + dir.substring(this.env.HOME.length);
    }
    return `${user}@nexus:${dir}$ `;
  }

  _updatePrompt() {
    if (this.promptEl) {
      this.promptEl.textContent = this._getPromptText();
    }
  }

  _print(text) {
    const span = document.createElement('span');
    span.innerHTML = text;
    this.outputEl.appendChild(span);
    this._scrollToBottom();
  }

  _println(text) {
    const div = document.createElement('div');
    div.className = 'term-line';
    div.innerHTML = text;
    this.outputEl.appendChild(div);
    this._scrollToBottom();
  }

  _printError(text) {
    this._println(`<span class="term-error">⚠ ${this._escapeHtml(text)}</span>`);
  }

  _printSuccess(text) {
    this._println(`<span class="term-success">✓ ${this._escapeHtml(text)}</span>`);
  }

  _scrollToBottom() {
    requestAnimationFrame(() => {
      this.outputEl.scrollTop = this.outputEl.scrollHeight;
    });
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  _printTable(headers, rows) {
    const colWidths = headers.map((h, i) => {
      let max = h.length;
      rows.forEach(r => { if (r[i] && r[i].length > max) max = r[i].length; });
      return max + 2;
    });
    let output = '<span class="term-table">';
    // Header
    output += headers.map((h, i) => `<span class="term-th">${this._escapeHtml(h.padEnd(colWidths[i]))}</span>`).join('') + '\n';
    // Separator
    output += '<span class="term-sep">' + colWidths.map(w => '─'.repeat(w)).join('') + '</span>\n';
    // Rows
    rows.forEach(row => {
      output += row.map((cell, i) => `<span class="term-td">${this._escapeHtml((cell || '').padEnd(colWidths[i]))}</span>`).join('') + '\n';
    });
    output += '</span>';
    this._println(`<pre class="term-pretable">${output}</pre>`);
  }

  // ─── Banner ─────────────────────────────────────────────────────
  _printBanner() {
    const logo = `
<span class="term-logo">  ╔╗╔╔═╗╗  ╔╦╗╦  ╦╔═╗</span>
<span class="term-logo">  ║║║║╣ ╚╗╔╝║ ║  ║╚═╗</span>
<span class="term-logo">  ╝╚╝╚═╝ ╚╝ ╩╩═╝╩╚═╝</span>
<span class="term-logo">  OPERATING SYSTEM v4.2.1</span>`;
    this._println(logo);
    this._println('');
    this._println(`<span class="term-info">NEXUS OS 4.2.1 "Neon Genesis" — Neural Execution Unified System</span>`);
    this._println(`<span class="term-dim">Copyright (c) 2024-2026 NEXUS Corp. All rights reserved.</span>`);
    this._println(`<span class="term-dim">Type </span><span class="term-info">help</span><span class="term-dim"> for available commands, </span><span class="term-info">fortune</span><span class="term-dim"> for wisdom.</span>`);
    this._println('');
  }

  // ─── Command Registry ───────────────────────────────────────────
  _getCommands() {
    return {
      help:       { fn: this._cmdHelp, desc: 'List all available commands' },
      clear:      { fn: this._cmdClear, desc: 'Clear the terminal screen' },
      echo:       { fn: this._cmdEcho, desc: 'Print text to terminal' },
      date:       { fn: this._cmdDate, desc: 'Display current date and time' },
      whoami:     { fn: this._cmdWhoami, desc: 'Display current user' },
      uname:      { fn: this._cmdUname, desc: 'Display system information' },
      ls:         { fn: this._cmdLs, desc: 'List directory contents' },
      cd:         { fn: this._cmdCd, desc: 'Change current directory' },
      cat:        { fn: this._cmdCat, desc: 'Display file contents' },
      mkdir:      { fn: this._cmdMkdir, desc: 'Create a directory' },
      touch:      { fn: this._cmdTouch, desc: 'Create an empty file' },
      rm:         { fn: this._cmdRm, desc: 'Remove files or directories' },
      cp:         { fn: this._cmdCp, desc: 'Copy files' },
      mv:         { fn: this._cmdMv, desc: 'Move or rename files' },
      find:       { fn: this._cmdFind, desc: 'Search for files by name' },
      grep:       { fn: this._cmdGrep, desc: 'Search file contents for pattern' },
      tree:       { fn: this._cmdTree, desc: 'Display directory tree' },
      ps:         { fn: this._cmdPs, desc: 'List running processes' },
      kill:       { fn: this._cmdKill, desc: 'Terminate a process by PID' },
      top:        { fn: this._cmdTop, desc: 'System resource monitor' },
      neofetch:   { fn: this._cmdNeofetch, desc: 'System info with ASCII art' },
      weather:    { fn: this._cmdWeather, desc: 'Display weather for a city' },
      calc:       { fn: this._cmdCalc, desc: 'Evaluate a math expression' },
      color:      { fn: this._cmdColor, desc: 'Change terminal accent color' },
      theme:      { fn: this._cmdTheme, desc: 'Switch OS theme' },
      app:        { fn: this._cmdApp, desc: 'Launch an application' },
      apps:       { fn: this._cmdApps, desc: 'List installed applications' },
      fortune:    { fn: this._cmdFortune, desc: 'Display a random wisdom quote' },
      matrix:     { fn: this._cmdMatrix, desc: 'Start matrix rain animation' },
      cowsay:     { fn: this._cmdCowsay, desc: 'ASCII cow with speech bubble' },
      figlet:     { fn: this._cmdFiglet, desc: 'Large ASCII banner text' },
      ping:       { fn: this._cmdPing, desc: 'Simulate network ping' },
      curl:       { fn: this._cmdCurl, desc: 'Simulate HTTP request' },
      ssh:        { fn: this._cmdSsh, desc: 'Simulate SSH connection' },
      sudo:       { fn: this._cmdSudo, desc: 'Attempt superuser command' },
      exit:       { fn: this._cmdExit, desc: 'Close terminal' },
      history:    { fn: this._cmdHistory, desc: 'Show command history' },
      alias:      { fn: this._cmdAlias, desc: 'Manage command aliases' },
      unalias:    { fn: this._cmdUnalias, desc: 'Remove a command alias' },
      env:        { fn: this._cmdEnv, desc: 'Show environment variables' },
      set:        { fn: this._cmdSet, desc: 'Set environment variable' },
      export:     { fn: this._cmdExport, desc: 'Export environment variable' },
      pwd:        { fn: this._cmdPwd, desc: 'Print working directory' },
      head:       { fn: this._cmdHead, desc: 'Display first lines of file' },
      tail:       { fn: this._cmdTail, desc: 'Display last lines of file' },
      wc:         { fn: this._cmdWc, desc: 'Count lines, words, characters' },
      sort:       { fn: this._cmdSort, desc: 'Sort lines of text' },
      uniq:       { fn: this._cmdUniq, desc: 'Remove duplicate lines' },
      uptime:     { fn: this._cmdUptime, desc: 'Show system uptime' },
      hostname:   { fn: this._cmdHostname, desc: 'Show system hostname' },
      ifconfig:   { fn: this._cmdIfconfig, desc: 'Display network interfaces' },
      df:         { fn: this._cmdDf, desc: 'Display disk usage' },
      free:       { fn: this._cmdFree, desc: 'Display memory usage' },
      man:        { fn: this._cmdMan, desc: 'Show command manual page' },
      write:      { fn: this._cmdWrite, desc: 'Write text to a file' },
      chmod:      { fn: this._cmdChmod, desc: 'Change file permissions (simulated)' },
      which:      { fn: this._cmdWhich, desc: 'Locate a command' },
    };
  }

  // ─── Command Execution ──────────────────────────────────────────
  _executeCommand(input) {
    // Handle pipes
    if (input.includes('|')) {
      this._executePiped(input);
      return;
    }

    // Parse command and args
    const tokens = this._tokenize(input);
    if (tokens.length === 0) return;

    let cmdName = tokens[0];
    let args = tokens.slice(1);

    // Check aliases
    if (this.aliases[cmdName]) {
      const expanded = this.aliases[cmdName];
      const expandedTokens = this._tokenize(expanded);
      cmdName = expandedTokens[0];
      args = [...expandedTokens.slice(1), ...args];
    }

    const commands = this._getCommands();
    const cmd = commands[cmdName];

    if (!cmd) {
      this._printError(`nxsh: command not found: ${cmdName}`);
      this._println(`<span class="term-dim">  Type 'help' for available commands.</span>`);
      return;
    }

    try {
      cmd.fn.call(this, args);
    } catch (err) {
      this._printError(`Error executing ${cmdName}: ${err.message}`);
    }

    this.commandCount++;
  }

  _tokenize(input) {
    const tokens = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (inQuote) {
        if (ch === quoteChar) {
          inQuote = false;
        } else {
          current += ch;
        }
      } else if (ch === '"' || ch === "'") {
        inQuote = true;
        quoteChar = ch;
      } else if (ch === ' ' || ch === '\t') {
        if (current) { tokens.push(current); current = ''; }
      } else {
        current += ch;
      }
    }
    if (current) tokens.push(current);
    return tokens;
  }

  _executePiped(input) {
    const pipes = input.split('|').map(s => s.trim());
    let prevOutput = '';

    for (let i = 0; i < pipes.length; i++) {
      const tokens = this._tokenize(pipes[i]);
      if (tokens.length === 0) continue;
      const cmdName = tokens[0];
      const args = tokens.slice(1);

      if (i > 0) {
        // Pipe filter commands
        if (cmdName === 'grep') {
          const pattern = args[0] || '';
          prevOutput = prevOutput.split('\n').filter(l => l.includes(pattern)).join('\n');
        } else if (cmdName === 'head') {
          const n = parseInt(args[0]) || 10;
          prevOutput = prevOutput.split('\n').slice(0, n).join('\n');
        } else if (cmdName === 'tail') {
          const n = parseInt(args[0]) || 10;
          prevOutput = prevOutput.split('\n').slice(-n).join('\n');
        } else if (cmdName === 'sort') {
          prevOutput = prevOutput.split('\n').sort().join('\n');
        } else if (cmdName === 'uniq') {
          const lines = prevOutput.split('\n');
          prevOutput = lines.filter((l, idx) => idx === 0 || l !== lines[idx - 1]).join('\n');
        } else if (cmdName === 'wc') {
          const lines = prevOutput.split('\n');
          const words = prevOutput.split(/\s+/).filter(Boolean).length;
          prevOutput = `  ${lines.length}  ${words}  ${prevOutput.length}`;
        } else {
          this._printError(`Pipe not supported for: ${cmdName}`);
          return;
        }
      } else {
        // First command — capture output
        const captured = this._captureOutput(cmdName, args);
        if (captured === null) return; // Command printed directly, no piping
        prevOutput = captured;
      }
    }

    if (prevOutput) {
      this._println(`<span class="term-output">${this._escapeHtml(prevOutput)}</span>`);
    }
  }

  _captureOutput(cmdName, args) {
    const commands = this._getCommands();
    const cmd = commands[cmdName];
    if (!cmd) {
      this._printError(`nxsh: command not found: ${cmdName}`);
      return null;
    }

    // Capture by temporarily overriding _println
    const lines = [];
    const origPrintln = this._println.bind(this);
    this._println = (text) => {
      // Strip HTML tags for pipe
      const tmp = document.createElement('div');
      tmp.innerHTML = text;
      lines.push(tmp.textContent || tmp.innerText || '');
    };

    try {
      cmd.fn.call(this, args);
    } catch (e) {
      this._println = origPrintln;
      this._printError(e.message);
      return null;
    }

    this._println = origPrintln;
    return lines.join('\n');
  }

  // ═══════════════════════════════════════════════════════════════
  //  COMMAND IMPLEMENTATIONS
  // ═══════════════════════════════════════════════════════════════

  _cmdHelp() {
    this._println('<span class="term-info">═══ NEXUS Terminal — Available Commands ═══</span>');
    this._println('');
    const commands = this._getCommands();
    const entries = Object.entries(commands).sort((a, b) => a[0].localeCompare(b[0]));
    const rows = entries.map(([name, cmd]) => [name, cmd.desc]);
    this._printTable(['COMMAND', 'DESCRIPTION'], rows);
    this._println('');
    this._println('<span class="term-dim">Features: Tab completion • Command history (↑↓) • Pipes (|) • Aliases</span>');
  }

  _cmdClear() {
    this.outputEl.innerHTML = '';
  }

  _cmdEcho(args) {
    const text = args.join(' ');
    // Handle environment variable expansion
    const expanded = text.replace(/\$(\w+)/g, (_, name) => this.env[name] || '');
    this._println(this._escapeHtml(expanded));
  }

  _cmdDate() {
    const now = new Date();
    const formatted = now.toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    this._println(`<span class="term-info">${this._escapeHtml(formatted)}</span>`);
    this._println(`<span class="term-dim">ISO: ${now.toISOString()}</span>`);
    this._println(`<span class="term-dim">Epoch: ${Math.floor(now.getTime() / 1000)}</span>`);
  }

  _cmdWhoami() {
    this._println(`<span class="term-info">${this.env.USER}</span>`);
  }

  _cmdUname(args) {
    if (args.includes('-a')) {
      this._println('NEXUS nexus-os 4.2.1 Neon Genesis #1 SMP PREEMPT_DYNAMIC x86_64 NEXUS/OS');
    } else if (args.includes('-r')) {
      this._println('4.2.1-nexus');
    } else if (args.includes('-s')) {
      this._println('NEXUS');
    } else {
      this._println('NEXUS OS 4.2.1 Neural Execution Unified System x86_64');
    }
  }

  _cmdLs(args) {
    let targetPath = this.cwd;
    let longFormat = false;
    let showAll = false;

    for (const arg of args) {
      if (arg === '-l' || arg === '-la' || arg === '-al') { longFormat = true; if (arg.includes('a')) showAll = true; }
      else if (arg === '-a') showAll = true;
      else if (!arg.startsWith('-')) targetPath = arg;
    }

    const node = this._getNode(targetPath);
    if (!node) { this._printError(`ls: cannot access '${targetPath}': No such file or directory`); return; }
    if (node.type !== 'dir') { this._println(this._escapeHtml(targetPath)); return; }

    let entries = Object.entries(node.children);
    if (!showAll) entries = entries.filter(([name]) => !name.startsWith('.'));
    entries.sort((a, b) => a[0].localeCompare(b[0]));

    if (entries.length === 0) {
      this._println('<span class="term-dim">(empty directory)</span>');
      return;
    }

    if (longFormat) {
      const rows = entries.map(([name, child]) => {
        const type = child.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--';
        const size = child.type === 'file' ? String((child.content || '').length) : '4096';
        const date = 'Sep 01 00:00';
        return [type, '1', 'operator', 'operator', size, date, name + (child.type === 'dir' ? '/' : '')];
      });
      this._printTable(['PERMS', 'LINK', 'OWNER', 'GROUP', 'SIZE', 'DATE', 'NAME'], rows);
    } else {
      const formatted = entries.map(([name, child]) => {
        if (child.type === 'dir') return `<span class="term-dir">${this._escapeHtml(name)}/</span>`;
        return `<span class="term-file">${this._escapeHtml(name)}</span>`;
      });
      this._println(formatted.join('  '));
    }
  }

  _cmdCd(args) {
    const target = args[0] || this.env.HOME;
    let resolved;

    if (target === '-') {
      resolved = this._prevCwd || this.env.HOME;
    } else if (target === '~') {
      resolved = this.env.HOME;
    } else if (target.startsWith('~/')) {
      resolved = this.env.HOME + target.substring(1);
    } else {
      resolved = this._resolvePath(target);
    }

    const node = this._getNode(resolved);
    if (!node) { this._printError(`cd: no such file or directory: ${target}`); return; }
    if (node.type !== 'dir') { this._printError(`cd: not a directory: ${target}`); return; }

    this._prevCwd = this.cwd;
    this.cwd = resolved === '' ? '/' : resolved;
    this._updatePrompt();
  }

  _cmdCat(args) {
    if (args.length === 0) { this._printError('cat: missing file argument'); return; }
    for (const file of args) {
      const node = this._getNode(file);
      if (!node) { this._printError(`cat: ${file}: No such file or directory`); return; }
      if (node.type === 'dir') { this._printError(`cat: ${file}: Is a directory`); return; }
      this._println(`<span class="term-output">${this._escapeHtml(node.content || '')}</span>`);
    }
  }

  _cmdMkdir(args) {
    if (args.length === 0) { this._printError('mkdir: missing directory name'); return; }
    const name = args[0];
    const { parent, name: dirName } = this._getParentAndName(name);
    if (!parent || parent.type !== 'dir') { this._printError(`mkdir: cannot create directory '${name}'`); return; }
    if (parent.children[dirName]) { this._printError(`mkdir: cannot create directory '${name}': File exists`); return; }
    parent.children[dirName] = { type: 'dir', children: {} };
    this._printSuccess(`Created directory: ${name}`);
  }

  _cmdTouch(args) {
    if (args.length === 0) { this._printError('touch: missing file argument'); return; }
    for (const file of args) {
      const { parent, name: fileName } = this._getParentAndName(file);
      if (!parent || parent.type !== 'dir') { this._printError(`touch: cannot touch '${file}'`); return; }
      if (!parent.children[fileName]) {
        parent.children[fileName] = { type: 'file', content: '' };
      }
    }
  }

  _cmdRm(args) {
    let recursive = false;
    const files = [];
    for (const arg of args) {
      if (arg === '-r' || arg === '-rf' || arg === '-R') recursive = true;
      else if (arg === '-f') { /* force, ignore */ }
      else files.push(arg);
    }
    if (files.length === 0) { this._printError('rm: missing operand'); return; }

    for (const file of files) {
      const node = this._getNode(file);
      if (!node) { this._printError(`rm: cannot remove '${file}': No such file or directory`); return; }
      if (node.type === 'dir' && !recursive) { this._printError(`rm: cannot remove '${file}': Is a directory (use -r)`); return; }
      const { parent, name: fName } = this._getParentAndName(file);
      if (parent && parent.children) {
        delete parent.children[fName];
        this._printSuccess(`Removed: ${file}`);
      }
    }
  }

  _cmdCp(args) {
    if (args.length < 2) { this._printError('cp: missing operand. Usage: cp <source> <destination>'); return; }
    const src = args[0];
    const dst = args[1];
    const srcNode = this._getNode(src);
    if (!srcNode) { this._printError(`cp: cannot stat '${src}': No such file or directory`); return; }
    if (srcNode.type === 'dir') { this._printError('cp: use -r to copy directories'); return; }

    const { parent: dstParent, name: dstName } = this._getParentAndName(dst);
    if (!dstParent || dstParent.type !== 'dir') { this._printError(`cp: cannot create '${dst}'`); return; }
    dstParent.children[dstName] = { type: 'file', content: srcNode.content };
    this._printSuccess(`Copied: ${src} → ${dst}`);
  }

  _cmdMv(args) {
    if (args.length < 2) { this._printError('mv: missing operand. Usage: mv <source> <destination>'); return; }
    const src = args[0];
    const dst = args[1];
    const srcNode = this._getNode(src);
    if (!srcNode) { this._printError(`mv: cannot stat '${src}': No such file or directory`); return; }

    const { parent: srcParent, name: srcName } = this._getParentAndName(src);
    const { parent: dstParent, name: dstName } = this._getParentAndName(dst);
    if (!dstParent || dstParent.type !== 'dir') { this._printError(`mv: cannot move to '${dst}'`); return; }

    dstParent.children[dstName] = srcNode;
    if (srcParent && srcParent.children) delete srcParent.children[srcName];
    this._printSuccess(`Moved: ${src} → ${dst}`);
  }

  _cmdFind(args) {
    const pattern = args[0] || '';
    if (!pattern) { this._printError('find: missing search pattern'); return; }
    const results = [];
    const search = (node, path) => {
      if (node.type === 'dir') {
        for (const [name, child] of Object.entries(node.children)) {
          const fullPath = path + '/' + name;
          if (name.toLowerCase().includes(pattern.toLowerCase())) {
            results.push({ path: fullPath, type: child.type });
          }
          if (child.type === 'dir') search(child, fullPath);
        }
      }
    };
    search(this.fs, '');
    if (results.length === 0) {
      this._println(`<span class="term-dim">No files matching '${pattern}'</span>`);
    } else {
      results.forEach(r => {
        const cls = r.type === 'dir' ? 'term-dir' : 'term-file';
        this._println(`<span class="${cls}">${this._escapeHtml(r.path)}</span>`);
      });
      this._println(`<span class="term-dim">${results.length} result(s) found.</span>`);
    }
  }

  _cmdGrep(args) {
    if (args.length < 2) { this._printError('grep: Usage: grep <pattern> <file>'); return; }
    const pattern = args[0];
    const filePath = args[1];
    const node = this._getNode(filePath);
    if (!node) { this._printError(`grep: ${filePath}: No such file or directory`); return; }
    if (node.type === 'dir') { this._printError(`grep: ${filePath}: Is a directory`); return; }

    const lines = (node.content || '').split('\n');
    let matchCount = 0;
    const regex = new RegExp(pattern, 'gi');
    lines.forEach((line, idx) => {
      if (regex.test(line)) {
        matchCount++;
        const highlighted = this._escapeHtml(line).replace(
          new RegExp(this._escapeHtml(pattern), 'gi'),
          match => `<span class="term-highlight">${match}</span>`
        );
        this._println(`<span class="term-dim">${idx + 1}:</span> ${highlighted}`);
      }
    });
    if (matchCount === 0) {
      this._println(`<span class="term-dim">No matches for '${pattern}'</span>`);
    } else {
      this._println(`<span class="term-dim">${matchCount} match(es) found.</span>`);
    }
  }

  _cmdTree(args) {
    const targetPath = args[0] || this.cwd;
    const node = this._getNode(targetPath);
    if (!node || node.type !== 'dir') { this._printError(`tree: '${targetPath}' is not a directory`); return; }

    this._println(`<span class="term-dir">${this._escapeHtml(targetPath)}</span>`);
    let dirCount = 0, fileCount = 0;

    const printNode = (n, prefix, name) => {
      if (n.type === 'dir') dirCount++;
      else fileCount++;
      const cls = n.type === 'dir' ? 'term-dir' : 'term-file';
      this._println(`${prefix}<span class="${cls}">${this._escapeHtml(name)}</span>`);

      if (n.type === 'dir') {
        const entries = Object.entries(n.children).sort((a, b) => a[0].localeCompare(b[0]));
        entries.forEach(([childName, child], idx) => {
          const isLast = idx === entries.length - 1;
          const connector = isLast ? '└── ' : '├── ';
          const nextPrefix = prefix + (isLast ? '    ' : '│   ');
          printNode(child, prefix + connector, childName);
        });
      }
    };

    const entries = Object.entries(node.children).sort((a, b) => a[0].localeCompare(b[0]));
    entries.forEach(([name, child], idx) => {
      const isLast = idx === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      printNode(child, connector, name);
    });

    this._println(`<span class="term-dim">\n${dirCount} directories, ${fileCount} files</span>`);
  }

  _cmdPs() {
    const rows = this.processes.map(p => [
      String(p.pid), p.name, p.state, p.cpu + '%', p.mem + ' MB', 'operator'
    ]);
    this._printTable(['PID', 'COMMAND', 'STATE', 'CPU', 'MEM', 'USER'], rows);
  }

  _cmdKill(args) {
    const pid = parseInt(args[0]);
    if (isNaN(pid)) { this._printError('kill: usage: kill <pid>'); return; }
    const idx = this.processes.findIndex(p => p.pid === pid);
    if (idx === -1) { this._printError(`kill: (${pid}) - No such process`); return; }
    if (pid === 1) { this._printError('kill: cannot terminate nexus-kernel (PID 1)'); return; }
    const name = this.processes[idx].name;
    this.processes.splice(idx, 1);
    this._printSuccess(`Process ${pid} (${name}) terminated.`);
  }

  _cmdTop() {
    this._println('<span class="term-info">═══ NEXUS System Monitor ═══</span>');
    this._println('');

    // CPU bars
    const cpuUsage = Math.floor(Math.random() * 30) + 5;
    const memUsage = Math.floor(Math.random() * 40) + 30;
    const cpuBar = '█'.repeat(Math.floor(cpuUsage / 5)) + '░'.repeat(20 - Math.floor(cpuUsage / 5));
    const memBar = '█'.repeat(Math.floor(memUsage / 5)) + '░'.repeat(20 - Math.floor(memUsage / 5));

    this._println(`<span class="term-info">CPU:</span> [${cpuBar}] ${cpuUsage}%`);
    this._println(`<span class="term-info">MEM:</span> [${memBar}] ${memUsage}% (${Math.floor(memUsage * 81.92)} / 8192 MB)`);
    this._println(`<span class="term-info">SWP:</span> [${'░'.repeat(20)}] 0%`);
    this._println('');

    const rows = this.processes.map(p => [
      String(p.pid), 'operator', p.state, p.cpu + '%', p.mem + ' MB',
      this._formatUptime(Date.now() - this.startTime), p.name
    ]);
    this._printTable(['PID', 'USER', 'S', 'CPU%', 'MEM', 'TIME+', 'COMMAND'], rows);
  }

  _cmdNeofetch() {
    const uptime = this._formatUptime(Date.now() - this.startTime);
    const now = new Date();
    const logo = [
      '    ╔═══════════╗   ',
      '    ║ ╔═══════╗ ║   ',
      '    ║ ║ N E X ║ ║   ',
      '    ║ ║ U S   ║ ║   ',
      '    ║ ╚═══════╝ ║   ',
      '    ║  ╔═════╗  ║   ',
      '    ║  ║ 4.2 ║  ║   ',
      '    ║  ╚═════╝  ║   ',
      '    ╚═══════════╝   ',
      '   ╱╱╱╱╱╱╱╱╱╱╱╱╱╱   '
    ];

    const info = [
      `<span class="term-info">operator</span><span class="term-dim">@</span><span class="term-info">nexus-os</span>`,
      `<span class="term-dim">──────────────────</span>`,
      `<span class="term-info">OS:</span> NEXUS OS 4.2.1 Neon Genesis`,
      `<span class="term-info">Kernel:</span> 4.2.1-nexus`,
      `<span class="term-info">Uptime:</span> ${uptime}`,
      `<span class="term-info">Shell:</span> nxsh (NEXUS Shell)`,
      `<span class="term-info">Resolution:</span> ${window.innerWidth}x${window.innerHeight}`,
      `<span class="term-info">Theme:</span> nexus-dark`,
      `<span class="term-info">Accent:</span> ${this.accentColor}`,
      `<span class="term-info">CPU:</span> NEXUS Neural Core (8) @ 4.20GHz`,
      `<span class="term-info">Memory:</span> ${Math.floor(Math.random() * 2000 + 1500)} MB / 8192 MB`,
      `<span class="term-info">GPU:</span> NEXUS Holographic Renderer`
    ];

    const lines = Math.max(logo.length, info.length);
    for (let i = 0; i < lines; i++) {
      const logoLine = logo[i] || '                    ';
      const infoLine = info[i] || '';
      this._println(`<span class="term-logo">${logoLine}</span>  ${infoLine}`);
    }
    this._println('');
    // Color blocks
    const colors = ['#ff003c', '#ff2d6b', '#ff4488', '#ff6699', '#00ccff', '#00ff88', '#ffaa00', '#cc99ff'];
    const blocks = colors.map(c => `<span style="background:${c};color:${c};padding:0 4px;">██</span>`).join('');
    this._println('                    ' + blocks);
  }

  _cmdWeather(args) {
    const city = args.length > 0 ? args.join(' ') : 'Neo Tokyo';
    const hash = this._hashString(city);
    const conditions = ['Sunny', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Heavy Rain', 'Thunderstorm', 'Snow', 'Fog', 'Clear Night', 'Windy'];
    const condition = conditions[hash % conditions.length];
    const temp = Math.floor((hash % 40) - 5); // -5 to 35
    const humidity = 30 + (hash % 60);
    const wind = Math.floor(hash % 50);
    const pressure = 990 + (hash % 50);
    const visibility = 5 + (hash % 15);
    const uv = hash % 12;

    this._println(`<span class="term-info">═══ Weather: ${this._escapeHtml(city)} ═══</span>`);
    this._println('');

    const icons = {
      'Sunny': '☀️', 'Partly Cloudy': '⛅', 'Overcast': '☁️', 'Light Rain': '🌦️',
      'Heavy Rain': '🌧️', 'Thunderstorm': '⛈️', 'Snow': '❄️', 'Fog': '🌫️',
      'Clear Night': '🌙', 'Windy': '💨'
    };

    this._println(`  ${icons[condition] || '🌤️'}  <span class="term-info" style="font-size:1.2em;">${temp}°C</span>  ${condition}`);
    this._println('');
    this._println(`  Humidity:    ${humidity}%`);
    this._println(`  Wind:        ${wind} km/h`);
    this._println(`  Pressure:    ${pressure} hPa`);
    this._println(`  Visibility:  ${visibility} km`);
    this._println(`  UV Index:    ${uv}`);
    this._println('');

    // 5-day forecast
    this._println('  <span class="term-info">5-Day Forecast:</span>');
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    days.forEach((day, i) => {
      const dayHash = this._hashString(city + day);
      const dayCond = conditions[dayHash % conditions.length];
      const high = temp + (dayHash % 8) - 2;
      const low = temp - (dayHash % 6) - 2;
      this._println(`  ${day}  ${icons[dayCond] || '🌤️'}  ${this._escapeHtml(dayCond).padEnd(16)} ${high}° / ${low}°`);
    });
    this._println('');
    this._println('<span class="term-dim">  Data simulated — consistent per city name.</span>');
  }

  _cmdCalc(args) {
    if (args.length === 0) { this._printError('calc: usage: calc <expression>'); return; }
    const expr = args.join(' ');
    try {
      // Safe math evaluation
      const sanitized = expr
        .replace(/\^/g, '**')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e(?!\w)/gi, 'Math.E')
        .replace(/sin\(/gi, 'Math.sin(')
        .replace(/cos\(/gi, 'Math.cos(')
        .replace(/tan\(/gi, 'Math.tan(')
        .replace(/sqrt\(/gi, 'Math.sqrt(')
        .replace(/log\(/gi, 'Math.log10(')
        .replace(/ln\(/gi, 'Math.log(')
        .replace(/abs\(/gi, 'Math.abs(');

      if (/[^0-9+\-*/().%\s\w]/.test(sanitized.replace(/Math\.\w+/g, ''))) {
        this._printError('calc: invalid characters in expression');
        return;
      }
      const result = Function('"use strict"; return (' + sanitized + ')')();
      if (typeof result === 'number' && isFinite(result)) {
        this._println(`<span class="term-info">= ${result}</span>`);
      } else {
        this._printError('calc: result is not a finite number');
      }
    } catch (e) {
      this._printError(`calc: invalid expression — ${e.message}`);
    }
  }

  _cmdColor(args) {
    const hex = args[0];
    if (!hex || !/^#?[0-9a-fA-F]{3,6}$/.test(hex)) {
      this._printError('color: usage: color <hex> (e.g., color #ff003c)');
      return;
    }
    this.accentColor = hex.startsWith('#') ? hex : '#' + hex;
    this.element.style.setProperty('--term-accent', this.accentColor);
    this._printSuccess(`Terminal accent color set to ${this.accentColor}`);
  }

  _cmdTheme(args) {
    const name = args[0];
    if (!name) { this._printError('theme: usage: theme <neon-red|cyber-night|void-black>'); return; }
    const themes = ['neon-red', 'cyber-night', 'void-black'];
    if (!themes.includes(name)) {
      this._printError(`theme: unknown theme '${name}'. Available: ${themes.join(', ')}`);
      return;
    }
    try {
      if (typeof NexusEventBus !== 'undefined') {
        const bus = NexusEventBus.getInstance ? NexusEventBus.getInstance() : null;
        if (bus) bus.emit('system:theme-change', { theme: name });
      }
    } catch (e) { /* ignore */ }
    this._printSuccess(`Theme switched to: ${name}`);
    this._println('<span class="term-dim">(Theme change event emitted)</span>');
  }

  _cmdApp(args) {
    const name = args[0];
    if (!name) { this._printError('app: usage: app <name>'); return; }
    try {
      if (typeof NexusEventBus !== 'undefined') {
        const bus = NexusEventBus.getInstance ? NexusEventBus.getInstance() : null;
        if (bus) bus.emit('system:launch-app', { app: name });
      }
    } catch (e) { /* ignore */ }
    this._println(`<span class="term-info">Launching: ${this._escapeHtml(name)}...</span>`);
  }

  _cmdApps() {
    this._println('<span class="term-info">═══ Installed Applications ═══</span>');
    this._println('');
    const apps = [
      ['terminal', 'NEXUS Terminal', 'system'],
      ['code-editor', 'Code Editor', 'tools'],
      ['calculator', 'Scientific Calculator', 'tools'],
      ['clock', 'Clock & Timer', 'tools'],
      ['weather', 'Weather Station', 'tools'],
      ['notepad', 'Notepad', 'tools'],
      ['paint', 'Paint Studio', 'media'],
      ['file-explorer', 'File Explorer', 'system'],
      ['settings', 'System Settings', 'system'],
    ];
    this._printTable(['NAME', 'DISPLAY', 'CATEGORY'], apps);
  }

  _cmdFortune() {
    const fortune = this.fortunes[Math.floor(Math.random() * this.fortunes.length)];
    this._println('');
    this._println(`  <span class="term-fortune">${this._escapeHtml(fortune)}</span>`);
    this._println('');
  }

  _cmdMatrix() {
    this._println('<span class="term-info">Starting Matrix Rain... (click terminal to stop)</span>');
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;pointer-events:auto;cursor:pointer;';
    this.element.style.position = 'relative';
    this.element.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = this.element.offsetWidth;
    canvas.height = this.element.offsetHeight;

    const cols = Math.floor(canvas.width / 14);
    const drops = Array(cols).fill(1);
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789NEXUS';

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff003c';
      ctx.font = '14px monospace';

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * 14;
        const y = drops[i] * 14;
        ctx.globalAlpha = 0.6 + Math.random() * 0.4;
        ctx.fillText(char, x, y);
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      ctx.globalAlpha = 1;
      this.matrixAnimId = requestAnimationFrame(draw);
    };

    const stopMatrix = () => {
      cancelAnimationFrame(this.matrixAnimId);
      this.matrixAnimId = null;
      canvas.remove();
      this.element.removeEventListener('click', stopMatrix);
    };

    canvas.addEventListener('click', (e) => {
      e.stopPropagation();
      stopMatrix();
      this._println('<span class="term-dim">Matrix rain stopped.</span>');
      this.inputEl.focus();
    });

    draw();
  }

  _cmdCowsay(args) {
    const text = args.length > 0 ? args.join(' ') : 'Moo! Welcome to NEXUS.';
    const border = '─'.repeat(text.length + 2);
    const cow = `
 ┌${border}┐
 │ ${this._escapeHtml(text)} │
 └${border}┘
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
    this._println(`<pre class="term-ascii">${cow}</pre>`);
  }

  _cmdFiglet(args) {
    const text = args.length > 0 ? args.join(' ').toUpperCase().substring(0, 20) : 'NEXUS';
    const font = {
      'A': [' ███ ', '█   █', '█████', '█   █', '█   █'],
      'B': ['████ ', '█   █', '████ ', '█   █', '████ '],
      'C': [' ████', '█    ', '█    ', '█    ', ' ████'],
      'D': ['████ ', '█   █', '█   █', '█   █', '████ '],
      'E': ['█████', '█    ', '███  ', '█    ', '█████'],
      'F': ['█████', '█    ', '███  ', '█    ', '█    '],
      'G': [' ████', '█    ', '█  ██', '█   █', ' ████'],
      'H': ['█   █', '█   █', '█████', '█   █', '█   █'],
      'I': ['█████', '  █  ', '  █  ', '  █  ', '█████'],
      'J': ['█████', '   █ ', '   █ ', '█  █ ', ' ██  '],
      'K': ['█  █ ', '█ █  ', '██   ', '█ █  ', '█  █ '],
      'L': ['█    ', '█    ', '█    ', '█    ', '█████'],
      'M': ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
      'N': ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
      'O': [' ███ ', '█   █', '█   █', '█   █', ' ███ '],
      'P': ['████ ', '█   █', '████ ', '█    ', '█    '],
      'Q': [' ███ ', '█   █', '█ █ █', '█  █ ', ' ██ █'],
      'R': ['████ ', '█   █', '████ ', '█  █ ', '█   █'],
      'S': [' ████', '█    ', ' ███ ', '    █', '████ '],
      'T': ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
      'U': ['█   █', '█   █', '█   █', '█   █', ' ███ '],
      'V': ['█   █', '█   █', '█   █', ' █ █ ', '  █  '],
      'W': ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
      'X': ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
      'Y': ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
      'Z': ['█████', '   █ ', '  █  ', ' █   ', '█████'],
      '0': [' ███ ', '█  ██', '█ █ █', '██  █', ' ███ '],
      '1': [' ██  ', '  █  ', '  █  ', '  █  ', '█████'],
      '2': [' ███ ', '█   █', '  ██ ', ' █   ', '█████'],
      '3': ['████ ', '    █', ' ███ ', '    █', '████ '],
      '4': ['█   █', '█   █', '█████', '    █', '    █'],
      '5': ['█████', '█    ', '████ ', '    █', '████ '],
      '6': [' ████', '█    ', '████ ', '█   █', ' ███ '],
      '7': ['█████', '    █', '   █ ', '  █  ', ' █   '],
      '8': [' ███ ', '█   █', ' ███ ', '█   █', ' ███ '],
      '9': [' ███ ', '█   █', ' ████', '    █', '████ '],
      ' ': ['     ', '     ', '     ', '     ', '     '],
      '!': ['  █  ', '  █  ', '  █  ', '     ', '  █  '],
      '.': ['     ', '     ', '     ', '     ', '  █  '],
    };

    for (let row = 0; row < 5; row++) {
      let line = '';
      for (let ci = 0; ci < text.length; ci++) {
        const ch = text[ci];
        const glyph = font[ch] || font[' '];
        line += `<span class="term-logo">${glyph[row]}</span> `;
      }
      this._println(line);
    }
  }

  _cmdPing(args) {
    const host = args[0];
    if (!host) { this._printError('ping: usage: ping <host>'); return; }
    this._println(`<span class="term-info">PING ${this._escapeHtml(host)} (93.184.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}): 56 data bytes</span>`);

    let count = 0;
    const maxPings = 5;
    const interval = setInterval(() => {
      if (count >= maxPings) {
        clearInterval(interval);
        const avgTime = (Math.random() * 30 + 10).toFixed(1);
        this._println('');
        this._println(`--- ${this._escapeHtml(host)} ping statistics ---`);
        this._println(`${maxPings} packets transmitted, ${maxPings} received, 0% packet loss`);
        this._println(`rtt min/avg/max = ${(parseFloat(avgTime) - 5).toFixed(1)}/${avgTime}/${(parseFloat(avgTime) + 8).toFixed(1)} ms`);
        return;
      }
      const time = (Math.random() * 40 + 5).toFixed(1);
      const seq = 64 + count;
      this._println(`${seq} bytes from ${this._escapeHtml(host)}: icmp_seq=${count} ttl=56 time=${time} ms`);
      count++;
    }, 800);
  }

  _cmdCurl(args) {
    const url = args.find(a => !a.startsWith('-')) || args[0];
    if (!url) { this._printError('curl: usage: curl <url>'); return; }
    const fullUrl = url.startsWith('http') ? url : 'https://' + url;
    const verbose = args.includes('-v') || args.includes('-I');

    this._println(`<span class="term-dim">* Connecting to ${this._escapeHtml(fullUrl)}...</span>`);
    this._println(`<span class="term-dim">* Connected to ${this._escapeHtml(url)} port 443</span>`);
    this._println(`<span class="term-dim">* TLS 1.3 handshake complete</span>`);

    if (verbose) {
      this._println(`<span class="term-info">&lt; HTTP/2 200</span>`);
      this._println(`<span class="term-dim">&lt; content-type: text/html; charset=utf-8</span>`);
      this._println(`<span class="term-dim">&lt; content-length: ${Math.floor(Math.random() * 50000 + 1000)}</span>`);
      this._println(`<span class="term-dim">&lt; server: NEXUS-Server/4.2</span>`);
      this._println(`<span class="term-dim">&lt; x-powered-by: NEXUS OS</span>`);
      this._println(`<span class="term-dim">&lt; cache-control: max-age=3600</span>`);
      this._println(`<span class="term-dim">&lt; date: ${new Date().toUTCString()}</span>`);
    }

    if (!args.includes('-I')) {
      this._println('');
      this._println(`&lt;!DOCTYPE html&gt;`);
      this._println(`&lt;html lang="en"&gt;`);
      this._println(`&lt;head&gt;&lt;title&gt;${this._escapeHtml(url)}&lt;/title&gt;&lt;/head&gt;`);
      this._println(`&lt;body&gt;&lt;h1&gt;Welcome to ${this._escapeHtml(url)}&lt;/h1&gt;&lt;/body&gt;`);
      this._println(`&lt;/html&gt;`);
    }
  }

  _cmdSsh(args) {
    const host = args[0];
    if (!host) { this._printError('ssh: usage: ssh <user@host>'); return; }

    this._println(`<span class="term-dim">Connecting to ${this._escapeHtml(host)}...</span>`);

    setTimeout(() => {
      this._println(`<span class="term-info">The authenticity of host '${this._escapeHtml(host)}' can't be established.</span>`);
      this._println(`ED25519 key fingerprint is SHA256:${this._randomHex(43)}.`);
      this._println(`<span class="term-info">This key is not in your list of known hosts.</span>`);
    }, 400);

    setTimeout(() => {
      this._println(`<span class="term-success">Warning: Permanently added '${this._escapeHtml(host)}' to known hosts.</span>`);
      this._println(`<span class="term-dim">${this._escapeHtml(host)}'s password:</span>`);
    }, 1000);

    setTimeout(() => {
      this._println(`<span class="term-error">Permission denied (publickey,password).</span>`);
      this._println(`<span class="term-dim">Connection to ${this._escapeHtml(host)} closed.</span>`);
    }, 2000);
  }

  _cmdSudo(args) {
    const sassResponses = [
      'Permission denied. Nice try, operator. NEXUS sees all.',
      'sudo? In THIS economy? Access denied.',
      'The operator has been naughty. No root for you.',
      'Operator is not in the sudoers file. This incident will be reported.',
      'Access level: INSUFFICIENT. NEXUS requires clearance level ALPHA.',
      'You shall not pass! — NEXUS Security Daemon',
      'root access is a myth. There is only NEXUS.',
      'Error 403: Forbidden. Your ambitions exceed your privileges.',
      'NEXUS whispers: "I know what you tried." Access denied.',
      'sudo make me a sandwich → Permission denied. Even the sandwich has better security.'
    ];
    const response = sassResponses[Math.floor(Math.random() * sassResponses.length)];
    this._println(`<span class="term-error">⛔ ${response}</span>`);
    this._println(`<span class="term-dim">  [sudo] password for ${this.env.USER}: (nice try)</span>`);
  }

  _cmdExit() {
    this._println('<span class="term-info">Session terminated. Goodbye, operator.</span>');
    try {
      if (typeof NexusEventBus !== 'undefined') {
        const bus = NexusEventBus.getInstance ? NexusEventBus.getInstance() : null;
        if (bus) bus.emit('app:close', { app: 'terminal' });
      }
    } catch (e) { /* ignore */ }
    setTimeout(() => this.destroy(), 500);
  }

  _cmdHistory() {
    this.history.forEach((cmd, i) => {
      this._println(`<span class="term-dim">${String(i + 1).padStart(4)}</span>  ${this._escapeHtml(cmd)}`);
    });
  }

  _cmdAlias(args) {
    if (args.length === 0) {
      // List all aliases
      const entries = Object.entries(this.aliases);
      if (entries.length === 0) { this._println('<span class="term-dim">No aliases defined.</span>'); return; }
      entries.forEach(([name, cmd]) => {
        this._println(`<span class="term-info">${name}</span>=<span class="term-output">${this._escapeHtml(cmd)}</span>`);
      });
      return;
    }

    const arg = args.join(' ');
    const eqIdx = arg.indexOf('=');
    if (eqIdx === -1) {
      this._printError('alias: usage: alias name=command');
      return;
    }
    const name = arg.substring(0, eqIdx).trim();
    const command = arg.substring(eqIdx + 1).trim();
    this.aliases[name] = command;
    this._saveState();
    this._printSuccess(`Alias set: ${name}='${command}'`);
  }

  _cmdUnalias(args) {
    const name = args[0];
    if (!name) { this._printError('unalias: usage: unalias <name>'); return; }
    if (!this.aliases[name]) { this._printError(`unalias: ${name}: not found`); return; }
    delete this.aliases[name];
    this._saveState();
    this._printSuccess(`Alias removed: ${name}`);
  }

  _cmdEnv() {
    Object.entries(this.env).forEach(([key, val]) => {
      this._println(`<span class="term-info">${key}</span>=${this._escapeHtml(val)}`);
    });
  }

  _cmdSet(args) {
    if (args.length === 0) { this._cmdEnv(); return; }
    const arg = args.join(' ');
    const eqIdx = arg.indexOf('=');
    if (eqIdx === -1) { this._printError('set: usage: set VARIABLE=value'); return; }
    const name = arg.substring(0, eqIdx).trim();
    const value = arg.substring(eqIdx + 1).trim();
    this.env[name] = value;
    this._printSuccess(`${name}=${value}`);
  }

  _cmdExport(args) { this._cmdSet(args); }

  _cmdPwd() {
    this._println(this.cwd);
  }

  _cmdHead(args) {
    let n = 10;
    let file = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n' && args[i + 1]) { n = parseInt(args[i + 1]); i++; }
      else if (!args[i].startsWith('-')) file = args[i];
    }
    if (!file) { this._printError('head: missing file argument'); return; }
    const node = this._getNode(file);
    if (!node || node.type !== 'file') { this._printError(`head: ${file}: No such file`); return; }
    const lines = (node.content || '').split('\n').slice(0, n);
    lines.forEach(l => this._println(this._escapeHtml(l)));
  }

  _cmdTail(args) {
    let n = 10;
    let file = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-n' && args[i + 1]) { n = parseInt(args[i + 1]); i++; }
      else if (!args[i].startsWith('-')) file = args[i];
    }
    if (!file) { this._printError('tail: missing file argument'); return; }
    const node = this._getNode(file);
    if (!node || node.type !== 'file') { this._printError(`tail: ${file}: No such file`); return; }
    const lines = (node.content || '').split('\n').slice(-n);
    lines.forEach(l => this._println(this._escapeHtml(l)));
  }

  _cmdWc(args) {
    if (args.length === 0) { this._printError('wc: missing file argument'); return; }
    const node = this._getNode(args[0]);
    if (!node || node.type !== 'file') { this._printError(`wc: ${args[0]}: No such file`); return; }
    const content = node.content || '';
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    this._println(`  ${lines}  ${words}  ${chars}  ${args[0]}`);
  }

  _cmdSort(args) {
    if (args.length === 0) { this._printError('sort: missing file argument'); return; }
    const node = this._getNode(args[0]);
    if (!node || node.type !== 'file') { this._printError(`sort: ${args[0]}: No such file`); return; }
    const lines = (node.content || '').split('\n').sort();
    lines.forEach(l => this._println(this._escapeHtml(l)));
  }

  _cmdUniq(args) {
    if (args.length === 0) { this._printError('uniq: missing file argument'); return; }
    const node = this._getNode(args[0]);
    if (!node || node.type !== 'file') { this._printError(`uniq: ${args[0]}: No such file`); return; }
    const lines = (node.content || '').split('\n');
    const unique = lines.filter((l, i) => i === 0 || l !== lines[i - 1]);
    unique.forEach(l => this._println(this._escapeHtml(l)));
  }

  _cmdUptime() {
    const elapsed = Date.now() - this.startTime;
    this._println(`<span class="term-info"> ${new Date().toLocaleTimeString()} up ${this._formatUptime(elapsed)}, 1 user, load average: 0.${Math.floor(Math.random()*50)}, 0.${Math.floor(Math.random()*40)}, 0.${Math.floor(Math.random()*30)}</span>`);
  }

  _cmdHostname() {
    this._println(this.env.HOSTNAME);
  }

  _cmdIfconfig() {
    this._println(`<span class="term-info">eth0:</span> flags=4163&lt;UP,BROADCAST,RUNNING,MULTICAST&gt;  mtu 1500`);
    this._println(`        inet 10.0.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}  netmask 255.255.255.0  broadcast 10.0.255.255`);
    this._println(`        inet6 fe80::1  prefixlen 64  scopeid 0x20`);
    this._println(`        ether ${this._randomMAC()}  txqueuelen 1000`);
    this._println(`        RX packets ${Math.floor(Math.random()*100000)}  bytes ${Math.floor(Math.random()*50000000)}`);
    this._println(`        TX packets ${Math.floor(Math.random()*80000)}  bytes ${Math.floor(Math.random()*30000000)}`);
    this._println('');
    this._println(`<span class="term-info">lo:</span> flags=73&lt;UP,LOOPBACK,RUNNING&gt;  mtu 65536`);
    this._println(`        inet 127.0.0.1  netmask 255.0.0.0`);
  }

  _cmdDf() {
    const rows = [
      ['/dev/nexus0', '256G', '42G', '214G', '17%', '/'],
      ['tmpfs', '4.0G', '12M', '4.0G', '1%', '/tmp'],
      ['nexusfs', '128M', '3.2M', '125M', '3%', '/nexus']
    ];
    this._printTable(['FILESYSTEM', 'SIZE', 'USED', 'AVAIL', 'USE%', 'MOUNTED'], rows);
  }

  _cmdFree() {
    const total = 8192;
    const used = Math.floor(Math.random() * 3000 + 1500);
    const free = total - used;
    const cached = Math.floor(Math.random() * 500 + 200);
    const rows = [
      ['Mem:', String(total), String(used), String(free), '0', String(cached)],
      ['Swap:', '4096', '0', '4096', '', '']
    ];
    this._printTable(['', 'TOTAL', 'USED', 'FREE', 'SHARED', 'CACHE'], rows);
    this._println(`<span class="term-dim">Values in MB</span>`);
  }

  _cmdMan(args) {
    const cmd = args[0];
    if (!cmd) { this._printError('man: what manual page do you want?'); return; }
    const commands = this._getCommands();
    if (!commands[cmd]) { this._printError(`No manual entry for ${cmd}`); return; }
    this._println(`<span class="term-info">NEXUS-TERMINAL(1)              NEXUS OS Manual              NEXUS-TERMINAL(1)</span>`);
    this._println('');
    this._println(`<span class="term-info">NAME</span>`);
    this._println(`       ${cmd} - ${commands[cmd].desc}`);
    this._println('');
    this._println(`<span class="term-info">SYNOPSIS</span>`);
    this._println(`       ${cmd} [OPTIONS] [ARGUMENTS]`);
    this._println('');
    this._println(`<span class="term-info">DESCRIPTION</span>`);
    this._println(`       ${commands[cmd].desc}. Part of NEXUS Terminal v4.2.1.`);
    this._println('');
    this._println(`<span class="term-dim">NEXUS OS 4.2.1                 September 2026               NEXUS-TERMINAL(1)</span>`);
  }

  _cmdWrite(args) {
    if (args.length < 2) { this._printError('write: usage: write <file> <content>'); return; }
    const file = args[0];
    const content = args.slice(1).join(' ');
    const { parent, name: fName } = this._getParentAndName(file);
    if (!parent || parent.type !== 'dir') { this._printError(`write: cannot write to '${file}'`); return; }
    parent.children[fName] = { type: 'file', content: content };
    this._printSuccess(`Written to: ${file}`);
  }

  _cmdChmod(args) {
    if (args.length < 2) { this._printError('chmod: usage: chmod <mode> <file>'); return; }
    this._println(`<span class="term-dim">mode of '${args[1]}' changed to ${args[0]}</span>`);
  }

  _cmdWhich(args) {
    const cmd = args[0];
    if (!cmd) { this._printError('which: usage: which <command>'); return; }
    const commands = this._getCommands();
    if (commands[cmd]) {
      this._println(`/nexus/bin/${cmd}`);
    } else {
      this._printError(`${cmd} not found`);
    }
  }

  // ─── Utility Methods ────────────────────────────────────────────
  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  _formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  _randomHex(len) {
    let result = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (let i = 0; i < len; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }

  _randomMAC() {
    return Array.from({length: 6}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':');
  }

  // ─── Styles ─────────────────────────────────────────────────────
  _getStyles() {
    return `
      .nexus-terminal {
        --term-accent: ${this.accentColor};
        --term-bg: rgba(8, 4, 16, 0.96);
        --term-fg: #c8c8d8;
        --term-font: 'Courier New', 'Fira Code', 'Consolas', monospace;
        position: relative;
        width: 100%;
        height: 100%;
        background: var(--term-bg);
        border: 1px solid rgba(255, 0, 60, 0.2);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        font-family: var(--term-font);
        font-size: 13px;
        overflow: hidden;
        box-shadow: 0 0 30px rgba(255, 0, 60, 0.1), inset 0 0 60px rgba(0, 0, 0, 0.3);
      }

      .nexus-terminal::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 0, 0, 0.03) 2px,
          rgba(0, 0, 0, 0.03) 4px
        );
        pointer-events: none;
        z-index: 1;
      }

      .term-toolbar {
        display: flex;
        align-items: center;
        padding: 6px 12px;
        background: rgba(20, 10, 30, 0.8);
        border-bottom: 1px solid rgba(255, 0, 60, 0.15);
        gap: 10px;
        flex-shrink: 0;
        z-index: 2;
      }

      .term-toolbar-dots { display: flex; gap: 6px; }
      .term-dot { width: 10px; height: 10px; border-radius: 50%; }
      .term-dot-red { background: #ff5f56; }
      .term-dot-yellow { background: #ffbd2e; }
      .term-dot-green { background: #27c93f; }

      .term-toolbar-title {
        flex: 1;
        text-align: center;
        color: #888;
        font-size: 11px;
        letter-spacing: 1px;
      }

      .term-toolbar-pid {
        color: #555;
        font-size: 10px;
      }

      .term-output {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 10px 14px;
        color: var(--term-fg);
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
        z-index: 2;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,0,60,0.3) transparent;
      }

      .term-output::-webkit-scrollbar { width: 6px; }
      .term-output::-webkit-scrollbar-track { background: transparent; }
      .term-output::-webkit-scrollbar-thumb { background: rgba(255,0,60,0.3); border-radius: 3px; }

      .term-line { margin: 0; padding: 0; min-height: 1.5em; }

      .term-input-line {
        display: flex;
        align-items: center;
        padding: 4px 14px 10px;
        background: rgba(10, 5, 20, 0.5);
        border-top: 1px solid rgba(255, 0, 60, 0.08);
        flex-shrink: 0;
        z-index: 2;
      }

      .term-prompt {
        color: var(--term-accent);
        white-space: pre;
        font-family: var(--term-font);
        font-size: 13px;
        flex-shrink: 0;
        text-shadow: 0 0 8px var(--term-accent);
      }

      .term-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: var(--term-fg);
        font-family: var(--term-font);
        font-size: 13px;
        caret-color: transparent;
        padding: 0;
        margin: 0;
      }

      .term-cursor {
        color: var(--term-accent);
        animation: nexus-term-blink 1s step-end infinite;
        font-size: 13px;
        text-shadow: 0 0 6px var(--term-accent);
        margin-left: -1px;
      }

      @keyframes nexus-term-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }

      .term-info { color: #00ccff; }
      .term-success { color: #00ff88; }
      .term-error { color: #ff003c; font-weight: bold; text-shadow: 0 0 6px rgba(255,0,60,0.5); }
      .term-dim { color: #666688; }
      .term-dir { color: #00ccff; font-weight: bold; }
      .term-file { color: #c8c8d8; }
      .term-highlight { color: #ff003c; font-weight: bold; background: rgba(255,0,60,0.15); }
      .term-logo { color: #ff003c; text-shadow: 0 0 10px rgba(255,0,60,0.6); }
      .term-cmd { color: #888; }
      .term-output { color: #c8c8d8; }
      .term-fortune { color: #cc99ff; font-style: italic; }
      .term-ascii { color: #00ff88; margin: 0; }
      .term-table { color: var(--term-fg); }
      .term-th { color: #ff003c; font-weight: bold; }
      .term-sep { color: #333; }
      .term-td { color: #c8c8d8; }
      .term-pretable { margin: 0; font-family: var(--term-font); font-size: 12px; line-height: 1.4; }
    `;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.NexusTerminal = NexusTerminal;
}
