import React from 'react';
import { Play, Download, Loader2, Clock, Film, Mail, Heart } from 'lucide-react';
import { FullscreenButton } from '../common/FullscreenButton';
import type { GalleryGridDesign } from './UniversalPhotoGrid';

export interface ClientGalleryNavbarProps {
  visible?: boolean;
  isScrolled?: boolean;
  studioName: string;
  photographerName?: string;
  galleryTitle: string;
  galleryId: string;
  allowDownloads?: boolean;
  mediaCount: number;
  isPreparingZip?: boolean;
  zipProgress?: number;
  expiryText?: string;
  gridDesign?: GalleryGridDesign;
  onSelectGridDesign?: (design: GalleryGridDesign) => void;
  onStartSlideshow: () => void;
  onDownloadAll: () => void;
  onCreateStoryVideo?: () => void;
  onOpenContact?: () => void;
  viewerEmail?: string;
  favoritesCount?: number;
  onOpenViewerAuth?: () => void;
  onLogoutViewer?: () => void;
  onToggleFavoritesSection?: () => void;
  isFavoritesSectionActive?: boolean;
}

/**
 * ClientGalleryNavbar Component
 * Glides smoothly into view with luxury ease when user scrolls down past the hero section.
 */
export const ClientGalleryNavbar: React.FC<ClientGalleryNavbarProps> = ({
  isScrolled = false,
  studioName,
  photographerName,
  galleryTitle,
  allowDownloads = true,
  mediaCount,
  isPreparingZip = false,
  zipProgress = 0,
  expiryText,
  onStartSlideshow,
  onDownloadAll,
  onCreateStoryVideo,
  onOpenContact,
  viewerEmail,
  favoritesCount = 0,
  onOpenViewerAuth,
  onLogoutViewer,
  onToggleFavoritesSection,
  isFavoritesSectionActive = false,
}) => {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-4 text-white text-xs transition-all duration-300 ease-out select-none ${
        isScrolled
          ? 'translate-y-0 opacity-100 pointer-events-auto bg-neutral-950/95 backdrop-blur-2xl border-b border-neutral-800/90 shadow-2xl shadow-black/80'
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
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
            {studioName || photographerName || 'EX SHARE'}
          </span>
        </div>
        <span className="text-neutral-700 hidden sm:inline">/</span>
        <span className="text-neutral-300 truncate max-w-[110px] xs:max-w-[160px] sm:max-w-xs font-medium text-xs">
          {galleryTitle}
        </span>
        {expiryText && (
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-amber-500/30 text-amber-300 text-[10px] font-mono shrink-0">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{expiryText}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Fullscreen Toggle */}
        <FullscreenButton theme="navbar" showLabel={false} compact={true} />

        {/* Quick Liked Filter Trigger */}
        {onToggleFavoritesSection && (
          <button
            type="button"
            onClick={onToggleFavoritesSection}
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer active:scale-95 transition-all ${
              isFavoritesSectionActive
                ? 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-500/30'
                : 'bg-neutral-900/90 hover:bg-neutral-800 border-neutral-700/60 text-neutral-300 hover:text-white'
            }`}
            title="View your Liked photos"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isFavoritesSectionActive
                  ? 'fill-white text-white'
                  : favoritesCount > 0
                  ? 'fill-rose-500 text-rose-500'
                  : 'text-neutral-400'
              }`}
            />
            <span className="hidden sm:inline">Liked</span>
            {favoritesCount > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                  isFavoritesSectionActive
                    ? 'bg-white/20 text-white'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {favoritesCount}
              </span>
            )}
          </button>
        )}

        {/* Viewer Identity / Sign In Pill */}
        {viewerEmail ? (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/90 border border-neutral-700/60 text-[11px] font-mono text-neutral-300 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate max-w-[110px]" title={`Favorites saved under ${viewerEmail}`}>
              {viewerEmail}
            </span>
            {onLogoutViewer && (
              <button
                type="button"
                onClick={onLogoutViewer}
                className="text-neutral-500 hover:text-rose-400 transition-colors ml-0.5 cursor-pointer"
                title="Sign out of favorites"
              >
                ×
              </button>
            )}
          </div>
        ) : onOpenViewerAuth ? (
          <button
            type="button"
            onClick={onOpenViewerAuth}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/60 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer shadow-sm"
            title="Sign in with email to save your favorites"
          >
            <Heart className="w-3 h-3 text-rose-400" />
            <span>Sign In</span>
          </button>
        ) : null}

        {/* Quick Slideshow Trigger */}
        <button
          onClick={onStartSlideshow}
          className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-amber-300 transition-colors text-xs font-medium cursor-pointer active:scale-95"
          title="Start Fullscreen Slideshow"
        >
          <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
          <span className="hidden sm:inline">Slideshow</span>
        </button>

        {/* Story Video Creator Trigger */}
        {onCreateStoryVideo && (
          <button
            onClick={onCreateStoryVideo}
            className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 text-amber-300 hover:text-white transition-all text-xs font-bold cursor-pointer active:scale-95 shadow-sm"
            title="Create Social Reel / Story Video with Music"
          >
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Make Reel</span>
          </button>
        )}

        {/* Studio Inquire / Book Trigger */}
        {onOpenContact && (
          <button
            onClick={onOpenContact}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-amber-400/40 text-amber-300 hover:text-white transition-all text-xs font-semibold cursor-pointer active:scale-95 shadow-xs"
            title="Directly inquire or book the studio"
          >
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Inquire</span>
          </button>
        )}

        {/* Download All ZIP Action */}
        {allowDownloads && (
          <button
            onClick={onDownloadAll}
            disabled={isPreparingZip}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
            title="Download all photographs as ZIP"
          >
            {isPreparingZip ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden xs:inline">Packaging</span>
                <span>({zipProgress}%)</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 stroke-[2.2]" />
                <span className="hidden xs:inline">Download</span>
                <span>All ({mediaCount})</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
