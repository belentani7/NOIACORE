/**
 * NEXUS OS — App Registry
 * Master manifest of all registered applications.
 * Pure metadata — no logic, just registry data.
 */
(function () {
  const registry = {
    version: "1.0.0",
    generated: new Date().toISOString(),
    categories: [
      // ─────────────────────────────────────────────────────────────
      // 1. AI & MYSTIC
      // ─────────────────────────────────────────────────────────────
      {
        id: "ai-mystic",
        name: "AI & Mystic",
        icon: "✦",
        apps: [
          { id: "tarot", name: "Tarot Reader", icon: "🂠", description: "Three-card spreads, Celtic Cross and daily draws with neon glassmorphism visuals.", module: "/js/apps/ai/tarot.js", tags: ["divination","cards","daily"], featured: true },
          { id: "oracle", name: "Oracle AI", icon: "🔮", description: "Ask the oracle anything — ambient generative answers through a mystic lens.", module: "/js/apps/ai/oracle.js", tags: ["ai","chat","mystic"], featured: true },
          { id: "archetype", name: "Archetype Mirror", icon: "🎭", description: "Discover your Jungian archetype through an interactive questionnaire.", module: "/js/apps/ai/archetype.js", tags: ["psychology","personality"], featured: true },
          { id: "dream-analyzer", name: "Dream Analyzer", icon: "🌙", description: "Log dreams and extract symbols, themes and emotional vectors.", module: "/js/apps/ai/dream-analyzer.js", tags: ["dreams","journal","symbols"], featured: true },
          { id: "song-writer", name: "AI Song Writer", icon: "🎼", description: "Co-write lyrics, chord progressions and song structures with AI.", module: "/js/apps/ai/song-writer.js", tags: ["ai","music","lyrics"], featured: true },
          { id: "ai-chat", name: "Nexus Chat", icon: "💬", description: "General-purpose AI assistant with multi-model routing.", module: "/js/apps/ai/ai-chat.js", tags: ["ai","chat","assistant"], featured: true },
          { id: "horoscope", name: "Horoscope", icon: "♈", description: "Daily, weekly and monthly horoscopes for all 12 signs.", module: "/js/apps/ai/horoscope.js", tags: ["astrology","daily"], featured: true },
          { id: "numerology", name: "Numerology", icon: "🔢", description: "Life path, destiny and soul urge numbers from your birth data.", module: "/js/apps/ai/numerology.js", tags: ["numbers","mystic"], featured: true },
          { id: "i-ching", name: "I Ching", icon: "☯", description: "Ancient Chinese oracle — cast hexagrams and read judgments.", module: "/js/apps/ai/i-ching.js", tags: ["divination","eastern"], featured: false },
          { id: "runes", name: "Rune Cast", icon: "ᚱ", description: "Elder Futhark rune readings with interpretations.", module: "/js/apps/ai/runes.js", tags: ["divination","norse"], featured: false },
          { id: "palm-reader", name: "Palm Reader", icon: "🤚", description: "Upload a palm photo for AI-guided line analysis (entertainment).", module: "/js/apps/ai/palm-reader.js", tags: ["divination","vision"], featured: false },
          { id: "tea-leaves", name: "Tasseography", icon: "🍵", description: "Tea-leaf symbol recognition and fortune telling.", module: "/js/apps/ai/tea-leaves.js", tags: ["divination","symbols"], featured: false },
          { id: "aura-cam", name: "Aura Camera", icon: "🌈", description: "Webcam-based aura color estimation (for fun).", module: "/js/apps/ai/aura-cam.js", tags: ["vision","mystic"], featured: false },
          { id: "pendulum", name: "Digital Pendulum", icon: "⏳", description: "Virtual pendulum for yes/no divination questions.", module: "/js/apps/ai/pendulum.js", tags: ["divination"], featured: false },
          { id: "astro-chart", name: "Astro Chart", icon: "🪐", description: "Natal chart calculator with houses and aspects.", module: "/js/apps/ai/astro-chart.js", tags: ["astrology","chart"], featured: false },
          { id: "tarot-journal", name: "Tarot Journal", icon: "📓", description: "Log daily draws and track patterns over time.", module: "/js/apps/ai/tarot-journal.js", tags: ["journal","tarot"], featured: false }
        ]
      },

      // ─────────────────────────────────────────────────────────────
      // 2. MUSIC & AUDIO
      // ─────────────────────────────────────────────────────────────
      {
        id: "music-audio",
        name: "Music & Audio",
        icon: "♪",
        apps: [
          { id: "music-studio", name: "Music Studio", icon: "🎛️", description: "Full DAW-lite: multi-track recording, mixing and automation.", module: "/js/apps/music/music-studio.js", tags: ["daw","mixing","production"], featured: true },
          { id: "synth-lab", name: "Synth Lab", icon: "🎹", description: "Web Audio synthesizer with oscillators, filters and effects chains.", module: "/js/apps/music/synth-lab.js", tags: ["synth","webaudio"], featured: true },
          { id: "drum-machine", name: "Drum Machine", icon: "🥁", description: "16-step drum sequencer with sample loading and swing.", module: "/js/apps/music/drum-machine.js", tags: ["drums","sequencer"], featured: true },
          { id: "sequencer", name: "Step Sequencer", icon: "🎚️", description: "Polyphonic step sequencer with scale locking and MIDI out.", module: "/js/apps/music/sequencer.js", tags: ["sequencer","midi"], featured: true },
          { id: "voice-recorder", name: "Voice Recorder", icon: "🎙️", description: "Record, trim and export voice memos with waveform view.", module: "/js/apps/music/voice-recorder.js", tags: ["recording","voice"], featured: true },
          { id: "sampler", name: "Sampler", icon: "🎞️", description: "Chromatic sample player with pitch/ADSR per zone.", module: "/js/apps/music/sampler.js", tags: ["sampler","instrument"], featured: false },
          { id: "looper", name: "Looper", icon: "🔁", description: "Live audio looper with overdub and reverse.", module: "/js/apps/music/looper.js", tags: ["live","loop"], featured: false },
          { id: "tuner", name: "Instrument Tuner", icon: "📏", description: "Chromatic tuner using mic input with cents display.", module: "/js/apps/music/tuner.js", tags: ["utility","tuning"], featured: false },
          { id: "metronome", name: "Metronome", icon: "⏱️", description: "Precision metronome with accent patterns and tap tempo.", module: "/js/apps/music/metronome.js", tags: ["utility","tempo"], featured: false },
          { id: "spectrum", name: "Spectrum Analyzer", icon: "📊", description: "Real-time FFT spectrum view with peak hold.", module: "/js/apps/music/spectrum.js", tags: ["analysis","visualization"], featured: false },
          { id: "chord-dict", name: "Chord Dictionary", icon: "🎵", description: "Interactive chord library with voicings for guitar and keys.", module: "/js/apps/music/chord-dict.js", tags: ["reference","harmony"], featured: false },
          { id: "audio-editor", name: "Audio Editor", icon: "✂️", description: "Waveform editor with cut/copy/fade/normalize.", module: "/js/apps/music/audio-editor.js", tags: ["editing","waveform"], featured: false }
        ]
      },

      // ─────────────────────────────────────────────────────────────
      // 3. GAMES
      // ─────────────────────────────────────────────────────────────
      {
        id: "games",
        name: "Games",
        icon: "🎮",
        apps: [
          { id: "escape-room", name: "Escape Room", icon: "🔐", description: "Point-and-click escape-the-room puzzles with inventory system.", module: "/js/apps/games/escape-room.js", tags: ["puzzle","adventure"], featured: true },
          { id: "terminal-hacker", name: "Terminal Hacker", icon: "👾", description: "Hacking simulation game — crack passwords, breach mainframes.", module: "/js/apps/games/terminal-hacker.js", tags: ["simulation","hacking"], featured: true },
          { id: "neon-pong", name: "Neon Pong", icon: "🏓", description: "Classic pong with neon trails, power-ups and AI opponents.", module: "/js/apps/games/neon-pong.js", tags: ["arcade","retro"], featured: true },
          { id: "memory-game", name: "Memory Match", icon: "🧠", description: "Flip-card memory game with multiple difficulty levels.", module: "/js/apps/games/memory-game.js", tags: ["puzzle","casual"], featured: true },
          { id: "cyber-puzzle", name: "Cyber Puzzle", icon: "🧩", description: "Sliding tile puzzle with cyberpunk themed images.", module: "/js/apps/games/cyber-puzzle.js", tags: ["puzzle","sliding"], featured: true },
          { id: "snake", name: "Snake", icon: "🐍", description: "Classic snake with neon grid, walls and speed modes.", module: "/js/apps/games/snake.js", tags: ["arcade","retro"], featured: true },
          { id: "tetris", name: "Tetris", icon: "🟦", description: "Full tetris with hold, ghost piece, T-spins and scoring.", module: "/js/apps/games/tetris.js", tags: ["arcade","classic"], featured: true },
          { id: "chess", name: "Chess", icon: "♞", description: "Chess with AI opponent, move history and PGN export.", module: "/js/apps/games/chess.js", tags: ["strategy","classic"], featured: true },
          { id: "wordle", name: "Wordle", icon: "🔤", description: "Daily 5-letter word guessing game with stats.", module: "/js/apps/games/wordle.js", tags: ["word","daily"], featured: true },
          { id: "hangman", name: "Hangman", icon: "📝", description: "Word guessing with categories and streak tracking.", module: "/js/apps/games/hangman.js", tags: ["word","casual"], featured: false },
          { id: "trivia", name: "Trivia Arena", icon: "❓", description: "Multi-category trivia with timed rounds and leaderboards.", module: "/js/apps/games/trivia.js", tags: ["trivia","quiz"], featured: false },
          { id: "tic-tac-toe", name: "Tic Tac Toe", icon: "⭕", description: "Classic 3x3 with unbeatable AI and 5x5 variant.", module: "/js/apps/games/tic-tac-toe.js", tags: ["strategy","casual"], featured: false },
          { id: "connect-four", name: "Connect Four", icon: "🔴", description: "Drop discs, connect four — vs AI or local hotseat.", module: "/js/apps/games/connect-four.js", tags: ["strategy","classic"], featured: false },
          { id: "battleship", name: "Battleship", icon: "🚢", description: "Place ships, fire shots, sink the fleet vs AI.", module: "/js/apps/games/battleship.js", tags: ["strategy","classic"], featured: false },
          { id: "blackjack", name: "Blackjack", icon: "🃏", description: "Casino blackjack with chip bank and basic strategy hints.", module: "/js/apps/games/blackjack.js", tags: ["cards","casino"], featured: false },
          { id: "simon-says", name: "Simon Says", icon: "🟢", description: "Memory pattern game with escalating sequences.", module: "/js/apps/games/simon-says.js", tags: ["memory","arcade"], featured: false },
          { id: "breakout", name: "Breakout", icon: "🧱", description: "Brick breaker with power-ups, multi-ball and level editor.", module: "/js/apps/games/breakout.js", tags: ["arcade","retro"], featured: false },
          { id: "space-invaders", name: "Space Invaders", icon: "👽", description: "Defend Earth from descending alien waves.", module: "/js/apps/games/space-invaders.js", tags: ["arcade","shooter"], featured: false },
          { id: "minesweeper", name: "Minesweeper", icon: "💣", description: "Classic minesweeper with custom board sizes.", module: "/js/apps/games/minesweeper.js", tags: ["puzzle","classic"], featured: false },
          { id: "sudoku", name: "Sudoku", icon: "🔢", description: "Sudoku with hints, notes and difficulty levels.", module: "/js/apps/games/sudoku.js", tags: ["puzzle","numbers"], featured: false },
          { id: "2048", name: "2048", icon: "🧮", description: "Slide tiles, merge numbers, reach 2048.", module: "/js/apps/games/2048.js", tags: ["puzzle","numbers"], featured: false },
          { id: "solitaire", name: "Solitaire", icon: "♠️", description: "Klondike solitaire with draw-3 and undo.", module: "/js/apps/games/solitaire.js", tags: ["cards","classic"], featured: false },
          { id: "poker-dice", name: "Poker Dice", icon: "🎲", description: "Five-dice poker with hold and re-roll.", module: "/js/apps/games/poker-dice.js", tags: ["dice","casino"], featured: false },
          { id: "reaction-test", name: "Reaction Test", icon: "⚡", description: "Test your reflexes with visual and audio cues.", module: "/js/apps/games/reaction-test.js", tags: ["casual","skill"], featured: false },
          { id: "typing-racer", name: "Typing Racer", icon: "⌨️", description: "Type sentences fast to race your car to the finish.", module: "/js/apps/games/typing-racer.js", tags: ["skill","typing"], featured: false },
          { id: "maze-runner", name: "Maze Runner", icon: "🌀", description: "Procedurally generated mazes with fog of war.", module: "/js/apps/games/maze-runner.js", tags: ["puzzle","adventure"], featured: false },
          { id: "flappy-neon", name: "Flappy Neon", icon: "🕊️", description: "One-button flyer through neon pipes.", module: "/js/apps/games/flappy-neon.js", tags: ["arcade","casual"], featured: false },
          { id: "asteroids", name: "Asteroids", icon: "☄️", description: "Vector-style asteroids with thrust and shoot.", module: "/js/apps/games/asteroids.js", tags: ["arcade","retro"], featured: false },
          { id: "dungeon-crawl", name: "Dungeon Crawl", icon: "🗡️", description: "Roguelike dungeon explorer with turn-based combat.", module: "/js/apps/games/dungeon-crawl.js", tags: ["rpg","roguelike"], featured: false },
          { id: "tower-defense", name: "Tower Defense", icon: "🏰", description: "Place towers, upgrade, survive the waves.", module: "/js/apps/games/tower-defense.js", tags: ["strategy","tower-defense"], featured: false }
        ]
      },

      // ─────────────────────────────────────────────────────────────
      // 4. MEDIA & CREATIVE
      // ─────────────────────────────────────────────────────────────
      {
        id: "media-creative",
        name: "Media & Creative",
        icon: "🎨",
        apps: [
          { id: "video-player", name: "Video Player", icon: "▶️", description: "HTML5 video player with playlists, speed and subtitle support.", module: "/js/apps/media/video-player.js", tags: ["video","playback"], featured: true },
          { id: "image-viewer", name: "Image Viewer", icon: "🖼️", description: "Fast image viewer with zoom, pan and slideshow.", module: "/js/apps/media/image-viewer.js", tags: ["image","viewer"], featured: true },
          { id: "audio-visualizer", name: "Audio Visualizer", icon: "🌊", description: "Real-time audio visualizations: bars, waveform, radial.", module: "/js/apps/media/audio-visualizer.js", tags: ["audio","visualization"], featured: true },
          { id: "neon-photo-viewer", name: "Neon Photo Viewer", icon: "📸", description: "Photo viewer with neon filters, bloom and frame effects.", module: "/js/apps/media/neon-photo-viewer.js", tags: ["image","filters"], featured: true },
          { id: "glitch-art", name: "Glitch Art Studio", icon: "📺", description: "Apply databend and glitch effects to images in real time.", module: "/js/apps/media/glitch-art.js", tags: ["image","glitch","art"], featured: true },
          { id: "screen-recorder", name: "Screen Recorder", icon: "🎥", description: "Record screen or window to WebM with audio capture.", module: "/js/apps/media/screen-recorder.js", tags: ["video","recording"], featured: true },
          { id: "media-converter", name: "Media Converter", icon: "🔄", description: "Convert audio/image/video formats via ffmpeg.wasm.", module: "/js/apps/media/media-converter.js", tags: ["utility","conversion"], featured: true },
          { id: "qr-generator", name: "QR Generator", icon: "📱", description: "Generate QR codes for URLs, text, WiFi and vCards.", module: "/js/apps/media/qr-generator.js", tags: ["utility","qr"], featured: true },
          { id: "meme-generator", name: "Meme Generator", icon: "😂", description: "Add top/bottom text to templates or custom images.", module: "/js/apps/media/meme-generator.js", tags: ["image","fun"], featured: true },
          { id: "pixel-art", name: "Pixel Art Studio", icon: "👾", description: "Pixel canvas with palette, onion skin and GIF export.", module: "/js/apps/media/pixel-art.js", tags: ["art","pixel","animation"], featured: true },
          { id: "svg-editor", name: "SVG Editor", icon: "✒️", description: "Vector editor: paths, shapes, gradients and export.", module: "/js/apps/media/svg-editor.js", tags: ["vector","design"], featured: true },
          { id: "ascii-art", name: "ASCII Art", icon: "🔡", description: "Convert images to ASCII and create text art.", module: "/js/apps/media/ascii-art.js", tags: ["art","text"], featured: false },
          { id: "gradient-maker", name: "Gradient Maker", icon: "🌅", description: "Design CSS gradients with live preview and code export.", module: "/js/apps/media/gradient-maker.js", tags: ["css","design"], featured: false },
          { id: "color-palette", name: "Color Palette", icon: "🎨", description: "Generate palettes from images, rules or random with export.", module: "/js/apps/media/color-palette.js", tags: ["color","design"], featured: false },
          { id: "gif-maker", name: "GIF Maker", icon: "🎞️", description: "Build GIFs from images or video clips.", module: "/js/apps/media/gif-maker.js", tags: ["image","animation"], featured: false },
          { id: "photo-collage", name: "Photo Collage", icon: "🖼️", description: "Arrange photos in grid or freestyle layouts.", module: "/js/apps/media/photo-collage.js", tags: ["image","layout"], featured: false },
          { id: "icon-forge", name: "Icon Forge", icon: "🛠️", description: "Design and export icons as SVG/PNG/ICO.", module: "/js/apps/media/icon-forge.js", tags: ["design","icons"], featured: false },
          { id: "waveform-art", name: "Waveform Art", icon: "🌊", description: "Render audio as custom-styled waveform images.", module: "/js/apps/media/waveform-art.js", tags: ["audio","art"], featured: false },
          { id: "mandala", name: "Mandala Maker", icon: "🕉️", description: "Symmetrical drawing tool for mandala art.", module: "/js/apps/media/mandala.js", tags: ["art","drawing"], featured: false },
          { id: "neon-sign", name: "Neon Sign Maker", icon: "💡", description: "Design glowing neon text signs with animations.", module: "/js/apps/media/neon-sign.js", tags: ["text","design"], featured: false }
        ]
      },

      // ─────────────────────────────────────────────────────────────
      // 5. TOOLS & PRODUCTIVITY
      // ─────────────────────────────────────────────────────────────
      {
        id: "tools-productivity",
        name: "Tools & Productivity",
        icon: "🛠️",
        apps: [
          { id: "terminal", name: "Terminal", icon: "⌨️", description: "In-browser shell with alias support and command history.", module: "/js/apps/tools/terminal.js", tags: ["shell","cli"], featured: true },
          { id: "file-explorer", name: "File Explorer", icon: "📁", description: "OPFS/IndexedDB file manager with preview and search.", module: "/js/apps/tools/file-explorer.js", tags: ["files","storage"], featured: true },
          { id: "code-editor", name: "Code Editor", icon: "📝", description: "Monaco-based code editor with syntax highlighting.", module: "/js/apps/tools/code-editor.js", tags: ["editor","code"], featured: true },
          { id: "calculator", name: "Calculator", icon: "🧮", description: "Standard and scientific calculator with history tape.", module: "/js/apps/tools/calculator.js", tags: ["math","utility"], featured: true },
          { id: "notepad", name: "Notepad", icon: "📄", description: "Markdown notepad with auto-save and export.", module: "/js/apps/tools/notepad.js", tags: ["text","notes"], featured: true },
          { id: "clock", name: "World Clock", icon: "🕐", description: "Clock, stopwatch, timer and world timezones.", module: "/js/apps/tools/clock.js", tags: ["time","utility"], featured: true },
          { id: "weather", name: "Weather", icon: "⛅", description: "Current conditions and 7-day forecast by location.", module: "/js/apps/tools/weather.js", tags: ["weather","utility"], featured: true },
          { id: "paint", name: "Paint", icon: "🖌️", description: "Raster paint with brushes, layers and PNG export.", module: "/js/apps/tools/paint.js", tags: ["art","drawing"], featured: true },
          { id: "task-manager", name: "Task Manager", icon: "✅", description: "Kanban and list task tracker with due dates and tags.", module: "/js/apps/tools/task-manager.js", tags: ["productivity","tasks"], featured: true },
          { id: "backup-tool", name: "Backup Tool", icon: "💾", description: "Backup and restore NexusOS user data to JSON bundles.", module: "/js/apps/tools/backup-tool.js", tags: ["system","backup"], featured: true },
          { id: "disk-analyzer", name: "Disk Analyzer", icon: "💿", description: "Visualize OPFS/IndexedDB storage usage by app.", module: "/js/apps/tools/disk-analyzer.js", tags: ["system","storage"], featured: false },
          { id: "network-monitor", name: "Network Monitor", icon: "🌐", description: "Connection status, latency pings and request log.", module: "/js/apps/tools/network-monitor.js", tags: ["system","network"], featured: false },
          { id: "clipboard-manager", name: "Clipboard Manager", icon: "📋", description: "History of copied text/items with pin and search.", module: "/js/apps/tools/clipboard-manager.js", tags: ["utility","clipboard"], featured: false },
          { id: "hash-calculator", name: "Hash Calculator", icon: "#️⃣", description: "Compute MD5, SHA-1, SHA-256, SHA-512 of text or files.", module: "/js/apps/tools/hash-calculator.js", tags: ["crypto","utility"], featured: false },
          { id: "regex-tester", name: "Regex Tester", icon: "🔎", description: "Live regex builder and tester with JS/PCRE flavors.", module: "/js/apps/tools/regex-tester.js", tags: ["dev","regex"], featured: false },
          { id: "json-formatter", name: "JSON Formatter", icon: "{ }", description: "Validate, format, minify and diff JSON documents.", module: "/js/apps/tools/json-formatter.js", tags: ["dev","json"], featured: false },
          { id: "pomodoro", name: "Pomodoro", icon: "🍅", description: "Focus timer with 25/5 cycles and session log.", module: "/js/apps/tools/pomodoro.js", tags: ["productivity","time"], featured: false },
          { id: "calendar", name: "Calendar", icon: "📅", description: "Month/week calendar with events and reminders.", module: "/js/apps/tools/calendar.js", tags: ["productivity","time"], featured: false },
          { id: "unit-converter", name: "Unit Converter", icon: "📐", description: "Convert length, mass, temperature, currency and more.", module: "/js/apps/tools/unit-converter.js", tags: ["utility","math"], featured: false },
          { id: "password-gen", name: "Password Generator", icon: "🔑", description: "Generate strong passwords with custom rules.", module: "/js/apps/tools/password-gen.js", tags: ["security","utility"], featured: false },
          { id: "markdown-preview", name: "Markdown Preview", icon: "📑", description: "Split-pane markdown editor with live preview.", module: "/js/apps/tools/markdown-preview.js", tags: ["text","dev"], featured: false },
          { id: "diff-viewer", name: "Diff Viewer", icon: "🔀", description: "Side-by-side text diff with syntax highlight.", module: "/js/apps/tools/diff-viewer.js", tags: ["dev","utility"], featured: false },
          { id: "base64-tool", name: "Base64 Tool", icon: "🔐", description: "Encode/decode base64 for text and files.", module: "/js/apps/tools/base64-tool.js", tags: ["crypto","utility"], featured: false },
          { id: "url-encoder", name: "URL Encoder", icon: "🔗", description: "Encode/decode URL components and query strings.", module: "/js/apps/tools/url-encoder.js", tags: ["dev","utility"], featured: false },
          { id: "cron-builder", name: "Cron Builder", icon: "⏲️", description: "Visual cron expression builder with human-readable output.", module: "/js/apps/tools/cron-builder.js", tags: ["dev","utility"], featured: false },
          { id: "lorem-ipsum", name: "Lorem Ipsum", icon: "📃", description: "Generate placeholder text, HTML or lists.", module: "/js/apps/tools/lorem-ipsum.js", tags: ["dev","text"], featured: false },
          { id: "color-picker", name: "Color Picker", icon: "🎯", description: "Eyedropper, HEX/RGB/HSL with palette history.", module: "/js/apps/tools/color-picker.js", tags: ["design","utility"], featured: false },
          { id: "stopwatch", name: "Stopwatch", icon: "⏱️", description: "Lap-supporting stopwatch with export.", module: "/js/apps/tools/stopwatch.js", tags: ["time","utility"], featured: false },
          { id: "expense-tracker", name: "Expense Tracker", icon: "💰", description: "Log expenses, categorize and chart monthly spend.", module: "/js/apps/tools/expense-tracker.js", tags: ["finance","productivity"], featured: false },
          { id: "habit-tracker", name: "Habit Tracker", icon: "📈", description: "Daily habit streaks with heatmap visualization.", module: "/js/apps/tools/habit-tracker.js", tags: ["productivity","health"], featured: false }
        ]
      },

      // ─────────────────────────────────────────────────────────────
      // 6. SYSTEM
      // ─────────────────────────────────────────────────────────────
      {
        id: "system",
        name: "System",
        icon: "⚙️",
        apps: [
          { id: "settings", name: "Settings", icon: "⚙️", description: "Theme, wallpaper, accounts, accessibility and OS preferences.", module: "/js/apps/system/settings.js", tags: ["system","config"], featured: true },
          { id: "system-monitor", name: "System Monitor", icon: "📊", description: "CPU, memory, network and storage gauges in real time.", module: "/js/apps/system/system-monitor.js", tags: ["system","monitoring"], featured: true },
          { id: "process-manager", name: "Process Manager", icon: "🧰", description: "View running apps/workers, inspect memory and force-quit.", module: "/js/apps/system/process-manager.js", tags: ["system","processes"], featured: true },
          { id: "boot-log", name: "Boot Log", icon: "📜", description: "View the NexusOS boot sequence and init logs.", module: "/js/apps/system/boot-log.js", tags: ["system","log"], featured: false },
          { id: "about", name: "About NexusOS", icon: "ℹ️", description: "Version, credits, licenses and system info.", module: "/js/apps/system/about.js", tags: ["system","info"], featured: false },
          { id: "update-center", name: "Update Center", icon: "🔃", description: "Check for OS and app updates, view changelogs.", module: "/js/apps/system/update-center.js", tags: ["system","updates"], featured: false }
        ]
      }
    ]
  };

  // Derived helpers: flat list, by-id lookup, featured, by-tag
  const flat = registry.categories.flatMap(c => c.apps.map(a => ({ ...a, category: c.id })));
  registry.all = flat;
  registry.byId = Object.fromEntries(flat.map(a => [a.id, a]));
  registry.featured = flat.filter(a => a.featured);
  registry.byTag = (tag) => flat.filter(a => a.tags.includes(tag));
  registry.byCategory = (catId) => registry.categories.find(c => c.id === catId)?.apps || [];
  registry.search = (q) => {
    const term = q.toLowerCase();
    return flat.filter(a =>
      a.name.toLowerCase().includes(term) ||
      a.description.toLowerCase().includes(term) ||
      a.tags.some(t => t.includes(term))
    );
  };

  window.NexusOS = window.NexusOS || {};
  window.NexusOS.registry = registry;
})();
