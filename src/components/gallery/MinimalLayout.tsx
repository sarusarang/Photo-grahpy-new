import React, { useState } from 'react';
import type { Gallery } from '../../types';
import {
  Heart,
  Check,
  Film,
} from 'lucide-react';
import { GalleryHeroBanner } from './GalleryHeroBanner';
import { ClientSectionFilterBar, type FilterSelection } from './ClientSectionFilterBar';
import { AIFaceSearchBox } from './AIFaceSearchBox';
import { ClientGalleryFooter } from './ClientGalleryFooter';

interface MinimalLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
  selectedMediaIds?: Set<string>;
  onToggleSelectMedia?: (mediaId: string) => void;
  onStartSlideshow?: (startIndex?: number) => void;
  studioName?: string;
}

export const MinimalLayout: React.FC<MinimalLayoutProps> = ({
  gallery,
  onOpenLightbox,
  onToggleFavorite,
  selectedMediaIds = new Set(),
  onToggleSelectMedia,
  onStartSlideshow,
  studioName,
}) => {
  // Derive gallery sections
  const gallerySections = (gallery.sections && gallery.sections.length > 0)
    ? gallery.sections
    : Array.from(new Set(gallery.media.map((m) => m.sectionTitle).filter(Boolean) as string[]));

  const [activeFilter, setActiveFilter] = useState<FilterSelection>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);

  const coverImage = gallery.templateBanners?.['minimal'] || gallery.coverImage || gallery.media[0]?.url;
  const shootDate = (gallery as any).shootDate || gallery.eventDate;

  const filteredMedia = gallery.media.filter((item) => {
    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchCaption = item.caption?.toLowerCase().includes(q);
      const matchSection = item.sectionTitle?.toLowerCase().includes(q);
      if (!matchTitle && !matchCaption && !matchSection) return false;
    }

    // 2. Filter selection
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
      return (item.sectionTitle || '').toLowerCase() === activeFilter.title.toLowerCase();
    }

    return true;
  });

  const favoritesCount = gallery.media.filter((m) => m.isFavorite).length;
  const photosCount = gallery.media.filter((m) => m.type !== 'video').length;
  const videosCount = gallery.media.filter((m) => m.type === 'video').length;

  return (
    <div className="bg-[#F8F8F6] text-[#1A1A1A] min-h-screen selection:bg-neutral-900 selection:text-white font-sans antialiased">
      {/* ─── BESPOKE SCANDINAVIAN MINIMAL FULL-SCREEN HERO BANNER ─── */}
      <GalleryHeroBanner
        template="minimal"
        title={gallery.title}
        shootDate={shootDate}
        coverImage={coverImage}
      />

      {/* ─── FLOATING CLIENT SECTION FILTER BAR (DOCKS FIXED DIRECTLY UNDER NAVBAR ON SCROLL) ─── */}
      <ClientSectionFilterBar
        sections={gallerySections}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        favoritesCount={favoritesCount}
        totalPhotosCount={photosCount}
        totalVideosCount={videosCount}
        theme="minimal"
      />

      {/* ─── AI FACE SEARCH BOX ─── */}
      {activeFilter.type === 'ai-face' && (
        <section className="max-w-4xl mx-auto px-4 mb-4">
          <AIFaceSearchBox
            mediaItems={gallery.media}
            onMatchesFound={(matchedIds) => setAiMatchedIds(matchedIds)}
            onClose={() => setActiveFilter({ type: 'all' })}
            theme="minimal"
          />
        </section>
      )}

      {/* ─── SCANDINAVIAN 2-COLUMN ARCHITECTURAL EXHIBITION GRID ─── */}
      <main
        className={`max-w-[1500px] mx-auto px-4 sm:px-8 ${
          activeFilter.type === 'ai-face' && aiMatchedIds === null ? 'hidden' : 'pt-1 sm:pt-2 pb-6'
        }`}
      >
        {filteredMedia.length === 0 ? (
          activeFilter.type === 'ai-face' && aiMatchedIds === null ? null : (
            <div className="py-24 text-center space-y-3 bg-white p-8 sm:p-12 border border-neutral-200 rounded-none max-w-md mx-auto shadow-xs">
              <Heart className="w-8 h-8 text-neutral-400 mx-auto stroke-[1.25]" />
              <p className="font-light text-xl text-neutral-900">
                {activeFilter.type === 'favorites'
                  ? 'No starred plates yet'
                  : activeFilter.type === 'ai-face'
                  ? 'No matching plates found for this face'
                  : 'No photographic plates in this section'}
              </p>
              <p className="text-xs text-neutral-500 font-mono">
                {activeFilter.type === 'favorites'
                  ? 'Select the heart on any photographic plate to curate your selections.'
                  : activeFilter.type === 'ai-face'
                  ? 'Try uploading or taking another selfie with clear facial lighting.'
                  : 'Try selecting All Photos to view the complete monograph.'}
              </p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5 items-start">
            {filteredMedia.map((item, index) => {
              const originalIndex = gallery.media.findIndex((m) => m.id === item.id);
              const actualIndex = originalIndex >= 0 ? originalIndex : 0;
              const isSelected = selectedMediaIds.has(item.id);
              const isFav = item.isFavorite;
              const imgSrc = item.thumbnailUrl || (item.type === 'video' ? 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80' : item.url);

              // Every 5th item is featured as a full-width focal centerpiece across both columns
              const isFeaturedCenterpiece = index % 5 === 0;

              return (
                <div
                  key={item.id}
                  className={`${
                    isFeaturedCenterpiece ? 'md:col-span-2 w-full my-0.5' : 'col-span-1'
                  } group transition-all duration-500 cursor-pointer`}
                  onClick={() => onOpenLightbox(actualIndex)}
                >
                  {/* Fine Art Photographic Plate Container */}
                  <div
                    className={`relative overflow-hidden bg-white border transition-all duration-500 ${
                      isSelected
                        ? 'border-neutral-950 ring-2 ring-neutral-950/30 shadow-xl'
                        : 'border-neutral-200/90 hover:border-neutral-900/80 shadow-xs hover:shadow-2xl'
                    }`}
                  >
                    <img
                      src={imgSrc}
                      alt={item.title || 'Archival Plate'}
                      loading="lazy"
                      className="w-full h-auto object-cover group-hover:scale-[1.015] transition-transform duration-700 ease-out block"
                    />

                    {/* Architectural Gallery Matte Overlay */}
                    <div className="absolute inset-0 bg-neutral-950/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Video Reel Badge */}
                    {item.type === 'video' && (
                      <div className="absolute bottom-3 left-3 z-10 px-2 py-0.5 rounded-none bg-white/95 backdrop-blur-md text-neutral-900 text-[10px] font-mono flex items-center gap-1 border border-neutral-200 shadow-sm">
                        <Film className="w-3 h-3" /> Reel
                      </div>
                    )}

                    {/* Multi-Select Checkbox (Top Left) */}
                    {onToggleSelectMedia && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelectMedia(item.id);
                        }}
                        className={`absolute top-3 left-3 z-20 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-neutral-950 border-neutral-950 text-white scale-110 shadow-md'
                            : 'bg-white/90 border-neutral-300 text-neutral-800 opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105'
                        }`}
                        title={isSelected ? 'Deselect plate' : 'Select plate'}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <div className="w-2 h-2 rounded-full border border-neutral-400" />
                        )}
                      </button>
                    )}

                    {/* Favorite Heart Button (Top Right) */}
                    {onToggleFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item.id);
                        }}
                        className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-sm transition-all ${
                          isFav
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-white/90 text-neutral-700 opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-white'
                        }`}
                        title="Favorite plate"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Refined Archival Plate Caption Underneath */}
                  <div className="mt-3 flex items-baseline justify-between text-[11px] font-mono text-neutral-400 px-0.5">
                    <span className="text-neutral-700 font-medium tracking-tight truncate max-w-[70%]">
                      {item.title || `Plate ${index + 1 < 10 ? `0${index + 1}` : index + 1}`}
                    </span>
                    <span className="text-[10px] tracking-widest text-neutral-400 uppercase">
                      {item.sectionTitle || 'Archival Print'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── SCANDINAVIAN ARCHITECTURAL FOOTER ─── */}
      <ClientGalleryFooter
        galleryTitle={gallery.title}
        studioName={studioName || 'FINE ART MONOGRAPH'}
        mediaCount={gallery.media.length}
        theme="minimal"
      />
    </div>
  );
};
