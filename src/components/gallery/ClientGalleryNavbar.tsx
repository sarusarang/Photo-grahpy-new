import React from 'react';
import { Play, Download, Loader2 } from 'lucide-react';

export interface ClientGalleryNavbarProps {
  visible: boolean;
  studioName: string;
  galleryTitle: string;
  galleryId: string;
  allowDownloads?: boolean;
  mediaCount: number;
  isPreparingZip?: boolean;
  zipProgress?: number;
  onStartSlideshow: () => void;
  onDownloadAll: () => void;
}

/**
 * ClientGalleryNavbar Component
 * Glides smoothly into view with luxury ease when user scrolls down past the hero section.
 */
export const ClientGalleryNavbar: React.FC<ClientGalleryNavbarProps> = ({
  visible,
  studioName,
  galleryTitle,
  allowDownloads = true,
  mediaCount,
  isPreparingZip = false,
  zipProgress = 0,
  onStartSlideshow,
  onDownloadAll,
}) => {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 bg-neutral-950/85 backdrop-blur-xl border-b border-neutral-800/70 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 text-white text-xs transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible
          ? 'translate-y-0 opacity-100 shadow-2xl shadow-black/60 pointer-events-auto scale-100'
          : '-translate-y-full opacity-0 pointer-events-none scale-[0.98]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5 text-white shrink-0">
          <img
            src="/ex-share-white-logo.png"
            alt="EX SHARE"
            className="h-5 w-auto object-contain opacity-90"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-serif font-bold uppercase tracking-widest text-xs text-neutral-200 hidden xs:inline">
            {studioName || 'EX SHARE'}
          </span>
        </div>
        <span className="text-neutral-700 hidden sm:inline">/</span>
        <span className="text-neutral-300 truncate max-w-[160px] sm:max-w-xs font-medium">
          {galleryTitle}
        </span>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick Slideshow Trigger */}
        <button
          onClick={onStartSlideshow}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-amber-300 transition-colors text-xs font-medium cursor-pointer"
          title="Start Fullscreen Slideshow"
        >
          <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
          <span className="hidden sm:inline">Slideshow</span>
        </button>

        {/* Download All ZIP Action */}
        {allowDownloads && (
          <button
            onClick={onDownloadAll}
            disabled={isPreparingZip}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isPreparingZip ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Packaging ({zipProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Download All ({mediaCount})</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
