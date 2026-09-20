/**
 * THE KATHA - Save System Abstraction
 * Manages player progress, unlocked levels, and preferences for the 3-Stage Journey.
 * Uses localStorage with schema validation and safe fallback.
 */

import { LevelId, SaveData } from '../../types/game';

const SAVE_KEY = 'the_katha_game_save_v2';

export const DEFAULT_SAVE_DATA: SaveData = {
  playerId: undefined,
  playerName: '',
  collegeName: '',
  ladduCount: 0,
  completedLevels: [],
  unlockedLevels: [LevelId.LEVEL_1],
  level1TaskCompleted: false,
  level2TaskCompleted: false,
  level3TaskCompleted: false,
  level1LaddusEarned: 0,
  level2LaddusEarned: 0,
  level3LaddusEarned: 0,
  hasCompletedGame: false,
  rewardedLevels: [],
  currentLevel: LevelId.LEVEL_1,
  storyWatched: false,
  soundEnabled: true,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  lastUpdated: Date.now(),
};

export class SaveSystem {
  private static isStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__the_katha_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  public static saveGame(data: Partial<SaveData>): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }
    try {
      const current = this.loadGame();
      const updated: SaveData = {
        ...current,
        ...data,
        lastUpdated: Date.now(),
      };
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(updated));
      return true;
    } catch (err) {
      console.warn('[SaveSystem] Failed to save game data:', err);
      return false;
    }
  }

  public static loadGame(): SaveData {
    if (!this.isStorageAvailable()) {
      return { ...DEFAULT_SAVE_DATA };
    }
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) {
        return { ...DEFAULT_SAVE_DATA };
      }
      const parsed = JSON.parse(raw);
      
      const validLevelIds = Object.values(LevelId);
      const safeCompleted = Array.isArray(parsed.completedLevels)
        ? parsed.completedLevels.filter((id: any) => validLevelIds.includes(id))
        : [];
      const safeUnlocked = Array.isArray(parsed.unlockedLevels)
        ? parsed.unlockedLevels.filter((id: any) => validLevelIds.includes(id))
        : [LevelId.LEVEL_1];
      if (!safeUnlocked.includes(LevelId.LEVEL_1)) {
        safeUnlocked.unshift(LevelId.LEVEL_1);
      }
      const safeRewarded = Array.isArray(parsed.rewardedLevels)
        ? parsed.rewardedLevels.filter((id: any) => validLevelIds.includes(id))
        : [];

      return {
        ...DEFAULT_SAVE_DATA,
        playerId: typeof parsed.playerId === 'string' && parsed.playerId.trim().length > 0 ? parsed.playerId.trim() : undefined,
        playerName: typeof parsed.playerName === 'string' ? parsed.playerName.trim() : '',
        collegeName: typeof parsed.collegeName === 'string' ? parsed.collegeName.trim() : '',
        ladduCount: typeof parsed.ladduCount === 'number' && !isNaN(parsed.ladduCount)
          ? Math.max(0, parsed.ladduCount)
          : 0,
        completedLevels: safeCompleted,
        unlockedLevels: safeUnlocked,
        level1TaskCompleted: typeof parsed.level1TaskCompleted === 'boolean'
          ? parsed.level1TaskCompleted
          : safeCompleted.includes(LevelId.LEVEL_1),
        level2TaskCompleted: typeof parsed.level2TaskCompleted === 'boolean'
          ? parsed.level2TaskCompleted
          : safeCompleted.includes(LevelId.LEVEL_2),
        level3TaskCompleted: typeof parsed.level3TaskCompleted === 'boolean'
          ? parsed.level3TaskCompleted
          : safeCompleted.includes(LevelId.LEVEL_3),
        level1LaddusEarned: typeof parsed.level1LaddusEarned === 'number'
          ? parsed.level1LaddusEarned
          : 0,
        level2LaddusEarned: typeof parsed.level2LaddusEarned === 'number'
          ? parsed.level2LaddusEarned
          : 0,
        level3LaddusEarned: typeof parsed.level3LaddusEarned === 'number'
          ? parsed.level3LaddusEarned
          : 0,
        hasCompletedGame: typeof parsed.hasCompletedGame === 'boolean'
          ? parsed.hasCompletedGame
          : safeCompleted.includes(LevelId.LEVEL_3),
        rewardedLevels: safeRewarded,
        currentLevel: validLevelIds.includes(parsed.currentLevel) ? parsed.currentLevel : LevelId.LEVEL_1,
        storyWatched: typeof parsed.storyWatched === 'boolean' ? parsed.storyWatched : false,
        soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
        lastUpdated: typeof parsed.lastUpdated === 'number' ? parsed.lastUpdated : Date.now(),
      };
    } catch (err) {
      console.warn('[SaveSystem] Corrupted save data detected, resetting to defaults:', err);
      return { ...DEFAULT_SAVE_DATA };
    }
  }

  public static isLevel1TaskCompleted(): boolean {
    const data = this.loadGame();
    return !!data.level1TaskCompleted || (Array.isArray(data.completedLevels) && data.completedLevels.includes(LevelId.LEVEL_1));
  }

  public static setLevel1TaskCompleted(): void {
    const current = this.loadGame();
    const nextCompleted = current.completedLevels.includes(LevelId.LEVEL_1)
      ? current.completedLevels
      : [...current.completedLevels, LevelId.LEVEL_1];
    const nextUnlocked = current.unlockedLevels.includes(LevelId.LEVEL_2)
      ? current.unlockedLevels
      : [...current.unlockedLevels, LevelId.LEVEL_2];
    this.saveGame({
      level1TaskCompleted: true,
      completedLevels: nextCompleted,
      unlockedLevels: nextUnlocked,
    });
  }

  public static isLevel2TaskCompleted(): boolean {
    const data = this.loadGame();
    return !!data.level2TaskCompleted || (Array.isArray(data.completedLevels) && data.completedLevels.includes(LevelId.LEVEL_2));
  }

  public static setLevel2TaskCompleted(laddusEarned?: number): void {
    const current = this.loadGame();
    const nextCompleted = current.completedLevels.includes(LevelId.LEVEL_2)
      ? current.completedLevels
      : [...current.completedLevels, LevelId.LEVEL_2];
    const nextUnlocked = current.unlockedLevels.includes(LevelId.LEVEL_3)
      ? current.unlockedLevels
      : [...current.unlockedLevels, LevelId.LEVEL_3];
    this.saveGame({
      level2TaskCompleted: true,
      level2LaddusEarned: laddusEarned ?? current.level2LaddusEarned ?? 0,
      completedLevels: nextCompleted,
      unlockedLevels: nextUnlocked,
    });
  }

  public static isLevel3TaskCompleted(): boolean {
    const data = this.loadGame();
    return !!data.level3TaskCompleted || (Array.isArray(data.completedLevels) && data.completedLevels.includes(LevelId.LEVEL_3));
  }

  public static setLevel3TaskCompleted(laddusEarned?: number): void {
    const current = this.loadGame();
    const nextCompleted = current.completedLevels.includes(LevelId.LEVEL_3)
      ? current.completedLevels
      : [...current.completedLevels, LevelId.LEVEL_3];
    this.saveGame({
      level3TaskCompleted: true,
      level3LaddusEarned: laddusEarned ?? current.level3LaddusEarned ?? 0,
      hasCompletedGame: true,
      completedLevels: nextCompleted,
    });
  }

  public static hasCompletedGame(): boolean {
    const data = this.loadGame();
    return !!data.hasCompletedGame || (Array.isArray(data.completedLevels) && data.completedLevels.includes(LevelId.LEVEL_3));
  }

  public static restartGameKeepProfile(playerName: string, soundEnabled: boolean = true, collegeName: string = '', playerId?: string): SaveData {
    const restarted: SaveData = {
      ...DEFAULT_SAVE_DATA,
      playerId,
      playerName: playerName || '',
      collegeName: collegeName || '',
      soundEnabled,
      ladduCount: 0,
      completedLevels: [],
      unlockedLevels: [LevelId.LEVEL_1],
      level1TaskCompleted: false,
      level2TaskCompleted: false,
      level3TaskCompleted: false,
      level1LaddusEarned: 0,
      level2LaddusEarned: 0,
      level3LaddusEarned: 0,
      hasCompletedGame: false,
      storyWatched: true,
      lastUpdated: Date.now(),
    };
    if (this.isStorageAvailable()) {
      try {
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(restarted));
      } catch (err) {
        console.warn('[SaveSystem] Error writing restarted game save:', err);
      }
    }
    return restarted;
  }

  public static resetGame(): SaveData {
    if (this.isStorageAvailable()) {
      try {
        window.localStorage.removeItem(SAVE_KEY);
      } catch (err) {
        console.warn('[SaveSystem] Error resetting save data:', err);
      }
    }
    return { ...DEFAULT_SAVE_DATA };
  }
}
