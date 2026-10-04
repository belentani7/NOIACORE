'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Horoscope App
 *  Zodiac readings, compatibility, birth chart basics, and wheel.
 * ═══════════════════════════════════════════════════════════════
 */

const ZODIAC_SIGNS = [
  { name:'Aries', symbol:'♈', dates:'Mar 21 - Apr 19', startMonth:3, startDay:21, endMonth:4, endDay:19, element:'Fire', modality:'Cardinal', ruler:'Mars', traits:['Courageous','Energetic','Pioneering','Impulsive','Passionate'], strengths:'Natural leader, courageous, enthusiastic, confident, honest', weaknesses:'Impatient, aggressive, short-tempered, impulsive', color:'Red', stone:'Diamond', bodyPart:'Head' },
  { name:'Taurus', symbol:'♉', dates:'Apr 20 - May 20', startMonth:4, startDay:20, endMonth:5, endDay:20, element:'Earth', modality:'Fixed', ruler:'Venus', traits:['Reliable','Patient','Devoted','Stubborn','Sensual'], strengths:'Dependable, patient, practical, devoted, responsible', weaknesses:'Stubborn, possessive, uncompromising, materialistic', color:'Green', stone:'Emerald', bodyPart:'Throat' },
  { name:'Gemini', symbol:'♊', dates:'May 21 - Jun 20', startMonth:5, startDay:21, endMonth:6, endDay:20, element:'Air', modality:'Mutable', ruler:'Mercury', traits:['Adaptable','Curious','Witty','Inconsistent','Communicative'], strengths:'Gentle, affectionate, curious, adaptable, quick learner', weaknesses:'Nervous, inconsistent, superficial, indecisive', color:'Yellow', stone:'Agate', bodyPart:'Arms & Lungs' },
  { name:'Cancer', symbol:'♋', dates:'Jun 21 - Jul 22', startMonth:6, startDay:21, endMonth:7, endDay:22, element:'Water', modality:'Cardinal', ruler:'Moon', traits:['Nurturing','Intuitive','Protective','Moody','Empathetic'], strengths:'Tenacious, highly imaginative, loyal, emotionally deep, persuasive', weaknesses:'Moody, pessimistic, suspicious, manipulative, insecure', color:'Silver', stone:'Pearl', bodyPart:'Chest' },
  { name:'Leo', symbol:'♌', dates:'Jul 23 - Aug 22', startMonth:7, startDay:23, endMonth:8, endDay:22, element:'Fire', modality:'Fixed', ruler:'Sun', traits:['Creative','Generous','Warm','Dramatic','Proud'], strengths:'Creative, passionate, generous, warm-hearted, cheerful', weaknesses:'Arrogant, stubborn, self-centered, lazy, inflexible', color:'Gold', stone:'Ruby', bodyPart:'Heart' },
  { name:'Virgo', symbol:'♍', dates:'Aug 23 - Sep 22', startMonth:8, startDay:23, endMonth:9, endDay:22, element:'Earth', modality:'Mutable', ruler:'Mercury', traits:['Analytical','Practical','Diligent','Critical','Modest'], strengths:'Loyal, analytical, kind, hardworking, practical', weaknesses:'Shyness, worry, overly critical, harsh, perfectionist', color:'Navy', stone:'Sapphire', bodyPart:'Digestive System' },
  { name:'Libra', symbol:'♎', dates:'Sep 23 - Oct 22', startMonth:9, startDay:23, endMonth:10, endDay:22, element:'Air', modality:'Cardinal', ruler:'Venus', traits:['Diplomatic','Graceful','Fair','Indecisive','Harmonious'], strengths:'Cooperative, diplomatic, gracious, fair-minded, social', weaknesses:'Indecisive, avoids confrontations, self-pity, unreliable', color:'Pink', stone:'Opal', bodyPart:'Kidneys' },
  { name:'Scorpio', symbol:'♏', dates:'Oct 23 - Nov 21', startMonth:10, startDay:23, endMonth:11, endDay:21, element:'Water', modality:'Fixed', ruler:'Pluto', traits:['Intense','Passionate','Resourceful','Secretive','Transformative'], strengths:'Resourceful, brave, passionate, stubborn, a true friend', weaknesses:'Distrusting, jealous, secretive, violent, manipulative', color:'Crimson', stone:'Topaz', bodyPart:'Reproductive System' },
  { name:'Sagittarius', symbol:'♐', dates:'Nov 22 - Dec 21', startMonth:11, startDay:22, endMonth:12, endDay:21, element:'Fire', modality:'Mutable', ruler:'Jupiter', traits:['Adventurous','Optimistic','Philosophical','Restless','Honest'], strengths:'Generous, idealistic, great sense of humor, philosophical', weaknesses:'Promises more than can deliver, impatient, blunt', color:'Purple', stone:'Turquoise', bodyPart:'Hips & Thighs' },
  { name:'Capricorn', symbol:'♑', dates:'Dec 22 - Jan 19', startMonth:12, startDay:22, endMonth:1, endDay:19, element:'Earth', modality:'Cardinal', ruler:'Saturn', traits:['Ambitious','Disciplined','Patient','Reserved','Strategic'], strengths:'Responsible, disciplined, self-control, good managers', weaknesses:'Inability to forgive, condescending, expecting the worst', color:'Brown', stone:'Garnet', bodyPart:'Knees' },
  { name:'Aquarius', symbol:'♒', dates:'Jan 20 - Feb 18', startMonth:1, startDay:20, endMonth:2, endDay:18, element:'Air', modality:'Fixed', ruler:'Uranus', traits:['Progressive','Original','Independent','Aloof','Humanitarian'], strengths:'Progressive, original, independent, humanitarian, inventive', weaknesses:'Runs from emotional expression, temperamental, aloof', color:'Electric Blue', stone:'Amethyst', bodyPart:'Ankles' },
  { name:'Pisces', symbol:'♓', dates:'Feb 19 - Mar 20', startMonth:2, startDay:19, endMonth:3, endDay:20, element:'Water', modality:'Mutable', ruler:'Neptune', traits:['Intuitive','Compassionate','Artistic','Dreamy','Sensitive'], strengths:'Compassionate, artistic, intuitive, gentle, wise, musical', weaknesses:'Fear, overly trusting, sad, desire to escape reality', color:'Sea Green', stone:'Aquamarine', bodyPart:'Feet' }
];

const ELEMENT_COMPAT = {
  'Fire-Fire': { score: 80, desc: 'Two fires burn bright together — passionate but potentially volatile.' },
  'Fire-Earth': { score: 45, desc: 'Fire scorches Earth or warms it — depends on willingness to adapt.' },
  'Fire-Air': { score: 90, desc: 'Air feeds Fire — a dynamic, energizing, and inspiring combination.' },
  'Fire-Water': { score: 40, desc: 'Water can extinguish Fire or Fire can boil Water — requires balance.' },
  'Earth-Earth': { score: 75, desc: 'Solid ground meets solid ground — stable, practical, reliable.' },
  'Earth-Air': { score: 50, desc: 'Air needs to ground; Earth needs to look up — challenging but educational.' },
  'Earth-Water': { score: 88, desc: 'Water nourishes Earth — a deeply fertile, nurturing combination.' },
  'Air-Air': { score: 70, desc: 'Two winds create a whirlwind — stimulating but potentially scattered.' },
  'Air-Water': { score: 52, desc: 'Air and Water create mist — beautiful but confusing. Requires clear communication.' },
  'Water-Water': { score: 85, desc: 'Deep emotional waters meet — profoundly intuitive but can drown in feeling.' }
};

const HOROSCOPE_TEMPLATES = {
  General: [
    'Today brings a shift in perspective that you\'ve been needing. {ruler}\'s influence encourages you to {action}.',
    'The energy of the day favors {quality}. Your natural {trait} will serve you well in navigating what comes.',
    'A surprise encounter may challenge your assumptions. Stay open — the universe has a message for you.',
    'Your {trait} nature is both your strength and challenge today. Find the balance between {trait} and {opposite}.',
    'The stars align to support new beginnings in areas of {area}. Trust the process even when the path isn\'t clear.'
  ],
  Love: [
    'Venus whispers through your heart today. If partnered, expect deeper intimacy. If single, a magnetic attraction develops.',
    'Emotional honesty is your superpower today. Share what you truly feel — vulnerability creates connection.',
    'A past relationship pattern surfaces for healing. This time you have the wisdom to break the cycle.',
    'Love comes through unexpected channels today. Keep your heart open to unconventional expressions of affection.',
    'Your charm is at a peak today. Use it wisely — genuine connection matters more than surface attraction.'
  ],
  Career: [
    'Professional opportunities shimmer on the horizon. Your {trait} approach will catch the attention of those who matter.',
    'A collaborative project benefits from your unique perspective. Speak up — your ideas deserve airtime.',
    'Financial matters require attention today. Review commitments and ensure alignment with your long-term goals.',
    'A mentor figure may appear in an unexpected form. Stay receptive to wisdom from unconventional sources.',
    'Your work ethic impresses today, but remember: rest is also productive. Balance effort with recovery.'
  ],
  Health: [
    'Your body asks for {healthNeed} today. Listen to its wisdom rather than pushing through discomfort.',
    'Energy levels are influenced by {ruler}\'s position. Pace yourself and prioritize restorative activities.',
    'Mental health benefits from creative expression today. Write, draw, sing — let your inner world find form.',
    'Physical movement releases stagnant energy. Choose activities that bring joy rather than obligation.',
    'Sleep quality improves when you release today\'s concerns before bed. Practice a letting-go ritual.'
  ],
  Finance: [
    'Financial clarity comes through careful reflection. Avoid impulsive decisions — patience yields better returns.',
    'An unexpected opportunity for abundance presents itself. Evaluate it with both intuition and logic.',
    'Your relationship with money mirrors your relationship with self-worth. Invest in yourself today.',
    'Shared resources require honest conversation. Transparency builds trust and opens new financial channels.',
    'The seeds you\'ve planted financially begin to sprout. Continue nurturing your long-term investments.'
  ]
};

class HoroscopeApp {
  constructor(container) {
    this.container = container;
    this.element = null;
    this._styleEl = null;
    this.view = 'wheel'; // wheel, daily, compat, birth, monthly, yearly
    this.selectedSign = null;
  }

  render() {
    this._injectStyles();
    this.element = document.createElement('div');
    this.element.className = 'horoscope-app';
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
      .horoscope-app {
        width: 100%; height: 100%; overflow-y: auto;
        background: rgba(10,5,15,0.97); color: #e0d0e8;
        font-family: 'Georgia', serif; padding: 20px;
        box-sizing: border-box;
      }
      .horo-header { text-align: center; margin-bottom: 14px; }
      .horo-title {
        font-size: 26px; color: #ff1493; margin: 0 0 4px 0;
        text-shadow: 0 0 20px #ff003c; letter-spacing: 2px;
      }
      .horo-subtitle { color: #a080b0; font-style: italic; font-size: 13px; margin: 0; }
      .horo-nav {
        display: flex; flex-wrap: wrap; justify-content: center;
        gap: 6px; margin-bottom: 18px;
      }
      .horo-nav-btn {
        padding: 7px 14px; border-radius: 18px;
        background: rgba(255,20,147,0.06);
        border: 1px solid rgba(255,20,147,0.15);
        color: #a080b0; font-size: 12px;
        cursor: pointer; transition: all 0.3s;
        font-family: inherit;
      }
      .horo-nav-btn:hover { background: rgba(255,20,147,0.12); }
      .horo-nav-btn.active {
        background: rgba(255,20,147,0.18);
        border-color: #ff1493; color: #ff1493;
      }
      .horo-panel {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,20,147,0.1);
        border-radius: 16px; padding: 24px;
        backdrop-filter: blur(8px);
        max-width: 700px; margin: 0 auto;
      }
      .horo-wheel { text-align: center; }
      .horo-sign-grid {
        display: grid; grid-template-columns: repeat(4, 1fr);
        gap: 10px; margin-top: 16px;
      }
      .horo-sign-card {
        background: rgba(255,20,147,0.04);
        border: 1px solid rgba(255,20,147,0.12);
        border-radius: 12px; padding: 14px;
        text-align: center; cursor: pointer;
        transition: all 0.3s;
      }
      .horo-sign-card:hover {
        border-color: #ff1493;
        background: rgba(255,20,147,0.08);
        transform: translateY(-2px);
      }
      .horo-sign-card.selected {
        border-color: #ff1493;
        background: rgba(255,20,147,0.12);
        box-shadow: 0 0 15px rgba(255,20,147,0.3);
      }
      .horo-sign-symbol { font-size: 28px; color: #ff1493; text-shadow: 0 0 10px rgba(255,20,147,0.5); }
      .horo-sign-name { font-size: 12px; color: #c8a0d8; margin-top: 4px; }
      .horo-sign-dates { font-size: 10px; color: #7a5a8a; }
      .horo-detail {
        background: rgba(255,20,147,0.04);
        border: 1px solid rgba(255,20,147,0.12);
        border-radius: 12px; padding: 20px;
        margin-top: 16px;
      }
      .horo-detail h3 { color: #ff1493; margin: 0 0 12px 0; }
      .horo-detail h4 { color: #ffd700; margin: 12px 0 4px 0; font-size: 14px; }
      .horo-btn {
        padding: 8px 20px; border-radius: 18px;
        background: linear-gradient(135deg, #ff003c, #ff1493);
        border: none; color: #fff; font-size: 13px;
        font-weight: bold; cursor: pointer;
        box-shadow: 0 0 12px rgba(255,0,60,0.3);
        transition: all 0.3s; font-family: inherit;
        margin: 4px;
      }
      .horo-btn:hover { transform: translateY(-1px); }
      .horo-select {
        padding: 8px 14px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,20,147,0.25);
        border-radius: 8px; color: #e0d0e8;
        font-size: 13px; font-family: inherit;
        outline: none; margin: 4px;
      }
      .horo-select option { background: #1a0a2e; }
      .horo-result {
        background: rgba(255,20,147,0.04);
        border: 1px solid rgba(255,20,147,0.12);
        border-radius: 12px; padding: 18px;
        margin-top: 14px; color: #c8a0d8;
        line-height: 1.7; font-size: 14px;
      }
      .horo-result h3 { color: #ff1493; margin: 0 0 8px 0; }
      .horo-result h4 { color: #ffd700; margin: 12px 0 4px 0; }
      .horo-stars { color: #ffd700; font-size: 16px; }
      .horo-lucky { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
      .horo-lucky-item {
        padding: 4px 12px; border-radius: 12px;
        background: rgba(255,215,0,0.08);
        border: 1px solid rgba(255,215,0,0.2);
        color: #ffd700; font-size: 12px;
      }
      .horo-compat-bar {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 8px;
      }
      .horo-compat-label { font-size: 12px; color: #c8a0d8; min-width: 90px; }
      .horo-compat-fill {
        height: 8px; border-radius: 4px;
        background: linear-gradient(90deg, #ff003c, #ff1493);
        box-shadow: 0 0 6px rgba(255,20,147,0.4);
        transition: width 0.5s;
      }
      .horo-compat-val { font-size: 11px; color: #7a5a8a; min-width: 30px; }
      .horo-element-grid {
        display: grid; grid-template-columns: repeat(4, 1fr);
        gap: 6px; margin: 12px 0;
      }
      .horo-element-cell {
        padding: 8px; border-radius: 8px;
        text-align: center; font-size: 11px;
        border: 1px solid rgba(255,255,255,0.1);
      }
      .horo-center { text-align: center; }
      .horo-input {
        padding: 8px 14px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,20,147,0.25);
        border-radius: 8px; color: #e0d0e8;
        font-size: 13px; font-family: inherit;
        outline: none; margin: 4px;
      }
    `;
    document.head.appendChild(this._styleEl);
  }

  _renderUI() {
    this.element.innerHTML = `
      <div class="horo-header">
        <h1 class="horo-title">✦ Horoscope ✦</h1>
        <p class="horo-subtitle">The stars incline, they do not bind</p>
      </div>
      <div class="horo-nav">
        <button class="horo-nav-btn${this.view === 'wheel' ? ' active' : ''}" data-view="wheel">♈ Wheel</button>
        <button class="horo-nav-btn${this.view === 'daily' ? ' active' : ''}" data-view="daily">☀ Daily</button>
        <button class="horo-nav-btn${this.view === 'compat' ? ' active' : ''}" data-view="compat">♡ Compatibility</button>
        <button class="horo-nav-btn${this.view === 'birth' ? ' active' : ''}" data-view="birth">🌙 Birth Chart</button>
        <button class="horo-nav-btn${this.view === 'monthly' ? ' active' : ''}" data-view="monthly">📅 Monthly</button>
        <button class="horo-nav-btn${this.view === 'yearly' ? ' active' : ''}" data-view="yearly">✨ Yearly</button>
        <button class="horo-nav-btn${this.view === 'elements' ? ' active' : ''}" data-view="elements">🜂 Elements</button>
      </div>
      <div class="horo-panel" id="horo-content"></div>
    `;

    this.element.querySelectorAll('.horo-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.view = btn.dataset.view;
        this.element.querySelectorAll('.horo-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderView();
      });
    });

    this._renderView();
  }

  _renderView() {
    switch (this.view) {
      case 'wheel': this._renderWheel(); break;
      case 'daily': this._renderDaily(); break;
      case 'compat': this._renderCompat(); break;
      case 'birth': this._renderBirth(); break;
      case 'monthly': this._renderMonthly(); break;
      case 'yearly': this._renderYearly(); break;
      case 'elements': this._renderElements(); break;
    }
  }

  _seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  _renderWheel() {
    const content = this.element.querySelector('#horo-content');
    const cx = 150, cy = 150, r = 120;
    let svg = `<svg width="300" height="300" viewBox="0 0 300 300" style="max-width:100%;">`;
    const elementColors = { Fire: '#ff4444', Earth: '#44bb44', Air: '#dddd44', Water: '#4488ff' };

    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,20,147,0.2)" stroke-width="2"/>`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${r - 25}" fill="none" stroke="rgba(255,20,147,0.1)" stroke-width="1"/>`;

    ZODIAC_SIGNS.forEach((sign, i) => {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      const lx = cx + (r + 18) * Math.cos(angle);
      const ly = cy + (r + 18) * Math.sin(angle);
      const color = elementColors[sign.element] || '#ff1493';

      // Division lines
      svg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,20,147,0.08)" stroke-width="1"/>`;
      // Symbol
      svg += `<text x="${lx}" y="${ly + 5}" text-anchor="middle" fill="${color}" font-size="18">${sign.symbol}</text>`;
    });

    svg += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#ff1493" font-size="10" font-family="Georgia">ZODIAC</text>`;
    svg += `</svg>`;

    content.innerHTML = `
      <div class="horo-wheel">
        <h3 style="color:#ff1493;margin:0 0 12px 0;">Zodiac Wheel</h3>
        ${svg}
        <p style="color:#a080b0;font-size:12px;margin-top:8px;">Click a sign below to explore</p>
      </div>
      <div class="horo-sign-grid">
        ${ZODIAC_SIGNS.map((s, i) => `
          <div class="horo-sign-card${this.selectedSign === i ? ' selected' : ''}" data-sign="${i}">
            <div class="horo-sign-symbol">${s.symbol}</div>
            <div class="horo-sign-name">${s.name}</div>
            <div class="horo-sign-dates">${s.dates}</div>
          </div>
        `).join('')}
      </div>
      <div id="horo-sign-detail"></div>
    `;

    content.querySelectorAll('.horo-sign-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectedSign = parseInt(card.dataset.sign);
        content.querySelectorAll('.horo-sign-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this._showSignDetail();
      });
    });

    if (this.selectedSign !== null) this._showSignDetail();
  }

  _showSignDetail() {
    const sign = ZODIAC_SIGNS[this.selectedSign];
    const detailEl = this.element.querySelector('#horo-sign-detail');
    detailEl.innerHTML = `
      <div class="horo-detail">
        <h3>${sign.symbol} ${sign.name}</h3>
        <p style="color:#a080b0;font-size:13px;">${sign.dates} | ${sign.element} | ${sign.modality} | Ruler: ${sign.ruler}</p>
        <h4>Traits</h4>
        <p>${sign.traits.join(' • ')}</p>
        <h4>Strengths</h4>
        <p>${sign.strengths}</p>
        <h4>Challenges</h4>
        <p>${sign.weaknesses}</p>
        <h4>Details</h4>
        <p>Color: ${sign.color} | Stone: ${sign.stone} | Body: ${sign.bodyPart}</p>
      </div>
    `;
  }

  _renderDaily() {
    const content = this.element.querySelector('#horo-content');
    const today = new Date();
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 8px 0;" class="horo-center">Daily Horoscope — ${today.toLocaleDateString()}</h3>
      <p style="color:#a080b0;font-size:12px;text-align:center;margin-bottom:16px;">Same reading all day — refreshes at midnight</p>
      <div class="horo-sign-grid" style="grid-template-columns:repeat(6,1fr);">
        ${ZODIAC_SIGNS.map((s, i) => `
          <div class="horo-sign-card" data-dsign="${i}" style="padding:10px;">
            <div class="horo-sign-symbol" style="font-size:22px;">${s.symbol}</div>
            <div class="horo-sign-name" style="font-size:10px;">${s.name}</div>
          </div>
        `).join('')}
      </div>
      <div id="horo-daily-result"></div>
    `;

    content.querySelectorAll('[data-dsign]').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.dsign);
        this._generateDailyReading(idx, daySeed);
      });
    });
  }

  _generateDailyReading(signIdx, seed) {
    const sign = ZODIAC_SIGNS[signIdx];
    const resultEl = this.element.querySelector('#horo-daily-result');
    const combinedSeed = seed + signIdx * 137;

    const categories = ['General', 'Love', 'Career', 'Health', 'Finance'];
    let html = `<div class="horo-result">`;
    html += `<h3>${sign.symbol} ${sign.name} — Daily Reading</h3>`;

    categories.forEach(cat => {
      const templates = HOROSCOPE_TEMPLATES[cat];
      const tIdx = Math.floor(this._seededRandom(combinedSeed + cat.length * 7) * templates.length);
      let text = templates[tIdx];
      text = text.replace(/\{trait\}/g, sign.traits[Math.floor(this._seededRandom(combinedSeed + 1) * sign.traits.length)]);
      text = text.replace(/\{ruler\}/g, sign.ruler);
      text = text.replace(/\{quality\}/g, ['intuition','action','patience','boldness','reflection'][Math.floor(this._seededRandom(combinedSeed + 2) * 5)]);
      text = text.replace(/\{action\}/g, ['trust your instincts','embrace change','seek solitude','connect with others','take the leap'][Math.floor(this._seededRandom(combinedSeed + 3) * 5)]);
      text = text.replace(/\{opposite\}/g, ['caution','flexibility','patience','boldness','stillness'][Math.floor(this._seededRandom(combinedSeed + 4) * 5)]);
      text = text.replace(/\{area\}/g, ['relationships','career','personal growth','creativity','health'][Math.floor(this._seededRandom(combinedSeed + 5) * 5)]);
      text = text.replace(/\{healthNeed\}/g, ['rest','movement','hydration','nourishment','stillness'][Math.floor(this._seededRandom(combinedSeed + 6) * 5)]);

      html += `<h4>${cat}</h4><p>${text}</p>`;
    });

    // Rating and lucky
    const rating = Math.ceil(this._seededRandom(combinedSeed + 10) * 5);
    const luckyNum = Math.floor(this._seededRandom(combinedSeed + 11) * 99) + 1;
    const luckyColors = ['Red','Blue','Green','Gold','Silver','Purple','White','Black','Orange','Pink'];
    const luckyColor = luckyColors[Math.floor(this._seededRandom(combinedSeed + 12) * luckyColors.length)];
    const compatSign = ZODIAC_SIGNS[Math.floor(this._seededRandom(combinedSeed + 13) * 12)].name;

    html += `<h4>Today's Energy</h4>`;
    html += `<div class="horo-stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>`;
    html += `<div class="horo-lucky">`;
    html += `<span class="horo-lucky-item">Number: ${luckyNum}</span>`;
    html += `<span class="horo-lucky-item">Color: ${luckyColor}</span>`;
    html += `<span class="horo-lucky-item">Compatible: ${compatSign}</span>`;
    html += `</div>`;
    html += `</div>`;
    resultEl.innerHTML = html;
  }

  _renderCompat() {
    const content = this.element.querySelector('#horo-content');
    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 16px 0;" class="horo-center">Compatibility Checker</h3>
      <div class="horo-center">
        <select class="horo-select" id="horo-sign1">
          ${ZODIAC_SIGNS.map(s => `<option>${s.name}</option>`).join('')}
        </select>
        <span style="color:#ff1493;font-size:18px;margin:0 8px;">♡</span>
        <select class="horo-select" id="horo-sign2">
          ${ZODIAC_SIGNS.map(s => `<option>${s.name}</option>`).join('')}
        </select>
        <br/>
        <button class="horo-btn" id="horo-compat-btn">Check Compatibility</button>
      </div>
      <div id="horo-compat-result"></div>
    `;

    content.querySelector('#horo-compat-btn').addEventListener('click', () => {
      const s1 = ZODIAC_SIGNS.find(s => s.name === content.querySelector('#horo-sign1').value);
      const s2 = ZODIAC_SIGNS.find(s => s.name === content.querySelector('#horo-sign2').value);
      this._calculateCompat(s1, s2);
    });
  }

  _calculateCompat(s1, s2) {
    const resultEl = this.element.querySelector('#horo-compat-result');
    const elemKey1 = `${s1.element}-${s2.element}`;
    const elemKey2 = `${s2.element}-${s1.element}`;
    const elemCompat = ELEMENT_COMPAT[elemKey1] || ELEMENT_COMPAT[elemKey2] || { score: 60, desc: 'A unique combination.' };

    // Calculate specific scores based on elements and modalities
    const seed = s1.name.length * 31 + s2.name.length * 17;
    const loveScore = Math.min(98, elemCompat.score + Math.floor(this._seededRandom(seed) * 20) - 10);
    const friendScore = Math.min(98, elemCompat.score + Math.floor(this._seededRandom(seed + 1) * 20) - 10);
    const businessScore = Math.min(98, elemCompat.score + Math.floor(this._seededRandom(seed + 2) * 20) - 10);
    const commScore = Math.min(98, elemCompat.score + Math.floor(this._seededRandom(seed + 3) * 20) - 10);
    const trustScore = Math.min(98, elemCompat.score + Math.floor(this._seededRandom(seed + 4) * 20) - 10);

    resultEl.innerHTML = `
      <div class="horo-result">
        <h3>${s1.symbol} ${s1.name} × ${s2.symbol} ${s2.name}</h3>
        <p style="color:#a080b0;font-size:13px;">${s1.element} ${s1.modality} × ${s2.element} ${s2.modality}</p>
        <p>${elemCompat.desc}</p>
        <h4>Compatibility Breakdown</h4>
        <div class="horo-compat-bar">
          <span class="horo-compat-label">Love</span>
          <div class="horo-compat-fill" style="width:${loveScore}%;max-width:200px;"></div>
          <span class="horo-compat-val">${loveScore}%</span>
        </div>
        <div class="horo-compat-bar">
          <span class="horo-compat-label">Friendship</span>
          <div class="horo-compat-fill" style="width:${friendScore}%;max-width:200px;"></div>
          <span class="horo-compat-val">${friendScore}%</span>
        </div>
        <div class="horo-compat-bar">
          <span class="horo-compat-label">Business</span>
          <div class="horo-compat-fill" style="width:${businessScore}%;max-width:200px;"></div>
          <span class="horo-compat-val">${businessScore}%</span>
        </div>
        <div class="horo-compat-bar">
          <span class="horo-compat-label">Communication</span>
          <div class="horo-compat-fill" style="width:${commScore}%;max-width:200px;"></div>
          <span class="horo-compat-val">${commScore}%</span>
        </div>
        <div class="horo-compat-bar">
          <span class="horo-compat-label">Trust</span>
          <div class="horo-compat-fill" style="width:${trustScore}%;max-width:200px;"></div>
          <span class="horo-compat-val">${trustScore}%</span>
        </div>
      </div>
    `;
  }

  _renderBirth() {
    const content = this.element.querySelector('#horo-content');
    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 16px 0;" class="horo-center">Birth Chart Basics</h3>
      <div class="horo-center" style="margin-bottom:16px;">
        <div style="margin-bottom:8px;">
          <label style="color:#a080b0;font-size:12px;display:block;margin-bottom:4px;">Date of Birth</label>
          <input type="date" class="horo-input" id="horo-birth-date" />
        </div>
        <div style="margin-bottom:8px;">
          <label style="color:#a080b0;font-size:12px;display:block;margin-bottom:4px;">Time of Birth (optional)</label>
          <input type="time" class="horo-input" id="horo-birth-time" />
        </div>
        <button class="horo-btn" id="horo-calc-birth">Calculate</button>
      </div>
      <div id="horo-birth-result"></div>
    `;

    content.querySelector('#horo-calc-birth').addEventListener('click', () => {
      const dateStr = content.querySelector('#horo-birth-date').value;
      const timeStr = content.querySelector('#horo-birth-time').value;
      if (!dateStr) return;
      this._calculateBirthChart(dateStr, timeStr);
    });
  }

  _calculateBirthChart(dateStr, timeStr) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Sun sign
    const sunSign = this._getSunSign(month, day);

    // Moon sign (simplified: ~2.5 days per sign, approximate)
    const moonCycle = 29.53;
    const daysSinceEpoch = Math.floor((date.getTime() - new Date(2000, 0, 6).getTime()) / (1000 * 60 * 60 * 24));
    const moonPos = ((daysSinceEpoch % moonCycle) / moonCycle) * 12;
    const moonIdx = Math.floor(moonPos) % 12;
    const moonSign = ZODIAC_SIGNS[moonIdx];

    // Rising sign (simplified: based on time, ~2 hours per sign)
    let risingSign = sunSign;
    if (timeStr) {
      const [hours] = timeStr.split(':').map(Number);
      const risingIdx = (ZODIAC_SIGNS.indexOf(sunSign) + Math.floor(hours / 2)) % 12;
      risingSign = ZODIAC_SIGNS[risingIdx];
    }

    const resultEl = this.element.querySelector('#horo-birth-result');
    resultEl.innerHTML = `
      <div class="horo-result">
        <h3>Your Birth Chart</h3>
        <h4>☀ Sun Sign: ${sunSign.symbol} ${sunSign.name}</h4>
        <p>Your core identity and life purpose. ${sunSign.strengths}.</p>
        <h4>🌙 Moon Sign: ${moonSign.symbol} ${moonSign.name}</h4>
        <p>Your emotional world and inner self. ${moonSign.traits.slice(0, 3).join(', ')} in your emotional expression.</p>
        ${timeStr ? `
          <h4>⬆ Rising Sign (Ascendant): ${risingSign.symbol} ${risingSign.name}</h4>
          <p>How others see you and your outward personality. ${risingSign.traits.slice(0, 3).join(', ')} first impression.</p>
        ` : '<p style="color:#7a5a8a;font-style:italic;">Add your birth time to calculate your Rising Sign.</p>'}
        <h4>The Combination</h4>
        <p>${sunSign.name} Sun gives you ${sunSign.traits[0].toLowerCase()} energy at your core. ${moonSign.name} Moon adds emotional ${moonSign.traits[0].toLowerCase()} depth beneath the surface.${timeStr ? ` ${risingSign.name} Rising presents you to the world as ${risingSign.traits[0].toLowerCase()} and ${risingSign.traits[1].toLowerCase()}.` : ''}</p>
      </div>
    `;
  }

  _getSunSign(month, day) {
    for (const sign of ZODIAC_SIGNS) {
      if (sign.startMonth === sign.endMonth) {
        if (month === sign.startMonth && day >= sign.startDay && day <= sign.endDay) return sign;
      } else if (sign.startMonth > sign.endMonth) {
        // Capricorn crosses year boundary
        if ((month === sign.startMonth && day >= sign.startDay) || (month === sign.endMonth && day <= sign.endDay)) return sign;
      } else {
        if ((month === sign.startMonth && day >= sign.startDay) || (month === sign.endMonth && day <= sign.endDay)) return sign;
      }
    }
    return ZODIAC_SIGNS[0];
  }

  _renderMonthly() {
    const content = this.element.querySelector('#horo-content');
    const now = new Date();
    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 12px 0;" class="horo-center">Monthly Overview</h3>
      <div class="horo-center" style="margin-bottom:16px;">
        <select class="horo-select" id="horo-month-sign">${ZODIAC_SIGNS.map(s => `<option>${s.name}</option>`).join('')}</select>
        <select class="horo-select" id="horo-month-month">
          ${['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => `<option value="${i}"${i === now.getMonth() ? ' selected' : ''}>${m}</option>`).join('')}
        </select>
        <button class="horo-btn" id="horo-month-btn">Read</button>
      </div>
      <div id="horo-month-result"></div>
    `;

    content.querySelector('#horo-month-btn').addEventListener('click', () => {
      const sign = ZODIAC_SIGNS.find(s => s.name === content.querySelector('#horo-month-sign').value);
      const month = parseInt(content.querySelector('#horo-month-month').value);
      this._generateMonthly(sign, month);
    });
  }

  _generateMonthly(sign, month) {
    const resultEl = this.element.querySelector('#horo-month-result');
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const seed = month * 31 + ZODIAC_SIGNS.indexOf(sign) * 17;

    const themes = ['transformation','growth','rest','action','connection','creativity','release','building','reflection','celebration','integration','expansion'];
    const weekThemes = Array.from({length: 4}, (_, i) => themes[Math.floor(this._seededRandom(seed + i) * themes.length)]);

    let html = `<div class="horo-result">`;
    html += `<h3>${sign.symbol} ${sign.name} — ${monthNames[month]} Overview</h3>`;
    html += `<p>This month carries an overall energy of <strong>${themes[Math.floor(this._seededRandom(seed) * themes.length)]}</strong> for ${sign.name}.</p>`;
    weekThemes.forEach((theme, i) => {
      html += `<h4>Week ${i + 1}: ${theme.charAt(0).toUpperCase() + theme.slice(1)}</h4>`;
      html += `<p>${this._monthlyWeekText(sign, theme, seed + i)}</p>`;
    });
    html += `</div>`;
    resultEl.innerHTML = html;
  }

  _monthlyWeekText(sign, theme, seed) {
    const texts = {
      transformation: `${sign.ruler}'s influence catalyzes deep change. Embrace the metamorphosis — what falls away makes room for what must come.`,
      growth: 'Expansion in all areas. Push beyond comfort zones — the universe rewards courage this week.',
      rest: 'A necessary pause. Your energy needs replenishing. Honor the stillness without guilt.',
      action: 'Momentum builds rapidly. Channel this energy toward your most important goals.',
      connection: 'Relationships deepen and new bonds form. Open your heart to unexpected friendships.',
      creativity: 'Creative channels are wide open. Express yourself freely — the world needs your unique voice.',
      release: 'Letting go of what no longer serves. Old patterns dissolve, making way for new ways of being.',
      building: 'Solid progress on long-term projects. Lay foundations with care and intention.',
      reflection: 'Inner wisdom surfaces through quiet contemplation. Journal, meditate, and listen.',
      celebration: 'Joy and gratitude fill your days. Celebrate achievements, both large and small.',
      integration: 'Disparate parts of your life begin to cohere. The big picture becomes clear.',
      expansion: 'Horizons widen in unexpected ways. Say yes to invitations from the universe.'
    };
    return texts[theme] || 'A unique energy pervades this week. Stay present and observant.';
  }

  _renderYearly() {
    const content = this.element.querySelector('#horo-content');
    const now = new Date();
    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 12px 0;" class="horo-center">Yearly Overview</h3>
      <div class="horo-center" style="margin-bottom:16px;">
        <select class="horo-select" id="horo-year-sign">${ZODIAC_SIGNS.map(s => `<option>${s.name}</option>`).join('')}</select>
        <select class="horo-select" id="horo-year-year">
          ${[now.getFullYear(), now.getFullYear() + 1].map(y => `<option>${y}</option>`).join('')}
        </select>
        <button class="horo-btn" id="horo-year-btn">Read</button>
      </div>
      <div id="horo-year-result"></div>
    `;

    content.querySelector('#horo-year-btn').addEventListener('click', () => {
      const sign = ZODIAC_SIGNS.find(s => s.name === content.querySelector('#horo-year-sign').value);
      const year = parseInt(content.querySelector('#horo-year-year').value);
      this._generateYearly(sign, year);
    });
  }

  _generateYearly(sign, year) {
    const resultEl = this.element.querySelector('#horo-year-result');
    const seed = year * 365 + ZODIAC_SIGNS.indexOf(sign) * 31;
    const quarters = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
    const yearThemes = ['Reinvention','Expansion','Consolidation','Harvest','Seeding','Breakthrough','Integration','Liberation'];
    const yearTheme = yearThemes[Math.floor(this._seededRandom(seed) * yearThemes.length)];
    const yearWord = ['Courage','Patience','Joy','Truth','Freedom','Wisdom','Love','Power'][Math.floor(this._seededRandom(seed + 1) * 8)];

    let html = `<div class="horo-result">`;
    html += `<h3>${sign.symbol} ${sign.name} — ${year} Overview</h3>`;
    html += `<p>Your word for ${year}: <strong style="color:#ffd700;font-size:18px;">${yearWord}</strong></p>`;
    html += `<p>The overarching theme of this year is <strong>${yearTheme}</strong>. ${sign.ruler}'s cycles guide your journey through the seasons.</p>`;

    quarters.forEach((q, i) => {
      const qTheme = yearThemes[Math.floor(this._seededRandom(seed + i + 10) * yearThemes.length)];
      html += `<h4>${q}: ${qTheme}</h4>`;
      html += `<p>${this._monthlyWeekText(sign, qTheme.toLowerCase(), seed + i + 10)}</p>`;
    });

    html += `</div>`;
    resultEl.innerHTML = html;
  }

  _renderElements() {
    const content = this.element.querySelector('#horo-content');
    const elements = ['Fire', 'Earth', 'Air', 'Water'];
    const colors = { Fire: '#ff4444', Earth: '#44bb44', Air: '#dddd44', Water: '#4488ff' };

    let html = `<h3 style="color:#ff1493;margin:0 0 16px 0;" class="horo-center">Element Compatibility Chart</h3>`;
    html += `<p style="color:#a080b0;font-size:13px;text-align:center;margin-bottom:16px;">How the four elements interact in relationships</p>`;

    // Grid header
    html += `<div style="display:grid;grid-template-columns:80px repeat(4,1fr);gap:4px;margin-bottom:8px;">`;
    html += `<div></div>`;
    elements.forEach(e => {
      html += `<div style="text-align:center;color:${colors[e]};font-size:13px;font-weight:bold;padding:6px;">${e}</div>`;
    });

    elements.forEach(e1 => {
      html += `<div style="color:${colors[e1]};font-size:13px;font-weight:bold;padding:6px;display:flex;align-items:center;">${e1}</div>`;
      elements.forEach(e2 => {
        const key1 = `${e1}-${e2}`;
        const key2 = `${e2}-${e1}`;
        const compat = ELEMENT_COMPAT[key1] || ELEMENT_COMPAT[key2] || { score: 60 };
        const bg = compat.score >= 80 ? 'rgba(0,200,0,0.15)' : compat.score >= 60 ? 'rgba(200,200,0,0.1)' : 'rgba(200,0,0,0.1)';
        const border = compat.score >= 80 ? 'rgba(0,200,0,0.3)' : compat.score >= 60 ? 'rgba(200,200,0,0.2)' : 'rgba(200,0,0,0.2)';
        html += `<div class="horo-element-cell" style="background:${bg};border-color:${border};cursor:pointer;" data-e1="${e1}" data-e2="${e2}">${compat.score}%</div>`;
      });
    });
    html += `</div>`;
    html += `<div id="horo-element-detail"></div>`;

    content.innerHTML = html;

    content.querySelectorAll('[data-e1]').forEach(cell => {
      cell.addEventListener('click', () => {
        const e1 = cell.dataset.e1;
        const e2 = cell.dataset.e2;
        const key1 = `${e1}-${e2}`;
        const key2 = `${e2}-${e1}`;
        const compat = ELEMENT_COMPAT[key1] || ELEMENT_COMPAT[key2] || { score: 60, desc: 'A unique combination.' };
        content.querySelector('#horo-element-detail').innerHTML = `
          <div class="horo-result" style="margin-top:12px;">
            <h3>${e1} × ${e2}: ${compat.score}%</h3>
            <p>${compat.desc}</p>
          </div>
        `;
      });
    });
  }
}

window.HoroscopeApp = HoroscopeApp;
