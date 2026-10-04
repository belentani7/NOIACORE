/**
 * NEXUS OS — Memory Card Game
 * Neon-themed card matching game with multiple themes, grid sizes,
 * combo system, hints, and high score tracking.
 */
class MemoryGame {
  constructor(container) {
    this.container = container;
    this.destroyed = false;
    this.gridEl = null;
    this.wrapper = null;
    this.menuOverlay = null;

    // Game config
    this.gridSize = 4; // 4, 6, 8
    this.theme = 'neon'; // neon, tarot, circuit, alchemy, zodiac
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.totalPairs = 0;
    this.moves = 0;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.timerStart = 0;
    this.timerInterval = null;
    this.elapsedSeconds = 0;
    this.gameActive = false;
    this.processing = false; // lock during flip animation

    // Hints
    this.hintCount = 3;
    this.hintActive = false;

    // High scores
    this.storageKey = 'nexus_memory_scores';
    this.highScores = {};

    // Theme symbol sets
    this.themes = {
      neon: {
        name: 'Neon Symbols',
        symbols: ['⚡', '◆', '★', '▲', '●', '■', '✦', '◈', '⬡', '⬢', '✶', '⊕', '⊗', '⊙', '◉', '⟐',
                   '⧫', '⬟', '⏣', '⎔', '⏢', '⌬', '⏥', '⏦', '☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷']
      },
      tarot: {
        name: 'Tarot',
        symbols: ['☉', '☽', '♃', '♄', '⚹', '♅', '♆', '♇', '⊛', '✡', '⚶', '⚷', '⚸', '⚴', '⚵', '☿',
                   '♀', '♂', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '⚳', '☊']
      },
      circuit: {
        name: 'Circuit Board',
        symbols: ['⊞', '⊟', '⊠', '⊡', '⊚', '⊜', '⊝', '⊘', '⊗', '⊙', '⊛', '⊜', '⌘', '⌥', '⌦', '⌫',
                   '⎋', '⏏', '⏎', '⏚', '⏛', '⏻', '⏼', '⏽', '⏾', '⏿', '◉', '◎', '◍', '◌', '○', '●']
      },
      alchemy: {
        name: 'Alchemy',
        symbols: ['🜁', '🜂', '🜃', '🜄', '🜅', '🜆', '🜇', '🜈', '🜉', '🜊', '🜋', '🜌', '🜍', '🜎', '🜏', '🜐',
                   '🜑', '🜒', '🜓', '🜔', '🜕', '🜖', '🜗', '🜘', '🜙', '🜚', '🜛', '🜜', '🜝', '🜞', '🜟', '🜠']
      },
      zodiac: {
        name: 'Zodiac',
        symbols: ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '⛎', '☽', '☉', '⚹',
                   '✡', '☿', '♀', '♂', '♃', '♄', '♅', '♆', '♇', '⚶', '⚷', '⚸', '⊛', '◈', '⬡', '✶']
      }
    };

    // Colors for card faces
    this.neonColors = [
      '#ff003c', '#00f0ff', '#ff6600', '#00ff88', '#aa66ff',
      '#ffff00', '#ff2d6b', '#66ccff', '#ff4488', '#88ff00',
      '#ff00ff', '#00ffcc', '#ff8800', '#4488ff', '#ff4444',
      '#44ffaa', '#ff66cc', '#66ff66', '#ffaa00', '#8866ff',
      '#ff0066', '#00ccff', '#ff8844', '#22ff88', '#cc44ff',
      '#ffcc00', '#ff2266', '#00ddcc', '#ff6688', '#44aaff',
      '#dd00ff', '#88ff44'
    ];
  }

  render() {
    this._loadScores();
    this._buildDOM();
    this._showMenu();
  }

  destroy() {
    this.destroyed = true;
    this.gameActive = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  // ── DOM ────────────────────────────────────────────────────────────

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.style.cssText = `
      width: 100%; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center; background: #0a0a0f;
      position: relative; overflow: hidden; font-family: 'Courier New', monospace;
    `;
    this.container.appendChild(this.wrapper);

    // Menu overlay
    this.menuOverlay = document.createElement('div');
    this.menuOverlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(10, 10, 15, 0.95); z-index: 10; overflow-y: auto;
    `;
    this.wrapper.appendChild(this.menuOverlay);

    // Game area (hidden initially)
    this.gameArea = document.createElement('div');
    this.gameArea.style.cssText = `
      display: none; flex-direction: column; align-items: center;
      width: 100%; height: 100%; padding: 10px; box-sizing: border-box;
    `;
    this.wrapper.appendChild(this.gameArea);

    // HUD bar
    this.hud = document.createElement('div');
    this.hud.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      width: 100%; max-width: 700px; padding: 8px 12px; margin-bottom: 10px;
      background: rgba(255, 0, 60, 0.05); border: 1px solid rgba(255, 0, 60, 0.15);
    `;
    this.gameArea.appendChild(this.hud);

    // Grid container
    this.gridEl = document.createElement('div');
    this.gridEl.style.cssText = `
      display: grid; gap: 6px; max-width: 700px; max-height: calc(100% - 60px);
      width: 100%; aspect-ratio: 1; margin: 0 auto;
    `;
    this.gameArea.appendChild(this.gridEl);

    // Particles container
    this.particlesEl = document.createElement('div');
    this.particlesEl.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 5; overflow: hidden;
    `;
    this.wrapper.appendChild(this.particlesEl);
  }

  _showMenu() {
    this.gameArea.style.display = 'none';
    this.menuOverlay.style.display = 'flex';

    const themesHTML = Object.entries(this.themes).map(([key, t]) => `
      <button data-theme="${key}" style="
        padding: 6px 14px; background: ${this.theme === key ? 'rgba(255,0,60,0.3)' : 'rgba(255,255,255,0.05)'};
        border: 1px solid ${this.theme === key ? '#ff003c' : 'rgba(255,255,255,0.1)'};
        color: ${this.theme === key ? '#ff003c' : '#888'}; font-family: 'Courier New', monospace;
        font-size: 11px; cursor: pointer; text-transform: uppercase; transition: all 0.2s;
      ">${t.name}</button>
    `).join('');

    const scoresForConfig = this.highScores[`${this.gridSize}x${this.gridSize}_${this.theme}`];
    let scoresHTML = '';
    if (scoresForConfig && scoresForConfig.length > 0) {
      scoresHTML = `
        <div style="margin-top: 15px;">
          <div style="color: #ff003c; font-size: 12px; margin-bottom: 5px;">BEST SCORES (${this.gridSize}×${this.gridSize})</div>
          ${scoresForConfig.slice(0, 3).map((s, i) => `
            <div style="color: ${i === 0 ? '#ff003c' : '#666'}; font-size: 11px;">
              ${i + 1}. ${s.score} pts — ${s.moves} moves — ${this._formatTime(s.time)}
            </div>
          `).join('')}
        </div>
      `;
    }

    this.menuOverlay.innerHTML = `
      <div style="text-align: center; max-width: 500px;">
        <h1 style="color: #ff003c; font-size: 36px; margin: 0 0 8px; text-shadow: 0 0 20px #ff003c, 0 0 40px rgba(255,0,60,0.5);
          font-family: 'Courier New', monospace; letter-spacing: 4px;">MEMORY</h1>
        <p style="color: #ff4488; font-size: 12px; margin: 0 0 20px; text-shadow: 0 0 8px #ff4488;">
          MATCH THE NEON PAIRS
        </p>

        <div style="margin-bottom: 15px;">
          <div style="color: #888; font-size: 11px; margin-bottom: 6px;">GRID SIZE</div>
          <div style="display: flex; gap: 8px; justify-content: center;">
            ${[4, 6, 8].map(s => `
              <button data-size="${s}" style="
                padding: 6px 16px; background: ${this.gridSize === s ? 'rgba(255,0,60,0.3)' : 'rgba(255,255,255,0.05)'};
                border: 1px solid ${this.gridSize === s ? '#ff003c' : 'rgba(255,255,255,0.1)'};
                color: ${this.gridSize === s ? '#ff003c' : '#888'}; font-family: 'Courier New', monospace;
                font-size: 13px; cursor: pointer; transition: all 0.2s;
              ">${s}×${s}</button>
            `).join('')}
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <div style="color: #888; font-size: 11px; margin-bottom: 6px;">THEME</div>
          <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
            ${themesHTML}
          </div>
        </div>

        <button id="mem-start-btn" style="
          padding: 10px 35px; background: rgba(255, 0, 60, 0.2); border: 2px solid #ff003c;
          color: #ff003c; font-family: 'Courier New', monospace; font-size: 14px;
          cursor: pointer; letter-spacing: 2px; text-transform: uppercase;
          text-shadow: 0 0 8px #ff003c; box-shadow: 0 0 15px rgba(255,0,60,0.3);
        ">START GAME</button>

        ${scoresHTML}
      </div>
    `;

    // Bind size buttons
    this.menuOverlay.querySelectorAll('[data-size]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.gridSize = parseInt(btn.dataset.size);
        this._showMenu();
      });
    });

    // Bind theme buttons
    this.menuOverlay.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.theme = btn.dataset.theme;
        this._showMenu();
      });
    });

    // Start
    this.menuOverlay.querySelector('#mem-start-btn').addEventListener('click', () => {
      this._startGame();
    });
  }

  _startGame() {
    this.menuOverlay.style.display = 'none';
    this.gameArea.style.display = 'flex';

    // Reset state
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.moves = 0;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.processing = false;
    this.hintCount = this.gridSize <= 4 ? 3 : 2;
    this.hintActive = false;
    this.gameActive = true;

    // Generate cards
    this.totalPairs = (this.gridSize * this.gridSize) / 2;
    const symbols = this.themes[this.theme].symbols.slice(0, this.totalPairs);
    const cardPairs = [...symbols, ...symbols];
    this._shuffle(cardPairs);

    this.cards = cardPairs.map((symbol, i) => ({
      id: i,
      symbol: symbol,
      color: this.neonColors[i % this.neonColors.length],
      flipped: false,
      matched: false,
      index: i
    }));

    this._renderGrid();
    this._updateHUD();

    // Start timer
    this.timerStart = Date.now();
    this.elapsedSeconds = 0;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.gameActive) return;
      this.elapsedSeconds = Math.floor((Date.now() - this.timerStart) / 1000);
      this._updateTimerDisplay();
    }, 1000);
  }

  _renderGrid() {
    this.gridEl.innerHTML = '';
    this.gridEl.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

    const cardSize = this.gridSize <= 4 ? '90px' : this.gridSize <= 6 ? '70px' : '55px';
    const fontSize = this.gridSize <= 4 ? '32px' : this.gridSize <= 6 ? '24px' : '18px';

    for (const card of this.cards) {
      const cardEl = document.createElement('div');
      cardEl.dataset.index = card.index;
      cardEl.style.cssText = `
        width: ${cardSize}; height: ${cardSize}; perspective: 600px; cursor: pointer;
        max-width: 100%; max-height: 100%;
      `;

      const inner = document.createElement('div');
      inner.className = 'mem-card-inner';
      inner.style.cssText = `
        width: 100%; height: 100%; position: relative;
        transform-style: preserve-3d; transition: transform 0.4s ease;
      `;

      // Card back
      const back = document.createElement('div');
      back.style.cssText = `
        position: absolute; width: 100%; height: 100%; backface-visibility: hidden;
        display: flex; align-items: center; justify-content: center;
        background: linear-gradient(135deg, rgba(255,0,60,0.1), rgba(255,0,60,0.02));
        border: 1px solid rgba(255, 0, 60, 0.25);
        box-shadow: 0 0 8px rgba(255,0,60,0.1), inset 0 0 15px rgba(255,0,60,0.05);
      `;
      back.innerHTML = `
        <div style="color: rgba(255,0,60,0.3); font-size: ${fontSize}; text-shadow: 0 0 5px rgba(255,0,60,0.2);">◈</div>
      `;

      // Card front
      const front = document.createElement('div');
      front.style.cssText = `
        position: absolute; width: 100%; height: 100%; backface-visibility: hidden;
        transform: rotateY(180deg);
        display: flex; align-items: center; justify-content: center;
        background: linear-gradient(135deg, rgba(255,0,60,0.15), rgba(10,10,20,0.9));
        border: 1px solid ${card.color}44;
        box-shadow: 0 0 10px ${card.color}33;
        font-size: ${fontSize}; color: ${card.color};
        text-shadow: 0 0 10px ${card.color};
      `;
      front.textContent = card.symbol;

      inner.appendChild(back);
      inner.appendChild(front);
      cardEl.appendChild(inner);

      cardEl.addEventListener('click', () => this._onCardClick(card.index));

      this.gridEl.appendChild(cardEl);
      card._el = cardEl;
      card._innerEl = inner;
    }
  }

  _onCardClick(index) {
    if (!this.gameActive || this.processing || this.hintActive) return;

    const card = this.cards[index];
    if (card.flipped || card.matched) return;
    if (this.flippedCards.length >= 2) return;

    // Flip the card
    this._flipCard(card, true);
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.moves++;
      this.processing = true;

      const [a, b] = this.flippedCards;

      if (a.symbol === b.symbol) {
        // Match!
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        const comboMultiplier = Math.min(this.combo, 5);
        const points = 100 * comboMultiplier;
        this.score += points;

        setTimeout(() => {
          a.matched = true;
          b.matched = true;
          this.matchedPairs++;
          this._celebrateMatch(a, b);
          this.flippedCards = [];
          this.processing = false;
          this._updateHUD();

          if (this.matchedPairs >= this.totalPairs) {
            this._winGame();
          }
        }, 500);
      } else {
        // Mismatch
        this.combo = 0;
        setTimeout(() => {
          this._flipCard(a, false);
          this._flipCard(b, false);
          this._shakeCard(a);
          this._shakeCard(b);
          this.flippedCards = [];
          this.processing = false;
          this._updateHUD();
        }, 800);
      }
    }
  }

  _flipCard(card, faceUp) {
    card.flipped = faceUp;
    if (card._innerEl) {
      card._innerEl.style.transform = faceUp ? 'rotateY(180deg)' : 'rotateY(0deg)';
    }
  }

  _shakeCard(card) {
    if (!card._el) return;
    const el = card._el;
    el.style.transition = 'transform 0.1s';
    el.style.transform = 'translateX(-5px)';
    setTimeout(() => { el.style.transform = 'translateX(5px)'; }, 100);
    setTimeout(() => { el.style.transform = 'translateX(-3px)'; }, 200);
    setTimeout(() => { el.style.transform = 'translateX(0)'; el.style.transition = ''; }, 300);
  }

  _celebrateMatch(a, b) {
    // Add matched glow
    [a, b].forEach(card => {
      if (card._el) {
        const inner = card._innerEl;
        const front = inner.children[1];
        front.style.boxShadow = `0 0 20px ${card.color}, 0 0 40px ${card.color}44`;
        front.style.borderColor = card.color;
        front.style.transition = 'box-shadow 0.3s';
      }
    });

    // Spawn celebration particles
    this._spawnMatchParticles(a);
    this._spawnMatchParticles(b);
  }

  _spawnMatchParticles(card) {
    if (!card._el || !this.particlesEl) return;
    const rect = card._el.getBoundingClientRect();
    const wrapperRect = this.wrapper.getBoundingClientRect();
    const cx = rect.left - wrapperRect.left + rect.width / 2;
    const cy = rect.top - wrapperRect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      const angle = (Math.PI * 2 / 12) * i;
      const dist = 30 + Math.random() * 50;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const size = 3 + Math.random() * 5;

      particle.style.cssText = `
        position: absolute; left: ${cx}px; top: ${cy}px;
        width: ${size}px; height: ${size}px; border-radius: 50%;
        background: ${card.color}; box-shadow: 0 0 6px ${card.color};
        pointer-events: none; z-index: 6;
        transition: all 0.6s ease-out; opacity: 1;
      `;
      this.particlesEl.appendChild(particle);

      requestAnimationFrame(() => {
        particle.style.transform = `translate(${tx}px, ${ty}px)`;
        particle.style.opacity = '0';
      });

      setTimeout(() => {
        if (particle.parentNode) particle.parentNode.removeChild(particle);
      }, 700);
    }
  }

  _useHint() {
    if (this.hintCount <= 0 || this.hintActive || this.processing) return;
    this.hintCount--;
    this.hintActive = true;

    // Show all unmatched cards briefly
    for (const card of this.cards) {
      if (!card.matched && !card.flipped) {
        this._flipCard(card, true);
      }
    }

    setTimeout(() => {
      for (const card of this.cards) {
        if (!card.matched && !this.flippedCards.includes(card)) {
          this._flipCard(card, false);
        }
      }
      this.hintActive = false;
      this._updateHUD();
    }, 1200);

    this._updateHUD();
  }

  _winGame() {
    this.gameActive = false;
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Calculate final score with time bonus
    const timeBonus = Math.max(0, 300 - this.elapsedSeconds) * 5;
    const moveBonus = Math.max(0, (this.totalPairs * 3 - this.moves) * 10);
    this.score += timeBonus + moveBonus;

    this._saveScore();

    // Show victory overlay after a moment
    setTimeout(() => {
      this.menuOverlay.style.display = 'flex';
      this.menuOverlay.innerHTML = `
        <div style="text-align: center;">
          <h1 style="color: #00ff88; font-size: 36px; margin: 0 0 10px; text-shadow: 0 0 20px #00ff88, 0 0 40px rgba(0,255,136,0.5);
            font-family: 'Courier New', monospace; letter-spacing: 4px;">COMPLETE</h1>
          <p style="color: #88ffaa; font-size: 13px; margin: 0 0 20px;">ALL PAIRS MATCHED</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; text-align: left; margin-bottom: 20px;">
            <span style="color: #888; font-size: 12px;">Score:</span>
            <span style="color: #ff003c; font-size: 12px; text-shadow: 0 0 5px #ff003c;">${this.score}</span>
            <span style="color: #888; font-size: 12px;">Time:</span>
            <span style="color: #ff4488; font-size: 12px;">${this._formatTime(this.elapsedSeconds)}</span>
            <span style="color: #888; font-size: 12px;">Moves:</span>
            <span style="color: #ff4488; font-size: 12px;">${this.moves}</span>
            <span style="color: #888; font-size: 12px;">Max Combo:</span>
            <span style="color: #ffff00; font-size: 12px;">×${this.maxCombo}</span>
            <span style="color: #888; font-size: 12px;">Time Bonus:</span>
            <span style="color: #00ff88; font-size: 12px;">+${timeBonus}</span>
            <span style="color: #888; font-size: 12px;">Move Bonus:</span>
            <span style="color: #00ff88; font-size: 12px;">+${moveBonus}</span>
          </div>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="mem-replay-btn" style="
              padding: 10px 30px; background: rgba(255, 0, 60, 0.2); border: 2px solid #ff003c;
              color: #ff003c; font-family: 'Courier New', monospace; font-size: 13px;
              cursor: pointer; letter-spacing: 2px; text-transform: uppercase;
              text-shadow: 0 0 8px #ff003c;
            ">PLAY AGAIN</button>
            <button id="mem-menu-btn" style="
              padding: 10px 30px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2);
              color: #888; font-family: 'Courier New', monospace; font-size: 13px;
              cursor: pointer; letter-spacing: 2px; text-transform: uppercase;
            ">MENU</button>
          </div>
        </div>
      `;

      this.menuOverlay.querySelector('#mem-replay-btn').addEventListener('click', () => this._startGame());
      this.menuOverlay.querySelector('#mem-menu-btn').addEventListener('click', () => this._showMenu());
    }, 800);
  }

  // ── HUD ────────────────────────────────────────────────────────────

  _updateHUD() {
    this.hud.innerHTML = `
      <div style="display: flex; gap: 20px; align-items: center;">
        <span style="color: #ff003c; font-size: 13px; text-shadow: 0 0 5px #ff003c;">
          SCORE: ${this.score}
        </span>
        ${this.combo > 1 ? `
          <span style="color: #ffff00; font-size: 12px; text-shadow: 0 0 5px #ffff00;">
            COMBO ×${this.combo}
          </span>
        ` : ''}
      </div>
      <div style="display: flex; gap: 15px; align-items: center;">
        <span style="color: #888; font-size: 12px;" id="mem-timer">
          ${this._formatTime(this.elapsedSeconds)}
        </span>
        <span style="color: #888; font-size: 12px;">
          MOVES: ${this.moves}
        </span>
        <span style="color: #888; font-size: 12px;">
          ${this.matchedPairs}/${this.totalPairs}
        </span>
        <button id="mem-hint-btn" style="
          padding: 3px 10px; background: rgba(255,255,0,0.1); border: 1px solid rgba(255,255,0,0.3);
          color: ${this.hintCount > 0 ? '#ffff00' : '#444'}; font-family: 'Courier New', monospace;
          font-size: 11px; cursor: ${this.hintCount > 0 ? 'pointer' : 'default'}; pointer-events: all;
        ">HINT (${this.hintCount})</button>
      </div>
    `;

    const hintBtn = this.hud.querySelector('#mem-hint-btn');
    if (hintBtn && this.hintCount > 0) {
      hintBtn.addEventListener('click', () => this._useHint());
    }
  }

  _updateTimerDisplay() {
    const el = this.hud.querySelector('#mem-timer');
    if (el) el.textContent = this._formatTime(this.elapsedSeconds);
  }

  _formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ── Utils ──────────────────────────────────────────────────────────

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ── Scores ─────────────────────────────────────────────────────────

  _loadScores() {
    try {
      this.highScores = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    } catch { this.highScores = {}; }
  }

  _saveScore() {
    const key = `${this.gridSize}x${this.gridSize}_${this.theme}`;
    if (!this.highScores[key]) this.highScores[key] = [];
    this.highScores[key].push({
      score: this.score,
      moves: this.moves,
      time: this.elapsedSeconds,
      combo: this.maxCombo,
      date: new Date().toISOString().slice(0, 10)
    });
    this.highScores[key].sort((a, b) => b.score - a.score);
    this.highScores[key] = this.highScores[key].slice(0, 5);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.highScores));
    } catch {}
  }
}
