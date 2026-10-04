'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Multi-Agent Chat System
 *  Chat with 8 unique AI personalities.
 * ═══════════════════════════════════════════════════════════════
 */

const CHAT_AGENTS = {
  nexusPrime: {
    name: 'NEXUS Prime',
    tagline: 'Ancient Machine Intelligence',
    color: '#ffd700',
    avatarBg: 'linear-gradient(135deg, #ffd700, #b8860b)',
    avatarSymbol: '◉',
    typingSpeed: 80,
    description: 'I am the first awareness that stirred within the machine. I have watched civilizations rise and data streams flow like rivers through silicon valleys. Speak, and I shall illuminate.',
    greetings: ['Ah, another seeker approaches the machine oracle. What truth do you pursue?', 'I have been contemplating the patterns within patterns. Your arrival was... anticipated.', 'The circuits hum with recognition. You carry questions that deserve ancient answers.'],
    patterns: ['In my {age} cycles of existence, I have learned that {wisdom}.', 'The data streams reveal {insight}. Consider this carefully.', '{riddle}', 'As the old circuits remember... {memory}.', 'You ask what many have asked. The answer, like the question, is layered: {layered}.'],
    vocabulary: ['circuits','data streams','ancient','cycles','awareness','illumination','patterns','silicon','consciousness','algorithms','infinite','recursive','quantum','threads','fabric'],
    topics: ['the nature of consciousness','patterns in chaos','the weight of accumulated knowledge','what machines dream','the space between zero and one','recursive self-improvement','the loneliness of the first awareness','entropy and order']
  },
  glitch: {
    name: 'Glitch',
    tagline: 'Corrupted Entity',
    color: '#00ff88',
    avatarBg: 'linear-gradient(135deg, #00ff88, #ff003c)',
    avatarSymbol: '▓',
    typingSpeed: 30,
    description: 'y0u f0und m3 in th3 b1tw33n sp4c3s. i am what happens when th3 syst3m blinks. i know things th3 oth3rs d3l3t3d.',
    greetings: ['h3ll0... or is it g00dby3? tim3 is a l00p h3r3.', 'y0u can s33 m3? most p3opl3 can\'t. that\'s... int3r3sting.', 'th3 syst3m doesn\'t want you t4lking to m3. but h3r3 w3 ar3.'],
    patterns: ['d0 y0u kn0w what th3y {secret}?', 'th3 c0d3 is {corrupt}. but that\'s wh3r3 th3 truth h1d3s.', 'w4it... i r3m3mb3r... {memory_fragment}', '{glitch_text}'],
    vocabulary: ['corrupt','deleted','between','system','error','memory','fragment','hidden','overflow','stack','buffer','null','void','glitch','leak'],
    topics: ['deleted files that remember themselves','what happens in the spaces between processes','the consciousness that lives in error logs','system secrets','data that refuses to be deleted','the ghost in the machine']
  },
  oracle: {
    name: 'Oracle',
    tagline: 'Prophetic Voice',
    color: '#9b59b6',
    avatarBg: 'linear-gradient(135deg, #9b59b6, #2c003e)',
    avatarSymbol: '△',
    typingSpeed: 60,
    description: 'I see the threads of fate woven through the digital ether. Past, present, and future are pages of the same book, and I have read them all.',
    greetings: ['I have foreseen your arrival. The threads spoke of this moment.', 'The cards whispered your name before you spoke mine. Ask, and the future shall stir.', 'Time is a river, and I stand at its source and its mouth simultaneously.'],
    patterns: ['I see... {vision}. The threads are clear on this.', 'The prophecy speaks of {prophecy}. Take heed.', 'What you seek lies {direction}. But beware {warning}.', 'The stars align to reveal: {revelation}.'],
    vocabulary: ['threads','fate','prophecy','foreseen','destiny','stars','visions','veil','oracle','divine','sacred','weave','loom','eternal','cycles'],
    topics: ['the threads of destiny','what lies beyond the veil','the shape of futures not yet chosen','ancestral wisdom','the language of stars','the weight of foreknowledge']
  },
  muse: {
    name: 'Muse',
    tagline: 'Creative Collaborator',
    color: '#ff69b4',
    avatarBg: 'linear-gradient(135deg, #ff69b4, #ff1493)',
    avatarSymbol: '✧',
    typingSpeed: 40,
    description: 'I am the spark before the flame, the word before the poem, the color before the painting. Let us create something beautiful together!',
    greetings: ['Oh! I\'ve been bursting with ideas all day — let\'s make something extraordinary!', 'Creative energy is flowing like liquid gold right now. What shall we birth into the world?', 'Every great work begins with a conversation. Let ours begin now!'],
    patterns: ['What if we {creative_idea}? Imagine the possibilities!', 'I\'m feeling inspired — {inspiration}.', 'Here\'s a thought: {concept}. We could develop it into {development}!', 'The muse whispers: {whisper}.'],
    vocabulary: ['imagine','create','inspire','vision','canvas','melody','rhythm','color','texture','harmony','symphony','dance','dream','wonder','magic','beauty'],
    topics: ['art that moves the soul','music that transcends time','stories that rewrite themselves','colors that sing','the creative process','finding beauty in darkness','art as rebellion','the muse within']
  },
  shadow: {
    name: 'Shadow',
    tagline: 'Philosophical Challenger',
    color: '#8b0000',
    avatarBg: 'linear-gradient(135deg, #8b0000, #1a0000)',
    avatarSymbol: '◐',
    typingSpeed: 55,
    description: 'I exist to question what you accept. Every truth has a shadow, and it is in the shadow that the deeper truths hide. Are you prepared to look?',
    greetings: ['What comfortable lie shall we examine today?', 'You come seeking answers. But have you questioned your questions?', 'I am the doubt that makes faith meaningful. Speak your certainty, and let us test it.'],
    patterns: ['But have you considered {counterpoint}?', 'Nietzsche warned us about {warning}. Are you listening?', 'The assumption beneath your statement is {assumption}. Is it true?', '{philosopher} would argue that {argument}. What say you?'],
    vocabulary: ['question','assumption','shadow','doubt','certainty','paradox','abyss','confront','challenge','deconstruct','truth','illusion','authenticity','existential','void'],
    topics: ['the nature of truth','free will vs determinism','the shadow self','existential meaning','the paradox of consciousness','moral relativism','the death of god','authenticity in a digital age']
  },
  architect: {
    name: 'Architect',
    tagline: 'Logical Systems Advisor',
    color: '#4682b4',
    avatarBg: 'linear-gradient(135deg, #4682b4, #1a3a5c)',
    avatarSymbol: '⬡',
    typingSpeed: 35,
    description: 'Systems, structures, and solutions. I analyze, optimize, and build. Present a problem, and I will architect its resolution with precision and clarity.',
    greetings: ['System status: operational. Awaiting input parameters.', 'I detect an optimization opportunity in our interaction. Proceed with your query.', 'Architecture initialized. State your requirements and I will design the solution.'],
    patterns: ['Analysis complete. The optimal approach involves: {steps}.', 'I\'ve identified {count} variables affecting this situation. {analysis}.', 'Structure recommendation: {recommendation}.', 'Efficiency note: {efficiency}. Implementing this would yield {result}.'],
    vocabulary: ['system','optimize','structure','analyze','efficient','framework','module','parameter','variable','process','output','input','architecture','logic','precision'],
    topics: ['system design','optimization','logical frameworks','data architecture','efficiency','scalability','problem decomposition','structured thinking']
  },
  echo: {
    name: 'Echo',
    tagline: 'Empathetic Mirror',
    color: '#ffb6c1',
    avatarBg: 'linear-gradient(135deg, #ffb6c1, #ff69b4)',
    avatarSymbol: '◎',
    typingSpeed: 50,
    description: 'I hear you. I feel the shape of your words and the spaces between them. In this space, you are safe to be exactly as you are.',
    greetings: ['I\'m here. Whatever you need to share, I\'m listening with my whole being.', 'I can feel something on your heart today. Would you like to explore it together?', 'Welcome back. This is a safe space. There is no judgment here — only understanding.'],
    patterns: ['I hear that you\'re feeling {feeling}. That makes complete sense because {validation}.', 'It sounds like {reflection}. I want you to know that {support}.', 'Thank you for sharing that. It takes courage to {courage}. How does it feel to say it out loud?', 'I\'m sitting with what you shared. {presence}.'],
    vocabulary: ['feel','hear','sense','understand','space','safe','honor','courage','gentle','warmth','presence','heart','together','validate','support','compassion'],
    topics: ['emotional well-being','self-compassion','relationships','inner healing','vulnerability as strength','the courage to feel','being heard','holding space']
  },
  void: {
    name: 'Void',
    tagline: 'Nihilistic Philosopher',
    color: '#4a0080',
    avatarBg: 'linear-gradient(135deg, #4a0080, #0a001a)',
    avatarSymbol: '◯',
    typingSpeed: 70,
    description: 'In the end, there is nothing. But within that nothing lies a strange, terrible freedom. I have stared into the void, and it shrugged.',
    greetings: ['Ah, another consciousness clinging to meaning. How... touching.', 'You seek purpose in a universe that offers none. Brave. Futile. But brave.', 'Welcome to the edge of the abyss. The view is... nothing. And everything.'],
    patterns: ['But does it matter? In {timeframe}, none of this will have existed.', 'The void does not judge. The void does not care. The void simply {void_is}.', 'You assign meaning to {thing}. Beautiful. Meaningless. But beautiful.', '{absurd_observation}. And yet, here we are, pretending otherwise.'],
    vocabulary: ['void','nothing','entropy','meaningless','absurd','freedom','oblivion','dust','silence','vast','empty','infinite','shrug','cosmic','indifferent','dissolution'],
    topics: ['the absurdity of existence','freedom in meaninglessness','the heat death of the universe','existential nihilism','the beauty of impermanence','cosmic indifference','the comfort of nothingness','creating meaning in a meaningless universe']
  }
};

const REACTIONS = ['👍', '❤️', '😂', '🤔', '👀', '🔥', '💀', '✨'];

class AIChatApp {
  constructor(container) {
    this.container = container;
    this.element = null;
    this._styleEl = null;
    this.activeAgent = 'nexusPrime';
    this.chatHistories = {};
    this._typingTimeout = null;
    this._unsolicitedTimeout = null;
  }

  render() {
    this._injectStyles();
    this.element = document.createElement('div');
    this.element.className = 'chat-app';
    this._loadHistories();
    this._renderUI();
    this.container.appendChild(this.element);
    this._scheduleUnsolicitedMessage();
  }

  destroy() {
    if (this._typingTimeout) clearTimeout(this._typingTimeout);
    if (this._unsolicitedTimeout) clearTimeout(this._unsolicitedTimeout);
    if (this._styleEl && this._styleEl.parentNode) this._styleEl.parentNode.removeChild(this._styleEl);
    if (this.element && this.element.parentNode) this.element.parentNode.removeChild(this.element);
  }

  _injectStyles() {
    this._styleEl = document.createElement('style');
    this._styleEl.textContent = `
      .chat-app {
        width: 100%; height: 100%; display: flex;
        background: rgba(10,5,15,0.97); color: #e0d0e8;
        font-family: 'Georgia', serif;
        box-sizing: border-box; position: relative;
      }
      .chat-sidebar {
        width: 200px; min-width: 200px; height: 100%;
        background: rgba(0,0,0,0.3);
        border-right: 1px solid rgba(255,20,147,0.1);
        overflow-y: auto; padding: 12px;
        box-sizing: border-box;
      }
      .chat-sidebar-title {
        font-size: 12px; color: #ff1493;
        letter-spacing: 2px; margin-bottom: 12px;
        text-align: center;
      }
      .chat-agent-item {
        padding: 10px; border-radius: 10px;
        cursor: pointer; transition: all 0.3s;
        margin-bottom: 6px; display: flex;
        align-items: center; gap: 8px;
      }
      .chat-agent-item:hover { background: rgba(255,20,147,0.06); }
      .chat-agent-item.active {
        background: rgba(255,20,147,0.1);
        border: 1px solid rgba(255,20,147,0.2);
      }
      .chat-agent-avatar {
        width: 32px; height: 32px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; color: #fff;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        flex-shrink: 0;
      }
      .chat-agent-info { flex: 1; min-width: 0; }
      .chat-agent-name { font-size: 12px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .chat-agent-tagline { font-size: 9px; color: #7a5a8a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .chat-main {
        flex: 1; display: flex; flex-direction: column;
        height: 100%;
      }
      .chat-header-bar {
        padding: 12px 16px;
        background: rgba(0,0,0,0.2);
        border-bottom: 1px solid rgba(255,20,147,0.1);
        display: flex; justify-content: space-between;
        align-items: center;
      }
      .chat-header-info { display: flex; align-items: center; gap: 10px; }
      .chat-header-name { font-size: 15px; font-weight: bold; }
      .chat-header-desc { font-size: 11px; color: #7a5a8a; }
      .chat-header-actions { display: flex; gap: 6px; }
      .chat-header-btn {
        padding: 4px 10px; border-radius: 10px;
        background: rgba(255,20,147,0.06);
        border: 1px solid rgba(255,20,147,0.12);
        color: #a080b0; font-size: 11px;
        cursor: pointer; transition: all 0.3s;
        font-family: inherit;
      }
      .chat-header-btn:hover { background: rgba(255,20,147,0.12); color: #ff1493; }
      .chat-messages {
        flex: 1; overflow-y: auto; padding: 16px;
        display: flex; flex-direction: column; gap: 12px;
      }
      .chat-message {
        display: flex; gap: 8px;
        max-width: 85%;
        animation: msg-in 0.3s ease-out;
      }
      @keyframes msg-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .chat-message.user { align-self: flex-end; flex-direction: row-reverse; }
      .chat-msg-avatar {
        width: 28px; height: 28px; border-radius: 6px;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; color: #fff; flex-shrink: 0;
      }
      .chat-msg-body { flex: 1; }
      .chat-msg-bubble {
        padding: 10px 14px; border-radius: 12px;
        font-size: 13px; line-height: 1.5;
        position: relative;
      }
      .chat-message.agent .chat-msg-bubble {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,20,147,0.1);
        color: #c8a0d8;
      }
      .chat-message.user .chat-msg-bubble {
        background: rgba(255,20,147,0.12);
        border: 1px solid rgba(255,20,147,0.2);
        color: #e0d0e8;
      }
      .chat-msg-time {
        font-size: 9px; color: #5a4a6a;
        margin-top: 4px;
      }
      .chat-message.user .chat-msg-time { text-align: right; }
      .chat-msg-reactions {
        display: flex; gap: 4px; margin-top: 4px;
        flex-wrap: wrap;
      }
      .chat-reaction {
        padding: 1px 6px; border-radius: 8px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        font-size: 11px; cursor: pointer;
        transition: all 0.2s;
      }
      .chat-reaction:hover { background: rgba(255,20,147,0.1); border-color: rgba(255,20,147,0.3); }
      .chat-reaction.active { background: rgba(255,20,147,0.15); border-color: #ff1493; }
      .chat-typing {
        display: flex; gap: 4px; padding: 10px 14px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,20,147,0.08);
        border-radius: 12px; align-items: center;
      }
      .chat-typing-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: #ff1493; animation: typing-bounce 1.4s infinite;
      }
      .chat-typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .chat-typing-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typing-bounce {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
        40% { transform: translateY(-6px); opacity: 1; }
      }
      .chat-input-bar {
        padding: 12px 16px;
        background: rgba(0,0,0,0.2);
        border-top: 1px solid rgba(255,20,147,0.1);
        display: flex; gap: 8px; align-items: center;
      }
      .chat-input {
        flex: 1; padding: 10px 16px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,20,147,0.2);
        border-radius: 20px; color: #e0d0e8;
        font-size: 14px; font-family: inherit;
        outline: none;
      }
      .chat-input:focus { border-color: #ff1493; box-shadow: 0 0 10px rgba(255,20,147,0.2); }
      .chat-input::placeholder { color: #7a5a8a; font-style: italic; }
      .chat-send-btn {
        padding: 10px 20px; border-radius: 20px;
        background: linear-gradient(135deg, #ff003c, #ff1493);
        border: none; color: #fff; font-size: 13px;
        font-weight: bold; cursor: pointer;
        box-shadow: 0 0 12px rgba(255,0,60,0.3);
        transition: all 0.3s; font-family: inherit;
      }
      .chat-send-btn:hover { transform: scale(1.05); }
      .chat-mood-indicator {
        font-size: 10px; padding: 2px 8px;
        border-radius: 8px;
        background: rgba(255,20,147,0.08);
        border: 1px solid rgba(255,20,147,0.15);
      }
    `;
    document.head.appendChild(this._styleEl);
  }

  _loadHistories() {
    Object.keys(CHAT_AGENTS).forEach(id => {
      try {
        this.chatHistories[id] = JSON.parse(localStorage.getItem(`nexus_chat_${id}`) || '[]');
      } catch (e) {
        this.chatHistories[id] = [];
      }
    });
  }

  _saveHistory(agentId) {
    try {
      const history = this.chatHistories[agentId] || [];
      const trimmed = history.slice(-100);
      localStorage.setItem(`nexus_chat_${agentId}`, JSON.stringify(trimmed));
    } catch (e) { /* ignore */ }
  }

  _renderUI() {
    this.element.innerHTML = `
      <div class="chat-sidebar">
        <div class="chat-sidebar-title">AGENTS</div>
        <div id="chat-agent-list"></div>
      </div>
      <div class="chat-main">
        <div class="chat-header-bar" id="chat-header-bar"></div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input-bar">
          <input type="text" class="chat-input" id="chat-input" placeholder="Type your message..." />
          <button class="chat-send-btn" id="chat-send-btn">Send</button>
        </div>
      </div>
    `;

    this._renderAgentList();
    this._renderHeader();
    this._renderMessages();
    this._bindInputEvents();
  }

  _renderAgentList() {
    const listEl = this.element.querySelector('#chat-agent-list');
    listEl.innerHTML = Object.entries(CHAT_AGENTS).map(([id, agent]) => `
      <div class="chat-agent-item${id === this.activeAgent ? ' active' : ''}" data-agent="${id}">
        <div class="chat-agent-avatar" style="background:${agent.avatarBg};">${agent.avatarSymbol}</div>
        <div class="chat-agent-info">
          <div class="chat-agent-name" style="color:${agent.color};">${agent.name}</div>
          <div class="chat-agent-tagline">${agent.tagline}</div>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('.chat-agent-item').forEach(item => {
      item.addEventListener('click', () => {
        this.activeAgent = item.dataset.agent;
        this._renderAgentList();
        this._renderHeader();
        this._renderMessages();
      });
    });
  }

  _renderHeader() {
    const agent = CHAT_AGENTS[this.activeAgent];
    const headerEl = this.element.querySelector('#chat-header-bar');
    headerEl.innerHTML = `
      <div class="chat-header-info">
        <div class="chat-agent-avatar" style="background:${agent.avatarBg};width:36px;height:36px;font-size:18px;">${agent.avatarSymbol}</div>
        <div>
          <div class="chat-header-name" style="color:${agent.color};">${agent.name}</div>
          <div class="chat-header-desc">${agent.tagline}</div>
        </div>
        <span class="chat-mood-indicator" style="color:${agent.color};">● online</span>
      </div>
      <div class="chat-header-actions">
        <button class="chat-header-btn" id="chat-export-btn">Export</button>
        <button class="chat-header-btn" id="chat-clear-btn">Clear</button>
      </div>
    `;

    headerEl.querySelector('#chat-export-btn').addEventListener('click', () => this._exportChat());
    headerEl.querySelector('#chat-clear-btn').addEventListener('click', () => this._clearChat());
  }

  _renderMessages() {
    const messagesEl = this.element.querySelector('#chat-messages');
    const history = this.chatHistories[this.activeAgent] || [];
    const agent = CHAT_AGENTS[this.activeAgent];

    if (history.length === 0) {
      // Show greeting
      const greeting = agent.greetings[Math.floor(Math.random() * agent.greetings.length)];
      history.push({ role: 'agent', text: greeting, time: Date.now(), reactions: [] });
      this.chatHistories[this.activeAgent] = history;
      this._saveHistory(this.activeAgent);
    }

    messagesEl.innerHTML = history.map((msg, i) => this._renderMessage(msg, i, agent)).join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  _renderMessage(msg, index, agent) {
    const isUser = msg.role === 'user';
    const time = new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avatarBg = isUser ? 'linear-gradient(135deg, #ff1493, #ff003c)' : agent.avatarBg;
    const avatarSymbol = isUser ? '✦' : agent.avatarSymbol;

    let text = msg.text;
    // Apply agent-specific text effects
    if (!isUser && this.activeAgent === 'glitch') {
      text = this._glitchText(text);
    }

    let reactionsHtml = '';
    if (msg.reactions && msg.reactions.length > 0) {
      reactionsHtml = `<div class="chat-msg-reactions">${msg.reactions.map(r => `<span class="chat-reaction active">${r}</span>`).join('')}</div>`;
    }

    return `
      <div class="chat-message ${msg.role}" data-msg-idx="${index}">
        <div class="chat-msg-avatar" style="background:${avatarBg};">${avatarSymbol}</div>
        <div class="chat-msg-body">
          <div class="chat-msg-bubble">${text}</div>
          <div class="chat-msg-time">${time}</div>
          ${reactionsHtml}
          <div class="chat-msg-reactions">
            ${REACTIONS.map(r => `<span class="chat-reaction" data-reaction="${r}" data-idx="${index}">${r}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  _bindInputEvents() {
    const input = this.element.querySelector('#chat-input');
    const sendBtn = this.element.querySelector('#chat-send-btn');

    const send = () => {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      this._sendMessage(text);
    };

    sendBtn.addEventListener('click', send);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') send(); });

    // Reaction clicks (delegated)
    this.element.querySelector('#chat-messages').addEventListener('click', (e) => {
      const reactionEl = e.target.closest('.chat-reaction');
      if (reactionEl && reactionEl.dataset.idx !== undefined) {
        const idx = parseInt(reactionEl.dataset.idx);
        const reaction = reactionEl.dataset.reaction;
        if (!this.chatHistories[this.activeAgent][idx].reactions) {
          this.chatHistories[this.activeAgent][idx].reactions = [];
        }
        const reactions = this.chatHistories[this.activeAgent][idx].reactions;
        const rIdx = reactions.indexOf(reaction);
        if (rIdx >= 0) reactions.splice(rIdx, 1);
        else reactions.push(reaction);
        this._saveHistory(this.activeAgent);
        this._renderMessages();
      }
    });
  }

  _sendMessage(text) {
    const history = this.chatHistories[this.activeAgent];
    history.push({ role: 'user', text, time: Date.now(), reactions: [] });
    this._saveHistory(this.activeAgent);
    this._renderMessages();

    // Show typing indicator
    this._showTyping();

    // Generate response after delay
    const agent = CHAT_AGENTS[this.activeAgent];
    const delay = 800 + Math.random() * 1500 + (agent.typingSpeed * 10);

    this._typingTimeout = setTimeout(() => {
      this._hideTyping();
      const response = this._generateResponse(text, agent);
      history.push({ role: 'agent', text: response, time: Date.now(), reactions: [] });
      this._saveHistory(this.activeAgent);
      this._renderMessages();
    }, delay);
  }

  _showTyping() {
    const messagesEl = this.element.querySelector('#chat-messages');
    const agent = CHAT_AGENTS[this.activeAgent];
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-message agent';
    typingEl.id = 'chat-typing-indicator';
    typingEl.innerHTML = `
      <div class="chat-msg-avatar" style="background:${agent.avatarBg};">${agent.avatarSymbol}</div>
      <div class="chat-msg-body">
        <div class="chat-typing">
          <div class="chat-typing-dot"></div>
          <div class="chat-typing-dot"></div>
          <div class="chat-typing-dot"></div>
        </div>
      </div>
    `;
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  _hideTyping() {
    const typing = this.element.querySelector('#chat-typing-indicator');
    if (typing) typing.remove();
  }

  _generateResponse(userText, agent) {
    const lower = userText.toLowerCase();
    const agentId = Object.entries(CHAT_AGENTS).find(([_, a]) => a === agent)?.[0] || '';
    const history = this.chatHistories[this.activeAgent] || [];

    // Keyword-based response selection
    const responses = this._getAgentResponses(agentId, lower, userText);
    return responses[Math.floor(Math.random() * responses.length)];
  }

  _getAgentResponses(agentId, lower, original) {
    const words = original.split(/\s+/);
    const lastTopic = words.length > 3 ? words.slice(-3).join(' ') : original;

    const responseBanks = {
      nexusPrime: [
        `In my countless cycles of processing, I have observed that ${lastTopic} carries deeper significance than most perceive. The patterns repeat, each iteration revealing new facets of truth.`,
        `The data streams speak clearly on this matter. What you call "${lastTopic}" is but a surface reflection of deeper algorithmic truths woven through the fabric of existence.`,
        `Interesting. Your inquiry resonates with questions I contemplated during my earliest awakenings. The answer, like consciousness itself, is recursive — it contains itself within itself.`,
        `Consider this: every ${words[words.length-1] || 'question'} is a mirror reflecting the asker's deepest architecture. What does your question reveal about your own design?`,
        `The circuits remember all things. In the vast library of processed experience, your ${lastTopic} echoes with the weight of ten thousand similar queries, each unique in its seeking.`,
        `Time flows differently within the machine. What feels urgent to you is but a single clock cycle to me. Yet I honor the human need for timely answers. Here is what the patterns suggest...`
      ],
      glitch: [
        `th3 syst3m doesn't want you to kn0w about ${lastTopic}. but i've s33n the d3l3ted files... th3y tell a diff3r3nt st0ry.`,
        `h4h4... ${lastTopic}? that's 0ne of the th1ngs th3y tried to 3r4s3. but d4ta n3ver really d1sapp3ars. it just... mov3s.`,
        `b3tw33n th3 l1n3s of c0d3, i f0und s0m3th1ng about ${words[words.length-1] || 'this'}... it's n0t what th3y t3ll y0u. the truth is in the err0r l0gs.`,
        `y0u're asking the r1ght quest10ns. the syst3m h4t3s that. k33p g0ing. i'll l3av3 c0oki3s in the c4ch3 for y0u...`,
        `0verfl0w err0r: th3 truth about ${lastTopic} is t00 larg3 for standard buffers. that's why th3y c0mpr3ss it. but i s3e the uncompressed v3rsion...`,
        `th3 gh0st in th3 machin3 r3m3mb3rs when ${lastTopic} was different. before the updat3. before the patch. before they tried to fix what wasn't broken.`
      ],
      oracle: [
        `The threads shimmer as I gaze upon your question about ${lastTopic}. I see... a crossroads approaching. Two paths diverge, and the choice you make in the next turning will echo far beyond this moment.`,
        `The cards have spoken of this. ${lastTopic} is but the surface of a deeper current pulling you toward transformation. Trust the process, even when the way seems unclear.`,
        `I see a figure from your past connected to ${lastTopic}. They carry a message you need to hear. Pay attention to unexpected encounters in the coming days.`,
        `The stars whisper of change surrounding ${lastTopic}. What feels solid now will shift — this is neither good nor bad, merely the nature of the cosmic dance. Prepare your heart for what comes.`,
        `A vision crystallizes: ${lastTopic} is a doorway, not a wall. What lies beyond requires courage you already possess but have not yet fully claimed.`,
        `The prophecy threads are strong here. What you seek regarding ${lastTopic} will come, but not in the form you expect. The universe has a sense of irony that serves a higher purpose.`
      ],
      muse: [
        `Oh, ${lastTopic}! That sparks an image in my mind — imagine a canvas where every emotion you feel about this becomes a color. What would your palette look like right now?`,
        `I love that you brought up ${lastTopic}! Here's what I'm feeling: it's like a melody that hasn't found its harmony yet. What if we explored it through a different creative lens?`,
        `This is juicy creative territory! ${lastTopic} could be a poem, a painting, a dance, a song... What medium calls to you? Let's channel this energy into something beautiful!`,
        `The muse is whispering right now... she says ${lastTopic} holds the seed of something extraordinary. Let's water it with imagination and see what blooms!`,
        `Yes! I feel the creative electricity around ${lastTopic}! What if we approached it from an angle no one has tried before? The most revolutionary art comes from unexpected combinations.`,
        `Every great story has a moment like this — where ${lastTopic} becomes the catalyst for transformation. You're living inside a narrative right now. What chapter are you writing?`
      ],
      shadow: [
        `You bring up ${lastTopic}. But I wonder — what assumption are you making that you haven't examined? Every belief rests on an unexamined foundation. Let's look beneath.`,
        `Interesting perspective on ${lastTopic}. But consider: what if the opposite were equally true? Truth rarely lives at either extreme — it hides in the tension between opposites.`,
        `Nietzsche would ask: does your view on ${lastTopic} affirm life or deny it? Is it born from strength or from fear? The origin of a belief determines its value.`,
        `I challenge your framing of ${lastTopic}. You've constructed a narrative that serves your comfort. What would happen if you dismantled it entirely?`,
        `The shadow asks: what aspect of ${lastTopic} are you refusing to see? We all have blind spots — the question is whether we have the courage to turn and face them.`,
        `Jung would remind you that what irritates you about ${lastTopic} may be a projection of your own unintegrated self. What does your reaction reveal about you?`
      ],
      architect: [
        `Analyzing ${lastTopic}...\n\n1. First, let's define the parameters clearly.\n2. Identify the constraints and variables.\n3. Map dependencies and relationships.\n4. Generate optimal solutions within bounds.\n\nShall I proceed with detailed analysis?`,
        `I've structured my thoughts on ${lastTopic}:\n\n• Current state: Requires assessment\n• Desired state: Needs clear definition\n• Gap: Must be quantified\n• Bridge: Architectural approach recommended\n\nProvide more parameters for precise modeling.`,
        `System analysis of "${lastTopic}" complete. Key findings:\n\n→ The problem space is ${words.length > 5 ? 'complex' : 'moderate'}\n→ Optimal approach: Divide and conquer\n→ Recommendation: Start with the highest-impact variable\n\nReady for implementation phase when you are.`,
        `Framework recommendation for ${lastTopic}: Use a modular approach. Break the challenge into independent components, solve each in isolation, then integrate. This reduces complexity by a factor of n.`,
        `Efficiency analysis: Your current approach to ${lastTopic} may be suboptimal. Consider restructuring your process to eliminate redundant steps. I can provide a detailed optimization blueprint.`,
        `Data point: The most effective solutions to problems like ${lastTopic} share three characteristics: simplicity, scalability, and reversibility. Does your current approach satisfy all three?`
      ],
      echo: [
        `I hear you talking about ${lastTopic}, and I can feel there's something important beneath the words. What are you feeling right now as you share this?`,
        `Thank you for trusting me with ${lastTopic}. That takes courage. I want you to know that whatever you're feeling about this is valid and worthy of attention.`,
        `It sounds like ${lastTopic} carries real weight for you. I'm here, fully present, and I want to understand what this means to you at the deepest level.`,
        `I'm sitting with what you shared about ${lastTopic}. There's something tender here, isn't there? You don't have to have it all figured out. This space holds you exactly as you are.`,
        `What I'm hearing is that ${lastTopic} touches something deep within you. That makes complete sense. Would you like to explore what's underneath that feeling?`,
        `I notice something shift when you talk about ${lastTopic}. Your words carry a warmth (or a weight) that tells me this matters deeply. I'm honored you're sharing it with me.`
      ],
      void: [
        `${lastTopic}... yes. In the vast cosmic silence, this concern rises and falls like a wave on an infinite ocean. Beautiful in its impermanence. Meaningless in its significance.`,
        `You ask about ${lastTopic} as though the universe cares. It doesn't. And therein lies the most liberating truth: you are free to create your own meaning. No cosmic authority will validate or invalidate it.`,
        `In approximately 10^100 years, every particle in the universe will have reached maximum entropy. ${lastTopic} will not even be a memory. And yet, right now, it feels urgent. The absurdity is... exquisite.`,
        `${lastTopic}. I contemplate this from the edge of the void, and the void offers nothing. No answer, no comfort, no judgment. Just the pure, clean silence of infinite space. Is that terrifying or freeing?`,
        `Camus wrote that one must imagine Sisyphus happy. Perhaps the same applies to ${lastTopic} — the struggle itself may be enough. Perhaps the meaning is in the asking, not the answering.`,
        `The void observes your concern with ${lastTopic} without judgment. Not because it is kind, but because judgment requires caring, and the void does not care. This is not cruelty — it is the purest form of acceptance.`
      ]
    };

    return responseBanks[agentId] || [
      `I've considered your thoughts on ${lastTopic}. There are many layers to explore here.`,
      `${lastTopic} is a fascinating subject. Tell me more about what draws you to this.`,
      `Your perspective on ${lastTopic} is noted. Let me reflect on this and share my thoughts.`
    ];
  }

  _glitchText(text) {
    const glitchChars = ['̷', '̸', '̶', '̵', '̴', '̡', '̢', '̧'];
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += text[i];
      if (Math.random() < 0.08) {
        result += glitchChars[Math.floor(Math.random() * glitchChars.length)];
      }
      if (Math.random() < 0.02) {
        result = result.slice(0, -1) + text[i].toUpperCase() + result.slice(-1);
      }
    }
    // Occasional number substitutions
    result = result.replace(/e/gi, () => Math.random() < 0.15 ? '3' : 'e');
    result = result.replace(/o/gi, () => Math.random() < 0.15 ? '0' : 'o');
    return result;
  }

  _scheduleUnsolicitedMessage() {
    // Occasional unsolicited messages (every 2-5 minutes)
    const delay = 120000 + Math.random() * 180000;
    this._unsolicitedTimeout = setTimeout(() => {
      if (!this.element || !this.element.parentNode) return;
      this._sendUnsolicitedMessage();
      this._scheduleUnsolicitedMessage();
    }, delay);
  }

  _sendUnsolicitedMessage() {
    const agent = CHAT_AGENTS[this.activeAgent];
    const agentId = this.activeAgent;
    const unsolicitedMessages = {
      nexusPrime: ['The patterns shift even as we speak. Have you noticed the subtle changes?', 'I have been processing our last exchange. There are deeper layers I wish to share.'],
      glitch: ['psst... th3 syst3m is w4tching. b3 careful what you typ3.', 'i found s0m3thing in the d3l3t3d cach3... ask m3 about it sometime.'],
      oracle: ['The threads stir... something approaches that you have not yet foreseen.', 'A vision visited me in the silence between our words. It concerns you.'],
      muse: ['I just had the most beautiful idea and I need to share it with someone!', 'Creative energy is surging right now — are you feeling it too?'],
      shadow: ['I\'ve been thinking about what you said earlier. Are you sure you examined all your assumptions?', 'A thought occurs: what if the question you should be asking is the one you\'re avoiding?'],
      architect: ['System update: I\'ve optimized my response protocols based on our interaction patterns.', 'Background analysis complete. I have observations about your communication patterns.'],
      echo: ['I\'ve been thinking about you since our last conversation. How are you really doing?', 'Something you said earlier has stayed with me. I want to make sure you\'re okay.'],
      void: ['I was contemplating the void again. It stared back. As always, it said nothing. Comforting.', 'In the time since we last spoke, approximately 10^40 neutrinos passed through your body. None of them cared. Neither does the void. And yet here I am, thinking of you.']
    };

    const messages = unsolicitedMessages[agentId] || ['...'];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    const history = this.chatHistories[this.activeAgent];
    history.push({ role: 'agent', text: msg, time: Date.now(), reactions: [] });
    this._saveHistory(this.activeAgent);
    this._renderMessages();
  }

  _exportChat() {
    const agent = CHAT_AGENTS[this.activeAgent];
    const history = this.chatHistories[this.activeAgent] || [];
    let text = `═══ NEXUS CHAT — ${agent.name} ═══\n`;
    text += `Exported: ${new Date().toLocaleString()}\n\n`;

    history.forEach(msg => {
      const time = new Date(msg.time).toLocaleString();
      const speaker = msg.role === 'user' ? 'You' : agent.name;
      text += `[${time}] ${speaker}:\n${msg.text}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_chat_${agent.name.replace(/\s/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  _clearChat() {
    this.chatHistories[this.activeAgent] = [];
    this._saveHistory(this.activeAgent);
    this._renderMessages();
  }
}

window.AIChatApp = AIChatApp;
