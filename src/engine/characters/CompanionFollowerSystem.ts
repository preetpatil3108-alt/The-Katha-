/**
 * THE KATHA - Companion Follower System
 * Controls the four NPC companions (Chintu, Bhavani, Varun, Deepa) who follow Ramu.
 *
 * Strict Follower Constraints:
 * - Walk behind Ramu in natural staggered formation
 * - Maintain spacing (flocking separation prevents overlapping)
 * - Never teleport (continuous kinematic physics with delta-time velocity)
 * - Never walk through Ramu (repulsive boundary around Ramu)
 * - Avoid major objects (full integration with CollisionSystem)
 * - Stop when Ramu stops; follow when Ramu moves
 * - Strictly NPC: only Ramu is player-controlled
 */

import * as THREE from 'three';
import { CharacterConfig, CharacterId } from '../../types/game';
import { ProceduralCharacterMesh } from './ProceduralCharacterMesh';
import { CollisionSystem } from '../collisions/CollisionSystem';

export type CompanionCarState = 'outside' | 'approaching_door' | 'stepping_in' | 'seated';

export interface CompanionAgent {
  id: CharacterId;
  config: CharacterConfig;
  mesh: ProceduralCharacterMesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: number;
  offsetDistance: number; // Distance along Ramu's wake
  lateralOffset: number; // Lateral offset left (-) or right (+)
  // Car boarding and passenger seating
  carState: CompanionCarState;
  stepTimer: number;
  doorLocal: THREE.Vector3;
  seatLocal: THREE.Vector3;
  stuckTimer: number;
}

export class CompanionFollowerSystem {
  private companions: CompanionAgent[] = [];
  private collisionSystem: CollisionSystem;
  private ramuTrail: THREE.Vector3[] = [];
  private maxTrailLength: number = 80;
  private minTrailSpacing: number = 0.28; // meters between breadcrumbs
  public isCollectionMode: boolean = false;

  public getCompanions(): CompanionAgent[] {
    return this.companions;
  }

  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem;
  }

  /**
   * Register companion meshes and initial configuration
   */
  public registerCompanion(
    config: CharacterConfig,
    mesh: ProceduralCharacterMesh,
    initialPos: THREE.Vector3,
    initialRot: number,
    slotIndex: number
  ): void {
    // Staggered formation offsets behind Ramu
    const slotProfiles = [
      {
        offsetDistance: 2.2,
        lateralOffset: -0.9,
        doorLocal: new THREE.Vector3(1.35, 0, 0.2), // Front-Right door
        seatLocal: new THREE.Vector3(0.42, 1.09, -0.14), // Front-Passenger seat anchor
      },
      {
        offsetDistance: 2.5,
        lateralOffset: 0.9,
        doorLocal: new THREE.Vector3(1.35, 0, -0.85), // Rear-Right door
        seatLocal: new THREE.Vector3(0.45, 1.09, -0.84), // Rear-Right seat anchor
      },
      {
        offsetDistance: 4.1,
        lateralOffset: -1.2,
        doorLocal: new THREE.Vector3(-1.35, 0, -0.85), // Rear-Left door
        seatLocal: new THREE.Vector3(-0.45, 1.09, -0.84), // Rear-Left seat anchor
      },
      {
        offsetDistance: 4.4,
        lateralOffset: 1.2,
        doorLocal: new THREE.Vector3(0.0, 0, -2.35), // Rear entry tailgate
        seatLocal: new THREE.Vector3(0.0, 1.09, -0.84), // Rear-Center seat anchor
      },
    ];
    const profile = slotProfiles[slotIndex % slotProfiles.length];

    const agent: CompanionAgent = {
      id: config.id,
      config,
      mesh,
      position: initialPos.clone(),
      velocity: new THREE.Vector3(0, 0, 0),
      rotation: initialRot,
      offsetDistance: profile.offsetDistance,
      lateralOffset: profile.lateralOffset,
      carState: 'outside',
      stepTimer: 0,
      doorLocal: profile.doorLocal.clone(),
      seatLocal: profile.seatLocal.clone(),
      stuckTimer: 0,
    };

    mesh.group.position.copy(agent.position);
    mesh.group.rotation.y = agent.rotation;
    this.companions.push(agent);
  }

  /**
   * Record Ramu's position breadcrumbs to form a natural following trail
   */
  public recordRamuPosition(ramuPos: THREE.Vector3): void {
    if (this.ramuTrail.length === 0) {
      this.ramuTrail.push(ramuPos.clone());
      return;
    }

    const lastPos = this.ramuTrail[0];
    const distSq = lastPos.distanceToSquared(ramuPos);
    if (distSq >= this.minTrailSpacing * this.minTrailSpacing) {
      this.ramuTrail.unshift(ramuPos.clone());
      if (this.ramuTrail.length > this.maxTrailLength) {
        this.ramuTrail.pop();
      }
    }
  }

  /**
   * Compute the trailing target point along Ramu's wake
   */
  private getTargetPosition(
    agent: CompanionAgent,
    ramuPos: THREE.Vector3,
    ramuRotation: number,
    isRamuMoving: boolean
  ): THREE.Vector3 {
    if (!isRamuMoving || this.ramuTrail.length < 3) {
      // Ramu stopped: settle into an arc/semi-circle behind Ramu
      // Facing vector of Ramu
      const backwardX = -Math.sin(ramuRotation);
      const backwardZ = -Math.cos(ramuRotation);
      const rightX = Math.cos(ramuRotation);
      const rightZ = -Math.sin(ramuRotation);

      const targetX = ramuPos.x + backwardX * agent.offsetDistance + rightX * agent.lateralOffset;
      const targetZ = ramuPos.z + backwardZ * agent.offsetDistance + rightZ * agent.lateralOffset;
      return new THREE.Vector3(targetX, 0, targetZ);
    }

    // Ramu is moving: follow along the trail breadcrumbs
    let accumulatedDistance = 0;
    let targetIndex = 0;

    for (let i = 0; i < this.ramuTrail.length - 1; i++) {
      const segDist = this.ramuTrail[i].distanceTo(this.ramuTrail[i + 1]);
      accumulatedDistance += segDist;
      if (accumulatedDistance >= agent.offsetDistance) {
        targetIndex = i;
        break;
      }
    }

    const trailPoint = this.ramuTrail[targetIndex] || this.ramuTrail[this.ramuTrail.length - 1];

    // Compute trail tangent for lateral offset
    let tangent = new THREE.Vector3(0, 0, 1);
    if (targetIndex > 0) {
      tangent = this.ramuTrail[targetIndex - 1].clone().sub(trailPoint).normalize();
    } else if (this.ramuTrail.length > 1) {
      tangent = trailPoint.clone().sub(this.ramuTrail[1]).normalize();
    }

    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    return trailPoint.clone().add(normal.multiplyScalar(agent.lateralOffset));
  }

  /**
   * Set gestures for companions during cutscenes / dialogue / collection
   */
  public setCompanionGesture(
    id: CharacterId,
    gesture: 'none' | 'talk' | 'cheer' | 'explain' | 'wave' | 'nod' | 'pluck' | 'carry' | 'deposit'
  ): void {
    const agent = this.companions.find(c => c.id === id);
    if (agent) {
      agent.mesh.setGesture(gesture);
    }
  }

  /**
   * Main Follower System Update Tick
   * Executed once per physics frame. Strictly controls NPCs only.
   */
  public update(
    delta: number,
    ramuPos: THREE.Vector3,
    ramuRotation: number,
    isRamuMoving: boolean,
    isCutsceneActive: boolean = false
  ): void {
    // If companions are boarding or seated in the car, update their car positions
    if (this.isAnyBoardingOrSeated()) {
      this.updateCarBoarding(delta, ramuPos, ramuRotation);
      return;
    }

    if (isCutsceneActive) {
      // During cutscenes, companions face the conversation circle and breathe/gesture
      this.companions.forEach(agent => {
        agent.velocity.set(0, 0, 0);
        agent.mesh.updateAnimation(false, delta, 0);
      });
      return;
    }

    if (this.isCollectionMode) {
      // PathrikaCollectionSystem handles companion collection tasks
      return;
    }

    this.recordRamuPosition(ramuPos);

    for (let i = 0; i < this.companions.length; i++) {
      const agent = this.companions[i];
      const targetPos = this.getTargetPosition(agent, ramuPos, ramuRotation, isRamuMoving);

      const toTarget = targetPos.clone().sub(agent.position);
      toTarget.y = 0;
      const distToTarget = toTarget.length();

      const desiredVelocity = new THREE.Vector3(0, 0, 0);

      // 1. Steering towards target slot with dynamic catch-up sprinting
      if (distToTarget > 0.4) {
        toTarget.normalize();
        // Dynamic speed scaling: sprint up to 8.8 m/s if Ramu is running fast (Ramu speed: 7.2 m/s)
        const sprintBonus = Math.max(0, (distToTarget - 2.8) * 1.5);
        const maxSpeed = Math.min(8.8, agent.config.speed + sprintBonus);
        const arrivalSpeed = THREE.MathUtils.clamp(
          distToTarget * 2.4,
          1.8,
          maxSpeed
        );
        desiredVelocity.add(toTarget.multiplyScalar(arrivalSpeed));
      }

      // 2. Separation force between companions (avoid overlapping)
      for (let j = 0; j < this.companions.length; j++) {
        if (i === j) continue;
        const other = this.companions[j];
        const toSelf = agent.position.clone().sub(other.position);
        toSelf.y = 0;
        const dist = toSelf.length();
        const minSpacing = 1.35; // Minimum personal bubble

        if (dist < minSpacing && dist > 0.001) {
          const pushMag = ((minSpacing - dist) / minSpacing) * 4.5;
          desiredVelocity.add(toSelf.normalize().multiplyScalar(pushMag));
        }
      }

      // 3. Separation force from Ramu (never walk through Ramu)
      const toSelfFromRamu = agent.position.clone().sub(ramuPos);
      toSelfFromRamu.y = 0;
      const distFromRamu = toSelfFromRamu.length();
      const minRamuSpacing = 1.55;

      if (distFromRamu < minRamuSpacing && distFromRamu > 0.001) {
        const pushMag = ((minRamuSpacing - distFromRamu) / minRamuSpacing) * 6.5;
        desiredVelocity.add(toSelfFromRamu.normalize().multiplyScalar(pushMag));
      }

      // 4. Smooth Acceleration / Deceleration
      const isTryingToMove = desiredVelocity.lengthSq() > 0.04;
      if (isTryingToMove) {
        const accelFactor = Math.min(1.0, 9.0 * delta);
        agent.velocity.lerp(desiredVelocity, accelFactor);
      } else {
        const decelFactor = Math.exp(-12.0 * delta);
        agent.velocity.multiplyScalar(decelFactor);
        if (agent.velocity.lengthSq() < 0.01) {
          agent.velocity.set(0, 0, 0);
        }
      }

      // 5. Compute candidate position & resolve solid collisions (walls, trees, props)
      const candidatePos = agent.position.clone().add(agent.velocity.clone().multiplyScalar(delta));
      let resolvedPos = this.collisionSystem.resolveMovement(
        agent.position,
        candidatePos,
        0.48
      );

      const attemptedDist = candidatePos.distanceTo(agent.position);
      const actualDist = resolvedPos.distanceTo(agent.position);

      // Obstacle whisker sliding deflection: if forward path is impeded, steer laterally around obstacles
      if (isTryingToMove && attemptedDist > 0.04 && actualDist < attemptedDist * 0.4) {
        const leftWhisker = new THREE.Vector3(-agent.velocity.z, 0, agent.velocity.x).normalize().multiplyScalar(0.7);
        const rightWhisker = new THREE.Vector3(agent.velocity.z, 0, -agent.velocity.x).normalize().multiplyScalar(0.7);

        const tryLeft = this.collisionSystem.resolveMovement(agent.position, agent.position.clone().add(leftWhisker), 0.4);
        const tryRight = this.collisionSystem.resolveMovement(agent.position, agent.position.clone().add(rightWhisker), 0.4);

        if (tryRight.distanceTo(agent.position) > tryLeft.distanceTo(agent.position)) {
          agent.velocity.add(rightWhisker.multiplyScalar(4.0 * delta));
        } else {
          agent.velocity.add(leftWhisker.multiplyScalar(4.0 * delta));
        }
        agent.stuckTimer = (agent.stuckTimer || 0) + delta;
      } else {
        agent.stuckTimer = Math.max(0, (agent.stuckTimer || 0) - delta * 2.0);
      }

      // 6. Anti-stuck Breadcrumb Recovery: If stuck for >1.2s or separated >20m from Ramu
      const directDistToRamu = agent.position.distanceTo(ramuPos);
      if (agent.stuckTimer > 1.2 || directDistToRamu > 20.0) {
        if (this.ramuTrail.length > 2) {
          const recIdx = Math.min(this.ramuTrail.length - 1, Math.max(2, Math.floor(agent.offsetDistance / this.minTrailSpacing)));
          const safeTrailPoint = this.ramuTrail[recIdx] || ramuPos;
          const clearRecovery = this.collisionSystem.resolveMovement(
            safeTrailPoint,
            safeTrailPoint.clone().add(new THREE.Vector3(agent.lateralOffset * 0.4, 0, 0)),
            0.45
          );
          // Smoothly step towards safe trail point
          agent.position.lerp(clearRecovery, Math.min(1.0, 5.0 * delta));
          resolvedPos.copy(agent.position);
          agent.stuckTimer = 0;
        }
      } else {
        agent.position.copy(resolvedPos);
      }

      // 7. Smooth rotation (face direction of movement or look towards Ramu when stopped)
      const currentSpeed = agent.velocity.length();
      const isActuallyMoving = currentSpeed > 0.18;

      if (isActuallyMoving) {
        const targetRot = Math.atan2(agent.velocity.x, agent.velocity.z);
        let diff = targetRot - agent.rotation;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        agent.rotation += diff * Math.min(1.0, agent.config.rotationSpeed * delta);
      } else {
        // When stopped, face gently towards Ramu
        const toRamu = ramuPos.clone().sub(agent.position);
        if (toRamu.lengthSq() > 0.5) {
          const targetRot = Math.atan2(toRamu.x, toRamu.z);
          let diff = targetRot - agent.rotation;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          agent.rotation += diff * Math.min(1.0, 4.0 * delta);
        }
      }

      // 8. Update procedural mesh
      agent.mesh.group.position.copy(agent.position);
      agent.mesh.group.rotation.y = agent.rotation;
      agent.mesh.updateAnimation(isActuallyMoving, delta, currentSpeed / agent.config.speed);
    }
  }

  public getCompanionPosition(id: CharacterId): THREE.Vector3 | null {
    const c = this.companions.find(item => item.id === id);
    return c ? c.position.clone() : null;
  }

  /**
   * Helper: Convert car local coordinate to global 3D world space coordinate
   */
  public getCarWorldPoint(local: THREE.Vector3, carPos: THREE.Vector3, carRotY: number): THREE.Vector3 {
    return local.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotY).add(carPos);
  }

  /**
   * Initiates car boarding sequence for all companions.
   * Companions walk toward their designated doors and enter.
   */
  public startBoardingCar(carPos: THREE.Vector3, carRotY: number): void {
    for (let i = 0; i < this.companions.length; i++) {
      const agent = this.companions[i];
      agent.carState = 'approaching_door';
      agent.stepTimer = 0.45 + i * 0.15; // Natural staggered boarding
      agent.mesh.setSitting(false);
      agent.velocity.set(0, 0, 0);
    }
  }

  /**
   * Updates the visual boarding and seating physics of companions
   */
  public updateCarBoarding(delta: number, carPos: THREE.Vector3, carRotY: number): void {
    for (let i = 0; i < this.companions.length; i++) {
      const agent = this.companions[i];

      if (agent.carState === 'approaching_door') {
        const doorWorld = this.getCarWorldPoint(agent.doorLocal, carPos, carRotY);
        doorWorld.y = 0; // Ground level entry point

        const toDoor = doorWorld.clone().sub(agent.position);
        toDoor.y = 0;
        const dist = toDoor.length();

        if (dist > 0.38) {
          // Walking towards assigned door
          toDoor.normalize();
          const walkSpeed = Math.min(3.4, Math.max(1.8, dist * 2.2));
          agent.velocity.copy(toDoor.multiplyScalar(walkSpeed));

          // Smoothly face door
          const targetRot = Math.atan2(agent.velocity.x, agent.velocity.z);
          let diff = targetRot - agent.rotation;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          agent.rotation += diff * Math.min(1.0, 10.0 * delta);

          // Update position with solid collision check
          const candPos = agent.position.clone().add(agent.velocity.clone().multiplyScalar(delta));
          const resPos = this.collisionSystem.resolveMovement(agent.position, candPos, 0.4);
          agent.position.copy(resPos);

          agent.mesh.group.position.copy(agent.position);
          agent.mesh.group.rotation.y = agent.rotation;
          agent.mesh.updateAnimation(true, delta, walkSpeed / agent.config.speed);
        } else {
          // Reached the door - begin entering
          agent.carState = 'stepping_in';
          agent.velocity.set(0, 0, 0);
          agent.mesh.setSitting(true, false);
        }
      } else if (agent.carState === 'stepping_in') {
        agent.stepTimer -= delta;
        agent.mesh.setSitting(true, false);
        const seatWorld = this.getCarWorldPoint(agent.seatLocal, carPos, carRotY);

        // Smoothly interpolate position and orientation from door into passenger seat
        agent.position.lerp(seatWorld, Math.min(1.0, 8.0 * delta));
        
        let diff = carRotY - agent.rotation;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        agent.rotation += diff * Math.min(1.0, 8.0 * delta);

        agent.mesh.group.position.copy(agent.position);
        agent.mesh.group.rotation.y = agent.rotation;
        agent.mesh.updateAnimation(false, delta, 0);

        if (agent.stepTimer <= 0) {
          // Fully seated inside
          agent.carState = 'seated';
          agent.position.copy(seatWorld);
          agent.mesh.group.position.copy(seatWorld);
          agent.mesh.group.rotation.y = carRotY;
          agent.rotation = carRotY;
          agent.mesh.setSitting(true, false);
          agent.mesh.updateAnimation(false, delta, 0);
        }
      } else if (agent.carState === 'seated') {
        // Seated passenger locked to seat coordinates inside vehicle
        const seatWorld = this.getCarWorldPoint(agent.seatLocal, carPos, carRotY);
        agent.position.copy(seatWorld);
        agent.mesh.group.position.copy(seatWorld);
        agent.mesh.group.rotation.y = carRotY;
        agent.rotation = carRotY;
        agent.mesh.setSitting(true, false);
        agent.mesh.updateAnimation(false, delta, 0);
      }
    }
  }

  /**
   * Are all registered companions seated inside the vehicle?
   */
  public isAllBoarded(): boolean {
    return this.companions.length === 0 || this.companions.every(c => c.carState === 'seated');
  }

  /**
   * Get count of boarded companions
   */
  public getBoardingCount(): { seated: number; total: number } {
    return {
      seated: this.companions.filter(c => c.carState === 'seated').length,
      total: this.companions.length,
    };
  }

  /**
   * Returns true if any companion is currently boarding or seated
   */
  public isAnyBoardingOrSeated(): boolean {
    return this.companions.some(c => c.carState !== 'outside');
  }

  /**
   * Instantly seats all companions inside the vehicle in designated passenger seats.
   * Clears boarding delay so vehicle is driveable immediately.
   */
  public seatAllInCar(carPos: THREE.Vector3, carRotY: number): void {
    for (let i = 0; i < this.companions.length; i++) {
      const agent = this.companions[i];
      agent.carState = 'seated';
      agent.velocity.set(0, 0, 0);
      const seatWorld = this.getCarWorldPoint(agent.seatLocal, carPos, carRotY);
      agent.position.copy(seatWorld);
      agent.mesh.group.position.copy(seatWorld);
      agent.mesh.group.rotation.y = carRotY;
      agent.rotation = carRotY;
      agent.mesh.setSitting(true, false);
      agent.mesh.updateAnimation(false, 0.016, 0);
    }
  }

  /**
   * Disembark all companions when Ramu exits vehicle
   */
  public disembarkCar(carPos: THREE.Vector3, carRotY: number): void {
    for (let i = 0; i < this.companions.length; i++) {
      const agent = this.companions[i];
      agent.carState = 'outside';
      agent.mesh.setSitting(false);

      // Safe ground exit point beside their door
      const exitLocal = agent.doorLocal.clone();
      exitLocal.x *= 1.25;
      exitLocal.y = 0;

      const exitGround = this.getCarWorldPoint(exitLocal, carPos, carRotY);
      exitGround.y = 0;

      const resolved = this.collisionSystem.resolveMovement(carPos, exitGround, 0.45);
      resolved.y = 0;
      agent.position.copy(resolved);
      agent.mesh.group.position.copy(resolved);
      agent.mesh.group.rotation.y = carRotY;
      agent.rotation = carRotY;
      agent.velocity.set(0, 0, 0);
      agent.mesh.updateAnimation(false, 0.016, 0);
    }
  }

  /**
   * Resets companions to stand naturally near a world position
   */
  public resetPositionsNear(targetPos: THREE.Vector3): void {
    const offsets = [
      new THREE.Vector3(-1.0, 0, 1.2),
      new THREE.Vector3(1.0, 0, 1.2),
      new THREE.Vector3(-1.6, 0, 0.4),
      new THREE.Vector3(1.6, 0, 0.4),
    ];
    for (let i = 0; i < this.companions.length; i++) {
      const agent = this.companions[i];
      agent.carState = 'outside';
      agent.mesh.setSitting(false);
      const off = offsets[i % offsets.length];
      const p = targetPos.clone().add(off);
      p.y = 0;
      agent.position.copy(p);
      agent.mesh.group.position.copy(p);
      agent.rotation = 0;
      agent.velocity.set(0, 0, 0);
      agent.mesh.updateAnimation(false, 0.016, 0);
    }
  }
}
