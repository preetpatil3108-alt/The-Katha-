/**
 * THE KATHA - Core Game Types & Interfaces
 * College competition project based on Vinayaka Chavithi / Ganesh Chaturthi
 * Millennials Youth Association - Rangastalam
 */

export enum GameState {
  INTRO = 'INTRO',
  NAME_INPUT = 'NAME_INPUT',
  GUIDANCE = 'GUIDANCE',
  MAIN_MENU = 'MAIN_MENU',
  STORY = 'STORY',
  LEVEL_MAP = 'LEVEL_MAP',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  GAME_ENDING = 'GAME_ENDING',
}

export enum CharacterId {
  RAMU = 'RAMU',
  COMPANION_1 = 'COMPANION_1',
  COMPANION_2 = 'COMPANION_2',
  COMPANION_3 = 'COMPANION_3',
  COMPANION_4 = 'COMPANION_4',
  MUSHAK = 'MUSHAK',
}

export enum LevelId {
  LEVEL_1 = 'LEVEL_1',
  LEVEL_2 = 'LEVEL_2',
  LEVEL_3 = 'LEVEL_3',
}

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  role: 'PLAYER' | 'NPC_COMPANION' | 'NPC_GUIDE';
  title: string;
  description: string;
  speed: number;
  rotationSpeed: number;
  scale: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    skin: string;
    clothing: string;
  };
  dialogueColor: string;
}

export interface LevelConfig {
  id: LevelId;
  index: number;
  title: string;
  subtitle: string;
  location: string;
  description: string;
  objectiveBrief: string;
  requiredLaddus: number;
  isRegistered: boolean;
  isUnlocked: boolean;
  isCompleted: boolean;
  bestScore: number;
}

export interface SaveData {
  playerId?: string;
  playerName: string;
  collegeName?: string;
  ladduCount: number;
  completedLevels: LevelId[];
  unlockedLevels: LevelId[];
  level1TaskCompleted?: boolean;
  level2TaskCompleted?: boolean;
  level3TaskCompleted?: boolean;
  rewardedLevels?: LevelId[];
  levelBestTimes?: Record<string, string>;
  levelBestScores?: Record<string, number>;
  levelBestSeconds?: Record<string, number>;
  level1LaddusEarned?: number;
  level2LaddusEarned?: number;
  level3LaddusEarned?: number;
  hasCompletedGame?: boolean;
  currentLevel: LevelId;
  storyWatched: boolean;
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  lastUpdated: number;
}

export interface LeaderboardEntry {
  id: string;
  rank?: number;
  playerName: string;
  collegeName?: string;
  score: number;
  level: number;
  levelsCompleted?: number;
  laddus: number; // total laddus
  laddusEarned?: number; // laddus earned in this run
  totalLaddus?: number; // total laddus of player
  completionTime: string;
  timestamp: number;
}

export interface PlayerInput {
  moveX: number; // -1 to 1 (left/right)
  moveZ: number; // -1 to 1 (forward/backward)
  isMoving: boolean;
  jump: boolean;
  interact: boolean;
}

export interface CameraSettings {
  distance: number;
  height: number;
  pitch: number;
  yaw: number;
  damping: number;
  minDistance: number;
  maxDistance: number;
  fov: number;
}

export interface AudioTrackConfig {
  id: string;
  name: string;
  url?: string;
  loop?: boolean;
  volume?: number;
}
