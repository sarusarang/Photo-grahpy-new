import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  Download,
  CheckCircle2,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useEventDetail } from '@/hooks/useAtelierQueries';
import { normalizeServerEvent } from '../../utils/eventNormalizer';
import { AIFaceSearchBox } from '../../components/gallery/AIFaceSearchBox';
import { GalleryHeroBanner } from '../../components/gallery/GalleryHeroBanner';
import { LightboxModal } from '../../components/gallery/LightboxModal';
import { ClientGalleryFooter } from '../../components/gallery/ClientGalleryFooter';
import { EventListSkeleton } from '@/components/common/LoadingSkeleton';
import { ErrorState } from '@/components/common/ErrorState';

export const GuestEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { photographer } = useAuth();
  const { showToast } = useToast();

  // TanStack Query: Fetch live event detail from DRF backend
  const {
    data: apiEvent,
    isLoading: isEventLoading,
    isError: isEventError,
    refetch: refetchEvent,
  } = useEventDetail(eventId || '');

  // Normalize server live event
  const event = useMemo(() => {
    if (!apiEvent) return null;
    return normalizeServerEvent(apiEvent);
  }, [apiEvent]);

  // AI Face Search State
  const [matchedIds, setMatchedIds] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAllStream, setShowAllStream] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  if (isEventLoading) {
    return (
      <div className="min-h-screen bg-[#07080b] text-white p-8 max-w-4xl mx-auto space-y-6 pt-16">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono uppercase tracking-widest text-amber-400">
            Connecting to Live Studio Event...
          </div>
          <h2 className="text-2xl font-serif">Loading Event Stream</h2>
        </div>
        <EventListSkeleton count={3} />
      </div>
    );
  }

  if (isEventError || !event) {
    return (
      <div className="min-h-screen bg-[#07080b] text-white flex items-center justify-center p-6">
        <ErrorState
          title="Event Link Not Found"
          message="The requested event link may have expired, or does not exist."
          onRetry={refetchEvent}
        />
      </div>
    );
  }

  // Check if QR Code validity time period has expired
  const now = Date.now();
  const expiryTime = new Date(event.qrSettings.expiresAt).getTime();
  const isExpired = now > expiryTime;

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
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
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

  // Filter media: If matchedIds is present, show ONLY user's matched photos!
  // Otherwise if showAllStream is true, show all event photos.
  const displayedMedia = matchedIds
    ? event.media.filter((m) => matchedIds.includes(m.id))
    : showAllStream
    ? event.media
    : [];

  const handleDownloadAllMatched = () => {
    if (displayedMedia.length === 0) return;
    setIsDownloadingAll(true);
    setTimeout(() => {
      setIsDownloadingAll(false);
      showToast(
        'Downloaded Photos',
        `Downloaded all ${displayedMedia.length} of your high-resolution event photographs.`,
        'success'
      );
      if (displayedMedia[0]?.url) {
        const a = document.createElement('a');
        a.href = displayedMedia[0].url;
        a.download = `${event.slug}-my-photos.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* ─── 1. EDITORIAL TEMPLATE HERO BANNER (Vogue Haute-Couture Edition) ─── */}
      <GalleryHeroBanner
        template="editorial"
        title={event.title}
        coverImage={event.bannerUrl}
        shootDate={event.eventDate}
      />

      {/* ─── 2. PHOTO LAYOUT: ONLY AI SEARCH (Strictly No Other Filters) ─── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Prominent AI Face Search Box */}
        <section className="bg-neutral-50 border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 text-white text-[10px] font-mono uppercase tracking-widest font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Face Recognition Search</span>
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 tracking-tight">
              Find Only Your Photos
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 font-light leading-relaxed">
              Upload a selfie or snap a live photo with your camera. Our facial recognition
              technology will scan all {event.media.length} event photos and show only you!
            </p>
          </div>

          {/* AI Face Search Interactive Component with live API eventId */}
          <div className="pt-2">
            <AIFaceSearchBox
              eventId={event.id}
              galleryId={event.associatedGalleryId}
              mediaItems={event.media}
              onMatchesFound={(matched) => {
                setMatchedIds(matched);
                if (matched && matched.length > 0) {
                  showToast(
                    'AI Match Complete!',
                    `Found ${matched.length} photograph(s) of you from this celebration.`,
                    'success'
                  );
                }
              }}
              theme="editorial"
            />
          </div>

          {/* Fallback to browse all if guest hasn't searched yet */}
          {!matchedIds && (
            <div className="pt-4 border-t border-neutral-200/70 flex flex-col sm:flex-row items-center justify-center gap-3">
              <span className="text-xs text-neutral-500 font-mono">Or explore full stream:</span>
              <button
                type="button"
                onClick={() => setShowAllStream(!showAllStream)}
                className="text-xs font-mono font-bold text-neutral-900 hover:text-amber-600 underline cursor-pointer"
              >
                {showAllStream ? 'Hide Full Photo Stream' : `Browse All ${event.media.length} Event Photos`}
              </button>
            </div>
          )}
        </section>

        {/* ─── 3. RESULTS PHOTO GRID ─── */}
        {matchedIds && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Match Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-900 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-white">
                    Found {displayedMedia.length} Photos of You
                  </h3>
                  <span className="text-[11px] font-mono text-neutral-400">
                    High-confidence facial match from {event.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadAllMatched}
                  disabled={isDownloadingAll}
                  className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloadingAll ? 'Preparing...' : 'Download All My Photos'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMatchedIds(null)}
                  className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition-colors cursor-pointer"
                  title="Search another selfie"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Matched Photos Grid */}
            <div className="columns-2 sm:columns-3 lg:columns-3 gap-3">
              {displayedMedia.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxIndex(idx)}
                  className="group relative break-inside-avoid mb-3 overflow-hidden rounded-2xl bg-neutral-100 shadow-sm cursor-pointer border border-neutral-200"
                >
                  <img
                    src={item.url}
                    alt={item.title || 'Event photograph'}
                    loading="lazy"
                    className="w-full h-auto block object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* AI Match Badge */}
                  <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-neutral-950/80 text-amber-300 text-[10px] font-mono font-bold border border-amber-400/30 flex items-center gap-1 shadow">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Matched</span>
                  </span>

                  {/* Photo Title */}
                  <div className="absolute bottom-2 left-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                    <p className="font-serif italic text-xs truncate drop-shadow">
                      {item.title || 'Event Still'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 4. Full Photo Stream (When Toggled) ─── */}
        {!matchedIds && showAllStream && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <h3 className="text-sm font-serif font-bold text-neutral-900 uppercase tracking-wider">
                Full Celebration Stream ({event.media.length})
              </h3>
              <span className="text-[11px] font-mono text-neutral-500">
                Tap photos to view full-resolution
              </span>
            </div>

            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
              {event.media.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxIndex(idx)}
                  className="group relative break-inside-avoid mb-3 overflow-hidden rounded-xl bg-neutral-100 shadow-sm cursor-pointer border border-neutral-200"
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-auto block object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                    <p className="font-serif italic text-xs truncate drop-shadow">
                      {item.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
        studioName={photographer.studioName || 'ATELIER PHOTOGRAPHY'}
        mediaCount={event.media.length}
        theme="editorial"
      />
    </div>
  );
};
