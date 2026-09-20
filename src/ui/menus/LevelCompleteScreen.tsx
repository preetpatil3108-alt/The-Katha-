/**
 * THE KATHA - Level Complete Screen
 * Hosts the satisfying Laddu Reward Animation, progression unlock notification,
 * and navigation back to the journey map or next stage.
 */

import React from 'react';
import { LadduRewardAnimation } from '../rewards/LadduRewardAnimation';
import { useGameState } from '../../core/state/GameStateContext';
import { GameState, LevelId } from '../../types/game';
import { LevelRegistry } from '../../core/levels/LevelRegistry';

export const LevelCompleteScreen: React.FC = () => {
  const { activeLevel, setGameState, startLevel } = useGameState();
  const nextLevelId = LevelRegistry.getNextLevel(activeLevel);

  React.useEffect(() => {
    // Level 3 has its own dedicated Scoreboard and 3-stage Game Ending flow
    if (activeLevel === LevelId.LEVEL_3) {
      setGameState(GameState.GAME_ENDING);
    }
  }, [activeLevel, setGameState]);

  if (activeLevel === LevelId.LEVEL_3) {
    return null;
  }

  return (
    <div id="level-complete-screen">
      <LadduRewardAnimation
        onContinueToMap={() => setGameState(GameState.LEVEL_MAP)}
        onNextLevel={() => {
          if (nextLevelId) {
            startLevel(nextLevelId);
          } else {
            setGameState(GameState.LEVEL_MAP);
          }
        }}
        onReplay={() => startLevel(activeLevel)}
      />
    </div>
  );
};
