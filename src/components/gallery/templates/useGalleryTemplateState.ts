import { useState, useMemo } from 'react';
import type { Gallery, MediaItem } from '../../../types';
import type { FilterSelection } from '../ClientSectionFilterBar';

export interface UseGalleryTemplateStateOptions {
  gallery: Gallery;
  templateKey?: 'editorial' | 'masonry' | 'cinematic' | 'minimal';
}

export function useGalleryTemplateState({ gallery, templateKey }: UseGalleryTemplateStateOptions) {
  // Derive gallery sections from gallery.sections or media section titles
  const gallerySections = useMemo(() => {
    if (gallery.sections && gallery.sections.length > 0) {
      return gallery.sections;
    }
    return Array.from(
      new Set(gallery.media.map((m) => m.sectionTitle).filter(Boolean) as string[])
    );
  }, [gallery.sections, gallery.media]);

  const [activeFilter, setActiveFilter] = useState<FilterSelection>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);

  const coverImage = useMemo(() => {
    if (templateKey && gallery.templateBanners?.[templateKey]) {
      return gallery.templateBanners[templateKey];
    }
    if (templateKey === 'masonry' && gallery.masonryBannerImages?.[0]) {
      return gallery.masonryBannerImages[0];
    }
    return gallery.coverImage || gallery.media[0]?.url;
  }, [gallery.templateBanners, gallery.masonryBannerImages, gallery.coverImage, gallery.media, templateKey]);

  const shootDate = useMemo(() => {
    return (gallery as unknown as Record<string, unknown>).shootDate as string | undefined || gallery.eventDate;
  }, [gallery]);

  // Filter media items based on search query and active section/type filter
  const filteredMedia = useMemo(() => {
    return gallery.media.filter((item) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchCaption = item.caption?.toLowerCase().includes(q);
        const matchSection = item.sectionTitle?.toLowerCase().includes(q);
        if (!matchTitle && !matchCaption && !matchSection) return false;
      }

      // 2. Active filter bar selection
      if (activeFilter.type === 'ai-face') {
        if (!aiMatchedIds) return false;
        return aiMatchedIds.includes(item.id);
      }
      if (activeFilter.type === 'favorites') {
        return item.isFavorite;
      }
      if (activeFilter.type === 'videos') {
        return item.type === 'video';
      }
      if (activeFilter.type === 'section') {
        return item.sectionTitle === activeFilter.title;
      }
      return true;
    });
  }, [gallery.media, searchQuery, activeFilter, aiMatchedIds]);

  // Counts for filter badges
  const favoritesCount = useMemo(() => gallery.media.filter((m) => m.isFavorite).length, [gallery.media]);
  const photosCount = useMemo(() => gallery.media.filter((m) => m.type !== 'video').length, [gallery.media]);
  const videosCount = useMemo(() => gallery.media.filter((m) => m.type === 'video').length, [gallery.media]);

  const findOriginalIndex = (item: MediaItem) => {
    return gallery.media.findIndex((m) => m.id === item.id);
  };

  return {
    gallerySections,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    aiMatchedIds,
    setAiMatchedIds,
    coverImage,
    shootDate,
    filteredMedia,
    favoritesCount,
    photosCount,
    videosCount,
    findOriginalIndex,
  };
}
