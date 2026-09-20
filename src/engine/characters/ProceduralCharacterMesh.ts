/**
 * THE KATHA - Traditional Indian Festive 3D Character Generator
 *
 * Implements traditional, clean, game-friendly Indian 3D character designs:
 * - Exactly 5 Human Characters — ALL FIVE ARE MALE:
 *   1. Ramu: 19-year-old village youth leader, athletic proportions, kind and adventurous.
 *   2. Chintu (Companion 1): 18-year-old energetic dhol drummer, compact build, spirited and friendly.
 *   3. Bhavani (Companion 2): 19-year-old playful strategist, lean build, sharp chiseled jaw, clever wit.
 *   4. Varun (Companion 3): 20-year-old calm builder, tall broad-shouldered muscular frame, mature composure.
 *   5. Dinesh (Companion 4): 19-year-old festive artisan, slender relaxed build, dimpled smile, creative spirit.
 *
 * TRADITIONAL FESTIVE OUTFIT FOR EVERY CHARACTER:
 * - TOP: Plain, solid-colour, half-sleeve shirt.
 *   - Clean folded collar, front button placket, half-length sleeves ending neatly above elbows.
 *   - Absolutely NO checks, NO patterns, NO logos, NO jackets, NO hoodies, NO backpacks.
 * - BOTTOM: Traditional plain white pancha / dhoti.
 *   - Beautiful natural cloth drape pleats, central cascading pleats (kuchulu), and leg wraps.
 *   - Elegant white cotton with delicate golden zari border accent.
 * - FOOTWEAR: NO FOOTWEAR AT ALL.
 *   - Completely barefoot: anatomical heel, medial arch, plantar ball, 5 distinct articulated toes, and ankle bones.
 *   - Clearly bare feet touching the ground naturally.
 * - FOREHEAD: Small traditional festive tilak / bottu.
 *   - Small and subtle, placed between the eyebrows, perfectly festival-appropriate.
 *
 * LEVEL-SPECIFIC SHIRT SYSTEM (Dynamic Level Color Palette):
 * - Level 1 (Siddham): Ramu(Blue), Chintu(Pink), Bhavani(Orange), Varun(Green), Dinesh(Yellow)
 * - Level 2 (Utsavam): Ramu(Maroon), Chintu(Teal), Bhavani(Purple), Varun(Cream), Dinesh(Red)
 * - Level 3 (Nimajjanam): Ramu(Saffron), Chintu(Navy Blue), Bhavani(Turquoise), Varun(Olive), Dinesh(Coral)
 * Shirts automatically update dynamically when the player enters another level.
 *
 * MUSHAK:
 * - Preserved Lord Ganesha's sacred mouse guide with friendly cartoon proportions.
 */

import * as THREE from 'three';
import { CharacterConfig, CharacterId, LevelId } from '../../types/game';
import { characterTextures } from './CharacterTextures';
import { CharacterFacialRig, FacialExpressionType, FacialRigElements } from './CharacterFacialRig';
import { CharacterRegistry } from '../../core/characters/CharacterRegistry';

export class ProceduralCharacterMesh {
  public group: THREE.Group;
  public config: CharacterConfig;
  public currentLevel: LevelId;

  // Materials managed dynamically
  private shirtMaterials: THREE.MeshStandardMaterial[] = [];
  private lungiMaterial: THREE.MeshStandardMaterial | null = null;
  private panchaMaterial: THREE.MeshStandardMaterial | null = null;
  private skinMaterial: THREE.MeshStandardMaterial | null = null;

  // Rigging anchors for realistic biped kinematics
  private headGroup: THREE.Group | null = null;
  private torsoGroup: THREE.Group | null = null;
  private pelvisGroup: THREE.Group | null = null;
  private leftLegUpper: THREE.Group | null = null;
  private leftLegLower: THREE.Group | null = null;
  private leftFoot: THREE.Group | null = null;
  private rightLegUpper: THREE.Group | null = null;
  private rightLegLower: THREE.Group | null = null;
  private rightFoot: THREE.Group | null = null;
  private leftArmUpper: THREE.Group | null = null;
  private leftArmLower: THREE.Group | null = null;
  private rightArmUpper: THREE.Group | null = null;
  private rightArmLower: THREE.Group | null = null;
  private tailGroup: THREE.Group | null = null;

  // Facial Rig & Expression System
  private facialRig: CharacterFacialRig | null = null;

  // Animation Kinematics State
  private walkCycleTime: number = 0;
  private currentSpeedRatio: number = 0;
  private currentGesture: string = 'idle';
  private isSitting: boolean = false;
  private isDriverSitting: boolean = false;

  public setSitting(sitting: boolean, isDriver: boolean = false): void {
    this.isSitting = sitting;
    this.isDriverSitting = isDriver;
  }

  public getIsSitting(): boolean {
    return this.isSitting;
  }

  public getIsDriverSitting(): boolean {
    return this.isDriverSitting;
  }

  // Carried Prop Anchor
  private heldLeafProp: THREE.Group | null = null;

  public setGesture(gesture: string): void {
    this.currentGesture = gesture;
    if (this.facialRig) {
      if (gesture === 'cheer') {
        this.facialRig.setExpression('excited');
      } else if (gesture === 'talk') {
        this.facialRig.setExpression('happy');
      } else if (gesture === 'carry') {
        this.facialRig.setExpression('happy');
      } else if (gesture === 'deposit') {
        this.facialRig.setExpression('determined');
      } else {
        this.facialRig.setExpression('neutral');
      }
    }
  }

  public setFacialExpression(expression: FacialExpressionType): void {
    if (this.facialRig) {
      this.facialRig.setExpression(expression);
    }
  }

  public attachHeldLeaf(leafColor: string = '#4ade80'): void {
    if (!this.rightArmLower) return;
    if (!this.heldLeafProp) {
      this.heldLeafProp = new THREE.Group();
      this.heldLeafProp.name = 'held_leaf_prop';

      // Cluster of 3 delicate sacred leaves
      for (let i = 0; i < 3; i++) {
        const leafMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 10, 10),
          new THREE.MeshStandardMaterial({
            color: leafColor,
            roughness: 0.38,
            metalness: 0.08,
          })
        );
        leafMesh.scale.set(1.4, 0.2, 1.8);
        leafMesh.rotation.set(0.28, i * 0.8, 0.18);
        leafMesh.position.set((i - 1) * 0.05, -0.42, 0.12);
        this.heldLeafProp.add(leafMesh);
      }
      this.rightArmLower.add(this.heldLeafProp);
    }
    this.heldLeafProp.visible = true;
  }

  public detachHeldLeaf(): void {
    if (this.heldLeafProp) {
      this.heldLeafProp.visible = false;
    }
  }

  // Carried Paper Bag Prop (Attached to Left Hand of Ramu)
  private carriedPaperBagProp: THREE.Group | null = null;
  private carriedBagLeavesGroup: THREE.Group | null = null;

  public attachPaperBag(): void {
    if (!this.leftArmLower) return;
    if (!this.carriedPaperBagProp) {
      this.carriedPaperBagProp = new THREE.Group();
      this.carriedPaperBagProp.name = 'ramu_carried_paper_bag';

      // Handcrafted Kraft Paper Bag Model
      const bagMat = new THREE.MeshStandardMaterial({
        color: '#d4a373',
        roughness: 0.82,
        metalness: 0.05,
      });
      const rimMat = new THREE.MeshStandardMaterial({
        color: '#b45309',
        roughness: 0.78,
      });
      const twineMat = new THREE.MeshStandardMaterial({
        color: '#78350f',
        roughness: 0.9,
      });

      // Bag Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.16), bagMat);
      body.position.set(0, -0.22, 0.04);
      body.castShadow = true;
      body.receiveShadow = true;
      this.carriedPaperBagProp.add(body);

      // Rolled Top Rim
      const rim = new THREE.Mesh(new THREE.BoxGeometry(0.252, 0.04, 0.172), rimMat);
      rim.position.set(0, -0.05, 0.04);
      this.carriedPaperBagProp.add(rim);

      // Saffron auspicious ribbon band around bag
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(0.244, 0.05, 0.164),
        new THREE.MeshBasicMaterial({ color: '#ea580c' })
      );
      band.position.set(0, -0.22, 0.04);
      this.carriedPaperBagProp.add(band);

      // Jute Twine Handle arched up to the hand
      const handleCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.06, -0.05, 0.04),
        new THREE.Vector3(-0.04, 0.05, 0.02),
        new THREE.Vector3(0.04, 0.05, 0.02),
        new THREE.Vector3(0.06, -0.05, 0.04),
      ]);
      const handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 12, 0.009, 6, false), twineMat);
      this.carriedPaperBagProp.add(handle);

      // Dynamic peeking sacred leaves inside bag
      this.carriedBagLeavesGroup = new THREE.Group();
      this.carriedBagLeavesGroup.position.set(0, -0.04, 0.04);
      const leafColors = ['#15803d', '#22c55e', '#4ade80', '#16a34a', '#84cc16', '#10b981'];
      for (let i = 0; i < 7; i++) {
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.038, 7, 7),
          new THREE.MeshStandardMaterial({ color: leafColors[i % leafColors.length], roughness: 0.38 })
        );
        leaf.scale.set(1.4, 0.28, 1.7);
        leaf.position.set((i - 3) * 0.032, 0.025 + (i % 2) * 0.015, (Math.random() - 0.5) * 0.06);
        leaf.rotation.set(0.25, i * 0.65, 0.15);
        this.carriedBagLeavesGroup.add(leaf);
      }
      this.carriedBagLeavesGroup.visible = false;
      this.carriedPaperBagProp.add(this.carriedBagLeavesGroup);

      // Position in left hand: forearm ends at y = -0.28, hand sits at y = -0.32
      this.carriedPaperBagProp.position.set(0, -0.32, 0.05);
      this.leftArmLower.add(this.carriedPaperBagProp);
    }
    this.carriedPaperBagProp.visible = true;
  }

  public updateCarriedBagFill(count: number): void {
    if (this.carriedBagLeavesGroup) {
      this.carriedBagLeavesGroup.visible = count > 0;
      const scale = Math.min(1.4, 0.55 + (count / 21) * 0.85);
      this.carriedBagLeavesGroup.scale.set(scale, scale, scale);
    }
  }

  public detachPaperBag(): void {
    if (this.carriedPaperBagProp) {
      this.carriedPaperBagProp.visible = false;
    }
  }

  public hasPaperBag(): boolean {
    return !!(this.carriedPaperBagProp && this.carriedPaperBagProp.visible);
  }

  /**
   * Updates the shirt color dynamically to match the active level's color palette
   */
  public setLevel(levelId: LevelId): void {
    this.currentLevel = levelId;
    this.updateShirtColors();
  }

  public updateShirtColors(): void {
    if (this.config.id === CharacterId.MUSHAK) return;
    const newHex = CharacterRegistry.getShirtHex(this.config.id, this.currentLevel);
    for (const mat of this.shirtMaterials) {
      mat.color.set(newHex);
      mat.needsUpdate = true;
    }
  }

  constructor(config: CharacterConfig, initialLevel: LevelId = LevelId.LEVEL_1) {
    this.config = config;
    this.currentLevel = initialLevel;
    this.group = new THREE.Group();
    this.group.name = `character_${config.id}`;

    if (config.id === CharacterId.MUSHAK) {
      this.buildMushakMesh();
    } else {
      this.buildTraditionalFestivalCharacterMesh(config.id);
    }

    // Apply scale multiplier
    if (config.scale && config.scale !== 1.0) {
      this.group.scale.setScalar(config.scale);
    }
  }

  // ===========================================================================
  // TRADITIONAL FESTIVAL HUMAN CHARACTER ARCHITECTURE
  // ===========================================================================
  private buildTraditionalFestivalCharacterMesh(id: CharacterId): void {
    // 1. Resolve Character Specifics (Skin tone, hair style, proportions, initial shirt color)
    const initialShirtHex = CharacterRegistry.getShirtHex(id, this.currentLevel);
    const skinTone = this.resolveSkinTone(id);

    // 2. Shared High-Quality Materials
    this.skinMaterial = new THREE.MeshStandardMaterial({
      color: skinTone,
      roughness: 0.62,
      metalness: 0.04,
    });

    // Solid plain shirt material (tracks current level color)
    const shirtMat = new THREE.MeshStandardMaterial({
      color: initialShirtHex,
      map: characterTextures.getSolidShirtTexture(initialShirtHex),
      roughness: 0.74,
      metalness: 0.02,
    });
    this.shirtMaterials.push(shirtMat);

    // Traditional Plain White Pattu Lungi (pure white silk fabric with natural sheen and folds)
    this.lungiMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: characterTextures.getWhitePattuLungiTexture(),
      roughness: 0.42,
      metalness: 0.08,
    });
    this.panchaMaterial = this.lungiMaterial;

    const lungiZariMat = new THREE.MeshStandardMaterial({
      color: '#d97706',
      roughness: 0.35,
      metalness: 0.8,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: this.resolveHairTone(id),
      roughness: 0.55,
      metalness: 0.10,
    });

    const brassButtonMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0', // Mother-of-pearl / subtle ivory shirt buttons
      roughness: 0.35,
      metalness: 0.2,
    });

    // -------------------------------------------------------------------------
    // A. PELVIS & WAIST (Anatomical hip height ~0.94m)
    // -------------------------------------------------------------------------
    this.pelvisGroup = new THREE.Group();
    this.pelvisGroup.position.y = 0.94;
    this.group.add(this.pelvisGroup);

    // Core pelvis structure wrapped in plain white pattu lungi
    const pelvisGeo = new THREE.CylinderGeometry(0.2, 0.18, 0.18, 20);
    pelvisGeo.scale(1.1, 1.0, 0.9);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, this.lungiMaterial);
    pelvisMesh.castShadow = true;
    this.pelvisGroup.add(pelvisMesh);

    // Traditional Plain White Pattu Lungi Waistband Tuck / Wrap (Madatha)
    const waistbandGeo = new THREE.TorusGeometry(0.205, 0.024, 10, 24);
    const waistband = new THREE.Mesh(waistbandGeo, this.lungiMaterial);
    waistband.rotation.x = Math.PI / 2;
    waistband.position.y = 0.07;
    this.pelvisGroup.add(waistband);

    // Traditional Front Lungi Wrap Overlap with soft silk folds
    const wrapOverlapGeo = new THREE.CylinderGeometry(0.21, 0.19, 0.28, 16, 1, true, -Math.PI * 0.3, Math.PI * 0.6);
    wrapOverlapGeo.scale(1.12, 1.0, 0.92);
    const wrapOverlap = new THREE.Mesh(wrapOverlapGeo, this.lungiMaterial);
    wrapOverlap.position.set(0, -0.04, 0.01);
    wrapOverlap.castShadow = true;
    this.pelvisGroup.add(wrapOverlap);

    // Front fold tuck detail
    const tuckGeo = new THREE.BoxGeometry(0.09, 0.18, 0.035);
    const tuckFold = new THREE.Mesh(tuckGeo, this.lungiMaterial);
    tuckFold.position.set(0.03, -0.03, 0.17);
    tuckFold.rotation.set(0.08, 0, -0.06);
    this.pelvisGroup.add(tuckFold);

    // -------------------------------------------------------------------------
    // B. TORSO & PLAIN SOLID HALF-SLEEVE SHIRT
    // -------------------------------------------------------------------------
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.y = 0.12;
    this.pelvisGroup.add(this.torsoGroup);

    // Tailored shirt torso body (no checks, no patterns, solid color)
    const torsoGeo = new THREE.CylinderGeometry(0.22, 0.19, 0.44, 20);
    torsoGeo.scale(1.15, 1.0, 0.88);
    const torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
    torsoMesh.position.y = 0.22;
    torsoMesh.castShadow = true;
    this.torsoGroup.add(torsoMesh);

    // Shirt lower hem draping cleanly over top of pancha
    const shirtHemGeo = new THREE.CylinderGeometry(0.225, 0.235, 0.08, 20, 1, true);
    shirtHemGeo.scale(1.14, 1.0, 0.9);
    const shirtHem = new THREE.Mesh(shirtHemGeo, shirtMat);
    shirtHem.position.y = 0.02;
    this.torsoGroup.add(shirtHem);

    // Traditional Folded Spread Shirt Collar
    const collarLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.13, 0.022), shirtMat);
    collarLeft.position.set(-0.09, 0.44, 0.145);
    collarLeft.rotation.set(0.32, 0.22, -0.18);
    this.torsoGroup.add(collarLeft);

    const collarRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.13, 0.022), shirtMat);
    collarRight.position.set(0.09, 0.44, 0.145);
    collarRight.rotation.set(0.32, -0.22, 0.18);
    this.torsoGroup.add(collarRight);

    // Clean Front Placket with subtle buttons down the center
    const placket = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.44, 0.015), shirtMat);
    placket.position.set(0, 0.22, 0.175);
    this.torsoGroup.add(placket);

    // 4 Subtle pearl/ivory buttons down the placket
    for (let i = 0; i < 4; i++) {
      const button = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.006, 10), brassButtonMat);
      button.rotation.x = Math.PI / 2;
      button.position.set(0, 0.38 - i * 0.1, 0.185);
      this.torsoGroup.add(button);
    }

    // -------------------------------------------------------------------------
    // C. CONTINUOUS ANATOMICAL NECK & HEAD RIG (Head → Neck → Shoulders → Torso)
    // -------------------------------------------------------------------------
    // Trapezius / Clavicle base collar transition to eliminate any gap
    const trapeziusGeo = new THREE.CylinderGeometry(0.096, 0.165, 0.08, 20);
    trapeziusGeo.scale(1.15, 1.0, 0.9);
    const trapezius = new THREE.Mesh(trapeziusGeo, shirtMat);
    trapezius.position.set(0, 0.42, 0.005);
    this.torsoGroup.add(trapezius);

    // Anatomical continuous neck bridging torso and skull base
    const neckGeo = new THREE.CylinderGeometry(0.078, 0.088, 0.18, 20);
    neckGeo.scale(0.96, 1.0, 1.04);
    const neckMesh = new THREE.Mesh(neckGeo, this.skinMaterial);
    neckMesh.position.set(0, 0.47, 0.01);
    neckMesh.rotation.x = 0.04; // natural forward cervical slope
    neckMesh.castShadow = true;
    this.torsoGroup.add(neckMesh);

    // Head Joint anchored directly atop the neck with anatomical pivot
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.52, 0.01);
    this.torsoGroup.add(this.headGroup);

    // Distinct Face & Coherent Head Sculpt for this specific character
    this.buildDistinctMaleHead(this.headGroup, id, this.skinMaterial, hairMat);

    // Small Traditional Forehead Tilak / Bottu flush on forehead skin
    this.buildForeheadTilak(this.headGroup, id);

    // -------------------------------------------------------------------------
    // D. SHOULDERS & ARMS (Plain half-sleeve shirt + natural bare arms & hands)
    // -------------------------------------------------------------------------
    this.buildHalfSleeveArms(this.torsoGroup, shirtMat, this.skinMaterial, id);

    // -------------------------------------------------------------------------
    // E. LEGS & FEET (Plain White Pattu Lungi + Completely Barefoot)
    // -------------------------------------------------------------------------
    this.buildTraditionalPattuLungiAndBareLegs(this.pelvisGroup, this.lungiMaterial, lungiZariMat, this.skinMaterial);
  }

  /**
   * Builds the upper and lower arms with solid half-sleeves ending above the elbow,
   * natural bare forearms, and articulated bare hands.
   */
  private buildHalfSleeveArms(
    torsoGroup: THREE.Group,
    shirtMat: THREE.Material,
    skinMat: THREE.Material,
    id: CharacterId
  ): void {
    const sleeveLength = 0.22;
    const bareBicepLength = 0.12;

    // ----- Left Arm -----
    this.leftArmUpper = new THREE.Group();
    this.leftArmUpper.position.set(-0.25, 0.4, 0);
    torsoGroup.add(this.leftArmUpper);

    // Shoulder cap / deltoid
    const leftDeltoid = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 10), shirtMat);
    leftDeltoid.position.set(0, -0.02, 0);
    this.leftArmUpper.add(leftDeltoid);

    // Half-sleeve (solid cotton, ends cleanly above elbow)
    const leftSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.078, sleeveLength, 16), shirtMat);
    leftSleeve.position.y = -sleeveLength / 2 - 0.02;
    leftSleeve.castShadow = true;
    this.leftArmUpper.add(leftSleeve);

    // Sleeve hem cuff
    const leftSleeveCuff = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.009, 8, 16), shirtMat);
    leftSleeveCuff.rotation.x = Math.PI / 2;
    leftSleeveCuff.position.y = -sleeveLength - 0.02;
    this.leftArmUpper.add(leftSleeveCuff);

    // Exposed natural lower bicep / elbow junction
    const leftBareBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.062, bareBicepLength, 14), skinMat);
    leftBareBicep.position.y = -sleeveLength - 0.02 - bareBicepLength / 2;
    this.leftArmUpper.add(leftBareBicep);

    // Left Forearm
    this.leftArmLower = new THREE.Group();
    this.leftArmLower.position.set(0, -0.34, 0);
    this.leftArmUpper.add(this.leftArmLower);

    const forearmGeo = new THREE.CylinderGeometry(0.062, 0.05, 0.28, 14);
    const leftForearm = new THREE.Mesh(forearmGeo, skinMat);
    leftForearm.position.y = -0.14;
    leftForearm.castShadow = true;
    this.leftArmLower.add(leftForearm);

    this.buildRealisticHand(this.leftArmLower, skinMat, -1);

    // ----- Right Arm -----
    this.rightArmUpper = new THREE.Group();
    this.rightArmUpper.position.set(0.25, 0.4, 0);
    torsoGroup.add(this.rightArmUpper);

    const rightDeltoid = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 10), shirtMat);
    rightDeltoid.position.set(0, -0.02, 0);
    this.rightArmUpper.add(rightDeltoid);

    const rightSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.078, sleeveLength, 16), shirtMat);
    rightSleeve.position.y = -sleeveLength / 2 - 0.02;
    rightSleeve.castShadow = true;
    this.rightArmUpper.add(rightSleeve);

    const rightSleeveCuff = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.009, 8, 16), shirtMat);
    rightSleeveCuff.rotation.x = Math.PI / 2;
    rightSleeveCuff.position.y = -sleeveLength - 0.02;
    this.rightArmUpper.add(rightSleeveCuff);

    const rightBareBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.062, bareBicepLength, 14), skinMat);
    rightBareBicep.position.y = -sleeveLength - 0.02 - bareBicepLength / 2;
    this.rightArmUpper.add(rightBareBicep);

    // Right Forearm
    this.rightArmLower = new THREE.Group();
    this.rightArmLower.position.set(0, -0.34, 0);
    this.rightArmUpper.add(this.rightArmLower);

    const rightForearm = new THREE.Mesh(forearmGeo, skinMat);
    rightForearm.position.y = -0.14;
    rightForearm.castShadow = true;
    this.rightArmLower.add(rightForearm);

    // Sacred Festival Mauli/Kalava thread on Ramu's right wrist
    if (id === CharacterId.RAMU) {
      const threadMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.5 });
      const sacredThread = new THREE.Mesh(new THREE.TorusGeometry(0.054, 0.007, 6, 16), threadMat);
      sacredThread.rotation.x = Math.PI / 2;
      sacredThread.position.y = -0.26;
      this.rightArmLower.add(sacredThread);
    }

    this.buildRealisticHand(this.rightArmLower, skinMat, 1);
  }

  /**
   * Builds the traditional Plain White Pattu Lungi legs and completely barefoot feet.
   * Pure white silk fabric with natural drape folds, wrapped around waist & legs,
   * extending past mid-calf with authentic golden pattu zari hem.
   * Absolutely NO shoes, sandals, slippers, socks, or sneakers.
   */
  private buildTraditionalPattuLungiAndBareLegs(
    pelvisGroup: THREE.Group,
    lungiMat: THREE.Material,
    lungiZariMat: THREE.Material,
    skinMat: THREE.Material
  ): void {
    const thighLength = 0.44;
    const calfLength = 0.46;

    // ---------------- LEFT LEG ----------------
    this.leftLegUpper = new THREE.Group();
    this.leftLegUpper.position.set(-0.13, 0, 0);
    pelvisGroup.add(this.leftLegUpper);

    // Thigh wrapped in Plain White Pattu Lungi silk cloth
    const thighLungiGeo = new THREE.CylinderGeometry(0.122, 0.108, thighLength, 20);
    const leftThighLungi = new THREE.Mesh(thighLungiGeo, lungiMat);
    leftThighLungi.position.y = -thighLength / 2;
    leftThighLungi.castShadow = true;
    this.leftLegUpper.add(leftThighLungi);

    // Outer silk cloth fold drape on thigh
    const leftThighFold = new THREE.Mesh(new THREE.BoxGeometry(0.045, thighLength * 0.85, 0.08), lungiMat);
    leftThighFold.position.set(-0.095, -thighLength / 2, 0.02);
    leftThighFold.rotation.z = -0.05;
    this.leftLegUpper.add(leftThighFold);

    // Left Lower Leg (Calf wrapped in Plain White Pattu Lungi, terminating past mid-calf)
    this.leftLegLower = new THREE.Group();
    this.leftLegLower.position.set(0, -thighLength, 0);
    this.leftLegUpper.add(this.leftLegLower);

    // Natural knee drape fold of the pattu lungi
    const leftKneeFold = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 8), lungiMat);
    leftKneeFold.scale.set(0.9, 1.25, 0.75);
    leftKneeFold.position.set(0, 0.01, 0.06);
    this.leftLegLower.add(leftKneeFold);

    // Lungi calf drape covering down past mid-calf
    const lungiCalfGeo = new THREE.CylinderGeometry(0.108, 0.092, calfLength * 0.78, 20);
    const leftLungiCalf = new THREE.Mesh(lungiCalfGeo, lungiMat);
    leftLungiCalf.position.y = -calfLength * 0.39;
    leftLungiCalf.castShadow = true;
    this.leftLegLower.add(leftLungiCalf);

    // Pattu Lungi lower silk hem roll
    const leftLungiHem = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.014, 8, 20), lungiMat);
    leftLungiHem.rotation.x = Math.PI / 2;
    leftLungiHem.position.y = -calfLength * 0.78;
    this.leftLegLower.add(leftLungiHem);

    // Traditional delicate golden pattu zari / kasavu border along bottom hem
    const leftZariHem = new THREE.Mesh(new THREE.TorusGeometry(0.093, 0.006, 6, 20), lungiZariMat);
    leftZariHem.rotation.x = Math.PI / 2;
    leftZariHem.position.y = -calfLength * 0.77;
    this.leftLegLower.add(leftZariHem);

    // Exposed natural bare lower shin & ankle bone (malleolus) before foot
    const leftBareAnkle = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.054, calfLength * 0.22, 16), skinMat);
    leftBareAnkle.position.y = -calfLength * 0.89;
    this.leftLegLower.add(leftBareAnkle);

    // LEFT BARE FOOT (Strictly no shoes, no sandals, no socks)
    this.leftFoot = new THREE.Group();
    this.leftFoot.position.set(0, -calfLength, 0.02);
    this.leftLegLower.add(this.leftFoot);
    this.buildNaturalBareFoot(this.leftFoot, -1, skinMat);

    // ---------------- RIGHT LEG ----------------
    this.rightLegUpper = new THREE.Group();
    this.rightLegUpper.position.set(0.13, 0, 0);
    pelvisGroup.add(this.rightLegUpper);

    const rightThighLungi = new THREE.Mesh(thighLungiGeo, lungiMat);
    rightThighLungi.position.y = -thighLength / 2;
    rightThighLungi.castShadow = true;
    this.rightLegUpper.add(rightThighLungi);

    const rightThighFold = new THREE.Mesh(new THREE.BoxGeometry(0.045, thighLength * 0.85, 0.08), lungiMat);
    rightThighFold.position.set(0.095, -thighLength / 2, 0.02);
    rightThighFold.rotation.z = 0.05;
    this.rightLegUpper.add(rightThighFold);

    // Right Lower Leg
    this.rightLegLower = new THREE.Group();
    this.rightLegLower.position.set(0, -thighLength, 0);
    this.rightLegUpper.add(this.rightLegLower);

    const rightKneeFold = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 8), lungiMat);
    rightKneeFold.scale.set(0.9, 1.25, 0.75);
    rightKneeFold.position.set(0, 0.01, 0.06);
    this.rightLegLower.add(rightKneeFold);

    const rightLungiCalf = new THREE.Mesh(lungiCalfGeo, lungiMat);
    rightLungiCalf.position.y = -calfLength * 0.39;
    rightLungiCalf.castShadow = true;
    this.rightLegLower.add(rightLungiCalf);

    const rightLungiHem = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.014, 8, 20), lungiMat);
    rightLungiHem.rotation.x = Math.PI / 2;
    rightLungiHem.position.y = -calfLength * 0.78;
    this.rightLegLower.add(rightLungiHem);

    const rightZariHem = new THREE.Mesh(new THREE.TorusGeometry(0.093, 0.006, 6, 20), lungiZariMat);
    rightZariHem.rotation.x = Math.PI / 2;
    rightZariHem.position.y = -calfLength * 0.77;
    this.rightLegLower.add(rightZariHem);

    const rightBareAnkle = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.054, calfLength * 0.22, 16), skinMat);
    rightBareAnkle.position.y = -calfLength * 0.89;
    this.rightLegLower.add(rightBareAnkle);

    // RIGHT BARE FOOT (Strictly no shoes, no sandals, no socks)
    this.rightFoot = new THREE.Group();
    this.rightFoot.position.set(0, -calfLength, 0.02);
    this.rightLegLower.add(this.rightFoot);
    this.buildNaturalBareFoot(this.rightFoot, 1, skinMat);
  }

  /**
   * Builds an anatomically realistic bare human foot with heel, medial arch,
   * plantar cushion ball, and 5 distinct articulated toes.
   * Completely barefoot — zero footwear.
   */
  private buildNaturalBareFoot(footGroup: THREE.Group, side: number, skinMat: THREE.Material): void {
    const footRoot = new THREE.Group();
    footRoot.position.set(0, 0, 0);

    // 1. Ankle Malleolus Bones (Medial and Lateral bumps)
    const lateralAnkle = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), skinMat);
    lateralAnkle.position.set(side * 0.052, 0.02, -0.01);
    footRoot.add(lateralAnkle);

    const medialAnkle = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), skinMat);
    medialAnkle.position.set(-side * 0.048, 0.028, 0.01);
    footRoot.add(medialAnkle);

    // 2. Sculpted Calcaneus Heel Pad (Soft rounded heel)
    const heelGeo = new THREE.SphereGeometry(0.046, 12, 10);
    heelGeo.scale(0.85, 0.8, 1.1);
    const heel = new THREE.Mesh(heelGeo, skinMat);
    heel.position.set(0, -0.012, -0.055);
    heel.castShadow = true;
    footRoot.add(heel);

    // 3. Medial Longitudinal Arch & Midfoot Instep
    const instepGeo = new THREE.BoxGeometry(0.082, 0.046, 0.12);
    const instep = new THREE.Mesh(instepGeo, skinMat);
    instep.position.set(0, 0.002, 0.02);
    instep.rotation.x = -0.08;
    footRoot.add(instep);

    // 4. Plantar Metatarsal Ball (Forefoot cushion)
    const ballGeo = new THREE.BoxGeometry(0.096, 0.038, 0.07);
    const ball = new THREE.Mesh(ballGeo, skinMat);
    ball.position.set(0, -0.014, 0.09);
    footRoot.add(ball);

    // 5. Five Articulated Bare Toes with subtle nails
    // Toes from Big Toe (medial) to Pinky Toe (lateral)
    const toeData = [
      { name: 'bigToe', medOffset: -0.032, length: 0.044, width: 0.024, height: 0.022, z: 0.14 },
      { name: 'indexToe', medOffset: -0.012, length: 0.046, width: 0.019, height: 0.02, z: 0.142 },
      { name: 'middleToe', medOffset: 0.007, length: 0.042, width: 0.018, height: 0.019, z: 0.138 },
      { name: 'fourthToe', medOffset: 0.024, length: 0.036, width: 0.017, height: 0.018, z: 0.132 },
      { name: 'pinkyToe', medOffset: 0.04, length: 0.03, width: 0.016, height: 0.017, z: 0.125 },
    ];

    const nailMat = new THREE.MeshStandardMaterial({
      color: '#fce7f3',
      roughness: 0.28,
      metalness: 0.1,
    });

    toeData.forEach(t => {
      // Invert medial offset for left foot vs right foot
      const xPos = side * t.medOffset;
      const toeGeo = new THREE.CapsuleGeometry(t.width / 2, t.length * 0.6, 6, 8);
      toeGeo.scale(1.0, 1.0, t.height / t.width);
      const toeMesh = new THREE.Mesh(toeGeo, skinMat);
      toeMesh.rotation.x = Math.PI / 2;
      toeMesh.position.set(xPos, -0.015, t.z);
      toeMesh.castShadow = true;
      footRoot.add(toeMesh);

      // Delicate toe nail plate highlight
      const nailGeo = new THREE.BoxGeometry(t.width * 0.65, 0.004, 0.012);
      const nail = new THREE.Mesh(nailGeo, nailMat);
      nail.position.set(xPos, -0.005, t.z + t.length * 0.22);
      footRoot.add(nail);
    });

    footGroup.add(footRoot);
  }

  /**
   * Builds a simple smooth round human head for each of the 5 Indian male characters.
   * All facial features (two eyes, two eyebrows, one simple nose, one simple smiling mouth,
   * two ears, small forehead tilak, simple short hair) are physically attached to the head
   * and move 100% together with it. No floating parts.
   */
  private getHeadScales(id: CharacterId): { scaleX: number; scaleY: number; scaleZ: number } {
    if (id === CharacterId.RAMU) {
      // Ramu: Athletic, balanced proportions
      return { scaleX: 0.98, scaleY: 1.04, scaleZ: 1.00 };
    } else if (id === CharacterId.COMPANION_1) {
      // Chintu: Youthful, friendly round face
      return { scaleX: 1.02, scaleY: 1.01, scaleZ: 1.01 };
    } else if (id === CharacterId.COMPANION_2) {
      // Bhavani: Slightly leaner, agile face
      return { scaleX: 0.95, scaleY: 1.06, scaleZ: 0.98 };
    } else if (id === CharacterId.COMPANION_3) {
      // Varun: Calm, slightly broader build
      return { scaleX: 1.03, scaleY: 1.05, scaleZ: 1.02 };
    } else {
      // Dinesh: Gentle oval face
      return { scaleX: 0.97, scaleY: 1.03, scaleZ: 0.99 };
    }
  }

  /**
   * Builds the character head with anatomical features: cranium, ears, eyes, eyebrows,
   * nose, smiling mouth, hairstyle, and facial animation rig.
   */
  private buildDistinctMaleHead(
    headGroup: THREE.Group,
    id: CharacterId,
    skinMat: THREE.Material,
    hairMat: THREE.Material
  ): void {
    const { scaleX, scaleY, scaleZ } = this.getHeadScales(id);

    // 1. Simple Smooth Round Human Head
    const headGeo = new THREE.SphereGeometry(0.155, 32, 26);
    headGeo.scale(scaleX, scaleY, scaleZ);
    const cranium = new THREE.Mesh(headGeo, skinMat);
    cranium.position.set(0, 0.13, 0);
    cranium.castShadow = true;
    headGroup.add(cranium);

    // 2. Neck Connection Socket (bridges top of neck cylinder into base of head with zero gap)
    const neckSocketGeo = new THREE.CylinderGeometry(0.076, 0.082, 0.08, 20);
    neckSocketGeo.scale(scaleX, 1.0, scaleZ);
    const neckSocket = new THREE.Mesh(neckSocketGeo, skinMat);
    neckSocket.position.set(0, 0.01, 0);
    headGroup.add(neckSocket);

    // 3. Two Ears (anchored flush to the left and right sides of the round head)
    [-0.155 * scaleX, 0.155 * scaleX].forEach(x => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), skinMat);
      ear.scale.set(0.28 * scaleX, 1.2 * scaleY, 0.75 * scaleZ);
      ear.position.set(x, 0.13, 0);
      headGroup.add(ear);
    });

    // 4. Two Eyes (physically placed on the front curve of the round head)
    const eyeSpacing = 0.048 * scaleX;
    const eyeY = 0.13 + 0.012 * scaleY;
    const eyeZ = 0.1495 * scaleZ;

    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-eyeSpacing, eyeY, eyeZ);
    leftEyeGroup.rotation.set(-0.077, -0.22, 0);
    leftEyeGroup.renderOrder = 3;
    headGroup.add(leftEyeGroup);

    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(eyeSpacing, eyeY, eyeZ);
    rightEyeGroup.rotation.set(-0.077, 0.22, 0);
    rightEyeGroup.renderOrder = 3;
    headGroup.add(rightEyeGroup);

    const leftLidGroup = new THREE.Group();
    leftLidGroup.visible = false;
    leftEyeGroup.add(leftLidGroup);
    const rightLidGroup = new THREE.Group();
    rightLidGroup.visible = false;
    rightEyeGroup.add(rightLidGroup);

    const eyeScleraMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.15,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -3.0,
    });
    const irisMat = new THREE.MeshStandardMaterial({
      color: '#2b1710',
      roughness: 0.25,
      polygonOffset: true,
      polygonOffsetFactor: -2.5,
      polygonOffsetUnits: -4.0,
    });
    const pupilMat = new THREE.MeshBasicMaterial({
      color: '#090503',
      polygonOffset: true,
      polygonOffsetFactor: -3.0,
      polygonOffsetUnits: -5.0,
    });
    const catchlightMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      polygonOffset: true,
      polygonOffsetFactor: -3.5,
      polygonOffsetUnits: -6.0,
    });

    [leftEyeGroup, rightEyeGroup].forEach((eyeGrp, idx) => {
      // White sclera disc flush on head
      const sclera = new THREE.Mesh(new THREE.CircleGeometry(0.0175, 16), eyeScleraMat);
      sclera.position.z = 0.0010;
      eyeGrp.add(sclera);

      // Warm dark brown iris
      const iris = new THREE.Mesh(new THREE.CircleGeometry(0.011, 16), irisMat);
      iris.position.z = 0.0020;
      eyeGrp.add(iris);

      // Black pupil
      const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.0055, 14), pupilMat);
      pupil.position.z = 0.0030;
      eyeGrp.add(pupil);

      // Catchlight reflection dot
      const catchlight = new THREE.Mesh(new THREE.CircleGeometry(0.0025, 8), catchlightMat);
      catchlight.position.set(0.003, 0.003, 0.0038);
      eyeGrp.add(catchlight);

      // Upper eyelid for blinks (skin tone)
      const upperLid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0185, 0.0185, 0.003, 16, 1, false, 0, Math.PI),
        skinMat
      );
      upperLid.rotation.x = Math.PI / 2;
      upperLid.rotation.z = Math.PI;
      upperLid.position.set(0, 0.018, 0.0042);
      (idx === 0 ? leftLidGroup : rightLidGroup).add(upperLid);
    });

    // 5. Two Eyebrows (flush on forehead curve above eyes)
    const browSpacing = 0.046 * scaleX;
    const browY = 0.13 + 0.038 * scaleY;
    const browZ = 0.1478 * scaleZ;
    const browMat = new THREE.MeshStandardMaterial({
      color: '#17110e',
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -3.0,
    });

    const leftBrowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.036 * scaleX, 0.006 * scaleY, 0.003 * scaleZ),
      browMat
    );
    leftBrowMesh.position.set(-browSpacing, browY, browZ);
    leftBrowMesh.rotation.set(-0.248, -0.302, 0.08);
    leftBrowMesh.renderOrder = 3;
    headGroup.add(leftBrowMesh);

    const rightBrowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.036 * scaleX, 0.006 * scaleY, 0.003 * scaleZ),
      browMat
    );
    rightBrowMesh.position.set(browSpacing, browY, browZ);
    rightBrowMesh.rotation.set(-0.248, 0.302, -0.08);
    rightBrowMesh.renderOrder = 3;
    headGroup.add(rightBrowMesh);

    // 6. One Simple Nose (part of the head, emerging naturally with no floating pieces)
    const noseGeo = new THREE.ConeGeometry(0.012 * scaleX, 0.028 * scaleY, 12);
    noseGeo.rotateX(Math.PI / 2 - 0.15);
    const noseMesh = new THREE.Mesh(noseGeo, skinMat);
    noseMesh.position.set(0, 0.13 - 0.012 * scaleY, 0.1495 * scaleZ);
    headGroup.add(noseMesh);

    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.010, 10, 8), skinMat);
    noseTip.scale.set(scaleX, scaleY, scaleZ);
    noseTip.position.set(0, 0.13 - 0.018 * scaleY, 0.1635 * scaleZ);
    headGroup.add(noseTip);

    // 7. One Simple Smiling Mouth (cheerful upward smile curve flush on lower face)
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, 0.13 - 0.046 * scaleY, 0.1505 * scaleZ);
    mouthGroup.rotation.x = 0.26;
    mouthGroup.renderOrder = 3;
    headGroup.add(mouthGroup);

    const lipMat = new THREE.MeshStandardMaterial({
      color: '#b8594b', // warm natural terracotta rose
      roughness: 0.45,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -3.0,
    });

    const smileCurveGeo = new THREE.TorusGeometry(0.022 * scaleX, 0.0042 * scaleY, 8, 18, Math.PI * 0.72);
    smileCurveGeo.rotateZ(-Math.PI * 0.86);
    const smileMesh = new THREE.Mesh(smileCurveGeo, lipMat);
    smileMesh.position.z = 0.002;
    mouthGroup.add(smileMesh);

    // Upturned smile corners for friendly festive look
    [-0.019 * scaleX, 0.019 * scaleX].forEach(cx => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0042 * scaleY, 6, 6), lipMat);
      dot.position.set(cx, 0.004 * scaleY, 0.002);
      mouthGroup.add(dot);
    });

    // 8. Simple Short Hair (fitted snugly to skull dome, scaled strictly to character head dimensions)
    this.buildCharacterHairstyle(headGroup, id, hairMat, scaleX, scaleY, scaleZ);

    // 9. Attach CharacterFacialRig (eyelid blinks only, eyes stay 100% attached to head)
    const elements: FacialRigElements = {
      leftEye: leftEyeGroup,
      rightEye: rightEyeGroup,
      leftUpperLid: leftLidGroup,
      rightUpperLid: rightLidGroup,
      leftBrow: leftBrowMesh,
      rightBrow: rightBrowMesh,
      mouthGroup: mouthGroup,
    };
    this.facialRig = new CharacterFacialRig(elements);
  }

  /**
   * Small simple traditional tilak / bottu flush on the forehead between eyebrows.
   * Completely attached to the head geometry.
   */
  private buildForeheadTilak(headGroup: THREE.Group, id: CharacterId): void {
    const { scaleY, scaleZ } = this.getHeadScales(id);
    const tilakGroup = new THREE.Group();
    // Flush on forehead between eyebrows (dy = 0.046 above center, z = 0.1505)
    tilakGroup.position.set(0, 0.13 + 0.046 * scaleY, 0.1505 * scaleZ);
    tilakGroup.rotation.x = -0.301;
    tilakGroup.renderOrder = 3;

    const redKumkumMat = new THREE.MeshStandardMaterial({
      color: '#dc2626',
      roughness: 0.45,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -3.0,
    });

    const chandanGoldMat = new THREE.MeshStandardMaterial({
      color: '#fef08a',
      roughness: 0.5,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -2.2,
      polygonOffsetUnits: -3.5,
    });

    if (id === CharacterId.RAMU) {
      // Ramu: Small round vermilion bottu with tiny golden chandan dot
      const outerBottu = new THREE.Mesh(new THREE.CircleGeometry(0.0085, 16), redKumkumMat);
      outerBottu.position.z = 0.0010;
      tilakGroup.add(outerBottu);

      const innerChandan = new THREE.Mesh(new THREE.CircleGeometry(0.0035, 12), chandanGoldMat);
      innerChandan.position.z = 0.0018;
      tilakGroup.add(innerChandan);
    } else if (id === CharacterId.COMPANION_1) {
      // Chintu: Small bright round vermilion bottu
      const bottu = new THREE.Mesh(new THREE.CircleGeometry(0.008, 16), redKumkumMat);
      bottu.position.z = 0.0010;
      tilakGroup.add(bottu);
    } else if (id === CharacterId.COMPANION_2) {
      // Bhavani: Small vertical chandan stroke with red dot
      const stroke = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.018, 0.001), chandanGoldMat);
      stroke.position.z = 0.0010;
      tilakGroup.add(stroke);

      const redDot = new THREE.Mesh(new THREE.CircleGeometry(0.003, 10), redKumkumMat);
      redDot.position.set(0, -0.0015, 0.0018);
      tilakGroup.add(redDot);
    } else if (id === CharacterId.COMPANION_3) {
      // Varun: Small tripundra chandan line with red dot
      for (let i = -1; i <= 1; i++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.0025, 0.001), chandanGoldMat);
        line.position.set(0, i * 0.004, 0.0010);
        tilakGroup.add(line);
      }
      const redCenter = new THREE.Mesh(new THREE.CircleGeometry(0.0035, 10), redKumkumMat);
      redCenter.position.set(0, 0, 0.0018);
      tilakGroup.add(redCenter);
    } else {
      // Dinesh: Small festive teardrop vermilion bottu
      const dropBase = new THREE.Mesh(new THREE.CircleGeometry(0.0075, 14), redKumkumMat);
      dropBase.position.z = 0.0010;
      tilakGroup.add(dropBase);

      const dropTip = new THREE.Mesh(new THREE.ConeGeometry(0.0055, 0.012, 10), redKumkumMat);
      dropTip.rotation.x = Math.PI / 2;
      dropTip.position.set(0, 0.008, 0.0010);
      tilakGroup.add(dropTip);
    }

    headGroup.add(tilakGroup);
  }

  /**
   * Anatomically fitted short hair for each character.
   * Completely solves Z-fighting, mesh intersection, and flickering across all viewing angles,
   * camera distances, and mobile/tablet low-precision depth buffers while keeping the
   * face, forehead, tilak, eyebrows, eyes, and smile 100% visible and unoccluded.
   */
  private buildCharacterHairstyle(
    headGroup: THREE.Group,
    id: CharacterId,
    hairMat: THREE.Material,
    scaleX: number = 1.0,
    scaleY: number = 1.0,
    scaleZ: number = 1.0
  ): void {
    const hairRoot = new THREE.Group();
    hairRoot.position.set(0, 0.13, 0);

    const hairRadius = 0.1595;

    // 1. Top Crown Cap (covers skull apex down to natural front hairline, Y >= 0.188 in headGroup)
    const topCapGeo = new THREE.SphereGeometry(
      hairRadius,
      32,
      16,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.38
    );
    topCapGeo.scale(scaleX, scaleY, scaleZ);
    const topCap = new THREE.Mesh(topCapGeo, hairMat);
    hairRoot.add(topCap);

    // 2. Posterior Back & Nape Hemisphere (covers posterior from ears around back down to neck socket, strictly Z <= 0 so face is 100% free)
    const backHairGeo = new THREE.SphereGeometry(
      hairRadius,
      32,
      18,
      Math.PI,
      Math.PI,
      Math.PI * 0.18,
      Math.PI * 0.52
    );
    backHairGeo.scale(scaleX, scaleY, scaleZ);
    const backHair = new THREE.Mesh(backHairGeo, hairMat);
    hairRoot.add(backHair);

    if (id === CharacterId.RAMU) {
      // Ramu: Clean short hair with side-parted front fringe resting neatly along front hairline
      const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.050, 12, 10), hairMat);
      fringe.scale.set(1.30 * scaleX, 0.48 * scaleY, 0.80 * scaleZ);
      fringe.position.set(0.025 * scaleX, 0.075 * scaleY, 0.136 * scaleZ);
      fringe.rotation.set(-0.20, -0.15, -0.18);
      hairRoot.add(fringe);

      // Sideburns neatly framing the temples in front of ears
      [-0.152 * scaleX, 0.152 * scaleX].forEach(x => {
        const sideburn = new THREE.Mesh(
          new THREE.BoxGeometry(0.016 * scaleX, 0.052 * scaleY, 0.026 * scaleZ),
          hairMat
        );
        sideburn.position.set(x, -0.005 * scaleY, 0.020 * scaleZ);
        hairRoot.add(sideburn);
      });
    } else if (id === CharacterId.COMPANION_1) {
      // Chintu: Clean short crop haircut with textured top volume
      const cropTop = new THREE.Mesh(new THREE.SphereGeometry(0.090, 14, 12), hairMat);
      cropTop.scale.set(1.15 * scaleX, 0.52 * scaleY, 1.10 * scaleZ);
      cropTop.position.set(0, 0.092 * scaleY, -0.008 * scaleZ);
      hairRoot.add(cropTop);

      [-0.152 * scaleX, 0.152 * scaleX].forEach(x => {
        const sideburn = new THREE.Mesh(
          new THREE.BoxGeometry(0.016 * scaleX, 0.048 * scaleY, 0.024 * scaleZ),
          hairMat
        );
        sideburn.position.set(x, 0.002 * scaleY, 0.020 * scaleZ);
        hairRoot.add(sideburn);
      });
    } else if (id === CharacterId.COMPANION_2) {
      // Bhavani: Clean side-swept short style
      const sweep = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), hairMat);
      sweep.scale.set(1.32 * scaleX, 0.48 * scaleY, 0.82 * scaleZ);
      sweep.position.set(0.032 * scaleX, 0.075 * scaleY, 0.134 * scaleZ);
      sweep.rotation.set(-0.18, -0.24, -0.28);
      hairRoot.add(sweep);

      [-0.152 * scaleX, 0.152 * scaleX].forEach(x => {
        const sideburn = new THREE.Mesh(
          new THREE.BoxGeometry(0.016 * scaleX, 0.050 * scaleY, 0.024 * scaleZ),
          hairMat
        );
        sideburn.position.set(x, 0.002 * scaleY, 0.020 * scaleZ);
        hairRoot.add(sideburn);
      });
    } else if (id === CharacterId.COMPANION_3) {
      // Varun: Classic gentleman's combed short hair
      const comb = new THREE.Mesh(
        new THREE.CylinderGeometry(0.144 * scaleX, 0.160 * scaleX, 0.068 * scaleY, 24),
        hairMat
      );
      comb.scale.set(1.01, 0.95, 1.03 * (scaleZ / scaleX));
      comb.rotation.set(-0.16, 0.08, 0.04);
      comb.position.set(0, 0.086 * scaleY, -0.010 * scaleZ);
      hairRoot.add(comb);

      [-0.154 * scaleX, 0.154 * scaleX].forEach(x => {
        const sideburn = new THREE.Mesh(
          new THREE.BoxGeometry(0.018 * scaleX, 0.055 * scaleY, 0.026 * scaleZ),
          hairMat
        );
        sideburn.position.set(x, -0.005 * scaleY, 0.020 * scaleZ);
        hairRoot.add(sideburn);
      });
    } else {
      // Dinesh: Soft wavy short hair cap
      for (let i = 0; i < 7; i++) {
        const angle = (i / 6) * Math.PI * 0.80 - Math.PI * 0.40;
        const wave = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), hairMat);
        wave.scale.set(1.12 * scaleX, 0.70 * scaleY, 1.02 * scaleZ);
        wave.position.set(
          Math.sin(angle) * 0.134 * scaleX,
          0.082 * scaleY,
          Math.cos(angle) * 0.134 * scaleZ + 0.005 * scaleZ
        );
        hairRoot.add(wave);
      }

      [-0.152 * scaleX, 0.152 * scaleX].forEach(x => {
        const sideburn = new THREE.Mesh(
          new THREE.BoxGeometry(0.016 * scaleX, 0.048 * scaleY, 0.024 * scaleZ),
          hairMat
        );
        sideburn.position.set(x, 0.002 * scaleY, 0.020 * scaleZ);
        hairRoot.add(sideburn);
      });
    }

    hairRoot.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = false;
      }
    });

    headGroup.add(hairRoot);
  }

  /**
   * Anatomical hand with palm arch, thenar mound, and 5 articulated fingers
   */
  private buildRealisticHand(armLower: THREE.Group, skinMat: THREE.Material, side: number): void {
    const handRoot = new THREE.Group();
    handRoot.position.set(0, -0.3, 0);

    // Anatomical Palm
    const palmGeo = new THREE.BoxGeometry(0.068, 0.072, 0.028);
    const palm = new THREE.Mesh(palmGeo, skinMat);
    palm.position.set(0, -0.036, 0);
    handRoot.add(palm);

    // Thenar eminence (thumb base)
    const thenar = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), skinMat);
    thenar.scale.set(0.9, 1.2, 0.8);
    thenar.position.set(side * -0.028, -0.028, 0.012);
    handRoot.add(thenar);

    // Opposable Thumb
    const thumbRoot = new THREE.Group();
    thumbRoot.position.set(side * -0.034, -0.025, 0.012);
    thumbRoot.rotation.z = side * -0.42;
    thumbRoot.rotation.y = side * 0.38;

    const thumbProx = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.01, 0.032, 8), skinMat);
    thumbProx.position.y = -0.016;
    thumbRoot.add(thumbProx);

    const thumbDist = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.008, 0.026, 8), skinMat);
    thumbDist.position.y = -0.038;
    thumbRoot.add(thumbDist);
    handRoot.add(thumbRoot);

    // 4 Articulated Fingers (Index, Middle, Ring, Pinky)
    const fingers = [
      { x: side * -0.024, len: 0.062, rad: 0.009 },
      { x: side * -0.008, len: 0.068, rad: 0.0095 },
      { x: side * 0.008, len: 0.064, rad: 0.009 },
      { x: side * 0.024, len: 0.052, rad: 0.008 },
    ];

    fingers.forEach(f => {
      const finger = new THREE.Mesh(new THREE.CylinderGeometry(f.rad * 0.85, f.rad, f.len, 8), skinMat);
      finger.position.set(f.x, -0.072 - f.len / 2, 0.002);
      handRoot.add(finger);
    });

    armLower.add(handRoot);
  }

  // ===========================================================================
  // MUSHAK GUIDE MESH ARCHITECTURE
  // ===========================================================================
  private buildMushakMesh(): void {
    const greyMat = new THREE.MeshStandardMaterial({
      color: '#78716c',
      roughness: 0.55,
      metalness: 0.08,
    });
    const whiteMat = new THREE.MeshStandardMaterial({
      color: '#f5f5f4',
      roughness: 0.65,
    });
    const pinkMat = new THREE.MeshStandardMaterial({
      color: '#fbcfe8',
      roughness: 0.45,
    });
    const redMat = new THREE.MeshStandardMaterial({
      color: '#dc2626',
      roughness: 0.35,
    });
    const bellMat = new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      roughness: 0.25,
      metalness: 0.75,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#18181b' });

    // Root Group
    this.pelvisGroup = new THREE.Group();
    this.pelvisGroup.position.y = 0.32;
    this.group.add(this.pelvisGroup);

    // Chubby Pear-shaped Mouse Body
    const bodyGeo = new THREE.SphereGeometry(0.24, 16, 16);
    bodyGeo.scale(0.9, 1.15, 0.95);
    const bodyMesh = new THREE.Mesh(bodyGeo, greyMat);
    bodyMesh.castShadow = true;
    this.pelvisGroup.add(bodyMesh);

    // Cream Belly Patch
    const bellyGeo = new THREE.SphereGeometry(0.18, 14, 14);
    bellyGeo.scale(0.85, 1.05, 0.4);
    const bellyMesh = new THREE.Mesh(bellyGeo, whiteMat);
    bellyMesh.position.set(0, -0.02, 0.16);
    this.pelvisGroup.add(bellyMesh);

    // Sacred Red Collar & Golden Bell
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 20), redMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.18;
    this.pelvisGroup.add(collar);

    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), bellMat);
    bell.position.set(0, 0.14, 0.18);
    this.pelvisGroup.add(bell);

    // Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.28, 0.08);
    this.pelvisGroup.add(this.headGroup);

    const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
    headGeo.scale(0.95, 0.95, 1.15);
    const headMesh = new THREE.Mesh(headGeo, greyMat);
    this.headGroup.add(headMesh);

    // Snout & Pink Nose
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 12), greyMat);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -0.02, 0.22);
    this.headGroup.add(snout);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), pinkMat);
    nose.position.set(0, -0.02, 0.31);
    this.headGroup.add(nose);

    // Cartoon Expressive Eyes
    [-0.075, 0.075].forEach(x => {
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 12), whiteMat);
      eyeWhite.scale.set(0.7, 1.1, 0.8);
      eyeWhite.position.set(x, 0.06, 0.14);
      this.headGroup!.add(eyeWhite);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 10), eyeMat);
      pupil.position.set(x, 0.065, 0.175);
      this.headGroup!.add(pupil);
    });

    // Big Rounded Mouse Ears
    [-0.15, 0.15].forEach(x => {
      const earOuter = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), greyMat);
      earOuter.scale.set(0.9, 1.0, 0.25);
      earOuter.position.set(x, 0.18, 0);
      earOuter.rotation.y = x > 0 ? 0.25 : -0.25;
      this.headGroup!.add(earOuter);

      const earInner = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), pinkMat);
      earInner.scale.set(0.9, 1.0, 0.2);
      earInner.position.set(x, 0.18, 0.025);
      earInner.rotation.y = x > 0 ? 0.25 : -0.25;
      this.headGroup!.add(earInner);
    });

    // Paws & Legs
    this.leftArmUpper = new THREE.Group();
    this.leftArmUpper.position.set(-0.16, 0.08, 0.1);
    this.pelvisGroup.add(this.leftArmUpper);
    const pawL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), pinkMat);
    pawL.scale.set(0.8, 0.6, 1.3);
    this.leftArmUpper.add(pawL);

    this.rightArmUpper = new THREE.Group();
    this.rightArmUpper.position.set(0.16, 0.08, 0.1);
    this.pelvisGroup.add(this.rightArmUpper);
    const pawR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), pinkMat);
    pawR.scale.set(0.8, 0.6, 1.3);
    this.rightArmUpper.add(pawR);

    this.leftLegUpper = new THREE.Group();
    this.leftLegUpper.position.set(-0.14, -0.22, 0.04);
    this.pelvisGroup.add(this.leftLegUpper);
    const footL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), pinkMat);
    footL.scale.set(0.85, 0.5, 1.5);
    this.leftLegUpper.add(footL);

    this.rightLegUpper = new THREE.Group();
    this.rightLegUpper.position.set(0.14, -0.22, 0.04);
    this.pelvisGroup.add(this.rightLegUpper);
    const footR = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), pinkMat);
    footR.scale.set(0.85, 0.5, 1.5);
    this.rightLegUpper.add(footR);

    // Curled Tail
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, -0.12, -0.22);
    this.pelvisGroup.add(this.tailGroup);

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.08, -0.15),
      new THREE.Vector3(0.08, 0.22, -0.25),
      new THREE.Vector3(0, 0.32, -0.2),
    ]);
    const tailMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.02, 8, false), pinkMat);
    this.tailGroup.add(tailMesh);
  }

  // ===========================================================================
  // CHARACTER ATTRIBUTE RESOLVERS
  // ===========================================================================
  private resolveSkinTone(id: CharacterId): string {
    switch (id) {
      case CharacterId.RAMU:
        return '#cb8756'; // Warm South-Asian golden brown
      case CharacterId.COMPANION_1:
        return '#b87333'; // Dusky copper tone (Chintu)
      case CharacterId.COMPANION_2:
        return '#d89c68'; // Golden wheatish Indian tone (Bhavani)
      case CharacterId.COMPANION_3:
        return '#9e5e32'; // Deep bronze South Asian tone (Varun)
      case CharacterId.COMPANION_4:
        return '#be7c47'; // Warm caramel bronze tone (Dinesh)
      default:
        return '#cb8756';
    }
  }

  private resolveHairTone(id: CharacterId): string {
    switch (id) {
      case CharacterId.RAMU:
        return '#15110f';
      case CharacterId.COMPANION_1:
        return '#1b1411';
      case CharacterId.COMPANION_2:
        return '#211713';
      case CharacterId.COMPANION_3:
        return '#120f0e';
      case CharacterId.COMPANION_4:
        return '#181210';
      default:
        return '#15110f';
    }
  }

  // ===========================================================================
  // LOCOMOTION, POSTURE & GESTURE ANIMATION
  // ===========================================================================
  public updateAnimation(
    arg1: boolean | number,
    arg2: number,
    arg3?: boolean | number
  ): void {
    if (this.facialRig) {
      this.facialRig.update(typeof arg1 === 'number' ? arg1 : arg2);
    }

    let isMoving: boolean;
    let delta: number;
    let currentSpeedRatio: number;

    if (typeof arg1 === 'boolean') {
      // Called as: updateAnimation(isMoving, delta, speedRatio?)
      isMoving = arg1;
      delta = arg2;
      currentSpeedRatio = typeof arg3 === 'number' ? arg3 : (isMoving ? 1.0 : 0.0);
    } else {
      // Called as: updateAnimation(delta, speedRatio, isMoving?)
      delta = arg1;
      if (typeof arg3 === 'boolean') {
        currentSpeedRatio = arg2;
        isMoving = arg3;
      } else {
        currentSpeedRatio = arg2;
        isMoving = typeof arg3 === 'number' ? arg3 > 0.05 : currentSpeedRatio > 0.05;
      }
    }

    const targetSpeedRatio = isMoving ? Math.max(0.2, currentSpeedRatio) : 0;
    this.currentSpeedRatio = THREE.MathUtils.lerp(
      this.currentSpeedRatio,
      targetSpeedRatio,
      12 * delta
    );

    const isRunning = this.currentSpeedRatio > 0.65;

    // Cabin Seating Scale: Smoothly scale to 0.76 inside the car cabin for natural proportions and head clearance
    // Outside the vehicle: Smoothly restores back to character's full base scale (1.0)
    const targetScale = this.isSitting ? this.config.scale * 0.76 : this.config.scale;
    const currentScale = this.group.scale.x;
    if (Math.abs(currentScale - targetScale) > 0.001) {
      const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, Math.min(1.0, 10 * delta));
      this.group.scale.set(nextScale, nextScale, nextScale);
    }

    if (this.isSitting) {
      // Natural Seated Posture inside vehicle cabin
      const nowMs = performance.now();
      const breath = Math.sin(nowMs * 0.0024) * 0.006;

      // Pelvis settles directly onto the vehicle seat cushion surface
      if (this.pelvisGroup) {
        this.pelvisGroup.position.y = THREE.MathUtils.lerp(this.pelvisGroup.position.y, 0.04, 12 * delta);
        this.pelvisGroup.rotation.set(0, 0, 0);
      }

      if (this.leftLegUpper && this.rightLegUpper && this.leftLegLower && this.rightLegLower) {
        // Thighs extend forward horizontally across the seat cushion
        this.leftLegUpper.rotation.x = THREE.MathUtils.lerp(this.leftLegUpper.rotation.x, -Math.PI / 2 + 0.08, 10 * delta);
        this.rightLegUpper.rotation.x = THREE.MathUtils.lerp(this.rightLegUpper.rotation.x, -Math.PI / 2 + 0.08, 10 * delta);
        // Calves bend downward 90 degrees into the footwell
        this.leftLegLower.rotation.x = THREE.MathUtils.lerp(this.leftLegLower.rotation.x, Math.PI / 2 - 0.12, 10 * delta);
        this.rightLegLower.rotation.x = THREE.MathUtils.lerp(this.rightLegLower.rotation.x, Math.PI / 2 - 0.12, 10 * delta);
      }

      if (this.leftFoot && this.rightFoot) {
        // Feet rest naturally in the footwell
        this.leftFoot.rotation.x = THREE.MathUtils.lerp(this.leftFoot.rotation.x, 0.04, 10 * delta);
        this.rightFoot.rotation.x = THREE.MathUtils.lerp(this.rightFoot.rotation.x, 0.04, 10 * delta);
      }

      if (this.torsoGroup) {
        this.torsoGroup.position.y = 0.12 + breath;
        // Driver has attentive posture; passenger leans back comfortably against backrest
        const targetTorsoRotX = this.isDriverSitting ? -0.04 : -0.08;
        this.torsoGroup.rotation.x = THREE.MathUtils.lerp(this.torsoGroup.rotation.x, targetTorsoRotX, 8 * delta);
        this.torsoGroup.rotation.y = THREE.MathUtils.lerp(this.torsoGroup.rotation.y, 0, 8 * delta);
      }

      if (this.leftArmUpper && this.rightArmUpper && this.leftArmLower && this.rightArmLower) {
        if (this.isDriverSitting) {
          // Driver: Hands gripping the steering wheel naturally
          this.leftArmUpper.rotation.x = THREE.MathUtils.lerp(this.leftArmUpper.rotation.x, -0.65, 10 * delta);
          this.leftArmUpper.rotation.y = THREE.MathUtils.lerp(this.leftArmUpper.rotation.y, 0.14, 10 * delta);
          this.leftArmUpper.rotation.z = THREE.MathUtils.lerp(this.leftArmUpper.rotation.z, -0.12, 10 * delta);
          this.leftArmLower.rotation.x = THREE.MathUtils.lerp(this.leftArmLower.rotation.x, -0.58, 10 * delta);

          this.rightArmUpper.rotation.x = THREE.MathUtils.lerp(this.rightArmUpper.rotation.x, -0.65, 10 * delta);
          this.rightArmUpper.rotation.y = THREE.MathUtils.lerp(this.rightArmUpper.rotation.y, -0.14, 10 * delta);
          this.rightArmUpper.rotation.z = THREE.MathUtils.lerp(this.rightArmUpper.rotation.z, 0.12, 10 * delta);
          this.rightArmLower.rotation.x = THREE.MathUtils.lerp(this.rightArmLower.rotation.x, -0.58, 10 * delta);
        } else {
          // Passenger: Hands resting comfortably on lap / thighs
          this.leftArmUpper.rotation.x = THREE.MathUtils.lerp(this.leftArmUpper.rotation.x, -0.35, 8 * delta);
          this.leftArmUpper.rotation.y = THREE.MathUtils.lerp(this.leftArmUpper.rotation.y, 0.05, 8 * delta);
          this.leftArmUpper.rotation.z = THREE.MathUtils.lerp(this.leftArmUpper.rotation.z, -0.08, 8 * delta);
          this.leftArmLower.rotation.x = THREE.MathUtils.lerp(this.leftArmLower.rotation.x, -0.45, 8 * delta);

          this.rightArmUpper.rotation.x = THREE.MathUtils.lerp(this.rightArmUpper.rotation.x, -0.35, 8 * delta);
          this.rightArmUpper.rotation.y = THREE.MathUtils.lerp(this.rightArmUpper.rotation.y, -0.05, 8 * delta);
          this.rightArmUpper.rotation.z = THREE.MathUtils.lerp(this.rightArmUpper.rotation.z, 0.08, 8 * delta);
          this.rightArmLower.rotation.x = THREE.MathUtils.lerp(this.rightArmLower.rotation.x, -0.45, 8 * delta);
        }
      }

      if (this.headGroup) {
        const headSway = Math.sin(nowMs * 0.0016) * 0.03;
        this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, headSway, 6 * delta);
        this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, 0.02, 6 * delta);
      }
      return;
    }

    if (this.currentSpeedRatio > 0.05) {
      // Dynamic Running / Walking Locomotion
      const cycleFrequency = 6.8 + this.currentSpeedRatio * 6.2;
      this.walkCycleTime += delta * cycleFrequency;

      const phase = this.walkCycleTime;
      const legSwingAmp = 0.44 + this.currentSpeedRatio * 0.46;
      const armSwingAmp = 0.36 + this.currentSpeedRatio * 0.44;

      // Natural vertical bounce (pelvis rises and drops twice per stride cycle)
      const pelvisBounce = Math.abs(Math.sin(phase)) * (0.032 + this.currentSpeedRatio * 0.06);
      const forwardLean = isRunning ? 0.16 + (this.currentSpeedRatio - 0.65) * 0.14 : 0.04;
      const hipSway = Math.sin(phase) * (0.045 + this.currentSpeedRatio * 0.055);

      if (this.pelvisGroup) {
        this.pelvisGroup.position.y = 0.94 + pelvisBounce;
        this.pelvisGroup.rotation.y = hipSway * 0.45;
      }

      if (this.torsoGroup) {
        this.torsoGroup.rotation.x = forwardLean;
        this.torsoGroup.rotation.y = -hipSway * 0.75;
      }

      if (this.headGroup) {
        this.headGroup.rotation.x = -forwardLean * 0.62;
        this.headGroup.rotation.y = hipSway * 0.28;
      }

      // Articulated Leg Animation with Natural Barefoot Roll
      const sinLegL = Math.sin(phase);
      const sinLegR = -sinLegL;

      if (this.leftLegUpper && this.leftLegLower) {
        this.leftLegUpper.rotation.x = sinLegL * legSwingAmp;
        const kneeFlex = sinLegL < 0 ? Math.abs(sinLegL) * (0.65 + this.currentSpeedRatio * 0.7) : 0.05;
        this.leftLegLower.rotation.x = kneeFlex;

        if (this.leftFoot) {
          // Heel strike on reach, natural bare toe push-off
          this.leftFoot.rotation.x = -sinLegL * 0.25;
        }
      }

      if (this.rightLegUpper && this.rightLegLower) {
        this.rightLegUpper.rotation.x = sinLegR * legSwingAmp;
        const kneeFlex = sinLegR < 0 ? Math.abs(sinLegR) * (0.65 + this.currentSpeedRatio * 0.7) : 0.05;
        this.rightLegLower.rotation.x = kneeFlex;

        if (this.rightFoot) {
          this.rightFoot.rotation.x = -sinLegR * 0.25;
        }
      }

      // Natural Arm Drive & Swing
      if (this.leftArmUpper && this.leftArmLower) {
        this.leftArmUpper.rotation.x = -sinLegL * armSwingAmp;
        this.leftArmUpper.rotation.z = -0.1 - this.currentSpeedRatio * 0.1;
        const elbowBend = -sinLegL > 0 ? 0.3 + (-sinLegL) * 0.6 : 0.15;
        this.leftArmLower.rotation.x = -elbowBend;
      }

      if (this.rightArmUpper && this.rightArmLower) {
        if (this.currentGesture === 'carry') {
          this.rightArmUpper.rotation.x = -1.1;
          this.rightArmUpper.rotation.z = 0.2;
          this.rightArmLower.rotation.x = -0.8;
        } else {
          this.rightArmUpper.rotation.x = -sinLegR * armSwingAmp;
          this.rightArmUpper.rotation.z = 0.1 + this.currentSpeedRatio * 0.1;
          const elbowBend = -sinLegR > 0 ? 0.3 + (-sinLegR) * 0.6 : 0.15;
          this.rightArmLower.rotation.x = -elbowBend;
        }
      }

      if (this.tailGroup) {
        this.tailGroup.rotation.y = Math.sin(phase * 1.5) * 0.4;
      }
    } else {
      // Idle State: Breathing, Subtle Sways, and Gestures
      const nowMs = performance.now();
      const breath = Math.sin(nowMs * 0.0024) * 0.01;
      const shoulderBreath = Math.sin(nowMs * 0.0024) * 0.012;

      if (this.pelvisGroup) {
        this.pelvisGroup.position.y = THREE.MathUtils.lerp(this.pelvisGroup.position.y, 0.94, 8 * delta);
        this.pelvisGroup.rotation.set(0, 0, 0);
      }

      if (this.leftLegUpper && this.rightLegUpper && this.leftLegLower && this.rightLegLower) {
        this.leftLegUpper.rotation.x = THREE.MathUtils.lerp(this.leftLegUpper.rotation.x, 0, 10 * delta);
        this.rightLegUpper.rotation.x = THREE.MathUtils.lerp(this.rightLegUpper.rotation.x, 0, 10 * delta);
        this.leftLegLower.rotation.x = THREE.MathUtils.lerp(this.leftLegLower.rotation.x, 0, 10 * delta);
        this.rightLegLower.rotation.x = THREE.MathUtils.lerp(this.rightLegLower.rotation.x, 0, 10 * delta);
      }

      if (this.leftFoot && this.rightFoot) {
        this.leftFoot.rotation.x = THREE.MathUtils.lerp(this.leftFoot.rotation.x, 0, 10 * delta);
        this.rightFoot.rotation.x = THREE.MathUtils.lerp(this.rightFoot.rotation.x, 0, 10 * delta);
      }

      if (this.torsoGroup) {
        this.torsoGroup.position.y = 0.12 + breath;
        this.torsoGroup.rotation.x = THREE.MathUtils.lerp(this.torsoGroup.rotation.x, 0, 8 * delta);
        this.torsoGroup.rotation.y = THREE.MathUtils.lerp(this.torsoGroup.rotation.y, 0, 8 * delta);
      }

      let targetLeftArmX = 0;
      let targetLeftArmZ = -0.06;
      let targetLeftLowerX = -0.1;
      let targetRightArmX = 0;
      let targetRightArmZ = 0.06;
      let targetRightLowerX = -0.1;
      let targetHeadX = 0;
      let targetHeadY = 0;

      if (this.currentGesture === 'cheer') {
        const cheerWiggle = Math.sin(nowMs * 0.008) * 0.12;
        targetLeftArmX = -2.35 + cheerWiggle;
        targetLeftArmZ = -0.4;
        targetLeftLowerX = -0.4;
        targetRightArmX = -2.35 - cheerWiggle;
        targetRightArmZ = 0.4;
        targetRightLowerX = -0.4;
        targetHeadX = -0.15;
      } else if (this.currentGesture === 'talk') {
        const speech = Math.sin(nowMs * 0.007);
        targetRightArmX = -1.1 + speech * 0.22;
        targetRightArmZ = 0.32 + speech * 0.08;
        targetRightLowerX = -0.7;
        targetLeftArmX = -0.15;
        targetLeftArmZ = -0.12;
        targetHeadX = speech * 0.06;
      } else if (this.currentGesture === 'explain') {
        const sway = Math.sin(nowMs * 0.004) * 0.12;
        targetLeftArmX = -0.85 + sway;
        targetLeftArmZ = -0.5;
        targetLeftLowerX = -0.6;
        targetRightArmX = -0.85 - sway;
        targetRightArmZ = 0.5;
        targetRightLowerX = -0.6;
      } else if (this.currentGesture === 'carry') {
        targetRightArmX = -1.2;
        targetRightArmZ = 0.18;
        targetRightLowerX = -0.9;
        targetLeftArmX = -0.15;
      } else if (this.currentGesture === 'deposit') {
        targetRightArmX = -1.35;
        targetRightArmZ = 0.05;
        targetRightLowerX = -0.6;
        targetHeadX = 0.28;
      } else if (this.currentGesture === 'wave') {
        targetRightArmX = -2.1;
        targetRightArmZ = 0.3 + Math.sin(nowMs * 0.01) * 0.35;
        targetRightLowerX = -0.5;
      } else if (this.currentGesture === 'nod') {
        targetHeadX = Math.sin(nowMs * 0.01) * 0.15;
      }

      if (this.leftArmUpper && this.leftArmLower) {
        this.leftArmUpper.rotation.x = THREE.MathUtils.lerp(this.leftArmUpper.rotation.x, targetLeftArmX, 10 * delta);
        this.leftArmUpper.rotation.z = THREE.MathUtils.lerp(this.leftArmUpper.rotation.z, targetLeftArmZ + shoulderBreath, 10 * delta);
        this.leftArmLower.rotation.x = THREE.MathUtils.lerp(this.leftArmLower.rotation.x, targetLeftLowerX, 10 * delta);
      }

      if (this.rightArmUpper && this.rightArmLower) {
        this.rightArmUpper.rotation.x = THREE.MathUtils.lerp(this.rightArmUpper.rotation.x, targetRightArmX, 10 * delta);
        this.rightArmUpper.rotation.z = THREE.MathUtils.lerp(this.rightArmUpper.rotation.z, targetRightArmZ - shoulderBreath, 10 * delta);
        this.rightArmLower.rotation.x = THREE.MathUtils.lerp(this.rightArmLower.rotation.x, targetRightLowerX, 10 * delta);
      }

      if (this.headGroup) {
        this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, targetHeadX, 8 * delta);
        this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, targetHeadY, 8 * delta);
      }

      if (this.tailGroup) {
        this.tailGroup.rotation.y = Math.sin(nowMs * 0.003) * 0.2;
      }
    }
  }

  public dispose(): void {
    this.group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
