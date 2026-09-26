import React from 'react';
import {
  CheckSquare,
  Square,
  ArrowUp,
  ArrowDown,
  Film,
  Heart,
  FolderInput,
  Sparkles,
  Trash2,
  Loader2,
} from 'lucide-react';
import type { MediaItem } from '@/types';

interface GalleryMediaCardProps {
  item: MediaItem;
  idx: number;
  totalCount: number;
  isSelected: boolean;
  isCover?: boolean;
  isBanner?: boolean;
  isSettingBanner?: boolean;
  isFavoriting?: boolean;
  currentTemplateName?: string;
  onToggleSelect: (id: string) => void;
  onOpenLightbox: (idx: number) => void;
  onMoveSequence: (idx: number, direction: 'up' | 'down') => void;
  onToggleFavorite: (id: string) => void;
  onOpenMoveSingle: (item: MediaItem) => void;
  onSetBanner: (item: MediaItem) => void;
  onDeleteSingle: (item: MediaItem) => void;
}

export const GalleryMediaCard: React.FC<GalleryMediaCardProps> = ({
  item,
  idx,
  totalCount,
  isSelected,
  isCover = false,
  isBanner = false,
  isSettingBanner = false,
  isFavoriting = false,
  currentTemplateName,
  onToggleSelect,
  onOpenLightbox,
  onMoveSequence,
  onToggleFavorite,
  onOpenMoveSingle,
  onSetBanner,
  onDeleteSingle,
}) => {
  const isHeroBanner = Boolean(isBanner || isCover);
  return (
    <div
      className={`group relative rounded-xl sm:rounded-2xl bg-white dark:bg-[#121319] border overflow-hidden card-lift fade-up transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-amber-400 dark:ring-amber-400 border-transparent shadow-xl shadow-amber-500/10 dark:shadow-amber-400/20 scale-[1.01]'
          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm'
      }`}
    >
      {/* Thumbnail Container with Portrait aspect ratio 4:5 */}
      <div
        onClick={() => onOpenLightbox(idx)}
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

        {/* Top Action Row — Always visible on touch, hoverable on desktop */}
        <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none z-10">
          {/* Select Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(item.id);
            }}
            className={`pointer-events-auto p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer ${
              isSelected
                ? 'bg-amber-400 text-neutral-950 opacity-100 shadow-md shadow-amber-400/30'
                : 'bg-black/50 text-white/90 hover:bg-black/70 opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
            title={isSelected ? 'Deselect photo' : 'Select photo'}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Square className="w-4 h-4 text-white/90" />
            )}
          </button>

          {/* Quick Sequence Reordering Arrows */}
          <div className="pointer-events-auto opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-black/60 backdrop-blur-md rounded-lg p-0.5 transition-opacity">
            <button
              type="button"
              disabled={idx === 0}
              onClick={(e) => {
                e.stopPropagation();
                onMoveSequence(idx, 'up');
              }}
              className="p-1 text-white hover:text-amber-400 disabled:opacity-30 transition-colors cursor-pointer"
              title="Move left/up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={idx === totalCount - 1}
              onClick={(e) => {
                e.stopPropagation();
                onMoveSequence(idx, 'down');
              }}
              className="p-1 text-white hover:text-amber-400 disabled:opacity-30 transition-colors cursor-pointer"
              title="Move right/down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Badges: Cover, Section Title, Video, Favorite */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 flex-wrap max-w-[70%]">
          {isHeroBanner && (
            <span className="px-2 py-0.5 rounded-md bg-amber-400 text-neutral-950 text-[9px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
              ★ Hero Banner
            </span>
          )}
          {item.sectionTitle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMoveSingle(item);
              }}
              className="px-1.5 py-0.5 rounded-md bg-black/80 hover:bg-black backdrop-blur-sm text-amber-300 hover:text-amber-200 text-[9px] font-mono border border-white/15 hover:border-amber-400/50 uppercase truncate transition-all cursor-pointer hover:scale-105"
              title="Click to move photo into another section"
            >
              {item.sectionTitle}
            </button>
          )}
          {item.type === 'video' && (
            <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-amber-400 text-[9px] font-mono flex items-center gap-1 border border-white/10">
              <Film className="w-2.5 h-2.5" /> Reel
            </span>
          )}
        </div>

        {/* Favorite Heart */}
        <button
          type="button"
          disabled={isFavoriting}
          onClick={(e) => {
            e.stopPropagation();
            if (!isFavoriting) {
              onToggleFavorite(item.id);
            }
          }}
          className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${
            isFavoriting
              ? 'bg-black/80 text-amber-400 opacity-100 cursor-not-allowed scale-105 shadow-md'
              : item.isFavorite
              ? 'bg-rose-500 text-white opacity-100 shadow-md shadow-rose-500/30 cursor-pointer active:scale-95'
              : 'bg-black/60 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95'
          }`}
          title={
            isFavoriting
              ? 'Updating favorite...'
              : item.isFavorite
              ? 'Remove from favorites'
              : 'Add to favorites'
          }
        >
          {isFavoriting ? (
            <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
          ) : (
            <Heart className={`w-3 h-3 ${item.isFavorite ? 'fill-current' : ''}`} />
          )}
        </button>
      </div>

      {/* Card Bottom Meta */}
      <div className="p-2.5 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
        <span className="truncate pr-1 font-medium text-neutral-800 dark:text-neutral-200">
          {item.title}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {/* Move to Section Button */}
          <button
            type="button"
            onClick={() => onOpenMoveSingle(item)}
            className="px-2 py-1 rounded-lg text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
            title="Move photo to another section (e.g. Haldi, Reception, Ceremony)"
          >
            <FolderInput className="w-3 h-3 text-amber-500" />
            <span>Move</span>
          </button>

          {isHeroBanner ? (
            <span
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 flex items-center gap-1 cursor-default"
              title="This photo is the active hero banner for the current template"
            >
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>Banner</span>
            </span>
          ) : (
            <button
              type="button"
              disabled={isSettingBanner}
              onClick={(e) => {
                e.stopPropagation();
                onSetBanner(item);
              }}
              className="px-2 py-1 rounded-lg text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              title={`Set as Hero Banner for ${currentTemplateName || 'current'} template`}
            >
              {isSettingBanner ? (
                <Loader2 className="w-3 h-3 animate-spin text-amber-500 shrink-0" />
              ) : (
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              )}
              <span>{isSettingBanner ? 'Setting...' : 'Set Banner'}</span>
            </button>
          )}

          <button
            onClick={() => onDeleteSingle(item)}
            className="p-1 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete photo"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
