import React from 'react';
import type { Gallery } from '../../types';
import {
  Film,
  Sparkles,
  Download,
  Heart,
  Play,
  Check,
  Calendar,
  MapPin,
  Camera,
  Maximize2,
} from 'lucide-react';

interface EditorialLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
  selectedMediaIds?: Set<string>;
  onToggleSelectMedia?: (mediaId: string) => void;
  onStartSlideshow?: (startIndex?: number) => void;
}

export const EditorialLayout: React.FC<EditorialLayoutProps> = ({
  gallery,
  onOpenLightbox,
  onToggleFavorite,
  selectedMediaIds = new Set(),
  onToggleSelectMedia,
  onStartSlideshow,
}) => {
  const media = gallery.media;

  return (
    <div className="bg-[#FAF8F5] text-[#1C1917] min-h-screen selection:bg-amber-900 selection:text-white font-sans antialiased">
      {/* ─── LUXURY EDITORIAL MAGAZINE HERO BANNER ─── */}
      <header className="relative border-b border-neutral-200/80 overflow-hidden">
        {/* Subtle Ambient Background Wash */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-100/40 via-rose-50/20 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-12 pb-16">
          {/* Magazine Masthead Line */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-y border-neutral-300 py-3 text-[11px] uppercase tracking-[0.3em] text-neutral-500 font-medium gap-2">
            <span className="flex items-center gap-1.5 font-serif font-bold text-neutral-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Ex Studio Private Press
            </span>
            <span className="font-mono text-[10px] text-amber-800 font-semibold tracking-widest bg-amber-100/70 px-2.5 py-0.5 rounded-full">
              Vol. MMXXVI • Editorial Wedding Edition
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-neutral-400" />
              {gallery.eventDate}
            </span>
          </div>

          {/* Editorial Headline & Vows Callout */}
          <div className="my-14 sm:my-20 text-center max-w-4xl mx-auto space-y-6">
            <span className="text-[11px] font-mono tracking-[0.35em] text-amber-800 uppercase font-semibold block">
              The Wedding of
            </span>

            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-normal tracking-tight text-neutral-900 leading-[1.04]">
              {gallery.title}
            </h1>

            <div className="flex items-center justify-center gap-3 text-xs tracking-widest uppercase font-serif text-neutral-600">
              <span>{gallery.clientName}</span>
              <span className="text-amber-600 font-serif">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-700 inline" /> Villa Balbiano, Lake Como
              </span>
            </div>

            <p className="text-sm sm:text-base text-neutral-600 font-serif italic max-w-2xl mx-auto leading-relaxed pt-2">
              "Two souls, one timeless sonnet written beneath golden Italian skies, cypress groves, and silent reverence."
            </p>

            {/* Banner Quick Actions: Play Animated Slideshow */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              {onStartSlideshow && (
                <button
                  onClick={() => onStartSlideshow(0)}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-serif text-xs uppercase tracking-widest shadow-lg shadow-neutral-900/15 transition-all hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-amber-300" />
                  <span>Play Animated Slideshow</span>
                </button>
              )}
            </div>
          </div>

          {/* Grand Magazine Front Cover Spread */}
          <div className="relative w-full aspect-[21/9] max-h-[72vh] min-h-[340px] overflow-hidden rounded-3xl shadow-2xl border-4 border-white cursor-pointer group">
            <img
              src={gallery.coverImage}
              alt={gallery.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
              onClick={() => onOpenLightbox(0)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent pointer-events-none" />

            {/* Select Checkbox on Cover */}
            {onToggleSelectMedia && media[0] && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelectMedia(media[0].id);
                }}
                className={`absolute top-6 left-6 z-20 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                  selectedMediaIds.has(media[0].id)
                    ? 'bg-amber-400 border-amber-400 text-neutral-950 shadow-md scale-110'
                    : 'bg-black/40 border-white/60 text-white hover:bg-black/60 opacity-90 group-hover:opacity-100'
                }`}
                title="Select Photo"
              >
                {selectedMediaIds.has(media[0].id) ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full border border-white/80" />
                )}
              </button>
            )}

            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 block">
                  Cover Study • Fig. 00
                </span>
                <p className="font-serif text-lg sm:text-2xl text-white drop-shadow-md">
                  {media[0]?.title || 'Arrival at Villa Balbiano'}
                </p>
              </div>

              <div
                onClick={() => onOpenLightbox(0)}
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white transition-all text-[11px] font-serif uppercase tracking-wider"
              >
                <Maximize2 className="w-3.5 h-3.5" /> View Large
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── EDITORIAL ASYMMETRIC STORY SPREADS ─── */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 py-16 sm:py-24 space-y-24 sm:space-y-36">
        {/* Story Spread: Pair with Curated Vignette Callout */}
        {media.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-center">
            <div className="md:col-span-7">
              <div className="relative overflow-hidden rounded-3xl bg-white p-3 shadow-xl border border-neutral-200/80 group">
                {onToggleSelectMedia && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelectMedia(media[1].id);
                    }}
                    className={`absolute top-6 left-6 z-20 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                      selectedMediaIds.has(media[1].id)
                        ? 'bg-amber-400 border-amber-400 text-neutral-950 shadow-md scale-110'
                        : 'bg-black/40 border-white/60 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100'
                    }`}
                    title="Select Photo"
                  >
                    {selectedMediaIds.has(media[1].id) ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full border border-white/80" />
                    )}
                  </button>
                )}

                <div
                  className="cursor-pointer overflow-hidden rounded-2xl"
                  onClick={() => onOpenLightbox(1)}
                >
                  <img
                    src={media[1].url}
                    alt={media[1].title}
                    className="w-full h-[520px] sm:h-[620px] object-cover group-hover:scale-103 transition-transform duration-700"
                  />
                </div>

                <div className="p-4 flex items-center justify-between text-xs text-neutral-600">
                  <div>
                    <span className="font-serif italic text-sm text-neutral-800 font-medium">
                      {media[1].title}
                    </span>
                    {media[1].caption && (
                      <p className="text-[11px] text-neutral-500 font-serif mt-0.5">
                        {media[1].caption}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded font-semibold">
                    Fig. 01
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-amber-800 font-bold bg-amber-100/60 px-3 py-1 rounded-full">
                Curated Vignette
              </div>

              <h2 className="text-2xl sm:text-4xl font-serif text-neutral-900 leading-snug">
                Intimate vows captured in the silent grace of morning.
              </h2>

              <p className="text-sm text-neutral-600 font-serif leading-relaxed">
                Captured with natural daylight and 35mm prime optics, documenting authentic emotions,
                delicate handcrafted lace, and unscripted laughter along the lake promenade.
              </p>

              {media.length > 2 && (
                <div className="relative overflow-hidden rounded-2xl bg-white p-2.5 shadow-lg border border-neutral-200 group mt-6">
                  {onToggleSelectMedia && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectMedia(media[2].id);
                      }}
                      className={`absolute top-5 left-5 z-20 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                        selectedMediaIds.has(media[2].id)
                          ? 'bg-amber-400 border-amber-400 text-neutral-950 shadow-md scale-110'
                          : 'bg-black/40 border-white/60 text-white opacity-0 group-hover:opacity-100'
                      }`}
                      title="Select Photo"
                    >
                      {selectedMediaIds.has(media[2].id) ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <div className="w-2 h-2 rounded-full border border-white" />
                      )}
                    </button>
                  )}

                  <div
                    className="cursor-pointer overflow-hidden rounded-xl"
                    onClick={() => onOpenLightbox(2)}
                  >
                    <img
                      src={media[2].url}
                      alt={media[2].title}
                      className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-2.5 text-center text-xs font-serif italic text-neutral-700">
                    {media[2].title}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── COMPLETE WEDDING GALLERY GRID ─── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-4 border-b border-neutral-300 mb-10 gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 font-bold block mb-1">
                Curated Plates
              </span>
              <h3 className="text-xl sm:text-2xl font-serif text-neutral-900">
                The Complete Wedding Collection ({media.length} Photographs)
              </h3>
            </div>
            <span className="text-xs font-serif italic text-neutral-500">
              Select checkboxes to batch download or launch custom slideshow
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {media.map((item, idx) => {
              const isSelected = selectedMediaIds.has(item.id);
              const isFav = item.isFavorite;

              return (
                <div
                  key={item.id}
                  className={`group relative bg-white p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-xl'
                      : 'border-neutral-200/90 hover:border-neutral-300 shadow-md hover:shadow-xl'
                  }`}
                >
                  {/* Photo Container */}
                  <div
                    className="relative overflow-hidden rounded-xl aspect-[4/5] bg-neutral-100 cursor-pointer"
                    onClick={() => onOpenLightbox(idx)}
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Top Corner Select Checkbox */}
                    {onToggleSelectMedia && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelectMedia(item.id);
                        }}
                        className={`absolute top-3 left-3 z-10 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-amber-400 border-amber-400 text-neutral-950 scale-110 shadow-md'
                            : 'bg-neutral-950/40 border-white/60 text-white opacity-80 sm:opacity-0 group-hover:opacity-100'
                        }`}
                        title={isSelected ? 'Deselect photo' : 'Select photo for download/slideshow'}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <div className="w-2 h-2 rounded-full border border-white" />
                        )}
                      </button>
                    )}

                    {/* Favorite Button */}
                    {onToggleFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item.id);
                        }}
                        className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all ${
                          isFav
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-neutral-950/40 hover:bg-neutral-950/70 text-white opacity-80 sm:opacity-0 group-hover:opacity-100'
                        }`}
                        title="Star photo"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    )}

                    {/* Quick Lightbox Expand Icon on Hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="px-3 py-1.5 rounded-full bg-white/90 text-neutral-950 font-serif text-[11px] tracking-wider uppercase shadow-lg">
                        View Photo
                      </span>
                    </div>
                  </div>

                  {/* Photo Editorial Caption */}
                  <div className="pt-3 px-1 flex items-baseline justify-between text-xs">
                    <div className="truncate pr-2">
                      <p className="font-serif italic text-neutral-800 truncate font-medium">
                        {item.title}
                      </p>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {item.sizeMB} MB • 35mm
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-800 shrink-0 font-semibold">
                      #{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Editorial Colophon / Footer */}
      <footer className="border-t border-neutral-300 py-16 bg-[#F4F1EC] text-center space-y-3">
        <span className="text-[11px] font-serif uppercase tracking-[0.25em] text-neutral-500 font-semibold block">
          Villa Balbiano Editorial Monograph • MMXXVI
        </span>
        <p className="text-xs font-serif italic text-neutral-400 max-w-md mx-auto">
          "Archived for perpetuity in museum-grade resolution by Ex Studio."
        </p>
      </footer>
    </div>
  );
};
