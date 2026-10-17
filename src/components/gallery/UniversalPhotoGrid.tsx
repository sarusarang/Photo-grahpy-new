import React, { useMemo } from 'react';
import { Play, Check, Download, Heart, Loader2 } from 'lucide-react';
import type { MediaItem } from '../../types';
import { WatermarkOverlay } from './WatermarkOverlay';

export type GalleryGridDesign = 'default' | 'masonry' | 'collage' | 'grid' | 'large';

export interface UniversalPhotoGridProps {
  media: MediaItem[];
  gridDesign?: GalleryGridDesign;
  onOpenLightbox: (originalIndex: number) => void;
  selectedMediaIds?: Set<string>;
  onToggleSelectMedia?: (mediaId: string) => void;
  onToggleFavorite?: (mediaId: string) => void;
  favoritingMediaIds?: Set<string>;
  onDownloadSingle?: (e: React.MouseEvent, item: MediaItem) => void;
  theme?: 'editorial' | 'masonry' | 'cinematic' | 'minimal';
  findOriginalIndex: (item: MediaItem) => number;
  emptyMessage?: string;
  emptySubMessage?: string;
  watermarkEnabled?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkPosition?: string;
  watermarkImage?: string | null;
  watermarkType?: string;
  watermarkFontSize?: string;
  watermarkFontColor?: string;
  watermarkFontStyle?: string;
}

// ─────────────────────────────────────────────────────────────
// REUSABLE PHOTO ITEM CARD
// Clean, structured, highly performant card shared across all layouts
// Guaranteed to fill 100% of each frame flush without whitespace gaps
// ─────────────────────────────────────────────────────────────
export interface PhotoItemCardProps {
  item: MediaItem;
  originalIndex: number;
  isSelected: boolean;
  theme: 'editorial' | 'masonry' | 'cinematic' | 'minimal';
  onOpenLightbox: (originalIndex: number) => void;
  onToggleSelectMedia?: (mediaId: string) => void;
  onToggleFavorite?: (mediaId: string) => void;
  isFavoriting?: boolean;
  onDownloadSingle?: (e: React.MouseEvent, item: MediaItem) => void;
  containerClassName?: string;
  imgClassName?: string;
  badgeContent?: React.ReactNode;
  watermarkEnabled?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkPosition?: string;
  watermarkImage?: string | null;
  watermarkType?: string;
  watermarkFontSize?: string;
  watermarkFontColor?: string;
  watermarkFontStyle?: string;
}

export const PhotoItemCard: React.FC<PhotoItemCardProps> = ({
  item,
  originalIndex,
  isSelected,
  theme,
  onOpenLightbox,
  onToggleSelectMedia,
  onToggleFavorite,
  isFavoriting = false,
  onDownloadSingle,
  containerClassName = '',
  imgClassName = 'w-full h-full block object-cover object-center rounded-none transition-transform duration-500 ease-out group-hover:scale-[1.025] cursor-pointer',
  badgeContent,
  watermarkEnabled = false,
  watermarkText,
  watermarkOpacity,
  watermarkPosition,
  watermarkImage,
  watermarkType,
  watermarkFontSize,
  watermarkFontColor,
  watermarkFontStyle,
}) => {
  // Theme-specific accent styles for selection
  const getSelectStyles = () => {
    switch (theme) {
      case 'masonry':
        return isSelected
          ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md ring-2 ring-emerald-300'
          : 'bg-black/60 backdrop-blur-sm text-neutral-300 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-emerald-600 hover:text-white hover:opacity-100';
      case 'cinematic':
        return isSelected
          ? 'bg-amber-400 text-neutral-950 font-bold shadow-md ring-2 ring-white/60'
          : 'bg-black/60 backdrop-blur-sm text-neutral-300 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-amber-400 hover:text-neutral-950 hover:opacity-100';
      case 'minimal':
      case 'editorial':
      default:
        return isSelected
          ? 'bg-neutral-900 text-white shadow-md ring-2 ring-white/60'
          : 'bg-white/80 backdrop-blur-sm text-neutral-700 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-neutral-900 hover:text-white hover:opacity-100';
    }
  };

  const getActiveRing = () => {
    switch (theme) {
      case 'masonry':
        return 'ring-2 ring-emerald-400';
      case 'cinematic':
        return 'ring-2 ring-amber-400';
      case 'minimal':
      case 'editorial':
      default:
        return 'ring-2 ring-neutral-900';
    }
  };

  // Determine if the caller explicitly controls height via aspect-ratio or h-auto.
  // In grid row tracks (Editorial, Masonry default, Collage), enforce h-full
  // so the container and inner image fill 100% of the allocated cell track.
  const hasCustomHeight =
    containerClassName.includes('h-auto') ||
    containerClassName.includes('aspect-');
  const heightClass = hasCustomHeight ? '' : 'h-full';

  return (
    <div
      className={`group relative w-full ${heightClass} rounded-none overflow-hidden bg-neutral-900/10 select-none ${
        isSelected ? getActiveRing() : ''
      } ${containerClassName}`}
    >
      <img
        src={item.url}
        alt={item.title || 'Photograph'}
        loading="lazy"
        onClick={() => onOpenLightbox(originalIndex)}
        className={imgClassName}
        onError={(e) => {
          if (item.thumbnailUrl && e.currentTarget.src !== item.thumbnailUrl) {
            e.currentTarget.src = item.thumbnailUrl;
          }
        }}
      />

      {/* Video Play Badge */}
      {item.type === 'video' && (
        <div className="absolute top-1.5 left-1.5 z-10 bg-black/75 backdrop-blur-sm p-1.5 rounded-full text-white shadow-md pointer-events-none">
          <Play className="w-3 h-3 fill-current" />
        </div>
      )}

      {/* Optional Metadata / Custom Template Badge (e.g. Plate number, film slate) */}
      {badgeContent}

      {/* Quick Single Download Button */}
      {onDownloadSingle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDownloadSingle(e, item);
          }}
          className={`absolute ${
            onToggleSelectMedia ? 'top-1.5 right-9.5' : 'top-1.5 right-1.5'
          } z-10 w-7 h-7 rounded-full bg-black/75 hover:bg-amber-400 hover:text-neutral-950 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer active:scale-90 touch-manipulation opacity-85 sm:opacity-0 sm:group-hover:opacity-100`}
          title="Download photo"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>
      )}

      {/* Multi-Select Checkbox */}
      {onToggleSelectMedia && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelectMedia(item.id);
          }}
          className={`absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 touch-manipulation ${getSelectStyles()}`}
          title="Select photo"
        >
          <Check className={`w-3.5 h-3.5 ${isSelected ? 'stroke-[3]' : 'stroke-2'}`} />
        </button>
      )}

      {/* Heart Liking Button for Viewing User */}
      {onToggleFavorite && (
        <button
          type="button"
          disabled={isFavoriting}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.id);
          }}
          className={`absolute bottom-2 right-2 z-10 p-1.5 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-90 touch-manipulation ${
            isFavoriting
              ? 'bg-black/80 text-amber-400 opacity-100 cursor-not-allowed scale-105 shadow-md'
              : item.isFavorite
              ? 'bg-rose-500 text-white opacity-100 shadow-lg shadow-rose-500/35 scale-105'
              : 'bg-black/60 text-white/80 hover:text-white hover:bg-rose-600/80 opacity-75 sm:opacity-0 sm:group-hover:opacity-100'
          }`}
          title={
            isFavoriting
              ? 'Updating...'
              : item.isFavorite
              ? 'Remove from liked photos'
              : 'Add to liked photos'
          }
        >
          {isFavoriting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
          ) : (
            <Heart
              className={`w-3.5 h-3.5 transition-transform ${
                item.isFavorite ? 'fill-current scale-110' : 'group-hover:scale-110'
              }`}
            />
          )}
        </button>
      )}

      {/* Watermark Overlay (when enabled for gallery) */}
      {watermarkEnabled && item.type !== 'video' && (
        <WatermarkOverlay
          text={watermarkText}
          imageUrl={watermarkImage}
          opacity={watermarkOpacity}
          position={watermarkPosition}
          watermarkType={watermarkType}
          fontSize={watermarkFontSize}
          fontColor={watermarkFontColor}
          fontStyle={watermarkFontStyle}
          size="sm"
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// EDITORIAL FLUSH BLOCK LAYOUT GENERATOR
// Mathematically guaranteed 0-hole magazine spreads for any photo count
// ─────────────────────────────────────────────────────────────
const EDITORIAL_BLOCKS_LEFT = {
  5: [
    'col-span-2 md:col-span-2 row-span-2',
    'col-span-1 md:col-span-1 row-span-1',
    'col-span-1 md:col-span-1 row-span-1',
    'col-span-1 md:col-span-1 row-span-1',
    'col-span-1 md:col-span-1 row-span-1',
  ],
  4: [
    'col-span-2 md:col-span-2 row-span-2',
    'col-span-2 md:col-span-2 row-span-1',
    'col-span-1 md:col-span-1 row-span-1',
    'col-span-1 md:col-span-1 row-span-1',
  ],
  3: [
    'col-span-2 md:col-span-2 row-span-2',
    'col-span-2 md:col-span-2 row-span-1',
    'col-span-2 md:col-span-2 row-span-1',
  ],
  2: [
    'col-span-1 md:col-span-2 row-span-2',
    'col-span-1 md:col-span-2 row-span-2',
  ],
  1: [
    'col-span-2 md:col-span-4 row-span-2',
  ],
};

const EDITORIAL_BLOCKS_RIGHT = {
  5: [
    'col-span-1 md:col-span-1 row-span-1',
    'col-span-1 md:col-span-1 row-span-1',
    'col-span-1 md:col-span-1 row-span-1',
    'col-span-1 md:col-span-1 row-span-1',
    'col-span-2 md:col-span-2 row-span-2',
  ],
  4: [
    'col-span-2 md:col-span-2 row-span-1',
    'col-span-1 md:col-span-1 row-span-1',
    'col-span-1 md:col-span-1 row-span-1',
    'col-span-2 md:col-span-2 row-span-2',
  ],
  3: [
    'col-span-2 md:col-span-2 row-span-1',
    'col-span-2 md:col-span-2 row-span-1',
    'col-span-2 md:col-span-2 row-span-2',
  ],
  2: [
    'col-span-1 md:col-span-2 row-span-2',
    'col-span-1 md:col-span-2 row-span-2',
  ],
  1: [
    'col-span-2 md:col-span-4 row-span-2',
  ],
};

function partitionEditorialBlocks(total: number): number[] {
  let remaining = total;
  const blockSizes: number[] = [];
  while (remaining > 0) {
    if (remaining >= 10) {
      blockSizes.push(5);
      remaining -= 5;
    } else if (remaining === 9) {
      blockSizes.push(5, 4);
      remaining = 0;
    } else if (remaining === 8) {
      blockSizes.push(4, 4);
      remaining = 0;
    } else if (remaining === 7) {
      blockSizes.push(4, 3);
      remaining = 0;
    } else if (remaining === 6) {
      blockSizes.push(3, 3);
      remaining = 0;
    } else if (remaining === 5) {
      blockSizes.push(5);
      remaining = 0;
    } else if (remaining === 4) {
      blockSizes.push(4);
      remaining = 0;
    } else if (remaining === 3) {
      blockSizes.push(3);
      remaining = 0;
    } else if (remaining === 2) {
      blockSizes.push(2);
      remaining = 0;
    } else if (remaining === 1) {
      blockSizes.push(1);
      remaining = 0;
    }
  }
  return blockSizes;
}

function calculateEditorialSpans(total: number): string[] {
  if (total <= 0) return [];
  const blockSizes = partitionEditorialBlocks(total);
  const spans: string[] = [];
  let blockIndex = 0;
  for (const size of blockSizes) {
    const isAlternate = blockIndex % 2 === 1;
    const blockList = isAlternate
      ? (EDITORIAL_BLOCKS_RIGHT as any)[size]
      : (EDITORIAL_BLOCKS_LEFT as any)[size];
    if (blockList) {
      spans.push(...blockList);
    }
    blockIndex++;
  }
  return spans;
}

export const UniversalPhotoGrid: React.FC<UniversalPhotoGridProps> = ({
  media,
  gridDesign = 'default',
  onOpenLightbox,
  selectedMediaIds = new Set(),
  onToggleSelectMedia,
  onToggleFavorite,
  favoritingMediaIds,
  onDownloadSingle,
  theme = 'editorial',
  findOriginalIndex,
  emptyMessage = 'No imagery found',
  emptySubMessage = 'Try adjusting your section filter or face search criteria.',
  watermarkEnabled = false,
  watermarkText,
  watermarkOpacity,
  watermarkPosition,
  watermarkImage,
  watermarkType,
  watermarkFontSize,
  watermarkFontColor,
  watermarkFontStyle,
}) => {
  // Pre-calculate mathematically flush editorial layout spans for all items
  const editorialSpans = useMemo(() => {
    return calculateEditorialSpans(media.length);
  }, [media.length]);

  if (media.length === 0) {
    const isDark = theme === 'cinematic' || theme === 'masonry';
    return (
      <div className="w-full py-20 sm:py-24 text-center px-4 animate-in fade-in">
        <div
          className={`max-w-md mx-auto p-6 sm:p-10 border rounded-2xl space-y-3 ${
            isDark
              ? 'bg-neutral-900/40 border-neutral-800 text-neutral-300'
              : 'bg-neutral-50/90 border-neutral-200 text-neutral-800'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-2 shadow-inner">
            <Heart className="w-6 h-6 stroke-[1.8]" />
          </div>
          <p className="font-serif italic text-lg">{emptyMessage}</p>
          <p className="text-xs text-neutral-500 font-light">{emptySubMessage}</p>
        </div>
      </div>
    );
  }

  const renderCard = (
    item: MediaItem,
    containerClassName = '',
    imgClassName = 'w-full h-full block object-cover object-center rounded-none transition-transform duration-500 ease-out group-hover:scale-[1.025] cursor-pointer',
    badgeContent?: React.ReactNode
  ) => {
    const originalIndex = findOriginalIndex(item);
    const isSelected = selectedMediaIds.has(item.id);
    return (
      <PhotoItemCard
        key={item.id}
        item={item}
        originalIndex={originalIndex}
        isSelected={isSelected}
        theme={theme}
        onOpenLightbox={onOpenLightbox}
        onToggleSelectMedia={onToggleSelectMedia}
        onToggleFavorite={onToggleFavorite}
        isFavoriting={favoritingMediaIds?.has(item.id)}
        onDownloadSingle={onDownloadSingle}
        containerClassName={containerClassName}
        imgClassName={imgClassName}
        badgeContent={badgeContent}
        watermarkEnabled={watermarkEnabled}
        watermarkText={watermarkText}
        watermarkOpacity={watermarkOpacity}
        watermarkPosition={watermarkPosition}
        watermarkImage={watermarkImage}
        watermarkType={watermarkType}
        watermarkFontSize={watermarkFontSize}
        watermarkFontColor={watermarkFontColor}
        watermarkFontStyle={watermarkFontStyle}
      />
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // A. TEMPLATE-SPECIFIC SIGNATURE DEFAULT LAYOUTS
  // Handcrafted bespoke arrangements unique to each template's identity
  // ═══════════════════════════════════════════════════════════════════════════

  if (gridDesign === 'default') {
    // ─────────────────────────────────────────────────────────────
    // 1. EDITORIAL TEMPLATE DEFAULT: Vogue Magazine Storyboard Spread
    // ─────────────────────────────────────────────────────────────
    // Alternates between a large double-height opening hero spread,
    // rhythmic diptych pairings, and landscape editorial banners.
    // Guaranteed 100% flush rectangular blocks with zero whitespace gaps.
    if (theme === 'editorial') {
      return (
        <main className="w-full px-1.5 sm:px-2 md:px-3 pb-4 sm:pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 grid-flow-dense auto-rows-[220px] xs:auto-rows-[260px] sm:auto-rows-[300px] md:auto-rows-[340px]">
            {media.map((item, idx) =>
              renderCard(
                item,
                editorialSpans[idx] || 'col-span-1 md:col-span-1 row-span-1'
              )
            )}
          </div>
        </main>
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 2. MASONRY TEMPLATE DEFAULT: Botanical Romance Cascade with Panorama Ribbons
    // ─────────────────────────────────────────────────────────────
    // Natural organic aspect ratios flowing left-to-right, broken gracefully
    // by dramatic widescreen panorama ribbons and tall portraits with dense auto-packing.
    if (theme === 'masonry') {
      return (
        <main className="w-full px-1.5 sm:px-2 md:px-3 pb-4 sm:pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 grid-flow-dense auto-rows-[200px] sm:auto-rows-[260px] md:auto-rows-[300px]">
            {media.map((item, idx) => {
              if (media.length === 1) {
                return renderCard(item, 'col-span-2 md:col-span-4 row-span-2');
              }
              if (media.length === 2) {
                return renderCard(item, 'col-span-1 md:col-span-2 row-span-2');
              }
              if (media.length === 3) {
                const spanClass = idx === 0
                  ? 'col-span-2 md:col-span-2 row-span-2'
                  : 'col-span-1 md:col-span-2 row-span-1';
                return renderCard(item, spanClass);
              }
              if (media.length === 4) {
                return renderCard(item, 'col-span-1 md:col-span-2 row-span-1');
              }
              if (media.length === 5) {
                const spanClass = idx === 0
                  ? 'col-span-2 md:col-span-4 row-span-2'
                  : 'col-span-1 md:col-span-1 row-span-1';
                return renderCard(item, spanClass);
              }

              // Panorama breakout ribbon every 6th photo
              const isPanorama = idx % 6 === 0 && idx > 0;
              const isTallPortrait = idx % 6 === 1 || idx % 6 === 4;
              const spanClass = isPanorama
                ? 'col-span-2 md:col-span-4 row-span-1 sm:row-span-2'
                : isTallPortrait
                ? 'col-span-1 row-span-2'
                : 'col-span-1 row-span-1';

              return renderCard(item, spanClass);
            })}
          </div>
        </main>
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 3. MINIMAL TEMPLATE DEFAULT: Scandinavian Archival Monograph
    // ─────────────────────────────────────────────────────────────
    // Museum exhibition rhythm alternating between balanced diptych plates
    // (4:5 medium format) and quad gallery walls, complete with fine archival plate numbers.
    if (theme === 'minimal') {
      return (
        <main className="w-full px-1.5 sm:px-2 md:px-3 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 grid-flow-dense">
            {media.map((item, idx) => {
              if (media.length <= 2) {
                const spanClass = 'col-span-1 sm:col-span-2 aspect-[4/3] sm:aspect-[16/10]';
                return renderCard(item, spanClass);
              }

              // Alternating archival rhythms: 2-col museum focus vs uniform quad plate
              const isMonographFocus = idx % 6 === 0;
              // If last photo would be orphaned in a 4-col row, expand it gracefully
              const isOrphanedLast = idx === media.length - 1 && media.length % 4 === 1;

              const spanClass = isOrphanedLast
                ? 'col-span-1 sm:col-span-2 lg:col-span-4 aspect-[16/9]'
                : isMonographFocus
                ? 'col-span-1 sm:col-span-2 aspect-[16/10] sm:aspect-[16/9]'
                : 'col-span-1 aspect-[4/5] sm:aspect-[3/4]';

              const plateNumber = (
                <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 bg-white/95 text-neutral-900 border border-neutral-200/90 shadow-sm pointer-events-none text-[9px] sm:text-[10px] font-mono tracking-widest uppercase">
                  № {String(idx + 1).padStart(2, '0')}
                </div>
              );

              return renderCard(item, spanClass, undefined, plateNumber);
            })}
          </div>
        </main>
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 4. CINEMATIC TEMPLATE DEFAULT: Director's Anamorphic Film Reel
    // ─────────────────────────────────────────────────────────────
    // 16:9 / 2.39:1 theatrical establishing scenes paired with dual character
    // stills and subtle golden film slate metadata.
    if (theme === 'cinematic') {
      return (
        <main className="w-full px-1.5 sm:px-2 md:px-3 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 grid-flow-dense">
            {media.map((item, idx) => {
              if (media.length === 1) {
                return renderCard(
                  item,
                  'col-span-1 sm:col-span-2 lg:col-span-3 aspect-[16/9] sm:aspect-[21/9]'
                );
              }
              if (media.length === 2) {
                return renderCard(
                  item,
                  'col-span-1 sm:col-span-1 lg:col-span-auto aspect-[16/9] sm:aspect-[16/10]'
                );
              }

              // Master establishing shot every 4th photo
              const isMasterShot = idx % 4 === 0;
              // If last photo would be single orphaned still in 3-col grid, expand as final scene
              const isOrphanedLast = idx === media.length - 1 && media.length % 3 === 1 && !isMasterShot;

              const spanClass = (isMasterShot || isOrphanedLast)
                ? 'col-span-1 sm:col-span-2 lg:col-span-3 aspect-[16/9] sm:aspect-[21/9]'
                : 'col-span-1 aspect-[16/10] sm:aspect-[4/3]';

              const sceneNum = Math.floor(idx / 4) + 1;
              const frameNum = (idx % 4) + 1;
              const filmSlate = (
                <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 bg-black/85 text-amber-300 border border-amber-400/30 shadow-md pointer-events-none text-[9px] font-mono tracking-wider uppercase">
                  SCENE {String(sceneNum).padStart(2, '0')} • TAKE {String(frameNum).padStart(2, '0')}
                </div>
              );

              return renderCard(item, spanClass, undefined, filmSlate);
            })}
          </div>
        </main>
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // B. 4 UNIVERSAL GRID DESIGN OPTIONS (Available on all templates)
  // ═══════════════════════════════════════════════════════════════════════════

  // ─────────────────────────────────────────────────────────────
  // 1. MASONRY FLOW: Dynamic 4-Column Waterfall (Raw Proportions)
  // ─────────────────────────────────────────────────────────────
  if (gridDesign === 'masonry') {
    return (
      <main className="w-full px-1.5 sm:px-2 md:px-3 pb-4 sm:pb-6">
        <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-1.5 sm:gap-2 [column-fill:_balance]">
          {media.map((item) =>
            renderCard(
              item,
              'break-inside-avoid w-full h-auto mb-1.5 sm:mb-2',
              'w-full h-auto block object-cover object-center rounded-none transition-transform duration-500 ease-out group-hover:scale-[1.02] cursor-pointer'
            )
          )}
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. EDITORIAL COLLAGE: Dynamic 4-Grid Asymmetric Mosaic
  // ─────────────────────────────────────────────────────────────
  if (gridDesign === 'collage') {
    return (
      <main className="w-full px-1.5 sm:px-2 md:px-3 pb-4 sm:pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2 grid-flow-dense auto-rows-[240px] xs:auto-rows-[280px] sm:auto-rows-[320px] md:auto-rows-[360px]">
          {media.map((item, idx) => {
            let spanClass = 'col-span-1 row-span-1';
            if (idx % 7 === 0) {
              spanClass = 'col-span-2 row-span-2';
            } else if (item.aspectRatio && item.aspectRatio > 1.6 && idx % 3 === 0) {
              spanClass = 'col-span-2 row-span-1';
            } else if (item.aspectRatio && item.aspectRatio < 0.85 && idx % 4 === 1) {
              spanClass = 'col-span-1 row-span-2';
            }
            return renderCard(item, spanClass);
          })}
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. BALANCED GRID: Uniform 4-Column Synchronized 3:2 Tiles
  // ─────────────────────────────────────────────────────────────
  if (gridDesign === 'grid') {
    return (
      <main className="w-full px-1.5 sm:px-2 md:px-3 pb-4 sm:pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
          {media.map((item) =>
            renderCard(item, 'w-full aspect-[4/3] sm:aspect-[3/2]')
          )}
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4. LARGE FEED: High-Impact Expansive Storytelling Feed
  // ─────────────────────────────────────────────────────────────
  return (
    <main className="w-full px-1.5 sm:px-2 md:px-3 pb-4 sm:pb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
        {media.map((item) =>
          renderCard(
            item,
            'w-full h-auto flex items-center justify-center bg-neutral-900/10',
            'w-full h-auto max-h-[85vh] block object-cover object-center rounded-none transition-transform duration-500 ease-out group-hover:scale-[1.02] cursor-pointer'
          )
        )}
      </div>
    </main>
  );
};

