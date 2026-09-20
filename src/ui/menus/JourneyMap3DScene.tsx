/**
 * THE KATHA - 3D Katha Journey Map Scene
 * 
 * Strict specifications implemented:
 * 1. MUSHIKA PLACEMENT: Firmly on top surface of 3D land, feet touching ground, zero sinking/floating.
 * 2. DEFAULT CAMERA: Behind Mushika (over-the-shoulder): CAMERA → MUSHIKA → PATH → LEVEL 2 → LEVEL 3.
 * 3. 3 DISTINCT LANDS: 🌿 Siddham, 🪔 Utsavam, 🌊 Nimajjanam with stepped elevation vista.
 * 4. 3D BANNERS: Physical 3D wooden poles with hanging banners: LEVEL 1/2/3 bold, stage name underneath.
 * 5. JOURNEY ANIMATIONS: Player WATCHES Mushika run along path after Level 1 & Level 2 completion.
 * 6. CAMERA FOLLOW: Camera smoothly follows behind Mushika throughout runs.
 * 7. LEVEL 3 ARRIVAL: Stops, stands, slowly turns to player, smiles/blushes, flexes biceps, "Are you ready?".
 * 8. CAMERA MODES: Exactly 2 states: NORMAL VIEW (behind Mushika) and FULL VIEW (cinematic overview).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { LevelId } from '../../types/game';
import { LevelRegistry } from '../../core/levels/LevelRegistry';
import { audioManager } from '../../core/audio/AudioManager';
import { Sparkles, Play, Lock, CheckCircle2, RotateCcw, Eye, Compass } from 'lucide-react';

interface JourneyMap3DSceneProps {
  unlockedLevels: LevelId[];
  completedLevels: LevelId[];
  justCompletedLevel: LevelId | null;
  onClearJustCompleted?: () => void;
  currentLevelId: LevelId;
  onSetCurrentLevel: (id: LevelId) => void;
  onPlayLevel: (id: LevelId) => void;
  selectedLevelId?: LevelId;
  onSelectLevel?: (id: LevelId) => void;
}

// ==========================================
// 3D LAND COORDINATES & ELEVATIONS
// ==========================================
// Arranged along a scenic forward axis:
// Level 1 (Foreground) -> Level 2 (Midground) -> Level 3 (Background vista)
export const LAND_SURFACE_POSITIONS: Record<LevelId, THREE.Vector3> = {
  [LevelId.LEVEL_1]: new THREE.Vector3(-2.0, 0.5, 4.8),
  [LevelId.LEVEL_2]: new THREE.Vector3(1.8, 1.4, -0.2),
  [LevelId.LEVEL_3]: new THREE.Vector3(-1.2, 2.3, -5.6),
};

// Waypoints for curved path: Siddham -> Utsavam
const PATH_1_WAYPOINTS = [
  new THREE.Vector3(-2.0, 0.5, 4.8),
  new THREE.Vector3(-1.0, 0.72, 3.4),
  new THREE.Vector3(0.2, 0.96, 2.1),
  new THREE.Vector3(1.2, 1.2, 0.9),
  new THREE.Vector3(1.8, 1.4, -0.2),
];

// Waypoints for curved path: Utsavam -> Nimajjanam
const PATH_2_WAYPOINTS = [
  new THREE.Vector3(1.8, 1.4, -0.2),
  new THREE.Vector3(1.3, 1.62, -1.8),
  new THREE.Vector3(0.5, 1.86, -3.2),
  new THREE.Vector3(-0.4, 2.1, -4.5),
  new THREE.Vector3(-1.2, 2.3, -5.6),
];

const curvePath1 = new THREE.CatmullRomCurve3(PATH_1_WAYPOINTS);
const curvePath2 = new THREE.CatmullRomCurve3(PATH_2_WAYPOINTS);

export const JourneyMap3DScene: React.FC<JourneyMap3DSceneProps> = ({
  unlockedLevels,
  completedLevels,
  justCompletedLevel,
  onClearJustCompleted,
  currentLevelId,
  onSetCurrentLevel,
  onPlayLevel,
  selectedLevelId,
  onSelectLevel,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Authoritative current level state
  const initialLand = justCompletedLevel === LevelId.LEVEL_1
    ? LevelId.LEVEL_1
    : justCompletedLevel === LevelId.LEVEL_2
    ? LevelId.LEVEL_2
    : currentLevelId || selectedLevelId || LevelId.LEVEL_1;

  const [currentLand, setCurrentLand] = useState<LevelId>(initialLand);
  const [journeyTargetLand, setJourneyTargetLand] = useState<LevelId | null>(null);

  // 2D Speech Bubble Position & Content
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });
  const [bubbleText, setBubbleText] = useState<string>('');
  const [isAnimatingJourney, setIsAnimatingJourney] = useState<boolean>(false);

  // ==========================================
  // CAMERA SYSTEM: 4 DISCRETE CAMERA MODES
  // ==========================================
  // ENTERING: Cinematic far-distance overview -> zoom into Journey Map -> Behind Mushika
  // NORMAL: Behind Mushika (third-person follow)
  // FULL_VIEW: Zoomed-out entire map + touch drag/pinch or mouse control
  // RETURN: Smooth 1.5s transition from Full View back to Behind Mushika
  type JourneyCameraMode = 'ENTERING' | 'NORMAL' | 'FULL_VIEW' | 'RETURN';

  const [cameraMode, setCameraMode] = useState<JourneyCameraMode>(() =>
    justCompletedLevel ? 'NORMAL' : 'ENTERING'
  );
  const cameraModeRef = useRef<JourneyCameraMode>(justCompletedLevel ? 'NORMAL' : 'ENTERING');

  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mushikaGroupRef = useRef<THREE.Group | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const animatedLightsRef = useRef<THREE.PointLight[]>([]);

  // Camera Target & Position Refs (Behind Mushika ground truth)
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(-0.5, 1.35, 2.45));
  const cameraDesiredPosRef = useRef<THREE.Vector3>(new THREE.Vector3(-3.85, 2.1, 7.65));

  // Current camera look-target vector (interpolated continuously to prevent any snapping)
  const currentCameraLookTargetRef = useRef<THREE.Vector3>(
    justCompletedLevel ? new THREE.Vector3(-0.5, 1.35, 2.45) : new THREE.Vector3(0, 1.3, -0.5)
  );

  // Mushika forward heading vector ref
  const mushikaForwardRef = useRef<THREE.Vector3>(new THREE.Vector3(0.54, 0, -0.84));

  // 1. Cinematic Entry configuration (3-5s target: 4.0s)
  const CINEMATIC_ENTRY_DURATION = 4.0;
  const CINEMATIC_START_POS = new THREE.Vector3(0, 18.0, 26.0);
  const CINEMATIC_START_TARGET = new THREE.Vector3(0, 1.3, -0.5);
  const enteringProgressRef = useRef<number>(0);

  // 2. Device-Responsive Overview / Full View Configuration
  const getResponsiveOverviewParams = useCallback(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    if (width < 768) {
      // Mobile: Elevated bird's-eye view so all 3 lands along Z are comfortably in frame on narrow vertical screens
      return {
        baseRadius: 23.5,
        minRadius: 13.5,
        maxRadius: 32.0,
        basePitch: 0.88, // ~50.4 deg elevation
        minPitch: 0.38,  // well above terrain
        maxPitch: 1.25,  // high angle, prevents extreme upside down
        minYaw: -0.75,
        maxYaw: 0.75,
      };
    } else if (width < 1024) {
      // Tablet: Slightly closer/wider view so all 3 lands remain readable
      return {
        baseRadius: 20.0,
        minRadius: 12.0,
        maxRadius: 28.0,
        basePitch: 0.72, // ~41.2 deg
        minPitch: 0.32,
        maxPitch: 1.18,
        minYaw: -0.65,
        maxYaw: 0.65,
      };
    } else {
      // Desktop: Wide cinematic map view
      return {
        baseRadius: 18.5,
        minRadius: 11.0,
        maxRadius: 26.0,
        basePitch: 0.62, // ~35.5 deg
        minPitch: 0.26,
        maxPitch: 1.12,
        minYaw: -0.55,
        maxYaw: 0.55,
      };
    }
  }, []);

  const targetYawRef = useRef<number>(0);
  const currentYawRef = useRef<number>(0);

  const targetPitchRef = useRef<number>(0.62);
  const currentPitchRef = useRef<number>(0.62);

  const targetRadiusRef = useRef<number>(18.5);
  const currentRadiusRef = useRef<number>(18.5);

  const targetPanXRef = useRef<number>(0);
  const currentPanXRef = useRef<number>(0);

  const targetPanZRef = useRef<number>(0);
  const currentPanZRef = useRef<number>(0);

  // Transitions: Full View & Return
  const FULL_VIEW_TRANSITION_DURATION = 1.4;
  const fullViewStartPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const fullViewStartLookRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const fullViewTransitionTimerRef = useRef<number>(0);

  const RETURN_DURATION = 1.5; // Smooth 1.5s return
  const returnStartPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const returnStartLookRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const returnTimerRef = useRef<number>(0);

  // Cinematic cubic easing helper
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Mushika Articulation & Facial Rigging Refs
  const mushikaPartsRef = useRef<{
    torso: THREE.Group;
    head: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    tailSegments: THREE.Mesh[];
    leftEyelid: THREE.Mesh;
    rightEyelid: THREE.Mesh;
    nose: THREE.Mesh;
    leftEar: THREE.Group;
    rightEar: THREE.Group;
    shadowDisc: THREE.Mesh;
    cheeksLeft: THREE.Mesh;
    cheeksRight: THREE.Mesh;
    smileMesh: THREE.Mesh;
    eyebrowL: THREE.Mesh;
    eyebrowR: THREE.Mesh;
    leftHighlight: THREE.Mesh;
    rightHighlight: THREE.Mesh;
    leftWhiskerGroup: THREE.Group;
    rightWhiskerGroup: THREE.Group;
  } | null>(null);

  // Path journey leg definition
  interface PathLeg {
    fromLand: LevelId;
    toLand: LevelId;
    curve: THREE.CatmullRomCurve3;
    isForward: boolean;
  }

  // Animation Progress Machine with multi-leg path queues
  const currentLandRef = useRef<LevelId>(LevelId.LEVEL_1);

  const animProgressRef = useRef<{
    mode: 'idle' | 'turning' | 'running' | 'flexing';
    currentLand: LevelId;
    targetLand: LevelId;
    legsQueue: PathLeg[];
    activeLeg: PathLeg | null;
    t: number;
    speed: number;
    turnProgress: number;
    turnStartAngle: number;
    turnTargetAngle: number;
    arrivalTimer: number;
    flexTime: number;
  }>({
    mode: 'idle',
    currentLand: LevelId.LEVEL_1,
    targetLand: LevelId.LEVEL_1,
    legsQueue: [],
    activeLeg: null,
    t: 0,
    speed: 0.36, // ~2.7s scenic travel per leg
    turnProgress: 1,
    turnStartAngle: 0,
    turnTargetAngle: 0,
    arrivalTimer: 0,
    flexTime: 0,
  });

  // Helper to generate full path leg sequences between any two lands
  const getJourneyLegs = useCallback((from: LevelId, to: LevelId): PathLeg[] => {
    if (from === to) return [];

    const leg1to2: PathLeg = {
      fromLand: LevelId.LEVEL_1,
      toLand: LevelId.LEVEL_2,
      curve: curvePath1,
      isForward: true,
    };
    const leg2to1: PathLeg = {
      fromLand: LevelId.LEVEL_2,
      toLand: LevelId.LEVEL_1,
      curve: curvePath1,
      isForward: false,
    };
    const leg2to3: PathLeg = {
      fromLand: LevelId.LEVEL_2,
      toLand: LevelId.LEVEL_3,
      curve: curvePath2,
      isForward: true,
    };
    const leg3to2: PathLeg = {
      fromLand: LevelId.LEVEL_3,
      toLand: LevelId.LEVEL_2,
      curve: curvePath2,
      isForward: false,
    };

    if (from === LevelId.LEVEL_1 && to === LevelId.LEVEL_2) return [leg1to2];
    if (from === LevelId.LEVEL_2 && to === LevelId.LEVEL_3) return [leg2to3];
    if (from === LevelId.LEVEL_1 && to === LevelId.LEVEL_3) return [leg1to2, leg2to3];
    if (from === LevelId.LEVEL_3 && to === LevelId.LEVEL_2) return [leg3to2];
    if (from === LevelId.LEVEL_2 && to === LevelId.LEVEL_1) return [leg2to1];
    if (from === LevelId.LEVEL_3 && to === LevelId.LEVEL_1) return [leg3to2, leg2to1];

    return [];
  }, []);

  // Determine initial land based on progress and authoritative current level
  const getInitialLand = useCallback((): LevelId => {
    if (justCompletedLevel === LevelId.LEVEL_1) {
      return LevelId.LEVEL_1;
    }
    if (justCompletedLevel === LevelId.LEVEL_2) {
      return LevelId.LEVEL_2;
    }
    return currentLevelId || selectedLevelId || LevelId.LEVEL_1;
  }, [justCompletedLevel, currentLevelId, selectedLevelId]);

  // Compute camera position BEHIND Mushika
  const updateCameraBehindMushika = useCallback(
    (mushikaPos: THREE.Vector3, forwardDir: THREE.Vector3, distance = 3.4, height = 1.6, lookDist = 2.8, lookHeight = 0.85) => {
      mushikaForwardRef.current.copy(forwardDir);
      const normFwd = forwardDir.clone().setY(0).normalize();
      if (normFwd.lengthSq() < 0.001) normFwd.set(0.54, 0, -0.84).normalize();

      const desiredPos = mushikaPos.clone()
        .sub(normFwd.clone().multiplyScalar(distance))
        .add(new THREE.Vector3(0, height, 0));

      const desiredTarget = mushikaPos.clone()
        .add(normFwd.clone().multiplyScalar(lookDist))
        .add(new THREE.Vector3(0, lookHeight, 0));

      cameraDesiredPosRef.current.copy(desiredPos);
      cameraTargetRef.current.copy(desiredTarget);
    },
    []
  );

  // ==========================================
  // INITIAL MOUNT & THREE.JS SETUP
  // ==========================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x140f24);
    scene.fog = new THREE.FogExp2(0x140f24, 0.038);
    sceneRef.current = scene;

    // 2. Camera: Default Third-Person Behind Mushika
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    cameraRef.current = camera;

    // 3. High-Performance WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'default' });
    } catch {
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
      } catch (err) {
        console.warn('[JourneyMap3DScene] WebGL renderer could not be created:', err);
        return;
      }
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffeedd, 1.35);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffe6b0, 2.2);
    sunLight.position.set(6, 14, 9);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 32;
    sunLight.shadow.camera.left = -12;
    sunLight.shadow.camera.right = 12;
    sunLight.shadow.camera.top = 12;
    sunLight.shadow.camera.bottom = -12;
    scene.add(sunLight);

    const coolRimLight = new THREE.DirectionalLight(0x738aff, 0.85);
    coolRimLight.position.set(-6, 8, -6);
    scene.add(coolRimLight);

    // 5. Build Environment Terrain & Distant Sacred Elements
    buildLandscape(scene);

    // 6. Build the 3 Sacred Lands
    buildLandSiddham(scene);
    buildLandUtsavam(scene);
    const water = buildLandNimajjanam(scene, animatedLightsRef.current);
    waterMeshRef.current = water;

    // 7. Build Connecting Ceremonial Pathways
    buildPathways(scene);

    // 8. Build 3D Physical Banners with prominent LEVEL & stage title
    build3DBanners(scene);

    // 9. Build 3D Mushika Character Model
    const { mushikaGroup, parts } = build3DMushika();
    scene.add(mushikaGroup);
    mushikaGroupRef.current = mushikaGroup;
    mushikaPartsRef.current = parts;

    // 10. Place Mushika firmly on starting land
    const startingLand = getInitialLand();
    const initialSurfacePos = LAND_SURFACE_POSITIONS[startingLand];
    mushikaGroup.position.copy(initialSurfacePos);

    // Initial heading & camera setup
    let initialForward = new THREE.Vector3(0.54, 0, -0.84); // Pointing from Level 1 toward Level 2
    if (startingLand === LevelId.LEVEL_1) {
      mushikaGroup.rotation.y = Math.atan2(initialForward.x, initialForward.z);
      updateCameraBehindMushika(initialSurfacePos, initialForward);
    } else if (startingLand === LevelId.LEVEL_2) {
      initialForward = new THREE.Vector3(-0.24, 0, -0.97); // Pointing toward Level 3
      mushikaGroup.rotation.y = Math.atan2(initialForward.x, initialForward.z);
      updateCameraBehindMushika(initialSurfacePos, initialForward);
    } else {
      // Level 3: Face the camera, hold flex pose
      mushikaGroup.rotation.y = 0;
      updateCameraBehindMushika(initialSurfacePos, new THREE.Vector3(0, 0, -1), 3.2, 1.4, 0, 0.7);
    }

    // Set camera initial position based on active mode
    if (cameraModeRef.current === 'ENTERING') {
      camera.position.copy(CINEMATIC_START_POS);
      currentCameraLookTargetRef.current.copy(CINEMATIC_START_TARGET);
      camera.lookAt(CINEMATIC_START_TARGET);
    } else {
      camera.position.copy(cameraDesiredPosRef.current);
      currentCameraLookTargetRef.current.copy(cameraTargetRef.current);
      camera.lookAt(cameraTargetRef.current);
    }

    // 11. Window Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 12. Main Render & Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.08);
      const time = clock.getElapsedTime();

      // Shimmer Diya Flames
      animatedLightsRef.current.forEach((light, idx) => {
        light.intensity = 1.8 + Math.sin(time * 6 + idx * 1.5) * 0.4;
      });

      // Animate Water ripples in Nimajjanam
      if (waterMeshRef.current) {
        waterMeshRef.current.position.y = 2.08 + Math.sin(time * 2.0) * 0.015;
      }

      // Update Mushika animation state machine
      updateMushika(delta, time);

      // ==========================================
      // CAMERA CONTROLLER: 4 EXPLICIT STATES
      // ==========================================
      const currentMode = cameraModeRef.current;

      if (currentMode === 'ENTERING') {
        // 1. CINEMATIC ENTRY: Starts far distance, zooms smoothly into Behind Mushika view
        enteringProgressRef.current += delta / CINEMATIC_ENTRY_DURATION;
        const t = Math.min(1.0, enteringProgressRef.current);
        const eased = easeInOutCubic(t);

        camera.position.lerpVectors(CINEMATIC_START_POS, cameraDesiredPosRef.current, eased);
        currentCameraLookTargetRef.current.lerpVectors(CINEMATIC_START_TARGET, cameraTargetRef.current, eased);
        camera.lookAt(currentCameraLookTargetRef.current);

        if (t >= 1.0) {
          cameraModeRef.current = 'NORMAL';
          setCameraMode('NORMAL');
        }
      } else if (currentMode === 'NORMAL') {
        // 2. NORMAL: Third-Person Behind Mushika
        camera.position.lerp(cameraDesiredPosRef.current, 0.06);
        currentCameraLookTargetRef.current.lerp(cameraTargetRef.current, 0.07);
        camera.lookAt(currentCameraLookTargetRef.current);
      } else if (currentMode === 'FULL_VIEW') {
        // 3. FULL VIEW: Zoomed-out map + cursor orbit/pan + mouse-wheel zoom
        currentYawRef.current = THREE.MathUtils.lerp(currentYawRef.current, targetYawRef.current, 0.06);
        currentPitchRef.current = THREE.MathUtils.lerp(currentPitchRef.current, targetPitchRef.current, 0.06);
        currentPanXRef.current = THREE.MathUtils.lerp(currentPanXRef.current, targetPanXRef.current, 0.06);
        currentPanZRef.current = THREE.MathUtils.lerp(currentPanZRef.current, targetPanZRef.current, 0.06);
        currentRadiusRef.current = THREE.MathUtils.lerp(currentRadiusRef.current, targetRadiusRef.current, 0.08);

        const cx = currentPanXRef.current;
        const cy = 1.4;
        const cz = -0.5 + currentPanZRef.current;
        const r = currentRadiusRef.current;
        const p = currentPitchRef.current;
        const y = currentYawRef.current;

        const desiredFullPos = new THREE.Vector3(
          cx + r * Math.sin(y) * Math.cos(p),
          cy + r * Math.sin(p),
          cz + r * Math.cos(y) * Math.cos(p)
        );
        const desiredFullLook = new THREE.Vector3(cx, cy, cz);

        if (fullViewTransitionTimerRef.current < FULL_VIEW_TRANSITION_DURATION) {
          fullViewTransitionTimerRef.current += delta;
          const t = Math.min(1.0, fullViewTransitionTimerRef.current / FULL_VIEW_TRANSITION_DURATION);
          const eased = easeInOutCubic(t);

          camera.position.lerpVectors(fullViewStartPosRef.current, desiredFullPos, eased);
          currentCameraLookTargetRef.current.lerpVectors(fullViewStartLookRef.current, desiredFullLook, eased);
          camera.lookAt(currentCameraLookTargetRef.current);
        } else {
          camera.position.lerp(desiredFullPos, 0.08);
          currentCameraLookTargetRef.current.lerp(desiredFullLook, 0.08);
          camera.lookAt(currentCameraLookTargetRef.current);
        }
      } else if (currentMode === 'RETURN') {
        // 4. RETURN: Smooth 1-2s transition from Full View to Behind Mushika
        returnTimerRef.current += delta;
        const t = Math.min(1.0, returnTimerRef.current / RETURN_DURATION);
        const eased = easeInOutCubic(t);

        camera.position.lerpVectors(returnStartPosRef.current, cameraDesiredPosRef.current, eased);
        currentCameraLookTargetRef.current.lerpVectors(returnStartLookRef.current, cameraTargetRef.current, eased);
        camera.lookAt(currentCameraLookTargetRef.current);

        if (t >= 1.0) {
          cameraModeRef.current = 'NORMAL';
          setCameraMode('NORMAL');
        }
      }

      // Update 2D Screen Position for Speech Bubble
      if (mushikaGroupRef.current && cameraRef.current) {
        const headWorldPos = new THREE.Vector3();
        mushikaPartsRef.current?.head.getWorldPosition(headWorldPos);
        headWorldPos.y += 0.58; // Pinned directly above head

        const screenPos = headWorldPos.clone().project(cameraRef.current);
        const screenX = ((screenPos.x + 1) * 0.5) * container.clientWidth;
        const screenY = ((-screenPos.y + 1) * 0.5) * container.clientHeight;

        setBubblePos(prev => ({
          x: screenX,
          y: screenY,
          visible: prev.visible,
        }));
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (renderer) {
        try {
          renderer.dispose();
        } catch {}
      }
    };
  }, []);

  // ==========================================
  // HANDLE LEVEL RUN JOURNEY TRIGGERS
  // ==========================================
  const triggerJourneyToLevel = useCallback((targetLand: LevelId) => {
    const currentLand = currentLandRef.current;

    // If already at targetLand
    if (currentLand === targetLand) {
      setCurrentLand(targetLand);
      setJourneyTargetLand(null);
      onSetCurrentLevel?.(targetLand);
      onSelectLevel?.(targetLand);
      if (!mushikaGroupRef.current) return;
      const pos = LAND_SURFACE_POSITIONS[targetLand];
      mushikaGroupRef.current.position.copy(pos);

      if (targetLand === LevelId.LEVEL_1) {
        const heading = new THREE.Vector3(0.54, 0, -0.84);
        mushikaGroupRef.current.rotation.y = Math.atan2(heading.x, heading.z);
        animProgressRef.current.mode = 'idle';
        updateCameraBehindMushika(pos, heading);
        setBubbleText('🌿 Siddham — Gather sacred clay!');
      } else if (targetLand === LevelId.LEVEL_2) {
        const heading = new THREE.Vector3(-0.24, 0, -0.97);
        mushikaGroupRef.current.rotation.y = Math.atan2(heading.x, heading.z);
        animProgressRef.current.mode = 'idle';
        updateCameraBehindMushika(pos, heading);
        setBubbleText('🪔 Utsavam — Festive celebration awaits!');
      } else {
        mushikaGroupRef.current.rotation.y = 0;
        animProgressRef.current.mode = 'flexing';
        animProgressRef.current.flexTime = 5.0;
        updateCameraBehindMushika(pos, new THREE.Vector3(0, 0, -1), 3.2, 1.4, 0, 0.7);
        setBubbleText('Are you ready?');
      }
      setBubblePos(p => ({ ...p, visible: true }));
      setTimeout(() => {
        setBubblePos(p => ({ ...p, visible: false }));
      }, 2800);
      return;
    }

    // Switch to Behind Mushika mode so player visibly experiences the full journey
    if (cameraModeRef.current === 'FULL_VIEW') {
      cameraModeRef.current = 'NORMAL';
      setCameraMode('NORMAL');
    }

    const legs = getJourneyLegs(currentLand, targetLand);
    if (legs.length === 0) return;

    setIsAnimatingJourney(true);
    setJourneyTargetLand(targetLand);
    setBubblePos(p => ({ ...p, visible: false }));

    const firstLeg = legs[0];
    const initialTangent = firstLeg.isForward
      ? firstLeg.curve.getTangentAt(0)
      : firstLeg.curve.getTangentAt(1).negate();
    const targetAngle = Math.atan2(initialTangent.x, initialTangent.z);
    const currentAngle = mushikaGroupRef.current ? mushikaGroupRef.current.rotation.y : targetAngle;

    animProgressRef.current = {
      mode: 'turning',
      currentLand,
      targetLand,
      legsQueue: legs.slice(1),
      activeLeg: firstLeg,
      t: 0,
      speed: 0.36, // ~2.7s scenic travel per leg
      turnProgress: 0,
      turnStartAngle: currentAngle,
      turnTargetAngle: targetAngle,
      arrivalTimer: 0,
      flexTime: 0,
    };

    audioManager.playSound('laddu_collect');
  }, [onSelectLevel, onSetCurrentLevel, updateCameraBehindMushika, getJourneyLegs]);

  // Synchronize 3D Scene when external currentLevelId changes
  useEffect(() => {
    if (!currentLevelId) return;
    if (currentLandRef.current !== currentLevelId && !isAnimatingJourney) {
      triggerJourneyToLevel(currentLevelId);
    }
  }, [currentLevelId, isAnimatingJourney, triggerJourneyToLevel]);

  // Level click handler for HUD buttons and 3D terrain taps
  const handleLevelClick = useCallback((targetLevelId: LevelId) => {
    const isUnlocked = unlockedLevels.includes(targetLevelId);
    if (!isUnlocked) {
      audioManager.playSound('button_tap');
      const lvl = LevelRegistry.getLevel(targetLevelId);
      setBubbleText(`Complete previous levels to unlock ${lvl?.title || 'this sacred land'}! 🔒`);
      setBubblePos(p => ({ ...p, visible: true }));
      setTimeout(() => setBubblePos(p => ({ ...p, visible: false })), 2800);
      return;
    }

    triggerJourneyToLevel(targetLevelId);
  }, [unlockedLevels, triggerJourneyToLevel]);

  // Handle post-level completion triggers
  useEffect(() => {
    if (!mushikaGroupRef.current) return;

    if (justCompletedLevel === LevelId.LEVEL_1) {
      currentLandRef.current = LevelId.LEVEL_1;
      const startPos = LAND_SURFACE_POSITIONS[LevelId.LEVEL_1];
      mushikaGroupRef.current.position.copy(startPos);
      const startHeading = new THREE.Vector3(0.54, 0, -0.84);
      mushikaGroupRef.current.rotation.y = Math.atan2(startHeading.x, startHeading.z);

      setCameraMode('NORMAL');
      cameraModeRef.current = 'NORMAL';
      updateCameraBehindMushika(startPos, startHeading);

      const timer = setTimeout(() => {
        triggerJourneyToLevel(LevelId.LEVEL_2);
        onClearJustCompleted?.();
      }, 700);

      return () => clearTimeout(timer);
    } else if (justCompletedLevel === LevelId.LEVEL_2) {
      currentLandRef.current = LevelId.LEVEL_2;
      const startPos = LAND_SURFACE_POSITIONS[LevelId.LEVEL_2];
      mushikaGroupRef.current.position.copy(startPos);
      const startHeading = new THREE.Vector3(-0.24, 0, -0.97);
      mushikaGroupRef.current.rotation.y = Math.atan2(startHeading.x, startHeading.z);

      setCameraMode('NORMAL');
      cameraModeRef.current = 'NORMAL';
      updateCameraBehindMushika(startPos, startHeading);

      const timer = setTimeout(() => {
        triggerJourneyToLevel(LevelId.LEVEL_3);
        onClearJustCompleted?.();
      }, 700);

      return () => clearTimeout(timer);
    } else {
      const initialLand = getInitialLand();
      currentLandRef.current = initialLand;
      const pos = LAND_SURFACE_POSITIONS[initialLand];
      mushikaGroupRef.current.position.copy(pos);

      if (initialLand === LevelId.LEVEL_3 && completedLevels.includes(LevelId.LEVEL_2)) {
        mushikaGroupRef.current.rotation.y = 0;
        animProgressRef.current.mode = 'flexing';
        animProgressRef.current.flexTime = 5.0;
        setBubbleText('Are you ready?');
        setBubblePos(p => ({ ...p, visible: true }));
        updateCameraBehindMushika(pos, new THREE.Vector3(0, 0, -1), 3.2, 1.4, 0, 0.7);
      } else {
        animProgressRef.current.mode = 'idle';
        setBubblePos(p => ({ ...p, visible: false }));
        const heading = initialLand === LevelId.LEVEL_1 ? new THREE.Vector3(0.54, 0, -0.84) : new THREE.Vector3(-0.24, 0, -0.97);
        mushikaGroupRef.current.rotation.y = Math.atan2(heading.x, heading.z);
        updateCameraBehindMushika(pos, heading);
      }
    }
  }, [justCompletedLevel, getInitialLand, completedLevels, onClearJustCompleted, triggerJourneyToLevel, updateCameraBehindMushika]);

  // ==========================================
  // MUSHIKA ANIMATION STATE MACHINE
  // ==========================================
  const updateMushika = (delta: number, time: number) => {
    const mushika = mushikaGroupRef.current;
    const parts = mushikaPartsRef.current;
    const anim = animProgressRef.current;
    if (!mushika || !parts) return;

    // Reset facial features if not flexing
    if (anim.mode !== 'flexing') {
      parts.cheeksLeft.visible = false;
      parts.cheeksRight.visible = false;
      parts.eyebrowL.rotation.z = -0.1;
      parts.eyebrowR.rotation.z = 0.1;
      parts.smileMesh.scale.set(1.0, 1.0, 1.0);
    }

    // ----------------------------------------------------
    // 1. TURNING TOWARDS JOURNEY PATH
    // ----------------------------------------------------
    if (anim.mode === 'turning') {
      anim.turnProgress += delta / 0.28; // 0.28s turn
      const t = Math.min(1.0, anim.turnProgress);

      let diff = anim.turnTargetAngle - anim.turnStartAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      mushika.rotation.y = anim.turnStartAngle + diff * t;

      // Turning footwork and subtle torso lean
      const turnCycle = t * Math.PI * 4;
      parts.leftLeg.rotation.x = Math.sin(turnCycle) * 0.35;
      parts.rightLeg.rotation.x = -Math.sin(turnCycle) * 0.35;
      parts.torso.position.y = 0.24 + Math.abs(Math.sin(turnCycle)) * 0.03;
      parts.head.rotation.y = diff * (1 - t) * 0.4;

      if (t >= 1.0) {
        mushika.rotation.y = anim.turnTargetAngle;
        anim.mode = 'running';
        anim.t = 0;
      }
      return;
    }

    // ----------------------------------------------------
    // 2. RUNNING ALONG THE JOURNEY PATH
    // ----------------------------------------------------
    if (anim.mode === 'running') {
      if (!anim.activeLeg) {
        anim.mode = 'idle';
        setIsAnimatingJourney(false);
        return;
      }

      anim.t += delta * anim.speed;
      const leg = anim.activeLeg;
      const isForward = leg.isForward;

      if (anim.t >= 1.0) {
        if (anim.legsQueue.length > 0) {
          // Advance seamlessly to next leg
          anim.activeLeg = anim.legsQueue.shift()!;
          anim.t = 0;
          audioManager.playSound('button_tap');
        } else {
          // Arrived at destination land!
          anim.t = 1.0;
          const finalLand = anim.targetLand;
          currentLandRef.current = finalLand;
          anim.currentLand = finalLand;
          setCurrentLand(finalLand);
          setJourneyTargetLand(null);
          setIsAnimatingJourney(false);

          // Stop firmly on target land surface with feet touching terrain
          mushika.position.copy(LAND_SURFACE_POSITIONS[finalLand]);
          onSetCurrentLevel?.(finalLand);
          onSelectLevel?.(finalLand);
          audioManager.playSound('level_complete');

          if (finalLand === LevelId.LEVEL_3) {
            anim.mode = 'flexing';
            anim.arrivalTimer = 0;
            anim.flexTime = 0;
            updateCameraBehindMushika(mushika.position, new THREE.Vector3(0, 0, -1), 3.2, 1.4, 0, 0.7);
            setBubbleText('Are you ready?');
            setBubblePos(p => ({ ...p, visible: true }));
          } else if (finalLand === LevelId.LEVEL_2) {
            anim.mode = 'idle';
            const headingToL3 = new THREE.Vector3(-0.24, 0, -0.97);
            mushika.rotation.y = Math.atan2(headingToL3.x, headingToL3.z);
            updateCameraBehindMushika(mushika.position, headingToL3);
            setBubbleText('🪔 Utsavam celebration awaits!');
            setBubblePos(p => ({ ...p, visible: true }));
            setTimeout(() => setBubblePos(p => ({ ...p, visible: false })), 3200);
          } else {
            // Level 1
            anim.mode = 'idle';
            const headingToL2 = new THREE.Vector3(0.54, 0, -0.84);
            mushika.rotation.y = Math.atan2(headingToL2.x, headingToL2.z);
            updateCameraBehindMushika(mushika.position, headingToL2);
            setBubbleText('🌿 Siddham — Gather sacred clay!');
            setBubblePos(p => ({ ...p, visible: true }));
            setTimeout(() => setBubblePos(p => ({ ...p, visible: false })), 3200);
          }
        }
      } else {
        // Curve position & tangent
        const curveT = isForward ? anim.t : 1 - anim.t;
        const clampedT = THREE.MathUtils.clamp(curveT, 0, 1);
        const pos = leg.curve.getPointAt(clampedT);
        let tangent = leg.curve.getTangentAt(clampedT);
        if (!isForward) tangent = tangent.clone().negate();

        mushika.position.copy(pos);

        // Face running direction smoothly
        const targetAngle = Math.atan2(tangent.x, tangent.z);
        let diff = targetAngle - mushika.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        mushika.rotation.y += diff * 0.2;

        // Run animation with realistic scamper and natural joint articulation
        animateRunCycle(parts, time);

        // Camera smoothly follows behind Mushika throughout run
        updateCameraBehindMushika(pos, tangent);
      }
      return;
    }

    // ----------------------------------------------------
    // 3. LEVEL 3 ARRIVAL: TURN TO PLAYER, SMILE & BICEPS FLEX
    // ----------------------------------------------------
    if (anim.mode === 'flexing') {
      anim.arrivalTimer += delta;
      anim.flexTime += delta;

      // Phase 1: Turn to face player/camera
      mushika.rotation.y = THREE.MathUtils.lerp(mushika.rotation.y, 0, 0.08);

      // Phase 2: Expression change (Excited, happy smile, blushing cheeks, perked ears)
      parts.cheeksLeft.visible = true;
      parts.cheeksRight.visible = true;

      // Arched joyful eyebrows
      parts.eyebrowL.rotation.z = 0.28 + Math.sin(time * 3) * 0.04;
      parts.eyebrowR.rotation.z = -0.28 - Math.sin(time * 3) * 0.04;

      // Smiling mouth scales up into broad happy grin
      parts.smileMesh.scale.set(1.4, 1.4, 1.3);

      // Cheerful ear perk & wiggle
      parts.leftEar.rotation.z = 0.32 + Math.sin(time * 4) * 0.05;
      parts.rightEar.rotation.z = -0.32 - Math.sin(time * 4) * 0.05;

      // Cute Biceps Flex Pose
      parts.torso.scale.set(0.96, 1.08 + Math.sin(time * 2.5) * 0.02, 1.15);
      parts.leftArm.rotation.set(-0.95, 0.8, 1.55 + Math.sin(time * 3) * 0.04);
      parts.leftArm.position.set(-0.28, 0.44, 0.05);

      parts.rightArm.rotation.set(-0.95, -0.8, -1.55 - Math.sin(time * 3) * 0.04);
      parts.rightArm.position.set(0.28, 0.44, 0.05);

      parts.head.rotation.set(-0.06 + Math.sin(time * 2) * 0.03, 0, -0.12);

      parts.tailSegments.forEach((seg, i) => {
        seg.rotation.x = -0.28 - i * 0.16;
        seg.rotation.y = Math.sin(time * 4 + i * 0.5) * 0.14;
      });

      // Stable feet firmly on ground
      parts.leftLeg.rotation.set(0, 0, 0);
      parts.rightLeg.rotation.set(0, 0, 0);

      if (anim.arrivalTimer >= 1.2 && !bubblePos.visible) {
        setBubbleText('Are you ready?');
        setBubblePos(p => ({ ...p, visible: true }));
        audioManager.playSound('level_complete');
      }
      return;
    }

    // ----------------------------------------------------
    // 4. IDLE POSE (Gentle Breathing, Sniffing, Ear Twitches)
    // ----------------------------------------------------
    animateIdlePose(parts, time);
  };

  // Run Cycle (scampering paws, bouncing body, streaming tail & whiskers)
  const animateRunCycle = (parts: NonNullable<typeof mushikaPartsRef.current>, time: number) => {
    const cycle = time * 20.0;

    // Body spring bounce with forward aerodynamic lean
    parts.torso.position.y = 0.24 + Math.abs(Math.sin(cycle)) * 0.08;
    parts.torso.rotation.x = 0.30;
    parts.torso.scale.set(0.96, 1.02, 1.04);

    // Head stabilized with focused forward gaze
    parts.head.position.y = 0.42 + Math.abs(Math.sin(cycle)) * 0.04;
    parts.head.rotation.set(-0.14, 0, Math.sin(cycle * 0.5) * 0.05);

    // Whiskers swept back in wind
    parts.leftWhiskerGroup.rotation.y = -0.22;
    parts.rightWhiskerGroup.rotation.y = 0.22;

    // Ears swept slightly back in slipstream
    parts.leftEar.rotation.x = -0.25;
    parts.rightEar.rotation.x = -0.25;

    // Forepaws driving scamper gait
    parts.leftArm.rotation.set(Math.sin(cycle) * 0.9, 0.2, 0.25);
    parts.leftArm.position.y = 0.36 + Math.cos(cycle) * 0.04;

    parts.rightArm.rotation.set(-Math.sin(cycle) * 0.9, -0.2, -0.25);
    parts.rightArm.position.y = 0.36 - Math.cos(cycle) * 0.04;

    // Hind legs driving stride
    parts.leftLeg.rotation.x = -Math.sin(cycle) * 0.95;
    parts.rightLeg.rotation.x = Math.sin(cycle) * 0.95;
    parts.leftLeg.position.y = 0.12 + Math.max(0, -Math.sin(cycle)) * 0.06;
    parts.rightLeg.position.y = 0.12 + Math.max(0, Math.sin(cycle)) * 0.06;

    // Tail undulating in dynamic wave
    parts.tailSegments.forEach((seg, i) => {
      seg.rotation.x = 0.24 + i * 0.08;
      seg.rotation.y = Math.sin(cycle - i * 0.55) * 0.26;
    });

    parts.shadowDisc.scale.setScalar(0.9 + Math.sin(cycle) * 0.12);
  };

  // Idle Animation (Gentle breathing, sniffing nose, twitching whiskers & ears)
  const animateIdlePose = (parts: NonNullable<typeof mushikaPartsRef.current>, time: number) => {
    const breath = Math.sin(time * 2.8) * 0.025;
    parts.torso.position.y = 0.24 + breath * 0.4;
    parts.torso.scale.set(1 + breath, 1 + breath * 0.6, 1 - breath * 0.3);
    parts.torso.rotation.set(0, 0, 0);

    parts.head.position.y = 0.44 + breath * 0.25;
    parts.head.rotation.set(
      Math.sin(time * 1.6) * 0.04,
      Math.sin(time * 0.8) * 0.1,
      Math.sin(time * 1.1) * 0.03
    );

    // Cute sniffing nose twitch
    const sniff = Math.sin(time * 10) > 0.4 ? Math.sin(time * 25) * 0.1 : 0;
    parts.nose.scale.setScalar(1.0 + sniff);

    // Delicate whisker quiver with sniffing
    parts.leftWhiskerGroup.rotation.z = sniff * 0.08;
    parts.rightWhiskerGroup.rotation.z = -sniff * 0.08;
    parts.leftWhiskerGroup.rotation.y = 0;
    parts.rightWhiskerGroup.rotation.y = 0;

    // Paws delicately held in front of chest
    parts.leftArm.rotation.set(0.32 + breath, 0.3, 0.2);
    parts.leftArm.position.set(-0.2, 0.34, 0.15);

    parts.rightArm.rotation.set(0.32 + breath, -0.3, -0.2);
    parts.rightArm.position.set(0.2, 0.34, 0.15);

    // Feet firmly flat on ground
    parts.leftLeg.rotation.set(0, 0, 0);
    parts.rightLeg.rotation.set(0, 0, 0);
    parts.leftLeg.position.set(-0.16, 0.12, 0.04);
    parts.rightLeg.position.set(0.16, 0.12, 0.04);

    // Gracefully curled tail
    parts.tailSegments.forEach((seg, i) => {
      seg.rotation.x = 0.05 + i * 0.03;
      seg.rotation.y = Math.sin(time * 1.8 + i * 0.35) * 0.12;
    });

    // Natural blinking
    const isBlinking = time % 4.2 < 0.14;
    parts.leftEyelid.visible = isBlinking;
    parts.rightEyelid.visible = isBlinking;

    // Independent playful ear twitches
    parts.leftEar.rotation.x = 0;
    parts.rightEar.rotation.x = 0;
    if (time % 4.0 < 0.22) {
      parts.leftEar.rotation.z = 0.15 + Math.sin(time * 9.0) * 0.14;
    } else {
      parts.leftEar.rotation.z = 0.15;
    }
    if ((time + 1.8) % 4.5 < 0.2) {
      parts.rightEar.rotation.z = -0.15 - Math.sin(time * 9.0) * 0.14;
    } else {
      parts.rightEar.rotation.z = -0.15;
    }
  };

  // Touch gesture tracker for Mobile & Tablet
  const touchStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    startDist: number;
    startRadius: number;
    isPinching: boolean;
    touchStartTime: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startDist: 0,
    startRadius: 18.5,
    isPinching: false,
    touchStartTime: 0,
  });

  // Open Full View (Wide Overview)
  const handleOpenFullView = () => {
    audioManager.playSound('button_tap');
    if (cameraRef.current) {
      fullViewStartPosRef.current.copy(cameraRef.current.position);
      fullViewStartLookRef.current.copy(currentCameraLookTargetRef.current);
    }
    const params = getResponsiveOverviewParams();
    targetYawRef.current = 0;
    currentYawRef.current = 0;
    targetPitchRef.current = params.basePitch;
    currentPitchRef.current = params.basePitch;
    targetRadiusRef.current = params.baseRadius;
    currentRadiusRef.current = params.baseRadius;
    targetPanXRef.current = 0;
    currentPanXRef.current = 0;
    targetPanZRef.current = 0;
    currentPanZRef.current = 0;

    fullViewTransitionTimerRef.current = 0;
    cameraModeRef.current = 'FULL_VIEW';
    setCameraMode('FULL_VIEW');
  };

  // Return to Behind Mushika (Smooth 1.5s transition)
  const handleReturnToMushika = () => {
    audioManager.playSound('button_tap');
    const land = currentLandRef.current;
    const pos = LAND_SURFACE_POSITIONS[land];

    if (mushikaGroupRef.current) {
      mushikaGroupRef.current.position.copy(pos);
    }

    if (land === LevelId.LEVEL_3) {
      updateCameraBehindMushika(pos, new THREE.Vector3(0, 0, -1), 3.2, 1.4, 0, 0.7);
    } else if (land === LevelId.LEVEL_2) {
      updateCameraBehindMushika(pos, new THREE.Vector3(-0.24, 0, -0.97));
    } else {
      updateCameraBehindMushika(pos, new THREE.Vector3(0.54, 0, -0.84));
    }

    if (cameraRef.current) {
      returnStartPosRef.current.copy(cameraRef.current.position);
      returnStartLookRef.current.copy(currentCameraLookTargetRef.current);
    }
    returnTimerRef.current = 0;
    cameraModeRef.current = 'RETURN';
    setCameraMode('RETURN');
  };

  // Optional skip of cinematic entry
  const handleSkipCinematic = () => {
    enteringProgressRef.current = 1.0;
    cameraModeRef.current = 'NORMAL';
    setCameraMode('NORMAL');
  };

  // Pointer move handler: smooth camera control in Full View (Desktop mouse)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cameraModeRef.current !== 'FULL_VIEW') return;
    const container = mountRef.current;
    if (!container) return;
    const params = getResponsiveOverviewParams();

    const rect = container.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));

    targetYawRef.current = THREE.MathUtils.clamp(nx * 0.52, params.minYaw, params.maxYaw);
    targetPanXRef.current = nx * 2.2;
    targetPitchRef.current = THREE.MathUtils.clamp(params.basePitch - ny * 0.36, params.minPitch, params.maxPitch);
    targetPanZRef.current = -ny * 1.5;
  };

  // Wheel zoom handler: in Full View, zoom in/out with clamp limits
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (cameraModeRef.current !== 'FULL_VIEW') return;
    const params = getResponsiveOverviewParams();
    targetRadiusRef.current = THREE.MathUtils.clamp(
      targetRadiusRef.current + e.deltaY * 0.018,
      params.minRadius,
      params.maxRadius
    );
  };

  // Touch handlers for Mobile & Tablet Full View
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStateRef.current = {
        active: true,
        startX: t.clientX,
        startY: t.clientY,
        lastX: t.clientX,
        lastY: t.clientY,
        startDist: 0,
        startRadius: targetRadiusRef.current,
        isPinching: false,
        touchStartTime: Date.now(),
      };
    } else if (e.touches.length >= 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStateRef.current = {
        ...touchStateRef.current,
        isPinching: true,
        startDist: dist,
        startRadius: targetRadiusRef.current,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (cameraModeRef.current !== 'FULL_VIEW') return;
    const params = getResponsiveOverviewParams();

    if (touchStateRef.current.isPinching && e.touches.length >= 2) {
      // Two-finger pinch to zoom in/out
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (touchStateRef.current.startDist > 0) {
        const factor = currDist / touchStateRef.current.startDist;
        const newRadius = touchStateRef.current.startRadius / factor;
        targetRadiusRef.current = THREE.MathUtils.clamp(newRadius, params.minRadius, params.maxRadius);
      }
    } else if (e.touches.length === 1 && !touchStateRef.current.isPinching) {
      // Single finger drag to orbit & pan
      const t = e.touches[0];
      const dx = t.clientX - touchStateRef.current.lastX;
      const dy = t.clientY - touchStateRef.current.lastY;
      touchStateRef.current.lastX = t.clientX;
      touchStateRef.current.lastY = t.clientY;

      targetYawRef.current = THREE.MathUtils.clamp(
        targetYawRef.current - dx * 0.005,
        params.minYaw,
        params.maxYaw
      );
      targetPitchRef.current = THREE.MathUtils.clamp(
        targetPitchRef.current + dy * 0.004,
        params.minPitch,
        params.maxPitch
      );
      targetPanXRef.current = THREE.MathUtils.clamp(targetPanXRef.current - dx * 0.006, -3.2, 3.2);
      targetPanZRef.current = THREE.MathUtils.clamp(targetPanZRef.current - dy * 0.006, -2.5, 2.5);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      touchStateRef.current.isPinching = false;
    }
    if (e.touches.length === 0) {
      const duration = Date.now() - touchStateRef.current.touchStartTime;
      const dist = Math.hypot(
        touchStateRef.current.lastX - touchStateRef.current.startX,
        touchStateRef.current.lastY - touchStateRef.current.startY
      );
      // Quick tap to select land on touch screen
      if (dist < 14 && duration < 400 && cameraRef.current && mountRef.current) {
        const container = mountRef.current;
        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((touchStateRef.current.startX - rect.left) / rect.width) * 2 - 1,
          -((touchStateRef.current.startY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.6);
        const hitPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, hitPoint)) {
          const l1Dist = hitPoint.distanceTo(new THREE.Vector3(-2.0, 0.6, 4.8));
          const l2Dist = hitPoint.distanceTo(new THREE.Vector3(2.8, 0.6, 0.4));
          const l3Dist = hitPoint.distanceTo(new THREE.Vector3(0.0, 0.6, -4.5));

          if (l1Dist < 3.2) {
            handleLevelClick(LevelId.LEVEL_1);
          } else if (l2Dist < 3.2) {
            handleLevelClick(LevelId.LEVEL_2);
          } else if (l3Dist < 3.2) {
            handleLevelClick(LevelId.LEVEL_3);
          }
        }
      }
      touchStateRef.current.active = false;
    }
  };

  // Click/tap on 3D World Lands (Desktop mouse pointer)
  const pointerDownPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const dist = Math.hypot(e.clientX - pointerDownPosRef.current.x, e.clientY - pointerDownPosRef.current.y);
    if (dist < 10 && cameraRef.current && mountRef.current) {
      const container = mountRef.current;
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.6);
      const hitPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, hitPoint)) {
        const l1Dist = hitPoint.distanceTo(new THREE.Vector3(-2.0, 0.6, 4.8));
        const l2Dist = hitPoint.distanceTo(new THREE.Vector3(2.8, 0.6, 0.4));
        const l3Dist = hitPoint.distanceTo(new THREE.Vector3(0.0, 0.6, -4.5));

        if (l1Dist < 3.2) {
          handleLevelClick(LevelId.LEVEL_1);
        } else if (l2Dist < 3.2) {
          handleLevelClick(LevelId.LEVEL_2);
        } else if (l3Dist < 3.2) {
          handleLevelClick(LevelId.LEVEL_3);
        }
      }
    }
  };

  // Authoritative Level Details
  const activeLevelConfig = LevelRegistry.getLevel(currentLand);
  const targetLevelConfig = journeyTargetLand ? LevelRegistry.getLevel(journeyTargetLand) : null;
  const isActiveUnlocked = unlockedLevels.includes(currentLand);
  const isActiveCompleted = completedLevels.includes(currentLand);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-stone-950 font-sans">
      {/* 3D WebGL Canvas Container with Full View interactive mouse & touch listeners */}
      <div
        ref={mountRef}
        className={`absolute inset-0 w-full h-full touch-none ${
          cameraMode === 'FULL_VIEW' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
        }`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* ==========================================
          2D PINNED SPEECH BUBBLE (Above Head)
          - Reduced in size by ~55% for elegance
          - Close to Mushika's head, does not cover face
          ========================================== */}
      {bubblePos.visible && cameraMode !== 'ENTERING' && (
        <div
          className="pointer-events-none absolute z-50 transition-transform duration-100 ease-out"
          style={{
            left: `${Math.max(100, Math.min(window.innerWidth - 100, bubblePos.x))}px`,
            top: `${Math.max(50, Math.min(window.innerHeight - 70, bubblePos.y))}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div
            className="relative px-2.5 py-1.5 rounded-lg bg-stone-950/95 border border-amber-400/90 text-amber-100 shadow-[0_4px_16px_rgba(0,0,0,0.85)] backdrop-blur-md flex items-center gap-1.5 animate-bounce"
            style={{ animationDuration: '2.4s' }}
          >
            <span className="text-xs shrink-0">🐭</span>
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-wider text-amber-400 leading-none">
                Mushika
              </span>
              <span className="text-[10px] md:text-[11px] font-bold tracking-wide text-amber-100 font-cinzel leading-tight whitespace-nowrap">
                “{bubbleText}”
              </span>
            </div>
            {/* Speech Bubble Arrow pointing down toward Mushika's head */}
            <div className="absolute left-1/2 -bottom-1 w-2 h-2 bg-stone-950 border-r border-b border-amber-400/90 transform -translate-x-1/2 rotate-45" />
          </div>
        </div>
      )}

      {/* ==========================================
          TOP HUD CONTROLS: CAMERA VIEW TOGGLES & STATUS
          ========================================== */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          {cameraMode === 'FULL_VIEW' ? (
            <button
              id="journey-view-toggle-btn"
              type="button"
              onClick={handleReturnToMushika}
              className="px-4 py-2.5 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 text-xs font-black shadow-lg shadow-amber-500/30 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Compass className="w-4 h-4 text-stone-950" />
              <span>Return to Mushika</span>
            </button>
          ) : cameraMode === 'RETURN' ? (
            <div className="px-4 py-2 rounded-xl border border-amber-500/40 bg-stone-900/90 text-amber-300 text-xs font-bold flex items-center gap-2 backdrop-blur-md">
              <RotateCcw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Returning to Mushika...</span>
            </div>
          ) : cameraMode === 'ENTERING' ? (
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 rounded-xl border border-amber-500/40 bg-stone-900/90 text-amber-300 text-xs font-bold flex items-center gap-2 backdrop-blur-md shadow-lg animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Entering The Katha...</span>
              </div>
              <button
                type="button"
                onClick={handleSkipCinematic}
                className="px-3 py-2 rounded-xl border border-stone-700 bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-amber-300 text-xs font-semibold backdrop-blur-md transition-all cursor-pointer"
              >
                Skip
              </button>
            </div>
          ) : (
            <button
              id="journey-view-toggle-btn"
              type="button"
              onClick={handleOpenFullView}
              className="px-4 py-2 rounded-xl border border-amber-500/40 bg-stone-900/90 hover:bg-stone-800 text-amber-200 text-xs font-bold shadow-lg backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Eye className="w-4 h-4 text-amber-300" />
              <span>🔭 Full View (Overview)</span>
            </button>
          )}
        </div>

        {/* In Full View: Helpful Device Instructions */}
        {cameraMode === 'FULL_VIEW' && (
          <div className="pointer-events-auto px-4 py-1.5 rounded-full bg-stone-950/85 border border-amber-500/35 text-amber-200/90 text-xs font-semibold tracking-wide flex items-center gap-2 backdrop-blur-md shadow-md animate-fade-in">
            <span className="hidden sm:inline">🖱️ Move cursor / wheel to explore</span>
            <span className="sm:hidden">👆 Drag to orbit • Pinch to zoom</span>
          </div>
        )}

        {/* Journey Running Status Badge */}
        {isAnimatingJourney && (
          <div className="pointer-events-auto px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-200 text-xs font-black tracking-wider flex items-center gap-2 backdrop-blur-md animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span>MUSHIKA JOURNEYING ALONG PATH...</span>
          </div>
        )}
      </div>

      {/* ==========================================
          BOTTOM STAGE SELECTOR & LAUNCH CARD
          ========================================== */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex flex-col md:flex-row items-end md:items-center justify-between gap-4 pointer-events-none">
        {/* The 3 Stage Nodes */}
        <div className="pointer-events-auto flex items-center gap-2.5 overflow-x-auto p-1.5 rounded-2xl bg-stone-950/85 border border-amber-500/30 backdrop-blur-md shadow-2xl max-w-full">
          {LevelRegistry.getAllLevels().map((lvl) => {
            const isUnlocked = unlockedLevels.includes(lvl.id);
            const isCompleted = completedLevels.includes(lvl.id);
            const isCurrent = currentLand === lvl.id;
            const isTarget = journeyTargetLand === lvl.id;

            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  handleLevelClick(lvl.id);
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isTarget
                    ? 'bg-amber-500/30 border border-amber-400 text-amber-100 font-black shadow-lg scale-105 animate-pulse'
                    : isCurrent && !journeyTargetLand
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-stone-950 font-black shadow-lg scale-105 border border-amber-300'
                    : isUnlocked
                    ? 'bg-stone-900/80 hover:bg-stone-800 text-amber-200 border border-amber-500/20'
                    : 'bg-stone-900/40 text-stone-500 border border-stone-800 opacity-60'
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black tracking-wider uppercase">
                      Level {lvl.index}
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : !isUnlocked ? (
                      <Lock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                    )}
                  </div>
                  <span className="text-sm font-black truncate max-w-[115px]">
                    {lvl.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail Callout & Play Button */}
        <div className="pointer-events-auto w-full md:w-80 p-3.5 rounded-2xl bg-stone-950/90 border border-amber-500/40 backdrop-blur-md shadow-2xl flex flex-col gap-2">
          {isAnimatingJourney && targetLevelConfig ? (
            /* Traveling in progress: NEVER show Play button while traveling */
            <>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Journeying to Level {targetLevelConfig.index}</span>
                  </div>
                  <h3 className="text-base font-black text-amber-100 leading-tight">
                    {targetLevelConfig.title}
                  </h3>
                  <p className="text-[11px] text-stone-400 font-medium">
                    Mushika is traveling along the sacred path...
                  </p>
                </div>
                <div className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold animate-pulse">
                  EN ROUTE
                </div>
              </div>
              <div className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 font-bold text-xs flex items-center justify-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Arriving at {targetLevelConfig.title}...</span>
              </div>
            </>
          ) : (
            /* Arrived on land: Active level matches Mushika's authoritative land */
            <>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Stage {activeLevelConfig.index} of 3
                  </div>
                  <h3 className="text-base font-black text-amber-100 leading-tight">
                    {activeLevelConfig.title}
                  </h3>
                  <p className="text-[11px] text-stone-400 font-medium">
                    {activeLevelConfig.location}
                  </p>
                </div>
                <div className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  {isActiveCompleted ? 'COMPLETED' : isActiveUnlocked ? 'UNLOCKED' : 'LOCKED'}
                </div>
              </div>

              <p className="text-[11px] text-stone-300 line-clamp-2">
                {activeLevelConfig.objectiveBrief}
              </p>

              {/* Action Button */}
              {isActiveUnlocked ? (
                <button
                  id={`play-stage-${activeLevelConfig.index}-btn`}
                  type="button"
                  onClick={() => onPlayLevel(activeLevelConfig.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {isActiveCompleted
                      ? `REPLAY LEVEL ${activeLevelConfig.index}`
                      : `PLAY LEVEL ${activeLevelConfig.index}`}
                  </span>
                </button>
              ) : (
                <div className="w-full py-2 px-3 rounded-xl bg-stone-900 border border-stone-800 text-stone-500 text-xs font-bold flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Complete Level {activeLevelConfig.index - 1} to Unlock</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3D PROCEDURAL SCENE BUILDERS
// ==========================================

function buildLandscape(scene: THREE.Scene) {
  // Base terrain ground
  const groundGeo = new THREE.PlaneGeometry(36, 36, 24, 24);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x161d15,
    roughness: 0.95,
    metalness: 0.05,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  scene.add(ground);

  // Distant Mountain Ridges
  for (let i = 0; i < 9; i++) {
    const r = 3.0 + Math.random() * 2.5;
    const h = 5.0 + Math.random() * 4.0;
    const coneGeo = new THREE.ConeGeometry(r, h, 6);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0x1a162b,
      roughness: 0.95,
    });
    const mtn = new THREE.Mesh(coneGeo, coneMat);
    mtn.position.set(-16 + i * 4.0, h * 0.5 - 0.2, -12 - Math.random() * 4);
    scene.add(mtn);
  }

  // Floating Sky Lanterns
  for (let i = 0; i < 24; i++) {
    const lantern = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.32, 8),
      new THREE.MeshBasicMaterial({ color: 0xffaa33 })
    );
    lantern.position.set(-14 + Math.random() * 28, 4.0 + Math.random() * 6.5, -4 - Math.random() * 10);
    scene.add(lantern);
  }
}

// 🌿 Land 1: SIDDHAM (Sacred Clay & Grove)
// Surface Y is exactly 0.50
function buildLandSiddham(scene: THREE.Scene) {
  const root = new THREE.Group();
  root.position.set(-2.0, 0, 4.8);

  // Island base (radius 2.6, height 0.5, top surface exactly at y = 0.5)
  const islandGeo = new THREE.CylinderGeometry(2.6, 2.9, 0.5, 32);
  const islandMat = new THREE.MeshStandardMaterial({
    color: 0x274324, // Lush grove green
    roughness: 0.85,
  });
  const island = new THREE.Mesh(islandGeo, islandMat);
  island.position.y = 0.25;
  island.receiveShadow = true;
  island.castShadow = true;
  root.add(island);

  // Sacred Clay Pedestal Altar (placed at back right so center is open for Mushika)
  const altar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.8, 0.2, 16),
    new THREE.MeshStandardMaterial({ color: 0x9a4f2e, roughness: 0.7 })
  );
  altar.position.set(1.4, 0.6, -0.6);
  root.add(altar);

  // Earthen Clay Pots for gathering sacred river clay
  for (let i = 0; i < 3; i++) {
    const pot = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 })
    );
    pot.scale.set(1, 1.15, 1);
    pot.position.set(-1.8 + i * 0.35, 0.62, -0.4);
    pot.castShadow = true;
    root.add(pot);
  }

  // Sacred Banyan Sapling placed safely to far back-left
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.22, 1.8, 10),
    new THREE.MeshStandardMaterial({ color: 0x4a2e1d, roughness: 0.9 })
  );
  trunk.position.set(-1.6, 1.3, -1.2);
  root.add(trunk);

  const foliage = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.9, 1),
    new THREE.MeshStandardMaterial({ color: 0x1b4d21, roughness: 0.8 })
  );
  foliage.position.set(-1.6, 2.3, -1.2);
  foliage.castShadow = true;
  root.add(foliage);

  // Clusters of 21 Sacred Durva Grass on perimeter
  for (let i = 0; i < 12; i++) {
    const grass = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.4, 4),
      new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.6 })
    );
    const ang = 0.8 + (i / 12) * Math.PI * 1.5;
    grass.position.set(Math.cos(ang) * 2.1, 0.65, Math.sin(ang) * 2.1);
    root.add(grass);
  }

  scene.add(root);
}

// 🪔 Land 2: UTSAVAM (Grand Festive Celebration)
// Surface Y is exactly 1.40
function buildLandUtsavam(scene: THREE.Scene) {
  const root = new THREE.Group();
  root.position.set(1.8, 0, -0.2);

  // Elevated Island Base (height 1.4, top surface exactly at y = 1.4)
  const islandGeo = new THREE.CylinderGeometry(2.7, 3.1, 1.4, 32);
  const islandMat = new THREE.MeshStandardMaterial({
    color: 0x542b1e, // Festive terracotta courtyard
    roughness: 0.75,
  });
  const island = new THREE.Mesh(islandGeo, islandMat);
  island.position.y = 0.7;
  island.receiveShadow = true;
  island.castShadow = true;
  root.add(island);

  // Rangoli Mandala disc flat on floor
  const rangoli = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 1.4, 32),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, side: THREE.DoubleSide })
  );
  rangoli.rotation.x = -Math.PI / 2;
  rangoli.position.y = 1.405;
  root.add(rangoli);

  // Festive Pandal Pillars spread out wide so center is open
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });
  const pillarCoords = [
    [-1.7, -1.4],
    [1.7, -1.4],
    [-1.7, 1.4],
    [1.7, 1.4],
  ];

  pillarCoords.forEach(([px, pz]) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 8), pillarMat);
    pillar.position.set(px, 2.5, pz);
    pillar.castShadow = true;
    root.add(pillar);
  });

  // Festive Canopy Roof Overhead
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(2.4, 0.9, 4),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
  );
  canopy.position.set(0, 3.9, 0);
  canopy.rotation.y = Math.PI / 4;
  canopy.castShadow = true;
  root.add(canopy);

  // Dhol Drum on side
  const dhol = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.7, 16),
    new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.5 })
  );
  dhol.rotation.z = Math.PI / 2;
  dhol.position.set(-1.8, 1.6, 0.2);
  root.add(dhol);

  // Brass Modak Offering Plate
  const thali = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.35, 0.05, 16),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 })
  );
  thali.position.set(1.6, 1.43, 0.5);
  root.add(thali);

  for (let i = 0; i < 5; i++) {
    const modak = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.13, 8),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 })
    );
    const a = (i / 5) * Math.PI * 2;
    modak.position.set(1.6 + Math.cos(a) * 0.16, 1.5, 0.5 + Math.sin(a) * 0.16);
    root.add(modak);
  }

  // Burning Brass Diya on side
  const diya = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 })
  );
  diya.position.set(-1.2, 1.45, 1.4);
  root.add(diya);

  scene.add(root);
}

// 🌊 Land 3: NIMAJJANAM (Sacred Immersion Ghat & Festive Lake)
// Surface Y is exactly 2.30
function buildLandNimajjanam(scene: THREE.Scene, animatedLights?: THREE.PointLight[]): THREE.Mesh {
  const root = new THREE.Group();
  root.position.set(-1.2, 0, -5.6);

  // 1. Stone Bathing Ghat Platform (top surface exactly at y = 2.30)
  const ghatGeo = new THREE.BoxGeometry(4.4, 2.3, 3.4);
  const ghatMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // Warm slate river stone ghat
    roughness: 0.72,
  });
  const ghat = new THREE.Mesh(ghatGeo, ghatMat);
  ghat.position.set(0, 1.15, 0);
  ghat.receiveShadow = true;
  ghat.castShadow = true;
  root.add(ghat);

  // Carved border curbs on the ghat edge
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
  const curbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 3.4), curbMat);
  curbLeft.position.set(-2.15, 2.34, 0);
  root.add(curbLeft);
  const curbRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 3.4), curbMat);
  curbRight.position.set(2.15, 2.34, 0);
  root.add(curbRight);

  // 2. Sacred Rangoli & Floral Petal Mandala on the Ghat Floor
  const rangoliCenter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.015, 24),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 }) // Warm turmeric yellow
  );
  rangoliCenter.position.set(0, 2.308, 0.4);
  root.add(rangoliCenter);

  const rangoliRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 0.012, 24),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 }) // Saffron kumkum ring
  );
  rangoliRing.position.set(0, 2.305, 0.4);
  root.add(rangoliRing);

  // Rangoli petal accents
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const petal = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xef4444 : 0xffffff, roughness: 0.4 })
    );
    petal.scale.set(1, 0.25, 1.4);
    petal.position.set(Math.cos(ang) * 0.72, 2.31, 0.4 + Math.sin(ang) * 0.72);
    petal.rotation.y = -ang;
    root.add(petal);
  }

  // 3. Festive Petal Trail / Pathway leading toward the water steps
  for (let z = 0.8; z >= -1.5; z -= 0.35) {
    const flowerScatter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.01, 12),
      new THREE.MeshStandardMaterial({ color: z % 0.7 === 0 ? 0xf97316 : 0xfbbf24, roughness: 0.6 })
    );
    flowerScatter.position.set(0, 2.306, z);
    root.add(flowerScatter);
  }

  // 4. Stepped Ghat stones descending into the sacred water
  for (let i = 0; i < 4; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.16, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65 })
    );
    step.position.set(0, 2.20 - i * 0.13, -1.75 - i * 0.38);
    step.receiveShadow = true;
    root.add(step);

    // Diya on each step side
    const stepDiyaL = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.08, 8),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
    );
    stepDiyaL.position.set(-1.45, 2.28 - i * 0.13, -1.75 - i * 0.38);
    root.add(stepDiyaL);

    const stepDiyaR = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.08, 8),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
    );
    stepDiyaR.position.set(1.45, 2.28 - i * 0.13, -1.75 - i * 0.38);
    root.add(stepDiyaR);
  }

  // 5. Sacred Water Lake / Reservoir (Kalyani)
  const waterGeo = new THREE.PlaneGeometry(6.2, 4.4);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Sacred cyan-blue water
    roughness: 0.12,
    metalness: 0.3,
    transparent: true,
    opacity: 0.9,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 2.08, -3.6);
  root.add(water);

  // 6. Floating Sacred Pink Lotuses & Water Diyas
  const lotusPositions = [
    { x: -1.6, z: -3.0 },
    { x: -0.6, z: -4.0 },
    { x: 0.5, z: -3.2 },
    { x: 1.5, z: -4.1 },
    { x: -1.2, z: -4.6 },
    { x: 1.1, z: -2.8 },
  ];
  lotusPositions.forEach((pos, idx) => {
    const lotusLeaf = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.01, 16),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 })
    );
    lotusLeaf.position.set(pos.x, 2.09, pos.z);
    root.add(lotusLeaf);

    const lotus = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? 0xf472b6 : 0xfb7185, roughness: 0.35 })
    );
    lotus.position.set(pos.x, 2.18, pos.z);
    root.add(lotus);

    // Earthen floating lamp on alternating lotuses
    if (idx % 2 === 0) {
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffaa22 })
      );
      lamp.position.set(pos.x, 2.29, pos.z);
      root.add(lamp);
    }
  });

  // 7. Eco-Friendly Clay Ganesh Idol Representation (Reverently placed by the ghat)
  const altarGroup = new THREE.Group();
  altarGroup.position.set(1.45, 2.30, -0.4);

  // Marble Altar Base
  const altarBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.58, 0.22, 16),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3, metalness: 0.1 })
  );
  altarBase.position.y = 0.11;
  altarBase.castShadow = true;
  altarGroup.add(altarBase);

  // Marigold Garland around Altar Base
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const gFlower = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 8, 8),
      new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xf97316 : 0xfacc15, roughness: 0.5 })
    );
    gFlower.position.set(Math.cos(a) * 0.48, 0.22, Math.sin(a) * 0.48);
    altarGroup.add(gFlower);
  }

  // Eco-Friendly Natural Terracotta Clay Ganesh Idol
  const clayMat = new THREE.MeshStandardMaterial({
    color: 0xa16207, // Sacred unbaked eco-friendly river clay
    roughness: 0.85,
  });

  // Idol Body
  const idolBody = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), clayMat);
  idolBody.scale.set(1, 1.15, 0.95);
  idolBody.position.y = 0.42;
  idolBody.castShadow = true;
  altarGroup.add(idolBody);

  // Idol Head
  const idolHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), clayMat);
  idolHead.position.set(0, 0.72, 0.03);
  idolHead.castShadow = true;
  altarGroup.add(idolHead);

  // Clay Ears
  const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 10), clayMat);
  earL.rotation.z = Math.PI / 2;
  earL.rotation.y = 0.2;
  earL.position.set(-0.2, 0.74, 0.02);
  altarGroup.add(earL);

  const earR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 10), clayMat);
  earR.rotation.z = Math.PI / 2;
  earR.rotation.y = -0.2;
  earR.position.set(0.2, 0.74, 0.02);
  altarGroup.add(earR);

  // Clay Trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.025, 0.24, 8), clayMat);
  trunk.rotation.x = -0.3;
  trunk.rotation.z = -0.2;
  trunk.position.set(-0.03, 0.62, 0.16);
  altarGroup.add(trunk);

  // Golden Mukut / Crown
  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(0.11, 0.22, 10),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.7 })
  );
  crown.position.set(0, 0.96, 0.03);
  altarGroup.add(crown);

  // Modak in Hand
  const modakOffering = new THREE.Mesh(
    new THREE.ConeGeometry(0.045, 0.08, 8),
    new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 })
  );
  modakOffering.position.set(-0.16, 0.46, 0.18);
  altarGroup.add(modakOffering);

  // Saffron Ceremonial Shawl (Angavastram)
  const shawl = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.035, 8, 16, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.6 })
  );
  shawl.rotation.x = Math.PI / 2 + 0.3;
  shawl.position.set(0, 0.58, 0.04);
  altarGroup.add(shawl);

  // Facing toward Mushika and the sacred water
  altarGroup.rotation.y = -0.4;
  root.add(altarGroup);

  // 8. Immersion Gateway Pillars with Festoon Flags
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.65 });
  const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 2.5, 12), pillarMat);
  p1.position.set(-1.85, 3.45, 0.9);
  p1.castShadow = true;
  root.add(p1);

  const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 2.5, 12), pillarMat);
  p2.position.set(1.85, 3.45, 0.9);
  p2.castShadow = true;
  root.add(p2);

  // Golden Finials on Pillars
  const finial1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.75, roughness: 0.25 })
  );
  finial1.position.set(-1.85, 4.75, 0.9);
  root.add(finial1);

  const finial2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.75, roughness: 0.25 })
  );
  finial2.position.set(1.85, 4.75, 0.9);
  root.add(finial2);

  // Saffron & Golden Sacred Immersion Flags (Buntings)
  const flag1 = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.85, 3),
    new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5 })
  );
  flag1.rotation.z = -Math.PI / 2;
  flag1.position.set(-1.5, 4.6, 0.9);
  root.add(flag1);

  const flag2 = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.85, 3),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 })
  );
  flag2.rotation.z = Math.PI / 2;
  flag2.position.set(1.5, 4.6, 0.9);
  root.add(flag2);

  // Hanging Marigold Toran / Garland across gateway
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const x = -1.85 + t * 3.7;
    const sag = Math.sin(t * Math.PI) * 0.45;
    const toranFlower = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 8, 8),
      new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xf97316 : 0xfacc15, roughness: 0.5 })
    );
    toranFlower.position.set(x, 4.5 - sag, 0.9);
    root.add(toranFlower);
  }

  // 9. Burning Brass Diyas with flickering illumination
  const diyaPoints = [
    { x: -1.8, y: 2.30, z: -0.8 },
    { x: 1.8, y: 2.30, z: -0.8 },
    { x: -1.7, y: 2.30, z: 0.8 },
    { x: 1.7, y: 2.30, z: 0.8 },
  ];

  diyaPoints.forEach((pt) => {
    // Brass Diya Lamp Body
    const diyaBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.08, 0.09, 12),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 })
    );
    diyaBody.position.set(pt.x, pt.y + 0.045, pt.z);
    root.add(diyaBody);

    // Glowing Flame
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffdd44 })
    );
    flame.position.set(pt.x, pt.y + 0.14, pt.z);
    root.add(flame);

    // Point Light for authentic warm illumination
    const pLight = new THREE.PointLight(0xff9922, 1.4, 3.8);
    pLight.position.set(pt.x + root.position.x, pt.y + 0.25, pt.z + root.position.z);
    scene.add(pLight);
    if (animatedLights) {
      animatedLights.push(pLight);
    }
  });

  // 10. Natural Greenery & Riverbank Reeds
  // Reeds along the water's edge
  for (let i = 0; i < 16; i++) {
    const side = i < 8 ? -1 : 1;
    const offset = (i % 8) * 0.45;
    const reedHeight = 0.8 + Math.random() * 0.7;
    const reed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.04, reedHeight, 6),
      new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 })
    );
    reed.position.set(side * (2.2 + Math.random() * 0.5), 2.1 + reedHeight * 0.5, -2.0 - offset);
    reed.rotation.z = side * (0.08 + Math.random() * 0.12);
    root.add(reed);
  }

  scene.add(root);
  return water;
}

// Curved Connecting Pathways with Stepping Flagstones
function buildPathways(scene: THREE.Scene) {
  const pathMat = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.8,
  });

  // Path 1: Siddham -> Utsavam
  for (let t = 0.08; t <= 0.92; t += 0.06) {
    const pt = curvePath1.getPointAt(t);
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.08, 10), pathMat);
    stone.position.set(pt.x, pt.y - 0.02, pt.z);
    stone.receiveShadow = true;
    scene.add(stone);

    // Marigold Petal Accents along path
    if (Math.round(t * 10) % 2 === 0) {
      const diya = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
      );
      diya.position.set(pt.x + 0.4, pt.y + 0.04, pt.z);
      scene.add(diya);
    }
  }

  // Path 2: Utsavam -> Nimajjanam
  for (let t = 0.08; t <= 0.92; t += 0.06) {
    const pt = curvePath2.getPointAt(t);
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.08, 10), pathMat);
    stone.position.set(pt.x, pt.y - 0.02, pt.z);
    stone.receiveShadow = true;
    scene.add(stone);

    if (Math.round(t * 10) % 2 === 0) {
      const diya = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
      );
      diya.position.set(pt.x + 0.4, pt.y + 0.04, pt.z);
      scene.add(diya);
    }
  }
}

// ==========================================
// 3D PHYSICAL BANNERS ON EVERY LAND
// ==========================================
// Prominently displays:
// LEVEL 1 (Bold)
// SIDDHAM (Underneath)
// Upright, readable from default player camera.
function createBannerTexture(
  levelIndex: number,
  stageName: string,
  iconSymbol: string,
  bgStart: string,
  bgEnd: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Deep royal ceremonial background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 384);
  grad.addColorStop(0, bgStart);
  grad.addColorStop(1, bgEnd);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 384);

  // Ornate gold border
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 12;
  ctx.strokeRect(16, 16, 480, 352);

  ctx.strokeStyle = 'rgba(253, 224, 71, 0.4)';
  ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, 460, 332);

  // Decorative corner medallions
  const drawCorner = (x: number, y: number) => {
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCorner(26, 26);
  drawCorner(486, 26);
  drawCorner(26, 358);
  drawCorner(486, 358);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Icon symbol
  ctx.font = '38px serif';
  ctx.fillText(iconSymbol, 256, 68);

  // BOLD PROMINENT LEVEL NUMBER
  ctx.font = '900 62px "Cinzel", "Times New Roman", serif';
  ctx.fillStyle = '#fde047';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 10;
  ctx.fillText(`LEVEL ${levelIndex}`, 256, 148);

  // Golden divider line
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(90, 202);
  ctx.lineTo(422, 202);
  ctx.stroke();

  // Central diamond
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.moveTo(256, 192);
  ctx.lineTo(266, 202);
  ctx.lineTo(256, 212);
  ctx.lineTo(246, 202);
  ctx.closePath();
  ctx.fill();

  // STAGE NAME DIRECTLY UNDERNEATH
  ctx.font = '800 48px "Cinzel", "Times New Roman", serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 8;
  ctx.fillText(stageName.toUpperCase(), 256, 272);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function create3DBannerStand(
  levelIndex: number,
  stageName: string,
  icon: string,
  bgStart: string,
  bgEnd: string
): THREE.Group {
  const group = new THREE.Group();

  // Vertical wooden/bamboo pole (firmly planted upright)
  const poleGeo = new THREE.CylinderGeometry(0.06, 0.07, 3.2, 12);
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x3d200e,
    roughness: 0.7,
    metalness: 0.1,
  });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 1.6;
  pole.castShadow = true;
  group.add(pole);

  // Brass base ring
  const baseRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.1, 16),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 })
  );
  baseRing.position.y = 0.05;
  group.add(baseRing);

  // Horizontal crossbar at top
  const crossGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 10);
  const cross = new THREE.Mesh(crossGeo, poleMat);
  cross.rotation.z = Math.PI / 2;
  cross.position.set(0, 2.9, 0);
  cross.castShadow = true;
  group.add(cross);

  // Golden finials
  const finialMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.85,
    roughness: 0.2,
  });
  const fLeft = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), finialMat);
  fLeft.position.set(-0.9, 2.9, 0);
  group.add(fLeft);

  const fRight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), finialMat);
  fRight.position.set(0.9, 2.9, 0);
  group.add(fRight);

  const fTop = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 12), finialMat);
  fTop.position.set(0, 3.25, 0);
  group.add(fTop);

  // Hanging rings
  const ringGeo = new THREE.TorusGeometry(0.04, 0.01, 8, 16);
  const ring1 = new THREE.Mesh(ringGeo, finialMat);
  ring1.position.set(-0.55, 2.82, 0);
  group.add(ring1);
  const ring2 = new THREE.Mesh(ringGeo, finialMat);
  ring2.position.set(0.55, 2.82, 0);
  group.add(ring2);

  // Physical Hanging Cloth Banner Mesh
  const bannerTexture = createBannerTexture(levelIndex, stageName, icon, bgStart, bgEnd);
  const bannerMat = new THREE.MeshStandardMaterial({
    map: bannerTexture,
    roughness: 0.6,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const bannerGeo = new THREE.BoxGeometry(1.5, 1.1, 0.02);
  const bannerMesh = new THREE.Mesh(bannerGeo, bannerMat);
  bannerMesh.position.set(0, 2.2, 0);
  bannerMesh.castShadow = true;
  group.add(bannerMesh);

  // Golden fringe tassels along bottom edge
  for (let i = 0; i < 7; i++) {
    const tassel = new THREE.Mesh(
      new THREE.ConeGeometry(0.035, 0.16, 6),
      finialMat
    );
    tassel.position.set(-0.6 + i * 0.2, 1.58, 0);
    group.add(tassel);
  }

  return group;
}

function build3DBanners(scene: THREE.Scene) {
  // Default camera vector is roughly looking towards (+0.5, -0.2, -0.85)
  // We angle each banner so it is directly readable from default camera position:
  const cameraFocusRay = new THREE.Vector3(-3.85, 2.1, 7.65);

  // 1. Level 1 Banner (Siddham)
  const banner1 = create3DBannerStand(1, 'SIDDHAM', '🌿', '#14532d', '#052e16');
  banner1.position.set(-0.6, 0.5, 4.4);
  banner1.lookAt(cameraFocusRay.x, banner1.position.y, cameraFocusRay.z);
  scene.add(banner1);

  // 2. Level 2 Banner (Utsavam)
  const banner2 = create3DBannerStand(2, 'UTSAVAM', '🪔', '#9a3412', '#451a03');
  banner2.position.set(3.4, 1.4, -0.4);
  banner2.lookAt(cameraFocusRay.x, banner2.position.y, cameraFocusRay.z);
  scene.add(banner2);

  // 3. Level 3 Banner (Nimajjanam)
  const banner3 = create3DBannerStand(3, 'NIMAJJANAM', '🌊', '#075985', '#082f49');
  banner3.position.set(0.6, 2.3, -5.2);
  banner3.lookAt(cameraFocusRay.x, banner3.position.y, cameraFocusRay.z);
  scene.add(banner3);
}

// ==========================================
// 3D MUSHIKA MODEL & FACIAL RIGGING BUILDER
// ==========================================
function build3DMushika() {
  const mushikaGroup = new THREE.Group();
  mushikaGroup.scale.set(1.3, 1.3, 1.3);

  // High-Quality Character Materials
  const furMat = new THREE.MeshStandardMaterial({
    color: 0x8e8781, // Soft velvety mouse grey with warm undertone
    roughness: 0.82,
    metalness: 0.04,
  });

  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xf7f3ec, // Warm cream underbelly & muzzle
    roughness: 0.88,
  });

  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xfca5a5, // Soft translucent rosy peach (inner ears, nose, paw pads, tail)
    roughness: 0.65,
    metalness: 0.04,
  });

  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c, // Sacred red neck ribbon
    roughness: 0.5,
  });

  const bellMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, // Golden brass bell
    metalness: 0.85,
    roughness: 0.2,
  });

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x07070a, // Deep obsidian cornea
    roughness: 0.04,
    metalness: 0.2,
  });

  const irisMat = new THREE.MeshStandardMaterial({
    color: 0x3d2215, // Warm dark hazel iris ring
    roughness: 0.4,
  });

  const eyelidMat = new THREE.MeshStandardMaterial({
    color: 0x8e8781,
    roughness: 0.82,
  });

  const cheekBlushMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    roughness: 0.6,
    transparent: true,
    opacity: 0.85,
  });

  const eyebrowMat = new THREE.MeshStandardMaterial({
    color: 0x3f3f46,
    roughness: 0.9,
  });

  const whiskerMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.3,
    metalness: 0.1,
  });

  const tilakMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.3,
    metalness: 0.1,
  });

  // Dynamic soft contact shadow disc beneath feet
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x0a0a0c,
    transparent: true,
    opacity: 0.45,
  });
  const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.005;
  mushikaGroup.add(shadowDisc);

  // Torso / Pear Body
  const torso = new THREE.Group();
  torso.position.y = 0.24;
  mushikaGroup.add(torso);

  const bodyGeo = new THREE.SphereGeometry(0.32, 24, 24);
  bodyGeo.scale(1.0, 1.18, 0.92);
  const bodyMesh = new THREE.Mesh(bodyGeo, furMat);
  bodyMesh.castShadow = true;
  torso.add(bodyMesh);

  // Cream Belly Patch
  const bellyGeo = new THREE.SphereGeometry(0.24, 20, 20);
  bellyGeo.scale(0.85, 1.05, 0.5);
  const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
  bellyMesh.position.set(0, -0.04, 0.2);
  torso.add(bellyMesh);

  // Sacred Red Ribbon & Bell
  const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.03, 10, 24), ribbonMat);
  ribbon.rotation.x = Math.PI / 2;
  ribbon.position.y = 0.26;
  torso.add(ribbon);

  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), bellMat);
  bell.position.set(0, 0.22, 0.24);
  bell.castShadow = true;
  torso.add(bell);

  // Small clapper hole on bell
  const bellHole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8), eyeMat);
  bellHole.position.set(0, 0.17, 0.25);
  torso.add(bellHole);

  // Head Group
  const head = new THREE.Group();
  head.position.set(0, 0.44, 0.04);
  mushikaGroup.add(head);

  const headGeo = new THREE.SphereGeometry(0.24, 24, 24);
  headGeo.scale(1.05, 0.96, 1.0);
  const headMesh = new THREE.Mesh(headGeo, furMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  // Sacred Tilak between brows
  const tilak = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.04, 8, 8), tilakMat);
  tilak.position.set(0, 0.15, 0.23);
  head.add(tilak);

  // Snout Bridge & Plump Mystacial Whisker Cheek Pads
  const muzzleGeo = new THREE.SphereGeometry(0.12, 16, 16);
  muzzleGeo.scale(1.15, 0.85, 1.15);
  const muzzleMesh = new THREE.Mesh(muzzleGeo, bellyMat);
  muzzleMesh.position.set(0, -0.06, 0.19);
  head.add(muzzleMesh);

  // Left Whisker Cheek Pad
  const cheekPadGeo = new THREE.SphereGeometry(0.075, 14, 14);
  cheekPadGeo.scale(1.15, 0.9, 1.0);
  const padL = new THREE.Mesh(cheekPadGeo, bellyMat);
  padL.position.set(-0.065, -0.06, 0.23);
  head.add(padL);

  // Right Whisker Cheek Pad
  const padR = new THREE.Mesh(cheekPadGeo, bellyMat);
  padR.position.set(0.065, -0.06, 0.23);
  head.add(padR);

  // Button Truffle Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.046, 14, 14), pinkMat);
  nose.scale.set(1.15, 0.85, 1.0);
  nose.position.set(0, -0.035, 0.32);
  head.add(nose);

  // Nostrils & Cleft
  const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x991b1b });
  const nL = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 6), nostrilMat);
  nL.position.set(-0.018, -0.042, 0.34);
  head.add(nL);
  const nR = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 6), nostrilMat);
  nR.position.set(0.018, -0.042, 0.34);
  head.add(nR);

  // Curved Smile Line
  const smileGeo = new THREE.TorusGeometry(0.05, 0.012, 8, 16, Math.PI);
  const smileMesh = new THREE.Mesh(smileGeo, eyebrowMat);
  smileMesh.rotation.z = Math.PI;
  smileMesh.position.set(0, -0.09, 0.285);
  head.add(smileMesh);

  // Whiskers (Left & Right Groups with delicate natural curve)
  const leftWhiskerGroup = new THREE.Group();
  leftWhiskerGroup.position.set(-0.10, -0.055, 0.25);
  head.add(leftWhiskerGroup);

  const rightWhiskerGroup = new THREE.Group();
  rightWhiskerGroup.position.set(0.10, -0.055, 0.25);
  head.add(rightWhiskerGroup);

  const whiskerAngles = [
    { pitch: 0.14, yaw: 0.45, roll: 0.08, len: 0.28 },
    { pitch: 0.0, yaw: 0.36, roll: 0.0, len: 0.30 },
    { pitch: -0.14, yaw: 0.42, roll: -0.08, len: 0.26 },
  ];

  whiskerAngles.forEach((w) => {
    // Left whisker
    const wGeoL = new THREE.CylinderGeometry(0.003, 0.001, w.len, 6);
    const whiskerL = new THREE.Mesh(wGeoL, whiskerMat);
    whiskerL.rotation.set(w.pitch, -w.yaw, Math.PI / 2 + w.roll);
    whiskerL.position.x = -w.len * 0.45;
    leftWhiskerGroup.add(whiskerL);

    // Right whisker
    const wGeoR = new THREE.CylinderGeometry(0.003, 0.001, w.len, 6);
    const whiskerR = new THREE.Mesh(wGeoR, whiskerMat);
    whiskerR.rotation.set(w.pitch, w.yaw, -Math.PI / 2 - w.roll);
    whiskerR.position.x = w.len * 0.45;
    rightWhiskerGroup.add(whiskerR);
  });

  // Glowing Rosy Blush Cheeks (for celebration & excitement)
  const cheeksLeft = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), cheekBlushMat);
  cheeksLeft.position.set(-0.16, -0.02, 0.22);
  cheeksLeft.visible = false;
  head.add(cheeksLeft);

  const cheeksRight = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), cheekBlushMat);
  cheeksRight.position.set(0.16, -0.02, 0.22);
  cheeksRight.visible = false;
  head.add(cheeksRight);

  // Expressive 3D Eyes with Iris Depth & Sparkle Catchlights
  const leftEyeGroup = new THREE.Group();
  leftEyeGroup.position.set(-0.115, 0.06, 0.205);
  head.add(leftEyeGroup);

  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 16), eyeMat);
  leftEyeGroup.add(leftEye);

  const irisL = new THREE.Mesh(new THREE.RingGeometry(0.015, 0.048, 16), irisMat);
  irisL.position.z = 0.048;
  leftEyeGroup.add(irisL);

  const rightEyeGroup = new THREE.Group();
  rightEyeGroup.position.set(0.115, 0.06, 0.205);
  head.add(rightEyeGroup);

  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 16), eyeMat);
  rightEyeGroup.add(rightEye);

  const irisR = new THREE.Mesh(new THREE.RingGeometry(0.015, 0.048, 16), irisMat);
  irisR.position.z = 0.048;
  rightEyeGroup.add(irisR);

  // Dual catchlights for lively sparkle
  const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const leftHighlight = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), highlightMat);
  leftHighlight.position.set(-0.125, 0.082, 0.252);
  head.add(leftHighlight);

  const leftHighlightSub = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), highlightMat);
  leftHighlightSub.position.set(-0.102, 0.042, 0.250);
  head.add(leftHighlightSub);

  const rightHighlight = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), highlightMat);
  rightHighlight.position.set(0.102, 0.082, 0.252);
  head.add(rightHighlight);

  const rightHighlightSub = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), highlightMat);
  rightHighlightSub.position.set(0.125, 0.042, 0.250);
  head.add(rightHighlightSub);

  // Eyebrows for Expressive Moods
  const eyebrowGeo = new THREE.BoxGeometry(0.08, 0.016, 0.01);
  const eyebrowL = new THREE.Mesh(eyebrowGeo, eyebrowMat);
  eyebrowL.position.set(-0.11, 0.13, 0.22);
  eyebrowL.rotation.z = -0.1;
  head.add(eyebrowL);

  const eyebrowR = new THREE.Mesh(eyebrowGeo, eyebrowMat);
  eyebrowR.position.set(0.11, 0.13, 0.22);
  eyebrowR.rotation.z = 0.1;
  head.add(eyebrowR);

  // Eyelids (for natural blinking)
  const leftEyelid = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), eyelidMat);
  leftEyelid.position.copy(leftEyeGroup.position);
  leftEyelid.rotation.x = -0.2;
  leftEyelid.visible = false;
  head.add(leftEyelid);

  const rightEyelid = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), eyelidMat);
  rightEyelid.position.copy(rightEyeGroup.position);
  rightEyelid.rotation.x = -0.2;
  rightEyelid.visible = false;
  head.add(rightEyelid);

  // Conch-Shaped Curved Mouse Ears
  const leftEar = new THREE.Group();
  leftEar.position.set(-0.21, 0.23, -0.04);
  head.add(leftEar);

  const earOuterGeo = new THREE.CylinderGeometry(0.165, 0.165, 0.035, 20);
  const earOuter = new THREE.Mesh(earOuterGeo, furMat);
  earOuter.rotation.x = Math.PI / 2;
  earOuter.castShadow = true;
  leftEar.add(earOuter);

  const earRimL = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 8, 20), furMat);
  earRimL.position.z = 0.015;
  leftEar.add(earRimL);

  const earInner = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), pinkMat);
  earInner.rotation.x = Math.PI / 2;
  earInner.position.z = 0.008;
  leftEar.add(earInner);

  const rightEar = new THREE.Group();
  rightEar.position.set(0.21, 0.23, -0.04);
  head.add(rightEar);

  const earOuterR = new THREE.Mesh(earOuterGeo, furMat);
  earOuterR.rotation.x = Math.PI / 2;
  earOuterR.castShadow = true;
  rightEar.add(earOuterR);

  const earRimR = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 8, 20), furMat);
  earRimR.position.z = 0.015;
  rightEar.add(earRimR);

  const earInnerR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), pinkMat);
  earInnerR.rotation.x = Math.PI / 2;
  earInnerR.position.z = 0.008;
  rightEar.add(earInnerR);

  // Forepaws / Arms (Articulated shoulders & cute 4-finger sculpted paws)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.20, 0.34, 0.15);
  mushikaGroup.add(leftArm);

  const armMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.038, 0.18, 10), furMat);
  armMeshL.position.y = -0.08;
  armMeshL.castShadow = true;
  leftArm.add(armMeshL);

  const pawL = new THREE.Group();
  pawL.position.y = -0.17;
  leftArm.add(pawL);

  const palmL = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), pinkMat);
  palmL.scale.set(1.0, 0.7, 1.2);
  pawL.add(palmL);

  // 4 cute sculpted fingers on left hand
  for (let f = -1.5; f <= 1.5; f += 1.0) {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.025, 4, 6), pinkMat);
    finger.position.set(f * 0.018, -0.015, 0.035);
    finger.rotation.x = 0.4;
    pawL.add(finger);
  }

  const rightArm = new THREE.Group();
  rightArm.position.set(0.20, 0.34, 0.15);
  mushikaGroup.add(rightArm);

  const armMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.038, 0.18, 10), furMat);
  armMeshR.position.y = -0.08;
  armMeshR.castShadow = true;
  rightArm.add(armMeshR);

  const pawR = new THREE.Group();
  pawR.position.y = -0.17;
  rightArm.add(pawR);

  const palmR = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), pinkMat);
  palmR.scale.set(1.0, 0.7, 1.2);
  pawR.add(palmR);

  // 4 cute sculpted fingers on right hand
  for (let f = -1.5; f <= 1.5; f += 1.0) {
    const fingerR = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.025, 4, 6), pinkMat);
    fingerR.position.set(f * 0.018, -0.015, 0.035);
    fingerR.rotation.x = 0.4;
    pawR.add(fingerR);
  }

  // Hind Legs & Feet (Firmly and cleanly resting on ground at local Y = 0.00)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.16, 0.12, 0.04);
  mushikaGroup.add(leftLeg);

  const thighL = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 14), furMat);
  thighL.scale.set(1.0, 1.2, 1.2);
  thighL.castShadow = true;
  leftLeg.add(thighL);

  const footL = new THREE.Group();
  footL.position.set(0, -0.095, 0.06);
  leftLeg.add(footL);

  const soleL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.16), pinkMat);
  soleL.position.set(0, 0, 0);
  footL.add(soleL);

  // 3 forward toes + 1 lateral digit on left foot
  for (let t = -1; t <= 1; t++) {
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), pinkMat);
    toe.scale.set(1.0, 0.8, 1.3);
    toe.position.set(t * 0.028, -0.01, 0.085);
    footL.add(toe);
  }

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.16, 0.12, 0.04);
  mushikaGroup.add(rightLeg);

  const thighR = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 14), furMat);
  thighR.scale.set(1.0, 1.2, 1.2);
  thighR.castShadow = true;
  rightLeg.add(thighR);

  const footR = new THREE.Group();
  footR.position.set(0, -0.095, 0.06);
  rightLeg.add(footR);

  const soleR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.16), pinkMat);
  soleR.position.set(0, 0, 0);
  footR.add(soleR);

  // 3 forward toes + 1 lateral digit on right foot
  for (let t = -1; t <= 1; t++) {
    const toeR = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), pinkMat);
    toeR.scale.set(1.0, 0.8, 1.3);
    toeR.position.set(t * 0.028, -0.01, 0.085);
    footR.add(toeR);
  }

  // 7-Segment Articulated Natural Mouse Tail
  const tailSegments: THREE.Mesh[] = [];
  let parentTail: THREE.Object3D = torso;

  for (let i = 0; i < 7; i++) {
    const radius = 0.038 - i * 0.004;
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.15, 0.11, 8),
      pinkMat
    );
    seg.position.set(0, i === 0 ? -0.18 : 0.095, i === 0 ? -0.28 : -0.045);
    seg.rotation.x = -0.38;
    parentTail.add(seg);
    tailSegments.push(seg);
    parentTail = seg;
  }

  return {
    mushikaGroup,
    parts: {
      torso,
      head,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      tailSegments,
      leftEyelid,
      rightEyelid,
      nose,
      leftEar,
      rightEar,
      shadowDisc,
      cheeksLeft,
      cheeksRight,
      smileMesh,
      eyebrowL,
      eyebrowR,
      leftHighlight,
      rightHighlight,
      leftWhiskerGroup,
      rightWhiskerGroup,
    },
  };
}
