import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UploadCloud, Heart, FolderOpen, Loader2, CheckCircle2 } from 'lucide-react';
import type { Gallery, MediaItem } from '@/types';
import { useSmoothScroll } from '@/components/common/SmoothScroll';
import { GalleryMediaCard } from './GalleryMediaCard';

const INITIAL_BATCH_SIZE = 36;
const BATCH_INCREMENT = 24;

interface GalleryMediaGridProps {
  gallery: Gallery;
  dashboardSectionFilter: string;
  selectedIds: string[];
  showFavoritesOnly?: boolean;
  onClearFilters?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onFetchNextPage?: () => void;
  onOpenUpload: () => void;
  onOpenLightbox: (idx: number) => void;
  onToggleSelect: (id: string) => void;
  onMoveSequence: (idx: number, direction: 'up' | 'down') => void;
  onToggleFavorite: (id: string) => void;
  onOpenMoveSingle: (item: MediaItem) => void;
  onSetBanner: (item: MediaItem) => void;
  onDeleteSingle: (item: MediaItem) => void;
  settingBannerMediaId?: string | null;
  favoritingMediaIds?: Set<string>;
}

export const GalleryMediaGrid: React.FC<GalleryMediaGridProps> = ({
  gallery,
  dashboardSectionFilter,
  selectedIds,
  showFavoritesOnly = false,
  onClearFilters,
  hasNextPage,
  isFetchingNextPage = false,
  onFetchNextPage,
  onOpenUpload,
  onOpenLightbox,
  onToggleSelect,
  onMoveSequence,
  onToggleFavorite,
  onOpenMoveSingle,
  onSetBanner,
  onDeleteSingle,
  settingBannerMediaId,
  favoritingMediaIds,
}) => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { lenis } = useSmoothScroll();

  // Reset visible batch count whenever section filter or favorites filter toggles
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH_SIZE);
  }, [dashboardSectionFilter, showFavoritesOnly]);

  const filteredMedia = useMemo(() => {
    return gallery.media.filter((item) => {
      const matchesSection =
        dashboardSectionFilter === 'all'
          ? true
          : (item.sectionTitle || '').toLowerCase() === dashboardSectionFilter.toLowerCase();
      const matchesFavorite = !showFavoritesOnly || Boolean(item.isFavorite);
      return matchesSection && matchesFavorite;
    });
  }, [gallery.media, dashboardSectionFilter, showFavoritesOnly]);

  const isServerInfinite = typeof hasNextPage === 'boolean';
  const hasMore = isServerInfinite ? hasNextPage : visibleCount < filteredMedia.length;
  const isLoading = isServerInfinite ? isFetchingNextPage : false;
  const visibleMedia = isServerInfinite ? filteredMedia : filteredMedia.slice(0, visibleCount);

  // Keep Lenis scroll dimensions in sync with dynamically loaded infinite media items
  useEffect(() => {
    if (lenis && gallery.media.length > 0) {
      const timer = setTimeout(() => {
        lenis.resize();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [gallery.media.length, filteredMedia.length, lenis]);

  // TanStack Query Infinite Scroll Observer
  useEffect(() => {
    if (!hasMore || isLoading || gallery.media.length === 0) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const rootElement =
      lenis?.options?.wrapper instanceof Element ? lenis.options.wrapper : null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          if (isServerInfinite && onFetchNextPage) {
            onFetchNextPage();
          } else {
            setVisibleCount((prev) => Math.min(prev + BATCH_INCREMENT, filteredMedia.length));
          }
        }
      },
      {
        root: rootElement,
        rootMargin: '450px',
        threshold: 0.05,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isServerInfinite, onFetchNextPage, filteredMedia.length, lenis, gallery.media.length]);

  // --- UNCONDITIONAL HOOKS FINISHED. CONDITIONAL RENDERS BELOW ---

  if (gallery.media.length === 0) {
    return (
      <div
        onClick={onOpenUpload}
        className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-amber-400/60 rounded-3xl p-16 text-center cursor-pointer bg-neutral-50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all space-y-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-serif text-neutral-900 dark:text-white">There are no files in this gallery yet</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
          Drag photos here or click the button below to upload high-resolution images or 4K videos.
        </p>
        <button
          type="button"
          className="px-6 py-2.5 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md shadow-amber-500/10"
        >
          Upload First Photos
        </button>
      </div>
    );
  }

  if (filteredMedia.length === 0) {
    if (showFavoritesOnly) {
      return (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center bg-neutral-50/50 dark:bg-neutral-900/30 space-y-4 my-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7 fill-rose-500/20 text-rose-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
              No Liked Photos Found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              {dashboardSectionFilter !== 'all'
                ? `No photos are marked as liked in "${dashboardSectionFilter}".`
                : "You haven't marked any photos as liked yet. Click the heart icon on any photo card to favorite it."}
            </p>
          </div>
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span>Show All Photos</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-12 text-center bg-neutral-50/50 dark:bg-neutral-900/30 space-y-4 my-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
          <FolderOpen className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
            Section is Empty
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            There are currently no photos in &quot;{dashboardSectionFilter}&quot;.
          </p>
        </div>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            <span>View All Photos</span>
          </button>
        )}
      </div>
    );
  }

  const currentTemplate = gallery.templateId || 'editorial';
  const currentTemplateBannerUrl =
    currentTemplate === 'masonry'
      ? (gallery.masonryBannerImages?.[0] || gallery.templateBanners?.['masonry'] || gallery.coverImage)
      : (gallery.templateBanners?.[currentTemplate] || gallery.coverImage);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 md:gap-3 stagger">
        {visibleMedia.map((item, idx) => {
          const isSelected = selectedIds.includes(item.id);
          const isBanner = Boolean(
            (currentTemplateBannerUrl && currentTemplateBannerUrl === item.url) ||
            (gallery.coverImage && gallery.coverImage === item.url)
          );
          const isSettingBanner = settingBannerMediaId === item.id;
          const originalIndex = gallery.media.findIndex((m) => m.id === item.id);

          return (
            <GalleryMediaCard
              key={item.id}
              item={item}
              idx={originalIndex !== -1 ? originalIndex : idx}
              totalCount={gallery.media.length}
              isSelected={isSelected}
              isCover={isBanner}
              isBanner={isBanner}
              isSettingBanner={isSettingBanner}
              isFavoriting={favoritingMediaIds?.has(item.id)}
              currentTemplateName={currentTemplate}
              onToggleSelect={onToggleSelect}
              onOpenLightbox={(openIdx) => onOpenLightbox(openIdx)}
              onMoveSequence={onMoveSequence}
              onToggleFavorite={onToggleFavorite}
              onOpenMoveSingle={onOpenMoveSingle}
              onSetBanner={onSetBanner}
              onDeleteSingle={onDeleteSingle}
            />
          );
        })}
      </div>

      {/* Infinite Scroll Sentinel & Dynamic Loader */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="py-8 flex flex-col items-center justify-center gap-2 text-neutral-400 dark:text-neutral-500"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono shadow-xs">
            <Loader2 className={`w-3.5 h-3.5 text-amber-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>
              {isLoading
                ? 'Loading more photos from server...'
                : `Scroll for more (${visibleMedia.length} loaded)`}
            </span>
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              if (isServerInfinite && onFetchNextPage) {
                onFetchNextPage();
              } else {
                setVisibleCount((prev) => Math.min(prev + BATCH_INCREMENT, filteredMedia.length));
              }
            }}
            className="text-[11px] underline underline-offset-4 hover:text-amber-500 transition-colors cursor-pointer select-none disabled:opacity-50"
          >
            Load next batch manually
          </button>
        </div>
      )}

      {/* All Photos Rendered Badge */}
      {!hasMore && filteredMedia.length > INITIAL_BATCH_SIZE && (
        <div className="py-6 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 text-xs font-mono text-neutral-500 dark:text-neutral-400 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Showing all {filteredMedia.length} photos</span>
          </div>
        </div>
      )}
    </div>
  );
};
