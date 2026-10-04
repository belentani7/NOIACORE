'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Jungian Archetype Interpreter
 *  Complete 12-archetype assessment with radar chart, scoring, and compatibility.
 * ═══════════════════════════════════════════════════════════════
 */

const ARCHETYPES = {
  Hero: {
    description: 'The Hero archetype embodies the drive to prove one\'s worth through courageous action. Heroes are motivated by the desire to make the world better and to overcome adversity through strength, skill, and determination. They fear weakness and vulnerability above all else, and their greatest gift is the courage to face what others cannot. The Hero\'s journey is one of trials and triumphs — each obstacle conquered reveals a deeper layer of strength. Heroes are natural leaders in crisis, inspiring others through example rather than words. They transform chaos into order through sheer will. However, the shadow of the Hero is arrogance, a tendency to see every problem as a battle to be won and every person as either ally or obstacle.',
    shadow: 'Arrogance, need for constant validation through victory, inability to show vulnerability, seeing enemies everywhere',
    gift: 'Courage, determination, ability to inspire others, resilience in the face of adversity',
    fear: 'Weakness, vulnerability, being overwhelmed, inadequacy',
    desire: 'To prove worth through brave and difficult action, to improve the world',
    strategy: 'Develop competence, face challenges head-on, protect the vulnerable',
    famous: ['Hercules', 'Joan of Arc', 'Wonder Woman', 'Luke Skywalker', 'Malala Yousafzai'],
    symbol: '⚔'
  },
  Sage: {
    description: 'The Sage archetype embodies the pursuit of truth and understanding. Sages are driven by an insatiable curiosity and the belief that knowledge is the path to freedom. They fear being misled, ignorant, or deceived, and their greatest gift is the ability to analyze complex situations and distill them into wisdom. Sages are the scholars, philosophers, and seekers of every age — they turn information into insight and chaos into comprehension. Their gift to the world is clarity of thought and the courage to question assumptions. The shadow of the Sage is intellectual detachment — becoming so absorbed in understanding life that one forgets to live it.',
    shadow: 'Over-analysis, intellectual arrogance, detachment from emotion, inability to act without complete information',
    gift: 'Wisdom, analytical ability, objectivity, depth of understanding',
    fear: 'Ignorance, being misled, deception, superficiality',
    desire: 'To understand the world through intelligence and analysis, to find truth',
    strategy: 'Seek knowledge, think critically, share insights, question everything',
    famous: ['Socrates', 'Marie Curie', 'Einstein', 'Sherlock Holmes', 'Carl Jung'],
    symbol: '📖'
  },
  Explorer: {
    description: 'The Explorer archetype embodies the drive for freedom and authentic experience through seeking. Explorers are motivated by the desire to discover the world and themselves through journeying into the unknown. They fear being trapped, conforming, and inner emptiness, and their greatest gift is the ability to remain true to themselves while constantly expanding their horizons. The Explorer walks paths others only dream of — not out of restlessness but out of a deep knowing that truth is found at the edges of the known world. They are the pioneers, the wanderers, the ones who look at a horizon and feel called to cross it. The shadow of the Explorer is aimless wandering — moving constantly but never arriving, fleeing from intimacy and commitment.',
    shadow: 'Aimless wandering, inability to commit, fleeing from self, superficial experience',
    gift: 'Authenticity, independence, pioneering spirit, ability to find freedom within',
    fear: 'Being trapped, conformity, inner emptiness, stagnation',
    desire: 'To experience a better, more authentic life through exploring the world',
    strategy: 'Journey outward to find inward truth, seek new experiences, avoid conformity',
    famous: ['Marco Polo', 'Amelia Earhart', 'Indiana Jones', 'Anthony Bourdain', 'Bear Grylls'],
    symbol: '🧭'
  },
  Creator: {
    description: 'The Creator archetype embodies the impulse to bring something new into existence — to manifest vision into reality through imagination and skill. Creators are driven by the desire to make things of enduring value and to express their unique vision. They fear mediocrity and the absence of creative expression, and their greatest gift is the ability to transform raw material — whether paint, sound, words, or ideas — into works that move and change the world. The Creator sees possibilities where others see limitations, beauty where others see chaos. Every work of art, every innovation, every act of making is the Creator breathing life into the void. The shadow of the Creator is perfectionism and self-absorption — becoming so attached to the vision that the process becomes torture rather than joy.',
    shadow: 'Perfectionism, self-absorption, dramatic mood swings tied to creative output, neglect of practical life',
    gift: 'Imagination, artistic vision, ability to create lasting works, originality',
    fear: 'Mediocrity, creative blocks, lack of vision, being derivative',
    desire: 'To create things of enduring value and express unique vision',
    strategy: 'Develop craft, cultivate imagination, persist through creative resistance',
    famous: ['Leonardo da Vinci', 'Frida Kahlo', 'Steve Jobs', 'Hayao Miyazaki', 'Prince'],
    symbol: '🎨'
  },
  Caregiver: {
    description: 'The Caregiver archetype embodies compassion, generosity, and the desire to protect and care for others. Caregivers are motivated by genuine empathy and the belief that helping others is life\'s highest purpose. They fear selfishness, ingratitude, and the inability to protect those they love, and their greatest gift is the capacity for selfless love and nurturing. The Caregiver is the heart of every community — the one who notices when someone is hurting, who provides comfort without being asked, who creates safe spaces where vulnerability is welcome. Their presence transforms environments from competitive to cooperative, from cold to warm. The shadow of the Caregiver is martyrdom — giving until there is nothing left, using caretaking to control, or losing oneself entirely in the service of others.',
    shadow: 'Martyrdom, codependency, controlling through care, neglect of self, resentment',
    gift: 'Compassion, generosity, nurturing, ability to create safety and healing',
    fear: 'Selfishness, ingratitude, harm coming to those they love',
    desire: 'To protect and care for others, to alleviate suffering',
    strategy: 'Serve others, show compassion, create nurturing environments',
    famous: ['Mother Teresa', 'Princess Diana', 'Florence Nightingale', 'Samwise Gamgee', 'Mr. Rogers'],
    symbol: '♡'
  },
  Ruler: {
    description: 'The Ruler archetype embodies the drive to create order from chaos through leadership and responsibility. Rulers are motivated by the desire to build thriving communities and systems that endure. They fear chaos, being overthrown, and powerlessness, and their greatest gift is the ability to take responsibility and create prosperity through wise governance. The Ruler understands that true power is not domination but stewardship — the ability to hold space for collective flourishing. They create structures, establish order, and bear the weight of decisions that affect many. Every great institution, every lasting organization, every well-governed community bears the Ruler\'s mark. The shadow of the Ruler is tyranny and the corruption that comes with unchecked power.',
    shadow: 'Tyranny, rigidity, inability to delegate, corruption through power, authoritarianism',
    gift: 'Leadership, responsibility, ability to create order, systemic thinking',
    fear: 'Chaos, being overthrown, powerlessness, disorder',
    desire: 'To create prosperous, ordered communities through responsible leadership',
    strategy: 'Take responsibility, create systems and structure, lead by example',
    famous: ['Queen Elizabeth I', 'Marcus Aurelius', 'Nelson Mandela', 'Aragorn', 'Sheryl Sandberg'],
    symbol: '♛'
  },
  Magician: {
    description: 'The Magician archetype embodies the understanding of fundamental laws and the ability to transform reality through that understanding. Magicians are driven by the desire to make visions into reality and to understand the hidden mechanics of the universe. They fear negative consequences and the misuse of power, and their greatest gift is the ability to catalyze transformation — to see the latent potential in people and situations and activate it. The Magician is the bridge between the visible and invisible worlds, the one who understands that consciousness itself is a creative force. They are the alchemists, the healers, the visionaries who understand that transformation begins with a shift in perception. The shadow of the Magician is manipulation and the seduction of power — using understanding to control rather than liberate.',
    shadow: 'Manipulation, grandiosity, playing god, using knowledge to control others',
    gift: 'Transformation, understanding universal laws, catalyzing change, visionary thinking',
    fear: 'Negative consequences, unintended harm, misuse of power',
    desire: 'To understand fundamental laws and transform reality through that understanding',
    strategy: 'Study universal laws, align intention with action, catalyze transformation',
    famous: ['Merlin', 'Nikola Tesla', 'Gandalf', 'Carl Jung', 'Steve Jobs'],
    symbol: '✧'
  },
  Lover: {
    description: 'The Lover archetype embodies the desire for intimacy, connection, and the experience of beauty in all its forms. Lovers are motivated by the deep need to be in relationship — with people, work, environments, and the sensory richness of life. They fear being alone, unwanted, and unloved, and their greatest gift is the ability to create and sustain deep bonds of appreciation and devotion. The Lover does not merely seek romantic love but a passionate engagement with life itself — the rapture of beauty, the ecstasy of connection, the warmth of genuine intimacy. They bring aesthetics, sensuality, and emotional depth to everything they touch. The shadow of the Lover is obsession and the loss of self in the beloved — love that smothers rather than liberates.',
    shadow: 'Obsession, jealousy, loss of identity in relationships, superficiality disguised as passion',
    gift: 'Passion, devotion, aesthetic appreciation, ability to create deep intimacy',
    fear: 'Being alone, unwanted, unloved, loss of connection',
    desire: 'To experience intimacy, create beauty, and be in loving relationship',
    strategy: 'Surround with beauty, cultivate deep relationships, express devotion',
    famous: ['Cleopatra', 'Romeo & Juliet', 'Shah Rukh Khan', 'Aphrodite', 'Frida Kahlo'],
    symbol: '❤'
  },
  Jester: {
    description: 'The Jester archetype embodies the principle of joy, play, and the liberating power of humor. Jesters are driven by the desire to live in the moment with full enjoyment and to bring lightness to the heavy places of life. They fear boredom and being boring, and their greatest gift is the ability to find humor, joy, and playfulness in any situation. The Jester speaks truth to power through comedy — the court fool who can say what no one else dares. They puncture pretension, lighten dark moments, and remind us that laughter is not trivial but essential. The shadow of the Jester is cruelty disguised as humor, avoidance through constant deflection, and the inability to sit with genuine pain.',
    shadow: 'Cruel humor, avoidance through deflection, inability to be serious, superficiality',
    gift: 'Joy, humor, ability to lighten dark moments, truth-telling through comedy',
    fear: 'Boredom, being boring, being trapped in heaviness',
    desire: 'To live in the moment with full enjoyment, to bring joy to others',
    strategy: 'Use humor to reveal truth, play, find joy in every moment, lighten the mood',
    famous: ['Robin Williams', 'Mark Twain', 'Till Eulenspiegel', 'Deadpool', 'Richard Pryor'],
    symbol: '🃏'
  },
  Everyman: {
    description: 'The Everyman archetype embodies the desire for belonging, connection through shared experience, and the dignity of ordinary life. Everymen are motivated by the need to fit in, to be part of something larger, and to find meaning in the everyday. They fear being left out, standing out too much, or being rejected by the group, and their greatest gift is empathy, relatability, and the ability to build genuine community. The Everyman understands that the most profound truths are often the simplest — that love, work, family, and friendship form the bedrock of a meaningful life. The shadow of the Everyman is conformity and the suppression of individuality — becoming so blended with the group that one\'s unique self disappears.',
    shadow: 'Conformity, mediocrity, suppression of individuality, fear of standing out',
    gift: 'Empathy, relatability, community-building, groundedness, reliability',
    fear: 'Being left out, standing out, rejection by the group',
    desire: 'To belong, to connect through shared experience, to find meaning in the everyday',
    strategy: 'Build community, emphasize shared values, be reliable and consistent',
    famous: ['Forrest Gump', 'Bilbo Baggins', 'Walter White (early)', 'Frodo Baggins', 'The common worker'],
    symbol: '⊕'
  },
  Innocent: {
    description: 'The Innocent archetype embodies the desire for happiness, simplicity, and the experience of paradise on earth. Innocents are motivated by faith, optimism, and the belief that the world is fundamentally good. They fear punishment for doing something wrong or bad, and their greatest gift is the ability to maintain hope and trust in the face of life\'s difficulties. The Innocent sees the best in people and situations, maintaining a childlike wonder that can be profoundly healing. They remind us that simplicity is not naivety but a conscious choice to focus on what is good and true. The shadow of the Innocent is denial — refusing to see darkness, avoiding difficult truths, and remaining willfully blind to the complexity of life.',
    shadow: 'Denial, naivety, avoidance of difficult truths, willful blindness, dependency',
    gift: 'Faith, optimism, trust, simplicity, ability to see goodness',
    fear: 'Punishment, corruption of goodness, loss of innocence',
    desire: 'To experience happiness, simplicity, and paradise',
    strategy: 'Maintain faith, do the right thing, trust in the goodness of life',
    famous: ['Dorothy (Wizard of Oz)', 'Forrest Gump', 'Bambi', 'Anne of Green Gables', 'Mr. Rogers'],
    symbol: '✿'
  },
  Rebel: {
    description: 'The Rebel archetype embodies revolution, liberation, and the willingness to destroy what no longer serves. Rebels are driven by the conviction that rules are made to be broken when they serve the powerful over the just. They fear powerlessness and insignificance, and their greatest gift is the courage to challenge the status quo when others accept it passively. The Rebel is not merely destructive — they are the necessary force that tears down corrupt systems to make way for renewal. Every revolution, every paradigm shift, every act of civil disobedience carries the Rebel\'s fire. Their presence shakes foundations that deserve shaking. The shadow of the Rebel is nihilism and destruction for its own sake — the revolution that consumes its own children.',
    shadow: 'Destructiveness, nihilism, cruelty disguised as justice, inability to build what they tear down',
    gift: 'Revolutionary courage, freedom, ability to challenge corrupt systems, raw authenticity',
    fear: 'Powerlessness, insignificance, conformity, being controlled',
    desire: 'To overturn what is not working, to destroy the obsolete, to liberate',
    strategy: 'Break rules that need breaking, shock people into awareness, disrupt and rebuild',
    famous: ['Robin Hood', 'Che Guevara', 'Harriet Tubman', 'Han Solo', 'Banksy'],
    symbol: '⚡'
  }
};

const ARCHETYPE_QUESTIONS = [
  // Hero (3 questions)
  { text: 'I feel most alive when I am overcoming a difficult challenge.', primary: 'Hero', secondary: 'Ruler' },
  { text: 'I believe that courage is the most important quality a person can have.', primary: 'Hero', secondary: 'Rebel' },
  { text: 'When I see injustice, I feel compelled to take action and fight for what is right.', primary: 'Hero', secondary: 'Caregiver' },
  // Sage (3 questions)
  { text: 'I would rather understand why something happens than simply know that it does.', primary: 'Sage', secondary: 'Magician' },
  { text: 'I find deep satisfaction in researching topics until I become an expert.', primary: 'Sage', secondary: 'Creator' },
  { text: 'I value truth and accuracy more than comfort or social harmony.', primary: 'Sage', secondary: 'Ruler' },
  // Explorer (3 questions)
  { text: 'I feel restless when I stay in one place or routine for too long.', primary: 'Explorer', secondary: 'Rebel' },
  { text: 'I would rather discover something new than perfect something I already know.', primary: 'Explorer', secondary: 'Creator' },
  { text: 'Freedom to choose my own path matters more to me than security.', primary: 'Explorer', secondary: 'Everyman' },
  // Creator (3 questions)
  { text: 'I feel a deep need to express myself through making or building things.', primary: 'Creator', secondary: 'Magician' },
  { text: 'I often see beauty and possibility where others see nothing special.', primary: 'Creator', secondary: 'Lover' },
  { text: 'I would rather create something original than replicate someone else\'s success.', primary: 'Creator', secondary: 'Explorer' },
  // Caregiver (3 questions)
  { text: 'I naturally put other people\'s needs before my own.', primary: 'Caregiver', secondary: 'Everyman' },
  { text: 'I feel happiest when I know I have helped someone through a difficult time.', primary: 'Caregiver', secondary: 'Innocent' },
  { text: 'I find it difficult to say no when someone asks me for help.', primary: 'Caregiver', secondary: 'Lover' },
  // Ruler (3 questions)
  { text: 'I naturally take charge in group situations and organize others toward a goal.', primary: 'Ruler', secondary: 'Hero' },
  { text: 'I believe that good systems and structure are the foundation of success.', primary: 'Ruler', secondary: 'Sage' },
  { text: 'I feel responsible not just for myself but for the well-being of my community or team.', primary: 'Ruler', secondary: 'Caregiver' },
  // Magician (3 questions)
  { text: 'I believe that understanding hidden patterns can transform ordinary situations.', primary: 'Magician', secondary: 'Sage' },
  { text: 'I am fascinated by how small changes can create large, cascading effects.', primary: 'Magician', secondary: 'Creator' },
  { text: 'I see potential in people and situations that others overlook.', primary: 'Magician', secondary: 'Explorer' },
  // Lover (3 questions)
  { text: 'Deep, meaningful relationships are the most important thing in my life.', primary: 'Lover', secondary: 'Caregiver' },
  { text: 'I am drawn to beauty and aesthetics in all their forms.', primary: 'Lover', secondary: 'Creator' },
  { text: 'I feel incomplete without intimacy and emotional connection with others.', primary: 'Lover', secondary: 'Innocent' },
  // Jester (3 questions)
  { text: 'Life is too short to be serious all the time — I look for the humor in everything.', primary: 'Jester', secondary: 'Explorer' },
  { text: 'I use humor to connect with people and to lighten difficult moments.', primary: 'Jester', secondary: 'Everyman' },
  { text: 'I would rather be happy and playful than respected and feared.', primary: 'Jester', secondary: 'Innocent' },
  // Everyman (3 questions)
  { text: 'I prefer to blend in with the group rather than stand out as different.', primary: 'Everyman', secondary: 'Innocent' },
  { text: 'I value fairness and believe everyone should be treated equally.', primary: 'Everyman', secondary: 'Caregiver' },
  { text: 'The simple pleasures — good food, good company, honest work — matter most to me.', primary: 'Everyman', secondary: 'Lover' },
  // Innocent (3 questions)
  { text: 'I believe that people are fundamentally good and that the world has an underlying order.', primary: 'Innocent', secondary: 'Everyman' },
  { text: 'I try to do the right thing and trust that things will work out.', primary: 'Innocent', secondary: 'Caregiver' },
  { text: 'I prefer simplicity and clarity over complexity and ambiguity.', primary: 'Innocent', secondary: 'Sage' },
  // Rebel (3 questions)
  { text: 'Rules that don\'t make sense should be challenged and broken if necessary.', primary: 'Rebel', secondary: 'Explorer' },
  { text: 'I feel a strong urge to fight against systems that I see as unjust or corrupt.', primary: 'Rebel', secondary: 'Hero' },
  { text: 'I would rather be free and authentic than comfortable and conforming.', primary: 'Rebel', secondary: 'Creator' }
];

const ARCHETYPE_COMPATIBILITY = {
  'Hero-Sage': { score: 72, desc: 'The Hero acts while the Sage analyzes — together they balance action with wisdom.' },
  'Hero-Explorer': { score: 80, desc: 'Both seek challenge and growth. The Hero fights for a cause; the Explorer seeks new horizons.' },
  'Hero-Creator': { score: 65, desc: 'The Hero provides drive; the Creator provides vision. Together they build new worlds.' },
  'Hero-Caregiver': { score: 78, desc: 'The Hero protects; the Caregiver heals. A powerful bond of service and sacrifice.' },
  'Hero-Ruler': { score: 85, desc: 'Natural leadership pair. The Hero leads from the front; the Ruler governs from above.' },
  'Hero-Magician': { score: 70, desc: 'The Hero provides courage; the Magician provides transformational insight.' },
  'Hero-Lover': { score: 60, desc: 'The Hero may prioritize duty over intimacy. Growth requires vulnerability from the Hero.' },
  'Hero-Jester': { score: 55, desc: 'The Jester lightens the Hero\'s intensity; the Hero gives the Jester a cause worth fighting for.' },
  'Hero-Everyman': { score: 68, desc: 'The Hero inspires; the Everyman grounds. Together they serve the community.' },
  'Hero-Innocent': { score: 62, desc: 'The Hero protects the Innocent\'s faith. The Innocent reminds the Hero what they fight for.' },
  'Hero-Rebel': { score: 75, desc: 'Both fight — the Hero for justice, the Rebel for freedom. Potent but volatile.' },
  'Sage-Explorer': { score: 78, desc: 'The Sage seeks inner truth; the Explorer seeks outer truth. Together they map the full territory.' },
  'Sage-Creator': { score: 82, desc: 'Knowledge meets imagination. The Sage understands; the Creator reimagines.' },
  'Sage-Caregiver': { score: 70, desc: 'The Sage offers wisdom; the Caregiver offers compassion. Together they heal minds and hearts.' },
  'Sage-Ruler': { score: 80, desc: 'The ideal advisor to the ideal leader. Strategy meets execution.' },
  'Sage-Magician': { score: 88, desc: 'The deepest pairing — both seek understanding of fundamental laws. Together they approach mastery.' },
  'Sage-Lover': { score: 58, desc: 'The Sage analyzes; the Lover feels. Growth requires each to develop the other\'s strength.' },
  'Sage-Jester': { score: 65, desc: 'The Jester teaches the Sage to laugh; the Sage teaches the Jester depth. Surprising synergy.' },
  'Sage-Everyman': { score: 60, desc: 'The Sage brings expertise; the Everyman brings common sense. They keep each other honest.' },
  'Sage-Innocent': { score: 68, desc: 'The Sage seeks truth; the Innocent trusts in goodness. Together they find hopeful wisdom.' },
  'Sage-Rebel': { score: 72, desc: 'The Sage understands why systems fail; the Rebel breaks them. Knowledge fuels revolution.' },
  'Explorer-Creator': { score: 85, desc: 'The Explorer finds new territory; the Creator builds in it. An endlessly generative pairing.' },
  'Explorer-Caregiver': { score: 55, desc: 'The Explorer\'s need for freedom may conflict with the Caregiver\'s need for connection.' },
  'Explorer-Ruler': { score: 50, desc: 'Freedom vs. structure. Growth requires the Ruler to loosen control and the Explorer to commit.' },
  'Explorer-Magician': { score: 78, desc: 'Both seek transformation — the Explorer through journey, the Magician through understanding.' },
  'Explorer-Lover': { score: 58, desc: 'The Lover seeks to merge; the Explorer seeks to roam. Requires trust and space.' },
  'Explorer-Jester': { score: 82, desc: 'Adventure meets play. Together they find joy in the journey itself.' },
  'Explorer-Everyman': { score: 48, desc: 'Different needs — the Explorer craves novelty; the Everyman craves stability. Growth through contrast.' },
  'Explorer-Innocent': { score: 70, desc: 'The Explorer finds new worlds; the Innocent sees the beauty in each one.' },
  'Explorer-Rebel': { score: 88, desc: 'The ultimate freedom-seekers. Both refuse to be contained. Together they break all boundaries.' },
  'Creator-Caregiver': { score: 72, desc: 'The Creator makes; the Caregiver nurtures. Together they bring new life into the world.' },
  'Creator-Ruler': { score: 65, desc: 'The Creator envisions; the Ruler builds the systems to realize the vision. Needs mutual respect.' },
  'Creator-Magician': { score: 90, desc: 'The most creative pairing — imagination meets transformation. Together they bend reality itself.' },
  'Creator-Lover': { score: 85, desc: 'Beauty meets beauty. The Creator makes art; the Lover experiences it. An ecstatic union.' },
  'Creator-Jester': { score: 75, desc: 'The Jester brings play to the Creator\'s work. Together they find joy in the creative process.' },
  'Creator-Everyman': { score: 55, desc: 'The Creator seeks originality; the Everyman seeks relatability. Can create art that speaks to all.' },
  'Creator-Innocent': { score: 70, desc: 'The Innocent\'s wonder feeds the Creator\'s imagination. Together they make art full of hope.' },
  'Creator-Rebel': { score: 82, desc: 'Both break convention — the Creator through new forms, the Rebel through disruption.' },
  'Caregiver-Ruler': { score: 75, desc: 'The Ruler creates structure; the Caregiver fills it with warmth. A balanced leadership.' },
  'Caregiver-Magician': { score: 70, desc: 'The Caregiver heals the heart; the Magician transforms the soul. Together they facilitate deep change.' },
  'Caregiver-Lover': { score: 88, desc: 'The deepest emotional bond. Both prioritize connection above all else.' },
  'Caregiver-Jester': { score: 72, desc: 'The Jester brings laughter to the Caregiver\'s heavy heart. The Caregiver gives the Jester a safe space.' },
  'Caregiver-Everyman': { score: 85, desc: 'Both value community and connection. Together they create warm, inclusive spaces.' },
  'Caregiver-Innocent': { score: 82, desc: 'The Caregiver protects the Innocent\'s goodness. A gentle, nurturing bond.' },
  'Caregiver-Rebel': { score: 52, desc: 'The Rebel challenges; the Caregiver soothes. Growth through learning when to fight and when to heal.' },
  'Ruler-Magician': { score: 78, desc: 'Power meets wisdom. The Ruler governs; the Magician ensures the governance serves transformation.' },
  'Ruler-Lover': { score: 60, desc: 'The Ruler prioritizes duty; the Lover prioritizes intimacy. Requires balancing power and passion.' },
  'Ruler-Jester': { score: 55, desc: 'Order meets chaos. The Jester reminds the Ruler that even kings need to laugh.' },
  'Ruler-Everyman': { score: 72, desc: 'The Ruler leads; the Everyman supports. A stable, productive hierarchy when trust exists.' },
  'Ruler-Innocent': { score: 65, desc: 'The Ruler protects the Innocent\'s paradise. A benevolent governance dynamic.' },
  'Ruler-Rebel': { score: 45, desc: 'The most challenging pairing — order vs. revolution. When balanced, creates just systems.' },
  'Magician-Lover': { score: 75, desc: 'Transformation meets passion. Together they create alchemical relationships.' },
  'Magician-Jester': { score: 68, desc: 'The Magician transforms; the Jester reveals that transformation need not be solemn.' },
  'Magician-Everyman': { score: 60, desc: 'The Magician sees the extraordinary; the Everyman sees the ordinary. Together they find magic in the mundane.' },
  'Magician-Innocent': { score: 72, desc: 'The Magician transforms; the Innocent believes. Together they manifest miracles.' },
  'Magician-Rebel': { score: 80, desc: 'Understanding meets disruption. The Magician knows how systems work; the Rebel knows when to break them.' },
  'Lover-Jester': { score: 78, desc: 'Joy meets joy. The Lover brings depth; the Jester brings lightness. Together they celebrate life.' },
  'Lover-Everyman': { score: 75, desc: 'Both value connection. The Lover adds passion to the Everyman\'s warmth.' },
  'Lover-Innocent': { score: 80, desc: 'Pure love. The Lover feels deeply; the Innocent trusts completely.' },
  'Lover-Rebel': { score: 65, desc: 'Passion meets revolution. Intense but potentially destructive. Growth through honest communication.' },
  'Jester-Everyman': { score: 82, desc: 'Community and joy. The Jester entertains; the Everyman provides the warm audience.' },
  'Jester-Innocent': { score: 85, desc: 'Pure play. Both see the good and fun in life. Together they radiate joy.' },
  'Jester-Rebel': { score: 78, desc: 'The Jester mocks the system; the Rebel destroys it. Humor and revolution make powerful allies.' },
  'Everyman-Innocent': { score: 88, desc: 'Simple goodness. Both value community, fairness, and the basic pleasures of life.' },
  'Everyman-Rebel': { score: 50, desc: 'Conformity vs. rebellion. Growth requires the Everyman to question and the Rebel to respect community.' },
  'Innocent-Rebel': { score: 55, desc: 'Faith vs. fury. The Innocent trusts the system; the Rebel destroys it. Together they can build a better one.' }
};

class ArchetypeInterpreterApp {
  constructor(container) {
    this.container = container;
    this.element = null;
    this._styleEl = null;
    this.state = 'welcome'; // welcome, quiz, results, history, compare
    this.currentQuestion = 0;
    this.answers = [];
    this.scores = {};
    this.primaryArchetype = null;
    this.secondaryArchetype = null;
  }

  render() {
    this._injectStyles();
    this.element = document.createElement('div');
    this.element.className = 'arch-app';
    this._showWelcome();
    this.container.appendChild(this.element);
  }

  destroy() {
    if (this._styleEl && this._styleEl.parentNode) this._styleEl.parentNode.removeChild(this._styleEl);
    if (this.element && this.element.parentNode) this.element.parentNode.removeChild(this.element);
  }

  _injectStyles() {
    this._styleEl = document.createElement('style');
    this._styleEl.textContent = `
      .arch-app {
        width: 100%; height: 100%; overflow-y: auto;
        background: rgba(10,5,15,0.97);
        color: #e0d0e8; font-family: 'Georgia', serif;
        padding: 24px; box-sizing: border-box;
      }
      .arch-header { text-align: center; margin-bottom: 24px; }
      .arch-title {
        font-size: 26px; color: #ff1493; margin: 0 0 6px 0;
        text-shadow: 0 0 20px #ff003c, 0 0 40px #ff003c80;
        letter-spacing: 2px;
      }
      .arch-subtitle { color: #a080b0; font-style: italic; font-size: 14px; margin: 0; }
      .arch-welcome {
        max-width: 600px; margin: 0 auto; text-align: center;
      }
      .arch-welcome p {
        color: #c8a0d8; line-height: 1.8; font-size: 15px;
        margin-bottom: 16px;
      }
      .arch-welcome-lore {
        background: rgba(255,20,147,0.05);
        border: 1px solid rgba(255,20,147,0.15);
        border-radius: 16px; padding: 24px;
        margin-bottom: 24px;
        backdrop-filter: blur(8px);
      }
      .arch-btn {
        padding: 12px 32px; border-radius: 24px;
        background: linear-gradient(135deg, #ff003c, #ff1493);
        border: none; color: #fff; font-size: 16px;
        font-weight: bold; cursor: pointer;
        box-shadow: 0 0 20px rgba(255,0,60,0.3);
        transition: all 0.3s; font-family: inherit;
        margin: 6px;
      }
      .arch-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 25px rgba(255,0,60,0.5);
      }
      .arch-btn-secondary {
        background: rgba(255,20,147,0.1);
        border: 1px solid rgba(255,20,147,0.3);
        box-shadow: none;
      }
      .arch-btn-secondary:hover {
        background: rgba(255,20,147,0.2);
        box-shadow: 0 0 12px rgba(255,20,147,0.2);
      }
      .arch-quiz-container {
        max-width: 700px; margin: 0 auto;
      }
      .arch-progress-bar {
        width: 100%; height: 6px;
        background: rgba(255,255,255,0.05);
        border-radius: 3px; margin-bottom: 8px;
        overflow: hidden;
      }
      .arch-progress-fill {
        height: 100%; background: linear-gradient(90deg, #ff003c, #ff1493);
        border-radius: 3px; transition: width 0.4s ease;
        box-shadow: 0 0 10px rgba(255,20,147,0.5);
      }
      .arch-progress-text {
        text-align: center; font-size: 12px;
        color: #a080b0; margin-bottom: 24px;
      }
      .arch-question-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,20,147,0.15);
        border-radius: 16px; padding: 32px;
        text-align: center;
        backdrop-filter: blur(8px);
      }
      .arch-question-text {
        font-size: 18px; color: #e0d0e8;
        line-height: 1.6; margin-bottom: 32px;
        font-style: italic;
      }
      .arch-likert-container {
        display: flex; flex-direction: column;
        align-items: center; gap: 12px;
      }
      .arch-slider-wrapper {
        width: 100%; max-width: 400px; position: relative;
      }
      .arch-slider {
        -webkit-appearance: none; appearance: none;
        width: 100%; height: 8px;
        background: rgba(255,255,255,0.08);
        border-radius: 4px; outline: none;
        transition: all 0.3s;
      }
      .arch-slider::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 24px; height: 24px;
        background: radial-gradient(circle, #ff1493, #ff003c);
        border-radius: 50%; cursor: pointer;
        box-shadow: 0 0 15px rgba(255,20,147,0.6);
        transition: all 0.2s;
      }
      .arch-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 20px rgba(255,20,147,0.8);
      }
      .arch-slider::-moz-range-thumb {
        width: 24px; height: 24px;
        background: radial-gradient(circle, #ff1493, #ff003c);
        border-radius: 50%; cursor: pointer; border: none;
        box-shadow: 0 0 15px rgba(255,20,147,0.6);
      }
      .arch-slider-labels {
        display: flex; justify-content: space-between;
        width: 100%; max-width: 400px;
        font-size: 10px; color: #7a5a8a;
        margin-top: 4px;
      }
      .arch-slider-value {
        font-size: 14px; color: #ff1493;
        margin-top: 8px; font-weight: bold;
      }
      .arch-nav-buttons {
        display: flex; justify-content: center;
        gap: 12px; margin-top: 24px;
      }
      .arch-results-container { max-width: 700px; margin: 0 auto; }
      .arch-result-main {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,20,147,0.2);
        border-radius: 20px; padding: 32px;
        text-align: center; margin-bottom: 20px;
        backdrop-filter: blur(12px);
      }
      .arch-result-symbol {
        font-size: 48px; margin-bottom: 8px;
        text-shadow: 0 0 20px rgba(255,20,147,0.5);
      }
      .arch-result-name {
        font-size: 28px; color: #ff1493; margin: 0 0 4px 0;
        text-shadow: 0 0 15px rgba(255,20,147,0.4);
      }
      .arch-result-secondary {
        font-size: 14px; color: #ffd700;
        margin-bottom: 16px;
      }
      .arch-result-description {
        color: #c8a0d8; line-height: 1.8; font-size: 14px;
        text-align: left; margin-bottom: 20px;
      }
      .arch-result-traits {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 12px; text-align: left;
      }
      .arch-trait-card {
        background: rgba(255,20,147,0.05);
        border: 1px solid rgba(255,20,147,0.1);
        border-radius: 10px; padding: 14px;
      }
      .arch-trait-label {
        font-size: 11px; color: #ff1493;
        text-transform: uppercase; letter-spacing: 1px;
        margin-bottom: 6px;
      }
      .arch-trait-value {
        font-size: 13px; color: #c8a0d8; line-height: 1.5;
      }
      .arch-famous {
        margin-top: 16px; text-align: left;
      }
      .arch-famous-title {
        font-size: 13px; color: #ff1493;
        margin-bottom: 8px;
      }
      .arch-famous-list {
        display: flex; flex-wrap: wrap; gap: 8px;
      }
      .arch-famous-item {
        padding: 4px 12px; border-radius: 12px;
        background: rgba(255,20,147,0.08);
        border: 1px solid rgba(255,20,147,0.15);
        font-size: 12px; color: #c8a0d8;
      }
      .arch-radar-container {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,20,147,0.15);
        border-radius: 16px; padding: 24px;
        margin-bottom: 20px; text-align: center;
      }
      .arch-radar-title {
        font-size: 16px; color: #ff1493;
        margin: 0 0 16px 0;
      }
      .arch-compat-section {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,20,147,0.15);
        border-radius: 16px; padding: 24px;
        margin-bottom: 20px;
      }
      .arch-compat-title {
        font-size: 16px; color: #ff1493;
        margin: 0 0 16px 0; text-align: center;
      }
      .arch-compat-select {
        width: 100%; padding: 10px 16px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,20,147,0.25);
        border-radius: 10px; color: #e0d0e8;
        font-size: 14px; font-family: inherit;
        outline: none; margin-bottom: 12px;
      }
      .arch-compat-select option { background: #1a0a2e; }
      .arch-compat-result {
        text-align: center; padding: 16px;
      }
      .arch-compat-score {
        font-size: 36px; color: #ff1493;
        text-shadow: 0 0 15px rgba(255,20,147,0.5);
      }
      .arch-compat-desc {
        font-size: 14px; color: #ffd700;
        margin-bottom: 8px;
      }
      .arch-history-section {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,20,147,0.15);
        border-radius: 16px; padding: 24px;
        margin-bottom: 20px;
      }
      .arch-history-item {
        background: rgba(255,20,147,0.05);
        border: 1px solid rgba(255,20,147,0.1);
        border-radius: 10px; padding: 14px;
        margin-bottom: 10px;
      }
      .arch-history-date { font-size: 11px; color: #7a5a8a; }
      .arch-history-arch { font-size: 15px; color: #ff1493; font-weight: bold; }
      .arch-actions { display: flex; justify-content: center; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
    `;
    document.head.appendChild(this._styleEl);
  }

  _showWelcome() {
    this.state = 'welcome';
    this.element.innerHTML = `
      <div class="arch-header">
        <h1 class="arch-title">✦ Archetype Interpreter ✦</h1>
        <p class="arch-subtitle">Discover the ancient pattern that shapes your story</p>
      </div>
      <div class="arch-welcome">
        <div class="arch-welcome-lore">
          <p>Beneath the surface of every human life, ancient patterns move and breathe. Carl Jung called them archetypes — primordial images embedded in the collective unconscious, shaping how we love, create, lead, and dream.</p>
          <p>There are twelve primary archetypes, each carrying a unique gift, a shadow, and a destiny. Most people carry one dominant archetype that colors their entire being, with a secondary archetype providing depth and nuance.</p>
          <p>This assessment will guide you through 36 questions to reveal which archetypal force moves through you most strongly. Answer honestly — there are no right or wrong answers, only truth.</p>
          <p style="color:#ff1493;font-style:italic;margin-bottom:0;">The archetype that chooses you is the one you've been living. The question is: have you been living it consciously?</p>
        </div>
        <div class="arch-actions">
          <button class="arch-btn" id="arch-start-btn">Begin Assessment</button>
          <button class="arch-btn arch-btn-secondary" id="arch-history-btn">Past Results</button>
        </div>
      </div>
    `;

    this.element.querySelector('#arch-start-btn').addEventListener('click', () => this._startQuiz());
    this.element.querySelector('#arch-history-btn').addEventListener('click', () => this._showHistory());
  }

  _startQuiz() {
    this.state = 'quiz';
    this.currentQuestion = 0;
    this.answers = new Array(ARCHETYPE_QUESTIONS.length).fill(3); // default neutral
    this._renderQuestion();
  }

  _renderQuestion() {
    const q = ARCHETYPE_QUESTIONS[this.currentQuestion];
    const total = ARCHETYPE_QUESTIONS.length;
    const progress = ((this.currentQuestion) / total) * 100;
    const labels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

    this.element.innerHTML = `
      <div class="arch-header">
        <h1 class="arch-title">✦ Archetype Assessment ✦</h1>
      </div>
      <div class="arch-quiz-container">
        <div class="arch-progress-bar">
          <div class="arch-progress-fill" style="width:${progress}%"></div>
        </div>
        <div class="arch-progress-text">Question ${this.currentQuestion + 1} of ${total}</div>
        <div class="arch-question-card">
          <div class="arch-question-text">"${q.text}"</div>
          <div class="arch-likert-container">
            <div class="arch-slider-wrapper">
              <input type="range" class="arch-slider" min="1" max="5" value="${this.answers[this.currentQuestion]}" step="1" />
              <div class="arch-slider-labels">
                <span>Strongly Disagree</span>
                <span>Disagree</span>
                <span>Neutral</span>
                <span>Agree</span>
                <span>Strongly Agree</span>
              </div>
              <div class="arch-slider-value">${labels[this.answers[this.currentQuestion] - 1]}</div>
            </div>
          </div>
          <div class="arch-nav-buttons">
            ${this.currentQuestion > 0 ? '<button class="arch-btn arch-btn-secondary" id="arch-prev-btn">← Previous</button>' : ''}
            <button class="arch-btn" id="arch-next-btn">${this.currentQuestion < total - 1 ? 'Next →' : 'See Results ✦'}</button>
          </div>
        </div>
      </div>
    `;

    const slider = this.element.querySelector('.arch-slider');
    const valueDisplay = this.element.querySelector('.arch-slider-value');
    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.answers[this.currentQuestion] = val;
      valueDisplay.textContent = labels[val - 1];
    });

    const nextBtn = this.element.querySelector('#arch-next-btn');
    nextBtn.addEventListener('click', () => {
      if (this.currentQuestion < total - 1) {
        this.currentQuestion++;
        this._renderQuestion();
      } else {
        this._calculateResults();
      }
    });

    if (this.currentQuestion > 0) {
      this.element.querySelector('#arch-prev-btn').addEventListener('click', () => {
        this.currentQuestion--;
        this._renderQuestion();
      });
    }
  }

  _calculateResults() {
    this.scores = {};
    Object.keys(ARCHETYPES).forEach(a => { this.scores[a] = 0; });

    ARCHETYPE_QUESTIONS.forEach((q, i) => {
      const val = this.answers[i];
      this.scores[q.primary] += val;
      this.scores[q.secondary] += Math.floor(val * 0.5);
    });

    // Normalize to percentage (max possible per archetype ~ 15 primary + ~7.5 secondary = 22.5)
    const maxScore = 22.5;
    Object.keys(this.scores).forEach(a => {
      this.scores[a] = Math.round((this.scores[a] / maxScore) * 100);
    });

    // Find primary and secondary
    const sorted = Object.entries(this.scores).sort((a, b) => b[1] - a[1]);
    this.primaryArchetype = sorted[0][0];
    this.secondaryArchetype = sorted[1][0];

    this._saveResult();
    this._showResults();
  }

  _showResults() {
    this.state = 'results';
    const primary = ARCHETYPES[this.primaryArchetype];
    const secondary = ARCHETYPES[this.secondaryArchetype];

    this.element.innerHTML = `
      <div class="arch-header">
        <h1 class="arch-title">✦ Your Archetype ✦</h1>
        <p class="arch-subtitle">The ancient pattern that moves through your life</p>
      </div>
      <div class="arch-results-container">
        <div class="arch-result-main">
          <div class="arch-result-symbol">${primary.symbol}</div>
          <h2 class="arch-result-name">The ${this.primaryArchetype}</h2>
          <div class="arch-result-secondary">with The ${this.secondaryArchetype} as your secondary archetype</div>
          <div class="arch-result-description">${primary.description}</div>
          <div class="arch-result-traits">
            <div class="arch-trait-card">
              <div class="arch-trait-label">✦ Gift</div>
              <div class="arch-trait-value">${primary.gift}</div>
            </div>
            <div class="arch-trait-card">
              <div class="arch-trait-label">⚡ Shadow</div>
              <div class="arch-trait-value">${primary.shadow}</div>
            </div>
            <div class="arch-trait-card">
              <div class="arch-trait-label">♡ Fear</div>
              <div class="arch-trait-value">${primary.fear}</div>
            </div>
            <div class="arch-trait-card">
              <div class="arch-trait-label">✧ Desire</div>
              <div class="arch-trait-value">${primary.desire}</div>
            </div>
          </div>
          <div class="arch-trait-card" style="margin-top:12px;">
            <div class="arch-trait-label">Strategy</div>
            <div class="arch-trait-value">${primary.strategy}</div>
          </div>
          <div class="arch-famous">
            <div class="arch-famous-title">Famous ${this.primaryArchetype}s:</div>
            <div class="arch-famous-list">
              ${primary.famous.map(f => `<span class="arch-famous-item">${f}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="arch-radar-container">
          <h3 class="arch-radar-title">Archetype Wheel — Your Full Profile</h3>
          <div id="arch-radar-chart"></div>
        </div>

        <div class="arch-compat-section">
          <h3 class="arch-compat-title">Compatibility Explorer</h3>
          <select class="arch-compat-select" id="arch-compat-select">
            <option value="">Select an archetype to compare...</option>
            ${Object.keys(ARCHETYPES).map(a => `<option value="${a}">The ${a}</option>`).join('')}
          </select>
          <div id="arch-compat-result"></div>
        </div>

        <div class="arch-history-section">
          <h3 class="arch-compat-title">Assessment History</h3>
          <div id="arch-history-list"></div>
        </div>

        <div class="arch-actions">
          <button class="arch-btn" id="arch-retake-btn">Retake Assessment</button>
          <button class="arch-btn arch-btn-secondary" id="arch-home-btn">Home</button>
        </div>
      </div>
    `;

    // Render radar chart
    this._renderRadarChart();

    // Compatibility
    this.element.querySelector('#arch-compat-select').addEventListener('change', (e) => {
      if (e.target.value) {
        this._showCompatibility(this.primaryArchetype, e.target.value);
      }
    });

    // History
    this._renderMiniHistory();

    // Buttons
    this.element.querySelector('#arch-retake-btn').addEventListener('click', () => this._startQuiz());
    this.element.querySelector('#arch-home-btn').addEventListener('click', () => this._showWelcome());
  }

  _renderRadarChart() {
    const container = this.element.querySelector('#arch-radar-chart');
    const archetypes = Object.keys(ARCHETYPES);
    const count = archetypes.length;
    const cx = 160, cy = 160, radius = 120;
    let svg = `<svg width="320" height="320" viewBox="0 0 320 320" style="max-width:100%;">`;

    // Grid circles
    for (let r = 30; r <= radius; r += 30) {
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,20,147,0.1)" stroke-width="1"/>`;
    }

    // Axis lines and labels
    archetypes.forEach((a, i) => {
      const angle = (i * 2 * Math.PI / count) - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      svg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,20,147,0.1)" stroke-width="1"/>`;

      // Label
      const lx = cx + (radius + 20) * Math.cos(angle);
      const ly = cy + (radius + 20) * Math.sin(angle);
      const anchor = lx < cx - 5 ? 'end' : lx > cx + 5 ? 'start' : 'middle';
      svg += `<text x="${lx}" y="${ly + 4}" text-anchor="${anchor}" fill="#a080b0" font-size="9" font-family="Georgia">${a}</text>`;
    });

    // Data polygon
    const points = archetypes.map((a, i) => {
      const angle = (i * 2 * Math.PI / count) - Math.PI / 2;
      const score = Math.min(this.scores[a] || 0, 100);
      const r = (score / 100) * radius;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    });
    svg += `<polygon points="${points.join(' ')}" fill="rgba(255,20,147,0.15)" stroke="#ff1493" stroke-width="2"/>`;

    // Data points
    archetypes.forEach((a, i) => {
      const angle = (i * 2 * Math.PI / count) - Math.PI / 2;
      const score = Math.min(this.scores[a] || 0, 100);
      const r = (score / 100) * radius;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      svg += `<circle cx="${px}" cy="${py}" r="3" fill="#ff1493" filter="url(#arch-glow)"/>`;
    });

    svg += `<defs><filter id="arch-glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMerge><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    svg += '</svg>';
    container.innerHTML = svg;
  }

  _showCompatibility(a, b) {
    const key1 = `${a}-${b}`;
    const key2 = `${b}-${a}`;
    const compat = ARCHETYPE_COMPATIBILITY[key1] || ARCHETYPE_COMPATIBILITY[key2] || { score: 50, desc: 'A unique pairing with its own special dynamics.' };
    const resultEl = this.element.querySelector('#arch-compat-result');
    resultEl.innerHTML = `
      <div class="arch-compat-result">
        <div class="arch-compat-score">${compat.score}%</div>
        <div class="arch-compat-desc">The ${a} and The ${b}</div>
        <p style="color:#c8a0c8;font-size:13px;margin-top:8px;">${compat.desc}</p>
      </div>
    `;
  }

  _saveResult() {
    try {
      const history = JSON.parse(localStorage.getItem('nexus_archetype_history') || '[]');
      history.unshift({
        date: new Date().toISOString(),
        primary: this.primaryArchetype,
        secondary: this.secondaryArchetype,
        scores: { ...this.scores }
      });
      if (history.length > 20) history.length = 20;
      localStorage.setItem('nexus_archetype_history', JSON.stringify(history));
    } catch (e) { /* ignore */ }
  }

  _renderMiniHistory() {
    const list = this.element.querySelector('#arch-history-list');
    try {
      const history = JSON.parse(localStorage.getItem('nexus_archetype_history') || '[]');
      if (history.length === 0) {
        list.innerHTML = '<p style="color:#7a5a8a;text-align:center;font-style:italic;">No previous assessments.</p>';
        return;
      }
      list.innerHTML = history.map(h => `
        <div class="arch-history-item">
          <div class="arch-history-date">${new Date(h.date).toLocaleDateString()}</div>
          <div class="arch-history-arch">The ${h.primary} <span style="color:#ffd700;font-size:12px;">+ The ${h.secondary}</span></div>
        </div>
      `).join('');
    } catch (e) {
      list.innerHTML = '<p style="color:#7a5a8a;">Could not load history.</p>';
    }
  }

  _showHistory() {
    this.state = 'history';
    this.element.innerHTML = `
      <div class="arch-header">
        <h1 class="arch-title">✦ Assessment History ✦</h1>
        <p class="arch-subtitle">Track your archetypal evolution over time</p>
      </div>
      <div class="arch-results-container">
        <div class="arch-history-section">
          <div id="arch-full-history-list"></div>
        </div>
        <div class="arch-actions">
          <button class="arch-btn" id="arch-new-btn">Take Assessment</button>
          <button class="arch-btn arch-btn-secondary" id="arch-back-btn">Home</button>
        </div>
      </div>
    `;

    const list = this.element.querySelector('#arch-full-history-list');
    try {
      const history = JSON.parse(localStorage.getItem('nexus_archetype_history') || '[]');
      if (history.length === 0) {
        list.innerHTML = '<p style="color:#7a5a8a;text-align:center;font-style:italic;padding:40px 0;">No previous assessments. Take the assessment to discover your archetype.</p>';
      } else {
        list.innerHTML = history.map((h, idx) => {
          const p = ARCHETYPES[h.primary];
          return `
            <div class="arch-history-item" style="padding:18px;">
              <div class="arch-history-date">${new Date(h.date).toLocaleString()}</div>
              <div class="arch-history-arch" style="font-size:18px;margin:8px 0;">
                ${p ? p.symbol : '✦'} The ${h.primary}
              </div>
              <div style="color:#ffd700;font-size:13px;margin-bottom:6px;">Secondary: The ${h.secondary}</div>
              <div style="font-size:12px;color:#a080b0;">
                ${Object.entries(h.scores || {}).sort((a,b) => b[1]-a[1]).slice(0,5).map(([k,v]) => `${k}: ${v}%`).join(' | ')}
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (e) {
      list.innerHTML = '<p style="color:#7a5a8a;">Could not load history.</p>';
    }

    this.element.querySelector('#arch-new-btn').addEventListener('click', () => this._startQuiz());
    this.element.querySelector('#arch-back-btn').addEventListener('click', () => this._showWelcome());
  }
}

window.ArchetypeInterpreterApp = ArchetypeInterpreterApp;
