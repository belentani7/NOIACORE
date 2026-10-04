'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Scientific Calculator
 *  Full scientific calculator with programmer mode and graphing
 * ═══════════════════════════════════════════════════════════════
 */
class NexusCalculator {
  constructor(container) {
    this.container = container;
    this.element = null;

    // State
    this.expression = '';
    this.display = '0';
    this.memory = 0;
    this.hasMemory = false;
    this.history = [];
    this.useDegrees = true;
    this.mode = 'standard'; // standard, scientific, programmer, converter, graph

    // Programmer mode
    this.programmerBase = 10; // 2, 8, 10, 16

    // Unit converter
    this.convCategory = 'length';
    this.convFrom = 'm';
    this.convTo = 'km';
    this.convValue = 1;

    // Graph mode
    this.graphFunctions = [{ expr: 'sin(x)', color: '#ff003c' }];
    this.graphXMin = -10;
    this.graphXMax = 10;
    this.graphYMin = -5;
    this.graphYMax = 5;
    this.graphCanvas = null;

    // Unit definitions
    this.units = {
      length: { m: 1, km: 1000, mi: 1609.344, ft: 0.3048, in: 0.0254, cm: 0.01, mm: 0.001, yd: 0.9144 },
      weight: { kg: 1, lb: 0.453592, oz: 0.0283495, g: 0.001, mg: 0.000001, st: 6.35029 },
      temperature: { C: 'special', F: 'special', K: 'special' },
      speed: { 'm/s': 1, 'km/h': 0.277778, mph: 0.44704, knots: 0.514444 },
      data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776, PB: 1125899906842624 }
    };

    this._loadHistory();
  }

  render() {
    const style = document.createElement('style');
    style.textContent = this._getStyles();
    this.container.appendChild(style);
    this._styleEl = style;

    this.element = document.createElement('div');
    this.element.className = 'nexus-calculator';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._bindEvents();
    this._updateDisplay();
  }

  destroy() {
    this._saveHistory();
    if (this._styleEl) this._styleEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <!-- Mode Tabs -->
      <div class="calc-tabs">
        <button class="calc-tab calc-tab-active" data-mode="standard">Std</button>
        <button class="calc-tab" data-mode="scientific">Sci</button>
        <button class="calc-tab" data-mode="programmer">Prog</button>
        <button class="calc-tab" data-mode="converter">Conv</button>
        <button class="calc-tab" data-mode="graph">Graph</button>
      </div>

      <!-- Display -->
      <div class="calc-display">
        <div class="calc-expression" id="calc-expr">&nbsp;</div>
        <div class="calc-result" id="calc-result">0</div>
        <div class="calc-memory-ind" id="calc-mem" style="display:none;">M</div>
        <div class="calc-mode-ind" id="calc-mode-ind">DEG</div>
      </div>

      <!-- Programmer Base Selector (hidden by default) -->
      <div class="calc-base-selector" style="display:none;">
        <button class="calc-base-btn calc-base-active" data-base="10">DEC</button>
        <button class="calc-base-btn" data-base="16">HEX</button>
        <button class="calc-base-btn" data-base="8">OCT</button>
        <button class="calc-base-btn" data-base="2">BIN</button>
      </div>

      <!-- Programmer Multi-base Display (hidden by default) -->
      <div class="calc-prog-display" style="display:none;">
        <div class="calc-prog-row"><span class="calc-prog-label">HEX</span><span class="calc-prog-val" id="prog-hex">0</span></div>
        <div class="calc-prog-row"><span class="calc-prog-label">DEC</span><span class="calc-prog-val" id="prog-dec">0</span></div>
        <div class="calc-prog-row"><span class="calc-prog-label">OCT</span><span class="calc-prog-val" id="prog-oct">0</span></div>
        <div class="calc-prog-row"><span class="calc-prog-label">BIN</span><span class="calc-prog-val calc-prog-bin" id="prog-bin">0</span></div>
      </div>

      <!-- Button Pad -->
      <div class="calc-buttons" id="calc-buttons">
        ${this._getButtonsHTML('standard')}
      </div>

      <!-- Converter Panel (hidden by default) -->
      <div class="calc-converter" style="display:none;">
        <div class="calc-conv-categories">
          <button class="calc-conv-cat calc-conv-cat-active" data-cat="length">Length</button>
          <button class="calc-conv-cat" data-cat="weight">Weight</button>
          <button class="calc-conv-cat" data-cat="temperature">Temp</button>
          <button class="calc-conv-cat" data-cat="speed">Speed</button>
          <button class="calc-conv-cat" data-cat="data">Data</button>
        </div>
        <div class="calc-conv-body">
          <div class="calc-conv-row">
            <input type="number" class="calc-conv-input glass-input" id="conv-from-val" value="1">
            <select class="calc-conv-select" id="conv-from-unit"></select>
          </div>
          <div class="calc-conv-swap" id="conv-swap">⇅</div>
          <div class="calc-conv-row">
            <input type="text" class="calc-conv-output" id="conv-to-val" readonly value="0.001">
            <select class="calc-conv-select" id="conv-to-unit"></select>
          </div>
        </div>
      </div>

      <!-- Graph Panel (hidden by default) -->
      <div class="calc-graph" style="display:none;">
        <div class="calc-graph-controls">
          <input type="text" class="calc-graph-input glass-input" id="graph-input" placeholder="f(x) = e.g. sin(x), x^2" value="sin(x)">
          <button class="calc-graph-add glass-btn" id="graph-add">+ Add</button>
        </div>
        <div class="calc-graph-funcs" id="graph-funcs"></div>
        <canvas class="calc-graph-canvas" id="graph-canvas"></canvas>
        <div class="calc-graph-info">Scroll to zoom • Drag to pan</div>
      </div>

      <!-- History Panel -->
      <div class="calc-history-toggle" id="calc-hist-toggle">History ▾</div>
      <div class="calc-history" id="calc-history" style="display:none;">
        <div class="calc-history-list" id="calc-history-list"></div>
        <button class="calc-history-clear glass-btn" id="calc-hist-clear">Clear History</button>
      </div>
    `;
  }

  _getButtonsHTML(mode) {
    if (mode === 'standard') {
      return `
        <button class="calc-btn calc-btn-fn" data-v="clear">C</button>
        <button class="calc-btn calc-btn-fn" data-v="ce">CE</button>
        <button class="calc-btn calc-btn-fn" data-v="back">⌫</button>
        <button class="calc-btn calc-btn-op" data-v="/">÷</button>

        <button class="calc-btn" data-v="7">7</button>
        <button class="calc-btn" data-v="8">8</button>
        <button class="calc-btn" data-v="9">9</button>
        <button class="calc-btn calc-btn-op" data-v="*">×</button>

        <button class="calc-btn" data-v="4">4</button>
        <button class="calc-btn" data-v="5">5</button>
        <button class="calc-btn" data-v="6">6</button>
        <button class="calc-btn calc-btn-op" data-v="-">−</button>

        <button class="calc-btn" data-v="1">1</button>
        <button class="calc-btn" data-v="2">2</button>
        <button class="calc-btn" data-v="3">3</button>
        <button class="calc-btn calc-btn-op" data-v="+">+</button>

        <button class="calc-btn" data-v="negate">±</button>
        <button class="calc-btn" data-v="0">0</button>
        <button class="calc-btn" data-v=".">.</button>
        <button class="calc-btn calc-btn-eq" data-v="=">=</button>
      `;
    }

    if (mode === 'scientific') {
      return `
        <button class="calc-btn calc-btn-sci" data-v="sin">sin</button>
        <button class="calc-btn calc-btn-sci" data-v="cos">cos</button>
        <button class="calc-btn calc-btn-sci" data-v="tan">tan</button>
        <button class="calc-btn calc-btn-fn" data-v="clear">C</button>
        <button class="calc-btn calc-btn-fn" data-v="back">⌫</button>
        <button class="calc-btn calc-btn-op" data-v="/">÷</button>

        <button class="calc-btn calc-btn-sci" data-v="asin">sin⁻¹</button>
        <button class="calc-btn calc-btn-sci" data-v="acos">cos⁻¹</button>
        <button class="calc-btn calc-btn-sci" data-v="atan">tan⁻¹</button>
        <button class="calc-btn" data-v="7">7</button>
        <button class="calc-btn" data-v="8">8</button>
        <button class="calc-btn" data-v="9">9</button>

        <button class="calc-btn calc-btn-sci" data-v="log">log</button>
        <button class="calc-btn calc-btn-sci" data-v="ln">ln</button>
        <button class="calc-btn calc-btn-sci" data-v="sqrt">√</button>
        <button class="calc-btn" data-v="4">4</button>
        <button class="calc-btn" data-v="5">5</button>
        <button class="calc-btn" data-v="6">6</button>

        <button class="calc-btn calc-btn-sci" data-v="x2">x²</button>
        <button class="calc-btn calc-btn-sci" data-v="x3">x³</button>
        <button class="calc-btn calc-btn-sci" data-v="pow">xⁿ</button>
        <button class="calc-btn" data-v="1">1</button>
        <button class="calc-btn" data-v="2">2</button>
        <button class="calc-btn" data-v="3">3</button>

        <button class="calc-btn calc-btn-sci" data-v="pi">π</button>
        <button class="calc-btn calc-btn-sci" data-v="e">e</button>
        <button class="calc-btn calc-btn-sci" data-v="phi">φ</button>
        <button class="calc-btn" data-v="0">0</button>
        <button class="calc-btn" data-v=".">.</button>
        <button class="calc-btn calc-btn-eq" data-v="=">=</button>

        <button class="calc-btn calc-btn-sci" data-v="fact">n!</button>
        <button class="calc-btn calc-btn-sci" data-v="abs">|x|</button>
        <button class="calc-btn calc-btn-sci" data-v="inv">1/x</button>
        <button class="calc-btn calc-btn-sci" data-v="(">(</button>
        <button class="calc-btn calc-btn-sci" data-v=")">)</button>
        <button class="calc-btn calc-btn-op" data-v="*">×</button>

        <button class="calc-btn calc-btn-mem" data-v="mc">MC</button>
        <button class="calc-btn calc-btn-mem" data-v="mr">MR</button>
        <button class="calc-btn calc-btn-mem" data-v="m+">M+</button>
        <button class="calc-btn calc-btn-mem" data-v="m-">M−</button>
        <button class="calc-btn calc-btn-fn" data-v="deg">DEG</button>
        <button class="calc-btn calc-btn-op" data-v="+">+</button>
      `;
    }

    if (mode === 'programmer') {
      return `
        <button class="calc-btn calc-btn-fn" data-v="clear">C</button>
        <button class="calc-btn calc-btn-fn" data-v="back">⌫</button>
        <button class="calc-btn calc-btn-op" data-v="AND">AND</button>
        <button class="calc-btn calc-btn-op" data-v="/">÷</button>

        <button class="calc-btn" data-v="7">7</button>
        <button class="calc-btn" data-v="8">8</button>
        <button class="calc-btn" data-v="9">9</button>
        <button class="calc-btn calc-btn-op" data-v="*">×</button>

        <button class="calc-btn" data-v="4">4</button>
        <button class="calc-btn" data-v="5">5</button>
        <button class="calc-btn" data-v="6">6</button>
        <button class="calc-btn calc-btn-op" data-v="-">−</button>

        <button class="calc-btn" data-v="1">1</button>
        <button class="calc-btn" data-v="2">2</button>
        <button class="calc-btn" data-v="3">3</button>
        <button class="calc-btn calc-btn-op" data-v="+">+</button>

        <button class="calc-btn calc-btn-op" data-v="OR">OR</button>
        <button class="calc-btn" data-v="0">0</button>
        <button class="calc-btn calc-btn-op" data-v="XOR">XOR</button>
        <button class="calc-btn calc-btn-eq" data-v="=">=</button>

        <button class="calc-btn calc-btn-op" data-v="NOT">NOT</button>
        <button class="calc-btn calc-btn-op" data-v="<<"><<</button>
        <button class="calc-btn calc-btn-op" data-v=">>">>></button>
        <button class="calc-btn calc-btn-op" data-v="%">MOD</button>
      `;
    }

    return '';
  }

  _bindEvents() {
    // Mode tabs
    this.element.querySelector('.calc-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.calc-tab');
      if (!tab) return;
      this._switchMode(tab.dataset.mode);
    });

    // Buttons
    this.element.querySelector('#calc-buttons').addEventListener('click', (e) => {
      const btn = e.target.closest('.calc-btn');
      if (!btn) return;
      this._handleButton(btn.dataset.v);
    });

    // Base selector (programmer)
    this.element.querySelector('.calc-base-selector').addEventListener('click', (e) => {
      const btn = e.target.closest('.calc-base-btn');
      if (!btn) return;
      this.programmerBase = parseInt(btn.dataset.base);
      this.element.querySelectorAll('.calc-base-btn').forEach(b => b.classList.remove('calc-base-active'));
      btn.classList.add('calc-base-active');
      this._updateProgDisplay();
    });

    // Converter
    this.element.querySelector('.calc-conv-categories').addEventListener('click', (e) => {
      const btn = e.target.closest('.calc-conv-cat');
      if (!btn) return;
      this.element.querySelectorAll('.calc-conv-cat').forEach(b => b.classList.remove('calc-conv-cat-active'));
      btn.classList.add('calc-conv-cat-active');
      this.convCategory = btn.dataset.cat;
      this._updateConverter();
    });

    this.element.querySelector('#conv-swap').addEventListener('click', () => {
      [this.convFrom, this.convTo] = [this.convTo, this.convFrom];
      this._updateConverter();
    });

    // Graph
    this.element.querySelector('#graph-add').addEventListener('click', () => this._addGraphFunction());
    this.element.querySelector('#graph-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._addGraphFunction();
    });

    // History
    this.element.querySelector('#calc-hist-toggle').addEventListener('click', () => {
      const hist = this.element.querySelector('#calc-history');
      hist.style.display = hist.style.display === 'none' ? 'flex' : 'none';
    });
    this.element.querySelector('#calc-hist-clear').addEventListener('click', () => {
      this.history = [];
      this._renderHistory();
      this._saveHistory();
    });

    // Keyboard
    this._keyHandler = (e) => this._handleKeyboard(e);
    this.element.addEventListener('keydown', this._keyHandler);
    this.element.tabIndex = 0;

    // Graph canvas interaction
    this.element.querySelector('#graph-canvas').addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.2 : 0.8;
      const cx = (this.graphXMin + this.graphXMax) / 2;
      const cy = (this.graphYMin + this.graphYMax) / 2;
      const hw = (this.graphXMax - this.graphXMin) / 2 * factor;
      const hh = (this.graphYMax - this.graphYMin) / 2 * factor;
      this.graphXMin = cx - hw; this.graphXMax = cx + hw;
      this.graphYMin = cy - hh; this.graphYMax = cy + hh;
      this._renderGraph();
    });

    let dragStart = null;
    const canvas = this.element.querySelector('#graph-canvas');
    canvas.addEventListener('mousedown', (e) => {
      dragStart = { x: e.offsetX, y: e.offsetY, xMin: this.graphXMin, xMax: this.graphXMax, yMin: this.graphYMin, yMax: this.graphYMax };
    });
    canvas.addEventListener('mousemove', (e) => {
      if (!dragStart) return;
      const dx = (e.offsetX - dragStart.x) / canvas.width * (dragStart.xMax - dragStart.xMin);
      const dy = (e.offsetY - dragStart.y) / canvas.height * (dragStart.yMax - dragStart.yMin);
      this.graphXMin = dragStart.xMin - dx;
      this.graphXMax = dragStart.xMax - dx;
      this.graphYMin = dragStart.yMin + dy;
      this.graphYMax = dragStart.yMax + dy;
      this._renderGraph();
    });
    canvas.addEventListener('mouseup', () => { dragStart = null; });
    canvas.addEventListener('mouseleave', () => { dragStart = null; });
  }

  _handleKeyboard(e) {
    const key = e.key;
    if (key >= '0' && key <= '9') this._handleButton(key);
    else if (key === '.') this._handleButton('.');
    else if (key === '+') this._handleButton('+');
    else if (key === '-') this._handleButton('-');
    else if (key === '*') this._handleButton('*');
    else if (key === '/') { e.preventDefault(); this._handleButton('/'); }
    else if (key === 'Enter' || key === '=') { e.preventDefault(); this._handleButton('='); }
    else if (key === 'Backspace') this._handleButton('back');
    else if (key === 'Escape') this._handleButton('clear');
    else if (key === '(') this._handleButton('(');
    else if (key === ')') this._handleButton(')');
    else if (key === '%') this._handleButton('%');
  }

  // ─── Mode Switching ─────────────────────────────────────────────
  _switchMode(mode) {
    this.mode = mode;
    this.element.querySelectorAll('.calc-tab').forEach(t => t.classList.toggle('calc-tab-active', t.dataset.mode === mode));

    const buttons = this.element.querySelector('#calc-buttons');
    const converter = this.element.querySelector('.calc-converter');
    const graph = this.element.querySelector('.calc-graph');
    const baseSelector = this.element.querySelector('.calc-base-selector');
    const progDisplay = this.element.querySelector('.calc-prog-display');

    buttons.style.display = (mode === 'converter' || mode === 'graph') ? 'none' : 'grid';
    converter.style.display = mode === 'converter' ? 'flex' : 'none';
    graph.style.display = mode === 'graph' ? 'flex' : 'none';
    baseSelector.style.display = mode === 'programmer' ? 'flex' : 'none';
    progDisplay.style.display = mode === 'programmer' ? 'block' : 'none';

    if (mode === 'standard' || mode === 'scientific' || mode === 'programmer') {
      buttons.innerHTML = this._getButtonsHTML(mode);
      if (mode === 'scientific') {
        buttons.style.gridTemplateColumns = 'repeat(6, 1fr)';
      } else if (mode === 'programmer') {
        buttons.style.gridTemplateColumns = 'repeat(4, 1fr)';
      } else {
        buttons.style.gridTemplateColumns = 'repeat(4, 1fr)';
      }
    }

    if (mode === 'converter') this._updateConverter();
    if (mode === 'graph') {
      setTimeout(() => this._renderGraph(), 50);
      this._renderGraphFuncs();
    }
    if (mode === 'programmer') this._updateProgDisplay();
  }

  // ─── Button Handler ─────────────────────────────────────────────
  _handleButton(v) {
    switch (v) {
      case 'clear':
        this.expression = '';
        this.display = '0';
        break;

      case 'ce':
        this.display = '0';
        break;

      case 'back':
        if (this.display.length > 1) this.display = this.display.slice(0, -1);
        else this.display = '0';
        break;

      case 'negate':
        if (this.display !== '0') {
          this.display = this.display.startsWith('-') ? this.display.slice(1) : '-' + this.display;
        }
        break;

      case '=':
        this._evaluate();
        break;

      case 'sin': case 'cos': case 'tan':
      case 'asin': case 'acos': case 'atan':
      case 'log': case 'ln': case 'sqrt': case 'cbrt':
        this.expression += v + '(';
        this.display = '0';
        break;

      case 'x2':
        this.expression += '(' + this.display + ')^2';
        this.display = '0';
        break;

      case 'x3':
        this.expression += '(' + this.display + ')^3';
        this.display = '0';
        break;

      case 'pow':
        this.expression += this.display + '^(';
        this.display = '0';
        break;

      case 'fact':
        this.expression += '(' + this.display + ')!';
        this.display = '0';
        break;

      case 'abs':
        this.expression += 'abs(' + this.display + ')';
        this.display = '0';
        break;

      case 'inv':
        this.expression += '1/(' + this.display + ')';
        this.display = '0';
        break;

      case 'pi':
        this.display = String(Math.PI);
        break;

      case 'e':
        this.display = String(Math.E);
        break;

      case 'phi':
        this.display = String((1 + Math.sqrt(5)) / 2);
        break;

      case 'mc':
        this.memory = 0;
        this.hasMemory = false;
        break;

      case 'mr':
        this.display = String(this.memory);
        break;

      case 'm+':
        this.memory += parseFloat(this.display) || 0;
        this.hasMemory = true;
        break;

      case 'm-':
        this.memory -= parseFloat(this.display) || 0;
        this.hasMemory = true;
        break;

      case 'deg':
        this.useDegrees = !this.useDegrees;
        break;

      case 'AND': case 'OR': case 'XOR': case 'NOT':
      case '<<': case '>>':
        this.expression += this.display + ' ' + v + ' ';
        this.display = '0';
        break;

      default:
        // Number, operator, decimal, parens
        if ('0123456789'.includes(v)) {
          if (this.display === '0' && v !== '.') this.display = v;
          else this.display += v;
        } else if (v === '.') {
          if (!this.display.includes('.')) this.display += '.';
        } else if ('+-*/%^'.includes(v)) {
          this.expression += this.display + ' ' + v + ' ';
          this.display = '0';
        } else if (v === '(' || v === ')') {
          this.expression += v;
        }
        break;
    }

    this._updateDisplay();
  }

  // ─── Expression Parser (recursive descent) ─────────────────────
  _evaluate() {
    const fullExpr = this.expression + this.display;
    if (!fullExpr.trim()) return;

    try {
      const result = this._parseExpr(fullExpr.trim());
      const exprDisplay = this._formatExpr(fullExpr);
      this.history.unshift({ expr: exprDisplay, result: this._formatNumber(result) });
      if (this.history.length > 50) this.history.pop();
      this.expression = '';
      this.display = this._formatNumber(result);
      this._renderHistory();
      this._saveHistory();
      if (this.mode === 'programmer') this._updateProgDisplay();
    } catch (e) {
      this.display = 'Error';
      this.expression = '';
    }
    this._updateDisplay();
  }

  _parseExpr(str) {
    str = str.trim();
    let pos = { i: 0 };
    const result = this._parseAddSub(str, pos);
    return result;
  }

  _parseAddSub(str, pos) {
    let left = this._parseMulDiv(str, pos);
    while (pos.i < str.length) {
      this._skipSpaces(str, pos);
      if (pos.i >= str.length) break;
      if (str[pos.i] === '+') { pos.i++; left += this._parseMulDiv(str, pos); }
      else if (str[pos.i] === '-') { pos.i++; left -= this._parseMulDiv(str, pos); }
      else break;
    }
    return left;
  }

  _parseMulDiv(str, pos) {
    let left = this._parsePower(str, pos);
    while (pos.i < str.length) {
      this._skipSpaces(str, pos);
      if (pos.i >= str.length) break;
      if (str[pos.i] === '*') { pos.i++; left *= this._parsePower(str, pos); }
      else if (str[pos.i] === '/') { pos.i++; const r = this._parsePower(str, pos); if (r === 0) throw new Error('Division by zero'); left /= r; }
      else if (str[pos.i] === '%') { pos.i++; left %= this._parsePower(str, pos); }
      else break;
    }
    return left;
  }

  _parsePower(str, pos) {
    let base = this._parseUnary(str, pos);
    this._skipSpaces(str, pos);
    if (pos.i < str.length && str[pos.i] === '^') {
      pos.i++;
      const exp = this._parsePower(str, pos); // right-associative
      base = Math.pow(base, exp);
    }
    // Handle factorial
    this._skipSpaces(str, pos);
    if (pos.i < str.length && str[pos.i] === '!') {
      pos.i++;
      base = this._factorial(base);
    }
    return base;
  }

  _parseUnary(str, pos) {
    this._skipSpaces(str, pos);
    if (pos.i < str.length && str[pos.i] === '-') {
      pos.i++;
      return -this._parseAtom(str, pos);
    }
    if (pos.i < str.length && str[pos.i] === '+') {
      pos.i++;
    }
    return this._parseAtom(str, pos);
  }

  _parseAtom(str, pos) {
    this._skipSpaces(str, pos);

    // Parentheses
    if (pos.i < str.length && str[pos.i] === '(') {
      pos.i++;
      const result = this._parseAddSub(str, pos);
      this._skipSpaces(str, pos);
      if (pos.i < str.length && str[pos.i] === ')') pos.i++;
      return result;
    }

    // Functions
    const funcs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'cbrt', 'abs'];
    for (const fn of funcs) {
      if (str.substring(pos.i, pos.i + fn.length) === fn) {
        pos.i += fn.length;
        this._skipSpaces(str, pos);
        if (pos.i < str.length && str[pos.i] === '(') {
          pos.i++;
          const arg = this._parseAddSub(str, pos);
          this._skipSpaces(str, pos);
          if (pos.i < str.length && str[pos.i] === ')') pos.i++;
          return this._applyFunction(fn, arg);
        }
      }
    }

    // Constants
    if (str.substring(pos.i, pos.i + 2) === 'pi') { pos.i += 2; return Math.PI; }
    if (str[pos.i] === 'π') { pos.i++; return Math.PI; }
    if (str[pos.i] === 'e' && (pos.i + 1 >= str.length || !'abcdefghijklmnopqrstuvwxyz'.includes(str[pos.i + 1]))) {
      pos.i++; return Math.E;
    }

    // Bitwise operations (for programmer mode)
    const bitwiseOps = ['AND', 'OR', 'XOR', 'NOT'];
    // Handle as separate tokens

    // Number
    let numStr = '';
    if (pos.i < str.length && str[pos.i] === '0' && pos.i + 1 < str.length && (str[pos.i + 1] === 'x' || str[pos.i + 1] === 'X')) {
      numStr = '0x';
      pos.i += 2;
      while (pos.i < str.length && /[0-9a-fA-F]/.test(str[pos.i])) numStr += str[pos.i++];
      return parseInt(numStr, 16);
    }

    while (pos.i < str.length && (/[0-9.]/.test(str[pos.i]))) {
      numStr += str[pos.i++];
    }
    if (numStr === '') throw new Error('Unexpected: ' + str.substring(pos.i));
    return parseFloat(numStr);
  }

  _skipSpaces(str, pos) {
    while (pos.i < str.length && str[pos.i] === ' ') pos.i++;
  }

  _applyFunction(fn, arg) {
    const toRad = this.useDegrees ? (x) => x * Math.PI / 180 : (x) => x;
    const fromRad = this.useDegrees ? (x) => x * 180 / Math.PI : (x) => x;

    switch (fn) {
      case 'sin': return Math.sin(toRad(arg));
      case 'cos': return Math.cos(toRad(arg));
      case 'tan': return Math.tan(toRad(arg));
      case 'asin': return fromRad(Math.asin(arg));
      case 'acos': return fromRad(Math.acos(arg));
      case 'atan': return fromRad(Math.atan(arg));
      case 'log': return Math.log10(arg);
      case 'ln': return Math.log(arg);
      case 'sqrt': return Math.sqrt(arg);
      case 'cbrt': return Math.cbrt(arg);
      case 'abs': return Math.abs(arg);
      default: return arg;
    }
  }

  _factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }

  // ─── Display Updates ────────────────────────────────────────────
  _updateDisplay() {
    const exprEl = this.element.querySelector('#calc-expr');
    const resultEl = this.element.querySelector('#calc-result');
    const memEl = this.element.querySelector('#calc-mem');
    const modeEl = this.element.querySelector('#calc-mode-ind');

    exprEl.textContent = this.expression || '\u00A0';
    resultEl.textContent = this.display;

    // Auto-size result text
    if (this.display.length > 12) resultEl.style.fontSize = '1.4em';
    else if (this.display.length > 8) resultEl.style.fontSize = '1.8em';
    else resultEl.style.fontSize = '2.2em';

    memEl.style.display = this.hasMemory ? 'block' : 'none';
    modeEl.textContent = this.useDegrees ? 'DEG' : 'RAD';
  }

  _updateProgDisplay() {
    const val = parseInt(this.display) || 0;
    const hexEl = this.element.querySelector('#prog-hex');
    const decEl = this.element.querySelector('#prog-dec');
    const octEl = this.element.querySelector('#prog-oct');
    const binEl = this.element.querySelector('#prog-bin');
    if (hexEl) hexEl.textContent = (val >= 0 ? val : (val >>> 0)).toString(16).toUpperCase();
    if (decEl) decEl.textContent = val.toString(10);
    if (octEl) octEl.textContent = (val >= 0 ? val : (val >>> 0)).toString(8);
    if (binEl) binEl.textContent = (val >= 0 ? val : (val >>> 0)).toString(2);
  }

  _formatNumber(n) {
    if (isNaN(n) || !isFinite(n)) return 'Error';
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
    const str = n.toPrecision(12);
    return parseFloat(str).toString();
  }

  _formatExpr(expr) {
    return expr
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/\^/g, '^')
      .replace(/pi/g, 'π');
  }

  // ─── History ────────────────────────────────────────────────────
  _renderHistory() {
    const list = this.element.querySelector('#calc-history-list');
    if (!list) return;
    list.innerHTML = this.history.map(h =>
      `<div class="calc-hist-item" data-result="${this._escapeHtml(h.result)}">
        <div class="calc-hist-expr">${this._escapeHtml(h.expr)}</div>
        <div class="calc-hist-result">= ${this._escapeHtml(h.result)}</div>
      </div>`
    ).join('');

    // Click to reuse
    list.querySelectorAll('.calc-hist-item').forEach(item => {
      item.addEventListener('click', () => {
        this.display = item.dataset.result;
        this.expression = '';
        this._updateDisplay();
      });
    });
  }

  _loadHistory() {
    try {
      const raw = localStorage.getItem('nexus:calculator:history');
      if (raw) this.history = JSON.parse(raw);
    } catch (e) { this.history = []; }
  }

  _saveHistory() {
    try {
      localStorage.setItem('nexus:calculator:history', JSON.stringify(this.history.slice(0, 50)));
    } catch (e) { /* ignore */ }
  }

  // ─── Unit Converter ─────────────────────────────────────────────
  _updateConverter() {
    const cat = this.convCategory;
    const units = Object.keys(this.units[cat]);
    const fromSelect = this.element.querySelector('#conv-from-unit');
    const toSelect = this.element.querySelector('#conv-to-unit');

    // Populate selects
    fromSelect.innerHTML = units.map(u => `<option value="${u}" ${u === this.convFrom ? 'selected' : ''}>${u}</option>`).join('');
    toSelect.innerHTML = units.map(u => `<option value="${u}" ${u === this.convTo ? 'selected' : ''}>${u}</option>`).join('');

    this.convFrom = units.includes(this.convFrom) ? this.convFrom : units[0];
    this.convTo = units.includes(this.convTo) ? this.convTo : units[1] || units[0];
    fromSelect.value = this.convFrom;
    toSelect.value = this.convTo;

    const inputEl = this.element.querySelector('#conv-from-val');
    const outputEl = this.element.querySelector('#conv-to-val');

    const convert = () => {
      this.convValue = parseFloat(inputEl.value) || 0;
      outputEl.value = this._convert(this.convValue, cat, this.convFrom, this.convTo);
    };

    inputEl.oninput = convert;
    fromSelect.onchange = () => { this.convFrom = fromSelect.value; convert(); };
    toSelect.onchange = () => { this.convTo = toSelect.value; convert(); };

    convert();
  }

  _convert(value, category, from, to) {
    if (category === 'temperature') {
      // Convert to Celsius first
      let celsius;
      if (from === 'C') celsius = value;
      else if (from === 'F') celsius = (value - 32) * 5 / 9;
      else celsius = value - 273.15;

      // Convert from Celsius
      if (to === 'C') return celsius.toFixed(4);
      if (to === 'F') return (celsius * 9 / 5 + 32).toFixed(4);
      return (celsius + 273.15).toFixed(4);
    }

    const factors = this.units[category];
    const inBase = value * factors[from];
    return (inBase / factors[to]).toFixed(6).replace(/\.?0+$/, '');
  }

  // ─── Graph Mode ─────────────────────────────────────────────────
  _addGraphFunction() {
    const input = this.element.querySelector('#graph-input');
    const expr = input.value.trim();
    if (!expr) return;

    const colors = ['#ff003c', '#00ccff', '#00ff88', '#ffaa00', '#cc99ff', '#ff6699'];
    this.graphFunctions.push({ expr, color: colors[this.graphFunctions.length % colors.length] });
    input.value = '';
    this._renderGraphFuncs();
    this._renderGraph();
  }

  _renderGraphFuncs() {
    const container = this.element.querySelector('#graph-funcs');
    container.innerHTML = this.graphFunctions.map((f, i) =>
      `<div class="calc-graph-func">
        <span class="calc-graph-func-color" style="background:${f.color}"></span>
        <span>f(x) = ${this._escapeHtml(f.expr)}</span>
        <button class="calc-graph-func-rm" data-idx="${i}">✕</button>
      </div>`
    ).join('');

    container.querySelectorAll('.calc-graph-func-rm').forEach(btn => {
      btn.addEventListener('click', () => {
        this.graphFunctions.splice(parseInt(btn.dataset.idx), 1);
        this._renderGraphFuncs();
        this._renderGraph();
      });
    });
  }

  _renderGraph() {
    const canvas = this.element.querySelector('#graph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width || 400;
    canvas.height = Math.min(rect.height - 80, 300) || 200;

    const w = canvas.width;
    const h = canvas.height;
    const xMin = this.graphXMin;
    const xMax = this.graphXMax;
    const yMin = this.graphYMin;
    const yMax = this.graphYMax;

    // Clear
    ctx.fillStyle = 'rgba(8, 4, 16, 0.95)';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255, 0, 60, 0.08)';
    ctx.lineWidth = 0.5;
    const xStep = this._niceStep(xMax - xMin, w / 60);
    const yStep = this._niceStep(yMax - yMin, h / 60);

    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const px = ((x - xMin) / (xMax - xMin)) * w;
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
    }
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const py = h - ((y - yMin) / (yMax - yMin)) * h;
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 0, 60, 0.3)';
    ctx.lineWidth = 1;
    const originX = ((0 - xMin) / (xMax - xMin)) * w;
    const originY = h - ((0 - yMin) / (yMax - yMin)) * h;
    if (originX >= 0 && originX <= w) { ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, h); ctx.stroke(); }
    if (originY >= 0 && originY <= h) { ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(w, originY); ctx.stroke(); }

    // Axis labels
    ctx.fillStyle = '#555';
    ctx.font = '9px monospace';
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      if (Math.abs(x) < xStep * 0.1) continue;
      const px = ((x - xMin) / (xMax - xMin)) * w;
      ctx.fillText(x.toFixed(1), px + 2, originY > h - 15 ? h - 3 : originY + 12);
    }

    // Plot functions
    this.graphFunctions.forEach(f => {
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();

      let started = false;
      const steps = w;
      for (let px = 0; px < steps; px++) {
        const x = xMin + (px / steps) * (xMax - xMin);
        let y;
        try {
          const fn = this._buildGraphFn(f.expr);
          y = fn(x);
        } catch (e) { continue; }

        if (!isFinite(y) || isNaN(y)) { started = false; continue; }
        const py = h - ((y - yMin) / (yMax - yMin)) * h;
        if (py < -100 || py > h + 100) { started = false; continue; }

        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  }

  _buildGraphFn(expr) {
    const sanitized = expr
      .replace(/\^/g, '**')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/abs\(/g, 'Math.abs(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/pi/g, 'Math.PI')
      .replace(/(?<![a-zA-Z])e(?![a-zA-Z(])/g, 'Math.E')
      .replace(/exp\(/g, 'Math.exp(');
    return new Function('x', `"use strict"; return (${sanitized});`);
  }

  _niceStep(range, target) {
    const rough = range / target;
    const pow = Math.pow(10, Math.floor(Math.log10(rough)));
    const norm = rough / pow;
    let nice;
    if (norm < 1.5) nice = 1;
    else if (norm < 3.5) nice = 2;
    else if (norm < 7.5) nice = 5;
    else nice = 10;
    return nice * pow;
  }

  _escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ─── Styles ─────────────────────────────────────────────────────
  _getStyles() {
    return `
      .nexus-calculator {
        width: 100%; height: 100%;
        background: rgba(10, 5, 20, 0.96);
        border: 1px solid rgba(255, 0, 60, 0.2);
        border-radius: 8px;
        display: flex; flex-direction: column;
        overflow: hidden;
        box-shadow: 0 0 30px rgba(255, 0, 60, 0.1);
        font-family: 'Segoe UI', sans-serif;
      }

      /* Tabs */
      .calc-tabs {
        display: flex; border-bottom: 1px solid rgba(255, 0, 60, 0.12);
        flex-shrink: 0;
      }
      .calc-tab {
        flex: 1; padding: 8px 4px; font-size: 11px;
        background: rgba(15, 8, 25, 0.8); color: #777;
        border: none; cursor: pointer; transition: all 0.15s;
        font-family: inherit;
      }
      .calc-tab:hover { color: #bbb; background: rgba(255, 0, 60, 0.08); }
      .calc-tab-active { color: #ff003c !important; border-bottom: 2px solid #ff003c; background: rgba(255, 0, 60, 0.12) !important; }

      /* Display */
      .calc-display {
        padding: 12px 16px;
        background: rgba(5, 2, 12, 0.8);
        border-bottom: 1px solid rgba(255, 0, 60, 0.08);
        flex-shrink: 0; position: relative;
        min-height: 70px;
      }
      .calc-expression { font-size: 12px; color: #666; min-height: 18px; text-align: right; overflow: hidden; }
      .calc-result { font-size: 2.2em; color: #eee; text-align: right; font-weight: 300; font-family: 'Courier New', monospace;
        text-shadow: 0 0 10px rgba(255, 0, 60, 0.2); transition: font-size 0.15s; }
      .calc-memory-ind { position: absolute; top: 8px; left: 12px; font-size: 10px; color: #ffaa00; }
      .calc-mode-ind { position: absolute; top: 8px; right: 12px; font-size: 10px; color: #555; cursor: pointer; }

      /* Base selector */
      .calc-base-selector {
        display: flex; gap: 4px; padding: 6px 12px;
        border-bottom: 1px solid rgba(255, 0, 60, 0.08);
      }
      .calc-base-btn {
        flex: 1; padding: 4px; font-size: 10px;
        background: rgba(255, 0, 60, 0.06); border: 1px solid rgba(255, 0, 60, 0.12);
        color: #888; border-radius: 3px; cursor: pointer; font-family: inherit;
      }
      .calc-base-active { background: rgba(255, 0, 60, 0.2); color: #ff003c; border-color: #ff003c; }

      /* Prog display */
      .calc-prog-display { padding: 6px 12px; border-bottom: 1px solid rgba(255, 0, 60, 0.08); }
      .calc-prog-row { display: flex; gap: 8px; font-size: 11px; padding: 2px 0; }
      .calc-prog-label { color: #ff003c; width: 32px; font-family: monospace; }
      .calc-prog-val { color: #aaa; font-family: 'Courier New', monospace; word-break: break-all; }
      .calc-prog-bin { font-size: 10px; }

      /* Buttons */
      .calc-buttons {
        display: grid; grid-template-columns: repeat(4, 1fr);
        gap: 3px; padding: 8px; flex: 1;
      }
      .calc-btn {
        padding: 14px 8px; font-size: 16px;
        background: rgba(25, 15, 40, 0.8); border: 1px solid rgba(255, 0, 60, 0.08);
        color: #ddd; border-radius: 6px; cursor: pointer;
        transition: all 0.1s; font-family: inherit;
      }
      .calc-btn:hover { background: rgba(255, 0, 60, 0.15); border-color: rgba(255, 0, 60, 0.25); }
      .calc-btn:active { transform: scale(0.95); background: rgba(255, 0, 60, 0.25); }

      .calc-btn-op { color: #ff003c; font-weight: bold; font-size: 18px; }
      .calc-btn-op:hover { background: rgba(255, 0, 60, 0.2); }
      .calc-btn-fn { color: #888; font-size: 13px; }
      .calc-btn-fn:hover { color: #ccc; }
      .calc-btn-eq {
        background: linear-gradient(135deg, rgba(255, 0, 60, 0.3), rgba(255, 45, 107, 0.3));
        color: #fff; font-weight: bold; font-size: 20px;
        border-color: rgba(255, 0, 60, 0.3);
        box-shadow: 0 0 12px rgba(255, 0, 60, 0.15);
      }
      .calc-btn-eq:hover { box-shadow: 0 0 20px rgba(255, 0, 60, 0.3); }
      .calc-btn-sci { font-size: 11px; padding: 10px 4px; color: #cc99ff; }
      .calc-btn-mem { font-size: 10px; color: #ffaa00; padding: 8px 4px; }

      /* Converter */
      .calc-converter {
        flex: 1; display: flex; flex-direction: column; padding: 10px;
      }
      .calc-conv-categories {
        display: flex; gap: 4px; margin-bottom: 12px; flex-wrap: wrap;
      }
      .calc-conv-cat {
        padding: 5px 10px; font-size: 11px;
        background: rgba(255, 0, 60, 0.06); border: 1px solid rgba(255, 0, 60, 0.12);
        color: #888; border-radius: 4px; cursor: pointer; font-family: inherit;
      }
      .calc-conv-cat-active { background: rgba(255, 0, 60, 0.2); color: #ff003c; border-color: #ff003c; }
      .calc-conv-body { flex: 1; display: flex; flex-direction: column; gap: 10px; }
      .calc-conv-row { display: flex; gap: 8px; }
      .calc-conv-input {
        flex: 1; padding: 10px; font-size: 16px;
        background: rgba(20, 10, 35, 0.9); border: 1px solid rgba(255, 0, 60, 0.2);
        color: #eee; border-radius: 6px; outline: none; font-family: monospace;
      }
      .calc-conv-input:focus { border-color: #ff003c; }
      .calc-conv-output {
        flex: 1; padding: 10px; font-size: 16px;
        background: rgba(10, 5, 20, 0.8); border: 1px solid rgba(255, 0, 60, 0.12);
        color: #00ff88; border-radius: 6px; font-family: monospace;
      }
      .calc-conv-select {
        padding: 8px; font-size: 12px;
        background: rgba(20, 10, 35, 0.9); border: 1px solid rgba(255, 0, 60, 0.15);
        color: #ddd; border-radius: 6px; outline: none; cursor: pointer;
      }
      .calc-conv-swap {
        text-align: center; font-size: 20px; color: #ff003c; cursor: pointer;
        padding: 4px; transition: transform 0.2s;
      }
      .calc-conv-swap:hover { transform: rotate(180deg); }

      /* Graph */
      .calc-graph {
        flex: 1; display: flex; flex-direction: column; padding: 8px; gap: 6px;
      }
      .calc-graph-controls { display: flex; gap: 6px; }
      .calc-graph-input {
        flex: 1; padding: 6px 10px; font-size: 13px;
        background: rgba(20, 10, 35, 0.9); border: 1px solid rgba(255, 0, 60, 0.2);
        color: #eee; border-radius: 4px; outline: none; font-family: monospace;
      }
      .calc-graph-add { padding: 6px 12px; font-size: 11px; }
      .calc-graph-funcs { display: flex; flex-wrap: wrap; gap: 4px; }
      .calc-graph-func {
        display: flex; align-items: center; gap: 6px;
        padding: 3px 8px; font-size: 11px; color: #aaa;
        background: rgba(255, 0, 60, 0.06); border-radius: 3px;
      }
      .calc-graph-func-color { width: 10px; height: 10px; border-radius: 50%; }
      .calc-graph-func-rm { background: none; border: none; color: #666; cursor: pointer; font-size: 12px; }
      .calc-graph-func-rm:hover { color: #ff003c; }
      .calc-graph-canvas { flex: 1; width: 100%; border-radius: 4px; border: 1px solid rgba(255, 0, 60, 0.1); cursor: crosshair; }
      .calc-graph-info { font-size: 9px; color: #555; text-align: center; }

      /* History */
      .calc-history-toggle {
        padding: 6px 12px; font-size: 10px; color: #888; cursor: pointer;
        border-top: 1px solid rgba(255, 0, 60, 0.08); text-align: center;
      }
      .calc-history-toggle:hover { color: #ff003c; }
      .calc-history {
        max-height: 150px; overflow-y: auto; padding: 4px 8px;
        border-top: 1px solid rgba(255, 0, 60, 0.08);
        flex-direction: column;
      }
      .calc-history-list { flex: 1; overflow-y: auto; }
      .calc-hist-item {
        padding: 4px 8px; cursor: pointer; border-radius: 4px;
        transition: background 0.15s;
      }
      .calc-hist-item:hover { background: rgba(255, 0, 60, 0.1); }
      .calc-hist-expr { font-size: 10px; color: #666; }
      .calc-hist-result { font-size: 13px; color: #00ff88; font-family: monospace; }
      .calc-history-clear { padding: 4px 12px; font-size: 10px; margin-top: 4px; }
    `;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.NexusCalculator = NexusCalculator;
}
