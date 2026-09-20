/**
 * THE KATHA - Mobile Virtual Joystick
 * Polished touch-friendly joystick located at bottom-left during gameplay.
 * Features:
 * - Smooth analog directional input (-1 to 1) sent to InputManager
 * - Instant elastic return-to-center on release
 * - Pointer-capture for flawless tracking across screen edges
 * - Does not interfere with action buttons or camera orbiting
 * - Strictly controls RAMU ONLY
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { inputManager } from '../../engine/controls/InputManager';

interface VirtualJoystickProps {
  onInteract?: () => void;
  isDriving?: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onInteract, isDriving = false }) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isEngaged, setIsEngaged] = useState<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);

  const maxRadius = 46; // Maximum physical knob travel radius

  const updateKnobFromCoords = useCallback((clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setKnobPos({ x: knobX, y: knobY });

    // Normalize coordinates for InputManager:
    // X: -1 (left) to 1 (right)
    // Z: -1 (forward/up) to 1 (backward/down)
    const normX = knobX / maxRadius;
    const normZ = knobY / maxRadius;
    inputManager.setJoystick(normX, normZ);
  }, [maxRadius]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    activePointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback if pointer capture unsupported
    }
    setIsEngaged(true);
    updateKnobFromCoords(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId || !isEngaged) return;
    e.stopPropagation();
    updateKnobFromCoords(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current === e.pointerId) {
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch
      }
      resetKnob();
    }
  };

  const resetKnob = useCallback(() => {
    setIsEngaged(false);
    activePointerIdRef.current = null;
    setKnobPos({ x: 0, y: 0 });
    inputManager.setJoystick(0, 0);
  }, []);

  useEffect(() => {
    return () => {
      inputManager.setJoystick(0, 0);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none flex justify-between items-end p-4 md:p-8 select-none z-20">
      {/* Bottom-Left Virtual Joystick Base */}
      <div
        id="virtual-joystick-container"
        ref={joystickBaseRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="pointer-events-auto relative w-32 h-32 md:w-36 md:h-36 rounded-full bg-stone-950/60 backdrop-blur-md border-2 border-amber-400/60 shadow-2xl flex items-center justify-center touch-none transition-shadow duration-200 active:shadow-amber-500/30"
        style={{
          boxShadow: isEngaged ? '0 0 25px rgba(245, 158, 11, 0.4)' : undefined,
        }}
      >
        {/* Decorative Festive Inner Boundary Rings */}
        <div className="w-20 h-20 rounded-full border border-amber-400/30 pointer-events-none" />
        <div className="absolute w-8 h-8 rounded-full border border-amber-400/20 pointer-events-none" />

        {/* Direction markers */}
        <span className="absolute top-1 text-[11px] font-bold text-amber-300/70 pointer-events-none">W</span>
        <span className="absolute bottom-1 text-[11px] font-bold text-amber-300/70 pointer-events-none">S</span>
        <span className="absolute left-1.5 text-[11px] font-bold text-amber-300/70 pointer-events-none">A</span>
        <span className="absolute right-1.5 text-[11px] font-bold text-amber-300/70 pointer-events-none">D</span>

        {/* Floating / Sliding Knob with Return-to-Center */}
        <div
          id="joystick-knob"
          className={`absolute w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 border-2 border-amber-200 shadow-xl flex items-center justify-center pointer-events-none ${
            isEngaged ? 'transition-none' : 'transition-transform duration-150 ease-out'
          }`}
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        >
          {/* Knob Center Grip Accent */}
          <div className="w-5 h-5 rounded-full bg-stone-950/30 border border-white/60 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};
