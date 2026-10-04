/**
 * NEXUS OS — Neon Tetris
 * Classic Tetris with cyberpunk neon aesthetic.
 * Full SRS rotation, ghost piece, hold, T-spin detection, sprint mode.
 */
class NeonTetris {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.animFrameId = null;
    this.running = false;
    this.destroyed = false;
    this.paused = false;

    // Playfield
    this.cols = 10;
    this.rows = 20;
    this.cellSize = 28;
    this.board = [];

    // Tetrominoes
    this.pieces = {
      I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#00f0ff' },
      O: { shape: [[1,1],[1,1]], color: '#ffff00' },
      T: { shape: [[0,1,0],[1,1,1],[0,0,0]], color: '#aa66ff' },
      S: { shape: [[0,1,1],[1,1,0],[0,0,0]], color: '#00ff88' },
      Z: { shape: [[1,1,0],[0,1,1],[0,0,0]], color: '#ff003c' },
      J: { shape: [[1,0,0],[1,1,1],[0,0,0]], color: '#4488ff' },
      L: { shape: [[0,0,1],[1,1,1],[0,0,0]], color: '#ff8800' }
    };
    this.pieceKeys = Object.keys(this.pieces);

    // Current piece state
    this.current = null; // { type, shape, color, x, y, rotation }
    this.holdPiece = null;
    this.canHold = true;
    this.nextQueue = [];
    this.bag = [];

    // Game state
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.piecesPlaced = 0;
    this.combo = -1;
    this.backToBack = false;
    this.lastClearWasTetris = false;
    this.lastWasTSpin = false;

    // Timing
    this.dropInterval = 1000;
    this.lastDrop = 0;
    this.lockDelay = 500;
    this.lockTimer = 0;
    this.locking = false;
    this.lockMoves = 0;
    this.maxLockMoves = 15;

    // Modes
    this.mode = 'marathon'; // marathon, sprint
    this.sprintLines = 40;
    this.sprintTime = 0;
    this.sprintStart = 0;
    this.gameOver = false;

    // Line clear animation
    this.clearingLines = [];
    this.clearAnimTimer = 0;
    this.clearAnimDuration = 20;

    // Particles
    this.particles = [];

    // Input
    this.keys = {};
    this.keyRepeatTimers = {};
    this.dasDelay = 170; // delayed auto-shift
    this.dasRepeat = 50;

    // Display
    this.width = this.cols * this.cellSize;
    this.height = this.rows * this.cellSize;

    // Best scores
    this.storageKey = 'nexus_tetris_scores';
    this.bestScore = 0;
    this.bestSprint = Infinity;

    // Statistics
    this.stats = { singles: 0, doubles: 0, triples: 0, tetrises: 0, tspins: 0, perfectClears: 0 };

    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp = this._onKeyUp.bind(this);
  }

  render() {
    this._loadScores();
    this._buildDOM();
    this._setupCanvas();
    this._bindEvents();
    this._showMenu();
  }

  destroy() {
    this.destroyed = true;
    this.running = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    document.removeEventListener('keydown', this._boundKeyDown);
    document.removeEventListener('keyup', this._boundKeyUp);
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  // ── DOM ────────────────────────────────────────────────────────────

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.style.cssText = `
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      background: #0a0a0f; position: relative; overflow: hidden; font-family: 'Courier New', monospace;
    `;
    this.container.appendChild(this.wrapper);

    // Menu overlay
    this.menuOverlay = document.createElement('div');
    this.menuOverlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(10, 10, 15, 0.95); z-index: 10; overflow-y: auto;
    `;
    this.wrapper.appendChild(this.menuOverlay);

    // Game layout
    this.gameLayout = document.createElement('div');
    this.gameLayout.style.cssText = `
      display: none; align-items: flex-start; justify-content: center; gap: 16px;
      width: 100%; height: 100%; padding: 10px; box-sizing: border-box;
    `;
    this.wrapper.appendChild(this.gameLayout);

    // Left panel (hold + stats)
    this.leftPanel = document.createElement('div');
    this.leftPanel.style.cssText = `
      display: flex; flex-direction: column; gap: 10px; min-width: 100px;
    `;
    this.gameLayout.appendChild(this.leftPanel);

    // Canvas container
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.style.cssText = `
      display: flex; flex-direction: column; align-items: center;
    `;
    this.gameLayout.appendChild(this.canvasContainer);

    // Right panel (next + score)
    this.rightPanel = document.createElement('div');
    this.rightPanel.style.cssText = `
      display: flex; flex-direction: column; gap: 10px; min-width: 100px;
    `;
    this.gameLayout.appendChild(this.rightPanel);
  }

  _setupCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.cssText = `
      border: 2px solid rgba(255, 0, 60, 0.4);
      box-shadow: 0 0 25px rgba(255, 0, 60, 0.3), inset 0 0 15px rgba(255, 0, 60, 0.05);
    `;
    this.canvasContainer.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  }

  _bindEvents() {
    document.addEventListener('keydown', this._boundKeyDown);
    document.addEventListener('keyup', this._boundKeyUp);
  }

  _onKeyDown(e) {
    if (e.repeat) return;
    this.keys[e.key] = true;

    if (!this.running) return;
    if (this.gameOver) {
      if (e.key === ' ' || e.key === 'Enter') {
        this._startGame(this.mode);
      }
      if (e.key === 'Escape') {
        this.running = false;
        this._showMenu();
      }
      return;
    }

    if (e.key === 'p' || e.key === 'P') {
      this.paused = !this.paused;
      if (!this.paused) this.lastDrop = performance.now();
      return;
    }
    if (e.key === 'Escape') {
      this.running = false;
      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
      this._showMenu();
      return;
    }

    if (this.paused || this.clearingLines.length > 0) return;
    if (!this.current) return;

    switch (e.key) {
      case 'ArrowLeft':
        this._movePiece(-1, 0);
        this._startDAS('left');
        break;
      case 'ArrowRight':
        this._movePiece(1, 0);
        this._startDAS('right');
        break;
      case 'ArrowDown':
        this._movePiece(0, 1);
        this.score += 1; // soft drop point
        this._startDAS('down');
        break;
      case 'ArrowUp':
        this._rotatePiece(1);
        break;
      case 'z': case 'Z':
        this._rotatePiece(-1);
        break;
      case 'x': case 'X':
        this._rotatePiece(1);
        break;
      case ' ':
        e.preventDefault();
        this._hardDrop();
        break;
      case 'c': case 'C':
        this._holdCurrentPiece();
        break;
    }
  }

  _onKeyUp(e) {
    this.keys[e.key] = false;
    if (e.key === 'ArrowLeft') this._stopDAS('left');
    if (e.key === 'ArrowRight') this._stopDAS('right');
    if (e.key === 'ArrowDown') this._stopDAS('down');
  }

  _startDAS(dir) {
    this._stopDAS(dir);
    this.keyRepeatTimers[dir] = setTimeout(() => {
      this.keyRepeatTimers[dir + '_repeat'] = setInterval(() => {
        if (!this.running || this.paused || this.clearingLines.length > 0 || !this.current) return;
        if (dir === 'left') this._movePiece(-1, 0);
        if (dir === 'right') this._movePiece(1, 0);
        if (dir === 'down') { this._movePiece(0, 1); this.score += 1; }
      }, this.dasRepeat);
    }, this.dasDelay);
  }

  _stopDAS(dir) {
    clearTimeout(this.keyRepeatTimers[dir]);
    clearInterval(this.keyRepeatTimers[dir + '_repeat']);
  }

  // ── Menu ───────────────────────────────────────────────────────────

  _showMenu() {
    this.gameLayout.style.display = 'none';
    this.menuOverlay.style.display = 'flex';
    this.menuOverlay.innerHTML = `
      <div style="text-align: center;">
        <h1 style="color: #ff003c; font-size: 42px; margin: 0 0 8px; text-shadow: 0 0 20px #ff003c, 0 0 40px rgba(255,0,60,0.5);
          font-family: 'Courier New', monospace; letter-spacing: 6px;">TETRIS</h1>
        <p style="color: #ff4488; font-size: 13px; margin: 0 0 30px; text-shadow: 0 0 8px #ff4488;">
          NEXUS EDITION
        </p>
        <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
          <button data-mode="marathon" style="
            padding: 10px 35px; background: rgba(255, 0, 60, 0.2); border: 2px solid #ff003c;
            color: #ff003c; font-family: 'Courier New', monospace; font-size: 14px;
            cursor: pointer; letter-spacing: 2px; text-transform: uppercase;
            text-shadow: 0 0 8px #ff003c; box-shadow: 0 0 15px rgba(255,0,60,0.3); width: 200px;
          ">MARATHON</button>
          <button data-mode="sprint" style="
            padding: 10px 35px; background: rgba(0, 240, 255, 0.1); border: 2px solid #00f0ff;
            color: #00f0ff; font-family: 'Courier New', monospace; font-size: 14px;
            cursor: pointer; letter-spacing: 2px; text-transform: uppercase;
            text-shadow: 0 0 8px #00f0ff; width: 200px;
          ">40-LINE SPRINT</button>
        </div>
        <div style="margin-top: 25px; color: #555; font-size: 11px; line-height: 1.8;">
          <div>← → — Move | ↑ / X — Rotate CW | Z — Rotate CCW</div>
          <div>↓ — Soft Drop | SPACE — Hard Drop | C — Hold</div>
          <div>P — Pause | ESC — Menu</div>
        </div>
        ${this.bestScore > 0 ? `
          <div style="margin-top: 15px; color: #888; font-size: 11px;">
            Best Marathon: ${this.bestScore.toLocaleString()} | Best Sprint: ${this.bestSprint < Infinity ? (this.bestSprint / 1000).toFixed(2) + 's' : '—'}
          </div>
        ` : ''}
      </div>
    `;

    this.menuOverlay.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => this._startGame(btn.dataset.mode));
    });
  }

  _startGame(mode) {
    this.mode = mode;
    this.menuOverlay.style.display = 'none';
    this.gameLayout.style.display = 'flex';

    // Reset state
    this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.piecesPlaced = 0;
    this.combo = -1;
    this.backToBack = false;
    this.lastClearWasTetris = false;
    this.lastWasTSpin = false;
    this.dropInterval = 1000;
    this.gameOver = false;
    this.paused = false;
    this.holdPiece = null;
    this.canHold = true;
    this.clearingLines = [];
    this.particles = [];
    this.bag = [];
    this.nextQueue = [];
    this.stats = { singles: 0, doubles: 0, triples: 0, tetrises: 0, tspins: 0, perfectClears: 0 };

    // Fill next queue
    for (let i = 0; i < 5; i++) this.nextQueue.push(this._getNextFromBag());

    this.sprintStart = mode === 'sprint' ? performance.now() : 0;
    this.sprintTime = 0;

    // Build side panels
    this._buildSidePanels();

    // Spawn first piece
    this._spawnPiece();
    this.lastDrop = performance.now();

    this.running = true;
    this._gameLoop();
  }

  _buildSidePanels() {
    // Left: Hold + Stats
    this.leftPanel.innerHTML = `
      <div style="background: rgba(255,0,60,0.05); border: 1px solid rgba(255,0,60,0.2); padding: 8px;">
        <div style="color: #888; font-size: 10px; margin-bottom: 5px;">HOLD</div>
        <canvas id="tetris-hold-canvas" width="80" height="80" style="display: block;"></canvas>
      </div>
      <div style="background: rgba(255,0,60,0.05); border: 1px solid rgba(255,0,60,0.2); padding: 8px;">
        <div style="color: #888; font-size: 10px; margin-bottom: 5px;">STATS</div>
        <div id="tetris-stats" style="color: #666; font-size: 10px; line-height: 1.6;"></div>
      </div>
    `;

    // Right: Next + Score
    this.rightPanel.innerHTML = `
      <div style="background: rgba(255,0,60,0.05); border: 1px solid rgba(255,0,60,0.2); padding: 8px;">
        <div style="color: #888; font-size: 10px; margin-bottom: 5px;">NEXT</div>
        <canvas id="tetris-next-canvas" width="80" height="260" style="display: block;"></canvas>
      </div>
      <div style="background: rgba(255,0,60,0.05); border: 1px solid rgba(255,0,60,0.2); padding: 8px;">
        <div style="color: #888; font-size: 10px; margin-bottom: 5px;">SCORE</div>
        <div id="tetris-score-display" style="color: #ff003c; font-size: 18px; text-shadow: 0 0 8px #ff003c;">0</div>
        <div id="tetris-level-display" style="color: #888; font-size: 11px; margin-top: 5px;">LEVEL 1</div>
        <div id="tetris-lines-display" style="color: #888; font-size: 11px;">LINES 0</div>
        ${this.mode === 'sprint' ? '<div id="tetris-sprint-timer" style="color: #00f0ff; font-size: 14px; margin-top: 5px;">0.00s</div>' : ''}
      </div>
    `;
  }

  // ── Bag Randomizer ─────────────────────────────────────────────────

  _getNextFromBag() {
    if (this.bag.length === 0) {
      this.bag = [...this.pieceKeys];
      // Fisher-Yates shuffle
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop();
  }

  // ── Piece Management ───────────────────────────────────────────────

  _spawnPiece() {
    const type = this.nextQueue.shift();
    this.nextQueue.push(this._getNextFromBag());
    const piece = this.pieces[type];
    const shape = piece.shape.map(row => [...row]);
    this.current = {
      type, shape, color: piece.color,
      x: Math.floor((this.cols - shape[0].length) / 2),
      y: type === 'I' ? -1 : 0,
      rotation: 0
    };

    // Check if spawn position is valid
    if (!this._isValid(this.current.shape, this.current.x, this.current.y)) {
      this.gameOver = true;
      this._onGameOver();
    }

    this.canHold = true;
    this.locking = false;
    this.lockTimer = 0;
    this.lockMoves = 0;
    this.piecesPlaced++;

    this._drawSidePanels();
  }

  _isValid(shape, px, py) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const x = px + c;
        const y = py + r;
        if (x < 0 || x >= this.cols || y >= this.rows) return false;
        if (y >= 0 && this.board[y][x]) return false;
      }
    }
    return true;
  }

  _movePiece(dx, dy) {
    if (!this.current) return false;
    const nx = this.current.x + dx;
    const ny = this.current.y + dy;
    if (this._isValid(this.current.shape, nx, ny)) {
      this.current.x = nx;
      this.current.y = ny;
      if (this.locking) {
        this.lockMoves++;
        if (this.lockMoves < this.maxLockMoves) {
          this.lockTimer = performance.now();
        }
      }
      return true;
    }
    return false;
  }

  _rotatePiece(dir) {
    if (!this.current || this.current.type === 'O') return;
    const shape = this.current.shape;
    const n = shape.length;
    const rotated = Array.from({ length: n }, () => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (dir === 1) { // CW
          rotated[c][n - 1 - r] = shape[r][c];
        } else { // CCW
          rotated[n - 1 - c][r] = shape[r][c];
        }
      }
    }

    // SRS wall kicks
    const kicks = this.current.type === 'I' ? this._getIKicks(dir) : this._getStandardKicks(dir);

    for (const [kx, ky] of kicks) {
      if (this._isValid(rotated, this.current.x + kx, this.current.y + ky)) {
        this.current.shape = rotated;
        this.current.x += kx;
        this.current.y += ky;
        this.current.rotation = (this.current.rotation + dir + 4) % 4;
        if (this.locking) {
          this.lockMoves++;
          if (this.lockMoves < this.maxLockMoves) {
            this.lockTimer = performance.now();
          }
        }
        return;
      }
    }
  }

  _getStandardKicks(dir) {
    if (dir === 1) return [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]];
    return [[0,0],[1,0],[1,-1],[0,2],[1,2]];
  }

  _getIKicks(dir) {
    if (dir === 1) return [[0,0],[-2,0],[1,0],[-2,-1],[1,2]];
    return [[0,0],[2,0],[-1,0],[2,1],[-1,-2]];
  }

  _hardDrop() {
    if (!this.current) return;
    let dropped = 0;
    while (this._movePiece(0, 1)) dropped++;
    this.score += dropped * 2;
    this._lockPiece();
  }

  _holdCurrentPiece() {
    if (!this.current || !this.canHold) return;
    const type = this.current.type;
    if (this.holdPiece) {
      const prev = this.holdPiece;
      this.holdPiece = type;
      const piece = this.pieces[prev];
      const shape = piece.shape.map(row => [...row]);
      this.current = {
        type: prev, shape, color: piece.color,
        x: Math.floor((this.cols - shape[0].length) / 2),
        y: prev === 'I' ? -1 : 0,
        rotation: 0
      };
    } else {
      this.holdPiece = type;
      this._spawnPiece();
    }
    this.canHold = false;
    this.locking = false;
    this.lockTimer = 0;
    this.lockMoves = 0;
    this._drawSidePanels();
  }

  _getGhostY() {
    if (!this.current) return 0;
    let gy = this.current.y;
    while (this._isValid(this.current.shape, this.current.x, gy + 1)) gy++;
    return gy;
  }

  _lockPiece() {
    if (!this.current) return;
    const { shape, x, y, color } = this.current;

    // Check T-spin
    const isTSpin = this._checkTSpin();

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const bx = x + c;
        const by = y + r;
        if (by >= 0 && by < this.rows && bx >= 0 && bx < this.cols) {
          this.board[by][bx] = color;
        }
      }
    }

    // Check for line clears
    const cleared = [];
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.board[r].every(cell => cell !== null)) {
        cleared.push(r);
      }
    }

    if (cleared.length > 0) {
      this.clearingLines = cleared;
      this.clearAnimTimer = this.clearAnimDuration;
      this._scoreLineClear(cleared.length, isTSpin);
      this.combo++;
    } else {
      this.combo = -1;
      this._spawnPiece();
    }

    this.lastWasTSpin = isTSpin;
    this.canHold = true;
  }

  _checkTSpin() {
    if (!this.current || this.current.type !== 'T') return false;
    const { x, y } = this.current;
    // Check 4 corners of T bounding box (3x3)
    const corners = [[0,0],[2,0],[0,2],[2,2]];
    let filled = 0;
    for (const [cx, cy] of corners) {
      const bx = x + cx;
      const by = y + cy;
      if (bx < 0 || bx >= this.cols || by < 0 || by >= this.rows || (by >= 0 && this.board[by] && this.board[by][bx])) {
        filled++;
      }
    }
    return filled >= 3;
  }

  _scoreLineClear(linesCleared, isTSpin) {
    let points = 0;
    const lvl = this.level;
    let isTetris = false;
    let isDifficult = false;

    if (isTSpin) {
      this.stats.tspins++;
      switch (linesCleared) {
        case 0: points = 400 * lvl; break;
        case 1: points = 800 * lvl; isDifficult = true; break;
        case 2: points = 1200 * lvl; isDifficult = true; break;
        case 3: points = 1600 * lvl; isDifficult = true; break;
      }
    } else {
      switch (linesCleared) {
        case 1: points = 100 * lvl; this.stats.singles++; break;
        case 2: points = 300 * lvl; this.stats.doubles++; isDifficult = true; break;
        case 3: points = 500 * lvl; this.stats.triples++; isDifficult = true; break;
        case 4: points = 800 * lvl; this.stats.tetrises++; isTetris = true; isDifficult = true; break;
      }
    }

    // Back-to-back bonus
    if (isDifficult) {
      if (this.backToBack) {
        points = Math.floor(points * 1.5);
      }
      this.backToBack = true;
    } else {
      this.backToBack = false;
    }

    // Combo bonus
    if (this.combo > 0) {
      points += 50 * this.combo * lvl;
    }

    this.score += points;
    this.lines += linesCleared;

    // Level up every 10 lines
    const newLevel = Math.floor(this.lines / 10) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.dropInterval = Math.max(50, 1000 * Math.pow(0.85, this.level - 1));
    }

    this.lastClearWasTetris = isTetris;

    // Check perfect clear
    if (this.board.every(row => row.every(cell => cell === null))) {
      this.stats.perfectClears++;
      this.score += 3000 * lvl;
    }

    // Sprint mode check
    if (this.mode === 'sprint' && this.lines >= this.sprintLines) {
      this.sprintTime = performance.now() - this.sprintStart;
      this.gameOver = true;
      this._onGameOver();
    }
  }

  _processLineClear() {
    // Remove cleared lines and add empty ones on top
    for (const row of this.clearingLines.sort((a, b) => a - b)) {
      this.board.splice(row, 1);
      this.board.unshift(Array(this.cols).fill(null));
    }
    this.clearingLines = [];

    // Spawn particles
    for (const row of this.clearingLines) {
      for (let c = 0; c < this.cols; c++) {
        for (let i = 0; i < 3; i++) {
          this.particles.push({
            x: c * this.cellSize + this.cellSize / 2,
            y: row * this.cellSize + this.cellSize / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 6 - 2,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            size: 2 + Math.random() * 4,
            color: ['#ff003c', '#ff2d6b', '#00f0ff', '#ffffff'][Math.floor(Math.random() * 4)]
          });
        }
      }
    }

    this._spawnPiece();
  }

  _onGameOver() {
    // Save score
    if (this.mode === 'marathon') {
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        this._saveScores();
      }
    } else if (this.mode === 'sprint' && this.sprintTime > 0) {
      if (this.sprintTime < this.bestSprint) {
        this.bestSprint = this.sprintTime;
        this._saveScores();
      }
    }
  }

  // ── Game Loop ──────────────────────────────────────────────────────

  _gameLoop() {
    if (this.destroyed || !this.running) return;
    this.animFrameId = requestAnimationFrame(() => this._gameLoop());

    if (this.paused) {
      this._renderFrame();
      this._drawPauseOverlay();
      return;
    }

    if (this.gameOver) {
      this._renderFrame();
      this._drawGameOverOverlay();
      return;
    }

    this._update(performance.now());
    this._renderFrame();
  }

  _update(now) {
    // Line clear animation
    if (this.clearingLines.length > 0) {
      this.clearAnimTimer--;
      if (this.clearAnimTimer <= 0) {
        this._processLineClear();
      }
      return;
    }

    if (!this.current) return;

    // Sprint timer
    if (this.mode === 'sprint') {
      this.sprintTime = now - this.sprintStart;
      const timerEl = document.getElementById('tetris-sprint-timer');
      if (timerEl) timerEl.textContent = (this.sprintTime / 1000).toFixed(2) + 's';
    }

    // Gravity
    if (now - this.lastDrop >= this.dropInterval) {
      this.lastDrop = now;
      if (!this._movePiece(0, 1)) {
        // Can't move down, start lock timer
        if (!this.locking) {
          this.locking = true;
          this.lockTimer = now;
        }
      } else {
        this.locking = false;
      }
    }

    // Lock delay
    if (this.locking) {
      // Check if we can still move down (piece was moved)
      if (this._isValid(this.current.shape, this.current.x, this.current.y + 1)) {
        this.locking = false;
      } else if (now - this.lockTimer >= this.lockDelay || this.lockMoves >= this.maxLockMoves) {
        this._lockPiece();
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.1;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update HUD
    this._updateHUD();
  }

  _updateHUD() {
    const scoreEl = document.getElementById('tetris-score-display');
    const levelEl = document.getElementById('tetris-level-display');
    const linesEl = document.getElementById('tetris-lines-display');
    if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
    if (levelEl) levelEl.textContent = `LEVEL ${this.level}`;
    if (linesEl) linesEl.textContent = `LINES ${this.lines}${this.mode === 'sprint' ? `/${this.sprintLines}` : ''}`;
  }

  // ── Rendering ──────────────────────────────────────────────────────

  _renderFrame() {
    const ctx = this.ctx;
    const cs = this.cellSize;

    // Clear
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, this.width, this.height);

    // Grid
    ctx.strokeStyle = 'rgba(255, 0, 60, 0.04)';
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= this.cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cs, 0);
      ctx.lineTo(c * cs, this.height);
      ctx.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cs);
      ctx.lineTo(this.width, r * cs);
      ctx.stroke();
    }

    // Board
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c]) {
          // Check if this row is being cleared
          if (this.clearingLines.includes(r)) {
            const progress = 1 - (this.clearAnimTimer / this.clearAnimDuration);
            ctx.globalAlpha = 1 - progress;
            this._drawCell(ctx, c, r, this.board[r][c]);
            ctx.globalAlpha = 1;
          } else {
            this._drawCell(ctx, c, r, this.board[r][c]);
          }
        }
      }
    }

    // Line clear flash
    if (this.clearingLines.length > 0) {
      const progress = 1 - (this.clearAnimTimer / this.clearAnimDuration);
      ctx.fillStyle = `rgba(255, 255, 255, ${(1 - progress) * 0.3})`;
      for (const r of this.clearingLines) {
        ctx.fillRect(0, r * cs, this.width, cs);
      }
    }

    // Ghost piece
    if (this.current && !this.gameOver) {
      const ghostY = this._getGhostY();
      if (ghostY !== this.current.y) {
        ctx.globalAlpha = 0.2;
        for (let r = 0; r < this.current.shape.length; r++) {
          for (let c = 0; c < this.current.shape[r].length; c++) {
            if (this.current.shape[r][c]) {
              this._drawCell(ctx, this.current.x + c, ghostY + r, this.current.color);
            }
          }
        }
        ctx.globalAlpha = 1;
      }
    }

    // Current piece
    if (this.current && !this.gameOver) {
      for (let r = 0; r < this.current.shape.length; r++) {
        for (let c = 0; c < this.current.shape[r].length; c++) {
          if (this.current.shape[r][c]) {
            this._drawCell(ctx, this.current.x + c, this.current.y + r, this.current.color);
          }
        }
      }
    }

    // Particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  _drawCell(ctx, col, row, color) {
    const cs = this.cellSize;
    const x = col * cs;
    const y = row * cs;

    if (y < 0) return;

    // Main fill
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
    ctx.shadowBlur = 0;

    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(x + 2, y + 2, cs - 4, 3);
    ctx.fillRect(x + 2, y + 2, 3, cs - 4);

    // Inner shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x + cs - 4, y + 4, 2, cs - 6);
    ctx.fillRect(x + 4, y + cs - 4, cs - 6, 2);
  }

  _drawSidePanels() {
    // Draw hold piece
    const holdCanvas = document.getElementById('tetris-hold-canvas');
    if (holdCanvas) {
      const hctx = holdCanvas.getContext('2d');
      hctx.clearRect(0, 0, 80, 80);
      if (this.holdPiece) {
        const piece = this.pieces[this.holdPiece];
        const alpha = this.canHold ? 1 : 0.3;
        hctx.globalAlpha = alpha;
        this._drawMiniPiece(hctx, piece, 80, 80);
        hctx.globalAlpha = 1;
      }
    }

    // Draw next pieces
    const nextCanvas = document.getElementById('tetris-next-canvas');
    if (nextCanvas) {
      const nctx = nextCanvas.getContext('2d');
      nctx.clearRect(0, 0, 80, 260);
      for (let i = 0; i < Math.min(5, this.nextQueue.length); i++) {
        const piece = this.pieces[this.nextQueue[i]];
        nctx.save();
        nctx.translate(0, i * 52);
        this._drawMiniPiece(nctx, piece, 80, 52);
        nctx.restore();
      }
    }

    // Update stats
    const statsEl = document.getElementById('tetris-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div>Pcs: ${this.piecesPlaced}</div>
        <div>1×: ${this.stats.singles}</div>
        <div>2×: ${this.stats.doubles}</div>
        <div>3×: ${this.stats.triples}</div>
        <div>4×: ${this.stats.tetrises}</div>
        <div>T-Spin: ${this.stats.tspins}</div>
        <div>PC: ${this.stats.perfectClears}</div>
      `;
    }
  }

  _drawMiniPiece(ctx, piece, w, h) {
    const shape = piece.shape;
    const rows = shape.length;
    const cols = shape[0].length;
    const cellW = Math.min(w / cols, 16);
    const cellH = Math.min(h / rows, 16);
    const cell = Math.min(cellW, cellH);
    const ox = (w - cols * cell) / 2;
    const oy = (h - rows * cell) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r][c]) {
          ctx.fillStyle = piece.color;
          ctx.shadowColor = piece.color;
          ctx.shadowBlur = 4;
          ctx.fillRect(ox + c * cell + 1, oy + r * cell + 1, cell - 2, cell - 2);
          ctx.shadowBlur = 0;
        }
      }
    }
  }

  _drawPauseOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(10, 10, 15, 0.8)';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#ff003c';
    ctx.shadowColor = '#ff003c';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 30px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', this.width / 2, this.height / 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.fillText('P to resume', this.width / 2, this.height / 2 + 30);
  }

  _drawGameOverOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
    ctx.fillRect(0, 0, this.width, this.height);

    const isSprint = this.mode === 'sprint' && this.sprintTime > 0;
    ctx.fillStyle = isSprint ? '#00ff88' : '#ff003c';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 20;
    ctx.font = 'bold 28px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isSprint ? 'SPRINT COMPLETE!' : 'GAME OVER', this.width / 2, this.height / 2 - 50);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff4488';
    ctx.font = '18px Courier New';
    ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, this.width / 2, this.height / 2 - 10);

    ctx.fillStyle = '#888';
    ctx.font = '12px Courier New';
    ctx.fillText(`Level: ${this.level} | Lines: ${this.lines}`, this.width / 2, this.height / 2 + 20);

    if (isSprint) {
      ctx.fillStyle = '#00f0ff';
      ctx.font = '16px Courier New';
      ctx.fillText(`Time: ${(this.sprintTime / 1000).toFixed(2)}s`, this.width / 2, this.height / 2 + 50);
    }

    ctx.fillStyle = '#666';
    ctx.font = '11px Courier New';
    ctx.fillText('SPACE to retry | ESC for menu', this.width / 2, this.height / 2 + 80);
  }

  // ── Scores ─────────────────────────────────────────────────────────

  _loadScores() {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      this.bestScore = data.bestScore || 0;
      this.bestSprint = data.bestSprint || Infinity;
    } catch { this.bestScore = 0; this.bestSprint = Infinity; }
  }

  _saveScores() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        bestScore: this.bestScore,
        bestSprint: this.bestSprint === Infinity ? null : this.bestSprint
      }));
    } catch {}
  }
}
