/**
 * NEXUS OS — Simon Says
 * Memory sequence game with increasing difficulty.
 */
class SimonSays {
  constructor(container) {
    this.container = container;
    this.sequence = [];
    this.playerSequence = [];
    this.level = 0;
    this.isPlaying = false;
    this.isShowingSequence = false;
    this.gameOver = false;
    this.colors = ['red', 'green', 'blue', 'yellow'];
    this.scores = { best: 0, games: 0 };
    this.storageKey = 'nexus_simon_scores';
    this._loadScores();
  }

  render() {
    this._buildDOM();
    this._showStartScreen();
  }

  destroy() {
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'simon-wrapper';
    this.wrapper.innerHTML = `
      <div class="simon-container">
        <h1 class="simon-title">SIMON SAYS</h1>
        <div class="simon-hud">
          <div class="simon-stat">BEST: <span id="simon-best">${this.scores.best}</span></div>
          <div class="simon-stat">LEVEL: <span id="simon-level">0</span></div>
          <div class="simon-stat">GAMES: <span id="simon-games">${this.scores.games}</span></div>
        </div>
        <div class="simon-board" id="simon-board">
          <div class="simon-pad" data-color="red" id="simon-red"></div>
          <div class="simon-pad" data-color="green" id="simon-green"></div>
          <div class="simon-pad" data-color="blue" id="simon-blue"></div>
          <div class="simon-pad" data-color="yellow" id="simon-yellow"></div>
        </div>
        <div class="simon-message" id="simon-message">PRESS START TO PLAY</div>
        <button class="simon-btn" id="simon-start">START</button>
      </div>
    `;
    this.container.appendChild(this.wrapper);
    document.getElementById('simon-start').addEventListener('click', () => this._startGame());
    this.colors.forEach(color => {
      document.getElementById(`simon-${color}`).addEventListener('click', () => this._handlePadClick(color));
    });
  }

  _showStartScreen() {
    this._showMessage('PRESS START TO PLAY');
  }

  _startGame() {
    this.sequence = [];
    this.playerSequence = [];
    this.level = 0;
    this.gameOver = false;
    this.isPlaying = true;
    this._nextLevel();
  }

  _nextLevel() {
    this.level++;
    this.playerSequence = [];
    this.sequence.push(this.colors[Math.floor(Math.random() * this.colors.length)]);
    document.getElementById('simon-level').textContent = this.level;
    this._showMessage(`LEVEL ${this.level} — WATCH CAREFULLY`);
    setTimeout(() => this._showSequence(), 1000);
  }

  _showSequence() {
    this.isShowingSequence = true;
    let i = 0;
    const interval = setInterval(() => {
      if (i >= this.sequence.length) {
        clearInterval(interval);
        this.isShowingSequence = false;
        this._showMessage('YOUR TURN — REPEAT THE SEQUENCE');
        return;
      }
      this._flashPad(this.sequence[i]);
      i++;
    }, 600);
  }

  _flashPad(color) {
    const pad = document.getElementById(`simon-${color}`);
    pad.classList.add('active');
    setTimeout(() => pad.classList.remove('active'), 400);
  }

  _handlePadClick(color) {
    if (!this.isPlaying || this.isShowingSequence || this.gameOver) return;
    this._flashPad(color);
    this.playerSequence.push(color);
    const idx = this.playerSequence.length - 1;
    if (this.playerSequence[idx] !== this.sequence[idx]) {
      this._endGame();
      return;
    }
    if (this.playerSequence.length === this.sequence.length) {
      this._showMessage('CORRECT! NEXT LEVEL...');
      setTimeout(() => this._nextLevel(), 1500);
    }
  }

  _endGame() {
    this.gameOver = true;
    this.isPlaying = false;
    this.scores.games++;
    this.scores.best = Math.max(this.scores.best, this.level);
    this._saveScores();
    this._showMessage(`GAME OVER! YOU REACHED LEVEL ${this.level}`);
    document.getElementById('simon-best').textContent = this.scores.best;
    document.getElementById('simon-games').textContent = this.scores.games;
  }

  _showMessage(msg) {
    document.getElementById('simon-message').textContent = msg;
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

window.SimonSays = SimonSays;
