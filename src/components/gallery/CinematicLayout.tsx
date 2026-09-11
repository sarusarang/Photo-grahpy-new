import React from 'react';
import type { Gallery } from '../../types';
import {
  Film,
  Play,
  ChevronDown,
  Heart,
  Check,
  Sparkles,
  Clapperboard,
  Maximize2,
  Tv,
} from 'lucide-react';

interface CinematicLayoutProps {
  gallery: Gallery;
  onOpenLightbox: (index: number) => void;
  onToggleFavorite?: (mediaId: string) => void;
  selectedMediaIds?: Set<string>;
  onToggleSelectMedia?: (mediaId: string) => void;
  onStartSlideshow?: (startIndex?: number) => void;
}

export const CinematicLayout: React.FC<CinematicLayoutProps> = ({
  gallery,
  onOpenLightbox,
  onToggleFavorite,
  selectedMediaIds = new Set(),
  onToggleSelectMedia,
  onStartSlideshow,
}) => {
  const media = gallery.media;
  const videos = media.filter((m) => m.type === 'video');

  // Split media into 3 cinematic narrative acts
  const act1Media = media.slice(0, Math.ceil(media.length / 3));
  const act2Media = media.slice(Math.ceil(media.length / 3), Math.ceil((media.length * 2) / 3));
  const act3Media = media.slice(Math.ceil((media.length * 2) / 3));

  const acts = [
    {
      act: 'Act I',
      title: 'The Preparations & Morning Light',
      desc: 'Silent moments before vows, delicate lace, and the tranquil arrival by wooden boat.',
      items: act1Media,
    },
    {
      act: 'Act II',
      title: 'The Sacred Exchange & Golden Promenade',
      desc: 'Vows whispered under centurial cypresses overlooking the sparkling lake waters.',
      items: act2Media,
    },
    {
      act: 'Act III',
      title: 'The Candlelit Banquet & Midnight Revelry',
      desc: 'Tuscan wine, terracotta tables, unscripted toasts, and dancing under the stars.',
      items: act3Media,
    },
  ];

  return (
    <div className="bg-[#050505] text-neutral-100 min-h-screen selection:bg-amber-500 selection:text-black font-sans antialiased">
      {/* ─── 2.39:1 ANAMORPHIC CINEMATIC HERO MARQUEE ─── */}
      <section className="relative min-h-[95vh] w-full flex items-center justify-center overflow-hidden border-b border-neutral-900">
        {/* Animated breathing background cover */}
        <div className="absolute inset-0">
          <img
            src={gallery.coverImage}
            alt={gallery.title}
            className="w-full h-full object-cover animate-kenburns filter brightness-50 contrast-110"
          />
          {/* Cinema letterbox shadow & dark gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-black/70" />
          <div className="absolute inset-0 film-grain opacity-40 pointer-events-none" />
        </div>

        {/* Film Title Credits Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto space-y-6 pt-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/30 text-[11px] font-mono uppercase tracking-[0.3em] text-amber-300">
            <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
            Ex Studio Cinema Production • 4K DCI
          </div>

          <div className="space-y-3">
            <span className="text-xs sm:text-sm font-mono tracking-[0.4em] uppercase text-neutral-400 block">
              A Feature Wedding Film & Stills Master
            </span>

            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold uppercase tracking-tighter text-white leading-none drop-shadow-2xl">
              {gallery.title}
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 tracking-[0.2em] uppercase font-light max-w-2xl mx-auto pt-2">
              Starring <strong className="text-amber-300 font-semibold">{gallery.clientName}</strong>
              <span className="mx-2 text-neutral-500">•</span>
              Villa Balbiano, Lake Como, Italy
            </p>
          </div>

          {/* Action CTAs: Direct launch into animated slideshow */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-4">
            {onStartSlideshow && (
              <button
                onClick={() => onStartSlideshow(0)}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-neutral-950 font-bold text-xs uppercase tracking-widest transition-all shadow-2xl shadow-amber-500/25 flex items-center gap-3 hover:scale-105"
              >
                <Play className="w-4 h-4 fill-current text-neutral-950" />
                <span>Screen Feature Slideshow</span>
              </button>
            )}

            <button
              onClick={() => onOpenLightbox(0)}
              className="px-6 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-xs uppercase tracking-wider backdrop-blur-md border border-white/20 transition-all"
            >
              Browse Still Archive ({media.length})
            </button>
          </div>

          <div className="pt-6 flex items-center justify-center gap-6 text-[11px] font-mono text-neutral-400">
            <span>Aspect Ratio: 2.39:1 Anamorphic</span>
            <span>•</span>
            <span>Date: {gallery.eventDate}</span>
            <span>•</span>
            <span>Master Cut</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-neutral-400 flex flex-col items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono">
          <span>Scroll For Scene Stills</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-amber-400" />
        </div>
      </section>

      {/* ─── OPTIONAL 4K MOTION TRAILER SCREENING ─── */}
      {videos.length > 0 && (
        <section className="py-16 px-6 sm:px-12 max-w-7xl mx-auto">
          <div className="border border-neutral-800 rounded-3xl p-6 sm:p-10 bg-neutral-900/40 backdrop-blur-md shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5" /> 4K Ultra HD Teaser Reel
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                  {videos[0].title}
                </h3>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                Duration: {videos[0].duration || '02:15'} • Master Grade
              </span>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black border border-neutral-800 relative">
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

      {/* ─── NARRATIVE SCENE CHAPTERS ─── */}
      <main className="py-16 space-y-24 sm:space-y-32">
        {acts.map((act) => {
          if (act.items.length === 0) return null;

          return (
            <section key={act.act} className="max-w-7xl mx-auto px-6 sm:px-12">
              {/* Chapter Header */}
              <div className="border-b border-neutral-800/80 pb-6 mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-[0.3em] text-amber-400 font-bold">
                    {act.act}
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                    {act.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 font-serif italic max-w-xl">
                    "{act.desc}"
                  </p>
                </div>
                <span className="text-xs font-mono text-neutral-500">
                  {act.items.length} Cinematic Stills
                </span>
              </div>

              {/* Cinematic Widescreen Stills Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {act.items.map((item) => {
                  const globalIndex = media.findIndex((m) => m.id === item.id);
                  const isSelected = selectedMediaIds.has(item.id);
                  const isFav = item.isFavorite;

                  return (
                    <div
                      key={item.id}
                      className={`group relative rounded-3xl overflow-hidden bg-neutral-900 border transition-all duration-300 ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-2xl shadow-amber-500/10'
                          : 'border-neutral-800 hover:border-neutral-700 shadow-xl'
                      }`}
                    >
                      {/* 16:10 / 16:9 Cinematic Widescreen Frame */}
                      <div
                        className="relative aspect-[16/10] w-full overflow-hidden cursor-pointer"
                        onClick={() => onOpenLightbox(globalIndex >= 0 ? globalIndex : 0)}
                      >
                        <img
                          src={item.url}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                        />

                        {/* Cinematic Vignette Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/50 opacity-80 group-hover:opacity-60 transition-opacity" />

                        {/* Selection Checkbox */}
                        {onToggleSelectMedia && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSelectMedia(item.id);
                            }}
                            className={`absolute top-4 left-4 z-20 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-amber-400 border-amber-400 text-neutral-950 scale-110 shadow-lg'
                                : 'bg-black/60 border-white/60 text-white opacity-80 sm:opacity-0 group-hover:opacity-100 hover:scale-105'
                            }`}
                            title={isSelected ? 'Deselect still' : 'Select still'}
                          >
                            {isSelected ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full border border-white" />
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
                            className={`absolute top-4 right-4 z-20 p-2.5 rounded-full backdrop-blur-md transition-all ${
                              isFav
                                ? 'bg-rose-500 text-white'
                                : 'bg-black/60 text-white opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-neutral-800'
                            }`}
                            title="Favorite"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                        )}

                        {/* Bottom Overlay Title on Hover */}
                        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between text-white">
                          <div className="max-w-[80%]">
                            <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest block">
                              Scene Still #{globalIndex + 1}
                            </span>
                            <h4 className="text-base sm:text-lg font-bold truncate">
                              {item.title}
                            </h4>
                          </div>

                          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider">
                            <Maximize2 className="w-3 h-3" /> Fullres
                          </div>
                        </div>
                      </div>

                      {/* Technical Film Slate Specs Bar */}
                      <div className="px-5 py-3 bg-neutral-950/90 border-t border-neutral-800/80 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                        <span className="truncate pr-2">
                          {item.caption || 'Captured on 35mm Prime Sensor'}
                        </span>
                        <span className="text-amber-400 shrink-0">{item.sizeMB} MB</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {/* Cinematic End Credits */}
      <footer className="border-t border-neutral-900 py-16 text-center space-y-3 bg-[#030303]">
        <div className="text-xs font-mono uppercase tracking-[0.3em] text-neutral-400">
          The End • Ex Studio Motion & Photography
        </div>
        <p className="text-[11px] text-neutral-500 font-mono">
          All Master Negatives Recorded at Villa Balbiano • Master Grade DCI 4K
        </p>
      </footer>
    </div>
  );
};
