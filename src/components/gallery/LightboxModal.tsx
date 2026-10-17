import React, { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { MediaItem } from '../../types';
import { useToast } from '../ui/Toast';
import { useScrollLock } from '../../hooks/useScrollLock';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { MediaShareModal } from './MediaShareModal';
import { DownloadOptionsModal } from './DownloadOptionsModal';
import { downloadSingleImage } from '@/utils/downloadUtils';
import { WatermarkOverlay } from './WatermarkOverlay';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Share2,
  Loader2,
  Sun,
  Moon,
  Heart,
} from 'lucide-react';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: MediaItem[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
  isFavoriting?: boolean;
  onDelete?: (mediaId: string) => void;
  studioName?: string;
  allowDownloads?: boolean;
  galleryTitle?: string;
  gallerySlug?: string;
  onShare?: (item: MediaItem) => void;
  theme?: string;
  isDashboard?: boolean;
  watermarkEnabled?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkPosition?: string;
  watermarkImage?: string | null;
  watermarkType?: string;
  watermarkFontSize?: string;
  watermarkFontColor?: string;
  watermarkFontStyle?: string;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  mediaList,
  currentIndex,
  onNavigate,
  onToggleFavorite,
  isFavoriting = false,
  onDelete,
  studioName = 'EX SHARE',
  allowDownloads = true,
  galleryTitle,
  gallerySlug,
  onShare,
  theme = 'editorial',
  isDashboard,
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
  const { showToast } = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDownloadingSingle, setIsDownloadingSingle] = useState(false);

  // Lock background scroll
  useScrollLock(isOpen);

  // Zoom & Pan Editor State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Buttery Slide Animation State
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | null>(null);

  // Format Selection Download Modal State
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Detect if running on dashboard (either explicit isDashboard prop or /dashboard pathname)
  const isDashboardRoute =
    isDashboard !== undefined
      ? isDashboard
      : typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/dashboard') ||
          window.location.pathname.includes('/dashboard/'));

  // Reactive state checking document dark mode class and localStorage theme
  const [isDocumentDark, setIsDocumentDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncTheme = () => {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') {
        setIsDocumentDark(true);
      } else if (saved === 'light') {
        setIsDocumentDark(false);
      } else {
        setIsDocumentDark(document.documentElement.classList.contains('dark'));
      }
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'theme') {
        syncTheme();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Manual canvas override inside lightbox viewer
  const [canvasOverride, setCanvasOverride] = useState<'dark' | 'light' | null>(null);

  // When on dashboard, STRICTLY match the active dashboard theme (dark/light)
  // When in public client gallery, match template or dark mode
  const isLightTheme =
    canvasOverride !== null
      ? canvasOverride === 'light'
      : isDashboardRoute
      ? !isDocumentDark
      : theme === 'editorial' || theme === 'minimal' || theme === 'light'
      ? !isDocumentDark && (theme === 'light' || !document.documentElement.classList.contains('dark'))
      : false;

  const handleToggleCanvasTheme = useCallback(() => {
    setCanvasOverride((prev) => {
      const currentIsLight = prev !== null ? prev === 'light' : isLightTheme;
      const nextTheme = currentIsLight ? 'dark' : 'light';

      if (isDashboardRoute && typeof window !== 'undefined') {
        try {
          if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
          }
          window.dispatchEvent(new Event('storage'));
        } catch {
          // ignore
        }
      }

      return nextTheme;
    });
  }, [isLightTheme, isDashboardRoute]);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentItem = mediaList[currentIndex];

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(4, Math.round((prev + 0.5) * 10) / 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(1, Math.round((prev - 0.5) * 10) / 10);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleToggleDoubleZoom = useCallback(
    (e: React.MouseEvent) => {
      if (zoom > 1) {
        handleResetZoom();
      } else {
        // Zoom into clicked area
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const offsetX = e.clientX - rect.left - rect.width / 2;
        const offsetY = e.clientY - rect.top - rect.height / 2;
        setZoom(2.5);
        setPan({ x: -offsetX * 0.8, y: -offsetY * 0.8 });
      }
    },
    [zoom, handleResetZoom]
  );

  const handlePrev = useCallback(() => {
    setSlideDirection('prev');
    handleResetZoom();
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else {
      onNavigate(mediaList.length - 1); // Wrap around
    }
  }, [currentIndex, mediaList.length, onNavigate, handleResetZoom]);

  const handleNext = useCallback(() => {
    setSlideDirection('next');
    handleResetZoom();
    if (currentIndex < mediaList.length - 1) {
      onNavigate(currentIndex + 1);
    } else {
      onNavigate(0); // Wrap around
    }
  }, [currentIndex, mediaList.length, onNavigate, handleResetZoom]);

  // Keyboard Shortcuts (Arrows, Escape, Zoom keys)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDeleteModalOpen) return;

      if (e.key === 'Escape') {
        if (zoom > 1) {
          handleResetZoom();
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      } else if (e.key === 't' || e.key === 'T') {
        handleToggleCanvasTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    onClose,
    handlePrev,
    handleNext,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleToggleCanvasTheme,
    isDeleteModalOpen,
    zoom,
  ]);

  // Mouse Wheel Smooth Zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isOpen) return;

    const onWheel = (e: WheelEvent) => {
      // Allow scroll only on image viewing container
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom((prev) => Math.min(4, Math.round((prev + 0.25) * 100) / 100));
      } else {
        setZoom((prev) => {
          const next = Math.max(1, Math.round((prev - 0.25) * 100) / 100);
          if (next === 1) setPan({ x: 0, y: 0 });
          return next;
        });
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isOpen]);

  // Drag to Pan when Zoomed
  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Silently handle environments where pointer capture is unavailable
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || zoom <= 1) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    const maxBoundX = (window.innerWidth * (zoom - 1)) / 2 + 60;
    const maxBoundY = (window.innerHeight * (zoom - 1)) / 2 + 60;

    setPan({
      x: Math.max(-maxBoundX, Math.min(maxBoundX, newX)),
      y: Math.max(-maxBoundY, Math.min(maxBoundY, newY)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Silently handle pointer release
      }
    }
  };

  if (!isOpen || !currentItem) return null;

  const handleConfirmDownloadOption = async ({
    format,
    withWatermark,
  }: {
    format: 'original' | 'web';
    withWatermark: boolean;
  }) => {
    if (!currentItem) return;
    const filename = currentItem.title || `photo-${currentIndex + 1}.jpg`;
    const watermarkOptions = {
      enabled: Boolean(withWatermark && currentItem.type !== 'video'),
      text: watermarkText || studioName || 'PHOTOGRAPHER',
      opacity: watermarkOpacity,
      position: watermarkPosition,
      imageUrl: watermarkImage,
      watermarkType: watermarkType || (watermarkImage ? 'image' : 'text'),
      fontSize: watermarkFontSize,
      fontColor: watermarkFontColor,
      fontStyle: watermarkFontStyle,
    };

    setIsDownloadingSingle(true);
    showToast(
      'Downloading Photo',
      `Saving "${filename}" in ${format === 'original' ? 'Original/RAW' : 'Web JPEG'} resolution...`,
      'info'
    );

    try {
      const success = await downloadSingleImage({
        url: currentItem.url || currentItem.thumbnailUrl || '',
        preferredFilename: filename,
        watermarkOptions,
        format,
        downloadUrl: currentItem.downloadUrl,
        rawUrl: currentItem.rawUrl,
      });

      if (success) {
        showToast('Download Complete', `"${filename}" saved to your downloads.`, 'success');
      } else {
        showToast('Download Started', 'Initiated download. Please check your browser downloads.', 'info');
      }
    } catch (err) {
      console.error('Failed to download single image:', err);
      showToast('Download Failed', 'Could not save the image directly. Please try again.', 'error');
    } finally {
      setIsDownloadingSingle(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!currentItem || !onDelete) return;
    const deletingTitle = currentItem.title;
    const deletingId = currentItem.id;
    setIsDeleteModalOpen(false);

    if (mediaList.length <= 1) {
      onDelete(deletingId);
      onClose();
    } else {
      if (currentIndex >= mediaList.length - 1) {
        onNavigate(mediaList.length - 2);
      }
      onDelete(deletingId);
    }
    showToast('Photo Deleted', `"${deletingTitle}" has been removed.`, 'info');
  };

  // Touch Swipe Gesture State (Apple Photos / Instagram native feel)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1) return; // Allow normal pan when zoomed
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || zoom > 1) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Fast flick or standard swipe (horizontal)
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    } else if (deltaY > 75 && Math.abs(deltaY) > Math.abs(deltaX) * 1.6 && duration < 600) {
      // Swiped down -> close modal like iOS Photos
      onClose();
    }
  };

  // Determine buttery smooth transition animation class
  const animationClass =
    slideDirection === 'next'
      ? 'animate-butter-next'
      : slideDirection === 'prev'
      ? 'animate-butter-prev'
      : 'animate-butter-fade';

  return createPortal(
    <div
      data-lenis-prevent="true"
      className={`fixed inset-0 z-50 flex flex-col justify-between select-none overlay-animate overscroll-contain backdrop-blur-2xl transition-colors duration-300 ${
        isLightTheme ? 'bg-[#FCFCFD]/98 text-neutral-900' : 'bg-[#090a0f]/98 text-white'
      }`}
    >
      {/* Top Bar - Mobile App Ergonomics */}
      <div
        className={`flex items-center justify-between px-2.5 sm:px-6 py-2.5 sm:py-4 z-20 gap-2 sm:gap-3 pt-safe sm:pt-4 transition-colors duration-300 ${
          isLightTheme
            ? 'bg-gradient-to-b from-[#FCFCFD]/95 via-[#FCFCFD]/80 to-transparent border-b border-neutral-200/50'
            : 'bg-gradient-to-b from-[#090a0f]/95 via-[#090a0f]/80 to-transparent border-b border-white/10'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <button
            onClick={onClose}
            className={`flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer touch-manipulation shrink-0 ${
              isLightTheme
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title="Back to gallery (Esc)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Back</span>
          </button>

          <span
            className={`text-[11px] sm:text-xs uppercase tracking-widest font-serif font-semibold truncate max-w-[90px] xs:max-w-[130px] sm:max-w-none ${
              isLightTheme ? 'text-neutral-800' : 'text-neutral-300'
            }`}
          >
            {studioName}
          </span>
          <span
            className={`text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded-full shrink-0 ${
              isLightTheme
                ? 'text-neutral-600 bg-neutral-200/70 border border-neutral-300'
                : 'text-neutral-400 bg-white/10 border border-white/10'
            }`}
          >
            {currentIndex + 1} / {mediaList.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Favorite / Like Button on Top */}
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(currentItem.id)}
              disabled={isFavoriting}
              className={`flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-full text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer touch-manipulation ${
                currentItem.isFavorite
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : isLightTheme
                  ? 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 border border-neutral-200 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
              title={currentItem.isFavorite ? 'Remove from liked photos' : 'Like this photo'}
            >
              {isFavoriting ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <Heart
                  className={`w-4 h-4 ${
                    currentItem.isFavorite
                      ? 'fill-white text-white'
                      : isLightTheme
                      ? 'text-neutral-700'
                      : 'text-rose-400'
                  }`}
                />
              )}
              <span className="hidden sm:inline">
                {currentItem.isFavorite ? 'Liked' : 'Like'}
              </span>
            </button>
          )}

          {/* Social Share Button on Top */}
          <button
            onClick={() => {
              if (onShare) {
                onShare(currentItem);
              }
              setIsShareModalOpen(true);
            }}
            className={`flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-full text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer touch-manipulation ${
              isLightTheme
                ? 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 border border-neutral-200 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title="Share this photo on social media"
          >
            <Share2 className={`w-4 h-4 ${isLightTheme ? 'text-neutral-700' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">Share</span>
          </button>

          {allowDownloads && (
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              disabled={isDownloadingSingle}
              className={`flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-full text-xs font-semibold tracking-wide transition-all active:scale-95 disabled:opacity-50 cursor-pointer touch-manipulation ${
                isLightTheme
                  ? 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 border border-neutral-200 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
              title="Download photo (Choose RAW or JPEG format)"
            >
              {isDownloadingSingle ? (
                <>
                  <Loader2 className={`w-4 h-4 animate-spin ${isLightTheme ? 'text-neutral-900' : 'text-amber-400'}`} />
                  <span className="hidden md:inline">Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                  <span className="hidden md:inline">({currentItem.sizeMB} MB)</span>
                </>
              )}
            </button>
          )}

          {/* Delete current photo button */}
          {onDelete && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className={`flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-full text-xs font-semibold tracking-wide transition-all backdrop-blur-md group active:scale-95 cursor-pointer touch-manipulation ${
                isLightTheme
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-500/60'
              }`}
              title="Delete this photo"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          {/* Canvas Theme Toggle Button */}
          <button
            onClick={handleToggleCanvasTheme}
            className={`flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-full text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer touch-manipulation ${
              isLightTheme
                ? 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 border border-neutral-200 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
            title={`Switch to ${isLightTheme ? 'Dark' : 'Light'} theme (T)`}
          >
            {isLightTheme ? (
              <Moon className="w-4 h-4 text-neutral-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
            <span className="hidden md:inline">{isLightTheme ? 'Dark' : 'Light'}</span>
          </button>

          {/* High-visibility Prominent Close Button */}
          <button
            onClick={onClose}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer touch-manipulation shadow-sm ${
              isLightTheme
                ? 'bg-neutral-900 hover:bg-black text-white border border-neutral-900'
                : 'bg-white hover:bg-neutral-100 text-neutral-950 border border-white'
            }`}
            title="Close viewer (Esc)"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Main Center Area: Image or Video with Editor Zoom & Pan & Touch Swipe */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (e.target === e.currentTarget && zoom <= 1) {
            onClose();
          }
        }}
        className="relative flex-1 flex items-center justify-center p-1 sm:p-8 md:p-12 overflow-hidden cursor-default"
      >
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          className={`absolute left-1.5 sm:left-6 z-20 p-2.5 sm:p-3.5 rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95 touch-manipulation ${
            isLightTheme
              ? 'bg-white/90 hover:bg-white text-neutral-800 border border-neutral-200/80 shadow-lg shadow-neutral-900/10'
              : 'bg-black/45 hover:bg-black/85 text-white/80 hover:text-white border border-white/15 shadow-xl shadow-black/60'
          }`}
          title="Previous Photo (←)"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Media Container with Butter-Smooth Transitions */}
        <div
          key={currentItem.id}
          className={`relative max-h-full max-w-full flex items-center justify-center ${animationClass}`}
        >
          {currentItem.type === 'video' ? (
            <div className="relative w-full max-w-4xl aspect-video bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800">
              <video
                src={currentItem.url}
                poster={currentItem.thumbnailUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono text-amber-400 flex items-center gap-1.5 border border-white/10">
                <Film className="w-3.5 h-3.5" /> 4K Video Reel
              </div>
            </div>
          ) : (
            <div
              className={`relative overflow-visible select-none touch-none ${
                zoom > 1
                  ? isDragging
                    ? 'cursor-grabbing'
                    : 'cursor-grab'
                  : 'cursor-zoom-in'
              }`}
              onDoubleClick={handleToggleDoubleZoom}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <img
                src={currentItem.url}
                alt={currentItem.title}
                draggable={false}
                style={{
                  transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`,
                  transition: isDragging
                    ? 'none'
                    : 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
                  transformOrigin: 'center center',
                  willChange: 'transform',
                }}
                className="max-h-[78vh] sm:max-h-[82vh] max-w-[90vw] object-contain rounded-none shadow-2xl pointer-events-auto"
              />

              {watermarkEnabled && (
                <WatermarkOverlay
                  text={watermarkText || studioName}
                  imageUrl={watermarkImage}
                  opacity={watermarkOpacity}
                  position={watermarkPosition}
                  watermarkType={watermarkType}
                  fontSize={watermarkFontSize}
                  fontColor={watermarkFontColor}
                  fontStyle={watermarkFontStyle}
                  size="lg"
                />
              )}
            </div>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className={`absolute right-1.5 sm:right-6 z-20 p-2.5 sm:p-3.5 rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95 touch-manipulation ${
            isLightTheme
              ? 'bg-white/90 hover:bg-white text-neutral-800 border border-neutral-200/80 shadow-lg shadow-neutral-900/10'
              : 'bg-black/45 hover:bg-black/85 text-white/80 hover:text-white border border-white/15 shadow-xl shadow-black/60'
          }`}
          title="Next Photo (→)"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Editor Floating Zoom Toolbar */}
        {currentItem.type !== 'video' && (
          <div
            className={`absolute bottom-12 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300 ${
              isLightTheme
                ? 'bg-white/95 border border-neutral-200/90 shadow-xl shadow-neutral-900/10 text-neutral-800'
                : 'bg-neutral-950/85 border border-white/15 shadow-2xl shadow-black/80 text-white'
            }`}
          >
            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className={`p-1.5 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95 touch-manipulation ${
                isLightTheme
                  ? 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                  : 'hover:bg-white/15 text-neutral-300 hover:text-white'
              }`}
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Zoom Percentage / Click to reset */}
            <button
              onClick={handleResetZoom}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-mono font-semibold tracking-wide transition-all active:scale-95 touch-manipulation ${
                isLightTheme
                  ? 'hover:bg-neutral-100 text-neutral-900'
                  : 'hover:bg-white/15 text-amber-300 hover:text-amber-200'
              }`}
              title="Reset to 100% (0)"
            >
              {Math.round(zoom * 100)}%
            </button>

            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className={`p-1.5 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95 touch-manipulation ${
                isLightTheme
                  ? 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                  : 'hover:bg-white/15 text-neutral-300 hover:text-white'
              }`}
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <div className={`w-[1px] h-3.5 sm:h-4 mx-0.5 sm:mx-1 ${isLightTheme ? 'bg-neutral-200' : 'bg-white/20'}`} />

            {/* Reset to Fit */}
            <button
              onClick={handleResetZoom}
              className={`p-1.5 rounded-xl transition-all active:scale-95 touch-manipulation ${
                isLightTheme
                  ? 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                  : 'hover:bg-white/15 text-neutral-300 hover:text-white'
              } ${zoom > 1 ? (isLightTheme ? 'text-neutral-900 font-bold' : 'text-amber-400 hover:text-amber-300') : ''}`}
              title="Fit to Screen"
            >
              {zoom > 1 ? <RotateCcw className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {zoom > 1 ? (
              <span className={`hidden md:inline pl-1.5 text-[11px] font-mono ${isLightTheme ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Drag to pan
              </span>
            ) : (
              <span className={`hidden lg:inline pl-1.5 text-[10px] font-mono ${isLightTheme ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Scroll wheel to zoom
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Caption & Metadata */}
      <div
        className={`px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs z-10 pb-safe sm:pb-3.5 transition-colors duration-300 ${
          isLightTheme
            ? 'bg-gradient-to-t from-[#FCFCFD]/95 via-[#FCFCFD]/80 to-transparent text-neutral-600 border-t border-neutral-200/50'
            : 'bg-gradient-to-t from-[#090a0f]/95 via-[#090a0f]/80 to-transparent text-neutral-400 border-t border-white/10'
        }`}
      >
        <div className="min-w-0">
          <p className={`font-medium text-xs sm:text-sm truncate max-w-[200px] xs:max-w-xs sm:max-w-md ${isLightTheme ? 'text-neutral-900' : 'text-white'}`}>
            {currentItem.title}
          </p>
          {currentItem.caption && (
            <p className={`mt-0.5 text-[11px] truncate max-w-[200px] xs:max-w-xs ${isLightTheme ? 'text-neutral-500' : 'text-neutral-400'}`}>
              {currentItem.caption}
            </p>
          )}
        </div>

        <div className={`flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] font-mono shrink-0 ${isLightTheme ? 'text-neutral-500' : 'text-neutral-500'}`}>
          <span>
            {currentItem.width} × {currentItem.height} px
          </span>
          <span>•</span>
          <span>{currentItem.sizeMB} MB</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Original RAW/JPEG</span>
        </div>
      </div>

      {/* Delete Confirmation Modal for Current Photo */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Photo"
        description="Are you sure you want to delete this photo from the gallery? This action is permanent."
        confirmLabel="Delete Photo"
        item={currentItem}
      />

      {/* Social Media Share Modal */}
      <MediaShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        mediaItems={[currentItem]}
        galleryTitle={galleryTitle || studioName}
        gallerySlug={gallerySlug}
      />

      {/* Format Selection (RAW vs JPEG) Download Modal */}
      <DownloadOptionsModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        item={currentItem}
        galleryTitle={galleryTitle || studioName}
        showWatermarkToggle={false}
        watermarkOptions={{
          enabled: Boolean(watermarkEnabled && currentItem.type !== 'video'),
          text: watermarkText || studioName || 'PHOTOGRAPHER',
          opacity: watermarkOpacity,
          position: watermarkPosition,
          imageUrl: watermarkImage,
          watermarkType: watermarkType || (watermarkImage ? 'image' : 'text'),
          fontSize: watermarkFontSize,
          fontColor: watermarkFontColor,
          fontStyle: watermarkFontStyle,
        }}
        onConfirmDownload={handleConfirmDownloadOption}
        theme={isLightTheme ? 'light' : 'dark'}
      />
    </div>,
    document.body
  );
};

