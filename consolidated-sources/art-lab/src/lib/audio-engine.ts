// Noiacore — Enjambre Sónico
// Motor de audio generativo con Web Audio API:
// - Osciladores drone (bass + pad) con filtros modulados
// - Secuenciador de notas pentatónicas (arpegio sutil)
// - Analizador FFT → bandas bass/mid/high → store Zustand
// - Start/stop limpio, sin dependencias externas

export interface AudioBands {
  bass: number;
  mid: number;
  high: number;
  level: number;
}

type BandCb = (b: AudioBands) => void;

// Escala pentatónica menor (La menor pentatónica) — frecuencias en Hz
const PENTATONIC = [
  220.0, // A3
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.0, // G4
  440.0, // A4
  523.25, // C5
  587.33, // D5
];

export class SonicSwarm {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(0);
  private drones: { osc: OscillatorNode; gain: GainNode }[] = [];
  private arpOsc: OscillatorNode | null = null;
  private arpGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private arpInterval: ReturnType<typeof setInterval> | null = null;
  private rafId = 0;
  private running = false;
  private bandCb: BandCb | null = null;
  // suavizado de bandas
  private smooth: AudioBands = { bass: 0, mid: 0, high: 0, level: 0 };

  constructor(bandCb?: BandCb) {
    this.bandCb = bandCb ?? null;
  }

  setBandCallback(cb: BandCb) {
    this.bandCb = cb;
  }

  async start(): Promise<boolean> {
    if (this.running) return true;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctx();
      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }
      const ctx = this.ctx;

      // Master chain: drones + arp -> filter -> masterGain -> analyser -> destination
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 0.0;
      this.masterGain.connect(ctx.destination);

      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.78;
      this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      this.masterGain.connect(this.analyser);

      // Filtro paso-bajo para calidez
      this.filter = ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 1400;
      this.filter.Q.value = 1.2;
      this.filter.connect(this.masterGain);

      // LFO modula el cutoff del filtro (movimiento)
      this.lfo = ctx.createOscillator();
      this.lfo.frequency.value = 0.08;
      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.value = 600;
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.filter.frequency);
      this.lfo.start();

      // Drones: dos osciladores afinados (root + quinta)
      const droneFreqs = [110.0, 164.81]; // A2 + E3
      droneFreqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? "sine" : "triangle";
        osc.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = i === 0 ? 0.18 : 0.09;
        osc.connect(g);
        g.connect(this.filter!);
        osc.start();
        this.drones.push({ osc, gain: g });
      });

      // Arpegio: oscilador dedicado con gain rítmico
      this.arpOsc = ctx.createOscillator();
      this.arpOsc.type = "sine";
      this.arpOsc.frequency.value = PENTATONIC[0];
      this.arpGain = ctx.createGain();
      this.arpGain.gain.value = 0.0;
      this.arpOsc.connect(this.arpGain);
      this.arpGain.connect(this.filter!);
      this.arpOsc.start();

      // Secuenciador del arpegio (cada ~600ms)
      let step = 0;
      this.arpInterval = setInterval(() => {
        if (!this.ctx || !this.arpOsc || !this.arpGain) return;
        const note = PENTATONIC[step % PENTATONIC.length];
        this.arpOsc.frequency.setValueAtTime(
          note,
          this.ctx.currentTime
        );
        // envolvente corta
        const t = this.ctx.currentTime;
        this.arpGain.gain.cancelScheduledValues(t);
        this.arpGain.gain.setValueAtTime(0.0, t);
        this.arpGain.gain.linearRampToValueAtTime(0.12, t + 0.02);
        this.arpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        step++;
      }, 620);

      // Fade-in del master
      const now = ctx.currentTime;
      this.masterGain.gain.setValueAtTime(0.0, now);
      this.masterGain.gain.linearRampToValueAtTime(0.5, now + 1.5);

      this.running = true;
      this.startAnalysis();
      return true;
    } catch (e) {
      this.dispose();
      return false;
    }
  }

  private startAnalysis() {
    const tick = () => {
      if (!this.running || !this.analyser) return;
      this.rafId = requestAnimationFrame(tick);
      this.analyser.getByteFrequencyData(this.freqData);
      const n = this.freqData.length;
      // 3 bandas: bass (0-12%), mid (12-50%), high (50-100%)
      const bassEnd = Math.floor(n * 0.12);
      const midEnd = Math.floor(n * 0.5);
      let bass = 0,
        mid = 0,
        high = 0;
      for (let i = 0; i < bassEnd; i++) bass += this.freqData[i];
      for (let i = bassEnd; i < midEnd; i++) mid += this.freqData[i];
      for (let i = midEnd; i < n; i++) high += this.freqData[i];
      bass = bass / (bassEnd * 255 || 1);
      mid = mid / ((midEnd - bassEnd) * 255 || 1);
      high = high / ((n - midEnd) * 255 || 1);
      const level = (bass + mid + high) / 3;
      // suavizado
      const s = this.smooth;
      const k = 0.25;
      s.bass += (bass - s.bass) * k;
      s.mid += (mid - s.mid) * k;
      s.high += (high - s.high) * k;
      s.level += (level - s.level) * k;
      if (this.bandCb) this.bandCb({ ...s });
    };
    this.rafId = requestAnimationFrame(tick);
  }

  async stop(): Promise<void> {
    if (!this.running || !this.ctx) return;
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    if (this.arpInterval) {
      clearInterval(this.arpInterval);
      this.arpInterval = null;
    }
    // fade-out
    const ctx = this.ctx;
    const mg = this.masterGain;
    if (mg) {
      const now = ctx.currentTime;
      mg.gain.cancelScheduledValues(now);
      mg.gain.setValueAtTime(mg.gain.value, now);
      mg.gain.linearRampToValueAtTime(0.0, now + 0.6);
    }
    await new Promise((r) => setTimeout(r, 650));
    this.dispose();
  }

  private dispose() {
    this.drones.forEach(({ osc }) => {
      try {
        osc.stop();
      } catch {
        /* noop */
      }
    });
    this.drones = [];
    try {
      this.arpOsc?.stop();
    } catch {
      /* noop */
    }
    try {
      this.lfo?.stop();
    } catch {
      /* noop */
    }
    this.arpOsc = null;
    this.arpGain = null;
    this.lfo = null;
    this.lfoGain = null;
    this.filter = null;
    this.masterGain = null;
    this.analyser = null;
    if (this.ctx) {
      this.ctx.close().catch(() => null);
      this.ctx = null;
    }
  }

  get isRunning() {
    return this.running;
  }
}
