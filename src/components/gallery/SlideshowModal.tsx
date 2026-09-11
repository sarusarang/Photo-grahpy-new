import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { MediaItem } from '../../types';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
  Clock,
  Music,
} from 'lucide-react';

interface SlideshowModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
  initialIndex?: number;
  galleryTitle?: string;
  clientName?: string;
}

export const SlideshowModal: React.FC<SlideshowModalProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
  galleryTitle = 'Wedding Collection',
  clientName = 'Celebration of Love',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(4); // seconds
  const [progress, setProgress] = useState<number>(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Sync initialIndex when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(Math.max(0, initialIndex), items.length - 1));
      setIsPlaying(true);
      setProgress(0);
    }
  }, [isOpen, initialIndex, items.length]);

  // Gentle acoustic ambient harp/chime tone synthesizer for wedding mood
  const playRomanticChime = useCallback(() => {
    if (!isAudioEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Chord frequencies (warm romantic pentatonic harp notes: C4, G4, C5, E5, G5)
      const chord = [261.63, 329.63, 392.0, 523.25, 659.25];
      const now = ctx.currentTime;

      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.06, now + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.8);
      });
    } catch {
      // Ignore audio policy blocks
    }
  }, [isAudioEnabled]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    setProgress(0);
    playRomanticChime();
  }, [items.length, playRomanticChime]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    setProgress(0);
    playRomanticChime();
  }, [items.length, playRomanticChime]);

  // Autoplay timer with progress bar
  useEffect(() => {
    if (!isOpen || !isPlaying || items.length <= 1) return;

    const intervalStep = 50; // update progress every 50ms
    const totalSteps = (speed * 1000) / intervalStep;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 100 / totalSteps;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, speed, items.length, handleNext]);

  // Auto-hide controls after inactivity
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3500);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];

  return createPortal(
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* Top Progress Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-40">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-rose-300 to-amber-200 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top Header Bar */}
      <div
        className={`relative z-30 flex items-center justify-between px-6 sm:px-10 py-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-amber-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              Animated Slideshow
            </span>
            <span className="text-neutral-500">•</span>
            <span className="text-xs text-neutral-400 font-serif italic">
              {clientName}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-serif tracking-wide text-white">
            {galleryTitle}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio Synthesizer Toggle */}
          <button
            onClick={() => {
              setIsAudioEnabled((prev) => !prev);
              if (!isAudioEnabled) playRomanticChime();
            }}
            title={isAudioEnabled ? 'Mute Ambient Music' : 'Enable Romantic Chimes'}
            className={`p-2.5 rounded-full transition-all flex items-center gap-1.5 text-xs ${
              isAudioEnabled
                ? 'bg-amber-400 text-neutral-950 font-semibold shadow-lg shadow-amber-500/20'
                : 'bg-white/10 hover:bg-white/20 text-neutral-300'
            }`}
          >
            {isAudioEnabled ? (
              <>
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px] font-mono">Chimes Active</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px] font-mono">Chimes Off</span>
              </>
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            title="Close Slideshow (Esc)"
            className="p-2.5 rounded-full bg-white/10 hover:bg-rose-500 text-white transition-all ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Display Area with Smooth Ken-Burns Animated Zoom */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {items.map((item, idx) => {
          const isActive = idx === currentIndex;
          if (!isActive && Math.abs(idx - currentIndex) > 1) return null;

          return (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background ambient blur for aspect-ratio padding */}
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 scale-125 transition-transform duration-1000"
                style={{ backgroundImage: `url(${item.url})` }}
              />

              {/* Main Photo with Ken-Burns pan/zoom */}
              <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12">
                <img
                  src={item.url}
                  alt={item.title}
                  className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-700 ${
                    isActive ? 'animate-kenburns scale-100' : 'scale-95'
                  }`}
                />
              </div>

              {/* Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            </div>
          );
        })}

        {/* Side Click Navigation Arrows */}
        <button
          onClick={handlePrev}
          aria-label="Previous Slide"
          className={`absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all ${
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next Slide"
          className={`absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all ${
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Floating Control Deck */}
      <div
        className={`relative z-30 px-6 sm:px-12 py-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Slide Info & Romantic Quote */}
        <div className="text-center sm:text-left max-w-md">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] font-mono text-neutral-400">
            <span className="text-amber-400 font-bold">
              {currentIndex + 1}
            </span>
            <span>of</span>
            <span>{items.length} Moments</span>
          </div>
          <p className="text-sm sm:text-base font-serif text-white font-medium truncate mt-0.5">
            {currentItem?.title}
          </p>
          {currentItem?.caption && (
            <p className="text-xs font-serif italic text-neutral-400 truncate">
              "{currentItem.caption}"
            </p>
          )}
        </div>

        {/* Playback Controls Center */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
            title="Previous (Arrow Left)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            className="w-12 h-12 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
            title={isPlaying ? 'Pause Slideshow (Space)' : 'Play Slideshow (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
            title="Next (Arrow Right)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Speed / Settings Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase text-neutral-400 hidden sm:inline flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-neutral-500" /> Pace:
          </span>
          <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
            {[3, 5, 8].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSpeed(s);
                  setProgress(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  speed === s
                    ? 'bg-amber-400 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
