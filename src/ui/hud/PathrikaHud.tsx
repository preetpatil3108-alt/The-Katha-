/**
 * THE KATHA - Pathrika Collection HUD
 *
 * Renders:
 * - Interactive action prompt for Ramu:
 *   - "PICK UP BAG [E]" (beside Ganesh Mandapam stand)
 *   - "Pluck ... [E]" (during forest gathering)
 *   - "SUBMIT LEAVES [E]" (at Ganesh Mandapam altar after collecting all 21 leaves)
 * - Paper Bag progress indicator: 0 / 21 -> 21 / 21
 * - 4-group distribution breakdown:
 *   - Chintu: X / 6
 *   - Bhavani: X / 6
 *   - Varun: X / 6
 *   - Ramu & Deepa: X / 3 (Highlights Durva Grass!)
 *   Total: 21
 * - "LEVEL 1 COMPLETE: SACRED OFFERINGS SUBMITTED" celebration modal
 *   (Strictly triggers ONLY upon submission at the Mandapam, not when plucking the 21st leaf)
 */

import React, { useState, useEffect } from 'react';
import { PathrikaProgress } from '../../engine/characters/PathrikaCollectionSystem';
import { RewardSystem } from '../../core/rewards/RewardSystem';
import { Sparkles, Check, CheckCircle2, BookOpen, X, Hand, ShoppingBag, Landmark, Clock, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PathrikaHudProps {
  progress: PathrikaProgress;
  onStartCollection: () => void;
  onRamuAction: () => void;
  onCompleteCelebration?: () => void;
  suppressCompletionModal?: boolean;
}

export const PathrikaHud: React.FC<PathrikaHudProps> = ({
  progress,
  onStartCollection,
  onRamuAction,
  onCompleteCelebration,
  suppressCompletionModal = false,
}) => {
  const [showLeafList, setShowLeafList] = useState(false);
  const [hasAcknowledgedComplete, setHasAcknowledgedComplete] = useState(false);

  // Keyboard shortcut listener: [E] triggers Ramu's active action
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        if (progress.currentPrompt) {
          onRamuAction();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [progress.currentPrompt, onRamuAction]);

  const {
    totalCollected,
    maxLeaves,
    chintuCount,
    bhavaniCount,
    varunCount,
    ramuDeepaCount,
    hasDurvaGrass,
    hasPaperBag,
    isSubmitted,
    state,
    currentPrompt,
  } = progress;

  const isCollectionStarted = hasPaperBag || state === 'carrying_bag' || state === 'forest_active' || state === 'return_to_mandapam' || state === 'mandapam_ready_submit' || state === 'submitted' || state === 'active' || state === 'completed';

  return (
    <>
      {/* 1. PAPER BAG & 4-GROUP DISTRIBUTION HUD (Bottom-Right) */}
      <AnimatePresence>
        {isCollectionStarted && (
          <motion.div
            id="pathrika-collection-hud"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute bottom-4 sm:bottom-6 right-3 sm:right-4 md:right-6 z-20 pointer-events-auto max-w-[280px] sm:max-w-xs"
          >
            <div className="bg-stone-950/90 border border-amber-500/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md">
              {/* Header: Paper Bag Progress */}
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  {/* Paper Bag Icon & Fill Level */}
                  <div className="relative w-8 h-8 rounded-lg bg-amber-900/60 border border-amber-400/60 flex items-center justify-center overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-emerald-500/70 transition-all duration-500"
                      style={{ height: `${(totalCollected / maxLeaves) * 100}%` }}
                    />
                    <span className="relative text-base z-10">🛍️</span>
                  </div>

                  <div>
                    <div className="text-xs font-black tracking-wider text-amber-300 uppercase font-mono">
                      SACRED BAG
                    </div>
                    <div className="text-base font-black text-amber-100 font-serif leading-none">
                      {totalCollected} <span className="text-xs font-normal text-amber-400/80">/ 21</span>
                    </div>
                  </div>
                </div>

                {/* View Details Button */}
                <button
                  id="toggle-leaf-details-btn"
                  type="button"
                  onClick={() => setShowLeafList(true)}
                  className="px-2 py-1 rounded bg-stone-900/80 hover:bg-stone-800 border border-amber-500/30 text-[10px] text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>List</span>
                </button>
              </div>

              {/* Status Alert if Returning to Mandapam */}
              {(state === 'return_to_mandapam' || state === 'mandapam_ready_submit') && !isSubmitted && (
                <div className="mt-2 p-2 rounded-lg bg-amber-500/20 border border-amber-400/60 text-center animate-pulse">
                  <span className="text-[11px] font-bold text-amber-200 flex items-center justify-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-amber-300" />
                    All 21 gathered! Return to Mandapam!
                  </span>
                </div>
              )}

              {/* 4-Group Visible Distribution Breakdown */}
              <div className="mt-2.5 space-y-1.5 text-[11px]">
                {/* Chintu */}
                <div className="flex items-center justify-between text-amber-200/90 bg-stone-900/50 px-2 py-1 rounded border border-amber-500/10">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    Chintu (Companion 1)
                  </span>
                  <span className={`font-mono font-bold ${chintuCount === 6 ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {chintuCount} / 6
                  </span>
                </div>

                {/* Bhavani */}
                <div className="flex items-center justify-between text-amber-200/90 bg-stone-900/50 px-2 py-1 rounded border border-amber-500/10">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Bhavani (Companion 2)
                  </span>
                  <span className={`font-mono font-bold ${bhavaniCount === 6 ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {bhavaniCount} / 6
                  </span>
                </div>

                {/* Varun */}
                <div className="flex items-center justify-between text-amber-200/90 bg-stone-900/50 px-2 py-1 rounded border border-amber-500/10">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    Varun (Companion 3)
                  </span>
                  <span className={`font-mono font-bold ${varunCount === 6 ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {varunCount} / 6
                  </span>
                </div>

                {/* Ramu + Companion 4 (Deepa) */}
                <div className="flex items-center justify-between text-amber-200/90 bg-amber-950/40 px-2 py-1 rounded border border-amber-400/30">
                  <span className="flex items-center gap-1.5 font-bold text-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ramu & Deepa (You + C4)
                  </span>
                  <span className={`font-mono font-bold ${ramuDeepaCount === 3 ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {ramuDeepaCount} / 3
                  </span>
                </div>
              </div>

              {/* Durva Grass Indicator Badge */}
              <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px]">
                <span className="text-amber-300/90 font-medium">🌿 Durva Grass (గరిక):</span>
                {hasDurvaGrass ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Collected!
                  </span>
                ) : (
                  <span className="text-amber-400/70 font-mono text-[10px]">Pending (Ramu's Task)</span>
                )}
              </div>

              {/* LEVEL 1 TIMER (Starts ONLY when Ramu picks up paper bag, ends on submission) */}
              {hasPaperBag && (
                <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Clock className={`w-3.5 h-3.5 ${progress.isTimerActive ? 'text-amber-300 animate-pulse' : 'text-emerald-400'}`} />
                    TIMER
                  </span>
                  <span className="text-xs font-mono font-black text-amber-100 bg-amber-950/80 px-2.5 py-1 rounded border border-amber-500/40 tracking-widest shadow-inner">
                    TIME {progress.formattedTimer || '00:00'}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. RAMU INTERACTION ACTION PROMPT */}
      {/* Appears whenever Ramu is within range of an interactive target (Bag, Leaf, or Mandapam submission) */}
      <AnimatePresence>
        {currentPrompt && (
          <motion.div
            id="ramu-action-prompt"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center justify-center"
          >
            <button
              id="ramu-interact-btn"
              type="button"
              onClick={onRamuAction}
              className={`px-6 py-3.5 rounded-full font-black text-xs md:text-sm tracking-wide shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 ${
                currentPrompt.type === 'pickup_bag'
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-stone-950 border-amber-200 shadow-amber-500/50 animate-bounce'
                  : currentPrompt.type === 'submit_leaves'
                  ? 'bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 text-stone-950 border-amber-100 shadow-orange-500/60 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-stone-950 border-emerald-200 shadow-emerald-950/60'
              }`}
            >
              {currentPrompt.type === 'pickup_bag' ? (
                <ShoppingBag className="w-4 h-4" />
              ) : currentPrompt.type === 'submit_leaves' ? (
                <Landmark className="w-4 h-4" />
              ) : (
                <Hand className="w-4 h-4" />
              )}
              <span>{currentPrompt.actionText}</span>
              <kbd className="hidden sm:inline bg-stone-950/40 text-amber-100 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                E
              </kbd>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. "LEVEL 1 COMPLETE: OFFERINGS SUBMITTED!" CELEBRATION MODAL */}
      {/* Strictly appears ONLY after submission at the Ganesh Mandapam! */}
      <AnimatePresence>
        {isSubmitted && !hasAcknowledgedComplete && !suppressCompletionModal && (
          <motion.div
            id="pathrika-complete-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-40 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
          >
            <div className="relative max-w-md w-full bg-gradient-to-b from-stone-900 via-amber-950/90 to-stone-900 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-amber-400 via-emerald-500 to-teal-400 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/30">
                <Sparkles className="w-9 h-9" />
              </div>

              <span className="text-xs font-black uppercase tracking-widest text-amber-400 font-mono">
                GANESH PUJA PREPARATION
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-amber-100 font-serif mt-1">
                LEVEL 1 COMPLETE!
              </h2>

              {/* Mushak Celebrates with short speech bubble */}
              <div className="my-3 p-3 rounded-2xl bg-amber-950/80 border border-amber-400/40 flex items-center gap-3 text-left">
                {/* Cute Mushak Avatar */}
                <div className="w-12 h-12 rounded-full bg-stone-800 border-2 border-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                  <svg width="36" height="36" viewBox="0 0 100 100">
                    <ellipse cx="50" cy="62" rx="26" ry="22" fill="#78716c" />
                    <ellipse cx="60" cy="64" rx="14" ry="16" fill="#f5f5f4" />
                    <circle cx="36" cy="30" r="14" fill="#78716c" />
                    <circle cx="36" cy="30" r="8.5" fill="#fbcfe8" />
                    <circle cx="62" cy="28" r="15" fill="#78716c" />
                    <circle cx="62" cy="28" r="9.5" fill="#fbcfe8" />
                    <ellipse cx="55" cy="46" rx="19" ry="17" fill="#78716c" />
                    <circle cx="76" cy="54" r="3.5" fill="#fb7185" />
                    <ellipse cx="58" cy="42" rx="4.5" ry="5.5" fill="#09090b" />
                    <circle cx="60" cy="40" r="1.5" fill="#ffffff" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Mushak
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-amber-100 italic">
                    &ldquo;Ganapati Bappa Morya! You and your friends have honored Lord Ganesha beautifully!&rdquo;
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-amber-200/95 leading-relaxed">
                All <strong>21 sacred leaves</strong> and the filled paper bag have been respectfully offered at the
                <strong>Ganesh Mandapam</strong> altar, including the blessed <strong>Durva Grass (గరిక)</strong>!
              </p>

              <div className="mt-3 bg-stone-950/60 rounded-xl p-3 border border-amber-500/30 text-xs text-amber-300/90 text-left space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Chintu's collection:</span>
                  <span className="font-bold text-emerald-400">6 / 6 ✓</span>
                </div>
                <div className="flex justify-between">
                  <span>Bhavani's collection:</span>
                  <span className="font-bold text-emerald-400">6 / 6 ✓</span>
                </div>
                <div className="flex justify-between">
                  <span>Varun's collection:</span>
                  <span className="font-bold text-emerald-400">6 / 6 ✓</span>
                </div>
                <div className="flex justify-between">
                  <span>Ramu & Deepa:</span>
                  <span className="font-bold text-emerald-400">3 / 3 (Durva Grass ✓)</span>
                </div>
                <div className="border-t border-amber-500/20 pt-1 flex justify-between font-bold text-amber-200">
                  <span>Offerings Status:</span>
                  <span className="text-emerald-400">SUBMITTED AT MANDAPAM ✓</span>
                </div>
              </div>

              {/* Deterministic Level 1 Reward & Timer Calculation */}
              {(() => {
                const completionSecs = progress.finalCompletionSeconds || progress.elapsedSeconds;
                const calc = RewardSystem.calculateLevelReward(completionSecs);
                return (
                  <div className="mt-3.5 bg-gradient-to-br from-amber-950/60 to-stone-900/80 rounded-xl p-3.5 border border-amber-400/40 text-xs text-left space-y-2 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-amber-300/90 flex items-center gap-1.5 font-sans font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Completion Time:
                      </span>
                      <span className="font-bold text-sm text-amber-100 bg-amber-900/50 px-2 py-0.5 rounded border border-amber-500/30 tracking-wider">
                        TIME {progress.finalCompletionTime || progress.formattedTimer || '00:00'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-amber-300/90 flex items-center gap-1.5 font-sans font-semibold">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        Deterministic Tier:
                      </span>
                      <span className={`font-black px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider ${
                        calc.tier === 'GOLD'
                          ? 'bg-amber-400 text-stone-950 shadow-sm'
                          : calc.tier === 'SILVER'
                          ? 'bg-slate-200 text-stone-900 shadow-sm'
                          : 'bg-amber-800 text-amber-100 shadow-sm'
                      }`}>
                        {calc.tier} TIER
                      </span>
                    </div>

                    <div className="text-[11px] text-amber-300/70 italic">
                      Criteria: {calc.formulaDescription}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-amber-500/20">
                      <span className="text-amber-200 font-sans font-bold">Reward Laddus:</span>
                      <span className="text-emerald-400 text-base font-black">+{calc.laddusEarned} LADDUS</span>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-5 flex flex-col gap-2.5">
                <button
                  id="pathrika-celebrate-btn"
                  type="button"
                  onClick={() => {
                    setHasAcknowledgedComplete(true);
                    if (onCompleteCelebration) {
                      onCompleteCelebration();
                    }
                  }}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-stone-950 font-black text-sm tracking-wider uppercase shadow-lg shadow-amber-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-stone-950" />
                  Proceed to Laddu Celebration
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. FULL 21 SACRED LEAVES DETAILS MODAL */}
      <AnimatePresence>
        {showLeafList && (
          <motion.div
            id="sacred-leaf-list-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 pointer-events-auto"
          >
            <div className="bg-stone-900 border-2 border-amber-500/50 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-amber-500/30 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-amber-100 font-serif">
                    21 Sacred Leaves (ఏకవింశతి పత్ర పూజ)
                  </h3>
                  <p className="text-xs text-amber-400 font-mono">
                    Vinayaka Chavithi Puja Leaves • {totalCollected} / 21 Collected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLeafList(false)}
                  className="w-8 h-8 rounded-full bg-stone-800 text-amber-300 flex items-center justify-center hover:bg-stone-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-2 text-xs flex-1">
                {progress.leaves.map((leaf, i) => (
                  <div
                    key={leaf.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      leaf.isCollected
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                        : 'bg-stone-950/50 border-stone-800 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center font-mono font-bold text-amber-400/80">
                        {i + 1}
                      </span>
                      <div>
                        <div className="font-bold text-amber-200">
                          {leaf.name} <span className="text-[11px] font-normal text-amber-400/80">({leaf.teluguName})</span>
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Assigned: {leaf.collectorName}
                        </div>
                      </div>
                    </div>

                    <div>
                      {leaf.isCollected ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold font-mono text-[11px]">
                          <Check className="w-3.5 h-3.5" /> Collected
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-500 font-mono">In Jungle</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
