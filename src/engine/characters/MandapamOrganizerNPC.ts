/**
 * THE KATHA - Permanent Mandapam Organizer NPC
 *
 * One permanent traditional male NPC who permanently stays at the Ganesh Mandapam:
 * - Traditional Indian appearance: 3D human character, South Indian youth leader/organizer
 * - Small forehead tilak (auspicious red kumkum with yellow sandalwood dot)
 * - Barefoot: Anatomical bare feet touching the ground naturally (zero floating!)
 * - Remains anchored at the Mandapam entrance (does not wander far away)
 * - Idle animations: breathing, looking around at scaffolding/workers, checking preparations,
 *   raising hands in a respectful Namaste greeting when Ramu approaches
 * - Level-dependent traditional clothing:
 *   - Level 1 (Siddham): Traditional construction / festival preparation clothing
 *     (cream/terracotta folded dhoti/lungi, rolled-sleeve cotton kurta, orange shoulder cloth, organizer checklist)
 *   - Level 2 (Utsavam): Traditional festive puja clothing
 *     (pristine white silk dhoti with golden zari border, saffron silk kurta, gold-bordered angavastram)
 *   - Level 3 (Nimajjanam): Royal procession celebration clothing
 *     (rich maroon festive silk kurta with gold trim, golden-yellow dhoti, celebratory ceremonial uttariyam)
 *   - Strictly the SAME person across all levels; only clothing changes!
 */

import * as THREE from 'three';
import { LevelId } from '../../types/game';
import type { PathrikaProgress } from './PathrikaCollectionSystem';

export interface OrganizerDialogue {
  speaker: string;
  role: string;
  text: string;
  teluguText: string;
}

export class MandapamOrganizerNPC {
  public group: THREE.Group;
  public position: THREE.Vector3;
  private currentLevel: LevelId = LevelId.LEVEL_1;
  private pathrikaProgress: PathrikaProgress | null = null;

  // Rigging anchors
  private headGroup: THREE.Group;
  private torsoGroup: THREE.Group;
  private leftArmUpper: THREE.Group;
  private leftArmLower: THREE.Group;
  private rightArmUpper: THREE.Group;
  private rightArmLower: THREE.Group;
  private leftLegUpper: THREE.Group;
  private rightLegUpper: THREE.Group;

  // Level-specific clothing groups (swapped based on level)
  private clothingLevel1: THREE.Group;
  private clothingLevel2: THREE.Group;
  private clothingLevel3: THREE.Group;

  // Prop for Level 1: Organizer's wooden checklist / festival plan
  private checklistProp: THREE.Group | null = null;

  // Animation State
  private animTimer: number = 0;
  private lookTargetYaw: number = 0;
  private lookTargetPitch: number = 0;
  private isPlayerNearby: boolean = false;
  private namasteBlend: number = 0; // 0 (idle) to 1 (namaste greeting)
  private dialogueGesture: 'idle' | 'nod' | 'namaste' | 'talk' = 'idle';

  // Shared Materials
  private matSkin: THREE.MeshStandardMaterial;
  private matHair: THREE.MeshStandardMaterial;
  private matTilakRed: THREE.MeshBasicMaterial;
  private matTilakYellow: THREE.MeshBasicMaterial;
  private matTilakWhite: THREE.MeshBasicMaterial;
  private matEyesDark: THREE.MeshBasicMaterial;

  constructor(x: number = -2.4, z: number = 3.6, initialLevel: LevelId = LevelId.LEVEL_1) {
    this.group = new THREE.Group();
    this.group.name = 'mandapam_permanent_organizer_npc';
    this.position = new THREE.Vector3(x, 0, z);
    this.group.position.copy(this.position);
    this.group.rotation.y = 0.25; // Facing the village entrance path

    this.currentLevel = initialLevel;

    // 1. Shared Anatomical Materials
    this.matSkin = new THREE.MeshStandardMaterial({
      color: '#c68642',
      roughness: 0.8,
      metalness: 0.05,
    });

    this.matHair = new THREE.MeshStandardMaterial({
      color: '#27272a', // Salt-and-pepper / distinguished elder hair
      roughness: 0.9,
      metalness: 0.05,
    });

    this.matTilakRed = new THREE.MeshBasicMaterial({ color: '#dc2626' });
    this.matTilakYellow = new THREE.MeshBasicMaterial({ color: '#facc15' });
    this.matTilakWhite = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
    this.matEyesDark = new THREE.MeshBasicMaterial({ color: '#09090b' });

    // 2. Build Human Skeleton & Anatomy (Ground-anchored: y = 0)
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.94, 0);
    this.group.add(this.torsoGroup);

    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.52, 0);
    this.torsoGroup.add(this.headGroup);

    this.leftArmUpper = new THREE.Group();
    this.leftArmUpper.position.set(-0.25, 0.44, 0);
    this.torsoGroup.add(this.leftArmUpper);

    this.leftArmLower = new THREE.Group();
    this.leftArmLower.position.set(0, -0.28, 0);
    this.leftArmUpper.add(this.leftArmLower);

    this.rightArmUpper = new THREE.Group();
    this.rightArmUpper.position.set(0.25, 0.44, 0);
    this.torsoGroup.add(this.rightArmUpper);

    this.rightArmLower = new THREE.Group();
    this.rightArmLower.position.set(0, -0.28, 0);
    this.rightArmUpper.add(this.rightArmLower);

    this.leftLegUpper = new THREE.Group();
    this.leftLegUpper.position.set(-0.13, 0.92, 0);
    this.group.add(this.leftLegUpper);

    this.rightLegUpper = new THREE.Group();
    this.rightLegUpper.position.set(0.13, 0.92, 0);
    this.group.add(this.rightLegUpper);

    // Build permanent head & face (Distinguished Purohit / Elder)
    this.buildPermanentHeadAndFace();

    // Sacred Yagnopaveetham (Holy white thread) and Rudraksha Mala
    this.buildSacredOrnaments();

    // Build grounded bare feet & legs
    this.buildBareLegsAndFeet();

    // 3. Build Level Clothing Sets
    this.clothingLevel1 = this.buildLevel1Clothing();
    this.clothingLevel2 = this.buildLevel2Clothing();
    this.clothingLevel3 = this.buildLevel3Clothing();

    this.group.add(this.clothingLevel1);
    this.group.add(this.clothingLevel2);
    this.group.add(this.clothingLevel3);

    // Set initial active level clothing
    this.setLevel(this.currentLevel);
  }

  public setPathrikaProgress(progress: PathrikaProgress | null): void {
    this.pathrikaProgress = progress;
  }

  /**
   * Builds the permanent character head, traditional tilak, and hair.
   * This geometry NEVER changes between levels so he is unmistakably the same person.
   */
  private buildPermanentHeadAndFace(): void {
    // 1. Head Cranium & Face
    const headGeo = new THREE.SphereGeometry(0.125, 12, 12);
    const head = new THREE.Mesh(headGeo, this.matSkin);
    head.scale.set(1.0, 1.15, 1.05);
    head.position.y = 0.12;
    head.castShadow = true;
    this.headGroup.add(head);

    // Defined male jaw and chin
    const jawGeo = new THREE.BoxGeometry(0.13, 0.09, 0.12);
    const jaw = new THREE.Mesh(jawGeo, this.matSkin);
    jaw.position.set(0, 0.05, 0.04);
    this.headGroup.add(jaw);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.024, 0.065, 5);
    const nose = new THREE.Mesh(noseGeo, this.matSkin);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.11, 0.135);
    this.headGroup.add(nose);

    // Friendly Eyes
    [-0.042, 0.042].forEach(ex => {
      const eyeWhite = new THREE.Mesh(
        new THREE.PlaneGeometry(0.024, 0.012),
        new THREE.MeshBasicMaterial({ color: '#fefefe' })
      );
      eyeWhite.position.set(ex, 0.135, 0.125);
      this.headGroup.add(eyeWhite);

      const pupil = new THREE.Mesh(new THREE.PlaneGeometry(0.011, 0.011), this.matEyesDark);
      pupil.position.set(ex, 0.135, 0.127);
      this.headGroup.add(pupil);

      // Eyebrows
      const brow = new THREE.Mesh(
        new THREE.BoxGeometry(0.038, 0.007, 0.01),
        this.matHair
      );
      brow.position.set(ex, 0.155, 0.126);
      brow.rotation.z = ex > 0 ? -0.1 : 0.1;
      this.headGroup.add(brow);
    });

    // Gentle Welcoming Smile
    const lip = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.009, 0.01),
      new THREE.MeshStandardMaterial({ color: '#99533c', roughness: 0.7 })
    );
    lip.position.set(0, 0.07, 0.125);
    this.headGroup.add(lip);

    // Neatly combed traditional side-parted hairstyle
    const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.132, 10, 10), this.matHair);
    hairCap.position.set(0, 0.14, -0.01);
    hairCap.scale.set(1.02, 1.05, 1.08);
    this.headGroup.add(hairCap);

    // Front styled hair locks
    const hairFront = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.08), this.matHair);
    hairFront.position.set(0.02, 0.22, 0.06);
    hairFront.rotation.z = -0.12;
    this.headGroup.add(hairFront);

    // Ears
    [-0.13, 0.13].forEach(ex => {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.02), this.matSkin);
      ear.position.set(ex, 0.11, 0);
      ear.rotation.y = ex > 0 ? 0.2 : -0.2;
      this.headGroup.add(ear);
    });

    // Traditional Tripundra (Three holy Vibhuti white stripes on forehead)
    [-0.012, 0.0, 0.012].forEach(vy => {
      const vibhuti = new THREE.Mesh(
        new THREE.BoxGeometry(0.062, 0.005, 0.003),
        this.matTilakWhite
      );
      vibhuti.position.set(0, 0.175 + vy, 0.126);
      this.headGroup.add(vibhuti);
    });

    // Auspicious Forehead Tilak (Chandan base with sacred red Kumkum bindi)
    const tilakBase = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.038, 0.005), this.matTilakYellow);
    tilakBase.position.set(0, 0.175, 0.129);
    this.headGroup.add(tilakBase);

    const tilakDot = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.006, 8), this.matTilakRed);
    tilakDot.rotation.x = Math.PI / 2;
    tilakDot.position.set(0, 0.175, 0.133);
    this.headGroup.add(tilakDot);
  }

  /**
   * Sacred ornaments:
   * - Sacred Yagnopaveetham (Jandhyam / holy white thread) running from left shoulder diagonally across chest
   * - Auspicious Rudraksha bead mala around neck
   */
  private buildSacredOrnaments(): void {
    const threadMat = new THREE.MeshStandardMaterial({
      color: '#fffbeb',
      roughness: 0.9,
    });
    const sacredThread = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.008, 6, 16),
      threadMat
    );
    sacredThread.rotation.set(0.3, 0.7, 0.9);
    sacredThread.position.set(0, 0.22, 0.02);
    this.torsoGroup.add(sacredThread);

    const matRudraksha = new THREE.MeshStandardMaterial({
      color: '#572b14',
      roughness: 0.85,
    });
    const rudrakshaMala = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.014, 8, 16),
      matRudraksha
    );
    rudrakshaMala.rotation.x = Math.PI / 2.3;
    rudrakshaMala.position.set(0, 0.46, 0.04);
    this.torsoGroup.add(rudrakshaMala);
  }

  /**
   * Anatomically correct, grounded bare legs & feet.
   * Ground y = 0. Heel, sole, and 5 toes touch y = 0 exactly.
   */
  private buildBareLegsAndFeet(): void {
    [-1, 1].forEach(side => {
      const parentLeg = side === -1 ? this.leftLegUpper : this.rightLegUpper;

      // Thigh (covered mostly by dhoti/lungi)
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.44, 8), this.matSkin);
      thigh.position.y = -0.22;
      parentLeg.add(thigh);

      // Lower Leg / Calf
      const calfGroup = new THREE.Group();
      calfGroup.position.set(0, -0.44, 0);
      parentLeg.add(calfGroup);

      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.44, 8), this.matSkin);
      calf.position.y = -0.22;
      calfGroup.add(calf);

      // Ankle joint (y = 0.055)
      const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), this.matSkin);
      ankle.position.set(0, -0.42, 0);
      calfGroup.add(ankle);

      // Foot (touches y = 0 exactly!)
      // Calf group is at y = -0.44 relative to legUpper (y = 0.92), so bottom of calf is at y = 0.04
      const foot = new THREE.Group();
      foot.position.set(0, -0.44, 0.04);
      calfGroup.add(foot);

      // Foot arch / heel
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.038, 0.16), this.matSkin);
      sole.position.set(0, -0.019, 0.02); // Sits flat on ground
      foot.add(sole);

      // 5 Distinct Bare Toes
      const toeRadii = [0.015, 0.013, 0.012, 0.011, 0.01];
      toeRadii.forEach((tr, i) => {
        const toe = new THREE.Mesh(new THREE.SphereGeometry(tr, 6, 6), this.matSkin);
        const toeX = (i - 2) * 0.015 * side;
        toe.position.set(toeX, -0.022, 0.11);
        foot.add(toe);
      });
    });

    // Build Hands on arms
    [-1, 1].forEach(side => {
      const armLower = side === -1 ? this.leftArmLower : this.rightArmLower;

      // Forearm
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.28, 8), this.matSkin);
      forearm.position.y = -0.14;
      armLower.add(forearm);

      // Hand palm
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.075, 0.025), this.matSkin);
      palm.position.set(0, -0.31, 0);
      armLower.add(palm);

      // Fingers
      const fingers = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.055, 0.02), this.matSkin);
      fingers.position.set(0, -0.37, 0);
      armLower.add(fingers);

      // Thumb
      const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.035, 0.018), this.matSkin);
      thumb.position.set(side * 0.038, -0.31, 0.01);
      armLower.add(thumb);
    });
  }

  /**
   * LEVEL 1 CLOTHING: "SIDDHAM" — Traditional Construction / Festival Preparation Attire
   * - Folded cream cotton panche/lungi tucked up to knee height (kachha fold) with rustic terracotta border
   * - Half-sleeve sand/saffron khadi cotton kurta with rolled-up sleeves
   * - Bright orange angavastram (cotton towel) folded over right shoulder
   * - Holds a wooden festival preparation checklist/clipboard with list of tasks
   */
  private buildLevel1Clothing(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'clothing_level_1_siddham';

    const matKhadiKurta = new THREE.MeshStandardMaterial({
      color: '#e5d5ba', // Light unbleached sand cotton
      roughness: 0.85,
    });
    const matFoldedLungi = new THREE.MeshStandardMaterial({
      color: '#f5efe6', // Off-white cream cotton
      roughness: 0.9,
    });
    const matRusticBorder = new THREE.MeshStandardMaterial({
      color: '#9a3412', // Terracotta rust border
      roughness: 0.8,
    });
    const matOrangeTowel = new THREE.MeshStandardMaterial({
      color: '#ea580c', // Bright worker's saffron-orange towel
      roughness: 0.85,
    });

    // 1. Kurta Torso
    const kurtaTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.26, 0.52, 10),
      matKhadiKurta
    );
    kurtaTorso.position.set(0, 1.18, 0);
    kurtaTorso.castShadow = true;
    group.add(kurtaTorso);

    // Collar and button placket
    const placket = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.28, 0.02),
      matRusticBorder
    );
    placket.position.set(0, 1.34, 0.245);
    group.add(placket);

    // 2. Rolled-up Half Sleeves on Upper Arms
    [-0.25, 0.25].forEach(ax => {
      const sleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.082, 0.22, 8),
        matKhadiKurta
      );
      sleeve.position.set(ax, 1.28, 0);
      group.add(sleeve);

      // Rolled cuff
      const cuff = new THREE.Mesh(
        new THREE.TorusGeometry(0.078, 0.016, 6, 12),
        matRusticBorder
      );
      cuff.rotation.x = Math.PI / 2;
      cuff.position.set(ax, 1.18, 0);
      group.add(cuff);
    });

    // 3. Folded Lungi / Dhoti (Tucked up to knee height for active construction work)
    const lungiTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.26, 0.38, 10),
      matFoldedLungi
    );
    lungiTop.position.set(0, 0.76, 0);
    lungiTop.castShadow = true;
    group.add(lungiTop);

    // Folded tuck bulge at waist
    const waistKachha = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.27, 0.12, 10),
      matRusticBorder
    );
    waistKachha.position.set(0, 0.92, 0);
    group.add(waistKachha);

    // Lower folded hem ends right above knees (around y = 0.52)
    const hemBorder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.262, 0.262, 0.05, 10),
      matRusticBorder
    );
    hemBorder.position.set(0, 0.58, 0);
    group.add(hemBorder);

    // 4. Folded Orange Angavastram towel over right shoulder
    const towelStole = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.52, 0.08),
      matOrangeTowel
    );
    towelStole.position.set(0.18, 1.24, 0.04);
    towelStole.rotation.z = -0.15;
    group.add(towelStole);

    // 5. Organizer's Wooden Checklist / Mandapam Blueprint Slate in Hand
    this.checklistProp = new THREE.Group();
    this.checklistProp.position.set(-0.24, 0.95, 0.22);
    this.checklistProp.rotation.set(0.4, 0.2, -0.3);

    const boardMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.7 });
    const paperMat = new THREE.MeshBasicMaterial({ color: '#fef3c7' });
    const clipMat = new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.8 });

    const clipBoard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.015), boardMat);
    this.checklistProp.add(clipBoard);

    const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.005), paperMat);
    sheet.position.z = 0.01;
    this.checklistProp.add(sheet);

    // Little clip on top
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.02), clipMat);
    clip.position.set(0, 0.14, 0.012);
    this.checklistProp.add(clip);

    group.add(this.checklistProp);

    return group;
  }

  /**
   * LEVEL 2 CLOTHING: "UTSAVAM" — Pristine Festive Puja Clothing
   * - Flowing full-length ivory silk dhoti (pattu panche) with shimmering gold zari border
   * - Rich festive saffron-ochre silk kurta with mandarin collar and golden buttons
   * - Golden-bordered silk angavastram draped across chest and left shoulder
   * - Sacred tulsi bead mala around neck
   */
  private buildLevel2Clothing(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'clothing_level_2_utsavam';

    const matSilkSaffron = new THREE.MeshStandardMaterial({
      color: '#f97316', // Rich festive saffron silk
      roughness: 0.55,
      metalness: 0.15,
    });
    const matIvoryPattu = new THREE.MeshStandardMaterial({
      color: '#fefce8', // Pristine ivory festive silk
      roughness: 0.6,
    });
    const matGoldZari = new THREE.MeshStandardMaterial({
      color: '#eab308', // Radiant gold zari border
      roughness: 0.3,
      metalness: 0.75,
    });
    const matTulsiMala = new THREE.MeshStandardMaterial({
      color: '#451a03', // Sacred wood tulsi beads
      roughness: 0.8,
    });

    // 1. Festive Saffron Kurta
    const kurta = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.58, 10),
      matSilkSaffron
    );
    kurta.position.set(0, 1.16, 0);
    kurta.castShadow = true;
    group.add(kurta);

    // Golden front buttons
    for (let i = 0; i < 4; i++) {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), matGoldZari);
      btn.position.set(0, 1.34 - i * 0.06, 0.25);
      group.add(btn);
    }

    // Sleeves
    [-0.25, 0.25].forEach(ax => {
      const sleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 0.26, 8),
        matSilkSaffron
      );
      sleeve.position.set(ax, 1.26, 0);
      group.add(sleeve);
    });

    // 2. Full-length Pattu Panche (Dhoti down to ankles)
    const dhoti = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.29, 0.86, 12),
      matIvoryPattu
    );
    dhoti.position.set(0, 0.52, 0);
    dhoti.castShadow = true;
    group.add(dhoti);

    // Cascading central pleats (Kuchulu)
    const pleats = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.78, 0.06),
      matIvoryPattu
    );
    pleats.position.set(0, 0.54, 0.25);
    group.add(pleats);

    // Gold Zari Border along hem
    const hemZari = new THREE.Mesh(
      new THREE.CylinderGeometry(0.292, 0.292, 0.06, 12),
      matGoldZari
    );
    hemZari.position.set(0, 0.12, 0);
    group.add(hemZari);

    // 3. Gold-bordered Angavastram draped across chest and left shoulder
    const stole = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.72, 0.05),
      matIvoryPattu
    );
    stole.position.set(-0.16, 1.18, 0.12);
    stole.rotation.set(0.1, 0.15, 0.25);
    group.add(stole);

    const stoleBorder = new THREE.Mesh(
      new THREE.BoxGeometry(0.142, 0.06, 0.055),
      matGoldZari
    );
    stoleBorder.position.set(-0.16, 0.84, 0.12);
    stoleBorder.rotation.set(0.1, 0.15, 0.25);
    group.add(stoleBorder);

    // 4. Sacred Tulsi Bead Mala around neck
    const mala = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.014, 6, 16),
      matTulsiMala
    );
    mala.rotation.x = Math.PI / 2.6;
    mala.position.set(0, 1.38, 0.05);
    group.add(mala);

    return group;
  }

  /**
   * LEVEL 3 CLOTHING: "NIMAJJANAM" — Grand Procession Festival Attire
   * - Deep royal crimson/maroon festive silk kurta with ornate gold embroidered collar
   * - Golden-yellow raw silk dhoti with deep red border
   * - Ceremonial saffron-and-gold uttariyam stole draped over both shoulders
   */
  private buildLevel3Clothing(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'clothing_level_3_nimajjanam';

    const matMaroonSilk = new THREE.MeshStandardMaterial({
      color: '#831843', // Royal deep crimson-maroon
      roughness: 0.5,
      metalness: 0.2,
    });
    const matGoldenDhoti = new THREE.MeshStandardMaterial({
      color: '#fef08a', // Auspicious golden-yellow silk
      roughness: 0.6,
    });
    const matCrimsonBorder = new THREE.MeshStandardMaterial({
      color: '#991b1b', // Deep crimson border
      roughness: 0.65,
    });
    const matGoldZari = new THREE.MeshStandardMaterial({
      color: '#eab308',
      roughness: 0.3,
      metalness: 0.8,
    });

    // 1. Royal Maroon Silk Kurta
    const kurta = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.6, 10),
      matMaroonSilk
    );
    kurta.position.set(0, 1.16, 0);
    kurta.castShadow = true;
    group.add(kurta);

    // Ornate embroidered collar & placket
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.02, 6, 12),
      matGoldZari
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 1.44, 0);
    group.add(collar);

    const placket = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.32, 0.015),
      matGoldZari
    );
    placket.position.set(0, 1.28, 0.25);
    group.add(placket);

    // 2. Golden-Yellow Dhoti with Crimson Border
    const dhoti = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.29, 0.86, 12),
      matGoldenDhoti
    );
    dhoti.position.set(0, 0.52, 0);
    dhoti.castShadow = true;
    group.add(dhoti);

    const hemBorder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.292, 0.292, 0.07, 12),
      matCrimsonBorder
    );
    hemBorder.position.set(0, 0.12, 0);
    group.add(hemBorder);

    // 3. Ceremonial Saffron & Gold Procession Uttariyam over both shoulders
    const stoleL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.04), matGoldZari);
    stoleL.position.set(-0.2, 1.14, 0.12);
    group.add(stoleL);

    const stoleR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.04), matGoldZari);
    stoleR.position.set(0.2, 1.14, 0.12);
    group.add(stoleR);

    return group;
  }

  /**
   * Updates clothing visibility strictly according to current level.
   * Ensures the NPC remains the EXACT same person across all levels.
   */
  public setLevel(levelId: LevelId): void {
    this.currentLevel = levelId;
    this.clothingLevel1.visible = levelId === LevelId.LEVEL_1;
    this.clothingLevel2.visible = levelId === LevelId.LEVEL_2;
    this.clothingLevel3.visible = levelId === LevelId.LEVEL_3;
  }

  /**
   * Idle animation & behavior loop:
   * - Standing grounded at his post
   * - Looking around at workers, scaffolding, and entrance
   * - Gentle chest breathing kinematics
   * - Raises hands into Namaste greeting when Ramu gets close
   */
  public update(delta: number, playerPos?: THREE.Vector3): void {
    this.animTimer += delta;

    // 1. Proximity check with player
    let distToPlayer = 999;
    if (playerPos) {
      const dx = playerPos.x - this.position.x;
      const dz = playerPos.z - this.position.z;
      distToPlayer = Math.sqrt(dx * dx + dz * dz);
    }
    this.isPlayerNearby = distToPlayer < 3.8;

    // Smooth blend for Namaste greeting gesture
    const targetNamaste = this.dialogueGesture === 'namaste' || (this.isPlayerNearby && this.dialogueGesture !== 'nod' && this.dialogueGesture !== 'talk') ? 1.0 : 0.0;
    this.namasteBlend += (targetNamaste - this.namasteBlend) * Math.min(1.0, delta * 4.0);

    // 2. Idle Chest Breathing Kinematics
    const breath = Math.sin(this.animTimer * 1.8) * 0.015;
    this.torsoGroup.position.y = 0.94 + breath;

    // 3. Head Looking Behavior
    if ((this.isPlayerNearby || this.dialogueGesture !== 'idle') && playerPos) {
      // Look directly towards player when nearby or speaking
      const dx = playerPos.x - this.position.x;
      const dz = playerPos.z - this.position.z;
      const angleToPlayer = Math.atan2(dx, dz) - this.group.rotation.y;
      this.lookTargetYaw = THREE.MathUtils.clamp(angleToPlayer, -0.7, 0.7);
      this.lookTargetPitch = this.dialogueGesture === 'nod'
        ? -0.15 + Math.sin(this.animTimer * 6.0) * 0.12
        : -0.15; // Look slightly down towards Ramu
    } else {
      // Periodic glancing around at mandapam preparations
      const lookCycle = Math.sin(this.animTimer * 0.35);
      if (lookCycle > 0.4) {
        // Glance up towards scaffolding & rafters
        this.lookTargetYaw = 0.3;
        this.lookTargetPitch = 0.25;
      } else if (lookCycle < -0.4) {
        // Glance left towards workers and idol
        this.lookTargetYaw = -0.45;
        this.lookTargetPitch = 0.0;
      } else {
        // Look ahead towards village entrance
        this.lookTargetYaw = 0.05;
        this.lookTargetPitch = 0.0;
      }
    }

    // Smooth head turning
    this.headGroup.rotation.y += (this.lookTargetYaw - this.headGroup.rotation.y) * Math.min(1.0, delta * 3.5);
    this.headGroup.rotation.x += (this.lookTargetPitch - this.headGroup.rotation.x) * Math.min(1.0, delta * 3.5);

    // 4. Arms Kinematics (Idle vs Namaste)
    if (this.namasteBlend > 0.02) {
      // Bring hands together in front of chest in traditional Namaste
      const blend = this.namasteBlend;
      // Left arm moves inward & up
      this.leftArmUpper.rotation.x = THREE.MathUtils.lerp(0.1, -0.65, blend);
      this.leftArmUpper.rotation.y = THREE.MathUtils.lerp(0.0, 0.45, blend);
      this.leftArmUpper.rotation.z = THREE.MathUtils.lerp(0.1, 0.5, blend);
      this.leftArmLower.rotation.x = THREE.MathUtils.lerp(0.2, -1.2, blend);

      // Right arm moves inward & up to meet left hand
      this.rightArmUpper.rotation.x = THREE.MathUtils.lerp(0.1, -0.65, blend);
      this.rightArmUpper.rotation.y = THREE.MathUtils.lerp(0.0, -0.45, blend);
      this.rightArmUpper.rotation.z = THREE.MathUtils.lerp(-0.1, -0.5, blend);
      this.rightArmLower.rotation.x = THREE.MathUtils.lerp(0.2, -1.2, blend);
    } else {
      // Level-specific idle arm pose
      if (this.currentLevel === LevelId.LEVEL_1) {
        // Holding clipboard with left arm, right hand resting near waist or gesturing
        const subtleG = Math.sin(this.animTimer * 1.2) * 0.05;
        this.leftArmUpper.rotation.set(-0.35 + subtleG, 0.2, 0.15);
        this.leftArmLower.rotation.set(-0.7, 0.1, 0.0);

        const pointCycle = Math.sin(this.animTimer * 0.5);
        if (pointCycle > 0.7) {
          // Pointing towards scaffolding
          this.rightArmUpper.rotation.set(-0.7, -0.3, -0.3);
          this.rightArmLower.rotation.set(-0.4, 0, 0);
        } else {
          // Hand resting comfortably
          this.rightArmUpper.rotation.set(0.1 + subtleG, -0.1, -0.12);
          this.rightArmLower.rotation.set(0.2, 0, 0);
        }
      } else {
        // Peaceful traditional posture
        const sway = Math.sin(this.animTimer * 1.1) * 0.03;
        this.leftArmUpper.rotation.set(0.08 + sway, 0.05, 0.1);
        this.leftArmLower.rotation.set(0.15, 0, 0);

        this.rightArmUpper.rotation.set(0.08 - sway, -0.05, -0.1);
        this.rightArmLower.rotation.set(0.15, 0, 0);
      }
    }
  }

  /**
   * Retrieves interactive dialogue line with deep Telugu cultural flavor,
   * festival context, progress tracking, leaf acceptance, and blessings.
   */
  public getDialogue(): OrganizerDialogue {
    if (this.currentLevel === LevelId.LEVEL_1) {
      // 1. Initial State: Ramu has not yet picked up the paper bag
      if (!this.pathrikaProgress || !this.pathrikaProgress.hasPaperBag) {
        return {
          speaker: 'Anand',
          role: 'Mandapam Organizer',
          text: 'Namaste Ramu babu! Welcome to our sacred Vinayaka Mandapam! We are setting up the Siddham stage, lashing bamboo scaffolding, and crafting the clay idol from sacred river soil. For the holy Prana Pratishtha puja, we need the 21 sacred leaves (Eka Vimshathi Patri) from the jungle grove! Pick up the paper bag beside our stand to begin your sacred seva.',
          teluguText: 'నమస్తే రాము బాబూ! వినాయక చవితి పూజ కోసం మండపాన్ని సిద్ధం చేస్తున్నాం. పూజకు 21 పవిత్ర ఏకవింశతి పత్రాలు కావాలి. పక్కనే ఉన్న సంచిని తీసుకొని అడవికి బయలుదేరండి బాబూ! విఘ్నేశ్వరుని కృప నీపై ఉంటుంది.',
        };
      }

      // 2. In Progress: Bag collected, collecting leaves in the forest grove
      if (!this.pathrikaProgress.isComplete && !this.pathrikaProgress.isSubmitted) {
        const count = this.pathrikaProgress.totalCollected;
        return {
          speaker: 'Anand',
          role: 'Mandapam Organizer',
          text: `Shabash Ramu! You and your companions have gathered ${count} of 21 sacred leaves! Every holy Patri—like Machi, Bilva, Durva, and Dhatura—pleases Lord Ganesha immensely. Search carefully around the jungle trees and stream with pure devotion!`,
          teluguText: `శభాష్ రాము! ఇప్పటివరకు ${count}/21 పవిత్ర పత్రాలు సేకరించావు! మాచీ, బిల్వ, గరిక వంటి పత్రాలతో స్వామి ఎంతో సంతోషిస్తాడు. మిగిలినవి కూడా శ్రద్ధగా వెతికి తీసుకురా!`,
        };
      }

      // 3. Ready to Submit: All 21 leaves collected and returned to the Mandapam
      if (this.pathrikaProgress.isComplete && !this.pathrikaProgress.isSubmitted) {
        return {
          speaker: 'Anand',
          role: 'Mandapam Organizer',
          text: 'Adhbhutam Ramu! Paramasubham! You have brought all 21 sacred Patri leaves without missing a single holy leaf! Lord Ganesha has guided your swift footsteps. Step forward to the altar sanctum and submit the leaves for the sacred puja!',
          teluguText: 'అద్భుతం రాము! పరమ శుభం! మొత్తం 21 పవిత్ర ఏకవింశతి పత్రాలను క్షేమంగా తెచ్చావు. వినాయకుని పీఠం వద్ద సమర్పించు, మహా పూజ ప్రారంభం కావడానికి మన మండపం సిద్ధమైంది!',
        };
      }

      // 4. Submission Complete: Blessed upon successful submission
      return {
        speaker: 'Anand',
        role: 'Mandapam Organizer',
        text: 'Ayushman Bhava, Ramu! May Lord Vigneshwara, the remover of all obstacles, shower divine wisdom, health, strength, and boundless joy upon you and your family! The sacred Mandapam is now sanctified for the festival. Subhamastu! Ganapati Bappa Morya!',
        teluguText: 'ఆయుష్మాన్ భవ రాము! విఘ్నేశ్వరుని సంపూర్ణ ఆశీర్వాదాలు నీకు లభించాయి. సకల విఘ్నాలు తొలగి సమస్త శుభాలు కలుగుగాక! శుభమస్తు! జై గణేశా!',
      };
    } else if (this.currentLevel === LevelId.LEVEL_2) {
      return {
        speaker: 'Anand',
        role: 'Mandapam Organizer',
        text: 'Ganapati Bappa Morya! Look at our magnificent Mandapam, Ramu! The flower toranams, radiant festive lights, and the sacred Vedic chants are in full divine glory. Thank you for your sincere dedication!',
        teluguText: 'గణపతి బప్పా మోరియా! పూజ ఘనంగా మొదలైంది రాము! స్వామి దివ్య ఆశీస్సులు నీతో ఉంటాయి!',
      };
    } else {
      return {
        speaker: 'Anand',
        role: 'Mandapam Organizer',
        text: 'Subhamastu Ramu! What a glorious festival we celebrated together. The sacred clay idol is prepared for the grand Nimajjanam procession to the holy lake, returning to Mother Earth. Jai Ganesha!',
        teluguText: 'శుభమస్తు రాము! పవిత్ర నిమజ్జన ఊరేగింపు మొదలవుతోంది. జై బోలో గణేష్ మహారాజ్ కీ జై!',
      };
    }
  }

  public getIsPlayerNearby(): boolean {
    return this.isPlayerNearby;
  }

  public setDialogueGesture(gesture: 'idle' | 'nod' | 'namaste' | 'talk'): void {
    this.dialogueGesture = gesture;
  }
}
