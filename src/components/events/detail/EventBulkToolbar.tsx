import React from 'react';
import { Trash2, Download, Loader2 } from 'lucide-react';

export interface EventBulkToolbarProps {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenBulkDelete: () => void;
  onDownloadSelected?: () => void;
  isDownloading?: boolean;
  downloadProgress?: number;
  isSelectingAll?: boolean;
}

export const EventBulkToolbar: React.FC<EventBulkToolbarProps> = ({
  selectedCount,
  totalCount,
  isAllSelected,
  onSelectAll,
  onDeselectAll,
  onOpenBulkDelete,
  onDownloadSelected,
  isDownloading = false,
  downloadProgress = 0,
  isSelectingAll = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl bg-neutral-900/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-neutral-700/80 shadow-2xl text-white animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-2 pr-3 border-r border-neutral-700">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="font-mono text-xs font-bold text-amber-400">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
      </div>

      <button
        type="button"
        onClick={isAllSelected ? onDeselectAll : onSelectAll}
        disabled={isSelectingAll}
        className="text-xs font-mono font-medium text-neutral-300 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
      >
        {isSelectingAll ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Selecting all...
          </span>
        ) : isAllSelected ? (
          'Deselect All'
        ) : (
          `Select All (${totalCount})`
        )}
      </button>

      <button
        type="button"
        onClick={onDeselectAll}
        className="text-xs font-mono font-medium text-neutral-400 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
      >
        Clear
      </button>

      {onDownloadSelected && (
        <button
          type="button"
          onClick={onDownloadSelected}
          disabled={isDownloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          title="Download selected photos as ZIP"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Packaging {downloadProgress}%...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download ({selectedCount})</span>
            </>
          )}
        </button>
      )}

      <button
        type="button"
        onClick={onOpenBulkDelete}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete Selected ({selectedCount})</span>
      </button>
    </div>
  );
};
