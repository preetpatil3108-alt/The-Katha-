/**
 * THE KATHA - Level 2 (Utsavam) System
 *
 * Manages the gameplay loop, progression, timer, and events for Level 2: UTSAVAM.
 *
 * Rules:
 * 1. Starts at the Ganesh Mandapam in Rangastalam Village.
 * 2. The Mandapam NPC (Shastri Garu) approaches Ramu and says:
 *    "Bring Ayyagaru to the Mandapam."
 * 3. The Level 2 timer starts IMMEDIATELY when the Mandapam NPC gives the task.
 *    The timer must NOT start before the task is given.
 * 4. Ramu's previously unlocked car is available at the village entrance.
 *    Only Ramu can drive it.
 * 5. Mushika guides Ramu along the highway toward the city (no teleportation!).
 *    Ramu physically drives through the world.
 * 6. Ramu meets Ayyagaru near Café Vista on the city avenue.
 * 7. Ayyagaru boards Ramu's car and Ramu drives him back to Rangastalam Mandapam.
 * 8. Mandapam NPC joyously welcomes Ayyagaru, and the Utsavam begins!
 */

import * as THREE from 'three';
import { AyyagaruNPC } from '../characters/AyyagaruNPC';
import { MandapamOrganizerNPC } from '../characters/MandapamOrganizerNPC';
import { PlayerDrivableCar } from '../world/PlayerDrivableCar';
import { AudioManager } from '../../core/audio/AudioManager';

export type Level2TaskState = 'INTRO' | 'TASK_ACTIVE' | 'CRASHED' | 'COMPLETED';

export type Level2Phase =
  | 'INTRO_CINEMATIC'         // Playing opening cinematic at Ganesh Mandapam
  | 'MANDAPAM_START_DIALOGUE' // Anand gives task to Ramu; instruction waiting for CONTINUE
  | 'GO_TO_CAR'              // Timer running! Ramu heads to car at village entrance
  | 'DRIVE_TO_CITY'          // Driving along Highway NH-65 to the city
  | 'APPROACH_AYYAGARU'      // Approaching Ayyagaru's house in the city
  | 'TALK_TO_AYYAGARU'       // Reached Ayyagaru outside his house; ready to pick him up
  | 'DRIVE_BACK_MANDAPAM'    // Driving Ayyagaru back to Rangastalam Mandapam
  | 'POOJA_CINEMATIC'        // Ayyagaru steps out, walks to Mandapam, performs pooja
  | 'ARRIVED_MANDAPAM'       // Returned to Mandapam with Ayyagaru; celebration welcome
  | 'UTSAVAM_COMPLETED';     // Level 2 complete!

export interface Level2Instruction {
  title: string;
  subtitle: string;
  rule: string;
  explanation: string;
  visible: boolean;
}

export interface Level2State {
  taskState: Level2TaskState;
  phase: Level2Phase;
  taskGiven: boolean;
  timerSeconds: number;
  isTimerActive: boolean;
  hasBoardedCar: boolean;
  hasMetAyyagaru: boolean;
  hasAyyagaruInCar: boolean;
  canPickupAyyagaru: boolean;
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
  introInstruction: Level2Instruction | null;
  crashAlert: string | null;
  completionData: {
    completionSeconds: number;
    formattedTime: string;
  } | null;
}

export class Level2UtsavamSystem {
  private taskState: Level2TaskState = 'INTRO';
  private phase: Level2Phase = 'MANDAPAM_START_DIALOGUE';
  private taskGiven: boolean = false;
  private timerSeconds: number = 0;
  private isTimerActive: boolean = false;
  private isPaused: boolean = false;

  private hasBoardedCar: boolean = false;
  private hasMetAyyagaru: boolean = false;
  private hasAyyagaruInCar: boolean = false;
  private isCompleted: boolean = false;
  private hasFiredCompletion: boolean = false;

  private introInstruction: Level2Instruction | null = null;
  private crashAlert: string | null = null;
  private crashAlertTimer: number = 0;
  private completionData: { completionSeconds: number; formattedTime: string } | null = null;

  // Key locations in the world
  public readonly mandapamPos = new THREE.Vector3(0, 0, 4.0);
  public readonly carParkedPos = new THREE.Vector3(5.6, 0, 27.8);
  public readonly highwayEntryPos = new THREE.Vector3(30.0, 0, 56.0);
  public readonly cityEntryPos = new THREE.Vector3(188.0, 0, 36.0);
  // Outside his house on the front veranda at (184.5, 0.20, -15.0) facing Grand Avenue road
  public readonly ayyagaruPos = new THREE.Vector3(184.5, 0.20, -15.0);

  // References
  private mandapamNPC: MandapamOrganizerNPC | null = null;
  private ayyagaruNPC: AyyagaruNPC | null = null;
  private playerCar: PlayerDrivableCar | null = null;
  private audioManager: AudioManager;

  // Active dialogue overlay
  private activeDialogue: Level2State['activeDialogue'] = null;
  private dialogueTimer: number = 0;

  // Callbacks
  private onStateChangeCallback?: (state: Level2State) => void;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  private finalCompletionSeconds: number = 0;
  private onStartPoojaCinematicCallback?: () => void;

  public setEntities(
    mandapamNPC: MandapamOrganizerNPC | null,
    ayyagaruNPC: AyyagaruNPC | null,
    playerCar: PlayerDrivableCar | null
  ): void {
    this.mandapamNPC = mandapamNPC;
    this.ayyagaruNPC = ayyagaruNPC;
    this.playerCar = playerCar;
  }

  public setOnStateChange(cb: (state: Level2State) => void): void {
    this.onStateChangeCallback = cb;
  }

  public setOnStartPoojaCinematic(cb: () => void): void {
    this.onStartPoojaCinematicCallback = cb;
  }

  private onLevelCompleteCallback?: (completionSeconds: number, formattedTime: string) => void;
  public setOnLevelComplete(cb: (completionSeconds: number, formattedTime: string) => void): void {
    this.onLevelCompleteCallback = cb;
  }

  /**
   * Initializes Level 2: UTSAVAM
   * Starts at Ganesh Mandapam with Anand giving the task.
   * Timer DOES NOT start until player presses CONTINUE.
   */
  public startLevel2(): void {
    this.taskState = 'INTRO';
    this.phase = 'MANDAPAM_START_DIALOGUE';
    this.taskGiven = false;
    this.timerSeconds = 0;
    this.isTimerActive = false; // Strictly false until player acknowledges task!
    this.hasBoardedCar = false;
    this.hasMetAyyagaru = false;
    this.hasAyyagaruInCar = false;
    this.isCompleted = false;
    this.hasFiredCompletion = false;
    this.finalCompletionSeconds = 0;
    this.completionData = null;
    this.crashAlert = null;
    this.crashAlertTimer = 0;

    // Display clear introductory instruction
    this.introInstruction = {
      title: 'LEVEL 2 • UTSAVAM',
      subtitle: 'Bring Ayyagaru to the Mandapam',
      rule: 'Avoid crashing into vehicles.',
      explanation: 'Drive safely along Highway NH-65 to bring Ayyagaru to the Mandapam for the evening Utsavam!',
      visible: true,
    };

    // Park car at village entrance
    if (this.playerCar) {
      this.playerCar.setLevel1Completed(true);
      this.playerCar.setPassenger(false);
      this.playerCar.group.position.copy(this.carParkedPos);
      this.playerCar.group.rotation.y = -Math.PI / 2;
    }

    if (this.ayyagaruNPC) {
      this.ayyagaruNPC.setPosture('seated');
      this.ayyagaruNPC.group.position.copy(this.ayyagaruPos);
      this.ayyagaruNPC.group.rotation.y = Math.PI / 2;
      this.ayyagaruNPC.setHasJoinedRamu(false);
    }

    // Trigger opening dialogue from Anand
    this.triggerMandapamTaskDialogue();
    this.notifyState();
  }

  /**
   * Called when Level 2 intro cinematic ends:
   * Opens the task presentation dialogue and displays the instructions.
   * Timer remains paused until player explicitly acknowledges.
   */
  public onIntroCinematicComplete(): void {
    this.triggerMandapamTaskDialogue();
    this.notifyState();
  }

  /**
   * Acknowledges the Level 2 instruction: Starts the timer and initiates gameplay!
   */
  public acknowledgeInstruction(): void {
    if (this.introInstruction) {
      this.introInstruction.visible = false;
    }
    if (!this.taskGiven) {
      this.taskGiven = true;
      this.taskState = 'TASK_ACTIVE';
      this.phase = 'GO_TO_CAR';
      this.isTimerActive = true;
      this.timerSeconds = 0;
      this.audioManager.playSound('bell_chime');
    }
    this.notifyState();
  }

  /**
   * Called when Ramu enters the parked car at the village entrance
   */
  public onRamuBoardedCar(): void {
    this.hasBoardedCar = true;
    if (this.phase === 'GO_TO_CAR') {
      this.phase = 'DRIVE_TO_CITY';
    }
    this.notifyState();
  }

  /**
   * Returns true if Level 2 is in active gameplay
   */
  public isTaskActive(): boolean {
    return this.taskState === 'TASK_ACTIVE';
  }

  public getTaskState(): Level2TaskState {
    return this.taskState;
  }

  /**
   * Handles a meaningful vehicle collision during Level 2:
   * 1. Stop current Level 2 attempt
   * 2. Reset Level 2 task progress
   * 3. Reset Level 2 timer to 0
   * 4. Reset vehicle and companion state
   * 5. Start a new attempt and new timer
   * Zero reward awarded for failed attempt.
   */
  public handleVehicleCrash(): void {
    if (this.taskState !== 'TASK_ACTIVE') return;

    this.taskState = 'CRASHED';
    this.isTimerActive = false; // Stop the failed timer

    // Trigger high-visibility crash alert
    this.crashAlert = '💥 VEHICLE COLLISION! Level 2 Restarting...';
    this.crashAlertTimer = 3.0;

    // Audio cue
    this.audioManager.playSound('vehicle_crash');

    // Reset task progress
    this.phase = 'DRIVE_TO_CITY';
    this.hasBoardedCar = true;
    this.hasMetAyyagaru = false;
    this.hasAyyagaruInCar = false;
    this.activeDialogue = null;
    this.dialogueTimer = 0;
    this.isCompleted = false;
    this.completionData = null;

    // Reset timer to 0
    this.timerSeconds = 0;

    // Reset entities
    if (this.playerCar) {
      this.playerCar.setPassenger(false);
    }
    if (this.ayyagaruNPC) {
      this.ayyagaruNPC.setHasJoinedRamu(false);
    }

    // Restart Level 2 task state with a clean new timer
    this.taskState = 'TASK_ACTIVE';
    this.isTimerActive = true;

    this.notifyState();
  }

  /**
   * Alias for restarting Level 2 externally
   */
  public restartLevel2(): void {
    this.handleVehicleCrash();
  }

  /**
   * Deactivate Level 2 when switching to another level or menu
   */
  public deactivate(): void {
    this.isTimerActive = false;
    this.taskState = 'INTRO';
    this.crashAlert = null;
    this.activeDialogue = null;
    this.dialogueTimer = 0;
    this.introInstruction = null;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(null as any);
    }
  }

  /**
   * Mandapam NPC approaches Ramu and says: "Bring Ayyagaru to the Mandapam."
   * Timer begins immediately once the task is delivered.
   */
  public triggerMandapamTaskDialogue(): void {
    this.activeDialogue = {
      speaker: 'Anand',
      role: 'Mandapam Organizer',
      text: 'Bring Ayyagaru to the Mandapam.',
      teluguText: 'అయ్యగారిని మండపానికి తీసుకురండి రాము. ఉత్సవ పూజ ప్రారంభం కావాలి!',
    };
    this.dialogueTimer = 7.0;

    if (this.mandapamNPC) {
      this.mandapamNPC.setDialogueGesture('talk');
    }

    // Immediately activate Level 2 task state and start timer!
    this.taskState = 'TASK_ACTIVE';
    this.taskGiven = true;
    this.timerSeconds = 0;
    this.isTimerActive = true;
    this.phase = this.hasBoardedCar ? 'DRIVE_TO_CITY' : 'GO_TO_CAR';

    this.audioManager.playSound('bell_chime');
    this.notifyState();
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  /**
   * Called each frame by GameEngine3D
   */
  public update(delta: number, ramuPos: THREE.Vector3, isDrivingCar: boolean): void {
    if (this.isPaused) return;

    // 1. Advance active timer if running
    if (this.isTimerActive && this.taskState === 'TASK_ACTIVE') {
      this.timerSeconds += delta;
    }

    // 2. Crash alert timer
    if (this.crashAlertTimer > 0) {
      this.crashAlertTimer -= delta;
      if (this.crashAlertTimer <= 0) {
        this.crashAlert = null;
        this.notifyState();
      }
    }

    // 3. Dialogue display timer
    if (this.dialogueTimer > 0) {
      this.dialogueTimer -= delta;
      if (this.dialogueTimer <= 0) {
        this.activeDialogue = null;
        if (this.mandapamNPC) {
          this.mandapamNPC.setDialogueGesture('idle');
        }
        this.notifyState();
      }
    }

    // 3. Track whether Ramu entered car
    if (isDrivingCar && !this.hasBoardedCar) {
      this.hasBoardedCar = true;
      if (this.phase === 'GO_TO_CAR') {
        this.phase = 'DRIVE_TO_CITY';
        this.notifyState();
      }
    }

    // 4. Phase-specific progression logic
    switch (this.phase) {
      case 'GO_TO_CAR': {
        const distToCar = ramuPos.distanceTo(this.carParkedPos);
        if (isDrivingCar || distToCar < 3.0) {
          this.phase = 'DRIVE_TO_CITY';
          this.notifyState();
        }
        break;
      }

      case 'DRIVE_TO_CITY': {
        // Approaching the modern city entrance curve (x > 160)
        if (ramuPos.x > 160.0) {
          this.phase = 'APPROACH_AYYAGARU';
          this.notifyState();
        }
        break;
      }

      case 'APPROACH_AYYAGARU': {
        const distToAyyagaru = ramuPos.distanceTo(this.ayyagaruPos);
        if (distToAyyagaru <= 6.5) {
          this.phase = 'TALK_TO_AYYAGARU';
          this.notifyState();
        }
        break;
      }

      case 'TALK_TO_AYYAGARU': {
        const distToAyyagaru = ramuPos.distanceTo(this.ayyagaruPos);
        if (distToAyyagaru > 8.5) {
          this.phase = 'APPROACH_AYYAGARU';
          this.notifyState();
        }
        break;
      }

      case 'DRIVE_BACK_MANDAPAM': {
        // Player is driving back to Rangastalam Mandapam
        const distToMandapam = ramuPos.distanceTo(this.mandapamPos);
        if (distToMandapam < 12.0) {
          this.phase = 'POOJA_CINEMATIC';
          this.isTimerActive = false; // Stop timer immediately upon reaching Mandapam!
          this.finalCompletionSeconds = Math.max(1, Math.round(this.timerSeconds));
          this.notifyState();
          if (this.onStartPoojaCinematicCallback) {
            this.onStartPoojaCinematicCallback();
          } else {
            this.triggerWelcomeCelebration();
          }
        }
        break;
      }

      case 'POOJA_CINEMATIC': {
        // Pooja cutscene in progress
        break;
      }

      case 'ARRIVED_MANDAPAM': {
        // Celebration in progress
        break;
      }

      case 'UTSAVAM_COMPLETED': {
        break;
      }
    }
  }

  /**
   * Action trigger: Pick up Ayyagaru from outside his house into Ramu's car
   */
  public pickupAyyagaru(): void {
    if (this.hasAyyagaruInCar) return;
    this.hasMetAyyagaru = true;

    this.activeDialogue = {
      speaker: 'Ayyagaru',
      role: 'Vedic Scholar & Chief Priest',
      text: 'Namaskaram Ramu! Is the sacred Mandapam ready in Rangastalam? Wonderful! Let us go to the village immediately for the grand Vinayaka Chavithi Utsavam and evening Aarti!',
      teluguText: 'నమస్కారం రాము! రంగాస్థలం వినాయక మండపం సిద్ధమైందా? చాలా సంతోషం! రండి బాబూ, వెంటనే బయలుదేరి ఉత్సవాన్ని, సాయంత్రం మహామంగళ హారతిని ఘనంగా జరుపుకుందాం!',
    };
    this.dialogueTimer = 8.0;

    // Ayyagaru boards Ramu's car
    this.hasAyyagaruInCar = true;
    if (this.playerCar) {
      this.playerCar.setPassenger(true);
    }
    if (this.ayyagaruNPC) {
      this.ayyagaruNPC.setHasJoinedRamu(true);
    }

    this.audioManager.playSound('celebration_chime');
    this.phase = 'DRIVE_BACK_MANDAPAM';
    this.notifyState();
  }

  /**
   * Triggers conversation when Ramu reaches Ayyagaru at his house
   */
  public triggerAyyagaruDialogue(): void {
    this.pickupAyyagaru();
  }

  /**
   * Triggers joyous reception when Ramu brings Ayyagaru back to Rangastalam Mandapam
   * STOP TIMER IMMEDIATELY upon completion!
   * Strictly idempotent: only transitions once to COMPLETED and fires single reward.
   */
  public triggerWelcomeCelebration(): void {
    if (this.isCompleted || this.hasFiredCompletion) return;
    this.taskState = 'COMPLETED';
    this.isCompleted = true;
    this.hasFiredCompletion = true;
    this.isTimerActive = false; // STOP TIMER IMMEDIATELY!

    const completionSeconds = this.finalCompletionSeconds || Math.max(1, Math.round(this.timerSeconds));
    const mins = Math.floor(completionSeconds / 60);
    const secs = completionSeconds % 60;
    const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    this.completionData = {
      completionSeconds,
      formattedTime,
    };

    this.activeDialogue = {
      speaker: 'Anand',
      role: 'Mandapam Organizer',
      text: 'Ayyagaru has arrived at the Mandapam! The sacred clay Ganesh is blessed, and the grand Vinayaka Chavithi Utsavam and evening Aarti now begin! Ganapati Bappa Morya!',
      teluguText: 'అయ్యగారు మండపానికి వేంచేశారు! మట్టి వినాయకుని దివ్య పూజ, ఉత్సవ మహామంగళ హారతి ప్రారంభమైంది! గణపతి బప్పా మోరియా!',
    };
    this.dialogueTimer = 10.0;

    if (this.mandapamNPC) {
      this.mandapamNPC.setDialogueGesture('namaste');
    }

    this.audioManager.playSound('level_complete');
    this.phase = 'UTSAVAM_COMPLETED';
    this.notifyState();

    // Trigger engine level completion callback
    if (this.onLevelCompleteCallback) {
      this.onLevelCompleteCallback(completionSeconds, formattedTime);
    }
  }

  /**
   * Helper to dismiss dialogue manually
   */
  public dismissDialogue(): void {
    this.activeDialogue = null;
    this.dialogueTimer = 0;
    this.notifyState();
  }

  /**
   * Computes distance to current target waypoint
   */
  public getDistanceToCurrentGoal(playerPos: THREE.Vector3): number {
    switch (this.phase) {
      case 'MANDAPAM_START_DIALOGUE':
        return playerPos.distanceTo(this.mandapamPos);
      case 'GO_TO_CAR':
        return playerPos.distanceTo(this.carParkedPos);
      case 'DRIVE_TO_CITY':
      case 'APPROACH_AYYAGARU':
      case 'TALK_TO_AYYAGARU':
        return playerPos.distanceTo(this.ayyagaruPos);
      case 'DRIVE_BACK_MANDAPAM':
      case 'ARRIVED_MANDAPAM':
      case 'UTSAVAM_COMPLETED':
        return playerPos.distanceTo(this.mandapamPos);
      default:
        return 0;
    }
  }

  public getGoalName(): string {
    switch (this.phase) {
      case 'MANDAPAM_START_DIALOGUE':
        return 'Ganesh Mandapam';
      case 'GO_TO_CAR':
        return "Ramu's Car (Village Entrance)";
      case 'DRIVE_TO_CITY':
        return 'City Grand Avenue (Highway NH-65)';
      case 'APPROACH_AYYAGARU':
      case 'TALK_TO_AYYAGARU':
        return "Ayyagaru's House (City Grand Avenue)";
      case 'DRIVE_BACK_MANDAPAM':
      case 'ARRIVED_MANDAPAM':
      case 'UTSAVAM_COMPLETED':
        return 'Rangastalam Ganesh Mandapam';
    }
  }

  public getMushikaInstruction(): string {
    switch (this.phase) {
      case 'MANDAPAM_START_DIALOGUE':
        return 'Listen to Anand at the completed Ganesh Mandapam!';
      case 'GO_TO_CAR':
        return 'Ramu! Take your car at the village entrance to reach the city quickly!';
      case 'DRIVE_TO_CITY':
        return 'Drive east along National Highway NH-65 toward the city!';
      case 'APPROACH_AYYAGARU':
        return 'We have entered the city! Ayyagaru is sitting outside his house on Grand Avenue!';
      case 'TALK_TO_AYYAGARU':
        return 'There is Ayyagaru outside his house! Pick up Ayyagaru [E] to bring him to the Mandapam!';
      case 'DRIVE_BACK_MANDAPAM':
        return 'Drive Ayyagaru back to Rangastalam Mandapam for the grand Utsavam!';
      case 'ARRIVED_MANDAPAM':
      case 'UTSAVAM_COMPLETED':
        return 'Ganapati Bappa Morya! Ayyagaru has arrived at the Mandapam!';
    }
  }

  public stop(): void {
    this.isTimerActive = false;
    this.activeDialogue = null;
    this.phase = 'MANDAPAM_START_DIALOGUE';
    this.taskGiven = false;
    this.timerSeconds = 0;
  }

  public getState(playerPos: THREE.Vector3 = new THREE.Vector3()): Level2State {
    const distToAyyagaru = playerPos.distanceTo(this.ayyagaruPos);
    const canPickup = (this.phase === 'APPROACH_AYYAGARU' || this.phase === 'TALK_TO_AYYAGARU') &&
      !this.hasAyyagaruInCar &&
      distToAyyagaru <= 6.5;

    return {
      taskState: this.taskState,
      phase: this.phase,
      taskGiven: this.taskGiven,
      timerSeconds: this.timerSeconds,
      isTimerActive: this.isTimerActive,
      hasBoardedCar: this.hasBoardedCar,
      hasMetAyyagaru: this.hasMetAyyagaru,
      hasAyyagaruInCar: this.hasAyyagaruInCar,
      canPickupAyyagaru: canPickup,
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

  private notifyState(): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.getState());
    }
  }
}
