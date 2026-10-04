/**
 * NEXUS OS — Tic-Tac-Toe
 * Classic game with unbeatable AI using minimax algorithm.
 */
class TicTacToe {
  constructor(container) {
    this.container = container;
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.aiPlayer = 'O';
    this.gameOver = false;
    this.winner = null;
    this.scores = { wins: 0, losses: 0, draws: 0 };
    this.storageKey = 'nexus_tictactoe_scores';
    this._loadScores();
  }

  render() {
    this._buildDOM();
    this._renderBoard();
  }

  destroy() {
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'ttt-wrapper';
    this.wrapper.innerHTML = `
      <div class="ttt-container">
        <h1 class="ttt-title">TIC-TAC-TOE</h1>
        <div class="ttt-hud">
          <div class="ttt-stat">WINS: <span id="ttt-wins">${this.scores.wins}</span></div>
          <div class="ttt-stat">DRAWS: <span id="ttt-draws">${this.scores.draws}</span></div>
          <div class="ttt-stat">LOSSES: <span id="ttt-losses">${this.scores.losses}</span></div>
        </div>
        <div class="ttt-turn" id="ttt-turn">YOUR TURN (X)</div>
        <div class="ttt-board" id="ttt-board"></div>
        <div class="ttt-message" id="ttt-message"></div>
        <button class="ttt-btn" id="ttt-restart">NEW GAME</button>
      </div>
    `;
    this.container.appendChild(this.wrapper);
    document.getElementById('ttt-restart').addEventListener('click', () => this._newGame());
  }

  _newGame() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.gameOver = false;
    this.winner = null;
    this._renderBoard();
    this._showMessage('');
    document.getElementById('ttt-turn').textContent = 'YOUR TURN (X)';
  }

  _renderBoard() {
    const boardEl = document.getElementById('ttt-board');
    boardEl.innerHTML = '';
    this.board.forEach((cell, idx) => {
      const square = document.createElement('div');
      square.className = 'ttt-square';
      if (cell) {
        square.textContent = cell;
        square.classList.add(cell === 'X' ? 'player-x' : 'player-o');
      }
      square.addEventListener('click', () => this._handleClick(idx));
      boardEl.appendChild(square);
    });
    this._updateHUD();
  }

  _handleClick(idx) {
    if (this.gameOver || this.board[idx] || this.currentPlayer !== 'X') return;
    this.board[idx] = 'X';
    this._renderBoard();
    if (this._checkWinner()) return;
    this.currentPlayer = 'O';
    document.getElementById('ttt-turn').textContent = 'AI THINKING...';
    setTimeout(() => this._aiMove(), 500);
  }

  _aiMove() {
    const bestMove = this._minimax(this.board, this.aiPlayer);
    this.board[bestMove.index] = this.aiPlayer;
    this._renderBoard();
    if (this._checkWinner()) return;
    this.currentPlayer = 'X';
    document.getElementById('ttt-turn').textContent = 'YOUR TURN (X)';
  }

  _checkWinner() {
    const winPatterns = [
      [0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]
    ];
    for (const pattern of winPatterns) {
      const [a,b,c] = pattern;
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        this.gameOver = true;
        this.winner = this.board[a];
        if (this.winner === 'X') {
          this.scores.wins++;
          this._showMessage('YOU WIN!');
        } else {
          this.scores.losses++;
          this._showMessage('AI WINS!');
        }
        this._saveScores();
        this._updateHUD();
        return true;
      }
    }
    if (!this.board.includes(null)) {
      this.gameOver = true;
      this.scores.draws++;
      this._showMessage('DRAW!');
      this._saveScores();
      this._updateHUD();
      return true;
    }
    return false;
  }

  _minimax(board, player) {
    const available = board.map((v,i) => v === null ? i : null).filter(v => v !== null);
    if (this._checkWinnerForBoard(board, 'X')) return { score: -10 };
    if (this._checkWinnerForBoard(board, 'O')) return { score: 10 };
    if (available.length === 0) return { score: 0 };
    const moves = [];
    for (const idx of available) {
      const move = { index: idx };
      board[idx] = player;
      const result = this._minimax(board, player === 'O' ? 'X' : 'O');
      move.score = result.score;
      board[idx] = null;
      moves.push(move);
    }
    let bestMove;
    if (player === 'O') {
      let bestScore = -Infinity;
      for (const move of moves) {
        if (move.score > bestScore) {
          bestScore = move.score;
          bestMove = move;
        }
      }
    } else {
      let bestScore = Infinity;
      for (const move of moves) {
        if (move.score < bestScore) {
          bestScore = move.score;
          bestMove = move;
        }
      }
    }
    return bestMove;
  }

  _checkWinnerForBoard(board, player) {
    const winPatterns = [
      [0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]
    ];
    return winPatterns.some(pattern => {
      const [a,b,c] = pattern;
      return board[a] === player && board[b] === player && board[c] === player;
    });
  }

  _updateHUD() {
    document.getElementById('ttt-wins').textContent = this.scores.wins;
    document.getElementById('ttt-draws').textContent = this.scores.draws;
    document.getElementById('ttt-losses').textContent = this.scores.losses;
  }

  _showMessage(msg) {
    document.getElementById('ttt-message').textContent = msg;
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

window.TicTacToe = TicTacToe;
