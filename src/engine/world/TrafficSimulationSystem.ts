/**
 * THE KATHA - Ambient NPC Traffic Simulation System
 *
 * Veteran open-world civil & traffic simulation engine:
 * - Ambient NPC traffic: Cars (Sedans, SUVs, Hatchbacks), Motorcycles, Scooters, Auto-Rickshaws
 * - Lane-following along Highway (NH-65) and City Grand Avenue
 * - Distance-based follow kinematics (car-following model) preventing collisions and maintaining safe spacing
 * - Rotating wheels based on vehicle velocity
 * - Headlights & red taillights with dusk/dawn emissive glow
 * - Highly optimized: shared materials, zero garbage collection allocation per tick, 60+ FPS
 */

import * as THREE from 'three';
import { CollisionCollider } from '../collisions/CollisionSystem';
import { adaptiveGraphics } from '../../core/graphics/AdaptiveGraphicsManager';

export type VehicleCategory = 'sedan' | 'suv' | 'hatchback' | 'motorcycle' | 'scooter' | 'autorickshaw';

interface TrafficLane {
  id: string;
  spline: THREE.CatmullRomCurve3;
  totalLength: number;
  speedLimit: number; // m/s
  vehicles: SimulatedVehicle[];
}

interface SimulatedVehicle {
  id: string;
  type: VehicleCategory;
  group: THREE.Group;
  wheelMeshes: THREE.Mesh[];
  wheelRadius: number;
  lane: TrafficLane;
  distanceAlongLane: number;
  currentSpeed: number;
  targetSpeed: number;
  length: number;
  safeFollowDistance: number;
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
}

export class TrafficSimulationSystem {
  public group: THREE.Group;
  private lanes: TrafficLane[] = [];
  private vehicles: SimulatedVehicle[] = [];

  // Scratch memory to avoid GC allocations
  private scratchPos: THREE.Vector3 = new THREE.Vector3();
  private scratchTangent: THREE.Vector3 = new THREE.Vector3();

  // Shared Materials
  private matTireRubber: THREE.MeshLambertMaterial;
  private matRimSilver: THREE.MeshLambertMaterial;
  private matWindowTint: THREE.MeshStandardMaterial;
  private matHeadlightGlow: THREE.MeshBasicMaterial;
  private matTaillightRed: THREE.MeshBasicMaterial;
  private matChrome: THREE.MeshStandardMaterial;
  private matRickshawCanvas: THREE.MeshLambertMaterial;
  private matRickshawGreen: THREE.MeshLambertMaterial;

  // Car Paint Palette
  private carPaints: THREE.MeshLambertMaterial[];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'traffic_simulation_system';

    // Shared Materials
    this.matTireRubber = new THREE.MeshLambertMaterial({ color: '#1c1917' });
    this.matRimSilver = new THREE.MeshLambertMaterial({ color: '#94a3b8' });
    this.matWindowTint = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      metalness: 0.9,
      roughness: 0.1,
    });
    this.matHeadlightGlow = new THREE.MeshBasicMaterial({ color: '#fef08a' });
    this.matTaillightRed = new THREE.MeshBasicMaterial({ color: '#ef4444' });
    this.matChrome = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      metalness: 0.8,
      roughness: 0.2,
    });
    this.matRickshawCanvas = new THREE.MeshLambertMaterial({ color: '#eab308' }); // Yellow hood
    this.matRickshawGreen = new THREE.MeshLambertMaterial({ color: '#15803d' });  // Green body

    this.carPaints = [
      new THREE.MeshLambertMaterial({ color: '#f8fafc' }), // Pearl White
      new THREE.MeshLambertMaterial({ color: '#94a3b8' }), // Metallic Silver
      new THREE.MeshLambertMaterial({ color: '#dc2626' }), // Crimson Red
      new THREE.MeshLambertMaterial({ color: '#2563eb' }), // Sapphire Blue
      new THREE.MeshLambertMaterial({ color: '#1e293b' }), // Obsidian Black
      new THREE.MeshLambertMaterial({ color: '#eab308' }), // Golden Yellow
    ];

    this.initializeLanes();
    this.spawnTrafficFleet();
  }

  /**
   * Defines traffic navigation corridors:
   * Lane 1: Highway Outbound & City North Loop
   * Lane 2: City South & Highway Inbound Loop
   */
  private initializeLanes(): void {
    // 1. OUTBOUND HIGHWAY TO CITY BOULEVARD (Eastbound then Northbound)
    // Offset slightly left/outward in the driving direction
    const outboundPoints = [
      new THREE.Vector3(25, 0.05, 59.2),   // Rural highway start
      new THREE.Vector3(75, 0.05, 59.2),
      new THREE.Vector3(120, 0.05, 57.2),
      new THREE.Vector3(160, 0.05, 51.5),
      new THREE.Vector3(188, 0.05, 39.5),  // City entrance bend
      new THREE.Vector3(204, 0.05, 21.5),  // Boulevard merge
      new THREE.Vector3(206.5, 0.05, 0),   // City Avenue northbound
      new THREE.Vector3(206.5, 0.05, -45), // Intersection
      new THREE.Vector3(206.5, 0.05, -90),
      new THREE.Vector3(206.5, 0.05, -135), // North city turn-around
      new THREE.Vector3(210.0, 0.05, -145), // U-turn apex
      new THREE.Vector3(213.5, 0.05, -135), // Merge into southbound
    ];

    // 2. INBOUND HIGHWAY FROM CITY BOULEVARD (Southbound then Westbound)
    const inboundPoints = [
      new THREE.Vector3(213.5, 0.05, -135), // City Avenue southbound
      new THREE.Vector3(213.5, 0.05, -90),
      new THREE.Vector3(213.5, 0.05, -45),
      new THREE.Vector3(213.5, 0.05, 0),
      new THREE.Vector3(211.0, 0.05, 18.0),
      new THREE.Vector3(196.0, 0.05, 33.5), // Highway bend westbound
      new THREE.Vector3(160, 0.05, 44.5),
      new THREE.Vector3(120, 0.05, 50.8),
      new THREE.Vector3(75, 0.05, 52.8),
      new THREE.Vector3(25, 0.05, 52.8),   // Rural highway end
      new THREE.Vector3(18, 0.05, 56.0),   // U-turn loop
      new THREE.Vector3(25, 0.05, 59.2),   // Reconnect to outbound
    ];

    // Build Continuous Closed Loop Curve for Highway & City
    const continuousLoopPoints = [
      new THREE.Vector3(25, 0.05, 59.2),
      new THREE.Vector3(75, 0.05, 59.2),
      new THREE.Vector3(120, 0.05, 57.2),
      new THREE.Vector3(160, 0.05, 51.5),
      new THREE.Vector3(188, 0.05, 39.5),
      new THREE.Vector3(204, 0.05, 21.5),
      new THREE.Vector3(206.5, 0.05, 0),
      new THREE.Vector3(206.5, 0.05, -45),
      new THREE.Vector3(206.5, 0.05, -90),
      new THREE.Vector3(206.5, 0.05, -135),
      new THREE.Vector3(210.0, 0.05, -145),
      new THREE.Vector3(213.5, 0.05, -135),
      new THREE.Vector3(213.5, 0.05, -90),
      new THREE.Vector3(213.5, 0.05, -45),
      new THREE.Vector3(213.5, 0.05, 0),
      new THREE.Vector3(211.0, 0.05, 18.0),
      new THREE.Vector3(196.0, 0.05, 33.5),
      new THREE.Vector3(160, 0.05, 44.5),
      new THREE.Vector3(120, 0.05, 50.8),
      new THREE.Vector3(75, 0.05, 52.8),
      new THREE.Vector3(25, 0.05, 52.8),
      new THREE.Vector3(16, 0.05, 56.0),
    ];

    const highwaySpline = new THREE.CatmullRomCurve3(continuousLoopPoints, true, 'centripetal');
    const highwayLane: TrafficLane = {
      id: 'highway_city_main_loop',
      spline: highwaySpline,
      totalLength: highwaySpline.getLength(),
      speedLimit: 14.5, // 52 km/h
      vehicles: [],
    };
    this.lanes.push(highwayLane);

    // 3. CITY CROSS STREET LOCAL TRAFFIC LOOP (Around Commercial Boulevard)
    const cityLoopPoints = [
      new THREE.Vector3(175, 0.05, -42.0),
      new THREE.Vector3(202, 0.05, -42.0),
      new THREE.Vector3(228, 0.05, -42.0),
      new THREE.Vector3(255, 0.05, -42.0),
      new THREE.Vector3(260, 0.05, -48.0),
      new THREE.Vector3(255, 0.05, -48.0),
      new THREE.Vector3(228, 0.05, -48.0),
      new THREE.Vector3(202, 0.05, -48.0),
      new THREE.Vector3(175, 0.05, -48.0),
      new THREE.Vector3(170, 0.05, -45.0),
    ];
    const citySpline = new THREE.CatmullRomCurve3(cityLoopPoints, true, 'centripetal');
    const cityLane: TrafficLane = {
      id: 'city_cross_street_loop',
      spline: citySpline,
      totalLength: citySpline.getLength(),
      speedLimit: 9.0, // 32 km/h
      vehicles: [],
    };
    this.lanes.push(cityLane);
  }

  /**
   * Spawns an optimized, diverse fleet of vehicles with even initial spacing
   */
  private spawnTrafficFleet(): void {
    const mainLane = this.lanes[0];

    // Vehicles configured along the main Highway-City loop (Length ~560m)
    // 10 Vehicles evenly staggered
    const fleetConfigs: Array<{ type: VehicleCategory; paintIdx: number; speed: number }> = [
      { type: 'sedan', paintIdx: 0, speed: 14.0 },       // White Sedan
      { type: 'motorcycle', paintIdx: 4, speed: 15.0 },  // Black Motorbike
      { type: 'suv', paintIdx: 4, speed: 13.5 },         // Charcoal SUV
      { type: 'autorickshaw', paintIdx: 5, speed: 10.5 },// Auto Rickshaw
      { type: 'sedan', paintIdx: 2, speed: 14.5 },       // Red Sedan
      { type: 'scooter', paintIdx: 3, speed: 12.0 },     // Blue Scooter
      { type: 'hatchback', paintIdx: 5, speed: 13.0 },   // Yellow Hatchback
      { type: 'sedan', paintIdx: 1, speed: 14.0 },       // Silver Sedan
      { type: 'motorcycle', paintIdx: 2, speed: 15.5 },  // Red Motorbike
      { type: 'suv', paintIdx: 3, speed: 13.5 },         // Blue SUV
    ];

    const spacing = mainLane.totalLength / fleetConfigs.length;

    fleetConfigs.forEach((cfg, idx) => {
      const vehicle = this.createVehicleMesh(cfg.type, cfg.paintIdx);
      vehicle.lane = mainLane;
      vehicle.distanceAlongLane = idx * spacing;
      vehicle.currentSpeed = cfg.speed;
      vehicle.targetSpeed = cfg.speed;

      mainLane.vehicles.push(vehicle);
      this.vehicles.push(vehicle);
      this.group.add(vehicle.group);
    });

    // 2 Vehicles on the local City Cross-Street Loop
    const cityLane = this.lanes[1];
    const cityFleetConfigs: Array<{ type: VehicleCategory; paintIdx: number; speed: number }> = [
      { type: 'autorickshaw', paintIdx: 5, speed: 8.5 },
      { type: 'hatchback', paintIdx: 0, speed: 9.0 },
    ];
    const citySpacing = cityLane.totalLength / cityFleetConfigs.length;

    cityFleetConfigs.forEach((cfg, idx) => {
      const vehicle = this.createVehicleMesh(cfg.type, cfg.paintIdx);
      vehicle.lane = cityLane;
      vehicle.distanceAlongLane = idx * citySpacing;
      vehicle.currentSpeed = cfg.speed;
      vehicle.targetSpeed = cfg.speed;

      cityLane.vehicles.push(vehicle);
      this.vehicles.push(vehicle);
      this.group.add(vehicle.group);
    });
  }

  /**
   * Procedurally generates a lightweight 3D vehicle model based on category
   */
  private createVehicleMesh(type: VehicleCategory, paintIdx: number): SimulatedVehicle {
    const group = new THREE.Group();
    const wheelMeshes: THREE.Mesh[] = [];
    const headlights: THREE.Mesh[] = [];
    const taillights: THREE.Mesh[] = [];
    const paintMat = this.carPaints[paintIdx % this.carPaints.length];

    let length = 4.2;
    let wheelRadius = 0.32;
    let safeFollowDistance = 11.0;

    if (type === 'sedan') {
      length = 4.4;
      wheelRadius = 0.32;
      safeFollowDistance = 11.0;

      // Lower chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.65, 4.4), paintMat);
      chassis.position.y = 0.55;
      chassis.castShadow = true;
      group.add(chassis);

      // Cabin roof & tinted glass
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2.4), this.matWindowTint);
      cabin.position.set(0, 1.15, -0.2);
      cabin.castShadow = true;
      group.add(cabin);

      // 4 Wheels
      [[-0.95, -1.35], [0.95, -1.35], [-0.95, 1.35], [0.95, 1.35]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12), this.matTireRubber);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.32, wz);
        wheel.castShadow = true;
        group.add(wheel);
        wheelMeshes.push(wheel);
      });

      // Front Headlights
      [-0.65, 0.65].forEach(hx => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), this.matHeadlightGlow);
        hl.position.set(hx, 0.6, 2.22);
        group.add(hl);
        headlights.push(hl);
      });

      // Rear Taillights
      [-0.65, 0.65].forEach(tx => {
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), this.matTaillightRed);
        tl.position.set(tx, 0.65, -2.22);
        group.add(tl);
        taillights.push(tl);
      });
    } else if (type === 'suv') {
      length = 4.8;
      wheelRadius = 0.38;
      safeFollowDistance = 12.5;

      // Higher, bulkier chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 4.8), paintMat);
      chassis.position.y = 0.75;
      chassis.castShadow = true;
      group.add(chassis);

      // Tall cabin
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.75, 3.1), this.matWindowTint);
      cabin.position.set(0, 1.45, -0.3);
      cabin.castShadow = true;
      group.add(cabin);

      // Roof Rails
      [-0.75, 0.75].forEach(rx => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 2.6), this.matChrome);
        rail.position.set(rx, 1.88, -0.3);
        group.add(rail);
      });

      // 4 SUV Wheels
      [[-1.02, -1.45], [1.02, -1.45], [-1.02, 1.45], [1.02, 1.45]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.26, 12), this.matTireRubber);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.38, wz);
        wheel.castShadow = true;
        group.add(wheel);
        wheelMeshes.push(wheel);
      });

      // Dual Headlights
      [-0.7, 0.7].forEach(hx => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.05), this.matHeadlightGlow);
        hl.position.set(hx, 0.8, 2.42);
        group.add(hl);
        headlights.push(hl);
      });

      [-0.7, 0.7].forEach(tx => {
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.05), this.matTaillightRed);
        tl.position.set(tx, 0.85, -2.42);
        group.add(tl);
        taillights.push(tl);
      });
    } else if (type === 'hatchback') {
      length = 3.7;
      wheelRadius = 0.3;
      safeFollowDistance = 9.5;

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.65, 3.7), paintMat);
      chassis.position.y = 0.55;
      chassis.castShadow = true;
      group.add(chassis);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 2.0), this.matWindowTint);
      cabin.position.set(0, 1.12, -0.3);
      cabin.castShadow = true;
      group.add(cabin);

      [[-0.9, -1.15], [0.9, -1.15], [-0.9, 1.15], [0.9, 1.15]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12), this.matTireRubber);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.3, wz);
        group.add(wheel);
        wheelMeshes.push(wheel);
      });

      [-0.6, 0.6].forEach(hx => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.05), this.matHeadlightGlow);
        hl.position.set(hx, 0.6, 1.87);
        group.add(hl);
        headlights.push(hl);
      });

      [-0.6, 0.6].forEach(tx => {
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.05), this.matTaillightRed);
        tl.position.set(tx, 0.65, -1.87);
        group.add(tl);
        taillights.push(tl);
      });
    } else if (type === 'motorcycle') {
      length = 2.2;
      wheelRadius = 0.32;
      safeFollowDistance = 6.5;

      // Motorbike frame & tank
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 1.8), this.matChrome);
      frame.position.y = 0.55;
      group.add(frame);

      const tank = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.7), paintMat);
      tank.position.set(0, 0.85, 0.2);
      group.add(tank);

      // Handlebars
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.05, 0.05), this.matChrome);
      bar.position.set(0, 1.1, 0.65);
      group.add(bar);

      // Rider mannequin (Simplified low-poly commuter)
      const riderBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.4), new THREE.MeshLambertMaterial({ color: '#1e293b' }));
      riderBody.position.set(0, 1.25, -0.2);
      group.add(riderBody);

      const riderHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshLambertMaterial({ color: '#f59e0b' }));
      riderHelmet.position.set(0, 1.75, -0.15);
      group.add(riderHelmet);

      // Front & Rear Spoked Wheels
      [0.9, -0.9].forEach(wz => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 10), this.matTireRubber);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(0, 0.32, wz);
        group.add(wheel);
        wheelMeshes.push(wheel);
      });

      // Single Round Headlight
      const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10), this.matHeadlightGlow);
      hl.rotation.x = Math.PI / 2;
      hl.position.set(0, 0.95, 1.05);
      group.add(hl);
      headlights.push(hl);

      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.05), this.matTaillightRed);
      tl.position.set(0, 0.75, -1.05);
      group.add(tl);
      taillights.push(tl);
    } else if (type === 'scooter') {
      length = 1.9;
      wheelRadius = 0.24;
      safeFollowDistance = 6.0;

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 1.6), paintMat);
      body.position.y = 0.45;
      group.add(body);

      const riderBody = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.7, 0.35), new THREE.MeshLambertMaterial({ color: '#475569' }));
      riderBody.position.set(0, 1.15, -0.2);
      group.add(riderBody);

      const riderHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshLambertMaterial({ color: '#38bdf8' }));
      riderHelmet.position.set(0, 1.65, -0.15);
      group.add(riderHelmet);

      [0.7, -0.7].forEach(wz => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 10), this.matTireRubber);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(0, 0.24, wz);
        group.add(wheel);
        wheelMeshes.push(wheel);
      });

      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.05), this.matHeadlightGlow);
      hl.position.set(0, 0.85, 0.82);
      group.add(hl);
      headlights.push(hl);

      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.05), this.matTaillightRed);
      tl.position.set(0, 0.65, -0.82);
      group.add(tl);
      taillights.push(tl);
    } else if (type === 'autorickshaw') {
      length = 2.8;
      wheelRadius = 0.28;
      safeFollowDistance = 8.0;

      // Lower green metal cabin body
      const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 2.6), this.matRickshawGreen);
      lowerBody.position.y = 0.6;
      group.add(lowerBody);

      // Yellow curved canvas roof canopy
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.6, 2.2), this.matRickshawCanvas);
      roof.position.set(0, 1.45, -0.15);
      group.add(roof);

      // Front single wheel
      const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.14, 10), this.matTireRubber);
      frontWheel.rotation.z = Math.PI / 2;
      frontWheel.position.set(0, 0.28, 1.1);
      group.add(frontWheel);
      wheelMeshes.push(frontWheel);

      // Rear 2 wheels
      [-0.72, 0.72].forEach(wx => {
        const rearWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.14, 10), this.matTireRubber);
        rearWheel.rotation.z = Math.PI / 2;
        rearWheel.position.set(wx, 0.28, -0.9);
        group.add(rearWheel);
        wheelMeshes.push(rearWheel);
      });

      // Front Headlight
      const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 12), this.matHeadlightGlow);
      hl.rotation.x = Math.PI / 2;
      hl.position.set(0, 0.75, 1.32);
      group.add(hl);
      headlights.push(hl);

      [-0.5, 0.5].forEach(tx => {
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.05), this.matTaillightRed);
        tl.position.set(tx, 0.7, -1.32);
        group.add(tl);
        taillights.push(tl);
      });
    }

    return {
      id: `traffic_${type}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      group,
      wheelMeshes,
      wheelRadius,
      lane: null as any,
      distanceAlongLane: 0,
      currentSpeed: 12.0,
      targetSpeed: 12.0,
      length,
      safeFollowDistance,
      headlights,
      taillights,
    };
  }

  /**
   * Main Traffic Simulation Tick:
   * 1. Distance checking & car-following deceleration (no crashes, realistic spacing)
   * 2. Ramu pedestrian obstacle detection & proactive braking (vehicles never drive through Ramu)
   * 3. Spline progress & position evaluation
   * 4. Heading rotation (aligned with lane tangent)
   * 5. Wheel rotation physics proportional to speed
   */
  public update(delta: number, ramuPosition?: THREE.Vector3, playerCarPos?: THREE.Vector3): void {
    const dt = Math.min(delta, 0.1); // Clamp large delta steps

    for (const lane of this.lanes) {
      const numVehicles = lane.vehicles.length;
      if (numVehicles === 0) continue;

      // Sort lane vehicles along their distance to easily find vehicle ahead
      lane.vehicles.sort((a, b) => a.distanceAlongLane - b.distanceAlongLane);

      for (let i = 0; i < numVehicles; i++) {
        const v = lane.vehicles[i];
        const frontIndex = (i + 1) % numVehicles;
        const frontV = lane.vehicles[frontIndex];

        // Calculate gap along the lane
        let gap = frontV.distanceAlongLane - v.distanceAlongLane;
        if (gap < 0) {
          // Account for loop wrap-around
          gap += lane.totalLength;
        }

        // 1. Check for Ramu as a pedestrian or the Player's vehicle as an obstacle ahead on the road
        let obstacleTargetSpeed = Infinity;
        let isEmergencyBrake = false;

        // Check player vehicle obstacle first if driving, or Ramu pedestrian
        const obstaclePos = playerCarPos || ramuPosition;
        const obstacleIsVehicle = !!playerCarPos;

        if (obstaclePos) {
          const dx = obstaclePos.x - v.group.position.x;
          const dz = obstaclePos.z - v.group.position.z;
          const distSq = dx * dx + dz * dz;

          // Check if obstacle is anywhere within 28 meters
          if (distSq < 784) {
            const headingY = v.group.rotation.y;
            const fwdX = Math.sin(headingY);
            const fwdZ = Math.cos(headingY);

            // Vector projection: longitudinal distance along vehicle heading
            const longDist = dx * fwdX + dz * fwdZ;
            // Lateral offset perpendicular to vehicle heading
            const latDist = Math.abs(-dx * fwdZ + dz * fwdX);

            const corridorWidth = obstacleIsVehicle ? 3.4 : 2.6;
            const lookAheadDist = obstacleIsVehicle ? 22.0 : 16.0;
            const stopDist = obstacleIsVehicle ? 5.5 : 4.2;

            // If obstacle is ahead in the lane corridor
            if (longDist > -1.5 && longDist < lookAheadDist && latDist < corridorWidth) {
              if (longDist < stopDist) {
                // Obstacle is immediately in front: full immediate stop
                obstacleTargetSpeed = 0;
                isEmergencyBrake = true;
              } else {
                // Obstacle is approaching ahead: slow down proportionally
                obstacleTargetSpeed = Math.max(0, (longDist - stopDist) * 1.8);
              }
            }
          }
        }

        // 2. CAR-FOLLOWING MODEL
        const minGap = v.safeFollowDistance;
        let carFollowSpeed = Math.min(v.targetSpeed, lane.speedLimit);

        if (gap < minGap) {
          // Approaching vehicle ahead -> smoothly decelerate to match or avoid
          const decelerationFactor = Math.max(0, (gap - 2.0) / minGap);
          carFollowSpeed = frontV.currentSpeed * decelerationFactor;
        }

        // Blend target speeds
        const desiredSpeed = Math.min(carFollowSpeed, obstacleTargetSpeed);

        if (isEmergencyBrake) {
          // Rapid deceleration to stop before obstacle
          v.currentSpeed = THREE.MathUtils.lerp(v.currentSpeed, 0, dt * 9.0);
        } else if (desiredSpeed < v.currentSpeed) {
          // Smooth brake
          v.currentSpeed = THREE.MathUtils.lerp(v.currentSpeed, desiredSpeed, dt * 4.0);
        } else {
          // Smooth acceleration
          v.currentSpeed = THREE.MathUtils.lerp(v.currentSpeed, desiredSpeed, dt * 1.8);
        }

        if (v.currentSpeed < 0.05) {
          v.currentSpeed = 0;
        }

        // Advance along lane only if moving
        if (v.currentSpeed > 0.001) {
          v.distanceAlongLane = (v.distanceAlongLane + v.currentSpeed * dt) % lane.totalLength;
          const normT = v.distanceAlongLane / lane.totalLength;

          // Evaluate 3D position and tangent on spline
          lane.spline.getPointAt(normT, this.scratchPos);
          lane.spline.getTangentAt(normT, this.scratchTangent);

          v.group.position.copy(this.scratchPos);

          // Yaw orientation facing along tangent direction
          const yaw = Math.atan2(this.scratchTangent.x, this.scratchTangent.z);
          v.group.rotation.set(0, yaw, 0);

          // Spin wheels dynamically based on actual movement speed (LOD: skip for distant vehicles)
          const config = adaptiveGraphics.getConfig();
          let shouldSpinWheels = true;
          if (ramuPosition) {
            const dx = v.group.position.x - ramuPosition.x;
            const dz = v.group.position.z - ramuPosition.z;
            if (dx * dx + dz * dz > config.trafficLODDistanceSq) {
              shouldSpinWheels = false;
            }
          }

          if (shouldSpinWheels) {
            const wheelAngularDelta = (v.currentSpeed * dt) / v.wheelRadius;
            for (const wheel of v.wheelMeshes) {
              wheel.rotation.x += wheelAngularDelta;
            }
          }
        }
      }
    }
  }

  /**
   * Generates dynamic physical bounding boxes for all active vehicles.
   * Registered with CollisionSystem so Ramu physically collides with vehicles and cannot walk through them.
   */
  public getVehicleColliders(): CollisionCollider[] {
    const colliders: CollisionCollider[] = [];

    for (const lane of this.lanes) {
      for (const v of lane.vehicles) {
        let width = 2.0;
        let height = 1.5;
        let length = v.length || 4.2;

        if (v.type === 'suv') {
          width = 2.2;
          height = 1.8;
          length = 4.8;
        } else if (v.type === 'autorickshaw') {
          width = 1.5;
          height = 1.8;
          length = 2.8;
        } else if (v.type === 'motorcycle' || v.type === 'scooter') {
          width = 1.0;
          height = 1.4;
          length = 2.2;
        }

        colliders.push({
          id: `dyn_veh_${v.id}`,
          type: 'box',
          position: v.group.position.clone(),
          size: new THREE.Vector3(width, height, length),
          rotationY: v.group.rotation.y,
        });
      }
    }

    return colliders;
  }

  /**
   * Evaluates meaningful physical collision between the player's vehicle and any simulated traffic vehicle.
   * Excludes terrain, road, decorative items, invisible triggers, and player internal components.
   * Only returns true for actual physical crashes between vehicles.
   */
  public checkPlayerCarCollision(
    carPos: THREE.Vector3,
    carRadius: number = 1.35,
    carSpeed: number = 0
  ): { hasCrashed: boolean; vehicleType?: VehicleCategory; relativeSpeed?: number; contactVehicleId?: string; pushDirection?: THREE.Vector3 } {
    for (const lane of this.lanes) {
      for (const v of lane.vehicles) {
        const vPos = v.group.position;
        const dx = carPos.x - vPos.x;
        const dz = carPos.z - vPos.z;
        const distSq = dx * dx + dz * dz;

        // Radii by vehicle category
        let vehRadius = 1.4;
        if (v.type === 'suv' || v.type === 'sedan') vehRadius = 1.7;
        else if (v.type === 'autorickshaw') vehRadius = 1.25;
        else if (v.type === 'motorcycle' || v.type === 'scooter') vehRadius = 0.95;

        const combinedRadius = carRadius + vehRadius;
        if (distSq < combinedRadius * combinedRadius) {
          const actualDist = Math.max(0.01, Math.sqrt(distSq));
          const relativeSpeed = Math.abs(carSpeed) + v.currentSpeed;

          // Meaningful impact check:
          // Either direct physical overlap (< 85% of radius) OR dynamic impact speed > 2.2 m/s (~8 km/h)
          if (actualDist < combinedRadius * 0.85 || relativeSpeed > 2.2) {
            const pushX = dx / actualDist;
            const pushZ = dz / actualDist;
            return {
              hasCrashed: true,
              vehicleType: v.type,
              relativeSpeed,
              contactVehicleId: v.id,
              pushDirection: new THREE.Vector3(pushX, 0, pushZ),
            };
          }
        }
      }
    }

    return { hasCrashed: false };
  }

  /**
   * Resets all traffic vehicle positions along their lanes with safe staggering.
   * Cleanses the road so the player has a clear restart environment without instant collisions.
   */
  public resetTrafficFleet(): void {
    for (const lane of this.lanes) {
      if (lane.vehicles.length === 0) continue;
      const spacing = lane.totalLength / lane.vehicles.length;
      lane.vehicles.forEach((v, idx) => {
        v.distanceAlongLane = idx * spacing + (spacing * 0.35); // offset safely from village junction
        if (v.distanceAlongLane >= lane.totalLength) {
          v.distanceAlongLane -= lane.totalLength;
        }
        v.currentSpeed = v.targetSpeed;
        const pt = lane.spline.getPointAt(v.distanceAlongLane / lane.totalLength);
        v.group.position.copy(pt);
      });
    }
  }

  public dispose(): void {
    // Clean up scene nodes
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
  }
}
