/**
 * THE KATHA - Indian National Flag System (Tiranga)
 *
 * Simulates physically attached Indian national flags with natural continuous
 * cloth-wave wind physics for all village homes.
 *
 * Specifications:
 * - Authentic Tiranga: Saffron (#FF9933), White (#FFFFFF) with 24-spoke Navy Blue (#000080) Ashoka Chakra, Green (#138808)
 * - Physically attached to a pole with brass finials & wall/roof mounting brackets
 * - Realistic traveling sine wave cloth deformation with pinned pole edge (strictly zero displacement at pole)
 * - Dynamic normal recalculation for realistic cloth specular highlights and shadows
 * - Organic flutter, wind gusting, and individual phase offsets
 */

import * as THREE from 'three';

export interface FlagInstance {
  group: THREE.Group;
  clothMesh: THREE.Mesh;
  geometry: THREE.PlaneGeometry;
  originalPositions: Float32Array;
  phaseOffset: number;
  width: number;
  height: number;
}

export class IndianFlagSystem {
  private static sharedTexture: THREE.CanvasTexture | null = null;
  private static sharedPoleMaterial: THREE.MeshStandardMaterial | null = null;
  private static sharedBrassMaterial: THREE.MeshStandardMaterial | null = null;

  private flags: FlagInstance[] = [];
  public group: THREE.Group = new THREE.Group();

  constructor() {
    this.group.name = 'indian_flags_system';
  }

  /**
   * Generates high-resolution authentic Indian National Flag texture with 24-spoke Ashoka Chakra
   */
  private static getFlagTexture(): THREE.CanvasTexture {
    if (this.sharedTexture) return this.sharedTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const h = canvas.height;
      const w = canvas.width;
      const stripeH = h / 3;

      // 1. Top Stripe - Kesari / Deep Saffron
      ctx.fillStyle = '#FF9933';
      ctx.fillRect(0, 0, w, stripeH);

      // 2. Middle Stripe - White
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, stripeH, w, stripeH);

      // 3. Bottom Stripe - India Green
      ctx.fillStyle = '#138808';
      ctx.fillRect(0, stripeH * 2, w, stripeH);

      // 4. Center - Ashoka Chakra in Navy Blue (#000080)
      const cx = w / 2;
      const cy = h / 2;
      const radius = stripeH * 0.42;

      ctx.strokeStyle = '#000080';
      ctx.fillStyle = '#000080';
      ctx.lineWidth = 4;

      // Outer rim
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner center hub
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.16, 0, Math.PI * 2);
      ctx.fill();

      // 24 Spokes with crisp, uniform radial distribution
      ctx.lineWidth = 2.4;
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const xOuter = cx + Math.cos(angle) * radius;
        const yOuter = cy + Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(xOuter, yOuter);
        ctx.stroke();

        // Small circular teeth / dots on outer rim
        const xDot = cx + Math.cos(angle + Math.PI / 24) * (radius - 1.5);
        const yDot = cy + Math.sin(angle + Math.PI / 24) * (radius - 1.5);
        ctx.beginPath();
        ctx.arc(xDot, yDot, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    this.sharedTexture = texture;
    return texture;
  }

  private static getPoleMaterial(): THREE.MeshStandardMaterial {
    if (!this.sharedPoleMaterial) {
      this.sharedPoleMaterial = new THREE.MeshStandardMaterial({
        color: '#ca8a04', // Cured golden bamboo or polished brass-capped wood
        roughness: 0.5,
        metalness: 0.15,
      });
    }
    return this.sharedPoleMaterial;
  }

  private static getBrassMaterial(): THREE.MeshStandardMaterial {
    if (!this.sharedBrassMaterial) {
      this.sharedBrassMaterial = new THREE.MeshStandardMaterial({
        color: '#eab308',
        roughness: 0.3,
        metalness: 0.8,
      });
    }
    return this.sharedBrassMaterial;
  }

  /**
   * Creates a complete flag assembly (Pole + Mounting Bracket + Animated Cloth Flag)
   * and attaches it securely at the given position and rotation.
   */
  public createFlagAt(params: {
    position: THREE.Vector3;
    rotationY?: number;
    tiltZ?: number; // Optional slight outward tilt angle for wall-mounted poles
    scale?: number;
    mountType?: 'wall' | 'roof' | 'post';
  }): THREE.Group {
    const scale = params.scale || 1.0;
    const flagW = 1.6 * scale;
    const flagH = 1.0 * scale;
    const poleH = 2.6 * scale;

    const assembly = new THREE.Group();
    assembly.position.copy(params.position);
    if (params.rotationY !== undefined) assembly.rotation.y = params.rotationY;
    if (params.tiltZ !== undefined) assembly.rotation.z = params.tiltZ;

    // 1. Pole Bracket / Mounting Base
    const baseGeo = new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.25 * scale, 8);
    const baseMesh = new THREE.Mesh(baseGeo, IndianFlagSystem.getBrassMaterial());
    baseMesh.position.y = 0.12 * scale;
    assembly.add(baseMesh);

    // 2. Main Flagpole
    const poleGeo = new THREE.CylinderGeometry(0.035 * scale, 0.04 * scale, poleH, 12);
    const poleMesh = new THREE.Mesh(poleGeo, IndianFlagSystem.getPoleMaterial());
    poleMesh.position.y = poleH / 2;
    poleMesh.castShadow = true;
    assembly.add(poleMesh);

    // 3. Golden Kalash / Ball Finial on top of pole
    const finialGeo = new THREE.SphereGeometry(0.08 * scale, 10, 10);
    const finialMesh = new THREE.Mesh(finialGeo, IndianFlagSystem.getBrassMaterial());
    finialMesh.position.y = poleH + 0.06 * scale;
    finialMesh.castShadow = true;
    assembly.add(finialMesh);

    // 4. Mounting rings / grommets on pole
    const topGrommetY = poleH - 0.25 * scale;
    const bottomGrommetY = topGrommetY - flagH;

    [topGrommetY, bottomGrommetY].forEach(gy => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.045 * scale, 0.012 * scale, 6, 12),
        IndianFlagSystem.getBrassMaterial()
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = gy;
      assembly.add(ring);
    });

    // 5. Subdivided Cloth Flag Mesh
    // 24 segments horizontally, 14 segments vertically for smooth wave ripples
    const segX = 24;
    const segY = 14;
    const planeGeo = new THREE.PlaneGeometry(flagW, flagH, segX, segY);

    // Translate so left edge (x=0) aligns EXACTLY with pole axis!
    // This physically guarantees the flag edge never detaches from the pole.
    planeGeo.translate(flagW / 2, 0, 0);

    const flagMat = new THREE.MeshStandardMaterial({
      map: IndianFlagSystem.getFlagTexture(),
      side: THREE.DoubleSide,
      roughness: 0.65,
      metalness: 0.08,
      shadowSide: THREE.DoubleSide,
    });

    const clothMesh = new THREE.Mesh(planeGeo, flagMat);
    clothMesh.castShadow = true;
    clothMesh.receiveShadow = true;
    // Position vertically so top aligns with top grommet
    clothMesh.position.set(0, topGrommetY - flagH / 2, 0);
    assembly.add(clothMesh);

    // Store original vertex coordinates for continuous wave simulation
    const posAttr = planeGeo.attributes.position;
    const originalPositions = new Float32Array(posAttr.count * 3);
    for (let i = 0; i < posAttr.count * 3; i++) {
      originalPositions[i] = posAttr.array[i];
    }

    const flagInst: FlagInstance = {
      group: assembly,
      clothMesh,
      geometry: planeGeo,
      originalPositions,
      phaseOffset: (params.position.x * 0.3 + params.position.z * 0.5) % (Math.PI * 2),
      width: flagW,
      height: flagH,
    };

    this.flags.push(flagInst);
    this.group.add(assembly);

    return assembly;
  }

  /**
   * Continuous wind wave simulation.
   * Creates organic, multi-layered ripples that travel smoothly across the cloth.
   * Left boundary (x = 0 at pole) has ZERO displacement, ensuring attachment.
   */
  public update(delta: number, time: number): void {
    // Wind properties with subtle natural gusting
    const gustSpeed = 3.6 + Math.sin(time * 0.8) * 0.7 + Math.cos(time * 1.9) * 0.4;

    for (let f = 0; f < this.flags.length; f++) {
      const flag = this.flags[f];
      const posAttr = flag.geometry.attributes.position;
      const count = posAttr.count;
      const orig = flag.originalPositions;
      const t = time * gustSpeed + flag.phaseOffset;
      const w = flag.width;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const origX = orig[idx];
        const origY = orig[idx + 1];
        const origZ = orig[idx + 2];

        // Normalized distance from pole along flag width (0 at pole, 1.0 at free end)
        const u = Math.max(0, Math.min(1.0, origX / w));

        // Pinning weight: strictly 0 at pole, increasing non-linearly to the tip
        // Math.pow(u, 1.35) gives natural soft cloth draping near mast and active flutter at edge
        const pinWeight = Math.pow(u, 1.35);

        // Layer 1: Long traveling primary wave
        const wave1 = Math.sin(u * 7.5 - t * 2.1 + origY * 1.6) * 0.14 * pinWeight;

        // Layer 2: High-frequency traveling ripple
        const wave2 = Math.sin(u * 15.0 - t * 3.4 + origY * 3.2) * 0.05 * pinWeight;

        // Layer 3: Secondary transverse harmonic
        const wave3 = Math.cos(u * 4.2 - t * 1.3) * 0.06 * pinWeight;

        // Layer 4: Rapid edge flutter on free edge (u > 0.75)
        let edgeFlutter = 0;
        if (u > 0.75) {
          const edgeU = (u - 0.75) / 0.25;
          edgeFlutter = Math.sin(t * 7.0 + origY * 6.0) * 0.045 * edgeU;
        }

        // Lift: Wind causes light dynamic elevation towards the tip
        const lift = (1.0 - Math.cos(u * 1.1)) * 0.08 * pinWeight;

        // Apply displacements
        posAttr.setZ(i, origZ + wave1 + wave2 + wave3 + edgeFlutter);
        posAttr.setY(i, origY + lift);
      }

      posAttr.needsUpdate = true;
      flag.geometry.computeVertexNormals();
    }
  }

  /**
   * Applies subtle, authentic golden highlight to Indian flags on village houses
   * during the Level 1 establishing cinematic.
   * Keeps the flag authentic while making it noticeable against sky and roofs.
   */
  public setHighlight(intensity: number): void {
    const clamped = Math.max(0, Math.min(1, intensity));
    for (let f = 0; f < this.flags.length; f++) {
      const flag = this.flags[f];
      const mat = flag.clothMesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        if (clamped > 0.01) {
          mat.emissive.setRGB(0.45 * clamped, 0.32 * clamped, 0.12 * clamped);
          mat.emissiveIntensity = clamped * 0.85;
        } else {
          mat.emissive.setRGB(0, 0, 0);
          mat.emissiveIntensity = 0;
        }
      }
    }
  }

  public getCount(): number {
    return this.flags.length;
  }
}
