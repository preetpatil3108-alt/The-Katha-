/**
 * THE KATHA - Pathrika Collection System
 *
 * Implements the full Level 1 Eka Vimshathi Patra collection flow:
 *
 * Sequence:
 * 1. Start Level 1:
 *    - Mushika guides Ramu to the paper bag beside the Ganesh Mandapam.
 *    - Paper bag is placed beside the Ganesh Mandapam on an ornate pedestal stand.
 *    - Prompt: "PICK UP BAG [E]"
 *    - Timer is NOT active yet.
 *
 * 2. Ramu picks up the paper bag:
 *    - Bag disappears from the stand and attaches to Ramu's hand.
 *    - Timer STARTS immediately after pickup.
 *    - Mushika guides Ramu and companions toward the Jungle Entrance.
 *
 * 3. Entering the Jungle:
 *    - Ramu enters through the newly built 3D Jungle Entrance at (18, 0, -28).
 *    - In the Sacred Forest Grove (26, 0, -42), Ramu and 4 companions gather 21 sacred leaves.
 *    - Ramu's carried bag visibly fills with leaves as they are collected.
 *
 * 4. Return to Mandapam:
 *    - Once all 21 leaves are collected, Mushika guides Ramu back to the Ganesh Mandapam.
 *    - At the Mandapam, prompt: "SUBMIT LEAVES [E]".
 *
 * 5. Submission:
 *    - Leaves and bag are placed on the Mandapam altar table.
 *    - Level 1 completion celebration triggers!
 */

import * as THREE from 'three';
import { CharacterId } from '../../types/game';
import { SACRED_21_LEAVES, SacredLeafInfo } from '../../types/pathrika';
import { SacredForestGrove } from '../world/SacredForestGrove';
import { RangastalamVillage } from '../world/RangastalamVillage';
import { MushakGuideSystem } from './MushakGuideSystem';
import { CompanionFollowerSystem, CompanionAgent } from './CompanionFollowerSystem';
import { ProceduralCharacterMesh } from './ProceduralCharacterMesh';
import { CollisionSystem } from '../collisions/CollisionSystem';
import { AudioManager } from '../../core/audio/AudioManager';
import { SaveSystem } from '../../core/save/SaveSystem';

export type CollectionState =
  | 'need_bag'
  | 'carrying_bag'
  | 'forest_active'
  | 'return_to_mandapam'
  | 'mandapam_ready_submit'
  | 'submitted'
  // Backward compatibility aliases
  | 'locked'
  | 'zone_ready'
  | 'active'
  | 'completed';

export interface InteractionPrompt {
  type: 'pickup_bag' | 'pluck' | 'deposit' | 'submit_leaves' | 'info';
  leafId?: string;
  leafName?: string;
  teluguName?: string;
  actionText: string;
}

export interface PathrikaProgress {
  totalCollected: number;
  maxLeaves: number;
  chintuCount: number;
  bhavaniCount: number;
  varunCount: number;
  ramuDeepaCount: number;
  hasDurvaGrass: boolean;
  hasPaperBag: boolean;
  isTimerActive: boolean;
  elapsedSeconds: number;
  formattedTimer: string;
  remainingSeconds: number;
  finalCompletionSeconds?: number;
  finalCompletionTime?: string;
  leaves: SacredLeafInfo[];
  isComplete: boolean;
  isSubmitted: boolean;
  state: CollectionState;
  currentPrompt: InteractionPrompt | null;
  ramuCarryingLeaf: SacredLeafInfo | null;
}

interface CompanionTaskState {
  agent: CompanionAgent;
  phase: 'idle' | 'walking_to_plant' | 'plucking' | 'carrying_to_bag' | 'depositing' | 'cheering';
  targetLeaf: SacredLeafInfo | null;
  timer: number;
}

export class PathrikaCollectionSystem {
  private forestGrove: SacredForestGrove;
  private village: RangastalamVillage;
  private mushakGuide: MushakGuideSystem;
  private followerSystem: CompanionFollowerSystem;
  private collisionSystem: CollisionSystem;
  private ramuMesh: ProceduralCharacterMesh;
  private audioManager: AudioManager;

  // Collection State
  public state: CollectionState = 'need_bag';
  public hasPaperBag: boolean = false;
  public isSubmitted: boolean = false;

  // Authoritative Gameplay Timer (Starts ONLY when Ramu picks up paper bag!)
  public isTimerActive: boolean = false;
  public elapsedSeconds: number = 0;
  public finalCompletionSeconds: number = 0;
  public finalCompletionTime: string = '00:00';
  public readonly totalTimeLimitSeconds: number = 360; // 6 minutes generous festive timer
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private lastPauseTimestamp: number = 0;

  // Positions (Paper bag on LEFT side outside Mandapam at -5.8, 0.45, 3.5)
  public mandapamBagPosition: THREE.Vector3 = new THREE.Vector3(-5.8, 0.45, 3.5);
  public mandapamAltarPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 1.5);
  public triggerZoneCenter: THREE.Vector3 = new THREE.Vector3(26, 0, -98);
  public triggerZoneRadius: number = 8.5; // 8.5 meters radius around sacred clearing

  // Leaves & Progress
  private leaves: SacredLeafInfo[] = [];
  private collectedLeafIds: Set<string> = new Set();
  public ramuCarryingLeaf: SacredLeafInfo | null = null;
  public currentPrompt: InteractionPrompt | null = null;

  // Companion autonomous tasks
  private companionTasks: Map<CharacterId, CompanionTaskState> = new Map();

  // Callbacks for UI
  private onProgressChange?: (progress: PathrikaProgress) => void;
  private onCelebration?: (completionSeconds: number, formattedTime: string) => void;

  // Small leaf particle bursts in 3D
  private leafParticleGroup: THREE.Group;

  constructor(
    forestGrove: SacredForestGrove,
    village: RangastalamVillage,
    mushakGuide: MushakGuideSystem,
    followerSystem: CompanionFollowerSystem,
    collisionSystem: CollisionSystem,
    ramuMesh: ProceduralCharacterMesh,
    callbacks?: {
      onProgressChange?: (progress: PathrikaProgress) => void;
      onCelebration?: (completionSeconds: number, formattedTime: string) => void;
    }
  ) {
    this.forestGrove = forestGrove;
    this.village = village;
    this.mushakGuide = mushakGuide;
    this.followerSystem = followerSystem;
    this.collisionSystem = collisionSystem;
    this.ramuMesh = ramuMesh;
    this.audioManager = AudioManager.getInstance();
    this.onProgressChange = callbacks?.onProgressChange;
    this.onCelebration = callbacks?.onCelebration;

    // Dynamically synchronize paper bag position with village
    this.mandapamBagPosition.copy(this.village.getMandapamPaperBagPosition());

    // Clear any prior temporary session tokens on fresh construct
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('the_katha_level1_timer_start');
        sessionStorage.removeItem('the_katha_level1_bag_picked');
      }
    } catch {}

    // Clone 21 sacred leaves
    this.leaves = SACRED_21_LEAVES.map((l) => ({ ...l }));

    this.leafParticleGroup = new THREE.Group();
    this.forestGrove.group.add(this.leafParticleGroup);

    this.initCompanionTasks();
  }

  private initCompanionTasks(): void {
    const companions = this.followerSystem.getCompanions();
    companions.forEach((agent) => {
      this.companionTasks.set(agent.id, {
        agent,
        phase: 'idle',
        targetLeaf: null,
        timer: 0,
      });
    });
  }

  /**
   * Start collection flow (helper for UI/Engine)
   */
  public startCollection(): void {
    if (this.state === 'need_bag') {
      this.pickUpPaperBag();
    }
  }

  /**
   * Action trigger when player presses [E] or taps mobile action button
   */
  public triggerRamuAction(): void {
    // 1. Pick up Paper Bag beside Ganesh Mandapam
    if (this.state === 'need_bag') {
      const distToBag = this.ramuMesh.group.position.distanceTo(this.mandapamBagPosition);
      if (distToBag <= 3.2) {
        this.pickUpPaperBag();
        return;
      }
    }

    // 2. Submit Leaves at Ganesh Mandapam (approaching Shastri Garu or Mandapam altar)
    if (this.state === 'return_to_mandapam' || this.state === 'mandapam_ready_submit') {
      const distToOrganizer = this.ramuMesh.group.position.distanceTo(new THREE.Vector3(-2.4, 0, 3.6));
      const distToMandapam = Math.min(
        this.ramuMesh.group.position.distanceTo(this.mandapamBagPosition),
        this.ramuMesh.group.position.distanceTo(this.mandapamAltarPosition),
        distToOrganizer
      );
      if (distToMandapam <= 4.8) {
        this.submitLeavesAtMandapam();
        return;
      }
    }

    // 3. Pluck leaf during forest collection
    if (this.state === 'forest_active') {
      if (this.currentPrompt && this.currentPrompt.type === 'pluck' && this.currentPrompt.leafId) {
        this.pluckRamuLeaf(this.currentPrompt.leafId);
      }
    }
  }

  /**
   * Ramu picks up the paper bag beside the Ganesh Mandapam
   */
  public pickUpPaperBag(): void {
    if (this.hasPaperBag) return;

    this.hasPaperBag = true;
    this.village.hideMandapamPaperBag();
    this.ramuMesh.attachPaperBag();

    // Start Timer ONLY after bag is picked up
    this.isTimerActive = true;
    const now = Date.now();
    this.startTime = now;
    this.pausedDuration = 0;
    this.lastPauseTimestamp = 0;
    this.elapsedSeconds = 0;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('the_katha_level1_bag_picked', 'true');
        sessionStorage.setItem('the_katha_level1_timer_start', String(now));
      }
    } catch {}

    // Transition State & Update Mushika Guidance
    this.state = 'carrying_bag';
    this.mushakGuide.startGuidingToJungle();
    this.audioManager.playSound('bell_chime');

    this.currentPrompt = null;
    this.notifyProgress();
  }

  /**
   * Ramu submits the 21 collected leaves at the Ganesh Mandapam
   */
  public submitLeavesAtMandapam(): void {
    if (!this.hasPaperBag || this.collectedLeafIds.size < this.leaves.length) return;
    if (this.isSubmitted) return;

    this.isSubmitted = true;
    this.isTimerActive = false;
    this.finalCompletionSeconds = Math.max(1, Math.round(this.elapsedSeconds));
    const mins = Math.floor(this.finalCompletionSeconds / 60);
    const secs = this.finalCompletionSeconds % 60;
    this.finalCompletionTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('the_katha_level1_timer_start');
        sessionStorage.removeItem('the_katha_level1_bag_picked');
      }
    } catch {}

    // Immediately mark Level 1 task completed in durable save
    SaveSystem.setLevel1TaskCompleted();

    this.state = 'submitted';
    this.followerSystem.isCollectionMode = false;

    // The completed paper bag must disappear from the world and become non-interactable
    this.hasPaperBag = false;
    this.ramuMesh.detachPaperBag();
    this.ramuMesh.setGesture('bow');
    this.village.setLevel1TaskCompleted(true);
    this.village.hideMandapamPaperBag();

    // Mushak celebration
    this.mushakGuide.onLeavesSubmitted();

    this.audioManager.playSound('celebration_chime');
    this.audioManager.playSound('level_complete');

    // Companions cheer
    this.companionTasks.forEach((task) => {
      task.agent.mesh.setGesture('cheer');
    });

    this.currentPrompt = null;
    this.notifyProgress();

    if (this.onCelebration) {
      this.onCelebration(this.finalCompletionSeconds, this.finalCompletionTime);
    }
  }

  /**
   * Toggle pause state to prevent timer drift during game pause
   */
  public setPaused(paused: boolean): void {
    if (paused) {
      this.lastPauseTimestamp = Date.now();
    } else if (this.lastPauseTimestamp > 0) {
      this.pausedDuration += Date.now() - this.lastPauseTimestamp;
      this.lastPauseTimestamp = 0;
    }
  }

  /**
   * Reset collection state for a fresh playable attempt of Level 1
   */
  public startFreshAttempt(): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem('the_katha_level1_timer_start');
        sessionStorage.removeItem('the_katha_level1_bag_picked');
      }
    } catch {}

    this.collectedLeafIds.clear();
    this.hasPaperBag = false;
    this.isTimerActive = false;
    this.startTime = 0;
    this.pausedDuration = 0;
    this.lastPauseTimestamp = 0;
    this.elapsedSeconds = 0;
    this.isSubmitted = false;
    this.state = 'need_bag';
    this.ramuCarryingLeaf = null;
    this.currentPrompt = null;
    this.finalCompletionSeconds = 0;
    this.finalCompletionTime = '';
    this.ramuMesh.detachPaperBag();
    this.ramuMesh.detachHeldLeaf();
    this.village.resetMandapamPaperBag();
    this.forestGrove.resetLeafPlants();
    this.leaves.forEach((l) => {
      l.isCollected = false;
      l.isBeingCollected = false;
      l.collectedBy = undefined;
    });
    this.companionTasks.forEach((task) => {
      task.agent.mesh.detachHeldLeaf();
      task.agent.mesh.setGesture('walk');
      task.phase = 'idle';
      task.targetLeaf = null;
      task.timer = 0;
    });
    this.initCompanionTasks();
    this.notifyProgress();
  }

  public reset(): void {
    this.startFreshAttempt();
  }

  /**
   * Deactivate Level 1 collection system when switching away to another stage
   */
  public deactivate(): void {
    this.isTimerActive = false;
    this.currentPrompt = null;
    this.ramuMesh.detachPaperBag();
    this.ramuMesh.detachHeldLeaf();
    if (this.onProgressChange) {
      this.onProgressChange(null as any);
    }
  }

  /**
   * Main per-frame update loop
   */
  public update(delta: number, ramuPos: THREE.Vector3): void {
    // 1. Advance timer if active (authoritative real-time timestamp calculation)
    if (this.isTimerActive) {
      if (this.startTime > 0) {
        const now = Date.now();
        this.elapsedSeconds = Math.max(0, (now - this.startTime - this.pausedDuration) / 1000);
      } else {
        this.elapsedSeconds += delta;
      }
    }

    // 2. State-specific logic
    switch (this.state) {
      case 'need_bag': {
        // Check proximity to paper bag stand beside Mandapam
        const distToBag = ramuPos.distanceTo(this.mandapamBagPosition);
        if (distToBag <= 3.2) {
          this.currentPrompt = {
            type: 'pickup_bag',
            actionText: 'PICK UP BAG [E]',
          };
        } else {
          this.currentPrompt = null;
        }
        break;
      }

      case 'carrying_bag': {
        // Ramu is walking towards jungle entrance and into sacred forest
        const distToForest = ramuPos.distanceTo(this.triggerZoneCenter);
        if (distToForest <= this.triggerZoneRadius) {
          // Reached Sacred Forest Grove: activate leaf plucking!
          this.state = 'forest_active';
          this.followerSystem.isCollectionMode = true;
          this.audioManager.playSound('bell_chime');

          // Stagger companion start times
          let staggerOffset = 0.3;
          this.companionTasks.forEach((task) => {
            task.phase = 'idle';
            task.timer = staggerOffset;
            staggerOffset += 0.7;
          });
        }
        this.currentPrompt = null;
        break;
      }

      case 'forest_active': {
        // 1. Update companion autonomous collection AI
        this.updateCompanionsAI(delta, ramuPos);

        // 2. Check Ramu's proximity to unharvested plants
        this.updateRamuPluckingTrigger(ramuPos);
        break;
      }

      case 'return_to_mandapam':
      case 'mandapam_ready_submit': {
        // Ramu is carrying the completed bag back to the Ganesh Mandapam
        const distToOrganizer = ramuPos.distanceTo(new THREE.Vector3(-2.4, 0, 3.6));
        const distToMandapam = Math.min(
          ramuPos.distanceTo(this.mandapamBagPosition),
          ramuPos.distanceTo(this.mandapamAltarPosition),
          distToOrganizer
        );

        if (distToMandapam <= 4.8) {
          this.state = 'mandapam_ready_submit';
          this.currentPrompt = {
            type: 'submit_leaves',
            actionText: 'SUBMIT 21 SACRED LEAVES [E]',
          };
        } else {
          this.state = 'return_to_mandapam';
          this.currentPrompt = {
            type: 'info',
            actionText: 'Return to Anand at the Ganesh Mandapam!',
          };
        }
        break;
      }

      case 'submitted': {
        this.currentPrompt = null;
        this.companionTasks.forEach((task) => {
          task.agent.mesh.updateAnimation(false, delta, 0);
        });
        break;
      }
    }

    // Update floating leaf particles
    this.updateParticles(delta);
    this.notifyProgress();
  }

  /**
   * Ramu interactive plucking in forest
   */
  private updateRamuPluckingTrigger(ramuPos: THREE.Vector3): void {
    let closestLeaf: SacredLeafInfo | null = null;
    let closestDist = 2.2; // 2.2m interaction radius

    for (const leaf of this.leaves) {
      if (leaf.isCollected) continue;

      const node = this.forestGrove.plantNodes.get(leaf.id);
      if (!node) continue;

      const dist = ramuPos.distanceTo(node.worldPosition);
      if (dist < closestDist) {
        closestDist = dist;
        closestLeaf = leaf;
      }
    }

    if (closestLeaf) {
      const isRamuAssigned = closestLeaf.collectorGroup === 'ramu_deepa';
      this.currentPrompt = {
        type: 'pluck',
        leafId: closestLeaf.id,
        leafName: closestLeaf.name,
        teluguName: closestLeaf.teluguName,
        actionText: isRamuAssigned
          ? `Pluck ${closestLeaf.name} (${closestLeaf.teluguName.split(' ')[0]}) [E]`
          : `Help pluck ${closestLeaf.name} [E]`,
      };
    } else {
      this.currentPrompt = null;
    }
  }

  private pluckRamuLeaf(leafId: string): void {
    const leaf = this.leaves.find((l) => l.id === leafId);
    if (!leaf || leaf.isCollected) return;
    if (this.collectedLeafIds.has(leafId)) return;

    // Pluck animation
    this.ramuMesh.setGesture('pluck');
    this.audioManager.playSound('leaf_collect');

    setTimeout(() => {
      this.forestGrove.harvestPlant(leafId);
      this.spawnLeafBurst(
        this.ramuMesh.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
        leaf.plantColor
      );

      // Record collected directly into carried bag
      this.recordLeafCollected(leaf, 'Ramu');
      this.ramuMesh.setGesture('none');
    }, 400);
  }

  /**
   * Autonomous Companion AI:
   * Walk to plant -> Pluck -> Hold/Carry -> Walk to Ramu/Bag -> Deposit
   */
  private updateCompanionsAI(delta: number, ramuPos: THREE.Vector3): void {
    this.companionTasks.forEach((task, id) => {
      const agent = task.agent;

      switch (task.phase) {
        case 'idle': {
          task.timer -= delta;
          if (task.timer <= 0) {
            const nextLeaf = this.findNextLeafForCompanion(id);
            if (nextLeaf) {
              task.targetLeaf = nextLeaf;
              task.phase = 'walking_to_plant';
            } else {
              task.phase = 'cheering';
              agent.mesh.setGesture('cheer');
            }
          }
          agent.mesh.updateAnimation(false, delta, 0);
          break;
        }

        case 'walking_to_plant': {
          if (!task.targetLeaf) {
            task.phase = 'idle';
            task.timer = 0.5;
            break;
          }

          const node = this.forestGrove.plantNodes.get(task.targetLeaf.id);
          if (!node || node.isHarvested) {
            task.targetLeaf = null;
            task.phase = 'idle';
            task.timer = 0.2;
            break;
          }

          const targetPos = node.worldPosition.clone();
          const reached = this.steerAgentTowards(agent, targetPos, 0.75, delta);

          if (reached) {
            task.phase = 'plucking';
            task.timer = 1.2;
            agent.mesh.setGesture('pluck');
            this.audioManager.playSound('leaf_collect');
          }
          break;
        }

        case 'plucking': {
          task.timer -= delta;
          agent.mesh.updateAnimation(false, delta, 0);

          if (task.timer <= 0 && task.targetLeaf) {
            this.forestGrove.harvestPlant(task.targetLeaf.id);
            agent.mesh.attachHeldLeaf(task.targetLeaf.plantColor);
            this.spawnLeafBurst(
              agent.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
              task.targetLeaf.plantColor
            );

            task.phase = 'carrying_to_bag';
            agent.mesh.setGesture('carry');
          }
          break;
        }

        case 'carrying_to_bag': {
          // Walk towards Ramu (who holds the paper bag) or clearing center if Ramu is nearby
          const targetPos = ramuPos.clone();
          // Offset companion arrival so they don't crowd Ramu
          const angleOffset = (Array.from(this.companionTasks.keys()).indexOf(id) * Math.PI) / 2;
          targetPos.add(new THREE.Vector3(Math.cos(angleOffset) * 1.3, 0, Math.sin(angleOffset) * 1.3));

          const reached = this.steerAgentTowards(agent, targetPos, 1.2, delta);

          if (reached) {
            task.phase = 'depositing';
            task.timer = 1.0;
            agent.mesh.setGesture('deposit');
          }
          break;
        }

        case 'depositing': {
          task.timer -= delta;
          agent.mesh.updateAnimation(false, delta, 0);

          if (task.timer <= 0 && task.targetLeaf) {
            agent.mesh.detachHeldLeaf();
            agent.mesh.setGesture('nod');

            this.recordLeafCollected(task.targetLeaf, agent.config.name);

            task.targetLeaf = null;
            task.phase = 'idle';
            task.timer = 0.8;
          }
          break;
        }

        case 'cheering': {
          agent.mesh.updateAnimation(false, delta, 0);
          break;
        }
      }
    });
  }

  private findNextLeafForCompanion(companionId: CharacterId): SacredLeafInfo | null {
    const myLeaves = this.leaves.filter(
      (l) => !l.isCollected && !this.isLeafCurrentlyTargeted(l.id) && l.assignedCollector === companionId
    );
    if (myLeaves.length > 0) return myLeaves[0];

    if (companionId === CharacterId.COMPANION_4) {
      const ramuDeepaLeaves = this.leaves.filter(
        (l) => !l.isCollected && !this.isLeafCurrentlyTargeted(l.id) && l.collectorGroup === 'ramu_deepa' && l.id !== 'durva'
      );
      if (ramuDeepaLeaves.length > 0) return ramuDeepaLeaves[0];
    }

    return null;
  }

  private isLeafCurrentlyTargeted(leafId: string): boolean {
    if (this.ramuCarryingLeaf?.id === leafId) return true;
    for (const task of this.companionTasks.values()) {
      if (task.targetLeaf?.id === leafId) return true;
    }
    return false;
  }

  private steerAgentTowards(
    agent: CompanionAgent,
    target: THREE.Vector3,
    arrivalDist: number,
    delta: number
  ): boolean {
    const toTarget = target.clone().sub(agent.position);
    toTarget.y = 0;
    const dist = toTarget.length();

    if (dist <= arrivalDist) {
      agent.velocity.set(0, 0, 0);
      const targetRot = Math.atan2(toTarget.x, toTarget.z);
      agent.rotation = THREE.MathUtils.lerp(agent.rotation, targetRot, 8 * delta);
      agent.mesh.group.rotation.y = agent.rotation;
      agent.mesh.updateAnimation(false, delta, 0);
      return true;
    }

    toTarget.normalize();
    const moveSpeed = agent.config.speed * 0.85;
    agent.velocity.copy(toTarget.multiplyScalar(moveSpeed));

    const candidatePos = agent.position.clone().add(agent.velocity.clone().multiplyScalar(delta));
    const resolvedPos = this.collisionSystem.resolveMovement(agent.position, candidatePos, 0.45);
    agent.position.copy(resolvedPos);

    const moveRot = Math.atan2(agent.velocity.x, agent.velocity.z);
    agent.rotation = THREE.MathUtils.lerp(agent.rotation, moveRot, 9 * delta);

    agent.mesh.group.position.copy(agent.position);
    agent.mesh.group.rotation.y = agent.rotation;
    agent.mesh.updateAnimation(true, delta, 0.65);

    return false;
  }

  /**
   * Central leaf collection recorder with duplicate prevention
   */
  private recordLeafCollected(leaf: SacredLeafInfo, collectorName: string): void {
    if (this.collectedLeafIds.has(leaf.id)) return;

    this.collectedLeafIds.add(leaf.id);
    leaf.isCollected = true;
    leaf.collectedBy = collectorName;

    const total = this.collectedLeafIds.size;

    // Update carried bag visual fill!
    this.ramuMesh.updateCarriedBagFill(total);

    // Particle sparkle burst at Ramu's bag
    this.spawnLeafBurst(
      this.ramuMesh.group.position.clone().add(new THREE.Vector3(0.3, 1.0, 0.2)),
      leaf.plantColor
    );
    this.audioManager.playSound('leaf_collect');

    // Check if all 21 leaves collected!
    if (total >= this.leaves.length) {
      // Transition to Return to Mandapam!
      this.state = 'return_to_mandapam';
      this.followerSystem.isCollectionMode = false;
      this.mushakGuide.startGuidingBackToMandapam();
    }

    this.notifyProgress();
  }

  private spawnLeafBurst(origin: THREE.Vector3, colorHex: string): void {
    const burstMat = new THREE.MeshLambertMaterial({ color: colorHex });
    for (let p = 0; p < 8; p++) {
      const pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 5), burstMat);
      pMesh.scale.set(1.5, 0.3, 1.5);
      pMesh.position.copy(origin);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2.2,
        0.8 + Math.random() * 1.5,
        (Math.random() - 0.5) * 2.2
      );
      pMesh.userData = { vel, life: 0.85 };
      this.leafParticleGroup.add(pMesh);
    }
  }

  private updateParticles(delta: number): void {
    const deadChildren: THREE.Object3D[] = [];
    this.leafParticleGroup.children.forEach((child) => {
      const data = child.userData as { vel: THREE.Vector3; life: number };
      if (!data) return;

      data.life -= delta;
      if (data.life <= 0) {
        deadChildren.push(child);
      } else {
        child.position.add(data.vel.clone().multiplyScalar(delta));
        data.vel.y -= delta * 3.5;
        child.rotation.x += delta * 4.0;
        child.rotation.z += delta * 3.0;
      }
    });

    deadChildren.forEach((child) => {
      this.leafParticleGroup.remove(child);
    });
  }

  public getProgress(): PathrikaProgress {
    let chintuCount = 0;
    let bhavaniCount = 0;
    let varunCount = 0;
    let ramuDeepaCount = 0;
    let hasDurvaGrass = false;

    this.leaves.forEach((l) => {
      if (l.isCollected) {
        if (l.collectorGroup === 'chintu') chintuCount++;
        else if (l.collectorGroup === 'bhavani') bhavaniCount++;
        else if (l.collectorGroup === 'varun') varunCount++;
        else if (l.collectorGroup === 'ramu_deepa') ramuDeepaCount++;

        if (l.id === 'durva') hasDurvaGrass = true;
      }
    });

    const totalSecs = this.isSubmitted && this.finalCompletionSeconds > 0
      ? this.finalCompletionSeconds
      : Math.floor(this.elapsedSeconds);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    const formattedTimer = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const remainingSeconds = Math.max(0, this.totalTimeLimitSeconds - totalSecs);

    return {
      totalCollected: this.collectedLeafIds.size,
      maxLeaves: this.leaves.length,
      chintuCount,
      bhavaniCount,
      varunCount,
      ramuDeepaCount,
      hasDurvaGrass,
      hasPaperBag: this.hasPaperBag,
      isTimerActive: this.isTimerActive,
      elapsedSeconds: totalSecs,
      formattedTimer,
      remainingSeconds,
      finalCompletionSeconds: this.finalCompletionSeconds,
      finalCompletionTime: this.finalCompletionTime,
      leaves: this.leaves,
      isComplete: this.collectedLeafIds.size >= this.leaves.length,
      isSubmitted: this.isSubmitted,
      state: this.state,
      currentPrompt: this.currentPrompt,
      ramuCarryingLeaf: this.ramuCarryingLeaf,
    };
  }

  private notifyProgress(): void {
    if (this.onProgressChange) {
      this.onProgressChange(this.getProgress());
    }
  }

  public dispose(): void {
    this.leafParticleGroup.clear();
  }
}
