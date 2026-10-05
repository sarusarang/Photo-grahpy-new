import React, { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { MediaItem } from '../../types';
import { useToast } from '../ui/Toast';
import { useScrollLock } from '../../hooks/useScrollLock';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { MediaShareModal } from './MediaShareModal';
import { downloadSingleImage } from '@/utils/downloadUtils';
import { WatermarkOverlay } from './WatermarkOverlay';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Film,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Share2,
  Loader2,
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
  watermarkEnabled?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkPosition?: string;
  watermarkImage?: string | null;
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
  watermarkEnabled = false,
  watermarkText,
  watermarkOpacity,
  watermarkPosition,
  watermarkImage,
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

  // Buttery Slide Animation State
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | null>(null);

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

  const handleDownloadSingle = async () => {
    if (!currentItem) return;
    const downloadUrl = currentItem.url || currentItem.thumbnailUrl;
    if (!downloadUrl) {
      showToast('Download Error', 'No file URL available for this image.', 'error');
      return;
    }

    setIsDownloadingSingle(true);
    const filename = currentItem.title || `photo-${currentIndex + 1}.jpg`;
    showToast(
      'Download Started',
      `Downloading "${filename}" (${currentItem.sizeMB || 2.5} MB)...`,
      'info'
    );

    try {
      const watermarkOptions = {
        enabled: Boolean(watermarkEnabled && currentItem.type !== 'video'),
        text: watermarkText || studioName || 'PHOTOGRAPHER',
        opacity: watermarkOpacity,
        position: watermarkPosition,
        imageUrl: watermarkImage,
      };
      const success = await downloadSingleImage(downloadUrl, filename, watermarkOptions);
      if (success) {
        showToast('Download Complete', `"${filename}" saved to downloads.`, 'success');
      } else {
        showToast('Download Notice', 'Initiated download. Please check your browser downloads.', 'info');
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
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

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
    <div data-lenis-prevent="true" className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between select-none overlay-animate overscroll-contain">
      {/* Top Bar - Mobile App Ergonomics */}
      <div className="flex items-center justify-between px-2.5 sm:px-6 py-2.5 sm:py-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent z-20 gap-2 sm:gap-3 pt-safe sm:pt-4">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <span className="text-[11px] sm:text-xs uppercase tracking-widest font-serif text-neutral-300 font-semibold truncate max-w-[90px] xs:max-w-[130px] sm:max-w-none">
            {studioName}
          </span>
          <span className="text-[10px] sm:text-xs text-neutral-400 font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/10 shrink-0">
            {currentIndex + 1} / {mediaList.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {onToggleFavorite && (
            <button
              type="button"
              disabled={isFavoriting}
              onClick={() => {
                if (!isFavoriting) {
                  onToggleFavorite(currentItem.id);
                }
              }}
              className={`p-2 sm:p-2.5 rounded-full transition-all cursor-pointer active:scale-95 touch-manipulation ${
                isFavoriting
                  ? 'bg-black/60 text-amber-400 opacity-90 cursor-not-allowed border border-amber-400/30'
                  : currentItem.isFavorite
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white/10 text-neutral-300 hover:text-white hover:bg-white/20'
              }`}
              title={
                isFavoriting
                  ? 'Updating favorite...'
                  : currentItem.isFavorite
                  ? 'Remove from Favorites'
                  : 'Add to Favorites'
              }
            >
              {isFavoriting ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <Heart className={`w-4 h-4 ${currentItem.isFavorite ? 'fill-current' : ''}`} />
              )}
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
            className="flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wide transition-all active:scale-95 border border-white/10 cursor-pointer touch-manipulation"
            title="Share this photo on social media"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {allowDownloads && (
            <button
              onClick={handleDownloadSingle}
              disabled={isDownloadingSingle}
              className="flex items-center justify-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wide transition-all active:scale-95 border border-white/10 disabled:opacity-50 cursor-pointer touch-manipulation"
              title="Download original resolution"
            >
              {isDownloadingSingle ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
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
              className="flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-500/60 text-xs font-semibold tracking-wide transition-all backdrop-blur-md group active:scale-95 cursor-pointer touch-manipulation"
              title="Delete this photo"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all active:scale-95 border border-white/10 cursor-pointer touch-manipulation"
            title="Close viewer (Esc)"
          >
            <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Area: Image or Video with Editor Zoom & Pan & Touch Swipe */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative flex-1 flex items-center justify-center p-1 sm:p-8 md:p-12 overflow-hidden"
      >
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          className="absolute left-1.5 sm:left-6 z-20 p-2.5 sm:p-3.5 rounded-full bg-black/45 hover:bg-black/85 text-white/80 hover:text-white border border-white/15 backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-xl shadow-black/60 touch-manipulation"
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
                  size="lg"
                />
              )}
            </div>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="absolute right-1.5 sm:right-6 z-20 p-2.5 sm:p-3.5 rounded-full bg-black/45 hover:bg-black/85 text-white/80 hover:text-white border border-white/15 backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-xl shadow-black/60 touch-manipulation"
          title="Next Photo (→)"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Editor Floating Zoom Toolbar */}
        {currentItem.type !== 'video' && (
          <div className="absolute bottom-12 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-neutral-950/85 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/80 text-white animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-1.5 rounded-xl hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent text-neutral-300 hover:text-white transition-all active:scale-95 touch-manipulation"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Zoom Percentage / Click to reset */}
            <button
              onClick={handleResetZoom}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg hover:bg-white/15 text-[11px] sm:text-xs font-mono font-semibold tracking-wide text-amber-300 hover:text-amber-200 transition-all active:scale-95 touch-manipulation"
              title="Reset to 100% (0)"
            >
              {Math.round(zoom * 100)}%
            </button>

            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="p-1.5 rounded-xl hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent text-neutral-300 hover:text-white transition-all active:scale-95 touch-manipulation"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <div className="w-[1px] h-3.5 sm:h-4 bg-white/20 mx-0.5 sm:mx-1" />

            {/* Reset to Fit */}
            <button
              onClick={handleResetZoom}
              className={`p-1.5 rounded-xl hover:bg-white/15 text-neutral-300 hover:text-white transition-all active:scale-95 touch-manipulation ${
                zoom > 1 ? 'text-amber-400 hover:text-amber-300' : ''
              }`}
              title="Fit to Screen"
            >
              {zoom > 1 ? <RotateCcw className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {zoom > 1 ? (
              <span className="hidden md:inline pl-1.5 text-[11px] font-mono text-neutral-400">
                Drag to pan
              </span>
            ) : (
              <span className="hidden lg:inline pl-1.5 text-[10px] font-mono text-neutral-500">
                Scroll wheel to zoom
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Caption & Metadata */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs text-neutral-400 z-10 pb-safe sm:pb-3.5">
        <div className="min-w-0">
          <p className="text-white font-medium text-xs sm:text-sm truncate max-w-[200px] xs:max-w-xs sm:max-w-md">{currentItem.title}</p>
          {currentItem.caption && <p className="text-neutral-400 mt-0.5 text-[11px] truncate max-w-[200px] xs:max-w-xs">{currentItem.caption}</p>}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] font-mono text-neutral-500 shrink-0">
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
    </div>,
    document.body
  );
};

