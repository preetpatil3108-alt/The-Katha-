/**
 * THE KATHA - Opening Story Dialogue Overlay
 *
 * Implements the opening cutscene discussion between Ramu and his 4 companions:
 * - 5 People total: Ramu + Chintu, Bhavani, Varun, Deepa
 * - Key story beats:
 *   "Chanda collection has reached ₹20,000."
 *   "Let's start the arrangements."
 * - Mushak appearance:
 *   "Come on Ramu! We need to collect the leaves from the forest."
 * - Fast, snappy, natural Indian village youth tone.
 * - Non-obtrusive, accessible controls: Next button, Skip option, keyboard navigation.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LEVEL_0_OPENING_DIALOGUE, DialogueLine } from '../../core/story/OpeningDialogueData';
import { CharacterId } from '../../types/game';
import { AudioManager } from '../../core/audio/AudioManager';
import { ChevronRight, FastForward, Sparkles, User } from 'lucide-react';

interface OpeningStoryDialogueProps {
  onComplete: () => void;
  onSpeakerChange?: (speakerId: CharacterId, gesture: string) => void;
}

export const OpeningStoryDialogue: React.FC<OpeningStoryDialogueProps> = ({
  onComplete,
  onSpeakerChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const audio = AudioManager.getInstance();

  const currentLine: DialogueLine = LEVEL_0_OPENING_DIALOGUE[currentIndex];

  useEffect(() => {
    if (onSpeakerChange && currentLine) {
      onSpeakerChange(currentLine.speakerId, currentLine.gesture);
    }

    // Play sound cues
    if (currentLine.id === 'dlg_1') {
      audio.playSound('celebration_chime');
    } else if (currentLine.speakerId === CharacterId.MUSHAK) {
      audio.playSound('mushak_squeak');
    } else {
      audio.playSound('dialogue_tick');
    }
  }, [currentIndex, currentLine, onSpeakerChange]);

  // Keyboard navigation (Space or Enter to advance)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleNext = () => {
    if (currentIndex < LEVEL_0_OPENING_DIALOGUE.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      audio.playSound('bell_chime');
      onComplete();
    }
  };

  const handleSkip = () => {
    audio.playSound('button_tap');
    onComplete();
  };

  const isMushak = currentLine.speakerId === CharacterId.MUSHAK;

  return (
    <div
      id="opening-story-dialogue-overlay"
      className="absolute inset-x-0 bottom-6 md:bottom-10 z-30 flex flex-col items-center px-4 pointer-events-none select-none"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLine.id}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-stone-900/95 backdrop-blur-md border-2 border-amber-500/50 rounded-2xl p-4 md:p-5 shadow-2xl shadow-stone-950 pointer-events-auto"
        >
          {/* Top Speaker Identity Bar */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              {/* Avatar Pill */}
              <div
                className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center font-bold text-white shadow-md border border-white/20"
                style={{ backgroundColor: currentLine.avatarBg }}
              >
                {isMushak ? '🐭' : currentLine.speakerName[0]}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm md:text-base font-bold text-amber-100 tracking-wide font-serif">
                    {currentLine.speakerName}
                  </span>
                  <span className={`text-[10px] font-semibold text-white px-2 py-0.5 rounded-full ${currentLine.tagColor}`}>
                    {currentLine.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Skip Button */}
            <button
              id="skip-dialogue-btn"
              type="button"
              onClick={handleSkip}
              className="text-[11px] font-medium text-amber-300/70 hover:text-amber-200 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <FastForward className="w-3 h-3" />
              Skip
            </button>
          </div>

          {/* Dialogue Speech Bubble Body */}
          <div className="py-1 min-h-[50px] flex items-center">
            <p className="text-sm md:text-base text-amber-50 leading-relaxed font-sans font-medium">
              {currentLine.text}
            </p>
          </div>

          {/* Bottom Controls Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 mt-2">
            {/* Story Step Dots */}
            <div className="flex items-center gap-1.5">
              {LEVEL_0_OPENING_DIALOGUE.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-6 bg-amber-400'
                      : idx < currentIndex
                      ? 'w-1.5 bg-amber-600'
                      : 'w-1.5 bg-stone-700'
                  }`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              id="next-dialogue-btn"
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold text-xs md:text-sm flex items-center gap-1 shadow-lg shadow-amber-950/40 transition-transform active:scale-95 cursor-pointer"
            >
              <span>{currentIndex === LEVEL_0_OPENING_DIALOGUE.length - 1 ? 'Start Journey' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
