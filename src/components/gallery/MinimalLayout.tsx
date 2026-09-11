import React from 'react';
import type { Gallery } from '../../types';
import {
  Heart,
  Play,
  Check,
  Calendar,
  Sparkles,
  Maximize2,
} from 'lucide-react';

interface MinimalLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
  selectedMediaIds?: Set<string>;
  onToggleSelectMedia?: (mediaId: string) => void;
  onStartSlideshow?: (startIndex?: number) => void;
}

export const MinimalLayout: React.FC<MinimalLayoutProps> = ({
  gallery,
  onOpenLightbox,
  onToggleFavorite,
  selectedMediaIds = new Set(),
  onToggleSelectMedia,
  onStartSlideshow,
}) => {
  return (
    <div className="bg-[#F8F8F6] text-[#1A1A1A] min-h-screen selection:bg-neutral-800 selection:text-white font-sans antialiased">
      {/* ─── SCANDINAVIAN FINE ART MUSEUM HERO BANNER ─── */}
      <header className="border-b border-neutral-200/80 bg-white/60 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-16 pb-14">
          <div className="flex items-center justify-between text-[11px] font-mono tracking-[0.25em] uppercase text-neutral-400 border-b border-neutral-200 pb-4 mb-10">
            <span>Fine Art Exhibition Archive</span>
            <span>MMXXVI</span>
            <span>Villa Balbiano Series</span>
          </div>

          <div className="max-w-3xl space-y-6">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-500 block">
              Permanent Collection No. 04
            </span>

            <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-neutral-900 leading-[1.1]">
              {gallery.title}
            </h1>

            <p className="text-sm sm:text-base font-serif italic text-neutral-600 leading-relaxed max-w-xl">
              "A study in light, architectural stillness, and unspoken devotion along the Italian lakeshore."
            </p>

            <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-neutral-500 pt-2">
              <span className="text-neutral-800 font-medium">{gallery.clientName}</span>
              <span>—</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                {gallery.eventDate}
              </span>
              <span>—</span>
              <span>{gallery.media.length} Archival Plates</span>
            </div>

            {/* Quick Action: Start Exhibition Slideshow */}
            <div className="pt-4 flex items-center gap-3">
              {onStartSlideshow && (
                <button
                  onClick={() => onStartSlideshow(0)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-800 hover:bg-neutral-900 hover:text-white text-neutral-900 font-mono text-xs uppercase tracking-wider transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Exhibition Slideshow</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── MUSEUM GALLERY WALL WITH PASSE-PARTOUT FRAMING ─── */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 py-16 sm:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-14">
          {gallery.media.map((item, idx) => {
            const isSelected = selectedMediaIds.has(item.id);
            const isFav = item.isFavorite;

            return (
              <div
                key={item.id}
                className={`group flex flex-col justify-between bg-white p-4 sm:p-5 rounded-sm border transition-all duration-300 ${
                  isSelected
                    ? 'border-neutral-900 ring-2 ring-neutral-900/20 shadow-lg'
                    : 'border-neutral-200/80 hover:border-neutral-300 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Passe-Partout Mat Frame & Image Container */}
                <div
                  className="relative bg-[#F4F4F1] p-3 border border-neutral-100 aspect-[3/4] overflow-hidden cursor-pointer flex items-center justify-center"
                  onClick={() => onOpenLightbox(idx)}
                >
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                  />

                  {/* Multi-Select Checkbox Top-Left */}
                  {onToggleSelectMedia && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectMedia(item.id);
                      }}
                      className={`absolute top-5 left-5 z-20 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-neutral-900 border-neutral-900 text-white scale-110 shadow-md'
                          : 'bg-white/90 border-neutral-300 text-neutral-600 opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-white'
                      }`}
                      title={isSelected ? 'Deselect plate' : 'Select plate'}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <div className="w-2 h-2 rounded-full border border-neutral-400" />
                      )}
                    </button>
                  )}

                  {/* Favorite Heart Top-Right */}
                  {onToggleFavorite && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      className={`absolute top-5 right-5 z-20 p-2 rounded-full backdrop-blur-sm transition-all ${
                        isFav
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-white/90 text-neutral-600 opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-white'
                      }`}
                      title="Favorite"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Archival Plate Metadata Label */}
                <div className="pt-4 flex items-baseline justify-between text-[11px] font-mono text-neutral-500">
                  <div className="truncate pr-3">
                    <span className="text-neutral-900 font-medium uppercase tracking-wider block truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">
                      {item.sizeMB} MB • Archival Grade
                    </span>
                  </div>

                  <span className="shrink-0 text-neutral-400 font-semibold">
                    Plate {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-16 text-center text-xs text-neutral-400 font-mono space-y-2">
        <p>Ex Studio Fine Art Monograph MMXXVI</p>
        <p>Documented in 35mm sensor format • Preserved in high resolution</p>
      </footer>
    </div>
  );
};
