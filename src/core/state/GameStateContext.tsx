/**
 * THE KATHA - Central Game State Context
 * Manages game loop phase, active stage, player progress, and audio sync for 3-Stage Journey.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { GameState, LevelId, SaveData } from '../../types/game';
import { SaveSystem } from '../save/SaveSystem';
import { audioManager } from '../audio/AudioManager';
import { RewardSystem, RewardResult, LADDUS_PER_LEVEL, LevelRewardCalculation, LEVEL_COMPLETED_SUCCESSFULLY, LEVEL_SKIPPED } from '../rewards/RewardSystem';
import { leaderboardService } from '../leaderboard/LeaderboardService';
import { supabaseService } from '../supabase/supabaseClient';

interface GameStateContextValue {
  currentState: GameState;
  activeLevel: LevelId;
  levelAttemptId: number;
  saveData: SaveData;
  playerId?: string;
  playerName: string;
  collegeName: string;
  ladduCount: number;
  soundEnabled: boolean;
  lastRewardResult: RewardResult | null;
  lastCompletionCalculation: LevelRewardCalculation | null;
  justCompletedLevel: LevelId | null;
  setJustCompletedLevel: (lvl: LevelId | null) => void;
  setActiveLevel: (levelId: LevelId) => void;
  setGameState: (state: GameState) => void;
  startLevel: (levelId: LevelId) => void;
  completeLevel: (score?: number, laddusGained?: number, calculation?: LevelRewardCalculation, targetState?: GameState) => void;
  skipLevel: (levelId?: LevelId) => void;
  awardLaddus: (amount?: number, levelId?: LevelId) => RewardResult;
  setPlayerName: (name: string) => void;
  setCollegeName: (college: string) => void;
  setPlayerProfile: (name: string, college: string) => Promise<void>;
  toggleSound: () => void;
  addLaddus: (count: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartLevel: () => void;
  returnToMenu: () => void;
  resetProgress: () => void;
  restartGame: (startPlaying?: boolean) => void;
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

export const GameStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [saveData, setSaveData] = useState<SaveData>(() => SaveSystem.loadGame());
  const [currentState, setCurrentState] = useState<GameState>(GameState.INTRO);
  const [activeLevel, setActiveLevel] = useState<LevelId>(saveData.currentLevel || LevelId.LEVEL_1);
  const [levelAttemptId, setLevelAttemptId] = useState<number>(1);
  const [lastRewardResult, setLastRewardResult] = useState<RewardResult | null>(null);
  const [lastCompletionCalculation, setLastCompletionCalculation] = useState<LevelRewardCalculation | null>(null);
  const [justCompletedLevel, setJustCompletedLevel] = useState<LevelId | null>(null);
  const rewardedAttemptsRef = React.useRef<Set<string>>(new Set());

  // Initialize anonymous auth user on startup to link local session with Supabase UUID
  useEffect(() => {
    if (saveData.playerId) {
      supabaseService.setCurrentUserId(saveData.playerId);
    }
    supabaseService.getOrCreateAnonymousUser().then((userId) => {
      if (userId) {
        setSaveData((prev) => {
          if (prev.playerId !== userId) {
            const next = { ...prev, playerId: userId };
            SaveSystem.saveGame(next);
            return next;
          }
          return prev;
        });
      }
    }).catch((err) => {
      console.warn('[GameStateContext] Anonymous auth init warning:', err);
    });
  }, []);

  // Sync audio mute status with save data
  useEffect(() => {
    audioManager.setMuted(!saveData.soundEnabled);
  }, [saveData.soundEnabled]);

  const updateActiveLevel = useCallback((levelId: LevelId) => {
    setActiveLevel(levelId);
    setSaveData(prev => {
      if (prev.currentLevel === levelId) return prev;
      const next = { ...prev, currentLevel: levelId };
      SaveSystem.saveGame(next);
      return next;
    });
  }, []);

  const setGameState = useCallback((state: GameState) => {
    setCurrentState(state);
  }, []);

  const setPlayerName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaveData(prev => {
      const next = { ...prev, playerName: trimmed };
      SaveSystem.saveGame(next);
      return next;
    });
  }, []);

  const setCollegeName = useCallback((college: string) => {
    const trimmed = college.trim();
    setSaveData(prev => {
      const next = { ...prev, collegeName: trimmed };
      SaveSystem.saveGame(next);
      return next;
    });
  }, []);

  const setPlayerProfile = useCallback(async (name: string, college: string) => {
    const trimmedName = name.trim();
    const trimmedCollege = college.trim();

    let userId: string | null = null;
    try {
      const reg = await leaderboardService.registerPlayer(trimmedName, trimmedCollege);
      userId = reg.userId;
    } catch (err) {
      console.warn('[GameStateContext] Register player error:', err);
    }

    setSaveData(prev => {
      const next = {
        ...prev,
        playerId: userId || prev.playerId,
        playerName: trimmedName || prev.playerName,
        collegeName: trimmedCollege,
      };
      SaveSystem.saveGame(next);
      leaderboardService.syncLaddus(next.ladduCount, next.playerName, next.collegeName)
        .catch(err => console.warn('[Leaderboard] Score sync error:', err));
      return next;
    });
  }, []);

  const toggleSound = useCallback(() => {
    setSaveData(prev => {
      const next = { ...prev, soundEnabled: !prev.soundEnabled };
      audioManager.setMuted(!next.soundEnabled);
      SaveSystem.saveGame(next);
      return next;
    });
    audioManager.playSound('button_tap');
  }, []);

  const addLaddus = useCallback((count: number) => {
    setSaveData(prev => {
      const next = { ...prev, ladduCount: prev.ladduCount + count };
      SaveSystem.saveGame(next);
      leaderboardService.syncLaddus(next.ladduCount, next.playerName, next.collegeName)
        .catch(err => console.warn('[Leaderboard] Sync error:', err));
      return next;
    });
    audioManager.playSound('laddu_collect');
  }, []);

  const startLevel = useCallback((levelId: LevelId) => {
    setActiveLevel(levelId);
    setLevelAttemptId(prev => prev + 1);
    setSaveData(prev => {
      const next = { ...prev, currentLevel: levelId };
      SaveSystem.saveGame(next);
      return next;
    });
    setCurrentState(GameState.PLAYING);
  }, []);

  const awardLaddus = useCallback((amount: number = LADDUS_PER_LEVEL, levelId?: LevelId): RewardResult => {
    const targetLevel = levelId || activeLevel;
    let computedResult: RewardResult | null = null;
    
    setSaveData(prev => {
      const { nextSave, result } = RewardSystem.awardLaddus(amount, targetLevel, prev);
      computedResult = result;
      setLastRewardResult(result);
      if (result.awarded) {
        SaveSystem.saveGame(nextSave);
        leaderboardService.syncLaddus(nextSave.ladduCount, nextSave.playerName, nextSave.collegeName)
          .catch(err => console.warn('[Leaderboard] Sync laddus error:', err));
        audioManager.playSound('laddu_collect');
        return nextSave;
      }
      return prev;
    });

    return (
      computedResult || {
        awarded: false,
        amount: 0,
        newTotal: saveData.ladduCount,
        isDuplicate: true,
        levelId: targetLevel,
        unlockedLevelId: null,
        message: 'Duplicate reward prevented.',
      }
    );
  }, [activeLevel, saveData.ladduCount]);

  const completeLevel = useCallback((
    _score?: number,
    laddusGained: number = LADDUS_PER_LEVEL,
    calculation?: LevelRewardCalculation,
    targetState: GameState = GameState.LEVEL_COMPLETE
  ) => {
    // Duplicate reward protection: A single attempt awards its reward exactly once.
    const attemptKey = `${activeLevel}_${levelAttemptId}`;
    if (rewardedAttemptsRef.current.has(attemptKey)) {
      console.warn(`[RewardSystem] Duplicate completion event blocked for attempt: ${attemptKey}`);
      return;
    }
    rewardedAttemptsRef.current.add(attemptKey);

    setJustCompletedLevel(activeLevel);
    if (calculation) {
      setLastCompletionCalculation(calculation);
    }

    setSaveData(prev => {
      const awardAmount = calculation ? calculation.earnedLaddus : laddusGained;
      const { nextSave, result } = RewardSystem.processLevelProgression(
        LEVEL_COMPLETED_SUCCESSFULLY,
        activeLevel,
        prev,
        calculation,
        _score,
        awardAmount
      );
      if (activeLevel === LevelId.LEVEL_1) {
        nextSave.level1TaskCompleted = true;
        if (!nextSave.unlockedLevels.includes(LevelId.LEVEL_2)) {
          nextSave.unlockedLevels = [...nextSave.unlockedLevels, LevelId.LEVEL_2];
        }
      } else if (activeLevel === LevelId.LEVEL_2) {
        nextSave.level2TaskCompleted = true;
        if (!nextSave.unlockedLevels.includes(LevelId.LEVEL_3)) {
          nextSave.unlockedLevels = [...nextSave.unlockedLevels, LevelId.LEVEL_3];
        }
      } else if (activeLevel === LevelId.LEVEL_3) {
        nextSave.level3TaskCompleted = true;
      }
      setLastRewardResult(result);
      SaveSystem.saveGame(nextSave);

      // Auto-update leaderboard with this run ONLY on successful completion
      const timeStr = calculation?.formattedTime || '02:30';
      const actualScore = calculation?.score ?? (_score ?? (nextSave.ladduCount * 100 + nextSave.completedLevels.length * 500));
      const earned = calculation?.earnedLaddus ?? laddusGained;

      leaderboardService.saveScore({
        playerName: nextSave.playerName || 'Ramu',
        collegeName: nextSave.collegeName || '',
        level: activeLevel === LevelId.LEVEL_3 ? 3 : activeLevel === LevelId.LEVEL_2 ? 2 : 1,
        levelsCompleted: nextSave.completedLevels.length,
        completionTime: timeStr,
        laddusEarned: earned,
        laddus: nextSave.ladduCount,
        totalLaddus: nextSave.ladduCount,
        score: actualScore,
      }).catch(err => console.warn('[Leaderboard] Auto-save error:', err));

      return nextSave;
    });

    setCurrentState(targetState);
    if (targetState === GameState.LEVEL_COMPLETE) {
      audioManager.playSound('level_complete');
    }
  }, [activeLevel, levelAttemptId]);

  const skipLevel = useCallback((levelId: LevelId = activeLevel) => {
    // 1. Duplicate reward protection: register attempt as processed so no delayed engine callback can award rewards
    const attemptKey = `${levelId}_${levelAttemptId}`;
    rewardedAttemptsRef.current.add(attemptKey);

    // 2. Clear any reward calculations and celebratory flags
    setJustCompletedLevel(null);
    setLastCompletionCalculation(null);

    // 3. Process authoritative progression with LEVEL_SKIPPED (0 laddus, no score increase, no completion mark)
    setSaveData(prev => {
      const { nextSave, result } = RewardSystem.processLevelProgression(
        LEVEL_SKIPPED,
        levelId,
        prev
      );
      setLastRewardResult(result);
      SaveSystem.saveGame(nextSave);
      return nextSave;
    });

    // 4. Continue to the appropriate next progression:
    // Seamlessly transitions back to Journey Map (LEVEL_MAP) where next stage is unlocked
    setCurrentState(GameState.LEVEL_MAP);
    audioManager.playSound('button_tap');
  }, [activeLevel, levelAttemptId]);

  const pauseGame = useCallback(() => {
    if (currentState === GameState.PLAYING) {
      setCurrentState(GameState.PAUSED);
      audioManager.playSound('pause');
    }
  }, [currentState]);

  const resumeGame = useCallback(() => {
    if (currentState === GameState.PAUSED) {
      setCurrentState(GameState.PLAYING);
      audioManager.playSound('resume');
    }
  }, [currentState]);

  const restartLevel = useCallback(() => {
    setLevelAttemptId(prev => prev + 1);
    setCurrentState(GameState.PLAYING);
    audioManager.playSound('button_tap');
  }, []);

  const returnToMenu = useCallback(() => {
    setCurrentState(GameState.MAIN_MENU);
    audioManager.playSound('button_tap');
  }, []);

  const resetProgress = useCallback(() => {
    const fresh = SaveSystem.resetGame();
    setSaveData(fresh);
    setActiveLevel(LevelId.LEVEL_1);
    setLevelAttemptId(prev => prev + 1);
    setJustCompletedLevel(null);
    setCurrentState(GameState.MAIN_MENU);
    audioManager.playSound('button_tap');
  }, []);

  const restartGame = useCallback((startPlaying: boolean = true) => {
    const currentName = saveData.playerName;
    const currentCollege = saveData.collegeName || '';
    const currentSound = saveData.soundEnabled;
    const fresh = SaveSystem.restartGameKeepProfile(currentName, currentSound, currentCollege, saveData.playerId);
    setSaveData(fresh);
    leaderboardService.syncLaddus(0, currentName, currentCollege)
      .catch(err => console.warn('[Leaderboard] Restart sync error:', err));
    setActiveLevel(LevelId.LEVEL_1);
    setLevelAttemptId(prev => prev + 1);
    setJustCompletedLevel(null);
    if (startPlaying) {
      setCurrentState(GameState.PLAYING);
    } else {
      setCurrentState(GameState.MAIN_MENU);
    }
    audioManager.playSound('button_tap');
  }, [saveData.playerName, saveData.collegeName, saveData.soundEnabled, saveData.playerId]);

  return (
    <GameStateContext.Provider
      value={{
        currentState,
        activeLevel,
        levelAttemptId,
        saveData,
        playerId: saveData.playerId,
        playerName: saveData.playerName,
        collegeName: saveData.collegeName || '',
        ladduCount: saveData.ladduCount,
        soundEnabled: saveData.soundEnabled,
        lastRewardResult,
        lastCompletionCalculation,
        justCompletedLevel,
        setJustCompletedLevel,
        setActiveLevel: updateActiveLevel,
        setGameState,
        startLevel,
        completeLevel,
        skipLevel,
        awardLaddus,
        setPlayerName,
        setCollegeName,
        setPlayerProfile,
        toggleSound,
        addLaddus,
        pauseGame,
        resumeGame,
        restartLevel,
        returnToMenu,
        resetProgress,
        restartGame,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = (): GameStateContextValue => {
  const ctx = useContext(GameStateContext);
  if (!ctx) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return ctx;
};
