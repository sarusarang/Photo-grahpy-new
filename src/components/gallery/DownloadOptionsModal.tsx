import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { MediaItem } from '@/types';
import type { WatermarkDownloadOptions } from '@/utils/downloadUtils';
import {
  Download,
  X,
  Sparkles,
  Image as ImageIcon,
  FileArchive,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export type DownloadFormatChoice = 'original' | 'web';

export interface DownloadOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Single media item (if downloading 1 photo) */
  item?: MediaItem | null;
  /** Array of media items (if downloading multiple / selected / all) */
  items?: MediaItem[];
  /** Total count of items (overrides loaded items count for paginated galleries) */
  totalCount?: number;
  /** Optional title for the collection or archive */
  galleryTitle?: string;
  /** Watermark settings from gallery */
  watermarkOptions?: WatermarkDownloadOptions;
  /** Whether to show the watermark toggle switch (default: true) */
  showWatermarkToggle?: boolean;
  /** Execution callback when user confirms */
  onConfirmDownload: (options: {
    format: DownloadFormatChoice;
    withWatermark: boolean;
    onProgress?: (percent: number, statusText?: string) => void;
  }) => Promise<void>;
  /** Optional theme override */
  theme?: 'dark' | 'light' | string;
}

export const DownloadOptionsModal: React.FC<DownloadOptionsModalProps> = ({
  isOpen,
  onClose,
  item,
  items,
  totalCount,
  galleryTitle,
  watermarkOptions: _watermarkOptions,
  showWatermarkToggle: _showWatermarkToggle = false,
  onConfirmDownload,
  theme,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormatChoice>('original');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState('');

  if (!isOpen) return null;

  const isMultiple = Boolean(!item && ((totalCount && totalCount > 1) || (items && items.length > 1)));
  const count = !item ? (totalCount ?? (items ? items.length : 1)) : 1;
  const singleItem = item || (!totalCount && items && items.length === 1 ? items[0] : null);

  // Determine dark or light mode based on DOM or theme prop
  const isDark =
    theme === 'dark' ||
    (theme !== 'light' &&
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark'));

  const handleStartDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(2);
    setDownloadStatusText('Initiating download...');
    try {
      await onConfirmDownload({
        format: selectedFormat,
        withWatermark: false,
        onProgress: (percent, statusText) => {
          setDownloadProgress(percent);
          if (statusText) setDownloadStatusText(statusText);
        },
      });
      // Modal closes ONLY after download packaging finishes and browser download initiates
      onClose();
    } catch (err) {
      console.error('Download option execution failed:', err);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setDownloadStatusText('');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 select-none">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-200"
        onClick={() => !isDownloading && onClose()}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-lg rounded-3xl p-5 sm:p-7 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 border ${
          isDark
            ? 'bg-[#0f1015] border-white/10 text-white shadow-black/80'
            : 'bg-white border-neutral-200 text-neutral-900 shadow-xl'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDownloading}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
            isDownloading ? 'opacity-30 cursor-not-allowed' : isDark
              ? 'hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer'
              : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer'
          }`}
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}
          >
            {isMultiple ? (
              <FileArchive className="w-6 h-6 stroke-[2]" />
            ) : (
              <Download className="w-6 h-6 stroke-[2]" />
            )}
          </div>
          <div className="min-w-0 pr-6">
            <h3 className="text-base sm:text-lg font-serif font-bold tracking-tight truncate">
              {isMultiple
                ? `Download ${count} Photographs`
                : singleItem?.title || 'Download Photograph'}
            </h3>
            <p className={`text-xs truncate ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {isMultiple
                ? `Bundle into high-speed ZIP archive • ${galleryTitle || 'Gallery'}`
                : `Choose your preferred resolution & format • ${singleItem?.width || 2400}×${singleItem?.height || 1600}px`}
            </p>
          </div>
        </div>

        {/* Format Selector Cards */}
        <div className="space-y-3 mb-5">
          <label className={`text-[11px] font-mono uppercase tracking-widest block font-semibold ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Select Resolution & Format
          </label>

          {/* Option 1: Original / RAW Resolution */}
          <div
            onClick={() => !isDownloading && setSelectedFormat('original')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              selectedFormat === 'original'
                ? isDark
                  ? 'bg-amber-400/10 border-amber-400 text-white shadow-lg shadow-amber-500/5 ring-1 ring-amber-400'
                  : 'bg-amber-50/70 border-amber-500 text-neutral-900 shadow-md ring-1 ring-amber-500'
                : isDark
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-neutral-300'
                : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100/80 text-neutral-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                selectedFormat === 'original'
                  ? 'bg-amber-400 border-amber-400 text-neutral-950'
                  : isDark
                  ? 'border-neutral-600'
                  : 'border-neutral-300'
              }`}
            >
              {selectedFormat === 'original' && <CheckCircle2 className="w-4 h-4 fill-amber-400 text-neutral-950" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Original Resolution (RAW / Master Quality)
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                    isDark ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Best for Print
                </span>
              </div>
              <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Full camera sensor fidelity, uncompressed original master file. Ideal for large prints, albums, and client archives.
              </p>
              {singleItem?.sizeMB && (
                <span className={`inline-block text-[10px] font-mono mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  File size: ~{singleItem.sizeMB} MB
                </span>
              )}
            </div>
          </div>

          {/* Option 2: High-Quality Web JPEG */}
          <div
            onClick={() => !isDownloading && setSelectedFormat('web')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              selectedFormat === 'web'
                ? isDark
                  ? 'bg-amber-400/10 border-amber-400 text-white shadow-lg shadow-amber-500/5 ring-1 ring-amber-400'
                  : 'bg-amber-50/70 border-amber-500 text-neutral-900 shadow-md ring-1 ring-amber-500'
                : isDark
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-neutral-300'
                : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100/80 text-neutral-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                selectedFormat === 'web'
                  ? 'bg-amber-400 border-amber-400 text-neutral-950'
                  : isDark
                  ? 'border-neutral-600'
                  : 'border-neutral-300'
              }`}
            >
              {selectedFormat === 'web' && <CheckCircle2 className="w-4 h-4 fill-amber-400 text-neutral-950" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                  High-Quality Web JPEG (Optimized)
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                    isDark ? 'bg-sky-400/20 text-sky-300' : 'bg-sky-100 text-sky-800'
                  }`}
                >
                  Fast & Universal
                </span>
              </div>
              <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Sharpened and compressed for instant sharing on WhatsApp, Instagram, mobile devices, and fast web browsing.
              </p>
            </div>
          </div>
        </div>

        {/* Live Loading & Progress Bar (Visible while packaging / downloading) */}
        {isDownloading && (
          <div
            className={`p-4 rounded-2xl border mb-5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
              isDark ? 'bg-white/5 border-amber-400/30' : 'bg-amber-50/80 border-amber-300/80'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-amber-500 dark:text-amber-400 flex items-center gap-2 truncate">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-amber-500" />
                <span className="truncate">{downloadStatusText || 'Packaging archive...'}</span>
              </span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 ml-2 shrink-0">
                {downloadProgress}%
              </span>
            </div>

            <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-2 rounded-full transition-all duration-300 ease-out shadow-sm shadow-amber-500/50"
                style={{ width: `${Math.max(4, downloadProgress)}%` }}
              />
            </div>
            <p className={`text-[10px] mt-2 font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              Please wait while your files are processed. Download will start automatically.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              isDownloading
                ? 'opacity-40 cursor-not-allowed bg-neutral-800 text-neutral-500'
                : isDark
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer'
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStartDownload}
            disabled={isDownloading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-400/20 active:scale-95 transition-all cursor-pointer disabled:opacity-80 disabled:cursor-wait"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                <span>
                  {downloadProgress > 0 ? `Packaging... (${downloadProgress}%)` : 'Preparing Download...'}
                </span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 stroke-[2.2]" />
                <span>
                  {isMultiple
                    ? `Download ZIP (${count} Photos)`
                    : 'Download Photograph'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
