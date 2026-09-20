/**
 * THE KATHA - Level 2 (Utsavam) HUD & Dialogue Overlay
 *
 * Displays:
 * 1. Level 2 Timer: Starts immediately when Mandapam Organizer gives the task
 * 2. Active Quest Objective: "Bring Ayyagaru to the Mandapam"
 * 3. Distance & Navigation Tracker to current goal (Car -> City -> Ayyagaru -> Mandapam)
 * 4. Ayyagaru Passenger Status indicator
 * 5. Interactive Character Dialogue Bubble for Anand & Ayyagaru with Telugu subtitles
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Navigation, UserCheck, Sparkles, ChevronRight, Volume2, AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import { Level2State } from '../../engine/levels/Level2UtsavamSystem';

interface Level2UtsavamHudProps {
  state: Level2State;
  onDismissDialogue?: () => void;
  onPickupAyyagaru?: () => void;
  onAcknowledgeInstruction?: () => void;
}

export const Level2UtsavamHud: React.FC<Level2UtsavamHudProps> = ({
  state,
  onDismissDialogue,
  onPickupAyyagaru,
  onAcknowledgeInstruction,
}) => {
  // Auto-dismiss instruction after 6.5s if not acknowledged
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
    <div id="level2-utsavam-hud" className="pointer-events-none fixed inset-0 z-30">
      {/* REQUIRED CHANGE 1: Clear Instruction banner upon entering Level 2 */}
      <AnimatePresence>
        {state.introInstruction?.visible && (
          <motion.div
            key="level2-intro-instruction"
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.95 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-auto z-40"
          >
            <div
              id="level2-intro-instruction-card"
              className="bg-stone-950/95 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md text-center overflow-hidden relative"
            >
              {/* Caution pattern accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500" />

              <div className="flex items-center justify-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-mono font-black uppercase tracking-widest">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  LEVEL 2 • GAMEPLAY RULE
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-amber-100 font-serif tracking-tight mt-1 mb-1">
                Avoid Crashing Into Vehicles
              </h2>

              <p className="text-xs sm:text-sm text-amber-200/90 font-sans leading-relaxed mb-3">
                A crash will restart the level. Drive safely along the highway to bring Ayyagaru to the Mandapam!
              </p>

              <button
                id="btn-acknowledge-level2-rule"
                onClick={onAcknowledgeInstruction}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-98 cursor-pointer"
              >
                <Check className="w-4 h-4 text-stone-950 stroke-[3]" />
                <span>Understood [OK]</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REQUIRED CHANGE 2: High-visibility Vehicle Crash & Restart Banner */}
      <AnimatePresence>
        {state.crashAlert && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-none z-50">
            <motion.div
              id="level2-crash-notification-card"
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -15 }}
              className="bg-red-950/95 border-2 border-red-500/90 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-center text-red-100"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                <span className="font-mono font-black text-xs tracking-widest text-red-300 uppercase">
                  COLLISION DETECTED
                </span>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Level 2 Restarting!
              </h3>
              <p className="text-xs text-red-200/90 mt-0.5 font-sans">
                Ramu and the vehicle are returning to the village entrance with a fresh timer.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Center Status Panel: Level 2 Timer & Active Task */}
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
              L-2 UTSAVAM
            </span>
          </div>

          {/* Active Stopwatch Timer (Starts ONLY when task is given!) */}
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
                    Ayyagaru Onboard
                  </span>
                )}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Mushika's Dynamic Guidance Hint */}
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

      {/* Floating Interactive Dialogue Box (Anand / Ayyagaru) positioned in upper vista to never cover driving controls */}
      <AnimatePresence>
        {state.activeDialogue && (
          <div className="absolute top-18 sm:top-22 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 pointer-events-auto z-40">
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              onClick={onDismissDialogue}
              className="bg-stone-950/95 border border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden cursor-pointer"
            >
              {/* Top Accent Gradient Bar */}
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
                  id="btn-dismiss-dialogue"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismissDialogue?.();
                  }}
                  className="text-stone-400 hover:text-amber-200 transition-colors text-xs font-mono px-2.5 py-1 rounded-md bg-stone-900 border border-stone-800"
                >
                  Close [E]
                </button>
              </div>

              {/* English Dialogue Text */}
              <p className="text-sm sm:text-base text-stone-100 font-medium leading-relaxed mb-2">
                “{state.activeDialogue.text}”
              </p>

              {/* Telugu Subtitle */}
              {state.activeDialogue.teluguText && (
                <p className="text-xs sm:text-sm text-amber-300/90 font-serif italic border-t border-stone-800/80 pt-2 leading-relaxed">
                  “{state.activeDialogue.teluguText}”
                </p>
              )}

              <div className="mt-3 flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800/40">
                <span className="flex items-center gap-1 text-amber-400/80">
                  <Volume2 className="w-3.5 h-3.5" />
                  Tap anywhere or press [E] to advance
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismissDialogue?.();
                  }}
                  className="flex items-center gap-1 font-semibold text-amber-300 hover:text-amber-200"
                >
                  Continue <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interaction Prompt: PICK UP AYYAGARU (Visible when Ramu approaches outside Ayyagaru's house) */}
      <AnimatePresence>
        {state.canPickupAyyagaru && !state.hasAyyagaruInCar && !state.activeDialogue && (
          <div className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 pointer-events-auto">
            <motion.button
              id="btn-pickup-ayyagaru"
              type="button"
              initial={{ scale: 0.85, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 15 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPickupAyyagaru}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 font-black text-sm sm:text-base tracking-wider shadow-2xl border-2 border-amber-300 flex items-center gap-2.5 cursor-pointer uppercase select-none animate-pulse hover:animate-none"
            >
              <Sparkles className="w-5 h-5 text-stone-950" />
              <span>PICK UP AYYAGARU [E]</span>
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
