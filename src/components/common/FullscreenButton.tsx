import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export interface FullscreenButtonProps {
  theme?: 'editorial' | 'masonry' | 'cinematic' | 'minimal' | 'glass' | 'navbar';
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({
  theme = 'glass',
  className = '',
  showLabel = true,
  compact = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (
        !document.fullscreenElement &&
        !(document as any).webkitFullscreenElement &&
        !(document as any).mozFullScreenElement &&
        !(document as any).msFullscreenElement
      ) {
        const root = document.documentElement;
        if (root.requestFullscreen) {
          await root.requestFullscreen();
        } else if ((root as any).webkitRequestFullscreen) {
          await (root as any).webkitRequestFullscreen();
        } else if ((root as any).mozRequestFullScreen) {
          await (root as any).mozRequestFullScreen();
        } else if ((root as any).msRequestFullscreen) {
          await (root as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Unable to toggle fullscreen mode:', err);
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'masonry':
        return 'bg-[#09110E]/80 hover:bg-[#09110E] text-emerald-300 hover:text-white border-emerald-500/30 hover:border-emerald-400/50 shadow-emerald-950/40';
      case 'cinematic':
        return 'bg-black/75 hover:bg-black/95 text-amber-300 hover:text-amber-200 border-amber-500/35 hover:border-amber-400/60 shadow-black/70';
      case 'minimal':
        return 'bg-white/90 hover:bg-white text-neutral-800 hover:text-neutral-950 border-neutral-300 hover:border-neutral-400 shadow-neutral-900/10';
      case 'navbar':
        return 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border-neutral-700/60 shadow-xs';
      case 'editorial':
      case 'glass':
      default:
        return 'bg-black/40 hover:bg-black/65 text-white/90 hover:text-white border-white/20 hover:border-white/40 shadow-black/40';
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
      className={`inline-flex items-center justify-center gap-1.5 backdrop-blur-xl border transition-all duration-300 active:scale-95 cursor-pointer rounded-full group select-none ${
        compact ? 'p-2' : 'px-3 py-1.5 sm:px-3.5 sm:py-2'
      } ${getThemeClasses()} ${className}`}
    >
      {isFullscreen ? (
        <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2] transition-transform duration-300 group-hover:scale-110" />
      ) : (
        <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2] transition-transform duration-300 group-hover:scale-110" />
      )}
      {showLabel && !compact && (
        <span className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase hidden sm:inline font-medium">
          {isFullscreen ? 'Exit' : 'Fullscreen'}
        </span>
      )}
    </button>
  );
};
