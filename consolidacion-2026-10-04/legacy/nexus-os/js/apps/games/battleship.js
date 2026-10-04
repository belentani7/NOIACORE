/**
 * NEXUS OS — Battleship
 * Player vs AI ship placement and guessing game.
 */
class Battleship {
  constructor(container) {
    this.container = container;
    this.size = 10;
    this.ships = [5, 4, 3, 3, 2];
    this.playerBoard = [];
    this.aiBoard = [];
    this.playerShots = [];
    this.aiShots = [];
    this.gamePhase = 'placement';
    this.currentShipIdx = 0;
    this.isHorizontal = true;
    this.gameOver = false;
    this.scores = { wins: 0, losses: 0 };
    this.storageKey = 'nexus_battleship_scores';
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
    this.wrapper.className = 'bs-wrapper';
    this.wrapper.innerHTML = `
      <div class="bs-container">
        <h1 class="bs-title">BATTLESHIP</h1>
        <div class="bs-hud">
          <div class="bs-stat">WINS: <span id="bs-wins">${this.scores.wins}</span></div>
          <div class="bs-stat">LOSSES: <span id="bs-losses">${this.scores.losses}</span></div>
        </div>
        <div class="bs-message" id="bs-message">PLACE YOUR SHIPS</div>
        <div class="bs-boards">
          <div class="bs-board-section">
            <div class="bs-board-label">YOUR FLEET</div>
            <div class="bs-board" id="bs-player-board"></div>
          </div>
          <div class="bs-board-section">
            <div class="bs-board-label">ENEMY WATERS</div>
            <div class="bs-board" id="bs-ai-board"></div>
          </div>
        </div>
        <div class="bs-controls">
          <button class="bs-btn" id="bs-rotate">ROTATE [R]</button>
          <button class="bs-btn" id="bs-restart">NEW GAME</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.wrapper);
    document.getElementById('bs-rotate').addEventListener('click', () => this._toggleOrientation());
    document.getElementById('bs-restart').addEventListener('click', () => this._newGame());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') this._toggleOrientation();
    });
  }

  _newGame() {
    this.playerBoard = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.aiBoard = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.playerShots = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.aiShots = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.gamePhase = 'placement';
    this.currentShipIdx = 0;
    this.isHorizontal = true;
    this.gameOver = false;
    this._placeAIShips();
    this._renderBoards();
    this._showMessage(`PLACE CARRIER (${this.ships[0]} cells) - Press R to rotate`);
  }

  _placeAIShips() {
    for (const shipSize of this.ships) {
      let placed = false;
      while (!placed) {
        const horizontal = Math.random() > 0.5;
        const row = Math.floor(Math.random() * this.size);
        const col = Math.floor(Math.random() * this.size);
        if (this._canPlace(this.aiBoard, row, col, shipSize, horizontal)) {
          this._placeShip(this.aiBoard, row, col, shipSize, horizontal);
          placed = true;
        }
      }
    }
  }

  _canPlace(board, row, col, size, horizontal) {
    for (let i = 0; i < size; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      if (r >= this.size || c >= this.size || board[r][c] !== 0) return false;
    }
    return true;
  }

  _placeShip(board, row, col, size, horizontal) {
    for (let i = 0; i < size; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      board[r][c] = 1;
    }
  }

  _toggleOrientation() {
    this.isHorizontal = !this.isHorizontal;
    this._renderBoards();
  }

  _renderBoards() {
    const playerBoardEl = document.getElementById('bs-player-board');
    const aiBoardEl = document.getElementById('bs-ai-board');
    playerBoardEl.innerHTML = '';
    aiBoardEl.innerHTML = '';

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const pCell = document.createElement('div');
        pCell.className = 'bs-cell';
        if (this.playerBoard[r][c] === 1) pCell.classList.add('ship');
        if (this.aiShots[r][c] === 1) pCell.classList.add('hit');
        if (this.aiShots[r][c] === 2) pCell.classList.add('miss');
        if (this.gamePhase === 'placement' && this._canPlacePreview(r, c)) {
          pCell.classList.add('preview');
        }
        pCell.addEventListener('click', () => this._handlePlayerBoardClick(r, c));
        playerBoardEl.appendChild(pCell);

        const aCell = document.createElement('div');
        aCell.className = 'bs-cell';
        if (this.playerShots[r][c] === 1) aCell.classList.add('hit');
        if (this.playerShots[r][c] === 2) aCell.classList.add('miss');
        if (this.gamePhase === 'battle') {
          aCell.addEventListener('click', () => this._handleAIBoradClick(r, c));
        }
        aiBoardEl.appendChild(aCell);
      }
    }
    this._updateHUD();
  }

  _canPlacePreview(row, col) {
    if (this.gamePhase !== 'placement') return false;
    const size = this.ships[this.currentShipIdx];
    return this._canPlace(this.playerBoard, row, col, size, this.isHorizontal);
  }

  _handlePlayerBoardClick(row, col) {
    if (this.gamePhase !== 'placement' || this.gameOver) return;
    const size = this.ships[this.currentShipIdx];
    if (!this._canPlace(this.playerBoard, row, col, size, this.isHorizontal)) {
      this._showMessage('CANNOT PLACE HERE!');
      setTimeout(() => this._showMessage(`PLACE SHIP (${size} cells) - Press R to rotate`), 1000);
      return;
    }
    this._placeShip(this.playerBoard, row, col, size, this.isHorizontal);
    this.currentShipIdx++;
    if (this.currentShipIdx >= this.ships.length) {
      this.gamePhase = 'battle';
      this._showMessage('BATTLE START! FIRE AT ENEMY WATERS');
    } else {
      this._showMessage(`PLACE SHIP (${this.ships[this.currentShipIdx]} cells) - Press R to rotate`);
    }
    this._renderBoards();
  }

  _handleAIBoradClick(row, col) {
    if (this.gamePhase !== 'battle' || this.gameOver) return;
    if (this.playerShots[row][col] !== 0) return;
    if (this.aiBoard[row][col] === 1) {
      this.playerShots[row][col] = 1;
      this._showMessage('HIT!');
      if (this._checkAllShipsSunk(this.aiBoard, this.playerShots)) {
        this.gameOver = true;
        this.scores.wins++;
        this._saveScores();
        this._showMessage('YOU WIN! ALL ENEMY SHIPS SUNK!');
      }
    } else {
      this.playerShots[row][col] = 2;
      this._showMessage('MISS!');
    }
    this._renderBoards();
    if (!this.gameOver) {
      setTimeout(() => this._aiShoot(), 800);
    }
  }

  _aiShoot() {
    let row, col;
    do {
      row = Math.floor(Math.random() * this.size);
      col = Math.floor(Math.random() * this.size);
    } while (this.aiShots[row][col] !== 0);

    if (this.playerBoard[row][col] === 1) {
      this.aiShots[row][col] = 1;
      this._showMessage('ENEMY HIT YOUR SHIP!');
      if (this._checkAllShipsSunk(this.playerBoard, this.aiShots)) {
        this.gameOver = true;
        this.scores.losses++;
        this._saveScores();
        this._showMessage('YOU LOSE! ALL YOUR SHIPS SUNK!');
      }
    } else {
      this.aiShots[row][col] = 2;
      this._showMessage('ENEMY MISSED! YOUR TURN');
    }
    this._renderBoards();
  }

  _checkAllShipsSunk(board, shots) {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (board[r][c] === 1 && shots[r][c] !== 1) return false;
      }
    }
    return true;
  }

  _updateHUD() {
    document.getElementById('bs-wins').textContent = this.scores.wins;
    document.getElementById('bs-losses').textContent = this.scores.losses;
  }

  _showMessage(msg) {
    document.getElementById('bs-message').textContent = msg;
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

window.Battleship = Battleship;
