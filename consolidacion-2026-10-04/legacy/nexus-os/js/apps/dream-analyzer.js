'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Dream Analyzer
 *  Dream journal, symbol extraction, analysis, and statistics.
 * ═══════════════════════════════════════════════════════════════
 */

const DREAM_SYMBOLS = [
  // Water
  { keyword:'ocean', meaning:'The vast unconscious mind, emotional depth, the unknown, infinity of feeling.', category:'Water', emotional:'deep' },
  { keyword:'river', meaning:'The flow of life, time passing, the journey from source to sea, emotional current.', category:'Water', emotional:'flowing' },
  { keyword:'rain', meaning:'Emotional release, cleansing, renewal, blessings from above, tears of the sky.', category:'Water', emotional:'cleansing' },
  { keyword:'flood', meaning:'Overwhelming emotions, loss of control, being swept away by feeling.', category:'Water', emotional:'overwhelming' },
  { keyword:'lake', meaning:'Still reflection, inner peace, the mirror of the soul, contained emotion.', category:'Water', emotional:'calm' },
  { keyword:'swimming', meaning:'Navigating emotions, moving through the unconscious with effort or grace.', category:'Water', emotional:'active' },
  { keyword:'drowning', meaning:'Being overwhelmed, loss of identity, suffocating emotions, need for rescue.', category:'Water', emotional:'desperate' },
  { keyword:'ice', meaning:'Frozen emotions, emotional coldness, preservation, waiting for warmth.', category:'Water', emotional:'cold' },
  { keyword:'snow', meaning:'Purity, emotional coldness, a blanket covering feeling, winter of the soul.', category:'Water', emotional:'cold' },
  { keyword:'waterfall', meaning:'Powerful emotional release, sudden rush of feeling, natural force.', category:'Water', emotional:'powerful' },
  { keyword:'wave', meaning:'Rhythmic emotion, the ebb and flow of feeling, approaching change.', category:'Water', emotional:'rhythmic' },
  { keyword:'bath', meaning:'Cleansing, purification, self-care, washing away the old.', category:'Water', emotional:'healing' },
  // Animals
  { keyword:'snake', meaning:'Transformation, healing, hidden danger, sexual energy, kundalini, wisdom.', category:'Animals', emotional:'transformative' },
  { keyword:'bird', meaning:'Freedom, perspective, the spirit, messages, rising above.', category:'Animals', emotional:'liberating' },
  { keyword:'dog', meaning:'Loyalty, friendship, instinct, protection, the faithful companion.', category:'Animals', emotional:'loyal' },
  { keyword:'cat', meaning:'Independence, intuition, feminine energy, mystery, the unseen.', category:'Animals', emotional:'mysterious' },
  { keyword:'wolf', meaning:'Instinct, wildness, the pack, solitude vs. community, primal intelligence.', category:'Animals', emotional:'wild' },
  { keyword:'spider', meaning:'Creativity, patience, the web of life, feminine power, entanglement.', category:'Animals', emotional:'creative' },
  { keyword:'fish', meaning:'The unconscious, fertility, spiritual nourishment, abundance from the deep.', category:'Animals', emotional:'deep' },
  { keyword:'horse', meaning:'Power, freedom, the body, travel, nobility, untamed energy.', category:'Animals', emotional:'powerful' },
  { keyword:'butterfly', meaning:'Transformation, the soul, beauty emerging from the cocoon, lightness.', category:'Animals', emotional:'transformative' },
  { keyword:'bear', meaning:'Strength, hibernation, the mother, protection, raw power.', category:'Animals', emotional:'strong' },
  { keyword:'lion', meaning:'Courage, royalty, the sun, pride, leadership, fierce heart.', category:'Animals', emotional:'courageous' },
  { keyword:'rat', meaning:'Survival, disease, the shadow, resourcefulness, the unwanted aspect.', category:'Animals', emotional:'anxious' },
  { keyword:'owl', meaning:'Wisdom, the night, seeing in darkness, death as messenger, knowledge.', category:'Animals', emotional:'wise' },
  { keyword:'eagle', meaning:'Vision, freedom, spiritual ascent, the higher self, divine perspective.', category:'Animals', emotional:'elevated' },
  { keyword:'deer', meaning:'Gentleness, grace, vulnerability, the heart, innocence in the wild.', category:'Animals', emotional:'gentle' },
  { keyword:'frog', meaning:'Transformation, cleansing, fertility, the threshold between worlds.', category:'Animals', emotional:'transformative' },
  { keyword:'bee', meaning:'Community, industriousness, sweetness, divine order, productive work.', category:'Animals', emotional:'productive' },
  { keyword:'ant', meaning:'Patience, hard work, community, small efforts building large results.', category:'Animals', emotional:'patient' },
  // Actions
  { keyword:'flying', meaning:'Freedom, transcendence, rising above problems, spiritual liberation, lucid awareness.', category:'Actions', emotional:'liberating' },
  { keyword:'falling', meaning:'Loss of control, fear of failure, letting go, surrender to gravity.', category:'Actions', emotional:'anxious' },
  { keyword:'running', meaning:'Escape, pursuit, energy, the need to move, urgency.', category:'Actions', emotional:'urgent' },
  { keyword:'chasing', meaning:'Pursuit of something desired or avoidance of something feared.', category:'Actions', emotional:'driven' },
  { keyword:'being chased', meaning:'Running from a fear, unresolved issue, or aspect of self you refuse to face.', category:'Actions', emotional:'fearful' },
  { keyword:'fighting', meaning:'Inner conflict, struggle with an aspect of self, confrontation with shadow.', category:'Actions', emotional:'conflicted' },
  { keyword:'hiding', meaning:'Avoidance, fear of exposure, protecting vulnerability, shame.', category:'Actions', emotional:'fearful' },
  { keyword:'climbing', meaning:'Ambition, effort, ascending toward a goal, spiritual elevation.', category:'Actions', emotional:'ambitious' },
  { keyword:'dancing', meaning:'Joy, expression, celebration, harmony of body and spirit.', category:'Actions', emotional:'joyful' },
  { keyword:'singing', meaning:'Self-expression, joy, the voice of the soul, communication.', category:'Actions', emotional:'expressive' },
  { keyword:'crying', meaning:'Emotional release, grief, overwhelming feeling, the need to express.', category:'Actions', emotional:'sad' },
  { keyword:'eating', meaning:'Nourishment, consumption, hunger for experience, incorporating something.', category:'Actions', emotional:'nourishing' },
  { keyword:'driving', meaning:'Control over life direction, the vehicle of the self, journey.', category:'Actions', emotional:'directed' },
  // Objects
  { keyword:'teeth', meaning:'Anxiety about appearance, power, communication, fear of loss, aging.', category:'Objects', emotional:'anxious' },
  { keyword:'key', meaning:'Access, solutions, secrets unlocked, opportunity, answers.', category:'Objects', emotional:'hopeful' },
  { keyword:'mirror', meaning:'Self-reflection, identity, truth, the shadow self, self-image.', category:'Objects', emotional:'reflective' },
  { keyword:'door', meaning:'Opportunity, transition, the unknown beyond, choice, passage.', category:'Objects', emotional:'anticipatory' },
  { keyword:'window', meaning:'Perspective, looking in or out, opportunity, the barrier between inner and outer.', category:'Objects', emotional:'observant' },
  { keyword:'bridge', meaning:'Transition, connection between states, crossing from one phase to another.', category:'Objects', emotional:'transitional' },
  { keyword:'knife', meaning:'Severing, aggression, cutting ties, penetration, precision.', category:'Objects', emotional:'sharp' },
  { keyword:'gun', meaning:'Power, aggression, fear, defense, masculine energy, threat.', category:'Objects', emotional:'aggressive' },
  { keyword:'money', meaning:'Self-worth, value, exchange, power, security, material concerns.', category:'Objects', emotional:'valuing' },
  { keyword:'book', meaning:'Knowledge, memory, the story of your life, learning, wisdom.', category:'Objects', emotional:'curious' },
  { keyword:'phone', meaning:'Communication, connection, messages, reaching out, technology.', category:'Objects', emotional:'connecting' },
  { keyword:'car', meaning:'The body/ego, life direction, control, journey, personal drive.', category:'Objects', emotional:'directed' },
  { keyword:'house', meaning:'The self, the psyche, different rooms as different aspects of personality.', category:'Objects', emotional:'foundational' },
  { keyword:'stairs', meaning:'Progress, levels of consciousness, ascent or descent, transition.', category:'Objects', emotional:'progressive' },
  { keyword:'clock', meaning:'Time pressure, mortality, cycles, the need to act, urgency.', category:'Objects', emotional:'urgent' },
  { keyword:'candle', meaning:'Light in darkness, hope, spiritual illumination, the soul\'s flame.', category:'Objects', emotional:'hopeful' },
  { keyword:'rope', meaning:'Connection, bondage, lifeline, climbing, being tied.', category:'Objects', emotional:'bound' },
  { keyword:'box', meaning:'Containment, secrets, the unconscious, gifts, Pandora.', category:'Objects', emotional:'contained' },
  { keyword:'ring', meaning:'Commitment, wholeness, cycles, infinity, union.', category:'Objects', emotional:'committed' },
  { keyword:'mask', meaning:'Hidden identity, persona, deception, protection, role-playing.', category:'Objects', emotional:'hidden' },
  // Places
  { keyword:'school', meaning:'Learning, testing, social dynamics, the past, lessons not yet learned.', category:'Places', emotional:'evaluative' },
  { keyword:'hospital', meaning:'Healing, illness, vulnerability, the need for care, transformation.', category:'Places', emotional:'vulnerable' },
  { keyword:'forest', meaning:'The unconscious, the unknown, natural growth, getting lost, wilderness.', category:'Places', emotional:'mysterious' },
  { keyword:'desert', meaning:'Isolation, spiritual testing, emptiness, clarity through deprivation.', category:'Places', emotional:'isolated' },
  { keyword:'mountain', meaning:'Achievement, spiritual ascent, obstacle, perspective from above.', category:'Places', emotional:'ambitious' },
  { keyword:'city', meaning:'Society, complexity, crowds, modern life, opportunity and overwhelm.', category:'Places', emotional:'busy' },
  { keyword:'church', meaning:'Spirituality, morality, community, the sacred, tradition.', category:'Places', emotional:'spiritual' },
  { keyword:'prison', meaning:'Restriction, guilt, self-imposed limits, punishment, feeling trapped.', category:'Places', emotional:'trapped' },
  { keyword:'garden', meaning:'Growth, cultivation, paradise, fertility, the tended self.', category:'Places', emotional:'nurturing' },
  { keyword:'cave', meaning:'The deep unconscious, hidden treasures, the womb, darkness, retreat.', category:'Places', emotional:'deep' },
  { keyword:'road', meaning:'Life path, journey, direction, choice, the way forward.', category:'Places', emotional:'journeying' },
  { keyword:'graveyard', meaning:'Endings, the past, memory, transformation, what has died.', category:'Places', emotional:'mourning' },
  { keyword:'castle', meaning:'Power, protection, the psyche\'s fortress, ambition, isolation.', category:'Places', emotional:'powerful' },
  { keyword:'basement', meaning:'The lower unconscious, repressed memories, foundation, hidden aspects.', category:'Places', emotional:'repressed' },
  { keyword:'attic', meaning:'Higher consciousness, stored memories, forgotten knowledge, the mind\'s upper floors.', category:'Places', emotional:'elevated' },
  // Body
  { keyword:'eyes', meaning:'Perception, awareness, the soul\'s window, seeing truth, witnessing.', category:'Body', emotional:'perceptive' },
  { keyword:'hands', meaning:'Action, creation, connection, giving and receiving, skill.', category:'Body', emotional:'active' },
  { keyword:'feet', meaning:'Grounding, movement, foundation, the path you walk.', category:'Body', emotional:'grounded' },
  { keyword:'hair', meaning:'Identity, vanity, freedom, power, sexuality, thought.', category:'Body', emotional:'identity' },
  { keyword:'blood', meaning:'Life force, sacrifice, passion, family ties, violence, vitality.', category:'Body', emotional:'vital' },
  { keyword:'heart', meaning:'Love, emotion, the center of being, courage, compassion.', category:'Body', emotional:'loving' },
  { keyword:'mouth', meaning:'Communication, consumption, expression, kisses, the gateway.', category:'Body', emotional:'expressive' },
  { keyword:'belly', meaning:'Intuition, gut feeling, hunger, creation, the core.', category:'Body', emotional:'intuitive' },
  // People
  { keyword:'mother', meaning:'Nurturing, origin, the feminine, comfort, the source of life.', category:'People', emotional:'nurturing' },
  { keyword:'father', meaning:'Authority, protection, the masculine, structure, guidance.', category:'People', emotional:'authoritative' },
  { keyword:'child', meaning:'Innocence, potential, the inner child, vulnerability, the future.', category:'People', emotional:'innocent' },
  { keyword:'stranger', meaning:'Unknown aspect of self, the unconscious, new possibility, threat or gift.', category:'People', emotional:'unknown' },
  { keyword:'lover', meaning:'Passion, union, desire, anima/animus, the beloved aspect of self.', category:'People', emotional:'passionate' },
  { keyword:'friend', meaning:'Support, reflection of self, loyalty, social connection.', category:'People', emotional:'supportive' },
  { keyword:'enemy', meaning:'Shadow self, projection, inner conflict, what you fight against.', category:'People', emotional:'conflicted' },
  { keyword:'dead person', meaning:'The past, unfinished business, messages from the unconscious, grief.', category:'People', emotional:'haunted' },
  { keyword:'baby', meaning:'New beginning, vulnerability, pure potential, innocence, creation.', category:'People', emotional:'tender' },
  { keyword:'old person', meaning:'Wisdom, the self at a later stage, time, ancestral knowledge.', category:'People', emotional:'wise' },
  // Colors
  { keyword:'red', meaning:'Passion, anger, blood, life force, danger, love, intensity.', category:'Colors', emotional:'intense' },
  { keyword:'blue', meaning:'Calm, sadness, truth, communication, the sky, depth.', category:'Colors', emotional:'calm' },
  { keyword:'green', meaning:'Growth, nature, healing, envy, renewal, the heart.', category:'Colors', emotional:'growing' },
  { keyword:'black', meaning:'The unknown, death, mystery, the shadow, the void, potential.', category:'Colors', emotional:'mysterious' },
  { keyword:'white', meaning:'Purity, innocence, death (in some cultures), clarity, the blank page.', category:'Colors', emotional:'pure' },
  { keyword:'gold', meaning:'The divine, wealth, the sun, perfection, spiritual value.', category:'Colors', emotional:'divine' },
  { keyword:'purple', meaning:'Spirituality, royalty, mystery, the third eye, transformation.', category:'Colors', emotional:'spiritual' },
  { keyword:'yellow', meaning:'Joy, intellect, cowardice, the sun, energy, warning.', category:'Colors', emotional:'bright' },
  // Natural
  { keyword:'fire', meaning:'Passion, destruction, transformation, purification, anger, illumination.', category:'Natural', emotional:'intense' },
  { keyword:'earth', meaning:'Grounding, stability, the body, material reality, the mother.', category:'Natural', emotional:'grounded' },
  { keyword:'wind', meaning:'Change, spirit, invisible force, communication, movement.', category:'Natural', emotional:'changing' },
  { keyword:'storm', meaning:'Emotional turmoil, conflict, cleansing, dramatic change, power.', category:'Natural', emotional:'turbulent' },
  { keyword:'earthquake', meaning:'Foundational upheaval, sudden change, instability, paradigm shift.', category:'Natural', emotional:'upheaval' },
  { keyword:'lightning', meaning:'Sudden insight, divine intervention, shock, illumination, flash of truth.', category:'Natural', emotional:'illuminating' },
  { keyword:'rainbow', meaning:'Hope, promise, bridge between worlds, spectrum of possibility.', category:'Natural', emotional:'hopeful' },
  { keyword:'moon', meaning:'Intuition, the feminine, cycles, the unconscious, reflection.', category:'Natural', emotional:'intuitive' },
  { keyword:'sun', meaning:'Consciousness, vitality, the masculine, clarity, the self.', category:'Natural', emotional:'vital' },
  { keyword:'stars', meaning:'Hope, destiny, guidance, the vast self, aspiration.', category:'Natural', emotional:'aspirational' },
  // Abstract
  { keyword:'death', meaning:'Transformation, ending of a phase, symbolic death and rebirth, change.', category:'Abstract', emotional:'transformative' },
  { keyword:'wedding', meaning:'Union, commitment, integration of aspects of self, new beginning.', category:'Abstract', emotional:'joyful' },
  { keyword:'birth', meaning:'New beginning, creation, manifestation, potential, emergence.', category:'Abstract', emotional:'hopeful' },
  { keyword:'naked', meaning:'Vulnerability, exposure, shame, authenticity, truth revealed.', category:'Abstract', emotional:'vulnerable' },
  { keyword:'lost', meaning:'Confusion, searching, lack of direction, disconnection from self.', category:'Abstract', emotional:'confused' },
  { keyword:'trapped', meaning:'Restriction, inability to escape, feeling stuck, limitation.', category:'Abstract', emotional:'restricted' },
  { keyword:'late', meaning:'Anxiety about timing, missed opportunities, urgency, fear of inadequacy.', category:'Abstract', emotional:'anxious' },
  { keyword:'exam', meaning:'Testing, evaluation, fear of inadequacy, self-assessment, performance anxiety.', category:'Abstract', emotional:'evaluative' },
  { keyword:'pregnancy', meaning:'Creation, gestation, something developing, anticipation, potential.', category:'Abstract', emotional:'anticipatory' },
  { keyword:'transformation', meaning:'Change, metamorphosis, death and rebirth, evolution of self.', category:'Abstract', emotional:'transformative' }
];

const DREAM_MOODS = [
  { id: 'peaceful', label: 'Peaceful', emoji: '😌', color: '#87ceeb' },
  { id: 'happy', label: 'Happy', emoji: '😊', color: '#ffd700' },
  { id: 'anxious', label: 'Anxious', emoji: '😰', color: '#ff6b6b' },
  { id: 'terrified', label: 'Terrified', emoji: '😱', color: '#ff003c' },
  { id: 'confused', label: 'Confused', emoji: '😵', color: '#9b59b6' },
  { id: 'excited', label: 'Excited', emoji: '🤩', color: '#ff69b4' },
  { id: 'sad', label: 'Sad', emoji: '😢', color: '#4a90d9' },
  { id: 'lustful', label: 'Lustful', emoji: '🔥', color: '#e74c3c' }
];

const DREAM_THEMES = {
  anxiety: { keywords: ['chased','falling','lost','late','exam','teeth','trapped','naked','fighting'], label: 'Anxiety Dream' },
  adventure: { keywords: ['flying','climbing','exploring','road','mountain','journey','bridge'], label: 'Adventure Dream' },
  romance: { keywords: ['lover','kiss','heart','wedding','dancing','ring','garden'], label: 'Romantic Dream' },
  nightmare: { keywords: ['death','blood','dark','chased','trapped','falling','snake','fighting','monster'], label: 'Nightmare' },
  lucid: { keywords: ['flying','aware','control','conscious','choosing','reality','waking'], label: 'Lucid Dream' },
  healing: { keywords: ['water','bath','rain','healing','light','garden','green','white','butterfly'], label: 'Healing Dream' },
  prophetic: { keywords: ['vision','future','message','number','star','moon','divine','angel','voice'], label: 'Prophetic Dream' },
  creative: { keywords: ['music','painting','dancing','singing','creating','writing','building','spider'], label: 'Creative Dream' }
};

class DreamAnalyzerApp {
  constructor(container) {
    this.container = container;
    this.element = null;
    this._styleEl = null;
    this.view = 'entry'; // entry, journal, stats
    this.currentDream = null;
  }

  render() {
    this._injectStyles();
    this.element = document.createElement('div');
    this.element.className = 'dream-app';
    this._renderUI();
    this.container.appendChild(this.element);
  }

  destroy() {
    if (this._styleEl && this._styleEl.parentNode) this._styleEl.parentNode.removeChild(this._styleEl);
    if (this.element && this.element.parentNode) this.element.parentNode.removeChild(this.element);
  }

  _injectStyles() {
    this._styleEl = document.createElement('style');
    this._styleEl.textContent = `
      .dream-app {
        width: 100%; height: 100%; overflow-y: auto;
        background: rgba(10,5,15,0.97); color: #e0d0e8;
        font-family: 'Georgia', serif; padding: 20px;
        box-sizing: border-box;
      }
      .dream-header { text-align: center; margin-bottom: 16px; }
      .dream-title {
        font-size: 26px; color: #ff1493; margin: 0 0 4px 0;
        text-shadow: 0 0 20px #ff003c, 0 0 40px #ff003c80;
        letter-spacing: 2px;
      }
      .dream-subtitle { color: #a080b0; font-style: italic; font-size: 13px; margin: 0; }
      .dream-nav {
        display: flex; justify-content: center; gap: 8px;
        margin-bottom: 20px;
      }
      .dream-nav-btn {
        padding: 8px 20px; border-radius: 20px;
        background: rgba(255,20,147,0.06);
        border: 1px solid rgba(255,20,147,0.15);
        color: #a080b0; font-size: 13px;
        cursor: pointer; transition: all 0.3s;
        font-family: inherit;
      }
      .dream-nav-btn:hover { background: rgba(255,20,147,0.12); }
      .dream-nav-btn.active {
        background: rgba(255,20,147,0.18);
        border-color: #ff1493; color: #ff1493;
      }
      .dream-panel {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,20,147,0.1);
        border-radius: 16px; padding: 24px;
        backdrop-filter: blur(8px);
        max-width: 700px; margin: 0 auto;
      }
      .dream-form-group { margin-bottom: 16px; }
      .dream-label {
        display: block; font-size: 13px;
        color: #ff1493; margin-bottom: 6px;
        letter-spacing: 1px;
      }
      .dream-input, .dream-textarea {
        width: 100%; padding: 12px 16px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,20,147,0.2);
        border-radius: 10px; color: #e0d0e8;
        font-size: 14px; font-family: inherit;
        outline: none; box-sizing: border-box;
        transition: border-color 0.3s;
      }
      .dream-input:focus, .dream-textarea:focus {
        border-color: #ff1493;
        box-shadow: 0 0 10px rgba(255,20,147,0.2);
      }
      .dream-textarea { min-height: 160px; resize: vertical; line-height: 1.6; }
      .dream-input::placeholder, .dream-textarea::placeholder { color: #7a5a8a; font-style: italic; }
      .dream-mood-selector {
        display: flex; flex-wrap: wrap; gap: 8px;
      }
      .dream-mood-btn {
        padding: 6px 12px; border-radius: 16px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.1);
        color: #c8a0d8; font-size: 12px;
        cursor: pointer; transition: all 0.3s;
        font-family: inherit;
      }
      .dream-mood-btn:hover { border-color: rgba(255,20,147,0.3); }
      .dream-mood-btn.selected {
        border-color: var(--mood-color, #ff1493);
        background: rgba(255,20,147,0.1);
        color: #ff1493;
      }
      .dream-btn {
        padding: 10px 24px; border-radius: 20px;
        background: linear-gradient(135deg, #ff003c, #ff1493);
        border: none; color: #fff; font-size: 14px;
        font-weight: bold; cursor: pointer;
        box-shadow: 0 0 15px rgba(255,0,60,0.3);
        transition: all 0.3s; font-family: inherit;
        margin: 6px;
      }
      .dream-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(255,0,60,0.5); }
      .dream-btn-sm {
        padding: 6px 14px; font-size: 12px;
        background: rgba(255,20,147,0.1);
        border: 1px solid rgba(255,20,147,0.25);
        box-shadow: none;
      }
      .dream-analysis-result {
        background: rgba(255,20,147,0.04);
        border: 1px solid rgba(255,20,147,0.12);
        border-radius: 12px; padding: 20px;
        margin-top: 16px; line-height: 1.7;
      }
      .dream-analysis-result h3 { color: #ff1493; margin: 0 0 10px 0; }
      .dream-analysis-result h4 { color: #ffd700; margin: 12px 0 4px 0; font-size: 14px; }
      .dream-symbol-tag {
        display: inline-block; padding: 3px 10px;
        background: rgba(255,20,147,0.1);
        border: 1px solid rgba(255,20,147,0.2);
        border-radius: 12px; font-size: 11px;
        color: #ff1493; margin: 2px;
      }
      .dream-journal-item {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,20,147,0.1);
        border-radius: 12px; padding: 16px;
        margin-bottom: 12px; cursor: pointer;
        transition: all 0.3s;
      }
      .dream-journal-item:hover {
        border-color: rgba(255,20,147,0.3);
        background: rgba(255,20,147,0.03);
      }
      .dream-journal-date { font-size: 11px; color: #7a5a8a; }
      .dream-journal-title { font-size: 15px; color: #ff1493; margin: 4px 0; }
      .dream-journal-preview { font-size: 12px; color: #a080b0; }
      .dream-journal-mood { font-size: 11px; margin-top: 4px; }
      .dream-search {
        width: 100%; padding: 10px 16px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,20,147,0.2);
        border-radius: 10px; color: #e0d0e8;
        font-size: 14px; font-family: inherit;
        outline: none; box-sizing: border-box;
        margin-bottom: 16px;
      }
      .dream-search::placeholder { color: #7a5a8a; }
      .dream-stat-card {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,20,147,0.1);
        border-radius: 12px; padding: 16px;
        margin-bottom: 12px;
      }
      .dream-stat-title { color: #ff1493; font-size: 14px; margin-bottom: 10px; }
      .dream-bar {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 6px;
      }
      .dream-bar-label { font-size: 12px; color: #c8a0d8; min-width: 80px; }
      .dream-bar-fill {
        height: 8px; background: linear-gradient(90deg, #ff003c, #ff1493);
        border-radius: 4px; transition: width 0.5s;
        box-shadow: 0 0 6px rgba(255,20,147,0.4);
      }
      .dream-bar-value { font-size: 11px; color: #7a5a8a; min-width: 30px; }
      .dream-lucid-check {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 12px;
      }
      .dream-lucid-check input[type="checkbox"] {
        width: 18px; height: 18px;
        accent-color: #ff1493;
      }
      .dream-lucid-check label { color: #c8a0d8; font-size: 13px; }
      .dream-detail-modal {
        background: rgba(255,20,147,0.04);
        border: 1px solid rgba(255,20,147,0.15);
        border-radius: 16px; padding: 24px;
        margin-top: 16px; line-height: 1.7;
      }
      .dream-center { text-align: center; }
      .dream-highlight { color: #ff1493; font-weight: bold; }
    `;
    document.head.appendChild(this._styleEl);
  }

  _renderUI() {
    this.element.innerHTML = `
      <div class="dream-header">
        <h1 class="dream-title">✦ Dream Analyzer ✦</h1>
        <p class="dream-subtitle">Unlock the messages hidden in your sleeping mind</p>
      </div>
      <div class="dream-nav">
        <button class="dream-nav-btn${this.view === 'entry' ? ' active' : ''}" data-view="entry">✎ New Dream</button>
        <button class="dream-nav-btn${this.view === 'journal' ? ' active' : ''}" data-view="journal">📖 Journal</button>
        <button class="dream-nav-btn${this.view === 'stats' ? ' active' : ''}" data-view="stats">📊 Statistics</button>
      </div>
      <div class="dream-panel" id="dream-content"></div>
    `;

    this.element.querySelectorAll('.dream-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.view = btn.dataset.view;
        this.element.querySelectorAll('.dream-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderView();
      });
    });

    this._renderView();
  }

  _renderView() {
    switch (this.view) {
      case 'entry': this._renderEntry(); break;
      case 'journal': this._renderJournal(); break;
      case 'stats': this._renderStats(); break;
    }
  }

  _renderEntry() {
    const content = this.element.querySelector('#dream-content');
    const today = new Date().toISOString().split('T')[0];

    content.innerHTML = `
      <div class="dream-form-group">
        <label class="dream-label">DREAM TITLE</label>
        <input type="text" class="dream-input" id="dream-title-input" placeholder="Give your dream a name..." />
      </div>
      <div class="dream-form-group">
        <label class="dream-label">DATE</label>
        <input type="date" class="dream-input" id="dream-date-input" value="${today}" />
      </div>
      <div class="dream-form-group">
        <label class="dream-label">DREAM DESCRIPTION</label>
        <textarea class="dream-textarea" id="dream-desc-input" placeholder="Describe your dream in as much detail as you can remember..."></textarea>
      </div>
      <div class="dream-form-group">
        <label class="dream-label">MOOD UPON WAKING</label>
        <div class="dream-mood-selector" id="dream-mood-selector">
          ${DREAM_MOODS.map(m => `<button class="dream-mood-btn" data-mood="${m.id}" style="--mood-color:${m.color}">${m.emoji} ${m.label}</button>`).join('')}
        </div>
      </div>
      <div class="dream-form-group">
        <label class="dream-label">TAGS (comma separated)</label>
        <input type="text" class="dream-input" id="dream-tags-input" placeholder="recurring, childhood, work..." />
      </div>
      <div class="dream-lucid-check">
        <input type="checkbox" id="dream-lucid" />
        <label for="dream-lucid">This was a lucid dream</label>
      </div>
      <div class="dream-center">
        <button class="dream-btn" id="dream-analyze-btn">🔮 Analyze Dream</button>
        <button class="dream-btn dream-btn-sm" id="dream-save-btn">Save to Journal</button>
      </div>
      <div id="dream-analysis-output"></div>
    `;

    let selectedMood = null;
    content.querySelectorAll('.dream-mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.dream-mood-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedMood = btn.dataset.mood;
      });
    });

    content.querySelector('#dream-analyze-btn').addEventListener('click', () => {
      const desc = content.querySelector('#dream-desc-input').value;
      if (!desc.trim()) return;
      this._analyzeDream(desc, selectedMood);
    });

    content.querySelector('#dream-save-btn').addEventListener('click', () => {
      this._saveDream({
        title: content.querySelector('#dream-title-input').value || 'Untitled Dream',
        date: content.querySelector('#dream-date-input').value,
        description: content.querySelector('#dream-desc-input').value,
        mood: selectedMood,
        tags: content.querySelector('#dream-tags-input').value.split(',').map(t => t.trim()).filter(Boolean),
        lucid: content.querySelector('#dream-lucid').checked
      });
    });
  }

  _extractSymbols(text) {
    const lower = text.toLowerCase();
    const found = [];
    DREAM_SYMBOLS.forEach(sym => {
      if (lower.includes(sym.keyword.toLowerCase())) {
        found.push(sym);
      }
    });
    return found;
  }

  _analyzeDream(description, mood) {
    const symbols = this._extractSymbols(description);
    const themes = this._detectThemes(description);
    const outputEl = this.element.querySelector('#dream-analysis-output');

    let html = `<div class="dream-analysis-result">`;
    html += `<h3>✦ Dream Analysis</h3>`;

    // Detected symbols
    if (symbols.length > 0) {
      html += `<h4>Detected Symbols (${symbols.length})</h4>`;
      html += `<div>${symbols.map(s => `<span class="dream-symbol-tag">${s.keyword}</span>`).join('')}</div>`;
      html += `<div style="margin-top:12px;">`;
      symbols.forEach(s => {
        html += `<p><span class="dream-highlight">${s.keyword}</span> — ${s.meaning}</p>`;
      });
      html += `</div>`;
    } else {
      html += `<p style="color:#a080b0;font-style:italic;">No known symbols detected. Your dream may contain highly personal imagery — reflect on what each element means to you specifically.</p>`;
    }

    // Themes
    if (themes.length > 0) {
      html += `<h4>Dream Theme: ${themes[0].label}</h4>`;
      html += `<p>This dream carries the energy of a ${themes[0].label.toLowerCase()} — ${this._themeInterpretation(themes[0].label)}</p>`;
    }

    // Mood analysis
    if (mood) {
      const moodData = DREAM_MOODS.find(m => m.id === mood);
      if (moodData) {
        html += `<h4>Emotional Tone: ${moodData.emoji} ${moodData.label}</h4>`;
        html += `<p>${this._moodInterpretation(mood, symbols)}</p>`;
      }
    }

    // Overall interpretation
    html += `<h4>Overall Message</h4>`;
    html += `<p>${this._generateOverallInterpretation(symbols, mood, themes)}</p>`;

    // Category breakdown
    if (symbols.length > 0) {
      const categories = {};
      symbols.forEach(s => {
        if (!categories[s.category]) categories[s.category] = [];
        categories[s.category].push(s.keyword);
      });
      html += `<h4>Symbol Categories</h4>`;
      Object.entries(categories).forEach(([cat, syms]) => {
        html += `<p><span class="dream-highlight">${cat}:</span> ${syms.join(', ')}</p>`;
      });
    }

    html += `</div>`;
    outputEl.innerHTML = html;
  }

  _detectThemes(text) {
    const lower = text.toLowerCase();
    const matches = [];
    Object.entries(DREAM_THEMES).forEach(([id, theme]) => {
      const count = theme.keywords.filter(k => lower.includes(k)).length;
      if (count >= 2) {
        matches.push({ ...theme, id, count });
      }
    });
    return matches.sort((a, b) => b.count - a.count);
  }

  _themeInterpretation(theme) {
    const interpretations = {
      'Anxiety Dream': 'these dreams often reflect waking-life stress and unresolved concerns. The unconscious is processing what the conscious mind has not yet addressed.',
      'Adventure Dream': 'your psyche is exploring new territory, seeking growth and expansion beyond current boundaries.',
      'Romantic Dream': 'the heart seeks connection, intimacy, and the integration of your anima/animus — the inner beloved.',
      'Nightmare': 'the shadow demands attention. What you have been avoiding is ready to be faced. Nightmares are the psyche\'s urgent message.',
      'Lucid Dream': 'awareness has pierced the veil between waking and sleeping. You are developing the ability to consciously participate in your unconscious.',
      'Healing Dream': 'the psyche is actively processing and integrating wounds. Allow the healing energy to work — these dreams are medicine.',
      'Prophetic Dream': 'the deeper layers of consciousness perceive patterns and possibilities that the waking mind has not yet registered.',
      'Creative Dream': 'the creative unconscious is actively generating new ideas, images, and solutions. Pay attention to artistic inspiration.'
    };
    return interpretations[theme] || 'this dream carries significant archetypal energy worthy of reflection.';
  }

  _moodInterpretation(mood, symbols) {
    const interpretations = {
      peaceful: 'Waking in peace suggests your unconscious is in a state of harmony. The dream may be confirming your current path or offering a glimpse of inner balance.',
      happy: 'Joy upon waking indicates the dream was nourishing. Your psyche is celebrating something — acknowledge what brings you this happiness.',
      anxious: 'Anxiety upon waking points to unresolved tension. The dream brought something to the surface that needs conscious attention.',
      terrified: 'Terror suggests a confrontation with the shadow or a deep fear. These dreams, while unpleasant, often carry the most transformative messages.',
      confused: 'Confusion indicates the dream is presenting information your conscious mind hasn\'t yet integrated. Give it time — the meaning will crystallize.',
      excited: 'Excitement suggests the dream revealed something your psyche finds energizing. Follow this energy — it points toward your vitality.',
      sad: 'Sadness upon waking may indicate grief being processed, a longing being expressed, or an ending being mourned. Allow the feeling to move through you.',
      lustful: 'Passionate feelings upon waking may indicate creative energy, desire for union, or the anima/animus seeking integration. Look beyond literal interpretation.'
    };
    return interpretations[mood] || 'The emotional residue of a dream often carries more truth than its literal content.';
  }

  _generateOverallInterpretation(symbols, mood, themes) {
    if (symbols.length === 0) {
      return 'This dream uses highly personal symbolism. Reflect on each image and ask: what does this represent in my life? Your personal associations are the key to understanding.';
    }

    const categories = [...new Set(symbols.map(s => s.category))];
    const emotions = [...new Set(symbols.map(s => s.emotional))];

    let interp = `Your dream weaves together ${symbols.length} symbolic elements`;
    if (categories.length > 1) interp += ` across ${categories.join(', ').toLowerCase()} domains`;
    interp += `. The emotional threads of ${emotions.slice(0, 3).join(' and ')} run through the narrative. `;

    if (themes.length > 0) {
      interp += `The dominant theme of "${themes[0].label}" suggests `;
      if (themes[0].id === 'anxiety') interp += 'your unconscious is processing stress or unresolved fears that deserve conscious attention.';
      else if (themes[0].id === 'nightmare') interp += 'a confrontation with something you\'ve been avoiding. Face it with courage — the shadow loses power when seen clearly.';
      else if (themes[0].id === 'healing') interp += 'active psychological healing and integration. Trust the process and give yourself space to recover.';
      else interp += 'important psychological work is happening beneath the surface of your awareness.';
    } else {
      interp += 'Consider how each symbol relates to your current life situation. Dreams speak in metaphor — what aspect of your waking life does this imagery reflect?';
    }

    return interp;
  }

  _saveDream(dream) {
    try {
      const dreams = JSON.parse(localStorage.getItem('nexus_dreams') || '[]');
      dream.id = Date.now();
      dream.symbols = this._extractSymbols(dream.description).map(s => s.keyword);
      dream.themes = this._detectThemes(dream.description).map(t => t.id);
      dream.wordCount = dream.description.split(/\s+/).length;
      dreams.unshift(dream);
      localStorage.setItem('nexus_dreams', JSON.stringify(dreams));
      // Show confirmation
      const btn = this.element.querySelector('#dream-save-btn');
      if (btn) { btn.textContent = '✓ Saved!'; setTimeout(() => { btn.textContent = 'Save to Journal'; }, 2000); }
    } catch (e) { /* ignore */ }
  }

  _renderJournal() {
    const content = this.element.querySelector('#dream-content');
    content.innerHTML = `
      <input type="text" class="dream-search" id="dream-search" placeholder="Search dreams..." />
      <div style="margin-bottom:12px;">
        <button class="dream-btn dream-btn-sm" id="dream-export-btn">Export Journal</button>
      </div>
      <div id="dream-journal-list"></div>
    `;

    this._loadJournalList('');

    content.querySelector('#dream-search').addEventListener('input', (e) => {
      this._loadJournalList(e.target.value);
    });

    content.querySelector('#dream-export-btn').addEventListener('click', () => this._exportJournal());
  }

  _loadJournalList(searchTerm) {
    const listEl = this.element.querySelector('#dream-journal-list');
    try {
      let dreams = JSON.parse(localStorage.getItem('nexus_dreams') || '[]');
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        dreams = dreams.filter(d =>
          d.title.toLowerCase().includes(term) ||
          d.description.toLowerCase().includes(term) ||
          (d.tags || []).some(t => t.toLowerCase().includes(term))
        );
      }

      if (dreams.length === 0) {
        listEl.innerHTML = '<p style="color:#7a5a8a;text-align:center;font-style:italic;padding:40px 0;">No dreams found. Record your first dream in the New Dream tab.</p>';
        return;
      }

      listEl.innerHTML = dreams.map(d => {
        const moodData = DREAM_MOODS.find(m => m.id === d.mood);
        const preview = d.description.substring(0, 100) + (d.description.length > 100 ? '...' : '');
        return `
          <div class="dream-journal-item" data-dream-id="${d.id}">
            <div class="dream-journal-date">${d.date}${d.lucid ? ' 🌙 Lucid' : ''}</div>
            <div class="dream-journal-title">${d.title}</div>
            <div class="dream-journal-preview">${preview}</div>
            ${moodData ? `<div class="dream-journal-mood">${moodData.emoji} ${moodData.label}</div>` : ''}
            ${d.tags && d.tags.length ? `<div style="margin-top:4px;">${d.tags.map(t => `<span class="dream-symbol-tag">${t}</span>`).join('')}</div>` : ''}
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.dream-journal-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = parseInt(item.dataset.dreamId);
          this._showDreamDetail(id);
        });
      });
    } catch (e) {
      listEl.innerHTML = '<p style="color:#7a5a8a;">Could not load dreams.</p>';
    }
  }

  _showDreamDetail(id) {
    try {
      const dreams = JSON.parse(localStorage.getItem('nexus_dreams') || '[]');
      const dream = dreams.find(d => d.id === id);
      if (!dream) return;

      const content = this.element.querySelector('#dream-content');
      const moodData = DREAM_MOODS.find(m => m.id === dream.mood);
      const symbols = this._extractSymbols(dream.description);

      content.innerHTML = `
        <button class="dream-btn dream-btn-sm" id="dream-back-btn" style="margin-bottom:16px;">← Back to Journal</button>
        <div class="dream-detail-modal">
          <div class="dream-journal-date">${dream.date}${dream.lucid ? ' 🌙 Lucid' : ''}</div>
          <h2 style="color:#ff1493;margin:8px 0;">${dream.title}</h2>
          ${moodData ? `<div class="dream-journal-mood" style="font-size:14px;margin-bottom:12px;">${moodData.emoji} ${moodData.label}</div>` : ''}
          <p style="color:#c8a0d8;line-height:1.8;white-space:pre-wrap;">${dream.description}</p>
          ${dream.tags && dream.tags.length ? `<div style="margin-top:12px;">${dream.tags.map(t => `<span class="dream-symbol-tag">${t}</span>`).join('')}</div>` : ''}
          ${symbols.length > 0 ? `
            <h4 style="color:#ffd700;margin-top:16px;">Detected Symbols</h4>
            ${symbols.map(s => `<p><span class="dream-highlight">${s.keyword}</span> — ${s.meaning}</p>`).join('')}
          ` : ''}
        </div>
        <div class="dream-center" style="margin-top:16px;">
          <button class="dream-btn dream-btn-sm" id="dream-delete-btn" style="background:rgba(255,0,0,0.1);border-color:rgba(255,0,0,0.3);">Delete Dream</button>
        </div>
      `;

      content.querySelector('#dream-back-btn').addEventListener('click', () => this._renderJournal());
      content.querySelector('#dream-delete-btn').addEventListener('click', () => {
        this._deleteDream(id);
        this._renderJournal();
      });
    } catch (e) { /* ignore */ }
  }

  _deleteDream(id) {
    try {
      let dreams = JSON.parse(localStorage.getItem('nexus_dreams') || '[]');
      dreams = dreams.filter(d => d.id !== id);
      localStorage.setItem('nexus_dreams', JSON.stringify(dreams));
    } catch (e) { /* ignore */ }
  }

  _renderStats() {
    const content = this.element.querySelector('#dream-content');
    try {
      const dreams = JSON.parse(localStorage.getItem('nexus_dreams') || '[]');

      if (dreams.length === 0) {
        content.innerHTML = '<p style="color:#7a5a8a;text-align:center;font-style:italic;padding:40px 0;">No dreams recorded yet. Start journaling to see your dream statistics.</p>';
        return;
      }

      // Calculate stats
      const allSymbols = {};
      const moodCounts = {};
      let totalWords = 0;
      let lucidCount = 0;

      dreams.forEach(d => {
        (d.symbols || []).forEach(s => { allSymbols[s] = (allSymbols[s] || 0) + 1; });
        if (d.mood) moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
        totalWords += (d.wordCount || 0);
        if (d.lucid) lucidCount++;
      });

      // Top symbols
      const topSymbols = Object.entries(allSymbols).sort((a, b) => b[1] - a[1]).slice(0, 10);
      const maxSymbolCount = topSymbols.length > 0 ? topSymbols[0][1] : 1;

      // Recurring dreams detection
      const recurring = this._detectRecurring(dreams);

      let html = '';

      // Overview
      html += `<div class="dream-stat-card">
        <div class="dream-stat-title">Overview</div>
        <p style="color:#c8a0d8;font-size:13px;">
          Total dreams: <span class="dream-highlight">${dreams.length}</span><br>
          Average length: <span class="dream-highlight">${Math.round(totalWords / dreams.length)} words</span><br>
          Lucid dreams: <span class="dream-highlight">${lucidCount} (${Math.round(lucidCount / dreams.length * 100)}%)</span>
        </p>
      </div>`;

      // Top symbols
      html += `<div class="dream-stat-card"><div class="dream-stat-title">Most Common Symbols</div>`;
      if (topSymbols.length > 0) {
        topSymbols.forEach(([sym, count]) => {
          const pct = Math.round((count / maxSymbolCount) * 100);
          html += `<div class="dream-bar">
            <span class="dream-bar-label">${sym}</span>
            <div class="dream-bar-fill" style="width:${pct}%;max-width:200px;"></div>
            <span class="dream-bar-value">${count}</span>
          </div>`;
        });
      } else {
        html += `<p style="color:#7a5a8a;font-size:12px;">No symbols detected yet.</p>`;
      }
      html += `</div>`;

      // Mood distribution
      html += `<div class="dream-stat-card"><div class="dream-stat-title">Mood Distribution</div>`;
      Object.entries(moodCounts).forEach(([moodId, count]) => {
        const moodData = DREAM_MOODS.find(m => m.id === moodId);
        const pct = Math.round((count / dreams.length) * 100);
        html += `<div class="dream-bar">
          <span class="dream-bar-label">${moodData ? moodData.emoji + ' ' + moodData.label : moodId}</span>
          <div class="dream-bar-fill" style="width:${pct}%;max-width:200px;"></div>
          <span class="dream-bar-value">${count}</span>
        </div>`;
      });
      html += `</div>`;

      // Recurring dreams
      if (recurring.length > 0) {
        html += `<div class="dream-stat-card"><div class="dream-stat-title">Potential Recurring Dreams</div>`;
        recurring.forEach(pair => {
          html += `<p style="color:#c8a0d8;font-size:13px;">
            <span class="dream-highlight">${pair[0].title}</span> ↔ <span class="dream-highlight">${pair[1].title}</span>
            (${Math.round(pair[2] * 100)}% symbol overlap)
          </p>`;
        });
        html += `</div>`;
      }

      content.innerHTML = html;
    } catch (e) {
      content.innerHTML = '<p style="color:#7a5a8a;">Could not calculate statistics.</p>';
    }
  }

  _detectRecurring(dreams) {
    const pairs = [];
    for (let i = 0; i < dreams.length; i++) {
      for (let j = i + 1; j < dreams.length; j++) {
        const s1 = new Set(dreams[i].symbols || []);
        const s2 = new Set(dreams[j].symbols || []);
        if (s1.size === 0 || s2.size === 0) continue;
        const intersection = new Set([...s1].filter(x => s2.has(x)));
        const union = new Set([...s1, ...s2]);
        const overlap = intersection.size / union.size;
        if (overlap > 0.4) {
          pairs.push([dreams[i], dreams[j], overlap]);
        }
      }
    }
    return pairs.sort((a, b) => b[2] - a[2]).slice(0, 5);
  }

  _exportJournal() {
    try {
      const dreams = JSON.parse(localStorage.getItem('nexus_dreams') || '[]');
      if (dreams.length === 0) return;

      let text = '═══ NEXUS DREAM JOURNAL ═══\n\n';
      dreams.forEach(d => {
        text += `─── ${d.title} ───\n`;
        text += `Date: ${d.date}\n`;
        if (d.mood) {
          const moodData = DREAM_MOODS.find(m => m.id === d.mood);
          text += `Mood: ${moodData ? moodData.label : d.mood}\n`;
        }
        if (d.lucid) text += '★ Lucid Dream\n';
        if (d.tags && d.tags.length) text += `Tags: ${d.tags.join(', ')}\n`;
        text += `\n${d.description}\n\n`;
        const symbols = this._extractSymbols(d.description);
        if (symbols.length) text += `Symbols: ${symbols.map(s => s.keyword).join(', ')}\n`;
        text += '\n────────────────────\n\n';
      });

      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nexus_dream_journal.txt';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { /* ignore */ }
  }
}

window.DreamAnalyzerApp = DreamAnalyzerApp;
