import React from 'react';
import {
  Download,
  Play,
  X,
  Share2,
  Loader2,
  Film,
} from 'lucide-react';

interface SelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onDownloadSelected: () => void;
  onPlaySlideshow: () => void;
  onShareSelected?: () => void;
  onCreateStoryVideo?: () => void;
  isDownloading?: boolean;
  downloadProgress?: number;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  onDownloadSelected,
  onPlaySlideshow,
  onShareSelected,
  onCreateStoryVideo,
  isDownloading = false,
  downloadProgress = 0,
}) => {
  if (selectedCount === 0) return null;

  const isAllSelected = selectedCount === totalCount;

  return (
    <aside
      aria-label="Photo Selection Bar"
      className="fixed bottom-2 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 w-auto max-w-full sm:max-w-4xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="relative bg-neutral-950/95 backdrop-blur-2xl border border-neutral-700/70 ring-1 ring-amber-500/30 rounded-2xl sm:rounded-full px-3 sm:px-6 py-2 sm:py-3 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-5 text-white pb-safe sm:pb-3">
        {/* Progress Bar when packaging download */}
        {isDownloading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-800 rounded-t-2xl sm:rounded-t-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-200 transition-all duration-200"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        )}

        {/* Top/Left Section: Selected Count & Selection Toggle */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3.5 shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 text-neutral-950 font-mono font-bold text-xs flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
              {selectedCount}
            </span>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-semibold text-white text-xs sm:text-sm tracking-tight">
                Selected
              </span>
              <span className="text-[10px] sm:text-xs text-neutral-400 font-mono">
                ({selectedCount}/{totalCount})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={isAllSelected ? onClearSelection : onSelectAll}
              className="px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[10px] sm:text-[11px] font-mono text-neutral-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer active:scale-95 touch-manipulation"
            >
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </button>

            <button
              onClick={onClearSelection}
              title="Clear selection"
              className="p-1 rounded-lg sm:rounded-full text-neutral-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer active:scale-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtle Divider for wide screens */}
        <div className="hidden sm:block w-px h-6 bg-white/10 shrink-0" />

        {/* Bottom/Right Section: Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 justify-stretch sm:justify-end">
          {/* Share Selected Photos Button */}
          {onShareSelected && (
            <button
              onClick={onShareSelected}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl sm:rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/70 hover:border-amber-400/40 text-neutral-200 hover:text-white text-xs font-semibold tracking-wide transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-sm touch-manipulation"
              title="Share selected photos to social media"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline sm:inline">Share</span>
            </button>
          )}

          {/* Play Slideshow Button */}
          <button
            onClick={onPlaySlideshow}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl sm:rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/70 hover:border-amber-400/40 text-neutral-200 hover:text-white text-xs font-semibold tracking-wide transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-sm touch-manipulation"
            title="Start slideshow with selected photos"
          >
            <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
            <span className="hidden xs:inline sm:inline">Slideshow</span>
          </button>

          {/* Make Reel / Video Button */}
          {onCreateStoryVideo && (
            <button
              onClick={onCreateStoryVideo}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl sm:rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 text-amber-300 hover:text-white text-xs font-bold tracking-wide transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-md shadow-amber-500/10 touch-manipulation"
              title="Create Video Story / Reel from selected photos"
            >
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span>Make Video</span>
            </button>
          )}

          {/* Download Selected Photos Button */}
          <button
            onClick={onDownloadSelected}
            disabled={isDownloading}
            className="flex-[2] sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 rounded-xl sm:rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:brightness-105 text-neutral-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 active:scale-95 whitespace-nowrap cursor-pointer touch-manipulation"
            title="Download selected photos as ZIP"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{downloadProgress}%</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Download ({selectedCount})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
