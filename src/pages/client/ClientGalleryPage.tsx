import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import type { GalleryTemplateId, Gallery } from '../../types';
import { GalleryTemplateRenderer } from '../../components/gallery/templates';
import { LightboxModal } from '../../components/gallery/LightboxModal';
import { SlideshowModal } from '../../components/gallery/SlideshowModal';
import { MusicPickerModal } from '../../components/gallery/MusicPickerModal';
import { CURATED_TRACKS, type Track } from '../../services/musicService';
import { SelectionBar } from '../../components/gallery/SelectionBar';
import { MediaShareModal } from '../../components/gallery/MediaShareModal';
import { StoryVideoCreatorModal } from '../../components/gallery/StoryVideoCreatorModal';
import { ClientGalleryNavbar } from '../../components/gallery/ClientGalleryNavbar';
import { GalleryContactModal } from '../../components/gallery/GalleryContactModal';
import { SmoothScrollProvider, useLenisScroll } from '../../components/common/SmoothScroll';
import { Lock, Clock, AlertTriangle, Mail, Loader2, Archive, RotateCcw, Sparkles } from 'lucide-react';
import { isGalleryExpired, getExpiryStatus } from '../../utils/expiryUtils';
import { normalizeServerGallery } from '../../utils/galleryNormalizer';
import {
  usePublicGallery,
  useVerifyGalleryPin,
  useTrackPublicGalleryView,
} from '@/hooks/useAtelierQueries';
import { ViewerAuthModal } from '../../components/gallery/ViewerAuthModal';
import { useGalleryViewerLikes } from '../../hooks/useGalleryViewerLikes';
import { GetGalleryDownloadZipUrl, GetPublicGalleryApi } from '@/service/galleries/PublicGalleryApi';
import { GalleryDetailSkeleton } from '@/components/common/LoadingSkeleton';
import { useGallerySeo } from '@/hooks/useSeo';
import type { GalleryGridDesign } from '../../components/gallery/UniversalPhotoGrid';
import { getInitialGalleryCover, handleCoverImageError } from '@/utils/coverImageUtils';
import {
  downloadSingleImage,
  downloadMultipleAsZip,
  getGalleryWatermarkOptions,
  triggerAttachmentDownload,
} from '@/utils/downloadUtils';
import { DownloadOptionsModal } from '@/components/gallery/DownloadOptionsModal';

const ClientGalleryContent: React.FC = () => {
  const { galleryId } = useParams<{ galleryId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { photographer, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  // TanStack Query: Fetch live public gallery directly from Django REST Framework
  const {
    data: apiGallery,
    isLoading: isGalleryLoading,
    isError: isGalleryError,
    error: galleryError,
  } = usePublicGallery(galleryId || '');

  const { mutateAsync: verifyPinMutation, isPending: isVerifyingPin } = useVerifyGalleryPin();
  const { mutate: trackViewMutation } = useTrackPublicGalleryView();

  // ── Viewing User Likes & Email OTP Auth ──
  const {
    viewer: _viewer,
    viewerEmail,
    isViewerAuthenticated: _isViewerAuthenticated,
    likedMediaIds,
    favoritesCount,
    favoritingMediaIds,
    isBulkFavoriting,
    isAuthModalOpen,
    setIsAuthModalOpen,
    handleToggleFavorite,
    handleBulkFavorite,
    handleAuthSuccess,
    handleLogoutViewer,
  } = useGalleryViewerLikes(galleryId || '', (apiGallery as any)?.media || []);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // User's active grid layout design across all templates with localStorage persistence
  const [gridDesign, setGridDesign] = useState<GalleryGridDesign>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ex_share_gallery_grid_design') as GalleryGridDesign | null;
        if (saved && ['default', 'masonry', 'collage', 'grid', 'large'].includes(saved)) {
          return saved;
        }
      } catch {
        // Storage access unavailable or restricted
      }
    }
    return 'default';
  });

  const handleSelectGridDesign = (design: GalleryGridDesign) => {
    setGridDesign(design);
    try {
      localStorage.setItem('ex_share_gallery_grid_design', design);
    } catch {
      // Storage access unavailable or restricted
    }
  };

  // Normalize server gallery with resilient demo fallback & viewer likes
  const gallery = useMemo<Gallery | null>(() => {
    // If backend reported studio plan expired, DO NOT fallback to demo data
    const isPlanExpiredError =
      (galleryError as any)?.data?.code === 'studio_plan_expired' ||
      (galleryError as any)?.data?.code === 'STUDIO_PLAN_EXPIRED' ||
      (galleryError as any)?.response?.data?.code === 'studio_plan_expired' ||
      (galleryError as any)?.response?.data?.code === 'STUDIO_PLAN_EXPIRED' ||
      (galleryError as any)?.data?.plan_expired === true ||
      (galleryError as any)?.response?.data?.plan_expired === true ||
      ((galleryError as any)?.status === 403 &&
        String((galleryError as any)?.data?.detail || '').toLowerCase().includes('plan')) ||
      ((galleryError as any)?.response?.status === 403 &&
        String((galleryError as any)?.response?.data?.detail || '').toLowerCase().includes('plan'));
    if (isPlanExpiredError) return null;

    let base: Gallery | null = null;
    if (apiGallery) {
      base = normalizeServerGallery(apiGallery);
    }
    if (!base) return null;

    return {
      ...base,
      favoritesCount,
      media: base.media.map((m) => ({
        ...m,
        isFavorite: likedMediaIds.has(m.id),
      })),
    };
  }, [apiGallery, likedMediaIds, favoritesCount, galleryError]);

  // Track gallery view once on mount when gallery is loaded
  const hasTrackedViewRef = useRef(false);
  useEffect(() => {
    if (gallery && !hasTrackedViewRef.current) {
      hasTrackedViewRef.current = true;
      trackViewMutation({
        slugOrId: gallery.slug || gallery.id,
        device: window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      });
    }
  }, [gallery, trackViewMutation]);

  // Dynamic SEO & OpenGraph Social Graph: updates page title and hero banner image dynamically
  const activePhotoId =
    searchParams.get('photo') ||
    (lightboxIndex !== null && gallery?.media[lightboxIndex]
      ? gallery.media[lightboxIndex].id
      : undefined);

  useGallerySeo(gallery, activePhotoId, photographer?.studioName || photographer?.fullName);

  // Preview Template Security: Strictly restricted to authenticated dashboard studio users
  const rawQueryTemplate = searchParams.get('previewTemplate') as GalleryTemplateId | null;
  const isAuthorizedToPreview = Boolean(isAuthenticated);

  // If a non-authenticated visitor attempts to use previewTemplate, strip it from the URL
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && searchParams.has('previewTemplate')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('previewTemplate');
      setSearchParams(nextParams, { replace: true });
    }
  }, [isAuthLoading, isAuthenticated, searchParams, setSearchParams]);

  // Active template: ONLY an authenticated studio user can preview layout overrides
  const activeTemplate: GalleryTemplateId =
    isAuthorizedToPreview && rawQueryTemplate
      ? rawQueryTemplate
      : gallery?.templateId || 'editorial';

  const handleExitPreview = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('previewTemplate');
    setSearchParams(nextParams, { replace: true });
  };

  // Multi-Selection state
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isShareSelectedOpen, setIsShareSelectedOpen] = useState(false);

  // Studio Direct Inquiries Contact Modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Story & Reel Video Creator state
  const [isStoryVideoModalOpen, setIsStoryVideoModalOpen] = useState(false);
  const [storyVideoInitialItems, setStoryVideoInitialItems] = useState<any[]>([]);

  const handleOpenStoryVideoCreator = (customItems?: any[]) => {
    if (customItems && customItems.length > 0) {
      setStoryVideoInitialItems(customItems);
    } else if (selectedMediaIds.size > 0 && gallery?.media) {
      setStoryVideoInitialItems(gallery.media.filter((m) => selectedMediaIds.has(m.id)));
    } else if (gallery?.media) {
      const favs = gallery.media.filter((m) => m.isFavorite);
      setStoryVideoInitialItems(favs.length >= 3 ? favs.slice(0, 12) : gallery.media.slice(0, 8));
    }
    setIsStoryVideoModalOpen(true);
  };

  // Slideshow & Soundtrack state
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [slideshowStartIndex, setSlideshowStartIndex] = useState(0);
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(CURATED_TRACKS[0]);

  // PIN unlock state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinCooldown, setPinCooldown] = useState(0);

  useEffect(() => {
    if (pinCooldown <= 0) return;
    const interval = setInterval(() => {
      setPinCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [pinCooldown]);

  useEffect(() => {
    const handleThrottle = (e: Event) => {
      const customEvent = e as CustomEvent<{ seconds?: number; url?: string }>;
      if (customEvent.detail?.url?.includes('verify-pin') || customEvent.detail?.url?.includes('verify-password')) {
        setPinCooldown(customEvent.detail.seconds || 30);
      }
    };
    window.addEventListener('api-throttled', handleThrottle);
    return () => window.removeEventListener('api-throttled', handleThrottle);
  }, []);

  // Top navbar scroll tracking: only display navbar when user starts to scroll down
  const [isScrolled, setIsScrolled] = useState(false);
  useLenisScroll((scroll) => {
    setIsScrolled(scroll > 25);
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bulk ZIP download states
  const [isPreparingZip, setIsPreparingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Selected ZIP download state
  const [isPreparingSelectedZip, setIsPreparingSelectedZip] = useState(false);
  const [selectedZipProgress, setSelectedZipProgress] = useState(0);

  // Format Selection (RAW vs JPEG) Download Options Modal state
  const [downloadModalConfig, setDownloadModalConfig] = useState<{
    isOpen: boolean;
    item?: any;
    items?: any[];
    totalCount?: number;
    isAll?: boolean;
    title?: string;
  }>({ isOpen: false });

  if (isGalleryLoading || (Boolean(rawQueryTemplate) && isAuthLoading)) {
    return (
      <div className="min-h-screen bg-[#07080b] text-white pt-12">
        <GalleryDetailSkeleton />
      </div>
    );
  }

  // 1. Check if the Host Studio's Subscription is Expired (Locks entire public gallery & shared link)
  const isStudioPlanExpired = Boolean(
    (apiGallery as any)?.is_studio_plan_expired ||
    (apiGallery as any)?.studio_plan_status === 'expired' ||
    (gallery as any)?.is_studio_plan_expired ||
    (galleryError as any)?.data?.code === 'studio_plan_expired' ||
    (galleryError as any)?.data?.code === 'STUDIO_PLAN_EXPIRED' ||
    (galleryError as any)?.response?.data?.code === 'studio_plan_expired' ||
    (galleryError as any)?.response?.data?.code === 'STUDIO_PLAN_EXPIRED' ||
    (galleryError as any)?.data?.plan_expired === true ||
    (galleryError as any)?.response?.data?.plan_expired === true ||
    ((galleryError as any)?.status === 403 &&
      String((galleryError as any)?.data?.detail || (galleryError as any)?.response?.data?.detail || '').toLowerCase().includes('plan')) ||
    ((galleryError as any)?.response?.status === 403 &&
      String((galleryError as any)?.response?.data?.detail || '').toLowerCase().includes('plan'))
  );

  if (isStudioPlanExpired) {
    const errorData = (galleryError as any)?.data || (galleryError as any)?.response?.data;
    const galleryTitle = gallery?.title || errorData?.title || 'Private Collection';
    const clientName = gallery?.clientName || errorData?.client_name || '';
    const studioName =
      photographer?.studioName ||
      (apiGallery as any)?.studio_name ||
      errorData?.studio_name ||
      'Studio';
    const studioEmail = photographer?.email || (apiGallery as any)?.studio_email || errorData?.studio_email || '';

    return (
      <div className="min-h-screen bg-[#07080b] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-rose-500 selection:text-white">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-lg w-full rounded-3xl bg-neutral-900/90 border border-neutral-800/90 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10">
            <Lock className="w-8 h-8 stroke-[1.8]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono uppercase tracking-widest font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Studio Plan Expired</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              {galleryTitle}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              This gallery and its shared link are temporarily offline because the host studio&apos;s EX SHARE membership has lapsed. All photographs remain securely preserved in cloud vaults.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 text-left space-y-2.5 text-xs font-mono text-neutral-400">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Collection:</span>
              <span className="text-white font-semibold truncate max-w-[200px]">{galleryTitle}</span>
            </div>
            {clientName && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Client:</span>
                <span className="text-neutral-200">{clientName}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Host Studio:</span>
              <span className="text-neutral-200">{studioName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Access Status:</span>
              <span className="text-rose-400 font-semibold uppercase">Locked / Suspended</span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {isAuthenticated ? (
              <Link
                to="/dashboard/settings?tab=billing"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Renew Membership to Reactivate Gallery</span>
              </Link>
            ) : studioEmail ? (
              <a
                href={`mailto:${studioEmail}?subject=${encodeURIComponent(
                  `Inquiry: Locked Gallery "${galleryTitle}"`
                )}&body=${encodeURIComponent(
                  `Hello ${studioName},\n\nI was attempting to view our private gallery "${galleryTitle}", but the link indicates the studio membership has expired. Could you please reactivate or renew access?\n\nThank you!`
                )}`}
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Mail className="w-4 h-4 stroke-[2.5]" />
                <span>Contact Studio to Reactivate</span>
              </a>
            ) : (
              <p className="text-xs text-neutral-400">
                Please contact your photographer or studio directly to request reactivation of this link.
              </p>
            )}

            {isAuthenticated && (
              <Link
                to="/dashboard/gallery"
                className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors pt-2"
              >
                <span>Go to Studio Dashboard</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 1. Check if Gallery is Archived (either returned with status='archived' or blocked by backend)
  const isArchived =
    gallery?.status === 'archived' ||
    (galleryError as any)?.data?.status === 'archived' ||
    (galleryError as any)?.response?.data?.status === 'archived' ||
    (galleryError as any)?.data?.code === 'gallery_archived' ||
    (galleryError as any)?.response?.data?.code === 'gallery_archived' ||
    (galleryError as any)?.data?.code === 'GALLERY_ARCHIVED' ||
    (galleryError as any)?.response?.data?.code === 'GALLERY_ARCHIVED';

  if (isArchived) {
    const errorData = (galleryError as any)?.data || (galleryError as any)?.response?.data;
    const galleryTitle = gallery?.title || errorData?.title || 'Private Collection';
    const clientName = gallery?.clientName || errorData?.client_name || '';

    return (
      <div className="min-h-screen bg-[#07080b] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber-400 selection:text-black">
        {/* Ambient blurred glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-lg w-full rounded-3xl bg-neutral-900/90 border border-neutral-800/90 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Archive className="w-8 h-8 stroke-[1.8]" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
              Collection Archived
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              {galleryTitle}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              This gallery has been moved to Archive by the studio and is currently inactive. Archived collections are automatically purged after 15 days unless restored.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 text-left space-y-2.5 text-xs font-mono text-neutral-400">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Collection:</span>
              <span className="text-white font-semibold">{galleryTitle}</span>
            </div>
            {clientName && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Client:</span>
                <span className="text-neutral-200">{clientName}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Access Link:</span>
              <span className="text-rose-400 font-semibold uppercase">Disabled / Archived</span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {photographer?.email ? (
              <a
                href={`mailto:${photographer.email}?subject=${encodeURIComponent(
                  `Inquiry: Archived Gallery "${galleryTitle}"`
                )}&body=${encodeURIComponent(
                  `Hello,\n\nI was attempting to access our gallery "${galleryTitle}", but the link indicates it is currently archived. Could you please help reactivate access for us?\n\nThank you!`
                )}`}
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Mail className="w-4 h-4 stroke-[2.5]" />
                <span>Contact Studio / Photographer</span>
              </a>
            ) : (
              <p className="text-xs text-neutral-400">
                Please contact your photographer or studio directly to request reactivation of this link.
              </p>
            )}

            {isAuthenticated && (
              <Link
                to="/dashboard/gallery"
                className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors pt-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Go to Studio Galleries to Restore</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isBackendExpiredError =
    (galleryError as any)?.response?.status === 410 ||
    (galleryError as any)?.response?.data?.is_expired === true ||
    (galleryError as any)?.response?.data?.code === 'gallery_expired';

  if (isBackendExpiredError && !gallery) {
    const errorData = (galleryError as any)?.response?.data;
    return (
      <div className="min-h-screen bg-[#07080b] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber-400 selection:text-black">
        <div className="relative z-10 max-w-lg w-full rounded-3xl bg-neutral-900/80 border border-neutral-800/90 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-inner">
            <Clock className="w-8 h-8 stroke-[1.8]" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
              Access Window Closed
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              {errorData?.title || 'Private Collection'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              The client access period for this private collection has expired.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {photographer?.email || errorData?.studio_email || (apiGallery as any)?.studio_email ? (
              <a
                href={`mailto:${photographer?.email || errorData?.studio_email || (apiGallery as any)?.studio_email}?subject=${encodeURIComponent(
                  `Request Extended Access: ${errorData?.title || 'Gallery'}`
                )}&body=${encodeURIComponent(
                  `Hello,\n\nOur client viewing link has expired. Could you please extend or renew access to our gallery?\n\nThank you!`
                )}`}
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Mail className="w-4 h-4 stroke-[2.5]" />
                <span>Request Extended Access</span>
              </a>
            ) : (
              <p className="text-xs text-neutral-400">
                Please contact your photographer or studio directly to request extended access.
              </p>
            )}

            <p className="text-[11px] text-neutral-500 font-mono">
              Contact your photographer to renew access to your private photographs and film stories.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isGalleryError || !gallery) {
    return (
      <div className="min-h-screen bg-[#07080b] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber-400 selection:text-black">
        <div className="relative z-10 max-w-lg w-full rounded-3xl bg-neutral-900/90 border border-neutral-800/90 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10">
            <AlertTriangle className="w-8 h-8 stroke-[1.8]" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase font-mono tracking-widest text-rose-400 font-bold block">
              Link Inactive
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Collection Unavailable
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              This gallery link does not exist or has been permanently removed by the photographer.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to="/"
              className="w-full py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
            >
              <span>Return to EX SHARE Home</span>
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard/gallery"
                className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors pt-1"
              >
                <span>Return to Studio Galleries</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Check gallery access validity window directly from backend
  const isExpired = Boolean(gallery.isExpired || (gallery.expiresAt ? isGalleryExpired(gallery.expiresAt) : false));
  const expiryStatus = getExpiryStatus(gallery.expiresAt);

  // If the time window has passed, block client access with an expired view
  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#07080b] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber-400 selection:text-black">
        {/* Ambient background with blurred cover */}
        <div className="absolute inset-0 z-0">
          <img
            src={gallery.coverImage || getInitialGalleryCover(gallery.templateId)}
            alt=""
            loading="lazy"
            onError={(e) => handleCoverImageError(e, getInitialGalleryCover(gallery.templateId))}
            className="w-full h-full object-cover object-center opacity-15 filter blur-3xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/80 to-[#07080b]" />
        </div>

        {/* Central Expired Notice Card */}
        <div className="relative z-10 max-w-lg w-full rounded-3xl bg-neutral-900/80 border border-neutral-800/90 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-inner">
            <Clock className="w-8 h-8 stroke-[1.8]" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
              Access Window Closed
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              {gallery.title}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              The client access period for this private collection closed on{' '}
              <span className="text-white font-medium">{expiryStatus.humanFormatted}</span>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-left space-y-2 text-xs font-mono text-neutral-400">
            <div className="flex items-center justify-between">
              <span>Collection:</span>
              <span className="text-white font-bold truncate max-w-[200px]">{gallery.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Client:</span>
              <span className="text-white">{gallery.clientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Studio:</span>
              <span className="text-amber-400">{photographer.studioName || 'Atelier Studio'}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href={`mailto:${photographer.email}?subject=${encodeURIComponent(
                `Request Extended Access: ${gallery.title}`
              )}&body=${encodeURIComponent(
                `Hello ${photographer.fullName || photographer.studioName},\n\nOur client viewing link for "${gallery.title}" has expired. Could you please extend or renew access to our gallery?\n\nClient Name: ${gallery.clientName}\n\nThank you!`
              )}`}
              className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Mail className="w-4 h-4 stroke-[2.5]" />
              <span>Request Extended Access</span>
            </a>

            <p className="text-[11px] text-neutral-500 font-mono">
              Contact your photographer to renew access to your private photographs and film stories.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle PIN unlock
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim() || isVerifyingPin || pinCooldown > 0) return;

    try {
      const res = await verifyPinMutation({
        slugOrId: gallery.slug || gallery.id,
        pin: pinInput.trim(),
      });
      if (res) {
        setIsUnlocked(true);
        setPinError(false);
        showToast('Unlocked', 'Access granted to client collection.', 'success');
      }
    } catch (err: any) {
      if (err?.response?.status === 429) {
        const match = err?.response?.data?.detail?.match(/(\d+)\s*seconds?/i);
        const retrySec = match ? parseInt(match[1], 10) : 30;
        setPinCooldown(retrySec);
        return;
      }
      // Local fallback check if backend password matches
      if (gallery.password && pinInput.trim() === gallery.password) {
        setIsUnlocked(true);
        setPinError(false);
        showToast('Unlocked', 'Access granted to client collection.', 'success');
      } else {
        setPinError(true);
        showToast('Incorrect PIN', 'Please enter the access code provided by your photographer.', 'error');
      }
    }
  };

  const isLocked = gallery.isPasswordProtected && !isUnlocked;

  // Toggle multi-select for individual item
  const handleToggleSelectMedia = (mediaId: string) => {
    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) {
        next.delete(mediaId);
      } else {
        next.add(mediaId);
      }
      return next;
    });
  };

  // Select all items
  const handleSelectAll = () => {
    setSelectedMediaIds(new Set(gallery.media.map((m) => m.id)));
    showToast('All Selected', `Selected all ${gallery.media.length} photos.`, 'info');
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedMediaIds(new Set());
  };

  // Resolve default photographer identity for watermarking and attribution (strictly photographer's name by default)
  const defaultPhotographerName =
    gallery?.photographerName ||
    photographer?.fullName ||
    (photographer as any)?.name ||
    gallery?.studioName ||
    photographer?.studioName ||
    'PHOTOGRAPHER';

  const defaultWatermarkText =
    gallery?.watermark_text ||
    (defaultPhotographerName.startsWith('©') ? defaultPhotographerName : `© ${defaultPhotographerName}`);

  // Format Selection (RAW vs JPEG) Download Options Modal state (state initialized at component top level)

  // Handle "Download All" action - open format selector
  const handleDownloadAll = () => {
    if (!gallery || !gallery.media || gallery.media.length === 0) {
      showToast('No Media', 'There are no photos to download in this gallery.', 'warning');
      return;
    }
    const totalCount = gallery.totalMediaCount || gallery.media.length;
    setDownloadModalConfig({
      isOpen: true,
      item: undefined,
      items: gallery.media,
      totalCount,
      isAll: true,
      title: `${gallery.title} (All Photos)`,
    });
  };

  // Handle direct single photo download from tile button - open format selector
  const handleDownloadSinglePhoto = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setDownloadModalConfig({
      isOpen: true,
      item,
      items: undefined,
      totalCount: 1,
      isAll: false,
      title: item.title || `${gallery?.slug || 'gallery'}-photo`,
    });
  };

  // Handle "Download Selected" action - open format selector
  const handleDownloadSelected = () => {
    if (!gallery || selectedMediaIds.size === 0) return;
    const selectedList = gallery.media.filter((m) => selectedMediaIds.has(m.id));

    if (selectedMediaIds.size === 1 && selectedList.length === 1) {
      setDownloadModalConfig({
        isOpen: true,
        item: selectedList[0],
        items: undefined,
        totalCount: 1,
        isAll: false,
        title: selectedList[0].title || `${gallery?.slug || 'gallery'}-photo`,
      });
      return;
    }

    setDownloadModalConfig({
      isOpen: true,
      item: undefined,
      items: selectedList,
      totalCount: selectedMediaIds.size,
      isAll: false,
      title: `${selectedMediaIds.size} Selected Photographs`,
    });
  };

  // Execute download after user chooses RAW vs JPEG & Watermark in modal
  const handleExecuteDownloadOptions = async ({
    format,
    withWatermark,
    onProgress,
  }: {
    format: 'original' | 'web';
    withWatermark: boolean;
    onProgress?: (percent: number, statusText?: string) => void;
  }) => {
    if (!gallery) return;
    const watermarkOpts = {
      ...getGalleryWatermarkOptions(gallery, defaultPhotographerName),
      enabled: withWatermark,
    };

    // 1. Single Photo Download
    if (downloadModalConfig.item) {
      const item = downloadModalConfig.item;
      const targetUrl = item.url || item.thumbnailUrl;
      if (!targetUrl) {
        showToast('Unavailable', 'Photo file is not available for download.', 'warning');
        return;
      }
      const targetName = item.title || `${gallery.slug || 'gallery'}-photo.jpg`;
      onProgress?.(30, `Downloading ${targetName}...`);
      showToast(
        'Downloading Photo',
        `Saving "${targetName}" (${format === 'original' ? 'RAW / Original' : 'Web JPEG'})...`,
        'info'
      );
      const success = await downloadSingleImage({
        url: targetUrl,
        preferredFilename: targetName,
        watermarkOptions: watermarkOpts,
        format,
        downloadUrl: item.downloadUrl,
        rawUrl: item.rawUrl,
      });
      onProgress?.(100, 'Download complete!');
      if (success) {
        showToast('Photo Saved', `"${targetName}" downloaded to your device.`, 'success');
      } else {
        showToast('Download Started', 'Initiated download. Please check your browser downloads.', 'info');
      }
      return;
    }

    // 2. Multi-Photo ZIP Download
    const isAll = Boolean(
      downloadModalConfig.isAll ||
      (!downloadModalConfig.item &&
        (!downloadModalConfig.items ||
          downloadModalConfig.items.length === gallery.media.length ||
          (downloadModalConfig.totalCount && downloadModalConfig.totalCount >= (gallery.totalMediaCount || gallery.media.length))))
    );

    const expectedCount =
      downloadModalConfig.totalCount ||
      (isAll ? gallery.totalMediaCount || gallery.media.length : selectedMediaIds.size) ||
      gallery.media.length;

    let targetItems = downloadModalConfig.items || gallery.media;

    if (
      (isAll && gallery.totalMediaCount && targetItems.length < gallery.totalMediaCount) ||
      (!isAll && selectedMediaIds.size > targetItems.length) ||
      (downloadModalConfig.totalCount && targetItems.length < downloadModalConfig.totalCount)
    ) {
      try {
        onProgress?.(5, `Loading all ${expectedCount} photos from server...`);
        const fullGallery = await GetPublicGalleryApi(gallery.slug || gallery.id, { all_media: true });
        const normalizedFull = normalizeServerGallery(fullGallery);
        if (isAll) {
          targetItems = normalizedFull.media;
        } else if (selectedMediaIds.size > 0) {
          targetItems = normalizedFull.media.filter((m) => selectedMediaIds.has(m.id));
        } else {
          targetItems = normalizedFull.media;
        }
      } catch (fetchErr) {
        console.warn('Could not fetch full public gallery media list for zip, falling back to loaded items:', fetchErr);
      }
    }

    if (!targetItems || targetItems.length === 0) return;

    const finalCount = targetItems.length;

    if (isAll) {
      setIsPreparingZip(true);
      setZipProgress(5);
    } else {
      setIsPreparingSelectedZip(true);
      setSelectedZipProgress(5);
    }

    const zipFilename = isAll
      ? `${gallery.slug || 'gallery'}-${format}-collection.zip`
      : `${gallery.slug || 'gallery'}-selected-${finalCount}-${format}.zip`;

    const fallbackZipUrl = GetGalleryDownloadZipUrl(gallery.slug || gallery.id, undefined, format);

    try {
      showToast(
        'Packaging Archive',
        `Bundling ${finalCount} photos (${format === 'original' ? 'RAW / Original' : 'Web JPEG'})...`,
        'info'
      );

      const items = targetItems
        .map((m, idx) => ({
          url: (format === 'original' && m.rawUrl
            ? m.rawUrl
            : format === 'web' && m.previewUrl
            ? m.previewUrl
            : m.url || m.thumbnailUrl || '') as string,
          downloadUrl: m.downloadUrl,
          id: m.id,
          filename: m.title || `${gallery.slug || 'gallery'}-photo-${String(idx + 1).padStart(3, '0')}.jpg`,
          type: m.type,
        }))
        .filter((item) => Boolean(item.url));

      await downloadMultipleAsZip({
        items,
        zipFilename,
        onProgress: (percent, current, total) => {
          if (isAll) setZipProgress(percent);
          else setSelectedZipProgress(percent);
          onProgress?.(
            percent,
            current > 0
              ? `Packaging ${current} of ${total} photos (${percent}%)...`
              : `Packaging archive (${percent}%)...`
          );
        },
        watermarkOptions: watermarkOpts,
        format,
        serverZipUrl: fallbackZipUrl,
      });

      onProgress?.(100, 'Download started!');

      showToast(
        'Archive Ready',
        `Downloaded ${finalCount} photographs successfully.`,
        'success'
      );
    } catch (err) {
      console.warn('Direct zip bundling failed, streaming archive via server:', err);
      showToast('Downloading Archive', 'Streaming archive directly from server...', 'info');
      triggerAttachmentDownload(fallbackZipUrl);
      onProgress?.(100, 'Streaming download started!');
    } finally {
      if (isAll) {
        setIsPreparingZip(false);
        setZipProgress(0);
      } else {
        setIsPreparingSelectedZip(false);
        setSelectedZipProgress(0);
      }
    }
  };

  // Start slideshow: launch Instagram-style soundtrack picker
  const handleStartSlideshow = (startIndex: number = 0) => {
    setSlideshowStartIndex(startIndex);
    setIsMusicPickerOpen(true);
  };

  // Render password screen if locked
  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#090909] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900 border border-neutral-800 text-center space-y-6 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
              {photographer.studioName || 'Atelier Photography'}
            </span>
            <h2 className="text-2xl font-serif text-white mt-1">{gallery.title}</h2>
            <p className="text-xs text-neutral-400 mt-2">
              This gallery is protected by private invitation. Enter the access PIN code to view.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              placeholder={pinCooldown > 0 ? `Locked (${pinCooldown}s)` : "Enter PIN / Password"}
              value={pinInput}
              disabled={isVerifyingPin || pinCooldown > 0}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center text-sm tracking-widest text-white focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {pinCooldown > 0 ? (
              <p className="text-xs text-amber-400 font-mono">
                Too many attempts. PIN input locked for {pinCooldown}s.
              </p>
            ) : pinError ? (
              <p className="text-xs text-rose-400 font-mono">
                Incorrect code. Please enter the valid PIN sent by your photographer.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isVerifyingPin || pinCooldown > 0}
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifyingPin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying PIN...</span>
                </>
              ) : pinCooldown > 0 ? (
                `Locked for ${pinCooldown}s`
              ) : (
                'Unlock Gallery'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Determine which media items go into the slideshow
  const slideshowItems =
    selectedMediaIds.size > 0
      ? gallery.media.filter((m) => selectedMediaIds.has(m.id))
      : gallery.media;

  return (
    <div className="relative min-h-screen">
      {/* ─── AUTHORIZED PREVIEW MODE FLOATING BADGE (Only for logged-in studio owner) ─── */}
      {isAuthorizedToPreview && rawQueryTemplate && (
        <aside
          aria-label="Studio Preview Mode Bar"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full bg-neutral-950/92 border border-amber-500/50 shadow-2xl backdrop-blur-xl text-xs text-white pointer-events-auto"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="font-mono text-[11px] text-amber-300 uppercase tracking-wider font-semibold">
            Preview Mode: <span className="text-white capitalize">{rawQueryTemplate}</span>
          </span>
          <span className="text-[10px] text-neutral-400 font-mono hidden md:inline border-l border-neutral-700 pl-2.5">
            Only visible to you (Logged-in Studio Owner)
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={handleExitPreview}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white text-[10px] font-semibold transition-colors cursor-pointer"
            >
              Exit Preview
            </button>
            <Link
              to={`/dashboard/galleries/${gallery.id}?tab=design`}
              className="px-2.5 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 text-[10px] font-bold transition-all shadow-sm cursor-pointer"
            >
              Apply in Studio
            </Link>
          </div>
        </aside>
      )}

      {/* Floating Top Client Bar: Always accessible at top with Fullscreen & Layout Switcher */}
      <ClientGalleryNavbar
        isScrolled={isScrolled}
        studioName={gallery.studioName || photographer?.studioName || 'EX SHARE'}
        photographerName={gallery.photographerName || photographer?.fullName}
        galleryTitle={gallery.title}
        galleryId={gallery.id}
        allowDownloads={gallery.allowDownloads}
        mediaCount={gallery.media.length}
        isPreparingZip={isPreparingZip}
        zipProgress={zipProgress}
        expiryText={
          expiryStatus.hasExpiry && !expiryStatus.isExpired && expiryStatus.daysRemaining < 5
            ? `Access: ${expiryStatus.remainingText}`
            : undefined
        }
        gridDesign={gridDesign}
        onSelectGridDesign={handleSelectGridDesign}
        onStartSlideshow={() => handleStartSlideshow(0)}
        onDownloadAll={handleDownloadAll}
        onCreateStoryVideo={() => handleOpenStoryVideoCreator()}
        onOpenContact={() => setIsContactModalOpen(true)}
        viewerEmail={viewerEmail}
        favoritesCount={favoritesCount}
        onOpenViewerAuth={() => setIsAuthModalOpen(true)}
        onLogoutViewer={handleLogoutViewer}
      />

      {/* Gentle Expiry Warning Banner (only if expiring in less than 48 hours) */}
      {expiryStatus.isExpiringSoon && !expiryStatus.isExpired && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border-b border-amber-500/30 text-amber-200 px-4 py-2 text-center text-xs font-mono flex items-center justify-center gap-2 backdrop-blur-md sticky top-0 z-30 animate-in fade-in">
          <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>
            <strong>Access Deadline:</strong> This gallery link will close on {expiryStatus.humanFormatted} ({expiryStatus.remainingText}). Please download your photos soon.
          </span>
        </div>
      )}

      {/* Dynamic Gallery Template Rendering: Bespoke Wedding & Fine-Art Designs */}
      <GalleryTemplateRenderer
        template={activeTemplate}
        gallery={gallery}
        gridDesign={gridDesign}
        onSelectGridDesign={handleSelectGridDesign}
        onOpenLightbox={(idx) => setLightboxIndex(idx)}
        onToggleFavorite={handleToggleFavorite}
        favoritingMediaIds={favoritingMediaIds}
        selectedMediaIds={selectedMediaIds}
        onToggleSelectMedia={handleToggleSelectMedia}
        onStartSlideshow={handleStartSlideshow}
        studioName={gallery.studioName || photographer?.studioName || 'ATELIER PHOTOGRAPHY'}
        photographerName={defaultPhotographerName}
        onDownloadSingle={handleDownloadSinglePhoto}
        onShareGallery={() => {
          setIsShareSelectedOpen(true);
        }}
        onCreateStoryVideo={() => handleOpenStoryVideoCreator()}
        onOpenContact={() => setIsContactModalOpen(true)}
      />

      {/* Multi-Select Floating Action Toolbar */}
      <SelectionBar
        selectedCount={selectedMediaIds.size}
        totalCount={gallery.media.length}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        onDownloadSelected={handleDownloadSelected}
        onPlaySlideshow={() => handleStartSlideshow(0)}
        onShareSelected={() => setIsShareSelectedOpen(true)}
        onCreateStoryVideo={() =>
          handleOpenStoryVideoCreator(gallery.media.filter((m) => selectedMediaIds.has(m.id)))
        }
        onBulkFavorite={(targetState) => {
          handleBulkFavorite(targetState, Array.from(selectedMediaIds));
        }}
        isBulkFavoriting={isBulkFavoriting}
        isDownloading={isPreparingSelectedZip}
        downloadProgress={selectedZipProgress}
      />

      {/* Instagram-Style Music Picker Modal */}
      <MusicPickerModal
        isOpen={isMusicPickerOpen}
        onClose={() => setIsMusicPickerOpen(false)}
        onSelectTrack={(track) => {
          setSelectedTrack(track);
          setIsSlideshowOpen(true);
        }}
        currentSelectedTrack={selectedTrack}
      />

      {/* Movie-Style Animated Slideshow Modal */}
      <SlideshowModal
        isOpen={isSlideshowOpen}
        onClose={() => setIsSlideshowOpen(false)}
        items={slideshowItems}
        initialIndex={slideshowStartIndex}
        galleryTitle={gallery.title}
        clientName={gallery.clientName}
        selectedTrack={selectedTrack}
        onChangeTrack={() => setIsMusicPickerOpen(true)}
        onTrackAutoAdvance={(nextTrack) => setSelectedTrack(nextTrack)}
        watermarkEnabled={Boolean(gallery.watermark_enabled ?? gallery.watermarkEnabled)}
        watermarkText={defaultWatermarkText}
        watermarkOpacity={gallery.watermark_opacity}
        watermarkPosition={gallery.watermark_position}
        watermarkImage={gallery.watermark_image}
        watermarkType={gallery.watermark_type}
        watermarkFontSize={gallery.watermark_font_size}
        watermarkFontColor={gallery.watermark_font_color}
        watermarkFontStyle={gallery.watermark_font_style}
      />

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <LightboxModal
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          mediaList={gallery.media}
          currentIndex={lightboxIndex}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          onToggleFavorite={handleToggleFavorite}
          isFavoriting={
            lightboxIndex !== null && gallery.media[lightboxIndex]
              ? favoritingMediaIds.has(gallery.media[lightboxIndex].id)
              : false
          }
          studioName={gallery.studioName || photographer.studioName}
          allowDownloads={gallery.allowDownloads}
          galleryTitle={gallery.title}
          gallerySlug={gallery.slug || gallery.id}
          watermarkEnabled={Boolean(gallery.watermark_enabled ?? gallery.watermarkEnabled)}
          watermarkText={defaultWatermarkText}
          watermarkOpacity={gallery.watermark_opacity}
          watermarkPosition={gallery.watermark_position}
          watermarkImage={gallery.watermark_image}
          watermarkType={gallery.watermark_type}
          watermarkFontSize={gallery.watermark_font_size}
          watermarkFontColor={gallery.watermark_font_color}
          watermarkFontStyle={gallery.watermark_font_style}
          theme={activeTemplate}
        />
      )}

      {/* Share Selected Photos Modal */}
      <MediaShareModal
        isOpen={isShareSelectedOpen}
        onClose={() => setIsShareSelectedOpen(false)}
        mediaItems={
          selectedMediaIds.size > 0
            ? gallery.media.filter((m) => selectedMediaIds.has(m.id))
            : gallery.media
        }
        galleryTitle={gallery.title}
        gallerySlug={gallery.slug || gallery.id}
        clientName={gallery.clientName}
      />

      {/* Story & Reel Video Creator Modal */}
      {isStoryVideoModalOpen && gallery && (
        <StoryVideoCreatorModal
          isOpen={isStoryVideoModalOpen}
          onClose={() => setIsStoryVideoModalOpen(false)}
          gallery={gallery}
          initialMedia={storyVideoInitialItems}
          defaultPhotographerName={defaultPhotographerName}
        />
      )}

      {/* Studio Direct Inquiry & Contact Popup Modal */}
      {gallery && (
        <GalleryContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          gallery={gallery}
          theme={activeTemplate}
          studioName={gallery.studioName || photographer?.studioName}
          photographerName={defaultPhotographerName}
        />
      )}

      {/* Format Selection (RAW vs JPEG) Download Options Modal */}
      {gallery && (
        <DownloadOptionsModal
          isOpen={downloadModalConfig.isOpen}
          onClose={() => setDownloadModalConfig({ isOpen: false })}
          item={downloadModalConfig.item}
          items={downloadModalConfig.items}
          totalCount={downloadModalConfig.totalCount}
          galleryTitle={downloadModalConfig.title || gallery.title}
          watermarkOptions={getGalleryWatermarkOptions(gallery, defaultPhotographerName)}
          showWatermarkToggle={false}
          onConfirmDownload={handleExecuteDownloadOptions}
          theme={activeTemplate === 'editorial' || activeTemplate === 'minimal' ? 'light' : 'dark'}
        />
      )}

      {/* Viewing User Email + OTP Authentication Modal (Triggered ONLY when user attempts to like) */}
      <ViewerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        galleryIdOrSlug={gallery.slug || gallery.id}
        galleryTitle={gallery.title}
        onSuccess={handleAuthSuccess}
        pendingCount={selectedMediaIds.size > 0 ? selectedMediaIds.size : 1}
      />
    </div>
  );
};

export const ClientGalleryPage: React.FC = () => {
  return (
    <SmoothScrollProvider>
      <ClientGalleryContent />
    </SmoothScrollProvider>
  );
};
