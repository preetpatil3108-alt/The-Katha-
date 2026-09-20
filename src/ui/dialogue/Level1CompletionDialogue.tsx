/**
 * THE KATHA - Level 1 Completion Conversation (In-World Compact Dialogue)
 * 
 * In-world conversation between Ramu and Anand (Mandapam Organizer):
 * 1. Ramu: "Our youth association collected ₹20,000. We already ordered the clay Ganesh by paying ₹5,000 in advance. Ganesh will be coming tonight itself. Take this ₹10,000 for the Mandapam arrangements."
 * 2. Anand: "Shabash Ramu! You and your friends have done a magnificent job. With this ₹10,000, we will complete the flower toranams, radiant lighting, and arrange the sacred prasadams. Everything will be grand and ready for Lord Ganesha!"
 * 3. Ramu: "Well, see you tomorrow in Level 2."
 * 
 * Features:
 * - Compact, non-blocking in-world speech bubble anchored to Anand's head/upper-body
 * - Dynamically tracks 3D-to-2D coordinates of Anand as camera or characters move
 * - Clearly indicates when Anand is speaking with active speaker badge and sound indicator
 * - Keeps the 3D world, Ramu, and Anand fully visible without freezing or obscuring the scene
 * - Preserves all dialogue content verbatim with authentic Telugu context
 * - Responsive across desktop, tablet, and mobile screen sizes
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Volume2, Sparkles } from 'lucide-react';
import { audioManager } from '../../core/audio/AudioManager';

export interface DialogueStep {
  speaker: 'ramu' | 'organizer';
  speakerName: string;
  role: string;
  avatarIcon: string;
  avatarColor: string;
  text: string;
  teluguText: string;
  gesture: string;
}

const DIALOGUE_STEPS: DialogueStep[] = [
  {
    speaker: 'ramu',
    speakerName: 'Ramu',
    role: 'Youth Association Leader',
    avatarIcon: 'R',
    avatarColor: 'from-amber-600 to-orange-500',
    text: '“Our youth association collected ₹20,000. We already ordered the clay Ganesh by paying ₹5,000 in advance. Ganesh will be coming tonight itself. Take this ₹10,000 for the Mandapam arrangements.”',
    teluguText: 'మన యూత్ అసోసియేషన్ ₹20,000 సేకరించింది. మట్టి వినాయకుడికి ₹5,000 అడ్వాన్స్ ఇచ్చాం, ఈ రాత్రికే స్వామి వస్తున్నారు. ఈ ₹10,000 మండపం ఏర్పాట్లకు తీసుకోండి.',
    gesture: 'explain',
  },
  {
    speaker: 'organizer',
    speakerName: 'Anand',
    role: 'Mandapam Organizer',
    avatarIcon: '🕉️',
    avatarColor: 'from-orange-700 to-amber-600',
    text: '“Shabash Ramu! You and your friends have done a magnificent job. With this ₹10,000, we will complete the flower toranams, radiant lighting, and arrange the sacred prasadams. Everything will be grand and ready for Lord Ganesha!”',
    teluguText: 'శభాష్ రాము! మీరంతా ఎంతో గొప్ప పని చేశారు. ఈ ₹10,000తో పూల తోరణాలు, విద్యుత్ దీపాలు, ప్రసాదాల ఏర్పాట్లు ఘనంగా పూర్తి చేస్తాం. మండపం స్వామి రాకకు అద్భుతంగా సిద్ధమవుతుంది!',
    gesture: 'namaste',
  },
  {
    speaker: 'ramu',
    speakerName: 'Ramu',
    role: 'Youth Association Leader',
    avatarIcon: 'R',
    avatarColor: 'from-amber-600 to-orange-500',
    text: '“Well, see you tomorrow in Level 2.”',
    teluguText: 'సరే, రేపు లెవెల్ 2లో కలుద్దాం!',
    gesture: 'wave',
  },
];

interface Level1CompletionDialogueProps {
  onComplete: () => void;
  getCharacterScreenPos: (target: 'ramu' | 'organizer') => { x: number; y: number; visible: boolean } | null;
  onSpeakerChange?: (speaker: 'ramu' | 'organizer', gesture: string) => void;
}

export const Level1CompletionDialogue: React.FC<Level1CompletionDialogueProps> = ({
  onComplete,
  getCharacterScreenPos,
  onSpeakerChange,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [revealedChars, setRevealedChars] = useState<number>(0);
  const [isTypingComplete, setIsTypingComplete] = useState<boolean>(false);
  const [bubblePos, setBubblePos] = useState<{
    x: number;
    y: number;
    tailX: number;
    tailPlacement: 'bottom' | 'top' | 'none';
    hasValidProjection: boolean;
  }>({
    x: 200,
    y: 120,
    tailX: 160,
    tailPlacement: 'bottom',
    hasValidProjection: false,
  });

  const step = DIALOGUE_STEPS[currentStepIndex];
  const fullText = step.text;
  const bubbleRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Notify 3D engine of speaker and gesture on step change
  useEffect(() => {
    onSpeakerChange?.(step.speaker, step.gesture);
    setRevealedChars(0);
    setIsTypingComplete(false);
    audioManager.playSound('dialogue_tick');
  }, [currentStepIndex, step.speaker, step.gesture, onSpeakerChange]);

  // Comfortable typewriter effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (revealedChars < fullText.length) {
      timer = setTimeout(() => {
        setRevealedChars((prev) => Math.min(fullText.length, prev + 2));
      }, 16);
    } else {
      setIsTypingComplete(true);
    }
    return () => clearTimeout(timer);
  }, [revealedChars, fullText.length]);

  // Continuous tracking of Anand's 3D head/upper-body position
  useEffect(() => {
    const updatePosition = () => {
      // Anchored to Anand (Mandapam Organizer)
      const anandProj = getCharacterScreenPos('organizer');
      const container = containerRef.current;
      const containerW = container ? container.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 800);
      const containerH = container ? container.clientHeight : (typeof window !== 'undefined' ? window.innerHeight : 450);

      const bubbleW = bubbleRef.current?.offsetWidth || 340;
      const bubbleH = bubbleRef.current?.offsetHeight || 135;

      if (anandProj && anandProj.visible) {
        let idealX = anandProj.x - bubbleW / 2;
        let idealY = anandProj.y - bubbleH - 14;
        let tailPlacement: 'bottom' | 'top' = 'bottom';

        // If Anand's head is near the top edge, place speech bubble right below his head/upper body
        if (idealY < 12) {
          idealY = anandProj.y + 20;
          tailPlacement = 'top';
        }

        // Clamp securely within the active canvas bounds
        const clampedX = Math.max(12, Math.min(containerW - bubbleW - 12, idealX));
        const clampedY = Math.max(12, Math.min(containerH - bubbleH - 12, idealY));

        // Tail follows Anand's exact horizontal center
        const relativeTailX = Math.max(24, Math.min(bubbleW - 24, anandProj.x - clampedX));

        setBubblePos({
          x: clampedX,
          y: clampedY,
          tailX: relativeTailX,
          tailPlacement,
          hasValidProjection: true,
        });
      } else {
        // Fallback: compact placement near top-center if off-screen
        const clampedX = Math.max(12, (containerW - bubbleW) / 2);
        const clampedY = Math.max(16, containerH * 0.18);
        setBubblePos({
          x: clampedX,
          y: clampedY,
          tailX: bubbleW / 2,
          tailPlacement: 'none',
          hasValidProjection: false,
        });
      }

      animFrameRef.current = requestAnimationFrame(updatePosition);
    };

    animFrameRef.current = requestAnimationFrame(updatePosition);
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [getCharacterScreenPos]);

  // Advance dialogue handler
  const handleAdvance = useCallback(() => {
    // If still typing, complete text instantly first
    if (!isTypingComplete) {
      setRevealedChars(fullText.length);
      setIsTypingComplete(true);
      return;
    }

    if (currentStepIndex < DIALOGUE_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      audioManager.playSound('celebration_chime');
      onComplete();
    }
  }, [isTypingComplete, fullText.length, currentStepIndex, onComplete]);

  // Keyboard controls: [E], [Space], [Enter] to advance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleAdvance();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAdvance]);

  const displayedText = fullText.slice(0, revealedChars);
  const isAnandSpeaking = step.speaker === 'organizer';

  return (
    <div
      id="level1-completion-dialogue-layer"
      ref={containerRef}
      className="absolute inset-0 z-40 pointer-events-none overflow-hidden select-none"
    >
      {/* Floating in-world speech bubble anchored close to Anand's head/upper body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`dialogue-step-${currentStepIndex}`}
          ref={bubbleRef}
          initial={{ opacity: 0, scale: 0.92, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: `${bubblePos.x}px`,
            top: `${bubblePos.y}px`,
          }}
          className="pointer-events-auto w-[88vw] max-w-[320px] sm:max-w-[350px] md:max-w-[375px]"
        >
          {/* Main Bubble Card */}
          <div
            id={`dialogue-card-step-${currentStepIndex}`}
            onClick={handleAdvance}
            role="button"
            tabIndex={0}
            className={`relative rounded-2xl p-3 sm:p-3.5 backdrop-blur-md shadow-xl transition-all cursor-pointer ${
              isAnandSpeaking
                ? 'bg-stone-950/95 border-2 border-amber-400 shadow-amber-950/50 hover:border-amber-300'
                : 'bg-stone-950/95 border-2 border-amber-500/70 shadow-stone-950/80 hover:border-amber-400'
            }`}
          >
            {/* Header: Speaker identity & Step Progress */}
            <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-stone-800/80">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr ${step.avatarColor} border border-amber-300/60 flex items-center justify-center text-xs font-black text-stone-950 shadow shrink-0`}
                >
                  {step.avatarIcon.length > 2 ? (
                    <span className="text-xs">{step.avatarIcon}</span>
                  ) : (
                    step.avatarIcon
                  )}
                </div>

                <div className="leading-tight truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-amber-200 tracking-wide">
                      {step.speakerName}
                    </span>
                    {isAnandSpeaking && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-400/40 text-[9px] font-semibold text-amber-300">
                        <Volume2 className="w-2.5 h-2.5 animate-pulse text-amber-400" />
                        Speaking
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-amber-400/80 font-medium truncate">
                    {step.role}
                  </div>
                </div>
              </div>

              {/* Step indicator dots */}
              <div className="flex items-center gap-1 shrink-0">
                {DIALOGUE_STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentStepIndex
                        ? 'w-3.5 bg-amber-400 shadow-xs shadow-amber-400'
                        : idx < currentStepIndex
                        ? 'w-1.5 bg-emerald-400'
                        : 'w-1.5 bg-stone-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Dialogue Text Content */}
            <div className="min-h-[48px] sm:min-h-[54px] flex flex-col justify-between">
              <p className="text-[11.5px] sm:text-[12.5px] text-stone-100 font-medium leading-relaxed font-sans">
                {displayedText}
                {!isTypingComplete && (
                  <span className="inline-block w-1.5 h-3 bg-amber-400 ml-1 animate-pulse" />
                )}
              </p>

              {/* Contextual Telugu Subtitle */}
              {step.teluguText && (
                <p className="text-[9.5px] sm:text-[10.5px] text-amber-300/85 italic font-serif leading-snug mt-1.5 pt-1 border-t border-stone-800/80">
                  {step.teluguText}
                </p>
              )}
            </div>

            {/* Footer Action Prompt */}
            <div className="mt-2 pt-1.5 border-t border-stone-800/80 flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] text-stone-400">
                Press [E] or tap to continue
              </span>

              <button
                type="button"
                id="dialogue-next-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdvance();
                }}
                className="px-2 py-0.5 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] flex items-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <span>{currentStepIndex === DIALOGUE_STEPS.length - 1 ? 'Complete' : 'Next'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* In-World Speech Tail pointing directly toward Anand's head/upper body */}
            {bubblePos.tailPlacement === 'bottom' && (
              <div
                style={{ left: `${bubblePos.tailX}px` }}
                className="absolute -bottom-2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-amber-400 drop-shadow-md pointer-events-none"
              />
            )}
            {bubblePos.tailPlacement === 'top' && (
              <div
                style={{ left: `${bubblePos.tailX}px` }}
                className="absolute -top-2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[7px] border-b-amber-400 drop-shadow-md pointer-events-none"
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
