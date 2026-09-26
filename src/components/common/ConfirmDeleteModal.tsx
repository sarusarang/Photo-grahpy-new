import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, X, Image as ImageIcon, Film, Loader2 } from 'lucide-react';
import type { MediaItem } from '../../types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDeleting?: boolean;
  /** Single media item being deleted (shows preview) */
  item?: MediaItem | null;
  /** Multiple media items being deleted (shows stack preview) */
  items?: MediaItem[];
  itemCount?: number;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDeleting = false,
  item,
  items,
  itemCount,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && !isDeleting) {
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm, isDeleting]);

  if (!isOpen) return null;

  const count = itemCount ?? (items ? items.length : item ? 1 : 0);
  const displayTitle =
    title ||
    (count > 1 ? `Delete ${count} Photos` : item?.title ? `Delete "${item.title}"` : 'Delete Item');

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md overlay-animate select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-[#121319] border border-neutral-200 dark:border-neutral-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-neutral-900/10 dark:shadow-black/70 overflow-hidden modal-animate text-neutral-900 dark:text-neutral-100 my-auto">
        {/* Soft Crimson Ambient Top Wash */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-rose-500/15 via-rose-500/5 to-transparent pointer-events-none" />

        {/* Header with Danger Icon & Close Button */}
        <div className="relative flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-500/10">
              <Trash2 className="w-5 h-5 stroke-[2.2] animate-in zoom-in-75 duration-300" />
              <div className="absolute -inset-1 rounded-2xl bg-rose-500/20 dark:bg-rose-500/30 blur-sm -z-10" />
            </div>

            <div>
              <h3
                id="confirm-modal-title"
                className="text-lg sm:text-xl font-serif font-bold text-neutral-900 dark:text-white tracking-tight"
              >
                {displayTitle}
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400/90 font-mono tracking-wide uppercase font-semibold">
                Permanent Action
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors"
            title="Cancel and close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Explanatory Message */}
        <p className="relative text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
          {description}
        </p>

        {/* Single Item Preview Card (if applicable) */}
        {item && (
          <div className="relative mb-5 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 flex items-center gap-3.5 group">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 ring-1 ring-black/5 dark:ring-white/10">
              <img
                src={item.url || item.thumbnailUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-1 right-1 p-0.5 rounded bg-black/60 text-white backdrop-blur-sm">
                {item.type === 'video' ? (
                  <Film className="w-2.5 h-2.5 text-amber-400" />
                ) : (
                  <ImageIcon className="w-2.5 h-2.5 text-neutral-300" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white truncate">
                {item.title}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                {item.width && item.height && (
                  <span>
                    {item.width}×{item.height}
                  </span>
                )}
                {item.sizeMB && (
                  <>
                    <span>•</span>
                    <span>{item.sizeMB} MB</span>
                  </>
                )}
                <span>•</span>
                <span className="capitalize">{item.type || 'photo'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Multiple Items Stack Preview (if applicable) */}
        {items && items.length > 0 && (
          <div className="relative mb-5 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-mono font-semibold text-neutral-500 dark:text-neutral-400">
                Selected for removal ({items.length})
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-hidden py-1">
              {items.slice(0, 5).map((previewItem, idx) => (
                <div
                  key={previewItem.id || idx}
                  className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-black/10 dark:ring-white/10 shadow-sm"
                >
                  <img
                    src={previewItem.thumbnailUrl || previewItem.url}
                    alt={previewItem.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {items.length > 5 && (
                <div className="w-11 h-11 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 flex-shrink-0 ring-1 ring-black/10 dark:ring-white/10">
                  +{items.length - 5}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warning Note Pill */}
        <div className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] mb-6">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <span>This file will be permanently erased from this gallery.</span>
        </div>

        {/* Action Buttons */}
        <div className="relative flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-all active:scale-[0.98]"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 sm:flex-none px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold tracking-wide shadow-lg shadow-rose-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            )}
            <span>{isDeleting ? 'Deleting...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
