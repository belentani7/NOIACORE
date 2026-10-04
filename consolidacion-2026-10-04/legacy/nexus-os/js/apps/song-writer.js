'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Song Writer Assistant
 *  Complete songwriting tool with lyrics, chords, and structure.
 * ═══════════════════════════════════════════════════════════════
 */

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Folk', 'R&B', 'Country', 'Jazz', 'Metal', 'Punk'];
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MOODS = ['Happy', 'Sad', 'Angry', 'Melancholic', 'Euphoric', 'Nostalgic', 'Dark', 'Hopeful', 'Romantic', 'Rebellious'];
const SECTION_TYPES = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro', 'Interlude', 'Solo', 'Breakdown'];

const SONG_TEMPLATES = [
  { name: 'Pop Standard', sections: ['Intro','Verse','Pre-Chorus','Chorus','Verse','Pre-Chorus','Chorus','Bridge','Chorus','Outro'] },
  { name: 'Rock Anthem', sections: ['Intro','Verse','Chorus','Verse','Chorus','Solo','Chorus','Outro'] },
  { name: 'Power Ballad', sections: ['Intro','Verse','Verse','Chorus','Verse','Chorus','Bridge','Chorus'] },
  { name: 'Hip-Hop Banger', sections: ['Intro','Verse','Hook','Verse','Hook','Verse','Hook','Outro'] },
  { name: 'EDM Drop', sections: ['Intro','Build','Drop','Break','Build','Drop','Outro'] },
  { name: 'Folk Story', sections: ['Verse','Verse','Chorus','Verse','Verse','Chorus','Bridge','Chorus'] },
  { name: 'Country Classic', sections: ['Intro','Verse','Chorus','Verse','Chorus','Bridge','Chorus','Outro'] },
  { name: 'R&B Smooth', sections: ['Intro','Verse','Pre-Chorus','Chorus','Verse','Chorus','Bridge','Chorus','Outro'] },
  { name: 'Jazz Standard', sections: ['Intro','Head','Solo 1','Solo 2','Head','Outro'] },
  { name: 'Punk Raw', sections: ['Intro','Verse','Chorus','Verse','Chorus','Chorus'] },
  { name: 'Metal Epic', sections: ['Intro','Verse','Pre-Chorus','Chorus','Verse','Chorus','Solo','Bridge','Chorus','Outro'] },
  { name: 'Singer-Songwriter', sections: ['Verse','Verse','Chorus','Verse','Chorus','Outro'] },
  { name: 'Acoustic Chill', sections: ['Intro','Verse','Chorus','Verse','Chorus','Bridge','Chorus'] },
  { name: 'Pop Punk', sections: ['Intro','Verse','Chorus','Verse','Chorus','Bridge','Chorus','Chorus'] },
  { name: 'Trap', sections: ['Intro','Hook','Verse','Hook','Verse','Hook','Outro'] },
  { name: 'Lo-fi', sections: ['Intro','Verse','Chorus','Verse','Chorus','Outro'] },
  { name: 'Disco', sections: ['Intro','Verse','Pre-Chorus','Chorus','Verse','Chorus','Breakdown','Chorus'] },
  { name: 'Reggaeton', sections: ['Intro','Verse','Pre-Chorus','Chorus','Verse','Chorus','Bridge','Chorus'] },
  { name: 'Ambient', sections: ['Intro','Section A','Section B','Section A','Outro'] },
  { name: 'Blues 12-Bar', sections: ['Intro','Verse 1','Verse 2','Verse 3','Solo','Verse 4','Outro'] },
  { name: 'Indie Rock', sections: ['Intro','Verse','Chorus','Verse','Chorus','Bridge','Chorus','Outro'] }
];

const CHORD_PROGRESSIONS = {
  Pop: [
    { name: 'I-V-vi-IV', intervals: [0,4,5,3] },
    { name: 'I-vi-IV-V', intervals: [0,5,3,4] },
    { name: 'vi-IV-I-V', intervals: [5,3,0,4] },
    { name: 'I-IV-vi-V', intervals: [0,3,5,4] },
    { name: 'IV-I-V-vi', intervals: [3,0,4,5] }
  ],
  Rock: [
    { name: 'I-IV-V-I', intervals: [0,3,4,0] },
    { name: 'I-bVII-IV-I', intervals: [0,6,3,0] },
    { name: 'i-III-IV-i', intervals: [0,2,3,0] },
    { name: 'I-IV-I-V', intervals: [0,3,0,4] },
    { name: 'i-IV-i-V', intervals: [0,3,0,4] }
  ],
  'Hip-Hop': [
    { name: 'i-iv-i-iv', intervals: [0,3,0,3] },
    { name: 'i-VI-III-VII', intervals: [0,5,2,6] },
    { name: 'i-iv-VI-V', intervals: [0,3,5,4] },
    { name: 'i-i-iv-i', intervals: [0,0,3,0] }
  ],
  Electronic: [
    { name: 'i-VII-VI-VII', intervals: [0,6,5,6] },
    { name: 'i-i-iv-i', intervals: [0,0,3,0] },
    { name: 'i-VI-III-VII', intervals: [0,5,2,6] },
    { name: 'vi-IV-I-V', intervals: [5,3,0,4] }
  ],
  Folk: [
    { name: 'I-IV-V-I', intervals: [0,3,4,0] },
    { name: 'I-V-vi-IV', intervals: [0,4,5,3] },
    { name: 'I-ii-IV-I', intervals: [0,1,3,0] },
    { name: 'I-IV-I-V', intervals: [0,3,0,4] }
  ],
  'R&B': [
    { name: 'I-vi-ii-V', intervals: [0,5,1,4] },
    { name: 'IV-V-iii-vi', intervals: [3,4,2,5] },
    { name: 'I-IV-vi-V', intervals: [0,3,5,4] },
    { name: 'ii-V-I-vi', intervals: [1,4,0,5] }
  ],
  Country: [
    { name: 'I-IV-V-I', intervals: [0,3,4,0] },
    { name: 'I-V-vi-IV', intervals: [0,4,5,3] },
    { name: 'I-IV-I-V', intervals: [0,3,0,4] },
    { name: 'I-vi-IV-V', intervals: [0,5,3,4] }
  ],
  Jazz: [
    { name: 'ii-V-I-vi', intervals: [1,4,0,5] },
    { name: 'I-vi-ii-V', intervals: [0,5,1,4] },
    { name: 'iii-vi-ii-V', intervals: [2,5,1,4] },
    { name: 'I-IV-iii-vi', intervals: [0,3,2,5] }
  ],
  Metal: [
    { name: 'i-bVII-bVI-V', intervals: [0,6,5,4] },
    { name: 'i-III-VII-i', intervals: [0,2,6,0] },
    { name: 'i-iv-i-V', intervals: [0,3,0,4] },
    { name: 'i-VI-III-VII', intervals: [0,5,2,6] }
  ],
  Punk: [
    { name: 'I-IV-V-IV', intervals: [0,3,4,3] },
    { name: 'I-V-vi-IV', intervals: [0,4,5,3] },
    { name: 'I-IV-I-V', intervals: [0,3,0,4] },
    { name: 'i-IV-i-IV', intervals: [0,3,0,3] }
  ]
};

const RHYME_FAMILIES = {
  '-ight': ['light','night','right','fight','sight','bright','flight','might','tight','height','bite','kite','white','write','quite'],
  '-ove': ['love','above','dove','shove','glove','of'],
  '-ain': ['rain','pain','chain','brain','train','plain','gain','main','vein','lane','flame','game','name','same','blame','shame','frame','came','claim'],
  '-eart': ['heart','start','part','art','smart','chart','apart','dart','cart','dark','park','mark','spark','stark'],
  '-ire': ['fire','desire','higher','wire','tire','inspire','admire','entire','empire','acquire'],
  '-ay': ['day','way','say','play','stay','pray','pay','gray','lay','ray','away','display','okay','today','yesterday','may','always'],
  '-ound': ['sound','ground','found','round','bound','around','town','down','crown','drown','frown','brown','gown','noun'],
  '-eel': ['feel','real','deal','heal','steal','reveal','appeal','ideal','steel','wheel','kneel','peel','seal','meal'],
  '-ine': ['mine','fine','line','wine','shine','divine','sign','design','combine','decline','define','refine','online','nine','pine','vine','twine','spine'],
  '-ream': ['dream','stream','team','cream','gleam','beam','seem','scheme','extreme','supreme','theme','esteem','redeem','scream'],
  '-all': ['all','fall','call','wall','tall','small','hall','ball','crawl','stall','recall','install','overall','enthrall'],
  '-old': ['old','gold','cold','hold','told','bold','fold','sold','mold','behold','unfold','withhold','uphold'],
  '-ing': ['sing','ring','wing','bring','spring','thing','king','string','cling','swing','sting','fling'],
  '-ore': ['more','door','floor','before','ignore','explore','adore','store','core','shore','war','pour','roar','soar','score'],
  '-ue': ['true','blue','you','new','through','knew','few','view','pursue','flew','drew','grew','threw','crew','shoe','glue','due'],
  '-own': ['own','known','shown','grown','thrown','blown','flown','sown','clone','phone','bone','stone','alone','tone','zone','home','roam'],
  '-ake': ['make','take','break','wake','shake','fake','lake','snake','mistake','awake','bake','cake','stake','quake'],
  '-ide': ['side','ride','hide','guide','pride','wide','tide','slide','decide','provide','inside','outside','beside','divide','confide'],
  '-urn': ['burn','turn','learn','return','yearn','concern','earn','discern'],
  '-ow': ['know','show','grow','flow','glow','low','slow','blow','snow','throw','below','follow','shadow','window','tomorrow','sorrow'],
  '-ong': ['song','long','strong','wrong','along','belong','among','gone','dawn','drawn'],
  '-ace': ['face','place','space','race','grace','trace','chase','base','case','embrace','replace','erase','pace','lace'],
  '-ain2': ['again','remain','explain','contain','sustain','obtain','complain','maintain','attain','detain','retain','refrain'],
  '-ess': ['less','bless','guess','dress','press','mess','stress','express','confess','possess','address','success','excess'],
  '-ear': ['fear','near','clear','hear','year','dear','appear','disappear','tear','here','beer','cheer','steer','severe','sincere'],
  '-ood': ['good','could','would','should','wood','stood','understood','neighborhood','mood','food'],
  '-ime': ['time','rhyme','crime','climb','prime','chime','dime','lime','slime','sublime','lifetime','sometime','overtime'],
  '-ust': ['trust','must','just','dust','rust','crust','gust','bust','adjust','discuss'],
  '-age': ['page','stage','cage','rage','age','wage','sage','engage','message','passage','damage','image','courage','manage'],
  '-ong2': ['long','strong','song','belong','wrong','along','among'],
  '-ead': ['head','dead','red','bed','said','led','fed','spread','thread','dread','instead','ahead','shed','fled','bled'],
  '-ose': ['close','rose','nose','those','chose','pose','expose','compose','suppose','oppose','propose','impose'],
  '-ull': ['full','pull','bull','null','hull','skull','dull','gull']
};

const LYRIC_TEMPLATES = {
  Happy: {
    Verse: [
      ['Woke up with the sun on my face', 'Everything falling right into place', 'Colors brighter than yesterday', 'Nothing could take this feeling away'],
      ['Dancing through the morning light', 'Every moment feeling so right', 'Got that fire burning inside', 'On this beautiful ride'],
    ],
    Chorus: [
      ['We\'re flying high, touching the sky', 'Nothing can stop us, we\'re learning to fly', 'Hold on tight, don\'t let it go', 'This is the life, this is the show'],
      ['Feel the joy running through my veins', 'Sunshine breaking through the rain', 'We\'re alive and we\'re free', 'This is where I\'m meant to be']
    ]
  },
  Sad: {
    Verse: [
      ['Empty rooms echo with your name', 'Nothing feels the way it came', 'Shadows dancing on the wall', 'Waiting for a phone that never calls'],
      ['Rain falls like the tears I hide', 'Memories I can\'t leave behind', 'Every song plays our refrain', 'Will I ever feel whole again']
    ],
    Chorus: [
      ['I\'m falling apart at the seams', 'Haunted by impossible dreams', 'The ghost of us won\'t let me be', 'I\'m drowning in what used to be'],
      ['Broken hearts and empty hands', 'Building castles out of sand', 'Waves come crashing, washing away', 'Everything I tried to say']
    ]
  },
  Angry: {
    Verse: [
      ['I\'m done being polite, done being small', 'Watch me rise up, watch me stand tall', 'Every lie you told, every line you crossed', 'I\'m counting up the price, counting up the cost'],
      ['Push me one more time, I dare you to try', 'Lightning in my veins, thunder in my eye', 'I\'ve been patient, I\'ve been still', 'Now I\'m climbing up this hill']
    ],
    Chorus: [
      ['Burn it down, let the ashes fall', 'I\'m breaking through your prison wall', 'No more chains, no more lies', 'Watch the fury in my eyes'],
      ['Scream it out, let the whole world hear', 'I\'m not afraid, I\'m not in fear', 'This is my revolution now', 'I won\'t back down, I won\'t bow']
    ]
  },
  Melancholic: {
    Verse: [
      ['Autumn leaves remind me how things fade', 'Golden moments lost in the shade', 'Time moves slow but won\'t rewind', 'Leaving all we had behind'],
      ['Candlelight flickers in the window pane', 'Softly plays our favorite refrain', 'Bittersweet like wine and rain', 'Beautiful despite the pain']
    ],
    Chorus: [
      ['We were something beautiful once', 'Like a sunset before the dark', 'Now I carry what remains', 'A quiet ache inside my heart'],
      ['Time heals nothing, just teaches us to bear', 'The weight of memories we share', 'Beautiful and melancholy', 'The art of loving gracefully']
    ]
  },
  Romantic: {
    Verse: [
      ['Your eyes hold the ocean I want to drown in', 'Every touch a verse, every kiss a hymn', 'The way you move through candlelit rooms', 'Like poetry that everyone assumes'],
      ['I trace your name across the stars', 'Found my heaven right where you are', 'In your arms the world disappears', 'All my doubts dissolve in tears']
    ],
    Chorus: [
      ['You are the song my heart has been singing', 'The answer to prayers I didn\'t know I was saying', 'Forever starts the moment that you\'re near', 'My love, my life, my everything dear'],
      ['I\'ll love you through the fire and the rain', 'Through the pleasure and through the pain', 'In this life and the one beyond', 'You are my eternal song']
    ]
  },
  Nostalgic: {
    Verse: [
      ['Old photographs on a dusty shelf', 'Staring back at my younger self', 'Summer nights that lasted forever', 'Friends who swore we\'d stay together'],
      ['The smell of rain on childhood streets', 'Mixtape playing on repeat', 'Backseat dreams and candy bars', 'Counting streetlights, wishing on stars']
    ],
    Chorus: [
      ['Take me back to yesterday', 'When the world was simple and the skies were gray', 'Before we learned that things could end', 'Before goodbye replaced my friend'],
      ['Those golden days like honey dripped', 'From fingers that were too young to grip', 'I\'d give it all to go back now', 'To who we were, but I don\'t know how']
    ]
  },
  Dark: {
    Verse: [
      ['Shadows whisper truths the light won\'t show', 'In the void below, the answers grow', 'Every mirror cracks when I look too long', 'The silence screams a different song'],
      ['Midnight conversations with the dead', 'Voices echoing inside my head', 'The monster under the bed is me', 'Dancing with my dark debris']
    ],
    Chorus: [
      ['Welcome to the darkness, make yourself at home', 'Every shadow here has a story to be told', 'In the absence of light, we find our truth', 'The darkness is just another kind of youth'],
      ['I am the night that swallows everything', 'The silent scream no one hears me sing', 'Beautiful destruction in my veins', 'Dancing barefoot in the acid rain']
    ]
  },
  Hopeful: {
    Verse: [
      ['After every storm there comes a dawn', 'Even broken roads can lead you home', 'Plant a seed in the frozen ground', 'Spring will come, it always comes around'],
      ['The cracks let in the golden light', 'Stars are born from the darkest night', 'Every ending plants a seed', 'For the future that we\'ll need']
    ],
    Chorus: [
      ['Tomorrow holds what today can\'t see', 'There\'s a brand new version of you and me', 'Rise up from the ashes, spread your wings', 'Listen to the song that morning brings'],
      ['Hold on, hold on, the light is near', 'Every wound will heal, every wrong made clear', 'We are stronger than we know', 'The best is yet to come, let it show']
    ]
  },
  Euphoric: {
    Verse: [
      ['Electric pulse beneath my skin', 'The bass drops and we dive right in', 'Neon lights paint the crowd in gold', 'A million stories being told'],
      ['Higher than the satellites', 'We own the day, we own the nights', 'Frequencies align our souls', 'Music filling every hole']
    ],
    Chorus: [
      ['We\'re infinite, we\'re electric, we\'re gold', 'A story that never gets old', 'Hearts beating as one tonight', 'We are the fire, we are the light'],
      ['Take me higher, take me there', 'Hands reaching through electric air', 'This moment is forever, hold it tight', 'We\'re dancing at the edge of light']
    ]
  },
  Rebellious: {
    Verse: [
      ['They told me sit down, shut up, fall in line', 'I told them watch me burn, watch me shine', 'Your rules are chains disguised as crowns', 'I\'m tearing every system down'],
      ['Born in the static, raised in the noise', 'I don\'t play by your rules, I don\'t play with your toys', 'The establishment is crumbling', 'Can you hear the future coming']
    ],
    Chorus: [
      ['We are the ones they couldn\'t control', 'Fire running through our soul', 'Break the walls, rewrite the code', 'We\'re taking back the open road'],
      ['Rise up, rise up, the time is now', 'We won\'t bow, we won\'t bow', 'The revolution starts with a sound', 'Watch us shake the solid ground']
    ]
  }
};

const METAPHOR_TEMPLATES = [
  '{a} is a {b} waiting to be opened',
  '{a} runs through my veins like {b} through rivers',
  'My {a} is a {b} in the storm',
  'You are the {b} to my {a}',
  'Like {b} in the {a}, we are beautiful and wild',
  '{a} burns like {b} on a winter night',
  'Every {a} is a {b} in disguise',
  'The {a} of your love is a {b} I can\'t escape',
  'We built our {a} from {b} and stardust',
  'Your {a} is the {b} that lights my way',
  '{a} and {b} collide inside my chest',
  'I carry your {a} like a {b} in my pocket',
  '{a} bleeds into {b} when you say my name',
  'The world is a {b} and we are the {a}',
  '{a} tastes like {b} on your lips'
];

const METAPHOR_WORDS = {
  nouns: ['ocean','fire','storm','mountain','river','shadow','mirror','garden','clock','bridge','candle','star','moon','thunder','rain','wildflower','labyrinth','symphony','desert','compass','anchor','key','door','window','flame','ghost','echo','whisper','wave','forest','diamond','crown','thorn','velvet','silk','iron','glass','bone','seed','root','cloud','lightning','tide','horizon','galaxy','void','ember','cage','wound','song'],
  concepts: ['love','time','heart','memory','dream','hope','fear','truth','silence','darkness','freedom','desire','grief','joy','rage','peace','loneliness','belonging','faith','doubt','passion','wonder','regret','courage','vulnerability','strength','wisdom','innocence','experience','surrender','resistance','forgiveness','obsession','devotion','longing','healing']
};

class SongWriterApp {
  constructor(container) {
    this.container = container;
    this.element = null;
    this._styleEl = null;
    this.view = 'setup'; // setup, structure, lyrics, chords, rhyme, export
    this.project = {
      title: '', genre: 'Pop', key: 'C', minor: false,
      tempo: 120, mood: 'Happy', theme: '',
      sections: ['Verse','Chorus','Verse','Chorus','Bridge','Chorus'],
      lyrics: {}, chords: {}
    };
  }

  render() {
    this._injectStyles();
    this.element = document.createElement('div');
    this.element.className = 'song-app';
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
      .song-app {
        width: 100%; height: 100%; overflow-y: auto;
        background: rgba(10,5,15,0.97); color: #e0d0e8;
        font-family: 'Georgia', serif; padding: 20px;
        box-sizing: border-box;
      }
      .song-header { text-align: center; margin-bottom: 14px; }
      .song-title-h {
        font-size: 26px; color: #ff1493; margin: 0 0 4px 0;
        text-shadow: 0 0 20px #ff003c; letter-spacing: 2px;
      }
      .song-subtitle { color: #a080b0; font-style: italic; font-size: 13px; margin: 0; }
      .song-nav {
        display: flex; flex-wrap: wrap; justify-content: center;
        gap: 6px; margin-bottom: 18px;
      }
      .song-nav-btn {
        padding: 7px 16px; border-radius: 18px;
        background: rgba(255,20,147,0.06);
        border: 1px solid rgba(255,20,147,0.15);
        color: #a080b0; font-size: 12px;
        cursor: pointer; transition: all 0.3s;
        font-family: inherit;
      }
      .song-nav-btn:hover { background: rgba(255,20,147,0.12); }
      .song-nav-btn.active {
        background: rgba(255,20,147,0.18);
        border-color: #ff1493; color: #ff1493;
      }
      .song-panel {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,20,147,0.1);
        border-radius: 16px; padding: 24px;
        backdrop-filter: blur(8px);
        max-width: 800px; margin: 0 auto;
      }
      .song-form-row {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 12px; margin-bottom: 12px;
      }
      .song-form-group { margin-bottom: 12px; }
      .song-label {
        display: block; font-size: 12px;
        color: #ff1493; margin-bottom: 4px;
        letter-spacing: 1px;
      }
      .song-input, .song-select, .song-textarea {
        width: 100%; padding: 10px 14px;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,20,147,0.2);
        border-radius: 8px; color: #e0d0e8;
        font-size: 13px; font-family: inherit;
        outline: none; box-sizing: border-box;
      }
      .song-input:focus, .song-select:focus, .song-textarea:focus {
        border-color: #ff1493;
        box-shadow: 0 0 8px rgba(255,20,147,0.2);
      }
      .song-select option { background: #1a0a2e; }
      .song-textarea { min-height: 120px; resize: vertical; line-height: 1.6; }
      .song-btn {
        padding: 8px 20px; border-radius: 18px;
        background: linear-gradient(135deg, #ff003c, #ff1493);
        border: none; color: #fff; font-size: 13px;
        font-weight: bold; cursor: pointer;
        box-shadow: 0 0 12px rgba(255,0,60,0.3);
        transition: all 0.3s; font-family: inherit;
        margin: 4px;
      }
      .song-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 15px rgba(255,0,60,0.4); }
      .song-btn-sm {
        padding: 5px 12px; font-size: 11px;
        background: rgba(255,20,147,0.1);
        border: 1px solid rgba(255,20,147,0.25);
        box-shadow: none;
      }
      .song-btn-sm:hover { background: rgba(255,20,147,0.2); }
      .song-section-block {
        background: rgba(255,20,147,0.04);
        border: 1px solid rgba(255,20,147,0.12);
        border-radius: 10px; padding: 14px;
        margin-bottom: 10px; position: relative;
      }
      .song-section-header {
        display: flex; justify-content: space-between;
        align-items: center; margin-bottom: 8px;
      }
      .song-section-label {
        font-size: 13px; color: #ff1493;
        font-weight: bold;
      }
      .song-section-controls { display: flex; gap: 4px; }
      .song-lyric-line {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 4px;
      }
      .song-lyric-text {
        flex: 1; padding: 6px 10px;
        background: rgba(0,0,0,0.3);
        border: 1px solid rgba(255,20,147,0.1);
        border-radius: 6px; color: #e0d0e8;
        font-size: 13px; font-family: inherit;
        outline: none;
      }
      .song-lyric-text:focus { border-color: #ff1493; }
      .song-syllable-count {
        font-size: 10px; color: #7a5a8a;
        min-width: 24px; text-align: center;
      }
      .song-chord-display {
        display: flex; flex-wrap: wrap; gap: 8px;
        margin: 8px 0;
      }
      .song-chord {
        padding: 6px 14px; border-radius: 8px;
        background: rgba(255,20,147,0.08);
        border: 1px solid rgba(255,20,147,0.2);
        color: #ff1493; font-size: 14px;
        font-weight: bold;
      }
      .song-rhyme-results {
        display: flex; flex-wrap: wrap; gap: 6px;
        margin-top: 10px;
      }
      .song-rhyme-word {
        padding: 4px 12px; border-radius: 12px;
        background: rgba(255,20,147,0.08);
        border: 1px solid rgba(255,20,147,0.15);
        font-size: 12px; color: #c8a0d8;
      }
      .song-template-list {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 8px; margin-bottom: 16px;
      }
      .song-template-item {
        padding: 10px; border-radius: 10px;
        background: rgba(255,20,147,0.04);
        border: 1px solid rgba(255,20,147,0.12);
        cursor: pointer; transition: all 0.3s;
        text-align: center;
      }
      .song-template-item:hover {
        border-color: #ff1493;
        background: rgba(255,20,147,0.08);
      }
      .song-template-name { font-size: 13px; color: #ff1493; margin-bottom: 4px; }
      .song-template-sections { font-size: 10px; color: #7a5a8a; }
      .song-export-area {
        background: rgba(0,0,0,0.5);
        border: 1px solid rgba(255,20,147,0.15);
        border-radius: 10px; padding: 20px;
        font-family: 'Courier New', monospace;
        font-size: 13px; color: #c8a0d8;
        white-space: pre-wrap; line-height: 1.6;
        max-height: 500px; overflow-y: auto;
      }
      .song-center { text-align: center; }
      .song-key-toggle {
        display: flex; align-items: center; gap: 8px;
      }
      .song-key-toggle input { accent-color: #ff1493; }
    `;
    document.head.appendChild(this._styleEl);
  }

  _renderUI() {
    this.element.innerHTML = `
      <div class="song-header">
        <h1 class="song-title-h">✦ Song Writer ✦</h1>
        <p class="song-subtitle">Craft your masterpiece — lyrics, chords, and structure</p>
      </div>
      <div class="song-nav">
        <button class="song-nav-btn${this.view === 'setup' ? ' active' : ''}" data-view="setup">⚙ Setup</button>
        <button class="song-nav-btn${this.view === 'structure' ? ' active' : ''}" data-view="structure">📐 Structure</button>
        <button class="song-nav-btn${this.view === 'lyrics' ? ' active' : ''}" data-view="lyrics">✎ Lyrics</button>
        <button class="song-nav-btn${this.view === 'chords' ? ' active' : ''}" data-view="chords">🎵 Chords</button>
        <button class="song-nav-btn${this.view === 'rhyme' ? ' active' : ''}" data-view="rhyme">📖 Rhyme</button>
        <button class="song-nav-btn${this.view === 'metaphor' ? ' active' : ''}" data-view="metaphor">💡 Metaphor</button>
        <button class="song-nav-btn${this.view === 'export' ? ' active' : ''}" data-view="export">📤 Export</button>
      </div>
      <div class="song-panel" id="song-content"></div>
    `;

    this.element.querySelectorAll('.song-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.view = btn.dataset.view;
        this.element.querySelectorAll('.song-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._renderView();
      });
    });

    this._renderView();
  }

  _renderView() {
    switch (this.view) {
      case 'setup': this._renderSetup(); break;
      case 'structure': this._renderStructure(); break;
      case 'lyrics': this._renderLyrics(); break;
      case 'chords': this._renderChords(); break;
      case 'rhyme': this._renderRhyme(); break;
      case 'metaphor': this._renderMetaphor(); break;
      case 'export': this._renderExport(); break;
    }
  }

  _renderSetup() {
    const content = this.element.querySelector('#song-content');
    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 16px 0;">Project Setup</h3>
      <div class="song-form-group">
        <label class="song-label">SONG TITLE</label>
        <input type="text" class="song-input" id="sw-title" value="${this.project.title}" placeholder="Enter your song title..." />
      </div>
      <div class="song-form-row">
        <div class="song-form-group">
          <label class="song-label">GENRE</label>
          <select class="song-select" id="sw-genre">
            ${GENRES.map(g => `<option${this.project.genre === g ? ' selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="song-form-group">
          <label class="song-label">TEMPO (BPM)</label>
          <input type="number" class="song-input" id="sw-tempo" value="${this.project.tempo}" min="40" max="240" />
        </div>
      </div>
      <div class="song-form-row">
        <div class="song-form-group">
          <label class="song-label">KEY</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <select class="song-select" id="sw-key" style="flex:1;">
              ${KEYS.map(k => `<option${this.project.key === k ? ' selected' : ''}>${k}</option>`).join('')}
            </select>
            <div class="song-key-toggle">
              <input type="checkbox" id="sw-minor" ${this.project.minor ? 'checked' : ''} />
              <label for="sw-minor" style="color:#c8a0d8;font-size:12px;">minor</label>
            </div>
          </div>
        </div>
        <div class="song-form-group">
          <label class="song-label">MOOD</label>
          <select class="song-select" id="sw-mood">
            ${MOODS.map(m => `<option${this.project.mood === m ? ' selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="song-form-group">
        <label class="song-label">THEME / KEYWORDS</label>
        <input type="text" class="song-input" id="sw-theme" value="${this.project.theme}" placeholder="love, loss, freedom, rebellion..." />
      </div>
    `;

    // Bind inputs
    const bind = (id, prop) => {
      content.querySelector(`#${id}`).addEventListener('input', (e) => {
        this.project[prop] = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
      });
      content.querySelector(`#${id}`).addEventListener('change', (e) => {
        this.project[prop] = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
      });
    };
    bind('sw-title', 'title');
    bind('sw-genre', 'genre');
    bind('sw-tempo', 'tempo');
    bind('sw-key', 'key');
    bind('sw-mood', 'mood');
    bind('sw-theme', 'theme');
    content.querySelector('#sw-minor').addEventListener('change', (e) => { this.project.minor = e.target.checked; });
  }

  _renderStructure() {
    const content = this.element.querySelector('#song-content');
    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 12px 0;">Song Structure</h3>
      <div style="margin-bottom:12px;">
        <label class="song-label">TEMPLATES</label>
        <div class="song-template-list">
          ${SONG_TEMPLATES.map(t => `
            <div class="song-template-item" data-template="${t.name}">
              <div class="song-template-name">${t.name}</div>
              <div class="song-template-sections">${t.sections.length} sections</div>
            </div>
          `).join('')}
        </div>
      </div>
      <label class="song-label">CURRENT STRUCTURE</label>
      <div id="sw-structure-list"></div>
      <div style="margin-top:12px;">
        <select class="song-select" id="sw-add-section-type" style="width:auto;display:inline-block;margin-right:8px;">
          ${SECTION_TYPES.map(s => `<option>${s}</option>`).join('')}
        </select>
        <button class="song-btn song-btn-sm" id="sw-add-section">+ Add Section</button>
      </div>
    `;

    this._renderStructureList();

    // Template clicks
    content.querySelectorAll('.song-template-item').forEach(item => {
      item.addEventListener('click', () => {
        const template = SONG_TEMPLATES.find(t => t.name === item.dataset.template);
        if (template) {
          this.project.sections = [...template.sections];
          this._renderStructureList();
        }
      });
    });

    // Add section
    content.querySelector('#sw-add-section').addEventListener('click', () => {
      const type = content.querySelector('#sw-add-section-type').value;
      this.project.sections.push(type);
      this._renderStructureList();
    });
  }

  _renderStructureList() {
    const listEl = this.element.querySelector('#sw-structure-list');
    if (!listEl) return;
    listEl.innerHTML = this.project.sections.map((s, i) => `
      <div class="song-section-block">
        <div class="song-section-header">
          <span class="song-section-label">${i + 1}. ${s}</span>
          <div class="song-section-controls">
            <button class="song-btn song-btn-sm" data-action="up" data-idx="${i}" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="song-btn song-btn-sm" data-action="down" data-idx="${i}" ${i === this.project.sections.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="song-btn song-btn-sm" data-action="remove" data-idx="${i}">✕</button>
          </div>
        </div>
      </div>
    `).join('');

    listEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        if (btn.dataset.action === 'up' && idx > 0) {
          [this.project.sections[idx], this.project.sections[idx-1]] = [this.project.sections[idx-1], this.project.sections[idx]];
        } else if (btn.dataset.action === 'down' && idx < this.project.sections.length - 1) {
          [this.project.sections[idx], this.project.sections[idx+1]] = [this.project.sections[idx+1], this.project.sections[idx]];
        } else if (btn.dataset.action === 'remove') {
          this.project.sections.splice(idx, 1);
        }
        this._renderStructureList();
      });
    });
  }

  _renderLyrics() {
    const content = this.element.querySelector('#song-content');
    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 12px 0;">Lyric Writer</h3>
      <div style="margin-bottom:12px;">
        <label class="song-label">RHYME SCHEME</label>
        <select class="song-select" id="sw-rhyme-scheme" style="width:auto;">
          <option>AABB</option><option>ABAB</option><option>ABCB</option><option>AAAA</option><option>Free</option>
        </select>
      </div>
      <div id="sw-lyrics-sections"></div>
    `;

    const sectionsEl = content.querySelector('#sw-lyrics-sections');
    this.project.sections.forEach((section, sIdx) => {
      const lyrics = this.project.lyrics[sIdx] || [];
      const sectionEl = document.createElement('div');
      sectionEl.className = 'song-section-block';

      let linesHtml = '';
      lyrics.forEach((line, lIdx) => {
        const syllables = this._countSyllables(line);
        linesHtml += `
          <div class="song-lyric-line">
            <input type="text" class="song-lyric-text" value="${line}" data-section="${sIdx}" data-line="${lIdx}" />
            <span class="song-syllable-count">${syllables}</span>
          </div>
        `;
      });

      sectionEl.innerHTML = `
        <div class="song-section-header">
          <span class="song-section-label">${section}</span>
          <div class="song-section-controls">
            <button class="song-btn song-btn-sm" data-gen="${sIdx}">✦ Generate</button>
            <button class="song-btn song-btn-sm" data-addline="${sIdx}">+ Line</button>
          </div>
        </div>
        <div class="sw-section-lines" data-sidx="${sIdx}">${linesHtml}</div>
      `;
      sectionsEl.appendChild(sectionEl);
    });

    // Generate lyrics
    sectionsEl.querySelectorAll('[data-gen]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sIdx = parseInt(btn.dataset.gen);
        this._generateLyrics(sIdx);
        this._renderLyrics();
      });
    });

    // Add line
    sectionsEl.querySelectorAll('[data-addline]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sIdx = parseInt(btn.dataset.addline);
        if (!this.project.lyrics[sIdx]) this.project.lyrics[sIdx] = [];
        this.project.lyrics[sIdx].push('');
        this._renderLyrics();
      });
    });

    // Lyric input changes
    sectionsEl.querySelectorAll('.song-lyric-text').forEach(input => {
      input.addEventListener('input', (e) => {
        const sIdx = parseInt(e.target.dataset.section);
        const lIdx = parseInt(e.target.dataset.line);
        if (!this.project.lyrics[sIdx]) this.project.lyrics[sIdx] = [];
        this.project.lyrics[sIdx][lIdx] = e.target.value;
        // Update syllable count
        const countEl = e.target.parentElement.querySelector('.song-syllable-count');
        if (countEl) countEl.textContent = this._countSyllables(e.target.value);
      });
    });
  }

  _generateLyrics(sectionIdx) {
    const section = this.project.sections[sectionIdx];
    const mood = this.project.mood;
    const templates = LYRIC_TEMPLATES[mood];

    let lines;
    if (templates && templates[section]) {
      const pool = templates[section];
      lines = pool[Math.floor(Math.random() * pool.length)];
    } else {
      // Generate generic lines based on section type
      lines = this._generateGenericLines(section, mood);
    }

    this.project.lyrics[sectionIdx] = [...lines];
  }

  _generateGenericLines(section, mood) {
    const themes = this.project.theme.split(',').map(t => t.trim()).filter(Boolean);
    const themeWord = themes.length > 0 ? themes[Math.floor(Math.random() * themes.length)] : 'love';

    const linePools = {
      Verse: [
        `Walking through the echoes of ${themeWord}`,
        `Every step reminds me of what we had`,
        `The silence speaks louder than words`,
        `I carry this weight wherever I go`
      ],
      'Pre-Chorus': [
        `And I can feel it building up inside`,
        `Something's about to break`,
        `Hold on, hold on just a little longer`,
        `Before the sky comes falling down`
      ],
      Chorus: [
        `This is the ${themeWord} song I've been trying to sing`,
        `Every note, every word, everything`,
        `We're caught between the fire and the rain`,
        `Dancing in the space between the pain`
      ],
      Bridge: [
        `Maybe in another life, another time`,
        `We would've gotten the rhythm right`,
        `But here we stand at the edge of night`,
        `Still reaching for the fading light`
      ],
      Outro: [
        `Fade away, fade away, like a distant song`,
        `The echoes of ${themeWord} carry on`,
        `Into the silence, into the dawn`,
        `Until we meet again`
      ]
    };

    return linePools[section] || linePools['Verse'];
  }

  _countSyllables(word) {
    if (!word || !word.trim()) return 0;
    word = word.toLowerCase().replace(/[^a-z\s]/g, '');
    const words = word.split(/\s+/);
    let total = 0;
    words.forEach(w => {
      if (w.length <= 3) { total += 1; return; }
      w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
      w = w.replace(/^y/, '');
      const matches = w.match(/[aeiouy]{1,2}/g);
      total += matches ? matches.length : 1;
    });
    return total;
  }

  _renderChords() {
    const content = this.element.querySelector('#song-content');
    const genre = this.project.genre;
    const progressions = CHORD_PROGRESSIONS[genre] || CHORD_PROGRESSIONS['Pop'];
    const keyIdx = KEYS.indexOf(this.project.key);

    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 12px 0;">Chord Progressions</h3>
      <p style="color:#a080b0;font-size:13px;margin-bottom:16px;">Key: ${this.project.key}${this.project.minor ? ' minor' : ' major'} | Genre: ${genre}</p>
      <div id="sw-chord-list"></div>
    `;

    const listEl = content.querySelector('#sw-chord-list');
    progressions.forEach((prog, pIdx) => {
      const chordNames = prog.intervals.map(i => this._getChordName(keyIdx, i, this.project.minor));
      const el = document.createElement('div');
      el.className = 'song-section-block';
      el.innerHTML = `
        <div class="song-section-header">
          <span class="song-section-label">${prog.name}</span>
          <button class="song-btn song-btn-sm" data-assign="${pIdx}">Assign to Sections</button>
        </div>
        <div class="song-chord-display">
          ${chordNames.map(c => `<span class="song-chord">${c}</span>`).join('')}
        </div>
      `;
      listEl.appendChild(el);
    });

    listEl.querySelectorAll('[data-assign]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pIdx = parseInt(btn.dataset.assign);
        const prog = progressions[pIdx];
        const chordNames = prog.intervals.map(i => this._getChordName(keyIdx, i, this.project.minor));
        this.project.sections.forEach((_, sIdx) => {
          this.project.chords[sIdx] = chordNames;
        });
      });
    });
  }

  _getChordName(keyIdx, interval, minor) {
    const scale = minor
      ? [0, 2, 3, 5, 7, 8, 10]  // natural minor
      : [0, 2, 4, 5, 7, 9, 11]; // major
    const noteIdx = (keyIdx + scale[interval % 7]) % 12;
    const suffix = minor
      ? ['', 'dim', '', 'm', 'm', '', ''][interval % 7] || ''
      : ['', 'm', 'm', '', '', 'm', 'dim'][interval % 7] || '';
    return KEYS[noteIdx] + suffix;
  }

  _renderRhyme() {
    const content = this.element.querySelector('#song-content');
    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 12px 0;">Rhyme Dictionary</h3>
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <input type="text" class="song-input" id="sw-rhyme-input" placeholder="Enter a word to find rhymes..." style="flex:1;" />
        <button class="song-btn" id="sw-rhyme-search">Search</button>
      </div>
      <div id="sw-rhyme-results"></div>
      <div style="margin-top:20px;">
        <label class="song-label">BROWSE RHYME FAMILIES</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
          ${Object.keys(RHYME_FAMILIES).map(f => `<button class="song-btn song-btn-sm" data-family="${f}">${f}</button>`).join('')}
        </div>
      </div>
      <div id="sw-rhyme-family-results" style="margin-top:12px;"></div>
    `;

    const search = () => {
      const word = content.querySelector('#sw-rhyme-input').value.toLowerCase().trim();
      if (!word) return;
      const resultsEl = content.querySelector('#sw-rhyme-results');
      const rhymes = this._findRhymes(word);
      if (rhymes.length === 0) {
        resultsEl.innerHTML = '<p style="color:#7a5a8a;font-style:italic;">No rhymes found. Try a different word.</p>';
      } else {
        resultsEl.innerHTML = `<p style="color:#a080b0;font-size:13px;">Rhymes for <span style="color:#ff1493;">${word}</span>:</p>
          <div class="song-rhyme-results">${rhymes.map(r => `<span class="song-rhyme-word">${r}</span>`).join('')}</div>`;
      }
    };

    content.querySelector('#sw-rhyme-search').addEventListener('click', search);
    content.querySelector('#sw-rhyme-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') search(); });

    content.querySelectorAll('[data-family]').forEach(btn => {
      btn.addEventListener('click', () => {
        const family = RHYME_FAMILIES[btn.dataset.family];
        const resultEl = content.querySelector('#sw-rhyme-family-results');
        resultEl.innerHTML = `<p style="color:#a080b0;font-size:13px;">Family: <span style="color:#ff1493;">${btn.dataset.family}</span></p>
          <div class="song-rhyme-results">${family.map(w => `<span class="song-rhyme-word">${w}</span>`).join('')}</div>`;
      });
    });
  }

  _findRhymes(word) {
    const results = new Set();
    const wordEnd = word.slice(-3);
    Object.values(RHYME_FAMILIES).forEach(family => {
      if (family.some(w => w === word || w.endsWith(wordEnd))) {
        family.forEach(w => { if (w !== word) results.add(w); });
      }
    });
    return [...results].slice(0, 30);
  }

  _renderMetaphor() {
    const content = this.element.querySelector('#song-content');
    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 12px 0;">Metaphor Generator</h3>
      <div class="song-form-row">
        <div class="song-form-group">
          <label class="song-label">CONCEPT A</label>
          <input type="text" class="song-input" id="sw-meta-a" placeholder="e.g., love, time, heart..." />
        </div>
        <div class="song-form-group">
          <label class="song-label">CONCEPT B</label>
          <input type="text" class="song-input" id="sw-meta-b" placeholder="e.g., fire, river, storm..." />
        </div>
      </div>
      <div class="song-center">
        <button class="song-btn" id="sw-meta-generate">✦ Generate Metaphors</button>
        <button class="song-btn song-btn-sm" id="sw-meta-random">Random Concepts</button>
      </div>
      <div id="sw-meta-results" style="margin-top:16px;"></div>
    `;

    content.querySelector('#sw-meta-generate').addEventListener('click', () => {
      const a = content.querySelector('#sw-meta-a').value || METAPHOR_WORDS.concepts[Math.floor(Math.random() * METAPHOR_WORDS.concepts.length)];
      const b = content.querySelector('#sw-meta-b').value || METAPHOR_WORDS.nouns[Math.floor(Math.random() * METAPHOR_WORDS.nouns.length)];
      this._generateMetaphors(a, b);
    });

    content.querySelector('#sw-meta-random').addEventListener('click', () => {
      const a = METAPHOR_WORDS.concepts[Math.floor(Math.random() * METAPHOR_WORDS.concepts.length)];
      const b = METAPHOR_WORDS.nouns[Math.floor(Math.random() * METAPHOR_WORDS.nouns.length)];
      content.querySelector('#sw-meta-a').value = a;
      content.querySelector('#sw-meta-b').value = b;
      this._generateMetaphors(a, b);
    });
  }

  _generateMetaphors(a, b) {
    const resultsEl = this.element.querySelector('#sw-meta-results');
    const shuffled = [...METAPHOR_TEMPLATES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    resultsEl.innerHTML = selected.map(t => {
      const line = t.replace(/\{a\}/g, a).replace(/\{b\}/g, b);
      return `<div class="song-section-block" style="padding:12px;margin-bottom:8px;">
        <p style="color:#c8a0d8;font-style:italic;margin:0;font-size:14px;">"${line}"</p>
      </div>`;
    }).join('');
  }

  _renderExport() {
    const content = this.element.querySelector('#song-content');
    const keySig = this.project.key + (this.project.minor ? 'm' : '');

    let exportText = `╔══════════════════════════════╗\n`;
    exportText += `  ${this.project.title || 'Untitled Song'}\n`;
    exportText += `╚══════════════════════════════╝\n\n`;
    exportText += `Genre: ${this.project.genre}\n`;
    exportText += `Key: ${keySig}\n`;
    exportText += `Tempo: ${this.project.tempo} BPM\n`;
    exportText += `Mood: ${this.project.mood}\n`;
    if (this.project.theme) exportText += `Theme: ${this.project.theme}\n`;
    exportText += `\n${'─'.repeat(40)}\n\n`;

    this.project.sections.forEach((section, i) => {
      exportText += `[${section}]\n`;
      if (this.project.chords[i]) {
        exportText += `| ${this.project.chords[i].join(' | ')} |\n`;
      }
      const lyrics = this.project.lyrics[i] || [];
      if (lyrics.length > 0) {
        lyrics.forEach(line => {
          exportText += `${line || '...'}\n`;
        });
      } else {
        exportText += `(no lyrics yet)\n`;
      }
      exportText += '\n';
    });

    content.innerHTML = `
      <h3 style="color:#ff1493;margin:0 0 12px 0;">Export Song</h3>
      <div class="song-center" style="margin-bottom:16px;">
        <button class="song-btn" id="sw-copy-btn">📋 Copy to Clipboard</button>
        <button class="song-btn" id="sw-download-btn">💾 Download .txt</button>
      </div>
      <div class="song-export-area" id="sw-export-text">${exportText}</div>
    `;

    content.querySelector('#sw-copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(exportText).then(() => {
        const btn = content.querySelector('#sw-copy-btn');
        btn.textContent = '✓ Copied!';
        setTimeout(() => { btn.textContent = '📋 Copy to Clipboard'; }, 2000);
      });
    });

    content.querySelector('#sw-download-btn').addEventListener('click', () => {
      const blob = new Blob([exportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.project.title || 'song'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

window.SongWriterApp = SongWriterApp;
