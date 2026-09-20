/**
 * THE KATHA - Festive Cultural Layer
 *
 * Implements a rich, culturally authentic festival environment throughout Rangastalam:
 * 1. Lord Ganesha Stories:
 *    - Pradakshina Story Shrine (Wisdom that parents embody the entire universe)
 *    - Sage Vyasa & Ganesha Mahabharata Scribe Desk (The unbroken stylus / broken tusk)
 *    - Kubera's Feast & Durva Grass Lesson (Devotion over ostentation)
 * 2. Modaks & Festive Sweets:
 *    - Traditional Sweet Maker's Stall (Sri Vinayaka Mithai Bhandar) with chulha stove, brass kadai,
 *      steaming Ukadiche Modaks, motichoor laddus, jaggery blocks, coconuts & banana leaf platters
 * 3. Mushak:
 *    - Preserved as existing guide character; subtle devotional offering plate at altar feet
 * 4. Pandals & Decorations:
 *    - North-West Community Pandal with peacock-teal & saffron shamiana, brass bells & eco clay idol
 *    - East Bazaar Pandal with yellow marigold arches & festive cloth
 *    - Hanging marigold malas, mango leaf toranams, brass deepams & fairy light festoons
 * 5. Rangoli:
 *    - Lotus Padmam Rangolis, auspicious Kolam thresholds, radiant flower petal mandalas
 * 6. Dhol & Procession Atmosphere:
 *    - Traditional 3D Nashik Dhol, Tasha drums, and brass Manjira cymbals
 * 7. Puja Elements:
 *    - Terracotta Diyas, 21 Durva grass leaf bundles, haldi-kumkum katoris, agarbatti stands, red hibiscus
 * 8. Visarjan / Nimajjanam Waterside Area:
 *    - At Kalyani Bathing Ghats: Procession ramp, saffron canopy, floating leaf donas with glowing diyas,
 *      Maha Harathi deepam stand, sacred conch
 * 9. Eco-Friendly Clay Murtis (Shaadu Maati):
 *    - Natural earthen clay idols at pandals and an artisan drying plank displaying clay craft
 *
 * WORLD CONSISTENCY:
 * - Persistent across all 3 levels, maintaining the seamless illusion of one living world.
 */

import * as THREE from 'three';
import { CollisionSystem } from '../collisions/CollisionSystem';

export class FestiveCulturalLayer {
  public group: THREE.Group = new THREE.Group();
  private collisionSystem: CollisionSystem;
  public lanternLights: THREE.PointLight[] = [];

  // Floating donas in river for gentle animation
  private floatingDonas: THREE.Group[] = [];

  // Shared Materials (optimized palette)
  private matEarthenClay = new THREE.MeshLambertMaterial({ color: '#784825' }); // Natural unbaked Shaadu Maati
  private matTerracotta = new THREE.MeshLambertMaterial({ color: '#b45309' }); // Baked earthen diya tone
  private matFlame = new THREE.MeshBasicMaterial({ color: '#ffea75' }); // Glowing flame
  private matMarigoldOrange = new THREE.MeshLambertMaterial({ color: '#ea580c' }); // Fresh marigold orange
  private matMarigoldYellow = new THREE.MeshLambertMaterial({ color: '#facc15' }); // Golden yellow marigold
  private matJasmineWhite = new THREE.MeshLambertMaterial({ color: '#fffbeb' }); // Fragrant jasmine flower
  private matMangoLeaf = new THREE.MeshLambertMaterial({ color: '#65a30d' }); // Fresh mango leaf
  private matDurvaGrass = new THREE.MeshLambertMaterial({ color: '#15803d' }); // Sacred 21 Durva grass
  private matHibiscusRed = new THREE.MeshLambertMaterial({ color: '#dc2626' }); // Sacred red hibiscus
  private matBrass = new THREE.MeshLambertMaterial({ color: '#eab308' }); // Traditional polished brass
  private matTeakWood = new THREE.MeshLambertMaterial({ color: '#451a03' }); // Deep carved teak
  private matBamboo = new THREE.MeshLambertMaterial({ color: '#ca8a04' }); // Golden cured bamboo
  private matStoneGranite = new THREE.MeshLambertMaterial({ color: '#57534e' }); // Ancient stone plinths
  private matSaffronCloth = new THREE.MeshLambertMaterial({ color: '#ea580c' }); // Holy saffron fabric
  private matCrimsonCloth = new THREE.MeshLambertMaterial({ color: '#991b1b' }); // Festival vermilion fabric
  private matPeacockTeal = new THREE.MeshLambertMaterial({ color: '#0f766e' }); // Festive peacock teal
  private matWhiteRice = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
  private matRedKumkum = new THREE.MeshBasicMaterial({ color: '#b91c1c', side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
  private matTurmericYellow = new THREE.MeshBasicMaterial({ color: '#fde047', side: THREE.DoubleSide, transparent: true, opacity: 0.92 });

  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem;
    this.group.name = 'festive_cultural_layer';
  }

  public build(): void {
    // 1. Lord Ganesha Stories (Visual Storytelling Areas)
    this.buildPradakshinaStoryShrine();
    this.buildMahabharataScribeTable();
    this.buildKuberaFeastStoryCorner();

    // 2. Modaks & Festive Sweets Stalls
    this.buildSweetMakerStall();

    // 3. Community Pandals & Regional Decorations
    this.buildNorthWestCommunityPandal();
    this.buildEastBazaarPandal();

    // 4. Village Street Torans, Buntings & Fairy Lights
    this.buildStreetGarlandsAndLights();

    // 5. Authentic Rangolis throughout Paths & Thresholds
    this.buildRangoliPatterns();

    // 6. Dhol & Procession Atmosphere Props
    this.buildProcessionInstruments();

    // 7. Puja Elements: Diyas, Durva Grass, Agarbatti, Aarti Plates
    this.buildPujaAndDevotionalElements();

    // 8. Visarjan / Nimajjanam Waterside Area at Kalyani Ghats
    this.buildVisarjanWatersideArea();

    // 9. Eco-Friendly Clay Murtis & Artisan Craft Workshop
    this.buildClayMurtiCraftDisplay();
  }

  // =========================================================================
  // 1. LORD GANESHA STORIES (Visual Storytelling Zones)
  // =========================================================================

  /**
   * The Circumambulation (Pradakshina) Story Shrine:
   * Near the Sacred Banyan Tree (X: -11.5, Z: -7.5).
   * Visualizes the supreme wisdom where Lord Ganesha circled His parents Shiva and Parvati,
   * showing that loving parents are the entire universe.
   */
  private buildPradakshinaStoryShrine(): void {
    const shrine = new THREE.Group();
    shrine.position.set(-11.5, 0, -7.5);

    // Carved Granite Octagonal Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.45, 8), this.matStoneGranite);
    base.position.y = 0.225;
    base.receiveShadow = true;
    shrine.add(base);

    // Carved Story Stele / Tablet
    const tabletBack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.9, 0.28), this.matStoneGranite);
    tabletBack.position.set(0, 1.4, -0.15);
    tabletBack.castShadow = true;
    shrine.add(tabletBack);

    // Arched Top on Stele
    const archTop = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.28, 16, 1, false, 0, Math.PI), this.matStoneGranite);
    archTop.rotation.z = -Math.PI / 2;
    archTop.position.set(0, 2.35, -0.15);
    shrine.add(archTop);

    // Sculpted Relief of Shiva & Parvati (Symbolized in sacred bronze relief)
    const shivaParvatiRelief = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 0.75, 8), this.matBrass);
    shivaParvatiRelief.position.set(0, 1.5, 0.05);
    shrine.add(shivaParvatiRelief);

    // Halo (Prabhavali) around the divine parents
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 6, 16), this.matBrass);
    halo.position.set(0, 1.85, 0.04);
    shrine.add(halo);

    // Small respectful Ganesha relief circling reverently with folded hands
    const ganeshaRelief = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), this.matBrass);
    ganeshaRelief.position.set(0.65, 1.25, 0.15);
    shrine.add(ganeshaRelief);

    // Circumambulation Circular Groove (Footpath path carved in lotus stone)
    const lotusRing = new THREE.Mesh(new THREE.RingGeometry(0.65, 0.95, 16), this.matMarigoldOrange);
    lotusRing.rotation.x = -Math.PI / 2;
    lotusRing.position.y = 0.46;
    shrine.add(lotusRing);

    // Inscribed Brass Story Plaque at Base
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.06), this.matBrass);
    plaque.position.set(0, 0.48, 0.75);
    plaque.rotation.x = -0.35;
    shrine.add(plaque);

    // Flanking Brass Deepam Lamps with gentle warm light
    [-1.2, 1.2].forEach(x => {
      const diya = this.createBrassStandingDiya(x, 0.45, 0.4);
      shrine.add(diya);
    });

    // Solid Collider
    this.collisionSystem.addCollider({
      id: 'story_shrine_pradakshina',
      type: 'sphere',
      position: new THREE.Vector3(-11.5, 0, -7.5),
      radius: 1.8,
    });

    this.group.add(shrine);
  }

  /**
   * The Scribe of the Mahabharata Table:
   * Near the scholar's garden (X: 13.5, Z: -6.5).
   * Depicts Sage Vyasa's palm leaf manuscripts, the inkpot, and the broken tusk quill
   * with which Lord Ganesha wrote the great epic without pause.
   */
  private buildMahabharataScribeTable(): void {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(13.5, 0, -6.5);

    // Low Teakwood Scholar's Platform (Peedam)
    const platform = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 1.6), this.matTeakWood);
    platform.position.y = 0.175;
    platform.castShadow = true;
    tableGroup.add(platform);

    // Carved Writing Desk (Veda Peetham)
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.9), this.matTeakWood);
    desk.position.set(0, 0.6, 0);
    desk.castShadow = true;
    tableGroup.add(desk);

    // Palm Leaf Manuscripts (Taalapatra Granthas) tied with red sacred strings
    [-0.35, 0.35].forEach((z, idx) => {
      const bundle = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.25), this.matBamboo);
      bundle.position.set(0, 0.88 + idx * 0.08, z);
      tableGroup.add(bundle);

      // Red sacred binding thread
      const thread = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.27), this.matCrimsonCloth);
      thread.position.set(0, 0.88 + idx * 0.08, z);
      tableGroup.add(thread);
    });

    // The Sacred Broken Tusk Stylus (Ivory/gold stylus quill)
    const stylus = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.45, 8), this.matJasmineWhite);
    stylus.rotation.z = Math.PI / 3;
    stylus.rotation.y = 0.2;
    stylus.position.set(0.25, 0.92, 0.05);
    tableGroup.add(stylus);

    // Traditional Brass Inkpot (Masipatram)
    const inkpot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.16, 8), this.matBrass);
    inkpot.position.set(-0.45, 0.93, 0.1);
    tableGroup.add(inkpot);

    // Roll of Woven Grass Asana mat for seating
    const asana = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8), this.matDurvaGrass);
    asana.rotation.z = Math.PI / 2;
    asana.position.set(0, 0.38, -0.65);
    tableGroup.add(asana);

    // Small Brass Ghanta (bell) & Diya
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 8), this.matBrass);
    bell.position.set(0.65, 0.92, -0.2);
    tableGroup.add(bell);

    const diya = this.createClayDiya(0.65, 0.88, 0.2);
    tableGroup.add(diya);

    this.collisionSystem.addCollider({
      id: 'story_scribe_table',
      type: 'box',
      position: new THREE.Vector3(13.5, 0, -6.5),
      size: new THREE.Vector3(2.6, 1.5, 2.0),
    });

    this.group.add(tableGroup);
  }

  /**
   * Kubera's Feast & Durva Grass Lesson:
   * Near the village pantry / storage corner (X: -10.5, Z: 11.5).
   * Illustrates how whole storehouses of riches could not satisfy Ganesha's hunger,
   * but a single pure blade of Durva grass offered with love brought divine peace.
   */
  private buildKuberaFeastStoryCorner(): void {
    const corner = new THREE.Group();
    corner.position.set(-10.5, 0, 11.5);

    // Low Stone Platform
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 1.8), this.matStoneGranite);
    plinth.position.y = 0.15;
    corner.add(plinth);

    // Large Golden Brass Grain Urn (Kubera's Treasury vessel)
    const largeUrn = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 10), this.matBrass);
    largeUrn.position.set(-0.55, 0.65, -0.2);
    corner.add(largeUrn);

    const urnRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 6, 12), this.matBrass);
    urnRim.rotation.x = Math.PI / 2;
    urnRim.position.set(-0.55, 1.05, -0.2);
    corner.add(urnRim);

    // Second Brass Vessel overflowing with sacred grains
    const medUrn = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), this.matBrass);
    medUrn.position.set(-0.55, 0.5, 0.45);
    corner.add(medUrn);

    // Elevated Central Carved Silver Platter with the Holy Durva Grass
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.45, 8), this.matStoneGranite);
    pedestal.position.set(0.45, 0.45, 0.1);
    corner.add(pedestal);

    const silverThali = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.32, 0.04, 12), this.matJasmineWhite);
    silverThali.position.set(0.45, 0.7, 0.1);
    corner.add(silverThali);

    // 21 Blades of Sacred Green Durva Grass bouquet in the center of silver thali
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.03), this.matDurvaGrass);
      blade.position.set(0.45 + Math.cos(ang) * 0.08, 0.8, 0.1 + Math.sin(ang) * 0.08);
      blade.rotation.z = Math.cos(ang) * 0.35;
      corner.add(blade);
    }

    // Gentle diya beside the offering
    const diya = this.createClayDiya(0.45, 0.72, 0.4);
    corner.add(diya);

    this.collisionSystem.addCollider({
      id: 'story_kubera_corner',
      type: 'box',
      position: new THREE.Vector3(-10.5, 0, 11.5),
      size: new THREE.Vector3(2.4, 1.6, 2.0),
    });

    this.group.add(corner);
  }

  // =========================================================================
  // 2. MODAKS AND FESTIVE SWEETS
  // =========================================================================

  /**
   * Traditional Village Confectioner's Stall (Sri Vinayaka Mithai Bhandar):
   * Located at (X: -8.8, Z: 9.2).
   * Boasts an authentic earthen chulha stove, brass kadai, steaming bamboo trays of fresh Ukadiche Modaks,
   * golden motichoor laddus, jaggery blocks, sliced coconuts, and banana leaf gift plates.
   */
  private buildSweetMakerStall(): void {
    const stall = new THREE.Group();
    stall.position.set(-8.8, 0, 9.2);
    stall.rotation.y = 0.35;

    // Wooden Counter Table
    const counter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 1.4), this.matTeakWood);
    counter.position.set(0, 0.45, 0);
    counter.castShadow = true;
    stall.add(counter);

    // Colorful Saffron Awning over sweet table
    [-1.4, 1.4].forEach(x => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), this.matBamboo);
      pole.position.set(x, 1.3, 0.6);
      stall.add(pole);
    });

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 1.6), this.matSaffronCloth);
    canopy.position.set(0, 2.5, 0.2);
    canopy.rotation.x = 0.12;
    stall.add(canopy);

    // Earthen Chulha Stove beside counter with warm glowing embers
    const chulha = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.45, 10), this.matTerracotta);
    chulha.position.set(-1.8, 0.225, 0.1);
    stall.add(chulha);

    const emberGlow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), new THREE.MeshBasicMaterial({ color: '#f97316' }));
    emberGlow.position.set(-1.8, 0.32, 0.1);
    stall.add(emberGlow);

    // Big Hammered Brass Kadai / Uruli atop Chulha
    const kadai = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), this.matBrass);
    kadai.position.set(-1.8, 0.45, 0.1);
    stall.add(kadai);

    // Steaming Ukadiche Modak Display Tray
    const modakTray = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.45, 0.08, 12), this.matBamboo);
    modakTray.position.set(-0.65, 0.94, 0.1);
    stall.add(modakTray);

    // Steamed pleated white Modaks arranged in a concentric pyramid
    for (let r = 0; r < 6; r++) {
      const ang = (r / 6) * Math.PI * 2;
      const modak = this.createUkadicheModak();
      modak.position.set(-0.65 + Math.cos(ang) * 0.25, 0.98, 0.1 + Math.sin(ang) * 0.25);
      stall.add(modak);
    }
    const centerModak = this.createUkadicheModak();
    centerModak.position.set(-0.65, 1.06, 0.1);
    stall.add(centerModak);

    // Golden Motichoor Laddu Thali
    const ladduThali = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.06, 12), this.matBrass);
    ladduThali.position.set(0.65, 0.93, 0.1);
    stall.add(ladduThali);

    // Pyramid of golden laddus
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2;
      const laddu = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), this.matMarigoldYellow);
      laddu.position.set(0.65 + Math.cos(ang) * 0.22, 0.98, 0.1 + Math.sin(ang) * 0.22);
      stall.add(laddu);
    }
    const topLaddu = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), this.matMarigoldYellow);
    topLaddu.position.set(0.65, 1.08, 0.1);
    stall.add(topLaddu);

    // Blocks of Natural Earthen Jaggery (Gud Bhelas) & Coconuts
    const jaggeryBlock = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.28, 6), this.matEarthenClay);
    jaggeryBlock.position.set(0, 0.98, -0.35);
    stall.add(jaggeryBlock);

    const coconutHalf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), this.matTeakWood);
    coconutHalf.position.set(0.45, 0.95, -0.35);
    stall.add(coconutHalf);

    // Stacks of Festive Sweet Gift Boxes (in saffron & gold paper)
    [-0.3, 0.3].forEach((z, idx) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.28), idx === 0 ? this.matCrimsonCloth : this.matSaffronCloth);
      box.position.set(-0.15, 0.98, z + 0.15);
      stall.add(box);
    });

    this.collisionSystem.addCollider({
      id: 'sweet_maker_stall',
      type: 'box',
      position: new THREE.Vector3(-8.8, 0, 9.2),
      size: new THREE.Vector3(3.6, 2.6, 2.2),
    });

    this.group.add(stall);
  }

  /**
   * Helper: Creates an authentic Ukadiche Modak mesh with pinched top tip
   */
  private createUkadicheModak(): THREE.Group {
    const modak = new THREE.Group();

    // Plump dumpling base
    const base = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), this.matJasmineWhite);
    base.scale.set(1.1, 0.85, 1.1);
    base.position.y = 0.05;
    modak.add(base);

    // Pointed pinched crest
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.08, 8), this.matJasmineWhite);
    crest.position.y = 0.11;
    modak.add(crest);

    // Tiny saffron/kumkum dot atop modak
    const saffronKesar = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 4), this.matMarigoldOrange);
    saffronKesar.position.y = 0.15;
    modak.add(saffronKesar);

    return modak;
  }

  // =========================================================================
  // 3. PANDALS AND REGIONAL DECORATIONS
  // =========================================================================

  /**
   * North-West Community Pandal:
   * Located at (X: -16.0, Z: -12.0) in the weavers and artisan lane.
   * Features colorful shamiana canopy, marigold garlands, and an authentic Eco-Friendly Clay Ganesha Murti!
   */
  private buildNorthWestCommunityPandal(): void {
    const pandal = new THREE.Group();
    pandal.position.set(-16.0, 0, -12.0);

    // Raised Sandstone Platform Base
    const platform = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.35, 4.8), this.matStoneGranite);
    platform.position.y = 0.175;
    platform.receiveShadow = true;
    pandal.add(platform);

    // 4 Decorated Bamboo Upright Posts
    const posts = [
      { x: -2.1, z: -2.1 },
      { x: 2.1, z: -2.1 },
      { x: -2.1, z: 2.1 },
      { x: 2.1, z: 2.1 },
    ];

    posts.forEach((p, idx) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.2, 8), this.matBamboo);
      pole.position.set(p.x, 2.1, p.z);
      pole.castShadow = true;
      pandal.add(pole);

      // Banana Plant tied to post
      const bananaTree = this.createBananaStalk();
      bananaTree.position.set(p.x + (p.x > 0 ? 0.2 : -0.2), 0.2, p.z + (p.z > 0 ? 0.2 : -0.2));
      pandal.add(bananaTree);

      // Hanging Brass Bell from crossbeam
      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 8), this.matBrass);
      bell.position.set(p.x * 0.85, 3.8, p.z * 0.85);
      pandal.add(bell);

      this.collisionSystem.addCollider({
        id: `nw_pandal_post_${idx}`,
        type: 'sphere',
        position: new THREE.Vector3(-16.0 + p.x, 0, -12.0 + p.z),
        radius: 0.45,
      });
    });

    // Crossbeams
    const beamMat = this.matBamboo;
    const beam1 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.15, 0.15), beamMat);
    beam1.position.set(0, 4.1, -2.1);
    pandal.add(beam1);

    const beam2 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.15, 0.15), beamMat);
    beam2.position.set(0, 4.1, 2.1);
    pandal.add(beam2);

    const beam3 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 4.4), beamMat);
    beam3.position.set(-2.1, 4.1, 0);
    pandal.add(beam3);

    const beam4 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 4.4), beamMat);
    beam4.position.set(2.1, 4.1, 0);
    pandal.add(beam4);

    // Peacock Teal & Saffron Canopy Roof (Pyramid Tent)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.4, 4), this.matPeacockTeal);
    roof.position.set(0, 4.8, 0);
    roof.rotation.y = Math.PI / 4;
    pandal.add(roof);

    // Saffron Silk Valance Scallops
    const valance = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.35, 4.4), this.matSaffronCloth);
    valance.position.set(0, 4.0, 0);
    pandal.add(valance);

    // Center Golden Kalash on Roof Apex
    const kalash = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), this.matBrass);
    kalash.position.set(0, 5.6, 0);
    pandal.add(kalash);

    // Altar Plinth with Eco-Friendly Clay Murti
    const altar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.4), this.matTeakWood);
    altar.position.set(0, 0.6, 0);
    pandal.add(altar);

    // Eco-Friendly Shaadu Maati Ganesha Idol
    const clayMurti = this.createEcoFriendlyClayMurti(0.85);
    clayMurti.position.set(0, 0.85, 0);
    pandal.add(clayMurti);

    // Flanking Brass Deepam Lamps with gentle warm light
    [-1.2, 1.2].forEach(x => {
      const diya = this.createBrassStandingDiya(x, 0.35, 1.4);
      pandal.add(diya);
    });

    // Pandal Entrance Flower Rangoli
    const rangoli = this.createFlowerPetalRangoli(1.4);
    rangoli.position.set(0, 0.36, 1.8);
    pandal.add(rangoli);

    // Solid Central Altar Collider
    this.collisionSystem.addCollider({
      id: 'nw_pandal_altar',
      type: 'box',
      position: new THREE.Vector3(-16.0, 0, -12.0),
      size: new THREE.Vector3(2.0, 2.0, 1.8),
    });

    this.group.add(pandal);
  }

  /**
   * East Bazaar Cultural Pandal:
   * Located at (X: 14.5, Z: 8.5) near the village market road.
   * Radiant marigold floral arches, festive yellow and crimson fabric, and an earthen clay Ganesha.
   */
  private buildEastBazaarPandal(): void {
    const pandal = new THREE.Group();
    pandal.position.set(14.5, 0, 8.5);
    pandal.rotation.y = -0.25;

    // Platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.3, 4.2), this.matStoneGranite);
    platform.position.y = 0.15;
    platform.receiveShadow = true;
    pandal.add(platform);

    // Yellow and Crimson Shamiana Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.2, 4), this.matMarigoldYellow);
    roof.position.set(0, 4.2, 0);
    roof.rotation.y = Math.PI / 4;
    pandal.add(roof);

    const valance = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.3, 3.8), this.matCrimsonCloth);
    valance.position.set(0, 3.55, 0);
    pandal.add(valance);

    // 4 Upright Pillars
    const posts = [
      { x: -1.8, z: -1.8 },
      { x: 1.8, z: -1.8 },
      { x: -1.8, z: 1.8 },
      { x: 1.8, z: 1.8 },
    ];
    posts.forEach((p, idx) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.6, 8), this.matBamboo);
      pole.position.set(p.x, 1.8, p.z);
      pole.castShadow = true;
      pandal.add(pole);

      // Banana Tree
      const tree = this.createBananaStalk();
      tree.position.set(p.x, 0.2, p.z);
      pandal.add(tree);

      this.collisionSystem.addCollider({
        id: `east_pandal_post_${idx}`,
        type: 'sphere',
        position: new THREE.Vector3(14.5 + p.x, 0, 8.5 + p.z),
        radius: 0.4,
      });
    });

    // Central Altar with Eco-Friendly Murti
    const altar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 1.3), this.matTeakWood);
    altar.position.set(0, 0.525, 0);
    pandal.add(altar);

    const murti = this.createEcoFriendlyClayMurti(0.8);
    murti.position.set(0, 0.75, 0);
    pandal.add(murti);

    this.collisionSystem.addCollider({
      id: 'east_pandal_altar',
      type: 'box',
      position: new THREE.Vector3(14.5, 0, 8.5),
      size: new THREE.Vector3(1.8, 1.8, 1.6),
    });

    this.group.add(pandal);
  }

  // =========================================================================
  // 4. VILLAGE STREET TORANS, BUNTINGS & FAIRY LIGHTS
  // =========================================================================

  /**
   * Strings of festive marigold malas, mango leaf toranams, and warm glowing fairy lights
   * across village pathways without blocking pedestrian travel or vehicles.
   */
  private buildStreetGarlandsAndLights(): void {
    const streetLines = [
      // Connecting between West Houses and East Shops
      { from: new THREE.Vector3(-10, 4.6, 2), to: new THREE.Vector3(-3, 4.8, 0) },
      { from: new THREE.Vector3(3, 4.8, 0), to: new THREE.Vector3(10, 4.6, 2) },
      // Pathway towards North Forest Gate
      { from: new THREE.Vector3(2, 4.6, -8), to: new THREE.Vector3(8, 4.8, -12) },
      { from: new THREE.Vector3(7, 4.6, -15), to: new THREE.Vector3(14, 4.8, -20) },
      // Residential Lane to Banyan Tree
      { from: new THREE.Vector3(-14, 4.5, 2), to: new THREE.Vector3(-8, 4.6, 4) },
    ];

    streetLines.forEach(line => {
      const segs = 10;
      for (let s = 0; s <= segs; s++) {
        const t = s / segs;
        const x = THREE.MathUtils.lerp(line.from.x, line.to.x, t);
        const z = THREE.MathUtils.lerp(line.from.z, line.to.z, t);
        const sag = Math.sin(t * Math.PI) * 0.45;
        const y = THREE.MathUtils.lerp(line.from.y, line.to.y, t) - sag;

        // Alternating Marigold flower heads along the garland
        const flower = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 6, 6),
          s % 2 === 0 ? this.matMarigoldOrange : this.matMarigoldYellow
        );
        flower.position.set(x, y, z);
        this.group.add(flower);

        // Warm Glowing Fairy Light bulbs every 3rd step
        if (s % 3 === 0) {
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), this.matFlame);
          bulb.position.set(x, y - 0.08, z);
          this.group.add(bulb);
        }
      }
    });
  }

  // =========================================================================
  // 5. RANGOLI PATTERNS (KOLAM / MUGGU)
  // =========================================================================

  /**
   * Generates intricate traditional Rangoli patterns near house entrances,
   * pandal thresholds, and intersection paths.
   */
  private buildRangoliPatterns(): void {
    // 1. Auspicious Threshold Rangolis in front of Village Houses
    const houseRangoliPositions = [
      new THREE.Vector3(-16.5, 0.035, 4.5), // Elder's Verandah
      new THREE.Vector3(-17.0, 0.035, 15.0), // Weaver's Courtyard
      new THREE.Vector3(15.5, 0.035, 4.2), // East House
      new THREE.Vector3(17.5, 0.035, -7.0), // Potter's Verandah
      new THREE.Vector3(0, 0.035, 16.5), // Center Promenade Intersection
    ];

    houseRangoliPositions.forEach((pos, idx) => {
      const rangoliMesh = this.createGeometricKolamDecal(idx % 2 === 0 ? 1.6 : 1.3);
      rangoliMesh.position.copy(pos);
      this.group.add(rangoliMesh);
    });

    // 2. Large Flower Petal Rangoli at Center Square Intersection (Z: 7.5)
    const flowerRangoli = this.createFlowerPetalRangoli(2.4);
    flowerRangoli.position.set(0, 0.035, 8.5);
    this.group.add(flowerRangoli);
  }

  /**
   * Helper: Multi-ring auspicious Kolam / Muggu pattern
   */
  private createGeometricKolamDecal(radius: number): THREE.Group {
    const kolam = new THREE.Group();

    // Outer Rice Flour Ring
    const outerRing = new THREE.Mesh(new THREE.RingGeometry(radius * 0.85, radius, 24), this.matWhiteRice);
    outerRing.rotation.x = -Math.PI / 2;
    kolam.add(outerRing);

    // Red Vermilion (Kaavi) Border
    const redBorder = new THREE.Mesh(new THREE.RingGeometry(radius * 0.72, radius * 0.82, 24), this.matRedKumkum);
    redBorder.rotation.x = -Math.PI / 2;
    kolam.add(redBorder);

    // Turmeric Yellow Center Lotus Ring
    const yellowRing = new THREE.Mesh(new THREE.RingGeometry(radius * 0.45, radius * 0.68, 20), this.matTurmericYellow);
    yellowRing.rotation.x = -Math.PI / 2;
    kolam.add(yellowRing);

    // White Center Lotus Seed
    const center = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.38, 16), this.matWhiteRice);
    center.rotation.x = -Math.PI / 2;
    kolam.add(center);

    // Red Center Bindi
    const bindi = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.12, 12), this.matRedKumkum);
    bindi.rotation.x = -Math.PI / 2;
    bindi.position.y = 0.002;
    kolam.add(bindi);

    return kolam;
  }

  /**
   * Helper: Multi-layered Flower Petal Rangoli (Marigold & Rose)
   */
  private createFlowerPetalRangoli(radius: number): THREE.Group {
    const flowerRangoli = new THREE.Group();

    // Outer Orange Petal Ring
    const ringOrange = new THREE.Mesh(new THREE.RingGeometry(radius * 0.75, radius, 24), this.matMarigoldOrange);
    ringOrange.rotation.x = -Math.PI / 2;
    flowerRangoli.add(ringOrange);

    // Inner Yellow Petal Ring
    const ringYellow = new THREE.Mesh(new THREE.RingGeometry(radius * 0.45, radius * 0.72, 20), this.matMarigoldYellow);
    ringYellow.rotation.x = -Math.PI / 2;
    flowerRangoli.add(ringYellow);

    // Center Rose Petal Core
    const centerRed = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.42, 16), this.matHibiscusRed);
    centerRed.rotation.x = -Math.PI / 2;
    flowerRangoli.add(centerRed);

    // White Jasmine Bud Halo
    const centerWhite = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.15, 12), this.matJasmineWhite);
    centerWhite.rotation.x = -Math.PI / 2;
    centerWhite.position.y = 0.002;
    flowerRangoli.add(centerWhite);

    return flowerRangoli;
  }

  // =========================================================================
  // 6. DHOL AND PROCESSION ATMOSPHERE PROPS
  // =========================================================================

  /**
   * Procession instruments rested respectfully near the central staging area:
   * Authentic Nashik Dhol drum, Tasha drum, beating sticks (tipli), and brass Manjira cymbals.
   */
  private buildProcessionInstruments(): void {
    const musicArea = new THREE.Group();
    musicArea.position.set(3.8, 0, 4.5);

    // Woven Coir Mat on Ground
    const mat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 1.8), this.matBamboo);
    mat.position.y = 0.02;
    musicArea.add(mat);

    // 1. Traditional Large Nashik Dhol Drum
    const dholGroup = new THREE.Group();
    dholGroup.position.set(-0.55, 0.45, 0);

    const dholBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.95, 16), this.matTeakWood);
    dholBody.rotation.z = Math.PI / 2;
    dholBody.castShadow = true;
    dholGroup.add(dholBody);

    // Dhol drum heads (natural parchment skins)
    const skinL = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), this.matJasmineWhite);
    skinL.rotation.y = -Math.PI / 2;
    skinL.position.set(-0.48, 0, 0);
    dholGroup.add(skinL);

    const skinR = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), this.matJasmineWhite);
    skinR.rotation.y = Math.PI / 2;
    skinR.position.set(0.48, 0, 0);
    dholGroup.add(skinR);

    // Red cloth shoulder strap (patti)
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.04, 6, 16), this.matCrimsonCloth);
    strap.position.set(0, 0.15, 0);
    dholGroup.add(strap);

    // Dhol Beating Sticks (Thooth / Tipli)
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.6, 6), this.matBamboo);
    stick.position.set(0, 0.45, 0.1);
    stick.rotation.z = 0.4;
    dholGroup.add(stick);

    musicArea.add(dholGroup);

    // 2. High-Pitched Tasha Drum on Stand
    const tasha = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.18, 0.18, 12), this.matBrass);
    tasha.position.set(0.65, 0.35, -0.3);
    musicArea.add(tasha);

    const tashaSkin = new THREE.Mesh(new THREE.CircleGeometry(0.29, 12), this.matJasmineWhite);
    tashaSkin.rotation.x = -Math.PI / 2;
    tashaSkin.position.set(0.65, 0.45, -0.3);
    musicArea.add(tashaSkin);

    // 3. Pair of Polished Brass Manjira (Cymbals) connected with red cord
    const manjira1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.03, 10), this.matBrass);
    manjira1.position.set(0.65, 0.06, 0.35);
    musicArea.add(manjira1);

    const manjira2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.03, 10), this.matBrass);
    manjira2.position.set(0.85, 0.06, 0.45);
    musicArea.add(manjira2);

    this.collisionSystem.addCollider({
      id: 'procession_instruments_area',
      type: 'box',
      position: new THREE.Vector3(3.8, 0, 4.5),
      size: new THREE.Vector3(2.6, 1.0, 2.0),
    });

    this.group.add(musicArea);
  }

  // =========================================================================
  // 7. PUJA AND DEVOTIONAL ELEMENTS
  // =========================================================================

  /**
   * Adds respectful devotional elements: Terracotta Diyas along stone curbs,
   * sacred Durva grass, haldi-kumkum katoris, and fragrant agarbatti stands.
   */
  private buildPujaAndDevotionalElements(): void {
    // 1. Terracotta Diyas lining the entrance to the village pandal
    const diyaPositions = [
      new THREE.Vector3(-2.8, 0.05, 3.2),
      new THREE.Vector3(2.8, 0.05, 3.2),
      new THREE.Vector3(-2.8, 0.05, -3.2),
      new THREE.Vector3(2.8, 0.05, -3.2),
      new THREE.Vector3(-4.2, 0.05, 0),
      new THREE.Vector3(4.2, 0.05, 0),
    ];

    diyaPositions.forEach(pos => {
      const diya = this.createClayDiya(pos.x, pos.y, pos.z);
      this.group.add(diya);
    });

    // 2. Wayside Tulsi Devotional Katte near the village center (X: 7.2, Z: -3.5)
    const tulsiKatte = new THREE.Group();
    tulsiKatte.position.set(7.2, 0, -3.5);

    // Carved Brick & Plaster Base with Kaavi red stripes
    const katteBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.85, 1.2), this.matStoneGranite);
    katteBase.position.y = 0.425;
    katteBase.castShadow = true;
    tulsiKatte.add(katteBase);

    // Red Kaavi bands
    const band = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.12, 1.24), this.matCrimsonCloth);
    band.position.y = 0.45;
    tulsiKatte.add(band);

    // Niche for Akhanda Diya in front
    const nicheDiya = this.createClayDiya(0, 0.88, 0.45);
    tulsiKatte.add(nicheDiya);

    // Lush Sacred Tulsi Plant Bush atop
    const tulsiBush = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), this.matDurvaGrass);
    tulsiBush.position.set(0, 1.15, 0);
    tulsiKatte.add(tulsiBush);

    // Fresh Marigold Garland adorning Tulsi Katte
    const garland = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.05, 6, 16), this.matMarigoldOrange);
    garland.rotation.x = Math.PI / 2;
    garland.position.y = 0.8;
    tulsiKatte.add(garland);

    this.collisionSystem.addCollider({
      id: 'tulsi_devotional_katte',
      type: 'box',
      position: new THREE.Vector3(7.2, 0, -3.5),
      size: new THREE.Vector3(1.4, 1.6, 1.4),
    });

    this.group.add(tulsiKatte);
  }

  // =========================================================================
  // 8. VISARJAN / NIMAJJANAM WATERSIDE AREA (Kalyani Bathing Ghats)
  // =========================================================================

  /**
   * Visarjan / Nimajjanam Waterside Area at Kalyani Bathing Ghats (X: -88, Z: 0):
   * - Grand Decorated Visarjan Mandap on Ghat Promenade
   * - Procession Ramp with marigold garlands on stone balustrades
   * - Floating Dona Leaf Boats with glowing diyas and flower petals in the river water
   * - Multi-tier Brass Maha Arati Deepam Stand & Sacred Conch Shell on stone pedestal
   */
  private buildVisarjanWatersideArea(): void {
    const visarjanGroup = new THREE.Group();
    visarjanGroup.position.set(-86.5, 0, 0);

    // 1. Auspicious Visarjan Staging Mandap Canopy on upper Ghat
    const mandap = new THREE.Group();
    mandap.position.set(4.0, 0.5, 0);

    // 4 Bamboo Floral Pillars
    const posts = [
      { x: -2.0, z: -2.0 },
      { x: 2.0, z: -2.0 },
      { x: -2.0, z: 2.0 },
      { x: 2.0, z: 2.0 },
    ];
    posts.forEach(p => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.5, 8), this.matBamboo);
      pole.position.set(p.x, 2.25, p.z);
      mandap.add(pole);

      // Wrapped Marigold Garland
      const garland = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 6, 12), this.matMarigoldOrange);
      garland.rotation.x = Math.PI / 2;
      garland.position.set(p.x, 2.5, p.z);
      mandap.add(garland);
    });

    // Royal Saffron Silk Visarjan Canopy
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.4, 4), this.matSaffronCloth);
    canopy.position.set(0, 5.0, 0);
    canopy.rotation.y = Math.PI / 4;
    mandap.add(canopy);

    const valance = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.35, 4.2), this.matCrimsonCloth);
    valance.position.set(0, 4.3, 0);
    mandap.add(valance);

    // Auspicious Brass Kalash Finial atop Visarjan Mandap
    const kalash = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), this.matBrass);
    kalash.position.set(0, 5.9, 0);
    mandap.add(kalash);

    // Ceremonial Immersion Palanquin Platform
    const palanquin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 1.8), this.matTeakWood);
    palanquin.position.set(0, 0.7, 0);
    mandap.add(palanquin);

    // Wooden Immersion Lowering Beams (Staging for holy immersion)
    [-0.7, 0.7].forEach(z => {
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.5, 6), this.matBamboo);
      beam.rotation.x = Math.PI / 2;
      beam.position.set(0, 0.5, z);
      mandap.add(beam);
    });

    visarjanGroup.add(mandap);

    // 2. Multi-tier Brass Maha Arati Deepam Stand (Pancha Arati / 5-tier flame stand)
    const aratiStand = new THREE.Group();
    aratiStand.position.set(1.5, 0.5, -4.2);

    const aratiBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.3, 10), this.matBrass);
    aratiBase.position.y = 0.15;
    aratiStand.add(aratiBase);

    const aratiShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.8, 8), this.matBrass);
    aratiShaft.position.y = 1.05;
    aratiStand.add(aratiShaft);

    // 3 Tiers of Aarti diya cups
    [1.2, 1.6, 2.0].forEach((y, idx) => {
      const tierRing = new THREE.Mesh(new THREE.TorusGeometry(0.35 - idx * 0.08, 0.04, 6, 12), this.matBrass);
      tierRing.rotation.x = Math.PI / 2;
      tierRing.position.y = y;
      aratiStand.add(tierRing);

      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), this.matFlame);
      flame.position.set(0, y + 0.06, 0);
      aratiStand.add(flame);
    });

    const aratiGlow = new THREE.PointLight('#f59e0b', 1.8, 14);
    aratiGlow.position.set(0, 2.2, 0);
    aratiStand.add(aratiGlow);
    this.lanternLights.push(aratiGlow);

    visarjanGroup.add(aratiStand);

    // 3. Sacred White Conch Shell (Shankha) on carved stone plinth
    const conchPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.7, 8), this.matStoneGranite);
    conchPlinth.position.set(1.5, 0.85, 4.2);
    visarjanGroup.add(conchPlinth);

    const conch = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 8), this.matJasmineWhite);
    conch.rotation.z = Math.PI / 2;
    conch.position.set(1.5, 1.3, 4.2);
    visarjanGroup.add(conch);

    // 4. Floating Leaf Dona Boats on River Water with Glowing Diyas and Flower Petals!
    // Centered in water (X: -105 to -112, Z: -15 to 15)
    for (let d = 0; d < 8; d++) {
      const dona = this.createFloatingDonaBoat();
      const donaX = -20 - (d % 3) * 3.5;
      const donaZ = (d - 4) * 3.8 + (Math.sin(d) * 1.5);
      dona.position.set(donaX, -0.28, donaZ);
      this.floatingDonas.push(dona);
      visarjanGroup.add(dona);
    }

    // Solid colliders for Visarjan Staging Mandap and Arati Stand
    this.collisionSystem.addCollider({
      id: 'visarjan_mandap_stage',
      type: 'box',
      position: new THREE.Vector3(-82.5, 0.5, 0),
      size: new THREE.Vector3(3.2, 2.5, 2.8),
    });

    this.collisionSystem.addCollider({
      id: 'visarjan_arati_stand',
      type: 'sphere',
      position: new THREE.Vector3(-85.0, 0.5, -4.2),
      radius: 0.8,
    });

    this.group.add(visarjanGroup);
  }

  /**
   * Helper: Creates a floating leaf boat (Dona) with flower petals & glowing diya
   */
  private createFloatingDonaBoat(): THREE.Group {
    const dona = new THREE.Group();

    // Dried Sal / Banyan Leaf Boat
    const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.08, 8), this.matMangoLeaf);
    leaf.position.y = 0.04;
    dona.add(leaf);

    // Bed of Marigold and Rose petals inside leaf
    const petals = new THREE.Mesh(new THREE.CircleGeometry(0.18, 8), this.matMarigoldOrange);
    petals.rotation.x = -Math.PI / 2;
    petals.position.y = 0.082;
    dona.add(petals);

    // Tiny Clay Diya in center
    const diya = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.04, 8), this.matTerracotta);
    diya.position.y = 0.1;
    dona.add(diya);

    // Glowing flame
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), this.matFlame);
    flame.position.y = 0.14;
    dona.add(flame);

    return dona;
  }

  // =========================================================================
  // 9. ECO-FRIENDLY CLAY MURTIS & CRAFT WORKSHOP
  // =========================================================================

  /**
   * Artisan Clay Workshop Drying Display:
   * Near the potter's house (X: -18.5, Z: 11.5).
   * Wooden planks display hand-molded eco-friendly clay Ganesh idols drying naturally in the air,
   * celebrating the traditional craft of sustainable, bio-degradable Murtis.
   */
  private buildClayMurtiCraftDisplay(): void {
    const workshop = new THREE.Group();
    workshop.position.set(-18.5, 0, 11.5);
    workshop.rotation.y = 0.25;

    // Raised Clay Drying Planks (Low wooden bench)
    const bench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.35, 1.2), this.matTeakWood);
    bench.position.set(0, 0.175, 0);
    bench.castShadow = true;
    workshop.add(bench);

    // 3 Eco-Friendly Clay Murtis in various natural stages of completion
    [-0.9, 0, 0.9].forEach((x, idx) => {
      const scale = idx === 1 ? 0.75 : 0.65;
      const murti = this.createEcoFriendlyClayMurti(scale);
      murti.position.set(x, 0.35, 0);
      workshop.add(murti);
    });

    // Sculpting Clay Paddles and Wooden Tools
    const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.45), this.matTeakWood);
    paddle.position.set(0.45, 0.38, 0.35);
    paddle.rotation.y = 0.6;
    workshop.add(paddle);

    // Ball of raw wet sculpting river clay
    const rawClayBall = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), this.matEarthenClay);
    rawClayBall.position.set(-0.45, 0.48, 0.35);
    workshop.add(rawClayBall);

    this.collisionSystem.addCollider({
      id: 'clay_craft_display',
      type: 'box',
      position: new THREE.Vector3(-18.5, 0, 11.5),
      size: new THREE.Vector3(3.4, 1.2, 1.6),
    });

    this.group.add(workshop);
  }

  /**
   * Helper: Sculpted 3D Eco-Friendly Clay Ganesha Murti
   * (Made in natural unbaked Shaadu Maati earthen tone with elephant head, curved trunk, modak & janeu)
   */
  private createEcoFriendlyClayMurti(scale: number = 1.0): THREE.Group {
    const murti = new THREE.Group();

    // 1. Lotus Pedestal (Peedam)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38 * scale, 0.44 * scale, 0.18 * scale, 12), this.matStoneGranite);
    base.position.y = 0.09 * scale;
    murti.add(base);

    // 2. Folded Dhoti Legs (Lalitasana / Padmasana)
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * scale, 0.42 * scale, 0.22 * scale, 10), this.matEarthenClay);
    legs.position.y = 0.28 * scale;
    murti.add(legs);

    // 3. Plump Lambodara Belly
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.36 * scale, 10, 10), this.matEarthenClay);
    belly.position.set(0, 0.52 * scale, 0.05 * scale);
    murti.add(belly);

    // 4. Sacred Thread (Yajnopavita / Janeu) diagonally across torso
    const janeu = new THREE.Mesh(new THREE.TorusGeometry(0.32 * scale, 0.02 * scale, 6, 16), this.matJasmineWhite);
    janeu.rotation.x = 0.7;
    janeu.rotation.y = 0.3;
    janeu.position.set(0, 0.58 * scale, 0.08 * scale);
    murti.add(janeu);

    // 5. Chest & Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26 * scale, 0.32 * scale, 0.35 * scale, 10), this.matEarthenClay);
    torso.position.y = 0.72 * scale;
    murti.add(torso);

    // 6. Gajanana Head with curved trunk
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25 * scale, 12, 12), this.matEarthenClay);
    head.position.set(0, 1.02 * scale, 0.06 * scale);
    murti.add(head);

    // Big Fan-shaped Ears (Supakarna)
    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * scale, 0.08 * scale, 0.03 * scale, 8), this.matEarthenClay);
      ear.rotation.z = side * (Math.PI / 3);
      ear.rotation.x = 0.2;
      ear.position.set(side * 0.3 * scale, 1.05 * scale, 0.04 * scale);
      murti.add(ear);
    });

    // Elegant curved trunk turning to the left holding modak
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * scale, 0.12 * scale, 0.42 * scale, 8), this.matEarthenClay);
    trunk.rotation.x = 0.5;
    trunk.rotation.z = -0.35;
    trunk.position.set(-0.06 * scale, 0.88 * scale, 0.24 * scale);
    murti.add(trunk);

    // Tiny Modak at the tip of the trunk
    const modak = new THREE.Mesh(new THREE.SphereGeometry(0.06 * scale, 6, 6), this.matJasmineWhite);
    modak.position.set(-0.16 * scale, 0.78 * scale, 0.32 * scale);
    murti.add(modak);

    // 7. Right Hand in Abhaya Mudra (Blessing hand)
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * scale, 0.07 * scale, 0.25 * scale, 6), this.matEarthenClay);
    rightArm.rotation.z = -0.5;
    rightArm.position.set(0.32 * scale, 0.72 * scale, 0.14 * scale);
    murti.add(rightArm);

    // 8. Traditional Clay Mukuta (Crown)
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.22 * scale, 0.38 * scale, 8), this.matEarthenClay);
    crown.position.set(0, 1.34 * scale, 0.05 * scale);
    murti.add(crown);

    // Red Tilak on forehead
    const tilak = new THREE.Mesh(new THREE.BoxGeometry(0.04 * scale, 0.08 * scale, 0.02 * scale), this.matHibiscusRed);
    tilak.position.set(0, 1.08 * scale, 0.3 * scale);
    murti.add(tilak);

    // Fresh 21-blade Durva Grass bundle offered reverently at the feet
    const durvaOffering = new THREE.Mesh(new THREE.SphereGeometry(0.09 * scale, 6, 6), this.matDurvaGrass);
    durvaOffering.scale.set(1.5, 0.4, 1.0);
    durvaOffering.position.set(0.15 * scale, 0.24 * scale, 0.32 * scale);
    murti.add(durvaOffering);

    return murti;
  }

  // =========================================================================
  // UTILITY HELPERS
  // =========================================================================

  /**
   * Helper: Traditional Brass Standing Diya (Kuthuvilakku) with glowing flame
   */
  private createBrassStandingDiya(x: number, y: number, z: number): THREE.Group {
    const diya = new THREE.Group();
    diya.position.set(x, y, z);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.1, 8), this.matBrass);
    diya.add(base);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.85, 6), this.matBrass);
    stem.position.y = 0.45;
    diya.add(stem);

    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.08, 0.08, 8), this.matBrass);
    cup.position.y = 0.9;
    diya.add(cup);

    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), this.matFlame);
    flame.position.y = 0.96;
    diya.add(flame);

    const glow = new THREE.PointLight('#f59e0b', 0.9, 8);
    glow.position.set(0, 1.0, 0);
    diya.add(glow);
    this.lanternLights.push(glow);

    return diya;
  }

  /**
   * Helper: Small Terracotta Diya with warm glowing flame
   */
  private createClayDiya(x: number, y: number, z: number): THREE.Group {
    const diya = new THREE.Group();
    diya.position.set(x, y, z);

    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.07, 0.05, 8), this.matTerracotta);
    diya.add(saucer);

    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), this.matFlame);
    flame.position.y = 0.06;
    diya.add(flame);

    const glow = new THREE.PointLight('#f59e0b', 0.6, 5);
    glow.position.set(0, 0.1, 0);
    diya.add(glow);
    this.lanternLights.push(glow);

    return diya;
  }

  /**
   * Helper: Whole Banana Plant with broad green leaves tied to pandal posts
   */
  private createBananaStalk(): THREE.Group {
    const tree = new THREE.Group();

    // Stem / Stalk
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 2.2, 8), this.matMangoLeaf);
    stalk.position.y = 1.1;
    tree.add(stalk);

    // 4 Broad spreading banana leaves
    for (let l = 0; l < 4; l++) {
      const ang = (l / 4) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 1.4), this.matMangoLeaf);
      leaf.position.set(Math.cos(ang) * 0.55, 1.8 + l * 0.1, Math.sin(ang) * 0.55);
      leaf.rotation.y = ang;
      leaf.rotation.x = 0.45;
      tree.add(leaf);
    }

    return tree;
  }

  /**
   * Continuous gentle update for floating river boats
   */
  public update(delta: number, time: number): void {
    this.floatingDonas.forEach((dona, idx) => {
      dona.position.y = -0.28 + Math.sin(time * 1.5 + idx) * 0.03;
      dona.rotation.z = Math.sin(time * 1.2 + idx * 0.8) * 0.05;
      dona.rotation.x = Math.cos(time * 1.1 + idx * 0.7) * 0.04;
    });
  }
}
