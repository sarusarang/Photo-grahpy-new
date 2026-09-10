import React, { useState } from 'react';
import type { Gallery, MediaItem } from '../../types';
import { Film, Heart, ZoomIn, Eye } from 'lucide-react';

interface MasonryLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
}

export const MasonryLayout: React.FC<MasonryLayoutProps> = ({
  gallery,
  onOpenLightbox,
  onToggleFavorite,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'photos' | 'videos' | 'favorites'>('all');

  const filteredMedia = gallery.media.filter((item) => {
    if (activeFilter === 'photos') return item.type === 'photo';
    if (activeFilter === 'videos') return item.type === 'video';
    if (activeFilter === 'favorites') return item.isFavorite;
    return true;
  });

  return (
    <div className="bg-neutral-950 text-neutral-100 min-h-screen">
      {/* Modern Top Header */}
      <header className="border-b border-neutral-800/80 px-6 sm:px-12 py-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-amber-400 text-xs font-mono uppercase tracking-wider mb-3">
              <span>Masonry Exhibition</span>
              <span>•</span>
              <span>{gallery.eventDate}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-sans font-bold tracking-tight text-white">
              {gallery.title}
            </h1>
            <p className="text-neutral-400 text-sm mt-2">
              Captured for <strong className="text-neutral-200">{gallery.clientName}</strong> • {gallery.media.length} original frames
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 bg-neutral-900/80 p-1.5 rounded-2xl border border-neutral-800 self-start md:self-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All ({gallery.media.length})
            </button>
            <button
              onClick={() => setActiveFilter('photos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeFilter === 'photos'
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Photos ({gallery.media.filter((m) => m.type === 'photo').length})
            </button>
            {gallery.media.some((m) => m.type === 'video') && (
              <button
                onClick={() => setActiveFilter('videos')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  activeFilter === 'videos'
                    ? 'bg-amber-400 text-neutral-950 font-bold shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Videos
              </button>
            )}
            <button
              onClick={() => setActiveFilter('favorites')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeFilter === 'favorites'
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Starred
            </button>
          </div>
        </div>
      </header>

      {/* Multi-column Masonry CSS Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredMedia.map((item) => {
            const originalIndex = gallery.media.findIndex((m) => m.id === item.id);
            return (
              <div
                key={item.id}
                onClick={() => onOpenLightbox(originalIndex >= 0 ? originalIndex : 0)}
                className="group relative break-inside-avoid overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800/80 cursor-pointer shadow-lg hover:shadow-2xl hover:border-neutral-700 transition-all duration-300"
              >
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-auto object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
                />

                {/* Dark Vignette Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-5">
                  <div className="flex items-center justify-between">
                    {item.type === 'video' ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <Film className="w-3 h-3" /> Video Reel
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-neutral-400 tracking-wider">
                        {item.width} × {item.height}
                      </span>
                    )}

                    {onToggleFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item.id);
                        }}
                        className={`p-2 rounded-full backdrop-blur-md transition-transform hover:scale-110 ${
                          item.isFavorite
                            ? 'bg-rose-500 text-white'
                            : 'bg-black/60 text-white/80 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white tracking-wide">{item.title}</h4>
                    {item.caption && (
                      <p className="text-xs text-neutral-300 mt-1 line-clamp-2">{item.caption}</p>
                    )}
                    <div className="mt-3 flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Click to expand high-res</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-neutral-900 py-12 text-center text-xs text-neutral-500">
        <p>Masonry Presentation • High-Density Responsive Layout</p>
      </footer>
    </div>
  );
};
