/**
 * THE KATHA - Core 3D Rendering & Physics Engine
 * High-performance, mobile-optimized Three.js engine with:
 * - Stylized 3D Ramu character based strictly on reference turnaround sheet
 * - Smooth player movement: acceleration, deceleration, rotation, no-slide cadence
 * - Solid collisions against walls, buildings, trees, large props, and terrain boundaries
 * - ThirdPersonCamera with smooth damping following Ramu
 * - Strict player control: WASD and joystick control RAMU ONLY
 */

import * as THREE from 'three';
import { CharacterId, LevelId, PlayerInput } from '../../types/game';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { CollisionSystem } from '../collisions/CollisionSystem';
import { CharacterRegistry } from '../../core/characters/CharacterRegistry';
import { ProceduralCharacterMesh } from '../characters/ProceduralCharacterMesh';
import { audioManager } from '../../core/audio/AudioManager';
import { RangastalamVillage } from '../world/RangastalamVillage';
import { SacredForestGrove } from '../world/SacredForestGrove';
import { RangastalamWorldExpanded } from '../world/RangastalamWorldExpanded';
import { CompanionFollowerSystem } from '../characters/CompanionFollowerSystem';
import { MushakGuideSystem } from '../characters/MushakGuideSystem';
import { PathrikaCollectionSystem, PathrikaProgress } from '../characters/PathrikaCollectionSystem';
import { VillageNPCSystem } from '../characters/VillageNPCSystem';
import { AtmosphereSystem } from '../world/AtmosphereSystem';
import { NaturalJungleLandscape } from '../world/NaturalJungleLandscape';
import { TimeOfDaySystem, TimeOfDayMode } from '../world/TimeOfDaySystem';
import { ModernCityAndHighway } from '../world/ModernCityAndHighway';
import { TrafficSimulationSystem } from '../world/TrafficSimulationSystem';
import { PlayerDrivableCar, VehicleInteractionInfo } from '../world/PlayerDrivableCar';
import { FestiveCulturalLayer } from '../world/FestiveCulturalLayer';
import { OrganizerDialogue } from '../characters/MandapamOrganizerNPC';
import { AyyagaruNPC } from '../characters/AyyagaruNPC';
import { Level2UtsavamSystem, Level2State } from '../levels/Level2UtsavamSystem';
import { Level3NimajjanamSystem, Level3State } from '../levels/Level3NimajjanamSystem';
import { adaptiveGraphics, GraphicsProfileConfig } from '../../core/graphics/AdaptiveGraphicsManager';
import { inputManager } from '../controls/InputManager';

export interface VehicleHUDState {
  inRange: boolean;
  distance: number;
  isUnlocked: boolean;
  isDriving: boolean;
  promptText: string;
  feedbackMessage?: string;
  speed: number;
  isBoarding?: boolean;
  boardingCount?: { seated: number; total: number };
}

export interface GameEngineCallbacks {
  initialLevel?: LevelId;
  isLevel1Completed?: boolean;
  onCollectLaddu?: (count: number) => void;
  onPlayerPosition?: (pos: { x: number; y: number; z: number }, rotationY?: number) => void;
  onCameraYaw?: (yaw: number) => void;
  onMushakSpeech?: (speech: string, isSpeaking: boolean) => void;
  onReachedForest?: (reached: boolean) => void;
  onPathrikaProgress?: (progress: PathrikaProgress) => void;
  onPathrikaComplete?: (completionSeconds: number, formattedTime: string) => void;
  onIntroCinematicComplete?: () => void;
  onTimeOfDayChange?: (mode: TimeOfDayMode) => void;
  onVehicleStateChange?: (state: VehicleHUDState) => void;
  onMandapamOrganizerNearby?: (dialogue: OrganizerDialogue | null) => void;
  onLevel2StateChange?: (state: Level2State) => void;
  onLevel2Complete?: (completionSeconds: number, formattedTime: string) => void;
  onLevel3StateChange?: (state: Level3State) => void;
  onLevel3Complete?: (completionSeconds: number, formattedTime: string) => void;
  onCutsceneStateChange?: (active: boolean) => void;
  onCinematicHighlightChange?: (highlight: 'flags' | 'entrance' | null) => void;
}

export class GameEngine3D {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private isContextLost: boolean = false;
  private onContextLostHandler: ((event: Event) => void) | null = null;
  private onContextRestoredHandler: ((event: Event) => void) | null = null;
  private scene: THREE.Scene;
  private cameraSystem: ThirdPersonCamera;
  private collisionSystem: CollisionSystem;
  private callbacks: GameEngineCallbacks;
  private currentLevel: LevelId = LevelId.LEVEL_1;
  private isLevel1Completed: boolean = false;

  // Exploration Vehicle (Exclusively for Ramu, unlocked post Level 1)
  private playerCar: PlayerDrivableCar | null = null;
  private festiveCulturalLayer: FestiveCulturalLayer | null = null;
  private lastInteractPressed: boolean = false;
  private vehicleInteractCooldown: number = 0;
  private level3TrafficCollisionCooldown: number = 0;

  // Vehicle Seating & Boarding Kinematics
  private ramuBoardingState: 'none' | 'entering' | 'seated' | 'exiting' = 'none';
  private ramuBoardingTimer: number = 0;
  private readonly RAMU_BOARD_DURATION: number = 0.42;
  private readonly RAMU_EXIT_DURATION: number = 0.38;
  private ramuBoardingStartPos: THREE.Vector3 = new THREE.Vector3();
  private ramuBoardingStartRot: number = 0;
  private ramuBoardingEndPos: THREE.Vector3 = new THREE.Vector3();

  // Characters
  private ramuMesh: ProceduralCharacterMesh | null = null;
  private ramuPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 22); // South village entrance
  private ramuVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private ramuRotation: number = Math.PI; // Face North into village
  private companionMeshes: Map<CharacterId, ProceduralCharacterMesh> = new Map();
  private mushakMesh: ProceduralCharacterMesh | null = null;
  private ayyagaruNPC: AyyagaruNPC | null = null;
  private level2System: Level2UtsavamSystem | null = null;
  private level3System: Level3NimajjanamSystem | null = null;
  private followerSystem: CompanionFollowerSystem;
  private mushakGuide: MushakGuideSystem | null = null;
  private village: RangastalamVillage | null = null;
  private worldExpanded: RangastalamWorldExpanded | null = null;
  private forestGrove: SacredForestGrove | null = null;
  private pathrikaSystem: PathrikaCollectionSystem | null = null;
  private npcSystem: VillageNPCSystem | null = null;
  private atmosphereSystem: AtmosphereSystem | null = null;
  private naturalJungle: NaturalJungleLandscape | null = null;
  private modernCityHighway: ModernCityAndHighway | null = null;
  private trafficSystem: TrafficSimulationSystem | null = null;
  private timeOfDaySystem: TimeOfDaySystem | null = null;
  private sunLight: THREE.DirectionalLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  private isCutsceneActive: boolean = false;
  private isIntroCinematic: boolean = true;
  private activeCinematic: 'LEVEL1_INTRO' | 'LEVEL3_ARRIVAL' | 'NONE' = 'LEVEL1_INTRO';
  private cinematicElapsed: number = 0;
  private cinematicDuration: number = 6.0;
  private cutsceneElapsed: number = 0;
  private cutsceneDuration: number = 5.6;

  // Environment elements
  private collectibleLaddus: THREE.Group[] = [];
  private festiveLanterns: THREE.PointLight[] = [];
  private nonEssentialDecoratives: THREE.Object3D[] = [];
  private renderFrameCount: number = 0;
  private graphicsUnsubscribe: (() => void) | null = null;

  // Animation & Loop
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.currentLevel = callbacks.initialLevel || LevelId.LEVEL_1;
    this.isLevel1Completed = !!callbacks.isLevel1Completed;
    this.clock = new THREE.Clock();

    // 1. Initialize Scene & Fog (warm Indian morning festival atmosphere, clear view of mountains & city)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#fed7aa'); // Warm apricot morning sky
    this.scene.fog = new THREE.FogExp2('#fed7aa', 0.0025);

    // 2. Initialize Adaptive Graphics Renderer
    const initialConfig = adaptiveGraphics.getConfig();

    const createSafeRenderer = (targetCanvas: HTMLCanvasElement): THREE.WebGLRenderer => {
      const attempts = [
        // Tier 1: Optimal adaptive configuration (avoiding forced logarithmic depth buffer for compatibility)
        {
          canvas: targetCanvas,
          antialias: initialConfig.antialias,
          powerPreference: 'high-performance' as const,
          precision: initialConfig.tier === 'PERFORMANCE' ? ('mediump' as const) : ('highp' as const),
          logarithmicDepthBuffer: false,
          depth: true,
          stencil: false,
        },
        // Tier 2: Balanced fallback without high power requirement
        {
          canvas: targetCanvas,
          antialias: false,
          powerPreference: 'default' as const,
          precision: 'mediump' as const,
          logarithmicDepthBuffer: false,
          depth: true,
          stencil: false,
        },
        // Tier 3: Low-power compatibility mode
        {
          canvas: targetCanvas,
          antialias: false,
          powerPreference: 'low-power' as const,
          precision: 'lowp' as const,
          depth: true,
          stencil: false,
        },
      ];

      for (let i = 0; i < attempts.length; i++) {
        try {
          return new THREE.WebGLRenderer(attempts[i]);
        } catch (err) {
          console.warn(`[GameEngine3D] WebGLRenderer creation attempt ${i + 1} failed:`, err);
        }
      }

      return new THREE.WebGLRenderer({ canvas: targetCanvas });
    };

    this.renderer = createSafeRenderer(this.canvas);

    // Register WebGL context loss listeners to prevent permanent browser blocking
    this.onContextLostHandler = (event: Event) => {
      event.preventDefault(); // Prevents browser from permanently disabling WebGL for this page
      console.warn('[GameEngine3D] WebGL context lost - pausing rendering until restoration');
      this.isContextLost = true;
    };
    this.onContextRestoredHandler = () => {
      console.info('[GameEngine3D] WebGL context restored - resuming rendering');
      this.isContextLost = false;
      this.applyGraphicsProfile(adaptiveGraphics.getConfig());
    };

    this.canvas.addEventListener('webglcontextlost', this.onContextLostHandler, false);
    this.canvas.addEventListener('webglcontextrestored', this.onContextRestoredHandler, false);

    const initialWidth = Math.max(canvas.clientWidth || 0, canvas.parentElement?.clientWidth || window.innerWidth || 1280);
    const initialHeight = Math.max(canvas.clientHeight || 0, canvas.parentElement?.clientHeight || window.innerHeight || 720);
    this.renderer.setSize(initialWidth, initialHeight, false);
    this.renderer.setPixelRatio(adaptiveGraphics.getClampedPixelRatio());
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = initialConfig.shadowType;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // Dynamic subscription to adaptive profile changes
    this.graphicsUnsubscribe = adaptiveGraphics.subscribe((newConfig) => {
      this.applyGraphicsProfile(newConfig);
    });

    // 3. Third-Person Camera & Collision Systems
    this.cameraSystem = new ThirdPersonCamera({
      distance: 6.8,
      height: 2.8,
      pitch: 0.32,
      damping: 0.1,
    });

    this.collisionSystem = new CollisionSystem();
    this.collisionSystem.setGroundLevel(0);
    this.collisionSystem.setBoundaryRadius(340);

    // 4. Companion Follower System
    this.followerSystem = new CompanionFollowerSystem(this.collisionSystem);

    // 5. Setup Lighting & Festive Rangastalam Village
    this.setupLighting();
    this.setupEnvironment();

    // 6. Spawn Characters at Village Entrance
    this.spawnRamu();
    this.spawnCompanionsAndMushak();

    // 7. Initialize Pathrika Collection System for Level 1
    if (this.forestGrove && this.ramuMesh && this.village && this.mushakGuide) {
      this.pathrikaSystem = new PathrikaCollectionSystem(
        this.forestGrove,
        this.village,
        this.mushakGuide,
        this.followerSystem,
        this.collisionSystem,
        this.ramuMesh,
        {
          onProgressChange: (progress) => {
            if (this.callbacks.onPathrikaProgress) {
              this.callbacks.onPathrikaProgress(progress);
            }
          },
          onCelebration: (completionSeconds: number, formattedTime: string) => {
            if (this.callbacks.onPathrikaComplete) {
              this.callbacks.onPathrikaComplete(completionSeconds, formattedTime);
            }
          },
        }
      );
    }

    // 8. Spawn Auspicious Laddus along the Village Path
    this.spawnTestLaddus();

    // Configure initial level state
    if (this.currentLevel === LevelId.LEVEL_1) {
      this.activeCinematic = 'LEVEL1_INTRO';
      this.isIntroCinematic = true;
      this.cinematicElapsed = 0;
      this.cinematicDuration = 6.0;
      if (this.cameraSystem) {
        this.cameraSystem.setCinematicTransform(
          new THREE.Vector3(0, 14.5, 48.0),
          new THREE.Vector3(0, 3.2, 14.0)
        );
      }
    } else if (this.currentLevel === LevelId.LEVEL_2) {
      this.setLevel(LevelId.LEVEL_2);
    } else if (this.currentLevel === LevelId.LEVEL_3) {
      this.setLevel(LevelId.LEVEL_3);
    }

    // Start render loop
    this.start();
  }

  /**
   * Warm festival lighting (Sun, Ambient golden glow, Deepam point lights)
   */
  private setupLighting(): void {
    this.ambientLight = new THREE.AmbientLight('#fed7aa', 0.95);
    this.scene.add(this.ambientLight);

    const config = adaptiveGraphics.getConfig();
    this.sunLight = new THREE.DirectionalLight('#ff9838', 1.8);
    this.sunLight.position.set(150, 36, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = config.shadowMapSize;
    this.sunLight.shadow.mapSize.height = config.shadowMapSize;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = config.shadowDistance;
    const d = config.shadowCameraBound;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0003;
    this.scene.add(this.sunLight);

    const entranceGlow = new THREE.PointLight('#f59e0b', 1.6, 22);
    entranceGlow.position.set(0, 3.2, 22);
    this.scene.add(entranceGlow);
    this.festiveLanterns.push(entranceGlow);
  }

  /**
   * Rich Rangastalam Village 3D Environment, Natural Jungle and Horizon Mountains
   */
  private setupEnvironment(): void {
    // 1. Persistent Shared Rangastalam World (Continuous 640m x 640m landmass: Mountains, Countryside, Forest, Kalyani River & Ghats)
    this.worldExpanded = new RangastalamWorldExpanded(this.scene, this.collisionSystem);
    this.worldExpanded.build();

    // 2. Rangastalam Village (Houses, Indian flags, Shops, Pandal with Level Mandapams, Rangoli, Lamps)
    this.village = new RangastalamVillage(this.scene, this.collisionSystem, this.currentLevel);
    const villageData = this.village.build();
    this.festiveLanterns.push(...villageData.lanternLights);

    // 3. Sacred Forest Grove (Forest outside Rangastalam, 21 Sacred Leaf Plants, Handcrafted Paper Bag)
    this.forestGrove = new SacredForestGrove(this.collisionSystem);
    this.scene.add(this.forestGrove.group);

    // 4. Substantial Walkable Natural Jungle Landscape & 3D Horizon Mountain Ranges
    this.naturalJungle = new NaturalJungleLandscape(this.collisionSystem);
    this.naturalJungle.build();
    this.scene.add(this.naturalJungle.group);

    // 5. Living Village NPCs (Male and female wandering villagers with diverse sarees, dhotis, kurtas)
    this.npcSystem = new VillageNPCSystem();
    this.npcSystem.spawnVillagers();
    this.scene.add(this.npcSystem.group);

    // 6. Village Atmosphere (Flying birds with wing flapping, drifting clouds, procedural ambient sounds)
    this.atmosphereSystem = new AtmosphereSystem();
    this.scene.add(this.atmosphereSystem.group);

    // 7. Modern City District & Grand Highway (NH-65)
    this.modernCityHighway = new ModernCityAndHighway(this.collisionSystem);
    this.modernCityHighway.build();
    this.scene.add(this.modernCityHighway.group);
    this.festiveLanterns.push(...this.modernCityHighway.streetLights);

    // 8. Ambient Moving Traffic Simulation (Cars, SUVs, Bikes, Scooters, Auto-Rickshaws)
    this.trafficSystem = new TrafficSimulationSystem();
    this.scene.add(this.trafficSystem.group);

    // 9. Dynamic Time-of-Day & Atmospheric Lighting Engine (Sunrise, Day, Sunset)
    if (this.sunLight && this.ambientLight) {
      this.timeOfDaySystem = new TimeOfDaySystem(
        this.scene,
        this.sunLight,
        this.ambientLight,
        this.festiveLanterns
      );
    }

    // 10. Special Player-Drivable Exploration Car (Outside Rangastalam Village Entrance)
    // EXCLUSIVELY FOR RAMU. Unlocked only after Level 1 is completed.
    this.playerCar = new PlayerDrivableCar(this.collisionSystem, this.isLevel1Completed);
    this.scene.add(this.playerCar.group);

    // 11. Living Festive Cultural Layer throughout Rangastalam
    // (Stories of Lord Ganesha, Modak & Sweet Stalls, Pandals, Rangoli, Dhol props, Puja, Visarjan Ghat Area, Eco-Clay Murtis)
    this.festiveCulturalLayer = new FestiveCulturalLayer(this.collisionSystem);
    this.festiveCulturalLayer.build();
    this.scene.add(this.festiveCulturalLayer.group);
    this.festiveLanterns.push(...this.festiveCulturalLayer.lanternLights);

    // 12. Ayyagaru Vedic Priest & Scholar (Outside his house on Grand Avenue veranda in Modern City)
    this.ayyagaruNPC = new AyyagaruNPC(184.5, 0.20, -15.0);
    this.scene.add(this.ayyagaruNPC.group);

    // 13. Level 2 (Utsavam) Gameplay System
    this.level2System = new Level2UtsavamSystem(audioManager);
    this.level2System.setEntities(
      this.village?.getMandapamOrganizerNPC() ?? null,
      this.ayyagaruNPC,
      this.playerCar
    );
    this.level2System.setOnStateChange((state) => {
      this.callbacks.onLevel2StateChange?.(state);
    });
    this.level2System.setOnLevelComplete((completionSeconds, formattedTime) => {
      this.callbacks.onLevel2Complete?.(completionSeconds, formattedTime);
    });
    this.level2System.setOnStartPoojaCinematic(() => {
      this.startLevel2PoojaCinematic();
    });

    // 13b. Level 3 (Nimajjanam) Gameplay System
    this.level3System = new Level3NimajjanamSystem(audioManager);
    this.level3System.setEntities(
      this.village?.getMandapamOrganizerNPC() ?? null,
      this.ayyagaruNPC,
      this.playerCar
    );
    this.level3System.setOnStateChange((state) => {
      this.callbacks.onLevel3StateChange?.(state);
    });
    this.level3System.setOnLevelComplete((completionSeconds, formattedTime) => {
      this.callbacks.onLevel3Complete?.(completionSeconds, formattedTime);
    });
    this.level3System.setOnStartArrivalCinematic(() => {
      this.startLevel3ArrivalCinematic();
    });
    this.level3System.setOnCrashRestart(() => {
      this.restartLevel3();
    });

    // 14. Register Non-Essential Decorative Scatter for Adaptive Distance-Culling
    // STRICT RULE: Vital gameplay objects (Ramu, Mushika, Companions, Ayyagaru, Mandapams, Roads, Buildings, 21 Plants, Car) are NEVER culled
    if (this.naturalJungle) {
      const undergrowth = this.naturalJungle.group.getObjectByName('jungle_undergrowth');
      if (undergrowth) {
        undergrowth.children.forEach((child) => {
          this.nonEssentialDecoratives.push(child);
        });
      }
    }

    // Apply active graphics profile to initialize lighting and culling
    this.applyGraphicsProfile(adaptiveGraphics.getConfig());

    // Position camera directly behind Ramu so the village, player, and world are immediately visible
    if (this.cameraSystem) {
      if (this.isIntroCinematic) {
        this.cameraSystem.setCinematicTransform(
          new THREE.Vector3(-18.0, 14.5, 54.0),
          new THREE.Vector3(-6.2, 4.2, 19.5)
        );
      } else {
        this.cameraSystem.setTarget(this.ramuPosition, 1.2);
        this.cameraSystem.resetBehindTarget(this.ramuPosition, 0);
      }
    }
  }

  /**
   * Spawn Ramu (Player) at South Village Entrance
   */
  private spawnRamu(): void {
    const ramuConfig = CharacterRegistry.getCharacter(CharacterId.RAMU);
    this.ramuMesh = new ProceduralCharacterMesh(ramuConfig, this.currentLevel);
    this.ramuPosition.set(0, 0, 22); // Spawn at the village entrance threshold
    this.ramuMesh.group.position.copy(this.ramuPosition);
    this.ramuRotation = Math.PI; // Face inwards towards village
    this.ramuMesh.group.rotation.y = this.ramuRotation;
    this.scene.add(this.ramuMesh.group);

    this.cameraSystem.setTarget(this.ramuPosition);
  }

  /**
   * Spawn 4 Companions and Mushak at Village Entrance
   * Total 5 people: Ramu + 4 Companions (Varun, Chintu, Bhavani, Dinesh).
   * Strictly NPCs: Only Ramu responds to player input.
   */
  private spawnCompanionsAndMushak(): void {
    const companions = CharacterRegistry.getCompanions();
    // Gathered around Ramu at village entrance during opening story discussion
    const openingOffsets = [
      { x: -1.7, z: 20.8, rot: 0.5 },  // Chintu (close left)
      { x: 1.7, z: 20.8, rot: -0.5 },  // Bhavani (close right)
      { x: -2.3, z: 19.6, rot: 0.8 },  // Varun (rear left)
      { x: 2.3, z: 19.6, rot: -0.8 },  // Dinesh (rear right)
    ];

    companions.forEach((config, idx) => {
      const mesh = new ProceduralCharacterMesh(config, this.currentLevel);
      const offset = openingOffsets[idx];
      const initialPos = new THREE.Vector3(offset.x, 0, offset.z);
      mesh.group.position.copy(initialPos);
      mesh.group.rotation.y = offset.rot;
      this.scene.add(mesh.group);
      this.companionMeshes.set(config.id, mesh);

      // Register with CompanionFollowerSystem
      this.followerSystem.registerCompanion(config, mesh, initialPos, offset.rot, idx);
    });

    // Mushak Guide at village entrance in front of the group
    const mushakConfig = CharacterRegistry.getGuide();
    this.mushakMesh = new ProceduralCharacterMesh(mushakConfig);
    this.mushakMesh.group.position.set(0, 0, 18);
    this.mushakMesh.group.rotation.y = 0; // Facing south toward Ramu and companions
    this.scene.add(this.mushakMesh.group);

    // Initialize Mushak Guide System
    this.mushakGuide = new MushakGuideSystem(this.mushakMesh);
  }

  /**
   * Spawn Auspicious Laddus along the village road towards the forest
   */
  private spawnTestLaddus(): void {
    const ladduPositions = [
      { x: 0, z: 15 },    // Along entrance road
      { x: -7, z: 7 },    // Near sweet stall
      { x: 4.5, z: 1.5 }, // Near central pandal
      { x: 10, z: -14 },  // Along north-east road
      { x: 18, z: -25 },  // Approaching forest gate
      { x: 24, z: -38 },  // Forest entrance grove
    ];

    const ladduGeo = new THREE.SphereGeometry(0.35, 14, 14);
    const ladduMat = new THREE.MeshLambertMaterial({
      color: '#f59e0b',
      emissive: '#d97706',
      emissiveIntensity: 0.35,
    });

    ladduPositions.forEach((pos, idx) => {
      const group = new THREE.Group();
      group.name = `laddu_${idx}`;
      group.position.set(pos.x, 0.8, pos.z);

      const sphere = new THREE.Mesh(ladduGeo, ladduMat);
      sphere.castShadow = true;
      group.add(sphere);

      const bandGeo = new THREE.TorusGeometry(0.36, 0.03, 6, 12);
      const bandMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.rotation.x = Math.PI / 3;
      group.add(band);

      this.scene.add(group);
      this.collectibleLaddus.push(group);
    });
  }

  /**
   * Main Physics & Animation Tick
   * STRICT ENFORCEMENT: ONLY Ramu is moved by player input!
   */
  public update(input: PlayerInput): void {
    if (this.isPaused) return;
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Update persistent world environment (river vertex waves, wind ambiance)
    if (this.worldExpanded) {
      this.worldExpanded.update({ delta, time: elapsedTime });
    }

    // ==========================================
    // 1. LEVEL 1 OPENING CINEMATIC SEQUENCE
    // Single continuous camera movement (no jarring cuts):
    // - Begins from high/drone angle looking at Rangasthalam entrance arch and street
    // - Smoothly moves downward and forward toward Ramu
    // - Clearly reveals the existing Rangasthalam village world
    // - Seamlessly hands control over to third-person gameplay camera behind Ramu
    // ==========================================
    if (this.isIntroCinematic && this.activeCinematic === 'LEVEL1_INTRO') {
      this.cinematicElapsed += delta;
      const t = this.cinematicElapsed;
      const total = this.cinematicDuration;

      // Visual Highlight Sequence on the existing Level 1 camera shot:
      // FIRST (t: 0.6s to 2.5s) -> Indian flags on village houses
      // SECOND (t: 2.6s to 4.8s) -> Rangasthalam village entrance arch
      if (t >= 0.6 && t < 2.5) {
        const p = (t - 0.6) / 1.9;
        const intensity = Math.sin(p * Math.PI);
        this.village?.flagSystem.setHighlight(intensity);
        this.village?.setEntranceHighlight(0);
        this.callbacks.onCinematicHighlightChange?.('flags');
      } else if (t >= 2.6 && t < 4.8) {
        const p = (t - 2.6) / 2.2;
        const intensity = Math.sin(p * Math.PI);
        this.village?.flagSystem.setHighlight(0);
        this.village?.setEntranceHighlight(intensity);
        this.callbacks.onCinematicHighlightChange?.('entrance');
      } else {
        this.village?.flagSystem.setHighlight(0);
        this.village?.setEntranceHighlight(0);
        this.callbacks.onCinematicHighlightChange?.(null);
      }

      if (t >= total) {
        this.isIntroCinematic = false;
        this.isCutsceneActive = false;
        this.activeCinematic = 'NONE';
        this.village?.flagSystem.setHighlight(0);
        this.village?.setEntranceHighlight(0);
        this.callbacks.onCinematicHighlightChange?.(null);
        this.cameraSystem.resetBehindTarget(this.ramuPosition, 0);
        this.callbacks.onIntroCinematicComplete?.();
      } else {
        const camPos = new THREE.Vector3();
        const lookTarget = new THREE.Vector3();

        // Single continuous smooth camera movement (cubic bezier ease-in-out)
        const s = Math.min(1, t / total);
        const ease = s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2;

        const startPos = new THREE.Vector3(0, 14.5, 48.0);
        const startLook = new THREE.Vector3(0, 3.2, 14.0);

        const ideal = this.cameraSystem.calculateIdealTransform(this.cameraSystem.distance, 0);
        const endPos = ideal.position;
        const endLook = ideal.lookTarget;

        camPos.lerpVectors(startPos, endPos, ease);
        lookTarget.lerpVectors(startLook, endLook, ease);

        this.cameraSystem.setCinematicTransform(camPos, lookTarget);

        // Keep Ramu and Companions in calm idle
        if (this.ramuMesh) {
          this.ramuMesh.updateAnimation(false, delta, 0);
        }
        this.followerSystem.update(
          delta,
          this.ramuPosition,
          this.ramuRotation,
          false,
          true
        );

        if (this.mushakMesh) {
          this.mushakMesh.updateAnimation(false, delta, 0);
          this.mushakMesh.group.position.y = 0.2 + Math.sin(Date.now() * 0.005) * 0.04;
        }

        // Floating bobbing on collectible laddus
        const time = Date.now() * 0.003;
        this.collectibleLaddus.forEach((laddu, idx) => {
          laddu.rotation.y += delta * 1.5;
          laddu.position.y = 0.8 + Math.sin(time + idx) * 0.15;
        });

        // Living World Updates during cinematic
        if (this.village) this.village.update(delta, elapsedTime);
        if (this.timeOfDaySystem) this.timeOfDaySystem.update(delta, this.cameraSystem.camera.position);
        if (this.atmosphereSystem) this.atmosphereSystem.update(delta, elapsedTime);
        if (this.npcSystem) this.npcSystem.update(delta, this.ramuPosition);

        this.renderer.render(this.scene, this.cameraSystem.camera);
        return;
      }
    }

    // ==========================================
    // 2. LEVEL 3 FINAL CINEMATIC (Nimajjanam / Celebration)
    // ==========================================
    if (this.isCutsceneActive && this.activeCinematic === 'LEVEL3_ARRIVAL') {
      this.cutsceneElapsed += delta;
      const t = this.cutsceneElapsed;
      const total = this.cutsceneDuration;

      if (t >= total) {
        this.isCutsceneActive = false;
        this.activeCinematic = 'NONE';
        this.callbacks.onCutsceneStateChange?.(false);
        this.level3System?.triggerLevelComplete();
      } else {
        const camPos = new THREE.Vector3();
        const lookTarget = new THREE.Vector3();

        if (t <= 2.2) {
          if (this.ayyagaruNPC) {
            this.ayyagaruNPC.group.position.set(183.5, 0.2, -12.5);
            this.ayyagaruNPC.group.rotation.y = 0;
            this.ayyagaruNPC.setWalking(false);
            this.ayyagaruNPC.setDialogueGesture('blessing');
            this.ayyagaruNPC.update(delta, this.ramuPosition);
          }
          camPos.set(180.0, 2.0, -8.5);
          lookTarget.set(184.0, 1.2, -11.5);
        } else {
          const frac = Math.min(1, (t - 2.2) / 3.4);
          const easeFrac = frac * frac * (3 - 2 * frac);
          if (this.ayyagaruNPC) {
            this.ayyagaruNPC.group.position.lerpVectors(new THREE.Vector3(183.5, 0.2, -12.5), new THREE.Vector3(184.5, 0.2, -17.0), easeFrac);
            this.ayyagaruNPC.group.rotation.y = Math.PI;
            this.ayyagaruNPC.setWalking(true, delta, 1.0);
            this.ayyagaruNPC.update(delta, this.ramuPosition);
            if (t >= 4.8) {
              this.ayyagaruNPC.group.visible = false;
            }
          }
          camPos.lerpVectors(new THREE.Vector3(180.0, 2.0, -8.5), new THREE.Vector3(181.5, 2.5, -13.0), easeFrac);
          lookTarget.lerpVectors(new THREE.Vector3(184.0, 1.2, -11.5), new THREE.Vector3(184.5, 1.4, -16.5), easeFrac);
        }

        this.cameraSystem.setCinematicTransform(camPos, lookTarget);

        if (this.village) this.village.update(delta, elapsedTime);
        if (this.timeOfDaySystem) this.timeOfDaySystem.update(delta, this.cameraSystem.camera.position);
        if (this.atmosphereSystem) this.atmosphereSystem.update(delta, elapsedTime);
        if (this.npcSystem) this.npcSystem.update(delta, this.ramuPosition);

        this.renderer.render(this.scene, this.cameraSystem.camera);
        return;
      }
    }

    // Initialize atmosphere audio on first interaction
    if (input.isMoving && this.atmosphereSystem) {
      this.atmosphereSystem.initAudio();
    }

    // Decrement vehicle interaction cooldown
    if (this.vehicleInteractCooldown > 0) {
      this.vehicleInteractCooldown = Math.max(0, this.vehicleInteractCooldown - delta);
    }

    // Edge trigger for 'interact' (E key or UI action)
    const interactJustPressed = !!input.interact && !this.lastInteractPressed && this.vehicleInteractCooldown <= 0;
    this.lastInteractPressed = !!input.interact;

    // In Level 2 & 3, pressing [E] when a dialogue bubble is displayed advances/dismisses it
    let consumedByDialogue = false;
    if (this.currentLevel === LevelId.LEVEL_2 && interactJustPressed && this.level2System?.getState().activeDialogue) {
      this.level2System.dismissDialogue();
      this.vehicleInteractCooldown = 0.3;
      consumedByDialogue = true;
    } else if (this.currentLevel === LevelId.LEVEL_3 && interactJustPressed && this.level3System?.getState().activeDialogue) {
      this.level3System.dismissDialogue();
      this.vehicleInteractCooldown = 0.3;
      consumedByDialogue = true;
    }

    let isRamuActuallyMoving = false;
    const isDriving = this.playerCar ? this.playerCar.getIsOccupied() : false;

    // =======================================================
    // 1. RAMU DRIVING EXPLORATION VEHICLE
    // Exclusively Ramu. No companions or NPCs can ever drive.
    // =======================================================
    if (this.playerCar && isDriving) {
      if (interactJustPressed && !consumedByDialogue) {
        if (this.level2System && this.currentLevel === LevelId.LEVEL_2) {
          const l2State = this.level2System.getState(this.ramuPosition);
          if (l2State.canPickupAyyagaru) {
            this.pickupAyyagaru();
            this.vehicleInteractCooldown = 0.5;
            return;
          }
        }
        this.exitCar();
        this.vehicleInteractCooldown = 0.4;
      } else {
        // Synchronize boarding status: car cannot drive until all friends have boarded
        // In Level 3, everyone is already seated inside the car
        const isStillBoarding = this.currentLevel === LevelId.LEVEL_3 ? false : !this.followerSystem.isAllBoarded();
        if (this.playerCar.getIsBoarding() !== isStillBoarding) {
          this.playerCar.setBoarding(isStillBoarding);
        }

        this.playerCar.update(delta, input);
        this.ramuPosition.copy(this.playerCar.getPosition());
        this.ramuRotation = this.playerCar.getRotationY();

        // Keep Ramu seated inside the driver's seat anchor
        if (this.ramuMesh) {
          const driverTransform = this.playerCar.getSeatWorldTransform('driver');

          if (this.ramuBoardingState === 'entering') {
            this.ramuBoardingTimer += delta;
            const t = Math.min(1.0, this.ramuBoardingTimer / this.RAMU_BOARD_DURATION);
            const ease = t * t * (3 - 2 * t);

            this.ramuMesh.group.position.lerpVectors(this.ramuBoardingStartPos, driverTransform.position, ease);

            let diff = driverTransform.rotationY - this.ramuBoardingStartRot;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.ramuMesh.group.rotation.y = this.ramuBoardingStartRot + diff * ease;

            this.ramuMesh.setSitting(true, true);
            this.ramuMesh.updateAnimation(false, delta, 0);

            if (t >= 1.0) {
              this.ramuBoardingState = 'seated';
              this.ramuMesh.group.position.copy(driverTransform.position);
              this.ramuMesh.group.quaternion.copy(driverTransform.quaternion);
            }
          } else {
            // Firmly locked to driver seat anchor
            this.ramuMesh.setSitting(true, true);
            this.ramuMesh.group.visible = true;
            this.ramuMesh.group.position.copy(driverTransform.position);
            this.ramuMesh.group.quaternion.copy(driverTransform.quaternion);
            this.ramuMesh.updateAnimation(false, delta, 0);
          }
        }

        const currentSpeed = Math.abs(this.playerCar.getSpeed());
        isRamuActuallyMoving = currentSpeed > 0.15;

        // Smooth Vehicle Third-Person Camera tracking
        this.cameraSystem.setVehicleMode(true, this.ramuRotation);

        // Notify callback of Ramu position
        if (this.callbacks.onPlayerPosition) {
          this.callbacks.onPlayerPosition({
            x: this.ramuPosition.x,
            y: this.ramuPosition.y,
            z: this.ramuPosition.z,
          });
        }

        // Collect laddus while driving
        this.checkLadduCollisions();

        // Broadcast Vehicle State to HUD
        const boardingCount = this.followerSystem.getBoardingCount();
        if (this.callbacks.onVehicleStateChange) {
          this.callbacks.onVehicleStateChange({
            inRange: true,
            distance: 0,
            isUnlocked: true,
            isDriving: true,
            promptText: isStillBoarding ? 'WAITING FOR PASSENGERS...' : 'EXIT CAR [E]',
            speed: Math.round(currentSpeed * 3.6),
            isBoarding: isStillBoarding,
            boardingCount,
          });
        }
      }
    } else {
      // =======================================================
      // 2. RAMU ON FOOT (Standard Walking / Running Controls)
      // =======================================================
      if (this.playerCar) {
        this.playerCar.update(delta, input);
        this.cameraSystem.setVehicleMode(false);

        const carState = this.playerCar.getInteractionState(this.ramuPosition);

        // Handle Player Entry Attempt
        if (carState.inRange && interactJustPressed) {
          if (carState.isUnlocked) {
            this.tryEnterCar();
            this.vehicleInteractCooldown = 0.4;
          } else {
            // Locked feedback
            this.vehicleInteractCooldown = 0.5;
            audioManager.playSound('pause');
            if (this.callbacks.onVehicleStateChange) {
              this.callbacks.onVehicleStateChange({
                ...carState,
                isDriving: false,
                speed: 0,
                feedbackMessage: '🔒 Car is Locked • Complete Level 1 (Siddham) to unlock Ramu\'s vehicle!',
              });
            }
          }
        }

        // Level 2 Ayyagaru Interaction on foot
        if (this.level2System && this.currentLevel === LevelId.LEVEL_2 && interactJustPressed) {
          const l2State = this.level2System.getState(this.ramuPosition);
          if (l2State.canPickupAyyagaru) {
            this.pickupAyyagaru();
            this.vehicleInteractCooldown = 0.5;
          } else if (l2State.activeDialogue) {
            this.dismissLevel2Dialogue();
            this.vehicleInteractCooldown = 0.3;
          }
        }

        // Broadcast proximity & lock status to HUD
        if (this.callbacks.onVehicleStateChange) {
          this.callbacks.onVehicleStateChange({
            inRange: carState.inRange,
            distance: Math.round(carState.distance * 10) / 10,
            isUnlocked: carState.isUnlocked,
            isDriving: false,
            promptText: carState.promptText,
            feedbackMessage: carState.feedbackMessage,
            speed: 0,
          });
        }
      }

      if (this.ramuMesh) {
        this.ramuMesh.group.visible = true;
        const ramuConfig = CharacterRegistry.getCharacter(CharacterId.RAMU);

        // Only move Ramu when cutscene is finished
        if (input.isMoving && !this.isCutsceneActive) {
          // Calculate forward and right vectors relative to camera yaw
          const camYaw = this.cameraSystem.yaw;
          const forward = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
          const right = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));

          // Combined normalized movement direction
          const moveDir = forward
            .clone()
            .multiplyScalar(-input.moveZ)
            .add(right.clone().multiplyScalar(input.moveX))
            .normalize();

          // Speed calculation based on input magnitude
          const inputMag = Math.min(1.0, Math.sqrt(input.moveX * input.moveX + input.moveZ * input.moveZ));
          const targetSpeed = ramuConfig.speed * inputMag;
          const desiredVelocity = moveDir.multiplyScalar(targetSpeed);

          // Smooth Acceleration
          const accelFactor = Math.min(1.0, 12.0 * delta);
          this.ramuVelocity.lerp(desiredVelocity, accelFactor);

          // Smoothly rotate Ramu towards actual movement vector
          if (this.ramuVelocity.lengthSq() > 0.05) {
            const targetRotation = Math.atan2(this.ramuVelocity.x, this.ramuVelocity.z);
            let diff = targetRotation - this.ramuRotation;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.ramuRotation += diff * Math.min(1.0, ramuConfig.rotationSpeed * delta);
          }
        } else {
          // Smooth Deceleration (no instantaneous stops, no infinite sliding)
          const decelFactor = Math.exp(-14.0 * delta);
          this.ramuVelocity.multiplyScalar(decelFactor);
          if (this.ramuVelocity.lengthSq() < 0.005) {
            this.ramuVelocity.set(0, 0, 0);
          }
        }

        // Compute desired new position
        const desiredPos = this.ramuPosition
          .clone()
          .add(this.ramuVelocity.clone().multiplyScalar(delta));

        // Update vehicle colliders so moving & stopped vehicles are solid obstacles for Ramu
        if (this.trafficSystem) {
          this.collisionSystem.setDynamicColliders(this.trafficSystem.getVehicleColliders());
        }

        // Resolve movement with solid collision boundaries and obstacles
        this.ramuPosition = this.collisionSystem.resolveMovement(
          this.ramuPosition,
          desiredPos,
          0.55
        );

        // Handle smooth disembarking or standard foot movement
        if (this.ramuBoardingState === 'exiting') {
          this.ramuBoardingTimer += delta;
          const t = Math.min(1.0, this.ramuBoardingTimer / this.RAMU_EXIT_DURATION);
          const ease = t * t * (3 - 2 * t);

          this.ramuMesh.group.position.lerpVectors(this.ramuBoardingStartPos, this.ramuBoardingEndPos, ease);
          this.ramuMesh.group.rotation.y = this.ramuRotation;
          this.ramuMesh.setSitting(false);
          this.ramuMesh.updateAnimation(false, delta, 0);

          if (t >= 1.0) {
            this.ramuBoardingState = 'none';
            this.ramuPosition.copy(this.ramuBoardingEndPos);
            this.ramuPosition.y = 0;
            this.ramuMesh.group.position.copy(this.ramuPosition);
          }
        } else {
          // Apply coordinates and rotation to Ramu's 3D mesh
          this.ramuMesh.group.position.copy(this.ramuPosition);
          this.ramuMesh.group.rotation.y = this.ramuRotation;

          // Update procedural animation states: idle / walk / run with dynamic cadence
          const currentSpeed = this.ramuVelocity.length();
          isRamuActuallyMoving = currentSpeed > 0.15;
          this.ramuMesh.updateAnimation(
            isRamuActuallyMoving,
            delta,
            currentSpeed / ramuConfig.speed
          );
        }

        // Notify callback of Ramu position
        if (this.callbacks.onPlayerPosition) {
          this.callbacks.onPlayerPosition({
            x: this.ramuPosition.x,
            y: this.ramuPosition.y,
            z: this.ramuPosition.z,
          });
        }

        // Check laddu collection
        this.checkLadduCollisions();
      }
    }

    // ==========================================
    // Follower System: 4 NPC Companions follow Ramu
    // ==========================================
    this.followerSystem.update(
      delta,
      this.ramuPosition,
      this.ramuRotation,
      isRamuActuallyMoving,
      this.isCutsceneActive
    );

    // ==========================================
    // Mushak Guide System: Guides Ramu towards Forest
    // ==========================================
    if (this.mushakGuide && !this.isCutsceneActive) {
      this.mushakGuide.update(delta, this.ramuPosition);

      if (this.callbacks.onMushakSpeech) {
        this.callbacks.onMushakSpeech(
          this.mushakGuide.currentSpeech,
          this.mushakGuide.isSpeechVisible
        );
      }

      if (this.callbacks.onReachedForest) {
        this.callbacks.onReachedForest(this.mushakGuide.hasReachedForest);
      }
    } else if (this.mushakMesh && this.isCutsceneActive) {
      // Gentle floating breathing for Mushak during cutscene
      this.mushakMesh.updateAnimation(false, delta, 0);
      this.mushakMesh.group.position.y = 0.2 + Math.sin(Date.now() * 0.005) * 0.04;
    }

    // Floating bobbing & rotation on collectible laddus
    const time = Date.now() * 0.003;
    this.collectibleLaddus.forEach((laddu, idx) => {
      laddu.rotation.y += delta * 1.5;
      laddu.position.y = 0.8 + Math.sin(time + idx) * 0.15;
    });

    // ==========================================
    // Sacred Forest & Pathrika Collection System
    // ==========================================
    if (this.forestGrove) {
      this.forestGrove.update(delta);
    }

    if (this.pathrikaSystem && !this.isCutsceneActive && this.currentLevel === LevelId.LEVEL_1) {
      this.pathrikaSystem.update(delta, this.ramuPosition);
    }

    // ==========================================
    // Living World Updates (Mandapam, Time-of-Day, Lighting, Villagers, Birds & Traffic)
    // ==========================================
    // 1. Dynamic Time-of-Day & Atmospheric Lighting (Sunrise / Day / Sunset transitions)
    if (this.timeOfDaySystem) {
      this.timeOfDaySystem.update(delta, this.cameraSystem.camera.position);
    }
    const decorativeLightFactor = this.timeOfDaySystem ? this.timeOfDaySystem.getDecorativeLightFactor() : 0.0;

    // 2. Continuous Indian National Flags Wind Physics & Ganesh Mandapam Systems
    if (this.village) {
      this.village.update(delta, elapsedTime, this.ramuPosition, decorativeLightFactor);

      const organizer = this.village.getMandapamOrganizerNPC();
      if (organizer) {
        if (this.currentLevel === LevelId.LEVEL_1 && this.pathrikaSystem) {
          organizer.setPathrikaProgress(this.pathrikaSystem.getProgress());
        }
        if (this.callbacks.onMandapamOrganizerNearby) {
          if (organizer.getIsPlayerNearby()) {
            this.callbacks.onMandapamOrganizerNearby(organizer.getDialogue());
          } else {
            this.callbacks.onMandapamOrganizerNearby(null);
          }
        }
      }
    }

    // 3. Believable Wandering Villagers (NPC AI, walking, idle, separation)
    if (this.npcSystem) {
      this.npcSystem.update(delta, this.ramuPosition);
    }

    // 4. Living Village Atmosphere (Flying birds flapping wings, drifting clouds, ambient sound)
    if (this.atmosphereSystem) {
      this.atmosphereSystem.update(delta, elapsedTime);
    }

    // 5. Moving Ambient Traffic (Highway & City vehicle navigation, car-following, pedestrian detection & braking)
    if (this.trafficSystem) {
      this.trafficSystem.update(delta, this.ramuPosition);
      this.collisionSystem.setDynamicColliders(this.trafficSystem.getVehicleColliders());
    }

    // 6. River Water Surface Shimmer
    if (this.worldExpanded) {
      this.worldExpanded.update({ delta, time: elapsedTime });
    }

    // 7. Festive Cultural Layer Floating River Elements
    if (this.festiveCulturalLayer) {
      this.festiveCulturalLayer.update(delta, elapsedTime);
    }

    // 8. Ayyagaru Vedic Priest NPC & Level 2 Utsavam System
    if (this.ayyagaruNPC && this.currentLevel === LevelId.LEVEL_2) {
      this.ayyagaruNPC.update(delta, this.ramuPosition);
    }

    if (this.level2System && this.currentLevel === LevelId.LEVEL_2) {
      const isDriving = this.playerCar?.getIsOccupied() ?? false;
      this.level2System.update(delta, this.ramuPosition, isDriving);
      const l2State = this.level2System.getState(this.ramuPosition);
      this.callbacks.onLevel2StateChange?.(l2State);

      // Meaningful vehicle-to-vehicle collision detection during active Level 2
      // Excludes terrain, road, trees, triggers, and player internal components
      if (this.level2System.isTaskActive() && isDriving && this.trafficSystem && this.playerCar) {
        const carPos = this.playerCar.getPosition();
        const carSpeed = this.playerCar.getSpeed();
        const crashResult = this.trafficSystem.checkPlayerCarCollision(carPos, 1.35, carSpeed);
        if (crashResult.hasCrashed) {
          this.handleLevel2VehicleCrash();
        }
      }

      // Coordinate Mushak's guidance phase with Level 2 progression
      if (this.mushakGuide) {
        if (l2State.phase === 'DRIVE_TO_CITY' && this.mushakGuide.guidePhase !== 'level2_guide_to_city') {
          this.mushakGuide.startLevel2ToCity();
        } else if (l2State.phase === 'DRIVE_BACK_MANDAPAM' && this.mushakGuide.guidePhase !== 'level2_guide_back_to_mandapam') {
          this.mushakGuide.startLevel2ReturnToMandapam();
        }
      }
    }

    // 8b. Ayyagaru Vedic Priest NPC & Level 3 Nimajjanam System
    if (this.ayyagaruNPC && this.currentLevel === LevelId.LEVEL_3) {
      this.ayyagaruNPC.update(delta, this.ramuPosition);
    }

    if (this.level3System && this.currentLevel === LevelId.LEVEL_3) {
      const isDriving = this.playerCar?.getIsOccupied() ?? false;
      this.level3System.update(delta, this.ramuPosition, isDriving);
      const l3State = this.level3System.getState(this.ramuPosition);
      this.callbacks.onLevel3StateChange?.(l3State);

      if (this.level3TrafficCollisionCooldown > 0) {
        this.level3TrafficCollisionCooldown = Math.max(0, this.level3TrafficCollisionCooldown - delta);
      }

      // Meaningful vehicle-to-vehicle collision detection during active Level 3
      if (this.level3System.isTaskActive() && isDriving && this.trafficSystem && this.playerCar) {
        const carPos = this.playerCar.getPosition();
        const carSpeed = this.playerCar.getSpeed();
        const crashResult = this.trafficSystem.checkPlayerCarCollision(carPos, 1.35, carSpeed);
        if (crashResult.hasCrashed && this.level3TrafficCollisionCooldown <= 0) {
          this.level3TrafficCollisionCooldown = 1.2;
          const pushDir = crashResult.pushDirection || new THREE.Vector3(0, 0, 1);
          this.playerCar.applyCollisionBump(pushDir, 1.1);
          this.level3System.handleVehicleCrash();
        }
      }

      // Coordinate Mushak's guidance phase with Level 3 progression (Highway towards city)
      if (this.mushakGuide && this.mushakGuide.guidePhase !== 'level2_guide_to_city') {
        this.mushakGuide.startLevel2ToCity();
      }
    }

    // Notify Camera Yaw for HUD Compass
    if (this.callbacks.onCameraYaw) {
      this.callbacks.onCameraYaw(this.cameraSystem.yaw);
    }

    // Continuously notify Player Position & Heading for HUD Mini-Map
    if (this.callbacks.onPlayerPosition) {
      this.callbacks.onPlayerPosition(
        {
          x: this.ramuPosition.x,
          y: this.ramuPosition.y,
          z: this.ramuPosition.z,
        },
        this.ramuRotation
      );
    }

    // Update ThirdPersonCamera with 360 orbit and spring-arm collision avoidance
    const isDrivingActive = this.playerCar ? this.playerCar.getIsOccupied() : false;
    this.cameraSystem.setTarget(this.ramuPosition, isDrivingActive ? 1.4 : 1.2);
    this.cameraSystem.update(delta, 0, this.collisionSystem);

    // Amortized Adaptive Performance Updates (Point lights & decorative culling every 8 frames)
    this.renderFrameCount++;
    const activeConfig = adaptiveGraphics.getConfig();
    if (this.renderFrameCount % 8 === 0) {
      this.updateActivePointLights(activeConfig);
      this.updateDistanceCulling(activeConfig);
    }

    // Direct sun shadow camera to follow Ramu's neighborhood for optimal shadow resolution
    if (this.sunLight && this.sunLight.castShadow) {
      this.sunLight.position.set(
        this.ramuPosition.x + 80,
        this.ramuPosition.y + 110,
        this.ramuPosition.z + 60
      );
      this.sunLight.target.position.copy(this.ramuPosition);
      this.sunLight.target.updateMatrixWorld();
    }

    // Render 3D Scene
    if (!this.isContextLost && this.renderer) {
      this.renderer.render(this.scene, this.cameraSystem.camera);
    }

    // Dynamic runtime performance telemetry
    adaptiveGraphics.recordFrame(delta);
  }

  /**
   * Collision check between Ramu and collectible laddus
   */
  private checkLadduCollisions(): void {
    const collectRadius = 1.35;
    const remainingLaddus: THREE.Group[] = [];

    for (const laddu of this.collectibleLaddus) {
      const dist = laddu.position.distanceTo(this.ramuPosition);
      if (dist < collectRadius) {
        // Collect laddu
        this.scene.remove(laddu);
        audioManager.playSound('laddu_collect');
        if (this.callbacks.onCollectLaddu) {
          this.callbacks.onCollectLaddu(1);
        }
      } else {
        remainingLaddus.push(laddu);
      }
    }

    this.collectibleLaddus = remainingLaddus;
  }

  public setLevel(levelId: LevelId): void {
    this.currentLevel = levelId;
    if (this.ramuMesh) {
      this.ramuMesh.setLevel(levelId);
    }
    this.companionMeshes.forEach(mesh => {
      mesh.setLevel(levelId);
    });
    if (this.village) {
      this.village.setLevel(levelId);
    }

    if (levelId === LevelId.LEVEL_1) {
      // 1. Cleanly deactivate Level 2 if active
      if (this.playerCar?.getIsOccupied()) {
        this.exitCar();
      }
      if (this.playerCar) {
        this.playerCar.resetToStart();
        this.playerCar.setLevel1Completed(false);
      }
      if (this.ayyagaruNPC) {
        this.ayyagaruNPC.group.visible = false;
        this.ayyagaruNPC.setHasJoinedRamu(false);
      }
      if (this.level2System) {
        this.level2System.deactivate();
      }
      if (this.callbacks.onLevel2StateChange) {
        this.callbacks.onLevel2StateChange(null as any);
      }

      // 2. Position Ramu at village entrance threshold facing inwards towards Mandapam
      this.ramuPosition.set(0, 0, 22);
      this.ramuVelocity.set(0, 0, 0);
      this.ramuRotation = 0; // Face North directly towards Mandapam
      if (this.ramuMesh) {
        this.ramuMesh.group.position.copy(this.ramuPosition);
        this.ramuMesh.group.rotation.y = this.ramuRotation;
        this.ramuMesh.detachPaperBag();
        this.ramuMesh.detachHeldLeaf();
        this.ramuMesh.setGesture('idle');
      }

      // 3. Position Companions gathered at village entrance
      const companionOffsetsL1 = [
        { id: CharacterId.COMPANION_1, x: -1.7, z: 20.8, rot: 0.5 },  // Chintu (close left)
        { id: CharacterId.COMPANION_2, x: 1.7, z: 20.8, rot: -0.5 },  // Bhavani (close right)
        { id: CharacterId.COMPANION_3, x: -2.3, z: 19.6, rot: 0.8 },  // Varun (rear left)
        { id: CharacterId.COMPANION_4, x: 2.3, z: 19.6, rot: -0.8 },  // Dinesh (rear right)
      ];
      companionOffsetsL1.forEach(co => {
        const mesh = this.companionMeshes.get(co.id);
        if (mesh) {
          mesh.group.position.set(co.x, 0, co.z);
          mesh.group.rotation.y = co.rot;
          mesh.detachHeldLeaf();
          mesh.setGesture('idle');
        }
      });

      // 4. Reset Level 1 Pathrika Collection System for fresh attempt
      if (this.pathrikaSystem) {
        this.pathrikaSystem.startFreshAttempt();
      }

      // 5. Reset Mandapam Paper Bag on stand
      if (this.village) {
        this.village.resetMandapamPaperBag();
      }

      // 6. Reset Mushak guide
      if (this.mushakGuide) {
        this.mushakGuide.startGuidingToBag();
      }

      // 7. Setup Camera
      if (this.isIntroCinematic) {
        if (this.cameraSystem) {
          this.cameraSystem.setCinematicTransform(
            new THREE.Vector3(-18.0, 14.5, 54.0),
            new THREE.Vector3(-6.2, 4.2, 19.5)
          );
        }
      } else if (this.cameraSystem) {
        this.cameraSystem.setVehicleMode(false);
        this.cameraSystem.setTarget(this.ramuPosition, 1.2);
        this.cameraSystem.distance = 5.2;
        this.cameraSystem.height = 1.9;
        this.cameraSystem.pitch = 0.18;
        this.cameraSystem.resetBehindTarget(this.ramuPosition, 0);
      }
    } else if (levelId === LevelId.LEVEL_2) {
      this.currentLevel = LevelId.LEVEL_2;

      // 1. Cleanly deactivate Level 1
      if (this.pathrikaSystem) {
        this.pathrikaSystem.deactivate();
      }
      if (this.ramuMesh) {
        this.ramuMesh.detachPaperBag();
        this.ramuMesh.detachHeldLeaf();
      }
      this.companionMeshes.forEach(mesh => {
        mesh.detachHeldLeaf();
      });

      // 2. Permanently unlock vehicle access for Level 2
      this.setLevel1Completed(true);

      // 3. Initialize Level 2 Utsavam System and trigger opening task
      if (this.level2System) {
        this.level2System.setEntities(
          this.village?.getMandapamOrganizerNPC() ?? null,
          this.ayyagaruNPC,
          this.playerCar
        );
        this.level2System.startLevel2();
      }

      // 4. Unified Authoritative Vehicle & Driver Initialization
      this.initializeLevel2Vehicle(true);
    } else if (levelId === LevelId.LEVEL_3) {
      this.currentLevel = LevelId.LEVEL_3;

      // 1. Cleanly deactivate Level 1 & Level 2
      if (this.pathrikaSystem) {
        this.pathrikaSystem.deactivate();
      }
      if (this.level2System) {
        this.level2System.deactivate();
      }
      if (this.ramuMesh) {
        this.ramuMesh.detachPaperBag();
        this.ramuMesh.detachHeldLeaf();
      }
      this.companionMeshes.forEach(mesh => {
        mesh.detachHeldLeaf();
      });

      // 2. Permanently unlock vehicle access for Level 3
      this.setLevel1Completed(true);

      // 3. Initialize Level 3 Nimajjanam System and trigger opening task
      if (this.level3System) {
        this.level3System.setEntities(
          this.village?.getMandapamOrganizerNPC() ?? null,
          this.ayyagaruNPC,
          this.playerCar
        );
        this.level3System.startLevel3();
      }

      // 4. Unified Authoritative Vehicle & Driver Initialization
      this.initializeLevel3Vehicle(true);
    }
  }

  /**
   * Authoritative, unified vehicle and driving initialization for Level 2.
   * Executed identically for:
   * 1. Normal Level 2 Start (post Level 1 completion)
   * 2. Level 2 Replay (from Journey Map / Main Menu)
   * 3. Level 2 Crash Restart (upon traffic vehicle collision)
   */
  public initializeLevel2Vehicle(isInitialEntry: boolean = false): void {
    if (!this.playerCar) return;

    // 1. Direct gameplay initialization (no drone cinematic)
    this.activeCinematic = 'NONE';
    this.isIntroCinematic = false;
    this.cinematicElapsed = 0;
    this.isCutsceneActive = false;

    if (isInitialEntry) {

      // Park car at village entrance waiting for Ramu
      this.playerCar.setLevel1Completed(true);
      this.playerCar.initializeForLevel2Driving();
      this.playerCar.exit(); // Unoccupied, ready for Ramu to walk up and enter
      this.playerCar.setBoarding(false);
      this.playerCar.setPassenger(false);

      // Position Ramu on foot at Ganesh Mandapam conversing with Anand
      this.ramuPosition.set(-1.0, 0.0, 4.2);
      this.ramuRotation = -2.1; // Facing Anand at Mandapam entrance
      this.ramuVelocity.set(0, 0, 0);
      if (this.ramuMesh) {
        this.ramuMesh.setSitting(false);
        this.ramuMesh.group.visible = true;
        this.ramuMesh.group.position.copy(this.ramuPosition);
        this.ramuMesh.group.rotation.y = this.ramuRotation;
        this.ramuMesh.updateAnimation(false, 0.016, 0);
        this.ramuMesh.detachPaperBag();
        this.ramuMesh.detachHeldLeaf();
      }

      // Companions gather near Ramu at Mandapam
      this.followerSystem.resetPositionsNear(this.ramuPosition);

      // Camera set in third-person walking mode behind Ramu
      if (this.cameraSystem) {
        this.cameraSystem.setVehicleMode(false, this.ramuRotation);
        this.cameraSystem.setTarget(this.ramuPosition, 1.4);
        this.cameraSystem.resetBehindTarget(this.ramuPosition, this.ramuRotation);
      }

      // Broadcast walking state to HUD (not driving initially)
      if (this.callbacks.onVehicleStateChange) {
        this.callbacks.onVehicleStateChange({
          inRange: false,
          distance: 28,
          isUnlocked: true,
          isDriving: false,
          promptText: 'WALK TO THE CAR',
          speed: 0,
          isBoarding: false,
          boardingCount: { seated: 0, total: 4 },
        });
      }
    } else {
      // Crash recovery: start directly inside vehicle
      this.activeCinematic = 'NONE';
      this.isIntroCinematic = false;
      this.cinematicElapsed = 0;
      this.isCutsceneActive = false;

      this.playerCar.setLevel1Completed(true);
      this.playerCar.initializeForLevel2Driving();

      this.followerSystem.seatAllInCar(this.playerCar.getPosition(), this.playerCar.getRotationY());
      this.playerCar.setBoarding(false);

      this.ramuPosition.copy(this.playerCar.getPosition());
      this.ramuRotation = this.playerCar.getRotationY();
      this.ramuVelocity.set(0, 0, 0);
      if (this.ramuMesh) {
        this.ramuMesh.setSitting(true, true);
        this.ramuMesh.group.visible = true;
        const driverTransform = this.playerCar.getSeatWorldTransform('driver');
        this.ramuMesh.group.position.copy(driverTransform.position);
        this.ramuMesh.group.quaternion.copy(driverTransform.quaternion);
        this.ramuMesh.updateAnimation(false, 0.016, 0);
        this.ramuMesh.detachPaperBag();
        this.ramuMesh.detachHeldLeaf();
        this.ramuBoardingState = 'seated';
      }

      if (this.cameraSystem) {
        this.cameraSystem.setVehicleMode(true, this.ramuRotation);
        this.cameraSystem.setTarget(this.ramuPosition, 1.4);
        this.cameraSystem.resetBehindTarget(this.ramuPosition, this.ramuRotation);
      }

      if (this.callbacks.onVehicleStateChange) {
        this.callbacks.onVehicleStateChange({
          inRange: true,
          distance: 0,
          isUnlocked: true,
          isDriving: true,
          promptText: 'EXIT CAR [E]',
          speed: 0,
          isBoarding: false,
          boardingCount: { seated: 4, total: 4 },
        });
      }
    }

    // Clear input residual states and set interaction cooldown
    inputManager.reset();
    this.lastInteractPressed = false;
    this.vehicleInteractCooldown = 0.3;

    // Reset Ayyagaru NPC back to modern city veranda
    if (this.ayyagaruNPC) {
      this.ayyagaruNPC.group.position.set(184.5, 0.20, -15.0);
      this.ayyagaruNPC.group.visible = true;
      this.ayyagaruNPC.setHasJoinedRamu(false);
    }

    // Reset traffic fleet along highways & city avenues
    if (this.trafficSystem) {
      this.trafficSystem.resetTrafficFleet();
    }

    // Mushak guide points along NH-65 toward Modern City
    if (this.mushakGuide) {
      this.mushakGuide.startLevel2ToCity();
    }

    if (this.callbacks.onPlayerPosition) {
      this.callbacks.onPlayerPosition({
        x: this.ramuPosition.x,
        y: this.ramuPosition.y,
        z: this.ramuPosition.z,
      });
    }
  }

  public dismissLevel2Dialogue(): void {
    this.level2System?.dismissDialogue();
  }

  public acknowledgeLevel2Instruction(): void {
    this.level2System?.acknowledgeInstruction();
  }

  public restartLevel2(): void {
    this.handleLevel2VehicleCrash();
  }

  /**
   * Resets Level 2 upon a valid vehicle-to-vehicle collision:
   * 1. Stops current attempt & timer
   * 2. Triggers Level 2 state machine crash reset
   * 3. Authoritatively resets vehicle, Ramu, companions, and traffic using the unified initializer
   */
  public handleLevel2VehicleCrash(): void {
    if (!this.level2System || !this.level2System.isTaskActive()) return;

    // 1. Trigger Level 2 system state reset (resets timer, starts fresh task attempt)
    this.level2System.handleVehicleCrash();

    // 2. Authoritatively re-initialize vehicle and driver using the EXACT same path!
    this.initializeLevel2Vehicle(false);
  }

  /**
   * Authoritative, unified vehicle and driving initialization for Level 3 (Nimajjanam).
   * Ramu drives from the Ganesh Mandapam with Ayyagaru seated in the passenger seat
   * to escort him safely home to Grand Avenue in Modern City.
   */
  public initializeLevel3Vehicle(isInitialEntry: boolean = false): void {
    if (!this.playerCar) return;

    // 1. Direct driving initialization (no intro cinematic, Ayyagaru seated in passenger seat)
    this.activeCinematic = 'NONE';
    this.isIntroCinematic = false;
    this.cinematicElapsed = 0;
    this.isCutsceneActive = false;

    this.playerCar.setLevel1Completed(true);
    this.playerCar.initializeForLevel3Driving();
    this.playerCar.setPassenger(true); // Ayyagaru already seated in passenger seat

    if (this.ayyagaruNPC) {
      this.ayyagaruNPC.setHasJoinedRamu(true);
      this.ayyagaruNPC.group.visible = false;
    }

    // 2. Clear input residual states and set interaction cooldown
    inputManager.reset();
    this.lastInteractPressed = false;
    this.vehicleInteractCooldown = 0.3;

    // 3. Instantly seat companions in rear seats
    this.followerSystem.seatAllInCar(this.playerCar.getPosition(), this.playerCar.getRotationY());
    this.playerCar.setBoarding(false);

    // 4. Position Ramu in driver's seat
    this.ramuPosition.copy(this.playerCar.getPosition());
    this.ramuRotation = this.playerCar.getRotationY();
    this.ramuVelocity.set(0, 0, 0);
    if (this.ramuMesh) {
      this.ramuMesh.setSitting(true, true);
      this.ramuMesh.group.visible = true;
      const driverTransform = this.playerCar.getSeatWorldTransform('driver');
      this.ramuMesh.group.position.copy(driverTransform.position);
      this.ramuMesh.group.quaternion.copy(driverTransform.quaternion);
      this.ramuMesh.updateAnimation(false, 0.016, 0);
      this.ramuMesh.detachPaperBag();
      this.ramuMesh.detachHeldLeaf();
      this.ramuBoardingState = 'seated';
    }

    // 5. Attach camera directly to vehicle in smooth chase mode
    if (this.cameraSystem) {
      this.cameraSystem.setVehicleMode(true, this.ramuRotation);
      this.cameraSystem.setTarget(this.ramuPosition, 1.4);
      this.cameraSystem.resetBehindTarget(this.ramuPosition, this.ramuRotation);
    }

    // 6. Reset traffic fleet along highways & city avenues
    if (this.trafficSystem) {
      this.trafficSystem.resetTrafficFleet();
    }

    // 7. Mushak guide points along NH-65 toward Modern City
    if (this.mushakGuide) {
      this.mushakGuide.startLevel2ToCity();
    }

    // 8. Broadcast vehicle driving state to HUD immediately
    if (this.callbacks.onVehicleStateChange) {
      this.callbacks.onVehicleStateChange({
        inRange: true,
        distance: 0,
        isUnlocked: true,
        isDriving: true,
        promptText: 'ESCORTING AYYAGARU HOME',
        speed: 0,
        isBoarding: false,
        boardingCount: { seated: 4, total: 4 },
      });
    }

    if (this.callbacks.onPlayerPosition) {
      this.callbacks.onPlayerPosition({
        x: this.ramuPosition.x,
        y: this.ramuPosition.y,
        z: this.ramuPosition.z,
      });
    }
  }

  public startLevel2Cinematic(): void {
    this.activeCinematic = 'NONE';
    this.isIntroCinematic = false;
    this.isCutsceneActive = false;
    this.callbacks.onCutsceneStateChange?.(false);
  }

  public startLevel2PoojaCinematic(): void {
    this.activeCinematic = 'NONE';
    this.isCutsceneActive = false;
    this.callbacks.onCutsceneStateChange?.(false);
    this.level2System?.triggerWelcomeCelebration();
  }

  public startLevel3Cinematic(): void {
    this.activeCinematic = 'NONE';
    this.isIntroCinematic = false;
    this.isCutsceneActive = false;
    this.callbacks.onCutsceneStateChange?.(false);
  }

  public startLevel3ArrivalCinematic(): void {
    this.activeCinematic = 'LEVEL3_ARRIVAL';
    this.isCutsceneActive = true;
    this.cutsceneElapsed = 0;
    this.cutsceneDuration = 5.6;
    this.callbacks.onCutsceneStateChange?.(true);
  }

  public dismissLevel3Dialogue(): void {
    this.level3System?.dismissDialogue();
  }

  public acknowledgeLevel3Instruction(): void {
    this.level3System?.acknowledgeInstruction();
  }

  public restartLevel3(): void {
    if (!this.level3System) return;
    this.initializeLevel3Vehicle(false);
    this.trafficSystem?.resetTrafficFleet();
  }

  public handleLevel3VehicleCrash(): void {
    if (!this.level3System || !this.level3System.isTaskActive()) return;
    this.level3System.handleVehicleCrash();
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (paused) {
      this.clock.stop();
    } else {
      this.clock.start();
    }
    this.pathrikaSystem?.setPaused(paused);
    this.level2System?.setPaused(paused);
    this.level3System?.setPaused(paused);
    this.atmosphereSystem?.setPaused(paused);
    this.playerCar?.setPaused(paused);
    audioManager.setPaused(paused);
  }

  public setMuted(muted: boolean): void {
    this.atmosphereSystem?.setMuted(muted);
    this.playerCar?.setMuted(muted);
    audioManager.setMuted(muted);
  }

  public setCutsceneActive(active: boolean): void {
    this.isCutsceneActive = active;
  }

  public setSpeakerGesture(speakerId: CharacterId, gesture: string): void {
    const validGesture = gesture as 'none' | 'talk' | 'cheer' | 'explain' | 'wave' | 'nod' | 'pluck' | 'carry' | 'deposit';
    if (speakerId === CharacterId.RAMU && this.ramuMesh) {
      this.ramuMesh.setGesture(validGesture);
    } else if (speakerId === CharacterId.MUSHAK && this.mushakMesh) {
      this.mushakMesh.setGesture(validGesture);
    } else {
      this.followerSystem.setCompanionGesture(speakerId, validGesture);
    }
  }

  public startPathrikaCollection(): void {
    if (this.pathrikaSystem) {
      this.pathrikaSystem.startCollection();
    }
  }

  public triggerRamuAction(): void {
    if (this.pathrikaSystem) {
      this.pathrikaSystem.triggerRamuAction();
    }
  }

  public getPathrikaSystem(): PathrikaCollectionSystem | null {
    return this.pathrikaSystem;
  }

  public getCameraYaw(): number {
    return this.cameraSystem.yaw;
  }

  public resize(width: number, height: number): void {
    if (!this.renderer || !this.cameraSystem) return;
    this.renderer.setSize(width, height, false);
    this.cameraSystem.updateAspect(width / height);
  }

  public rotateCamera(deltaYaw: number, deltaPitch: number): void {
    if (this.isIntroCinematic) return;
    this.cameraSystem.rotate(deltaYaw, deltaPitch);
  }

  public zoomCamera(deltaDistance: number): void {
    if (this.isIntroCinematic) return;
    this.cameraSystem.zoom(deltaDistance);
  }

  /**
   * Skips intro cinematic or cutscene immediately:
   * Snaps camera directly behind player and activates gameplay.
   */
  public skipIntroCinematic(): void {
    if (!this.isIntroCinematic && !this.isCutsceneActive) return;
    this.isIntroCinematic = false;
    this.isCutsceneActive = false;
    this.activeCinematic = 'NONE';
    this.village?.flagSystem.setHighlight(0);
    this.village?.setEntranceHighlight(0);
    this.callbacks.onCinematicHighlightChange?.(null);
    this.atmosphereSystem?.initAudio();
    if (this.currentLevel === LevelId.LEVEL_2 && this.playerCar) {
      this.cameraSystem.setTarget(this.playerCar.getPosition(), this.playerCar.getRotationY());
      this.cameraSystem.distance = 6.0;
      this.cameraSystem.height = 2.4;
      this.cameraSystem.pitch = 0.16;
    } else {
      this.cameraSystem.resetBehindTarget(this.ramuPosition, 0);
    }
    this.callbacks.onIntroCinematicComplete?.();
    this.callbacks.onCutsceneStateChange?.(false);
  }

  public getIsIntroCinematic(): boolean {
    return this.isIntroCinematic;
  }

  /**
   * Starts the Level 1 Drone Establishing Cinematic sequence:
   * Sweeps across the village houses and Indian flags, approaches the entrance arch,
   * highlights the Rangasthalam signboard and Ramu, and transitions into gameplay.
   */
  public startLevel1Cinematic(): void {
    this.activeCinematic = 'LEVEL1_INTRO';
    this.isIntroCinematic = true;
    this.cinematicElapsed = 0;
    this.cinematicDuration = 6.0;
    this.isCutsceneActive = false;
    if (this.cameraSystem) {
      this.cameraSystem.setCinematicTransform(
        new THREE.Vector3(0, 14.5, 48.0),
        new THREE.Vector3(0, 3.2, 14.0)
      );
    }
  }

  public setTimeOfDay(mode: TimeOfDayMode): void {
    if (this.timeOfDaySystem) {
      this.timeOfDaySystem.setMode(mode);
      this.callbacks.onTimeOfDayChange?.(mode);
    }
  }

  public getTimeOfDay(): TimeOfDayMode {
    return this.timeOfDaySystem ? this.timeOfDaySystem.getMode() : 'sunrise';
  }

  public toggleTimeOfDay(): TimeOfDayMode {
    if (this.timeOfDaySystem) {
      const next = this.timeOfDaySystem.toggleNextMode();
      this.callbacks.onTimeOfDayChange?.(next);
      return next;
    }
    return 'sunrise';
  }

  // ==========================================
  // Exploration Vehicle Controls & Access
  // ==========================================
  public setLevel1Completed(completed: boolean): void {
    this.isLevel1Completed = completed;
    if (this.playerCar) {
      this.playerCar.setLevel1Completed(completed);
    }
  }

  public tryEnterCar(): boolean {
    if (!this.playerCar) return false;
    const res = this.playerCar.tryEnter(this.ramuPosition);
    if (res.success) {
      // Put car in boarding mode until all passengers enter
      this.playerCar.setBoarding(true);

      // Trigger friends to visibly move towards car doors and enter
      this.followerSystem.startBoardingCar(this.playerCar.getPosition(), this.playerCar.getRotationY());

      if (this.ramuMesh) {
        this.ramuMesh.setSitting(true, true);
        this.ramuMesh.group.visible = true;
        this.ramuMesh.detachPaperBag();
        this.ramuMesh.detachHeldLeaf();

        this.ramuBoardingState = 'entering';
        this.ramuBoardingTimer = 0;
        this.ramuBoardingStartPos.copy(this.ramuPosition);
        this.ramuBoardingStartRot = this.ramuRotation;
      }
      this.cameraSystem.setVehicleMode(true, this.playerCar.getRotationY());
      return true;
    }
    return false;
  }

  public exitCar(): void {
    if (!this.playerCar || !this.playerCar.getIsOccupied()) return;
    const carPos = this.playerCar.getPosition();
    const carRot = this.playerCar.getRotationY();
    const safeExitPos = this.playerCar.exit();
    this.playerCar.setBoarding(false);

    if (this.ramuMesh) {
      this.ramuMesh.setSitting(false);
      this.ramuBoardingState = 'exiting';
      this.ramuBoardingTimer = 0;
      this.ramuBoardingStartPos.copy(this.ramuMesh.group.position);
      this.ramuBoardingEndPos.copy(safeExitPos);
      this.ramuBoardingEndPos.y = 0;
    } else {
      this.ramuPosition.copy(safeExitPos);
      this.ramuPosition.y = 0;
    }

    // Disembark all companions to safe positions beside vehicle doors
    this.followerSystem.disembarkCar(carPos, carRot);
    this.cameraSystem.setVehicleMode(false);
  }

  public toggleCar(): void {
    if (!this.playerCar) return;
    if (this.playerCar.getIsOccupied()) {
      this.exitCar();
    } else {
      this.tryEnterCar();
    }
  }

  public honkCarHorn(): void {
    this.playerCar?.playHorn();
  }

  public isDriving(): boolean {
    return this.playerCar ? this.playerCar.getIsOccupied() : false;
  }

  public getCarState(): VehicleHUDState | null {
    if (!this.playerCar) return null;
    const info = this.playerCar.getInteractionState(this.ramuPosition);
    const isDriving = this.playerCar.getIsOccupied();
    const isBoarding = isDriving && !this.followerSystem.isAllBoarded();
    const boardingCount = this.followerSystem.getBoardingCount();
    return {
      inRange: info.inRange,
      distance: Math.round(info.distance * 10) / 10,
      isUnlocked: info.isUnlocked,
      isDriving,
      promptText: isBoarding ? 'WAITING FOR PASSENGERS...' : info.promptText,
      feedbackMessage: info.feedbackMessage,
      speed: Math.round(Math.abs(this.playerCar.getSpeed()) * 3.6),
      isBoarding,
      boardingCount,
    };
  }

  // ==========================================
  // Level 1 Completion Conversation & Camera API
  // ==========================================

  /**
   * Projects a 3D character's head position into 2D canvas screen coordinates.
   * Returns x, y in pixels, plus visibility flag.
   */
  public getCharacterScreenPosition(target: 'ramu' | 'organizer'): { x: number; y: number; visible: boolean } | null {
    if (!this.renderer || !this.cameraSystem) return null;
    const camera = this.cameraSystem.camera;
    const worldPos = new THREE.Vector3();

    if (target === 'ramu' && this.ramuMesh) {
      this.ramuMesh.group.getWorldPosition(worldPos);
      worldPos.y += 1.85; // slightly above Ramu's head
    } else if (target === 'organizer') {
      const organizer = this.village?.getMandapamOrganizerNPC();
      if (organizer) {
        organizer.group.getWorldPosition(worldPos);
        worldPos.y += 1.85; // slightly above Organizer's head
      } else {
        return null;
      }
    } else {
      return null;
    }

    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const proj = worldPos.clone().project(camera);

    // Is it in front of the camera?
    const isVisible = proj.z < 1 && proj.z > -1;
    const x = (proj.x * 0.5 + 0.5) * rect.width;
    const y = (-proj.y * 0.5 + 0.5) * rect.height;

    return { x, y, visible: isVisible };
  }

  /**
   * Begins the Level 1 completion dialogue between Ramu and the Mandapam Organizer.
   * Sets up cinematic framing, positions Ramu and Organizer facing each other, and initiates gestures.
   */
  public startLevel1CompletionDialogue(): void {
    const organizer = this.village?.getMandapamOrganizerNPC();
    if (organizer && this.ramuMesh) {
      // Turn Ramu towards the Mandapam Organizer
      const dx = organizer.position.x - this.ramuPosition.x;
      const dz = organizer.position.z - this.ramuPosition.z;
      this.ramuRotation = Math.atan2(dx, dz);
      this.ramuMesh.group.rotation.y = this.ramuRotation;
      this.ramuMesh.setGesture('explain');
      organizer.setDialogueGesture('nod');
    }

    // Set cinematic camera framing both Ramu and the Organizer in front of the Mandapam
    if (this.cameraSystem && organizer) {
      const midPoint = new THREE.Vector3(
        (this.ramuPosition.x + organizer.position.x) * 0.5,
        1.25,
        (this.ramuPosition.z + organizer.position.z) * 0.5
      );
      this.cameraSystem.setTarget(midPoint, 0);
      this.cameraSystem.distance = 4.0;
      this.cameraSystem.height = 1.35;
      this.cameraSystem.pitch = 0.12;
    }
  }

  /**
   * Updates gestures and active speaker animations for the Level 1 completion dialogue.
   */
  public setLevel1DialogueSpeaker(speaker: 'ramu' | 'organizer', gesture: string): void {
    const organizer = this.village?.getMandapamOrganizerNPC();
    if (speaker === 'ramu') {
      if (this.ramuMesh) {
        this.ramuMesh.setGesture(gesture as any);
      }
      if (organizer) {
        organizer.setDialogueGesture('nod');
      }
    } else {
      if (this.ramuMesh) {
        this.ramuMesh.setGesture('none');
      }
      if (organizer) {
        organizer.setDialogueGesture(gesture as any);
      }
    }
  }

  /**
   * Restores normal camera and character gestures after dialogue completion.
   */
  public endLevel1CompletionDialogue(): void {
    const organizer = this.village?.getMandapamOrganizerNPC();
    if (this.ramuMesh) {
      this.ramuMesh.setGesture('cheer');
    }
    if (organizer) {
      organizer.setDialogueGesture('idle');
    }
    if (this.cameraSystem) {
      this.cameraSystem.setTarget(this.ramuPosition, 1.2);
      this.cameraSystem.distance = 6.5;
      this.cameraSystem.height = 2.6;
      this.cameraSystem.pitch = 0.35;
    }
  }

  public pickupAyyagaru(): void {
    if (this.level2System) {
      this.level2System.pickupAyyagaru();
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Applies adaptive graphics profile to live engine systems
   */
  public applyGraphicsProfile(config: GraphicsProfileConfig): void {
    if (!this.renderer) return;

    this.renderer.setPixelRatio(adaptiveGraphics.getClampedPixelRatio());
    this.renderer.shadowMap.type = config.shadowType;
    this.renderer.shadowMap.needsUpdate = true;

    if (this.sunLight) {
      this.sunLight.shadow.mapSize.width = config.shadowMapSize;
      this.sunLight.shadow.mapSize.height = config.shadowMapSize;
      const d = config.shadowCameraBound;
      this.sunLight.shadow.camera.left = -d;
      this.sunLight.shadow.camera.right = d;
      this.sunLight.shadow.camera.top = d;
      this.sunLight.shadow.camera.bottom = -d;
      this.sunLight.shadow.camera.far = config.shadowDistance;
      this.sunLight.shadow.camera.updateProjectionMatrix();
      if (this.sunLight.shadow.map) {
        this.sunLight.shadow.map.dispose();
        this.sunLight.shadow.map = null;
      }
    }

    this.updateActivePointLights(config);
    this.updateDistanceCulling(config);
  }

  /**
   * Throttles distant point lights based on active profile tier
   */
  private updateActivePointLights(config: GraphicsProfileConfig): void {
    if (this.festiveLanterns.length === 0) return;

    if (config.tier === 'QUALITY') {
      for (let i = 0; i < this.festiveLanterns.length; i++) {
        this.festiveLanterns[i].visible = true;
      }
      return;
    }

    const maxActive = config.maxActivePointLights;
    const ramuX = this.ramuPosition.x;
    const ramuZ = this.ramuPosition.z;
    const maxDistSq = config.tier === 'PERFORMANCE' ? 3600 : 10000; // 60m vs 100m

    // Sort lanterns by distance to Ramu so nearest festive lanterns stay active
    const sorted = this.festiveLanterns.map((light) => {
      const dx = light.position.x - ramuX;
      const dz = light.position.z - ramuZ;
      return { light, distSq: dx * dx + dz * dz };
    });
    sorted.sort((a, b) => a.distSq - b.distSq);

    for (let i = 0; i < sorted.length; i++) {
      sorted[i].light.visible = i < maxActive && sorted[i].distSq <= maxDistSq;
    }
  }

  /**
   * Distance culling for non-essential decorative scatter
   * STRICT GUARANTEE: Never culls Ramu, Mushika, Ayyagaru, Mandapam, Roads, Buildings, 21 Sacred Plants
   */
  private updateDistanceCulling(config: GraphicsProfileConfig): void {
    if (this.nonEssentialDecoratives.length === 0) return;

    const cullDistSq = config.decorCullDistanceSq;
    const ramuX = this.ramuPosition.x;
    const ramuZ = this.ramuPosition.z;

    for (let i = 0; i < this.nonEssentialDecoratives.length; i++) {
      const obj = this.nonEssentialDecoratives[i];
      const dx = obj.position.x - ramuX;
      const dz = obj.position.z - ramuZ;
      obj.visible = dx * dx + dz * dz <= cullDistSq;
    }
  }

  public dispose(): void {
    this.stop();
    if (this.graphicsUnsubscribe) {
      this.graphicsUnsubscribe();
      this.graphicsUnsubscribe = null;
    }
    if (this.worldExpanded) {
      this.worldExpanded.dispose();
    }
    if (this.ramuMesh) {
      this.ramuMesh.dispose();
    }
    this.companionMeshes.forEach(mesh => mesh.dispose());
    if (this.mushakMesh) {
      this.mushakMesh.dispose();
    }
    if (this.trafficSystem) {
      this.trafficSystem.dispose();
    }
    if (this.atmosphereSystem) {
      this.atmosphereSystem.dispose();
    }
    if (this.playerCar) {
      this.playerCar.dispose();
    }
    if (this.onContextLostHandler) {
      this.canvas.removeEventListener('webglcontextlost', this.onContextLostHandler);
      this.onContextLostHandler = null;
    }
    if (this.onContextRestoredHandler) {
      this.canvas.removeEventListener('webglcontextrestored', this.onContextRestoredHandler);
      this.onContextRestoredHandler = null;
    }
    if (this.renderer) {
      try {
        this.renderer.dispose();
      } catch {}
    }
  }
}
