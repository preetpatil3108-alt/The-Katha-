/**
 * THE KATHA - Player Input Manager
 * Captures keyboard (WASD/Arrows) and virtual joystick input.
 * CRITICAL RULE: Input feeds strictly into RAMU movement ONLY.
 */

import { PlayerInput } from '../../types/game';

export class InputManager {
  private static instance: InputManager;
  private keyState: Record<string, boolean> = {};
  private joystickX: number = 0;
  private joystickZ: number = 0;
  private driveSteer: number = 0;
  private driveThrottle: number = 0;
  private driveBrake: number = 0;
  private jumpRequested: boolean = false;
  private interactRequested: boolean = false;
  private attached: boolean = false;

  private constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  public attach(): void {
    if (this.attached || typeof window === 'undefined') return;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.attached = true;
  }

  public detach(): void {
    if (!this.attached || typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.keyState = {};
    this.attached = false;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Prevent scrolling on Space and Arrow keys during gameplay
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    this.keyState[e.key.toLowerCase()] = true;
    if (e.key === ' ') {
      this.jumpRequested = true;
    }
    if (e.key.toLowerCase() === 'e') {
      this.interactRequested = true;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keyState[e.key.toLowerCase()] = false;
    if (e.key === ' ') {
      this.jumpRequested = false;
    }
    if (e.key.toLowerCase() === 'e') {
      this.interactRequested = false;
    }
  }

  /**
   * Set joystick vector from VirtualJoystick UI (normalized between -1 and 1)
   */
  public setJoystick(x: number, z: number): void {
    this.joystickX = Math.max(-1, Math.min(1, x));
    this.joystickZ = Math.max(-1, Math.min(1, z));
  }

  /**
   * Dedicated Vehicle Steering input (-1 = Left, 1 = Right, 0 = Neutral)
   */
  public setDrivingSteer(steer: number): void {
    this.driveSteer = Math.max(-1, Math.min(1, steer));
  }

  /**
   * Dedicated Vehicle Accelerator / Throttle input (0 to 1)
   */
  public setDrivingThrottle(throttle: boolean | number): void {
    this.driveThrottle = typeof throttle === 'number' ? Math.max(0, Math.min(1, throttle)) : (throttle ? 1 : 0);
  }

  /**
   * Dedicated Vehicle Brake / Reverse input (0 to 1)
   */
  public setDrivingBrake(brake: boolean | number): void {
    this.driveBrake = typeof brake === 'number' ? Math.max(0, Math.min(1, brake)) : (brake ? 1 : 0);
  }

  public triggerJump(): void {
    this.jumpRequested = true;
  }

  public releaseJump(): void {
    this.jumpRequested = false;
  }

  public triggerInteract(): void {
    this.interactRequested = true;
  }

  public releaseInteract(): void {
    this.interactRequested = false;
  }

  /**
   * Returns current combined input state destined strictly for Ramu
   */
  public getInput(): PlayerInput {
    let keyX = 0;
    let keyZ = 0;

    // A / D / Left / Right
    if (this.keyState['a'] || this.keyState['arrowleft']) keyX -= 1;
    if (this.keyState['d'] || this.keyState['arrowright']) keyX += 1;

    // W / S / Up / Down
    if (this.keyState['w'] || this.keyState['arrowup']) keyZ -= 1;
    if (this.keyState['s'] || this.keyState['arrowdown']) keyZ += 1;

    // Combine keyboard, joystick, and dedicated vehicle controls
    let finalX = keyX + this.joystickX + this.driveSteer;
    let finalZ = keyZ + this.joystickZ - this.driveThrottle + this.driveBrake;

    // Normalize diagonal magnitude
    const mag = Math.sqrt(finalX * finalX + finalZ * finalZ);
    if (mag > 1) {
      finalX /= mag;
      finalZ /= mag;
    }

    const isMoving = mag > 0.08;

    return {
      moveX: finalX,
      moveZ: finalZ,
      isMoving,
      jump: this.jumpRequested,
      interact: this.interactRequested,
    };
  }

  public reset(): void {
    this.keyState = {};
    this.joystickX = 0;
    this.joystickZ = 0;
    this.driveSteer = 0;
    this.driveThrottle = 0;
    this.driveBrake = 0;
    this.jumpRequested = false;
    this.interactRequested = false;
  }
}

export const inputManager = InputManager.getInstance();
