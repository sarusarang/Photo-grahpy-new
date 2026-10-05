import React from 'react';
import type { MediaItem } from '../../../types';
import { ExternalLink, Sparkles } from 'lucide-react';

interface MediaPreviewCardProps {
  currentItem: MediaItem;
  mediaItems: MediaItem[];
  activePreviewIndex: number;
  onSelectIndex: (index: number) => void;
  shareUrl: string;
}

export const MediaPreviewCard: React.FC<MediaPreviewCardProps> = ({
  currentItem,
  mediaItems,
  activePreviewIndex,
  onSelectIndex,
}) => {
  const isMultiple = mediaItems.length > 1;

  return (
    <div className="p-3 sm:p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 flex flex-col gap-2.5">
      {/* Header Badge */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Photo Preview</span>
        </span>
        {isMultiple && (
          <span className="text-[10px] font-mono text-amber-400 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
            {activePreviewIndex + 1} of {mediaItems.length}
          </span>
        )}
      </div>

      {/* Main Photo Display Area */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center">
        <img
          src={currentItem.url || currentItem.thumbnailUrl}
          alt={currentItem.title || 'Photograph'}
          className="w-full h-full object-cover animate-in fade-in duration-200"
        />

        {currentItem.type === 'video' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-amber-400 border border-white/10">
              4K Video
            </span>
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
            className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
            title="Open original photograph in new tab"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open</span>
          </a>
        </div>

        {currentItem.caption && (
          <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5 font-light">{currentItem.caption}</p>
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
              {mediaItems.length} selected
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
                onClick={() => onSelectIndex(idx)}
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
