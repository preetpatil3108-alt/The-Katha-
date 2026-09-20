/**
 * THE KATHA - Opening Screen Wrapper
 * Integrates OpeningExperience with GameState transition to NAME_INPUT.
 */

import React from 'react';
import { useGameState } from '../../core/state/GameStateContext';
import { GameState } from '../../types/game';
import { OpeningExperience } from '../opening/OpeningExperience';

export const IntroScreen: React.FC = () => {
  const { setGameState } = useGameState();

  return (
    <OpeningExperience
      onContinue={() => {
        setGameState(GameState.NAME_INPUT);
      }}
    />
  );
};
