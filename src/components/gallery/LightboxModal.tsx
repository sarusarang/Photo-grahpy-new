import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { MediaItem } from '../../types';
import { useToast } from '../ui/Toast';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Share2,
  Maximize2,
  Info,
  Film,
} from 'lucide-react';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: MediaItem[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
  studioName?: string;
  allowDownloads?: boolean;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  mediaList,
  currentIndex,
  onNavigate,
  onToggleFavorite,
  studioName = 'EX STUDIO',
  allowDownloads = true,
}) => {
  const { showToast } = useToast();

  const currentItem = mediaList[currentIndex];

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    } else {
      onNavigate(mediaList.length - 1); // Wrap around
    }
  }, [currentIndex, mediaList.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < mediaList.length - 1) {
      onNavigate(currentIndex + 1);
    } else {
      onNavigate(0); // Wrap around
    }
  }, [currentIndex, mediaList.length, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentItem) return null;

  const handleDownloadSingle = () => {
    showToast(
      'Download Started',
      `Downloading full-resolution file "${currentItem.title}" (${currentItem.sizeMB} MB)...`,
      'success'
    );
    // Trigger download anchor
    const a = document.createElement('a');
    a.href = currentItem.url;
    a.download = `${currentItem.title.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none overlay-animate">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-widest font-serif text-neutral-300 font-semibold">
            {studioName}
          </span>
          <span className="text-xs text-neutral-500 font-mono">
            {currentIndex + 1} / {mediaList.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(currentItem.id)}
              className={`p-2.5 rounded-full transition-colors ${
                currentItem.isFavorite
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/10 text-neutral-300 hover:text-white hover:bg-white/20'
              }`}
              title="Add to Favorites"
            >
              <Heart className={`w-4 h-4 ${currentItem.isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}

          {allowDownloads && (
            <button
              onClick={handleDownloadSingle}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wide transition-colors"
              title="Download original resolution"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download ({currentItem.sizeMB} MB)</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Area: Image or Video */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-12 overflow-hidden">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          className="absolute left-4 sm:left-8 z-20 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Media Container */}
        <div className="relative max-h-full max-w-full flex items-center justify-center">
          {currentItem.type === 'video' ? (
            <div className="relative w-full max-w-4xl aspect-video bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800">
              <video
                src={currentItem.url}
                poster={currentItem.thumbnailUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono text-amber-400 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" /> 4K Video Reel
              </div>
            </div>
          ) : (
            <img
              key={currentItem.id}
              src={currentItem.url}
              alt={currentItem.title}
              className="max-h-[82vh] max-w-[92vw] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            />
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="absolute right-4 sm:right-8 z-20 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all hover:scale-110"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Caption & Metadata */}
      <div className="px-6 py-4 bg-gradient-to-t from-black/90 to-transparent flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
        <div>
          <p className="text-white font-medium text-sm">{currentItem.title}</p>
          {currentItem.caption && <p className="text-neutral-400 mt-0.5">{currentItem.caption}</p>}
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-500">
          <span>
            {currentItem.width} × {currentItem.height} px
          </span>
          <span>•</span>
          <span>{currentItem.sizeMB} MB</span>
          <span>•</span>
          <span>Original RAW/JPEG</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
