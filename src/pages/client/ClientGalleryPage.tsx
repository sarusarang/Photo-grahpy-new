import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useGallery } from '../../context/GalleryContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import type { GalleryTemplateId } from '../../types';
import { GalleryTemplateRenderer } from '../../components/gallery/templates';
import { LightboxModal } from '../../components/gallery/LightboxModal';
import { SlideshowModal } from '../../components/gallery/SlideshowModal';
import { MusicPickerModal } from '../../components/gallery/MusicPickerModal';
import { CURATED_TRACKS, type Track } from '../../services/musicService';
import { SelectionBar } from '../../components/gallery/SelectionBar';
import { MediaShareModal } from '../../components/gallery/MediaShareModal';
import { ClientGalleryNavbar } from '../../components/gallery/ClientGalleryNavbar';
import { SmoothScrollProvider, useLenisScroll } from '../../components/common/SmoothScroll';
import { Lock, Clock, Calendar, AlertTriangle, Mail, Sparkles } from 'lucide-react';
import { isGalleryExpired, getExpiryStatus, extendExpiryByDays } from '../../utils/expiryUtils';
import {
  recordGalleryView,
  recordGalleryDownload,
  recordGalleryFavorite,
} from '../../services/galleryAnalyticsService';

const ClientGalleryContent: React.FC = () => {
  const { galleryId } = useParams<{ galleryId: string }>();
  const [searchParams] = useSearchParams();
  const { getGalleryByIdOrSlug, toggleMediaFavorite, updateGallery } = useGallery();
  const { photographer } = useAuth();
  const { showToast } = useToast();

  const gallery = getGalleryByIdOrSlug(galleryId || '');

  // Track gallery view once on mount
  const hasTrackedViewRef = useRef(false);
  useEffect(() => {
    if (gallery && !hasTrackedViewRef.current) {
      hasTrackedViewRef.current = true;
      recordGalleryView(gallery);
    }
  }, [gallery?.id]);

  // Active template: preview query param (from dashboard) or gallery's set template
  const queryTemplate = searchParams.get('previewTemplate') as GalleryTemplateId | null;
  const activeTemplate: GalleryTemplateId = queryTemplate || gallery?.templateId || 'editorial';

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Multi-Selection state
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isShareSelectedOpen, setIsShareSelectedOpen] = useState(false);

  // Slideshow & Soundtrack state
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [slideshowStartIndex, setSlideshowStartIndex] = useState(0);
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(CURATED_TRACKS[0]);

  // PIN unlock state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Top navbar visibility: only when scrolling down with smooth Lenis scroll listener
  const [showNavbar, setShowNavbar] = useState(false);
  useLenisScroll((scroll) => {
    setShowNavbar(scroll > 80);
  });

  // Bulk ZIP download simulation for all media
  const [isPreparingZip, setIsPreparingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Selected ZIP download simulation
  const [isPreparingSelectedZip, setIsPreparingSelectedZip] = useState(false);
  const [selectedZipProgress, setSelectedZipProgress] = useState(0);

  if (!gallery) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-serif">Gallery Not Found</h2>
        <p className="text-xs text-neutral-400 mt-2">
          The requested private collection does not exist or has expired.
        </p>
        <Link
          to="/dashboard/drive"
          className="mt-6 px-6 py-2.5 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs uppercase"
        >
          Go to Studio Drive
        </Link>
      </div>
    );
  }

  // Check gallery access validity window
  const isExpired = isGalleryExpired(gallery.expiresAt);
  const expiryStatus = getExpiryStatus(gallery.expiresAt);

  // If the time window has passed, block client access with a luxury branded expired view
  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#07080b] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber-400 selection:text-black">
        {/* Ambient background with blurred cover */}
        <div className="absolute inset-0 z-0">
          <img
            src={gallery.coverImage}
            alt={gallery.title}
            className="w-full h-full object-cover object-center opacity-15 filter blur-3xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/80 to-[#07080b]" />
        </div>

        {/* Photographer Management Override Banner (if photographer is authenticated) */}
        {photographer && (
          <div className="relative z-20 w-full max-w-xl mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2.5 text-xs font-mono">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Photographer Admin:</strong> This gallery link is currently expired for clients.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const nextIso = extendExpiryByDays(7, gallery.expiresAt);
                  updateGallery(gallery.id, { expiresAt: nextIso });
                  showToast('Access Extended', 'Reopened client link for 7 days.', 'success');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                +7 Days
              </button>
              <button
                onClick={() => {
                  const nextIso = extendExpiryByDays(30, gallery.expiresAt);
                  updateGallery(gallery.id, { expiresAt: nextIso });
                  showToast('Access Extended', 'Reopened client link for 30 days.', 'success');
                }}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono transition-all cursor-pointer"
              >
                +30 Days
              </button>
              <Link
                to={`/dashboard/drive/${gallery.id}`}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-all"
              >
                Settings
              </Link>
            </div>
          </div>
        )}

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
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === (gallery.password || '1234') || pinInput.trim() === '1234') {
      setIsUnlocked(true);
      setPinError(false);
      showToast('Unlocked', 'Access granted to client collection.', 'success');
    } else {
      setPinError(true);
      showToast('Incorrect PIN', 'Please enter the access code provided by your photographer.', 'error');
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

  // Toggle favorite with analytics tracking
  const handleToggleFavorite = (mediaId: string) => {
    if (!gallery) return;
    toggleMediaFavorite(gallery.id, mediaId);
    const item = gallery.media.find((m) => m.id === mediaId);
    if (!item?.isFavorite) {
      recordGalleryFavorite(gallery, item?.title);
    }
  };

  // Handle "Download All" action
  const handleDownloadAll = () => {
    setIsPreparingZip(true);
    setZipProgress(10);

    const interval = setInterval(() => {
      setZipProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            setIsPreparingZip(false);
            setZipProgress(100);
            recordGalleryDownload(gallery, gallery.media.length, true);
            showToast(
              'Master ZIP Ready',
              `Downloaded all ${gallery.media.length} original full-resolution files.`,
              'success'
            );
            const a = document.createElement('a');
            a.href = gallery.coverImage;
            a.download = `${gallery.slug}-master-collection.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }, 400);
          return 90;
        }
        return prev + 25;
      });
    }, 250);
  };

  // Handle "Download Selected" action
  const handleDownloadSelected = () => {
    if (selectedMediaIds.size === 0) return;

    setIsPreparingSelectedZip(true);
    setSelectedZipProgress(15);

    const interval = setInterval(() => {
      setSelectedZipProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            setIsPreparingSelectedZip(false);
            setSelectedZipProgress(100);
            recordGalleryDownload(gallery, selectedMediaIds.size, false);
            showToast(
              'Selected Archive Ready',
              `Downloaded ${selectedMediaIds.size} selected high-resolution photographs.`,
              'success'
            );
            const firstSelected = gallery.media.find((m) => selectedMediaIds.has(m.id));
            const a = document.createElement('a');
            a.href = firstSelected?.url || gallery.coverImage;
            a.download = `${gallery.slug}-selected-${selectedMediaIds.size}-photos.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }, 400);
          return 90;
        }
        return prev + 25;
      });
    }, 200);
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
              {photographer.studioName}
            </span>
            <h2 className="text-2xl font-serif text-white mt-1">{gallery.title}</h2>
            <p className="text-xs text-neutral-400 mt-2">
              This gallery is protected by private invitation. Enter the access PIN code to view.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Enter PIN / Password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center text-sm tracking-widest text-white focus:outline-none focus:border-amber-400"
            />
            {pinError && (
              <p className="text-xs text-rose-400 font-mono">
                Hint: Check studio demo password: "{gallery.password || '1234'}"
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Unlock Gallery
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
      {/* Floating Top Client Bar: Smooth appearance on scroll */}
      <ClientGalleryNavbar
        visible={showNavbar}
        studioName={photographer.studioName}
        galleryTitle={gallery.title}
        galleryId={gallery.id}
        allowDownloads={gallery.allowDownloads}
        mediaCount={gallery.media.length}
        isPreparingZip={isPreparingZip}
        zipProgress={zipProgress}
        expiryText={
          expiryStatus.hasExpiry && !expiryStatus.isExpired
            ? `Access: ${expiryStatus.remainingText}`
            : undefined
        }
        onStartSlideshow={() => handleStartSlideshow(0)}
        onDownloadAll={handleDownloadAll}
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
        onOpenLightbox={(idx) => setLightboxIndex(idx)}
        onToggleFavorite={handleToggleFavorite}
        selectedMediaIds={selectedMediaIds}
        onToggleSelectMedia={handleToggleSelectMedia}
        onStartSlideshow={handleStartSlideshow}
        studioName={photographer.studioName || 'ATELIER PHOTOGRAPHY'}
        onShareGallery={() => {
          setIsShareSelectedOpen(true);
        }}
      />


      {/* Multi-Select Floating Action Toolbar (Appears when photos are selected) */}
      <SelectionBar
        selectedCount={selectedMediaIds.size}
        totalCount={gallery.media.length}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        onDownloadSelected={handleDownloadSelected}
        onPlaySlideshow={() => handleStartSlideshow(0)}
        onShareSelected={() => setIsShareSelectedOpen(true)}
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
          studioName={photographer.studioName}
          allowDownloads={gallery.allowDownloads}
          galleryTitle={gallery.title}
          gallerySlug={gallery.slug || gallery.id}
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
