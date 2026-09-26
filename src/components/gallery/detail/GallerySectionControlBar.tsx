import React, { useState } from 'react';
import {
  FolderInput,
  Trash2,
  X,
  Check,
  Plus,
  Loader2,
  Edit2,
  CheckSquare,
  Square,
  Heart,
} from 'lucide-react';
import type { Gallery } from '@/types';
import { createSectionSchema } from '@/schemas/atelierSchemas';

interface GallerySectionControlBarProps {
  gallery: Gallery;
  selectedIds: string[];
  dashboardSectionFilter: string;
  showFavoritesOnly?: boolean;
  onToggleFavoritesOnly?: () => void;
  filteredCount?: number;
  isAllSelected?: boolean;
  onSelectSectionFilter: (sec: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOpenBulkMove: () => void;
  onOpenBulkDelete: () => void;
  onCreateSection: (title: string) => Promise<void> | void;
  onRenameSection: (oldTitle: string, newTitle: string) => Promise<void> | void;
  onDeleteSection: (title: string) => Promise<void> | void;
  isCreatingSection?: boolean;
  isRenamingSection?: boolean;
  isDeletingSection?: boolean;
}

export const GallerySectionControlBar: React.FC<GallerySectionControlBarProps> = ({
  gallery,
  selectedIds,
  dashboardSectionFilter,
  showFavoritesOnly = false,
  onToggleFavoritesOnly,
  filteredCount,
  isAllSelected: isAllSelectedProp,
  onSelectSectionFilter,
  onSelectAll,
  onClearSelection,
  onOpenBulkMove,
  onOpenBulkDelete,
  onCreateSection,
  onRenameSection,
  onDeleteSection,
  isCreatingSection = false,
  isRenamingSection = false,
  isDeletingSection = false,
}) => {
  const [isCreatingQuickSection, setIsCreatingQuickSection] = useState(false);
  const [newQuickSectionInput, setNewQuickSectionInput] = useState('');

  const [editingSectionName, setEditingSectionName] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const totalFavoritesCount = gallery.media.filter((m) => m.isFavorite).length;
  const countToDisplay = filteredCount ?? gallery.media.length;
  const isAllSelected =
    isAllSelectedProp ?? (countToDisplay > 0 && selectedIds.length >= countToDisplay);

  const handleCreate = async () => {
    if (isCreatingSection) return;
    const raw = newQuickSectionInput.trim();
    if (!raw) return;

    const parseResult = createSectionSchema.safeParse({ title: raw });
    if (!parseResult.success) {
      return;
    }
    const trimmed = parseResult.data.title;
    try {
      await onCreateSection(trimmed);
      setNewQuickSectionInput('');
      setIsCreatingQuickSection(false);
    } catch {
      // Keep input open on failure so the user does not lose typed text
    }
  };

  const handleRename = async (oldName: string) => {
    if (isRenamingSection) return;
    const raw = renameInput.trim();
    if (!raw) return;

    const parseResult = createSectionSchema.safeParse({ title: raw });
    if (!parseResult.success) {
      setEditingSectionName(null);
      return;
    }
    const newName = parseResult.data.title;
    if (newName === oldName) {
      setEditingSectionName(null);
      return;
    }
    try {
      await onRenameSection(oldName, newName);
      setEditingSectionName(null);
    } catch {
      // Keep input open on failure so the user does not lose typed text
    }
  };

  const allSections = React.useMemo(() => {
    const fromGallery = gallery.sections || [];
    const fromMedia = gallery.media
      .map((m) => m.sectionTitle)
      .filter((t): t is string => Boolean(t && t.trim() && t.toUpperCase() !== 'UNASSIGNED'));

    const seen = new Set<string>();
    const combined: string[] = [];

    for (const sec of fromGallery) {
      const upper = sec.trim().toUpperCase();
      if (!seen.has(upper)) {
        seen.add(upper);
        combined.push(sec.trim());
      }
    }

    for (const sec of fromMedia) {
      const upper = sec.trim().toUpperCase();
      if (!seen.has(upper)) {
        seen.add(upper);
        combined.push(sec.trim());
      }
    }

    return combined;
  }, [gallery.sections, gallery.media]);

  return (
    <div className="sticky top-0 z-30 -mx-4 sm:-mx-8 px-4 sm:px-8 pt-1.5 pb-2 sm:pt-2 sm:pb-2.5 bg-[#f8f9fa]/95 dark:bg-[#0c0d12]/95 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-md dark:shadow-black/50 transition-all space-y-2">
      {/* Floating Bulk Selection Action Bar: ONLY visible when images are selected */}
      {selectedIds.length > 0 && (
        <div className="relative rounded-2xl bg-white dark:bg-[#13141c] border border-amber-500/30 shadow-lg shadow-amber-500/5 dark:shadow-black/60 p-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Glowing amber accent highlight line */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-t-2xl" />

            {/* Left: Count & Meta */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2.5">
                <div className="min-w-[28px] h-7 px-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 font-mono font-bold text-xs flex items-center justify-center shadow-md shadow-amber-500/20">
                  {selectedIds.length}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100">
                      {selectedIds.length === 1 ? '1 Photo' : `${selectedIds.length} Photos`} Selected
                    </span>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono hidden md:inline">
                      ({selectedIds.length} of {gallery.media.length})
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Clear Button */}
              <button
                type="button"
                onClick={onClearSelection}
                className="sm:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                title="Deselect all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onOpenBulkMove}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                title="Move selected photos to another section"
              >
                <FolderInput className="w-3.5 h-3.5 text-amber-500" />
                <span>Move<span className="hidden sm:inline"> to Section</span> ({selectedIds.length})</span>
              </button>

              <button
                type="button"
                onClick={onOpenBulkDelete}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                title="Delete selected photos"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={onClearSelection}
                className="hidden sm:inline-flex items-center justify-center p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Deselect all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Section Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 py-0.5">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold shrink-0 mr-1 select-none">
            SECTION:
          </span>
          <button
            type="button"
            onClick={() => onSelectSectionFilter('all')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-[13px] font-mono tracking-tight transition-all cursor-pointer min-h-[38px] sm:min-h-[40px] inline-flex items-center justify-center select-none active:scale-[0.98] ${
              dashboardSectionFilter === 'all'
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm shadow-amber-400/20'
                : 'bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
          >
            All ({gallery.media.length})
          </button>

          {allSections.map((sec) => {
            const count = gallery.media.filter(
              (m) => (m.sectionTitle || '').toLowerCase() === sec.toLowerCase()
            ).length;
            const isSelected = dashboardSectionFilter.toLowerCase() === sec.toLowerCase();
            const isEditing = editingSectionName === sec;

            if (isEditing) {
              return (
                <div
                  key={sec}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-amber-400 px-2.5 py-1.5 rounded-xl shadow-md ring-2 ring-amber-400/20 min-h-[38px] sm:min-h-[40px]"
                >
                  <input
                    type="text"
                    value={renameInput}
                    disabled={isRenamingSection}
                    onChange={(e) => setRenameInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!isRenamingSection && renameInput.trim()) {
                          handleRename(sec);
                        }
                      }
                      if (e.key === 'Escape' && !isRenamingSection) {
                        setEditingSectionName(null);
                      }
                    }}
                    autoFocus
                    className="px-2 py-0.5 text-xs sm:text-[13px] font-mono uppercase bg-transparent text-neutral-900 dark:text-white outline-hidden w-28 sm:w-36 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={isRenamingSection || !renameInput.trim()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRename(sec);
                    }}
                    className="p-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-transform cursor-pointer active:scale-95 flex items-center justify-center min-w-[28px] min-h-[28px]"
                    title="Save Name"
                  >
                    {isRenamingSection ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isRenamingSection}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingSectionName(null);
                    }}
                    className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={sec}
                role="button"
                tabIndex={0}
                onClick={() => onSelectSectionFilter(sec)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSectionFilter(sec);
                  }
                }}
                className={`group relative inline-flex items-center px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-[13px] font-mono uppercase transition-all duration-200 cursor-pointer min-h-[38px] sm:min-h-[40px] select-none active:scale-[0.98] ${
                  isSelected
                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm shadow-amber-400/20'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <span className="truncate max-w-[200px] sm:max-w-[280px]">
                  {sec} ({count})
                </span>

                {/* Edit & Delete actions: 0 width when not hovered; smoothly expands on hover/focus without initial blank gap */}
                <div className="flex items-center gap-1 max-w-0 opacity-0 overflow-hidden group-hover:max-w-[68px] group-hover:opacity-100 group-hover:ml-2 group-focus-within:max-w-[68px] group-focus-within:opacity-100 group-focus-within:ml-2 transition-all duration-200 ease-out">
                  <button
                    type="button"
                    disabled={isRenamingSection || isCreatingSection || isDeletingSection}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSectionName(sec);
                      setRenameInput(sec);
                    }}
                    className={`p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected ? 'text-neutral-950 hover:text-black' : 'text-neutral-400 hover:text-amber-500'
                    }`}
                    title="Rename Section"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isRenamingSection || isCreatingSection || isDeletingSection}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSection(sec);
                    }}
                    className={`p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected ? 'text-neutral-950 hover:text-rose-700' : 'text-neutral-400 hover:text-rose-500'
                    }`}
                    title="Delete Section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Quick Add Section Button / Inline Input */}
          {isCreatingQuickSection ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-amber-400 px-2.5 py-1.5 rounded-xl shadow-md ring-2 ring-amber-400/20 min-h-[38px] sm:min-h-[40px]"
            >
              <input
                type="text"
                value={newQuickSectionInput}
                disabled={isCreatingSection}
                onChange={(e) => setNewQuickSectionInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!isCreatingSection && newQuickSectionInput.trim()) {
                      handleCreate();
                    }
                  }
                  if (e.key === 'Escape' && !isCreatingSection) {
                    setIsCreatingQuickSection(false);
                  }
                }}
                placeholder="NEW SECTION..."
                autoFocus
                className="px-2 py-0.5 text-xs sm:text-[13px] font-mono uppercase bg-transparent text-neutral-900 dark:text-white outline-hidden w-32 sm:w-44 placeholder:text-neutral-400 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCreate();
                }}
                disabled={isCreatingSection || !newQuickSectionInput.trim()}
                className="p-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-transform cursor-pointer active:scale-95 flex items-center justify-center min-w-[28px] min-h-[28px]"
                title="Save Section"
              >
                {isCreatingSection ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
              </button>
              <button
                type="button"
                disabled={isCreatingSection}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsCreatingQuickSection(false);
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isCreatingSection || isRenamingSection || isDeletingSection}
              onClick={() => {
                setIsCreatingQuickSection(true);
                setNewQuickSectionInput('');
              }}
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-[13px] font-mono transition-all duration-200 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer font-bold min-h-[38px] sm:min-h-[40px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Create a new section"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Section</span>
            </button>
          )}
        </div>

        {/* Sub-header info: Select All count & Liked Photos Filter */}
        <div className="flex items-center justify-between gap-3 pt-1 pb-0.5 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-200/50 dark:border-neutral-800/50">
          <button
            type="button"
            onClick={onSelectAll}
            className="flex items-center gap-2 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer select-none py-1"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-amber-500" />
            ) : (
              <Square className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            )}
            <span>Select All ({countToDisplay})</span>
          </button>

          {/* Liked / Favorites Filter */}
          {onToggleFavoritesOnly && (
            <button
              type="button"
              onClick={onToggleFavoritesOnly}
              className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all duration-200 cursor-pointer select-none active:scale-[0.97] ${
                showFavoritesOnly
                  ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/25 ring-2 ring-rose-500/30'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:border-rose-400/50 dark:hover:border-rose-500/40 shadow-xs'
              }`}
              title={showFavoritesOnly ? 'Show all photos' : 'Filter by liked photos only'}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showFavoritesOnly
                    ? 'fill-white text-white scale-110'
                    : totalFavoritesCount > 0
                    ? 'text-rose-500 fill-rose-500/20 group-hover:scale-110'
                    : 'text-neutral-400 group-hover:text-rose-400 group-hover:scale-110'
                }`}
              />
              <span>Liked</span>
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md leading-none transition-colors ${
                  showFavoritesOnly
                    ? 'bg-white/25 text-white'
                    : totalFavoritesCount > 0
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                {totalFavoritesCount}
              </span>
            </button>
          )}
        </div>
    </div>
  );
};
