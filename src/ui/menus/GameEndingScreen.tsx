/**
 * THE KATHA - Level 3 Final Completion Flow
 *
 * Exact Sequence:
 * 1. Level 3 Scoreboard (NEXT →) ->
 * 2. Congratulations Screen (NEXT →) ->
 * 3. Thank You Screen (NEXT →) ->
 * 4. Developer Note (COMPLETED ✓) ->
 * 5. Main Menu (Mushika greeting: "Great job! You've nailed it!")
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, Trophy, Sparkles } from 'lucide-react';
import { audioManager } from '../../core/audio/AudioManager';
import { SaveSystem } from '../../core/save/SaveSystem';

interface GameEndingScreenProps {
  onCompleteToMainMenu: () => void;
  onExploreWorld?: () => void;
}

export const GameEndingScreen: React.FC<GameEndingScreenProps> = ({ onCompleteToMainMenu }) => {
  // Page 1: CONGRATULATIONS
  // Page 2: THANK YOU FOR PLAYING
  // Page 3: A NOTE FROM THE DEVELOPER
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    try {
      audioManager.startAmbientBgm();
    } catch {
      // Audio autoplay deferred
    }
  }, []);

  const handleNextFromCongratulations = () => {
    audioManager.playSound('button_tap');
    setCurrentPage(2);
  };

  const handleNextFromThankYou = () => {
    audioManager.playSound('button_tap');
    setCurrentPage(3);
  };

  const handleCompleted = () => {
    audioManager.playSound('celebration_chime');
    // Set persistent game completion state: GAME COMPLETED = TRUE
    SaveSystem.setLevel3TaskCompleted();
    SaveSystem.saveGame({
      hasCompletedGame: true,
      level3TaskCompleted: true,
    });
    onCompleteToMainMenu();
  };

  return (
    <div
      id="game-ending-sequence-screen"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-stone-950/95 backdrop-blur-2xl select-none text-stone-100 overflow-y-auto pointer-events-auto"
    >
      {/* Background Soft Radiant Golden/Amber Glow */}
      <div className="absolute inset-0 bg-radial from-amber-900/20 via-stone-950/85 to-stone-950 pointer-events-none" />

      {/* Decorative hairline frames */}
      <div className="absolute top-4 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none" />
      <div className="absolute bottom-4 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none" />

      {/* Step Indicator (1 of 3, 2 of 3, 3 of 3) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              step === currentPage
                ? 'w-8 bg-gradient-to-r from-amber-400 to-orange-400 shadow-sm shadow-amber-400/50'
                : step < currentPage
                ? 'w-3 bg-amber-600/60'
                : 'w-3 bg-stone-800'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* =========================================================================
            PAGE 1: CONGRATULATIONS SCREEN
            ========================================================================= */}
        {currentPage === 1 && (
          <motion.div
            key="ending-congratulations-page"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-20 flex flex-col items-center text-center max-w-xl mx-auto px-4 py-8"
          >
            {/* Garland / Festive Trophy Emblem */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-6 shadow-lg shadow-amber-950/50">
              <Trophy className="w-8 h-8 text-amber-400 fill-amber-400/20" />
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-orange-300 tracking-[0.14em] mb-4 leading-tight">
              CONGRATULATIONS!
            </h1>

            {/* Sub-heading */}
            <div className="text-lg sm:text-xl md:text-2xl font-bold font-cinzel text-amber-200 tracking-wide mb-4">
              <p>You've finished the game.</p>
              <p className="text-amber-400">And you've rocked it!</p>
            </div>

            {/* Subtle Gold Divider */}
            <div className="h-[1px] w-28 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent my-3" />

            {/* Explanatory Note */}
            <div className="max-w-md text-xs sm:text-sm text-stone-300 font-normal leading-relaxed mb-8 space-y-2">
              <p>
                The journey may be complete, but Rangasthalam is still yours to explore.
              </p>
              <p className="text-amber-200/90 font-medium">
                You can still drive around, explore the world and enjoy the village.
              </p>
            </div>

            {/* NEXT Button */}
            <button
              id="ending-congratulations-next-btn"
              type="button"
              onClick={handleNextFromCongratulations}
              className="flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-black text-sm tracking-widest uppercase shadow-xl shadow-amber-950/60 transition-all duration-200 hover:scale-[1.03] active:scale-95 cursor-pointer ring-1 ring-amber-300/60"
            >
              <span className="font-cinzel tracking-wider">NEXT</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </motion.div>
        )}

        {/* =========================================================================
            PAGE 2: THANK YOU FOR PLAYING SCREEN
            ========================================================================= */}
        {currentPage === 2 && (
          <motion.div
            key="ending-thank-you-page"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-20 flex flex-col items-center text-center max-w-lg mx-auto px-4 py-8"
          >
            {/* Subtle sacred emblem glow */}
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 mb-6 shadow-inner">
              <span className="text-2xl font-cinzel text-amber-400 font-bold">ॐ</span>
            </div>

            {/* Main heading */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-cinzel text-amber-100 tracking-[0.14em] mb-4 leading-tight">
              THANK YOU FOR PLAYING
            </h1>

            {/* Subtle Divider */}
            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent my-3" />

            {/* Supporting text: The Katha */}
            <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-300 tracking-[0.2em] mb-4">
              The Katha
            </h2>

            {/* Credit: Game built by Preet Patil */}
            <p className="text-xs sm:text-sm text-stone-400 font-medium tracking-widest uppercase mb-10">
              Game built by <span className="text-amber-200 font-bold ml-1">Preet Patil</span>
            </p>

            {/* NEXT Button */}
            <button
              id="ending-thank-you-next-btn"
              type="button"
              onClick={handleNextFromThankYou}
              className="flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-black text-sm tracking-widest uppercase shadow-xl shadow-amber-950/60 transition-all duration-200 hover:scale-[1.03] active:scale-95 cursor-pointer ring-1 ring-amber-300/60"
            >
              <span className="font-cinzel tracking-wider">NEXT</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </motion.div>
        )}

        {/* =========================================================================
            PAGE 3: A NOTE FROM THE DEVELOPER SCREEN
            ========================================================================= */}
        {currentPage === 3 && (
          <motion.div
            key="ending-developer-note-page"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative z-20 flex flex-col items-center text-center max-w-xl mx-auto px-4 py-6"
          >
            {/* Heading */}
            <h1 className="text-xl sm:text-3xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-orange-300 tracking-[0.12em] mb-6 leading-tight">
              A NOTE FROM THE DEVELOPER
            </h1>

            {/* Exact developer message paragraphs */}
            <div className="space-y-4 text-stone-300 text-xs sm:text-sm leading-relaxed font-normal text-center sm:text-justify max-w-lg mb-6 px-2">
              <p>
                The game may look simple, but behind these few minutes are many late nights, early mornings and a lot of work behind the scenes.
              </p>
              <p>
                While building it, I learned a lot — not just about creating a game, but about turning an idea into something people can actually experience.
              </p>
              <p>
                All of this was possible because of the opportunity our college gave us to create, experiment and bring our creativity to life.
              </p>
              <p className="font-semibold text-amber-200 text-center pt-1">
                Happy to be a part of NIAT.
              </p>
            </div>

            {/* End with note */}
            <p className="text-xs sm:text-sm text-amber-400/90 italic font-medium mb-8">
              Thank you for being part of the journey.
            </p>

            {/* COMPLETED Button */}
            <button
              id="ending-developer-note-completed-btn"
              type="button"
              onClick={handleCompleted}
              className="flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-black text-sm tracking-widest uppercase shadow-xl shadow-amber-950/60 transition-all duration-200 hover:scale-[1.03] active:scale-95 cursor-pointer ring-1 ring-amber-300/60"
            >
              <span className="font-cinzel tracking-wider">COMPLETED</span>
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
