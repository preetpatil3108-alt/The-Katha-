import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gauge, Users, CheckCircle2, Volume2, LogOut } from 'lucide-react';

interface DrivingHudProps {
  speed: number;
  isBoarding: boolean;
  boardingCount: { seated: number; total: number };
  onHorn: () => void;
  onExit: () => void;
  isMobile?: boolean;
}

export const DrivingHud: React.FC<DrivingHudProps> = ({
  speed,
  isBoarding,
  boardingCount,
  onHorn,
  onExit,
  isMobile = false,
}) => {
  const [isHornActive, setIsHornActive] = useState(false);

  // Speedometer Gauge Arc Geometry Calculations
  const maxDisplaySpeed = 50; // KM/H max speedometer scale
  const normalizedSpeed = Math.min(1, Math.max(0, speed / maxDisplaySpeed));
  const arcRadius = 30;
  const arcCircumference = 2 * Math.PI * arcRadius;
  // 240-degree sweep arc for automotive dial
  const arcSweep = arcCircumference * (240 / 360);
  const strokeDashoffset = arcSweep * (1 - normalizedSpeed);

  const handleHornTrigger = useCallback(() => {
    setIsHornActive(true);
    onHorn();
    setTimeout(() => {
      setIsHornActive(false);
    }, 300);
  }, [onHorn]);

  return (
    <>
      {/* =========================================================================
          BOTTOM-LEFT: COMPACT VEHICLE SPEEDOMETER
          On Mobile/Tablet: Positioned comfortably above left steering buttons with zero overlap.
          On Desktop: Anchors naturally to bottom-left with no awkward empty gap.
          ========================================================================= */}
      <div
        id="driving-hud-speedometer"
        className={`fixed z-40 select-none pointer-events-none transition-all duration-300 ${
          isMobile
            ? 'bottom-26 left-4 sm:bottom-30 sm:left-6 md:bottom-34 md:left-8'
            : 'bottom-6 left-6 md:bottom-8 md:left-8'
        }`}
        style={{
          left: isMobile ? 'max(1rem, env(safe-area-inset-left))' : undefined,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.92 }}
          transition={{ duration: 0.25 }}
          className="relative flex items-center gap-3.5 bg-stone-950/85 backdrop-blur-md border border-amber-500/30 rounded-2xl px-3.5 py-2.5 shadow-2xl shadow-black/80"
        >
          {/* Circular Gauge Graphic */}
          <div className="relative w-16 h-16 md:w-18 md:h-18 flex items-center justify-center">
            <svg className="w-full h-full -rotate-120 transform" viewBox="0 0 80 80">
              {/* Background Track Arc */}
              <circle
                cx="40"
                cy="40"
                r={arcRadius}
                fill="none"
                stroke="#292524"
                strokeWidth="5"
                strokeDasharray={`${arcSweep} ${arcCircumference}`}
                strokeLinecap="round"
              />
              {/* Dynamic Speed Progress Arc */}
              <circle
                cx="40"
                cy="40"
                r={arcRadius}
                fill="none"
                stroke={speed > 35 ? '#f59e0b' : '#eab308'}
                strokeWidth="5.5"
                strokeDasharray={`${arcSweep} ${arcCircumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-100 ease-out"
              />
            </svg>

            {/* Inner Speed Digits */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl md:text-2xl font-black text-amber-100 tracking-tight leading-none font-mono">
                {speed}
              </span>
              <span className="text-[9px] font-bold tracking-widest text-amber-400/80 uppercase leading-tight mt-0.5">
                KM/H
              </span>
            </div>
          </div>

          {/* Speedometer Status Meta */}
          <div className="flex flex-col justify-center gap-1 min-w-[95px] md:min-w-[115px]">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">
                Explorer 4x4
              </span>
            </div>

            {/* Boarding State / Drive Ready Badge */}
            {isBoarding ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[10px] font-bold animate-pulse">
                <Users className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Boarding {boardingCount.seated}/{boardingCount.total}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>All Aboard • Drive</span>
              </div>
            )}

            {/* Transmission Gear Pill */}
            <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400">
              <span>GEAR:</span>
              <span className="px-1.5 py-0.2 rounded bg-stone-900 border border-stone-700 text-amber-400 font-mono">
                {speed === 0 ? 'P' : 'D'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* =========================================================================
          BOTTOM-RIGHT: DEDICATED VEHICLE HORN & EXIT CONTROLS
          On Mobile/Tablet: Positioned above accelerator and brake pedals with zero overlap.
          On Desktop: Anchors naturally to bottom-right with no awkward empty gap.
          ========================================================================= */}
      <div
        id="driving-hud-controls"
        className={`fixed z-40 select-none pointer-events-auto flex flex-col items-end gap-2.5 sm:gap-3 transition-all duration-300 ${
          isMobile
            ? 'bottom-38 right-4 sm:bottom-44 sm:right-6 md:bottom-48 md:right-8'
            : 'bottom-6 right-6 md:bottom-8 md:right-8'
        }`}
        style={{
          right: isMobile ? 'max(1rem, env(safe-area-inset-right))' : undefined,
        }}
      >
        {/* Disembark / Exit Vehicle Button */}
        <motion.button
          id="btn-exit-car"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          onClick={onExit}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-stone-950/85 hover:bg-stone-900 border border-red-500/40 text-red-200 hover:text-red-100 text-xs sm:text-sm font-bold shadow-lg shadow-black/50 cursor-pointer backdrop-blur-sm transition-colors"
          title="Exit vehicle"
        >
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
          <span>EXIT</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950/80 border border-red-500/30 text-red-300 font-mono">
            E
          </span>
        </motion.button>

        {/* Dedicated Automotive Horn Button */}
        <div className="relative">
          {/* Animated soundwave ring ripple on horn press */}
          <AnimatePresence>
            {isHornActive && (
              <motion.div
                initial={{ scale: 0.85, opacity: 0.8 }}
                animate={{ scale: 1.35, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full border-2 border-amber-400 pointer-events-none"
              />
            )}
          </AnimatePresence>

          <motion.button
            id="btn-vehicle-horn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleHornTrigger}
            onTouchStart={(e) => {
              e.preventDefault();
              handleHornTrigger();
            }}
            className={`relative flex flex-col items-center justify-center w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-300 border-2 border-yellow-200/90 text-stone-950 shadow-xl shadow-amber-950/60 cursor-pointer transition-all active:ring-4 active:ring-amber-400/50 ${
              isHornActive ? 'ring-4 ring-amber-300/80 brightness-110' : ''
            }`}
            title="Honk vehicle horn (Hotkey: H)"
          >
            <Volume2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 stroke-[2.5] text-stone-950 drop-shadow-sm" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-stone-950 leading-none mt-0.5">
              HORN
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold text-stone-900/80 font-mono leading-none mt-0.5">
              [H]
            </span>
          </motion.button>
        </div>
      </div>
    </>
  );
};
