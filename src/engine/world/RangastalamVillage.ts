/**
 * THE KATHA - Rangastalam Village (Level 0 World Builder)
 *
 * Rich original 3D Indian cartoon village environment:
 * - Festive village atmosphere: colorful, alive, warm, festive, welcoming
 * - Village entrance with grand banana-stalk Toran archway
 * - Village houses with lime-washed & ochre walls, terracotta tiled roofs, verandas, rangoli
 * - Winding roads and pathways leading from entrance through square towards the Forest
 * - Ganesh Chaturthi preparations: bamboo pandal scaffolding, shamiana canopy, altar, drums
 * - Festival shops: Sweet stall with laddus, flower & pooja stall with marigold garlands
 * - Sacred banyan tree with aerial roots and stone seating katte
 * - Ambient NPC villagers (Pujari, Lakshmi Aunty, Subbarao Uncle, Carpenter Gopal)
 * - Lamps, brass deepams, cloth banners, marigold garlands, cloth pennants
 * - Clear visible forest path leading to the sacred forest gate and woodland groves
 */

import * as THREE from 'three';
import { CollisionSystem } from '../collisions/CollisionSystem';
import { LevelId } from '../../types/game';
import { IndianFlagSystem } from './IndianFlagSystem';
import { VillageHouses } from './VillageHouses';
import { MandapamOrganizerNPC } from '../characters/MandapamOrganizerNPC';
import { SaveSystem } from '../../core/save/SaveSystem';

export interface VillageElements {
  group: THREE.Group;
  forestDestination: THREE.Vector3;
  forestGatePosition: THREE.Vector3;
  lanternLights: THREE.PointLight[];
  npcVillagers: { name: string; position: THREE.Vector3; greeting: string }[];
  flagSystem: IndianFlagSystem;
}

export class RangastalamVillage {
  private scene: THREE.Scene;
  private collisionSystem: CollisionSystem;
  private villageGroup: THREE.Group;
  private currentLevel: LevelId;
  private lanternLights: THREE.PointLight[] = [];
  private ambientVillagers: { name: string; position: THREE.Vector3; greeting: string }[] = [];

  // Indian National Flags & Village Houses Systems
  public flagSystem: IndianFlagSystem = new IndianFlagSystem();
  public villageHouses: VillageHouses | null = null;

  // Level-specific dynamic Mandapam containers
  private mandapamDynamicContainer: THREE.Group = new THREE.Group();
  private mandapamLevel1Group: THREE.Group = new THREE.Group();
  private mandapamLevel2Group: THREE.Group = new THREE.Group();
  private mandapamLevel3Group: THREE.Group = new THREE.Group();

  // Paper Bag Beside Ganesh Mandapam (Level 1 Collection Flow)
  private mandapamPaperBagGroup: THREE.Group = new THREE.Group();
  private mandapamBagBeaconRing: THREE.Mesh | null = null;
  private mandapamSubmittedBagGroup: THREE.Group = new THREE.Group();
  private isMandapamBagPickedUp: boolean = false;
  // Positioned on the LEFT SIDE outside the Mandapam (-5.8, 0.45, 3.5)
  private paperBagPosition: THREE.Vector3 = new THREE.Vector3(-5.8, 0.45, 3.5);

  // Permanent Mandapam Organizer NPC (Anand)
  public mandapamOrganizerNPC: MandapamOrganizerNPC | null = null;

  // Level 1 Cinematic Entrance Highlight
  private entranceHighlightLight: THREE.PointLight | null = null;
  private entranceSignFaceMat: THREE.MeshStandardMaterial | null = null;

  // Mandapam Festive Decorative Lighting (Day/Night transition)
  private mandapamDecorativeMaterials: THREE.MeshStandardMaterial[] = [];
  private mandapamDecorativeLights: THREE.PointLight[] = [];
  private currentDecorativeLightFactor: number = 0.0;

  // Level 1 Animated Construction Workers Rigging
  private workerScaffoldArmL: THREE.Group | null = null;
  private workerScaffoldArmR: THREE.Group | null = null;
  private workerArtisanArmR: THREE.Group | null = null;
  private workerHelperArmR: THREE.Group | null = null;

  // Material Palette (Warm, original Indian cartoon aesthetic)
  private matClaySoil = new THREE.MeshLambertMaterial({ color: '#d97706' }); // Warm terracotta clay ground
  private matRoad = new THREE.MeshLambertMaterial({
    color: '#fef3c7', // Dusty sand/beige cobblestone road
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -4.0,
  });
  private matRoadBorder = new THREE.MeshLambertMaterial({
    color: '#b45309', // Defined warm earthen/stone curb border
    polygonOffset: true,
    polygonOffsetFactor: -2.2,
    polygonOffsetUnits: -4.0,
  });
  private matForestSoil = new THREE.MeshLambertMaterial({ color: '#3f2e18' }); // Rich dark woodland soil
  private matGrass = new THREE.MeshLambertMaterial({ color: '#4d7c0f' }); // Vibrant green village grass
  private matWallWhite = new THREE.MeshLambertMaterial({ color: '#fffbeb' }); // Lime plaster walls
  private matWallOchre = new THREE.MeshLambertMaterial({ color: '#fde68a' }); // Warm ochre village plaster
  private matWallPeach = new THREE.MeshLambertMaterial({ color: '#fed7aa' }); // Warm terracotta peach wall
  private matKaaviBase = new THREE.MeshLambertMaterial({ color: '#991b1b' }); // Traditional brick-red skirting band
  private matTerracottaRoof = new THREE.MeshLambertMaterial({ color: '#c2410c' }); // Clay roof tiles
  private matTeakWood = new THREE.MeshLambertMaterial({ color: '#573318' }); // Carved dark teak wood
  private matBamboo = new THREE.MeshLambertMaterial({ color: '#84cc16' }); // Fresh bamboo
  private matBambooDry = new THREE.MeshLambertMaterial({ color: '#ca8a04' }); // Golden cured bamboo
  private matBananaLeaf = new THREE.MeshLambertMaterial({ color: '#65a30d' }); // Broad banana leaf green
  private matMarigoldOrange = new THREE.MeshLambertMaterial({ color: '#f97316' }); // Festive marigold orange
  private matMarigoldYellow = new THREE.MeshLambertMaterial({ color: '#facc15' }); // Marigold golden yellow
  private matBrass = new THREE.MeshLambertMaterial({ color: '#eab308' }); // Polished brass deepam
  private matCrimsonCloth = new THREE.MeshLambertMaterial({ color: '#b91c1c' }); // Festival red fabric
  private matSaffronCloth = new THREE.MeshLambertMaterial({ color: '#ea580c' }); // Saffron fabric
  private matStoneGrey = new THREE.MeshLambertMaterial({ color: '#78716c' }); // Riverbed stones
  private matTreeTrunk = new THREE.MeshLambertMaterial({ color: '#451a03' }); // Tree bark
  private matLeafGreen = new THREE.MeshLambertMaterial({ color: '#15803d' }); // Lush tree canopy

  constructor(scene: THREE.Scene, collisionSystem: CollisionSystem, initialLevel: LevelId = LevelId.LEVEL_1) {
    this.scene = scene;
    this.collisionSystem = collisionSystem;
    this.currentLevel = initialLevel;
    this.villageGroup = new THREE.Group();
    this.villageGroup.name = 'rangastalam_village';
  }

  public build(): VillageElements {
    // 1. Terrain & Roadways
    this.buildTerrainAndRoads();

    // 2. Village Entrance Archway (South Gate)
    this.buildVillageEntrance();

    // 3. Central Festival Square & Ganesh Chaturthi Pandal (Under Construction)
    this.buildCentralPandalAndRangoli();

    // 4. Village Houses
    this.buildVillageHouses();

    // 5. Festive Village Shops & Stalls
    this.buildFestiveShops();

    // 6. Sacred Banyan Tree & Village Greenery
    this.buildTreesAndFlora();

    // 7. Festive Banners, Torans & Brass Deepams
    this.buildDecorationsAndLighting();

    // 8. Ambient NPC Villagers
    this.buildAmbientVillagers();

    // 9. Path to the Forest & Rustic Forest Gate
    this.buildForestPathAndGate();

    this.scene.add(this.villageGroup);

    return {
      group: this.villageGroup,
      forestDestination: new THREE.Vector3(26, 0, -98),
      forestGatePosition: new THREE.Vector3(24, 0, -68),
      lanternLights: this.lanternLights,
      npcVillagers: this.ambientVillagers,
      flagSystem: this.flagSystem,
    };
  }

  /**
   * 1. Ground terrain & winding village path (Spacious Indian Village Layout)
   */
  private buildTerrainAndRoads(): void {
    // Village central clay ground layer (generous 85m radius, sits flush at Y = 0.00)
    const groundGeo = new THREE.CylinderGeometry(85, 88, 0.1, 48);
    const ground = new THREE.Mesh(groundGeo, this.matClaySoil);
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.villageGroup.add(ground);

    // Open Countryside Transition Terrain (between village north edge and jungle entrance)
    const transitionGroundGeo = new THREE.CylinderGeometry(42, 45, 0.1, 32);
    const transitionGround = new THREE.Mesh(transitionGroundGeo, this.matGrass);
    transitionGround.position.set(20, -0.048, -48);
    transitionGround.receiveShadow = true;
    this.villageGroup.add(transitionGround);

    // Forest grove soil terrain at new deeper location
    const forestGroundGeo = new THREE.CylinderGeometry(36, 38, 0.1, 24);
    const forestGround = new THREE.Mesh(forestGroundGeo, this.matForestSoil);
    forestGround.position.set(26, -0.046, -98);
    forestGround.receiveShadow = true;
    this.villageGroup.add(forestGround);

    // Grass patches around village perimeter for natural variety
    const grassPatches = [
      { x: -38, z: -20, r: 18 },
      { x: 38, z: 20, r: 16 },
      { x: -32, z: 32, r: 18 },
      { x: 38, z: -14, r: 18 },
      { x: 0, z: -46, r: 15 },
    ];
    grassPatches.forEach(p => {
      const gMesh = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, 0.1, 16), this.matGrass);
      gMesh.position.set(p.x, -0.044, p.z);
      gMesh.receiveShadow = true;
      this.villageGroup.add(gMesh);
    });

    // Main Village & Transition Road (6.8m wide, spacious and clearly elevated at Y = 0.035)
    const roadCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.035, 34),  // South Entrance Avenue
      new THREE.Vector3(0, 0.035, 20),
      new THREE.Vector3(0, 0.035, 0),   // Central Festival Square
      new THREE.Vector3(4, 0.035, -14),
      new THREE.Vector3(10, 0.035, -28), // Village North Edge
      new THREE.Vector3(16, 0.035, -45), // Countryside Transition Road
      new THREE.Vector3(20, 0.035, -58),
      new THREE.Vector3(24, 0.035, -68), // Jungle Entrance Gate
      new THREE.Vector3(25, 0.035, -82), // Shaded Forest Trail
      new THREE.Vector3(26, 0.035, -98), // Sacred Forest Grove Clearing
    ]);

    // Construct flat road ribbon and distinct boundary curbs
    const points = roadCurve.getPoints(60);
    const roadWidth = 6.8;
    const curbWidth = 0.28;
    const roadGeo = new THREE.BufferGeometry();
    const borderGeo = new THREE.BufferGeometry();

    const vertices: number[] = [];
    const indices: number[] = [];
    const borderVerts: number[] = [];
    const borderIndices: number[] = [];

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      let tangent = new THREE.Vector3(0, 0, 1);
      if (i < points.length - 1) {
        tangent = points[i + 1].clone().sub(pt).normalize();
      } else if (i > 0) {
        tangent = pt.clone().sub(points[i - 1]).normalize();
      }
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Main Road Ribbon (Y = 0.035)
      vertices.push(
        pt.x + normal.x * roadWidth * 0.5, 0.035, pt.z + normal.z * roadWidth * 0.5,
        pt.x - normal.x * roadWidth * 0.5, 0.035, pt.z - normal.z * roadWidth * 0.5
      );

      // Distinct Road Boundary Curbs on Left and Right (Y = 0.036)
      const bBase = i * 4;
      // Right curb strip
      borderVerts.push(
        pt.x + normal.x * roadWidth * 0.5, 0.036, pt.z + normal.z * roadWidth * 0.5,
        pt.x + normal.x * (roadWidth * 0.5 + curbWidth), 0.036, pt.z + normal.z * (roadWidth * 0.5 + curbWidth)
      );
      // Left curb strip
      borderVerts.push(
        pt.x - normal.x * (roadWidth * 0.5 + curbWidth), 0.036, pt.z - normal.z * (roadWidth * 0.5 + curbWidth),
        pt.x - normal.x * roadWidth * 0.5, 0.036, pt.z - normal.z * roadWidth * 0.5
      );

      if (i < points.length - 1) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);

        // Right curb strip indices
        borderIndices.push(bBase, bBase + 1, bBase + 4);
        borderIndices.push(bBase + 1, bBase + 5, bBase + 4);

        // Left curb strip indices
        borderIndices.push(bBase + 2, bBase + 3, bBase + 6);
        borderIndices.push(bBase + 3, bBase + 7, bBase + 6);
      }
    }

    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMesh = new THREE.Mesh(roadGeo, this.matRoad);
    roadMesh.receiveShadow = true;
    this.villageGroup.add(roadMesh);

    borderGeo.setAttribute('position', new THREE.Float32BufferAttribute(borderVerts, 3));
    borderGeo.setIndex(borderIndices);
    borderGeo.computeVertexNormals();

    const borderMesh = new THREE.Mesh(borderGeo, this.matRoadBorder);
    borderMesh.receiveShadow = true;
    this.villageGroup.add(borderMesh);

    // Decorative river stones placed well back on shoulder (no obstacle for vehicles)
    for (let i = 0; i < points.length; i += 4) {
      const pt = points[i];
      [-1, 1].forEach(side => {
        const stoneGeo = new THREE.DodecahedronGeometry(0.22, 0);
        const stone = new THREE.Mesh(stoneGeo, this.matStoneGrey);
        stone.scale.set(1.2, 0.5, 1.0);
        stone.position.set(pt.x + (side * (roadWidth * 0.5 + 0.8)), 0.08, pt.z);
        stone.rotation.y = (i * 0.7);
        this.villageGroup.add(stone);
      });
    }
  }

  /**
   * Generates a high-resolution, ultra-crisp authentic signboard texture for RANGASTALAM
   */
  private createRangastalamSignboardTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new THREE.CanvasTexture(canvas);
    }

    // 1. Dark Teak / Sheesham Wood Grain Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 512);
    bgGrad.addColorStop(0, '#2d1408');
    bgGrad.addColorStop(0.5, '#421c0b');
    bgGrad.addColorStop(1, '#240f06');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 2048, 512);

    // Subtle horizontal wood grain lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let y = 10; y < 512; y += 14) {
      ctx.fillRect(0, y, 2048, 4);
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let y = 16; y < 512; y += 18) {
      ctx.fillRect(0, y, 2048, 3);
    }

    // 2. Ornate Golden Filigree Border
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 14;
    ctx.strokeRect(18, 18, 2048 - 36, 512 - 36);

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.strokeRect(26, 26, 2048 - 52, 512 - 52);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, 2048 - 80, 512 - 80);

    // Corner decorative rosettes & scrollwork
    const drawCornerOrnament = (cx: number, cy: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ea580c';
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * 22, Math.sin(ang) * 22, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    drawCornerOrnament(64, 64);
    drawCornerOrnament(2048 - 64, 64);
    drawCornerOrnament(64, 512 - 64);
    drawCornerOrnament(2048 - 64, 512 - 64);

    // Auspicious Brass Deepams on left and right sides
    const drawDeepam = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);
      // Diya lamp bowl
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.ellipse(0, 20, 36, 16, 0, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4;
      ctx.stroke();
      // Pedestal
      ctx.fillRect(-10, 20, 20, 35);
      ctx.beginPath();
      ctx.ellipse(0, 55, 28, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Golden Flame
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0, -35);
      ctx.quadraticCurveTo(24, 0, 0, 15);
      ctx.quadraticCurveTo(-24, 0, 0, -35);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.quadraticCurveTo(12, 0, 0, 12);
      ctx.quadraticCurveTo(-12, 0, 0, -25);
      ctx.fill();
      ctx.restore();
    };

    drawDeepam(140, 230);
    drawDeepam(2048 - 140, 230);

    // 3. Top Banner: Telugu script "రం గ స్థ లం" (Rangastalam)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 64px "Cinzel", "Suranna", "Tiro Telugu", serif';
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillText('రం   గ   స్థ   లం', 1024, 100);

    // 4. MAIN HERO TEXT: "RANGASTALAM"
    // Deep 3D embossed effect with warm gold gradient
    ctx.font = '900 138px "Cinzel", "Cinzel Decorative", serif, "Times New Roman"';

    // Bold dark shadow
    ctx.shadowColor = '#0f0502';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 12;

    const goldGrad = ctx.createLinearGradient(0, 180, 0, 340);
    goldGrad.addColorStop(0, '#ffffff');
    goldGrad.addColorStop(0.2, '#fef08a');
    goldGrad.addColorStop(0.5, '#facc15');
    goldGrad.addColorStop(0.85, '#d97706');
    goldGrad.addColorStop(1, '#92400e');

    // Outer dark relief stroke
    ctx.strokeStyle = '#291004';
    ctx.lineWidth = 20;
    ctx.strokeText('RANGASTALAM', 1024, 260);

    // Inner gold stroke
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 10;
    ctx.strokeText('RANGASTALAM', 1024, 260);

    // Main vibrant gold fill
    ctx.fillStyle = goldGrad;
    ctx.fillText('RANGASTALAM', 1024, 260);

    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 5. Bottom Subtitle: Festive Welcome Message
    ctx.font = 'bold 36px "Cinzel", sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 5;
    const subText = '✦ వినాయక చవితి మహోత్సవం  •  WELCOME TO RANGASTALAM ✦';
    ctx.strokeText(subText, 1024, 385);
    ctx.fillText(subText, 1024, 385);

    // Bottom floral bead swag
    ctx.fillStyle = '#f97316';
    for (let x = 200; x <= 1848; x += 36) {
      ctx.beginPath();
      ctx.arc(x, 440 + Math.sin(x * 0.05) * 6, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#facc15';
    for (let x = 218; x <= 1830; x += 36) {
      ctx.beginPath();
      ctx.arc(x, 440 + Math.sin(x * 0.05) * 6, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * 2. Village Entrance Archway (South Gate)
   * Authentic grand traditional Indian gateway with:
   * - Large readable "RANGASTALAM" signboard
   * - Carved stone & teak pillars
   * - Sloping terracotta tiled canopy with brass kalasham finials
   * - Multi-tiered marigold flower garlands, mango leaf toran, bunting flags
   * - Whole fresh banana trees tied to gateposts
   * - Flanking brass deepams on carved stone pedestals
   * - Grand 5m multi-colored Rangoli at threshold
   * - Framing coconut palms, neem trees, and roadside cottages
   */
  private buildVillageEntrance(): void {
    const entranceGroup = new THREE.Group();
    entranceGroup.position.set(0, 0, 24);

    // Pillar Spacing (7.6m wide clear passage)
    const pillarX = 3.8;

    // A. Two Grand Carved Stone & Teak Gateway Pillars
    [-pillarX, pillarX].forEach(x => {
      const isRight = x > 0;

      // 1. Stepped Granite Stone Plinth Base
      const plinthBase = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.88, 0.5, 12), this.matStoneGrey);
      plinthBase.position.set(x, 0.25, 0);
      plinthBase.receiveShadow = true;
      entranceGroup.add(plinthBase);

      const plinthTop = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.72, 0.5, 12), this.matStoneGrey);
      plinthTop.position.set(x, 0.75, 0);
      plinthTop.castShadow = true;
      entranceGroup.add(plinthTop);

      // 2. Octagonal Carved Teakwood Column Shaft
      const pillarGeo = new THREE.CylinderGeometry(0.38, 0.44, 4.8, 8);
      const pillar = new THREE.Mesh(pillarGeo, this.matTeakWood);
      pillar.position.set(x, 3.4, 0);
      pillar.castShadow = true;
      entranceGroup.add(pillar);

      // Decorative Brass Rings along Pillar Shaft
      [1.4, 2.6, 3.8, 5.0].forEach(ringY => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 16), this.matBrass);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(x, ringY, 0);
        entranceGroup.add(ring);
      });

      // 3. Traditional Carved Bracket Capital (Bodikai)
      const capBlock = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 0.9), this.matTeakWood);
      capBlock.position.set(x, 5.85, 0);
      entranceGroup.add(capBlock);

      // Polished Brass Decorative Kalasham Top Finial
      const pillarKalash = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), this.matBrass);
      pillarKalash.position.set(x, 6.25, 0);
      entranceGroup.add(pillarKalash);

      // 4. Whole Fresh Banana Tree tied to Gatepost (Auspicious Indian Wedding / Festival Tradition)
      const bananaTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 3.6, 8), this.matBananaLeaf);
      bananaTrunk.position.set(x + (isRight ? 0.55 : -0.55), 1.8, 0.1);
      entranceGroup.add(bananaTrunk);

      // Broad Arching Banana Leaves
      for (let l = 0; l < 5; l++) {
        const leafGeo = new THREE.BoxGeometry(0.5, 0.04, 1.8);
        const leaf = new THREE.Mesh(leafGeo, this.matBananaLeaf);
        leaf.position.set(x + (isRight ? 0.7 : -0.7), 3.2 - l * 0.35, 0.4 + l * 0.15);
        leaf.rotation.x = 0.45 + l * 0.18;
        leaf.rotation.y = (isRight ? 0.45 : -0.45);
        leaf.rotation.z = (isRight ? 0.2 : -0.2);
        entranceGroup.add(leaf);
      }

      // Hanging Red Banana Inflorescence / Blossom (Arati Poovu)
      const blossom = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 8), this.matCrimsonCloth);
      blossom.rotation.x = Math.PI;
      blossom.position.set(x + (isRight ? 0.8 : -0.8), 2.2, 0.6);
      entranceGroup.add(blossom);

      // 5. Fresh Marigold Flower Garland Swag wrapped around Pillar
      for (let g = 0; g < 4; g++) {
        const garlandRing = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.08, 6, 14), this.matMarigoldOrange);
        garlandRing.rotation.x = Math.PI / 2 + 0.18;
        garlandRing.position.set(x, 1.8 + g * 0.9, 0);
        entranceGroup.add(garlandRing);
      }

      // 6. Traditional Flanking Brass Deepam (Kuthu Vilakku) on Stone Pedestal
      const diyaPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.9, 8), this.matStoneGrey);
      diyaPedestal.position.set(x + (isRight ? 1.4 : -1.4), 0.45, 0.4);
      entranceGroup.add(diyaPedestal);

      // Multi-tiered Brass Diya Lamp
      const diyaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 0.2, 12), this.matBrass);
      diyaBase.position.set(x + (isRight ? 1.4 : -1.4), 1.0, 0.4);
      entranceGroup.add(diyaBase);

      const diyaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.7, 8), this.matBrass);
      diyaStem.position.set(x + (isRight ? 1.4 : -1.4), 1.35, 0.4);
      entranceGroup.add(diyaStem);

      const diyaBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.15, 0.18, 12), this.matBrass);
      diyaBowl.position.set(x + (isRight ? 1.4 : -1.4), 1.7, 0.4);
      entranceGroup.add(diyaBowl);

      // Golden Warm Point Light for Diya
      const diyaGlow = new THREE.PointLight('#f59e0b', 2.0, 14);
      diyaGlow.position.set(x + (isRight ? 1.4 : -1.4), 2.0, 0.4);
      entranceGroup.add(diyaGlow);
      this.lanternLights.push(diyaGlow);

      // Pillar Solid Collider
      this.collisionSystem.addCollider({
        id: `entrance_pillar_${isRight ? 'r' : 'l'}`,
        type: 'sphere',
        position: new THREE.Vector3(x, 0, 24),
        radius: 1.1,
      });
    });

    // B. Dual Heavy Carved Wooden Crossbeams
    // Lower crossbeam
    const lowerBeamGeo = new THREE.BoxGeometry(9.2, 0.42, 0.65);
    const lowerBeam = new THREE.Mesh(lowerBeamGeo, this.matTeakWood);
    lowerBeam.position.set(0, 4.4, 0);
    lowerBeam.castShadow = true;
    entranceGroup.add(lowerBeam);

    // Upper crossbeam
    const upperBeamGeo = new THREE.BoxGeometry(9.4, 0.38, 0.6);
    const upperBeam = new THREE.Mesh(upperBeamGeo, this.matTeakWood);
    upperBeam.position.set(0, 6.0, 0);
    upperBeam.castShadow = true;
    entranceGroup.add(upperBeam);

    // C. Physical "RANGASTALAM" Signboard with High-Resolution Texture
    const signTexture = this.createRangastalamSignboardTexture();
    const signFaceMat = new THREE.MeshStandardMaterial({
      map: signTexture,
      roughness: 0.35,
      metalness: 0.15,
    });
    this.entranceSignFaceMat = signFaceMat;

    // Box with 6 materials: front and back have the detailed texture, edges have teakwood
    const signMaterials = [
      this.matTeakWood, // +X
      this.matTeakWood, // -X
      this.matTeakWood, // +Y
      this.matTeakWood, // -Y
      signFaceMat,      // +Z (faces arriving camera!)
      signFaceMat,      // -Z (faces village)
    ];

    const signBoardGeo = new THREE.BoxGeometry(6.6, 1.45, 0.22);
    const signBoard = new THREE.Mesh(signBoardGeo, signMaterials);
    signBoard.position.set(0, 5.2, 0);
    signBoard.castShadow = true;
    entranceGroup.add(signBoard);

    // Carved Golden Outer Trim / Frame around Signboard
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.1, 0.26), this.matBrass);
    frameTop.position.set(0, 5.95, 0);
    entranceGroup.add(frameTop);

    const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.1, 0.26), this.matBrass);
    frameBottom.position.set(0, 4.45, 0);
    entranceGroup.add(frameBottom);

    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.26), this.matBrass);
    frameLeft.position.set(-3.35, 5.2, 0);
    entranceGroup.add(frameLeft);

    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.26), this.matBrass);
    frameRight.position.set(3.35, 5.2, 0);
    entranceGroup.add(frameRight);

    // Auspicious Brass Kalash atop center of Signboard Frame
    const centerKalash = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), this.matBrass);
    centerKalash.position.set(0, 6.15, 0);
    entranceGroup.add(centerKalash);

    // D. Traditional Sloping Terracotta Roof Canopy (Gopura Thorana)
    // South Sloping Roof Panel
    const southRoofGeo = new THREE.BoxGeometry(9.8, 0.18, 1.4);
    const southRoof = new THREE.Mesh(southRoofGeo, this.matTerracottaRoof);
    southRoof.position.set(0, 6.5, 0.55);
    southRoof.rotation.x = 0.45;
    southRoof.castShadow = true;
    entranceGroup.add(southRoof);

    // North Sloping Roof Panel
    const northRoof = new THREE.Mesh(southRoofGeo, this.matTerracottaRoof);
    northRoof.position.set(0, 6.5, -0.55);
    northRoof.rotation.x = -0.45;
    northRoof.castShadow = true;
    entranceGroup.add(northRoof);

    // Roof Ridge Beam
    const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.24, 0.3), this.matTeakWood);
    ridgeBeam.position.set(0, 6.85, 0);
    entranceGroup.add(ridgeBeam);

    // 3 Golden Brass Kalasham Finials on Roof Ridge
    [-3.0, 0, 3.0].forEach(kx => {
      const kalashPot = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), this.matBrass);
      kalashPot.position.set(kx, 7.15, 0);
      entranceGroup.add(kalashPot);

      const kalashSpire = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 8), this.matBrass);
      kalashSpire.position.set(kx, 7.45, 0);
      entranceGroup.add(kalashSpire);
    });

    // E. Festive Garlands, Toran & Bunting Flags
    // 1. Cascading Marigold Orange Flower Garland Loop under Signboard
    const garlandOrange = new THREE.Mesh(
      new THREE.TorusGeometry(3.6, 0.14, 8, 30, Math.PI),
      this.matMarigoldOrange
    );
    garlandOrange.position.set(0, 4.3, 0.25);
    entranceGroup.add(garlandOrange);

    // 2. Second Inner Golden Yellow Marigold Garland
    const garlandYellow = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.11, 8, 26, Math.PI),
      this.matMarigoldYellow
    );
    garlandYellow.position.set(0, 4.25, 0.28);
    entranceGroup.add(garlandYellow);

    // 3. Mango Leaf Toranam (Maamidaku Thoranam) hanging along beam edge
    for (let t = -3.2; t <= 3.2; t += 0.45) {
      const leafCone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 4), this.matBananaLeaf);
      leafCone.rotation.z = Math.PI;
      leafCone.position.set(t, 4.15, 0.2);
      entranceGroup.add(leafCone);
    }

    // 4. Colorful Triangle Bunting Flags (Pathakalu) fluttering along Roofline
    const flagColors = [
      this.matCrimsonCloth,
      this.matSaffronCloth,
      this.matMarigoldYellow,
      this.matLeafGreen,
      new THREE.MeshLambertMaterial({ color: '#0284c7' }), // Peacock Blue
    ];
    let flagIdx = 0;
    for (let fx = -4.2; fx <= 4.2; fx += 0.5) {
      const flagGeo = new THREE.ConeGeometry(0.15, 0.45, 3);
      const flagMesh = new THREE.Mesh(flagGeo, flagColors[flagIdx % flagColors.length]);
      flagMesh.rotation.z = Math.PI;
      flagMesh.position.set(fx, 6.25, 0.65);
      entranceGroup.add(flagMesh);
      flagIdx++;
    }

    // F. Grand Auspicious Rangoli (Muggu) on the Road Threshold
    // Intricate multi-ring festive rangoli right where Ramu stands (z = 21.5 to 24.5)
    const rangoliGroup = new THREE.Group();
    rangoliGroup.position.set(0, 0.035, -1.8); // Center around z = 22.2

    // Outer Rice Flour Border Ring
    const ringOuter = new THREE.Mesh(
      new THREE.RingGeometry(2.4, 2.7, 32),
      new THREE.MeshBasicMaterial({ color: '#fffbeb', side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
    );
    ringOuter.rotation.x = -Math.PI / 2;
    rangoliGroup.add(ringOuter);

    // Vermilion Kumkum Red Petal Ring
    const ringRed = new THREE.Mesh(
      new THREE.RingGeometry(1.8, 2.35, 32),
      new THREE.MeshBasicMaterial({ color: '#dc2626', side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
    );
    ringRed.rotation.x = -Math.PI / 2;
    rangoliGroup.add(ringRed);

    // Turmeric Yellow Geometric Ring
    const ringYellow = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.75, 24),
      new THREE.MeshBasicMaterial({ color: '#facc15', side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
    );
    ringYellow.rotation.x = -Math.PI / 2;
    rangoliGroup.add(ringYellow);

    // Peacock Cyan Inner Ring
    const ringCyan = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 1.05, 16),
      new THREE.MeshBasicMaterial({ color: '#0284c7', side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    ringCyan.rotation.x = -Math.PI / 2;
    rangoliGroup.add(ringCyan);

    // Center Lotus Seed
    const centerLotus = new THREE.Mesh(
      new THREE.CircleGeometry(0.48, 16),
      new THREE.MeshBasicMaterial({ color: '#ea580c', side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
    );
    centerLotus.rotation.x = -Math.PI / 2;
    rangoliGroup.add(centerLotus);

    // Radial Rangoli Lotus Petal Rays
    for (let r = 0; r < 12; r++) {
      const ang = (r / 12) * Math.PI * 2;
      const ray = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.01, 1.2),
        new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 })
      );
      ray.position.set(Math.cos(ang) * 1.6, 0.005, Math.sin(ang) * 1.6);
      ray.rotation.y = -ang;
      rangoliGroup.add(ray);
    }

    entranceGroup.add(rangoliGroup);

    // G. Framing Lush Greenery & Palm Trees flanking Entrance
    // Tall Leaning Coconut Palm (Left)
    this.createEntrancePalmTree(entranceGroup, -6.5, 2.0, 0.15);
    // Tall Leaning Coconut Palm (Right)
    this.createEntrancePalmTree(entranceGroup, 6.5, 2.0, -0.15);

    // Flowering Ashoka / Neem Trees flanking road
    this.createEntranceAshokaTree(entranceGroup, -7.0, -3.5);
    this.createEntranceAshokaTree(entranceGroup, 7.0, -3.5);

    // Earthen flower pots with blooming marigolds near gate plinths
    [-2.4, 2.4].forEach(px => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.45, 10), this.matTerracottaRoof);
      pot.position.set(px, 0.22, 1.4);
      entranceGroup.add(pot);

      const flowers = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), this.matMarigoldOrange);
      flowers.position.set(px, 0.55, 1.4);
      entranceGroup.add(flowers);
    });

    // Subtle warm golden highlight point light for Level 1 cinematic entrance highlight
    this.entranceHighlightLight = new THREE.PointLight('#f59e0b', 0, 16);
    this.entranceHighlightLight.position.set(0, 5.5, 3.2);
    entranceGroup.add(this.entranceHighlightLight);

    this.villageGroup.add(entranceGroup);
  }

  /**
   * Subtle visual highlight on Rangasthalam village entrance during Level 1 cinematic.
   */
  public setEntranceHighlight(intensity: number): void {
    const clamped = Math.max(0, Math.min(1, intensity));
    if (this.entranceHighlightLight) {
      this.entranceHighlightLight.intensity = clamped * 3.5;
    }
    if (this.entranceSignFaceMat) {
      if (clamped > 0.01) {
        this.entranceSignFaceMat.emissive.setRGB(0.38 * clamped, 0.28 * clamped, 0.1 * clamped);
        this.entranceSignFaceMat.emissiveIntensity = clamped * 0.9;
      } else {
        this.entranceSignFaceMat.emissive.setRGB(0, 0, 0);
        this.entranceSignFaceMat.emissiveIntensity = 0;
      }
    }
  }

  /**
   * Helper: Builds a graceful South Indian coconut palm tree
   */
  private createEntrancePalmTree(parent: THREE.Group, x: number, z: number, lean: number): void {
    const palmGroup = new THREE.Group();
    palmGroup.position.set(x, 0, z);

    // Curved Trunk
    const trunkHeight = 8.5;
    const trunkGeo = new THREE.CylinderGeometry(0.28, 0.42, trunkHeight, 8);
    const trunk = new THREE.Mesh(trunkGeo, this.matTreeTrunk);
    trunk.position.set(lean * 1.5, trunkHeight / 2, 0);
    trunk.rotation.z = lean;
    trunk.castShadow = true;
    palmGroup.add(trunk);

    // Crown of spreading palm fronds
    const crownY = trunkHeight - 0.2;
    const crownX = lean * 3.0;

    for (let f = 0; f < 8; f++) {
      const ang = (f / 8) * Math.PI * 2;
      const frondGeo = new THREE.BoxGeometry(0.4, 0.04, 3.2);
      const frond = new THREE.Mesh(frondGeo, this.matBananaLeaf);
      frond.position.set(
        crownX + Math.cos(ang) * 1.4,
        crownY - 0.3,
        Math.sin(ang) * 1.4
      );
      frond.rotation.y = -ang;
      frond.rotation.x = 0.55;
      palmGroup.add(frond);
    }

    // Cluster of green coconuts
    for (let c = 0; c < 4; c++) {
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), this.matLeafGreen);
      nut.position.set(crownX + (c % 2 === 0 ? 0.2 : -0.2), crownY - 0.4, c > 1 ? 0.2 : -0.2);
      palmGroup.add(nut);
    }

    parent.add(palmGroup);

    this.collisionSystem.addCollider({
      id: `entrance_palm_${x}_${z}`,
      type: 'sphere',
      position: new THREE.Vector3(x, 0, z),
      radius: 0.6,
    });
  }

  /**
   * Helper: Builds an Ashoka / Neem tree
   */
  private createEntranceAshokaTree(parent: THREE.Group, x: number, z: number): void {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);

    // Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 4.2, 8), this.matTreeTrunk);
    trunk.position.y = 2.1;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Layered Dense Conical / Oval Canopy
    const canopy1 = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.6, 8), this.matLeafGreen);
    canopy1.position.y = 4.8;
    canopy1.castShadow = true;
    treeGroup.add(canopy1);

    const canopy2 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.8, 8), this.matGrass);
    canopy2.position.y = 6.2;
    canopy2.castShadow = true;
    treeGroup.add(canopy2);

    parent.add(treeGroup);

    this.collisionSystem.addCollider({
      id: `entrance_ashoka_${x}_${z}`,
      type: 'sphere',
      position: new THREE.Vector3(x, 0, z),
      radius: 0.65,
    });
  }

  /**
   * 3. Central Pandal & Grand Rangoli
   */
  private buildCentralPandalAndRangoli(): void {
    const pandalGroup = new THREE.Group();
    pandalGroup.position.set(0, 0, 0);

    // Grand 10m Festival Rangoli on Central Square
    const rangoliColors = ['#fffbeb', '#dc2626', '#facc15', '#059669', '#f97316'];
    const rings = [
      { rIn: 0.2, rOut: 1.8, c: rangoliColors[0] },
      { rIn: 2.0, rOut: 2.5, c: rangoliColors[1] },
      { rIn: 2.7, rOut: 3.6, c: rangoliColors[2] },
      { rIn: 3.8, rOut: 4.8, c: rangoliColors[3] },
      { rIn: 5.0, rOut: 5.4, c: rangoliColors[4] },
    ];
    rings.forEach(r => {
      const geo = new THREE.RingGeometry(r.rIn, r.rOut, 32);
      const mat = new THREE.MeshBasicMaterial({ color: r.c, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.025;
      pandalGroup.add(mesh);
    });

    // PANDAL (Under Construction for Vinayaka Chavithi)
    // 4 Main Bamboo & Teak Corner Poles
    const corners = [
      { x: -3.8, z: -3.8 },
      { x: 3.8, z: -3.8 },
      { x: -3.8, z: 3.8 },
      { x: 3.8, z: 3.8 },
    ];

    corners.forEach((c, idx) => {
      // Upright Bamboo/Wood pole
      const poleGeo = new THREE.CylinderGeometry(0.2, 0.24, 5.4, 10);
      const pole = new THREE.Mesh(poleGeo, this.matBambooDry);
      pole.position.set(c.x, 2.7, c.z);
      pole.castShadow = true;
      pandalGroup.add(pole);

      // Banana stalks tied to pandal posts
      const bananaStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 3.0, 8), this.matBananaLeaf);
      bananaStalk.position.set(c.x + 0.25, 1.5, c.z);
      pandalGroup.add(bananaStalk);

      // Solid pillar collision
      this.collisionSystem.addCollider({
        id: `pandal_pole_${idx}`,
        type: 'sphere',
        position: new THREE.Vector3(c.x, 0, c.z),
        radius: 0.65,
      });
    });

    // Raised Idol Altar / Pedestal (Decorated wooden platform - shared foundation)
    const stageGeo = new THREE.CylinderGeometry(2.4, 2.8, 0.7, 16);
    const stageMat = new THREE.MeshLambertMaterial({ color: '#b45309' });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.set(0, 0.35, 0);
    stage.castShadow = true;
    pandalGroup.add(stage);

    // Front Entrance Crossbeam at y = 5.2 (Eaves level)
    const frontBeam = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.22, 0.22), this.matBambooDry);
    frontBeam.position.set(0, 5.2, 3.8);
    pandalGroup.add(frontBeam);

    // 1. Traditional Indian Entrance Downward V-Shaped Cloth Decorations
    // Scalloped pennant frills in auspicious festive colors: Saffron, Turmeric, Rani Pink, Green, Ivory
    const frontVFrills = this.createVShapedClothBorder(
      7.6,
      ['#ea580c', '#facc15', '#e11d48', '#059669', '#fffbeb'],
      0.48,
      0.35,
      1.0
    );
    frontVFrills.position.set(0, 5.18, 3.83);
    pandalGroup.add(frontVFrills);

    // Rear Eaves Downward V-Cloth Decorations
    const rearVFrills = this.createVShapedClothBorder(
      7.6,
      ['#facc15', '#ea580c', '#059669', '#e11d48', '#fffbeb'],
      0.48,
      0.35,
      1.0
    );
    rearVFrills.rotation.y = Math.PI;
    rearVFrills.position.set(0, 5.18, -3.83);
    pandalGroup.add(rearVFrills);

    // Right Side Eaves Downward V-Cloth Decorations
    const rightVFrills = this.createVShapedClothBorder(
      7.6,
      ['#ea580c', '#059669', '#facc15', '#fffbeb', '#e11d48'],
      0.48,
      0.35,
      1.0
    );
    rightVFrills.rotation.y = -Math.PI / 2;
    rightVFrills.position.set(3.82, 5.18, 0);
    pandalGroup.add(rightVFrills);

    // Grand Dedicated Traditional Rangoli (Muggu) in front of Mandapam entrance steps
    this.buildGrandEntranceRangoli(pandalGroup);

    // Green Fresh Mango Leaf Toran (Mamidaku Thoranam) & Marigold Garlands
    const toranBanner = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.1, 0.04), this.matBananaLeaf);
    toranBanner.position.set(0, 5.26, 3.84);
    pandalGroup.add(toranBanner);

    const entranceMarigold = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 7.6, 8), this.matMarigoldOrange);
    entranceMarigold.rotation.z = Math.PI / 2;
    entranceMarigold.position.set(0, 5.12, 3.84);
    pandalGroup.add(entranceMarigold);

    // Traditional Auspicious Brass Kalash with Coconut and Mango Leaves on Carved Wooden Stool (Left entrance)
    const kalashStand = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.65, 10), this.matTeakWood);
    kalashStand.position.set(-3.2, 0.325, 3.7);
    pandalGroup.add(kalashStand);

    const brassPot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), this.matBrass);
    brassPot.position.set(-3.2, 0.78, 3.7);
    pandalGroup.add(brassPot);

    const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshLambertMaterial({ color: '#573318' }));
    coconut.position.set(-3.2, 0.98, 3.7);
    pandalGroup.add(coconut);

    // Traditional Hanging Brass Temple Bells from rafters
    [-1.8, 1.8].forEach(bx => {
      const bellChain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), this.matBrass);
      bellChain.position.set(bx, 4.65, 3.6);
      pandalGroup.add(bellChain);

      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 8), this.matBrass);
      bell.position.set(bx, 4.15, 3.6);
      pandalGroup.add(bell);
    });

    // 2. Physical Association Signboard (Millennials Youth Association) at the RIGHT SIDE of entrance
    this.buildAssociationSignboard(pandalGroup);

    // 3. Permanent Mandapam Organizer NPC (Anand) at the LEFT SIDE of entrance
    this.mandapamOrganizerNPC = new MandapamOrganizerNPC(-2.4, 3.6, this.currentLevel);
    pandalGroup.add(this.mandapamOrganizerNPC.group);

    // Register Organizer solid collision
    this.collisionSystem.addCollider({
      id: 'mandapam_organizer_npc_solid',
      type: 'sphere',
      position: new THREE.Vector3(-2.4, 0.9, 3.6),
      radius: 0.55,
    });

    // 4. Colored Decorative Festival Light String along the front eave
    const frontEaveLights = this.createDecorativeLightString(
      new THREE.Vector3(-3.8, 5.15, 3.86),
      new THREE.Vector3(3.8, 5.15, 3.86),
      16,
      ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#f97316']
    );
    pandalGroup.add(frontEaveLights);

    // Warm Ambient Point Lights for Mandapam (Controlled smoothly by time-of-day)
    const frontWarmLight = new THREE.PointLight('#f59e0b', 0.0, 14);
    frontWarmLight.position.set(0, 4.8, 3.8);
    frontWarmLight.userData = { maxIntensity: 2.2 };
    pandalGroup.add(frontWarmLight);
    this.mandapamDecorativeLights.push(frontWarmLight);

    // Dynamic Level Mandapam Container
    pandalGroup.add(this.mandapamDynamicContainer);

    // Build the 3 distinct Level event variations
    this.buildMandapamLevel1_Siddham();
    this.buildMandapamLevel2_Utsavam();
    this.buildMandapamLevel3_Nimajjanam();

    // Activate the appropriate Mandapam for the active level
    this.setLevel(this.currentLevel);

    // Register stage solid obstacle
    this.collisionSystem.addCollider({
      id: 'central_pandal_stage',
      type: 'sphere',
      position: new THREE.Vector3(0, 0, 0),
      radius: 2.7,
    });

    this.villageGroup.add(pandalGroup);
  }

  /**
   * LEVEL 1 MANDAPAM: "SIDDHAM" — Under Construction & Festival Preparation
   * Representing authentic, believable preparation activity:
   * - Bamboo scaffolding frame with multi-tier poles and coir rope lashings
   * - Wooden scaffolding ladder and staging walkway planks
   * - Worker 1 (Raju) on scaffold platform actively tying ropes and hanging canopy
   * - Worker 2 (Somanna) on stage platform modeling eco-friendly unbaked clay idol
   * - Partially installed decorations (side downward V-cloth partially hung with rolled fabric and dangling rope)
   * - Construction materials: stack of 8 raw bamboo poles, coiled coir ropes, carpenter toolbox, lime & turmeric paint pots
   * - Fresh unbaked Lord Ganesha clay idol under craftsmanship with clay mounds, sculptor paddle, and water chembu
   * - Cane baskets with marigold flower heads and 21 sacred leaves
   * - Paper bag beside Ganesh Mandapam on carved pedestal
   */
  private buildMandapamLevel1_Siddham(): void {
    const group = this.mandapamLevel1Group;
    group.name = 'mandapam_level_1_siddham';

    // Bamboo Scaffolding Crossbeams (Raw under-construction framework)
    const beamPositions = [
      { x: 0, z: -3.8, sx: 7.8, sz: 0.2 },
      { x: 0, z: 3.8, sx: 7.8, sz: 0.2 },
      { x: -3.8, z: 0, sx: 0.2, sz: 7.8 },
      { x: 3.8, z: 0, sx: 0.2, sz: 7.8 },
    ];
    beamPositions.forEach(b => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(b.sx, 0.22, b.sz), this.matBambooDry);
      beam.position.set(b.x, 5.2, b.z);
      group.add(beam);
    });

    // Unfinished Bamboo Roof Slats (Partially covered with palm thatch)
    for (let i = -3; i <= 3; i += 0.9) {
      const slat = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 7.6, 6), this.matBamboo);
      slat.rotation.x = Math.PI / 2;
      slat.position.set(i, 5.3, 0);
      group.add(slat);
    }

    // Partially installed side V-shaped cloth decoration (Shows work in progress!)
    // Hung 60% with rolled fabric bolt and dangling coir rope at the end
    const sideVFrills = this.createVShapedClothBorder(
      7.6,
      ['#facc15', '#ea580c', '#059669', '#e11d48', '#fffbeb'],
      0.45,
      0.35,
      0.6 // 60% hung
    );
    sideVFrills.rotation.y = Math.PI / 2;
    sideVFrills.position.set(-3.82, 5.18, 0);
    group.add(sideVFrills);

    // String of decorative lights partially hung along the side scaffold
    const sideScaffoldLights = this.createDecorativeLightString(
      new THREE.Vector3(-3.84, 5.15, -3.8),
      new THREE.Vector3(-3.84, 5.15, 1.2),
      10,
      ['#f59e0b', '#22c55e', '#ef4444', '#3b82f6', '#f97316']
    );
    group.add(sideScaffoldLights);

    // Sacred Raw Clay Sculpting Table
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.4), this.matTeakWood);
    tableTop.position.set(0, 0.76, 0);
    group.add(tableTop);

    // The Eco-Friendly Unbaked Clay Idol of Lord Ganesha (Under craftsmanship)
    const clayMat = new THREE.MeshLambertMaterial({ color: '#573318' }); // Rich wet earthen clay
    // Body & Belly
    const idolBelly = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 12), clayMat);
    idolBelly.position.set(0, 1.25, 0);
    idolBelly.castShadow = true;
    group.add(idolBelly);

    // Chest & Shoulders
    const idolChest = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.45, 10), clayMat);
    idolChest.position.set(0, 1.6, 0);
    group.add(idolChest);

    // Elephant Head with Trunk curving upwards
    const idolHead = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), clayMat);
    idolHead.position.set(0, 1.95, 0.05);
    group.add(idolHead);

    const idolTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.5, 8), clayMat);
    idolTrunk.position.set(0, 1.78, 0.32);
    idolTrunk.rotation.x = 0.4;
    group.add(idolTrunk);

    // Large fan-shaped ears
    [-0.32, 0.32].forEach(ex => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.04), clayMat);
      ear.position.set(ex, 1.95, 0.02);
      ear.rotation.y = ex > 0 ? 0.3 : -0.3;
      group.add(ear);
    });

    // Mounds of Fresh Sculpting Clay
    const clayMound1 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), clayMat);
    clayMound1.scale.set(1.4, 0.7, 1.2);
    clayMound1.position.set(0.7, 0.85, 0.3);
    group.add(clayMound1);

    // Sculptor's Wooden Smoothing Paddle & Water Chembu
    const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.4), this.matTeakWood);
    paddle.position.set(-0.7, 0.84, 0.2);
    paddle.rotation.y = 0.4;
    group.add(paddle);

    const chembuPot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.3, 10), this.matBrass);
    chembuPot.position.set(-0.75, 0.95, -0.2);
    group.add(chembuPot);

    // Woven Cane Baskets of Marigold Flowers & Leaves on Stage
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.25, 12), this.matBambooDry);
    basket.position.set(1.2, 0.82, -0.4);
    group.add(basket);

    const flowersInBasket = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), this.matMarigoldOrange);
    flowersInBasket.position.set(1.2, 0.96, -0.4);
    group.add(flowersInBasket);

    // Believable Construction Workers (Worker 1 on scaffold, Worker 2 on stage)
    this.buildLevel1ConstructionWorkers(group);

    // Believable Construction Props & Materials (Bamboo stacks, coir rolls, toolbox, paints, scaffolding ladder)
    this.buildLevel1ConstructionProps(group);

    // Warm Altar Sanctuary Glow (Controlled smoothly by time-of-day)
    const altarLight = new THREE.PointLight('#f59e0b', 0.0, 18);
    altarLight.position.set(0, 2.4, 0);
    altarLight.userData = { maxIntensity: 2.4 };
    group.add(altarLight);
    this.mandapamDecorativeLights.push(altarLight);

    // Build the Paper Bag beside the Ganesh Mandapam for Level 1 Collection
    this.buildMandapamPaperBagStand(group);
  }

  /**
   * LEVEL 1 INTERACTIVE PAPER BAG BESIDE GANESH MANDAPAM
   * Placed on a carved wooden stool outside the Mandapam on the LEFT SIDE at (-5.8, 0, 3.5).
   * Clearly recognizable with brown Kraft paper texture, rolled rim, twine handles,
   * saffron ribbon, and an auspicious golden aura ring.
   */
  private buildMandapamPaperBagStand(mandapamGroup: THREE.Group): void {
    const bagPos = this.paperBagPosition; // (-5.8, 0.45, 3.5)
    this.mandapamPaperBagGroup = new THREE.Group();
    this.mandapamPaperBagGroup.name = 'mandapam_paper_bag_group';
    this.mandapamPaperBagGroup.position.set(bagPos.x, 0, bagPos.z);

    // 1. Carved Wooden Pedestal Stool
    const stoolMat = new THREE.MeshLambertMaterial({ color: '#573318' });
    const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.45, 12), stoolMat);
    stoolLeg.position.y = 0.225;
    stoolLeg.castShadow = true;
    this.mandapamPaperBagGroup.add(stoolLeg);

    const stoolTop = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.08, 16), stoolMat);
    stoolTop.position.y = 0.48;
    stoolTop.castShadow = true;
    this.mandapamPaperBagGroup.add(stoolTop);

    // 2. Ceremonial Brass Plate on Stool
    const thaliMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.8, roughness: 0.25 });
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.4, 0.04, 16), thaliMat);
    plate.position.y = 0.53;
    this.mandapamPaperBagGroup.add(plate);

    // 3. Handcrafted 3D Kraft Paper Bag
    const paperBagMeshGroup = new THREE.Group();
    paperBagMeshGroup.position.y = 0.55;

    // Kraft paper body
    const matKraft = new THREE.MeshStandardMaterial({ color: '#d4a373', roughness: 0.85, metalness: 0.04 });
    const bagBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.38), matKraft);
    bagBody.position.y = 0.35;
    bagBody.castShadow = true;
    bagBody.receiveShadow = true;
    paperBagMeshGroup.add(bagBody);

    // Rolled Top Rim Collar
    const rimMat = new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.78 });
    const rimMesh = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.07, 0.41), rimMat);
    rimMesh.position.y = 0.72;
    paperBagMeshGroup.add(rimMesh);

    // Saffron Auspicious Ribbon Band
    const bandMat = new THREE.MeshBasicMaterial({ color: '#ea580c' });
    const ribbonBand = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.09, 0.39), bandMat);
    ribbonBand.position.y = 0.38;
    paperBagMeshGroup.add(ribbonBand);

    // Jute Twine Handles (Front and Back)
    const twineMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
    [-0.2, 0.2].forEach(zOffset => {
      const handleCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.16, 0.7, zOffset),
        new THREE.Vector3(-0.12, 0.95, zOffset),
        new THREE.Vector3(0.12, 0.95, zOffset),
        new THREE.Vector3(0.16, 0.7, zOffset),
      ]);
      const handleMesh = new THREE.Mesh(
        new THREE.TubeGeometry(handleCurve, 12, 0.016, 6, false),
        twineMat
      );
      paperBagMeshGroup.add(handleMesh);
    });

    this.mandapamPaperBagGroup.add(paperBagMeshGroup);

    // 4. Auspicious Golden Aura Beacon Ring on the Ground
    this.mandapamBagBeaconRing = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 1.25, 24),
      new THREE.MeshBasicMaterial({
        color: '#facc15',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      })
    );
    this.mandapamBagBeaconRing.rotation.x = -Math.PI / 2;
    this.mandapamBagBeaconRing.position.y = 0.035;
    this.mandapamPaperBagGroup.add(this.mandapamBagBeaconRing);

    // Subtle warm golden point light highlighting the paper bag
    const bagLight = new THREE.PointLight('#f59e0b', 1.4, 6.0);
    bagLight.position.set(0, 0.85, 0);
    this.mandapamPaperBagGroup.add(bagLight);

    // Register solid obstacle for the stool so Ramu cannot walk through it
    this.collisionSystem.removeCollider('mandapam_paper_bag_stand');
    this.collisionSystem.addCollider({
      id: 'mandapam_paper_bag_stand',
      type: 'sphere',
      position: new THREE.Vector3(bagPos.x, 0, bagPos.z),
      radius: 0.6,
    });

    mandapamGroup.add(this.mandapamPaperBagGroup);

    this.mandapamPaperBagGroup.visible = true;
    this.isMandapamBagPickedUp = false;

    // 5. Build the Submitted Paper Bag on the Mandapam Altar (Initial invisible)
    this.mandapamSubmittedBagGroup = new THREE.Group();
    this.mandapamSubmittedBagGroup.name = 'mandapam_submitted_leaves_bag';
    this.mandapamSubmittedBagGroup.position.set(0.5, 0.82, 0.35); // Placed on clay table beside idol

    // Submitted Bag Body
    const subBag = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.38), matKraft);
    subBag.position.y = 0.35;
    this.mandapamSubmittedBagGroup.add(subBag);

    const subRim = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.07, 0.41), rimMat);
    subRim.position.y = 0.72;
    this.mandapamSubmittedBagGroup.add(subRim);

    // Lush cluster of 21 sacred leaves overflowing the bag
    const leafColors = ['#15803d', '#16a34a', '#22c55e', '#4ade80', '#84cc16'];
    for (let i = 0; i < 18; i++) {
      const angle = (i * Math.PI * 2) / 18;
      const leafMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 6, 6),
        new THREE.MeshLambertMaterial({ color: leafColors[i % leafColors.length] })
      );
      leafMesh.scale.set(1.4, 0.3, 1.6);
      leafMesh.position.set(Math.cos(angle) * 0.22, 0.78 + (i % 3) * 0.04, Math.sin(angle) * 0.14);
      leafMesh.rotation.set(Math.sin(angle) * 0.3, angle, Math.cos(angle) * 0.2);
      this.mandapamSubmittedBagGroup.add(leafMesh);
    }

    // Marigold Garland Crown around submitted bag
    for (let m = 0; m < 10; m++) {
      const mAngle = (m * Math.PI * 2) / 10;
      const marigold = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.065, 1),
        new THREE.MeshLambertMaterial({ color: m % 2 === 0 ? '#f59e0b' : '#ea580c' })
      );
      marigold.position.set(Math.cos(mAngle) * 0.28, 0.88, Math.sin(mAngle) * 0.18);
      this.mandapamSubmittedBagGroup.add(marigold);
    }

    this.mandapamSubmittedBagGroup.visible = false;
    mandapamGroup.add(this.mandapamSubmittedBagGroup);
  }

  /**
   * LEVEL 2 MANDAPAM: "UTSAVAM" — The Grand Festive Celebration
   * - Rich royal saffron & crimson silk canopy with gold tassels
   * - Fully painted and decorated Lord Ganesha idol with radiant golden crown
   * - Two large carved brass Kuthu Vilakku multi-wick deepam lamps with glowing flame light
   * - Grand offering thalis: steamed modaks, sesame laddus, sugarcane, coconuts
   * - Musical stage: Mridangam / Dholak drums and brass cymbals
   * - Festive marigold garlands and fairy lights
   */
  /**
   * LEVEL 2 MANDAPAM: "UTSAVAM" — The Completed Traditional Mandapam & Eco-Friendly Clay Ganesh
   * - Fully finished traditional Mandapam (Level 1 construction appearance completely removed)
   * - Colorful downward V-shaped cloth decorations along all 4 eaves
   * - Fresh marigold & jasmine flower garlands, mango leaf toranams, and banana tree posts
   * - Intricate traditional Rangoli (Muggu) on the stage floor with glowing clay diyas
   * - Traditional Eco-Friendly Natural Clay Ganesh Murti (Matti Vinayakudu)
   *   - Resembles natural unpainted earthy terracotta clay
   *   - Clearly recognizable Lord Ganesha: elephant head, large ears, curved trunk holding sweet modak,
   *     Ekadanta (broken tusk), 4 arms with Abhaya Mudra, pot belly (Lambodara) with sacred thread
   *   - Small traditional sandalwood & kumkum tilak on forehead
   *   - Solidly grounded upon an ornate carved teakwood & velvet peetham on the stage
   *   - Small respectful Mushak (rat vahana) beside the idol holding a modak and looking up
   * - Flanking tall brass Kuthu Vilakku oil lamps with warm glowing light
   * - Grand offering thali with modaks, laddus, coconuts, and dholak drums
   * - Smooth decorative lighting and celebratory festive atmosphere
   */
  private buildMandapamLevel2_Utsavam(): void {
    const group = this.mandapamLevel2Group;
    group.name = 'mandapam_level_2_utsavam';

    // 1. FINISHED POLISHED ROOF CANOPY (Rich Saffron Silk with Golden Brocade Borders)
    const canopyGeo = new THREE.ConeGeometry(5.8, 1.8, 4);
    const canopy = new THREE.Mesh(canopyGeo, this.matSaffronCloth);
    canopy.position.set(0, 6.1, 0);
    canopy.rotation.y = Math.PI / 4;
    group.add(canopy);

    // Crimson Silk Valance Frills along canopy rim
    const valance = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.4, 6.6), this.matCrimsonCloth);
    valance.position.set(0, 5.25, 0);
    group.add(valance);

    // Golden brocade trim along the valance
    const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(6.64, 0.08, 6.64), this.matBrass);
    goldTrim.position.set(0, 5.08, 0);
    group.add(goldTrim);

    // 2. COLORFUL DOWNWARD V-SHAPED CLOTH DECORATIONS (100% completed along all 4 eaves)
    const festiveClothColors = ['#ea580c', '#facc15', '#dc2626', '#059669', '#fffbeb'];

    // Front Eave V-Frills (Facing South entrance)
    const frontVFrills = this.createVShapedClothBorder(7.6, festiveClothColors, 0.52, 0.35, 1.0);
    frontVFrills.position.set(0, 5.18, 3.84);
    group.add(frontVFrills);

    // Rear Eave V-Frills
    const rearVFrills = this.createVShapedClothBorder(7.6, festiveClothColors, 0.52, 0.35, 1.0);
    rearVFrills.rotation.y = Math.PI;
    rearVFrills.position.set(0, 5.18, -3.84);
    group.add(rearVFrills);

    // Left Eave V-Frills
    const leftVFrills = this.createVShapedClothBorder(7.6, festiveClothColors, 0.52, 0.35, 1.0);
    leftVFrills.rotation.y = Math.PI / 2;
    leftVFrills.position.set(-3.84, 5.18, 0);
    group.add(leftVFrills);

    // Right Eave V-Frills
    const rightVFrills = this.createVShapedClothBorder(7.6, festiveClothColors, 0.52, 0.35, 1.0);
    rightVFrills.rotation.y = -Math.PI / 2;
    rightVFrills.position.set(3.84, 5.18, 0);
    group.add(rightVFrills);

    // 3. FRESH FLOWER GARLANDS & MANGO LEAF TORANAMS
    // Hanging Mango Leaf Toranam across the entrance
    const toranBanner = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.12, 0.04), this.matBananaLeaf);
    toranBanner.position.set(0, 5.28, 3.85);
    group.add(toranBanner);

    // Double strand Marigold & Jasmine Garlands draped in festoons across the front entrance
    const frontMarigoldUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 7.6, 8), this.matMarigoldOrange);
    frontMarigoldUpper.rotation.z = Math.PI / 2;
    frontMarigoldUpper.position.set(0, 5.14, 3.85);
    group.add(frontMarigoldUpper);

    const frontJasmineLower = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 7.5, 8), this.matWallWhite);
    frontJasmineLower.rotation.z = Math.PI / 2;
    frontJasmineLower.position.set(0, 5.06, 3.85);
    group.add(frontJasmineLower);

    // Pillar Spiral Flower Garlands on 4 corner posts
    const pillarPositions = [
      { x: -3.8, z: -3.8 },
      { x: 3.8, z: -3.8 },
      { x: -3.8, z: 3.8 },
      { x: 3.8, z: 3.8 },
    ];
    pillarPositions.forEach(p => {
      // Orange & Yellow Marigold strings wrapped around pillars
      for (let h = 0.8; h <= 4.8; h += 0.8) {
        const ringGeo = new THREE.TorusGeometry(0.28, 0.04, 6, 12);
        const ringMat = (h % 1.6 === 0) ? this.matMarigoldOrange : this.matMarigoldYellow;
        const flowerRing = new THREE.Mesh(ringGeo, ringMat);
        flowerRing.rotation.x = Math.PI / 2;
        flowerRing.position.set(p.x, h, p.z);
        group.add(flowerRing);
      }

      // Fresh Green Banana Tree Stalks with broad leaves tied with golden cords
      const bananaTree = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 3.4, 8), this.matBananaLeaf);
      bananaTree.position.set(p.x + (p.x > 0 ? -0.28 : 0.28), 1.7, p.z + (p.z > 0 ? -0.28 : 0.28));
      group.add(bananaTree);

      // Banana Leaf Fronds arching outward
      for (let leaf = 0; leaf < 3; leaf++) {
        const frond = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.02, 1.2), this.matBananaLeaf);
        frond.position.set(bananaTree.position.x, 3.2, bananaTree.position.z);
        frond.rotation.y = (leaf / 3) * Math.PI * 2;
        frond.rotation.x = 0.4;
        group.add(frond);
      }
    });

    // 4. INTRICATE FESTIVE RANGOLI (MUGGU) ON MANDAPAM PLATFORM
    // Multi-color sacred floral mandala rangoli in front of the idol altar
    const rangoliGroup = new THREE.Group();
    rangoliGroup.position.set(0, 0.705, 1.1);

    const rangoliPetals = [
      { rIn: 0.05, rOut: 0.35, c: '#dc2626' }, // Kumkum center
      { rIn: 0.36, rOut: 0.65, c: '#facc15' }, // Turmeric gold
      { rIn: 0.66, rOut: 0.95, c: '#fffbeb' }, // Rice flour white
      { rIn: 0.96, rOut: 1.25, c: '#ea580c' }, // Saffron orange
      { rIn: 1.26, rOut: 1.45, c: '#059669' }, // Leaf green border
    ];
    rangoliPetals.forEach(rp => {
      const geo = new THREE.RingGeometry(rp.rIn, rp.rOut, 24);
      const mat = new THREE.MeshBasicMaterial({ color: rp.c, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = -Math.PI / 2;
      rangoliGroup.add(ring);
    });

    // Glowing Clay Diyas placed along Rangoli cardinal points
    const diyaAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
    diyaAngles.forEach(ang => {
      const dx = Math.cos(ang) * 1.35;
      const dz = Math.sin(ang) * 1.35;

      const diyaClay = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.04, 8), this.matClaySoil);
      diyaClay.position.set(dx, 0.02, dz);
      rangoliGroup.add(diyaClay);

      const diyaFlame = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), new THREE.MeshBasicMaterial({ color: '#fef08a' }));
      diyaFlame.position.set(dx, 0.05, dz);
      rangoliGroup.add(diyaFlame);
    });
    group.add(rangoliGroup);

    // 5. CARVED TEAKWOOD SINGHASAN (THRONE / PEETHAM) ON STAGE
    // Solidly grounded base on the stage floor (y = 0.70 to y = 1.05)
    const throneBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 1.8), this.matTeakWood);
    throneBase.position.set(0, 0.875, -0.1);
    throneBase.castShadow = true;
    group.add(throneBase);

    // Crimson Velvet Seat Cushion
    const velvetPadMat = new THREE.MeshLambertMaterial({ color: '#991b1b' });
    const velvetPad = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 1.6), velvetPadMat);
    velvetPad.position.set(0, 1.08, -0.1);
    group.add(velvetPad);

    // Carved Teakwood Throne Backrest
    const throneBack = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.8, 0.18), this.matTeakWood);
    throneBack.position.set(0, 1.95, -0.85);
    group.add(throneBack);

    // Ornate Golden Prabhavali (Radiant Divine Arch behind Ganesha)
    const prabhavali = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.1, 8, 28, Math.PI), this.matBrass);
    prabhavali.position.set(0, 2.45, -0.82);
    group.add(prabhavali);

    // Lotus Footrest in front of the throne
    const lotusFootrestMat = new THREE.MeshLambertMaterial({ color: '#f43f5e' });
    const lotusFootrest = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.14, 16), lotusFootrestMat);
    lotusFootrest.position.set(0, 0.77, 0.65);
    group.add(lotusFootrest);

    // =========================================================================
    // 6. THE ECO-FRIENDLY NATURAL CLAY GANESH MURTI (MATTI VINAYAKUDU)
    // =========================================================================
    // Material: Natural unpainted earthy river clay / terracotta
    const matNaturalClay = new THREE.MeshStandardMaterial({
      color: '#8d4d2e', // Warm earthy unbaked terracotta clay
      roughness: 0.88,
      metalness: 0.05,
    });
    const matClayDark = new THREE.MeshStandardMaterial({
      color: '#6d391e', // Darker shaded natural clay for folds and details
      roughness: 0.92,
    });
    const matSandalwoodTilak = new THREE.MeshBasicMaterial({ color: '#fef08a' }); // Sandalwood paste yellow
    const matKumkumTilak = new THREE.MeshBasicMaterial({ color: '#b91c1c' }); // Vermilion red
    const matSacredThread = new THREE.MeshBasicMaterial({ color: '#f8fafc' }); // White holy thread
    const matGoldClayAccent = new THREE.MeshStandardMaterial({
      color: '#d97706',
      roughness: 0.6,
      metalness: 0.35,
    });

    const idolGroup = new THREE.Group();
    idolGroup.position.set(0, 1.13, -0.05); // Solidly seated on the velvet throne cushion (zero floating!)

    // A. Folded Legs (Traditional Lalitasana posture)
    // Left leg folded flat horizontally along the throne
    const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.75, 12), matNaturalClay);
    leftThigh.rotation.z = Math.PI / 2;
    leftThigh.position.set(-0.35, 0.15, 0.1);
    idolGroup.add(leftThigh);

    // Right leg gracefully descending toward the lotus footrest
    const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 0.55, 12), matNaturalClay);
    rightThigh.rotation.x = 0.45;
    rightThigh.position.set(0.35, 0.05, 0.25);
    idolGroup.add(rightThigh);

    const rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.45, 10), matNaturalClay);
    rightCalf.position.set(0.35, -0.22, 0.48);
    idolGroup.add(rightCalf);

    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.26), matNaturalClay);
    rightFoot.position.set(0.35, -0.36, 0.52);
    idolGroup.add(rightFoot);

    // B. Traditional Clay Dhoti (Pancha) with sculpted cloth folds
    const dhotiFold = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.35, 16), matClayDark);
    dhotiFold.position.set(0, 0.18, 0.05);
    idolGroup.add(dhotiFold);

    // Ornate sculpted clay waistband (Katisutra)
    const waistband = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.05, 8, 16), matGoldClayAccent);
    waistband.rotation.x = Math.PI / 2;
    waistband.position.set(0, 0.32, 0.05);
    idolGroup.add(waistband);

    // C. Pot Belly (Lambodara) — quintessential sign of Lord Ganesha
    const bellyGeo = new THREE.SphereGeometry(0.52, 16, 16);
    bellyGeo.scale(1.05, 0.95, 1.15);
    const belly = new THREE.Mesh(bellyGeo, matNaturalClay);
    belly.position.set(0, 0.55, 0.12);
    belly.castShadow = true;
    idolGroup.add(belly);

    // Sacred Serpent Band (Naga Bandha) gently tied across the belly
    const nagaBandha = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.035, 8, 20), matClayDark);
    nagaBandha.rotation.x = Math.PI / 2 - 0.2;
    nagaBandha.position.set(0, 0.52, 0.16);
    idolGroup.add(nagaBandha);

    // D. Chest & Torso with Sacred Brahmin Thread (Yajnopavita)
    const chestGeo = new THREE.CylinderGeometry(0.38, 0.48, 0.52, 14);
    const chest = new THREE.Mesh(chestGeo, matNaturalClay);
    chest.position.set(0, 0.95, 0.04);
    chest.castShadow = true;
    idolGroup.add(chest);

    // Sacred Thread draped diagonally across left shoulder to right waist
    const threadGeo = new THREE.TorusGeometry(0.45, 0.02, 6, 20);
    const thread = new THREE.Mesh(threadGeo, matSacredThread);
    thread.rotation.y = 0.5;
    thread.rotation.z = 0.6;
    thread.position.set(0.04, 0.85, 0.08);
    idolGroup.add(thread);

    // E. Four Sacred Arms (Chaturbhuja)
    // 1. Lower Right Hand: Raised in ABHAYA MUDRA (Blessing & Protection gesture)
    const armLR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.45, 10), matNaturalClay);
    armLR.position.set(0.55, 0.82, 0.22);
    armLR.rotation.z = -0.6;
    armLR.rotation.x = -0.3;
    idolGroup.add(armLR);

    const palmR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.05), matNaturalClay);
    palmR.position.set(0.72, 1.05, 0.32);
    palmR.rotation.y = -0.2;
    idolGroup.add(palmR);

    // Red lotus / blessing symbol in center of blessing palm
    const palmSymbol = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), matKumkumTilak);
    palmSymbol.position.set(0.72, 1.05, 0.35);
    idolGroup.add(palmSymbol);

    // 2. Lower Left Hand: Holding Modak Patra (Sweet bowl)
    const armLL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.45, 10), matNaturalClay);
    armLL.position.set(-0.52, 0.78, 0.24);
    armLL.rotation.z = 0.65;
    armLL.rotation.x = -0.25;
    idolGroup.add(armLL);

    // Small shallow bowl with modaks
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.08, 12), matGoldClayAccent);
    bowl.position.set(-0.68, 0.68, 0.42);
    idolGroup.add(bowl);

    const bowlModak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.09, 8), matSandalwoodTilak);
    bowlModak.position.set(-0.68, 0.74, 0.42);
    idolGroup.add(bowlModak);

    // 3. Upper Right Hand: Holding ANKUSHA (Sacred Elephant Goad)
    const armUR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.42, 10), matNaturalClay);
    armUR.position.set(0.58, 1.18, -0.05);
    armUR.rotation.z = -1.1;
    idolGroup.add(armUR);

    const ankushaRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), matGoldClayAccent);
    ankushaRod.position.set(0.76, 1.35, -0.05);
    idolGroup.add(ankushaRod);

    const ankushaHook = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 10, Math.PI), matGoldClayAccent);
    ankushaHook.position.set(0.76, 1.48, -0.05);
    idolGroup.add(ankushaHook);

    // 4. Upper Left Hand: Holding PASHA (Sacred Divine Noose / Lotus)
    const armUL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.42, 10), matNaturalClay);
    armUL.position.set(-0.58, 1.18, -0.05);
    armUL.rotation.z = 1.1;
    idolGroup.add(armUL);

    const pashaNoose = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16), matGoldClayAccent);
    pashaNoose.position.set(-0.76, 1.38, -0.05);
    idolGroup.add(pashaNoose);

    // F. NOBLE ELEPHANT HEAD (Gajanana)
    const headGeo = new THREE.SphereGeometry(0.38, 16, 16);
    headGeo.scale(1.1, 1.0, 1.15);
    const head = new THREE.Mesh(headGeo, matNaturalClay);
    head.position.set(0, 1.42, 0.12);
    head.castShadow = true;
    idolGroup.add(head);

    // Dual Temporal Lobes on upper forehead (Kumbha)
    [-0.14, 0.14].forEach(kx => {
      const kumbha = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), matNaturalClay);
      kumbha.position.set(kx, 1.62, 0.2);
      idolGroup.add(kumbha);
    });

    // Large Traditional Elephant Ears (Soorpakarna)
    [-1, 1].forEach(side => {
      const earGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.04, 12);
      earGeo.scale(1.0, 0.15, 1.4);
      const ear = new THREE.Mesh(earGeo, matNaturalClay);
      ear.rotation.y = side * 0.4;
      ear.rotation.z = side * 0.3;
      ear.position.set(side * 0.52, 1.48, 0.05);
      idolGroup.add(ear);

      // Inner ear contour
      const innerEar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.045, 10), matClayDark);
      innerEar.rotation.y = side * 0.4;
      innerEar.rotation.z = side * 0.3;
      innerEar.position.set(side * 0.52, 1.48, 0.06);
      idolGroup.add(innerEar);
    });

    // Traditional Ekadanta Tusks:
    // Right Tusk: Broken tusk (Ekadanta, representing wisdom and writing the Mahabharata)
    const brokenTusk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.14, 8), matSacredThread);
    brokenTusk.position.set(0.18, 1.28, 0.38);
    brokenTusk.rotation.x = 0.5;
    brokenTusk.rotation.z = -0.2;
    idolGroup.add(brokenTusk);

    // Left Tusk: Smooth, full intact tusk
    const fullTusk = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.28, 8), matSacredThread);
    fullTusk.position.set(-0.18, 1.22, 0.42);
    fullTusk.rotation.x = 0.6;
    fullTusk.rotation.z = 0.2;
    idolGroup.add(fullTusk);

    // Curved Elephant Trunk holding a sweet Modak at the tip
    // Sculpted natural segments curving gracefully to Ganesha's left
    const trunkBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.19, 0.32, 12), matNaturalClay);
    trunkBase.position.set(0, 1.28, 0.36);
    trunkBase.rotation.x = 0.55;
    idolGroup.add(trunkBase);

    const trunkMid = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.34, 10), matNaturalClay);
    trunkMid.position.set(-0.06, 1.05, 0.48);
    trunkMid.rotation.x = 0.75;
    trunkMid.rotation.z = -0.35;
    idolGroup.add(trunkMid);

    const trunkTip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.28, 10), matNaturalClay);
    trunkTip.position.set(-0.16, 0.88, 0.52);
    trunkTip.rotation.x = 0.3;
    trunkTip.rotation.z = -0.8;
    idolGroup.add(trunkTip);

    // Golden Modak delicately cradled in the curved trunk tip
    const trunkModak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 10), matGoldClayAccent);
    trunkModak.position.set(-0.25, 0.88, 0.56);
    trunkModak.rotation.z = 0.3;
    idolGroup.add(trunkModak);

    // G. Traditional Stepped Mukuta (Carved Clay Crown)
    const crownTier1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.28, 14), matNaturalClay);
    crownTier1.position.set(0, 1.82, 0.12);
    idolGroup.add(crownTier1);

    const crownTier2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.24, 12), matNaturalClay);
    crownTier2.position.set(0, 2.06, 0.12);
    idolGroup.add(crownTier2);

    const crownFinial = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 10), matGoldClayAccent);
    crownFinial.position.set(0, 2.27, 0.12);
    idolGroup.add(crownFinial);

    // H. Traditional Sacred Tilak on Forehead
    // Three horizontal lines of holy Sandalwood paste (Tripundra)
    [-0.035, 0, 0.035].forEach((ty, idx) => {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.16 - idx * 0.02, 0.02, 0.02), matSandalwoodTilak);
      line.position.set(0, 1.54 + ty, 0.49);
      idolGroup.add(line);
    });

    // Auspicious round red Kumkum dot in the center of the tilak
    const kumkumBottu = new THREE.Mesh(new THREE.CircleGeometry(0.03, 8), matKumkumTilak);
    kumkumBottu.position.set(0, 1.54, 0.505);
    idolGroup.add(kumkumBottu);

    // I. Fresh Marigold Garland draped over Ganesha's shoulders
    const garlandGeo = new THREE.TorusGeometry(0.48, 0.06, 8, 16);
    const garland = new THREE.Mesh(garlandGeo, this.matMarigoldOrange);
    garland.rotation.x = Math.PI / 2 + 0.35;
    garland.position.set(0, 1.05, 0.22);
    idolGroup.add(garland);

    // =========================================================================
    // J. SMALL MUSHAK BESIDE THE IDOL (Ground Vahana)
    // =========================================================================
    // Sitting respectfully beside Ganesha's lotus footrest on the pedestal
    const mushakGroup = new THREE.Group();
    mushakGroup.position.set(0.72, -0.05, 0.55); // Right beside Lord Ganesha's footrest
    mushakGroup.rotation.y = -Math.PI / 3; // Looking respectfully up toward Lord Ganesha

    // Mushak Body
    const mBodyGeo = new THREE.SphereGeometry(0.12, 10, 10);
    mBodyGeo.scale(1.0, 0.9, 1.35);
    const mBody = new THREE.Mesh(mBodyGeo, matNaturalClay);
    mBody.position.y = 0.12;
    mushakGroup.add(mBody);

    // Mushak Head
    const mHead = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 8), matNaturalClay);
    mHead.rotation.x = -Math.PI / 2 + 0.3;
    mHead.position.set(0, 0.19, 0.14);
    mushakGroup.add(mHead);

    // Mushak Ears
    [-0.065, 0.065].forEach(ex => {
      const ear = new THREE.Mesh(new THREE.CircleGeometry(0.045, 8), matClayDark);
      ear.position.set(ex, 0.26, 0.1);
      mushakGroup.add(ear);
    });

    // Mushak Paws holding a tiny sacred Modak
    const mMushakModak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 6), matGoldClayAccent);
    mMushakModak.position.set(0, 0.15, 0.24);
    mushakGroup.add(mMushakModak);

    // Mushak Long Curved Tail
    const mTail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.25, 6), matNaturalClay);
    mTail.rotation.x = -0.8;
    mTail.position.set(0, 0.09, -0.16);
    mushakGroup.add(mTail);

    idolGroup.add(mushakGroup);
    group.add(idolGroup);

    // 7. FLANKING TALL BRASS KUTHU VILAKKU DEEPAM LAMPS (With Glowing Warm Light)
    [-1.9, 1.9].forEach(lx => {
      const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.22, 12), this.matBrass);
      lampBase.position.set(lx, 0.81, 0.6);
      group.add(lampBase);

      const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.3, 8), this.matBrass);
      lampStem.position.set(lx, 1.55, 0.6);
      group.add(lampStem);

      const lampTier = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.12, 0.16, 12), this.matBrass);
      lampTier.position.set(lx, 2.2, 0.6);
      group.add(lampTier);

      // 5 Oil Lamp Wicks with glowing warm flames
      for (let w = 0; w < 5; w++) {
        const wAng = (w / 5) * Math.PI * 2;
        const wx = lx + Math.cos(wAng) * 0.28;
        const wz = 0.6 + Math.sin(wAng) * 0.28;

        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(0.03, 0.07, 6),
          new THREE.MeshBasicMaterial({ color: '#fef08a' })
        );
        flame.position.set(wx, 2.34, wz);
        group.add(flame);
      }

      // Warm Point Light illuminating the sanctum
      const lampGlow = new THREE.PointLight('#f59e0b', 2.8, 14);
      lampGlow.position.set(lx, 2.4, 0.6);
      group.add(lampGlow);
      this.lanternLights.push(lampGlow);
    });

    // 8. SACRED OFFERINGS THALIS (Modaks, Laddus, Coconuts, Incense)
    const thaliGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.05, 16);
    const thali = new THREE.Mesh(thaliGeo, this.matBrass);
    thali.position.set(0, 0.74, 1.8);
    group.add(thali);

    // Steamed Modaks in a sacred pyramid cluster
    for (let m = 0; m < 5; m++) {
      const ang = (m / 5) * Math.PI * 2;
      const modak = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.13, 8), this.matWallWhite);
      modak.position.set(Math.cos(ang) * 0.2, 0.82, 1.8 + Math.sin(ang) * 0.2);
      group.add(modak);
    }
    const centerModak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 8), this.matWallWhite);
    centerModak.position.set(0, 0.88, 1.8);
    group.add(centerModak);

    // Traditional Dholak / Mridangam Drums on festival stage
    const drumGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.95, 12);
    const drum = new THREE.Mesh(drumGeo, this.matTeakWood);
    drum.rotation.z = Math.PI / 2;
    drum.position.set(1.5, 0.85, 1.2);
    group.add(drum);

    const drumSkin1 = new THREE.Mesh(new THREE.CircleGeometry(0.28, 12), this.matWallWhite);
    drumSkin1.rotation.y = -Math.PI / 2;
    drumSkin1.position.set(1.02, 0.85, 1.2);
    group.add(drumSkin1);

    const drumSkin2 = new THREE.Mesh(new THREE.CircleGeometry(0.28, 12), this.matWallWhite);
    drumSkin2.rotation.y = Math.PI / 2;
    drumSkin2.position.set(1.98, 0.85, 1.2);
    group.add(drumSkin2);

    // 9. SMOOTH DECORATIVE LIGHTING (Multi-color fairy light strings along all four eaves)
    const fairyLightsFront = this.createDecorativeLightString(
      new THREE.Vector3(-3.8, 5.12, 3.84),
      new THREE.Vector3(3.8, 5.12, 3.84),
      14,
      ['#f59e0b', '#22c55e', '#ef4444', '#3b82f6', '#facc15', '#ec4899']
    );
    group.add(fairyLightsFront);

    const fairyLightsLeft = this.createDecorativeLightString(
      new THREE.Vector3(-3.84, 5.12, -3.8),
      new THREE.Vector3(-3.84, 5.12, 3.8),
      14,
      ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#facc15', '#ec4899']
    );
    group.add(fairyLightsLeft);

    const fairyLightsRight = this.createDecorativeLightString(
      new THREE.Vector3(3.84, 5.12, -3.8),
      new THREE.Vector3(3.84, 5.12, 3.8),
      14,
      ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e', '#facc15', '#ec4899']
    );
    group.add(fairyLightsRight);

    // Divine Warm Altar Illumination Spot
    const altarSpot = new THREE.PointLight('#fef3c7', 3.5, 12);
    altarSpot.position.set(0, 3.8, 1.2);
    group.add(altarSpot);
    this.lanternLights.push(altarSpot);
  }

  /**
   * LEVEL 3 MANDAPAM: "NIMAJJANAM" — The Holy Immersion Procession Staging
   * - Ceremonial Procession Chariot (Ratham) with carved wooden wheels and floral pillars
   * - Lord Ganesha idol installed on the chariot ready for procession to the Kalyani River Ghats
   * - Flower shower petals carpeted across the ground around chariot
   * - Sacred river water kumbhams (brass pots with mango leaves and coconuts)
   * - Ceremonial silver conch shell (shankha) on a pedestal
   * - Procession bells and immersion ropes (vadalu)
   */
  private buildMandapamLevel3_Nimajjanam(): void {
    const group = this.mandapamLevel3Group;
    group.name = 'mandapam_level_3_nimajjanam';

    // Bamboo Scaffolding Crossbeams with Banners
    const beamPositions = [
      { x: 0, z: -3.8, sx: 7.8, sz: 0.2 },
      { x: 0, z: 3.8, sx: 7.8, sz: 0.2 },
      { x: -3.8, z: 0, sx: 0.2, sz: 7.8 },
      { x: 3.8, z: 0, sx: 0.2, sz: 7.8 },
    ];
    beamPositions.forEach(b => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(b.sx, 0.25, b.sz), this.matBambooDry);
      beam.position.set(b.x, 5.2, b.z);
      group.add(beam);
    });

    // Festival Silk Canopy with Flying Immersion Pennants
    const canopyGeo = new THREE.ConeGeometry(5.8, 1.6, 4);
    const canopy = new THREE.Mesh(canopyGeo, this.matCrimsonCloth);
    canopy.position.set(0, 6.0, 0);
    canopy.rotation.y = Math.PI / 4;
    group.add(canopy);

    // CEREMONIAL PROCESSION CHARIOT (RATHAM)
    const rathamGroup = new THREE.Group();
    rathamGroup.position.set(0, 0.7, 0);

    // Chariot Base Platform
    const chariotBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.35, 2.6), this.matTeakWood);
    chariotBase.position.y = 0.5;
    rathamGroup.add(chariotBase);

    // Four Massive Carved Spoked Wooden Wheels
    const wheelPositions = [
      { x: -1.65, z: -1.0 },
      { x: 1.65, z: -1.0 },
      { x: -1.65, z: 1.0 },
      { x: 1.65, z: 1.0 },
    ];
    wheelPositions.forEach(wp => {
      // Wheel rim
      const wheelRim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.16, 16), this.matTeakWood);
      wheelRim.rotation.z = Math.PI / 2;
      wheelRim.position.set(wp.x, 0.55, wp.z);
      rathamGroup.add(wheelRim);

      // Brass hubcap
      const hub = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), this.matBrass);
      hub.position.set(wp.x + (wp.x > 0 ? 0.08 : -0.08), 0.55, wp.z);
      rathamGroup.add(hub);
    });

    // Chariot Decorated Floral Canopy Pillars
    const chariotPillars = [
      { x: -1.3, z: -1.0 },
      { x: 1.3, z: -1.0 },
      { x: -1.3, z: 1.0 },
      { x: 1.3, z: 1.0 },
    ];
    chariotPillars.forEach(cp => {
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.8, 8), this.matBrass);
      pil.position.set(cp.x, 1.6, cp.z);
      rathamGroup.add(pil);

      // Wrapped flower garland
      const garland = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 6, 12), this.matMarigoldOrange);
      garland.rotation.x = Math.PI / 2;
      garland.position.set(cp.x, 1.7, cp.z);
      rathamGroup.add(garland);
    });

    // Chariot Dome Roof (Gopuram Shape)
    const chariotDome = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.2, 4), this.matSaffronCloth);
    chariotDome.position.set(0, 2.9, 0);
    chariotDome.rotation.y = Math.PI / 4;
    rathamGroup.add(chariotDome);

    // Kalash Finial on Chariot Top
    const rathamKalash = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 8), this.matBrass);
    rathamKalash.position.set(0, 3.65, 0);
    rathamGroup.add(rathamKalash);

    // LORD GANESHA ENTHRONED ON CHARIOT READY FOR NIMAJJANAM
    const skinMat = new THREE.MeshLambertMaterial({ color: '#f59e0b' });
    const ganeshaMesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), skinMat);
    ganeshaMesh.position.set(0, 1.3, 0);
    rathamGroup.add(ganeshaMesh);

    const ganeshaCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.32, 0.55, 12), this.matBrass);
    ganeshaCrown.position.set(0, 1.9, 0);
    rathamGroup.add(ganeshaCrown);

    // Chariot Pulling Ropes (Vadalu) extending forward towards the road
    [-0.6, 0.6].forEach(rx => {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.0, 6), this.matBambooDry);
      rope.rotation.x = Math.PI / 2;
      rope.position.set(rx, 0.35, 3.2);
      rathamGroup.add(rope);
    });

    group.add(rathamGroup);

    // Flower Shower Petal Carpet (Orange & Yellow Marigold petals around chariot)
    for (let p = 0; p < 24; p++) {
      const ang = (p / 24) * Math.PI * 2;
      const rad = 2.0 + (p % 3) * 0.4;
      const petal = new THREE.Mesh(
        new THREE.CircleGeometry(0.12, 6),
        p % 2 === 0 ? this.matMarigoldOrange : this.matMarigoldYellow
      );
      petal.rotation.x = -Math.PI / 2;
      petal.position.set(Math.cos(ang) * rad, 0.72, Math.sin(ang) * rad);
      group.add(petal);
    }

    // Sacred Kumbham Urns for Holy River Water
    [-1.8, 1.8].forEach(kx => {
      const kumbham = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), this.matBrass);
      kumbham.position.set(kx, 0.9, 1.4);
      group.add(kumbham);

      const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), this.matTeakWood);
      coconut.position.set(kx, 1.25, 1.4);
      group.add(coconut);
    });

    // Ceremonial Conch Shell (Shankha) on silver pedestal
    const conchPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.3, 10), this.matStoneGrey);
    conchPedestal.position.set(0, 0.85, 2.2);
    group.add(conchPedestal);

    const conch = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 8), this.matWallWhite);
    conch.rotation.z = Math.PI / 2;
    conch.position.set(0, 1.05, 2.2);
    group.add(conch);
  }

  /**
   * Switches the active Mandapam structure when current level changes.
   * Village, entrance, houses, roads, jungle, highway, city, and landscape remain 100% persistent.
   */
  public setLevel(levelId: LevelId): void {
    this.currentLevel = levelId;
    this.mandapamDynamicContainer.clear();

    if (levelId === LevelId.LEVEL_1) {
      this.mandapamDynamicContainer.add(this.mandapamLevel1Group);
      this.resetMandapamPaperBag();
    } else if (levelId === LevelId.LEVEL_2) {
      this.mandapamDynamicContainer.add(this.mandapamLevel2Group);
      this.hideMandapamPaperBag();
      this.mandapamSubmittedBagGroup.visible = false;
    } else if (levelId === LevelId.LEVEL_3) {
      this.mandapamDynamicContainer.add(this.mandapamLevel3Group);
      this.hideMandapamPaperBag();
      this.mandapamSubmittedBagGroup.visible = false;
    }

    if (this.mandapamOrganizerNPC) {
      this.mandapamOrganizerNPC.setLevel(levelId);
    }
  }

  /**
   * 4. Traditional Indian village homes distributed naturally throughout Rangastalam.
   * Features architectural variations in shape, size, roofs, walls, verandahs, tulasikotas,
   * with a physically attached animated Indian national flag on every single home!
   */
  private buildVillageHouses(): void {
    this.villageHouses = new VillageHouses(this.collisionSystem, this.flagSystem);
    this.villageHouses.build();
    this.villageGroup.add(this.villageHouses.group);
    this.villageGroup.add(this.flagSystem.group);
  }

  /**
   * Continuous wind physics update for all Indian national flags,
   * permanent Mandapam Organizer NPC kinematics and namaste gestures,
   * day/night decorative lighting transitions, and Level 1 construction workers activity.
   */
  public update(delta: number, time: number, playerPos?: THREE.Vector3, decorativeLightFactor?: number): void {
    if (this.flagSystem) {
      this.flagSystem.update(delta, time);
    }
    if (this.mandapamBagBeaconRing && this.mandapamPaperBagGroup.visible) {
      this.mandapamBagBeaconRing.rotation.z += delta * 0.8;
      const s = 1.0 + Math.sin(time * 3.5) * 0.08;
      this.mandapamBagBeaconRing.scale.set(s, s, s);
    }
    if (this.mandapamOrganizerNPC) {
      this.mandapamOrganizerNPC.update(delta, playerPos);
    }
    if (decorativeLightFactor !== undefined) {
      this.updateDecorativeLights(decorativeLightFactor, delta);
    }
    if (this.currentLevel === LevelId.LEVEL_1) {
      this.updateLevel1Workers(delta, time);
    }
  }

  /**
   * Update kinematics and animations for Level 1 Mandapam construction workers:
   * - Worker 1 (Raju): Tying ropes & adjusting awning canopy on scaffolding
   * - Worker 2 (Somanna): Modeling earthen clay idol with paddle
   * - Worker 3 (Venkat): Preparing marigold garlands and sorting bamboo
   */
  private updateLevel1Workers(delta: number, time: number): void {
    if (this.workerScaffoldArmL && this.workerScaffoldArmR) {
      // Scaffolding worker tying rope & adjusting canopy
      const cycle = Math.sin(time * 2.2);
      this.workerScaffoldArmR.rotation.x = -1.2 + cycle * 0.35;
      this.workerScaffoldArmR.rotation.y = 0.3 + Math.cos(time * 1.8) * 0.2;
      this.workerScaffoldArmL.rotation.x = -1.1 - cycle * 0.3;
      this.workerScaffoldArmL.rotation.y = -0.25;
    }
    if (this.workerArtisanArmR) {
      // Artisan modeling clay with smoothing paddle
      const paddleCycle = Math.sin(time * 3.0);
      this.workerArtisanArmR.rotation.x = -0.6 + paddleCycle * 0.25;
      this.workerArtisanArmR.rotation.z = -0.2 + paddleCycle * 0.15;
    }
    if (this.workerHelperArmR) {
      // Festival helper preparing garlands and measuring bamboo
      const helperCycle = Math.sin(time * 1.8);
      this.workerHelperArmR.rotation.x = -0.4 + helperCycle * 0.3;
      this.workerHelperArmR.rotation.y = 0.2 + Math.cos(time * 1.5) * 0.15;
    }
  }

  /**
   * Modulates all festive Mandapam lighting based on Time-of-Day factor (0.0 daytime, 1.0 night).
   * Smoothly fades ON after sunset, and fades OFF after sunrise using frame-rate independent damping.
   * Prevents abrupt on/off popping.
   */
  public updateDecorativeLights(targetFactor: number, delta: number = 0.016): void {
    const clampedTarget = THREE.MathUtils.clamp(targetFactor, 0, 1);
    // Smooth frame-rate independent gradual transition
    this.currentDecorativeLightFactor = THREE.MathUtils.damp(
      this.currentDecorativeLightFactor,
      clampedTarget,
      2.5,
      delta
    );
    const f = this.currentDecorativeLightFactor;

    for (let i = 0; i < this.mandapamDecorativeMaterials.length; i++) {
      this.mandapamDecorativeMaterials[i].emissiveIntensity = f * 2.2;
    }
    for (let i = 0; i < this.mandapamDecorativeLights.length; i++) {
      const light = this.mandapamDecorativeLights[i];
      const maxI = (light.userData && light.userData.maxIntensity) || 1.8;
      light.intensity = f * maxI;
    }
  }

  public getMandapamOrganizerDialogue() {
    return this.mandapamOrganizerNPC ? this.mandapamOrganizerNPC.getDialogue() : null;
  }

  /**
   * Builds the Grand Traditional Rangoli (Muggu) right in front of the Mandapam entrance steps.
   * Features concentric sacred geometric rings, lotus petal radial arrays, and four corner deepams
   * whose flame materials are added to mandapamDecorativeMaterials for evening glow!
   */
  private buildGrandEntranceRangoli(parentGroup: THREE.Group): void {
    const rangoliGroup = new THREE.Group();
    rangoliGroup.position.set(0, 0.032, 4.45);

    // 1. Outer Sacred Rice Flour Border
    const ringOuter = new THREE.Mesh(
      new THREE.RingGeometry(1.65, 1.95, 36),
      new THREE.MeshBasicMaterial({ color: '#fffbeb', side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
    );
    ringOuter.rotation.x = -Math.PI / 2;
    rangoliGroup.add(ringOuter);

    // 2. Vermilion Kumkum Red Petal Ring
    const ringRed = new THREE.Mesh(
      new THREE.RingGeometry(1.25, 1.6, 36),
      new THREE.MeshBasicMaterial({ color: '#dc2626', side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
    );
    ringRed.rotation.x = -Math.PI / 2;
    rangoliGroup.add(ringRed);

    // 3. Golden Haldi / Turmeric Yellow Ring
    const ringYellow = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.2, 28),
      new THREE.MeshBasicMaterial({ color: '#facc15', side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
    );
    ringYellow.rotation.x = -Math.PI / 2;
    rangoliGroup.add(ringYellow);

    // 4. Emerald Parrot Green Inner Ring
    const ringGreen = new THREE.Mesh(
      new THREE.RingGeometry(0.48, 0.8, 24),
      new THREE.MeshBasicMaterial({ color: '#059669', side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    ringGreen.rotation.x = -Math.PI / 2;
    rangoliGroup.add(ringGreen);

    // 5. Center Sacred Lotus Core
    const centerLotus = new THREE.Mesh(
      new THREE.CircleGeometry(0.44, 20),
      new THREE.MeshBasicMaterial({ color: '#ea580c', side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
    );
    centerLotus.rotation.x = -Math.PI / 2;
    rangoliGroup.add(centerLotus);

    // 6. 12 Radial Lotus Flower Rays
    for (let r = 0; r < 12; r++) {
      const ang = (r / 12) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.006, 1.1),
        new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.92 })
      );
      petal.position.set(Math.cos(ang) * 1.15, 0.005, Math.sin(ang) * 1.15);
      petal.rotation.y = -ang;
      rangoliGroup.add(petal);

      // Outer accent dot for each ray
      const dot = new THREE.Mesh(
        new THREE.CircleGeometry(0.065, 8),
        new THREE.MeshBasicMaterial({ color: '#facc15', side: THREE.DoubleSide })
      );
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(Math.cos(ang) * 1.8, 0.007, Math.sin(ang) * 1.8);
      rangoliGroup.add(dot);
    }

    // 7. Four Auspicious Corner Terracotta Deepams (Oil Lamps) with glowing flames
    const diyaPositions = [
      { x: -1.75, z: -1.75 },
      { x: 1.75, z: -1.75 },
      { x: -1.75, z: 1.75 },
      { x: 1.75, z: 1.75 },
    ];
    const matDiyaClay = new THREE.MeshLambertMaterial({ color: '#9a3412' });
    diyaPositions.forEach(dp => {
      const diyaBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.05, 0.06, 10), matDiyaClay);
      diyaBowl.position.set(dp.x, 0.03, dp.z);
      rangoliGroup.add(diyaBowl);

      const flameMat = new THREE.MeshStandardMaterial({
        color: '#fbbf24',
        emissive: new THREE.Color('#f59e0b'),
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.09, 8), flameMat);
      flame.position.set(dp.x, 0.085, dp.z);
      rangoliGroup.add(flame);
      this.mandapamDecorativeMaterials.push(flameMat);
    });

    parentGroup.add(rangoliGroup);
  }

  /**
   * Builds the physical "MILLENNIALS YOUTH ASSOCIATION" signboard on the RIGHT SIDE outside the Mandapam.
   * Solid wooden posts, granite footings, high-res canvas sign with traditional 2D Ganesh artwork,
   * gold molding, overhead brass gooseneck lamp, and decorative light string.
   */
  private buildAssociationSignboard(parentGroup: THREE.Group): void {
    const signGroup = new THREE.Group();
    // Positioned deterministically on the RIGHT SIDE outside the Mandapam (5.8, 0, 3.5)
    signGroup.position.set(5.8, 0, 3.5);
    signGroup.rotation.y = -0.22; // Angled facing the approaching player from the entrance road

    const matWoodDark = new THREE.MeshLambertMaterial({ color: '#3e2723' }); // Dark Teak wood
    const matStoneBase = new THREE.MeshLambertMaterial({ color: '#57534e' }); // Grey granite footing
    const matGoldTrim = new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.6, roughness: 0.3 });

    // Two Upright Structural Wooden Posts
    [-1.02, 1.02].forEach(px => {
      // Granite foundation pedestal
      const stoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.32), matStoneBase);
      stoneBase.position.set(px, 0.11, 0);
      stoneBase.castShadow = true;
      signGroup.add(stoneBase);

      // Vertical Upright Pole
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.7, 10), matWoodDark);
      post.position.set(px, 1.38, 0);
      post.castShadow = true;
      signGroup.add(post);

      // Gold finial on top of each post
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), matGoldTrim);
      finial.position.set(px, 2.78, 0);
      signGroup.add(finial);

      // Diagonal rear support strut (Realistic physical stabilization)
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.65, 6), matWoodDark);
      strut.rotation.x = -0.45;
      strut.position.set(px, 0.82, -0.32);
      signGroup.add(strut);
    });

    // Horizontal crossbars bridging the posts
    [0.92, 2.34].forEach(hy => {
      const crossbar = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.08, 0.06), matWoodDark);
      crossbar.position.set(0, hy, 0);
      signGroup.add(crossbar);
    });

    // Carved Wooden Signboard Backing Frame
    const frameBack = new THREE.Mesh(new THREE.BoxGeometry(2.24, 1.32, 0.08), matWoodDark);
    frameBack.position.set(0, 1.63, 0);
    frameBack.castShadow = true;
    signGroup.add(frameBack);

    // Gold Beveled Molding Rim around Signboard
    const moldingTop = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.05, 0.1), matGoldTrim);
    moldingTop.position.set(0, 2.3, 0.01);
    signGroup.add(moldingTop);

    const moldingBottom = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.05, 0.1), matGoldTrim);
    moldingBottom.position.set(0, 0.96, 0.01);
    signGroup.add(moldingBottom);

    // Front Signboard Display Board with the High-Res Canvas Texture
    const signTexture = this.createAssociationSignboardTexture();
    const signMat = new THREE.MeshBasicMaterial({
      map: signTexture,
      toneMapped: false,
    });
    const signPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.14, 1.22), signMat);
    signPlane.position.set(0, 1.63, 0.045);
    signGroup.add(signPlane);

    // Overhanging Brass Gooseneck Lamp Fixture (Dedicated illumination for the sign)
    const lampArmCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.3, 0),
      new THREE.Vector3(0, 2.55, 0.15),
      new THREE.Vector3(0, 2.5, 0.4),
      new THREE.Vector3(0, 2.4, 0.4),
    ]);
    const lampArm = new THREE.Mesh(new THREE.TubeGeometry(lampArmCurve, 10, 0.02, 6, false), this.matBrass);
    signGroup.add(lampArm);

    // Brass Lamp Shade
    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.1, 10, 1, true), this.matBrass);
    lampShade.position.set(0, 2.4, 0.4);
    signGroup.add(lampShade);

    // Warm Bulb
    const bulbMat = new THREE.MeshStandardMaterial({
      color: '#fef08a',
      emissive: '#fef08a',
      emissiveIntensity: 0.0,
      roughness: 0.2,
    });
    this.mandapamDecorativeMaterials.push(bulbMat);

    const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), bulbMat);
    bulbMesh.position.set(0, 2.37, 0.4);
    signGroup.add(bulbMesh);

    // Point light shining down on the sign (Connected to smooth day/night cycle)
    const signSpotLight = new THREE.PointLight('#fef08a', 0.0, 6);
    signSpotLight.position.set(5.8, 2.3, 3.9);
    signSpotLight.userData = { maxIntensity: 2.2 };
    parentGroup.add(signSpotLight);
    this.mandapamDecorativeLights.push(signSpotLight);

    // Small decorative light string along the top arch of the signboard
    const signLights = this.createDecorativeLightString(
      new THREE.Vector3(-1.05, 2.34, 0.04),
      new THREE.Vector3(1.05, 2.34, 0.04),
      9,
      ['#f59e0b', '#22c55e', '#ef4444', '#facc15', '#3b82f6']
    );
    signGroup.add(signLights);

    parentGroup.add(signGroup);

    // Register Solid Collision for Signboard (so Ramu collides with the physical posts)
    this.collisionSystem.addCollider({
      id: 'association_signboard_physical',
      type: 'box',
      position: new THREE.Vector3(5.8, 1.2, 3.5),
      size: new THREE.Vector3(2.4, 2.5, 0.8),
    });
  }

  /**
   * Generates a high-resolution 1024x576 CanvasTexture for the "MILLENNIALS YOUTH ASSOCIATION" signboard.
   * Features royal crimson background, gold border trim, corner floral mandalas,
   * clean 2D Ganesh graphic, bold title, and festive event typography.
   */
  private createAssociationSignboardTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 576;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Deep royal crimson / maroon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 576);
    bgGrad.addColorStop(0, '#7f1d1d');
    bgGrad.addColorStop(0.5, '#5b1016');
    bgGrad.addColorStop(1, '#3b070c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 576);

    // Subtle texture lines
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 0; y < 576; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Outer Heavy Golden Border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 14;
    ctx.strokeRect(18, 18, 988, 540);

    // Inner Delicate Gold Inlay Border
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 3;
    ctx.strokeRect(32, 32, 960, 512);

    // Corner Ornate Rosettes
    const corners = [
      { x: 36, y: 36, dx: 1, dy: 1 },
      { x: 988, y: 36, dx: -1, dy: 1 },
      { x: 36, y: 540, dx: 1, dy: -1 },
      { x: 988, y: 540, dx: -1, dy: -1 },
    ];
    ctx.fillStyle = '#f59e0b';
    corners.forEach(c => {
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.dx * 36, c.y);
      ctx.lineTo(c.x, c.y + c.dy * 36);
      ctx.closePath();
      ctx.fill();
    });

    // Top Auspicious Sanskrit / Telugu invocation
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('॥ శ్రీ గణేశాయ నమః • ॐ గం గణపతయే నమః ॥', 512, 68);

    // Clean 2D Traditional Ganesh Graphic in Circle Emblem
    const centerX = 512;
    const emblemY = 195;
    const emblemR = 72;

    // Glowing Aureole Halo
    const haloGrad = ctx.createRadialGradient(centerX, emblemY, 20, centerX, emblemY, emblemR + 12);
    haloGrad.addColorStop(0, 'rgba(251, 191, 36, 0.9)');
    haloGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.4)');
    haloGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(centerX, emblemY, emblemR + 12, 0, Math.PI * 2);
    ctx.fill();

    // Emblem Circular Backing
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(centerX, emblemY, emblemR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Crown / Mukut
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(centerX - 24, emblemY - 22);
    ctx.lineTo(centerX + 24, emblemY - 22);
    ctx.lineTo(centerX + 16, emblemY - 58);
    ctx.lineTo(centerX, emblemY - 68);
    ctx.lineTo(centerX - 16, emblemY - 58);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Head circle & ears
    ctx.fillStyle = '#fef3c7';
    // Left ear
    ctx.beginPath();
    ctx.ellipse(centerX - 36, emblemY - 8, 18, 24, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // Right ear
    ctx.beginPath();
    ctx.ellipse(centerX + 36, emblemY - 8, 18, 24, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // Face / Forehead
    ctx.beginPath();
    ctx.ellipse(centerX, emblemY - 4, 28, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Tilak & Trishul Vibhuti on Forehead
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, emblemY - 22);
    ctx.lineTo(centerX, emblemY - 10);
    ctx.stroke();
    // Yellow bindi
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(centerX, emblemY - 10, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Trunk curving leftwards with gold Modak
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, emblemY + 2);
    ctx.quadraticCurveTo(centerX + 2, emblemY + 32, centerX - 18, emblemY + 38);
    ctx.quadraticCurveTo(centerX - 30, emblemY + 32, centerX - 24, emblemY + 18);
    ctx.stroke();

    // Golden Modak / Laddu in trunk
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(centerX - 24, emblemY + 16, 7, 0, Math.PI * 2);
    ctx.fill();

    // Bold Association Title
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    ctx.font = "900 56px 'Cinzel', 'Georgia', 'Times New Roman', serif";
    const textGrad = ctx.createLinearGradient(0, 310, 0, 365);
    textGrad.addColorStop(0, '#ffffff');
    textGrad.addColorStop(0.35, '#fef08a');
    textGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = textGrad;
    ctx.fillText('MILLENNIALS YOUTH ASSOCIATION', 512, 355);

    // Decorative Floral Divider Under Title
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(220, 385);
    ctx.lineTo(470, 385);
    ctx.moveTo(554, 385);
    ctx.lineTo(804, 385);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(512, 385, 6, 0, Math.PI * 2);
    ctx.fill();

    // Subtitle 1: Festival details
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 6;
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('32nd ANNUAL GANESHOTSAV • RANGASTALAM', 512, 435);

    // Subtitle 2: Eco-friendly mission
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillStyle = '#86efac';
    ctx.fillText('★ 100% ECO-FRIENDLY CLAY GANAPATHI • SAVE NATURE ★', 512, 480);

    // Bottom Footer note
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillStyle = '#fed7aa';
    ctx.fillText('Cordially Welcoming Devotees of Rangastalam & Surrounding Villages', 512, 515);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Creates traditional Indian downward V-shaped cloth decorations (Jhalar / Scallop bunting).
   * Supports partial installation percentage for Level 1 under-construction authenticity.
   */
  private createVShapedClothBorder(
    length: number,
    colors: string[],
    height: number = 0.45,
    vWidth: number = 0.35,
    partiallyHungPercent: number = 1.0
  ): THREE.Group {
    const group = new THREE.Group();
    const totalCount = Math.max(1, Math.floor(length / vWidth));
    const renderCount = Math.max(1, Math.floor(totalCount * partiallyHungPercent));
    const startX = -length / 2 + vWidth / 2;

    // Top binding ribbon
    const ribbonLength = length * partiallyHungPercent;
    const ribbonMat = new THREE.MeshLambertMaterial({ color: '#ca8a04' });
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(ribbonLength, 0.05, 0.02), ribbonMat);
    ribbon.position.set(-length / 2 + ribbonLength / 2, 0, 0);
    group.add(ribbon);

    // Triangular geometry for a single downward V swag
    const positions = new Float32Array([
      -vWidth / 2, 0, 0,
      vWidth / 2, 0, 0,
      0, -height, 0.025,
      // Back face
      vWidth / 2, 0, 0,
      -vWidth / 2, 0, 0,
      0, -height, 0.025,
    ]);
    const uvs = new Float32Array([
      0, 1,
      1, 1,
      0.5, 0,
      1, 1,
      0, 1,
      0.5, 0,
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();

    const colorMats = colors.map(c => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));

    for (let i = 0; i < renderCount; i++) {
      const mat = colorMats[i % colorMats.length];
      const vMesh = new THREE.Mesh(geo, mat);
      vMesh.position.set(startX + i * vWidth, 0, 0);
      group.add(vMesh);
    }

    // If partially hung (Level 1 Under Construction detail):
    if (partiallyHungPercent < 1.0 && renderCount < totalCount) {
      const hangX = startX + renderCount * vWidth;
      const matRoll = colorMats[renderCount % colorMats.length];
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), matRoll);
      roll.rotation.z = Math.PI / 2;
      roll.position.set(hangX + 0.2, -0.05, 0.05);
      group.add(roll);

      const rope = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 10), new THREE.MeshLambertMaterial({ color: '#78350f' }));
      rope.position.set(hangX + 0.2, -0.05, 0.05);
      group.add(rope);

      const ropeTail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.8, 6), new THREE.MeshLambertMaterial({ color: '#78350f' }));
      ropeTail.position.set(hangX + 0.35, -0.45, 0.05);
      group.add(ropeTail);
    }

    return group;
  }

  /**
   * Creates a string of festive colored bulbs with sockets and wire droop
   */
  private createDecorativeLightString(
    start: THREE.Vector3,
    end: THREE.Vector3,
    bulbCount: number,
    colors: string[]
  ): THREE.Group {
    const group = new THREE.Group();

    // Wire / cable
    const curve = new THREE.LineCurve3(start, end);
    const wireMat = new THREE.MeshBasicMaterial({ color: '#18181b' });
    const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.01, 4, false), wireMat);
    group.add(wire);

    // Bulbs
    const bulbGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const socketGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.035, 6);
    const socketMat = new THREE.MeshLambertMaterial({ color: '#27272a' });

    for (let i = 0; i < bulbCount; i++) {
      const alpha = (i + 0.5) / bulbCount;
      const pos = new THREE.Vector3().lerpVectors(start, end, alpha);
      pos.y -= Math.sin(alpha * Math.PI) * 0.12; // Catenary sag

      const col = colors[i % colors.length];
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.0,
        roughness: 0.25,
        metalness: 0.1,
      });
      this.mandapamDecorativeMaterials.push(mat);

      const bulb = new THREE.Mesh(bulbGeo, mat);
      bulb.position.copy(pos);
      group.add(bulb);

      const socket = new THREE.Mesh(socketGeo, socketMat);
      socket.position.set(pos.x, pos.y + 0.03, pos.z);
      group.add(socket);
    }

    return group;
  }

  /**
   * Builds believable 3D workers for Level 1 preparation:
   * - Worker 1 (Raju): On scaffolding platform (y = 2.44m), tying coir ropes & hanging awning
   * - Worker 2 (Somanna): On stage platform (y = 0.7m), modeling the unbaked clay Ganesha idol
   */
  private buildLevel1ConstructionWorkers(group: THREE.Group): void {
    const matWorkerSkin = new THREE.MeshStandardMaterial({ color: '#b46d38', roughness: 0.8 });
    const matWorkerVest = new THREE.MeshLambertMaterial({ color: '#f5f5f4' });
    const matFoldedLungi = new THREE.MeshLambertMaterial({ color: '#1e3a8a' });
    const matRedRumal = new THREE.MeshLambertMaterial({ color: '#dc2626' });
    const matHair = new THREE.MeshLambertMaterial({ color: '#1c1917' });

    // WORKER 1: Raju (Carpenter / Scaffolding Decorator standing on scaffold plank at y = 2.44)
    const worker1Group = new THREE.Group();
    worker1Group.position.set(2.4, 2.44, 2.2);
    worker1Group.rotation.y = -Math.PI / 1.8;

    [-0.12, 0.12].forEach(fx => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.18), matWorkerSkin);
      foot.position.set(fx, 0.02, 0.02);
      worker1Group.add(foot);

      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.45, 6), matWorkerSkin);
      shin.position.set(fx, 0.25, 0);
      worker1Group.add(shin);
    });

    const lungi = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.23, 0.38, 8), matFoldedLungi);
    lungi.position.set(0, 0.62, 0);
    worker1Group.add(lungi);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.48, 8), matWorkerVest);
    torso.position.set(0, 1.05, 0);
    worker1Group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), matWorkerSkin);
    head.position.set(0, 1.38, 0);
    worker1Group.add(head);

    const rumal = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.03, 6, 12), matRedRumal);
    rumal.rotation.x = Math.PI / 2;
    rumal.position.set(0, 1.42, 0);
    worker1Group.add(rumal);

    this.workerScaffoldArmL = new THREE.Group();
    this.workerScaffoldArmL.position.set(-0.24, 1.25, 0);
    worker1Group.add(this.workerScaffoldArmL);

    const armLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.48, 6), matWorkerSkin);
    armLMesh.position.set(0, -0.24, 0);
    this.workerScaffoldArmL.add(armLMesh);

    this.workerScaffoldArmR = new THREE.Group();
    this.workerScaffoldArmR.position.set(0.24, 1.25, 0);
    worker1Group.add(this.workerScaffoldArmR);

    const armRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.48, 6), matWorkerSkin);
    armRMesh.position.set(0, -0.24, 0);
    this.workerScaffoldArmR.add(armRMesh);

    const handRope = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 10), new THREE.MeshLambertMaterial({ color: '#78350f' }));
    handRope.position.set(0, -0.5, 0.1);
    this.workerScaffoldArmR.add(handRope);

    group.add(worker1Group);

    // WORKER 2: Somanna (Artisan Modeler standing on the stage platform at y = 0.7 near clay idol)
    const worker2Group = new THREE.Group();
    worker2Group.position.set(-1.35, 0.7, 0.75);
    worker2Group.rotation.y = 0.5;

    [-0.11, 0.11].forEach(fx => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.18), matWorkerSkin);
      foot.position.set(fx, 0.02, 0.02);
      worker2Group.add(foot);

      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.45, 6), matWorkerSkin);
      shin.position.set(fx, 0.25, 0);
      worker2Group.add(shin);
    });

    const lungi2 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.4, 8), new THREE.MeshLambertMaterial({ color: '#78350f' }));
    lungi2.position.set(0, 0.62, 0);
    worker2Group.add(lungi2);

    const torso2 = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.23, 0.46, 8), new THREE.MeshLambertMaterial({ color: '#ea580c' }));
    torso2.position.set(0, 1.04, 0);
    worker2Group.add(torso2);

    const head2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), matWorkerSkin);
    head2.position.set(0, 1.36, 0);
    worker2Group.add(head2);

    const hair2 = new THREE.Mesh(new THREE.SphereGeometry(0.125, 8, 8), matHair);
    hair2.position.set(0, 1.38, -0.01);
    worker2Group.add(hair2);

    this.workerArtisanArmR = new THREE.Group();
    this.workerArtisanArmR.position.set(0.22, 1.22, 0);
    worker2Group.add(this.workerArtisanArmR);

    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.46, 6), matWorkerSkin);
    arm2.position.set(0, -0.23, 0);
    this.workerArtisanArmR.add(arm2);

    const toolPaddle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.28), this.matTeakWood);
    toolPaddle.position.set(0, -0.48, 0.1);
    toolPaddle.rotation.x = Math.PI / 4;
    this.workerArtisanArmR.add(toolPaddle);

    group.add(worker2Group);

    // WORKER 3: Venkat (Festival Volunteer / Garland Artist seated on wooden crate at x = 1.85, z = 3.2)
    const worker3Group = new THREE.Group();
    worker3Group.position.set(1.85, 0, 3.2);
    worker3Group.rotation.y = -0.5;

    // Wooden low stool / crate
    const stool = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.4), this.matTeakWood);
    stool.position.set(0, 0.175, 0);
    worker3Group.add(stool);

    // Seated worker legs & folded green lungi
    const lungi3 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.4, 8), new THREE.MeshLambertMaterial({ color: '#15803d' }));
    lungi3.position.set(0, 0.46, 0.05);
    worker3Group.add(lungi3);

    // Seated knees & shins
    [-0.14, 0.14].forEach(kx => {
      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), matWorkerSkin);
      knee.position.set(kx, 0.42, 0.24);
      worker3Group.add(knee);

      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.32, 6), matWorkerSkin);
      shin.position.set(kx, 0.2, 0.24);
      worker3Group.add(shin);
    });

    const torso3 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.44, 8), matWorkerVest);
    torso3.position.set(0, 0.85, 0);
    worker3Group.add(torso3);

    const head3 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), matWorkerSkin);
    head3.position.set(0, 1.16, 0);
    worker3Group.add(head3);

    const hair3 = new THREE.Mesh(new THREE.SphereGeometry(0.125, 8, 8), matHair);
    hair3.position.set(0, 1.18, -0.01);
    worker3Group.add(hair3);

    // Left arm holding garland thread
    const arm3L = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.44, 6), matWorkerSkin);
    arm3L.position.set(-0.2, 0.82, 0.14);
    arm3L.rotation.x = -0.6;
    worker3Group.add(arm3L);

    // Right animated arm stringing flowers
    this.workerHelperArmR = new THREE.Group();
    this.workerHelperArmR.position.set(0.2, 1.0, 0);
    worker3Group.add(this.workerHelperArmR);

    const arm3R = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.44, 6), matWorkerSkin);
    arm3R.position.set(0, -0.22, 0);
    this.workerHelperArmR.add(arm3R);

    // Marigold flower in hand
    const flowerInHand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), this.matMarigoldOrange);
    flowerInHand.position.set(0, -0.44, 0.08);
    this.workerHelperArmR.add(flowerInHand);

    // Woven bamboo basket with loose marigold flowers beside worker
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.26, 12), new THREE.MeshLambertMaterial({ color: '#a16207' }));
    basket.position.set(0.52, 0.13, 0.2);
    worker3Group.add(basket);

    const flowersInBasket = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), this.matMarigoldOrange);
    flowersInBasket.position.set(0.52, 0.24, 0.2);
    worker3Group.add(flowersInBasket);

    const garlandRoll = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 6, 14), this.matMarigoldYellow);
    garlandRoll.rotation.x = Math.PI / 2;
    garlandRoll.position.set(0.1, 0.4, 0.26);
    worker3Group.add(garlandRoll);

    group.add(worker3Group);
  }

  /**
   * Builds realistic construction props & raw materials for Level 1:
   * - Stack of 8 raw bamboo poles resting on wooden sleepers
   * - Coiled coir rope bundles on the ground
   * - Carpenter's wooden toolbox with mallet, saw, and chisels
   * - Paint pots with lime whitewash and yellow turmeric paint with stirring paddles
   * - Multi-tier bamboo scaffolding framework with ledger poles and diagonal X-braces
   * - Heavy wooden scaffolding walkway planks at y = 2.4m
   * - Bamboo leaning ladder with 7 rungs
   */
  private buildLevel1ConstructionProps(group: THREE.Group): void {
    const skidMat = new THREE.MeshLambertMaterial({ color: '#451a03' });
    [-0.8, 0.8].forEach(sx => {
      const skid = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.65), skidMat);
      skid.position.set(-3.4 + sx, 0.06, 2.2);
      group.add(skid);
    });

    for (let row = 0; row < 3; row++) {
      const count = 3 - row;
      for (let c = 0; c < count; c++) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 8), this.matBambooDry);
        pole.rotation.z = Math.PI / 2;
        pole.position.set(-3.4, 0.16 + row * 0.09, 1.95 + c * 0.12 + row * 0.06);
        group.add(pole);
      }
    }

    [-0.6, 0.6].forEach(tx => {
      const twine = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 6, 12), new THREE.MeshLambertMaterial({ color: '#78350f' }));
      twine.rotation.y = Math.PI / 2;
      twine.position.set(-3.4 + tx, 0.24, 2.1);
      group.add(twine);
    });

    const ropeMat = new THREE.MeshLambertMaterial({ color: '#78350f' });
    const ropeCoil1 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 8, 16), ropeMat);
    ropeCoil1.rotation.x = Math.PI / 2;
    ropeCoil1.position.set(-2.2, 0.08, 3.4);
    group.add(ropeCoil1);

    const ropeCoil2 = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 8, 14), ropeMat);
    ropeCoil2.rotation.x = Math.PI / 2;
    ropeCoil2.position.set(-2.5, 0.07, 3.1);
    group.add(ropeCoil2);

    const toolBoxMat = new THREE.MeshLambertMaterial({ color: '#573318' });
    const toolBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.32), toolBoxMat);
    toolBox.position.set(1.6, 0.11, 3.2);
    group.add(toolBox);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 6), toolBoxMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(1.6, 0.3, 3.2);
    group.add(handle);

    const malletHead = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8), toolBoxMat);
    malletHead.position.set(1.45, 0.24, 3.2);
    group.add(malletHead);

    const sawBlade = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.01), new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.8 }));
    sawBlade.position.set(1.75, 0.24, 3.2);
    sawBlade.rotation.z = 0.2;
    group.add(sawBlade);

    const bucketMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.6, roughness: 0.3 });
    const bucket1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.28, 10), bucketMat);
    bucket1.position.set(3.2, 0.14, 1.4);
    group.add(bucket1);

    const whitePaint = new THREE.Mesh(new THREE.CircleGeometry(0.13, 10), new THREE.MeshBasicMaterial({ color: '#f8fafc' }));
    whitePaint.rotation.x = -Math.PI / 2;
    whitePaint.position.set(3.2, 0.27, 1.4);
    group.add(whitePaint);

    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 6), this.matBambooDry);
    stick.rotation.z = 0.35;
    stick.position.set(3.25, 0.32, 1.4);
    group.add(stick);

    const bucket2 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.26, 10), bucketMat);
    bucket2.position.set(3.5, 0.13, 1.6);
    group.add(bucket2);

    const yellowPaint = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10), new THREE.MeshBasicMaterial({ color: '#facc15' }));
    yellowPaint.rotation.x = -Math.PI / 2;
    yellowPaint.position.set(3.5, 0.25, 1.6);
    group.add(yellowPaint);

    // Bamboo Scaffolding Framework
    const scaffoldPoles = [
      { x: 2.1, z: 1.4 },
      { x: 3.5, z: 1.4 },
      { x: 2.1, z: 2.8 },
      { x: 3.5, z: 2.8 },
    ];
    scaffoldPoles.forEach(sp => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 5.0, 8), this.matBambooDry);
      p.position.set(sp.x, 2.5, sp.z);
      group.add(p);
    });

    [1.2, 2.4].forEach(ly => {
      const ledgX1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), this.matBambooDry);
      ledgX1.rotation.z = Math.PI / 2;
      ledgX1.position.set(2.8, ly, 1.4);
      group.add(ledgX1);

      const ledgX2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), this.matBambooDry);
      ledgX2.rotation.z = Math.PI / 2;
      ledgX2.position.set(2.8, ly, 2.8);
      group.add(ledgX2);

      const ledgZ1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), this.matBambooDry);
      ledgZ1.rotation.x = Math.PI / 2;
      ledgZ1.position.set(2.1, ly, 2.1);
      group.add(ledgZ1);

      const ledgZ2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), this.matBambooDry);
      ledgZ2.rotation.x = Math.PI / 2;
      ledgZ2.position.set(3.5, ly, 2.1);
      group.add(ledgZ2);
    });

    [-0.2, 0.1].forEach(pz => {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.38), this.matTeakWood);
      plank.position.set(2.8, 2.41, 2.1 + pz);
      group.add(plank);
    });

    const diag1 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.2, 6), this.matBambooDry);
    diag1.rotation.set(0, 0, 0.7);
    diag1.position.set(2.8, 1.8, 1.4);
    group.add(diag1);

    const diag2 = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.2, 6), this.matBambooDry);
    diag2.rotation.set(0, 0, -0.7);
    diag2.position.set(2.8, 1.8, 1.4);
    group.add(diag2);

    const ladderGroup = new THREE.Group();
    ladderGroup.position.set(3.6, 0, 3.2);
    ladderGroup.rotation.y = -0.3;
    ladderGroup.rotation.x = -0.28;

    [-0.2, 0.2].forEach(lx => {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.0, 6), this.matBambooDry);
      rail.position.set(lx, 1.4, 0);
      ladderGroup.add(rail);
    });

    for (let r = 0; r < 7; r++) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.44, 6), this.matTeakWood);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, 0.35 + r * 0.35, 0);
      ladderGroup.add(rung);
    }
    group.add(ladderGroup);
  }

  /**
   * 5. Festive Village Shops & Stalls
   */
  private buildFestiveShops(): void {
    // 1. Sweet Stall (Sri Ganesh Sweets & Laddus)
    const sweetStallGroup = new THREE.Group();
    sweetStallGroup.position.set(-14.5, 0, 10.5);
    sweetStallGroup.rotation.y = 0.35;

    // Wooden Counter Table
    const counterGeo = new THREE.BoxGeometry(3.6, 1.1, 1.4);
    const counter = new THREE.Mesh(counterGeo, this.matTeakWood);
    counter.position.y = 0.55;
    counter.castShadow = true;
    sweetStallGroup.add(counter);

    // Awning posts & striped canopy
    [-1.6, 1.6].forEach(x => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), this.matBambooDry);
      pole.position.set(x, 1.6, 0.6);
      sweetStallGroup.add(pole);
    });

    const awningGeo = new THREE.BoxGeometry(3.8, 0.2, 1.8);
    const awning = new THREE.Mesh(awningGeo, this.matMarigoldYellow);
    awning.position.set(0, 3.2, 0.3);
    awning.rotation.x = 0.15;
    sweetStallGroup.add(awning);

    // Brass Thaalis loaded with Laddus & Modaks
    [-1.0, 0, 1.0].forEach((x, idx) => {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.35, 0.06, 14), this.matBrass);
      plate.position.set(x, 1.15, 0.1);
      sweetStallGroup.add(plate);

      // Pyramid of golden laddus
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3 - row; col++) {
          const laddu = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), this.matMarigoldYellow);
          laddu.position.set(
            x + (col - (3 - row) / 2) * 0.14,
            1.22 + row * 0.12,
            0.1 + (idx % 2 === 0 ? 0.05 : -0.05)
          );
          sweetStallGroup.add(laddu);
        }
      }
    });

    // Propped sugarcane stalks
    [-1.7, 1.7].forEach(x => {
      const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.8, 8), this.matLeafGreen);
      cane.position.set(x, 1.9, 0.2);
      cane.rotation.z = x > 0 ? -0.2 : 0.2;
      sweetStallGroup.add(cane);
    });

    this.villageGroup.add(sweetStallGroup);

    this.collisionSystem.addCollider({
      id: 'shop_sweets',
      type: 'box',
      position: new THREE.Vector3(-14.5, 0.8, 10.5),
      size: new THREE.Vector3(4.0, 2.0, 2.0),
    });

    // 2. Pooja & Flower Stall
    const flowerStallGroup = new THREE.Group();
    flowerStallGroup.position.set(14.5, 0, 10.5);
    flowerStallGroup.rotation.y = -0.35;

    const flowerCounter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 1.4), this.matTeakWood);
    flowerCounter.position.y = 0.55;
    flowerCounter.castShadow = true;
    flowerStallGroup.add(flowerCounter);

    // Hanging Marigold Garlands
    for (let g = -1.4; g <= 1.4; g += 0.4) {
      const garland = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8),
        Math.abs(g) % 0.8 < 0.2 ? this.matMarigoldOrange : this.matMarigoldYellow
      );
      garland.position.set(g, 2.2, 0.5);
      flowerStallGroup.add(garland);
    }

    // Incense burner with gentle brass bowl
    const incense = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 10), this.matBrass);
    incense.position.set(1.1, 1.25, 0.1);
    flowerStallGroup.add(incense);

    this.villageGroup.add(flowerStallGroup);

    this.collisionSystem.addCollider({
      id: 'shop_flowers',
      type: 'box',
      position: new THREE.Vector3(14.5, 0.8, 10.5),
      size: new THREE.Vector3(4.0, 2.0, 2.0),
    });
  }

  /**
   * 6. Sacred Banyan Tree & Greenery
   */
  private buildTreesAndFlora(): void {
    // 1. GRAND SACRED BANYAN TREE (West of Square)
    const banyanGroup = new THREE.Group();
    banyanGroup.position.set(-22, 0, -4);

    // Circular stone platform (Katte) around banyan base
    const katteGeo = new THREE.CylinderGeometry(3.6, 4.0, 0.7, 16);
    const katte = new THREE.Mesh(katteGeo, this.matStoneGrey);
    katte.position.y = 0.35;
    katte.castShadow = true;
    katte.receiveShadow = true;
    banyanGroup.add(katte);

    // Gnarled wide trunk
    const banyanTrunk = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 5.5, 12), this.matTreeTrunk);
    banyanTrunk.position.y = 2.75;
    banyanTrunk.castShadow = true;
    banyanGroup.add(banyanTrunk);

    // Spreading Canopies
    const canopy1 = new THREE.Mesh(new THREE.SphereGeometry(4.5, 12, 12), this.matLeafGreen);
    canopy1.position.set(0, 6.8, 0);
    canopy1.castShadow = true;
    banyanGroup.add(canopy1);

    const canopy2 = new THREE.Mesh(new THREE.SphereGeometry(3.5, 10, 10), this.matGrass);
    canopy2.position.set(2.0, 7.4, -1.2);
    banyanGroup.add(canopy2);

    const canopy3 = new THREE.Mesh(new THREE.SphereGeometry(3.2, 10, 10), this.matLeafGreen);
    canopy3.position.set(-2.0, 7.0, 1.5);
    banyanGroup.add(canopy3);

    // Aerial prop roots dropping down
    const rootAngles = [0.8, 2.2, 3.8, 5.1];
    rootAngles.forEach(ang => {
      const rootGeo = new THREE.CylinderGeometry(0.14, 0.18, 4.8, 6);
      const root = new THREE.Mesh(rootGeo, this.matTreeTrunk);
      root.position.set(Math.cos(ang) * 2.6, 2.4, Math.sin(ang) * 2.6);
      root.rotation.z = Math.cos(ang) * 0.1;
      banyanGroup.add(root);
    });

    this.villageGroup.add(banyanGroup);

    this.collisionSystem.addCollider({
      id: 'sacred_banyan_tree',
      type: 'sphere',
      position: new THREE.Vector3(-22, 0, -4),
      radius: 3.8,
    });

    // 2. Mango & Neem Shade Trees along Village Perimeters
    const shadeTreePositions = [
      new THREE.Vector3(15, 0, -12),
      new THREE.Vector3(-24, 0, 16),
      new THREE.Vector3(24, 0, 16),
      new THREE.Vector3(-7, 0, -24),
    ];

    shadeTreePositions.forEach((pos, idx) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.copy(pos);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 4.2, 8), this.matTreeTrunk);
      trunk.position.y = 2.1;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      const foliage = new THREE.Mesh(new THREE.SphereGeometry(2.6, 10, 10), this.matLeafGreen);
      foliage.position.set(0, 4.8, 0);
      foliage.castShadow = true;
      treeGroup.add(foliage);

      // Marigold garland wrapped around trunk
      const wrapGarland = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.08, 6, 14), this.matMarigoldOrange);
      wrapGarland.rotation.x = Math.PI / 2;
      wrapGarland.position.y = 1.8;
      treeGroup.add(wrapGarland);

      this.villageGroup.add(treeGroup);

      this.collisionSystem.addCollider({
        id: `shade_tree_${idx}`,
        type: 'sphere',
        position: pos,
        radius: 1.4,
      });
    });
  }

  /**
   * 7. Festive Banners, Torans & Brass Deepams
   */
  private buildDecorationsAndLighting(): void {
    // 1. Grand Horizontal Cloth Banner across Main Village Street
    const bannerGroup = new THREE.Group();
    bannerGroup.position.set(0, 5.2, 12);

    const bannerGeo = new THREE.BoxGeometry(8.4, 1.1, 0.08);
    const bannerMat = new THREE.MeshLambertMaterial({ color: '#ea580c' });
    const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
    bannerGroup.add(bannerMesh);

    // Decorative Gold border trim
    const borderGeo = new THREE.BoxGeometry(8.5, 0.12, 0.1);
    const borderTop = new THREE.Mesh(borderGeo, this.matBrass);
    borderTop.position.y = 0.55;
    bannerGroup.add(borderTop);

    const borderBottom = new THREE.Mesh(borderGeo, this.matBrass);
    borderBottom.position.y = -0.55;
    bannerGroup.add(borderBottom);

    this.villageGroup.add(bannerGroup);

    // 2. Colorful Festive Pennant Buntings strung between houses
    const buntingLines = [
      { from: new THREE.Vector3(-12, 4.5, 5), to: new THREE.Vector3(-4, 5.0, 0) },
      { from: new THREE.Vector3(4, 5.0, 0), to: new THREE.Vector3(12, 4.5, 5) },
      { from: new THREE.Vector3(-5, 4.8, 14), to: new THREE.Vector3(5, 4.8, 14) },
    ];

    const buntingColors = [this.matMarigoldOrange, this.matMarigoldYellow, this.matCrimsonCloth, this.matGrass];
    buntingLines.forEach(line => {
      const segCount = 8;
      for (let s = 0; s < segCount; s++) {
        const t = s / segCount;
        const x = THREE.MathUtils.lerp(line.from.x, line.to.x, t);
        const z = THREE.MathUtils.lerp(line.from.z, line.to.z, t);
        const dip = Math.sin(t * Math.PI) * 0.4;
        const y = THREE.MathUtils.lerp(line.from.y, line.to.y, t) - dip;

        const pennantGeo = new THREE.ConeGeometry(0.25, 0.45, 3);
        const pennantMat = buntingColors[s % buntingColors.length];
        const pennant = new THREE.Mesh(pennantGeo, pennantMat);
        pennant.position.set(x, y - 0.22, z);
        pennant.rotation.z = Math.PI;
        this.villageGroup.add(pennant);
      }
    });

    // 3. Brass Lampstands (Kuthuvilakku) around Central Square
    const lampPositions = [
      new THREE.Vector3(-4.5, 0, 4.5),
      new THREE.Vector3(4.5, 0, 4.5),
      new THREE.Vector3(-4.5, 0, -4.5),
      new THREE.Vector3(4.5, 0, -4.5),
    ];

    lampPositions.forEach((pos, idx) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.copy(pos);

      // Ornate brass stand
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.25, 12), this.matBrass);
      base.position.y = 0.12;
      lampGroup.add(base);

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.8, 10), this.matBrass);
      shaft.position.y = 1.0;
      lampGroup.add(shaft);

      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.18, 0.18, 12), this.matBrass);
      bowl.position.y = 1.95;
      lampGroup.add(bowl);

      // Flickering Diya PointLight
      const lampLight = new THREE.PointLight('#f59e0b', 1.4, 12);
      lampLight.position.set(0, 2.2, 0);
      lampGroup.add(lampLight);
      this.lanternLights.push(lampLight);

      this.villageGroup.add(lampGroup);

      this.collisionSystem.addCollider({
        id: `deepam_lamp_${idx}`,
        type: 'sphere',
        position: pos,
        radius: 0.55,
      });
    });
  }

  /**
   * 8. Ambient NPC Villagers (Pujari, Lakshmi Aunty, Subbarao Uncle, Gopal)
   */
  private buildAmbientVillagers(): void {
    const villagers = [
      {
        name: 'Pujari Garu',
        pos: new THREE.Vector3(-2.2, 0, -1.8),
        dhotiColor: '#ea580c',
        angavastramColor: '#fffbeb',
        greeting: 'Subhamastu! The sacred muhurtham for Vinayaka Chavithi is approaching!',
      },
      {
        name: 'Lakshmi Aunty',
        pos: new THREE.Vector3(-12.5, 0, 7.5),
        dhotiColor: '#b91c1c',
        angavastramColor: '#facc15',
        greeting: 'Ramu babu! We are stringing fresh marigolds for the main idol.',
      },
      {
        name: 'Subbarao Uncle',
        pos: new THREE.Vector3(11.0, 0, 2.5),
        dhotiColor: '#fffbeb',
        angavastramColor: '#0284c7',
        greeting: '₹20,000 chanda is fantastic! Our village youth have made us all proud!',
      },
      {
        name: 'Carpenter Gopal',
        pos: new THREE.Vector3(3.2, 0, -3.2),
        dhotiColor: '#78716c',
        angavastramColor: '#d97706',
        greeting: 'The wooden mandapam will be sturdy and grand, Ramu!',
      },
    ];

    villagers.forEach(v => {
      const vGroup = new THREE.Group();
      vGroup.position.copy(v.pos);

      // Torso
      const bodyMat = new THREE.MeshLambertMaterial({ color: v.angavastramColor });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.7, 12), bodyMat);
      body.position.y = 1.15;
      body.castShadow = true;
      vGroup.add(body);

      // Dhoti / Lower clothing
      const dhotiMat = new THREE.MeshLambertMaterial({ color: v.dhotiColor });
      const dhoti = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.8, 12), dhotiMat);
      dhoti.position.y = 0.45;
      vGroup.add(dhoti);

      // Head with South-Asian warm skin
      const headMat = new THREE.MeshLambertMaterial({ color: '#c68642' });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 14), headMat);
      head.position.y = 1.85;
      head.castShadow = true;
      vGroup.add(head);

      // Hair / Turban
      const hairMat = new THREE.MeshLambertMaterial({ color: '#1c1917' });
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.37, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat);
      hair.position.y = 1.95;
      vGroup.add(hair);

      this.villageGroup.add(vGroup);
      this.ambientVillagers.push({ name: v.name, position: v.pos, greeting: v.greeting });

      // Solid collision barrier
      this.collisionSystem.addCollider({
        id: `ambient_npc_${v.name.replace(' ', '_')}`,
        type: 'sphere',
        position: v.pos,
        radius: 0.7,
      });
    });
  }

  /**
   * 9. PROPER JUNGLE ENTRANCE & SEAMLESS TRANSITION FROM RANGASTALAM TO JUNGLE
   * - Natural forest gateway with living arched trees and heavy carved timber portal
   * - Carved wooden signboards in Telugu and English
   * - Flanking tall Sal, Banyan, Peepal, Jamun trees, and Bamboo clumps
   * - Lush Lantana flowering bushes, wild ferns, and grass tufts
   * - Massive weathered Deccan granite mossy boulders and sacred stone cairns
   * - Natural dirt and stepping stone path leading into the forest
   * - Solid collisions so Ramu cannot walk through trees or rocks while keeping the central path clear
   */
  private buildForestPathAndGate(): void {
    // Relocated Jungle Entrance Gate: Moved farther away to create spacious rural transition
    const forestGatePos = new THREE.Vector3(24, 0, -68);
    const gateGroup = new THREE.Group();
    gateGroup.position.copy(forestGatePos);

    // Stone Plinth Foundations for Gate Posts (Spacious 7.2m portal width for vehicle & cart clearance)
    const granitePlinthMat = new THREE.MeshLambertMaterial({ color: '#57534e' });
    [-3.6, 3.6].forEach(x => {
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.7, 8), granitePlinthMat);
      plinth.position.set(x, 0.35, 0);
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      gateGroup.add(plinth);

      // Heavy Carved Teakwood Timber Gate Uprights
      const timberPost = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 6.0, 10), this.matTeakWood);
      timberPost.position.set(x, 3.35, 0);
      timberPost.castShadow = true;
      gateGroup.add(timberPost);

      // Carved Wooden Capital Bracket on top of post
      const capital = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 1.0), this.matTeakWood);
      capital.position.set(x, 6.2, 0);
      gateGroup.add(capital);

      // Hanging Ornate Brass Temple Bell
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.28, 0.42, 10), this.matBrass);
      bell.position.set(x, 5.0, 0.5);
      gateGroup.add(bell);

      // Hanging Brass Oil Lantern
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), this.matBrass);
      lantern.position.set(x, 4.4, 0.6);
      gateGroup.add(lantern);

      const gateGlow = new THREE.PointLight('#f59e0b', 1.8, 16);
      gateGlow.position.set(x, 4.4, 0.6);
      gateGroup.add(gateGlow);
      this.lanternLights.push(gateGlow);

      // Solid collision boundary for post
      this.collisionSystem.addCollider({
        id: `forest_gate_post_${x > 0 ? 'r' : 'l'}`,
        type: 'sphere',
        position: new THREE.Vector3(forestGatePos.x + x, 0, forestGatePos.z),
        radius: 1.1,
      });
    });

    // Massive Carved Wooden Lintel Crossbeam (Spans 9.2m across the wide portal)
    const crossbeam = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.6, 0.6), this.matTeakWood);
    crossbeam.position.set(0, 6.0, 0);
    crossbeam.castShadow = true;
    gateGroup.add(crossbeam);

    // Carved Directional Signboard: "RANGASTALAM JUNGLE • పవిత్ర అరణ్యం"
    const signBoardMat = new THREE.MeshStandardMaterial({ color: '#3e2311', roughness: 0.85 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.2, 0.2), signBoardMat);
    sign.position.set(0, 6.9, 0);
    sign.castShadow = true;
    gateGroup.add(sign);

    // Golden Sign Inscription Border
    const signBorder = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 1.28, 0.18),
      new THREE.MeshBasicMaterial({ color: '#f59e0b' })
    );
    signBorder.position.set(0, 6.9, -0.01);
    gateGroup.add(signBorder);

    // Secondary Directional Subtitle Board: "EKA VIMSHATHI PATRA • 21 SACRED LEAF SANCTUARY ➔"
    const subSign = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.5, 0.16), signBoardMat);
    subSign.position.set(0, 5.35, 0);
    gateGroup.add(subSign);

    // Floral Mango Leaf Toranam across the timber arch
    for (let t = -3.4; t <= 3.4; t += 0.4) {
      const toranLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.38, 4), this.matBananaLeaf);
      toranLeaf.rotation.z = Math.PI;
      toranLeaf.position.set(t, 5.65, 0.32);
      gateGroup.add(toranLeaf);
    }

    // LIVING OVERARCHING TREES (Left and Right branches meeting overhead to form a natural gateway)
    const leftArchTree = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.75, 7.0, 8), this.matTreeTrunk);
    leftArchTree.position.set(-4.8, 3.5, -0.6);
    leftArchTree.rotation.z = -0.22;
    gateGroup.add(leftArchTree);

    const rightArchTree = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.75, 7.0, 8), this.matTreeTrunk);
    rightArchTree.position.set(4.8, 3.5, -0.6);
    rightArchTree.rotation.z = 0.22;
    gateGroup.add(rightArchTree);

    // Intertwined Living Arch Foliage Canopy
    const archCanopy1 = new THREE.Mesh(new THREE.SphereGeometry(3.0, 8, 8), this.matLeafGreen);
    archCanopy1.position.set(-1.8, 7.5, -0.9);
    gateGroup.add(archCanopy1);

    const archCanopy2 = new THREE.Mesh(new THREE.SphereGeometry(3.2, 8, 8), this.matGrass);
    archCanopy2.position.set(1.8, 7.7, -0.9);
    gateGroup.add(archCanopy2);

    // Dangling Jungle Lianas / Creeper Vines hanging from the canopy
    const vineMat = new THREE.MeshLambertMaterial({ color: '#365314' });
    [-2.4, -1.2, 1.2, 2.4].forEach((vx, idx) => {
      const vineCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(vx, 6.0, 0.2),
        new THREE.Vector3(vx + (idx % 2 === 0 ? 0.18 : -0.18), 4.8, 0.25),
        new THREE.Vector3(vx, 3.8, 0.2),
      ]);
      const vine = new THREE.Mesh(new THREE.TubeGeometry(vineCurve, 8, 0.04, 5, false), vineMat);
      gateGroup.add(vine);
    });

    this.villageGroup.add(gateGroup);

    // MASSIVE WEATHERED DECCAN GRANITE BOULDERS FLANKING ENTRANCE (shifted to new gate position)
    const rockMat = new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.9 });
    const mossMat = new THREE.MeshLambertMaterial({ color: '#166534' });

    // Left Boulder Cluster at (18.2, 0, -66.5)
    const leftBoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 1), rockMat);
    leftBoulder.scale.set(1.4, 1.2, 1.3);
    leftBoulder.position.set(18.2, 1.2, -66.5);
    leftBoulder.castShadow = true;
    leftBoulder.receiveShadow = true;
    this.villageGroup.add(leftBoulder);

    const leftMoss = new THREE.Mesh(new THREE.SphereGeometry(1.0, 6, 6), mossMat);
    leftMoss.scale.set(1.3, 0.35, 1.2);
    leftMoss.position.set(18.2, 2.3, -66.5);
    this.villageGroup.add(leftMoss);

    this.collisionSystem.addCollider({
      id: 'jungle_entrance_boulder_l',
      type: 'sphere',
      position: new THREE.Vector3(18.2, 0, -66.5),
      radius: 1.8,
    });

    // Right Boulder Cluster at (29.8, 0, -66.8)
    const rightBoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), rockMat);
    rightBoulder.scale.set(1.3, 1.15, 1.4);
    rightBoulder.position.set(29.8, 1.1, -66.8);
    rightBoulder.castShadow = true;
    rightBoulder.receiveShadow = true;
    this.villageGroup.add(rightBoulder);

    const rightMoss = new THREE.Mesh(new THREE.SphereGeometry(0.9, 6, 6), mossMat);
    rightMoss.scale.set(1.2, 0.3, 1.3);
    rightMoss.position.set(29.8, 2.1, -66.8);
    this.villageGroup.add(rightMoss);

    this.collisionSystem.addCollider({
      id: 'jungle_entrance_boulder_r',
      type: 'sphere',
      position: new THREE.Vector3(29.8, 0, -66.8),
      radius: 1.7,
    });

    // Sacred River Stone Boundary Cairns (Stacked Stones with Vermilion dots)
    [-3.0, 3.0].forEach(cx => {
      const cairnPos = new THREE.Vector3(forestGatePos.x + cx, 0, forestGatePos.z + 2.0);
      for (let s = 0; s < 4; s++) {
        const stone = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.3 - s * 0.05, 0),
          rockMat
        );
        stone.scale.set(1.2, 0.6, 1.1);
        stone.position.set(cairnPos.x, 0.16 + s * 0.24, cairnPos.z);
        stone.castShadow = true;
        this.villageGroup.add(stone);
      }
      const kumkum = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), new THREE.MeshBasicMaterial({ color: '#dc2626' }));
      kumkum.position.set(cairnPos.x, 1.05, cairnPos.z);
      this.villageGroup.add(kumkum);
    });

    // RURAL TRANSITION ZONE (Between Village z = -28 and Jungle Gate z = -68)
    // The road verges are kept clear, open, and naturally traversable without blocking fences
    // so Ramu and companions navigate smoothly into the jungle route.

    // Open Countryside Meadow Trees (Sparse, sunlit trees - not dense jungle)
    const meadowTrees = [
      { x: 0, z: -36, r: 0.45, h: 4.5, canopyR: 2.8 },
      { x: -8, z: -48, r: 0.5, h: 5.0, canopyR: 3.2 },
      { x: 2, z: -58, r: 0.45, h: 4.6, canopyR: 2.9 },
      { x: 34, z: -38, r: 0.45, h: 4.8, canopyR: 3.0 },
      { x: 38, z: -54, r: 0.5, h: 5.2, canopyR: 3.4 },
    ];

    meadowTrees.forEach((mt, mIdx) => {
      const tree = new THREE.Group();
      tree.position.set(mt.x, 0, mt.z);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(mt.r * 0.75, mt.r, mt.h, 8), this.matTreeTrunk);
      trunk.position.y = mt.h * 0.5;
      trunk.castShadow = true;
      tree.add(trunk);

      const foliage = new THREE.Mesh(new THREE.SphereGeometry(mt.canopyR, 8, 8), this.matLeafGreen);
      foliage.position.y = mt.h + mt.canopyR * 0.4;
      foliage.castShadow = true;
      tree.add(foliage);

      this.villageGroup.add(tree);

      this.collisionSystem.addCollider({
        id: `meadow_tree_${mIdx}`,
        type: 'sphere',
        position: new THREE.Vector3(mt.x, 0, mt.z),
        radius: mt.r * 1.8 + 0.3,
      });
    });

    // LUSH FLANKING BUSHES & FLORA AT JUNGLE GATE
    const bushColors = ['#15803d', '#166534', '#4d7c0f', '#14532d'];
    const lantanaFlowerColors = ['#f59e0b', '#ec4899', '#ea580c', '#eab308'];
    const bushLocations = [
      { x: 19.5, z: -65.5, r: 1.1 },
      { x: 17.0, z: -68.0, r: 1.3 },
      { x: 18.5, z: -70.5, r: 1.2 },
      { x: 28.5, z: -65.5, r: 1.1 },
      { x: 31.0, z: -68.2, r: 1.35 },
      { x: 29.5, z: -71.0, r: 1.2 },
    ];

    bushLocations.forEach((b, idx) => {
      const bushMat = new THREE.MeshLambertMaterial({ color: bushColors[idx % bushColors.length] });
      const bush = new THREE.Mesh(new THREE.SphereGeometry(b.r, 7, 7), bushMat);
      bush.scale.set(1.3, 0.75, 1.3);
      bush.position.set(b.x, b.r * 0.65, b.z);
      bush.castShadow = true;
      this.villageGroup.add(bush);

      for (let fl = 0; fl < 4; fl++) {
        const flMesh = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.12, 0),
          new THREE.MeshLambertMaterial({ color: lantanaFlowerColors[(idx + fl) % lantanaFlowerColors.length] })
        );
        flMesh.position.set(
          b.x + (Math.sin(fl * 1.5) * b.r * 0.6),
          b.r * 0.95,
          b.z + (Math.cos(fl * 1.5) * b.r * 0.6)
        );
        this.villageGroup.add(flMesh);
      }
    });

    // NATURAL PATH EMBEDDED STEPPING STONES (Leading deeper through forest to grove)
    const stoneStepMat = new THREE.MeshLambertMaterial({ color: '#78716c' });
    for (let pz = -69; pz >= -95; pz -= 2.6) {
      const stepStone = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.06, 8), stoneStepMat);
      stepStone.position.set(24.5 + (Math.sin(pz * 0.5) * 0.8), 0.03, pz);
      stepStone.receiveShadow = true;
      this.villageGroup.add(stepStone);
    }

    // DENSE JUNGLE TREES & VEGETATION (Starting beyond the gate into deep forest)
    const jungleTrees = [
      // Left side deep forest trees
      { x: 15, z: -72, type: 'sal', r: 0.75, h: 9.5, canopyR: 4.0 },
      { x: 12, z: -78, type: 'bamboo', r: 0.12, h: 8.0, canopyR: 2.4 },
      { x: 16, z: -84, type: 'teak', r: 0.75, h: 9.0, canopyR: 3.8 },
      { x: 13, z: -90, type: 'sal', r: 0.8, h: 10.2, canopyR: 4.2 },
      { x: 17, z: -98, type: 'banyan', r: 1.2, h: 10.5, canopyR: 5.4 },

      // Right side deep forest trees
      { x: 33, z: -72, type: 'peepal', r: 0.85, h: 9.2, canopyR: 4.2 },
      { x: 35, z: -78, type: 'jamun', r: 0.7, h: 8.5, canopyR: 3.6 },
      { x: 31, z: -84, type: 'bamboo', r: 0.12, h: 8.2, canopyR: 2.4 },
      { x: 36, z: -90, type: 'sal', r: 0.75, h: 9.6, canopyR: 3.8 },
      { x: 34, z: -96, type: 'teak', r: 0.8, h: 9.2, canopyR: 3.9 },
      { x: 20, z: -106, type: 'sal', r: 0.75, h: 9.5, canopyR: 3.6 },
      { x: 32, z: -108, type: 'banyan', r: 1.2, h: 11.0, canopyR: 5.6 },
    ];

    jungleTrees.forEach((jt, idx) => {
      const treeNode = new THREE.Group();
      treeNode.position.set(jt.x, 0, jt.z);

      if (jt.type === 'bamboo') {
        for (let b = 0; b < 6; b++) {
          const bAngle = (b * Math.PI * 2) / 6;
          const stalk = new THREE.Mesh(
            new THREE.CylinderGeometry(jt.r, jt.r * 1.15, jt.h, 6),
            this.matBamboo
          );
          stalk.position.set(Math.cos(bAngle) * 0.45, jt.h * 0.5, Math.sin(bAngle) * 0.45);
          stalk.castShadow = true;
          treeNode.add(stalk);
        }
        const bFoliage = new THREE.Mesh(new THREE.SphereGeometry(jt.canopyR, 6, 6), this.matLeafGreen);
        bFoliage.position.y = jt.h + 0.5;
        bFoliage.scale.set(1.1, 0.6, 1.1);
        treeNode.add(bFoliage);
      } else {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(jt.r * 0.75, jt.r, jt.h, 10),
          this.matTreeTrunk
        );
        trunk.position.y = jt.h * 0.5;
        trunk.castShadow = true;
        treeNode.add(trunk);

        const canopy1 = new THREE.Mesh(
          new THREE.SphereGeometry(jt.canopyR, 10, 10),
          this.matLeafGreen
        );
        canopy1.position.y = jt.h + jt.canopyR * 0.4;
        canopy1.castShadow = true;
        treeNode.add(canopy1);

        const canopy2 = new THREE.Mesh(
          new THREE.SphereGeometry(jt.canopyR * 0.75, 8, 8),
          this.matGrass
        );
        canopy2.position.set(jt.canopyR * 0.35, jt.h + jt.canopyR * 0.75, -jt.canopyR * 0.25);
        treeNode.add(canopy2);
      }

      this.villageGroup.add(treeNode);

      this.collisionSystem.addCollider({
        id: `jungle_entrance_tree_${idx}`,
        type: 'sphere',
        position: new THREE.Vector3(jt.x, 0, jt.z),
        radius: jt.r * 1.6 + 0.4,
      });
    });

    // Forest Destination Waypoint Beacon (Subtle golden-green glow beacon at sacred forest grove)
    const beaconGroup = new THREE.Group();
    beaconGroup.name = 'forest_waypoint_beacon';
    beaconGroup.position.set(26, 0.05, -98);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 2.2, 24),
      new THREE.MeshBasicMaterial({ color: '#22c55e', side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
    );
    ring.rotation.x = -Math.PI / 2;
    beaconGroup.add(ring);

    // Golden ethereal pillar
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.6, 6.0, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: '#86efac', transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    beam.position.y = 3.0;
    beaconGroup.add(beam);

    this.villageGroup.add(beaconGroup);
  }

  // =========================================================================
  // Paper Bag Beside Ganesh Mandapam API & Level 1 Submission
  // =========================================================================

  public getMandapamPaperBagPosition(): THREE.Vector3 {
    return this.paperBagPosition.clone();
  }

  public hideMandapamPaperBag(): void {
    this.isMandapamBagPickedUp = true;
    this.mandapamPaperBagGroup.visible = false;
    this.collisionSystem.removeCollider('mandapam_paper_bag_stand');
  }

  public setLevel1TaskCompleted(completed: boolean): void {
    if (completed) {
      this.isMandapamBagPickedUp = true;
      this.mandapamPaperBagGroup.visible = false;
      this.mandapamSubmittedBagGroup.visible = false;
      this.collisionSystem.removeCollider('mandapam_paper_bag_stand');
    }
  }

  public resetMandapamPaperBag(): void {
    this.isMandapamBagPickedUp = false;
    this.mandapamPaperBagGroup.visible = true;
    this.mandapamSubmittedBagGroup.visible = false;
    this.collisionSystem.removeCollider('mandapam_paper_bag_stand');
    this.collisionSystem.addCollider({
      id: 'mandapam_paper_bag_stand',
      type: 'sphere',
      position: new THREE.Vector3(this.paperBagPosition.x, 0, this.paperBagPosition.z),
      radius: 0.6,
    });
  }

  public showSubmittedPaperBag(): void {
    this.mandapamSubmittedBagGroup.visible = true;
  }

  public isMandapamPaperBagPickedUpState(): boolean {
    return this.isMandapamBagPickedUp;
  }

  public getMandapamOrganizerNPC(): MandapamOrganizerNPC | null {
    return this.mandapamOrganizerNPC;
  }
}
