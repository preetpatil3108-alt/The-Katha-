/**
 * THE KATHA - Level 1 Objective & Subtle Directional Marker HUD
 *
 * Displays:
 * - Dynamic Level 1 Objective:
 *   - "Pick up Paper Bag beside Ganesh Mandapam"
 *   - "Enter the Jungle through the Jungle Entrance"
 *   - "Collect 21 Sacred Leaves in the Jungle (X/21)"
 *   - "Return to Ganesh Mandapam with Leaves"
 *   - "Submit 21 Sacred Leaves at Ganesh Mandapam"
 * - Dynamic compass marker showing distance and bearing to current waypoint/target
 * - Active Timer (starts ONLY after paper bag is picked up!)
 * - Mushak divine guidance dialogue bubble
 */

import React from 'react';
import { Sparkles, Navigation, Trees, ShoppingBag, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ForestObjectiveHudProps {
  playerPos: { x: number; y: number; z: number };
  targetPos: { x: number; y: number; z: number };
  cameraYaw: number;
  mushakSpeech: string;
  isMushakSpeaking: boolean;
  hasReachedForest: boolean;
  customObjective?: string;
  isTimerActive?: boolean;
  elapsedSeconds?: number;
  remainingSeconds?: number;
  isReturnPhase?: boolean;
}

export const ForestObjectiveHud: React.FC<ForestObjectiveHudProps> = ({
  playerPos,
  targetPos,
  cameraYaw,
  mushakSpeech,
  isMushakSpeaking,
  hasReachedForest,
  customObjective,
  isTimerActive = false,
  elapsedSeconds = 0,
  remainingSeconds = 0,
  isReturnPhase = false,
}) => {
  // Compute distance to destination
  const dx = targetPos.x - playerPos.x;
  const dz = targetPos.z - playerPos.z;
  const distance = Math.round(Math.sqrt(dx * dx + dz * dz));

  // Compute angle to destination relative to camera yaw
  const worldAngle = Math.atan2(dx, -dz); // 0 is forward (-Z)
  const relativeAngle = worldAngle - cameraYaw;
  const degrees = (relativeAngle * 180) / Math.PI;

  const currentObjectiveText = customObjective || (hasReachedForest ? 'Collect 21 Sacred Leaves' : 'Go to the forest');

  return (
    <div className="pointer-events-none select-none">
      {/* 1. Objective Card & Active Timer (Top-Center) */}
      <div className="absolute top-3 md:top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5">
        <div className="bg-stone-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-500/40 shadow-xl flex items-center gap-3">
          {/* Objective Category Icon */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-orange-500 flex items-center justify-center text-stone-950 shadow-md">
            {isReturnPhase ? (
              <Landmark className="w-4 h-4" />
            ) : hasReachedForest ? (
              <Trees className="w-4 h-4" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
          </div>

          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black tracking-widest uppercase text-amber-400/90 font-mono flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              OBJECTIVE
            </span>
            <span className="text-xs md:text-sm font-bold text-amber-100 font-sans tracking-wide">
              {currentObjectiveText}
            </span>
          </div>

          {/* Directional Marker & Distance Meter */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-amber-500/30">
            <div
              className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center transition-transform duration-100 ease-out"
              style={{ transform: `rotate(${degrees}deg)` }}
              title="Target Direction"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 min-w-[34px]">
              {distance}m
            </span>
          </div>
        </div>
      </div>

      {/* 2. Mushak Active Guidance Speech Bubble (Positioned cleanly between the Mini-Map and Joystick on the left) */}
      <AnimatePresence>
        {isMushakSpeaking && mushakSpeech && (
          <motion.div
            id="mushak-guide-speech-bubble"
            initial={{ opacity: 0, x: -12, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute top-[166px] sm:top-[186px] md:top-[212px] left-3 sm:left-4 md:left-6 max-w-[210px] sm:max-w-[250px] md:max-w-[280px] z-20 pointer-events-none"
          >
            <div className="pointer-events-auto bg-gradient-to-r from-amber-950/95 to-stone-900/95 backdrop-blur-md px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl border border-amber-400/60 shadow-2xl shadow-stone-950 flex items-start gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500 border border-amber-200 flex-shrink-0 flex items-center justify-center text-xs sm:text-sm shadow-md">
                🐭
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <span>Mushak</span>
                  <span className="text-[9px] text-amber-400/70 font-normal truncate">• Divine Guide</span>
                </div>
                <p className="text-[11px] sm:text-xs md:text-sm font-medium text-amber-50 leading-snug mt-0.5">
                  &ldquo;{mushakSpeech}&rdquo;
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
