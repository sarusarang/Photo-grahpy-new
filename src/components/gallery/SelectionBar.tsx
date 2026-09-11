import React from 'react';
import {
  CheckSquare,
  Square,
  Download,
  Play,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface SelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onDownloadSelected: () => void;
  onPlaySlideshow: () => void;
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
  isDownloading = false,
  downloadProgress = 0,
}) => {
  if (selectedCount === 0) return null;

  const isAllSelected = selectedCount === totalCount;

  return (
    <aside
      aria-label="Photo Selection Bar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[calc(100%-2rem)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-6"
    >
      <div className="relative bg-neutral-950/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-2xl shadow-black/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
        {/* Progress Bar when downloading */}
        {isDownloading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-800 rounded-t-3xl overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-200 transition-all duration-200"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        )}

        {/* Selected Count & Toggle All */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-amber-400 text-neutral-950 font-mono font-bold text-xs flex items-center justify-center shadow-md">
              {selectedCount}
            </span>
            <div className="text-xs">
              <span className="font-medium text-white">Photos Selected</span>
              <span className="text-[11px] text-neutral-400 hidden sm:inline ml-1 font-mono">
                ({selectedCount} of {totalCount})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={isAllSelected ? onClearSelection : onSelectAll}
              className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-mono text-neutral-300 hover:text-white transition-colors"
            >
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </button>

            <button
              onClick={onClearSelection}
              title="Clear selection"
              className="p-1 rounded-lg text-neutral-400 hover:text-rose-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Actions: Download Selected & Play Selected Slideshow */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onPlaySlideshow}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-all border border-neutral-700/80 hover:border-amber-400/40"
          >
            <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
            <span>Slideshow ({selectedCount})</span>
          </button>

          <button
            onClick={onDownloadSelected}
            disabled={isDownloading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-neutral-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Downloading {downloadProgress}%...</span>
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
