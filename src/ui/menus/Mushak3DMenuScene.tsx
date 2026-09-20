/**
 * THE KATHA - True 3D Mushak Main Menu Experience
 *
 * Targeted Upgrade:
 * 1. FIX MUSHAK DIALOGUE:
 *    - Clearly visible 2D HTML/CSS speech bubble above Mushak's head.
 *    - Layered at z-40 so it is NEVER hidden behind the 3D canvas or UI.
 *    - Shows messages one at a time:
 *      1. "Welcome to The Katha!"
 *      2. "I'm Mushak!"
 *      3. "Your guide through The Katha."
 *    - Direct DOM tracking of 3D head position at 60fps with zero React render overhead.
 *
 * 2. CURSOR LOOK (Real 3D raycast interaction):
 *    - Raycast from camera through cursor position.
 *    - If ray hits Mushak or an invisible 2-meter interaction sphere around Mushak:
 *      Mushak looks toward the cursor.
 *    - If cursor is NOT near Mushak (> 2 meters away):
 *      Mushak completely ignores it.
 *    - Only rotates Mushak's eyes/head slightly (clamped subtle range), NOT his whole body.
 *    - Smoothly interpolates head/eye rotation with delta time.
 *    - When cursor leaves the 2m area, smoothly returns to idle.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { audioManager } from '../../core/audio/AudioManager';
import { SaveSystem } from '../../core/save/SaveSystem';

interface Mushak3DMenuSceneProps {
  onTapMushak?: () => void;
}

export const Mushak3DMenuScene: React.FC<Mushak3DMenuSceneProps> = ({ onTapMushak }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [dialogueText, setDialogueText] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Start ambient background music
    try {
      audioManager.startAmbientBgm();
    } catch (e) {
      console.warn('[MainMenu] Audio autoplay deferred:', e);
    }

    // 1. Scene Setup
    const scene = new THREE.Scene();

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;
    let aspect = width / height;

    const camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    if (aspect < 1.1) {
      camera.position.set(0, 3.5, 8.2);
    } else {
      camera.position.set(0, 3.1, 7.2);
    }
    camera.lookAt(0, 0.35, 0);

    // 2. Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
    } catch {
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
      } catch (err) {
        console.warn('[Mushak3DMenuScene] WebGL renderer could not be created:', err);
        return;
      }
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    // 3. Cinematic Lighting (Soft warm temple courtyard)
    const ambientLight = new THREE.AmbientLight(0xffecd2, 1.45);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff0d0, 1.9);
    dirLight.position.set(4.5, 8.5, 5.5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -6;
    dirLight.shadow.camera.right = 6;
    dirLight.shadow.camera.top = 6;
    dirLight.shadow.camera.bottom = -6;
    dirLight.shadow.bias = -0.0008;
    scene.add(dirLight);

    // Warm golden accent light illuminating the corner
    const cornerLight = new THREE.PointLight(0xf59e0b, 2.2, 7.5);
    cornerLight.position.set(2.4, 1.4, 1.8);
    scene.add(cornerLight);

    // Soft sky rim light for fur silhouette definition
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.7);
    rimLight.position.set(-6, 5, -5);
    scene.add(rimLight);

    // 4. Courtyard Floor Platform
    const floorGeo = new THREE.PlaneGeometry(26, 18);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x12100e,
      roughness: 0.9,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // 5. Cheese Corner Setup (Terracotta Saucer & Rangoli Decal)
    const isMobile = aspect < 1.1;
    const cheeseStationPos = isMobile ? new THREE.Vector3(1.35, 0, 1.85) : new THREE.Vector3(2.25, 0, 1.55);

    const cheesePlateGroup = new THREE.Group();
    cheesePlateGroup.position.copy(cheeseStationPos);
    scene.add(cheesePlateGroup);

    // Decorative auspicious rangoli ring
    const rangoliGeo = new THREE.RingGeometry(0.38, 0.48, 32);
    const rangoliMat = new THREE.MeshBasicMaterial({
      color: 0xd97706,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const rangoliMesh = new THREE.Mesh(rangoliGeo, rangoliMat);
    rangoliMesh.rotation.x = -Math.PI / 2;
    rangoliMesh.position.y = 0.008;
    cheesePlateGroup.add(rangoliMesh);

    // Terracotta Saucer
    const plateGeo = new THREE.CylinderGeometry(0.36, 0.3, 0.045, 24);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.75,
      metalness: 0.08,
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.y = 0.022;
    plateMesh.receiveShadow = true;
    cheesePlateGroup.add(plateMesh);

    // Helper: Create a stylized 3D Swiss cheese wedge
    const createCheeseMesh = (scale = 1.0) => {
      const cheeseGroup = new THREE.Group();
      const cheeseShape = new THREE.Shape();
      cheeseShape.moveTo(0, 0);
      cheeseShape.lineTo(0.28 * scale, 0);
      cheeseShape.lineTo(0.14 * scale, 0.38 * scale);
      cheeseShape.closePath();

      const extrudeSettings = {
        depth: 0.18 * scale,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.012 * scale,
        bevelThickness: 0.012 * scale,
      };
      const cheeseGeo = new THREE.ExtrudeGeometry(cheeseShape, extrudeSettings);
      cheeseGeo.center();

      const cheeseMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        roughness: 0.48,
        metalness: 0.06,
      });
      const wedge = new THREE.Mesh(cheeseGeo, cheeseMat);
      wedge.rotation.x = Math.PI / 2;
      wedge.castShadow = true;
      cheeseGroup.add(wedge);

      // Cheese holes indentations
      const holeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
      const holePositions = [
        [-0.05, 0.06, 0.04, 0.035],
        [0.06, 0.03, -0.03, 0.028],
        [0.01, 0.08, -0.06, 0.022],
        [-0.03, -0.04, 0.02, 0.024],
      ];
      holePositions.forEach(([hx, hy, hz, r]) => {
        const hMesh = new THREE.Mesh(new THREE.SphereGeometry(r * scale, 10, 10), holeMat);
        hMesh.position.set(hx * scale, hy * scale, hz * scale);
        cheeseGroup.add(hMesh);
      });

      return cheeseGroup;
    };

    // Cheese on floor plate (active before Mushak picks it up)
    const floorCheese = createCheeseMesh(1.0);
    floorCheese.position.set(0, 0.12, 0);
    floorCheese.rotation.y = -Math.PI * 0.4;
    cheesePlateGroup.add(floorCheese);

    // 6. BUILD UPGRADED TRUE 3D MUSHAK CHARACTER
    const mushakRoot = new THREE.Group();
    mushakRoot.name = 'mushak_character';
    mushakRoot.scale.setScalar(0.88);
    scene.add(mushakRoot);

    // Shaders & Materials
    const furMat = new THREE.MeshStandardMaterial({
      color: 0x827a74,
      roughness: 0.88,
      metalness: 0.02,
    });
    const creamFurMat = new THREE.MeshStandardMaterial({
      color: 0xf8f4ee,
      roughness: 0.9,
      metalness: 0.01,
    });
    const pinkMat = new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      roughness: 0.62,
      metalness: 0.02,
    });
    const eyeBallMat = new THREE.MeshStandardMaterial({
      color: 0x111215,
      roughness: 0.12,
      metalness: 0.08,
    });
    const gleamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const redCollarMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.55 });
    const goldBellMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.28,
      metalness: 0.72,
    });

    // Dynamic Drop Shadow
    const shadowGeo = new THREE.CircleGeometry(0.42, 28);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.42,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.009;
    scene.add(shadowMesh);

    // Hips & Haunches (base for sitting and legs)
    const hipsGroup = new THREE.Group();
    hipsGroup.position.y = 0.12;
    mushakRoot.add(hipsGroup);

    // Left & Right Hind Legs & Paws
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.2, 0.06, -0.08);
    hipsGroup.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.2, 0.06, -0.08);
    hipsGroup.add(rightLeg);

    const thighGeo = new THREE.SphereGeometry(0.14, 14, 14);
    thighGeo.scale(0.8, 1.2, 1.0);
    const footGeo = new THREE.BoxGeometry(0.09, 0.05, 0.18);

    [leftLeg, rightLeg].forEach((leg) => {
      const thigh = new THREE.Mesh(thighGeo, furMat);
      thigh.position.set(0, 0.08, 0.02);
      leg.add(thigh);

      const foot = new THREE.Mesh(footGeo, furMat);
      foot.position.set(0, -0.05, 0.06);
      leg.add(foot);

      const solePad = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.015, 0.12), pinkMat);
      solePad.position.set(0, -0.07, 0.06);
      leg.add(solePad);
    });

    // Multi-Jointed Flexible Mouse Tail (6 articulated segments)
    const tailRoot = new THREE.Group();
    tailRoot.position.set(0, 0.08, -0.28);
    hipsGroup.add(tailRoot);

    const tailSegments: THREE.Group[] = [];
    let currentTailParent = tailRoot;
    for (let i = 0; i < 6; i++) {
      const tSeg = new THREE.Group();
      tSeg.position.set(0, 0.02, -0.09);
      const segMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026 - i * 0.0035, 0.022 - i * 0.0035, 0.11, 8),
        pinkMat
      );
      segMesh.rotation.x = -0.35;
      segMesh.position.set(0, 0.03, -0.04);
      tSeg.add(segMesh);
      currentTailParent.add(tSeg);
      tailSegments.push(tSeg);
      currentTailParent = tSeg;
    }

    // Torso Group
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.36;
    mushakRoot.add(torsoGroup);

    // Body: Plump, pear-shaped cartoon body
    const bodyGeo = new THREE.SphereGeometry(0.36, 22, 22);
    bodyGeo.scale(0.9, 0.95, 1.15);
    const bodyMesh = new THREE.Mesh(bodyGeo, furMat);
    bodyMesh.castShadow = true;
    torsoGroup.add(bodyMesh);

    // Belly: Cream oval chest/tummy bib
    const bellyGeo = new THREE.SphereGeometry(0.25, 18, 18);
    bellyGeo.scale(0.8, 0.92, 0.45);
    const bellyMesh = new THREE.Mesh(bellyGeo, creamFurMat);
    bellyMesh.position.set(0, -0.04, 0.34);
    torsoGroup.add(bellyMesh);

    // Sacred Vermilion Collar with Golden Bell
    const collarGeo = new THREE.TorusGeometry(0.24, 0.032, 8, 22);
    const collarMesh = new THREE.Mesh(collarGeo, redCollarMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.set(0, 0.14, 0.22);
    torsoGroup.add(collarMesh);

    const bellGeo = new THREE.SphereGeometry(0.065, 14, 14);
    const bellMesh = new THREE.Mesh(bellGeo, goldBellMat);
    bellMesh.position.set(0, 0.06, 0.44);
    torsoGroup.add(bellMesh);

    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.04), new THREE.MeshBasicMaterial({ color: 0x78350f }));
    slit.position.set(0, 0.03, 0.48);
    torsoGroup.add(slit);

    // Front Paws / Arms (Rigged to hold cheese securely)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.2, 0.14, 0.16);
    torsoGroup.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.2, 0.14, 0.16);
    torsoGroup.add(rightArm);

    const armGeo = new THREE.CylinderGeometry(0.042, 0.032, 0.2, 10);
    const pawGeo = new THREE.SphereGeometry(0.042, 10, 10);
    [leftArm, rightArm].forEach((arm) => {
      const armMesh = new THREE.Mesh(armGeo, furMat);
      armMesh.position.y = -0.09;
      arm.add(armMesh);

      const pawMesh = new THREE.Mesh(pawGeo, pinkMat);
      pawMesh.position.set(0, -0.19, 0.03);
      arm.add(pawMesh);

      for (let f = -1; f <= 1; f++) {
        const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.006, 0.035, 6), pinkMat);
        finger.rotation.x = Math.PI / 3;
        finger.position.set(f * 0.016, -0.21, 0.05);
        arm.add(finger);
      }
    });

    // Held Cheese Wedge
    const heldCheese = createCheeseMesh(0.88);
    heldCheese.position.set(0, 0.06, 0.42);
    heldCheese.rotation.set(-0.25, 0, 0);
    heldCheese.visible = false;
    torsoGroup.add(heldCheese);

    // Head Group: Tilts, turns to look at camera, cheese, and cursor
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.24, 0.32);
    torsoGroup.add(headGroup);

    // Cranium
    const headGeo = new THREE.SphereGeometry(0.25, 20, 20);
    const headMesh = new THREE.Mesh(headGeo, furMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Chubby Cheeks
    const cheekGeo = new THREE.SphereGeometry(0.125, 16, 16);
    cheekGeo.scale(1.1, 0.92, 0.85);
    const leftCheek = new THREE.Mesh(cheekGeo, furMat);
    leftCheek.position.set(-0.13, -0.04, 0.16);
    headGroup.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeo, furMat);
    rightCheek.position.set(0.13, -0.04, 0.16);
    headGroup.add(rightCheek);

    // Cream Whisker Pads / Muzzle
    const padGeo = new THREE.SphereGeometry(0.09, 14, 14);
    padGeo.scale(0.9, 0.75, 1.2);
    const leftPad = new THREE.Mesh(padGeo, creamFurMat);
    leftPad.position.set(-0.06, -0.04, 0.28);
    headGroup.add(leftPad);

    const rightPad = new THREE.Mesh(padGeo, creamFurMat);
    rightPad.position.set(0.06, -0.04, 0.28);
    headGroup.add(rightPad);

    // Pink Button Nose
    const noseGeo = new THREE.SphereGeometry(0.048, 12, 12);
    noseGeo.scale(1.0, 0.85, 0.9);
    const noseMesh = new THREE.Mesh(noseGeo, pinkMat);
    noseMesh.position.set(0, -0.02, 0.38);
    headGroup.add(noseMesh);

    // Articulated Jaw / Mouth
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, -0.08, 0.24);
    headGroup.add(jawGroup);

    const chinMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), creamFurMat);
    chinMesh.scale.set(0.8, 0.5, 0.9);
    chinMesh.position.set(0, -0.02, 0.04);
    jawGroup.add(chinMesh);

    const tongueMesh = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), pinkMat);
    tongueMesh.scale.set(0.8, 0.3, 1.2);
    tongueMesh.position.set(0, 0.01, 0.05);
    jawGroup.add(tongueMesh);

    // Large Expressive Eyes with functional Eyelids
    const leftEyelidPivot = new THREE.Group();
    const rightEyelidPivot = new THREE.Group();
    leftEyelidPivot.position.set(-0.11, 0.1, 0.2);
    rightEyelidPivot.position.set(0.11, 0.1, 0.2);
    headGroup.add(leftEyelidPivot);
    headGroup.add(rightEyelidPivot);

    const eyeLids: THREE.Mesh[] = [];

    [-0.11, 0.11].forEach((x, idx) => {
      const eyePivot = idx === 0 ? leftEyelidPivot : rightEyelidPivot;

      const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.062, 18, 18), eyeBallMat);
      eyeball.scale.set(1.0, 1.18, 0.88);
      eyeball.position.set(0, 0, 0);
      eyePivot.add(eyeball);

      const gleam1 = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), gleamMat);
      gleam1.position.set(idx === 0 ? -0.018 : 0.012, 0.024, 0.05);
      eyeball.add(gleam1);

      const gleam2 = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), gleamMat);
      gleam2.position.set(idx === 0 ? 0.014 : -0.016, -0.015, 0.05);
      eyeball.add(gleam2);

      const lidGeo = new THREE.SphereGeometry(0.068, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const eyelid = new THREE.Mesh(lidGeo, furMat);
      eyelid.position.set(0, 0, 0);
      eyelid.rotation.x = -Math.PI * 0.5;
      eyePivot.add(eyelid);
      eyeLids.push(eyelid);

      const browGeo = new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI * 0.65);
      const brow = new THREE.Mesh(browGeo, new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 }));
      brow.position.set(0, 0.065, 0.02);
      brow.rotation.z = idx === 0 ? 0.15 : -0.15;
      eyePivot.add(brow);
    });

    // Flexible Arched Whiskers
    const leftWhiskerGroup = new THREE.Group();
    leftWhiskerGroup.position.set(-0.12, -0.03, 0.32);
    headGroup.add(leftWhiskerGroup);

    const rightWhiskerGroup = new THREE.Group();
    rightWhiskerGroup.position.set(0.12, -0.03, 0.32);
    headGroup.add(rightWhiskerGroup);

    const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xf3f4f6 });
    [-1, 1].forEach((dir) => {
      const parent = dir === -1 ? leftWhiskerGroup : rightWhiskerGroup;
      [-0.02, 0.0, 0.02].forEach((offsetY, i) => {
        const whiskerMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.003, 0.001, 0.22, 6),
          whiskerMat
        );
        whiskerMesh.rotation.z = dir * (Math.PI / 2 + offsetY * 3.5);
        whiskerMesh.rotation.y = -dir * (0.28 + i * 0.05);
        whiskerMesh.position.set(dir * 0.02, offsetY, 0);
        parent.add(whiskerMesh);
      });
    });

    // Cupped Mouse Ears
    const leftEarPivot = new THREE.Group();
    leftEarPivot.position.set(-0.2, 0.24, 0.04);
    headGroup.add(leftEarPivot);

    const rightEarPivot = new THREE.Group();
    rightEarPivot.position.set(0.2, 0.24, 0.04);
    headGroup.add(rightEarPivot);

    [-1, 1].forEach((dir) => {
      const pivot = dir === -1 ? leftEarPivot : rightEarPivot;

      const earOuter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.165, 0.165, 0.028, 20),
        furMat
      );
      earOuter.rotation.x = Math.PI / 2;
      earOuter.rotation.z = dir * 0.22;
      earOuter.castShadow = true;

      const earInner = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.032, 18),
        pinkMat
      );
      earInner.position.y = 0.006;
      earOuter.add(earInner);

      pivot.add(earOuter);
    });

    // Nibble Golden Crumbs Emitter System
    const crumbCount = 16;
    const crumbGeo = new THREE.DodecahedronGeometry(0.022);
    const crumbMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const crumbs: { mesh: THREE.Mesh; vel: THREE.Vector3; active: boolean }[] = [];
    for (let i = 0; i < crumbCount; i++) {
      const cMesh = new THREE.Mesh(crumbGeo, crumbMat);
      cMesh.visible = false;
      scene.add(cMesh);
      crumbs.push({ mesh: cMesh, vel: new THREE.Vector3(), active: false });
    }

    const emitCrumb = (pos: THREE.Vector3) => {
      const c = crumbs.find((item) => !item.active);
      if (!c) return;
      c.active = true;
      c.mesh.visible = true;
      c.mesh.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.12, 0.12, (Math.random() - 0.5) * 0.12));
      c.vel.set((Math.random() - 0.5) * 0.9, 0.7 + Math.random() * 0.6, (Math.random() - 0.5) * 0.9);
    };

    // 7. PATH & INTERACTION WAYPOINTS
    const spawnPos = isMobile ? new THREE.Vector3(-3.2, 0, 2.2) : new THREE.Vector3(-4.8, 0, 1.8);
    const wp1 = isMobile ? new THREE.Vector3(-1.6, 0, 2.25) : new THREE.Vector3(-2.2, 0, 2.05);
    const wp2 = isMobile ? new THREE.Vector3(-0.1, 0, 2.2) : new THREE.Vector3(0.3, 0, 1.95);
    const stopInspectPos = isMobile ? new THREE.Vector3(0.95, 0, 2.05) : new THREE.Vector3(1.7, 0, 1.75);
    const finalSitPos = isMobile ? new THREE.Vector3(1.15, 0, 1.95) : new THREE.Vector3(1.95, 0, 1.65);

    mushakRoot.position.copy(spawnPos);

    let elapsedTime = 0;
    let nibbleAudioTimer = 0;
    let footstepTimer = 0;
    let blinkTimer = 0;
    let isBlinking = false;
    const blinkDuration = 0.15;
    let lastDialogueKey = '';

    // Facing rotation angle toward the camera
    const toCameraVec = camera.position.clone().sub(finalSitPos);
    const faceCameraAngle = Math.atan2(toCameraVec.x, toCameraVec.z);

    // 8. 3D RAYCAST-BASED CURSOR INTERACTION
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2(-999, -999);
    let hasPointer = false;

    // Smoothed head/eye cursor look offsets
    let cursorLookYaw = 0;
    let cursorLookPitch = 0;

    const handlePointerMove = (event: PointerEvent) => {
      hasPointer = true;
      mouseNDC.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseNDC.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const handlePointerLeave = () => {
      hasPointer = false;
      mouseNDC.set(-999, -999);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);

    // Interactive Tap / Click
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

      const clickMouse = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(clickMouse, camera);
      const intersects = raycaster.intersectObjects([mushakRoot, cheesePlateGroup], true);

      if (intersects.length > 0) {
        audioManager.playSound('mushak_squeak');
        // Playful excited hop
        torsoGroup.position.y += 0.14;
        leftEarPivot.rotation.z = -0.45;
        rightEarPivot.rotation.z = 0.45;
        headGroup.rotation.x = -0.22;
        if (onTapMushak) {
          onTapMushak();
        }
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);

    // 9. CINEMATIC ANIMATION TIMELINE LOOP
    let animationFrameId: number;
    let lastTime = performance.now();
    const tempPlaneVec = new THREE.Vector3();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      elapsedTime += delta;

      // Update Crumb Physics
      crumbs.forEach((c) => {
        if (c.active) {
          c.mesh.position.addScaledVector(c.vel, delta);
          c.vel.y -= 3.6 * delta;
          if (c.mesh.position.y <= 0.02) {
            c.mesh.position.y = 0.02;
            c.vel.set(0, 0, 0);
            c.mesh.scale.subScalar(delta * 0.9);
            if (c.mesh.scale.x <= 0.08) {
              c.active = false;
              c.mesh.visible = false;
              c.mesh.scale.set(1, 1, 1);
            }
          }
        }
      });

      // Natural Blinking System
      blinkTimer += delta;
      if (blinkTimer > 4.2) {
        isBlinking = true;
        blinkTimer = 0;
      }
      if (isBlinking) {
        const blinkProgress = Math.sin((blinkTimer / blinkDuration) * Math.PI);
        if (blinkProgress > 0) {
          const lidAngle = THREE.MathUtils.lerp(-Math.PI * 0.5, 0.08, blinkProgress);
          eyeLids.forEach((lid) => (lid.rotation.x = lidAngle));
        } else {
          isBlinking = false;
          eyeLids.forEach((lid) => (lid.rotation.x = -Math.PI * 0.5));
        }
      }

      // Base Head Rotations for Current Phase
      let baseHeadX = 0;
      let baseHeadY = 0;

      // =========================================================================
      // TIMELINE PHASES
      // =========================================================================

      // PHASE 1: SPAWN & RUN TOWARDS CHEESE (0.0s - 3.8s)
      if (elapsedTime < 3.8) {
        const runProgress = Math.min(1.0, elapsedTime / 3.6);
        const currentPos = new THREE.Vector3();

        if (runProgress < 0.35) {
          const t = runProgress / 0.35;
          currentPos.lerpVectors(spawnPos, wp1, t);
        } else if (runProgress < 0.7) {
          const t = (runProgress - 0.35) / 0.35;
          currentPos.lerpVectors(wp1, wp2, t);
        } else {
          const t = (runProgress - 0.7) / 0.3;
          currentPos.lerpVectors(wp2, stopInspectPos, t);
        }

        const targetAngle = Math.atan2(stopInspectPos.x - currentPos.x, stopInspectPos.z - currentPos.z);
        mushakRoot.rotation.y = THREE.MathUtils.lerp(mushakRoot.rotation.y, targetAngle, 12 * delta);
        mushakRoot.position.copy(currentPos);

        const runCadence = elapsedTime * 21;
        const bounce = Math.abs(Math.sin(runCadence)) * 0.08;
        torsoGroup.position.y = 0.36 + bounce;
        torsoGroup.rotation.x = 0.22;

        const swing = Math.sin(runCadence) * 0.7;
        leftLeg.rotation.x = swing;
        rightLeg.rotation.x = -swing;
        leftArm.rotation.x = -swing * 0.95;
        rightArm.rotation.x = swing * 0.95;

        tailRoot.rotation.y = Math.sin(runCadence * 0.75) * 0.4;
        tailSegments.forEach((seg, i) => {
          seg.rotation.y = Math.sin(runCadence * 0.75 + i * 0.35) * 0.22;
        });

        footstepTimer += delta;
        if (footstepTimer > 0.32) {
          footstepTimer = 0;
          try {
            audioManager.playSound('footstep');
          } catch {}
        }
      }

      // PHASE 2: NOTICE CHEESE & SNIFF / INSPECT (3.8s - 6.5s)
      else if (elapsedTime < 6.5) {
        mushakRoot.position.lerp(stopInspectPos, 7 * delta);
        torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0, 8 * delta);

        leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 10 * delta);
        rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 10 * delta);
        leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0, 10 * delta);
        rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0, 10 * delta);

        const toPlate = cheeseStationPos.clone().sub(mushakRoot.position);
        const lookPlateAngle = Math.atan2(toPlate.x, toPlate.z);
        mushakRoot.rotation.y = THREE.MathUtils.lerp(mushakRoot.rotation.y, lookPlateAngle, 9 * delta);

        const sniffFreq = Math.sin(elapsedTime * 30);
        noseMesh.position.z = 0.38 + sniffFreq * 0.022;
        baseHeadX = 0.28;
        baseHeadY = Math.sin(elapsedTime * 5) * 0.14;

        leftWhiskerGroup.rotation.y = Math.sin(elapsedTime * 24) * 0.12;
        rightWhiskerGroup.rotation.y = -Math.sin(elapsedTime * 24) * 0.12;

        leftEarPivot.rotation.x = Math.sin(elapsedTime * 12) * 0.12;
        rightEarPivot.rotation.x = -Math.sin(elapsedTime * 12) * 0.12;

        torsoGroup.position.y = THREE.MathUtils.lerp(torsoGroup.position.y, 0.32, 8 * delta);
      }

      // PHASE 3: PICK UP CHEESE & ROTATE TO FACE THE CAMERA / PLAYER! (6.5s - 7.5s)
      else if (elapsedTime < 7.5) {
        const turnProgress = (elapsedTime - 6.5) / 1.0;

        mushakRoot.position.lerp(finalSitPos, 5 * delta);
        mushakRoot.rotation.y = THREE.MathUtils.lerp(mushakRoot.rotation.y, faceCameraAngle, 7 * delta);

        torsoGroup.position.y = THREE.MathUtils.lerp(torsoGroup.position.y, 0.3, 6 * delta);
        torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, -0.16, 6 * delta);
        hipsGroup.position.y = THREE.MathUtils.lerp(hipsGroup.position.y, 0.06, 6 * delta);

        leftLeg.position.set(-0.21, 0.03, 0.04);
        rightLeg.position.set(0.21, 0.03, 0.04);
        leftLeg.rotation.x = -0.3;
        rightLeg.rotation.x = -0.3;

        tailRoot.rotation.y = THREE.MathUtils.lerp(tailRoot.rotation.y, 0.75, 5 * delta);
        tailSegments.forEach((seg, i) => {
          seg.rotation.y = THREE.MathUtils.lerp(seg.rotation.y, 0.28, 5 * delta);
        });

        if (turnProgress > 0.45) {
          floorCheese.visible = false;
          heldCheese.visible = true;
        }

        leftArm.rotation.set(-1.15, 0.22, 0.28);
        rightArm.rotation.set(-1.15, -0.22, -0.28);

        baseHeadX = -0.18;
      }

      // PHASE 4: EATING WHILE FACING PLAYER & DIALOGUE SEQUENCING (7.5s - 15.0s)
      else if (elapsedTime < 15.0) {
        mushakRoot.position.lerp(finalSitPos, 5 * delta);
        mushakRoot.rotation.y = faceCameraAngle;
        torsoGroup.position.y = 0.3;
        torsoGroup.rotation.x = -0.16;

        const chewCycle = Math.sin(elapsedTime * 15);
        const isTakingBite = Math.sin(elapsedTime * 2.2) > 0.2;

        if (isTakingBite) {
          heldCheese.position.y = 0.07 + chewCycle * 0.015;
          leftArm.rotation.x = -1.22 + chewCycle * 0.12;
          rightArm.rotation.x = -1.22 - chewCycle * 0.12;

          jawGroup.rotation.x = 0.14 + chewCycle * 0.12;
          noseMesh.position.z = 0.38 + Math.sin(elapsedTime * 25) * 0.012;

          leftWhiskerGroup.rotation.z = chewCycle * 0.08;
          rightWhiskerGroup.rotation.z = -chewCycle * 0.08;

          nibbleAudioTimer += delta;
          if (nibbleAudioTimer > 0.36) {
            nibbleAudioTimer = 0;
            try {
              audioManager.playSound('mushak_nibble');
            } catch {}
            emitCrumb(finalSitPos.clone().add(new THREE.Vector3(0, 0.35, 0.2)));
          }
        } else {
          jawGroup.rotation.x = THREE.MathUtils.lerp(jawGroup.rotation.x, 0.02, 8 * delta);
          leftArm.rotation.set(-1.12, 0.2, 0.25);
          rightArm.rotation.set(-1.12, -0.2, -0.25);
        }

        baseHeadX = -0.18 + Math.sin(elapsedTime * 2) * 0.03;
      }

      // PHASE 5: LIVING ENVIRONMENTAL NPC IDLE (15.0s+)
      else {
        mushakRoot.position.lerp(finalSitPos, 4 * delta);
        mushakRoot.rotation.y = faceCameraAngle;

        const breathe = Math.sin(elapsedTime * 2.2);
        torsoGroup.position.y = 0.3 + breathe * 0.012;
        bellyMesh.scale.set(0.8 + breathe * 0.04, 0.92 + breathe * 0.03, 0.45);

        const idleCycle = Math.floor(elapsedTime / 4.8) % 3;
        if (idleCycle === 0) {
          baseHeadX = -0.18;
          baseHeadY = 0;
          jawGroup.rotation.x = THREE.MathUtils.lerp(jawGroup.rotation.x, 0.02, 6 * delta);
          leftEarPivot.rotation.x = Math.sin(elapsedTime * 14) * 0.12;
        } else if (idleCycle === 1) {
          const nibbleChew = Math.sin(elapsedTime * 14);
          jawGroup.rotation.x = 0.12 + nibbleChew * 0.1;
          noseMesh.position.z = 0.38 + Math.sin(elapsedTime * 22) * 0.012;
          heldCheese.position.y = 0.06 + nibbleChew * 0.01;

          nibbleAudioTimer += delta;
          if (nibbleAudioTimer > 0.42) {
            nibbleAudioTimer = 0;
            try {
              audioManager.playSound('mushak_nibble');
            } catch {}
            emitCrumb(finalSitPos.clone().add(new THREE.Vector3(0, 0.35, 0.2)));
          }
        } else {
          baseHeadX = 0.06;
          baseHeadY = -0.15;
          jawGroup.rotation.x = THREE.MathUtils.lerp(jawGroup.rotation.x, 0, 6 * delta);
          tailRoot.rotation.y = Math.sin(elapsedTime * 2.5) * 0.35;
        }
      }

      // =========================================================================
      // DIALOGUE SEQUENCING (Show messages ONE AT A TIME)
      // If Game Completed: Mushak warmly congratulates the player
      // Otherwise: Standard introductory guide sequence
      // =========================================================================
      const isGameCompleted = SaveSystem.hasCompletedGame();
      let targetDialogue: string | null = null;

      if (isGameCompleted) {
        if (elapsedTime >= 0.5 && elapsedTime < 8.5) {
          targetDialogue = "Great job! You've nailed it!";
        } else {
          targetDialogue = null;
        }
      } else {
        if (elapsedTime >= 0.5 && elapsedTime < 3.8) {
          targetDialogue = 'Welcome to The Katha!';
        } else if (elapsedTime >= 7.2 && elapsedTime < 10.8) {
          targetDialogue = "I'm Mushak!";
        } else if (elapsedTime >= 10.8 && elapsedTime < 15.0) {
          targetDialogue = 'Your guide through The Katha.';
        } else {
          targetDialogue = null;
        }
      }

      if (targetDialogue !== lastDialogueKey) {
        lastDialogueKey = targetDialogue || '';
        setDialogueText(targetDialogue);
      }

      // =========================================================================
      // 3D RAYCAST CURSOR LOOK SYSTEM (Radius = ~2.0m)
      // =========================================================================
      const headWorldPos = new THREE.Vector3();
      headGroup.getWorldPosition(headWorldPos);

      let targetLookYaw = 0;
      let targetLookPitch = 0;

      if (hasPointer) {
        raycaster.setFromCamera(mouseNDC, camera);

        // Check perpendicular distance from cursor ray to Mushak's head
        const rayDistToHead = raycaster.ray.distanceToPoint(headWorldPos);
        const INTERACTION_RADIUS = 2.0; // approximately 2 meters around Mushak

        if (rayDistToHead <= INTERACTION_RADIUS) {
          // Cursor is within the 2-meter interaction sphere!
          // Intersect ray with a plane passing through head facing camera
          const camDir = camera.getWorldDirection(tempPlaneVec);
          const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir.negate(), headWorldPos);
          const hitPoint = new THREE.Vector3();

          if (raycaster.ray.intersectPlane(plane, hitPoint)) {
            const toCursor = hitPoint.sub(headWorldPos);

            // Convert world direction to Mushak's local coordinate system
            const bodyAngle = mushakRoot.rotation.y;
            const cosA = Math.cos(-bodyAngle);
            const sinA = Math.sin(-bodyAngle);
            const localX = toCursor.x * cosA - toCursor.z * sinA;
            const localZ = toCursor.x * sinA + toCursor.z * cosA;
            const localY = toCursor.y;

            // Calculate subtle relative angle
            const rawYaw = Math.atan2(localX, localZ);
            const distXZ = Math.sqrt(localX * localX + localZ * localZ);
            const rawPitch = -Math.atan2(localY, distXZ);

            // Subtle rotation only (clamped so only head/eyes move slightly)
            targetLookYaw = Math.max(-0.45, Math.min(0.45, rawYaw));
            targetLookPitch = Math.max(-0.25, Math.min(0.25, rawPitch));
          }
        }
        // When cursor is NOT near Mushak (> 2m): targetLookYaw and targetLookPitch remain 0!
      }

      // Smoothly interpolate the head/eye rotation
      cursorLookYaw = THREE.MathUtils.lerp(cursorLookYaw, targetLookYaw, 5.0 * delta);
      cursorLookPitch = THREE.MathUtils.lerp(cursorLookPitch, targetLookPitch, 5.0 * delta);

      // Apply base animation + cursor look to Head & Eyes
      headGroup.rotation.x = baseHeadX + cursorLookPitch;
      headGroup.rotation.y = baseHeadY + cursorLookYaw;

      // Pupils track subtly with cursor
      leftEyelidPivot.rotation.y = cursorLookYaw * 0.32;
      rightEyelidPivot.rotation.y = cursorLookYaw * 0.32;
      leftEyelidPivot.rotation.x = cursorLookPitch * 0.32;
      rightEyelidPivot.rotation.x = cursorLookPitch * 0.32;

      // Track Dynamic Drop Shadow
      shadowMesh.position.x = mushakRoot.position.x;
      shadowMesh.position.z = mushakRoot.position.z;

      // Directly update 2D Speech Bubble screen position at 60fps
      if (bubbleRef.current) {
        const bubbleHeadPos = new THREE.Vector3();
        headGroup.getWorldPosition(bubbleHeadPos);
        bubbleHeadPos.y += 0.58; // Pinned cleanly above head
        bubbleHeadPos.project(camera);

        const screenX = ((bubbleHeadPos.x + 1) * width) / 2;
        const screenY = ((-bubbleHeadPos.y + 1) * height) / 2;

        // Keep bubble comfortably on-screen
        const clampedX = Math.max(130, Math.min(width - 130, screenX));
        const clampedY = Math.max(70, Math.min(height - 110, screenY));

        bubbleRef.current.style.left = `${clampedX}px`;
        bubbleRef.current.style.top = `${clampedY}px`;
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // 10. Responsive Resizing
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      aspect = width / height;

      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      if (aspect < 1.1) {
        camera.position.set(0, 3.5, 8.2);
      } else {
        camera.position.set(0, 3.1, 7.2);
      }
      camera.lookAt(0, 0.35, 0);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
      if (container && renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (renderer) {
        try {
          renderer.dispose();
        } catch {}
      }
      scene.clear();
    };
  }, [onTapMushak]);

  return (
    <>
      {/* 3D WebGL Canvas Layer (behind menu buttons, z-10) */}
      <div
        ref={containerRef}
        id="mushak-3d-menu-environment"
        className="absolute inset-0 w-full h-full pointer-events-auto z-10 overflow-hidden"
      />

      {/* 2D Speech Bubble Layer (ABOVE all menu buttons and canvas, z-40) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-40 overflow-hidden">
        {dialogueText && (
          <div
            ref={bubbleRef}
            id="mushak-speech-bubble"
            className="absolute pointer-events-none transition-opacity duration-300 animate-fade-in"
            style={{
              transform: 'translate(-50%, -100%)',
              left: '78%',
              top: '72%',
            }}
          >
            <div className="relative px-4 py-2.5 rounded-2xl bg-stone-900/95 border-2 border-amber-400 text-amber-50 font-bold text-xs sm:text-sm shadow-2xl backdrop-blur-md whitespace-nowrap flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 text-xs shrink-0">
                🐀
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400">Mushak</span>
                <span className="text-stone-100 font-semibold">{dialogueText}</span>
              </div>
            </div>
            {/* Bubble pointer downward indicator */}
            <div className="w-3 h-3 bg-stone-900 rotate-45 mx-auto -mt-1.5 border-r-2 border-b-2 border-amber-400" />
          </div>
        )}
      </div>
    </>
  );
};
