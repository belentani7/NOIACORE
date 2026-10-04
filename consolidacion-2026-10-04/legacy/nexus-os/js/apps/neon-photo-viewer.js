/**
 * NEXUS OS — Neon Photo Frame
 * Atmospheric photo viewer with animated neon frame effects
 * Pure vanilla JS, no external dependencies
 */

class NexusPhotoFrame {
  constructor(container) {
    this.container = typeof container === 'string'
      ? document.querySelector(container) : container;
    this.photos = [];
    this.currentIndex = -1;
    this.favorites = new Set(JSON.parse(localStorage.getItem('nexus-photo-favs') || '[]'));
    this.tags = JSON.parse(localStorage.getItem('nexus-photo-tags') || '{}');
    this.frameStyle = 'single'; // single | double | corners | plasma
    this.transitionType = 'fade'; // fade | slide | dissolve | glitch
    this.slideshowInterval = null;
    this.slideshowDelay = 4000;
    this.isAmbientMode = false;
    this.ambientAnim = null;
    this.searchQuery = '';
    this.frameAnimFrame = null;
  }

  render() {
    this.container.innerHTML = '';
    this._injectStyles();
    this._buildUI();
    this._bindEvents();
    this._startFrameAnimation();
  }

  destroy() {
    this.stopSlideshow();
    this.stopAmbientMode();
    cancelAnimationFrame(this.frameAnimFrame);
    this.container.innerHTML = '';
  }

  _injectStyles() {
    if (document.getElementById('nexus-photo-frame-styles')) return;
    const style = document.createElement('style');
    style.id = 'nexus-photo-frame-styles';
    style.textContent = `
      .npf-root {
        display: flex; height: 100%; background: #0a0a0f;
        font-family: 'Segoe UI', system-ui, sans-serif; color: #e0e0e0;
        overflow: hidden; position: relative;
      }
      .npf-sidebar {
        width: 220px; background: rgba(15,15,25,0.95);
        border-right: 1px solid rgba(255,0,60,0.15);
        display: flex; flex-direction: column;
        transition: width 0.3s;
      }
      .npf-sidebar.collapsed { width: 0; border: none; overflow: hidden; }
      .npf-sidebar-header {
        padding: 12px; border-bottom: 1px solid rgba(255,0,60,0.1);
        font-size: 14px; font-weight: 600; color: #ff2d6b;
        display: flex; align-items: center; gap: 8px;
      }
      .npf-search {
        margin: 8px 12px; padding: 6px 10px;
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,0,60,0.15);
        border-radius: 6px; color: #ccc; font-size: 12px; outline: none;
        width: calc(100% - 24px);
      }
      .npf-search:focus { border-color: #ff003c; }
      .npf-sidebar-scroll { flex: 1; overflow-y: auto; padding: 8px; }
      .npf-sidebar-scroll::-webkit-scrollbar { width: 4px; }
      .npf-sidebar-scroll::-webkit-scrollbar-thumb { background: #ff003c33; border-radius: 2px; }

      .npf-photo-thumb {
        width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 6px;
        cursor: pointer; margin-bottom: 6px; border: 2px solid transparent;
        transition: all 0.2s; opacity: 0.7;
      }
      .npf-photo-thumb:hover { opacity: 1; }
      .npf-photo-thumb.active {
        border-color: #ff003c; opacity: 1;
        box-shadow: 0 0 10px rgba(255,0,60,0.3);
      }
      .npf-photo-thumb.fav::after {
        content: '★'; position: absolute; top: 4px; right: 4px;
        color: #ff003c; font-size: 12px;
      }

      .npf-main {
        flex: 1; display: flex; flex-direction: column; position: relative;
        min-width: 0;
      }
      .npf-toolbar {
        display: flex; align-items: center; gap: 6px; padding: 8px 12px;
        background: rgba(15,15,25,0.9); border-bottom: 1px solid rgba(255,0,60,0.1);
        flex-wrap: wrap;
      }
      .npf-btn {
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,0,60,0.15);
        color: #ccc; padding: 6px 12px; border-radius: 6px; cursor: pointer;
        font-size: 12px; transition: all 0.2s; white-space: nowrap;
      }
      .npf-btn:hover { background: rgba(255,0,60,0.1); color: #ff003c; }
      .npf-btn.active {
        background: rgba(255,0,60,0.2); color: #ff003c;
        border-color: #ff003c; box-shadow: 0 0 8px rgba(255,0,60,0.2);
      }
      .npf-sep { width: 1px; height: 20px; background: rgba(255,0,60,0.15); margin: 0 4px; }
      .npf-spacer { flex: 1; }

      .npf-view-area {
        flex: 1; position: relative; display: flex; align-items: center;
        justify-content: center; overflow: hidden; background: #000;
      }

      .npf-photo-frame {
        position: relative; max-width: 85%; max-height: 85%;
      }
      .npf-photo-frame img {
        max-width: 100%; max-height: 100%; display: block;
        border-radius: 2px;
      }

      /* Frame styles */
      .npf-frame-single {
        border: 2px solid #ff003c;
        box-shadow: 0 0 20px rgba(255,0,60,0.3), inset 0 0 20px rgba(255,0,60,0.1);
      }
      .npf-frame-double {
        border: 3px solid #ff003c;
        outline: 1px solid rgba(255,0,60,0.5);
        outline-offset: 6px;
        box-shadow: 0 0 25px rgba(255,0,60,0.3), 0 0 50px rgba(255,0,60,0.1);
      }
      .npf-frame-corners::before,
      .npf-frame-corners::after {
        content: ''; position: absolute; width: 30px; height: 30px;
        border: 2px solid #ff003c; z-index: 2;
      }
      .npf-frame-corners::before { top: -4px; left: -4px; border-right: none; border-bottom: none; }
      .npf-frame-corners::after { bottom: -4px; right: -4px; border-left: none; border-top: none; }

      .npf-frame-plasma {
        border: 2px solid transparent;
        background-clip: padding-box;
        animation: npf-plasma-border 3s linear infinite;
      }
      @keyframes npf-plasma-border {
        0% { border-color: #ff003c; box-shadow: 0 0 20px #ff003c; }
        25% { border-color: #ff2d6b; box-shadow: 0 0 25px #ff2d6b; }
        50% { border-color: #ff4488; box-shadow: 0 0 30px #ff4488; }
        75% { border-color: #ff2d6b; box-shadow: 0 0 25px #ff2d6b; }
        100% { border-color: #ff003c; box-shadow: 0 0 20px #ff003c; }
      }

      /* Ambient glow */
      .npf-ambient-glow {
        position: absolute; inset: -40px; z-index: -1;
        filter: blur(40px); opacity: 0.4;
        transition: all 1s;
      }

      /* Photo info overlay */
      .npf-info-overlay {
        position: absolute; bottom: 20px; left: 20px;
        background: rgba(15,15,25,0.85); backdrop-filter: blur(12px);
        border: 1px solid rgba(255,0,60,0.2); border-radius: 10px;
        padding: 12px 16px; max-width: 300px; display: none; z-index: 5;
      }
      .npf-info-overlay.visible { display: block; }
      .npf-info-row { font-size: 12px; margin-bottom: 4px; }
      .npf-info-label { color: #888; }
      .npf-info-val { color: #ff2d6b; }
      .npf-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; }
      .npf-tag {
        font-size: 10px; padding: 2px 8px; border-radius: 10px;
        background: rgba(255,0,60,0.15); color: #ff2d6b;
        border: 1px solid rgba(255,0,60,0.3);
      }
      .npf-tag-input {
        font-size: 10px; padding: 2px 8px; border-radius: 10px;
        background: rgba(255,255,255,0.05); color: #ccc;
        border: 1px solid rgba(255,0,60,0.15); outline: none; width: 80px;
      }

      /* Transition animations */
      .npf-transition-fade { animation: npf-fade 0.6s ease; }
      @keyframes npf-fade { from { opacity: 0; } to { opacity: 1; } }
      .npf-transition-slide { animation: npf-slide 0.5s ease; }
      @keyframes npf-slide { from { transform: translateX(100%); } to { transform: translateX(0); } }
      .npf-transition-dissolve { animation: npf-dissolve 0.8s ease; }
      @keyframes npf-dissolve { from { opacity: 0; filter: blur(10px); } to { opacity: 1; filter: blur(0); } }
      .npf-transition-glitch { animation: npf-glitch-trans 0.4s ease; }
      @keyframes npf-glitch-trans {
        0% { transform: translate(10px, -5px) skewX(5deg); filter: hue-rotate(90deg); opacity: 0.5; }
        25% { transform: translate(-5px, 3px) skewX(-3deg); filter: hue-rotate(180deg); opacity: 0.7; }
        50% { transform: translate(3px, -2px) skewX(2deg); filter: hue-rotate(270deg); opacity: 0.8; }
        100% { transform: none; filter: none; opacity: 1; }
      }

      /* Ken Burns for ambient */
      .npf-ken-burns {
        animation: npf-ken-burns 20s ease-in-out infinite alternate;
      }
      @keyframes npf-ken-burns {
        0% { transform: scale(1) translate(0, 0); }
        100% { transform: scale(1.15) translate(-2%, -1%); }
      }

      /* Neon vignette */
      .npf-neon-vignette {
        position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(ellipse at center,
          transparent 50%,
          rgba(255,0,60,0.05) 70%,
          rgba(10,10,15,0.8) 100%
        );
        display: none; z-index: 2;
      }
      .npf-neon-vignette.active { display: block; }

      .npf-drop-overlay {
        position: absolute; inset: 0; background: rgba(255,0,60,0.15);
        border: 3px dashed #ff003c; display: none; align-items: center;
        justify-content: center; z-index: 20; font-size: 22px; color: #ff003c;
        backdrop-filter: blur(8px);
      }
      .npf-drop-overlay.active { display: flex; }

      .npf-empty {
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; height: 100%; gap: 16px; color: #555;
      }
      .npf-empty-icon { font-size: 64px; opacity: 0.3; }

      /* Select dropdowns in toolbar */
      .npf-select {
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,0,60,0.15);
        color: #ccc; padding: 5px 8px; border-radius: 6px; font-size: 12px;
        outline: none; cursor: pointer;
      }
      .npf-select option { background: #1a1a2e; }
    `;
    document.head.appendChild(style);
  }

  _buildUI() {
    const root = document.createElement('div');
    root.className = 'npf-root';
    root.innerHTML = `
      <div class="npf-sidebar" data-npf="sidebar">
        <div class="npf-sidebar-header">
          <span>📷 Photos</span>
          <button class="npf-btn" data-npf="toggleSidebar" style="padding:3px 8px">◀</button>
        </div>
        <input class="npf-search" type="text" placeholder="Search photos & tags..." data-npf="searchInput">
        <div class="npf-sidebar-scroll" data-npf="photoList"></div>
      </div>

      <div class="npf-main">
        <div class="npf-toolbar">
          <button class="npf-btn" data-npf="openBtn">📁 Open</button>
          <div class="npf-sep"></div>
          <button class="npf-btn" data-npf="prevBtn">◀</button>
          <button class="npf-btn" data-npf="nextBtn">▶</button>
          <div class="npf-sep"></div>
          <select class="npf-select" data-npf="frameSelect">
            <option value="single">Single Neon</option>
            <option value="double">Double Line</option>
            <option value="corners">Corner Accents</option>
            <option value="plasma">Plasma Border</option>
            <option value="none">No Frame</option>
          </select>
          <select class="npf-select" data-npf="transitionSelect">
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="dissolve">Dissolve</option>
            <option value="glitch">Glitch</option>
          </select>
          <div class="npf-sep"></div>
          <button class="npf-btn" data-npf="favBtn" title="Favorite">☆</button>
          <button class="npf-btn" data-npf="infoBtn" title="Info">ℹ</button>
          <button class="npf-btn" data-npf="ambientBtn" title="Ambient Mode">🌙 Ambient</button>
          <button class="npf-btn" data-npf="slideshowBtn" title="Slideshow">▶ Slideshow</button>
          <div class="npf-spacer"></div>
          <button class="npf-btn" data-npf="fullscreenBtn">⛶ Fullscreen</button>
        </div>

        <div class="npf-view-area" data-npf="viewArea">
          <div class="npf-empty" data-npf="empty">
            <div class="npf-empty-icon">🖼</div>
            <div style="font-size:16px;">No photos loaded</div>
            <button class="npf-btn" data-npf="emptyOpenBtn">Open Images</button>
          </div>
          <div class="npf-photo-frame" data-npf="photoFrame" style="display:none">
            <div class="npf-ambient-glow" data-npf="ambientGlow"></div>
            <img data-npf="photoImg" draggable="false">
            <div class="npf-neon-vignette" data-npf="vignette"></div>
          </div>
          <div class="npf-info-overlay" data-npf="infoOverlay">
            <div class="npf-info-row">
              <span class="npf-info-label">Name: </span>
              <span class="npf-info-val" data-npf="infoName">--</span>
            </div>
            <div class="npf-info-row">
              <span class="npf-info-label">Size: </span>
              <span class="npf-info-val" data-npf="infoSize">--</span>
            </div>
            <div class="npf-info-row">
              <span class="npf-info-label">Dimensions: </span>
              <span class="npf-info-val" data-npf="infoDims">--</span>
            </div>
            <div class="npf-tags" data-npf="tagsContainer"></div>
          </div>
          <div class="npf-drop-overlay" data-npf="dropOverlay">Drop photos here</div>
        </div>
      </div>

      <input type="file" accept="image/*" multiple style="display:none" data-npf="fileInput">
    `;
    this.container.appendChild(root);
    this.root = root;

    this.els = {};
    root.querySelectorAll('[data-npf]').forEach(el => {
      this.els[el.dataset.npf] = el;
    });
  }

  _bindEvents() {
    const e = this.els;

    e.openBtn.onclick = () => e.fileInput.click();
    e.emptyOpenBtn.onclick = () => e.fileInput.click();
    e.fileInput.onchange = (ev) => this._handleFiles(ev.target.files);
    e.prevBtn.onclick = () => this._showPrev();
    e.nextBtn.onclick = () => this._showNext();
    e.favBtn.onclick = () => this._toggleFavorite();
    e.infoBtn.onclick = () => e.infoOverlay.classList.toggle('visible');
    e.ambientBtn.onclick = () => this._toggleAmbientMode();
    e.slideshowBtn.onclick = () => this._toggleSlideshow();
    e.fullscreenBtn.onclick = () => this._toggleFullscreen();
    e.toggleSidebar.onclick = () => e.sidebar.classList.toggle('collapsed');

    e.frameSelect.onchange = (ev) => {
      this.frameStyle = ev.target.value;
      this._updateFrameStyle();
    };
    e.transitionSelect.onchange = (ev) => {
      this.transitionType = ev.target.value;
    };

    e.searchInput.oninput = (ev) => {
      this.searchQuery = ev.target.value.toLowerCase();
      this._renderPhotoList();
    };

    // Drag and drop
    const area = e.viewArea;
    area.ondragover = (ev) => { ev.preventDefault(); e.dropOverlay.classList.add('active'); };
    area.ondragleave = () => e.dropOverlay.classList.remove('active');
    area.ondrop = (ev) => {
      ev.preventDefault();
      e.dropOverlay.classList.remove('active');
      this._handleFiles(ev.dataTransfer.files);
    };

    // Keyboard nav
    this._keyHandler = (ev) => {
      if (!this.root || !this.container.contains(this.root)) return;
      if (ev.target.tagName === 'INPUT') return;
      if (ev.code === 'ArrowLeft') this._showPrev();
      if (ev.code === 'ArrowRight') this._showNext();
      if (ev.code === 'KeyF') this._toggleFavorite();
      if (ev.code === 'KeyI') e.infoOverlay.classList.toggle('visible');
    };
    document.addEventListener('keydown', this._keyHandler);
  }

  _handleFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    files.forEach(file => {
      const url = URL.createObjectURL(file);
      const id = 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      this.photos.push({ id, name: file.name, url, size: file.size, type: file.type, file });
    });

    if (this.currentIndex === -1) {
      this._showPhoto(0);
    }
    this._renderPhotoList();
  }

  _showPhoto(index) {
    if (index < 0 || index >= this.photos.length) return;
    this.currentIndex = index;
    const photo = this.photos[index];

    const img = this.els.photoImg;
    img.src = photo.url;
    this.els.photoFrame.style.display = '';
    this.els.empty.style.display = 'none';

    // Apply transition
    img.className = '';
    void img.offsetWidth; // trigger reflow
    img.classList.add('npf-transition-' + this.transitionType);

    img.onload = () => {
      this.els.infoDims.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
      this._updateAmbientGlow();
    };

    this._updateFrameStyle();
    this._updateInfo();
    this._updateFavButton();
    this._renderPhotoList();
  }

  _showPrev() {
    if (this.photos.length === 0) return;
    const idx = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
    this._showPhoto(idx);
  }

  _showNext() {
    if (this.photos.length === 0) return;
    const idx = (this.currentIndex + 1) % this.photos.length;
    this._showPhoto(idx);
  }

  _updateFrameStyle() {
    const frame = this.els.photoFrame;
    frame.className = 'npf-photo-frame';
    if (this.frameStyle !== 'none') {
      frame.classList.add('npf-frame-' + this.frameStyle);
    }
  }

  _updateAmbientGlow() {
    if (!this.els.photoImg.src) return;
    // Sample edge colors from image
    const canvas = document.createElement('canvas');
    canvas.width = 50;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.els.photoImg, 0, 0, 50, 50);
    const data = ctx.getImageData(0, 0, 50, 50).data;

    // Average color of edges
    let r = 0, g = 0, b = 0, count = 0;
    for (let x = 0; x < 50; x++) {
      for (const y of [0, 49]) {
        const i = (y * 50 + x) * 4;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
      }
    }
    for (let y = 0; y < 50; y++) {
      for (const x of [0, 49]) {
        const i = (y * 50 + x) * 4;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
      }
    }
    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);

    this.els.ambientGlow.style.background =
      `radial-gradient(ellipse at center, rgba(${r},${g},${b},0.6), transparent 70%)`;
  }

  _updateInfo() {
    if (this.currentIndex < 0) return;
    const photo = this.photos[this.currentIndex];
    this.els.infoName.textContent = photo.name;
    this.els.infoSize.textContent = this._formatSize(photo.size);

    // Tags
    const tagsContainer = this.els.tagsContainer;
    tagsContainer.innerHTML = '';
    const photoTags = this.tags[photo.id] || [];
    photoTags.forEach((tag, i) => {
      const span = document.createElement('span');
      span.className = 'npf-tag';
      span.textContent = tag;
      span.onclick = () => {
        photoTags.splice(i, 1);
        this.tags[photo.id] = photoTags;
        localStorage.setItem('nexus-photo-tags', JSON.stringify(this.tags));
        this._updateInfo();
      };
      tagsContainer.appendChild(span);
    });

    // Add tag input
    const input = document.createElement('input');
    input.className = 'npf-tag-input';
    input.placeholder = '+ tag';
    input.onkeydown = (ev) => {
      if (ev.key === 'Enter' && input.value.trim()) {
        if (!this.tags[photo.id]) this.tags[photo.id] = [];
        this.tags[photo.id].push(input.value.trim());
        localStorage.setItem('nexus-photo-tags', JSON.stringify(this.tags));
        input.value = '';
        this._updateInfo();
      }
    };
    tagsContainer.appendChild(input);
  }

  _toggleFavorite() {
    if (this.currentIndex < 0) return;
    const id = this.photos[this.currentIndex].id;
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
    } else {
      this.favorites.add(id);
    }
    localStorage.setItem('nexus-photo-favs', JSON.stringify([...this.favorites]));
    this._updateFavButton();
    this._renderPhotoList();
  }

  _updateFavButton() {
    if (this.currentIndex < 0) return;
    const id = this.photos[this.currentIndex].id;
    this.els.favBtn.textContent = this.favorites.has(id) ? '★' : '☆';
    this.els.favBtn.classList.toggle('active', this.favorites.has(id));
  }

  _renderPhotoList() {
    const list = this.els.photoList;
    list.innerHTML = '';
    const filtered = this.photos.filter(p => {
      if (!this.searchQuery) return true;
      if (p.name.toLowerCase().includes(this.searchQuery)) return true;
      const photoTags = this.tags[p.id] || [];
      return photoTags.some(t => t.toLowerCase().includes(this.searchQuery));
    });

    filtered.forEach(photo => {
      const idx = this.photos.indexOf(photo);
      const thumb = document.createElement('img');
      thumb.className = 'npf-photo-thumb' +
        (idx === this.currentIndex ? ' active' : '') +
        (this.favorites.has(photo.id) ? ' fav' : '');
      thumb.src = photo.url;
      thumb.onclick = () => this._showPhoto(idx);
      list.appendChild(thumb);
    });
  }

  /* ─── AMBIENT MODE ─── */
  _toggleAmbientMode() {
    if (this.isAmbientMode) {
      this.stopAmbientMode();
    } else {
      this.startAmbientMode();
    }
  }

  startAmbientMode() {
    this.isAmbientMode = true;
    this.els.ambientBtn.classList.add('active');
    this.els.photoImg.classList.add('npf-ken-burns');
    this.els.vignette.classList.add('active');
  }

  stopAmbientMode() {
    this.isAmbientMode = false;
    this.els.ambientBtn.classList.remove('active');
    this.els.photoImg.classList.remove('npf-ken-burns');
    this.els.vignette.classList.remove('active');
  }

  /* ─── SLIDESHOW ─── */
  _toggleSlideshow() {
    if (this.slideshowInterval) {
      this.stopSlideshow();
    } else {
      this.startSlideshow();
    }
  }

  startSlideshow() {
    if (this.photos.length < 2) return;
    this.els.slideshowBtn.classList.add('active');
    this.els.slideshowBtn.textContent = '⏸ Stop';
    this.slideshowInterval = setInterval(() => {
      this._showNext();
    }, this.slideshowDelay);
  }

  stopSlideshow() {
    clearInterval(this.slideshowInterval);
    this.slideshowInterval = null;
    this.els.slideshowBtn.classList.remove('active');
    this.els.slideshowBtn.textContent = '▶ Slideshow';
  }

  _startFrameAnimation() {
    // Continuous subtle animation on plasma frame
    const animate = () => {
      this.frameAnimFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.root.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  _formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NexusPhotoFrame;
}
window.NexusPhotoFrame = NexusPhotoFrame;
