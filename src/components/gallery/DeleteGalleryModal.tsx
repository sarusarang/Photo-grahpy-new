import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Archive,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  Film,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import type { Gallery } from '@/types';
import { getInitialGalleryCover, handleCoverImageError } from '@/utils/coverImageUtils';

export interface DeleteGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  gallery: Gallery | null;
  /**
   * 'archive': Soft delete. Moves to Archive / Trash. Reversible.
   * 'permanent': Hard delete. Permanently purges media from database and storage.
   */
  mode?: 'archive' | 'permanent';
  isProcessing?: boolean;
}

export const DeleteGalleryModal: React.FC<DeleteGalleryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  gallery,
  mode = 'archive',
  isProcessing = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
      if (e.key === 'Enter' && !isProcessing) {
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm, isProcessing]);

  if (!isOpen || !gallery) return null;

  const isArchive = mode === 'archive';

  // Calculate gallery stats
  const photosCount =
    gallery.photosCount ??
    (gallery.media ? gallery.media.filter((m) => m.type !== 'video').length : 0);
  const videosCount =
    gallery.videosCount ??
    (gallery.media ? gallery.media.filter((m) => m.type === 'video').length : 0);
  const totalCount = photosCount + videosCount;

  const sizeMB =
    gallery.media && gallery.media.length > 0
      ? Math.round(gallery.media.reduce((acc, m: any) => acc + (m.sizeMB || m.size || 5), 0))
      : Math.round(photosCount * 4.5 + videosCount * 25);

  const fallbackCover = getInitialGalleryCover(gallery.templateId);
  const coverUrl = gallery.coverImage || fallbackCover;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-gallery-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 dark:bg-black/85 backdrop-blur-md overlay-animate select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-neutral-900/20 dark:shadow-black/80 overflow-hidden modal-animate text-neutral-900 dark:text-neutral-100 my-auto">
        {/* Soft Ambient Wash at top */}
        <div
          className={`absolute top-0 left-0 right-0 h-32 pointer-events-none transition-all ${
            isArchive
              ? 'bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent'
              : 'bg-gradient-to-b from-rose-500/20 via-rose-500/5 to-transparent'
          }`}
        />

        {/* Header with Icon, Title, and Close Button */}
        <div className="relative flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            {isArchive ? (
              <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-lg shadow-amber-500/10">
                <Archive className="w-5 h-5 stroke-[2.2] animate-in zoom-in-75 duration-300" />
                <div className="absolute -inset-1 rounded-2xl bg-amber-500/20 dark:bg-amber-500/30 blur-sm -z-10" />
              </div>
            ) : (
              <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl bg-rose-500/15 dark:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-500/15">
                <Trash2 className="w-5 h-5 stroke-[2.2] animate-in zoom-in-75 duration-300" />
                <div className="absolute -inset-1 rounded-2xl bg-rose-500/20 dark:bg-rose-500/30 blur-sm -z-10" />
              </div>
            )}

            <div>
              <h3
                id="delete-gallery-title"
                className="text-lg sm:text-xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight"
              >
                {isArchive ? 'Move Gallery to Archive?' : 'Permanently Delete Gallery?'}
              </h3>
              <p
                className={`text-[10px] sm:text-xs font-mono tracking-wider uppercase font-bold mt-0.5 ${
                  isArchive
                    ? 'text-amber-600 dark:text-amber-400/90'
                    : 'text-rose-600 dark:text-rose-400/90'
                }`}
              >
                {isArchive ? 'Safe Archive • Can Be Restored' : 'Irreversible Action • Cannot Be Undone'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer disabled:opacity-50"
            title="Cancel and close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explanatory Description */}
        <p className="relative text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
          {isArchive ? (
            <>
              Move <strong className="text-neutral-900 dark:text-white font-semibold">"{gallery.title}"</strong> to Archive / Trash? It will be hidden from client view and retained for 15 days before automatic permanent deletion.
            </>
          ) : (
            <>
              Permanently delete <strong className="text-neutral-900 dark:text-white font-semibold">"{gallery.title}"</strong>? All {totalCount} assets ({photosCount} photos, {videosCount} videos) will be permanently purged from cloud storage.
            </>
          )}
        </p>

        {/* Gallery Snapshot Card Preview */}
        <div
          className={`relative mb-4 p-3 sm:p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border transition-all ${
            isArchive
              ? 'border-neutral-200/90 dark:border-neutral-800'
              : 'border-rose-500/30 dark:border-rose-500/20 bg-rose-500/[0.02]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            {/* Thumbnail */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 ring-1 ring-black/5 dark:ring-white/10">
              <img
                src={coverUrl}
                alt={gallery.title}
                onError={(e) => handleCoverImageError(e, fallbackCover)}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-mono font-bold text-amber-300 uppercase">
                {gallery.templateId}
              </div>
            </div>

            {/* Gallery Info & Badges */}
            <div className="flex-1 min-w-0 space-y-1">
              <h4 className="font-serif font-bold text-sm sm:text-base text-neutral-900 dark:text-white truncate">
                {gallery.title}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                Client: {gallery.clientName || 'Valued Client'}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-neutral-600 dark:text-neutral-300">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-200/70 dark:bg-neutral-800 border border-neutral-300/60 dark:border-neutral-700/60">
                  <ImageIcon className="w-3 h-3 text-neutral-400" />
                  {photosCount} photos
                </span>
                {videosCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-200/70 dark:bg-neutral-800 border border-neutral-300/60 dark:border-neutral-700/60">
                    <Film className="w-3 h-3 text-amber-500" />
                    {videosCount} videos
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-200/70 dark:bg-neutral-800 border border-neutral-300/60 dark:border-neutral-700/60">
                  <HardDrive className="w-3 h-3 text-neutral-400" />
                  {sizeMB} MB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Notice / Callout */}
        <div
          className={`relative mb-6 p-3 rounded-xl border text-xs leading-relaxed flex items-center gap-2.5 ${
            isArchive
              ? 'bg-amber-400/10 dark:bg-amber-400/10 border-amber-400/25 text-amber-800 dark:text-amber-300'
              : 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          {isArchive ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Reversible for 15 days:</strong> You can restore this gallery at any time from your Archive tab.
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>
                <strong>Irreversible:</strong> Cloud storage files and public shared links will be permanently deleted.
              </span>
            </>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="relative flex items-center justify-end gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          {isArchive ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Archiving...</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5 stroke-[2.4]" />
                  <span>Move to Archive</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting Forever...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.4]" />
                  <span>Delete Permanently</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
