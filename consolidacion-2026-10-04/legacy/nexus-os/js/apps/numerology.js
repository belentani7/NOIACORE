'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Numerology Calculator
 *  Complete numerology with Pythagorean system and detailed descriptions.
 * ═══════════════════════════════════════════════════════════════
 */

const NUMBER_DESCRIPTIONS = {
  1: {
    name: 'The Leader',
    keywords: ['Independence','Originality','Ambition','Self-reliance','Pioneering'],
    positive: 'Number 1 embodies the primal force of creation and individuality. You are a natural-born leader with a powerful drive to achieve. Independent, ambitious, and self-determined, you forge your own path rather than following others. Your willpower is extraordinary, and when you set your mind to a goal, nothing can deter you. You possess original thinking and the courage to stand alone.',
    challenges: 'The shadow of 1 is stubbornness, domination, and an inability to accept help. You may become so focused on your goals that you steamroll others or refuse to delegate. Learning to collaborate without losing your independence is your life lesson.',
    career: 'Entrepreneurship, leadership roles, invention, freelance work, politics, pioneering fields',
    relationships: 'You need a partner who respects your independence and doesn\'t try to contain your drive. Best matches appreciate your strength without competing with it.',
    famous: ['Martin Luther King Jr.', 'Tom Hanks', 'Lady Gaga'],
    color: 'Red', planet: 'Sun', element: 'Fire'
  },
  2: {
    name: 'The Diplomat',
    keywords: ['Cooperation','Sensitivity','Balance','Harmony','Intuition'],
    positive: 'Number 2 embodies the principle of partnership and cooperation. You are the peacemaker, the diplomat, the one who creates harmony where there is discord. Highly intuitive and sensitive, you perceive the emotional undercurrents that others miss. Your strength lies not in force but in gentleness — the ability to bring people together and create synergy. You understand that true power often lies in yielding.',
    challenges: 'The shadow of 2 is oversensitivity, codependency, and passive-aggressiveness. You may sacrifice your own needs to keep the peace, or become so affected by others\' emotions that you lose yourself. Learning to set boundaries while maintaining your compassionate nature is essential.',
    career: 'Counseling, mediation, diplomacy, healthcare, arts, partnership-based work, teaching',
    relationships: 'You thrive in deep, committed partnerships. You give generously in love and need a partner who provides emotional security and appreciates your nurturing nature.',
    famous: ['Barack Obama', 'Jennifer Aniston', 'Kanye West'],
    color: 'Orange', planet: 'Moon', element: 'Water'
  },
  3: {
    name: 'The Creative',
    keywords: ['Expression','Creativity','Joy','Communication','Optimism'],
    positive: 'Number 3 embodies creative self-expression in all its forms. You are the artist, the communicator, the one who brings joy and inspiration through words, art, music, or any creative medium. Your natural charm and wit make you magnetic in social settings, and your optimism is contagious. You see possibilities where others see limitations, and your imagination is your greatest gift.',
    challenges: 'The shadow of 3 is scattered energy, superficiality, and emotional expression without depth. You may start many projects but finish few, or use humor and charm to avoid confronting deeper issues. Learning focus and emotional depth transforms your natural talent into mastery.',
    career: 'Writing, performing arts, design, communications, marketing, entertainment, public speaking',
    relationships: 'You need a partner who appreciates your creative spirit and doesn\'t dampen your enthusiasm. Emotional intimacy deepens when you learn to share your vulnerabilities alongside your brilliance.',
    famous: ['David Bowie', 'Snoop Dogg', 'Hillary Clinton'],
    color: 'Yellow', planet: 'Jupiter', element: 'Fire'
  },
  4: {
    name: 'The Builder',
    keywords: ['Stability','Hard Work','Practicality','Discipline','Foundation'],
    positive: 'Number 4 embodies the power of structure, discipline, and methodical building. You are the foundation upon which great things are constructed. Practical, reliable, and hardworking, you understand that lasting achievement comes through consistent effort and attention to detail. You create order from chaos, build systems that endure, and provide the stability that others depend upon.',
    challenges: 'The shadow of 4 is rigidity, stubbornness, and an inability to adapt. You may become so focused on the plan that you miss opportunities for spontaneity, or so committed to security that you resist necessary change. Learning flexibility while maintaining your structural gifts is your path to growth.',
    career: 'Engineering, architecture, management, accounting, military, project management, construction',
    relationships: 'You provide unwavering loyalty and stability in relationships. You need a partner who values commitment and appreciates the security you provide while encouraging you to lighten up occasionally.',
    famous: ['Oprah Winfrey', 'Bill Gates', 'Elton John'],
    color: 'Green', planet: 'Saturn', element: 'Earth'
  },
  5: {
    name: 'The Adventurer',
    keywords: ['Freedom','Adventure','Change','Versatility','Experience'],
    positive: 'Number 5 embodies the spirit of freedom, adventure, and transformative experience. You are the explorer, the one who must taste life in all its variety to feel alive. Versatile, adaptable, and magnetic, you thrive on change and new experiences. Your five senses are heightened, and you learn through direct experience rather than theory. You bring excitement and inspiration wherever you go.',
    challenges: 'The shadow of 5 is restlessness, addiction to stimulation, and an inability to commit. You may run from depth in pursuit of breadth, or use constant motion to avoid confronting inner stillness. Learning to find freedom within commitment, rather than freedom from it, is your evolution.',
    career: 'Travel, sales, journalism, consulting, public relations, adventure sports, anything with variety',
    relationships: 'You need a partner who gives you space and doesn\'t try to cage your spirit. The best relationships for you combine deep connection with mutual freedom and shared adventures.',
    famous: ['Abraham Lincoln', 'Angelina Jolie', 'Steven Spielberg'],
    color: 'Turquoise', planet: 'Mercury', element: 'Air'
  },
  6: {
    name: 'The Nurturer',
    keywords: ['Responsibility','Love','Harmony','Service','Healing'],
    positive: 'Number 6 embodies the energy of love, responsibility, and nurturing service. You are the caretaker, the healer, the one who creates beauty and harmony in home and community. Your heart is generous, your sense of justice strong, and your ability to nurture profound. You carry a deep responsibility for those you love and work tirelessly to create environments of warmth, beauty, and security.',
    challenges: 'The shadow of 6 is martyrdom, controlling behavior disguised as care, and perfectionism in domestic life. You may give until you are depleted, or try to fix everyone and everything. Learning that true love includes loving yourself is the essential lesson.',
    career: 'Healing professions, teaching, interior design, counseling, social work, hospitality, parenting',
    relationships: 'You are deeply committed in love and create beautiful, nurturing partnerships. You need a partner who appreciates your devotion without taking it for granted and who reminds you to care for yourself.',
    famous: ['John Lennon', 'Albert Einstein', 'Michael Jackson'],
    color: 'Blue', planet: 'Venus', element: 'Earth'
  },
  7: {
    name: 'The Seeker',
    keywords: ['Spirituality','Analysis','Wisdom','Introspection','Mystery'],
    positive: 'Number 7 embodies the quest for deeper truth, spiritual wisdom, and analytical understanding. You are the mystic-scholar, the one who seeks knowledge not for its practical utility but for its intrinsic value. Highly intuitive yet deeply analytical, you bridge the rational and the mystical. You need solitude to recharge, and your inner world is rich, complex, and endlessly fascinating.',
    challenges: 'The shadow of 7 is isolation, intellectual arrogance, and emotional detachment. You may retreat so deeply into your inner world that you lose connection with others, or become so analytical that you dismiss intuitive knowing. Learning to share your rich inner life while maintaining your sacred solitude is key.',
    career: 'Research, philosophy, spirituality, psychology, data analysis, writing, detective work, science',
    relationships: 'You need a partner who respects your need for solitude and appreciates your depth. Intellectual and spiritual connection matters as much as emotional intimacy. Shallow relationships drain you.',
    famous: ['Princess Diana', 'Elon Musk', 'Julia Roberts'],
    color: 'Violet', planet: 'Neptune', element: 'Water'
  },
  8: {
    name: 'The Powerhouse',
    keywords: ['Power','Abundance','Achievement','Authority','Manifestation'],
    positive: 'Number 8 embodies material mastery, executive ability, and the manifestation of abundance. You are the CEO of your own life, with an innate understanding of how power and resources flow. Ambitious, strategic, and resilient, you have the ability to build empires — whether of wealth, influence, or impact. You understand the relationship between effort and reward, and you play the long game with patience and determination.',
    challenges: 'The shadow of 8 is workaholism, materialism, and the equation of self-worth with net worth. You may sacrifice relationships and health in pursuit of achievement, or use power to control rather than empower. Learning that true abundance includes love, health, and inner peace is your essential evolution.',
    career: 'Business, finance, law, real estate, executive leadership, investment, politics',
    relationships: 'You are generous and protective in love but may struggle to prioritize emotional connection over professional ambition. You need a partner who is your equal in strength and who reminds you that love is the ultimate wealth.',
    famous: ['Sandra Bullock', 'Pablo Picasso', 'Nelson Mandela'],
    color: 'Dark Red', planet: 'Mars', element: 'Earth'
  },
  9: {
    name: 'The Humanitarian',
    keywords: ['Compassion','Completion','Universal Love','Wisdom','Transformation'],
    positive: 'Number 9 embodies universal love, compassion, and the completion of cycles. You are the old soul, the humanitarian, the one who carries the wisdom of all numbers within you. Your perspective is broad, your compassion deep, and your ability to see the big picture extraordinary. You are drawn to service, art, and any endeavor that makes the world more beautiful and just.',
    challenges: 'The shadow of 9 is self-sacrifice to the point of depletion, inability to let go, and carrying the weight of the world on your shoulders. You may struggle with endings and have difficulty releasing people, projects, or phases that have completed their purpose. Learning to release with grace is your path.',
    career: 'Humanitarian work, arts, healing, law, spiritual teaching, philanthropy, creative direction',
    relationships: 'You love deeply and universally, sometimes to the point of losing yourself in your partner\'s needs. You need a relationship that honors both your compassionate nature and your need for personal boundaries.',
    famous: ['Mahatma Gandhi', 'Beyoncé', 'Elvis Presley'],
    color: 'Gold', planet: 'Pluto', element: 'Fire'
  },
  11: {
    name: 'The Illuminator',
    keywords: ['Intuition','Inspiration','Illumination','Visionary','Spiritual Insight'],
    positive: 'Master Number 11 is the most intuitive of all numbers — a spiritual messenger channeling higher wisdom. You possess extraordinary sensitivity and psychic awareness, functioning as a bridge between the conscious and unconscious realms. Your insights carry transformative power, and when you trust your intuition, you access knowledge that transcends ordinary perception. You illuminate paths for others.',
    challenges: 'The shadow of 11 is nervous energy, anxiety from heightened sensitivity, and the burden of carrying visionary awareness in an unprepared world. You may feel overwhelmed by what you perceive or doubt your own intuitive gifts. Grounding practices and self-trust are essential.',
    career: 'Spiritual teaching, intuitive counseling, visionary leadership, artistic genius, therapy, mediumship',
    relationships: 'You experience love at a transcendent level and need a partner who can meet you in the depths. Emotional intensity is your norm — learning to modulate it without suppressing it is key.',
    famous: ['Michelle Obama', 'Bill Clinton', 'Prince William'],
    color: 'Silver', planet: 'Uranus', element: 'Air', master: true
  },
  22: {
    name: 'The Master Builder',
    keywords: ['Vision','Manifestation','Power','Practical Idealism','Legacy'],
    positive: 'Master Number 22 is the Master Builder — the most powerful number in numerology. You possess the rare ability to turn the grandest visions into concrete reality. Combining the spiritual insight of 11 with the practical building power of 4, you are equipped to create structures, systems, and institutions that serve humanity on a massive scale. Your potential is virtually limitless when you trust both your vision and your ability to execute.',
    challenges: 'The shadow of 22 is the crushing weight of your own potential. You may feel paralyzed by the enormity of what you could achieve, or swing between grandiosity and self-doubt. The gap between your vision and your current reality can feel overwhelming. Learning to build step by step, with patience and self-compassion, is essential.',
    career: 'Architecture at scale, global leadership, institution-building, engineering mega-projects, diplomacy, systems design',
    relationships: 'You need a partner who understands the magnitude of your calling and supports your mission without feeling secondary to it. Building a shared vision strengthens your bond.',
    famous: ['Paul McCartney', 'Will Smith', 'Dalai Lama'],
    color: 'Gold', planet: 'Vulcan', element: 'Earth', master: true
  },
  33: {
    name: 'The Master Teacher',
    keywords: ['Selfless Service','Compassion','Teaching','Healing','Spiritual Mastery'],
    positive: 'Master Number 33 is the Master Teacher — the rarest and most spiritually evolved number. You embody the compassion of 6 raised to its highest power, combined with the visionary awareness of 11. Your life purpose is to uplift humanity through selfless service, teaching, and healing. You carry an almost unbearable sensitivity to suffering and an equally powerful drive to alleviate it. Your presence alone can catalyze transformation in others.',
    challenges: 'The shadow of 33 is the overwhelming burden of universal compassion. You may take on the suffering of the world as your personal responsibility, leading to emotional and physical exhaustion. Learning to serve without absorbing, to love without losing yourself, is the delicate balance of this master number.',
    career: 'Spiritual leadership, healing at scale, education reform, humanitarian directing, artistic genius with social impact',
    relationships: 'You love with a depth and breadth that most cannot match. You need a partner who is spiritually mature and who supports your mission of service without competing for your attention.',
    famous: ['Meryl Streep', 'Stephen King', 'Francis Ford Coppola'],
    color: 'White Gold', planet: 'Master', element: 'Water', master: true
  }
};

const COMPAT_MATRIX = {
  '1-1': { score: 65, desc: 'Two leaders — dynamic but competitive. Each must learn to share the spotlight.' },
  '1-2': { score: 75, desc: 'The leader and the diplomat complement each other beautifully when roles are respected.' },
  '1-3': { score: 80, desc: 'The leader provides direction; the creative provides expression. An inspiring combination.' },
  '1-4': { score: 70, desc: 'Vision meets execution. Powerful when aligned, frustrating when the builder finds the leader too impulsive.' },
  '1-5': { score: 68, desc: 'Two independent spirits — exciting but potentially unstable. Freedom is essential for both.' },
  '1-6': { score: 72, desc: 'The leader achieves; the nurturer supports. Balanced when both contribute equally.' },
  '1-7': { score: 58, desc: 'Action meets introspection. The leader may find the seeker too withdrawn; the seeker finds the leader too brash.' },
  '1-8': { score: 85, desc: 'Powerhouse pairing — two ambitious forces combining for extraordinary achievement.' },
  '1-9': { score: 70, desc: 'The individualist and the humanitarian — different scopes, compatible drives.' },
  '2-2': { score: 80, desc: 'Deep harmony and mutual understanding. May lack initiative if both wait for the other to lead.' },
  '2-3': { score: 78, desc: 'Sensitivity meets expression. The diplomat creates safety; the creative fills it with beauty.' },
  '2-4': { score: 82, desc: 'Harmony meets stability. A deeply secure and nurturing combination.' },
  '2-5': { score: 55, desc: 'The diplomat craves stability; the adventurer craves change. Requires significant compromise.' },
  '2-6': { score: 90, desc: 'The most nurturing combination — deep mutual care, domestic harmony, and emotional richness.' },
  '2-7': { score: 70, desc: 'Intuition meets introspection. Both feel deeply but express differently. Patience builds bridges.' },
  '2-8': { score: 68, desc: 'The diplomat softens the powerhouse. Emotional and material balance when both contribute.' },
  '2-9': { score: 80, desc: 'Personal compassion meets universal love. Both give generously and understand deeply.' },
  '3-3': { score: 75, desc: 'Double creative energy — joyful and expressive, but may lack grounding and focus.' },
  '3-4': { score: 55, desc: 'Creativity meets structure — potentially frustrating unless each values the other\'s gifts.' },
  '3-5': { score: 88, desc: 'Creative expression meets adventure — a dynamic, exciting, and endlessly stimulating combination.' },
  '3-6': { score: 82, desc: 'Expression meets nurturing. The creative brings joy; the nurturer creates the safe space for it.' },
  '3-7': { score: 62, desc: 'Expression meets introspection. The creative may find the seeker too quiet; the seeker may find the creative too loud.' },
  '3-8': { score: 72, desc: 'Creativity meets ambition. The creative humanizes the powerhouse; the powerhouse gives the creative resources.' },
  '3-9': { score: 85, desc: 'Personal expression meets universal vision. Art with purpose — a deeply inspiring combination.' },
  '4-4': { score: 78, desc: 'Double stability — incredibly secure but potentially rigid. Both must learn to bend.' },
  '4-5': { score: 45, desc: 'Structure meets freedom — the most challenging pairing. Growth requires each to embrace the other\'s nature.' },
  '4-6': { score: 85, desc: 'Stability meets nurturing — a deeply secure, home-centered combination. Strong foundation for family.' },
  '4-7': { score: 60, desc: 'Practicality meets spirituality. Each can learn from the other, but the initial approach differs greatly.' },
  '4-8': { score: 82, desc: 'The builder meets the powerhouse — a business-oriented combination with strong execution potential.' },
  '4-9': { score: 62, desc: 'Structure meets humanitarian vision. The builder creates the systems; the visionary provides the purpose.' },
  '5-5': { score: 70, desc: 'Double adventure — thrilling but unstable. Both crave freedom, which can mean freedom from each other.' },
  '5-6': { score: 52, desc: 'Freedom meets responsibility — a fundamental tension. Growth requires honoring both needs.' },
  '5-7': { score: 72, desc: 'External adventure meets internal exploration. Both seek depth through different paths.' },
  '5-8': { score: 60, desc: 'Freedom meets power — potentially explosive. The adventurer may chafe under the powerhouse\'s control.' },
  '5-9': { score: 75, desc: 'Personal freedom meets universal compassion. Both value experience and growth. Compatible spirits.' },
  '6-6': { score: 85, desc: 'Double nurturing — deeply loving and domestic, but may compete for the caregiver role.' },
  '6-7': { score: 68, desc: 'Heart meets mind. The nurturer gives emotionally; the seeker gives intellectually. Both are generous.' },
  '6-8': { score: 78, desc: 'Love meets power. The nurturer softens the powerhouse; the powerhouse provides material security.' },
  '6-9': { score: 88, desc: 'Personal love meets universal love. A deeply compassionate and service-oriented combination.' },
  '7-7': { score: 75, desc: 'Double depth — profoundly spiritual but potentially isolated. Both need solitude, which can mean isolation together.' },
  '7-8': { score: 58, desc: 'Spirit meets matter. The seeker may find the powerhouse too materialistic; the powerhouse may find the seeker impractical.' },
  '7-9': { score: 80, desc: 'Personal wisdom meets universal wisdom. A deeply spiritual connection with shared understanding of life\'s mysteries.' },
  '8-8': { score: 72, desc: 'Double power — ambitious and successful, but potentially competitive and work-obsessed.' },
  '8-9': { score: 75, desc: 'Material power meets humanitarian vision. When aligned, they create wealth that serves the greater good.' },
  '9-9': { score: 82, desc: 'Double compassion — deeply loving and idealistic. Both must guard against emotional overwhelm.' }
};

class NumerologyApp {
  constructor(container) {
    this.container = container;
    this.element = null;
    this._styleEl = null;
    this.view = 'calculator';
    this.results = null;
  }

  render() {
    this._injectStyles();
    this.element = document.createElement('div');
    this.element.className = 'numerology-app';
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
      .numerology-app {
        width: 100%; height: 100%; overflow-y: auto;
        background: rgba(10,5,15,0.97); color: #e0d0e8;
        font-family: 'Georgia', serif; padding: 20px;
        box-sizing: border-box;
      }
      .num-header { text-align: center; margin-bottom: 14px; }
      .num-title {
        font-size: 26px; color: #ff1493; margin: 0 0 4px 0;
        text-shadow: 0 0 20px #ff003c; letter-spacing: 2px;
      }
      .num-subtitle { color: #a080b0; font-style: italic; font-size: 13px; margin: 0; }
      .num-nav {
        display: flex; justify-content: center;
        gap: 6px; margin-bottom: 18px;
      }
      .num-nav-btn {
        padding: 7px 16px; border-radius: 18px;
        background: rgba(255,20,147,0.06);
        border: 1px solid rgba(255,20,147,0.15);
        color: #a080b0; font-size: 12px;
        cursor: pointer; transition: all 0.3s;
        font-family: inherit;
      }
      .num-nav-btn:hover { background: rgba(255,20,147,0.12); }
      .num-nav-btn.active {
        background: rgba(255,20,147,0.18);
        border-color: #ff1493; color: #ff1493;
      }
      .num-panel {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,20,147,0.1);
        border-radius: 16px; padding: 24px;
        backdrop-filter: blur(8px);
        max-width: 700px; margin: 0 auto;
      }
      .num-input-group { margin-bottom: 14px; }
      .num-label {
        display: block; font-size: 12px;
        color: #ff1493; margin-bottom: 4px;
        letter-spacing: 1px;
      }
      .num-input {
        width: 100%; padding: 10px 14px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,20,147,0.2);
        border-radius: 8px; color: #e0d0e8;
        font-size: 14px; font-family: inherit;
        outline: none; box-sizing: border-box;
      }
      .num-input:focus {
        border-color: #ff1493;
        box-shadow: 0 0 10px rgba(255,20,147,0.2);
      }
      .num-input::placeholder { color: #7a5a8a; font-style: italic; }
      .num-btn {
        padding: 10px 24px; border-radius: 20px;
        background: linear-gradient(135deg, #ff003c, #ff1493);
        border: none; color: #fff; font-size: 14px;
        font-weight: bold; cursor: pointer;
        box-shadow: 0 0 15px rgba(255,0,60,0.3);
        transition: all 0.3s; font-family: inherit;
        margin: 6px;
      }
      .num-btn:hover { transform: translateY(-2px); }
      .num-btn-sm {
        padding: 6px 14px; font-size: 12px;
        background: rgba(255,20,147,0.1);
        border: 1px solid rgba(255,20,147,0.25);
        box-shadow: none;
      }
      .num-center { text-align: center; }
      .num-result-card {
        background: rgba(255,20,147,0.04);
        border: 1px solid rgba(255,20,147,0.12);
        border-radius: 14px; padding: 20px;
        margin-bottom: 14px;
        transition: all 0.3s;
      }
      .num-result-card:hover {
        border-color: rgba(255,20,147,0.25);
      }
      .num-result-card.expanded {
        background: rgba(255,20,147,0.06);
        border-color: #ff1493;
      }
      .num-number-display {
        font-size: 42px; color: #ff1493;
        font-weight: bold;
        text-shadow: 0 0 20px rgba(255,20,147,0.5), 0 0 40px rgba(255,20,147,0.2);
        display: inline-block;
        min-width: 60px; text-align: center;
      }
      .num-number-display.master {
        color: #ffd700;
        text-shadow: 0 0 20px rgba(255,215,0,0.5), 0 0 40px rgba(255,215,0,0.2);
      }
      .num-result-header {
        display: flex; align-items: center;
        gap: 16px; cursor: pointer;
      }
      .num-result-info { flex: 1; }
      .num-result-type { font-size: 14px; color: #ffd700; }
      .num-result-name { font-size: 16px; color: #ff1493; font-weight: bold; }
      .num-result-keywords { font-size: 11px; color: #a080b0; margin-top: 2px; }
      .num-result-detail {
        margin-top: 16px; display: none;
        line-height: 1.7; font-size: 13px;
      }
      .num-result-card.expanded .num-result-detail { display: block; }
      .num-result-detail h4 { color: #ffd700; margin: 12px 0 4px 0; font-size: 13px; }
      .num-step {
        background: rgba(0,0,0,0.2);
        border-radius: 6px; padding: 8px 12px;
        margin: 6px 0; font-size: 12px;
        color: #c8a0d8;
        font-family: 'Courier New', monospace;
      }
      .num-summary-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 10px; margin-bottom: 20px;
      }
      .num-summary-card {
        background: rgba(255,20,147,0.04);
        border: 1px solid rgba(255,20,147,0.12);
        border-radius: 12px; padding: 14px;
        text-align: center;
      }
      .num-compat-grid {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 12px; margin-bottom: 16px;
      }
      .num-select {
        width: 100%; padding: 10px 14px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,20,147,0.2);
        border-radius: 8px; color: #e0d0e8;
        font-size: 14px; font-family: inherit;
        outline: none;
      }
      .num-select option { background: #1a0a2e; }
      .num-compat-result {
        background: rgba(255,20,147,0.04);
        border: 1px solid rgba(255,20,147,0.12);
        border-radius: 12px; padding: 18px;
        margin-top: 12px;
      }
      .num-compat-score {
        font-size: 36px; color: #ff1493;
        text-shadow: 0 0 15px rgba(255,20,147,0.5);
        text-align: center; margin-bottom: 8px;
      }
    `;
    document.head.appendChild(this._styleEl);
  }

  _renderUI() {
    this.element.innerHTML = `
      <div class="num-header">
        <h1 class="num-title">✦ Numerology ✦</h1>
        <p class="num-subtitle">Numbers hold the code of the universe</p>
      </div>
      <div class="num-nav">
        <button class="num-nav-btn${this.view === 'calculator' ? ' active' : ''}" data-view="calculator">🔢 Calculator</button>
        <button class="num-nav-btn${this.view === 'compat' ? ' active' : ''}" data-view="compat">♡ Compatibility</button>
        <button class="num-nav-btn${this.view === 'encyclopedia' ? ' active' : ''}" data-view="encyclopedia">📖 Numbers 1-33</button>
      </div>
      <div class="num-panel" id="num-content"></div>
    `;

    this.element.querySelectorAll('.num-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.view = btn.dataset.view;
        this.element.querySelectorAll('.num-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderView();
      });
    });

    this._renderView();
  }

  _renderView() {
    switch (this.view) {
      case 'calculator': this._renderCalculator(); break;
      case 'compat': this._renderCompatibility(); break;
      case 'encyclopedia': this._renderEncyclopedia(); break;
    }
  }

  _renderCalculator() {
    const content = this.element.querySelector('#num-content');
    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 16px 0;" class="num-center">Calculate Your Numbers</h3>
      <div class="num-input-group">
        <label class="num-label">FULL BIRTH NAME</label>
        <input type="text" class="num-input" id="num-name" placeholder="Enter your full name at birth..." />
      </div>
      <div class="num-input-group">
        <label class="num-label">DATE OF BIRTH</label>
        <input type="date" class="num-input" id="num-dob" />
      </div>
      <div class="num-center">
        <button class="num-btn" id="num-calc-btn">✦ Calculate All Numbers</button>
      </div>
      <div id="num-results"></div>
    `;

    content.querySelector('#num-calc-btn').addEventListener('click', () => this._calculate());
  }

  _calculate() {
    const name = this.element.querySelector('#num-name').value.trim();
    const dob = this.element.querySelector('#num-dob').value;

    if (!name && !dob) return;

    const resultsEl = this.element.querySelector('#num-results');
    this.results = {};

    let html = '<div style="margin-top:20px;">';

    // Summary grid
    html += '<div class="num-summary-grid">';

    if (dob) {
      const lp = this._calcLifePath(dob);
      this.results.lifePath = lp;
      html += this._summaryCard('Life Path', lp.number, lp.steps);
    }

    if (name) {
      const dest = this._calcDestiny(name);
      this.results.destiny = dest;
      html += this._summaryCard('Destiny', dest.number, dest.steps);

      const soul = this._calcSoulUrge(name);
      this.results.soulUrge = soul;
      html += this._summaryCard('Soul Urge', soul.number, soul.steps);

      const pers = this._calcPersonality(name);
      this.results.personality = pers;
      html += this._summaryCard('Personality', pers.number, pers.steps);
    }

    if (dob) {
      const py = this._calcPersonalYear(dob);
      this.results.personalYear = py;
      html += this._summaryCard('Personal Year', py.number, py.steps);

      const pm = this._calcPersonalMonth(dob);
      this.results.personalMonth = pm;
      html += this._summaryCard('Personal Month', pm.number, pm.steps);

      const pd = this._calcPersonalDay(dob);
      this.results.personalDay = pd;
      html += this._summaryCard('Personal Day', pd.number, pd.steps);
    }

    html += '</div>';

    // Detailed cards
    if (this.results.lifePath) html += this._detailCard('Life Path Number', this.results.lifePath, 'Derived from your birth date — reveals your life\'s purpose and the path you\'re here to walk.');
    if (this.results.destiny) html += this._detailCard('Destiny / Expression Number', this.results.destiny, 'Derived from all letters in your name — reveals your natural talents and what you\'re destined to become.');
    if (this.results.soulUrge) html += this._detailCard('Soul Urge / Heart\'s Desire', this.results.soulUrge, 'Derived from vowels in your name — reveals your inner motivations and deepest desires.');
    if (this.results.personality) html += this._detailCard('Personality Number', this.results.personality, 'Derived from consonants in your name — reveals how others perceive you at first impression.');
    if (this.results.personalYear) html += this._detailCard('Personal Year Number', this.results.personalYear, 'Your current yearly cycle theme and energy.');
    if (this.results.personalMonth) html += this._detailCard('Personal Month Number', this.results.personalMonth, 'The energy of your current month.');
    if (this.results.personalDay) html += this._detailCard('Personal Day Number', this.results.personalDay, 'Today\'s personal energy and guidance.');

    html += '</div>';
    resultsEl.innerHTML = html;

    // Toggle detail cards
    resultsEl.querySelectorAll('.num-result-header').forEach(header => {
      header.addEventListener('click', () => {
        header.closest('.num-result-card').classList.toggle('expanded');
      });
    });

    // Save results
    this._saveResults();
  }

  _summaryCard(type, number, steps) {
    const desc = NUMBER_DESCRIPTIONS[number];
    const isMaster = desc && desc.master;
    return `
      <div class="num-summary-card">
        <div class="num-number-display${isMaster ? ' master' : ''}">${number}</div>
        <div style="font-size:12px;color:#ff1493;margin-top:4px;">${type}</div>
        <div style="font-size:10px;color:#a080b0;">${desc ? desc.name : ''}</div>
      </div>
    `;
  }

  _detailCard(type, result, intro) {
    const desc = NUMBER_DESCRIPTIONS[result.number];
    if (!desc) return '';

    return `
      <div class="num-result-card">
        <div class="num-result-header">
          <div class="num-number-display${desc.master ? ' master' : ''}">${result.number}</div>
          <div class="num-result-info">
            <div class="num-result-type">${type}</div>
            <div class="num-result-name">${desc.name}</div>
            <div class="num-result-keywords">${desc.keywords.join(' • ')}</div>
          </div>
        </div>
        <div class="num-result-detail">
          <p style="color:#a080b0;font-style:italic;">${intro}</p>
          <h4>Calculation Steps</h4>
          ${result.steps.map(s => `<div class="num-step">${s}</div>`).join('')}
          <h4>Description</h4>
          <p>${desc.positive}</p>
          <h4>Challenges</h4>
          <p>${desc.challenges}</p>
          <h4>Career Paths</h4>
          <p>${desc.career}</p>
          <h4>Relationships</h4>
          <p>${desc.relationships}</p>
          <h4>Famous ${desc.name}s</h4>
          <p>${desc.famous.join(', ')}</p>
          <h4>Associations</h4>
          <p>Color: ${desc.color} | Planet: ${desc.planet} | Element: ${desc.element}</p>
        </div>
      </div>
    `;
  }

  _reduce(num, steps, label) {
    while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
      const digits = String(num).split('').map(Number);
      const prev = num;
      num = digits.reduce((a, b) => a + b, 0);
      steps.push(`${label}: ${digits.join(' + ')} = ${num}${(num === 11 || num === 22 || num === 33) ? ' (Master Number — not reduced)' : ''}`);
    }
    return num;
  }

  _calcLifePath(dob) {
    const date = new Date(dob);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const steps = [];

    let m = month;
    steps.push(`Month: ${month}`);
    m = this._reduce(m, steps, 'Month reduce');

    let d = day;
    steps.push(`Day: ${day}`);
    d = this._reduce(d, steps, 'Day reduce');

    const yearDigits = String(year).split('').map(Number);
    let y = yearDigits.reduce((a, b) => a + b, 0);
    steps.push(`Year: ${yearDigits.join(' + ')} = ${y}`);
    y = this._reduce(y, steps, 'Year reduce');

    let total = m + d + y;
    steps.push(`Sum: ${m} + ${d} + ${y} = ${total}`);
    total = this._reduce(total, steps, 'Final reduce');

    return { number: total, steps };
  }

  _calcDestiny(name) {
    const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
    const values = letters.split('').map(l => this._letterValue(l));
    const steps = [];
    steps.push(`Name: ${name}`);
    steps.push(`Letters: ${letters.split('').map((l, i) => `${l}=${values[i]}`).join(', ')}`);

    let total = values.reduce((a, b) => a + b, 0);
    steps.push(`Sum: ${values.join(' + ')} = ${total}`);
    total = this._reduce(total, steps, 'Reduce');

    return { number: total, steps };
  }

  _calcSoulUrge(name) {
    const vowels = 'AEIOU';
    const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
    const vowelLetters = letters.split('').filter(l => vowels.includes(l));
    const values = vowelLetters.map(l => this._letterValue(l));
    const steps = [];
    steps.push(`Vowels in "${name}": ${vowelLetters.join(', ')}`);
    steps.push(`Values: ${vowelLetters.map((l, i) => `${l}=${values[i]}`).join(', ')}`);

    let total = values.length > 0 ? values.reduce((a, b) => a + b, 0) : 0;
    steps.push(`Sum: ${values.join(' + ')} = ${total}`);
    total = this._reduce(total, steps, 'Reduce');

    return { number: total, steps };
  }

  _calcPersonality(name) {
    const vowels = 'AEIOU';
    const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
    const consonants = letters.split('').filter(l => !vowels.includes(l));
    const values = consonants.map(l => this._letterValue(l));
    const steps = [];
    steps.push(`Consonants in "${name}": ${consonants.join(', ')}`);
    steps.push(`Values: ${consonants.map((l, i) => `${l}=${values[i]}`).join(', ')}`);

    let total = values.length > 0 ? values.reduce((a, b) => a + b, 0) : 0;
    steps.push(`Sum: ${values.join(' + ')} = ${total}`);
    total = this._reduce(total, steps, 'Reduce');

    return { number: total, steps };
  }

  _calcPersonalYear(dob) {
    const date = new Date(dob);
    const now = new Date();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const currentYear = now.getFullYear();
    const steps = [];

    steps.push(`Birth month: ${month}, Birth day: ${day}, Current year: ${currentYear}`);
    const yearDigits = String(currentYear).split('').map(Number);
    let yearSum = yearDigits.reduce((a, b) => a + b, 0);
    steps.push(`Year sum: ${yearDigits.join(' + ')} = ${yearSum}`);
    yearSum = this._reduce(yearSum, steps, 'Year reduce');

    let total = month + day + yearSum;
    steps.push(`${month} + ${day} + ${yearSum} = ${total}`);
    total = this._reduce(total, steps, 'Reduce');

    return { number: total, steps };
  }

  _calcPersonalMonth(dob) {
    const py = this._calcPersonalYear(dob);
    const currentMonth = new Date().getMonth() + 1;
    const steps = [...py.steps];
    steps.push(`--- Personal Month ---`);
    steps.push(`Personal Year: ${py.number}, Current Month: ${currentMonth}`);

    let total = py.number + currentMonth;
    steps.push(`${py.number} + ${currentMonth} = ${total}`);
    total = this._reduce(total, steps, 'Reduce');

    return { number: total, steps };
  }

  _calcPersonalDay(dob) {
    const pm = this._calcPersonalMonth(dob);
    const currentDay = new Date().getDate();
    const steps = [...pm.steps];
    steps.push(`--- Personal Day ---`);
    steps.push(`Personal Month: ${pm.number}, Today: ${currentDay}`);

    let total = pm.number + currentDay;
    steps.push(`${pm.number} + ${currentDay} = ${total}`);
    total = this._reduce(total, steps, 'Reduce');

    return { number: total, steps };
  }

  _letterValue(letter) {
    // Pythagorean system: A-I=1-9, J-R=1-9, S-Z=1-8
    const map = {
      A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
      J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
      S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8
    };
    return map[letter] || 0;
  }

  _saveResults() {
    try {
      localStorage.setItem('nexus_numerology', JSON.stringify(this.results));
    } catch (e) { /* ignore */ }
  }

  _renderCompatibility() {
    const content = this.element.querySelector('#num-content');
    const numbers = [1,2,3,4,5,6,7,8,9,11,22,33];
    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 16px 0;" class="num-center">Number Compatibility</h3>
      <div class="num-compat-grid">
        <div>
          <label class="num-label">LIFE PATH NUMBER 1</label>
          <select class="num-select" id="num-compat1">
            ${numbers.map(n => `<option value="${n}">${n}${NUMBER_DESCRIPTIONS[n].master ? ' (Master)' : ''} — ${NUMBER_DESCRIPTIONS[n].name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="num-label">LIFE PATH NUMBER 2</label>
          <select class="num-select" id="num-compat2">
            ${numbers.map(n => `<option value="${n}">${n}${NUMBER_DESCRIPTIONS[n].master ? ' (Master)' : ''} — ${NUMBER_DESCRIPTIONS[n].name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="num-center">
        <button class="num-btn" id="num-compat-btn">Check Compatibility</button>
      </div>
      <div id="num-compat-result"></div>
    `;

    content.querySelector('#num-compat-btn').addEventListener('click', () => {
      const n1 = parseInt(content.querySelector('#num-compat1').value);
      const n2 = parseInt(content.querySelector('#num-compat2').value);
      this._showCompat(n1, n2);
    });
  }

  _showCompat(n1, n2) {
    const key1 = `${n1}-${n2}`;
    const key2 = `${n2}-${n1}`;
    const compat = COMPAT_MATRIX[key1] || COMPAT_MATRIX[key2] || { score: 55, desc: 'A unique combination with its own dynamics. Both numbers bring distinct energies that, when consciously integrated, create something new.' };

    const d1 = NUMBER_DESCRIPTIONS[n1];
    const d2 = NUMBER_DESCRIPTIONS[n2];
    const resultEl = this.element.querySelector('#num-compat-result');

    resultEl.innerHTML = `
      <div class="num-compat-result">
        <div class="num-compat-score">${compat.score}%</div>
        <div class="num-center" style="color:#ffd700;font-size:15px;margin-bottom:8px;">
          ${d1.name} × ${d2.name}
        </div>
        <p style="color:#c8a0d8;line-height:1.7;">${compat.desc}</p>
        <div style="margin-top:12px;">
          <h4 style="color:#ff1493;font-size:13px;">${d1.name} (${n1}) brings:</h4>
          <p style="font-size:12px;">${d1.keywords.join(', ')}</p>
          <h4 style="color:#ff1493;font-size:13px;">${d2.name} (${n2}) brings:</h4>
          <p style="font-size:12px;">${d2.keywords.join(', ')}</p>
        </div>
      </div>
    `;
  }

  _renderEncyclopedia() {
    const content = this.element.querySelector('#num-content');
    const numbers = [1,2,3,4,5,6,7,8,9,11,22,33];

    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 16px 0;" class="num-center">Number Encyclopedia</h3>
      <p style="color:#a080b0;font-size:13px;text-align:center;margin-bottom:16px;">Click any number to expand</p>
      <div id="num-ency-list">
        ${numbers.map(n => {
          const d = NUMBER_DESCRIPTIONS[n];
          return `
            <div class="num-result-card" data-num="${n}">
              <div class="num-result-header">
                <div class="num-number-display${d.master ? ' master' : ''}">${n}</div>
                <div class="num-result-info">
                  <div class="num-result-name">${d.name}</div>
                  <div class="num-result-keywords">${d.keywords.join(' • ')}</div>
                </div>
              </div>
              <div class="num-result-detail">
                <h4>Positive Traits</h4>
                <p>${d.positive}</p>
                <h4>Challenges</h4>
                <p>${d.challenges}</p>
                <h4>Career Paths</h4>
                <p>${d.career}</p>
                <h4>Relationships</h4>
                <p>${d.relationships}</p>
                <h4>Famous Examples</h4>
                <p>${d.famous.join(', ')}</p>
                <h4>Associations</h4>
                <p>Color: ${d.color} | Planet: ${d.planet} | Element: ${d.element}</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    content.querySelectorAll('.num-result-header').forEach(header => {
      header.addEventListener('click', () => {
        header.closest('.num-result-card').classList.toggle('expanded');
      });
    });
  }
}

window.NumerologyApp = NumerologyApp;
