import React from 'react';
import { GalleryHeroBanner } from '../../GalleryHeroBanner';
import { ClientSectionFilterBar } from '../../ClientSectionFilterBar';
import { AIFaceSearchBox } from '../../AIFaceSearchBox';
import { ClientGalleryFooter } from '../../ClientGalleryFooter';
import { UniversalPhotoGrid } from '../../UniversalPhotoGrid';
import type { TemplateLayoutProps } from '../types';
import { useGalleryTemplateState } from '../useGalleryTemplateState';

export const EditorialLayout: React.FC<TemplateLayoutProps> = ({
  gallery,
  onOpenLightbox,
  onToggleFavorite,
  favoritingMediaIds,
  selectedMediaIds = new Set(),
  onToggleSelectMedia,
  studioName = 'EX SHARE',
  photographerName,
  gridDesign: passedGridDesign,
  onSelectGridDesign: passedSetGridDesign,
  onDownloadSingle,
  onCreateStoryVideo,
  onOpenContact,
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
    gridDesign,
    setGridDesign,
  } = useGalleryTemplateState({
    gallery,
    templateKey: 'editorial',
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
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* ─── HERO HEADER BANNER ─── */}
      <GalleryHeroBanner
        template="editorial"
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

      {/* ─── FILTER & SECTION NAVIGATION ─── */}
      <ClientSectionFilterBar
        sections={gallerySections}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        favoritesCount={favoritesCount}
        totalPhotosCount={photosCount}
        totalVideosCount={videosCount}
        theme="editorial"
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
            theme="editorial"
          />
        </section>
      )}

      {/* ─── FULL-WIDTH SEAMLESS PHOTO GRID WITH INTERACTIVE LAYOUT ─── */}
      <UniversalPhotoGrid
        media={filteredMedia}
        gridDesign={gridDesign}
        onOpenLightbox={onOpenLightbox}
        onToggleFavorite={onToggleFavorite}
        favoritingMediaIds={favoritingMediaIds}
        selectedMediaIds={selectedMediaIds}
        onToggleSelectMedia={onToggleSelectMedia}
        onDownloadSingle={onDownloadSingle}
        theme="editorial"
        findOriginalIndex={findOriginalIndex}
        emptyMessage={
          activeFilter.type === 'favorites'
            ? 'No Liked Photos Yet'
            : 'No imagery found'
        }
        emptySubMessage={
          activeFilter.type === 'favorites'
            ? 'Click the heart icon on any photograph to add it to your liked collection.'
            : 'Try adjusting your section filter or face search criteria.'
        }
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

      {/* ─── FOOTER ─── */}
      <ClientGalleryFooter
        galleryTitle={gallery.title}
        studioName={resolvedStudio}
        mediaCount={gallery.media.length}
        theme="editorial"
        onOpenContact={onOpenContact}
      />
    </div>
  );
};
