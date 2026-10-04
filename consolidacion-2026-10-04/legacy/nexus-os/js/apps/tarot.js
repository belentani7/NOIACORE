'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Tarot Reader App
 *  Full 78-card tarot reading with spreads, animations, and history.
 * ═══════════════════════════════════════════════════════════════
 */

const TAROT_DECK = [
  // ═══ MAJOR ARCANA (0-XXI) ═══
  { id:0, name:'The Fool', arcana:'Major', suit:null, number:0, uprightMeaning:'New beginnings, innocence, spontaneity, a free spirit. The Fool represents the start of a journey, full of wonder and possibility.', reversedMeaning:'Recklessness, risk-taking, holding back, restlessness. You may be ignoring warnings or refusing to take a necessary leap.', keywords:['beginnings','innocence','adventure','spontaneity','faith'], element:'Air', planet:'Uranus' },
  { id:1, name:'The Magician', arcana:'Major', suit:null, number:1, uprightMeaning:'Manifestation, resourcefulness, power, inspired action. You have all the tools you need — it is time to use them.', reversedMeaning:'Manipulation, poor planning, untapped talents, trickery. Someone may be deceiving you or you are not using your gifts.', keywords:['willpower','creation','manifestation','skill','resourcefulness'], element:'Air', planet:'Mercury' },
  { id:2, name:'The High Priestess', arcana:'Major', suit:null, number:2, uprightMeaning:'Intuition, sacred knowledge, the subconscious mind, divine feminine. Trust your inner voice — it speaks truths the rational mind cannot reach.', reversedMeaning:'Secrets, withdrawal, silence, disconnected from intuition. You may be ignoring your inner wisdom or keeping important truths hidden.', keywords:['intuition','mystery','inner knowing','subconscious','feminine'], element:'Water', planet:'Moon' },
  { id:3, name:'The Empress', arcana:'Major', suit:null, number:3, uprightMeaning:'Abundance, fertility, nature, nurturing. The Empress brings forth creation and growth — tend to what you are cultivating.', reversedMeaning:'Creative block, dependence, neglect of self, smothering. You may be over-giving or neglecting your own needs.', keywords:['abundance','fertility','nature','nurturing','creativity'], element:'Earth', planet:'Venus' },
  { id:4, name:'The Emperor', arcana:'Major', suit:null, number:4, uprightMeaning:'Authority, structure, stability, father figure. The Emperor brings order and leadership — establish foundations that will endure.', reversedMeaning:'Tyranny, rigidity, domination, lack of discipline. Power is being misused or structure is crumbling.', keywords:['authority','structure','control','leadership','stability'], element:'Fire', planet:'Aries' },
  { id:5, name:'The Hierophant', arcana:'Major', suit:null, number:5, uprightMeaning:'Tradition, conformity, education, spiritual wisdom. Seek guidance from established knowledge or a trusted teacher.', reversedMeaning:'Rebellion, subversion, new approaches, freedom from convention. Question the rules and find your own spiritual path.', keywords:['tradition','wisdom','conformity','education','guidance'], element:'Earth', planet:'Taurus' },
  { id:6, name:'The Lovers', arcana:'Major', suit:null, number:6, uprightMeaning:'Love, harmony, relationships, choices. A significant union or decision is before you — choose with your whole heart.', reversedMeaning:'Disharmony, imbalance, misalignment, poor choices. A relationship or decision is out of alignment with your values.', keywords:['love','harmony','choice','union','values'], element:'Air', planet:'Gemini' },
  { id:7, name:'The Chariot', arcana:'Major', suit:null, number:7, uprightMeaning:'Determination, willpower, victory, control. Harness opposing forces and drive forward with focused intention.', reversedMeaning:'Lack of direction, aggression, no control, defeat. Forces are pulling you apart and you have lost the reins.', keywords:['willpower','determination','victory','control','drive'], element:'Water', planet:'Cancer' },
  { id:8, name:'Strength', arcana:'Major', suit:null, number:8, uprightMeaning:'Courage, patience, compassion, inner strength. True power comes not from force but from gentle mastery of your instincts.', reversedMeaning:'Self-doubt, weakness, insecurity, raw emotion. You are being ruled by fear or primal impulses.', keywords:['courage','patience','inner strength','compassion','gentle power'], element:'Fire', planet:'Leo' },
  { id:9, name:'The Hermit', arcana:'Major', suit:null, number:9, uprightMeaning:'Introspection, solitude, inner guidance, soul searching. Withdraw from the noise and seek the light within.', reversedMeaning:'Isolation, loneliness, withdrawal, paranoia. Solitude has become exile — it is time to reconnect.', keywords:['solitude','introspection','guidance','wisdom','searching'], element:'Earth', planet:'Virgo' },
  { id:10, name:'Wheel of Fortune', arcana:'Major', suit:null, number:10, uprightMeaning:'Cycles, destiny, turning points, luck. The wheel turns — embrace the change that fortune brings.', reversedMeaning:'Bad luck, resistance to change, broken cycles, lack of control. You are fighting the natural flow of events.', keywords:['cycles','destiny','change','fortune','turning point'], element:'Fire', planet:'Jupiter' },
  { id:11, name:'Justice', arcana:'Major', suit:null, number:11, uprightMeaning:'Fairness, truth, cause and effect, law. The scales balance — actions have consequences and truth will prevail.', reversedMeaning:'Unfairness, dishonesty, lack of accountability, bias. Justice is being perverted or you are avoiding the truth.', keywords:['justice','truth','balance','fairness','karma'], element:'Air', planet:'Libra' },
  { id:12, name:'The Hanged Man', arcana:'Major', suit:null, number:12, uprightMeaning:'Surrender, new perspective, letting go, sacrifice. Sometimes you must hang upside down to see the world clearly.', reversedMeaning:'Stalling, resistance, needless sacrifice, indecision. You are clinging to a perspective that no longer serves you.', keywords:['surrender','perspective','sacrifice','letting go','pause'], element:'Water', planet:'Neptune' },
  { id:13, name:'Death', arcana:'Major', suit:null, number:13, uprightMeaning:'Endings, transformation, transition, letting go. Something must end so that something new can begin — embrace the metamorphosis.', reversedMeaning:'Resistance to change, stagnation, fear of endings, decay. You are holding on to what has already died.', keywords:['transformation','endings','change','rebirth','transition'], element:'Water', planet:'Scorpio' },
  { id:14, name:'Temperance', arcana:'Major', suit:null, number:14, uprightMeaning:'Balance, moderation, patience, purpose. Blend opposing forces into harmony — the middle path leads to peace.', reversedMeaning:'Imbalance, excess, lack of patience, disharmony. Forces are out of alignment and moderation has been abandoned.', keywords:['balance','moderation','patience','harmony','purpose'], element:'Fire', planet:'Sagittarius' },
  { id:15, name:'The Devil', arcana:'Major', suit:null, number:15, uprightMeaning:'Bondage, materialism, shadow self, addiction. Examine what chains you have accepted — liberation begins with awareness.', reversedMeaning:'Release, breaking free, reclaiming power, facing shadow. You are ready to break the chains that bind you.', keywords:['bondage','shadow','materialism','addiction','liberation'], element:'Earth', planet:'Capricorn' },
  { id:16, name:'The Tower', arcana:'Major', suit:null, number:16, uprightMeaning:'Sudden upheaval, revelation, chaos, awakening. The structure was false — its destruction makes way for truth.', reversedMeaning:'Avoidance of disaster, fear of change, delaying the inevitable, internal upheaval. The tower shakes but has not yet fallen.', keywords:['upheaval','destruction','revelation','awakening','chaos'], element:'Fire', planet:'Mars' },
  { id:17, name:'The Star', arcana:'Major', suit:null, number:17, uprightMeaning:'Hope, inspiration, serenity, renewal. After the storm, the stars appear — let your spirit be replenished.', reversedMeaning:'Despair, lack of faith, disconnection, hopelessness. You have lost sight of the light but it still shines above.', keywords:['hope','inspiration','serenity','renewal','faith'], element:'Air', planet:'Aquarius' },
  { id:18, name:'The Moon', arcana:'Major', suit:null, number:18, uprightMeaning:'Illusion, fear, anxiety, the subconscious. Walk carefully through the moonlit path — not everything is as it seems.', reversedMeaning:'Clarity emerging, release of fear, truth revealed, rational thought returning. The fog lifts and reality becomes clear.', keywords:['illusion','fear','subconscious','intuition','confusion'], element:'Water', planet:'Pisces' },
  { id:19, name:'The Sun', arcana:'Major', suit:null, number:19, uprightMeaning:'Joy, success, vitality, confidence. The Sun shines upon you — bask in warmth, success, and life force.', reversedMeaning:'Temporary depression, lack of clarity, diminished energy, blocked success. Clouds obscure the sun but do not extinguish it.', keywords:['joy','success','vitality','confidence','warmth'], element:'Fire', planet:'Sun' },
  { id:20, name:'Judgement', arcana:'Major', suit:null, number:20, uprightMeaning:'Rebirth, calling, absolution, inner awakening. Answer the higher call — your past is forgiven and a new chapter begins.', reversedMeaning:'Self-doubt, refusal of the call, harsh self-judgment, stagnation. You are ignoring the trumpet that calls you forward.', keywords:['rebirth','calling','forgiveness','awakening','evaluation'], element:'Fire', planet:'Pluto' },
  { id:21, name:'The World', arcana:'Major', suit:null, number:21, uprightMeaning:'Completion, integration, accomplishment, wholeness. The cycle is complete — celebrate what you have achieved and prepare for the next journey.', reversedMeaning:'Incompletion, shortcuts, lack of closure, stagnation. The circle is not yet closed — something remains unfinished.', keywords:['completion','wholeness','accomplishment','integration','fulfillment'], element:'Earth', planet:'Saturn' },

  // ═══ WANDS (Fire) ═══
  { id:22, name:'Ace of Wands', arcana:'Minor', suit:'Wands', number:1, uprightMeaning:'Inspiration, new opportunity, growth, potential. A spark of creative fire ignites — follow the inspiration.', reversedMeaning:'Delays, lack of motivation, missed opportunity, creative block. The spark has not yet caught.', keywords:['inspiration','spark','creation','potential','energy'], element:'Fire', planet:null },
  { id:23, name:'Two of Wands', arcana:'Minor', suit:'Wands', number:2, uprightMeaning:'Planning, decisions, discovery, future vision. Stand at the crossroads and look to the horizon.', reversedMeaning:'Fear of the unknown, lack of planning, playing it safe, indecision.', keywords:['planning','decisions','vision','discovery','progress'], element:'Fire', planet:null },
  { id:24, name:'Three of Wands', arcana:'Minor', suit:'Wands', number:3, uprightMeaning:'Expansion, foresight, overseas opportunities, progress. Your plans begin to bear fruit.', reversedMeaning:'Delays, frustration, obstacles, lack of foresight.', keywords:['expansion','progress','foresight','opportunity','growth'], element:'Fire', planet:null },
  { id:25, name:'Four of Wands', arcana:'Minor', suit:'Wands', number:4, uprightMeaning:'Celebration, harmony, home, milestone. A time of joy and community.', reversedMeaning:'Instability, transition, lack of support, cancelled celebration.', keywords:['celebration','harmony','home','milestone','community'], element:'Fire', planet:null },
  { id:26, name:'Five of Wands', arcana:'Minor', suit:'Wands', number:5, uprightMeaning:'Competition, conflict, tension, diversity. Many voices clamor for attention.', reversedMeaning:'Avoiding conflict, inner conflict, resolution, compromise.', keywords:['competition','conflict','diversity','challenge','struggle'], element:'Fire', planet:null },
  { id:27, name:'Six of Wands', arcana:'Minor', suit:'Wands', number:6, uprightMeaning:'Victory, success, recognition, public acclaim. Ride high on the horse of triumph.', reversedMeaning:'Fall from grace, lack of recognition, ego inflation.', keywords:['victory','recognition','success','triumph','pride'], element:'Fire', planet:null },
  { id:28, name:'Seven of Wands', arcana:'Minor', suit:'Wands', number:7, uprightMeaning:'Defensiveness, perseverance, standing your ground. Hold the line against opposition.', reversedMeaning:'Giving up, overwhelmed, exhaustion, yielding.', keywords:['defense','perseverance','challenge','courage','standing ground'], element:'Fire', planet:null },
  { id:29, name:'Eight of Wands', arcana:'Minor', suit:'Wands', number:8, uprightMeaning:'Swift action, movement, travel, rapid progress. Things move quickly now.', reversedMeaning:'Delays, frustration, slow progress, holding back.', keywords:['speed','action','movement','travel','progress'], element:'Fire', planet:null },
  { id:30, name:'Nine of Wands', arcana:'Minor', suit:'Wands', number:9, uprightMeaning:'Resilience, courage, persistence, last stand. You are weary but nearly there.', reversedMeaning:'Exhaustion, paranoia, giving up, stubbornness.', keywords:['resilience','persistence','endurance','boundaries','courage'], element:'Fire', planet:null },
  { id:31, name:'Ten of Wands', arcana:'Minor', suit:'Wands', number:10, uprightMeaning:'Burden, responsibility, hard work, stress. You carry too much.', reversedMeaning:'Release, delegation, letting go, burnout.', keywords:['burden','responsibility','stress','hard work','overwhelm'], element:'Fire', planet:null },
  { id:32, name:'Page of Wands', arcana:'Minor', suit:'Wands', number:11, uprightMeaning:'Enthusiasm, exploration, free spirit, discovery. A messenger brings exciting news.', reversedMeaning:'Lack of direction, procrastination, setbacks, immaturity.', keywords:['enthusiasm','exploration','discovery','news','adventure'], element:'Fire', planet:null },
  { id:33, name:'Knight of Wands', arcana:'Minor', suit:'Wands', number:12, uprightMeaning:'Passion, adventure, impulsiveness, energy. Charge forward with fiery determination.', reversedMeaning:'Recklessness, haste, scattered energy, delays.', keywords:['passion','adventure','boldness','energy','impulse'], element:'Fire', planet:null },
  { id:34, name:'Queen of Wands', arcana:'Minor', suit:'Wands', number:13, uprightMeaning:'Confidence, warmth, determination, independence. Radiate charismatic power.', reversedMeaning:'Self-doubt, jealousy, insecurity, demanding.', keywords:['confidence','warmth','charisma','independence','determination'], element:'Fire', planet:null },
  { id:35, name:'King of Wands', arcana:'Minor', suit:'Wands', number:14, uprightMeaning:'Leadership, vision, entrepreneurship, bold action. Lead others toward a bold vision.', reversedMeaning:'Tyranny, impulsiveness, unrealistic expectations, domineering.', keywords:['leadership','vision','boldness','authority','entrepreneurship'], element:'Fire', planet:null },

  // ═══ CUPS (Water) ═══
  { id:36, name:'Ace of Cups', arcana:'Minor', suit:'Cups', number:1, uprightMeaning:'New love, emotional beginning, compassion, overflow. The cup overflows with new emotion.', reversedMeaning:'Emotional emptiness, blocked feelings, repressed emotion.', keywords:['love','emotion','compassion','new beginning','overflow'], element:'Water', planet:null },
  { id:37, name:'Two of Cups', arcana:'Minor', suit:'Cups', number:2, uprightMeaning:'Partnership, mutual attraction, connection, unity. Two souls recognize each other.', reversedMeaning:'Imbalance, broken relationship, tension, miscommunication.', keywords:['partnership','connection','unity','attraction','harmony'], element:'Water', planet:null },
  { id:38, name:'Three of Cups', arcana:'Minor', suit:'Cups', number:3, uprightMeaning:'Celebration, friendship, community, collaboration. Raise your cup with those who share your joy.', reversedMeaning:'Excess, gossip, isolation, overindulgence.', keywords:['celebration','friendship','community','joy','collaboration'], element:'Water', planet:null },
  { id:39, name:'Four of Cups', arcana:'Minor', suit:'Cups', number:4, uprightMeaning:'Contemplation, apathy, reevaluation, discontent. Look again at what is being offered.', reversedMeaning:'Renewed motivation, awareness, gratitude, acceptance.', keywords:['contemplation','apathy','discontent','reevaluation','boredom'], element:'Water', planet:null },
  { id:40, name:'Five of Cups', arcana:'Minor', suit:'Cups', number:5, uprightMeaning:'Loss, grief, regret, disappointment. Three cups have fallen but two remain.', reversedMeaning:'Acceptance, moving on, forgiveness, finding peace.', keywords:['loss','grief','regret','disappointment','mourning'], element:'Water', planet:null },
  { id:41, name:'Six of Cups', arcana:'Minor', suit:'Cups', number:6, uprightMeaning:'Nostalgia, childhood memories, innocence, reunion. The past reaches forward to touch the present.', reversedMeaning:'Living in the past, unrealistic expectations, moving forward.', keywords:['nostalgia','memories','innocence','reunion','past'], element:'Water', planet:null },
  { id:42, name:'Seven of Cups', arcana:'Minor', suit:'Cups', number:7, uprightMeaning:'Choices, fantasy, imagination, wishful thinking. Many visions shimmer before you.', reversedMeaning:'Clarity, decisive action, realistic goals, focus.', keywords:['choices','fantasy','illusion','imagination','dreams'], element:'Water', planet:null },
  { id:43, name:'Eight of Cups', arcana:'Minor', suit:'Cups', number:8, uprightMeaning:'Walking away, seeking deeper meaning, disillusionment. Walk toward deeper waters.', reversedMeaning:'Fear of change, stagnation, aimless drifting, avoidance.', keywords:['departure','seeking','walking away','disillusionment','journey'], element:'Water', planet:null },
  { id:44, name:'Nine of Cups', arcana:'Minor', suit:'Cups', number:9, uprightMeaning:'Contentment, satisfaction, gratitude, wish fulfilled. The wish card — your heart is full.', reversedMeaning:'Greed, dissatisfaction, ungratefulness, materialism.', keywords:['contentment','satisfaction','wishes','gratitude','fulfillment'], element:'Water', planet:null },
  { id:45, name:'Ten of Cups', arcana:'Minor', suit:'Cups', number:10, uprightMeaning:'Harmony, family, emotional fulfillment, lasting love. The rainbow of happiness arches over you.', reversedMeaning:'Broken home, disharmony, misaligned values, shattered dreams.', keywords:['harmony','family','fulfillment','love','happiness'], element:'Water', planet:null },
  { id:46, name:'Page of Cups', arcana:'Minor', suit:'Cups', number:11, uprightMeaning:'Creative messages, emotional maturity, intuition, surprise. A young messenger brings emotional news.', reversedMeaning:'Emotional immaturity, creative blocks, escapism.', keywords:['messages','creativity','intuition','surprise','emotion'], element:'Water', planet:null },
  { id:47, name:'Knight of Cups', arcana:'Minor', suit:'Cups', number:12, uprightMeaning:'Romance, charm, imagination, following the heart. The Knight rides with cup held high.', reversedMeaning:'Moodiness, unrealistic expectations, jealousy, deception.', keywords:['romance','charm','idealism','emotion','pursuit'], element:'Water', planet:null },
  { id:48, name:'Queen of Cups', arcana:'Minor', suit:'Cups', number:13, uprightMeaning:'Compassion, intuition, emotional security, nurturing. Trust your emotional wisdom.', reversedMeaning:'Emotional instability, codependency, overwhelm, insecurity.', keywords:['compassion','intuition','nurturing','emotional wisdom','caring'], element:'Water', planet:null },
  { id:49, name:'King of Cups', arcana:'Minor', suit:'Cups', number:14, uprightMeaning:'Emotional balance, diplomacy, calm authority, wisdom. Master your emotions without suppressing them.', reversedMeaning:'Emotional manipulation, volatility, coldness, instability.', keywords:['balance','diplomacy','authority','wisdom','calm'], element:'Water', planet:null },

  // ═══ SWORDS (Air) ═══
  { id:50, name:'Ace of Swords', arcana:'Minor', suit:'Swords', number:1, uprightMeaning:'Clarity, breakthrough, truth, new idea. The sword pierces through confusion.', reversedMeaning:'Confusion, miscommunication, clouded judgment, chaos.', keywords:['clarity','truth','breakthrough','idea','justice'], element:'Air', planet:null },
  { id:51, name:'Two of Swords', arcana:'Minor', suit:'Swords', number:2, uprightMeaning:'Indecision, stalemate, avoidance, difficult choice. Two truths compete.', reversedMeaning:'Information revealed, decision made, confusion clearing.', keywords:['indecision','stalemate','choice','avoidance','deadlock'], element:'Air', planet:null },
  { id:52, name:'Three of Swords', arcana:'Minor', suit:'Swords', number:3, uprightMeaning:'Heartbreak, grief, painful truth, sorrow. Allow the grief to flow so healing can begin.', reversedMeaning:'Recovery, forgiveness, releasing pain, moving on.', keywords:['heartbreak','grief','pain','sorrow','truth'], element:'Air', planet:null },
  { id:53, name:'Four of Swords', arcana:'Minor', suit:'Swords', number:4, uprightMeaning:'Rest, recovery, contemplation, retreat. Take time to heal and gather strength.', reversedMeaning:'Restlessness, burnout, stagnation, forced rest.', keywords:['rest','recovery','contemplation','retreat','healing'], element:'Air', planet:null },
  { id:54, name:'Five of Swords', arcana:'Minor', suit:'Swords', number:5, uprightMeaning:'Conflict, defeat, hollow victory, betrayal. Victory at a terrible cost.', reversedMeaning:'Reconciliation, making amends, moving past conflict.', keywords:['conflict','defeat','betrayal','dishonor','loss'], element:'Air', planet:null },
  { id:55, name:'Six of Swords', arcana:'Minor', suit:'Swords', number:6, uprightMeaning:'Transition, moving on, leaving behind, journey. Cross troubled waters toward calmer shores.', reversedMeaning:'Stuck, resistance to change, unresolved issues.', keywords:['transition','moving on','journey','departure','progress'], element:'Air', planet:null },
  { id:56, name:'Seven of Swords', arcana:'Minor', suit:'Swords', number:7, uprightMeaning:'Deception, trickery, tactics, strategy. Something is not as it seems — be vigilant.', reversedMeaning:'Confession, conscience, regret, truth coming out.', keywords:['deception','strategy','stealth','trickery','cunning'], element:'Air', planet:null },
  { id:57, name:'Eight of Swords', arcana:'Minor', suit:'Swords', number:8, uprightMeaning:'Restriction, self-imposed prison, helplessness, negative thoughts. The bonds are mostly in your mind.', reversedMeaning:'Open to new perspectives, freedom, self-belief, release.', keywords:['restriction','prison','helplessness','negative thoughts','trapped'], element:'Air', planet:null },
  { id:58, name:'Nine of Swords', arcana:'Minor', suit:'Swords', number:9, uprightMeaning:'Anxiety, nightmares, worry, despair. The darkest hour is before dawn — reach out for support.', reversedMeaning:'Hope emerging, relief, recovery from anxiety, sharing burdens.', keywords:['anxiety','nightmares','worry','despair','fear'], element:'Air', planet:null },
  { id:59, name:'Ten of Swords', arcana:'Minor', suit:'Swords', number:10, uprightMeaning:'Rock bottom, betrayal, painful ending, victim mentality. The worst has happened — now you can only rise.', reversedMeaning:'Recovery, regeneration, resisting the inevitable, survival.', keywords:['ending','betrayal','rock bottom','defeat','transformation'], element:'Air', planet:null },
  { id:60, name:'Page of Swords', arcana:'Minor', suit:'Swords', number:11, uprightMeaning:'Curiosity, vigilance, new ideas, mental agility. A sharp young mind seeks truth.', reversedMeaning:'Gossip, lack of planning, haste, deception.', keywords:['curiosity','vigilance','ideas','communication','youth'], element:'Air', planet:null },
  { id:61, name:'Knight of Swords', arcana:'Minor', suit:'Swords', number:12, uprightMeaning:'Ambition, drive, haste, determination. Charge forward with focused intellectual power.', reversedMeaning:'Impulsiveness, burnout, scattered energy, rudeness.', keywords:['ambition','drive','action','determination','intellect'], element:'Air', planet:null },
  { id:62, name:'Queen of Swords', arcana:'Minor', suit:'Swords', number:13, uprightMeaning:'Clear thinking, independence, direct communication, experience. See through illusion with sharp clarity.', reversedMeaning:'Cold-hearted, bitter, overly critical, unforgiving.', keywords:['clarity','independence','honesty','experience','perception'], element:'Air', planet:null },
  { id:63, name:'King of Swords', arcana:'Minor', suit:'Swords', number:14, uprightMeaning:'Authority, intellectual power, truth, ethical leadership. Rule with wisdom and clear judgment.', reversedMeaning:'Misuse of power, manipulation, tyranny, cruelty.', keywords:['authority','truth','intellect','ethics','judgment'], element:'Air', planet:null },

  // ═══ PENTACLES (Earth) ═══
  { id:64, name:'Ace of Pentacles', arcana:'Minor', suit:'Pentacles', number:1, uprightMeaning:'New financial or career opportunity, prosperity, manifestation. A seed of material abundance is planted.', reversedMeaning:'Lost opportunity, lack of planning, scarcity mindset, bad investment.', keywords:['opportunity','prosperity','manifestation','abundance','beginning'], element:'Earth', planet:null },
  { id:65, name:'Two of Pentacles', arcana:'Minor', suit:'Pentacles', number:2, uprightMeaning:'Balance, adaptability, time management, juggling priorities. Stay flexible as demands multiply.', reversedMeaning:'Overwhelm, imbalance, financial disorganization, too much on your plate.', keywords:['balance','adaptability','juggling','priorities','flexibility'], element:'Earth', planet:null },
  { id:66, name:'Three of Pentacles', arcana:'Minor', suit:'Pentacles', number:3, uprightMeaning:'Teamwork, collaboration, learning, skill development. Build together — mastery comes through practice.', reversedMeaning:'Lack of teamwork, poor quality, competition, disharmony in the workplace.', keywords:['teamwork','collaboration','learning','skill','craftsmanship'], element:'Earth', planet:null },
  { id:67, name:'Four of Pentacles', arcana:'Minor', suit:'Pentacles', number:4, uprightMeaning:'Security, control, possessiveness, saving money. Guard what you have built but do not grip too tightly.', reversedMeaning:'Generosity, giving, letting go, financial insecurity, overspending.', keywords:['security','control','possessiveness','saving','stability'], element:'Earth', planet:null },
  { id:68, name:'Five of Pentacles', arcana:'Minor', suit:'Pentacles', number:5, uprightMeaning:'Hardship, loss, isolation, worry. You feel left out in the cold — but help is nearby if you look up.', reversedMeaning:'Recovery, spiritual growth, end of hardship, renewed faith.', keywords:['hardship','loss','isolation','worry','poverty'], element:'Earth', planet:null },
  { id:69, name:'Six of Pentacles', arcana:'Minor', suit:'Pentacles', number:6, uprightMeaning:'Generosity, charity, giving and receiving, sharing wealth. The flow of abundance benefits all.', reversedMeaning:'Self-care debts, strings attached, power dynamics in giving.', keywords:['generosity','charity','giving','sharing','exchange'], element:'Earth', planet:null },
  { id:70, name:'Seven of Pentacles', arcana:'Minor', suit:'Pentacles', number:7, uprightMeaning:'Patience, investment, long-term view, perseverance. The seeds you planted are growing — trust the process.', reversedMeaning:'Impatience, wasted effort, poor returns, lack of long-term vision.', keywords:['patience','investment','growth','perseverance','assessment'], element:'Earth', planet:null },
  { id:71, name:'Eight of Pentacles', arcana:'Minor', suit:'Pentacles', number:8, uprightMeaning:'Apprenticeship, dedication, skill development, mastery. Devote yourself to your craft with focused attention.', reversedMeaning:'Lack of focus, perfectionism, misdirected energy, boredom with routine.', keywords:['dedication','skill','mastery','apprenticeship','focus'], element:'Earth', planet:null },
  { id:72, name:'Nine of Pentacles', arcana:'Minor', suit:'Pentacles', number:9, uprightMeaning:'Abundance, luxury, self-sufficiency, financial independence. Enjoy the fruits of your labor.', reversedMeaning:'Financial dependence, superficiality, overinvestment in material comfort.', keywords:['abundance','luxury','self-sufficiency','independence','achievement'], element:'Earth', planet:null },
  { id:73, name:'Ten of Pentacles', arcana:'Minor', suit:'Pentacles', number:10, uprightMeaning:'Legacy, wealth, family, long-term success, inheritance. Build something that endures beyond you.', reversedMeaning:'Family disputes, financial failure, loss of legacy, instability.', keywords:['legacy','wealth','family','tradition','endurance'], element:'Earth', planet:null },
  { id:74, name:'Page of Pentacles', arcana:'Minor', suit:'Pentacles', number:11, uprightMeaning:'New venture, ambition, opportunity, study. A young scholar or new career path opens before you.', reversedMeaning:'Lack of progress, procrastination, missed opportunities, laziness.', keywords:['ambition','study','opportunity','diligence','new venture'], element:'Earth', planet:null },
  { id:75, name:'Knight of Pentacles', arcana:'Minor', suit:'Pentacles', number:12, uprightMeaning:'Hard work, responsibility, routine, dependability. Steady progress through consistent effort.', reversedMeaning:'Stagnation, boredom, obsessive work ethic, laziness, stubbornness.', keywords:['hard work','responsibility','routine','dependability','effort'], element:'Earth', planet:null },
  { id:76, name:'Queen of Pentacles', arcana:'Minor', suit:'Pentacles', number:13, uprightMeaning:'Nurturing, practical, providing, down-to-earth, security. Create a warm and abundant home.', reversedMeaning:'Neglect of self, codependency, work-life imbalance, smothering.', keywords:['nurturing','practical','providing','security','abundance'], element:'Earth', planet:null },
  { id:77, name:'King of Pentacles', arcana:'Minor', suit:'Pentacles', number:14, uprightMeaning:'Wealth, business acumen, security, discipline, abundance. The master of material success leads by example.', reversedMeaning:'Materialism, greed, corruption, financial recklessness, stubbornness.', keywords:['wealth','business','security','discipline','leadership'], element:'Earth', planet:null }
];

const SPREAD_TYPES = {
  single: {
    name: 'Single Card',
    count: 1,
    positions: ['Message']
  },
  threeCard: {
    name: 'Past / Present / Future',
    count: 3,
    positions: ['Past', 'Present', 'Future']
  },
  relationship: {
    name: 'Relationship',
    count: 5,
    positions: ['You', 'Your Partner', 'The Connection', 'The Challenge', 'The Outcome']
  },
  celticCross: {
    name: 'Celtic Cross',
    count: 10,
    positions: ['Present Situation', 'Challenge', 'Foundation', 'Recent Past', 'Crown / Best Outcome', 'Near Future', 'Your Attitude', 'Environment', 'Hopes & Fears', 'Final Outcome']
  }
};

const READING_TEMPLATES = {
  opening: [
    'The cards have been cast, and their whispers reveal the currents of your path.',
    'The ancient symbols align to illuminate what lies before you.',
    'In this moment, the veil between knowing and mystery thins, and the cards speak.',
    'The energies converge upon this reading, offering guidance from the deeper self.',
    'What the cards reveal now is what the universe urges you to understand.'
  ],
  positionIntros: {
    'Message': 'The single card drawn speaks directly to your core:',
    'Past': 'From the realm of what has been, the past position reveals:',
    'Present': 'In the living now, the present card shows:',
    'Future': 'The threads of what approaches crystallize as:',
    'You': 'Your own energy and position are reflected in:',
    'Your Partner': 'The other soul in this dance is represented by:',
    'The Connection': 'The nature of your bond together manifests as:',
    'The Challenge': 'The obstacle or tension you face appears as:',
    'The Outcome': 'What awaits at the convergence of these forces is revealed through:',
    'Present Situation': 'At the heart of the matter, the present situation is:',
    'Challenge': 'Crossing you, the immediate challenge or obstacle is:',
    'Foundation': 'Beneath everything, the deep foundation of this situation is:',
    'Recent Past': 'Fading behind you, the influence of the recent past is:',
    'Crown / Best Outcome': 'Above you, the best possible outcome crowns this reading as:',
    'Near Future': 'Approaching swiftly, what comes in the near future is:',
    'Your Attitude': 'Your inner stance and attitude toward this situation is reflected in:',
    'Environment': 'The external forces and influences surrounding you manifest as:',
    'Hopes & Fears': 'What you most deeply hope for — or fear — reveals itself through:',
    'Final Outcome': 'The final culmination of all these forces crystallizes as:'
  },
  transitions: [
    'Furthermore,', 'In addition,', 'Building upon this,',
    'The cards deepen this message:', 'The pattern continues as',
    'Woven through the reading,', 'The next layer reveals:',
    'Adding nuance to this picture,', 'The story unfolds further:'
  ],
  closing: [
    'Remember that the cards illuminate possibilities, not certainties. Your free will shapes the final outcome.',
    'The symbols have spoken. What you do with this wisdom is the most powerful card of all.',
    'Let these insights settle within you. The deepest truths reveal themselves in stillness.',
    'The reading is complete, but the journey continues. Walk forward with eyes open and heart steady.',
    'These cards are a mirror, not a map. The territory is yours to navigate.'
  ]
};

class TarotApp {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.currentSpread = 'single';
    this.currentCards = [];
    this.currentReading = null;
    this.question = '';
    this.isFlipping = false;
    this._styleEl = null;
  }

  render() {
    this._injectStyles();
    this.element = document.createElement('div');
    this.element.className = 'tarot-app';
    this.element.innerHTML = `
      <div class="tarot-header">
        <h1 class="tarot-title">✦ Tarot Reader ✦</h1>
        <p class="tarot-subtitle">Peer beyond the veil — the cards speak truth to those who listen</p>
      </div>
      <div class="tarot-controls">
        <div class="tarot-question-row">
          <input type="text" class="tarot-question-input" placeholder="What question stirs within you?" />
        </div>
        <div class="tarot-spread-buttons">
          <button class="tarot-spread-btn active" data-spread="single">✧ Single Card</button>
          <button class="tarot-spread-btn" data-spread="threeCard">⌖ Past / Present / Future</button>
          <button class="tarot-spread-btn" data-spread="relationship">♡ Relationship</button>
          <button class="tarot-spread-btn" data-spread="celticCross">✶ Celtic Cross</button>
        </div>
        <div class="tarot-action-row">
          <button class="tarot-draw-btn">🔮 Draw Cards</button>
          <button class="tarot-daily-btn">☀ Daily Card</button>
          <button class="tarot-history-btn">📜 History</button>
        </div>
      </div>
      <div class="tarot-spread-area">
        <div class="tarot-cards-container"></div>
      </div>
      <div class="tarot-reading-area">
        <div class="tarot-reading-text"></div>
      </div>
      <div class="tarot-history-panel" style="display:none;">
        <div class="tarot-history-header">
          <h2>Reading History</h2>
          <button class="tarot-history-close">✕</button>
        </div>
        <div class="tarot-history-list"></div>
      </div>
    `;
    this.container.appendChild(this.element);
    this._bindEvents();
  }

  destroy() {
    if (this._styleEl && this._styleEl.parentNode) {
      this._styleEl.parentNode.removeChild(this._styleEl);
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  _injectStyles() {
    this._styleEl = document.createElement('style');
    this._styleEl.textContent = `
      .tarot-app {
        width: 100%; height: 100%; overflow-y: auto;
        background: rgba(10,5,15,0.97);
        color: #e0d0e8;
        font-family: 'Georgia', serif;
        padding: 24px;
        box-sizing: border-box;
        position: relative;
      }
      .tarot-header { text-align: center; margin-bottom: 20px; }
      .tarot-title {
        font-size: 28px; color: #ff1493;
        text-shadow: 0 0 20px #ff003c, 0 0 40px #ff003c80;
        margin: 0 0 6px 0; letter-spacing: 3px;
      }
      .tarot-subtitle { color: #a080b0; font-style: italic; font-size: 14px; margin: 0; }
      .tarot-controls {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,20,147,0.15);
        border-radius: 16px; padding: 18px;
        backdrop-filter: blur(12px);
        margin-bottom: 24px;
      }
      .tarot-question-row { margin-bottom: 14px; }
      .tarot-question-input {
        width: 100%; padding: 12px 16px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,20,147,0.25);
        border-radius: 10px; color: #e0d0e8;
        font-size: 15px; font-family: inherit;
        outline: none; box-sizing: border-box;
        transition: border-color 0.3s;
      }
      .tarot-question-input:focus {
        border-color: #ff1493;
        box-shadow: 0 0 12px rgba(255,20,147,0.3);
      }
      .tarot-question-input::placeholder { color: #7a5a8a; font-style: italic; }
      .tarot-spread-buttons {
        display: flex; flex-wrap: wrap; gap: 8px;
        justify-content: center; margin-bottom: 14px;
      }
      .tarot-spread-btn {
        padding: 8px 16px; border-radius: 20px;
        background: rgba(255,20,147,0.08);
        border: 1px solid rgba(255,20,147,0.2);
        color: #c8a0d8; font-size: 13px;
        cursor: pointer; transition: all 0.3s;
        font-family: inherit;
      }
      .tarot-spread-btn:hover {
        background: rgba(255,20,147,0.15);
        border-color: rgba(255,20,147,0.4);
      }
      .tarot-spread-btn.active {
        background: rgba(255,20,147,0.2);
        border-color: #ff1493;
        color: #ff1493;
        box-shadow: 0 0 10px rgba(255,20,147,0.3);
      }
      .tarot-action-row {
        display: flex; gap: 10px; justify-content: center;
      }
      .tarot-draw-btn {
        padding: 10px 28px; border-radius: 24px;
        background: linear-gradient(135deg, #ff003c, #ff1493);
        border: none; color: #fff; font-size: 15px;
        font-weight: bold; cursor: pointer;
        box-shadow: 0 0 20px rgba(255,0,60,0.3);
        transition: all 0.3s; font-family: inherit;
      }
      .tarot-draw-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 25px rgba(255,0,60,0.5);
      }
      .tarot-daily-btn {
        padding: 10px 20px; border-radius: 24px;
        background: rgba(255,200,50,0.1);
        border: 1px solid rgba(255,200,50,0.3);
        color: #ffd700; font-size: 14px;
        cursor: pointer; transition: all 0.3s;
        font-family: inherit;
      }
      .tarot-daily-btn:hover {
        background: rgba(255,200,50,0.2);
        box-shadow: 0 0 12px rgba(255,200,50,0.3);
      }
      .tarot-history-btn {
        padding: 10px 20px; border-radius: 24px;
        background: rgba(150,100,200,0.1);
        border: 1px solid rgba(150,100,200,0.3);
        color: #c8a0d8; font-size: 14px;
        cursor: pointer; transition: all 0.3s;
        font-family: inherit;
      }
      .tarot-history-btn:hover { background: rgba(150,100,200,0.2); }
      .tarot-spread-area { min-height: 200px; margin-bottom: 20px; }
      .tarot-cards-container {
        display: flex; flex-wrap: wrap; justify-content: center;
        gap: 16px; padding: 20px 0;
      }
      .tarot-card-wrapper {
        perspective: 800px; width: 140px; height: 220px;
        cursor: pointer; position: relative;
      }
      .tarot-card-inner {
        width: 100%; height: 100%;
        transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        transform-style: preserve-3d; position: relative;
      }
      .tarot-card-wrapper.flipped .tarot-card-inner {
        transform: rotateY(180deg);
      }
      .tarot-card-wrapper.reversed.flipped .tarot-card-inner {
        transform: rotateY(180deg) rotate(180deg);
      }
      .tarot-card-face {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        backface-visibility: hidden; border-radius: 12px;
        display: flex; flex-direction: column;
        overflow: hidden;
      }
      .tarot-card-back {
        background: linear-gradient(135deg, #1a0a2e, #0d0015);
        border: 2px solid #ff1493;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 15px rgba(255,20,147,0.3), inset 0 0 30px rgba(255,20,147,0.1);
      }
      .tarot-card-back-design {
        width: 80%; height: 80%;
        border: 1px solid rgba(255,20,147,0.4);
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        background: repeating-conic-gradient(
          rgba(255,20,147,0.05) 0deg 10deg,
          transparent 10deg 20deg
        );
        position: relative;
      }
      .tarot-card-back-design::before {
        content: '✦';
        font-size: 36px; color: #ff1493;
        text-shadow: 0 0 20px #ff003c;
        animation: tarot-pulse 3s ease-in-out infinite;
      }
      .tarot-card-back-design::after {
        content: '';
        position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px;
        border: 1px solid rgba(255,20,147,0.2);
        border-radius: 4px;
      }
      @keyframes tarot-pulse {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.1); }
      }
      .tarot-card-front {
        transform: rotateY(180deg);
        background: linear-gradient(180deg, #1a0a2e, #0d0015);
        border: 2px solid #ff1493;
        padding: 10px;
        box-shadow: 0 0 15px rgba(255,20,147,0.3);
        align-items: center; justify-content: center;
        text-align: center;
      }
      .tarot-card-number {
        font-size: 11px; color: #ff1493;
        letter-spacing: 2px; margin-bottom: 4px;
        text-shadow: 0 0 8px rgba(255,20,147,0.5);
      }
      .tarot-card-symbol {
        font-size: 32px; margin: 8px 0;
        text-shadow: 0 0 15px rgba(255,20,147,0.6);
      }
      .tarot-card-name {
        font-size: 11px; color: #e0c0e8;
        font-weight: bold; line-height: 1.3;
        margin-bottom: 6px;
      }
      .tarot-card-keywords {
        font-size: 9px; color: #a080b0;
        font-style: italic; line-height: 1.3;
      }
      .tarot-card-position-label {
        position: absolute; bottom: -24px; left: 0; right: 0;
        text-align: center; font-size: 11px;
        color: #ff1493; font-weight: bold;
        letter-spacing: 1px;
        text-shadow: 0 0 8px rgba(255,20,147,0.4);
      }
      .tarot-reading-area {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,20,147,0.1);
        border-radius: 16px; padding: 24px;
        backdrop-filter: blur(8px);
        min-height: 60px;
        margin-bottom: 20px;
      }
      .tarot-reading-text {
        color: #c8a0d8; font-size: 15px;
        line-height: 1.8; white-space: pre-wrap;
      }
      .tarot-reading-text .reading-card-name {
        color: #ff1493; font-weight: bold;
      }
      .tarot-reading-text .reading-position {
        color: #ffd700; font-style: italic;
      }
      .tarot-history-panel {
        position: fixed; top: 0; right: 0; bottom: 0;
        width: 380px; max-width: 90vw;
        background: rgba(10,5,20,0.98);
        border-left: 1px solid rgba(255,20,147,0.3);
        z-index: 9999; overflow-y: auto;
        padding: 20px;
        box-shadow: -10px 0 40px rgba(0,0,0,0.5);
      }
      .tarot-history-header {
        display: flex; justify-content: space-between;
        align-items: center; margin-bottom: 16px;
      }
      .tarot-history-header h2 {
        color: #ff1493; font-size: 20px; margin: 0;
      }
      .tarot-history-close {
        background: none; border: none;
        color: #ff1493; font-size: 20px;
        cursor: pointer;
      }
      .tarot-history-item {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,20,147,0.1);
        border-radius: 10px; padding: 14px;
        margin-bottom: 12px; cursor: pointer;
        transition: all 0.3s;
      }
      .tarot-history-item:hover {
        border-color: rgba(255,20,147,0.3);
        background: rgba(255,20,147,0.05);
      }
      .tarot-history-date {
        font-size: 11px; color: #7a5a8a;
        margin-bottom: 4px;
      }
      .tarot-history-spread {
        font-size: 13px; color: #ff1493;
        font-weight: bold; margin-bottom: 4px;
      }
      .tarot-history-cards {
        font-size: 12px; color: #a080b0;
      }
      .tarot-history-question {
        font-size: 12px; color: #c8a0d8;
        font-style: italic; margin-top: 4px;
      }
      .tarot-empty-history {
        color: #7a5a8a; font-style: italic;
        text-align: center; padding: 40px 0;
      }
    `;
    document.head.appendChild(this._styleEl);
  }

  _bindEvents() {
    // Spread selection
    this.element.querySelectorAll('.tarot-spread-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.element.querySelectorAll('.tarot-spread-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentSpread = btn.dataset.spread;
      });
    });

    // Draw cards
    this.element.querySelector('.tarot-draw-btn').addEventListener('click', () => this._drawReading());

    // Daily card
    this.element.querySelector('.tarot-daily-btn').addEventListener('click', () => this._dailyCard());

    // History
    this.element.querySelector('.tarot-history-btn').addEventListener('click', () => this._toggleHistory());
    this.element.querySelector('.tarot-history-close').addEventListener('click', () => this._toggleHistory());

    // Question input
    this.element.querySelector('.tarot-question-input').addEventListener('input', (e) => {
      this.question = e.target.value;
    });
  }

  _shuffleDeck() {
    const deck = [...TAROT_DECK];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  _drawCards(count) {
    const shuffled = this._shuffleDeck();
    return shuffled.slice(0, count).map(card => ({
      ...card,
      reversed: Math.random() < 0.3
    }));
  }

  async _drawReading() {
    if (this.isFlipping) return;
    this.isFlipping = true;

    const spread = SPREAD_TYPES[this.currentSpread];
    this.currentCards = this._drawCards(spread.count);
    this.question = this.element.querySelector('.tarot-question-input').value;

    const cardsContainer = this.element.querySelector('.tarot-cards-container');
    cardsContainer.innerHTML = '';

    // Create card elements
    spread.positions.forEach((pos, i) => {
      const card = this.currentCards[i];
      const wrapper = document.createElement('div');
      wrapper.className = 'tarot-card-wrapper' + (card.reversed ? ' reversed' : '');
      wrapper.innerHTML = `
        <div class="tarot-card-inner">
          <div class="tarot-card-face tarot-card-back">
            <div class="tarot-card-back-design"></div>
          </div>
          <div class="tarot-card-face tarot-card-front">
            <div class="tarot-card-number">${card.arcana === 'Major' ? this._toRoman(card.number) : this._toCardNumber(card.number)}</div>
            <div class="tarot-card-symbol">${this._getSuitSymbol(card.suit)}</div>
            <div class="tarot-card-name">${card.name}</div>
            <div class="tarot-card-keywords">${(card.reversed ? card.keywords.slice(0,3).join(', ') : card.keywords.join(', '))}</div>
          </div>
        </div>
        <div class="tarot-card-position-label">${pos}</div>
      `;
      cardsContainer.appendChild(wrapper);
    });

    // Flip cards one by one with delay
    const wrappers = cardsContainer.querySelectorAll('.tarot-card-wrapper');
    for (let i = 0; i < wrappers.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      wrappers[i].classList.add('flipped');
    }

    // Generate reading after all cards flipped
    await new Promise(r => setTimeout(r, 600));
    this._generateReading();
    this.isFlipping = false;
  }

  _dailyCard() {
    if (this.isFlipping) return;
    // Date-seeded daily card
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const idx = seed % TAROT_DECK.length;
    const card = { ...TAROT_DECK[idx], reversed: (seed % 7) < 2 };

    this.currentSpread = 'single';
    this.currentCards = [card];
    this.question = 'Daily guidance for ' + today.toLocaleDateString();

    // Activate single card button
    this.element.querySelectorAll('.tarot-spread-btn').forEach(b => b.classList.remove('active'));
    this.element.querySelector('[data-spread="single"]').classList.add('active');

    const cardsContainer = this.element.querySelector('.tarot-cards-container');
    cardsContainer.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'tarot-card-wrapper' + (card.reversed ? ' reversed' : '');
    wrapper.innerHTML = `
      <div class="tarot-card-inner">
        <div class="tarot-card-face tarot-card-back">
          <div class="tarot-card-back-design"></div>
        </div>
        <div class="tarot-card-face tarot-card-front">
          <div class="tarot-card-number">${card.arcana === 'Major' ? this._toRoman(card.number) : this._toCardNumber(card.number)}</div>
          <div class="tarot-card-symbol">${this._getSuitSymbol(card.suit)}</div>
          <div class="tarot-card-name">${card.name}</div>
          <div class="tarot-card-keywords">${card.keywords.join(', ')}</div>
        </div>
      </div>
      <div class="tarot-card-position-label">Daily Card</div>
    `;
    cardsContainer.appendChild(wrapper);

    setTimeout(() => {
      wrapper.classList.add('flipped');
      setTimeout(() => this._generateReading(), 900);
    }, 300);
  }

  _generateReading() {
    const spread = SPREAD_TYPES[this.currentSpread];
    const readingArea = this.element.querySelector('.tarot-reading-text');
    let text = '';

    // Opening
    text += READING_TEMPLATES.opening[Math.floor(Math.random() * READING_TEMPLATES.opening.length)] + '\n\n';

    // Question reference
    if (this.question) {
      text += `Your question — "${this.question}" — resonates through the spread.\n\n`;
    }

    // Each card
    this.currentCards.forEach((card, i) => {
      const position = spread.positions[i];
      const intro = READING_TEMPLATES.positionIntros[position] || `In the position of ${position}:`;
      const meaning = card.reversed ? card.reversedMeaning : card.uprightMeaning;
      const revLabel = card.reversed ? ' (Reversed)' : '';

      text += `${intro}\n`;
      text += `✦ ${card.name}${revLabel}\n`;
      text += `${meaning}\n`;

      if (card.keywords.length > 0) {
        text += `Keywords: ${card.keywords.join(', ')}\n`;
      }
      if (card.element) {
        text += `Element: ${card.element}`;
        if (card.planet) text += ` | Planet: ${card.planet}`;
        text += '\n';
      }
      text += '\n';
    });

    // Closing
    text += READING_TEMPLATES.closing[Math.floor(Math.random() * READING_TEMPLATES.closing.length)];

    // Typewriter effect
    this._typewriterEffect(readingArea, text);

    // Save reading
    this._saveReading({
      date: new Date().toISOString(),
      spread: this.currentSpread,
      spreadName: spread.name,
      question: this.question,
      cards: this.currentCards.map((c, i) => ({
        name: c.name,
        reversed: c.reversed,
        position: spread.positions[i]
      }))
    });
  }

  async _typewriterEffect(element, text) {
    element.textContent = '';
    element.style.whiteSpace = 'pre-wrap';
    for (let i = 0; i < text.length; i++) {
      element.textContent += text[i];
      if (i % 3 === 0) {
        element.scrollTop = element.scrollHeight;
        await new Promise(r => setTimeout(r, 12));
      }
    }
  }

  _saveReading(reading) {
    try {
      const history = JSON.parse(localStorage.getItem('nexus_tarot_history') || '[]');
      history.unshift(reading);
      if (history.length > 50) history.length = 50;
      localStorage.setItem('nexus_tarot_history', JSON.stringify(history));
    } catch (e) { /* ignore */ }
  }

  _toggleHistory() {
    const panel = this.element.querySelector('.tarot-history-panel');
    const isVisible = panel.style.display !== 'none';
    panel.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) this._loadHistory();
  }

  _loadHistory() {
    const list = this.element.querySelector('.tarot-history-list');
    try {
      const history = JSON.parse(localStorage.getItem('nexus_tarot_history') || '[]');
      if (history.length === 0) {
        list.innerHTML = '<p class="tarot-empty-history">No readings yet. Draw your first cards above.</p>';
        return;
      }
      list.innerHTML = history.map(h => {
        const date = new Date(h.date).toLocaleString();
        const cards = h.cards.map(c => `${c.name}${c.reversed ? ' (R)' : ''}`).join(', ');
        return `
          <div class="tarot-history-item">
            <div class="tarot-history-date">${date}</div>
            <div class="tarot-history-spread">${h.spreadName}</div>
            <div class="tarot-history-cards">${cards}</div>
            ${h.question ? `<div class="tarot-history-question">"${h.question}"</div>` : ''}
          </div>
        `;
      }).join('');
    } catch (e) {
      list.innerHTML = '<p class="tarot-empty-history">Could not load history.</p>';
    }
  }

  _getSuitSymbol(suit) {
    const symbols = { Wands: '🜂', Cups: '🜄', Swords: '🜁', Pentacles: '🜃' };
    return (suit && symbols[suit]) || '✦';
  }

  _toRoman(num) {
    const roman = ['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];
    return roman[num] || String(num);
  }

  _toCardNumber(num) {
    if (num === 1) return 'ACE';
    if (num === 11) return 'PAGE';
    if (num === 12) return 'KNIGHT';
    if (num === 13) return 'QUEEN';
    if (num === 14) return 'KING';
    return String(num);
  }
}

window.TarotApp = TarotApp;
