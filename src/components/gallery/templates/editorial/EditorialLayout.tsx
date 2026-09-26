import React from 'react';
import { Play, Check, Sparkles } from 'lucide-react';
import { GalleryHeroBanner } from '../../GalleryHeroBanner';
import { ClientSectionFilterBar } from '../../ClientSectionFilterBar';
import { AIFaceSearchBox } from '../../AIFaceSearchBox';
import { ClientGalleryFooter } from '../../ClientGalleryFooter';
import type { TemplateLayoutProps } from '../types';
import { useGalleryTemplateState } from '../useGalleryTemplateState';

export const EditorialLayout: React.FC<TemplateLayoutProps> = ({
  gallery,
  onOpenLightbox,
  selectedMediaIds = new Set(),
  onToggleSelectMedia,
  studioName = 'EX SHARE',
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
  } = useGalleryTemplateState({ gallery, templateKey: 'editorial' });

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* ─── HERO HEADER BANNER ─── */}
      <GalleryHeroBanner
        template="editorial"
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
        theme="editorial"
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
            theme="editorial"
          />
        </section>
      )}

      {/* ─── MASONRY PHOTO GRID ─── */}
      <main className="max-w-[1700px] mx-auto px-2 sm:px-3 pb-24">
        {filteredMedia.length === 0 ? (
          <div className="py-24 text-center space-y-3 bg-neutral-50 rounded-2xl border border-neutral-200 p-8 max-w-md mx-auto">
            <Sparkles className="w-8 h-8 text-neutral-400 mx-auto stroke-1" />
            <p className="font-serif italic text-neutral-700 text-lg">No imagery found</p>
            <p className="text-xs text-neutral-500 font-light">Try adjusting your filter or search query.</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-3 xl:columns-4 gap-2">
            {filteredMedia.map((item) => {
              const originalIndex = findOriginalIndex(item);
              const isSelected = selectedMediaIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`group relative break-inside-avoid mb-2 overflow-hidden bg-neutral-100 ${
                    isSelected ? 'ring-2 ring-neutral-900 ring-offset-1' : ''
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.title || 'Editorial visual'}
                    loading="lazy"
                    onClick={() => onOpenLightbox(originalIndex)}
                    className="w-full h-auto block object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] cursor-pointer"
                  />

                  {/* Video Badge */}
                  {item.type === 'video' && (
                    <div className="absolute top-2 left-2 z-10 bg-neutral-950/70 backdrop-blur-sm p-1.5 rounded-full text-white">
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
                          : 'bg-white/80 backdrop-blur-sm text-neutral-700 opacity-0 group-hover:opacity-100 hover:bg-white'
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
        studioName={studioName}
        mediaCount={gallery.media.length}
        theme="editorial"
      />
    </div>
  );
};
