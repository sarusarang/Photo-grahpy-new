import React from 'react';

export type WatermarkPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'center'
  | 'tiled'
  | string;

export interface WatermarkOverlayProps {
  text?: string;
  imageUrl?: string | null;
  opacity?: number;
  position?: WatermarkPosition;
  size?: 'sm' | 'md' | 'lg' | 'auto';
  className?: string;
}

/**
 * Reusable, high-aesthetic Watermark Overlay for gallery imagery.
 * Renders photographer studio watermarks across thumbnails, grids, lightboxes, and slideshows.
 */
export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  text = '© EX SHARE',
  imageUrl,
  opacity = 0.45,
  position = 'bottom-right',
  size = 'auto',
  className = '',
}) => {
  const safeOpacity = Math.max(0.08, Math.min(1, opacity));
  const displayText = (text || '© STUDIO').trim();

  // Typography sizing based on context
  const getTextSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-[9px] sm:text-[10px] tracking-[0.2em]';
      case 'lg':
        return 'text-xs sm:text-base md:text-lg tracking-[0.25em]';
      case 'md':
        return 'text-[11px] sm:text-xs tracking-[0.2em]';
      case 'auto':
      default:
        return 'text-[9px] sm:text-xs md:text-sm tracking-[0.22em]';
    }
  };

  // Image logo sizing based on context
  const getLogoSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'max-h-5 sm:max-h-6 max-w-[100px]';
      case 'lg':
        return 'max-h-12 sm:max-h-16 md:max-h-20 max-w-[240px]';
      case 'md':
        return 'max-h-7 sm:max-h-9 max-w-[140px]';
      case 'auto':
      default:
        return 'max-h-6 sm:max-h-10 max-w-[160px]';
    }
  };

  // If position is tiled, render subtle repeating diagonal pattern
  if (position === 'tiled') {
    return (
      <div
        className={`absolute inset-0 z-15 pointer-events-none select-none overflow-hidden flex items-center justify-center ${className}`}
        style={{ opacity: safeOpacity }}
        aria-hidden="true"
      >
        <div className="w-[180%] h-[180%] grid grid-cols-3 sm:grid-cols-4 gap-12 sm:gap-16 -rotate-[28deg] items-center justify-center">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center text-center p-2"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="max-h-8 sm:max-h-10 max-w-[120px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] filter brightness-200"
                />
              ) : (
                <span className="font-serif font-bold uppercase tracking-[0.25em] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] whitespace-nowrap text-xs sm:text-sm">
                  {displayText}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Positioning coordinates
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 text-left items-start';
      case 'top-right':
        return 'top-2.5 right-2.5 sm:top-4 sm:right-4 text-right items-end';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center items-center';
      case 'bottom-right':
      default:
        return 'bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 text-right items-end';
    }
  };

  return (
    <div
      className={`absolute z-15 pointer-events-none select-none flex flex-col ${getPositionClasses()} ${className}`}
      style={{ opacity: safeOpacity }}
      aria-hidden="true"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className={`${getLogoSizeClass()} object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] filter contrast-125`}
        />
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/35 backdrop-blur-[2px] border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
          <span
            className={`font-serif uppercase font-semibold text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] whitespace-nowrap ${getTextSizeClass()}`}
          >
            {displayText}
          </span>
        </div>
      )}
    </div>
  );
};
