/**
 * THE KATHA - Dynamic Time-of-Day & Atmospheric Lighting System
 *
 * Provides physically grounded, cinematic Sunrise and Sunset atmospheres:
 * - Real 3D sun position & elevation calculation affecting shadows across the entire world
 * - Long soft shadows during early sunrise and golden sunset
 * - Atmospheric fog color & density transitions
 * - Ambient and directional sunlight spectrum interpolation
 * - Visible 3D sun orb with atmospheric corona halo
 * - Dynamic amplification of village lanterns, oil deepams, and temple lights at dawn/dusk
 * - Lightweight cycle with manual override support (Sunrise, Day, Sunset)
 */

import * as THREE from 'three';

export type TimeOfDayMode = 'sunrise' | 'day' | 'sunset' | 'night';

export interface TimeOfDayConfig {
  sunColor: string;
  sunIntensity: number;
  sunPosition: THREE.Vector3;
  ambientColor: string;
  ambientIntensity: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  skyColor: string;
  sunOrbColor: string;
  sunOrbScale: number;
  lanternMultiplier: number;
}

export const TIME_CONFIGS: Record<TimeOfDayMode, TimeOfDayConfig> = {
  sunrise: {
    // Sun rising from Eastern horizon, warm golden-amber, long soft shadows westward
    sunColor: '#ff9838',
    sunIntensity: 1.8,
    sunPosition: new THREE.Vector3(150, 36, 50),
    ambientColor: '#fed7aa',
    ambientIntensity: 0.95,
    fogColor: '#fed7aa',
    fogNear: 50,
    fogFar: 290,
    skyColor: '#ffedd5',
    sunOrbColor: '#ffedd5',
    sunOrbScale: 10,
    lanternMultiplier: 1.4,
  },
  day: {
    // High midday festival warmth, crisp light, clear skies
    sunColor: '#fffbeb',
    sunIntensity: 1.55,
    sunPosition: new THREE.Vector3(35, 68, 25),
    ambientColor: '#ffedd5',
    ambientIntensity: 1.05,
    fogColor: '#e0f2fe',
    fogNear: 70,
    fogFar: 380,
    skyColor: '#93c5fd',
    sunOrbColor: '#fef08a',
    sunOrbScale: 9,
    lanternMultiplier: 0.8,
  },
  sunset: {
    // Sun setting near Western horizon, deep saffron/crimson, long soft shadows eastward
    sunColor: '#ea580c',
    sunIntensity: 1.9,
    sunPosition: new THREE.Vector3(-120, 18, 25),
    ambientColor: '#fdba74',
    ambientIntensity: 0.9,
    fogColor: '#fb923c',
    fogNear: 45,
    fogFar: 275,
    skyColor: '#f97316',
    sunOrbColor: '#f97316',
    sunOrbScale: 14,
    lanternMultiplier: 1.6,
  },
  night: {
    // Nocturnal festive night, starry indigo sky, warm festival deepams & lanterns
    sunColor: '#38bdf8',
    sunIntensity: 0.2,
    sunPosition: new THREE.Vector3(-60, 45, 60),
    ambientColor: '#1e1b4b',
    ambientIntensity: 0.45,
    fogColor: '#0f172a',
    fogNear: 35,
    fogFar: 230,
    skyColor: '#020617',
    sunOrbColor: '#e0f2fe',
    sunOrbScale: 7,
    lanternMultiplier: 2.4,
  },
};

export class TimeOfDaySystem {
  private scene: THREE.Scene;
  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private lanterns: THREE.PointLight[] = [];

  // 3D Sun Orb representation
  public sunGroup: THREE.Group;
  private sunMesh: THREE.Mesh;
  private coronaMesh: THREE.Mesh;

  // Current State
  private currentMode: TimeOfDayMode = 'sunrise'; // Start with breathtaking Sunrise!
  private targetMode: TimeOfDayMode = 'sunrise';
  private transitionProgress: number = 1.0; // 0 to 1
  private transitionSpeed: number = 1.2; // seconds to blend

  // Current interpolated values
  private currentSunPos = new THREE.Vector3();
  private currentSunColor = new THREE.Color();
  private currentAmbientColor = new THREE.Color();
  private currentFogColor = new THREE.Color();
  private currentSunIntensity: number = 1.8;
  private currentAmbientIntensity: number = 0.95;
  private currentFogNear: number = 50;
  private currentFogFar: number = 290;

  // Real-time gentle cycle option
  private autoCycle: boolean = false;
  private cycleTime: number = 0;

  constructor(
    scene: THREE.Scene,
    directionalLight: THREE.DirectionalLight,
    ambientLight: THREE.AmbientLight,
    lanterns: THREE.PointLight[] = []
  ) {
    this.scene = scene;
    this.directionalLight = directionalLight;
    this.ambientLight = ambientLight;
    this.lanterns = lanterns;

    // Build 3D Sun Orb with atmospheric corona
    this.sunGroup = new THREE.Group();
    this.sunGroup.name = 'atmospheric_sun_orb';

    const sunGeo = new THREE.SphereGeometry(1, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: '#ffedd5' });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunGroup.add(this.sunMesh);

    // Glowing atmospheric corona disc
    const coronaGeo = new THREE.PlaneGeometry(1, 1);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: '#ffaa44',
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    this.sunGroup.add(this.coronaMesh);

    this.scene.add(this.sunGroup);

    // Initialize to Sunrise
    this.applyModeImmediate('sunrise');
  }

  public registerLanterns(lights: THREE.PointLight[]): void {
    this.lanterns.push(...lights);
  }

  public getMode(): TimeOfDayMode {
    return this.targetMode;
  }

  public setMode(mode: TimeOfDayMode): void {
    if (this.targetMode === mode) return;
    this.targetMode = mode;
    this.transitionProgress = 0;
  }

  public toggleNextMode(): TimeOfDayMode {
    const modes: TimeOfDayMode[] = ['sunrise', 'day', 'sunset', 'night'];
    const currentIdx = modes.indexOf(this.targetMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    this.setMode(nextMode);
    return nextMode;
  }

  /**
   * Calculates the smooth transition factor for festive decorative colored lights.
   * - 0.0 during daytime (after sunrise, lights turn OFF)
   * - 1.0 during sunset & night (after sunset, lights turn ON)
   * - Smooth transition with zero random flashing
   */
  public getDecorativeLightFactor(): number {
    const isNightMode = (m: TimeOfDayMode) => m === 'sunset' || m === 'night';
    const fromFactor = isNightMode(this.currentMode) ? 1.0 : 0.0;
    const toFactor = isNightMode(this.targetMode) ? 1.0 : 0.0;

    if (this.transitionProgress >= 1.0) {
      return toFactor;
    }
    const t = this.easeInOut(this.transitionProgress);
    return THREE.MathUtils.lerp(fromFactor, toFactor, t);
  }

  public applyModeImmediate(mode: TimeOfDayMode): void {
    this.currentMode = mode;
    this.targetMode = mode;
    this.transitionProgress = 1.0;

    const cfg = TIME_CONFIGS[mode];
    this.currentSunPos.copy(cfg.sunPosition);
    this.currentSunColor.set(cfg.sunColor);
    this.currentAmbientColor.set(cfg.ambientColor);
    this.currentFogColor.set(cfg.fogColor);
    this.currentSunIntensity = cfg.sunIntensity;
    this.currentAmbientIntensity = cfg.ambientIntensity;
    this.currentFogNear = cfg.fogNear;
    this.currentFogFar = cfg.fogFar;

    this.applyCurrentLighting();
  }

  public update(delta: number, cameraPosition?: THREE.Vector3): void {
    // Handle Auto-cycle if enabled
    if (this.autoCycle) {
      this.cycleTime += delta * 0.03;
      // Gently progress sunrise -> day -> sunset
      const cycleModes: TimeOfDayMode[] = ['sunrise', 'day', 'sunset'];
      const cycleIdx = Math.floor((this.cycleTime % (Math.PI * 2)) / ((Math.PI * 2) / 3));
      if (this.targetMode !== cycleModes[cycleIdx]) {
        this.setMode(cycleModes[cycleIdx]);
      }
    }

    // Smooth transition interpolation
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + delta * this.transitionSpeed);

      const fromCfg = TIME_CONFIGS[this.currentMode];
      const toCfg = TIME_CONFIGS[this.targetMode];
      const t = this.easeInOut(this.transitionProgress);

      this.currentSunPos.lerpVectors(fromCfg.sunPosition, toCfg.sunPosition, t);
      this.currentSunColor.lerpColors(
        new THREE.Color(fromCfg.sunColor),
        new THREE.Color(toCfg.sunColor),
        t
      );
      this.currentAmbientColor.lerpColors(
        new THREE.Color(fromCfg.ambientColor),
        new THREE.Color(toCfg.ambientColor),
        t
      );
      this.currentFogColor.lerpColors(
        new THREE.Color(fromCfg.fogColor),
        new THREE.Color(toCfg.fogColor),
        t
      );

      this.currentSunIntensity = THREE.MathUtils.lerp(fromCfg.sunIntensity, toCfg.sunIntensity, t);
      this.currentAmbientIntensity = THREE.MathUtils.lerp(fromCfg.ambientIntensity, toCfg.ambientIntensity, t);
      this.currentFogNear = THREE.MathUtils.lerp(fromCfg.fogNear, toCfg.fogNear, t);
      this.currentFogFar = THREE.MathUtils.lerp(fromCfg.fogFar, toCfg.fogFar, t);

      if (this.transitionProgress >= 1.0) {
        this.currentMode = this.targetMode;
      }

      this.applyCurrentLighting();
    }

    // Update 3D Sun position (render relative to horizon for cinematic scale)
    const targetDistance = 260;
    const sunDir = this.currentSunPos.clone().normalize();
    const center = cameraPosition || new THREE.Vector3(0, 0, 0);

    this.sunGroup.position.copy(center).add(sunDir.multiplyScalar(targetDistance));
    this.coronaMesh.lookAt(center);
  }

  private applyCurrentLighting(): void {
    // 1. Directional Sunlight & Shadows
    this.directionalLight.position.copy(this.currentSunPos);
    this.directionalLight.color.copy(this.currentSunColor);
    this.directionalLight.intensity = this.currentSunIntensity;

    // Adjust shadow frustum for long soft shadows
    const isSunriseOrSunset = this.targetMode === 'sunrise' || this.targetMode === 'sunset';
    this.directionalLight.shadow.bias = isSunriseOrSunset ? -0.0003 : -0.0005;

    // 2. Ambient Light
    this.ambientLight.color.copy(this.currentAmbientColor);
    this.ambientLight.intensity = this.currentAmbientIntensity;

    // 3. Scene Fog & Background
    if (!this.scene.fog) {
      this.scene.fog = new THREE.Fog(this.currentFogColor, this.currentFogNear, this.currentFogFar);
    } else if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(this.currentFogColor);
      this.scene.fog.near = this.currentFogNear;
      this.scene.fog.far = this.currentFogFar;
    }

    this.scene.background = this.currentFogColor;

    // 4. Update Sun Mesh Visuals
    const cfg = TIME_CONFIGS[this.targetMode];
    (this.sunMesh.material as THREE.MeshBasicMaterial).color.copy(this.currentSunColor);
    (this.coronaMesh.material as THREE.MeshBasicMaterial).color.copy(this.currentSunColor);
    this.sunMesh.scale.setScalar(cfg.sunOrbScale);
    this.coronaMesh.scale.setScalar(cfg.sunOrbScale * 2.6);

    // 5. Modulate Lantern & Deepam glow intensity
    const multiplier = cfg.lanternMultiplier;
    this.lanterns.forEach(light => {
      light.intensity = 1.6 * multiplier;
    });
  }

  private easeInOut(x: number): number {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }
}
