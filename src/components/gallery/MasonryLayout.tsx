import React, { useState } from 'react';
import type { Gallery } from '../../types';
import {
  Heart,
  Play,
  Check,
  Sparkles,
  Calendar,
  MapPin,
  Tag,
  Filter,
  Layers,
  ZoomIn,
} from 'lucide-react';

interface MasonryLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
  selectedMediaIds?: Set<string>;
  onToggleSelectMedia?: (mediaId: string) => void;
  onStartSlideshow?: (startIndex?: number) => void;
}

export const MasonryLayout: React.FC<MasonryLayoutProps> = ({
  gallery,
  onOpenLightbox,
  onToggleFavorite,
  selectedMediaIds = new Set(),
  onToggleSelectMedia,
  onStartSlideshow,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'portraits' | 'details' | 'favorites'>('all');

  // Filter categorization based on titles or tags
  const filteredMedia = gallery.media.filter((item) => {
    if (activeFilter === 'favorites') return item.isFavorite;
    if (activeFilter === 'portraits') {
      const lower = (item.title + ' ' + (item.caption || '')).toLowerCase();
      return lower.includes('veil') || lower.includes('portrait') || lower.includes('arrival') || lower.includes('vow');
    }
    if (activeFilter === 'details') {
      const lower = (item.title + ' ' + (item.caption || '')).toLowerCase();
      return lower.includes('table') || lower.includes('lace') || lower.includes('ring') || lower.includes('garden') || lower.includes('flower');
    }
    return true;
  });

  return (
    <div className="bg-[#0C1311] text-neutral-100 min-h-screen selection:bg-emerald-800 selection:text-white font-sans antialiased">
      {/* ─── BOTANICAL GARDEN ROMANCE HERO BANNER ─── */}
      <header className="relative border-b border-emerald-950/80 overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 bg-radial from-emerald-950/40 via-[#0C1311] to-[#0C1311] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-12 pt-14 pb-14">
          {/* Couple Monogram Crest */}
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="w-14 h-14 rounded-full border border-emerald-500/30 bg-emerald-950/60 flex items-center justify-center text-emerald-300 font-serif text-lg tracking-widest shadow-inner shadow-emerald-500/20">
              <span>E & J</span>
            </div>

            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/40 text-emerald-300 text-[11px] font-mono uppercase tracking-[0.25em]">
                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                Garden Romance Masonry Exhibition
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-normal tracking-tight text-white leading-tight">
                {gallery.title}
              </h1>

              <p className="text-sm sm:text-base text-emerald-200/70 font-serif italic max-w-xl mx-auto">
                "Amidst hundred-year-old olive groves and glistening lake waters, a celebration carved into memory."
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-neutral-400 pt-2">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  {gallery.eventDate}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Villa Balbiano, Lake Como
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">
                  {gallery.media.length} Master Plates
                </span>
              </div>
            </div>

            {/* Quick Actions in Banner */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              {onStartSlideshow && (
                <button
                  onClick={() => onStartSlideshow(0)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Garden Slideshow</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Pills & Selection Counter Sub-bar */}
        <div className="border-t border-emerald-950 bg-[#090F0D]/90 backdrop-blur-md px-6 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mr-2 flex items-center gap-1">
                <Filter className="w-3 h-3 text-emerald-400" /> Filter:
              </span>

              {[
                { id: 'all', label: `All (${gallery.media.length})` },
                { id: 'portraits', label: 'Portraits & Vows' },
                { id: 'details', label: 'Styling & Details' },
                { id: 'favorites', label: `Starred (${gallery.media.filter((m) => m.isFavorite).length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all shrink-0 ${
                    activeFilter === tab.id
                      ? 'bg-emerald-500 text-neutral-950 font-bold shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-xs font-mono text-neutral-400 hidden md:block">
              {selectedMediaIds.size > 0 ? (
                <span className="text-emerald-300 font-semibold">
                  {selectedMediaIds.size} photo{selectedMediaIds.size > 1 ? 's' : ''} checked for actions
                </span>
              ) : (
                <span>Tap checkbox to select photos</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── FLUID PINTEREST-STYLE MASONRY WATERFALL GRID ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {filteredMedia.map((item) => {
            const originalIndex = gallery.media.findIndex((m) => m.id === item.id);
            const isSelected = selectedMediaIds.has(item.id);
            const isFav = item.isFavorite;

            return (
              <div
                key={item.id}
                className={`break-inside-avoid relative rounded-2xl overflow-hidden group bg-neutral-900/60 border transition-all duration-300 ${
                  isSelected
                    ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-xl shadow-emerald-950/50'
                    : 'border-emerald-950/80 hover:border-emerald-700/60 shadow-lg'
                }`}
              >
                {/* Photo Image */}
                <div
                  className="relative overflow-hidden cursor-pointer"
                  onClick={() => onOpenLightbox(originalIndex >= 0 ? originalIndex : 0)}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-auto object-cover group-hover:scale-104 transition-transform duration-700 ease-out"
                  />

                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Checkbox for Multi-Select in Top-Left */}
                  {onToggleSelectMedia && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectMedia(item.id);
                      }}
                      className={`absolute top-3 left-3 z-20 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-400 border-emerald-400 text-neutral-950 scale-110 shadow-lg'
                          : 'bg-neutral-950/60 border-white/60 text-white opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105'
                      }`}
                      title={isSelected ? 'Deselect photo' : 'Select photo'}
                    >
                      {isSelected ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <div className="w-2 h-2 rounded-full border border-white" />
                      )}
                    </button>
                  )}

                  {/* Favorite Heart Button in Top-Right */}
                  {onToggleFavorite && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md transition-all ${
                        isFav
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-neutral-950/60 text-white opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-neutral-900'
                      }`}
                      title="Favorite"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  )}

                  {/* Hover Details Card Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs">
                    <p className="font-serif text-white font-medium text-sm leading-snug">
                      {item.title}
                    </p>
                    {item.caption && (
                      <p className="text-[11px] text-neutral-300 font-serif italic mt-0.5 line-clamp-2">
                        {item.caption}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300 mt-2">
                      <span>{item.sizeMB} MB</span>
                      <span className="flex items-center gap-1 text-white">
                        <ZoomIn className="w-3 h-3" /> Click to enlarge
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-card label */}
                <div className="p-3 bg-neutral-950/80 border-t border-emerald-950/60 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                  <span className="truncate pr-2">{item.title}</span>
                  <span className="text-emerald-400 font-semibold shrink-0">
                    {item.aspectRatio > 1 ? 'Landscape' : 'Portrait'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-950 py-14 text-center text-xs text-neutral-500 font-mono space-y-2">
        <p className="text-emerald-400/80">Ex Studio Botanical Masonry Edition</p>
        <p>© MMXXVI All rights reserved.</p>
      </footer>
    </div>
  );
};
