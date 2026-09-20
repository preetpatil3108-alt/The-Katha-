/**
 * THE KATHA - Living Village NPC System
 *
 * Populates Rangastalam with believable, wandering male and female villagers:
 * - Rich visual diversity: Traditional South Indian Sarees with gold borders & jasmine flowers,
 *   Dhotis, Kurtas, Angavastram shoulder towels, Turbans, and Elders with walking sticks
 * - Believable navigation: Wanders between sensible waypoints on roads, lanes, and square
 * - Curved spline navigation: Avoids rigid robotic straight lines
 * - Dynamic behaviors: Natural limb walking cycles, stopping, looking around, Namaste greetings
 * - Flocking & separation steering: Avoids walking through each other and through Ramu
 */

import * as THREE from 'three';
import { adaptiveGraphics } from '../../core/graphics/AdaptiveGraphicsManager';

export interface WaypointNode {
  id: number;
  pos: THREE.Vector3;
  connections: number[];
  name?: string;
}

export type NPCBehaviorState = 'WALK' | 'IDLE_LOOK' | 'IDLE_GREET' | 'IDLE_CONVERSE';

export interface VillagerNPC {
  id: string;
  name: string;
  gender: 'female' | 'male';
  isElder?: boolean;
  group: THREE.Group;
  head: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationY: number;
  targetWaypoint: number;
  previousWaypoint: number;
  curveControlPoint: THREE.Vector3;
  curveProgress: number;
  walkSpeed: number;
  walkPhase: number;
  state: NPCBehaviorState;
  stateTimer: number;
  partnerNpc?: VillagerNPC;
}

export class VillageNPCSystem {
  public group: THREE.Group = new THREE.Group();
  private villagers: VillagerNPC[] = [];
  private waypoints: WaypointNode[] = [];

  // Materials Palette
  private matSkinTone = new THREE.MeshStandardMaterial({ color: '#c68642', roughness: 0.8 });
  private matSkinToneElder = new THREE.MeshStandardMaterial({ color: '#b57434', roughness: 0.85 });
  private matHairDark = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.9 });
  private matHairGrey = new THREE.MeshStandardMaterial({ color: '#e7e5e4', roughness: 0.9 });
  private matJasmine = new THREE.MeshStandardMaterial({ color: '#fef08a', roughness: 0.6 });
  private matBindiRed = new THREE.MeshBasicMaterial({ color: '#dc2626' });
  private matGoldBorder = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.35, metalness: 0.65 });
  private matTeakWood = new THREE.MeshStandardMaterial({ color: '#573318', roughness: 0.7 });

  // Female Saree Color Palettes
  private sareePalettes = [
    { body: '#991b1b', border: '#facc15', blouse: '#7f1d1d' }, // Deep Crimson & Gold
    { body: '#065f46', border: '#fbbf24', blouse: '#047857' }, // Emerald Temple Green & Gold
    { body: '#d97706', border: '#1e40af', blouse: '#b45309' }, // Turmeric Yellow & Royal Blue
    { body: '#1e3a8a', border: '#f59e0b', blouse: '#1d4ed8' }, // Peacock Blue & Saffron
    { body: '#831843', border: '#fbbf24', blouse: '#9d174d' }, // Magenta Plum & Gold
    { body: '#c2410c', border: '#fde047', blouse: '#9a3412' }, // Festive Orange Ochre & Gold
  ];

  // Male Clothing Palettes
  private malePalettes = [
    { kurta: '#fffbeb', dhoti: '#fef3c7', border: '#b91c1c' }, // Khadi White & Cream with Red Border
    { kurta: '#ea580c', dhoti: '#fffbeb', border: '#ca8a04' }, // Festive Saffron & White
    { kurta: '#0284c7', dhoti: '#fffbeb', border: '#0369a1' }, // Sky Blue & White
    { kurta: '#4d7c0f', dhoti: '#fef3c7', border: '#15803d' }, // Earth Green & Beige
    { kurta: '#78716c', dhoti: '#fffbeb', border: '#ca8a04' }, // Golden Brown & White
    { kurta: '#b91c1c', dhoti: '#fffbeb', border: '#facc15' }, // Crimson Maroon & White
  ];

  // Reusable scratch vectors to avoid garbage collection overhead in update loops
  private static readonly scratchSeparation = new THREE.Vector3();
  private static readonly scratchPush = new THREE.Vector3();
  private static readonly scratchNextPos = new THREE.Vector3();
  private static readonly scratchMoveDir = new THREE.Vector3();
  private frameCount = 0;

  constructor() {
    this.group.name = 'village_living_npcs';
    this.setupWaypoints();
  }

  /**
   * Defines the walkable pedestrian navigation graph throughout Rangastalam.
   * Guaranteed safe walkable road paths away from house colliders.
   */
  private setupWaypoints(): void {
    this.waypoints = [
      // South Entrance Avenue
      { id: 0, pos: new THREE.Vector3(0, 0, 19), connections: [1, 2, 3] },
      { id: 1, pos: new THREE.Vector3(-4.5, 0, 15), connections: [0, 4, 6] },
      { id: 2, pos: new THREE.Vector3(4.5, 0, 15), connections: [0, 5, 7] },
      { id: 3, pos: new THREE.Vector3(0, 0, 12), connections: [0, 1, 2, 6, 7] },

      // Central Square Perimeters (Leaving central mandapam open)
      { id: 4, pos: new THREE.Vector3(-8.5, 0, 11), connections: [1, 6, 8] },
      { id: 5, pos: new THREE.Vector3(8.5, 0, 11), connections: [2, 7, 9] },
      { id: 6, pos: new THREE.Vector3(-6.5, 0, 4.5), connections: [1, 3, 4, 8, 10] }, // Near sweet stall
      { id: 7, pos: new THREE.Vector3(6.5, 0, 4.5), connections: [2, 3, 5, 9, 11] },  // Near flower stall
      { id: 8, pos: new THREE.Vector3(-8.0, 0, -3.0), connections: [4, 6, 12, 14] },  // West residential lane
      { id: 9, pos: new THREE.Vector3(8.0, 0, -3.0), connections: [5, 7, 13, 15] },   // East artisan lane

      // North Central Road
      { id: 10, pos: new THREE.Vector3(-4.0, 0, -7.0), connections: [6, 12, 16] },
      { id: 11, pos: new THREE.Vector3(4.0, 0, -7.0), connections: [7, 13, 16] },

      // West Courtyard & Banyan Tree Katte
      { id: 12, pos: new THREE.Vector3(-12.0, 0, -6.0), connections: [8, 10, 14, 18] },
      { id: 14, pos: new THREE.Vector3(-15.0, 0, 3.0), connections: [8, 12] },
      { id: 18, pos: new THREE.Vector3(-14.0, 0, -14.0), connections: [12] }, // Near Banyan tree seat

      // East Artisan Alleys
      { id: 13, pos: new THREE.Vector3(12.0, 0, -6.0), connections: [9, 11, 15, 17] },
      { id: 15, pos: new THREE.Vector3(15.0, 0, 3.0), connections: [9, 13] },
      { id: 17, pos: new THREE.Vector3(14.0, 0, -14.0), connections: [13, 19] },

      // North Road leading toward the Sacred Forest Gate
      { id: 16, pos: new THREE.Vector3(0, 0, -14.0), connections: [10, 11, 19, 20] },
      { id: 19, pos: new THREE.Vector3(7.0, 0, -18.0), connections: [16, 17, 21] },
      { id: 20, pos: new THREE.Vector3(-4.0, 0, -19.0), connections: [16, 18] },
      { id: 21, pos: new THREE.Vector3(14.0, 0, -24.0), connections: [19] }, // Approaching forest gate
    ];
  }

  /**
   * Spawns a balanced population of male, female, and elder villagers
   */
  public spawnVillagers(): void {
    const villagerRoster: Array<{
      name: string;
      gender: 'female' | 'male';
      isElder?: boolean;
      startWp: number;
    }> = [
      { name: 'Anasuya Amma', gender: 'female', isElder: true, startWp: 1 },
      { name: 'Radha', gender: 'female', startWp: 6 },
      { name: 'Sita', gender: 'female', startWp: 7 },
      { name: 'Padma', gender: 'female', startWp: 4 },
      { name: 'Kalyani', gender: 'female', startWp: 11 },
      { name: 'Gowri', gender: 'female', startWp: 13 },
      { name: 'Venkatesh', gender: 'male', startWp: 3 },
      { name: 'Narayana Thatha', gender: 'male', isElder: true, startWp: 12 },
      { name: 'Ravi', gender: 'male', startWp: 5 },
      { name: 'Srinivas', gender: 'male', startWp: 9 },
      { name: 'Mahesh', gender: 'male', startWp: 10 },
      { name: 'Krishna', gender: 'male', startWp: 16 },
      { name: 'Bhanu', gender: 'female', startWp: 15 },
      { name: 'Sujatha', gender: 'female', startWp: 8 },
    ];

    villagerRoster.forEach((spec, idx) => {
      const npc = this.createVillager(spec.name, spec.gender, spec.isElder || false, spec.startWp, idx);
      this.villagers.push(npc);
      this.group.add(npc.group);
    });
  }

  /**
   * Constructs an individual high-quality stylized 3D villager mesh
   */
  private createVillager(
    name: string,
    gender: 'female' | 'male',
    isElder: boolean,
    startWpIndex: number,
    idx: number
  ): VillagerNPC {
    const group = new THREE.Group();
    group.name = `npc_villager_${name.replace(' ', '_')}`;

    const startWp = this.waypoints[startWpIndex];
    // Add small random initial offset so they don't spawn stacked
    const initPos = startWp.pos.clone().add(
      new THREE.Vector3((Math.random() - 0.5) * 1.2, 0, (Math.random() - 0.5) * 1.2)
    );
    group.position.copy(initPos);

    const skinMat = isElder ? this.matSkinToneElder : this.matSkinTone;

    // Head
    const headGeo = new THREE.SphereGeometry(0.24, 12, 12);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = isElder ? 1.62 : 1.68;
    head.castShadow = true;
    group.add(head);

    // Hair & Facial Features
    if (gender === 'female') {
      // Long braided dark hair
      const hairGeo = new THREE.SphereGeometry(0.25, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const hair = new THREE.Mesh(hairGeo, isElder ? this.matHairGrey : this.matHairDark);
      hair.position.y = 1.7;
      group.add(hair);

      // Long Braid down the back
      const braid = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.7, 8), isElder ? this.matHairGrey : this.matHairDark);
      braid.position.set(0, 1.35, -0.2);
      braid.rotation.x = 0.15;
      group.add(braid);

      // Fragrant White Jasmine Flower Garland (Gajamala) tied in hair
      const jasmineRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 6, 12), this.matJasmine);
      jasmineRing.rotation.x = Math.PI / 2 + 0.3;
      jasmineRing.position.set(0, 1.65, -0.12);
      group.add(jasmineRing);

      // Auspicious Red Kumkum Bindi on forehead
      const bindi = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), this.matBindiRed);
      bindi.position.set(0, 1.7, 0.235);
      group.add(bindi);
    } else {
      // Male Hair / Turban
      if (idx % 2 === 0 || isElder) {
        // Festive Headwrap / Turban
        const turbanMat = new THREE.MeshStandardMaterial({
          color: isElder ? '#fffbeb' : '#ea580c',
          roughness: 0.8,
        });
        const turban = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.25, 0.24, 10), turbanMat);
        turban.position.y = isElder ? 1.72 : 1.78;
        group.add(turban);
      } else {
        // Groomed dark hair
        const hair = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
          this.matHairDark
        );
        hair.position.y = 1.7;
        group.add(hair);
      }

      // Traditional Mustache for adult males
      const mustacheMat = isElder ? this.matHairGrey : this.matHairDark;
      const stache = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.04), mustacheMat);
      stache.position.set(0, isElder ? 1.56 : 1.62, 0.23);
      group.add(stache);
    }

    // Torso / Clothing
    let torsoMesh: THREE.Mesh;
    if (gender === 'female') {
      const palette = this.sareePalettes[idx % this.sareePalettes.length];
      const sareeMat = new THREE.MeshStandardMaterial({ color: palette.body, roughness: 0.75 });
      const blouseMat = new THREE.MeshStandardMaterial({ color: palette.blouse, roughness: 0.7 });

      // Blouse & Upper Drape
      torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.55, 10), blouseMat);
      torsoMesh.position.y = 1.25;
      torsoMesh.castShadow = true;
      group.add(torsoMesh);

      // Diagonal Saree Pallu sash with gold border
      const pallu = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.28), sareeMat);
      pallu.position.set(-0.08, 1.25, 0);
      pallu.rotation.z = 0.35;
      group.add(pallu);

      const goldBorder = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.62, 0.3), this.matGoldBorder);
      goldBorder.position.set(-0.16, 1.25, 0);
      goldBorder.rotation.z = 0.35;
      group.add(goldBorder);
    } else {
      const palette = this.malePalettes[idx % this.malePalettes.length];
      const kurtaMat = new THREE.MeshStandardMaterial({ color: palette.kurta, roughness: 0.8 });

      torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.6, 10), kurtaMat);
      torsoMesh.position.y = 1.25;
      torsoMesh.castShadow = true;
      group.add(torsoMesh);

      // Angavastram towel over left shoulder
      if (idx % 2 === 1 || isElder) {
        const angavastramMat = new THREE.MeshStandardMaterial({
          color: palette.border,
          roughness: 0.7,
        });
        const towel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.68, 0.28), angavastramMat);
        towel.position.set(-0.16, 1.25, 0);
        group.add(towel);
      }
    }

    // Arms (Grouped with shoulder pivot for natural swinging)
    const armMat = gender === 'female' ? this.matSkinTone : torsoMesh.material;

    // Left Arm
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.28, 1.45, 0);
    const lArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.55, 8), armMat);
    lArmMesh.position.y = -0.27;
    leftArm.add(lArmMesh);
    group.add(leftArm);

    // Right Arm
    const rightArm = new THREE.Group();
    rightArm.position.set(0.28, 1.45, 0);
    const rArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.55, 8), armMat);
    rArmMesh.position.y = -0.27;
    rightArm.add(rArmMesh);

    // Elder's bamboo walking stick
    if (isElder && gender === 'male') {
      const lathi = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.4, 6), this.matTeakWood);
      lathi.position.set(0.1, -0.35, 0.15);
      rightArm.add(lathi);
    }
    group.add(rightArm);

    // Legs / Lower Clothing (Dhoti / Saree pleats)
    let lowerClothMat: THREE.Material;
    if (gender === 'female') {
      const palette = this.sareePalettes[idx % this.sareePalettes.length];
      lowerClothMat = new THREE.MeshStandardMaterial({ color: palette.body, roughness: 0.8 });
    } else {
      const palette = this.malePalettes[idx % this.malePalettes.length];
      lowerClothMat = new THREE.MeshStandardMaterial({ color: palette.dhoti, roughness: 0.85 });
    }

    // Left Leg
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.12, 0.95, 0);
    const lLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.9, 8), lowerClothMat);
    lLegMesh.position.y = -0.45;
    leftLeg.add(lLegMesh);
    group.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.12, 0.95, 0);
    const rLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.9, 8), lowerClothMat);
    rLegMesh.position.y = -0.45;
    rightLeg.add(rLegMesh);
    group.add(rightLeg);

    // Pick first target waypoint from connections
    const targetWp = startWp.connections[Math.floor(Math.random() * startWp.connections.length)];
    const targetPos = this.waypoints[targetWp].pos;

    // Calculate initial curved control point
    const mid = initPos.clone().lerp(targetPos, 0.5);
    const perp = new THREE.Vector3(-(targetPos.z - initPos.z), 0, targetPos.x - initPos.x).normalize();
    const curveOffset = (Math.random() - 0.5) * 1.8;
    const curveControl = mid.add(perp.multiplyScalar(curveOffset));

    return {
      id: `villager_${idx}`,
      name,
      gender,
      isElder,
      group,
      head,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      position: initPos,
      velocity: new THREE.Vector3(),
      rotationY: Math.random() * Math.PI * 2,
      targetWaypoint: targetWp,
      previousWaypoint: startWpIndex,
      curveControlPoint: curveControl,
      curveProgress: 0,
      walkSpeed: isElder ? 0.95 : 1.25 + (idx % 3) * 0.15,
      walkPhase: Math.random() * Math.PI * 2,
      state: 'WALK',
      stateTimer: 0,
    };
  }

  /**
   * Main Living-World AI Update Loop
   * Optimized with adaptive distance-based throttling and zero-allocation scratch math
   */
  public update(delta: number, ramuPosition: THREE.Vector3): void {
    this.frameCount++;
    const config = adaptiveGraphics.getConfig();
    const count = this.villagers.length;
    const distantThresholdSq = config.npcDistantThresholdSq;
    const updateRateDistant = config.npcUpdateRateDistant;

    for (let i = 0; i < count; i++) {
      const npc = this.villagers[i];

      // Distance squared check against Ramu
      const dx = npc.position.x - ramuPosition.x;
      const dz = npc.position.z - ramuPosition.z;
      const distSqToRamu = dx * dx + dz * dz;
      const isDistant = distSqToRamu > distantThresholdSq;

      // Amortized update throttling for distant NPCs on Balanced/Performance tiers
      if (isDistant && updateRateDistant > 1) {
        if ((this.frameCount + i) % updateRateDistant !== 0) {
          // Skip update this frame - distant NPC maintains position and pose seamlessly
          continue;
        }
      }

      // 1. Separation Steering: Avoid walking through other villagers and Ramu
      // Distant NPCs don't need expensive N-to-N crowd avoidance
      const separation = VillageNPCSystem.scratchSeparation.set(0, 0, 0);

      if (!isDistant) {
        const minDistance = 1.35;
        for (let j = 0; j < count; j++) {
          if (i === j) continue;
          const other = this.villagers[j];
          const odx = npc.position.x - other.position.x;
          const odz = npc.position.z - other.position.z;
          const distSq = odx * odx + odz * odz;
          if (distSq < minDistance * minDistance && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const factor = ((minDistance - dist) * 2.0) / dist;
            separation.x += odx * factor;
            separation.z += odz * factor;
          }
        }

        // Avoid Ramu as well
        if (distSqToRamu < 2.56) {
          const dist = Math.sqrt(distSqToRamu);
          const factor = ((1.6 - dist) * 3.0) / Math.max(0.001, dist);
          separation.x += dx * factor;
          separation.z += dz * factor;
        }
      }

      // 2. Behavior State Machine
      const effectiveDelta = isDistant && updateRateDistant > 1 ? delta * updateRateDistant : delta;

      switch (npc.state) {
        case 'WALK': {
          this.updateWalkingState(npc, effectiveDelta, separation);
          break;
        }

        case 'IDLE_LOOK': {
          npc.stateTimer -= effectiveDelta;
          // Smooth head looking around
          npc.head.rotation.y = Math.sin(npc.walkPhase * 1.5) * 0.45;
          this.resetLimbRotations(npc, effectiveDelta);

          if (npc.stateTimer <= 0) {
            npc.head.rotation.y = 0;
            this.chooseNextWaypoint(npc);
            npc.state = 'WALK';
          }
          break;
        }

        case 'IDLE_GREET': {
          npc.stateTimer -= effectiveDelta;
          // Namaste hands folded gesture
          npc.leftArm.rotation.x = THREE.MathUtils.lerp(npc.leftArm.rotation.x, -0.9, effectiveDelta * 5);
          npc.leftArm.rotation.z = THREE.MathUtils.lerp(npc.leftArm.rotation.z, 0.45, effectiveDelta * 5);
          npc.rightArm.rotation.x = THREE.MathUtils.lerp(npc.rightArm.rotation.x, -0.9, effectiveDelta * 5);
          npc.rightArm.rotation.z = THREE.MathUtils.lerp(npc.rightArm.rotation.z, -0.45, effectiveDelta * 5);
          this.resetLegRotations(npc, effectiveDelta);

          if (npc.stateTimer <= 0) {
            this.chooseNextWaypoint(npc);
            npc.state = 'WALK';
          }
          break;
        }

        case 'IDLE_CONVERSE': {
          npc.stateTimer -= effectiveDelta;
          // Conversational head nods and subtle arm gestures
          npc.head.rotation.x = Math.sin(npc.walkPhase * 3) * 0.12;
          npc.rightArm.rotation.x = THREE.MathUtils.lerp(
            npc.rightArm.rotation.x,
            -0.4 + Math.sin(npc.walkPhase * 2) * 0.2,
            effectiveDelta * 4
          );
          this.resetLegRotations(npc, effectiveDelta);

          if (npc.stateTimer <= 0) {
            this.chooseNextWaypoint(npc);
            npc.state = 'WALK';
          }
          break;
        }
      }

      // Apply coordinates and yaw to group
      npc.group.position.copy(npc.position);
      npc.group.rotation.y = npc.rotationY;
    }
  }

  /**
   * Updates natural curved path walking movement and swinging limbs
   */
  private updateWalkingState(npc: VillagerNPC, delta: number, separation: THREE.Vector3): void {
    const prevPos = this.waypoints[npc.previousWaypoint].pos;
    const targetPos = this.waypoints[npc.targetWaypoint].pos;

    // Advance along quadratic Bezier curve: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    const totalDist = prevPos.distanceTo(targetPos);
    const speed = npc.walkSpeed / Math.max(1.0, totalDist);
    npc.curveProgress += speed * delta;

    if (npc.curveProgress >= 1.0) {
      // Reached destination waypoint
      npc.curveProgress = 1.0;
      npc.previousWaypoint = npc.targetWaypoint;

      // Believable decision logic at waypoints:
      // 35% chance to stop and look around
      // 15% chance to do a Namaste greeting
      // 50% chance to seamlessly continue walking to next lane
      const roll = Math.random();
      if (roll < 0.35) {
        npc.state = 'IDLE_LOOK';
        npc.stateTimer = 3.0 + Math.random() * 3.5;
        return;
      } else if (roll < 0.5) {
        npc.state = 'IDLE_GREET';
        npc.stateTimer = 2.2 + Math.random() * 1.5;
        return;
      } else {
        this.chooseNextWaypoint(npc);
      }
    }

    // Evaluate point on curve with scratch vector to eliminate allocations
    const t = npc.curveProgress;
    const p0 = prevPos;
    const p1 = npc.curveControlPoint;
    const p2 = targetPos;

    const oneMinusT = 1 - t;
    const c0 = oneMinusT * oneMinusT;
    const c1 = 2 * oneMinusT * t;
    const c2 = t * t;

    const nextPos = VillageNPCSystem.scratchNextPos.set(
      c0 * p0.x + c1 * p1.x + c2 * p2.x,
      0,
      c0 * p0.z + c1 * p1.z + c2 * p2.z
    );

    // Apply separation steering
    nextPos.x += separation.x * delta;
    nextPos.z += separation.z * delta;

    // Calculate movement vector and smooth rotation
    const moveDir = VillageNPCSystem.scratchMoveDir.set(
      nextPos.x - npc.position.x,
      0,
      nextPos.z - npc.position.z
    );
    if (moveDir.lengthSq() > 0.0001) {
      const targetRotY = Math.atan2(moveDir.x, moveDir.z);
      let diff = targetRotY - npc.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      npc.rotationY += diff * Math.min(1.0, delta * 6.0);
    }

    npc.position.copy(nextPos);

    // Procedural Natural Walking Animation
    npc.walkPhase += delta * npc.walkSpeed * 4.5;
    const legSwing = Math.sin(npc.walkPhase) * 0.45;
    const armSwing = Math.sin(npc.walkPhase) * 0.35;

    npc.leftLeg.rotation.x = legSwing;
    npc.rightLeg.rotation.x = -legSwing;
    npc.leftArm.rotation.x = -armSwing;
    npc.rightArm.rotation.x = armSwing;

    // Subtle natural vertical bobbing
    npc.group.position.y = Math.abs(Math.sin(npc.walkPhase * 2)) * 0.04;
  }

  /**
   * Selects the next connected waypoint and computes an organic curve control point
   */
  private chooseNextWaypoint(npc: VillagerNPC): void {
    const currentWp = this.waypoints[npc.previousWaypoint];
    const connections = currentWp.connections;

    // Avoid immediately backtracking to previous node if other paths are available
    const available = connections.filter(id => id !== npc.targetWaypoint || connections.length === 1);
    const chosenId = available[Math.floor(Math.random() * available.length)];

    npc.targetWaypoint = chosenId;
    npc.curveProgress = 0;

    const startPos = currentWp.pos;
    const targetPos = this.waypoints[chosenId].pos;

    // Compute smooth curved control point with gentle lateral curvature
    const mid = startPos.clone().lerp(targetPos, 0.5);
    const perp = new THREE.Vector3(-(targetPos.z - startPos.z), 0, targetPos.x - startPos.x).normalize();
    const curveOffset = (Math.random() - 0.5) * 1.5;
    npc.curveControlPoint = mid.add(perp.multiplyScalar(curveOffset));
  }

  private resetLimbRotations(npc: VillagerNPC, delta: number): void {
    npc.leftLeg.rotation.x = THREE.MathUtils.lerp(npc.leftLeg.rotation.x, 0, delta * 6);
    npc.rightLeg.rotation.x = THREE.MathUtils.lerp(npc.rightLeg.rotation.x, 0, delta * 6);
    npc.leftArm.rotation.x = THREE.MathUtils.lerp(npc.leftArm.rotation.x, 0, delta * 6);
    npc.rightArm.rotation.x = THREE.MathUtils.lerp(npc.rightArm.rotation.x, 0, delta * 6);
    npc.leftArm.rotation.z = THREE.MathUtils.lerp(npc.leftArm.rotation.z, 0, delta * 6);
    npc.rightArm.rotation.z = THREE.MathUtils.lerp(npc.rightArm.rotation.z, 0, delta * 6);
  }

  private resetLegRotations(npc: VillagerNPC, delta: number): void {
    npc.leftLeg.rotation.x = THREE.MathUtils.lerp(npc.leftLeg.rotation.x, 0, delta * 6);
    npc.rightLeg.rotation.x = THREE.MathUtils.lerp(npc.rightLeg.rotation.x, 0, delta * 6);
  }

  public getCount(): number {
    return this.villagers.length;
  }
}
