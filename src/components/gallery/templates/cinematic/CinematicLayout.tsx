import React, { useRef } from 'react';
import { Play, Check, Sparkles, ArrowDown } from 'lucide-react';
import { ClientSectionFilterBar } from '../../ClientSectionFilterBar';
import { AIFaceSearchBox } from '../../AIFaceSearchBox';
import { ClientGalleryFooter } from '../../ClientGalleryFooter';
import { UniversalPhotoGrid } from '../../UniversalPhotoGrid';
import { formatHeroShootDate } from '../../GalleryHeroBanner';
import { WatermarkOverlay } from '../../WatermarkOverlay';
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
  photographerName,
  gridDesign: passedGridDesign,
  onSelectGridDesign: passedSetGridDesign,
  onDownloadSingle,
  onCreateStoryVideo,
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
    gridDesign,
    setGridDesign,
  } = useGalleryTemplateState({
    gallery,
    templateKey: 'cinematic',
    gridDesign: passedGridDesign,
    onSelectGridDesign: passedSetGridDesign,
  });

  const resolvedPhotographer =
    gallery.photographerName ||
    photographerName ||
    gallery.studioName ||
    studioName ||
    'PHOTOGRAPHER';

  const resolvedStudio = gallery.studioName || studioName || 'STUDIO';

  const watermarkEnabled = Boolean(gallery.watermark_enabled ?? gallery.watermarkEnabled);
  const watermarkText =
    gallery.watermark_text ||
    (resolvedPhotographer.startsWith('©') ? resolvedPhotographer : `© ${resolvedPhotographer}`);

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

  const formattedDate = formatHeroShootDate(
    shootDate || gallery.eventDate || gallery.createdAt || ((gallery as unknown as Record<string, unknown>).shootDate as string | undefined)
  );

  return (
    <div className="min-h-screen bg-[#030304] text-neutral-200 font-sans selection:bg-amber-500 selection:text-black">
      {/* ─── FULLSCREEN FITTED CINEMATIC BANNER ─── */}
      <div className="relative w-full h-screen min-h-[100dvh] bg-[#030304] overflow-hidden border-b border-neutral-900 select-none">
        <div className="w-full h-full relative overflow-hidden">
          {bannerVideoUrl ? (
            <video
              ref={videoRef}
              src={bannerVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : heroImage ? (
            <>
              <img
                src={heroImage}
                alt="Cinematic frame"
                className="w-full h-full object-cover"
              />
              {watermarkEnabled && (
                <WatermarkOverlay
                  text={watermarkText}
                  imageUrl={gallery.watermark_image}
                  opacity={gallery.watermark_opacity}
                  position={gallery.watermark_position}
                  size="lg"
                />
              )}
            </>
          ) : null}

          {/* Overlay: Title & Date with Localized Scrim Only for Readability */}
          <div className="absolute bottom-8 sm:bottom-14 left-4 sm:left-12 right-4 z-10 pointer-events-none">
            <div className="relative max-w-3xl">
              {/* Localized soft dark blur directly behind title text only */}
              <div className="absolute -inset-4 sm:-inset-8 bg-black/60 rounded-3xl blur-2xl pointer-events-none -z-10" />

              <div className="space-y-2 sm:space-y-3">
                {formattedDate && (
                  <div className="flex items-center gap-2.5 sm:gap-3 text-amber-400 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                    <span className="h-px w-6 sm:w-10 bg-amber-400/80" />
                    <span className="text-xs sm:text-sm font-mono tracking-[0.25em] uppercase font-semibold">
                      {formattedDate}
                    </span>
                  </div>
                )}
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif tracking-tight text-white font-bold drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] leading-none">
                  {gallery.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Scroll to explore animation */}
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 sm:gap-2 text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] pointer-events-none pb-safe">
            <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.3em] uppercase font-semibold">Scroll to explore</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce text-amber-400" />
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
        faceSearchEnabled={Boolean(gallery.face_search_enabled ?? (gallery as any).faceSearchEnabled)}
        gridDesign={gridDesign}
        onSelectGridDesign={setGridDesign}
        onCreateStoryVideo={onCreateStoryVideo}
      />

      {/* ─── AI FACE SEARCH COMPONENT (only when AI Search is active and enabled) ─── */}
      {Boolean(gallery.face_search_enabled ?? (gallery as any).faceSearchEnabled) && activeFilter.type === 'ai-face' && (
        <section className="max-w-4xl mx-auto px-4 mt-2 mb-6">
          <AIFaceSearchBox
            mediaItems={gallery.media}
            galleryId={gallery.id}
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

      {/* ─── FULL-WIDTH SEAMLESS CINEMATIC MEDIA GRID WITH INTERACTIVE LAYOUT ─── */}
      <UniversalPhotoGrid
        media={filteredMedia}
        gridDesign={gridDesign}
        onOpenLightbox={onOpenLightbox}
        selectedMediaIds={selectedMediaIds}
        onToggleSelectMedia={onToggleSelectMedia}
        onDownloadSingle={onDownloadSingle}
        theme="cinematic"
        findOriginalIndex={findOriginalIndex}
        emptyMessage="No footage matching filter"
        emptySubMessage="Select another section or clear your active search."
        watermarkEnabled={watermarkEnabled}
        watermarkText={watermarkText}
        watermarkOpacity={gallery.watermark_opacity}
        watermarkPosition={gallery.watermark_position}
        watermarkImage={gallery.watermark_image}
      />

      {/* ─── CINEMATIC LETTERBOX FOOTER ─── */}
      <ClientGalleryFooter
        galleryTitle={gallery.title}
        studioName={resolvedStudio}
        mediaCount={gallery.media.length}
        theme="cinematic"
      />
    </div>
  );
};
