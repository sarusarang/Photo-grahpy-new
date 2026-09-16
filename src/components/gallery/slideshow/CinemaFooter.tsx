import React, { useState } from 'react';
import type { CinemaColorGrade, CinemaFitMode } from './types';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Settings2,
} from 'lucide-react';

interface CinemaFooterProps {
  visible: boolean;
  currentIndex: number;
  totalItems: number;
  currentTitle?: string;
  isPlaying: boolean;
  speed: number;
  fitMode: CinemaFitMode;
  colorGrade: CinemaColorGrade;
  hasFilmGrain: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  onFitModeChange: (mode: CinemaFitMode) => void;
  onColorGradeChange: (grade: CinemaColorGrade) => void;
  onToggleFilmGrain: () => void;
}

export const CinemaFooter: React.FC<CinemaFooterProps> = ({
  visible,
  currentIndex,
  totalItems,
  currentTitle,
  isPlaying,
  speed,
  fitMode,
  colorGrade,
  hasFilmGrain,
  onPrev,
  onNext,
  onTogglePlay,
  onSpeedChange,
  onFitModeChange,
  onColorGradeChange,
  onToggleFilmGrain,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <footer
      className={`absolute bottom-0 left-0 right-0 z-40 px-6 sm:px-10 py-5 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-300 flex items-center justify-between gap-4 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Left: Minimal Scene Counter & Title */}
      <div className="text-left max-w-xs sm:max-w-sm">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-neutral-400">
          <span className="text-amber-400 font-bold">{currentIndex + 1}</span>
          <span>of</span>
          <span>{totalItems}</span>
        </div>
        <p className="text-xs sm:text-sm font-serif text-white/90 truncate font-light mt-0.5">
          {currentTitle}
        </p>
      </div>

      {/* Center: Play / Pause Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          title="Previous (Arrow Left)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onTogglePlay}
          className="w-11 h-11 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        <button
          onClick={onNext}
          className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          title="Next (Arrow Right)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Settings Popover Toggle */}
      <div className="relative">
        <button
          onClick={() => setShowSettings((prev) => !prev)}
          title="Cinema Screen Settings"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
            showSettings
              ? 'bg-amber-400 text-neutral-950 font-bold'
              : 'bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">{speed}s • {fitMode === 'cover' ? 'Full' : 'Fit'}</span>
        </button>

        {/* Floating Settings Popover */}
        {showSettings && (
          <div className="absolute right-0 bottom-11 p-4 rounded-2xl bg-neutral-950/95 border border-neutral-800 shadow-2xl backdrop-blur-xl w-64 space-y-3.5 z-50 text-xs animate-scale-in">
            {/* Screen Fit Mode */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-neutral-400 font-semibold">Screen Fit</span>
              <div className="grid grid-cols-2 gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                <button
                  onClick={() => onFitModeChange('cover')}
                  className={`py-1 text-[10px] font-mono rounded-lg transition-all ${
                    fitMode === 'cover'
                      ? 'bg-amber-400 text-neutral-950 font-bold shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Full Screen (Fill)
                </button>
                <button
                  onClick={() => onFitModeChange('contain')}
                  className={`py-1 text-[10px] font-mono rounded-lg transition-all ${
                    fitMode === 'contain'
                      ? 'bg-amber-400 text-neutral-950 font-bold shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Fit Photo (Aspect)
                </button>
              </div>
            </div>

            {/* Color Tone Grade */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-neutral-400 font-semibold">Color Grade</span>
              <div className="grid grid-cols-4 gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                {(
                  [
                    { id: 'gold', label: 'Gold' },
                    { id: 'noir', label: 'Noir' },
                    { id: 'romance', label: 'Pastel' },
                    { id: 'natural', label: 'Raw' },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onColorGradeChange(g.id)}
                    className={`py-1 text-[10px] font-mono rounded-lg transition-all ${
                      colorGrade === g.id
                        ? 'bg-white text-neutral-950 font-bold shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pace / Speed */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-neutral-400 font-semibold">Pace</span>
              <div className="grid grid-cols-3 gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                {[3, 4.5, 7].map((s) => (
                  <button
                    key={s}
                    onClick={() => onSpeedChange(s)}
                    className={`py-1 text-[10px] font-mono rounded-lg transition-all ${
                      speed === s
                        ? 'bg-amber-400 text-neutral-950 font-bold shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>

            {/* Film Grain Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
              <span className="text-[10px] uppercase font-mono text-neutral-400">35mm Film Grain</span>
              <button
                onClick={onToggleFilmGrain}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all ${
                  hasFilmGrain ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'text-neutral-500'
                }`}
              >
                {hasFilmGrain ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};
