import React, { useState } from 'react';
import type { Track } from '../../../services/musicService';
import {
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Music,
} from 'lucide-react';

interface CinemaHeaderProps {
  visible: boolean;
  progress: number;
  clientName?: string;
  galleryTitle?: string;
  selectedTrack?: Track | null;
  isPlaying: boolean;
  isAudioMuted: boolean;
  volume: number;
  isFullscreen: boolean;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleFullscreen: () => void;
  onChangeTrack?: () => void;
  onClose: () => void;
}

export const CinemaHeader: React.FC<CinemaHeaderProps> = ({
  visible,
  progress,
  clientName,
  galleryTitle,
  selectedTrack,
  isPlaying,
  isAudioMuted,
  volume,
  isFullscreen,
  onToggleMute,
  onVolumeChange,
  onToggleFullscreen,
  onChangeTrack,
  onClose,
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  return (
    <>
      {/* Top Film Progress Line */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-white/10 z-40">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 transition-all duration-75 ease-linear shadow-[0_0_8px_rgba(251,191,36,0.6)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Clean Header Bar */}
      <header
        className={`absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-6 sm:px-10 py-5 bg-gradient-to-b from-black/80 via-black/30 to-transparent transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Left: Client & Gallery Info */}
        <div className="space-y-0.5 max-w-[260px] sm:max-w-md">
          <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-amber-400 font-semibold truncate">
            {clientName}
          </p>
          <h1 className="text-sm sm:text-base font-serif tracking-wide text-white/90 truncate font-light">
            {galleryTitle}
          </h1>
        </div>

        {/* Right: Music Pill & Actions */}
        <div className="flex items-center gap-2.5">
          {selectedTrack ? (
            <div
              onClick={onChangeTrack}
              title="Click to change soundtrack"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onChangeTrack && onChangeTrack()}
              className="group cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 hover:border-amber-400/60 backdrop-blur-md transition-all"
            >
              {/* Rotating Mini Vinyl Artwork */}
              <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 border border-amber-400/40">
                <img
                  src={selectedTrack.coverUrl}
                  alt={selectedTrack.title}
                  className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
                />
                <div className="absolute inset-0 m-auto w-1 h-1 rounded-full bg-black" />
              </div>

              {/* Scrolling Track Name */}
              <div className="max-w-[110px] sm:max-w-[160px] overflow-hidden text-left">
                <p className="text-[11px] font-medium text-white/90 truncate group-hover:text-amber-300">
                  {selectedTrack.title}
                </p>
              </div>

              {/* Live Equalizer */}
              {isPlaying && !isAudioMuted ? (
                <div className="flex items-end gap-0.5 h-2.5 shrink-0">
                  <span className="w-0.5 bg-amber-400 rounded-full animate-[bounce_0.6s_infinite_ease-in-out]" />
                  <span className="w-0.5 bg-amber-400 rounded-full animate-[bounce_0.35s_infinite_ease-in-out]" />
                  <span className="w-0.5 bg-amber-400 rounded-full animate-[bounce_0.75s_infinite_ease-in-out]" />
                </div>
              ) : (
                <VolumeX className="w-3 h-3 text-neutral-400 shrink-0" />
              )}
            </div>
          ) : (
            <button
              onClick={onChangeTrack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white text-xs backdrop-blur-md border border-white/10 transition-all"
            >
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">Add Music</span>
            </button>
          )}

          {/* Volume Mute & Slider */}
          <div className="relative">
            <button
              onClick={onToggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              title={isAudioMuted ? 'Unmute (M)' : 'Mute (M)'}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all"
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {showVolumeSlider && (
              <div
                onMouseLeave={() => setShowVolumeSlider(false)}
                className="absolute right-0 top-11 p-2.5 rounded-xl bg-neutral-900/95 border border-neutral-800 shadow-xl backdrop-blur-md flex items-center gap-2 z-50 animate-fade-in"
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isAudioMuted ? 0 : volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-20 accent-amber-400 cursor-pointer h-1"
                />
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            title="Exit Slideshow (Esc)"
            className="p-2 rounded-full bg-white/10 hover:bg-rose-500 text-white transition-all ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>
    </>
  );
};
