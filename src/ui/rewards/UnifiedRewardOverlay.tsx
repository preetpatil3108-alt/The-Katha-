/**
 * THE KATHA - Unified Laddu Reward Overlay
 *
 * The single, shared AAA reward presentation used across Level 1, Level 2, and Level 3:
 * 1. Laddu appears smoothly in the center
 * 2. Gentle scale-up / pop animation
 * 3. Subtle gentle rotation (stops after brief presentation, NO continuous looping)
 * 4. "+X LADDUS" appears cleanly with completion time & tier
 * 5. Reward flows into the unified scoreboard
 * 6. Score counter animates smoothly (e.g. 25 -> 30 -> 35 -> 40 -> 45)
 * 7. Animation completes and stays settled — ONE COMPLETION = ONE ANIMATION.
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock, Award, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { audioManager } from '../../core/audio/AudioManager';

export interface UnifiedRewardProps {
  levelNumber: number;
  levelTitle: string;
  completionTime: string;
  earnedLaddus: number;
  score: number;
  tier?: 'GOLD' | 'SILVER' | 'BRONZE';
  formulaDescription?: string;
  previousTotalLaddus: number;
  newTotalLaddus: number;
  onContinue: () => void;
  continueLabel?: string;
  autoAdvanceSeconds?: number;
}

export const UnifiedRewardOverlay: React.FC<UnifiedRewardProps> = ({
  levelNumber,
  levelTitle,
  completionTime,
  earnedLaddus,
  score,
  tier = 'GOLD',
  formulaDescription,
  previousTotalLaddus,
  newTotalLaddus,
  onContinue,
  continueLabel = 'Continue',
  autoAdvanceSeconds = 4.0,
}) => {
  // Animation phases:
  // 0: Laddu appears and pops
  // 1: Subtle gentle rotation & shimmer (brief, not looping)
  // 2: "+X LADDUS" reveal
  // 3: Laddu reward glides to top-right scoreboard
  // 4: Settled presentation with countdown & continue button
  const [animationPhase, setAnimationPhase] = useState<number>(0);
  const [displayedTotal, setDisplayedTotal] = useState<number>(previousTotalLaddus);
  const [hasLandedOnScoreboard, setHasLandedOnScoreboard] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(autoAdvanceSeconds);

  // Play animation sequence strictly ONCE
  const hasStartedRef = useRef<boolean>(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Phase 0 -> 1: Subtle tilt (400ms)
    const t1 = setTimeout(() => {
      setAnimationPhase(1);
      audioManager.playSound('laddu_collect');
    }, 400);

    // Phase 1 -> 2: Reveal "+X LADDUS" banner (900ms)
    const t2 = setTimeout(() => {
      setAnimationPhase(2);
    }, 900);

    // Phase 2 -> 3: Fly to scoreboard (1600ms)
    const t3 = setTimeout(() => {
      setAnimationPhase(3);
    }, 1600);

    // Phase 3 -> 4: Impact scoreboard and smoothly count up (2200ms)
    const t4 = setTimeout(() => {
      setAnimationPhase(4);
      setHasLandedOnScoreboard(true);
      audioManager.playSound('laddu_collect');

      // Animate displayed total smoothly from previousTotal to newTotal
      const diff = newTotalLaddus - previousTotalLaddus;
      if (diff > 0) {
        const stepDuration = Math.min(800, Math.max(300, diff * 35));
        const startTime = performance.now();
        const startVal = previousTotalLaddus;

        const updateCounter = (now: number) => {
          const progress = Math.min(1, (now - startTime) / stepDuration);
          const current = Math.round(startVal + diff * progress);
          setDisplayedTotal(current);
          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            setDisplayedTotal(newTotalLaddus);
          }
        };
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayedTotal(newTotalLaddus);
      }
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [previousTotalLaddus, newTotalLaddus]);

  // Auto-advance countdown timer (starts when settled phase 4 arrives, disabled if autoAdvanceSeconds <= 0)
  useEffect(() => {
    if (animationPhase < 4) return;
    if (autoAdvanceSeconds <= 0) return; // Explicitly requires user tap to continue

    const interval = 100;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = prev - 0.1;
        if (next <= 0) {
          clearInterval(timer);
          onContinue();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [animationPhase, autoAdvanceSeconds, onContinue]);

  // Keyboard shortcut listener: [E], [Space], [Enter] triggers continue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onContinue]);

  const progressPercent = Math.max(
    0,
    Math.min(100, (secondsRemaining / autoAdvanceSeconds) * 100)
  );

  return (
    <motion.div
      id="unified-reward-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md pointer-events-auto select-none"
    >
      {/* PERSISTENT TOP-RIGHT SCOREBOARD ANCHOR (Displays the authoritative current total) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-50 pointer-events-none">
        <motion.div
          animate={
            hasLandedOnScoreboard
              ? { scale: [1, 1.12, 1], borderColor: ['#f59e0b', '#fbbf24', '#f59e0b'] }
              : {}
          }
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-stone-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-md"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border border-amber-200 flex items-center justify-center text-xs shadow-md">
            🪔
          </div>
          <div className="flex flex-col text-left leading-none min-w-[55px]">
            <span className="font-mono text-[10px] font-bold tracking-widest text-amber-300/80 uppercase">
              LADDUS
            </span>
            <span className="font-mono text-base sm:text-lg font-black text-amber-100 tabular-nums mt-0.5">
              {displayedTotal}
            </span>
          </div>
        </motion.div>
      </div>

      {/* FLYING REWARD LADDU (Smooth flight transition to scoreboard during Phase 3) */}
      <AnimatePresence>
        {animationPhase === 3 && (
          <motion.div
            key="flying-reward-laddu"
            initial={{
              x: 0,
              y: -20,
              scale: 1,
              opacity: 1,
            }}
            animate={{
              x: typeof window !== 'undefined' ? window.innerWidth / 2 - 90 : 250,
              y: typeof window !== 'undefined' ? -window.innerHeight / 2 + 60 : -200,
              scale: 0.4,
              opacity: 0.9,
            }}
            transition={{
              duration: 0.6,
              ease: [0.25, 1, 0.5, 1], // Crisp cubic bezier
            }}
            className="absolute z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 border-2 border-amber-200 shadow-2xl flex items-center justify-center text-xl">
              🪔
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN UNIFIED REWARD CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-stone-900/95 border-2 border-amber-400/70 rounded-3xl shadow-2xl shadow-stone-950 overflow-y-auto text-center"
      >
        {/* Top Gold Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-amber-300 to-orange-500 shrink-0" />

        <div className="p-4 sm:p-6 pb-2">
          {/* Level Complete Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-mono font-black uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            LEVEL {levelNumber} COMPLETED
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-amber-100 font-serif tracking-tight mt-0.5">
            {levelTitle} Completed!
          </h2>

          {/* 3D-STYLE GOLDEN LADDU PRESENTATION (Appears smoothly, pops, gentle tilt, then settles) */}
          <div className="relative my-3 sm:my-4 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{
                scale: [0.2, 1.15, 1.0],
                opacity: 1,
                rotate: animationPhase === 1 ? [0, 10, -5, 0] : 0,
              }}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
              }}
              className="relative flex items-center justify-center"
            >
              {/* Subtle ambient warm halo */}
              <div className="absolute w-28 h-28 rounded-full bg-radial from-amber-500/25 to-transparent blur-md pointer-events-none" />

              {/* Central Laddu Spherical Presentation */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 border-2 border-amber-200/90 shadow-2xl flex flex-col items-center justify-center text-stone-950 p-2 overflow-hidden">
                {/* Boondi Texture Highlights */}
                <div className="absolute inset-0 bg-[radial-gradient(#fef08a_1px,transparent_1px)] [background-size:6px_6px] opacity-40 pointer-events-none" />
                <span className="text-3xl sm:text-4xl drop-shadow-md">🪔</span>
              </div>
            </motion.div>

            {/* "+X LADDUS" EARNED DISPLAY (Appears smoothly during Phase 2) */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{
                opacity: animationPhase >= 2 ? 1 : 0,
                y: animationPhase >= 2 ? 0 : 8,
                scale: animationPhase >= 2 ? 1 : 0.9,
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="mt-2.5 flex flex-col items-center"
            >
              <div className="text-2xl sm:text-3xl font-black font-serif text-amber-300 tracking-wide flex items-center gap-1.5 drop-shadow">
                <span>+{earnedLaddus}</span>
                <span className="text-sm font-sans font-extrabold uppercase text-amber-400">
                  LADDUS
                </span>
              </div>

              {tier && (
                <span
                  className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full mt-1 ${
                    tier === 'GOLD'
                      ? 'bg-amber-400 text-stone-950'
                      : tier === 'SILVER'
                      ? 'bg-slate-200 text-stone-950'
                      : 'bg-amber-800 text-amber-100'
                  }`}
                >
                  {tier} TIER PERFORMANCE
                </span>
              )}
            </motion.div>
          </div>

          {/* METRICS OVERVIEW (Clean Information Hierarchy) */}
          <div className="bg-stone-950/70 p-3 rounded-2xl border border-amber-500/25 grid grid-cols-2 gap-2 text-left mb-2">
            <div className="flex flex-col border-r border-amber-500/20 pr-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Completion Time
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-amber-100 mt-0.5">
                {completionTime}
              </span>
            </div>

            <div className="flex flex-col pl-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Score Earned
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-amber-300 mt-0.5">
                {score.toLocaleString()} pts
              </span>
            </div>
          </div>

          {formulaDescription && (
            <p className="text-[11px] text-amber-200/80 italic font-mono mb-2">
              {formulaDescription}
            </p>
          )}

          {/* Clean Total Summary (No maximum, uncapped total) */}
          <div className="flex items-center justify-between px-3 py-2 bg-stone-950/50 rounded-xl border border-amber-500/20 text-xs">
            <span className="text-stone-400 font-medium">New Total Laddus:</span>
            <span className="text-amber-200 font-black font-mono text-sm">
              {displayedTotal}
            </span>
          </div>
        </div>

        {/* FOOTER & CONTINUE ACTION */}
        <div className="p-4 sm:p-6 pt-2 shrink-0">
          {/* Auto-advance progress bar (only rendered when auto-advancing) */}
          {autoAdvanceSeconds > 0 && (
            <div className="w-full bg-stone-800 h-1 rounded-full overflow-hidden mb-3">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-100 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          <button
            id="unified-reward-continue-btn"
            type="button"
            onClick={onContinue}
            className="w-full py-3 sm:py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-black text-sm tracking-wider uppercase shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer ring-1 ring-amber-300/60"
          >
            <span className="font-cinzel tracking-widest">{continueLabel}</span>
            {!continueLabel.includes('→') && <ArrowRight className="w-4 h-4 stroke-[2.5]" />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
