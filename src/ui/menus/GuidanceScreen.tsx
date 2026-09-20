/**
 * THE KATHA - Mushak Guidance Screen
 * Appears after player name entry.
 * Mushak asks: "Would you like to hear the story before we begin?"
 * Offers: WATCH STORY / PLAY GAME
 * Does not force the story.
 */

import React from 'react';
import { useGameState } from '../../core/state/GameStateContext';
import { audioManager } from '../../core/audio/AudioManager';
import { LevelId } from '../../types/game';
import { Play, Film, Sparkles, Home } from 'lucide-react';

interface GuidanceScreenProps {
  onWatchStory: () => void;
  onPlayGame: () => void;
  onGoToMenu: () => void;
}

export const GuidanceScreen: React.FC<GuidanceScreenProps> = ({
  onWatchStory,
  onPlayGame,
  onGoToMenu,
}) => {
  const { playerName } = useGameState();

  const handleWatchStory = () => {
    audioManager.playSound('button_tap');
    onWatchStory();
  };

  const handlePlayGame = () => {
    audioManager.playSound('button_tap');
    onPlayGame();
  };

  return (
    <div
      id="guidance-screen"
      className="relative w-full h-full bg-stone-950 flex flex-col items-center justify-center p-4 overflow-hidden select-none"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-radial from-amber-950/40 via-stone-950 to-stone-950 pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center">
        {/* Mushak Cartoon Vector Guide Graphic */}
        <div className="relative mb-4 flex flex-col items-center">
          {/* Speech Bubble with exact prompt text */}
          <div className="mb-3 px-5 py-3 rounded-2xl bg-amber-100 border-2 border-amber-400 text-stone-950 shadow-xl max-w-sm animate-fade-in">
            <p className="text-xs uppercase font-extrabold text-amber-800 tracking-wider mb-0.5">
              Mushak the Guide
            </p>
            <p className="text-sm md:text-base font-bold leading-snug text-stone-900">
              &ldquo;Hello, {playerName || 'friend'}! Would you like to hear the story before we begin?&rdquo;
            </p>
            {/* Bubble Tail */}
            <div className="w-3 h-3 bg-amber-100 rotate-45 mx-auto -mb-4 mt-2 border-r-2 border-b-2 border-amber-400" />
          </div>

          {/* Interactive Cute Grey Cartoon Mouse */}
          <div
            onClick={() => audioManager.playSound('mushak_squeak')}
            className="w-24 h-24 cursor-pointer hover:scale-105 transition-transform"
            title="Mushak - Tap me!"
          >
            <svg width="96" height="96" viewBox="0 0 100 100" className="overflow-visible filter drop-shadow-lg">
              {/* Tail */}
              <path
                d="M 28 72 C 12 76, 5 62, 10 50 C 14 42, 22 45, 18 52"
                fill="none"
                stroke="#d6d3d1"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Grey Body */}
              <ellipse cx="50" cy="62" rx="26" ry="22" fill="#78716c" />
              {/* Soft Cream Chest */}
              <ellipse cx="60" cy="64" rx="14" ry="16" fill="#f5f5f4" />
              {/* Ears */}
              <circle cx="36" cy="30" r="14" fill="#78716c" />
              <circle cx="36" cy="30" r="8.5" fill="#fbcfe8" />
              <circle cx="62" cy="28" r="15" fill="#78716c" />
              <circle cx="62" cy="28" r="9.5" fill="#fbcfe8" />
              {/* Head */}
              <ellipse cx="55" cy="46" rx="19" ry="17" fill="#78716c" />
              {/* Snout */}
              <path d="M 62 44 Q 78 50 78 55 Q 68 59 58 56 Z" fill="#78716c" />
              <circle cx="78" cy="54" r="3.5" fill="#fb7185" />
              {/* Eye */}
              <ellipse cx="58" cy="42" rx="4.5" ry="5.5" fill="#09090b" />
              <circle cx="60" cy="40" r="1.5" fill="#ffffff" />
              {/* Whiskers */}
              <line x1="72" y1="53" x2="88" y2="49" stroke="#d6d3d1" strokeWidth="1.2" />
              <line x1="72" y1="56" x2="87" y2="60" stroke="#d6d3d1" strokeWidth="1.2" />
              {/* Sacred Red Bell Collar */}
              <path d="M 44 56 Q 52 63 60 58" fill="none" stroke="#dc2626" strokeWidth="3" />
              <circle cx="53" cy="62" r="3.5" fill="#facc15" stroke="#b45309" strokeWidth="0.8" />
              {/* Paws */}
              <circle cx="68" cy="68" r="3.5" fill="#fbcfe8" />
              <circle cx="58" cy="72" r="3.5" fill="#fbcfe8" />
              <ellipse cx="38" cy="80" rx="8" ry="4.5" fill="#78716c" />
              <ellipse cx="52" cy="81" rx="8" ry="4.5" fill="#78716c" />
            </svg>
          </div>
        </div>

        {/* Action Choices Required by Prompt: WATCH STORY / PLAY GAME */}
        <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-md justify-center mt-2">
          {/* WATCH STORY Button */}
          <button
            id="guidance-watch-story-btn"
            type="button"
            onClick={handleWatchStory}
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-stone-900 hover:bg-stone-800 border-2 border-amber-500/50 text-amber-200 font-bold text-base shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Film className="w-5 h-5 text-amber-400" />
            <span>WATCH STORY</span>
          </button>

          {/* PLAY GAME Button */}
          <button
            id="guidance-play-game-btn"
            type="button"
            onClick={handlePlayGame}
            className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-base shadow-xl shadow-amber-950/60 transition-transform active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>PLAY GAME</span>
          </button>
        </div>

        {/* Skip option directly to Main Menu */}
        <button
          id="guidance-menu-btn"
          type="button"
          onClick={() => {
            audioManager.playSound('button_tap');
            onGoToMenu();
          }}
          className="mt-6 flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-300 font-medium transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Go directly to Main Menu</span>
        </button>
      </div>
    </div>
  );
};
