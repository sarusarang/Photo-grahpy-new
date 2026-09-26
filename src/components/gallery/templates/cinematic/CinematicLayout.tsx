import React, { useRef } from 'react';
import { Play, Check, Sparkles } from 'lucide-react';
import { ClientSectionFilterBar } from '../../ClientSectionFilterBar';
import { AIFaceSearchBox } from '../../AIFaceSearchBox';
import { ClientGalleryFooter } from '../../ClientGalleryFooter';
import type { TemplateLayoutProps } from '../types';
import { useGalleryTemplateState } from '../useGalleryTemplateState';

const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('video');
};

export const CinematicLayout: React.FC<TemplateLayoutProps> = ({
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
    filteredMedia,
    photosCount,
    videosCount,
    findOriginalIndex,
  } = useGalleryTemplateState({ gallery, templateKey: 'cinematic' });

  const videos = gallery.media.filter((m) => m.type === 'video');
  const bannerVideoUrl =
    (gallery.templateBanners?.['cinematic'] && isVideoUrl(gallery.templateBanners?.['cinematic']))
      ? gallery.templateBanners?.['cinematic']
      : (isVideoUrl(coverImage)
          ? coverImage
          : videos[0]?.url);

  const heroImage =
    coverImage ||
    gallery.templateBanners?.['cinematic'] ||
    gallery.coverImage ||
    gallery.media.find((m) => m.type !== 'video')?.url ||
    gallery.media[0]?.url;

  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="min-h-screen bg-[#030304] text-neutral-200 font-sans selection:bg-amber-500 selection:text-black">
      {/* ─── 2.39:1 CINEMATIC LETTERBOX BANNER ─── */}
      <div className="relative w-full bg-black overflow-hidden border-b border-neutral-900">
        <div className="w-full aspect-[21/9] sm:aspect-[2.39/1] max-h-[75vh] relative overflow-hidden">
          {bannerVideoUrl ? (
            <video
              ref={videoRef}
              src={bannerVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-80"
            />
          ) : heroImage ? (
            <img
              src={heroImage}
              alt="Cinematic frame"
              className="w-full h-full object-cover opacity-85 filter contrast-105"
            />
          ) : null}

          {/* Anamorphic Gradient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030304] via-transparent to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

          {/* Letterbox Bar Top */}
          <div className="absolute top-0 left-0 right-0 h-4 sm:h-8 bg-black/90 pointer-events-none" />
          {/* Letterbox Bar Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-4 sm:h-8 bg-black/90 pointer-events-none" />

          {/* Overlay Title */}
          <div className="absolute bottom-6 sm:bottom-12 left-4 sm:left-12 right-4 z-10">
            <div className="max-w-4xl space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-amber-400/20 text-amber-400 border border-amber-400/40">
                  2.39:1 Anamorphic Cinema
                </span>
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                  {gallery.media.length} Frames
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif tracking-tight text-white font-bold drop-shadow-lg">
                {gallery.title}
              </h1>
              {gallery.clientName && (
                <p className="text-sm font-light text-neutral-300 tracking-wide">
                  Featuring {gallery.clientName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── FILTER & SECTION NAVIGATION ─── */}
      <ClientSectionFilterBar
        sections={gallerySections}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        totalPhotosCount={photosCount}
        totalVideosCount={videosCount}
        theme="cinematic"
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
            theme="cinematic"
          />
        </section>
      )}

      {/* ─── 16:9 & 21:9 WIDESCREEN REEL GRID ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {filteredMedia.length === 0 ? (
          <div className="py-24 text-center space-y-3 bg-neutral-900/40 rounded-3xl border border-neutral-800 p-8 max-w-md mx-auto">
            <Sparkles className="w-8 h-8 text-neutral-500 mx-auto stroke-1" />
            <p className="font-serif italic text-neutral-200 text-lg">No footage matching filter</p>
            <p className="text-xs text-neutral-500 font-light">
              Select another section or clear your active search.
            </p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-3 xl:columns-4 gap-2">
            {filteredMedia.map((item) => {
              const originalIndex = findOriginalIndex(item);
              const isSelected = selectedMediaIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`group relative break-inside-avoid mb-2 overflow-hidden bg-neutral-950 rounded-lg border border-neutral-900 transition-all duration-300 ${
                    isSelected ? 'ring-2 ring-amber-400' : 'hover:border-neutral-700'
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.title || 'Cinema frame'}
                    loading="lazy"
                    onClick={() => onOpenLightbox(originalIndex)}
                    className="w-full h-auto block object-cover transition-transform duration-700 ease-out group-hover:scale-105 cursor-pointer filter brightness-90 group-hover:brightness-100"
                  />

                  {/* Video Play Badge */}
                  {item.type === 'video' && (
                    <div className="absolute top-2.5 left-2.5 z-10 bg-amber-400/90 text-neutral-950 p-1.5 rounded-full shadow-lg">
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
                      className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-neutral-950 font-bold shadow-md'
                          : 'bg-black/60 backdrop-blur-sm text-neutral-300 opacity-0 group-hover:opacity-100 hover:bg-amber-400 hover:text-neutral-950'
                      }`}
                      title="Select frame"
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

      {/* ─── CINEMATIC LETTERBOX FOOTER ─── */}
      <ClientGalleryFooter
        galleryTitle={gallery.title}
        studioName={studioName || '2.39:1 ANAMORPHIC MASTER'}
        mediaCount={gallery.media.length}
        theme="cinematic"
      />
    </div>
  );
};
