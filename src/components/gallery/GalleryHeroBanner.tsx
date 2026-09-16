import React from 'react';
import { ArrowDown, Film } from 'lucide-react';

export type GalleryHeroTemplate = 'editorial' | 'masonry' | 'cinematic' | 'minimal';

export interface GalleryHeroBannerProps {
  template: GalleryHeroTemplate;
  title: string;
  shootDate?: string;
  coverImage?: string;
  additionalImages?: string[];
  className?: string;
}

/**
 * Formats shoot date string cleanly (e.g. '2026-08-14' -> 'JULY 22, 2026')
 */
export const formatHeroShootDate = (dateStr?: string): string => {
  if (!dateStr) return 'JULY 22, 2026';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).toUpperCase();
    }
  } catch { }
  return String(dateStr).toUpperCase();
};

/**
 * Reusable Gallery Hero Banner Component
 * 4 completely distinct, stunning, and unique layouts:
 * 1. Editorial: Haute-Couture Vogue Full-Bleed Cover (Preserved)
 * 2. Masonry: Multi-Photo Botanical Mosaic Cluster Spread
 * 3. Cinematic: 2.39:1 Anamorphic IMAX Cinema Screen with Ambient Flare
 * 4. Minimal: 50/50 Scandinavian Museum Wall Exhibition Split
 */
export const GalleryHeroBanner: React.FC<GalleryHeroBannerProps> = ({
  template,
  title,
  shootDate,
  coverImage = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
  additionalImages = [],
  className = '',
}) => {
  const formattedDate = formatHeroShootDate(shootDate);

  // Fallback images for multi-image layouts
  const img2 = additionalImages[0] || 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80';
  const img3 = additionalImages[1] || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80';
  const img4 = additionalImages[2] || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80';

  // ─────────────────────────────────────────────────────────────
  // 1. EDITORIAL TEMPLATE HERO (Haute-Couture Vogue Magazine Edition - UNTOUCHED)
  // ─────────────────────────────────────────────────────────────
  if (template === 'editorial') {
    return (
      <header
        className={`relative w-full h-[100dvh] min-h-[580px] overflow-hidden flex items-center justify-center select-none text-white ${className}`}
      >
        <div className="absolute inset-0 z-0">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover animate-kenburns scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/80 pointer-events-none" />
        </div>

        {/* Centerpiece Typography */}
        <div className="relative z-20 max-w-5xl mx-auto px-6 sm:px-12 text-center space-y-4 sm:space-y-6 animate-editorial-hero">
          <div className="flex items-center justify-center gap-3 sm:gap-5 text-amber-200/90">
            <span className="h-px w-8 sm:w-16 bg-amber-200/60" />
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.35em] sm:tracking-[0.45em] font-medium">
              SHOOT DATE • {formattedDate}
            </span>
            <span className="h-px w-8 sm:w-16 bg-amber-200/60" />
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-light tracking-tight text-white leading-[1.02] drop-shadow-2xl">
            {title}
          </h1>

          <div className="-mt-1 sm:-mt-2">
            <span className="font-script text-3xl sm:text-5xl md:text-6xl text-amber-200/90 font-normal drop-shadow-lg tracking-wide">
              Atelier Series
            </span>
          </div>
        </div>

        {/* Subtle Bottom Prompt */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/60 pointer-events-none">
          <span className="text-[9px] font-mono tracking-[0.3em] uppercase">Scroll to explore</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
        </div>
      </header>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. MASONRY TEMPLATE HERO (Botanical 4-Photo Curated Mosaic Spread - Screen Fitted)
  // ─────────────────────────────────────────────────────────────
  if (template === 'masonry') {
    return (
      <header
        className={`w-full h-[100dvh] max-h-[100dvh] bg-[#09110E] text-white py-3 sm:py-5 px-4 sm:px-8 border-b border-emerald-950/80 relative overflow-hidden select-none flex flex-col justify-center items-center ${className}`}
      >
        {/* Soft Ambient Botanical Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl xl:max-w-7xl w-full flex flex-col items-center justify-center relative z-10">
          {/* Curated 4-Photo Organic Mosaic: Fills ~72% of viewport height with minimal top/bottom gap */}
          <div className="w-full h-[72vh] max-h-[580px] grid grid-cols-12 gap-2 sm:gap-3">
            {/* Slot 1: Left Main Vertical Focal Photo (5 cols) */}
            <div className="col-span-5 h-full relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-emerald-500/30 group">
              <img
                src={coverImage}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09110E]/40 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Middle: Stack of 2 Detail Photos (Slots 2 & 3, 4 cols) */}
            <div className="col-span-4 h-full flex flex-col gap-2 sm:gap-3">
              <div className="flex-1 w-full relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border border-emerald-900/50 group">
                <img
                  src={img2}
                  alt="Detail Still 1"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
              <div className="flex-1 w-full relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border border-emerald-900/50 group">
                <img
                  src={img3}
                  alt="Detail Still 2"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            </div>

            {/* Slot 4: Right Vertical Accent Photo (3 cols) */}
            <div className="col-span-3 h-full relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border border-emerald-900/50 group">
              <img
                src={img4}
                alt="Atmosphere Accent"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09110E]/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Organic Title & Date Header Underneath: Compact and neat */}
          <div className="text-center space-y-1 pt-2 sm:pt-3">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif italic text-white tracking-tight leading-tight drop-shadow-md">
              {title}
            </h1>
            <div className="flex items-center justify-center gap-3 text-emerald-400/80">
              <span className="h-px w-10 bg-emerald-800/60" />
              <span className="text-[11px] sm:text-xs font-mono tracking-[0.25em] uppercase text-emerald-400 font-medium">
                {formattedDate}
              </span>
              <span className="h-px w-10 bg-emerald-800/60" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. CINEMATIC TEMPLATE HERO (2.39:1 Anamorphic IMAX Cinema Screen - Screen Fitted)
  // ─────────────────────────────────────────────────────────────
  if (template === 'cinematic') {
    return (
      <header
        className={`w-full h-[100dvh] max-h-[100dvh] bg-[#050507] text-white py-4 sm:py-6 px-4 sm:px-8 border-b border-neutral-900 select-none flex flex-col justify-center items-center relative overflow-hidden ${className}`}
      >
        <div className="max-w-6xl xl:max-w-7xl w-full flex flex-col items-center justify-center relative z-10">
          {/* Floating 2.39:1 Cinema Screen Container: Controlled height to fit screen */}
          <div className="relative w-full h-[65vh] max-h-[500px]">
            {/* Ambient Golden Amber Flare behind the screen */}
            <div className="absolute -inset-3 sm:-inset-6 bg-amber-500/15 rounded-3xl blur-2xl pointer-events-none" />

            {/* Anamorphic Cinema Screen Frame */}
            <div className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-black bg-black border border-amber-500/35 ring-1 ring-amber-400/20 group">
              <img
                src={coverImage}
                alt={title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
              />

              {/* Anamorphic Lens Flare Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-amber-500/10 pointer-events-none" />

              {/* Top Film Timecode HUD */}
              <div className="absolute top-3 left-4 z-10 flex items-center gap-2 text-[10px] sm:text-xs font-mono tracking-[0.25em] text-amber-400 bg-black/75 backdrop-blur-md px-3 py-1 rounded-md border border-amber-500/30 shadow-lg">
                <Film className="w-3.5 h-3.5 text-amber-400" />
                <span>2.39:1 ANAMORPHIC MASTER</span>
              </div>
            </div>
          </div>

          {/* Grand Cinema Title & Date Underneath Screen: Compact and fit within viewport */}
          <div className="text-center space-y-1.5 pt-3 sm:pt-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif tracking-widest text-white uppercase drop-shadow-2xl leading-tight font-normal">
              {title}
            </h1>
            <div className="flex items-center justify-center gap-3 text-amber-400/80">
              <span className="h-px w-10 bg-amber-800/60" />
              <span className="text-[11px] sm:text-xs font-mono tracking-[0.35em] uppercase text-amber-400 font-semibold">
                // {formattedDate} //
              </span>
              <span className="h-px w-10 bg-amber-800/60" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4. MINIMAL TEMPLATE HERO (Scandinavian 50/50 Museum Wall Split - Screen Fitted)
  // ─────────────────────────────────────────────────────────────
  return (
    <header
      className={`w-full h-[100dvh] max-h-[100dvh] bg-[#F8F8F6] text-neutral-900 py-3 sm:py-5 px-6 sm:px-12 border-b border-neutral-200/80 select-none flex items-center justify-center overflow-hidden ${className}`}
    >
      <div className="max-w-6xl xl:max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Left Column: Framed Archival Print (Fills ~80% of screen height) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="p-3 sm:p-4 bg-white shadow-2xl border border-neutral-200/90 w-full max-w-xl h-[76vh] sm:h-[80vh] max-h-[620px] relative overflow-hidden group">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
            />
          </div>
        </div>

        {/* Right Column: Serene Architectural Typography */}
        <div className="lg:col-span-5 space-y-4 text-left">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-mono tracking-[0.3em] uppercase text-neutral-400">
            <span className="h-px w-10 bg-neutral-400" />
            <span>EXHIBITION MONOGRAPH</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-neutral-900 leading-[1.05] font-serif">
            {title}
          </h1>

          <div className="pt-2">
            <span className="text-xs sm:text-sm font-mono tracking-[0.25em] uppercase text-neutral-500 font-medium">
              — {formattedDate} —
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
