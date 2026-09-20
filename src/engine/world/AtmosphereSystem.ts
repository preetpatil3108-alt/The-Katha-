/**
 * THE KATHA - Village Atmosphere System
 *
 * Implements living atmosphere:
 * - Natural flying birds with wing-flapping animations, varied altitudes & curved flight paths
 * - Slowly drifting fluffy clouds across the village sky
 * - Procedural ambient audio (gentle wind breeze, birdsong, distant temple chimes)
 */

import * as THREE from 'three';
import { adaptiveGraphics } from '../../core/graphics/AdaptiveGraphicsManager';
import { audioManager } from '../../core/audio/AudioManager';

export interface BirdInstance {
  group: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  flightType: 'circle' | 'cross' | 'figure8';
  center: THREE.Vector3;
  orbitRadius: number;
  altitude: number;
  speed: number;
  progress: number;
  flapPhase: number;
  flapFrequency: number;
  isGliding: boolean;
  glideTimer: number;
}

export interface CloudInstance {
  group: THREE.Group;
  speed: THREE.Vector3;
}

export class AtmosphereSystem {
  public group: THREE.Group = new THREE.Group();
  private birds: BirdInstance[] = [];
  private clouds: CloudInstance[] = [];

  // Web Audio Context for Procedural Ambient Environment
  private audioCtx: AudioContext | null = null;
  private isAudioRunning: boolean = false;
  private noiseSource: AudioBufferSourceNode | null = null;
  private windGainNode: GainNode | null = null;
  private templeBellTimer: number = 25.0 + Math.random() * 15.0;
  private dholProcessionTimer: number = 18.0 + Math.random() * 10.0;
  private isMuted: boolean = false;
  private isPaused: boolean = false;

  constructor() {
    this.group.name = 'atmosphere_system';
    this.buildClouds();
    this.buildBirds();
  }

  /**
   * 1. Moving Clouds across the sky
   */
  private buildClouds(): void {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: '#fffbf5',
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88,
      flatShading: true,
    });

    const cloudCount = 14;
    for (let i = 0; i < cloudCount; i++) {
      const cloudGroup = new THREE.Group();

      // Cloud position spread across sky (radius 260m)
      const x = (Math.random() - 0.5) * 520;
      const z = (Math.random() - 0.5) * 520;
      const y = 52 + Math.random() * 32;
      cloudGroup.position.set(x, y, z);

      // Multi-sphere billowy cluster
      const sphereCount = 5 + Math.floor(Math.random() * 4);
      const baseScale = 3.5 + Math.random() * 4.0;

      for (let s = 0; s < sphereCount; s++) {
        const radius = (0.7 + Math.random() * 0.6) * baseScale;
        const sphereGeo = new THREE.SphereGeometry(radius, 7, 6);
        const puff = new THREE.Mesh(sphereGeo, cloudMat);

        // Flatten slightly along Y for authentic fluffy stratus cloud look
        puff.scale.set(1.4, 0.65, 1.2);
        puff.position.set(
          (s - sphereCount / 2) * (baseScale * 0.75) + (Math.random() - 0.5) * baseScale * 0.4,
          (Math.random() - 0.5) * (baseScale * 0.3),
          (Math.random() - 0.5) * (baseScale * 0.6)
        );
        cloudGroup.add(puff);
      }

      this.group.add(cloudGroup);
      this.clouds.push({
        group: cloudGroup,
        // Slow natural drift speed along prevailing southwest breeze
        speed: new THREE.Vector3(1.2 + Math.random() * 0.8, 0, -0.7 - Math.random() * 0.5),
      });
    }
  }

  /**
   * 2. Flying Birds with animated flapping wings & varied flight paths
   */
  private buildBirds(): void {
    const birdBodyMat = new THREE.MeshLambertMaterial({ color: '#292524' }); // Charcoal / Dark plumage
    const birdWingMat = new THREE.MeshLambertMaterial({ color: '#44403c', side: THREE.DoubleSide });
    const beakMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });

    const birdConfigs: Array<{
      flightType: 'circle' | 'cross' | 'figure8';
      center: THREE.Vector3;
      radius: number;
      alt: number;
      speed: number;
    }> = [
      // Circling soaring birds above village & Banyan tree
      { flightType: 'circle', center: new THREE.Vector3(0, 0, 0), radius: 36, alt: 22, speed: 0.35 },
      { flightType: 'circle', center: new THREE.Vector3(-14, 0, -10), radius: 28, alt: 19, speed: -0.42 },
      { flightType: 'circle', center: new THREE.Vector3(10, 0, 8), radius: 45, alt: 27, speed: 0.3 },
      { flightType: 'circle', center: new THREE.Vector3(0, 0, -18), radius: 52, alt: 34, speed: -0.26 },

      // Cross-village long flight paths
      { flightType: 'cross', center: new THREE.Vector3(-80, 0, 40), radius: 80, alt: 24, speed: 0.22 },
      { flightType: 'cross', center: new THREE.Vector3(80, 0, -40), radius: 95, alt: 31, speed: 0.25 },
      { flightType: 'cross', center: new THREE.Vector3(-50, 0, -50), radius: 70, alt: 26, speed: 0.28 },

      // Figure-8 soaring patterns
      { flightType: 'figure8', center: new THREE.Vector3(5, 0, 0), radius: 42, alt: 29, speed: 0.32 },
      { flightType: 'figure8', center: new THREE.Vector3(-8, 0, 12), radius: 38, alt: 21, speed: -0.36 },
      { flightType: 'figure8', center: new THREE.Vector3(12, 0, -14), radius: 48, alt: 38, speed: 0.24 },
    ];

    birdConfigs.forEach((cfg, idx) => {
      const birdGroup = new THREE.Group();

      // Body (Sleek aerodynamic spindle)
      const bodyGeo = new THREE.ConeGeometry(0.14, 0.85, 5);
      const body = new THREE.Mesh(bodyGeo, birdBodyMat);
      body.rotation.x = Math.PI / 2;
      birdGroup.add(body);

      // Head & Golden Beak
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), birdBodyMat);
      head.position.set(0, 0.05, 0.45);
      birdGroup.add(head);

      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 4), beakMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.03, 0.6);
      birdGroup.add(beak);

      // Left Wing (Hinged at origin for rotation)
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(-0.85, -0.2);
      wingShape.lineTo(-0.7, -0.45);
      wingShape.lineTo(0, -0.3);
      wingShape.closePath();
      const wingGeo = new THREE.ShapeGeometry(wingShape);

      const leftWing = new THREE.Mesh(wingGeo, birdWingMat);
      leftWing.position.set(-0.06, 0.04, 0.1);
      leftWing.rotation.x = Math.PI / 2;
      birdGroup.add(leftWing);

      // Right Wing (Mirrored)
      const rightWingShape = new THREE.Shape();
      rightWingShape.moveTo(0, 0);
      rightWingShape.lineTo(0.85, -0.2);
      rightWingShape.lineTo(0.7, -0.45);
      rightWingShape.lineTo(0, -0.3);
      rightWingShape.closePath();
      const rightWingGeo = new THREE.ShapeGeometry(rightWingShape);

      const rightWing = new THREE.Mesh(rightWingGeo, birdWingMat);
      rightWing.position.set(0.06, 0.04, 0.1);
      rightWing.rotation.x = Math.PI / 2;
      birdGroup.add(rightWing);

      this.group.add(birdGroup);

      this.birds.push({
        group: birdGroup,
        leftWing,
        rightWing,
        flightType: cfg.flightType,
        center: cfg.center,
        orbitRadius: cfg.radius,
        altitude: cfg.alt,
        speed: cfg.speed,
        progress: (idx / birdConfigs.length) * Math.PI * 2,
        flapPhase: Math.random() * Math.PI * 2,
        flapFrequency: 6.5 + Math.random() * 3.0,
        isGliding: false,
        glideTimer: 1.5 + Math.random() * 3.0,
      });
    });
  }

  /**
   * Continuous environmental update
   */
  public update(delta: number, time: number): void {
    // 1. Update Clouds (Slow drift with boundary wrap)
    const boundary = 280;
    this.clouds.forEach(cloud => {
      cloud.group.position.x += cloud.speed.x * delta;
      cloud.group.position.z += cloud.speed.z * delta;

      // Wrap around seamlessly
      if (cloud.group.position.x > boundary) cloud.group.position.x = -boundary;
      if (cloud.group.position.x < -boundary) cloud.group.position.x = boundary;
      if (cloud.group.position.z > boundary) cloud.group.position.z = -boundary;
      if (cloud.group.position.z < -boundary) cloud.group.position.z = boundary;
    });

    // 2. Update Birds (Realistic flight dynamics & flapping)
    this.birds.forEach(bird => {
      bird.progress += bird.speed * delta;
      bird.glideTimer -= delta;

      // Alternating flap and glide states
      if (bird.glideTimer <= 0) {
        bird.isGliding = !bird.isGliding;
        bird.glideTimer = bird.isGliding ? 2.5 + Math.random() * 2.5 : 3.0 + Math.random() * 3.0;
      }

      // Calculate trajectory position
      let x = 0;
      let z = 0;
      let targetRotY = 0;

      if (bird.flightType === 'circle') {
        x = bird.center.x + Math.cos(bird.progress) * bird.orbitRadius;
        z = bird.center.z + Math.sin(bird.progress) * bird.orbitRadius;
        targetRotY = -bird.progress + (bird.speed > 0 ? Math.PI / 2 : -Math.PI / 2);
      } else if (bird.flightType === 'figure8') {
        x = bird.center.x + Math.sin(bird.progress) * bird.orbitRadius;
        z = bird.center.z + Math.sin(bird.progress * 2) * (bird.orbitRadius * 0.5);
        const dx = Math.cos(bird.progress) * bird.orbitRadius;
        const dz = Math.cos(bird.progress * 2) * bird.orbitRadius;
        targetRotY = Math.atan2(dx, dz);
      } else {
        // Cross village trajectory
        const span = 240;
        x = bird.center.x + ((bird.progress * 20) % span) - span / 2;
        z = bird.center.z + Math.sin(bird.progress * 0.8) * 24;
        targetRotY = Math.PI / 2 + Math.cos(bird.progress * 0.8) * 0.3;
      }

      // Undulating gentle altitude wave
      const y = bird.altitude + Math.sin(bird.progress * 1.5) * 1.8;

      bird.group.position.set(x, y, z);
      bird.group.rotation.y = targetRotY;

      // Banking into turns
      const bank = Math.sin(bird.progress) * 0.25;
      bird.group.rotation.z = bank;

      // Wing Flapping Animation (Adaptive detail)
      const config = adaptiveGraphics.getConfig();
      if (bird.isGliding) {
        // Wings held flat and steady with tiny air turbulence flutter
        bird.leftWing.rotation.y = Math.sin(time * 3.0) * 0.05;
        bird.rightWing.rotation.y = -Math.sin(time * 3.0) * 0.05;
      } else {
        bird.flapPhase += delta * bird.flapFrequency;
        const wingAngle = Math.sin(bird.flapPhase) * 0.65;
        bird.leftWing.rotation.y = wingAngle;
        bird.rightWing.rotation.y = -wingAngle;
      }
    });

    // 3. Procedural Audio Environment Tick
    if (this.isAudioRunning && !this.isMuted && !this.isPaused) {
      this.updateProceduralAudio(delta);
    }
  }

  /**
   * Initializes procedural ambient audio on first user gesture
   */
  public initAudio(): void {
    if (this.isAudioRunning) return;
    try {
      this.audioCtx = audioManager.getAudioContext();
      if (!this.audioCtx) return;

      const ambientNode = audioManager.getAmbientInputNode();
      if (!ambientNode) return;

      // 1. Procedural Gentle Wind Breeze (Pink/White noise with resonant low-pass sweep)
      const bufferSize = this.audioCtx.sampleRate * 2;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.1;
      }

      this.noiseSource = this.audioCtx.createBufferSource();
      this.noiseSource.buffer = noiseBuffer;
      this.noiseSource.loop = true;

      const windFilter = this.audioCtx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.setValueAtTime(320, this.audioCtx.currentTime);
      windFilter.Q.setValueAtTime(2.5, this.audioCtx.currentTime);

      this.windGainNode = this.audioCtx.createGain();
      const initialGain = this.isMuted ? 0.0 : 0.035;
      this.windGainNode.gain.setValueAtTime(initialGain, this.audioCtx.currentTime);

      this.noiseSource.connect(windFilter);
      windFilter.connect(this.windGainNode);
      this.windGainNode.connect(ambientNode);
      this.noiseSource.start();

      this.isAudioRunning = true;
    } catch {
      // Safe fallback
    }
  }

  /**
   * Procedural distant temple bell chimes and festive dhol procession beats.
   * Note: Unwanted synthetic birdsong beep has been permanently removed so startup begins cleanly.
   */
  private updateProceduralAudio(delta: number): void {
    if (!this.audioCtx || this.isMuted || this.isPaused || audioManager.getIsMuted() || audioManager.getIsPaused()) return;

    this.templeBellTimer -= delta;
    this.dholProcessionTimer -= delta;

    // Distant Temple Bell Chime every 35-50 seconds
    if (this.templeBellTimer <= 0) {
      this.templeBellTimer = 35.0 + Math.random() * 15.0;
      this.playTempleBellChime();
    }

    // Subtle, balanced festive dhol/procession rhythm cycle every 20-30 seconds
    if (this.dholProcessionTimer <= 0) {
      this.dholProcessionTimer = 22.0 + Math.random() * 10.0;
      this.playDholProcessionBeats();
    }
  }

  /**
   * Subtle, balanced festive dhol & manjira rhythm pattern.
   * Kept gentle, warm, and non-fatiguing for comfortable long-term listening.
   */
  private playDholProcessionBeats(): void {
    if (!this.audioCtx || this.isMuted || this.isPaused || audioManager.getIsMuted() || audioManager.getIsPaused()) return;
    const ambientNode = audioManager.getAmbientInputNode();
    if (!ambientNode) return;

    try {
      const now = this.audioCtx.currentTime;
      // Traditional 4-beat rhythm motif (Dha - Dhin - Na - Dha)
      const beats = [
        { time: 0.0, type: 'bass', freq: 110 },
        { time: 0.28, type: 'treble', freq: 420 },
        { time: 0.55, type: 'manjira', freq: 2200 },
        { time: 0.82, type: 'bass', freq: 95 },
      ];

      beats.forEach(beat => {
        if (!this.audioCtx) return;
        const hitTime = now + beat.time;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        if (beat.type === 'bass') {
          // Warm resonant low dhol drum membrane
          osc.type = 'sine';
          osc.frequency.setValueAtTime(beat.freq, hitTime);
          osc.frequency.exponentialRampToValueAtTime(55, hitTime + 0.22);
          gain.gain.setValueAtTime(0.024, hitTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.32);
          osc.connect(gain);
          gain.connect(ambientNode);
          osc.start(hitTime);
          osc.stop(hitTime + 0.33);
        } else if (beat.type === 'treble') {
          // Crisp high-end skin tap
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(beat.freq, hitTime);
          osc.frequency.exponentialRampToValueAtTime(180, hitTime + 0.12);
          gain.gain.setValueAtTime(0.012, hitTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.15);
          osc.connect(gain);
          gain.connect(ambientNode);
          osc.start(hitTime);
          osc.stop(hitTime + 0.16);
        } else {
          // Gentle brass manjira / cymbal shimmer
          osc.type = 'sine';
          osc.frequency.setValueAtTime(beat.freq, hitTime);
          gain.gain.setValueAtTime(0.008, hitTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.45);
          osc.connect(gain);
          gain.connect(ambientNode);
          osc.start(hitTime);
          osc.stop(hitTime + 0.46);
        }
      });
    } catch {
      // Safe catch
    }
  }

  private playTempleBellChime(): void {
    if (!this.audioCtx || this.isMuted || this.isPaused || audioManager.getIsMuted() || audioManager.getIsPaused()) return;
    const ambientNode = audioManager.getAmbientInputNode();
    if (!ambientNode) return;

    try {
      const now = this.audioCtx.currentTime;
      const bellFreqs = [528, 1056, 1584]; // Harmonic sacred brass resonance
      bellFreqs.forEach((freq, idx) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const amp = (0.02 / (idx + 1));
        gain.gain.setValueAtTime(amp, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

        osc.connect(gain);
        gain.connect(ambientNode);
        osc.start(now);
        osc.stop(now + 3.6);
      });
    } catch {
      // Safe catch
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.windGainNode && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.windGainNode.gain.cancelScheduledValues(now);
      this.windGainNode.gain.setValueAtTime(this.windGainNode.gain.value, now);
      const targetGain = (muted || audioManager.getIsMuted()) ? 0.0 : (this.isPaused ? 0.005 : 0.035);
      this.windGainNode.gain.setTargetAtTime(targetGain, now, 0.02);
    }
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    const shouldMute = this.isMuted || audioManager.getIsMuted();
    if (this.windGainNode && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.windGainNode.gain.cancelScheduledValues(now);
      this.windGainNode.gain.setValueAtTime(this.windGainNode.gain.value, now);
      const targetGain = shouldMute ? 0.0 : (paused ? 0.005 : 0.035);
      this.windGainNode.gain.setTargetAtTime(targetGain, now, 0.05);
    }
  }

  public dispose(): void {
    try {
      this.noiseSource?.stop();
      this.noiseSource?.disconnect();
      this.windGainNode?.disconnect();
    } catch {}
    this.isAudioRunning = false;
    this.noiseSource = null;
    this.windGainNode = null;
  }
}
