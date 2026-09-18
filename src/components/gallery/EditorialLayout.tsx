import React, { useState } from 'react';
import type { Gallery } from '../../types';
import {
  Heart,
  Check,
} from 'lucide-react';
import { GalleryHeroBanner } from './GalleryHeroBanner';
import { ClientSectionFilterBar, type FilterSelection } from './ClientSectionFilterBar';
import { AIFaceSearchBox } from './AIFaceSearchBox';
import { ClientGalleryFooter } from './ClientGalleryFooter';

interface EditorialLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
  selectedMediaIds?: Set<string>;
  onToggleSelectMedia?: (mediaId: string) => void;
  onStartSlideshow?: (startIndex?: number) => void;
  studioName?: string;
  onShareGallery?: () => void;
}

export const EditorialLayout: React.FC<EditorialLayoutProps> = ({
  gallery,
  onOpenLightbox,
  onToggleFavorite,
  selectedMediaIds = new Set(),
  onToggleSelectMedia,
  onStartSlideshow,
  studioName = 'EX SHARE',
  onShareGallery,
}) => {
  const media = gallery.media;
  const coverImage = gallery.templateBanners?.['editorial'] || gallery.coverImage || media[0]?.url;
  const shootDate = (gallery as any).shootDate || gallery.eventDate;

  // Derive gallery sections
  const gallerySections = (gallery.sections && gallery.sections.length > 0)
    ? gallery.sections
    : Array.from(new Set(media.map((m) => m.sectionTitle).filter(Boolean) as string[]));

  const [activeFilter, setActiveFilter] = useState<FilterSelection>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);

  const filteredMedia = media.filter((item) => {
    // 1. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchCaption = item.caption?.toLowerCase().includes(q);
      const matchSection = item.sectionTitle?.toLowerCase().includes(q);
      if (!matchTitle && !matchCaption && !matchSection) return false;
    }

    // 2. Active pill filter
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

  const favoritesCount = media.filter((m) => m.isFavorite).length;
  const photosCount = media.filter((m) => m.type !== 'video').length;
  const videosCount = media.filter((m) => m.type === 'video').length;

  const displayMedia = filteredMedia;

  return (
    <div className="bg-white text-neutral-900 min-h-screen selection:bg-neutral-900 selection:text-white font-sans antialiased">
      {/* ─── FULL-SCREEN HERO BANNER ─── */}
      <GalleryHeroBanner
        template="editorial"
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
        theme="editorial"
      />

      {/* ─── AI FACE SEARCH BOX (When AI Search is Active) ─── */}
      {activeFilter.type === 'ai-face' && (
        <section className="max-w-4xl mx-auto px-4">
          <AIFaceSearchBox
            mediaItems={media}
            onMatchesFound={(matchedIds) => setAiMatchedIds(matchedIds)}
            onClose={() => setActiveFilter({ type: 'all' })}
            theme="editorial"
          />
        </section>
      )}

      {/* ─── MINIMAL-GAP MODERN EDITORIAL FLUID PHOTO GRID (NO NAMES/METADATA, PURE IMAGES) ─── */}
      <main
        className={`max-w-[1700px] mx-auto px-2 sm:px-4 ${
          activeFilter.type === 'ai-face' && aiMatchedIds === null
            ? 'hidden'
            : 'pt-1 sm:pt-2 pb-6'
        }`}
      >
        {/* Empty Filter State */}
        {displayMedia.length === 0 ? (
          activeFilter.type === 'ai-face' && aiMatchedIds === null ? null : (
            <div className="py-24 text-center space-y-3 bg-neutral-50 rounded-2xl border border-neutral-200 p-8 max-w-md mx-auto">
              <Heart className="w-8 h-8 text-neutral-400 mx-auto stroke-[1.5]" />
              <p className="font-serif italic text-xl text-neutral-800">
                {activeFilter.type === 'favorites'
                  ? 'No starred photographs yet'
                  : activeFilter.type === 'ai-face'
                  ? 'No matching photographs found for this face'
                  : 'No photographs in this section'}
              </p>
              <p className="text-xs text-neutral-500 font-mono">
                {activeFilter.type === 'favorites'
                  ? 'Tap the heart icon on any photograph to save it to your curated favorites collection.'
                  : activeFilter.type === 'ai-face'
                  ? 'Try uploading or taking another selfie with clear facial lighting.'
                  : 'Try selecting All Photos to view the complete collection.'}
              </p>
            </div>
          )
        ) : (
          /* Pure image waterfall with minimal gap matching reference screenshot */
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-2 sm:gap-2.5 space-y-2 sm:space-y-2.5">
            {displayMedia.map((item) => {
              const originalIndex = gallery.media.findIndex((m) => m.id === item.id);
              const actualIndex = originalIndex >= 0 ? originalIndex : 0;
              const isSelected = selectedMediaIds.has(item.id);
              const isFav = item.isFavorite;
              const imgSrc = item.thumbnailUrl || (item.type === 'video' ? 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80' : item.url);

              return (
                <div
                  key={item.id}
                  className="break-inside-avoid relative overflow-hidden group cursor-pointer rounded-sm sm:rounded-md transition-all duration-300"
                  onClick={() => onOpenLightbox(actualIndex)}
                >
                  <img
                    src={imgSrc}
                    alt={item.title || 'Photograph'}
                    loading="lazy"
                    className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out block"
                  />

                  {/* Subtle Gradient Shadow on Hover */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Video Badge */}
                  {item.type === 'video' && (
                    <div className="absolute bottom-3 left-3 z-10 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono flex items-center gap-1 border border-white/20">
                      Reel
                    </div>
                  )}

                  {/* Multi-Select Checkbox (Top Left) */}
                  {onToggleSelectMedia && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectMedia(item.id);
                      }}
                      className={`absolute top-3 left-3 z-10 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-neutral-950 border-neutral-950 text-white scale-110 shadow-lg'
                          : 'bg-black/50 border-white/70 text-white opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105'
                      }`}
                      title={isSelected ? 'Deselect photo' : 'Select photo'}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <div className="w-2 h-2 rounded-full border border-white" />
                      )}
                    </button>
                  )}

                  {/* Favorite Star (Top Right) */}
                  {onToggleFavorite && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all ${
                        isFav
                          ? 'bg-rose-500 text-white shadow-lg'
                          : 'bg-black/50 text-white opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-neutral-900/80'
                      }`}
                      title="Favorite photo"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── LUXURY REDUCED-GAP FOOTER ─── */}
      <ClientGalleryFooter
        galleryTitle={gallery.title}
        studioName={studioName}
        mediaCount={media.length}
        theme="editorial"
      />
    </div>
  );
};
