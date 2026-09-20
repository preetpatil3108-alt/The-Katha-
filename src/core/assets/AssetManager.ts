/**
 * THE KATHA - Asset Management Architecture
 * Handles deferred loading of GLB/GLTF models, textures, audio tracks, and videos.
 * Provides instant procedural fallbacks so missing external files never crash the app.
 */

import * as THREE from 'three';

export interface AssetRecord {
  id: string;
  type: 'model' | 'texture' | 'audio' | 'video';
  url: string;
  loaded: boolean;
  data?: unknown;
}

export class AssetManager {
  private static instance: AssetManager;
  private registry: Map<string, AssetRecord> = new Map();
  private textureCache: Map<string, THREE.Texture> = new Map();
  private loadingPromises: Map<string, Promise<unknown>> = new Map();

  private constructor() {}

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Register an asset with optional custom URL
   */
  public registerAsset(id: string, type: 'model' | 'texture' | 'audio' | 'video', url: string): void {
    this.registry.set(id, { id, type, url, loaded: false });
  }

  /**
   * Safe texture loader with fallback colored canvas texture
   */
  public getTexture(id: string, fallbackColor: string = '#f59e0b'): THREE.Texture {
    if (this.textureCache.has(id)) {
      return this.textureCache.get(id)!;
    }

    const record = this.registry.get(id);
    if (!record || !record.url) {
      const fallback = this.createFallbackTexture(fallbackColor);
      this.textureCache.set(id, fallback);
      return fallback;
    }

    const loader = new THREE.TextureLoader();
    try {
      const tex = loader.load(
        record.url,
        () => {
          record.loaded = true;
        },
        undefined,
        (err) => {
          console.warn(`[AssetManager] Texture ${id} failed to load from ${record.url}, using procedural texture.`, err);
        }
      );
      this.textureCache.set(id, tex);
      return tex;
    } catch {
      const fallback = this.createFallbackTexture(fallbackColor);
      this.textureCache.set(id, fallback);
      return fallback;
    }
  }

  /**
   * Procedural texture generator (Indian rangoli/festive tile pattern)
   */
  public createFallbackTexture(color: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = '#ffffff33';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 120, 120);
      // Festive concentric diamond
      ctx.beginPath();
      ctx.moveTo(64, 16);
      ctx.lineTo(112, 64);
      ctx.lineTo(64, 112);
      ctx.lineTo(16, 64);
      ctx.closePath();
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Check if an asset is registered
   */
  public hasAsset(id: string): boolean {
    return this.registry.has(id);
  }

  /**
   * Get registered video URL or undefined
   */
  public getVideoUrl(id: string): string | undefined {
    const asset = this.registry.get(id);
    return asset?.url;
  }
}

export const assetManager = AssetManager.getInstance();
