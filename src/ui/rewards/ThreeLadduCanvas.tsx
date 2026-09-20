/**
 * THE KATHA - 3D Laddu Celebration Canvas
 * 
 * Polished WebGL 3D Laddu Reward Animation:
 * - 3D procedural golden laddus appearing near screen center
 * - Slight spring bounce upon appearance
 * - Gentle continuous 3D rotation and floating bob
 * - Golden sparkle celebration particle burst
 * - Smooth quadratic bezier flight toward the player's score area (top-right)
 * - Triggers audio and counter impact as each laddu arrives
 * - Short, satisfying (~3s), does not overload screen
 * - Works on mobile and desktop
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioManager } from '../../core/audio/AudioManager';

interface ThreeLadduCanvasProps {
  targetElementId?: string;
  ladduCount?: number;
  onImpact?: (index: number) => void;
  onComplete?: () => void;
}

interface LadduInstance {
  mesh: THREE.Group;
  initialPos: THREE.Vector3;
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  controlPos: THREE.Vector3;
  scale: number;
  targetScale: number;
  rotSpeed: { x: number; y: number; z: number };
  flightProgress: number;
  flightDelay: number;
  isImpacted: boolean;
  spawnTime: number;
}

export const ThreeLadduCanvas: React.FC<ThreeLadduCanvasProps> = ({
  targetElementId = 'reward-top-profile-counter',
  ladduCount = 7,
  onImpact,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 10);

    // 2. Transparent WebGL Renderer
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true,
        powerPreference: 'default',
      });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
    } catch {
      try {
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          alpha: true,
          antialias: false,
        });
        renderer.setSize(width, height, false);
      } catch {
        onComplete?.();
        return;
      }
    }

    // 3. Warm Festival Lighting
    const ambientLight = new THREE.AmbientLight('#fef3c7', 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#fbbf24', 2.2);
    sunLight.position.set(5, 8, 10);
    scene.add(sunLight);

    const rimLight = new THREE.PointLight('#f59e0b', 2.0, 30);
    rimLight.position.set(-5, -3, 6);
    scene.add(rimLight);

    // 4. Shared Geometries & Materials for Motichoor / Besan 3D Laddus
    const ladduGeo = new THREE.SphereGeometry(0.55, 24, 24);
    const ladduMat = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      emissive: '#d97706',
      emissiveIntensity: 0.28,
      roughness: 0.42,
      metalness: 0.12,
    });

    const boondiBandGeo = new THREE.TorusGeometry(0.56, 0.022, 8, 16);
    const boondiBandMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });

    const nutGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const cashewMat = new THREE.MeshLambertMaterial({ color: '#fef3c7' });
    const cardamomMat = new THREE.MeshLambertMaterial({ color: '#15803d' });

    // Function to calculate 3D world position from 2D screen coordinate
    const screenToWorld = (screenX: number, screenY: number, targetZ = 0): THREE.Vector3 => {
      const ndcX = (screenX / window.innerWidth) * 2 - 1;
      const ndcY = -(screenY / window.innerHeight) * 2 + 1;
      const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = (targetZ - camera.position.z) / dir.z;
      return camera.position.clone().add(dir.multiplyScalar(distance));
    };

    // Calculate score counter position in 3D world
    const getTargetWorldPos = (): THREE.Vector3 => {
      const el = document.getElementById(targetElementId);
      if (el) {
        const rect = el.getBoundingClientRect();
        return screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2, 0);
      }
      return screenToWorld(window.innerWidth - 80, 45, 0);
    };

    const targetWorldPos = getTargetWorldPos();

    // 5. Create 3D Laddus (5 to 7 laddus for a rich, uncluttered visual display)
    const displayCount = Math.min(Math.max(ladduCount, 5), 8);
    const laddus: LadduInstance[] = [];

    for (let i = 0; i < displayCount; i++) {
      const group = new THREE.Group();

      // Core sphere
      const sphere = new THREE.Mesh(ladduGeo, ladduMat);
      group.add(sphere);

      // Gold shimmer accent ring
      const band = new THREE.Mesh(boondiBandGeo, boondiBandMat);
      band.rotation.x = Math.PI / 3;
      band.rotation.y = (i * Math.PI) / 3;
      group.add(band);

      // Cashew nut and pistachio/cardamom speckles
      for (let n = 0; n < 3; n++) {
        const cashew = new THREE.Mesh(nutGeo, cashewMat);
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        cashew.position.set(
          0.54 * Math.sin(theta) * Math.cos(phi),
          0.54 * Math.sin(theta) * Math.sin(phi),
          0.54 * Math.cos(theta)
        );
        cashew.rotation.set(Math.random(), Math.random(), Math.random());
        group.add(cashew);
      }

      const cardamom = new THREE.Mesh(nutGeo, cardamomMat);
      cardamom.position.set(0.25, 0.45, 0.2);
      group.add(cardamom);

      scene.add(group);

      // Initial center cluster arrangement with slight arc
      const angle = (i / (displayCount - 1) - 0.5) * 1.8;
      const radiusX = 2.2;
      const radiusY = 0.6;
      const startX = Math.sin(angle) * radiusX;
      const startY = -0.3 + Math.cos(angle) * radiusY;
      const startZ = Math.sin(i * 1.5) * 0.4;

      const initialPos = new THREE.Vector3(startX, startY, startZ);
      group.position.copy(initialPos);
      group.scale.setScalar(0.001); // starts scaled down for bounce reveal

      // Curved control point for bezier flight trajectory (arcs upward towards top center before swooping)
      const midX = (startX + targetWorldPos.x) * 0.45;
      const midY = Math.max(startY, targetWorldPos.y) + 1.8;
      const midZ = (startZ + targetWorldPos.z) * 0.5 + 1.2;
      const controlPos = new THREE.Vector3(midX, midY, midZ);

      laddus.push({
        mesh: group,
        initialPos,
        currentPos: initialPos.clone(),
        targetPos: targetWorldPos,
        controlPos,
        scale: 0.001,
        targetScale: 1.0,
        rotSpeed: {
          x: 0.8 + Math.random() * 0.6,
          y: 1.2 + Math.random() * 0.8,
          z: 0.5 + Math.random() * 0.4,
        },
        flightProgress: 0,
        flightDelay: 1.35 + i * 0.12, // Staggered flight after initial celebratory bounce
        isImpacted: false,
        spawnTime: i * 0.06,
      });
    }

    // 6. 3D Sparkle / Celebration Particle System
    const particleCount = 42;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: THREE.Vector3[] = [];
    const particleLifes = new Float32Array(particleCount);

    for (let p = 0; p < particleCount; p++) {
      particlePositions[p * 3] = (Math.random() - 0.5) * 4.5;
      particlePositions[p * 3 + 1] = (Math.random() - 0.5) * 2.5;
      particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 2.0;

      particleVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 1.8,
          0.6 + Math.random() * 1.5,
          (Math.random() - 0.5) * 1.8
        )
      );
      particleLifes[p] = Math.random() * 1.2;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: '#fbbf24',
      size: 0.18,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 7. Quadratic Bezier Interpolation
    const quadraticBezier = (p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, t: number): THREE.Vector3 => {
      const inv = 1 - t;
      return new THREE.Vector3(
        inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
        inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y,
        inv * inv * p0.z + 2 * inv * t * p1.z + t * t * p2.z
      );
    };

    // 8. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();
    let isFinished = false;

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // A. Update 3D Laddus
      let allFlightFinished = true;

      laddus.forEach((item, index) => {
        // Continuous gentle rotation
        item.mesh.rotation.x += item.rotSpeed.x * dt;
        item.mesh.rotation.y += item.rotSpeed.y * dt;
        item.mesh.rotation.z += item.rotSpeed.z * dt;

        if (elapsed < item.spawnTime) {
          allFlightFinished = false;
          return;
        }

        // Phase 1: Bounce Appearance (0 to 1.35s)
        if (elapsed < item.flightDelay) {
          const tAppear = Math.min(1, (elapsed - item.spawnTime) / 0.55);
          // Spring bounce easing
          const bounceScale = Math.sin(tAppear * Math.PI * 1.2) * 1.18;
          item.scale = tAppear >= 1 ? 1.0 : Math.max(0.001, bounceScale);
          item.mesh.scale.setScalar(item.scale);

          // Gentle floating bob
          const bob = Math.sin(elapsed * 3.5 + index * 0.8) * 0.08;
          item.mesh.position.set(
            item.initialPos.x,
            item.initialPos.y + bob,
            item.initialPos.z
          );
          allFlightFinished = false;
        } else {
          // Phase 2: Flight towards score target
          const flightElapsed = elapsed - item.flightDelay;
          const flightDuration = 0.72;
          const t = Math.min(1, flightElapsed / flightDuration);
          // Ease-in-out quadratic curve for flight
          const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

          if (t < 1) {
            allFlightFinished = false;
            // Update target in case screen resized
            item.targetPos = getTargetWorldPos();
            const currentPos = quadraticBezier(item.initialPos, item.controlPos, item.targetPos, easeT);
            item.mesh.position.copy(currentPos);

            // Scale down gracefully as it enters the target pocket
            const shrinkScale = t > 0.65 ? Math.max(0.01, (1 - t) / 0.35) : 1.0;
            item.mesh.scale.setScalar(shrinkScale);
          } else if (!item.isImpacted) {
            item.isImpacted = true;
            item.mesh.visible = false;
            audioManager.playSound('laddu_collect');
            onImpact?.(index);
          }
        }
      });

      // B. Update Celebration Sparkle Particles
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let p = 0; p < particleCount; p++) {
        positions[p * 3] += particleVelocities[p].x * dt;
        positions[p * 3 + 1] += particleVelocities[p].y * dt;
        positions[p * 3 + 2] += particleVelocities[p].z * dt;

        // Slow float & fade
        particleVelocities[p].y -= dt * 0.8;
      }
      particleGeo.attributes.position.needsUpdate = true;
      if (particleMat.opacity > 0.05) {
        particleMat.opacity = Math.max(0, 0.85 - elapsed * 0.25);
      }

      if (renderer) {
        renderer.render(scene, camera);
      }

      // Settle sequence - strictly ONE execution, unconditionally finish by 3.2s
      if ((allFlightFinished && elapsed > 2.2) || elapsed > 3.2) {
        if (!isFinished) {
          isFinished = true;
          cancelAnimationFrame(animId);
          onComplete?.();
          return;
        }
      }

      if (!isFinished) {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);

    // 9. Window Resize Handling
    const handleResize = () => {
      if (!containerRef.current || !renderer) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);

      // Clean up Three.js memory
      ladduGeo.dispose();
      ladduMat.dispose();
      boondiBandGeo.dispose();
      boondiBandMat.dispose();
      nutGeo.dispose();
      cashewMat.dispose();
      cardamomMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      laddus.forEach((l) => scene.remove(l.mesh));
      scene.remove(particleSystem);
      if (renderer) {
        try {
          renderer.dispose();
        } catch {}
      }
    };
  }, [targetElementId, ladduCount, onImpact, onComplete]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-40 overflow-hidden"
    >
      <canvas
        id="laddu-reward-3d-canvas"
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};
