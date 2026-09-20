/**
 * THE KATHA - High-Fidelity Realistic Character Texture Generator
 * Generates rich, high-resolution procedural textures and PBR bump/normal maps for:
 * - Ramu: Authentic olive green twill plaid flannel, cotton slub tee, ripstop cargo fabric,
 *   cordura backpack canvas with realistic zippers & webbing, and realistic street sneaker textures.
 * - 4 Unique Companions: Denim twill with contrast stitching, quilted utility vest,
 *   bomber jacket weave, ethnic embroidered kurta borders, ribbed cuffs, and custom sneakers.
 * - Realistic Human Anatomy: Natural South Asian melanin gradients, subtle micro-skin pores,
 *   warm vascular flushes (cheeks, nose, ears, fingertips), photorealistic corneal depth irises,
 *   eyebrow hair strokes, and natural lip vermilion texture.
 */

import * as THREE from 'three';

class CharacterTextureManager {
  private static instance: CharacterTextureManager;
  private textureCache: Map<string, THREE.CanvasTexture> = new Map();

  public static getInstance(): CharacterTextureManager {
    if (!CharacterTextureManager.instance) {
      CharacterTextureManager.instance = new CharacterTextureManager();
    }
    return CharacterTextureManager.instance;
  }

  /**
   * High-Resolution Olive Plaid Flannel Texture for Ramu's Overshirt (1024x1024)
   * Authentic twill weave, interlocking dark olive, charcoal, sage bands, and warm cream accent pinstripes.
   */
  public getRamuPlaidTexture(): THREE.CanvasTexture {
    const key = 'ramu_plaid_v2';
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // 1. Base deep forest olive green
    ctx.fillStyle = '#2d3d2d';
    ctx.fillRect(0, 0, 1024, 1024);

    // 2. Primary heavy charcoal-olive check bands (128px repeat)
    ctx.fillStyle = 'rgba(20, 28, 20, 0.72)';
    for (let i = 0; i < 1024; i += 128) {
      ctx.fillRect(i, 0, 64, 1024);
      ctx.fillRect(0, i, 1024, 64);
    }

    // 3. Medium secondary sage-green stripes (offset)
    ctx.fillStyle = 'rgba(68, 92, 68, 0.55)';
    for (let i = 32; i < 1024; i += 128) {
      ctx.fillRect(i, 0, 32, 1024);
      ctx.fillRect(0, i, 1024, 32);
    }

    // 4. Interlocking intersections (darkest points of plaid)
    ctx.fillStyle = 'rgba(12, 18, 12, 0.65)';
    for (let x = 0; x < 1024; x += 128) {
      for (let y = 0; y < 1024; y += 128) {
        ctx.fillRect(x, y, 64, 64);
      }
    }

    // 5. Crisp warm ivory & golden mustard accent pinstripes
    ctx.fillStyle = 'rgba(242, 232, 195, 0.65)';
    for (let i = 0; i < 1024; i += 128) {
      ctx.fillRect(i + 63, 0, 3, 1024);
      ctx.fillRect(0, i + 63, 1024, 3);
    }

    ctx.fillStyle = 'rgba(217, 168, 56, 0.5)';
    for (let i = 0; i < 1024; i += 128) {
      ctx.fillRect(i + 31, 0, 2, 1024);
      ctx.fillRect(0, i + 31, 1024, 2);
    }

    // 6. Authentic 2x2 diagonal twill weave micro-pattern
    const twillCanvas = document.createElement('canvas');
    twillCanvas.width = 8;
    twillCanvas.height = 8;
    const tCtx = twillCanvas.getContext('2d')!;
    tCtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    tCtx.fillRect(0, 0, 8, 8);
    tCtx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    tCtx.fillRect(0, 0, 4, 4);
    tCtx.fillRect(4, 4, 4, 4);
    const twillPattern = ctx.createPattern(twillCanvas, 'repeat');
    if (twillPattern) {
      ctx.fillStyle = twillPattern;
      ctx.fillRect(0, 0, 1024, 1024);
    }

    // 7. Natural fabric fiber noise
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 18;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.5, 2.5);
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Fabric Bump Map for Flannel / Twill Weave
   */
  public getFabricBumpMap(): THREE.CanvasTexture {
    const key = 'fabric_bump';
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    // Diagonal twill ribs
    ctx.strokeStyle = '#a0a0a0';
    ctx.lineWidth = 1.5;
    for (let i = -256; i < 512; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 256, 256);
      ctx.stroke();
    }

    const imgData = ctx.getImageData(0, 0, 256, 256);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 22;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i + 1] = d[i];
      d[i + 2] = d[i];
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Traditional Plain White Pattu Lungi Texture
   * Clean lustrous white silk/pattu fabric with natural cloth drape folds,
   * delicate silk sheen, and subtle authentic gold zari kasavu border hem.
   */
  public getWhitePattuLungiTexture(): THREE.CanvasTexture {
    const key = 'white_pattu_lungi_silk_v1';
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Pure white silk base
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle natural cloth fold drape shading (cylindrical wrap folds)
    const foldGrad = ctx.createLinearGradient(0, 0, 512, 0);
    for (let i = 0; i < 512; i += 64) {
      foldGrad.addColorStop(Math.min(1, i / 512), 'rgba(255, 255, 255, 0.96)');
      foldGrad.addColorStop(Math.min(1, (i + 32) / 512), 'rgba(238, 243, 250, 0.55)');
      foldGrad.addColorStop(Math.min(1, (i + 64) / 512), 'rgba(255, 255, 255, 0.96)');
    }
    ctx.fillStyle = foldGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Fine lustrous silk warp micro-threads
    ctx.fillStyle = 'rgba(210, 222, 238, 0.22)';
    for (let x = 0; x < 512; x += 2.5) {
      ctx.fillRect(x, 0, 1.0, 512);
    }

    // Pattu silk luminous sheen highlight bands
    const sheenGrad = ctx.createLinearGradient(0, 0, 0, 512);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    sheenGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.85)');
    sheenGrad.addColorStop(0.6, 'rgba(240, 246, 255, 0.3)');
    sheenGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.5)');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Traditional delicate golden pattu zari / kasavu border along bottom hem
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, 486, 512, 16);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 490, 512, 5);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 500, 512, 2);

    // Fine silk fiber noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 6;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Traditional Plain White Pancha / Dhoti Texture
   * Clean woven off-white cotton with subtle vertical drape pleats and delicate gold zari border
   */
  public getWhitePanchaTexture(): THREE.CanvasTexture {
    const key = 'white_pancha_cloth_v3';
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Clean white cotton base
    ctx.fillStyle = '#fcfcfd';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle vertical cloth fold shading
    const foldGrad = ctx.createLinearGradient(0, 0, 512, 0);
    for (let i = 0; i < 512; i += 64) {
      foldGrad.addColorStop(Math.min(1, i / 512), 'rgba(255, 255, 255, 0.9)');
      foldGrad.addColorStop(Math.min(1, (i + 32) / 512), 'rgba(235, 240, 245, 0.65)');
      foldGrad.addColorStop(Math.min(1, (i + 64) / 512), 'rgba(255, 255, 255, 0.9)');
    }
    ctx.fillStyle = foldGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Fine vertical cotton weave lines
    ctx.fillStyle = 'rgba(220, 226, 235, 0.28)';
    for (let x = 0; x < 512; x += 3) {
      ctx.fillRect(x, 0, 1.2, 512);
    }

    // Traditional delicate golden zari / kasavu border strip along bottom hem
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, 488, 512, 14);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 492, 512, 4);

    // Micro fabric noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 8;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Solid Plain Shirt Texture
   * Clean, uniform solid-color woven cotton poplin (No checks, no patterns, no logos)
   */
  public getSolidShirtTexture(baseColor: string): THREE.CanvasTexture {
    const key = `solid_shirt_${baseColor}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Uniform solid base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);

    // Very subtle micro-fiber weave for realistic cotton depth
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let x = 0; x < 256; x += 4) {
      for (let y = 0; y < 256; y += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }

    // Micro fabric noise
    const imgData = ctx.getImageData(0, 0, 256, 256);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 10;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Natural Bare Feet Texture
   * Anatomical skin tone with subtle heel pad shading and toe nail bed highlights
   */
  public getBareFootTexture(baseSkinColor: string): THREE.CanvasTexture {
    const key = `bare_foot_${baseSkinColor}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseSkinColor;
    ctx.fillRect(0, 0, 256, 256);

    // Warm plantar/sole flush
    const soleGrad = ctx.createRadialGradient(128, 160, 20, 128, 160, 100);
    soleGrad.addColorStop(0, 'rgba(240, 120, 80, 0.18)');
    soleGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = soleGrad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Cotton Crewneck Slub Tee Texture
   */
  public getWhiteTeeTexture(): THREE.CanvasTexture {
    const key = 'white_tee_texture';
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Clean off-white heather base
    ctx.fillStyle = '#f4f4f5';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle knit ribs
    ctx.fillStyle = 'rgba(215, 215, 220, 0.25)';
    for (let x = 0; x < 512; x += 3) {
      ctx.fillRect(x, 0, 1.2, 512);
    }

    // Micro slub yarn variation
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 12;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Ripstop Cargo Pants Texture with Double-Needle Stitching Lines
   */
  public getCargoPantsTexture(baseColor: string = '#27292d'): THREE.CanvasTexture {
    const key = `cargo_${baseColor}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Ripstop grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 512; i += 16) {
      ctx.fillRect(i, 0, 1.5, 512);
      ctx.fillRect(0, i, 512, 1.5);
    }

    // Vertical seam double-stitching
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(250, 0);
    ctx.lineTo(250, 512);
    ctx.moveTo(254, 0);
    ctx.lineTo(254, 512);
    ctx.stroke();
    ctx.setLineDash([]);

    // Fabric noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 14;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Heavy-Duty Adventure Backpack Canvas Texture
   * Cordura nylon canvas with reinforced webbing straps and metallic zip teeth.
   */
  public getBackpackTexture(): THREE.CanvasTexture {
    const key = 'backpack_canvas';
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Rich dark charcoal cordura
    ctx.fillStyle = '#1c1a18';
    ctx.fillRect(0, 0, 512, 512);

    // Ballistic nylon weave
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let x = 0; x < 512; x += 4) {
      for (let y = 0; y < 512; y += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }

    // Heavy nylon webbing tape band
    ctx.fillStyle = '#12100e';
    ctx.fillRect(0, 180, 512, 40);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let x = 0; x < 512; x += 6) {
      ctx.fillRect(x, 182, 3, 36);
    }

    // Zipper track across top
    ctx.fillStyle = '#0f0e0c';
    ctx.fillRect(0, 80, 512, 16);
    ctx.fillStyle = '#94a3b8'; // Metallic zip teeth
    for (let x = 0; x < 512; x += 6) {
      ctx.fillRect(x, 82, 3, 6);
      ctx.fillRect(x + 3, 88, 3, 6);
    }

    // Leather lash tab patch (diamond 'pig-snout' accessory)
    ctx.fillStyle = '#854d0e';
    ctx.beginPath();
    ctx.moveTo(256, 300);
    ctx.lineTo(306, 350);
    ctx.lineTo(256, 400);
    ctx.lineTo(206, 350);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Two lash slots
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(242, 335, 8, 30);
    ctx.fillRect(262, 335, 8, 30);

    const texture = new THREE.CanvasTexture(canvas);
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Photorealistic South Asian Iris Texture (512x512)
   * Detailed corneal depth, prominent limbal ring, ciliary & pupillary zones,
   * radial fibers, micro-highlights, and moist reflection.
   */
  public getIrisTexture(irisColor: string = '#3a1e0d', highlightColor: string = '#78350f'): THREE.CanvasTexture {
    const key = `realistic_iris_${irisColor}_${highlightColor}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const cx = 256;
    const cy = 256;
    const r = 240;

    // Sclera base (natural warm human white with micro-subsurface)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle scleral blood micro-capillaries at the outer edges
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const startR = r * 0.95;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * startR, cy + Math.sin(angle) * startR);
      ctx.lineTo(cx + Math.cos(angle + 0.1) * (startR + 25), cy + Math.sin(angle + 0.1) * (startR + 25));
      ctx.stroke();
    }

    // Dark Limbal Ring (deep defining outer border)
    const limbalGrad = ctx.createRadialGradient(cx, cy, r * 0.75, cx, cy, r);
    limbalGrad.addColorStop(0, irisColor);
    limbalGrad.addColorStop(0.85, '#120803');
    limbalGrad.addColorStop(1.0, '#050201');
    ctx.fillStyle = limbalGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Ciliary Iris Zone (outer warm radial fibers)
    const irisGrad = ctx.createRadialGradient(cx, cy, r * 0.28, cx, cy, r * 0.88);
    irisGrad.addColorStop(0, highlightColor);
    irisGrad.addColorStop(0.5, irisColor);
    irisGrad.addColorStop(1.0, '#1a0c04');
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
    ctx.fill();

    // 120+ Intricate Radial Fibers & Crypts
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 140; i++) {
      const angle = (i / 140) * Math.PI * 2 + (Math.random() - 0.5) * 0.02;
      const startLen = r * (0.28 + Math.random() * 0.08);
      const endLen = r * (0.75 + Math.random() * 0.16);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * startLen, cy + Math.sin(angle) * startLen);
      ctx.lineTo(cx + Math.cos(angle) * endLen, cy + Math.sin(angle) * endLen);
      ctx.stroke();
    }

    // Secondary dark radial striations
    ctx.strokeStyle = 'rgba(15, 7, 2, 0.35)';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 + (Math.random() - 0.5) * 0.05;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * (r * 0.4), cy + Math.sin(angle) * (r * 0.4));
      ctx.lineTo(cx + Math.cos(angle) * (r * 0.85), cy + Math.sin(angle) * (r * 0.85));
      ctx.stroke();
    }

    // Pupillary Zone Ring (Collarette)
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.34, 0, Math.PI * 2);
    ctx.stroke();

    // Deep Black Centered Pupil
    ctx.fillStyle = '#030201';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Natural Corneal Specular Reflection (Window/sky glint)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(cx + 42, cy - 45, 24, 18, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(cx - 36, cy + 38, 11, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Realistic Human Skin Texture (Subsurface melanin, pores, vascular tones)
   */
  public getSkinTexture(baseColor: string = '#cb8756', warmth: string = '#b45309'): THREE.CanvasTexture {
    const key = `skin_${baseColor}_${warmth}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base skin tone
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Warm subcutaneous layer
    const warmGrad = ctx.createLinearGradient(0, 0, 512, 512);
    warmGrad.addColorStop(0, 'rgba(220, 100, 40, 0.12)');
    warmGrad.addColorStop(0.5, 'rgba(240, 140, 60, 0.06)');
    warmGrad.addColorStop(1.0, 'rgba(180, 70, 20, 0.14)');
    ctx.fillStyle = warmGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Micro skin pore noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 10;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n * 0.8));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n * 0.6));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Denim Twill Weave Texture for Companion Jeans & Jackets
   */
  public getDenimTexture(baseColor: string = '#1e293b'): THREE.CanvasTexture {
    const key = `denim_v2_${baseColor}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Diagonal twill ribs
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let x = 0; x < 512; x += 4) {
      for (let y = 0; y < 512; y += 4) {
        if ((x + y * 2) % 8 === 0) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }

    // Subtle whiskering / distress wear
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.12)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Amber gold contrast topstitching along side
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.stroke();
    ctx.setLineDash([]);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Quilted Utility Vest Pattern (For Varun)
   */
  public getVestQuiltTexture(baseColor: string = '#881337'): THREE.CanvasTexture {
    const key = `quilt_${baseColor}`;
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);

    // Horizontal quilted stitch channels with soft shadow/highlight
    for (let y = 0; y < 256; y += 42) {
      // Highlight on top of puff
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.fillRect(0, y + 4, 256, 8);

      // Deep groove shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, y + 38, 256, 4);

      // Thread stitches
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, y + 40);
      ctx.lineTo(256, y + 40);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Festive Embroidered Kurta Border Texture (For Deepa)
   */
  public getKurtaEmbroideryTexture(): THREE.CanvasTexture {
    const key = 'kurta_embroidery';
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Mustard yellow fabric base
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 0, 512, 256);

    // Golden metallic zari border along bottom
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 180, 512, 76);

    // Traditional geometric paisley / lotus motifs along border
    ctx.fillStyle = '#fef08a';
    for (let x = 16; x < 512; x += 48) {
      ctx.beginPath();
      ctx.arc(x + 12, 218, 10, 0, Math.PI * 2);
      ctx.fill();

      // Diamond petals
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(x + 12, 196);
      ctx.lineTo(x + 22, 218);
      ctx.lineTo(x + 12, 240);
      ctx.lineTo(x + 2, 218);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fef08a';
    }

    // Top gold thread line
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, 176, 512, 4);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.textureCache.set(key, texture);
    return texture;
  }

  /**
   * Modern High-Detail Street Sneaker Texture
   */
  public getSneakerTreadTexture(): THREE.CanvasTexture {
    const key = 'sneaker_tread_v2';
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Clean white rubber sole
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 256);

    // Geometric lug grip treads
    ctx.fillStyle = '#cbd5e1';
    for (let x = 0; x < 512; x += 24) {
      ctx.fillRect(x + 2, 20, 10, 216);
      // Flex grooves
      ctx.fillRect(x + 14, 60, 6, 136);
    }

    // Sporty brand accent color bar
    ctx.fillStyle = '#3f4f3f';
    ctx.fillRect(180, 110, 140, 36);

    const texture = new THREE.CanvasTexture(canvas);
    this.textureCache.set(key, texture);
    return texture;
  }
}

export const characterTextures = CharacterTextureManager.getInstance();

