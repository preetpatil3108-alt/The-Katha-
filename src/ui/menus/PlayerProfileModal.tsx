/**
 * THE KATHA - Player Profile Modal
 * 
 * Requirements:
 * Display:
 * - player name (e.g. Ramu)
 * - laddu count (e.g. 16 LADDUS)
 * - completed levels (e.g. 1 LEVEL COMPLETE)
 * 
 * Also displays:
 * - Millennials Youth Association • Rangastalam
 * - 10 stages overview with Unlocked/Locked/Completed status
 * - Sound control and progress reset
 */

import React, { useState } from 'react';
import { useGameState } from '../../core/state/GameStateContext';
import { LevelRegistry } from '../../core/levels/LevelRegistry';
import { audioManager } from '../../core/audio/AudioManager';
import { TOTAL_LEVELS } from '../../core/rewards/RewardSystem';
import {
  User,
  Volume2,
  VolumeX,
  X,
  MapPin,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface PlayerProfileModalProps {
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ onClose }) => {
  const {
    playerName,
    ladduCount,
    soundEnabled,
    toggleSound,
    saveData,
    resetProgress,
  } = useGameState();

  const [confirmReset, setConfirmReset] = useState(false);
  const completedCount = saveData.completedLevels ? saveData.completedLevels.length : 0;
  const allLevels = LevelRegistry.getAllLevels();

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetProgress();
    setConfirmReset(false);
    onClose();
  };

  return (
    <div
      id="player-profile-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-amber-50 select-none"
    >
      <div className="relative w-full max-w-md bg-stone-900 border-2 border-amber-500/50 rounded-3xl p-5 md:p-6 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold font-cinzel text-amber-200 uppercase tracking-wide block leading-none">
                Player Profile
              </span>
              <span className="text-[10px] text-stone-400">Millennials Youth Association</span>
            </div>
          </div>
          <button
            id="profile-close-btn"
            type="button"
            onClick={() => {
              audioManager.playSound('button_tap');
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-amber-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-4 pr-1">
          {/* Main Identity & Stats Card (Prominently displaying prompt format) */}
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-stone-950/90 border border-amber-500/30">
            {/* Avatar */}
            <div className="relative mb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 border-2 border-amber-200 flex items-center justify-center text-stone-950 shadow-lg font-black text-2xl">
                {playerName ? playerName.charAt(0).toUpperCase() : 'R'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-stone-900 border border-amber-400 flex items-center justify-center text-xs">
                🪔
              </div>
            </div>

            {/* 1. Player Name */}
            <h3 id="profile-player-name" className="text-xl md:text-2xl font-black text-amber-100 font-cinzel tracking-wide">
              {playerName || 'Ramu'}
            </h3>

            {/* College Name */}
            {saveData.collegeName && (
              <div id="profile-college-name" className="text-xs font-semibold text-amber-300 mt-0.5 tracking-wide">
                {saveData.collegeName}
              </div>
            )}

            {/* Village & Association */}
            <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-semibold mt-0.5">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>Village of Rangastalam</span>
            </div>

            {/* Prominent Stat Badges: LADDU COUNT & COMPLETED LEVELS */}
            <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
              {/* 2. Laddu Count */}
              <div className="px-3 py-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-center">
                <span className="block text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                  Offerings
                </span>
                <span id="profile-laddu-count" className="text-lg md:text-xl font-black text-amber-100 font-cinzel">
                  {ladduCount} {ladduCount === 1 ? 'LADDU' : 'LADDUS'}
                </span>
                <span className="block text-[9px] text-stone-400 font-medium mt-0.5">
                  Total Accumulated
                </span>
              </div>

              {/* 3. Completed Levels */}
              <div className="px-3 py-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-center">
                <span className="block text-[10px] uppercase tracking-wider text-emerald-300 font-bold">
                  Katha Progress
                </span>
                <span id="profile-completed-levels" className="text-lg md:text-xl font-black text-emerald-200 font-cinzel">
                  {completedCount} {completedCount === 1 ? 'LEVEL COMPLETE' : 'LEVELS COMPLETE'}
                </span>
                <span className="block text-[9px] text-stone-400 font-medium mt-0.5">
                  10 Stages in total
                </span>
              </div>
            </div>
          </div>

          {/* 10 STAGES PROGRESSION TRACKER */}
          <div className="bg-stone-950/60 border border-amber-500/20 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>10 Sacred Stages (Levels 0–9)</span>
              </span>
              <span className="text-[11px] font-bold text-amber-200">
                {Math.round((completedCount / TOTAL_LEVELS) * 100)}%
              </span>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {allLevels.map((lvl) => {
                const isCompleted = (saveData.completedLevels || []).includes(lvl.id);
                const isUnlocked = (saveData.unlockedLevels || []).includes(lvl.id);

                return (
                  <div
                    key={lvl.id}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                      isCompleted
                        ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                        : isUnlocked
                        ? 'bg-amber-950/30 border border-amber-500/30 text-amber-200'
                        : 'bg-stone-900/60 border border-stone-800 text-stone-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isUnlocked ? (
                        <Play className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-stone-500 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-bold mr-1.5">{lvl.id.replace('_', ' ')}:</span>
                        <span className="text-[11px] font-medium opacity-90">{lvl.title}</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right font-mono text-[10px]">
                      {isCompleted ? (
                        <span className="text-emerald-400 font-bold">+16 Laddus</span>
                      ) : isUnlocked ? (
                        <span className="text-amber-300 font-semibold">Unlocked</span>
                      ) : (
                        <span className="text-stone-500">Locked</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sound Controls */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs font-semibold">
            <div className="flex items-center gap-2 text-stone-300">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-500" />
              )}
              <span>Sound Effects & Music</span>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                soundEnabled ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
              }`}
            >
              {soundEnabled ? 'ON' : 'MUTED'}
            </button>
          </div>

          {/* Reset Progress (For Testing & Fresh Starts) */}
          <div className="pt-1">
            {confirmReset ? (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 flex flex-col gap-2 text-center animate-fade-in">
                <span className="text-xs text-red-200 font-semibold">
                  Reset progression back to Level 0 (0 Laddus)?
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 py-1.5 rounded-lg bg-stone-800 text-stone-300 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-stone-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Save Data (Testing)</span>
              </button>
            )}
          </div>
        </div>

        {/* Association Footer */}
        <div className="text-center pt-3 border-t border-amber-500/20 text-[10px] text-stone-400 font-medium shrink-0 mt-2">
          Vinayaka Chavithi Celebration • Millennials Youth Association
        </div>
      </div>
    </div>
  );
};
