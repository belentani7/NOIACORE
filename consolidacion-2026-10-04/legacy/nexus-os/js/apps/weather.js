'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 *  NEXUS OS — Weather App
 *  Simulated weather display with procedural data generation
 * ═══════════════════════════════════════════════════════════════
 */
class NexusWeather {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.currentCity = 'Neo Tokyo';
    this.useCelsius = true;
    this.windUnit = 'km/h'; // km/h, mph, m/s
    this.weatherData = null;
    this.searchHistory = [];
  }

  render() {
    const style = document.createElement('style');
    style.textContent = this._getStyles();
    this.container.appendChild(style);
    this._styleEl = style;

    this.element = document.createElement('div');
    this.element.className = 'nexus-weather';
    this.element.innerHTML = this._getHTML();
    this.container.appendChild(this.element);

    this._bindEvents();
    this._loadCity(this.currentCity);
  }

  destroy() {
    if (this._styleEl) this._styleEl.remove();
    if (this.element) this.element.remove();
  }

  _getHTML() {
    return `
      <div class="wx-header">
        <div class="wx-search-row">
          <input type="text" class="wx-search glass-input" id="wx-search" placeholder="Search city..." value="${this.currentCity}">
          <button class="wx-search-btn glass-btn" id="wx-search-btn">Search</button>
        </div>
        <div class="wx-unit-toggles">
          <button class="wx-unit-btn active" data-unit="C" id="wx-unit-c">°C</button>
          <button class="wx-unit-btn" data-unit="F" id="wx-unit-f">°F</button>
          <span class="wx-sep">|</span>
          <button class="wx-wind-btn active" data-wind="km/h">km/h</button>
          <button class="wx-wind-btn" data-wind="mph">mph</button>
          <button class="wx-wind-btn" data-wind="m/s">m/s</button>
        </div>
      </div>

      <div class="wx-body" id="wx-body">
        <!-- Current Weather -->
        <div class="wx-current" id="wx-current">
          <div class="wx-current-left">
            <div class="wx-icon-large" id="wx-icon"></div>
            <div class="wx-temp-large" id="wx-temp">--°</div>
            <div class="wx-condition" id="wx-condition">Loading...</div>
          </div>
          <div class="wx-current-right">
            <div class="wx-city-name" id="wx-city-name">--</div>
            <div class="wx-feels-like" id="wx-feels-like">Feels like --°</div>
            <div class="wx-hilo" id="wx-hilo">H: --° L: --°</div>
          </div>
        </div>

        <!-- Detail Grid -->
        <div class="wx-details" id="wx-details">
          <div class="wx-detail-card">
            <div class="wx-detail-label">💧 Humidity</div>
            <div class="wx-detail-value" id="wx-humidity">--%</div>
          </div>
          <div class="wx-detail-card">
            <div class="wx-detail-label">💨 Wind</div>
            <div class="wx-detail-value" id="wx-wind">-- km/h</div>
          </div>
          <div class="wx-detail-card">
            <div class="wx-detail-label">🌡 Pressure</div>
            <div class="wx-detail-value" id="wx-pressure">-- hPa</div>
          </div>
          <div class="wx-detail-card">
            <div class="wx-detail-label">👁 Visibility</div>
            <div class="wx-detail-value" id="wx-visibility">-- km</div>
          </div>
          <div class="wx-detail-card">
            <div class="wx-detail-label">☀️ UV Index</div>
            <div class="wx-detail-value" id="wx-uv">--</div>
          </div>
          <div class="wx-detail-card">
            <div class="wx-detail-label">💧 Dew Point</div>
            <div class="wx-detail-value" id="wx-dewpoint">--°</div>
          </div>
          <div class="wx-detail-card">
            <div class="wx-detail-label">🌅 Sunrise</div>
            <div class="wx-detail-value" id="wx-sunrise">--:--</div>
          </div>
          <div class="wx-detail-card">
            <div class="wx-detail-label">🌇 Sunset</div>
            <div class="wx-detail-value" id="wx-sunset">--:--</div>
          </div>
        </div>

        <!-- Hourly Forecast -->
        <div class="wx-section">
          <div class="wx-section-title">Hourly Forecast</div>
          <div class="wx-hourly" id="wx-hourly"></div>
        </div>

        <!-- 5-Day Forecast -->
        <div class="wx-section">
          <div class="wx-section-title">5-Day Forecast</div>
          <div class="wx-daily" id="wx-daily"></div>
        </div>

        <!-- Weather Alert -->
        <div class="wx-alert" id="wx-alert" style="display:none;">
          <span class="wx-alert-icon">⚠️</span>
          <span class="wx-alert-text" id="wx-alert-text"></span>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    this.element.querySelector('#wx-search-btn').addEventListener('click', () => {
      const city = this.element.querySelector('#wx-search').value.trim();
      if (city) this._loadCity(city);
    });
    this.element.querySelector('#wx-search').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const city = e.target.value.trim();
        if (city) this._loadCity(city);
      }
    });

    // Unit toggles
    this.element.querySelector('#wx-unit-c').addEventListener('click', () => { this.useCelsius = true; this._refreshUnitButtons(); this._renderWeather(); });
    this.element.querySelector('#wx-unit-f').addEventListener('click', () => { this.useCelsius = false; this._refreshUnitButtons(); this._renderWeather(); });

    this.element.querySelectorAll('.wx-wind-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.windUnit = btn.dataset.wind;
        this.element.querySelectorAll('.wx-wind-btn').forEach(b => b.classList.toggle('active', b.dataset.wind === this.windUnit));
        this._renderWeather();
      });
    });
  }

  _refreshUnitButtons() {
    this.element.querySelector('#wx-unit-c').classList.toggle('active', this.useCelsius);
    this.element.querySelector('#wx-unit-f').classList.toggle('active', !this.useCelsius);
  }

  // ─── Weather Data Generation ────────────────────────────────────
  _loadCity(city) {
    this.currentCity = city;
    this.weatherData = this._generateWeather(city);
    this._renderWeather();
  }

  _generateWeather(city) {
    const hash = this._hash(city);
    const rng = this._seededRandom(hash);

    const conditions = [
      { name: 'Clear Sky', icon: 'sun', tempMod: 5, humidityMod: -15 },
      { name: 'Partly Cloudy', icon: 'partly-cloudy', tempMod: 0, humidityMod: 0 },
      { name: 'Overcast', icon: 'cloudy', tempMod: -3, humidityMod: 10 },
      { name: 'Light Rain', icon: 'rain', tempMod: -5, humidityMod: 30 },
      { name: 'Heavy Rain', icon: 'heavy-rain', tempMod: -7, humidityMod: 40 },
      { name: 'Thunderstorm', icon: 'storm', tempMod: -4, humidityMod: 45 },
      { name: 'Snow', icon: 'snow', tempMod: -20, humidityMod: 20 },
      { name: 'Fog', icon: 'fog', tempMod: -2, humidityMod: 50 },
      { name: 'Windy', icon: 'windy', tempMod: -3, humidityMod: -10 },
      { name: 'Sunny', icon: 'sun', tempMod: 8, humidityMod: -20 }
    ];

    const baseTemp = 15 + (hash % 25) - 12; // Roughly -2 to 35
    const cond = conditions[hash % conditions.length];
    const temp = baseTemp + cond.tempMod + Math.floor(rng() * 6 - 3);
    const humidity = Math.max(10, Math.min(95, 50 + cond.humidityMod + Math.floor(rng() * 20 - 10)));
    const wind = Math.floor(rng() * 40 + 3);
    const pressure = Math.floor(990 + rng() * 50);
    const visibility = Math.floor(5 + rng() * 15);
    const uv = Math.floor(rng() * 11 + 1);
    const dewpoint = temp - Math.floor((100 - humidity) / 5);

    const sunriseH = 5 + Math.floor(rng() * 2);
    const sunriseM = Math.floor(rng() * 60);
    const sunsetH = 18 + Math.floor(rng() * 3);
    const sunsetM = Math.floor(rng() * 60);

    const feelsLike = temp + Math.floor(rng() * 4 - 2);
    const high = temp + Math.floor(rng() * 5 + 2);
    const low = temp - Math.floor(rng() * 5 + 2);

    // Generate 24 hourly forecasts
    const hourly = [];
    for (let i = 0; i < 24; i++) {
      const hourTemp = temp + Math.floor(Math.sin((i - 6) * Math.PI / 12) * 6 + rng() * 3 - 1.5);
      const hourCond = conditions[Math.floor(rng() * conditions.length)];
      hourly.push({
        hour: i,
        temp: hourTemp,
        condition: hourCond.name,
        icon: hourCond.icon,
        precip: Math.floor(rng() * 60)
      });
    }

    // Generate 5-day forecast
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daily = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() + i);
      const dayCond = conditions[Math.floor(rng() * conditions.length)];
      const dayHigh = temp + Math.floor(rng() * 8 + 1);
      const dayLow = temp - Math.floor(rng() * 6 + 1);
      daily.push({
        day: i === 0 ? 'Today' : days[dayDate.getDay()],
        date: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        high: dayHigh,
        low: dayLow,
        condition: dayCond.name,
        icon: dayCond.icon,
        precip: Math.floor(rng() * 80)
      });
    }

    // Possible alerts
    const alerts = [];
    if (cond.name === 'Thunderstorm') alerts.push('⛈ Thunderstorm Warning — Seek shelter indoors');
    if (cond.name === 'Heavy Rain') alerts.push('🌧 Heavy Rain Advisory — Flooding possible in low-lying areas');
    if (temp > 38) alerts.push('🔥 Extreme Heat Warning — Stay hydrated, avoid prolonged sun exposure');
    if (temp < -10) alerts.push('❄ Extreme Cold Warning — Frostbite risk, limit outdoor exposure');
    if (wind > 35) alerts.push('💨 High Wind Advisory — Secure loose objects');

    return {
      city, condition: cond.name, icon: cond.icon,
      temp, feelsLike, high, low, humidity, wind, pressure,
      visibility, uv, dewpoint,
      sunrise: `${String(sunriseH).padStart(2, '0')}:${String(sunriseM).padStart(2, '0')}`,
      sunset: `${String(sunsetH).padStart(2, '0')}:${String(sunsetM).padStart(2, '0')}`,
      hourly, daily, alerts
    };
  }

  // ─── Render ─────────────────────────────────────────────────────
  _renderWeather() {
    const d = this.weatherData;
    if (!d) return;

    // Current
    const tempC = d.temp;
    const tempDisplay = this.useCelsius ? tempC : Math.round(tempC * 9 / 5 + 32);
    const feelsC = d.feelsLike;
    const feelsDisplay = this.useCelsius ? feelsC : Math.round(feelsC * 9 / 5 + 32);
    const highDisplay = this.useCelsius ? d.high : Math.round(d.high * 9 / 5 + 32);
    const lowDisplay = this.useCelsius ? d.low : Math.round(d.low * 9 / 5 + 32);
    const unit = this.useCelsius ? '°C' : '°F';
    const deg = this.useCelsius ? '°' : '°';

    this.element.querySelector('#wx-city-name').textContent = d.city;
    this.element.querySelector('#wx-temp').textContent = `${tempDisplay}${unit}`;
    this.element.querySelector('#wx-condition').textContent = d.condition;
    this.element.querySelector('#wx-feels-like').textContent = `Feels like ${feelsDisplay}${unit}`;
    this.element.querySelector('#wx-hilo').textContent = `H: ${highDisplay}${unit}  L: ${lowDisplay}${unit}`;
    this.element.querySelector('#wx-icon').innerHTML = this._getWeatherIcon(d.icon, 'large');

    // Details
    this.element.querySelector('#wx-humidity').textContent = `${d.humidity}%`;
    this.element.querySelector('#wx-wind').textContent = `${this._convertWind(d.wind)} ${this.windUnit}`;
    this.element.querySelector('#wx-pressure').textContent = `${d.pressure} hPa`;
    this.element.querySelector('#wx-visibility').textContent = `${d.visibility} km`;
    this.element.querySelector('#wx-uv').textContent = `${d.uv} ${this._uvLevel(d.uv)}`;
    this.element.querySelector('#wx-dewpoint').textContent = this.useCelsius ? `${d.dewpoint}°C` : `${Math.round(d.dewpoint * 9 / 5 + 32)}°F`;
    this.element.querySelector('#wx-sunrise').textContent = d.sunrise;
    this.element.querySelector('#wx-sunset').textContent = d.sunset;

    // Hourly
    const hourlyEl = this.element.querySelector('#wx-hourly');
    hourlyEl.innerHTML = d.hourly.map(h => {
      const hTemp = this.useCelsius ? h.temp : Math.round(h.temp * 9 / 5 + 32);
      return `<div class="wx-hour-item">
        <div class="wx-hour-time">${String(h.hour).padStart(2, '0')}:00</div>
        <div class="wx-hour-icon">${this._getWeatherIcon(h.icon, 'small')}</div>
        <div class="wx-hour-temp">${hTemp}°</div>
        ${h.precip > 20 ? `<div class="wx-hour-precip">💧${h.precip}%</div>` : ''}
      </div>`;
    }).join('');

    // Daily
    const dailyEl = this.element.querySelector('#wx-daily');
    dailyEl.innerHTML = d.daily.map(day => {
      const dHigh = this.useCelsius ? day.high : Math.round(day.high * 9 / 5 + 32);
      const dLow = this.useCelsius ? day.low : Math.round(day.low * 9 / 5 + 32);
      return `<div class="wx-daily-item">
        <div class="wx-daily-day">${day.day}</div>
        <div class="wx-daily-date">${day.date}</div>
        <div class="wx-daily-icon">${this._getWeatherIcon(day.icon, 'medium')}</div>
        <div class="wx-daily-temps">
          <span class="wx-daily-high">${dHigh}°</span>
          <span class="wx-daily-low">${dLow}°</span>
        </div>
        ${day.precip > 20 ? `<div class="wx-daily-precip">💧${day.precip}%</div>` : ''}
      </div>`;
    }).join('');

    // Alerts
    const alertEl = this.element.querySelector('#wx-alert');
    const alertText = this.element.querySelector('#wx-alert-text');
    if (d.alerts.length > 0) {
      alertEl.style.display = 'flex';
      alertText.textContent = d.alerts.join(' • ');
    } else {
      alertEl.style.display = 'none';
    }

    // Background animation class
    this.element.className = `nexus-weather wx-bg-${d.icon}`;
  }

  _getWeatherIcon(type, size) {
    const sizeClass = size === 'large' ? 'wx-icon-lg' : size === 'medium' ? 'wx-icon-md' : 'wx-icon-sm';
    const icons = {
      'sun': `<div class="wx-ico ${sizeClass}"><div class="wx-sun"></div></div>`,
      'partly-cloudy': `<div class="wx-ico ${sizeClass}"><div class="wx-sun wx-sun-small"></div><div class="wx-cloud wx-cloud-small"></div></div>`,
      'cloudy': `<div class="wx-ico ${sizeClass}"><div class="wx-cloud"></div></div>`,
      'rain': `<div class="wx-ico ${sizeClass}"><div class="wx-cloud"></div><div class="wx-rain-drops"><span></span><span></span><span></span></div></div>`,
      'heavy-rain': `<div class="wx-ico ${sizeClass}"><div class="wx-cloud wx-cloud-dark"></div><div class="wx-rain-drops wx-heavy-rain"><span></span><span></span><span></span><span></span><span></span></div></div>`,
      'storm': `<div class="wx-ico ${sizeClass}"><div class="wx-cloud wx-cloud-dark"></div><div class="wx-lightning">⚡</div></div>`,
      'snow': `<div class="wx-ico ${sizeClass}"><div class="wx-cloud"></div><div class="wx-snowflakes"><span>❄</span><span>❄</span><span>❄</span></div></div>`,
      'fog': `<div class="wx-ico ${sizeClass}"><div class="wx-fog-lines"><span></span><span></span><span></span></div></div>`,
      'windy': `<div class="wx-ico ${sizeClass}"><div class="wx-wind-lines"><span></span><span></span><span></span></div></div>`
    };
    return icons[type] || icons['sun'];
  }

  _convertWind(kmh) {
    if (this.windUnit === 'mph') return Math.round(kmh * 0.621371);
    if (this.windUnit === 'm/s') return Math.round(kmh / 3.6 * 10) / 10;
    return kmh;
  }

  _uvLevel(uv) {
    if (uv <= 2) return '(Low)';
    if (uv <= 5) return '(Moderate)';
    if (uv <= 7) return '(High)';
    if (uv <= 10) return '(Very High)';
    return '(Extreme)';
  }

  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  _seededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  // ─── Styles ─────────────────────────────────────────────────────
  _getStyles() {
    return `
      .nexus-weather {
        width: 100%; height: 100%;
        background: rgba(10, 5, 20, 0.96);
        border: 1px solid rgba(255, 0, 60, 0.2);
        border-radius: 8px;
        display: flex; flex-direction: column;
        overflow: hidden;
        box-shadow: 0 0 30px rgba(255, 0, 60, 0.1);
        font-family: 'Segoe UI', sans-serif;
      }

      .wx-header {
        padding: 10px 14px;
        background: rgba(15, 8, 25, 0.8);
        border-bottom: 1px solid rgba(255, 0, 60, 0.12);
        flex-shrink: 0;
      }
      .wx-search-row { display: flex; gap: 8px; margin-bottom: 6px; }
      .wx-search { flex: 1; padding: 6px 10px; font-size: 13px;
        background: rgba(20, 10, 35, 0.9); border: 1px solid rgba(255, 0, 60, 0.2);
        color: #eee; border-radius: 6px; outline: none;
      }
      .wx-search:focus { border-color: #ff003c; }
      .wx-search-btn { padding: 6px 14px; font-size: 12px; }
      .wx-unit-toggles { display: flex; gap: 4px; align-items: center; }
      .wx-unit-btn, .wx-wind-btn {
        padding: 3px 8px; font-size: 10px;
        background: rgba(255, 0, 60, 0.06); border: 1px solid rgba(255, 0, 60, 0.12);
        color: #888; border-radius: 3px; cursor: pointer;
      }
      .wx-unit-btn.active, .wx-wind-btn.active { background: rgba(255, 0, 60, 0.2); color: #ff003c; border-color: #ff003c; }
      .wx-sep { color: #333; margin: 0 4px; }

      .wx-body { flex: 1; overflow-y: auto; padding: 14px; }
      .wx-body::-webkit-scrollbar { width: 4px; }
      .wx-body::-webkit-scrollbar-thumb { background: rgba(255,0,60,0.3); border-radius: 2px; }

      /* Current */
      .wx-current {
        display: flex; justify-content: space-between; align-items: center;
        padding: 16px; margin-bottom: 16px;
        background: rgba(255, 0, 60, 0.04); border: 1px solid rgba(255, 0, 60, 0.1);
        border-radius: 10px;
      }
      .wx-current-left { display: flex; align-items: center; gap: 12px; }
      .wx-icon-large { width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
      .wx-temp-large { font-size: 3em; color: #eee; font-weight: 200;
        text-shadow: 0 0 15px rgba(255, 0, 60, 0.3); }
      .wx-condition { font-size: 13px; color: #aaa; }
      .wx-current-right { text-align: right; }
      .wx-city-name { font-size: 16px; color: #ddd; font-weight: 600; margin-bottom: 4px; }
      .wx-feels-like { font-size: 11px; color: #888; }
      .wx-hilo { font-size: 12px; color: #aaa; margin-top: 4px; }

      /* Details */
      .wx-details {
        display: grid; grid-template-columns: repeat(4, 1fr);
        gap: 8px; margin-bottom: 16px;
      }
      .wx-detail-card {
        padding: 10px; text-align: center;
        background: rgba(255, 0, 60, 0.03); border: 1px solid rgba(255, 0, 60, 0.06);
        border-radius: 8px;
      }
      .wx-detail-label { font-size: 10px; color: #888; margin-bottom: 4px; }
      .wx-detail-value { font-size: 14px; color: #eee; font-weight: 500; }

      /* Sections */
      .wx-section { margin-bottom: 16px; }
      .wx-section-title { font-size: 12px; color: #ff003c; font-weight: 600; margin-bottom: 8px; letter-spacing: 1px; }

      /* Hourly */
      .wx-hourly {
        display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px;
      }
      .wx-hourly::-webkit-scrollbar { height: 3px; }
      .wx-hourly::-webkit-scrollbar-thumb { background: rgba(255,0,60,0.3); border-radius: 2px; }
      .wx-hour-item {
        min-width: 55px; text-align: center; padding: 8px 6px;
        background: rgba(255, 0, 60, 0.03); border: 1px solid rgba(255, 0, 60, 0.06);
        border-radius: 8px; flex-shrink: 0;
      }
      .wx-hour-time { font-size: 10px; color: #888; }
      .wx-hour-icon { margin: 4px 0; }
      .wx-hour-temp { font-size: 14px; color: #eee; font-weight: 500; }
      .wx-hour-precip { font-size: 9px; color: #00ccff; margin-top: 2px; }

      /* Daily */
      .wx-daily { display: flex; flex-direction: column; gap: 4px; }
      .wx-daily-item {
        display: flex; align-items: center; gap: 10px;
        padding: 8px 12px;
        background: rgba(255, 0, 60, 0.03); border: 1px solid rgba(255, 0, 60, 0.06);
        border-radius: 6px;
      }
      .wx-daily-day { width: 70px; font-size: 12px; color: #ddd; font-weight: 600; }
      .wx-daily-date { width: 50px; font-size: 10px; color: #888; }
      .wx-daily-icon { width: 30px; text-align: center; }
      .wx-daily-temps { flex: 1; text-align: right; font-size: 13px; }
      .wx-daily-high { color: #eee; }
      .wx-daily-low { color: #888; margin-left: 8px; }
      .wx-daily-precip { font-size: 10px; color: #00ccff; min-width: 40px; text-align: right; }

      /* Alert */
      .wx-alert {
        display: flex; align-items: center; gap: 8px;
        padding: 10px 14px; margin-top: 8px;
        background: rgba(255, 170, 0, 0.08); border: 1px solid rgba(255, 170, 0, 0.2);
        border-radius: 6px; font-size: 11px; color: #ffaa00;
      }

      /* Weather Icons (CSS-drawn) */
      .wx-ico { display: flex; align-items: center; justify-content: center; position: relative; }
      .wx-icon-lg { width: 60px; height: 60px; }
      .wx-icon-md { width: 28px; height: 28px; }
      .wx-icon-sm { width: 20px; height: 20px; }

      .wx-sun {
        width: 100%; height: 100%; border-radius: 50%;
        background: radial-gradient(circle, #ffaa00, #ff8800);
        box-shadow: 0 0 15px rgba(255, 170, 0, 0.6), 0 0 30px rgba(255, 136, 0, 0.3);
        animation: wx-sun-pulse 3s ease-in-out infinite;
      }
      .wx-sun-small { width: 60%; height: 60%; position: absolute; top: 5px; left: 5px; }
      @keyframes wx-sun-pulse { 50% { box-shadow: 0 0 20px rgba(255, 170, 0, 0.8), 0 0 40px rgba(255, 136, 0, 0.4); } }

      .wx-cloud {
        width: 80%; height: 50%; background: #888; border-radius: 20px;
        position: relative;
        box-shadow: 0 0 10px rgba(136, 136, 136, 0.3);
      }
      .wx-cloud::before {
        content: ''; position: absolute; width: 50%; height: 130%;
        background: #888; border-radius: 50%;
        top: -50%; left: 20%;
      }
      .wx-cloud-small { width: 55%; height: 40%; position: absolute; bottom: 5px; right: 3px; }
      .wx-cloud-dark { background: #555; }
      .wx-cloud-dark::before { background: #555; }

      .wx-rain-drops {
        position: absolute; bottom: 0; left: 20%; display: flex; gap: 3px;
      }
      .wx-rain-drops span {
        width: 2px; height: 8px; background: #00ccff;
        border-radius: 0 0 2px 2px;
        animation: wx-rain-fall 0.8s linear infinite;
      }
      .wx-rain-drops span:nth-child(2) { animation-delay: 0.2s; }
      .wx-rain-drops span:nth-child(3) { animation-delay: 0.4s; }
      .wx-heavy-rain span { height: 12px; width: 2px; }
      @keyframes wx-rain-fall {
        0% { transform: translateY(-5px); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(10px); opacity: 0; }
      }

      .wx-lightning {
        position: absolute; bottom: 2px; font-size: 16px;
        animation: wx-flash 2s ease-in-out infinite;
      }
      @keyframes wx-flash { 0%, 90%, 100% { opacity: 0; } 92%, 96% { opacity: 1; } }

      .wx-snowflakes {
        position: absolute; bottom: -2px; left: 15%; display: flex; gap: 4px;
      }
      .wx-snowflakes span {
        font-size: 8px; animation: wx-snow-fall 2s linear infinite;
      }
      .wx-snowflakes span:nth-child(2) { animation-delay: 0.5s; }
      .wx-snowflakes span:nth-child(3) { animation-delay: 1s; }
      @keyframes wx-snow-fall {
        0% { transform: translateY(-5px) rotate(0deg); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(10px) rotate(180deg); opacity: 0; }
      }

      .wx-fog-lines {
        width: 80%; display: flex; flex-direction: column; gap: 4px;
      }
      .wx-fog-lines span {
        height: 3px; background: rgba(200, 200, 200, 0.4);
        border-radius: 2px;
        animation: wx-fog-drift 3s ease-in-out infinite;
      }
      .wx-fog-lines span:nth-child(2) { width: 70%; animation-delay: 0.5s; }
      .wx-fog-lines span:nth-child(3) { width: 85%; animation-delay: 1s; }
      @keyframes wx-fog-drift { 50% { transform: translateX(5px); opacity: 0.5; } }

      .wx-wind-lines {
        width: 80%; display: flex; flex-direction: column; gap: 4px;
      }
      .wx-wind-lines span {
        height: 2px; background: rgba(0, 204, 255, 0.5);
        border-radius: 2px;
        animation: wx-wind-blow 1.5s ease-in-out infinite;
      }
      .wx-wind-lines span:nth-child(1) { width: 100%; }
      .wx-wind-lines span:nth-child(2) { width: 60%; animation-delay: 0.3s; }
      .wx-wind-lines span:nth-child(3) { width: 80%; animation-delay: 0.6s; }
      @keyframes wx-wind-blow {
        0% { transform: translateX(-10px); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateX(10px); opacity: 0; }
      }

      /* Background conditions */
      .wx-bg-rain .wx-body { background: linear-gradient(180deg, rgba(0, 50, 100, 0.05), transparent); }
      .wx-bg-storm .wx-body { background: linear-gradient(180deg, rgba(30, 0, 60, 0.1), transparent); }
      .wx-bg-snow .wx-body { background: linear-gradient(180deg, rgba(100, 150, 200, 0.05), transparent); }
    `;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.NexusWeather = NexusWeather;
}
