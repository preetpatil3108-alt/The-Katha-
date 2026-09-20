/**
 * THE KATHA - Compact Navigation Mini-Map HUD
 *
 * Streamlined, high-readability navigation HUD answering: "Where do I need to go now?"
 * - Compact circular design (80px - 96px diameter) that never obstructs gameplay
 * - Safe HUD placement (docked cleanly in top-right, clear of pause/mute/timer/joysticks/pedals)
 * - Obvious active destination marker with direct trajectory guide from Ramu
 * - Clean off-screen directional clamping arrow with distance
 * - Context-aware, task-based objective switching
 * - Tap to open Full World Map modal for detailed route inspection
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  MapPin,
  Car,
  X,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { LevelId } from '../../types/game';
import { PathrikaProgress } from '../../engine/characters/PathrikaCollectionSystem';
import { Level2State } from '../../engine/levels/Level2UtsavamSystem';
import { Level3State } from '../../engine/levels/Level3NimajjanamSystem';

export interface MiniMapHudProps {
  playerCoords: { x: number; y: number; z: number };
  playerHeading?: number;
  cameraYaw?: number;
  activeLevel: LevelId;
  isDriving?: boolean;
  pathrikaProgress?: PathrikaProgress | null;
  level2State?: Level2State | null;
  level3State?: Level3State | null;
  isMobile?: boolean;
  visible?: boolean;
}

interface ObjectiveInfo {
  id: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  x: number;
  z: number;
  color: string;
  accentColor: string;
}

interface RelevantLandmark {
  id: string;
  name: string;
  x: number;
  z: number;
  color: string;
}

export const MiniMapHud: React.FC<MiniMapHudProps> = ({
  playerCoords,
  playerHeading = 0,
  cameraYaw = 0,
  activeLevel,
  isDriving = false,
  pathrikaProgress,
  level2State,
  level3State,
  isMobile = false,
  visible = true,
}) => {
  const [showFullMapModal, setShowFullMapModal] = useState<boolean>(false);

  // 1. Determine current authoritative active destination based on active level & phase
  const currentObjective: ObjectiveInfo = useMemo(() => {
    if (activeLevel === LevelId.LEVEL_1) {
      const hasBag = !!pathrikaProgress?.hasPaperBag;
      const count = pathrikaProgress?.totalCollected ?? 0;

      if (!hasBag) {
        return {
          id: 'l1_pickup_bag',
          shortLabel: 'Paper Bag',
          title: 'Pick Up Paper Bag',
          subtitle: 'Beside Ganesh Mandapam',
          x: 3.2,
          z: 5.0,
          color: '#f59e0b',
          accentColor: '#fbbf24',
        };
      }

      if (count < 21) {
        return {
          id: 'l1_collect_leaves',
          shortLabel: `Leaves (${count}/21)`,
          title: 'Sacred Forest Grove',
          subtitle: `Collect 21 Leaves (${count}/21 gathered)`,
          x: 26.0,
          z: -42.0,
          color: '#10b981',
          accentColor: '#34d399',
        };
      }

      return {
        id: 'l1_submit_leaves',
        shortLabel: 'Submit Leaves',
        title: 'Ganesh Mandapam',
        subtitle: 'Submit sacred offerings at altar',
        x: 0.0,
        z: 4.0,
        color: '#f59e0b',
        accentColor: '#fbbf24',
      };
    }

    if (activeLevel === LevelId.LEVEL_2) {
      const phase = level2State?.phase || 'MANDAPAM_START_DIALOGUE';

      if (phase === 'MANDAPAM_START_DIALOGUE' || !level2State?.taskGiven) {
        return {
          id: 'l2_speak_shastri',
          shortLabel: 'Mandapam',
          title: 'Speak to Shastri Garu',
          subtitle: 'At Ganesh Mandapam',
          x: 0.0,
          z: 4.0,
          color: '#f59e0b',
          accentColor: '#fbbf24',
        };
      }

      if (phase === 'GO_TO_CAR') {
        return {
          id: 'l2_board_car',
          shortLabel: "Ramu's Car",
          title: 'Board Exploration Car',
          subtitle: 'South Village Gate',
          x: 5.6,
          z: 27.8,
          color: '#8b5cf6',
          accentColor: '#a78bfa',
        };
      }

      if (phase === 'DRIVE_TO_CITY' || phase === 'APPROACH_AYYAGARU') {
        return {
          id: 'l2_drive_city',
          shortLabel: 'Modern City',
          title: "Ayyagaru's Veranda",
          subtitle: 'Highway NH-65 to City Avenue',
          x: 184.5,
          z: -15.0,
          color: '#f97316',
          accentColor: '#fb923c',
        };
      }

      if (phase === 'TALK_TO_AYYAGARU') {
        return {
          id: 'l2_meet_ayyagaru',
          shortLabel: 'Ayyagaru',
          title: 'Pick Up Ayyagaru',
          subtitle: 'Outside his residence veranda',
          x: 184.5,
          z: -15.0,
          color: '#f97316',
          accentColor: '#fb923c',
        };
      }

      if (phase === 'DRIVE_BACK_MANDAPAM') {
        return {
          id: 'l2_drive_back',
          shortLabel: 'Mandapam',
          title: 'Return to Mandapam',
          subtitle: 'Escort Ayyagaru to celebration',
          x: 0.0,
          z: 4.0,
          color: '#f59e0b',
          accentColor: '#fbbf24',
        };
      }

      return {
        id: 'l2_arrived',
        shortLabel: 'Mandapam',
        title: 'Celebration at Mandapam',
        subtitle: 'Utsavam celebration begins!',
        x: 0.0,
        z: 4.0,
        color: '#10b981',
        accentColor: '#34d399',
      };
    }

    // Level 3 (Nimajjanam)
    const l3Phase = level3State?.phase || 'MANDAPAM_START_DIALOGUE';
    if (l3Phase === 'MANDAPAM_START_DIALOGUE') {
      return {
        id: 'l3_start',
        shortLabel: 'Mandapam',
        title: 'Prepare with Ayyagaru',
        subtitle: 'At Ganesh Mandapam',
        x: 0.0,
        z: 4.0,
        color: '#f59e0b',
        accentColor: '#fbbf24',
      };
    }

    return {
      id: 'l3_escort_home',
      shortLabel: "Ayyagaru's Home",
      title: 'Escort Ayyagaru Home',
      subtitle: 'Modern City Grand Avenue',
      x: 184.5,
      z: -15.0,
      color: '#f97316',
      accentColor: '#fb923c',
    };
  }, [activeLevel, pathrikaProgress, level2State, level3State]);

  // 2. Only show key context-relevant landmarks to prevent clutter
  const relevantLandmarks: RelevantLandmark[] = useMemo(() => {
    const list: RelevantLandmark[] = [];

    // Ganesh Mandapam is always a meaningful anchor
    if (currentObjective.id !== 'l1_submit_leaves' && currentObjective.id !== 'l2_speak_shastri') {
      list.push({ id: 'mandapam', name: 'Mandapam', x: 0.0, z: 4.0, color: '#f59e0b' });
    }

    // Show car location if player is on foot in Level 2 or 3
    if (!isDriving && (activeLevel === LevelId.LEVEL_2 || activeLevel === LevelId.LEVEL_3)) {
      list.push({ id: 'car', name: 'Car', x: 5.6, z: 27.8, color: '#8b5cf6' });
    }

    return list;
  }, [currentObjective, isDriving, activeLevel]);

  // 3. Compute live Euclidean distance & cardinal direction to active target
  const { distanceMeters, cardinalDirection } = useMemo(() => {
    const dx = currentObjective.x - playerCoords.x;
    const dz = currentObjective.z - playerCoords.z;
    const dist = Math.round(Math.hypot(dx, dz));

    const angleRad = Math.atan2(dz, dx);
    const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;

    let dir = 'N';
    if (angleDeg >= 337.5 || angleDeg < 22.5) dir = 'E';
    else if (angleDeg >= 22.5 && angleDeg < 67.5) dir = 'SE';
    else if (angleDeg >= 67.5 && angleDeg < 112.5) dir = 'S';
    else if (angleDeg >= 112.5 && angleDeg < 157.5) dir = 'SW';
    else if (angleDeg >= 157.5 && angleDeg < 202.5) dir = 'W';
    else if (angleDeg >= 202.5 && angleDeg < 247.5) dir = 'NW';
    else if (angleDeg >= 247.5 && angleDeg < 292.5) dir = 'N';
    else if (angleDeg >= 292.5 && angleDeg < 337.5) dir = 'NE';

    return {
      distanceMeters: dist,
      cardinalDirection: dir,
    };
  }, [currentObjective, playerCoords]);

  // 4. Adaptive dynamic zoom: close when walking nearby, automatically zoom out when far away/driving
  const zoomFactor = useMemo(() => {
    if (distanceMeters < 35) return 1.1;
    if (distanceMeters < 80) return 0.75;
    return 0.45;
  }, [distanceMeters]);

  // Radar geometry (viewBox 0 0 200 200, center 100, 100, radius 90)
  const radarRadius = 88;
  const radarCenter = 100;

  const transformToRadar = (wx: number, wz: number) => {
    const dx = (wx - playerCoords.x) * zoomFactor;
    const dy = (wz - playerCoords.z) * zoomFactor;

    const distFromCenter = Math.hypot(dx, dy);
    const isOffScreen = distFromCenter > radarRadius - 12;

    if (isOffScreen) {
      const clampAngle = Math.atan2(dy, dx);
      const clampedDist = radarRadius - 12;
      return {
        x: radarCenter + Math.cos(clampAngle) * clampedDist,
        y: radarCenter + Math.sin(clampAngle) * clampedDist,
        isOffScreen: true,
        angleDeg: (clampAngle * 180) / Math.PI,
      };
    }

    return {
      x: radarCenter + dx,
      y: radarCenter + dy,
      isOffScreen: false,
      angleDeg: (Math.atan2(dy, dx) * 180) / Math.PI,
    };
  };

  const activeTargetPos = transformToRadar(currentObjective.x, currentObjective.z);

  // Player arrow rotation in degrees
  const playerPointerAngleDeg = useMemo(() => {
    return ((playerHeading * 180) / Math.PI + 360) % 360;
  }, [playerHeading]);

  if (!visible) return null;

  return (
    <>
      {/* Mini-Map HUD Container: Positioned in the left corner below player name */}
      <div
        id="minimap-hud-container"
        className="absolute top-14 sm:top-16 md:top-20 left-3 sm:left-4 md:left-6 z-20 flex flex-col items-start pointer-events-none select-none"
      >
        {/* Compact Circular Map Widget */}
        <div
          id="minimap-compact-widget"
          onClick={() => setShowFullMapModal(true)}
          className="pointer-events-auto cursor-pointer group flex flex-col items-start transition-transform active:scale-95"
          title="Click to view detailed World Map"
        >
          {/* Circular Map Frame */}
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-full overflow-hidden bg-stone-950/90 border-2 border-amber-500/50 shadow-xl backdrop-blur-md ring-1 ring-amber-500/20">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                {/* Subtle dark amber gradient fill */}
                <radialGradient id="miniMapGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#78350f" stopOpacity="0.25" />
                  <stop offset="70%" stopColor="#1c1917" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0c0a09" stopOpacity="0.95" />
                </radialGradient>
              </defs>

              {/* Background */}
              <circle cx="100" cy="100" r="95" fill="url(#miniMapGlow)" />

              {/* Single Subtle Range Ring (50m boundary) */}
              <circle
                cx="100"
                cy="100"
                r="50"
                fill="none"
                stroke="#d97706"
                strokeWidth="0.75"
                strokeDasharray="2 3"
                opacity="0.3"
              />

              {/* Subtle Crosshairs */}
              <line x1="100" y1="12" x2="100" y2="188" stroke="#d97706" strokeWidth="0.5" opacity="0.25" />
              <line x1="12" y1="100" x2="188" y2="100" stroke="#d97706" strokeWidth="0.5" opacity="0.25" />

              {/* Direct Trajectory Guide Line from Player toward Destination */}
              <line
                x1="100"
                y1="100"
                x2={activeTargetPos.x}
                y2={activeTargetPos.y}
                stroke={currentObjective.accentColor}
                strokeWidth="1.5"
                strokeDasharray="3 2"
                opacity="0.75"
              />

              {/* Context Relevant Secondary Landmarks */}
              {relevantLandmarks.map((lm) => {
                const pos = transformToRadar(lm.x, lm.z);
                if (pos.isOffScreen) return null;
                return (
                  <circle
                    key={lm.id}
                    cx={pos.x}
                    cy={pos.y}
                    r="3"
                    fill={lm.color}
                    opacity="0.6"
                    stroke="#000000"
                    strokeWidth="0.5"
                  />
                );
              })}

              {/* Active Primary Objective Destination */}
              {activeTargetPos.isOffScreen ? (
                /* Clean Off-Screen Directional Clamping Arrow on Edge */
                <g transform={`translate(${activeTargetPos.x}, ${activeTargetPos.y}) rotate(${activeTargetPos.angleDeg})`}>
                  <polygon
                    points="0,-7 9,0 0,7"
                    fill={currentObjective.color}
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                </g>
              ) : (
                /* On-Screen Distinct Beacon */
                <g transform={`translate(${activeTargetPos.x}, ${activeTargetPos.y})`}>
                  <circle
                    r="7"
                    fill={currentObjective.color}
                    opacity="0.3"
                    className="animate-ping"
                  />
                  <circle
                    r="5"
                    fill={currentObjective.color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <circle r="2" fill="#ffffff" />
                </g>
              )}

              {/* North Indicator on Rim */}
              <text
                x="100"
                y="16"
                fill="#ef4444"
                fontSize="10"
                fontWeight="900"
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="sans-serif"
                opacity="0.9"
              >
                N
              </text>

              {/* Central Player Marker (Ramu / Car) */}
              <g transform="translate(100, 100)">
                {/* Soft pulse aura */}
                <circle r="9" fill="#f59e0b" opacity="0.25" className="animate-pulse" />
                <circle r="4" fill="#0c0a09" stroke="#fbbf24" strokeWidth="1.5" />

                {/* Direction pointer */}
                <g transform={`rotate(${playerPointerAngleDeg})`}>
                  {isDriving ? (
                    <path d="M-3,-6 L3,-6 L4,4 L-4,4 Z" fill="#8b5cf6" stroke="#ffffff" strokeWidth="0.75" />
                  ) : (
                    <polygon points="0,-7 4,3 0,1 -4,3" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.75" />
                  )}
                </g>
              </g>
            </svg>
          </div>

          {/* Compact Destination Pill Underneath */}
          <div className="mt-1 px-2 py-0.5 rounded-full bg-stone-950/85 border border-amber-500/30 shadow-md backdrop-blur-sm flex items-center gap-1 max-w-[100px] sm:max-w-[115px] truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-200 truncate">
              {currentObjective.shortLabel}
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono text-amber-400 font-black flex-shrink-0 ml-auto">
              {distanceMeters}m
            </span>
          </div>
        </div>
      </div>

      {/* Optional Full World Map Modal (Opens only when player explicitly taps the mini-map) */}
      <AnimatePresence>
        {showFullMapModal && (
          <div
            id="world-map-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md select-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-xl bg-stone-900 border border-amber-500/50 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col gap-3.5 text-stone-100 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black font-cinzel text-amber-200 tracking-wider">
                      WORLD MAP & OBJECTIVES
                    </h2>
                    <p className="text-[10px] sm:text-xs text-stone-400">
                      Destination: {currentObjective.title} • {distanceMeters}m away ({cardinalDirection})
                    </p>
                  </div>
                </div>

                <button
                  id="close-world-map-modal-btn"
                  type="button"
                  onClick={() => setShowFullMapModal(false)}
                  className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-600 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* World Map Graphic */}
              <div className="relative w-full aspect-[16/10] bg-stone-950 rounded-xl border border-amber-500/30 overflow-hidden shadow-inner">
                <svg viewBox="-60 -65 285 130" className="w-full h-full select-none">
                  {/* Background Grid */}
                  <rect x="-60" y="-65" width="285" height="130" fill="#1c1917" />

                  {/* River Kalyani */}
                  <path
                    d="M -38 -65 C -42 -20, -32 20, -36 65"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="14"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                  <text x="-48" y="0" fill="#38bdf8" fontSize="6" fontWeight="bold" transform="rotate(-90 -48 0)">
                    Kalyani River
                  </text>

                  {/* Village Area */}
                  <rect
                    x="-25"
                    y="-25"
                    width="50"
                    height="50"
                    rx="8"
                    fill="#78350f"
                    fillOpacity="0.15"
                    stroke="#d97706"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <text x="0" y="-12" fill="#fef3c7" fontSize="7" fontWeight="bold" textAnchor="middle">
                    Rangastalam Village
                  </text>

                  {/* Sacred Forest */}
                  <circle
                    cx="26"
                    cy="-42"
                    r="18"
                    fill="#065f46"
                    fillOpacity="0.25"
                    stroke="#10b981"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <text x="26" y="-42" fill="#6ee7b7" fontSize="6" fontWeight="bold" textAnchor="middle">
                    Sacred Forest
                  </text>

                  {/* Highway NH-65 */}
                  <path
                    d="M 5 28 C 20 40, 40 56, 75 50 C 110 44, 150 40, 188 36"
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="5"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                  <text x="95" y="44" fill="#fb923c" fontSize="5" fontWeight="bold">
                    Highway NH-65
                  </text>

                  {/* Modern City */}
                  <rect
                    x="160"
                    y="-35"
                    width="55"
                    height="75"
                    rx="6"
                    fill="#1e293b"
                    fillOpacity="0.3"
                    stroke="#38bdf8"
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                  <text x="187" y="-22" fill="#7dd3fc" fontSize="6" fontWeight="bold" textAnchor="middle">
                    Modern City
                  </text>

                  {/* Active Route Line from Player to Destination */}
                  <line
                    x1={playerCoords.x}
                    y1={playerCoords.z}
                    x2={currentObjective.x}
                    y2={currentObjective.z}
                    stroke={currentObjective.color}
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    opacity="0.85"
                  />

                  {/* Active Objective Pin */}
                  <g transform={`translate(${currentObjective.x}, ${currentObjective.z})`}>
                    <circle r="6" fill={currentObjective.color} opacity="0.3" className="animate-ping" />
                    <circle r="4.5" fill={currentObjective.color} stroke="#ffffff" strokeWidth="1.2" />
                    <text
                      x="0"
                      y="-7"
                      fill="#fef08a"
                      fontSize="5"
                      fontWeight="bold"
                      textAnchor="middle"
                      stroke="#000000"
                      strokeWidth="0.5"
                    >
                      {currentObjective.shortLabel}
                    </text>
                  </g>

                  {/* Player Position Pin */}
                  <g transform={`translate(${playerCoords.x}, ${playerCoords.z})`}>
                    <circle r="6" fill="#f59e0b" opacity="0.4" className="animate-ping" />
                    <circle r="4" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />
                    <g transform={`rotate(${((playerHeading * 180) / Math.PI + 360) % 360})`}>
                      <polygon points="0,-6 2.5,2.5 0,1 -2.5,2.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.6" />
                    </g>
                  </g>
                </svg>

                {/* Telemetry Bar */}
                <div className="absolute bottom-2 left-2 text-[9px] font-mono text-amber-300/80 bg-stone-950/80 px-2 py-0.5 rounded border border-amber-500/20">
                  Ramu: X {playerCoords.x}, Z {playerCoords.z} • Target: {distanceMeters}m ({cardinalDirection})
                </div>
              </div>

              {/* Active Task Summary Card */}
              <div className="p-3 rounded-xl bg-stone-950/70 border border-amber-500/40 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>CURRENT OBJECTIVE</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white">
                    {currentObjective.title}
                  </div>
                  <div className="text-[10px] text-stone-300">
                    {currentObjective.subtitle}
                  </div>
                </div>

                <div className="flex flex-col items-end text-xs font-mono font-bold text-amber-300">
                  <span className="text-sm font-black text-amber-400">{distanceMeters}m</span>
                  <span className="text-[10px] text-stone-400">Dir: {cardinalDirection}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
