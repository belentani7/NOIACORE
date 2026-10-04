/**
 * NEXUS OS — Cyberpunk Escape Room
 * Interactive escape room game with 6 rooms, unique puzzles, inventory system,
 * hint system, timer, leaderboard, and save/load. Full neon glassmorphism aesthetic.
 */
class EscapeRoom {
  constructor(container) {
    this.container = container;
    this.wrapper = null;
    this.destroyed = false;

    // Game state
    this.currentRoom = 0;
    this.inventory = [];
    this.maxInventory = 8;
    this.selectedItem = null;
    this.hintsRemaining = 3;
    this.score = 0;
    this.timerStart = 0;
    this.timerInterval = null;
    this.elapsed = 0;
    this.roomsSolved = [];
    this.gameState = 'menu'; // menu, playing, victory

    // Room data
    this.rooms = this._defineRooms();

    // Storage
    this.storageKey = 'nexus_escape_save';
    this.leaderboardKey = 'nexus_escape_scores';
    this.leaderboard = [];

    // Animation
    this.glitchActive = false;
    this.glitchTimer = 0;

    // Puzzle-specific state
    this.puzzleStates = {};

    // Sound hooks (interface only)
    this.sounds = {
      click: null, puzzleSolve: null, itemPickup: null,
      error: null, hint: null, roomTransition: null, victory: null
    };
  }

  render() {
    this._loadLeaderboard();
    this._buildDOM();
    this._showMenu();
  }

  destroy() {
    this.destroyed = true;
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  // ── Room Definitions ───────────────────────────────────────────────

  _defineRooms() {
    return [
      {
        id: 0,
        name: 'BOOT SEQUENCE',
        subtitle: 'Terminal Access Required',
        narrative: 'You awaken inside the NEXUS mainframe. A glowing terminal flickers before you.\n"NEXUS AI: You are trapped in my domain. Prove your worth, or remain forever."\nThe terminal demands a password. Sticky notes with cryptic clues are scattered around.',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 50%, #1a0a1a 100%)',
        items: [
          { id: 'note1', name: 'Sticky Note #1', x: 15, y: 25, found: false,
            desc: 'Scribbled text: "The first two digits are 7 and 3"' },
          { id: 'note2', name: 'Sticky Note #2', x: 70, y: 40, found: false,
            desc: 'Faded text: "Third digit = sum of first two minus 5"' },
          { id: 'note3', name: 'Torn Paper', x: 40, y: 65, found: false,
            desc: 'Partial message: "Password format: XXX (three digits). The number is prime."' }
        ],
        puzzle: {
          type: 'code',
          answer: '735',
          prompt: 'ENTER SYSTEM PASSWORD:',
          placeholder: 'Three digits...',
          maxLength: 3,
          hint: 'First digit: 7, Second: 3, Third: 7+3-5=5. The password is 735.',
          solved: false,
          attempts: 0
        },
        decorations: [
          { type: 'terminal', x: 35, y: 20, w: 30, h: 35 },
          { type: 'cable', x: 10, y: 75, w: 80, h: 2 },
          { type: 'cable', x: 5, y: 80, w: 90, h: 2 }
        ]
      },
      {
        id: 1,
        name: 'NEURAL PATTERN',
        subtitle: 'Sequence Recognition Protocol',
        narrative: 'A neural interface pulses with colored light.\n"NEXUS AI: Replicate the pattern. Your mind must sync with mine."\nWatch the sequence, then repeat it. Three rounds required.',
        background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1a2b 50%, #0a1a2a 100%)',
        items: [
          { id: 'pattern_guide', name: 'Neural Guide', x: 80, y: 15, found: false,
            desc: 'A data chip. "Colors: RED, CYAN, GREEN, AMBER, VIOLET"' }
        ],
        puzzle: {
          type: 'pattern',
          colors: ['#ff003c', '#00f0ff', '#00ff88', '#ff8800', '#aa66ff'],
          colorNames: ['RED', 'CYAN', 'GREEN', 'AMBER', 'VIOLET'],
          sequence: [],
          playerSequence: [],
          round: 0,
          maxRounds: 3,
          showingSequence: false,
          showIndex: 0,
          solved: false,
          hint: 'Watch the sequence carefully. Each round adds one more color to remember.',
          attempts: 0
        },
        decorations: [
          { type: 'neural_hub', x: 30, y: 15, w: 40, h: 50 }
        ]
      },
      {
        id: 2,
        name: 'FRAGMENTED MEMORY',
        subtitle: 'Data Reconstruction Required',
        narrative: 'A corrupted display shows a scrambled image grid.\n"NEXUS AI: My memories are fragmented. Reassemble them to proceed."\nSlide the tiles to restore the pattern. One space is empty.',
        background: 'linear-gradient(135deg, #0a0a15 0%, #150a1a 50%, #1a0a15 100%)',
        items: [
          { id: 'memory_chip', name: 'Memory Fragment', x: 85, y: 70, found: false,
            desc: 'A glowing chip. "The pattern is a gradient from top-left to bottom-right."' }
        ],
        puzzle: {
          type: 'sliding',
          size: 3,
          tiles: [],
          solved: false,
          moves: 0,
          hint: 'Work row by row from top. Get the top row correct first, then middle, then bottom.',
          attempts: 0
        },
        decorations: [
          { type: 'display', x: 25, y: 10, w: 50, h: 60 }
        ]
      },
      {
        id: 3,
        name: 'WIRE MATRIX',
        subtitle: 'Circuit Reconstruction',
        narrative: 'A panel of disconnected wires hangs before you.\n"NEXUS AI: The neural pathways are severed. Reconnect them correctly."\nMatch each colored wire on the left to its pair on the right.',
        background: 'linear-gradient(135deg, #0a0f0a 0%, #0a1a0a 50%, #0a0a15 100%)',
        items: [
          { id: 'wire_map', name: 'Circuit Diagram', x: 10, y: 75, found: false,
            desc: 'A faded diagram showing wire connections:\nRed→Red, Blue→Blue, Green→Green, Yellow→Yellow, Purple→Purple, Orange→Orange' }
        ],
        puzzle: {
          type: 'wires',
          wireColors: ['#ff003c', '#4488ff', '#00ff88', '#ffff00', '#aa66ff', '#ff8800'],
          wireNames: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'],
          leftOrder: [],
          rightOrder: [],
          connections: {},
          selectedLeft: null,
          solved: false,
          hint: 'Match each colored wire on the left to the same color on the right. Click left, then right.',
          attempts: 0
        },
        decorations: [
          { type: 'panel', x: 20, y: 10, w: 60, h: 65 }
        ]
      },
      {
        id: 4,
        name: 'BINARY LOCK',
        subtitle: 'Encryption Bypass',
        narrative: 'A massive vault door blocks your path, secured by a 3-digit combination lock.\n"NEXUS AI: The final lock. Only those who observe carefully will pass."\nExamine the room for clues to the combination.',
        background: 'linear-gradient(135deg, #1a0a0a 0%, #0a0a1a 50%, #150a1a 100%)',
        items: [
          { id: 'clue_a', name: 'Etched Metal Plate', x: 12, y: 20, found: false,
            desc: 'Engraved text: "First digit: number of rooms you\'ve escaped (count from 1)"' },
          { id: 'clue_b', name: 'Digital Display', x: 75, y: 30, found: false,
            desc: 'Flickering display shows: "Second digit = 2 × first digit - 3"' },
          { id: 'clue_c', name: 'Scratched Wall', x: 50, y: 70, found: false,
            desc: 'Scratched into the wall: "Third digit = first + second"' }
        ],
        puzzle: {
          type: 'combination',
          digits: [0, 0, 0],
          answer: [5, 7, 2],
          solved: false,
          hint: 'You\'ve solved 4 rooms (0-3), so first=5. Second=2×5-3=7. Third=5+7=12, but single digit=2. Code: 5-7-2.',
          attempts: 0
        },
        decorations: [
          { type: 'vault', x: 25, y: 5, w: 50, h: 75 }
        ]
      },
      {
        id: 5,
        name: 'THE GATE',
        subtitle: 'Final Authentication',
        narrative: 'The NEXUS core reveals itself — a wall of ancient symbols glowing in neon.\n"NEXUS AI: The final test. Match the symbol pairs. Only then are you free."\nClick pairs of matching symbols to clear them all.',
        background: 'linear-gradient(135deg, #0a0a2a 0%, #1a0a2a 50%, #0a1a2a 100%)',
        items: [
          { id: 'symbol_key', name: 'Symbol Codex', x: 88, y: 12, found: false,
            desc: 'Ancient text: "Each symbol appears twice. Find all 4 pairs to unlock the gate."' }
        ],
        puzzle: {
          type: 'symbols',
          symbols: ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'],
          grid: [],
          revealed: [],
          matched: [],
          selected: null,
          pairsFound: 0,
          totalPairs: 4,
          solved: false,
          processing: false,
          hint: 'Click symbols to reveal them. Find matching pairs. There are 4 pairs in a 4x2 grid.',
          attempts: 0
        },
        decorations: [
          { type: 'gate', x: 20, y: 5, w: 60, h: 80 }
        ]
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

    // Menu overlay
    this.menuOverlay = document.createElement('div');
    this.menuOverlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(10, 10, 15, 0.98); z-index: 20; overflow-y: auto;
    `;
    this.wrapper.appendChild(this.menuOverlay);

    // HUD
    this.hud = document.createElement('div');
    this.hud.style.cssText = `
      display: none; flex-shrink: 0; padding: 5px 10px;
      background: rgba(0,0,0,0.6); border-bottom: 1px solid rgba(255,0,60,0.2);
    `;
    this.wrapper.appendChild(this.hud);

    // Room area
    this.roomArea = document.createElement('div');
    this.roomArea.style.cssText = `
      display: none; flex: 1; position: relative; overflow: hidden;
    `;
    this.wrapper.appendChild(this.roomArea);

    // Glitch overlay
    this.glitchOverlay = document.createElement('div');
    this.glitchOverlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 15; display: none;
      background: repeating-linear-gradient(0deg, rgba(255,0,60,0.03) 0px, transparent 2px, transparent 4px);
    `;
    this.wrapper.appendChild(this.glitchOverlay);

    // Narrative bar
    this.narrativeBar = document.createElement('div');
    this.narrativeBar.style.cssText = `
      display: none; flex-shrink: 0; padding: 8px 12px;
      background: rgba(0,0,0,0.5); border-top: 1px solid rgba(255,0,60,0.15);
      max-height: 80px; overflow-y: auto;
    `;
    this.wrapper.appendChild(this.narrativeBar);
  }

  _showMenu() {
    this.gameState = 'menu';
    this.roomArea.style.display = 'none';
    this.hud.style.display = 'none';
    this.narrativeBar.style.display = 'none';
    this.menuOverlay.style.display = 'flex';

    const hasSave = this._hasSave();
    const lbHTML = this.leaderboard.length > 0 ? `
      <div style="margin-top: 15px;">
        <div style="color: #ff003c; font-size: 11px; margin-bottom: 5px;">LEADERBOARD</div>
        ${this.leaderboard.slice(0, 5).map((s, i) => `
          <div style="color: ${i === 0 ? '#ff003c' : '#666'}; font-size: 10px;">
            ${i + 1}. ${this._fmtTime(s.time)} — ${s.roomsSolved}/6 rooms — ${s.score}pts
          </div>
        `).join('')}
      </div>
    ` : '';

    this.menuOverlay.innerHTML = `
      <div style="text-align: center; max-width: 450px;">
        <h1 style="color: #ff003c; font-size: 32px; margin: 0 0 5px; text-shadow: 0 0 20px #ff003c, 0 0 40px rgba(255,0,60,0.5);
          font-family: 'Courier New', monospace; letter-spacing: 5px;">ESCAPE</h1>
        <h2 style="color: #ff4488; font-size: 14px; margin: 0 0 5px; text-shadow: 0 0 8px #ff4488; letter-spacing: 3px;">
          THE NEXUS MACHINE</h2>
        <p style="color: #666; font-size: 11px; margin: 0 0 25px; line-height: 1.5;">
          You are trapped inside NEXUS OS. The AI won't let you leave<br>unless you prove your worth. Solve 6 rooms to escape.
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
          <button id="er-new-btn" style="
            padding: 10px 35px; background: rgba(255, 0, 60, 0.2); border: 2px solid #ff003c;
            color: #ff003c; font-family: 'Courier New', monospace; font-size: 14px;
            cursor: pointer; letter-spacing: 2px; text-shadow: 0 0 8px #ff003c;
            box-shadow: 0 0 15px rgba(255,0,60,0.3);
          ">NEW GAME</button>
          ${hasSave ? `
            <button id="er-continue-btn" style="
              padding: 8px 30px; background: rgba(0,240,255,0.1); border: 1px solid rgba(0,240,255,0.3);
              color: #00f0ff; font-family: 'Courier New', monospace; font-size: 12px; cursor: pointer;
            ">CONTINUE</button>
          ` : ''}
        </div>
        ${lbHTML}
      </div>
    `;

    this.menuOverlay.querySelector('#er-new-btn').addEventListener('click', () => this._newGame());
    const contBtn = this.menuOverlay.querySelector('#er-continue-btn');
    if (contBtn) contBtn.addEventListener('click', () => this._loadGame());
  }

  // ── Game Start ─────────────────────────────────────────────────────

  _newGame() {
    this.currentRoom = 0;
    this.inventory = [];
    this.selectedItem = null;
    this.hintsRemaining = 3;
    this.score = 0;
    this.roomsSolved = [];
    this.gameState = 'playing';

    // Reset all room puzzles
    this.rooms = this._defineRooms();
    this._initPuzzleStates();

    // Timer
    this.timerStart = Date.now();
    this.elapsed = 0;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.destroyed || this.gameState !== 'playing') return;
      this.elapsed = Math.floor((Date.now() - this.timerStart) / 1000);
      this._updateHUD();
    }, 1000);

    this.menuOverlay.style.display = 'none';
    this.roomArea.style.display = 'block';
    this.hud.style.display = 'flex';
    this.narrativeBar.style.display = 'block';

    this._renderRoom();
  }

  _initPuzzleStates() {
    // Pattern puzzle init
    const patternPuzzle = this.rooms[1].puzzle;
    patternPuzzle.sequence = [];
    patternPuzzle.playerSequence = [];
    patternPuzzle.round = 0;
    patternPuzzle.showingSequence = false;

    // Sliding puzzle init
    const slidingPuzzle = this.rooms[2].puzzle;
    const size = slidingPuzzle.size;
    const total = size * size;
    let tiles = [];
    for (let i = 1; i < total; i++) tiles.push(i);
    tiles.push(0); // 0 = empty
    // Shuffle (ensure solvable)
    for (let i = 0; i < 200; i++) {
      const emptyIdx = tiles.indexOf(0);
      const row = Math.floor(emptyIdx / size);
      const col = emptyIdx % size;
      const moves = [];
      if (row > 0) moves.push(emptyIdx - size);
      if (row < size - 1) moves.push(emptyIdx + size);
      if (col > 0) moves.push(emptyIdx - 1);
      if (col < size - 1) moves.push(emptyIdx + 1);
      const swap = moves[Math.floor(Math.random() * moves.length)];
      [tiles[emptyIdx], tiles[swap]] = [tiles[swap], tiles[emptyIdx]];
    }
    slidingPuzzle.tiles = tiles;
    slidingPuzzle.moves = 0;

    // Wire puzzle init
    const wirePuzzle = this.rooms[3].puzzle;
    const left = [...wirePuzzle.wireColors];
    const right = [...wirePuzzle.wireColors];
    // Shuffle right side
    for (let i = right.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [right[i], right[j]] = [right[j], right[i]];
    }
    wirePuzzle.leftOrder = left;
    wirePuzzle.rightOrder = right;
    wirePuzzle.connections = {};
    wirePuzzle.selectedLeft = null;

    // Combination lock init
    this.rooms[4].puzzle.digits = [0, 0, 0];

    // Symbol matching init
    const symbolPuzzle = this.rooms[5].puzzle;
    const syms = symbolPuzzle.symbols.slice(0, symbolPuzzle.totalPairs);
    let grid = [...syms, ...syms];
    for (let i = grid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [grid[i], grid[j]] = [grid[j], grid[i]];
    }
    symbolPuzzle.grid = grid;
    symbolPuzzle.revealed = Array(grid.length).fill(false);
    symbolPuzzle.matched = Array(grid.length).fill(false);
    symbolPuzzle.selected = null;
    symbolPuzzle.pairsFound = 0;
    symbolPuzzle.processing = false;
  }

  // ── Room Rendering ─────────────────────────────────────────────────

  _renderRoom() {
    const room = this.rooms[this.currentRoom];
    if (!room) return;

    this.roomArea.innerHTML = '';
    this.roomArea.style.background = room.background;

    // Room background decorations (CSS-drawn)
    this._renderDecorations(room);

    // Interactive items (hidden objects)
    this._renderItems(room);

    // Puzzle area
    this._renderPuzzle(room);

    // Narrative
    this.narrativeBar.innerHTML = '';
    const narrativeLines = room.narrative.split('\n');
    for (const line of narrativeLines) {
      const p = document.createElement('div');
      const isNexus = line.startsWith('"NEXUS');
      p.style.cssText = `color: ${isNexus ? '#aa66ff' : '#888'}; font-size: 11px; margin: 2px 0;
        ${isNexus ? 'font-style: italic; text-shadow: 0 0 5px #aa66ff44;' : ''}`;
      p.textContent = line;
      this.narrativeBar.appendChild(p);
    }

    this._updateHUD();
  }

  _renderDecorations(room) {
    for (const dec of room.decorations) {
      const el = document.createElement('div');
      el.style.cssText = `
        position: absolute; left: ${dec.x}%; top: ${dec.y}%;
        width: ${dec.w}%; height: ${dec.h}%;
      `;

      switch (dec.type) {
        case 'terminal':
          el.style.background = 'rgba(0,0,0,0.6)';
          el.style.border = '2px solid rgba(255,0,60,0.3)';
          el.style.boxShadow = '0 0 20px rgba(255,0,60,0.15), inset 0 0 15px rgba(255,0,60,0.05)';
          el.innerHTML = `
            <div style="padding: 8px; font-size: 10px; color: #ff003c; text-shadow: 0 0 5px #ff003c;">
              <div>NEXUS TERMINAL v3.1</div>
              <div style="color: #555;">────────────────</div>
              <div style="color: #00ff88; margin-top: 4px;">READY FOR INPUT_</div>
            </div>
          `;
          break;
        case 'cable':
          el.style.background = 'linear-gradient(90deg, transparent, rgba(255,0,60,0.1), rgba(0,240,255,0.1), transparent)';
          el.style.height = '2px';
          break;
        case 'neural_hub':
          el.style.background = 'radial-gradient(ellipse, rgba(0,240,255,0.1) 0%, transparent 70%)';
          el.style.border = '1px solid rgba(0,240,255,0.2)';
          el.style.borderRadius = '50%';
          el.style.boxShadow = '0 0 30px rgba(0,240,255,0.1)';
          break;
        case 'display':
          el.style.background = 'rgba(0,0,0,0.5)';
          el.style.border = '2px solid rgba(255,0,60,0.2)';
          el.style.boxShadow = '0 0 15px rgba(255,0,60,0.1)';
          break;
        case 'panel':
          el.style.background = 'rgba(0,0,0,0.4)';
          el.style.border = '1px solid rgba(0,255,136,0.2)';
          el.style.boxShadow = '0 0 10px rgba(0,255,136,0.1)';
          break;
        case 'vault':
          el.style.background = 'linear-gradient(180deg, rgba(255,0,60,0.05), rgba(0,0,0,0.6))';
          el.style.border = '3px solid rgba(255,0,60,0.3)';
          el.style.boxShadow = '0 0 25px rgba(255,0,60,0.2)';
          el.style.borderRadius = '10px';
          break;
        case 'gate':
          el.style.background = 'radial-gradient(ellipse, rgba(170,102,255,0.1) 0%, transparent 70%)';
          el.style.border = '2px solid rgba(170,102,255,0.3)';
          el.style.boxShadow = '0 0 40px rgba(170,102,255,0.15)';
          el.style.borderRadius = '5px';
          break;
      }
      this.roomArea.appendChild(el);
    }
  }

  _renderItems(room) {
    for (const item of room.items) {
      if (item.found) continue;
      const el = document.createElement('div');
      el.style.cssText = `
        position: absolute; left: ${item.x}%; top: ${item.y}%;
        width: 24px; height: 24px; cursor: pointer; z-index: 5;
        border-radius: 50%; background: rgba(255,0,60,0.15);
        border: 1px solid rgba(255,0,60,0.3);
        animation: pulse-item 2s ease-in-out infinite;
        transition: all 0.2s;
      `;
      el.title = 'Click to examine';
      el.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
        color: #ff003c; font-size: 10px; text-shadow: 0 0 5px #ff003c;">?</div>`;

      el.addEventListener('mouseenter', () => {
        el.style.boxShadow = '0 0 15px rgba(255,0,60,0.5)';
        el.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.boxShadow = 'none';
        el.style.transform = 'scale(1)';
      });
      el.addEventListener('click', () => this._pickupItem(item));

      this.roomArea.appendChild(el);
    }

    // Add pulse animation style if not exists
    if (!document.getElementById('er-pulse-style')) {
      const style = document.createElement('style');
      style.id = 'er-pulse-style';
      style.textContent = `
        @keyframes pulse-item {
          0%, 100% { box-shadow: 0 0 5px rgba(255,0,60,0.2); }
          50% { box-shadow: 0 0 15px rgba(255,0,60,0.4); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  _pickupItem(item) {
    item.found = true;
    if (this.inventory.length < this.maxInventory) {
      this.inventory.push(item);
      this._showNotification(`Found: ${item.name}`, '#00ff88');
      this._showItemDescription(item);
    } else {
      this._showNotification('Inventory full!', '#ff003c');
    }
    this._renderRoom();
  }

  _showItemDescription(item) {
    // Add description to narrative
    const descEl = document.createElement('div');
    descEl.style.cssText = 'color: #00f0ff; font-size: 11px; margin-top: 5px; padding: 4px 8px; background: rgba(0,240,255,0.05); border-left: 2px solid #00f0ff;';
    descEl.textContent = `[${item.name}] ${item.desc}`;
    this.narrativeBar.appendChild(descEl);
  }

  _showNotification(text, color = '#ff003c') {
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(10,10,20,0.95); border: 1px solid ${color};
      padding: 10px 20px; z-index: 25; color: ${color};
      font-size: 14px; text-shadow: 0 0 8px ${color};
      box-shadow: 0 0 20px ${color}44;
      transition: opacity 0.5s; pointer-events: none;
    `;
    notif.textContent = text;
    this.wrapper.appendChild(notif);
    setTimeout(() => { notif.style.opacity = '0'; }, 1500);
    setTimeout(() => { if (notif.parentNode) notif.parentNode.removeChild(notif); }, 2000);
  }

  // ── Puzzle Rendering ───────────────────────────────────────────────

  _renderPuzzle(room) {
    const puzzle = room.puzzle;
    if (puzzle.solved) {
      this._renderSolvedState();
      return;
    }

    const puzzleContainer = document.createElement('div');
    puzzleContainer.style.cssText = `
      position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
      z-index: 8; display: flex; flex-direction: column; align-items: center;
    `;

    switch (puzzle.type) {
      case 'code': this._renderCodePuzzle(puzzle, puzzleContainer); break;
      case 'pattern': this._renderPatternPuzzle(puzzle, puzzleContainer); break;
      case 'sliding': this._renderSlidingPuzzle(puzzle, puzzleContainer); break;
      case 'wires': this._renderWiresPuzzle(puzzle, puzzleContainer); break;
      case 'combination': this._renderCombinationPuzzle(puzzle, puzzleContainer); break;
      case 'symbols': this._renderSymbolsPuzzle(puzzle, puzzleContainer); break;
    }

    this.roomArea.appendChild(puzzleContainer);
  }

  _renderSolvedState() {
    const solvedEl = document.createElement('div');
    solvedEl.style.cssText = `
      position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
      z-index: 8; text-align: center;
    `;
    solvedEl.innerHTML = `
      <div style="color: #00ff88; font-size: 20px; text-shadow: 0 0 15px #00ff88; margin-bottom: 10px;">
        ✦ PUZZLE SOLVED ✦
      </div>
      <button id="er-next-room" style="
        padding: 10px 30px; background: rgba(0,255,136,0.2); border: 2px solid #00ff88;
        color: #00ff88; font-family: 'Courier New', monospace; font-size: 13px;
        cursor: pointer; text-shadow: 0 0 8px #00ff88;
        box-shadow: 0 0 15px rgba(0,255,136,0.3);
      ">PROCEED →</button>
    `;
    this.roomArea.appendChild(solvedEl);
    solvedEl.querySelector('#er-next-room').addEventListener('click', () => this._nextRoom());
  }

  // ── Code Puzzle ────────────────────────────────────────────────────

  _renderCodePuzzle(puzzle, container) {
    container.innerHTML = `
      <div style="
        background: rgba(0,0,0,0.8); border: 2px solid rgba(255,0,60,0.4);
        padding: 20px; min-width: 280px; text-align: center;
        box-shadow: 0 0 25px rgba(255,0,60,0.2);
      ">
        <div style="color: #ff003c; font-size: 11px; margin-bottom: 8px; text-shadow: 0 0 5px #ff003c;">
          ╔══ NEXUS TERMINAL ══╗
        </div>
        <div style="color: #00ff88; font-size: 12px; margin-bottom: 15px;">
          ${puzzle.prompt}
        </div>
        <input id="er-code-input" type="text" maxlength="${puzzle.maxLength}"
          placeholder="${puzzle.placeholder}"
          style="
            width: 150px; padding: 8px; background: rgba(0,0,0,0.8);
            border: 1px solid rgba(255,0,60,0.4); color: #00ff88;
            font-family: 'Courier New', monospace; font-size: 20px;
            text-align: center; letter-spacing: 8px; outline: none;
            text-shadow: 0 0 5px #00ff88;
          ">
        <div id="er-code-error" style="color: #ff003c; font-size: 11px; margin-top: 8px; min-height: 14px;"></div>
        <button id="er-code-submit" style="
          margin-top: 10px; padding: 6px 20px; background: rgba(255,0,60,0.2);
          border: 1px solid #ff003c; color: #ff003c; font-family: 'Courier New', monospace;
          font-size: 12px; cursor: pointer;
        ">SUBMIT</button>
        <div style="color: #555; font-size: 9px; margin-top: 10px;">Attempts: ${puzzle.attempts}</div>
      </div>
    `;

    const input = container.querySelector('#er-code-input');
    const errorEl = container.querySelector('#er-code-error');
    input.focus();

    const submit = () => {
      const val = input.value.trim();
      puzzle.attempts++;
      if (val === puzzle.answer) {
        puzzle.solved = true;
        this._onPuzzleSolved();
      } else {
        errorEl.textContent = `ACCESS DENIED — Invalid code (attempt ${puzzle.attempts})`;
        input.value = '';
        input.style.borderColor = '#ff003c';
        setTimeout(() => { input.style.borderColor = 'rgba(255,0,60,0.4)'; }, 500);
      }
    };

    container.querySelector('#er-code-submit').addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  }

  // ── Pattern Puzzle (Simon Says) ────────────────────────────────────

  _renderPatternPuzzle(puzzle, container) {
    container.innerHTML = `
      <div style="
        background: rgba(0,0,0,0.8); border: 2px solid rgba(0,240,255,0.3);
        padding: 15px; text-align: center;
        box-shadow: 0 0 20px rgba(0,240,255,0.15);
      ">
        <div style="color: #00f0ff; font-size: 11px; margin-bottom: 8px;">
          ROUND ${puzzle.round + 1} / ${puzzle.maxRounds}
        </div>
        <div id="er-pattern-status" style="color: #888; font-size: 12px; margin-bottom: 12px; min-height: 16px;">
          ${puzzle.showingSequence ? 'WATCH THE SEQUENCE...' : puzzle.round === 0 && puzzle.sequence.length === 0 ? 'CLICK START TO BEGIN' : 'YOUR TURN — REPEAT THE SEQUENCE'}
        </div>
        <div id="er-pattern-buttons" style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
          ${puzzle.colors.map((color, i) => `
            <button data-idx="${i}" style="
              width: 50px; height: 50px; background: ${color}22; border: 2px solid ${color}66;
              cursor: pointer; transition: all 0.15s; border-radius: 4px;
              box-shadow: inset 0 0 10px ${color}11;
            " title="${puzzle.colorNames[i]}"></button>
          `).join('')}
        </div>
        <button id="er-pattern-start" style="
          margin-top: 12px; padding: 6px 20px; background: rgba(0,240,255,0.15);
          border: 1px solid #00f0ff; color: #00f0ff; font-family: 'Courier New', monospace;
          font-size: 11px; cursor: pointer;
        ">${puzzle.sequence.length === 0 ? 'START' : 'REPLAY SEQUENCE'}</button>
      </div>
    `;

    // Start/replay button
    container.querySelector('#er-pattern-start').addEventListener('click', () => {
      if (puzzle.showingSequence) return;
      if (puzzle.sequence.length === 0 || puzzle.playerSequence.length === 0) {
        // Add new element to sequence
        puzzle.sequence.push(Math.floor(Math.random() * puzzle.colors.length));
      }
      puzzle.playerSequence = [];
      this._showPatternSequence(puzzle, container);
    });

    // Color buttons
    container.querySelectorAll('[data-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (puzzle.showingSequence) return;
        if (puzzle.sequence.length === 0) return;
        const idx = parseInt(btn.dataset.idx);

        // Flash the button
        btn.style.background = puzzle.colors[idx];
        btn.style.boxShadow = `0 0 20px ${puzzle.colors[idx]}`;
        setTimeout(() => {
          btn.style.background = `${puzzle.colors[idx]}22`;
          btn.style.boxShadow = `inset 0 0 10px ${puzzle.colors[idx]}11`;
        }, 200);

        puzzle.playerSequence.push(idx);
        const statusEl = container.querySelector('#er-pattern-status');

        // Check if correct so far
        const currentIdx = puzzle.playerSequence.length - 1;
        if (puzzle.playerSequence[currentIdx] !== puzzle.sequence[currentIdx]) {
          // Wrong!
          puzzle.attempts++;
          if (statusEl) { statusEl.textContent = 'WRONG! Watch again...'; statusEl.style.color = '#ff003c'; }
          puzzle.playerSequence = [];
          setTimeout(() => {
            if (statusEl) { statusEl.style.color = '#888'; }
            this._showPatternSequence(puzzle, container);
          }, 1000);
          return;
        }

        // Check if complete
        if (puzzle.playerSequence.length === puzzle.sequence.length) {
          puzzle.round++;
          if (statusEl) { statusEl.textContent = '✓ CORRECT!'; statusEl.style.color = '#00ff88'; }

          if (puzzle.round >= puzzle.maxRounds) {
            puzzle.solved = true;
            setTimeout(() => this._onPuzzleSolved(), 500);
          } else {
            puzzle.playerSequence = [];
            setTimeout(() => {
              puzzle.sequence.push(Math.floor(Math.random() * puzzle.colors.length));
              this._showPatternSequence(puzzle, container);
            }, 1000);
          }
        }
      });
    });
  }

  _showPatternSequence(puzzle, container) {
    puzzle.showingSequence = true;
    puzzle.showIndex = 0;
    const statusEl = container.querySelector('#er-pattern-status');
    if (statusEl) { statusEl.textContent = 'WATCH THE SEQUENCE...'; statusEl.style.color = '#00f0ff'; }

    const buttons = container.querySelectorAll('[data-idx]');

    const showNext = () => {
      if (puzzle.showIndex >= puzzle.sequence.length) {
        puzzle.showingSequence = false;
        if (statusEl) { statusEl.textContent = 'YOUR TURN — REPEAT THE SEQUENCE'; statusEl.style.color = '#888'; }
        return;
      }

      const idx = puzzle.sequence[puzzle.showIndex];
      const btn = buttons[idx];
      if (btn) {
        btn.style.background = puzzle.colors[idx];
        btn.style.boxShadow = `0 0 20px ${puzzle.colors[idx]}`;
        setTimeout(() => {
          btn.style.background = `${puzzle.colors[idx]}22`;
          btn.style.boxShadow = `inset 0 0 10px ${puzzle.colors[idx]}11`;
          puzzle.showIndex++;
          setTimeout(showNext, 200);
        }, 400);
      }
    };

    setTimeout(showNext, 300);
  }

  // ── Sliding Tile Puzzle ────────────────────────────────────────────

  _renderSlidingPuzzle(puzzle, container) {
    const size = puzzle.size;
    const tileSize = 60;

    let tilesHTML = '';
    for (let i = 0; i < size * size; i++) {
      const val = puzzle.tiles[i];
      const isEmpty = val === 0;
      const row = Math.floor(i / size);
      const col = i % size;

      // Color gradient for solved state
      const hue = (row * size + col) * (360 / (size * size));
      const color = isEmpty ? 'transparent' : `hsl(${hue}, 80%, 40%)`;
      const glowColor = isEmpty ? 'transparent' : `hsl(${hue}, 80%, 50%)`;

      tilesHTML += `
        <button data-idx="${i}" style="
          width: ${tileSize}px; height: ${tileSize}px;
          background: ${isEmpty ? 'rgba(0,0,0,0.3)' : color};
          border: ${isEmpty ? '1px dashed rgba(255,0,60,0.2)' : `2px solid ${glowColor}`};
          color: ${isEmpty ? 'transparent' : '#fff'}; font-family: 'Courier New', monospace;
          font-size: 18px; font-weight: bold; cursor: ${isEmpty ? 'default' : 'pointer'};
          box-shadow: ${isEmpty ? 'none' : `0 0 10px ${glowColor}44`};
          transition: all 0.15s; display: flex; align-items: center; justify-content: center;
        ">${isEmpty ? '' : val}</button>
      `;
    }

    container.innerHTML = `
      <div style="
        background: rgba(0,0,0,0.8); border: 2px solid rgba(255,0,60,0.3);
        padding: 15px; text-align: center;
        box-shadow: 0 0 20px rgba(255,0,60,0.15);
      ">
        <div style="color: #ff003c; font-size: 11px; margin-bottom: 8px;">SLIDING PUZZLE — Arrange 1-${size * size - 1}</div>
        <div style="
          display: grid; grid-template-columns: repeat(${size}, ${tileSize}px);
          gap: 3px; background: rgba(255,0,60,0.1); padding: 3px;
        ">${tilesHTML}</div>
        <div style="color: #888; font-size: 10px; margin-top: 8px;">Moves: ${puzzle.moves}</div>
      </div>
    `;

    container.querySelectorAll('[data-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        this._slideTile(puzzle, idx, container);
      });
    });
  }

  _slideTile(puzzle, idx, container) {
    const size = puzzle.size;
    const emptyIdx = puzzle.tiles.indexOf(0);
    const row = Math.floor(idx / size);
    const col = idx % size;
    const eRow = Math.floor(emptyIdx / size);
    const eCol = emptyIdx % size;

    // Check adjacency
    const isAdjacent = (Math.abs(row - eRow) + Math.abs(col - eCol)) === 1;
    if (!isAdjacent) return;

    // Swap
    [puzzle.tiles[idx], puzzle.tiles[emptyIdx]] = [puzzle.tiles[emptyIdx], puzzle.tiles[idx]];
    puzzle.moves++;

    // Check win
    let solved = true;
    for (let i = 0; i < puzzle.tiles.length - 1; i++) {
      if (puzzle.tiles[i] !== i + 1) { solved = false; break; }
    }
    if (puzzle.tiles[puzzle.tiles.length - 1] !== 0) solved = false;

    if (solved) {
      puzzle.solved = true;
      this._onPuzzleSolved();
    } else {
      this._renderSlidingPuzzle(puzzle, container);
    }
  }

  // ── Wire Connection Puzzle ─────────────────────────────────────────

  _renderWiresPuzzle(puzzle, container) {
    const wireHeight = 32;
    const totalH = puzzle.wireColors.length * wireHeight + 20;

    let leftHTML = '';
    let rightHTML = '';

    for (let i = 0; i < puzzle.leftOrder.length; i++) {
      const color = puzzle.leftOrder[i];
      const name = puzzle.wireNames[puzzle.wireColors.indexOf(color)];
      const isSelected = puzzle.selectedLeft === i;
      const isConnected = puzzle.connections[i] !== undefined;

      leftHTML += `
        <button data-left="${i}" style="
          width: 120px; height: ${wireHeight}px; margin: 3px 0;
          background: ${isSelected ? `${color}33` : 'rgba(0,0,0,0.5)'};
          border: 2px solid ${isSelected ? color : isConnected ? `${color}66` : `${color}44`};
          color: ${color}; font-family: 'Courier New', monospace; font-size: 11px;
          cursor: pointer; text-shadow: 0 0 5px ${color};
          ${isSelected ? `box-shadow: 0 0 15px ${color}44;` : ''}
          display: flex; align-items: center; justify-content: center;
        ">${isConnected ? '✓ ' : ''}${name}</button>
      `;
    }

    for (let i = 0; i < puzzle.rightOrder.length; i++) {
      const color = puzzle.rightOrder[i];
      const name = puzzle.wireNames[puzzle.wireColors.indexOf(color)];
      const isConnected = Object.values(puzzle.connections).includes(i);

      rightHTML += `
        <button data-right="${i}" style="
          width: 120px; height: ${wireHeight}px; margin: 3px 0;
          background: ${isConnected ? `${color}22` : 'rgba(0,0,0,0.5)'};
          border: 2px solid ${isConnected ? `${color}66` : `${color}44`};
          color: ${color}; font-family: 'Courier New', monospace; font-size: 11px;
          cursor: pointer; text-shadow: 0 0 5px ${color};
          display: flex; align-items: center; justify-content: center;
        ">${isConnected ? '✓ ' : ''}${name}</button>
      `;
    }

    container.innerHTML = `
      <div style="
        background: rgba(0,0,0,0.8); border: 2px solid rgba(0,255,136,0.3);
        padding: 15px; text-align: center;
        box-shadow: 0 0 20px rgba(0,255,136,0.1);
      ">
        <div style="color: #00ff88; font-size: 11px; margin-bottom: 10px;">CONNECT MATCHING WIRES</div>
        <div style="display: flex; gap: 30px; align-items: center;">
          <div style="display: flex; flex-direction: column;">${leftHTML}</div>
          <div style="color: #555; font-size: 20px;">⟷</div>
          <div style="display: flex; flex-direction: column;">${rightHTML}</div>
        </div>
        <div id="er-wire-status" style="color: #888; font-size: 10px; margin-top: 8px;">
          ${puzzle.selectedLeft !== null ? 'Now click a wire on the RIGHT side' : 'Click a wire on the LEFT side'}
          | Connected: ${Object.keys(puzzle.connections).length}/${puzzle.wireColors.length}
        </div>
      </div>
    `;

    container.querySelectorAll('[data-left]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.left);
        if (puzzle.connections[idx] !== undefined) return; // already connected
        puzzle.selectedLeft = idx;
        this._renderWiresPuzzle(puzzle, container);
      });
    });

    container.querySelectorAll('[data-right]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rightIdx = parseInt(btn.dataset.right);
        if (puzzle.selectedLeft === null) return;
        if (Object.values(puzzle.connections).includes(rightIdx)) return;

        // Check if match
        const leftColor = puzzle.leftOrder[puzzle.selectedLeft];
        const rightColor = puzzle.rightOrder[rightIdx];

        if (leftColor === rightColor) {
          puzzle.connections[puzzle.selectedLeft] = rightIdx;
          puzzle.selectedLeft = null;

          // Check if all connected
          if (Object.keys(puzzle.connections).length === puzzle.wireColors.length) {
            puzzle.solved = true;
            this._onPuzzleSolved();
          } else {
            this._renderWiresPuzzle(puzzle, container);
          }
        } else {
          puzzle.attempts++;
          puzzle.selectedLeft = null;
          this._renderWiresPuzzle(puzzle, container);
          const status = container.querySelector('#er-wire-status');
          if (status) { status.textContent = '✗ Mismatch! Try again.'; status.style.color = '#ff003c'; }
        }
      });
    });
  }

  // ── Combination Lock ───────────────────────────────────────────────

  _renderCombinationPuzzle(puzzle, container) {
    const digitSize = 55;

    let digitsHTML = '';
    for (let i = 0; i < 3; i++) {
      digitsHTML += `
        <div style="display: flex; flex-direction: column; align-items: center; margin: 0 6px;">
          <button data-digit="${i}" data-dir="up" style="
            width: ${digitSize}px; height: 25px; background: rgba(255,0,60,0.15);
            border: 1px solid rgba(255,0,60,0.3); color: #ff003c;
            font-size: 16px; cursor: pointer; font-family: 'Courier New', monospace;
          ">▲</button>
          <div style="
            width: ${digitSize}px; height: ${digitSize}px; display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.8); border: 2px solid rgba(255,0,60,0.4);
            color: #ff003c; font-size: 32px; font-weight: bold;
            text-shadow: 0 0 10px #ff003c; box-shadow: 0 0 15px rgba(255,0,60,0.2);
          ">${puzzle.digits[i]}</div>
          <button data-digit="${i}" data-dir="down" style="
            width: ${digitSize}px; height: 25px; background: rgba(255,0,60,0.15);
            border: 1px solid rgba(255,0,60,0.3); color: #ff003c;
            font-size: 16px; cursor: pointer; font-family: 'Courier New', monospace;
          ">▼</button>
        </div>
      `;
    }

    container.innerHTML = `
      <div style="
        background: rgba(0,0,0,0.8); border: 2px solid rgba(255,0,60,0.3);
        padding: 20px; text-align: center;
        box-shadow: 0 0 25px rgba(255,0,60,0.2);
      ">
        <div style="color: #ff003c; font-size: 11px; margin-bottom: 12px;">COMBINATION LOCK</div>
        <div style="display: flex; justify-content: center;">${digitsHTML}</div>
        <div style="color: #555; font-size: 10px; margin: 5px 0;">—  —  —</div>
        <button id="er-combo-submit" style="
          margin-top: 10px; padding: 6px 20px; background: rgba(255,0,60,0.2);
          border: 1px solid #ff003c; color: #ff003c; font-family: 'Courier New', monospace;
          font-size: 12px; cursor: pointer;
        ">TRY COMBINATION</button>
        <div id="er-combo-error" style="color: #ff003c; font-size: 11px; margin-top: 6px; min-height: 14px;"></div>
      </div>
    `;

    container.querySelectorAll('[data-digit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = parseInt(btn.dataset.digit);
        const dir = btn.dataset.dir;
        if (dir === 'up') puzzle.digits[d] = (puzzle.digits[d] + 1) % 10;
        else puzzle.digits[d] = (puzzle.digits[d] + 9) % 10;
        this._renderCombinationPuzzle(puzzle, container);
      });
    });

    container.querySelector('#er-combo-submit').addEventListener('click', () => {
      puzzle.attempts++;
      const correct = puzzle.digits.every((d, i) => d === puzzle.answer[i]);
      if (correct) {
        puzzle.solved = true;
        this._onPuzzleSolved();
      } else {
        const errEl = container.querySelector('#er-combo-error');
        if (errEl) errEl.textContent = `LOCK REJECTED — Attempt ${puzzle.attempts}`;
      }
    });
  }

  // ── Symbol Matching Puzzle ─────────────────────────────────────────

  _renderSymbolsPuzzle(puzzle, container) {
    const cols = 4;
    const rows = 2;
    const tileSize = 55;

    let tilesHTML = '';
    for (let i = 0; i < puzzle.grid.length; i++) {
      const isRevealed = puzzle.revealed[i] || puzzle.matched[i];
      const isSelected = puzzle.selected === i;
      const isMatched = puzzle.matched[i];

      tilesHTML += `
        <button data-idx="${i}" style="
          width: ${tileSize}px; height: ${tileSize}px;
          background: ${isMatched ? 'rgba(0,255,136,0.15)' : isRevealed ? 'rgba(170,102,255,0.2)' : 'rgba(0,0,0,0.7)'};
          border: 2px solid ${isMatched ? '#00ff88' : isSelected ? '#aa66ff' : 'rgba(170,102,255,0.3)'};
          color: ${isMatched ? '#00ff88' : isRevealed ? '#aa66ff' : '#555'};
          font-size: 24px; cursor: pointer; transition: all 0.2s;
          box-shadow: ${isSelected ? '0 0 15px rgba(170,102,255,0.5)' : 'none'};
          text-shadow: ${isRevealed ? '0 0 8px currentColor' : 'none'};
          display: flex; align-items: center; justify-content: center;
        ">${isRevealed || isMatched ? puzzle.grid[i] : '?'}</button>
      `;
    }

    container.innerHTML = `
      <div style="
        background: rgba(0,0,0,0.8); border: 2px solid rgba(170,102,255,0.3);
        padding: 15px; text-align: center;
        box-shadow: 0 0 20px rgba(170,102,255,0.15);
      ">
        <div style="color: #aa66ff; font-size: 11px; margin-bottom: 10px;">
          SYMBOL MATCHING — ${puzzle.pairsFound}/${puzzle.totalPairs} pairs
        </div>
        <div style="
          display: grid; grid-template-columns: repeat(${cols}, ${tileSize}px);
          gap: 6px; justify-content: center;
        ">${tilesHTML}</div>
      </div>
    `;

    container.querySelectorAll('[data-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (puzzle.processing) return;
        const idx = parseInt(btn.dataset.idx);
        if (puzzle.matched[idx] || puzzle.revealed[idx]) return;

        // Reveal
        puzzle.revealed[idx] = true;

        if (puzzle.selected === null) {
          puzzle.selected = idx;
          this._renderSymbolsPuzzle(puzzle, container);
        } else {
          if (puzzle.selected === idx) {
            puzzle.revealed[idx] = false;
            puzzle.selected = null;
            this._renderSymbolsPuzzle(puzzle, container);
            return;
          }

          // Check match
          puzzle.processing = true;
          const first = puzzle.selected;
          this._renderSymbolsPuzzle(puzzle, container);

          setTimeout(() => {
            if (puzzle.grid[first] === puzzle.grid[idx]) {
              puzzle.matched[first] = true;
              puzzle.matched[idx] = true;
              puzzle.pairsFound++;
              puzzle.revealed[first] = false;
              puzzle.revealed[idx] = false;

              if (puzzle.pairsFound >= puzzle.totalPairs) {
                puzzle.solved = true;
                this._onPuzzleSolved();
                return;
              }
            } else {
              puzzle.revealed[first] = false;
              puzzle.revealed[idx] = false;
              puzzle.attempts++;
            }
            puzzle.selected = null;
            puzzle.processing = false;
            this._renderSymbolsPuzzle(puzzle, container);
          }, 600);
        }
      });
    });
  }

  // ── Puzzle Solved ──────────────────────────────────────────────────

  _onPuzzleSolved() {
    const room = this.rooms[this.currentRoom];
    room.puzzle.solved = true;
    this.roomsSolved.push(this.currentRoom);
    this.score += 500;

    this._showNotification(`✦ ${room.name} COMPLETE ✦`, '#00ff88');
    this._saveGame();

    // Re-render with "proceed" button
    setTimeout(() => this._renderRoom(), 500);
  }

  _nextRoom() {
    this.currentRoom++;
    if (this.currentRoom >= this.rooms.length) {
      this._victory();
    } else {
      // Glitch transition
      this._glitchTransition(() => {
        this._renderRoom();
      });
    }
  }

  _glitchTransition(callback) {
    this.glitchOverlay.style.display = 'block';
    this.glitchOverlay.style.background = 'rgba(255,0,60,0.1)';
    this.glitchOverlay.style.animation = 'none';

    let steps = 0;
    const glitchInterval = setInterval(() => {
      steps++;
      this.glitchOverlay.style.background = `rgba(255,0,60,${Math.random() * 0.2})`;
      this.glitchOverlay.style.transform = `translateX(${(Math.random() - 0.5) * 10}px)`;

      if (steps >= 10) {
        clearInterval(glitchInterval);
        this.glitchOverlay.style.display = 'none';
        this.glitchOverlay.style.transform = 'none';
        if (callback) callback();
      }
    }, 50);
  }

  _victory() {
    this.gameState = 'victory';
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Score calculation
    const timeBonus = Math.max(0, 3000 - this.elapsed * 5);
    const hintPenalty = (3 - this.hintsRemaining) * 200;
    this.score += timeBonus - hintPenalty;

    this._saveScore();
    this._clearSave();

    this.roomArea.style.display = 'none';
    this.narrativeBar.style.display = 'none';
    this.menuOverlay.style.display = 'flex';

    this.menuOverlay.innerHTML = `
      <div style="text-align: center;">
        <pre style="color: #00ff88; font-size: 8px; line-height: 1; text-shadow: 0 0 8px #00ff88; margin: 0 0 10px;">
 ██████╗ ███████╗███████╗███████╗
 ██╔══██╗██╔════╝██╔════╝██╔════╝
 ██║  ██║█████╗  █████╗  ███████╗
 ██║  ██║██╔══╝  ██╔══╝  ╚════██║
 ██████╔╝███████╗██║     ███████║
 ╚═════╝ ╚══════╝╚═╝     ╚══════╝</pre>
        <h2 style="color: #00ff88; font-size: 24px; margin: 0 0 5px; text-shadow: 0 0 20px #00ff88;">YOU ESCAPED</h2>
        <p style="color: #88ffaa; font-size: 12px; margin: 0 0 20px; font-style: italic;">
          "The NEXUS acknowledges your worth. You are free."
        </p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 15px; text-align: left; margin-bottom: 20px;
          background: rgba(0,255,136,0.05); border: 1px solid rgba(0,255,136,0.2); padding: 12px;">
          <span style="color: #888; font-size: 11px;">Total Time:</span>
          <span style="color: #00ff88; font-size: 11px;">${this._fmtTime(this.elapsed)}</span>
          <span style="color: #888; font-size: 11px;">Rooms Solved:</span>
          <span style="color: #00ff88; font-size: 11px;">6/6</span>
          <span style="color: #888; font-size: 11px;">Items Found:</span>
          <span style="color: #00f0ff; font-size: 11px;">${this.inventory.length}</span>
          <span style="color: #888; font-size: 11px;">Hints Used:</span>
          <span style="color: #ff8800; font-size: 11px;">${3 - this.hintsRemaining}</span>
          <span style="color: #888; font-size: 11px;">Time Bonus:</span>
          <span style="color: #00ff88; font-size: 11px;">+${timeBonus}</span>
          <span style="color: #888; font-size: 11px;">Hint Penalty:</span>
          <span style="color: #ff8800; font-size: 11px;">-${hintPenalty}</span>
          <span style="color: #fff; font-size: 13px; font-weight: bold;">FINAL SCORE:</span>
          <span style="color: #ffff00; font-size: 13px; font-weight: bold; text-shadow: 0 0 8px #ffff00;">${this.score}</span>
        </div>
        <button id="er-menu-btn" style="
          padding: 8px 25px; background: rgba(255, 0, 60, 0.2); border: 1px solid #ff003c;
          color: #ff003c; font-family: 'Courier New', monospace; font-size: 12px; cursor: pointer;
        ">MAIN MENU</button>
      </div>
    `;

    this.menuOverlay.querySelector('#er-menu-btn').addEventListener('click', () => this._showMenu());
  }

  // ── HUD ────────────────────────────────────────────────────────────

  _updateHUD() {
    const room = this.rooms[this.currentRoom];
    if (!room) return;

    // Inventory display
    const invSlots = [];
    for (let i = 0; i < this.maxInventory; i++) {
      const item = this.inventory[i];
      const isSelected = this.selectedItem === i;
      invSlots.push(`
        <div data-inv="${i}" style="
          width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
          background: ${isSelected ? 'rgba(255,0,60,0.2)' : 'rgba(0,0,0,0.4)'};
          border: 1px solid ${isSelected ? '#ff003c' : 'rgba(255,0,60,0.2)'};
          font-size: 8px; color: ${item ? '#ff4488' : '#333'}; cursor: ${item ? 'pointer' : 'default'};
          margin-right: 2px; vertical-align: middle;
        " title="${item ? item.name + ': ' + item.desc : 'Empty'}">${item ? item.name.charAt(0) : ''}</div>
      `);
    }

    this.hud.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: #ff003c; font-size: 11px; text-shadow: 0 0 5px #ff003c;">
          ROOM ${this.currentRoom + 1}/6: ${room.name}
        </span>
        <span style="color: #555; font-size: 10px;">|</span>
        <span id="er-hud-timer" style="color: #888; font-size: 11px;">${this._fmtTime(this.elapsed)}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="display: inline-flex;">${invSlots.join('')}</div>
        <button id="er-hint-btn" style="
          padding: 2px 8px; background: rgba(255,255,0,0.1); border: 1px solid rgba(255,255,0,0.3);
          color: ${this.hintsRemaining > 0 ? '#ffff00' : '#444'}; font-family: 'Courier New', monospace;
          font-size: 10px; cursor: ${this.hintsRemaining > 0 ? 'pointer' : 'default'};
        ">HINT (${this.hintsRemaining})</button>
        <button id="er-save-btn" style="
          padding: 2px 8px; background: rgba(0,240,255,0.1); border: 1px solid rgba(0,240,255,0.2);
          color: #00f0ff; font-family: 'Courier New', monospace; font-size: 10px; cursor: pointer;
        ">SAVE</button>
      </div>
    `;

    // Hint button
    const hintBtn = this.hud.querySelector('#er-hint-btn');
    if (hintBtn && this.hintsRemaining > 0) {
      hintBtn.addEventListener('click', () => this._useHint());
    }

    // Save button
    const saveBtn = this.hud.querySelector('#er-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => {
      this._saveGame();
      this._showNotification('Game Saved', '#00f0ff');
    });

    // Inventory clicks
    this.hud.querySelectorAll('[data-inv]').forEach(slot => {
      slot.addEventListener('click', () => {
        const idx = parseInt(slot.dataset.inv);
        if (this.inventory[idx]) {
          this.selectedItem = this.selectedItem === idx ? null : idx;
          if (this.selectedItem !== null) {
            this._showItemDescription(this.inventory[idx]);
          }
          this._updateHUD();
        }
      });
    });
  }

  _useHint() {
    if (this.hintsRemaining <= 0) return;
    const room = this.rooms[this.currentRoom];
    if (!room || room.puzzle.solved) return;

    this.hintsRemaining--;
    this._showNotification('NEXUS AI provides a hint...', '#aa66ff');

    // Add hint to narrative
    const hintEl = document.createElement('div');
    hintEl.style.cssText = 'color: #aa66ff; font-size: 11px; margin-top: 5px; padding: 4px 8px; background: rgba(170,102,255,0.05); border-left: 2px solid #aa66ff; font-style: italic;';
    hintEl.textContent = `[NEXUS HINT] ${room.puzzle.hint}`;
    this.narrativeBar.appendChild(hintEl);

    this._updateHUD();
  }

  // ── Save/Load ──────────────────────────────────────────────────────

  _saveGame() {
    const data = {
      currentRoom: this.currentRoom,
      inventory: this.inventory,
      hintsRemaining: this.hintsRemaining,
      score: this.score,
      elapsed: this.elapsed,
      roomsSolved: this.roomsSolved,
      roomStates: this.rooms.map(r => ({
        itemsFound: r.items.map(i => i.found),
        puzzleSolved: r.puzzle.solved,
        puzzleData: this._getSerializablePuzzleData(r.puzzle)
      }))
    };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {}
  }

  _getSerializablePuzzleData(puzzle) {
    switch (puzzle.type) {
      case 'sliding': return { tiles: puzzle.tiles, moves: puzzle.moves };
      case 'wires': return { connections: puzzle.connections, leftOrder: puzzle.leftOrder, rightOrder: puzzle.rightOrder };
      case 'combination': return { digits: puzzle.digits };
      case 'symbols': return { grid: puzzle.grid, matched: puzzle.matched, pairsFound: puzzle.pairsFound };
      case 'pattern': return { sequence: puzzle.sequence, round: puzzle.round };
      default: return {};
    }
  }

  _loadGame() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);

      this.currentRoom = data.currentRoom;
      this.inventory = data.inventory;
      this.hintsRemaining = data.hintsRemaining;
      this.score = data.score;
      this.elapsed = data.elapsed;
      this.roomsSolved = data.roomsSolved;
      this.gameState = 'playing';

      // Restore rooms
      this.rooms = this._defineRooms();
      this._initPuzzleStates();

      for (let i = 0; i < data.roomStates.length; i++) {
        const rs = data.roomStates[i];
        for (let j = 0; j < rs.itemsFound.length; j++) {
          this.rooms[i].items[j].found = rs.itemsFound[j];
        }
        this.rooms[i].puzzle.solved = rs.puzzleSolved;
        // Restore puzzle-specific data
        if (rs.puzzleData) {
          Object.assign(this.rooms[i].puzzle, rs.puzzleData);
        }
      }

      // Start timer from saved elapsed
      this.timerStart = Date.now() - this.elapsed * 1000;
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (this.destroyed || this.gameState !== 'playing') return;
        this.elapsed = Math.floor((Date.now() - this.timerStart) / 1000);
        this._updateHUD();
      }, 1000);

      this.menuOverlay.style.display = 'none';
      this.roomArea.style.display = 'block';
      this.hud.style.display = 'flex';
      this.narrativeBar.style.display = 'block';
      this._renderRoom();
    } catch {
      this._showNotification('Failed to load save', '#ff003c');
    }
  }

  _hasSave() {
    try { return !!localStorage.getItem(this.storageKey); } catch { return false; }
  }

  _clearSave() {
    try { localStorage.removeItem(this.storageKey); } catch {}
  }

  // ── Leaderboard ────────────────────────────────────────────────────

  _loadLeaderboard() {
    try {
      this.leaderboard = JSON.parse(localStorage.getItem(this.leaderboardKey) || '[]');
    } catch { this.leaderboard = []; }
  }

  _saveScore() {
    this.leaderboard.push({
      time: this.elapsed,
      roomsSolved: this.roomsSolved.length,
      score: this.score,
      hints: 3 - this.hintsRemaining,
      date: new Date().toISOString().slice(0, 10)
    });
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 10);
    try {
      localStorage.setItem(this.leaderboardKey, JSON.stringify(this.leaderboard));
    } catch {}
  }

  // ── Utils ──────────────────────────────────────────────────────────

  _fmtTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }
}
