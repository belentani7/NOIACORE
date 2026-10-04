/**
 * NEXUS OS — Connect Four
 * Drop discs with gravity physics, AI opponent with heuristic evaluation.
 */
class ConnectFour {
  constructor(container) {
    this.container = container;
    this.rows = 6;
    this.cols = 7;
    this.board = [];
    this.currentPlayer = 1;
    this.aiPlayer = 2;
    this.gameOver = false;
    this.winner = null;
    this.scores = { wins: 0, losses: 0, draws: 0 };
    this.storageKey = 'nexus_connect4_scores';
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
    this.wrapper.className = 'c4-wrapper';
    this.wrapper.innerHTML = `
      <div class="c4-container">
        <h1 class="c4-title">CONNECT FOUR</h1>
        <div class="c4-hud">
          <div class="c4-stat">WINS: <span id="c4-wins">${this.scores.wins}</span></div>
          <div class="c4-stat">DRAWS: <span id="c4-draws">${this.scores.draws}</span></div>
          <div class="c4-stat">LOSSES: <span id="c4-losses">${this.scores.losses}</span></div>
        </div>
        <div class="c4-turn" id="c4-turn">YOUR TURN</div>
        <div class="c4-board" id="c4-board"></div>
        <div class="c4-message" id="c4-message"></div>
        <button class="c4-btn" id="c4-restart">NEW GAME</button>
      </div>
    `;
    this.container.appendChild(this.wrapper);
    document.getElementById('c4-restart').addEventListener('click', () => this._newGame());
  }

  _newGame() {
    this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.currentPlayer = 1;
    this.gameOver = false;
    this.winner = null;
    this._renderBoard();
    this._showMessage('');
    document.getElementById('c4-turn').textContent = 'YOUR TURN';
  }

  _renderBoard() {
    const boardEl = document.getElementById('c4-board');
    boardEl.innerHTML = '';
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'c4-cell';
        const val = this.board[r][c];
        if (val === 1) cell.classList.add('player1');
        else if (val === 2) cell.classList.add('player2');
        cell.addEventListener('click', () => this._dropDisc(c));
        boardEl.appendChild(cell);
      }
    }
    this._updateHUD();
  }

  _dropDisc(col) {
    if (this.gameOver || this.currentPlayer !== 1) return;
    const row = this._getLowestEmptyRow(col);
    if (row === -1) return;
    this.board[row][col] = 1;
    this._renderBoard();
    if (this._checkWinner(1)) {
      this.gameOver = true;
      this.winner = 1;
      this.scores.wins++;
      this._saveScores();
      this._showMessage('YOU WIN!');
      return;
    }
    if (this._isBoardFull()) {
      this.gameOver = true;
      this.scores.draws++;
      this._saveScores();
      this._showMessage('DRAW!');
      return;
    }
    this.currentPlayer = 2;
    document.getElementById('c4-turn').textContent = 'AI THINKING...';
    setTimeout(() => this._aiMove(), 600);
  }

  _getLowestEmptyRow(col) {
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.board[r][col] === 0) return r;
    }
    return -1;
  }

  _aiMove() {
    const bestCol = this._findBestMove();
    const row = this._getLowestEmptyRow(bestCol);
    this.board[row][bestCol] = 2;
    this._renderBoard();
    if (this._checkWinner(2)) {
      this.gameOver = true;
      this.winner = 2;
      this.scores.losses++;
      this._saveScores();
      this._showMessage('AI WINS!');
      return;
    }
    if (this._isBoardFull()) {
      this.gameOver = true;
      this.scores.draws++;
      this._saveScores();
      this._showMessage('DRAW!');
      return;
    }
    this.currentPlayer = 1;
    document.getElementById('c4-turn').textContent = 'YOUR TURN';
  }

  _findBestMove() {
    // Check for winning move
    for (let c = 0; c < this.cols; c++) {
      const row = this._getLowestEmptyRow(c);
      if (row !== -1) {
        this.board[row][c] = 2;
        if (this._checkWinner(2)) { this.board[row][c] = 0; return c; }
        this.board[row][c] = 0;
      }
    }
    // Block player winning move
    for (let c = 0; c < this.cols; c++) {
      const row = this._getLowestEmptyRow(c);
      if (row !== -1) {
        this.board[row][c] = 1;
        if (this._checkWinner(1)) { this.board[row][c] = 0; return c; }
        this.board[row][c] = 0;
      }
    }
    // Prefer center, then random
    const center = Math.floor(this.cols / 2);
    if (this._getLowestEmptyRow(center) !== -1) return center;
    const valid = [];
    for (let c = 0; c < this.cols; c++) {
      if (this._getLowestEmptyRow(c) !== -1) valid.push(c);
    }
    return valid[Math.floor(Math.random() * valid.length)];
  }

  _checkWinner(player) {
    // Horizontal
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c <= this.cols - 4; c++) {
        if (this.board[r][c] === player && this.board[r][c+1] === player &&
            this.board[r][c+2] === player && this.board[r][c+3] === player) return true;
      }
    }
    // Vertical
    for (let r = 0; r <= this.rows - 4; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c] === player && this.board[r+1][c] === player &&
            this.board[r+2][c] === player && this.board[r+3][c] === player) return true;
      }
    }
    // Diagonal
    for (let r = 0; r <= this.rows - 4; r++) {
      for (let c = 0; c <= this.cols - 4; c++) {
        if (this.board[r][c] === player && this.board[r+1][c+1] === player &&
            this.board[r+2][c+2] === player && this.board[r+3][c+3] === player) return true;
      }
    }
    for (let r = 0; r <= this.rows - 4; r++) {
      for (let c = 3; c < this.cols; c++) {
        if (this.board[r][c] === player && this.board[r+1][c-1] === player &&
            this.board[r+2][c-2] === player && this.board[r+3][c-3] === player) return true;
      }
    }
    return false;
  }

  _isBoardFull() {
    return this.board[0].every(cell => cell !== 0);
  }

  _updateHUD() {
    document.getElementById('c4-wins').textContent = this.scores.wins;
    document.getElementById('c4-draws').textContent = this.scores.draws;
    document.getElementById('c4-losses').textContent = this.scores.losses;
  }

  _showMessage(msg) {
    document.getElementById('c4-message').textContent = msg;
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

window.ConnectFour = ConnectFour;
