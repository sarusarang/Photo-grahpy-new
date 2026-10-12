import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { SlideshowModalProps, CinemaColorGrade, CinemaFitMode } from './slideshow/types';
import { CinemaSlide } from './slideshow/CinemaSlide';
import { CinemaHeader } from './slideshow/CinemaHeader';
import { CinemaFooter } from './slideshow/CinemaFooter';
import { audioManager } from '../../services/audioManager';
import { CURATED_TRACKS, type Track } from '../../services/musicService';
import { useSmoothScroll } from '../common/SmoothScroll';
import { useFullscreen } from '../../hooks/useFullscreen';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const SlideshowModal: React.FC<SlideshowModalProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
  galleryTitle = 'Wedding Collection',
  clientName = 'Celebration of Love',
  selectedTrack,
  onChangeTrack,
  onTrackAutoAdvance,
  watermarkEnabled = false,
  watermarkText,
  watermarkOpacity,
  watermarkPosition,
  watermarkImage,
  watermarkType,
  watermarkFontSize,
  watermarkFontColor,
  watermarkFontStyle,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(selectedTrack || CURATED_TRACKS[0]);
  const [speed, setSpeed] = useState<number>(4.5); // seconds per slide
  const [progress, setProgress] = useState<number>(0);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);

  // Sync currentTrack whenever parent updates selectedTrack
  useEffect(() => {
    if (selectedTrack) {
      setCurrentTrack(selectedTrack);
    }
  }, [selectedTrack]);

  // Default to true full screen full-bleed ('cover') and gold cinema tone
  const [fitMode, setFitMode] = useState<CinemaFitMode>('cover');
  const [colorGrade, setColorGrade] = useState<CinemaColorGrade>('gold');
  const [hasFilmGrain, setHasFilmGrain] = useState<boolean>(true);
  const [showTitleCard, setShowTitleCard] = useState<boolean>(true);

  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(audioManager.getIsMuted());
  const [volume, setVolume] = useState<number>(audioManager.getVolume());

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  const { lenis } = useSmoothScroll();
  const { isFullscreen, enter: enterFullscreen, exit: exitFullscreen, toggle: toggleFullscreen } = useFullscreen(containerRef);

  // 1. Always start in native fullscreen on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        enterFullscreen();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      exitFullscreen();
    }
  }, [isOpen, enterFullscreen, exitFullscreen]);

  // 2. Lock background scrolling while slideshow is open
  useEffect(() => {
    if (isOpen) {
      lenis?.stop();
      const origBody = document.body.style.overflow;
      const origHtml = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        lenis?.start();
        document.body.style.overflow = origBody;
        document.documentElement.style.overflow = origHtml;
      };
    }
  }, [isOpen, lenis]);

  // 3. Reset index & start audio playback with auto-advance playlist
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(Math.max(0, initialIndex), items.length - 1));
      setIsPlaying(true);
      setProgress(0);
      setShowTitleCard(true);

      const trackToPlay = selectedTrack || CURATED_TRACKS[0];
      if (trackToPlay) {
        audioManager.playSoundtrack(
          trackToPlay,
          1500,
          CURATED_TRACKS,
          (nextTrack) => {
            setCurrentTrack(nextTrack);
            onTrackAutoAdvance?.(nextTrack);
          }
        );
      }
    } else {
      audioManager.stopSoundtrack(500);
    }

    return () => {
      audioManager.stopSoundtrack(0);
    };
  }, [isOpen, initialIndex, items.length, selectedTrack, onTrackAutoAdvance]);

  // 4. Automatically pause audio & slide timer when mobile screen turns off / tab is backgrounded
  useEffect(() => {
    if (!isOpen) return;

    let wasPlayingBeforeHidden = isPlaying;

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined') {
        if (document.hidden || document.visibilityState === 'hidden') {
          wasPlayingBeforeHidden = isPlaying;
          audioManager.pauseSoundtrack();
        } else if (document.visibilityState === 'visible') {
          if (wasPlayingBeforeHidden && isPlaying) {
            audioManager.resumeSoundtrack();
          }
        }
      }
    };

    const handlePageHide = () => {
      audioManager.pauseSoundtrack();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleVisibilityChange);
    window.addEventListener('freeze', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleVisibilityChange);
      window.removeEventListener('freeze', handlePageHide);
    };
  }, [isOpen, isPlaying]);

  // Audio manager state sync
  useEffect(() => {
    const unsub = audioManager.subscribe(() => {
      setIsAudioMuted(audioManager.getIsMuted());
      setVolume(audioManager.getVolume());
    });
    return () => unsub();
  }, []);

  // Title card auto-fade
  useEffect(() => {
    if (isOpen && showTitleCard && isPlaying) {
      const titleTimer = setTimeout(() => {
        setShowTitleCard(false);
      }, 2600);
      return () => clearTimeout(titleTimer);
    }
  }, [isOpen, showTitleCard, isPlaying]);

  const handleNext = useCallback(() => {
    if (showTitleCard) {
      setShowTitleCard(false);
      return;
    }
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    setProgress(0);
  }, [items.length, showTitleCard]);

  const handlePrev = useCallback(() => {
    if (showTitleCard) {
      setShowTitleCard(false);
      return;
    }
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    setProgress(0);
  }, [items.length, showTitleCard]);

  // Slideshow progress timer
  useEffect(() => {
    if (!isOpen || !isPlaying || items.length <= 1 || showTitleCard) return;

    const intervalStep = 50;
    const totalSteps = (speed * 1000) / intervalStep;

    const timer = setInterval(() => {
      // Pause slide progress when screen is off or tab hidden
      if (typeof document !== 'undefined' && (document.hidden || document.visibilityState === 'hidden')) {
        return;
      }

      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 100 / totalSteps;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, speed, items.length, showTitleCard, handleNext]);

  // Auto-hide controls
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 2800);
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        audioManager.resumeSoundtrack();
      } else {
        audioManager.pauseSoundtrack();
      }
      return next;
    });
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
        handleTogglePlay();
      }
      if (e.key === 'm' || e.key === 'M') {
        audioManager.toggleMute();
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev, toggleFullscreen]);

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];

  return createPortal(
    <div
      ref={containerRef}
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* ─── 35mm Film Grain & Vignette ──────────────────────────────── */}
      {hasFilmGrain && (
        <div className="absolute inset-0 z-20 pointer-events-none film-grain opacity-25 mix-blend-overlay" />
      )}
      <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.75)_100%)]" />

      {/* ─── Top Header Bar ─────────────────────────────────────────── */}
      <CinemaHeader
        visible={controlsVisible}
        progress={progress}
        clientName={clientName}
        galleryTitle={galleryTitle}
        selectedTrack={currentTrack || selectedTrack}
        isPlaying={isPlaying}
        isAudioMuted={isAudioMuted}
        volume={volume}
        isFullscreen={isFullscreen}
        onToggleMute={() => audioManager.toggleMute()}
        onVolumeChange={(vol) => audioManager.setVolume(vol)}
        onToggleFullscreen={toggleFullscreen}
        onChangeTrack={onChangeTrack}
        onClose={onClose}
      />

      {/* ─── Main Visual Movie Canvas (Full Screen Full Bleed) ───────── */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {items.map((item, idx) => {
          const isActive = idx === currentIndex;
          if (!isActive && Math.abs(idx - currentIndex) > 1) return null;

          return (
            <CinemaSlide
              key={item.id}
              item={item}
              isActive={isActive}
              index={idx}
              colorGrade={colorGrade}
              fitMode={fitMode}
              showTitleCard={showTitleCard}
              clientName={clientName}
              galleryTitle={galleryTitle}
              watermarkEnabled={watermarkEnabled}
              watermarkText={watermarkText}
              watermarkOpacity={watermarkOpacity}
              watermarkPosition={watermarkPosition}
              watermarkImage={watermarkImage}
              watermarkType={watermarkType}
              watermarkFontSize={watermarkFontSize}
              watermarkFontColor={watermarkFontColor}
              watermarkFontStyle={watermarkFontStyle}
            />
          );
        })}

        {/* Subtle, floating side navigation buttons */}
        <button
          onClick={handlePrev}
          aria-label="Previous Slide"
          className={`absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 hover:bg-black/70 text-white/70 hover:text-white backdrop-blur-sm border border-white/10 transition-all ${
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next Slide"
          className={`absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 hover:bg-black/70 text-white/70 hover:text-white backdrop-blur-sm border border-white/10 transition-all ${
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </main>

      {/* ─── Bottom Controls Deck ───────────────────────────────────── */}
      <CinemaFooter
        visible={controlsVisible}
        currentIndex={currentIndex}
        totalItems={items.length}
        currentTitle={currentItem?.title}
        isPlaying={isPlaying}
        speed={speed}
        fitMode={fitMode}
        colorGrade={colorGrade}
        hasFilmGrain={hasFilmGrain}
        onPrev={handlePrev}
        onNext={handleNext}
        onTogglePlay={handleTogglePlay}
        onSpeedChange={(s) => {
          setSpeed(s);
          setProgress(0);
        }}
        onFitModeChange={(mode) => setFitMode(mode)}
        onColorGradeChange={(grade) => setColorGrade(grade)}
        onToggleFilmGrain={() => setHasFilmGrain((prev) => !prev)}
      />
    </div>,
    document.body
  );
};
