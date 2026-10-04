/**
 * NEXUS OS — Space Invaders
 * Classic arcade shooter with waves of aliens.
 */
class SpaceInvaders {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.animFrameId = null;
    this.running = false;
    this.destroyed = false;

    // Game dimensions
    this.width = 600;
    this.height = 500;

    // Player
    this.player = { x: 280, y: 460, width: 40, height: 20, speed: 5 };

    // Bullets
    this.playerBullets = [];
    this.enemyBullets = [];
    this.bulletSpeed = 7;
    this.enemyBulletSpeed = 4;

    // Enemies
    this.enemies = [];
    this.enemyRows = 5;
    this.enemyCols = 10;
    this.enemyWidth = 40;
    this.enemyHeight = 30;
    this.enemyPadding = 10;
    this.enemyOffsetTop = 50;
    this.enemyOffsetLeft = 50;
    this.enemyDirection = 1;
    this.enemySpeed = 1;
    this.enemyDropSpeed = 20;

    // Game state
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.gameOver = false;
    this.paused = false;
    this.lastShot = 0;
    this.shootCooldown = 300;

    // Input
    this.keys = {};

    // Scores
    this.scores = { best: 0, games: 0 };
    this.storageKey = 'nexus_space_invaders_scores';

    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp = this._onKeyUp.bind(this);
    this._loadScores();
  }

  render() {
    this._buildDOM();
    this._setupCanvas();
    this._bindEvents();
    this._initGame();
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

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'si-wrapper';
    this.wrapper.innerHTML = `
      <div class="si-container">
        <h1 class="si-title">SPACE INVADERS</h1>
        <div class="si-hud">
          <div class="si-stat">SCORE: <span id="si-score">0</span></div>
          <div class="si-stat">WAVE: <span id="si-wave">1</span></div>
          <div class="si-stat">LIVES: <span id="si-lives">3</span></div>
          <div class="si-stat">BEST: <span id="si-best">${this.scores.best}</span></div>
        </div>
        <canvas id="si-canvas" width="600" height="500"></canvas>
        <div class="si-message" id="si-message">PRESS SPACE TO START</div>
        <button class="si-btn" id="si-restart">RESTART</button>
      </div>
    `;
    this.container.appendChild(this.wrapper);
    document.getElementById('si-restart').addEventListener('click', () => this._initGame());
  }

  _setupCanvas() {
    this.canvas = document.getElementById('si-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  _bindEvents() {
    document.addEventListener('keydown', this._boundKeyDown);
    document.addEventListener('keyup', this._boundKeyUp);
  }

  _onKeyDown(e) {
    this.keys[e.key] = true;
    if (e.key === ' ' && !this.running && !this.gameOver) {
      this.running = true;
      this._gameLoop();
    }
    if (e.key === 'p' || e.key === 'P') {
      this.paused = !this.paused;
    }
  }

  _onKeyUp(e) {
    this.keys[e.key] = false;
  }

  _initGame() {
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.gameOver = false;
    this.paused = false;
    this.running = false;
    this.playerBullets = [];
    this.enemyBullets = [];
    this._initEnemies();
    this._render();
    this._showMessage('PRESS SPACE TO START');
    this._updateHUD();
  }

  _initEnemies() {
    this.enemies = [];
    const colors = ['#ff003c', '#ff4488', '#ff66aa', '#ff88cc', '#ffaadd'];
    for (let r = 0; r < this.enemyRows; r++) {
      for (let c = 0; c < this.enemyCols; c++) {
        this.enemies.push({
          x: c * (this.enemyWidth + this.enemyPadding) + this.enemyOffsetLeft,
          y: r * (this.enemyHeight + this.enemyPadding) + this.enemyOffsetTop,
          width: this.enemyWidth,
          height: this.enemyHeight,
          color: colors[r],
          alive: true,
          points: (this.enemyRows - r) * 10
        });
      }
    }
  }

  _gameLoop() {
    if (this.destroyed || !this.running) return;
    this.animFrameId = requestAnimationFrame(() => this._gameLoop());
    if (this.paused) {
      this._render();
      this._drawPause();
      return;
    }
    this._update();
    this._render();
  }

  _update() {
    // Player movement
    if ((this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) && this.player.x > 0) {
      this.player.x -= this.player.speed;
    }
    if ((this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) && this.player.x < this.width - this.player.width) {
      this.player.x += this.player.speed;
    }

    // Shooting
    if (this.keys[' '] && Date.now() - this.lastShot > this.shootCooldown) {
      this.playerBullets.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y,
        width: 3,
        height: 15
      });
      this.lastShot = Date.now();
    }

    // Update player bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      this.playerBullets[i].y -= this.bulletSpeed;
      if (this.playerBullets[i].y < 0) {
        this.playerBullets.splice(i, 1);
      }
    }

    // Update enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      this.enemyBullets[i].y += this.enemyBulletSpeed;
      if (this.enemyBullets[i].y > this.height) {
        this.enemyBullets.splice(i, 1);
      }
    }

    // Enemy movement
    let shouldDrop = false;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.x += this.enemySpeed * this.enemyDirection;
      if (enemy.x + enemy.width > this.width || enemy.x < 0) {
        shouldDrop = true;
      }
    }

    if (shouldDrop) {
      this.enemyDirection = -this.enemyDirection;
      for (const enemy of this.enemies) {
        if (enemy.alive) {
          enemy.y += this.enemyDropSpeed;
        }
      }
    }

    // Enemy shooting
    const aliveEnemies = this.enemies.filter(e => e.alive);
    if (aliveEnemies.length > 0 && Math.random() < 0.02) {
      const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      this.enemyBullets.push({
        x: shooter.x + shooter.width / 2,
        y: shooter.y + shooter.height,
        width: 3,
        height: 15
      });
    }

    // Collision: player bullets vs enemies
    for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
      const bullet = this.playerBullets[bi];
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (bullet.x > enemy.x && bullet.x < enemy.x + enemy.width &&
            bullet.y > enemy.y && bullet.y < enemy.y + enemy.height) {
          enemy.alive = false;
          this.playerBullets.splice(bi, 1);
          this.score += enemy.points;
          this._updateHUD();
          break;
        }
      }
    }

    // Collision: enemy bullets vs player
    for (let bi = this.enemyBullets.length - 1; bi >= 0; bi--) {
      const bullet = this.enemyBullets[bi];
      if (bullet.x > this.player.x && bullet.x < this.player.x + this.player.width &&
          bullet.y > this.player.y && bullet.y < this.player.y + this.player.height) {
        this.enemyBullets.splice(bi, 1);
        this.lives--;
        this._updateHUD();
        if (this.lives <= 0) {
          this.gameOver = true;
          this.running = false;
          this.scores.games++;
          this.scores.best = Math.max(this.scores.best, this.score);
          this._saveScores();
          this._showMessage('GAME OVER! PRESS RESTART');
        }
      }
    }

    // Check if enemies reached bottom
    for (const enemy of this.enemies) {
      if (enemy.alive && enemy.y + enemy.height > this.player.y) {
        this.gameOver = true;
        this.running = false;
        this.scores.games++;
        this.scores.best = Math.max(this.scores.best, this.score);
        this._saveScores();
        this._showMessage('INVASION SUCCESSFUL! GAME OVER');
        return;
      }
    }

    // Check win
    if (this.enemies.every(e => !e.alive)) {
      this.wave++;
      this._updateHUD();
      this._initEnemies();
      this.enemySpeed += 0.3;
      this.enemyBulletSpeed += 0.2;
      this.enemyBullets = [];
      this._showMessage(`WAVE ${this.wave}!`);
      setTimeout(() => this._showMessage(''), 2000);
    }
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Background
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, this.width, this.height);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % this.width;
      const y = (i * 53) % this.height;
      ctx.fillRect(x, y, 1, 1);
    }

    // Enemies
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      ctx.shadowBlur = 0;
      // Eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(enemy.x + 10, enemy.y + 10, 5, 5);
      ctx.fillRect(enemy.x + 25, enemy.y + 10, 5, 5);
    }

    // Player
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;
    ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    ctx.beginPath();
    ctx.moveTo(this.player.x + this.player.width / 2, this.player.y - 10);
    ctx.lineTo(this.player.x + 5, this.player.y);
    ctx.lineTo(this.player.x + this.player.width - 5, this.player.y);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Player bullets
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10;
    for (const bullet of this.playerBullets) {
      ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
    }
    ctx.shadowBlur = 0;

    // Enemy bullets
    ctx.fillStyle = '#ff003c';
    ctx.shadowColor = '#ff003c';
    ctx.shadowBlur = 10;
    for (const bullet of this.enemyBullets) {
      ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
    }
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
  }

  _updateHUD() {
    document.getElementById('si-score').textContent = this.score;
    document.getElementById('si-wave').textContent = this.wave;
    document.getElementById('si-lives').textContent = this.lives;
    document.getElementById('si-best').textContent = this.scores.best;
  }

  _showMessage(msg) {
    document.getElementById('si-message').textContent = msg;
  }

  _loadScores() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) this.scores = JSON.parse(saved);
    } catch {}
  }

  _saveScores() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
    } catch {}
  }
}

window.SpaceInvaders = SpaceInvaders;
