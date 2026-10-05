import React from 'react';
import { Check, Trash2, Play, Film, Eye } from 'lucide-react';
import type { MediaItem } from '@/types';

export interface EventMediaCardProps {
  item: MediaItem;
  isSelected: boolean;
  selectedCount: number;
  onToggleSelect: (id: string, e?: React.MouseEvent) => void;
  onOpenLightbox: () => void;
  onDelete: (id: string, title: string) => void;
}

export const EventMediaCard: React.FC<EventMediaCardProps> = ({
  item,
  isSelected,
  selectedCount,
  onToggleSelect,
  onOpenLightbox,
  onDelete,
}) => {
  const isVideo = item.type === 'video';

  return (
    <div
      className={`group relative rounded-2xl bg-white dark:bg-[#121319] border overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col ${
        isSelected
          ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-500/5 dark:bg-amber-400/5'
          : 'border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
      }`}
    >
      <div
        onClick={() => {
          if (selectedCount > 0) {
            onToggleSelect(item.id);
          } else {
            onOpenLightbox();
          }
        }}
        className="relative aspect-[4/5] w-full overflow-hidden cursor-pointer bg-neutral-100 dark:bg-neutral-950"
      >
        <img
          src={item.url || item.thumbnailUrl}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            if (item.thumbnailUrl && e.currentTarget.src !== item.thumbnailUrl) {
              e.currentTarget.src = item.thumbnailUrl;
            }
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10 pointer-events-none">
          <button
            type="button"
            onClick={(e) => onToggleSelect(item.id, e)}
            className={`pointer-events-auto p-1.5 rounded-lg transition-all cursor-pointer shadow-md ${
              isSelected
                ? 'bg-amber-400 text-neutral-950 opacity-100 scale-100 shadow-amber-400/30'
                : selectedCount > 0
                ? 'bg-black/75 hover:bg-black/90 text-white opacity-90 hover:scale-105'
                : 'bg-black/60 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 hover:scale-105'
            }`}
            title={isSelected ? 'Deselect photo' : 'Select photo for bulk actions'}
          >
            <div
              className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                isSelected
                  ? 'border-neutral-950 bg-neutral-950 text-amber-400'
                  : 'border-white/70 bg-transparent'
              }`}
            >
              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            {item.sectionTitle && (
              <span className="pointer-events-auto px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[9px] font-mono text-amber-300 uppercase font-bold border border-amber-400/20 shadow-xs">
                {item.sectionTitle}
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id, item.title || 'Photo');
              }}
              className="pointer-events-auto p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
              title="Remove photo from event"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>
        )}

        <div className="absolute bottom-2 inset-x-2.5 flex items-center justify-between text-white z-10 pointer-events-none">
          {isVideo ? (
            <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-amber-400 text-[9px] font-mono flex items-center gap-1 border border-white/10">
              <Film className="w-2.5 h-2.5" /> Reel
            </span>
          ) : (
            <span />
          )}

          {item.sizeMB && (
            <span className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-neutral-300 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded transition-opacity">
              {item.sizeMB} MB
            </span>
          )}
        </div>
      </div>

      <div className="p-3 flex items-center justify-between text-xs border-t border-neutral-100 dark:border-neutral-800/80 bg-white dark:bg-[#121319]">
        <div className="min-w-0 pr-2">
          <p className="font-serif italic font-medium text-neutral-900 dark:text-neutral-200 truncate">
            {item.title}
          </p>
          <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase">
            {item.sectionTitle || 'HIGHLIGHTS'}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenLightbox}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
          title="Open Full Detail View"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
