/**
 * THE KATHA - Location Splash Banner
 * Displays "RANGASTALAM" when entering Level 0.
 * Refined Indian festival aesthetic with subtle rangoli border and marigold styling.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MapPin } from 'lucide-react';

interface LocationBannerProps {
  locationName: string;
  subtitle?: string;
  durationMs?: number;
}

export const LocationBanner: React.FC<LocationBannerProps> = ({
  locationName = 'RANGASTALAM',
  subtitle = 'Millennials Youth Association • Vinayaka Chavithi',
  durationMs = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="location-splash-banner"
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center"
        >
          <div className="relative px-6 py-2.5 rounded-2xl bg-gradient-to-b from-stone-900/90 via-stone-900/85 to-amber-950/90 backdrop-blur-md border border-amber-500/50 shadow-2xl shadow-amber-950/60 flex flex-col items-center">
            {/* Top decorative Rangoli accent line */}
            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-amber-400" />
              <MapPin className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="w-8 h-[1px] bg-gradient-to-l from-transparent via-amber-400 to-amber-400" />
            </div>

            {/* Location Title */}
            <h1 className="text-2xl md:text-3xl font-black text-amber-100 tracking-widest uppercase font-serif drop-shadow-md">
              {locationName}
            </h1>

            {/* Subtitle */}
            <p className="text-[11px] md:text-xs text-amber-300/90 font-medium tracking-wider flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {subtitle}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
