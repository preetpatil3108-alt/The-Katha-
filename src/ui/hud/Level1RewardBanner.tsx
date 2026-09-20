/**
 * THE KATHA - Level 1 Time-Based Reward Display Banner
 * 
 * Displays clearly and briefly upon Level 1 task completion:
 * 1. Task Completion Time
 * 2. Deterministic Speed Tier (Gold / Silver / Bronze)
 * 3. Exact Laddus awarded (Faster completion = More Laddus)
 * 4. Transparent tier breakdown so the player clearly understands the speed rule
 * 5. Smooth progression to Anand conversation
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, Clock, Award, Star, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { LevelRewardCalculation, LEVEL_1_REWARD_CONFIG } from '../../core/rewards/RewardSystem';

interface Level1RewardBannerProps {
  calculation: LevelRewardCalculation;
  onContinue: () => void;
  autoAdvanceSeconds?: number;
}

export const Level1RewardBanner: React.FC<Level1RewardBannerProps> = ({
  calculation,
  onContinue,
  autoAdvanceSeconds = 3.5,
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

  const isGold = calculation.tier === 'GOLD';
  const isSilver = calculation.tier === 'SILVER';

  return (
    <motion.div
      id="level1-reward-banner-overlay"
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
            LEVEL 1 TASK COMPLETED
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-amber-100 font-serif tracking-tight">
            Sacred Offerings Submitted!
          </h2>
          <p className="text-xs text-amber-300/80 font-sans mt-0.5">
            21 Leaves Delivered to Lord Ganesha at Mandapam
          </p>
        </div>

        {/* Main Stats Card */}
        <div className="px-4 sm:px-5 space-y-2.5">
          {/* Time & Tier Pill */}
          <div className="grid grid-cols-2 gap-2 bg-stone-950/70 p-2.5 rounded-xl border border-amber-500/25">
            <div className="flex flex-col items-center justify-center border-r border-amber-500/20 pr-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400/80 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Completion Time
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-amber-100 mt-0.5">
                {calculation.formattedTime}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center pl-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400/80 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" />
                Performance Tier
              </span>
              <span
                className={`text-xs sm:text-sm font-black uppercase tracking-wider px-2 py-0.5 rounded mt-0.5 ${
                  isGold
                    ? 'bg-amber-400 text-stone-950 font-bold'
                    : isSilver
                    ? 'bg-slate-200 text-stone-900 font-bold'
                    : 'bg-amber-800 text-amber-100 font-bold'
                }`}
              >
                {calculation.tier} TIER
              </span>
            </div>
          </div>

          {/* Laddus Award Highlight */}
          <div className="bg-gradient-to-br from-amber-950/80 via-stone-900/90 to-amber-950/80 p-3.5 rounded-xl border border-amber-400/50 shadow-inner flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest font-mono">
              REWARD EARNED
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-7 h-7 rounded-full bg-amber-400 border border-amber-200 flex items-center justify-center text-sm shadow-md">
                🪔
              </div>
              <span className="text-2xl sm:text-3xl font-black text-amber-300 font-serif tracking-wide drop-shadow">
                +{calculation.laddusEarned} LADDUS
              </span>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {[1, 2, 3].map((starIdx) => (
                <Star
                  key={starIdx}
                  className={`w-4 h-4 ${
                    starIdx <= calculation.stars
                      ? 'text-amber-400 fill-amber-400 drop-shadow'
                      : 'text-stone-700'
                  }`}
                />
              ))}
              <span className="text-xs font-mono font-bold text-amber-300/90 ml-1">
                ({calculation.stars} / 3 Stars)
              </span>
            </div>

            <p className="text-[11px] text-amber-200/90 mt-1.5 font-medium italic max-w-xs">
              &ldquo;{calculation.description}&rdquo;
            </p>
          </div>

          {/* Speed Rule Breakdown Box */}
          <div className="bg-stone-950/60 p-2.5 rounded-xl border border-amber-500/20 text-left text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold font-mono text-[10px] uppercase">
              <Zap className="w-3 h-3 text-amber-400" />
              Speed-Based Reward Rule
            </div>
            <div className="grid grid-cols-3 gap-1 pt-1 font-mono text-[10px]">
              <div className={`p-1 rounded text-center border ${isGold ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold' : 'bg-stone-900/60 border-stone-800 text-stone-400'}`}>
                <div>≤ 02:30</div>
                <div className="text-amber-300 font-bold">+21 Laddus</div>
              </div>
              <div className={`p-1 rounded text-center border ${isSilver ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold' : 'bg-stone-900/60 border-stone-800 text-stone-400'}`}>
                <div>02:31–04:00</div>
                <div className="text-amber-300 font-bold">+16 Laddus</div>
              </div>
              <div className={`p-1 rounded text-center border ${!isGold && !isSilver ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold' : 'bg-stone-900/60 border-stone-800 text-stone-400'}`}>
                <div>&gt; 04:00</div>
                <div className="text-amber-300 font-bold">+12 Laddus</div>
              </div>
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 pt-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              Faster task completion earned you more laddus!
            </div>
          </div>
        </div>

        {/* Footer & Progress to Anand */}
        <div className="p-4 sm:p-5 pt-3">
          {/* Progress bar */}
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden mb-3">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-100 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            id="reward-banner-continue-btn"
            type="button"
            onClick={onContinue}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <span>Continue to Anand Conversation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
