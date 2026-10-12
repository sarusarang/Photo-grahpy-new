import React from 'react';

export type WatermarkPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'center'
  | 'tiled';

export type WatermarkType = 'text' | 'image';
export type WatermarkFontSize = 'sm' | 'md' | 'lg' | 'xl';
export type WatermarkFontStyle = 'serif' | 'sans' | 'script' | 'mono';

export interface WatermarkOverlayProps {
  text?: string;
  imageUrl?: string | null;
  opacity?: number;
  position?: WatermarkPosition | string;
  size?: 'sm' | 'md' | 'lg' | 'auto';
  watermarkType?: WatermarkType | string;
  fontSize?: WatermarkFontSize | string;
  fontColor?: string;
  fontStyle?: WatermarkFontStyle | string;
  logoSize?: 'sm' | 'md' | 'lg' | 'auto';
  className?: string;
}

/**
 * Reusable, high-aesthetic Watermark Overlay for gallery imagery.
 * Renders photographer studio watermarks (custom logo or customizable text)
 * across thumbnails, grids, lightboxes, slideshows, and live settings preview.
 */
export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  text = '© EX SHARE',
  imageUrl,
  opacity = 0.45,
  position = 'bottom-right',
  size = 'auto',
  watermarkType = 'text',
  fontSize = 'md',
  fontColor = '#FFFFFF',
  fontStyle = 'serif',
  logoSize = 'auto',
  className = '',
}) => {
  const safeOpacity = Math.max(0.08, Math.min(1, opacity));
  const displayText = (text || '© STUDIO').trim();

  const isImageMode = watermarkType === 'image';

  // Typography font style classes
  const getFontStyleClass = () => {
    switch (fontStyle) {
      case 'sans':
        return 'font-sans tracking-[0.16em] uppercase font-bold';
      case 'script':
        return 'font-script tracking-[0.06em] capitalize font-semibold';
      case 'mono':
        return 'font-mono tracking-[0.14em] uppercase font-medium';
      case 'serif':
      default:
        return 'font-serif tracking-[0.22em] uppercase font-semibold';
    }
  };

  // Typography sizing responsive to both user preference and container scale
  const getTextSizeClass = () => {
    if (size === 'sm') {
      switch (fontSize) {
        case 'sm':
          return 'text-[7px] tracking-[0.12em]';
        case 'lg':
          return 'text-[10px] tracking-[0.16em]';
        case 'xl':
          return 'text-xs tracking-[0.18em]';
        case 'md':
        default:
          return 'text-[8.5px] tracking-[0.15em]';
      }
    }

    if (size === 'lg') {
      switch (fontSize) {
        case 'sm':
          return 'text-xs sm:text-sm tracking-[0.2em]';
        case 'lg':
          return 'text-base sm:text-xl md:text-2xl tracking-[0.25em]';
        case 'xl':
          return 'text-lg sm:text-2xl md:text-3xl tracking-[0.26em]';
        case 'md':
        default:
          return 'text-sm sm:text-base md:text-lg tracking-[0.22em]';
      }
    }

    // Default container ('md' or 'auto')
    switch (fontSize) {
      case 'sm':
        return 'text-[9px] sm:text-[10px] tracking-[0.18em]';
      case 'lg':
        return 'text-xs sm:text-sm md:text-base tracking-[0.22em]';
      case 'xl':
        return 'text-sm sm:text-base md:text-lg tracking-[0.24em]';
      case 'md':
      default:
        return 'text-[10px] sm:text-xs md:text-sm tracking-[0.2em]';
    }
  };

  // Image logo sizing based on context & preference
  const getLogoSizeClass = () => {
    const effectiveScale = logoSize !== 'auto' ? logoSize : size;
    switch (effectiveScale) {
      case 'sm':
        return 'max-h-5 sm:max-h-6 max-w-[100px]';
      case 'lg':
        return 'max-h-12 sm:max-h-16 md:max-h-20 max-w-[240px]';
      case 'md':
      default:
        return 'max-h-7 sm:max-h-10 max-w-[150px]';
    }
  };

  // Is fontColor dark?
  const effectiveFontColor = (fontColor || '#FFFFFF').trim();
  const lowerColor = effectiveFontColor.toLowerCase();
  const isDarkColor =
    lowerColor === '#000000' ||
    lowerColor === '#18181b' ||
    lowerColor === '#111827';

  const textDropShadowStyle: React.CSSProperties = isDarkColor
    ? {
        color: effectiveFontColor,
        textShadow:
          '0 0 6px rgba(255, 255, 255, 0.95), 0 0 2px rgba(255, 255, 255, 0.9), 0 2px 4px rgba(0, 0, 0, 0.3)',
      }
    : {
        color: effectiveFontColor,
        textShadow:
          '0 2px 6px rgba(0, 0, 0, 0.95), 0 0 2px rgba(0, 0, 0, 0.85)',
      };

  const pillBackdropClass = isDarkColor
    ? 'bg-white/80 dark:bg-white/85 backdrop-blur-[3px] border border-black/15 shadow-[0_4px_14px_rgba(0,0,0,0.25)]'
    : 'bg-black/45 backdrop-blur-[2.5px] border border-white/10 shadow-[0_4px_14px_rgba(0,0,0,0.6)]';

  // If position is tiled, render repeating diagonal protection pattern
  if (position === 'tiled') {
    if (isImageMode && !imageUrl) {
      return null;
    }

    return (
      <div
        className={`absolute inset-0 z-15 pointer-events-none select-none overflow-hidden flex items-center justify-center ${className}`}
        style={{ opacity: safeOpacity }}
        aria-hidden="true"
      >
        <div className="w-[190%] h-[190%] grid grid-cols-3 sm:grid-cols-4 gap-12 sm:gap-16 -rotate-[28deg] items-center justify-center">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center text-center p-2"
            >
              {isImageMode ? (
                <img
                  src={imageUrl!}
                  alt=""
                  className="max-h-8 sm:max-h-10 max-w-[130px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] filter brightness-200"
                />
              ) : (
                <span
                  style={textDropShadowStyle}
                  className={`whitespace-nowrap transition-all ${getFontStyleClass()} ${getTextSizeClass()}`}
                >
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

  if (isImageMode && !imageUrl) {
    return null;
  }

  return (
    <div
      className={`absolute z-15 pointer-events-none select-none flex flex-col ${getPositionClasses()} ${className}`}
      style={{ opacity: safeOpacity }}
      aria-hidden="true"
    >
      {isImageMode ? (
        <img
          src={imageUrl!}
          alt="Studio Watermark"
          className={`${getLogoSizeClass()} object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] filter contrast-125`}
        />
      ) : (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${pillBackdropClass}`}>
          <span
            style={textDropShadowStyle}
            className={`whitespace-nowrap transition-all ${getFontStyleClass()} ${getTextSizeClass()}`}
          >
            {displayText}
          </span>
        </div>
      )}
    </div>
  );
};
