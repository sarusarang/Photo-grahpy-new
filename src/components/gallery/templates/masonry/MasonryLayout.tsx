import React from 'react';
import { Play, Check, Sparkles } from 'lucide-react';
import { GalleryHeroBanner } from '../../GalleryHeroBanner';
import { ClientSectionFilterBar } from '../../ClientSectionFilterBar';
import { AIFaceSearchBox } from '../../AIFaceSearchBox';
import { ClientGalleryFooter } from '../../ClientGalleryFooter';
import type { TemplateLayoutProps } from '../types';
import { useGalleryTemplateState } from '../useGalleryTemplateState';

export const MasonryLayout: React.FC<TemplateLayoutProps> = ({
  gallery,
  onOpenLightbox,
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
      <ClientSectionFilterBar
        sections={gallerySections}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        totalPhotosCount={photosCount}
        totalVideosCount={videosCount}
        theme="masonry"
      />

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
