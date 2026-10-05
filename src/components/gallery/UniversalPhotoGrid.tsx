import React from 'react';
import { Play, Check, Sparkles, Download } from 'lucide-react';
import type { MediaItem } from '../../types';
import { WatermarkOverlay } from './WatermarkOverlay';

export type GalleryGridDesign = 'default' | 'masonry' | 'collage' | 'grid' | 'large';

export interface UniversalPhotoGridProps {
  media: MediaItem[];
  gridDesign?: GalleryGridDesign;
  onOpenLightbox: (originalIndex: number) => void;
  selectedMediaIds?: Set<string>;
  onToggleSelectMedia?: (mediaId: string) => void;
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
}

// ─────────────────────────────────────────────────────────────
// REUSABLE PHOTO ITEM CARD
// Clean, structured, highly performant card shared across all layouts
// ─────────────────────────────────────────────────────────────
export interface PhotoItemCardProps {
  item: MediaItem;
  originalIndex: number;
  isSelected: boolean;
  theme: 'editorial' | 'masonry' | 'cinematic' | 'minimal';
  onOpenLightbox: (originalIndex: number) => void;
  onToggleSelectMedia?: (mediaId: string) => void;
  onDownloadSingle?: (e: React.MouseEvent, item: MediaItem) => void;
  containerClassName?: string;
  imgClassName?: string;
  badgeContent?: React.ReactNode;
  watermarkEnabled?: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
  watermarkPosition?: string;
  watermarkImage?: string | null;
}

export const PhotoItemCard: React.FC<PhotoItemCardProps> = ({
  item,
  originalIndex,
  isSelected,
  theme,
  onOpenLightbox,
  onToggleSelectMedia,
  onDownloadSingle,
  containerClassName = '',
  imgClassName = 'w-full h-full block object-cover rounded-none transition-transform duration-500 ease-out group-hover:scale-[1.025] cursor-pointer',
  badgeContent,
  watermarkEnabled = false,
  watermarkText,
  watermarkOpacity,
  watermarkPosition,
  watermarkImage,
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

  return (
    <div
      className={`group relative rounded-none overflow-hidden bg-neutral-900/10 select-none ${
        isSelected ? getActiveRing() : ''
      } ${containerClassName}`}
    >
      <img
        src={item.url}
        alt={item.title || 'Photograph'}
        loading="lazy"
        onClick={() => onOpenLightbox(originalIndex)}
        className={imgClassName}
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

      {/* Watermark Overlay (when enabled for gallery) */}
      {watermarkEnabled && item.type !== 'video' && (
        <WatermarkOverlay
          text={watermarkText}
          imageUrl={watermarkImage}
          opacity={watermarkOpacity}
          position={watermarkPosition}
          size="sm"
        />
      )}
    </div>
  );
};

export const UniversalPhotoGrid: React.FC<UniversalPhotoGridProps> = ({
  media,
  gridDesign = 'default',
  onOpenLightbox,
  selectedMediaIds = new Set(),
  onToggleSelectMedia,
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
}) => {
  if (media.length === 0) {
    const isDark = theme === 'cinematic' || theme === 'masonry';
    return (
      <div className="w-full py-20 sm:py-24 text-center px-4">
        <div
          className={`max-w-md mx-auto p-6 sm:p-10 border rounded-2xl space-y-3 ${
            isDark
              ? 'bg-neutral-900/40 border-neutral-800 text-neutral-300'
              : 'bg-neutral-50/90 border-neutral-200 text-neutral-800'
          }`}
        >
          <Sparkles className="w-8 h-8 text-neutral-400 mx-auto stroke-1" />
          <p className="font-serif italic text-lg">{emptyMessage}</p>
          <p className="text-xs text-neutral-500 font-light">{emptySubMessage}</p>
        </div>
      </div>
    );
  }

  const renderCard = (
    item: MediaItem,
    containerClassName = '',
    imgClassName = 'w-full h-full block object-cover rounded-none transition-transform duration-500 ease-out group-hover:scale-[1.025] cursor-pointer',
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
        onDownloadSingle={onDownloadSingle}
        containerClassName={containerClassName}
        imgClassName={imgClassName}
        badgeContent={badgeContent}
        watermarkEnabled={watermarkEnabled}
        watermarkText={watermarkText}
        watermarkOpacity={watermarkOpacity}
        watermarkPosition={watermarkPosition}
        watermarkImage={watermarkImage}
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
    if (theme === 'editorial') {
      const getEditorialSpan = (idx: number) => {
        const pattern = idx % 6;
        switch (pattern) {
          case 0:
            // Opening Feature: 2x2 Hero square
            return 'col-span-2 row-span-2';
          case 1:
            // Supporting portrait detail
            return 'col-span-1 row-span-1';
          case 2:
            // Supporting portrait detail
            return 'col-span-1 row-span-1';
          case 3:
            // Editorial landscape ribbon beneath details 1 & 2
            return 'col-span-2 row-span-1';
          case 4:
            // High-fashion vertical diptych A
            return 'col-span-1 row-span-2';
          case 5:
            // High-fashion vertical diptych B
            return 'col-span-1 row-span-2';
          default:
            return 'col-span-1 row-span-1';
        }
      };

      return (
        <main className="w-full px-[2px] sm:px-[3px] pb-28 sm:pb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px] sm:gap-[3px] auto-rows-[220px] xs:auto-rows-[260px] sm:auto-rows-[300px] md:auto-rows-[340px]">
            {media.map((item, idx) =>
              renderCard(item, getEditorialSpan(idx))
            )}
          </div>
        </main>
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 2. MASONRY TEMPLATE DEFAULT: Botanical Romance Cascade with Panorama Ribbons
    // ─────────────────────────────────────────────────────────────
    // Natural organic aspect ratios flowing left-to-right, broken gracefully
    // every 5th item by a dramatic widescreen landscape panorama ribbon.
    if (theme === 'masonry') {
      return (
        <main className="w-full px-[2px] sm:px-[3px] pb-28 sm:pb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px] sm:gap-[3px] auto-rows-[200px] sm:auto-rows-[260px] md:auto-rows-[300px]">
            {media.map((item, idx) => {
              // Panorama breakout ribbon every 5th photo
              const isPanorama = idx % 5 === 0 && idx > 0;
              const isTallPortrait = idx % 5 === 1 || idx % 5 === 4;
              let spanClass = 'col-span-1 row-span-1';

              if (isPanorama) {
                spanClass = 'col-span-2 md:col-span-4 row-span-1 sm:row-span-2';
              } else if (isTallPortrait) {
                spanClass = 'col-span-1 row-span-2';
              } else {
                spanClass = 'col-span-1 row-span-1';
              }

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
        <main className="w-full px-[2px] sm:px-[3px] pb-28 sm:pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[2px] sm:gap-[3px]">
            {media.map((item, idx) => {
              // Alternating archival rhythms: 2-col museum focus vs uniform quad plate
              const isMonographFocus = idx % 6 === 0;
              const spanClass = isMonographFocus
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
        <main className="w-full px-[2px] sm:px-[3px] pb-28 sm:pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[2px] sm:gap-[3px]">
            {media.map((item, idx) => {
              // Master establishing shot every 4th photo
              const isMasterShot = idx % 4 === 0;
              const spanClass = isMasterShot
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
      <main className="w-full px-[2px] sm:px-[3px] pb-28 sm:pb-24">
        <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-[2px] sm:gap-[3px]">
          {media.map((item) =>
            renderCard(
              item,
              'break-inside-avoid mb-[2px] sm:mb-[3px]',
              'w-full h-auto block object-cover rounded-none transition-transform duration-500 ease-out group-hover:scale-[1.02] cursor-pointer'
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
      <main className="w-full px-[2px] sm:px-[3px] pb-28 sm:pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[2px] sm:gap-[3px] auto-rows-[240px] xs:auto-rows-[280px] sm:auto-rows-[320px] md:auto-rows-[360px]">
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
      <main className="w-full px-[2px] sm:px-[3px] pb-28 sm:pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[2px] sm:gap-[3px]">
          {media.map((item) =>
            renderCard(item, 'aspect-[4/3] sm:aspect-[3/2]')
          )}
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4. LARGE FEED: High-Impact Expansive Storytelling Feed
  // ─────────────────────────────────────────────────────────────
  return (
    <main className="w-full px-[2px] sm:px-[3px] pb-28 sm:pb-24">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[2px] sm:gap-[3px]">
        {media.map((item) =>
          renderCard(
            item,
            '',
            'w-full h-auto max-h-[85vh] block object-cover rounded-none transition-transform duration-500 ease-out group-hover:scale-[1.02] cursor-pointer'
          )
        )}
      </div>
    </main>
  );
};
