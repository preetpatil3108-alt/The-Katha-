/**
 * THE KATHA - 3D Collision System
 * Provides spatial queries, sphere-sphere and sphere-box intersections,
 * sliding collision resolution, and terrain boundary constraints.
 */

import * as THREE from 'three';

export interface CollisionCollider {
  id: string;
  type: 'sphere' | 'box';
  position: THREE.Vector3;
  radius?: number;
  size?: THREE.Vector3;
  rotationY?: number;
}

export interface RayHit {
  hit: boolean;
  distance: number;
  point: THREE.Vector3;
  colliderId?: string;
}

export class CollisionSystem {
  private colliders: CollisionCollider[] = [];
  private dynamicColliders: CollisionCollider[] = [];
  private groundY: number = 0;
  private boundaryRadius: number = 340;

  constructor() {
    this.colliders = [];
    this.dynamicColliders = [];
  }

  public setGroundLevel(y: number): void {
    this.groundY = y;
  }

  public getGroundLevel(): number {
    return this.groundY;
  }

  public setBoundaryRadius(r: number): void {
    this.boundaryRadius = r;
  }

  public addCollider(collider: CollisionCollider): void {
    // Avoid duplicate IDs
    this.colliders = this.colliders.filter(c => c.id !== collider.id);
    this.colliders.push(collider);
  }

  public removeCollider(id: string): void {
    this.colliders = this.colliders.filter(c => c.id !== id);
  }

  public setDynamicColliders(dynamicList: CollisionCollider[]): void {
    this.dynamicColliders = dynamicList;
  }

  public clearDynamicColliders(): void {
    this.dynamicColliders = [];
  }

  public getAllColliders(): CollisionCollider[] {
    return [...this.colliders, ...this.dynamicColliders];
  }

  public clear(): void {
    this.colliders = [];
    this.dynamicColliders = [];
  }

  /**
   * Constrain candidate position against boundaries and colliders (spheres & boxes).
   * Uses a 2-pass relaxation to prevent corner clipping and sliding penetration.
   */
  public resolveMovement(
    _currentPos: THREE.Vector3,
    desiredPos: THREE.Vector3,
    playerRadius: number = 0.55
  ): THREE.Vector3 {
    const result = desiredPos.clone();
    const allColliders = this.getAllColliders();

    // 2-pass solver for corner and edge stability
    for (let pass = 0; pass < 2; pass++) {
      // 1. Clamp inside circular terrain boundary
      const distFromCenter = Math.sqrt(result.x * result.x + result.z * result.z);
      if (distFromCenter > this.boundaryRadius - playerRadius) {
        const angle = Math.atan2(result.z, result.x);
        result.x = Math.cos(angle) * (this.boundaryRadius - playerRadius);
        result.z = Math.sin(angle) * (this.boundaryRadius - playerRadius);
      }

      // 2. Resolve obstacles (Trees, Buildings, Walls, Large Props, Vehicles)
      for (const collider of allColliders) {
        // Fast distance pre-check to eliminate distant colliders immediately
        const approxDx = Math.abs(result.x - collider.position.x);
        const approxDz = Math.abs(result.z - collider.position.z);
        if (approxDx > 35 || approxDz > 35) continue;

        if (collider.type === 'sphere' && collider.radius) {
          const dx = result.x - collider.position.x;
          const dz = result.z - collider.position.z;
          const distSq = dx * dx + dz * dz;
          const minDistance = playerRadius + collider.radius;

          if (distSq < minDistance * minDistance && distSq > 0.00001) {
            const dist = Math.sqrt(distSq);
            const pushX = (dx / dist) * (minDistance - dist);
            const pushZ = (dz / dist) * (minDistance - dist);
            result.x += pushX;
            result.z += pushZ;
          }
        } else if (collider.type === 'box' && collider.size) {
          const hx = collider.size.x / 2;
          const hz = collider.size.z / 2;

          let localX = result.x - collider.position.x;
          let localZ = result.z - collider.position.z;

          const rot = collider.rotationY || 0;
          if (rot !== 0) {
            const cos = Math.cos(-rot);
            const sin = Math.sin(-rot);
            const rx = localX * cos - localZ * sin;
            const rz = localX * sin + localZ * cos;
            localX = rx;
            localZ = rz;
          }

          const closestX = THREE.MathUtils.clamp(localX, -hx, hx);
          const closestZ = THREE.MathUtils.clamp(localZ, -hz, hz);

          const dx = localX - closestX;
          const dz = localZ - closestZ;
          const distSq = dx * dx + dz * dz;

          if (distSq < playerRadius * playerRadius) {
            let pushLocalX = 0;
            let pushLocalZ = 0;

            if (distSq > 0.00001) {
              const dist = Math.sqrt(distSq);
              const pushDist = playerRadius - dist;
              pushLocalX = (dx / dist) * pushDist;
              pushLocalZ = (dz / dist) * pushDist;
            } else {
              // Inside box: push out along nearest axis
              const overlapLeft = localX - (-hx);
              const overlapRight = hx - localX;
              const overlapTop = localZ - (-hz);
              const overlapBottom = hz - localZ;

              const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
              if (minOverlap === overlapLeft) pushLocalX = -hx - playerRadius - localX;
              else if (minOverlap === overlapRight) pushLocalX = hx + playerRadius - localX;
              else if (minOverlap === overlapTop) pushLocalZ = -hz - playerRadius - localZ;
              else pushLocalZ = hz + playerRadius - localZ;
            }

            if (rot !== 0) {
              const cos = Math.cos(rot);
              const sin = Math.sin(rot);
              result.x += pushLocalX * cos - pushLocalZ * sin;
              result.z += pushLocalX * sin + pushLocalZ * cos;
            } else {
              result.x += pushLocalX;
              result.z += pushLocalZ;
            }
          }
        }
      }
    }

    // Lock firmly to ground level
    result.y = this.groundY;
    return result;
  }

  /**
   * Cast a ray / cylinder probe from origin to target to find the nearest occluding obstacle.
   * Used for third-person camera spring arm collision to prevent camera clipping through solid objects.
   */
  public checkRay(
    start: THREE.Vector3,
    end: THREE.Vector3,
    rayRadius: number = 0.35
  ): RayHit {
    const rayDir = new THREE.Vector3().subVectors(end, start);
    const rayLength = rayDir.length();
    if (rayLength < 0.001) {
      return { hit: false, distance: rayLength, point: end.clone() };
    }
    rayDir.normalize();

    let closestDist = rayLength;
    let hitFound = false;
    let hitColliderId: string | undefined;

    const allColliders = this.getAllColliders();

    for (const collider of allColliders) {
      // Sphere intersection test with ray expansion
      if (collider.type === 'sphere' && collider.radius) {
        const expandedRadius = collider.radius + rayRadius;
        const oc = new THREE.Vector3().subVectors(start, collider.position);
        // We only care about Y if the ray is within height range
        if (Math.abs(start.y - collider.position.y) > expandedRadius + 3.0) continue;

        const b = oc.dot(rayDir);
        const c = oc.dot(oc) - expandedRadius * expandedRadius;
        const discriminant = b * b - c;

        if (discriminant >= 0) {
          const t = -b - Math.sqrt(discriminant);
          if (t > 0.1 && t < closestDist) {
            closestDist = t;
            hitFound = true;
            hitColliderId = collider.id;
          }
        }
      } else if (collider.type === 'box' && collider.size) {
        // Expand box by ray radius
        const hx = collider.size.x / 2 + rayRadius;
        const hy = collider.size.y / 2 + rayRadius;
        const hz = collider.size.z / 2 + rayRadius;

        const min = new THREE.Vector3(
          collider.position.x - hx,
          collider.position.y - hy,
          collider.position.z - hz
        );
        const max = new THREE.Vector3(
          collider.position.x + hx,
          collider.position.y + hy,
          collider.position.z + hz
        );

        // Ray-AABB intersection
        let tmin = (min.x - start.x) / (Math.abs(rayDir.x) > 0.00001 ? rayDir.x : 0.00001);
        let tmax = (max.x - start.x) / (Math.abs(rayDir.x) > 0.00001 ? rayDir.x : 0.00001);
        if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

        let tymin = (min.y - start.y) / (Math.abs(rayDir.y) > 0.00001 ? rayDir.y : 0.00001);
        let tymax = (max.y - start.y) / (Math.abs(rayDir.y) > 0.00001 ? rayDir.y : 0.00001);
        if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

        if (tmin > tymax || tymin > tmax) continue;
        if (tymin > tmin) tmin = tymin;
        if (tymax < tmax) tmax = tymax;

        let tzmin = (min.z - start.z) / (Math.abs(rayDir.z) > 0.00001 ? rayDir.z : 0.00001);
        let tzmax = (max.z - start.z) / (Math.abs(rayDir.z) > 0.00001 ? rayDir.z : 0.00001);
        if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

        if (tmin > tzmax || tzmin > tmax) continue;
        if (tzmin > tmin) tmin = tzmin;
        if (tzmax < tmax) tmax = tzmax;

        if (tmin > 0.1 && tmin < closestDist) {
          closestDist = tmin;
          hitFound = true;
          hitColliderId = collider.id;
        }
      }
    }

    const hitPoint = start.clone().add(rayDir.clone().multiplyScalar(closestDist));
    return {
      hit: hitFound,
      distance: closestDist,
      point: hitPoint,
      colliderId: hitColliderId,
    };
  }
}
