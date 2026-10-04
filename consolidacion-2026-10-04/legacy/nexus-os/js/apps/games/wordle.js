/**
 * NEXUS OS — Wordle
 * 5-letter word guessing game with 6 attempts and virtual keyboard.
 */
class Wordle {
  constructor(container) {
    this.container = container;
    this.wordList = [
      'NEON', 'CYBER', 'PIXEL', 'GLASS', 'GHOST', 'FLAME', 'STORM', 'DREAM', 'LIGHT', 'SHADE',
      'CODE', 'DATA', 'BYTE', 'WAVE', 'PULSE', 'SPARK', 'FLASH', 'BLADE', 'STONE', 'STEEL',
      'POWER', 'FORCE', 'SPEED', 'SMART', 'BRAIN', 'LOGIC', 'MAGIC', 'MYSTIC', 'CRYPT', 'NEXUS',
      'ORBIT', 'LASER', 'ROBOT', 'CIRCUIT', 'VIRUS', 'GLITCH', 'MATRIX', 'RADAR', 'SONIC', 'HYPER',
      'ULTRA', 'MEGA', 'GIGA', 'TERA', 'PETA', 'EXA', 'ZETTA', 'YOCTO', 'NANO', 'MICRO'
    ];
    this.targetWord = '';
    this.guesses = [];
    this.currentGuess = '';
    this.maxGuesses = 6;
    this.gameOver = false;
    this.won = false;
    this.scores = { wins: 0, losses: 0, streak: 0, bestStreak: 0 };
    this.storageKey = 'nexus_wordle_scores';
    this._loadScores();
  }

  render() {
    this._buildDOM();
    this._newGame();
  }

  destroy() {
    document.removeEventListener('keydown', this._boundKeyDown);
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'wordle-wrapper';
    this.wrapper.innerHTML = `
      <div class="wordle-container">
        <h1 class="wordle-title">WORDLE</h1>
        <div class="wordle-hud">
          <div class="wordle-stat">WINS: <span id="wordle-wins">${this.scores.wins}</span></div>
          <div class="wordle-stat">STREAK: <span id="wordle-streak">${this.scores.streak}</span></div>
          <div class="wordle-stat">BEST: <span id="wordle-best">${this.scores.bestStreak}</span></div>
        </div>
        <div class="wordle-board" id="wordle-board"></div>
        <div class="wordle-keyboard" id="wordle-keyboard"></div>
        <div class="wordle-message" id="wordle-message"></div>
        <button class="wordle-btn" id="wordle-restart">NEW GAME</button>
      </div>
    `;
    this.container.appendChild(this.wrapper);

    this._boundKeyDown = this._handleKey.bind(this);
    document.addEventListener('keydown', this._boundKeyDown);
    document.getElementById('wordle-restart').addEventListener('click', () => this._newGame());
  }

  _newGame() {
    this.targetWord = this.wordList[Math.floor(Math.random() * this.wordList.length)].toUpperCase();
    this.guesses = [];
    this.currentGuess = '';
    this.gameOver = false;
    this.won = false;
    this._renderBoard();
    this._renderKeyboard();
    this._showMessage('');
  }

  _renderBoard() {
    const board = document.getElementById('wordle-board');
    board.innerHTML = '';
    for (let i = 0; i < this.maxGuesses; i++) {
      const row = document.createElement('div');
      row.className = 'wordle-row';
      for (let j = 0; j < 5; j++) {
        const tile = document.createElement('div');
        tile.className = 'wordle-tile';
        if (i < this.guesses.length) {
          const guess = this.guesses[i];
          tile.textContent = guess.word[j];
          tile.classList.add(guess.result[j]);
        } else if (i === this.guesses.length) {
          tile.textContent = this.currentGuess[j] || '';
          if (this.currentGuess[j]) tile.classList.add('filled');
        }
        row.appendChild(tile);
      }
      board.appendChild(row);
    }
  }

  _renderKeyboard() {
    const keyboard = document.getElementById('wordle-keyboard');
    const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    keyboard.innerHTML = '';
    const letterStatus = {};
    for (const guess of this.guesses) {
      for (let i = 0; i < 5; i++) {
        const letter = guess.word[i];
        const status = guess.result[i];
        if (!letterStatus[letter] || status === 'correct' || (status === 'present' && letterStatus[letter] !== 'correct')) {
          letterStatus[letter] = status;
        }
      }
    }
    rows.forEach((row, idx) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'keyboard-row';
      if (idx === 2) {
        const enter = document.createElement('button');
        enter.className = 'key key-wide';
        enter.textContent = 'ENTER';
        enter.addEventListener('click', () => this._submitGuess());
        rowDiv.appendChild(enter);
      }
      for (const letter of row) {
        const key = document.createElement('button');
        key.className = 'key';
        if (letterStatus[letter]) key.classList.add(letterStatus[letter]);
        key.textContent = letter;
        key.addEventListener('click', () => this._handleKey({ key: letter }));
        rowDiv.appendChild(key);
      }
      if (idx === 2) {
        const backspace = document.createElement('button');
        backspace.className = 'key key-wide';
        backspace.textContent = '⌫';
        backspace.addEventListener('click', () => this._handleKey({ key: 'Backspace' }));
        rowDiv.appendChild(backspace);
      }
      keyboard.appendChild(rowDiv);
    });
  }

  _handleKey(e) {
    if (this.gameOver) return;
    if (e.key === 'Enter') {
      this._submitGuess();
    } else if (e.key === 'Backspace') {
      this.currentGuess = this.currentGuess.slice(0, -1);
      this._renderBoard();
    } else if (/^[a-zA-Z]$/.test(e.key) && this.currentGuess.length < 5) {
      this.currentGuess += e.key.toUpperCase();
      this._renderBoard();
    }
  }

  _submitGuess() {
    if (this.currentGuess.length !== 5) {
      this._showMessage('NOT ENOUGH LETTERS');
      setTimeout(() => this._showMessage(''), 1500);
      return;
    }
    const result = this._checkGuess(this.currentGuess);
    this.guesses.push({ word: this.currentGuess, result });
    if (this.currentGuess === this.targetWord) {
      this.gameOver = true;
      this.won = true;
      this.scores.wins++;
      this.scores.streak++;
      this.scores.bestStreak = Math.max(this.scores.bestStreak, this.scores.streak);
      this._saveScores();
      this._showMessage('EXCELLENT!');
    } else if (this.guesses.length >= this.maxGuesses) {
      this.gameOver = true;
      this.scores.losses++;
      this.scores.streak = 0;
      this._saveScores();
      this._showMessage(`GAME OVER: ${this.targetWord}`);
    }
    this.currentGuess = '';
    this._renderBoard();
    this._renderKeyboard();
    this._updateHUD();
  }

  _checkGuess(guess) {
    const result = ['absent', 'absent', 'absent', 'absent', 'absent'];
    const targetArr = this.targetWord.split('');
    const guessArr = guess.split('');
    for (let i = 0; i < 5; i++) {
      if (guessArr[i] === targetArr[i]) {
        result[i] = 'correct';
        targetArr[i] = null;
        guessArr[i] = null;
      }
    }
    for (let i = 0; i < 5; i++) {
      if (guessArr[i] && targetArr.includes(guessArr[i])) {
        result[i] = 'present';
        targetArr[targetArr.indexOf(guessArr[i])] = null;
      }
    }
    return result;
  }

  _updateHUD() {
    document.getElementById('wordle-wins').textContent = this.scores.wins;
    document.getElementById('wordle-streak').textContent = this.scores.streak;
    document.getElementById('wordle-best').textContent = this.scores.bestStreak;
  }

  _showMessage(msg) {
    document.getElementById('wordle-message').textContent = msg;
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

window.Wordle = Wordle;
