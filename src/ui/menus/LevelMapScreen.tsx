/**
 * THE KATHA - 3D Katha Journey Map Screen
 * 
 * Replaces the old 10-level 2D map with a 3D environment:
 * 🌿 Level 1 — SIDDHAM
 * 🪔 Level 2 — UTSAVAM
 * 🌊 Level 3 — NIMAJJANAM
 * 
 * Features:
 * - 3D environment with 3 distinct lands connected by ceremonial pathways
 * - High-detail 3D Mushika with cartoon idle, path-running animations, and biceps flex
 * - Pinned 2D speech bubble rendered above Mushika's 3D head: "Are you ready?"
 * - Preserves player profile, laddu counts, audio, and stage selection
 */

import React, { useState } from 'react';
import { useGameState } from '../../core/state/GameStateContext';
import { LevelRegistry } from '../../core/levels/LevelRegistry';
import { GameState, LevelId } from '../../types/game';
import { audioManager } from '../../core/audio/AudioManager';
import { PlayerProfileModal } from './PlayerProfileModal';
import { JourneyMap3DScene } from './JourneyMap3DScene';
import { UnifiedScoreboard } from '../hud/UnifiedScoreboard';
import {
  ArrowLeft,
  Sparkles,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const LevelMapScreen: React.FC = () => {
  const {
    saveData,
    activeLevel,
    setActiveLevel,
    playerName,
    ladduCount,
    startLevel,
    setGameState,
    justCompletedLevel,
    setJustCompletedLevel,
    soundEnabled,
    toggleSound,
  } = useGameState();

  const unlockedList = saveData.unlockedLevels || [LevelId.LEVEL_1];
  const completedList = saveData.completedLevels || [];

  const [showProfileModal, setShowProfileModal] = useState(false);

  // Launch playable stage
  const handlePlayLevel = (levelId: LevelId) => {
    const isUnlocked = unlockedList.includes(levelId);
    if (!isUnlocked) {
      audioManager.playSound('button_tap');
      return;
    }
    audioManager.playSound('button_tap');
    startLevel(levelId);
  };

  return (
    <div
      id="level-map-screen"
      className="relative w-full h-full bg-stone-950 flex flex-col text-amber-50 select-none overflow-hidden"
    >
      {/* ================= HEADER BAR ================= */}
      <header className="relative z-30 flex items-center justify-between px-4 py-3 md:px-6 md:py-3.5 border-b border-amber-500/30 bg-stone-950/90 backdrop-blur-md shrink-0">
        {/* Back Button to Main Menu */}
        <button
          id="level-map-back-btn"
          type="button"
          onClick={() => {
            audioManager.playSound('button_tap');
            setGameState(GameState.MAIN_MENU);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/30 text-amber-300 text-xs md:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Main Menu</span>
        </button>

        {/* Center Title */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 text-[10px] md:text-xs uppercase tracking-widest text-amber-400 font-extrabold">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>3D Katha Journey • 3 Sacred Lands</span>
            <Sparkles className="w-3 h-3 text-amber-400" />
          </div>
          <h1 className="text-base md:text-xl font-black font-cinzel text-amber-100 tracking-wide leading-tight">
            🌿 Siddham • 🪔 Utsavam • 🌊 Nimajjanam
          </h1>
        </div>

        {/* Top-Right Controls: Scoreboard, Sound & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Unified Game Scoreboard */}
          <UnifiedScoreboard
            totalLaddus={ladduCount}
            compact={true}
            id="level-map-scoreboard"
          />

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="p-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/40 text-amber-300 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>

          {/* Profile Modal Button */}
          <button
            id="level-map-profile-btn"
            type="button"
            onClick={() => {
              audioManager.playSound('button_tap');
              setShowProfileModal(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/50 text-amber-100 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-stone-950 text-xs font-black">
              {playerName ? playerName.charAt(0).toUpperCase() : 'R'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[10px] text-amber-300 font-bold leading-none">
                {playerName || 'Ramu'}
              </div>
              <div className="text-[11px] font-semibold text-stone-300">
                MYA Rangastalam
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* ================= 3D KATHA JOURNEY CANVAS ================= */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <JourneyMap3DScene
          unlockedLevels={unlockedList}
          completedLevels={completedList}
          justCompletedLevel={justCompletedLevel}
          onClearJustCompleted={() => setJustCompletedLevel(null)}
          currentLevelId={saveData.currentLevel || activeLevel || LevelId.LEVEL_1}
          onSetCurrentLevel={setActiveLevel}
          selectedLevelId={activeLevel}
          onSelectLevel={setActiveLevel}
          onPlayLevel={handlePlayLevel}
        />
      </div>

      {/* Player Profile Modal */}
      {showProfileModal && (
        <PlayerProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
};
