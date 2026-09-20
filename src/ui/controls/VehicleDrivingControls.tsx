import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ChevronUp, Disc } from 'lucide-react';
import { inputManager } from '../../engine/controls/InputManager';

export const VehicleDrivingControls: React.FC = () => {
  const [activeSteer, setActiveSteer] = useState<'left' | 'right' | null>(null);
  const [activePedal, setActivePedal] = useState<'accel' | 'brake' | null>(null);

  // Active pointer IDs for robust multi-touch tracking
  const leftPointerIdRef = useRef<number | null>(null);
  const rightPointerIdRef = useRef<number | null>(null);
  const accelPointerIdRef = useRef<number | null>(null);
  const brakePointerIdRef = useRef<number | null>(null);

  // Safely cleanup and reset vehicle inputs on unmount
  useEffect(() => {
    return () => {
      inputManager.setDrivingSteer(0);
      inputManager.setDrivingThrottle(0);
      inputManager.setDrivingBrake(0);
    };
  }, []);

  // Left steering handlers
  const handleSteerLeftDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    leftPointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }
    setActiveSteer('left');
    inputManager.setDrivingSteer(-1);
  }, []);

  const handleSteerLeftUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (leftPointerIdRef.current === e.pointerId) {
      leftPointerIdRef.current = null;
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe fallback
      }
      setActiveSteer(prev => (prev === 'left' ? null : prev));
      inputManager.setDrivingSteer(0);
    }
  }, []);

  // Right steering handlers
  const handleSteerRightDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    rightPointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }
    setActiveSteer('right');
    inputManager.setDrivingSteer(1);
  }, []);

  const handleSteerRightUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (rightPointerIdRef.current === e.pointerId) {
      rightPointerIdRef.current = null;
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe fallback
      }
      setActiveSteer(prev => (prev === 'right' ? null : prev));
      inputManager.setDrivingSteer(0);
    }
  }, []);

  // Accelerator handlers
  const handleAccelDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    accelPointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }
    setActivePedal('accel');
    inputManager.setDrivingThrottle(1);
    inputManager.setDrivingBrake(0);
  }, []);

  const handleAccelUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (accelPointerIdRef.current === e.pointerId) {
      accelPointerIdRef.current = null;
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe fallback
      }
      setActivePedal(prev => (prev === 'accel' ? null : prev));
      inputManager.setDrivingThrottle(0);
    }
  }, []);

  // Brake handlers
  const handleBrakeDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    brakePointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }
    setActivePedal('brake');
    inputManager.setDrivingBrake(1);
    inputManager.setDrivingThrottle(0);
  }, []);

  const handleBrakeUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (brakePointerIdRef.current === e.pointerId) {
      brakePointerIdRef.current = null;
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe fallback
      }
      setActivePedal(prev => (prev === 'brake' ? null : prev));
      inputManager.setDrivingBrake(0);
    }
  }, []);

  return (
    <div
      id="vehicle-driving-controls"
      className="fixed inset-0 pointer-events-none z-40 select-none touch-none"
      style={{
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* =========================================================================
          LEFT SIDE: STEERING BUTTONS (← LEFT / RIGHT →)
          Clear, large, tactile steering buttons positioned at bottom-left
          with generous touch targets for mobile and tablet thumbs.
          ========================================================================= */}
      <div
        id="driving-steering-cluster"
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 md:bottom-8 md:left-8 pointer-events-auto flex items-center gap-2.5 sm:gap-3.5 md:gap-4 touch-none"
        style={{
          left: 'max(1rem, env(safe-area-inset-left))',
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Steering Left Button: ← LEFT */}
        <motion.button
          id="btn-steer-left"
          whileTap={{ scale: 0.94 }}
          onPointerDown={handleSteerLeftDown}
          onPointerUp={handleSteerLeftUp}
          onPointerCancel={handleSteerLeftUp}
          className={`flex flex-col items-center justify-center w-20 sm:w-26 md:w-30 h-16 sm:h-20 md:h-22 rounded-2xl border-2 transition-all cursor-pointer backdrop-blur-md shadow-2xl touch-none ${
            activeSteer === 'left'
              ? 'bg-amber-500 border-yellow-200 text-stone-950 scale-95 shadow-amber-500/60 ring-2 ring-amber-300'
              : 'bg-stone-950/90 border-amber-500/50 text-amber-200 hover:border-amber-400 hover:bg-stone-900/95 active:scale-95'
          }`}
          title="Steer Left (← LEFT)"
        >
          <div className="flex items-center gap-1">
            <ArrowLeft className={`w-6 h-6 sm:w-8 sm:h-8 stroke-[2.5] ${activeSteer === 'left' ? 'text-stone-950' : 'text-amber-400'}`} />
          </div>
          <span className={`text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-wider ${activeSteer === 'left' ? 'text-stone-950' : 'text-amber-200'}`}>
            ← LEFT
          </span>
          <span className={`text-[8px] sm:text-[9px] font-mono font-bold ${activeSteer === 'left' ? 'text-stone-800' : 'text-amber-400/70'}`}>
            [A]
          </span>
        </motion.button>

        {/* Steering Right Button: RIGHT → */}
        <motion.button
          id="btn-steer-right"
          whileTap={{ scale: 0.94 }}
          onPointerDown={handleSteerRightDown}
          onPointerUp={handleSteerRightUp}
          onPointerCancel={handleSteerRightUp}
          className={`flex flex-col items-center justify-center w-20 sm:w-26 md:w-30 h-16 sm:h-20 md:h-22 rounded-2xl border-2 transition-all cursor-pointer backdrop-blur-md shadow-2xl touch-none ${
            activeSteer === 'right'
              ? 'bg-amber-500 border-yellow-200 text-stone-950 scale-95 shadow-amber-500/60 ring-2 ring-amber-300'
              : 'bg-stone-950/90 border-amber-500/50 text-amber-200 hover:border-amber-400 hover:bg-stone-900/95 active:scale-95'
          }`}
          title="Steer Right (RIGHT →)"
        >
          <div className="flex items-center gap-1">
            <ArrowRight className={`w-6 h-6 sm:w-8 sm:h-8 stroke-[2.5] ${activeSteer === 'right' ? 'text-stone-950' : 'text-amber-400'}`} />
          </div>
          <span className={`text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-wider ${activeSteer === 'right' ? 'text-stone-950' : 'text-amber-200'}`}>
            RIGHT →
          </span>
          <span className={`text-[8px] sm:text-[9px] font-mono font-bold ${activeSteer === 'right' ? 'text-stone-800' : 'text-amber-400/70'}`}>
            [D]
          </span>
        </motion.button>
      </div>

      {/* =========================================================================
          RIGHT SIDE: VEHICLE CONTROLS (ACCELERATOR & BRAKE)
          Large, tactile automotive pedals positioned vertically on the right side
          with generous touch areas comfortable for phone and tablet thumbs.
          ========================================================================= */}
      <div
        id="driving-pedals-cluster"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 pointer-events-auto flex flex-col items-end gap-2.5 sm:gap-3.5 md:gap-4 touch-none"
        style={{
          right: 'max(1rem, env(safe-area-inset-right))',
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Top: ACCELERATOR PEDAL */}
        <motion.button
          id="btn-drive-accelerator"
          whileTap={{ scale: 0.96 }}
          onPointerDown={handleAccelDown}
          onPointerUp={handleAccelUp}
          onPointerCancel={handleAccelUp}
          className={`relative flex items-center justify-between w-34 sm:w-44 md:w-48 h-16 sm:h-20 md:h-22 px-4 sm:px-5 rounded-2xl border-2 transition-all cursor-pointer backdrop-blur-md shadow-2xl overflow-hidden touch-none ${
            activePedal === 'accel'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 border-emerald-200 text-stone-950 scale-98 shadow-emerald-500/60 ring-2 ring-emerald-300'
              : 'bg-stone-950/90 border-emerald-500/60 hover:border-emerald-400 text-emerald-100 hover:bg-stone-900/95 active:scale-95'
          }`}
          title="Accelerate / Drive Forward (ACCELERATOR)"
        >
          {/* Subtle top indicator highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-300 opacity-90" />

          <div className="flex flex-col items-start leading-tight">
            <span className={`text-xs sm:text-sm md:text-base font-black uppercase tracking-wider ${activePedal === 'accel' ? 'text-stone-950' : 'text-emerald-300'}`}>
              ACCELERATOR
            </span>
            <span className={`text-[9px] sm:text-[10px] font-mono font-bold ${activePedal === 'accel' ? 'text-stone-800' : 'text-emerald-400/80'}`}>
              FORWARD • [W]
            </span>
          </div>

          <div className={`p-1.5 sm:p-2 rounded-xl border ${activePedal === 'accel' ? 'bg-stone-950/20 border-stone-950/40 text-stone-950' : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'}`}>
            <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
          </div>
        </motion.button>

        {/* Bottom: BRAKE PEDAL */}
        <motion.button
          id="btn-drive-brake"
          whileTap={{ scale: 0.96 }}
          onPointerDown={handleBrakeDown}
          onPointerUp={handleBrakeUp}
          onPointerCancel={handleBrakeUp}
          className={`relative flex items-center justify-between w-34 sm:w-44 md:w-48 h-14 sm:h-17 md:h-19 px-4 sm:px-5 rounded-2xl border-2 transition-all cursor-pointer backdrop-blur-md shadow-2xl overflow-hidden touch-none ${
            activePedal === 'brake'
              ? 'bg-gradient-to-r from-rose-600 to-red-500 border-rose-200 text-stone-950 scale-98 shadow-rose-500/60 ring-2 ring-rose-300'
              : 'bg-stone-950/90 border-rose-500/60 hover:border-rose-400 text-rose-100 hover:bg-stone-900/95 active:scale-95'
          }`}
          title="Brake / Reverse (BRAKE)"
        >
          {/* Subtle top indicator highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-400 opacity-90" />

          <div className="flex flex-col items-start leading-tight">
            <span className={`text-xs sm:text-sm md:text-base font-black uppercase tracking-wider ${activePedal === 'brake' ? 'text-stone-950' : 'text-rose-300'}`}>
              BRAKE
            </span>
            <span className={`text-[9px] sm:text-[10px] font-mono font-bold ${activePedal === 'brake' ? 'text-stone-800' : 'text-rose-400/80'}`}>
              REVERSE • [S]
            </span>
          </div>

          <div className={`p-1.5 sm:p-2 rounded-xl border ${activePedal === 'brake' ? 'bg-stone-950/20 border-stone-950/40 text-stone-950' : 'bg-rose-950/80 border-rose-500/40 text-rose-400'}`}>
            <Disc className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
        </motion.button>
      </div>
    </div>
  );
};
