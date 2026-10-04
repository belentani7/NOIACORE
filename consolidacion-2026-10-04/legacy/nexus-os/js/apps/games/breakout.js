/**
 * NEXUS OS — Breakout
 * Classic brick breaker with paddle, ball physics, and neon bricks.
 */
class Breakout {
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

    // Paddle
    this.paddle = { x: 250, y: 470, width: 100, height: 12, speed: 8 };

    // Ball
    this.ball = { x: 300, y: 400, dx: 4, dy: -4, radius: 8, speed: 5 };

    // Bricks
    this.brickRows = 5;
    this.brickCols = 10;
    this.brickWidth = 54;
    this.brickHeight = 20;
    this.brickPadding = 4;
    this.brickOffsetTop = 50;
    this.brickOffsetLeft = 30;
    this.bricks = [];

    // Game state
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.won = false;
    this.paused = false;

    // Input
    this.keys = {};

    // Scores
    this.scores = { best: 0, games: 0 };
    this.storageKey = 'nexus_breakout_scores';

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
    this.wrapper.className = 'breakout-wrapper';
    this.wrapper.innerHTML = `
      <div class="breakout-container">
        <h1 class="breakout-title">BREAKOUT</h1>
        <div class="breakout-hud">
          <div class="breakout-stat">SCORE: <span id="breakout-score">0</span></div>
          <div class="breakout-stat">LIVES: <span id="breakout-lives">3</span></div>
          <div class="breakout-stat">BEST: <span id="breakout-best">${this.scores.best}</span></div>
        </div>
        <canvas id="breakout-canvas" width="600" height="500"></canvas>
        <div class="breakout-message" id="breakout-message">PRESS SPACE TO START</div>
        <button class="breakout-btn" id="breakout-restart">RESTART</button>
      </div>
    `;
    this.container.appendChild(this.wrapper);
    document.getElementById('breakout-restart').addEventListener('click', () => this._initGame());
  }

  _setupCanvas() {
    this.canvas = document.getElementById('breakout-canvas');
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
    this.level = 1;
    this.gameOver = false;
    this.won = false;
    this.paused = false;
    this.running = false;
    this._initBricks();
    this._resetBall();
    this._render();
    this._showMessage('PRESS SPACE TO START');
    this._updateHUD();
  }

  _initBricks() {
    this.bricks = [];
    const colors = ['#ff003c', '#ff4488', '#ff66aa', '#ff88cc', '#ffaadd'];
    for (let r = 0; r < this.brickRows; r++) {
      for (let c = 0; c < this.brickCols; c++) {
        this.bricks.push({
          x: c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft,
          y: r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop,
          width: this.brickWidth,
          height: this.brickHeight,
          color: colors[r],
          alive: true
        });
      }
    }
  }

  _resetBall() {
    this.ball.x = this.width / 2;
    this.ball.y = this.height - 50;
    this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 4;
    this.ball.dy = -4;
    this.paddle.x = (this.width - this.paddle.width) / 2;
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
    // Paddle movement
    if ((this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) && this.paddle.x > 0) {
      this.paddle.x -= this.paddle.speed;
    }
    if ((this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) && this.paddle.x < this.width - this.paddle.width) {
      this.paddle.x += this.paddle.speed;
    }

    // Ball movement
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Wall collision
    if (this.ball.x + this.ball.radius > this.width || this.ball.x - this.ball.radius < 0) {
      this.ball.dx = -this.ball.dx;
    }
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.dy = -this.ball.dy;
    }

    // Paddle collision
    if (this.ball.y + this.ball.radius > this.paddle.y &&
        this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height &&
        this.ball.x > this.paddle.x &&
        this.ball.x < this.paddle.x + this.paddle.width) {
      this.ball.dy = -Math.abs(this.ball.dy);
      const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
      this.ball.dx = 8 * (hitPos - 0.5);
    }

    // Brick collision
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (this.ball.x + this.ball.radius > brick.x &&
          this.ball.x - this.ball.radius < brick.x + brick.width &&
          this.ball.y + this.ball.radius > brick.y &&
          this.ball.y - this.ball.radius < brick.y + brick.height) {
        brick.alive = false;
        this.ball.dy = -this.ball.dy;
        this.score += 10;
        this._updateHUD();
      }
    }

    // Check win
    if (this.bricks.every(b => !b.alive)) {
      this.gameOver = true;
      this.won = true;
      this.running = false;
      this.scores.games++;
      this.scores.best = Math.max(this.scores.best, this.score);
      this._saveScores();
      this._showMessage('YOU WIN! ALL BRICKS DESTROYED!');
    }

    // Ball out of bounds
    if (this.ball.y + this.ball.radius > this.height) {
      this.lives--;
      this._updateHUD();
      if (this.lives <= 0) {
        this.gameOver = true;
        this.running = false;
        this.scores.games++;
        this.scores.best = Math.max(this.scores.best, this.score);
        this._saveScores();
        this._showMessage('GAME OVER! PRESS RESTART');
      } else {
        this._resetBall();
        this.running = false;
        this._showMessage('PRESS SPACE TO CONTINUE');
      }
    }
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Background
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, this.width, this.height);

    // Bricks
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      ctx.fillStyle = brick.color;
      ctx.shadowColor = brick.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
    }

    // Paddle
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;
    ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    ctx.shadowBlur = 0;

    // Ball
    ctx.fillStyle = '#ff003c';
    ctx.shadowColor = '#ff003c';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    ctx.fill();
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
    document.getElementById('breakout-score').textContent = this.score;
    document.getElementById('breakout-lives').textContent = this.lives;
    document.getElementById('breakout-best').textContent = this.scores.best;
  }

  _showMessage(msg) {
    document.getElementById('breakout-message').textContent = msg;
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

window.Breakout = Breakout;
