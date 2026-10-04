/**
 * NEXUS OS — Neon Pong
 * Classic Pong with cyberpunk neon aesthetic.
 * Canvas-based rendering with particle trails, power-ups, and AI opponent.
 */
class NeonPong {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.animFrameId = null;
    this.running = false;
    this.paused = false;
    this.destroyed = false;

    // Game state
    this.scorePlayer = 0;
    this.scoreAI = 0;
    this.winScore = 11;
    this.difficulty = 'normal'; // easy, normal, hard
    this.gameOver = false;
    this.winner = null;
    this.countdown = 0;
    this.countdownTimer = 0;
    this.rallyCount = 0;

    // Dimensions
    this.width = 800;
    this.height = 500;

    // Paddles
    this.paddleWidth = 12;
    this.paddleHeight = 80;
    this.playerY = this.height / 2 - 40;
    this.aiY = this.height / 2 - 40;
    this.playerSpeed = 7;
    this.aiSpeed = 4.5;
    this.aiReaction = 0.06;
    this.aiError = 20;

    // Ball
    this.ballSize = 10;
    this.ballX = this.width / 2;
    this.ballY = this.height / 2;
    this.ballVX = 5;
    this.ballVY = 3;
    this.baseSpeed = 5;
    this.maxSpeed = 12;
    this.balls = [];

    // Particles
    this.particles = [];
    this.trailParticles = [];

    // Power-ups
    this.powerUps = [];
    this.activePowerUps = [];
    this.powerUpTimer = 0;
    this.powerUpInterval = 600; // frames between spawns

    // Input
    this.keys = {};
    this.mouseY = null;
    this.useMouseControl = false;

    // Grid animation
    this.gridOffset = 0;

    // Screen shake
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeIntensity = 0;

    // Sound hooks
    this.sounds = {
      paddleHit: null,
      wallBounce: null,
      score: null,
      powerUp: null
    };

    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp = this._onKeyUp.bind(this);
    this._boundMouseMove = this._onMouseMove.bind(this);
    this._boundClick = this._onClick.bind(this);
  }

  render() {
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
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this._boundMouseMove);
      this.canvas.removeEventListener('click', this._boundClick);
    }
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  // ── DOM Construction ───────────────────────────────────────────────

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
      background: rgba(10, 10, 15, 0.95); z-index: 10;
    `;
    this.wrapper.appendChild(this.menuOverlay);

    // HUD
    this.hud = document.createElement('div');
    this.hud.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; padding: 8px 16px;
      display: none; justify-content: space-between; align-items: center;
      z-index: 5; pointer-events: none;
    `;
    this.hud.innerHTML = `
      <span style="color: #ff003c; font-size: 14px; text-shadow: 0 0 8px #ff003c;">PLAYER</span>
      <span id="pong-pause-hint" style="color: #666; font-size: 11px;">P = PAUSE</span>
      <span style="color: #00f0ff; font-size: 14px; text-shadow: 0 0 8px #00f0ff;">NEXUS AI</span>
    `;
    this.wrapper.appendChild(this.hud);
  }

  _setupCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.cssText = `
      border: 1px solid rgba(255, 0, 60, 0.3);
      box-shadow: 0 0 20px rgba(255, 0, 60, 0.2), inset 0 0 20px rgba(255, 0, 60, 0.05);
      cursor: none; max-width: 100%; max-height: 80%;
    `;
    this.wrapper.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  }

  _bindEvents() {
    document.addEventListener('keydown', this._boundKeyDown);
    document.addEventListener('keyup', this._boundKeyUp);
    this.canvas.addEventListener('mousemove', this._boundMouseMove);
    this.canvas.addEventListener('click', this._boundClick);
  }

  _onKeyDown(e) {
    this.keys[e.key] = true;
    if (e.key === 'p' || e.key === 'P') {
      if (this.running && !this.gameOver) {
        this.paused = !this.paused;
      }
    }
    if (e.key === 'Escape' && this.running) {
      this.running = false;
      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
      this._showMenu();
    }
  }

  _onKeyUp(e) {
    this.keys[e.key] = false;
  }

  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleY = this.height / rect.height;
    this.mouseY = (e.clientY - rect.top) * scaleY;
    this.useMouseControl = true;
  }

  _onClick() {
    if (this.paused) this.paused = false;
  }

  // ── Menu ───────────────────────────────────────────────────────────

  _showMenu() {
    this.menuOverlay.style.display = 'flex';
    this.hud.style.display = 'none';
    this.menuOverlay.innerHTML = `
      <div style="text-align: center;">
        <h1 style="color: #ff003c; font-size: 42px; margin: 0 0 8px; text-shadow: 0 0 20px #ff003c, 0 0 40px rgba(255,0,60,0.5);
          font-family: 'Courier New', monospace; letter-spacing: 6px;">NEON PONG</h1>
        <p style="color: #ff4488; font-size: 13px; margin: 0 0 30px; text-shadow: 0 0 8px #ff4488;">
          PLAYER vs NEXUS AI — FIRST TO ${this.winScore}
        </p>
        <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
          <div style="color: #888; font-size: 12px; margin-bottom: 5px;">DIFFICULTY</div>
          <div style="display: flex; gap: 10px;">
            ${['easy', 'normal', 'hard'].map(d => `
              <button data-diff="${d}" style="
                padding: 8px 20px; background: ${this.difficulty === d ? 'rgba(255,0,60,0.3)' : 'rgba(255,255,255,0.05)'};
                border: 1px solid ${this.difficulty === d ? '#ff003c' : 'rgba(255,255,255,0.1)'};
                color: ${this.difficulty === d ? '#ff003c' : '#888'}; font-family: 'Courier New', monospace;
                font-size: 13px; cursor: pointer; text-transform: uppercase;
                transition: all 0.2s;
              ">${d}</button>
            `).join('')}
          </div>
          <button id="pong-start-btn" style="
            margin-top: 20px; padding: 12px 40px;
            background: rgba(255, 0, 60, 0.2); border: 2px solid #ff003c;
            color: #ff003c; font-family: 'Courier New', monospace; font-size: 16px;
            cursor: pointer; letter-spacing: 3px; text-transform: uppercase;
            text-shadow: 0 0 8px #ff003c; box-shadow: 0 0 15px rgba(255,0,60,0.3);
            transition: all 0.3s;
          ">START GAME</button>
        </div>
        <div style="margin-top: 25px; color: #555; font-size: 11px; line-height: 1.8;">
          <div>W/S or ↑/↓ or MOUSE — Move paddle</div>
          <div>P — Pause | ESC — Menu</div>
        </div>
      </div>
    `;

    // Difficulty buttons
    this.menuOverlay.querySelectorAll('[data-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.difficulty = btn.dataset.diff;
        this._showMenu();
      });
    });

    // Start button
    this.menuOverlay.querySelector('#pong-start-btn').addEventListener('click', () => {
      this._startGame();
    });
  }

  _startGame() {
    this.menuOverlay.style.display = 'none';
    this.hud.style.display = 'flex';

    // Set difficulty params
    switch (this.difficulty) {
      case 'easy':
        this.aiSpeed = 3.0; this.aiReaction = 0.03; this.aiError = 40;
        break;
      case 'normal':
        this.aiSpeed = 4.5; this.aiReaction = 0.06; this.aiError = 20;
        break;
      case 'hard':
        this.aiSpeed = 6.0; this.aiReaction = 0.10; this.aiError = 5;
        break;
    }

    this.scorePlayer = 0;
    this.scoreAI = 0;
    this.gameOver = false;
    this.winner = null;
    this.particles = [];
    this.trailParticles = [];
    this.powerUps = [];
    this.activePowerUps = [];
    this.powerUpTimer = 0;
    this.running = true;
    this.paused = false;

    this._resetBall(1);
    this._countdown(3);
  }

  _countdown(n) {
    this.countdown = n;
    this.countdownTimer = 60; // frames per number
    this._gameLoop();
  }

  // ── Game Loop ──────────────────────────────────────────────────────

  _gameLoop() {
    if (this.destroyed || !this.running) return;
    this.animFrameId = requestAnimationFrame(() => this._gameLoop());

    if (this.countdown > 0) {
      this.countdownTimer--;
      if (this.countdownTimer <= 0) {
        this.countdown--;
        this.countdownTimer = 60;
      }
      this._renderFrame();
      this._drawCountdown();
      return;
    }

    if (this.paused) {
      this._renderFrame();
      this._drawPause();
      return;
    }

    if (this.gameOver) {
      this._renderFrame();
      this._drawGameOver();
      return;
    }

    this._update();
    this._renderFrame();
  }

  // ── Update ─────────────────────────────────────────────────────────

  _update() {
    this._updatePlayerPaddle();
    this._updateAIPaddle();
    this._updateBalls();
    this._updateParticles();
    this._updatePowerUps();
    this._updateScreenShake();
    this.gridOffset = (this.gridOffset + 0.3) % 40;
  }

  _updatePlayerPaddle() {
    const speed = this.playerSpeed;
    let ph = this.paddleHeight;
    // Check big paddle power-up
    const bp = this.activePowerUps.find(p => p.type === 'bigPaddle');
    if (bp) ph = this.paddleHeight * 2;

    if (this.useMouseControl && this.mouseY !== null) {
      const target = this.mouseY - ph / 2;
      this.playerY += (target - this.playerY) * 0.15;
    } else {
      if (this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']) this.playerY -= speed;
      if (this.keys['s'] || this.keys['S'] || this.keys['ArrowDown']) this.playerY += speed;
    }
    this.playerY = Math.max(0, Math.min(this.height - ph, this.playerY));
  }

  _updateAIPaddle() {
    let ph = this.paddleHeight;
    let aiSpeed = this.aiSpeed;

    // Slow motion affects AI too
    const sm = this.activePowerUps.find(p => p.type === 'slowMotion');
    if (sm) aiSpeed *= 0.5;

    // Find the primary ball (closest to AI side)
    let targetBall = this.balls[0];
    if (this.balls.length > 0) {
      targetBall = this.balls.reduce((closest, b) =>
        b.vx > 0 && b.x > closest.x ? b : closest, this.balls[0]);
    }

    if (targetBall) {
      const targetY = targetBall.y + (Math.random() - 0.5) * this.aiError;
      const center = this.aiY + ph / 2;
      const diff = targetY - center;
      if (Math.abs(diff) > 5) {
        this.aiY += Math.sign(diff) * Math.min(Math.abs(diff) * this.aiReaction, aiSpeed);
      }
    }
    this.aiY = Math.max(0, Math.min(this.height - ph, this.aiY));
  }

  _updateBalls() {
    const slowMo = this.activePowerUps.find(p => p.type === 'slowMotion');
    const speedMult = slowMo ? 0.5 : 1.0;

    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      b.x += b.vx * speedMult;
      b.y += b.vy * speedMult;

      // Trail
      if (Math.random() < 0.6) {
        this.trailParticles.push({
          x: b.x, y: b.y,
          life: 20, maxLife: 20,
          size: b.size * 0.6,
          color: b.color || '#ff003c'
        });
      }

      // Wall bounce (top/bottom)
      if (b.y - b.size <= 0) {
        b.y = b.size;
        b.vy = Math.abs(b.vy);
        this._spawnWallParticles(b.x, 0);
      }
      if (b.y + b.size >= this.height) {
        b.y = this.height - b.size;
        b.vy = -Math.abs(b.vy);
        this._spawnWallParticles(b.x, this.height);
      }

      // Player paddle collision
      let playerPH = this.paddleHeight;
      const bp = this.activePowerUps.find(p => p.type === 'bigPaddle');
      if (bp) playerPH = this.paddleHeight * 2;

      if (b.vx < 0 &&
          b.x - b.size <= 20 + this.paddleWidth &&
          b.x - b.size >= 20 &&
          b.y >= this.playerY &&
          b.y <= this.playerY + playerPH) {
        b.vx = Math.abs(b.vx);
        b.x = 20 + this.paddleWidth + b.size;
        const hitPos = (b.y - this.playerY) / playerPH - 0.5;
        b.vy = hitPos * 8;
        this._speedUpBall(b);
        this.rallyCount++;
        this._spawnPaddleParticles(20 + this.paddleWidth, b.y, '#ff003c');
      }

      // AI paddle collision
      if (b.vx > 0 &&
          b.x + b.size >= this.width - 20 - this.paddleWidth &&
          b.x + b.size <= this.width - 20 &&
          b.y >= this.aiY &&
          b.y <= this.aiY + this.paddleHeight) {
        // Check laser power-up (ball passes through once)
        const laser = this.activePowerUps.find(p => p.type === 'laser');
        if (laser) {
          laser.uses--;
          if (laser.uses <= 0) {
            this.activePowerUps = this.activePowerUps.filter(p => p !== laser);
          }
          // Ball passes through
        } else {
          b.vx = -Math.abs(b.vx);
          b.x = this.width - 20 - this.paddleWidth - b.size;
          const hitPos = (b.y - this.aiY) / this.paddleHeight - 0.5;
          b.vy = hitPos * 8;
          this._speedUpBall(b);
          this.rallyCount++;
          this._spawnPaddleParticles(this.width - 20 - this.paddleWidth, b.y, '#00f0ff');
        }
      }

      // Score
      if (b.x < -20) {
        // AI scores
        if (this.balls.length <= 1) {
          this.scoreAI++;
          this.rallyCount = 0;
          this._spawnScoreParticles(0, b.y);
          this.shakeIntensity = 8;
          this.balls.splice(i, 1);
          if (this.scoreAI >= this.winScore) {
            this.gameOver = true;
            this.winner = 'ai';
          } else {
            this._resetBall(-1);
          }
        } else {
          this.balls.splice(i, 1);
        }
      }
      if (b.x > this.width + 20) {
        // Player scores
        if (this.balls.length <= 1) {
          this.scorePlayer++;
          this.rallyCount = 0;
          this._spawnScoreParticles(this.width, b.y);
          this.shakeIntensity = 8;
          this.balls.splice(i, 1);
          if (this.scorePlayer >= this.winScore) {
            this.gameOver = true;
            this.winner = 'player';
          } else {
            this._resetBall(1);
          }
        } else {
          this.balls.splice(i, 1);
        }
      }
    }
  }

  _speedUpBall(b) {
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    const newSpeed = Math.min(speed * 1.05, this.maxSpeed);
    const angle = Math.atan2(b.vy, b.vx);
    b.vx = Math.cos(angle) * newSpeed;
    b.vy = Math.sin(angle) * newSpeed;
  }

  _resetBall(direction) {
    const angle = (Math.random() - 0.5) * Math.PI * 0.5;
    this.balls = [{
      x: this.width / 2,
      y: this.height / 2,
      vx: Math.cos(angle) * this.baseSpeed * direction,
      vy: Math.sin(angle) * this.baseSpeed,
      size: this.ballSize,
      color: '#ff003c'
    }];
  }

  _updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.vx *= 0.98;
      p.vy *= 0.98;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.life--;
      if (p.life <= 0) this.trailParticles.splice(i, 1);
    }
  }

  _updatePowerUps() {
    this.powerUpTimer++;

    // Spawn new power-up
    if (this.powerUpTimer >= this.powerUpInterval && this.powerUps.length < 2) {
      this.powerUpTimer = 0;
      const types = ['multiBall', 'bigPaddle', 'slowMotion', 'laser'];
      const type = types[Math.floor(Math.random() * types.length)];
      this.powerUps.push({
        x: this.width * 0.3 + Math.random() * this.width * 0.4,
        y: 50 + Math.random() * (this.height - 100),
        type: type,
        size: 15,
        pulse: 0,
        life: 600 // disappears after 10 seconds
      });
    }

    // Check ball collision with power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.pulse += 0.05;
      pu.life--;

      if (pu.life <= 0) {
        this.powerUps.splice(i, 1);
        continue;
      }

      for (const b of this.balls) {
        const dx = b.x - pu.x;
        const dy = b.y - pu.y;
        if (Math.sqrt(dx * dx + dy * dy) < pu.size + b.size) {
          this._activatePowerUp(pu.type);
          this._spawnPowerUpParticles(pu.x, pu.y);
          this.powerUps.splice(i, 1);
          break;
        }
      }
    }

    // Update active power-ups
    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      this.activePowerUps[i].duration--;
      if (this.activePowerUps[i].duration <= 0) {
        this.activePowerUps.splice(i, 1);
      }
    }
  }

  _activatePowerUp(type) {
    switch (type) {
      case 'multiBall':
        // Split into 3 balls
        const existing = this.balls[0];
        if (existing) {
          for (let i = 0; i < 2; i++) {
            const angle = (Math.random() - 0.5) * Math.PI;
            const speed = Math.sqrt(existing.vx * existing.vx + existing.vy * existing.vy);
            this.balls.push({
              x: existing.x, y: existing.y,
              vx: Math.cos(angle) * speed * (existing.vx > 0 ? 1 : -1),
              vy: Math.sin(angle) * speed,
              size: this.ballSize,
              color: ['#ff003c', '#00f0ff', '#ff6600'][i + 1]
            });
          }
        }
        break;
      case 'bigPaddle':
        this.activePowerUps = this.activePowerUps.filter(p => p.type !== 'bigPaddle');
        this.activePowerUps.push({ type: 'bigPaddle', duration: 300 }); // 5 seconds
        break;
      case 'slowMotion':
        this.activePowerUps = this.activePowerUps.filter(p => p.type !== 'slowMotion');
        this.activePowerUps.push({ type: 'slowMotion', duration: 180 }); // 3 seconds
        break;
      case 'laser':
        this.activePowerUps = this.activePowerUps.filter(p => p.type !== 'laser');
        this.activePowerUps.push({ type: 'laser', duration: 600, uses: 1 });
        break;
    }
  }

  _updateScreenShake() {
    if (this.shakeIntensity > 0) {
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.9;
      if (this.shakeIntensity < 0.5) this.shakeIntensity = 0;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  // ── Particle Spawners ──────────────────────────────────────────────

  _spawnWallParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (y === 0 ? 1 : -1) * Math.random() * 3,
        life: 20 + Math.random() * 15,
        maxLife: 35,
        size: 2 + Math.random() * 3,
        color: '#ff4488'
      });
    }
  }

  _spawnPaddleParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x, y,
        vx: (x < this.width / 2 ? 1 : -1) * Math.random() * 5,
        vy: (Math.random() - 0.5) * 6,
        life: 25 + Math.random() * 15,
        maxLife: 40,
        size: 2 + Math.random() * 4,
        color: color
      });
    }
  }

  _spawnScoreParticles(x, y) {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40 + Math.random() * 30,
        maxLife: 70,
        size: 2 + Math.random() * 5,
        color: ['#ff003c', '#ff2d6b', '#ff4488', '#ff6699', '#ffffff'][Math.floor(Math.random() * 5)]
      });
    }
  }

  _spawnPowerUpParticles(x, y) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        size: 2 + Math.random() * 4,
        color: '#ffff00'
      });
    }
  }

  // ── Rendering ──────────────────────────────────────────────────────

  _renderFrame() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    // Clear
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(-10, -10, this.width + 20, this.height + 20);

    this._drawGrid(ctx);
    this._drawCenterLine(ctx);
    this._drawTrailParticles(ctx);
    this._drawBalls(ctx);
    this._drawPaddles(ctx);
    this._drawPowerUps(ctx);
    this._drawParticles(ctx);
    this._drawScore(ctx);
    this._drawActivePowerUps(ctx);

    ctx.restore();
  }

  _drawGrid(ctx) {
    ctx.strokeStyle = 'rgba(255, 0, 60, 0.04)';
    ctx.lineWidth = 1;
    const spacing = 40;
    // Vertical lines
    for (let x = 0; x < this.width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    // Horizontal lines with perspective feel
    for (let y = 0; y < this.height; y += spacing) {
      const offset = this.gridOffset;
      ctx.beginPath();
      ctx.moveTo(0, y + offset);
      ctx.lineTo(this.width, y + offset);
      ctx.stroke();
    }
  }

  _drawCenterLine(ctx) {
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'rgba(255, 0, 60, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(this.width / 2, this.height);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  _drawTrailParticles(ctx) {
    for (const p of this.trailParticles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  _drawBalls(ctx) {
    for (const b of this.balls) {
      // Outer glow
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright core
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  _drawPaddles(ctx) {
    let playerPH = this.paddleHeight;
    const bp = this.activePowerUps.find(p => p.type === 'bigPaddle');
    if (bp) playerPH = this.paddleHeight * 2;

    // Player paddle
    ctx.shadowColor = '#ff003c';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ff003c';
    ctx.fillRect(20, this.playerY, this.paddleWidth, playerPH);
    ctx.shadowBlur = 0;
    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(22, this.playerY + 2, 4, playerPH - 4);

    // AI paddle
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(this.width - 20 - this.paddleWidth, this.aiY, this.paddleWidth, this.paddleHeight);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(this.width - 20 - this.paddleWidth + 2, this.aiY + 2, 4, this.paddleHeight - 4);
  }

  _drawPowerUps(ctx) {
    const colors = {
      multiBall: '#ffff00',
      bigPaddle: '#00ff88',
      slowMotion: '#aa66ff',
      laser: '#ff6600'
    };
    const icons = {
      multiBall: '×3',
      bigPaddle: '↕',
      slowMotion: '◎',
      laser: '⚡'
    };
    for (const pu of this.powerUps) {
      const pulse = Math.sin(pu.pulse) * 3;
      const color = colors[pu.type] || '#ffffff';
      const alpha = pu.life < 120 ? (Math.sin(pu.life * 0.2) * 0.3 + 0.7) : 1;

      ctx.globalAlpha = alpha;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, pu.size + pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 12px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icons[pu.type], pu.x, pu.y);

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  _drawParticles(ctx) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  _drawScore(ctx) {
    // Player score
    ctx.shadowColor = '#ff003c';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff003c';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(this.scorePlayer.toString(), this.width / 2 - 60, 55);

    // AI score
    ctx.shadowColor = '#00f0ff';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(this.scoreAI.toString(), this.width / 2 + 60, 55);

    ctx.shadowBlur = 0;

    // Rally counter
    if (this.rallyCount > 3) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '12px Courier New';
      ctx.fillText(`RALLY: ${this.rallyCount}`, this.width / 2, 75);
    }
  }

  _drawActivePowerUps(ctx) {
    let y = this.height - 20;
    ctx.font = '11px Courier New';
    ctx.textAlign = 'left';
    const labels = {
      bigPaddle: 'BIG PADDLE',
      slowMotion: 'SLOW-MO',
      laser: 'LASER'
    };
    const colors = {
      bigPaddle: '#00ff88',
      slowMotion: '#aa66ff',
      laser: '#ff6600'
    };
    for (const ap of this.activePowerUps) {
      const secs = Math.ceil(ap.duration / 60);
      ctx.fillStyle = colors[ap.type] || '#fff';
      ctx.shadowColor = colors[ap.type] || '#fff';
      ctx.shadowBlur = 6;
      ctx.fillText(`${labels[ap.type]} ${secs}s`, 10, y);
      y -= 16;
    }
    ctx.shadowBlur = 0;
  }

  _drawCountdown() {
    const ctx = this.ctx;
    ctx.fillStyle = '#ff003c';
    ctx.shadowColor = '#ff003c';
    ctx.shadowBlur = 30;
    ctx.font = 'bold 80px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = this.countdown > 0 ? this.countdown.toString() : 'GO!';
    const scale = 1 + (this.countdownTimer / 60) * 0.3;
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(scale, scale);
    ctx.fillText(text, 0, 0);
    ctx.restore();
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
    ctx.fillText('Press P to resume', this.width / 2, this.height / 2 + 40);
  }

  _drawGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(10, 10, 15, 0.8)';
    ctx.fillRect(0, 0, this.width, this.height);

    const isWin = this.winner === 'player';
    const color = isWin ? '#00ff88' : '#ff003c';
    const text = isWin ? 'YOU WIN!' : 'NEXUS AI WINS';

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.font = 'bold 42px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, this.width / 2, this.height / 2 - 30);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#888';
    ctx.font = '16px Courier New';
    ctx.fillText(`${this.scorePlayer} — ${this.scoreAI}`, this.width / 2, this.height / 2 + 15);
    ctx.font = '13px Courier New';
    ctx.fillText('Press SPACE to play again | ESC for menu', this.width / 2, this.height / 2 + 50);

    // Listen for restart
    if (this.keys[' ']) {
      this.keys[' '] = false;
      this._startGame();
    }
  }
}
