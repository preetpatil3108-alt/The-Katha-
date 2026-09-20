/**
 * THE KATHA - Player Drivable Exploration Vehicle System
 *
 * Dedicated vehicle engine crafted specifically for Ramu:
 * - Positioned authentically near the Rangastalam village entrance.
 * - STRICT ACCESS: Exclusively for RAMU. No companions, villagers, or NPCs can ever drive it.
 * - UNLOCK PROGRESSION: Locked until Level 1 (Siddham) is completed. Permanently unlocked thereafter.
 * - PHYSICS & CONTROLS:
 *   - Ground-clamped (never floats, never clips terrain).
 *   - Realistic acceleration, engine braking, reverse, and speed-adaptive steering kinematics.
 *   - Pivoting front wheels and spinning tires.
 *   - Dynamic headlights and glowing red brake lights.
 *   - Integrated procedural Web Audio engine synthesizer (idle hum, acceleration rev, horn).
 *   - Full collision resolution via CollisionSystem.
 *   - Desktop WASD/Arrows and mobile touch-friendly controls with safe driver dismount.
 */

import * as THREE from 'three';
import { PlayerInput } from '../../types/game';
import { CollisionSystem } from '../collisions/CollisionSystem';
import { audioManager } from '../../core/audio/AudioManager';

export interface VehicleInteractionInfo {
  inRange: boolean;
  distance: number;
  isUnlocked: boolean;
  isOccupied: boolean;
  promptText: string;
  feedbackMessage?: string;
}

export class PlayerDrivableCar {
  public group: THREE.Group;
  private collisionSystem: CollisionSystem;

  // Transform & Kinematics
  public position: THREE.Vector3;
  public rotationY: number;
  private speed: number = 0;
  private steerAngle: number = 0; // Visual & kinematic front wheel angle

  // Vehicle Specifications
  private maxForwardSpeed: number = 18.0; // ~65 km/h
  private maxReverseSpeed: number = 7.0;   // ~25 km/h
  private accelerationRate: number = 14.0;
  private brakeRate: number = 24.0;
  private coastFriction: number = 4.5;
  private maxSteerAngle: number = 0.52;    // ~30 degrees
  private steerSpeed: number = 4.0;
  private steerReturnSpeed: number = 6.0;
  private wheelbase: number = 2.6;
  private vehicleRadius: number = 1.35;    // Collision radius

  // State & Access Control
  private isUnlocked: boolean = false;
  private isOccupied: boolean = false;
  private isBoarding: boolean = false;
  private interactionRange: number = 3.5;

  // Visual Nodes
  private chassisMesh: THREE.Group;
  private frontLeftWheelPivot: THREE.Group;
  private frontRightWheelPivot: THREE.Group;
  private frontLeftWheel: THREE.Mesh;
  private frontRightWheel: THREE.Mesh;
  private rearLeftWheel: THREE.Mesh;
  private rearRightWheel: THREE.Mesh;
  private wheelRadius: number = 0.42;

  private headLights: THREE.Mesh[] = [];
  private tailLights: THREE.Mesh[] = [];
  private matTailLights: THREE.MeshBasicMaterial;
  private matHeadLights: THREE.MeshBasicMaterial;

  private lockIndicatorGroup: THREE.Group;
  private unlockBeaconGroup: THREE.Group;
  private passengerAyyagaruGroup: THREE.Group | null = null;
  private seatAnchors: Map<string, THREE.Group> = new Map();

  // Web Audio Engine Synthesizer
  private audioCtx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isAudioRunning: boolean = false;
  private isMuted: boolean = false;
  private isPaused: boolean = false;

  constructor(collisionSystem: CollisionSystem, initialUnlocked: boolean = false) {
    this.collisionSystem = collisionSystem;
    this.isUnlocked = initialUnlocked;

    this.group = new THREE.Group();
    this.group.name = 'player_drivable_car';

    // Parked naturally near Rangastalam village entrance threshold (outside the sacred arch)
    // Road runs along z = 24 to 28. Car is parked on the roadside verge at x = 5.6, z = 27.8.
    this.position = new THREE.Vector3(5.6, 0.0, 27.8);
    this.rotationY = Math.PI * 0.92; // Parked facing angled slightly toward the open road

    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;

    // Materials
    this.matTailLights = new THREE.MeshBasicMaterial({ color: '#7f1d1d' });
    this.matHeadLights = new THREE.MeshBasicMaterial({ color: '#fef08a' });

    // Build Detailed 3D Model
    const model = this.buildVehicleModel();
    this.chassisMesh = model.chassis;
    this.frontLeftWheelPivot = model.flPivot;
    this.frontRightWheelPivot = model.frPivot;
    this.frontLeftWheel = model.flWheel;
    this.frontRightWheel = model.frWheel;
    this.rearLeftWheel = model.rlWheel;
    this.rearRightWheel = model.rrWheel;

    this.group.add(this.chassisMesh);

    // Lock Indicator & Unlock Beacon
    this.lockIndicatorGroup = this.createLockIndicator();
    this.unlockBeaconGroup = this.createUnlockBeacon();
    this.group.add(this.lockIndicatorGroup);
    this.group.add(this.unlockBeaconGroup);

    this.updateIndicatorVisibility();

    // Register initial solid parking collider so walking Ramu or NPCs don't walk through it
    this.updateCollider();
  }

  /**
   * Builds the authentic Indian expedition 4x4 off-roader vehicle
   */
  private buildVehicleModel() {
    const chassis = new THREE.Group();

    // Shared Vehicle Materials
    const matBodyPaint = new THREE.MeshStandardMaterial({
      color: '#831843', // Royal Festival Maroon / Deep Ruby
      roughness: 0.28,
      metalness: 0.65,
    });
    const matTrimBlack = new THREE.MeshLambertMaterial({ color: '#18181b' }); // Matte Off-road Plastic
    const matTireRubber = new THREE.MeshLambertMaterial({ color: '#27272a' });
    const matRimAlloy = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      metalness: 0.85,
      roughness: 0.2,
    });
    const matWindowGlass = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.42,
    });
    const matSeatLeather = new THREE.MeshLambertMaterial({ color: '#292524' });
    const matSeatAccent = new THREE.MeshLambertMaterial({ color: '#78350f' });
    const matChrome = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      metalness: 0.95,
      roughness: 0.1,
    });
    const matGoldEmblem = new THREE.MeshStandardMaterial({
      color: '#eab308',
      metalness: 0.8,
      roughness: 0.25,
    });

    // 1. MAIN LOWER BODY & CHASSIS
    // Raised high clearance off-roader chassis (length 4.3m, width 1.95m, height 0.72m)
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.72, 4.3), matBodyPaint);
    lowerBody.position.set(0, 0.76, 0);
    lowerBody.castShadow = true;
    chassis.add(lowerBody);

    // Front Hood Power Bulge
    const hoodBulge = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 1.45), matBodyPaint);
    hoodBulge.position.set(0, 1.15, 1.2);
    hoodBulge.castShadow = true;
    chassis.add(hoodBulge);

    // 2. CABIN & ROOF
    // Tinted passenger cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.82, 2.5), matWindowGlass);
    cabin.position.set(0, 1.45, -0.42);
    cabin.castShadow = true;
    chassis.add(cabin);

    // Interior Seats: 2 Front Seats (Driver Left, Passenger Right) + 3 Rear Bench Seats
    // Anchors establish exact world transforms for all seated characters
    const seatCoordinates = [
      { id: 'driver', x: -0.42, y: 1.09, z: -0.14, isDriver: true },          // Driver (Ramu)
      { id: 'front_passenger', x: 0.42, y: 1.09, z: -0.14, isDriver: false },  // Front Passenger (Ayyagaru / Companion)
      { id: 'rear_left', x: -0.45, y: 1.09, z: -0.84, isDriver: false },       // Rear Left (Varun)
      { id: 'rear_center', x: 0.0, y: 1.09, z: -0.84, isDriver: false },        // Rear Center (Dinesh)
      { id: 'rear_right', x: 0.45, y: 1.09, z: -0.84, isDriver: false },       // Rear Right (Bhavani)
    ];

    seatCoordinates.forEach((seat) => {
      const seatGroup = new THREE.Group();
      seatGroup.position.set(seat.x, 1.05, seat.z);

      // Seat Cushion Base (top surface sits at y = 1.11, compressed cushion contact at 1.09)
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.38), matSeatLeather);
      cushion.position.y = 0.06;
      seatGroup.add(cushion);

      // Backrest
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.44, 0.09), matSeatLeather);
      backrest.position.set(0, 0.3, -0.15);
      backrest.rotation.x = 0.1;
      seatGroup.add(backrest);

      // Headrest
      const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.08), matSeatAccent);
      headrest.position.set(0, 0.56, -0.18);
      seatGroup.add(headrest);

      chassis.add(seatGroup);

      // Seat Anchor node for character seating attachment
      const anchor = new THREE.Group();
      anchor.name = `seat_anchor_${seat.id}`;
      anchor.position.set(seat.x, seat.y, seat.z);
      if (seat.isDriver) {
        anchor.rotation.set(-0.04, 0, 0);
      } else {
        anchor.rotation.set(-0.06, 0, 0);
      }
      chassis.add(anchor);
      this.seatAnchors.set(seat.id, anchor);
    });

    // Front Dashboard & Instrument Binnacle
    const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.28, 0.35), matTrimBlack);
    dashboard.position.set(0, 1.25, 0.55);
    chassis.add(dashboard);

    // Steering Column & Wheel for Driver (at x: -0.42)
    const steeringColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 8), matTrimBlack);
    steeringColumn.position.set(-0.42, 1.26, 0.38);
    steeringColumn.rotation.x = -0.55;
    chassis.add(steeringColumn);

    const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 8, 16), matTrimBlack);
    steeringWheel.position.set(-0.42, 1.35, 0.28);
    steeringWheel.rotation.x = -0.55;
    chassis.add(steeringWheel);

    // Solid Roof Panel (ceiling at y = 1.83, exterior at y = 1.93)
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.1, 2.45), matTrimBlack);
    roof.position.set(0, 1.88, -0.42);
    roof.castShadow = true;
    chassis.add(roof);

    // Heavy-duty Safari Roof Luggage Rack
    const rackFront = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.18, 0.06), matTrimBlack);
    rackFront.position.set(0, 2.0, 0.7);
    chassis.add(rackFront);

    const rackBack = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.18, 0.06), matTrimBlack);
    rackBack.position.set(0, 2.0, -1.55);
    chassis.add(rackBack);

    const rackSides = [-0.8, 0.8].map(rx => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 2.25), matTrimBlack);
      rail.position.set(rx, 2.0, -0.42);
      chassis.add(rail);
      return rail;
    });

    // Expedition baggage luggage boxes on roof
    const cargoBox1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.7), new THREE.MeshLambertMaterial({ color: '#78350f' }));
    cargoBox1.position.set(-0.25, 2.05, -0.2);
    chassis.add(cargoBox1);

    const cargoBox2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.6), new THREE.MeshLambertMaterial({ color: '#1e3a5f' }));
    cargoBox2.position.set(0.42, 2.04, -0.7);
    chassis.add(cargoBox2);

    // Seated Passenger in Front Seat: Ayyagaru (Vedic Priest)
    // Anchored at the front passenger seat anchor, scaled to 0.76 for cabin clearance
    const passengerGroup = new THREE.Group();
    passengerGroup.name = 'passenger_ayyagaru_in_car';
    passengerGroup.position.set(0.42, 1.09, -0.14);
    passengerGroup.rotation.set(-0.06, 0, 0);
    passengerGroup.scale.setScalar(0.76);
    passengerGroup.visible = false;

    const pMatSkin = new THREE.MeshStandardMaterial({ color: '#e4b68e', roughness: 0.65 });
    const pMatHair = new THREE.MeshStandardMaterial({ color: '#27201c', roughness: 0.85 });
    const pMatKanduva = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.72 });
    const pMatZari = new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.35, metalness: 0.6 });
    const pMatRedPancha = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.68 });

    // Seated Pelvis resting directly on the seat cushion
    const pPelvis = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.32), pMatRedPancha);
    pPelvis.position.set(0, 0.06, 0);
    passengerGroup.add(pPelvis);

    // Forward Thighs extending horizontally over the seat cushion
    const pThighs = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.32), pMatRedPancha);
    pThighs.position.set(0, 0.06, 0.16);
    passengerGroup.add(pThighs);

    // Calves bending downward into the footwell
    const pCalves = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.14), pMatRedPancha);
    pCalves.position.set(0, -0.10, 0.28);
    passengerGroup.add(pCalves);

    // Bare feet resting flat in the passenger footwell
    [-0.10, 0.10].forEach(fx => {
      const pFoot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.16), pMatSkin);
      pFoot.position.set(fx, -0.23, 0.34);
      passengerGroup.add(pFoot);
    });

    // Red Kanduva draped torso
    const pTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.17, 0.44, 10), pMatKanduva);
    pTorso.position.set(0, 0.28, 0.02);
    passengerGroup.add(pTorso);

    // Gold zari border on kanduva
    const pZari = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.22), pMatZari);
    pZari.position.set(0, 0.18, 0.10);
    passengerGroup.add(pZari);

    // Hands resting peacefully in lap
    const pArms = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.22), pMatKanduva);
    pArms.position.set(0, 0.22, 0.12);
    passengerGroup.add(pArms);

    const pHands = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.12), pMatSkin);
    pHands.position.set(0, 0.20, 0.20);
    passengerGroup.add(pHands);

    // Yajnopavita (Sacred thread)
    const pThread = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.008, 6, 16), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    pThread.position.set(0, 0.30, 0.06);
    pThread.rotation.set(0.4, 0.5, 0.6);
    passengerGroup.add(pThread);

    // Anatomical neck bridging torso and head
    const pNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.076, 0.12, 10), pMatSkin);
    pNeck.position.set(0, 0.48, 0.02);
    passengerGroup.add(pNeck);

    // Head with clean skin tone
    const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), pMatSkin);
    pHead.scale.set(0.96, 1.05, 0.98);
    pHead.position.set(0, 0.56, 0.02);
    passengerGroup.add(pHead);

    // Shaved head shadow tone
    const pShave = new THREE.Mesh(
      new THREE.SphereGeometry(0.132, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.35),
      new THREE.MeshStandardMaterial({ color: '#3d2e26', roughness: 0.95 })
    );
    pShave.position.set(0, 0.56, 0.01);
    passengerGroup.add(pShave);

    // Traditional Pilaka / Sikha at the BACK of the head
    const pPilaka = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.11, 8), pMatHair);
    pPilaka.rotation.x = -0.7;
    pPilaka.position.set(0, 0.59, -0.10);
    passengerGroup.add(pPilaka);

    // Tilak (Tripundra with red kumkum)
    const pTilak = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.012, 0.01), new THREE.MeshBasicMaterial({ color: '#facc15' }));
    pTilak.position.set(0, 0.58, 0.145);
    passengerGroup.add(pTilak);

    const pKumkum = new THREE.Mesh(new THREE.CircleGeometry(0.007, 6), new THREE.MeshBasicMaterial({ color: '#dc2626' }));
    pKumkum.position.set(0, 0.58, 0.151);
    passengerGroup.add(pKumkum);

    // Eyes
    [-0.038, 0.038].forEach(ex => {
      const pEye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 4, 4), new THREE.MeshBasicMaterial({ color: '#18181b' }));
      pEye.position.set(ex, 0.55, 0.14);
      passengerGroup.add(pEye);
    });

    chassis.add(passengerGroup);
    this.passengerAyyagaruGroup = passengerGroup;

    // 3. FRONT DETAILS: Grille, Bullbar, Round Headlights
    // Classic 7-slot off-road grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.1), matTrimBlack);
    grille.position.set(0, 0.8, 2.16);
    chassis.add(grille);

    // Chrome vertical grille bars
    for (let i = -3; i <= 3; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.12), matChrome);
      bar.position.set(i * 0.16, 0.8, 2.16);
      chassis.add(bar);
    }

    // Heavy Metal Bullbar & Winch Plate
    const bullbar = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.28, 0.22), matTrimBlack);
    bullbar.position.set(0, 0.48, 2.26);
    chassis.add(bullbar);

    const skidPlate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.24, 0.3), matRimAlloy);
    skidPlate.position.set(0, 0.32, 2.15);
    skidPlate.rotation.x = Math.PI / 6;
    chassis.add(skidPlate);

    // Dual Round Retro Off-Road Headlights
    [-0.68, 0.68].forEach(hx => {
      const hlHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16), matTrimBlack);
      hlHousing.rotation.x = Math.PI / 2;
      hlHousing.position.set(hx, 0.82, 2.18);
      chassis.add(hlHousing);

      const hlLens = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.09, 16), this.matHeadLights);
      hlLens.rotation.x = Math.PI / 2;
      hlLens.position.set(hx, 0.82, 2.19);
      chassis.add(hlLens);
      this.headLights.push(hlLens);

      // Amber turn signal
      const ind = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), new THREE.MeshBasicMaterial({ color: '#f59e0b' }));
      ind.position.set(hx > 0 ? 0.92 : -0.92, 0.82, 2.16);
      chassis.add(ind);
    });

    // 4. REAR DETAILS: Spare Wheel, Taillights, Tow Hook
    // Rear exterior tailgate spare tire with cover
    const spareTireGroup = new THREE.Group();
    spareTireGroup.position.set(0, 0.95, -2.25);

    const spareTire = new THREE.Mesh(new THREE.CylinderGeometry(this.wheelRadius, this.wheelRadius, 0.28, 16), matTireRubber);
    spareTire.rotation.x = Math.PI / 2;
    spareTireGroup.add(spareTire);

    const spareCover = new THREE.Mesh(new THREE.CylinderGeometry(this.wheelRadius * 0.85, this.wheelRadius * 0.85, 0.3, 16), matBodyPaint);
    spareCover.rotation.x = Math.PI / 2;
    spareTireGroup.add(spareCover);

    const spareEmblem = new THREE.Mesh(new THREE.CircleGeometry(0.16, 12), matGoldEmblem);
    spareEmblem.position.z = -0.16;
    spareEmblem.rotation.y = Math.PI;
    spareTireGroup.add(spareEmblem);

    chassis.add(spareTireGroup);

    // Rear Dual Taillights
    [-0.78, 0.78].forEach(tx => {
      const tlHousing = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.4, 0.06), matTrimBlack);
      tlHousing.position.set(tx, 0.88, -2.16);
      chassis.add(tlHousing);

      const tlLens = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.07), this.matTailLights);
      tlLens.position.set(tx, 0.88, -2.17);
      chassis.add(tlLens);
      this.tailLights.push(tlLens);
    });

    // Rear heavy bumper
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.24, 0.2), matTrimBlack);
    rearBumper.position.set(0, 0.48, -2.2);
    chassis.add(rearBumper);

    // 5. SIDE DETAILS: Flared Wheel Arches & Footstep Rock Sliders
    [-1.02, 1.02].forEach(sx => {
      // Footstep runner rail
      const runner = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 2.1), matTrimBlack);
      runner.position.set(sx, 0.36, -0.1);
      chassis.add(runner);

      // Side mirrors
      const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.06), matTrimBlack);
      mirrorArm.position.set(sx > 0 ? sx + 0.1 : sx - 0.1, 1.25, 0.7);
      chassis.add(mirrorArm);

      const mirrorHousing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.28), matTrimBlack);
      mirrorHousing.position.set(sx > 0 ? sx + 0.22 : sx - 0.22, 1.25, 0.7);
      chassis.add(mirrorHousing);

      // Millennials Youth Association Gold Door Emblem badge
      const emblem = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.24, 0.5), matGoldEmblem);
      emblem.position.set(sx > 0 ? 0.98 : -0.98, 0.92, -0.15);
      chassis.add(emblem);
    });

    // 6. WHEELS WITH REALISTIC OFF-ROAD TIRES & ALLOY RIMS
    // Helper to generate a complete wheel
    const createWheel = () => {
      const wGroup = new THREE.Group();

      // Deep tread tire
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(this.wheelRadius, this.wheelRadius, 0.34, 16), matTireRubber);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wGroup.add(tire);

      // Silver alloy 5-spoke rim
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(this.wheelRadius * 0.62, this.wheelRadius * 0.62, 0.36, 12), matRimAlloy);
      rim.rotation.z = Math.PI / 2;
      wGroup.add(rim);

      // Center Hub
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.38, 8), matTrimBlack);
      hub.rotation.z = Math.PI / 2;
      wGroup.add(hub);

      return { root: wGroup, mesh: tire };
    };

    const wheelTrack = 0.98; // Half-width (X)
    const frontAxleZ = 1.35; // Front axle (Z)
    const rearAxleZ = -1.25; // Rear axle (Z)
    const wheelCenterY = this.wheelRadius; // Exactly 0.42m above ground!

    // Front Left (Pivot for steering)
    const flPivot = new THREE.Group();
    flPivot.position.set(-wheelTrack, wheelCenterY, frontAxleZ);
    const flWheelData = createWheel();
    flPivot.add(flWheelData.root);
    chassis.add(flPivot);

    // Front Right (Pivot for steering)
    const frPivot = new THREE.Group();
    frPivot.position.set(wheelTrack, wheelCenterY, frontAxleZ);
    const frWheelData = createWheel();
    frPivot.add(frWheelData.root);
    chassis.add(frPivot);

    // Rear Left
    const rlPivot = new THREE.Group();
    rlPivot.position.set(-wheelTrack, wheelCenterY, rearAxleZ);
    const rlWheelData = createWheel();
    rlPivot.add(rlWheelData.root);
    chassis.add(rlPivot);

    // Rear Right
    const rrPivot = new THREE.Group();
    rrPivot.position.set(wheelTrack, wheelCenterY, rearAxleZ);
    const rrWheelData = createWheel();
    rrPivot.add(rrWheelData.root);
    chassis.add(rrPivot);

    return {
      chassis,
      flPivot,
      frPivot,
      flWheel: flWheelData.mesh,
      frWheel: frWheelData.mesh,
      rlWheel: rlWheelData.mesh,
      rrWheel: rrWheelData.mesh,
    };
  }

  /**
   * Floating 3D lock beacon above car when locked
   */
  private createLockIndicator(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, 2.7, 0);

    // Lock body
    const bodyGeo = new THREE.BoxGeometry(0.45, 0.38, 0.18);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: '#d97706',
      metalness: 0.8,
      roughness: 0.2,
      emissive: '#b45309',
      emissiveIntensity: 0.5,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Lock shackle loop
    const shackleGeo = new THREE.TorusGeometry(0.18, 0.05, 8, 16, Math.PI);
    const shackleMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.9, roughness: 0.1 });
    const shackle = new THREE.Mesh(shackleGeo, shackleMat);
    shackle.position.set(0, 0.2, 0);
    group.add(shackle);

    return group;
  }

  /**
   * Floating 3D green sparkle beacon when unlocked
   */
  private createUnlockBeacon(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, 2.7, 0);

    const diamondGeo = new THREE.OctahedronGeometry(0.25, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: '#10b981',
      emissive: '#059669',
      emissiveIntensity: 0.8,
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    group.add(diamond);

    const ringGeo = new THREE.RingGeometry(0.35, 0.42, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#34d399', side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
  }

  /**
   * Updates visibility of lock indicators
   */
  private updateIndicatorVisibility(): void {
    if (this.isOccupied) {
      this.lockIndicatorGroup.visible = false;
      this.unlockBeaconGroup.visible = false;
    } else {
      this.lockIndicatorGroup.visible = !this.isUnlocked;
      this.unlockBeaconGroup.visible = this.isUnlocked;
    }
  }

  /**
   * Updates solid collider in CollisionSystem
   */
  private updateCollider(): void {
    // When occupied, car handles its own dynamic movement resolution
    if (this.isOccupied) {
      this.collisionSystem.removeCollider('player_parked_car');
    } else {
      this.collisionSystem.addCollider({
        id: 'player_parked_car',
        type: 'sphere',
        position: this.position.clone(),
        radius: this.vehicleRadius,
      });
    }
  }

  /**
   * Informs the vehicle system whether Level 1 has been completed
   */
  public setLevel1Completed(completed: boolean): void {
    if (this.isUnlocked !== completed) {
      this.isUnlocked = completed;
      this.updateIndicatorVisibility();
    }
  }

  /**
   * Check proximity & interaction eligibility strictly for RAMU
   */
  public getInteractionState(ramuPosition: THREE.Vector3): VehicleInteractionInfo {
    const dist = ramuPosition.distanceTo(this.position);
    const inRange = dist <= this.interactionRange;

    let promptText = '';
    let feedbackMessage = undefined;

    if (this.isOccupied) {
      promptText = 'EXIT CAR [E]';
    } else if (inRange) {
      if (this.isUnlocked) {
        promptText = 'ENTER CAR [E]';
      } else {
        promptText = '🔒 CAR LOCKED';
        feedbackMessage = '🔒 Car is Locked • Complete Level 1 (Siddham) to unlock Ramu\'s vehicle!';
      }
    }

    return {
      inRange,
      distance: dist,
      isUnlocked: this.isUnlocked,
      isOccupied: this.isOccupied,
      promptText,
      feedbackMessage,
    };
  }

  /**
   * Request Ramu entering vehicle.
   * STRICT ACCESS: Only Ramu can enter.
   * UNLOCK RULE: Must be unlocked (Level 1 completed).
   */
  public tryEnter(ramuPosition: THREE.Vector3): { success: boolean; reason?: string } {
    if (this.isOccupied) {
      return { success: false, reason: 'Already driving' };
    }

    if (!this.isUnlocked) {
      return {
        success: false,
        reason: '🔒 Vehicle Locked: The car keys are held by the committee until Level 1 (Siddham) is completed!',
      };
    }

    const dist = ramuPosition.distanceTo(this.position);
    if (dist > this.interactionRange) {
      return { success: false, reason: 'Too far from car' };
    }

    // Successfully enter!
    this.isOccupied = true;
    this.updateIndicatorVisibility();
    this.updateCollider();
    this.initAudioEngine();
    this.playCarStartSound();

    return { success: true };
  }

  /**
   * Ramu exits the vehicle. Returns safe coordinates for Ramu beside the car.
   */
  public exit(): THREE.Vector3 {
    if (!this.isOccupied) return this.position.clone();

    this.isOccupied = false;
    this.speed = 0;
    this.steerAngle = 0;

    this.stopAudioEngine();
    this.updateIndicatorVisibility();
    this.updateCollider();

    // Reset taillights to resting red
    this.matTailLights.color.set('#7f1d1d');

    // Calculate safe exit position beside driver side (left side of vehicle)
    // Left perpendicular vector:
    const leftVec = new THREE.Vector3(
      Math.cos(this.rotationY),
      0,
      -Math.sin(this.rotationY)
    ).normalize();

    let exitPos = this.position.clone().add(leftVec.multiplyScalar(1.65));
    exitPos.y = 0; // Strictly on ground

    // Resolve collision so Ramu doesn't spawn inside a wall or tree
    exitPos = this.collisionSystem.resolveMovement(this.position, exitPos, 0.45);
    exitPos.y = 0;

    return exitPos;
  }

  /**
   * Resets the player vehicle to its Level 2 starting state:
   * - Parked safely at village entrance verge
   * - Zero velocity & zero steering angle
   * - Neutral taillights & audio halted
   * - Passenger removed
   */
  public resetToStart(): void {
    this.isOccupied = false;
    this.isBoarding = false;
    this.speed = 0;
    this.steerAngle = 0;
    this.stopAudioEngine();

    // Reset to Level 2 starting position (village entrance parking spot)
    this.position.set(5.6, 0.0, 27.8);
    this.rotationY = Math.PI * 0.92;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;

    this.setPassenger(false);
    this.matTailLights.color.set('#7f1d1d');
    this.frontLeftWheelPivot.rotation.y = 0;
    this.frontRightWheelPivot.rotation.y = 0;
    this.chassisMesh.rotation.x = 0;

    this.updateIndicatorVisibility();
    this.updateCollider();
  }

  public getIsOccupied(): boolean {
    return this.isOccupied;
  }

  /**
   * Fully initializes the vehicle into active, driveable state for Level 2 (Normal, Replay, Crash Restart).
   * Ensures controller, steering, throttle, braking, and physics are ready immediately.
   */
  public initializeForLevel2Driving(): void {
    // 1. Vehicle unlock and ownership
    this.isUnlocked = true;
    this.isOccupied = true;
    this.isBoarding = false;

    // 2. Physics kinematics reset to designated Level 2 start location
    this.position.set(5.6, 0.0, 27.8);
    this.rotationY = Math.PI * 0.92;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;

    this.speed = 0;
    this.steerAngle = 0;

    // 3. Wheel meshes and chassis orientation
    this.frontLeftWheelPivot.rotation.y = 0;
    this.frontRightWheelPivot.rotation.y = 0;
    this.chassisMesh.rotation.x = 0;
    this.chassisMesh.rotation.z = 0;

    // 4. Taillights & passenger
    this.matTailLights.color.set('#7f1d1d');
    this.setPassenger(false);

    // 5. Solid collider handling: when occupied, dynamic collision resolution takes over
    this.updateCollider();
    this.updateIndicatorVisibility();

    // 6. Audio engine initialization (start sound will play cleanly on boarding complete)
    this.initAudioEngine();
  }

  public initializeForLevel3Driving(): void {
    this.isUnlocked = true;
    this.isOccupied = true;
    this.isBoarding = false;

    // Mandapam street parked position facing south towards highway NH-65
    this.position.set(3.0, 0.0, 14.0);
    this.rotationY = Math.PI;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;

    this.speed = 0;
    this.steerAngle = 0;

    this.frontLeftWheelPivot.rotation.y = 0;
    this.frontRightWheelPivot.rotation.y = 0;
    this.chassisMesh.rotation.x = 0;
    this.chassisMesh.rotation.z = 0;

    this.matTailLights.color.set('#7f1d1d');
    this.setPassenger(false);

    this.updateCollider();
    this.updateIndicatorVisibility();
    this.initAudioEngine();
  }

  public setTransform(pos: THREE.Vector3, rotY: number): void {
    this.position.copy(pos);
    this.rotationY = rotY;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;
    this.updateCollider();
  }

  /**
   * Applies an elastic collision bump/impulse from another vehicle or obstacle.
   * Deflects position away and dampens speed cleanly without breaking input states.
   */
  public applyCollisionBump(impulseDirection: THREE.Vector3, bumpMagnitude: number = 0.9): void {
    if (!this.isOccupied) return;
    const impulse = impulseDirection.clone();
    impulse.y = 0;
    if (impulse.lengthSq() > 0.0001) {
      impulse.normalize().multiplyScalar(bumpMagnitude);
      const candPos = this.position.clone().add(impulse);
      const resolved = this.collisionSystem.resolveMovement(this.position, candPos, this.vehicleRadius);
      this.position.copy(resolved);
      this.position.y = 0;
      this.group.position.copy(this.position);
    }
    // Dampen forward/backward speed on impact
    this.speed *= -0.35;
  }

  public setBoarding(boarding: boolean): void {
    this.isBoarding = boarding;
    if (!boarding && this.isOccupied) {
      this.playCarStartSound();
    }
  }

  public getIsBoarding(): boolean {
    return this.isBoarding;
  }

  public getPosition(): THREE.Vector3 {
    return this.position;
  }

  public getRotationY(): number {
    return this.rotationY;
  }

  public getSpeed(): number {
    return this.speed;
  }

  /**
   * Main Vehicle Physics Update Loop:
   * 1. If not driving, handles idle beacon bobbing.
   * 2. If driving, applies realistic vehicle physics kinematics:
   *    - Acceleration / Braking / Reverse
   *    - Turning angle & yaw rotational kinematics
   *    - Physical collision resolution
   *    - Wheel steering & rolling physics
   *    - Ground clamping (y = 0)
   *    - Headlight/Taillight emissive response
   *    - Engine pitch modulation
   */
  public update(delta: number, input: PlayerInput): void {
    const dt = Math.min(delta, 0.1);

    // 1. Idle Bobbing on Lock / Unlock Indicator
    if (!this.isOccupied) {
      const time = Date.now() * 0.003;
      if (this.lockIndicatorGroup.visible) {
        this.lockIndicatorGroup.position.y = 2.65 + Math.sin(time * 1.5) * 0.08;
        this.lockIndicatorGroup.rotation.y += dt * 0.8;
      }
      if (this.unlockBeaconGroup.visible) {
        this.unlockBeaconGroup.position.y = 2.65 + Math.sin(time * 2.0) * 0.1;
        this.unlockBeaconGroup.rotation.y += dt * 1.5;
      }
      return;
    }

    // 2. Active Driving Kinematics (Ramu is inside)
    // If boarding sequence is in progress, vehicle remains stationary until friends board
    if (this.isBoarding) {
      this.speed = 0;
      this.matTailLights.color.set('#7f1d1d');
      return;
    }

    let accelInput = 0;
    let steerInput = 0;

    // Throttle & Brake/Reverse
    // input.moveZ: -1 is Forward (W/Up), +1 is Backward (S/Down)
    if (input.moveZ < -0.08) {
      accelInput = -input.moveZ; // 0 to 1 forward
    } else if (input.moveZ > 0.08) {
      accelInput = -input.moveZ; // -1 to 0 backward / brake
    }

    // Steering
    // input.moveX: -1 is Left (A), +1 is Right (D)
    if (Math.abs(input.moveX) > 0.08) {
      steerInput = -input.moveX; // Turning angle
    }

    // A. Steering Angle Dynamics with auto-return
    if (Math.abs(steerInput) > 0.01) {
      const targetSteer = steerInput * this.maxSteerAngle;
      this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteer, dt * this.steerSpeed);
    } else {
      this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, 0, dt * this.steerReturnSpeed);
    }

    // B. Acceleration, Braking & Engine Drag
    if (accelInput > 0.05) {
      // Forward throttle
      if (this.speed < 0) {
        // Active braking from reverse
        this.speed += this.brakeRate * dt;
      } else {
        this.speed = Math.min(this.maxForwardSpeed, this.speed + this.accelerationRate * accelInput * dt);
      }
      this.matTailLights.color.set('#991b1b');
    } else if (accelInput < -0.05) {
      // Reverse or Active Braking
      if (this.speed > 0.5) {
        // Heavy foot brake: light up bright red taillights!
        this.speed = Math.max(0, this.speed - this.brakeRate * Math.abs(accelInput) * dt);
        this.matTailLights.color.set('#ef4444');
      } else {
        // Reverse gear
        this.speed = Math.max(-this.maxReverseSpeed, this.speed - this.accelerationRate * 0.6 * Math.abs(accelInput) * dt);
        this.matTailLights.color.set('#dc2626');
      }
    } else {
      // Coasting friction deceleration
      const sign = Math.sign(this.speed);
      const decel = this.coastFriction * dt;
      if (Math.abs(this.speed) <= decel) {
        this.speed = 0;
      } else {
        this.speed -= sign * decel;
      }
      this.matTailLights.color.set('#7f1d1d');
    }

    // C. Yaw Rotation Kinematics (Bicycle Model with low-speed turning assist)
    // Turning rate is coupled to vehicle linear velocity. When stationary or pressed against an obstacle,
    // allow responsive steering pivot when throttle or reverse is applied so the car can always turn out of corners.
    let effectiveSpeedForTurn = this.speed;
    if (Math.abs(effectiveSpeedForTurn) <= 0.05 && Math.abs(input.moveZ) > 0.08 && Math.abs(this.steerAngle) > 0.02) {
      const isReverse = input.moveZ > 0.08;
      effectiveSpeedForTurn = isReverse ? -2.2 : 2.2;
    }

    if (Math.abs(effectiveSpeedForTurn) > 0.05) {
      const angularVelocity = (effectiveSpeedForTurn / this.wheelbase) * Math.sin(this.steerAngle);
      this.rotationY += angularVelocity * dt;
    }

    // D. Compute Forward Direction Vector
    const forwardX = Math.sin(this.rotationY);
    const forwardZ = Math.cos(this.rotationY);
    const forwardVec = new THREE.Vector3(forwardX, 0, forwardZ);

    // E. New Proposed Position
    const movement = forwardVec.multiplyScalar(this.speed * dt);
    const proposedPos = this.position.clone().add(movement);

    // F. Full Solid Collision Resolution
    const resolvedPos = this.collisionSystem.resolveMovement(
      this.position,
      proposedPos,
      this.vehicleRadius
    );

    // If collision prevented full movement, apply elastic bounce / stop
    const distMoved = this.position.distanceTo(resolvedPos);
    const expectedDist = Math.abs(this.speed * dt);
    if (expectedDist > 0.1 && distMoved < expectedDist * 0.3) {
      this.speed *= -0.2; // Gentle collision bump
    }

    this.position.copy(resolvedPos);
    this.position.y = 0; // STRICT GROUND CLAMPING: never floats or clips!

    // Apply to 3D Group Transform
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;

    // G. Front Wheel Visual Steering Pivot
    this.frontLeftWheelPivot.rotation.y = this.steerAngle;
    this.frontRightWheelPivot.rotation.y = this.steerAngle;

    // H. Wheel Rolling Rotation proportional to speed
    const wheelRotDelta = (this.speed * dt) / this.wheelRadius;
    this.frontLeftWheel.rotation.x += wheelRotDelta;
    this.frontRightWheel.rotation.x += wheelRotDelta;
    this.rearLeftWheel.rotation.x += wheelRotDelta;
    this.rearRightWheel.rotation.x += wheelRotDelta;

    // I. Chassis Suspension Dynamics (subtle pitch on acceleration/braking)
    const pitchLean = -this.speed * 0.008;
    this.chassisMesh.rotation.x = THREE.MathUtils.lerp(this.chassisMesh.rotation.x, pitchLean, dt * 8.0);

    // J. Update Audio Pitch
    this.updateAudioPitch();
  }

  // ==========================================
  // Web Audio Procedural Engine Sound System
  // ==========================================
  private initAudioEngine(): void {
    if (typeof window === 'undefined') return;
    try {
      this.audioCtx = audioManager.getAudioContext();
      if (!this.audioCtx) return;

      const vehicleNode = audioManager.getVehicleInputNode();
      if (!vehicleNode) return;

      if (this.engineOsc) {
        try {
          this.engineOsc.stop();
          this.engineOsc.disconnect();
        } catch {}
      }

      // Engine Oscillator (Low rumble)
      this.engineOsc = this.audioCtx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, this.audioCtx.currentTime);

      // Low-pass filter for deep engine exhaust tone
      this.engineFilter = this.audioCtx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(140, this.audioCtx.currentTime);

      this.engineGain = this.audioCtx.createGain();
      const initialGain = this.isPaused || this.isMuted || audioManager.getIsMuted() || audioManager.getIsPaused() ? 0.0 : 0.08;
      this.engineGain.gain.setValueAtTime(initialGain, this.audioCtx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(vehicleNode);

      this.engineOsc.start();
      this.isAudioRunning = true;
    } catch {
      // Graceful fallback
    }
  }

  private updateAudioPitch(): void {
    if (!this.isAudioRunning || !this.audioCtx || !this.engineOsc || !this.engineFilter) return;

    const absSpeed = Math.abs(this.speed);
    const speedRatio = absSpeed / this.maxForwardSpeed;

    // Dynamic pitch: 45Hz idle -> 140Hz top speed
    const targetFreq = 45 + speedRatio * 95;
    const targetFilter = 140 + speedRatio * 260;

    const now = this.audioCtx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(targetFilter, now, 0.08);
  }

  private stopAudioEngine(): void {
    if (this.engineGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.engineGain.gain.setTargetAtTime(0, now, 0.15);
      setTimeout(() => {
        try {
          this.engineOsc?.stop();
          this.engineOsc?.disconnect();
          this.isAudioRunning = false;
        } catch {}
      }, 200);
    }
  }

  public playCarStartSound(): void {
    if (!this.audioCtx || this.isMuted || this.isPaused || audioManager.getIsMuted() || audioManager.getIsPaused()) return;
    const vehicleNode = audioManager.getVehicleInputNode();
    if (!vehicleNode) return;

    try {
      const starterOsc = this.audioCtx.createOscillator();
      const starterGain = this.audioCtx.createGain();
      starterOsc.type = 'sine';
      starterOsc.frequency.setValueAtTime(120, this.audioCtx.currentTime);
      starterOsc.frequency.exponentialRampToValueAtTime(45, this.audioCtx.currentTime + 0.35);

      starterGain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      starterGain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.35);

      starterOsc.connect(starterGain);
      starterGain.connect(vehicleNode);

      starterOsc.start();
      starterOsc.stop(this.audioCtx.currentTime + 0.35);
    } catch {}
  }

  public playHorn(): void {
    if (this.isMuted || audioManager.getIsMuted()) return;
    if (!this.audioCtx) {
      this.initAudioEngine();
    }
    if (!this.audioCtx) return;
    const vehicleNode = audioManager.getVehicleInputNode();
    if (!vehicleNode) return;

    try {
      // Dual tone classic automotive horn (400Hz + 500Hz)
      const now = this.audioCtx.currentTime;
      [400, 505].forEach(freq => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(vehicleNode);
        osc.start(now);
        osc.stop(now + 0.4);
      });
    } catch {}
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    const shouldMute = this.isMuted || audioManager.getIsMuted();
    if (this.engineGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.engineGain.gain.cancelScheduledValues(now);
      this.engineGain.gain.setValueAtTime(this.engineGain.gain.value, now);
      const targetGain = (paused || shouldMute || !this.isOccupied) ? 0.0 : 0.08;
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.04);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    const shouldMute = muted || audioManager.getIsMuted();
    if (this.engineGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.engineGain.gain.cancelScheduledValues(now);
      this.engineGain.gain.setValueAtTime(this.engineGain.gain.value, now);
      const targetGain = (shouldMute || this.isPaused || !this.isOccupied) ? 0.0 : 0.08;
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.02);
    }
  }

  public setPassenger(hasPassenger: boolean): void {
    if (this.passengerAyyagaruGroup) {
      this.passengerAyyagaruGroup.visible = hasPassenger;
    }
  }

  public hasPassenger(): boolean {
    return this.passengerAyyagaruGroup?.visible ?? false;
  }

  public getPassengerAyyagaruGroup(): THREE.Group | null {
    return this.passengerAyyagaruGroup;
  }

  /**
   * Retrieves the seat anchor node by ID:
   * 'driver' | 'front_passenger' | 'rear_left' | 'rear_center' | 'rear_right'
   */
  public getSeatAnchor(seatId: string): THREE.Group | undefined {
    return this.seatAnchors.get(seatId);
  }

  /**
   * Computes the real-time world position and orientation of the specified seat anchor.
   * Characters aligned to this anchor move synchronously with the vehicle chassis.
   */
  public getSeatWorldTransform(seatId: string): { position: THREE.Vector3; quaternion: THREE.Quaternion; rotationY: number } {
    const anchor = this.seatAnchors.get(seatId);
    if (!anchor) {
      return {
        position: this.getPosition(),
        quaternion: this.group.quaternion.clone(),
        rotationY: this.getRotationY(),
      };
    }
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    anchor.getWorldPosition(worldPos);
    anchor.getWorldQuaternion(worldQuat);
    return {
      position: worldPos,
      quaternion: worldQuat,
      rotationY: this.getRotationY(),
    };
  }

  public dispose(): void {
    this.stopAudioEngine();
    this.collisionSystem.removeCollider('player_parked_car');
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
  }
}
