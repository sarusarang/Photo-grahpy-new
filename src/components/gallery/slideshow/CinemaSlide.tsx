import React from 'react';
import type { MediaItem } from '../../../types';
import type { CinemaColorGrade, CinemaFitMode } from './types';
import { Sparkles } from 'lucide-react';

interface CinemaSlideProps {
  item: MediaItem;
  isActive: boolean;
  index: number;
  colorGrade: CinemaColorGrade;
  fitMode: CinemaFitMode;
  showTitleCard?: boolean;
  clientName?: string;
  galleryTitle?: string;
}

export const CinemaSlide: React.FC<CinemaSlideProps> = ({
  item,
  isActive,
  index,
  colorGrade,
  fitMode,
  showTitleCard = false,
  clientName,
  galleryTitle,
}) => {
  // Cycle 4 cinematic camera motions
  const motionClass = `cinema-motion-${index % 4}`;

  const getColorFilter = () => {
    switch (colorGrade) {
      case 'gold':
        return 'sepia(16%) contrast(106%) brightness(102%) saturate(106%)';
      case 'noir':
        return 'grayscale(100%) contrast(118%) brightness(98%)';
      case 'romance':
        return 'contrast(98%) brightness(104%) saturate(112%)';
      case 'natural':
      default:
        return 'none';
    }
  };

  return (
    <div
      className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out overflow-hidden ${
        isActive && !showTitleCard ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
      }`}
    >
      {/* Background ambient depth blur for soft edges if in contain mode */}
      {fitMode === 'contain' && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-35 scale-125 transition-transform duration-1000"
          style={{ backgroundImage: `url(${item.url})` }}
        />
      )}

      {/* Main Photo - Full screen edge-to-edge when in cover mode */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <img
          src={item.url}
          alt={item.title || 'Slide photo'}
          style={{ filter: getColorFilter() }}
          className={`w-full h-full transition-all duration-700 ${
            fitMode === 'cover' ? 'object-cover' : 'object-contain max-w-full max-h-full'
          } ${isActive ? motionClass : 'scale-95'}`}
        />
      </div>

      {/* Cinematic Opening Title Card (Slide 0 Intro) */}
      {showTitleCard && isActive && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black text-center p-8 transition-opacity duration-1000 animate-fade-in">
          <div className="space-y-3 max-w-lg">
            <div className="flex items-center justify-center gap-2 text-amber-400 font-mono text-[10px] tracking-[0.3em] uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>Cinematic Presentation</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif text-white tracking-wider leading-tight gold-gradient-text drop-shadow-2xl font-normal">
              {clientName}
            </h2>
            <p className="text-xs sm:text-sm font-serif italic text-neutral-400 tracking-wide">
              {galleryTitle}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
