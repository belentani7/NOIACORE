/**
 * NEXUS OS — Trivia
 * Quiz game with 100+ questions across multiple categories.
 */
class Trivia {
  constructor(container) {
    this.container = container;
    this.questions = [
      // SCIENCE (25)
      {q:'What planet is known as the Red Planet?',a:['Mars','Venus','Jupiter','Saturn'],c:'SCIENCE'},
      {q:'What is the chemical symbol for gold?',a:['Au','Ag','Fe','Cu'],c:'SCIENCE'},
      {q:'How many bones are in the human body?',a:['206','205','207','208'],c:'SCIENCE'},
      {q:'What gas do plants absorb from the atmosphere?',a:['Carbon dioxide','Oxygen','Nitrogen','Hydrogen'],c:'SCIENCE'},
      {q:'What is the speed of light in km/s?',a:['300,000','150,000','500,000','200,000'],c:'SCIENCE'},
      {q:'What is the hardest natural substance?',a:['Diamond','Titanium','Quartz','Topaz'],c:'SCIENCE'},
      {q:'Which element has the atomic number 1?',a:['Hydrogen','Helium','Lithium','Carbon'],c:'SCIENCE'},
      {q:'What is the largest organ in the human body?',a:['Skin','Liver','Brain','Lungs'],c:'SCIENCE'},
      {q:'How many chromosomes do humans have?',a:['46','44','48','42'],c:'SCIENCE'},
      {q:'What force keeps us on the ground?',a:['Gravity','Magnetism','Friction','Inertia'],c:'SCIENCE'},
      {q:'What is the boiling point of water in Celsius?',a:['100','90','110','120'],c:'SCIENCE'},
      {q:'Which planet has the most moons?',a:['Saturn','Jupiter','Uranus','Neptune'],c:'SCIENCE'},
      {q:'What is the smallest unit of matter?',a:['Atom','Molecule','Electron','Quark'],c:'SCIENCE'},
      {q:'What vitamin does the sun provide?',a:['Vitamin D','Vitamin C','Vitamin A','Vitamin B'],c:'SCIENCE'},
      {q:'What is the pH of pure water?',a:['7','6','8','5'],c:'SCIENCE'},
      {q:'How many teeth does an adult human have?',a:['32','28','30','34'],c:'SCIENCE'},
      {q:'What is the center of an atom called?',a:['Nucleus','Core','Proton','Neutron'],c:'SCIENCE'},
      {q:'Which blood type is the universal donor?',a:['O-','A+','B-','AB+'],c:'SCIENCE'},
      {q:'What galaxy do we live in?',a:['Milky Way','Andromeda','Triangulum','Sombrero'],c:'SCIENCE'},
      {q:'What is the study of fossils called?',a:['Paleontology','Archaeology','Geology','Biology'],c:'SCIENCE'},
      {q:'What type of animal is a seahorse?',a:['Fish','Mammal','Reptile','Crustacean'],c:'SCIENCE'},
      {q:'What is the chemical formula for table salt?',a:['NaCl','KCl','CaCl','HCl'],c:'SCIENCE'},
      {q:'How many elements are in the periodic table?',a:['118','112','120','115'],c:'SCIENCE'},
      {q:'What is the largest mammal?',a:['Blue whale','Elephant','Giraffe','Hippo'],c:'SCIENCE'},
      {q:'What particle has a positive charge?',a:['Proton','Electron','Neutron','Photon'],c:'SCIENCE'},
      // TECHNOLOGY (25)
      {q:'What does CPU stand for?',a:['Central Processing Unit','Central Program Utility','Computer Personal Unit','Central Processor Unit'],c:'TECHNOLOGY'},
      {q:'What year was the iPhone first released?',a:['2007','2006','2008','2005'],c:'TECHNOLOGY'},
      {q:'What does HTML stand for?',a:['HyperText Markup Language','High Tech Modern Language','HyperTransfer Markup Language','Home Tool Markup Language'],c:'TECHNOLOGY'},
      {q:'Who founded Microsoft?',a:['Bill Gates','Steve Jobs','Mark Zuckerberg','Jeff Bezos'],c:'TECHNOLOGY'},
      {q:'What does RAM stand for?',a:['Random Access Memory','Read Access Memory','Rapid Access Memory','Run Access Memory'],c:'TECHNOLOGY'},
      {q:'What programming language is known as the backbone of the web?',a:['JavaScript','Python','Java','C++'],c:'TECHNOLOGY'},
      {q:'What does URL stand for?',a:['Uniform Resource Locator','Universal Resource Link','Unified Resource Locator','Universal Resource Locator'],c:'TECHNOLOGY'},
      {q:'What company makes the PlayStation?',a:['Sony','Microsoft','Nintendo','Sega'],c:'TECHNOLOGY'},
      {q:'What does GPU stand for?',a:['Graphics Processing Unit','General Processing Unit','Graphics Program Utility','Global Processing Unit'],c:'TECHNOLOGY'},
      {q:'What year was Google founded?',a:['1998','1996','2000','1994'],c:'TECHNOLOGY'},
      {q:'What does API stand for?',a:['Application Programming Interface','Advanced Program Integration','Automated Process Interface','Application Process Integration'],c:'TECHNOLOGY'},
      {q:'Who is the CEO of Tesla?',a:['Elon Musk','Jeff Bezos','Tim Cook','Sundar Pichai'],c:'TECHNOLOGY'},
      {q:'What does Wi-Fi stand for?',a:['Wireless Fidelity','Wide Frequency','Wired Fidelity','Wireless Frequency'],c:'TECHNOLOGY'},
      {q:'What is the most popular mobile OS?',a:['Android','iOS','Windows','Linux'],c:'TECHNOLOGY'},
      {q:'What does SSD stand for?',a:['Solid State Drive','Super Speed Drive','System Storage Device','Solid System Drive'],c:'TECHNOLOGY'},
      {q:'What language is used for iOS development?',a:['Swift','Java','Kotlin','Python'],c:'TECHNOLOGY'},
      {q:'What does IoT stand for?',a:['Internet of Things','Integration of Technology','Internet of Tech','Interface of Things'],c:'TECHNOLOGY'},
      {q:'What company created the Android OS?',a:['Google','Apple','Microsoft','Samsung'],c:'TECHNOLOGY'},
      {q:'What does HTTP stand for?',a:['HyperText Transfer Protocol','High Tech Transfer Protocol','HyperTransfer Text Protocol','Home Transfer Text Protocol'],c:'TECHNOLOGY'},
      {q:'What is the most used search engine?',a:['Google','Bing','Yahoo','DuckDuckGo'],c:'TECHNOLOGY'},
      {q:'What does USB stand for?',a:['Universal Serial Bus','Unified System Bus','Universal System Bridge','United Serial Bridge'],c:'TECHNOLOGY'},
      {q:'What year was Facebook launched?',a:['2004','2003','2005','2006'],c:'TECHNOLOGY'},
      {q:'What does CSS stand for?',a:['Cascading Style Sheets','Creative Style System','Computer Style Sheets','Cascading System Sheets'],c:'TECHNOLOGY'},
      {q:'Who invented the World Wide Web?',a:['Tim Berners-Lee','Bill Gates','Steve Wozniak','Vint Cerf'],c:'TECHNOLOGY'},
      {q:'What does AI stand for?',a:['Artificial Intelligence','Automated Intelligence','Advanced Integration','Artificial Integration'],c:'TECHNOLOGY'},
      // HISTORY (25)
      {q:'In what year did World War II end?',a:['1945','1944','1946','1943'],c:'HISTORY'},
      {q:'Who was the first President of the United States?',a:['George Washington','Thomas Jefferson','John Adams','Benjamin Franklin'],c:'HISTORY'},
      {q:'What year did the Titanic sink?',a:['1912','1910','1914','1908'],c:'HISTORY'},
      {q:'Who painted the Mona Lisa?',a:['Leonardo da Vinci','Michelangelo','Raphael','Donatello'],c:'HISTORY'},
      {q:'What ancient civilization built the pyramids?',a:['Egyptians','Romans','Greeks','Mayans'],c:'HISTORY'},
      {q:'In what year did the Berlin Wall fall?',a:['1989','1990','1988','1991'],c:'HISTORY'},
      {q:'Who discovered America in 1492?',a:['Christopher Columbus','Vasco da Gama','Ferdinand Magellan','Amerigo Vespucci'],c:'HISTORY'},
      {q:'What empire was ruled by Julius Caesar?',a:['Roman Empire','Greek Empire','Persian Empire','Ottoman Empire'],c:'HISTORY'},
      {q:'What year did man first walk on the moon?',a:['1969','1968','1970','1967'],c:'HISTORY'},
      {q:'Who wrote the Declaration of Independence?',a:['Thomas Jefferson','Benjamin Franklin','George Washington','John Adams'],c:'HISTORY'},
      {q:'What was the name of the ship that brought Pilgrims to America?',a:['Mayflower','Santa Maria','Victoria','Discovery'],c:'HISTORY'},
      {q:'In what year was the United Nations founded?',a:['1945','1946','1944','1948'],c:'HISTORY'},
      {q:'Who was known as the Maid of Orleans?',a:['Joan of Arc','Marie Antoinette','Queen Victoria','Cleopatra'],c:'HISTORY'},
      {q:'What war was fought between the North and South in the US?',a:['Civil War','Revolutionary War','War of 1812','Mexican War'],c:'HISTORY'},
      {q:'Who was the first man to circumnavigate the globe?',a:['Ferdinand Magellan','Christopher Columbus','Vasco da Gama','Francis Drake'],c:'HISTORY'},
      {q:'What year did the French Revolution begin?',a:['1789','1776','1799','1780'],c:'HISTORY'},
      {q:'Who was the longest-reigning British monarch before Queen Elizabeth II?',a:['Queen Victoria','King George III','King Henry VIII','King Edward VII'],c:'HISTORY'},
      {q:'What ancient city was buried by Mount Vesuvius?',a:['Pompeii','Rome','Athens','Carthage'],c:'HISTORY'},
      {q:'Who invented the telephone?',a:['Alexander Graham Bell','Thomas Edison','Nikola Tesla','Guglielmo Marconi'],c:'HISTORY'},
      {q:'What year did World War I begin?',a:['1914','1915','1913','1916'],c:'HISTORY'},
      {q:'Who was the first woman to fly solo across the Atlantic?',a:['Amelia Earhart','Harriet Quimby','Bessie Coleman','Jacqueline Cochran'],c:'HISTORY'},
      {q:'What empire was Genghis Khan the leader of?',a:['Mongol Empire','Ottoman Empire','Roman Empire','Persian Empire'],c:'HISTORY'},
      {q:'In what year was the Magna Carta signed?',a:['1215','1216','1214','1220'],c:'HISTORY'},
      {q:'Who was the first Emperor of Rome?',a:['Augustus','Julius Caesar','Nero','Caligula'],c:'HISTORY'},
      {q:'What country gifted the Statue of Liberty to the US?',a:['France','England','Spain','Italy'],c:'HISTORY'},
      // ENTERTAINMENT (25)
      {q:'What is the highest-grossing film of all time?',a:['Avatar','Avengers: Endgame','Titanic','Star Wars'],c:'ENTERTAINMENT'},
      {q:'Who played Jack in Titanic?',a:['Leonardo DiCaprio','Brad Pitt','Tom Cruise','Johnny Depp'],c:'ENTERTAINMENT'},
      {q:'What band performed Bohemian Rhapsody?',a:['Queen','The Beatles','Led Zeppelin','Pink Floyd'],c:'ENTERTAINMENT'},
      {q:'What is the name of Harry Potters owl?',a:['Hedwig','Errol','Pigwidgeon','Scabbers'],c:'ENTERTAINMENT'},
      {q:'Who directed Jurassic Park?',a:['Steven Spielberg','James Cameron','George Lucas','Ridley Scott'],c:'ENTERTAINMENT'},
      {q:'What TV show features dragons and the Iron Throne?',a:['Game of Thrones','The Witcher','Vikings','Lord of the Rings'],c:'ENTERTAINMENT'},
      {q:'Who is the voice of Woody in Toy Story?',a:['Tom Hanks','Tim Allen','Billy Crystal','Robin Williams'],c:'ENTERTAINMENT'},
      {q:'What superhero is also known as the Dark Knight?',a:['Batman','Superman','Spider-Man','Iron Man'],c:'ENTERTAINMENT'},
      {q:'What album is the song Thriller from?',a:['Thriller','Bad','Off the Wall','Dangerous'],c:'ENTERTAINMENT'},
      {q:'Who wrote Romeo and Juliet?',a:['William Shakespeare','Charles Dickens','Jane Austen','Mark Twain'],c:'ENTERTAINMENT'},
      {q:'What is the name of the fictional country in Black Panther?',a:['Wakanda','Zamunda','Genosha','Latveria'],c:'ENTERTAINMENT'},
      {q:'Who sang Like a Virgin?',a:['Madonna','Whitney Houston','Cyndi Lauper','Cher'],c:'ENTERTAINMENT'},
      {q:'What movie features the quote I see dead people?',a:['The Sixth Sense','Ghost','The Others','Poltergeist'],c:'ENTERTAINMENT'},
      {q:'Who plays Iron Man in the MCU?',a:['Robert Downey Jr.','Chris Evans','Chris Hemsworth','Mark Ruffalo'],c:'ENTERTAINMENT'},
      {q:'What is the name of the toy cowboy in Toy Story?',a:['Woody','Buzz','Jessie','Rex'],c:'ENTERTAINMENT'},
      {q:'Who directed Inception?',a:['Christopher Nolan','David Fincher','Denis Villeneuve','Ridley Scott'],c:'ENTERTAINMENT'},
      {q:'What band is Freddie Mercury associated with?',a:['Queen','The Rolling Stones','Led Zeppelin','The Who'],c:'ENTERTAINMENT'},
      {q:'What is the highest-grossing animated film?',a:['Frozen II','The Lion King','Finding Dory','Incredibles 2'],c:'ENTERTAINMENT'},
      {q:'Who wrote 1984?',a:['George Orwell','Aldous Huxley','Ray Bradbury','H.G. Wells'],c:'ENTERTAINMENT'},
      {q:'What movie won Best Picture at the 2020 Oscars?',a:['Parasite','1917','Joker','Once Upon a Time'],c:'ENTERTAINMENT'},
      {q:'Who plays Wolverine?',a:['Hugh Jackman','Russell Crowe','Chris Hemsworth','Liam Neeson'],c:'ENTERTAINMENT'},
      {q:'What is the name of Shreks donkey?',a:['Donkey','Dinky','Dobby','Doug'],c:'ENTERTAINMENT'},
      {q:'Who sang Smells Like Teen Spirit?',a:['Nirvana','Pearl Jam','Soundgarden','Alice in Chains'],c:'ENTERTAINMENT'},
      {q:'What is the most-watched Netflix series?',a:['Squid Game','Stranger Things','Money Heist','Bridgerton'],c:'ENTERTAINMENT'},
      {q:'Who directed Pulp Fiction?',a:['Quentin Tarantino','Martin Scorsese','David Lynch','Coen Brothers'],c:'ENTERTAINMENT'}
    ];
    this.currentQuestion = 0;
    this.score = 0;
    this.selectedCategory = 'ALL';
    this.filteredQuestions = [];
    this.gameOver = false;
    this.totalQuestions = 10;
    this.scores = { best: 0, games: 0 };
    this.storageKey = 'nexus_trivia_scores';
    this._loadScores();
  }

  render() {
    this._buildDOM();
    this._showMenu();
  }

  destroy() {
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  }

  _buildDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'trivia-wrapper';
    this.wrapper.innerHTML = `
      <div class="trivia-container">
        <h1 class="trivia-title">TRIVIA</h1>
        <div class="trivia-hud">
          <div class="trivia-stat">BEST: <span id="trivia-best">${this.scores.best}</span></div>
          <div class="trivia-stat">GAMES: <span id="trivia-games">${this.scores.games}</span></div>
        </div>
        <div id="trivia-content"></div>
      </div>
    `;
    this.container.appendChild(this.wrapper);
  }

  _showMenu() {
    const content = document.getElementById('trivia-content');
    const categories = ['ALL', ...new Set(this.questions.map(q => q.c))];
    content.innerHTML = `
      <div class="trivia-menu">
        <p class="trivia-subtitle">SELECT CATEGORY</p>
        <div class="trivia-categories">
          ${categories.map(c => `<button class="trivia-cat-btn" data-cat="${c}">${c}</button>`).join('')}
        </div>
      </div>
    `;
    content.querySelectorAll('.trivia-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => this._startGame(btn.dataset.cat));
    });
  }

  _startGame(category) {
    this.selectedCategory = category;
    this.filteredQuestions = category === 'ALL' ? [...this.questions] : this.questions.filter(q => q.c === category);
    this.filteredQuestions.sort(() => Math.random() - 0.5);
    this.filteredQuestions = this.filteredQuestions.slice(0, this.totalQuestions);
    this.currentQuestion = 0;
    this.score = 0;
    this.gameOver = false;
    this._showQuestion();
  }

  _showQuestion() {
    if (this.currentQuestion >= this.filteredQuestions.length) {
      this._endGame();
      return;
    }
    const q = this.filteredQuestions[this.currentQuestion];
    const content = document.getElementById('trivia-content');
    const shuffledAnswers = [...q.a].sort(() => Math.random() - 0.5);
    content.innerHTML = `
      <div class="trivia-question">
        <div class="trivia-progress">Question ${this.currentQuestion + 1}/${this.totalQuestions}</div>
        <div class="trivia-score">Score: ${this.score}</div>
        <p class="trivia-q">${q.q}</p>
        <div class="trivia-answers">
          ${shuffledAnswers.map(a => `<button class="trivia-answer-btn" data-answer="${a}">${a}</button>`).join('')}
        </div>
      </div>
    `;
    content.querySelectorAll('.trivia-answer-btn').forEach(btn => {
      btn.addEventListener('click', () => this._selectAnswer(btn.dataset.answer, q.a[0]));
    });
  }

  _selectAnswer(selected, correct) {
    const btns = document.querySelectorAll('.trivia-answer-btn');
    btns.forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.answer === correct) btn.classList.add('correct');
      if (btn.dataset.answer === selected && selected !== correct) btn.classList.add('wrong');
    });
    if (selected === correct) this.score++;
    setTimeout(() => {
      this.currentQuestion++;
      this._showQuestion();
    }, 1500);
  }

  _endGame() {
    this.gameOver = true;
    this.scores.games++;
    this.scores.best = Math.max(this.scores.best, this.score);
    this._saveScores();
    const content = document.getElementById('trivia-content');
    content.innerHTML = `
      <div class="trivia-results">
        <h2 class="trivia-result-title">GAME OVER</h2>
        <p class="trivia-result-score">${this.score}/${this.totalQuestions}</p>
        <p class="trivia-result-msg">${this.score === this.totalQuestions ? 'PERFECT!' : this.score >= 7 ? 'GREAT JOB!' : this.score >= 4 ? 'NOT BAD!' : 'KEEP TRYING!'}</p>
        <button class="trivia-btn" id="trivia-play-again">PLAY AGAIN</button>
        <button class="trivia-btn trivia-btn-secondary" id="trivia-menu">MAIN MENU</button>
      </div>
    `;
    document.getElementById('trivia-play-again').addEventListener('click', () => this._startGame(this.selectedCategory));
    document.getElementById('trivia-menu').addEventListener('click', () => this._showMenu());
    this._updateHUD();
  }

  _updateHUD() {
    document.getElementById('trivia-best').textContent = this.scores.best;
    document.getElementById('trivia-games').textContent = this.scores.games;
  }

  _loadScores() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) this.scores = JSON.parse(saved);
    } catch {}
  }

  _saveScores() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
    } catch {}
  }
}

window.Trivia = Trivia;
