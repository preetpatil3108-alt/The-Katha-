/**
 * THE KATHA - Village Houses Builder
 *
 * Populates Rangastalam with authentic, varied traditional Indian village homes:
 * - Architectural variations in Shape, Size, Roof, Walls, Courtyards, Doors, Windows, Props
 * - Thinnai verandahs with carved teak pillars, Tulasi Kota (holy basil altar), charpai cots,
 *   earthen water matkas, hanging brass bells, toranam mango leaves, rangoli thresholds
 * - EVERY SINGLE HOUSE is equipped with a physically mounted Indian National Flag
 *   attached to a flagpole with natural real-time cloth-wave wind animation!
 */

import * as THREE from 'three';
import { CollisionSystem } from '../collisions/CollisionSystem';
import { IndianFlagSystem } from './IndianFlagSystem';

export interface HouseConfig {
  id: string;
  name: string;
  pos: THREE.Vector3;
  rotY: number;
  type: 'ancestral_thinnai' | 'l_shaped' | 'pyramid_cottage' | 'double_storey' | 'potter_artisan' | 'terraced_flat';
  wallMat: THREE.MeshStandardMaterial;
  width: number;
  depth: number;
  height: number;
  hasTulasiKota?: boolean;
  hasCharpai?: boolean;
  hasMatkas?: boolean;
  hasRangoli?: boolean;
  flagMount: {
    offset: THREE.Vector3;
    rotY?: number;
    tiltZ?: number;
    scale?: number;
  };
}

export class VillageHouses {
  public group: THREE.Group = new THREE.Group();
  private collisionSystem: CollisionSystem;
  private flagSystem: IndianFlagSystem;

  // Shared Materials
  private matKaaviBase = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.8 }); // Traditional brick-red skirting band
  private matTerracottaRoof = new THREE.MeshStandardMaterial({ color: '#c2410c', roughness: 0.7 }); // Clay roof tiles
  private matTerracottaRidge = new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.65 });
  private matTeakWood = new THREE.MeshStandardMaterial({ color: '#573318', roughness: 0.6 });
  private matPolishedTeak = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.45 });
  private matBamboo = new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.5 });
  private matStonePlinth = new THREE.MeshStandardMaterial({ color: '#78716c', roughness: 0.85 });
  private matBrass = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.35, metalness: 0.75 });
  private matMangoLeaf = new THREE.MeshStandardMaterial({ color: '#65a30d', roughness: 0.6 });
  private matTulasiLeaves = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.55 });
  private matCharpaiRope = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.9 });
  private matEarthenClay = new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.8 });
  private matChiliRed = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.6 });
  private matWindowTeal = new THREE.MeshStandardMaterial({ color: '#0d9488', roughness: 0.5 });
  private matWindowIndigo = new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.5 });

  // Diverse Wall Materials
  private matWallLimeWhite = new THREE.MeshStandardMaterial({ color: '#fffbeb', roughness: 0.85 });
  private matWallOchreYellow = new THREE.MeshStandardMaterial({ color: '#fde68a', roughness: 0.8 });
  private matWallPeachTerracotta = new THREE.MeshStandardMaterial({ color: '#fed7aa', roughness: 0.8 });
  private matWallWarmClay = new THREE.MeshStandardMaterial({ color: '#fed1a3', roughness: 0.82 });
  private matWallPalePista = new THREE.MeshStandardMaterial({ color: '#f0fdf4', roughness: 0.85 });

  constructor(collisionSystem: CollisionSystem, flagSystem: IndianFlagSystem) {
    this.collisionSystem = collisionSystem;
    this.flagSystem = flagSystem;
    this.group.name = 'village_houses_group';
  }

  public build(): void {
    const houseConfigs: HouseConfig[] = [
      // 1. Village Elder Subbarao's Ancestral Thinnai House (West Residential Lane)
      {
        id: 'house_elder_thinnai',
        name: "Elder's Ancestral Thinnai House",
        pos: new THREE.Vector3(-34, 0, 3),
        rotY: 0.22,
        type: 'ancestral_thinnai',
        wallMat: this.matWallLimeWhite,
        width: 10.5,
        depth: 8.5,
        height: 5.0,
        hasTulasiKota: true,
        hasCharpai: true,
        hasRangoli: true,
        flagMount: { offset: new THREE.Vector3(-2.8, 4.4, 5.2), rotY: 0.1, tiltZ: 0.08, scale: 1.1 },
      },
      // 2. Weaver & Artisan's L-Shaped Courtyard Home (South-West)
      {
        id: 'house_weaver_l',
        name: "Weaver's Courtyard Home",
        pos: new THREE.Vector3(-28, 0, 26),
        rotY: -0.3,
        type: 'l_shaped',
        wallMat: this.matWallOchreYellow,
        width: 9.0,
        depth: 8.0,
        height: 4.4,
        hasCharpai: true,
        hasMatkas: true,
        flagMount: { offset: new THREE.Vector3(2.5, 4.6, 4.5), rotY: -0.2, tiltZ: -0.06, scale: 1.0 },
      },
      // 3. North-West Pyramid Roof Cottage
      {
        id: 'house_nw_cottage',
        name: 'North-West Village Cottage',
        pos: new THREE.Vector3(-28, 0, -22),
        rotY: 0.45,
        type: 'pyramid_cottage',
        wallMat: this.matWallPeachTerracotta,
        width: 8.4,
        depth: 7.6,
        height: 4.5,
        hasTulasiKota: true,
        hasRangoli: true,
        flagMount: { offset: new THREE.Vector3(0, 4.2, 4.2), rotY: 0.3, tiltZ: 0.05, scale: 1.0 },
      },
      // 4. Double-Storey Village Haveli (West Outer Compound)
      {
        id: 'house_west_haveli',
        name: 'Two-Tier Village Haveli',
        pos: new THREE.Vector3(-44, 0, -14),
        rotY: 0.15,
        type: 'double_storey',
        wallMat: this.matWallLimeWhite,
        width: 11.0,
        depth: 9.5,
        height: 6.8,
        hasTulasiKota: true,
        hasMatkas: true,
        flagMount: { offset: new THREE.Vector3(3.2, 6.7, 5.0), rotY: 0.2, scale: 1.15 },
      },
      // 5. Potter's Cottage with Outdoor Matkas & Clay Vessels (South-West Outer)
      {
        id: 'house_potter_cottage',
        name: "Potter's Workshop Cottage",
        pos: new THREE.Vector3(-24, 0, 42),
        rotY: -0.4,
        type: 'potter_artisan',
        wallMat: this.matWallWarmClay,
        width: 8.0,
        depth: 6.8,
        height: 4.0,
        hasMatkas: true,
        flagMount: { offset: new THREE.Vector3(-2.2, 3.8, 3.8), rotY: -0.3, scale: 0.95 },
      },
      // 6. Sculptor & Artisan Gopal's Ancestral Home (East Lane)
      {
        id: 'house_artisan_gopal',
        name: "Sculptor's Thinnai House",
        pos: new THREE.Vector3(34, 0, 3),
        rotY: -0.25,
        type: 'ancestral_thinnai',
        wallMat: this.matWallOchreYellow,
        width: 10.0,
        depth: 8.2,
        height: 4.8,
        hasTulasiKota: true,
        hasCharpai: true,
        hasRangoli: true,
        flagMount: { offset: new THREE.Vector3(2.6, 4.3, 4.8), rotY: -0.15, scale: 1.05 },
      },
      // 7. Terraced Rooftop Home with Clay Urns (South-East Lane)
      {
        id: 'house_terrace_se',
        name: 'Terraced Village Home',
        pos: new THREE.Vector3(24, 0, 42),
        rotY: 0.32,
        type: 'terraced_flat',
        wallMat: this.matWallPeachTerracotta,
        width: 8.8,
        depth: 7.8,
        height: 4.6,
        hasMatkas: true,
        flagMount: { offset: new THREE.Vector3(1.8, 4.8, 3.8), rotY: 0.2, scale: 1.0 },
      },
      // 8. North-East Gable Cottage (Towards Forest Lane)
      {
        id: 'house_ne_gable',
        name: 'North-East Gable Cottage',
        pos: new THREE.Vector3(28, 0, -22),
        rotY: -0.42,
        type: 'pyramid_cottage',
        wallMat: this.matWallPalePista,
        width: 8.2,
        depth: 7.2,
        height: 4.4,
        hasTulasiKota: true,
        hasRangoli: true,
        flagMount: { offset: new THREE.Vector3(0, 4.2, 4.0), rotY: -0.35, scale: 1.0 },
      },
      // 9. East Two-Storey Village Residence
      {
        id: 'house_east_haveli',
        name: 'East Two-Storey Residence',
        pos: new THREE.Vector3(44, 0, -14),
        rotY: -0.18,
        type: 'double_storey',
        wallMat: this.matWallLimeWhite,
        width: 10.8,
        depth: 9.0,
        height: 6.6,
        hasCharpai: true,
        hasRangoli: true,
        flagMount: { offset: new THREE.Vector3(-3.0, 6.5, 4.8), rotY: -0.1, scale: 1.15 },
      },
      // 10. South-East Farmer's L-Shaped Cottage
      {
        id: 'house_farmer_se',
        name: "Farmer's L-Shaped Home",
        pos: new THREE.Vector3(28, 0, 26),
        rotY: 0.38,
        type: 'l_shaped',
        wallMat: this.matWallWarmClay,
        width: 8.6,
        depth: 7.4,
        height: 4.2,
        hasMatkas: true,
        flagMount: { offset: new THREE.Vector3(-2.4, 4.4, 4.2), rotY: 0.3, scale: 1.0 },
      },
      // 11. Entrance Avenue Flank West (Immediately past the entrance archway)
      {
        id: 'house_entrance_west',
        name: 'Entrance Avenue West Cottage',
        pos: new THREE.Vector3(-17.5, 0, 16),
        rotY: 0.18,
        type: 'pyramid_cottage',
        wallMat: this.matWallPeachTerracotta,
        width: 7.4,
        depth: 6.4,
        height: 4.1,
        hasRangoli: true,
        flagMount: { offset: new THREE.Vector3(1.6, 4.0, 3.6), rotY: 0.15, tiltZ: 0.08, scale: 1.0 },
      },
      // 12. Entrance Avenue Flank East (Immediately past the entrance archway)
      {
        id: 'house_entrance_east',
        name: 'Entrance Avenue East Cottage',
        pos: new THREE.Vector3(17.5, 0, 16),
        rotY: -0.18,
        type: 'pyramid_cottage',
        wallMat: this.matWallLimeWhite,
        width: 7.4,
        depth: 6.4,
        height: 4.1,
        hasRangoli: true,
        flagMount: { offset: new THREE.Vector3(-1.6, 4.0, 3.6), rotY: -0.15, tiltZ: -0.08, scale: 1.0 },
      },
      // 13. South-West Boundary Home
      {
        id: 'house_sw_outer',
        name: 'South-West Lane Residence',
        pos: new THREE.Vector3(-38, 0, 36),
        rotY: -0.22,
        type: 'ancestral_thinnai',
        wallMat: this.matWallOchreYellow,
        width: 8.8,
        depth: 7.2,
        height: 4.3,
        hasCharpai: true,
        flagMount: { offset: new THREE.Vector3(2.2, 4.2, 4.2), rotY: -0.2, scale: 0.95 },
      },
      // 14. South-East Boundary Home
      {
        id: 'house_se_outer',
        name: 'South-East Lane Residence',
        pos: new THREE.Vector3(38, 0, 36),
        rotY: 0.22,
        type: 'ancestral_thinnai',
        wallMat: this.matWallLimeWhite,
        width: 8.8,
        depth: 7.2,
        height: 4.3,
        hasMatkas: true,
        flagMount: { offset: new THREE.Vector3(-2.2, 4.2, 4.2), rotY: 0.2, scale: 0.95 },
      },
      // 15. North Transition Homestead (Overlooking open countryside toward forest)
      {
        id: 'house_forest_gate',
        name: 'North Transition Homestead',
        pos: new THREE.Vector3(16, 0, -32),
        rotY: -0.38,
        type: 'pyramid_cottage',
        wallMat: this.matWallWarmClay,
        width: 7.6,
        depth: 6.6,
        height: 4.2,
        hasTulasiKota: true,
        flagMount: { offset: new THREE.Vector3(1.8, 4.1, 3.7), rotY: -0.3, scale: 1.0 },
      },
      // 16. North-West Outer Boundary Home
      {
        id: 'house_banyan_cottage',
        name: 'North-West Boundary Cottage',
        pos: new THREE.Vector3(-38, 0, -26),
        rotY: 0.35,
        type: 'terraced_flat',
        wallMat: this.matWallLimeWhite,
        width: 8.0,
        depth: 7.0,
        height: 4.3,
        hasTulasiKota: true,
        hasRangoli: true,
        flagMount: { offset: new THREE.Vector3(-1.8, 4.4, 3.7), rotY: 0.3, scale: 1.0 },
      },
      // 17. Far North-East Village Boundary Home
      {
        id: 'house_ne_boundary',
        name: 'North-East Boundary Home',
        pos: new THREE.Vector3(38, 0, -26),
        rotY: -0.45,
        type: 'ancestral_thinnai',
        wallMat: this.matWallPeachTerracotta,
        width: 8.5,
        depth: 7.5,
        height: 4.4,
        hasCharpai: true,
        flagMount: { offset: new THREE.Vector3(2.0, 4.2, 4.2), rotY: -0.4, scale: 0.95 },
      },
      // 18. Far West Boundary Homestead
      {
        id: 'house_west_outer',
        name: 'West Village Homestead',
        pos: new THREE.Vector3(-46, 0, 6),
        rotY: 0.1,
        type: 'l_shaped',
        wallMat: this.matWallOchreYellow,
        width: 9.0,
        depth: 7.5,
        height: 4.2,
        hasMatkas: true,
        flagMount: { offset: new THREE.Vector3(2.2, 4.3, 4.2), rotY: 0.1, scale: 1.0 },
      },
      // 19. Far East Boundary Homestead
      {
        id: 'house_east_outer',
        name: 'East Village Homestead',
        pos: new THREE.Vector3(46, 0, 6),
        rotY: -0.1,
        type: 'potter_artisan',
        wallMat: this.matWallWarmClay,
        width: 8.5,
        depth: 7.0,
        height: 4.1,
        hasCharpai: true,
        flagMount: { offset: new THREE.Vector3(-2.0, 4.0, 3.8), rotY: -0.1, scale: 1.0 },
      },
    ];

    houseConfigs.forEach(cfg => {
      this.createHouse(cfg);
    });

    // Build lived-in rural enclosures, community well, utility poles, and agricultural elements
    this.buildVillageLivedInElements();
  }

  /**
   * Constructs an individual authentic village home and attaches its animated Indian Flag
   */
  private createHouse(cfg: HouseConfig): void {
    const houseGroup = new THREE.Group();
    houseGroup.position.copy(cfg.pos);
    houseGroup.rotation.y = cfg.rotY;

    // 1. Raised Stone Plinth / Jagati (Traditional Indian plinth protecting from monsoon rain)
    const plinthH = 0.45;
    const plinthGeo = new THREE.BoxGeometry(cfg.width + 0.8, plinthH, cfg.depth + 1.6);
    const plinth = new THREE.Mesh(plinthGeo, this.matStonePlinth);
    plinth.position.set(0, plinthH / 2, 0.4);
    plinth.receiveShadow = true;
    houseGroup.add(plinth);

    // 2. Brick-Red Kaavi Skirting along base
    const baseGeo = new THREE.BoxGeometry(cfg.width + 0.1, 0.4, cfg.depth + 0.1);
    const baseMesh = new THREE.Mesh(baseGeo, this.matKaaviBase);
    baseMesh.position.set(0, plinthH + 0.2, 0);
    houseGroup.add(baseMesh);

    // 3. Main House Structure based on Architectural Type
    switch (cfg.type) {
      case 'ancestral_thinnai':
        this.buildAncestralThinnaiStructure(houseGroup, cfg, plinthH);
        break;
      case 'l_shaped':
        this.buildLShapedStructure(houseGroup, cfg, plinthH);
        break;
      case 'double_storey':
        this.buildDoubleStoreyStructure(houseGroup, cfg, plinthH);
        break;
      case 'potter_artisan':
        this.buildPotterArtisanStructure(houseGroup, cfg, plinthH);
        break;
      case 'terraced_flat':
        this.buildTerracedStructure(houseGroup, cfg, plinthH);
        break;
      case 'pyramid_cottage':
      default:
        this.buildPyramidCottageStructure(houseGroup, cfg, plinthH);
        break;
    }

    // 4. Teak Doorway with Brass Hardware & Mango Leaf Toranam
    const doorW = 1.4;
    const doorH = 2.5;
    const doorZ = cfg.depth / 2 + 0.06;

    // Carved door frame
    const frameGeo = new THREE.BoxGeometry(doorW + 0.3, doorH + 0.25, 0.15);
    const frame = new THREE.Mesh(frameGeo, this.matPolishedTeak);
    frame.position.set(0, plinthH + doorH / 2 + 0.1, doorZ);
    houseGroup.add(frame);

    // Teak Double Leaf Door Panels
    const doorGeo = new THREE.BoxGeometry(doorW, doorH, 0.08);
    const door = new THREE.Mesh(doorGeo, this.matTeakWood);
    door.position.set(0, plinthH + doorH / 2 + 0.1, doorZ + 0.05);
    houseGroup.add(door);

    // Brass Door Knocker / Bell
    const knocker = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 12), this.matBrass);
    knocker.position.set(0.2, plinthH + 1.4, doorZ + 0.1);
    houseGroup.add(knocker);

    // Mango-leaf Auspicious Toranam Garland strung across top lintel
    for (let l = 0; l < 7; l++) {
      const leafGeo = new THREE.ConeGeometry(0.08, 0.28, 4);
      const leaf = new THREE.Mesh(leafGeo, this.matMangoLeaf);
      leaf.position.set(-doorW / 2 + (l / 6) * doorW, plinthH + doorH + 0.08, doorZ + 0.1);
      leaf.rotation.z = Math.PI;
      houseGroup.add(leaf);
    }

    // 5. Windows with Shutters & Iron/Wooden Bars
    this.createWindows(houseGroup, cfg, plinthH);

    // 6. Courtyard Accessories & Indian Village Props
    if (cfg.hasTulasiKota) {
      this.createTulasiKota(houseGroup, cfg.width, cfg.depth);
    }

    if (cfg.hasCharpai) {
      this.createCharpai(houseGroup, cfg.depth);
    }

    if (cfg.hasMatkas) {
      this.createMatkas(houseGroup, cfg.depth);
    }

    if (cfg.hasRangoli) {
      this.createRangoli(houseGroup, cfg.depth);
    }

    // 7. EVERY HOUSE GETS AN INDIAN NATIONAL FLAG DISPLAYED OUTSIDE!
    // Physically mounted to pole with continuous natural cloth wind wave animation
    const worldPos = cfg.pos.clone().add(
      cfg.flagMount.offset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), cfg.rotY)
    );
    const flagYRot = cfg.rotY + (cfg.flagMount.rotY || 0);

    this.flagSystem.createFlagAt({
      position: worldPos,
      rotationY: flagYRot,
      tiltZ: cfg.flagMount.tiltZ || 0,
      scale: cfg.flagMount.scale || 1.0,
      mountType: 'wall',
    });

    this.group.add(houseGroup);

    // 8. Register Solid Box Collider for movement navigation
    this.collisionSystem.addCollider({
      id: cfg.id,
      type: 'box',
      position: new THREE.Vector3(cfg.pos.x, cfg.height / 2, cfg.pos.z),
      size: new THREE.Vector3(cfg.width + 1.2, cfg.height + 2.0, cfg.depth + 1.4),
      rotationY: cfg.rotY,
    });
  }

  /**
   * Style 1: Ancestral Thinnai House (Gable roof, wide verandah with carved pillars)
   */
  private buildAncestralThinnaiStructure(houseGroup: THREE.Group, cfg: HouseConfig, plinthH: number): void {
    // Main walls
    const wallGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
    const walls = new THREE.Mesh(wallGeo, cfg.wallMat);
    walls.position.y = plinthH + cfg.height / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    houseGroup.add(walls);

    // Double Pitched / Gable Terracotta Tiled Roof
    const roofOverhang = 1.0;
    const roofW = cfg.width + roofOverhang * 2;
    const roofD = cfg.depth + roofOverhang * 2;
    const roofH = 2.4;

    const roofGeo = new THREE.ConeGeometry(Math.max(roofW, roofD) * 0.72, roofH, 4);
    const roof = new THREE.Mesh(roofGeo, this.matTerracottaRoof);
    roof.position.y = plinthH + cfg.height + roofH / 2;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);

    // Decorative Terracotta Ridge Cap
    const ridgeGeo = new THREE.CylinderGeometry(0.18, 0.18, roofW * 0.75, 8);
    const ridge = new THREE.Mesh(ridgeGeo, this.matTerracottaRidge);
    ridge.rotation.z = Math.PI / 2;
    ridge.position.y = plinthH + cfg.height + roofH + 0.05;
    houseGroup.add(ridge);

    // Wide Thinnai Verandah (Covered porch where elders gather)
    const porchDepth = 2.4;
    const porchWidth = cfg.width * 0.85;
    const porchRoofGeo = new THREE.BoxGeometry(porchWidth, 0.22, porchDepth);
    const porchRoof = new THREE.Mesh(porchRoofGeo, this.matTerracottaRoof);
    porchRoof.position.set(0, plinthH + 3.3, cfg.depth / 2 + porchDepth / 2);
    porchRoof.rotation.x = 0.12;
    porchRoof.castShadow = true;
    houseGroup.add(porchRoof);

    // Four Carved Teak Verandah Pillars
    const colCount = 4;
    for (let c = 0; c < colCount; c++) {
      const colX = -porchWidth / 2 + 0.4 + (c / (colCount - 1)) * (porchWidth - 0.8);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 3.2, 8), this.matTeakWood);
      post.position.set(colX, plinthH + 1.6, cfg.depth / 2 + porchDepth - 0.3);
      post.castShadow = true;
      houseGroup.add(post);

      // Carved Bodikai / Bracket Capital
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.35), this.matTeakWood);
      bracket.position.set(colX, plinthH + 3.1, cfg.depth / 2 + porchDepth - 0.3);
      houseGroup.add(bracket);
    }
  }

  /**
   * Style 2: L-Shaped Courtyard Home
   */
  private buildLShapedStructure(houseGroup: THREE.Group, cfg: HouseConfig, plinthH: number): void {
    // Main Wing
    const mainW = cfg.width;
    const mainD = cfg.depth * 0.6;
    const mainWalls = new THREE.Mesh(new THREE.BoxGeometry(mainW, cfg.height, mainD), cfg.wallMat);
    mainWalls.position.set(0, plinthH + cfg.height / 2, -cfg.depth * 0.2);
    mainWalls.castShadow = true;
    houseGroup.add(mainWalls);

    // Side Wing forming "L"
    const sideW = cfg.width * 0.45;
    const sideD = cfg.depth * 0.55;
    const sideWalls = new THREE.Mesh(new THREE.BoxGeometry(sideW, cfg.height * 0.9, sideD), cfg.wallMat);
    sideWalls.position.set(-cfg.width / 2 + sideW / 2, plinthH + (cfg.height * 0.9) / 2, cfg.depth * 0.25);
    sideWalls.castShadow = true;
    houseGroup.add(sideWalls);

    // Terracotta Hip Roof Main
    const roof1 = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(mainW, mainD) * 0.72, 2.2, 4),
      this.matTerracottaRoof
    );
    roof1.position.set(0, plinthH + cfg.height + 1.1, -cfg.depth * 0.2);
    roof1.rotation.y = Math.PI / 4;
    roof1.castShadow = true;
    houseGroup.add(roof1);

    // Side Wing Roof
    const roof2 = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(sideW, sideD) * 0.8, 1.8, 4),
      this.matTerracottaRoof
    );
    roof2.position.set(-cfg.width / 2 + sideW / 2, plinthH + cfg.height * 0.9 + 0.9, cfg.depth * 0.25);
    roof2.rotation.y = Math.PI / 4;
    roof2.castShadow = true;
    houseGroup.add(roof2);

    // Sheltered Courtyard Awning in inner corner
    const awning = new THREE.Mesh(new THREE.BoxGeometry(cfg.width * 0.45, 0.18, 1.8), this.matTerracottaRoof);
    awning.position.set(cfg.width * 0.22, plinthH + 3.0, cfg.depth * 0.15);
    awning.rotation.x = 0.15;
    houseGroup.add(awning);

    // Awning Bamboo Posts
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.9, 6), this.matBamboo);
    post.position.set(cfg.width * 0.4, plinthH + 1.45, cfg.depth * 0.15 + 0.8);
    houseGroup.add(post);
  }

  /**
   * Style 3: Pyramid Cottage with compact, symmetrical hip roof
   */
  private buildPyramidCottageStructure(houseGroup: THREE.Group, cfg: HouseConfig, plinthH: number): void {
    const wallGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
    const walls = new THREE.Mesh(wallGeo, cfg.wallMat);
    walls.position.y = plinthH + cfg.height / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    houseGroup.add(walls);

    // Symmetrical 4-sided Pyramid Roof
    const roofH = 2.4;
    const roofGeo = new THREE.ConeGeometry(Math.max(cfg.width, cfg.depth) * 0.74, roofH, 4);
    const roof = new THREE.Mesh(roofGeo, this.matTerracottaRoof);
    roof.position.y = plinthH + cfg.height + roofH / 2;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);

    // Brass Kalasham Top Finial
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), this.matBrass);
    finial.position.y = plinthH + cfg.height + roofH + 0.25;
    houseGroup.add(finial);

    // Compact Front Porch
    const porchDepth = 1.8;
    const porchW = cfg.width * 0.65;
    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(porchW, 0.18, porchDepth), this.matTerracottaRoof);
    porchRoof.position.set(0, plinthH + 3.1, cfg.depth / 2 + porchDepth / 2);
    porchRoof.rotation.x = 0.15;
    houseGroup.add(porchRoof);

    [-porchW / 2 + 0.2, porchW / 2 - 0.2].forEach(px => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.9, 8), this.matTeakWood);
      p.position.set(px, plinthH + 1.45, cfg.depth / 2 + porchDepth - 0.2);
      houseGroup.add(p);
    });
  }

  /**
   * Style 4: Double-Storey Village Haveli (Two tiers, wooden balcony, grand scale)
   */
  private buildDoubleStoreyStructure(houseGroup: THREE.Group, cfg: HouseConfig, plinthH: number): void {
    const tier1H = cfg.height * 0.54;
    const tier2H = cfg.height * 0.46;

    // Ground floor walls
    const groundWalls = new THREE.Mesh(new THREE.BoxGeometry(cfg.width, tier1H, cfg.depth), cfg.wallMat);
    groundWalls.position.y = plinthH + tier1H / 2;
    groundWalls.castShadow = true;
    houseGroup.add(groundWalls);

    // Wooden Balcony Intermediate Cornice
    const corniceGeo = new THREE.BoxGeometry(cfg.width + 0.8, 0.25, cfg.depth + 0.8);
    const cornice = new THREE.Mesh(corniceGeo, this.matPolishedTeak);
    cornice.position.y = plinthH + tier1H;
    houseGroup.add(cornice);

    // Second floor walls (subtly recessed)
    const upperW = cfg.width - 0.6;
    const upperD = cfg.depth - 0.6;
    const upperWalls = new THREE.Mesh(new THREE.BoxGeometry(upperW, tier2H, upperD), cfg.wallMat);
    upperWalls.position.y = plinthH + tier1H + tier2H / 2;
    upperWalls.castShadow = true;
    houseGroup.add(upperWalls);

    // Projecting Wooden Balcony in front
    const balcW = cfg.width * 0.6;
    const balcD = 1.4;
    const balconyFloor = new THREE.Mesh(new THREE.BoxGeometry(balcW, 0.15, balcD), this.matTeakWood);
    balconyFloor.position.set(0, plinthH + tier1H, cfg.depth / 2 + balcD / 2 - 0.2);
    houseGroup.add(balconyFloor);

    // Balcony Wooden Balustrade Railing
    const railGeo = new THREE.BoxGeometry(balcW, 0.8, 0.08);
    const rail = new THREE.Mesh(railGeo, this.matTeakWood);
    rail.position.set(0, plinthH + tier1H + 0.45, cfg.depth / 2 + balcD - 0.2);
    houseGroup.add(rail);

    // Upper Roof
    const roofH = 2.4;
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(upperW, upperD) * 0.74, roofH, 4),
      this.matTerracottaRoof
    );
    roof.position.y = plinthH + cfg.height + roofH / 2;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);
  }

  /**
   * Style 5: Potter / Artisan Workshop (Low asymmetric roof, exposed drying racks)
   */
  private buildPotterArtisanStructure(houseGroup: THREE.Group, cfg: HouseConfig, plinthH: number): void {
    const wallGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
    const walls = new THREE.Mesh(wallGeo, cfg.wallMat);
    walls.position.y = plinthH + cfg.height / 2;
    walls.castShadow = true;
    houseGroup.add(walls);

    // Asymmetric Pitched Tile Roof with long extended front overhang
    const roofH = 2.0;
    const roofGeo = new THREE.ConeGeometry(Math.max(cfg.width, cfg.depth) * 0.75, roofH, 4);
    const roof = new THREE.Mesh(roofGeo, this.matTerracottaRoof);
    roof.position.set(0, plinthH + cfg.height + roofH / 2, 0.4);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);

    // Extended Pottery Workshop Shed
    const shedW = cfg.width * 0.7;
    const shedD = 2.6;
    const shedRoof = new THREE.Mesh(new THREE.BoxGeometry(shedW, 0.16, shedD), this.matTerracottaRoof);
    shedRoof.position.set(0, plinthH + 2.8, cfg.depth / 2 + shedD / 2);
    shedRoof.rotation.x = 0.2;
    houseGroup.add(shedRoof);

    // Rustic bamboo poles
    [-shedW / 2 + 0.3, shedW / 2 - 0.3].forEach(bx => {
      const bPost = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.6, 6), this.matBamboo);
      bPost.position.set(bx, plinthH + 1.3, cfg.depth / 2 + shedD - 0.2);
      houseGroup.add(bPost);
    });

    // Drying strings of red chilies hanging under shed eave
    for (let c = 0; c < 6; c++) {
      const chili = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.45, 6), this.matChiliRed);
      chili.rotation.x = Math.PI;
      chili.position.set(-shedW / 2 + 0.6 + c * 0.4, plinthH + 2.4, cfg.depth / 2 + 0.4);
      houseGroup.add(chili);
    }
  }

  /**
   * Style 6: Flat Terraced Roof with parapet & clay urns
   */
  private buildTerracedStructure(houseGroup: THREE.Group, cfg: HouseConfig, plinthH: number): void {
    const wallGeo = new THREE.BoxGeometry(cfg.width, cfg.height, cfg.depth);
    const walls = new THREE.Mesh(wallGeo, cfg.wallMat);
    walls.position.y = plinthH + cfg.height / 2;
    walls.castShadow = true;
    houseGroup.add(walls);

    // Terraced Flat Roof Slab
    const slabGeo = new THREE.BoxGeometry(cfg.width + 0.4, 0.25, cfg.depth + 0.4);
    const slab = new THREE.Mesh(slabGeo, this.matTerracottaRidge);
    slab.position.y = plinthH + cfg.height;
    houseGroup.add(slab);

    // Low Roof Parapet Boundary Wall
    const parapetH = 0.7;
    const pFront = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.4, parapetH, 0.2), cfg.wallMat);
    pFront.position.set(0, plinthH + cfg.height + parapetH / 2, cfg.depth / 2 + 0.1);
    houseGroup.add(pFront);

    const pBack = new THREE.Mesh(new THREE.BoxGeometry(cfg.width + 0.4, parapetH, 0.2), cfg.wallMat);
    pBack.position.set(0, plinthH + cfg.height + parapetH / 2, -cfg.depth / 2 - 0.1);
    houseGroup.add(pBack);

    // Clay Pots / Urns resting on terrace parapet corners
    [-cfg.width / 2 + 0.3, cfg.width / 2 - 0.3].forEach(px => {
      const urn = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), this.matEarthenClay);
      urn.position.set(px, plinthH + cfg.height + parapetH + 0.28, cfg.depth / 2 + 0.1);
      houseGroup.add(urn);
    });
  }

  /**
   * Barred wooden windows with authentic painted shutters
   */
  private createWindows(houseGroup: THREE.Group, cfg: HouseConfig, plinthH: number): void {
    const winMat = cfg.id.includes('gopal') || cfg.id.includes('weaver') ? this.matWindowTeal : this.matWindowIndigo;
    const winW = 1.1;
    const winH = 1.3;
    const winY = plinthH + cfg.height * 0.52;

    // Left and Right front windows
    [-cfg.width * 0.3, cfg.width * 0.3].forEach(wx => {
      const winFrame = new THREE.Mesh(new THREE.BoxGeometry(winW, winH, 0.1), this.matTeakWood);
      winFrame.position.set(wx, winY, cfg.depth / 2 + 0.06);
      houseGroup.add(winFrame);

      // Iron / wooden security bars
      for (let b = 0; b < 3; b++) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, winH - 0.1, 6), this.matPolishedTeak);
        bar.position.set(wx - 0.3 + b * 0.3, winY, cfg.depth / 2 + 0.09);
        houseGroup.add(bar);
      }

      // Angled Open Wooden Shutters
      [-0.55, 0.55].forEach((sx, sIdx) => {
        const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.4, winH - 0.05, 0.04), winMat);
        shutter.position.set(wx + sx, winY, cfg.depth / 2 + 0.14);
        shutter.rotation.y = sIdx === 0 ? -0.45 : 0.45;
        houseGroup.add(shutter);
      });
    });
  }

  /**
   * Traditional Tulasi Kota (Holy Basil Shrine with basil plant)
   */
  private createTulasiKota(houseGroup: THREE.Group, houseW: number, houseD: number): void {
    const tkGroup = new THREE.Group();
    // Positioned in front right courtyard area
    tkGroup.position.set(houseW * 0.38, 0, houseD / 2 + 2.2);

    // Tiered Stone Base Plinth
    const base1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 1.1), this.matKaaviBase);
    base1.position.y = 0.11;
    tkGroup.add(base1);

    const base2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.18, 0.85), this.matWallLimeWhite);
    base2.position.y = 0.3;
    tkGroup.add(base2);

    // Carved Altar Pillar / Niche
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.6), this.matWallLimeWhite);
    pillar.position.y = 0.75;
    tkGroup.add(pillar);

    // Diya Niche in Tulasi Kota front
    const niche = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.12), this.matKaaviBase);
    niche.position.set(0, 0.75, 0.28);
    tkGroup.add(niche);

    // Small Brass Diya in Niche
    const diya = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), this.matBrass);
    diya.position.set(0, 0.66, 0.28);
    tkGroup.add(diya);

    // Holy Basil / Tulasi Bush
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), this.matTulasiLeaves);
    bush.position.y = 1.35;
    tkGroup.add(bush);

    houseGroup.add(tkGroup);
  }

  /**
   * Traditional Charpai (Woven rope cot / Indian daybed) on the verandah
   */
  private createCharpai(houseGroup: THREE.Group, houseD: number): void {
    const cotGroup = new THREE.Group();
    cotGroup.position.set(-2.2, 0.45, houseD / 2 + 1.2);
    cotGroup.rotation.y = 0.2;

    // Wooden Frame
    const frameGeo = new THREE.BoxGeometry(2.0, 0.12, 1.0);
    const frame = new THREE.Mesh(frameGeo, this.matTeakWood);
    frame.position.y = 0.4;
    cotGroup.add(frame);

    // Woven Coir / Rope Bedding Surface
    const bedGeo = new THREE.BoxGeometry(1.8, 0.08, 0.85);
    const bedding = new THREE.Mesh(bedGeo, this.matCharpaiRope);
    bedding.position.y = 0.42;
    cotGroup.add(bedding);

    // 4 Turned Wooden Legs
    [
      { x: -0.9, z: -0.4 },
      { x: 0.9, z: -0.4 },
      { x: -0.9, z: 0.4 },
      { x: 0.9, z: 0.4 },
    ].forEach(legPos => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.4, 8), this.matTeakWood);
      leg.position.set(legPos.x, 0.2, legPos.z);
      cotGroup.add(leg);
    });

    houseGroup.add(cotGroup);
  }

  /**
   * Traditional Earthen Water Matkas (Pots) on wooden ring stand
   */
  private createMatkas(houseGroup: THREE.Group, houseD: number): void {
    const matkaGroup = new THREE.Group();
    matkaGroup.position.set(2.4, 0.45, houseD / 2 + 1.1);

    // Wooden ring stand
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.35, 8), this.matTeakWood);
    stand.position.y = 0.18;
    matkaGroup.add(stand);

    // Large Earthen Pot (Matka / Ranjan)
    const pot1 = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 10), this.matEarthenClay);
    pot1.position.set(-0.15, 0.6, 0);
    matkaGroup.add(pot1);

    // Brass drinking tumbler (Lota) propped on top
    const lota = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.16, 8), this.matBrass);
    lota.position.set(-0.15, 1.02, 0);
    matkaGroup.add(lota);

    // Second smaller pot
    const pot2 = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), this.matEarthenClay);
    pot2.position.set(0.32, 0.45, 0.15);
    matkaGroup.add(pot2);

    houseGroup.add(matkaGroup);
  }

  /**
   * Intricate Rangoli / Muggu chalk artwork at house threshold
   */
  private createRangoli(houseGroup: THREE.Group, houseD: number): void {
    const rangoliMat = new THREE.MeshBasicMaterial({
      color: '#fffbeb',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });

    // Circular floral muggu design
    const outerRing = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.65, 16), rangoliMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.set(0, 0.46, houseD / 2 + 1.1);
    houseGroup.add(outerRing);

    const innerFlower = new THREE.Mesh(new THREE.CircleGeometry(0.35, 8), rangoliMat);
    innerFlower.rotation.x = -Math.PI / 2;
    innerFlower.position.set(0, 0.465, houseD / 2 + 1.1);
    houseGroup.add(innerFlower);
  }

  /**
   * Authentic Indian rural lived-in elements:
   * Boundary walls, wooden utility poles with wires, community well, haystacks, and cattle sheds.
   */
  private buildVillageLivedInElements(): void {
    const livedInGroup = new THREE.Group();
    livedInGroup.name = 'village_lived_in_props';

    // 1. Whitewashed Compound Walls with Terracotta Tile Coping
    const wallSegments = [
      // West residential boundary walls
      { x: -26, z: 12, len: 10, rotY: 0.2 },
      { x: -32, z: 20, len: 8, rotY: -0.5 },
      { x: -36, z: -4, len: 12, rotY: 0.1 },
      // East residential boundary walls
      { x: 26, z: 12, len: 10, rotY: -0.2 },
      { x: 32, z: 20, len: 8, rotY: 0.5 },
      { x: 36, z: -4, len: 12, rotY: -0.1 },
      // South-West & South-East outer dykes
      { x: -28, z: 34, len: 9, rotY: 0.4 },
      { x: 28, z: 34, len: 9, rotY: -0.4 },
    ];

    const wallMat = new THREE.MeshLambertMaterial({ color: '#f1f5f9' }); // Whitewashed lime plaster
    const copingMat = new THREE.MeshLambertMaterial({ color: '#ea580c' }); // Terracotta coping tiles

    wallSegments.forEach((w, idx) => {
      const segGroup = new THREE.Group();
      segGroup.position.set(w.x, 0, w.z);
      segGroup.rotation.y = w.rotY;

      // Base wall (1.0m height, 0.35m thick)
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(w.len, 1.0, 0.35),
        wallMat
      );
      base.position.y = 0.5;
      base.castShadow = true;
      base.receiveShadow = true;
      segGroup.add(base);

      // Terracotta pitched ridge coping
      const ridge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.26, w.len + 0.1, 4),
        copingMat
      );
      ridge.rotation.z = Math.PI / 2;
      ridge.position.y = 1.05;
      ridge.castShadow = true;
      segGroup.add(ridge);

      // End pillars with small decorative finials
      [-w.len / 2, w.len / 2].forEach(px => {
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 1.2, 0.5),
          wallMat
        );
        pillar.position.set(px, 0.6, 0);
        pillar.castShadow = true;
        segGroup.add(pillar);

        const finial = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 8),
          copingMat
        );
        finial.position.set(px, 1.3, 0);
        segGroup.add(finial);
      });

      livedInGroup.add(segGroup);

      // Add box collider
      this.collisionSystem.addCollider({
        id: `village_compound_wall_${idx}`,
        type: 'box',
        position: new THREE.Vector3(w.x, 0.5, w.z),
        size: new THREE.Vector3(w.len * 0.9, 1.0, 0.5),
      });
    });

    // 2. Rural Village Wooden Electric / Telephone Utility Poles with Drooped Wires
    const polePositions = [
      { x: -14, z: 22 },
      { x: 14, z: 22 },
      { x: -15, z: 6 },
      { x: 15, z: 6 },
      { x: -16, z: -10 },
      { x: 16, z: -10 },
    ];

    const poleMat = new THREE.MeshLambertMaterial({ color: '#5c4033' }); // Weathered teak pole
    const wireMat = new THREE.MeshBasicMaterial({ color: '#1e293b' }); // Dark electrical line
    const insulatorMat = new THREE.MeshLambertMaterial({ color: '#ffffff' }); // White ceramic bell insulator

    polePositions.forEach((p, idx) => {
      const poleGroup = new THREE.Group();
      poleGroup.position.set(p.x, 0, p.z);

      // Main vertical pole (7.2m height)
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.2, 7.2, 10),
        poleMat
      );
      pole.position.y = 3.6;
      pole.castShadow = true;
      poleGroup.add(pole);

      // Top crossarm
      const crossarm = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.12, 0.12),
        poleMat
      );
      crossarm.position.y = 6.8;
      crossarm.castShadow = true;
      poleGroup.add(crossarm);

      // Ceramic insulators on crossarm ends
      [-0.75, 0, 0.75].forEach(cx => {
        const insulator = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.06, 0.14, 6),
          insulatorMat
        );
        insulator.position.set(cx, 6.92, 0);
        poleGroup.add(insulator);
      });

      livedInGroup.add(poleGroup);

      this.collisionSystem.addCollider({
        id: `utility_pole_${idx}`,
        type: 'sphere',
        position: new THREE.Vector3(p.x, 0, p.z),
        radius: 0.45,
      });
    });

    // Drooped catenary wires between consecutive poles on West and East lanes
    const wireConnections = [
      [polePositions[0], polePositions[2]],
      [polePositions[2], polePositions[4]],
      [polePositions[1], polePositions[3]],
      [polePositions[3], polePositions[5]],
    ];

    wireConnections.forEach(pair => {
      const p1 = new THREE.Vector3(pair[0].x, 6.8, pair[0].z);
      const p2 = new THREE.Vector3(pair[1].x, 6.8, pair[1].z);
      const mid = new THREE.Vector3()
        .addVectors(p1, p2)
        .multiplyScalar(0.5);
      mid.y -= 0.65; // Catenary sag

      const wireCurve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const wireGeo = new THREE.TubeGeometry(wireCurve, 14, 0.018, 4, false);
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      livedInGroup.add(wireMesh);
    });

    // 3. Village Community Water Well (Cheduvu Baavi)
    const wellGroup = new THREE.Group();
    wellGroup.position.set(-20, 0, 15);

    // Stone circular parapet
    const wellParapet = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.75, 0.9, 18, 1, true),
      new THREE.MeshLambertMaterial({ color: '#78716c' })
    );
    wellParapet.position.y = 0.45;
    wellParapet.castShadow = true;
    wellGroup.add(wellParapet);

    // Water surface inside
    const wellWater = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 16),
      new THREE.MeshLambertMaterial({ color: '#0369a1' })
    );
    wellWater.rotation.x = -Math.PI / 2;
    wellWater.position.y = 0.25;
    wellGroup.add(wellWater);

    // Well timber uprights and pulley beam
    const timberMat = new THREE.MeshLambertMaterial({ color: '#451a03' });
    [-1.4, 1.4].forEach(ux => {
      const upright = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 2.8, 0.18),
        timberMat
      );
      upright.position.set(ux, 1.4, 0);
      upright.castShadow = true;
      wellGroup.add(upright);
    });

    const crossBeam = new THREE.Mesh(
      new THREE.BoxGeometry(3.1, 0.18, 0.18),
      timberMat
    );
    crossBeam.position.set(0, 2.7, 0);
    crossBeam.castShadow = true;
    wellGroup.add(crossBeam);

    // Pulley wheel and rope
    const pulley = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12),
      new THREE.MeshLambertMaterial({ color: '#0f172a' })
    );
    pulley.rotation.z = Math.PI / 2;
    pulley.position.set(0, 2.45, 0);
    wellGroup.add(pulley);

    // Hanging rope and bucket
    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 1.6, 6),
      new THREE.MeshLambertMaterial({ color: '#ca8a04' })
    );
    rope.position.set(0, 1.65, 0);
    wellGroup.add(rope);

    const bucket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.18, 0.4, 10),
      new THREE.MeshLambertMaterial({ color: '#94a3b8' })
    );
    bucket.position.set(0, 0.9, 0);
    wellGroup.add(bucket);

    livedInGroup.add(wellGroup);

    this.collisionSystem.addCollider({
      id: 'village_community_well',
      type: 'sphere',
      position: new THREE.Vector3(-20, 0, 15),
      radius: 1.8,
    });

    // 4. Golden Conical Haystacks (Gaddi Vaamu) on timber stilts
    const haystackCoords = [
      { x: 32, z: 18, r: 2.4, h: 3.8 },
      { x: -26, z: 32, r: 2.1, h: 3.5 },
    ];

    haystackCoords.forEach((h, idx) => {
      const hayGroup = new THREE.Group();
      hayGroup.position.set(h.x, 0, h.z);

      // Timber stilts base
      for (let s = 0; s < 4; s++) {
        const angle = (s * Math.PI) / 2;
        const stilt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.1, 0.8, 6),
          timberMat
        );
        stilt.position.set(Math.cos(angle) * 1.2, 0.4, Math.sin(angle) * 1.2);
        stilt.castShadow = true;
        hayGroup.add(stilt);
      }

      // Conical golden straw stack
      const stackMat = new THREE.MeshLambertMaterial({ color: '#d97706' });
      const hayBase = new THREE.Mesh(
        new THREE.CylinderGeometry(h.r, h.r * 0.9, 1.5, 12),
        stackMat
      );
      hayBase.position.y = 1.4;
      hayBase.castShadow = true;
      hayGroup.add(hayBase);

      const hayCone = new THREE.Mesh(
        new THREE.ConeGeometry(h.r, h.h - 1.5, 12),
        stackMat
      );
      hayCone.position.y = 1.4 + (h.h - 1.5) / 2 + 0.75;
      hayCone.castShadow = true;
      hayGroup.add(hayCone);

      livedInGroup.add(hayGroup);

      this.collisionSystem.addCollider({
        id: `village_haystack_${idx}`,
        type: 'sphere',
        position: new THREE.Vector3(h.x, 0, h.z),
        radius: h.r * 0.95,
      });
    });

    // 5. Village Cattle Shed (Pasula Paaka)
    const cattleShed = new THREE.Group();
    cattleShed.position.set(-36, 0, 16);
    cattleShed.rotation.y = 0.18;

    const postMat = new THREE.MeshLambertMaterial({ color: '#5c4033' });
    const thatchMat = new THREE.MeshLambertMaterial({ color: '#ca8a04' });

    // 4 timber posts
    const postPositions = [
      { x: -3.0, z: -2.0 },
      { x: 3.0, z: -2.0 },
      { x: -3.0, z: 2.0 },
      { x: 3.0, z: 2.0 },
    ];
    postPositions.forEach(p => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 3.2, 8),
        postMat
      );
      post.position.set(p.x, 1.6, p.z);
      post.castShadow = true;
      cattleShed.add(post);
    });

    // Slanted Thatch Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(6.6, 0.35, 4.8),
      thatchMat
    );
    roof.position.set(0, 3.1, 0);
    roof.rotation.x = 0.12;
    roof.castShadow = true;
    cattleShed.add(roof);

    // Stone cattle feeding trough (gaddi தொட்டி)
    const trough = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.6, 0.9),
      new THREE.MeshLambertMaterial({ color: '#78716c' })
    );
    trough.position.set(0, 0.3, -1.2);
    trough.castShadow = true;
    cattleShed.add(trough);

    livedInGroup.add(cattleShed);

    this.collisionSystem.addCollider({
      id: 'village_cattle_shed',
      type: 'box',
      position: new THREE.Vector3(-36, 1.6, 16),
      size: new THREE.Vector3(6.5, 3.2, 4.5),
    });

    this.group.add(livedInGroup);
  }
}
