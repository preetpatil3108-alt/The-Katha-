/**
 * THE KATHA - Mushak (The Grey Cartoon Mouse Guide)
 * Playful idle companion: runs across screen, twitches ears, sniffs,
 * scurries to a corner, and eats a small piece of cheese.
 * CRITICAL RULE: Mushak never controls Ramu.
 */

import React, { useState, useEffect } from 'react';
import { audioManager } from '../../core/audio/AudioManager';

export type MushakBehavior = 'idle' | 'running' | 'eating' | 'greeting';

interface MushakCompanionProps {
  initialBehavior?: MushakBehavior;
  customMessage?: string;
  showSpeechBubble?: boolean;
}

export const MushakCompanion: React.FC<MushakCompanionProps> = ({
  initialBehavior = 'idle',
  customMessage,
  showSpeechBubble = false,
}) => {
  const [behavior, setBehavior] = useState<MushakBehavior>(initialBehavior);
  const [positionX, setPositionX] = useState<number>(20); // percentage across screen width
  const [facingLeft, setFacingLeft] = useState<boolean>(false);
  const [speech, setSpeech] = useState<string | null>(customMessage || null);
  const [cheeseEaten, setCheeseEaten] = useState<number>(0);

  // Cycle idle behaviors (run around playfully, then go to corner to eat cheese)
  useEffect(() => {
    if (customMessage) {
      setSpeech(customMessage);
    }

    const interval = setInterval(() => {
      setBehavior((current) => {
        if (current === 'eating') {
          // Finished eating cheese, wander back out playfully
          setFacingLeft(false);
          setPositionX(25);
          return 'running';
        } else if (current === 'running') {
          // Pause and look around playfully
          return 'idle';
        } else if (current === 'idle') {
          // Move toward the corner to eat cheese
          setFacingLeft(true);
          setPositionX(8); // Scurry near bottom-left corner
          audioManager.playSound('mushak_nibble');
          return 'eating';
        } else {
          return 'idle';
        }
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [customMessage]);

  const handleInteraction = () => {
    audioManager.playSound('mushak_squeak');
    setBehavior('greeting');
    const greetings = [
      'Squeak! Lord Ganesha blesses you!',
      'Rangastalam smells of sweet modaks!',
      'I am Mushak, Ramu’s loyal guide!',
      'Mmm... this cheese is delicious!',
    ];
    setSpeech(greetings[Math.floor(Math.random() * greetings.length)]);

    setTimeout(() => {
      setBehavior('idle');
      if (!customMessage) {
        setSpeech(null);
      }
    }, 3500);
  };

  return (
    <div
      id="mushak-interactive-guide"
      onClick={handleInteraction}
      className="absolute bottom-3 z-30 flex flex-col items-center cursor-pointer select-none transition-all duration-1000 ease-in-out"
      style={{
        left: `${positionX}%`,
        transform: `translateX(-50%) ${facingLeft ? 'scaleX(-1)' : 'scaleX(1)'}`,
      }}
      title="Mushak - Tap to say hello!"
    >
      {/* Speech Bubble (flipped back if facingLeft so text stays readable) */}
      {(showSpeechBubble || speech) && (
        <div
          className="mb-1.5 px-3 py-1.5 rounded-2xl bg-amber-100/95 border border-amber-400 text-stone-900 text-xs font-semibold shadow-lg backdrop-blur-sm max-w-[200px] text-center pointer-events-none animate-bounce"
          style={{ transform: facingLeft ? 'scaleX(-1)' : 'none' }}
        >
          <span>{speech || customMessage}</span>
          <div className="w-2 h-2 bg-amber-100 rotate-45 mx-auto -mb-2.5 mt-1 border-r border-b border-amber-400" />
        </div>
      )}

      {/* Stylized Grey Cartoon Mouse Visual */}
      <div className="relative w-16 h-16 flex items-end justify-center">
        {/* Cheese Wedge (shown when eating in the corner) */}
        {behavior === 'eating' && (
          <div className="absolute -left-1 bottom-1.5 z-20 animate-pulse">
            <svg width="22" height="18" viewBox="0 0 24 20" fill="none">
              {/* Triangular cheese wedge */}
              <polygon points="2,18 22,18 16,3" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
              {/* Cheese holes */}
              <circle cx="9" cy="14" r="2" fill="#eab308" />
              <circle cx="15" cy="13" r="1.5" fill="#eab308" />
              <circle cx="13" cy="8" r="1.2" fill="#eab308" />
            </svg>
          </div>
        )}

        {/* Mouse Vector Artwork */}
        <svg width="60" height="60" viewBox="0 0 100 100" className="overflow-visible filter drop-shadow-md">
          {/* Curled Tail */}
          <path
            d="M 28 72 C 12 76, 5 62, 10 50 C 14 42, 22 45, 18 52"
            fill="none"
            stroke="#e7e5e4"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="animate-wiggle"
          />

          {/* Mouse Grey Rounded Body */}
          <ellipse cx="50" cy="62" rx="26" ry="22" fill="#78716c" />

          {/* Soft Cream Chest / Belly Patch */}
          <ellipse cx="60" cy="64" rx="14" ry="16" fill="#f5f5f4" />

          {/* Large Rounded Cartoon Mouse Ears (Warm Grey outer, Soft Pink inner) */}
          <circle cx="36" cy="30" r="14" fill="#78716c" />
          <circle cx="36" cy="30" r="8.5" fill="#fbcfe8" />

          <circle cx="62" cy="28" r="15" fill="#78716c" />
          <circle cx="62" cy="28" r="9.5" fill="#fbcfe8" />

          {/* Mouse Head */}
          <ellipse cx="55" cy="46" rx="19" ry="17" fill="#78716c" />

          {/* Snout pointing right */}
          <path d="M 62 44 Q 78 50 78 55 Q 68 59 58 56 Z" fill="#78716c" />

          {/* Cute Pink Nose */}
          <circle cx="78" cy="54" r="3.5" fill="#fb7185" />

          {/* Expressive Black Cartoon Eye with Highlight */}
          <ellipse cx="58" cy="42" rx="4.5" ry="5.5" fill="#09090b" />
          <circle cx="60" cy="40" r="1.5" fill="#ffffff" />

          {/* Whiskers */}
          <line x1="72" y1="53" x2="88" y2="49" stroke="#d6d3d1" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="72" y1="56" x2="87" y2="60" stroke="#d6d3d1" strokeWidth="1.2" strokeLinecap="round" />

          {/* Sacred Red Collar with Tiny Gold Bell */}
          <path d="M 44 56 Q 52 63 60 58" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
          <circle cx="53" cy="62" r="3.5" fill="#facc15" stroke="#b45309" strokeWidth="0.8" />

          {/* Paws (holding cheese if eating) */}
          {behavior === 'eating' ? (
            <>
              <circle cx="66" cy="62" r="3.5" fill="#fbcfe8" />
              <circle cx="62" cy="65" r="3.5" fill="#fbcfe8" />
            </>
          ) : (
            <>
              <circle cx="68" cy="68" r="3.5" fill="#fbcfe8" />
              <circle cx="58" cy="72" r="3.5" fill="#fbcfe8" />
            </>
          )}

          {/* Back Little Feet */}
          <ellipse cx="38" cy="80" rx="8" ry="4.5" fill="#78716c" />
          <ellipse cx="52" cy="81" rx="8" ry="4.5" fill="#78716c" />
        </svg>
      </div>

      {/* Floating Name Label */}
      <span className="text-[10px] font-bold text-amber-300 bg-stone-900/80 px-2 py-0.5 rounded-full border border-amber-500/30 tracking-wider uppercase mt-0.5">
        Mushak
      </span>
    </div>
  );
};
