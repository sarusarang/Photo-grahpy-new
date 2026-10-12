import React from 'react';
import { GalleryHeroBanner } from '../../GalleryHeroBanner';
import { ClientSectionFilterBar } from '../../ClientSectionFilterBar';
import { AIFaceSearchBox } from '../../AIFaceSearchBox';
import { ClientGalleryFooter } from '../../ClientGalleryFooter';
import { UniversalPhotoGrid } from '../../UniversalPhotoGrid';
import type { TemplateLayoutProps } from '../types';
import { useGalleryTemplateState } from '../useGalleryTemplateState';

export const MinimalLayout: React.FC<TemplateLayoutProps> = ({
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
    templateKey: 'minimal',
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
  const watermarkType = gallery.watermark_type || gallery.watermarkType;
  const watermarkFontSize = gallery.watermark_font_size || gallery.watermarkFontSize;
  const watermarkFontColor = gallery.watermark_font_color || gallery.watermarkFontColor;
  const watermarkFontStyle = gallery.watermark_font_style || gallery.watermarkFontStyle;

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* ─── SCANDINAVIAN MINIMAL HERO BANNER ─── */}
      <GalleryHeroBanner
        template="minimal"
        title={gallery.title}
        coverImage={coverImage}
        shootDate={shootDate}
        watermarkEnabled={watermarkEnabled}
        watermarkText={watermarkText}
        watermarkOpacity={gallery.watermark_opacity}
        watermarkPosition={gallery.watermark_position}
        watermarkImage={gallery.watermark_image}
        watermarkType={watermarkType}
        watermarkFontSize={watermarkFontSize}
        watermarkFontColor={watermarkFontColor}
        watermarkFontStyle={watermarkFontStyle}
      />

      {/* ─── ARCHIVAL FILTER BAR ─── */}
      <ClientSectionFilterBar
        sections={gallerySections}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        totalPhotosCount={photosCount}
        totalVideosCount={videosCount}
        theme="minimal"
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
            theme="minimal"
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
        theme="minimal"
        findOriginalIndex={findOriginalIndex}
        emptyMessage="No plates indexed"
        emptySubMessage="Clear your section or search criteria to view plates."
        watermarkEnabled={watermarkEnabled}
        watermarkText={watermarkText}
        watermarkOpacity={gallery.watermark_opacity}
        watermarkPosition={gallery.watermark_position}
        watermarkImage={gallery.watermark_image}
        watermarkType={watermarkType}
        watermarkFontSize={watermarkFontSize}
        watermarkFontColor={watermarkFontColor}
        watermarkFontStyle={watermarkFontStyle}
      />

      {/* ─── SCANDINAVIAN ARCHITECTURAL FOOTER ─── */}
      <ClientGalleryFooter
        galleryTitle={gallery.title}
        studioName={resolvedStudio}
        mediaCount={gallery.media.length}
        theme="minimal"
      />
    </div>
  );
};
