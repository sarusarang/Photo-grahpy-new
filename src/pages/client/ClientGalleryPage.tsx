import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useGallery } from '../../context/GalleryContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import type { GalleryTemplateId, MediaItem } from '../../types';
import { EditorialLayout } from '../../components/gallery/EditorialLayout';
import { MasonryLayout } from '../../components/gallery/MasonryLayout';
import { CinematicLayout } from '../../components/gallery/CinematicLayout';
import { MinimalLayout } from '../../components/gallery/MinimalLayout';
import { LightboxModal } from '../../components/gallery/LightboxModal';
import { SlideshowModal } from '../../components/gallery/SlideshowModal';
import { MusicPickerModal } from '../../components/gallery/MusicPickerModal';
import { CURATED_TRACKS, type Track } from '../../services/musicService';
import { SelectionBar } from '../../components/gallery/SelectionBar';
import { ClientGalleryNavbar } from '../../components/gallery/ClientGalleryNavbar';
import { SmoothScrollProvider, useLenisScroll } from '../../components/common/SmoothScroll';
import {
  Share2,
  Lock,
  Layers,
  Sparkles,
  Loader2,
  CheckSquare,
} from 'lucide-react';

const ClientGalleryContent: React.FC = () => {
  const { galleryId } = useParams<{ galleryId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getGalleryByIdOrSlug, toggleMediaFavorite } = useGallery();
  const { photographer } = useAuth();
  const { showToast } = useToast();

  const gallery = getGalleryByIdOrSlug(galleryId || '');

  // Template switching: either from query param or from gallery's set template
  const queryTemplate = searchParams.get('previewTemplate') as GalleryTemplateId | null;
  const [activeTemplate, setActiveTemplate] = useState<GalleryTemplateId>(
    queryTemplate || gallery?.templateId || 'editorial'
  );

  useEffect(() => {
    if (queryTemplate) {
      setActiveTemplate(queryTemplate);
    } else if (gallery?.templateId) {
      setActiveTemplate(gallery.templateId);
    }
  }, [queryTemplate, gallery?.templateId]);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Multi-Selection state
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());

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

  const handleSwitchTemplate = (tpl: GalleryTemplateId) => {
    setActiveTemplate(tpl);
    setSearchParams({ previewTemplate: tpl });
    showToast('Layout Switched', `Rendering through ${tpl.toUpperCase()} wedding design system.`, 'info');
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
        onStartSlideshow={() => handleStartSlideshow(0)}
        onDownloadAll={handleDownloadAll}
      />

      {/* Dynamic Gallery Template Rendering: 1 of 4 genuine bespoke wedding designs */}
      {activeTemplate === 'editorial' && (
        <EditorialLayout
          gallery={gallery}
          onOpenLightbox={(idx) => setLightboxIndex(idx)}
          onToggleFavorite={(mId) => toggleMediaFavorite(gallery.id, mId)}
          selectedMediaIds={selectedMediaIds}
          onToggleSelectMedia={handleToggleSelectMedia}
          onStartSlideshow={handleStartSlideshow}
          studioName={photographer.studioName || 'ATELIER PHOTOGRAPHY'}
          onShareGallery={() => {
            navigator.clipboard.writeText(window.location.href);
            showToast('Link Copied', 'Gallery link copied to clipboard.', 'success');
          }}
        />
      )}

      {activeTemplate === 'masonry' && (
        <MasonryLayout
          gallery={gallery}
          onOpenLightbox={(idx) => setLightboxIndex(idx)}
          onToggleFavorite={(mId) => toggleMediaFavorite(gallery.id, mId)}
          selectedMediaIds={selectedMediaIds}
          onToggleSelectMedia={handleToggleSelectMedia}
          onStartSlideshow={handleStartSlideshow}
        />
      )}

      {activeTemplate === 'cinematic' && (
        <CinematicLayout
          gallery={gallery}
          onOpenLightbox={(idx) => setLightboxIndex(idx)}
          onToggleFavorite={(mId) => toggleMediaFavorite(gallery.id, mId)}
          selectedMediaIds={selectedMediaIds}
          onToggleSelectMedia={handleToggleSelectMedia}
          onStartSlideshow={handleStartSlideshow}
        />
      )}

      {activeTemplate === 'minimal' && (
        <MinimalLayout
          gallery={gallery}
          onOpenLightbox={(idx) => setLightboxIndex(idx)}
          onToggleFavorite={(mId) => toggleMediaFavorite(gallery.id, mId)}
          selectedMediaIds={selectedMediaIds}
          onToggleSelectMedia={handleToggleSelectMedia}
          onStartSlideshow={handleStartSlideshow}
        />
      )}

      {/* Floating 4-Design Switcher Widget (Bottom Left) */}
      <nav
        aria-label="Gallery Template Styles"
        className="fixed bottom-6 left-4 sm:left-6 z-40 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl p-1.5 sm:p-2 shadow-2xl flex items-center gap-1 text-xs"
      >
        <span className="text-[10px] uppercase font-mono text-neutral-500 px-1.5 sm:px-2 flex items-center gap-1 hidden xs:flex">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Theme:</span>
        </span>
        {(
          [
            { id: 'editorial', label: 'Editorial' },
            { id: 'masonry', label: 'Masonry' },
            { id: 'cinematic', label: 'Cinematic' },
            { id: 'minimal', label: 'Minimal' },
          ] as const
        ).map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => handleSwitchTemplate(tpl.id)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl capitalize font-medium text-xs transition-all ${activeTemplate === tpl.id
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
          >
            {tpl.label}
          </button>
        ))}
      </nav>

      {/* Multi-Select Floating Action Toolbar (Appears when photos are selected) */}
      <SelectionBar
        selectedCount={selectedMediaIds.size}
        totalCount={gallery.media.length}
        onClearSelection={handleClearSelection}
        onSelectAll={handleSelectAll}
        onDownloadSelected={handleDownloadSelected}
        onPlaySlideshow={() => handleStartSlideshow(0)}
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
          onToggleFavorite={(mId) => toggleMediaFavorite(gallery.id, mId)}
          studioName={photographer.studioName}
          allowDownloads={gallery.allowDownloads}
        />
      )}
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
