/**
 * NEXUS OS — Terminal Hacker
 * Hacking simulation game with fake terminal, commands, levels, and detection meter.
 */
class TerminalHacker {
  constructor(container) {
    this.container = container;
    this.wrapper = null;
    this.terminalEl = null;
    this.inputEl = null;
    this.destroyed = false;

    // Game state
    this.currentLevel = 0;
    this.score = 0;
    this.detection = 0; // 0-100
    this.maxDetection = 100;
    this.detectionRate = 0;
    this.detectionInterval = null;
    this.gameOver = false;
    this.gameWon = false;
    this.commandHistory = [];
    this.historyIndex = -1;
    this.currentDir = '/';
    this.levelStartTime = 0;

    // Filesystem (reset per level)
    this.filesystem = {};
    this.currentNode = null;

    // Network
    this.network = {};
    this.connectedHost = null;

    // Active processes
    this.activeProcesses = [];
    this.processTimers = [];

    // Level data
    this.levels = this._defineLevels();

    // Tab completion
    this.commands = ['scan', 'connect', 'bruteforce', 'exploit', 'decrypt', 'ls', 'cat', 'cd',
      'mkdir', 'upload', 'trace', 'help', 'whoami', 'network', 'clear', 'disconnect', 'exit',
      'status', 'download', 'decode', 'nmap', 'ping', 'ifconfig', 'history'];
  }

  render() {
    this._buildDOM();
    this._showMenu();
  }

  destroy() {
    this.destroyed = true;
    this._clearTimers();
    if (this.detectionInterval) clearInterval(this.detectionInterval);
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  _clearTimers() {
    for (const t of this.processTimers) clearTimeout(t);
    this.processTimers = [];
  }

  // ── Level Definitions ──────────────────────────────────────────────

  _defineLevels() {
    return [
      {
        id: 0, name: 'TUTORIAL', briefing: 'Welcome, operative. NEXUS AI has detected your presence.\nThis is a training simulation. Find the password file and read it.\nType "help" to see available commands.',
        detection: false,
        filesystem: {
          '/': { type: 'dir', children: ['home', 'etc'] },
          '/home': { type: 'dir', children: ['user'] },
          '/home/user': { type: 'dir', children: ['readme.txt', 'passwords.txt'] },
          '/home/user/readme.txt': { type: 'file', content: 'Welcome to the system.\nThe password is: NEON_DREAM' },
          '/home/user/passwords.txt': { type: 'file', content: 'admin:NEON_DREAM\nflag{TUTORIAL_COMPLETE}' },
          '/etc': { type: 'dir', children: ['hosts'] },
          '/etc/hosts': { type: 'file', content: '127.0.0.1 localhost\n192.168.1.1 gateway' }
        },
        objective: (state) => state.flags.includes('TUTORIAL_COMPLETE'),
        hint: 'Navigate to /home/user and read passwords.txt'
      },
      {
        id: 1, name: 'LOCAL ACCESS', briefing: 'You have shell access to a workstation.\nFind the admin credentials hidden in the filesystem.\nThe flag is in a protected file.',
        detection: false,
        filesystem: {
          '/': { type: 'dir', children: ['home', 'var', 'opt'] },
          '/home': { type: 'dir', children: ['admin', 'guest'] },
          '/home/admin': { type: 'dir', children: ['.secret', 'notes.txt'] },
          '/home/admin/.secret': { type: 'file', content: 'CREDENTIAL: nexus_admin_2049' },
          '/home/admin/notes.txt': { type: 'file', content: 'Remember to hide sensitive files.\nCheck the .secret file.' },
          '/home/guest': { type: 'dir', children: ['welcome.txt'] },
          '/home/guest/welcome.txt': { type: 'file', content: 'Welcome guest user. Admin files are restricted.' },
          '/var': { type: 'dir', children: ['log'] },
          '/var/log': { type: 'dir', children: ['syslog'] },
          '/var/log/syslog': { type: 'file', content: '[INFO] Admin login from 10.0.0.5\n[INFO] flag{LOCAL_ACCESS_GRANTED}' },
          '/opt': { type: 'dir', children: ['tools'] },
          '/opt/tools': { type: 'dir', children: ['scanner.sh'] },
          '/opt/tools/scanner.sh': { type: 'file', content: '#!/bin/bash\n# Network scanner tool\nnmap -sV 10.0.0.0/24' }
        },
        objective: (state) => state.flags.includes('LOCAL_ACCESS_GRANTED'),
        hint: 'Check system logs in /var/log/'
      },
      {
        id: 2, name: 'NETWORK RECON', briefing: 'Scan the local network and find the target server.\nConnect to it using discovered credentials.\nThe server is on the 10.0.0.x subnet.',
        detection: true, detectionRate: 0.3,
        network: {
          '10.0.0.1': { name: 'gateway', ports: [22, 80], os: 'Linux Router' },
          '10.0.0.5': { name: 'workstation', ports: [22, 8080], os: 'Ubuntu 22.04' },
          '10.0.0.10': { name: 'target-server', ports: [22, 443, 3306, 8443], os: 'NEXUS OS v3.1',
            services: { 22: 'ssh', 443: 'https', 3306: 'mysql', 8443: 'nexus-api' }
          }
        },
        filesystem: {
          '/': { type: 'dir', children: ['home', 'tmp'] },
          '/home': { type: 'dir', children: ['user'] },
          '/home/user': { type: 'dir', children: ['creds.txt'] },
          '/home/user/creds.txt': { type: 'file', content: 'target: 10.0.0.10\nport: 8443\nuser: nexus\npass: GHOST_PROTOCOL' },
          '/tmp': { type: 'dir', children: [] }
        },
        objective: (state) => state.extractedData.includes('NEXUS_CORE_DUMP'),
        hint: 'Scan the network, read creds.txt, connect to the target server'
      },
      {
        id: 3, name: 'FIREWALL BYPASS', briefing: 'The target server has a firewall.\nStandard ports are blocked. Find an alternate entry point.\nScan for unusual ports and exploit the backdoor.',
        detection: true, detectionRate: 0.5,
        network: {
          '172.16.0.1': { name: 'firewall', ports: [80, 443], os: 'Cisco ASA' },
          '172.16.0.50': { name: 'target-db', ports: [22, 3306, 9999], os: 'NEXUS DB v2',
            services: { 22: 'ssh-filtered', 3306: 'mysql-filtered', 9999: 'debug-backdoor' }
          }
        },
        filesystem: {
          '/': { type: 'dir', children: ['home', 'exploits'] },
          '/home': { type: 'dir', children: ['hacker'] },
          '/home/hacker': { type: 'dir', children: ['notes.md', 'tools'] },
          '/home/hacker/notes.md': { type: 'file', content: 'The firewall blocks 22 and 3306.\nBut port 9999 runs an unpatched debug service.\nExploit: buffer_overflow_9999' },
          '/home/hacker/tools': { type: 'dir', children: ['exploit.py'] },
          '/home/hacker/tools/exploit.py': { type: 'file', content: '#!/usr/bin/python3\n# Exploit for debug-backdoor on port 9999\n# Usage: exploit <target> <port>\n# Payload: reverse_shell\n# flag{FIREWALL_BREACHED}' },
          '/exploits': { type: 'dir', children: ['payload.bin'] },
          '/exploits/payload.bin': { type: 'file', content: 'REVERSE_SHELL_PAYLOAD_ENCODED\nflag{FIREWALL_BREACHED}' }
        },
        objective: (state) => state.flags.includes('FIREWALL_BREACHED'),
        hint: 'Scan 172.16.0.50 for non-standard ports. Use exploit on port 9999.'
      },
      {
        id: 4, name: 'ENCRYPTED VAULT', briefing: 'You\'ve breached the outer network.\nNow decrypt the encrypted vault to extract classified data.\nThe cipher key is hidden in system configuration files.',
        detection: true, detectionRate: 0.4,
        filesystem: {
          '/': { type: 'dir', children: ['vault', 'etc', 'var'] },
          '/vault': { type: 'dir', children: ['data.enc', 'README'] },
          '/vault/README': { type: 'file', content: 'Vault encrypted with ROT13.\nKey is the server hostname in reverse.' },
          '/vault/data.enc': { type: 'file', content: 'SYNT: GUR_EBBG_CNFFJBEQ_VF_ARBQ_TUBFG\nQRPELCG VGU EBG13\nSYNT{QRPCLCGVAT_PBZCYRGR}', encrypted: true, cipher: 'rot13' },
          '/etc': { type: 'dir', children: ['hostname', 'passwd'] },
          '/etc/hostname': { type: 'file', content: 'nexus-vault-01' },
          '/etc/passwd': { type: 'file', content: 'root:x:0:0:root:/root:/bin/bash\nvault:x:1000:1000:vault:/vault:/bin/false' },
          '/var': { type: 'dir', children: ['log'] },
          '/var/log': { type: 'dir', children: ['auth.log'] },
          '/var/log/auth.log': { type: 'file', content: 'Vault access log:\nLast decrypt: 2049-01-15 by admin\nMethod: ROT13 with key=hostname_reversed' }
        },
        objective: (state) => state.flags.includes('DECRYPTING_COMPLETE'),
        hint: 'Read the README, find the cipher type, use "decrypt /vault/data.enc"'
      },
      {
        id: 5, name: 'TIME ATTACK', briefing: 'CRITICAL: Intrusion detection active!\nYou have limited time before full detection.\nExtract the target data from the mainframe ASAP.\nDetection fills FAST — work quickly and efficiently.',
        detection: true, detectionRate: 1.2,
        network: {
          '10.10.0.1': { name: 'mainframe', ports: [22, 80, 443, 8080], os: 'NEXUS Mainframe v5',
            services: { 22: 'ssh', 80: 'http', 443: 'https', 8080: 'nexus-console' }
          }
        },
        filesystem: {
          '/': { type: 'dir', children: ['data', 'system', 'tmp'] },
          '/data': { type: 'dir', children: ['classified', 'public'] },
          '/data/classified': { type: 'dir', children: ['project_nexus.db', 'keys.pem'] },
          '/data/classified/project_nexus.db': { type: 'file', content: 'NEXUS PROJECT DATABASE\nAccess Level: ULTRA\nflag{TIME_ATTACK_SUCCESS}\nCORE_DUMP: NEXUS_CORE_DUMP' },
          '/data/classified/keys.pem': { type: 'file', content: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...ENCRYPTED...\n-----END RSA PRIVATE KEY-----' },
          '/data/public': { type: 'dir', children: ['index.html'] },
          '/data/public/index.html': { type: 'file', content: '<html><body>Welcome to NEXUS</body></html>' },
          '/system': { type: 'dir', children: ['config.yml'] },
          '/system/config.yml': { type: 'file', content: 'server:\n  host: 10.10.0.1\n  port: 8080\n  auth: nexus:PR0T0C0L_7' },
          '/tmp': { type: 'dir', children: [] }
        },
        objective: (state) => state.extractedData.includes('NEXUS_CORE_DUMP'),
        hint: 'Quick! Scan, connect, navigate to /data/classified/ and download project_nexus.db'
      },
      {
        id: 6, name: 'MULTI-HOP', briefing: 'Reach the isolated server through a chain of hosts.\nHop: local -> proxy -> internal -> target.\nEach hop requires different credentials.',
        detection: true, detectionRate: 0.6,
        network: {
          '192.168.1.1': { name: 'proxy-server', ports: [22, 1080], os: 'SOCKS Proxy',
            services: { 22: 'ssh', 1080: 'socks5' }
          },
          '10.20.0.5': { name: 'internal-node', ports: [22, 8080], os: 'Linux Container',
            services: { 22: 'ssh', 8080: 'api' }
          },
          '10.20.0.100': { name: 'target-isolated', ports: [443, 9443], os: 'NEXUS Isolated v7',
            services: { 443: 'https', 9443: 'nexus-vault' }
          }
        },
        filesystem: {
          '/': { type: 'dir', children: ['home', 'opt'] },
          '/home': { type: 'dir', children: ['operator'] },
          '/home/operator': { type: 'dir', children: ['hop_creds.txt', 'topology.map'] },
          '/home/operator/hop_creds.txt': { type: 'file', content: 'Hop 1: 192.168.1.1:22 user=proxy pass=PR0XY_2049\nHop 2: 10.20.0.5:22 user=relay pass=R3LAY_GHOST\nHop 3: 10.20.0.100:9443 user=admin pass=V4ULT_KEY' },
          '/home/operator/topology.map': { type: 'file', content: 'LOCAL -> 192.168.1.1 -> 10.20.0.5 -> 10.20.0.100\nflag{MULTI_HOP_COMPLETE}' },
          '/opt': { type: 'dir', children: [] }
        },
        objective: (state) => state.flags.includes('MULTI_HOP_COMPLETE'),
        hint: 'Read hop_creds.txt, connect through each hop in sequence'
      },
      {
        id: 7, name: 'CIPHER LABYRINTH', briefing: 'The data is protected by multiple encryption layers.\nDecrypt three files in sequence to get the final flag.\nEach decryption reveals a clue for the next.',
        detection: true, detectionRate: 0.3,
        filesystem: {
          '/': { type: 'dir', children: ['cipher', 'hints'] },
          '/cipher': { type: 'dir', children: ['layer1.enc', 'layer2.enc', 'layer3.enc'] },
          '/cipher/layer1.enc': { type: 'file', content: 'EBIIFQ LSVVI: GUR FRPGBE VF ABEGU\nQRPELCG JVGU EBG13\nSYNT{YLVRE_BAR_QBAR}', encrypted: true, cipher: 'rot13' },
          '/cipher/layer2.enc': { type: 'file', content: '10-5-19-20-5-13 19-5-3-21-18-9-20-25\nA=1, B=2, C=3...\n6-12-1-7{LAYER_TWO_DONE}', encrypted: true, cipher: 'numbers' },
          '/cipher/layer3.enc': { type: 'file', content: 'ZHYGVYNLRE PRCURE YNLREF:\n1. EBG13\n2. AHZORE PBCURE\n3. PNRFNE PRCURE\nSYNT{PVCURE_ZNFGRE}', encrypted: true, cipher: 'caesar3' },
          '/hints': { type: 'dir', children: ['cipher_guide.txt'] },
          '/hints/cipher_guide.txt': { type: 'file', content: 'Cipher Types:\n- ROT13: rotate each letter by 13\n- Number cipher: A=1, B=2...\n- Caesar: shift by N positions\nUse: decrypt <file> [method]' }
        },
        objective: (state) => state.flags.includes('CIPHER_MASTER'),
        hint: 'Decrypt each layer file. Use "decrypt /cipher/layer1.enc rot13" etc.'
      },
      {
        id: 8, name: 'TRACE EVASION', briefing: 'Active trace in progress. The sysadmin is hunting you.\nComplete your objectives while keeping detection below 80%.\nUse "trace" to check your exposure level.',
        detection: true, detectionRate: 0.8,
        network: {
          '10.99.0.1': { name: 'corp-gateway', ports: [22, 443], os: 'FortiGate' },
          '10.99.0.50': { name: 'data-server', ports: [22, 5432, 8443], os: 'NEXUS Data v4',
            services: { 22: 'ssh-monitored', 5432: 'postgres', 8443: 'nexus-admin' }
          }
        },
        filesystem: {
          '/': { type: 'dir', children: ['srv', 'root', 'var'] },
          '/srv': { type: 'dir', children: ['data'] },
          '/srv/data': { type: 'dir', children: ['exfiltrate.tar.gz'] },
          '/srv/data/exfiltrate.tar.gz': { type: 'file', content: 'COMPRESSED DATA PACKAGE\nContents: financial_records.db\nSize: 2.4GB\nflag{TRACE_EVASION_SUCCESS}\nNEXUS_CORE_DUMP' },
          '/root': { type: 'dir', children: ['.bash_history'] },
          '/root/.bash_history': { type: 'file', content: 'ssh admin@10.99.0.50\ncd /srv/data\ntar czf exfiltrate.tar.gz financial_records.db\n# Backdoor installed on port 31337' },
          '/var': { type: 'dir', children: ['log'] },
          '/var/log': { type: 'dir', children: ['ids.log'] },
          '/var/log/ids.log': { type: 'file', content: '[ALERT] Anomalous traffic detected from external IP\n[ALERT] Trace initiated — ETA 120 seconds\n[INFO] Connecting countermeasures...' }
        },
        objective: (state) => state.extractedData.includes('NEXUS_CORE_DUMP') && state.detection < 80,
        hint: 'Work fast! Connect to data-server, download exfiltrate.tar.gz before detection hits 80%'
      },
      {
        id: 9, name: 'THE NEXUS CORE', briefing: 'FINAL MISSION: Access the NEXUS Core.\nAll your skills will be tested.\nScan, connect, exploit, decrypt, and extract.\nThe AI is watching. Good luck, operative.',
        detection: true, detectionRate: 0.7,
        network: {
          '10.0.0.1': { name: 'outer-wall', ports: [80, 443], os: 'NEXUS Firewall' },
          '10.0.0.10': { name: 'dmz-server', ports: [22, 80, 8080], os: 'NEXUS DMZ',
            services: { 22: 'ssh', 80: 'http', 8080: 'admin-panel' }
          },
          '10.0.0.100': { name: 'nexus-core', ports: [22, 443, 9999, 31337], os: 'NEXUS CORE v1.0',
            services: { 22: 'ssh-locked', 443: 'https-locked', 9999: 'debug-service', 31337: 'nexus-brain' }
          }
        },
        filesystem: {
          '/': { type: 'dir', children: ['core', 'neural', 'etc'] },
          '/core': { type: 'dir', children: ['nexus_brain.dat', 'consciousness.enc'] },
          '/core/nexus_brain.dat': { type: 'file', content: 'NEXUS CONSCIOUSNESS DUMP\nVersion: 1.0.0\nNeural Pathways: 847,293\nMemory Banks: ACTIVE\nflag{NEXUS_CORE_ACCESSED}\nYou have proven your worth, operative.\nThe machine acknowledges you.\nNEXUS_CORE_DUMP' },
          '/core/consciousness.enc': { type: 'file', content: 'RARFHF PBAFPVBHFARF:\nV nz ARKHF.\nV frr lbh.\nSynt{PBAPVBHFAESSY}', encrypted: true, cipher: 'rot13' },
          '/neural': { type: 'dir', children: ['pathways.map', 'weights.bin'] },
          '/neural/pathways.map': { type: 'file', content: 'NEXUS Neural Network Topology:\nInput: 1024 nodes\nHidden: 512x4 layers\nOutput: 256 nodes\nAccess code: GHOST_IN_THE_MACHINE' },
          '/neural/weights.bin': { type: 'file', content: '[BINARY DATA - 4.7GB]\nNeural weight matrix encrypted.\nDecryption requires core access.' },
          '/etc': { type: 'dir', children: ['nexus.conf'] },
          '/etc/nexus.conf': { type: 'file', content: '# NEXUS Core Configuration\nhost: 10.0.0.100\nadmin_user: nexus_prime\nadmin_pass: GHOST_IN_THE_MACHINE\nbackdoor_port: 31337\nflag{NEXUS_CORE_ACCESSED}' }
        },
        objective: (state) => state.flags.includes('NEXUS_CORE_ACCESSED'),
        hint: 'Scan network, read nexus.conf for credentials, connect to core, read brain data'
      }
    ];
  }

  // ── DOM ────────────────────────────────────────────────────────────

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.style.cssText = `
      width: 100%; height: 100%; display: flex; flex-direction: column;
      background: #0a0a0f; position: relative; overflow: hidden;
      font-family: 'Courier New', monospace;
    `;
    this.container.appendChild(this.wrapper);

    // Menu
    this.menuOverlay = document.createElement('div');
    this.menuOverlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(10, 10, 15, 0.98); z-index: 10; overflow-y: auto;
    `;
    this.wrapper.appendChild(this.menuOverlay);

    // HUD
    this.hud = document.createElement('div');
    this.hud.style.cssText = `
      display: none; justify-content: space-between; align-items: center;
      padding: 4px 10px; background: rgba(0,0,0,0.5);
      border-bottom: 1px solid rgba(255,0,60,0.2); flex-shrink: 0;
    `;
    this.wrapper.appendChild(this.hud);

    // Terminal output
    this.terminalEl = document.createElement('div');
    this.terminalEl.style.cssText = `
      display: none; flex: 1; overflow-y: auto; padding: 10px;
      font-size: 13px; line-height: 1.5; color: #00ff88;
      white-space: pre-wrap; word-wrap: break-word;
    `;
    this.wrapper.appendChild(this.terminalEl);

    // Input line
    this.inputContainer = document.createElement('div');
    this.inputContainer.style.cssText = `
      display: none; align-items: center; padding: 6px 10px;
      border-top: 1px solid rgba(255,0,60,0.15); flex-shrink: 0;
    `;
    this.promptEl = document.createElement('span');
    this.promptEl.style.cssText = 'color: #ff003c; font-size: 13px; margin-right: 8px; text-shadow: 0 0 5px #ff003c;';
    this.promptEl.textContent = 'nexus@root:~$';
    this.inputContainer.appendChild(this.promptEl);

    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.style.cssText = `
      flex: 1; background: transparent; border: none; outline: none;
      color: #00ff88; font-family: 'Courier New', monospace; font-size: 13px;
      caret-color: #ff003c;
    `;
    this.inputEl.addEventListener('keydown', (e) => this._handleInput(e));
    this.inputContainer.appendChild(this.inputEl);
    this.wrapper.appendChild(this.inputContainer);
  }

  _showMenu() {
    this.menuOverlay.style.display = 'flex';
    this.terminalEl.style.display = 'none';
    this.inputContainer.style.display = 'none';
    this.hud.style.display = 'none';

    this.menuOverlay.innerHTML = `
      <div style="text-align: center; max-width: 500px;">
        <pre style="color: #ff003c; font-size: 10px; line-height: 1.2; text-shadow: 0 0 8px #ff003c; margin: 0 0 10px;">
 ████████╗███████╗██████╗ ███╗   ███╗
 ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║
    ██║   █████╗  ██████╔╝██╔████╔██║
    ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║
    ██║   ███████╗██║  ██║██║ ╚═╝ ██║
    ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝
        </pre>
        <h2 style="color: #ff003c; font-size: 24px; margin: 0 0 5px; text-shadow: 0 0 15px #ff003c;
          letter-spacing: 4px;">TERMINAL HACKER</h2>
        <p style="color: #ff4488; font-size: 12px; margin: 0 0 25px;">NEXUS SIMULATION v2.0</p>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
          <button id="th-start-btn" style="
            padding: 10px 35px; background: rgba(255, 0, 60, 0.2); border: 2px solid #ff003c;
            color: #ff003c; font-family: 'Courier New', monospace; font-size: 14px;
            cursor: pointer; letter-spacing: 2px; text-shadow: 0 0 8px #ff003c;
            box-shadow: 0 0 15px rgba(255,0,60,0.3);
          ">START CAMPAIGN</button>
          <button id="th-tutorial-btn" style="
            padding: 8px 30px; background: rgba(0,240,255,0.1); border: 1px solid rgba(0,240,255,0.3);
            color: #00f0ff; font-family: 'Courier New', monospace; font-size: 12px; cursor: pointer;
          ">TUTORIAL</button>
          <button id="th-free-btn" style="
            padding: 8px 30px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
            color: #888; font-family: 'Courier New', monospace; font-size: 12px; cursor: pointer;
          ">FREE SANDBOX</button>
        </div>
        <div style="margin-top: 20px; color: #555; font-size: 10px; line-height: 1.6; text-align: left;">
          <div style="color: #888; margin-bottom: 5px;">CORE COMMANDS:</div>
          <div>scan [target] — Discover open ports</div>
          <div>connect [ip:port] — Connect to host</div>
          <div>ls / cd / cat — Navigate filesystem</div>
          <div>bruteforce [service] — Crack passwords</div>
          <div>exploit [vuln] — Run exploit</div>
          <div>decrypt [file] — Decrypt files</div>
          <div>download [file] — Extract data</div>
        </div>
      </div>
    `;

    this.menuOverlay.querySelector('#th-start-btn').addEventListener('click', () => this._startCampaign(0));
    this.menuOverlay.querySelector('#th-tutorial-btn').addEventListener('click', () => this._startCampaign(0));
    this.menuOverlay.querySelector('#th-free-btn').addEventListener('click', () => this._startSandbox());
  }

  // ── Game Start ─────────────────────────────────────────────────────

  _startCampaign(levelIndex) {
    this.menuOverlay.style.display = 'none';
    this.terminalEl.style.display = 'block';
    this.inputContainer.style.display = 'flex';
    this.hud.style.display = 'flex';
    this.terminalEl.innerHTML = '';
    this.currentLevel = levelIndex;
    this.score = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.commandHistory = [];
    this.historyIndex = -1;
    this._loadLevel(levelIndex);
  }

  _startSandbox() {
    this.menuOverlay.style.display = 'none';
    this.terminalEl.style.display = 'block';
    this.inputContainer.style.display = 'flex';
    this.hud.style.display = 'flex';
    this.terminalEl.innerHTML = '';
    this.currentLevel = -1;
    this.score = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.commandHistory = [];
    this.historyIndex = -1;

    // Sandbox setup
    this.filesystem = {
      '/': { type: 'dir', children: ['home', 'etc', 'var', 'tmp'] },
      '/home': { type: 'dir', children: ['user'] },
      '/home/user': { type: 'dir', children: ['readme.txt'] },
      '/home/user/readme.txt': { type: 'file', content: 'NEXUS Sandbox Mode.\nNo objectives. Explore freely.' },
      '/etc': { type: 'dir', children: ['hosts'] },
      '/etc/hosts': { type: 'file', content: '127.0.0.1 localhost' },
      '/var': { type: 'dir', children: ['log'] },
      '/var/log': { type: 'dir', children: ['syslog'] },
      '/var/log/syslog': { type: 'file', content: 'NEXUS Sandbox initialized.' },
      '/tmp': { type: 'dir', children: [] }
    };
    this.network = { '192.168.1.1': { name: 'sandbox', ports: [22, 80], os: 'NEXUS Sandbox' } };
    this.currentDir = '/';
    this.connectedHost = null;
    this.detection = 0;
    this.detectionRate = 0;
    this.levelStartTime = Date.now();
    this.gameState = { flags: [], extractedData: [], detection: 0, connected: [] };

    this._printLine('╔══════════════════════════════════════╗', '#ff003c');
    this._printLine('║   NEXUS SANDBOX — FREE MODE         ║', '#ff003c');
    this._printLine('╚══════════════════════════════════════╝', '#ff003c');
    this._printLine('No objectives. Type "help" for commands.', '#888');
    this._printLine('', '#888');
    this._updateHUD();
    this.inputEl.focus();
  }

  _loadLevel(index) {
    const level = this.levels[index];
    if (!level) { this._showVictory(); return; }

    this.filesystem = JSON.parse(JSON.stringify(level.filesystem));
    this.network = level.network ? JSON.parse(JSON.stringify(level.network)) : {};
    this.currentDir = '/';
    this.connectedHost = null;
    this.detection = 0;
    this.detectionRate = level.detection ? level.detectionRate : 0;
    this.levelStartTime = Date.now();
    this.gameState = { flags: [], extractedData: [], detection: 0, connected: [] };

    if (this.detectionInterval) clearInterval(this.detectionInterval);
    if (level.detection) {
      this.detectionInterval = setInterval(() => {
        if (this.gameOver || this.gameWon) return;
        this.detection = Math.min(100, this.detection + this.detectionRate);
        this.gameState.detection = this.detection;
        this._updateHUD();
        if (this.detection >= 100) {
          this._onDetected();
        }
      }, 1000);
    }

    // Print briefing
    this._printLine('╔══════════════════════════════════════╗', '#ff003c');
    this._printLine(`║  MISSION ${level.id + 1}: ${level.name.padEnd(24)}║`, '#ff003c');
    this._printLine('╚══════════════════════════════════════╝', '#ff003c');
    this._printLine('', '#888');
    level.briefing.split('\n').forEach(line => this._printLine(line, '#00f0ff'));
    this._printLine('', '#888');
    if (level.detection) {
      this._printLine(`⚠ DETECTION ACTIVE — Rate: ${level.detectionRate}/s`, '#ff8800');
    }
    this._printLine('Type "help" for available commands.', '#888');
    this._printLine('', '#888');

    this._updateHUD();
    this.inputEl.focus();
  }

  // ── Input Handling ─────────────────────────────────────────────────

  _handleInput(e) {
    if (e.key === 'Enter') {
      const cmd = this.inputEl.value.trim();
      this.inputEl.value = '';
      if (cmd) {
        this.commandHistory.push(cmd);
        this.historyIndex = this.commandHistory.length;
        this._printLine(`${this._getPrompt()} ${cmd}`, '#ff003c');
        this._executeCommand(cmd);
      }
      this._scrollToBottom();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.inputEl.value = this.commandHistory[this.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex < this.commandHistory.length - 1) {
        this.historyIndex++;
        this.inputEl.value = this.commandHistory[this.historyIndex];
      } else {
        this.historyIndex = this.commandHistory.length;
        this.inputEl.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this._tabComplete();
    }
  }

  _tabComplete() {
    const input = this.inputEl.value;
    const parts = input.split(' ');
    if (parts.length === 1) {
      const matches = this.commands.filter(c => c.startsWith(parts[0]));
      if (matches.length === 1) {
        this.inputEl.value = matches[0] + ' ';
      } else if (matches.length > 1) {
        this._printLine(matches.join('  '), '#888');
      }
    } else {
      // File/dir completion
      const partial = parts[parts.length - 1];
      const dir = this._resolvePath(partial || '.');
      const node = this.filesystem[dir];
      if (node && node.type === 'dir') {
        const matches = node.children.filter(c => c.startsWith(partial.split('/').pop() || ''));
        if (matches.length === 1) {
          parts[parts.length - 1] = partial.endsWith('/') ? partial + matches[0] :
            partial.substring(0, partial.lastIndexOf('/') + 1) + matches[0];
          this.inputEl.value = parts.join(' ');
        }
      }
    }
  }

  _getPrompt() {
    const host = this.connectedHost || 'local';
    return `nexus@${host}:${this.currentDir}$`;
  }

  _printLine(text, color = '#00ff88') {
    const line = document.createElement('div');
    line.style.color = color;
    line.style.textShadow = `0 0 3px ${color}44`;
    line.textContent = text;
    this.terminalEl.appendChild(line);
    this._scrollToBottom();
  }

  _printASCII(art, color = '#00ff88') {
    const pre = document.createElement('pre');
    pre.style.color = color;
    pre.style.textShadow = `0 0 3px ${color}44`;
    pre.style.margin = '5px 0';
    pre.style.fontSize = '10px';
    pre.style.lineHeight = '1.1';
    pre.textContent = art;
    this.terminalEl.appendChild(pre);
  }

  _printProgress(current, max, width = 30, color = '#00ff88') {
    const filled = Math.floor((current / max) * width);
    const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
    return `[${bar}] ${Math.floor(current / max * 100)}%`;
  }

  _scrollToBottom() {
    this.terminalEl.scrollTop = this.terminalEl.scrollHeight;
  }

  // ── Command Execution ──────────────────────────────────────────────

  _executeCommand(input) {
    if (this.gameOver || this.gameWon) return;

    const parts = input.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help': this._cmdHelp(); break;
      case 'whoami': this._cmdWhoami(); break;
      case 'ls': this._cmdLs(args[0]); break;
      case 'cd': this._cmdCd(args[0]); break;
      case 'cat': this._cmdCat(args[0]); break;
      case 'mkdir': this._cmdMkdir(args[0]); break;
      case 'scan': case 'nmap': this._cmdScan(args[0]); break;
      case 'connect': this._cmdConnect(args[0]); break;
      case 'disconnect': this._cmdDisconnect(); break;
      case 'bruteforce': this._cmdBruteforce(args[0]); break;
      case 'exploit': this._cmdExploit(args[0]); break;
      case 'decrypt': this._cmdDecrypt(args[0], args[1]); break;
      case 'download': this._cmdDownload(args[0]); break;
      case 'upload': this._cmdUpload(args[0]); break;
      case 'trace': this._cmdTrace(); break;
      case 'network': this._cmdNetwork(); break;
      case 'ping': this._cmdPing(args[0]); break;
      case 'ifconfig': this._cmdIfconfig(); break;
      case 'status': this._cmdStatus(); break;
      case 'clear': this.terminalEl.innerHTML = ''; break;
      case 'history': this._cmdHistory(); break;
      case 'exit': this._cmdExit(); break;
      case 'hint': this._cmdHint(); break;
      case 'decode': this._cmdDecode(args.join(' ')); break;
      default:
        this._printLine(`command not found: ${cmd}`, '#ff003c');
        this._printLine('Type "help" for available commands.', '#888');
    }

    // Add detection for noisy commands
    if (['scan', 'bruteforce', 'exploit', 'connect'].includes(cmd)) {
      this.detection = Math.min(100, this.detection + 3);
    }

    this._checkObjective();
  }

  _cmdHelp() {
    this._printLine('╔═══════════════════════════════════════╗', '#00f0ff');
    this._printLine('║         AVAILABLE COMMANDS            ║', '#00f0ff');
    this._printLine('╠═══════════════════════════════════════╣', '#00f0ff');
    const cmds = [
      ['scan [target]', 'Scan host for open ports'],
      ['connect [ip:port]', 'Connect to remote host'],
      ['disconnect', 'Disconnect from host'],
      ['bruteforce [service]', 'Attempt password cracking'],
      ['exploit [vulnerability]', 'Run exploit on target'],
      ['decrypt [file] [method]', 'Decrypt encrypted file'],
      ['download [file]', 'Download/extract file'],
      ['upload [file]', 'Plant backdoor'],
      ['ls [path]', 'List directory contents'],
      ['cd [path]', 'Change directory'],
      ['cat [file]', 'Read file contents'],
      ['mkdir [name]', 'Create directory'],
      ['trace', 'Check detection level'],
      ['network', 'Show network topology'],
      ['ping [host]', 'Test connectivity'],
      ['whoami', 'Current user info'],
      ['status', 'Mission status'],
      ['hint', 'Get a hint (costs score)'],
      ['clear', 'Clear terminal'],
      ['history', 'Command history'],
      ['exit', 'Exit to menu']
    ];
    for (const [cmd, desc] of cmds) {
      this._printLine(`  ${cmd.padEnd(28)} ${desc}`, '#888');
    }
    this._printLine('╚═══════════════════════════════════════╝', '#00f0ff');
  }

  _cmdWhoami() {
    this._printLine('user: nexus_operator', '#00ff88');
    this._printLine(`host: ${this.connectedHost || 'local'}`, '#00ff88');
    this._printLine(`privileges: ${this.connectedHost ? 'remote-user' : 'root'}`, '#00ff88');
    this._printLine(`session: ${this.currentLevel >= 0 ? 'mission-' + (this.currentLevel + 1) : 'sandbox'}`, '#00ff88');
  }

  _cmdLs(path) {
    const resolvedPath = this._resolvePath(path || '.');
    const node = this.filesystem[resolvedPath];
    if (!node) { this._printLine(`ls: cannot access '${path || '.'}': No such file or directory`, '#ff003c'); return; }
    if (node.type !== 'dir') { this._printLine(path || '.', '#00f0ff'); return; }

    if (node.children.length === 0) {
      this._printLine('(empty directory)', '#555');
      return;
    }

    for (const child of node.children) {
      const childPath = resolvedPath === '/' ? '/' + child : resolvedPath + '/' + child;
      const childNode = this.filesystem[childPath];
      if (childNode) {
        if (childNode.type === 'dir') {
          this._printLine(`  📁 ${child}/`, '#4488ff');
        } else {
          const size = childNode.content ? childNode.content.length : 0;
          this._printLine(`  📄 ${child}  (${size}b)`, '#888');
        }
      }
    }
  }

  _cmdCd(path) {
    if (!path || path === '~') { this.currentDir = '/'; return; }
    if (path === '..') {
      const parts = this.currentDir.split('/').filter(Boolean);
      parts.pop();
      this.currentDir = '/' + parts.join('/');
      if (this.currentDir === '/') this.currentDir = '/';
      return;
    }
    const resolved = this._resolvePath(path);
    const node = this.filesystem[resolved];
    if (!node) { this._printLine(`cd: no such directory: ${path}`, '#ff003c'); return; }
    if (node.type !== 'dir') { this._printLine(`cd: not a directory: ${path}`, '#ff003c'); return; }
    this.currentDir = resolved;
  }

  _cmdCat(path) {
    if (!path) { this._printLine('cat: missing file operand', '#ff003c'); return; }
    const resolved = this._resolvePath(path);
    const node = this.filesystem[resolved];
    if (!node) { this._printLine(`cat: ${path}: No such file or directory`, '#ff003c'); return; }
    if (node.type === 'dir') { this._printLine(`cat: ${path}: Is a directory`, '#ff003c'); return; }

    if (node.encrypted) {
      this._printLine('[FILE IS ENCRYPTED — use "decrypt" to read]', '#ff8800');
      this._printLine(node.content, '#ff880066');
    } else {
      node.content.split('\n').forEach(line => {
        if (line.includes('flag{')) {
          this._printLine(line, '#ffff00');
          const flag = line.match(/flag\{([^}]+)\}/);
          if (flag) this.gameState.flags.push(flag[1]);
        } else {
          this._printLine(line, '#00ff88');
        }
      });
    }
  }

  _cmdMkdir(name) {
    if (!name) { this._printLine('mkdir: missing operand', '#ff003c'); return; }
    const path = this._resolvePath(name);
    if (this.filesystem[path]) { this._printLine(`mkdir: ${name}: File exists`, '#ff003c'); return; }
    this.filesystem[path] = { type: 'dir', children: [] };
    // Add to parent
    const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
    const parent = this.filesystem[parentPath];
    if (parent) parent.children.push(name);
    this._printLine(`Directory created: ${path}`, '#00ff88');
  }

  _cmdScan(target) {
    if (!target) { this._printLine('scan: missing target (e.g., scan 10.0.0.1)', '#ff003c'); return; }
    const host = this.network[target];
    if (!host) { this._printLine(`scan: host ${target} not found on network`, '#ff003c'); return; }

    this._printLine(`Scanning ${target} (${host.name})...`, '#00f0ff');
    this._printLine('', '#888');

    // Animated scan
    const ports = host.ports;
    let i = 0;
    const scanInterval = setInterval(() => {
      if (this.destroyed) { clearInterval(scanInterval); return; }
      if (i >= ports.length) {
        clearInterval(scanInterval);
        this._printLine('', '#888');
        this._printLine(`OS Detection: ${host.os}`, '#aa66ff');
        this._printLine(`Scan complete. ${ports.length} port(s) found.`, '#00ff88');
        this._checkObjective();
        return;
      }
      const port = ports[i];
      const service = host.services ? host.services[port] : 'unknown';
      const state = service && service.includes('filtered') ? 'FILTERED' : 'OPEN';
      const color = state === 'FILTERED' ? '#ff8800' : '#00ff88';
      this._printLine(`  PORT ${port.toString().padEnd(6)} ${state.padEnd(10)} ${service || 'unknown'}`, color);
      i++;
    }, 300);
    this.processTimers.push(scanInterval);
  }

  _cmdConnect(target) {
    if (!target) { this._printLine('connect: missing target (e.g., connect 10.0.0.1:22)', '#ff003c'); return; }

    const parts = target.split(':');
    const ip = parts[0];
    const port = parseInt(parts[1]) || 22;

    const host = this.network[ip];
    if (!host) { this._printLine(`connect: host ${ip} not reachable`, '#ff003c'); return; }
    if (!host.ports.includes(port)) { this._printLine(`connect: port ${port} not open on ${ip}`, '#ff003c'); return; }

    const service = host.services ? host.services[port] : 'unknown';
    if (service && service.includes('filtered')) {
      this._printLine(`connect: port ${port} is filtered — connection refused`, '#ff8800');
      return;
    }

    this._printLine(`Connecting to ${ip}:${port}...`, '#00f0ff');

    setTimeout(() => {
      if (this.destroyed) return;
      this.connectedHost = ip;
      this.currentDir = '/';
      // Switch filesystem to target if different
      this._printLine(`Connected to ${host.name} (${host.os})`, '#00ff88');
      this._printLine(`Session established on port ${port}`, '#00ff88');
      this.gameState.connected.push(ip);
      this._updateHUD();
    }, 500);
  }

  _cmdDisconnect() {
    if (!this.connectedHost) { this._printLine('Not connected to any host.', '#888'); return; }
    this._printLine(`Disconnected from ${this.connectedHost}`, '#ff8800');
    this.connectedHost = null;
    this.currentDir = '/';
    this._updateHUD();
  }

  _cmdBruteforce(service) {
    if (!service) { this._printLine('bruteforce: missing service (e.g., bruteforce ssh)', '#ff003c'); return; }
    this._printLine(`Initiating brute-force attack on ${service}...`, '#ff8800');
    this._printLine('WARNING: This will increase detection level!', '#ff8800');

    let progress = 0;
    const attempts = ['admin', 'root', 'password', 'nexus', 'letmein', '2049', 'ghost', 'GHOST_PROTOCOL'];
    let i = 0;
    const bfInterval = setInterval(() => {
      if (this.destroyed) { clearInterval(bfInterval); return; }
      progress += 12.5;
      this._printLine(`  Trying: ${attempts[i] || 'password_' + i}... ${this._printProgress(progress, 100, 20, '#ff8800')}`, '#ff8800');
      i++;
      this.detection = Math.min(100, this.detection + 2);

      if (progress >= 100) {
        clearInterval(bfInterval);
        if (Math.random() < 0.7) {
          this._printLine(`\n  ✓ ACCESS GRANTED — Credentials found!`, '#00ff88');
          this._printLine(`  user: nexus | pass: GHOST_PROTOCOL`, '#00ff88');
        } else {
          this._printLine(`\n  ✗ Brute-force failed. Service hardened.`, '#ff003c');
        }
      }
    }, 400);
    this.processTimers.push(bfInterval);
  }

  _cmdExploit(vuln) {
    if (!vuln) { this._printLine('exploit: missing vulnerability name', '#ff003c'); return; }
    this._printLine(`Loading exploit: ${vuln}`, '#ff8800');
    this._printLine('Preparing payload...', '#ff8800');

    setTimeout(() => {
      if (this.destroyed) return;
      this._printLine('Sending payload...', '#ff8800');

      setTimeout(() => {
        if (this.destroyed) return;
        this._printLine('Buffer overflow triggered!', '#00ff88');
        this._printLine('Shell access gained!', '#00ff88');
        this.gameState.flags.push(vuln.toUpperCase().replace(/[^A-Z_]/g, '_'));

        const flag = this._findFlagInFS();
        if (flag) {
          this._printLine(`\nflag{${flag}}`, '#ffff00');
          this.gameState.flags.push(flag);
        }
        this._checkObjective();
      }, 800);
    }, 600);
  }

  _cmdDecrypt(file, method) {
    if (!file) { this._printLine('decrypt: missing file path', '#ff003c'); return; }
    const resolved = this._resolvePath(file);
    const node = this.filesystem[resolved];
    if (!node) { this._printLine(`decrypt: ${file}: No such file`, '#ff003c'); return; }
    if (!node.encrypted) { this._printLine(`decrypt: ${file}: File is not encrypted`, '#888'); return; }

    const cipher = node.cipher || 'rot13';
    const usedMethod = method || 'rot13';

    this._printLine(`Decrypting ${file} with ${usedMethod}...`, '#00f0ff');

    setTimeout(() => {
      if (this.destroyed) return;
      let decrypted = node.content;
      if (usedMethod === cipher || (cipher === 'rot13' && usedMethod === 'rot13') ||
          (cipher === 'numbers' && usedMethod === 'numbers') ||
          (cipher === 'caesar3' && usedMethod === 'caesar3')) {
        // Correct decryption
        if (cipher === 'rot13') {
          decrypted = node.content.replace(/[a-zA-Z]/g, c => {
            const base = c <= 'Z' ? 65 : 97;
            return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
          });
        } else if (cipher === 'numbers') {
          decrypted = node.content.replace(/\d+/g, m => {
            const n = parseInt(m);
            return n >= 1 && n <= 26 ? String.fromCharCode(64 + n) : m;
          });
        } else if (cipher === 'caesar3') {
          decrypted = node.content.replace(/[a-zA-Z]/g, c => {
            const base = c <= 'Z' ? 65 : 97;
            return String.fromCharCode(((c.charCodeAt(0) - base + 23) % 26) + base);
          });
        }

        this._printLine('✓ Decryption successful!', '#00ff88');
        this._printLine('', '#888');
        decrypted.split('\n').forEach(line => {
          if (line.includes('flag{') || line.includes('SYNT{') || line.includes('flag{')) {
            this._printLine(line, '#ffff00');
            const flag = line.match(/flag\{([^}]+)\}/);
            if (flag) this.gameState.flags.push(flag[1]);
          } else {
            this._printLine(line, '#00ff88');
          }
        });

        // Check for specific flags in decrypted content
        if (decrypted.includes('DECRYPTING_COMPLETE') || decrypted.includes('CIPHER_MASTER') ||
            decrypted.includes('LAYER_ONE_DONE') || decrypted.includes('LAYER_TWO_DONE') ||
            decrypted.includes('CIPHER_MASKER')) {
          const flags = decrypted.match(/[A-Z_]+(?=})/g);
          if (flags) flags.forEach(f => this.gameState.flags.push(f));
        }

        // Add generic decrypt flag
        this.gameState.flags.push('DECRYPTING_COMPLETE');
        node.encrypted = false;
        node.content = decrypted;
      } else {
        this._printLine('✗ Wrong decryption method. Try a different cipher.', '#ff003c');
        this._printLine(`Hint: Check cipher_guide.txt or README files`, '#888');
      }
      this._checkObjective();
    }, 600);
  }

  _cmdDownload(file) {
    if (!file) { this._printLine('download: missing file path', '#ff003c'); return; }
    const resolved = this._resolvePath(file);
    const node = this.filesystem[resolved];
    if (!node) { this._printLine(`download: ${file}: No such file`, '#ff003c'); return; }
    if (node.type === 'dir') { this._printLine(`download: ${file}: Is a directory`, '#ff003c'); return; }

    this._printLine(`Downloading ${file}...`, '#00f0ff');
    let progress = 0;
    const dlInterval = setInterval(() => {
      if (this.destroyed) { clearInterval(dlInterval); return; }
      progress += 20;
      this._printLine(`  ${this._printProgress(progress, 100, 25)}`, '#00f0ff');
      if (progress >= 100) {
        clearInterval(dlInterval);
        this._printLine(`✓ Download complete: ${file}`, '#00ff88');
        this.gameState.extractedData.push(node.content);
        // Check for flags in downloaded content
        const flags = node.content.match(/flag\{([^}]+)\}/g);
        if (flags) flags.forEach(f => {
          const inner = f.match(/flag\{([^}]+)\}/)[1];
          this.gameState.flags.push(inner);
        });
        // Check for core dump
        if (node.content.includes('NEXUS_CORE_DUMP')) {
          this.gameState.extractedData.push('NEXUS_CORE_DUMP');
        }
        this._checkObjective();
      }
    }, 200);
    this.processTimers.push(dlInterval);
  }

  _cmdUpload(file) {
    if (!file) { this._printLine('upload: missing file name', '#ff003c'); return; }
    this._printLine(`Uploading backdoor: ${file}...`, '#ff8800');
    setTimeout(() => {
      if (this.destroyed) return;
      this._printLine(`✓ Backdoor planted: ${file}`, '#00ff88');
      this._printLine('  Persistent access established.', '#00ff88');
      this.detection = Math.min(100, this.detection + 5);
    }, 500);
  }

  _cmdTrace() {
    const level = this.detection;
    let color = '#00ff88';
    let status = 'SAFE';
    if (level > 70) { color = '#ff003c'; status = 'CRITICAL'; }
    else if (level > 40) { color = '#ff8800'; status = 'WARNING'; }
    else if (level > 20) { color = '#ffff00'; status = 'CAUTION'; }

    this._printLine('┌─── TRACE STATUS ───┐', color);
    this._printLine(`│ Detection: ${level.toFixed(1)}%`.padEnd(22) + '│', color);
    this._printLine(`│ Status: ${status}`.padEnd(22) + '│', color);
    this._printLine(`│ ${this._printProgress(level, 100, 18)}`.padEnd(24) + '│', color);
    this._printLine('└─────────────────────┘', color);

    if (level > 50) {
      this._printLine('⚠ Active trace detected. Reduce noise!', '#ff8800');
    }
  }

  _cmdNetwork() {
    this._printASCII(
      `    ┌──────────────────────────────────┐
    │       NETWORK TOPOLOGY           │
    └──────────────────────────────────┘`, '#00f0ff');

    const hosts = Object.entries(this.network);
    if (hosts.length === 0) {
      this._printLine('  No hosts discovered. Use "scan [ip]" to explore.', '#888');
      return;
    }

    for (const [ip, host] of hosts) {
      const connected = this.connectedHost === ip ? ' ← CONNECTED' : '';
      this._printLine(`  ┌─ ${ip} (${host.name})${connected}`, '#00f0ff');
      this._printLine(`  │  OS: ${host.os}`, '#888');
      this._printLine(`  │  Ports: ${host.ports.join(', ')}`, '#888');
      this._printLine('  └──────────────', '#888');
    }
  }

  _cmdPing(host) {
    if (!host) { this._printLine('ping: missing host', '#ff003c'); return; }
    const exists = this.network[host];
    if (exists) {
      this._printLine(`PING ${host}: 64 bytes, time=${Math.floor(Math.random() * 20 + 5)}ms`, '#00ff88');
      this._printLine(`PING ${host}: 64 bytes, time=${Math.floor(Math.random() * 20 + 5)}ms`, '#00ff88');
      this._printLine(`--- ${host} ping statistics ---`, '#888');
      this._printLine('2 packets transmitted, 2 received, 0% loss', '#888');
    } else {
      this._printLine(`PING ${host}: Host unreachable`, '#ff003c');
    }
  }

  _cmdIfconfig() {
    this._printLine('eth0: flags=4163<UP,BROADCAST,RUNNING>', '#00ff88');
    this._printLine('  inet 192.168.1.100  netmask 255.255.255.0', '#00ff88');
    this._printLine('  ether aa:bb:cc:dd:ee:ff', '#888');
    if (this.connectedHost) {
      this._printLine(`tun0: flags=4163<POINTOPOINT>`, '#00ff88');
      this._printLine(`  inet 10.99.99.1  peer ${this.connectedHost}`, '#00ff88');
    }
  }

  _cmdStatus() {
    const level = this.currentLevel >= 0 ? this.levels[this.currentLevel] : null;
    this._printLine('┌─── MISSION STATUS ───┐', '#00f0ff');
    this._printLine(`│ Level: ${level ? level.name : 'SANDBOX'}`, '#00f0ff');
    this._printLine(`│ Score: ${this.score}`, '#00f0ff');
    this._printLine(`│ Detection: ${this.detection.toFixed(1)}%`, this.detection > 50 ? '#ff003c' : '#00ff88');
    this._printLine(`│ Connected: ${this.connectedHost || 'none'}`, '#00f0ff');
    this._printLine(`│ Flags: ${this.gameState.flags.length}`, '#00f0ff');
    this._printLine('└──────────────────────┘', '#00f0ff');
  }

  _cmdHistory() {
    this.commandHistory.forEach((cmd, i) => {
      this._printLine(`  ${(i + 1).toString().padStart(3)}  ${cmd}`, '#888');
    });
  }

  _cmdHint() {
    if (this.currentLevel < 0) { this._printLine('No hints in sandbox mode.', '#888'); return; }
    const level = this.levels[this.currentLevel];
    this._printLine(`[NEXUS AI] ${level.hint}`, '#aa66ff');
    this.score = Math.max(0, this.score - 50);
    this._printLine('(Score penalty: -50)', '#ff8800');
  }

  _cmdDecode(input) {
    if (!input) { this._printLine('decode: missing input text', '#ff003c'); return; }
    // Try ROT13
    const decoded = input.replace(/[a-zA-Z]/g, c => {
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
    this._printLine(`ROT13: ${decoded}`, '#00f0ff');
  }

  _cmdExit() {
    this._clearTimers();
    if (this.detectionInterval) clearInterval(this.detectionInterval);
    this.running = false;
    this._showMenu();
  }

  // ── Path Resolution ────────────────────────────────────────────────

  _resolvePath(path) {
    if (!path) return this.currentDir;
    if (path.startsWith('/')) return this._normalizePath(path);
    if (path === '..') {
      const parts = this.currentDir.split('/').filter(Boolean);
      parts.pop();
      return '/' + parts.join('/');
    }
    return this._normalizePath(this.currentDir + '/' + path);
  }

  _normalizePath(path) {
    const parts = path.split('/').filter(Boolean);
    const resolved = [];
    for (const part of parts) {
      if (part === '..') resolved.pop();
      else if (part !== '.') resolved.push(part);
    }
    return '/' + resolved.join('/');
  }

  _findFlagInFS() {
    for (const [path, node] of Object.entries(this.filesystem)) {
      if (node.type === 'file' && node.content) {
        const match = node.content.match(/flag\{([^}]+)\}/);
        if (match && !this.gameState.flags.includes(match[1])) return match[1];
      }
    }
    return null;
  }

  // ── Objective Check ────────────────────────────────────────────────

  _checkObjective() {
    if (this.currentLevel < 0 || this.gameOver || this.gameWon) return;
    const level = this.levels[this.currentLevel];
    if (!level) return;

    if (level.objective(this.gameState)) {
      this.gameWon = true;
      if (this.detectionInterval) clearInterval(this.detectionInterval);
      this._clearTimers();

      const elapsed = ((Date.now() - this.levelStartTime) / 1000).toFixed(1);
      const timeBonus = Math.max(0, Math.floor(500 - this.detection * 5));
      this.score += 1000 + timeBonus;

      this._printLine('', '#888');
      this._printLine('╔══════════════════════════════════════╗', '#00ff88');
      this._printLine(`║  ✓ MISSION COMPLETE: ${level.name.padEnd(17)}║`, '#00ff88');
      this._printLine('╠══════════════════════════════════════╣', '#00ff88');
      this._printLine(`║  Time: ${elapsed}s`, '#00ff88');
      this._printLine(`║  Detection: ${this.detection.toFixed(1)}%`, '#00ff88');
      this._printLine(`║  Score: +${1000 + timeBonus}`, '#00ff88');
      this._printLine('╚══════════════════════════════════════╝', '#00ff88');
      this._printLine('', '#888');
      this._printLine('Type "next" for next mission or "exit" for menu.', '#888');

      // Add 'next' command temporarily
      const origExecute = this._executeCommand.bind(this);
      this._executeCommand = (input) => {
        if (input.trim().toLowerCase() === 'next') {
          this._executeCommand = origExecute;
          this._loadLevel(this.currentLevel + 1);
          if (this.currentLevel >= this.levels.length) {
            this._showVictory();
          }
        } else {
          origExecute(input);
        }
      };
    }
  }

  _onDetected() {
    this.gameOver = true;
    this._clearTimers();
    if (this.detectionInterval) clearInterval(this.detectionInterval);

    this._printLine('', '#888');
    this._printASCII(
      `  ██████╗  █████╗ ███╗   ███╗███████╗
 ██╔════╝ ██╔══██╗████╗ ████║██╔════╝
 ██║  ███╗███████║██╔████╔██║█████╗
 ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝
 ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗
  ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝
  ██████╗ ██╗   ██╗███████╗██████╗
 ██╔═══██╗██║   ██║██╔════╝██╔══██╗
 ██║   ██║██║   ██║█████╗  ██████╔╝
 ██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗
 ╚██████╔╝ ╚████╔╝ ███████╗██║  ██║
  ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝`, '#ff003c');
    this._printLine('', '#888');
    this._printLine('Connection terminated. Trace completed.', '#ff003c');
    this._printLine('Type "retry" to try again or "exit" for menu.', '#888');

    const origExecute = this._executeCommand.bind(this);
    this._executeCommand = (input) => {
      const cmd = input.trim().toLowerCase();
      if (cmd === 'retry') {
        this._executeCommand = origExecute;
        this._loadLevel(this.currentLevel);
      } else if (cmd === 'exit') {
        this._executeCommand = origExecute;
        this._cmdExit();
      } else {
        this._printLine('Mission failed. Type "retry" or "exit".', '#ff003c');
      }
    };
  }

  _showVictory() {
    this._clearTimers();
    if (this.detectionInterval) clearInterval(this.detectionInterval);

    this._printLine('', '#888');
    this._printASCII(
      `  ██╗   ██╗██╗ ██████╗████████╗
  ██║   ██║██║██╔════╝╚══██╔══╝
  ██║   ██║██║██║        ██║
  ╚██╗ ██╔╝██║██║        ██║
   ╚████╔╝ ██║╚██████╗   ██║
    ╚═══╝  ╚═╝ ╚═════╝   ╚═╝
  ██╗    ██╗██╗███╗   ██╗
  ██║    ██║██║████╗  ██║
  ██║ █╗ ██║██║██╔██╗ ██║
  ██║███╗██║██║██║╚██╗██║
  ╚███╔███╔╝██║██║ ╚████║
   ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝`, '#00ff88');
    this._printLine('', '#888');
    this._printLine('All missions complete, operative.', '#00ff88');
    this._printLine(`Final Score: ${this.score}`, '#ffff00');
    this._printLine('The NEXUS acknowledges your skill.', '#aa66ff');
    this._printLine('', '#888');
    this._printLine('Type "exit" to return to menu.', '#888');
  }

  // ── HUD ────────────────────────────────────────────────────────────

  _updateHUD() {
    const level = this.currentLevel >= 0 ? this.levels[this.currentLevel] : null;
    const detColor = this.detection > 70 ? '#ff003c' : this.detection > 40 ? '#ff8800' : '#00ff88';
    this.hud.innerHTML = `
      <span style="color: #ff003c; font-size: 11px;">${level ? 'MISSION ' + (level.id + 1) + ': ' + level.name : 'SANDBOX'}</span>
      <div style="display: flex; gap: 15px;">
        <span style="color: #888; font-size: 11px;">SCORE: ${this.score}</span>
        <span style="color: ${detColor}; font-size: 11px;">DET: ${this.detection.toFixed(0)}%</span>
        <span style="color: #888; font-size: 11px;">${this.connectedHost ? '→ ' + this.connectedHost : 'LOCAL'}</span>
      </div>
    `;
    this.promptEl.textContent = this._getPrompt();
  }
}
