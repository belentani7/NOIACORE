/**
 * NEXUS OS — Cyber Puzzle Collection
 * Multiple puzzle games: Sudoku, Nonogram, Minesweeper, 2048, Word Search.
 * Tab-based interface with neon cyberpunk aesthetic.
 */
class CyberPuzzle {
  constructor(container) {
    this.container = container;
    this.wrapper = null;
    this.destroyed = false;
    this.activeTab = 'sudoku';
    this.tabContent = null;
    this.puzzleInstance = null;
  }

  render() {
    this._buildDOM();
    this._switchTab('sudoku');
  }

  destroy() {
    this.destroyed = true;
    if (this.puzzleInstance && this.puzzleInstance.destroy) {
      this.puzzleInstance.destroy();
    }
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.style.cssText = `
      width: 100%; height: 100%; display: flex; flex-direction: column;
      background: #0a0a0f; position: relative; overflow: hidden;
      font-family: 'Courier New', monospace;
    `;
    this.container.appendChild(this.wrapper);

    // Tab bar
    const tabBar = document.createElement('div');
    tabBar.style.cssText = `
      display: flex; border-bottom: 1px solid rgba(255,0,60,0.2); flex-shrink: 0;
    `;
    const tabs = [
      { id: 'sudoku', label: 'SUDOKU' },
      { id: 'nonogram', label: 'NONOGRAM' },
      { id: 'minesweeper', label: 'MINESWEEPER' },
      { id: '2048', label: '2048' },
      { id: 'wordsearch', label: 'WORD SEARCH' }
    ];
    for (const tab of tabs) {
      const btn = document.createElement('button');
      btn.textContent = tab.label;
      btn.dataset.tab = tab.id;
      btn.style.cssText = `
        flex: 1; padding: 10px 5px; background: rgba(255,0,60,0.05);
        border: none; border-bottom: 2px solid transparent;
        color: #666; font-family: 'Courier New', monospace; font-size: 10px;
        cursor: pointer; letter-spacing: 1px; transition: all 0.2s;
      `;
      btn.addEventListener('click', () => this._switchTab(tab.id));
      tabBar.appendChild(btn);
    }
    this.tabBar = tabBar;
    this.wrapper.appendChild(tabBar);

    // Content area
    this.tabContent = document.createElement('div');
    this.tabContent.style.cssText = `
      flex: 1; overflow-y: auto; position: relative; padding: 10px;
      display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
    `;
    this.wrapper.appendChild(this.tabContent);
  }

  _switchTab(tabId) {
    this.activeTab = tabId;

    // Update tab styles
    this.tabBar.querySelectorAll('button').forEach(btn => {
      const active = btn.dataset.tab === tabId;
      btn.style.color = active ? '#ff003c' : '#666';
      btn.style.borderBottomColor = active ? '#ff003c' : 'transparent';
      btn.style.background = active ? 'rgba(255,0,60,0.1)' : 'rgba(255,0,60,0.02)';
    });

    // Destroy previous
    if (this.puzzleInstance && this.puzzleInstance.destroy) {
      this.puzzleInstance.destroy();
      this.puzzleInstance = null;
    }
    this.tabContent.innerHTML = '';

    // Create new puzzle
    switch (tabId) {
      case 'sudoku': this.puzzleInstance = new SudokuPuzzle(this.tabContent); break;
      case 'nonogram': this.puzzleInstance = new NonogramPuzzle(this.tabContent); break;
      case 'minesweeper': this.puzzleInstance = new MinesweeperPuzzle(this.tabContent); break;
      case '2048': this.puzzleInstance = new Puzzle2048(this.tabContent); break;
      case 'wordsearch': this.puzzleInstance = new WordSearchPuzzle(this.tabContent); break;
    }
    if (this.puzzleInstance) this.puzzleInstance.render();
  }
}

// ════════════════════════════════════════════════════════════════════════
// SUDOKU
// ════════════════════════════════════════════════════════════════════════
class SudokuPuzzle {
  constructor(container) {
    this.container = container;
    this.wrapper = null;
    this.destroyed = false;
    this.difficulty = 'medium';
    this.board = [];
    this.solution = [];
    this.given = [];
    this.notes = [];
    this.selectedCell = null;
    this.noteMode = false;
    this.timerStart = 0;
    this.timerInterval = null;
    this.elapsed = 0;
    this.hintsUsed = 0;
    this.errors = 0;

    this._boundKey = this._onKey.bind(this);
  }

  render() {
    this._buildDOM();
    this._newGame();
  }

  destroy() {
    this.destroyed = true;
    if (this.timerInterval) clearInterval(this.timerInterval);
    document.removeEventListener('keydown', this._boundKey);
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.style.cssText = `
      display: flex; flex-direction: column; align-items: center; width: 100%;
    `;
    this.container.appendChild(this.wrapper);
    document.addEventListener('keydown', this._boundKey);
  }

  _newGame() {
    this.hintsUsed = 0;
    this.errors = 0;
    this.selectedCell = null;
    this.noteMode = false;
    this.notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));

    // Generate puzzle
    this.solution = this._generateSolution();
    this.given = Array.from({ length: 9 }, () => Array(9).fill(false));
    this.board = this._removeNumbers(this.solution);

    // Timer
    this.timerStart = Date.now();
    this.elapsed = 0;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.elapsed = Math.floor((Date.now() - this.timerStart) / 1000);
      const el = this.wrapper.querySelector('#sudoku-timer');
      if (el) el.textContent = this._fmt(this.elapsed);
    }, 1000);

    this._renderBoard();
  }

  _generateSolution() {
    const board = Array.from({ length: 9 }, () => Array(9).fill(0));
    this._fillBoard(board);
    return board;
  }

  _fillBoard(board) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          const nums = this._shuffled([1,2,3,4,5,6,7,8,9]);
          for (const n of nums) {
            if (this._isSudokuValid(board, r, c, n)) {
              board[r][c] = n;
              if (this._fillBoard(board)) return true;
              board[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  _isSudokuValid(board, row, col, num) {
    // Row
    for (let c = 0; c < 9; c++) if (board[row][c] === num) return false;
    // Column
    for (let r = 0; r < 9; r++) if (board[r][col] === num) return false;
    // Box
    const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++)
        if (board[r][c] === num) return false;
    return true;
  }

  _removeNumbers(solution) {
    const board = solution.map(r => [...r]);
    const removes = { easy: 35, medium: 45, hard: 55 }[this.difficulty] || 45;
    const positions = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) positions.push([r, c]);
    this._shuffleArr(positions);

    let removed = 0;
    for (const [r, c] of positions) {
      if (removed >= removes) break;
      const backup = board[r][c];
      board[r][c] = 0;
      // Simple uniqueness check — skip for performance, acceptable for a game
      this.given[r][c] = false;
      removed++;
    }
    // Mark givens
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      this.given[r][c] = board[r][c] !== 0;
    }
    return board;
  }

  _renderBoard() {
    this.wrapper.innerHTML = `
      <div style="display: flex; justify-content: space-between; width: 100%; max-width: 400px; margin-bottom: 8px;">
        <div style="display: flex; gap: 6px;">
          ${['easy', 'medium', 'hard'].map(d => `
            <button data-diff="${d}" style="
              padding: 3px 10px; background: ${this.difficulty === d ? 'rgba(255,0,60,0.3)' : 'rgba(255,255,255,0.05)'};
              border: 1px solid ${this.difficulty === d ? '#ff003c' : 'rgba(255,255,255,0.1)'};
              color: ${this.difficulty === d ? '#ff003c' : '#888'}; font-family: 'Courier New', monospace;
              font-size: 10px; cursor: pointer;
            ">${d.toUpperCase()}</button>
          `).join('')}
        </div>
        <span id="sudoku-timer" style="color: #888; font-size: 12px;">${this._fmt(this.elapsed)}</span>
      </div>
      <div id="sudoku-grid" style="
        display: grid; grid-template-columns: repeat(9, 1fr);
        gap: 1px; background: rgba(255,0,60,0.15);
        border: 2px solid rgba(255,0,60,0.4);
        box-shadow: 0 0 15px rgba(255,0,60,0.2);
        max-width: 400px; width: 100%;
      "></div>
      <div style="display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; justify-content: center;">
        ${[1,2,3,4,5,6,7,8,9].map(n => `
          <button data-num="${n}" style="
            width: 38px; height: 38px; background: rgba(255,0,60,0.1); border: 1px solid rgba(255,0,60,0.3);
            color: #ff003c; font-family: 'Courier New', monospace; font-size: 16px; cursor: pointer;
            text-shadow: 0 0 5px #ff003c; transition: all 0.2s;
          ">${n}</button>
        `).join('')}
      </div>
      <div style="display: flex; gap: 8px; margin-top: 8px;">
        <button id="sudoku-notes-btn" style="
          padding: 5px 14px; background: ${this.noteMode ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.05)'};
          border: 1px solid ${this.noteMode ? '#00f0ff' : 'rgba(255,255,255,0.15)'};
          color: ${this.noteMode ? '#00f0ff' : '#888'}; font-family: 'Courier New', monospace;
          font-size: 11px; cursor: pointer;
        ">NOTES ${this.noteMode ? 'ON' : 'OFF'}</button>
        <button id="sudoku-erase-btn" style="
          padding: 5px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15);
          color: #888; font-family: 'Courier New', monospace; font-size: 11px; cursor: pointer;
        ">ERASE</button>
        <button id="sudoku-hint-btn" style="
          padding: 5px 14px; background: rgba(255,255,0,0.1); border: 1px solid rgba(255,255,0,0.3);
          color: #ffff00; font-family: 'Courier New', monospace; font-size: 11px; cursor: pointer;
        ">HINT</button>
        <button id="sudoku-new-btn" style="
          padding: 5px 14px; background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3);
          color: #00ff88; font-family: 'Courier New', monospace; font-size: 11px; cursor: pointer;
        ">NEW GAME</button>
      </div>
      <div id="sudoku-status" style="color: #888; font-size: 11px; margin-top: 8px;"></div>
    `;

    // Build grid cells
    const grid = this.wrapper.querySelector('#sudoku-grid');
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.dataset.row = r;
        cell.dataset.col = c;
        const val = this.board[r][c];
        const isGiven = this.given[r][c];
        cell.style.cssText = `
          aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
          background: ${isGiven ? 'rgba(255,0,60,0.08)' : 'rgba(10,10,20,0.9)'};
          color: ${isGiven ? '#ff4488' : '#ffffff'}; font-size: 18px; cursor: pointer;
          border: ${this._getBorderStyle(r, c)}; transition: background 0.15s;
          position: relative; user-select: none;
        `;
        if (val > 0) {
          cell.textContent = val;
          if (isGiven) cell.style.textShadow = '0 0 5px #ff4488';
        }
        cell.addEventListener('click', () => this._selectCell(r, c));
        grid.appendChild(cell);
      }
    }

    // Number buttons
    this.wrapper.querySelectorAll('[data-num]').forEach(btn => {
      btn.addEventListener('click', () => this._placeNumber(parseInt(btn.dataset.num)));
    });

    // Control buttons
    this.wrapper.querySelector('#sudoku-notes-btn').addEventListener('click', () => {
      this.noteMode = !this.noteMode;
      this._newGame_preserveBoard();
      this._renderBoard();
    });
    this.wrapper.querySelector('#sudoku-erase-btn').addEventListener('click', () => this._eraseCell());
    this.wrapper.querySelector('#sudoku-hint-btn').addEventListener('click', () => this._giveHint());
    this.wrapper.querySelector('#sudoku-new-btn').addEventListener('click', () => this._newGame());

    // Difficulty
    this.wrapper.querySelectorAll('[data-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.difficulty = btn.dataset.diff;
        this._newGame();
      });
    });
  }

  _newGame_preserveBoard() {
    // Just re-render without regenerating
  }

  _getBorderStyle(r, c) {
    const b = '1px solid rgba(255,0,60,0.08)';
    const thick = '2px solid rgba(255,0,60,0.35)';
    let top = r % 3 === 0 ? thick : b;
    let left = c % 3 === 0 ? thick : b;
    let bottom = r === 8 ? thick : (r % 3 === 2 ? thick : b);
    let right = c === 8 ? thick : (c % 3 === 2 ? thick : b);
    return `none`;
  }

  _selectCell(r, c) {
    this.selectedCell = { r, c };
    this._highlightCells();
  }

  _highlightCells() {
    const grid = this.wrapper.querySelector('#sudoku-grid');
    if (!grid) return;
    grid.querySelectorAll('div[data-row]').forEach(cell => {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      let bg = this.given[r][c] ? 'rgba(255,0,60,0.08)' : 'rgba(10,10,20,0.9)';
      if (this.selectedCell) {
        const sr = this.selectedCell.r, sc = this.selectedCell.c;
        if (r === sr && c === sc) bg = 'rgba(255,0,60,0.25)';
        else if (r === sr || c === sc || (Math.floor(r/3) === Math.floor(sr/3) && Math.floor(c/3) === Math.floor(sc/3))) {
          bg = this.given[r][c] ? 'rgba(255,0,60,0.12)' : 'rgba(255,0,60,0.06)';
        }
      }
      cell.style.background = bg;
    });
  }

  _placeNumber(num) {
    if (!this.selectedCell) return;
    const { r, c } = this.selectedCell;
    if (this.given[r][c]) return;

    if (this.noteMode) {
      if (this.notes[r][c].has(num)) this.notes[r][c].delete(num);
      else this.notes[r][c].add(num);
      this._renderCellNotes(r, c);
    } else {
      this.board[r][c] = num;
      this.notes[r][c].clear();

      // Check for error
      if (num !== this.solution[r][c]) {
        this.errors++;
        const status = this.wrapper.querySelector('#sudoku-status');
        if (status) { status.textContent = '✗ INCORRECT'; status.style.color = '#ff003c'; }
      } else {
        const status = this.wrapper.querySelector('#sudoku-status');
        if (status) { status.textContent = ''; }
      }

      this._updateCellDisplay(r, c);
      this._checkSudokuWin();
    }
  }

  _eraseCell() {
    if (!this.selectedCell) return;
    const { r, c } = this.selectedCell;
    if (this.given[r][c]) return;
    this.board[r][c] = 0;
    this.notes[r][c].clear();
    this._updateCellDisplay(r, c);
  }

  _giveHint() {
    // Find an empty cell and fill it
    const empty = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (this.board[r][c] === 0 || this.board[r][c] !== this.solution[r][c]) {
        empty.push([r, c]);
      }
    }
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    this.board[r][c] = this.solution[r][c];
    this.given[r][c] = true; // lock it
    this.hintsUsed++;
    this._updateCellDisplay(r, c);
    this._checkSudokuWin();
  }

  _updateCellDisplay(r, c) {
    const grid = this.wrapper.querySelector('#sudoku-grid');
    if (!grid) return;
    const cell = grid.querySelector(`div[data-row="${r}"][data-col="${c}"]`);
    if (!cell) return;
    const val = this.board[r][c];
    cell.textContent = val > 0 ? val : '';
    cell.style.color = this.given[r][c] ? '#ff4488' : (val === this.solution[r][c] ? '#00ff88' : '#ff003c');
    if (val > 0 && !this.given[r][c]) cell.style.textShadow = val === this.solution[r][c] ? '0 0 5px #00ff88' : '0 0 5px #ff003c';
    else cell.style.textShadow = this.given[r][c] ? '0 0 5px #ff4488' : 'none';

    // Render notes if empty
    if (val === 0 && this.notes[r][c].size > 0) {
      this._renderCellNotes(r, c);
    }
  }

  _renderCellNotes(r, c) {
    const grid = this.wrapper.querySelector('#sudoku-grid');
    if (!grid) return;
    const cell = grid.querySelector(`div[data-row="${r}"][data-col="${c}"]`);
    if (!cell || this.board[r][c] > 0) return;
    cell.innerHTML = '';
    if (this.notes[r][c].size > 0) {
      const noteGrid = document.createElement('div');
      noteGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3,1fr); grid-template-rows: repeat(3,1fr); width: 100%; height: 100%; font-size: 8px; color: #00f0ff;';
      for (let n = 1; n <= 9; n++) {
        const span = document.createElement('span');
        span.style.cssText = 'display: flex; align-items: center; justify-content: center;';
        span.textContent = this.notes[r][c].has(n) ? n : '';
        noteGrid.appendChild(span);
      }
      cell.appendChild(noteGrid);
    }
  }

  _checkSudokuWin() {
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (this.board[r][c] !== this.solution[r][c]) return;
    }
    // Win!
    if (this.timerInterval) clearInterval(this.timerInterval);
    const status = this.wrapper.querySelector('#sudoku-status');
    if (status) {
      status.innerHTML = `<span style="color: #00ff88; font-size: 16px; text-shadow: 0 0 10px #00ff88;">✦ SUDOKU COMPLETE ✦</span><br>
        <span style="color: #888;">Time: ${this._fmt(this.elapsed)} | Hints: ${this.hintsUsed} | Errors: ${this.errors}</span>`;
    }
  }

  _onKey(e) {
    if (this.destroyed || this.activeTab !== 'sudoku') return;
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) this._placeNumber(num);
    if (e.key === 'Backspace' || e.key === 'Delete') this._eraseCell();
    if (e.key === 'n' || e.key === 'N') {
      this.noteMode = !this.noteMode;
      const btn = this.wrapper.querySelector('#sudoku-notes-btn');
      if (btn) {
        btn.textContent = `NOTES ${this.noteMode ? 'ON' : 'OFF'}`;
        btn.style.color = this.noteMode ? '#00f0ff' : '#888';
        btn.style.borderColor = this.noteMode ? '#00f0ff' : 'rgba(255,255,255,0.15)';
      }
    }
    // Arrow key navigation
    if (this.selectedCell) {
      let { r, c } = this.selectedCell;
      if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
      if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
      if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
      if (e.key === 'ArrowRight') c = Math.min(8, c + 1);
      if (r !== this.selectedCell.r || c !== this.selectedCell.c) {
        e.preventDefault();
        this._selectCell(r, c);
      }
    }
  }

  _fmt(s) { const m = Math.floor(s/60); return `${m}:${(s%60).toString().padStart(2,'0')}`; }
  _shuffled(arr) { const a = [...arr]; for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  _shuffleArr(arr) { for (let i = arr.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } }
}

// ════════════════════════════════════════════════════════════════════════
// NONOGRAM (PICROSS)
// ════════════════════════════════════════════════════════════════════════
class NonogramPuzzle {
  constructor(container) {
    this.container = container;
    this.wrapper = null;
    this.destroyed = false;
    this.size = 5;
    this.solution = [];
    this.grid = [];
    this.marks = []; // 0=unknown, 1=filled, 2=marked X
    this.rowClues = [];
    this.colClues = [];
    this.gameOver = false;
  }

  render() {
    this._buildDOM();
    this._newGame();
  }

  destroy() {
    this.destroyed = true;
    if (this.wrapper && this.wrapper.parentNode) this.wrapper.parentNode.removeChild(this.wrapper);
  }

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.style.cssText = `display: flex; flex-direction: column; align-items: center; width: 100%;`;
    this.container.appendChild(this.wrapper);
  }

  _newGame() {
    this.gameOver = false;
    // Generate random solution
    this.solution = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => Math.random() < 0.5 ? 1 : 0)
    );
    // Ensure at least some filled
    let totalFilled = this.solution.flat().reduce((a, b) => a + b, 0);
    if (totalFilled < this.size) {
      for (let i = 0; i < this.size; i++) {
        this.solution[Math.floor(Math.random() * this.size)][Math.floor(Math.random() * this.size)] = 1;
      }
    }

    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.marks = Array.from({ length: this.size }, () => Array(this.size).fill(0));

    // Generate clues
    this.rowClues = this.solution.map(row => this._getClues(row));
    this.colClues = [];
    for (let c = 0; c < this.size; c++) {
      const col = this.solution.map(row => row[c]);
      this.colClues.push(this._getClues(col));
    }

    this._renderGrid();
  }

  _getClues(line) {
    const clues = [];
    let count = 0;
    for (const cell of line) {
      if (cell === 1) count++;
      else { if (count > 0) clues.push(count); count = 0; }
    }
    if (count > 0) clues.push(count);
    return clues.length > 0 ? clues : [0];
  }

  _renderGrid() {
    const cellSize = this.size <= 5 ? 36 : this.size <= 10 ? 28 : 22;
    const clueSpace = this.size <= 5 ? 50 : this.size <= 10 ? 45 : 40;
    const maxClueLen = Math.max(...this.colClues.map(c => c.length), ...this.rowClues.map(c => c.length));

    this.wrapper.innerHTML = `
      <div style="display: flex; justify-content: space-between; width: 100%; max-width: 500px; margin-bottom: 8px;">
        <div style="display: flex; gap: 6px;">
          ${[5, 10, 15].map(s => `
            <button data-size="${s}" style="
              padding: 3px 10px; background: ${this.size === s ? 'rgba(255,0,60,0.3)' : 'rgba(255,255,255,0.05)'};
              border: 1px solid ${this.size === s ? '#ff003c' : 'rgba(255,255,255,0.1)'};
              color: ${this.size === s ? '#ff003c' : '#888'}; font-family: 'Courier New', monospace;
              font-size: 10px; cursor: pointer;
            ">${s}×${s}</button>
          `).join('')}
        </div>
        <button id="nono-new" style="
          padding: 3px 10px; background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3);
          color: #00ff88; font-family: 'Courier New', monospace; font-size: 10px; cursor: pointer;
        ">NEW PUZZLE</button>
      </div>
      <div style="color: #555; font-size: 10px; margin-bottom: 5px;">LEFT CLICK = FILL | RIGHT CLICK = MARK X</div>
      <div id="nono-board" style="display: inline-block;"></div>
      <div id="nono-status" style="color: #888; font-size: 12px; margin-top: 8px;"></div>
    `;

    const board = this.wrapper.querySelector('#nono-board');
    const table = document.createElement('div');
    table.style.cssText = `display: inline-grid; grid-template-columns: ${clueSpace}px repeat(${this.size}, ${cellSize}px); gap: 1px;`;

    // Column clues header row(s)
    for (let clueRow = 0; clueRow < maxClueLen; clueRow++) {
      // Empty corner cell
      const corner = document.createElement('div');
      corner.style.cssText = `width: ${clueSpace}px; height: ${cellSize * 0.6}px;`;
      table.appendChild(corner);

      for (let c = 0; c < this.size; c++) {
        const cell = document.createElement('div');
        const clues = this.colClues[c];
        const idx = clueRow - (maxClueLen - clues.length);
        cell.style.cssText = `
          width: ${cellSize}px; height: ${cellSize * 0.6}px; display: flex; align-items: center; justify-content: center;
          color: #ff4488; font-size: ${cellSize * 0.35}px; text-shadow: 0 0 3px #ff4488;
        `;
        cell.textContent = idx >= 0 ? clues[idx] : '';
        table.appendChild(cell);
      }
    }

    // Grid rows
    for (let r = 0; r < this.size; r++) {
      // Row clues
      const rowClueCell = document.createElement('div');
      rowClueCell.style.cssText = `
        width: ${clueSpace}px; height: ${cellSize}px; display: flex; align-items: center;
        justify-content: flex-end; padding-right: 6px; gap: 4px;
      `;
      for (const cl of this.rowClues[r]) {
        const span = document.createElement('span');
        span.style.cssText = `color: #ff4488; font-size: ${cellSize * 0.35}px; text-shadow: 0 0 3px #ff4488;`;
        span.textContent = cl;
        rowClueCell.appendChild(span);
      }
      table.appendChild(rowClueCell);

      // Grid cells
      for (let c = 0; c < this.size; c++) {
        const cell = document.createElement('div');
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.style.cssText = `
          width: ${cellSize}px; height: ${cellSize}px; display: flex; align-items: center; justify-content: center;
          background: rgba(10,10,20,0.8); border: 1px solid rgba(255,0,60,0.15);
          cursor: pointer; font-size: ${cellSize * 0.5}px; color: #666; transition: background 0.15s;
        `;
        cell.addEventListener('click', () => this._toggleCell(r, c));
        cell.addEventListener('contextmenu', (e) => { e.preventDefault(); this._markCell(r, c); });
        table.appendChild(cell);
      }
    }

    board.appendChild(table);

    // Bind controls
    this.wrapper.querySelectorAll('[data-size]').forEach(btn => {
      btn.addEventListener('click', () => { this.size = parseInt(btn.dataset.size); this._newGame(); });
    });
    this.wrapper.querySelector('#nono-new').addEventListener('click', () => this._newGame());
  }

  _toggleCell(r, c) {
    if (this.gameOver) return;
    if (this.marks[r][c] === 2) return; // can't toggle marked cells
    this.marks[r][c] = this.marks[r][c] === 1 ? 0 : 1;
    this._updateCellDisplay(r, c);
    this._checkNonogramWin();
  }

  _markCell(r, c) {
    if (this.gameOver) return;
    if (this.marks[r][c] === 1) return; // can't mark filled cells
    this.marks[r][c] = this.marks[r][c] === 2 ? 0 : 2;
    this._updateCellDisplay(r, c);
  }

  _updateCellDisplay(r, c) {
    const cell = this.wrapper.querySelector(`div[data-row="${r}"][data-col="${c}"]`);
    if (!cell) return;
    const state = this.marks[r][c];
    if (state === 1) {
      cell.style.background = 'rgba(255,0,60,0.4)';
      cell.style.boxShadow = 'inset 0 0 8px rgba(255,0,60,0.5)';
      cell.textContent = '';
    } else if (state === 2) {
      cell.style.background = 'rgba(10,10,20,0.8)';
      cell.style.boxShadow = 'none';
      cell.textContent = '✕';
      cell.style.color = '#444';
    } else {
      cell.style.background = 'rgba(10,10,20,0.8)';
      cell.style.boxShadow = 'none';
      cell.textContent = '';
    }
  }

  _checkNonogramWin() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const filled = this.marks[r][c] === 1;
        const shouldBeFilled = this.solution[r][c] === 1;
        if (filled !== shouldBeFilled) return;
      }
    }
    this.gameOver = true;
    const status = this.wrapper.querySelector('#nono-status');
    if (status) {
      status.innerHTML = `<span style="color: #00ff88; text-shadow: 0 0 10px #00ff88;">✦ NONOGRAM COMPLETE ✦</span>`;
    }
    // Reveal animation
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      if (this.solution[r][c] === 1) {
        const cell = this.wrapper.querySelector(`div[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
          setTimeout(() => {
            cell.style.background = '#ff003c';
            cell.style.boxShadow = '0 0 10px #ff003c';
          }, (r * this.size + c) * 30);
        }
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// MINESWEEPER
// ════════════════════════════════════════════════════════════════════════
class MinesweeperPuzzle {
  constructor(container) {
    this.container = container;
    this.wrapper = null;
    this.destroyed = false;
    this.cols = 9;
    this.rows = 9;
    this.mines = 10;
    this.board = [];
    this.revealed = [];
    this.flagged = [];
    this.gameOver = false;
    this.firstClick = true;
    this.timerStart = 0;
    this.timerInterval = null;
    this.elapsed = 0;

    this._boundContext = (e) => e.preventDefault();
  }

  render() {
    this._buildDOM();
    this._newGame();
  }

  destroy() {
    this.destroyed = true;
    if (this.timerInterval) clearInterval(this.timerInterval);
    document.removeEventListener('contextmenu', this._boundContext);
    if (this.wrapper && this.wrapper.parentNode) this.wrapper.parentNode.removeChild(this.wrapper);
  }

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.style.cssText = `display: flex; flex-direction: column; align-items: center; width: 100%;`;
    this.container.appendChild(this.wrapper);
    document.addEventListener('contextmenu', this._boundContext);
  }

  _newGame() {
    this.gameOver = false;
    this.firstClick = true;
    this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.revealed = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    this.flagged = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    this.elapsed = 0;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
    this._renderGrid();
  }

  _placeMines(safeR, safeC) {
    let placed = 0;
    while (placed < this.mines) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      if (this.board[r][c] === -1) continue;
      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
      this.board[r][c] = -1;
      placed++;
    }
    // Calculate numbers
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c] === -1) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.board[nr][nc] === -1) count++;
        }
        this.board[r][c] = count;
      }
    }
  }

  _renderGrid() {
    const cellSize = this.cols <= 9 ? 30 : this.cols <= 16 ? 24 : 20;
    const flagsUsed = this.flagged.flat().filter(Boolean).length;

    this.wrapper.innerHTML = `
      <div style="display: flex; justify-content: space-between; width: 100%; max-width: ${this.cols * cellSize + 20}px; margin-bottom: 8px;">
        <div style="display: flex; gap: 6px;">
          ${[{c:9,r:9,m:10,l:'9×9'},{c:16,r:16,m:40,l:'16×16'},{c:30,r:16,m:99,l:'30×16'}].map(p => `
            <button data-config="${p.c},${p.r},${p.m}" style="
              padding: 3px 8px; background: ${this.cols===p.c&&this.rows===p.r ? 'rgba(255,0,60,0.3)' : 'rgba(255,255,255,0.05)'};
              border: 1px solid ${this.cols===p.c&&this.rows===p.r ? '#ff003c' : 'rgba(255,255,255,0.1)'};
              color: ${this.cols===p.c&&this.rows===p.r ? '#ff003c' : '#888'}; font-family: 'Courier New', monospace;
              font-size: 10px; cursor: pointer;
            ">${p.l}</button>
          `).join('')}
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <span style="color: #ff003c; font-size: 12px;">💣 ${this.mines - flagsUsed}</span>
          <span id="mine-timer" style="color: #888; font-size: 12px;">${this.elapsed}s</span>
          <button id="mine-new" style="
            padding: 3px 8px; background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3);
            color: #00ff88; font-family: 'Courier New', monospace; font-size: 10px; cursor: pointer;
          ">NEW</button>
        </div>
      </div>
      <div id="mine-grid" style="
        display: inline-grid; grid-template-columns: repeat(${this.cols}, ${cellSize}px);
        gap: 1px; background: rgba(255,0,60,0.1); border: 2px solid rgba(255,0,60,0.3);
        box-shadow: 0 0 15px rgba(255,0,60,0.2);
      "></div>
      <div id="mine-status" style="color: #888; font-size: 12px; margin-top: 8px;"></div>
    `;

    const grid = this.wrapper.querySelector('#mine-grid');
    const numColors = ['', '#4488ff', '#00ff88', '#ff003c', '#aa66ff', '#ff8800', '#00f0ff', '#ff4488', '#888'];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = document.createElement('div');
        cell.dataset.row = r;
        cell.dataset.col = c;
        const isRevealed = this.revealed[r][c];
        const isFlagged = this.flagged[r][c];

        cell.style.cssText = `
          width: ${cellSize}px; height: ${cellSize}px; display: flex; align-items: center; justify-content: center;
          background: ${isRevealed ? 'rgba(10,10,20,0.9)' : 'rgba(255,0,60,0.12)'};
          border: ${isRevealed ? '1px solid rgba(255,0,60,0.05)' : '1px solid rgba(255,0,60,0.2)'};
          cursor: pointer; font-size: ${cellSize * 0.5}px; font-weight: bold;
          color: ${isRevealed && this.board[r][c] > 0 ? numColors[this.board[r][c]] || '#fff' : '#888'};
          transition: background 0.1s; user-select: none;
          ${isRevealed ? '' : 'box-shadow: inset 0 0 5px rgba(255,0,60,0.1);'}
        `;

        if (isRevealed) {
          if (this.board[r][c] === -1) {
            cell.textContent = '💣';
            cell.style.background = 'rgba(255,0,60,0.3)';
          } else if (this.board[r][c] > 0) {
            cell.textContent = this.board[r][c];
            cell.style.textShadow = `0 0 5px ${numColors[this.board[r][c]]}`;
          }
        } else if (isFlagged) {
          cell.textContent = '🚩';
        }

        cell.addEventListener('click', () => this._revealCell(r, c));
        cell.addEventListener('contextmenu', (e) => { e.preventDefault(); this._toggleFlag(r, c); });
        grid.appendChild(cell);
      }
    }

    // Bind controls
    this.wrapper.querySelectorAll('[data-config]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [c, r, m] = btn.dataset.config.split(',').map(Number);
        this.cols = c; this.rows = r; this.mines = m;
        this._newGame();
      });
    });
    this.wrapper.querySelector('#mine-new').addEventListener('click', () => this._newGame());
  }

  _revealCell(r, c) {
    if (this.gameOver || this.revealed[r][c] || this.flagged[r][c]) return;

    if (this.firstClick) {
      this.firstClick = false;
      this._placeMines(r, c);
      this.timerStart = Date.now();
      this.timerInterval = setInterval(() => {
        this.elapsed = Math.floor((Date.now() - this.timerStart) / 1000);
        const el = this.wrapper.querySelector('#mine-timer');
        if (el) el.textContent = this.elapsed + 's';
      }, 1000);
    }

    this.revealed[r][c] = true;

    if (this.board[r][c] === -1) {
      // Game over — reveal all mines
      this.gameOver = true;
      if (this.timerInterval) clearInterval(this.timerInterval);
      for (let rr = 0; rr < this.rows; rr++) for (let cc = 0; cc < this.cols; cc++) {
        if (this.board[rr][cc] === -1) this.revealed[rr][cc] = true;
      }
      this._renderGrid();
      const status = this.wrapper.querySelector('#mine-status');
      if (status) status.innerHTML = `<span style="color: #ff003c; text-shadow: 0 0 8px #ff003c;">💥 MINE HIT — GAME OVER</span>`;
      return;
    }

    // Flood fill for zero cells
    if (this.board[r][c] === 0) {
      this._floodReveal(r, c);
    }

    this._renderGrid();
    this._checkMineWin();
  }

  _floodReveal(r, c) {
    const stack = [[r, c]];
    while (stack.length > 0) {
      const [cr, cc] = stack.pop();
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = cr + dr, nc = cc + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && !this.revealed[nr][nc] && !this.flagged[nr][nc]) {
          this.revealed[nr][nc] = true;
          if (this.board[nr][nc] === 0) stack.push([nr, nc]);
        }
      }
    }
  }

  _toggleFlag(r, c) {
    if (this.gameOver || this.revealed[r][c]) return;
    this.flagged[r][c] = !this.flagged[r][c];
    this._renderGrid();
  }

  _checkMineWin() {
    let unrevealedSafe = 0;
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      if (!this.revealed[r][c] && this.board[r][c] !== -1) unrevealedSafe++;
    }
    if (unrevealedSafe === 0) {
      this.gameOver = true;
      if (this.timerInterval) clearInterval(this.timerInterval);
      const status = this.wrapper.querySelector('#mine-status');
      if (status) status.innerHTML = `<span style="color: #00ff88; text-shadow: 0 0 10px #00ff88;">✦ MINESWEEPER COMPLETE — ${this.elapsed}s ✦</span>`;
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// 2048
// ════════════════════════════════════════════════════════════════════════
class Puzzle2048 {
  constructor(container) {
    this.container = container;
    this.wrapper = null;
    this.destroyed = false;
    this.size = 4;
    this.grid = [];
    this.score = 0;
    this.bestScore = 0;
    this.gameOver = false;
    this.won = false;
    this.moveHistory = [];
    this.undosLeft = 3;
    this.storageKey = 'nexus_2048_best';

    this._boundKey = this._onKey.bind(this);
  }

  render() {
    this._loadBest();
    this._buildDOM();
    this._newGame();
  }

  destroy() {
    this.destroyed = true;
    document.removeEventListener('keydown', this._boundKey);
    if (this.wrapper && this.wrapper.parentNode) this.wrapper.parentNode.removeChild(this.wrapper);
  }

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.style.cssText = `display: flex; flex-direction: column; align-items: center; width: 100%;`;
    this.container.appendChild(this.wrapper);
    document.addEventListener('keydown', this._boundKey);
  }

  _newGame() {
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.score = 0;
    this.gameOver = false;
    this.won = false;
    this.moveHistory = [];
    this.undosLeft = 3;
    this._addRandomTile();
    this._addRandomTile();
    this._renderGrid();
  }

  _addRandomTile() {
    const empty = [];
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      if (this.grid[r][c] === 0) empty.push([r, c]);
    }
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  _renderGrid() {
    const cellSize = 65;
    const tileColors = {
      0: 'rgba(255,255,255,0.03)', 2: '#1a1a2e', 4: '#1e1e3a', 8: '#ff6600',
      16: '#ff4400', 32: '#ff2200', 64: '#ff003c', 128: '#ff2d6b',
      256: '#aa66ff', 512: '#8844ff', 1024: '#00f0ff', 2048: '#00ff88',
      4096: '#ffff00', 8192: '#ff00ff'
    };
    const textColors = {
      0: 'transparent', 2: '#888', 4: '#aaa', 8: '#fff', 16: '#fff', 32: '#fff',
      64: '#fff', 128: '#fff', 256: '#fff', 512: '#fff', 1024: '#fff', 2048: '#fff'
    };

    this.wrapper.innerHTML = `
      <div style="display: flex; justify-content: space-between; width: ${this.size * cellSize + (this.size + 1) * 6}px; margin-bottom: 8px;">
        <div>
          <span style="color: #ff003c; font-size: 16px; text-shadow: 0 0 8px #ff003c;">${this.score}</span>
          <span style="color: #555; font-size: 10px; margin-left: 10px;">BEST: ${this.bestScore}</span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button id="2048-undo" style="
            padding: 3px 10px; background: rgba(255,255,0,0.1); border: 1px solid rgba(255,255,0,0.3);
            color: ${this.undosLeft > 0 ? '#ffff00' : '#444'}; font-family: 'Courier New', monospace;
            font-size: 10px; cursor: ${this.undosLeft > 0 ? 'pointer' : 'default'};
          ">UNDO (${this.undosLeft})</button>
          <button id="2048-new" style="
            padding: 3px 10px; background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3);
            color: #00ff88; font-family: 'Courier New', monospace; font-size: 10px; cursor: pointer;
          ">NEW</button>
        </div>
      </div>
      <div id="2048-grid" style="
        display: grid; grid-template-columns: repeat(${this.size}, ${cellSize}px); gap: 6px;
        background: rgba(255,0,60,0.08); border: 2px solid rgba(255,0,60,0.25);
        padding: 6px; box-shadow: 0 0 20px rgba(255,0,60,0.15);
      "></div>
      <div style="color: #555; font-size: 10px; margin-top: 8px;">ARROW KEYS to move tiles</div>
      <div id="2048-status" style="color: #888; font-size: 12px; margin-top: 5px;"></div>
    `;

    const gridEl = this.wrapper.querySelector('#2048-grid');
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        const cell = document.createElement('div');
        const bg = tileColors[val] || '#ff00ff';
        const tc = textColors[val] || '#fff';
        cell.style.cssText = `
          width: ${cellSize}px; height: ${cellSize}px; display: flex; align-items: center; justify-content: center;
          background: ${bg}; color: ${tc}; font-size: ${val >= 1024 ? 14 : val >= 128 ? 18 : 22}px;
          font-weight: bold; transition: all 0.15s; border-radius: 3px;
          ${val > 0 ? `box-shadow: 0 0 ${Math.min(val/50, 15)}px ${bg}; text-shadow: 0 0 5px ${tc};` : ''}
        `;
        cell.textContent = val > 0 ? val : '';
        gridEl.appendChild(cell);
      }
    }

    // Bind buttons
    this.wrapper.querySelector('#2048-new').addEventListener('click', () => this._newGame());
    this.wrapper.querySelector('#2048-undo').addEventListener('click', () => this._undo());

    if (this.gameOver) {
      const status = this.wrapper.querySelector('#2048-status');
      if (status) status.innerHTML = `<span style="color: #ff003c;">GAME OVER — Score: ${this.score}</span>`;
    }
    if (this.won) {
      const status = this.wrapper.querySelector('#2048-status');
      if (status) status.innerHTML = `<span style="color: #00ff88; text-shadow: 0 0 10px #00ff88;">✦ 2048 REACHED! ✦</span>`;
    }
  }

  _move(dir) {
    if (this.gameOver) return;

    // Save state for undo
    const prevGrid = this.grid.map(r => [...r]);
    const prevScore = this.score;

    let moved = false;

    if (dir === 'left' || dir === 'right') {
      for (let r = 0; r < this.size; r++) {
        let row = this.grid[r].slice();
        if (dir === 'right') row.reverse();
        row = this._slideRow(row);
        if (dir === 'right') row.reverse();
        if (row.join(',') !== this.grid[r].join(',')) moved = true;
        this.grid[r] = row;
      }
    } else {
      for (let c = 0; c < this.size; c++) {
        let col = [];
        for (let r = 0; r < this.size; r++) col.push(this.grid[r][c]);
        if (dir === 'down') col.reverse();
        col = this._slideRow(col);
        if (dir === 'down') col.reverse();
        for (let r = 0; r < this.size; r++) {
          if (this.grid[r][c] !== col[r]) moved = true;
          this.grid[r][c] = col[r];
        }
      }
    }

    if (moved) {
      this.moveHistory.push({ grid: prevGrid, score: prevScore });
      if (this.moveHistory.length > 10) this.moveHistory.shift();
      this._addRandomTile();
      this._check2048Win();
      this._check2048GameOver();
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        this._saveBest();
      }
    }

    this._renderGrid();
  }

  _slideRow(row) {
    // Remove zeros
    let tiles = row.filter(v => v !== 0);
    // Merge
    for (let i = 0; i < tiles.length - 1; i++) {
      if (tiles[i] === tiles[i + 1]) {
        tiles[i] *= 2;
        this.score += tiles[i];
        tiles.splice(i + 1, 1);
      }
    }
    // Pad with zeros
    while (tiles.length < this.size) tiles.push(0);
    return tiles;
  }

  _undo() {
    if (this.undosLeft <= 0 || this.moveHistory.length === 0) return;
    const prev = this.moveHistory.pop();
    this.grid = prev.grid;
    this.score = prev.score;
    this.gameOver = false;
    this.undosLeft--;
    this._renderGrid();
  }

  _check2048Win() {
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      if (this.grid[r][c] === 2048 && !this.won) {
        this.won = true;
      }
    }
  }

  _check2048GameOver() {
    // Check if any moves possible
    for (let r = 0; r < this.size; r++) for (let c = 0; c < this.size; c++) {
      if (this.grid[r][c] === 0) return;
      if (c < this.size - 1 && this.grid[r][c] === this.grid[r][c + 1]) return;
      if (r < this.size - 1 && this.grid[r][c] === this.grid[r + 1][c]) return;
    }
    this.gameOver = true;
  }

  _onKey(e) {
    if (this.destroyed) return;
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); this._move('up'); break;
      case 'ArrowDown': e.preventDefault(); this._move('down'); break;
      case 'ArrowLeft': e.preventDefault(); this._move('left'); break;
      case 'ArrowRight': e.preventDefault(); this._move('right'); break;
    }
  }

  _loadBest() { try { this.bestScore = parseInt(localStorage.getItem(this.storageKey)) || 0; } catch {} }
  _saveBest() { try { localStorage.setItem(this.storageKey, this.bestScore.toString()); } catch {} }
}

// ════════════════════════════════════════════════════════════════════════
// WORD SEARCH
// ════════════════════════════════════════════════════════════════════════
class WordSearchPuzzle {
  constructor(container) {
    this.container = container;
    this.wrapper = null;
    this.destroyed = false;
    this.gridSize = 12;
    this.grid = [];
    this.words = [];
    this.foundWords = new Set();
    this.wordPlacements = []; // { word, cells: [[r,c], ...] }
    this.selecting = false;
    this.selectStart = null;
    this.selectEnd = null;
    this.selectedCells = [];
    this.theme = 'cyber';
    this.timerStart = 0;
    this.timerInterval = null;
    this.elapsed = 0;

    this.themes = {
      cyber: ['NEURAL', 'MATRIX', 'CIPHER', 'HACKER', 'PROXY', 'DAEMON', 'KERNEL', 'BINARY', 'QUANTUM', 'FIREWALL', 'ENCRYPT', 'MALWARE', 'PHISHING', 'BOTNET', 'PAYLOAD'],
      tech: ['JAVASCRIPT', 'PYTHON', 'DOCKER', 'KUBERNETES', 'WEBPACK', 'REACT', 'NODEJS', 'SERVER', 'DATABASE', 'CLOUD', 'API', 'FRONTEND', 'BACKEND', 'DEPLOY', 'CACHE'],
      mystic: ['ALCHEMY', 'ORACLE', 'TAROT', 'RUNES', 'ASTRAL', 'MYSTIC', 'CRYSTAL', 'SHADOW', 'PHANTOM', 'ARCANE', 'ELIXIR', 'TALISMAN', 'ENCHANT', 'SPIRIT', 'COSMIC']
    };
  }

  render() {
    this._buildDOM();
    this._newGame();
  }

  destroy() {
    this.destroyed = true;
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.wrapper && this.wrapper.parentNode) this.wrapper.parentNode.removeChild(this.wrapper);
  }

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.style.cssText = `display: flex; flex-direction: column; align-items: center; width: 100%;`;
    this.container.appendChild(this.wrapper);
  }

  _newGame() {
    this.foundWords = new Set();
    this.wordPlacements = [];
    this.selectedCells = [];
    this.selecting = false;

    // Pick words
    const themeWords = this.themes[this.theme] || this.themes.cyber;
    const shuffled = [...themeWords].sort(() => Math.random() - 0.5);
    this.words = shuffled.slice(0, Math.min(8, shuffled.length));

    // Generate grid
    this.grid = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(''));

    // Place words
    const directions = [[0,1],[1,0],[1,1],[-1,1],[1,-1],[-1,-1],[0,-1],[-1,0]];
    for (const word of this.words) {
      let placed = false;
      for (let attempt = 0; attempt < 100 && !placed; attempt++) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const maxR = this.gridSize - (dir[0] !== 0 ? word.length : 1);
        const maxC = this.gridSize - (dir[1] !== 0 ? word.length : 1);
        const startR = Math.floor(Math.random() * Math.max(1, maxR));
        const startC = Math.floor(Math.random() * Math.max(1, maxC));

        let valid = true;
        const cells = [];
        for (let i = 0; i < word.length; i++) {
          const r = startR + dir[0] * i;
          const c = startC + dir[1] * i;
          if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) { valid = false; break; }
          if (this.grid[r][c] !== '' && this.grid[r][c] !== word[i]) { valid = false; break; }
          cells.push([r, c]);
        }

        if (valid) {
          for (let i = 0; i < word.length; i++) {
            this.grid[cells[i][0]][cells[i][1]] = word[i];
          }
          this.wordPlacements.push({ word, cells });
          placed = true;
        }
      }
    }

    // Fill remaining with random letters
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.grid[r][c] === '') {
          this.grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
      }
    }

    // Timer
    this.timerStart = Date.now();
    this.elapsed = 0;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.elapsed = Math.floor((Date.now() - this.timerStart) / 1000);
      const el = this.wrapper.querySelector('#ws-timer');
      if (el) el.textContent = this._fmtTime(this.elapsed);
    }, 1000);

    this._renderGrid();
  }

  _renderGrid() {
    const cellSize = Math.min(32, Math.floor(400 / this.gridSize));
    const foundCount = this.foundWords.size;
    const totalCount = this.wordPlacements.length;

    this.wrapper.innerHTML = `
      <div style="display: flex; justify-content: space-between; width: 100%; max-width: ${this.gridSize * cellSize + 160}px; margin-bottom: 8px;">
        <div style="display: flex; gap: 6px;">
          ${Object.keys(this.themes).map(t => `
            <button data-theme="${t}" style="
              padding: 3px 8px; background: ${this.theme === t ? 'rgba(255,0,60,0.3)' : 'rgba(255,255,255,0.05)'};
              border: 1px solid ${this.theme === t ? '#ff003c' : 'rgba(255,255,255,0.1)'};
              color: ${this.theme === t ? '#ff003c' : '#888'}; font-family: 'Courier New', monospace;
              font-size: 10px; cursor: pointer; text-transform: uppercase;
            ">${t}</button>
          `).join('')}
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <span id="ws-timer" style="color: #888; font-size: 12px;">${this._fmtTime(this.elapsed)}</span>
          <button id="ws-new" style="
            padding: 3px 8px; background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3);
            color: #00ff88; font-family: 'Courier New', monospace; font-size: 10px; cursor: pointer;
          ">NEW</button>
        </div>
      </div>
      <div style="display: flex; gap: 16px; align-items: flex-start;">
        <div id="ws-grid" style="
          display: inline-grid; grid-template-columns: repeat(${this.gridSize}, ${cellSize}px);
          gap: 1px; background: rgba(255,0,60,0.08); border: 2px solid rgba(255,0,60,0.25);
          padding: 4px; box-shadow: 0 0 15px rgba(255,0,60,0.15); user-select: none;
        "></div>
        <div id="ws-wordlist" style="min-width: 120px;"></div>
      </div>
      <div id="ws-status" style="color: #888; font-size: 12px; margin-top: 8px;"></div>
    `;

    const gridEl = this.wrapper.querySelector('#ws-grid');
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = document.createElement('div');
        cell.dataset.row = r;
        cell.dataset.col = c;

        // Check if in found word
        let isFound = false;
        for (const wp of this.wordPlacements) {
          if (this.foundWords.has(wp.word)) {
            if (wp.cells.some(([pr, pc]) => pr === r && pc === c)) {
              isFound = true;
              break;
            }
          }
        }

        // Check if currently selected
        const isSelected = this.selectedCells.some(([sr, sc]) => sr === r && sc === c);

        cell.style.cssText = `
          width: ${cellSize}px; height: ${cellSize}px; display: flex; align-items: center; justify-content: center;
          background: ${isFound ? 'rgba(0,255,136,0.2)' : isSelected ? 'rgba(255,0,60,0.3)' : 'rgba(10,10,20,0.9)'};
          color: ${isFound ? '#00ff88' : '#ff4488'}; font-size: ${cellSize * 0.45}px; font-weight: bold;
          cursor: pointer; transition: background 0.1s; text-shadow: 0 0 3px currentColor;
        `;
        cell.textContent = this.grid[r][c];

        cell.addEventListener('mousedown', (e) => { e.preventDefault(); this._startSelect(r, c); });
        cell.addEventListener('mouseover', () => { if (this.selecting) this._updateSelect(r, c); });
        cell.addEventListener('mouseup', () => this._endSelect());

        gridEl.appendChild(cell);
      }
    }

    // Word list
    const wordList = this.wrapper.querySelector('#ws-wordlist');
    wordList.innerHTML = this.words.map(w => {
      const found = this.foundWords.has(w);
      return `<div style="
        color: ${found ? '#00ff88' : '#888'}; font-size: 11px; margin: 3px 0;
        text-decoration: ${found ? 'line-through' : 'none'};
        text-shadow: ${found ? '0 0 5px #00ff88' : 'none'};
      ">${found ? '✓' : '○'} ${w}</div>`;
    }).join('');

    // Bind controls
    this.wrapper.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => { this.theme = btn.dataset.theme; this._newGame(); });
    });
    this.wrapper.querySelector('#ws-new').addEventListener('click', () => this._newGame());

    // Global mouseup
    document.addEventListener('mouseup', () => this._endSelect(), { once: true });
  }

  _startSelect(r, c) {
    this.selecting = true;
    this.selectStart = { r, c };
    this.selectEnd = { r, c };
    this._updateSelectedCells();
    this._renderGrid();
  }

  _updateSelect(r, c) {
    if (!this.selecting) return;
    this.selectEnd = { r, c };
    this._updateSelectedCells();
    this._renderGrid();
  }

  _updateSelectedCells() {
    this.selectedCells = [];
    if (!this.selectStart || !this.selectEnd) return;

    const sr = this.selectStart.r, sc = this.selectStart.c;
    const er = this.selectEnd.r, ec = this.selectEnd.c;
    const dr = Math.sign(er - sr) || 0;
    const dc = Math.sign(ec - sc) || 0;

    // Only allow straight lines (horizontal, vertical, diagonal)
    const len = Math.max(Math.abs(er - sr), Math.abs(ec - sc)) + 1;
    if (len <= 1) {
      this.selectedCells = [[sr, sc]];
      return;
    }

    // Validate direction
    const rowDiff = er - sr;
    const colDiff = ec - sc;
    if (rowDiff !== 0 && colDiff !== 0 && Math.abs(rowDiff) !== Math.abs(colDiff)) {
      this.selectedCells = [[sr, sc]];
      return;
    }

    for (let i = 0; i < len; i++) {
      const r = sr + dr * i;
      const c = sc + dc * i;
      if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) {
        this.selectedCells.push([r, c]);
      }
    }
  }

  _endSelect() {
    if (!this.selecting) return;
    this.selecting = false;

    // Check if selected cells form a word
    const selectedWord = this.selectedCells.map(([r, c]) => this.grid[r][c]).join('');
    const reversedWord = selectedWord.split('').reverse().join('');

    for (const wp of this.wordPlacements) {
      if (!this.foundWords.has(wp.word)) {
        if (selectedWord === wp.word || reversedWord === wp.word) {
          // Check if cells match the placement
          const matchForward = wp.cells.length === this.selectedCells.length &&
            wp.cells.every(([r, c], i) => this.selectedCells[i][0] === r && this.selectedCells[i][1] === c);
          const reversedSelected = [...this.selectedCells].reverse();
          const matchBackward = wp.cells.length === reversedSelected.length &&
            wp.cells.every(([r, c], i) => reversedSelected[i][0] === r && reversedSelected[i][1] === c);

          if (matchForward || matchBackward || selectedWord === wp.word || reversedWord === wp.word) {
            this.foundWords.add(wp.word);
            break;
          }
        }
      }
    }

    this.selectedCells = [];
    this.selectStart = null;
    this.selectEnd = null;
    this._renderGrid();

    // Check win
    if (this.foundWords.size === this.wordPlacements.length) {
      if (this.timerInterval) clearInterval(this.timerInterval);
      const status = this.wrapper.querySelector('#ws-status');
      if (status) status.innerHTML = `<span style="color: #00ff88; text-shadow: 0 0 10px #00ff88;">✦ ALL WORDS FOUND — ${this._fmtTime(this.elapsed)} ✦</span>`;
    }
  }

  _fmtTime(s) { const m = Math.floor(s/60); return `${m}:${(s%60).toString().padStart(2,'0')}`; }
}
