/**
 * THE KATHA - Mobile Orientation Warning
 * Prompts player to rotate mobile device to landscape (16:9) for optimal experience.
 */

import React from 'react';
import { Smartphone, RotateCw } from 'lucide-react';
import { useDeviceDetection } from '../../core/device/DeviceDetection';

export const OrientationWarning: React.FC = () => {
  const device = useDeviceDetection();

  // Only prompt on actual handheld touch devices (phones/tablets) in portrait mode
  if (!device.isTouchDevice || !device.isPortrait) return null;

  return (
    <aside
      aria-label="Screen orientation advice"
      id="orientation-warning-banner"
      className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-3 z-50 pointer-events-auto animate-fade-in"
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-950/90 border border-amber-400/60 shadow-xl backdrop-blur-md text-amber-100 text-xs font-semibold">
        <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-300 flex items-center justify-center text-amber-300 animate-spin" style={{ animationDuration: '6s' }}>
          <RotateCw className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-1.5 leading-tight">
          <Smartphone className="w-3.5 h-3.5 text-amber-300 shrink-0 rotate-90" />
          <span>Rotate device to landscape for the best experience.</span>
        </div>
      </div>
    </aside>
  );
};
