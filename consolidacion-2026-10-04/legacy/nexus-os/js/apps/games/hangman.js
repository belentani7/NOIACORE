/**
 * NEXUS OS — Hangman
 * Classic hangman with word categories and neon aesthetic.
 */
class Hangman {
  constructor(container) {
    this.container = container;
    this.wordCategories = {
      'TECHNOLOGY': ['COMPUTER', 'ALGORITHM', 'DATABASE', 'NETWORK', 'SOFTWARE', 'HARDWARE', 'PROGRAMMING', 'INTERNET', 'CYBERSECURITY', 'ARTIFICIAL'],
      'SCIENCE': ['QUANTUM', 'MOLECULE', 'PHOTON', 'NEUTRON', 'ELECTRON', 'GRAVITY', 'EVOLUTION', 'GENETICS', 'ASTRONOMY', 'CHEMISTRY'],
      'GAMING': ['NINTENDO', 'PLAYSTATION', 'XBOX', 'KEYBOARD', 'GRAPHICS', 'MULTIPLAYER', 'CHECKPOINT', 'ACHIEVEMENT', 'DOWNLOAD', 'STREAMING'],
      'MOVIES': ['INCEPTION', 'AVATAR', 'MATRIX', 'TITANIC', 'GLADIATOR', 'PREDATOR', 'TERMINATOR', 'INTERSTELLAR', 'BLADERUNNER', 'GODFATHER'],
      'MUSIC': ['SYMPHONY', 'RHYTHM', 'MELODY', 'HARMONY', 'CONCERT', 'ORCHESTRA', 'GUITAR', 'DRUMS', 'PIANO', 'VOCALS']
    };
    this.word = '';
    this.category = '';
    this.guessedLetters = [];
    this.wrongGuesses = 0;
    this.maxWrong = 6;
    this.gameOver = false;
    this.won = false;
    this.scores = { wins: 0, losses: 0 };
    this.storageKey = 'nexus_hangman_scores';
    this._loadScores();
  }

  render() {
    this._buildDOM();
    this._newGame();
  }

  destroy() {
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'hangman-wrapper';
    this.wrapper.innerHTML = `
      <div class="hangman-container">
        <h1 class="hangman-title">HANGMAN</h1>
        <div class="hangman-hud">
          <div class="hangman-stat">WINS: <span id="hangman-wins">${this.scores.wins}</span></div>
          <div class="hangman-stat">LOSSES: <span id="hangman-losses">${this.scores.losses}</span></div>
        </div>
        <div class="hangman-category" id="hangman-category"></div>
        <div class="hangman-display">
          <canvas id="hangman-canvas" width="200" height="250"></canvas>
          <div class="hangman-wrong" id="hangman-wrong"></div>
        </div>
        <div class="hangman-word" id="hangman-word"></div>
        <div class="hangman-keyboard" id="hangman-keyboard"></div>
        <div class="hangman-message" id="hangman-message"></div>
        <button class="hangman-btn" id="hangman-restart">NEW GAME</button>
      </div>
    `;
    this.container.appendChild(this.wrapper);
    document.getElementById('hangman-restart').addEventListener('click', () => this._newGame());
  }

  _newGame() {
    const categories = Object.keys(this.wordCategories);
    this.category = categories[Math.floor(Math.random() * categories.length)];
    const words = this.wordCategories[this.category];
    this.word = words[Math.floor(Math.random() * words.length)].toUpperCase();
    this.guessedLetters = [];
    this.wrongGuesses = 0;
    this.gameOver = false;
    this.won = false;
    this._render();
  }

  _render() {
    document.getElementById('hangman-category').textContent = `CATEGORY: ${this.category}`;
    document.getElementById('hangman-wrong').textContent = `WRONG: ${this.wrongGuesses}/${this.maxWrong}`;
    const wordDisplay = this.word.split('').map(l => this.guessedLetters.includes(l) ? l : '_').join(' ');
    document.getElementById('hangman-word').textContent = wordDisplay;
    this._drawHangman();
    this._renderKeyboard();
    this._updateHUD();
  }

  _drawHangman() {
    const canvas = document.getElementById('hangman-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ff003c';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff003c';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(20, 240); ctx.lineTo(180, 240);
    ctx.moveTo(60, 240); ctx.lineTo(60, 20);
    ctx.moveTo(60, 20); ctx.lineTo(140, 20);
    ctx.moveTo(140, 20); ctx.lineTo(140, 50);
    ctx.stroke();
    if (this.wrongGuesses > 0) {
      ctx.beginPath(); ctx.arc(140, 70, 20, 0, Math.PI * 2); ctx.stroke();
    }
    if (this.wrongGuesses > 1) {
      ctx.beginPath(); ctx.moveTo(140, 90); ctx.lineTo(140, 150); ctx.stroke();
    }
    if (this.wrongGuesses > 2) {
      ctx.beginPath(); ctx.moveTo(140, 110); ctx.lineTo(110, 130); ctx.stroke();
    }
    if (this.wrongGuesses > 3) {
      ctx.beginPath(); ctx.moveTo(140, 110); ctx.lineTo(170, 130); ctx.stroke();
    }
    if (this.wrongGuesses > 4) {
      ctx.beginPath(); ctx.moveTo(140, 150); ctx.lineTo(110, 180); ctx.stroke();
    }
    if (this.wrongGuesses > 5) {
      ctx.beginPath(); ctx.moveTo(140, 150); ctx.lineTo(170, 180); ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  _renderKeyboard() {
    const keyboard = document.getElementById('hangman-keyboard');
    keyboard.innerHTML = '';
    for (let i = 65; i <= 90; i++) {
      const letter = String.fromCharCode(i);
      const btn = document.createElement('button');
      btn.className = 'hangman-key';
      btn.textContent = letter;
      btn.disabled = this.guessedLetters.includes(letter);
      if (this.guessedLetters.includes(letter)) {
        btn.classList.add(this.word.includes(letter) ? 'correct' : 'wrong');
      }
      btn.addEventListener('click', () => this._guess(letter));
      keyboard.appendChild(btn);
    }
  }

  _guess(letter) {
    if (this.gameOver || this.guessedLetters.includes(letter)) return;
    this.guessedLetters.push(letter);
    if (!this.word.includes(letter)) {
      this.wrongGuesses++;
      if (this.wrongGuesses >= this.maxWrong) {
        this.gameOver = true;
        this.scores.losses++;
        this._saveScores();
        this._showMessage(`GAME OVER! WORD: ${this.word}`);
      }
    } else {
      const allGuessed = this.word.split('').every(l => this.guessedLetters.includes(l));
      if (allGuessed) {
        this.gameOver = true;
        this.won = true;
        this.scores.wins++;
        this._saveScores();
        this._showMessage('YOU WON!');
      }
    }
    this._render();
  }

  _updateHUD() {
    document.getElementById('hangman-wins').textContent = this.scores.wins;
    document.getElementById('hangman-losses').textContent = this.scores.losses;
  }

  _showMessage(msg) {
    document.getElementById('hangman-message').textContent = msg;
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

window.Hangman = Hangman;
