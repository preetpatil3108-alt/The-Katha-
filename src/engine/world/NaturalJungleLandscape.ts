/**
 * THE KATHA - Natural Jungle Landscape & Horizon Mountain System
 *
 * Professional 3D open-world environment module:
 * 1. Substantial, genuinely walkable natural jungle directly connected to Rangastalam
 * 2. Natural terrain variation: undulations, loamy forest soil, moss beds, and earthen hummocks
 * 3. Diverse tree species and sizes (Ancient Banyans, Tall Sal, Jamun, Teak, and Bamboo groves)
 * 4. Layered undergrowth: flowering Lantana bushes, wild ferns, Durva grass, and mossy flora
 * 5. Weathered granite rocks and stepped natural boulder outcroppings
 * 6. Multi-tiered trail network: wide main forest trail + narrow winding paths + open natural clearings
 * 7. Multi-distance 3D mountain horizon ranges creating genuine grandeur and atmospheric depth
 */

import * as THREE from 'three';
import { CollisionSystem } from '../collisions/CollisionSystem';

export class NaturalJungleLandscape {
  public group: THREE.Group;
  private collisionSystem: CollisionSystem;

  // Shared Material Palette
  private matForestSoil: THREE.MeshLambertMaterial;
  private matForestGrass: THREE.MeshLambertMaterial;
  private matMossPatch: THREE.MeshLambertMaterial;
  private matSalTrunk: THREE.MeshLambertMaterial;
  private matBanyanTrunk: THREE.MeshLambertMaterial;
  private matBambooCulm: THREE.MeshLambertMaterial;
  private matDeepLeaf: THREE.MeshLambertMaterial;
  private matLushLeaf: THREE.MeshLambertMaterial;
  private matGoldenLeaf: THREE.MeshLambertMaterial;
  private matBushLantana: THREE.MeshLambertMaterial;
  private matFernLeaf: THREE.MeshLambertMaterial;
  private matGraniteRock: THREE.MeshLambertMaterial;
  private matMossyRock: THREE.MeshLambertMaterial;
  private matTrailDirt: THREE.MeshLambertMaterial;
  private matMountainNear: THREE.MeshLambertMaterial;
  private matMountainMid: THREE.MeshLambertMaterial;
  private matMountainDistant: THREE.MeshLambertMaterial;
  private matHilltopGopuram: THREE.MeshLambertMaterial;
  private matTempleGold: THREE.MeshBasicMaterial;

  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem;
    this.group = new THREE.Group();
    this.group.name = 'natural_jungle_landscape';

    // Materials
    this.matForestSoil = new THREE.MeshLambertMaterial({ color: '#271c11' }); // Loamy jungle earth
    this.matForestGrass = new THREE.MeshLambertMaterial({ color: '#166534' }); // Deep forest floor grass
    this.matMossPatch = new THREE.MeshLambertMaterial({ color: '#14532d' }); // Rich velvety moss
    this.matSalTrunk = new THREE.MeshLambertMaterial({ color: '#3d2514' }); // Dark weathered bark
    this.matBanyanTrunk = new THREE.MeshLambertMaterial({ color: '#4a3728' }); // Gnarled banyan wood
    this.matBambooCulm = new THREE.MeshLambertMaterial({ color: '#65a30d' }); // Fresh bamboo stalk
    this.matDeepLeaf = new THREE.MeshLambertMaterial({ color: '#14532d' }); // Canopy upper shade
    this.matLushLeaf = new THREE.MeshLambertMaterial({ color: '#15803d' }); // Mid canopy
    this.matGoldenLeaf = new THREE.MeshLambertMaterial({ color: '#ca8a04' }); // Sunlit foliage
    this.matBushLantana = new THREE.MeshLambertMaterial({ color: '#15803d' }); // Dense shrubbery
    this.matFernLeaf = new THREE.MeshLambertMaterial({ color: '#22c55e', side: THREE.DoubleSide });
    this.matGraniteRock = new THREE.MeshLambertMaterial({ color: '#57534e' }); // Deccan granite
    this.matMossyRock = new THREE.MeshLambertMaterial({ color: '#3f4f3e' }); // Weathered mossy stone
    this.matTrailDirt = new THREE.MeshLambertMaterial({ color: '#92400e' }); // Packed red clay-earthen trail
    this.matMountainNear = new THREE.MeshLambertMaterial({ color: '#2d4a27' }); // Near lush foothills
    this.matMountainMid = new THREE.MeshLambertMaterial({ color: '#334155' }); // Mid granite ridges
    this.matMountainDistant = new THREE.MeshLambertMaterial({ color: '#475569' }); // Hazy distant horizon
    this.matHilltopGopuram = new THREE.MeshLambertMaterial({ color: '#c2410c' }); // Terracotta shrine
    this.matTempleGold = new THREE.MeshBasicMaterial({ color: '#fbbf24' }); // Kalasam gold
  }

  public build(): void {
    // 1. Walkable Forest Terrain & Undulating Floor
    this.buildJungleTerrain();

    // 2. Walkable Natural Trail & Clearings Network
    this.buildForestPathsAndClearings();

    // 3. Dense & Varied Forest Trees (Banyans, Sal, Teak, Jamun, Bamboo)
    this.buildForestTrees();

    // 4. Natural Undergrowth: Bushes, Ferns, Grass Tufts & Wild Flora
    this.buildUndergrowthAndFlora();

    // 5. Granite Boulders, River Rocks & Rock Formations
    this.buildForestRocks();

    // 6. Ancient Forest Landmark (Deep Forest Ganesha Shrine)
    this.buildDeepForestShrine();

    // 7. Majestic 3D Mountain Horizon Ranges
    this.buildMountainRanges();
  }

  /**
   * 1. Walkable undulating forest terrain seamlessly connecting to Rangastalam.
   * Extends from Z = -28 to Z = -220, X = -80 to X = 130.
   */
  private buildJungleTerrain(): void {
    const terrainGroup = new THREE.Group();
    terrainGroup.name = 'jungle_terrain';

    // Forest ground base plate (210m wide x 210m deep)
    const baseGeo = new THREE.PlaneGeometry(210, 200, 36, 36);
    baseGeo.rotateX(-Math.PI / 2);

    // Natural terrain height variations: gentle hummocks, undulating earthen ridges
    const pos = baseGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);

      // World coordinates (centered at X = 25, Z = -115)
      const wx = vx + 25;
      const wz = vz - 115;

      // Gentle natural undulation (0.1m - 0.7m), perfectly flat along main path corridors
      let elevation = 0;

      // Don't elevate near village connection line (Z > -70)
      if (wz < -70) {
        const distFromPath = Math.min(
          Math.hypot(wx - 24, wz - (-68)),
          Math.hypot(wx - 25, wz - (-82)),
          Math.hypot(wx - 26, wz - (-98)),
          Math.hypot(wx - 20, wz - (-110)),
          Math.hypot(wx - 42, wz - (-142)),
          Math.hypot(wx - 18, wz - (-168))
        );

        // Undulate only outside of main walking paths
        if (distFromPath > 6) {
          elevation = Math.sin(wx * 0.08) * Math.cos(wz * 0.06) * 0.45 +
                      Math.sin(wx * 0.15 + wz * 0.12) * 0.25;
        }
      }

      pos.setY(i, Math.max(-0.15, elevation));
    }

    baseGeo.computeVertexNormals();

    const groundMesh = new THREE.Mesh(baseGeo, this.matForestSoil);
    groundMesh.position.set(25, -0.04, -115);
    groundMesh.receiveShadow = true;
    terrainGroup.add(groundMesh);

    // Large mossy forest loam layer patches
    const mossPatches = [
      { x: 30, z: -85, r: 24 },
      { x: -15, z: -105, r: 28 },
      { x: 55, z: -120, r: 32 },
      { x: -5, z: -145, r: 30 },
      { x: 45, z: -165, r: 26 },
      { x: -45, z: -135, r: 25 },
    ];

    mossPatches.forEach(mp => {
      const patch = new THREE.Mesh(
        new THREE.CircleGeometry(mp.r, 24),
        this.matMossPatch
      );
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(mp.x, -0.025, mp.z);
      patch.receiveShadow = true;
      terrainGroup.add(patch);
    });

    this.group.add(terrainGroup);
  }

  /**
   * 2. Natural Walkable Path Network and Clearings
   * Provides wide, clear, beautiful trails Ramu can walk along without obstruction.
   */
  private buildForestPathsAndClearings(): void {
    const pathGroup = new THREE.Group();
    pathGroup.name = 'forest_paths_and_clearings';

    // Main Forest Trail: Connects Village Forest Gate (24, 0, -68) through Sacred Grove to Deep Jungle
    const mainTrailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(24, 0.02, -68),  // Relocated Village Gate
      new THREE.Vector3(25, 0.02, -82),  // Shady Canopy Corridor
      new THREE.Vector3(26, 0.02, -98),  // Sacred Grove Clearing
      new THREE.Vector3(23, 0.02, -112), // Brook Approach
      new THREE.Vector3(18, 0.02, -122), // Brook & Stepping Stones
      new THREE.Vector3(26, 0.02, -132), // Fork junction
      new THREE.Vector3(42, 0.02, -142), // Grand Banyan Clearing
      new THREE.Vector3(35, 0.02, -155),
      new THREE.Vector3(18, 0.02, -168), // Ancient Shrine Clearing
      new THREE.Vector3(15, 0.02, -185), // Deep North Outlook
    ]);

    this.renderCurvedTrail(mainTrailCurve, 3.8, pathGroup);

    // Secondary Path A: Leads West to the Bamboo Grove & Forest Brook
    const westTrailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(26, 0.02, -132),
      new THREE.Vector3(10, 0.02, -134),
      new THREE.Vector3(-15, 0.02, -136),
      new THREE.Vector3(-35, 0.02, -142), // Bamboo Haven
      new THREE.Vector3(-48, 0.02, -155),
    ]);
    this.renderCurvedTrail(westTrailCurve, 2.4, pathGroup);

    // Secondary Path B: Loop from Sacred Grove to East Forest Outlook
    const eastTrailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(26, 0.02, -98),
      new THREE.Vector3(44, 0.02, -110),
      new THREE.Vector3(56, 0.02, -124),
      new THREE.Vector3(56, 0.02, -136),
      new THREE.Vector3(42, 0.02, -142),
    ]);
    this.renderCurvedTrail(eastTrailCurve, 2.2, pathGroup);

    // NATURAL CLEARINGS (Spacious open ground for exploration)
    const clearings = [
      // Clearing 1: Brook & Stepping Stones (at 18, 0, -122)
      { x: 18, z: -122, rx: 12, rz: 10, mat: this.matTrailDirt },
      // Clearing 2: Grand Banyan Clearing (at 42, 0, -142)
      { x: 42, z: -142, rx: 16, rz: 14, mat: this.matForestGrass },
      // Clearing 3: Bamboo Haven (at -35, 0, -142)
      { x: -35, z: -142, rx: 14, rz: 12, mat: this.matForestGrass },
      // Clearing 4: Ancient Shrine Clearing (at 18, 0, -168)
      { x: 18, z: -168, rx: 15, rz: 14, mat: this.matTrailDirt },
    ];

    clearings.forEach(cl => {
      const clearingMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(cl.rx, cl.rx + 1.5, 0.04, 24),
        cl.mat
      );
      clearingMesh.position.set(cl.x, 0.015, cl.z);
      clearingMesh.receiveShadow = true;
      pathGroup.add(clearingMesh);
    });

    this.group.add(pathGroup);
  }

  /**
   * Helper to extrude ribbon geometry along a 3D path curve
   */
  private renderCurvedTrail(curve: THREE.CatmullRomCurve3, width: number, parentGroup: THREE.Group): void {
    const points = curve.getPoints(48);
    const verts: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      let tangent = new THREE.Vector3(0, 0, -1);
      if (i < points.length - 1) {
        tangent = points[i + 1].clone().sub(pt).normalize();
      } else if (i > 0) {
        tangent = pt.clone().sub(points[i - 1]).normalize();
      }
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      verts.push(
        pt.x + normal.x * width * 0.5, 0.025, pt.z + normal.z * width * 0.5,
        pt.x - normal.x * width * 0.5, 0.025, pt.z - normal.z * width * 0.5
      );

      if (i < points.length - 1) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, this.matTrailDirt);
    mesh.receiveShadow = true;
    parentGroup.add(mesh);
  }

  /**
   * 3. Diverse trees with varied heights, species, and silhouettes.
   * Tree trunks have colliders; paths and clearings have plenty of clearance.
   */
  private buildForestTrees(): void {
    const treeGroup = new THREE.Group();
    treeGroup.name = 'jungle_trees';

    // Distinct tree definitions placed intentionally around (NOT blocking) walking trails
    const forestTrees: {
      type: 'banyan' | 'sal' | 'jamun' | 'teak' | 'bamboo';
      x: number;
      z: number;
      scale: number;
    }[] = [
      // Grand Banyan in the central clearing
      { type: 'banyan', x: 42, z: -142, scale: 1.25 },
      { type: 'banyan', x: -10, z: -160, scale: 1.0 },

      // Sal Trees (Tall, majestic straight trunks, high canopies)
      { type: 'sal', x: 34, z: -35, scale: 1.1 },
      { type: 'sal', x: 8, z: -40, scale: 0.95 },
      { type: 'sal', x: 38, z: -58, scale: 1.15 },
      { type: 'sal', x: 8, z: -62, scale: 1.05 },
      { type: 'sal', x: 32, z: -80, scale: 1.2 },
      { type: 'sal', x: 3, z: -88, scale: 1.1 },
      { type: 'sal', x: 38, z: -106, scale: 1.3 },
      { type: 'sal', x: 12, z: -118, scale: 1.0 },
      { type: 'sal', x: 55, z: -135, scale: 1.25 },
      { type: 'sal', x: 26, z: -148, scale: 1.15 },
      { type: 'sal', x: 5, z: -152, scale: 1.2 },
      { type: 'sal', x: 32, z: -175, scale: 1.3 },
      { type: 'sal', x: 2, z: -180, scale: 1.1 },

      // Jamun Trees (Spreading rounded canopy, rich shade)
      { type: 'jamun', x: 48, z: -75, scale: 1.05 },
      { type: 'jamun', x: -2, z: -50, scale: 0.9 },
      { type: 'jamun', x: 46, z: -78, scale: 1.1 },
      { type: 'jamun', x: 62, z: -92, scale: 1.15 },
      { type: 'jamun', x: -8, z: -102, scale: 1.0 },
      { type: 'jamun', x: 58, z: -118, scale: 1.2 },
      { type: 'jamun', x: -22, z: -140, scale: 1.1 },
      { type: 'jamun', x: 42, z: -155, scale: 1.05 },
      { type: 'jamun', x: -12, z: -178, scale: 1.15 },

      // Indian Teak Trees (Broad horizontal leaves)
      { type: 'teak', x: 14, z: -52, scale: 0.95 },
      { type: 'teak', x: -14, z: -68, scale: 1.0 },
      { type: 'teak', x: 38, z: -92, scale: 1.1 },
      { type: 'teak', x: 68, z: -108, scale: 1.2 },
      { type: 'teak', x: -4, z: -128, scale: 1.05 },
      { type: 'teak', x: 52, z: -168, scale: 1.2 },
      { type: 'teak', x: 24, z: -188, scale: 1.15 },

      // Bamboo Groves (Clustered culms)
      { type: 'bamboo', x: -25, z: -95, scale: 1.1 },
      { type: 'bamboo', x: -35, z: -115, scale: 1.3 },
      { type: 'bamboo', x: -42, z: -130, scale: 1.25 },
      { type: 'bamboo', x: -28, z: -142, scale: 1.1 },
      { type: 'bamboo', x: 66, z: -62, scale: 1.15 },
      { type: 'bamboo', x: 72, z: -85, scale: 1.2 },
      { type: 'bamboo', x: 70, z: -140, scale: 1.2 },
    ];

    forestTrees.forEach((t, idx) => {
      const treeNode = new THREE.Group();
      treeNode.position.set(t.x, 0, t.z);

      if (t.type === 'banyan') {
        this.createBanyanTree(treeNode, t.scale);
        this.collisionSystem.addCollider({
          id: `jungle_banyan_${idx}`,
          type: 'sphere',
          position: new THREE.Vector3(t.x, 0, t.z),
          radius: 2.2 * t.scale,
        });
      } else if (t.type === 'sal') {
        this.createSalTree(treeNode, t.scale);
        this.collisionSystem.addCollider({
          id: `jungle_sal_${idx}`,
          type: 'sphere',
          position: new THREE.Vector3(t.x, 0, t.z),
          radius: 0.9 * t.scale,
        });
      } else if (t.type === 'jamun') {
        this.createJamunTree(treeNode, t.scale);
        this.collisionSystem.addCollider({
          id: `jungle_jamun_${idx}`,
          type: 'sphere',
          position: new THREE.Vector3(t.x, 0, t.z),
          radius: 1.0 * t.scale,
        });
      } else if (t.type === 'teak') {
        this.createTeakTree(treeNode, t.scale);
        this.collisionSystem.addCollider({
          id: `jungle_teak_${idx}`,
          type: 'sphere',
          position: new THREE.Vector3(t.x, 0, t.z),
          radius: 0.95 * t.scale,
        });
      } else if (t.type === 'bamboo') {
        this.createBambooClump(treeNode, t.scale);
        this.collisionSystem.addCollider({
          id: `jungle_bamboo_${idx}`,
          type: 'sphere',
          position: new THREE.Vector3(t.x, 0, t.z),
          radius: 1.1 * t.scale,
        });
      }

      treeGroup.add(treeNode);
    });

    this.group.add(treeGroup);
  }

  /**
   * Procedural Banyan Tree with prop roots and layered canopy
   */
  private createBanyanTree(group: THREE.Group, scale: number): void {
    const trunkH = 6.2 * scale;
    const trunkGeo = new THREE.CylinderGeometry(1.6 * scale, 2.2 * scale, trunkH, 12);
    const trunk = new THREE.Mesh(trunkGeo, this.matBanyanTrunk);
    trunk.position.y = trunkH * 0.5;
    trunk.castShadow = true;
    group.add(trunk);

    // Sprawling canopy tiers
    const canopyTiers = [
      { r: 5.5 * scale, y: trunkH + 1.5 * scale, dx: 0, dz: 0, mat: this.matDeepLeaf },
      { r: 4.2 * scale, y: trunkH + 3.0 * scale, dx: 1.5 * scale, dz: -1.0 * scale, mat: this.matLushLeaf },
      { r: 4.0 * scale, y: trunkH + 2.8 * scale, dx: -1.6 * scale, dz: 1.4 * scale, mat: this.matLushLeaf },
      { r: 3.2 * scale, y: trunkH + 4.2 * scale, dx: 0, dz: 0, mat: this.matGoldenLeaf },
    ];

    canopyTiers.forEach(tier => {
      const fol = new THREE.Mesh(new THREE.SphereGeometry(tier.r, 10, 10), tier.mat);
      fol.position.set(tier.dx, tier.y, tier.dz);
      fol.castShadow = true;
      group.add(fol);
    });

    // Aerial prop roots
    const numRoots = 6;
    for (let i = 0; i < numRoots; i++) {
      const angle = (i / numRoots) * Math.PI * 2 + 0.3;
      const rootR = 2.8 * scale;
      const rx = Math.cos(angle) * rootR;
      const rz = Math.sin(angle) * rootR;

      const rootGeo = new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, trunkH * 0.95, 6);
      const root = new THREE.Mesh(rootGeo, this.matBanyanTrunk);
      root.position.set(rx, trunkH * 0.47, rz);
      root.rotation.z = Math.cos(angle) * 0.08;
      group.add(root);
    }
  }

  /**
   * Procedural Sal Tree (Tall straight trunk, high canopy)
   */
  private createSalTree(group: THREE.Group, scale: number): void {
    const totalH = 12 * scale;
    const trunkH = totalH * 0.65;
    const trunkGeo = new THREE.CylinderGeometry(0.45 * scale, 0.7 * scale, trunkH, 8);
    const trunk = new THREE.Mesh(trunkGeo, this.matSalTrunk);
    trunk.position.y = trunkH * 0.5;
    trunk.castShadow = true;
    group.add(trunk);

    const fol1 = new THREE.Mesh(new THREE.SphereGeometry(3.6 * scale, 8, 8), this.matDeepLeaf);
    fol1.position.y = trunkH + 1.8 * scale;
    fol1.castShadow = true;
    group.add(fol1);

    const fol2 = new THREE.Mesh(new THREE.SphereGeometry(2.8 * scale, 8, 8), this.matLushLeaf);
    fol2.position.set(0.6 * scale, trunkH + 3.4 * scale, -0.4 * scale);
    fol2.castShadow = true;
    group.add(fol2);
  }

  /**
   * Procedural Jamun Tree (Dense rounded crown)
   */
  private createJamunTree(group: THREE.Group, scale: number): void {
    const trunkH = 5.2 * scale;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55 * scale, 0.8 * scale, trunkH, 8),
      this.matSalTrunk
    );
    trunk.position.y = trunkH * 0.5;
    trunk.castShadow = true;
    group.add(trunk);

    const crownGeo = new THREE.SphereGeometry(3.8 * scale, 9, 9);
    const crown = new THREE.Mesh(crownGeo, this.matDeepLeaf);
    crown.position.y = trunkH + 2.2 * scale;
    crown.castShadow = true;
    group.add(crown);

    const highlightGeo = new THREE.SphereGeometry(2.4 * scale, 8, 8);
    const highlight = new THREE.Mesh(highlightGeo, this.matLushLeaf);
    highlight.position.set(0.8 * scale, trunkH + 3.2 * scale, 0.6 * scale);
    highlight.castShadow = true;
    group.add(highlight);
  }

  /**
   * Procedural Teak Tree (Stout trunk, wide leaves)
   */
  private createTeakTree(group: THREE.Group, scale: number): void {
    const trunkH = 4.8 * scale;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5 * scale, 0.75 * scale, trunkH, 8),
      this.matSalTrunk
    );
    trunk.position.y = trunkH * 0.5;
    trunk.castShadow = true;
    group.add(trunk);

    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(4.2 * scale, 4.5 * scale, 8),
      this.matLushLeaf
    );
    canopy.position.y = trunkH + 2.2 * scale;
    canopy.castShadow = true;
    group.add(canopy);
  }

  /**
   * Procedural Bamboo Clump (Cluster of swaying green culms)
   */
  private createBambooClump(group: THREE.Group, scale: number): void {
    const numCulms = 7;
    for (let i = 0; i < numCulms; i++) {
      const angle = (i / numCulms) * Math.PI * 2;
      const offset = (0.3 + (i % 3) * 0.25) * scale;
      const bx = Math.cos(angle) * offset;
      const bz = Math.sin(angle) * offset;
      const h = (8.5 + (i % 4) * 1.5) * scale;

      const culmGeo = new THREE.CylinderGeometry(0.08 * scale, 0.1 * scale, h, 6);
      const culm = new THREE.Mesh(culmGeo, this.matBambooCulm);
      culm.position.set(bx, h * 0.5, bz);
      culm.rotation.z = (Math.cos(angle) * 0.05);
      culm.rotation.x = (Math.sin(angle) * 0.05);
      culm.castShadow = true;
      group.add(culm);

      // Bamboo leaf fronds at upper nodes
      const frondGeo = new THREE.ConeGeometry(1.2 * scale, 2.2 * scale, 5);
      const frond = new THREE.Mesh(frondGeo, this.matLushLeaf);
      frond.position.set(bx + Math.cos(angle) * 0.4, h - 0.5 * scale, bz + Math.sin(angle) * 0.4);
      frond.rotation.z = Math.cos(angle) * 0.3;
      group.add(frond);
    }
  }

  /**
   * 4. Bushes, wild ferns, grass tufts & undergrowth
   * Framed along paths and forest margins without blocking navigation.
   */
  private buildUndergrowthAndFlora(): void {
    const floraGroup = new THREE.Group();
    floraGroup.name = 'jungle_undergrowth';

    // Shrub and bush coordinates (framing paths)
    const bushCoords = [
      { x: 13, z: -32, r: 1.2 },
      { x: 28, z: -36, r: 1.4 },
      { x: 21, z: -50, r: 1.5 },
      { x: 31, z: -64, r: 1.3 },
      { x: 11, z: -72, r: 1.6 },
      { x: 23, z: -84, r: 1.4 },
      { x: 9, z: -100, r: 1.5 },
      { x: 32, z: -115, r: 1.7 },
      { x: -5, z: -112, r: 1.3 },
      { x: -22, z: -120, r: 1.5 },
      { x: 29, z: -138, r: 1.6 },
      { x: 11, z: -155, r: 1.5 },
      { x: 25, z: -170, r: 1.4 },
      { x: 8, z: -180, r: 1.6 },
    ];

    bushCoords.forEach((b, idx) => {
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(b.r, 7, 7),
        idx % 2 === 0 ? this.matBushLantana : this.matLushLeaf
      );
      bush.scale.set(1.1, 0.75, 1.1);
      bush.position.set(b.x, b.r * 0.55, b.z);
      bush.castShadow = true;
      floraGroup.add(bush);

      // Tiny flowering florets for Lantana bushes (Orange and pink accents)
      if (idx % 2 === 0) {
        const flowerGeo = new THREE.SphereGeometry(0.18, 5, 5);
        const flowerMat = new THREE.MeshBasicMaterial({ color: idx % 4 === 0 ? '#f97316' : '#ec4899' });
        for (let f = 0; f < 3; f++) {
          const fl = new THREE.Mesh(flowerGeo, flowerMat);
          fl.position.set(
            b.x + (Math.sin(f * 2.1) * b.r * 0.7),
            b.r * 0.85 + (f * 0.1),
            b.z + (Math.cos(f * 2.1) * b.r * 0.7)
          );
          floraGroup.add(fl);
        }
      }
    });

    // Wild Fern Clusters at tree roots
    const fernPositions = [
      { x: 19, z: -38 }, { x: 33, z: -48 }, { x: 15, z: -66 },
      { x: 27, z: -76 }, { x: 13, z: -108 }, { x: 38, z: -132 },
      { x: -18, z: -124 }, { x: 16, z: -160 }, { x: 21, z: -176 },
    ];

    fernPositions.forEach(fp => {
      const fernBundle = new THREE.Group();
      fernBundle.position.set(fp.x, 0, fp.z);

      const numFronds = 5;
      for (let i = 0; i < numFronds; i++) {
        const angle = (i / numFronds) * Math.PI * 2;
        const frond = new THREE.Mesh(
          new THREE.ConeGeometry(0.25, 1.2, 4),
          this.matFernLeaf
        );
        frond.position.set(Math.cos(angle) * 0.35, 0.5, Math.sin(angle) * 0.35);
        frond.rotation.z = Math.cos(angle) * 0.45;
        frond.rotation.x = Math.sin(angle) * 0.45;
        fernBundle.add(frond);
      }

      floraGroup.add(fernBundle);
    });

    this.group.add(floraGroup);
  }

  /**
   * 5. Natural weathered granite boulders and rocky outcrops
   */
  private buildForestRocks(): void {
    const rockGroup = new THREE.Group();
    rockGroup.name = 'forest_rocks';

    const rockConfigs = [
      // Brook Stepping Rocks (at 18, 0, -78)
      { x: 15, z: -76, w: 2.2, h: 0.9, d: 1.8, mat: this.matMossyRock, collider: true },
      { x: 21, z: -79, w: 2.4, h: 1.1, d: 2.0, mat: this.matGraniteRock, collider: true },
      { x: 12, z: -82, w: 1.8, h: 0.8, d: 1.6, mat: this.matMossyRock, collider: false },
      // Grand Banyan Rock Outcrop (Natural seats at clearing edge)
      { x: 48, z: -122, w: 3.6, h: 1.4, d: 2.8, mat: this.matGraniteRock, collider: true },
      { x: 36, z: -128, w: 2.8, h: 1.2, d: 2.2, mat: this.matMossyRock, collider: true },
      // Bamboo Haven Rocks
      { x: -32, z: -118, w: 2.5, h: 1.0, d: 2.0, mat: this.matMossyRock, collider: true },
      { x: -40, z: -132, w: 3.2, h: 1.3, d: 2.6, mat: this.matGraniteRock, collider: true },
      // North Edge Ridge Rocks
      { x: 10, z: -172, w: 4.2, h: 1.8, d: 3.4, mat: this.matGraniteRock, collider: true },
      { x: 26, z: -168, w: 3.8, h: 1.6, d: 3.0, mat: this.matMossyRock, collider: true },
      { x: 17, z: -192, w: 5.5, h: 2.2, d: 4.2, mat: this.matGraniteRock, collider: true },
    ];

    rockConfigs.forEach((rc, idx) => {
      const rockGeo = new THREE.DodecahedronGeometry(rc.w * 0.45, 1);
      const rock = new THREE.Mesh(rockGeo, rc.mat);
      rock.scale.set(rc.w / (rc.w * 0.9), rc.h / (rc.w * 0.9), rc.d / (rc.w * 0.9));
      rock.position.set(rc.x, rc.h * 0.45, rc.z);
      rock.rotation.set(idx * 0.4, idx * 0.6, idx * 0.2);
      rock.castShadow = true;
      rock.receiveShadow = true;
      rockGroup.add(rock);

      if (rc.collider) {
        this.collisionSystem.addCollider({
          id: `jungle_rock_${idx}`,
          type: 'sphere',
          position: new THREE.Vector3(rc.x, 0, rc.z),
          radius: (rc.w + rc.d) * 0.25,
        });
      }
    });

    this.group.add(rockGroup);
  }

  /**
   * 6. Ancient Forest Landmark (Deep Forest Ganesha Stone Shrine at 18, 0, -165)
   */
  private buildDeepForestShrine(): void {
    const shrineGroup = new THREE.Group();
    shrineGroup.name = 'deep_forest_ganesha_shrine';
    shrineGroup.position.set(18, 0, -165);

    // Carved Granite Platform
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.6, 0.6, 16),
      this.matGraniteRock
    );
    plinth.position.y = 0.3;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    shrineGroup.add(plinth);

    // Stone Mandapam Canopy Pillars
    [-1.6, 1.6].forEach(px => {
      [-1.6, 1.6].forEach(pz => {
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.22, 3.2, 8),
          this.matGraniteRock
        );
        pillar.position.set(px, 1.6 + 0.3, pz);
        pillar.castShadow = true;
        shrineGroup.add(pillar);
      });
    });

    // Stone Sloped Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.0, 1.4, 4),
      this.matGraniteRock
    );
    roof.position.set(0, 3.2 + 0.3 + 0.7, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    shrineGroup.add(roof);

    // Brass Kalasam Finial
    const finial = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.6, 8),
      this.matTempleGold
    );
    finial.position.set(0, 4.5, 0);
    shrineGroup.add(finial);

    // Granite Ganesha Idol
    const idolBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.4, 0.7),
      this.matGraniteRock
    );
    idolBase.position.set(0, 0.8, 0);
    shrineGroup.add(idolBase);

    const idolBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 10, 10),
      this.matGraniteRock
    );
    idolBody.position.set(0, 1.35, 0);
    shrineGroup.add(idolBody);

    // Brass Deepam oil lamp glow
    const lamp = new THREE.PointLight('#f59e0b', 1.8, 14);
    lamp.position.set(0, 1.6, 0.8);
    shrineGroup.add(lamp);

    this.collisionSystem.addCollider({
      id: 'jungle_shrine_collider',
      type: 'box',
      position: new THREE.Vector3(18, 1.5, -165),
      size: new THREE.Vector3(3.6, 3.5, 3.6),
    });

    this.group.add(shrineGroup);
  }

  /**
   * 7. Multi-Tiered 3D Mountain Horizon Ranges
   * Framed along the sacred forest, river valley, and northern horizon.
   * STRICT CLEARANCE:
   * Mountains are placed strictly OUTSIDE and BEYOND the modern city and highway.
   * No near or mid-tier mountains are allowed in the East or South where urban areas exist.
   * Distant peaks sit far on the outer perimeter horizon.
   */
  private buildMountainRanges(): void {
    const mountainGroup = new THREE.Group();
    mountainGroup.name = 'horizon_mountains_system';

    // Tier 1: Near Rolling Foothills (Lush green tone)
    // Exclusively framing the northern jungle perimeter (Z: -240 to -320, X: -180 to 70)
    const numNearPeaks = 14;
    for (let i = 0; i < numNearPeaks; i++) {
      // Span along the northern forest horizon (angles from 1.05pi to 1.95pi)
      const angle = Math.PI + (i / (numNearPeaks - 1) - 0.5) * Math.PI * 0.9;
      const dist = 260 + Math.sin(i * 3.7) * 25;
      const px = Math.cos(angle) * dist - 30;
      const pz = Math.sin(angle) * dist - 50;

      // Ensure strictly outside city & highway
      if (px > 85 || pz > -100) continue;

      const peakHeight = 32 + Math.sin(i * 4.2) * 12 + (i % 3 === 0 ? 8 : -4);
      const baseRadius = 40 + (i % 4) * 10;

      const geo = new THREE.ConeGeometry(baseRadius, peakHeight, 7);
      geo.translate(0, peakHeight * 0.5 - 2.5, 0);

      const m = new THREE.Mesh(geo, this.matMountainNear);
      m.position.set(px, 1.5, pz);
      m.rotation.y = i * 0.8;
      m.castShadow = false;
      m.receiveShadow = true;
      mountainGroup.add(m);
    }

    // Tier 2: Mid-Range Craggy Granite Peaks (Solid, majestic 3D ridges)
    // Framing the deep sacred grove and western river valley from afar (Z < -320 or X < -180)
    const numMidPeaks = 18;
    for (let i = 0; i < numMidPeaks; i++) {
      const angle = Math.PI + (i / (numMidPeaks - 1) - 0.5) * Math.PI * 1.1;
      const dist = 380 + Math.cos(i * 2.8) * 35;
      const px = Math.cos(angle) * dist - 40;
      const pz = Math.sin(angle) * dist - 40;

      // Absolute safety check: Never near city (X: 140-300, Z: -160 to 60) or highway
      if (px > 90 || pz > -120) continue;

      const peakHeight = 58 + Math.sin(i * 3.1) * 22;
      const baseRadius = 58 + (i % 3) * 16;

      const geo = new THREE.ConeGeometry(baseRadius, peakHeight, 8);
      geo.translate(0, peakHeight * 0.5 - 3.5, 0);

      const m = new THREE.Mesh(geo, this.matMountainMid);
      m.position.set(px, 3.0, pz);
      m.rotation.y = i * 1.2;
      m.receiveShadow = true;
      mountainGroup.add(m);
    }

    // Tier 3: Grand Hazy Distant Horizon Mountains (High elevation, deep silhouettes)
    // Positioned strictly on the far distant horizon (R > 520m) surrounding the outer boundary
    const numFarPeaks = 20;
    for (let i = 0; i < numFarPeaks; i++) {
      const angle = (i / numFarPeaks) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      let px: number;
      let pz: number;

      if (cosA > 0.1) {
        // Distant East sector: placed far OUTSIDE and BEYOND the city (X: 580 to 680)
        const eastDist = 410 + cosA * 60 + Math.sin(i * 2.1) * 30;
        px = 215 + cosA * eastDist;
        pz = -55 + sinA * (eastDist + 40);
      } else {
        // North, West, South distant perimeter
        const dist = 520 + Math.sin(i * 2.1) * 45;
        px = cosA * dist;
        pz = sinA * dist;
      }

      // Check distance to City Center (215, -55) to guarantee complete clearance
      const distToCity = Math.sqrt((px - 215) * (px - 215) + (pz - (-55)) * (pz - (-55)));
      if (distToCity < 340) continue;

      const peakHeight = 92 + Math.sin(i * 3.5) * 35;
      const baseRadius = 88 + (i % 4) * 20;

      const geo = new THREE.ConeGeometry(baseRadius, peakHeight, 8);
      geo.translate(0, peakHeight * 0.5 - 4.5, 0);

      const m = new THREE.Mesh(geo, this.matMountainDistant);
      m.position.set(px, 4.0, pz);
      m.rotation.y = i * 0.7;
      mountainGroup.add(m);
    }

    this.group.add(mountainGroup);
  }
}
