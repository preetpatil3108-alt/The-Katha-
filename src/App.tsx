/**
 * THE KATHA - Browser-based 3D Adventure Game
 * College competition project based on Vinayaka Chavithi / Ganesh Chaturthi
 * Millennials Youth Association - Rangastalam
 *
 * Technical Foundation Root Router
 */

import React, { useState } from 'react';
import { GameStateProvider, useGameState } from './core/state/GameStateContext';
import { GameState, LevelId } from './types/game';
import { IntroScreen } from './ui/menus/IntroScreen';
import { NameInputScreen } from './ui/menus/NameInputScreen';
import { MainMenu } from './ui/menus/MainMenu';
import { StoryVideo } from './ui/story/StoryVideo';
import { LevelMapScreen } from './ui/menus/LevelMapScreen';
import { GameCanvas } from './engine/scene/GameCanvas';
import { PauseMenu } from './ui/menus/PauseMenu';
import { LevelCompleteScreen } from './ui/menus/LevelCompleteScreen';
import { GameEndingScreen } from './ui/menus/GameEndingScreen';
import { OrientationWarning } from './ui/components/OrientationWarning';

const GameRouter: React.FC = () => {
  const { currentState, setGameState, startLevel, activeLevel, levelAttemptId } = useGameState();
  const [storyReturnState, setStoryReturnState] = useState<GameState>(GameState.MAIN_MENU);

  const openStoryOverlay = (returnTo: GameState = GameState.MAIN_MENU) => {
    setStoryReturnState(returnTo);
    setGameState(GameState.STORY);
  };

  return (
    <div className="relative w-screen h-screen bg-stone-950 flex items-center justify-center overflow-hidden font-sans text-stone-100 select-none">
      {/* Mobile Orientation Reminder */}
      <OrientationWarning />

      {/* 1. Opening Experience */}
      {currentState === GameState.INTRO && <IntroScreen />}

      {/* 2. Player Name Input -> Directly to Main Menu */}
      {currentState === GameState.NAME_INPUT && (
        <NameInputScreen onNext={() => setGameState(GameState.MAIN_MENU)} />
      )}

      {/* 3. Main Menu (True 3D Mushak environment) */}
      {currentState === GameState.MAIN_MENU && (
        <MainMenu onWatchStory={() => openStoryOverlay(GameState.MAIN_MENU)} />
      )}

      {/* 5. Watch Story Cinematic Overlay */}
      {currentState === GameState.STORY && (
        <StoryVideo
          onStartGame={() => setGameState(GameState.LEVEL_MAP)}
          onBack={() => setGameState(storyReturnState)}
        />
      )}

      {/* 6. Level Map (Stages Registry) */}
      {currentState === GameState.LEVEL_MAP && <LevelMapScreen />}

      {/* 7. 3D Gameplay & Stage Overlays (includes Game Ending overlay over active world) */}
      {(currentState === GameState.PLAYING ||
        currentState === GameState.PAUSED ||
        currentState === GameState.LEVEL_COMPLETE ||
        currentState === GameState.GAME_ENDING) && (
        <>
          <GameCanvas key={activeLevel} />
          {currentState === GameState.PAUSED && <PauseMenu />}
          {currentState === GameState.LEVEL_COMPLETE && <LevelCompleteScreen />}
          {currentState === GameState.GAME_ENDING && (
            <GameEndingScreen
              onCompleteToMainMenu={() => setGameState(GameState.MAIN_MENU)}
              onExploreWorld={() => setGameState(GameState.PLAYING)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default function App() {
  return (
    <GameStateProvider>
      <GameRouter />
    </GameStateProvider>
  );
}
