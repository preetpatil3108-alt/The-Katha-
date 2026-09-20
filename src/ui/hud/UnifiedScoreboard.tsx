/**
 * THE KATHA - Unified Game Scoreboard
 *
 * The single, authoritative, premium scoreboard used throughout the entire game:
 * - Level 1 (Siddham)
 * - Level 2 (Utsavam)
 * - Level 3 (Nimajjanam)
 * - Journey Map (Katha Path)
 * - Stage Completion & Reward Presentation
 *
 * Design Language:
 * - Premium, minimal, clean, modern Indian aesthetic
 * - Authentic warm slate-stone backdrop with gold hairline accents
 * - Clear typography and tabular numbers
 * - ZERO hard-coded maximum scores (no MAX 64, no /48, no caps)
 * - Supports smooth numeric count-up animations upon receiving rewards
 * - Responsive anchoring that avoids blocking controls, vehicles, or task UI
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock, ArrowUpRight } from 'lucide-react';
import { audioManager } from '../../core/audio/AudioManager';

export interface ScoreboardRewardMoment {
  levelTitle: string;
  completionTime: string;
  earnedLaddus: number;
  previousTotal: number;
  newTotal: number;
}

export interface UnifiedScoreboardProps {
  /** Current total laddu count */
  totalLaddus: number;
  /** Optional reward moment for level completion display */
  rewardMoment?: ScoreboardRewardMoment | null;
  /** Compact variant for tighter spaces like map header */
  compact?: boolean;
  /** Custom ID for targeting/anchoring animations */
  id?: string;
  /** Extra container classes */
  className?: string;
  /** Callback when reward animation sequence completes */
  onRewardAnimationComplete?: () => void;
}

export const UnifiedScoreboard: React.FC<UnifiedScoreboardProps> = ({
  totalLaddus,
  rewardMoment = null,
  compact = false,
  id = 'game-unified-scoreboard',
  className = '',
  onRewardAnimationComplete,
}) => {
  // Smooth numerical count animation state
  const [displayedScore, setDisplayedScore] = useState<number>(
    rewardMoment ? rewardMoment.previousTotal : totalLaddus
  );
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [hasLandedPulse, setHasLandedPulse] = useState<boolean>(false);
  const prevTotalRef = useRef<number>(totalLaddus);

  // Animate numerical change smoothly when total increases or when reward moment arrives
  useEffect(() => {
    const targetScore = rewardMoment ? rewardMoment.newTotal : totalLaddus;
    const startScore = displayedScore;

    if (startScore === targetScore) {
      prevTotalRef.current = targetScore;
      return;
    }

    const difference = targetScore - startScore;
    if (difference <= 0) {
      setDisplayedScore(targetScore);
      prevTotalRef.current = targetScore;
      return;
    }

    setIsCounting(true);
    // Smooth stepped transition (e.g. 25 -> 30 -> 35 -> 40 -> 45)
    const duration = Math.min(1000, Math.max(400, difference * 35));
    const startTime = performance.now();

    let animationFrameId: number;

    const updateScore = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease-out cubic for crisp deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startScore + difference * easeProgress);

      setDisplayedScore(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateScore);
      } else {
        setDisplayedScore(targetScore);
        setIsCounting(false);
        setHasLandedPulse(true);
        audioManager.playSound('laddu_collect');
        setTimeout(() => setHasLandedPulse(false), 300);
        onRewardAnimationComplete?.();
      }
    };

    animationFrameId = requestAnimationFrame(updateScore);
    prevTotalRef.current = targetScore;

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [totalLaddus, rewardMoment, onRewardAnimationComplete]);

  // Sync if displayed score gets drastically out of sync
  useEffect(() => {
    if (!rewardMoment && !isCounting && displayedScore !== totalLaddus) {
      setDisplayedScore(totalLaddus);
    }
  }, [totalLaddus, rewardMoment, isCounting]);

  return (
    <div
      id={id}
      className={`relative select-none pointer-events-auto transition-transform ${className}`}
    >
      <div
        className={`relative flex items-center bg-stone-900/90 backdrop-blur-md rounded-2xl border transition-all duration-300 shadow-xl ${
          hasLandedPulse
            ? 'border-amber-400 bg-stone-900 scale-105 shadow-amber-500/30 ring-1 ring-amber-400/50'
            : 'border-amber-500/30 hover:border-amber-400/50'
        } ${compact ? 'px-3 py-1.5 gap-2' : 'px-3.5 sm:px-4 py-2 gap-2.5 sm:gap-3'}`}
      >
        {/* Auspicious Laddu Token Emblem */}
        <div
          className={`relative flex-shrink-0 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 border border-amber-200/90 flex items-center justify-center shadow-md ${
            compact ? 'w-6 h-6 text-xs' : 'w-7 h-7 sm:w-8 sm:h-8 text-sm'
          }`}
        >
          <span>🪔</span>
          {isCounting && (
            <span className="absolute inset-0 rounded-full border border-amber-300 animate-ping opacity-75 pointer-events-none" />
          )}
        </div>

        {/* Score & Label Column */}
        <div className="flex flex-col text-left leading-none min-w-[58px] sm:min-w-[68px]">
          <span
            className={`font-mono font-bold tracking-widest text-amber-300/80 uppercase ${
              compact ? 'text-[9px]' : 'text-[10px] sm:text-[11px]'
            }`}
          >
            LADDUS
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`font-mono font-black text-amber-100 tabular-nums tracking-tight ${
                compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
              } ${isCounting ? 'text-amber-300' : ''}`}
            >
              {displayedScore}
            </span>

            {/* Subtle "+X" delta indicator when counting */}
            <AnimatePresence>
              {rewardMoment && isCounting && (
                <motion.span
                  initial={{ opacity: 0, y: -4, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.8 }}
                  className="text-[10px] font-mono font-bold text-emerald-400 flex items-center"
                >
                  <ArrowUpRight className="w-2.5 h-2.5 inline stroke-[3]" />
                  +{rewardMoment.earnedLaddus}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Active celebration spark indicator */}
        <AnimatePresence>
          {hasLandedPulse && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-400 border border-amber-100 flex items-center justify-center text-[10px] text-stone-950 shadow-md"
            >
              <Sparkles className="w-2.5 h-2.5 text-stone-950 fill-stone-950" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expanded Reward Overlay Drawer when level completion reward moment is active */}
      <AnimatePresence>
        {rewardMoment && (
          <motion.div
            key="scoreboard-reward-expansion"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="absolute top-full right-0 mt-1 w-64 sm:w-72 bg-stone-950/95 border border-amber-400/70 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl z-50 text-stone-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-2">
              <span className="text-[10px] font-mono font-black tracking-wider uppercase text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                LEVEL COMPLETE
              </span>
              <span className="text-[10px] font-sans text-stone-400 truncate max-w-[120px]">
                {rewardMoment.levelTitle}
              </span>
            </div>

            {/* Core Metrics Hierarchy */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-stone-300 text-[11px]">
                <span className="flex items-center gap-1.5 text-stone-400">
                  <Clock className="w-3 h-3 text-amber-400" />
                  TIME:
                </span>
                <span className="font-bold text-amber-100">
                  {rewardMoment.completionTime}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="font-bold text-amber-400/90 tracking-wide">
                  EARNED:
                </span>
                <span className="font-black text-amber-300 text-sm">
                  +{rewardMoment.earnedLaddus} LADDUS
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-500/20">
                <span className="text-stone-400">TOTAL:</span>
                <span className="font-bold text-amber-100 tabular-nums">
                  {displayedScore}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
