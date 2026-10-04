# NEXUS OS

> **Neon Glass Operating System Shell** — A fully functional web-based OS with cyberpunk aesthetics and glassmorphism depth.

[![Version](https://img.shields.io/badge/version-1.0.0-ff003c?style=flat-square)](https://github.com/belentani7/nexus-os)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)]()
[![Vanilla JS](https://img.shields.io/badge/framework-none-yellow?style=flat-square)]()

---

## What is NEXUS OS?

NEXUS OS is a browser-based operating system shell featuring a neon glassmorphism aesthetic, a complete window manager, 38+ built-in applications, and a cinematic boot sequence. Built entirely with vanilla JavaScript — zero frameworks, zero dependencies.

Every pixel is hand-crafted: CRT scanline boot animations, plasma-glow SVG logos, glass-depth layering, and three fully themed color systems.

---

## Features

- **🖥️ Cinematic Boot Sequence** — BIOS-style startup with CRT scanlines, memory bank initialization, and animated logo reveal
- **🪟 Full Window Manager** — Draggable, resizable, minimizable windows with z-index stacking, snapping, and workspace management
- **📦 38+ Built-in Apps** — From AI chat and tarot readers to drum machines and neon pong
- **🎨 3 Themes** — Neon Red (default), Cyber Night, and Void Black
- **🔊 Web Audio Engine** — Synthesizers, drum machines, and audio visualizers powered by the Web Audio API
- **📁 Virtual Filesystem** — In-browser file storage with persistence via localStorage
- **⌨️ Terminal** — Fully functional command-line interface with system commands
- **🤖 AI Core** — Integrated AI engine for chat, dream analysis, oracle, and archetype interpretation
- **🔔 System Notifications** — Toast notifications, clipboard manager, and system tray
- **🔍 Global Search** — App launcher and system-wide search

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/belentani7/nexus-os.git
cd nexus-os

# Start a local development server (any static server works)
npx serve .
# or
python -m http.server 8080

# Open in your browser
# → http://localhost:8080
```

No build step required. No `npm install`. No dependencies. Just open `index.html`.

---

## Development

For hot-reload development:

```bash
# Using live-server (auto-reload on file changes)
npx live-server --port=8080

# Using watch (alternative)
npx browser-sync start --server --files "**/*.css, **/*.js, **/*.html"
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla JavaScript (ES6+) |
| **Styling** | Pure CSS3 (custom properties, animations, glassmorphism) |
| **Audio** | Web Audio API |
| **Storage** | localStorage / IndexedDB |
| **Graphics** | Canvas 2D, SVG, CSS animations |
| **Build** | None — zero build tooling, zero dependencies |
| **Architecture** | IIFE modules with event bus communication |

---

## App Categories

### 🤖 AI & Mystic
AI Chat · Tarot · Oracle · Horoscope · Numerology · Dream Analyzer · Archetype Interpreter

### 🎵 Music
Music Studio · Drum Machine · Synth Lab · Sequencer · Song Writer · Audio Visualizer

### 🎮 Games
Tetris · Snake · Neon Pong · Memory Game · Cyber Puzzle · Escape Room · Terminal Hacker

### 🎬 Media
Paint · Glitch Art · Neon Photo Viewer · Image Viewer · Video Player · Voice Recorder · Screen Recorder

### 🛠️ Tools
Terminal · Code Editor · Notepad · Calculator · Weather · Clock · Media Converter

### ⚙️ System
Settings · File Explorer

---

## Themes

| Theme | Description |
|-------|-------------|
| **Neon Red** | Default crimson-and-dark cyberpunk aesthetic |
| **Cyber Night** | Deep blue-teal nocturnal palette |
| **Void Black** | Pure black OLED-optimized minimal theme |

Switch themes via the Settings app or the system tray.

---

## Project Structure

```
nexus-os/
├── index.html              # Main entry point
├── css/
│   ├── animations.css      # Keyframes and motion
│   ├── glass.css           # Glassmorphism depth system
│   ├── components.css      # UI component library
│   ├── desktop.css         # OS shell layout
│   └── themes/
│       ├── neon-red.css    # Primary theme
│       ├── cyber-night.css # Secondary theme
│       └── void-black.css  # Tertiary theme
├── js/
│   ├── os/
│   │   ├── kernel.js       # Core runtime orchestrator
│   │   ├── window-manager.js
│   │   ├── taskbar.js
│   │   ├── app-loader.js
│   │   └── filesystem.js
│   ├── engine/
│   │   ├── audio-engine.js # Web Audio synthesis
│   │   ├── ai-core.js      # AI integration layer
│   │   ├── storage.js      # Persistence engine
│   │   ├── process-manager.js
│   │   ├── event-bus.js
│   │   └── network.js
│   └── apps/               # 38+ application modules
│       ├── ai-chat.js
│       ├── music-studio.js
│       ├── terminal.js
│       ├── tetris.js
│       └── ...
```

---

## Screenshots

> *Coming soon*

---

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome / Edge | ✅ Full support |
| Firefox | ✅ Full support |
| Safari | ✅ Full support |
| IE 11 | ❌ Not supported |

Requires a modern browser with ES6+, Web Audio API, and CSS custom properties support.

---

## License

This project is licensed under the MIT License.

---

## Credits

Created by **Qwen AI** with **Pedro Belentani**'s creative direction and guidance.

---

<p align="center">
  <a href="https://github.com/belentani7/nexus-os">GitHub</a> ·
  <a href="https://github.com/belentani7/nexus-os/issues">Report Bug</a> ·
  <a href="https://github.com/belentani7/nexus-os/issues">Request Feature</a>
</p>

<p align="center">
  <strong>NEXUS OS v1.0.0</strong> — Neural Execution Unified System
</p>
