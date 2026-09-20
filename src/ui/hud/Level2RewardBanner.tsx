/**
 * THE KATHA - Level 2 (Utsavam) Time-Based Reward Display Banner
 * 
 * Displays clearly and briefly upon Level 2 task completion:
 * 1. Completion Time (Stopwatch from task assignment to arrival)
 * 2. Laddus awarded (Calculated via continuous speed-based function)
 * 3. Transparent speed incentive explanation
 * 4. Smooth progression to festival celebration
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, Clock, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Level2RewardCalculation } from '../../core/rewards/RewardSystem';

interface Level2RewardBannerProps {
  calculation: Level2RewardCalculation;
  onContinue: () => void;
  autoAdvanceSeconds?: number;
}

export const Level2RewardBanner: React.FC<Level2RewardBannerProps> = ({
  calculation,
  onContinue,
  autoAdvanceSeconds = 4.0,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(autoAdvanceSeconds);

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

  // Visual countdown timer
  useEffect(() => {
    const interval = 100; // update every 100ms
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
  }, [onContinue]);

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / autoAdvanceSeconds) * 100));

  return (
    <motion.div
      id="level2-reward-banner-overlay"
      initial={{ opacity: 0, scale: 0.92, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute inset-0 z-40 flex items-center justify-center p-3 md:p-6 bg-stone-950/75 backdrop-blur-sm pointer-events-auto"
    >
      <div className="relative w-full max-w-md bg-stone-900/95 border-2 border-amber-400/70 rounded-2xl shadow-2xl shadow-stone-950 overflow-hidden text-center select-none">
        {/* Top Gold Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-amber-300 to-orange-500" />

        {/* Header */}
        <div className="p-4 sm:p-5 pb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-mono font-black uppercase tracking-widest mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            LEVEL 2 TASK COMPLETED
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-amber-100 font-serif tracking-tight">
            Ayyagaru Safely Escorted!
          </h2>
          <p className="text-xs text-amber-300/80 font-sans mt-0.5">
            The grand Vinayaka Chavithi Utsavam & evening Aarti begin!
          </p>
        </div>

        {/* Main Stats Card */}
        <div className="px-4 sm:px-5 space-y-2.5">
          {/* Time Pill */}
          <div className="bg-stone-950/70 p-2.5 rounded-xl border border-amber-500/25 flex items-center justify-around">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400/80 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Completion Time
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-amber-100 mt-0.5">
                {calculation.formattedTime}
              </span>
            </div>

            <div className="h-8 w-px bg-amber-500/20" />

            <div className="flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400/80 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Speed Score
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-amber-300 mt-0.5">
                {calculation.score} pts
              </span>
            </div>
          </div>

          {/* Laddus Award Highlight */}
          <div className="bg-gradient-to-br from-amber-950/80 via-stone-900/90 to-amber-950/80 p-3.5 rounded-xl border border-amber-400/50 shadow-inner flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest font-mono">
              LEVEL 2 REWARD EARNED
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-7 h-7 rounded-full bg-amber-400 border border-amber-200 flex items-center justify-center text-sm shadow-md">
                🪔
              </div>
              <span className="text-2xl sm:text-3xl font-black text-amber-300 font-serif tracking-wide drop-shadow">
                +{calculation.laddusEarned} LADDUS
              </span>
            </div>

            <p className="text-[11px] text-amber-200/90 mt-1.5 font-medium italic max-w-xs">
              &ldquo;{calculation.description}&rdquo;
            </p>
          </div>

          {/* Speed Rule Explanation Box */}
          <div className="bg-stone-950/60 p-2.5 rounded-xl border border-amber-500/20 text-left text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono text-[10px] uppercase">
              <Zap className="w-3 h-3 text-amber-400" />
              Continuous Time-Based Incentive
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              Faster driving without collisions yields higher laddu rewards with zero artificial cap.
            </p>
            <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 pt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              Completed safely with 0 crashes!
            </div>
          </div>
        </div>

        {/* Footer & Continue Button */}
        <div className="p-4 sm:p-5 pt-3">
          {/* Progress bar */}
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden mb-3">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-100 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            id="level2-reward-continue-btn"
            type="button"
            onClick={onContinue}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <span>Celebrate Vinayaka Utsavam</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
