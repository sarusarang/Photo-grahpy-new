import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  Download,
  CheckCircle2,
  RefreshCw,
  Mail,
  Loader2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { usePublicEvent } from '@/hooks/useAtelierQueries';
import { normalizeServerEvent } from '../../utils/eventNormalizer';
import { AIFaceSearchBox } from '../../components/gallery/AIFaceSearchBox';
import { GalleryHeroBanner } from '../../components/gallery/GalleryHeroBanner';
import { LightboxModal } from '../../components/gallery/LightboxModal';
import { ClientGalleryFooter } from '../../components/gallery/ClientGalleryFooter';
import { FullscreenButton } from '@/components/common/FullscreenButton';
import { EventListSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { useEventSeo } from '@/hooks/useSeo';
import { downloadSingleImage, downloadMultipleAsZip, getGalleryWatermarkOptions } from '@/utils/downloadUtils';
import { UniversalPhotoGrid, type GalleryGridDesign } from '@/components/gallery/UniversalPhotoGrid';
import { GalleryLayoutSwitcher } from '@/components/gallery/GalleryLayoutSwitcher';
import type { MediaItem } from '@/types';

export const GuestEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { photographer, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  // TanStack Query: Fetch live event detail via public mobile endpoint with resilient slug fallback
  const {
    data: apiEvent,
    isLoading: isEventLoading,
    isError: isEventError,
    error: eventError,
    refetch: refetchEvent,
  } = usePublicEvent(eventId || '');

  // Normalize server live event with demo fallback
  const event = useMemo(() => {
    const isPlanExpiredError =
      (eventError as any)?.data?.code === 'studio_plan_expired' ||
      (eventError as any)?.data?.code === 'STUDIO_PLAN_EXPIRED' ||
      (eventError as any)?.response?.data?.code === 'studio_plan_expired' ||
      (eventError as any)?.response?.data?.code === 'STUDIO_PLAN_EXPIRED' ||
      (eventError as any)?.data?.plan_expired === true ||
      (eventError as any)?.response?.data?.plan_expired === true ||
      ((eventError as any)?.status === 403 &&
        String((eventError as any)?.data?.detail || '').toLowerCase().includes('plan')) ||
      ((eventError as any)?.response?.status === 403 &&
        String((eventError as any)?.response?.data?.detail || '').toLowerCase().includes('plan'));
    if (isPlanExpiredError) return null;

    if (apiEvent) return normalizeServerEvent(apiEvent);
    return null;
  }, [apiEvent, eventError]);

  // Dynamic SEO & OpenGraph Social Graph: updates event title, description, and hero banner
  useEventSeo(event, photographer?.studioName || photographer?.fullName);

  // AI Face Search State
  const [matchedIds, setMatchedIds] = useState<string[] | null>(null);
  const [matchedMediaItems, setMatchedMediaItems] = useState<MediaItem[]>([]);
  const [searchResetKey, setSearchResetKey] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [gridDesign, setGridDesign] = useState<GalleryGridDesign>('masonry');
  const [mountTime] = useState(() => Date.now());

  // Strictly enforce client privacy: ONLY photos matching the user's face are displayed
  const displayedMedia: MediaItem[] = useMemo(() => {
    if (!matchedIds) return [];
    if (matchedMediaItems.length > 0) return matchedMediaItems;
    return (event?.media || []).filter((m) => matchedIds.includes(m.id));
  }, [matchedIds, matchedMediaItems, event?.media]);

  if (isEventLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#07080b] text-neutral-900 dark:text-white p-8 max-w-4xl mx-auto space-y-6 pt-16 transition-colors">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 shadow-xs">
            Connecting to Live Studio Event...
          </div>
          <h2 className="text-2xl font-serif text-neutral-900 dark:text-white">Loading Event Stream</h2>
        </div>
        <EventListSkeleton count={3} />
      </div>
    );
  }

  // 1. Check if the Host Studio's Subscription is Expired (Locks entire live event stream & QR sharing)
  const isStudioPlanExpired = Boolean(
    (apiEvent as any)?.is_studio_plan_expired ||
    (apiEvent as any)?.studio_plan_status === 'expired' ||
    (event as any)?.is_studio_plan_expired ||
    (eventError as any)?.data?.code === 'studio_plan_expired' ||
    (eventError as any)?.data?.code === 'STUDIO_PLAN_EXPIRED' ||
    (eventError as any)?.response?.data?.code === 'studio_plan_expired' ||
    (eventError as any)?.response?.data?.code === 'STUDIO_PLAN_EXPIRED' ||
    (eventError as any)?.data?.plan_expired === true ||
    (eventError as any)?.response?.data?.plan_expired === true ||
    ((eventError as any)?.status === 403 &&
      String((eventError as any)?.data?.detail || (eventError as any)?.response?.data?.detail || '').toLowerCase().includes('plan')) ||
    ((eventError as any)?.response?.status === 403 &&
      String((eventError as any)?.response?.data?.detail || '').toLowerCase().includes('plan'))
  );

  if (isStudioPlanExpired) {
    const errorData = (eventError as any)?.data || (eventError as any)?.response?.data;
    const eventTitle = event?.title || errorData?.title || 'Live Event';
    const venue = event?.venue || errorData?.venue || '';
    const studioName =
      photographer?.studioName ||
      (apiEvent as any)?.studio_name ||
      errorData?.studio_name ||
      'Studio';
    const studioEmail = photographer?.email || (apiEvent as any)?.studio_email || errorData?.studio_email || '';

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
              {eventTitle}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              Live biometric face search, photo delivery, and guest downloads for this event are temporarily locked because the host studio&apos;s EX SHARE membership has lapsed.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 text-left space-y-2.5 text-xs font-mono text-neutral-400">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Event:</span>
              <span className="text-white font-semibold truncate max-w-[200px]">{eventTitle}</span>
            </div>
            {venue && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Venue:</span>
                <span className="text-neutral-200">{venue}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Host Studio:</span>
              <span className="text-neutral-200">{studioName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Stream Status:</span>
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
                <span>Renew Membership to Reactivate Event</span>
              </Link>
            ) : studioEmail ? (
              <a
                href={`mailto:${studioEmail}?subject=${encodeURIComponent(
                  `Inquiry: Locked Event Stream "${eventTitle}"`
                )}&body=${encodeURIComponent(
                  `Hello ${studioName},\n\nI was attempting to access the live guest photo stream for "${eventTitle}", but the link indicates the studio membership has expired. Could you please reactivate or renew access?\n\nThank you!`
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
                to="/dashboard/events"
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

  if (isEventError || !event) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#07080b] text-neutral-900 dark:text-white flex items-center justify-center p-6 transition-colors">
        <ErrorState
          title="Event Link Not Found"
          message="The requested event link may have expired, or does not exist."
          onRetry={refetchEvent}
        />
      </div>
    );
  }

  // Check if QR Code validity time period has expired
  const expiryTime = event.qrSettings?.expiresAt ? new Date(event.qrSettings.expiresAt).getTime() : 0;
  const isExpired = Boolean(event.qrSettings?.expiresAt && mountTime > expiryTime);

  // Render Expired Screen if photographer's set time period has passed
  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#07080b] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Ambient background with blurred banner */}
        <div className="absolute inset-0 z-0">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover object-center opacity-20 filter blur-3xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/80 to-[#07080b]" />
        </div>

        {/* Central Expired Notice Card */}
        <div className="relative z-10 max-w-lg w-full rounded-3xl bg-neutral-900/80 border border-neutral-800/90 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8 stroke-[1.8]" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
              Event QR Access Window Closed
            </span>
            <h1 className="text-xl sm:text-2xl font-sans font-normal text-white/95 tracking-[0.03em]">
              {event.title}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              The live guest viewing period for this event concluded on{' '}
              <span className="text-white font-medium">
                {new Date(event.qrSettings.expiresAt).toLocaleString()}
              </span>
              .
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-left space-y-2 text-xs font-mono text-neutral-400">
            <div className="flex items-center justify-between">
              <span>Event:</span>
              <span className="text-white font-bold truncate max-w-[200px]">{event.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Location:</span>
              <span className="text-white">{event.venue}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Studio:</span>
              <span className="text-amber-400">{photographer.studioName || 'Atelier Photography'}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href={`mailto:${photographer.email}?subject=${encodeURIComponent(
                `Request Photos Access: ${event.title}`
              )}`}
              className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Mail className="w-4 h-4 stroke-[2.5]" />
              <span>Contact Photographer for Access</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleDownloadAllMatched = async () => {
    if (displayedMedia.length === 0) return;
    setIsDownloadingAll(true);
    showToast(
      'Packaging ZIP Archive',
      `Bundling ${displayedMedia.length} high-resolution photographs into a ZIP file...`,
      'info'
    );

    try {
      const items = displayedMedia
        .map((m, idx) => ({
          url: (m.url || m.thumbnailUrl || '') as string,
          title: m.title || `${event?.slug || 'event'}-photo-${idx + 1}`,
        }))
        .filter((item) => Boolean(item.url));

      const watermarkOpts = getGalleryWatermarkOptions(event as any);
      await downloadMultipleAsZip({
        items,
        zipFilename: `${event?.slug || 'event'}-my-photos.zip`,
        watermarkOptions: watermarkOpts,
      });
      showToast(
        'Downloaded Photos',
        `Downloaded all ${displayedMedia.length} of your high-resolution event photographs.`,
        'success'
      );
    } catch {
      showToast('Download Failed', 'Failed to generate ZIP archive. Please try again.', 'error');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleDownloadSingle = async (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    const downloadUrl = item.url || item.thumbnailUrl;
    if (!downloadUrl) return;

    showToast('Download Started', `Downloading "${item.title || 'photo'}"...`, 'info');
    const watermarkOpts = getGalleryWatermarkOptions(event as any);
    const success = await downloadSingleImage(downloadUrl, item.title || `${event?.slug || 'event'}-photo.jpg`, watermarkOpts);
    if (success) {
      showToast('Photo Downloaded', item.title || 'Photograph saved to downloads.', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* ─── 0. TOP TEMPLATE HEADER NAVBAR (With Fullscreen Button on Right) ─── */}
      <header className="sticky top-0 z-40 bg-neutral-950/92 backdrop-blur-2xl border-b border-neutral-800/80 px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-4 text-white text-xs shadow-2xl shadow-black/60 select-none">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 text-white shrink-0">
            <img
              src="/ex-share-white-logo.png"
              alt="EX SHARE"
              className="h-4.5 sm:h-5 w-auto object-contain opacity-90"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-serif font-bold uppercase tracking-widest text-[11px] sm:text-xs text-neutral-200 hidden xs:inline">
              {event.studioName || photographer?.studioName || event.photographerName || photographer?.fullName || 'EX SHARE'}
            </span>
          </div>
          <span className="text-neutral-700 hidden sm:inline">/</span>
          <span className="text-neutral-300 truncate max-w-[120px] xs:max-w-[180px] sm:max-w-xs font-medium text-xs">
            {event.title}
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Coverage</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Fullscreen Toggle placed on the right side of the template header */}
          <FullscreenButton theme="navbar" showLabel={false} compact={true} />

          {/* Quick Refresh Stream */}
          <button
            type="button"
            onClick={() => refetchEvent()}
            className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-amber-300 transition-colors text-xs font-medium cursor-pointer active:scale-95"
            title="Refresh Live Photos"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      {/* ─── 1. EDITORIAL TEMPLATE HERO BANNER (Vogue Haute-Couture Edition - NO buttons here) ─── */}
      <GalleryHeroBanner
        template="editorial"
        title={event.title}
        coverImage={event.bannerUrl}
        shootDate={event.eventDate}
      />

      {/* ─── 2. PHOTO LAYOUT: EXPANSIVE SEAMLESS CANVAS ─── */}
      <main className="w-full max-w-[1720px] mx-auto px-2 sm:px-4 py-6 sm:py-12 space-y-5 sm:space-y-8">
        {/* Prominent AI Face Search Box */}
        <section className="max-w-3xl mx-auto bg-neutral-50/90 border border-neutral-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xs text-center space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 text-white text-[10px] font-mono uppercase tracking-widest font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Face Recognition Search</span>
          </div>

          <div className="max-w-xl mx-auto space-y-1.5 sm:space-y-2">
            <h2 className="text-xl sm:text-3xl font-serif font-bold text-neutral-900 tracking-tight">
              Find Only Your Photos
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 font-light leading-relaxed">
              Upload a selfie or snap a live photo with your camera. Our facial recognition
              technology will scan all {event.photosCount || event.media.length || (event as { totalMediaCount?: number }).totalMediaCount || 0} event photos and show only you!
            </p>
          </div>

          {/* AI Face Search Interactive Component with live API eventId */}
          <div className="pt-2">
            <AIFaceSearchBox
              key={searchResetKey}
              eventId={event.id}
              galleryId={event.associatedGalleryId}
              mediaItems={event.media}
              onMatchesFound={(matched, returnedMedia) => {
                setMatchedIds(matched);
                if (returnedMedia && returnedMedia.length > 0) {
                  setMatchedMediaItems(returnedMedia);
                } else if (matched && matched.length > 0 && event.media.length > 0) {
                  setMatchedMediaItems(event.media.filter((m) => matched.includes(m.id)));
                } else {
                  setMatchedMediaItems([]);
                }

                if (matched && matched.length > 0) {
                  const count = returnedMedia?.length || matched.length;
                  showToast(
                    'AI Match Complete!',
                    `Found ${count} photograph(s) of you from this celebration.`,
                    'success'
                  );
                }
              }}
              theme="editorial"
            />
          </div>

          {/* Privacy Guarantee Note */}
          {!matchedIds && (
            <div className="pt-3 sm:pt-4 border-t border-neutral-200/70 flex items-center justify-center gap-2 text-[11px] sm:text-xs text-neutral-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Private Guest Portal: Only photographs containing your face will be revealed.</span>
            </div>
          )}
        </section>

        {/* ─── 3. RESULTS PHOTO GRID ─── */}
        {matchedIds && (
          <div className="space-y-3 sm:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Match Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-5 rounded-2xl bg-[#0e1017] text-white border border-neutral-800 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-amber-400/20 shrink-0">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-lg font-serif font-bold text-white tracking-tight truncate">
                      Found {displayedMedia.length} {displayedMedia.length === 1 ? 'Photograph' : 'Photographs'} of You
                    </h3>
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-semibold uppercase tracking-wider shrink-0">
                      AI Match
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-mono text-neutral-400 block mt-0.5 truncate">
                    High-confidence match from <span className="text-white font-medium">{event.title}</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Responsive Layout Grid Switcher for Live Guest Stream */}
                <GalleryLayoutSwitcher
                  currentDesign={gridDesign}
                  onChangeDesign={setGridDesign}
                  theme="cinematic"
                />

                <button
                  type="button"
                  onClick={handleDownloadAllMatched}
                  disabled={isDownloadingAll}
                  className="flex-1 sm:flex-initial py-2 px-3 sm:px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-400/20"
                >
                  {isDownloadingAll ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 stroke-[2.2]" />
                  )}
                  <span className="hidden xs:inline">{isDownloadingAll ? 'Preparing...' : 'Download All'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMatchedIds(null);
                    setMatchedMediaItems([]);
                    setSearchResetKey((k) => k + 1);
                  }}
                  className="p-2 sm:p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-95 border border-neutral-800 text-neutral-300 hover:text-white transition-all cursor-pointer shadow-xs shrink-0"
                  title="Search another selfie"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Matched Photos Grid - Full-width, tight gap, sharp corners with layout switching */}
            <div className="w-full pt-1">
              <UniversalPhotoGrid
                media={displayedMedia}
                gridDesign={gridDesign}
                onOpenLightbox={(idx) => setLightboxIndex(idx)}
                findOriginalIndex={(item) => {
                  const idx = displayedMedia.findIndex((m) => m.id === item.id);
                  return idx >= 0 ? idx : 0;
                }}
                onDownloadSingle={handleDownloadSingle}
                theme="editorial"
              />
            </div>
          </div>
        )}

        {matchedIds !== null && displayedMedia.length === 0 && (
          <div className="py-12 px-6 rounded-3xl bg-neutral-50 border border-neutral-200 text-center max-w-md mx-auto space-y-3">
            <Sparkles className="w-8 h-8 text-neutral-400 mx-auto" />
            <h4 className="font-serif font-bold text-neutral-900 text-base">
              No Matching Photographs Found
            </h4>
            <p className="text-xs text-neutral-500 font-mono leading-relaxed">
              We scanned all event photos, but couldn't detect your face in the current collection. The photographer may still be uploading live shots!
            </p>
          </div>
        )}
      </main>

      {/* ─── 5. Lightbox Modal ─── */}
      {lightboxIndex !== null && displayedMedia.length > 0 && (
        <LightboxModal
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          mediaList={displayedMedia}
          currentIndex={lightboxIndex}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          studioName={photographer.studioName || 'ATELIER PHOTOGRAPHY'}
          allowDownloads={true}
          galleryTitle={event.title}
          gallerySlug={event.slug}
        />
      )}

      {/* ─── 6. Editorial Footer ─── */}
      <ClientGalleryFooter
        galleryTitle={event.title}
        studioName={event.studioName || photographer?.studioName || 'ATELIER PHOTOGRAPHY'}
        mediaCount={event.photosCount || event.media.length}
        theme="editorial"
      />
    </div>
  );
};
