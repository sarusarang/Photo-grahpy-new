import React from 'react';
import type { Gallery, MediaItem } from '../../types';
import { Film, Sparkles, Download, Heart } from 'lucide-react';

interface EditorialLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
}

export const EditorialLayout: React.FC<EditorialLayoutProps> = ({
  gallery,
  onOpenLightbox,
  onToggleFavorite,
}) => {
  const media = gallery.media;

  return (
    <div className="bg-[#fcfbf9] text-[#1c1917] min-h-screen selection:bg-neutral-900 selection:text-white">
      {/* Editorial Cover / Hero Spread */}
      <header className="relative min-h-[90vh] flex flex-col justify-between p-6 sm:p-12 lg:p-16 border-b border-neutral-200">
        <div className="flex items-center justify-between text-xs tracking-[0.25em] uppercase text-neutral-500 font-medium">
          <span>{gallery.clientName}</span>
          <span>Vol. MMXXVI • Editorial Issue</span>
          <span>{gallery.eventDate}</span>
        </div>

        <div className="my-12 text-center max-w-4xl mx-auto">
          <span className="text-[11px] font-mono tracking-widest text-amber-700 uppercase mb-3 inline-block">
            Special Photography Edition
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-normal tracking-tight text-neutral-900 leading-[1.08]">
            {gallery.title}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-serif italic mt-6 max-w-xl mx-auto">
            "Every frame a lingering sonnet written by sun, shadow, and silent reverence."
          </p>
        </div>

        <div className="relative w-full aspect-[21/9] max-h-[70vh] overflow-hidden rounded-2xl shadow-xl cursor-pointer group"
          onClick={() => onOpenLightbox(0)}
        >
          <img
            src={gallery.coverImage}
            alt={gallery.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white text-xs tracking-wider uppercase font-medium">
            <span>Cover Study No. 01</span>
            <span className="underline underline-offset-4 group-hover:text-amber-200 transition-colors">
              Click to Expand Cover
            </span>
          </div>
        </div>
      </header>

      {/* Editorial Asymmetric Magazine Flow */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 py-20 sm:py-32 space-y-28 sm:space-y-40">
        {/* Story Spread 1: Asymmetric Pair */}
        {media.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-center">
            <div className="md:col-span-7">
              <div
                className="relative overflow-hidden rounded-2xl shadow-lg cursor-pointer group"
                onClick={() => onOpenLightbox(1)}
              >
                <img
                  src={media[1].url}
                  alt={media[1].title}
                  className="w-full h-[650px] object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="p-4 bg-white/95 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
                  <span className="font-serif italic">{media[1].title}</span>
                  <span className="text-[10px] font-mono text-neutral-400">Fig. 02</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 space-y-6">
              <span className="text-xs uppercase tracking-[0.2em] text-neutral-400 font-medium">
                Curated Vignette
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-neutral-900 leading-snug">
                Intimacy captured within the quietest intervals.
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Shot on 35mm and medium format digital sensor, emphasizing authentic textures,
                natural daylight, and subtle gestures often overlooked.
              </p>
              {media.length > 2 && (
                <div
                  className="relative overflow-hidden rounded-xl shadow-md cursor-pointer group mt-8"
                  onClick={() => onOpenLightbox(2)}
                >
                  <img
                    src={media[2].url}
                    alt={media[2].title}
                    className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="p-3 bg-white text-[11px] font-serif italic text-neutral-600 text-center">
                    {media[2].title}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Video Feature Highlight if available */}
        {media.some((m) => m.type === 'video') && (
          <div className="p-8 sm:p-14 rounded-3xl bg-neutral-900 text-white text-center space-y-6 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 text-amber-400 text-xs font-mono uppercase tracking-widest">
              <Film className="w-3.5 h-3.5" /> 4K Motion Vignette
            </div>
            <h3 className="text-3xl sm:text-4xl font-serif">Motion Picture Highlights</h3>
            <p className="text-sm text-neutral-400 max-w-xl mx-auto">
              A cinematic highlight reel accompanied by acoustic chamber recordings.
            </p>
            <div className="max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-neutral-800">
              {(() => {
                const vid = media.find((m) => m.type === 'video')!;
                return (
                  <video
                    src={vid.url}
                    poster={vid.thumbnailUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                );
              })()}
            </div>
          </div>
        )}

        {/* Full Gallery Grid in Editorial Magazine 3-column / 2-column alternating cadence */}
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-neutral-300 mb-12">
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-neutral-500">
              The Complete Collection ({media.length} Photographs)
            </h3>
            <span className="text-xs font-serif italic text-neutral-400">Click any photograph to view high-res</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            {media.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onOpenLightbox(idx)}
                className="group cursor-pointer flex flex-col justify-between"
              >
                <div className="relative overflow-hidden rounded-xl bg-neutral-200 aspect-[4/5] shadow-sm group-hover:shadow-xl transition-all">
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  {item.type === 'video' && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] flex items-center gap-1 font-mono">
                      <Film className="w-3 h-3 text-amber-400" /> Video
                    </div>
                  )}
                  {onToggleFavorite && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      className={`absolute top-3 right-3 p-2 rounded-full transition-all ${
                        item.isFavorite
                          ? 'bg-rose-500 text-white opacity-100'
                          : 'bg-white/80 hover:bg-white text-neutral-700 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>
                <div className="mt-3 flex items-baseline justify-between text-xs">
                  <span className="font-serif italic text-neutral-800 truncate pr-2">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    No. {(idx + 1).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Editorial Colophon */}
      <footer className="border-t border-neutral-200 py-16 text-center text-xs text-neutral-500 space-y-2">
        <p className="uppercase tracking-[0.3em] font-medium text-neutral-800">
          Photographed with reverence for {gallery.clientName}
        </p>
        <p className="font-serif italic">Curated & delivered in master 300 DPI resolution</p>
      </footer>
    </div>
  );
};
