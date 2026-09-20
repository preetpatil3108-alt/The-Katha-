/**
 * THE KATHA - Advanced 3D Character Facial Expression & Blinking Rig
 *
 * Implements a dynamic, expressive facial system for Ramu & companions:
 * - 10 Core Expressions: Neutral, Happy, Excited, Curious, Surprised, Worried,
 *   Thinking, Determined, Celebrating, Funny/Goofy.
 * - Procedural Eye Blinking: Natural blink cadence (every 3.5 - 5.5s) with micro-flutter.
 * - Eye Saccades: Subtle look-around micro-movements to prevent dead/frozen stare.
 * - Procedural Mouth & Eyebrow Morphs: Interpolated smoothly with delta time.
 */

import * as THREE from 'three';

export type FacialExpressionType =
  | 'neutral'
  | 'happy'
  | 'excited'
  | 'curious'
  | 'surprised'
  | 'worried'
  | 'thinking'
  | 'determined'
  | 'celebrating'
  | 'funny_goofy';

export interface FacialRigElements {
  leftEye: THREE.Object3D;
  rightEye: THREE.Object3D;
  leftUpperLid: THREE.Object3D;
  rightUpperLid: THREE.Object3D;
  leftBrow: THREE.Object3D;
  rightBrow: THREE.Object3D;
  mouthGroup: THREE.Group;
  upperLipMesh?: THREE.Mesh;
  lowerLipMesh?: THREE.Mesh;
  smileCornerLeft?: THREE.Object3D;
  smileCornerRight?: THREE.Object3D;
  teethMesh?: THREE.Mesh;
}

interface ExpressionTarget {
  leftBrowY: number;
  rightBrowY: number;
  leftBrowRotZ: number;
  rightBrowRotZ: number;
  browFurrow: number; // inner pinch
  eyeSquint: number; // 0 = wide open, 1 = squint
  mouthWidth: number;
  mouthSmile: number; // -1 = frown, 0 = neutral, 1 = big smile
  mouthOpen: number; // 0 = closed, 1 = wide open laughing/shouting
  mouthPuckerX: number; // thinking/goofy sideways smirk
  headTiltZ: number;
}

const EXPRESSION_PRESETS: Record<FacialExpressionType, ExpressionTarget> = {
  neutral: {
    leftBrowY: 0,
    rightBrowY: 0,
    leftBrowRotZ: 0,
    rightBrowRotZ: 0,
    browFurrow: 0,
    eyeSquint: 0.05,
    mouthWidth: 1.05,
    mouthSmile: 0.4, // Subtle friendly warm smile
    mouthOpen: 0,
    mouthPuckerX: 0,
    headTiltZ: 0,
  },
  happy: {
    leftBrowY: 0.02,
    rightBrowY: 0.02,
    leftBrowRotZ: -0.06,
    rightBrowRotZ: 0.06,
    browFurrow: 0,
    eyeSquint: 0.25,
    mouthWidth: 1.15,
    mouthSmile: 0.85,
    mouthOpen: 0.2,
    mouthPuckerX: 0,
    headTiltZ: 0.02,
  },
  excited: {
    leftBrowY: 0.05,
    rightBrowY: 0.05,
    leftBrowRotZ: -0.1,
    rightBrowRotZ: 0.1,
    browFurrow: -0.02,
    eyeSquint: 0,
    mouthWidth: 1.25,
    mouthSmile: 0.95,
    mouthOpen: 0.6,
    mouthPuckerX: 0,
    headTiltZ: 0.04,
  },
  curious: {
    leftBrowY: 0.06, // One brow raised high
    rightBrowY: -0.01,
    leftBrowRotZ: -0.12,
    rightBrowRotZ: 0.02,
    browFurrow: 0.02,
    eyeSquint: 0.1,
    mouthWidth: 0.95,
    mouthSmile: 0.35,
    mouthOpen: 0.1,
    mouthPuckerX: 0.03,
    headTiltZ: -0.08, // Inquisitive head tilt
  },
  surprised: {
    leftBrowY: 0.07,
    rightBrowY: 0.07,
    leftBrowRotZ: -0.15,
    rightBrowRotZ: 0.15,
    browFurrow: -0.04,
    eyeSquint: -0.15, // Wide open eyes
    mouthWidth: 0.85,
    mouthSmile: 0.1,
    mouthOpen: 0.85, // Round 'O'
    mouthPuckerX: 0,
    headTiltZ: 0,
  },
  worried: {
    leftBrowY: 0.03,
    rightBrowY: 0.03,
    leftBrowRotZ: 0.18, // Slanted inward/upward
    rightBrowRotZ: -0.18,
    browFurrow: 0.06,
    eyeSquint: 0.15,
    mouthWidth: 0.9,
    mouthSmile: -0.45,
    mouthOpen: 0.08,
    mouthPuckerX: 0,
    headTiltZ: 0.02,
  },
  thinking: {
    leftBrowY: -0.02, // Lowered focused brow
    rightBrowY: 0.03,
    leftBrowRotZ: 0.08,
    rightBrowRotZ: -0.05,
    browFurrow: 0.04,
    eyeSquint: 0.3,
    mouthWidth: 0.92,
    mouthSmile: 0.15,
    mouthOpen: 0.02,
    mouthPuckerX: 0.06, // Sideways thought smirk
    headTiltZ: -0.06,
  },
  determined: {
    leftBrowY: -0.03,
    rightBrowY: -0.03,
    leftBrowRotZ: 0.12, // Focused furrow
    rightBrowRotZ: -0.12,
    browFurrow: 0.08,
    eyeSquint: 0.28,
    mouthWidth: 1.05,
    mouthSmile: 0.4, // Confident resolute smirk
    mouthOpen: 0.04,
    mouthPuckerX: 0,
    headTiltZ: 0,
  },
  celebrating: {
    leftBrowY: 0.06,
    rightBrowY: 0.06,
    leftBrowRotZ: -0.12,
    rightBrowRotZ: 0.12,
    browFurrow: 0,
    eyeSquint: 0.35, // Joyful crinkle
    mouthWidth: 1.35,
    mouthSmile: 1.0,
    mouthOpen: 0.8, // Big beaming open smile with teeth
    mouthPuckerX: 0,
    headTiltZ: 0.05,
  },
  funny_goofy: {
    leftBrowY: 0.07,
    rightBrowY: -0.04, // High/low asymmetrical brows
    leftBrowRotZ: -0.2,
    rightBrowRotZ: 0.15,
    browFurrow: 0,
    eyeSquint: 0.15,
    mouthWidth: 1.2,
    mouthSmile: 0.75,
    mouthOpen: 0.35,
    mouthPuckerX: -0.08, // Asymmetric crooked grin
    headTiltZ: 0.12,
  },
};

export class CharacterFacialRig {
  private elements: FacialRigElements;
  private currentExpression: FacialExpressionType = 'neutral';
  private targetExpression: FacialExpressionType = 'neutral';

  // Live interpolated values
  private currentVals: ExpressionTarget;

  // Blinking timeline
  private nextBlinkTime: number = 0;
  private blinkProgress: number = 0; // 0 = open, 1 = fully closed
  private isBlinking: boolean = false;
  private blinkDuration: number = 0.16; // 160ms natural blink

  // Saccades (eye micro-shifts)
  private nextSaccadeTime: number = 0;
  private saccadeX: number = 0;
  private saccadeY: number = 0;

  // Initial reference rest transforms
  private baseLeftEyePos: THREE.Vector3;
  private baseRightEyePos: THREE.Vector3;
  private baseLeftBrowPos: THREE.Vector3;
  private baseRightBrowPos: THREE.Vector3;
  private baseMouthScale: THREE.Vector3;
  private baseMouthPos: THREE.Vector3;

  constructor(elements: FacialRigElements) {
    this.elements = elements;
    this.currentVals = { ...EXPRESSION_PRESETS.neutral };

    this.baseLeftEyePos = elements.leftEye.position.clone();
    this.baseRightEyePos = elements.rightEye.position.clone();
    this.baseLeftBrowPos = elements.leftBrow.position.clone();
    this.baseRightBrowPos = elements.rightBrow.position.clone();
    this.baseMouthScale = elements.mouthGroup.scale.clone();
    this.baseMouthPos = elements.mouthGroup.position.clone();

    this.elements.leftUpperLid.visible = false;
    this.elements.rightUpperLid.visible = false;

    this.scheduleNextBlink();
    this.scheduleNextSaccade();
  }

  public setExpression(expression: FacialExpressionType): void {
    if (this.targetExpression !== expression) {
      this.targetExpression = expression;
    }
  }

  public getExpression(): FacialExpressionType {
    return this.targetExpression;
  }

  private scheduleNextBlink(): void {
    // Human average blink cadence: 3.2 - 5.2 seconds
    this.nextBlinkTime = performance.now() + 3200 + Math.random() * 2000;
  }

  private scheduleNextSaccade(): void {
    // Subtle gaze shifts every 2.0 - 4.0 seconds
    this.nextSaccadeTime = performance.now() + 2000 + Math.random() * 2000;
  }

  /**
   * Update facial rig every frame with smooth delta-time interpolation
   */
  public update(delta: number): void {
    const now = performance.now();

    // 1. Process Blinking
    if (!this.isBlinking && now >= this.nextBlinkTime) {
      this.isBlinking = true;
      this.blinkProgress = 0;
    }

    if (this.isBlinking) {
      this.blinkProgress += delta / this.blinkDuration;
      if (this.blinkProgress >= 1.0) {
        this.isBlinking = false;
        this.blinkProgress = 0;
        this.scheduleNextBlink();
      }
    }

    // Blink curve: smooth bell curve (0 -> 1 -> 0)
    let blinkFactor = 0;
    if (this.isBlinking) {
      blinkFactor = Math.sin(this.blinkProgress * Math.PI);
    }

    // 2. Process Eye Saccades
    if (now >= this.nextSaccadeTime) {
      this.saccadeX = (Math.random() - 0.5) * 0.03;
      this.saccadeY = (Math.random() - 0.5) * 0.02;
      this.scheduleNextSaccade();
    }

    // 3. Interpolate expression targets
    const target = EXPRESSION_PRESETS[this.targetExpression] || EXPRESSION_PRESETS.neutral;
    const lerpSpeed = 8.5 * delta;

    this.currentVals.leftBrowY = THREE.MathUtils.lerp(this.currentVals.leftBrowY, target.leftBrowY, lerpSpeed);
    this.currentVals.rightBrowY = THREE.MathUtils.lerp(this.currentVals.rightBrowY, target.rightBrowY, lerpSpeed);
    this.currentVals.leftBrowRotZ = THREE.MathUtils.lerp(this.currentVals.leftBrowRotZ, target.leftBrowRotZ, lerpSpeed);
    this.currentVals.rightBrowRotZ = THREE.MathUtils.lerp(this.currentVals.rightBrowRotZ, target.rightBrowRotZ, lerpSpeed);
    this.currentVals.browFurrow = THREE.MathUtils.lerp(this.currentVals.browFurrow, target.browFurrow, lerpSpeed);
    this.currentVals.eyeSquint = THREE.MathUtils.lerp(this.currentVals.eyeSquint, target.eyeSquint, lerpSpeed);
    this.currentVals.mouthWidth = THREE.MathUtils.lerp(this.currentVals.mouthWidth, target.mouthWidth, lerpSpeed);
    this.currentVals.mouthSmile = THREE.MathUtils.lerp(this.currentVals.mouthSmile, target.mouthSmile, lerpSpeed);
    this.currentVals.mouthOpen = THREE.MathUtils.lerp(this.currentVals.mouthOpen, target.mouthOpen, lerpSpeed);
    this.currentVals.mouthPuckerX = THREE.MathUtils.lerp(this.currentVals.mouthPuckerX, target.mouthPuckerX, lerpSpeed);
    this.currentVals.headTiltZ = THREE.MathUtils.lerp(this.currentVals.headTiltZ, target.headTiltZ, lerpSpeed);

    // 4. Apply to Eyebrows (subtle rotation only, firmly anchored to head surface)
    this.elements.leftBrow.position.copy(this.baseLeftBrowPos);
    this.elements.rightBrow.position.copy(this.baseRightBrowPos);
    this.elements.leftBrow.rotation.z = this.currentVals.leftBrowRotZ;
    this.elements.rightBrow.rotation.z = this.currentVals.rightBrowRotZ;

    // 5. Apply to Eyelids & Eyes (Blink only, eyes stay 100% attached on face surface)
    const effectiveLidClosure = Math.max(blinkFactor, this.currentVals.eyeSquint);

    if (effectiveLidClosure > 0.08) {
      this.elements.leftUpperLid.visible = true;
      this.elements.rightUpperLid.visible = true;
      const dropY = -effectiveLidClosure * 0.018;
      this.elements.leftUpperLid.position.y = dropY;
      this.elements.rightUpperLid.position.y = dropY;
    } else {
      this.elements.leftUpperLid.visible = false;
      this.elements.rightUpperLid.visible = false;
      this.elements.leftUpperLid.position.y = 0;
      this.elements.rightUpperLid.position.y = 0;
    }

    // Eyes remain strictly anchored on the face surface - NO floating translations
    this.elements.leftEye.position.copy(this.baseLeftEyePos);
    this.elements.rightEye.position.copy(this.baseRightEyePos);

    // 6. Apply to Mouth (firmly anchored at base position on face)
    this.elements.mouthGroup.position.copy(this.baseMouthPos);
  }
}
