import React from 'react';
import { Camera, Trash2, Upload, Zap, Loader2 } from 'lucide-react';
import { EventMediaCard } from './EventMediaCard';
import type { MediaItem } from '@/types';

export interface EventMediaStreamProps {
  media: MediaItem[];
  allMedia: MediaItem[];
  availableSections: string[];
  selectedSectionFilter: string;
  onSelectSection: (section: string) => void;
  selectedIds: string[];
  isAllSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onOpenBulkDelete: () => void;
  onToggleSelect: (id: string, e?: React.MouseEvent) => void;
  onOpenLightbox: (index: number) => void;
  onDeleteSingleMedia: (media: { id: string; title: string }) => void;
  onOpenUploadModal: () => void;
  onOpenStation: () => void;
  hasMoreMedia: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  visibleCount: number;
  filteredCount: number;
  totalCount?: number;
  sectionCounts?: Record<string, number>;
}

export const EventMediaStream: React.FC<EventMediaStreamProps> = ({
  media,
  allMedia,
  availableSections,
  selectedSectionFilter,
  onSelectSection,
  selectedIds,
  isAllSelected,
  onSelectAll,
  onDeselectAll,
  onOpenBulkDelete,
  onToggleSelect,
  onOpenLightbox,
  onDeleteSingleMedia,
  onOpenUploadModal,
  onOpenStation,
  hasMoreMedia,
  loadMoreRef,
  visibleCount,
  filteredCount,
  totalCount,
  sectionCounts,
}) => {
  const resolvedTotal = totalCount || allMedia.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-2.5">
          <Camera className="w-5 h-5 text-amber-500" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-serif font-bold text-neutral-900 dark:text-white">
                Live Photos & Video Stream ({resolvedTotal})
              </h3>
              {selectedIds.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-mono font-bold animate-in fade-in">
                  {selectedIds.length} selected
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
              Biometric AI Face Search automatically indexes all uploaded shots
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
          {availableSections.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs font-mono">
              <button
                type="button"
                onClick={() => onSelectSection('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  selectedSectionFilter === 'all'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                All ({resolvedTotal})
              </button>
              {availableSections.map((sec) => {
                const count =
                  sectionCounts?.[sec] ??
                  sectionCounts?.[sec.toUpperCase()] ??
                  allMedia.filter(
                    (m) => (m.sectionTitle || '').toUpperCase() === sec
                  ).length;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onSelectSection(sec)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                      selectedSectionFilter === sec
                        ? 'bg-amber-400 text-neutral-950 shadow-sm'
                        : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {sec} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {allMedia.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono">
              {selectedIds.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={isAllSelected ? onDeselectAll : onSelectAll}
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold transition-colors cursor-pointer"
                  >
                    {isAllSelected ? 'Deselect All' : `Select All (${filteredCount})`}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenBulkDelete}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete ({selectedIds.length})</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer flex items-center gap-1"
                  title="Select all photos in this view"
                >
                  <span>Select All</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {allMedia.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#101117] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 max-w-md mx-auto space-y-3">
          <Camera className="w-10 h-10 text-neutral-400 mx-auto stroke-1" />
          <p className="font-serif italic text-neutral-700 dark:text-neutral-300 text-base">
            No media in this event yet
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            Launch the Camera Station above or use Quick Upload to stream photographs and reels.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={onOpenUploadModal}
              className="py-2 px-4 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              <span>Upload Files</span>
            </button>
            <button
              onClick={onOpenStation}
              className="py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Camera Station</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
            {media.map((item: any) => {
              const origIndex = allMedia.findIndex((m: any) => m.id === item.id);
              const isSelected = selectedIds.includes(item.id);

              return (
                <EventMediaCard
                  key={item.id}
                  item={item}
                  isSelected={isSelected}
                  selectedCount={selectedIds.length}
                  onToggleSelect={onToggleSelect}
                  onOpenLightbox={() => onOpenLightbox(origIndex !== -1 ? origIndex : 0)}
                  onDelete={(id, title) => onDeleteSingleMedia({ id, title })}
                />
              );
            })}
          </div>

          <div className="py-6 flex flex-col items-center justify-center space-y-2 text-xs font-mono text-neutral-500">
            {hasMoreMedia ? (
              <div ref={loadMoreRef} className="flex items-center gap-2 text-amber-500 font-bold py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading more event media...</span>
              </div>
            ) : (
              <div className="text-neutral-400 text-[11px]">
                All {filteredCount} media items loaded
              </div>
            )}
            <span className="text-[10px] text-neutral-400">
              Showing {visibleCount} of {filteredCount} photographs & reels
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
