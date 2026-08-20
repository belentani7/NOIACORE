/**
 * NOIACORE LAB / optional resonance engine
 * El estado por defecto es SILENT: una performance silenciosa no debe emitir audio
 * por sorpresa. La activación, si se incorpora en el futuro, deberá ser explícita.
 */
export enum NotificationSeverity {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
  ULTRA = 'ultra'
}

export enum SoundPreset {
  NEUTRAL = 'neutral',
  SUCCESS = 'success',
  COMPLETION = 'completion',
  ACHIEVEMENT = 'achievement',
  WARNING = 'warning',
  CRITICAL = 'critical',
  CYBER = 'cyber',
  NOIA = 'noia',
  SILENT = 'silent'
}

export class NoiacoreSoundEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume = 0.18;
  private isInitialized = false;
  private isSilent = true;

  public setSilent(value: boolean) {
    this.isSilent = value;
    if (this.masterGain) this.masterGain.gain.value = value ? 0 : this.volume;
  }

  public async init(): Promise<void> {
    if (this.isInitialized || this.isSilent) return;
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext = new AudioCtx();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.isSilent ? 0 : this.volume;
      this.masterGain.connect(this.audioContext.destination);
      this.isInitialized = true;
    } catch {
      this.audioContext = null;
      this.masterGain = null;
    }
  }

  public async play(preset: SoundPreset = SoundPreset.NOIA): Promise<void> {
    if (this.isSilent || preset === SoundPreset.SILENT) return;
    try {
      if (!this.audioContext) await this.init();
      if (!this.audioContext || !this.masterGain) return;
      if (this.audioContext.state === 'suspended') await this.audioContext.resume();

      const now = this.audioContext.currentTime;
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      oscillator.type = preset === SoundPreset.CYBER ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(220, now);
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.35);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      oscillator.connect(gain);
      gain.connect(this.masterGain);
      oscillator.start(now);
      oscillator.stop(now + 0.8);
    } catch {
      // La experiencia visual no depende del audio.
    }
  }
}

export const soundEngine = new NoiacoreSoundEngine();
