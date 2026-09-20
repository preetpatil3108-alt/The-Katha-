/**
 * THE KATHA - Player Name Registration Screen
 * Displays: "What should we call you?"
 * Input: "Enter your name"
 * Button: "NEXT"
 * Empty name validation: player cannot continue with an empty name.
 * Saves using existing SaveSystem.
 */

import React, { useState } from 'react';
import { useGameState } from '../../core/state/GameStateContext';
import { audioManager } from '../../core/audio/AudioManager';
import { Sparkles, ArrowRight, User, RotateCw } from 'lucide-react';

interface NameInputScreenProps {
  onNext: () => void;
}

export const NameInputScreen: React.FC<NameInputScreenProps> = ({ onNext }) => {
  const { playerName, collegeName, setPlayerProfile } = useGameState();
  const [inputVal, setInputVal] = useState(playerName && playerName !== 'Ramu' ? playerName : '');
  const [collegeVal, setCollegeVal] = useState(collegeName || '');
  const [hasSubmittedEmptyName, setHasSubmittedEmptyName] = useState(false);
  const [hasSubmittedEmptyCollege, setHasSubmittedEmptyCollege] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedName = inputVal.trim();
  const trimmedCollege = collegeVal.trim();
  const isNameValid = trimmedName.length > 0;
  const isCollegeValid = trimmedCollege.length > 0;
  const isValid = isNameValid && isCollegeValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    let hasError = false;

    if (!isNameValid) {
      setHasSubmittedEmptyName(true);
      hasError = true;
    }
    if (!isCollegeValid) {
      setHasSubmittedEmptyCollege(true);
      hasError = true;
    }

    if (hasError) {
      audioManager.playSound('button_tap');
      return;
    }

    setIsSubmitting(true);
    try {
      await setPlayerProfile(trimmedName, trimmedCollege);
    } catch (err) {
      console.warn('[NameInputScreen] Registration warning:', err);
    } finally {
      setIsSubmitting(false);
      audioManager.playSound('button_tap');
      onNext();
    }
  };

  return (
    <div
      id="name-input-screen"
      className="relative w-full h-full bg-stone-950 flex items-center justify-center p-4 overflow-hidden select-none"
    >
      {/* Background Soft Glows */}
      <div className="absolute inset-0 bg-radial from-amber-950/40 via-stone-950 to-stone-950 pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-md bg-stone-900/95 border-2 border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md text-amber-50">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-stone-950 shadow-md mb-3">
            <User className="w-8 h-8" />
          </div>

          <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rangastalam Village</span>
          </div>

          {/* Exact Prompt Heading: "What should we call you?" */}
          <h2 className="text-2xl md:text-3xl font-black font-cinzel text-amber-200 mt-1">
            What should we call you?
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Enter your details to begin your journey in the festival katha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Existing field: ENTER YOUR NAME */}
          <div>
            <label htmlFor="player-name-input" className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">
              Enter Your Name
            </label>
            <input
              id="player-name-input"
              type="text"
              maxLength={24}
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                if (hasSubmittedEmptyName && e.target.value.trim().length > 0) {
                  setHasSubmittedEmptyName(false);
                }
              }}
              placeholder="Enter your name"
              autoFocus
              className={`w-full px-4 py-3.5 rounded-xl bg-stone-950 border ${
                hasSubmittedEmptyName ? 'border-red-500 ring-1 ring-red-500' : 'border-amber-500/50'
              } text-amber-100 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 text-center tracking-wide text-base`}
            />

            {/* Validation Notice */}
            {hasSubmittedEmptyName && (
              <p id="player-name-error" className="text-red-400 text-xs mt-1.5 text-center font-medium">
                Please enter a name before continuing.
              </p>
            )}
          </div>

          {/* New field directly below: ENTER YOUR COLLEGE NAME */}
          <div>
            <label htmlFor="player-college-input" className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">
              Enter Your College Name
            </label>
            <input
              id="player-college-input"
              type="text"
              maxLength={60}
              value={collegeVal}
              onChange={(e) => {
                setCollegeVal(e.target.value);
                if (hasSubmittedEmptyCollege && e.target.value.trim().length > 0) {
                  setHasSubmittedEmptyCollege(false);
                }
              }}
              placeholder="Enter your college name"
              className={`w-full px-4 py-3.5 rounded-xl bg-stone-950 border ${
                hasSubmittedEmptyCollege ? 'border-red-500 ring-1 ring-red-500' : 'border-amber-500/50'
              } text-amber-100 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 text-center tracking-wide text-base`}
            />

            {/* Validation Notice */}
            {hasSubmittedEmptyCollege && (
              <p id="player-college-error" className="text-red-400 text-xs mt-1.5 text-center font-medium">
                Please enter your college name.
              </p>
            )}
          </div>

          {/* Button: NEXT */}
          <button
            id="name-next-btn"
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-95 mt-2 ${
              isValid && !isSubmitting
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 cursor-pointer shadow-amber-950/60'
                : 'bg-stone-800 hover:bg-stone-750 text-stone-400 cursor-pointer border border-stone-700/50'
            }`}
          >
            {isSubmitting ? (
              <>
                <RotateCw className="w-5 h-5 animate-spin" />
                <span>STARTING...</span>
              </>
            ) : (
              <>
                <span>NEXT</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
