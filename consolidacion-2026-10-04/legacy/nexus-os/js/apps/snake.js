/**
 * NEXUS OS — Neon Snake
 * Classic snake game with cyberpunk neon aesthetic.
 * Canvas rendering with neon trail, gradient body, power-ups, and leaderboard.
 */
class NeonSnake {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.animFrameId = null;
    this.running = false;
    this.destroyed = false;
    this.paused = false;

    // Grid
    this.cellSize = 20;
    this.cols = 30;
    this.rows = 25;
    this.width = this.cols * this.cellSize;
    this.height = this.rows * this.cellSize;

    // Snake
    this.snake = [];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.growQueue = 0;

    // Food
    this.food = null;
    this.foodPulse = 0;

    // Score
    this.score = 0;
    this.highScores = [];
    this.baseSpeed = 8; // frames per move
    this.moveTimer = 0;
    this.speed = this.baseSpeed;

    // Power-ups
    this.powerUp = null;
    this.activePowerUps = [];
    this.powerUpTimer = 0;
    this.ghostMode = false;
    this.doublePoints = false;

    // Walls
    this.wrapWalls = true;

    // State
    this.gameState = 'menu'; // menu, playing, gameover
    this.deathAnimation = 0;

    // Particles
    this.particles = [];

    // Grid glow
    this.gridPulse = 0;

    // Input
    this.keys = {};

    // Leaderboard key
    this.storageKey = 'nexus_snake_scores';

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
      width: 100%; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center; background: #0a0a0f;
      position: relative; overflow: hidden; font-family: 'Courier New', monospace;
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

    // HUD
    this.hud = document.createElement('div');
    this.hud.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; padding: 6px 16px;
      display: none; justify-content: space-between; align-items: center; z-index: 5;
      pointer-events: none;
    `;
    this.hud.innerHTML = `
      <span id="snake-score" style="color: #ff003c; font-size: 16px; text-shadow: 0 0 8px #ff003c;">SCORE: 0</span>
      <span id="snake-powerup" style="color: #ffff00; font-size: 12px;"></span>
      <span style="color: #555; font-size: 11px;">P = PAUSE | ESC = MENU</span>
    `;
    this.wrapper.appendChild(this.hud);
  }

  _setupCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.cssText = `
      border: 1px solid rgba(255, 0, 60, 0.3);
      box-shadow: 0 0 20px rgba(255, 0, 60, 0.2);
      max-width: 100%; max-height: 85%;
    `;
    this.wrapper.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  }

  _bindEvents() {
    document.addEventListener('keydown', this._boundKeyDown);
    document.addEventListener('keyup', this._boundKeyUp);
  }

  _onKeyDown(e) {
    this.keys[e.key] = true;

    if (this.gameState !== 'playing') {
      if (e.key === ' ' || e.key === 'Enter') {
        if (this.gameState === 'gameover') {
          this._startGame();
        }
      }
      if (e.key === 'Escape') {
        if (this.gameState === 'gameover') {
          this.gameState = 'menu';
          this.running = false;
          if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
          this._showMenu();
        }
      }
      return;
    }

    // Direction (prevent 180° turns)
    const dir = this.direction;
    if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && dir.y !== 1) {
      this.nextDirection = { x: 0, y: -1 };
    }
    if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && dir.y !== -1) {
      this.nextDirection = { x: 0, y: 1 };
    }
    if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && dir.x !== 1) {
      this.nextDirection = { x: -1, y: 0 };
    }
    if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && dir.x !== -1) {
      this.nextDirection = { x: 1, y: 0 };
    }
    if (e.key === 'p' || e.key === 'P') {
      this.paused = !this.paused;
    }
    if (e.key === 'Escape') {
      this.running = false;
      this.gameState = 'menu';
      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
      this._showMenu();
    }
  }

  _onKeyUp(e) {
    this.keys[e.key] = false;
  }

  // ── Menu ───────────────────────────────────────────────────────────

  _showMenu() {
    this.menuOverlay.style.display = 'flex';
    this.hud.style.display = 'none';
    const topScores = this.highScores.slice(0, 5);
    this.menuOverlay.innerHTML = `
      <div style="text-align: center; max-width: 500px;">
        <h1 style="color: #ff003c; font-size: 42px; margin: 0 0 8px; text-shadow: 0 0 20px #ff003c, 0 0 40px rgba(255,0,60,0.5);
          font-family: 'Courier New', monospace; letter-spacing: 6px;">NEON SNAKE</h1>
        <p style="color: #ff4488; font-size: 13px; margin: 0 0 25px; text-shadow: 0 0 8px #ff4488;">
          CONSUME THE NEON ORBS. GROW. SURVIVE.
        </p>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: center; margin-bottom: 15px;">
          <label style="color: #888; font-size: 12px; display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="snake-wrap" ${this.wrapWalls ? 'checked' : ''} style="accent-color: #ff003c;">
            WRAP-AROUND WALLS (uncheck = solid walls)
          </label>
        </div>
        <button id="snake-start-btn" style="
          padding: 12px 40px; background: rgba(255, 0, 60, 0.2); border: 2px solid #ff003c;
          color: #ff003c; font-family: 'Courier New', monospace; font-size: 16px;
          cursor: pointer; letter-spacing: 3px; text-transform: uppercase;
          text-shadow: 0 0 8px #ff003c; box-shadow: 0 0 15px rgba(255,0,60,0.3);
        ">START</button>
        ${topScores.length > 0 ? `
          <div style="margin-top: 25px;">
            <div style="color: #ff003c; font-size: 14px; margin-bottom: 8px; text-shadow: 0 0 8px #ff003c;">HIGH SCORES</div>
            ${topScores.map((s, i) => `
              <div style="color: ${i === 0 ? '#ff003c' : '#888'}; font-size: 13px; margin: 3px 0;">
                ${i + 1}. ${s.score} pts — ${s.length} cells
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div style="margin-top: 20px; color: #555; font-size: 11px; line-height: 1.8;">
          <div>WASD or ARROW KEYS — Move</div>
          <div>P — Pause | ESC — Menu</div>
        </div>
      </div>
    `;

    this.menuOverlay.querySelector('#snake-start-btn').addEventListener('click', () => {
      const wrap = this.menuOverlay.querySelector('#snake-wrap');
      if (wrap) this.wrapWalls = wrap.checked;
      this._startGame();
    });
  }

  _startGame() {
    this.menuOverlay.style.display = 'none';
    this.hud.style.display = 'flex';

    // Init snake in center
    const startX = Math.floor(this.cols / 2);
    const startY = Math.floor(this.rows / 2);
    this.snake = [];
    for (let i = 4; i >= 0; i--) {
      this.snake.push({ x: startX - i, y: startY });
    }

    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.moveTimer = 0;
    this.speed = this.baseSpeed;
    this.growQueue = 0;
    this.gameState = 'playing';
    this.paused = false;
    this.particles = [];
    this.powerUp = null;
    this.activePowerUps = [];
    this.powerUpTimer = 0;
    this.ghostMode = false;
    this.doublePoints = false;
    this.deathAnimation = 0;

    this._spawnFood();
    this.running = true;
    this._gameLoop();
  }

  // ── Game Loop ──────────────────────────────────────────────────────

  _gameLoop() {
    if (this.destroyed || !this.running) return;
    this.animFrameId = requestAnimationFrame(() => this._gameLoop());

    if (this.paused) {
      this._renderFrame();
      this._drawPause();
      return;
    }
    if (this.gameState === 'gameover') {
      this.deathAnimation++;
      this._renderFrame();
      this._drawGameOver();
      return;
    }

    this._update();
    this._renderFrame();
  }

  // ── Update ─────────────────────────────────────────────────────────

  _update() {
    this.gridPulse += 0.02;
    this.foodPulse += 0.05;

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy;
      p.life--;
      p.vx *= 0.96; p.vy *= 0.96;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Power-up spawning
    this.powerUpTimer++;
    if (!this.powerUp && this.powerUpTimer > 600 && Math.random() < 0.005) {
      this._spawnPowerUp();
    }

    // Active power-up timers
    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      this.activePowerUps[i].duration--;
      if (this.activePowerUps[i].duration <= 0) {
        if (this.activePowerUps[i].type === 'ghost') this.ghostMode = false;
        if (this.activePowerUps[i].type === 'double') this.doublePoints = false;
        if (this.activePowerUps[i].type === 'slow') this.speed = Math.max(3, this.speed - 3);
        this.activePowerUps.splice(i, 1);
        this._updateHUD();
      }
    }

    // Power-up pulse
    if (this.powerUp) {
      this.powerUp.pulse = (this.powerUp.pulse || 0) + 0.05;
      this.powerUp.life--;
      if (this.powerUp.life <= 0) this.powerUp = null;
    }

    // Move timer
    const speedMod = this.activePowerUps.find(p => p.type === 'fast') ? 0.6 : 1;
    this.moveTimer++;
    if (this.moveTimer < this.speed * speedMod) return;
    this.moveTimer = 0;

    // Apply direction
    this.direction = { ...this.nextDirection };

    // Calculate new head
    const head = this.snake[this.snake.length - 1];
    let newX = head.x + this.direction.x;
    let newY = head.y + this.direction.y;

    // Wall handling
    if (this.wrapWalls) {
      newX = ((newX % this.cols) + this.cols) % this.cols;
      newY = ((newY % this.rows) + this.rows) % this.rows;
    } else {
      if (newX < 0 || newX >= this.cols || newY < 0 || newY >= this.rows) {
        this._die();
        return;
      }
    }

    // Self collision
    if (!this.ghostMode) {
      for (const seg of this.snake) {
        if (seg.x === newX && seg.y === newY) {
          this._die();
          return;
        }
      }
    }

    // Move
    this.snake.push({ x: newX, y: newY });
    if (this.growQueue > 0) {
      this.growQueue--;
    } else {
      this.snake.shift();
    }

    // Food check
    if (this.food && newX === this.food.x && newY === this.food.y) {
      const points = this.doublePoints ? 20 : 10;
      this.score += points;
      this.growQueue += 2;
      this._spawnFoodParticles(this.food.x, this.food.y);
      this._spawnFood();

      // Speed up slightly
      this.speed = Math.max(3, this.baseSpeed - Math.floor(this.snake.length / 5));
      this._updateHUD();
    }

    // Power-up check
    if (this.powerUp && newX === this.powerUp.x && newY === this.powerUp.y) {
      this._activatePowerUp(this.powerUp.type);
      this._spawnFoodParticles(this.powerUp.x, this.powerUp.y);
      this.powerUp = null;
      this._updateHUD();
    }
  }

  _die() {
    this.gameState = 'gameover';
    this.deathAnimation = 0;

    // Death particles
    for (const seg of this.snake) {
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: seg.x * this.cellSize + this.cellSize / 2,
          y: seg.y * this.cellSize + this.cellSize / 2,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 30 + Math.random() * 30,
          maxLife: 60,
          size: 3 + Math.random() * 4,
          color: '#ff003c'
        });
      }
    }

    this._saveScore();
  }

  _spawnFood() {
    const empty = [];
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const occupied = this.snake.some(s => s.x === x && s.y === y) ||
          (this.powerUp && this.powerUp.x === x && this.powerUp.y === y);
        if (!occupied) empty.push({ x, y });
      }
    }
    if (empty.length > 0) {
      this.food = empty[Math.floor(Math.random() * empty.length)];
    }
  }

  _spawnPowerUp() {
    const types = ['fast', 'slow', 'double', 'ghost'];
    const type = types[Math.floor(Math.random() * types.length)];
    const empty = [];
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const occupied = this.snake.some(s => s.x === x && s.y === y) ||
          (this.food && this.food.x === x && this.food.y === y);
        if (!occupied) empty.push({ x, y });
      }
    }
    if (empty.length > 0) {
      const pos = empty[Math.floor(Math.random() * empty.length)];
      this.powerUp = {
        x: pos.x, y: pos.y, type,
        pulse: 0, life: 480
      };
    }
  }

  _activatePowerUp(type) {
    switch (type) {
      case 'fast':
        this.activePowerUps = this.activePowerUps.filter(p => p.type !== 'fast');
        this.activePowerUps.push({ type: 'fast', duration: 300 });
        break;
      case 'slow':
        this.activePowerUps = this.activePowerUps.filter(p => p.type !== 'slow');
        this.activePowerUps.push({ type: 'slow', duration: 300 });
        this.speed = this.speed + 3;
        break;
      case 'double':
        this.doublePoints = true;
        this.activePowerUps = this.activePowerUps.filter(p => p.type !== 'double');
        this.activePowerUps.push({ type: 'double', duration: 600 });
        break;
      case 'ghost':
        this.ghostMode = true;
        this.activePowerUps = this.activePowerUps.filter(p => p.type !== 'ghost');
        this.activePowerUps.push({ type: 'ghost', duration: 300 });
        break;
    }
  }

  _spawnFoodParticles(gx, gy) {
    const cx = gx * this.cellSize + this.cellSize / 2;
    const cy = gy * this.cellSize + this.cellSize / 2;
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 20 + Math.random() * 20,
        maxLife: 40,
        size: 2 + Math.random() * 4,
        color: ['#ff003c', '#ff2d6b', '#ff6699', '#ffffff'][Math.floor(Math.random() * 4)]
      });
    }
  }

  _updateHUD() {
    const scoreEl = this.hud.querySelector('#snake-score');
    if (scoreEl) scoreEl.textContent = `SCORE: ${this.score}`;
    const puEl = this.hud.querySelector('#snake-powerup');
    if (puEl) {
      const labels = { fast: '⚡ SPEED', slow: '🐌 SLOW', double: '×2 DOUBLE', ghost: '👻 GHOST' };
      const colors = { fast: '#ffff00', slow: '#aa66ff', double: '#00ff88', ghost: '#66ccff' };
      puEl.innerHTML = this.activePowerUps.map(ap => {
        const secs = Math.ceil(ap.duration / 60);
        return `<span style="color:${colors[ap.type]};margin:0 5px;">${labels[ap.type]} ${secs}s</span>`;
      }).join('');
    }
  }

  // ── Rendering ──────────────────────────────────────────────────────

  _renderFrame() {
    const ctx = this.ctx;
    const cs = this.cellSize;

    // Clear
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, this.width, this.height);

    // Grid
    const gridAlpha = 0.03 + Math.sin(this.gridPulse) * 0.01;
    ctx.strokeStyle = `rgba(255, 0, 60, ${gridAlpha})`;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= this.cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cs, 0);
      ctx.lineTo(x * cs, this.height);
      ctx.stroke();
    }
    for (let y = 0; y <= this.rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cs);
      ctx.lineTo(this.width, y * cs);
      ctx.stroke();
    }

    // Wall border glow
    if (!this.wrapWalls) {
      ctx.strokeStyle = 'rgba(255, 0, 60, 0.4)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff003c';
      ctx.shadowBlur = 10;
      ctx.strokeRect(1, 1, this.width - 2, this.height - 2);
      ctx.shadowBlur = 0;
    }

    // Food
    if (this.food) {
      const fx = this.food.x * cs + cs / 2;
      const fy = this.food.y * cs + cs / 2;
      const pulse = Math.sin(this.foodPulse) * 3;
      const radius = cs * 0.4 + pulse;

      ctx.shadowColor = '#ff003c';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ff003c';
      ctx.beginPath();
      ctx.arc(fx, fy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner glow
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(fx, fy, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Power-up
    if (this.powerUp) {
      const px = this.powerUp.x * cs + cs / 2;
      const py = this.powerUp.y * cs + cs / 2;
      const pulse = Math.sin(this.powerUp.pulse || 0) * 3;
      const colors = { fast: '#ffff00', slow: '#aa66ff', double: '#00ff88', ghost: '#66ccff' };
      const icons = { fast: '⚡', slow: '◎', double: '×2', ghost: '◈' };
      const color = colors[this.powerUp.type];
      const alpha = this.powerUp.life < 120 ? (Math.sin(this.powerUp.life * 0.2) * 0.3 + 0.7) : 1;

      ctx.globalAlpha = alpha;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, cs * 0.45 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = `bold ${cs * 0.6}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icons[this.powerUp.type], px, py);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Snake
    const len = this.snake.length;
    for (let i = 0; i < len; i++) {
      const seg = this.snake[i];
      const t = i / Math.max(len - 1, 1);
      const px = seg.x * cs;
      const py = seg.y * cs;

      // Gradient from tail (dim) to head (bright)
      const r = Math.floor(180 + t * 75);
      const g = Math.floor(0 + t * 0);
      const b = Math.floor(30 + t * 30);
      const color = `rgb(${r}, ${g}, ${b})`;

      if (i === len - 1) {
        // Head — brighter glow
        ctx.shadowColor = '#ff003c';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ff2d6b';
        ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
        ctx.shadowBlur = 0;

        // Eyes
        const eyeSize = 3;
        ctx.fillStyle = '#ffffff';
        if (this.direction.x === 1) {
          ctx.fillRect(px + cs - 6, py + 4, eyeSize, eyeSize);
          ctx.fillRect(px + cs - 6, py + cs - 7, eyeSize, eyeSize);
        } else if (this.direction.x === -1) {
          ctx.fillRect(px + 3, py + 4, eyeSize, eyeSize);
          ctx.fillRect(px + 3, py + cs - 7, eyeSize, eyeSize);
        } else if (this.direction.y === -1) {
          ctx.fillRect(px + 4, py + 3, eyeSize, eyeSize);
          ctx.fillRect(px + cs - 7, py + 3, eyeSize, eyeSize);
        } else {
          ctx.fillRect(px + 4, py + cs - 6, eyeSize, eyeSize);
          ctx.fillRect(px + cs - 7, py + cs - 6, eyeSize, eyeSize);
        }
      } else {
        // Body
        if (this.ghostMode) {
          ctx.globalAlpha = 0.4;
        }
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;
        ctx.fillStyle = color;
        ctx.fillRect(px + 2, py + 2, cs - 4, cs - 4);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
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

  _drawPause() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(10, 10, 15, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#ff003c';
    ctx.shadowColor = '#ff003c';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 36px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', this.width / 2, this.height / 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#888';
    ctx.font = '14px Courier New';
    ctx.fillText('Press P to resume', this.width / 2, this.height / 2 + 35);
  }

  _drawGameOver() {
    const ctx = this.ctx;
    const alpha = Math.min(this.deathAnimation / 60, 0.85);
    ctx.fillStyle = `rgba(10, 10, 15, ${alpha})`;
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.deathAnimation > 30) {
      ctx.fillStyle = '#ff003c';
      ctx.shadowColor = '#ff003c';
      ctx.shadowBlur = 25;
      ctx.font = 'bold 38px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ff4488';
      ctx.font = '20px Courier New';
      ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 15);

      ctx.fillStyle = '#888';
      ctx.font = '13px Courier New';
      ctx.fillText(`Length: ${this.snake.length} cells`, this.width / 2, this.height / 2 + 45);

      if (this.deathAnimation > 60) {
        ctx.fillStyle = '#666';
        ctx.font = '12px Courier New';
        ctx.fillText('SPACE to restart | ESC for menu', this.width / 2, this.height / 2 + 80);
      }
    }
  }

  // ── Leaderboard ────────────────────────────────────────────────────

  _loadScores() {
    try {
      this.highScores = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch { this.highScores = []; }
  }

  _saveScore() {
    this.highScores.push({
      score: this.score,
      length: this.snake.length,
      date: new Date().toISOString().slice(0, 10)
    });
    this.highScores.sort((a, b) => b.score - a.score);
    this.highScores = this.highScores.slice(0, 10);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.highScores));
    } catch {}
  }
}
