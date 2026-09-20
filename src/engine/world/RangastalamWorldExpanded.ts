/**
 * THE KATHA - Rangastalam World Expanded
 * 
 * Persistent, continuous, seamless explorable world for ALL 3 Levels.
 * Contains:
 * 1. Continuous Seamless Landmass (640m x 640m) with natural terrain transitions
 * 2. Distant Mountains & Rolling Hills Horizon Range
 * 3. Dense Jungle & Woodland Groves (Seamless extension from Sacred Forest)
 * 4. Open Countryside (Paddy fields, haystacks, stone irrigation well, farm fences)
 * 5. Sacred River, Water Areas & Kalyani Bathing Ghats (Level 3 Nimajjanam site)
 * 6. Arched Stone Bridge spanning the river
 * 7. Grand National Highway connecting Rangastalam Village to the Modern City
 * 8. Modern City District (Civic center, commercial towers, paved sidewalks, central plaza)
 * 9. Walkable Road Network connecting Village, Jungle, River, Countryside, Highway, and City
 * 10. Authentic Directional Milestone Signposts establishing RANGASTALAM as the main world
 */

import * as THREE from 'three';
import { CollisionSystem } from '../collisions/CollisionSystem';

export interface WorldUpdateParams {
  delta: number;
  time: number;
}

export class RangastalamWorldExpanded {
  private scene: THREE.Scene;
  private collisionSystem: CollisionSystem;
  public group: THREE.Group;

  // Materials Palette (Reused to keep draw calls and memory low)
  private matClayTerrain: THREE.MeshLambertMaterial;
  private matGrassCountryside: THREE.MeshLambertMaterial;
  private matForestSoil: THREE.MeshLambertMaterial;
  private matForestGrass: THREE.MeshLambertMaterial;
  private matRiverSand: THREE.MeshLambertMaterial;
  private matRiverWater: THREE.MeshLambertMaterial;
  private matAsphalt: THREE.MeshLambertMaterial;
  private matRoadMarking: THREE.MeshBasicMaterial;
  private matCityPavement: THREE.MeshLambertMaterial;
  private matCityCurbs: THREE.MeshLambertMaterial;
  private matStoneGranite: THREE.MeshLambertMaterial;
  private matMountainDistant: THREE.MeshLambertMaterial;
  private matMountainNear: THREE.MeshLambertMaterial;
  private matTreeTrunk: THREE.MeshLambertMaterial;
  private matSalTreeTrunk: THREE.MeshLambertMaterial;
  private matDeepLeaf: THREE.MeshLambertMaterial;
  private matLushLeaf: THREE.MeshLambertMaterial;
  private matGoldenLeaf: THREE.MeshLambertMaterial;
  private matBuildingWhite: THREE.MeshLambertMaterial;
  private matBuildingGlass: THREE.MeshLambertMaterial;
  private matBuildingTerracotta: THREE.MeshLambertMaterial;
  private matBuildingTeal: THREE.MeshLambertMaterial;
  private matBuildingOchre: THREE.MeshLambertMaterial;
  private matHaystack: THREE.MeshLambertMaterial;
  private matWoodFence: THREE.MeshLambertMaterial;
  private matBrassGlow: THREE.MeshBasicMaterial;
  private matMilestoneWhite: THREE.MeshLambertMaterial;
  private matMilestoneYellow: THREE.MeshLambertMaterial;
  private matConnectingRoad: THREE.MeshLambertMaterial;
  private matConnectingRoadBorder: THREE.MeshLambertMaterial;

  // Animated elements
  private riverWaterMesh: THREE.Mesh | null = null;
  private riverWaterVerticesOriginal: Float32Array | null = null;
  private cityFountainMesh: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene, collisionSystem: CollisionSystem) {
    this.scene = scene;
    this.collisionSystem = collisionSystem;
    this.group = new THREE.Group();
    this.group.name = 'rangastalam_world_expanded';

    // Initialize Shared Materials
    this.matClayTerrain = new THREE.MeshLambertMaterial({ color: '#d97706' }); // Warm village terracotta soil
    this.matGrassCountryside = new THREE.MeshLambertMaterial({ color: '#4d7c0f' }); // Fresh green countryside grass
    this.matForestSoil = new THREE.MeshLambertMaterial({ color: '#271c11' }); // Dark loamy jungle floor
    this.matForestGrass = new THREE.MeshLambertMaterial({ color: '#14532d' }); // Deep woodland grass
    this.matRiverSand = new THREE.MeshLambertMaterial({ color: '#a8a29e' }); // Riverbed silt and sand
    this.matRiverWater = new THREE.MeshLambertMaterial({
      color: '#0284c7',
      transparent: true,
      opacity: 0.82,
    });
    this.matAsphalt = new THREE.MeshLambertMaterial({ color: '#334155' }); // Highway & City asphalt
    this.matRoadMarking = new THREE.MeshBasicMaterial({ color: '#f8fafc' }); // Crisp white road dashes
    this.matCityPavement = new THREE.MeshLambertMaterial({ color: '#cbd5e1' }); // Stone sidewalk tiles
    this.matCityCurbs = new THREE.MeshLambertMaterial({ color: '#64748b' }); // Concrete curbstones
    this.matStoneGranite = new THREE.MeshLambertMaterial({ color: '#78716c' }); // Ancient temple & ghat stone
    this.matMountainDistant = new THREE.MeshLambertMaterial({ color: '#475569' }); // Hazy distant mountain ridges
    this.matMountainNear = new THREE.MeshLambertMaterial({ color: '#2e4a29' }); // Lush green foothills
    this.matTreeTrunk = new THREE.MeshLambertMaterial({ color: '#451a03' }); // Dark bark
    this.matSalTreeTrunk = new THREE.MeshLambertMaterial({ color: '#372719' }); // Jungle Sal timber
    this.matDeepLeaf = new THREE.MeshLambertMaterial({ color: '#15803d' }); // Jungle canopy
    this.matLushLeaf = new THREE.MeshLambertMaterial({ color: '#16a34a' }); // Bright foliage
    this.matGoldenLeaf = new THREE.MeshLambertMaterial({ color: '#ca8a04' }); // Autumnal/Neem leaves
    this.matBuildingWhite = new THREE.MeshLambertMaterial({ color: '#f8fafc' }); // City concrete
    this.matBuildingGlass = new THREE.MeshLambertMaterial({ color: '#38bdf8' }); // Modern glass facade
    this.matBuildingTerracotta = new THREE.MeshLambertMaterial({ color: '#c2410c' }); // Brick & tile
    this.matBuildingTeal = new THREE.MeshLambertMaterial({ color: '#0d9488' }); // Modern civic teal
    this.matBuildingOchre = new THREE.MeshLambertMaterial({ color: '#eab308' }); // Indian town ochre
    this.matHaystack = new THREE.MeshLambertMaterial({ color: '#d97706' }); // Dried golden straw
    this.matWoodFence = new THREE.MeshLambertMaterial({ color: '#713f12' }); // Farm timber
    this.matBrassGlow = new THREE.MeshBasicMaterial({ color: '#facc15' }); // Streetlight lamps
    this.matMilestoneWhite = new THREE.MeshLambertMaterial({ color: '#f8fafc' });
    this.matMilestoneYellow = new THREE.MeshLambertMaterial({ color: '#f59e0b' });
    this.matConnectingRoad = new THREE.MeshLambertMaterial({
      color: '#fef3c7', // Matches Rangastalam village road
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -4.0,
    });
    this.matConnectingRoadBorder = new THREE.MeshLambertMaterial({
      color: '#b45309', // Defined warm earthen/stone curb border
      polygonOffset: true,
      polygonOffsetFactor: -2.2,
      polygonOffsetUnits: -4.0,
    });
  }

  public build(): void {
    // 1. Vast Continuous Landmass & Natural Terrain Transitions
    this.buildSeamlessLandmass();

    // 2. Distant Mountains & Horizon Ridge
    this.buildDistantMountains();

    // 3. Dense Jungle & Forest Trails (Seamless North-East Expansion)
    this.buildDenseJungleExpansion();

    // 4. Open Countryside, Paddy Terraces & Farmlands (South & South-West)
    this.buildOpenCountryside();

    // 5. Sacred River, Kalyani Lake Ghats & Stone Bridge (West)
    this.buildRiverAndGhats();

    // 6. Grand Highway & Modern City handled by ModernCityAndHighway module


    // 8. Interconnecting Road Network & Directional Milestone Signboards
    this.buildRoadNetworkAndMilestones();

    // 9. World Perimeter Boundaries (Prevents player from walking off terrain into void)
    this.buildWorldBoundaries();

    this.scene.add(this.group);
  }

  /**
   * World Perimeter Boundaries
   */
  private buildWorldBoundaries(): void {
    // North boundary
    this.collisionSystem.addCollider({
      id: 'world_boundary_north',
      type: 'box',
      position: new THREE.Vector3(75, 2, -202),
      size: new THREE.Vector3(480, 10, 8),
    });

    // South boundary
    this.collisionSystem.addCollider({
      id: 'world_boundary_south',
      type: 'box',
      position: new THREE.Vector3(75, 2, 182),
      size: new THREE.Vector3(480, 10, 8),
    });

    // West boundary
    this.collisionSystem.addCollider({
      id: 'world_boundary_west',
      type: 'box',
      position: new THREE.Vector3(-162, 2, -10),
      size: new THREE.Vector3(8, 10, 400),
    });

    // East boundary
    this.collisionSystem.addCollider({
      id: 'world_boundary_east',
      type: 'box',
      position: new THREE.Vector3(312, 2, -10),
      size: new THREE.Vector3(8, 10, 400),
    });
  }

  /**
   * 1. Continuous Seamless Landmass (640m x 640m)
   * A unified continuous ground surface so the world never looks like floating islands.
   * Uses gentle elevation blending for realistic natural topography.
   */
  private buildSeamlessLandmass(): void {
    const terrainGroup = new THREE.Group();
    terrainGroup.name = 'seamless_landmass';

    // Massive continuous terrain base (1500m x 1440m)
    // Firmly supports the entire world: Rangastalam village, river valley, highway, modern city,
    // wide open surrounding plains, and the distant horizon mountains.
    const baseGeo = new THREE.PlaneGeometry(1500, 1440, 60, 60);
    baseGeo.rotateX(-Math.PI / 2);

    // Sculpt natural terrain height:
    // - Central village sits perfectly flat at Y = 0
    // - Kalyani River channel to the west forms a gentle natural depression (Y = -0.55)
    // - Connecting highway corridor sits perfectly flat at Y = 0
    // - Modern city district & surrounding open land sit flat at Y = 0 (no terrain clipping through buildings)
    // - Distant perimeter foothills gently rise under the distant mountain horizons (Y = +1.0 to +7.0)
    const posAttr = baseGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const localX = posAttr.getX(i);
      const localZ = posAttr.getZ(i);

      // World coordinates (plane centered at X = 60, Z = 0)
      const wx = localX + 60;
      const wz = localZ;

      // Distance metrics
      const distFromVillage = Math.sqrt(wx * wx + wz * wz);
      const distFromCity = Math.sqrt((wx - 215) * (wx - 215) + (wz - (-55)) * (wz - (-55)));

      let y = 0;

      // 1. Kalyani River valley trough along X ~ -110 (from Z = -240 to Z = 240)
      if (wx < -65 && wx > -160 && wz > -260 && wz < 260) {
        const riverCenter = -110;
        const distToRiver = Math.abs(wx - riverCenter);
        if (distToRiver < 35) {
          y = -0.55 * (1 - distToRiver / 35);
        }
      }

      // 2. Gentle countryside rolling waves (South & Southwest of village)
      if (wz > 35 && wz < 250 && wx > -70 && wx < 60) {
        y += Math.sin(wx * 0.05) * Math.cos(wz * 0.04) * 0.25;
      }

      // 3. Gentle northern forest slopes
      if (wz < -35 && wz > -240 && wx > -40 && wx < 130) {
        y += Math.sin(wx * 0.03 + wz * 0.02) * 0.3;
      }

      // 4. Highway corridor must remain flat at Y = 0
      const isNearHighway = (wx > 20 && wx < 220 && wz > -15 && wz < 75);

      // 5. Modern City District & Surrounding Open Land must remain flat at Y = 0
      // City buildings sit in X: [155, 275], Z: [-140, 35]
      // Surrounding open land buffer extends to X: [130, 440], Z: [-240, 110]
      const isInCityOrOpenBuffer = (wx >= 130 && wx <= 440 && wz >= -240 && wz <= 110);

      // 6. Perimeter foothills elevation (where distant horizon mountains sit)
      // Only elevate far outside the playable areas
      if (!isInCityOrOpenBuffer && !isNearHighway && distFromVillage > 55) {
        if (wx < 130) {
          // Western, Northern, and Southern perimeter
          if (distFromVillage > 340) {
            const factor = (distFromVillage - 340) / 120;
            y += Math.min(factor * factor * 4.5, 7.0);
          }
        } else {
          // Eastern perimeter (far beyond the city and distant open land)
          if (wx > 460 || distFromCity > 320) {
            const factor = Math.max((wx - 460) / 110, (distFromCity - 320) / 120);
            y += Math.min(factor * factor * 4.5, 7.0);
          }
        }
      }

      // Absolute safety clamp: village core, highway, and city + open buffer are strictly flat at Y = 0
      if (distFromVillage < 50 || isInCityOrOpenBuffer || isNearHighway) {
        y = 0;
      }

      posAttr.setY(i, y - 0.05);
    }
    baseGeo.computeVertexNormals();

    const mainBaseMesh = new THREE.Mesh(baseGeo, this.matGrassCountryside);
    mainBaseMesh.position.set(60, 0, 0);
    mainBaseMesh.receiveShadow = true;
    terrainGroup.add(mainBaseMesh);

    // Natural Soil Transition Zones (sit flush at Y = 0.01 without z-fighting)
    // Village Terracotta Clay Subsurface Foundation (sits safely below RangastalamVillage at Y = -0.06)
    const villageTerracotta = new THREE.Mesh(
      new THREE.CylinderGeometry(58, 62, 0.08, 32),
      this.matClayTerrain
    );
    villageTerracotta.position.set(0, -0.10, 0);
    villageTerracotta.receiveShadow = true;
    terrainGroup.add(villageTerracotta);

    // Dark Loamy Jungle Floor Zone (North/Northeast)
    const forestSoilMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(110, 115, 0.12, 32),
      this.matForestSoil
    );
    forestSoilMesh.position.set(45, -0.035, -110);
    forestSoilMesh.receiveShadow = true;
    terrainGroup.add(forestSoilMesh);

    // Modern City Paved Foundation Zone (East)
    // Firmly placed under entire city district (X: 140 to 300, Z: -160 to 60)
    const cityBaseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(160, 0.14, 220),
      this.matCityPavement
    );
    cityBaseMesh.position.set(220, -0.035, -50);
    cityBaseMesh.receiveShadow = true;
    terrainGroup.add(cityBaseMesh);

    this.group.add(terrainGroup);
  }

  /**
   * 2. Distant Mountains & Horizon Ridge
   * Majestic mountain ranges framing the horizon so the world feels grand, grounded, and epic.
   * Spatial structure:
   * RANGASTALAM VILLAGE -> SURROUNDING LAND -> CITY -> DISTANT OPEN LAND / HORIZON -> MOUNTAINS
   * The mountains are situated strictly on the distant horizon, outside and far beyond the city (X: 560 to 690m),
   * ensuring zero intersection with buildings or roads from any 360-degree camera angle.
   */
  private buildDistantMountains(): void {
    const mountainGroup = new THREE.Group();
    mountainGroup.name = 'distant_mountains';

    const numPeaks = 40;

    for (let i = 0; i < numPeaks; i++) {
      const angle = (i / numPeaks) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      let mx: number;
      let mz: number;
      let baseElevation = 0;

      if (cosA > 0.12) {
        // Eastern & South-Eastern / North-Eastern Horizon:
        // Positioned OUTSIDE and FAR BEYOND the Modern City (X: 155-275, Z: -140 to 35).
        // City center is at (215, -55).
        // Mountains sit on the distant eastern horizon between X: 570m and 690m.
        const eastDist = 390 + cosA * 70 + Math.sin(i * 3.3) * 35;
        mx = 215 + cosA * eastDist;
        mz = -55 + sinA * (eastDist + 40) + Math.cos(i * 2.5) * 20;

        // Ground elevation matching the perimeter terrain
        const distFromCity = Math.sqrt((mx - 215) * (mx - 215) + (mz - (-55)) * (mz - (-55)));
        baseElevation = Math.min(Math.max((distFromCity - 300) / 120, 0) * 3.5, 6.5);
      } else {
        // Western, Northern, and Southern Horizon:
        // Surrounding the broader world, village, river, and deep jungle from afar.
        const dist = 510 + Math.sin(i * 3.3) * 45;
        mx = cosA * dist;
        mz = sinA * dist;

        const distFromCenter = Math.sqrt(mx * mx + mz * mz);
        baseElevation = Math.min(Math.max((distFromCenter - 340) / 120, 0) * 3.5, 6.5);
      }

      // Natural mountain dimensions: grand, monumental silhouettes on the distant horizon
      const peakHeight = 68 + Math.sin(i * 4.1) * 26 + (i % 2 === 0 ? 18 : -10);
      const peakRadius = 72 + (i % 3) * 16;

      const mountainGeo = new THREE.ConeGeometry(peakRadius, peakHeight, 8);
      // Embed base 3.5m into the ground to ensure zero floating gaps on sloping terrain
      mountainGeo.translate(0, peakHeight / 2 - 3.5, 0);

      // Material variation: Alternate near lush green foothills and hazy distant blue-grey ridges
      const isFar = (i % 2 === 0);
      const mountain = new THREE.Mesh(mountainGeo, isFar ? this.matMountainDistant : this.matMountainNear);
      mountain.position.set(mx, baseElevation, mz);
      mountain.rotation.y = i * 1.35;
      mountain.receiveShadow = true;
      mountainGroup.add(mountain);

      // Eastern Hilltop Temple Gopuram Silhouette (Iconic South Indian landmark on distant ridge)
      // Positioned on the eastern horizon peak (X ~ 645, Z ~ -70) catching the morning sunrise!
      if (i === 0) {
        const gopuramGroup = new THREE.Group();
        gopuramGroup.position.set(mx, baseElevation + peakHeight - 2, mz);

        const gopuramBase = new THREE.Mesh(new THREE.BoxGeometry(16, 12, 12), this.matBuildingTerracotta);
        gopuramBase.position.y = 6;
        gopuramGroup.add(gopuramBase);

        const gopuramTier = new THREE.Mesh(new THREE.BoxGeometry(11, 9, 9), this.matBuildingTerracotta);
        gopuramTier.position.y = 16.5;
        gopuramGroup.add(gopuramTier);

        const kalashFinial = new THREE.Mesh(new THREE.ConeGeometry(2.0, 5.0, 8), this.matBrassGlow);
        kalashFinial.position.y = 23.5;
        gopuramGroup.add(kalashFinial);

        mountainGroup.add(gopuramGroup);
      }
    }

    this.group.add(mountainGroup);
  }

  /**
   * 3. Dense Jungle & Forest Trails
   * Expands seamlessly from the Sacred Forest Grove (26, 0, -98) into a vast, walkable jungle.
   */
  private buildDenseJungleExpansion(): void {
    const jungleGroup = new THREE.Group();
    jungleGroup.name = 'dense_jungle_expansion';

    // Walkable winding Forest Trails (designated dirt ribbons)
    const forestPathCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(26, 0.02, -98), // Sacred Grove Clearing
      new THREE.Vector3(38, 0.02, -112),
      new THREE.Vector3(28, 0.02, -128),
      new THREE.Vector3(45, 0.02, -145),
      new THREE.Vector3(65, 0.02, -165), // Deep Forest Ancient Shrine
      new THREE.Vector3(85, 0.02, -185),
    ]);

    const pathPoints = forestPathCurve.getPoints(40);
    const pathGeo = new THREE.BufferGeometry();
    const pathVertices: number[] = [];
    const pathIndices: number[] = [];
    const trailWidth = 2.8;

    for (let i = 0; i < pathPoints.length; i++) {
      const pt = pathPoints[i];
      let tangent = new THREE.Vector3(0, 0, -1);
      if (i < pathPoints.length - 1) {
        tangent = pathPoints[i + 1].clone().sub(pt).normalize();
      } else if (i > 0) {
        tangent = pt.clone().sub(pathPoints[i - 1]).normalize();
      }
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      pathVertices.push(
        pt.x + normal.x * trailWidth * 0.5, 0.035, pt.z + normal.z * trailWidth * 0.5,
        pt.x - normal.x * trailWidth * 0.5, 0.035, pt.z - normal.z * trailWidth * 0.5
      );

      if (i < pathPoints.length - 1) {
        const base = i * 2;
        pathIndices.push(base, base + 1, base + 2);
        pathIndices.push(base + 1, base + 3, base + 2);
      }
    }

    pathGeo.setAttribute('position', new THREE.Float32BufferAttribute(pathVertices, 3));
    pathGeo.setIndex(pathIndices);
    pathGeo.computeVertexNormals();

    const pathMesh = new THREE.Mesh(pathGeo, this.matConnectingRoad);
    pathMesh.receiveShadow = true;
    jungleGroup.add(pathMesh);

    // Deep Forest Trees (Placed strategically along paths with ample walkable clearance)
    const treePositions = [
      { x: 12, z: -60, r: 3.8, h: 9.0 },
      { x: 48, z: -55, r: 4.2, h: 10.5 },
      { x: 12, z: -80, r: 4.5, h: 11.0 },
      { x: 50, z: -85, r: 4.0, h: 9.5 },
      { x: 22, z: -115, r: 4.8, h: 12.0 },
      { x: 68, z: -105, r: 3.9, h: 9.8 },
      { x: 35, z: -135, r: 5.0, h: 12.5 },
      { x: 78, z: -130, r: 4.2, h: 10.0 },
      { x: 55, z: -160, r: 4.6, h: 11.2 },
      { x: 95, z: -150, r: 4.3, h: 10.5 },
      // Flanking dense forest groves
      { x: -10, z: -70, r: 4.5, h: 11.0 },
      { x: -18, z: -100, r: 5.0, h: 12.0 },
      { x: -5, z: -130, r: 4.8, h: 11.5 },
      { x: 75, z: -60, r: 4.2, h: 10.0 },
      { x: 90, z: -85, r: 4.6, h: 11.2 },
      { x: 110, z: -110, r: 5.2, h: 13.0 },
    ];

    treePositions.forEach((tree, idx) => {
      const treeSubGroup = new THREE.Group();
      treeSubGroup.position.set(tree.x, 0, tree.z);

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.5, 0.75, tree.h * 0.6, 8);
      const trunkMesh = new THREE.Mesh(trunkGeo, this.matSalTreeTrunk);
      trunkMesh.position.y = (tree.h * 0.6) / 2;
      trunkMesh.castShadow = true;
      treeSubGroup.add(trunkMesh);

      // Layered Forest Foliage
      const fol1 = new THREE.Mesh(new THREE.SphereGeometry(tree.r, 8, 8), this.matDeepLeaf);
      fol1.position.y = tree.h * 0.7;
      fol1.castShadow = true;
      treeSubGroup.add(fol1);

      const fol2 = new THREE.Mesh(new THREE.SphereGeometry(tree.r * 0.75, 8, 8), this.matLushLeaf);
      fol2.position.set(0.6, tree.h * 0.88, 0.4);
      fol2.castShadow = true;
      treeSubGroup.add(fol2);

      jungleGroup.add(treeSubGroup);

      // Solid tree trunk collider
      this.collisionSystem.addCollider({
        id: `jungle_tree_${idx}`,
        type: 'sphere',
        position: new THREE.Vector3(tree.x, 0, tree.z),
        radius: 1.1,
      });
    });

    // Deep Forest Ancient Stone Shrine (at 65, 0, -145)
    const shrineGroup = new THREE.Group();
    shrineGroup.position.set(65, 0, -145);

    const shrinePlinth = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.6, 5.0), this.matStoneGranite);
    shrinePlinth.position.y = 0.3;
    shrineGroup.add(shrinePlinth);

    const shrineAltar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 1.2, 8), this.matStoneGranite);
    shrineAltar.position.y = 1.2;
    shrineGroup.add(shrineAltar);

    // Miniature carved idol of Lord Ganesha
    const shrineIdol = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), this.matStoneGranite);
    shrineIdol.position.y = 2.1;
    shrineGroup.add(shrineIdol);

    // Warm deep forest brass lamp glow
    const shrineLight = new THREE.PointLight('#f59e0b', 1.5, 14);
    shrineLight.position.set(65, 2.5, -145);
    shrineGroup.add(shrineLight);

    this.collisionSystem.addCollider({
      id: 'jungle_ancient_shrine',
      type: 'box',
      position: new THREE.Vector3(65, 0, -145),
      size: new THREE.Vector3(5.2, 3.0, 5.2),
    });

    jungleGroup.add(shrineGroup);

    this.group.add(jungleGroup);
  }

  /**
   * 4. Open Countryside, Paddy Terraces & Farmlands (South & South-West)
   * Rolling fields, traditional haystacks, farm fences, and a stone irrigation well.
   */
  private buildOpenCountryside(): void {
    const countrysideGroup = new THREE.Group();
    countrysideGroup.name = 'open_countryside';

    // Walkable terraced paddy fields (South of Rangastalam entrance)
    const paddyTerraces = [
      { x: -35, z: 65, w: 32, d: 24, c: '#4ade80' },
      { x: -40, z: 98, w: 34, d: 28, c: '#84cc16' },
      { x: 28, z: 75, w: 28, d: 22, c: '#65a30d' },
      { x: 35, z: 105, w: 32, d: 26, c: '#4ade80' },
      { x: -20, z: 135, w: 36, d: 30, c: '#84cc16' },
    ];

    paddyTerraces.forEach((paddy, idx) => {
      const paddyMesh = new THREE.Mesh(
        new THREE.BoxGeometry(paddy.w, 0.08, paddy.d),
        new THREE.MeshLambertMaterial({ color: paddy.c })
      );
      paddyMesh.position.set(paddy.x, 0.02, paddy.z);
      paddyMesh.receiveShadow = true;
      countrysideGroup.add(paddyMesh);

      // Low earthen bund borders around paddy (walkable pathways)
      const bundMat = this.matClayTerrain;
      const bundNorth = new THREE.Mesh(new THREE.BoxGeometry(paddy.w, 0.16, 0.6), bundMat);
      bundNorth.position.set(paddy.x, 0.08, paddy.z - paddy.d / 2);
      countrysideGroup.add(bundNorth);

      const bundSouth = new THREE.Mesh(new THREE.BoxGeometry(paddy.w, 0.16, 0.6), bundMat);
      bundSouth.position.set(paddy.x, 0.08, paddy.z + paddy.d / 2);
      countrysideGroup.add(bundSouth);
    });

    // Traditional Indian Conical Haystacks (Gaddi Kuppalu)
    const haystacks = [
      { x: -16, z: 52, r: 2.2, h: 3.8 },
      { x: -21, z: 55, r: 1.8, h: 3.2 },
      { x: 18, z: 58, r: 2.4, h: 4.0 },
      { x: 24, z: 54, r: 1.9, h: 3.4 },
      { x: -8, z: 110, r: 2.5, h: 4.2 },
    ];

    haystacks.forEach((hay, idx) => {
      const hayGeo = new THREE.ConeGeometry(hay.r, hay.h, 10);
      const hayMesh = new THREE.Mesh(hayGeo, this.matHaystack);
      hayMesh.position.set(hay.x, hay.h / 2, hay.z);
      hayMesh.castShadow = true;
      countrysideGroup.add(hayMesh);

      // Central wooden stability pole sticking out of top
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, hay.h + 0.8, 6), this.matWoodFence);
      pole.position.set(hay.x, (hay.h + 0.8) / 2, hay.z);
      countrysideGroup.add(pole);

      this.collisionSystem.addCollider({
        id: `countryside_haystack_${idx}`,
        type: 'sphere',
        position: new THREE.Vector3(hay.x, 0, hay.z),
        radius: hay.r * 0.9,
      });
    });

    // Ancient Stone Irrigation Well (Bhavi) with Wooden Pulley
    const wellGroup = new THREE.Group();
    wellGroup.position.set(-8, 0, 78);

    // Stone Circular Wall
    const wellWallGeo = new THREE.CylinderGeometry(2.4, 2.5, 1.4, 16, 1, true);
    const wellWall = new THREE.Mesh(wellWallGeo, this.matStoneGranite);
    wellWall.position.y = 0.7;
    wellWall.castShadow = true;
    wellGroup.add(wellWall);

    // Water level inside well
    const wellWater = new THREE.Mesh(new THREE.CircleGeometry(2.3, 16), this.matRiverWater);
    wellWater.rotation.x = -Math.PI / 2;
    wellWater.position.y = 0.3;
    wellGroup.add(wellWater);

    // Wooden A-Frame Pulley Support
    [-1.8, 1.8].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.2, 6), this.matWoodFence);
      leg.position.set(x, 1.6, 0);
      leg.castShadow = true;
      wellGroup.add(leg);
    });

    const topBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.0, 6), this.matWoodFence);
    topBeam.rotation.z = Math.PI / 2;
    topBeam.position.set(0, 3.2, 0);
    wellGroup.add(topBeam);

    this.collisionSystem.addCollider({
      id: 'countryside_stone_well',
      type: 'sphere',
      position: new THREE.Vector3(-8, 0, 78),
      radius: 2.5,
    });

    countrysideGroup.add(wellGroup);

    // Split-Rail Farm Timber Fences lining the field boundaries
    for (let fz = 40; fz <= 120; fz += 8) {
      // Left field fence post
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.4, 6), this.matWoodFence);
      postL.position.set(-6.5, 0.7, fz);
      countrysideGroup.add(postL);

      // Horizontal rails
      if (fz < 120) {
        const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 8.0), this.matWoodFence);
        railTop.position.set(-6.5, 1.05, fz + 4);
        countrysideGroup.add(railTop);

        const railBottom = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 8.0), this.matWoodFence);
        railBottom.position.set(-6.5, 0.55, fz + 4);
        countrysideGroup.add(railBottom);
      }

      // Right field fence post
      const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.4, 6), this.matWoodFence);
      postR.position.set(6.5, 0.7, fz);
      countrysideGroup.add(postR);

      if (fz < 120) {
        const railTopR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 8.0), this.matWoodFence);
        railTopR.position.set(6.5, 1.05, fz + 4);
        countrysideGroup.add(railTopR);

        const railBottomR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 8.0), this.matWoodFence);
        railBottomR.position.set(6.5, 0.55, fz + 4);
        countrysideGroup.add(railBottomR);
      }
    }

    this.group.add(countrysideGroup);
  }

  /**
   * 5. Sacred River, Kalyani Lake Ghats & Stone Bridge (West)
   * The holy river flowing North to South, with the historic stone bathing ghats (Level 3 Nimajjanam site)
   * and an arched stone footbridge spanning the river.
   */
  private buildRiverAndGhats(): void {
    const riverGroup = new THREE.Group();
    riverGroup.name = 'sacred_river_and_ghats';

    // Sacred River Water Ribbon (Spans X: -100 to -125, Z: -220 to 220)
    const riverLength = 440;
    const riverWidth = 26;
    const waterGeo = new THREE.PlaneGeometry(riverWidth, riverLength, 16, 64);
    waterGeo.rotateX(-Math.PI / 2);

    this.riverWaterVerticesOriginal = new Float32Array(waterGeo.attributes.position.array);

    this.riverWaterMesh = new THREE.Mesh(waterGeo, this.matRiverWater);
    this.riverWaterMesh.position.set(-112, -0.32, 0);
    riverGroup.add(this.riverWaterMesh);

    // River Sandy Banks
    const eastBank = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, riverLength), this.matRiverSand);
    eastBank.position.set(-96, -0.22, 0);
    riverGroup.add(eastBank);

    const westBank = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, riverLength), this.matRiverSand);
    westBank.position.set(-128, -0.22, 0);
    riverGroup.add(westBank);

    // KALYANI LAKE BATHING GHATS (Centered at X: -88, Z: 0)
    // Multi-tiered red-sandstone steps leading right down into the water for Level 3 Nimajjanam!
    const ghatGroup = new THREE.Group();
    ghatGroup.position.set(-88, 0, 0);

    const numTiers = 7;
    const stepWidth = 36;
    for (let t = 0; t < numTiers; t++) {
      const stepDepth = 2.2;
      const stepHeight = 0.22;
      const stepGeo = new THREE.BoxGeometry(stepDepth, stepHeight, stepWidth);
      const stepMesh = new THREE.Mesh(stepGeo, this.matStoneGranite);
      stepMesh.position.set(-t * (stepDepth * 0.9), -(t * stepHeight) + 0.5, 0);
      stepMesh.receiveShadow = true;
      ghatGroup.add(stepMesh);
    }

    // Grand Deepastambha (Carved Stone Lamp Pillar) on Ghat Promenade
    [-15, 15].forEach((zOffset, idx) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 6.2, 8), this.matStoneGranite);
      pillar.position.set(2.5, 3.1, zOffset);
      pillar.castShadow = true;
      ghatGroup.add(pillar);

      const lampCrown = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), this.matBrassGlow);
      lampCrown.position.set(2.5, 6.4, zOffset);
      ghatGroup.add(lampCrown);

      const ghatLight = new THREE.PointLight('#f59e0b', 1.8, 16);
      ghatLight.position.set(2.5, 6.5, zOffset);
      ghatGroup.add(ghatLight);

      this.collisionSystem.addCollider({
        id: `ghat_deepastambha_${idx}`,
        type: 'sphere',
        position: new THREE.Vector3(-88 + 2.5, 0, zOffset),
        radius: 1.0,
      });
    });

    riverGroup.add(ghatGroup);

    // ARCHED STONE FOOTBRIDGE (Crossing river at X: -112, Z: 80)
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(-112, 0, 80);

    // Bridge Deck (Walkable across river)
    const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(32, 0.4, 5.5), this.matStoneGranite);
    bridgeDeck.position.y = 1.6;
    bridgeDeck.receiveShadow = true;
    bridgeGroup.add(bridgeDeck);

    // Bridge Arched Piers
    [-8, 8].forEach(x => {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.8, 6.2), this.matStoneGranite);
      pier.position.set(x, 0.4, 0);
      bridgeGroup.add(pier);
    });

    // Bridge Stone Balustrades / Railings (Safety fences)
    [-2.6, 2.6].forEach((z, idx) => {
      const balustrade = new THREE.Mesh(new THREE.BoxGeometry(32, 1.0, 0.3), this.matStoneGranite);
      balustrade.position.set(0, 2.3, z);
      bridgeGroup.add(balustrade);

      this.collisionSystem.addCollider({
        id: `bridge_balustrade_${idx}`,
        type: 'box',
        position: new THREE.Vector3(-112, 1.6, 80 + z),
        size: new THREE.Vector3(32, 1.5, 0.5),
      });
    });

    riverGroup.add(bridgeGroup);

    // River Water Boundary Colliders:
    // Keep player from falling into deep river, but allow walking onto the Ghat steps and the Bridge!
    this.collisionSystem.addCollider({
      id: 'river_deep_water_north',
      type: 'box',
      position: new THREE.Vector3(-112, 0, -100),
      size: new THREE.Vector3(20, 2, 160),
    });
    this.collisionSystem.addCollider({
      id: 'river_deep_water_south',
      type: 'box',
      position: new THREE.Vector3(-112, 0, 160),
      size: new THREE.Vector3(20, 2, 120),
    });

    this.group.add(riverGroup);
  }



  /**
   * 8. Interconnecting Road Network & Directional Milestone Signboards
   * Seamlessly links all regions together and establishes RANGASTALAM as the prominent central world.
   */
  private buildRoadNetworkAndMilestones(): void {
    const roadGroup = new THREE.Group();
    roadGroup.name = 'interconnecting_roads_and_milestones';

    // A. South Countryside Road (From Village Entrance 0, 24 extending South to 0, 120)
    const southRoadGeo = new THREE.PlaneGeometry(4.6, 96);
    southRoadGeo.rotateX(-Math.PI / 2);
    const southRoad = new THREE.Mesh(southRoadGeo, this.matConnectingRoad);
    southRoad.position.set(0, 0.035, 72);
    southRoad.receiveShadow = true;
    roadGroup.add(southRoad);

    // South Road Curbs
    const southCurbGeo = new THREE.PlaneGeometry(0.28, 96);
    southCurbGeo.rotateX(-Math.PI / 2);
    const southLeftCurb = new THREE.Mesh(southCurbGeo, this.matConnectingRoadBorder);
    southLeftCurb.position.set(-2.44, 0.036, 72);
    roadGroup.add(southLeftCurb);
    const southRightCurb = new THREE.Mesh(southCurbGeo, this.matConnectingRoadBorder);
    southRightCurb.position.set(2.44, 0.036, 72);
    roadGroup.add(southRightCurb);

    // B. West River Road (From Village West -18, 0 extending to River Ghats -88, 0)
    const riverRoadGeo = new THREE.PlaneGeometry(70, 4.0);
    riverRoadGeo.rotateX(-Math.PI / 2);
    const riverRoad = new THREE.Mesh(riverRoadGeo, this.matConnectingRoad);
    riverRoad.position.set(-53, 0.035, 0);
    riverRoad.receiveShadow = true;
    roadGroup.add(riverRoad);

    // River Road Curbs
    const riverCurbGeo = new THREE.PlaneGeometry(70, 0.28);
    riverCurbGeo.rotateX(-Math.PI / 2);
    const riverTopCurb = new THREE.Mesh(riverCurbGeo, this.matConnectingRoadBorder);
    riverTopCurb.position.set(-53, 0.036, -2.14);
    roadGroup.add(riverTopCurb);
    const riverBottomCurb = new THREE.Mesh(riverCurbGeo, this.matConnectingRoadBorder);
    riverBottomCurb.position.set(-53, 0.036, 2.14);
    roadGroup.add(riverBottomCurb);

    // C. East Highway Connector Road (From Village East 18, 0 to Highway 45, 60)
    const hwLinkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(18, 0.035, 0),
      new THREE.Vector3(26, 0.035, 20),
      new THREE.Vector3(34, 0.035, 42),
      new THREE.Vector3(45, 0.035, 60),
    ]);
    const linkPoints = hwLinkCurve.getPoints(20);
    const linkGeo = new THREE.BufferGeometry();
    const linkBorderGeo = new THREE.BufferGeometry();
    const linkVerts: number[] = [];
    const linkIndices: number[] = [];
    const linkBorderVerts: number[] = [];
    const linkBorderIndices: number[] = [];
    const linkWidth = 4.0;
    const linkCurbWidth = 0.28;

    for (let i = 0; i < linkPoints.length; i++) {
      const pt = linkPoints[i];
      let tangent = new THREE.Vector3(0, 0, 1);
      if (i < linkPoints.length - 1) {
        tangent = linkPoints[i + 1].clone().sub(pt).normalize();
      } else if (i > 0) {
        tangent = pt.clone().sub(linkPoints[i - 1]).normalize();
      }
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      linkVerts.push(
        pt.x + normal.x * linkWidth * 0.5, 0.035, pt.z + normal.z * linkWidth * 0.5,
        pt.x - normal.x * linkWidth * 0.5, 0.035, pt.z - normal.z * linkWidth * 0.5
      );

      const bBase = i * 4;
      linkBorderVerts.push(
        pt.x + normal.x * linkWidth * 0.5, 0.036, pt.z + normal.z * linkWidth * 0.5,
        pt.x + normal.x * (linkWidth * 0.5 + linkCurbWidth), 0.036, pt.z + normal.z * (linkWidth * 0.5 + linkCurbWidth),
        pt.x - normal.x * (linkWidth * 0.5 + linkCurbWidth), 0.036, pt.z - normal.z * (linkWidth * 0.5 + linkCurbWidth),
        pt.x - normal.x * linkWidth * 0.5, 0.036, pt.z - normal.z * linkWidth * 0.5
      );

      if (i < linkPoints.length - 1) {
        const base = i * 2;
        linkIndices.push(base, base + 1, base + 2);
        linkIndices.push(base + 1, base + 3, base + 2);

        linkBorderIndices.push(bBase, bBase + 1, bBase + 4);
        linkBorderIndices.push(bBase + 1, bBase + 5, bBase + 4);
        linkBorderIndices.push(bBase + 2, bBase + 3, bBase + 6);
        linkBorderIndices.push(bBase + 3, bBase + 7, bBase + 6);
      }
    }

    linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkVerts, 3));
    linkGeo.setIndex(linkIndices);
    linkGeo.computeVertexNormals();

    const linkMesh = new THREE.Mesh(linkGeo, this.matConnectingRoad);
    linkMesh.receiveShadow = true;
    roadGroup.add(linkMesh);

    linkBorderGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkBorderVerts, 3));
    linkBorderGeo.setIndex(linkBorderIndices);
    linkBorderGeo.computeVertexNormals();

    const linkBorderMesh = new THREE.Mesh(linkBorderGeo, this.matConnectingRoadBorder);
    linkBorderMesh.receiveShadow = true;
    roadGroup.add(linkBorderMesh);

    // DIRECTIONAL MILESTONES (Authentic Indian yellow-domed milestones)
    const milestones = [
      // 1. South Countryside Road Milestone (Directing to Rangastalam)
      { x: 2.8, z: 38, text: 'RANGASTALAM', km: '0.2 KM', rot: Math.PI },
      // 2. Highway Link Junction Milestone (Placed safely on southern highway shoulder)
      { x: 38, z: 64.2, text: 'RANGASTALAM', km: '1.0 KM', rot: -Math.PI / 4 },
      // 3. River Ghats Road Milestone
      { x: -38, z: 2.4, text: 'KALYANI GHATS', km: '0.5 KM', rot: Math.PI / 2 },
      // 4. City Entrance Highway Milestone
      { x: 195, z: 54, text: 'METROPOLIS', km: '0.5 KM', rot: 0 },
    ];

    milestones.forEach((m, idx) => {
      const stoneGroup = new THREE.Group();
      stoneGroup.position.set(m.x, 0, m.z);
      stoneGroup.rotation.y = m.rot;

      // Lower white base
      const stoneBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.38, 0.8, 12),
        this.matMilestoneWhite
      );
      stoneBase.position.y = 0.4;
      stoneBase.castShadow = true;
      stoneGroup.add(stoneBase);

      // Curved yellow top dome
      const stoneTop = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
        this.matMilestoneYellow
      );
      stoneTop.position.y = 0.8;
      stoneTop.castShadow = true;
      stoneGroup.add(stoneTop);

      roadGroup.add(stoneGroup);

      this.collisionSystem.addCollider({
        id: `road_milestone_${idx}`,
        type: 'sphere',
        position: new THREE.Vector3(m.x, 0, m.z),
        radius: 0.5,
      });
    });

    this.group.add(roadGroup);
  }

  /**
   * Continuous animation update for living world (River surface shimmer)
   */
  public update(params: WorldUpdateParams): void {
    if (this.riverWaterMesh && this.riverWaterVerticesOriginal) {
      const posAttr = this.riverWaterMesh.geometry.attributes.position;
      const count = posAttr.count;
      const time = params.time * 2.2;

      for (let i = 0; i < count; i++) {
        const origY = this.riverWaterVerticesOriginal[i * 3 + 1];
        const origX = this.riverWaterVerticesOriginal[i * 3];
        const wave = Math.sin(origX * 0.3 + time) * 0.06 + Math.cos(origY * 0.2 + time * 1.4) * 0.04;
        posAttr.setZ(i, wave);
      }
      posAttr.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.scene.remove(this.group);
  }
}
