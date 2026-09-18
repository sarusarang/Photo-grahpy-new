import React from 'react';
import { Heart, Play, Check, Sparkles } from 'lucide-react';
import { GalleryHeroBanner } from '../../GalleryHeroBanner';
import { ClientSectionFilterBar } from '../../ClientSectionFilterBar';
import { AIFaceSearchBox } from '../../AIFaceSearchBox';
import { ClientGalleryFooter } from '../../ClientGalleryFooter';
import type { TemplateLayoutProps } from '../types';
import { useGalleryTemplateState } from '../useGalleryTemplateState';

export const MasonryLayout: React.FC<TemplateLayoutProps> = ({
  gallery,
  onOpenLightbox,
  onToggleFavorite,
  selectedMediaIds = new Set(),
  onToggleSelectMedia,
  studioName,
}) => {
  const {
    gallerySections,
    activeFilter,
    setActiveFilter,
    setSearchQuery,
    setAiMatchedIds,
    coverImage,
    shootDate,
    filteredMedia,
    favoritesCount,
    photosCount,
    videosCount,
    findOriginalIndex,
  } = useGalleryTemplateState({ gallery, templateKey: 'masonry' });

  return (
    <div className="min-h-screen bg-[#070D0B] text-[#E8EAE6] font-sans selection:bg-emerald-900 selection:text-white">
      {/* ─── BOTANICAL HERO BANNER ─── */}
      <GalleryHeroBanner
        template="masonry"
        title={gallery.title}
        coverImage={coverImage}
        shootDate={shootDate}
      />

      {/* ─── FILTER & SECTION NAVIGATION ─── */}
      <div className="sticky top-0 z-30 bg-[#070D0B]/95 backdrop-blur-md border-b border-emerald-950/60 py-3 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ClientSectionFilterBar
            sections={gallerySections}
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
            favoritesCount={favoritesCount}
            totalPhotosCount={photosCount}
            totalVideosCount={videosCount}
            theme="masonry"
          />
        </div>
      </div>

      {/* ─── AI FACE SEARCH COMPONENT (only when AI Search is active) ─── */}
      {activeFilter.type === 'ai-face' && (
        <section className="max-w-4xl mx-auto px-4 mt-2 mb-6">
          <AIFaceSearchBox
            mediaItems={gallery.media}
            onMatchesFound={(matchedIds) => {
              if (matchedIds) {
                setAiMatchedIds(matchedIds);
                setActiveFilter({ type: 'ai-face' });
              } else {
                setAiMatchedIds(null);
                setActiveFilter({ type: 'all' });
              }
            }}
            onClose={() => {
              setAiMatchedIds(null);
              setActiveFilter({ type: 'all' });
              setSearchQuery('');
            }}
            theme="masonry"
          />
        </section>
      )}

      {/* ─── ORGANIC MASONRY MULTI-COLUMN GRID ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {filteredMedia.length === 0 ? (
          <div className="py-24 text-center space-y-3 bg-neutral-900/40 rounded-3xl border border-emerald-950/80 p-8 max-w-md mx-auto">
            <Sparkles className="w-8 h-8 text-emerald-600 mx-auto stroke-1" />
            <p className="font-serif italic text-emerald-200 text-lg">Garden is quiet</p>
            <p className="text-xs text-neutral-400 font-light">
              No photographs matching the selected criteria.
            </p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-3 xl:columns-4 gap-3">
            {filteredMedia.map((item) => {
              const originalIndex = findOriginalIndex(item);
              const isSelected = selectedMediaIds.has(item.id);
              const isFav = item.isFavorite;

              return (
                <div
                  key={item.id}
                  className={`group relative break-inside-avoid mb-3 rounded-2xl overflow-hidden bg-neutral-900/60 border border-emerald-950/40 transition-all duration-300 hover:border-emerald-700/50 hover:shadow-xl hover:shadow-emerald-950/30 ${
                    isSelected ? 'ring-2 ring-emerald-400' : ''
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.title || 'Botanical portrait'}
                    loading="lazy"
                    onClick={() => onOpenLightbox(originalIndex)}
                    className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-103 cursor-pointer block"
                  />

                  {/* Gradient Overlay */}
                  <div
                    onClick={() => onOpenLightbox(originalIndex)}
                    className="absolute inset-0 bg-gradient-to-t from-[#070D0B]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer pointer-events-none"
                  />

                  {/* Video Badge */}
                  {item.type === 'video' && (
                    <div className="absolute top-3 left-3 z-10 bg-emerald-950/80 backdrop-blur-sm p-1.5 rounded-full text-emerald-300 border border-emerald-800/40">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                  )}

                  {/* Multi-Select Button */}
                  {onToggleSelectMedia && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectMedia(item.id);
                      }}
                      className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-black/50 backdrop-blur-sm text-neutral-300 opacity-0 group-hover:opacity-100 hover:bg-emerald-600 hover:text-white'
                      }`}
                      title="Select photo"
                    >
                      <Check className={`w-3.5 h-3.5 ${isSelected ? 'stroke-[3]' : 'stroke-2'}`} />
                    </button>
                  )}

                  {/* Caption */}
                  <div className="absolute bottom-3 left-3 right-12 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <p className="font-serif italic text-sm text-white drop-shadow truncate max-w-[200px]">
                      {item.title || 'Botanical Flora'}
                    </p>
                    {item.sectionTitle && (
                      <span className="text-[10px] tracking-widest text-emerald-400/90 uppercase block font-sans">
                        {item.sectionTitle}
                      </span>
                    )}
                  </div>

                  {/* Favorite Heart */}
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      className={`absolute bottom-3 right-3 z-10 p-1.5 rounded-full backdrop-blur-sm transition-all ${
                        isFav
                          ? 'bg-rose-500 text-white opacity-100'
                          : 'bg-black/40 text-neutral-300 hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100'
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

      {/* ─── FOOTER ─── */}
      <ClientGalleryFooter
        galleryTitle={gallery.title}
        studioName={studioName || 'BOTANICAL ROMANCE'}
        mediaCount={gallery.media.length}
        theme="masonry"
      />
    </div>
  );
};
