/**
 * THE KATHA - Ayyagaru NPC (Vedic Priest & Scholar)
 *
 * Traditional Indian male priest (Vedic Scholar) for Level 2:
 * - Location: Outside his own house in the city, on the front veranda courtyard.
 * - Posture: Seated on a traditional carved teak armchair / low seat (Asanam), facing the road.
 * - Appearance: Light/warm fair complexion, authentic human facial features (eyes, nose, mouth, ears).
 * - Forehead: Sacred auspicious tilak (Tripundra sandalwood + red kumkum bindi).
 * - Hair: Clean shaved head with traditional SIKHA / PILAKA attached securely at the back of the head.
 *   (Never on forehead, never on front/middle, never floating).
 * - Attire: Sacred Red Kanduva / Angavastram draped around neck and shoulders,
 *   Sacred Yajnopavita thread, Rudraksha mala, Red traditional Pancha (dhoti) with golden zari border.
 * - Barefoot: 100% barefoot with realistic anatomical bare feet resting flat on the ground (zero floating!).
 * - Interactive: Idle seated breathing, turning to face Ramu, Namaste greeting, and authentic dialogue.
 */

import * as THREE from 'three';

export interface AyyagaruDialogue {
  speaker: string;
  role: string;
  text: string;
  teluguText: string;
}

export class AyyagaruNPC {
  public group: THREE.Group;
  public position: THREE.Vector3;
  private animTimer: number = 0;
  private isPlayerNearby: boolean = false;
  private namasteBlend: number = 0;
  private hasJoinedRamu: boolean = false;
  private isInVehicle: boolean = false;

  private posture: 'seated' | 'standing' = 'seated';
  private isWalking: boolean = false;
  private walkTimer: number = 0;
  private activeGesture: 'idle' | 'namaste' | 'blessing' | 'aarti' | 'talk' = 'idle';
  private chairGroup: THREE.Group;
  private characterGroup: THREE.Group;

  // Rigging nodes
  private headGroup: THREE.Group;
  private torsoGroup: THREE.Group;
  private neckMesh: THREE.Mesh;
  private leftArmUpper: THREE.Group;
  private leftArmLower: THREE.Group;
  private rightArmUpper: THREE.Group;
  private rightArmLower: THREE.Group;
  private leftLegUpper: THREE.Group;
  private leftLegLower: THREE.Group;
  private rightLegUpper: THREE.Group;
  private rightLegLower: THREE.Group;

  // Materials
  private matSkin: THREE.MeshStandardMaterial;
  private matHair: THREE.MeshStandardMaterial;
  private matRedPancha: THREE.MeshStandardMaterial;
  private matRedKanduva: THREE.MeshStandardMaterial;
  private matGoldBorder: THREE.MeshStandardMaterial;
  private matSacredThread: THREE.MeshBasicMaterial;
  private matTilakRed: THREE.MeshBasicMaterial;
  private matTilakYellow: THREE.MeshBasicMaterial;
  private matRudraksha: THREE.MeshStandardMaterial;
  private matBrass: THREE.MeshStandardMaterial;
  private matWoodChair: THREE.MeshStandardMaterial;
  private matCushion: THREE.MeshStandardMaterial;

  constructor(x: number = 184.5, y: number = 0.20, z: number = -15.0) {
    this.group = new THREE.Group();
    this.group.name = 'ayyagaru_vedic_priest_npc';
    this.position = new THREE.Vector3(x, y, z);
    this.group.position.copy(this.position);
    // Facing East toward Grand Avenue road so player easily sees him while approaching
    this.group.rotation.y = Math.PI / 2;

    // Authentic light skin tone consistent with the game's human characters
    this.matSkin = new THREE.MeshStandardMaterial({
      color: '#e4b68e', // Light warm human skin tone
      roughness: 0.65,
      metalness: 0.04,
    });

    // Hair material for traditional shikha/pilaka
    this.matHair = new THREE.MeshStandardMaterial({
      color: '#27201c', // Dark charcoal-brown hair
      roughness: 0.85,
    });

    // Red traditional Pancha (dhoti)
    this.matRedPancha = new THREE.MeshStandardMaterial({
      color: '#991b1b', // Traditional rich Vedic vermilion red
      roughness: 0.68,
      metalness: 0.05,
    });

    // Red Kanduva / Angavastram (ceremonial shoulder cloth)
    this.matRedKanduva = new THREE.MeshStandardMaterial({
      color: '#b91c1c', // Sacred festive deep red
      roughness: 0.72,
    });

    // Golden Zari Brocade border
    this.matGoldBorder = new THREE.MeshStandardMaterial({
      color: '#fbbf24', // Golden zari accent
      roughness: 0.35,
      metalness: 0.65,
    });

    this.matSacredThread = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    this.matTilakRed = new THREE.MeshBasicMaterial({ color: '#dc2626' });
    this.matTilakYellow = new THREE.MeshBasicMaterial({ color: '#facc15' });
    this.matRudraksha = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
    this.matBrass = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.7, roughness: 0.3 });

    // Traditional Teak Wood Chair & Crimson Cushion Materials
    this.matWoodChair = new THREE.MeshStandardMaterial({
      color: '#582f0e', // Polished dark teak wood
      roughness: 0.45,
      metalness: 0.1,
    });
    this.matCushion = new THREE.MeshStandardMaterial({
      color: '#7f1d1d', // Royal crimson velvet cushion
      roughness: 0.8,
    });

    // Sub-groups
    this.chairGroup = new THREE.Group();
    this.chairGroup.name = 'ayyagaru_veranda_chair';
    this.group.add(this.chairGroup);

    this.characterGroup = new THREE.Group();
    this.characterGroup.name = 'ayyagaru_character_model';
    this.group.add(this.characterGroup);

    // Build the traditional chair first
    this.buildVerandaChair();

    // -------------------------------------------------------------------------
    // SKELETAL RIG SETUP FOR SITTING POSTURE
    // Ground level is Y = 0 (Veranda surface).
    // Seat cushion surface is at Y = 0.46.
    // -------------------------------------------------------------------------
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.48, 0.04);
    this.characterGroup.add(this.torsoGroup);

    // Anatomical continuous neck bridging torso and head (zero disconnected neck!)
    const neckGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.16, 16);
    this.neckMesh = new THREE.Mesh(neckGeo, this.matSkin);
    this.neckMesh.position.set(0, 0.46, 0.01);
    this.neckMesh.rotation.x = 0.04;
    this.neckMesh.castShadow = true;
    this.torsoGroup.add(this.neckMesh);

    // Head group anchored directly on top of neck
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.52, 0.01);
    this.torsoGroup.add(this.headGroup);

    // Upper and lower arms
    this.leftArmUpper = new THREE.Group();
    this.leftArmUpper.position.set(-0.25, 0.44, 0);
    this.torsoGroup.add(this.leftArmUpper);

    this.leftArmLower = new THREE.Group();
    this.leftArmLower.position.set(0, -0.26, 0);
    this.leftArmUpper.add(this.leftArmLower);

    this.rightArmUpper = new THREE.Group();
    this.rightArmUpper.position.set(0.25, 0.44, 0);
    this.torsoGroup.add(this.rightArmUpper);

    this.rightArmLower = new THREE.Group();
    this.rightArmLower.position.set(0, -0.26, 0);
    this.rightArmUpper.add(this.rightArmLower);

    // Legs & Feet (Configured in seated posture!)
    // Thighs extend horizontally forward (+Z), Calves drop vertically downward (-Y)
    this.leftLegUpper = new THREE.Group();
    this.leftLegUpper.position.set(-0.13, -0.04, 0.06);
    this.leftLegUpper.rotation.x = -Math.PI / 2; // Horizontal forward thigh
    this.torsoGroup.add(this.leftLegUpper);

    this.leftLegLower = new THREE.Group();
    this.leftLegLower.position.set(0, 0, 0.40); // At knee joint
    this.leftLegLower.rotation.x = Math.PI / 2;  // Vertical downward calf
    this.leftLegUpper.add(this.leftLegLower);

    this.rightLegUpper = new THREE.Group();
    this.rightLegUpper.position.set(0.13, -0.04, 0.06);
    this.rightLegUpper.rotation.x = -Math.PI / 2; // Horizontal forward thigh
    this.torsoGroup.add(this.rightLegUpper);

    this.rightLegLower = new THREE.Group();
    this.rightLegLower.position.set(0, 0, 0.40); // At knee joint
    this.rightLegLower.rotation.x = Math.PI / 2;  // Vertical downward calf
    this.rightLegUpper.add(this.rightLegLower);

    this.buildCharacterMesh();
  }

  /**
   * Builds the traditional wooden chair / low seat (Asanam / Peetham)
   * that sits outside his house on the veranda.
   */
  private buildVerandaChair(): void {
    // 1. Four Turned Wooden Legs (Height 0.44m, resting directly on the ground Y = 0)
    const legPositions = [
      { x: -0.26, z: -0.18 },
      { x: 0.26, z: -0.18 },
      { x: -0.26, z: 0.22 },
      { x: 0.26, z: 0.22 },
    ];

    legPositions.forEach(lp => {
      // Turned wood leg
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.035, 0.44, 10),
        this.matWoodChair
      );
      leg.position.set(lp.x, 0.22, lp.z);
      leg.castShadow = true;
      this.chairGroup.add(leg);

      // Brass foot cap
      const brassCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.034, 0.036, 0.05, 10),
        this.matBrass
      );
      brassCap.position.set(lp.x, 0.025, lp.z);
      this.chairGroup.add(brassCap);
    });

    // 2. Under-seat stretchers (Reinforcing crossbars at Y = 0.12)
    const stretcherX1 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.03, 0.03), this.matWoodChair);
    stretcherX1.position.set(0, 0.12, -0.18);
    this.chairGroup.add(stretcherX1);

    const stretcherX2 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.03, 0.03), this.matWoodChair);
    stretcherX2.position.set(0, 0.12, 0.22);
    this.chairGroup.add(stretcherX2);

    const stretcherZ1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.40), this.matWoodChair);
    stretcherZ1.position.set(-0.26, 0.12, 0.02);
    this.chairGroup.add(stretcherZ1);

    const stretcherZ2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.40), this.matWoodChair);
    stretcherZ2.position.set(0.26, 0.12, 0.02);
    this.chairGroup.add(stretcherZ2);

    // 3. Wooden Seat Base Frame (at Y = 0.41)
    const seatFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.06, 0.58),
      this.matWoodChair
    );
    seatFrame.position.set(0, 0.41, 0.02);
    seatFrame.castShadow = true;
    this.chairGroup.add(seatFrame);

    // 4. Royal Crimson Velvet Cushion with Golden Piping (Top surface Y = 0.46)
    const cushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.07, 0.52),
      this.matCushion
    );
    cushion.position.set(0, 0.455, 0.02);
    cushion.castShadow = true;
    this.chairGroup.add(cushion);

    const cushionPiping = new THREE.Mesh(
      new THREE.BoxGeometry(0.59, 0.015, 0.53),
      this.matGoldBorder
    );
    cushionPiping.position.set(0, 0.47, 0.02);
    this.chairGroup.add(cushionPiping);

    // 5. Carved Wooden Backrest (Behind Ayyagaru at Z = -0.25, Y: 0.46 to 1.05)
    // Left & right back posts
    [-0.26, 0.26].forEach(bx => {
      const backPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.62, 10),
        this.matWoodChair
      );
      backPost.position.set(bx, 0.74, -0.25);
      backPost.castShadow = true;
      this.chairGroup.add(backPost);

      // Decorative brass top finial
      const postFinial = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        this.matBrass
      );
      postFinial.position.set(bx, 1.06, -0.25);
      this.chairGroup.add(postFinial);
    });

    // Top carved crest rail
    const crestRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.60, 0.08, 0.04),
      this.matWoodChair
    );
    crestRail.position.set(0, 1.0, -0.25);
    this.chairGroup.add(crestRail);

    // Middle backrest panel with auspicious brass sun medallion
    const backPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.38, 0.025),
      this.matWoodChair
    );
    backPanel.position.set(0, 0.74, -0.25);
    this.chairGroup.add(backPanel);

    const brassMedallion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.01, 16),
      this.matBrass
    );
    brassMedallion.rotation.x = Math.PI / 2;
    brassMedallion.position.set(0, 0.74, -0.23);
    this.chairGroup.add(brassMedallion);

    // 6. Side Armrests (at X = ±0.29, Y = 0.60)
    [-0.29, 0.29].forEach(ax => {
      const armRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.035, 0.44),
        this.matWoodChair
      );
      armRail.position.set(ax, 0.62, 0.02);
      this.chairGroup.add(armRail);

      // Front armrest support pillar
      const armPillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.025, 0.18, 8),
        this.matWoodChair
      );
      armPillar.position.set(ax, 0.52, 0.20);
      this.chairGroup.add(armPillar);
    });
  }

  private buildCharacterMesh(): void {
    // -------------------------------------------------------------------------
    // 1. HEAD CRANIUM, FACE & ANATOMICAL FEATURES
    // -------------------------------------------------------------------------
    // Smooth cranial dome for shaved head
    const craniumGeo = new THREE.SphereGeometry(0.145, 24, 20);
    craniumGeo.scale(0.96, 1.06, 0.98);
    const cranium = new THREE.Mesh(craniumGeo, this.matSkin);
    cranium.position.set(0, 0.12, 0);
    cranium.castShadow = true;
    this.headGroup.add(cranium);

    // Neck socket transition to prevent any gap between head and neck
    const socketGeo = new THREE.CylinderGeometry(0.076, 0.084, 0.06, 16);
    const socket = new THREE.Mesh(socketGeo, this.matSkin);
    socket.position.set(0, 0.02, 0);
    this.headGroup.add(socket);

    // Defined gentle male jaw & chin
    const jawGeo = new THREE.BoxGeometry(0.13, 0.08, 0.11);
    const jaw = new THREE.Mesh(jawGeo, this.matSkin);
    jaw.position.set(0, 0.06, 0.04);
    this.headGroup.add(jaw);

    // Ears anchored directly to the left and right sides of the head
    [-0.142, 0.142].forEach(ex => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), this.matSkin);
      ear.scale.set(0.3, 1.2, 0.7);
      ear.position.set(ex, 0.12, 0.005);
      this.headGroup.add(ear);
    });

    // Natural Nose (emerging smoothly from head, no floating)
    const noseGeo = new THREE.ConeGeometry(0.013, 0.034, 10);
    noseGeo.rotateX(Math.PI / 2 - 0.15);
    const noseMesh = new THREE.Mesh(noseGeo, this.matSkin);
    noseMesh.position.set(0, 0.116, 0.144);
    this.headGroup.add(noseMesh);

    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), this.matSkin);
    noseTip.position.set(0, 0.108, 0.156);
    this.headGroup.add(noseTip);

    // Friendly Human Eyes (physically placed on the front facial curve)
    const eyeSpacing = 0.046;
    const eyeY = 0.136;
    const eyeZ = 0.138;

    [-eyeSpacing, eyeSpacing].forEach(ex => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(ex, eyeY, eyeZ);
      eyeGroup.rotation.y = ex > 0 ? 0.28 : -0.28;
      this.headGroup.add(eyeGroup);

      // Sclera (eye white)
      const eyeWhite = new THREE.Mesh(
        new THREE.CircleGeometry(0.016, 12),
        new THREE.MeshBasicMaterial({ color: '#f8fafc' })
      );
      eyeGroup.add(eyeWhite);

      // Dark brown iris
      const iris = new THREE.Mesh(
        new THREE.CircleGeometry(0.01, 12),
        new THREE.MeshBasicMaterial({ color: '#27170e' })
      );
      iris.position.z = 0.001;
      eyeGroup.add(iris);

      // Pupil
      const pupil = new THREE.Mesh(
        new THREE.CircleGeometry(0.005, 10),
        new THREE.MeshBasicMaterial({ color: '#090503' })
      );
      pupil.position.z = 0.0016;
      eyeGroup.add(pupil);

      // Catchlight reflection
      const catchlight = new THREE.Mesh(
        new THREE.CircleGeometry(0.002, 6),
        new THREE.MeshBasicMaterial({ color: '#ffffff' })
      );
      catchlight.position.set(0.003, 0.003, 0.002);
      eyeGroup.add(catchlight);

      // Eyebrow
      const brow = new THREE.Mesh(
        new THREE.BoxGeometry(0.038, 0.006, 0.004),
        this.matHair
      );
      brow.position.set(0, 0.024, 0.002);
      brow.rotation.z = ex > 0 ? -0.1 : 0.1;
      eyeGroup.add(brow);
    });

    // Gentle Welcoming Smile (Mouth flush on lower face)
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, 0.078, 0.142);
    mouthGroup.rotation.x = 0.25;
    this.headGroup.add(mouthGroup);

    const lipMat = new THREE.MeshStandardMaterial({ color: '#a85342', roughness: 0.5 });
    const smileCurveGeo = new THREE.TorusGeometry(0.02, 0.004, 6, 14, Math.PI * 0.75);
    smileCurveGeo.rotateZ(-Math.PI * 0.88);
    const smileMesh = new THREE.Mesh(smileCurveGeo, lipMat);
    mouthGroup.add(smileMesh);

    // -------------------------------------------------------------------------
    // 2. FOREHEAD TILAK (Auspicious Tripundra with Red Kumkum Bindi)
    // -------------------------------------------------------------------------
    const tilakGroup = new THREE.Group();
    tilakGroup.position.set(0, 0.174, 0.138);
    tilakGroup.rotation.x = -0.28;
    this.headGroup.add(tilakGroup);

    // Three horizontal lines of holy Sandalwood paste (Tripundra)
    [-0.012, 0.0, 0.012].forEach((ty, idx) => {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.058 - idx * 0.006, 0.005, 0.002),
        this.matTilakYellow
      );
      line.position.set(0, ty, 0.001);
      tilakGroup.add(line);
    });

    // Auspicious Red Kumkum dot in center
    const kumkumDot = new THREE.Mesh(new THREE.CircleGeometry(0.008, 10), this.matTilakRed);
    kumkumDot.position.set(0, 0, 0.002);
    tilakGroup.add(kumkumDot);

    // -------------------------------------------------------------------------
    // 3. TRADITIONAL PILAKA / SIKHA (ATTACHED EXCLUSIVELY AT THE BACK OF HEAD)
    // -------------------------------------------------------------------------
    // Shaved head hairline shadow at posterior base
    const shavedShadowGeo = new THREE.SphereGeometry(0.146, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.35);
    const shavedShadow = new THREE.Mesh(
      shavedShadowGeo,
      new THREE.MeshStandardMaterial({ color: '#3d2e26', roughness: 0.95 })
    );
    shavedShadow.position.set(0, 0.12, -0.01);
    this.headGroup.add(shavedShadow);

    // Traditional Sikha / Pilaka tuft of hair mounted firmly at the posterior crown / back of head
    const pilakaRoot = new THREE.Group();
    pilakaRoot.position.set(0, 0.18, -0.135);
    pilakaRoot.rotation.x = -0.65; // Drooping naturally downward along the nape
    this.headGroup.add(pilakaRoot);

    // Hair knot / gathering ring
    const knot = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.014, 8, 16), this.matHair);
    pilakaRoot.add(knot);

    // Bound tuft base
    const tuftBase = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.032, 0.09, 10), this.matHair);
    tuftBase.position.set(0, -0.04, 0);
    pilakaRoot.add(tuftBase);

    // Flowing hair tail tapering smoothly
    const tuftTail = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.14, 10), this.matHair);
    tuftTail.rotation.x = Math.PI;
    tuftTail.position.set(0, -0.14, 0.02);
    pilakaRoot.add(tuftTail);

    // -------------------------------------------------------------------------
    // 4. TORSO & VEDIC ATTIRE: RED KANDUVA, YAJNOPAVITA & RUDRAKSHA
    // -------------------------------------------------------------------------
    // Upper body / chest
    const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.52, 14), this.matSkin);
    torsoMesh.position.set(0, 0.22, 0);
    torsoMesh.castShadow = true;
    this.torsoGroup.add(torsoMesh);

    // Sacred Red Kanduva / Angavastram draped around neck and shoulders
    const kanduvaGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.54, 14);
    const kanduvaMesh = new THREE.Mesh(kanduvaGeo, this.matRedKanduva);
    kanduvaMesh.position.set(0, 0.22, 0);
    this.torsoGroup.add(kanduvaMesh);

    // Flowing front folds of the red kanduva
    const frontFoldLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.05), this.matRedKanduva);
    frontFoldLeft.position.set(-0.12, 0.18, 0.15);
    frontFoldLeft.rotation.z = -0.06;
    this.torsoGroup.add(frontFoldLeft);

    const frontFoldRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.05), this.matRedKanduva);
    frontFoldRight.position.set(0.12, 0.18, 0.15);
    frontFoldRight.rotation.z = 0.06;
    this.torsoGroup.add(frontFoldRight);

    // Golden Zari brocade border along kanduva edges
    [-0.12, 0.12].forEach(fx => {
      const zari = new THREE.Mesh(new THREE.BoxGeometry(0.122, 0.05, 0.055), this.matGoldBorder);
      zari.position.set(fx, -0.08, 0.15);
      this.torsoGroup.add(zari);
    });

    // Sacred Holy Thread (Yajnopavita) running diagonally from left shoulder across chest
    const sacredThread = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.009, 6, 20),
      this.matSacredThread
    );
    sacredThread.rotation.y = 0.35;
    sacredThread.rotation.z = 0.72;
    sacredThread.position.set(0.01, 0.22, 0.02);
    this.torsoGroup.add(sacredThread);

    // Sacred Rudraksha Mala around the neck
    const mala = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.016, 6, 20),
      this.matRudraksha
    );
    mala.rotation.x = Math.PI / 2;
    mala.position.set(0, 0.44, 0.03);
    this.torsoGroup.add(mala);

    // -------------------------------------------------------------------------
    // 5. SEATED ARMS & PROPS (Sacred Brass Pooja Kalash on Lap)
    // -------------------------------------------------------------------------
    // Left Arm (Rests gracefully along armrest, hand resting on lap/thigh)
    const leftUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.26, 8), this.matSkin);
    leftUpper.position.set(0, -0.13, 0);
    this.leftArmUpper.add(leftUpper);

    const leftLower = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.24, 8), this.matSkin);
    leftLower.position.set(0, -0.12, 0);
    this.leftArmLower.add(leftLower);

    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), this.matSkin);
    leftHand.position.set(0, -0.24, 0);
    this.leftArmLower.add(leftHand);

    // Right Arm (Rests on right thigh / armrest)
    const rightUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.26, 8), this.matSkin);
    rightUpper.position.set(0, -0.13, 0);
    this.rightArmUpper.add(rightUpper);

    const rightLower = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.24, 8), this.matSkin);
    rightLower.position.set(0, -0.12, 0);
    this.rightArmLower.add(rightLower);

    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), this.matSkin);
    rightHand.position.set(0, -0.24, 0);
    this.rightArmLower.add(rightHand);

    // Default seated arm rotations
    this.leftArmUpper.rotation.set(-0.25, 0, 0.15);
    this.leftArmLower.rotation.set(-0.95, 0, 0);

    this.rightArmUpper.rotation.set(-0.25, 0, -0.15);
    this.rightArmLower.rotation.set(-0.95, 0, 0);

    // Sacred Brass Pooja Kalash resting peacefully on his lap
    const kalashProp = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), this.matBrass);
    kalashProp.add(pot);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.035, 12), this.matBrass);
    rim.position.y = 0.075;
    kalashProp.add(rim);

    // Sacred coconut atop the Kalash
    const coconut = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 })
    );
    coconut.position.y = 0.11;
    kalashProp.add(coconut);

    // Auspicious mango leaves tucked under the coconut
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.025, 0.08, 4),
        new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.7 })
      );
      leaf.position.set(Math.cos(angle) * 0.045, 0.08, Math.sin(angle) * 0.045);
      leaf.rotation.set(Math.sin(angle) * 0.4, 0, -Math.cos(angle) * 0.4);
      kalashProp.add(leaf);
    }

    kalashProp.position.set(-0.02, 0.02, 0.28);
    this.torsoGroup.add(kalashProp);

    // -------------------------------------------------------------------------
    // 6. LOWER BODY: RED TRADITIONAL PANCHA (DHOTI) IN SEATED POSE
    // -------------------------------------------------------------------------
    const thighLength = 0.40;
    const calfLength = 0.44;

    // Pelvis / waist dhoti wrap seated on cushion
    const waistDhoti = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.26, 0.24, 14),
      this.matRedPancha
    );
    waistDhoti.position.set(0, -0.04, 0.02);
    this.torsoGroup.add(waistDhoti);

    // Central pleats (kuchulu) draped over lap between thighs
    const centralPleats = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.06, 0.38),
      this.matRedPancha
    );
    centralPleats.position.set(0, -0.02, 0.22);
    this.torsoGroup.add(centralPleats);

    // Gold zari along pleats front edge
    const pleatZari = new THREE.Mesh(
      new THREE.BoxGeometry(0.122, 0.062, 0.04),
      this.matGoldBorder
    );
    pleatZari.position.set(0, -0.02, 0.40);
    this.torsoGroup.add(pleatZari);

    // Left Thigh (Horizontal forward)
    const leftThighMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.105, thighLength, 14),
      this.matRedPancha
    );
    leftThighMesh.position.set(0, 0, thighLength / 2);
    leftThighMesh.rotation.x = Math.PI / 2;
    leftThighMesh.castShadow = true;
    this.leftLegUpper.add(leftThighMesh);

    // Left Lower Leg (Calf dropping vertically to floor)
    const leftCalfMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.09, calfLength * 0.72, 14),
      this.matRedPancha
    );
    leftCalfMesh.position.y = -calfLength * 0.36;
    this.leftLegLower.add(leftCalfMesh);

    const leftZariHem = new THREE.Mesh(
      new THREE.TorusGeometry(0.091, 0.008, 6, 16),
      this.matGoldBorder
    );
    leftZariHem.rotation.x = Math.PI / 2;
    leftZariHem.position.y = -calfLength * 0.72;
    this.leftLegLower.add(leftZariHem);

    // Exposed natural bare lower shin & ankle
    const leftAnkle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.052, calfLength * 0.28, 12),
      this.matSkin
    );
    leftAnkle.position.y = -calfLength * 0.86;
    this.leftLegLower.add(leftAnkle);

    // Right Thigh (Horizontal forward)
    const rightThighMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.105, thighLength, 14),
      this.matRedPancha
    );
    rightThighMesh.position.set(0, 0, thighLength / 2);
    rightThighMesh.rotation.x = Math.PI / 2;
    rightThighMesh.castShadow = true;
    this.rightLegUpper.add(rightThighMesh);

    // Right Lower Leg (Calf dropping vertically to floor)
    const rightCalfMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.09, calfLength * 0.72, 14),
      this.matRedPancha
    );
    rightCalfMesh.position.y = -calfLength * 0.36;
    this.rightLegLower.add(rightCalfMesh);

    const rightZariHem = new THREE.Mesh(
      new THREE.TorusGeometry(0.091, 0.008, 6, 16),
      this.matGoldBorder
    );
    rightZariHem.rotation.x = Math.PI / 2;
    rightZariHem.position.y = -calfLength * 0.72;
    this.rightLegLower.add(rightZariHem);

    // Exposed natural bare lower shin & ankle
    const rightAnkle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.052, calfLength * 0.28, 12),
      this.matSkin
    );
    rightAnkle.position.y = -calfLength * 0.86;
    this.rightLegLower.add(rightAnkle);

    // -------------------------------------------------------------------------
    // 7. COMPLETELY BAREFOOT FEET RESTING FLAT ON THE VERANDA FLOOR (Y = 0)
    // -------------------------------------------------------------------------
    const leftFootGroup = new THREE.Group();
    // Reaches exact floor level at Y = 0 (relative to group)
    leftFootGroup.position.set(0, -calfLength, 0.02);
    this.leftLegLower.add(leftFootGroup);
    this.buildNaturalBareFoot(leftFootGroup, -1);

    const rightFootGroup = new THREE.Group();
    rightFootGroup.position.set(0, -calfLength, 0.02);
    this.rightLegLower.add(rightFootGroup);
    this.buildNaturalBareFoot(rightFootGroup, 1);
  }

  /**
   * Anatomically sculpted bare human foot with heel, medial arch,
   * plantar ball, and 5 distinct articulated bare toes.
   * Naturally grounded flat on the veranda stone floor with zero floating!
   */
  private buildNaturalBareFoot(footGroup: THREE.Group, side: number): void {
    const footRoot = new THREE.Group();

    // 1. Malleolus ankle bumps
    const lateralAnkle = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), this.matSkin);
    lateralAnkle.position.set(side * 0.048, 0.02, -0.01);
    footRoot.add(lateralAnkle);

    const medialAnkle = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), this.matSkin);
    medialAnkle.position.set(-side * 0.044, 0.025, 0.01);
    footRoot.add(medialAnkle);

    // 2. Sculpted Heel Pad
    const heelGeo = new THREE.SphereGeometry(0.044, 10, 8);
    heelGeo.scale(0.85, 0.8, 1.1);
    const heel = new THREE.Mesh(heelGeo, this.matSkin);
    heel.position.set(0, -0.012, -0.05);
    heel.castShadow = true;
    footRoot.add(heel);

    // 3. Medial Arch & Instep
    const instep = new THREE.Mesh(
      new THREE.BoxGeometry(0.078, 0.042, 0.11),
      this.matSkin
    );
    instep.position.set(0, 0.002, 0.02);
    instep.rotation.x = -0.08;
    footRoot.add(instep);

    // 4. Plantar Metatarsal Ball (Forefoot cushion)
    const ball = new THREE.Mesh(
      new THREE.BoxGeometry(0.092, 0.035, 0.065),
      this.matSkin
    );
    ball.position.set(0, -0.014, 0.085);
    footRoot.add(ball);

    // 5. Five Articulated Bare Toes with subtle natural nails
    const toeData = [
      { medOffset: -0.03, length: 0.042, width: 0.022, height: 0.02, z: 0.135 },
      { medOffset: -0.01, length: 0.044, width: 0.018, height: 0.018, z: 0.138 },
      { medOffset: 0.008, length: 0.04, width: 0.017, height: 0.017, z: 0.134 },
      { medOffset: 0.024, length: 0.034, width: 0.016, height: 0.016, z: 0.128 },
      { medOffset: 0.038, length: 0.028, width: 0.015, height: 0.015, z: 0.122 },
    ];

    const nailMat = new THREE.MeshStandardMaterial({
      color: '#fce7f3',
      roughness: 0.35,
    });

    toeData.forEach(t => {
      const xPos = side * t.medOffset;
      const toeGeo = new THREE.CapsuleGeometry(t.width / 2, t.length * 0.6, 4, 6);
      toeGeo.scale(1.0, 1.0, t.height / t.width);
      const toeMesh = new THREE.Mesh(toeGeo, this.matSkin);
      toeMesh.rotation.x = Math.PI / 2;
      toeMesh.position.set(xPos, -0.015, t.z);
      toeMesh.castShadow = true;
      footRoot.add(toeMesh);

      // Subtle nail plate highlight
      const nail = new THREE.Mesh(
        new THREE.BoxGeometry(t.width * 0.6, 0.003, 0.01),
        nailMat
      );
      nail.position.set(xPos, -0.005, t.z + t.length * 0.2);
      footRoot.add(nail);
    });

    footGroup.add(footRoot);
  }

  public setPosture(posture: 'seated' | 'standing'): void {
    this.posture = posture;
    if (posture === 'seated') {
      this.chairGroup.visible = !this.isInVehicle;
      this.torsoGroup.position.set(0, this.isInVehicle ? 0.04 : 0.48, 0.04);
      this.leftLegUpper.position.set(-0.13, -0.04, 0.06);
      this.leftLegUpper.rotation.set(-Math.PI / 2, 0, 0);
      this.leftLegLower.position.set(0, 0, 0.40);
      this.leftLegLower.rotation.set(Math.PI / 2, 0, 0);
      this.rightLegUpper.position.set(0.13, -0.04, 0.06);
      this.rightLegUpper.rotation.set(-Math.PI / 2, 0, 0);
      this.rightLegLower.position.set(0, 0, 0.40);
      this.rightLegLower.rotation.set(Math.PI / 2, 0, 0);
    } else {
      this.chairGroup.visible = false;
      this.torsoGroup.position.set(0, 0.88, 0);
      this.leftLegUpper.position.set(-0.13, -0.04, 0);
      this.leftLegUpper.rotation.set(Math.PI / 2, 0, 0);
      this.leftLegLower.position.set(0, 0, 0.40);
      this.leftLegLower.rotation.set(0, 0, 0);
      this.rightLegUpper.position.set(0.13, -0.04, 0);
      this.rightLegUpper.rotation.set(Math.PI / 2, 0, 0);
      this.rightLegLower.position.set(0, 0, 0.40);
      this.rightLegLower.rotation.set(0, 0, 0);
    }
  }

  public setWalking(walking: boolean, delta: number = 0.016, speedMultiplier: number = 1.0): void {
    this.isWalking = walking;
    if (walking) {
      this.walkTimer += delta * 5.0 * speedMultiplier;
    }
  }

  public setDialogueGesture(gesture: 'idle' | 'namaste' | 'blessing' | 'aarti' | 'talk'): void {
    this.activeGesture = gesture;
  }

  public update(delta: number, playerPos: THREE.Vector3): void {
    if (this.hasJoinedRamu) return;

    this.animTimer += delta;

    const distToPlayer = this.group.position.distanceTo(playerPos);
    this.isPlayerNearby = distToPlayer < 6.0;

    // Smooth greeting blend
    const targetBlend = this.isPlayerNearby ? 1.0 : 0.0;
    this.namasteBlend = THREE.MathUtils.lerp(this.namasteBlend, targetBlend, delta * 4.0);

    // Head subtle sway / nodding
    const headNod = Math.sin(this.animTimer * 1.5) * 0.025;
    this.headGroup.rotation.x = headNod;

    // Head turns smoothly towards Ramu when nearby and not walking
    if (this.isPlayerNearby && !this.isWalking) {
      const toPlayer = playerPos.clone().sub(this.group.position);
      const localAngle = Math.atan2(toPlayer.z, toPlayer.x) - this.group.rotation.y;
      const clampedAngle = THREE.MathUtils.clamp(localAngle, -0.65, 0.65);
      this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, clampedAngle, delta * 3.5);
    } else {
      this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, 0, delta * 2.0);
    }

    if (this.posture === 'seated') {
      // Idle Seated Breathing
      const breath = Math.sin(this.animTimer * 2.0) * 0.006;
      this.torsoGroup.position.y = 0.48 + breath;

      // Arm gestures
      if (this.activeGesture === 'blessing') {
        this.rightArmUpper.rotation.set(-0.85, -0.25, -0.3);
        this.rightArmLower.rotation.set(-1.25, 0, 0.3);
        this.leftArmUpper.rotation.set(-0.25, 0, 0.1);
        this.leftArmLower.rotation.set(-0.35, 0, 0);
      } else if (this.activeGesture === 'namaste') {
        this.leftArmUpper.rotation.set(-0.75, 0.45, 0.35);
        this.rightArmUpper.rotation.set(-0.75, -0.45, -0.35);
        this.leftArmLower.rotation.set(-1.45, 0, -0.4);
        this.rightArmLower.rotation.set(-1.45, 0, 0.4);
      } else {
        const restArmX = -0.25;
        const restArmZ = -0.15;
        const restLowerX = -0.95;
        const greetArmX = -0.65;
        const greetArmZ = -0.42;
        const greetLowerX = -1.35;

        this.rightArmUpper.rotation.x = THREE.MathUtils.lerp(restArmX, greetArmX, this.namasteBlend);
        this.rightArmUpper.rotation.z = THREE.MathUtils.lerp(restArmZ, greetArmZ, this.namasteBlend);
        this.rightArmLower.rotation.x = THREE.MathUtils.lerp(restLowerX, greetLowerX, this.namasteBlend);
      }
    } else {
      // Standing posture
      if (this.isWalking) {
        const stride = Math.sin(this.walkTimer) * 0.45;
        this.leftLegUpper.rotation.x = Math.PI / 2 + stride;
        this.rightLegUpper.rotation.x = Math.PI / 2 - stride;
        this.leftLegLower.rotation.x = Math.max(0, -stride * 0.5);
        this.rightLegLower.rotation.x = Math.max(0, stride * 0.5);

        // Arms swinging in natural counter-motion
        this.leftArmUpper.rotation.x = -0.2 - stride * 0.6;
        this.rightArmUpper.rotation.x = -0.2 + stride * 0.6;
        this.leftArmLower.rotation.x = -0.3;
        this.rightArmLower.rotation.x = -0.3;

        // Subtle vertical bob
        this.torsoGroup.position.y = 0.88 + Math.abs(Math.sin(this.walkTimer * 2.0)) * 0.025;
      } else {
        // Standing still with breathing
        const breath = Math.sin(this.animTimer * 2.0) * 0.005;
        this.torsoGroup.position.y = 0.88 + breath;
        this.leftLegUpper.rotation.set(Math.PI / 2, 0, 0);
        this.rightLegUpper.rotation.set(Math.PI / 2, 0, 0);
        this.leftLegLower.rotation.set(0, 0, 0);
        this.rightLegLower.rotation.set(0, 0, 0);

        if (this.activeGesture === 'aarti') {
          // Offering Aarti waving before Lord Ganesha
          const aartiSwing = Math.sin(this.animTimer * 2.5) * 0.15;
          this.leftArmUpper.rotation.set(-0.75 + aartiSwing, 0.25, 0.2);
          this.rightArmUpper.rotation.set(-0.75 + aartiSwing, -0.25, -0.2);
          this.leftArmLower.rotation.set(-1.25, 0, -0.2);
          this.rightArmLower.rotation.set(-1.25, 0, 0.2);
        } else if (this.activeGesture === 'namaste') {
          this.leftArmUpper.rotation.set(-0.75, 0.45, 0.35);
          this.rightArmUpper.rotation.set(-0.75, -0.45, -0.35);
          this.leftArmLower.rotation.set(-1.45, 0, -0.4);
          this.rightArmLower.rotation.set(-1.45, 0, 0.4);
        } else if (this.activeGesture === 'blessing') {
          this.rightArmUpper.rotation.set(-0.85, -0.25, -0.3);
          this.rightArmLower.rotation.set(-1.25, 0, 0.3);
          this.leftArmUpper.rotation.set(-0.25, 0, 0.1);
          this.leftArmLower.rotation.set(-0.35, 0, 0);
        } else {
          // Standing idle resting arms
          this.leftArmUpper.rotation.set(-0.15, 0, 0.08);
          this.rightArmUpper.rotation.set(-0.15, 0, -0.08);
          this.leftArmLower.rotation.set(-0.25, 0, 0);
          this.rightArmLower.rotation.set(-0.25, 0, 0);
        }
      }
    }
  }

  public getDialogue(): AyyagaruDialogue {
    return {
      speaker: 'Ayyagaru',
      role: 'Vedic Scholar & Chief Priest',
      text: 'Namaskaram Ramu! Is the sacred Mandapam ready in Rangastalam? Wonderful! Let us go to the village immediately for the grand Vinayaka Chavithi Utsavam and evening Aarti!',
      teluguText: 'నమస్కారం రాము! రంగాస్థలం వినాయక మండపం సిద్ధమైందా? చాలా సంతోషం! రండి బాబూ, వెంటనే బయలుదేరి ఉత్సవాన్ని, సాయంత్రం మహామంగళ హారతిని ఘనంగా జరుపుకుందాం!',
    };
  }

  /**
   * When Ayyagaru joins Ramu in the car:
   * Hide the seated character mesh, while keeping the traditional wooden chair outside his house!
   */
  public setHasJoinedRamu(joined: boolean): void {
    this.hasJoinedRamu = joined;
    this.characterGroup.visible = !joined;
    this.chairGroup.visible = this.posture === 'seated' && !this.isInVehicle;
  }

  /**
   * Sets whether Ayyagaru is mounted directly inside the vehicle
   */
  public setInVehicle(inVehicle: boolean): void {
    this.isInVehicle = inVehicle;
    if (inVehicle) {
      this.chairGroup.visible = false;
      this.characterGroup.visible = true;
      this.group.scale.setScalar(0.76);
      this.setPosture('seated');
      this.torsoGroup.position.set(0, 0.04, 0.04);
    } else {
      this.group.scale.setScalar(1.0);
      this.torsoGroup.position.set(0, 0.48, 0.04);
      this.chairGroup.visible = this.posture === 'seated';
    }
  }

  public getIsInVehicle(): boolean {
    return this.isInVehicle;
  }

  public getIsPlayerNearby(): boolean {
    return this.isPlayerNearby;
  }
}
