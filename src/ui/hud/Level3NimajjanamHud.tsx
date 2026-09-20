/**
 * THE KATHA - Level 3 (Nimajjanam) HUD & Dialogue Overlay
 *
 * Displays:
 * 1. Level 3 Timer: Active during the journey
 * 2. Active Quest Objective: "Take Ayyagaru to his home on Grand Avenue"
 * 3. Distance & Navigation Tracker to Ayyagaru's home
 * 4. Ayyagaru Passenger Status indicator
 * 5. Interactive Character Dialogue Bubble for Ayyagaru with Telugu subtitles
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Navigation, UserCheck, Sparkles, ChevronRight, AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import { Level3State } from '../../engine/levels/Level3NimajjanamSystem';

interface Level3NimajjanamHudProps {
  state: Level3State;
  onDismissDialogue?: () => void;
  onAcknowledgeInstruction?: () => void;
}

export const Level3NimajjanamHud: React.FC<Level3NimajjanamHudProps> = ({
  state,
  onDismissDialogue,
  onAcknowledgeInstruction,
}) => {
  // Auto-dismiss instruction after 6.5s if not clicked
  useEffect(() => {
    if (state.introInstruction?.visible) {
      const timer = setTimeout(() => {
        onAcknowledgeInstruction?.();
      }, 6500);
      return () => clearTimeout(timer);
    }
  }, [state.introInstruction?.visible, onAcknowledgeInstruction]);

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div id="level3-nimajjanam-hud" className="pointer-events-none fixed inset-0 z-30">
      {/* Intro Instruction banner upon entering Level 3 */}
      <AnimatePresence>
        {state.introInstruction?.visible && (
          <motion.div
            key="level3-intro-instruction"
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.95 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-auto z-40"
          >
            <div
              id="level3-intro-instruction-card"
              className="bg-stone-950/95 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md text-center overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500" />

              <div className="flex items-center justify-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-mono font-black uppercase tracking-widest">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  LEVEL 3 • NIMAJJANAM
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-amber-100 font-serif tracking-tight mt-1 mb-1">
                Escort Ayyagaru Safely Home
              </h2>

              <p className="text-xs sm:text-sm text-amber-200/90 font-sans leading-relaxed mb-3">
                The Nimajjanam prayers have concluded. Drive along Highway NH-65 to bring Ayyagaru safely back to his home on Grand Avenue!
              </p>

              <button
                id="btn-acknowledge-level3-rule"
                onClick={onAcknowledgeInstruction}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-98 cursor-pointer"
              >
                <Check className="w-4 h-4 text-stone-950 stroke-[3]" />
                <span>Begin Journey [OK]</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collision Alert Banner */}
      <AnimatePresence>
        {state.crashAlert && (
          <motion.div
            key="level3-crash-alert"
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-auto z-40"
          >
            <div className="bg-red-950/95 border-2 border-red-500 text-red-100 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 animate-bounce" />
              <div>
                <p className="font-bold text-sm">{state.crashAlert}</p>
                <p className="text-xs text-red-200/80">Vehicle position stabilized. Continue on Highway NH-65.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER: Timer, Objective & Distance Tracker */}
      <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-stone-950/90 border border-amber-500/50 rounded-2xl px-4 py-2 backdrop-blur-md shadow-2xl flex items-center gap-3.5 sm:gap-5"
        >
          {/* Level Badge */}
          <div className="flex items-center gap-1.5 border-r border-stone-800 pr-3 sm:pr-4">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[11px] sm:text-xs font-black tracking-wider uppercase text-amber-300 font-mono">
              L-3 NIMAJJANAM
            </span>
          </div>

          {/* Active Stopwatch Timer */}
          <div className="flex items-center gap-2 border-r border-stone-800 pr-3 sm:pr-4">
            <Clock
              className={`w-4 h-4 ${
                state.isTimerActive ? 'text-amber-400 animate-pulse' : 'text-stone-500'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-stone-400 font-medium">
                {state.isTimerActive ? 'Active Timer' : 'Task Pending'}
              </span>
              <span
                className={`font-mono font-bold text-sm sm:text-base tracking-tight ${
                  state.isTimerActive ? 'text-amber-200' : 'text-stone-400'
                }`}
              >
                {formatTimer(state.timerSeconds)}
              </span>
            </div>
          </div>

          {/* Objective & Distance */}
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-orange-400 animate-bounce" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-stone-400 font-medium">
                Target: {state.goalName}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-stone-100 flex items-center gap-1.5">
                <span>{state.distanceToGoal}m</span>
                {state.hasAyyagaruInCar && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-600/40">
                    <UserCheck className="w-3 h-3" />
                    Ayyagaru Accompanying
                  </span>
                )}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Mushika's Guidance Hint */}
        {state.mushikaInstruction && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-stone-900/85 border border-amber-500/30 rounded-full px-3.5 py-1 text-[11px] sm:text-xs text-amber-200/90 backdrop-blur-sm flex items-center gap-2 shadow-lg max-w-[90vw] text-center truncate"
          >
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">
              <strong className="text-amber-400">Mushika:</strong> {state.mushikaInstruction}
            </span>
          </motion.div>
        )}
      </div>

      {/* Dialogue Box for Ayyagaru */}
      <AnimatePresence>
        {state.activeDialogue && (
          <motion.div
            key="level3-active-dialogue"
            initial={{ opacity: 0, y: -15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute top-18 sm:top-22 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 pointer-events-auto z-40"
          >
            <div
              onClick={onDismissDialogue}
              className="bg-stone-950/95 border border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-amber-200 flex items-center gap-2">
                    {state.activeDialogue.speaker}
                    <span className="text-[10px] font-normal uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/40 text-amber-400">
                      {state.activeDialogue.role}
                    </span>
                  </h3>
                </div>

                <button
                  id="btn-dismiss-level3-dialogue"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismissDialogue?.();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-700 text-[10px] font-bold text-stone-300 hover:text-stone-100 flex items-center gap-1 cursor-pointer"
                >
                  <span>CONTINUE</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* English Dialogue */}
              <p className="text-sm sm:text-base text-stone-100 font-medium leading-relaxed mb-2.5">
                "{state.activeDialogue.text}"
              </p>

              {/* Telugu Subtitle */}
              {state.activeDialogue.teluguText && (
                <div className="border-t border-stone-800/80 pt-2 text-xs sm:text-sm text-amber-300/85 font-sans leading-relaxed italic">
                  "{state.activeDialogue.teluguText}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
