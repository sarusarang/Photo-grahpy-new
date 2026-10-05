import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ArrowUpDown,
  ChevronsUp,
  ChevronsDown,
  ArrowUp,
  ArrowDown,
  Check,
  RotateCcw,
  Sparkles,
  GripVertical,
  Search,
  SlidersHorizontal,
  ArrowDownAZ,
  Calendar,
  Save,
  Loader2,
} from 'lucide-react';
import type { MediaItem } from '@/types';
import { useToast } from '@/components/ui/Toast';

export interface ReorderGalleryPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem[];
  galleryTitle?: string;
  onApplyReorder: (reorderedMedia: MediaItem[]) => Promise<void> | void;
  isSaving?: boolean;
}

export const ReorderGalleryPhotosModal: React.FC<ReorderGalleryPhotosModalProps> = ({
  isOpen,
  onClose,
  media,
  galleryTitle = 'Gallery',
  onApplyReorder,
  isSaving = false,
}) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync internal state when opened or media changes
  useEffect(() => {
    if (isOpen) {
      setItems([...media]);
      setHasUnsavedChanges(false);
      setSearchQuery('');
    }
  }, [isOpen, media]);

  // Lock background scroll
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isSaving]);

  // Move item to top
  const handleMoveToTop = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Move item to bottom
  const handleMoveToBottom = (index: number) => {
    if (index === items.length - 1) return;
    setItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.push(item);
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Move item step
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Move item to arbitrary 1-based position
  const handleMoveToPosition = (fromIndex: number, targetPosition1Based: number) => {
    const targetIndex = Math.max(0, Math.min(items.length - 1, targetPosition1Based - 1));
    if (targetIndex === fromIndex) return;

    setItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
    setHasUnsavedChanges(true);
  };

  // Preset: Reverse entire sequence
  const handleReverseOrder = () => {
    setItems((prev) => [...prev].reverse());
    setHasUnsavedChanges(true);
    showToast('Reversed', 'Inverted entire photo sequence.', 'info');
  };

  // Preset: Sort alphabetically by filename
  const handleSortByName = () => {
    setItems((prev) =>
      [...prev].sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    );
    setHasUnsavedChanges(true);
    showToast('Sorted by Name', 'Arranged photos alphabetically (A-Z).', 'info');
  };

  // Preset: Reset to initial order
  const handleResetToInitial = () => {
    setItems([...media]);
    setHasUnsavedChanges(false);
    showToast('Reset', 'Restored original gallery sequence.', 'info');
  };

  // Drag and Drop handlers
  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (dropIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setItems((prev) => {
      const next = [...prev];
      const [draggedItem] = next.splice(draggedIndex, 1);
      next.splice(dropIndex, 0, draggedItem);
      return next;
    });

    setHasUnsavedChanges(true);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Save changes
  const handleSave = async () => {
    try {
      await onApplyReorder(items);
      setHasUnsavedChanges(false);
      onClose();
    } catch (err: any) {
      showToast('Save Failed', err?.message || 'Could not save sequence.', 'error');
    }
  };

  // Filtered view when searching
  const displayedItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items.map((item, idx) => ({ item, originalIndex: idx }));
    }
    const q = searchQuery.toLowerCase();
    return items
      .map((item, idx) => ({ item, originalIndex: idx }))
      .filter(
        ({ item }) =>
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.sectionTitle && item.sectionTitle.toLowerCase().includes(q))
      );
  }, [items, searchQuery]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overlay-animate overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#111218] border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.9)] text-white overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#161722]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Arrange Photo Sequence
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {items.length} Photos
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Drag, jump to top/bottom, or type any position number to reorder photos in "{galleryTitle}".
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search & Preset Reordering Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-white/10 bg-[#141520]">
          {/* Quick Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find by filename or section..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Quick Preset Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleReverseOrder}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Invert photo order"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reverse Order</span>
            </button>

            <button
              type="button"
              onClick={handleSortByName}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sort alphabetically by filename"
            >
              <ArrowDownAZ className="w-3.5 h-3.5 text-amber-400" />
              <span>Sort A-Z</span>
            </button>

            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleResetToInitial}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Media Sequence List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {displayedItems.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs font-mono">
              No photos matched your search.
            </div>
          ) : (
            displayedItems.map(({ item, originalIndex }) => {
              const isFirst = originalIndex === 0;
              const isLast = originalIndex === items.length - 1;
              const isDraggingCurrent = draggedIndex === originalIndex;
              const isDropTarget = dragOverIndex === originalIndex && !isDraggingCurrent;

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(originalIndex, e)}
                  onDragOver={(e) => handleDragOver(originalIndex, e)}
                  onDrop={(e) => handleDrop(originalIndex, e)}
                  onDragEnd={handleDragEnd}
                  className={`group flex items-center justify-between gap-3 p-2 sm:p-2.5 rounded-2xl border transition-all ${
                    isDraggingCurrent
                      ? 'opacity-40 bg-neutral-900 border-dashed border-amber-500/50 scale-[0.99]'
                      : isDropTarget
                      ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500'
                      : 'bg-[#161720]/80 hover:bg-[#1c1d29] border-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Left: Drag Handle, Sequence Number & Thumbnail */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="text-neutral-500 group-hover:text-amber-400 cursor-grab active:cursor-grabbing p-1 transition-colors"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Position Input / Badge */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] font-mono text-neutral-500 font-bold">#</span>
                      <input
                        type="number"
                        min={1}
                        max={items.length}
                        defaultValue={originalIndex + 1}
                        key={`${item.id}-${originalIndex}`}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1 && val <= items.length && val !== originalIndex + 1) {
                            handleMoveToPosition(originalIndex, val);
                          } else {
                            e.target.value = String(originalIndex + 1);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        className="w-12 px-1.5 py-1 text-center font-mono font-bold text-xs bg-black/60 hover:bg-black/90 focus:bg-black border border-white/10 focus:border-amber-400 rounded-lg text-amber-300 focus:outline-none transition-colors"
                        title="Click to type a target position number and press Enter"
                      />
                    </div>

                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-white/10 overflow-hidden shrink-0">
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Photo Info */}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white truncate max-w-[200px] sm:max-w-xs">
                        {item.title || 'Untitled Photograph'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.sectionTitle && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-amber-300/90 border border-white/5 uppercase">
                            {item.sectionTitle}
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500 font-mono">
                          Position {originalIndex + 1} of {items.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Jump Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Send to Top */}
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveToTop(originalIndex)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-neutral-300 text-xs font-mono disabled:opacity-20 transition-all flex items-center gap-1 cursor-pointer"
                      title="Move directly to top (#1)"
                    >
                      <ChevronsUp className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Top</span>
                    </button>

                    {/* Step Up */}
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveStep(originalIndex, 'up')}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                      title="Move up one position"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Step Down */}
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveStep(originalIndex, 'down')}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                      title="Move down one position"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Send to Bottom */}
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveToBottom(originalIndex)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-neutral-300 text-xs font-mono disabled:opacity-20 transition-all flex items-center gap-1 cursor-pointer"
                      title="Move directly to bottom"
                    >
                      <ChevronsDown className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Bottom</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#161722]/80 backdrop-blur-md">
          <div className="text-xs text-neutral-400 font-mono">
            {hasUnsavedChanges ? (
              <span className="text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Unsaved sequence changes
              </span>
            ) : (
              <span>Sequence matches current gallery order</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                  <span>Saving Sequence...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Sequence Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
