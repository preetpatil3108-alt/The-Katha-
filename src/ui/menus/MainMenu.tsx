/**
 * THE KATHA - Main Menu
 * Meets exact prompt requirements:
 * - Main title: THE KATHA
 * - Center: PLAY GAME (exciting sound confirmation)
 * - Other buttons: WATCH STORY, LEADERBOARD
 * - Top-right: PLAYER PROFILE (player name, laddu count: initially 0 LADDUS)
 * - MUSHAK: Grey cartoon mouse guide moving playfully, moving to a corner to eat cheese (idle animation).
 *   Mushak never controls Ramu.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameState } from '../../core/state/GameStateContext';
import { GameState, LevelId } from '../../types/game';
import { audioManager } from '../../core/audio/AudioManager';
import { SaveSystem } from '../../core/save/SaveSystem';
import { Play, Film, Trophy, User, Sparkles, RotateCcw, X } from 'lucide-react';
import { LeaderboardModal } from './LeaderboardModal';
import { PlayerProfileModal } from './PlayerProfileModal';
import { Mushak3DMenuScene } from './Mushak3DMenuScene';

interface MainMenuProps {
  onWatchStory?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onWatchStory }) => {
  const {
    playerName,
    ladduCount,
    startLevel,
    setGameState,
    restartGame,
  } = useGameState();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  // Start calm background music when Main Menu opens
  React.useEffect(() => {
    try {
      audioManager.startAmbientBgm();
    } catch (e) {
      console.warn('[MainMenu] Audio autoplay deferred:', e);
    }
  }, []);

  // PLAY GAME handler: ALWAYS opens the 3D Journey Map first
  const handlePlayGame = () => {
    audioManager.playSound('button_tap');
    setGameState(GameState.LEVEL_MAP);
  };

  const handleConfirmRestart = () => {
    audioManager.playSound('button_tap');
    setShowRestartConfirm(false);
    // Score becomes 0, Level progression resets, Level 1 starting level, L2 & L3 locked, tasks reset, same name
    restartGame(false);
    setGameState(GameState.LEVEL_MAP);
  };

  const handleCancelRestart = () => {
    audioManager.playSound('button_tap');
    setShowRestartConfirm(false);
  };

  const handleWatchStory = () => {
    audioManager.playSound('button_tap');
    if (onWatchStory) {
      onWatchStory();
    } else {
      setGameState(GameState.STORY);
    }
  };

  const handleOpenLeaderboard = () => {
    audioManager.playSound('button_tap');
    setShowLeaderboard(true);
  };

  const handleOpenProfile = () => {
    audioManager.playSound('button_tap');
    setShowProfile(true);
  };

  return (
    <div
      id="main-menu-screen"
      className="relative w-full h-full bg-stone-950 flex flex-col justify-between p-4 md:p-6 overflow-hidden select-none"
    >
      {/* Background Soft Radiant Ambience */}
      <div className="absolute inset-0 bg-radial from-amber-950/30 via-stone-950 to-stone-950 pointer-events-none" />

      {/* True 3D Mushak & Cheese Scene living in Main Menu environment */}
      <Mushak3DMenuScene />

      {/* Decorative subtle border frames */}
      <div className="absolute top-2 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none" />
      <div className="absolute bottom-2 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none" />

      {/* TOP BAR: Association Tag (Left) and PLAYER PROFILE (Top-Right) */}
      <div className="relative z-20 flex items-center justify-between w-full max-w-5xl mx-auto">
        {/* Left: Village & Association Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/80 border border-amber-500/30 text-amber-300 text-[11px] font-semibold tracking-wide backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Millennials Youth Association •</span>
          <span>Rangastalam</span>
        </div>

        {/* Top-Right: PLAYER PROFILE Button */}
        <button
          id="player-profile-btn"
          type="button"
          onClick={handleOpenProfile}
          className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/40 text-amber-100 shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          title="View Player Profile"
        >
          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs font-bold text-amber-200">{playerName || 'Hero'}</div>
            <div className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
              {ladduCount} {ladduCount === 1 ? 'LADDU' : 'LADDUS'}
            </div>
          </div>
        </button>
      </div>

      {/* CENTER: Main Title & Core Action Buttons */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center my-auto">
        {/* Main Title: THE KATHA with simple, premium typography */}
        <h1 className="text-5xl md:text-7xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-orange-300 tracking-[0.18em] mb-2 drop-shadow-md">
          THE KATHA
        </h1>
        <p className="text-xs md:text-sm text-amber-200/80 font-medium tracking-wide mb-8">
          Vinayaka Chavithi 3D Adventure • Rangastalam Village
        </p>

        {/* Center: PLAY GAME Button (Primary & Prominent) */}
        <div className="w-full max-w-xs flex flex-col items-center gap-3">
          <button
            id="menu-play-game-btn"
            type="button"
            onClick={handlePlayGame}
            className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-lg shadow-xl shadow-amber-950/60 transition-transform active:scale-95 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>PLAY GAME</span>
          </button>

          {/* Other buttons: WATCH STORY & LEADERBOARD */}
          <div className="flex gap-2.5 w-full">
            {/* WATCH STORY */}
            <button
              id="menu-watch-story-btn"
              type="button"
              onClick={handleWatchStory}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/40 text-amber-200 font-bold text-xs md:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Film className="w-4 h-4 text-amber-400" />
              <span>WATCH STORY</span>
            </button>

            {/* LEADERBOARD */}
            <button
              id="menu-leaderboard-btn"
              type="button"
              onClick={handleOpenLeaderboard}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/40 text-amber-200 font-bold text-xs md:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>LEADERBOARD</span>
            </button>
          </div>

          {/* RESTART GAME BUTTON (Visible when game has been completed) */}
          {SaveSystem.hasCompletedGame() && (
            <button
              id="menu-restart-game-btn"
              type="button"
              onClick={() => {
                audioManager.playSound('button_tap');
                setShowRestartConfirm(true);
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/40 hover:border-amber-400 text-amber-200 font-bold text-xs md:text-sm shadow-md transition-all active:scale-95 cursor-pointer mt-0.5"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>RESTART GAME</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom status indicator */}
      <div className="relative z-20 w-full max-w-5xl mx-auto flex items-center justify-between text-[11px] text-stone-500 font-medium px-2 pointer-events-none pb-2">
        <span className="hidden sm:inline">Vinayaka Chavithi 2026 • Cultural Adventure</span>
        <span className="text-amber-400/70 font-semibold ml-auto sm:ml-0 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Mushak 3D Guide Active</span>
        </span>
      </div>

      {/* Modals */}
      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
      {showProfile && <PlayerProfileModal onClose={() => setShowProfile(false)} />}

      {/* Restart Game Confirmation Dialog (After Game Completion) */}
      <AnimatePresence>
        {showRestartConfirm && (
          <div
            id="restart-game-confirm-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-sm p-6 sm:p-7 rounded-2xl bg-stone-900 border border-amber-500/40 text-center shadow-2xl shadow-stone-950"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 mx-auto mb-4">
                <RotateCcw className="w-6 h-6 text-amber-400" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-orange-300 tracking-wider mb-2">
                RESTART GAME
              </h2>

              <p className="text-sm text-stone-300 font-medium leading-relaxed mb-6">
                Start the journey again from the beginning?
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  id="restart-cancel-btn"
                  type="button"
                  onClick={handleCancelRestart}
                  className="flex-1 py-3 px-4 rounded-xl bg-stone-800/90 hover:bg-stone-700/90 border border-stone-600/50 text-stone-200 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  id="restart-confirm-btn"
                  type="button"
                  onClick={handleConfirmRestart}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-950/50 transition-all active:scale-95 cursor-pointer ring-1 ring-amber-300/60"
                >
                  RESTART
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
