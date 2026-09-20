/**
 * THE KATHA - Sacred Forest Grove & Paper Bag World Module
 *
 * Constructs the 3D stylized forest environment outside Rangastalam:
 * - Dappled sunlight shafts, forest soil, mossy boulders
 * - Varied vegetation: Sal, Peepal, Bamboo, flowering Jamun, ferns, shrubs
 * - Gentle drifting environmental particles (golden pollen motes & falling leaves)
 * - The sacred collection clearing at (26, 0, -42)
 * - The visible Handcrafted Paper Bag that visibly fills as leaves are deposited
 * - 21 distinct 3D botanical plant nodes for the Eka Vimshathi Patra leaves
 */

import * as THREE from 'three';
import { CollisionSystem } from '../collisions/CollisionSystem';
import { SACRED_21_LEAVES, SacredLeafInfo } from '../../types/pathrika';

export interface ForestPlantNode {
  leafInfo: SacredLeafInfo;
  worldPosition: THREE.Vector3;
  group: THREE.Group;
  markerMesh: THREE.Mesh;
  foliageGroup: THREE.Group;
  isHarvested: boolean;
}

export class SacredForestGrove {
  public group: THREE.Group;
  public clearingCenter: THREE.Vector3 = new THREE.Vector3(26, 0, -98);
  public paperBagGroup: THREE.Group;
  public paperBagPosition: THREE.Vector3 = new THREE.Vector3(26, 0, -98);
  public plantNodes: Map<string, ForestPlantNode> = new Map();
  private collisionSystem: CollisionSystem;

  // Visual bag fill layers
  private bagLeafLayers: THREE.Mesh[] = [];
  private bagMarigoldCrown: THREE.Group;
  private bagGlowRing: THREE.Mesh;

  // Environmental particles
  private particlePoints: THREE.Points;
  private particlePositions: Float32Array;
  private particleCount: number = 75;

  // Materials
  private matForestSoil: THREE.MeshLambertMaterial;
  private matMossGreen: THREE.MeshLambertMaterial;
  private matTreeTrunk: THREE.MeshLambertMaterial;
  private matRock: THREE.MeshLambertMaterial;
  private matPaperBag: THREE.MeshLambertMaterial;
  private matLeafGreen: THREE.MeshLambertMaterial;
  private matDurvaGrass: THREE.MeshLambertMaterial;
  private matSunBeam: THREE.MeshBasicMaterial;

  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem;
    this.group = new THREE.Group();
    this.group.name = 'sacred_forest_grove';

    // Materials initialization
    this.matForestSoil = new THREE.MeshLambertMaterial({ color: '#2d241e' }); // Loamy dark earth
    this.matMossGreen = new THREE.MeshLambertMaterial({ color: '#2e7d32' }); // Forest floor moss
    this.matTreeTrunk = new THREE.MeshLambertMaterial({ color: '#3e2723' }); // Dark forest bark
    this.matRock = new THREE.MeshLambertMaterial({ color: '#4b5563' }); // Mossy river granite
    this.matPaperBag = new THREE.MeshLambertMaterial({ color: '#d4a373' }); // Natural Kraft paper
    this.matLeafGreen = new THREE.MeshLambertMaterial({ color: '#15803d' });
    this.matDurvaGrass = new THREE.MeshLambertMaterial({ color: '#4ade80' });
    this.matSunBeam = new THREE.MeshBasicMaterial({
      color: '#fef08a',
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.paperBagGroup = new THREE.Group();
    this.bagMarigoldCrown = new THREE.Group();
    this.bagGlowRing = new THREE.Mesh();

    // Particle arrays
    this.particlePositions = new Float32Array(this.particleCount * 3);
    const pGeo = new THREE.BufferGeometry();
    const pMat = new THREE.PointsMaterial({
      color: '#fef08a',
      size: 0.25,
      transparent: true,
      opacity: 0.6,
    });
    this.particlePoints = new THREE.Points(pGeo, pMat);

    this.buildForestTerrain();
    this.buildDiverseTreesAndBoulders();
    this.buildSunlightShaftsAndFlora();
    this.buildSacredAltarAndPaperBag();
    this.buildThe21PlantNodes();
    this.initEnvironmentalParticles();
  }

  /**
   * 1. Rich Forest Ground Terrain with natural clearings
   */
  private buildForestTerrain(): void {
    // Expansive loamy woodland ground
    const forestGroundGeo = new THREE.CylinderGeometry(28, 30, 0.8, 32);
    const forestGround = new THREE.Mesh(forestGroundGeo, this.matForestSoil);
    forestGround.position.set(this.clearingCenter.x, -0.4, this.clearingCenter.z);
    forestGround.receiveShadow = true;
    this.group.add(forestGround);

    // Mossy turf patches across the forest floor
    const mossPatches = [
      { x: 26, z: -98, r: 8.5 }, // Central clearing
      { x: 19, z: -91, r: 5.5 },
      { x: 34, z: -94, r: 6.2 },
      { x: 22, z: -106, r: 6.8 },
      { x: 32, z: -105, r: 7.0 },
    ];
    mossPatches.forEach((p, idx) => {
      const patch = new THREE.Mesh(
        new THREE.CylinderGeometry(p.r, p.r + 0.5, 0.82, 18),
        this.matMossGreen
      );
      patch.position.set(p.x, -0.38, p.z);
      patch.receiveShadow = true;
      this.group.add(patch);
    });

    // Forest Dirt Paths (linking from gate [24, -68] into clearing [26, -98])
    const pathCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(24, 0.03, -68),
      new THREE.Vector3(24.5, 0.03, -78),
      new THREE.Vector3(25.2, 0.03, -88),
      new THREE.Vector3(26, 0.03, -98),
    ]);
    const pathGeo = new THREE.TubeGeometry(pathCurve, 20, 1.8, 8, false);
    const pathMesh = new THREE.Mesh(
      pathGeo,
      new THREE.MeshLambertMaterial({ color: '#8d6e63' })
    );
    pathMesh.receiveShadow = true;
    this.group.add(pathMesh);
  }

  /**
   * 2. Diverse Forest Trees (Peepal, Sal, Teak, Bamboo) & Granite Boulders
   */
  private buildDiverseTreesAndBoulders(): void {
    // Surrounding Forest Woodland Perimeter
    const treeProfiles = [
      // Peepal / Banyan ancient trees
      { x: 12, z: -94, type: 'peepal', r: 1.8, h: 9.0 },
      { x: 15, z: -106, type: 'peepal', r: 1.9, h: 9.5 },
      { x: 37, z: -88, type: 'peepal', r: 1.7, h: 8.8 },
      { x: 39, z: -104, type: 'peepal', r: 2.0, h: 9.8 },
      // Tall Sal & Teak woodland trees
      { x: 18, z: -100, type: 'sal', r: 1.4, h: 8.2 },
      { x: 23, z: -110, type: 'sal', r: 1.5, h: 8.5 },
      { x: 30, z: -110, type: 'sal', r: 1.4, h: 8.4 },
      { x: 35, z: -98, type: 'sal', r: 1.5, h: 8.0 },
      // Bamboo thickets
      { x: 14, z: -88, type: 'bamboo', r: 1.2, h: 6.5 },
      { x: 36, z: -109, type: 'bamboo', r: 1.3, h: 6.8 },
      { x: 20, z: -112, type: 'bamboo', r: 1.2, h: 6.2 },
    ];

    treeProfiles.forEach((t, i) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(t.x, 0, t.z);

      if (t.type === 'bamboo') {
        // Cluster of slender bamboo poles
        const bambooMat = new THREE.MeshLambertMaterial({ color: '#84cc16' });
        const culmOffsets = [
          { dx: -0.4, dz: -0.3 },
          { dx: 0.3, dz: -0.2 },
          { dx: -0.2, dz: 0.4 },
          { dx: 0.4, dz: 0.3 },
          { dx: 0.0, dz: 0.0 },
        ];
        culmOffsets.forEach((o) => {
          const culm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.1, t.h, 8),
            bambooMat
          );
          culm.position.set(o.dx, t.h / 2, o.dz);
          culm.castShadow = true;
          treeGroup.add(culm);

          // Feathery bamboo foliage tops
          const foliage = new THREE.Mesh(
            new THREE.SphereGeometry(0.9, 8, 8),
            this.matLeafGreen
          );
          foliage.scale.set(1.4, 0.6, 1.4);
          foliage.position.set(o.dx, t.h * 0.92, o.dz);
          treeGroup.add(foliage);
        });
      } else if (t.type === 'peepal') {
        // Broad crown sacred tree
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 1.3, t.h * 0.6, 12),
          this.matTreeTrunk
        );
        trunk.position.y = (t.h * 0.6) / 2;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Tiered dome canopies
        const canopy1 = new THREE.Mesh(
          new THREE.SphereGeometry(4.2, 12, 10),
          new THREE.MeshLambertMaterial({ color: '#16a34a' })
        );
        canopy1.position.y = t.h * 0.75;
        canopy1.castShadow = true;
        treeGroup.add(canopy1);

        const canopy2 = new THREE.Mesh(
          new THREE.SphereGeometry(3.0, 10, 8),
          new THREE.MeshLambertMaterial({ color: '#22c55e' })
        );
        canopy2.position.set(1.0, t.h * 0.95, -0.8);
        treeGroup.add(canopy2);
      } else {
        // Tall Sal / Teak tree
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.85, t.h * 0.7, 10),
          this.matTreeTrunk
        );
        trunk.position.y = (t.h * 0.7) / 2;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const canopy = new THREE.Mesh(
          new THREE.ConeGeometry(3.2, 5.0, 10),
          this.matLeafGreen
        );
        canopy.position.y = t.h * 0.78;
        canopy.castShadow = true;
        treeGroup.add(canopy);
      }

      this.group.add(treeGroup);

      // Add solid collision for large tree trunks
      this.collisionSystem.addCollider({
        id: `forest_tree_cluster_${i}`,
        type: 'sphere',
        position: new THREE.Vector3(t.x, 0, t.z),
        radius: t.r,
      });
    });

    // Mossy Granite Forest Boulders
    const boulderCoords = [
      { x: 17, z: -93, r: 1.2 },
      { x: 33, z: -90, r: 1.4 },
      { x: 19, z: -104, r: 1.3 },
      { x: 34, z: -102, r: 1.6 },
      { x: 27, z: -109, r: 1.5 },
      { x: 21, z: -86, r: 0.9 },
    ];
    boulderCoords.forEach((b, idx) => {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(b.r, 1),
        this.matRock
      );
      rock.position.set(b.x, b.r * 0.45, b.z);
      rock.rotation.set(Math.sin(idx), idx, Math.cos(idx));
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);

      // Moss cap on top of boulder
      const mossCap = new THREE.Mesh(
        new THREE.SphereGeometry(b.r * 0.92, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.45),
        this.matMossGreen
      );
      mossCap.position.set(b.x, b.r * 0.6, b.z);
      this.group.add(mossCap);

      this.collisionSystem.addCollider({
        id: `forest_boulder_${idx}`,
        type: 'sphere',
        position: new THREE.Vector3(b.x, 0, b.z),
        radius: b.r * 0.9,
      });
    });
  }

  /**
   * 3. Sunlight Shafts & Wild Undergrowth
   */
  private buildSunlightShaftsAndFlora(): void {
    // Dappled sunbeams beaming into the clearing
    const sunBeamPositions = [
      { x: 24, z: -96, rotZ: 0.18, rotX: -0.15 },
      { x: 28, z: -99, rotZ: -0.12, rotX: 0.1 },
      { x: 26, z: -94, rotZ: 0.08, rotX: -0.2 },
    ];
    sunBeamPositions.forEach((s) => {
      const beamGeo = new THREE.CylinderGeometry(0.3, 2.2, 14, 12, 1, true);
      const beam = new THREE.Mesh(beamGeo, this.matSunBeam);
      beam.position.set(s.x, 6.5, s.z);
      beam.rotation.z = s.rotZ;
      beam.rotation.x = s.rotX;
      this.group.add(beam);
    });

    // Wild Fern clusters and ground shrubs
    const fernPositions = [
      { x: 22, z: -94 },
      { x: 30, z: -96 },
      { x: 21, z: -100 },
      { x: 31, z: -100 },
      { x: 24, z: -103 },
      { x: 28, z: -104 },
    ];
    fernPositions.forEach((f) => {
      const fernGroup = new THREE.Group();
      fernGroup.position.set(f.x, 0, f.z);
      for (let fr = 0; fr < 6; fr++) {
        const frond = new THREE.Mesh(
          new THREE.ConeGeometry(0.18, 0.9, 5),
          this.matDurvaGrass
        );
        frond.rotation.z = 0.55;
        frond.rotation.y = (fr * Math.PI) / 3;
        frond.position.y = 0.3;
        fernGroup.add(frond);
      }
      this.group.add(fernGroup);
    });
  }

  /**
   * 4. Central Sacred Altar & The Visible Handcrafted Paper Bag
   */
  private buildSacredAltarAndPaperBag(): void {
    const center = this.clearingCenter;

    // Altar Stone Base (Rounded ceremonial granite platform)
    const altarBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.7, 0.45, 24),
      new THREE.MeshLambertMaterial({ color: '#57534e' })
    );
    altarBase.position.set(center.x, 0.22, center.z);
    altarBase.receiveShadow = true;
    altarBase.castShadow = true;
    this.group.add(altarBase);

    // Decorative Yellow & Saffron Rangoli border on stone
    const altarBorder = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 2.3, 24),
      new THREE.MeshBasicMaterial({ color: '#f59e0b', side: THREE.DoubleSide })
    );
    altarBorder.rotation.x = -Math.PI / 2;
    altarBorder.position.set(center.x, 0.46, center.z);
    this.group.add(altarBorder);

    // Sacred Pedestal for the Paper Bag
    const bagPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.85, 0.35, 16),
      new THREE.MeshLambertMaterial({ color: '#d97706' })
    );
    bagPedestal.position.set(center.x, 0.62, center.z);
    bagPedestal.castShadow = true;
    this.group.add(bagPedestal);

    // SACRED FOREST MEDITATION SANCTUARY (Paper Bag is placed beside Ganesh Mandapam in Rangastalam Village)
    // In this forest clearing, an auspicious bronze Deepam (oil lamp) and ceremonial brass Puja thali grace the altar
    const sanctuaryShrineGroup = new THREE.Group();
    sanctuaryShrineGroup.position.set(center.x, 0.8, center.z);

    // Brass Puja Thali
    const thaliMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.45, 0.05, 16),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.8, roughness: 0.25 })
    );
    thaliMesh.position.y = 0.025;
    sanctuaryShrineGroup.add(thaliMesh);

    // Traditional Brass Deepam (Lamp) with sacred flame
    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 0.25, 12),
      new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.75, roughness: 0.3 })
    );
    lampBase.position.y = 0.16;
    sanctuaryShrineGroup.add(lampBase);

    const flameGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#fbbf24' })
    );
    flameGlow.position.y = 0.32;
    sanctuaryShrineGroup.add(flameGlow);

    const lampLight = new THREE.PointLight('#f59e0b', 1.2, 8);
    lampLight.position.y = 0.35;
    sanctuaryShrineGroup.add(lampLight);

    // Offering of loose sacred petals
    const petalColors = ['#ea580c', '#f59e0b', '#ec4899'];
    for (let p = 0; p < 8; p++) {
      const petal = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.04, 0),
        new THREE.MeshLambertMaterial({ color: petalColors[p % petalColors.length] })
      );
      const angle = (p * Math.PI * 2) / 8;
      petal.position.set(Math.cos(angle) * 0.32, 0.06, Math.sin(angle) * 0.32);
      sanctuaryShrineGroup.add(petal);
    }
    this.group.add(sanctuaryShrineGroup);

    // Hide paperBagGroup in the forest clearing (bag is with Ramu / at Mandapam)
    this.paperBagGroup.visible = false;
    this.group.add(this.paperBagGroup);

    // Solid collision barrier around altar so player walks respectfully around it
    this.collisionSystem.addCollider({
      id: 'sacred_pathrika_altar',
      type: 'sphere',
      position: this.clearingCenter,
      radius: 1.5,
    });
  }

  /**
   * 5. The 21 Distinct 3D Botanical Plant Nodes for Eka Vimshathi Patra
   */
  private buildThe21PlantNodes(): void {
    const center = this.clearingCenter;

    SACRED_21_LEAVES.forEach((leaf) => {
      const plantGroup = new THREE.Group();
      const worldPos = new THREE.Vector3(
        center.x + leaf.relativePos.x,
        0,
        center.z + leaf.relativePos.z
      );
      plantGroup.position.copy(worldPos);

      // Soil mound base
      const soilMound = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.55, 0.1, 10),
        new THREE.MeshLambertMaterial({ color: '#451a03' })
      );
      soilMound.position.y = 0.05;
      plantGroup.add(soilMound);

      const foliageGroup = new THREE.Group();
      const leafMat = new THREE.MeshLambertMaterial({ color: leaf.plantColor });

      if (leaf.plantStyle === 'durva') {
        // --- MANDATORY DURVA GRASS (Garika) ---
        // Lush three-bladed auspicious Bermuda grass cluster with golden dew accent
        const bladeMat = this.matDurvaGrass;
        for (let b = 0; b < 14; b++) {
          const bladeAngle = (b * Math.PI * 2) / 14;
          const bladeHeight = 0.45 + (b % 3) * 0.1;
          const blade = new THREE.Mesh(
            new THREE.ConeGeometry(0.045, bladeHeight, 4),
            bladeMat
          );
          blade.position.set(
            Math.cos(bladeAngle) * 0.18,
            bladeHeight * 0.45,
            Math.sin(bladeAngle) * 0.18
          );
          blade.rotation.x = Math.sin(bladeAngle) * 0.35;
          blade.rotation.z = Math.cos(bladeAngle) * 0.35;
          foliageGroup.add(blade);
        }

        // Golden sacred dewdrop in center of Durva
        const dew = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 8, 8),
          new THREE.MeshBasicMaterial({ color: '#fef08a' })
        );
        dew.position.y = 0.55;
        foliageGroup.add(dew);
      } else if (leaf.plantStyle === 'flowering') {
        // Bushy shrub with distinctive colored flowers
        const bush = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), leafMat);
        bush.position.y = 0.4;
        bush.scale.set(1.1, 0.85, 1.1);
        foliageGroup.add(bush);

        // Flower blooms
        const flowerMat = new THREE.MeshLambertMaterial({
          color: leaf.flowerColor || '#ffffff',
        });
        for (let fl = 0; fl < 5; fl++) {
          const flAngle = (fl * Math.PI * 2) / 5;
          const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08, 0), flowerMat);
          flower.position.set(
            Math.cos(flAngle) * 0.32,
            0.52,
            Math.sin(flAngle) * 0.32
          );
          foliageGroup.add(flower);
        }
      } else if (leaf.plantStyle === 'basil') {
        // Sacred Basil / Tulasi plant structure
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.04, 0.65, 6),
          new THREE.MeshLambertMaterial({ color: '#78350f' })
        );
        stem.position.y = 0.32;
        foliageGroup.add(stem);

        for (let t = 0; t < 3; t++) {
          const tier = new THREE.Mesh(new THREE.SphereGeometry(0.24 - t * 0.04, 7, 7), leafMat);
          tier.position.y = 0.28 + t * 0.16;
          foliageGroup.add(tier);
        }
      } else if (leaf.plantStyle === 'slender') {
        // Delicate pinnate / needle foliage (Shami / Devadaru)
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.06, 0.8, 6),
          this.matTreeTrunk
        );
        stem.position.y = 0.4;
        foliageGroup.add(stem);

        const pine = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 8), leafMat);
        pine.position.y = 0.65;
        foliageGroup.add(pine);
      } else {
        // Broad Leaf / Shrub foliage (Bilva trifoliate, Arjuna, Ashwattha)
        const shrub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.44, 1), leafMat);
        shrub.position.y = 0.45;
        foliageGroup.add(shrub);
      }

      plantGroup.add(foliageGroup);

      // Hovering subtle indicator icon / particle beacon above uncollected plant
      const markerGeo = new THREE.OctahedronGeometry(0.12, 0);
      const markerMat = new THREE.MeshBasicMaterial({
        color: leaf.id === 'durva' ? '#facc15' : '#86efac',
      });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.y = 1.05;
      plantGroup.add(markerMesh);

      this.group.add(plantGroup);

      const node: ForestPlantNode = {
        leafInfo: leaf,
        worldPosition: worldPos,
        group: plantGroup,
        markerMesh,
        foliageGroup,
        isHarvested: false,
      };

      this.plantNodes.set(leaf.id, node);
    });
  }

  /**
   * 6. Floating environmental particles (Golden light motes & drifting pollen)
   */
  private initEnvironmentalParticles(): void {
    const center = this.clearingCenter;
    for (let i = 0; i < this.particleCount; i++) {
      this.particlePositions[i * 3 + 0] = center.x + (Math.random() - 0.5) * 36;
      this.particlePositions[i * 3 + 1] = 0.8 + Math.random() * 6.5;
      this.particlePositions[i * 3 + 2] = center.z + (Math.random() - 0.5) * 36;
    }
    this.particlePoints.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.particlePositions, 3)
    );
    this.group.add(this.particlePoints);
  }

  /**
   * Update visual paper bag fill level based on collected count (0 to 21)
   */
  public updateBagFill(collectedCount: number, totalLeaves: number = 21): void {
    const ratio = Math.min(1.0, collectedCount / totalLeaves);

    // Enable progressive leaf tiers
    const tiersToShow = Math.floor(ratio * this.bagLeafLayers.length);
    this.bagLeafLayers.forEach((layer, idx) => {
      layer.visible = idx <= tiersToShow && collectedCount > 0;
      // Slight swell as it gets packed
      const scale = 0.8 + 0.25 * ratio;
      layer.scale.set(scale, scale, scale);
    });

    // Crown garland appears at full 21/21
    if (collectedCount >= totalLeaves) {
      this.bagMarigoldCrown.visible = true;
      this.bagGlowRing.scale.set(1.25, 1.25, 1.25);
    } else {
      this.bagMarigoldCrown.visible = false;
      this.bagGlowRing.scale.set(1.0, 1.0, 1.0);
    }
  }

  /**
   * Mark a specific plant as harvested
   */
  public harvestPlant(leafId: string): void {
    const node = this.plantNodes.get(leafId);
    if (!node || node.isHarvested) return;

    node.isHarvested = true;
    node.leafInfo.isCollected = true;
    node.markerMesh.visible = false;

    // Gentle harvest visual state: scale down foliage to indicate harvested leaves
    node.foliageGroup.scale.set(0.65, 0.65, 0.65);
  }

  /**
   * Reset all plant nodes to unharvested state for Level 1 replay
   */
  public resetLeafPlants(): void {
    this.plantNodes.forEach((node) => {
      node.isHarvested = false;
      node.leafInfo.isCollected = false;
      node.markerMesh.visible = true;
      node.foliageGroup.scale.set(1.0, 1.0, 1.0);
    });
    this.updateBagFill(0, 21);
  }

  /**
   * Frame update for environmental particles & plant markers
   */
  public update(delta: number): void {
    const now = Date.now();

    // Pulse plant markers
    this.plantNodes.forEach((node) => {
      if (!node.isHarvested) {
        node.markerMesh.rotation.y += delta * 2.5;
        node.markerMesh.position.y =
          1.05 + Math.sin(now * 0.004 + node.worldPosition.x) * 0.08;
      }
    });

    // Rotate Altar glow ring
    this.bagGlowRing.rotation.z += delta * 0.4;

    // Drift particles
    const positions = this.particlePoints.geometry.attributes.position.array as Float32Array;
    const center = this.clearingCenter;

    for (let i = 0; i < this.particleCount; i++) {
      let y = positions[i * 3 + 1];
      y -= delta * 0.25;
      if (y < 0.4) {
        y = 6.0;
        positions[i * 3 + 0] = center.x + (Math.random() - 0.5) * 32;
        positions[i * 3 + 2] = center.z + (Math.random() - 0.5) * 32;
      }
      positions[i * 3 + 1] = y;
      positions[i * 3 + 0] += Math.sin(now * 0.001 + i) * delta * 0.15;
    }
    this.particlePoints.geometry.attributes.position.needsUpdate = true;
  }

  public dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
