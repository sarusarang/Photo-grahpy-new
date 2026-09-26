import React, { useState } from 'react';
import {
  Sparkles,
  Film,
  Check,
  Eye,
  Loader2,
  Lock,
} from 'lucide-react';
import type { Gallery, GalleryTemplateId } from '@/types';
import { GALLERY_TEMPLATES, isVideoMedia } from '@/data/demoData';
import { formatHeroShootDate } from '../GalleryHeroBanner';
import { getInitialGalleryCover, handleCoverImageError } from '@/utils/coverImageUtils';
import { usePlanQuota } from '@/hooks/usePlanQuota';
import { PlanUpgradeModal } from '@/components/billing/PlanUpgradeModal';

interface GalleryDesignLayoutTabProps {
  gallery: Gallery;
  onApplyTemplate: (templateId: GalleryTemplateId) => Promise<void> | void;
  onSetTemplateBanner: (templateId: GalleryTemplateId, mediaUrl: string, mediaId?: string) => Promise<void> | void;
  onSetMasonryBanner?: (slotIndex: number, mediaUrl: string) => Promise<void> | void;
  isApplyingTemplate?: boolean;
}

export const GalleryDesignLayoutTab: React.FC<GalleryDesignLayoutTabProps> = ({
  gallery,
  onApplyTemplate,
  onSetTemplateBanner,
  isApplyingTemplate = false,
}) => {
  const planQuota = usePlanQuota();
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    errorCode?: string;
    errorMessage?: string;
    lockedFeature?: string;
  }>({ isOpen: false });

  const [selectedBannerTemplate, setSelectedBannerTemplate] = useState<GalleryTemplateId>(
    gallery.templateId || 'editorial'
  );
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const isApplying = isApplyingTemplate || Boolean(applyingTemplateId);

  const handleApplyLayout = async (templateId: GalleryTemplateId) => {
    if (isApplying || !planQuota.isTemplateAllowed(templateId)) return;
    setApplyingTemplateId(templateId);
    try {
      await onApplyTemplate(templateId);
    } finally {
      setApplyingTemplateId(null);
    }
  };

  const activeTemplateInfo = GALLERY_TEMPLATES.find((t) => t.id === selectedBannerTemplate);
  const isMasonry = selectedBannerTemplate === 'masonry';
  const isCinematic = selectedBannerTemplate === 'cinematic';
  const isEditorial = selectedBannerTemplate === 'editorial';

  const galleryPhotos = gallery.media.filter((m) => m.type !== 'video');
  const videos = gallery.media.filter((m) => m.type === 'video');

  const isMasonryFallback = gallery.masonryBannerImages?.[0] === getInitialGalleryCover('masonry');
  const validMasonryBanner = (!isMasonryFallback && gallery.masonryBannerImages?.[0]) ? gallery.masonryBannerImages[0] : undefined;

  const currentSingleBanner =
    gallery.templateBanners?.[selectedBannerTemplate] ||
    (selectedBannerTemplate === 'masonry' ? validMasonryBanner : undefined) ||
    (gallery.templateId === selectedBannerTemplate ? gallery.coverImage : undefined) ||
    gallery.coverImage ||
    galleryPhotos[0]?.url ||
    gallery.media[0]?.url ||
    getInitialGalleryCover(selectedBannerTemplate);

  const currentCinematicVideo =
    (gallery.templateBanners?.['cinematic'] && isVideoMedia(gallery.templateBanners?.['cinematic']))
      ? gallery.templateBanners?.['cinematic']
      : (isVideoMedia(gallery.coverImage)
          ? gallery.coverImage
          : videos[0]?.url);

  const formattedDate = formatHeroShootDate(gallery.eventDate);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner Management Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
                Hero Banner Image Selector
              </h4>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Select which photo from this gallery displays in the hero banner for the{' '}
              <span className="text-amber-600 dark:text-amber-400 font-semibold capitalize">
                {selectedBannerTemplate}
              </span>{' '}
              template.
            </p>
          </div>

          {/* Quick Template Switcher Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'editorial', label: 'Editorial' },
                { id: 'masonry', label: 'Masonry' },
                { id: 'cinematic', label: 'Cinematic' },
                { id: 'minimal', label: 'Minimal' },
              ] as const
            ).map((tpl) => {
              const isAllowed = planQuota.isTemplateAllowed(tpl.id);
              const isCurTemplate = selectedBannerTemplate === tpl.id;
              const isGalleryActive = gallery.templateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => {
                    if (!isAllowed) {
                      setUpgradeModal({
                        isOpen: true,
                        errorCode: 'PREMIUM_TEMPLATE_LOCKED',
                        errorMessage: `The ${tpl.label} layout is a premium template not included in your current studio plan (${planQuota.planName}). Upgrade your plan to unlock and customize this layout.`,
                        lockedFeature: `${tpl.label} Layout`,
                      });
                      return;
                    }
                    setSelectedBannerTemplate(tpl.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isCurTemplate
                      ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                      : !isAllowed
                      ? 'text-neutral-500 hover:text-amber-500 hover:bg-amber-500/10'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>{tpl.label}</span>
                  {!isAllowed && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-600 dark:text-amber-400 font-bold text-[9px] uppercase tracking-wider flex items-center gap-0.5 border border-amber-400/30">
                      <Lock className="w-2.5 h-2.5" /> PRO
                    </span>
                  )}
                  {isGalleryActive && isAllowed && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCurTemplate ? 'bg-neutral-950' : 'bg-amber-400'
                      }`}
                      title="Active Gallery Template"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Active Banner Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Banner Preview Screen */}
          <div className="lg:col-span-7 relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-md p-2 flex flex-col justify-between group">
            {isCinematic ? (
              <div className="w-full h-full bg-[#050507] rounded-xl p-3 sm:p-4 flex flex-col justify-center items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/15 rounded-xl blur-xl pointer-events-none" />
                <div className="relative w-full aspect-[2.39/1] max-h-[220px] rounded-lg overflow-hidden shadow-2xl shadow-black bg-black border border-amber-500/35 ring-1 ring-amber-400/20 group">
                  {currentCinematicVideo ? (
                    <video
                      src={currentCinematicVideo}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <img
                      src={currentSingleBanner}
                      alt=""
                      loading="lazy"
                      onError={(e) => handleCoverImageError(e, getInitialGalleryCover('cinematic'))}
                      className="w-full h-full object-cover object-center"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-amber-500/10 pointer-events-none" />
                </div>
                <div className="text-center space-y-0.5 pt-2">
                  <h5 className="text-xs sm:text-sm md:text-base font-serif tracking-widest text-white uppercase drop-shadow-md truncate max-w-md">
                    {gallery.title}
                  </h5>
                  <div className="flex items-center justify-center gap-2 text-amber-400/80">
                    <span className="h-px w-6 bg-amber-800/60" />
                    <span className="text-[8px] font-mono tracking-[0.25em] uppercase text-amber-400 font-semibold">
                      // {formattedDate} //
                    </span>
                    <span className="h-px w-6 bg-amber-800/60" />
                  </div>
                </div>
              </div>
            ) : isMasonry ? (
              <div className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center text-center p-4 bg-[#09110E]">
                <img
                  src={currentSingleBanner}
                  alt=""
                  loading="lazy"
                  onError={(e) => handleCoverImageError(e, getInitialGalleryCover('masonry'))}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/55 pointer-events-none" />
                <div className="absolute inset-0 bg-emerald-950/20 mix-blend-multiply pointer-events-none" />
                <div className="relative z-10 px-4 py-2.5 rounded-2xl bg-[#09110E]/85 backdrop-blur-md border border-emerald-500/30 text-center shadow-lg space-y-1">
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <span className="h-px w-6 bg-emerald-500/60" />
                    <span className="text-[8px] font-mono tracking-[0.25em] uppercase text-emerald-400 font-semibold">
                      // {formattedDate} //
                    </span>
                    <span className="h-px w-6 bg-emerald-500/60" />
                  </div>
                  <h5 className="text-base sm:text-lg font-serif italic text-white leading-tight drop-shadow-md truncate max-w-md">
                    {gallery.title}
                  </h5>
                  <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-emerald-400/80 block">
                    Atelier Masonry Edition
                  </span>
                </div>
              </div>
            ) : isEditorial ? (
              <div className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center text-center p-4">
                <img
                  src={currentSingleBanner}
                  alt=""
                  loading="lazy"
                  onError={(e) => handleCoverImageError(e, getInitialGalleryCover('editorial'))}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60 pointer-events-none" />
                <div className="relative z-10 space-y-0.5 text-white">
                  <span className="text-[8px] font-mono tracking-[0.25em] uppercase text-amber-200/90 block">
                    SHOOT DATE • {formattedDate}
                  </span>
                  <h5 className="text-lg sm:text-xl font-serif font-light tracking-tight text-white leading-tight drop-shadow-md truncate max-w-md">
                    {gallery.title}
                  </h5>
                  <span className="font-script text-base text-amber-200/90 block">Atelier Series</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full rounded-xl overflow-hidden bg-[#F8F8F6] text-neutral-900 p-4 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-7 h-full flex items-center justify-center">
                  <div className="p-1.5 bg-white shadow-lg border border-neutral-200 w-full h-full max-h-[190px] relative overflow-hidden">
                    <img
                      src={currentSingleBanner}
                      alt=""
                      loading="lazy"
                      onError={(e) => handleCoverImageError(e, getInitialGalleryCover('minimal'))}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="col-span-5 text-left space-y-1">
                  <span className="text-[8px] font-mono tracking-[0.2em] uppercase text-neutral-400 block">EXHIBITION MONOGRAPH</span>
                  <h5 className="text-xs sm:text-sm font-serif font-light text-neutral-900 line-clamp-2 leading-tight">
                    {gallery.title}
                  </h5>
                  <span className="text-[8px] font-mono tracking-[0.2em] uppercase text-neutral-500 block">— {formattedDate} —</span>
                </div>
              </div>
            )}
          </div>

          {/* Banner Info & Action Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Selected Template
              </span>
              <h5 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
                {activeTemplateInfo?.name}
              </h5>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {activeTemplateInfo?.tagline}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {gallery.templateId !== selectedBannerTemplate ? (
                !planQuota.isTemplateAllowed(selectedBannerTemplate) ? (
                  <button
                    type="button"
                    onClick={() =>
                      setUpgradeModal({
                        isOpen: true,
                        errorCode: 'PREMIUM_TEMPLATE_LOCKED',
                        errorMessage: `The ${activeTemplateInfo?.name || selectedBannerTemplate} layout is a premium template not included in your current studio plan (${planQuota.planName}). Upgrade your plan to apply this layout.`,
                        lockedFeature: `${activeTemplateInfo?.name || selectedBannerTemplate} Layout`,
                      })
                    }
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/15 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Upgrade to Unlock {activeTemplateInfo?.name}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isApplying}
                    onClick={() => handleApplyLayout(selectedBannerTemplate)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-950" />
                        <span>Applying {activeTemplateInfo?.name}...</span>
                      </>
                    ) : (
                      <span>Apply {activeTemplateInfo?.name} as Active Layout</span>
                    )}
                  </button>
                )
              ) : (
                <div className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Currently Active Theme</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick In-line Photo Picker Grid for the Active Banner */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
          {(() => {
            const availableMedia =
              isCinematic && videos.length > 0
                ? [...videos, ...galleryPhotos]
                : (galleryPhotos.length > 0 ? galleryPhotos : gallery.media);

            return (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase font-mono tracking-wider">
                    {isCinematic && videos.length > 0
                      ? 'Choose 4K Video Reel or Photo for Cinematic Hero:'
                      : `Assign Photo to ${selectedBannerTemplate.toUpperCase()} Hero Banner:`}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {availableMedia.length} {availableMedia.length === 1 ? 'item' : 'items'} available
                  </span>
                </div>

                <div
                  data-lenis-prevent="true"
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-72 sm:max-h-80 overflow-y-auto overscroll-contain touch-pan-y pr-2 custom-scrollbar"
                >
                  {availableMedia.map((item) => {
                    const isSelectedBanner = isCinematic
                      ? (currentCinematicVideo ? currentCinematicVideo === item.url : currentSingleBanner === item.url)
                      : currentSingleBanner === item.url;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (!planQuota.isTemplateAllowed(selectedBannerTemplate)) {
                            setUpgradeModal({
                              isOpen: true,
                              errorCode: 'PREMIUM_TEMPLATE_LOCKED',
                              errorMessage: `The ${selectedBannerTemplate} layout is not included in your studio plan (${planQuota.planName}). Upgrade your plan to customize its hero assets.`,
                              lockedFeature: `${selectedBannerTemplate} Layout`,
                            });
                            return;
                          }
                          onSetTemplateBanner(selectedBannerTemplate, item.url, item.id);
                        }}
                        className={`group relative aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all cursor-pointer text-left ${
                          isSelectedBanner
                            ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 scale-[1.03]'
                            : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-600 hover:scale-[1.02]'
                        }`}
                        title={`Select "${item.title}"`}
                      >
                        <img
                          src={item.url || item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                        />

                        {item.type === 'video' && (
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono text-amber-400 flex items-center gap-1 font-bold">
                            <Film className="w-2.5 h-2.5" /> REEL
                          </div>
                        )}

                        {isSelectedBanner && (
                          <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-[1px] flex flex-col justify-between p-1.5 pointer-events-none">
                            <span className="self-end p-1 rounded-full bg-amber-400 text-neutral-950 shadow-md">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-black/80 text-amber-300 text-[8px] font-mono font-bold uppercase truncate">
                              Banner
                            </span>
                          </div>
                        )}

                        {!isSelectedBanner && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
                            <span className="px-2 py-1 rounded-lg bg-amber-400 text-neutral-950 text-[10px] font-bold shadow-md">
                              Set as Banner
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Section: All 4 Signature Templates */}
      <div className="space-y-4">
        <h4 className="text-lg font-serif font-bold text-neutral-900 dark:text-white">
          All Available Gallery Themes
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
          {GALLERY_TEMPLATES.map((tpl) => {
            const isSelected = gallery.templateId === tpl.id;
            const isAllowed = planQuota.isTemplateAllowed(tpl.id);
            const fallbackImage = getInitialGalleryCover(tpl.id) || tpl.previewImage;

            // 1. Check if a hero banner is explicitly assigned to this template
            const explicitTemplateBanner =
              gallery.templateBanners?.[tpl.id] ||
              (tpl.id === 'masonry' && gallery.masonryBannerImages?.[0] !== getInitialGalleryCover('masonry')
                ? gallery.masonryBannerImages?.[0]
                : undefined);

            // 2. Check if active template banner is assigned via cover image
            const activeTemplateCover =
              gallery.templateId === tpl.id && gallery.coverImage && gallery.coverImage !== getInitialGalleryCover(tpl.id)
                ? gallery.coverImage
                : undefined;

            // 3. Check if general gallery cover or media can serve as assigned hero banner
            const generalCover =
              gallery.coverImage && gallery.coverImage !== getInitialGalleryCover(gallery.templateId)
                ? gallery.coverImage
                : undefined;

            const firstGalleryPhoto = galleryPhotos[0]?.url || gallery.media[0]?.url;

            // Priority: explicit template banner -> active template cover -> general gallery banner -> fallback image
            const currentHeroBanner =
              explicitTemplateBanner ||
              activeTemplateCover ||
              generalCover ||
              firstGalleryPhoto ||
              fallbackImage;

            const hasCustomBanner = Boolean(
              currentHeroBanner &&
              currentHeroBanner !== fallbackImage &&
              currentHeroBanner !== tpl.previewImage
            );

            const isBannerVideo = isVideoMedia(currentHeroBanner);

            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedBannerTemplate(tpl.id)}
                className={`group rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between card-lift fade-up cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/5 dark:bg-neutral-900 border-amber-500 ring-1 ring-amber-500/50 shadow-xl shadow-amber-500/5'
                    : selectedBannerTemplate === tpl.id
                    ? 'bg-neutral-50 dark:bg-neutral-900/70 border-neutral-300 dark:border-neutral-700 shadow-md'
                    : 'bg-white dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden mb-4 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/80">
                    {isBannerVideo ? (
                      <video
                        src={currentHeroBanner}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <img
                        src={currentHeroBanner}
                        alt={tpl.name}
                        loading="lazy"
                        onError={(e) => handleCoverImageError(e, fallbackImage)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      {!isAllowed && (
                        <div className="px-2.5 py-1 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <Lock className="w-3 h-3 stroke-[2.5]" />
                          <span>PRO</span>
                        </div>
                      )}
                      <div className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-bold uppercase text-amber-400 shadow-md">
                        {tpl.badge}
                      </div>
                    </div>
                    {hasCustomBanner && (
                      <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-mono text-amber-300 border border-amber-400/20 shadow-md">
                        Hero Banner Assigned
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-serif font-bold text-neutral-900 dark:text-white">
                        {tpl.name}
                      </h4>
                      {!isAllowed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Upgrade Required
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-mono">
                        Active Template
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium mb-2">
                    {tpl.tagline}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                    {tpl.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {tpl.characteristics.map((char, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 font-mono"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isAllowed ? (
                    <button
                      type="button"
                      onClick={() =>
                        setUpgradeModal({
                          isOpen: true,
                          errorCode: 'PREMIUM_TEMPLATE_LOCKED',
                          errorMessage: `The ${tpl.name} layout is a premium template not included in your current studio plan (${planQuota.planName}). Upgrade your plan to unlock and activate this layout for your client galleries.`,
                          lockedFeature: `${tpl.name} Layout`,
                        })
                      }
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 shadow-md shadow-amber-500/15"
                    >
                      <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Unlock {tpl.name}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isApplying || isSelected}
                      onClick={async () => {
                        setSelectedBannerTemplate(tpl.id);
                        await handleApplyLayout(tpl.id);
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-500/10 cursor-default'
                          : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isApplying && (applyingTemplateId === tpl.id || (!applyingTemplateId && !isSelected)) ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : null}
                      <span>
                        {isSelected
                          ? 'Currently Active'
                          : isApplying && applyingTemplateId === tpl.id
                          ? `Applying...`
                          : `Apply ${tpl.name}`}
                      </span>
                    </button>
                  )}

                  <a
                    href={`https://exshare.ai/gallery/${encodeURIComponent(gallery.slug || gallery.id)}?previewTemplate=${encodeURIComponent(tpl.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    title={`Preview ${tpl.name} layout live on https://exshare.ai`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Studio Plan Upgrade Modal for Locked Templates */}
      <PlanUpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={() => setUpgradeModal({ isOpen: false })}
        errorCode={upgradeModal.errorCode}
        errorMessage={upgradeModal.errorMessage}
        lockedFeature={upgradeModal.lockedFeature}
      />
    </div>
  );
};
