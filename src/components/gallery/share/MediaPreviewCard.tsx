import React from 'react';
import type { MediaItem } from '../../../types';
import { QrCode, Image as ImageIcon, ExternalLink } from 'lucide-react';

interface MediaPreviewCardProps {
  currentItem: MediaItem;
  mediaItems: MediaItem[];
  activePreviewIndex: number;
  onSelectIndex: (index: number) => void;
  shareUrl: string;
  viewMode: 'preview' | 'qr';
  onToggleViewMode: (mode: 'preview' | 'qr') => void;
}

export const MediaPreviewCard: React.FC<MediaPreviewCardProps> = ({
  currentItem,
  mediaItems,
  activePreviewIndex,
  onSelectIndex,
  shareUrl,
  viewMode,
  onToggleViewMode,
}) => {
  const isMultiple = mediaItems.length > 1;

  return (
    <div className="p-3 sm:p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 flex flex-col gap-2.5">
      {/* Segmented View Switcher: Photo vs QR Code */}
      <div className="flex items-center p-1 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs shrink-0">
        <button
          type="button"
          onClick={() => onToggleViewMode('preview')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
            viewMode === 'preview'
              ? 'bg-neutral-800 text-white shadow-sm font-semibold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-neutral-300" />
          <span>Photo Preview</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleViewMode('qr')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
            viewMode === 'qr'
              ? 'bg-amber-400 text-neutral-950 shadow-sm font-bold'
              : 'text-neutral-400 hover:text-amber-300'
          }`}
        >
          <QrCode className="w-3.5 h-3.5 text-amber-500" />
          <span>QR Code</span>
        </button>
      </div>

      {/* Main Display Area (Photo Preview or QR Code) */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center">
        {viewMode === 'preview' ? (
          <>
            <img
              src={currentItem.url || currentItem.thumbnailUrl}
              alt={currentItem.title}
              className="w-full h-full object-cover animate-in fade-in duration-200"
            />

            {currentItem.type === 'video' && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-amber-400 border border-white/10">
                  4K Video
                </span>
              </div>
            )}

            {isMultiple && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[10px] font-mono text-amber-400 border border-white/10">
                {activePreviewIndex + 1} / {mediaItems.length}
              </div>
            )}
          </>
        ) : (
          /* QR Code View inside the exact same container */
          <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900 to-neutral-950 text-center animate-in zoom-in-95 duration-200">
            <div className="p-2.5 bg-white rounded-xl shadow-lg ring-2 ring-white/10">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                  shareUrl
                )}`}
                alt="QR Code"
                className="w-28 h-28 sm:w-32 sm:h-32 block"
              />
            </div>
            <p className="text-[11px] font-semibold text-neutral-200 mt-2.5">
              Scan with phone camera to open
            </p>
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
            {currentItem.title || (isMultiple ? `Photo ${activePreviewIndex + 1}` : 'Photo')}
          </h4>
          <a
            href={currentItem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-amber-400 transition-colors shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open</span>
          </a>
        </div>

        {currentItem.caption && (
          <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{currentItem.caption}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] font-mono text-neutral-400">
          {currentItem.width && currentItem.height && (
            <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700/50">
              {currentItem.width}×{currentItem.height}
            </span>
          )}
          {currentItem.sizeMB && (
            <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700/50">
              {currentItem.sizeMB} MB
            </span>
          )}
          {isMultiple && (
            <span className="px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 font-sans font-medium">
              {mediaItems.length} in set
            </span>
          )}
        </div>
      </div>

      {/* Multi-photo Thumbnail Strip (Only if multiple selected) */}
      {isMultiple && (
        <div className="pt-2 border-t border-neutral-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {mediaItems.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => {
                  onSelectIndex(idx);
                  if (viewMode === 'qr') onToggleViewMode('preview');
                }}
                className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden shrink-0 border transition-all cursor-pointer ${
                  idx === activePreviewIndex
                    ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105 opacity-100'
                    : 'border-neutral-800 opacity-60 hover:opacity-100'
                }`}
                title={item.title}
              >
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
