import React, { useState } from 'react';
import type { Gallery } from '../../types';
import {
  Film,
  Play,
  Heart,
  Check,
  Clapperboard,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { GalleryHeroBanner } from './GalleryHeroBanner';
import { ClientSectionFilterBar, type FilterSelection } from './ClientSectionFilterBar';
import { AIFaceSearchBox } from './AIFaceSearchBox';

interface CinematicLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
  selectedMediaIds?: Set<string>;
  onToggleSelectMedia?: (mediaId: string) => void;
  onStartSlideshow?: (startIndex?: number) => void;
}

export const CinematicLayout: React.FC<CinematicLayoutProps> = ({
  gallery,
  onOpenLightbox,
  onToggleFavorite,
  selectedMediaIds = new Set(),
  onToggleSelectMedia,
  onStartSlideshow,
}) => {
  const media = gallery.media;
  const videos = media.filter((m) => m.type === 'video');
  const coverImage = gallery.templateBanners?.['cinematic'] || gallery.coverImage || media[0]?.url;
  const shootDate = (gallery as any).shootDate || gallery.eventDate;

  // Derive gallery sections
  const gallerySections = (gallery.sections && gallery.sections.length > 0)
    ? gallery.sections
    : Array.from(new Set(media.map((m) => m.sectionTitle).filter(Boolean) as string[]));

  const [activeFilter, setActiveFilter] = useState<FilterSelection>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);

  // Filter media items
  const filteredMedia = media.filter((item) => {
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

  const favoritesCount = media.filter((m) => m.isFavorite).length;
  const photosCount = media.filter((m) => m.type !== 'video').length;
  const videosCount = videos.length;

  // Cinematic storyboard rhythm: 6-item cadence (1 Panoramic Master + 2 Widescreen Duals + 3 Sequence Cutaways)
  const getCinematicSpan = (index: number) => {
    const mod = index % 6;
    if (mod === 0) {
      return {
        containerClass: 'col-span-1 sm:col-span-2 lg:col-span-6',
        aspectClass: 'aspect-[16/9] sm:aspect-[21/9] lg:aspect-[2.39/1] max-h-[620px]',
        badgeText: 'PANAVISION MASTER • 2.39:1',
        isMaster: true,
      };
    }
    if (mod === 1 || mod === 2) {
      return {
        containerClass: 'col-span-1 sm:col-span-1 lg:col-span-3',
        aspectClass: 'aspect-[16/10] sm:aspect-[16/9] max-h-[440px]',
        badgeText: 'WIDESCREEN STILL • 16:9',
        isMaster: false,
      };
    }
    return {
      containerClass: 'col-span-1 sm:col-span-1 lg:col-span-2',
      aspectClass: 'aspect-[4/3] sm:aspect-[16/10] max-h-[380px]',
      badgeText: 'SEQUENCE STILL • 35MM',
      isMaster: false,
    };
  };

  return (
    <div className="bg-[#050507] text-neutral-100 min-h-screen selection:bg-amber-400 selection:text-black font-sans antialiased">
      {/* ─── BESPOKE 2.39:1 ANAMORPHIC CINEMATIC FULL-SCREEN HERO BANNER ─── */}
      <GalleryHeroBanner
        template="cinematic"
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
        theme="cinematic"
      />

      {/* ─── AI FACE SEARCH BOX ─── */}
      {activeFilter.type === 'ai-face' && (
        <section className="max-w-4xl mx-auto px-4 mb-4">
          <AIFaceSearchBox
            mediaItems={media}
            onMatchesFound={(matchedIds) => setAiMatchedIds(matchedIds)}
            onClose={() => setActiveFilter({ type: 'all' })}
            theme="cinematic"
          />
        </section>
      )}

      {/* ─── DYNAMIC 6-COLUMN WIDESCREEN FILM STORYBOARD GRID (PANORAMICS + DUOS + TRIPTYCHS) ─── */}
      <main className="max-w-[1700px] mx-auto px-2 sm:px-4 pt-1 sm:pt-2 pb-16">
        {filteredMedia.length === 0 ? (
          activeFilter.type === 'ai-face' && aiMatchedIds === null ? null : (
            <div className="py-24 text-center space-y-3 bg-neutral-900/40 rounded-3xl border border-neutral-800 p-8 max-w-md mx-auto">
              <Film className="w-8 h-8 text-amber-400/80 mx-auto stroke-[1.5]" />
              <p className="font-serif italic text-xl text-neutral-200">
                {activeFilter.type === 'favorites'
                  ? 'No starred frames yet'
                  : activeFilter.type === 'ai-face'
                  ? 'No matching frames found for this face'
                  : 'No cinematic stills in this section'}
              </p>
              <p className="text-xs text-neutral-400 font-mono">
                {activeFilter.type === 'favorites'
                  ? 'Tap the heart on any cinematic frame to curate your selections.'
                  : activeFilter.type === 'ai-face'
                  ? 'Try uploading or capturing another selfie with clear facial lighting.'
                  : 'Try selecting All Photos to view the complete cinematic cut.'}
              </p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-2.5">
            {filteredMedia.map((item, index) => {
              const originalIndex = media.findIndex((m) => m.id === item.id);
              const actualIndex = originalIndex >= 0 ? originalIndex : 0;
              const isSelected = selectedMediaIds.has(item.id);
              const isFav = item.isFavorite;
              const { containerClass, aspectClass, badgeText, isMaster } = getCinematicSpan(index);
              const imgSrc = item.thumbnailUrl || (item.type === 'video' ? 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80' : item.url);

              // Filmic timecode simulation
              const frameMinutes = Math.floor((index * 13 + 8) / 60);
              const frameSeconds = ((index * 13 + 8) % 60).toString().padStart(2, '0');
              const timecode = `00:${frameMinutes.toString().padStart(2, '0')}:${frameSeconds}:18`;

              return (
                <div
                  key={item.id}
                  className={`${containerClass} relative group overflow-hidden rounded-xl bg-neutral-950 border ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-2xl shadow-amber-500/20'
                      : 'border-neutral-800/80 hover:border-amber-500/50 shadow-xl'
                  } transition-all duration-300 cursor-pointer`}
                  onClick={() => onOpenLightbox(actualIndex)}
                >
                  {/* Widescreen Image Container */}
                  <div className={`relative w-full ${aspectClass} overflow-hidden bg-black flex items-center justify-center`}>
                    <img
                      src={imgSrc}
                      alt={item.title || 'Cinematic Still'}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    />

                    {/* Anamorphic Golden Amber Gradient Sheen */}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-black/20 to-amber-500/10 opacity-70 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />

                    {/* Master Shot Cinematic Letterbox Reticle Accents */}
                    {isMaster && (
                      <>
                        <div className="absolute top-3 left-4 z-10 text-[9px] font-mono uppercase tracking-[0.25em] text-amber-400/80 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded border border-amber-500/20 pointer-events-none">
                          {badgeText}
                        </div>
                        <div className="absolute top-3 right-4 z-10 text-[9px] font-mono text-neutral-400 bg-black/60 px-2 py-0.5 rounded border border-neutral-800 pointer-events-none hidden sm:block">
                          TC {timecode}
                        </div>
                      </>
                    )}

                    {/* Regular Still Badge on Hover */}
                    {!isMaster && (
                      <div className="absolute bottom-3 left-3 z-10 text-[9px] font-mono uppercase tracking-[0.2em] text-neutral-300 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded border border-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {item.sectionTitle || badgeText}
                      </div>
                    )}

                    {/* Video Reel Tag */}
                    {item.type === 'video' && (
                      <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-md bg-amber-950/90 backdrop-blur-md text-amber-300 text-[10px] font-mono flex items-center gap-1.5 border border-amber-700/50 shadow-lg">
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
                        className={`absolute ${isMaster ? 'top-10 left-4' : 'top-3 left-3'} z-20 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-amber-400 border-amber-400 text-neutral-950 scale-110 shadow-lg shadow-amber-500/30'
                            : 'bg-black/60 border-white/70 text-white opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105'
                        }`}
                        title={isSelected ? 'Deselect still' : 'Select still'}
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
                        className={`absolute ${isMaster ? 'top-10 right-4' : 'top-3 right-3'} z-20 p-2 rounded-full backdrop-blur-md transition-all ${
                          isFav
                            ? 'bg-rose-500 text-white shadow-lg'
                            : 'bg-black/60 text-white/90 opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-neutral-900 hover:text-white'
                        }`}
                        title="Favorite still"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── CINEMATIC LETTERBOX FOOTER ─── */}
      <footer className="border-t border-neutral-800/80 py-12 bg-[#030304] text-center space-y-2">
        <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-amber-400/90 block">
          {gallery.title} • 2.39:1 ANAMORPHIC MASTER
        </span>
        <p className="text-[10px] text-neutral-500 font-mono">
          Mastered in DCI-P3 color space • Preserved in high bit-depth
        </p>
      </footer>
    </div>
  );
};
