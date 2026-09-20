/**
 * THE KATHA - Level Loading & Transition Screen
 * 
 * Provides an instantaneous, polished transition feedback screen:
 * - Prominent "THE KATHA" title in traditional gold typography
 * - High-charm animated running Mushika mascot scampering toward the selected stage
 * - Stage-specific title and sacred subtitle
 * - Reassuring dynamic status updates so user never experiences blank screen or perceived freeze
 * - Minimum display duration (~400ms) for smooth visual continuity, auto-dismisses when level is ready
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { LevelId } from '../../types/game';
import { LevelRegistry } from '../../core/levels/LevelRegistry';
import { Sparkles } from 'lucide-react';

interface LevelTransitionScreenProps {
  levelId: LevelId;
  isReady?: boolean;
  onTransitionEnd?: () => void;
  minDurationMs?: number;
}

export const LevelTransitionScreen: React.FC<LevelTransitionScreenProps> = ({
  levelId,
  isReady = true,
  onTransitionEnd,
  minDurationMs = 500,
}) => {
  const levelConfig = LevelRegistry.getLevel(levelId);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [statusText, setStatusText] = useState('Preparing Sacred Rangastalam...');

  // Stage details
  const stageTitle = levelConfig?.title || (levelId === LevelId.LEVEL_1 ? 'Siddham' : levelId === LevelId.LEVEL_2 ? 'Utsavam' : 'Nimajjanam');
  const stageIndex = levelConfig?.index || (levelId === LevelId.LEVEL_1 ? 1 : levelId === LevelId.LEVEL_2 ? 2 : 3);
  const stageBrief = levelConfig?.objectiveBrief || (
    levelId === LevelId.LEVEL_1
      ? 'Gather 21 sacred leaves with Mushika in the sacred forest grove.'
      : levelId === LevelId.LEVEL_2
      ? 'Drive through the grand highway to invite Ayyagaru to the Mandapam.'
      : 'Sacred Ganesha immersion ceremonies along the Kalyani river ghats.'
  );

  // Guarantee minimum duration for graceful polish
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs]);

  // Dynamic progress text updates if loading takes a moment
  useEffect(() => {
    const t1 = setTimeout(() => {
      setStatusText(
        levelId === LevelId.LEVEL_1
          ? 'Preparing Sacred Forest Grove & Paper Bag...'
          : levelId === LevelId.LEVEL_2
          ? 'Preparing Festive Mandapam & Ramu’s Exploration Car...'
          : 'Preparing Kalyani River Ghats...'
      );
    }, 250);

    const t2 = setTimeout(() => {
      setStatusText('Ready! Entering gameplay...');
    }, 450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [levelId]);

  // Complete transition when both min time elapsed and engine is ready
  useEffect(() => {
    if (minTimeElapsed && isReady && onTransitionEnd) {
      const exitTimer = setTimeout(() => {
        onTransitionEnd();
      }, 150);
      return () => clearTimeout(exitTimer);
    }
  }, [minTimeElapsed, isReady, onTransitionEnd]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-950/95 backdrop-blur-lg select-none px-4 text-center overflow-hidden"
    >
      {/* Background radial gold glow */}
      <div className="absolute inset-0 bg-radial from-amber-600/15 via-stone-950/80 to-stone-950 pointer-events-none" />

      {/* Subtle traditional rangoli watermarks in corners */}
      <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full border border-amber-500/10 pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full border border-amber-500/10 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        {/* Title */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center mb-6"
        >
          <div className="flex items-center gap-1.5 text-amber-400/80 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Vinayaka Chavithi Adventure</span>
            <Sparkles className="w-3 h-3 text-amber-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 tracking-wider drop-shadow-md">
            THE KATHA
          </h1>
        </motion.div>

        {/* Animated Running Mushika Mascot */}
        <div className="relative w-48 h-24 my-2 flex items-center justify-center">
          {/* Running track subtle ground line */}
          <div className="absolute bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          
          {/* Dust / Sparkle particles behind Mushika */}
          <div className="absolute bottom-3 left-10 flex gap-1.5 opacity-60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" style={{ animationDuration: '1.2s' }} />
            <span className="w-1 h-1 rounded-full bg-yellow-300 animate-ping" style={{ animationDuration: '0.9s', animationDelay: '0.2s' }} />
            <span className="w-2 h-2 rounded-full bg-amber-500/50 animate-pulse" />
          </div>

          {/* SVG Animated Cartoon Mushika */}
          <motion.div
            animate={{
              y: [0, -6, 0, -4, 0],
              x: [-4, 4, -4],
            }}
            transition={{
              duration: 0.45,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative"
          >
            <svg
              width="84"
              height="64"
              viewBox="0 0 100 76"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]"
            >
              {/* Tail swishing */}
              <path
                d="M 22 46 C 12 48, 4 38, 2 24 C 1 18, 5 14, 8 16"
                stroke="#f472b6"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Main Pear Body */}
              <ellipse cx="44" cy="46" rx="22" ry="17" fill="#64748b" />
              {/* White chest */}
              <ellipse cx="49" cy="48" rx="14" ry="11" fill="#f8fafc" />

              {/* Cute Head */}
              <circle cx="68" cy="36" r="16" fill="#64748b" />

              {/* Ears */}
              {/* Back Ear */}
              <circle cx="62" cy="21" r="10" fill="#475569" />
              <circle cx="62" cy="21" r="6.5" fill="#f472b6" />
              {/* Front Ear */}
              <circle cx="74" cy="22" r="10.5" fill="#64748b" />
              <circle cx="74" cy="22" r="7" fill="#f472b6" />

              {/* Eye (Large, happy, cartoon shine) */}
              <circle cx="73" cy="34" r="4.5" fill="#0f172a" />
              <circle cx="74.5" cy="32.5" r="1.8" fill="#ffffff" />
              <circle cx="72" cy="35" r="0.8" fill="#ffffff" />

              {/* Rosy Cheek */}
              <circle cx="73" cy="41" r="3.2" fill="#fb7185" opacity="0.65" />

              {/* Cute Pink Snout & Nose */}
              <path d="M 80 37 Q 87 39 88 41 Q 85 43 80 43 Z" fill="#64748b" />
              <circle cx="87.5" cy="41" r="2.4" fill="#f43f5e" />

              {/* Whiskers */}
              <line x1="82" y1="40" x2="94" y2="37" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="82" y1="42" x2="95" y2="43" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />

              {/* Cute Tilak / Sacred Mark */}
              <rect x="66" y="27" width="2" height="5" rx="1" fill="#ef4444" />
              <circle cx="67" cy="33.5" r="1" fill="#eab308" />

              {/* Scampering Paws / Legs */}
              {/* Rear legs */}
              <ellipse cx="30" cy="56" rx="6" ry="4" fill="#f472b6" />
              <ellipse cx="40" cy="58" rx="6" ry="4" fill="#f472b6" />
              {/* Forepaws */}
              <ellipse cx="58" cy="57" rx="5.5" ry="3.8" fill="#f472b6" />
              <ellipse cx="68" cy="55" rx="5.5" ry="3.8" fill="#f472b6" />
            </svg>
          </motion.div>
        </div>

        {/* Selected Stage Callout */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col items-center mt-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
            <span>Stage {stageIndex} of 3</span>
            <span className="w-1 h-1 rounded-full bg-amber-400" />
            <span>{stageTitle}</span>
          </div>

          <p className="text-xs md:text-sm text-stone-300 max-w-xs font-medium leading-relaxed mb-4">
            {stageBrief}
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-56 h-1.5 rounded-full bg-stone-900 border border-amber-500/20 overflow-hidden relative mb-3">
          <motion.div
            initial={{ width: '15%' }}
            animate={{ width: isReady ? '100%' : '80%' }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 rounded-full"
          />
        </div>

        {/* Status text */}
        <span className="text-[11px] font-medium text-amber-300/80 tracking-wide transition-all">
          {statusText}
        </span>
      </div>
    </motion.div>
  );
};
