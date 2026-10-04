'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Oracle (Divination Hub)
 *  Multi-system divination: I Ching, Runes, Spirit Board, 8-Ball, and more.
 * ═══════════════════════════════════════════════════════════════
 */

const ICHING_HEXAGRAMS = [
  { num:1, name:'Qián', english:'The Creative', judgment:'The Creative works sublime success. Perseverance brings reward. The power of the creative is immense — it is the primal force that initiates all things.', image:'Heaven moves with untiring power. Thus the superior person makes themselves strong and untiring.', interpretation:'A time of powerful creative force. Your initiative will be rewarded. Act with strength and persistence — the universe supports bold action now.' },
  { num:2, name:'Kūn', english:'The Receptive', judgment:'The Receptive brings sublime success through the perseverance of a mare. The receptive yields and receives — it completes what the creative begins.', image:'The earth\'s condition is receptive devotion. Thus the superior person who has breadth of character carries the outer world.', interpretation:'A time to receive rather than initiate. Be patient, nurturing, and receptive. Let things come to you and support what is already in motion.' },
  { num:3, name:'Zhūn', english:'Difficulty at the Beginning', judgment:'Difficulty at the Beginning works supreme success. Nothing should be undertaken — it furthers one to appoint helpers.', image:'Clouds and thunder: the image of difficulty at the beginning. Thus the superior person brings order out of confusion.', interpretation:'Chaos precedes creation. You are at the messy beginning of something important. Seek help, organize carefully, and do not rush forward blindly.' },
  { num:4, name:'Méng', english:'Youthful Folly', judgment:'Youthful Folly has success. It is not I who seek the young fool; the young fool seeks me.', image:'A spring wells up at the foot of the mountain: the image of Youthful Folly. Thus the superior person fosters character by thoroughness in all they do.', interpretation:'A time for learning and seeking guidance. Approach your situation with humility and the willingness to be taught. Ask questions rather than assuming you know.' },
  { num:5, name:'Xū', english:'Waiting', judgment:'Waiting. If you are sincere, you have light and success. Perseverance brings good fortune. It furthers one to cross the great water.', image:'Clouds rise up to heaven: the image of Waiting. Thus the superior person eats and drinks, is joyous and of good cheer.', interpretation:'The time is not yet right for action. Wait with patience and inner certainty. Use this time to nourish yourself and gather strength for what comes next.' },
  { num:6, name:'Sòng', english:'Conflict', judgment:'Conflict. You are sincere and are being obstructed. A cautious halt halfway brings good fortune. Going through to the end brings misfortune.', image:'Heaven and water go their opposite ways: the image of Conflict. Thus in all matters of business the superior person carefully considers the beginning.', interpretation:'A dispute or conflict situation. Seek mediation and compromise rather than pushing to win. Consider carefully before you act, and avoid escalating the situation.' },
  { num:7, name:'Shī', english:'The Army', judgment:'The Army. The army needs perseverance. Strong leadership and discipline bring good fortune without blame.', image:'In the middle of the earth is water: the image of the Army. Thus the superior person increases their masses by generosity toward the people.', interpretation:'A situation requiring organized, disciplined action. Lead with wisdom and strength. Gather your resources and allies before moving forward.' },
  { num:8, name:'Bǐ', english:'Holding Together', judgment:'Holding Together brings good fortune. Those who are uncertain gradually arrive. Latecomers meet with misfortune.', image:'On the earth is water: the image of Holding Together. Thus the kings of antiquity bestowed the different states as fiefs and cultivated friendly relations with the feudal lords.', interpretation:'A time for alliance and cooperation. Join with others who share your values. Act decisively — those who hesitate too long will miss the opportunity.' },
  { num:9, name:'Xiǎo Chù', english:'Small Taming', judgment:'The Taming Power of the Small has success. Dense clouds, no rain from our western region.', image:'The wind drives across heaven: the image of the Taming Power of the Small. Thus the superior person refines the outward aspect of their nature.', interpretation:'Small, gentle influences can achieve what force cannot. Use patience and subtle persuasion rather than direct confrontation. Progress comes through refinement, not revolution.' },
  { num:10, name:'Lǚ', english:'Treading', judgment:'Treading upon the tail of the tiger. It does not bite. Success.', image:'Heaven above, the lake below: the image of Treading. Thus the superior person discriminates between high and low and gives satisfaction to the people.', interpretation:'Proceed with care and proper conduct, even in dangerous situations. Courtesy and correct behavior will protect you where boldness alone would fail.' },
  { num:11, name:'Tài', english:'Peace', judgment:'Peace. The small departs, the great approaches. Good fortune. Success.', image:'Heaven and earth unite: the image of Peace. Thus the ruler divides and completes the course of heaven and earth and so aids the people.', interpretation:'A time of harmony and prosperity. What you have worked toward is coming to fruition. Enjoy this period of peace while preparing wisely for the cycles ahead.' },
  { num:12, name:'Pǐ', english:'Standstill', judgment:'Standstill. Evil people do not further the perseverance of the superior person. The great departs; the small approaches.', image:'Heaven and earth do not unite: the image of Standstill. Thus the superior person falls back upon their inner worth to escape the difficulties.', interpretation:'A period of stagnation and obstruction. Communication breaks down. Withdraw into yourself and cultivate your inner worth rather than forcing progress in an unresponsive environment.' },
  { num:13, name:'Tóng Rén', english:'Fellowship', judgment:'Fellowship with others in the open. Success. It furthers one to cross the great water. The perseverance of the superior person furthers.', image:'Heaven together with fire: the image of Fellowship. Thus the superior person organizes tribes and makes distinctions between things.', interpretation:'A time for community and shared purpose. Seek allies who share your vision. Organize clearly and act with transparent honesty.' },
  { num:14, name:'Dà Yǒu', english:'Great Possession', judgment:'Great Possession. Supreme success.', image:'Fire in heaven above: the image of Great Possession. Thus the superior person curbs evil and furthers good and in this way obeys the benevolent will of heaven.', interpretation:'A time of abundance and great resources. Use what you have wisely and generously. Your position of strength carries responsibility.' },
  { num:15, name:'Qiān', english:'Modesty', judgment:'Modesty creates success. The superior person carries things through.', image:'Within the earth, a mountain: the image of Modesty. Thus the superior person reduces that which is too much and augments that which is too little.', interpretation:'Humility is your greatest asset now. Do not boast or overreach. Those who are truly great do not need to proclaim their greatness.' },
  { num:16, name:'Yù', english:'Enthusiasm', judgment:'Enthusiasm. It furthers one to install helpers and to set armies marching.', image:'Thunder comes resounding out of the earth: the image of Enthusiasm. Thus the ancient kings made music in order to honor merit.', interpretation:'A time of positive energy and momentum. Use enthusiasm to mobilize others and take action. Music, celebration, and shared joy amplify your power.' },
  { num:29, name:'Kǎn', english:'The Abysmal (Water)', judgment:'The Abysmal repeated. If you are sincere, you have success in your heart and whatever you do succeeds.', image:'Water flows on uninterruptedly and reaches its goal: the image of the Abysmal repeated. Thus the superior person walks in lasting virtue and conducts business through teaching.', interpretation:'Danger upon danger, but sincerity and inner truth will see you through. Flow like water through obstacles — persistent, adaptable, and unstoppable.' },
  { num:30, name:'Lí', english:'The Clinging (Fire)', judgment:'The Clinging. Perseverance furthers. It brings success. Care of the cow brings good fortune.', image:'That which is bright rises: the image of Fire. Thus the great person, by perpetuating this brightness, illumines the four quarters of the world.', interpretation:'Clarity and illumination, but fire must cling to fuel to burn. Attach yourself to what is worthy and enduring. Dependence on the right source is strength, not weakness.' },
  { num:42, name:'Yì', english:'Increase', judgment:'Increase. It furthers one to undertake something. It furthers one to cross the great water.', image:'Wind and thunder: the image of Increase. Thus the superior person, if they see good, imitates it. If they have faults, they rid themselves of them.', interpretation:'A time of growth and expansion. Act boldly and take on new ventures. Generosity now returns multiplied. Study what is good and eliminate what is harmful.' },
  { num:63, name:'Jì Jì', english:'After Completion', judgment:'After Completion. Success in small matters. Perseverance furthers. At the beginning good fortune, at the end disorder.', image:'Water over fire: the image of the condition after Transition. Thus the superior person considers the possibility of misfortune and arms themselves against it in advance.', interpretation:'The work is done, but vigilance is required. What is complete can decay. Maintain what you have achieved through careful attention and do not become complacent.' },
  { num:64, name:'Wèi Jì', english:'Before Completion', judgment:'Before Completion. Success. But if the little fox, after nearly completing the crossing, gets its tail in the water, there is nothing that would further.', image:'Fire over water: the image of the condition before Transition. Thus the superior person is careful in the differentiation of things, in order to find their place.', interpretation:'The goal is near but not yet reached. Exercise extreme care in these final steps. Premature celebration or careless action at the last moment can undo everything.' }
];

const RUNES = [
  { name:'Fehu', phonetic:'F', meaning:'Wealth, abundance, prosperity', upright:'Material gain, financial success, earned income, new beginnings in material matters.', reversed:'Financial loss, greed, materialism without spiritual growth.' },
  { name:'Uruz', phonetic:'U/V', meaning:'Wild ox, primal strength', upright:'Physical strength, health, vitality, untamed potential, courage in the face of challenge.', reversed:'Weakness, illness, missed opportunity, untamed aggression or cowardice.' },
  { name:'Thurisaz', phonetic:'Th', meaning:'Thorn, giant, gateway', upright:'Defense, protection, breaking through obstacles, directed force, confronting challenges.', reversed:'Defenselessness, vulnerability, rash action or inaction at a critical moment.' },
  { name:'Ansuz', phonetic:'A', meaning:'God, divine communication', upright:'Divine inspiration, signals, wisdom from elders, communication, revelations.', reversed:'Miscommunication, delusion, manipulation, ignored messages.' },
  { name:'Raidho', phonetic:'R', meaning:'Journey, riding', upright:'Travel, movement, rhythm, right action, the journey itself as teacher.', reversed:'Stagnation, disrupted travel, wrong direction, disharmony in movement.' },
  { name:'Kenaz', phonetic:'K/C', meaning:'Torch, illumination', upright:'Vision, revelation, creativity, technical ability, inner light, knowledge gained.', reversed:'Darkness, confusion, loss of vision, creativity blocked, illness.' },
  { name:'Gebo', phonetic:'G', meaning:'Gift, partnership', upright:'Gifts, generosity, partnerships, exchange, balance in giving and receiving. (No reversal.)', reversed:null },
  { name:'Wunjo', phonetic:'W/V', meaning:'Joy, harmony', upright:'Joy, fellowship, harmony, prosperity, alignment of will with the greater good.', reversed:'Sorrow, strife, alienation, delirium, intoxication.' },
  { name:'Hagalaz', phonetic:'H', meaning:'Hail, disruption', upright:'Disruption, uncontrollable forces, hail storm, clearing away the old to make way for new. (No reversal.)', reversed:null },
  { name:'Nauthiz', phonetic:'N', meaning:'Need, constraint', upright:'Need, constraint, resistance, self-reliance, hardship that builds character.', reversed:'Excess, depression, poverty of spirit, unnecessary deprivation.' },
  { name:'Isa', phonetic:'I', meaning:'Ice, stillness', upright:'Standstill, ice, concentration, withdrawal, patience, blocked action. (No reversal.)', reversed:null },
  { name:'Jera', phonetic:'J/Y', meaning:'Harvest, year', upright:'Harvest, reward for effort, natural cycles, patience rewarded, fruitful outcome. (No reversal.)', reversed:null },
  { name:'Eihwaz', phonetic:'Ei', meaning:'Yew tree, transformation', upright:'Transformation, endurance, strength through adversity, the spine of the world tree. (No reversal.)', reversed:null },
  { name:'Perthro', phonetic:'P', meaning:'Dice cup, mystery', upright:'Mystery, the unknown, hidden knowledge, divination, feminine mysteries, fate.', reversed:'Addiction, stagnation, loneliness, malaise, unpleasant surprises.' },
  { name:'Algiz', phonetic:'Z', meaning:'Elk, protection', upright:'Protection, shield, higher connection, divine protection, new opportunities guarded.', reversed:'Hidden danger, vulnerability, taboo, warning, spiritual disconnection.' },
  { name:'Sowilo', phonetic:'S', meaning:'Sun, success', upright:'Success, goals achieved, power, wholeness, life force, the light that conquers darkness. (No reversal.)', reversed:null },
  { name:'Tiwaz', phonetic:'T', meaning:'Tyr, justice', upright:'Justice, victory, honor, self-sacrifice, warrior energy, male energy, legal matters.', reversed:'Injustice, defeat, imbalance, dishonor, aggression without cause.' },
  { name:'Berkano', phonetic:'B', meaning:'Birch, birth', upright:'Birth, fertility, new beginnings, nurturing, the feminine principle, healing.', reversed:'Infertility, anxiety, loss of control, domestic problems, neglect of growth.' },
  { name:'Ehwaz', phonetic:'E', meaning:'Horse, movement', upright:'Movement, progress, teamwork, trust, loyalty, partnership between equals.', reversed:'Restlessness, mistrust, betrayal, disharmony in partnership, feeling trapped.' },
  { name:'Mannaz', phonetic:'M', meaning:'Humanity, self', upright:'The self, humanity, interdependence, intelligence, social order, self-knowledge.', reversed:'Self-deception, isolation, manipulation, depression, enemy within.' },
  { name:'Laguz', phonetic:'L', meaning:'Water, flow', upright:'Water, flow, intuition, dreams, the unconscious, emotional depth, psychic ability.', reversed:'Confusion, fear, wrong decisions, madness, drowning in emotion.' },
  { name:'Ingwaz', phonetic:'Ng', meaning:'Seed, potential', upright:'Potential, gestation, inner growth, the seed, completion leading to new beginning. (No reversal.)', reversed:null },
  { name:'Dagaz', phonetic:'D', meaning:'Day, dawn', upright:'Day, dawn, breakthrough, awakening, transformation, clarity after darkness. (No reversal.)', reversed:null },
  { name:'Othala', phonetic:'O', meaning:'Heritage, home', upright:'Heritage, ancestral property, inheritance, home, established order, what is rightfully yours.', reversed:'Loss of home, prejudice, poverty, rootlessness, clinging to the past.' }
];

const MAGIC_8_RESPONSES = [
  // Positive (15)
  'It is certain.', 'Without a doubt.', 'Yes, definitely.', 'You may rely on it.',
  'As I see it, yes.', 'Most likely.', 'Outlook good.', 'Yes.',
  'Signs point to yes.', 'The stars align in your favor.', 'Absolutely.',
  'The spirits affirm this.', 'Fortune smiles upon you.', 'It shall come to pass.', 'Destiny says yes.',
  // Neutral (10)
  'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.', 'Cannot predict now.',
  'Concentrate and ask again.', 'The veil is thick — seek clarity.', 'The answer hides behind time.',
  'Not all is revealed yet.', 'Patience will unveil the truth.', 'The threads are still weaving.',
  // Negative (15)
  'Don\'t count on it.', 'My reply is no.', 'My sources say no.', 'Outlook not so good.',
  'Very doubtful.', 'The void whispers no.', 'The shadows conceal a negative.', 'Fate turns away.',
  'The stars are not aligned for this.', 'Seek a different path.', 'No — and questioning further will not change this.',
  'The spirits are silent, which means no.', 'This door is closed.', 'The energy resists this outcome.', 'Not in this cycle.'
];

const FORTUNES = [
  'A beautiful, smart, and loving person will be coming into your life.',
  'Your creativity will lead you to unexpected places.',
  'The obstacle in your path is your path.',
  'A surprise gift awaits you. It may already be on its way.',
  'Your patience will be rewarded sooner than you think.',
  'The best time to plant a tree was 20 years ago. The second best time is now.',
  'A faithful friend is a strong defense. You will find one soon.',
  'Your ability to find humor in the ordinary is a hidden superpower.',
  'The fortune you seek is in another cookie. Just kidding — it\'s here: trust yourself.',
  'Someone is thinking of you right now. They will reach out within the week.',
  'A journey of a thousand miles begins with a single step. Take that step today.',
  'The universe is rearranging itself in your favor. Be patient.',
  'You will stumble upon the answer you\'ve been seeking in an unexpected place.',
  'Your next great adventure is closer than you think.',
  'The thing you fear most holds the key to your greatest growth.',
  'A financial opportunity will present itself. Evaluate it carefully before acting.',
  'Your words have more power than you realize. Use them wisely.',
  'An old connection will resurface with new possibilities.',
  'The project you\'ve been postponing is ready to begin.',
  'You will laugh about this situation in six months.',
  'Trust the timing. What is meant for you will not pass you by.',
  'A creative breakthrough is imminent. Keep your tools ready.',
  'The person who irritates you most has the lesson you need most.',
  'Your generosity will return to you tenfold.',
  'A door you thought was locked will open when you stop pushing.',
  'The dream you had last night contains a message. Pay attention.',
  'Your next meal will be memorable. Savor it.',
  'Someone will compliment you sincerely today. Accept it fully.',
  'The answer is yes — but the question needs reframing.',
  'You are being watched over by forces you cannot see.',
  'A book, song, or conversation will shift your perspective this week.',
  'The risk you\'re afraid to take is the one you most need to take.',
  'Your future self is thanking you for what you\'re about to do.',
  'An unexpected message will change your plans for the better.',
  'The stars suggest a period of creative abundance ahead.',
  'Rest is not laziness. You need it. Take it without guilt.',
  'A coincidence this week is not a coincidence.',
  'The relationship that challenges you is the one that grows you most.',
  'Your intuition is sharper than you give it credit for. Trust it.',
  'Something you lost will be found in the last place you look. (Always true.)',
  'The moon is waxing. Begin new things now.',
  'A stranger will say exactly what you needed to hear.',
  'Your shadow has a gift for you. Face it to receive it.',
  'The mundane task you dread today will become the memory you treasure.',
  'An ending is a beginning wearing a mask. Look closer.',
  'Your kindness to someone today echoes further than you know.',
  'The technology will work in your favor. Proceed with confidence.',
  'A forgotten talent is ready to be rediscovered.',
  'The weather outside mirrors the weather within. Observe both.',
  'Someone from your past carries a message for your future.'
];

const TEA_LEAF_PATTERNS = [
  { pattern:'Circle', meaning:'Completion, wholeness, a cycle reaching its natural conclusion.' },
  { pattern:'Line (straight)', meaning:'A clear path ahead. Direction and progress without obstruction.' },
  { pattern:'Line (wavy)', meaning:'An uncertain journey ahead. Expect twists and emotional currents.' },
  { pattern:'Triangle (up)', meaning:'Growth, aspiration, reaching toward something higher.' },
  { pattern:'Triangle (down)', meaning:'Grounding, returning to roots, finding stability.' },
  { pattern:'Square', meaning:'Structure, boundaries, a need for security and organization.' },
  { pattern:'Star', meaning:'Inspiration, guidance, a wish coming true or a destiny calling.' },
  { pattern:'Cross', meaning:'A decision point, suffering that leads to transformation, sacrifice.' },
  { pattern:'Heart', meaning:'Love, emotional connection, romance, or deep caring approaching.' },
  { pattern:'Spiral', meaning:'Growth through cycles, returning to the same lesson at a deeper level.' },
  { pattern:'Arrow', meaning:'Direction, ambition, moving toward a goal with focused energy.' },
  { pattern:'Mountain', meaning:'An obstacle ahead that requires patience and climbing skill.' },
  { pattern:'Bird', meaning:'A message is coming. Pay attention to words spoken or received.' },
  { pattern:'Tree', meaning:'Growth, rootedness, family, connection between earth and sky.' },
  { pattern:'Snake', meaning:'Transformation, shedding the old, healing, or hidden danger.' },
  { pattern:'Moon', meaning:'Intuition, the unconscious, feminine energy, cycles and rhythms.' },
  { pattern:'Sun', meaning:'Joy, success, vitality, the conscious mind, clarity.' },
  { pattern:'Anchor', meaning:'Stability, being grounded, or feeling stuck — context reveals which.' },
  { pattern:'Key', meaning:'An answer, a solution, access to something previously closed.' },
  { pattern:'Crown', meaning:'Authority, achievement, recognition, or spiritual attainment.' },
  { pattern:'Ring', meaning:'Commitment, partnership, a bond forming or strengthening.' },
  { pattern:'Eye', meaning:'Awareness, being watched, intuition, or a warning to observe carefully.' },
  { pattern:'Hand', meaning:'Generosity, reaching out, receiving help, or the need to act.' },
  { pattern:'Hourglass', meaning:'Time pressure, patience needed, or the right moment approaching.' },
  { pattern:'Bridge', meaning:'A transition, connection between two states, overcoming separation.' },
  { pattern:'Cloud', meaning:'Confusion, uncertainty, things not yet clear. Wait for clarity.' },
  { pattern:'Lightning', meaning:'Sudden change, revelation, shock that leads to clarity.' },
  { pattern:'Flower', meaning:'Beauty, blossoming, natural growth, the unfolding of potential.' },
  { pattern:'Fish', meaning:'Abundance, fertility, the depths of the unconscious, spiritual nourishment.' },
  { pattern:'Horse', meaning:'Movement, freedom, power, travel, or the animal body\'s wisdom.' }
];

const DICE_MEANINGS = {
  d6: {
    1: 'The seed. Beginnings, potential, the void from which creation springs.',
    2: 'Duality. Partnership, balance, the dance between opposing forces.',
    3: 'Trinity. Synthesis, creativity, the union of mind-body-spirit.',
    4: 'Foundation. Stability, the four directions, grounding and structure.',
    5: 'The pentagram. Humanity, the five senses, the living body in the world.',
    6: 'Harmony. Completion of a cycle, domestic peace, the perfect number.'
  },
  d20: {
    1: 'Critical failure. The universe says stop. Reconsider your approach entirely.',
    2: 'Deep challenge. The path ahead requires more than you currently bring.',
    3: 'Obstacle. Something blocks your way — patience and creativity are needed.',
    4: 'Difficulty. The road is rough but passable. Steel yourself.',
    5: 'Struggle. You must fight for this outcome — it will not come easily.',
    6: 'Tension. The energy is uncertain — stay alert and adaptable.',
    7: 'Mystery. The number of spiritual seeking. Look deeper.',
    8: 'Balance point. You stand at the center — choose your direction wisely.',
    9: 'Approaching completion. You are close — maintain your focus.',
    10: 'Turning point. A cycle completes. Prepare for the next phase.',
    11: 'Master number. Intuition and spiritual insight illuminate your path.',
    12: 'Cosmic order. The universe supports structure and cosmic timing.',
    13: 'Transformation. Death and rebirth. What was must become something new.',
    14: 'Temperance. Blend opposing forces. Find the middle way.',
    15: 'Creativity unleashed. Artistic expression flows freely now.',
    16: 'Sudden change. Expect the unexpected — stay grounded.',
    17: 'The star. Hope and inspiration guide you through darkness.',
    18: 'The moon. Illusion and intuition — trust what you feel, not what you see.',
    19: 'The sun. Joy, success, and vital energy surround you.',
    20: 'Critical success. The universe says YES. Act now with full confidence.'
  }
};

class OracleApp {
  constructor(container) {
    this.container = container;
    this.element = null;
    this._styleEl = null;
    this.activeTab = 'iching';
    this.ichingResult = null;
    this.runeResult = null;
    this.spiritBoardLetters = [];
    this._spiritAnimId = null;
  }

  render() {
    this._injectStyles();
    this.element = document.createElement('div');
    this.element.className = 'oracle-app';
    this._renderUI();
    this.container.appendChild(this.element);
  }

  destroy() {
    if (this._spiritAnimId) cancelAnimationFrame(this._spiritAnimId);
    if (this._styleEl && this._styleEl.parentNode) this._styleEl.parentNode.removeChild(this._styleEl);
    if (this.element && this.element.parentNode) this.element.parentNode.removeChild(this.element);
  }

  _injectStyles() {
    this._styleEl = document.createElement('style');
    this._styleEl.textContent = `
      .oracle-app {
        width: 100%; height: 100%; overflow-y: auto;
        background: rgba(10,5,15,0.97); color: #e0d0e8;
        font-family: 'Georgia', serif; padding: 20px;
        box-sizing: border-box;
      }
      .oracle-header { text-align: center; margin-bottom: 16px; }
      .oracle-title {
        font-size: 26px; color: #ff1493; margin: 0 0 4px 0;
        text-shadow: 0 0 20px #ff003c, 0 0 40px #ff003c80;
        letter-spacing: 2px;
      }
      .oracle-subtitle { color: #a080b0; font-style: italic; font-size: 13px; margin: 0; }
      .oracle-tabs {
        display: flex; flex-wrap: wrap; justify-content: center;
        gap: 4px; margin-bottom: 20px;
      }
      .oracle-tab {
        padding: 7px 14px; border-radius: 16px;
        background: rgba(255,20,147,0.06);
        border: 1px solid rgba(255,20,147,0.15);
        color: #a080b0; font-size: 12px;
        cursor: pointer; transition: all 0.3s;
        font-family: inherit;
      }
      .oracle-tab:hover { background: rgba(255,20,147,0.12); }
      .oracle-tab.active {
        background: rgba(255,20,147,0.18);
        border-color: #ff1493; color: #ff1493;
        box-shadow: 0 0 10px rgba(255,20,147,0.3);
      }
      .oracle-panel {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,20,147,0.1);
        border-radius: 16px; padding: 24px;
        backdrop-filter: blur(8px);
        min-height: 300px;
      }
      .oracle-btn {
        padding: 10px 24px; border-radius: 20px;
        background: linear-gradient(135deg, #ff003c, #ff1493);
        border: none; color: #fff; font-size: 14px;
        font-weight: bold; cursor: pointer;
        box-shadow: 0 0 15px rgba(255,0,60,0.3);
        transition: all 0.3s; font-family: inherit;
        margin: 6px;
      }
      .oracle-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(255,0,60,0.5); }
      .oracle-btn-sm {
        padding: 6px 16px; font-size: 12px;
        background: rgba(255,20,147,0.1);
        border: 1px solid rgba(255,20,147,0.25);
        box-shadow: none;
      }
      .oracle-btn-sm:hover { background: rgba(255,20,147,0.2); box-shadow: 0 0 8px rgba(255,20,147,0.2); }
      .oracle-result {
        background: rgba(255,20,147,0.04);
        border: 1px solid rgba(255,20,147,0.12);
        border-radius: 12px; padding: 18px;
        margin-top: 16px; color: #c8a0d8;
        line-height: 1.7; font-size: 14px;
      }
      .oracle-result h3 { color: #ff1493; margin: 0 0 8px 0; font-size: 18px; }
      .oracle-result h4 { color: #ffd700; margin: 12px 0 4px 0; font-size: 14px; }
      /* I Ching hexagram display */
      .iching-hexagram {
        display: flex; flex-direction: column;
        align-items: center; gap: 6px;
        margin: 16px 0;
      }
      .iching-line {
        display: flex; justify-content: center;
        align-items: center; gap: 12px;
        height: 14px;
      }
      .iching-line-segment {
        width: 80px; height: 10px;
        background: #ff1493;
        border-radius: 2px;
        box-shadow: 0 0 8px rgba(255,20,147,0.5);
        transition: all 0.5s;
      }
      .iching-line-segment.broken {
        width: 34px;
      }
      .iching-line-segment.moving {
        background: #ffd700;
        box-shadow: 0 0 12px rgba(255,215,0,0.6);
      }
      .iching-line.moving-line { opacity: 1; }
      /* Rune display */
      .rune-display {
        display: flex; justify-content: center;
        gap: 20px; flex-wrap: wrap; margin: 16px 0;
      }
      .rune-tile {
        width: 70px; height: 90px;
        background: rgba(255,20,147,0.06);
        border: 1px solid rgba(255,20,147,0.2);
        border-radius: 8px;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        cursor: pointer; transition: all 0.5s;
        position: relative; perspective: 600px;
      }
      .rune-tile.hidden-rune {
        background: rgba(0,0,0,0.3);
      }
      .rune-tile.hidden-rune::after {
        content: '?'; font-size: 28px; color: #7a5a8a;
      }
      .rune-tile.revealed {
        border-color: #ff1493;
        box-shadow: 0 0 15px rgba(255,20,147,0.3);
        animation: rune-glow 2s ease-in-out infinite;
      }
      @keyframes rune-glow {
        0%, 100% { box-shadow: 0 0 15px rgba(255,20,147,0.3); }
        50% { box-shadow: 0 0 25px rgba(255,20,147,0.6); }
      }
      .rune-symbol { font-size: 32px; color: #ff1493; }
      .rune-name { font-size: 10px; color: #c8a0d8; margin-top: 4px; }
      /* Spirit Board */
      .spirit-board-container {
        position: relative; width: 100%;
        max-width: 500px; margin: 0 auto;
        padding: 20px;
      }
      .spirit-board {
        background: rgba(20,10,30,0.9);
        border: 2px solid rgba(255,20,147,0.2);
        border-radius: 16px; padding: 30px 20px;
        position: relative;
      }
      .spirit-board-letters {
        display: flex; flex-wrap: wrap;
        justify-content: center; gap: 8px;
        margin-bottom: 16px;
      }
      .spirit-board-letter {
        width: 32px; height: 32px;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; color: #c8a0d8;
        border: 1px solid rgba(255,20,147,0.15);
        border-radius: 6px;
        transition: all 0.3s;
      }
      .spirit-board-letter.active {
        color: #ff1493; border-color: #ff1493;
        box-shadow: 0 0 12px rgba(255,20,147,0.5);
        transform: scale(1.2);
      }
      .spirit-board-numbers {
        display: flex; justify-content: center;
        gap: 8px; margin-bottom: 12px;
      }
      .spirit-board-words {
        display: flex; justify-content: center; gap: 16px;
      }
      .spirit-board-word {
        padding: 6px 16px; border: 1px solid rgba(255,20,147,0.15);
        border-radius: 8px; color: #c8a0d8; font-size: 13px;
      }
      .spirit-board-message {
        text-align: center; margin-top: 16px;
        font-size: 18px; color: #ff1493;
        letter-spacing: 4px; min-height: 30px;
        text-shadow: 0 0 10px rgba(255,20,147,0.5);
      }
      /* 8-Ball */
      .eight-ball {
        width: 180px; height: 180px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, #333, #000);
        margin: 20px auto;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: all 0.3s;
        box-shadow: 0 0 30px rgba(255,20,147,0.2), inset 0 -10px 20px rgba(0,0,0,0.5);
        position: relative;
      }
      .eight-ball:hover { box-shadow: 0 0 40px rgba(255,20,147,0.4); }
      .eight-ball.shaking {
        animation: ball-shake 0.5s ease-in-out;
      }
      @keyframes ball-shake {
        0%, 100% { transform: rotate(0); }
        20% { transform: rotate(-10deg) translateX(-5px); }
        40% { transform: rotate(10deg) translateX(5px); }
        60% { transform: rotate(-5deg) translateX(-3px); }
        80% { transform: rotate(5deg) translateX(3px); }
      }
      .eight-ball-window {
        width: 80px; height: 80px;
        border-radius: 50%;
        background: rgba(10,0,30,0.9);
        border: 2px solid rgba(100,50,150,0.3);
        display: flex; align-items: center; justify-content: center;
        text-align: center; padding: 8px;
      }
      .eight-ball-answer {
        font-size: 9px; color: #ff1493;
        line-height: 1.3; font-weight: bold;
        opacity: 0; transition: opacity 0.5s;
      }
      .eight-ball-answer.visible { opacity: 1; }
      /* Fortune Cookie */
      .fortune-cookie {
        width: 120px; height: 80px; margin: 20px auto;
        position: relative; cursor: pointer;
      }
      .cookie-body {
        width: 100%; height: 100%;
        background: linear-gradient(135deg, #d4a050, #b8860b);
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.5s;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        font-size: 24px;
      }
      .cookie-body.cracked {
        transform: scaleX(1.3) scaleY(0.7);
        border-radius: 40%;
      }
      .fortune-slip {
        background: #fff9e6; color: #333;
        padding: 12px 18px; border-radius: 4px;
        font-size: 13px; line-height: 1.5;
        max-width: 300px; margin: 16px auto;
        text-align: center; opacity: 0;
        transition: opacity 0.5s;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      }
      .fortune-slip.visible { opacity: 1; }
      /* Coin */
      .coin {
        width: 80px; height: 80px; border-radius: 50%;
        margin: 20px auto;
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; font-weight: bold;
        transition: all 0.5s;
      }
      .coin-heads {
        background: linear-gradient(135deg, #ffd700, #b8860b);
        color: #1a0a2e;
        box-shadow: 0 0 15px rgba(255,215,0,0.5);
      }
      .coin-tails {
        background: linear-gradient(135deg, #c0c0c0, #808080);
        color: #1a0a2e;
        box-shadow: 0 0 15px rgba(192,192,192,0.5);
      }
      .coin.flipping {
        animation: coin-flip 0.8s ease-in-out;
      }
      @keyframes coin-flip {
        0% { transform: rotateX(0); }
        50% { transform: rotateX(900deg) scale(0.8); }
        100% { transform: rotateX(1800deg) scale(1); }
      }
      /* Dice */
      .dice {
        width: 70px; height: 70px; border-radius: 12px;
        margin: 20px auto;
        display: flex; align-items: center; justify-content: center;
        font-size: 28px; font-weight: bold;
        background: rgba(255,20,147,0.1);
        border: 2px solid rgba(255,20,147,0.3);
        color: #ff1493;
        transition: all 0.3s;
      }
      .dice.rolling {
        animation: dice-roll 0.6s ease-in-out;
      }
      @keyframes dice-roll {
        0% { transform: rotate(0) scale(1); }
        25% { transform: rotate(90deg) scale(0.8); }
        50% { transform: rotate(180deg) scale(1.1); }
        75% { transform: rotate(270deg) scale(0.9); }
        100% { transform: rotate(360deg) scale(1); }
      }
      /* Tea Leaf */
      .tea-cup {
        width: 200px; height: 200px; margin: 20px auto;
        border-radius: 50%;
        background: radial-gradient(circle at 50% 50%, rgba(139,90,43,0.3), rgba(80,40,10,0.5));
        border: 3px solid rgba(139,90,43,0.4);
        position: relative; overflow: hidden;
      }
      .tea-pattern {
        position: absolute;
        background: rgba(60,30,5,0.6);
        border-radius: 50%;
        animation: tea-form 1s ease-out forwards;
      }
      @keyframes tea-form {
        from { transform: scale(0); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .oracle-select {
        padding: 8px 14px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,20,147,0.25);
        border-radius: 8px; color: #e0d0e8;
        font-size: 13px; font-family: inherit;
        outline: none; margin: 6px;
      }
      .oracle-select option { background: #1a0a2e; }
      .oracle-input {
        padding: 10px 16px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,20,147,0.25);
        border-radius: 10px; color: #e0d0e8;
        font-size: 14px; font-family: inherit;
        outline: none; width: 100%; max-width: 400px;
        box-sizing: border-box; margin-bottom: 12px;
      }
      .oracle-input:focus { border-color: #ff1493; box-shadow: 0 0 10px rgba(255,20,147,0.3); }
      .oracle-input::placeholder { color: #7a5a8a; font-style: italic; }
      .oracle-center { text-align: center; }
      .oracle-label { color: #a080b0; font-size: 12px; margin-bottom: 6px; display: block; }
    `;
    document.head.appendChild(this._styleEl);
  }

  _renderUI() {
    const tabs = [
      { id: 'iching', label: '☰ I Ching' },
      { id: 'runes', label: 'ᚱ Runes' },
      { id: 'spirit', label: '✦ Spirit Board' },
      { id: 'eightball', label: '🎱 8-Ball' },
      { id: 'coin', label: '🪙 Coin' },
      { id: 'dice', label: '🎲 Dice' },
      { id: 'fortune', label: '🥠 Fortune' },
      { id: 'tealeaf', label: '🍵 Tea Leaf' }
    ];

    this.element.innerHTML = `
      <div class="oracle-header">
        <h1 class="oracle-title">✦ Oracle ✦</h1>
        <p class="oracle-subtitle">Many paths to divination — all lead to truth</p>
      </div>
      <div class="oracle-tabs">
        ${tabs.map(t => `<button class="oracle-tab${t.id === this.activeTab ? ' active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div class="oracle-panel" id="oracle-content"></div>
    `;

    this.element.querySelectorAll('.oracle-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeTab = tab.dataset.tab;
        this.element.querySelectorAll('.oracle-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._renderTab();
      });
    });

    this._renderTab();
  }

  _renderTab() {
    const content = this.element.querySelector('#oracle-content');
    switch (this.activeTab) {
      case 'iching': this._renderIChing(content); break;
      case 'runes': this._renderRunes(content); break;
      case 'spirit': this._renderSpiritBoard(content); break;
      case 'eightball': this._render8Ball(content); break;
      case 'coin': this._renderCoin(content); break;
      case 'dice': this._renderDice(content); break;
      case 'fortune': this._renderFortune(content); break;
      case 'tealeaf': this._renderTeaLeaf(content); break;
    }
  }

  // ═══ I CHING ═══
  _renderIChing(el) {
    el.innerHTML = `
      <div class="oracle-center">
        <h3 style="color:#ff1493;margin:0 0 8px 0;">I Ching — Book of Changes</h3>
        <p style="color:#a080b0;font-size:13px;margin-bottom:16px;">Focus on your question, then cast the hexagram.</p>
        <input type="text" class="oracle-input" id="iching-question" placeholder="What question do you bring?" style="display:block;margin:0 auto 16px;" />
        <button class="oracle-btn" id="iching-cast-btn">Cast Hexagram</button>
        <div id="iching-result"></div>
      </div>
    `;
    el.querySelector('#iching-cast-btn').addEventListener('click', () => this._castIChing());
  }

  _castIChing() {
    // Generate 6 lines (bottom to top)
    const lines = [];
    for (let i = 0; i < 6; i++) {
      // 3 coin tosses per line: heads=3, tails=2
      let sum = 0;
      for (let c = 0; c < 3; c++) {
        sum += Math.random() < 0.5 ? 3 : 2;
      }
      // 6=old yin(moving), 7=young yang, 8=young yin, 9=old yang(moving)
      lines.push(sum);
    }

    // Determine hexagram number from lines (simplified mapping)
    const binaryLines = lines.map(l => (l === 7 || l === 9) ? 1 : 0);
    // Map to hexagram index
    let hexIndex = 0;
    for (let i = 0; i < 6; i++) {
      hexIndex += binaryLines[i] * Math.pow(2, i);
    }
    hexIndex = hexIndex % ICHING_HEXAGRAMS.length;
    const hex = ICHING_HEXAGRAMS[hexIndex];

    // Check for moving lines
    const hasMoving = lines.some(l => l === 6 || l === 9);
    let changedHex = null;
    if (hasMoving) {
      const changedLines = lines.map(l => {
        if (l === 6) return 7; // old yin -> young yang
        if (l === 9) return 8; // old yang -> young yin
        return l;
      });
      const changedBinary = changedLines.map(l => (l === 7 || l === 9) ? 1 : 0);
      let changedIdx = 0;
      for (let i = 0; i < 6; i++) changedIdx += changedBinary[i] * Math.pow(2, i);
      changedIdx = changedIdx % ICHING_HEXAGRAMS.length;
      changedHex = ICHING_HEXAGRAMS[changedIdx];
    }

    const resultEl = this.element.querySelector('#iching-result');
    let html = `<div class="oracle-result">`;
    html += `<h3>Hexagram ${hex.num} — ${hex.name} (${hex.english})</h3>`;

    // Hexagram SVG display
    html += `<div class="iching-hexagram">`;
    for (let i = 5; i >= 0; i--) {
      const isYang = lines[i] === 7 || lines[i] === 9;
      const isMoving = lines[i] === 6 || lines[i] === 9;
      if (isYang) {
        html += `<div class="iching-line${isMoving ? ' moving-line' : ''}"><div class="iching-line-segment${isMoving ? ' moving' : ''}"></div></div>`;
      } else {
        html += `<div class="iching-line${isMoving ? ' moving-line' : ''}"><div class="iching-line-segment broken${isMoving ? ' moving' : ''}"></div><div style="width:12px"></div><div class="iching-line-segment broken${isMoving ? ' moving' : ''}"></div></div>`;
      }
    }
    html += `</div>`;

    html += `<h4>Judgment</h4><p>${hex.judgment}</p>`;
    html += `<h4>Image</h4><p>${hex.image}</p>`;
    html += `<h4>Interpretation</h4><p>${hex.interpretation}</p>`;

    if (hasMoving && changedHex) {
      html += `<h4 style="color:#ffd700;">Moving Lines — Changing to Hexagram ${changedHex.num}: ${changedHex.name} (${changedHex.english})</h4>`;
      html += `<p>The moving lines indicate transformation. The situation evolves toward: <strong>${changedHex.english}</strong>.</p>`;
      html += `<p><em>${changedHex.interpretation}</em></p>`;
    }

    html += `</div>`;
    resultEl.innerHTML = html;
  }

  // ═══ RUNES ═══
  _renderRunes(el) {
    el.innerHTML = `
      <div class="oracle-center">
        <h3 style="color:#ff1493;margin:0 0 8px 0;">Elder Futhark Runes</h3>
        <p style="color:#a080b0;font-size:13px;margin-bottom:12px;">Choose your casting method.</p>
        <div style="margin-bottom:16px;">
          <button class="oracle-btn-sm" data-rune-cast="1">Single Rune</button>
          <button class="oracle-btn-sm" data-rune-cast="3">Three Rune Spread</button>
          <button class="oracle-btn-sm" data-rune-cast="5">Five Rune Cross</button>
        </div>
        <div id="rune-result"></div>
      </div>
    `;
    el.querySelectorAll('[data-rune-cast]').forEach(btn => {
      btn.addEventListener('click', () => this._castRunes(parseInt(btn.dataset.runeCast)));
    });
  }

  _castRunes(count) {
    const positions = count === 1 ? ['Message'] :
      count === 3 ? ['Past', 'Present', 'Future'] :
      ['Past', 'Present', 'Future', 'Challenge', 'Outcome'];

    const shuffled = [...RUNES].sort(() => Math.random() - 0.5);
    const drawn = shuffled.slice(0, count).map(r => ({
      ...r,
      reversed: r.reversed !== null && Math.random() < 0.3
    }));

    const resultEl = this.element.querySelector('#rune-result');
    let html = `<div class="rune-display">`;
    drawn.forEach((r, i) => {
      const isRev = r.reversed;
      html += `<div class="rune-tile revealed" style="${isRev ? 'transform:rotate(180deg);' : ''}">
        <div class="rune-symbol">${this._getRuneUnicode(RUNES.indexOf(r))}</div>
        <div class="rune-name" style="${isRev ? 'transform:rotate(180deg);' : ''}">${r.name}</div>
      </div>`;
    });
    html += `</div>`;

    html += `<div class="oracle-result">`;
    drawn.forEach((r, i) => {
      const isRev = r.reversed;
      html += `<h4>${positions[i]}: ${r.name} ${isRev ? '(Reversed)' : ''} — ${r.phonetic}</h4>`;
      html += `<p><strong>Meaning:</strong> ${r.meaning}</p>`;
      html += `<p>${isRev ? r.reversed : r.upright}</p>`;
    });
    html += `</div>`;
    resultEl.innerHTML = html;
  }

  _getRuneUnicode(index) {
    const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
    return runes[index] || '?';
  }

  // ═══ SPIRIT BOARD ═══
  _renderSpiritBoard(el) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    el.innerHTML = `
      <div class="oracle-center">
        <h3 style="color:#ff1493;margin:0 0 8px 0;">Spirit Board</h3>
        <p style="color:#a080b0;font-size:13px;margin-bottom:12px;">Ask your question and let the spirits guide.</p>
        <input type="text" class="oracle-input" id="spirit-question" placeholder="Speak your question to the spirits..." style="display:block;margin:0 auto 16px;" />
        <button class="oracle-btn" id="spirit-ask-btn">Ask the Spirits</button>
        <div class="spirit-board-container" id="spirit-board-area" style="display:none;">
          <div class="spirit-board">
            <div class="spirit-board-letters" id="spirit-letters">
              ${alphabet.map(l => `<div class="spirit-board-letter" data-letter="${l}">${l}</div>`).join('')}
            </div>
            <div class="spirit-board-numbers">
              ${[0,1,2,3,4,5,6,7,8,9].map(n => `<div class="spirit-board-letter" data-letter="${n}">${n}</div>`).join('')}
            </div>
            <div class="spirit-board-words">
              <div class="spirit-board-word" data-letter="YES">YES</div>
              <div class="spirit-board-word" data-letter="NO">NO</div>
              <div class="spirit-board-word" data-letter="GOODBYE">GOODBYE</div>
            </div>
          </div>
          <div class="spirit-board-message" id="spirit-message"></div>
        </div>
      </div>
    `;

    el.querySelector('#spirit-ask-btn').addEventListener('click', () => this._askSpirit());
  }

  async _askSpirit() {
    const question = this.element.querySelector('#spirit-question').value || 'What do the spirits wish to say?';
    const boardArea = this.element.querySelector('#spirit-board-area');
    boardArea.style.display = 'block';
    const messageEl = this.element.querySelector('#spirit-message');
    messageEl.textContent = '';

    // Generate pseudo-random message based on question
    const hash = question.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const words = [
      'SEEK', 'TRUTH', 'WITHIN', 'CHANGE', 'COMING', 'BEWARE', 'TRUST',
      'LOVE', 'WAIT', 'NOW', 'PATH', 'CLEAR', 'DARK', 'LIGHT', 'FOLLOW',
      'LISTEN', 'HEART', 'TIME', 'NEAR', 'FAR', 'YES', 'NO', 'SOON',
      'DANGER', 'HOPE', 'FEAR', 'NOT', 'YET', 'ALREADY', 'BRAVE',
      'LET', 'GO', 'HOLD', 'FAST', 'OPEN', 'CLOSE', 'GATE', 'DOOR',
      'SPIRIT', 'GUIDE', 'WATCH', 'SHADOW', 'DREAM', 'WAKE', 'RISE'
    ];

    const msgWords = [];
    const count = 2 + (hash % 4);
    for (let i = 0; i < count; i++) {
      const idx = (hash * (i + 1) * 7 + i * 13) % words.length;
      msgWords.push(words[idx]);
    }
    const message = msgWords.join(' ');

    // Animate letter highlighting
    const letters = this.element.querySelectorAll('.spirit-board-letter');
    for (let i = 0; i < message.length; i++) {
      const char = message[i];
      if (char === ' ') {
        messageEl.textContent += ' ';
        await new Promise(r => setTimeout(r, 300));
        continue;
      }
      letters.forEach(l => l.classList.remove('active'));
      const target = this.element.querySelector(`[data-letter="${char}"]`);
      if (target) {
        target.classList.add('active');
        messageEl.textContent += char;
        await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
      }
    }
    letters.forEach(l => l.classList.remove('active'));
  }

  // ═══ MAGIC 8-BALL ═══
  _render8Ball(el) {
    el.innerHTML = `
      <div class="oracle-center">
        <h3 style="color:#ff1493;margin:0 0 8px 0;">Magic 8-Ball</h3>
        <p style="color:#a080b0;font-size:13px;margin-bottom:8px;">Ask a yes-or-no question and shake the ball.</p>
        <input type="text" class="oracle-input" id="eightball-question" placeholder="Ask your question..." style="display:block;margin:0 auto 16px;" />
        <div class="eight-ball" id="eight-ball">
          <div class="eight-ball-window">
            <div class="eight-ball-answer" id="eightball-answer">8</div>
          </div>
        </div>
        <button class="oracle-btn" id="eightball-shake-btn">Shake</button>
      </div>
    `;

    const shake = () => {
      const ball = el.querySelector('#eight-ball');
      const answerEl = el.querySelector('#eightball-answer');
      answerEl.classList.remove('visible');
      answerEl.textContent = '8';
      ball.classList.add('shaking');
      setTimeout(() => {
        ball.classList.remove('shaking');
        const response = MAGIC_8_RESPONSES[Math.floor(Math.random() * MAGIC_8_RESPONSES.length)];
        answerEl.textContent = response;
        answerEl.classList.add('visible');
      }, 600);
    };

    el.querySelector('#eightball-shake-btn').addEventListener('click', shake);
    el.querySelector('#eight-ball').addEventListener('click', shake);
  }

  // ═══ COIN ORACLE ═══
  _renderCoin(el) {
    el.innerHTML = `
      <div class="oracle-center">
        <h3 style="color:#ff1493;margin:0 0 8px 0;">Coin Oracle</h3>
        <p style="color:#a080b0;font-size:13px;margin-bottom:12px;">Heads = Yang (Active) | Tails = Yin (Receptive)</p>
        <div>
          <label class="oracle-label">Number of flips:</label>
          <select class="oracle-select" id="coin-count">
            <option value="1">1 Flip</option>
            <option value="3">3 Flips</option>
            <option value="5">5 Flips</option>
          </select>
        </div>
        <button class="oracle-btn" id="coin-flip-btn" style="margin-top:12px;">Flip Coin</button>
        <div id="coin-result"></div>
      </div>
    `;

    el.querySelector('#coin-flip-btn').addEventListener('click', () => {
      const count = parseInt(el.querySelector('#coin-count').value);
      this._flipCoins(count);
    });
  }

  async _flipCoins(count) {
    const resultEl = this.element.querySelector('#coin-result');
    resultEl.innerHTML = '';
    const results = [];

    for (let i = 0; i < count; i++) {
      const isHeads = Math.random() < 0.5;
      results.push(isHeads);
      const coinDiv = document.createElement('div');
      coinDiv.className = `coin flipping ${isHeads ? 'coin-heads' : 'coin-tails'}`;
      coinDiv.textContent = isHeads ? 'H' : 'T';
      resultEl.appendChild(coinDiv);
      await new Promise(r => setTimeout(r, 900));
      coinDiv.classList.remove('flipping');
    }

    const heads = results.filter(r => r).length;
    const tails = results.length - heads;

    let interpretation = '';
    if (count === 1) {
      interpretation = results[0] ? 'Yang energy dominates. This is a time for action, initiative, and outward expression.' : 'Yin energy prevails. This is a time for receptivity, patience, and inward reflection.';
    } else {
      if (heads > tails) {
        interpretation = `Yang majority (${heads}/${count}). Active energy dominates. Take initiative and trust your outward impulses.`;
      } else if (tails > heads) {
        interpretation = `Yin majority (${tails}/${count}). Receptive energy dominates. Be patient, listen, and allow things to come to you.`;
      } else {
        interpretation = `Perfect balance (${heads} yang, ${tails} yin). The universe asks you to find the middle path.`;
      }
    }

    resultEl.innerHTML += `<div class="oracle-result"><p>${interpretation}</p></div>`;
  }

  // ═══ DICE DIVINATION ═══
  _renderDice(el) {
    el.innerHTML = `
      <div class="oracle-center">
        <h3 style="color:#ff1493;margin:0 0 8px 0;">Dice Divination</h3>
        <p style="color:#a080b0;font-size:13px;margin-bottom:12px;">Let the bones speak.</p>
        <div>
          <label class="oracle-label">Die type:</label>
          <select class="oracle-select" id="dice-type">
            <option value="d6">d6 (Six-sided)</option>
            <option value="d20">d20 (Twenty-sided)</option>
          </select>
        </div>
        <button class="oracle-btn" id="dice-roll-btn" style="margin-top:12px;">Roll</button>
        <div id="dice-result"></div>
      </div>
    `;

    el.querySelector('#dice-roll-btn').addEventListener('click', () => {
      const type = el.querySelector('#dice-type').value;
      this._rollDice(type);
    });
  }

  _rollDice(type) {
    const max = type === 'd6' ? 6 : 20;
    const result = Math.floor(Math.random() * max) + 1;
    const resultEl = this.element.querySelector('#dice-result');

    resultEl.innerHTML = `
      <div class="dice rolling">${result}</div>
      <div class="oracle-result">
        <h3>${type.toUpperCase()} — You rolled ${result}</h3>
        <p>${DICE_MEANINGS[type][result]}</p>
      </div>
    `;

    setTimeout(() => {
      const diceEl = resultEl.querySelector('.dice');
      if (diceEl) diceEl.classList.remove('rolling');
    }, 700);
  }

  // ═══ FORTUNE COOKIE ═══
  _renderFortune(el) {
    el.innerHTML = `
      <div class="oracle-center">
        <h3 style="color:#ff1493;margin:0 0 8px 0;">Fortune Cookie</h3>
        <p style="color:#a080b0;font-size:13px;margin-bottom:16px;">Click the cookie to crack it open.</p>
        <div class="fortune-cookie" id="fortune-cookie">
          <div class="cookie-body" id="cookie-body">🥠</div>
        </div>
        <div class="fortune-slip" id="fortune-slip"></div>
        <div id="fortune-numbers" style="margin-top:12px;color:#ffd700;font-size:13px;"></div>
      </div>
    `;

    let cracked = false;
    const crack = () => {
      if (cracked) return;
      cracked = true;
      const cookieBody = el.querySelector('#cookie-body');
      const slip = el.querySelector('#fortune-slip');
      const nums = el.querySelector('#fortune-numbers');

      cookieBody.classList.add('cracked');
      cookieBody.textContent = '🥠';

      const fortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
      setTimeout(() => {
        slip.textContent = fortune;
        slip.classList.add('visible');
        // Lucky numbers
        const luckyNums = [];
        for (let i = 0; i < 5; i++) {
          luckyNums.push(Math.floor(Math.random() * 49) + 1);
        }
        nums.textContent = `Lucky Numbers: ${[...new Set(luckyNums)].join(' · ')}`;
      }, 500);

      // Reset after 8 seconds
      setTimeout(() => {
        cracked = false;
        cookieBody.classList.remove('cracked');
        slip.classList.remove('visible');
        nums.textContent = '';
      }, 8000);
    };

    el.querySelector('#fortune-cookie').addEventListener('click', crack);
  }

  // ═══ TEA LEAF ═══
  _renderTeaLeaf(el) {
    el.innerHTML = `
      <div class="oracle-center">
        <h3 style="color:#ff1493;margin:0 0 8px 0;">Tea Leaf Reading</h3>
        <p style="color:#a080b0;font-size:13px;margin-bottom:16px;">Sip the tea, turn the cup, and read the leaves.</p>
        <button class="oracle-btn" id="tea-read-btn">Read the Leaves</button>
        <div class="tea-cup" id="tea-cup"></div>
        <div id="tea-result"></div>
      </div>
    `;

    el.querySelector('#tea-read-btn').addEventListener('click', () => this._readTeaLeaves());
  }

  _readTeaLeaves() {
    const cup = this.element.querySelector('#tea-cup');
    const resultEl = this.element.querySelector('#tea-result');
    cup.innerHTML = '';

    // Generate random patterns
    const patternCount = 3 + Math.floor(Math.random() * 4);
    const selectedPatterns = [];
    const shuffledPatterns = [...TEA_LEAF_PATTERNS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < patternCount; i++) {
      selectedPatterns.push(shuffledPatterns[i]);
      const blob = document.createElement('div');
      blob.className = 'tea-pattern';
      const size = 15 + Math.random() * 35;
      blob.style.width = size + 'px';
      blob.style.height = size + 'px';
      blob.style.left = (10 + Math.random() * 70) + '%';
      blob.style.top = (10 + Math.random() * 70) + '%';
      blob.style.animationDelay = (i * 0.2) + 's';
      cup.appendChild(blob);
    }

    setTimeout(() => {
      let html = `<div class="oracle-result">`;
      html += `<h3>Patterns in the Leaves</h3>`;
      selectedPatterns.forEach(p => {
        html += `<h4>${p.pattern}</h4><p>${p.meaning}</p>`;
      });
      html += `<p style="color:#ffd700;font-style:italic;margin-top:12px;">The patterns together suggest a period of ${['transition','growth','reflection','action','rest'][Math.floor(Math.random()*5)]}. Trust your intuition as you interpret these signs.</p>`;
      html += `</div>`;
      resultEl.innerHTML = html;
    }, 1200);
  }
}

window.OracleApp = OracleApp;
