import React from 'react';
import { GalleryHeroBanner } from '../../GalleryHeroBanner';
import { ClientSectionFilterBar } from '../../ClientSectionFilterBar';
import { AIFaceSearchBox } from '../../AIFaceSearchBox';
import { ClientGalleryFooter } from '../../ClientGalleryFooter';
import { UniversalPhotoGrid } from '../../UniversalPhotoGrid';
import type { TemplateLayoutProps } from '../types';
import { useGalleryTemplateState } from '../useGalleryTemplateState';

export const MasonryLayout: React.FC<TemplateLayoutProps> = ({
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
    templateKey: 'masonry',
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

  return (
    <div className="min-h-screen bg-[#070D0B] text-[#E8EAE6] font-sans selection:bg-emerald-900 selection:text-white">
      {/* ─── BOTANICAL HERO BANNER ─── */}
      <GalleryHeroBanner
        template="masonry"
        title={gallery.title}
        coverImage={coverImage}
        shootDate={shootDate}
        watermarkEnabled={watermarkEnabled}
        watermarkText={watermarkText}
        watermarkOpacity={gallery.watermark_opacity}
        watermarkPosition={gallery.watermark_position}
        watermarkImage={gallery.watermark_image}
      />

      {/* ─── FILTER & SECTION NAVIGATION ─── */}
      <ClientSectionFilterBar
        sections={gallerySections}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        totalPhotosCount={photosCount}
        totalVideosCount={videosCount}
        theme="masonry"
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
            theme="masonry"
          />
        </section>
      )}

      {/* ─── FULL-WIDTH SEAMLESS PHOTO GRID WITH INTERACTIVE LAYOUT ─── */}
      <UniversalPhotoGrid
        media={filteredMedia}
        gridDesign={gridDesign}
        onOpenLightbox={onOpenLightbox}
        selectedMediaIds={selectedMediaIds}
        onToggleSelectMedia={onToggleSelectMedia}
        onDownloadSingle={onDownloadSingle}
        theme="masonry"
        findOriginalIndex={findOriginalIndex}
        emptyMessage="Garden is quiet"
        emptySubMessage="No photographs matching the selected criteria."
        watermarkEnabled={watermarkEnabled}
        watermarkText={watermarkText}
        watermarkOpacity={gallery.watermark_opacity}
        watermarkPosition={gallery.watermark_position}
        watermarkImage={gallery.watermark_image}
      />

      {/* ─── FOOTER ─── */}
      <ClientGalleryFooter
        galleryTitle={gallery.title}
        studioName={resolvedStudio}
        mediaCount={gallery.media.length}
        theme="masonry"
      />
    </div>
  );
};
