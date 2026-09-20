/**
 * THE KATHA - Responsive 16:9 Game Canvas
 * Manages Three.js WebGL canvas lifecycle, 16:9 letterbox constraint,
 * camera orbit gestures, virtual joystick, and Mushak control guide.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine3D } from './GameEngine3D';
import { inputManager } from '../controls/InputManager';
import { useGameState } from '../../core/state/GameStateContext';
import { VirtualJoystick } from '../../ui/controls/VirtualJoystick';
import { VehicleDrivingControls } from '../../ui/controls/VehicleDrivingControls';
import { MushakControlGuide } from '../../ui/controls/MushakControlGuide';
import { LocationBanner } from '../../ui/hud/LocationBanner';
import { OpeningStoryDialogue } from '../../ui/dialogue/OpeningStoryDialogue';
import { Level1CompletionDialogue } from '../../ui/dialogue/Level1CompletionDialogue';
import { UnifiedRewardOverlay } from '../../ui/rewards/UnifiedRewardOverlay';
import { ForestObjectiveHud } from '../../ui/hud/ForestObjectiveHud';
import { PathrikaHud } from '../../ui/hud/PathrikaHud';
import { PathrikaProgress } from '../characters/PathrikaCollectionSystem';
import { CharacterId, GameState, LevelId } from '../../types/game';
import { LevelRegistry } from '../../core/levels/LevelRegistry';
import { RewardSystem, LevelRewardCalculation, Level2RewardCalculation } from '../../core/rewards/RewardSystem';
import { SaveSystem } from '../../core/save/SaveSystem';
import { Pause, Volume2, VolumeX, Sparkles, Smartphone, FastForward, Sunrise, Sunset, Sun, Car, Lock, Unlock, Key, Gauge, User, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VehicleHUDState } from './GameEngine3D';
import { OrganizerDialogue } from '../characters/MandapamOrganizerNPC';
import { Level2UtsavamHud } from '../../ui/hud/Level2UtsavamHud';
import { Level2State } from '../levels/Level2UtsavamSystem';
import { Level3NimajjanamHud } from '../../ui/hud/Level3NimajjanamHud';
import { Level3State } from '../levels/Level3NimajjanamSystem';
import { DrivingHud } from '../../ui/hud/DrivingHud';
import { MiniMapHud } from '../../ui/hud/MiniMapHud';
import { audioManager } from '../../core/audio/AudioManager';
import { useDeviceDetection } from '../../core/device/DeviceDetection';

export const GameCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine3D | null>(null);

  const {
    currentState,
    ladduCount,
    addLaddus,
    pauseGame,
    soundEnabled,
    toggleSound,
    playerName,
    activeLevel,
    levelAttemptId,
    completeLevel,
    skipLevel,
    setGameState,
    saveData,
  } = useGameState();

  const isLevel1Completed = saveData?.completedLevels?.includes(LevelId.LEVEL_1) ?? false;
  const activeLevelConfig = LevelRegistry.getLevel(activeLevel);

  const [playerCoords, setPlayerCoords] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 22 });
  const [playerHeading, setPlayerHeading] = useState<number>(0);
  const [cameraYaw, setCameraYaw] = useState<number>(0);
  const device = useDeviceDetection();
  const [timeOfDay, setTimeOfDay] = useState<'sunrise' | 'day' | 'sunset'>('sunrise');

  // Exploration Vehicle State (Exclusively for Ramu, unlocked post Level 1)
  const [vehicleState, setVehicleState] = useState<VehicleHUDState | null>(null);
  const [vehicleToast, setVehicleToast] = useState<string | null>(null);

  // Mandapam Organizer NPC Dialogue State
  const [organizerDialogue, setOrganizerDialogue] = useState<OrganizerDialogue | null>(null);

  // Cinematic Intro & Cutscene States
  const [isIntroCinematic, setIsIntroCinematic] = useState<boolean>(activeLevel === LevelId.LEVEL_1);
  const [isCutsceneActive, setIsCutsceneActive] = useState<boolean>(false);
  const [isTransitioningToMap, setIsTransitioningToMap] = useState<boolean>(false);
  const [cinematicHighlight, setCinematicHighlight] = useState<'flags' | 'entrance' | null>(null);

  // Cinematic to Gameplay Sequential UI Reveal Phase (Section 10)
  // Sequence: Cinematic -> Camera Settles -> Joystick -> Mushika -> Task UI -> Scoreboard & Top Controls
  type UiRevealPhase = 'cinematic' | 'camera_settling' | 'joystick' | 'mushika' | 'task' | 'all';
  const [uiRevealPhase, setUiRevealPhase] = useState<UiRevealPhase>(activeLevel === LevelId.LEVEL_1 ? 'cinematic' : 'all');
  const revealTimersRef = useRef<NodeJS.Timeout[]>([]);

  const triggerSequentialUiReveal = useCallback(() => {
    revealTimersRef.current.forEach(clearTimeout);
    revealTimersRef.current = [];

    // Phase 1: Camera settles
    setUiRevealPhase('camera_settling');

    // Phase 2: Joystick smoothly appears (350ms)
    const t1 = setTimeout(() => {
      setUiRevealPhase('joystick');
    }, 350);

    // Phase 3: Mushika guide smoothly appears (750ms)
    const t2 = setTimeout(() => {
      setUiRevealPhase('mushika');
    }, 750);

    // Phase 4: Task/instruction UI appears (1150ms)
    const t3 = setTimeout(() => {
      setUiRevealPhase('task');
    }, 1150);

    // Phase 5: Scoreboard, top bar, & remaining gameplay controls appear (1550ms)
    const t4 = setTimeout(() => {
      setUiRevealPhase('all');
    }, 1550);

    revealTimersRef.current = [t1, t2, t3, t4];
  }, []);

  useEffect(() => {
    return () => {
      revealTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const [mushakSpeech, setMushakSpeech] = useState<string>('Come on Ramu! We need to collect the leaves from the forest.');
  const [isMushakSpeaking, setIsMushakSpeaking] = useState<boolean>(false);
  const [hasReachedForest, setHasReachedForest] = useState<boolean>(false);
  const [pathrikaProgress, setPathrikaProgress] = useState<PathrikaProgress | null>(null);

  // Level 2 (Utsavam) State
  const [level2State, setLevel2State] = useState<Level2State | null>(null);

  // Level 1 Completion Dialogue & Reward State (Ramu & Anand)
  const [level1RewardCalculation, setLevel1RewardCalculation] = useState<LevelRewardCalculation | null>(null);
  const [isLevel1DialogueActive, setIsLevel1DialogueActive] = useState<boolean>(false);
  const hasAwardedLevel1Ref = useRef<boolean>(false);
  const pendingCompletionRef = useRef<{
    completionSeconds: number;
    formattedTime: string;
    calc: LevelRewardCalculation;
  } | null>(null);

  // Level 2 Completion & Reward State
  const [level2RewardCalculation, setLevel2RewardCalculation] = useState<Level2RewardCalculation | null>(null);
  const hasAwardedLevel2Ref = useRef<boolean>(false);

  // Level 3 Completion & Reward State
  const [level3State, setLevel3State] = useState<Level3State | null>(null);
  const [level3RewardCalculation, setLevel3RewardCalculation] = useState<LevelRewardCalculation | null>(null);
  const hasAwardedLevel3Ref = useRef<boolean>(false);
  const isSkippedRef = useRef<boolean>(false);

  // WebGL Context & Recovery state
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  const forestTargetPos = { x: 26, y: 0, z: -98 };

  // Drag-to-orbit camera tracking
  const isDraggingRef = useRef(false);
  const activeCameraPointerIdRef = useRef<number | null>(null);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  // Initialize Engine
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    inputManager.attach();

    let engine: GameEngine3D | null = null;
    try {
      engine = new GameEngine3D(canvasRef.current, {
        initialLevel: activeLevel,
        isLevel1Completed: isLevel1Completed,
        onCollectLaddu: (_count) => {
          // Loose festive offerings play chime without pre-empting the exact +16 reward on stage complete
        },
        onPlayerPosition: (pos, rot) => {
          setPlayerCoords({
            x: Math.round(pos.x * 10) / 10,
            y: Math.round(pos.y * 10) / 10,
            z: Math.round(pos.z * 10) / 10,
          });
          if (rot !== undefined) {
            setPlayerHeading(rot);
          }
        },
        onCameraYaw: (yaw) => {
          setCameraYaw(yaw);
        },
        onMushakSpeech: (speech, isSpeaking) => {
          setMushakSpeech(speech);
          setIsMushakSpeaking(isSpeaking);
        },
        onReachedForest: (reached) => {
          if (reached) {
            setHasReachedForest(true);
          }
        },
        onPathrikaProgress: (progress) => {
          setPathrikaProgress({ ...progress });
        },
        onPathrikaComplete: (completionSeconds: number, formattedTime: string) => {
          if (isSkippedRef.current) return;
          // 1. Stop the timer (timer already stopped in PathrikaCollectionSystem upon submission)
          // 2. Calculate completion time
          // 3. Calculate corresponding laddu/point reward from configurable LEVEL_1_REWARD_TABLE
          const calc = RewardSystem.calculateLevelReward(LevelId.LEVEL_1, completionSeconds, ladduCount);
          pendingCompletionRef.current = { completionSeconds, formattedTime, calc };

          // Immediately persist completion state and update engine
          SaveSystem.setLevel1TaskCompleted();
          engine?.setLevel1Completed(true);

          setMushakSpeech(`Splendid work Ramu! 21 sacred leaves offered in ${formattedTime}! You earned ${calc.earnedLaddus} Laddus (${calc.tier} Tier)!`);
          setIsMushakSpeaking(true);

          // Display the reward overlay clearly
          setLevel1RewardCalculation(calc);
        },
        onIntroCinematicComplete: () => {
          setIsIntroCinematic(false);
          setIsCutsceneActive(false);
          setCinematicHighlight(null);
          triggerSequentialUiReveal();
        },
        onCinematicHighlightChange: (highlight) => {
          setCinematicHighlight(highlight);
        },
        onTimeOfDayChange: (mode) => {
          setTimeOfDay(mode);
        },
        onVehicleStateChange: (state) => {
          setVehicleState(state);
          if (state.feedbackMessage) {
            setVehicleToast(state.feedbackMessage);
            setTimeout(() => {
              setVehicleToast((prev) => (prev === state.feedbackMessage ? null : prev));
            }, 3500);
          }
        },
        onMandapamOrganizerNearby: (dialogue) => {
          setOrganizerDialogue(dialogue);
        },
        onLevel2StateChange: (state) => {
          setLevel2State(state);
          if (state && state.taskState === 'CRASHED') {
            hasAwardedLevel2Ref.current = false;
          }
        },
        onLevel2Complete: (completionSeconds: number, formattedTime: string) => {
          if (isSkippedRef.current) return;
          // Time-based performance reward from configurable LEVEL_2_REWARD_TABLE
          const calc = RewardSystem.calculateLevel2Reward(completionSeconds, ladduCount);

          // Strictly idempotent: only award once upon genuine task completion
          if (!hasAwardedLevel2Ref.current) {
            hasAwardedLevel2Ref.current = true;
            SaveSystem.setLevel2TaskCompleted(calc.earnedLaddus);
            completeLevel(calc.score, calc.earnedLaddus, calc);
          }

          setMushakSpeech(`Ganapati Bappa Morya! Ayyagaru reached the Mandapam in ${formattedTime}! You earned ${calc.earnedLaddus} Laddus!`);
          setIsMushakSpeaking(true);

          // Display the Level 2 reward banner clearly but briefly
          setLevel2RewardCalculation(calc);
        },
        onLevel3StateChange: (state) => {
          setLevel3State(state);
          if (state && state.taskState === 'CRASHED') {
            hasAwardedLevel3Ref.current = false;
          }
        },
        onLevel3Complete: (completionSeconds: number, formattedTime: string) => {
          if (isSkippedRef.current) return;
          const calc = RewardSystem.calculateLevel3Reward(completionSeconds, ladduCount);

          if (!hasAwardedLevel3Ref.current) {
            hasAwardedLevel3Ref.current = true;
            SaveSystem.setLevel3TaskCompleted(calc.earnedLaddus);
            // Maintain PLAYING state so the Level 3 scoreboard (UnifiedRewardOverlay) renders smoothly
            // and transitions to GAME_ENDING only when the player clicks "NEXT →"
            completeLevel(calc.score, calc.earnedLaddus, calc, GameState.PLAYING);
          }

          setMushakSpeech(`Ganapati Bappa Morya! Ayyagaru arrived home safely in ${formattedTime}! You earned ${calc.earnedLaddus} Laddus!`);
          setIsMushakSpeaking(true);

          // Display the Level 3 completion reward overlay
          setLevel3RewardCalculation(calc);
        },
        onCutsceneStateChange: (active: boolean) => {
          setIsCutsceneActive(active);
        },
      });
    } catch (err: any) {
      console.warn('[GameCanvas] WebGL context initialization error:', err);
      inputManager.detach();
      const retryTimer = setTimeout(() => {
        setRetryTrigger((prev) => prev + 1);
      }, 400);
      return () => clearTimeout(retryTimer);
    }

    engineRef.current = engine;
    engine.setMuted(!soundEnabled);
    engine.setPaused(currentState === GameState.PAUSED);
    if (activeLevel === LevelId.LEVEL_1) {
      engine.setCutsceneActive(true);
      setIsIntroCinematic(true);
      setUiRevealPhase('cinematic');
      engine.startLevel1Cinematic();
    } else {
      engine.setCutsceneActive(false);
      setIsIntroCinematic(false);
      setUiRevealPhase('all');
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          engine?.resize(width, height);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    let animId: number;
    const tick = () => {
      if (engine) {
        const input = inputManager.getInput();
        engine.update(input);
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      inputManager.detach();
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [addLaddus, retryTrigger]);

  // Sync Pause state with 3D engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setPaused(currentState === GameState.PAUSED);
    }
  }, [currentState]);

  // Sync Mute state with 3D engine and audio manager
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMuted(!soundEnabled);
    }
    audioManager.setMuted(!soundEnabled);
  }, [soundEnabled]);

  // Sync Level state with 3D engine (switches Mandapam and task attempt lifecycle while world remains persistent)
  useEffect(() => {
    if (engineRef.current && activeLevel) {
      isSkippedRef.current = false;
      hasAwardedLevel1Ref.current = false;
      hasAwardedLevel2Ref.current = false;
      hasAwardedLevel3Ref.current = false;
      setLevel1RewardCalculation(null);
      setLevel2RewardCalculation(null);
      setLevel3RewardCalculation(null);
      setIsLevel1DialogueActive(false);

      if (activeLevel === LevelId.LEVEL_1) {
        setLevel2State(null);
        setLevel3State(null);
        setIsCutsceneActive(false);
        setIsIntroCinematic(true);
        setCinematicHighlight(null);
        setUiRevealPhase('cinematic');
        engineRef.current.setLevel(activeLevel);
        engineRef.current.startLevel1Cinematic();
      } else if (activeLevel === LevelId.LEVEL_2) {
        setPathrikaProgress(null as any);
        setLevel3State(null);
        setIsCutsceneActive(false);
        setIsIntroCinematic(false);
        setCinematicHighlight(null);
        setUiRevealPhase('all');
        engineRef.current.setLevel(activeLevel);
        engineRef.current.initializeLevel2Vehicle(true);
      } else if (activeLevel === LevelId.LEVEL_3) {
        setPathrikaProgress(null as any);
        setLevel2State(null);
        setIsCutsceneActive(false);
        setIsIntroCinematic(false);
        setCinematicHighlight(null);
        setUiRevealPhase('all');
        engineRef.current.setLevel(activeLevel);
        engineRef.current.initializeLevel3Vehicle(true);
      } else {
        engineRef.current.setLevel(activeLevel);
      }
    }
  }, [activeLevel, levelAttemptId, isLevel1Completed, triggerSequentialUiReveal]);

  // Sync Level 1 completion to unlock Ramu's vehicle permanently
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setLevel1Completed(isLevel1Completed);
    }
  }, [isLevel1Completed]);

  // Handle Dialogue completion (Triggers Sequential UI Reveal)
  const handleDialogueComplete = () => {
    setIsCutsceneActive(false);
    if (engineRef.current) {
      engineRef.current.setCutsceneActive(false);
    }
    triggerSequentialUiReveal();
  };

  // Handle Skip Cinematic Intro: immediately ends cinematic and starts gameplay
  const handleSkipCinematic = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Clear any pending reveal timers
    revealTimersRef.current.forEach(clearTimeout);
    revealTimersRef.current = [];

    if (engineRef.current) {
      engineRef.current.skipIntroCinematic();
      engineRef.current.setCutsceneActive(false);
    }
    setIsIntroCinematic(false);
    setIsCutsceneActive(false);
    setCinematicHighlight(null);
    // When SKIP is pressed, IMMEDIATELY reveal all UI so the player is not kept waiting
    setUiRevealPhase('all');
  };

  const handleSpeakerChange = (speakerId: CharacterId, gesture: string) => {
    if (engineRef.current) {
      engineRef.current.setSpeakerGesture(speakerId, gesture);
    }
  };

  const handleStartPathrika = () => {
    if (engineRef.current) {
      engineRef.current.startPathrikaCollection();
    }
  };

  const handleRamuAction = () => {
    if (engineRef.current) {
      engineRef.current.triggerRamuAction();
    }
  };

  // Level 1 Completion Dialogue Handlers
  const handleContinueToAnand = useCallback(() => {
    // 6. Continue to the Anand conversation
    setLevel1RewardCalculation(null);
    setIsLevel1DialogueActive(true);
    if (engineRef.current) {
      engineRef.current.startLevel1CompletionDialogue();
    }
  }, []);

  const handleLevel1DialogueComplete = useCallback(() => {
    if (isSkippedRef.current) return;
    setIsLevel1DialogueActive(false);
    if (engineRef.current) {
      engineRef.current.endLevel1CompletionDialogue();
    }

    // Trigger smooth cinematic fade transition to Journey Map with unlocked Level 2
    setIsTransitioningToMap(true);
    audioManager.playSound('celebration_chime');

    setTimeout(() => {
      const pending = pendingCompletionRef.current;
      const score = pending?.calc.score ?? 500;
      const laddus = pending?.calc.earnedLaddus ?? 16;
      const calc = pending?.calc;
      if (!hasAwardedLevel1Ref.current) {
        hasAwardedLevel1Ref.current = true;
        completeLevel(score, laddus, calc, GameState.LEVEL_MAP);
      } else {
        setGameState(GameState.LEVEL_MAP);
      }
    }, 750);
  }, [completeLevel, setGameState]);

  const handleLevel1SpeakerChange = useCallback((speaker: 'ramu' | 'organizer', gesture: string) => {
    if (engineRef.current) {
      engineRef.current.setLevel1DialogueSpeaker(speaker, gesture);
    }
  }, []);

  const getCharacterScreenPos = useCallback((target: 'ramu' | 'organizer') => {
    if (engineRef.current) {
      return engineRef.current.getCharacterScreenPosition(target);
    }
    return null;
  }, []);

  // Authoritative Skip Level Handler: Awards 0 Laddus, shows NO animation or "+X LADDUS",
  // leaves laddu total unchanged, prevents duplicate reward triggers, and smoothly progresses.
  const handleSkipLevel = useCallback(() => {
    // 1. Mark as skipped immediately so no engine completion callback can award rewards
    isSkippedRef.current = true;
    hasAwardedLevel1Ref.current = true;
    hasAwardedLevel2Ref.current = true;
    hasAwardedLevel3Ref.current = true;
    pendingCompletionRef.current = null;

    // 2. Clear all reward overlays and calculations so no animation or banner appears
    setLevel1RewardCalculation(null);
    setLevel2RewardCalculation(null);
    setLevel3RewardCalculation(null);
    setIsLevel1DialogueActive(false);

    // 3. Audio feedback
    audioManager.playSound('button_tap');

    // 4. Trigger smooth transition to next progression with zero rewards
    setIsTransitioningToMap(true);
    setTimeout(() => {
      setIsTransitioningToMap(false);
      skipLevel(activeLevel);
    }, 200);
  }, [skipLevel, activeLevel]);

  // Camera Orbit Handlers (Desktop Mouse & Mobile/Tablet Touch Gestures)
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.closest('#virtual-joystick-container') ||
      target.closest('#vehicle-driving-controls') ||
      target.closest('#driving-steering-cluster') ||
      target.closest('#driving-pedals-cluster') ||
      target.closest('#driving-hud-controls') ||
      target.closest('#driving-hud-speedometer') ||
      target.closest('#mushak-control-guide') ||
      target.closest('#opening-story-dialogue-overlay') ||
      target.closest('#level1-reward-banner-overlay') ||
      target.closest('#level1-completion-dialogue-layer') ||
      target.closest('#collect-pathrika-trigger-container') ||
      target.closest('#pathrika-collection-hud') ||
      target.closest('#ramu-action-prompt') ||
      target.closest('#pathrika-complete-modal') ||
      target.closest('#sacred-leaf-list-modal')
    ) {
      return;
    }

    // On mobile touch, safeguard control zones so dragging thumbs never trigger camera orbits
    if (e.pointerType === 'touch' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;
      // Safeguard bottom-left quadrant (virtual joystick or steering buttons)
      if (relX < 0.38 && relY > 0.50) {
        return;
      }
      // Safeguard bottom-right quadrant (accelerator / brake pedals or HUD buttons)
      if (relX > 0.62 && relY > 0.45) {
        return;
      }
    }

    if (activeCameraPointerIdRef.current !== null) {
      return; // Already tracking an active camera rotation gesture
    }

    activeCameraPointerIdRef.current = e.pointerId;
    isDraggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !engineRef.current) return;
    if (activeCameraPointerIdRef.current !== null && e.pointerId !== activeCameraPointerIdRef.current) return;

    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    // Balanced responsiveness for desktop mouse vs tablet/mobile touch
    const sensitivity = e.pointerType === 'touch' ? 0.0075 : 0.0055;
    engineRef.current.rotateCamera(dx * sensitivity, dy * sensitivity);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeCameraPointerIdRef.current === e.pointerId || activeCameraPointerIdRef.current === null) {
      activeCameraPointerIdRef.current = null;
      isDraggingRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (activeCameraPointerIdRef.current === e.pointerId || activeCameraPointerIdRef.current === null) {
      activeCameraPointerIdRef.current = null;
      isDraggingRef.current = false;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!engineRef.current) return;
    engineRef.current.zoomCamera(e.deltaY * 0.005);
  };

  const shouldRenderTouchControls = device.isTouchDevice;

  // Cinematic & Sequential Reveal States (Section 10)
  const isCinematicActive = isIntroCinematic || isCutsceneActive;

  // Reveal hierarchy for cinematic-to-gameplay sequence:
  // Camera Settles -> Joystick -> Mushika -> Task UI -> Scoreboard & All Controls
  const isJoystickRevealed =
    !isCinematicActive &&
    (uiRevealPhase === 'joystick' ||
      uiRevealPhase === 'mushika' ||
      uiRevealPhase === 'task' ||
      uiRevealPhase === 'all');

  const isMushakRevealed =
    !isCinematicActive &&
    (uiRevealPhase === 'mushika' ||
      uiRevealPhase === 'task' ||
      uiRevealPhase === 'all');

  const isTaskRevealed =
    !isCinematicActive &&
    (uiRevealPhase === 'task' || uiRevealPhase === 'all');

  const isControlsRevealed =
    !isCinematicActive && uiRevealPhase === 'all';

  return (
    <div
      id="game-viewport-container"
      className="relative w-full h-full bg-stone-950 flex items-center justify-center overflow-hidden select-none"
    >
      {/* 16:9 Aspect Ratio Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onWheel={handleWheel}
        className="relative w-full aspect-video max-h-full max-w-full bg-amber-950 shadow-2xl flex items-center justify-center overflow-hidden"
      >
        {/* 3D WebGL Canvas */}
        <canvas
          id="katha-3d-canvas"
          ref={canvasRef}
          className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
        />

        {/* Cinematic Letterbox Bars (Top & Bottom) during cinematics */}
        <AnimatePresence>
          {isCinematicActive && (
            <>
              <motion.div
                initial={{ y: '-100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-100%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="absolute top-0 left-0 right-0 h-8 sm:h-12 md:h-14 bg-black/95 z-40 pointer-events-none border-b border-amber-500/20"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="absolute bottom-0 left-0 right-0 h-8 sm:h-12 md:h-14 bg-black/95 z-40 pointer-events-none border-t border-amber-500/20"
              />
            </>
          )}
        </AnimatePresence>

        {/* Cinematic Village Identity Banner during Level 1 Drone Cinematic */}
        <AnimatePresence>
          {isCinematicActive && activeLevel === LevelId.LEVEL_1 && (
            <motion.div
              key="cinematic-village-identity"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="absolute bottom-14 sm:bottom-18 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center px-4"
            >
              <div className="text-[10px] sm:text-xs font-mono tracking-[0.35em] text-amber-300 uppercase font-semibold drop-shadow-md">
                VILLAGE OF RANGASTALAM
              </div>
              <div className="text-base sm:text-xl md:text-2xl font-serif font-black tracking-widest text-amber-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                రంగస్థలం గ్రామం
              </div>
              <div className="text-[9px] sm:text-[10px] text-amber-200/90 tracking-widest uppercase font-medium mt-0.5 drop-shadow-md">
                Ganesh Utsav Mahotsavam • Siddham
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visual Highlight Badges during Level 1 Cinematic:
            FIRST -> Indian flags on village houses
            SECOND -> Rangasthalam village entrance arch */}
        <AnimatePresence>
          {isCinematicActive && activeLevel === LevelId.LEVEL_1 && cinematicHighlight === 'flags' && (
            <motion.div
              key="highlight-flags"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-center px-4"
            >
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-stone-950/90 border border-amber-400/70 shadow-2xl backdrop-blur-md">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF9933] shadow-sm" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#138808] shadow-sm" />
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-200 tracking-wider uppercase drop-shadow-md">
                  INDIAN FLAGS • VILLAGE HOMES
                </span>
              </div>
            </motion.div>
          )}

          {isCinematicActive && activeLevel === LevelId.LEVEL_1 && cinematicHighlight === 'entrance' && (
            <motion.div
              key="highlight-entrance"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-center px-4"
            >
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-stone-950/90 border border-amber-400/70 shadow-2xl backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
                <span className="text-xs sm:text-sm font-black text-amber-200 tracking-wider uppercase drop-shadow-md">
                  RANGASTHALAM VILLAGE ENTRANCE
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top-Left Skip Button during Cinematic Intro:
            - Clearly visible
            - Easy to tap (touch target min 44-48px)
            - Works seamlessly on mobile, tablet, and desktop
            - Disappears immediately when cinematic finishes or is skipped */}
        {isCinematicActive && (
          <button
            id="skip-cinematic-btn"
            type="button"
            onClick={handleSkipCinematic}
            onTouchEnd={handleSkipCinematic}
            aria-label="Skip Cinematic Introduction"
            className="absolute top-4 left-4 z-50 flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] min-w-[96px] rounded-full bg-stone-950/90 hover:bg-stone-900 active:scale-95 backdrop-blur-md border-2 border-amber-400/80 text-amber-200 hover:text-amber-100 text-xs sm:text-sm font-black tracking-wider shadow-2xl transition-all cursor-pointer select-none"
          >
            <FastForward className="w-4 h-4 text-amber-400" />
            <span>SKIP</span>
          </button>
        )}

        {/* Location Entrance Splash Banner */}
        {isControlsRevealed && (
          <LocationBanner
            locationName={`LEVEL ${activeLevelConfig.index} — ${activeLevelConfig.title}`}
            subtitle={`${activeLevelConfig.subtitle} • ${activeLevelConfig.location}`}
          />
        )}

        {/* Level 1 Objective & Subtle Directional Marker */}
        {isTaskRevealed && activeLevel === LevelId.LEVEL_1 && (
          <ForestObjectiveHud
            playerPos={playerCoords}
            targetPos={
              pathrikaProgress?.state === 'need_bag' ||
              pathrikaProgress?.state === 'return_to_mandapam' ||
              pathrikaProgress?.state === 'mandapam_ready_submit' ||
              pathrikaProgress?.state === 'submitted'
                ? { x: 2.8, y: 0, z: 1.8 }
                : pathrikaProgress?.state === 'carrying_bag'
                ? { x: 18, y: 0, z: -28 }
                : forestTargetPos
            }
            cameraYaw={cameraYaw}
            mushakSpeech={mushakSpeech}
            isMushakSpeaking={isMushakSpeaking && !isCutsceneActive}
            hasReachedForest={hasReachedForest}
            isTimerActive={pathrikaProgress?.isTimerActive}
            elapsedSeconds={pathrikaProgress?.elapsedSeconds}
            remainingSeconds={pathrikaProgress?.remainingSeconds}
            isReturnPhase={
              pathrikaProgress?.state === 'return_to_mandapam' ||
              pathrikaProgress?.state === 'mandapam_ready_submit'
            }
            customObjective={
              pathrikaProgress?.state === 'submitted'
                ? 'Offerings Submitted! Level 1 Complete'
                : pathrikaProgress?.state === 'mandapam_ready_submit'
                ? 'At Ganesh Mandapam! Tap SUBMIT LEAVES [E]'
                : pathrikaProgress?.state === 'return_to_mandapam'
                ? 'Return to Ganesh Mandapam with 21 Leaves'
                : pathrikaProgress?.state === 'forest_active'
                ? `Collect 21 Sacred Leaves in Jungle (${pathrikaProgress.totalCollected}/21)`
                : pathrikaProgress?.state === 'carrying_bag'
                ? 'Enter Jungle via Jungle Entrance'
                : pathrikaProgress?.state === 'need_bag'
                ? 'Pick up Paper Bag beside Ganesh Mandapam'
                : 'Follow Mushak to Ganesh Mandapam'
            }
          />
        )}

        {/* Pathrika Collection HUD: Trigger Zone Button, Paper Bag Progress, 21 Leaves (Level 1) */}
        {isTaskRevealed && pathrikaProgress && activeLevel === LevelId.LEVEL_1 && (
          <PathrikaHud
            progress={pathrikaProgress}
            onStartCollection={handleStartPathrika}
            onRamuAction={handleRamuAction}
            suppressCompletionModal={true}
            onCompleteCelebration={() => {
              const seconds = pathrikaProgress.finalCompletionSeconds || pathrikaProgress.elapsedSeconds;
              const calc = RewardSystem.calculateLevelReward(seconds);
              completeLevel(calc.score, calc.laddusEarned, calc);
            }}
          />
        )}

        {/* Level 2 (Utsavam) HUD: Active Task, Stopwatch Timer, Navigation Tracker, Dialogues */}
        {isTaskRevealed && activeLevel === LevelId.LEVEL_2 && level2State && (
          <Level2UtsavamHud
            state={level2State}
            onDismissDialogue={() => engineRef.current?.dismissLevel2Dialogue()}
            onPickupAyyagaru={() => engineRef.current?.pickupAyyagaru()}
            onAcknowledgeInstruction={() => engineRef.current?.acknowledgeLevel2Instruction()}
          />
        )}

        {/* Level 3 (Nimajjanam) HUD: Active Task, Stopwatch Timer, Navigation Tracker, Dialogues */}
        {isTaskRevealed && activeLevel === LevelId.LEVEL_3 && level3State && (
          <Level3NimajjanamHud
            state={level3State}
            onDismissDialogue={() => engineRef.current?.dismissLevel3Dialogue()}
            onAcknowledgeInstruction={() => engineRef.current?.acknowledgeLevel3Instruction()}
          />
        )}

        {/* Level 3 Unified Laddu Reward Overlay (Shared AAA Presentation) */}
        <AnimatePresence>
          {level3RewardCalculation && (
            <UnifiedRewardOverlay
              levelNumber={3}
              levelTitle="Level 3 — Nimajjanam"
              completionTime={level3RewardCalculation.formattedTime}
              earnedLaddus={level3RewardCalculation.earnedLaddus}
              score={level3RewardCalculation.score}
              tier={level3RewardCalculation.earnedLaddus >= 25 ? 'GOLD' : level3RewardCalculation.earnedLaddus >= 18 ? 'SILVER' : 'BRONZE'}
              formulaDescription="Safely accompanied Ayyagaru home to conclude Vinayaka Nimajjanam"
              previousTotalLaddus={Math.max(0, ladduCount - level3RewardCalculation.earnedLaddus)}
              newTotalLaddus={ladduCount}
              onContinue={() => {
                setLevel3RewardCalculation(null);
                setGameState(GameState.GAME_ENDING);
              }}
              continueLabel="NEXT →"
              autoAdvanceSeconds={0}
            />
          )}
        </AnimatePresence>

        {/* Level 2 Unified Laddu Reward Overlay (Shared AAA Presentation) */}
        <AnimatePresence>
          {level2RewardCalculation && (
            <UnifiedRewardOverlay
              levelNumber={2}
              levelTitle="Level 2 — Utsavam"
              completionTime={level2RewardCalculation.formattedTime}
              earnedLaddus={level2RewardCalculation.earnedLaddus}
              score={level2RewardCalculation.score}
              tier={level2RewardCalculation.earnedLaddus >= 25 ? 'GOLD' : level2RewardCalculation.earnedLaddus >= 18 ? 'SILVER' : 'BRONZE'}
              formulaDescription="Continuous time reward: faster delivery safely to Mandapam yields higher rewards"
              previousTotalLaddus={Math.max(0, ladduCount - level2RewardCalculation.earnedLaddus)}
              newTotalLaddus={ladduCount}
              onContinue={() => {
                setLevel2RewardCalculation(null);
                setIsTransitioningToMap(true);
                setTimeout(() => {
                  setIsTransitioningToMap(false);
                  setGameState(GameState.LEVEL_MAP);
                }, 600);
              }}
              continueLabel="NEXT →"
              autoAdvanceSeconds={0}
            />
          )}
        </AnimatePresence>

        {/* Level 1 Unified Laddu Reward Overlay (Shared AAA Presentation) */}
        <AnimatePresence>
          {level1RewardCalculation && (
            <UnifiedRewardOverlay
              levelNumber={1}
              levelTitle="Level 1 — Siddham"
              completionTime={level1RewardCalculation.formattedTime}
              earnedLaddus={level1RewardCalculation.earnedLaddus}
              score={level1RewardCalculation.score}
              tier={level1RewardCalculation.tier}
              formulaDescription="Deterministic speed reward: <45s = 21 Laddus (Gold), <90s = 16 (Silver), ≥90s = 11 (Bronze)"
              previousTotalLaddus={Math.max(0, ladduCount - level1RewardCalculation.earnedLaddus)}
              newTotalLaddus={ladduCount}
              onContinue={handleContinueToAnand}
              continueLabel="Speak with Anand"
              autoAdvanceSeconds={4.0}
            />
          )}
        </AnimatePresence>

        {/* Level 1 Completion Conversation: Ramu & Anand (Mandapam Organizer NPC) */}
        {isLevel1DialogueActive && (
          <Level1CompletionDialogue
            onComplete={handleLevel1DialogueComplete}
            getCharacterScreenPos={getCharacterScreenPos}
            onSpeakerChange={handleLevel1SpeakerChange}
          />
        )}

        {/* Opening Story Dialogue: Ramu + 4 Companions (Total 5 people) & Mushak */}
        {!isIntroCinematic && isCutsceneActive && activeLevel === LevelId.LEVEL_1 && (
          <OpeningStoryDialogue
            onComplete={handleDialogueComplete}
            onSpeakerChange={handleSpeakerChange}
          />
        )}

        {/* 16:9 HUD Overlay - Progressively revealed after cinematic finishes */}
        {isControlsRevealed && currentState === GameState.PLAYING && (
          <div className="absolute inset-0 pointer-events-none p-3 md:p-6 flex flex-col justify-between z-10">
            {/* Top HUD Bar */}
            <div className="flex items-center justify-between w-full">
              {/* Left: Player Badge & Association */}
              <div className="flex items-center gap-2.5 md:gap-3 pointer-events-auto bg-stone-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-500/40 shadow-lg">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 border border-amber-300 flex items-center justify-center text-xs font-bold text-stone-950">
                  R
                </div>
                <div className="leading-tight">
                  <div className="text-xs md:text-sm font-bold text-amber-200 tracking-wide">
                    {playerName || 'Ramu'} (Ramu)
                  </div>
                  <div className="text-[10px] text-amber-400 font-medium">
                    Millennials Youth Association • Rangastalam
                  </div>
                </div>
              </div>

              {/* Center: Authoritative Timer (Displays only in Level 1 when paper bag is picked up!) */}
              {activeLevel === LevelId.LEVEL_1 && pathrikaProgress?.hasPaperBag && (
                <div
                  id="hud-top-authoritative-timer"
                  className="flex items-center gap-1.5 bg-stone-900/90 backdrop-blur-md px-3 md:px-3.5 py-1.5 rounded-full border border-amber-400/50 shadow-lg text-amber-200 pointer-events-auto"
                >
                  <Clock className={`w-3.5 h-3.5 ${pathrikaProgress.isTimerActive ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
                  <span className="text-[10px] font-mono font-bold tracking-wider text-amber-300">TIME</span>
                  <span className="text-xs font-mono font-black text-amber-100 tracking-wider">
                    {pathrikaProgress.formattedTimer || '00:00'}
                  </span>
                </div>
              )}

              {/* Right: Complete Stage Action, Sound & Pause */}
              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Skip Level Button */}
                <button
                  id="hud-complete-stage-btn"
                  type="button"
                  onClick={handleSkipLevel}
                  title="Skip Level to proceed to next stage"
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-orange-950/40 transition-transform active:scale-95 cursor-pointer"
                >
                  <FastForward className="w-3.5 h-3.5 fill-current" />
                  <span className="whitespace-nowrap">Skip Level</span>
                </button>

                {/* Time-of-Day Atmosphere Switcher (Sunrise / Day / Sunset) */}
                <button
                  id="hud-time-of-day-btn"
                  type="button"
                  onClick={() => {
                    if (engineRef.current) {
                      const nextMode = engineRef.current.toggleTimeOfDay();
                      setTimeOfDay(nextMode);
                    }
                  }}
                  title="Toggle Natural Lighting Atmosphere (Sunrise / Day / Sunset)"
                  className="px-2.5 py-1.5 rounded-full bg-stone-900/85 hover:bg-stone-800 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg text-amber-200 cursor-pointer active:scale-95"
                >
                  {timeOfDay === 'sunrise' && (
                    <>
                      <Sunrise className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span className="hidden sm:inline">Sunrise</span>
                    </>
                  )}
                  {timeOfDay === 'day' && (
                    <>
                      <Sun className="w-3.5 h-3.5 text-yellow-300 animate-spin" style={{ animationDuration: '24s' }} />
                      <span className="hidden sm:inline">Midday</span>
                    </>
                  )}
                  {timeOfDay === 'sunset' && (
                    <>
                      <Sunset className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                      <span className="hidden sm:inline">Sunset</span>
                    </>
                  )}
                </button>

                {/* Sound Toggle */}
                <button
                  id="hud-sound-btn"
                  type="button"
                  onClick={toggleSound}
                  aria-label="Toggle Sound"
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-stone-900/85 hover:bg-stone-800 border border-amber-500/40 text-amber-300 flex items-center justify-center transition-transform active:scale-95 shadow-lg"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Pause Button */}
                <button
                  id="hud-pause-btn"
                  type="button"
                  onClick={pauseGame}
                  aria-label="Pause Game"
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-stone-900/85 hover:bg-stone-800 border border-amber-500/40 text-amber-300 flex items-center justify-center transition-transform active:scale-95 shadow-lg"
                >
                  <Pause className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Exploration Vehicle Interaction Prompt (When approaching on foot) */}
            <AnimatePresence>
              {!vehicleState?.isDriving && vehicleState?.inRange && (
                <motion.div
                  key="vehicle-proximity-prompt"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="mx-auto my-2 pointer-events-auto"
                >
                  {vehicleState.isUnlocked ? (
                    <div className="bg-stone-950/90 border border-emerald-500/50 shadow-2xl backdrop-blur-md rounded-2xl p-3.5 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <Car className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col pr-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                          <Unlock className="w-3.5 h-3.5" />
                          <span>RAMU'S EXPLORATION CAR</span>
                        </div>
                        <div className="text-[11px] text-stone-300">
                          Exclusively for Ramu • Ready to Drive
                        </div>
                      </div>
                      <button
                        id="hud-car-enter-btn"
                        type="button"
                        onClick={() => engineRef.current?.tryEnterCar()}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black text-xs transition-all active:scale-95 shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>ENTER [E]</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-stone-950/90 border border-amber-600/50 shadow-2xl backdrop-blur-md rounded-2xl p-3.5 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-600/40 flex items-center justify-center text-amber-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col pr-2 max-w-xs">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                          <span>VEHICLE LOCKED</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Exclusively Ramu
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-300 leading-snug mt-0.5">
                          Complete Level 1 (Siddham) to unlock Ramu's vehicle!
                        </div>
                      </div>
                      <button
                        id="hud-car-locked-btn"
                        type="button"
                        onClick={() => {
                          setVehicleToast('🔒 Car is Locked • Complete Level 1 (Siddham) to unlock Ramu\'s vehicle!');
                          setTimeout(() => setVehicleToast(null), 3500);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-700 text-stone-400 text-xs font-semibold cursor-not-allowed"
                      >
                        LOCKED
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Vehicle Feedback Toast */}
            <AnimatePresence>
              {vehicleToast && (
                <motion.div
                  key="vehicle-toast"
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                >
                  <div className="bg-stone-950/95 border border-amber-500/60 shadow-2xl rounded-full px-5 py-2 text-xs font-semibold text-amber-200 flex items-center gap-2 backdrop-blur-md">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{vehicleToast}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Permanent Mandapam Organizer Dialogue Banner */}
            <AnimatePresence>
              {organizerDialogue && !isCutsceneActive && !isLevel1DialogueActive && (
                <motion.div
                  key="mandapam-organizer-card"
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.96 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="mx-auto my-2 max-w-xl w-full pointer-events-auto px-2"
                >
                  <div className="bg-stone-950/95 border border-amber-500/50 shadow-2xl shadow-amber-950/40 rounded-2xl p-3.5 md:p-4 backdrop-blur-md flex items-start gap-3">
                    <div className="relative flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl bg-amber-950/90 border border-amber-500/40 flex items-center justify-center text-amber-300">
                      <User className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-amber-400/50" title="Auspicious Tilak" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-xs md:text-sm text-amber-200 tracking-wide">
                          {organizerDialogue.speaker}
                        </span>
                        <span className="text-[9px] md:text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold uppercase tracking-wider">
                          {organizerDialogue.role}
                        </span>
                      </div>
                      <p className="text-[11px] md:text-xs text-stone-200 leading-relaxed font-medium">
                        "{organizerDialogue.text}"
                      </p>
                      <p className="text-[10px] md:text-[11px] text-amber-400/80 leading-snug mt-1 italic font-serif">
                        {organizerDialogue.teluguText}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Telemetry & Navigation Guide (Only shown when not driving) */}
            {!vehicleState?.isDriving && (
              <div className="flex items-center justify-between text-[11px] text-amber-300/80 pointer-events-none">
                <span className={`bg-stone-950/60 px-2.5 py-1 rounded backdrop-blur-sm border border-amber-500/20 ${shouldRenderTouchControls ? 'hidden md:inline-block md:ml-36' : ''}`}>
                  Ramu: X {playerCoords.x}, Z {playerCoords.z} • {
                    playerCoords.x > 150
                      ? '🏙️ Modern City District'
                      : (playerCoords.x > 45 && playerCoords.z > 25)
                        ? '🛣️ Grand Highway (NH-65)'
                        : playerCoords.z < -28
                          ? '🌲 Rangastalam Natural Jungle'
                          : playerCoords.x < -40
                            ? '🌊 Kalyani River & Ghats'
                            : '🏡 Rangastalam Village'
                  } • {timeOfDay.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Real-time Tactical Mini-Map HUD (Radar, Objectives & World Map) */}
        {isControlsRevealed && currentState === GameState.PLAYING && (
          <MiniMapHud
            playerCoords={playerCoords}
            playerHeading={playerHeading}
            cameraYaw={cameraYaw}
            activeLevel={activeLevel}
            isDriving={!!vehicleState?.isDriving}
            pathrikaProgress={pathrikaProgress}
            level2State={level2State}
            level3State={level3State}
            isMobile={shouldRenderTouchControls}
          />
        )}

        {/* Mushak Control Demonstration Guide (Only displayed in Level 1; hidden in Level 2 and Level 3) */}
        {isMushakRevealed && activeLevel === LevelId.LEVEL_1 && currentState === GameState.PLAYING && !vehicleState?.isDriving && (
          <MushakControlGuide isMobile={shouldRenderTouchControls} />
        )}

        {/* Dedicated Modern Driving HUD: Speedometer at Bottom-Left, Horn & Exit at Bottom-Right (Hidden during cinematic) */}
        <AnimatePresence>
          {vehicleState?.isDriving && currentState === GameState.PLAYING && !isCinematicActive && isJoystickRevealed && (
            <>
              <DrivingHud
                speed={vehicleState.speed}
                isBoarding={vehicleState.isBoarding}
                boardingCount={vehicleState.boardingCount}
                onHorn={() => engineRef.current?.honkCarHorn()}
                onExit={() => engineRef.current?.exitCar()}
                isMobile={shouldRenderTouchControls}
              />
              {shouldRenderTouchControls && <VehicleDrivingControls />}
            </>
          )}
        </AnimatePresence>

        {/* Walking Joystick: Hidden while driving, automatically returns when exiting car */}
        {isJoystickRevealed && currentState === GameState.PLAYING && shouldRenderTouchControls && !vehicleState?.isDriving && (
          <VirtualJoystick isDriving={false} />
        )}

        {/* Smooth Cinematic Fade Transition: Level 1 -> Journey Map (Level 2 Unlocked) */}
        <AnimatePresence>
          {isTransitioningToMap && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0 bg-stone-950 z-50 flex flex-col items-center justify-center pointer-events-auto"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.35 }}
                className="text-center px-6"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.3)]">
                  <Sparkles className="w-7 h-7 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-serif text-amber-100 tracking-wide">
                  Journey to the Utsavam
                </h3>
                <p className="text-xs sm:text-sm text-amber-300/90 font-mono tracking-widest mt-1.5 uppercase">
                  Opening Level 2 on Journey Map...
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
