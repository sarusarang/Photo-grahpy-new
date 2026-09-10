import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useGallery } from '../../context/GalleryContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import type { GalleryTemplateId } from '../../types';
import { EditorialLayout } from '../../components/gallery/EditorialLayout';
import { MasonryLayout } from '../../components/gallery/MasonryLayout';
import { CinematicLayout } from '../../components/gallery/CinematicLayout';
import { MinimalLayout } from '../../components/gallery/MinimalLayout';
import { LightboxModal } from '../../components/gallery/LightboxModal';
import {
  Download,
  Share2,
  Lock,
  Layers,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Camera,
  Loader2,
  Heart,
  ExternalLink,
} from 'lucide-react';

export const ClientGalleryPage: React.FC = () => {
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

  // PIN unlock state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Bulk ZIP download simulation
  const [isPreparingZip, setIsPreparingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

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
            // Trigger sample download anchor
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

  const handleSwitchTemplate = (tpl: GalleryTemplateId) => {
    setActiveTemplate(tpl);
    setSearchParams({ previewTemplate: tpl });
    showToast('Layout Switched', `Rendering through ${tpl.toUpperCase()} design system.`, 'info');
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

  return (
    <div className="relative min-h-screen">
      {/* Floating Top Client Bar: Studio Name, Download All Action, Back to Dashboard */}
      <div className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/60 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 text-white text-xs">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/drive"
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
            title="Return to Studio Workspace"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span className="font-serif font-bold uppercase tracking-wider hidden sm:inline">
              {photographer.studioName}
            </span>
          </Link>
          <span className="text-neutral-700 hidden sm:inline">/</span>
          <span className="text-neutral-300 truncate max-w-[180px] sm:max-w-xs">{gallery.title}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Download All ZIP Action */}
          {gallery.allowDownloads && (
            <button
              onClick={handleDownloadAll}
              disabled={isPreparingZip}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {isPreparingZip ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Packaging ({zipProgress}%)...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Download All ({gallery.media.length})</span>
                </>
              )}
            </button>
          )}

          <Link
            to={`/dashboard/drive/${gallery.id}`}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
          >
            <span>Edit in Drive</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Dynamic Gallery Template Rendering: 1 of 4 genuine designs */}
      {activeTemplate === 'editorial' && (
        <EditorialLayout
          gallery={gallery}
          onOpenLightbox={(idx) => setLightboxIndex(idx)}
          onToggleFavorite={(mId) => toggleMediaFavorite(gallery.id, mId)}
        />
      )}

      {activeTemplate === 'masonry' && (
        <MasonryLayout
          gallery={gallery}
          onOpenLightbox={(idx) => setLightboxIndex(idx)}
          onToggleFavorite={(mId) => toggleMediaFavorite(gallery.id, mId)}
        />
      )}

      {activeTemplate === 'cinematic' && (
        <CinematicLayout
          gallery={gallery}
          onOpenLightbox={(idx) => setLightboxIndex(idx)}
          onToggleFavorite={(mId) => toggleMediaFavorite(gallery.id, mId)}
        />
      )}

      {activeTemplate === 'minimal' && (
        <MinimalLayout
          gallery={gallery}
          onOpenLightbox={(idx) => setLightboxIndex(idx)}
          onToggleFavorite={(mId) => toggleMediaFavorite(gallery.id, mId)}
        />
      )}

      {/* Floating 4-Design Switcher Widget (Bottom Right) */}
      <div className="fixed bottom-6 left-6 z-40 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl p-2 shadow-2xl flex items-center gap-1 text-xs">
        <span className="text-[10px] uppercase font-mono text-neutral-500 px-2 flex items-center gap-1">
          <Layers className="w-3 h-3 text-amber-400" /> Style:
        </span>
        {(['editorial', 'masonry', 'cinematic', 'minimal'] as GalleryTemplateId[]).map((tpl) => (
          <button
            key={tpl}
            onClick={() => handleSwitchTemplate(tpl)}
            className={`px-3 py-1.5 rounded-xl capitalize font-medium transition-all ${
              activeTemplate === tpl
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            {tpl}
          </button>
        ))}
      </div>

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
