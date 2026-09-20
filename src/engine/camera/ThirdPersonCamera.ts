/**
 * THE KATHA - Reusable Third-Person Camera System
 * Smoothly tracks target (Ramu) with lerp damping, ground clearance, and orbit rotation.
 * Not hardcoded to any level.
 */

import * as THREE from 'three';
import { CollisionSystem } from '../collisions/CollisionSystem';

export interface ThirdPersonCameraOptions {
  distance?: number;
  height?: number;
  pitch?: number; // radians
  yaw?: number; // radians
  damping?: number;
  minDistance?: number;
  maxDistance?: number;
  fov?: number;
}

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  private targetPosition: THREE.Vector3 = new THREE.Vector3(0, 1.2, 0);
  private currentCameraPos: THREE.Vector3 = new THREE.Vector3(0, 5, 8);
  private currentLookTarget: THREE.Vector3 = new THREE.Vector3(0, 1.2, 0);

  // Orbit parameters
  public distance: number;
  public height: number;
  public pitch: number;
  public yaw: number;
  public damping: number;
  public minDistance: number;
  public maxDistance: number;

  // Spring arm dynamic distance
  private currentArmDistance: number;

  // Vertical pitch range: upward sky (-1.08 rad / ~ -62°) to high bird's-eye (+1.22 rad / ~ +70°)
  private minPitch: number = -1.08;
  private maxPitch: number = 1.22;

  constructor(options: ThirdPersonCameraOptions = {}) {
    this.distance = options.distance ?? 6.5;
    this.height = options.height ?? 2.6;
    this.pitch = options.pitch ?? 0.35;
    this.yaw = options.yaw ?? 0;
    this.damping = options.damping ?? 0.12;
    this.minDistance = options.minDistance ?? 1.8;
    this.maxDistance = options.maxDistance ?? 12.0;
    this.currentArmDistance = this.distance;

    const fov = options.fov ?? 50;
    this.camera = new THREE.PerspectiveCamera(fov, 16 / 9, 0.3, 600);
    this.camera.position.set(0, this.height, this.distance);
  }

  /**
   * Adjust camera parameters for vehicle driving vs on-foot walking
   */
  public setVehicleMode(active: boolean, vehicleYaw?: number): void {
    if (active) {
      this.distance = 8.8;
      this.height = 3.2;
      this.pitch = 0.36;
      if (vehicleYaw !== undefined) {
        const rearYaw = vehicleYaw + Math.PI;
        let diff = rearYaw - this.yaw;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.yaw += diff * 0.04;
      }
    } else {
      this.distance = 6.5;
      this.height = 2.6;
      this.pitch = 0.35;
    }
  }

  /**
   * Set target position to follow (e.g. Ramu's center of mass)
   */
  public setTarget(pos: THREE.Vector3, yOffset: number = 1.2): void {
    this.targetPosition.set(pos.x, pos.y + yOffset, pos.z);
  }

  /**
   * Directly sets the camera transform for cinematic sequences.
   * Aligns internal tracking vectors so post-cinematic handoff is perfectly smooth.
   */
  public setCinematicTransform(pos: THREE.Vector3, lookAt: THREE.Vector3): void {
    this.camera.position.copy(pos);
    this.camera.lookAt(lookAt);
    this.currentCameraPos.copy(pos);
    this.currentLookTarget.copy(lookAt);
  }

  /**
   * Calculates ideal unoccluded camera position and look/aim target in world space.
   *
   * Dual-Arc Vertical Pitch System:
   * 1. DOWNWARD ARC (pitch >= 0.22 up to maxPitch = 1.22 rad / ~70°):
   *    Camera smoothly rises overhead into a high bird's-eye view centered on Ramu.
   *    Strictly clamped at maxPitch so the camera never flips upside down.
   * 2. UPWARD / SKY ARC (pitch < 0.22 down to minPitch = -0.92 rad / ~ -53°):
   *    Camera lowers smoothly behind Ramu into a low-angle tracking position, safely
   *    cushioned above ground level (+0.65m clearance).
   *    The camera look target smoothly tilts upward into the heavens.
   *    Ramu remains properly and stably positioned in the third-person frame while
   *    the sky, clouds, birds, and mountain peaks dominate the view.
   */
  public calculateIdealTransform(
    armDist: number,
    groundLevel: number = 0
  ): { position: THREE.Vector3; lookTarget: THREE.Vector3 } {
    const idealPos = new THREE.Vector3();
    const idealLookTarget = new THREE.Vector3();
    const minCameraY = groundLevel + 0.65;
    const horizonThreshold = 0.22;

    if (this.pitch >= horizonThreshold) {
      // Downward / High Angle Pitch Arc
      const cosPitch = Math.cos(this.pitch);
      const sinPitch = Math.sin(this.pitch);
      const horizontalDist = armDist * cosPitch;
      const verticalDist = armDist * sinPitch + (this.height * 0.4) * (armDist / this.distance);

      idealPos.x = this.targetPosition.x + horizontalDist * Math.sin(this.yaw);
      idealPos.z = this.targetPosition.z + horizontalDist * Math.cos(this.yaw);
      idealPos.y = Math.max(minCameraY, this.targetPosition.y + verticalDist);

      // Aim directly at Ramu's center of mass
      idealLookTarget.copy(this.targetPosition);
    } else {
      // Upward / Sky Pitch Arc (pitch < 0.22 down to minPitch)
      const t = (horizonThreshold - this.pitch) / (horizonThreshold - this.minPitch);
      const s = Math.min(1.0, Math.max(0.0, t));
      // Cubic smoothstep for natural fluid easing
      const smoothS = s * s * (3 - 2 * s);

      // Camera Y descends smoothly from horizon height to low-angle hero clearance
      const horizonY = this.targetPosition.y + armDist * Math.sin(horizonThreshold) + (this.height * 0.4) * (armDist / this.distance);
      const lowAngleY = groundLevel + 0.68;
      const targetY = THREE.MathUtils.lerp(horizonY, lowAngleY, smoothS);
      idealPos.y = Math.max(minCameraY, targetY);

      // Horizontal camera distance from Ramu eases slightly for cinematic hero framing
      const horizFactor = THREE.MathUtils.lerp(Math.cos(horizonThreshold), 0.86, smoothS);
      const horizontalDist = armDist * horizFactor;
      idealPos.x = this.targetPosition.x + horizontalDist * Math.sin(this.yaw);
      idealPos.z = this.targetPosition.z + horizontalDist * Math.cos(this.yaw);

      // Look target elevates smoothly into the open sky along forward gaze direction
      const forwardX = -Math.sin(this.yaw);
      const forwardZ = -Math.cos(this.yaw);
      const forwardLead = smoothS * 22.0;
      const upwardRise = smoothS * 18.0;

      idealLookTarget.x = this.targetPosition.x + forwardX * forwardLead;
      idealLookTarget.z = this.targetPosition.z + forwardZ * forwardLead;
      idealLookTarget.y = this.targetPosition.y + upwardRise;
    }

    return { position: idealPos, lookTarget: idealLookTarget };
  }

  /**
   * Snaps or aligns camera orbit directly behind a target at given yaw (default 0 = looking -Z north)
   */
  public resetBehindTarget(target: THREE.Vector3, targetYaw: number = 0): void {
    this.yaw = targetYaw;
    this.setTarget(target);
    this.currentArmDistance = this.distance;
    const { position, lookTarget } = this.calculateIdealTransform(this.distance, 0);
    this.currentCameraPos.copy(position);
    this.currentLookTarget.copy(lookTarget);
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookTarget);
  }

  /**
   * Rotate camera orbit around player (from touch/mouse drag)
   * Complete 360-degree horizontal rotation with yaw wrapping,
   * Full vertical tilt with pitch limits
   */
  public rotate(deltaYaw: number, deltaPitch: number): void {
    this.yaw -= deltaYaw;
    // Normalize yaw within [-PI, PI] for numerical stability
    while (this.yaw > Math.PI) this.yaw -= Math.PI * 2;
    while (this.yaw < -Math.PI) this.yaw += Math.PI * 2;

    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch + deltaPitch));
  }

  /**
   * Zoom camera in/out
   */
  public zoom(deltaDistance: number): void {
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + deltaDistance));
  }

  /**
   * Update camera position with smooth damping, 360 orbit, vertical tilt, and spring-arm collision avoidance
   */
  public update(
    delta: number = 0.016,
    groundLevel: number = 0,
    collisionSystem?: CollisionSystem
  ): void {
    const dt = Math.min(delta, 0.1);

    // 1. Calculate unoccluded ideal transform for current distance and ground level
    let targetArmDist = this.distance;
    const { position: idealPos, lookTarget: idealLookTarget } = this.calculateIdealTransform(
      this.distance,
      groundLevel
    );

    // 2. Camera collision avoidance against world obstacles (houses, trees, city buildings, vehicles)
    if (collisionSystem) {
      const probeOffset = idealPos.clone().sub(this.targetPosition);
      const probeDist = probeOffset.length();
      if (probeDist > 0.1) {
        const probeDir = probeOffset.clone().normalize();
        const maxProbePoint = this.targetPosition.clone().add(
          probeDir.clone().multiplyScalar(this.distance)
        );

        const rayHit = collisionSystem.checkRay(this.targetPosition, maxProbePoint, 0.35);
        if (rayHit.hit) {
          // Prevent camera clipping inside wall/prop by pulling spring arm inward
          const safeDist = Math.max(this.minDistance, rayHit.distance - 0.35);
          targetArmDist = Math.min(targetArmDist, safeDist);
        }
      }
    }

    // 3. Spring arm lerp: snap quickly inward if blocked to avoid clipping, smooth out when opening
    if (targetArmDist < this.currentArmDistance) {
      this.currentArmDistance = THREE.MathUtils.lerp(this.currentArmDistance, targetArmDist, dt * 25.0);
    } else {
      this.currentArmDistance = THREE.MathUtils.lerp(this.currentArmDistance, targetArmDist, dt * 6.0);
    }

    // 4. Recalculate transform if spring arm distance was adjusted by collision
    let finalPos = idealPos;
    let finalLookTarget = idealLookTarget;
    if (Math.abs(this.currentArmDistance - this.distance) > 0.05) {
      const adjusted = this.calculateIdealTransform(this.currentArmDistance, groundLevel);
      finalPos = adjusted.position;
      finalLookTarget = adjusted.lookTarget;
    }

    // 5. Final safety check: ensure camera never dips below terrain
    const minCameraY = groundLevel + 0.65;
    if (finalPos.y < minCameraY) {
      finalPos.y = minCameraY;
    }

    // 6. Frame-rate independent smooth damping lerp
    const lerpFactor = 1 - Math.exp(-this.damping * 60 * dt);
    this.currentCameraPos.lerp(finalPos, lerpFactor);
    this.currentLookTarget.lerp(finalLookTarget, lerpFactor);

    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookTarget);
  }

  /**
   * Update aspect ratio on resize
   */
  public updateAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
