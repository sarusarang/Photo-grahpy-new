import React, { useState } from 'react';
import type { Gallery } from '../../types';
import {
  Heart,
  Play,
  Check,
  Film,
  Sparkles,
  Flower2,
} from 'lucide-react';
import { GalleryHeroBanner } from './GalleryHeroBanner';
import { ClientSectionFilterBar, type FilterSelection } from './ClientSectionFilterBar';
import { AIFaceSearchBox } from './AIFaceSearchBox';

interface MasonryLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
  selectedMediaIds?: Set<string>;
  onToggleSelectMedia?: (mediaId: string) => void;
  onStartSlideshow?: (startIndex?: number) => void;
}

export const MasonryLayout: React.FC<MasonryLayoutProps> = ({
  gallery,
  onOpenLightbox,
  onToggleFavorite,
  selectedMediaIds = new Set(),
  onToggleSelectMedia,
  onStartSlideshow,
}) => {
  // Derive gallery sections
  const gallerySections = (gallery.sections && gallery.sections.length > 0)
    ? gallery.sections
    : Array.from(new Set(gallery.media.map((m) => m.sectionTitle).filter(Boolean) as string[]));

  const [activeFilter, setActiveFilter] = useState<FilterSelection>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);

  const coverImage = gallery.templateBanners?.['masonry'] || gallery.coverImage || gallery.media[0]?.url;
  const shootDate = (gallery as any).shootDate || gallery.eventDate;

  // Filter media items
  const filteredMedia = gallery.media.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchCaption = item.caption?.toLowerCase().includes(q);
      const matchSection = item.sectionTitle?.toLowerCase().includes(q);
      if (!matchTitle && !matchCaption && !matchSection) return false;
    }

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

  const masonryBanners = gallery.masonryBannerImages && gallery.masonryBannerImages.length >= 4
    ? gallery.masonryBannerImages
    : [
        coverImage,
        gallery.media[1]?.url || gallery.media[0]?.url || coverImage,
        gallery.media[2]?.url || gallery.media[0]?.url || coverImage,
        gallery.media[3]?.url || gallery.media[0]?.url || coverImage,
      ];

  return (
    <div className="bg-[#09110E] text-neutral-100 min-h-screen selection:bg-emerald-500 selection:text-neutral-950 font-sans antialiased">
      {/* ─── BESPOKE BOTANICAL ROMANCE 4-PHOTO HERO BANNER ─── */}
      <GalleryHeroBanner
        template="masonry"
        title={gallery.title}
        shootDate={shootDate}
        coverImage={masonryBanners[0]}
        additionalImages={[masonryBanners[1], masonryBanners[2], masonryBanners[3]]}
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
        theme="masonry"
      />

      {/* ─── AI FACE SEARCH BOX ─── */}
      {activeFilter.type === 'ai-face' && (
        <section className="max-w-4xl mx-auto px-4 mb-4">
          <AIFaceSearchBox
            mediaItems={gallery.media}
            onMatchesFound={(matchedIds) => setAiMatchedIds(matchedIds)}
            onClose={() => setActiveFilter({ type: 'all' })}
            theme="masonry"
          />
        </section>
      )}

      {/* ─── 4-COLUMN LUSH ORGANIC BOTANICAL MASONRY (MINIMAL GAP, SLEEK ORGANIC ELEVATIONS) ─── */}
      <main className="max-w-[1780px] mx-auto px-2 sm:px-4 pt-1 sm:pt-2 pb-16">
        {filteredMedia.length === 0 ? (
          activeFilter.type === 'ai-face' && aiMatchedIds === null ? null : (
            <div className="py-24 text-center space-y-3 bg-neutral-900/40 rounded-3xl border border-emerald-950/80 p-8 max-w-md mx-auto">
              <Heart className="w-8 h-8 text-emerald-400/60 mx-auto stroke-[1.5]" />
              <p className="font-serif italic text-xl text-neutral-200">
                {activeFilter.type === 'favorites'
                  ? 'No starred photographs yet'
                  : activeFilter.type === 'ai-face'
                  ? 'No matching photographs found for this face'
                  : 'No photographs in this section'}
              </p>
              <p className="text-xs text-neutral-400 font-mono">
                {activeFilter.type === 'favorites'
                  ? 'Click the heart icon on any photograph to save it to your starred collection.'
                  : activeFilter.type === 'ai-face'
                  ? 'Try uploading or taking another selfie with clear facial lighting.'
                  : 'Try selecting All Photos to view the complete collection.'}
              </p>
            </div>
          )
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-2.5 sm:gap-3 space-y-2.5 sm:space-y-3">
            {filteredMedia.map((item) => {
              const originalIndex = gallery.media.findIndex((m) => m.id === item.id);
              const actualIndex = originalIndex >= 0 ? originalIndex : 0;
              const isSelected = selectedMediaIds.has(item.id);
              const isFav = item.isFavorite;
              const imgSrc = item.thumbnailUrl || (item.type === 'video' ? 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80' : item.url);

              return (
                <div
                  key={item.id}
                  className={`break-inside-avoid relative overflow-hidden group cursor-pointer rounded-xl sm:rounded-2xl border transition-all duration-500 bg-[#0C1512] ${
                    isSelected
                      ? 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-2xl shadow-emerald-500/20'
                      : 'border-emerald-900/40 hover:border-emerald-500/60 shadow-xl hover:shadow-2xl hover:shadow-emerald-950/80'
                  }`}
                  onClick={() => onOpenLightbox(actualIndex)}
                >
                  <img
                    src={imgSrc}
                    alt={item.title || 'Photograph'}
                    loading="lazy"
                    className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out block"
                  />

                  {/* Lush Botanical Velvet Vignette on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Soft Botanical Title Reveal Bottom Left */}
                  <div className="absolute bottom-4 left-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400 block">
                        {item.sectionTitle || 'Botanical Still'}
                      </span>
                      <p className="font-serif italic text-sm text-white drop-shadow truncate max-w-[200px]">
                        {item.title}
                      </p>
                    </div>
                  </div>

                  {/* Video Reel Badge */}
                  {item.type === 'video' && (
                    <div className="absolute bottom-4 left-4 z-10 px-2.5 py-1 rounded-full bg-emerald-950/90 backdrop-blur-md text-emerald-300 text-[10px] font-mono flex items-center gap-1.5 border border-emerald-700/50 shadow-lg">
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
                      className={`absolute top-4 left-4 z-20 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-400 border-emerald-400 text-neutral-950 scale-110 shadow-lg shadow-emerald-500/30'
                          : 'bg-black/50 border-white/60 text-white opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105'
                      }`}
                      title={isSelected ? 'Deselect photo' : 'Select photo'}
                    >
                      {isSelected ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <div className="w-2 h-2 rounded-full border border-white" />
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
                      className={`absolute top-4 right-4 z-20 p-2 rounded-full backdrop-blur-md transition-all ${
                        isFav
                          ? 'bg-rose-500 text-white shadow-lg'
                          : 'bg-black/50 text-white/80 opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-black/80 hover:text-white'
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

      {/* ─── BOTANICAL FOOTER ─── */}
      <footer className="border-t border-emerald-950/80 py-16 bg-[#070D0B] text-center space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-emerald-400/80 block">
          {gallery.title} • BOTANICAL ROMANCE
        </span>
        <p className="text-[10px] text-neutral-500 font-mono">
          Organic fine art photographic monograph • Lake Como Edition
        </p>
      </footer>
    </div>
  );
};
