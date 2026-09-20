/**
 * THE KATHA - Centralized Laddu Reward & Progression System
 * 
 * CORE RULES:
 * - There is NO maximum score.
 * - Score is cumulative: Level 1 reward + Level 2 reward, with no ceiling.
 * - Time-based performance rewards: faster completion yields more Laddus.
 * - Centralized reward tables for Level 1 and Level 2 with exact integer comparisons.
 * - Duplicate reward protection: A single attempt awards its reward exactly once.
 * - Replay behavior: A replay begins a fresh attempt with a fresh timer and fresh reward calculation.
 */

import { LevelId, SaveData } from '../../types/game';
import { LevelRegistry } from '../levels/LevelRegistry';

export const LADDUS_PER_LEVEL = 20; // Default baseline
export const TOTAL_LEVELS = 3;

/**
 * Individual threshold entry within a level's time-reward table
 */
export interface TimeRewardThreshold {
  minSeconds: number; // inclusive lower bound
  maxSeconds: number; // inclusive upper bound (use Infinity for slowest tier)
  laddus: number;     // exact laddus awarded
  tierId: 'GOLD' | 'SILVER' | 'BRONZE';
  tierName: string;
  teluguTierName: string;
  speedLabel: string;
  stars: number;
}

/**
 * =========================================================================
 * CENTRAL REWARD CONFIGURATIONS
 * Easy to update, exact integer thresholds, zero rounding errors.
 * =========================================================================
 */

export const LEVEL_1_REWARD_TABLE: TimeRewardThreshold[] = [
  {
    minSeconds: 0,
    maxSeconds: 29,
    laddus: 30,
    tierId: 'GOLD',
    tierName: 'Divine Gold Tier (Speedmaster)',
    teluguTierName: 'దివ్య స్వర్ణ శ్రేణి',
    speedLabel: 'Under 30 Seconds (< 30s)',
    stars: 3,
  },
  {
    minSeconds: 30,
    maxSeconds: 44,
    laddus: 25,
    tierId: 'GOLD',
    tierName: 'Golden Swift Tier',
    teluguTierName: 'స్వర్ణ శ్రేణి',
    speedLabel: '30–44 Seconds',
    stars: 3,
  },
  {
    minSeconds: 45,
    maxSeconds: 59,
    laddus: 20,
    tierId: 'SILVER',
    tierName: 'Sacred Silver Tier',
    teluguTierName: 'రజత శ్రేణి',
    speedLabel: '45–59 Seconds',
    stars: 2,
  },
  {
    minSeconds: 60,
    maxSeconds: 89,
    laddus: 15,
    tierId: 'SILVER',
    tierName: 'Silver Devotion Tier',
    teluguTierName: 'రజత శ్రేణి',
    speedLabel: '60–89 Seconds',
    stars: 2,
  },
  {
    minSeconds: 90,
    maxSeconds: 119,
    laddus: 10,
    tierId: 'BRONZE',
    tierName: 'Blessed Bronze Tier',
    teluguTierName: 'కాంస్య శ్రేణి',
    speedLabel: '90–119 Seconds',
    stars: 1,
  },
  {
    minSeconds: 120,
    maxSeconds: Infinity,
    laddus: 5,
    tierId: 'BRONZE',
    tierName: 'Humble Devout Tier',
    teluguTierName: 'భక్తి శ్రేణి',
    speedLabel: '120 Seconds or More (120s+)',
    stars: 1,
  },
];

export const LEVEL_2_REWARD_TABLE: TimeRewardThreshold[] = [
  {
    minSeconds: 0,
    maxSeconds: 29,
    laddus: 40,
    tierId: 'GOLD',
    tierName: 'Divine Cosmic Speedmaster',
    teluguTierName: 'దివ్య స్వర్ణ శ్రేణి',
    speedLabel: 'Under 30 Seconds (< 30s)',
    stars: 3,
  },
  {
    minSeconds: 30,
    maxSeconds: 44,
    laddus: 35,
    tierId: 'GOLD',
    tierName: 'Golden Charioteer Tier',
    teluguTierName: 'స్వర్ణ శ్రేణి',
    speedLabel: '30–44 Seconds',
    stars: 3,
  },
  {
    minSeconds: 45,
    maxSeconds: 59,
    laddus: 30,
    tierId: 'SILVER',
    tierName: 'Sacred Silver Pilot',
    teluguTierName: 'రజత శ్రేణి',
    speedLabel: '45–59 Seconds',
    stars: 2,
  },
  {
    minSeconds: 60,
    maxSeconds: 89,
    laddus: 25,
    tierId: 'SILVER',
    tierName: 'Silver Swift Pilgrim',
    teluguTierName: 'రజత శ్రేణి',
    speedLabel: '60–89 Seconds',
    stars: 2,
  },
  {
    minSeconds: 90,
    maxSeconds: 119,
    laddus: 15,
    tierId: 'BRONZE',
    tierName: 'Blessed Bronze Pilgrim',
    teluguTierName: 'కాంస్య శ్రేణి',
    speedLabel: '90–119 Seconds',
    stars: 1,
  },
  {
    minSeconds: 120,
    maxSeconds: Infinity,
    laddus: 10,
    tierId: 'BRONZE',
    tierName: 'Devout Humble Pilgrim',
    teluguTierName: 'భక్తి శ్రేణి',
    speedLabel: '120 Seconds or More (120s+)',
    stars: 1,
  },
];

export const LEVEL_3_REWARD_TABLE: TimeRewardThreshold[] = [
  {
    minSeconds: 0,
    maxSeconds: 34,
    laddus: 50,
    tierId: 'GOLD',
    tierName: 'Divine Nimajjanam Guardian',
    teluguTierName: 'దివ్య నిమజ్జన రక్షక శ్రేణి',
    speedLabel: 'Under 35 Seconds (< 35s)',
    stars: 3,
  },
  {
    minSeconds: 35,
    maxSeconds: 49,
    laddus: 40,
    tierId: 'GOLD',
    tierName: 'Golden Royal Escort',
    teluguTierName: 'స్వర్ణ శ్రేణి',
    speedLabel: '35–49 Seconds',
    stars: 3,
  },
  {
    minSeconds: 50,
    maxSeconds: 69,
    laddus: 35,
    tierId: 'SILVER',
    tierName: 'Sacred Silver Charioteer',
    teluguTierName: 'రజత శ్రేణి',
    speedLabel: '50–69 Seconds',
    stars: 2,
  },
  {
    minSeconds: 70,
    maxSeconds: 99,
    laddus: 25,
    tierId: 'SILVER',
    tierName: 'Silver Devoted Escort',
    teluguTierName: 'రజత శ్రేణి',
    speedLabel: '70–99 Seconds',
    stars: 2,
  },
  {
    minSeconds: 100,
    maxSeconds: 129,
    laddus: 20,
    tierId: 'BRONZE',
    tierName: 'Blessed Bronze Pilgrim',
    teluguTierName: 'కాంస్య శ్రేణి',
    speedLabel: '100–129 Seconds',
    stars: 1,
  },
  {
    minSeconds: 130,
    maxSeconds: Infinity,
    laddus: 15,
    tierId: 'BRONZE',
    tierName: 'Devout Faithful Pilgrim',
    teluguTierName: 'భక్తి శ్రేణి',
    speedLabel: '130 Seconds or More (130s+)',
    stars: 1,
  },
];

/**
 * Backward compatibility alias configurations
 */
export const LEVEL_1_REWARD_CONFIG = {
  levelId: LevelId.LEVEL_1,
  table: LEVEL_1_REWARD_TABLE,
};

export const LEVEL_2_REWARD_CONFIG = {
  levelId: LevelId.LEVEL_2,
  table: LEVEL_2_REWARD_TABLE,
};

export const LEVEL_3_REWARD_CONFIG = {
  levelId: LevelId.LEVEL_3,
  table: LEVEL_3_REWARD_TABLE,
};

/**
 * Detailed reward calculation returned by the reward engine
 */
export interface LevelRewardCalculation {
  completionTime: string;           // Formatted time string (e.g., "00:25")
  completionTimeSeconds: number;    // Raw seconds (integer)
  formattedTime: string;            // Backward-compatible alias
  tier: 'GOLD' | 'SILVER' | 'BRONZE';
  tierName: string;
  teluguTierName: string;
  earnedLaddus: number;             // Laddus earned in this attempt
  laddusEarned: number;             // Backward-compatible alias
  totalLaddus: number;              // Player's accumulated total laddus
  baseLaddus: number;               // Laddus awarded
  speedBonusLaddus: number;
  stars: number;
  score: number;
  description: string;
  formulaDescription: string;
  speedCategory: 'FAST' | 'MEDIUM' | 'SLOW';
  speedLabel: string;
  levelCompleted: boolean;          // Authoritative level status
  attemptCompleted: boolean;        // Authoritative attempt status
}

export type Level2RewardCalculation = LevelRewardCalculation;

export const LEVEL_COMPLETED_SUCCESSFULLY = 'LEVEL_COMPLETED_SUCCESSFULLY' as const;
export const LEVEL_SKIPPED = 'LEVEL_SKIPPED' as const;
export type LevelProgressionEvent = typeof LEVEL_COMPLETED_SUCCESSFULLY | typeof LEVEL_SKIPPED;

export interface RewardResult {
  awarded: boolean;
  amount: number;
  newTotal: number;
  isDuplicate: boolean;
  levelId: LevelId;
  unlockedLevelId: LevelId | null;
  message: string;
  completionTime?: string;
  earnedLaddus?: number;
  totalLaddus?: number;
  levelCompleted?: boolean;
  attemptCompleted?: boolean;
  calculation?: LevelRewardCalculation;
}

export class RewardSystem {
  /**
   * Helper to match integer completion seconds against a reward table.
   * Exact integer comparison avoids rounding discrepancies.
   */
  public static matchTimeThreshold(
    table: TimeRewardThreshold[],
    completionSeconds: number
  ): TimeRewardThreshold {
    const s = Math.floor(Math.max(0, completionSeconds));
    for (const entry of table) {
      if (s >= entry.minSeconds && s <= entry.maxSeconds) {
        return entry;
      }
    }
    // Fallback to slowest threshold
    return table[table.length - 1];
  }

  /**
   * Core calculation method for level completion rewards.
   * 
   * Supports:
   *   calculateLevelReward(seconds: number, currentTotal?: number)
   *   calculateLevelReward(levelId: LevelId, seconds: number, currentTotal?: number)
   */
  public static calculateLevelReward(
    arg1: LevelId | number,
    arg2?: number,
    arg3?: number
  ): LevelRewardCalculation {
    let levelId: LevelId = LevelId.LEVEL_1;
    let completionTimeSeconds: number = 30;
    let currentTotal: number = 0;

    if (typeof arg1 === 'number') {
      completionTimeSeconds = arg1;
      levelId = LevelId.LEVEL_1;
      currentTotal = typeof arg2 === 'number' ? arg2 : 0;
    } else {
      levelId = arg1;
      completionTimeSeconds = typeof arg2 === 'number' ? arg2 : 30;
      currentTotal = typeof arg3 === 'number' ? arg3 : 0;
    }

    const s = Math.floor(Math.max(0, completionTimeSeconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const table = levelId === LevelId.LEVEL_3
      ? LEVEL_3_REWARD_TABLE
      : levelId === LevelId.LEVEL_2
      ? LEVEL_2_REWARD_TABLE
      : LEVEL_1_REWARD_TABLE;
    const threshold = this.matchTimeThreshold(table, s);
    const earnedLaddus = threshold.laddus;
    const totalLaddus = currentTotal + earnedLaddus;

    const baseScore = levelId === LevelId.LEVEL_3 ? 4000 : levelId === LevelId.LEVEL_2 ? 3000 : 2000;
    const score = baseScore + Math.max(0, 300 - s) * 10 + earnedLaddus * 50;

    const description = levelId === LevelId.LEVEL_3
      ? `Level 3 Nimajjanam completed in ${formattedTime}! Ayyagaru escorted safely home to Grand Avenue.`
      : levelId === LevelId.LEVEL_2
      ? `Level 2 Utsavam completed in ${formattedTime}! Ayyagaru reverently escorted to Rangastalam Mandapam.`
      : `Level 1 Siddham completed in ${formattedTime}! 21 sacred leaves gathered for Lord Ganesha.`;

    const formulaDescription = `${threshold.speedLabel} → +${earnedLaddus} Laddus (${threshold.tierName})`;

    return {
      completionTime: formattedTime,
      completionTimeSeconds: s,
      formattedTime,
      tier: threshold.tierId,
      tierName: threshold.tierName,
      teluguTierName: threshold.teluguTierName,
      earnedLaddus,
      laddusEarned: earnedLaddus,
      totalLaddus,
      baseLaddus: earnedLaddus,
      speedBonusLaddus: 0,
      stars: threshold.stars,
      score,
      description,
      formulaDescription,
      speedCategory: threshold.tierId === 'GOLD' ? 'FAST' : threshold.tierId === 'SILVER' ? 'MEDIUM' : 'SLOW',
      speedLabel: threshold.speedLabel,
      levelCompleted: true,
      attemptCompleted: true,
    };
  }

  /**
   * Helper to calculate Level 2 completion reward directly
   */
  public static calculateLevel2Reward(seconds: number, currentTotal?: number): LevelRewardCalculation {
    return this.calculateLevelReward(LevelId.LEVEL_2, seconds, currentTotal);
  }

  /**
   * Helper to calculate Level 3 completion reward directly
   */
  public static calculateLevel3Reward(seconds: number, currentTotal?: number): LevelRewardCalculation {
    return this.calculateLevelReward(LevelId.LEVEL_3, seconds, currentTotal);
  }

  /**
   * Awards Laddus to player save state.
   * - Fully cumulative: accumulates rewards across levels and replays with no upper cap.
   * - No hard-coded maximum score or score ceiling.
   * - Records best times, best scores, and unlocks next stage.
   */
  public static awardLaddus(
    amount: number = LADDUS_PER_LEVEL,
    levelId: LevelId = LevelId.LEVEL_1,
    currentSave: SaveData,
    calculation?: LevelRewardCalculation
  ): { nextSave: SaveData; result: RewardResult } {
    const completedList = currentSave.completedLevels || [];
    const rewardedList = currentSave.rewardedLevels || [];
    const bestTimes = currentSave.levelBestTimes || {};
    const bestScores = currentSave.levelBestScores || {};
    const bestSeconds = currentSave.levelBestSeconds || {};

    const actualAward = Math.max(0, calculation ? calculation.earnedLaddus : amount);
    const newTotal = (currentSave.ladduCount || 0) + actualAward;

    // Update calculation's totalLaddus with the authoritative new total
    if (calculation) {
      calculation.totalLaddus = newTotal;
    }

    // Track best time & best score
    const updatedBestTimes = { ...bestTimes };
    const updatedBestScores = { ...bestScores };
    const updatedBestSeconds = { ...bestSeconds };

    if (calculation) {
      const prevScore = bestScores[levelId] || 0;
      if (calculation.score > prevScore) {
        updatedBestScores[levelId] = calculation.score;
      }
      const prevSeconds = bestSeconds[levelId] ?? 99999;
      if (calculation.completionTimeSeconds < prevSeconds) {
        updatedBestSeconds[levelId] = calculation.completionTimeSeconds;
        updatedBestTimes[levelId] = calculation.formattedTime;
      }
    }

    // Progress completed and rewarded lists
    const nextCompleted = completedList.includes(levelId)
      ? completedList
      : [...completedList, levelId];

    const nextRewarded = rewardedList.includes(levelId)
      ? rewardedList
      : [...rewardedList, levelId];

    // Progression: completing Level 1 unlocks Level 2; completing Level 2 unlocks Level 3
    const nextLevelId = LevelRegistry.getNextLevel(levelId);
    let nextUnlocked = currentSave.unlockedLevels || [LevelId.LEVEL_1];
    let newlyUnlocked: LevelId | null = null;

    if (nextLevelId && !nextUnlocked.includes(nextLevelId)) {
      nextUnlocked = [...nextUnlocked, nextLevelId];
      newlyUnlocked = nextLevelId;
    }

    const nextSave: SaveData = {
      ...currentSave,
      ladduCount: newTotal,
      completedLevels: nextCompleted,
      unlockedLevels: nextUnlocked,
      rewardedLevels: nextRewarded,
      level1LaddusEarned: levelId === LevelId.LEVEL_1 ? actualAward : currentSave.level1LaddusEarned,
      level2LaddusEarned: levelId === LevelId.LEVEL_2 ? actualAward : currentSave.level2LaddusEarned,
      level3LaddusEarned: levelId === LevelId.LEVEL_3 ? actualAward : currentSave.level3LaddusEarned,
      hasCompletedGame: levelId === LevelId.LEVEL_3 ? true : currentSave.hasCompletedGame,
      levelBestTimes: updatedBestTimes,
      levelBestScores: updatedBestScores,
      levelBestSeconds: updatedBestSeconds,
      lastUpdated: Date.now(),
    };

    return {
      nextSave,
      result: {
        awarded: true,
        amount: actualAward,
        newTotal,
        isDuplicate: false,
        levelId,
        unlockedLevelId: newlyUnlocked,
        message: `+${actualAward} LADDUS awarded! Total: ${newTotal} Laddus.`,
        completionTime: calculation?.completionTime,
        earnedLaddus: actualAward,
        totalLaddus: newTotal,
        levelCompleted: true,
        attemptCompleted: true,
        calculation,
      },
    };
  }

  /**
   * Check if a specific level has already been completed once
   */
  public static isRewardClaimed(levelId: LevelId, saveData: SaveData): boolean {
    const completedList = saveData.completedLevels || [];
    const rewardedList = saveData.rewardedLevels || [];
    return rewardedList.includes(levelId) || completedList.includes(levelId);
  }

  /**
   * Authoritative progression processor.
   * STRICT ENFORCEMENT:
   * Only 'LEVEL_COMPLETED_SUCCESSFULLY' can award laddus.
   * 'LEVEL_SKIPPED' awards strictly 0 laddus, causes no score increase,
   * does NOT add to completedLevels or rewardedLevels, but unlocks the
   * next progression so the player can move past the level.
   */
  public static processLevelProgression(
    eventType: LevelProgressionEvent,
    levelId: LevelId,
    currentSave: SaveData,
    calculation?: LevelRewardCalculation,
    _score?: number,
    defaultLaddus: number = LADDUS_PER_LEVEL
  ): { nextSave: SaveData; result: RewardResult } {
    if (eventType === LEVEL_SKIPPED) {
      const nextLevelId = LevelRegistry.getNextLevel(levelId);
      let nextUnlocked = currentSave.unlockedLevels || [LevelId.LEVEL_1];
      let newlyUnlocked: LevelId | null = null;

      if (nextLevelId && !nextUnlocked.includes(nextLevelId)) {
        nextUnlocked = [...nextUnlocked, nextLevelId];
        newlyUnlocked = nextLevelId;
      }

      const nextSave: SaveData = {
        ...currentSave,
        // Player laddu total must remain EXACTLY unchanged
        ladduCount: currentSave.ladduCount || 0,
        // Do NOT treat skipped level as a successful completion
        completedLevels: currentSave.completedLevels || [],
        rewardedLevels: currentSave.rewardedLevels || [],
        // Progress unlockedLevels so player moves past the level
        unlockedLevels: nextUnlocked,
        currentLevel: nextLevelId || levelId,
        lastUpdated: Date.now(),
      };

      return {
        nextSave,
        result: {
          awarded: false,
          amount: 0,
          newTotal: currentSave.ladduCount || 0,
          isDuplicate: false,
          levelId,
          unlockedLevelId: newlyUnlocked,
          message: `Level ${levelId} skipped: 0 Laddus awarded. Laddu total remains unchanged (${currentSave.ladduCount || 0}).`,
          earnedLaddus: 0,
          totalLaddus: currentSave.ladduCount || 0,
          levelCompleted: false,
          attemptCompleted: false,
        },
      };
    }

    // LEVEL_COMPLETED_SUCCESSFULLY: normal authoritative reward calculation
    return this.awardLaddus(defaultLaddus, levelId, currentSave, calculation);
  }

  /**
   * Calculate summary metrics without any arbitrary maximum laddu cap
   */
  public static getProgressSummary(saveData: SaveData) {
    const completed = saveData.completedLevels || [];
    const unlocked = saveData.unlockedLevels || [LevelId.LEVEL_1];
    const ladduCount = saveData.ladduCount || 0;

    return {
      completedCount: completed.length,
      unlockedCount: unlocked.length,
      ladduCount,
      percentComplete: Math.round((completed.length / TOTAL_LEVELS) * 100),
      isAllComplete: completed.length >= TOTAL_LEVELS,
    };
  }
}
