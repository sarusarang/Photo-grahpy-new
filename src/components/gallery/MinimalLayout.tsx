import React from 'react';
import type { Gallery } from '../../types';
import { Heart } from 'lucide-react';

interface MinimalLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
}

export const MinimalLayout: React.FC<MinimalLayoutProps> = ({
  gallery,
  onOpenLightbox,
  onToggleFavorite,
}) => {
  return (
    <div className="bg-[#f7f7f7] text-[#111111] min-h-screen">
      {/* Pristine Minimalist Header */}
      <header className="max-w-7xl mx-auto px-6 sm:px-12 pt-20 pb-16 border-b border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 block mb-2">
              Architectural & Fine Art Documentation
            </span>
            <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-neutral-900">
              {gallery.title}
            </h1>
          </div>
          <div className="text-left sm:text-right text-xs text-neutral-400 font-mono space-y-1">
            <p className="text-neutral-700 font-medium">{gallery.clientName}</p>
            <p>{gallery.eventDate}</p>
            <p>{gallery.media.length} Plates</p>
          </div>
        </div>
      </header>

      {/* Spacious Clean Grid with Fine Hairline Separations */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 sm:gap-16">
          {gallery.media.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => onOpenLightbox(idx)}
              className="group cursor-pointer flex flex-col justify-between"
            >
              <div className="relative overflow-hidden bg-neutral-200 aspect-[3/4] p-3 border border-neutral-300/80 rounded-sm shadow-xs group-hover:shadow-md transition-shadow">
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                />

                {onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                    className={`absolute top-5 right-5 p-2 rounded-full backdrop-blur-sm transition-opacity ${
                      item.isFavorite
                        ? 'bg-rose-500 text-white opacity-100'
                        : 'bg-white/90 text-neutral-600 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                <span className="truncate pr-2 uppercase tracking-wider">{item.title}</span>
                <span className="shrink-0 text-neutral-400">
                  {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-neutral-200 py-16 text-center text-xs text-neutral-400 font-mono">
        <p>Gallery Series MMXXVI • All rights reserved</p>
      </footer>
    </div>
  );
};
