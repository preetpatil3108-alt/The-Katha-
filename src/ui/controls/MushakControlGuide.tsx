/**
 * THE KATHA - Mushak Control Guide
 * Mushak (Ganesha's sacred mouse guide) demonstrates controls to the player.
 * Desktop: "Use W A S D to move Ramu." with interactive keys and Mushak pointing.
 * Mobile: "Use the joystick to move Ramu." with pointer pointing toward the bottom-left joystick.
 * Automatically minimizes once Ramu moves, or can be dismissed/expanded anytime.
 */

import React, { useState, useEffect } from 'react';
import { inputManager } from '../../engine/controls/InputManager';
import { Sparkles, Check, ChevronDown, ChevronUp, Hand } from 'lucide-react';

interface MushakControlGuideProps {
  isMobile: boolean;
}

export const MushakControlGuide: React.FC<MushakControlGuideProps> = ({ isMobile }) => {
  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Auto-dismiss or minimize after player successfully moves Ramu
  useEffect(() => {
    let moveFrames = 0;
    const interval = setInterval(() => {
      const input = inputManager.getInput();
      if (input.isMoving) {
        moveFrames++;
        if (moveFrames > 45 && !minimized) {
          setMinimized(true);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [minimized]);

  // Track keyboard highlights on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (['W', 'A', 'S', 'D', 'ARROWUP', 'ARROWLEFT', 'ARROWDOWN', 'ARROWRIGHT'].includes(key)) {
        setActiveKey(key);
      }
    };
    const handleKeyUp = () => {
      setActiveKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  if (dismissed) {
    return null;
  }

  return (
    <div
      id="mushak-control-guide"
      className={`pointer-events-none absolute z-30 transition-all duration-300 ${
        isMobile
          ? 'bottom-36 left-4 max-w-[280px]'
          : 'bottom-8 left-8 max-w-sm'
      }`}
    >
      <div className="pointer-events-auto relative rounded-2xl bg-stone-900/90 backdrop-blur-md border-2 border-amber-500/50 shadow-2xl p-3.5 text-stone-100 flex flex-col gap-2.5">
        {/* Header with Mushak Avatar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Stylized Mushak Icon */}
            <div className="relative w-10 h-10 rounded-full bg-stone-800 border-2 border-amber-400/80 flex items-center justify-center overflow-hidden shadow-md">
              <svg viewBox="0 0 100 100" className="w-8 h-8">
                {/* Ears */}
                <circle cx="28" cy="28" r="18" fill="#78716c" />
                <circle cx="28" cy="28" r="11" fill="#fbcfe8" />
                <circle cx="72" cy="28" r="18" fill="#78716c" />
                <circle cx="72" cy="28" r="11" fill="#fbcfe8" />
                {/* Head */}
                <ellipse cx="50" cy="55" rx="32" ry="28" fill="#78716c" />
                {/* Snout */}
                <ellipse cx="50" cy="64" rx="16" ry="12" fill="#f5f5f4" />
                <ellipse cx="50" cy="58" rx="5" ry="4" fill="#fb7185" />
                {/* Eyes */}
                <ellipse cx="40" cy="48" rx="4" ry="6" fill="#09090b" />
                <circle cx="41" cy="46" r="1.5" fill="#ffffff" />
                <ellipse cx="60" cy="48" rx="4" ry="6" fill="#09090b" />
                <circle cx="61" cy="46" r="1.5" fill="#ffffff" />
                {/* Bell Collar */}
                <path d="M 30 76 Q 50 84 70 76" stroke="#dc2626" strokeWidth="4" fill="none" />
                <circle cx="50" cy="82" r="5" fill="#facc15" />
              </svg>
              {/* Cute glowing halo */}
              <div className="absolute inset-0 rounded-full border border-amber-400/40 pointer-events-none" />
            </div>

            <div>
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <span>Mushak</span>
                <span className="text-[10px] text-amber-400/80 font-normal">• Sacred Guide</span>
              </div>
              <div className="text-[11px] text-stone-300 font-medium">
                {isMobile ? 'Mobile Movement Tip' : 'Desktop Controls'}
              </div>
            </div>
          </div>

          {/* Minimize / Close controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMinimized(!minimized)}
              aria-label={minimized ? 'Expand Guide' : 'Minimize Guide'}
              className="p-1 rounded-md text-amber-300/80 hover:text-amber-200 hover:bg-stone-800 transition-colors"
            >
              {minimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss Guide"
              className="p-1 rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Primary Instructions from User Spec */}
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-100 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs leading-relaxed">
                {isMobile ? (
                  <>
                    <p className="font-semibold text-amber-200">
                      &ldquo;Use the joystick to move Ramu.&rdquo;
                    </p>
                    <p className="text-[11px] text-stone-300 mt-1">
                      Touch and drag the circular pad on the bottom-left. Only Ramu responds to your touch!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-amber-200">
                      &ldquo;Use W A S D to move Ramu.&rdquo;
                    </p>
                    <p className="text-[11px] text-stone-300 mt-1">
                      Press W to walk forward, S for backward, A for left, and D for right. Ramu only!
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Visual Pointer / Key Representation */}
            {isMobile ? (
              <div className="flex items-center justify-between text-[11px] text-amber-300 bg-stone-950/60 p-2 rounded-lg border border-amber-500/20">
                <span className="flex items-center gap-1.5 font-medium">
                  <Hand className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  Mushak points towards the bottom-left joystick ↙
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-stone-950/70 p-2.5 rounded-lg border border-amber-500/20">
                {/* Keyboard WASD graphic */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded border text-xs font-bold flex items-center justify-center transition-all ${
                      activeKey === 'W' || activeKey === 'ARROWUP'
                        ? 'bg-amber-500 text-stone-950 border-amber-300 scale-110 shadow-lg'
                        : 'bg-stone-800 text-amber-200 border-amber-500/40'
                    }`}
                  >
                    W
                  </div>
                  <div className="flex gap-1">
                    <div
                      className={`w-7 h-7 rounded border text-xs font-bold flex items-center justify-center transition-all ${
                        activeKey === 'A' || activeKey === 'ARROWLEFT'
                          ? 'bg-amber-500 text-stone-950 border-amber-300 scale-110 shadow-lg'
                          : 'bg-stone-800 text-amber-200 border-amber-500/40'
                      }`}
                    >
                      A
                    </div>
                    <div
                      className={`w-7 h-7 rounded border text-xs font-bold flex items-center justify-center transition-all ${
                        activeKey === 'S' || activeKey === 'ARROWDOWN'
                          ? 'bg-amber-500 text-stone-950 border-amber-300 scale-110 shadow-lg'
                          : 'bg-stone-800 text-amber-200 border-amber-500/40'
                      }`}
                    >
                      S
                    </div>
                    <div
                      className={`w-7 h-7 rounded border text-xs font-bold flex items-center justify-center transition-all ${
                        activeKey === 'D' || activeKey === 'ARROWRIGHT'
                          ? 'bg-amber-500 text-stone-950 border-amber-300 scale-110 shadow-lg'
                          : 'bg-stone-800 text-amber-200 border-amber-500/40'
                      }`}
                    >
                      D
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-amber-200/90 leading-tight">
                  <span className="font-semibold block text-amber-300">Smooth Cam:</span>
                  <span>Drag mouse to orbit</span>
                  <span className="block text-[10px] text-stone-400 mt-0.5">Scroll to zoom</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
