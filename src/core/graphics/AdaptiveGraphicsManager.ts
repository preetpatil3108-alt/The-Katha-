/**
 * THE KATHA - Adaptive Graphics & Performance Architecture
 *
 * Senior Game Engine Optimization System:
 * - Automatic hardware capability tier detection:
 *   - GPU unmasked renderer via WebGL debug info (GeForce/Radeon/Apple M-series vs Intel UHD/Mali/Adreno)
 *   - CPU logical core count (navigator.hardwareConcurrency)
 *   - Device physical memory (navigator.deviceMemory)
 *   - Form-factor & display resolution (mobile / tablet / desktop DPR)
 * - Three internal adaptive rendering profiles:
 *   1. QUALITY: Capable desktop/laptop & high-end devices -> Crisp resolution, PCFSoft 2K shadows, maximum draw & effect details
 *   2. BALANCED: Average laptops, mid-range tablets & phones -> Balanced visual quality with smooth, stable 60 FPS
 *   3. PERFORMANCE: Entry-level mobile, tablets, & budget hardware -> High framerate priority, efficient basic shadows, distance culling
 * - Runtime Dynamic Performance Monitor:
 *   - Sliding-window frame time & FPS tracking
 *   - Automatic graceful degradation if sustained FPS dips below target threshold
 *   - Dynamic resolution scaling without pipeline reconstruction
 * - Strict Invariant Protection:
 *   - NEVER removes or breaks core gameplay assets (Ramu, Mushika, Ayyagaru, Mandapam, Roads, Buildings, Missions)
 */

import * as THREE from 'three';

export type GraphicsProfileTier = 'QUALITY' | 'BALANCED' | 'PERFORMANCE';

export interface GraphicsProfileConfig {
  tier: GraphicsProfileTier;
  label: string;
  pixelRatioMax: number;
  shadowMapSize: number;
  shadowType: THREE.ShadowMapType;
  shadowDistance: number;
  shadowCameraBound: number;
  enableSoftShadows: boolean;
  maxActivePointLights: number;
  decorCullDistanceSq: number; // For non-essential roadside scatter, tiny rocks, minor grass tufts
  npcUpdateRateDistant: number; // Update interval for distant NPCs (1 = every frame, 2 = every 2nd frame, etc.)
  npcDistantThresholdSq: number; // Distance beyond which NPC update throttling triggers
  trafficLODDistanceSq: number; // Distance beyond which traffic skips wheel rotation and detailed raycasts
  atmosphereDetail: 'high' | 'medium' | 'low';
  foliageDetailRatio: number; // 1.0, 0.75, 0.5 (controls density of non-critical decorative scatter)
  antialias: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  frameTimeMs: number;
  activeTier: GraphicsProfileTier;
  isAuto: boolean;
  activeDpr: number;
  gpuRenderer: string;
}

export class AdaptiveGraphicsManager {
  private static instance: AdaptiveGraphicsManager;

  // Profile presets
  private static readonly PROFILES: Record<GraphicsProfileTier, GraphicsProfileConfig> = {
    QUALITY: {
      tier: 'QUALITY',
      label: 'Quality (High-End)',
      pixelRatioMax: 2.0,
      shadowMapSize: 2048,
      shadowType: THREE.PCFSoftShadowMap,
      shadowDistance: 350,
      shadowCameraBound: 120,
      enableSoftShadows: true,
      maxActivePointLights: 24,
      decorCullDistanceSq: 16000, // ~126m
      npcUpdateRateDistant: 1, // Full rate
      npcDistantThresholdSq: 3600, // 60m
      trafficLODDistanceSq: 12000, // ~110m
      atmosphereDetail: 'high',
      foliageDetailRatio: 1.0,
      antialias: true,
    },
    BALANCED: {
      tier: 'BALANCED',
      label: 'Balanced (Standard)',
      pixelRatioMax: 1.4,
      shadowMapSize: 1024,
      shadowType: THREE.PCFShadowMap,
      shadowDistance: 220,
      shadowCameraBound: 85,
      enableSoftShadows: true,
      maxActivePointLights: 12,
      decorCullDistanceSq: 9000, // ~95m
      npcUpdateRateDistant: 2, // Every 2nd frame
      npcDistantThresholdSq: 2000, // ~45m
      trafficLODDistanceSq: 6400, // 80m
      atmosphereDetail: 'medium',
      foliageDetailRatio: 0.75,
      antialias: true,
    },
    PERFORMANCE: {
      tier: 'PERFORMANCE',
      label: 'Performance (Fast)',
      pixelRatioMax: 1.05,
      shadowMapSize: 512,
      shadowType: THREE.BasicShadowMap,
      shadowDistance: 130,
      shadowCameraBound: 55,
      enableSoftShadows: false,
      maxActivePointLights: 6,
      decorCullDistanceSq: 4900, // ~70m
      npcUpdateRateDistant: 3, // Every 3rd frame
      npcDistantThresholdSq: 1200, // ~35m
      trafficLODDistanceSq: 3600, // 60m
      atmosphereDetail: 'low',
      foliageDetailRatio: 0.5,
      antialias: false,
    },
  };

  private currentTier: GraphicsProfileTier = 'BALANCED';
  private isAutoMode: boolean = true;
  private detectedTier: GraphicsProfileTier = 'BALANCED';
  private gpuInfoString: string = 'Standard WebGL';

  // Listeners for dynamic updates
  private listeners: Set<(config: GraphicsProfileConfig) => void> = new Set();

  // Runtime Performance Monitor
  private frameTimes: number[] = [];
  private readonly windowSize: number = 60;
  private currentFps: number = 60;
  private currentAvgFrameTimeMs: number = 16.6;
  private lowFpsDurationSeconds: number = 0;
  private highFpsDurationSeconds: number = 0;
  private lastAutoAdjustTime: number = 0;
  private activeResolutionScale: number = 1.0;

  private constructor() {
    this.detectHardwareCapability();
    this.applyProfile(this.detectedTier, false);
  }

  public static getInstance(): AdaptiveGraphicsManager {
    if (!AdaptiveGraphicsManager.instance) {
      AdaptiveGraphicsManager.instance = new AdaptiveGraphicsManager();
    }
    return AdaptiveGraphicsManager.instance;
  }

  /**
   * Hardware Capability Detection using WebGL unmasked renderer, CPU concurrency & RAM
   */
  private detectHardwareCapability(): void {
    if (typeof window === 'undefined') return;

    let score = 50; // Neutral baseline (Balanced)

    // 1. Check User Agent & Form Factor
    const isMobile = /Android|iPhone|iPod|iPad/i.test(navigator.userAgent);
    const isTablet = /(iPad|Tablet|PlayBook)|(Android(?!.*Mobile))/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isMobile && !isTablet) {
      score -= 20;
    } else if (isTablet) {
      score -= 5;
    } else {
      score += 15; // Desktop baseline advantage
    }

    // 2. Hardware Concurrency (Logical CPU Cores)
    const cores = navigator.hardwareConcurrency || 4;
    if (cores >= 12) score += 25;
    else if (cores >= 8) score += 15;
    else if (cores <= 2) score -= 25;
    else if (cores <= 4) score -= 10;

    // 3. Device Memory (if supported by browser)
    const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
    if (typeof memory === 'number') {
      if (memory >= 8) score += 20;
      else if (memory >= 4) score += 5;
      else if (memory <= 2) score -= 25;
    }

    // 4. WebGL GPU Unmasked Renderer Detection
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const rendererStr = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
          this.gpuInfoString = rendererStr;
          const lowerRenderer = rendererStr.toLowerCase();

          // High-End Dedicated GPUs & Modern Mobile Flagships
          if (
            lowerRenderer.includes('rtx') ||
            lowerRenderer.includes('gtx') ||
            lowerRenderer.includes('radeon rx') ||
            lowerRenderer.includes('apple m1') ||
            lowerRenderer.includes('apple m2') ||
            lowerRenderer.includes('apple m3') ||
            lowerRenderer.includes('apple m4') ||
            lowerRenderer.includes('adreno 7') ||
            lowerRenderer.includes('adreno 8') ||
            lowerRenderer.includes('mali-g71') ||
            lowerRenderer.includes('mali-g72') ||
            lowerRenderer.includes('mali-g77') ||
            lowerRenderer.includes('mali-g78') ||
            lowerRenderer.includes('immortalis')
          ) {
            score += 35;
          }
          // Integrated or Entry Level GPUs
          else if (
            lowerRenderer.includes('intel hd') ||
            lowerRenderer.includes('intel uhd') ||
            lowerRenderer.includes('intel iris') ||
            lowerRenderer.includes('adreno 5') ||
            lowerRenderer.includes('adreno 61') ||
            lowerRenderer.includes('adreno 62') ||
            lowerRenderer.includes('mali-400') ||
            lowerRenderer.includes('mali-t') ||
            lowerRenderer.includes('mali-g52') ||
            lowerRenderer.includes('powervr') ||
            lowerRenderer.includes('swiftshader') ||
            lowerRenderer.includes('mesa')
          ) {
            score -= 25;
          }
        }
      }
    } catch {
      // Graceful fallback to heuristic score
    }

    // Determine initial tier based on composite score
    if (score >= 65) {
      this.detectedTier = 'QUALITY';
    } else if (score <= 35) {
      this.detectedTier = 'PERFORMANCE';
    } else {
      this.detectedTier = 'BALANCED';
    }

    this.currentTier = this.detectedTier;
  }

  /**
   * Returns current active configuration
   */
  public getConfig(): GraphicsProfileConfig {
    return AdaptiveGraphicsManager.PROFILES[this.currentTier];
  }

  public getTier(): GraphicsProfileTier {
    return this.currentTier;
  }

  public getIsAuto(): boolean {
    return this.isAutoMode;
  }

  public isManualOverride(): boolean {
    return !this.isAutoMode;
  }

  public setAuto(): void {
    this.setAutoMode(true);
  }

  public setProfile(tier: GraphicsProfileTier): void {
    this.setTier(tier, true);
  }

  public setAutoMode(auto: boolean): void {
    this.isAutoMode = auto;
    if (auto) {
      this.applyProfile(this.detectedTier, true);
    }
  }

  /**
   * Manual override of graphics profile
   */
  public setTier(tier: GraphicsProfileTier, userExplicit: boolean = false): void {
    if (userExplicit) {
      this.isAutoMode = false;
    }
    this.applyProfile(tier, true);
  }

  /**
   * Cycle to next tier for quick in-game testing
   */
  public cycleTier(): GraphicsProfileTier {
    const sequence: GraphicsProfileTier[] = ['QUALITY', 'BALANCED', 'PERFORMANCE'];
    const nextIdx = (sequence.indexOf(this.currentTier) + 1) % sequence.length;
    const nextTier = sequence[nextIdx];
    this.setTier(nextTier, true);
    return nextTier;
  }

  private applyProfile(tier: GraphicsProfileTier, notify: boolean = true): void {
    this.currentTier = tier;
    if (notify) {
      const config = this.getConfig();
      this.listeners.forEach((fn) => fn(config));
    }
  }

  public subscribe(listener: (config: GraphicsProfileConfig) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Frame-by-frame telemetry for runtime auto-tuning
   * Called once per frame in GameEngine3D render loop
   */
  public recordFrame(deltaSeconds: number): void {
    const frameTimeMs = deltaSeconds * 1000;
    this.frameTimes.push(frameTimeMs);
    if (this.frameTimes.length > this.windowSize) {
      this.frameTimes.shift();
    }

    // Compute rolling average
    let sum = 0;
    for (let i = 0; i < this.frameTimes.length; i++) {
      sum += this.frameTimes[i];
    }
    this.currentAvgFrameTimeMs = sum / this.frameTimes.length;
    this.currentFps = Math.round(1000 / Math.max(1, this.currentAvgFrameTimeMs));

    // Dynamic Runtime Adaptation
    if (!this.isAutoMode) return;

    const now = performance.now();
    // Allow at least 4 seconds between automated profile transitions to avoid thrashing
    if (now - this.lastAutoAdjustTime < 4000) return;

    // Check for sustained frame drop (e.g. FPS < 32 sustained for > 3.0s)
    if (this.currentFps < 32 && this.frameTimes.length >= 45) {
      this.lowFpsDurationSeconds += deltaSeconds;
      this.highFpsDurationSeconds = 0;

      if (this.lowFpsDurationSeconds > 3.0) {
        if (this.currentTier === 'QUALITY') {
          this.applyProfile('BALANCED', true);
          this.lastAutoAdjustTime = now;
          this.lowFpsDurationSeconds = 0;
        } else if (this.currentTier === 'BALANCED') {
          this.applyProfile('PERFORMANCE', true);
          this.lastAutoAdjustTime = now;
          this.lowFpsDurationSeconds = 0;
        }
      }
    }
    // Check for sustained high performance (FPS > 58 sustained for > 12.0s)
    else if (this.currentFps >= 58 && this.frameTimes.length >= 45) {
      this.highFpsDurationSeconds += deltaSeconds;
      this.lowFpsDurationSeconds = 0;

      if (this.highFpsDurationSeconds > 12.0) {
        // Only promote if device hardware tier supports it
        if (this.currentTier === 'PERFORMANCE' && (this.detectedTier === 'BALANCED' || this.detectedTier === 'QUALITY')) {
          this.applyProfile('BALANCED', true);
          this.lastAutoAdjustTime = now;
          this.highFpsDurationSeconds = 0;
        } else if (this.currentTier === 'BALANCED' && this.detectedTier === 'QUALITY') {
          this.applyProfile('QUALITY', true);
          this.lastAutoAdjustTime = now;
          this.highFpsDurationSeconds = 0;
        }
      }
    } else {
      this.lowFpsDurationSeconds = Math.max(0, this.lowFpsDurationSeconds - deltaSeconds * 0.5);
      this.highFpsDurationSeconds = Math.max(0, this.highFpsDurationSeconds - deltaSeconds * 0.5);
    }
  }

  public getMetrics(): PerformanceMetrics {
    const config = this.getConfig();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const activeDpr = Math.min(dpr, config.pixelRatioMax) * this.activeResolutionScale;

    return {
      fps: this.currentFps,
      frameTimeMs: Math.round(this.currentAvgFrameTimeMs * 10) / 10,
      activeTier: this.currentTier,
      isAuto: this.isAutoMode,
      activeDpr: Math.round(activeDpr * 100) / 100,
      gpuRenderer: this.gpuInfoString,
    };
  }

  /**
   * Utility helper to clamp pixel ratio based on active tier
   */
  public getClampedPixelRatio(): number {
    if (typeof window === 'undefined') return 1;
    const rawDpr = window.devicePixelRatio || 1;
    return Math.min(rawDpr, this.getConfig().pixelRatioMax);
  }
}

export const adaptiveGraphics = AdaptiveGraphicsManager.getInstance();
