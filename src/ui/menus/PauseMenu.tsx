/**
 * THE KATHA - Pause Menu Overlay
 * Pauses 3D physics and provides quick navigation options.
 */

import React, { useState, useEffect } from 'react';
import { useGameState } from '../../core/state/GameStateContext';
import { audioManager } from '../../core/audio/AudioManager';
import { adaptiveGraphics, GraphicsProfileTier } from '../../core/graphics/AdaptiveGraphicsManager';
import { Play, RotateCcw, Home, Volume2, VolumeX, Sparkles } from 'lucide-react';

export const PauseMenu: React.FC = () => {
  const { resumeGame, restartLevel, returnToMenu, soundEnabled, toggleSound, activeLevel } = useGameState();
  const [profileTier, setProfileTier] = useState<GraphicsProfileTier>(adaptiveGraphics.getConfig().tier);
  const [isManual, setIsManual] = useState<boolean>(adaptiveGraphics.isManualOverride());

  useEffect(() => {
    return adaptiveGraphics.subscribe((config) => {
      setProfileTier(config.tier);
      setIsManual(adaptiveGraphics.isManualOverride());
    });
  }, []);

  const cycleGraphicsProfile = () => {
    if (!isManual) {
      // Switch to manual Quality
      adaptiveGraphics.setProfile('QUALITY');
    } else if (profileTier === 'QUALITY') {
      adaptiveGraphics.setProfile('BALANCED');
    } else if (profileTier === 'BALANCED') {
      adaptiveGraphics.setProfile('PERFORMANCE');
    } else {
      // Revert to automatic
      adaptiveGraphics.setAuto();
    }
  };

  const getProfileLabel = () => {
    const tierName = profileTier.charAt(0) + profileTier.slice(1).toLowerCase();
    return isManual ? `Graphics: ${tierName}` : `Graphics: Auto (${tierName})`;
  };

  return (
    <div
      id="pause-menu-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-sm bg-stone-900/95 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl text-center text-amber-50">
        <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
          Game Paused
        </span>
        <h3 className="text-2xl font-black font-cinzel text-amber-200 mt-1 mb-1">
          {activeLevel.replace('_', ' ')}
        </h3>
        <p className="text-xs text-stone-400 mb-6">Rangastalam Village • Foundation Mode</p>

        <div className="flex flex-col gap-3">
          {/* Resume */}
          <button
            id="pause-resume-btn"
            type="button"
            onClick={resumeGame}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold text-base shadow-lg transition-transform active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Resume Adventure</span>
          </button>

          {/* Restart */}
          <button
            id="pause-restart-btn"
            type="button"
            onClick={restartLevel}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-200 font-semibold text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Stage</span>
          </button>

          {/* Sound Toggle */}
          <button
            id="pause-sound-btn"
            type="button"
            onClick={toggleSound}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-200 font-semibold text-sm transition-all"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Audio: Enabled' : 'Audio: Muted'}</span>
          </button>

          {/* Adaptive Graphics Profile Toggle */}
          <button
            id="pause-graphics-btn"
            type="button"
            onClick={cycleGraphicsProfile}
            title="Tap to cycle between Auto, Quality, Balanced, and Performance rendering modes"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-300 font-semibold text-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{getProfileLabel()}</span>
          </button>

          {/* Return to Main Menu */}
          <button
            id="pause-menu-btn"
            type="button"
            onClick={returnToMenu}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 hover:text-amber-300 font-semibold text-sm transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
