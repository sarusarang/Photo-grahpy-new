import React from 'react';
import { Play, Check, Sparkles } from 'lucide-react';
import { GalleryHeroBanner } from '../../GalleryHeroBanner';
import { ClientSectionFilterBar } from '../../ClientSectionFilterBar';
import { AIFaceSearchBox } from '../../AIFaceSearchBox';
import { ClientGalleryFooter } from '../../ClientGalleryFooter';
import type { TemplateLayoutProps } from '../types';
import { useGalleryTemplateState } from '../useGalleryTemplateState';

export const MinimalLayout: React.FC<TemplateLayoutProps> = ({
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
  } = useGalleryTemplateState({ gallery, templateKey: 'minimal' });

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* ─── SCANDINAVIAN MINIMAL HERO BANNER ─── */}
      <GalleryHeroBanner
        template="minimal"
        title={gallery.title}
        coverImage={coverImage}
        shootDate={shootDate}
      />

      {/* ─── ARCHIVAL FILTER BAR ─── */}
      <ClientSectionFilterBar
        sections={gallerySections}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        totalPhotosCount={photosCount}
        totalVideosCount={videosCount}
        theme="minimal"
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
            theme="minimal"
          />
        </section>
      )}

      {/* ─── MASONRY PHOTO GRID ─── */}
      <main className="max-w-[1500px] mx-auto px-3 sm:px-6 pb-24">
        {filteredMedia.length === 0 ? (
          <div className="py-24 text-center space-y-3 bg-white p-8 sm:p-12 border border-neutral-200 max-w-md mx-auto shadow-xs">
            <Sparkles className="w-8 h-8 text-neutral-400 mx-auto stroke-1" />
            <p className="font-serif text-neutral-900 text-lg">No plates indexed</p>
            <p className="text-xs text-neutral-500 font-light">Clear your section or search criteria to view plates.</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-3 xl:columns-4 gap-3">
            {filteredMedia.map((item) => {
              const originalIndex = findOriginalIndex(item);
              const isSelected = selectedMediaIds.has(item.id);

              return (
                <div key={item.id} className="group flex flex-col break-inside-avoid mb-3">
                  <div
                    className={`relative overflow-hidden bg-white border border-neutral-200/90 shadow-sm transition-all duration-300 hover:shadow-md ${
                      isSelected ? 'ring-2 ring-neutral-950 ring-offset-2' : ''
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.title || 'Archival plate'}
                      loading="lazy"
                      onClick={() => onOpenLightbox(originalIndex)}
                      className="w-full h-auto block object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] cursor-pointer"
                    />

                    {/* Video Badge */}
                    {item.type === 'video' && (
                      <div className="absolute top-2 left-2 z-10 bg-neutral-950/80 backdrop-blur-sm p-1.5 rounded-full text-white">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    )}

                    {/* Multi-Select */}
                    {onToggleSelectMedia && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleSelectMedia(item.id); }}
                        className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-neutral-900 text-white shadow-md'
                            : 'bg-white/90 text-neutral-800 opacity-0 group-hover:opacity-100 hover:bg-neutral-900 hover:text-white shadow-sm'
                        }`}
                        title="Select photo"
                      >
                        <Check className={`w-3.5 h-3.5 ${isSelected ? 'stroke-[3]' : 'stroke-2'}`} />
                      </button>
                    )}
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
