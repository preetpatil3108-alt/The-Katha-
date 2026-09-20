/**
 * THE KATHA - Reusable Laddu Reward Animation
 * 
 * When a level is completed:
 * 1. Shows: LEVEL COMPLETE! (with golden fanfare and particle burst)
 * 2. Then shows: +16 LADDUS (or indicates already claimed if replaying)
 * 3. Animates 16 golden laddus flying in satisfying arcs toward the player's profile/counter
 * 4. Increments the laddu counter progressively with pleasant audio chimes
 * 5. Reusable across any stage completion
 */

import React, { useEffect, useState, useRef } from 'react';
import { useGameState } from '../../core/state/GameStateContext';
import { LevelRegistry } from '../../core/levels/LevelRegistry';
import { GameState, LevelId } from '../../types/game';
import { audioManager } from '../../core/audio/AudioManager';
import { LADDUS_PER_LEVEL } from '../../core/rewards/RewardSystem';
import { leaderboardService } from '../../core/leaderboard/LeaderboardService';
import { ThreeLadduCanvas } from './ThreeLadduCanvas';
import { Sparkles, Trophy, ArrowRight, Map, RotateCcw, CheckCircle2, Star, Clock, Award, Zap } from 'lucide-react';

interface FlyingLaddu {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  delay: number;
}

interface LadduRewardAnimationProps {
  onContinueToMap?: () => void;
  onNextLevel?: () => void;
  onReplay?: () => void;
}

export const LadduRewardAnimation: React.FC<LadduRewardAnimationProps> = ({
  onContinueToMap,
  onNextLevel,
  onReplay,
}) => {
  const {
    activeLevel,
    saveData,
    playerName,
    ladduCount,
    lastRewardResult,
    lastCompletionCalculation,
    setGameState,
    startLevel,
  } = useGameState();

  const currentLevelConfig = LevelRegistry.getLevel(activeLevel);
  const nextLevelId = LevelRegistry.getNextLevel(activeLevel);

  // Deterministic calculation values
  const awardAmount = lastCompletionCalculation?.laddusEarned ?? lastRewardResult?.amount ?? LADDUS_PER_LEVEL;
  const earnedScore = lastCompletionCalculation?.score ?? (awardAmount * 100);
  const completionTimeStr = lastCompletionCalculation?.formattedTime ?? '02:30';
  const rewardTier = lastCompletionCalculation?.tier ?? (awardAmount >= 21 ? 'GOLD' : awardAmount >= 16 ? 'SILVER' : 'BRONZE');

  // Animation phase states
  // 0: Initial Fanfare (LEVEL COMPLETE!)
  // 1: Big Laddu Reveal (LADDUS)
  // 2: Flying Laddus to Profile Counter
  // 3: Settled summary & action choices
  const [phase, setPhase] = useState<number>(0);
  const [flyingLaddus, setFlyingLaddus] = useState<FlyingLaddu[]>([]);
  const [displayedLaddus, setDisplayedLaddus] = useState<number>(() => {
    const isDuplicate = lastRewardResult ? lastRewardResult.isDuplicate : true;
    if (isDuplicate) return ladduCount;
    return Math.max(0, ladduCount - awardAmount);
  });

  const [counterImpact, setCounterImpact] = useState<boolean>(false);
  const centerBadgeRef = useRef<HTMLDivElement>(null);
  const profileCounterRef = useRef<HTMLDivElement>(null);

  const isDuplicate = lastRewardResult?.isDuplicate ?? false;
  const newlyUnlockedId = lastRewardResult?.unlockedLevelId ?? nextLevelId;

  // Settle summary and auto-submit score to leaderboard
  useEffect(() => {
    if (saveData && ladduCount > 0) {
      leaderboardService.saveScore({
        playerName: playerName || 'Ramu',
        level: 1,
        levelsCompleted: saveData.completedLevels.length,
        laddus: ladduCount,
        laddusEarned: awardAmount,
        completionTime: completionTimeStr,
        score: earnedScore,
      }).catch(err => console.warn('[Leaderboard] auto-save error:', err));
    }
  }, [ladduCount, playerName, saveData, awardAmount, completionTimeStr, earnedScore]);

  // Step 1: Initial Fanfare -> Reveal
  useEffect(() => {
    audioManager.playSound('level_complete');

    // Reveal "+16 LADDUS" after 700ms
    const timer1 = setTimeout(() => {
      setPhase(1);
    }, 700);

    // If duplicate (no new laddus to fly), transition straight to settled summary
    if (isDuplicate) {
      const timerDup = setTimeout(() => {
        setPhase(3);
      }, 1600);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timerDup);
      };
    }

    // Step 2: Spawn Flying Laddus after 1500ms
    const timer2 = setTimeout(() => {
      setPhase(2);
      spawnFlyingLaddus();
    }, 1500);

    // Step 3: Settle summary after flight finishes
    const timer3 = setTimeout(() => {
      setPhase(3);
    }, 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isDuplicate]);

  // Spawn individual flying laddus (matching exact deterministic reward)
  const spawnFlyingLaddus = () => {
    const list: FlyingLaddu[] = [];
    const count = awardAmount; // Deterministic reward amount (e.g., 21, 16, or 11)

    // Default start coords near screen center
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight * 0.42;

    // Target top-right counter
    const targetX = window.innerWidth - 80;
    const targetY = 40;

    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        startX: startX + (Math.random() - 0.5) * 60,
        startY: startY + (Math.random() - 0.5) * 60,
        targetX,
        targetY,
        delay: i * 70, // Smooth sequential stagger
      });
    }

    setFlyingLaddus(list);

    // Increment counter tick-by-tick as laddus hit the target
    list.forEach((laddu, idx) => {
      setTimeout(() => {
        setDisplayedLaddus(prev => Math.min(ladduCount, prev + 1));
        setCounterImpact(true);
        audioManager.playSound('laddu_collect');
        setTimeout(() => setCounterImpact(false), 120);
      }, laddu.delay + 750);
    });
  };

  const handleNextStage = () => {
    audioManager.playSound('button_tap');
    if (onNextLevel) {
      onNextLevel();
    } else if (nextLevelId) {
      startLevel(nextLevelId);
    } else {
      setGameState(GameState.LEVEL_MAP);
    }
  };

  const handleGoToMap = () => {
    audioManager.playSound('button_tap');
    if (onContinueToMap) {
      onContinueToMap();
    } else {
      setGameState(GameState.LEVEL_MAP);
    }
  };

  const handleReplayStage = () => {
    audioManager.playSound('button_tap');
    if (onReplay) {
      onReplay();
    } else {
      startLevel(activeLevel);
    }
  };

  const completedCount = saveData.completedLevels.length;

  return (
    <div
      id="laddu-reward-animation-screen"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md select-none text-amber-50 overflow-hidden"
    >
      {/* Background Radiant Festive Halo */}
      <div className="absolute inset-0 bg-radial from-amber-600/20 via-stone-950/80 to-stone-950 pointer-events-none" />

      {/* Confetti & Marigold Petal Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-60 animate-ping"
            style={{
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              backgroundColor: i % 2 === 0 ? '#f59e0b' : '#ef4444',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 2 + 1.5}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* TOP-RIGHT: Profile Laddu Counter Target */}
      <div
        ref={profileCounterRef}
        id="reward-top-profile-counter"
        className={`absolute top-4 right-4 md:top-6 md:right-8 z-50 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-stone-900/90 border-2 transition-all duration-200 shadow-xl backdrop-blur-md ${
          counterImpact
            ? 'scale-110 border-amber-300 bg-amber-950/90 shadow-amber-500/50'
            : 'border-amber-500/40'
        }`}
      >
        <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border border-amber-100 flex items-center justify-center shadow-md">
          <span className="text-sm">🪔</span>
          {counterImpact && (
            <div className="absolute inset-0 rounded-full border-2 border-amber-300 animate-ping" />
          )}
        </div>
        <div className="text-right leading-tight">
          <div className="text-[10px] uppercase font-bold text-amber-300">
            {playerName || 'Ramu'}
          </div>
          <div className="text-sm md:text-base font-black text-amber-100 flex items-center gap-1">
            <span>{displayedLaddus}</span>
            <span className="text-xs font-semibold text-amber-400">LADDUS</span>
          </div>
        </div>
      </div>

      {/* CENTER REWARD CARD CONTAINER */}
      <div className="relative z-10 w-full max-w-lg bg-stone-900/95 border-2 border-amber-400/80 rounded-3xl p-6 md:p-8 shadow-2xl text-center flex flex-col items-center">
        {/* Festive Header Ornament */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-12 h-[1px] bg-gradient-to-r from-transparent to-amber-400" />
          <div className="flex items-center gap-1 text-xs uppercase tracking-widest text-amber-400 font-bold">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Auspicious Victory</span>
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <span className="w-12 h-[1px] bg-gradient-to-l from-transparent to-amber-400" />
        </div>

        {/* 1. LEVEL COMPLETE Announcement */}
        <h2 className="text-2xl md:text-3xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-100 to-orange-200 tracking-wider mb-1 drop-shadow-md animate-fade-in">
          LEVEL {currentLevelConfig.index} — {currentLevelConfig.title} COMPLETE!
        </h2>

        <p className="text-xs md:text-sm text-stone-300 font-medium mb-3">
          {currentLevelConfig.subtitle} • {currentLevelConfig.location}
        </p>

        {/* Mushak Celebrates with short speech bubble */}
        <div className="mb-4 p-3 rounded-2xl bg-amber-950/70 border border-amber-400/40 flex items-center gap-3 text-left w-full max-w-sm shadow-md">
          {/* Cute Mushak Avatar */}
          <div className="w-11 h-11 rounded-full bg-stone-800 border-2 border-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <span className="text-xl">🐀</span>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              Mushak
            </div>
            <div className="text-xs sm:text-sm font-bold text-amber-100 italic">
              &ldquo;Splendid work! Return to the Journey Map to continue.&rdquo;
            </div>
          </div>
        </div>

        {/* 2. CENTER PIECE: THE +16 LADDUS SEAL */}
        <div
          ref={centerBadgeRef}
          className="relative my-2 w-32 h-32 md:w-36 md:h-36 flex items-center justify-center"
        >
          {/* Elegant Sacred Rangoli Halo (static, dignified, no infinite spin) */}
          <div className="absolute inset-0 rounded-full border border-amber-400/40" />
          <div className="absolute inset-2 rounded-full border border-amber-500/30" />
          <div className="absolute -inset-2 bg-radial from-amber-500/20 to-transparent rounded-full filter blur-md" />

          {/* Central Golden Medal */}
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 border-4 border-amber-200 shadow-2xl flex flex-col items-center justify-center text-stone-950 p-2">
            <Trophy className="w-7 h-7 text-amber-950 mb-0.5" />
            {isDuplicate ? (
              <>
                <span className="text-[11px] font-black uppercase text-stone-900 leading-none">
                  COMPLETED
                </span>
                <span className="text-[10px] font-bold text-amber-900 leading-tight">
                  {awardAmount} Claimed
                </span>
              </>
            ) : (
              <>
                <span className="text-xl md:text-2xl font-black font-cinzel tracking-tight leading-none text-stone-950">
                  +{awardAmount}
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-950 leading-none">
                  LADDUS
                </span>
              </>
            )}
          </div>
        </div>

        {/* Deterministic Time & Score Reward Card */}
        {lastCompletionCalculation && (
          <div className="w-full max-w-sm my-2.5 p-3 rounded-2xl bg-stone-950/90 border border-amber-400/40 shadow-xl text-left space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-amber-500/20 pb-1.5">
              <span className="text-amber-300 flex items-center gap-1.5 font-sans font-semibold">
                <Award className="w-4 h-4 text-amber-400" />
                Performance Tier:
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-black tracking-wider uppercase ${
                rewardTier === 'GOLD'
                  ? 'bg-amber-400 text-stone-950'
                  : rewardTier === 'SILVER'
                  ? 'bg-slate-200 text-stone-950'
                  : 'bg-amber-800 text-amber-100'
              }`}>
                {rewardTier} TIER
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-300 flex items-center gap-1.5 font-sans">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Completion Time:
              </span>
              <span className="text-amber-200 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/20">
                TIME {completionTimeStr}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-300 flex items-center gap-1.5 font-sans">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Performance Score:
              </span>
              <span className="text-amber-300 font-bold">
                {earnedScore.toLocaleString()} PTS
              </span>
            </div>

            <div className="text-[11px] text-amber-300/80 italic pt-1 border-t border-amber-500/20">
              Formula: {lastCompletionCalculation.formulaDescription}
            </div>
          </div>
        )}

        {/* Status Text / Progression Feedback */}
        <div className="mt-2 mb-4 p-3 rounded-2xl bg-stone-950/80 border border-amber-500/30 w-full max-w-sm">
          {isDuplicate ? (
            <div className="text-xs text-amber-200/90 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Replay complete. {awardAmount} Laddus already claimed for this stage!</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span>+{awardAmount} LADDUS awarded ({rewardTier} Tier)!</span>
              </div>
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 w-full text-center shadow-lg shadow-emerald-950/40">
                <div className="text-xs sm:text-sm font-mono font-black text-emerald-300 tracking-wider">
                  {newlyUnlockedId === LevelId.LEVEL_2 ? '✨ LEVEL 2 — UTSAVAM UNLOCKED!' : newlyUnlockedId ? `${newlyUnlockedId.replace('_', ' ').toUpperCase()} UNLOCKED!` : 'ALL 3 STAGES UNLOCKED!'}
                </div>
                <div className="text-[10px] text-stone-300 mt-0.5">
                  {newlyUnlockedId === LevelId.LEVEL_2
                    ? 'The sacred idol arrives tonight! Mandapam arrangements underway.'
                    : 'Check the 3D Journey Map to see Mushika advance!'}
                </div>
              </div>
            </div>
          )}

          {/* Quick Profile Metric Summary */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-stone-800 text-[11px]">
            <div className="text-center">
              <span className="text-stone-400 block font-mono text-[10px] uppercase tracking-wider">Total Laddus</span>
              <span className="font-extrabold text-amber-200 text-sm font-mono">
                {ladduCount}
              </span>
            </div>
            <div className="text-center">
              <span className="text-stone-400 block">{currentLevelConfig.title}</span>
              <span className="font-extrabold text-emerald-400 text-sm">
                COMPLETED
              </span>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="w-full max-w-sm flex flex-col gap-2.5">
          {/* Next Level / Final Ending Button */}
          {nextLevelId ? (
            <button
              id="reward-next-level-btn"
              type="button"
              onClick={handleNextStage}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-stone-950 font-black text-sm md:text-base shadow-xl shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-stone-950" />
              <span>
                {nextLevelId === LevelId.LEVEL_3
                  ? 'Proceed to Level 3 — NIMAJJANAM'
                  : 'Proceed to Level 2 — UTSAVAM'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : activeLevel === LevelId.LEVEL_3 ? (
            <button
              id="reward-game-ending-btn"
              type="button"
              onClick={() => {
                if (onNextLevel) {
                  onNextLevel();
                } else {
                  setGameState(GameState.GAME_ENDING);
                }
              }}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-sm md:text-base shadow-xl shadow-amber-950/60 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-stone-950" />
              <span>Proceed to Ending Experience</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : null}

          {/* Return to Level Map Button */}
          <button
            id="reward-view-map-btn"
            type="button"
            onClick={handleGoToMap}
            className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer ${
              nextLevelId || activeLevel === LevelId.LEVEL_3
                ? 'bg-stone-800 hover:bg-stone-700 border border-amber-500/40 text-amber-200'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Return to Journey Map</span>
          </button>

          {/* Replay Level Button */}
          <button
            id="reward-replay-btn"
            type="button"
            onClick={handleReplayStage}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 font-semibold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay Stage</span>
          </button>
        </div>
      </div>

      {/* 3. 3D WebGL LADDU REWARD ANIMATION LAYER */}
      {!isDuplicate && (
        <ThreeLadduCanvas
          targetElementId="reward-top-profile-counter"
          ladduCount={Math.min(awardAmount, 7)}
          onImpact={() => {
            setDisplayedLaddus((prev) => Math.min(ladduCount, prev + 1));
            setCounterImpact(true);
            setTimeout(() => setCounterImpact(false), 140);
          }}
          onComplete={() => {
            setPhase(3);
            setDisplayedLaddus(ladduCount);
          }}
        />
      )}
    </div>
  );
};
