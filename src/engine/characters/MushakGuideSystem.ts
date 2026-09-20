/**
 * THE KATHA - Mushak Guide System
 *
 * Implements Mushak's intelligent, multi-phase guidance across Level 1:
 * 1. GUIDE_TO_BAG: Guides Ramu to the paper bag beside the Ganesh Mandapam.
 * 2. WAITING_FOR_BAG: Hops near the bag stand encouraging Ramu to pick it up.
 * 3. GUIDE_TO_JUNGLE: Guides Ramu and companions through the newly built Jungle Entrance
 *    into the Sacred Forest Grove.
 * 4. COLLECTING_LEAVES: Cheerful support during leaf plucking in the forest.
 * 5. GUIDE_BACK_TO_MANDAPAM: Guides the party back from the forest to the Ganesh Mandapam.
 * 6. SUBMISSION_READY: Hops beside the Mandapam altar waiting for Ramu to submit the leaves.
 * 7. COMPLETED: Celebrates completion of Level 1.
 */

import * as THREE from 'three';
import { ProceduralCharacterMesh } from './ProceduralCharacterMesh';
import { AudioManager } from '../../core/audio/AudioManager';

export type MushakGuidePhase =
  | 'guide_to_bag'
  | 'waiting_for_bag'
  | 'guide_to_jungle'
  | 'collecting_leaves'
  | 'guide_back_to_mandapam'
  | 'submission_ready'
  | 'completed'
  // Level 2 Guidance Phases
  | 'level2_guide_to_car'
  | 'level2_guide_to_city'
  | 'level2_guide_back_to_mandapam';

export interface GuideWaypoint {
  position: THREE.Vector3;
  speechText?: string;
}

export class MushakGuideSystem {
  private mushakMesh: ProceduralCharacterMesh;
  private audioManager: AudioManager;

  public guidePhase: MushakGuidePhase = 'guide_to_bag';
  private currentWaypointIndex: number = 0;
  private waypoints: GuideWaypoint[] = [];

  public currentSpeech: string = '';
  public isSpeechVisible: boolean = false;
  private speechTimer: number = 0;
  private hopCycle: number = 0;
  public hasReachedForest: boolean = false;

  // Waypoint Paths for Level 1
  private waypointsToBag: GuideWaypoint[] = [
    {
      position: new THREE.Vector3(0, 0, 16),
      speechText: 'Come on Ramu! First, let us get the paper bag beside the Ganesh Mandapam!',
    },
    {
      position: new THREE.Vector3(-2.2, 0, 8.5),
      speechText: 'Follow me to the village square! Lord Ganesha’s Mandapam is right ahead!',
    },
    {
      position: new THREE.Vector3(-5.0, 0, 4.2),
      speechText: 'Here on the left is the sacred paper bag! Pick it up so we can collect the 21 leaves!',
    },
  ];

  private waypointsToJungle: GuideWaypoint[] = [
    {
      position: new THREE.Vector3(4.5, 0, -2.0),
      speechText: 'Now follow me! The trail to the jungle lies north-east of the village!',
    },
    {
      position: new THREE.Vector3(10.0, 0, -22.0),
      speechText: 'Notice how the village opens into the scenic countryside!',
    },
    {
      position: new THREE.Vector3(16.0, 0, -45.0),
      speechText: 'Stay close, friends! We are crossing the green pastures toward the jungle!',
    },
    {
      position: new THREE.Vector3(24.0, 0, -68.0),
      speechText: 'Look! The magnificent Rangastalam Jungle Entrance! Let us enter the forest!',
    },
    {
      position: new THREE.Vector3(25.0, 0, -82.0),
      speechText: 'The air smells of sacred tulsi and wild jasmine! Keep going!',
    },
    {
      position: new THREE.Vector3(26.0, 0, -98.0),
      speechText: 'We have arrived at the Sacred Grove! Let us collect the 21 sacred leaves!',
    },
  ];

  private waypointsBackToMandapam: GuideWaypoint[] = [
    {
      position: new THREE.Vector3(25.0, 0, -82.0),
      speechText: 'All 21 leaves gathered! Let us hurry back to the Ganesh Mandapam!',
    },
    {
      position: new THREE.Vector3(24.0, 0, -68.0),
      speechText: 'Back through the Jungle Entrance toward Rangastalam Village!',
    },
    {
      position: new THREE.Vector3(16.0, 0, -45.0),
      speechText: 'Across the country road, Rangastalam village square is ahead!',
    },
    {
      position: new THREE.Vector3(4.5, 0, -10.0),
      speechText: 'Almost there! Lord Ganesha is waiting for our sacred offering!',
    },
    {
      position: new THREE.Vector3(2.8, 0, 2.4),
      speechText: 'We are back at the Mandapam! Submit the sacred leaves at the altar!',
    },
  ];

  // Waypoint Paths for Level 2: UTSAVAM
  private waypointsLevel2ToCar: GuideWaypoint[] = [
    {
      position: new THREE.Vector3(0, 0, 10.0),
      speechText: 'Ramu! Take your car at the village entrance to reach the city quickly!',
    },
    {
      position: new THREE.Vector3(3.2, 0, 20.0),
      speechText: 'Your car is parked near the Rangastalam village gate ahead!',
    },
    {
      position: new THREE.Vector3(5.6, 0, 27.8),
      speechText: 'Here is your car! Enter the driver seat to take the highway [E]!',
    },
  ];

  private waypointsLevel2ToCity: GuideWaypoint[] = [
    {
      position: new THREE.Vector3(18.0, 0, 38.0),
      speechText: 'Follow the road out of Rangastalam onto National Highway NH-65!',
    },
    {
      position: new THREE.Vector3(55.0, 0, 56.0),
      speechText: 'Keep driving eastward along NH-65! The highway leads straight to the city!',
    },
    {
      position: new THREE.Vector3(110.0, 0, 56.0),
      speechText: 'Great driving, Ramu! The city skyscrapers are rising on the horizon!',
    },
    {
      position: new THREE.Vector3(165.0, 0, 42.0),
      speechText: 'Entering the city! Follow the curve onto Grand Avenue!',
    },
    {
      position: new THREE.Vector3(182.0, 0.12, -15.0),
      speechText: 'Look along Café Vista promenade! Ayyagaru is waiting there!',
    },
  ];

  private waypointsLevel2BackToMandapam: GuideWaypoint[] = [
    {
      position: new THREE.Vector3(165.0, 0, 42.0),
      speechText: 'Ayyagaru is onboard! Drive west along NH-65 back to Rangastalam!',
    },
    {
      position: new THREE.Vector3(100.0, 0, 56.0),
      speechText: 'Keep driving west along the highway toward our village archway!',
    },
    {
      position: new THREE.Vector3(30.0, 0, 56.0),
      speechText: 'Back at Rangastalam! Drive up to the central Ganesh Mandapam!',
    },
    {
      position: new THREE.Vector3(0.0, 0, 5.0),
      speechText: 'We have arrived! The grand Vinayaka Chavithi Utsavam can begin!',
    },
  ];

  constructor(mushakMesh: ProceduralCharacterMesh) {
    this.mushakMesh = mushakMesh;
    this.audioManager = AudioManager.getInstance();

    // Start Phase: Guide to Paper Bag beside Ganesh Mandapam
    this.guidePhase = 'guide_to_bag';
    this.waypoints = this.waypointsToBag;
    this.currentWaypointIndex = 0;

    // Initial position in front of Ramu
    this.mushakMesh.group.position.set(0, 0, 18);
    this.triggerSpeech(this.waypoints[0].speechText!, 5.0);
  }

  public triggerSpeech(text: string, durationSec: number = 4.5): void {
    this.currentSpeech = text;
    this.isSpeechVisible = true;
    this.speechTimer = durationSec;
    this.audioManager.playSound('mushak_squeak');
  }

  /**
   * Called to begin or reset guidance to the paper bag beside the Mandapam
   */
  public startGuidingToBag(): void {
    this.guidePhase = 'guide_to_bag';
    this.waypoints = this.waypointsToBag;
    this.currentWaypointIndex = 0;
    this.hasReachedForest = false;
    this.mushakMesh.group.position.set(-3.0, 0, 5.5);
    const speech = this.waypointsToBag[0]?.speechText || 'Ramu, pick up the paper bag beside the Ganesh Mandapam!';
    this.triggerSpeech(speech, 4.5);
  }

  /**
   * Called when Ramu picks up the paper bag beside the Mandapam
   */
  public startGuidingToJungle(): void {
    this.guidePhase = 'guide_to_jungle';
    this.waypoints = this.waypointsToJungle;
    this.currentWaypointIndex = 0;
    this.hasReachedForest = false;
    this.triggerSpeech('Splendid, Ramu! Now let us head into the jungle to collect the 21 sacred leaves!', 5.5);
  }

  /**
   * Called when all 21 leaves are collected in the forest
   */
  public startGuidingBackToMandapam(): void {
    this.guidePhase = 'guide_back_to_mandapam';
    this.waypoints = this.waypointsBackToMandapam;
    this.currentWaypointIndex = 0;
    this.triggerSpeech('All 21 sacred leaves are safely gathered! Quick, let us return to the Ganesh Mandapam!', 5.5);
    this.audioManager.playSound('celebration_chime');
  }

  /**
   * Called when Ramu submits the leaves at the Ganesh Mandapam
   */
  public onLeavesSubmitted(): void {
    this.guidePhase = 'completed';
    this.triggerSpeech('Ganapati Bappa Morya! All 21 sacred leaves have been offered! Level 1 Complete!', 6.0);
    this.audioManager.playSound('level_complete');
  }

  /**
   * LEVEL 2: Guide Ramu to his parked car at Rangastalam entrance
   */
  public startLevel2ToCar(): void {
    this.guidePhase = 'level2_guide_to_car';
    this.waypoints = this.waypointsLevel2ToCar;
    this.currentWaypointIndex = 0;
    this.mushakMesh.group.position.set(0, 0, 6.0);
    this.triggerSpeech(this.waypoints[0].speechText!, 5.0);
  }

  /**
   * LEVEL 2: Guide Ramu along Highway NH-65 toward the modern city and Café Vista
   */
  public startLevel2ToCity(): void {
    this.guidePhase = 'level2_guide_to_city';
    this.waypoints = this.waypointsLevel2ToCity;
    this.currentWaypointIndex = 0;
    this.triggerSpeech(this.waypoints[0].speechText!, 5.5);
    this.audioManager.playSound('bell_chime');
  }

  /**
   * LEVEL 2: Guide Ramu and Ayyagaru back to Rangastalam Mandapam
   */
  public startLevel2ReturnToMandapam(): void {
    this.guidePhase = 'level2_guide_back_to_mandapam';
    this.waypoints = this.waypointsLevel2BackToMandapam;
    this.currentWaypointIndex = 0;
    this.triggerSpeech(this.waypoints[0].speechText!, 5.5);
    this.audioManager.playSound('celebration_chime');
  }

  public update(delta: number, ramuPos: THREE.Vector3): void {
    if (this.speechTimer > 0) {
      this.speechTimer -= delta;
      if (this.speechTimer <= 0) {
        this.isSpeechVisible = false;
      }
    }

    const currentPos = this.mushakMesh.group.position;
    const distToRamu = currentPos.distanceTo(ramuPos);

    // =========================================================================
    // Phase-specific handling
    // =========================================================================

    // 1. Waiting for Bag Pickup beside Mandapam (on the left side outside Mandapam)
    if (this.guidePhase === 'waiting_for_bag') {
      const bagStandPos = new THREE.Vector3(-5.8, 0, 3.5);
      const toStand = bagStandPos.clone().sub(currentPos);
      if (toStand.length() > 0.5) {
        currentPos.add(toStand.normalize().multiplyScalar(3.0 * delta));
      }
      // Look at Ramu and hop excitedly
      this.faceTarget(ramuPos, delta, 8);
      this.hopCycle += delta * 6;
      currentPos.y = Math.abs(Math.sin(this.hopCycle)) * 0.16;
      this.mushakMesh.updateAnimation(false, delta, 0);

      if (!this.isSpeechVisible && Math.random() < 0.006) {
        this.triggerSpeech('Pick up the paper bag beside the Mandapam [E]!');
      }
      return;
    }

    // 2. Collecting Leaves in Forest
    if (this.guidePhase === 'collecting_leaves') {
      this.faceTarget(ramuPos, delta, 5);
      this.hopCycle += delta * 3.5;
      currentPos.y = Math.abs(Math.sin(this.hopCycle)) * 0.1;
      this.mushakMesh.updateAnimation(false, delta, 0);
      return;
    }

    // 3. Submission Ready at Mandapam
    if (this.guidePhase === 'submission_ready') {
      this.faceTarget(ramuPos, delta, 8);
      this.hopCycle += delta * 7;
      currentPos.y = Math.abs(Math.sin(this.hopCycle)) * 0.2;
      this.mushakMesh.updateAnimation(false, delta, 0);

      if (!this.isSpeechVisible && Math.random() < 0.006) {
        this.triggerSpeech('Submit the sacred leaves at the Ganesh Mandapam [E]!');
      }
      return;
    }

    // 4. Completed
    if (this.guidePhase === 'completed') {
      this.faceTarget(ramuPos, delta, 6);
      this.hopCycle += delta * 8;
      currentPos.y = Math.abs(Math.sin(this.hopCycle)) * 0.25;
      this.mushakMesh.updateAnimation(false, delta, 0);
      return;
    }

    // =========================================================================
    // Active Waypoint Following (guide_to_bag, guide_to_jungle, guide_back_to_mandapam)
    // =========================================================================
    if (this.currentWaypointIndex >= this.waypoints.length) return;

    const targetWaypoint = this.waypoints[this.currentWaypointIndex];
    const distToTarget = currentPos.distanceTo(targetWaypoint.position);
    const isLastWaypoint = this.currentWaypointIndex === this.waypoints.length - 1;

    const isVehicleMode = this.guidePhase.startsWith('level2_');
    const reachDistance = isVehicleMode ? 5.5 : 1.4;
    const leadThreshold = isVehicleMode ? 25.0 : 9.0;

    // Check if target waypoint reached
    if (distToTarget < reachDistance) {
      if (isLastWaypoint) {
        if (this.guidePhase === 'guide_to_bag') {
          this.guidePhase = 'waiting_for_bag';
          this.triggerSpeech('Here is the bag! Pick up the paper bag to begin [E]!', 5.0);
          return;
        } else if (this.guidePhase === 'guide_to_jungle') {
          this.guidePhase = 'collecting_leaves';
          this.hasReachedForest = true;
          this.triggerSpeech('We have reached the sacred grove! Let us gather all 21 leaves!', 6.0);
          this.audioManager.playSound('celebration_chime');
          return;
        } else if (this.guidePhase === 'guide_back_to_mandapam') {
          this.guidePhase = 'submission_ready';
          this.triggerSpeech('We are back at the Mandapam! Submit the leaves at the altar [E]!', 5.5);
          return;
        } else if (this.guidePhase === 'level2_guide_to_car') {
          this.triggerSpeech('Enter the car [E] to drive along the highway to the city!', 5.0);
          return;
        } else if (this.guidePhase === 'level2_guide_to_city') {
          this.triggerSpeech('We have reached Café Vista! Ayyagaru is right here on the sidewalk!', 5.0);
          return;
        } else if (this.guidePhase === 'level2_guide_back_to_mandapam') {
          this.triggerSpeech('We are back at the Mandapam! The sacred Utsavam begins!', 5.5);
          return;
        }
      } else {
        // Advance to next waypoint along the path
        this.currentWaypointIndex++;
        const nextWp = this.waypoints[this.currentWaypointIndex];
        if (nextWp.speechText) {
          this.triggerSpeech(nextWp.speechText);
        }
        return;
      }
    }

    // Guidance movement:
    // If Ramu is reasonably close: Mushak leads ahead toward targetWaypoint
    // If Ramu falls behind: Mushak waits, turns to Ramu, hops and encourages him!
    if (distToRamu < leadThreshold) {
      const toTarget = targetWaypoint.position.clone().sub(currentPos);
      toTarget.y = 0;
      const moveDir = toTarget.normalize();
      const moveSpeed = isVehicleMode ? Math.max(6.0, Math.min(22.0, distToRamu * 1.5)) : 4.4;

      currentPos.add(moveDir.clone().multiplyScalar(moveSpeed * delta));

      // Cheerful running hop
      this.hopCycle += delta * (isVehicleMode ? 16 : 12);
      currentPos.y = Math.abs(Math.sin(this.hopCycle)) * (isVehicleMode ? 0.35 : 0.22);

      // Face travel direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      this.mushakMesh.group.rotation.y = THREE.MathUtils.lerp(
        this.mushakMesh.group.rotation.y,
        targetAngle,
        12 * delta
      );

      this.mushakMesh.updateAnimation(true, delta, 1.0);
    } else {
      // Waiting for Ramu: turn to face Ramu and gently hop
      currentPos.y = 0;
      this.faceTarget(ramuPos, delta, 6);

      this.hopCycle += delta * 4;
      currentPos.y = Math.abs(Math.sin(this.hopCycle)) * 0.08;
      this.mushakMesh.updateAnimation(false, delta, 0);

      // Encourage Ramu if speech closed
      if (!this.isSpeechVisible && Math.random() < 0.008) {
        if (this.guidePhase === 'guide_to_bag') {
          this.triggerSpeech('Come on Ramu! The paper bag is waiting at the Mandapam!');
        } else if (this.guidePhase === 'guide_to_jungle') {
          this.triggerSpeech('Keep up, Ramu! The jungle entrance is just ahead!');
        } else if (this.guidePhase === 'guide_back_to_mandapam') {
          this.triggerSpeech('Hurry, Ramu! Let us return to the Mandapam with the leaves!');
        } else if (this.guidePhase === 'level2_guide_to_car') {
          this.triggerSpeech('Take your car parked at the village entrance, Ramu!');
        } else if (this.guidePhase === 'level2_guide_to_city') {
          this.triggerSpeech('Follow the highway eastward to the modern city!');
        } else if (this.guidePhase === 'level2_guide_back_to_mandapam') {
          this.triggerSpeech('Drive back west along the highway to Rangastalam Mandapam!');
        }
      }
    }
  }

  private faceTarget(targetPos: THREE.Vector3, delta: number, speed: number = 6): void {
    const currentPos = this.mushakMesh.group.position;
    const toTarget = targetPos.clone().sub(currentPos);
    const targetAngle = Math.atan2(toTarget.x, toTarget.z);
    this.mushakMesh.group.rotation.y = THREE.MathUtils.lerp(
      this.mushakMesh.group.rotation.y,
      targetAngle,
      speed * delta
    );
  }

  public getFinalDestination(): THREE.Vector3 {
    if (this.waypoints.length === 0) return new THREE.Vector3(0, 0, 0);
    return this.waypoints[this.waypoints.length - 1].position;
  }

  public getActiveTarget(): THREE.Vector3 {
    if (this.currentWaypointIndex < this.waypoints.length) {
      return this.waypoints[this.currentWaypointIndex].position;
    }
    return this.getFinalDestination();
  }

  public getPosition(): THREE.Vector3 {
    return this.mushakMesh.group.position.clone();
  }
}
