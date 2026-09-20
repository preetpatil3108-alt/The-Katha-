/**
 * THE KATHA - Audio Architecture
 * High-performance, AAA unified AudioManager using Web Audio API synthesis.
 * Single source of truth for all audio routing:
 * - Master Channel -> audioCtx.destination
 * - Music Channel -> Master Channel
 * - Ambient/Atmosphere Channel -> Master Channel
 * - Vehicle Channel -> Master Channel
 * - SFX/UI/Dialogue Channel -> Master Channel
 *
 * Supports global mute, seamless pause/resume without resetting audio positions,
 * zero startup beeps, anti-duplicate protections, and smooth transitions.
 */

export type SoundEffect =
  | 'button_tap'
  | 'play_game'
  | 'laddu_collect'
  | 'leaf_collect'
  | 'reward'
  | 'level_complete'
  | 'footstep'
  | 'pause'
  | 'resume'
  | 'mushak_squeak'
  | 'mushak_nibble'
  | 'dialogue_tick'
  | 'bell_chime'
  | 'celebration_chime'
  | 'vehicle_crash';

export class AudioManager {
  private static instance: AudioManager;
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private vehicleGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMuted: boolean = false;
  private isPaused: boolean = false;
  private musicVolume: number = 0.6;
  private sfxVolume: number = 0.8;

  private bgmWanted: boolean = false;
  private bgmPlaying: boolean = false;
  private bgmOscillatorInterval: number | null = null;
  private noteIndex: number = 0;

  private constructor() {
    // Lazy initialize on first user gesture to comply with browser autoplay policies
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initializes the unified AudioContext and hierarchical GainNode graph
   */
  public initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();

        // 1. Master Output Gain -> Destination
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(
          this.isMuted ? 0.0 : 1.0,
          this.audioCtx.currentTime
        );
        this.masterGain.connect(this.audioCtx.destination);

        // 2. Channel Gain Nodes -> Master Gain
        this.musicGain = this.audioCtx.createGain();
        this.musicGain.gain.setValueAtTime(
          this.isPaused ? 0.3 * this.musicVolume : this.musicVolume,
          this.audioCtx.currentTime
        );
        this.musicGain.connect(this.masterGain);

        this.ambientGain = this.audioCtx.createGain();
        this.ambientGain.gain.setValueAtTime(
          this.isPaused ? 0.2 : 1.0,
          this.audioCtx.currentTime
        );
        this.ambientGain.connect(this.masterGain);

        this.vehicleGain = this.audioCtx.createGain();
        this.vehicleGain.gain.setValueAtTime(
          this.isPaused ? 0.0 : 1.0,
          this.audioCtx.currentTime
        );
        this.vehicleGain.connect(this.masterGain);

        this.sfxGain = this.audioCtx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioCtx.currentTime);
        this.sfxGain.connect(this.masterGain);
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  /**
   * Channel Node Accessors for sub-systems
   */
  public getAudioContext(): AudioContext | null {
    return this.initContext();
  }

  public getMasterGainNode(): GainNode | null {
    this.initContext();
    return this.masterGain;
  }

  public getMusicInputNode(): GainNode | null {
    this.initContext();
    return this.musicGain;
  }

  public getAmbientInputNode(): GainNode | null {
    this.initContext();
    return this.ambientGain;
  }

  public getVehicleInputNode(): GainNode | null {
    this.initContext();
    return this.vehicleGain;
  }

  public getSfxInputNode(): GainNode | null {
    this.initContext();
    return this.sfxGain;
  }

  /**
   * GLOBAL MUTE SYSTEM
   * Silences master output immediately without unloading sources or losing timing.
   * Restores smoothly when unmuted.
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.initContext();

    if (this.audioCtx && this.masterGain) {
      const now = this.audioCtx.currentTime;
      // Smooth 20ms anti-pop ramp
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.setTargetAtTime(muted ? 0.0 : 1.0, now, 0.02);
    }

    // If unmuted and music was previously requested, ensure BGM loop is alive
    if (!muted && this.bgmWanted && !this.bgmPlaying) {
      this.startAmbientBgm();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * GLOBAL PAUSE SYSTEM
   * Pauses vehicle sounds, softens ambiance/music, and prevents gameplay SFX triggers while paused.
   */
  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.initContext();

    if (this.audioCtx) {
      const now = this.audioCtx.currentTime;

      // 1. Vehicle Audio: Mute instantly when paused, restore when resumed
      if (this.vehicleGain) {
        this.vehicleGain.gain.cancelScheduledValues(now);
        this.vehicleGain.gain.setValueAtTime(this.vehicleGain.gain.value, now);
        this.vehicleGain.gain.setTargetAtTime(paused ? 0.0 : 1.0, now, 0.03);
      }

      // 2. Ambient Atmosphere: Tranquil ducking during pause menu
      if (this.ambientGain) {
        this.ambientGain.gain.cancelScheduledValues(now);
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
        this.ambientGain.gain.setTargetAtTime(paused ? 0.2 : 1.0, now, 0.05);
      }

      // 3. Music: Subtle background presence during pause
      if (this.musicGain) {
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
        this.musicGain.gain.setTargetAtTime(
          paused ? 0.35 * this.musicVolume : this.musicVolume,
          now,
          0.05
        );
      }
    }
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.audioCtx && this.musicGain) {
      const now = this.audioCtx.currentTime;
      this.musicGain.gain.setTargetAtTime(
        this.isPaused ? 0.35 * this.musicVolume : this.musicVolume,
        now,
        0.04
      );
    }
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.audioCtx && this.sfxGain) {
      const now = this.audioCtx.currentTime;
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, now, 0.04);
    }
  }

  /**
   * Play procedural festive sound effects routed through the SFX channel
   */
  public playSound(effect: SoundEffect): void {
    if (this.isMuted) return;

    // When paused, ONLY allow UI interaction sounds
    if (this.isPaused) {
      const allowedInPause = effect === 'button_tap' || effect === 'pause' || effect === 'resume';
      if (!allowedInPause) return;
    }

    this.initContext();
    if (!this.audioCtx || !this.sfxGain) return;

    try {
      const now = this.audioCtx.currentTime;
      const ctx = this.audioCtx;
      const output = this.sfxGain;

      switch (effect) {
        case 'button_tap': {
          // Crisp soft wooden block / tabla banya tap
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          osc.connect(gain);
          gain.connect(output);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }

        case 'play_game': {
          // Unwanted synthetic startup beep permanently removed per AAA audio polish requirements
          break;
        }

        case 'laddu_collect': {
          // Sweet golden sparkle (ascending glissando)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, now); // D5
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          osc.connect(gain);
          gain.connect(output);
          osc.start(now);
          osc.stop(now + 0.22);
          break;
        }

        case 'leaf_collect': {
          // Soft natural rustle tone
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.linearRampToValueAtTime(659.25, now + 0.12);

          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

          osc.connect(gain);
          gain.connect(output);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'reward':
        case 'level_complete': {
          // Grand celebratory Indian fanfare
          const melody = [
            { f: 440.0, d: 0.14 }, // A4
            { f: 554.37, d: 0.14 }, // C#5
            { f: 659.25, d: 0.18 }, // E5
            { f: 880.0, d: 0.45 }, // A5
          ];
          let timeOffset = 0;
          melody.forEach((item) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(item.f, now + timeOffset);

            gain.gain.setValueAtTime(0.35, now + timeOffset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + item.d);

            osc.connect(gain);
            gain.connect(output);
            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + item.d);
            timeOffset += item.d * 0.85;
          });
          break;
        }

        case 'pause':
        case 'resume': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(effect === 'pause' ? 440 : 330, now);
          osc.frequency.exponentialRampToValueAtTime(
            effect === 'pause' ? 261.63 : 523.25,
            now + 0.12
          );

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc.connect(gain);
          gain.connect(output);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }

        case 'mushak_squeak': {
          // Playful cartoon mouse double-squeak
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1400, now);
          osc.frequency.exponentialRampToValueAtTime(2200, now + 0.07);
          osc.frequency.setValueAtTime(1800, now + 0.09);
          osc.frequency.exponentialRampToValueAtTime(2400, now + 0.15);

          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

          osc.connect(gain);
          gain.connect(output);
          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }

        case 'mushak_nibble': {
          // Soft rhythmic nibble / crunch sound
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(650, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

          osc.connect(gain);
          gain.connect(output);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }

        case 'dialogue_tick': {
          // Subtle warm dialogue blip
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(420, now + 0.04);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.connect(gain);
          gain.connect(output);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }

        case 'vehicle_crash': {
          // Heavy impact thud with low frequency dissipation
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(160, now);
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

          osc.connect(gain);
          gain.connect(output);
          osc.start(now);
          osc.stop(now + 0.35);
          break;
        }

        case 'bell_chime': {
          // Authentic brass pooja bell chime
          const partials = [1200, 2420, 3650];
          partials.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.18 / (idx + 1), now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
            osc.connect(gain);
            gain.connect(output);
            osc.start(now);
            osc.stop(now + 0.85);
          });
          break;
        }

        case 'celebration_chime': {
          // Joyful Chanda collection celebration chime (pentatonic triad)
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            gain.gain.setValueAtTime(0.22, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.5);
            osc.connect(gain);
            gain.connect(output);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.5);
          });
          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.warn('[AudioManager] Sound playback safely skipped:', e);
    }
  }

  /**
   * Procedural ambient festive background drone/raga ambiance.
   * Single interval guarantee: never spawns duplicate timers.
   * Routes into musicGain.
   */
  public startAmbientBgm(): void {
    this.bgmWanted = true;
    if (this.bgmPlaying && this.bgmOscillatorInterval !== null) return;

    if (this.bgmOscillatorInterval !== null) {
      clearInterval(this.bgmOscillatorInterval);
      this.bgmOscillatorInterval = null;
    }

    this.initContext();
    if (!this.audioCtx || !this.musicGain) return;

    this.bgmPlaying = true;
    const scaleNotes = [220, 277.18, 329.63, 440]; // A major meditative tonic

    this.bgmOscillatorInterval = window.setInterval(() => {
      if (!this.bgmPlaying || !this.audioCtx || !this.musicGain) return;
      try {
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(scaleNotes[this.noteIndex % scaleNotes.length], now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 2.5);

        this.noteIndex++;
      } catch {
        // Safe catch
      }
    }, 2000);
  }

  public stopBgm(): void {
    this.bgmWanted = false;
    this.bgmPlaying = false;
    if (this.bgmOscillatorInterval !== null) {
      clearInterval(this.bgmOscillatorInterval);
      this.bgmOscillatorInterval = null;
    }
  }

  /**
   * Smooth transition helper between scenes (Cinematic -> Gameplay, Gameplay -> Complete, Pause <-> Gameplay)
   */
  public smoothTransition(durationMs: number = 300): void {
    if (!this.audioCtx || !this.masterGain || this.isMuted) return;
    const now = this.audioCtx.currentTime;
    const durSec = Math.max(0.1, durationMs / 1000);
    const halfDur = durSec * 0.4;

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.3, now + halfDur);
    this.masterGain.gain.linearRampToValueAtTime(1.0, now + durSec);
  }

  /**
   * Play external audio track with fallback
   */
  public async playAudioFile(url: string, loop: boolean = false): Promise<HTMLAudioElement | null> {
    if (this.isMuted) return null;
    try {
      const audio = new Audio(url);
      audio.loop = loop;
      audio.volume = this.musicVolume;
      await audio.play();
      return audio;
    } catch (err) {
      console.warn(`[AudioManager] External audio asset unavailable (${url}), using procedural sound:`, err);
      return null;
    }
  }
}

export const audioManager = AudioManager.getInstance();
