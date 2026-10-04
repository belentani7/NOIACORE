/**
 * NEXUS OS — Blackjack
 * Card game with dealer AI, betting system, and neon aesthetic.
 */
class Blackjack {
  constructor(container) {
    this.container = container;
    this.deck = [];
    this.playerHand = [];
    this.dealerHand = [];
    this.playerScore = 0;
    this.dealerScore = 0;
    this.bet = 10;
    this.chips = 100;
    this.gameOver = false;
    this.playerTurn = false;
    this.scores = { wins: 0, losses: 0, pushes: 0, blackjacks: 0 };
    this.storageKey = 'nexus_blackjack_scores';
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
    this.wrapper.className = 'bj-wrapper';
    this.wrapper.innerHTML = `
      <div class="bj-container">
        <h1 class="bj-title">BLACKJACK</h1>
        <div class="bj-hud">
          <div class="bj-stat">WINS: <span id="bj-wins">${this.scores.wins}</span></div>
          <div class="bj-stat">CHIPS: <span id="bj-chips">${this.chips}</span></div>
          <div class="bj-stat">BET: <span id="bj-bet">${this.bet}</span></div>
        </div>
        <div class="bj-table">
          <div class="bj-hand-section">
            <div class="bj-hand-label">DEALER (<span id="bj-dealer-score">0</span>)</div>
            <div class="bj-hand" id="bj-dealer-hand"></div>
          </div>
          <div class="bj-hand-section">
            <div class="bj-hand-label">YOU (<span id="bj-player-score">0</span>)</div>
            <div class="bj-hand" id="bj-player-hand"></div>
          </div>
        </div>
        <div class="bj-message" id="bj-message"></div>
        <div class="bj-controls">
          <button class="bj-btn" id="bj-hit">HIT</button>
          <button class="bj-btn" id="bj-stand">STAND</button>
          <button class="bj-btn" id="bj-double">DOUBLE</button>
          <button class="bj-btn bj-btn-secondary" id="bj-deal">DEAL</button>
        </div>
        <div class="bj-bet-controls">
          <button class="bj-bet-btn" data-amount="5">+5</button>
          <button class="bj-bet-btn" data-amount="10">+10</button>
          <button class="bj-bet-btn" data-amount="25">+25</button>
          <button class="bj-bet-btn" data-amount="-10">-10</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.wrapper);
    document.getElementById('bj-hit').addEventListener('click', () => this._hit());
    document.getElementById('bj-stand').addEventListener('click', () => this._stand());
    document.getElementById('bj-double').addEventListener('click', () => this._double());
    document.getElementById('bj-deal').addEventListener('click', () => this._deal());
    document.querySelectorAll('.bj-bet-btn').forEach(btn => {
      btn.addEventListener('click', () => this._adjustBet(parseInt(btn.dataset.amount)));
    });
    this._updateButtons();
  }

  _newGame() {
    this.deck = this._createDeck();
    this._shuffleDeck();
    this.playerHand = [];
    this.dealerHand = [];
    this.playerScore = 0;
    this.dealerScore = 0;
    this.gameOver = true;
    this.playerTurn = false;
    this._renderHands();
    this._showMessage('PLACE YOUR BET AND DEAL');
    this._updateButtons();
  }

  _createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ suit, value });
      }
    }
    return deck;
  }

  _shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  _deal() {
    if (this.bet > this.chips) {
      this._showMessage('NOT ENOUGH CHIPS!');
      return;
    }
    this.deck = this._createDeck();
    this._shuffleDeck();
    this.playerHand = [this._drawCard(), this._drawCard()];
    this.dealerHand = [this._drawCard(), this._drawCard()];
    this.playerScore = this._calculateScore(this.playerHand);
    this.dealerScore = this._calculateScore(this.dealerHand);
    this.chips -= this.bet;
    this.gameOver = false;
    this.playerTurn = true;
    this._renderHands();
    if (this.playerScore === 21) {
      this._stand();
    } else {
      this._showMessage('HIT OR STAND?');
    }
    this._updateButtons();
  }

  _drawCard() {
    return this.deck.pop();
  }

  _calculateScore(hand) {
    let score = 0;
    let aces = 0;
    for (const card of hand) {
      if (card.value === 'A') {
        aces++;
        score += 11;
      } else if (['J', 'Q', 'K'].includes(card.value)) {
        score += 10;
      } else {
        score += parseInt(card.value);
      }
    }
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
  }

  _hit() {
    if (!this.playerTurn || this.gameOver) return;
    this.playerHand.push(this._drawCard());
    this.playerScore = this._calculateScore(this.playerHand);
    this._renderHands();
    if (this.playerScore > 21) {
      this._endGame('bust');
    } else if (this.playerScore === 21) {
      this._stand();
    }
  }

  _stand() {
    if (!this.playerTurn || this.gameOver) return;
    this.playerTurn = false;
    while (this.dealerScore < 17) {
      this.dealerHand.push(this._drawCard());
      this.dealerScore = this._calculateScore(this.dealerHand);
    }
    this._renderHands();
    if (this.dealerScore > 21) {
      this._endGame('dealer-bust');
    } else if (this.dealerScore > this.playerScore) {
      this._endGame('lose');
    } else if (this.dealerScore < this.playerScore) {
      this._endGame('win');
    } else {
      this._endGame('push');
    }
  }

  _double() {
    if (!this.playerTurn || this.playerHand.length !== 2 || this.bet > this.chips) return;
    this.chips -= this.bet;
    this.bet *= 2;
    this._hit();
    if (!this.gameOver) {
      this._stand();
    }
    this.bet /= 2;
  }

  _endGame(result) {
    this.gameOver = true;
    let message = '';
    switch (result) {
      case 'bust':
        message = 'BUST! YOU LOSE!';
        this.scores.losses++;
        break;
      case 'dealer-bust':
        message = 'DEALER BUSTS! YOU WIN!';
        this.chips += this.bet * 2;
        this.scores.wins++;
        break;
      case 'win':
        message = 'YOU WIN!';
        this.chips += this.bet * 2;
        this.scores.wins++;
        if (this.playerScore === 21 && this.playerHand.length === 2) {
          message = 'BLACKJACK!';
          this.chips += this.bet * 0.5;
          this.scores.blackjacks++;
        }
        break;
      case 'lose':
        message = 'DEALER WINS!';
        this.scores.losses++;
        break;
      case 'push':
        message = 'PUSH! BET RETURNED';
        this.chips += this.bet;
        this.scores.pushes++;
        break;
    }
    this._showMessage(message);
    this._saveScores();
    this._updateHUD();
    this._updateButtons();
  }

  _adjustBet(amount) {
    if (this.playerTurn) return;
    this.bet = Math.max(5, Math.min(this.chips, this.bet + amount));
    this._updateHUD();
  }

  _renderHands() {
    const dealerHandEl = document.getElementById('bj-dealer-hand');
    const playerHandEl = document.getElementById('bj-player-hand');
    dealerHandEl.innerHTML = '';
    playerHandEl.innerHTML = '';
    this.dealerHand.forEach((card, idx) => {
      if (!this.gameOver && this.playerTurn && idx === 1) {
        dealerHandEl.innerHTML += '<div class="bj-card bj-card-hidden">?</div>';
      } else {
        const red = card.suit === '♥' || card.suit === '♦';
        dealerHandEl.innerHTML += `<div class="bj-card ${red ? 'red' : 'black'}">${card.value}${card.suit}</div>`;
      }
    });
    this.playerHand.forEach(card => {
      const red = card.suit === '♥' || card.suit === '♦';
      playerHandEl.innerHTML += `<div class="bj-card ${red ? 'red' : 'black'}">${card.value}${card.suit}</div>`;
    });
    const dealerScore = (!this.gameOver && this.playerTurn) ? this._calculateScore([this.dealerHand[0]]) : this.dealerScore;
    document.getElementById('bj-dealer-score').textContent = dealerScore;
    document.getElementById('bj-player-score').textContent = this.playerScore;
    this._updateHUD();
  }

  _updateHUD() {
    document.getElementById('bj-wins').textContent = this.scores.wins;
    document.getElementById('bj-chips').textContent = this.chips;
    document.getElementById('bj-bet').textContent = this.bet;
  }

  _updateButtons() {
    document.getElementById('bj-hit').disabled = !this.playerTurn;
    document.getElementById('bj-stand').disabled = !this.playerTurn;
    document.getElementById('bj-double').disabled = !this.playerTurn || this.playerHand.length !== 2 || this.bet > this.chips;
    document.getElementById('bj-deal').disabled = this.playerTurn;
  }

  _showMessage(msg) {
    document.getElementById('bj-message').textContent = msg;
  }

  _loadScores() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.scores = data.scores || this.scores;
        this.chips = data.chips || 100;
      }
    } catch {}
  }

  _saveScores() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({ scores: this.scores, chips: this.chips }));
    } catch {}
  }
}

window.Blackjack = Blackjack;
