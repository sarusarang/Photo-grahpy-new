import React from 'react';
import type { Gallery } from '../../types';
import { Film, Play, ChevronDown, Heart, ArrowRight } from 'lucide-react';

interface CinematicLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
}

export const CinematicLayout: React.FC<CinematicLayoutProps> = ({
  gallery,
  onOpenLightbox,
  onToggleFavorite,
}) => {
  const media = gallery.media;
  const videos = media.filter((m) => m.type === 'video');

  return (
    <div className="bg-[#080808] text-neutral-100 min-h-screen selection:bg-amber-500 selection:text-black">
      {/* Full-bleed Immersive Hero Header */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={gallery.coverImage}
            alt={gallery.title}
            className="w-full h-full object-cover scale-105 filter brightness-60 contrast-110 animate-pulse duration-[10000ms]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-black/40 to-black/60" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto space-y-6">
          <span className="px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-mono uppercase tracking-[0.3em] text-amber-300 border border-white/10 inline-block">
            Cinematic Feature Film & Stills
          </span>
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold uppercase tracking-tighter text-white leading-none">
            {gallery.title}
          </h1>
          <p className="text-base sm:text-lg text-neutral-300 tracking-widest uppercase font-light max-w-xl mx-auto">
            Starring {gallery.clientName} • Captured in 4K DCI & Ultra 35mm
          </p>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onOpenLightbox(0)}
              className="px-8 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2 hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" /> Begin Feature Screening
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-neutral-500 flex flex-col items-center gap-2 text-xs uppercase tracking-widest font-mono">
          <span>Scroll to Explore Narrative</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </div>
      </section>

      {/* Featured Video Screen if available */}
      {videos.length > 0 && (
        <section className="py-20 px-6 sm:px-12 max-w-7xl mx-auto">
          <div className="border border-neutral-800 rounded-3xl p-6 sm:p-12 bg-neutral-900/40 backdrop-blur-md">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
                  Highlight Reel
                </span>
                <h3 className="text-3xl font-bold text-white mt-1">{videos[0].title}</h3>
              </div>
              <span className="text-xs text-neutral-400 font-mono">4K Ultra HD • Master Grade</span>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black border border-neutral-800 relative group">
              <video
                src={videos[0].url}
                poster={videos[0].thumbnailUrl}
                controls
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Horizontal / Large Story Sequences */}
      <section className="py-20 space-y-24 sm:space-y-36">
        {media.map((item, idx) => (
          <div key={item.id} className="max-w-6xl mx-auto px-6 sm:px-12">
            <div
              onClick={() => onOpenLightbox(idx)}
              className="group cursor-pointer relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800/80 shadow-2xl"
            >
              <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full overflow-hidden">
                <img
                  src={item.url}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
              </div>

              <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                    Scene Sequence {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mt-1">
                    {item.title}
                  </h2>
                  {item.caption && (
                    <p className="text-sm text-neutral-400 mt-2 max-w-xl">{item.caption}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {onToggleFavorite && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      className={`p-3 rounded-full border transition-all ${
                        item.isFavorite
                          ? 'bg-rose-500 border-rose-500 text-white'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  )}

                  <div className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 group-hover:bg-amber-400 group-hover:text-black group-hover:border-amber-400 transition-all">
                    <span>Fullscreen</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <footer className="border-t border-neutral-900 py-16 text-center text-xs text-neutral-500 uppercase tracking-[0.25em]">
        <p>A Cinematic Documentation for {gallery.clientName}</p>
      </footer>
    </div>
  );
};
