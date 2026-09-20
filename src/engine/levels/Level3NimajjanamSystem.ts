/**
 * THE KATHA - Level 3 (Nimajjanam) System
 *
 * Manages the gameplay loop, progression, timer, and events for Level 3: NIMAJJANAM.
 *
 * Requirements:
 * 1. Starts at the Ganesh Mandapam in Rangastalam Village.
 * 2. Ramu must take Ayyagaru from the Ganesh Mandapam to Ayyagaru's home on Grand Avenue in Modern City.
 * 3. Use the existing Ayyagaru character - Ayyagaru is clearly visible and recognizable.
 * 4. Ramu drives the existing car with consistent driving physics and controls.
 * 5. Ayyagaru properly accompanies the journey in the passenger seat and arrives at his home.
 * 6. Use the existing world environment without modifying core geometry.
 * 7. When Ramu arrives at Ayyagaru's home:
 *    Task Complete -> Scoreboard/reward -> Final Ending Sequence!
 */

import * as THREE from 'three';
import { AyyagaruNPC } from '../characters/AyyagaruNPC';
import { MandapamOrganizerNPC } from '../characters/MandapamOrganizerNPC';
import { PlayerDrivableCar } from '../world/PlayerDrivableCar';
import { AudioManager } from '../../core/audio/AudioManager';

export type Level3TaskState = 'INTRO' | 'TASK_ACTIVE' | 'CRASHED' | 'COMPLETED';

export type Level3Phase =
  | 'INTRO_CINEMATIC'         // Ayyagaru walks from Mandapam to Ramu's car and enters
  | 'MANDAPAM_START_DIALOGUE' // Ayyagaru speaks at the Mandapam; instructs Ramu to take him home; waiting for CONTINUE
  | 'DRIVE_TO_HOME'           // Ramu driving car with Ayyagaru onboard towards Modern City
  | 'APPROACH_HOME'           // Approaching Grand Avenue veranda
  | 'ARRIVAL_CINEMATIC'       // Ayyagaru gets out, walks toward his home and enters
  | 'ARRIVED_HOME'            // Arrived at veranda
  | 'NIMAJJANAM_COMPLETED';   // Level 3 complete!

export interface Level3Instruction {
  title: string;
  subtitle: string;
  rule: string;
  explanation: string;
  visible: boolean;
}

export interface Level3State {
  taskState: Level3TaskState;
  phase: Level3Phase;
  taskGiven: boolean;
  timerSeconds: number;
  isTimerActive: boolean;
  hasBoardedCar: boolean;
  hasAyyagaruInCar: boolean;
  isCompleted: boolean;
  distanceToGoal: number;
  goalName: string;
  mushikaInstruction: string;
  activeDialogue: {
    speaker: string;
    role: string;
    text: string;
    teluguText: string;
  } | null;
  introInstruction: Level3Instruction | null;
  crashAlert: string | null;
  completionData: {
    completionSeconds: number;
    formattedTime: string;
  } | null;
}

export class Level3NimajjanamSystem {
  private taskState: Level3TaskState = 'INTRO';
  private phase: Level3Phase = 'INTRO_CINEMATIC';
  private taskGiven: boolean = false;
  private timerSeconds: number = 0;
  private isTimerActive: boolean = false;
  private isPaused: boolean = false;
  private finalCompletionSeconds: number = 0;

  private hasBoardedCar: boolean = true;
  private hasAyyagaruInCar: boolean = false;
  private isCompleted: boolean = false;
  private hasFiredCompletion: boolean = false;

  private introInstruction: Level3Instruction | null = null;
  private crashAlert: string | null = null;
  private crashAlertTimer: number = 0;
  private completionData: { completionSeconds: number; formattedTime: string } | null = null;

  // Key locations
  public readonly mandapamPos = new THREE.Vector3(0, 0, 4.0);
  public readonly carStartPos = new THREE.Vector3(3.0, 0, 16.0);
  public readonly highwayEntryPos = new THREE.Vector3(30.0, 0, 56.0);
  public readonly cityEntryPos = new THREE.Vector3(188.0, 0, 36.0);
  public readonly ayyagaruHomePos = new THREE.Vector3(184.5, 0.20, -15.0);

  // Entities
  private mandapamNPC: MandapamOrganizerNPC | null = null;
  private ayyagaruNPC: AyyagaruNPC | null = null;
  private playerCar: PlayerDrivableCar | null = null;
  private audioManager: AudioManager;

  // Callbacks
  private onStateChangeCallback: ((state: Level3State) => void) | null = null;
  private onLevelCompleteCallback: ((completionSeconds: number, formattedTime: string) => void) | null = null;
  private onCrashRestartCallback: (() => void) | null = null;
  private onStartArrivalCinematicCallback?: () => void;

  // Dialogue timing
  private dialogueTimer: number = 0;
  private activeDialogue: {
    speaker: string;
    role: string;
    text: string;
    teluguText: string;
  } | null = null;

  constructor(audioManager?: AudioManager) {
    this.audioManager = audioManager || AudioManager.getInstance();
  }

  public setEntities(
    mandapamNPC: MandapamOrganizerNPC | null,
    ayyagaruNPC: AyyagaruNPC | null,
    playerCar: PlayerDrivableCar | null
  ): void {
    this.mandapamNPC = mandapamNPC;
    this.ayyagaruNPC = ayyagaruNPC;
    this.playerCar = playerCar;
  }

  public setOnStateChange(cb: (state: Level3State) => void): void {
    this.onStateChangeCallback = cb;
  }

  public setOnLevelComplete(cb: (completionSeconds: number, formattedTime: string) => void): void {
    this.onLevelCompleteCallback = cb;
  }

  public setOnCrashRestart(cb: () => void): void {
    this.onCrashRestartCallback = cb;
  }

  public setOnStartArrivalCinematic(cb: () => void): void {
    this.onStartArrivalCinematicCallback = cb;
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  public startLevel3(): void {
    this.taskState = 'TASK_ACTIVE';
    this.phase = 'DRIVE_TO_HOME';
    this.taskGiven = true;
    this.timerSeconds = 0;
    this.isTimerActive = true;
    this.hasBoardedCar = true;
    this.hasAyyagaruInCar = true;
    this.isCompleted = false;
    this.hasFiredCompletion = false;
    this.finalCompletionSeconds = 0;
    this.crashAlert = null;
    this.completionData = null;

    if (this.playerCar) {
      this.playerCar.setLevel1Completed(true);
      this.playerCar.initializeForLevel3Driving();
      this.playerCar.setPassenger(true);
      this.playerCar.group.position.copy(this.carStartPos);
      this.playerCar.group.rotation.y = Math.PI;
    }

    if (this.ayyagaruNPC) {
      this.ayyagaruNPC.setPosture('seated');
      this.ayyagaruNPC.group.position.copy(this.carStartPos);
      this.ayyagaruNPC.group.rotation.y = Math.PI;
      this.ayyagaruNPC.setHasJoinedRamu(true);
      this.ayyagaruNPC.group.visible = false;
    }

    // Direct in-game task dialogue from Ayyagaru
    this.activeDialogue = {
      speaker: 'Ayyagaru',
      role: 'Vedic Scholar & Chief Priest',
      text: 'Ramu, please drop me at my home on Grand Avenue safely.',
      teluguText: 'రామూ, నన్ను గ్రాండ్ అవెన్యూలోని నా ఇంటి వద్ద సురక్షితంగా దించు.',
    };
    this.dialogueTimer = 5.0;

    this.introInstruction = null;
    this.notifyState();
  }

  /**
   * Called when Level 3 opening cinematic completes (Ayyagaru has boarded car)
   */
  public onIntroCinematicComplete(): void {
    this.phase = 'MANDAPAM_START_DIALOGUE';
    this.hasAyyagaruInCar = true;
    if (this.playerCar) {
      this.playerCar.setPassenger(true);
    }
    if (this.ayyagaruNPC) {
      this.ayyagaruNPC.setHasJoinedRamu(true);
    }

    // Now reveal the task instruction with CONTINUE button
    this.introInstruction = {
      title: 'LEVEL 3 • NIMAJJANAM',
      subtitle: 'Drop Ayyagaru at His Home',
      rule: 'Ramu must escort Ayyagaru safely from Ganesh Mandapam to his home on Grand Avenue.',
      explanation: 'Drive along Highway NH-65 to the city. Watch out for traffic collisions.',
      visible: true,
    };

    this.activeDialogue = {
      speaker: 'Ayyagaru',
      role: 'Vedic Scholar & Chief Priest',
      text: 'The divine Utsavam and Nimajjanam prayers are complete, Ramu! The blessings of Lord Ganesha are with all of Rangasthalam. Now, please take me back home to Grand Avenue.',
      teluguText: 'పూజా కార్యక్రమాలు దివ్యంగా ముగిసాయి రాము! గణపతి అనుగ్రహం గ్రామంపై ఎల్లప్పుడూ ఉంటుంది. నన్ను క్షేమంగా మా ఇంటికి చేర్చు బాబూ.',
    };
    this.dialogueTimer = 10.0;

    // Timer is STILL false until CONTINUE is pressed!
    this.isTimerActive = false;
    this.notifyState();
  }

  public acknowledgeInstruction(): void {
    if (this.introInstruction) {
      this.introInstruction.visible = false;
    }
    this.beginDriveTask();
  }

  public beginDriveTask(): void {
    if (this.taskGiven) return;
    this.taskGiven = true;
    this.taskState = 'TASK_ACTIVE';
    this.phase = 'DRIVE_TO_HOME';
    this.isTimerActive = true;
    this.timerSeconds = 0;

    if (this.playerCar) {
      this.playerCar.setPassenger(true);
    }
    if (this.ayyagaruNPC) {
      this.ayyagaruNPC.setHasJoinedRamu(true);
    }

    this.audioManager.playSound('bell_chime');
    this.notifyState();
  }

  public update(delta: number, playerPos: THREE.Vector3, isDriving: boolean): void {
    if (this.isPaused) return;

    // Stopwatch Timer
    if (this.isTimerActive) {
      this.timerSeconds += delta;
    }

    // Crash alert decay
    if (this.crashAlertTimer > 0) {
      this.crashAlertTimer -= delta;
      if (this.crashAlertTimer <= 0) {
        this.crashAlert = null;
        this.notifyState();
      }
    }

    // Dialogue auto-dismiss countdown
    if (this.dialogueTimer > 0) {
      this.dialogueTimer -= delta;
      if (this.dialogueTimer <= 0 && this.activeDialogue) {
        if (this.phase === 'MANDAPAM_START_DIALOGUE') {
          // Keep instruction open for CONTINUE button
          this.activeDialogue = null;
          this.notifyState();
        } else if (this.phase === 'ARRIVED_HOME') {
          this.activeDialogue = null;
          this.triggerLevelComplete();
        } else {
          this.activeDialogue = null;
          this.notifyState();
        }
      }
    }

    // Gameplay Progress Tracking
    if (this.taskState === 'TASK_ACTIVE') {
      const distToHome = playerPos.distanceTo(this.ayyagaruHomePos);

      if (this.phase === 'DRIVE_TO_HOME' && distToHome <= 35.0) {
        this.phase = 'APPROACH_HOME';
        this.notifyState();
      }

      // Check arrival at Ayyagaru's home veranda
      if ((this.phase === 'DRIVE_TO_HOME' || this.phase === 'APPROACH_HOME') && distToHome <= 8.5) {
        this.handleArrivalAtHome();
      }
    }
  }

  private handleArrivalAtHome(): void {
    if (this.phase === 'ARRIVAL_CINEMATIC' || this.phase === 'ARRIVED_HOME' || this.phase === 'NIMAJJANAM_COMPLETED') return;

    this.phase = 'ARRIVAL_CINEMATIC';
    this.isTimerActive = false; // STOP TIMER IMMEDIATELY!
    this.finalCompletionSeconds = Math.max(1, Math.floor(this.timerSeconds));
    this.notifyState();

    if (this.onStartArrivalCinematicCallback) {
      this.onStartArrivalCinematicCallback();
    } else {
      this.triggerLevelComplete();
    }
  }

  public triggerLevelComplete(): void {
    if (this.hasFiredCompletion) return;
    this.hasFiredCompletion = true;
    this.isCompleted = true;
    this.taskState = 'COMPLETED';
    this.phase = 'NIMAJJANAM_COMPLETED';
    this.isTimerActive = false; // Ensure timer is stopped!

    const completionSeconds = this.finalCompletionSeconds || Math.max(1, Math.floor(this.timerSeconds));
    const mins = Math.floor(completionSeconds / 60);
    const secs = completionSeconds % 60;
    const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    this.completionData = {
      completionSeconds,
      formattedTime,
    };

    this.audioManager.playSound('level_complete');
    this.notifyState();

    if (this.onLevelCompleteCallback) {
      this.onLevelCompleteCallback(completionSeconds, formattedTime);
    }
  }

  public handleVehicleCrash(): void {
    if (this.taskState !== 'TASK_ACTIVE') return;

    this.crashAlert = 'Drive carefully! Watch for highway traffic while escorting Ayyagaru.';
    this.crashAlertTimer = 3.5;
    this.audioManager.playSound('vehicle_crash');
    this.notifyState();
  }

  public triggerRestart(): void {
    if (this.onCrashRestartCallback) {
      this.onCrashRestartCallback();
    }
  }

  public dismissDialogue(): void {
    if (this.phase === 'MANDAPAM_START_DIALOGUE') {
      this.activeDialogue = null;
      this.dialogueTimer = 0;
      this.beginDriveTask();
    } else if (this.phase === 'ARRIVED_HOME') {
      this.activeDialogue = null;
      this.dialogueTimer = 0;
      this.triggerLevelComplete();
    } else {
      this.activeDialogue = null;
      this.dialogueTimer = 0;
      this.notifyState();
    }
  }

  public getDistanceToCurrentGoal(playerPos: THREE.Vector3): number {
    return playerPos.distanceTo(this.ayyagaruHomePos);
  }

  public getGoalName(): string {
    return "Ayyagaru's House (Grand Avenue)";
  }

  public getMushikaInstruction(): string {
    switch (this.phase) {
      case 'MANDAPAM_START_DIALOGUE':
        return 'Listen to Ayyagaru at the Mandapam!';
      case 'DRIVE_TO_HOME':
        return 'Drive east along Highway NH-65 to take Ayyagaru to his home on Grand Avenue!';
      case 'APPROACH_HOME':
        return 'Grand Avenue is ahead! Pull up right in front of Ayyagaru’s veranda!';
      case 'ARRIVED_HOME':
      case 'NIMAJJANAM_COMPLETED':
        return 'Ganapati Bappa Morya! Ayyagaru reached his home safely!';
      default:
        return 'Escort Ayyagaru home safely.';
    }
  }

  public isTaskActive(): boolean {
    return this.taskState === 'TASK_ACTIVE';
  }

  public getState(playerPos: THREE.Vector3 = new THREE.Vector3()): Level3State {
    return {
      taskState: this.taskState,
      phase: this.phase,
      taskGiven: this.taskGiven,
      timerSeconds: this.timerSeconds,
      isTimerActive: this.isTimerActive,
      hasBoardedCar: this.hasBoardedCar,
      hasAyyagaruInCar: this.hasAyyagaruInCar,
      isCompleted: this.isCompleted,
      distanceToGoal: Math.round(this.getDistanceToCurrentGoal(playerPos)),
      goalName: this.getGoalName(),
      mushikaInstruction: this.getMushikaInstruction(),
      activeDialogue: this.activeDialogue,
      introInstruction: this.introInstruction,
      crashAlert: this.crashAlert,
      completionData: this.completionData,
    };
  }

  public deactivate(): void {
    this.isTimerActive = false;
    this.activeDialogue = null;
    this.dialogueTimer = 0;
  }

  private notifyState(): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.getState());
    }
  }
}
