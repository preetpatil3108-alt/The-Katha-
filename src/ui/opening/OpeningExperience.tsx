/**
 * THE KATHA - Opening Experience
 * Ganesh Chaturthi-inspired animated introduction.
 * Features floating flowers, soft golden particles, flickering diyas,
 * marigold garlands, and simple premium typography.
 */

import React, { useEffect, useRef } from 'react';
import { audioManager } from '../../core/audio/AudioManager';
import { Sparkles, ArrowRight } from 'lucide-react';

interface OpeningExperienceProps {
  onContinue: () => void;
}

export const OpeningExperience: React.FC<OpeningExperienceProps> = ({ onContinue }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Floating flowers & soft golden particles canvas simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool (marigold petals and golden light sparkles)
    interface Particle {
      x: number;
      y: number;
      radius: number;
      speedY: number;
      speedX: number;
      rotation: number;
      rotationSpeed: number;
      type: 'petal_orange' | 'petal_yellow' | 'sparkle';
      opacity: number;
      sinOffset: number;
    }

    const particles: Particle[] = [];
    const count = 38; // Elegant, not overloaded

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 5 + 4,
        speedY: Math.random() * 0.7 + 0.4,
        speedX: Math.random() * 0.6 - 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        type: i % 3 === 0 ? 'sparkle' : i % 2 === 0 ? 'petal_orange' : 'petal_yellow',
        opacity: Math.random() * 0.5 + 0.3,
        sinOffset: Math.random() * 10,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const time = Date.now() * 0.0015;

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += Math.sin(time + p.sinOffset) * 0.5;
        p.rotation += p.rotationSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;

        if (p.type === 'sparkle') {
          // Soft golden light orb
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius * 1.5);
          grad.addColorStop(0, '#fef08a');
          grad.addColorStop(0.5, '#f59e0b');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius * 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Rounded stylized marigold petal
          ctx.fillStyle = p.type === 'petal_orange' ? '#f97316' : '#facc15';
          ctx.beginPath();
          ctx.ellipse(0, 0, p.radius, p.radius * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleEnter = () => {
    audioManager.playSound('button_tap');
    audioManager.startAmbientBgm();
    onContinue();
  };

  return (
    <div
      id="opening-experience-screen"
      className="relative w-full h-full bg-stone-950 flex flex-col items-center justify-center p-4 overflow-hidden select-none"
    >
      {/* Background Soft Radiant Gradient */}
      <div className="absolute inset-0 bg-radial from-amber-900/30 via-stone-950 to-stone-950 pointer-events-none" />

      {/* Floating Flowers & Golden Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Top Auspicious Marigold Garlands (Toran) */}
      <div className="absolute top-0 inset-x-0 flex justify-around pointer-events-none z-20 opacity-85">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center -mt-2 animate-pulse" style={{ animationDuration: `${3 + (i % 3)}s` }}>
            <div className="w-1 h-6 bg-amber-700/60" />
            <div className="w-6 h-6 rounded-full bg-gradient-to-b from-orange-500 to-amber-500 border border-amber-300 shadow-sm" />
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-amber-400 to-yellow-500 -mt-1 shadow-sm" />
            <div className="w-3.5 h-3.5 rounded-full bg-orange-600 -mt-0.5 shadow-sm" />
          </div>
        ))}
      </div>

      {/* Center Sacred Geometric Rangoli Medallion */}
      <div className="relative z-20 flex flex-col items-center max-w-xl text-center">
        <div className="relative w-36 h-36 md:w-44 md:h-44 mb-6 flex items-center justify-center">
          {/* Subtle spinning rangoli ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/40 animate-spin"
            style={{ animationDuration: '45s' }}
          />
          <div
            className="absolute inset-3 rounded-full border border-amber-400/30 animate-spin"
            style={{ animationDuration: '30s', animationDirection: 'reverse' }}
          />

          {/* Central Diya Lamp with Flickering Golden Flame */}
          <div className="relative flex flex-col items-center">
            {/* Flickering Flame */}
            <div className="relative w-6 h-10 flex items-center justify-center -mb-1 animate-pulse">
              <div className="w-5 h-8 bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-100 rounded-full blur-[0.8px] shadow-lg shadow-amber-400/60" />
              <div className="absolute w-2 h-4 bg-white/90 rounded-full" />
            </div>
            {/* Clay Diya Base */}
            <div className="w-16 h-6 bg-gradient-to-b from-amber-700 to-stone-800 rounded-b-full border-t-2 border-amber-400/80 shadow-md flex items-center justify-center">
              <div className="w-10 h-1 bg-amber-400/60 rounded-full" />
            </div>
          </div>
        </div>

        {/* Association Attribution */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-900/80 border border-amber-500/40 text-amber-300 text-xs font-semibold uppercase tracking-widest mb-3 backdrop-blur-md shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Millennials Youth Association • Rangastalam</span>
        </div>

        {/* Main Title with Simple Premium Typography */}
        <h1 className="text-4xl md:text-6xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-orange-300 tracking-[0.15em] mb-2 drop-shadow-md">
          THE KATHA
        </h1>

        {/* Elegant Festival Subtitle */}
        <p className="text-sm md:text-base text-amber-200/90 font-medium tracking-wide mb-8 max-w-md">
          A Celebration of Vinayaka Chavithi, Community & Devotion
        </p>

        {/* Interactive Enter Button */}
        <button
          id="opening-enter-btn"
          type="button"
          onClick={handleEnter}
          className="group flex items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold text-base shadow-xl shadow-amber-950/60 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span>Begin Experience</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Bottom Pair of Small Warm Lamps (Diyas) */}
      <div className="absolute bottom-6 inset-x-8 md:inset-x-20 flex justify-between pointer-events-none z-20 opacity-80">
        {/* Left Diya */}
        <div className="flex flex-col items-center">
          <div className="w-4 h-6 bg-gradient-to-t from-orange-500 to-amber-300 rounded-full blur-[0.6px] animate-pulse" />
          <div className="w-10 h-4 bg-amber-800 rounded-b-full border-t border-amber-400" />
        </div>
        {/* Right Diya */}
        <div className="flex flex-col items-center">
          <div className="w-4 h-6 bg-gradient-to-t from-orange-500 to-amber-300 rounded-full blur-[0.6px] animate-pulse" />
          <div className="w-10 h-4 bg-amber-800 rounded-b-full border-t border-amber-400" />
        </div>
      </div>
    </div>
  );
};
