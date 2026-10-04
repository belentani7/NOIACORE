/**
 * NEXUS OS — Chess with AI
 * Full chess implementation with minimax AI (depth 3), alpha-beta pruning.
 */
class Chess {
  constructor(container) {
    this.container = container;
    this.board = [];
    this.turn = 'white';
    this.gameOver = false;
    this.selectedSquare = null;
    this.validMoves = [];
    this.moveHistory = [];
    this.capturedPieces = { white: [], black: [] };
    this.scores = { white: 0, black: 0 };
    this.aiColor = 'black';
    this.aiThinking = false;
    this.storageKey = 'nexus_chess_scores';
    this._loadScores();
  }

  render() {
    this._buildDOM();
    this._initBoard();
    this._renderBoard();
  }

  destroy() {
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'chess-wrapper';
    this.wrapper.innerHTML = `
      <div class="chess-container">
        <h1 class="chess-title">CHESS</h1>
        <div class="chess-hud">
          <div class="chess-score">WINS: <span id="chess-wins">${this.scores.white}</span></div>
          <div class="chess-turn" id="chess-turn">WHITE'S TURN</div>
          <div class="chess-score">LOSSES: <span id="chess-losses">${this.scores.black}</span></div>
        </div>
        <div class="chess-board-container">
          <div class="chess-captured" id="captured-black"></div>
          <div class="chess-board" id="chess-board"></div>
          <div class="chess-captured" id="captured-white"></div>
        </div>
        <div class="chess-controls">
          <button class="chess-btn" id="chess-restart">RESTART</button>
          <button class="chess-btn" id="chess-undo">UNDO</button>
        </div>
        <div class="chess-status" id="chess-status"></div>
      </div>
    `;
    this.container.appendChild(this.wrapper);

    document.getElementById('chess-restart').addEventListener('click', () => this._restart());
    document.getElementById('chess-undo').addEventListener('click', () => this._undo());
  }

  _initBoard() {
    this.board = this._createInitialBoard();
    this.turn = 'white';
    this.gameOver = false;
    this.selectedSquare = null;
    this.validMoves = [];
    this.moveHistory = [];
    this.capturedPieces = { white: [], black: [] };
    this.aiThinking = false;
  }

  _createInitialBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    for (let i = 0; i < 8; i++) {
      board[0][i] = { type: backRank[i], color: 'black', moved: false };
      board[1][i] = { type: 'pawn', color: 'black', moved: false };
      board[6][i] = { type: 'pawn', color: 'white', moved: false };
      board[7][i] = { type: backRank[i], color: 'white', moved: false };
    }
    return board;
  }

  _renderBoard() {
    const boardEl = document.getElementById('chess-board');
    boardEl.innerHTML = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement('div');
        square.className = `chess-square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
        square.dataset.row = row;
        square.dataset.col = col;
        if (this.selectedSquare && this.selectedSquare.row === row && this.selectedSquare.col === col) {
          square.classList.add('selected');
        }
        if (this.validMoves.some(m => m.row === row && m.col === col)) {
          square.classList.add('valid-move');
        }
        const piece = this.board[row][col];
        if (piece) {
          square.innerHTML = this._getPieceSymbol(piece);
        }
        square.addEventListener('click', () => this._handleSquareClick(row, col));
        boardEl.appendChild(square);
      }
    }
    this._updateHUD();
  }

  _getPieceSymbol(piece) {
    const symbols = {
      white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
      black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
    };
    return `<span class="chess-piece ${piece.color}">${symbols[piece.color][piece.type]}</span>`;
  }

  _handleSquareClick(row, col) {
    if (this.gameOver || this.aiThinking || this.turn === this.aiColor) return;
    const piece = this.board[row][col];
    if (this.selectedSquare) {
      const move = this.validMoves.find(m => m.row === row && m.col === col);
      if (move) {
        this._makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
        this.selectedSquare = null;
        this.validMoves = [];
      } else if (piece && piece.color === this.turn) {
        this.selectedSquare = { row, col };
        this.validMoves = this._getValidMoves(row, col);
      } else {
        this.selectedSquare = null;
        this.validMoves = [];
      }
    } else if (piece && piece.color === this.turn) {
      this.selectedSquare = { row, col };
      this.validMoves = this._getValidMoves(row, col);
    }
    this._renderBoard();
    if (!this.gameOver && this.turn === this.aiColor) {
      this.aiThinking = true;
      setTimeout(() => this._aiMove(), 500);
    }
  }

  _makeMove(fromRow, fromCol, toRow, toCol, isAI = false) {
    const piece = this.board[fromRow][fromCol];
    const captured = this.board[toRow][toCol];
    this.moveHistory.push({
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      piece: { ...piece },
      captured: captured ? { ...captured } : null
    });
    if (captured) {
      this.capturedPieces[captured.color].push(captured);
    }
    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;
    piece.moved = true;
    if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
      piece.type = 'queen';
    }
    this.turn = this.turn === 'white' ? 'black' : 'white';
    if (this._isCheckmate(this.turn)) {
      this.gameOver = true;
      const winner = this.turn === 'white' ? 'black' : 'white';
      this.scores[winner]++;
      this._saveScores();
      this._showStatus(`CHECKMATE! ${winner.toUpperCase()} WINS!`);
    } else if (this._isStalemate(this.turn)) {
      this.gameOver = true;
      this._showStatus('STALEMATE! DRAW!');
    } else if (this._isInCheck(this.turn)) {
      this._showStatus('CHECK!');
    }
    this._renderBoard();
  }

  _getValidMoves(row, col) {
    const piece = this.board[row][col];
    if (!piece) return [];
    const moves = this._getPseudoLegalMoves(row, col, piece);
    return moves.filter(m => {
      const boardCopy = this._cloneBoard();
      boardCopy[m.row][m.col] = boardCopy[row][col];
      boardCopy[row][col] = null;
      return !this._isKingInCheck(boardCopy, piece.color);
    });
  }

  _getPseudoLegalMoves(row, col, piece) {
    const moves = [];
    const addMove = (r, c) => {
      if (r < 0 || r >= 8 || c < 0 || c >= 8) return false;
      const target = this.board[r][c];
      if (!target || target.color !== piece.color) {
        moves.push({ row: r, col: c });
      }
      return !target;
    };
    switch (piece.type) {
      case 'pawn':
        const dir = piece.color === 'white' ? -1 : 1;
        if (row + dir >= 0 && row + dir < 8 && !this.board[row + dir][col]) {
          moves.push({ row: row + dir, col });
          if (!piece.moved && !this.board[row + 2 * dir][col]) {
            moves.push({ row: row + 2 * dir, col });
          }
        }
        for (const dc of [-1, 1]) {
          if (col + dc >= 0 && col + dc < 8 && row + dir >= 0 && row + dir < 8) {
            const target = this.board[row + dir][col + dc];
            if (target && target.color !== piece.color) {
              moves.push({ row: row + dir, col: col + dc });
            }
          }
        }
        break;
      case 'knight':
        for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
          addMove(row + dr, col + dc);
        }
        break;
      case 'bishop':
        for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
          for (let i = 1; i < 8; i++) {
            if (!addMove(row + dr * i, col + dc * i)) break;
          }
        }
        break;
      case 'rook':
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          for (let i = 1; i < 8; i++) {
            if (!addMove(row + dr * i, col + dc * i)) break;
          }
        }
        break;
      case 'queen':
        for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
          for (let i = 1; i < 8; i++) {
            if (!addMove(row + dr * i, col + dc * i)) break;
          }
        }
        break;
      case 'king':
        for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
          addMove(row + dr, col + dc);
        }
        break;
    }
    return moves;
  }

  _isInCheck(color) {
    return this._isKingInCheck(this.board, color);
  }

  _isKingInCheck(board, color) {
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] && board[r][c].type === 'king' && board[r][c].color === color) {
          kingPos = { row: r, col: c };
          break;
        }
      }
      if (kingPos) break;
    }
    if (!kingPos) return true;
    const opponent = color === 'white' ? 'black' : 'white';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] && board[r][c].color === opponent) {
          const moves = this._getPseudoLegalMovesForBoard(board, r, c, board[r][c]);
          if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  _getPseudoLegalMovesForBoard(board, row, col, piece) {
    const moves = [];
    const addMove = (r, c) => {
      if (r < 0 || r >= 8 || c < 0 || c >= 8) return false;
      const target = board[r][c];
      if (!target || target.color !== piece.color) {
        moves.push({ row: r, col: c });
      }
      return !target;
    };
    switch (piece.type) {
      case 'pawn':
        const dir = piece.color === 'white' ? -1 : 1;
        if (row + dir >= 0 && row + dir < 8 && !board[row + dir][col]) {
          moves.push({ row: row + dir, col });
        }
        for (const dc of [-1, 1]) {
          if (col + dc >= 0 && col + dc < 8 && row + dir >= 0 && row + dir < 8) {
            const target = board[row + dir][col + dc];
            if (target && target.color !== piece.color) {
              moves.push({ row: row + dir, col: col + dc });
            }
          }
        }
        break;
      case 'knight':
        for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
          addMove(row + dr, col + dc);
        }
        break;
      case 'bishop':
        for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
          for (let i = 1; i < 8; i++) {
            if (!addMove(row + dr * i, col + dc * i)) break;
          }
        }
        break;
      case 'rook':
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          for (let i = 1; i < 8; i++) {
            if (!addMove(row + dr * i, col + dc * i)) break;
          }
        }
        break;
      case 'queen':
        for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
          for (let i = 1; i < 8; i++) {
            if (!addMove(row + dr * i, col + dc * i)) break;
          }
        }
        break;
      case 'king':
        for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
          addMove(row + dr, col + dc);
        }
        break;
    }
    return moves;
  }

  _isCheckmate(color) {
    if (!this._isInCheck(color)) return false;
    return this._hasNoLegalMoves(color);
  }

  _isStalemate(color) {
    if (this._isInCheck(color)) return false;
    return this._hasNoLegalMoves(color);
  }

  _hasNoLegalMoves(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c] && this.board[r][c].color === color) {
          const moves = this._getValidMoves(r, c);
          if (moves.length > 0) return false;
        }
      }
    }
    return true;
  }

  _aiMove() {
    const bestMove = this._minimax(3, -Infinity, Infinity, true);
    if (bestMove) {
      this._makeMove(bestMove.from.row, bestMove.from.col, bestMove.to.row, bestMove.to.col, true);
    }
    this.aiThinking = false;
  }

  _minimax(depth, alpha, beta, maximizing) {
    if (depth === 0 || this.gameOver) {
      return { score: this._evaluateBoard() };
    }
    const color = maximizing ? this.aiColor : (this.aiColor === 'white' ? 'black' : 'white');
    const moves = this._getAllMoves(color);
    if (moves.length === 0) {
      if (this._isInCheck(color)) {
        return { score: maximizing ? -10000 : 10000 };
      }
      return { score: 0 };
    }
    let bestMove = null;
    if (maximizing) {
      let maxScore = -Infinity;
      for (const move of moves) {
        const boardCopy = this._cloneBoard();
        this._applyMove(boardCopy, move.from.row, move.from.col, move.to.row, move.to.col);
        const oldBoard = this.board;
        this.board = boardCopy;
        const result = this._minimax(depth - 1, alpha, beta, false);
        this.board = oldBoard;
        if (result.score > maxScore) {
          maxScore = result.score;
          bestMove = move;
        }
        alpha = Math.max(alpha, result.score);
        if (beta <= alpha) break;
      }
      return { score: maxScore, ...bestMove };
    } else {
      let minScore = Infinity;
      for (const move of moves) {
        const boardCopy = this._cloneBoard();
        this._applyMove(boardCopy, move.from.row, move.from.col, move.to.row, move.to.col);
        const oldBoard = this.board;
        this.board = boardCopy;
        const result = this._minimax(depth - 1, alpha, beta, true);
        this.board = oldBoard;
        if (result.score < minScore) {
          minScore = result.score;
          bestMove = move;
        }
        beta = Math.min(beta, result.score);
        if (beta <= alpha) break;
      }
      return { score: minScore, ...bestMove };
    }
  }

  _getAllMoves(color) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c] && this.board[r][c].color === color) {
          const validMoves = this._getValidMoves(r, c);
          for (const move of validMoves) {
            moves.push({ from: { row: r, col: c }, to: move });
          }
        }
      }
    }
    return moves;
  }

  _evaluateBoard() {
    const values = { pawn: 100, knight: 320, bishop: 330, rook: 500, queen: 900, king: 20000 };
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece) {
          const value = values[piece.type] || 0;
          score += piece.color === this.aiColor ? value : -value;
        }
      }
    }
    return score;
  }

  _cloneBoard() {
    return this.board.map(row => row.map(cell => cell ? { ...cell } : null));
  }

  _applyMove(board, fromRow, fromCol, toRow, toCol) {
    board[toRow][toCol] = board[fromRow][fromCol];
    board[fromRow][fromCol] = null;
    if (board[toRow][toCol]) {
      board[toRow][toCol].moved = true;
      if (board[toRow][toCol].type === 'pawn' && (toRow === 0 || toRow === 7)) {
        board[toRow][toCol].type = 'queen';
      }
    }
  }

  _undo() {
    if (this.moveHistory.length < 2 || this.aiThinking) return;
    for (let i = 0; i < 2; i++) {
      const move = this.moveHistory.pop();
      if (!move) break;
      this.board[move.from.row][move.from.col] = move.piece;
      this.board[move.from.row][move.from.col].moved = move.piece.moved;
      this.board[move.to.row][move.to.col] = move.captured;
      if (move.captured) {
        this.capturedPieces[move.captured.color].pop();
      }
      this.turn = this.turn === 'white' ? 'black' : 'white';
    }
    this.gameOver = false;
    this._renderBoard();
    this._showStatus('');
  }

  _restart() {
    this._initBoard();
    this._renderBoard();
    this._showStatus('');
  }

  _updateHUD() {
    document.getElementById('chess-wins').textContent = this.scores.white;
    document.getElementById('chess-losses').textContent = this.scores.black;
    document.getElementById('chess-turn').textContent = `${this.turn.toUpperCase()}'S TURN`;
    const capturedBlack = document.getElementById('captured-black');
    const capturedWhite = document.getElementById('captured-white');
    capturedBlack.innerHTML = this.capturedPieces.black.map(p => this._getPieceSymbol(p)).join('');
    capturedWhite.innerHTML = this.capturedPieces.white.map(p => this._getPieceSymbol(p)).join('');
  }

  _showStatus(msg) {
    document.getElementById('chess-status').textContent = msg;
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

window.Chess = Chess;
